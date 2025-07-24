'use client';

import {
  ScheduledContent,
  CalendarEvent,
  Workflow,
  PublishingQueue,
  TimingOptimization,
  SchedulingAnalytics,
  CreateScheduleRequest,
  CreateScheduleResponse,
  UpdateScheduleRequest,
  BulkScheduleRequest,
  BulkScheduleResponse,
  OptimizationRequest,
  OptimizationResponse,
  CalendarRequest,
  CalendarResponse,
  ScheduleFilter,
  CalendarFilter,
  OptimizationFilter,
  WorkflowTransition,
  PublishingResult,
  ConflictData,
  ScheduleStatus,
  PublishingPlatform,
  CalendarView,
  OptimizationMetric,
} from '../types/scheduling.types';

class SchedulingApiService {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
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
  // HTTP CLIENT WITH RETRY AND DEDUPLICATION
  // ============================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTTL?: number,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, { ...options, body: options.body });

    // Check cache first for GET requests
    if (options.method === 'GET' || !options.method) {
      if (useCache) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) return cached;
      }
    }

    // Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options);
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

  private async executeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
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
        
        if (attempt === maxRetries - 1) break;
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // ============================================================================
  // SCHEDULE MANAGEMENT APIS
  // ============================================================================

  async getScheduledContent(filter?: ScheduleFilter): Promise<ScheduledContent[]> {
    const params = filter ? `?${new URLSearchParams(filter as any)}` : '';
    return await this.makeRequest<ScheduledContent[]>(
      `/scheduling/content${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getScheduledContentById(scheduleId: string): Promise<ScheduledContent> {
    return await this.makeRequest<ScheduledContent>(
      `/scheduling/content/${scheduleId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createSchedule(request: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    const response = await this.makeRequest<CreateScheduleResponse>(
      '/scheduling/content',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );

    // Clear schedule cache after creation
    this.clearCacheByPattern('/scheduling/content');
    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  async updateSchedule(
    scheduleId: string,
    updates: UpdateScheduleRequest
  ): Promise<ScheduledContent> {
    const response = await this.makeRequest<ScheduledContent>(
      `/scheduling/content/${scheduleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/content');
    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  async deleteSchedule(scheduleId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/content/${scheduleId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/content');
    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  async bulkScheduleOperation(request: BulkScheduleRequest): Promise<BulkScheduleResponse> {
    const response = await this.makeRequest<BulkScheduleResponse>(
      '/scheduling/content/bulk',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/content');
    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  // ============================================================================
  // CALENDAR APIS
  // ============================================================================

  async getCalendarEvents(request: CalendarRequest): Promise<CalendarResponse> {
    const params = new URLSearchParams({
      view: request.view,
      startDate: request.dateRange.start.toISOString(),
      endDate: request.dateRange.end.toISOString(),
    });

    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }

    return await this.makeRequest<CalendarResponse>(
      `/scheduling/calendar?${params}`,
      { method: 'GET' },
      180000 // 3 minutes cache
    );
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.makeRequest<CalendarEvent>(
      '/scheduling/calendar/events',
      {
        method: 'POST',
        body: JSON.stringify(event),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  async updateCalendarEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    const response = await this.makeRequest<CalendarEvent>(
      `/scheduling/calendar/events/${eventId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  async deleteCalendarEvent(eventId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/calendar/events/${eventId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/calendar');
    return response;
  }

  async checkConflicts(
    scheduledAt: Date,
    duration?: number,
    platforms?: PublishingPlatform[]
  ): Promise<ConflictData[]> {
    const params = new URLSearchParams({
      scheduledAt: scheduledAt.toISOString(),
    });

    if (duration) params.set('duration', duration.toString());
    if (platforms) platforms.forEach(p => params.append('platform', p));

    return await this.makeRequest<ConflictData[]>(
      `/scheduling/calendar/conflicts?${params}`,
      { method: 'GET' },
      60000 // 1 minute cache
    );
  }

  // ============================================================================
  // WORKFLOW APIS
  // ============================================================================

  async getWorkflows(): Promise<Workflow[]> {
    return await this.makeRequest<Workflow[]>(
      '/scheduling/workflows',
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async getWorkflowById(workflowId: string): Promise<Workflow> {
    return await this.makeRequest<Workflow>(
      `/scheduling/workflows/${workflowId}`,
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const response = await this.makeRequest<Workflow>(
      '/scheduling/workflows',
      {
        method: 'POST',
        body: JSON.stringify(workflow),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/workflows');
    return response;
  }

  async updateWorkflow(
    workflowId: string,
    updates: Partial<Workflow>
  ): Promise<Workflow> {
    const response = await this.makeRequest<Workflow>(
      `/scheduling/workflows/${workflowId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/workflows');
    return response;
  }

  async deleteWorkflow(workflowId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/workflows/${workflowId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/workflows');
    return response;
  }

  async executeWorkflowTransition(
    scheduleId: string,
    transition: WorkflowTransition
  ): Promise<ScheduledContent> {
    const response = await this.makeRequest<ScheduledContent>(
      `/scheduling/content/${scheduleId}/workflow/transition`,
      {
        method: 'POST',
        body: JSON.stringify(transition),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/content');
    return response;
  }

  // ============================================================================
  // PUBLISHING APIS
  // ============================================================================

  async getPublishingQueue(): Promise<PublishingQueue> {
    return await this.makeRequest<PublishingQueue>(
      '/scheduling/publishing/queue',
      { method: 'GET' },
      60000 // 1 minute cache
    );
  }

  async controlPublishingQueue(action: 'start' | 'pause' | 'stop' | 'clear'): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/publishing/queue/${action}`,
      { method: 'POST' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/publishing');
    return response;
  }

  async retryQueueItem(itemId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/publishing/queue/items/${itemId}/retry`,
      { method: 'POST' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/publishing');
    return response;
  }

  async cancelQueueItem(itemId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/publishing/queue/items/${itemId}/cancel`,
      { method: 'POST' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/publishing');
    return response;
  }

  async publishNow(scheduleId: string, platforms?: PublishingPlatform[]): Promise<PublishingResult[]> {
    const body = platforms ? { platforms } : {};
    return await this.makeRequest<PublishingResult[]>(
      `/scheduling/content/${scheduleId}/publish`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      0,
      false
    );
  }

  async getPublishingHistory(
    scheduleId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PublishingResult[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (scheduleId) params.set('scheduleId', scheduleId);

    return await this.makeRequest<PublishingResult[]>(
      `/scheduling/publishing/history?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // OPTIMIZATION APIS
  // ============================================================================

  async getTimingOptimization(request: OptimizationRequest): Promise<OptimizationResponse> {
    return await this.makeRequest<OptimizationResponse>(
      '/scheduling/optimization/timing',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      1800000 // 30 minutes cache
    );
  }

  async getOptimalTimes(
    contentType: string,
    platforms: PublishingPlatform[],
    targetMetric: OptimizationMetric = 'engagement'
  ): Promise<{ platform: PublishingPlatform; optimalTimes: Date[] }[]> {
    const params = new URLSearchParams({
      contentType,
      targetMetric,
    });

    platforms.forEach(p => params.append('platform', p));

    return await this.makeRequest<{ platform: PublishingPlatform; optimalTimes: Date[] }[]>(
      `/scheduling/optimization/optimal-times?${params}`,
      { method: 'GET' },
      3600000 // 1 hour cache
    );
  }

  async getAudienceInsights(
    platforms: PublishingPlatform[],
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    const params = new URLSearchParams();
    platforms.forEach(p => params.append('platform', p));

    if (timeRange) {
      params.set('startDate', timeRange.start.toISOString());
      params.set('endDate', timeRange.end.toISOString());
    }

    return await this.makeRequest(
      `/scheduling/optimization/audience-insights?${params}`,
      { method: 'GET' },
      1800000 // 30 minutes cache
    );
  }

  async generateOptimizedSchedule(
    contentIds: string[],
    timeRange: { start: Date; end: Date },
    platforms: PublishingPlatform[],
    targetMetric: OptimizationMetric = 'engagement'
  ): Promise<{ contentId: string; suggestedTimes: Date[] }[]> {
    return await this.makeRequest(
      '/scheduling/optimization/generate-schedule',
      {
        method: 'POST',
        body: JSON.stringify({
          contentIds,
          timeRange,
          platforms,
          targetMetric,
        }),
      },
      0,
      false
    );
  }

  // ============================================================================
  // ANALYTICS APIS
  // ============================================================================

  async getSchedulingAnalytics(
    dateRange: { start: Date; end: Date },
    filters?: any
  ): Promise<SchedulingAnalytics> {
    const params = new URLSearchParams({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    });

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

    return await this.makeRequest<SchedulingAnalytics>(
      `/scheduling/analytics?${params}`,
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async getContentPerformance(
    scheduleId: string,
    platforms?: PublishingPlatform[]
  ): Promise<any> {
    const params = new URLSearchParams();
    if (platforms) platforms.forEach(p => params.append('platform', p));

    return await this.makeRequest(
      `/scheduling/content/${scheduleId}/performance?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getPlatformAnalytics(
    platform: PublishingPlatform,
    dateRange: { start: Date; end: Date }
  ): Promise<any> {
    const params = new URLSearchParams({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    });

    return await this.makeRequest(
      `/scheduling/analytics/platforms/${platform}?${params}`,
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async exportSchedulingReport(
    dateRange: { start: Date; end: Date },
    format: 'csv' | 'pdf' | 'excel' = 'csv',
    filters?: any
  ): Promise<{ downloadUrl: string }> {
    const params = new URLSearchParams({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      format,
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, value.toString());
        }
      });
    }

    return await this.makeRequest(
      `/scheduling/analytics/export?${params}`,
      { method: 'POST' },
      0,
      false
    );
  }

  // ============================================================================
  // SOCIAL MEDIA APIS
  // ============================================================================

  async getSocialMediaAccounts(): Promise<any[]> {
    return await this.makeRequest(
      '/scheduling/social/accounts',
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async connectSocialAccount(
    platform: PublishingPlatform,
    credentials: any
  ): Promise<{ success: boolean; accountId: string }> {
    const response = await this.makeRequest<{ success: boolean; accountId: string }>(
      `/scheduling/social/accounts/${platform}/connect`,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/social');
    return response;
  }

  async disconnectSocialAccount(
    platform: PublishingPlatform,
    accountId: string
  ): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/scheduling/social/accounts/${platform}/${accountId}/disconnect`,
      { method: 'POST' },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/social');
    return response;
  }

  async getSocialMediaTemplates(platform: PublishingPlatform): Promise<any[]> {
    return await this.makeRequest(
      `/scheduling/social/templates/${platform}`,
      { method: 'GET' },
      1800000 // 30 minutes cache
    );
  }

  async createSocialMediaTemplate(
    platform: PublishingPlatform,
    template: any
  ): Promise<any> {
    const response = await this.makeRequest(
      `/scheduling/social/templates/${platform}`,
      {
        method: 'POST',
        body: JSON.stringify(template),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/social/templates');
    return response;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async validateScheduleData(data: CreateScheduleRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return await this.makeRequest(
      '/scheduling/validate',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      0,
      false
    );
  }

  async getSchedulingSettings(): Promise<any> {
    return await this.makeRequest(
      '/scheduling/settings',
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async updateSchedulingSettings(settings: any): Promise<any> {
    const response = await this.makeRequest(
      '/scheduling/settings',
      {
        method: 'PATCH',
        body: JSON.stringify(settings),
      },
      0,
      false
    );

    this.clearCacheByPattern('/scheduling/settings');
    return response;
  }

  async getSchedulingQuota(userId: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetDate: Date;
  }> {
    return await this.makeRequest(
      `/scheduling/quota/${userId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
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
}

// Export singleton instance
export const schedulingApi = new SchedulingApiService();
export default schedulingApi; 