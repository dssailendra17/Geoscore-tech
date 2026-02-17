// API Client for GeoScore Backend

import { APIError, NetworkError, handleAPIError, retryWithBackoff, logError } from './error-handling';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: response.statusText }));
      handleAPIError(response, data);
    }

    return response.json();
  } catch (error) {
    // Convert fetch errors to NetworkError
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new NetworkError();
      logError(networkError, { endpoint, options });
      throw networkError;
    }

    // Re-throw API errors and other errors
    if (error instanceof APIError || error instanceof NetworkError) {
      logError(error, { endpoint, options });
    }
    throw error;
  }
}

/**
 * Fetch API with automatic retry for network errors and 5xx errors
 */
async function fetchApiWithRetry(endpoint: string, options: RequestInit = {}) {
  return retryWithBackoff(() => fetchApi(endpoint, options), {
    maxRetries: 3,
    initialDelay: 1000,
  });
}

// ============= BRAND CONTEXT =============

export async function getBrandContext(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/context`);
}

export async function updateBrandContext(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/context`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function triggerBrandEnrichment(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/enrich`, {
    method: 'POST',
  });
}

// ============= ANALYTICS =============

export async function getLLMAnswers(brandId: string, limit = 100) {
  return fetchApi(`/api/brands/${brandId}/llm-answers?limit=${limit}`);
}

export async function getPromptRuns(brandId: string, limit = 100) {
  return fetchApi(`/api/brands/${brandId}/prompt-runs?limit=${limit}`);
}

export async function getMentions(brandId: string, limit = 100) {
  return fetchApi(`/api/brands/${brandId}/mentions?limit=${limit}`);
}

export async function getVisibilityScores(brandId: string, period?: string, limit = 30) {
  const query = period ? `?period=${period}&limit=${limit}` : `?limit=${limit}`;
  return fetchApi(`/api/brands/${brandId}/visibility-scores${query}`);
}

export async function getLatestVisibilityScore(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/visibility-scores/latest`);
}

export async function getTrends(brandId: string, limit = 90) {
  return fetchApi(`/api/brands/${brandId}/trends?limit=${limit}`);
}

// ============= JOBS =============

export async function triggerLLMSampling(promptId: string, providers?: string[]) {
  return fetchApi(`/api/prompts/${promptId}/sample`, {
    method: 'POST',
    body: JSON.stringify({ providers }),
  });
}

export async function getJobStatus(jobId: string) {
  return fetchApi(`/api/jobs/${jobId}/status`);
}

export async function getBrandJobs(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/jobs`);
}

export async function getJobStats() {
  return fetchApi(`/api/jobs/stats`);
}

// ============= CONTENT MANAGEMENT =============

export async function getAxpPages(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/axp-pages`);
}

export async function getAxpPage(pageId: string) {
  return fetchApi(`/api/axp-pages/${pageId}`);
}

