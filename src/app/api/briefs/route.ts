// src/app/api/briefs/route.ts
// Public intake form submission endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { briefSubmissionSchema, formatApiError, formatApiSuccess } from '@/lib/validations';
import { checkRateLimit } from '@/lib/redis';
import { analyzeBrief } from '@/services/ai-analysis';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkRateLimit(`brief-submit:${ip}`, 5, 3600); // 5 per hour
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        formatApiError('RATE_LIMITED', 'Too many submissions. Please wait before submitting again.'),
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = briefSubmissionSchema.safeParse(body);
    
    if (!validatedData.success) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      return NextResponse.json(
        formatApiError('VALIDATION_ERROR', 'Invalid input data', fieldErrors),
        { status: 400 }
      );
    }

    const { title, description, budgetRange, urgency, contactName, contactEmail, contactPhone, companyName } = validatedData.data;

    // Sanitize and normalize
    const cleanTitle = title.trim().replace(/\s+/g, ' ');
    const cleanContactName = contactName.trim().replace(/\s+/g, ' ');
    const cleanContactEmail = contactEmail.trim().toLowerCase();
    const cleanCompanyName = companyName?.trim() || null;
    const cleanContactPhone = contactPhone?.trim() || null;
    const cleanDescription = description.trim();

    // Validate no HTML/JSX injection in text fields
    if (/<script/i.test(cleanTitle) || /<script/i.test(cleanDescription)) {
      return NextResponse.json(
        formatApiError('INVALID_INPUT', 'Script tags are not allowed in submissions'),
        { status: 400 }
      );
    }

    // Create the brief record
    const brief = await prisma.brief.create({
      data: {
        title: cleanTitle,
        description: cleanDescription,
        budgetRange,
        urgency,
        contactName: cleanContactName,
        contactEmail: cleanContactEmail,
        contactPhone: cleanContactPhone,
        companyName: cleanCompanyName,
        stage: 'NEW',
        source: 'FORM',
      },
    });

    // Queue AI analysis (fire-and-forget with retry)
    // In production, this would go to a queue, but for simplicity we trigger it here
    // and return immediately. The analysis runs asynchronously.
    setImmediate(async () => {
      try {
        await analyzeBrief(brief.id);
      } catch (error) {
        console.error('AI analysis failed for brief:', brief.id, error);
      }
    });

    // Return success without sensitive data
    return NextResponse.json(
      formatApiSuccess({
        id: brief.id,
        title: brief.title,
        message: 'Brief submitted successfully. We will review and contact you soon.',
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Brief submission error:', error);
    
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.'),
      { status: 500 }
    );
  }
}

// GET briefs - requires auth (Admin only for public API, reviewers use dashboard routes)
export async function GET() {
  return NextResponse.json(
    formatApiError('NOT_IMPLEMENTED', 'Brief listing requires authentication. Please log in to the dashboard.'),
    { status: 401 }
  );
}