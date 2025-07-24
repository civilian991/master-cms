'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SearchRecommendation,
  RecommendationType,
  UseRecommendationsOptions,
  SearchResult,
} from '../types/search.types';
import { searchApi } from '../services/searchApi';

export interface UseRecommendationsReturn {
  recommendations: SearchRecommendation[];
  isLoading: boolean;
  error: string | null;
  getRecommendations: (type: RecommendationType, options?: any) => Promise<void>;
  clearRecommendations: () => void;
}

export function useRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const {
    algorithms = ['collaborative', 'content_based'],
    realTime = false,
    personalization = true,
    diversity = 0.3,
    novelty = 0.2,
  } = options;

  // State
  const [recommendations, setRecommendations] = useState<SearchRecommendation[]>([]);
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

  // Get recommendations
  const getRecommendations = useCallback(async (type: RecommendationType, additionalOptions: any = {}) => {
    try {
      clearRequest();
      setIsLoading(true);
      setError(null);

      const requestOptions = {
        type,
        limit: 10,
        ...additionalOptions,
      };

      const result = await searchApi.getRecommendations(requestOptions);
      setRecommendations(result);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Recommendations error:', err);
    }
  }, [clearRequest]);

  // Clear recommendations
  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setError(null);
    setIsLoading(false);
    clearRequest();
  }, [clearRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRequest();
    };
  }, [clearRequest]);

  return {
    recommendations,
    isLoading,
    error,
    getRecommendations,
    clearRecommendations,
  };
}

export default useRecommendations; 