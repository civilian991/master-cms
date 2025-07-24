'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchApi } from '../services/searchApi';

export interface TrendingItem {
  id: string;
  query: string;
  title: string;
  description: string;
  count: number;
  trend: 'up' | 'down' | 'new';
  category?: string;
}

export interface UseTrendingReturn {
  trending: TrendingItem[];
  popular: TrendingItem[];
  isLoading: boolean;
  error: string | null;
  getTrending: () => Promise<void>;
  getPopular: () => Promise<void>;
  clearTrending: () => void;
}

export function useTrending(): UseTrendingReturn {
  // State
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [popular, setPopular] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController>();

  // Clear any ongoing requests
  const clearRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Get trending content
  const getTrending = useCallback(async () => {
    try {
      clearRequest();
      setIsLoading(true);
      setError(null);

      const result = await searchApi.getTrendingSuggestions({
        limit: 10,
        timeframe: 'daily',
      });

      const trendingItems: TrendingItem[] = result.map((item: any, index: number) => ({
        id: `trending-${index}`,
        query: item.text || item.query || item.title,
        title: item.title || item.text,
        description: item.description || `Trending search query`,
        count: item.count || 0,
        trend: item.trend || 'up',
        category: item.category,
      }));

      setTrending(trendingItems);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get trending content';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Trending error:', err);
    }
  }, [clearRequest]);

  // Get popular content
  const getPopular = useCallback(async () => {
    try {
      const result = await searchApi.getPopularSuggestions({
        limit: 10,
      });

      const popularItems: TrendingItem[] = result.map((item: any, index: number) => ({
        id: `popular-${index}`,
        query: item.text || item.query || item.title,
        title: item.title || item.text,
        description: item.description || `Popular content`,
        count: item.count || 0,
        trend: 'up' as const,
        category: item.category,
      }));

      setPopular(popularItems);
    } catch (err) {
      console.error('Popular content error:', err);
    }
  }, []);

  // Clear trending data
  const clearTrending = useCallback(() => {
    setTrending([]);
    setPopular([]);
    setError(null);
    setIsLoading(false);
    clearRequest();
  }, [clearRequest]);

  // Load both trending and popular on mount
  useEffect(() => {
    getTrending();
    getPopular();
  }, [getTrending, getPopular]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRequest();
    };
  }, [clearRequest]);

  return {
    trending,
    popular,
    isLoading,
    error,
    getTrending,
    getPopular,
    clearTrending,
  };
}

export default useTrending; 