import { PredictiveAnalyticsService } from '@/lib/services/ai/predictive-analytics';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userBehaviorEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mLModel: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userPrediction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    contentRecommendation: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    aBTest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    aBTestAssignment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    personalizationRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    analyticsDashboard: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Predictive Analytics Service', () => {
  let analyticsService: PredictiveAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = PredictiveAnalyticsService.getInstance();
  });

  describe('User Behavior Tracking', () => {
    it('should track user behavior event', async () => {
      const eventData = {
        siteId: 1,
        sessionId: 'test-session-123',
        eventType: 'page_view',
        eventCategory: 'navigation',
        eventAction: 'view',
        pageUrl: '/test-page',
        pageTitle: 'Test Page',
        contentId: 'article-123',
        contentType: 'article',
        timeOnPage: 120,
        scrollDepth: 75,
        interactionCount: 3,
        properties: { referrer: 'google.com' },
        consentGiven: true,
      };

      const mockEvent = { id: 1, ...eventData, createdAt: new Date() };
      mockPrisma.userBehaviorEvent.create.mockResolvedValue(mockEvent as any);

      const result = await analyticsService.trackUserBehavior(eventData);

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.userBehaviorEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...eventData,
          dataRetention: expect.any(Date),
        }),
        include: {
          site: true,
          user: true,
        },
      });
    });

    it('should anonymize data for users without consent', async () => {
      const eventData = {
        siteId: 1,
        sessionId: 'test-session-123',
        eventType: 'page_view',
        eventCategory: 'navigation',
        eventAction: 'view',
        pageUrl: '/test-page',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: { country: 'US' },
        properties: {},
        consentGiven: false,
      };

      const mockEvent = { id: 1, ...eventData, createdAt: new Date() };
      mockPrisma.userBehaviorEvent.create.mockResolvedValue(mockEvent as any);

      await analyticsService.trackUserBehavior(eventData);

      expect(mockPrisma.userBehaviorEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          location: undefined,
        }),
        include: {
          site: true,
          user: true,
        },
      });
    });

    it('should get user behavior events with filters', async () => {
      const mockEvents = [
        { id: 1, eventType: 'page_view', pageUrl: '/test' },
        { id: 2, eventType: 'click', pageUrl: '/test' },
      ];
      mockPrisma.userBehaviorEvent.findMany.mockResolvedValue(mockEvents as any);

      const result = await analyticsService.getUserBehaviorEvents(1, {
        userId: 'user-123',
        eventType: 'page_view',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 50,
      });

      expect(result).toEqual(mockEvents);
      expect(mockPrisma.userBehaviorEvent.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 1,
          userId: 'user-123',
          eventType: 'page_view',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          site: true,
          user: true,
        },
      });
    });
  });

  describe('User Profile Management', () => {
    it('should create user profile', async () => {
      const profileData = {
        userId: 'user-123',
        siteId: 1,
        age: 25,
        gender: 'female',
        language: 'en',
        interests: { technology: 0.8, sports: 0.6 },
        contentPreferences: { articles: 0.9, videos: 0.7 },
        readingLevel: 'intermediate',
        topicsOfInterest: ['AI', 'cybersecurity'],
        activityLevel: 'high',
        personalizationEnabled: true,
        recommendationSettings: { frequency: 'daily' },
        privacySettings: { dataSharing: false },
      };

      const mockProfile = { id: 1, ...profileData, createdAt: new Date() };
      mockPrisma.userProfile.create.mockResolvedValue(mockProfile as any);

      const result = await analyticsService.createUserProfile(profileData);

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: profileData,
        include: {
          user: true,
          site: true,
        },
      });
    });

    it('should get user profile', async () => {
      const mockProfile = {
        id: 1,
        userId: 'user-123',
        siteId: 1,
        interests: { technology: 0.8 },
        contentPreferences: { articles: 0.9 },
        topicsOfInterest: ['AI'],
        recommendationSettings: { frequency: 'daily' },
        privacySettings: { dataSharing: false },
      };
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile as any);

      const result = await analyticsService.getUserProfile('user-123', 1);

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          user: true,
          site: true,
        },
      });
    });

    it('should update user profile', async () => {
      const updateData = {
        interests: { technology: 0.9, sports: 0.7 },
        activityLevel: 'medium',
      };

      const mockProfile = { id: 1, userId: 'user-123', ...updateData };
      mockPrisma.userProfile.update.mockResolvedValue(mockProfile as any);

      const result = await analyticsService.updateUserProfile('user-123', updateData);

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: updateData,
        include: {
          user: true,
          site: true,
        },
      });
    });
  });

  describe('ML Model Management', () => {
    it('should create ML model', async () => {
      const modelData = {
        siteId: 1,
        modelName: 'user_churn_predictor',
        modelType: 'classification',
        modelVersion: '1.0.0',
        modelDescription: 'Predicts user churn probability',
        algorithm: 'random_forest',
        hyperparameters: { n_estimators: 100, max_depth: 10 },
        featureColumns: { age: 'numeric', activity_level: 'categorical' },
        targetColumn: 'churn',
        trainingDataSize: 10000,
        trainingAccuracy: 0.89,
        validationAccuracy: 0.87,
        testAccuracy: 0.86,
        precision: 0.88,
        recall: 0.85,
        f1Score: 0.86,
        auc: 0.91,
        modelPath: '/models/churn_predictor_v1.pkl',
        modelSize: 1024000,
        modelHash: 'abc123def456',
        status: 'training',
        isActive: false,
      };

      const mockModel = { id: 1, ...modelData, createdAt: new Date() };
      mockPrisma.mLModel.create.mockResolvedValue(mockModel as any);

      const result = await analyticsService.createMLModel(modelData);

      expect(result).toEqual(mockModel);
      expect(mockPrisma.mLModel.create).toHaveBeenCalledWith({
        data: modelData,
        include: {
          site: true,
        },
      });
    });

    it('should get ML models with filters', async () => {
      const mockModels = [
        { id: 1, modelName: 'churn_predictor', modelType: 'classification' },
        { id: 2, modelName: 'engagement_predictor', modelType: 'regression' },
      ];
      mockPrisma.mLModel.findMany.mockResolvedValue(mockModels as any);

      const result = await analyticsService.getMLModels(1, 'classification', 'active');

      expect(result).toEqual(mockModels);
      expect(mockPrisma.mLModel.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 1,
          modelType: 'classification',
          status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          site: true,
        },
      });
    });

    it('should get active ML model', async () => {
      const mockModel = {
        id: 1,
        modelName: 'churn_predictor',
        modelType: 'classification',
        isActive: true,
        status: 'active',
      };
      mockPrisma.mLModel.findFirst.mockResolvedValue(mockModel as any);

      const result = await analyticsService.getActiveMLModel(1, 'churn_predictor');

      expect(result).toEqual(mockModel);
      expect(mockPrisma.mLModel.findFirst).toHaveBeenCalledWith({
        where: {
          siteId: 1,
          modelName: 'churn_predictor',
          isActive: true,
          status: 'active',
        },
        include: {
          site: true,
        },
      });
    });

    it('should update ML model', async () => {
      const updateData = {
        status: 'active',
        isActive: true,
        deployedAt: new Date(),
      };

      const mockModel = { id: 1, ...updateData };
      mockPrisma.mLModel.update.mockResolvedValue(mockModel as any);

      const result = await analyticsService.updateMLModel(1, updateData);

      expect(result).toEqual(mockModel);
      expect(mockPrisma.mLModel.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        include: {
          site: true,
        },
      });
    });
  });

  describe('User Predictions', () => {
    it('should create user prediction', async () => {
      const predictionData = {
        userId: 'user-123',
        siteId: 1,
        modelId: 1,
        predictionType: 'churn',
        predictionValue: 0.75,
        predictionConfidence: 0.89,
        predictionClass: 'high_risk',
        inputFeatures: { age: 25, activity_level: 'low', last_login: 30 },
        featureImportance: { activity_level: 0.6, last_login: 0.3, age: 0.1 },
        context: { user_segment: 'premium' },
        triggerEvent: 'login_attempt',
        usedInPersonalization: true,
        usedInRecommendation: false,
        usedInOptimization: true,
      };

      const mockPrediction = { id: 1, ...predictionData, createdAt: new Date() };
      mockPrisma.userPrediction.create.mockResolvedValue(mockPrediction as any);

      const result = await analyticsService.createUserPrediction(predictionData);

      expect(result).toEqual(mockPrediction);
      expect(mockPrisma.userPrediction.create).toHaveBeenCalledWith({
        data: predictionData,
        include: {
          user: true,
          site: true,
          model: true,
        },
      });
    });

    it('should get user predictions', async () => {
      const mockPredictions = [
        { id: 1, predictionType: 'churn', predictionValue: 0.75 },
        { id: 2, predictionType: 'engagement', predictionValue: 0.85 },
      ];
      mockPrisma.userPrediction.findMany.mockResolvedValue(mockPredictions as any);

      const result = await analyticsService.getUserPredictions('user-123', 1, 'churn');

      expect(result).toEqual(mockPredictions);
      expect(mockPrisma.userPrediction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          siteId: 1,
          predictionType: 'churn',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          model: true,
        },
      });
    });

    it('should get latest prediction', async () => {
      const mockPrediction = {
        id: 1,
        predictionType: 'churn',
        predictionValue: 0.75,
        predictionConfidence: 0.89,
      };
      mockPrisma.userPrediction.findFirst.mockResolvedValue(mockPrediction as any);

      const result = await analyticsService.getLatestPrediction('user-123', 1, 'churn');

      expect(result).toEqual(mockPrediction);
      expect(mockPrisma.userPrediction.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          siteId: 1,
          predictionType: 'churn',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          model: true,
        },
      });
    });
  });

  describe('Content Recommendations', () => {
    it('should create content recommendation', async () => {
      const recommendationData = {
        userId: 'user-123',
        siteId: 1,
        contentId: 'article-456',
        contentType: 'article',
        recommendationType: 'collaborative',
        recommendationScore: 0.92,
        algorithm: 'collaborative_filtering',
        modelVersion: '1.0.0',
        features: { user_interests: ['AI', 'cybersecurity'], content_tags: ['AI', 'ML'] },
        context: { user_segment: 'tech_enthusiast' },
        triggerEvent: 'article_view',
        isShown: false,
        isClicked: false,
        isEngaged: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isExpired: false,
      };

      const mockRecommendation = { id: 1, ...recommendationData, createdAt: new Date() };
      mockPrisma.contentRecommendation.create.mockResolvedValue(mockRecommendation as any);

      const result = await analyticsService.createContentRecommendation(recommendationData);

      expect(result).toEqual(mockRecommendation);
      expect(mockPrisma.contentRecommendation.create).toHaveBeenCalledWith({
        data: recommendationData,
        include: {
          user: true,
          site: true,
        },
      });
    });

    it('should get content recommendations', async () => {
      const mockRecommendations = [
        { id: 1, contentId: 'article-1', recommendationScore: 0.95 },
        { id: 2, contentId: 'article-2', recommendationScore: 0.88 },
      ];
      mockPrisma.contentRecommendation.findMany.mockResolvedValue(mockRecommendations as any);

      const result = await analyticsService.getContentRecommendations('user-123', 1, 5);

      expect(result).toEqual(mockRecommendations);
      expect(mockPrisma.contentRecommendation.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          siteId: 1,
          isExpired: false,
        },
        orderBy: { recommendationScore: 'desc' },
        take: 5,
        include: {
          user: true,
          site: true,
        },
      });
    });

    it('should update recommendation interaction', async () => {
      const interaction = {
        isShown: true,
        isClicked: true,
        isEngaged: true,
        timeSpent: 180,
      };

      const mockRecommendation = { id: 1, ...interaction, shownAt: new Date(), clickedAt: new Date() };
      mockPrisma.contentRecommendation.update.mockResolvedValue(mockRecommendation as any);

      const result = await analyticsService.updateRecommendationInteraction(1, interaction);

      expect(result).toEqual(mockRecommendation);
      expect(mockPrisma.contentRecommendation.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...interaction,
          shownAt: expect.any(Date),
          clickedAt: expect.any(Date),
        },
        include: {
          user: true,
          site: true,
        },
      });
    });
  });

  describe('A/B Testing', () => {
    it('should create A/B test', async () => {
      const testData = {
        siteId: 1,
        testName: 'homepage_layout_test',
        testDescription: 'Testing different homepage layouts',
        testType: 'layout',
        testHypothesis: 'New layout will increase conversion rate by 15%',
        variants: {
          control: { layout: 'original', color_scheme: 'blue' },
          variant_a: { layout: 'new', color_scheme: 'green' },
          variant_b: { layout: 'new', color_scheme: 'purple' },
        },
        controlVariant: 'control',
        treatmentVariants: ['variant_a', 'variant_b'],
        trafficAllocation: { control: 0.5, variant_a: 0.25, variant_b: 0.25 },
        targetAudience: { user_segment: 'all', device_type: 'desktop' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
        isPaused: false,
        primaryMetric: 'conversion_rate',
        secondaryMetrics: { click_through_rate: 0.05, time_on_page: 120 },
        conversionGoals: { signup: 1, purchase: 10 },
        significanceLevel: 0.05,
        statisticalPower: 0.8,
        minimumSampleSize: 1000,
        currentSampleSize: 0,
        statisticalSignificance: false,
        totalConversions: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };

      const mockTest = { id: 1, ...testData, createdAt: new Date() };
      mockPrisma.aBTest.create.mockResolvedValue(mockTest as any);

      const result = await analyticsService.createABTest(testData);

      expect(result).toEqual(mockTest);
      expect(mockPrisma.aBTest.create).toHaveBeenCalledWith({
        data: testData,
        include: {
          site: true,
        },
      });
    });

    it('should get A/B tests', async () => {
      const mockTests = [
        { id: 1, testName: 'layout_test', isActive: true },
        { id: 2, testName: 'content_test', isActive: false },
      ];
      mockPrisma.aBTest.findMany.mockResolvedValue(mockTests as any);

      const result = await analyticsService.getABTests(1, 'active');

      expect(result).toEqual(mockTests);
      expect(mockPrisma.aBTest.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 1,
          status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          site: true,
          abTestAssignments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    it('should assign user to A/B test', async () => {
      const mockTest = {
        id: 1,
        isActive: true,
        variants: { control: {}, variant_a: {}, variant_b: {} },
        trafficAllocation: { control: 0.5, variant_a: 0.25, variant_b: 0.25 },
      };
      mockPrisma.aBTest.findUnique.mockResolvedValue(mockTest as any);

      const mockAssignment = {
        id: 1,
        testId: 1,
        userId: 'user-123',
        siteId: 1,
        assignedVariant: 'variant_a',
        assignmentMethod: 'user_id_hash',
        assignmentHash: 'abc123',
      };
      mockPrisma.aBTestAssignment.create.mockResolvedValue(mockAssignment as any);

      const result = await analyticsService.assignUserToABTest(1, 'user-123', 1);

      expect(result).toEqual(mockAssignment);
      expect(mockPrisma.aBTestAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          testId: 1,
          userId: 'user-123',
          siteId: 1,
          assignedVariant: expect.any(String),
          assignmentMethod: 'user_id_hash',
          assignmentHash: expect.any(String),
        }),
        include: {
          test: true,
          user: true,
          site: true,
        },
      });
    });

    it('should record A/B test interaction', async () => {
      const mockAssignment = {
        id: 1,
        testId: 1,
        userId: 'user-123',
        siteId: 1,
        assignedVariant: 'variant_a',
        isExposed: false,
        exposureCount: 0,
        interactions: [],
        conversions: [],
        revenue: 0,
      };
      mockPrisma.aBTestAssignment.findUnique.mockResolvedValue(mockAssignment as any);

      const mockUpdatedAssignment = {
        ...mockAssignment,
        isExposed: true,
        lastExposureAt: new Date(),
        exposureCount: 1,
        interactions: [{ timestamp: new Date(), eventType: 'click', eventData: {} }],
      };
      mockPrisma.aBTestAssignment.update.mockResolvedValue(mockUpdatedAssignment as any);

      const result = await analyticsService.recordABTestInteraction(1, 'user-123', {
        eventType: 'click',
        eventData: { button: 'cta' },
        conversion: false,
        revenue: 0,
      });

      expect(result).toEqual(mockUpdatedAssignment);
      expect(mockPrisma.aBTestAssignment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          isExposed: true,
          lastExposureAt: expect.any(Date),
          exposureCount: { increment: 1 },
          interactions: {
            push: {
              timestamp: expect.any(Date),
              eventType: 'click',
              eventData: { button: 'cta' },
            },
          },
        }),
        include: {
          test: true,
          user: true,
          site: true,
        },
      });
    });
  });

  describe('Personalization Rules', () => {
    it('should create personalization rule', async () => {
      const ruleData = {
        siteId: 1,
        ruleName: 'high_value_user_content',
        ruleDescription: 'Show premium content to high-value users',
        ruleType: 'content',
        ruleCategory: 'targeting',
        conditions: {
          user_segment: 'premium',
          activity_level: 'high',
          last_purchase: { days_ago: { lte: 30 } },
        },
        targetAudience: { user_segment: 'premium' },
        contentFilters: { content_type: 'premium', category: 'technology' },
        actions: {
          content_priority: 'high',
          recommendation_boost: 1.5,
          personalization_level: 'advanced',
        },
        priority: 10,
        isActive: true,
        isEnabled: true,
        matchCount: 0,
        actionCount: 0,
        successRate: 0,
      };

      const mockRule = { id: 1, ...ruleData, createdAt: new Date() };
      mockPrisma.personalizationRule.create.mockResolvedValue(mockRule as any);

      const result = await analyticsService.createPersonalizationRule(ruleData);

      expect(result).toEqual(mockRule);
      expect(mockPrisma.personalizationRule.create).toHaveBeenCalledWith({
        data: ruleData,
        include: {
          site: true,
        },
      });
    });

    it('should get personalization rules', async () => {
      const mockRules = [
        { id: 1, ruleName: 'premium_content', ruleType: 'content' },
        { id: 2, ruleName: 'new_user_welcome', ruleType: 'engagement' },
      ];
      mockPrisma.personalizationRule.findMany.mockResolvedValue(mockRules as any);

      const result = await analyticsService.getPersonalizationRules(1, 'content', true);

      expect(result).toEqual(mockRules);
      expect(mockPrisma.personalizationRule.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 1,
          ruleType: 'content',
          isActive: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          site: true,
        },
      });
    });

    it('should evaluate personalization rules', async () => {
      const mockRules = [
        {
          id: 1,
          ruleName: 'premium_content',
          conditions: { user_segment: 'premium' },
          actions: { content_priority: 'high' },
          priority: 10,
        },
        {
          id: 2,
          ruleName: 'new_user_welcome',
          conditions: { user_type: 'new' },
          actions: { show_welcome: true },
          priority: 5,
        },
      ];
      mockPrisma.personalizationRule.findMany.mockResolvedValue(mockRules as any);

      const mockProfile = {
        id: 1,
        userId: 'user-123',
        interests: { technology: 0.8 },
        contentPreferences: { articles: 0.9 },
      };
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile as any);

      const result = await analyticsService.evaluatePersonalizationRules('user-123', 1, {
        user_segment: 'premium',
        user_type: 'new',
      });

      expect(result).toHaveLength(2);
      expect(result[0].rule.ruleName).toBe('premium_content');
      expect(result[0].priority).toBe(10);
    });
  });

  describe('Analytics Insights', () => {
    it('should get analytics insights', async () => {
      const timeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      // Mock the private methods by spying on them
      const mockInsights = {
        totalEvents: 15000,
        uniqueUsers: 5000,
        topContent: [
          { contentId: 'article-1', viewCount: 1200 },
          { contentId: 'article-2', viewCount: 980 },
        ],
        userEngagement: {
          averageTimeOnPage: 180,
          averageScrollDepth: 65,
          averageInteractions: 3.2,
        },
        conversionRates: {
          totalEvents: 15000,
          conversionEvents: 750,
          conversionRate: 0.05,
        },
        insights: 'User engagement is strong with an average time on page of 3 minutes.',
      };

      // Mock the AI service response
      const mockAIService = {
        generateContent: jest.fn().mockResolvedValue({
          content: mockInsights.insights,
        }),
      };

      // Mock the private methods
      jest.spyOn(analyticsService as any, 'getTotalEvents').mockResolvedValue(mockInsights.totalEvents);
      jest.spyOn(analyticsService as any, 'getUniqueUsers').mockResolvedValue(mockInsights.uniqueUsers);
      jest.spyOn(analyticsService as any, 'getTopContent').mockResolvedValue(mockInsights.topContent);
      jest.spyOn(analyticsService as any, 'getUserEngagement').mockResolvedValue(mockInsights.userEngagement);
      jest.spyOn(analyticsService as any, 'getConversionRates').mockResolvedValue(mockInsights.conversionRates);
      jest.spyOn(analyticsService as any, 'generateInsights').mockResolvedValue(mockInsights.insights);

      const result = await analyticsService.getAnalyticsInsights(1, timeRange);

      expect(result).toEqual(mockInsights);
      expect(result.totalEvents).toBe(15000);
      expect(result.uniqueUsers).toBe(5000);
      expect(result.conversionRates.conversionRate).toBe(0.05);
      expect(result.insights).toBe(mockInsights.insights);
    });
  });

  describe('Helper Methods', () => {
    it('should generate assignment hash consistently', () => {
      const userId = 'user-123';
      const testId = 1;
      
      const hash1 = (analyticsService as any).generateAssignmentHash(userId, testId);
      const hash2 = (analyticsService as any).generateAssignmentHash(userId, testId);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should assign variants based on hash', () => {
      const variants = { control: {}, variant_a: {}, variant_b: {} };
      const trafficAllocation = { control: 0.5, variant_a: 0.25, variant_b: 0.25 };
      const userId = 'user-123';
      
      const variant = (analyticsService as any).assignVariant(variants, trafficAllocation, userId);
      
      expect(Object.keys(variants)).toContain(variant);
    });
  });
}); 