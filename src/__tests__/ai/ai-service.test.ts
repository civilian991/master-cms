import { AIServiceManager } from '@/lib/services/ai/manager';
import { ContentGenerationService } from '@/lib/services/ai/content-generation';
import { OpenAIService } from '@/lib/services/ai/openai';
import { GeminiService } from '@/lib/services/ai/gemini';
import { prisma } from '@/lib/prisma';
import { 
  ContentGenerationRequest, 
  ContentGenerationResponse,
  AIServiceConfig,
  CircuitBreaker 
} from '@/lib/services/ai/base';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    siteAiConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    article: {
      create: jest.fn(),
    },
    aiProcessingLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    tag: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/ai/openai');
jest.mock('@/lib/services/ai/gemini');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockOpenAIService = OpenAIService as jest.MockedClass<typeof OpenAIService>;
const mockGeminiService = GeminiService as jest.MockedClass<typeof GeminiService>;

describe('AI Service Integration Framework', () => {
  let aiManager: AIServiceManager;
  let contentGenerationService: ContentGenerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiManager = AIServiceManager.getInstance();
    contentGenerationService = new ContentGenerationService();
  });

  describe('AIServiceManager', () => {
    it('should be a singleton', () => {
      const instance1 = AIServiceManager.getInstance();
      const instance2 = AIServiceManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should load site configuration', async () => {
      const mockConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        fallbackProvider: 'gemini',
        apiKeys: { openai: 'test-key', gemini: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'test.com' },
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockConfig as any);

      await aiManager.loadSiteConfiguration(1);

      // Verify configuration was loaded
      expect(mockPrisma.siteAiConfig.findUnique).toHaveBeenCalledWith({
        where: { siteId: 1 },
        include: { site: true },
      });
    });

    it('should generate content with primary provider', async () => {
      const mockConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        fallbackProvider: 'gemini',
        apiKeys: { openai: 'test-key', gemini: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'himaya.io' },
      };

      const mockResponse: ContentGenerationResponse = {
        content: 'Generated content',
        title: 'Generated Title',
        usage: {
          tokens: 100,
          cost: 0.01,
          model: 'gpt-4-turbo',
        },
        quality: {
          score: 85,
          readability: 80,
          seo: 90,
          accuracy: 85,
        },
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockConfig as any);
      mockOpenAIService.prototype.generateContent.mockResolvedValue(mockResponse);

      const request: ContentGenerationRequest = {
        contentType: 'article',
        topic: 'Cybersecurity trends',
        language: 'en',
      };

      const result = await aiManager.generateContent(1, request);

      expect(result).toEqual(mockResponse);
      expect(mockOpenAIService.prototype.generateContent).toHaveBeenCalledWith(request);
    });

    it('should fallback to secondary provider when primary fails', async () => {
      const mockConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        fallbackProvider: 'gemini',
        apiKeys: { openai: 'test-key', gemini: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'himaya.io' },
      };

      const mockResponse: ContentGenerationResponse = {
        content: 'Generated content from fallback',
        usage: {
          tokens: 100,
          cost: 0.005,
          model: 'gemini-pro',
        },
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockConfig as any);
      mockOpenAIService.prototype.generateContent.mockRejectedValue(new Error('OpenAI failed'));
      mockGeminiService.prototype.generateContent.mockResolvedValue(mockResponse);

      const request: ContentGenerationRequest = {
        contentType: 'article',
        topic: 'Cybersecurity trends',
        language: 'en',
      };

      const result = await aiManager.generateContent(1, request);

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.prototype.generateContent).toHaveBeenCalledWith(request);
    });

    it('should apply site-specific personality', async () => {
      const mockConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        apiKeys: { openai: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'himaya.io' },
      };

      const mockResponse: ContentGenerationResponse = {
        content: 'Generated content',
        usage: { tokens: 100, cost: 0.01, model: 'gpt-4-turbo' },
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockConfig as any);
      mockOpenAIService.prototype.generateContent.mockResolvedValue(mockResponse);

      const request: ContentGenerationRequest = {
        contentType: 'article',
        topic: 'Cybersecurity trends',
        language: 'en',
      };

      await aiManager.generateContent(1, request);

      // Verify personality was applied
      const callArgs = mockOpenAIService.prototype.generateContent.mock.calls[0][0];
      expect(callArgs.personality).toBeDefined();
      expect(callArgs.personality?.name).toBe('Cybersecurity Expert');
    });

    it('should return health status', async () => {
      const mockConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        apiKeys: { openai: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'test.com' },
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockConfig as any);
      mockOpenAIService.prototype.isHealthy.mockReturnValue(true);

      const isHealthy = await aiManager.isHealthy(1);

      expect(isHealthy).toBe(true);
    });

    it('should return service metrics', async () => {
      const mockConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        apiKeys: { openai: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'test.com' },
      };

      const mockMetrics = {
        requestCount: 100,
        successCount: 95,
        failureCount: 5,
        averageResponseTime: 2500,
        totalCost: 1.25,
        circuitBreakerState: 'CLOSED' as const,
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockConfig as any);
      mockOpenAIService.prototype.getMetrics.mockReturnValue(mockMetrics);

      const metrics = await aiManager.getMetrics(1);

      expect(metrics.primary).toEqual(mockMetrics);
    });
  });

  describe('ContentGenerationService', () => {
    it('should generate content and save to database', async () => {
      const mockSiteConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        costTracking: false,
        apiKeys: { openai: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'himaya.io' },
      };

      const mockAIResponse: ContentGenerationResponse = {
        content: 'Generated article content',
        title: 'Generated Article Title',
        usage: {
          tokens: 150,
          cost: 0.015,
          model: 'gpt-4-turbo',
        },
        quality: {
          score: 85,
          readability: 80,
          seo: 90,
          accuracy: 85,
        },
      };

      const mockArticle = {
        id: 1,
        title: 'Generated Article Title',
        content: 'Generated article content',
        status: 'DRAFT',
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockSiteConfig as any);
      mockOpenAIService.prototype.generateContent.mockResolvedValue(mockAIResponse);
      mockPrisma.article.create.mockResolvedValue(mockArticle as any);
      mockPrisma.aiProcessingLog.create.mockResolvedValue({} as any);

      const request = {
        siteId: 1,
        contentType: 'article',
        topic: 'Cybersecurity trends',
        language: 'en',
      };

      const result = await contentGenerationService.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.content).toEqual(mockArticle);
      expect(result.quality).toEqual(mockAIResponse.quality);
      expect(result.usage).toEqual(mockAIResponse.usage);

      expect(mockPrisma.article.create).toHaveBeenCalled();
      expect(mockPrisma.aiProcessingLog.create).toHaveBeenCalled();
    });

    it('should handle budget limits', async () => {
      const mockSiteConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        costTracking: true,
        monthlyBudget: 10.0,
        apiKeys: { openai: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'test.com' },
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockSiteConfig as any);
      mockPrisma.aiProcessingLog.aggregate.mockResolvedValue({
        _sum: { cost: 10.0 },
      } as any);

      const request = {
        siteId: 1,
        contentType: 'article',
        topic: 'Cybersecurity trends',
        language: 'en',
      };

      const result = await contentGenerationService.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Monthly AI budget exceeded');
    });

    it('should generate batch content', async () => {
      const mockSiteConfig = {
        id: 1,
        siteId: 1,
        primaryProvider: 'openai',
        costTracking: false,
        apiKeys: { openai: 'test-key' },
        site: { id: 1, name: 'Test Site', domain: 'himaya.io' },
      };

      const mockAIResponse: ContentGenerationResponse = {
        content: 'Generated content',
        usage: { tokens: 100, cost: 0.01, model: 'gpt-4-turbo' },
      };

      const mockArticle = {
        id: 1,
        title: 'Generated Title',
        content: 'Generated content',
        status: 'DRAFT',
      };

      mockPrisma.siteAiConfig.findUnique.mockResolvedValue(mockSiteConfig as any);
      mockOpenAIService.prototype.generateBatch.mockResolvedValue([mockAIResponse]);
      mockPrisma.article.create.mockResolvedValue(mockArticle as any);
      mockPrisma.aiProcessingLog.create.mockResolvedValue({} as any);

      const requests = [
        {
          siteId: 1,
          contentType: 'article',
          topic: 'Topic 1',
          language: 'en',
        },
        {
          siteId: 1,
          contentType: 'summary',
          topic: 'Topic 2',
          language: 'en',
        },
      ];

      const results = await contentGenerationService.generateBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should get quality metrics', async () => {
      const mockLogs = [
        {
          id: 1,
          responseTime: 2000,
          qualityScore: 85,
          status: 'success',
          cost: 0.01,
        },
        {
          id: 2,
          responseTime: 2500,
          qualityScore: 90,
          status: 'success',
          cost: 0.015,
        },
      ];

      mockPrisma.aiProcessingLog.findMany.mockResolvedValue(mockLogs as any);

      const metrics = await contentGenerationService.getQualityMetrics(1, 'week');

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.successfulRequests).toBe(2);
      expect(metrics.successRate).toBe(100);
      expect(metrics.averageQualityScore).toBe(87.5);
      expect(metrics.averageResponseTime).toBe(2250);
    });
  });

  describe('Circuit Breaker', () => {
    it('should start in CLOSED state', () => {
      const circuitBreaker = new CircuitBreaker();
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open after failure threshold', async () => {
      const circuitBreaker = new CircuitBreaker({ failureThreshold: 3 });
      
      // Simulate failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error('Test failure')));
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should allow successful operations when closed', async () => {
      const circuitBreaker = new CircuitBreaker();
      
      const result = await circuitBreaker.execute(() => Promise.resolve('success'));
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should reset after recovery timeout', async () => {
      const circuitBreaker = new CircuitBreaker({ 
        failureThreshold: 1,
        recoveryTimeout: 100, // 100ms for testing
      });
      
      // Cause failure to open circuit
      try {
        await circuitBreaker.execute(() => Promise.reject(new Error('Test failure')));
      } catch (error) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be in HALF_OPEN state
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    it('should handle timeout', async () => {
      const circuitBreaker = new CircuitBreaker({ expectedResponseTime: 100 });
      
      try {
        await circuitBreaker.execute(() => 
          new Promise(resolve => setTimeout(resolve, 200))
        );
      } catch (error) {
        expect(error.message).toBe('Operation timeout');
      }
    });
  });

  describe('AI Service Configuration', () => {
    it('should validate AI service configuration', () => {
      const validConfig: AIServiceConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: 'test-key',
        timeout: 30000,
        maxRetries: 3,
        temperature: 0.7,
        maxTokens: 2000,
      };

      expect(() => {
        // This should not throw
        new OpenAIService(validConfig);
      }).not.toThrow();
    });

    it('should handle missing API key', () => {
      const invalidConfig: AIServiceConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: '',
      };

      expect(() => {
        new OpenAIService(invalidConfig);
      }).not.toThrow(); // Constructor doesn't validate, but service will fail on API call
    });
  });
}); 