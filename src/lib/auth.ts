// src/lib/auth.ts
// JWT-based authentication with role-based access control
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import type { UserRole } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production'
);

const COOKIE_NAME = 'session_token';
const TOKEN_EXPIRY = '24h';

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}

// Create a signed JWT token
export async function createToken(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
  
  return token;
}

// Verify and decode a JWT token
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

// Remove session cookie
export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current user session from cookies (Server Components)
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

// Get current user session from request (Route Handlers)
export async function getUserFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

// Check if user is authenticated
export async function requireAuth(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  
  return user;
}

// Check if user is admin
export async function requireAdmin(): Promise<SessionPayload> {
  const user = await requireAuth();
  
  if (user.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED');
  }
  
  return user;
}

// Middleware helper for route handlers
export function withAuth(handler: (request: NextRequest, user: SessionPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, user);
  };
}

export function withAdmin(handler: (request: NextRequest, user: SessionPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, user);
  };
}