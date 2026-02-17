# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**GeoScore** is a full-stack SaaS platform for tracking brand visibility across AI-powered search engines (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek). It analyzes how brands appear in LLM responses, tracks citations, compares against competitors, and generates optimization recommendations.

**Tech Stack:**
- **Frontend:** React 19, TypeScript, TailwindCSS, Radix UI, Wouter (routing), TanStack Query
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Clerk (session-based)
- **Payment:** Razorpay
- **Build:** Vite 7, esbuild

## Development Commands

### Starting the Application
```powershell
# Development mode (runs both client and server)
npm run dev

# Client only (Vite dev server on port 5000)
npm run dev:client

# Build for production
npm run build

# Start production server
npm start
```

### Database Operations
```powershell
# Push schema changes to database
npm run db:push

# Manual migration (run SQL files directly)
# Using migrations/001_initial_schema.sql or other numbered migrations
```

### Type Checking
```powershell
# TypeScript type checking (no-emit mode)
npm run check
```

**Note:** There are NO test scripts configured. The project does not have a testing framework set up.

## Architecture Overview

### Directory Structure

```
Geoscore/
├── client/src/          # React frontend
│   ├── components/      # UI components (Radix-based)
│   ├── pages/          # Route pages
│   └── App.tsx         # Main app entry
├── server/             # Express backend
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API route definitions
│   ├── storage.ts      # Database abstraction layer
│   ├── clerk-middleware.ts  # Auth middleware
│   ├── integrations/   # External API integrations
│   │   ├── llm/        # LLM providers (OpenAI, Anthropic, Google, Perplexity, Grok, DeepSeek, OpenRouter)
│   │   ├── google/     # Google ecosystem (Search Console, Analytics, Ads, Business Profile, AI Overviews)
│   │   ├── social/     # Social platforms (Twitter, LinkedIn, YouTube, Meta)
│   │   ├── serp/       # SERP APIs (DataForSEO, SerpAPI)
│   │   └── enrichment/ # Brand enrichment (Brand.dev, Wikidata, Knowledge Graph)
│   ├── jobs/           # Background job system
│   │   ├── queue.ts    # In-memory job queue
│   │   └── workers/    # Job worker implementations
│   ├── services/       # Business logic
│   ├── lib/            # Utilities (logger, env-validator)
│   ├── middleware/     # Express middleware (rate-limit)
│   └── webhooks/       # Webhook handlers (Razorpay)
├── shared/             # Shared code (client + server)
│   └── schema.ts       # Drizzle schema definitions and Zod validators
├── migrations/         # SQL migration files
└── script/            # Build scripts
```

### Key Architectural Patterns

#### 1. Database Layer (`server/storage.ts`)
- **Single Source of Truth:** All database operations go through `storage.ts` interface
- **Never use direct Drizzle queries in routes or services** - always use storage methods
- Storage pattern: `IStorage` interface defines all operations, implementation uses Drizzle ORM
- Return types strictly typed from schema definitions in `shared/schema.ts`

#### 2. Schema Design (`shared/schema.ts`)
- **Drizzle ORM with Zod validation:** Schemas export both Drizzle tables and Zod insert schemas
- 24+ tables including: users, brands, competitors, topics, prompts, llmAnswers, visibilityScores, subscriptions, jobs
- **Important:** All insert schemas omit `id`, `createdAt`, `updatedAt` (auto-generated)
- Use `insertBrandSchema.parse()` to validate request bodies in routes

#### 3. API Routes (`server/routes.ts`)
- **Rate limiting applied:** All `/api/*` routes use `apiLimiter`, auth routes use `authLimiter`, admin routes use `adminLimiter`
- **Auth middleware:** `requireAuth` for user routes, `requireAdmin` for admin routes
- **Audit logging:** Critical operations log to `audit_logs` table via `createAuditLog()` helper
- **Request validation:** Use Zod schemas from `@shared/schema` to validate payloads
- **User ID extraction:** `getUserId(req)` extracts Clerk user ID from authenticated requests

#### 4. Job System (`server/jobs/`)
- **In-memory queue:** Managed by `queue.ts`, NOT Redis or external queue
- **15 worker types:** LLM sampling, visibility scoring, gap analysis, brand enrichment, topic generation, etc.
- **Job lifecycle:** pending → running → completed/failed
- **Trigger jobs via helpers:** `triggerBrandEnrichment()`, `triggerLLMSampling()`, `triggerFullAnalysis()` in `jobs/index.ts`
- Jobs are stored in `jobs` table, runs tracked in `job_runs`, errors in `job_errors`

#### 5. LLM Integration Layer (`server/integrations/llm/`)
- **Base class pattern:** All LLM providers extend `BaseLLMProvider` in `base.ts`
- **7 providers supported:** OpenAI, Anthropic, Google, Perplexity, Grok, DeepSeek, OpenRouter
- **Unified interface:** `query(prompt, options)` returns standardized response format
- **Streaming support:** Some providers support streaming via `streamQuery()`
- **Model configuration:** Each provider has specific model names (e.g., "gpt-4o", "claude-3-5-sonnet-20241022", "gemini-2.0-flash-exp")

