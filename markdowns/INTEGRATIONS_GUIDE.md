# GeoScore Integrations Guide

Complete guide to all external integrations available in GeoScore.

## Table of Contents

1. [LLM Providers](#llm-providers)
2. [Google Ecosystem](#google-ecosystem)
3. [Social Media Platforms](#social-media-platforms)
4. [Brand Enrichment](#brand-enrichment)
5. [SERP & Search Data](#serp--search-data)
6. [Payment Gateway](#payment-gateway)

---

## LLM Providers

GeoScore supports **7 LLM providers** for brand intelligence analysis:

### 1. OpenAI
- **Models**: GPT-4, GPT-4o, GPT-3.5-turbo
- **Use Case**: General-purpose brand analysis, content generation
- **Setup**: Get API key from https://platform.openai.com/api-keys
- **Environment Variable**: `OPENAI_API_KEY=sk-...`

### 2. Anthropic (Claude)
- **Models**: Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus
- **Use Case**: Long-form analysis, nuanced brand perception
- **Setup**: Get API key from https://console.anthropic.com/
- **Environment Variable**: `ANTHROPIC_API_KEY=sk-ant-...`

### 3. Google (Gemini)
- **Models**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
- **Use Case**: Multimodal analysis, fast responses
- **Setup**: Get API key from https://aistudio.google.com/app/apikey
- **Environment Variable**: `GOOGLE_API_KEY=...`

### 4. Perplexity
- **Models**: Llama 3.1 Sonar (Small/Large/Huge) - Online & Chat variants
- **Use Case**: Real-time web search, current information
- **Features**: Includes citations and sources
- **Setup**: Get API key from https://www.perplexity.ai/settings/api
- **Environment Variable**: `PERPLEXITY_API_KEY=pplx-...`

### 5. Grok (xAI)
- **Models**: Grok Beta, Grok Vision Beta
- **Use Case**: Alternative perspective, vision analysis
- **Setup**: Get API key from https://console.x.ai/
- **Environment Variable**: `GROK_API_KEY=xai-...`

### 6. DeepSeek
- **Models**: DeepSeek Chat, DeepSeek Coder
- **Use Case**: Cost-effective analysis, code generation
- **Pricing**: Very competitive ($0.14-$0.28 per 1M tokens)
- **Setup**: Get API key from https://platform.deepseek.com/
- **Environment Variable**: `DEEPSEEK_API_KEY=sk-...`

### 7. OpenRouter
- **Models**: Access to 100+ models from multiple providers
- **Providers**: OpenAI, Anthropic, Google, Meta, Mistral, and more
- **Use Case**: Unified access to multiple models
- **Setup**: Get API key from https://openrouter.ai/keys
- **Environment Variable**: `OPENROUTER_API_KEY=sk-or-v1-...`

**Note**: At least one LLM provider is required for core functionality.

---

## Google Ecosystem

### 1. Google Search Console
Track your website's search performance and indexing status.

**Features**:
- Search analytics (queries, clicks, impressions, CTR, position)
- Indexing status monitoring
- Performance tracking over time

**Setup**:
1. Create a service account in Google Cloud Console
2. Enable Search Console API
3. Add service account to your Search Console property

**Environment Variables**:
```
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=...
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=...
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://yoursite.com
```

### 2. Google Business Profile
Manage your business listings, reviews, and local insights.

**Features**:
- Business location information
- Customer reviews management
- Reply to reviews
- Location insights (views, searches)

**Setup**:
1. Get API key from Google Cloud Console
2. Enable My Business API
3. Get your account ID from Google Business Profile

**Environment Variables**:
```
GOOGLE_BUSINESS_PROFILE_API_KEY=...
GOOGLE_BUSINESS_ACCOUNT_ID=...
```

### 3. Google Analytics 4
Access website analytics and user behavior data.

**Features**:
- Traffic sources and user demographics
- Top pages and content performance
- Real-time visitor data
- Custom report queries

**Setup**:
1. Create service account in Google Cloud Console
2. Enable Google Analytics Data API
3. Add service account to your GA4 property

**Environment Variables**:
```
GOOGLE_ANALYTICS_PROPERTY_ID=...
GOOGLE_ANALYTICS_CLIENT_EMAIL=...
GOOGLE_ANALYTICS_PRIVATE_KEY=...
```

### 4. Google Ads
Track campaign performance and keyword data.

**Features**:
- Campaign performance metrics
- Keyword performance analysis
- Ad spend and ROI tracking
- Custom GAQL queries

**Setup**:
1. Get developer token from Google Ads
2. Create OAuth2 credentials
3. Generate refresh token

**Environment Variables**:
```
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=...
```

### 5. Google AI Overviews
Track brand mentions in Google's AI-generated search summaries.

**Features**:
- Monitor AI Overview appearances
- Track brand mention frequency
- Analyze cited sources
- Visibility rate calculation

**Setup**: Uses SERP API (SerpAPI or similar)

**Environment Variable**:
```
GOOGLE_AI_OVERVIEWS_SERP_API_KEY=...
```

### 6. Google Knowledge Graph
Already implemented - see Brand Enrichment section.

---

## Social Media Platforms

### 1. Twitter/X
Track brand mentions, engagement, and sentiment on Twitter/X.

**Features**:
- Search tweets mentioning your brand
- User profile and follower analysis
- Engagement metrics (likes, retweets, replies)
- Brand mention analysis with sentiment

**Setup**: Get API access from https://developer.twitter.com/

**Environment Variables**:
```
TWITTER_BEARER_TOKEN=...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
```

### 2. LinkedIn
Track company page performance and professional engagement.

**Features**:
- Organization profile information
- Company posts and engagement
- Follower statistics and growth
- Page performance analytics

**Setup**: Get API access from https://www.linkedin.com/developers/

**Environment Variables**:
```
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_ORGANIZATION_ID=...
```

### 3. YouTube
Track video mentions and channel performance.

**Features**:
- Search videos mentioning your brand
- Channel statistics and insights
- Video performance metrics
- Channel distribution analysis

**Setup**: Get API key from Google Cloud Console (can reuse GOOGLE_API_KEY)

**Environment Variables**:
```
YOUTUBE_API_KEY=...
YOUTUBE_CHANNEL_ID=...
```

### 4. Meta (Facebook & Instagram)
Track presence across Facebook and Instagram.

**Features**:
- Facebook page insights and posts
- Instagram media and engagement
- Review management
- Audience demographics

**Setup**: Get access token from https://developers.facebook.com/

**Environment Variables**:
```
META_ACCESS_TOKEN=...
META_PAGE_ID=...
META_INSTAGRAM_ACCOUNT_ID=...
```

---

## Brand Enrichment

### 1. Brand.dev
Comprehensive brand data enrichment.

**Features**:
- Brand logos and visual assets
- Brand colors and fonts
- Social media links
- Company information

**Setup**: Get API key from https://brand.dev

**Environment Variable**: `BRAND_DEV_API_KEY=...`

### 2. Google Knowledge Graph
Structured data about brands and entities.

**Features**:
- Entity information and descriptions
- Related entities and topics
- Detailed attributes and properties

**Setup**: Get API key from Google Cloud Console

**Environment Variable**: `GOOGLE_KG_API_KEY=...`

### 3. Wikidata
Free, open-source structured data.

**Features**:
- Entity search and information
- Structured claims and properties
- Multilingual support
- No API key required

**Setup**: No setup required - always available

---

## SERP & Search Data

### DataForSEO
Comprehensive SERP data and search analytics.

**Features**:
- Google search results
- Organic rankings
- Featured snippets
- People Also Ask questions
- Related searches

**Setup**: Get credentials from https://dataforseo.com/

**Environment Variables**:
```
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
```

---

## Payment Gateway

### Razorpay
Payment processing for subscriptions (Indian market).

**Features**:
- Subscription management
- Payment processing
- Webhook handling
- Refund processing

**Setup**: Get credentials from https://dashboard.razorpay.com/

**Environment Variables**:
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

**Note**: Required for subscription features to work.

---

## Integration Priority

### Required (Core Functionality)
1. **At least one LLM provider** (OpenAI, Anthropic, or Google recommended)
2. **Razorpay** (for subscription features)

### Recommended (Enhanced Features)
1. **Brand.dev** - Brand enrichment
2. **Google Knowledge Graph** - Entity data
3. **DataForSEO** - SERP tracking

### Optional (Advanced Features)
1. **Google Ecosystem** - Search Console, Analytics, Ads, Business Profile
2. **Social Media** - Twitter, LinkedIn, YouTube, Meta
3. **Additional LLMs** - Perplexity, Grok, DeepSeek, OpenRouter

---

## Testing Integrations

After configuring integrations, test them using the admin panel:

1. Navigate to `/admin/integrations`
2. View available integrations
3. Test each integration individually
4. Check logs for any errors

---

## Troubleshooting

### Common Issues

**LLM Provider Errors**:
- Verify API key is correct
- Check API key has sufficient credits
- Ensure API key has proper permissions

**Google Services Errors**:
- Verify service account has proper permissions
- Check API is enabled in Google Cloud Console
- Ensure credentials are properly formatted

**Social Media Errors**:
- Verify access tokens are not expired
- Check app has required permissions
- Ensure rate limits are not exceeded

**Payment Gateway Errors**:
- Verify Razorpay keys are correct
- Check webhook secret matches
- Ensure test/live mode matches keys

---

## Rate Limits

Be aware of rate limits for each service:

- **OpenAI**: 3,500 requests/min (varies by tier)
- **Anthropic**: 50 requests/min (varies by tier)
- **Google**: 60 requests/min (varies by API)
- **Twitter**: 300 requests/15min (varies by endpoint)
- **LinkedIn**: 100 requests/day (varies by endpoint)
- **YouTube**: 10,000 units/day
- **Meta**: 200 calls/hour (varies by endpoint)

---

## Cost Optimization

### LLM Costs
- Use **DeepSeek** for cost-effective analysis ($0.14-$0.28/1M tokens)
- Use **Gemini Flash** for fast, cheap responses
- Use **GPT-4o** for high-quality analysis when needed
- Use **OpenRouter** to access multiple models at competitive prices

### API Costs
- Cache responses where possible
- Batch requests when supported
- Use webhooks instead of polling
- Monitor usage in admin panel

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all credentials
3. **Rotate keys regularly** (every 90 days recommended)
4. **Use test keys** in development
5. **Monitor API usage** for unusual activity
6. **Implement rate limiting** in your application
7. **Use HTTPS** for all API calls
8. **Validate webhook signatures** (especially Razorpay)

---

## Support

For integration-specific issues:
- **LLM Providers**: Check provider documentation
- **Google Services**: Google Cloud Support
- **Social Media**: Platform developer forums
- **Razorpay**: Razorpay support portal

For GeoScore-specific issues:
- Check application logs
- Review admin panel diagnostics
- Contact GeoScore support

