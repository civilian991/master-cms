'use client';

import {
  ContentGenerationRequest,
  ContentGenerationResponse,
  TrendAnalysis,
  ContentTemplate,
  SEOAnalysis,
  GenerationHistory,
  ContentOptimization,
  OptimizationType,
  APIResponse,
} from '../types/ai.types';

class AIApiService {
  private baseUrl = '/api/ai';
  private cache = new Map<string, { data: any; expiry: number }>();
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

  private setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
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

  // HTTP request wrapper
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    useCache = true,
    cacheTTL = 5 * 60 * 1000
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
        console.error(`AI API request failed for ${url}:`, error);
        throw error;
      }
    });
  }

  // Content Generation Methods
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const response = await this.makeRequest<APIResponse<ContentGenerationResponse>>(
      `${this.baseUrl}/generate`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      false // Don't cache generation requests
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate content');
    }

    return response.data;
  }

  async generateContentStream(
    request: ContentGenerationRequest,
    onProgress: (chunk: string, progress: number) => void
  ): Promise<ContentGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let progress = 0;

      if (!reader) {
        throw new Error('No response body available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                content += data.chunk;
                onProgress(data.chunk, data.progress || progress);
              } else if (data.type === 'progress') {
                progress = data.progress;
                onProgress('', progress);
              } else if (data.type === 'complete') {
                return data.result;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }

      throw new Error('Stream ended without completion');
    } catch (error) {
      console.error('Streaming generation failed:', error);
      throw error;
    }
  }

  async optimizeContent(
    content: string,
    type: OptimizationType,
    targets?: any
  ): Promise<ContentOptimization> {
    const response = await this.makeRequest<APIResponse<ContentOptimization>>(
      `${this.baseUrl}/optimize`,
      {
        method: 'POST',
        body: JSON.stringify({ content, type, targets }),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to optimize content');
    }

    return response.data;
  }

  // Trending Topics Methods
  async getTrendingTopics(
    siteId: string,
    categories?: string[],
    limit = 20
  ): Promise<TrendAnalysis> {
    const params = new URLSearchParams({
      siteId,
      limit: limit.toString(),
    });

    if (categories?.length) {
      params.append('categories', categories.join(','));
    }

    const response = await this.makeRequest<APIResponse<TrendAnalysis>>(
      `${this.baseUrl}/trends?${params}`,
      { method: 'GET' },
      true,
      10 * 60 * 1000 // 10-minute cache for trends
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch trending topics');
    }

    return response.data;
  }

  async analyzeTopic(topic: string, siteId: string): Promise<any> {
    const response = await this.makeRequest<APIResponse<any>>(
      `${this.baseUrl}/trends/analyze`,
      {
        method: 'POST',
        body: JSON.stringify({ topic, siteId }),
      },
      true,
      15 * 60 * 1000 // 15-minute cache for topic analysis
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze topic');
    }

    return response.data;
  }

  async getContentGaps(siteId: string, categories?: string[]): Promise<any[]> {
    const params = new URLSearchParams({ siteId });
    
    if (categories?.length) {
      params.append('categories', categories.join(','));
    }

    const response = await this.makeRequest<APIResponse<any[]>>(
      `${this.baseUrl}/gaps?${params}`,
      { method: 'GET' },
      true,
      20 * 60 * 1000 // 20-minute cache for content gaps
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch content gaps');
    }

    return response.data;
  }

  // Template Methods
  async getTemplates(contentType?: string): Promise<ContentTemplate[]> {
    const params = new URLSearchParams();
    
    if (contentType) {
      params.append('contentType', contentType);
    }

    const response = await this.makeRequest<APIResponse<ContentTemplate[]>>(
      `/api/content/templates?${params}`,
      { method: 'GET' },
      true,
      30 * 60 * 1000 // 30-minute cache for templates
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch templates');
    }

    return response.data;
  }

  async createTemplate(template: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentTemplate> {
    const response = await this.makeRequest<APIResponse<ContentTemplate>>(
      `/api/content/templates`,
      {
        method: 'POST',
        body: JSON.stringify(template),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to create template');
    }

    // Clear templates cache
    this.clearCacheByPattern('/api/content/templates');

    return response.data;
  }

  async updateTemplate(templateId: string, updates: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const response = await this.makeRequest<APIResponse<ContentTemplate>>(
      `/api/content/templates/${templateId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update template');
    }

    // Clear templates cache
    this.clearCacheByPattern('/api/content/templates');

    return response.data;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const response = await this.makeRequest<APIResponse<void>>(
      `/api/content/templates/${templateId}`,
      { method: 'DELETE' },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete template');
    }

    // Clear templates cache
    this.clearCacheByPattern('/api/content/templates');
  }

  // SEO Analysis Methods
  async analyzeSEO(content: string, targets?: any): Promise<SEOAnalysis> {
    const response = await this.makeRequest<APIResponse<SEOAnalysis>>(
      `/api/seo/analyze`,
      {
        method: 'POST',
        body: JSON.stringify({ content, targets }),
      },
      false // Don't cache SEO analysis
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze SEO');
    }

    return response.data;
  }

  async getSEOSuggestions(content: string, analysis: SEOAnalysis): Promise<any[]> {
    const response = await this.makeRequest<APIResponse<any[]>>(
      `/api/seo/suggestions`,
      {
        method: 'POST',
        body: JSON.stringify({ content, analysis }),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get SEO suggestions');
    }

    return response.data;
  }

  // Generation History Methods
  async getGenerationHistory(
    siteId: string,
    limit = 50,
    offset = 0
  ): Promise<{ items: GenerationHistory[]; total: number }> {
    const params = new URLSearchParams({
      siteId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await this.makeRequest<APIResponse<{ items: GenerationHistory[]; total: number }>>(
      `${this.baseUrl}/history?${params}`,
      { method: 'GET' },
      true,
      2 * 60 * 1000 // 2-minute cache for history
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch generation history');
    }

    return response.data;
  }

  async saveToHistory(
    request: ContentGenerationRequest,
    response: ContentGenerationResponse
  ): Promise<GenerationHistory> {
    const historyEntry = await this.makeRequest<APIResponse<GenerationHistory>>(
      `${this.baseUrl}/history`,
      {
        method: 'POST',
        body: JSON.stringify({ request, response }),
      },
      false
    );

    if (!historyEntry.success) {
      throw new Error(historyEntry.error || 'Failed to save to history');
    }

    // Clear history cache
    this.clearCacheByPattern(`${this.baseUrl}/history`);

    return historyEntry.data;
  }

  async deleteFromHistory(historyId: string): Promise<void> {
    const response = await this.makeRequest<APIResponse<void>>(
      `${this.baseUrl}/history/${historyId}`,
      { method: 'DELETE' },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete from history');
    }

    // Clear history cache
    this.clearCacheByPattern(`${this.baseUrl}/history`);
  }

  // Suggestion Methods
  async getContentSuggestions(topic: string, contentType: string): Promise<any[]> {
    const response = await this.makeRequest<APIResponse<any[]>>(
      `${this.baseUrl}/suggestions`,
      {
        method: 'POST',
        body: JSON.stringify({ topic, contentType }),
      },
      true,
      10 * 60 * 1000 // 10-minute cache for suggestions
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get content suggestions');
    }

    return response.data;
  }

  async getKeywordSuggestions(topic: string, limit = 20): Promise<string[]> {
    const params = new URLSearchParams({
      topic,
      limit: limit.toString(),
    });

    const response = await this.makeRequest<APIResponse<string[]>>(
      `${this.baseUrl}/keywords?${params}`,
      { method: 'GET' },
      true,
      15 * 60 * 1000 // 15-minute cache for keywords
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get keyword suggestions');
    }

    return response.data;
  }

  // Utility Methods
  async checkAIHealth(): Promise<{ status: string; models: any[] }> {
    const response = await this.makeRequest<any>(
      `${this.baseUrl}/health`,
      { method: 'GET' },
      false
    );

    return response;
  }

  async getAvailableModels(): Promise<any[]> {
    const response = await this.makeRequest<APIResponse<any[]>>(
      `${this.baseUrl}/models`,
      { method: 'GET' },
      true,
      60 * 60 * 1000 // 1-hour cache for models
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch available models');
    }

    return response.data;
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear();
  }

  clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats(): { entries: number; totalSize: number } {
    return {
      entries: this.cache.size,
      totalSize: JSON.stringify(Array.from(this.cache.values())).length,
    };
  }

  // Batch Operations
  async batchGenerateContent(requests: ContentGenerationRequest[]): Promise<ContentGenerationResponse[]> {
    const response = await this.makeRequest<APIResponse<ContentGenerationResponse[]>>(
      `${this.baseUrl}/batch/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ requests }),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to batch generate content');
    }

    return response.data;
  }

  // Content Analysis
  async analyzeContent(content: string): Promise<any> {
    const response = await this.makeRequest<APIResponse<any>>(
      `${this.baseUrl}/analyze`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze content');
    }

    return response.data;
  }

  async generateVariations(
    content: string,
    count = 3,
    variationType = 'tone'
  ): Promise<string[]> {
    const response = await this.makeRequest<APIResponse<string[]>>(
      `${this.baseUrl}/variations`,
      {
        method: 'POST',
        body: JSON.stringify({ content, count, variationType }),
      },
      false
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate variations');
    }

    return response.data;
  }

  // Performance Monitoring
  getPerformanceMetrics(): {
    totalRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  } {
    // This would be implemented with actual performance tracking
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0.85,
      errorRate: 0.02,
    };
  }
}

// Create singleton instance
export const aiApi = new AIApiService();

// Export class for testing
export { AIApiService }; 