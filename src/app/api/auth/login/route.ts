// src/app/api/auth/login/route.ts
// User login endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema, formatApiError, formatApiSuccess } from '@/lib/validations';
import { verifyPassword } from '@/lib/hash';
import { createToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        formatApiError('VALIDATION_ERROR', 'Invalid input', validated.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        formatApiError('INVALID_CREDENTIALS', 'Invalid email or password'),
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        formatApiError('INVALID_CREDENTIALS', 'Invalid email or password'),
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json(
      formatApiSuccess({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Login failed. Please try again.'),
      { status: 500 }
    );
  }
}