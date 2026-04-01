// src/lib/validations.ts
// Zod schemas for request validation
import { z } from 'zod';

// Budget range options matching Prisma enum
export const budgetRangeSchema = z.enum([
  'UNDER_5K',
  'FIVE_TO_10K',
  'TEN_TO_25K',
  'TWENTY_FIVE_TO_50K',
  'FIFTY_TO_100K',
  'OVER_100K',
]);

// Urgency levels
export const urgencyLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Brief source
export const briefSourceSchema = z.enum(['FORM', 'WEBHOOK', 'MANUAL']);

// Pipeline stages
export const briefStageSchema = z.enum([
  'NEW',
  'UNDER_REVIEW',
  'PROPOSAL_SENT',
  'WON',
  'ARCHIVED',
]);

// ============================================
// PUBLIC INTAKE FORM VALIDATION
// ============================================
export const briefSubmissionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .min(50, 'Please provide more detail (minimum 50 characters)')
    .max(5000, 'Description must be less than 5000 characters')
    .trim(),
  budgetRange: budgetRangeSchema,
  urgency: urgencyLevelSchema.default('MEDIUM'),
  contactName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim(),
  contactEmail: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  contactPhone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal('')),
});

export type BriefSubmissionInput = z.infer<typeof briefSubmissionSchema>;

// ============================================
// WEBHOOK PAYLOAD VALIDATION
// ============================================
export const webhookBriefSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(50).max(5000),
  budgetRange: budgetRangeSchema,
  urgency: urgencyLevelSchema.optional().default('MEDIUM'),
  contactName: z.string().min(1).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  companyName: z.string().optional(),
  sourceRef: z.string().optional(), // External reference ID
});

export type WebhookBriefInput = z.infer<typeof webhookBriefSchema>;

export const webhookHeadersSchema = z.object({
  signature: z.string({ required_error: 'X-Webhook-Signature header required' }),
  timestamp: z.string({ required_error: 'X-Webhook-Timestamp header required' }),
});

// ============================================
// USER AUTH VALIDATION
// ============================================
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'REVIEWER']).default('REVIEWER'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// STAGE TRANSITION VALIDATION
// ============================================
export const stageTransitionSchema = z.object({
  toStage: briefStageSchema,
  reason: z.string().max(500).optional(),
});

export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;

// ============================================
// NOTE VALIDATION
// ============================================
export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty').max(2000),
  parentId: z.string().cuid().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

// ============================================
// ASSIGNMENT VALIDATION
// ============================================
export const assignBriefSchema = z.object({
  assignedToId: z.string().cuid().nullable(),
});

// ============================================
// AI ANALYSIS OVERRIDE VALIDATION
// ============================================
export const analysisOverrideSchema = z.object({
  overriddenHours: z.number().int().min(1).max(10000),
  overrideReason: z.string().min(10, 'Please provide a reason for the override').max(500),
});

export type AnalysisOverrideInput = z.infer<typeof analysisOverrideSchema>;

// ============================================
// PAGINATION VALIDATION
// ============================================
export const cursorPaginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

// ============================================
// STANDARD API RESPONSE FORMAT
// ============================================
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export function formatApiError(error: string, message: string, details?: Record<string, unknown>) {
  return {
    error,
    message,
    ...(details && { details }),
  };
}

export function formatApiSuccess<T>(data: T) {
  return { success: true, data };
}