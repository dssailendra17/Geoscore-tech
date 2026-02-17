# GeoScore Database Architecture & Brand Context System

## Overview

This document describes the comprehensive database architecture for the GeoScore AI Brand Intelligence Platform, including the advanced Brand Context system that stores every bit of brand information, data, queries, prompts, and intelligence.

## Database Technology

**Primary Database**: PostgreSQL with Drizzle ORM

The system is designed to work with PostgreSQL, which provides:
- JSONB support for flexible data structures
- Full-text search capabilities
- Vector embeddings support (for future semantic search)
- Strong ACID compliance
- Excellent performance for complex queries

### Database Flexibility

While the current implementation uses PostgreSQL with Drizzle ORM, the architecture is designed to be database-agnostic:

**Supabase Support**: 
- Supabase uses PostgreSQL under the hood
- All schemas are fully compatible
- Can leverage Supabase's real-time features
- Built-in authentication can complement Clerk

**Convex Support** (Future):
- Would require schema adaptation
- JSONB fields map well to Convex's document model
- Real-time subscriptions available
- Serverless architecture benefits

## Core Database Tables

### 1. User & Authentication
- `users` - User profiles synced from Clerk
- `team_members` - Multi-user brand access (Enterprise)

### 2. Brand Management
- `brands` - Core brand entities
- `plan_capabilities` - Subscription tier definitions
- `subscriptions` - Active subscriptions
- `invoices` - Billing records
- `payments` - Payment tracking

### 3. Competitive Intelligence
- `competitors` - Tracked competitor brands
- `topics` - Industry categories and themes
- `prompts` - Query templates for LLM testing
- `prompt_templates` - Admin-managed prompt library

### 4. Analytics & Intelligence
- `llm_answers` - Raw LLM responses
- `prompt_runs` - Execution tracking
- `answer_mentions` - Brand/competitor detection in responses
- `answer_citations` - Source tracking from LLM responses
- `visibility_scores` - Aggregated performance metrics
- `trend_snapshots` - Historical tracking
- `prompt_results` - Legacy results table

### 5. Content Management
- `axp_pages` - AI Experience Pages
- `axp_versions` - Page version control
- `faq_entries` - FAQ management
- `schema_templates` - JSON-LD schema templates
- `schema_versions` - Schema version control
- `sources` - Citation domains and URLs

### 6. Job Management
- `jobs` - Background job queue
- `job_runs` - Execution history
- `job_errors` - Error tracking
- `analysis_schedules` - Automated analysis scheduling

### 7. Integrations
- `integrations` - Third-party service connections
- `webhook_events` - External service events

### 8. Governance
- `audit_logs` - Enterprise compliance tracking
- `domain_registry` - Canonical entity resolution (cost-saving de-duplication)
- `data_ttl_config` - Data freshness rules by plan tier

## Brand Context System

### Overview

The **Brand Context** table is the crown jewel of the GeoScore platform. It serves as a comprehensive, living knowledge base that contains every bit of information about a brand, structured for AI visibility optimization.

### Table: `brand_context`

**Purpose**: Centralized intelligence hub that aggregates all brand data, insights, and recommendations.

**Key Features**:
- One-to-one relationship with brands (unique constraint on `brandId`)
- JSONB fields for flexible, schema-less data storage
- Comprehensive coverage of all brand intelligence dimensions
- Optimized for both human readability and AI processing

### Data Structure

#### Core Identity
```typescript
brandIdentity: {
  officialName: string;
  variations: string[];  // "Acme Inc", "Acme", "ACME Corp"
  taglines: string[];
  mission: string;
  vision: string;
  values: string[];
  foundedYear: number;
  headquarters: string;
}

productServices: {
  products: Array<{
    name: string;
    description: string;
    features: string[];
    pricing: object;
    usps: string[];  // Unique selling propositions
  }>;
  services: Array<{...}>;
}

targetAudience: {
  demographics: object;
  personas: Array<{
    name: string;
    description: string;
    painPoints: string[];
    goals: string[];
  }>;
}
```

#### Market Intelligence
```typescript
industryContext: {
  industry: string;
  subIndustry: string;
  trends: string[];
  regulations: string[];
  marketSize: object;
}

competitiveLandscape: {
  directCompetitors: string[];
  indirectCompetitors: string[];
  positioning: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

marketPosition: {
  marketShare: number;
  ranking: number;
  growthRate: number;
  opportunities: string[];
}
```

