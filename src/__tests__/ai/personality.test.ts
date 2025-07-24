import { AdvancedPersonalityService } from '@/lib/services/ai/personality';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    advancedPersonality: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    personalityPerformance: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    personalityTrainingData: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    personalityABTest: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    personalityTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Advanced Personality Service', () => {
  let personalityService: AdvancedPersonalityService;

  beforeEach(() => {
    jest.clearAllMocks();
    personalityService = AdvancedPersonalityService.getInstance();
  });

  describe('Personality Template Management', () => {
    it('should create personality template', async () => {
      const templateData = {
        name: 'Cybersecurity Expert',
        description: 'Expert in cybersecurity and threat intelligence',
        industry: 'cybersecurity',
        baseConfiguration: {
          tone: 'authoritative',
          expertise: ['cybersecurity', 'threat intelligence'],
          writingStyle: 'Technical and authoritative',
          targetAudience: 'Security professionals',
          language: 'en',
        },
        features: {
          dynamicAdaptation: true,
          culturalLocalization: true,
          audienceTargeting: true,
          styleMatching: true,
          aBTesting: true,
        },
        culturalSupport: {
          regions: ['Global'],
          languages: ['en', 'ar'],
          culturalContexts: ['cybersecurity'],
        },
        audienceTargeting: {
          segments: ['security_professionals', 'it_managers'],
          demographics: ['professionals'],
          interests: ['cybersecurity', 'technology'],
        },
      };

      const mockTemplate = { id: 1, ...templateData };
      mockPrisma.personalityTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await personalityService.createPersonalityTemplate(templateData);

      expect(result).toEqual(mockTemplate);
      expect(mockPrisma.personalityTemplate.create).toHaveBeenCalledWith({
        data: templateData,
      });
    });

    it('should get personality templates', async () => {
      const mockTemplates = [
        { id: 1, name: 'Template 1', industry: 'cybersecurity' },
        { id: 2, name: 'Template 2', industry: 'finance' },
      ];
      mockPrisma.personalityTemplate.findMany.mockResolvedValue(mockTemplates as any);

      const result = await personalityService.getPersonalityTemplates('cybersecurity');

      expect(result).toEqual(mockTemplates);
      expect(mockPrisma.personalityTemplate.findMany).toHaveBeenCalledWith({
        where: { industry: 'cybersecurity', isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('Advanced Personality Management', () => {
    it('should create advanced personality', async () => {
      const personalityData = {
        siteId: 1,
        basePersonality: {
          name: 'Test Personality',
          description: 'Test description',
          tone: 'professional',
          expertise: ['test'],
          writingStyle: 'Test style',
          targetAudience: 'Test audience',
          language: 'en',
        },
        dynamicAdaptation: true,
        learningEnabled: true,
        adaptationRate: 0.1,
        culturalContext: {
          region: 'Global',
          language: 'en',
          culturalNorms: [],
          localPreferences: {},
        },
        linguisticStyle: {
          formality: 'semi-formal',
          vocabulary: 'general',
          sentenceStructure: 'moderate',
          culturalReferences: true,
        },
        regionalPreferences: {
          dateFormats: 'MM/DD/YYYY',
          numberFormats: '1,234.56',
          currencyFormats: '$1,234.56',
          measurementUnits: 'metric',
        },
        audienceSegments: [],
        targetingEnabled: true,
        performanceTracking: true,
        optimizationEnabled: true,
        aBTestingEnabled: true,
        modelVersion: 'v1.0.0',
      };

      const mockPersonality = { id: 1, ...personalityData, site: { id: 1, name: 'Test Site' } };
      mockPrisma.advancedPersonality.create.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.createAdvancedPersonality(personalityData);

      expect(result).toEqual(mockPersonality);
      expect(mockPrisma.advancedPersonality.create).toHaveBeenCalledWith({
        data: personalityData,
        include: { site: true },
      });
    });

    it('should get advanced personality', async () => {
      const mockPersonality = {
        id: 1,
        siteId: 1,
        basePersonality: { name: 'Test' },
        site: { id: 1, name: 'Test Site' },
        performanceMetrics: [],
      };
      mockPrisma.advancedPersonality.findUnique.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.getAdvancedPersonality(1);

      expect(result).toEqual(mockPersonality);
      expect(mockPrisma.advancedPersonality.findUnique).toHaveBeenCalledWith({
        where: { siteId: 1 },
        include: {
          site: true,
          performanceMetrics: {
            orderBy: { measurementDate: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should update advanced personality', async () => {
      const updateData = {
        dynamicAdaptation: false,
        adaptationRate: 0.2,
      };

      const mockPersonality = { id: 1, siteId: 1, ...updateData, site: { id: 1, name: 'Test Site' } };
      mockPrisma.advancedPersonality.update.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.updateAdvancedPersonality(1, updateData);

      expect(result).toEqual(mockPersonality);
      expect(mockPrisma.advancedPersonality.update).toHaveBeenCalledWith({
        where: { siteId: 1 },
        data: updateData,
        include: { site: true },
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should record personality performance', async () => {
      const performanceData = {
        personalityId: 1,
        contentQualityScore: 85,
        audienceEngagement: 78,
        culturalRelevance: 92,
        consistencyScore: 88,
        contentCount: 10,
        publishedCount: 8,
        rejectedCount: 2,
        measurementDate: new Date(),
        timeRange: 'week' as const,
      };

      const mockPerformance = { id: 1, ...performanceData };
      mockPrisma.personalityPerformance.create.mockResolvedValue(mockPerformance as any);

      const result = await personalityService.recordPersonalityPerformance(performanceData);

      expect(result).toEqual(mockPerformance);
      expect(mockPrisma.personalityPerformance.create).toHaveBeenCalledWith({
        data: performanceData,
      });
    });

    it('should get personality performance', async () => {
      const mockPerformance = [
        { id: 1, personalityId: 1, contentQualityScore: 85, measurementDate: new Date() },
        { id: 2, personalityId: 1, contentQualityScore: 87, measurementDate: new Date() },
      ];
      mockPrisma.personalityPerformance.findMany.mockResolvedValue(mockPerformance as any);

      const result = await personalityService.getPersonalityPerformance(1, 'week');

      expect(result).toEqual(mockPerformance);
      expect(mockPrisma.personalityPerformance.findMany).toHaveBeenCalledWith({
        where: {
          personalityId: 1,
          measurementDate: {
            gte: expect.any(Date),
          },
        },
        orderBy: { measurementDate: 'asc' },
      });
    });

    it('should get personality analytics', async () => {
      const mockPerformance = [
        { contentQualityScore: 85, audienceEngagement: 78, culturalRelevance: 92, consistencyScore: 88 },
        { contentQualityScore: 87, audienceEngagement: 80, culturalRelevance: 90, consistencyScore: 85 },
      ];
      mockPrisma.personalityPerformance.findMany.mockResolvedValue(mockPerformance as any);

      const result = await personalityService.getPersonalityAnalytics(1);

      expect(result).toBeDefined();
      expect(result?.averages).toBeDefined();
      expect(result?.trends).toBeDefined();
      expect(result?.recentPerformance).toBeDefined();
    });
  });

  describe('Training Data Management', () => {
    it('should add training data', async () => {
      const trainingData = {
        personalityId: 1,
        contentType: 'article',
        content: 'Test content',
        metadata: { source: 'test' },
        performanceScore: 85,
        qualityScore: 90,
      };

      const mockTrainingData = { id: 1, ...trainingData, dataVersion: 'v1234567890', isActive: true };
      mockPrisma.personalityTrainingData.create.mockResolvedValue(mockTrainingData as any);

      const result = await personalityService.addTrainingData(1, trainingData);

      expect(result).toEqual(mockTrainingData);
      expect(mockPrisma.personalityTrainingData.create).toHaveBeenCalledWith({
        data: {
          personalityId: 1,
          dataVersion: expect.any(String),
          ...trainingData,
        },
      });
    });

    it('should get training data', async () => {
      const mockTrainingData = [
        { id: 1, personalityId: 1, content: 'Test content 1', isActive: true },
        { id: 2, personalityId: 1, content: 'Test content 2', isActive: true },
      ];
      mockPrisma.personalityTrainingData.findMany.mockResolvedValue(mockTrainingData as any);

      const result = await personalityService.getTrainingData(1, true);

      expect(result).toEqual(mockTrainingData);
      expect(mockPrisma.personalityTrainingData.findMany).toHaveBeenCalledWith({
        where: {
          personalityId: 1,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should update training data quality', async () => {
      const qualityScores = {
        qualityScore: 95,
        culturalScore: 88,
        relevanceScore: 92,
      };

      const mockTrainingData = { id: 1, ...qualityScores };
      mockPrisma.personalityTrainingData.update.mockResolvedValue(mockTrainingData as any);

      const result = await personalityService.updateTrainingDataQuality(1, qualityScores);

      expect(result).toEqual(mockTrainingData);
      expect(mockPrisma.personalityTrainingData.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: qualityScores,
      });
    });
  });

  describe('A/B Testing', () => {
    it('should create A/B test', async () => {
      const abTestData = {
        personalityId: 1,
        testName: 'Tone Test',
        variantA: { tone: 'professional' },
        variantB: { tone: 'conversational' },
        startDate: new Date(),
        sampleSizeA: 0,
        sampleSizeB: 0,
      };

      const mockABTest = { id: 1, ...abTestData, status: 'running' };
      mockPrisma.personalityABTest.create.mockResolvedValue(mockABTest as any);

      const result = await personalityService.createABTest(abTestData);

      expect(result).toEqual(mockABTest);
      expect(mockPrisma.personalityABTest.create).toHaveBeenCalledWith({
        data: {
          ...abTestData,
          status: 'running',
        },
      });
    });

    it('should update A/B test results', async () => {
      const results = {
        variantAPerformance: 85,
        variantBPerformance: 78,
        statisticalSignificance: 0.03,
        winner: 'A' as const,
        sampleSizeA: 100,
        sampleSizeB: 100,
      };

      const mockABTest = { id: 1, ...results, status: 'completed', endDate: new Date() };
      mockPrisma.personalityABTest.update.mockResolvedValue(mockABTest as any);

      const result = await personalityService.updateABTestResults(1, results);

      expect(result).toEqual(mockABTest);
      expect(mockPrisma.personalityABTest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...results,
          status: 'completed',
          endDate: expect.any(Date),
        },
      });
    });

    it('should get A/B tests', async () => {
      const mockABTests = [
        { id: 1, personalityId: 1, testName: 'Test 1', status: 'running' },
        { id: 2, personalityId: 1, testName: 'Test 2', status: 'completed' },
      ];
      mockPrisma.personalityABTest.findMany.mockResolvedValue(mockABTests as any);

      const result = await personalityService.getABTests(1, 'running');

      expect(result).toEqual(mockABTests);
      expect(mockPrisma.personalityABTest.findMany).toHaveBeenCalledWith({
        where: { personalityId: 1, status: 'running' },
        orderBy: { startDate: 'desc' },
      });
    });
  });

  describe('Dynamic Adaptation', () => {
    it('should adapt personality based on performance', async () => {
      const mockPersonality = {
        id: 1,
        siteId: 1,
        dynamicAdaptation: true,
        adaptationRate: 0.1,
        basePersonality: {
          tone: 'professional',
          expertise: ['cybersecurity'],
          writingStyle: 'Technical and clear',
        },
      };

      const performanceData = {
        contentQualityScore: 75,
        audienceEngagement: 65,
        culturalRelevance: 85,
        consistencyScore: 80,
      };

      mockPrisma.advancedPersonality.findUnique.mockResolvedValue(mockPersonality as any);
      mockPrisma.advancedPersonality.update.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.adaptPersonality(1, performanceData);

      expect(result).toBeDefined();
      expect(mockPrisma.advancedPersonality.update).toHaveBeenCalled();
    });

    it('should not adapt personality when dynamic adaptation is disabled', async () => {
      const mockPersonality = {
        id: 1,
        siteId: 1,
        dynamicAdaptation: false,
        basePersonality: { tone: 'professional' },
      };

      mockPrisma.advancedPersonality.findUnique.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.adaptPersonality(1, {
        contentQualityScore: 75,
        audienceEngagement: 65,
        culturalRelevance: 85,
        consistencyScore: 80,
      });

      expect(result).toBeNull();
    });
  });

  describe('Cultural Adaptation', () => {
    it('should adapt cultural context', async () => {
      const mockPersonality = {
        id: 1,
        siteId: 1,
        culturalContext: { region: 'Global', language: 'en' },
      };

      const culturalData = {
        region: 'Middle East',
        language: 'ar',
        culturalNorms: ['respect', 'hospitality'],
        localPreferences: { formality: 'high' },
      };

      mockPrisma.advancedPersonality.findUnique.mockResolvedValue(mockPersonality as any);
      mockPrisma.advancedPersonality.update.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.adaptCulturalContext(1, culturalData);

      expect(result).toBeDefined();
      expect(mockPrisma.advancedPersonality.update).toHaveBeenCalledWith({
        where: { siteId: 1 },
        data: {
          culturalContext: {
            ...mockPersonality.culturalContext,
            ...culturalData,
            lastUpdated: expect.any(String),
          },
        },
      });
    });
  });

  describe('Audience Targeting', () => {
    it('should update audience targeting', async () => {
      const mockPersonality = {
        id: 1,
        siteId: 1,
        audienceSegments: [],
      };

      const audienceData = {
        segments: [
          { segment: 'security_professionals', targeting: true, customization: {} },
          { segment: 'it_managers', targeting: true, customization: {} },
        ],
      };

      mockPrisma.advancedPersonality.findUnique.mockResolvedValue(mockPersonality as any);
      mockPrisma.advancedPersonality.update.mockResolvedValue(mockPersonality as any);

      const result = await personalityService.updateAudienceTargeting(1, audienceData);

      expect(result).toBeDefined();
      expect(mockPrisma.advancedPersonality.update).toHaveBeenCalledWith({
        where: { siteId: 1 },
        data: {
          audienceSegments: audienceData.segments,
        },
      });
    });
  });

  describe('Helper Methods', () => {
    it('should calculate start date correctly', () => {
      const service = personalityService as any;
      
      const dayStart = service.getStartDate('day');
      const weekStart = service.getStartDate('week');
      const monthStart = service.getStartDate('month');

      expect(dayStart).toBeInstanceOf(Date);
      expect(weekStart).toBeInstanceOf(Date);
      expect(monthStart).toBeInstanceOf(Date);

      // Verify relative dates
      const now = new Date();
      expect(dayStart.getTime()).toBeLessThan(now.getTime());
      expect(weekStart.getTime()).toBeLessThan(now.getTime());
      expect(monthStart.getTime()).toBeLessThan(now.getTime());
    });

    it('should calculate trends correctly', () => {
      const service = personalityService as any;
      
      const recent = [{ contentQualityScore: 90 }, { contentQualityScore: 95 }];
      const older = [{ contentQualityScore: 80 }, { contentQualityScore: 85 }];

      const trend = service.calculateTrend(recent, older, 'contentQualityScore');
      
      expect(trend).toBeGreaterThan(0); // Should be positive trend
    });

    it('should suggest tone adaptation', () => {
      const service = personalityService as any;
      
      const suggestions = ['professional', 'conversational', 'authoritative'];
      const adaptation = service.suggestToneAdaptation('professional');
      
      expect(suggestions).toContain(adaptation);
    });

    it('should suggest expertise adaptation', () => {
      const service = personalityService as any;
      
      const currentExpertise = ['cybersecurity'];
      const adaptation = service.suggestExpertiseAdaptation(currentExpertise);
      
      expect(adaptation.length).toBeGreaterThan(currentExpertise.length);
      expect(adaptation).toContain('cybersecurity');
    });

    it('should suggest style adaptation', () => {
      const service = personalityService as any;
      
      const currentStyle = 'Technical and clear';
      const adaptation = service.suggestStyleAdaptation(currentStyle);
      
      expect(adaptation).toContain(currentStyle);
      expect(adaptation.length).toBeGreaterThan(currentStyle.length);
    });
  });
}); 