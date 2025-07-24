import { ContentDiscoveryService } from '@/lib/services/ai/content-discovery';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contentSource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    discoveredContent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    duplicateContent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contentTrend: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contentCuration: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    site: {
      findUnique: jest.fn(),
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

describe('ContentDiscoveryService', () => {
  let service: ContentDiscoveryService;

  beforeEach(() => {
    service = ContentDiscoveryService.getInstance();
    jest.clearAllMocks();
  });

  describe('Source Management', () => {
    const mockSource = {
      name: 'Tech News RSS',
      url: 'https://example.com/feed.xml',
      type: 'rss' as const,
      configuration: { refreshInterval: 3600 },
      reliabilityScore: 0.8,
      isActive: true,
    };

    it('should add source successfully', async () => {
      const mockCreatedSource = { id: 'source-1', ...mockSource };
      (prisma.contentSource.create as jest.Mock).mockResolvedValue(mockCreatedSource);

      const result = await service.addSource(mockSource);

      expect(result).toEqual(mockCreatedSource);
      expect(prisma.contentSource.create).toHaveBeenCalledWith({
        data: {
          name: mockSource.name,
          url: mockSource.url,
          type: mockSource.type,
          configuration: mockSource.configuration,
          reliabilityScore: mockSource.reliabilityScore,
          isActive: mockSource.isActive,
        },
      });
    });

    it('should update source successfully', async () => {
      const updates = { reliabilityScore: 0.9 };
      const mockUpdatedSource = { id: 'source-1', ...mockSource, ...updates };
      (prisma.contentSource.update as jest.Mock).mockResolvedValue(mockUpdatedSource);

      const result = await service.updateSource('source-1', updates);

      expect(result).toEqual(mockUpdatedSource);
      expect(prisma.contentSource.update).toHaveBeenCalledWith({
        where: { id: 'source-1' },
        data: {
          ...updates,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should remove source successfully', async () => {
      (prisma.contentSource.delete as jest.Mock).mockResolvedValue({});

      await service.removeSource('source-1');

      expect(prisma.contentSource.delete).toHaveBeenCalledWith({
        where: { id: 'source-1' },
      });
    });

    it('should get sources successfully', async () => {
      const mockSources = [
        { id: 'source-1', ...mockSource },
        { id: 'source-2', ...mockSource, name: 'Business News' },
      ];
      (prisma.contentSource.findMany as jest.Mock).mockResolvedValue(mockSources);

      const result = await service.getSources();

      expect(result).toEqual(mockSources);
      expect(prisma.contentSource.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { reliabilityScore: 'desc' },
      });
    });
  });

  describe('Content Discovery', () => {
    const mockDiscoveredContent = {
      id: 'content-1',
      sourceId: 'source-1',
      title: 'Sample Article',
      description: 'Sample description',
      content: 'Sample content',
      url: 'https://example.com/article',
      publishedAt: new Date(),
      author: 'Sample Author',
      status: 'discovered',
    };

    it('should discover content successfully', async () => {
      const mockSources = [
        { id: 'source-1', type: 'rss', reliabilityScore: 0.8 },
        { id: 'source-2', type: 'api', reliabilityScore: 0.9 },
      ];
      (prisma.contentSource.findMany as jest.Mock).mockResolvedValue(mockSources);
      (prisma.discoveredContent.create as jest.Mock).mockResolvedValue(mockDiscoveredContent);
      (prisma.contentSource.update as jest.Mock).mockResolvedValue({});

      const result = await service.discoverContent();

      expect(result).toHaveLength(2); // 2 sources processed
      expect(prisma.discoveredContent.create).toHaveBeenCalledTimes(2);
    });

    it('should process RSS source successfully', async () => {
      const mockSource = { id: 'source-1', type: 'rss', url: 'https://example.com/feed.xml' };
      (prisma.contentSource.findUnique as jest.Mock).mockResolvedValue(mockSource);
      (prisma.discoveredContent.create as jest.Mock).mockResolvedValue(mockDiscoveredContent);

      const result = await service.processSource('source-1');

      expect(result).toHaveLength(1);
      expect(prisma.discoveredContent.create).toHaveBeenCalledWith({
        data: {
          sourceId: 'source-1',
          title: 'Sample RSS Article',
          description: 'This is a sample RSS article description',
          content: 'This is the full content of the RSS article...',
          url: 'https://example.com/article1',
          publishedAt: expect.any(Date),
          author: 'Sample Author',
          status: 'discovered',
        },
      });
    });

    it('should handle source processing errors gracefully', async () => {
      const mockSource = { id: 'source-1', type: 'rss', reliabilityScore: 0.8 };
      (prisma.contentSource.findMany as jest.Mock).mockResolvedValue([mockSource]);
      (prisma.discoveredContent.create as jest.Mock).mockRejectedValue(new Error('Processing failed'));
      (prisma.contentSource.update as jest.Mock).mockResolvedValue({});

      const result = await service.discoverContent();

      expect(result).toHaveLength(0);
      expect(prisma.contentSource.update).toHaveBeenCalledWith({
        where: { id: 'source-1' },
        data: { reliabilityScore: 0.7 }, // Decreased reliability score
      });
    });
  });

  describe('Content Analysis', () => {
    const mockContent = {
      id: 'content-1',
      title: 'Sample Article',
      content: 'This is sample content for analysis.',
      sourceId: 'source-1',
    };

    it('should analyze content successfully', async () => {
      const mockAnalysis = {
        relevanceScore: 0.85,
        qualityScore: 0.78,
        sentimentScore: 0.2,
        category: 'technology',
        tags: ['tech', 'innovation'],
      };

      jest.spyOn(service as any, 'performContentAnalysis').mockResolvedValue(mockAnalysis);
      (prisma.discoveredContent.update as jest.Mock).mockResolvedValue({
        ...mockContent,
        ...mockAnalysis,
        status: 'analyzed',
        processedAt: new Date(),
      });

      const result = await service.analyzeContent(mockContent as any);

      expect(result).toEqual(mockAnalysis);
      expect(prisma.discoveredContent.update).toHaveBeenCalledWith({
        where: { id: 'content-1' },
        data: {
          relevanceScore: mockAnalysis.relevanceScore,
          qualityScore: mockAnalysis.qualityScore,
          sentimentScore: mockAnalysis.sentimentScore,
          category: mockAnalysis.category,
          tags: mockAnalysis.tags,
          status: 'analyzed',
          processedAt: expect.any(Date),
        },
      });
    });

    it('should batch analyze content successfully', async () => {
      const mockContents = [mockContent, { ...mockContent, id: 'content-2' }];
      const mockAnalysis = {
        relevanceScore: 0.8,
        qualityScore: 0.7,
        tags: ['tech'],
      };

      jest.spyOn(service, 'analyzeContent').mockResolvedValue(mockAnalysis);

      const result = await service.batchAnalyzeContent(mockContents as any);

      expect(result).toHaveLength(2);
      expect(service.analyzeContent).toHaveBeenCalledTimes(2);
    });

    it('should handle analysis errors gracefully', async () => {
      jest.spyOn(service, 'analyzeContent').mockRejectedValue(new Error('Analysis failed'));

      const result = await service.batchAnalyzeContent([mockContent] as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        relevanceScore: 0,
        qualityScore: 0,
        tags: [],
      });
    });
  });

  describe('Quality Assessment', () => {
    const mockContent = {
      title: 'Sample Article',
      content: 'This is sample content for quality assessment.',
    };

    it('should assess content quality successfully', async () => {
      const mockAssessment = {
        score: 0.85,
        issues: ['Minor grammar issues'],
        strengths: ['Good structure', 'Clear writing'],
      };

      jest.spyOn(service as any, 'openaiProcessor.generateText').mockResolvedValue(
        JSON.stringify(mockAssessment)
      );

      const result = await service.assessQuality(mockContent as any);

      expect(result).toEqual({
        score: mockAssessment.score,
        issues: mockAssessment.issues,
      });
    });

    it('should validate content successfully', async () => {
      const validContent = {
        title: 'Valid Article Title',
        content: 'This is valid content with sufficient length for validation.',
        url: 'https://example.com/article',
      };

      const result = await service.validateContent(validContent as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidContent = {
        title: 'Hi',
        content: 'Short',
        url: '',
      };

      const result = await service.validateContent(invalidContent as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Content Retrieval', () => {
    it('should get discovered content with filters', async () => {
      const mockContent = [
        {
          id: 'content-1',
          title: 'Sample Article',
          status: 'analyzed',
          relevanceScore: 0.8,
          qualityScore: 0.7,
        },
      ];

      (prisma.discoveredContent.findMany as jest.Mock).mockResolvedValue(mockContent);
      (prisma.discoveredContent.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getDiscoveredContent({
        status: 'analyzed',
        minRelevanceScore: 0.7,
      });

      expect(result).toEqual(mockContent);
      expect(prisma.discoveredContent.findMany).toHaveBeenCalledWith({
        where: {
          status: 'analyzed',
          relevanceScore: { gte: 0.7 },
        },
        include: {
          source: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle source not found error', async () => {
      (prisma.contentSource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.processSource('non-existent')).rejects.toThrow(
        'Source not found: non-existent'
      );
    });

    it('should handle unsupported source type', async () => {
      const mockSource = { id: 'source-1', type: 'unsupported' };
      (prisma.contentSource.findUnique as jest.Mock).mockResolvedValue(mockSource);

      await expect(service.processSource('source-1')).rejects.toThrow(
        'Unsupported source type: unsupported'
      );
    });

    it('should handle AI service errors gracefully', async () => {
      jest.spyOn(service as any, 'openaiProcessor.generateText').mockRejectedValue(
        new Error('AI service error')
      );

      const result = await service.assessQuality({ title: 'Test', content: 'Test' } as any);

      expect(result.score).toBe(0.5);
      expect(result.issues).toContain('Quality assessment failed');
    });
  });

  describe('Validation', () => {
    it('should validate source data', async () => {
      const invalidSource = {
        name: '',
        url: 'invalid-url',
        type: 'invalid-type',
      };

      await expect(service.addSource(invalidSource as any)).rejects.toThrow();
    });

    it('should validate content data', async () => {
      const invalidContent = {
        sourceId: 'invalid-uuid',
        title: '',
        content: '',
        url: 'invalid-url',
      };

      await expect(service.analyzeContent(invalidContent as any)).rejects.toThrow();
    });
  });
}); 