#### Content & Messaging
```typescript
keyMessages: {
  coreMessages: string[];
  valuePropositions: string[];
  differentiators: string[];
  proofPoints: string[];
}

contentThemes: {
  topics: string[];
  categories: string[];
  contentPillars: string[];
  keywords: string[];
}

brandVoice: {
  tone: string;  // "professional", "friendly", "authoritative"
  style: string;
  languageGuidelines: string[];
  dosDonts: object;
}
```

#### Claims & Evidence
```typescript
claimsGraph: {
  claims: Array<{
    id: string;
    statement: string;
    category: string;  // "product", "company", "market"
    confidence: number;  // 0-100
    evidenceIds: string[];
    verificationStatus: string;  // "verified", "pending", "disputed"
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;  // "supports", "contradicts", "extends"
  }>;
}

evidenceSources: {
  sources: Array<{
    id: string;
    url: string;
    domain: string;
    title: string;
    type: string;  // "website", "news", "review", "social"
    authority: number;  // 0-100
    lastVerified: string;
  }>;
}

factChecking: {
  verifiedClaims: number;
  pendingClaims: number;
  disputedClaims: number;
  overallConfidence: number;  // 0-100
}
```

#### AI Visibility Data
```typescript
llmPerformance: {
  byModel: {
    chatgpt: {
      mentionRate: number;
      avgPosition: number;
      sentiment: string;
      lastChecked: string;
    };
    claude: {...};
    gemini: {...};
    perplexity: {...};
  };
  overall: {
    visibilityScore: number;
    trend: string;  // "up", "down", "stable"
  };
}

promptCoverage: {
  totalPrompts: number;
  mentionedIn: number;
  coverageRate: number;  // percentage
  topPerformingPrompts: string[];
  gapPrompts: string[];
}

citationAnalysis: {
  totalCitations: number;
  uniqueDomains: number;
  topSources: Array<{
    domain: string;
    count: number;
    authority: number;
  }>;
  citationTypes: object;  // owned, earned, competitor
}

sentimentAnalysis: {
  overall: string;  // "positive", "neutral", "negative"
  byModel: object;
  byTopic: object;
  trends: Array<{
    date: string;
    sentiment: string;
    score: number;
  }>;
}
```

#### Optimization Insights
```typescript
gapAnalysis: {
  visibilityGaps: Array<{
    area: string;
    severity: string;  // "high", "medium", "low"
    impact: number;
    description: string;
  }>;
  competitorAdvantages: Array<{
    competitor: string;
    advantage: string;
    prompts: string[];
  }>;
  opportunities: Array<{
    type: string;
    description: string;
    estimatedImpact: number;
    effort: string;  // "low", "medium", "high"
  }>;
}

recommendedActions: {
  priority: Array<{
    action: string;
    rationale: string;
    expectedImpact: number;
    effort: string;
    deadline: string;
  }>;
  quickWins: string[];
  longTerm: string[];
}

contentRecommendations: {
  suggestedTopics: string[];
  suggestedFormats: string[];
  targetPrompts: string[];
  contentGaps: string[];
}
```

#### Integration Data
```typescript
gscData: {
  topQueries: Array<{query: string; impressions: number; clicks: number}>;
  topPages: Array<{url: string; impressions: number; clicks: number}>;
  avgPosition: number;
  ctr: number;
  lastSync: string;
}

socialData: {
  platforms: {
    twitter: {followers: number; engagement: number; lastSync: string};
    linkedin: {...};
    reddit: {...};
  };
  mentions: number;
  sentiment: string;
}

analyticsData: {
  sessions: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: string[];
  lastSync: string;
}
```

#### Embeddings & Search
```typescript
embeddingsVector: string;  // Vector representation for semantic search
searchKeywords: string[];  // Optimized keywords
semanticTopics: string[];  // Related topics discovered via NLP
```

#### Metadata
```typescript
lastEnriched: timestamp;
enrichmentVersion: number;  // Schema version for migrations
dataQualityScore: number;  // 0-100, based on completeness and freshness
completenessScore: number;  // 0-100, percentage of fields populated
```

### Usage Patterns

