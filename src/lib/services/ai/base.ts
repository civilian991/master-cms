import { z } from 'zod';

// AI Provider types
export type AIProvider = 'openai' | 'gemini';

// AI Model types
export type AIModel = 
  | 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  | 'gemini-pro' | 'gemini-pro-vision';

// Content types
export type ContentType = 
  | 'article' | 'summary' | 'social' | 'video_script' 
  | 'newsletter' | 'press_release' | 'blog_post';

// AI Personality configuration
export interface AIPersonality {
  name: string;
  description: string;
  tone: 'professional' | 'casual' | 'technical' | 'conversational' | 'authoritative';
  expertise: string[];
  writingStyle: string;
  targetAudience: string;
  culturalContext?: string;
  language: 'en' | 'ar' | 'bilingual';
}

// Content generation request
export interface ContentGenerationRequest {
  contentType: ContentType;
  topic: string;
  keywords?: string[];
  targetLength?: number;
  language?: 'en' | 'ar' | 'bilingual';
  personality?: AIPersonality;
  template?: string;
  context?: string;
  requirements?: string[];
}

// Content generation response
export interface ContentGenerationResponse {
  content: string;
  title?: string;
  summary?: string;
  keywords?: string[];
  metadata?: Record<string, any>;
  quality?: {
    score: number;
    readability: number;
    seo: number;
    accuracy: number;
  };
  usage?: {
    tokens: number;
    cost: number;
    model: string;
  };
}

// AI Service configuration
export interface AIServiceConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  temperature?: number;
  maxTokens?: number;
}

// Circuit breaker state
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  expectedResponseTime: number;
  monitoringWindow: number;
}

// AI Service metrics
export interface AIServiceMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  totalCost: number;
  lastRequestTime?: Date;
  circuitBreakerState: CircuitBreakerState;
}

// Validation schemas
export const aiPersonalitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']),
  expertise: z.array(z.string()),
  writingStyle: z.string(),
  targetAudience: z.string(),
  culturalContext: z.string().optional(),
  language: z.enum(['en', 'ar', 'bilingual']),
});

export const contentGenerationRequestSchema = z.object({
  contentType: z.enum(['article', 'summary', 'social', 'video_script', 'newsletter', 'press_release', 'blog_post']),
  topic: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  targetLength: z.number().positive().optional(),
  language: z.enum(['en', 'ar', 'bilingual']).optional(),
  personality: aiPersonalitySchema.optional(),
  template: z.string().optional(),
  context: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

export const aiServiceConfigSchema = z.object({
  provider: z.enum(['openai', 'gemini']),
  model: z.string(),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().nonnegative().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

// Base AI Service interface
export interface IAIService {
  generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse>;
  generateBatch(requests: ContentGenerationRequest[]): Promise<ContentGenerationResponse[]>;
  getMetrics(): AIServiceMetrics;
  isHealthy(): boolean;
  resetCircuitBreaker(): void;
}

// Abstract base class for AI services
export abstract class BaseAIService implements IAIService {
  protected config: AIServiceConfig;
  protected circuitBreaker: CircuitBreaker;
  protected metrics: AIServiceMetrics;
  protected cache: Map<string, ContentGenerationResponse>;

  constructor(config: AIServiceConfig, circuitBreakerConfig?: Partial<CircuitBreakerConfig>) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig);
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      averageResponseTime: 0,
      totalCost: 0,
      circuitBreakerState: 'CLOSED',
    };
    this.cache = new Map();
  }

  abstract generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse>;
  abstract generateBatch(requests: ContentGenerationRequest[]): Promise<ContentGenerationResponse[]>;

  getMetrics(): AIServiceMetrics {
    return {
      ...this.metrics,
      circuitBreakerState: this.circuitBreaker.getState(),
    };
  }

  isHealthy(): boolean {
    return this.circuitBreaker.getState() !== 'OPEN';
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  protected async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T;
    }

    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      const result = await this.circuitBreaker.execute(operation);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      // Cache result if cacheKey provided
      if (cacheKey) {
        this.cache.set(cacheKey, result as any);
      }
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      throw error;
    }
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.failureCount++;
    }

    // Update average response time
    const totalRequests = this.metrics.successCount + this.metrics.failureCount;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    this.metrics.lastRequestTime = new Date();
  }

  protected generateCacheKey(request: ContentGenerationRequest): string {
    const key = JSON.stringify({
      contentType: request.contentType,
      topic: request.topic,
      keywords: request.keywords?.sort(),
      targetLength: request.targetLength,
      language: request.language,
      personality: request.personality?.name,
      template: request.template,
    });
    return Buffer.from(key).toString('base64');
  }

  protected calculateCost(tokens: number, model: string): number {
    // Cost per 1K tokens (approximate)
    const costs: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.002,
      'gemini-pro': 0.001,
    };
    
    const costPerToken = costs[model] || 0.01;
    return (tokens / 1000) * costPerToken;
  }
}

// Circuit Breaker implementation
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  private config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      expectedResponseTime: 30000, // 30 seconds
      monitoringWindow: 60000, // 1 minute
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        this.timeoutPromise(),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timeout'));
      }, this.config.expectedResponseTime);
    });
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = undefined;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
} 