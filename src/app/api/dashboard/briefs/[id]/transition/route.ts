// src/app/api/dashboard/briefs/[id]/transition/route.ts
// Stage transition endpoint with audit logging
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { stageTransitionSchema, formatApiError, formatApiSuccess } from '@/lib/validations';
import { cacheInvalidate } from '@/lib/redis';

export async function POST(
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

    // Validate request body
    const body = await request.json();
    const validated = stageTransitionSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        formatApiError('VALIDATION_ERROR', 'Invalid input', validated.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    const { toStage, reason } = validated.data;
    const briefId = params.id;

    // Get current brief
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
    });

    if (!brief) {
      return NextResponse.json(
        formatApiError('NOT_FOUND', 'Brief not found'),
        { status: 404 }
      );
    }

    // Check role-based permissions
    if (user.role !== 'ADMIN' && brief.assignedToId !== user.userId) {
      return NextResponse.json(
        formatApiError('UNAUTHORIZED', 'You can only transition assigned briefs'),
        { status: 403 }
      );
    }

    // Perform the transition in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update brief stage
      const updatedBrief = await tx.brief.update({
        where: { id: briefId },
        data: { stage: toStage },
      });

      // Log the stage event
      const stageEvent = await tx.stageEvent.create({
        data: {
          briefId,
          userId: user.userId,
          fromStage: brief.stage,
          toStage,
          reason,
        },
      });

      return { brief: updatedBrief, event: stageEvent };
    });

    // Invalidate dashboard cache
    await cacheInvalidate('dashboard-briefs-summary');

    return NextResponse.json(formatApiSuccess({
      stage: result.brief.stage,
      transitionedBy: user.name || user.email,
      reason,
    }));
  } catch (error) {
    console.error('Stage transition error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to transition stage'),
      { status: 500 }
    );
  }
}