#### 1. Brand Onboarding
```typescript
// Create brand context during onboarding
const context = await storage.createBrandContext({
  brandId: brand.id,
  brandIdentity: {
    officialName: brand.name,
    variations: [brand.name, ...variations],
    // ... extracted from brand.dev API
  },
  industryContext: {
    // ... from knowledge graph
  },
  dataQualityScore: 30,  // Initial, low score
  completenessScore: 20,
});
```

#### 2. Enrichment Pipeline
```typescript
// Background job enriches context over time
async function enrichBrandContext(brandId: string) {
  const context = await storage.getBrandContext(brandId);
  
  // Enrich from various sources
  const brandDevData = await fetchBrandDevData(brand.domain);
  const wikidataData = await fetchWikidataData(brand.name);
  const serpData = await fetchSERPData(brand.name);
  
  // Update context
  await storage.updateBrandContext(context.id, {
    brandIdentity: mergeBrandIdentity(context.brandIdentity, brandDevData),
    industryContext: mergeIndustryContext(context.industryContext, wikidataData),
    claimsGraph: extractClaims(serpData),
    dataQualityScore: calculateQuality(updatedContext),
    completenessScore: calculateCompleteness(updatedContext),
    lastEnriched: new Date(),
  });
}
```

#### 3. LLM Analysis
```typescript
// Use context to generate targeted prompts
async function generatePromptsFromContext(brandId: string) {
  const context = await storage.getBrandContext(brandId);
  
  const prompts = [];
  
  // Generate prompts for each product
  for (const product of context.productServices.products) {
    prompts.push({
      text: `What are the best ${product.category} tools for ${context.targetAudience.personas[0].description}?`,
      category: 'product_discovery',
      brandId,
    });
  }
  
  // Generate prompts for each content theme
  for (const theme of context.contentThemes.topics) {
    prompts.push({
      text: `How can I ${theme} in ${context.industryContext.industry}?`,
      category: 'educational',
      brandId,
    });
  }
  
  return prompts;
}
```

#### 4. Gap Analysis
```typescript
// Identify visibility gaps
async function analyzeVisibilityGaps(brandId: string) {
  const context = await storage.getBrandContext(brandId);
  const prompts = await storage.getPromptsByBrand(brandId);
  const llmAnswers = await storage.getLlmAnswersByBrand(brandId);
  
  const gaps = [];
  
  // Find prompts where brand is not mentioned
  for (const prompt of prompts) {
    const answers = llmAnswers.filter(a => a.promptId === prompt.id);
    const mentioned = answers.some(a => 
      a.rawResponse.toLowerCase().includes(context.brandIdentity.officialName.toLowerCase())
    );
    
    if (!mentioned) {
      gaps.push({
        area: prompt.category,
        severity: 'high',
        impact: calculateImpact(prompt),
        description: `Brand not mentioned in "${prompt.text}"`,
      });
    }
  }
  
  // Update context with gap analysis
  await storage.updateBrandContext(context.id, {
    gapAnalysis: {
      visibilityGaps: gaps,
      // ... other analysis
    },
  });
}
```

#### 5. Content Recommendations
```typescript
// Generate content recommendations
async function generateContentRecommendations(brandId: string) {
  const context = await storage.getBrandContext(brandId);
  const gaps = context.gapAnalysis.visibilityGaps;
  
  const recommendations = {
    suggestedTopics: [],
    suggestedFormats: [],
    targetPrompts: [],
    contentGaps: [],
  };
  
  // For each gap, suggest content
  for (const gap of gaps.filter(g => g.severity === 'high')) {
    recommendations.suggestedTopics.push(gap.area);
    recommendations.targetPrompts.push(gap.description);
    
    // Suggest format based on gap type
    if (gap.area === 'product_discovery') {
      recommendations.suggestedFormats.push('comparison_guide');
    } else if (gap.area === 'educational') {
      recommendations.suggestedFormats.push('how_to_article');
    }
  }
  
  // Update context
  await storage.updateBrandContext(context.id, {
    contentRecommendations: recommendations,
  });
}
```

## Data Flow Architecture

### 1. Onboarding Flow
```
User Creates Brand
  ↓
Create Brand Record
  ↓
Create Brand Context (Initial)
  ↓
Trigger Enrichment Job
  ↓
Fetch External Data (brand.dev, Wikidata, SERP)
  ↓
Update Brand Context
  ↓
Generate Initial Prompts
  ↓
Schedule Analysis
```

