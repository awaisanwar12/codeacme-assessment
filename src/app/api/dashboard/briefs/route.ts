// src/app/api/dashboard/briefs/route.ts
// Dashboard brief listing with pagination, filtering, and stage grouping
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { formatApiError, formatApiSuccess } from '@/lib/validations';
import { cacheGet, cacheSet } from '@/lib/redis';

const CACHE_KEY = 'dashboard-briefs-summary';
const CACHE_TTL = 60; // 60 seconds

interface BriefQueryParams {
  stage?: string;
  cursor?: string;
  limit?: string;
}

async function handleGetBriefs(request: NextRequest) {
  try {
    // Check cache for analytics summary
    const cached = await cacheGet<typeof CACHE_KEY>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(formatApiSuccess(cached));
    }

    const { searchParams } = new URL(request.url);
    const params: BriefQueryParams = {
      stage: searchParams.get('stage') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || '20',
    };

    const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20', 10)));

    // Build query filters
    const where: { stage?: "NEW" | "UNDER_REVIEW" | "PROPOSAL_SENT" | "WON" | "ARCHIVED" } = {};
    if (params.stage) {
      where.stage = params.stage as typeof where.stage;
    }

    // Fetch briefs with cursor-based pagination
    const briefs = await prisma.brief.findMany({
      where,
      take: limit + 1, // +1 to determine if there's a next page
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        aiAnalysis: {
          select: {
            id: true,
            category: true,
            complexityScore: true,
            status: true,
            effortMinHours: true,
            effortMaxHours: true,
            confidenceScore: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            notes: true,
            stageEvents: true,
          },
        },
      },
    });

    // Check if there's a next page
    const hasNext = briefs.length > limit;
    const items = hasNext ? briefs.slice(0, -1) : briefs;
    const nextCursor = hasNext ? items[items.length - 1]?.id : undefined;

    // Build stage counts (without pagination filter)
    const stageCounts = await prisma.brief.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    const result = {
      briefs: items.map((b: any) => ({
        id: b.id,
        title: b.title,
        contactName: b.contactName,
        contactEmail: b.contactEmail,
        companyName: b.companyName,
        stage: b.stage,
        urgency: b.urgency,
        budgetRange: b.budgetRange,
        source: b.source,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        aiAnalysis: b.aiAnalysis,
        assignedTo: b.assignedTo,
        notesCount: b._count.notes,
        eventsCount: b._count.stageEvents,
      })),
      pagination: {
        nextCursor,
        hasNext,
        count: items.length,
      },
      stageCounts: stageCounts.reduce((acc: Record<string, number>, s: any) => {
        acc[s.stage] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
    };

    // Cache the result
    await cacheSet(CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json(formatApiSuccess(result));
  } catch (error) {
    console.error('Dashboard briefs error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to fetch briefs'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetBriefs);