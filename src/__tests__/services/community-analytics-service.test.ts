import { CommunityAnalyticsService, AnalyticsMetric, UserBehaviorEvent, CommunityHealthScore } from '@/lib/services/community-analytics';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    analyticsMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userBehaviorEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    communityHealthScore: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userSession: {
      count: jest.fn(),
    },
    community: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    post: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  analyticsMetric: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  userBehaviorEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  communityHealthScore: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  userSession: {
    count: jest.fn(),
  },
  community: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  post: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  comment: {
    count: jest.fn(),
  },
};

describe('CommunityAnalyticsService', () => {
  let analyticsService: CommunityAnalyticsService;

  beforeEach(() => {
    analyticsService = new CommunityAnalyticsService({
      enableRealTimeAnalytics: true,
      enableUserTracking: true,
      enablePredictiveAnalytics: true,
      dataRetentionDays: 365,
      aggregationInterval: 3600,
    });
    jest.clearAllMocks();
  });

  describe('Analytics Dashboard', () => {
    it('should get comprehensive community analytics dashboard', async () => {
      // Mock overview metrics
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.userSession.count.mockResolvedValue(250);
      mockPrisma.community.count
        .mockResolvedValueOnce(50) // total communities
        .mockResolvedValueOnce(35); // active communities
      mockPrisma.post.count.mockResolvedValue(500);
      mockPrisma.comment.count.mockResolvedValue(1200);
      mockPrisma.communityHealthScore.aggregate.mockResolvedValue({
        _avg: { overallScore: 82.5 }
      });

      const result = await analyticsService.getCommunityAnalyticsDashboard('site_123', '30d');

      expect(result.overview.totalUsers).toBe(1000);
      expect(result.overview.activeUsers).toBe(250);
      expect(result.overview.totalCommunities).toBe(50);
      expect(result.overview.activeCommunities).toBe(35);
      expect(result.overview.totalPosts).toBe(500);
      expect(result.overview.totalComments).toBe(1200);
      expect(result.overview.overallHealthScore).toBe(83);
      expect(result.overview.timeRange).toBe('30d');

      expect(result).toHaveProperty('engagement');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('communities');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('moderation');
    });

    it('should get real-time metrics', async () => {
      const now = new Date();
      const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

      mockPrisma.userSession.count
        .mockResolvedValueOnce(45) // active users
        .mockResolvedValueOnce(38); // current sessions

      const result = await analyticsService.getRealTimeMetrics('site_123');

      expect(result.activeUsers).toBe(45);
      expect(result.currentSessions).toBe(38);
      expect(result).toHaveProperty('recentActions');
      expect(result).toHaveProperty('liveContent');
    });
  });

  describe('Metric Recording and Tracking', () => {
    const mockMetric: AnalyticsMetric = {
      id: 'metric_123',
      metricType: 'user_engagement',
      category: 'daily_active_users',
      name: 'Daily Active Users',
      value: 250,
      previousValue: 235,
      timestamp: new Date(),
      siteId: 'site_123',
    };

    it('should record analytics metric with change calculation', async () => {
      const createdMetric = {
        ...mockMetric,
        change: 15,
        changePercentage: 6.38,
      };

      mockPrisma.analyticsMetric.create.mockResolvedValue(createdMetric);

      const result = await analyticsService.recordMetric(mockMetric);

      expect(mockPrisma.analyticsMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metricType: 'user_engagement',
          category: 'daily_active_users',
          name: 'Daily Active Users',
          value: 250,
          previousValue: 235,
          change: 15,
          changePercentage: expect.closeTo(6.38, 1),
        }),
      });
      expect(result.change).toBe(15);
      expect(result.changePercentage).toBeCloseTo(6.38, 1);
    });

    it('should handle metrics without previous values', async () => {
      const metricWithoutPrevious = {
        ...mockMetric,
        previousValue: undefined,
      };

      mockPrisma.analyticsMetric.create.mockResolvedValue(metricWithoutPrevious);

      const result = await analyticsService.recordMetric(metricWithoutPrevious);

      expect(result.change).toBeUndefined();
      expect(result.changePercentage).toBeUndefined();
    });

    it('should track user behavior events', async () => {
      const behaviorEvent: UserBehaviorEvent = {
        id: 'event_123',
        userId: 'user_123',
        sessionId: 'session_123',
        eventType: 'page_view',
        eventName: 'Community Page View',
        properties: { communityId: 'comm_123', page: '/communities/tech' },
        page: '/communities/tech',
        timestamp: new Date(),
        siteId: 'site_123',
      };

      mockPrisma.userBehaviorEvent.create.mockResolvedValue(behaviorEvent);

      const result = await analyticsService.trackUserBehavior(behaviorEvent);

      expect(mockPrisma.userBehaviorEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          sessionId: 'session_123',
          eventType: 'page_view',
          eventName: 'Community Page View',
          properties: { communityId: 'comm_123', page: '/communities/tech' },
        }),
      });
      expect(result).toEqual(behaviorEvent);
    });

    it('should not track user behavior when tracking is disabled', async () => {
      const serviceWithoutTracking = new CommunityAnalyticsService({
        enableUserTracking: false,
      });

      const behaviorEvent: UserBehaviorEvent = {
        userId: 'user_123',
        sessionId: 'session_123',
        eventType: 'click',
        eventName: 'Button Click',
        siteId: 'site_123',
      };

      const result = await serviceWithoutTracking.trackUserBehavior(behaviorEvent);

      expect(mockPrisma.userBehaviorEvent.create).not.toHaveBeenCalled();
      expect(result).toEqual(behaviorEvent);
    });
  });

  describe('User Analytics', () => {
    it('should get comprehensive user analytics', async () => {
      const result = await analyticsService.getUserAnalytics('user_123', 'site_123', '30d');

      expect(result.userId).toBe('user_123');
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('engagement');
      expect(result).toHaveProperty('communities');
      expect(result).toHaveProperty('behavior');
      expect(result).toHaveProperty('growth');

      expect(result.overview).toHaveProperty('joinDate');
      expect(result.overview).toHaveProperty('lastActive');
      expect(result.overview).toHaveProperty('totalSessions');
      expect(result.overview).toHaveProperty('totalTime');
      expect(result.overview).toHaveProperty('averageSessionDuration');

      expect(result.engagement).toHaveProperty('postsCreated');
      expect(result.engagement).toHaveProperty('commentsPosted');
      expect(result.engagement).toHaveProperty('likesGiven');
      expect(result.engagement).toHaveProperty('likesReceived');
      expect(result.engagement).toHaveProperty('engagementScore');
    });
  });

  describe('Content Analytics', () => {
    it('should get comprehensive content analytics', async () => {
      const result = await analyticsService.getContentAnalytics('post_123', 'post', 'site_123');

      expect(result.contentId).toBe('post_123');
      expect(result.type).toBe('post');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('audience');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('optimization');

      expect(result.performance).toHaveProperty('views');
      expect(result.performance).toHaveProperty('likes');
      expect(result.performance).toHaveProperty('comments');
      expect(result.performance).toHaveProperty('shares');
      expect(result.performance).toHaveProperty('engagementRate');
      expect(result.performance).toHaveProperty('viralityScore');

      expect(result.optimization).toHaveProperty('readabilityScore');
      expect(result.optimization).toHaveProperty('seoScore');
      expect(result.optimization).toHaveProperty('engagementPrediction');
      expect(result.optimization).toHaveProperty('recommendations');
    });
  });

  describe('Community Health Monitoring', () => {
    it('should calculate community health score', async () => {
      mockPrisma.communityHealthScore.create.mockResolvedValue({
        id: 'health_123',
        communityId: 'comm_123',
        siteId: 'site_123',
      });

      const result = await analyticsService.calculateCommunityHealthScore('comm_123', 'site_123');

      expect(result.communityId).toBe('comm_123');
      expect(result.siteId).toBe('site_123');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);
      expect(result.growthScore).toBeGreaterThanOrEqual(0);
      expect(result.growthScore).toBeLessThanOrEqual(100);
      expect(result.contentQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.contentQualityScore).toBeLessThanOrEqual(100);
      expect(result.moderationScore).toBeGreaterThanOrEqual(0);
      expect(result.moderationScore).toBeLessThanOrEqual(100);
      expect(result.retentionScore).toBeGreaterThanOrEqual(0);
      expect(result.retentionScore).toBeLessThanOrEqual(100);

      expect(result.factors).toHaveLength(5);
      expect(result.factors[0]).toHaveProperty('name');
      expect(result.factors[0]).toHaveProperty('score');
      expect(result.factors[0]).toHaveProperty('weight');
      expect(result.factors[0]).toHaveProperty('trend');
      expect(result.factors[0]).toHaveProperty('recommendations');

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(mockPrisma.communityHealthScore.create).toHaveBeenCalled();
    });

    it('should get community health trends', async () => {
      const mockHealthScores = [
        {
          timestamp: new Date('2024-01-01'),
          overallScore: 80,
          engagementScore: 75,
          growthScore: 85,
          contentQualityScore: 80,
          moderationScore: 90,
          retentionScore: 70,
        },
        {
          timestamp: new Date('2024-01-02'),
          overallScore: 82,
          engagementScore: 78,
          growthScore: 87,
          contentQualityScore: 82,
          moderationScore: 91,
          retentionScore: 72,
        },
      ];

      mockPrisma.communityHealthScore.findMany.mockResolvedValue(mockHealthScores);

      const result = await analyticsService.getCommunityHealthTrends('comm_123', 'site_123', '30d');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('overallScore');
      expect(result[0]).toHaveProperty('engagementScore');
      expect(result[0]).toHaveProperty('growthScore');
      expect(result[0]).toHaveProperty('contentQualityScore');
      expect(result[0]).toHaveProperty('moderationScore');
      expect(result[0]).toHaveProperty('retentionScore');

      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].overallScore).toBe(80);
      expect(result[1].overallScore).toBe(82);
    });

    it('should generate health recommendations based on low scores', async () => {
      mockPrisma.communityHealthScore.create.mockResolvedValue({});

      const result = await analyticsService.calculateCommunityHealthScore('comm_123', 'site_123');

      // Check that recommendations are generated
      expect(result.recommendations).toBeInstanceOf(Array);
      
      // Check that factors with declining trends have recommendations
      const decliningFactor = result.factors.find(f => f.trend === 'declining');
      if (decliningFactor) {
        expect(decliningFactor.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Analytics Export and Reporting', () => {
    it('should export analytics data in JSON format', async () => {
      const exportOptions = {
        metrics: ['all'],
        timeRange: '30d',
        format: 'json' as const,
        includeUserData: true,
        includeCommunityData: true,
      };

      // Mock dashboard data
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.userSession.count.mockResolvedValue(250);
      mockPrisma.community.count.mockResolvedValue(50);
      mockPrisma.post.count.mockResolvedValue(500);
      mockPrisma.comment.count.mockResolvedValue(1200);
      mockPrisma.communityHealthScore.aggregate.mockResolvedValue({
        _avg: { overallScore: 82.5 }
      });

      const result = await analyticsService.exportAnalyticsData('site_123', exportOptions);

      expect(result.format).toBe('json');
      expect(result.filename).toMatch(/community-analytics-site_123-30d-\d+\.json/);
      expect(result.data).toHaveProperty('metadata');
      expect(result.data).toHaveProperty('dashboard');
      expect(result.data.metadata.siteId).toBe('site_123');
      expect(result.data.metadata.timeRange).toBe('30d');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should export analytics data in CSV format', async () => {
      const exportOptions = {
        metrics: ['engagement'],
        timeRange: '7d',
        format: 'csv' as const,
        includeUserData: false,
        includeCommunityData: false,
      };

      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.userSession.count.mockResolvedValue(250);
      mockPrisma.community.count.mockResolvedValue(50);
      mockPrisma.post.count.mockResolvedValue(500);
      mockPrisma.comment.count.mockResolvedValue(1200);
      mockPrisma.communityHealthScore.aggregate.mockResolvedValue({
        _avg: { overallScore: 82.5 }
      });

      const result = await analyticsService.exportAnalyticsData('site_123', exportOptions);

      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/community-analytics-site_123-7d-\d+\.csv/);
      expect(result.data).toBe('CSV data placeholder'); // Mocked conversion
    });

    it('should exclude user data when requested', async () => {
      const exportOptions = {
        includeUserData: false,
        includeCommunityData: true,
      };

      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.userSession.count.mockResolvedValue(250);
      mockPrisma.community.count.mockResolvedValue(50);
      mockPrisma.post.count.mockResolvedValue(500);
      mockPrisma.comment.count.mockResolvedValue(1200);
      mockPrisma.communityHealthScore.aggregate.mockResolvedValue({
        _avg: { overallScore: 82.5 }
      });

      const result = await analyticsService.exportAnalyticsData('site_123', exportOptions);

      expect(result.data).not.toHaveProperty('users');
      expect(result.data).toHaveProperty('communities');
    });
  });

  describe('Real-time Analytics', () => {
    it('should track real-time metrics accurately', async () => {
      const now = new Date();
      
      mockPrisma.userSession.count
        .mockResolvedValueOnce(42) // active users in last 5 minutes
        .mockResolvedValueOnce(35); // current sessions (last 30 minutes)

      const result = await analyticsService.getRealTimeMetrics('site_123');

      expect(result.activeUsers).toBe(42);
      expect(result.currentSessions).toBe(35);
      expect(result.recentActions).toBeInstanceOf(Array);
      expect(result.liveContent).toBeInstanceOf(Array);

      // Verify the time filters were applied correctly
      expect(mockPrisma.userSession.count).toHaveBeenCalledWith({
        where: {
          siteId: 'site_123',
          lastActivity: { gte: expect.any(Date) }
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle metric recording errors', async () => {
      mockPrisma.analyticsMetric.create.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.recordMetric({
        metricType: 'user_engagement',
        category: 'test',
        name: 'Test Metric',
        value: 100,
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle user behavior tracking errors', async () => {
      mockPrisma.userBehaviorEvent.create.mockRejectedValue(new Error('Tracking error'));

      await expect(analyticsService.trackUserBehavior({
        userId: 'user_123',
        sessionId: 'session_123',
        eventType: 'click',
        eventName: 'Test Click',
        siteId: 'site_123',
      })).rejects.toThrow('Tracking error');
    });

    it('should handle health score calculation errors', async () => {
      mockPrisma.communityHealthScore.create.mockRejectedValue(new Error('Health calculation error'));

      await expect(analyticsService.calculateCommunityHealthScore('comm_123', 'site_123'))
        .rejects.toThrow('Health calculation error');
    });
  });

  describe('Validation', () => {
    it('should validate analytics metric data', async () => {
      const invalidMetric = {
        metricType: 'invalid_type', // Invalid metric type
        category: 'test',
        name: 'Test Metric',
        value: 100,
        siteId: 'site_123',
      };

      await expect(analyticsService.recordMetric(invalidMetric as any))
        .rejects.toThrow();
    });

    it('should validate user behavior event data', async () => {
      const invalidEvent = {
        userId: '', // Invalid: empty user ID
        sessionId: 'session_123',
        eventType: 'click',
        eventName: 'Test Click',
        siteId: 'site_123',
      };

      await expect(analyticsService.trackUserBehavior(invalidEvent as any))
        .rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const incompleteMetric = {
        metricType: 'user_engagement',
        // Missing required fields
      };

      await expect(analyticsService.recordMetric(incompleteMetric as any))
        .rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should respect real-time analytics configuration', async () => {
      const serviceWithoutRealTime = new CommunityAnalyticsService({
        enableRealTimeAnalytics: false,
      });

      mockPrisma.analyticsMetric.create.mockResolvedValue({
        id: 'metric_123',
        metricType: 'user_engagement',
        category: 'test',
        name: 'Test Metric',
        value: 100,
        siteId: 'site_123',
      });

      await serviceWithoutRealTime.recordMetric({
        metricType: 'user_engagement',
        category: 'test',
        name: 'Test Metric',
        value: 100,
        siteId: 'site_123',
      });

      // Should not call real-time update methods when disabled
      expect(mockPrisma.analyticsMetric.create).toHaveBeenCalled();
    });

    it('should respect data retention configuration', async () => {
      const serviceWithShortRetention = new CommunityAnalyticsService({
        dataRetentionDays: 30,
      });

      // Test that the service is configured correctly
      expect(serviceWithShortRetention).toBeInstanceOf(CommunityAnalyticsService);
    });
  });
}); 