### 2. Analysis Flow
```
Scheduled Job Triggers
  ↓
Get Brand Context
  ↓
Get Active Prompts
  ↓
For Each Prompt:
  ↓
  Create Prompt Run
  ↓
  Call LLM API
  ↓
  Store LLM Answer
  ↓
  Parse Response
  ↓
  Extract Mentions → Answer Mentions
  ↓
  Extract Citations → Answer Citations
  ↓
  Update Prompt Run (completed)
  ↓
Aggregate Results → Visibility Scores
  ↓
Create Trend Snapshot
  ↓
Update Brand Context (llmPerformance)
  ↓
Run Gap Analysis
  ↓
Generate Recommendations
  ↓
Update Brand Context (gapAnalysis, recommendations)
```

### 3. Content Creation Flow
```
User Views Recommendations
  ↓
Select Content Topic
  ↓
Create AXP Page (draft)
  ↓
Generate Content (AI-assisted)
  ↓
Create FAQ Entries
  ↓
Add Schema Templates
  ↓
Create AXP Version
  ↓
Publish AXP Page
  ↓
Update Brand Context (contentRecommendations)
  ↓
Monitor Performance
  ↓
Update Visibility Scores
```

## Database Deployment

### Option 1: Supabase

1. Create Supabase project
2. Run migration SQL (see `database-migration.sql`)
3. Configure environment variables:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
   ```
4. Enable Row Level Security (RLS) policies as needed
5. Optionally enable Supabase Realtime for live updates

### Option 2: Self-Hosted PostgreSQL

1. Install PostgreSQL 14+
2. Create database: `createdb geoscore`
3. Run migration SQL
4. Configure connection string
5. Set up automated backups

### Option 3: Convex (Future)

1. Adapt schema to Convex document model
2. JSONB fields map directly to Convex objects
3. Implement real-time subscriptions
4. Leverage serverless architecture

## Performance Optimization

### Indexes

All critical foreign keys and frequently queried fields have indexes:
- `brandId` on all brand-related tables
- `promptId` on answer-related tables
- `createdAt` for time-series queries
- `status` for job management
- `period` for visibility scores

### Query Optimization

- Use `limit` parameters to prevent large result sets
- Leverage JSONB indexing for nested queries
- Implement pagination for large datasets
- Use materialized views for complex aggregations

### Caching Strategy

- Cache Brand Context in Redis for fast access
- Cache visibility scores for dashboard
- Invalidate on updates
- TTL-based expiration

## Data Retention & TTL

Configured via `data_ttl_config` table:

- **brand_dev**: 30 days (all plans)
- **kg_wikidata**: 90 days (all plans)
- **llm_answers**: 
  - Free: 7 days
  - Starter: 14 days
  - Growth: 21 days
  - Enterprise: 30 days
- **serp**: 
  - Free: 3 days
  - Starter: 5 days
  - Growth/Enterprise: 7 days

## Security Considerations

1. **Row Level Security (RLS)**: Enable on Supabase for multi-tenant isolation
2. **API Keys**: Store encrypted in `integrations.credentials`
3. **Audit Logging**: All mutations logged in `audit_logs`
4. **Data Encryption**: Sensitive fields encrypted at rest
5. **Access Control**: Team member permissions in `team_members.permissions`

## Monitoring & Observability

### Key Metrics

- Brand Context completeness score
- Data quality score
- Enrichment job success rate
- LLM API call costs
- Query performance
- Storage usage

### Alerts

- Failed enrichment jobs
- Low data quality scores
- API rate limits exceeded
- Database connection issues
- Unusual cost spikes

## Future Enhancements

1. **Vector Search**: Add pgvector extension for semantic search
2. **Time-Series Optimization**: TimescaleDB for trend data
3. **Graph Database**: Neo4j for claims graph visualization
4. **Real-Time Sync**: Supabase Realtime for live updates
5. **Multi-Region**: Geographic distribution for global performance
6. **Sharding**: Horizontal scaling for enterprise customers

## Conclusion

The GeoScore database architecture, centered around the comprehensive Brand Context system, provides a solid foundation for AI brand intelligence. The flexible JSONB structure allows for rapid iteration while maintaining strong typing at the application layer. The system is designed to scale from small startups to enterprise customers with thousands of brands and millions of prompts.
