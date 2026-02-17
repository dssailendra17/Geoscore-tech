# Geoscore - AI Brand Intelligence Platform

## Overview

Geoscore is a multi-tenant SaaS platform for tracking brand visibility across Large Language Models (ChatGPT, Claude, Gemini, Perplexity). The application enables businesses to monitor how AI models mention their brand, analyze competitor visibility, track citation sources, and optimize content for better AI discoverability.

Core capabilities include:
- Competitive analysis against tracked competitors
- Prompt performance tracking across AI models
- Source intelligence for understanding LLM citations
- Gap analysis for identifying visibility opportunities
- Integration with Google Search Console and social platforms
- Role-based access with tiered subscription plans (free, starter, growth, enterprise)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 17, 2026)

### Content & AXP System
- **AXP Generator**: Create bot-friendly static HTML pages with canonical links and proper headers
- **FAQ Builder**: Per-page FAQ management with question/answer, evidence links, publishing modes (hidden, AXP, website)
- **Schema/JSON-LD Manager**: Templates for Organization, Product, FAQPage, Article, LocalBusiness, BreadcrumbList with coverage metrics
- **Script Provider**: Generate embed scripts with controls for AXP link injection, schema injection, FAQ widget

### Settings & Security Enhancements
- **Reset Password**: Old/new/confirm password form with OTP verification via SMS
- **Active Devices**: View and revoke device sessions with browser/OS/IP info
- **Brand Details**: Enhanced form with Brand Name, Website URL, Product Description, Industry, Language, Target Market, Brand Variations
- **Upgrade Modal**: All plans displayed with Razorpay integration, accessible from sidebar and billing tab

### Navigation Improvements
- **Sidebar Brand Dropdown**: Click on brand name shows Edit Profile, Upgrade Plan, and Logout options
- **Gap Analysis Page**: Impact Opportunity Matrix (Quick Wins, Big Bets, Fill-Ins, Long-Term), Recommended Improvement Path, Team Capacity Planning
- **Content & AXP Link**: Added to sidebar navigation

### Enterprise Admin Portal & UI Enhancements
- **Admin Portal Backend**: Full API for plans, prompt templates, brands management, team members, and audit logs
- **Database Schema**: Added plan_capabilities, prompt_templates, team_members, audit_logs, jobs, analysis_schedules tables
- **Admin UI Pages**:
  - Plans & Capability Builder - Admin-configurable plan limits without code deployment
  - Prompt Templates Manager - Versioning and A/B testing toggles
  - Brands Manager - Full CRUD with job controls and context view
  - Audit Logs Viewer - Enterprise compliance with CSV export
- **Enhanced Dashboard**: AI Visibility Score gauge, trend charts, topic performance, model breakdown, quick actions
- **Enhanced Prompts Page**: Performance Center with KPIs, model/category filters, sortable columns
- **Enhanced Competitors Page**: Visibility matrix, model breakdown comparison, head-to-head analysis
- **Enhanced Settings Page**: Tabs for Organization, Team Management, Billing, and Analysis Schedule

### Clerk Authentication Implementation
- **Replaced Replit Auth with Clerk**: Removed Replit Auth integration completely and implemented Clerk for authentication
- **User Authentication Flow**:
  - Sign-in/Sign-up pages with email/password and Google OAuth
  - Mandatory phone verification via SMS OTP after sign-up
  - Redirect to onboarding after phone verification
  - Redirect to dashboard after onboarding completion
- **Admin Authentication**:
  - Admin access controlled via Clerk publicMetadata.isAdmin flag
  - Admin portal at `/admin` with separate layout
  - Admin settings page with 2FA management
  - 2FA/MFA support through Clerk's built-in multi-factor authentication
- **Route Protection**:
  - `/auth/*` routes render without AppShell (clean auth UI)
  - `/app/*` routes require authenticated + phone-verified users
  - `/admin/*` routes require admin role
  - Automatic redirects based on auth/onboarding status
- **Database Updates**:
  - Removed sessions table (Clerk handles sessions)
  - Updated users table to sync with Clerk user data
  - Added phoneVerified and isAdmin flags to users table
  - Users table now uses Clerk user ID as primary key

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **Authentication**: Clerk (with email, phone, Google OAuth, and 2FA)
- **State Management**: TanStack Query for server state caching
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Charts**: Recharts for data visualization
- **Fonts**: Inter (UI), Space Grotesk (headings), JetBrains Mono (data)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Clerk for identity management with session tokens
- **API Pattern**: RESTful endpoints under `/api/*` prefix

