# GeoScore Setup Checklist

This checklist will guide you through setting up GeoScore for the first time.

## ✅ Prerequisites

- [ ] Node.js 20+ installed
- [ ] PostgreSQL 16+ database access
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 📦 Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd geoscore
npm install
```

- [ ] Repository cloned
- [ ] Dependencies installed

## 🔧 Environment Configuration

### 2. Create .env File

Copy the template:
```bash
cp .env.example .env
```

- [ ] .env file created

### 3. Configure Database

**Required**: Set your PostgreSQL connection string

```env
DATABASE_URL=postgresql://user:password@host:5432/geoscore
```

- [ ] DATABASE_URL configured
- [ ] Database is accessible

### 4. Run Database Migrations

```bash
npm run db:push
```

- [ ] Migrations completed successfully
- [ ] All tables created

### 5. Configure Authentication (Clerk)

**Required**: Get your Clerk API keys

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy your keys to .env:

```env
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

4. Configure sign-in methods in Clerk dashboard:
   - [ ] Email/Password enabled
   - [ ] Phone (SMS) enabled (optional)
   - [ ] Google OAuth enabled (optional)
   - [ ] 2FA enabled (recommended)

- [ ] Clerk account created
- [ ] Application created
- [ ] API keys configured
- [ ] Sign-in methods configured

### 6. Set Admin Emails

**Required**: Configure admin access

```env
ADMIN_EMAILS=your-email@example.com
```

- [ ] Admin email(s) configured

### 7. Configure LLM APIs

**Required**: At least ONE LLM provider (7 available)

#### Primary Providers (Recommended)

**OpenAI** (Recommended for general use):
```env
OPENAI_API_KEY=sk-...
```
Get from: https://platform.openai.com/api-keys
- [ ] OpenAI API key configured

**Anthropic** (Best for long-form analysis):
```env
ANTHROPIC_API_KEY=sk-ant-...
```
Get from: https://console.anthropic.com/
- [ ] Anthropic API key configured

**Google** (Fast and multimodal):
```env
GOOGLE_API_KEY=...
```
Get from: https://aistudio.google.com/app/apikey
- [ ] Google API key configured

#### Additional Providers (Optional)

**Perplexity** (Real-time web search):
```env
PERPLEXITY_API_KEY=pplx-...
```
Get from: https://www.perplexity.ai/settings/api
- [ ] Perplexity API key configured

**Grok (xAI)** (Alternative perspective):
```env
GROK_API_KEY=xai-...
```
Get from: https://console.x.ai/
- [ ] Grok API key configured

**DeepSeek** (Cost-effective):
```env
DEEPSEEK_API_KEY=sk-...
```
Get from: https://platform.deepseek.com/
- [ ] DeepSeek API key configured

**OpenRouter** (Access to 100+ models):
```env
OPENROUTER_API_KEY=sk-or-v1-...
```
Get from: https://openrouter.ai/keys
- [ ] OpenRouter API key configured

### 8. Configure Payment Gateway (Optional)

**For Razorpay (Indian market)**:

1. Go to https://dashboard.razorpay.com/
2. Create account
3. Get API keys (test mode first)
4. Add to .env:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

- [ ] Razorpay account created
- [ ] Test API keys configured
- [ ] Webhook configured (after deployment)

### 9. Configure Brand Enrichment APIs (Optional)

#### Brand.dev
```env
BRAND_DEV_API_KEY=...
```
Get from: https://brand.dev
- [ ] Brand.dev API key configured

#### Google Knowledge Graph
```env
GOOGLE_KG_API_KEY=...
```
Get from: https://console.cloud.google.com/
- [ ] Google KG API key configured

#### DataForSEO (SERP data)
```env
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
```
Get from: https://dataforseo.com/
- [ ] DataForSEO credentials configured

### 10. Configure Google Ecosystem (Optional)

**Google Search Console**:
```env
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=...
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=...
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://yoursite.com
```
- [ ] Search Console configured

**Google Analytics 4**:
```env
GOOGLE_ANALYTICS_PROPERTY_ID=...
GOOGLE_ANALYTICS_CLIENT_EMAIL=...
GOOGLE_ANALYTICS_PRIVATE_KEY=...
```
- [ ] Analytics configured

