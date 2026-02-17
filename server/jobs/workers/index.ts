// Job Workers Index - Register all job handlers

import { getJobQueue } from '../queue';
import { brandEnrichmentWorker } from './brand-enrichment';
import { llmSamplingWorker } from './llm-sampling';
import { gapAnalysisWorker } from './gap-analysis';
import { visibilityScoringWorker } from './visibility-scoring';
import { recommendationWorker } from './recommendation';
import { topicGenerationWorker } from './topic-generation';
import { queryGenerationWorker } from './query-generation';
import { competitorEnrichmentWorker } from './competitor-enrichment';
import { serpSamplingWorker } from './serp-sampling';
import { citationExtractionWorker } from './citation-extraction';
import { axpPublishWorker } from './axp-publish';
import { serpAnalysisWorker } from './serp-analysis';
import { knowledgeGraphAnalysisWorker } from './knowledge-graph-analysis';
import { socialAnalyticsWorker } from './social-analytics';
import { contentRecommendationsWorker } from './content-recommendations';

export function registerAllWorkers(): void {
  const queue = getJobQueue();

  // Register all workers
  queue.registerHandler('brand_enrichment', brandEnrichmentWorker);
  queue.registerHandler('llm_sampling', llmSamplingWorker);
  queue.registerHandler('gap_analysis', gapAnalysisWorker);
  queue.registerHandler('visibility_scoring', visibilityScoringWorker);
  queue.registerHandler('recommendation_generation', recommendationWorker);
  queue.registerHandler('topic_generation', topicGenerationWorker);
  queue.registerHandler('query_generation', queryGenerationWorker);
  queue.registerHandler('competitor_enrichment', competitorEnrichmentWorker);
  queue.registerHandler('serp_sampling', serpSamplingWorker);
  queue.registerHandler('citation_extraction', citationExtractionWorker);
  queue.registerHandler('axp_publish', axpPublishWorker);
  
  // Enhanced insights workers
  queue.registerHandler('serp_analysis', serpAnalysisWorker);
  queue.registerHandler('knowledge_graph_analysis', knowledgeGraphAnalysisWorker);
  queue.registerHandler('social_analytics', socialAnalyticsWorker);
  queue.registerHandler('content_recommendations', contentRecommendationsWorker);
  
  console.log('[Workers] All job handlers registered successfully');
  console.log('[Workers] Registered: brand_enrichment, llm_sampling, gap_analysis, visibility_scoring, recommendation_generation, topic_generation, query_generation, competitor_enrichment, serp_sampling, citation_extraction, axp_publish, serp_analysis, knowledge_graph_analysis, social_analytics, content_recommendations');
}

export * from './brand-enrichment';
export * from './llm-sampling';
export * from './gap-analysis';
export * from './visibility-scoring';
export * from './recommendation';
export * from './topic-generation';
export * from './query-generation';
export * from './competitor-enrichment';
export * from './serp-sampling';
export * from './citation-extraction';
export * from './axp-publish';
export * from './serp-analysis';
export * from './knowledge-graph-analysis';
export * from './social-analytics';
export * from './content-recommendations';
