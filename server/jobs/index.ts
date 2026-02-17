// Jobs System Index

export * from './queue';
export * from './workers';

import { getJobQueue } from './queue';
import { registerAllWorkers } from './workers';

export function initializeJobSystem(): void {
  console.log('[Jobs] Initializing job system...');
  
  // Get queue instance (creates if doesn't exist)
  const queue = getJobQueue();
  
  // Register all workers
  registerAllWorkers();
  
  // Clean up old jobs every hour
  setInterval(() => {
    queue.clearCompletedJobs(24);
  }, 60 * 60 * 1000);
  
  console.log('[Jobs] Job system initialized successfully');
  console.log('[Jobs] Queue stats:', queue.getStats());
}

// Helper function to trigger a brand enrichment job
export async function triggerBrandEnrichment(brandId: string, priority: number = 5): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('brand_enrichment', { brandId }, priority);
}

// Helper function to trigger LLM sampling
export async function triggerLLMSampling(
  brandId: string,
  promptId: string,
  providers?: Array<'openai' | 'anthropic' | 'google'>,
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('llm_sampling', { brandId, promptId, providers }, priority);
}

// Helper function to trigger gap analysis
export async function triggerGapAnalysis(
  brandId: string,
  period?: string,
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('gap_analysis', { brandId, period }, priority);
}

// Helper function to trigger visibility scoring
export async function triggerVisibilityScoring(
  brandId: string,
  period?: 'day' | 'week' | 'month',
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('visibility_scoring', { brandId, period }, priority);
}

// Helper function to trigger recommendation generation
export async function triggerRecommendations(
  brandId: string,
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('recommendation_generation', { brandId }, priority);
}

// Helper function to trigger full analysis pipeline
export async function triggerFullAnalysis(
  brandId: string,
  priority: number = 8
): Promise<{ jobIds: string[] }> {
  const jobIds = [];
  
  // 1. Enrich brand data
  jobIds.push(await triggerBrandEnrichment(brandId, priority));
  
  // 2. Calculate visibility scores
  jobIds.push(await triggerVisibilityScoring(brandId, 'week', priority));
  
  // 3. Analyze gaps
  jobIds.push(await triggerGapAnalysis(brandId, 'month', priority));
  
  // 4. Generate recommendations
  jobIds.push(await triggerRecommendations(brandId, priority));
  
  return { jobIds };
}

// Helper function to trigger topic generation
export async function triggerTopicGeneration(
  brandId: string,
  count: number = 10,
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('topic_generation', { brandId, count }, priority);
}

// Helper function to trigger query generation
export async function triggerQueryGeneration(
  brandId: string,
  topicId?: string,
  queriesPerTopic: number = 5,
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('query_generation', { brandId, topicId, queriesPerTopic }, priority);
}

// Helper function to trigger competitor enrichment
export async function triggerCompetitorEnrichment(
  brandId: string,
  competitorId?: string,
  priority: number = 5
): Promise<string> {
  const queue = getJobQueue();
  return await queue.addJob('competitor_enrichment', { brandId, competitorId }, priority);
}