#### 6. Authentication Flow
- **Clerk-based:** Session cookies, no JWT tokens
- **User sync:** POST `/api/users/sync` called by Clerk webhook to create/update users
- **Middleware:** `requireAuth` extracts `userId` from Clerk session and attaches to `req.userId`
- **Admin check:** `requireAdmin` verifies `isAdmin` flag on user record
- **Production security:** Application EXITS if `CLERK_SECRET_KEY` not set or demo mode enabled in production

#### 7. Security & Production Readiness
- **Environment validation:** `server/lib/env-validator.ts` checks all required vars on startup
- **Production guards:** Rejects localhost DATABASE_URL, test Clerk keys, default SESSION_SECRET in production
- **Security headers:** Helmet.js for CSP, HSTS, X-Frame-Options
- **CORS:** Configured per environment in `server/index.ts`
- **Logging:** Winston logger with daily rotation in `logs/` directory
- **Rate limiting:** Express-rate-limit on all API routes

## Database Schema Notes

### Core Entities Hierarchy
```
users (Clerk ID)
  └── brands (user owns multiple brands)
       ├── competitors (track rivals)
       ├── topics (categorize queries)
       ├── prompts (questions to test)
       │    └── llmAnswers (LLM responses)
       │         ├── answerMentions (brand mentions found)
       │         └── answerCitations (sources cited)
       ├── visibilityScores (aggregated metrics)
       ├── subscriptions (Razorpay billing)
       └── jobs (background tasks)
```

### Important Relationships
- **One user, many brands:** Users create multiple brands under their account
- **Prompts → Topics:** Prompts can be categorized by topic
- **Prompts → LLM Answers:** Each prompt generates answers from multiple LLM providers
- **LLM Answers → Mentions & Citations:** Parsed entities and links from responses
- **Brands → Visibility Scores:** Time-series aggregated visibility metrics
- **Jobs → Job Runs:** Each job can have multiple execution attempts

### Common Query Patterns
- **Get brand data:** Always filter by `userId` for security
- **Get time-series data:** Use `createdAt` DESC ordering with limit
- **Aggregate visibility:** Join `visibilityScores` by `brandId` and time period
- **Competitor comparison:** Join `competitors` with `answerMentions` grouped by brand

## Integration Configuration

### Environment Variables
All API keys and configuration stored in `.env` file. See `.env.example` for complete reference.

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk authentication (MUST be production key in prod)
- `SESSION_SECRET` - Session encryption (MUST be 32+ chars, unique per deployment)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Payment processing

**LLM Provider Keys (at least 1 required):**
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `PERPLEXITY_API_KEY`, `GROK_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`

**Optional Integrations:**
- Google ecosystem: Search Console, Analytics, Ads, Business Profile credentials
- Social: Twitter, LinkedIn, YouTube, Meta access tokens
- SERP: SerpAPI, DataForSEO keys
- Enrichment: Brand.dev, Knowledge Graph API keys

### Initializing Integrations
On server startup, `server/index.ts` calls `initializeIntegrations()` with API keys from env vars. Missing keys are gracefully handled (warnings logged, but server starts).

## Common Development Tasks

### Adding a New API Endpoint
1. **Define route in `server/routes.ts`:**
   ```typescript
   app.get("/api/brands/:brandId/custom", requireAuth, async (req: any, res) => {
     const userId = getUserId(req);
     const brand = await storage.getBrand(req.params.brandId);
     if (!brand || brand.userId !== userId) {
       return res.status(404).json({ message: "Brand not found" });
     }
     // Your logic here
     res.json(result);
   });
   ```

2. **Add storage method if needed** in `server/storage.ts` interface and implementation

3. **Apply rate limiting:** Choose appropriate limiter (`apiLimiter`, `adminLimiter`, etc.)

4. **Add audit log** for sensitive operations using `createAuditLog()`

### Adding a New Database Table
1. **Define schema in `shared/schema.ts`:**
   ```typescript
   export const myTable = pgTable("my_table", {
     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
     brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
     // ... other fields
     createdAt: timestamp("created_at").defaultNow(),
   });
   
   export const insertMyTableSchema = createInsertSchema(myTable).omit({ id: true, createdAt: true });
   export type MyTable = typeof myTable.$inferSelect;
   export type InsertMyTable = z.infer<typeof insertMyTableSchema>;
   ```

2. **Add storage methods** in `server/storage.ts` interface and DrizzleStorage class

3. **Create migration SQL** in `migrations/XXX_description.sql` with CREATE TABLE and indexes

4. **Run migration:** `npm run db:push` or execute SQL manually

### Adding a New LLM Provider
1. **Create provider file** in `server/integrations/llm/new-provider.ts` extending `BaseLLMProvider`

2. **Implement required methods:**
   - `query(prompt, options)` - Main query method
   - `getAvailableModels()` - Return supported model names
   - `streamQuery()` - Optional streaming support

