'use client';

import {
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchFilter,
  SearchFacet,
  SearchSuggestion,
  SearchRecommendation,
  AutoCompleteRequest,
  AutoCompleteResponse,
  VoiceSearchResult,
  VisualSearchResult,
  SearchAnalytics,
  SearchProvider,
  SearchScope,
  SearchMode,
  RecommendationType,
  VoiceSearchLanguage,
  ImageSearchMode,
  SearchIntent,
  UserPreferences,
  SearchContext,
} from '../types/search.types';

class SearchApiService {
  private baseUrl: string;
  private provider: SearchProvider;
  private apiKey?: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private config: SearchApiConfig;

  constructor(config?: Partial<SearchApiConfig>) {
    this.config = {
      provider: 'custom',
      baseUrl: process.env.NEXT_PUBLIC_SEARCH_API_URL || '/api/search',
      apiKey: process.env.NEXT_PUBLIC_SEARCH_API_KEY,
      timeout: 30000,
      retries: 3,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      enableAnalytics: true,
      enablePersonalization: true,
      enableSemanticSearch: true,
      enableRealTimeUpdates: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config,
    };

    this.baseUrl = this.config.baseUrl;
    this.provider = this.config.provider;
    this.apiKey = this.config.apiKey;
  }

  // ============================================================================
  // CORE SEARCH METHODS
  // ============================================================================

  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('search', query);

    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache<SearchResponse>(cacheKey);
        if (cached) {
          return this.enrichResponse(cached, startTime, true);
        }
      }

      // Deduplicate requests
      if (this.pendingRequests.has(cacheKey)) {
        return await this.pendingRequests.get(cacheKey);
      }

      // Create the request promise
      const requestPromise = this.executeSearch(query);
      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const response = await requestPromise;
        const enrichedResponse = this.enrichResponse(response, startTime, false);

        // Cache successful responses
        if (this.config.cacheEnabled && response.metadata.hasResults) {
          this.setCache(cacheKey, enrichedResponse, this.config.cacheTTL);
        }

        // Track analytics
        if (this.config.enableAnalytics) {
          this.trackSearchEvent(query, enrichedResponse);
        }

        return enrichedResponse;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    } catch (error) {
      console.error('Search failed:', error);
      throw this.handleError(error);
    }
  }

  private async executeSearch(query: SearchQuery): Promise<SearchResponse> {
    // Preprocess query for semantic understanding
    const processedQuery = await this.preprocessQuery(query);

    // Build search request based on provider
    const request = this.buildSearchRequest(processedQuery);

    // Execute search with retry logic
    const response = await this.makeRequest<SearchResponse>('POST', '/search', request);

    // Post-process results
    return this.postprocessResults(response, processedQuery);
  }

  private async preprocessQuery(query: SearchQuery): Promise<SearchQuery> {
    let processed = { ...query };

    // Query cleaning and normalization
    processed.query = this.normalizeQuery(query.query);

    // Intent detection
    if (this.config.enableSemanticSearch) {
      processed.intent = await this.detectIntent(processed.query);
    }

    // Query expansion
    if (processed.mode === 'semantic') {
      processed = await this.expandQuery(processed);
    }

    // Auto-correction
    const corrected = await this.autoCorrectQuery(processed.query);
    if (corrected !== processed.query) {
      processed.query = corrected;
    }

    return processed;
  }

  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-_.]/g, '')
      .toLowerCase();
  }

  private async detectIntent(query: string): Promise<SearchIntent> {
    // Simple intent detection based on keywords
    const informationalKeywords = ['what', 'how', 'why', 'when', 'where', 'explain', 'define'];
    const navigationalKeywords = ['login', 'home', 'contact', 'about', 'dashboard'];
    const transactionalKeywords = ['buy', 'purchase', 'order', 'checkout', 'download'];
    const commercialKeywords = ['price', 'cost', 'cheap', 'best', 'compare', 'review'];

    const lowerQuery = query.toLowerCase();

    if (informationalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'informational';
    }
    if (navigationalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'navigational';
    }
    if (transactionalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'transactional';
    }
    if (commercialKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'commercial';
    }

    return 'unknown';
  }

  private async expandQuery(query: SearchQuery): Promise<SearchQuery> {
    try {
      const response = await this.makeRequest<{ expandedQuery: string; synonyms: string[] }>(
        'POST',
        '/ai/expand-query',
        { query: query.query, context: query.context }
      );

      return {
        ...query,
        query: response.expandedQuery,
        metadata: {
          ...query.metadata,
          originalQuery: query.query,
          synonyms: response.synonyms,
        },
      };
    } catch (error) {
      console.warn('Query expansion failed:', error);
      return query;
    }
  }

  private async autoCorrectQuery(query: string): Promise<string> {
    try {
      const response = await this.makeRequest<{ correctedQuery: string; confidence: number }>(
        'POST',
        '/ai/correct-query',
        { query }
      );

      // Only use correction if confidence is high
      if (response.confidence > 0.8) {
        return response.correctedQuery;
      }
    } catch (error) {
      console.warn('Auto-correction failed:', error);
    }

    return query;
  }

  private buildSearchRequest(query: SearchQuery): any {
    const request: any = {
      query: query.query,
      scope: query.scope || ['all'],
      mode: query.mode || 'instant',
      filters: this.buildFilters(query.filters || []),
      facets: query.facets || [],
      sort: query.sort || [{ field: 'relevance', order: 'desc' }],
      pagination: query.pagination || { page: 1, size: 20 },
      highlight: query.highlight || { enabled: true },
      suggestions: query.suggestions !== false,
      analytics: query.analytics !== false,
      personalization: query.personalization !== false,
    };

    // Add provider-specific parameters
    switch (this.provider) {
      case 'elasticsearch':
        return this.buildElasticsearchRequest(request);
      case 'algolia':
        return this.buildAlgoliaRequest(request);
      case 'typesense':
        return this.buildTypesenseRequest(request);
      case 'meilisearch':
        return this.buildMeilisearchRequest(request);
      default:
        return request;
    }
  }

  private buildElasticsearchRequest(request: any): any {
    return {
      index: 'search_index',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: request.query,
                  fields: ['title^3', 'description^2', 'content', 'tags'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: this.buildElasticsearchFilters(request.filters),
          },
        },
        aggs: this.buildElasticsearchAggregations(request.facets),
        highlight: request.highlight.enabled ? {
          fields: {
            title: {},
            description: {},
            content: { fragment_size: 150, number_of_fragments: 3 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        } : undefined,
        sort: this.buildElasticsearchSort(request.sort),
        from: (request.pagination.page - 1) * request.pagination.size,
        size: request.pagination.size,
      },
    };
  }

  private buildAlgoliaRequest(request: any): any {
    return {
      params: {
        query: request.query,
        attributesToRetrieve: ['title', 'description', 'url', 'image', 'tags', 'categories'],
        attributesToHighlight: ['title', 'description'],
        attributesToSnippet: ['content:150'],
        filters: this.buildAlgoliaFilters(request.filters),
        facets: request.facets.join(','),
        page: request.pagination.page - 1,
        hitsPerPage: request.pagination.size,
        typoTolerance: true,
        ignorePlurals: true,
        removeStopWords: true,
      },
    };
  }

  private buildTypesenseRequest(request: any): any {
    return {
      q: request.query,
      query_by: 'title,description,content,tags',
      filter_by: this.buildTypesenseFilters(request.filters),
      facet_by: request.facets.join(','),
      sort_by: this.buildTypesenseSort(request.sort),
      page: request.pagination.page,
      per_page: request.pagination.size,
      highlight_full_fields: 'title,description',
      snippet_threshold: 30,
      num_typos: 2,
      prefix: true,
    };
  }

  private buildMeilisearchRequest(request: any): any {
    return {
      q: request.query,
      attributesToRetrieve: ['title', 'description', 'url', 'image', 'tags', 'categories'],
      attributesToHighlight: ['title', 'description'],
      attributesToCrop: ['content'],
      filter: this.buildMeilisearchFilters(request.filters),
      facetsDistribution: request.facets,
      sort: this.buildMeilisearchSort(request.sort),
      offset: (request.pagination.page - 1) * request.pagination.size,
      limit: request.pagination.size,
    };
  }

  private buildFilters(filters: SearchFilter[]): SearchFilter[] {
    return filters.map(filter => ({
      ...filter,
      value: this.normalizeFilterValue(filter.value, filter.type),
    }));
  }

  private normalizeFilterValue(value: any, type: string): any {
    switch (type) {
      case 'date':
        return new Date(value);
      case 'range':
        return Array.isArray(value) ? value : [value, value];
      case 'multiselect':
        return Array.isArray(value) ? value : [value];
      default:
        return value;
    }
  }

  private buildElasticsearchFilters(filters: SearchFilter[]): any[] {
    return filters.map(filter => {
      switch (filter.operator) {
        case 'eq':
          return { term: { [filter.field]: filter.value } };
        case 'in':
          return { terms: { [filter.field]: filter.value } };
        case 'range':
          return { range: { [filter.field]: { gte: filter.value[0], lte: filter.value[1] } } };
        case 'exists':
          return { exists: { field: filter.field } };
        default:
          return { term: { [filter.field]: filter.value } };
      }
    });
  }

  private buildElasticsearchAggregations(facets: string[]): any {
    const aggs: any = {};
    facets.forEach(facet => {
      aggs[facet] = {
        terms: {
          field: `${facet}.keyword`,
          size: 100,
        },
      };
    });
    return aggs;
  }

  private buildElasticsearchSort(sort: any[]): any[] {
    return sort.map(s => {
      if (s.field === 'relevance') {
        return { _score: { order: s.order } };
      }
      return { [s.field]: { order: s.order } };
    });
  }

  private buildAlgoliaFilters(filters: SearchFilter[]): string {
    return filters
      .map(filter => {
        switch (filter.operator) {
          case 'eq':
            return `${filter.field}:${filter.value}`;
          case 'in':
            return filter.value.map((v: any) => `${filter.field}:${v}`).join(' OR ');
          case 'range':
            return `${filter.field}:${filter.value[0]} TO ${filter.value[1]}`;
          default:
            return `${filter.field}:${filter.value}`;
        }
      })
      .join(' AND ');
  }

  private buildTypesenseFilters(filters: SearchFilter[]): string {
    return filters
      .map(filter => {
        switch (filter.operator) {
          case 'eq':
            return `${filter.field}:=${filter.value}`;
          case 'in':
            return `${filter.field}:[${filter.value.join(',')}]`;
          case 'range':
            return `${filter.field}:[${filter.value[0]}..${filter.value[1]}]`;
          default:
            return `${filter.field}:=${filter.value}`;
        }
      })
      .join(' && ');
  }

  private buildMeilisearchFilters(filters: SearchFilter[]): string {
    return filters
      .map(filter => {
        switch (filter.operator) {
          case 'eq':
            return `${filter.field} = ${filter.value}`;
          case 'in':
            return `${filter.field} IN [${filter.value.map((v: any) => `"${v}"`).join(',')}]`;
          case 'range':
            return `${filter.field} ${filter.value[0]} TO ${filter.value[1]}`;
          default:
            return `${filter.field} = ${filter.value}`;
        }
      })
      .join(' AND ');
  }

  private buildTypesenseSort(sort: any[]): string {
    return sort
      .map(s => `${s.field}:${s.order}`)
      .join(',');
  }

  private buildMeilisearchSort(sort: any[]): string[] {
    return sort.map(s => `${s.field}:${s.order}`);
  }

  private async postprocessResults(response: SearchResponse, query: SearchQuery): Promise<SearchResponse> {
    // Enhance results with additional data
    const enhancedResults = await this.enhanceResults(response.results, query);

    // Generate recommendations
    const recommendations = this.config.enablePersonalization
      ? await this.generateRecommendations(query, enhancedResults)
      : [];

    // Build facets from aggregations
    const facets = this.buildFacetsFromResponse(response, query);

    // Generate suggestions
    const suggestions = await this.generateSuggestions(query);

    return {
      ...response,
      results: enhancedResults,
      facets,
      suggestions,
      recommendations,
    };
  }

  private async enhanceResults(results: SearchResult[], query: SearchQuery): Promise<SearchResult[]> {
    return Promise.all(
      results.map(async (result) => {
        // Add relevance score
        const relevance = this.calculateRelevance(result, query);

        // Add preview/snippet
        const preview = this.generatePreview(result, query.query);

        // Add actions
        const actions = this.generateResultActions(result);

        return {
          ...result,
          relevance,
          preview,
          actions,
        };
      })
    );
  }

  private calculateRelevance(result: SearchResult, query: SearchQuery): number {
    let relevance = result.score || 0;

    // Boost based on field matches
    const queryTerms = query.query.toLowerCase().split(' ');
    const titleMatch = queryTerms.some(term => result.title.toLowerCase().includes(term));
    const descriptionMatch = queryTerms.some(term => result.description.toLowerCase().includes(term));

    if (titleMatch) relevance *= 1.5;
    if (descriptionMatch) relevance *= 1.2;

    // Boost recent content
    if (result.publishedAt) {
      const daysSincePublished = (Date.now() - new Date(result.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 30) {
        relevance *= 1.1;
      }
    }

    return Math.min(relevance, 100);
  }

  private generatePreview(result: SearchResult, query: string): string {
    const maxLength = 150;
    const content = result.content || result.description;
    
    if (!content) return '';

    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    // Find the best snippet containing query terms
    let bestIndex = 0;
    let bestScore = 0;

    for (let i = 0; i < content.length - maxLength; i += 50) {
      const snippet = content.substring(i, i + maxLength);
      const snippetLower = snippet.toLowerCase();
      
      const score = queryTerms.reduce((acc, term) => {
        return acc + (snippetLower.includes(term) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    let preview = content.substring(bestIndex, bestIndex + maxLength);
    
    // Trim to word boundaries
    const lastSpace = preview.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      preview = preview.substring(0, lastSpace);
    }

    return bestIndex > 0 ? `...${preview}...` : `${preview}...`;
  }

  private generateResultActions(result: SearchResult): any[] {
    const actions = [
      {
        type: 'view',
        label: 'View',
        url: result.url,
        icon: 'eye',
        primary: true,
      },
    ];

    // Add type-specific actions
    if (result.type === 'articles') {
      actions.push({
        type: 'share',
        label: 'Share',
        icon: 'share',
      });
    }

    if (result.type === 'media') {
      actions.push({
        type: 'download',
        label: 'Download',
        icon: 'download',
      });
    }

    return actions;
  }

  private async generateRecommendations(
    query: SearchQuery,
    results: SearchResult[]
  ): Promise<SearchRecommendation[]> {
    try {
      const response = await this.makeRequest<{ recommendations: SearchRecommendation[] }>(
        'POST',
        '/ai/recommendations',
        {
          query: query.query,
          results: results.slice(0, 5), // Top 5 results for context
          context: query.context,
          intent: query.intent,
        }
      );

      return response.recommendations;
    } catch (error) {
      console.warn('Recommendation generation failed:', error);
      return [];
    }
  }

  private buildFacetsFromResponse(response: any, query: SearchQuery): SearchFacet[] {
    // This would depend on the search provider's response format
    const facets: SearchFacet[] = [];
    
    // Example for Elasticsearch aggregations
    if (response.aggregations) {
      Object.entries(response.aggregations).forEach(([field, agg]: [string, any]) => {
        facets.push({
          field,
          label: this.humanizeFieldName(field),
          type: 'list',
          values: agg.buckets.map((bucket: any) => ({
            value: bucket.key,
            label: bucket.key,
            count: bucket.doc_count,
            selected: false,
          })),
          multiSelect: true,
          searchable: false,
          collapsed: false,
          order: 0,
        });
      });
    }

    return facets;
  }

  private humanizeFieldName(field: string): string {
    return field
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private async generateSuggestions(query: SearchQuery): Promise<SearchSuggestion[]> {
    try {
      const response = await this.makeRequest<{ suggestions: SearchSuggestion[] }>(
        'POST',
        '/ai/suggestions',
        {
          query: query.query,
          scope: query.scope,
          context: query.context,
        }
      );

      return response.suggestions;
    } catch (error) {
      console.warn('Suggestion generation failed:', error);
      return [];
    }
  }

  // ============================================================================
  // AUTO-COMPLETE METHODS
  // ============================================================================

  async autoComplete(request: AutoCompleteRequest): Promise<AutoCompleteResponse> {
    const cacheKey = this.generateCacheKey('autocomplete', request);

    try {
      // Check cache
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache<AutoCompleteResponse>(cacheKey);
        if (cached) return cached;
      }

      const response = await this.makeRequest<AutoCompleteResponse>(
        'POST',
        '/autocomplete',
        {
          ...request,
          provider: this.provider,
        }
      );

      // Cache successful responses
      if (this.config.cacheEnabled && response.suggestions.length > 0) {
        this.setCache(cacheKey, response, 60000); // 1 minute cache for autocomplete
      }

      return response;
    } catch (error) {
      console.error('Autocomplete failed:', error);
      throw this.handleError(error);
    }
  }

  async getTrendingSuggestions(options: {
    limit?: number;
    category?: string;
    timeframe?: string;
  } = {}): Promise<any[]> {
    try {
      const response = await this.makeRequest<{ suggestions: any[] }>(
        'GET',
        '/suggestions/trending',
        options
      );

      return response.suggestions;
    } catch (error) {
      console.warn('Trending suggestions failed:', error);
      return [];
    }
  }

  async getPopularSuggestions(options: {
    limit?: number;
    category?: string;
  } = {}): Promise<any[]> {
    try {
      const response = await this.makeRequest<{ suggestions: any[] }>(
        'GET',
        '/suggestions/popular',
        options
      );

      return response.suggestions;
    } catch (error) {
      console.warn('Popular suggestions failed:', error);
      return [];
    }
  }

  // ============================================================================
  // VOICE SEARCH METHODS
  // ============================================================================

  async processVoiceSearch(
    audioData: string | Blob,
    language: VoiceSearchLanguage = 'en-US'
  ): Promise<VoiceSearchResult> {
    try {
      const formData = new FormData();
      
      if (typeof audioData === 'string') {
        formData.append('audio', audioData);
      } else {
        formData.append('audio', audioData, 'voice-search.wav');
      }
      
      formData.append('language', language);

      const response = await fetch(`${this.baseUrl}/voice/transcribe`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Voice search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Voice search failed:', error);
      throw this.handleError(error);
    }
  }

  async processVoiceCommand(transcript: string): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        'POST',
        '/voice/command',
        { transcript }
      );

      return response;
    } catch (error) {
      console.warn('Voice command processing failed:', error);
      return null;
    }
  }

  // ============================================================================
  // VISUAL SEARCH METHODS
  // ============================================================================

  async processVisualSearch(
    imageData: string | File,
    modes: ImageSearchMode[] = ['similarity']
  ): Promise<VisualSearchResult> {
    try {
      const formData = new FormData();
      
      if (typeof imageData === 'string') {
        formData.append('image', imageData);
      } else {
        formData.append('image', imageData);
      }
      
      formData.append('modes', JSON.stringify(modes));

      const response = await fetch(`${this.baseUrl}/visual/analyze`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Visual search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Visual search failed:', error);
      throw this.handleError(error);
    }
  }

  async findSimilarImages(imageData: string | File, limit: number = 10): Promise<any[]> {
    try {
      const result = await this.processVisualSearch(imageData, ['similarity']);
      return result.similarImages.slice(0, limit);
    } catch (error) {
      console.warn('Similar image search failed:', error);
      return [];
    }
  }

  async extractImageText(imageData: string | File): Promise<string[]> {
    try {
      const result = await this.processVisualSearch(imageData, ['text_recognition']);
      return result.text.map(t => t.text);
    } catch (error) {
      console.warn('Image text extraction failed:', error);
      return [];
    }
  }

  // ============================================================================
  // RECOMMENDATION METHODS
  // ============================================================================

  async getRecommendations(options: {
    type: RecommendationType;
    userId?: string;
    itemId?: string;
    query?: string;
    limit?: number;
    context?: SearchContext;
  }): Promise<SearchRecommendation[]> {
    try {
      const response = await this.makeRequest<{ recommendations: SearchRecommendation[] }>(
        'POST',
        '/recommendations',
        options
      );

      return response.recommendations;
    } catch (error) {
      console.warn('Recommendations failed:', error);
      return [];
    }
  }

  async getSimilarContent(itemId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const recommendations = await this.getRecommendations({
        type: 'similar',
        itemId,
        limit,
      });

      return recommendations.flatMap(rec => rec.items);
    } catch (error) {
      console.warn('Similar content search failed:', error);
      return [];
    }
  }

  async getPersonalizedRecommendations(
    userId: string,
    preferences: UserPreferences,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      const recommendations = await this.getRecommendations({
        type: 'personalized',
        userId,
        limit,
        context: { userId, preferences },
      });

      return recommendations.flatMap(rec => rec.items);
    } catch (error) {
      console.warn('Personalized recommendations failed:', error);
      return [];
    }
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  async trackSearchEvent(query: SearchQuery, response: SearchResponse): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      const analytics: SearchAnalytics = {
        queryId: this.generateId(),
        userId: query.context?.userId,
        sessionId: query.context?.sessionId || this.generateId(),
        timestamp: new Date(),
        query: query.query,
        resultsCount: response.metadata.totalResults,
        clickedResults: [],
        filters: query.filters || [],
        intent: query.intent || 'unknown',
        userSegment: this.determineUserSegment(query.context),
      };

      await this.makeRequest('POST', '/analytics/track', analytics);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  async trackResultClick(resultId: string, position: number, query: string): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      await this.makeRequest('POST', '/analytics/click', {
        resultId,
        position,
        query,
        timestamp: new Date(),
      });
    } catch (error) {
      console.warn('Click tracking failed:', error);
    }
  }

  async trackConversion(resultId: string, value?: number): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      await this.makeRequest('POST', '/analytics/conversion', {
        resultId,
        value,
        timestamp: new Date(),
      });
    } catch (error) {
      console.warn('Conversion tracking failed:', error);
    }
  }

  private determineUserSegment(context?: SearchContext): any {
    if (!context) return 'guest';
    
    if (context.userId) {
      return 'returning';
    }
    
    if (context.device?.type === 'mobile') {
      return 'mobile';
    }
    
    return 'new';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    retryCount = 0
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = this.getHeaders();

      const config: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(this.config.timeout),
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.config.retries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(method, endpoint, data, retryCount + 1);
      }
      throw error;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private enrichResponse(
    response: SearchResponse,
    startTime: number,
    cached: boolean
  ): SearchResponse {
    const totalTime = performance.now() - startTime;

    return {
      ...response,
      timing: {
        query: 0,
        processing: cached ? 0 : totalTime * 0.8,
        indexing: 0,
        filtering: 0,
        faceting: 0,
        sorting: 0,
        highlighting: 0,
        total: totalTime,
      },
      analytics: {
        ...response.analytics,
        timestamp: new Date(),
      },
    };
  }

  private generateCacheKey(operation: string, data: any): string {
    const normalized = JSON.stringify(data, Object.keys(data).sort());
    return `${operation}:${this.simpleHash(normalized)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('An unknown search error occurred');
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async clearCache(): Promise<void> {
    this.cache.clear();
    console.log('Search cache cleared');
  }

  async getHealth(): Promise<any> {
    try {
      return await this.makeRequest('GET', '/health');
    } catch (error) {
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getConfig(): SearchApiConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SearchApiConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

interface SearchApiConfig {
  provider: SearchProvider;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  enableAnalytics: boolean;
  enablePersonalization: boolean;
  enableSemanticSearch: boolean;
  enableRealTimeUpdates: boolean;
  debugMode: boolean;
}

// Export singleton instance
export const searchApi = new SearchApiService();
export default searchApi; 
export default searchApi; 