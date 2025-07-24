'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AutoCompleteRequest,
  AutoCompleteResponse,
  Suggestion,
  UseAutoCompleteOptions,
} from '../types/search.types';
import { searchApi } from '../services/searchApi';

export interface UseAutoCompleteReturn {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  getSuggestions: (query: string) => Promise<void>;
  clearSuggestions: () => void;
}

export function useAutoComplete(options: UseAutoCompleteOptions = {}): UseAutoCompleteReturn {
  const {
    minLength = 2,
    maxSuggestions = 10,
    debounceTime = 300,
    sources = [],
    caching = true,
  } = options;

  // State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Clear any ongoing requests
  const clearRequest = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Get suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < minLength) {
      setSuggestions([]);
      return;
    }

    try {
      clearRequest();
      setIsLoading(true);
      setError(null);

      const request: AutoCompleteRequest = {
        query,
        limit: maxSuggestions,
        includePopular: true,
        includeTrending: true,
        includePersonalized: true,
      };

      const response = await searchApi.autoComplete(request);
      setSuggestions(response.suggestions);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get suggestions';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Autocomplete error:', err);
    }
  }, [minLength, maxSuggestions, clearRequest]);

  // Debounced version
  const debouncedGetSuggestions = useCallback((query: string) => {
    clearRequest();
    
    debounceRef.current = setTimeout(() => {
      getSuggestions(query);
    }, debounceTime);
  }, [getSuggestions, debounceTime, clearRequest]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
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
    suggestions,
    isLoading,
    error,
    getSuggestions: debouncedGetSuggestions,
    clearSuggestions,
  };
}

// Legacy export for compatibility
export const useAutocomplete = useAutoComplete;

export default useAutoComplete; 