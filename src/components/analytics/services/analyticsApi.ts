'use client';

import { 
  UserMetrics, 
  ContentMetrics, 
  RealTimeData, 
  ExportParams, 
  ExportResponse, 
  AnalyticsFilters, 
  ApiResponse, 
  CacheEntry,
  TimeRange 
} from '../types/analytics.types';

class AnalyticsApiService {
  private baseUrl = '/api/analytics';
  private cache = new Map<string, CacheEntry>();
  private requestQueue = new Map<string, Promise<any>>();

  // Cache management
  private generateCacheKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    };
    
    this.cache.set(key, entry);
  }

  // Request deduplication
  private async deduplicate<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key) as Promise<T>;
    }

    const promise = request().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // HTTP request wrapper with error handling
  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {},
    useCache = true,
    cacheTTL = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url, options.body ? JSON.parse(options.body as string) : {});
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    // Deduplicate identical requests
    return this.deduplicate(cacheKey, async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful responses
        if (useCache && response.status === 200) {
          this.setCache(cacheKey, data, cacheTTL);
        }

        return data;
      } catch (error) {
        console.error(`API request failed for ${url}:`, error);
        throw error;
      }
    });
  }

  // User Analytics Methods
  async getUserMetrics(filters: AnalyticsFilters): Promise<UserMetrics> {
    const params = new URLSearchParams({
      siteId: filters.siteId,
      timeRange: filters.timeRange.value,
    });

    const response = await this.makeRequest<ApiResponse<UserMetrics>>(
      `${this.baseUrl}/users?${params}`,
      { method: 'GET' },
      true,
      5 * 60 * 1000 // 5-minute cache
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user metrics');
    }

    return response.data;
  }

  async getUserTrends(filters: AnalyticsFilters, granularity: 'hour' | 'day' | 'week' = 'day'): Promise<any[]> {
    const params = new URLSearchParams({
      siteId: filters.siteId,
      timeRange: filters.timeRange.value,
      granularity,
    });

    const response = await this.makeRequest<ApiResponse<any[]>>(
      `${this.baseUrl}/users/trends?${params}`,
      { method: 'GET' },
      true,
      10 * 60 * 1000 // 10-minute cache
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user trends');
    }

    return response.data;
  }

  // Content Analytics Methods
  async getContentMetrics(filters: AnalyticsFilters, limit = 20): Promise<ContentMetrics[]> {
    const params = new URLSearchParams({
      siteId: filters.siteId,
      timeRange: filters.timeRange.value,
      limit: limit.toString(),
    });

    if (filters.contentType && filters.contentType !== 'all') {
      params.append('contentType', filters.contentType);
    }
    if (filters.categoryId) {
      params.append('categoryId', filters.categoryId);
    }
    if (filters.authorId) {
      params.append('authorId', filters.authorId);
    }

    const response = await this.makeRequest<ApiResponse<ContentMetrics[]>>(
      `/api/content/analytics?${params}`,
      { method: 'GET' },
      true,
      10 * 60 * 1000 // 10-minute cache
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch content metrics');
    }

    return response.data;
  }

  async getContentAnalytics(contentId: string, days = 30): Promise<ContentMetrics> {
    const params = new URLSearchParams({
      days: days.toString(),
    });

    const response = await this.makeRequest<ContentMetrics>(
      `/api/content/analytics/${contentId}?${params}`,
      { method: 'GET' },
      true,
      5 * 60 * 1000 // 5-minute cache
    );

    return response;
  }

  // Real-time Analytics Methods
  async getRealTimeData(siteId: string): Promise<RealTimeData> {
    const params = new URLSearchParams({ siteId });

    const response = await this.makeRequest<ApiResponse<RealTimeData>>(
      `${this.baseUrl}/realtime?${params}`,
      { method: 'GET' },
      false // No caching for real-time data
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch real-time data');
    }

    return response.data;
  }

  // Export Methods
  async exportData(params: ExportParams): Promise<ExportResponse> {
    const response = await this.makeRequest<ApiResponse<ExportResponse>>(
      `${this.baseUrl}/export`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      false // No caching for exports
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to export data');
    }

    return response.data;
  }

  async downloadExport(downloadUrl: string): Promise<Blob> {
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Health Check
  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }> {
    const startTime = Date.now();
    
    try {
      await this.makeRequest<any>(
        `${this.baseUrl}/health`,
        { method: 'GET' },
        false
      );
      
      const latency = Date.now() - startTime;
      return {
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
      };
    }
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { entries: number; totalSize: number; hitRate: number } {
    // This is a simplified implementation
    // In production, you'd track hits/misses for accurate hit rate
    return {
      entries: this.cache.size,
      totalSize: JSON.stringify(Array.from(this.cache.values())).length,
      hitRate: 0.85, // Placeholder
    };
  }

  // Batch Operations
  async batchRequest<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    const results = await Promise.allSettled(requests.map(req => req()));
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch request ${index} failed:`, result.reason);
        throw result.reason;
      }
    });
  }

  // Utility Methods
  formatMetricValue(value: number, type: 'number' | 'percentage' | 'duration' | 'bytes'): string {
    switch (type) {
      case 'number':
        return value.toLocaleString();
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'duration':
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      case 'bytes':
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = value;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
      default:
        return value.toString();
    }
  }

  calculateTrend(current: number, previous: number): { direction: 'up' | 'down' | 'neutral'; percentage: number } {
    if (previous === 0) {
      return { direction: 'neutral', percentage: 0 };
    }

    const change = ((current - previous) / previous) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change),
    };
  }
}

// Create singleton instance
export const analyticsApi = new AnalyticsApiService();

// Export class for testing
export { AnalyticsApiService }; 