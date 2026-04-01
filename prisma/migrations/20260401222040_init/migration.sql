-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'REVIEWER');

-- CreateEnum
CREATE TYPE "brief_stage" AS ENUM ('NEW', 'UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "budget_range" AS ENUM ('UNDER_5K', 'FIVE_TO_10K', 'TEN_TO_25K', 'TWENTY_FIVE_TO_50K', 'FIFTY_TO_100K', 'OVER_100K');

-- CreateEnum
CREATE TYPE "urgency_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "brief_source" AS ENUM ('FORM', 'WEBHOOK', 'MANUAL');

-- CreateEnum
CREATE TYPE "project_category" AS ENUM ('WEB_APP', 'MOBILE', 'AI_ML', 'AUTOMATION', 'INTEGRATION', 'ECOMMERCE', 'CMS', 'OTHER');

-- CreateEnum
CREATE TYPE "analysis_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'REVIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget_range" "budget_range" NOT NULL,
    "urgency" "urgency_level" NOT NULL DEFAULT 'MEDIUM',
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "company_name" TEXT,
    "stage" "brief_stage" NOT NULL DEFAULT 'NEW',
    "assigned_to_id" TEXT,
    "source" "brief_source" NOT NULL DEFAULT 'FORM',
    "source_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "brief_id" TEXT NOT NULL,
    "features" TEXT[],
    "requirements" TEXT[],
    "category" "project_category" NOT NULL,
    "tech_stack" TEXT[],
    "effort_min_hours" INTEGER NOT NULL,
    "effort_max_hours" INTEGER NOT NULL,
    "complexity_score" INTEGER NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "raw_prompt" TEXT,
    "raw_response" TEXT,
    "overridden_hours" INTEGER,
    "override_reason" TEXT,
    "status" "analysis_status" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "brief_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_events" (
    "id" TEXT NOT NULL,
    "brief_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_stage" "brief_stage" NOT NULL,
    "to_stage" "brief_stage" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "briefs_stage_idx" ON "briefs"("stage");

-- CreateIndex
CREATE INDEX "briefs_stage_created_at_idx" ON "briefs"("stage", "created_at" DESC);

-- CreateIndex
CREATE INDEX "briefs_assigned_to_id_idx" ON "briefs"("assigned_to_id");

-- CreateIndex
CREATE INDEX "briefs_source_idx" ON "briefs"("source");

-- CreateIndex
CREATE INDEX "briefs_contact_email_idx" ON "briefs"("contact_email");

-- CreateIndex
CREATE INDEX "briefs_created_at_idx" ON "briefs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_brief_id_key" ON "ai_analyses"("brief_id");

-- CreateIndex
CREATE INDEX "ai_analyses_brief_id_idx" ON "ai_analyses"("brief_id");

-- CreateIndex
CREATE INDEX "ai_analyses_category_idx" ON "ai_analyses"("category");

-- CreateIndex
CREATE INDEX "ai_analyses_complexity_score_idx" ON "ai_analyses"("complexity_score");

-- CreateIndex
CREATE INDEX "ai_analyses_status_idx" ON "ai_analyses"("status");

-- CreateIndex
CREATE INDEX "ai_analyses_created_at_idx" ON "ai_analyses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "notes_brief_id_created_at_idx" ON "notes"("brief_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_parent_id_idx" ON "notes"("parent_id");

-- CreateIndex
CREATE INDEX "stage_events_brief_id_created_at_idx" ON "stage_events"("brief_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "stage_events_user_id_idx" ON "stage_events"("user_id");

-- CreateIndex
CREATE INDEX "stage_events_created_at_idx" ON "stage_events"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
