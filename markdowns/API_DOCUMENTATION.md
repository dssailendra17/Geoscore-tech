# GeoScore API Documentation

## Overview

GeoScore provides a RESTful API for managing brands, prompts, competitors, and AI visibility tracking.

**Base URL**: `https://your-domain.com/api`

**Authentication**: All requests require authentication via Clerk session cookies.

## Authentication

### Session-Based Auth

All API requests use session cookies set by Clerk authentication.

**Headers**:
```
Content-Type: application/json
Cookie: __session=...
```

## API Endpoints

### Brands

#### Get User's Brands

```http
GET /api/brands
```

**Response**:
```json
[
  {
    "id": "brand_123",
    "name": "Acme Corp",
    "description": "Leading project management software",
    "industry": "SaaS",
    "website": "https://acme.com",
    "userId": "user_123",
    "createdAt": "2026-01-20T10:00:00Z"
  }
]
```

#### Get Brand Details

```http
GET /api/brands/:brandId
```

**Response**:
```json
{
  "id": "brand_123",
  "name": "Acme Corp",
  "description": "Leading project management software",
  "industry": "SaaS",
  "website": "https://acme.com",
  "userId": "user_123",
  "createdAt": "2026-01-20T10:00:00Z"
}
```

#### Create Brand

```http
POST /api/brands
```

**Request Body**:
```json
{
  "name": "Acme Corp",
  "description": "Leading project management software",
  "industry": "SaaS",
  "website": "https://acme.com"
}
```

#### Update Brand

```http
PATCH /api/brands/:brandId
```

**Request Body**:
```json
{
  "description": "Updated description",
  "industry": "Technology"
}
```

#### Delete Brand

```http
DELETE /api/brands/:brandId
```

### Brand Context

#### Get Brand Context

```http
GET /api/brands/:brandId/context
```

**Response**:
```json
{
  "id": "context_123",
  "brandId": "brand_123",
  "overview": "Acme Corp is a leading project management platform...",
  "keyFeatures": ["Task management", "Team collaboration"],
  "targetAudience": "Small to medium businesses",
  "differentiators": ["AI-powered insights", "Easy to use"],
  "updatedAt": "2026-01-20T10:00:00Z"
}
```

#### Update Brand Context

```http
POST /api/brands/:brandId/context
```

**Request Body**:
```json
{
  "overview": "Updated overview",
  "keyFeatures": ["Feature 1", "Feature 2"],
  "targetAudience": "Enterprise teams",
  "differentiators": ["Unique selling point"]
}
```

### Competitors

#### Get Competitors

```http
GET /api/brands/:brandId/competitors
```

#### Add Competitor

```http
POST /api/brands/:brandId/competitors
```

**Request Body**:
```json
{
  "name": "Competitor Inc",
  "website": "https://competitor.com",
  "description": "Main competitor"
}
```

#### Delete Competitor

```http
DELETE /api/competitors/:competitorId
```

### Prompts

#### Get Prompts

```http
GET /api/brands/:brandId/prompts
```

#### Create Prompt

```http
POST /api/brands/:brandId/prompts
```

**Request Body**:
```json
{
  "text": "What are the best project management tools?",
  "category": "product_comparison",
  "targetProviders": ["openai", "anthropic"]
}
```

#### Update Prompt

```http
PATCH /api/prompts/:promptId
```

#### Delete Prompt

```http
DELETE /api/prompts/:promptId
```

#### Sample Prompt (Trigger LLM Analysis)

```http
POST /api/prompts/:promptId/sample
```

**Request Body**:
```json
{
  "providers": ["openai", "anthropic", "google"]
}
```

**Response**:
```json
{
  "jobId": "job_123",
  "status": "queued",
  "message": "LLM sampling job created"
}
```

### Jobs

#### Get Job Status

```http
GET /api/jobs/:jobId/status
```

**Response**:
```json
{
  "id": "job_123",
  "type": "llm_sampling",
  "status": "completed",
  "progress": 100,
  "result": {
    "openai": {
      "mentioned": true,
      "position": 2,
      "response": "..."
    }
  },
  "createdAt": "2026-01-20T10:00:00Z",
  "completedAt": "2026-01-20T10:05:00Z"
}
```

