'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchFilter,
  SearchFacet,
  SearchSuggestion,
  SearchRecommendation,
  UseSearchOptions,
  SearchMetadata,
  SearchAnalytics,
} from '../types/search.types';
import { searchApi } from '../services/searchApi';

export interface UseSearchReturn {
  // Results
  results: SearchResult[];
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
  recommendations: SearchRecommendation[];
  metadata: SearchMetadata | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  search: (query: SearchQuery) => Promise<SearchResponse | null>;
  clearResults: () => void;
  
  // Legacy compatibility
  searchResults: SearchResponse | null;
  isSearching: boolean;
  searchError: string | null;
  performSearch: (query: SearchQuery) => Promise<SearchResponse | null>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    provider = 'custom',
    mode = 'instant',
    autoSearch = false,
    debounceTime = 300,
    caching = true,
    analytics = true,
    personalization = true,
  } = options;

  // State
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
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

  // Main search function
  const search = useCallback(async (query: SearchQuery): Promise<SearchResponse | null> => {
    try {
      // Clear previous request
      clearRequest();

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // Perform search
      const response = await searchApi.search(query);

      // Update state
      setSearchResponse(response);
      setIsLoading(false);

      // Track analytics if enabled
      if (analytics) {
        searchApi.trackSearchEvent(query, response);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Search error:', err);
      return null;
    }
  }, [analytics, clearRequest]);

  // Debounced search for auto-search
  const debouncedSearch = useCallback((query: SearchQuery) => {
    clearRequest();
    
    debounceRef.current = setTimeout(() => {
      search(query);
    }, debounceTime);
  }, [search, debounceTime, clearRequest]);

  // Clear results
  const clearResults = useCallback(() => {
    setSearchResponse(null);
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

  // Extract data from response
  const results = searchResponse?.results || [];
  const facets = searchResponse?.facets || [];
  const suggestions = searchResponse?.suggestions || [];
  const recommendations = searchResponse?.recommendations || [];
  const metadata = searchResponse?.metadata || null;

  return {
    // New API
    results,
    facets,
    suggestions,
    recommendations,
    metadata,
    isLoading,
    error,
    search: autoSearch ? debouncedSearch : search,
    clearResults,
    
    // Legacy compatibility
    searchResults: searchResponse,
    isSearching: isLoading,
    searchError: error,
    performSearch: search,
  };
}

export default useSearch; 