**Google Ads**:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=...
```
- [ ] Google Ads configured

**Google Business Profile**:
```env
GOOGLE_BUSINESS_PROFILE_API_KEY=...
GOOGLE_BUSINESS_ACCOUNT_ID=...
```
- [ ] Business Profile configured

### 11. Configure Social Media (Optional)

**Twitter/X**:
```env
TWITTER_BEARER_TOKEN=...
```
Get from: https://developer.twitter.com/
- [ ] Twitter configured

**LinkedIn**:
```env
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_ORGANIZATION_ID=...
```
Get from: https://www.linkedin.com/developers/
- [ ] LinkedIn configured

**YouTube**:
```env
YOUTUBE_API_KEY=...
YOUTUBE_CHANNEL_ID=...
```
Get from: https://console.cloud.google.com/
- [ ] YouTube configured

**Meta (Facebook/Instagram)**:
```env
META_ACCESS_TOKEN=...
META_PAGE_ID=...
META_INSTAGRAM_ACCOUNT_ID=...
```
Get from: https://developers.facebook.com/
- [ ] Meta configured

## 🚀 First Run

### 12. Start Development Server

```bash
npm run dev
```

- [ ] Server started successfully
- [ ] No errors in console
- [ ] Application accessible at http://localhost:5000

### 13. Verify Backend Connection

Check server logs for:
```
✓ Initializing external integrations...
✓ External integrations initialized successfully
✓ Initializing job system...
✓ Job system initialized successfully
✓ serving on port 5000
```

- [ ] Integrations initialized
- [ ] Job system initialized
- [ ] Server running on port 5000

## 🧪 Testing

### 12. Test User Registration

1. Open http://localhost:5000
2. Click "Sign Up"
3. Create account with your admin email
4. Verify email (if required)

- [ ] Registration works
- [ ] Email verification works (if enabled)
- [ ] Can sign in successfully

### 13. Test Admin Access

1. Sign in with admin email
2. Check sidebar for "Admin" section
3. Navigate to Admin → Dashboard

- [ ] Admin menu visible
- [ ] Admin dashboard accessible
- [ ] Admin features working

### 14. Test Brand Onboarding

1. Complete onboarding flow
2. Create first brand
3. Add competitors (optional)
4. Add topics
5. Create first prompt

- [ ] Brand creation works
- [ ] Onboarding flow completes
- [ ] Brand appears in dashboard

### 15. Test LLM Sampling (If API keys configured)

1. Go to Prompts page
2. Click "Sample Now" on a prompt
3. Check job status
4. Wait for completion
5. View results

- [ ] Job created successfully
- [ ] Job processes and completes
- [ ] Results displayed correctly

### 16. Test Job System

1. Go to Admin → Jobs
2. View job list
3. Check job statistics
4. Verify jobs are processing

- [ ] Jobs appear in admin panel
- [ ] Job status updates correctly
- [ ] Job statistics accurate

## 📚 Documentation Review

### 17. Review Documentation

- [ ] Read USER_GUIDE.md
- [ ] Read ADMIN_GUIDE.md
- [ ] Read API_DOCUMENTATION.md
- [ ] Read DEPLOYMENT_GUIDE.md

### 18. Review Legal Documents

- [ ] Review TERMS_OF_SERVICE.md
- [ ] Review PRIVACY_POLICY.md
- [ ] Review REFUND_POLICY.md
- [ ] Customize with your business details

## 🔒 Security

### 19. Security Checklist

- [ ] .env file in .gitignore
- [ ] Strong admin passwords set
- [ ] 2FA enabled for admin accounts
- [ ] Database password is strong
- [ ] API keys are valid and active
- [ ] No sensitive data in version control

## 🎯 Production Preparation

### 20. Production Environment

- [ ] Production database set up
- [ ] Production Clerk app created
- [ ] Production API keys obtained
- [ ] Razorpay in live mode (if using)
- [ ] Domain configured
- [ ] SSL certificate configured
- [ ] Environment variables set in production

### 21. Build and Deploy

```bash
npm run build
```

- [ ] Build completes successfully
- [ ] No build errors
- [ ] dist/ folder created

### 22. Production Testing

- [ ] Application accessible via domain
- [ ] HTTPS working
- [ ] Authentication working
- [ ] Database connected
- [ ] Jobs processing
- [ ] Payments working (if configured)

## 📊 Monitoring

### 23. Set Up Monitoring

- [ ] Error logging configured
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured
- [ ] Database backups scheduled
- [ ] Alert notifications configured

## ✨ Launch!

### 24. Go Live

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Legal pages accessible
- [ ] Support email configured
- [ ] Announcement prepared
- [ ] Marketing materials ready

## 🎉 Post-Launch

### 25. Post-Launch Tasks

- [ ] Monitor error logs
- [ ] Check user registrations
- [ ] Verify job processing
- [ ] Monitor performance
- [ ] Respond to user feedback
- [ ] Plan next features

---

## Need Help?

- **Documentation**: Review all .md files in the project
- **Issues**: Check server logs and browser console
- **Support**: Create an issue in the repository

## Quick Reference

**Start Development**:
```bash
npm run dev
```

**Run Migrations**:
```bash
npm run db:push
```

**Build for Production**:
```bash
npm run build
```

**Start Production**:
```bash
npm start
```

---

**Congratulations!** 🎉 You've successfully set up GeoScore!

