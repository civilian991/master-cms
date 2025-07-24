'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiApi } from '../services/aiApi';
import { TrendAnalysis, TrendingTopic } from '../types/ai.types';

interface UseTrendingTopicsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  categories?: string[];
}

export function useTrendingTopics(
  siteId: string,
  options: UseTrendingTopicsOptions = {}
) {
  const { autoRefresh = false, refreshInterval = 300000, categories } = options;

  const [state, setState] = useState<{
    isLoading: boolean;
    data: TrendAnalysis | null;
    error: string | null;
    lastUpdated: Date | null;
  }>({
    isLoading: false,
    data: null,
    error: null,
    lastUpdated: null,
  });

  const fetchTrends = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await aiApi.getTrendingTopics(siteId, categories, 20);
      setState({
        isLoading: false,
        data,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trends',
      }));
    }
  }, [siteId, categories]);

  const analyzeTopic = useCallback(async (topic: string) => {
    try {
      return await aiApi.analyzeTopic(topic, siteId);
    } catch (error) {
      console.error('Topic analysis failed:', error);
      throw error;
    }
  }, [siteId]);

  const getContentGaps = useCallback(async () => {
    try {
      return await aiApi.getContentGaps(siteId, categories);
    } catch (error) {
      console.error('Content gaps fetch failed:', error);
      throw error;
    }
  }, [siteId, categories]);

  // Initial fetch
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchTrends, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchTrends]);

  return {
    ...state,
    refresh: fetchTrends,
    analyzeTopic,
    getContentGaps,
  };
}

export default useTrendingTopics; 