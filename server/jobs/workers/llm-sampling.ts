// LLM Sampling Worker - Runs prompts through LLMs and stores results

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';
import { getIntegrations } from '../../integrations';
import type { LLMMessage } from '../../integrations/llm/base';
import crypto from 'crypto';

export interface LLMSamplingPayload {
  brandId: string;
  promptId: string;
  providers?: Array<'openai' | 'anthropic' | 'google'>;
  model?: string;
}

export async function llmSamplingWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as LLMSamplingPayload;
  const { brandId, promptId, providers = ['openai', 'anthropic', 'google'], model } = payload;

  console.log(`[LLMSampling] Starting sampling for prompt ${promptId}`);

  // Get prompt
  const prompt = await storage.getPrompt(promptId);
  if (!prompt) {
    throw new Error(`Prompt ${promptId} not found`);
  }

  // Check TTL - skip if recent sampling exists
  const { needsEnrichment } = await import('../../services/entity-resolution');
  const samplingCheck = await needsEnrichment(brandId, 'llmSampling');

  if (!samplingCheck.needs) {
    console.log(`[LLMSampling] Skipping sampling for prompt ${promptId}: ${samplingCheck.reason}`);
    console.log(`[LLMSampling] Last sampled: ${samplingCheck.lastEnriched}`);
    
    // Return existing recent results
    const recentRuns = await storage.getPromptRunsByPrompt(promptId, 1);
    if (recentRuns.length > 0) {
      return {
        promptId,
        brandId,
        skipped: true,
        reason: samplingCheck.reason,
        lastSampled: samplingCheck.lastEnriched,
        recentRunId: recentRuns[0].id,
      };
    }
  }

  console.log(`[LLMSampling] Sampling needed: ${samplingCheck.reason}`);

  // Get brand context for personalization
  const context = await storage.getBrandContext(brandId);
  const brandName = context?.brandIdentity?.officialName || '';

  // Create prompt run
  const promptRun = await storage.createPromptRun({
    promptId,
    brandId,
    status: 'running',
    providersUsed: providers,
  });

  const integrations = getIntegrations();
  if (!integrations.llm) {
    throw new Error('LLM integrations not configured');
  }

  const results: any[] = [];
  let totalCost = 0;
  let totalTokens = 0;

  // Build messages
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Provide accurate, informative responses.',
    },
    {
      role: 'user',
      content: prompt.text,
    },
  ];

  // Run through each provider
  for (const provider of providers) {
    try {
      console.log(`[LLMSampling] Querying ${provider} for prompt ${promptId}`);
      
      const response = await integrations.llm.chat(provider, messages, {
        model,
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Calculate response hash for drift detection
      const responseHash = crypto
        .createHash('sha256')
        .update(response.content)
        .digest('hex');

      // Store LLM answer
      const llmAnswer = await storage.createLlmAnswer({
        promptId,
        brandId,
        llmProvider: provider,
        llmModel: response.model,
        rawResponse: response.content,
        responseHash,
        tokensUsed: response.usage.totalTokens,
        cost: response.cost,
      });

      // Drift detection - compare with previous response
      const previousAnswers = await storage.getLlmAnswersByPrompt(promptId, 2);
      if (previousAnswers.length >= 2) {
        const { analyzeDrift, shouldAlert, formatDriftReport } = await import('../../services/drift-detection');
        
        const previous = previousAnswers[1]; // Second item is the previous one
        const current = llmAnswer;

        const driftAnalysis = analyzeDrift({
          previous: {
            hash: previous.responseHash,
            content: previous.rawResponse,
            mentions: [], // Will be extracted in analyzeDrift
            timestamp: previous.createdAt,
          },
          current: {
            hash: current.responseHash,
            content: current.rawResponse,
            mentions: [],
            timestamp: current.createdAt,
          },
        }, brandName);

        // Log drift if detected
        if (driftAnalysis.hasDrift) {
          console.log(`[LLMSampling] Drift detected for ${provider}: ${driftAnalysis.driftScore}/100 (${driftAnalysis.significance})`);
          console.log(formatDriftReport(driftAnalysis));

          // Store drift alert if significant
          if (shouldAlert(driftAnalysis)) {
            await storage.createUsageLog({
              brandId,
              type: 'drift_alert',
              amount: driftAnalysis.driftScore,
              metadata: {
                provider,
                model: response.model,
                promptId,
                significance: driftAnalysis.significance,
                alerts: driftAnalysis.alerts,
                changes: driftAnalysis.changes,
              },
              timestamp: new Date(),
            });
          }
        }
      }

      // Parse mentions (simple keyword search - can be enhanced with NLP)
      const mentions = [];
      const lowerResponse = response.content.toLowerCase();
      
      if (brandName && lowerResponse.includes(brandName.toLowerCase())) {
        const position = lowerResponse.indexOf(brandName.toLowerCase());
        mentions.push({
          llmAnswerId: llmAnswer.id,
          brandId,
          entityType: 'brand' as const,
          entityName: brandName,
          mentionText: response.content.substring(Math.max(0, position - 50), position + brandName.length + 50),
          position,
          sentiment: 'neutral' as const, // Simplified - should use sentiment analysis
        });
      }

      // Store mentions
      for (const mention of mentions) {
        await storage.createAnswerMention(mention);
      }

      // Extract citations (URLs in response)
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = response.content.match(urlRegex) || [];
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const domain = new URL(url).hostname;
        
        await storage.createAnswerCitation({
          llmAnswerId: llmAnswer.id,
          url,
          domain,
          position: i + 1,
          citationType: 'inline',
        });
      }

      totalCost += response.cost;
      totalTokens += response.usage.totalTokens;

      results.push({
        provider,
        model: response.model,
        answerId: llmAnswer.id,
        mentions: mentions.length,
        citations: urls.length,
        cost: response.cost,
        tokens: response.usage.totalTokens,
      });

    } catch (error: any) {
      console.error(`[LLMSampling] Error with ${provider}:`, error.message);
      // Continue with other providers
    }
  }

  // Update prompt run
  await storage.updatePromptRun(promptRun.id, {
    status: 'completed',
    answersGenerated: results.length,
    totalCost,
    totalTokens,
    completedAt: new Date(),
  });

  console.log(`[LLMSampling] Completed sampling for prompt ${promptId} - ${results.length} answers, $${totalCost.toFixed(4)}`);

  // Trigger visibility scoring after LLM sampling completes
  try {
    const { triggerVisibilityScoring } = await import('../index');
    await triggerVisibilityScoring(brandId, 'week', 5);
    console.log(`[LLMSampling] Triggered visibility scoring for brand ${brandId}`);
  } catch (error: any) {
    console.error(`[LLMSampling] Failed to trigger visibility scoring:`, error.message);
    // Don't fail the job if visibility scoring trigger fails
  }

  return {
    promptId,
    brandId,
    results,
    totalCost,
    totalTokens,
  };
}
