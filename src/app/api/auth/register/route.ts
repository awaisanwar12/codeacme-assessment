// src/app/api/auth/register/route.ts
// User registration endpoint (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema, formatApiError, formatApiSuccess } from '@/lib/validations';
import { hashPassword } from '@/lib/hash';
import { withAdmin } from '@/lib/auth';

async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        formatApiError('VALIDATION_ERROR', 'Invalid input', validated.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    const { email, password, name, role } = validated.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        formatApiError('CONFLICT', 'A user with this email already exists'),
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: role || 'REVIEWER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      formatApiSuccess(user),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Failed to create user'),
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handleRegister);