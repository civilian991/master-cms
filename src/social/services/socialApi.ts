'use client';

import {
  SocialPlatform,
  SocialAccount,
  SocialPost,
  PublishingRequest,
  PublishingResponse,
  AnalyticsRequest,
  AnalyticsResponse,
  BrandMention,
  SocialCampaign,
  TrendingTopic,
  Influencer,
  AutomationWorkflow,
  SocialApiRequest,
  SocialApiResponse,
  PostAnalytics,
  PlatformPublishResult,
} from '../types/social.types';

class SocialApiService {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private rateLimits = new Map<string, { remaining: number; resetAt: Date }>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCacheKey(endpoint: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramStr}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================================================
  // RATE LIMIT MANAGEMENT
  // ============================================================================

  private async checkRateLimit(platform: SocialPlatform): Promise<boolean> {
    const key = `rateLimit:${platform}`;
    const limit = this.rateLimits.get(key);
    
    if (limit && limit.remaining <= 0 && new Date() < limit.resetAt) {
      const waitTime = limit.resetAt.getTime() - Date.now();
      throw new Error(`Rate limit exceeded for ${platform}. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    return true;
  }

  private updateRateLimit(platform: SocialPlatform, response: Response): void {
    const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '100');
    const resetTime = response.headers.get('x-ratelimit-reset');
    const resetAt = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(Date.now() + 3600000);
    
    this.rateLimits.set(`rateLimit:${platform}`, { remaining, resetAt });
  }

  // ============================================================================
  // HTTP CLIENT WITH RETRY LOGIC
  // ============================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    platform?: SocialPlatform,
    cacheTTL?: number,
    useCache: boolean = true
  ): Promise<T> {
    // Check rate limits
    if (platform) {
      await this.checkRateLimit(platform);
    }

    const cacheKey = this.getCacheKey(endpoint, { ...options, body: options.body });

    // Check cache for GET requests
    if ((options.method === 'GET' || !options.method) && useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    // Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options, platform);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache successful GET requests
      if ((options.method === 'GET' || !options.method) && useCache && cacheTTL) {
        this.setCache(cacheKey, result, cacheTTL);
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit,
    platform?: SocialPlatform
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    let lastError: Error;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);

        // Update rate limits
        if (platform) {
          this.updateRateLimit(platform, response);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }

        return await response.text() as any;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Network request failed');

        // Don't retry on rate limit errors
        if (lastError.message.includes('Rate limit exceeded')) {
          throw lastError;
        }

        if (attempt === maxRetries - 1) break;

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  async getAccounts(userId: string): Promise<SocialAccount[]> {
    return this.makeRequest<SocialAccount[]>(
      `/social/accounts?userId=${userId}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async connectAccount(platform: SocialPlatform, authCode: string): Promise<SocialAccount> {
    const response = await this.makeRequest<SocialAccount>(
      '/social/accounts/connect',
      {
        method: 'POST',
        body: JSON.stringify({ platform, authCode }),
      },
      platform,
      0,
      false
    );

    this.clearCacheByPattern('/social/accounts');
    return response;
  }

  async disconnectAccount(accountId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/social/accounts/${accountId}/disconnect`,
      { method: 'POST' },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/accounts');
    return response;
  }

  async refreshAccount(accountId: string): Promise<SocialAccount> {
    const response = await this.makeRequest<SocialAccount>(
      `/social/accounts/${accountId}/refresh`,
      { method: 'POST' },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/accounts');
    return response;
  }

  async getAccountMetrics(accountId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.set('start', dateRange.start.toISOString());
      params.set('end', dateRange.end.toISOString());
    }

    return this.makeRequest(
      `/social/accounts/${accountId}/metrics?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // CONTENT PUBLISHING
  // ============================================================================

  async publishPost(request: PublishingRequest): Promise<PublishingResponse> {
    return this.makeRequest<PublishingResponse>(
      '/social/publishing/publish',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      undefined,
      0,
      false
    );
  }

  async schedulePost(post: SocialPost): Promise<SocialPost> {
    const response = await this.makeRequest<SocialPost>(
      '/social/publishing/schedule',
      {
        method: 'POST',
        body: JSON.stringify(post),
      },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/posts');
    return response;
  }

  async updateScheduledPost(postId: string, updates: Partial<SocialPost>): Promise<SocialPost> {
    const response = await this.makeRequest<SocialPost>(
      `/social/posts/${postId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/posts');
    return response;
  }

  async deletePost(postId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/social/posts/${postId}`,
      { method: 'DELETE' },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/posts');
    return response;
  }

  async getPosts(filters?: {
    accountId?: string;
    platform?: SocialPlatform;
    status?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  }): Promise<SocialPost[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'dateRange' && value) {
            params.set('start', value.start.toISOString());
            params.set('end', value.end.toISOString());
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    return this.makeRequest<SocialPost[]>(
      `/social/posts?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    return this.makeRequest<PostAnalytics>(
      `/social/posts/${postId}/analytics`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async previewPost(post: Partial<SocialPost>): Promise<{ previews: Record<SocialPlatform, string> }> {
    return this.makeRequest(
      '/social/publishing/preview',
      {
        method: 'POST',
        body: JSON.stringify(post),
      },
      undefined,
      60000, // 1 minute cache
      true
    );
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getAnalytics(request: AnalyticsRequest): Promise<AnalyticsResponse> {
    return this.makeRequest<AnalyticsResponse>(
      '/social/analytics',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async getEngagementMetrics(accountId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    });

    return this.makeRequest(
      `/social/analytics/${accountId}/engagement?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async getAudienceInsights(accountId: string): Promise<any> {
    return this.makeRequest(
      `/social/analytics/${accountId}/audience`,
      { method: 'GET' },
      undefined,
      3600000 // 1 hour cache
    );
  }

  async getContentPerformance(accountId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    });

    return this.makeRequest(
      `/social/analytics/${accountId}/content?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async getCompetitorAnalysis(competitorIds: string[], dateRange: { start: Date; end: Date }): Promise<any> {
    return this.makeRequest(
      '/social/analytics/competitors',
      {
        method: 'POST',
        body: JSON.stringify({ competitorIds, dateRange }),
      },
      undefined,
      3600000 // 1 hour cache
    );
  }

  // ============================================================================
  // SOCIAL LISTENING & MONITORING
  // ============================================================================

  async getBrandMentions(filters?: {
    keywords?: string[];
    platforms?: SocialPlatform[];
    sentiment?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  }): Promise<BrandMention[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else if (key === 'dateRange' && value) {
            params.set('start', value.start.toISOString());
            params.set('end', value.end.toISOString());
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    return this.makeRequest<BrandMention[]>(
      `/social/monitoring/mentions?${params}`,
      { method: 'GET' },
      undefined,
      60000 // 1 minute cache
    );
  }

  async getTrendingTopics(platforms?: SocialPlatform[], limit: number = 20): Promise<TrendingTopic[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (platforms) {
      platforms.forEach(platform => params.append('platforms', platform));
    }

    return this.makeRequest<TrendingTopic[]>(
      `/social/monitoring/trending?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async getSentimentAnalysis(keywords: string[], dateRange: { start: Date; end: Date }): Promise<any> {
    return this.makeRequest(
      '/social/monitoring/sentiment',
      {
        method: 'POST',
        body: JSON.stringify({ keywords, dateRange }),
      },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async respondToMention(mentionId: string, response: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(
      `/social/monitoring/mentions/${mentionId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({ response }),
      },
      undefined,
      0,
      false
    );
  }

  async markMentionAsRead(mentionId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(
      `/social/monitoring/mentions/${mentionId}/read`,
      { method: 'POST' },
      undefined,
      0,
      false
    );
  }

  // ============================================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================================

  async getCampaigns(filters?: {
    status?: string;
    platforms?: SocialPlatform[];
    dateRange?: { start: Date; end: Date };
  }): Promise<SocialCampaign[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else if (key === 'dateRange' && value) {
            params.set('start', value.start.toISOString());
            params.set('end', value.end.toISOString());
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    return this.makeRequest<SocialCampaign[]>(
      `/social/campaigns?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async createCampaign(campaign: Partial<SocialCampaign>): Promise<SocialCampaign> {
    const response = await this.makeRequest<SocialCampaign>(
      '/social/campaigns',
      {
        method: 'POST',
        body: JSON.stringify(campaign),
      },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/campaigns');
    return response;
  }

  async updateCampaign(campaignId: string, updates: Partial<SocialCampaign>): Promise<SocialCampaign> {
    const response = await this.makeRequest<SocialCampaign>(
      `/social/campaigns/${campaignId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/campaigns');
    return response;
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/social/campaigns/${campaignId}`,
      { method: 'DELETE' },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/campaigns');
    return response;
  }

  async getCampaignAnalytics(campaignId: string): Promise<any> {
    return this.makeRequest(
      `/social/campaigns/${campaignId}/analytics`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // INFLUENCER MANAGEMENT
  // ============================================================================

  async getInfluencers(filters?: {
    platform?: SocialPlatform;
    tier?: string;
    niche?: string[];
    location?: string;
    minFollowers?: number;
    maxFollowers?: number;
  }): Promise<Influencer[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    return this.makeRequest<Influencer[]>(
      `/social/influencers?${params}`,
      { method: 'GET' },
      undefined,
      3600000 // 1 hour cache
    );
  }

  async discoverInfluencers(criteria: {
    keywords: string[];
    platforms: SocialPlatform[];
    minFollowers: number;
    maxFollowers: number;
    location?: string;
    engagement?: number;
  }): Promise<Influencer[]> {
    return this.makeRequest<Influencer[]>(
      '/social/influencers/discover',
      {
        method: 'POST',
        body: JSON.stringify(criteria),
      },
      undefined,
      3600000 // 1 hour cache
    );
  }

  async getInfluencerProfile(influencerId: string): Promise<Influencer> {
    return this.makeRequest<Influencer>(
      `/social/influencers/${influencerId}`,
      { method: 'GET' },
      undefined,
      3600000 // 1 hour cache
    );
  }

  async trackInfluencer(influencerId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(
      `/social/influencers/${influencerId}/track`,
      { method: 'POST' },
      undefined,
      0,
      false
    );
  }

  // ============================================================================
  // AUTOMATION & WORKFLOWS
  // ============================================================================

  async getAutomationWorkflows(): Promise<AutomationWorkflow[]> {
    return this.makeRequest<AutomationWorkflow[]>(
      '/social/automation/workflows',
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async createWorkflow(workflow: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    const response = await this.makeRequest<AutomationWorkflow>(
      '/social/automation/workflows',
      {
        method: 'POST',
        body: JSON.stringify(workflow),
      },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/automation');
    return response;
  }

  async updateWorkflow(workflowId: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    const response = await this.makeRequest<AutomationWorkflow>(
      `/social/automation/workflows/${workflowId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      undefined,
      0,
      false
    );

    this.clearCacheByPattern('/social/automation');
    return response;
  }

  async executeWorkflow(workflowId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(
      `/social/automation/workflows/${workflowId}/execute`,
      { method: 'POST' },
      undefined,
      0,
      false
    );
  }

  async getWorkflowAnalytics(workflowId: string): Promise<any> {
    return this.makeRequest(
      `/social/automation/workflows/${workflowId}/analytics`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // CONTENT MANAGEMENT
  // ============================================================================

  async uploadMedia(file: File, metadata?: any): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.makeRequest<{ url: string; id: string }>(
      '/social/media/upload',
      {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      },
      undefined,
      0,
      false
    );
  }

  async getMediaLibrary(filters?: { type?: string; tags?: string[] }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    return this.makeRequest(
      `/social/media?${params}`,
      { method: 'GET' },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async generateHashtags(content: string, platform: SocialPlatform): Promise<string[]> {
    return this.makeRequest<string[]>(
      '/social/content/hashtags',
      {
        method: 'POST',
        body: JSON.stringify({ content, platform }),
      },
      undefined,
      300000 // 5 minutes cache
    );
  }

  async optimizeContent(content: string, platform: SocialPlatform): Promise<{ optimized: string; suggestions: string[] }> {
    return this.makeRequest(
      '/social/content/optimize',
      {
        method: 'POST',
        body: JSON.stringify({ content, platform }),
      },
      undefined,
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getOptimalPostingTimes(accountId: string): Promise<Record<string, number[]>> {
    return this.makeRequest(
      `/social/analytics/${accountId}/optimal-times`,
      { method: 'GET' },
      undefined,
      3600000 // 1 hour cache
    );
  }

  async validatePost(post: Partial<SocialPost>): Promise<{ valid: boolean; errors: string[] }> {
    return this.makeRequest(
      '/social/publishing/validate',
      {
        method: 'POST',
        body: JSON.stringify(post),
      },
      undefined,
      60000 // 1 minute cache
    );
  }

  // Clear all caches
  clearAllCaches(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Get rate limit status
  getRateLimitStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    this.rateLimits.forEach((value, key) => {
      status[key] = {
        remaining: value.remaining,
        resetAt: value.resetAt,
        isLimited: value.remaining <= 0 && new Date() < value.resetAt,
      };
    });
    return status;
  }
}

// Export singleton instance
export const socialApi = new SocialApiService();
export default socialApi; 