export async function createAxpPage(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/axp-pages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAxpPage(pageId: string, data: any) {
  return fetchApi(`/api/axp-pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAxpPage(pageId: string) {
  return fetchApi(`/api/axp-pages/${pageId}`, {
    method: 'DELETE',
  });
}

export async function getFaqEntries(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/faqs`);
}

export async function createFaqEntry(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/faqs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFaqEntry(faqId: string, data: any) {
  return fetchApi(`/api/faqs/${faqId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFaqEntry(faqId: string) {
  return fetchApi(`/api/faqs/${faqId}`, {
    method: 'DELETE',
  });
}

export async function getSchemaTemplates(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/schema-templates`);
}

export async function getGlobalSchemaTemplates() {
  return fetchApi(`/api/schema-templates/global`);
}

export async function createSchemaTemplate(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/schema-templates`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSchemaTemplate(templateId: string, data: any) {
  return fetchApi(`/api/schema-templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSchemaTemplate(templateId: string) {
  return fetchApi(`/api/schema-templates/${templateId}`, {
    method: 'DELETE',
  });
}

// ============= BILLING =============

export async function getSubscription(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/subscription`);
}

export async function getInvoices(brandId: string, limit = 50) {
  return fetchApi(`/api/brands/${brandId}/invoices?limit=${limit}`);
}

export async function getPayments(brandId: string, limit = 50) {
  return fetchApi(`/api/brands/${brandId}/payments?limit=${limit}`);
}

// ============= BRAND LOOKUP & AI GENERATION =============

export async function lookupBrand(domain: string) {
  return fetchApi('/api/brand-lookup', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
}

export async function generateTopics(brandId: string, competitors: { name: string; domain: string }[]) {
  return fetchApi(`/api/brands/${brandId}/generate-topics`, {
    method: 'POST',
    body: JSON.stringify({ competitors }),
  });
}

export async function generateQueries(brandId: string, competitors: { name: string; domain: string }[], topics: string[]) {
  return fetchApi(`/api/brands/${brandId}/generate-queries`, {
    method: 'POST',
    body: JSON.stringify({ competitors, topics }),
  });
}

export async function getTopics(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/topics`);
}

// ============= EXISTING APIS (keep these) =============

export async function getBrands() {
  return fetchApi('/api/brands');
}

export async function getBrand(brandId: string) {
  return fetchApi(`/api/brands/${brandId}`);
}

export async function createBrand(data: any) {
  return fetchApi('/api/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBrand(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getCompetitors(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/competitors`);
}

export async function createCompetitor(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/competitors`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createTopic(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/topics`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTopic(topicId: string, data: any) {
  return fetchApi(`/api/topics/${topicId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTopic(topicId: string) {
  return fetchApi(`/api/topics/${topicId}`, {
    method: 'DELETE',
  });
}

export async function getPrompts(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/prompts`);
}

export async function createPrompt(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/prompts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSources(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/sources`);
}

export async function getSourceDomains(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/sources/domains`);
}

export async function getSourceRecommendations(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/sources/recommendations`);
}

export async function getSourceMentions(brandId: string, sourceId: string) {
  return fetchApi(`/api/brands/${brandId}/sources/${sourceId}/mentions`);
}

export async function getAxpPageHtml(brandId: string, pageId: string) {
  const response = await fetch(`${API_BASE}/api/brands/${brandId}/axp/${pageId}/html`);
  if (!response.ok) {
    throw new Error('Failed to fetch AXP HTML');
  }
  return response.text();
}

export async function getJobs(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/jobs`);
}

// ============= BILLING & PLANS =============

export async function getPlanLimits(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/limits`);
}

export async function checkLimit(brandId: string, limitType: string) {
  return fetchApi(`/api/brands/${brandId}/limits/${limitType}`);
}

export async function getUsage(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/usage`);
}

export async function createSubscription(brandId: string, data: any) {
  return fetchApi(`/api/brands/${brandId}/subscription`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changePlan(brandId: string, newPlanId: string, immediate = true) {
  return fetchApi(`/api/brands/${brandId}/subscription/change-plan`, {
    method: 'POST',
    body: JSON.stringify({ newPlanId, immediate }),
  });
}

export async function cancelSubscription(brandId: string, immediate = false, reason?: string) {
  return fetchApi(`/api/brands/${brandId}/subscription/cancel`, {
    method: 'POST',
    body: JSON.stringify({ immediate, reason }),
  });
}

export async function downloadInvoice(invoiceId: string) {
  const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/pdf`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice');
  }

  return response.blob();
}

// ============= RECOMMENDATIONS & GAP ANALYSIS =============

export async function getRecommendations(brandId: string, limit = 20) {
  return fetchApi(`/api/brands/${brandId}/recommendations?limit=${limit}`);
}

export async function getGapAnalysis(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/gap-analysis/opportunities`);
}

export async function triggerGapAnalysis(brandId: string, period?: string) {
  return fetchApi(`/api/brands/${brandId}/analyze/gaps`, {
    method: 'POST',
    body: JSON.stringify({ period }),
  });
}

// ============= DASHBOARD =============

export async function getDashboardSummary(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/dashboard/summary`);
}

export async function getDashboardVisibilityScore(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/dashboard/visibility-score`);
}

export async function getDashboardTrends(brandId: string, period: '7d' | '30d' | '90d' = '30d') {
  return fetchApi(`/api/brands/${brandId}/dashboard/trends?period=${period}`);
}

export async function getDashboardModelBreakdown(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/dashboard/model-breakdown`);
}

export async function getDashboardTopicPerformance(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/dashboard/topic-performance`);
}

// ============= PROMPTS PERFORMANCE =============

export async function getPromptResults(brandId: string, promptId: string) {
  return fetchApi(`/api/brands/${brandId}/prompts/${promptId}/results`);
}

export async function runPrompt(brandId: string, promptId: string, providers?: string[]) {
  return fetchApi(`/api/brands/${brandId}/prompts/${promptId}/run`, {
    method: 'POST',
    body: JSON.stringify({ providers }),
  });
}

export async function getPromptsPerformance(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/prompts/performance`);
}

// ============= COMPETITORS ANALYSIS =============

export async function deleteCompetitor(brandId: string, competitorId: string) {
  return fetchApi(`/api/brands/${brandId}/competitors/${competitorId}`, {
    method: 'DELETE',
  });
}

export async function getCompetitorsMatrix(brandId: string) {
  return fetchApi(`/api/brands/${brandId}/competitors/matrix`);
}

export async function getCompetitorComparison(brandId: string, competitorId: string) {
  return fetchApi(`/api/brands/${brandId}/competitors/${competitorId}/comparison`);
}

// Export all as api object
export const api = {
  // Brand Context
  getBrandContext,
  updateBrandContext,
  triggerBrandEnrichment,

  // Analytics
  getLLMAnswers,
  getPromptRuns,
  getMentions,
  getVisibilityScores,
  getLatestVisibilityScore,
  getTrends,

  // Dashboard
  getDashboardSummary,
  getDashboardVisibilityScore,
  getDashboardTrends,
  getDashboardModelBreakdown,
  getDashboardTopicPerformance,

  // Recommendations & Gap Analysis
  getRecommendations,
  getGapAnalysis,
  triggerGapAnalysis,

  // Prompts
  getPrompts,
  createPrompt,
  getPromptResults,
  runPrompt,
  getPromptsPerformance,
  triggerLLMSampling,

  // Competitors
  getCompetitors,
  createCompetitor,
  deleteCompetitor,
  getCompetitorsMatrix,
  getCompetitorComparison,

  // Sources
  getSources,
  getSourceDomains,
  getSourceRecommendations,
  getSourceMentions,
  getAxpPageHtml,

  // AXP Pages
  getAxpPages,
  getAxpPage,
  createAxpPage,
  updateAxpPage,
  deleteAxpPage,

  // FAQs
  getFaqEntries,
  createFaqEntry,
  updateFaqEntry,
  deleteFaqEntry,

  // Schema Templates
  getSchemaTemplates,
  getGlobalSchemaTemplates,
  createSchemaTemplate,
  updateSchemaTemplate,
  deleteSchemaTemplate,

  // Jobs
  getJobs,
  getBrandJobs,
  getJobStatus,
  getJobStats,

  // Brands
  getBrands,
  getBrand,
  createBrand,
  updateBrand,

  // Billing & Plans
  getPlanLimits,
  checkLimit,
  getUsage,
  getSubscription,
  createSubscription,
  changePlan,
  cancelSubscription,
  getInvoices,
  getPayments,
  downloadInvoice,
};
