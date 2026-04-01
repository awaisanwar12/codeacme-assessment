// src/app/api/dashboard/briefs/[id]/notes/route.ts
// Notes API - Create and list threaded comments on briefs
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createNoteSchema, formatApiError, formatApiSuccess } from '@/lib/validations';

// GET /api/dashboard/briefs/[id]/notes - List all notes for a brief
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        formatApiError('UNAUTHENTICATED', 'Authentication required'),
        { status: 401 }
      );
    }

    const briefId = params.id;

    // Verify access
    const brief = await prisma.brief.findFirst({
      where: user.role === 'ADMIN'
        ? { id: briefId }
        : { id: briefId, assignedToId: user.userId },
    });

    if (!brief) {
      return NextResponse.json(
        formatApiError('NOT_FOUND', 'Brief not found or access denied'),
        { status: 404 }
      );
    }

    const notes = await prisma.note.findMany({
      where: { briefId, parentId: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(formatApiSuccess(notes));
  } catch (error) {
    console.error('Notes list error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to fetch notes'),
      { status: 500 }
    );
  }
}

// POST /api/dashboard/briefs/[id]/notes - Create a new note or reply
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        formatApiError('UNAUTHENTICATED', 'Authentication required'),
        { status: 401 }
      );
    }

    const briefId = params.id;

    // Verify access to the brief
    const brief = await prisma.brief.findFirst({
      where: user.role === 'ADMIN'
        ? { id: briefId }
        : { id: briefId, assignedToId: user.userId },
    });

    if (!brief) {
      return NextResponse.json(
        formatApiError('NOT_FOUND', 'Brief not found or access denied'),
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = createNoteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        formatApiError('VALIDATION_ERROR', 'Invalid input', validated.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    const { content, parentId } = validated.data;

    // If replying, verify parent note exists and belongs to this brief
    if (parentId) {
      const parentNote = await prisma.note.findFirst({
        where: { id: parentId, briefId },
      });
      if (!parentNote) {
        return NextResponse.json(
          formatApiError('NOT_FOUND', 'Parent note not found'),
          { status: 404 }
        );
      }
    }

    const note = await prisma.note.create({
      data: {
        briefId,
        userId: user.userId,
        content,
        parentId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(formatApiSuccess(note), { status: 201 });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to create note'),
      { status: 500 }
    );
  }
}