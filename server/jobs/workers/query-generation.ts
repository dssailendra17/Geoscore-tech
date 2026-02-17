// Query Generation Worker - Generates search queries from topics

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';
import { getIntegrations } from '../../integrations';

export interface QueryGenerationPayload {
  brandId: string;
  topicId?: string;
  queriesPerTopic?: number;
}

export async function queryGenerationWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as QueryGenerationPayload;
  const { brandId, topicId, queriesPerTopic = 5 } = payload;

  console.log(`[QueryGeneration] Starting query generation for brand ${brandId}`);

  // Get topics
  let topics;
  if (topicId) {
    const topic = await storage.getTopicsByBrand(brandId);
    topics = topic.filter(t => t.id === topicId);
  } else {
    topics = await storage.getTopicsByBrand(brandId);
  }

  if (topics.length === 0) {
    throw new Error('No topics found for query generation');
  }

  // Get brand context
  const context = await storage.getBrandContext(brandId);
  const brandName = context?.brandIdentity?.officialName || '';

  // Get LLM integration
  const integrations = getIntegrations();
  if (!integrations.llm) {
    throw new Error('LLM integration not configured');
  }

  const createdPrompts: any[] = [];
  let totalCost = 0;

  // Generate queries for each topic
  for (const topic of topics.slice(0, 10)) { // Limit to 10 topics per job
    try {
      const prompt = `Generate ${queriesPerTopic} specific search queries related to: "${topic.topic}"

These queries should:
1. Be natural questions people would ask
2. Be relevant for tracking "${brandName}" visibility
3. Vary in specificity and angle
4. Include different query types (questions, comparisons, how-to, etc.)

Return ONLY a JSON array of query strings.
Example: ["how does X compare to Y?", "best X for Z", "X vs Y review"]`;

      const response = await integrations.llm.chat('openai', [
        { role: 'system', content: 'You are a helpful assistant that generates search queries. Return only valid JSON array of strings.' },
        { role: 'user', content: prompt },
      ], {
        temperature: 0.9,
        maxTokens: 500,
      });

      // Parse response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`[QueryGeneration] Failed to parse queries for topic ${topic.id}`);
        continue;
      }

      const queries = JSON.parse(jsonMatch[0]);

      // Store prompts
      for (const queryText of queries) {
        const promptRecord = await storage.createPrompt({
          brandId,
          topicId: topic.id,
          text: queryText,
          category: topic.category,
          isActive: true,
        });
        createdPrompts.push(promptRecord);
      }

      totalCost += response.cost;

    } catch (error: any) {
      console.error(`[QueryGeneration] Error for topic ${topic.id}:`, error.message);
      // Continue with other topics
    }
  }

  console.log(`[QueryGeneration] Generated ${createdPrompts.length} queries for brand ${brandId}`);

  return {
    brandId,
    queriesGenerated: createdPrompts.length,
    topicsProcessed: topics.length,
    totalCost,
  };
}
