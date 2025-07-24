import { AdvancedContentGenerationService } from '@/lib/services/ai/content-generation-advanced';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    advancedContentGeneration: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentGenerationSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contentVersion: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    contentSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contentQualityMetrics: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Advanced Content Generation Service', () => {
  let contentService: AdvancedContentGenerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    contentService = AdvancedContentGenerationService.getInstance();
  });

  describe('Content Template Management', () => {
    it('should create content template', async () => {
      const templateData = {
        siteId: 1,
        name: 'Cybersecurity Article Template',
        description: 'Template for cybersecurity articles',
        contentType: 'article',
        templateStructure: {
          sections: [
            { name: 'Introduction', type: 'text', required: true },
            { name: 'Main Content', type: 'text', required: true },
            { name: 'Conclusion', type: 'text', required: true },
          ],
          format: 'article',
          style: 'informative',
        },
        aiPrompts: {
          systemPrompt: 'You are a cybersecurity expert',
          userPrompt: 'Write about {topic}',
        },
        optimizationRules: {
          seoKeywords: ['cybersecurity', 'threats'],
          targetLength: { min: 1000, max: 2000 },
          tone: 'professional',
          style: 'informative',
        },
        qualityCriteria: {
          readabilityTarget: 80,
          seoScoreTarget: 90,
          engagementTarget: 85,
        },
      };

      const mockTemplate = { id: 1, ...templateData, site: { id: 1, name: 'Test Site' } };
      mockPrisma.contentTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await contentService.createContentTemplate(templateData);

      expect(result).toEqual(mockTemplate);
      expect(mockPrisma.contentTemplate.create).toHaveBeenCalledWith({
        data: templateData,
        include: { site: true },
      });
    });

    it('should get content templates', async () => {
      const mockTemplates = [
        { id: 1, name: 'Template 1', contentType: 'article' },
        { id: 2, name: 'Template 2', contentType: 'social' },
      ];
      mockPrisma.contentTemplate.findMany.mockResolvedValue(mockTemplates as any);

      const result = await contentService.getContentTemplates(1, 'article');

      expect(result).toEqual(mockTemplates);
      expect(mockPrisma.contentTemplate.findMany).toHaveBeenCalledWith({
        where: { siteId: 1, contentType: 'article' },
        orderBy: { name: 'asc' },
        include: { site: true },
      });
    });

    it('should get content template by id', async () => {
      const mockTemplate = {
        id: 1,
        name: 'Test Template',
        contentType: 'article',
        site: { id: 1, name: 'Test Site' },
        sessions: [],
      };
      mockPrisma.contentTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      const result = await contentService.getContentTemplate(1);

      expect(result).toEqual(mockTemplate);
      expect(mockPrisma.contentTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          site: true,
          sessions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    it('should update content template', async () => {
      const updateData = {
        name: 'Updated Template',
        description: 'Updated description',
      };

      const mockTemplate = { id: 1, ...updateData, site: { id: 1, name: 'Test Site' } };
      mockPrisma.contentTemplate.update.mockResolvedValue(mockTemplate as any);

      const result = await contentService.updateContentTemplate(1, updateData);

      expect(result).toEqual(mockTemplate);
      expect(mockPrisma.contentTemplate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        include: { site: true },
      });
    });
  });

  describe('Content Generation Sessions', () => {
    it('should create content session', async () => {
      const sessionData = {
        siteId: 1,
        sessionType: 'single',
        contentType: 'article',
        templateId: 1,
        generationParams: {
          topic: 'Cybersecurity threats',
          keywords: ['cybersecurity', 'threats'],
          targetAudience: 'IT professionals',
          tone: 'professional',
          length: 1000,
          language: 'en',
        },
        optimizationSettings: {
          seoOptimization: true,
          readabilityOptimization: true,
          engagementOptimization: true,
          plagiarismCheck: true,
        },
      };

      const mockSession = {
        id: 1,
        ...sessionData,
        status: 'draft',
        progress: 0,
        collaborators: [],
        versionHistory: [],
        site: { id: 1, name: 'Test Site' },
        template: { id: 1, name: 'Test Template' },
      };
      mockPrisma.contentGenerationSession.create.mockResolvedValue(mockSession as any);

      const result = await contentService.createContentSession(sessionData);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.contentGenerationSession.create).toHaveBeenCalledWith({
        data: {
          ...sessionData,
          status: 'draft',
          progress: 0,
          collaborators: [],
          versionHistory: [],
        },
        include: {
          site: true,
          template: true,
        },
      });
    });

    it('should get content session', async () => {
      const mockSession = {
        id: 1,
        siteId: 1,
        sessionType: 'single',
        contentType: 'article',
        status: 'completed',
        site: { id: 1, name: 'Test Site' },
        template: { id: 1, name: 'Test Template' },
        versions: [],
      };
      mockPrisma.contentGenerationSession.findUnique.mockResolvedValue(mockSession as any);

      const result = await contentService.getContentSession(1);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.contentGenerationSession.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          site: true,
          template: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      });
    });

    it('should get content sessions', async () => {
      const mockSessions = [
        { id: 1, siteId: 1, sessionType: 'single', status: 'completed' },
        { id: 2, siteId: 1, sessionType: 'batch', status: 'generating' },
      ];
      mockPrisma.contentGenerationSession.findMany.mockResolvedValue(mockSessions as any);

      const result = await contentService.getContentSessions(1, 'completed');

      expect(result).toEqual(mockSessions);
      expect(mockPrisma.contentGenerationSession.findMany).toHaveBeenCalledWith({
        where: { siteId: 1, status: 'completed' },
        orderBy: { createdAt: 'desc' },
        include: {
          site: true,
          template: true,
          versions: {
            take: 1,
            orderBy: { versionNumber: 'desc' },
          },
        },
      });
    });
  });

  describe('Content Generation', () => {
    it('should generate content', async () => {
      const mockSession = {
        id: 1,
        siteId: 1,
        contentType: 'article',
        generationParams: { topic: 'Test topic' },
        site: { id: 1, name: 'Test Site' },
        template: { id: 1, name: 'Test Template' },
        versions: [],
      };
      mockPrisma.contentGenerationSession.findUnique.mockResolvedValue(mockSession as any);

      const mockVersion = {
        id: 1,
        sessionId: 1,
        versionNumber: 1,
        content: 'Generated content',
        metadata: { generationTime: 5000 },
        qualityScore: 85,
        seoScore: 90,
        readabilityScore: 88,
        engagementScore: 87,
      };
      mockPrisma.contentVersion.create.mockResolvedValue(mockVersion as any);

      // Mock AI service response
      const mockAIResponse = {
        content: 'Generated content',
        provider: 'openai',
        model: 'gpt-4',
        tokens: 500,
        cost: 0.05,
      };

      // Mock the AI manager
      const mockAIManager = {
        generateContent: jest.fn().mockResolvedValue(mockAIResponse),
      };
      (contentService as any).aiManager = mockAIManager;

      const result = await contentService.generateContent(1, {
        useTemplate: true,
        optimizeContent: true,
        personalizeContent: true,
      });

      expect(result).toEqual(mockVersion);
      expect(mockPrisma.contentGenerationSession.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'generating',
          progress: 10,
        },
      });
    });

    it('should create content version', async () => {
      const versionData = {
        sessionId: 1,
        versionNumber: 1,
        content: 'Test content',
        metadata: { generationTime: 5000 },
      };

      const mockVersion = {
        id: 1,
        ...versionData,
        qualityScore: 85,
        seoScore: 90,
        readabilityScore: 88,
        engagementScore: 87,
        optimizationData: {},
        improvementSuggestions: [],
        session: {
          site: { id: 1, name: 'Test Site' },
          template: { id: 1, name: 'Test Template' },
        },
      };
      mockPrisma.contentVersion.create.mockResolvedValue(mockVersion as any);

      const mockQualityMetrics = {
        overallScore: 85,
        contentQuality: 88,
        seoOptimization: 90,
        readabilityScore: 88,
        engagementPrediction: 87,
        keywordDensity: {},
        contentStructure: {},
        toneAnalysis: {},
        grammarCheck: {},
        improvementSuggestions: [],
        priorityActions: [],
      };
      mockPrisma.contentQualityMetrics.create.mockResolvedValue(mockQualityMetrics as any);

      const result = await contentService.createContentVersion(versionData);

      expect(result).toEqual(mockVersion);
      expect(mockPrisma.contentVersion.create).toHaveBeenCalled();
      expect(mockPrisma.contentQualityMetrics.create).toHaveBeenCalled();
    });
  });

  describe('Content Optimization', () => {
    it('should optimize content', async () => {
      const mockVersion = {
        id: 1,
        sessionId: 1,
        versionNumber: 1,
        content: 'Original content',
        session: {
          siteId: 1,
          generationParams: { topic: 'Test topic' },
          site: { id: 1, name: 'Test Site' },
        },
      };
      mockPrisma.contentVersion.findUnique.mockResolvedValue(mockVersion as any);

      const mockOptimizedVersion = {
        id: 2,
        sessionId: 1,
        versionNumber: 2,
        content: 'Optimized content',
        parentVersion: 1,
        changeSummary: 'Comprehensive optimization applied',
      };
      mockPrisma.contentVersion.create.mockResolvedValue(mockOptimizedVersion as any);

      const result = await contentService.optimizeContent(1);

      expect(result).toEqual(mockOptimizedVersion);
      expect(mockPrisma.contentVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 1,
          versionNumber: 2,
          parentVersion: 1,
          changeSummary: 'Comprehensive optimization applied',
        }),
        include: {
          session: {
            include: {
              site: true,
              template: true,
            },
          },
        },
      });
    });

    it('should personalize content', async () => {
      const mockVersion = {
        id: 1,
        sessionId: 1,
        versionNumber: 1,
        content: 'Original content',
        session: {
          siteId: 1,
          site: { id: 1, name: 'Test Site' },
        },
      };
      mockPrisma.contentVersion.findUnique.mockResolvedValue(mockVersion as any);

      const mockPersonalizedVersion = {
        id: 2,
        sessionId: 1,
        versionNumber: 2,
        content: 'Personalized content',
        parentVersion: 1,
        changeSummary: 'Content personalized for target audience',
      };
      mockPrisma.contentVersion.create.mockResolvedValue(mockPersonalizedVersion as any);

      const result = await contentService.personalizeContent(1, { audience: 'professionals' });

      expect(result).toEqual(mockPersonalizedVersion);
      expect(mockPrisma.contentVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 1,
          versionNumber: 2,
          parentVersion: 1,
          changeSummary: 'Content personalized for target audience',
        }),
        include: {
          session: {
            include: {
              site: true,
            },
          },
        },
      });
    });
  });

  describe('Content Scheduling', () => {
    it('should create content schedule', async () => {
      const scheduleData = {
        siteId: 1,
        scheduleName: 'Daily Articles',
        scheduleType: 'recurring',
        scheduleConfig: {
          frequency: 'daily',
          startDate: new Date(),
        },
        contentType: 'article',
        generationParams: { topic: 'Daily topic' },
        publishChannels: ['website'],
        publishSettings: {},
      };

      const mockSchedule = {
        id: 1,
        ...scheduleData,
        status: 'active',
        nextRun: scheduleData.scheduleConfig.startDate,
        site: { id: 1, name: 'Test Site' },
      };
      mockPrisma.contentSchedule.create.mockResolvedValue(mockSchedule as any);

      const result = await contentService.createContentSchedule(scheduleData);

      expect(result).toEqual(mockSchedule);
      expect(mockPrisma.contentSchedule.create).toHaveBeenCalledWith({
        data: {
          ...scheduleData,
          status: 'active',
          nextRun: scheduleData.scheduleConfig.startDate,
        },
        include: {
          site: true,
          template: true,
        },
      });
    });

    it('should get content schedules', async () => {
      const mockSchedules = [
        { id: 1, siteId: 1, scheduleName: 'Daily', status: 'active' },
        { id: 2, siteId: 1, scheduleName: 'Weekly', status: 'paused' },
      ];
      mockPrisma.contentSchedule.findMany.mockResolvedValue(mockSchedules as any);

      const result = await contentService.getContentSchedules(1, 'active');

      expect(result).toEqual(mockSchedules);
      expect(mockPrisma.contentSchedule.findMany).toHaveBeenCalledWith({
        where: { siteId: 1, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: {
          site: true,
          template: true,
        },
      });
    });

    it('should execute scheduled content', async () => {
      const mockSchedule = {
        id: 1,
        siteId: 1,
        status: 'active',
        scheduleConfig: { frequency: 'daily' },
        contentType: 'article',
        generationParams: { topic: 'Scheduled topic' },
        totalPublished: 5,
        successRate: 0.8,
        site: { id: 1, name: 'Test Site' },
      };
      mockPrisma.contentSchedule.findUnique.mockResolvedValue(mockSchedule as any);

      const mockSession = {
        id: 1,
        siteId: 1,
        sessionType: 'single',
        contentType: 'article',
      };
      mockPrisma.contentGenerationSession.create.mockResolvedValue(mockSession as any);

      const mockVersion = {
        id: 1,
        sessionId: 1,
        versionNumber: 1,
        content: 'Scheduled content',
      };
      mockPrisma.contentVersion.create.mockResolvedValue(mockVersion as any);

      // Mock AI service
      const mockAIManager = {
        generateContent: jest.fn().mockResolvedValue({
          content: 'Scheduled content',
          provider: 'openai',
          model: 'gpt-4',
          tokens: 500,
          cost: 0.05,
        }),
      };
      (contentService as any).aiManager = mockAIManager;

      const result = await contentService.executeScheduledContent(1);

      expect(result).toEqual(mockVersion);
      expect(mockPrisma.contentSchedule.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          lastRun: expect.any(Date),
          nextRun: expect.any(Date),
          totalPublished: 6,
          successRate: expect.any(Number),
        },
      });
    });
  });

  describe('Batch Content Generation', () => {
    it('should generate batch content', async () => {
      const batchConfig = {
        contentType: 'article',
        topics: ['Topic 1', 'Topic 2', 'Topic 3'],
        templateId: 1,
        optimizationSettings: {
          seoOptimization: true,
          readabilityOptimization: true,
        },
      };

      // Mock session creation
      const mockSession = {
        id: 1,
        siteId: 1,
        sessionType: 'batch',
        contentType: 'article',
      };
      mockPrisma.contentGenerationSession.create.mockResolvedValue(mockSession as any);

      // Mock version creation
      const mockVersion = {
        id: 1,
        sessionId: 1,
        versionNumber: 1,
        content: 'Generated content',
      };
      mockPrisma.contentVersion.create.mockResolvedValue(mockVersion as any);

      // Mock AI service
      const mockAIManager = {
        generateContent: jest.fn().mockResolvedValue({
          content: 'Generated content',
          provider: 'openai',
          model: 'gpt-4',
          tokens: 500,
          cost: 0.05,
        }),
      };
      (contentService as any).aiManager = mockAIManager;

      const result = await contentService.generateBatchContent(1, batchConfig);

      expect(result).toHaveLength(3);
      expect(result[0].success).toBe(true);
      expect(result[0].session).toEqual(mockSession);
      expect(result[0].version).toEqual(mockVersion);
    });
  });

  describe('Helper Methods', () => {
    it('should build generation prompt', async () => {
      const mockSession = {
        contentType: 'article',
        generationParams: { topic: 'Test topic' },
        template: {
          aiPrompts: {
            systemPrompt: 'You are an expert',
            userPrompt: 'Write about {topic}',
          },
        },
      };

      const mockPersonality = {
        basePersonality: {
          description: 'Cybersecurity expert',
          tone: 'professional',
          expertise: ['cybersecurity'],
          writingStyle: 'Technical and clear',
          targetAudience: 'IT professionals',
        },
      };

      const result = await (contentService as any).buildGenerationPrompt(mockSession, mockPersonality);

      expect(result.systemPrompt).toContain('You are an expert');
      expect(result.userPrompt).toContain('Write about Test topic');
    });

    it('should get max tokens for content type', () => {
      const service = contentService as any;
      
      expect(service.getMaxTokens('article')).toBe(4000);
      expect(service.getMaxTokens('social')).toBe(500);
      expect(service.getMaxTokens('newsletter')).toBe(2000);
      expect(service.getMaxTokens('video')).toBe(1500);
      expect(service.getMaxTokens('podcast')).toBe(2000);
      expect(service.getMaxTokens('unknown')).toBe(2000);
    });

    it('should analyze content quality', async () => {
      const service = contentService as any;
      const content = 'This is a test content for quality analysis.';
      
      const result = await service.analyzeContentQuality(content);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.contentQuality).toBeGreaterThan(0);
      expect(result.seoOptimization).toBeGreaterThan(0);
      expect(result.readabilityScore).toBeGreaterThan(0);
      expect(result.engagementPrediction).toBeGreaterThan(0);
    });

    it('should optimize SEO', async () => {
      const service = contentService as any;
      const content = 'Original content';
      const params = { topic: 'Test topic' };
      
      const result = await service.optimizeSEO(content, params);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should optimize readability', async () => {
      const service = contentService as any;
      const content = 'Original content';
      
      const result = await service.optimizeReadability(content);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should optimize engagement', async () => {
      const service = contentService as any;
      const content = 'Original content';
      
      const result = await service.optimizeEngagement(content);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should apply personalization', async () => {
      const service = contentService as any;
      const content = 'Original content';
      const personality = {
        basePersonality: {
          tone: 'professional',
          expertise: ['cybersecurity'],
        },
      };
      const personalizationData = { audience: 'professionals' };
      
      const result = await service.applyPersonalization(content, personality, personalizationData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should calculate next run', () => {
      const service = contentService as any;
      const scheduleConfig = { frequency: 'daily' };
      
      const result = service.calculateNextRun(scheduleConfig);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });
}); 