#### Get Brand Jobs

```http
GET /api/brands/:brandId/jobs
```

#### Get Job Statistics

```http
GET /api/jobs/stats
```

### Topics

#### Get Topics

```http
GET /api/brands/:brandId/topics
```

#### Create Topic

```http
POST /api/brands/:brandId/topics
```

**Request Body**:
```json
{
  "name": "Project Management",
  "description": "Software for managing projects"
}
```

### Sources

#### Get Sources

```http
GET /api/brands/:brandId/sources
```

#### Add Source

```http
POST /api/brands/:brandId/sources
```

**Request Body**:
```json
{
  "url": "https://techcrunch.com/article",
  "title": "Best Project Management Tools 2026",
  "type": "article",
  "citationCount": 5
}
```

### Content Management

#### Get AXP Pages

```http
GET /api/brands/:brandId/axp-pages
```

#### Create AXP Page

```http
POST /api/brands/:brandId/axp-pages
```

#### Get FAQs

```http
GET /api/brands/:brandId/faqs
```

#### Create FAQ

```http
POST /api/brands/:brandId/faqs
```

## Admin Endpoints

Require admin role (configured via ADMIN_EMAILS).

### Admin: Brands

```http
GET /api/admin/brands
GET /api/admin/brands/:brandId
PATCH /api/admin/brands/:brandId
DELETE /api/admin/brands/:brandId
```

### Admin: Users

```http
GET /api/admin/users
GET /api/admin/users/:userId
```

### Admin: Plans

```http
GET /api/admin/plans
POST /api/admin/plans
PATCH /api/admin/plans/:planId
```

### Admin: Analytics

```http
GET /api/admin/analytics/overview
GET /api/admin/analytics/usage
```

## Error Responses

### 400 Bad Request

```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized

```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "message": "Admin access required"
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

## Rate Limiting

- **Free Plan**: 100 requests/hour
- **Starter Plan**: 500 requests/hour
- **Professional Plan**: 2000 requests/hour
- **Enterprise Plan**: Custom limits

## Webhooks (Coming Soon)

Subscribe to events:
- `brand.created`
- `job.completed`
- `visibility.changed`

## SDK Support (Coming Soon)

Official SDKs planned for:
- JavaScript/TypeScript
- Python
- Ruby
- PHP

## Integrations

GeoScore integrates with multiple external services for comprehensive brand intelligence.

### Available LLM Providers

The platform supports 7 LLM providers:

1. **OpenAI** - GPT-4, GPT-4o, GPT-3.5-turbo
2. **Anthropic** - Claude 3.5 Sonnet, Haiku, Opus
3. **Google** - Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash
4. **Perplexity** - Llama 3.1 Sonar models with online search
5. **Grok (xAI)** - Grok Beta, Grok Vision
6. **DeepSeek** - DeepSeek Chat, DeepSeek Coder
7. **OpenRouter** - Access to 100+ models

**Configuration**: Set API keys in `.env` file. At least one provider required.

### Google Ecosystem

- **Search Console** - Search performance and indexing
- **Business Profile** - Business listings and reviews
- **Analytics 4** - Website analytics and user behavior
- **Ads** - Campaign performance and keywords
- **AI Overviews** - Track AI-generated search summaries
- **Knowledge Graph** - Entity data and relationships

### Social Media Platforms

- **Twitter/X** - Brand mentions and engagement
- **LinkedIn** - Company page performance
- **YouTube** - Video mentions and channel analytics
- **Meta (Facebook/Instagram)** - Social presence tracking

### Brand Enrichment

- **Brand.dev** - Brand data, logos, colors, fonts
- **Google Knowledge Graph** - Structured entity data
- **Wikidata** - Free, open-source structured data

### SERP & Search

- **DataForSEO** - SERP data and search rankings

### Payment Gateway

- **Razorpay** - Subscription and payment processing

**For detailed integration setup**, see `INTEGRATIONS_GUIDE.md`.

## Support

API questions: api@geoscore.com

