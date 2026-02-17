# Complete Implementation Guide - Context Engine, APIs & Frontend

## Overview

This guide provides step-by-step instructions to complete the implementation of:
1. External API Integrations ✅ (COMPLETE)
2. Context Engine ⏳ (70% COMPLETE)
3. Frontend Integration ❌ (NOT STARTED)

---

## Part 1: Server Initialization (CRITICAL - DO THIS FIRST)

### Step 1.1: Update `.env` file

Add the following environment variables:

```env
# Existing variables
DATABASE_URL=postgresql://user:password@localhost:5432/geoscore
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# LLM API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Brand Enrichment (optional but recommended)
BRAND_DEV_API_KEY=...
GOOGLE_KG_API_KEY=...

# SERP API (optional)
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
```

### Step 1.2: Update `server/index.ts`

Add initialization code at the top of the file (after imports):

```typescript
import { initializeIntegrations } from './integrations';
import { initializeJobSystem } from './jobs';

// Initialize integrations
initializeIntegrations({
  llm: {
    openai: process.env.OPENAI_API_KEY ? {
      apiKey: process.env.OPENAI_API_KEY,
    } : undefined,
    anthropic: process.env.ANTHROPIC_API_KEY ? {
      apiKey: process.env.ANTHROPIC_API_KEY,
    } : undefined,
    google: process.env.GOOGLE_API_KEY ? {
      apiKey: process.env.GOOGLE_API_KEY,
    } : undefined,
  },
  brandDev: process.env.BRAND_DEV_API_KEY ? {
    apiKey: process.env.BRAND_DEV_API_KEY,
  } : undefined,
  knowledgeGraph: process.env.GOOGLE_KG_API_KEY ? {
    apiKey: process.env.GOOGLE_KG_API_KEY,
  } : undefined,
  dataForSEO: (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) ? {
    login: process.env.DATAFORSEO_LOGIN,
    password: process.env.DATAFORSEO_PASSWORD,
  } : undefined,
});

// Initialize job system
initializeJobSystem();

console.log('[Server] All systems initialized');
```

---

## Part 2: Add Job Trigger Routes

### Step 2.1: Add to `server/routes.ts`

Add these routes before the `return httpServer;` statement:

```typescript
// ============= JOB TRIGGER ROUTES =============

app.post("/api/brands/:brandId/enrich", requireAuth, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const brand = await storage.getBrand(req.params.brandId);
    
    if (!brand || brand.userId !== userId) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const { triggerBrandEnrichment } = await import('./jobs');
    const jobId = await triggerBrandEnrichment(req.params.brandId, 8);
    
    res.json({ jobId, message: "Brand enrichment job queued" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/prompts/:promptId/sample", requireAuth, async (req: any, res) => {
  try {
    const prompt = await storage.getPrompt(req.params.promptId);
    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    const { triggerLLMSampling } = await import('./jobs');
    const jobId = await triggerLLMSampling(
      prompt.brandId,
      req.params.promptId,
      req.body.providers,
      8
    );
    
    res.json({ jobId, message: "LLM sampling job queued" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/jobs/:jobId/status", requireAuth, async (req, res) => {
  try {
    const { getJobQueue } = await import('./jobs');
    const queue = getJobQueue();
    const job = await queue.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/jobs/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { getJobQueue } = await import('./jobs');
    const queue = getJobQueue();
    res.json(queue.getStats());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

---

## Part 3: Frontend Integration

### Step 3.1: Update `client/src/lib/api.ts`

Add new API functions:

```typescript
// Brand Context
export async function getBrandContext(brandId: string) {
  return fetchApi(`/brands/${brandId}/context`);
}

export async function updateBrandContext(brandId: string, data: any) {
  return fetchApi(`/brands/${brandId}/context`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Analytics
export async function getLLMAnswers(brandId: string, limit = 100) {
  return fetchApi(`/brands/${brandId}/llm-answers?limit=${limit}`);
}

export async function getVisibilityScores(brandId: string, period?: string) {
  const query = period ? `?period=${period}` : '';
  return fetchApi(`/brands/${brandId}/visibility-scores${query}`);
}

export async function getLatestVisibilityScore(brandId: string) {
  return fetchApi(`/brands/${brandId}/visibility-scores/latest`);
}

export async function getTrends(brandId: string, limit = 90) {
  return fetchApi(`/brands/${brandId}/trends?limit=${limit}`);
}

// Jobs
export async function triggerBrandEnrichment(brandId: string) {
  return fetchApi(`/brands/${brandId}/enrich`, { method: 'POST' });
}

export async function triggerLLMSampling(promptId: string, providers?: string[]) {
  return fetchApi(`/prompts/${promptId}/sample`, {
    method: 'POST',
    body: JSON.stringify({ providers }),
  });
}

export async function getJobStatus(jobId: string) {
  return fetchApi(`/jobs/${jobId}/status`);
}
```

### Step 3.2: Create React Query Hooks

Create `client/src/hooks/use-brand-context.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';

export function useBrandContext(brandId: string) {
  return useQuery({
    queryKey: ['brandContext', brandId],
    queryFn: () => api.getBrandContext(brandId),
    enabled: !!brandId,
  });
}

export function useUpdateBrandContext(brandId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.updateBrandContext(brandId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandContext', brandId] });
    },
  });
}

export function useTriggerEnrichment(brandId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.triggerBrandEnrichment(brandId),
    onSuccess: () => {
      // Refresh context after enrichment completes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['brandContext', brandId] });
      }, 10000); // Wait 10 seconds for job to complete
    },
  });
}
```

Create `client/src/hooks/use-analytics.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';