### Application Structure
```
client/           # React frontend (Vite)
├── src/
│   ├── components/   # Reusable UI components
│   │   └── layout/   # Layout components (AppShell, AdminLayout)
│   ├── pages/        # Route-level components
│   │   ├── auth/     # Authentication pages (SignIn, SignUp, PhoneVerify)
│   │   └── admin/    # Admin pages (AdminSettings)
│   ├── hooks/        # Custom React hooks (use-clerk-auth.ts)
│   └── lib/          # Utilities, data models, API client
│       └── clerk-config.tsx  # Clerk provider configuration
server/           # Express backend
├── routes.ts     # API endpoint definitions
├── storage.ts    # Database access layer (repository pattern)
├── db.ts         # Drizzle database connection
└── clerk-middleware.ts  # Clerk authentication middleware
shared/           # Shared types and schemas
└── schema.ts     # Drizzle table definitions with Zod validation
```

### Route Guards and Navigation
- Unauthenticated users redirect to `/auth/sign-in`
- Authenticated users without phone verification redirect to `/auth/phone-verify`
- Phone-verified users without onboarding redirect to `/onboarding`
- Onboarding completed users access `/app/dashboard`
- Admin routes under `/admin/*` require isAdmin flag in Clerk publicMetadata
- Admin layout separate from main AppShell

### Authentication Flow
1. User signs up/signs in at `/auth/sign-up` or `/auth/sign-in`
2. Clerk handles authentication (email/password or Google OAuth)
3. User redirected to `/auth/phone-verify` for mandatory phone verification
4. Phone verification sends SMS OTP via Clerk
5. After phone verification, user data synced to database via `/api/users/sync`
6. User redirected to `/onboarding` (if not completed) or `/app/dashboard`

### Admin Setup
- Admins are identified by `isAdmin: true` in Clerk publicMetadata
- Set in Clerk Dashboard → Users → [Select User] → Metadata → Public Metadata
- Admin portal accessible at `/admin/brands` and `/admin/settings`
- 2FA can be enabled via Clerk Dashboard or Admin Settings page
- Admin Settings includes toggle to require 2FA for all admins

### Data Model
Core entities follow a multi-tenant pattern:
- **Users**: Synced from Clerk (id from Clerk, phoneVerified, isAdmin flags)
- **Brands**: Root tenant entity with tier-based capabilities
- **Competitors**: Tracked competitor brands per tenant
- **Topics**: Industry categories for prompt clustering
- **Prompts**: Query templates tracked across AI models
- **Sources**: Citation domains referenced by LLMs
- **Integrations**: Third-party service connections (GSC, social)

### Subscription Tiers
Plan capabilities are enforced on both frontend and backend:
- Free: 3 competitors, 15 queries, no integrations
- Starter: 5 competitors, GSC + Twitter integration
- Growth: 15 competitors, exports enabled, full social integration
- Enterprise: Unlimited with custom limits

## External Dependencies

### Authentication
- **Clerk**: Handles user authentication, phone verification, and session management
- Requires `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` environment variables
- Supports email/password, Google OAuth, and phone verification
- Supports 2FA/MFA for admin users via Clerk built-in authentication

### Database
- **PostgreSQL**: Primary data store
- Requires `DATABASE_URL` environment variable
- Migrations managed via Drizzle Kit (`npm run db:push`)

### Frontend Dependencies
- @clerk/clerk-react: React components for Clerk authentication
- @clerk/themes: Pre-built themes for Clerk UI
- @clerk/clerk-sdk-node: Server-side Clerk SDK
- Radix UI primitives for accessible component foundations
- class-variance-authority for component variant management
- date-fns for date formatting
- cmdk for command palette functionality

### Build Tools
- **Vite**: Frontend dev server and bundler
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

## Environment Variables

Required environment variables are documented in `.env.example`:

```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Demo Mode

If Clerk keys are not configured, the app runs in demo mode:
- Authentication bypassed (any token accepted)
- All data is mocked from client/src/lib/mock-data.ts
- Useful for UI/UX development and design reviews
- Console warning displayed: "Missing Clerk Publishable Key - using demo mode"

## Known Limitations

### Current Implementation Status
- **Frontend**: 100% complete with mock data integration and enhanced UI
- **Backend API**: 70% complete (CRUD for all entities, admin routes, audit logging)
- **Database Schema**: 90% complete (all enterprise tables added)
- **Admin Portal**: 100% complete (Plans, Prompts, Brands, Audit Logs UI and API)
- **Context Engine**: 0% (no background jobs, LLM API calls, or ingestion pipeline)
- **External APIs**: 0% (no connectors for LLMs, enrichment, or analytics services)
- **AXP/FAQ/Schema Publisher**: 5% (UI mockup only, no backend)

### Missing Components
- Background job queue system (BullMQ/pg-boss)
- LLM API connectors (OpenAI, Anthropic, Google, Perplexity)
- External API integrations (Google Search Console, social platforms)
- Content generation and publishing pipeline
- Usage metering and billing integration (Stripe/Razorpay)

## Next Steps

To complete the MVP:
1. Implement context engine with job queue and LLM API calls
2. Add external API connectors for enrichment and analytics
3. Integrate frontend with real API endpoints (replace mock data)
4. Implement background workers for scheduled tasks
5. Add billing integration (Stripe/Razorpay)
