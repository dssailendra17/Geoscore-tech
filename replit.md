# GeoScore - AI Brand Intelligence Platform

## Overview

GeoScore is a multi-tenant SaaS platform that tracks brand visibility across AI-powered search engines (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek). It analyzes how brands appear in LLM responses, provides competitive analysis, gap analysis, and content optimization recommendations. The platform includes subscription-based billing, an admin portal, job queue processing for async LLM sampling, and integrations with Google ecosystem services and social media platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State/Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui (new-york style), configured via `components.json`
- **Styling**: TailwindCSS v4 with CSS variables for theming (light/dark mode support), custom fonts (Inter, Space Grotesk, JetBrains Mono)
- **Auth (Client)**: Custom email/password auth with JWT cookies via `client/src/lib/auth-context.tsx`
- **Build**: Vite 7 with React plugin, serves from `client/` directory
- **Path Aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- **Route Structure**: Landing page at `/`, auth pages at `/auth/*`, protected app routes at `/app/*`, admin routes at `/admin/*`
- **Route Guards**: Unauthenticated → `/auth/sign-in`, authenticated → `/app/dashboard` (shows welcome state if no brand configured)
- **Auth Flow**: SignUp (first name, last name, email, password) → OTP email verification → `/onboarding`. SignIn (email, password) → `/app/dashboard`. Forgot password with OTP reset.
- **Auth Pages**: `/auth/sign-in`, `/auth/sign-up`, `/auth/verify-email`, `/auth/forgot-password`

### Backend Architecture
- **Runtime**: Node.js with Express 5, TypeScript
- **Entry Point**: `server/index.ts` — creates HTTP server, applies middleware (Helmet, CORS, rate limiting), registers routes, serves static files or Vite dev middleware
- **Auth (Server)**: Custom JWT-based auth with bcryptjs password hashing. Auth middleware in `server/auth-middleware.ts`, routes in `server/auth-routes.ts`. JWT stored in httpOnly cookie `auth_token`. Session secret via `SESSION_SECRET` env var.
- **API Pattern**: RESTful routes registered in `server/routes.ts`, all prefixed with `/api/`. Middleware: `requireAuth` for authenticated routes, `requireAdmin` for admin routes.
- **Rate Limiting**: Express rate limiter with different tiers (general API: 100/15min, auth: 5/15min, admin: 200/15min)
- **Security**: Helmet for security headers, CORS with configurable origins, environment validation on startup (`server/lib/env-validator.ts`)
- **Build Output**: esbuild bundles server to `dist/index.cjs`, Vite builds client to `dist/public/`
- **Static Serving**: In production, `server/static.ts` serves built client files from `dist/public/` with SPA fallback

### Database & Storage
- **Database**: PostgreSQL (required, provisioned via `DATABASE_URL` env var)
- **ORM**: Drizzle ORM with `drizzle-kit` for schema management
- **Schema Location**: `shared/schema.ts` — shared between client and server
- **Schema Push**: `npm run db:push` (uses drizzle-kit push)
- **Migrations**: SQL migration files in `migrations/` directory (e.g., `001_initial_schema.sql`)
- **Connection**: `server/db.ts` creates a `pg.Pool` and Drizzle instance
- **Storage Layer**: `server/storage.ts` implements `IStorage` interface with 50+ methods for all CRUD operations across 20+ tables
- **Key Tables**: `users`, `brands`, `competitors`, `topics`, `prompts`, `prompt_results`, `sources`, `integrations`, `plan_capabilities`, `prompt_templates`, `team_members`, `audit_logs`, `jobs`, `analysis_schedules`, `axp_content`, `llm_answers`, `prompt_runs`, `answer_mentions`, `answer_citations`, `visibility_scores`, `trend_snapshots`, `job_runs`, `job_errors`, `axp_pages`, `axp_versions`, `faq_entries`, `schema_templates`, `schema_versions`, `subscriptions`, `invoices`, `payments`, `webhook_events`, `brand_context`

### Job Queue System
- In-memory job queue with priority, retry logic, and status tracking
- Workers for: brand enrichment, LLM sampling, topic generation, query generation, competitor enrichment, drift detection
- Located in `server/jobs/` directory

### Key Design Patterns
- **Monorepo-style structure**: `client/`, `server/`, `shared/` directories with shared types
- **Single server**: Express serves both API and frontend (no separate processes needed)
- **Dev mode**: Vite dev server runs as middleware on the Express server (port 5000)
- **Production mode**: Pre-built static assets served by Express
- **Multi-tenant**: Users own brands; all data is scoped by brand ID
- **Subscription tiers**: Free, Starter, Growth, Enterprise with plan-based feature limits

## External Dependencies

### Authentication
- **Custom Auth**: Email/password with bcryptjs hashing, JWT session tokens (httpOnly cookies), OTP-based email verification, forgot/reset password flow. Email delivery via SMTP (nodemailer) when configured, OTP logged to console in dev mode. Environment: `SESSION_SECRET` (for JWT signing), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for email delivery).

### Payment Processing
- **Razorpay**: Subscription management and payment processing. Webhook handler at `server/webhooks/razorpay.ts` with signature verification. Environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

### LLM Providers (7 total)
- **OpenAI**: GPT-4, GPT-4o, GPT-3.5-turbo (`OPENAI_API_KEY`)
- **Anthropic**: Claude 3.5 Sonnet, Haiku, Opus (`ANTHROPIC_API_KEY`)
- **Google Gemini**: Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash (`GOOGLE_API_KEY`)
- **Perplexity**: Llama 3.1 Sonar with online search (`PERPLEXITY_API_KEY`)
- **Grok (xAI)**: Grok Beta, Grok Vision (`GROK_API_KEY`)
- **DeepSeek**: DeepSeek Chat, DeepSeek Coder (`DEEPSEEK_API_KEY`)
- **OpenRouter**: Access to 100+ models (`OPENROUTER_API_KEY`)
- All providers use a unified adapter pattern in `server/integrations/llm/`

### Brand Enrichment
- **brand.dev**: Logo and color extraction (`BRAND_DEV_API_KEY`)
- **Google Knowledge Graph**: Entity information (`GOOGLE_KG_API_KEY`)
- **Wikidata**: Structured entity data (free, no key needed)

### SERP & Search
- **SerpAPI**: Google Search results, AI Overview extraction, position tracking (`SERPAPI_KEY`)

### Google Ecosystem
- **Google Search Console**: Search performance tracking
- **Google Business Profile**: Business listings and reviews
- **Google Analytics 4**: Website analytics
- **Google Ads**: Campaign performance
- **Google AI Overviews**: AI-generated search summaries

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and query builder

### Deployment
- Configured for Vercel serverless (`vercel.json`, `api/serverless.js`) and traditional hosting (PM2/node)
- Production build: `npm run build` → `npm start`
- Health check endpoint: `GET /health`