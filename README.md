# Agency Brief Pipeline

> AI-powered project brief analysis and pipeline management for agencies.

## Overview

Automates the intake and analysis of project briefs for agencies. Clients submit briefs through a public form or webhook, an AI pipeline extracts structured requirements and estimates, and the team manages everything through a real-time internal dashboard.

## Features

- **Public Intake Form** - Clean, validated form for project submissions
- **AI Brief Analyzer** - Automatic feature extraction, cost estimation, complexity scoring
- **Webhook Integration** - Accept briefs from Typeform, Zapier, or any external source
- **Role-Based Dashboard** - Admin (full access) and Reviewer (assigned briefs only)
- **Kanban Pipeline** - Drag-and-drop stages: New → Under Review → Proposal Sent → Won → Archived
- **Threaded Notes** - Internal team collaboration on each brief
- **Real-Time Updates** - SSE-based live dashboard updates
- **Analytics** - Stage distribution, category breakdown, conversion rate, revenue pipeline
- **Redis Caching** - Fast dashboard analytics with automatic invalidation
- **Rate Limiting** - Protection against form abuse

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Cache | Redis (Upstash) |
| Auth | Custom JWT (jose) |
| LLM | OpenAI / Groq / OpenRouter / Anthropic |
| Validation | Zod |
| Charts | Recharts |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- A PostgreSQL database (Neon free tier recommended)
- A Google Gemini API key (free)
- Upstash Redis (optional, free tier)

### Step 1: Clone & Install

```bash
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# ============================================
# DATABASE (Neon - Free)
# ============================================
# Get connection string from Neon Console → Project → Connection Details
# Use the pooled connection for DATABASE_URL (recommended for serverless)
# Use the direct connection for DIRECT_URL (for migrations)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# AUTHENTICATION - Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# ============================================
# AI/LLM PROVIDER
# ============================================
# Google Gemini (FREE - recommended): https://aistudio.google.com/apikey
GOOGLE_API_KEY="your-api-key"
LLM_MODEL="gemini-2.0-flash"

# REDIS - Get from https://upstash.com (free, optional)
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# WEBHOOK SECURITY - Generate with: openssl rand -base64 32
WEBHOOK_SECRET="your-webhook-signature-secret"

# INITIAL ADMIN USER
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
```

#### Getting Each Service

**Database (Neon - Free):**
1. Sign up at https://neon.tech
2. Create a project → Connection Details → Copy connection string
3. Use the **pooled** connection for `DATABASE_URL` (serverless-friendly)
4. Use the **direct** connection for `DIRECT_URL` (migrations, Prisma Studio)

**LLM API Key (Choose one):**
- **OpenAI**: https://platform.openai.com → API Keys → Create (new accounts get $5 free)
- **Groq**: https://console.groq.com → API Keys → Create (free tier)
- **OpenRouter**: https://openrouter.ai → Keys → Create (free tier)
- **Anthropic**: https://console.anthropic.com → API Keys → Create

**Redis (Upstash - Free, Optional):**
1. Sign up at https://upstash.com
2. Create Redis database → Copy REST URL and Token
3. If not set, the app skips caching (fails gracefully)

**JWT Secret:**
```bash
openssl rand -base64 32
# or: python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Set Up the Database

```bash
# Run migrations to create tables
npm run db:migrate

# (Optional) Open Prisma Studio to browse data
npm run db:studio

# Seed initial data (admin user + sample briefs)
npm run db:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 5: Login to Dashboard

- Navigate to http://localhost:3000/login
- Email: `admin@example.com` (or your `ADMIN_EMAIL`)
- Password: Whatever you set in `ADMIN_PASSWORD`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (runs db:migrate first) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (database browser) |
| `npm run db:seed` | Seed initial data |

## Architecture

### Data Model

```
┌─────────┐     ┌──────────┐     ┌─────────────┐
│  User   │────→│  Brief   │────→│ AIAnalysis   │
│         │     │          │     │ (1:1)        │
│ - Admin │     │ - Stage  │     └─────────────┘
│ - Review│     │ - Budget │
└─────────┘     │          │
   │            │          │     ┌─────────────┐
   │            │          │────→│  Note        │
   │            │          │     │ (threaded)   │
   │            │          │     └─────────────┘
   │            │          │
   │            │          │     ┌─────────────┐
   │            │          │────→│ StageEvent   │
   │            │          │     │ (audit trail)│
   │            │          │     └─────────────┘
   └────────────┴──────────┘
```

### Request Flow

```
Client → API Route → Auth Check → Zod Validation
                   → Prisma Query → (Cache)
                   → Format Response
                   
Brief Submit → Validate → Rate Limit → Create Brief
              → Queue AI Analysis (async)
              → Return Success
              
AI Analysis → Call LLM → Parse JSON → Validate
             → Save AIAnalysis → (retry on failure)
```

