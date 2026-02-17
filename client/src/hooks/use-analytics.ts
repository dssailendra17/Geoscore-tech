// React Query hooks for Analytics

import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from '../lib/api';

export function useLLMAnswers(brandId: string, limit = 100) {
  return useQuery({
    queryKey: ['llmAnswers', brandId, limit],
    queryFn: () => api.getLLMAnswers(brandId, limit),
    enabled: !!brandId,
  });
}

export function usePromptRuns(brandId: string, limit = 100) {
  return useQuery({
    queryKey: ['promptRuns', brandId, limit],
    queryFn: () => api.getPromptRuns(brandId, limit),
    enabled: !!brandId,
  });
}

export function useMentions(brandId: string, limit = 100) {
  return useQuery({
    queryKey: ['mentions', brandId, limit],
    queryFn: () => api.getMentions(brandId, limit),
    enabled: !!brandId,
  });
}

export function useVisibilityScores(brandId: string, period?: string, limit = 30) {
  return useQuery({
    queryKey: ['visibilityScores', brandId, period, limit],
    queryFn: () => api.getVisibilityScores(brandId, period, limit),
    enabled: !!brandId,
  });
}

export function useLatestVisibilityScore(brandId: string) {
  return useQuery({
    queryKey: ['latestVisibilityScore', brandId],
    queryFn: () => api.getLatestVisibilityScore(brandId),
    enabled: !!brandId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTrends(brandId: string, limit = 90) {
  return useQuery({
    queryKey: ['trends', brandId, limit],
    queryFn: () => api.getTrends(brandId, limit),
    enabled: !!brandId,
  });
}

export function useTriggerLLMSampling() {
  return useMutation({
    mutationFn: ({ promptId, providers }: { promptId: string; providers?: string[] }) =>
      api.triggerLLMSampling(promptId, providers),
  });
}
