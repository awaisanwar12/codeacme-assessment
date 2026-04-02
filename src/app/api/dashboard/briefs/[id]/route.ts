// src/app/api/dashboard/briefs/[id]/route.ts
// Brief detail endpoint with full AI analysis and notes
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { formatApiError, formatApiSuccess } from '@/lib/validations';

// GET /api/dashboard/briefs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        formatApiError('UNAUTHENTICATED', 'Authentication required'),
        { status: 401 }
      );
    }

    const briefId = params.id;

    // Reviewers can view all briefs (read-only), admins have full access
    const whereClause = { id: briefId };

    const brief = await prisma.brief.findUnique({
      where: whereClause,
      include: {
        aiAnalysis: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        notes: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
          where: { parentId: null },
        },
        stageEvents: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!brief) {
      return NextResponse.json(
        formatApiError('NOT_FOUND', 'Brief not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(formatApiSuccess(brief));
  } catch (error) {
    console.error('Brief detail error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to fetch brief detail'),
      { status: 500 }
    );
  }
}