export function useLLMAnswers(brandId: string, limit = 100) {
  return useQuery({
    queryKey: ['llmAnswers', brandId, limit],
    queryFn: () => api.getLLMAnswers(brandId, limit),
    enabled: !!brandId,
  });
}

export function useVisibilityScores(brandId: string, period?: string) {
  return useQuery({
    queryKey: ['visibilityScores', brandId, period],
    queryFn: () => api.getVisibilityScores(brandId, period),
    enabled: !!brandId,
  });
}

export function useLatestVisibilityScore(brandId: string) {
  return useQuery({
    queryKey: ['latestVisibilityScore', brandId],
    queryFn: () => api.getLatestVisibilityScore(brandId),
    enabled: !!brandId,
  });
}

export function useTrends(brandId: string, limit = 90) {
  return useQuery({
    queryKey: ['trends', brandId, limit],
    queryFn: () => api.getTrends(brandId, limit),
    enabled: !!brandId,
  });
}
```

### Step 3.3: Update Dashboard Component

In `client/src/pages/Dashboard.tsx`, replace mock data:

```typescript
import { useLatestVisibilityScore, useTrends } from '../hooks/use-analytics';
import { useBrandContext } from '../hooks/use-brand-context';

function Dashboard() {
  const { data: brand } = useBrand(brandId);
  const { data: visibilityScore, isLoading: loadingScore } = useLatestVisibilityScore(brandId);
  const { data: trends, isLoading: loadingTrends } = useTrends(brandId, 30);
  const { data: context } = useBrandContext(brandId);

  if (loadingScore || loadingTrends) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Visibility Score */}
      <div className="metric-card">
        <h3>Overall Visibility Score</h3>
        <div className="score">{visibilityScore?.overallScore || 0}</div>
        <div className="trend">{visibilityScore?.trend || 'stable'}</div>
      </div>

      {/* Brand Completeness */}
      <div className="metric-card">
        <h3>Brand Context Completeness</h3>
        <div className="score">{context?.completenessScore || 0}%</div>
      </div>

      {/* Trend Chart */}
      <div className="chart">
        <h3>Visibility Trend (30 days)</h3>
        {/* Use trends data for chart */}
      </div>
    </div>
  );
}
```

---

## Part 4: Testing the System

### Step 4.1: Start the Server

```bash
npm run dev
```

### Step 4.2: Test Brand Enrichment

1. Create a brand in the UI
2. Call the enrichment endpoint:

```bash
curl -X POST http://localhost:5000/api/brands/{brandId}/enrich \
  -H "Authorization: Bearer {token}"
```

3. Check job status:

```bash
curl http://localhost:5000/api/jobs/{jobId}/status \
  -H "Authorization: Bearer {token}"
```

4. View enriched brand context:

```bash
curl http://localhost:5000/api/brands/{brandId}/context \
  -H "Authorization: Bearer {token}"
```

### Step 4.3: Test LLM Sampling

1. Create a prompt in the UI
2. Trigger sampling:

```bash
curl -X POST http://localhost:5000/api/prompts/{promptId}/sample \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"providers": ["openai", "anthropic"]}'
```

3. Check LLM answers:

```bash
curl http://localhost:5000/api/brands/{brandId}/llm-answers \
  -H "Authorization: Bearer {token}"
```

---

## Part 5: Additional Workers (TODO)

Create these additional worker files:

### `server/jobs/workers/gap-analysis.ts`

```typescript
export async function gapAnalysisWorker(job: QueuedJob): Promise<any> {
  // 1. Get all LLM answers for brand
  // 2. Identify prompts where brand is not mentioned
  // 3. Identify competitors mentioned more frequently
  // 4. Calculate gap severity
  // 5. Update brand context with gap analysis
}
```

### `server/jobs/workers/recommendation.ts`

```typescript
export async function recommendationWorker(job: QueuedJob): Promise<any> {
  // 1. Get gap analysis
  // 2. Get brand context
  // 3. Generate content recommendations
  // 4. Generate optimization recommendations
  // 5. Prioritize by impact
  // 6. Update brand context
}
```

### `server/jobs/workers/visibility-scoring.ts`

```typescript
export async function visibilityScoringWorker(job: QueuedJob): Promise<any> {
  // 1. Get all answer mentions for period
  // 2. Calculate mention rate
  // 3. Calculate average position
  // 4. Calculate sentiment score
  // 5. Calculate overall visibility score
  // 6. Store in visibility_scores table
  // 7. Create trend snapshot
}
```

---

## Part 6: Deployment Checklist

- [ ] Add all environment variables to production
- [ ] Run database migration: `npm run db:push`
- [ ] Test all API endpoints
- [ ] Verify job queue is processing
- [ ] Monitor job errors
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting for external APIs
- [ ] Set up alerts for failed jobs
- [ ] Document API usage limits
- [ ] Create admin dashboard for job monitoring

---

## Summary

**What's Complete:**
- ✅ All external API integrations (LLM, brand data, SERP)
- ✅ Job queue system with priority and retry
- ✅ Brand enrichment worker
- ✅ LLM sampling worker
- ✅ Worker registration system
- ✅ API routes for brand context and analytics

**What's Needed:**
- ⏳ Server initialization code
- ⏳ Job trigger routes
- ⏳ Frontend hooks and components
- ⏳ Additional workers (gap analysis, recommendations, scoring)
- ⏳ Testing and deployment

**Estimated Time to Complete:**
- Server setup: 30 minutes
- Frontend integration: 2-3 hours
- Additional workers: 3-4 hours
- Testing: 1-2 hours
- **Total: 6-10 hours**

---

*Last Updated: January 17, 2026 - 22:50*