### API Routes

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/briefs` | Public | Submit new brief (rate limited) |
| `POST /api/webhooks/intake` | HMAC | External brief source |
| `POST /api/auth/login` | Public | User login (sets cookie) |
| `POST /api/auth/logout` | Public | User logout (clears cookie) |
| `POST /api/auth/register` | Admin | Create new users |
| `GET /api/dashboard/briefs` | Auth | List briefs (paginated, cached) |
| `GET /api/dashboard/briefs/[id]` | Auth | Brief detail (RBAC) |
| `POST /api/dashboard/briefs/[id]/transition` | Auth | Change stage |
| `GET/POST /api/dashboard/briefs/[id]/notes` | Auth | Threaded notes |
| `GET /api/dashboard/analytics` | Auth | Dashboard stats (cached) |
| `GET /api/dashboard/sse` | Auth | Real-time event stream |

### Caching Strategy

| Key | TTL | Invalidated On |
|-----|-----|----------------|
| `dashboard-briefs-summary` | 60s | New brief, stage transition |
| `dashboard-analytics` | 120s | New brief, stage transition |

### Indexing Strategy

| Table | Indexes |
|-------|---------|
| Brief | `stage`, `(stage, createdAt DESC)`, `assignedToId`, `source`, `contactEmail`, `createdAt DESC` |
| AIAnalysis | `briefId`, `category`, `complexityScore`, `status`, `createdAt DESC` |
| Note | `(briefId, createdAt DESC)`, `userId`, `parentId` |
| StageEvent | `(briefId, createdAt DESC)`, `userId`, `createdAt DESC` |
| User | `email`, `role` |

Composite indexes support the most common queries: Kanban grouping (stage + date), pagination (cursor + date), and assignment filtering.

## AI Pipeline Design

The AI analyzer supports any OpenAI-compatible API provider:

1. **Prompt**: Structured system prompt requesting JSON output with features, requirements, category, tech stack, effort estimates, and complexity score
2. **Parsing**: Extracts JSON from response (handles markdown code blocks), validates against expected structure
3. **Retry**: Up to 3 attempts with exponential backoff (0s, 2s, 4s)
4. **Audit**: Stores raw prompt and response for debugging
5. **Graceful failure**: If all retries fail, marks analysis as FAILED with error message

### AI Output Format
```json
{
  "features": ["User authentication", "Payment integration", ...],
  "requirements": ["HIPAA compliance", "Mobile-first design", ...],
  "category": "WEB_APP",
  "techStack": ["Next.js", "PostgreSQL", "Stripe", ...],
  "effortMinHours": 120,
  "effortMaxHours": 200,
  "complexityScore": 3,
  "confidenceScore": 0.85
}
```

## What AI Tools Were Used

- **This entire codebase** was generated by Cline (AI coding agent) using the Claude Sonnet model
- The application itself integrates with external LLM providers (OpenAI, Groq, Anthropic) for the AI analysis pipeline

## What I'd Improve Given More Time

1. **Task Queue**: Replace `setImmediate` with BullMQ/Redis Queue for reliable async AI processing
2. **Email Notifications**: Send confirmation emails on brief submission and status changes
3. **File Uploads**: Allow clients to attach documents/mockups to briefs
4. **Export**: CSV/PDF export of brief details and analytics
5. **Search**: Full-text search across briefs using PostgreSQL `tsvector`
6. **Tests**: Unit tests for services, integration tests for API routes
7. **E2E Tests**: Playwright tests for critical user flows
8. **Accessibility Audit**: WCAG 2.1 AA compliance verification
9. **Dashboard Polish**: Skeleton loading states, toast notifications, empty states
10. **Admin Panel**: User management, brief assignment UI, system settings

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema (5 models)
│   └── seed.ts            # Initial data seeding
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/      # Login, logout, register
│   │   │   ├── briefs/    # Public intake form
│   │   │   ├── webhooks/  # External integrations
│   │   │   └── dashboard/ # Protected dashboard routes
│   │   ├── globals.css    # Design system CSS
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing/intake form
│   ├── lib/
│   │   ├── auth.ts        # JWT authentication
│   │   ├── hash.ts        # Password hashing
│   │   ├── prisma.ts      # Singleton Prisma client
│   │   ├── redis.ts       # Redis helpers
│   │   └── validations.ts # Zod schemas
│   └── services/
│       └── ai-analysis.ts # AI pipeline service
├── memory-bank/           # Project documentation
├── workflows/             # Cline workflow definitions
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT