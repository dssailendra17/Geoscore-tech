technical guide for confirming the backend connection to frontend pages.

1. Dashboard Page (/app/dashboard)
Data Requirements
Metric	Source	Calculation
AI Visibility Score	LLM API responses	(brand_mentions / total_prompts_analyzed) × 100 weighted by model importance
Score Trend	Historical snapshots	Compare current score vs 7/30 days ago
Topic Performance	Prompt categorization	Group prompts by topic, calculate mention rate per topic
Model Breakdown	Per-model tracking	Separate scores for ChatGPT, Claude, Gemini, Perplexity
API Endpoints
GET /api/brands/:brandId/dashboard/summary
GET /api/brands/:brandId/dashboard/visibility-score
GET /api/brands/:brandId/dashboard/trends?period=7d|30d|90d
GET /api/brands/:brandId/dashboard/model-breakdown
GET /api/brands/:brandId/dashboard/topic-performance
Visibility Score Calculation
visibility_score = Σ(model_weight × model_score) / Σ(model_weights)
model_score = (positive_mentions × 1.0 + neutral_mentions × 0.5) / total_responses × 100
model_weights:
  - ChatGPT: 0.35 (highest market share)
  - Claude: 0.25
  - Gemini: 0.25
  - Perplexity: 0.15
mention_types:
  - positive: brand recommended, praised, or cited as solution
  - neutral: brand mentioned without sentiment
  - negative: brand criticized or warned against (reduces score)
Trend Calculation
trend_delta = current_score - previous_period_score
trend_percentage = (trend_delta / previous_period_score) × 100
2. Prompts Page (/app/prompts)
Data Flow
Prompt Library: Store curated prompts relevant to brand's industry
Execution Engine: Run prompts against each LLM API
Response Analysis: Parse responses for brand mentions, sentiment, position
API Endpoints
GET /api/brands/:brandId/prompts
POST /api/brands/:brandId/prompts (admin only)
GET /api/brands/:brandId/prompts/:promptId/results
POST /api/brands/:brandId/prompts/:promptId/run
GET /api/brands/:brandId/prompts/performance
Prompt Performance Metrics
mention_rate = prompts_with_brand_mention / total_prompts_run × 100
avg_position = Σ(position_in_response) / mentions_count
  - Position 1: First mentioned
  - Position 2: Second mentioned, etc.
  - No mention: excluded from average
sentiment_score = (positive_count × 1 + neutral_count × 0 + negative_count × -1) / total_mentions
  - Range: -1 to +1, displayed as percentage
citation_rate = responses_with_source_link / total_responses × 100
LLM API Integration Pattern
// Pseudo-code for prompt execution
async function runPrompt(promptId, brandId) {
  const prompt = await getPrompt(promptId);
  const results = await Promise.all([
    callOpenAI(prompt.text),      // ChatGPT
    callAnthropic(prompt.text),   // Claude
    callGoogle(prompt.text),      // Gemini
    callPerplexity(prompt.text)   // Perplexity (includes citations)
  ]);
  
  for (const result of results) {
    await analyzeResponse(result, brandId);
    await storeResult(promptId, result);
  }
}
3. Competitors Page (/app/competitors)
Data Structure
competitor_tracking:
  - competitor_id
  - brand_name
  - domain
  - tracked_since
  - visibility_score (same calculation as brand)
API Endpoints
GET /api/brands/:brandId/competitors
POST /api/brands/:brandId/competitors
DELETE /api/brands/:brandId/competitors/:competitorId
GET /api/brands/:brandId/competitors/matrix
GET /api/brands/:brandId/competitors/:competitorId/comparison
Visibility Matrix Calculation
For each prompt in shared prompt set:
  - Run against all LLMs
  - Track which brand/competitor gets mentioned
  - Calculate head-to-head win rate
head_to_head_score = prompts_where_brand_beats_competitor / total_shared_prompts × 100
market_share = brand_mentions / (brand_mentions + all_competitor_mentions) × 100
competitive_gap = competitor_score - brand_score
  - Positive: competitor ahead
  - Negative: brand ahead
