import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ABTestingService } from '@/lib/services/ab-testing';
import { 
  MarketingABTestType,
  MarketingABTestStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    marketingABTest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('ABTestingService', () => {
  let abTestingService: ABTestingService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    abTestingService = new ABTestingService();
    jest.clearAllMocks();
  });

  describe('createABTest', () => {
    it('should create a new A/B test', async () => {
      const siteId = 'site-1';
      const createdBy = 'user-1';
      const config = {
        name: 'Email Subject Line Test',
        description: 'Test different email subject lines',
        type: MarketingABTestType.EMAIL,
        variants: [
          { id: 'control', name: 'Control', content: {}, trafficAllocation: 50, isControl: true },
          { id: 'variant-a', name: 'Variant A', content: {}, trafficAllocation: 50, isControl: false },
        ],
        trafficAllocation: 100,
        minimumSampleSize: 1000,
        confidenceLevel: 0.95,
        testDuration: 7,
        primaryMetric: 'open_rate',
      };

      const mockTest = {
        id: 'test-1',
        name: config.name,
        description: config.description,
        type: config.type,
        status: MarketingABTestStatus.DRAFT,
        variants: config.variants,
        siteId,
        createdBy,
      };

      mockPrisma.marketingABTest.create.mockResolvedValue(mockTest);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await abTestingService.createABTest(siteId, config, createdBy);

      expect(mockPrisma.marketingABTest.create).toHaveBeenCalledWith({
        data: {
          name: config.name,
          description: config.description,
          type: config.type,
          status: MarketingABTestStatus.DRAFT,
          startDate: config.startDate,
          endDate: config.endDate,
          variants: config.variants,
          siteId,
          createdBy,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_created',
          value: 1,
          date: expect.any(Date),
          siteId,
          metadata: { testId: mockTest.id, type: config.type },
        },
      });

      expect(result).toEqual(mockTest);
    });

    it('should throw error for insufficient variants', async () => {
      const siteId = 'site-1';
      const createdBy = 'user-1';
      const config = {
        name: 'Invalid Test',
        type: MarketingABTestType.EMAIL,
        variants: [
          { id: 'control', name: 'Control', content: {}, trafficAllocation: 100, isControl: true },
        ],
        trafficAllocation: 100,
        minimumSampleSize: 1000,
        confidenceLevel: 0.95,
        testDuration: 7,
        primaryMetric: 'open_rate',
      };

      await expect(abTestingService.createABTest(siteId, config, createdBy))
        .rejects.toThrow('A/B test must have at least 2 variants');
    });

    it('should throw error for invalid traffic allocation', async () => {
      const siteId = 'site-1';
      const createdBy = 'user-1';
      const config = {
        name: 'Invalid Test',
        type: MarketingABTestType.EMAIL,
        variants: [
          { id: 'control', name: 'Control', content: {}, trafficAllocation: 60, isControl: true },
          { id: 'variant-a', name: 'Variant A', content: {}, trafficAllocation: 50, isControl: false },
        ],
        trafficAllocation: 100,
        minimumSampleSize: 1000,
        confidenceLevel: 0.95,
        testDuration: 7,
        primaryMetric: 'open_rate',
      };

      await expect(abTestingService.createABTest(siteId, config, createdBy))
        .rejects.toThrow('Variant traffic allocation must sum to 100%');
    });
  });

  describe('getABTests', () => {
    it('should get A/B tests for a site', async () => {
      const siteId = 'site-1';
      const mockTests = [
        {
          id: 'test-1',
          name: 'Test 1',
          type: MarketingABTestType.EMAIL,
          status: MarketingABTestStatus.ACTIVE,
          campaign: null,
          createdUser: { name: 'User 1' },
        },
        {
          id: 'test-2',
          name: 'Test 2',
          type: MarketingABTestType.CONTENT,
          status: MarketingABTestStatus.COMPLETED,
          campaign: null,
          createdUser: { name: 'User 2' },
        },
      ];

      mockPrisma.marketingABTest.findMany.mockResolvedValue(mockTests);

      const result = await abTestingService.getABTests(siteId);

      expect(mockPrisma.marketingABTest.findMany).toHaveBeenCalledWith({
        where: { siteId },
        include: {
          campaign: true,
          createdUser: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockTests);
    });

    it('should filter by status when provided', async () => {
      const siteId = 'site-1';
      const status = MarketingABTestStatus.ACTIVE;

      mockPrisma.marketingABTest.findMany.mockResolvedValue([]);

      await abTestingService.getABTests(siteId, status);

      expect(mockPrisma.marketingABTest.findMany).toHaveBeenCalledWith({
        where: { siteId, status },
        include: {
          campaign: true,
          createdUser: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getABTest', () => {
    it('should get A/B test by ID', async () => {
      const testId = 'test-1';
      const mockTest = {
        id: testId,
        name: 'Test 1',
        type: MarketingABTestType.EMAIL,
        status: MarketingABTestStatus.ACTIVE,
        campaign: null,
        createdUser: { name: 'User 1' },
      };

      mockPrisma.marketingABTest.findUnique.mockResolvedValue(mockTest);

      const result = await abTestingService.getABTest(testId);

      expect(mockPrisma.marketingABTest.findUnique).toHaveBeenCalledWith({
        where: { id: testId },
        include: {
          campaign: true,
          createdUser: true,
        },
      });

      expect(result).toEqual(mockTest);
    });

    it('should throw error for non-existent test', async () => {
      const testId = 'non-existent';

      mockPrisma.marketingABTest.findUnique.mockResolvedValue(null);

      await expect(abTestingService.getABTest(testId))
        .rejects.toThrow('A/B test not found');
    });
  });

  describe('updateABTestStatus', () => {
    it('should update A/B test status', async () => {
      const testId = 'test-1';
      const status = MarketingABTestStatus.ACTIVE;
      const mockTest = {
        id: testId,
        status,
        siteId: 'site-1',
      };

      mockPrisma.marketingABTest.update.mockResolvedValue(mockTest);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await abTestingService.updateABTestStatus(testId, status);

      expect(mockPrisma.marketingABTest.update).toHaveBeenCalledWith({
        where: { id: testId },
        data: { status },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_status_updated',
          value: 1,
          date: expect.any(Date),
          siteId: mockTest.siteId,
          metadata: { testId, status },
        },
      });

      expect(result).toEqual(mockTest);
    });
  });

  describe('recordImpression', () => {
    it('should record A/B test impression', async () => {
      const testId = 'test-1';
      const variantId = 'variant-a';
      const userId = 'user-1';

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await abTestingService.recordImpression(testId, variantId, userId);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_impression',
          value: 1,
          date: expect.any(Date),
          siteId: 'site-id',
          metadata: {
            testId,
            variantId,
            userId,
            timestamp: expect.any(Date),
          },
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('recordConversion', () => {
    it('should record A/B test conversion', async () => {
      const testId = 'test-1';
      const variantId = 'variant-a';
      const userId = 'user-1';
      const revenue = 100;

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await abTestingService.recordConversion(testId, variantId, userId, revenue);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_conversion',
          value: revenue,
          date: expect.any(Date),
          siteId: 'site-id',
          metadata: {
            testId,
            variantId,
            userId,
            revenue,
            timestamp: expect.any(Date),
          },
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('calculateABTestResults', () => {
    it('should calculate A/B test results', async () => {
      const testId = 'test-1';
      const mockTest = {
        id: testId,
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant-a', name: 'Variant A', isControl: false },
        ],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-08'),
      };

      mockPrisma.marketingABTest.findUnique.mockResolvedValue(mockTest);

      const result = await abTestingService.calculateABTestResults(testId);

      expect(result).toHaveProperty('testId', testId);
      expect(result).toHaveProperty('variantResults');
      expect(result).toHaveProperty('overallResults');
      expect(result).toHaveProperty('statisticalAnalysis');

      expect(result.variantResults).toHaveLength(2);
      expect(result.variantResults[0]).toHaveProperty('variantId');
      expect(result.variantResults[0]).toHaveProperty('variantName');
      expect(result.variantResults[0]).toHaveProperty('impressions');
      expect(result.variantResults[0]).toHaveProperty('conversions');
      expect(result.variantResults[0]).toHaveProperty('conversionRate');
      expect(result.variantResults[0]).toHaveProperty('revenue');
      expect(result.variantResults[0]).toHaveProperty('averageOrderValue');

      expect(result.overallResults).toHaveProperty('totalImpressions');
      expect(result.overallResults).toHaveProperty('totalConversions');
      expect(result.overallResults).toHaveProperty('overallConversionRate');
      expect(result.overallResults).toHaveProperty('totalRevenue');
      expect(result.overallResults).toHaveProperty('testDuration');
      expect(result.overallResults).toHaveProperty('isSignificant');
      expect(result.overallResults).toHaveProperty('winner');
      expect(result.overallResults).toHaveProperty('confidence');
      expect(result.overallResults).toHaveProperty('recommendation');

      expect(result.statisticalAnalysis).toHaveProperty('pValue');
      expect(result.statisticalAnalysis).toHaveProperty('confidenceInterval');
      expect(result.statisticalAnalysis).toHaveProperty('effectSize');
      expect(result.statisticalAnalysis).toHaveProperty('power');
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should calculate statistical significance', async () => {
      const controlVariant = {
        conversions: 50,
        impressions: 1000,
        conversionRate: 5.0,
      };
      const testVariant = {
        conversions: 60,
        impressions: 1000,
        conversionRate: 6.0,
      };

      const result = await abTestingService.calculateStatisticalSignificance(controlVariant, testVariant);

      expect(result).toHaveProperty('significant');
      expect(result).toHaveProperty('pValue');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('confidenceInterval');
      expect(result).toHaveProperty('effectSize');
      expect(result).toHaveProperty('power');

      expect(typeof result.significant).toBe('boolean');
      expect(typeof result.pValue).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.confidenceInterval)).toBe(true);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(typeof result.effectSize).toBe('number');
      expect(typeof result.power).toBe('number');
    });

    it('should identify significant differences', async () => {
      const controlVariant = {
        conversions: 10,
        impressions: 100,
        conversionRate: 10.0,
      };
      const testVariant = {
        conversions: 30,
        impressions: 100,
        conversionRate: 30.0,
      };

      const result = await abTestingService.calculateStatisticalSignificance(controlVariant, testVariant);

      expect(result.significant).toBe(true);
      expect(result.confidence).toBeGreaterThan(95);
    });

    it('should handle no significant differences', async () => {
      const controlVariant = {
        conversions: 50,
        impressions: 1000,
        conversionRate: 5.0,
      };
      const testVariant = {
        conversions: 52,
        impressions: 1000,
        conversionRate: 5.2,
      };

      const result = await abTestingService.calculateStatisticalSignificance(controlVariant, testVariant);

      expect(result.significant).toBe(false);
      expect(result.confidence).toBeLessThan(95);
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should generate optimization recommendations', async () => {
      const testId = 'test-1';
      const mockTest = {
        id: testId,
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant-a', name: 'Variant A', isControl: false },
        ],
      };

      mockPrisma.marketingABTest.findUnique.mockResolvedValue(mockTest);

      const result = await abTestingService.generateOptimizationRecommendations(testId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((recommendation) => {
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('impact');
        expect(recommendation).toHaveProperty('effort');
        expect(recommendation).toHaveProperty('reasoning');

        expect(['test_extension', 'sample_size_increase', 'variant_optimization', 'test_termination'])
          .toContain(recommendation.type);
        expect(['high', 'medium', 'low']).toContain(recommendation.priority);
        expect(typeof recommendation.impact).toBe('number');
        expect(typeof recommendation.effort).toBe('number');
      });
    });
  });

  describe('createABTestTemplate', () => {
    it('should create A/B test template', async () => {
      const template = {
        name: 'Custom Template',
        description: 'A custom A/B test template',
        type: MarketingABTestType.EMAIL,
        defaultConfig: { minimumSampleSize: 1000 },
        bestPractices: ['Best practice 1'],
        commonMetrics: ['open_rate'],
        estimatedDuration: 7,
        successCriteria: ['95% confidence'],
      };

      const result = await abTestingService.createABTestTemplate(template);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', template.name);
      expect(result).toHaveProperty('description', template.description);
      expect(result).toHaveProperty('type', template.type);
      expect(result).toHaveProperty('defaultConfig', template.defaultConfig);
      expect(result).toHaveProperty('bestPractices', template.bestPractices);
      expect(result).toHaveProperty('commonMetrics', template.commonMetrics);
      expect(result).toHaveProperty('estimatedDuration', template.estimatedDuration);
      expect(result).toHaveProperty('successCriteria', template.successCriteria);
    });
  });

  describe('getABTestTemplates', () => {
    it('should get A/B test templates', async () => {
      const result = await abTestingService.getABTestTemplates();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('defaultConfig');
        expect(template).toHaveProperty('bestPractices');
        expect(template).toHaveProperty('commonMetrics');
        expect(template).toHaveProperty('estimatedDuration');
        expect(template).toHaveProperty('successCriteria');

        expect(Array.isArray(template.bestPractices)).toBe(true);
        expect(Array.isArray(template.commonMetrics)).toBe(true);
        expect(Array.isArray(template.successCriteria)).toBe(true);
        expect(typeof template.estimatedDuration).toBe('number');
      });
    });
  });

  describe('createABTestWorkflow', () => {
    it('should create A/B test workflow', async () => {
      const workflow = {
        name: 'Test Workflow',
        description: 'A test workflow',
        triggers: ['manual'],
        actions: [
          { type: 'test_creation', parameters: {} },
        ],
        isActive: true,
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await abTestingService.createABTestWorkflow(workflow);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', workflow.name);
      expect(result).toHaveProperty('description', workflow.description);
      expect(result).toHaveProperty('triggers', workflow.triggers);
      expect(result).toHaveProperty('actions', workflow.actions);
      expect(result).toHaveProperty('isActive', workflow.isActive);
      expect(result).toHaveProperty('siteId', workflow.siteId);
      expect(result).toHaveProperty('createdBy', workflow.createdBy);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_workflow_created',
          value: 1,
          date: expect.any(Date),
          siteId: workflow.siteId,
          metadata: { workflowId: result.id },
        },
      });
    });
  });

  describe('executeABTestWorkflow', () => {
    it('should execute A/B test workflow', async () => {
      const workflowId = 'workflow-1';
      const siteId = 'site-1';

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await abTestingService.executeABTestWorkflow(workflowId, siteId);

      expect(result).toHaveProperty('workflowId', workflowId);
      expect(result).toHaveProperty('siteId', siteId);
      expect(result).toHaveProperty('status', 'executed');
      expect(result).toHaveProperty('actions');
      expect(Array.isArray(result.actions)).toBe(true);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_workflow_executed',
          value: 1,
          date: expect.any(Date),
          siteId,
          metadata: { workflowId, result },
        },
      });
    });
  });

  describe('private methods', () => {
    it('should generate recommendation correctly', () => {
      const service = abTestingService as any;
      
      const significantAnalysis = { significant: true, confidence: 95 };
      const insignificantAnalysis = { significant: false, power: 0.6 };
      const lowPowerAnalysis = { significant: false, power: 0.3 };
      
      const variantResults = [
        { variantName: 'Control', conversionRate: 5.0 },
        { variantName: 'Variant A', conversionRate: 6.0 },
      ];

      const significantRecommendation = service.generateRecommendation(significantAnalysis, variantResults);
      const insignificantRecommendation = service.generateRecommendation(insignificantAnalysis, variantResults);
      const lowPowerRecommendation = service.generateRecommendation(lowPowerAnalysis, variantResults);

      expect(significantRecommendation).toContain('Declare');
      expect(significantRecommendation).toContain('winner');
      expect(insignificantRecommendation).toContain('Continue test');
      expect(lowPowerRecommendation).toContain('increase statistical power');
    });

    it('should calculate power correctly', () => {
      const service = abTestingService as any;
      
      const power = service.calculatePower(0.05, 0.06, 1000, 1000);
      expect(typeof power).toBe('number');
      expect(power).toBeGreaterThan(0);
      expect(power).toBeLessThanOrEqual(1);
    });

    it('should calculate normal CDF correctly', () => {
      const service = abTestingService as any;
      
      expect(service.normalCDF(0)).toBeCloseTo(0.5, 2);
      expect(service.normalCDF(1)).toBeCloseTo(0.841, 2);
      expect(service.normalCDF(-1)).toBeCloseTo(0.159, 2);
    });

    it('should calculate error function correctly', () => {
      const service = abTestingService as any;
      
      expect(service.erf(0)).toBeCloseTo(0, 2);
      expect(service.erf(1)).toBeCloseTo(0.843, 2);
      expect(service.erf(-1)).toBeCloseTo(-0.843, 2);
    });
  });
}); 