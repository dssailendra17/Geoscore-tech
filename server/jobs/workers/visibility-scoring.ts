// Visibility Scoring Worker - Calculates visibility scores based on LLM mentions

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';

export interface VisibilityScoringPayload {
  brandId: string;
  period?: 'day' | 'week' | 'month';
}

export async function visibilityScoringWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as VisibilityScoringPayload;
  const { brandId, period = 'week' } = payload;

  console.log(`[VisibilityScoring] Starting scoring for brand ${brandId} (${period})`);

  // Get brand
  const brand = await storage.getBrand(brandId);
  if (!brand) {
    throw new Error(`Brand ${brandId} not found`);
  }

  // Calculate date range based on period
  const now = new Date();
  const startDate = new Date();
  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  // Get all LLM answers in period
  const allAnswers = await storage.getLlmAnswersByBrand(brandId, 10000);
  const answersInPeriod = allAnswers.filter(a => 
    new Date(a.createdAt) >= startDate
  );

  // Get all mentions in period
  const allMentions = await storage.getAnswerMentionsByBrand(brandId, 10000);
  const mentionsInPeriod = allMentions.filter(m => 
    new Date(m.createdAt) >= startDate && m.entityType === 'brand'
  );

  // Calculate metrics
  const totalPrompts = answersInPeriod.length;
  const mentionedPrompts = new Set(mentionsInPeriod.map(m => m.llmAnswerId)).size;
  const mentionRate = totalPrompts > 0 ? (mentionedPrompts / totalPrompts) * 100 : 0;

  // Calculate average position
  const positions = mentionsInPeriod.map(m => m.position).filter(p => p !== null);
  const avgPosition = positions.length > 0
    ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length
    : 0;

  // Calculate position distribution
  const positionDistribution = {
    first: mentionsInPeriod.filter(m => m.position === 1).length,
    topThree: mentionsInPeriod.filter(m => m.position <= 3).length,
    topFive: mentionsInPeriod.filter(m => m.position <= 5).length,
    other: mentionsInPeriod.filter(m => m.position > 5).length,
  };

  // Calculate sentiment distribution
  const sentimentDistribution = {
    positive: mentionsInPeriod.filter(m => m.sentiment === 'positive').length,
    neutral: mentionsInPeriod.filter(m => m.sentiment === 'neutral').length,
    negative: mentionsInPeriod.filter(m => m.sentiment === 'negative').length,
  };

  // Calculate sentiment score (positive: +1, neutral: 0, negative: -1)
  const sentimentScore = mentionsInPeriod.length > 0
    ? (sentimentDistribution.positive - sentimentDistribution.negative) / mentionsInPeriod.length * 100
    : 0;

  // Get citations
  const citations = await Promise.all(
    mentionsInPeriod.map(async (mention) => {
      return await storage.getAnswerCitationsByAnswer(mention.llmAnswerId);
    })
  );
  const totalCitations = citations.flat().length;
  const avgCitationsPerMention = mentionsInPeriod.length > 0
    ? totalCitations / mentionsInPeriod.length
    : 0;

  // Calculate overall visibility score (0-100)
  const overallScore = Math.round(
    (mentionRate * 0.4) + // 40% weight on mention rate
    ((1 - (avgPosition / 10)) * 100 * 0.3) + // 30% weight on position (lower is better)
    ((sentimentScore + 100) / 2 * 0.2) + // 20% weight on sentiment
    (Math.min(avgCitationsPerMention * 10, 100) * 0.1) // 10% weight on citations
  );

  // Determine trend by comparing with previous period
  const previousScores = await storage.getVisibilityScoresByBrand(brandId, period, 2);
  let trend: 'up' | 'down' | 'stable' = 'stable';
  
  if (previousScores.length > 0) {
    const previousScore = previousScores[0].overallScore;
    const diff = overallScore - previousScore;
    if (diff > 5) trend = 'up';
    else if (diff < -5) trend = 'down';
  }

  // Calculate provider breakdown
  const providerBreakdown: Record<string, any> = {};
  const answersByProvider = answersInPeriod.reduce((acc, answer) => {
    if (!acc[answer.llmProvider]) {
      acc[answer.llmProvider] = [];
    }
    acc[answer.llmProvider].push(answer);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(answersByProvider).forEach(([provider, answers]) => {
    const providerMentions = mentionsInPeriod.filter(m =>
      answers.some(a => a.id === m.llmAnswerId)
    );
    providerBreakdown[provider] = {
      totalAnswers: answers.length,
      mentions: providerMentions.length,
      mentionRate: (providerMentions.length / answers.length) * 100,
      avgPosition: providerMentions.length > 0
        ? providerMentions.reduce((sum, m) => sum + (m.position || 0), 0) / providerMentions.length
        : 0,
    };
  });

  // Store visibility score
  const visibilityScore = await storage.createVisibilityScore({
    brandId,
    period,
    overallScore,
    mentionRate,
    avgPosition,
    sentimentScore,
    trend,
    totalPrompts,
    totalMentions: mentionsInPeriod.length,
    positionDistribution,
    sentimentDistribution,
    providerBreakdown,
  });

  // Create trend snapshot
  await storage.createTrendSnapshot({
    brandId,
    snapshotDate: now,
    visibilityScore: overallScore,
    mentionCount: mentionsInPeriod.length,
    avgPosition,
    sentimentScore,
    trend,
    metadata: {
      period,
      totalPrompts,
      providerBreakdown,
    },
  });

  console.log(`[VisibilityScoring] Completed for brand ${brandId} - Score: ${overallScore}`);

  // Trigger gap analysis after visibility scoring completes
  try {
    const { triggerGapAnalysis } = await import('../index');
    await triggerGapAnalysis(brandId, 'month', 5);
    console.log(`[VisibilityScoring] Triggered gap analysis for brand ${brandId}`);
  } catch (error: any) {
    console.error(`[VisibilityScoring] Failed to trigger gap analysis:`, error.message);
    // Don't fail the job if gap analysis trigger fails
  }

  return {
    brandId,
    period,
    score: overallScore,
    mentionRate,
    avgPosition,
    sentimentScore,
    trend,
    totalMentions: mentionsInPeriod.length,
  };
}
