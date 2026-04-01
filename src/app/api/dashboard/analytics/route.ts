// src/app/api/dashboard/analytics/route.ts
// Analytics endpoint with cached dashboard statistics
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { formatApiError, formatApiSuccess } from '@/lib/validations';
import { cacheGet, cacheSet } from '@/lib/redis';

const CACHE_KEY = 'dashboard-analytics';
const CACHE_TTL = 120; // 2 minutes

interface AnalyticsResult {
  stageDistribution: { stage: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  avgComplexityOverTime: { date: Date; complexity: number }[];
  conversionRate: { won: number; total: number; rate: number };
  estimatedPipeline: { min: number; max: number };
  totalBriefs: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        formatApiError('UNAUTHENTICATED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Check cache
    const cached = await cacheGet<AnalyticsResult>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(formatApiSuccess(cached));
    }

    // Stage distribution
    const stageCounts = await prisma.brief.groupBy({
      by: ['stage'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const stageDistribution = stageCounts.map(s => ({
      stage: s.stage,
      count: s._count.id,
    }));

    // Category distribution (from AI analysis)
    const categoryCounts = await prisma.aIAnalysis.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { status: 'COMPLETED' },
      orderBy: { _count: { id: 'desc' } },
    });

    const categoryDistribution = categoryCounts.map(c => ({
      category: c.category,
      count: c._count.id,
    }));

    // Average complexity over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analysesByDay = await prisma.aIAnalysis.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      select: {
        complexityScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date and calculate average
    const complexityByDate = new Map<string, { total: number; count: number }>();
    analysesByDay.forEach(a => {
      const dateKey = a.createdAt.toISOString().split('T')[0];
      const existing = complexityByDate.get(dateKey) || { total: 0, count: 0 };
      complexityByDate.set(dateKey, {
        total: existing.total + a.complexityScore,
        count: existing.count + 1,
      });
    });

    const avgComplexityOverTime = Array.from(complexityByDate.entries()).map(([date, data]) => ({
      date: new Date(date),
      complexity: Math.round((data.total / data.count) * 100) / 100,
    }));

    // Conversion rate
    const totalBriefs = await prisma.brief.count();
    const wonBriefs = await prisma.brief.count({ where: { stage: 'WON' } });
    const conversionRate = {
      won: wonBriefs,
      total: totalBriefs,
      rate: totalBriefs > 0 ? Math.round((wonBriefs / totalBriefs) * 10000) / 100 : 0,
    };

    // Estimated pipeline value (sum of budget ranges for active briefs)
    const budgetRanges: Record<string, { min: number; max: number }> = {
      UNDER_5K: { min: 0, max: 5000 },
      FIVE_TO_10K: { min: 5000, max: 10000 },
      TEN_TO_25K: { min: 10000, max: 25000 },
      TWENTY_FIVE_TO_50K: { min: 25000, max: 50000 },
      FIFTY_TO_100K: { min: 50000, max: 100000 },
      OVER_100K: { min: 100000, max: 200000 },
    };

    const activeBriefs = await prisma.brief.findMany({
      where: { stage: { notIn: ['ARCHIVED', 'WON'] } },
      select: { budgetRange: true },
    });

    let pipelineMin = 0;
    let pipelineMax = 0;
    activeBriefs.forEach(b => {
      const range = budgetRanges[b.budgetRange];
      if (range) {
        pipelineMin += range.min;
        pipelineMax += range.max;
      }
    });

    const result: AnalyticsResult = {
      stageDistribution,
      categoryDistribution,
      avgComplexityOverTime,
      conversionRate,
      estimatedPipeline: { min: pipelineMin, max: pipelineMax },
      totalBriefs,
    };

    // Cache the result
    await cacheSet(CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json(formatApiSuccess(result));
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to fetch analytics'),
      { status: 500 }
    );
  }
}