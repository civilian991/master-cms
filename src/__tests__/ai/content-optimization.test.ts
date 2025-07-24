import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sEOOptimization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    imageOptimization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    performanceMetrics: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    accessibilityAudit: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contentQualityAnalysis: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    optimizationTrigger: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    performanceBudget: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock AI services
jest.mock('@/lib/services/ai/openai', () => ({
  OpenAIProcessor: {
    getInstance: jest.fn(() => ({
      generateText: jest.fn(),
      analyzeContent: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/services/ai/gemini', () => ({
  GeminiProcessor: {
    getInstance: jest.fn(() => ({
      generateText: jest.fn(),
      analyzeContent: jest.fn(),
    })),
  },
}));

describe('ContentOptimizationService', () => {
  let service: ContentOptimizationService;

  beforeEach(() => {
    service = ContentOptimizationService.getInstance();
    jest.clearAllMocks();
  });

  describe('SEO Optimization', () => {
    const mockSeoData = {
      contentId: 'test-content-id',
      contentType: 'article' as const,
      title: 'Test Article Title',
      description: 'Test article description for SEO optimization',
      keywords: ['test', 'article', 'seo'],
      content: 'This is test content for SEO analysis',
      url: 'https://example.com/test-article',
      imageUrl: 'https://example.com/test-image.jpg',
    };

    it('should optimize SEO successfully', async () => {
      const mockResult = {
        metaTitle: 'Optimized Test Article Title',
        metaDescription: 'Optimized test article description',
        keywords: ['test', 'article', 'seo', 'optimized'],
        structuredData: { '@type': 'Article' },
        score: 85,
        recommendations: ['Add more keywords', 'Improve meta description'],
      };

      jest.spyOn(service as any, 'generateSeoMeta').mockResolvedValue(mockResult);

      const result = await service.optimizeSEO(mockSeoData);

      expect(result).toEqual(mockResult);
      expect(service['generateSeoMeta']).toHaveBeenCalledWith(mockSeoData);
    });

    it('should generate structured data', async () => {
      const mockStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        author: { '@type': 'Person', name: 'Test Author' },
      };

      jest.spyOn(service as any, 'generateStructuredDataInternal').mockResolvedValue(mockStructuredData);

      const result = await service.generateStructuredData('article', {
        title: 'Test Article',
        author: 'Test Author',
      });

      expect(result).toEqual(mockStructuredData);
    });

    it('should analyze SEO', async () => {
      const mockAnalysis = {
        score: 75,
        issues: ['Missing meta description', 'Title too long'],
        recommendations: ['Add meta description', 'Shorten title'],
        structuredData: { '@type': 'Article' },
      };

      jest.spyOn(service as any, 'analyzeSeoInternal').mockResolvedValue(mockAnalysis);

      const result = await service.analyzeSEO({
        contentId: 'test-id',
        contentType: 'article',
      });

      expect(result).toEqual(mockAnalysis);
    });

    it('should batch optimize SEO', async () => {
      const mockResults = [
        { contentId: '1', score: 85, status: 'completed' },
        { contentId: '2', score: 90, status: 'completed' },
      ];

      jest.spyOn(service, 'optimizeSEO').mockResolvedValue({ score: 85 } as any);
      jest.spyOn(service, 'analyzeSEO').mockResolvedValue({ score: 90 } as any);

      const result = await service.batchOptimizeSEO({
        contentIds: ['1', '2'],
        contentType: 'article',
        optimizationType: 'full',
      });

      expect(result).toHaveLength(2);
      expect(service.optimizeSEO).toHaveBeenCalledTimes(2);
    });
  });

  describe('Image Optimization', () => {
    const mockImageData = {
      imageUrl: 'https://example.com/test-image.jpg',
      imageId: 'test-image-id',
      contentType: 'article' as const,
      optimizationLevel: 'medium' as const,
      formats: ['webp'] as const,
    };

    it('should optimize image successfully', async () => {
      const mockResult = {
        originalSize: 1024000,
        optimizedSize: 256000,
        compressionRatio: 75,
        formats: ['webp'],
        optimizedUrls: ['https://example.com/test-image.webp'],
        score: 90,
        recommendations: ['Image optimized successfully'],
      };

      jest.spyOn(service as any, 'optimizeImageInternal').mockResolvedValue(mockResult);

      const result = await service.optimizeImage(mockImageData);

      expect(result).toEqual(mockResult);
    });

    it('should analyze image', async () => {
      const mockAnalysis = {
        size: 1024000,
        dimensions: { width: 1920, height: 1080 },
        format: 'jpeg',
        compressionRatio: 0,
        recommendations: ['Convert to WebP', 'Resize to 1200px width'],
        score: 60,
      };

      jest.spyOn(service as any, 'analyzeImageInternal').mockResolvedValue(mockAnalysis);

      const result = await service.analyzeImage({
        imageUrl: 'https://example.com/test-image.jpg',
      });

      expect(result).toEqual(mockAnalysis);
    });

    it('should convert image format', async () => {
      const mockResult = {
        originalUrl: 'https://example.com/test-image.jpg',
        convertedUrl: 'https://example.com/test-image.webp',
        format: 'webp',
        size: 256000,
        quality: 85,
      };

      jest.spyOn(service as any, 'convertImageFormatInternal').mockResolvedValue(mockResult);

      const result = await service.convertImageFormat({
        imageUrl: 'https://example.com/test-image.jpg',
        targetFormat: 'webp',
        quality: 85,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Performance Monitoring', () => {
    const mockPerformanceData = {
      url: 'https://example.com/test-page',
      contentType: 'article' as const,
      metrics: {
        lcp: 1200,
        fid: 50,
        cls: 0.1,
        ttfb: 200,
        fcp: 800,
      },
    };

    it('should track performance metrics', async () => {
      const mockResult = {
        score: 85,
        status: 'good',
        recommendations: ['Optimize LCP', 'Reduce CLS'],
      };

      jest.spyOn(service as any, 'calculatePerformanceScore').mockReturnValue(85);
      jest.spyOn(service as any, 'getPerformanceStatus').mockReturnValue('good');

      const result = await service.trackPerformanceMetrics(mockPerformanceData);

      expect(result.score).toBe(85);
      expect(result.status).toBe('good');
    });

    it('should analyze performance', async () => {
      const mockAnalysis = {
        averageMetrics: { lcp: 1200, fid: 50, cls: 0.1 },
        trends: { lcp: 'improving', fid: 'stable', cls: 'worsening' },
        recommendations: ['Optimize images', 'Reduce JavaScript'],
        score: 85,
      };

      jest.spyOn(service as any, 'analyzePerformanceInternal').mockResolvedValue(mockAnalysis);

      const result = await service.analyzePerformance({
        url: 'https://example.com/test-page',
        timeRange: '7d',
      });

      expect(result).toEqual(mockAnalysis);
    });

    it('should set performance budget', async () => {
      const mockBudget = {
        budgetType: 'lcp',
        threshold: 2500,
        action: 'alert',
        priority: 'high',
      };

      jest.spyOn(service as any, 'setPerformanceBudgetInternal').mockResolvedValue(mockBudget);

      const result = await service.setPerformanceBudget(mockBudget);

      expect(result).toEqual(mockBudget);
    });
  });

  describe('Accessibility Auditing', () => {
    const mockAccessibilityData = {
      url: 'https://example.com/test-page',
      contentType: 'article' as const,
      level: 'AA' as const,
      html: '<html><body><h1>Test</h1></body></html>',
    };

    it('should audit accessibility', async () => {
      const mockResult = {
        violations: 2,
        warnings: 5,
        passes: 15,
        score: 75,
        recommendations: ['Add alt text to images', 'Improve color contrast'],
      };

      jest.spyOn(service as any, 'auditAccessibilityInternal').mockResolvedValue(mockResult);

      const result = await service.auditAccessibility(mockAccessibilityData);

      expect(result).toEqual(mockResult);
    });

    it('should fix accessibility issues', async () => {
      const mockResult = {
        originalHtml: '<img src="test.jpg">',
        fixedHtml: '<img src="test.jpg" alt="Test image">',
        issuesFixed: 1,
        remainingIssues: 0,
      };

      jest.spyOn(service as any, 'fixAccessibilityIssuesInternal').mockResolvedValue(mockResult);

      const result = await service.fixAccessibilityIssues({
        url: 'https://example.com/test-page',
        html: '<img src="test.jpg">',
        issues: ['missing-alt-text'],
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Content Quality Analysis', () => {
    const mockQualityData = {
      contentId: 'test-content-id',
      contentType: 'article' as const,
      title: 'Test Article',
      content: 'This is test content for quality analysis.',
      author: 'Test Author',
      targetAudience: 'general' as const,
    };

    it('should analyze content quality', async () => {
      const mockResult = {
        readabilityScore: 85,
        structureScore: 90,
        engagementScore: 80,
        seoScore: 75,
        overallScore: 82.5,
        metrics: { wordCount: 100, sentenceCount: 10 },
        recommendations: ['Improve readability', 'Add more headings'],
        issues: ['Long sentences', 'Missing subheadings'],
      };

      jest.spyOn(service as any, 'analyzeContentQualityInternal').mockResolvedValue(mockResult);

      const result = await service.analyzeContentQuality(mockQualityData);

      expect(result).toEqual(mockResult);
    });

    it('should improve content', async () => {
      const mockResult = {
        originalContent: 'Test content',
        improvedContent: 'Improved test content',
        improvements: ['Better readability', 'Enhanced structure'],
        score: 90,
      };

      jest.spyOn(service as any, 'improveContentInternal').mockResolvedValue(mockResult);

      const result = await service.improveContent({
        contentId: 'test-id',
        contentType: 'article',
        content: 'Test content',
        improvements: ['readability', 'structure'],
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Optimization Triggers', () => {
    const mockTriggerData = {
      name: 'SEO Score Alert',
      description: 'Alert when SEO score drops below 70',
      triggerType: 'seo' as const,
      conditions: {
        metric: 'seo_score',
        operator: 'lt' as const,
        value: 70,
      },
      actions: [
        {
          type: 'alert' as const,
          parameters: { message: 'SEO score is low' },
        },
      ],
    };

    it('should create optimization trigger', async () => {
      const mockTrigger = {
        id: 'trigger-id',
        ...mockTriggerData,
        isActive: true,
        priority: 'medium',
      };

      jest.spyOn(service as any, 'createOptimizationTriggerInternal').mockResolvedValue(mockTrigger);

      const result = await service.createOptimizationTrigger(mockTriggerData);

      expect(result).toEqual(mockTrigger);
    });

    it('should execute optimization trigger', async () => {
      const mockResult = {
        triggerId: 'trigger-id',
        executed: true,
        actions: ['alert'],
        results: ['Alert sent successfully'],
      };

      jest.spyOn(service as any, 'executeOptimizationTriggerInternal').mockResolvedValue(mockResult);

      const result = await service.executeOptimizationTrigger({
        triggerId: 'trigger-id',
        contentId: 'content-id',
      });

      expect(result).toEqual(mockResult);
    });

    it('should test optimization trigger', async () => {
      const mockResult = {
        triggerId: 'trigger-id',
        conditionsMet: true,
        actions: ['alert'],
        testResults: ['Test alert sent'],
      };

      jest.spyOn(service as any, 'testOptimizationTriggerInternal').mockResolvedValue(mockResult);

      const result = await service.testOptimizationTrigger({
        triggerId: 'trigger-id',
        testData: { seo_score: 65 },
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Error Handling', () => {
    it('should handle SEO optimization errors', async () => {
      jest.spyOn(service as any, 'generateSeoMeta').mockRejectedValue(new Error('AI service error'));

      await expect(service.optimizeSEO({
        contentId: 'test-id',
        contentType: 'article',
        title: 'Test',
        description: 'Test',
        content: 'Test',
        url: 'https://example.com',
      })).rejects.toThrow('AI service error');
    });

    it('should handle image optimization errors', async () => {
      jest.spyOn(service as any, 'optimizeImageInternal').mockRejectedValue(new Error('Image processing error'));

      await expect(service.optimizeImage({
        imageUrl: 'https://example.com/test.jpg',
        contentType: 'article',
      })).rejects.toThrow('Image processing error');
    });

    it('should handle performance tracking errors', async () => {
      jest.spyOn(service as any, 'calculatePerformanceScore').mockImplementation(() => {
        throw new Error('Performance calculation error');
      });

      await expect(service.trackPerformanceMetrics({
        url: 'https://example.com',
        contentType: 'article',
        metrics: { lcp: 1000 },
      })).rejects.toThrow('Performance calculation error');
    });
  });

  describe('Validation', () => {
    it('should validate SEO optimization input', async () => {
      const invalidData = {
        contentId: 'invalid-uuid',
        contentType: 'invalid-type',
        title: '',
        description: '',
        content: '',
        url: 'invalid-url',
      };

      await expect(service.optimizeSEO(invalidData as any)).rejects.toThrow();
    });

    it('should validate image optimization input', async () => {
      const invalidData = {
        imageUrl: 'invalid-url',
        contentType: 'invalid-type',
      };

      await expect(service.optimizeImage(invalidData as any)).rejects.toThrow();
    });

    it('should validate performance metrics input', async () => {
      const invalidData = {
        url: 'invalid-url',
        contentType: 'invalid-type',
        metrics: { lcp: -1 },
      };

      await expect(service.trackPerformanceMetrics(invalidData as any)).rejects.toThrow();
    });
  });
}); 