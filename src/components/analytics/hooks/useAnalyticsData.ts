'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import { 
  UserMetrics, 
  ContentMetrics, 
  AnalyticsFilters, 
  LoadingState,
  TimeRange 
} from '../types/analytics.types';

interface UseAnalyticsDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
  onError?: (error: Error) => void;
  onDataUpdate?: (data: any) => void;
}

interface UseAnalyticsDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// Generic analytics data hook
export function useAnalyticsData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataReturn<T> {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    enableCache = true,
    onError,
    onDataUpdate,
  } = options;

  const [state, setState] = useState<LoadingState & { data: T | null }>({
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<Promise<void> | null>(null);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchData = useCallback(async (): Promise<void> => {
    // Prevent multiple concurrent fetches
    if (lastFetchRef.current) {
      return lastFetchRef.current;
    }

    const fetchPromise = (async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await fetchFunction();

        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            data: result,
            isLoading: false,
            lastUpdated: new Date(),
          }));

          onDataUpdate?.(result);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));

          onError?.(error instanceof Error ? error : new Error(errorMessage));
        }
      } finally {
        lastFetchRef.current = null;
      }
    })();

    lastFetchRef.current = fetchPromise;
    return fetchPromise;
  }, [fetchFunction, onError, onDataUpdate]);

  // Initial fetch and dependency updates
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchData, refreshInterval);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data: state.data,
    loading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refresh: fetchData,
    clearError,
  };
}

// Specialized hook for user metrics
export function useUserMetrics(
  filters: AnalyticsFilters,
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataReturn<UserMetrics> {
  const fetchUserMetrics = useCallback(
    () => analyticsApi.getUserMetrics(filters),
    [filters.siteId, filters.timeRange.value]
  );

  return useAnalyticsData(
    fetchUserMetrics,
    [filters.siteId, filters.timeRange.value],
    {
      autoRefresh: true,
      refreshInterval: 60000, // 1 minute default for user metrics
      ...options,
    }
  );
}

// Specialized hook for content metrics
export function useContentMetrics(
  filters: AnalyticsFilters,
  limit = 20,
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataReturn<ContentMetrics[]> {
  const fetchContentMetrics = useCallback(
    () => analyticsApi.getContentMetrics(filters, limit),
    [filters.siteId, filters.timeRange.value, filters.contentType, filters.categoryId, filters.authorId, limit]
  );

  return useAnalyticsData(
    fetchContentMetrics,
    [filters.siteId, filters.timeRange.value, filters.contentType, filters.categoryId, filters.authorId, limit],
    {
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes default for content metrics
      ...options,
    }
  );
}

// Specialized hook for user trends
export function useUserTrends(
  filters: AnalyticsFilters,
  granularity: 'hour' | 'day' | 'week' = 'day',
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataReturn<any[]> {
  const fetchUserTrends = useCallback(
    () => analyticsApi.getUserTrends(filters, granularity),
    [filters.siteId, filters.timeRange.value, granularity]
  );

  return useAnalyticsData(
    fetchUserTrends,
    [filters.siteId, filters.timeRange.value, granularity],
    {
      autoRefresh: true,
      refreshInterval: 120000, // 2 minutes default for trends
      ...options,
    }
  );
}

// Hook for batch analytics data
export function useBatchAnalytics(
  filters: AnalyticsFilters,
  options: UseAnalyticsDataOptions = {}
): {
  userMetrics: UseAnalyticsDataReturn<UserMetrics>;
  contentMetrics: UseAnalyticsDataReturn<ContentMetrics[]>;
  userTrends: UseAnalyticsDataReturn<any[]>;
  isLoading: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
} {
  const userMetrics = useUserMetrics(filters, { ...options, autoRefresh: false });
  const contentMetrics = useContentMetrics(filters, 10, { ...options, autoRefresh: false });
  const userTrends = useUserTrends(filters, 'day', { ...options, autoRefresh: false });

  const isLoading = userMetrics.loading || contentMetrics.loading || userTrends.loading;
  const hasError = !!(userMetrics.error || contentMetrics.error || userTrends.error);

  const refresh = useCallback(async () => {
    await Promise.all([
      userMetrics.refresh(),
      contentMetrics.refresh(),
      userTrends.refresh(),
    ]);
  }, [userMetrics.refresh, contentMetrics.refresh, userTrends.refresh]);

  // Auto-refresh batch data
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(refresh, options.refreshInterval || 300000); // 5 minutes default
      return () => clearInterval(interval);
    }
  }, [refresh, options.autoRefresh, options.refreshInterval]);

  return {
    userMetrics,
    contentMetrics,
    userTrends,
    isLoading,
    hasError,
    refresh,
  };
}

// Hook for analytics with time range management
export function useAnalyticsWithTimeRange(
  siteId: string,
  initialTimeRange: TimeRange,
  options: UseAnalyticsDataOptions = {}
): {
  timeRange: TimeRange;
  setTimeRange: (timeRange: TimeRange) => void;
  filters: AnalyticsFilters;
  analytics: ReturnType<typeof useBatchAnalytics>;
} {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);

  const filters: AnalyticsFilters = {
    siteId,
    timeRange,
  };

  const analytics = useBatchAnalytics(filters, options);

  return {
    timeRange,
    setTimeRange,
    filters,
    analytics,
  };
}

// Hook for conditional analytics loading
export function useConditionalAnalytics<T>(
  condition: boolean,
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataReturn<T> {
  const conditionalFetch = useCallback(
    () => condition ? fetchFunction() : Promise.resolve(null as T),
    [condition, fetchFunction]
  );

  return useAnalyticsData(
    conditionalFetch,
    [condition, ...dependencies],
    options
  );
}

// Hook for analytics health monitoring
export function useAnalyticsHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: Date | null;
  checkHealth: () => Promise<void>;
} {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    lastCheck: Date | null;
  }>({
    status: 'healthy',
    latency: 0,
    lastCheck: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      const result = await analyticsApi.checkHealth();
      setHealth({
        status: result.status,
        latency: result.latency,
        lastCheck: new Date(),
      });
    } catch (error) {
      setHealth({
        status: 'unhealthy',
        latency: 0,
        lastCheck: new Date(),
      });
    }
  }, []);

  // Periodic health checks
  useEffect(() => {
    checkHealth(); // Initial check
    
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    ...health,
    checkHealth,
  };
} 