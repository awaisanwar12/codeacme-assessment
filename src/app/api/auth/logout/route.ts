// src/app/api/auth/logout/route.ts
// Logout endpoint - clears session cookie
import { NextRequest, NextResponse } from 'next/server';
import { removeSessionCookie } from '@/lib/auth';
import { formatApiSuccess } from '@/lib/validations';

export async function POST(request: NextRequest) {
  await removeSessionCookie();
  
  return NextResponse.json(
    formatApiSuccess({ message: 'Logged out successfully' }),
    { status: 200 }
  );
}