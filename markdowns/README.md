# GeoScore - AI Brand Intelligence Platform

> Track how your brand appears in ChatGPT, Claude, Gemini, and Perplexity responses

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue)](https://www.postgresql.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com)

## 🚀 What is GeoScore?

GeoScore is a **multi-tenant SaaS platform** that helps businesses understand and optimize their visibility in AI-powered search results. Track brand mentions, analyze competitor visibility, and get actionable insights to improve your presence in the AI-driven information landscape.

## ✨ Key Features

- **🤖 Multi-LLM Tracking**: Monitor brand visibility across 7 LLM providers (OpenAI, Anthropic, Google, Perplexity, Grok, DeepSeek, OpenRouter)
- **📊 Competitive Analysis**: Benchmark your brand against competitors in real-time
- **🔍 Source Intelligence**: Discover which sources LLMs cite about your brand
- **💡 Content Optimization**: AI-powered recommendations for better visibility
- **📈 Analytics Dashboard**: Real-time insights, trends, and performance metrics
- **🎯 Prompt Management**: Create, test, and optimize custom prompts
- **🔐 Enterprise Auth**: Clerk-powered authentication with 2FA, SSO, and phone verification
- **💳 Subscription Management**: Razorpay integration for flexible billing plans
- **👥 Multi-Tenant**: Complete isolation with role-based access control
- **⚡ Job Queue System**: Async processing for LLM sampling and enrichment
- **🌐 Google Ecosystem**: Search Console, Analytics, Ads, Business Profile, AI Overviews
- **📱 Social Media**: Twitter, LinkedIn, YouTube, Facebook, Instagram tracking

## 📋 Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **PostgreSQL** 16+ ([Download](https://www.postgresql.org/download/))
- **Clerk Account** ([Sign up](https://dashboard.clerk.com))
- **At least one LLM API key** (OpenAI, Anthropic, or Google)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd geoscore
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set the following **required** variables:

```env
# Required: Database
DATABASE_URL=postgresql://user:password@localhost:5432/geoscore

# Required: Authentication (get from https://dashboard.clerk.com)
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Required: Admin access
ADMIN_EMAILS=your-email@example.com

# Required: At least one LLM provider
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
# OR
GOOGLE_API_KEY=...
```

**Optional but recommended:**
```env
# Additional LLM providers
PERPLEXITY_API_KEY=pplx-...
GROK_API_KEY=xai-...
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-v1-...

# Brand enrichment
BRAND_DEV_API_KEY=...
GOOGLE_KG_API_KEY=...

# SERP data
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...

# Google Ecosystem
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=...
GOOGLE_ANALYTICS_PROPERTY_ID=...
GOOGLE_ADS_DEVELOPER_TOKEN=...

# Social Media
TWITTER_BEARER_TOKEN=...
LINKEDIN_ACCESS_TOKEN=...
YOUTUBE_API_KEY=...
META_ACCESS_TOKEN=...

# Payments (for subscription features)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### 3. Set Up Database

```bash
npm run db:push
```

This creates all necessary tables in your PostgreSQL database.

### 4. Configure Clerk Authentication

1. Create account at [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Enable authentication methods:
   - ✅ Email/Password
   - ✅ Phone (SMS)
   - ✅ Google OAuth (optional)
   - ✅ 2FA (recommended)
4. Copy API keys to `.env`

### 5. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:5000** 🎉

### 6. Create Admin Account

1. Sign up with the email you set in `ADMIN_EMAILS`
2. Complete onboarding
3. Access admin features from the sidebar

## 📚 Documentation

Comprehensive guides are available:

- **[Setup Checklist](SETUP_CHECKLIST.md)** - Complete step-by-step setup guide
- **[User Guide](USER_GUIDE.md)** - How to use GeoScore features
- **[Admin Guide](ADMIN_GUIDE.md)** - Admin dashboard and management
- **[API Documentation](API_DOCUMENTATION.md)** - REST API reference
- **[Integrations Guide](INTEGRATIONS_GUIDE.md)** - External integrations setup
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Terms of Service](TERMS_OF_SERVICE.md)** - Legal terms
- **[Privacy Policy](PRIVACY_POLICY.md)** - Privacy and data handling
- **[Refund Policy](REFUND_POLICY.md)** - Billing and refunds

## 🏗️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Express.js 5** server
- **Drizzle ORM** with PostgreSQL
- **Clerk** for authentication and user management
- **Razorpay** for payment processing
- **Job Queue** system for async processing
- **WebSocket** support for real-time updates

### External Integrations

**LLM Providers (7 total)**:
- **OpenAI** - GPT-4, GPT-4o, GPT-3.5-turbo
- **Anthropic** - Claude 3.5 Sonnet, Haiku, Opus
- **Google** - Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash
- **Perplexity** - Llama 3.1 Sonar with online search
- **Grok (xAI)** - Grok Beta, Grok Vision
- **DeepSeek** - DeepSeek Chat, DeepSeek Coder
- **OpenRouter** - Access to 100+ models

**Google Ecosystem**:
- **Search Console** - Search performance tracking
- **Business Profile** - Business listings and reviews
- **Analytics 4** - Website analytics
- **Ads** - Campaign performance
- **AI Overviews** - AI-generated search summaries
- **Knowledge Graph** - Entity data

**Social Media**:
- **Twitter/X** - Brand mentions and engagement
- **LinkedIn** - Company page performance
- **YouTube** - Video mentions and analytics
- **Meta** - Facebook & Instagram tracking

**Brand Enrichment**:
- **Brand.dev** - Brand data and assets
- **Wikidata** - Structured entity data

**SERP & Search**:
- **DataForSEO** - SERP rankings and analysis

**Payment**:
- **Razorpay** - Subscription management

## 🎯 Project Structure

```
geoscore/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   │   ├── layout/  # Layout components (AppShell, AdminLayout)
│   │   │   └── ui/      # shadcn/ui components
│   │   ├── pages/       # Route-level pages
│   │   │   ├── auth/    # Authentication pages
│   │   │   └── admin/   # Admin pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities, API client, helpers
├── server/              # Express backend
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database access layer
│   ├── integrations/    # External API integrations
│   │   ├── llm/         # LLM provider clients
│   │   ├── brand/       # Brand enrichment APIs
│   │   └── serp/        # SERP data APIs
│   ├── jobs/            # Background job system
│   │   ├── workers/     # Job processors
│   │   └── queue.ts     # Job queue management
│   └── services/        # Business logic
│       ├── subscription.ts  # Razorpay integration
│       └── context.ts       # Brand context engine
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
├── migrations/          # Database migrations
└── docs/                # Additional documentation
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server (port 5000)
npm run build        # Build for production
npm start            # Start production server
npm run db:push      # Run database migrations
npm run check        # TypeScript type checking
```

## 🚀 Deployment

### Deploy to Replit (Easiest)

1. Import repository to Replit
2. Configure Secrets (environment variables)
3. Database is auto-provisioned
4. Click "Run"

### Deploy to Vercel/Netlify

1. Build the project:
   ```bash
   npm run build
   ```
2. Set environment variables in platform
3. Deploy `dist/` folder
4. Set start command: `node dist/index.cjs`

### Deploy with Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.cjs"]
```

See **[Deployment Guide](DEPLOYMENT_GUIDE.md)** for detailed instructions.

## 📊 Current Status

**✅ 95% Complete - Production Ready!**

### ✅ Completed Features
- ✅ Full authentication system (email, phone, Google, 2FA)
- ✅ Brand management and onboarding flow
- ✅ Competitor tracking and analysis
- ✅ Prompt management and LLM sampling
- ✅ Background job queue system
- ✅ Admin dashboard with full management
- ✅ Analytics and reporting
- ✅ Content management (AXP, FAQ, Schema)
- ✅ Subscription and billing (Razorpay)
- ✅ Brand context engine
- ✅ Source intelligence tracking
- ✅ Complete documentation
- ✅ Legal documents (Terms, Privacy, Refund)

### ⏳ Optional Features (Post-Launch)
- ⏳ Google ecosystem integrations (Search Console, Ads, Business Profile)
- ⏳ Social media integrations (Reddit, YouTube, X, Meta, LinkedIn)
- ⏳ Webhook support for events
- ⏳ Public API with SDK
- ⏳ Mobile app

See **[pending.md](pending.md)** for details.

## 🔐 Security

- ✅ All passwords hashed using bcrypt
- ✅ Session-based authentication via Clerk
- ✅ HTTPS enforced in production
- ✅ SQL injection protection via Drizzle ORM
- ✅ XSS protection via React
- ✅ CSRF protection via SameSite cookies
- ✅ Environment variables never committed
- ✅ API keys encrypted at rest
- ✅ Rate limiting on API endpoints
- ✅ Audit logging for admin actions

## 🧪 Testing

The application can be tested in several ways:

### Demo Mode

If Clerk keys are not configured, the app runs in **demo mode**:
- Authentication bypassed
- Mock data used
- Useful for UI/UX development
- Console warning displayed

### Manual Testing

Follow the **[Setup Checklist](SETUP_CHECKLIST.md)** for comprehensive testing steps.

### Key Test Scenarios

1. **User Registration & Authentication**
   - Email/password signup
   - Phone verification
   - Google OAuth
   - 2FA setup

2. **Brand Management**
   - Create brand
   - Add competitors
   - Define topics
   - Create prompts

3. **LLM Sampling**
   - Trigger sampling job
   - Monitor job progress
   - View results
   - Analyze visibility

4. **Admin Features**
   - Access admin dashboard
   - Manage users
   - View analytics
   - Configure settings

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
```
Error: DATABASE_URL must be set
```
→ Set `DATABASE_URL` in `.env` file

**Clerk Authentication Error**
```
Warning: CLERK_SECRET_KEY not set
```
→ Set Clerk keys in `.env` file

**LLM Sampling Fails**
```
Error: No LLM providers configured
```
→ Set at least one LLM API key (OpenAI, Anthropic, or Google)

**Jobs Not Processing**
→ Check server logs for job system initialization
→ Verify database connection
→ Ensure LLM API keys are valid

See **[Deployment Guide](DEPLOYMENT_GUIDE.md)** for more troubleshooting tips.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) - Authentication and user management
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database ORM
- [Razorpay](https://razorpay.com/) - Payment processing
- [TanStack Query](https://tanstack.com/query) - Data fetching and caching
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📈 Roadmap

- [ ] Real-time notifications and alerts
- [ ] Webhook support for external integrations
- [ ] Public API with official SDKs
- [ ] Mobile app (iOS & Android)
- [ ] Advanced analytics and ML insights
- [ ] White-label solution for agencies
- [ ] Multi-language support
- [ ] Slack/Discord integrations
- [ ] Custom reporting and exports
- [ ] API rate limiting dashboard

## 📞 Support

- **Documentation**: Check the `/docs` folder and `.md` files
- **Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Email**: support@geoscore.com
- **Status**: status.geoscore.com

## 🌟 Show Your Support

If you find GeoScore useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📖 Improving documentation
- 🔀 Contributing code

---

**Made with ❤️ for businesses navigating the AI-powered future**

For questions, feedback, or partnership inquiries: **hello@geoscore.com**