3. **Register in `server/integrations/llm/index.ts`:**
   ```typescript
   export { NewProviderLLM } from './new-provider';
   ```

4. **Update `initializeIntegrations()`** in `server/index.ts` to accept new provider config

5. **Add environment variable** to `.env.example` and `.env`

### Adding a New Job Worker
1. **Create worker file** in `server/jobs/workers/my-worker.ts`

2. **Implement worker function:**
   ```typescript
   export async function myWorkerProcessor(jobId: string, data: any): Promise<void> {
     // Job logic
     await storage.updateJob(jobId, { status: 'completed', completedAt: new Date() });
   }
   ```

3. **Register in `server/jobs/workers/index.ts`:**
   ```typescript
   import { myWorkerProcessor } from './my-worker';
   queue.registerWorker('my_worker_type', myWorkerProcessor);
   ```

4. **Create helper function** in `server/jobs/index.ts` to trigger the job

## Key Files Reference

### Must-Read Files for Understanding System
- `server/index.ts` - Server initialization, middleware setup, graceful shutdown
- `server/routes.ts` - All API endpoints and routing logic
- `server/storage.ts` - Database abstraction layer (all DB operations)
- `shared/schema.ts` - Database schema and validation
- `server/jobs/index.ts` - Job system initialization and triggers
- `server/clerk-middleware.ts` - Authentication logic

### Critical Production Files
- `server/lib/env-validator.ts` - Environment validation (prevents bad deploys)
- `server/lib/logger.ts` - Winston logging configuration
- `server/middleware/rate-limit.ts` - Rate limiting rules
- `PRODUCTION_DEPLOYMENT.md` - Deployment guide
- `migrations/001_initial_schema.sql` - Database schema

## Important Development Notes

### TypeScript Configuration
- **Module system:** ESM (not CommonJS)
- **Path aliases:** `@/*` maps to `client/src/*`, `@shared/*` maps to `shared/*`
- **Strict mode:** Enabled
- **No emit:** `tsc` used for type checking only, not compilation (Vite/esbuild handle builds)

### Build Process
- **Client:** Vite bundles React app into `dist/public/`
- **Server:** `script/build.ts` uses esbuild to bundle server into `dist/index.cjs`
- **Production:** Serve static files from `dist/public/`, API on same port (5000 default)

### Session Management
- **Session store:** In-memory (development) or PostgreSQL with `connect-pg-simple` (production recommended)
- **Session secret:** MUST be changed from default in production or server exits
- **Cookie settings:** Secure in production, HTTP-only, same-site strict

### Error Handling Pattern
- **API errors:** Return JSON with `{ message: string }` and appropriate HTTP status
- **Validation errors:** Use Zod parse errors, return 400
- **Auth errors:** Return 401 (unauthorized) or 403 (forbidden)
- **Server errors:** Log with Winston, return 500 with generic message in production

### Logging Best Practices
- **Use Winston logger** from `server/lib/logger.ts`, not `console.log`
- **Structured logging:** Pass context objects as second argument
- **Security events:** Use `logSecurityEvent()` for auth failures, suspicious activity
- **Audit trail:** Use `logAudit()` for critical operations (create/delete/update sensitive data)
- **Request logging:** Automatic via middleware, includes duration and status code

## Known Limitations & Gotchas

- **No testing framework configured:** Tests must be added from scratch
- **In-memory job queue:** Jobs lost on server restart; consider Redis for production
- **Session store:** Default is memory; configure PostgreSQL session store for production multi-instance deployments
- **Migration strategy:** Manual SQL execution; no automatic migration runner configured
- **WebSocket support:** HTTP server created but no WebSocket handlers implemented
- **File uploads:** No configured upload handling (no multer, etc.)
- **Email service:** No email provider configured (Razorpay webhooks rely on external email service)

## Production Deployment Checklist

Before deploying to production:

1. **Environment validation:**
   - Set `NODE_ENV=production`
   - Use production Clerk keys (`sk_live_`, `pk_live_`)
   - Change `SESSION_SECRET` to secure random string
   - Set production `DATABASE_URL` (NOT localhost)
   - Configure `ALLOWED_ORIGINS` with actual domain(s)

2. **Database:**
   - Run `migrations/001_initial_schema.sql` on production database
   - Verify all tables created with proper indexes

3. **Security:**
   - Enable HTTPS/SSL on hosting platform
   - Configure firewall rules
   - Set up log monitoring and alerts
   - Review rate limit settings for expected traffic

4. **Build & Deploy:**
   - Run `npm run build` to create production bundle
   - Upload `dist/` directory to server
   - Run `npm install --production` on server
   - Start with `npm start` or process manager (PM2 recommended)

5. **Verify:**
   - Test `/health` endpoint returns 200
   - Verify authentication flow works
   - Test payment webhook handling
   - Check logs for errors in `logs/` directory

See `PRODUCTION_DEPLOYMENT.md` for detailed deployment instructions.
