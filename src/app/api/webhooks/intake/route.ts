// src/app/api/webhooks/intake/route.ts
// Webhook endpoint for external brief sources (Typeform, Zapier, etc.)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webhookBriefSchema, formatApiError, formatApiSuccess } from '@/lib/validations';
import { checkRateLimit } from '@/lib/redis';
import { analyzeBrief } from '@/services/ai-analysis';
import crypto from 'crypto';

// HMAC Signature verification
// Expected headers: X-Webhook-Signature, X-Webhook-Timestamp
// Signature format: sha256={hex_hmac_of_timestamp_and_body}
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('WEBHOOK_SECRET not configured. Webhook verification disabled.');
    return true; // Fail open for development, but warn
  }

  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  // Check timestamp is within 5 minutes (prevent replay attacks)
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  // Verify HMAC signature
  // Expected format: sha256={hex}
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex')}`;

  // Use timing-safe comparison to prevent timing attacks
  const sigBytes = Buffer.from(signature, 'utf8');
  const expectedBytes = Buffer.from(expectedSignature, 'utf8');
  
  if (sigBytes.length !== expectedBytes.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(sigBytes, expectedBytes);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by webhook source (if identifiable)
    const sourceName = request.headers.get('x-webhook-source') || 'unknown';
    const rateLimit = await checkRateLimit(`webhook:${sourceName}`, 50, 3600);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        formatApiError('RATE_LIMITED', 'Webhook rate limit exceeded'),
        { status: 429 }
      );
    }

    // Read raw body for signature verification
    const rawBody = await request.text();
    
    // Verify HMAC signature
    if (!verifyWebhookSignature(request, rawBody)) {
      return NextResponse.json(
        formatApiError('INVALID_SIGNATURE', 'Webhook signature verification failed'),
        { status: 401 }
      );
    }

    // Parse and validate webhook payload
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        formatApiError('INVALID_JSON', 'Request body must be valid JSON'),
        { status: 400 }
      );
    }

    // Handle different webhook formats (Typeform, Zapier, custom)
    // Try to extract brief data from the payload
    let briefData: Record<string, unknown>;

    if (parsedBody && typeof parsedBody === 'object' && 'form_response' in parsedBody) {
      // Typeform format
      const formResponse = (parsedBody as { form_response: { answers: Array<{ field: { key?: string; ref?: string }; value: string | number | string[] }>; definition?: { title: string } } }).form_response;
      const answers = formResponse.answers || [];
      
      briefData = {
        title: formResponse.definition?.title || 'Typeform Submission',
        description: answers.find(a => a.field?.key === 'description')?.value || answers.find(a => a.field?.ref === 'description')?.value || '',
        budgetRange: answers.find(a => a.field?.key === 'budget')?.value || 'FIVE_TO_10K',
        contactName: answers.find(a => a.field?.key === 'name')?.value || '',
        contactEmail: answers.find(a => a.field?.key === 'email')?.value || '',
      };
    } else if (parsedBody && typeof parsedBody === 'object' && 'data' in parsedBody) {
      // Zapier/common format with data wrapper
      briefData = (parsedBody as { data: Record<string, unknown> }).data;
    } else {
      // Direct format - assume it matches our schema
      briefData = parsedBody as Record<string, unknown>;
    }

    // Validate against webhook schema
    const validatedData = webhookBriefSchema.safeParse(briefData);
    
    if (!validatedData.success) {
      const fieldErrors = validatedData.error.flatten().fieldErrors;
      return NextResponse.json(
        formatApiError('VALIDATION_ERROR', 'Invalid webhook payload', fieldErrors),
        { status: 400 }
      );
    }

    const { title, description, budgetRange, urgency, contactName, contactEmail, contactPhone, companyName, sourceRef } = validatedData.data;

    // Create the brief
    const brief = await prisma.brief.create({
      data: {
        title,
        description,
        budgetRange,
        urgency,
        contactName,
        contactEmail,
        contactPhone,
        companyName,
        stage: 'NEW',
        source: 'WEBHOOK',
        sourceRef,
      },
    });

    // Queue AI analysis
    setImmediate(async () => {
      try {
        await analyzeBrief(brief.id);
      } catch (error) {
        console.error('AI analysis failed for webhook brief:', brief.id, error);
      }
    });

    // Return 202 Accepted (processing will continue asynchronously)
    return NextResponse.json(
      formatApiSuccess({
        id: brief.id,
        message: 'Brief accepted and queued for analysis',
      }),
      { status: 202 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      formatApiError('INTERNAL_ERROR', 'Webhook processing failed'),
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (for services that send a test GET request)
export async function GET() {
  return NextResponse.json(
    { status: 'ok', message: 'Webhook endpoint is active' },
    { status: 200 }
  );
}