Model Breakdown Comparison
per_model_comparison = {
  model: "chatgpt",
  brand_score: 72,
  competitor_scores: [
    { name: "Competitor A", score: 68 },
    { name: "Competitor B", score: 75 }
  ],
  brand_rank: 2  // out of tracked entities
}
4. Sources Page (/app/sources)
What Sources Track
LLMs cite external URLs (especially Perplexity). Track which domains appear when your brand is mentioned.

API Endpoints
GET /api/brands/:brandId/sources
GET /api/brands/:brandId/sources/domains
GET /api/brands/:brandId/sources/:sourceId/mentions
GET /api/brands/:brandId/sources/recommendations
Source Metrics
citation_frequency = times_domain_cited / total_responses_with_citations
influence_score = (citation_frequency × 0.4) + (domain_authority × 0.3) + (recency × 0.3)
  - domain_authority: from external API (Moz, Ahrefs) or estimated
  - recency: how recently cited (exponential decay)
source_types:
  - owned: your brand's domain
  - earned: third-party mentions (reviews, articles)
  - competitor: competitor domains
  - neutral: Wikipedia, news sites
Domain De-duplication (using domain_registry table)
-- Check if domain data exists and is fresh
SELECT * FROM domain_registry 
WHERE domain = 'example.com' 
AND last_enriched > NOW() - INTERVAL '30 days';
-- If fresh, reuse cached enrichment data
-- If stale or missing, fetch and cache
5. Gap Analysis Page (/app/gap-analysis)
Opportunity Matrix Calculation
For each topic/prompt category:
  - effort_score: estimated resources to improve (1-10)
  - impact_score: potential visibility gain (1-10)
Quadrants:
  Quick Wins: high impact (>7), low effort (<4)
  Big Bets: high impact (>7), high effort (>6)
  Fill-Ins: low impact (<4), low effort (<4)
  Long-Term: low impact (<4), high effort (>6)
API Endpoints
GET /api/brands/:brandId/gap-analysis/opportunities
GET /api/brands/:brandId/gap-analysis/roadmap
GET /api/brands/:brandId/gap-analysis/capacity
Impact Score Calculation
impact_score = (
  search_volume × 0.3 +           // how often topic is queried
  competitor_gap × 0.3 +          // how far behind competitors
  business_relevance × 0.2 +      // alignment with brand offerings
  trend_momentum × 0.2            // is topic growing or declining
)
effort_score = (
  content_gap × 0.4 +             // how much content needs creation
  technical_complexity × 0.3 +    // schema, AXP requirements
  resource_availability × 0.3     // team capacity
)
6. Content & AXP Page (/app/content-axp)
AXP (AI-Optimized Experience Pages)
Purpose: Static HTML pages optimized for LLM crawlers with structured data.

AXP Hosting Architecture
Brand's Website (main domain)
├── /about
├── /products
└── /.well-known/ai-plugin.json  ← Optional: AI plugin manifest
AXP Subdomain (axp.brand.com)
├── /about-acme          ← AXP mirror of /about
├── /product-xyz         ← AXP mirror of product page
└── /faqs               ← Consolidated FAQ page
DNS Setup:
  axp.brand.com → CNAME → geoscore-axp.your-platform.com
  OR
  axp.brand.com → A → Your server IP
AXP Page Structure
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>About Acme Corp | AXP</title>
  <link rel="canonical" href="https://acme.com/about">
  <meta name="robots" content="noindex, follow">
  
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Acme Corp",
    "url": "https://acme.com",
    ...
  }
  </script>
</head>
<body>
  <!-- Clean, semantic HTML without JS -->
  <main>
    <h1>About Acme Corp</h1>
    <p>Structured content optimized for AI parsing...</p>
  </main>
