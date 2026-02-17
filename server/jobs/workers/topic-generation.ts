// Topic Generation Worker - Generates relevant topics for brand visibility tracking

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';
import { getIntegrations } from '../../integrations';

export interface TopicGenerationPayload {
  brandId: string;
  count?: number;
}

export async function topicGenerationWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as TopicGenerationPayload;
  const { brandId, count = 10 } = payload;

  console.log(`[TopicGeneration] Starting topic generation for brand ${brandId}`);

  // Get brand context
  const context = await storage.getBrandContext(brandId);
  if (!context) {
    throw new Error(`Brand context not found for ${brandId}`);
  }

  const brandName = context.brandIdentity?.officialName || '';
  const description = context.brandIdentity?.description || '';
  const industry = context.industryContext?.types?.join(', ') || '';

  // Get LLM integration
  const integrations = getIntegrations();
  if (!integrations.llm) {
    throw new Error('LLM integration not configured');
  }

  // Generate topics using LLM
  const prompt = `Generate ${count} relevant search topics/queries that people might use when looking for information related to "${brandName}".

Brand Description: ${description}
Industry: ${industry}

Generate topics that:
1. Are natural search queries people would actually use
2. Cover different aspects of the brand (products, services, comparisons, reviews, etc.)
3. Include both broad and specific queries
4. Are relevant for AI visibility tracking

Return ONLY a JSON array of topics, each with: topic, category, and searchIntent.
Example: [{"topic": "best CRM software for small business", "category": "product_comparison", "searchIntent": "commercial"}]`;

  try {
    const response = await integrations.llm.chat('openai', [
      { role: 'system', content: 'You are a helpful assistant that generates search topics. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.8,
      maxTokens: 1000,
    });

    // Parse response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse topics from LLM response');
    }

    const topics = JSON.parse(jsonMatch[0]);
    const createdTopics: any[] = [];

    // Store topics
    for (const topicData of topics) {
      const topic = await storage.createTopic({
        brandId,
        topic: topicData.topic,
        category: topicData.category || 'general',
        searchIntent: topicData.searchIntent || 'informational',
        isActive: true,
      });
      createdTopics.push(topic);
    }

    console.log(`[TopicGeneration] Generated ${createdTopics.length} topics for brand ${brandId}`);

    return {
      brandId,
      topicsGenerated: createdTopics.length,
      topics: createdTopics,
      cost: response.cost,
    };

  } catch (error: any) {
    console.error(`[TopicGeneration] Error:`, error.message);
    throw error;
  }
}