</body>
</html>
API Endpoints
GET /api/brands/:brandId/axp/pages
GET /api/brands/:brandId/axp/pages/:pageId
GET /api/brands/:brandId/axp/pages/:pageId/html  ← Rendered HTML
POST /api/admin/brands/:brandId/axp/pages        ← Admin only
PUT /api/admin/brands/:brandId/axp/pages/:pageId
DELETE /api/admin/brands/:brandId/axp/pages/:pageId
GET /api/brands/:brandId/faqs
POST /api/admin/brands/:brandId/faqs
GET /api/brands/:brandId/schemas
POST /api/admin/brands/:brandId/schemas
GET /api/brands/:brandId/embed-script  ← Generate embed code
AXP Hosting Options
Option 1: Subdomain (Recommended)
  - Brand adds CNAME: axp.brand.com → your-platform.com
  - Your server serves AXP pages at axp.brand.com/*
  - SSL via Let's Encrypt wildcard or per-subdomain
Option 2: Path-based
  - Brand proxies /axp/* to your platform
  - Nginx/Cloudflare rule: /axp/* → your-platform.com/serve/:brandId/*
Option 3: Embed Script
  - Brand includes <script src="geoscore.js?brand=xxx">
  - Script injects schema, FAQ widget, canonical hints
Schema Coverage Calculation
schema_coverage = implemented_schemas / recommended_schemas × 100
recommended_schemas (based on business type):
  - All: Organization, WebSite, BreadcrumbList
  - E-commerce: Product, Offer, Review
  - Local: LocalBusiness, OpeningHours
  - Content: Article, FAQPage, HowTo
7. Integrations Page (/app/integrations)
Supported Integrations
Integration	Data Pulled	Purpose
Google Search Console	Search queries, impressions, clicks	Correlate search visibility with AI visibility
Twitter/X	Brand mentions, engagement	Social signal tracking
LinkedIn	Company page metrics	B2B social signals
Google Analytics	Traffic sources, user behavior	Track AXP page performance
API Endpoints
GET /api/brands/:brandId/integrations
POST /api/brands/:brandId/integrations/:provider/connect
DELETE /api/brands/:brandId/integrations/:provider/disconnect
GET /api/brands/:brandId/integrations/:provider/data
POST /api/brands/:brandId/integrations/:provider/sync
OAuth Flow
1. User clicks "Connect Google Search Console"
2. Redirect to: /api/integrations/gsc/auth?brandId=xxx
3. Google OAuth consent screen
4. Callback: /api/integrations/gsc/callback?code=xxx
5. Exchange code for tokens, store encrypted in DB
6. Schedule periodic data sync jobs
8. Settings Page (/app/settings)
Tabs & Data
Organization Tab

GET /api/brands/:brandId
PUT /api/brands/:brandId
Fields: name, website, description, industry, language, target_market, variations
Team Management Tab

GET /api/brands/:brandId/team
POST /api/brands/:brandId/team/invite
PUT /api/brands/:brandId/team/:memberId/role
DELETE /api/brands/:brandId/team/:memberId
Roles: owner, admin, editor, viewer
Billing Tab

GET /api/brands/:brandId/subscription
POST /api/brands/:brandId/subscription/upgrade
GET /api/brands/:brandId/usage
Razorpay integration for payments
Analysis Schedule Tab

GET /api/brands/:brandId/schedule
PUT /api/brands/:brandId/schedule
Frequency limits by plan:
  - Free: manual only
  - Starter: weekly
  - Growth: daily
  - Enterprise: hourly + custom
Summary: Core Calculation Formulas
Metric	Formula
Visibility Score	Σ(model_weight × mention_rate) / Σ(weights) × 100
Mention Rate	prompts_with_mention / total_prompts × 100
Average Position	Σ(positions) / mention_count (lower is better)
Sentiment Score	(positive - negative) / total_mentions (-1 to +1)
Citation Rate	responses_with_sources / total_responses × 100
Head-to-Head Win	brand_wins / shared_prompts × 100
Market Share	brand_mentions / all_mentions × 100
Schema Coverage	implemented / recommended × 100
Impact Score	volume×0.3 + gap×0.3 + relevance×0.2 + trend×0.2