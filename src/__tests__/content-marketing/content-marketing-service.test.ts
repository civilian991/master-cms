import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ContentMarketingService } from '@/lib/services/content-marketing';
import { 
  ArticleStatus, 
  WorkflowState,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
    },
  },
}));

describe('ContentMarketingService', () => {
  let contentMarketingService: ContentMarketingService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    contentMarketingService = new ContentMarketingService();
    jest.clearAllMocks();
  });

  describe('createContentCalendarEvent', () => {
    it('should create a new content calendar event', async () => {
      const eventData = {
        title: 'Blog Post: Digital Marketing Trends',
        description: 'Comprehensive guide to digital marketing trends in 2024',
        type: 'article' as const,
        status: 'planned' as const,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        assignedTo: 'user-1',
        priority: 'high' as const,
        tags: ['digital marketing', 'trends', '2024'],
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.createContentCalendarEvent(eventData);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(eventData.title);
      expect(result.type).toBe(eventData.type);
      expect(result.status).toBe(eventData.status);
      expect(result.priority).toBe(eventData.priority);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'content_calendar_event_created',
          value: 1,
          date: expect.any(Date),
          siteId: eventData.siteId,
          metadata: { eventId: result.id, type: eventData.type },
        },
      });
    });
  });

  describe('getContentCalendarEvents', () => {
    it('should return content calendar events', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          titleEn: 'Digital Marketing Guide',
          excerptEn: 'Complete guide to digital marketing',
          status: ArticleStatus.PUBLISHED,
          scheduledAt: new Date('2024-01-15'),
          expiresAt: new Date('2024-01-20'),
          authorId: 'user-1',
          siteId: 'site-1',
          viewCount: 1000,
          engagementScore: 0.75,
          tags: [
            { tag: { nameEn: 'digital marketing' } },
            { tag: { nameEn: 'guide' } },
          ],
          author: { id: 'user-1', name: 'John Doe' },
          category: { id: 'cat-1', nameEn: 'Marketing' },
        },
      ];

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await contentMarketingService.getContentCalendarEvents('site-1');

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        include: {
          author: true,
          category: true,
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'article-1');
      expect(result[0]).toHaveProperty('title', 'Digital Marketing Guide');
      expect(result[0]).toHaveProperty('type', 'article');
      expect(result[0]).toHaveProperty('status', 'published');
    });

    it('should filter events by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrisma.article.findMany.mockResolvedValue([]);

      await contentMarketingService.getContentCalendarEvents('site-1', {
        startDate,
        endDate,
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalled();
    });

    it('should filter events by type and status', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);

      await contentMarketingService.getContentCalendarEvents('site-1', {
        type: 'article',
        status: 'published',
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalled();
    });
  });

  describe('createContentDistributionChannel', () => {
    it('should create a new content distribution channel', async () => {
      const channelData = {
        name: 'Twitter',
        type: 'social_media' as const,
        platform: 'twitter',
        isActive: true,
        settings: { apiKey: '***', autoPost: true },
        siteId: 'site-1',
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.createContentDistributionChannel(channelData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(channelData.name);
      expect(result.type).toBe(channelData.type);
      expect(result.platform).toBe(channelData.platform);
      expect(result.isActive).toBe(channelData.isActive);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'content_distribution_channel_created',
          value: 1,
          date: expect.any(Date),
          siteId: channelData.siteId,
          metadata: { channelId: result.id, type: channelData.type },
        },
      });
    });
  });

  describe('getContentDistributionChannels', () => {
    it('should return content distribution channels', async () => {
      const result = await contentMarketingService.getContentDistributionChannels('site-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('isActive');
    });
  });

  describe('distributeContent', () => {
    it('should distribute content to channels', async () => {
      const contentId = 'article-1';
      const channels = ['channel-1', 'channel-2'];
      const siteId = 'site-1';

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.distributeContent(contentId, channels, siteId);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('channelId');
      expect(result[0]).toHaveProperty('status', 'success');
      expect(result[0]).toHaveProperty('timestamp');

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'content_distributed',
          value: channels.length,
          date: expect.any(Date),
          siteId,
          metadata: { contentId, channels, results: expect.any(Array) },
        },
      });
    });
  });

  describe('trackContentPerformance', () => {
    it('should track content performance', async () => {
      const contentId = 'article-1';
      const siteId = 'site-1';
      const metrics = {
        views: 1000,
        uniqueViews: 800,
        timeOnPage: 180,
        bounceRate: 0.3,
        engagementRate: 0.75,
        shares: 50,
        comments: 25,
        conversions: 10,
        conversionRate: 0.01,
        revenue: 500,
      };

      mockPrisma.article.update.mockResolvedValue({});
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.trackContentPerformance(contentId, metrics, siteId);

      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: {
          viewCount: metrics.views,
          engagementScore: metrics.engagementRate,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'content_performance',
          value: metrics.views,
          date: expect.any(Date),
          siteId,
          metadata: { contentId, metrics },
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          titleEn: 'Digital Marketing Guide',
          status: ArticleStatus.PUBLISHED,
          viewCount: 1000,
          engagementScore: 0.75,
          contentAnalytics: [],
          category: { id: 'cat-1', nameEn: 'Marketing' },
        },
        {
          id: 'article-2',
          titleEn: 'SEO Best Practices',
          status: ArticleStatus.PUBLISHED,
          viewCount: 800,
          engagementScore: 0.65,
          contentAnalytics: [],
          category: { id: 'cat-2', nameEn: 'SEO' },
        },
      ];

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await contentMarketingService.getContentAnalytics('site-1');

      expect(result).toEqual({
        totalContent: 2,
        publishedContent: 2,
        totalViews: 1800,
        averageEngagement: 0.7,
        topPerformingContent: expect.any(Array),
        contentByType: expect.any(Object),
        performanceTrends: expect.any(Array),
      });

      expect(result.topPerformingContent).toHaveLength(2);
      expect(result.contentByType).toHaveProperty('article');
    });
  });

  describe('generateContentOptimizationSuggestions', () => {
    it('should generate content optimization suggestions', async () => {
      const contentId = 'article-1';
      const siteId = 'site-1';

      const mockArticle = {
        id: contentId,
        titleEn: 'Short Title',
        contentEn: 'Short content',
        seoTitleEn: null,
        seoDescriptionEn: null,
        engagementScore: 0.3,
        category: { id: 'cat-1', nameEn: 'Marketing' },
        tags: [{ tag: { nameEn: 'marketing' } }],
      };

      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);

      const result = await contentMarketingService.generateContentOptimizationSuggestions(contentId, siteId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('impact');
      expect(result[0]).toHaveProperty('effort');
      expect(result[0]).toHaveProperty('currentValue');
      expect(result[0]).toHaveProperty('suggestedValue');
      expect(result[0]).toHaveProperty('reasoning');
    });

    it('should handle missing content', async () => {
      const contentId = 'nonexistent';
      const siteId = 'site-1';

      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(
        contentMarketingService.generateContentOptimizationSuggestions(contentId, siteId)
      ).rejects.toThrow('Content not found');
    });
  });

  describe('createContentMarketingWorkflow', () => {
    it('should create content marketing workflow', async () => {
      const workflowData = {
        name: 'Weekly Content Review',
        description: 'Automated weekly content review workflow',
        triggers: ['weekly'],
        actions: [
          {
            type: 'content_creation',
            parameters: { template: 'blog-post' },
            schedule: 'weekly',
          },
        ],
        isActive: true,
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.createContentMarketingWorkflow(workflowData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(workflowData.name);
      expect(result.triggers).toEqual(workflowData.triggers);
      expect(result.actions).toEqual(workflowData.actions);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'content_marketing_workflow_created',
          value: 1,
          date: expect.any(Date),
          siteId: workflowData.siteId,
          metadata: { workflowId: result.id },
        },
      });
    });
  });

  describe('executeContentMarketingWorkflow', () => {
    it('should execute content marketing workflow', async () => {
      const workflowId = 'workflow-1';
      const siteId = 'site-1';

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.executeContentMarketingWorkflow(workflowId, siteId);

      expect(result).toEqual({
        workflowId,
        siteId,
        status: 'executed',
        actions: expect.any(Array),
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'content_marketing_workflow_executed',
          value: 1,
          date: expect.any(Date),
          siteId,
          metadata: {
            workflowId,
            result: expect.any(Object),
          },
        },
      });
    });
  });

  describe('bulkImportContentCalendarEvents', () => {
    it('should bulk import content calendar events successfully', async () => {
      const events = [
        {
          title: 'Event 1',
          type: 'article' as const,
          status: 'planned' as const,
          startDate: new Date(),
          priority: 'medium' as const,
          tags: ['tag1'],
          siteId: 'site-1',
          createdBy: 'user-1',
        },
        {
          title: 'Event 2',
          type: 'social' as const,
          status: 'planned' as const,
          startDate: new Date(),
          priority: 'high' as const,
          tags: ['tag2'],
          siteId: 'site-1',
          createdBy: 'user-1',
        },
      ];

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await contentMarketingService.bulkImportContentCalendarEvents(events);

      expect(result).toEqual({
        success: 2,
        errors: 0,
        results: expect.any(Array),
        errorDetails: expect.any(Array),
      });

      expect(result.results).toHaveLength(2);
      expect(result.errorDetails).toHaveLength(0);
    });

    it('should handle errors during bulk import', async () => {
      const events = [
        {
          title: 'Event 1',
          type: 'article' as const,
          status: 'planned' as const,
          startDate: new Date(),
          priority: 'medium' as const,
          tags: ['tag1'],
          siteId: 'site-1',
          createdBy: 'user-1',
        },
      ];

      mockPrisma.marketingAnalytics.create.mockRejectedValue(new Error('Database error'));

      const result = await contentMarketingService.bulkImportContentCalendarEvents(events);

      expect(result.success).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toHaveLength(1);
    });
  });

  describe('exportContentMarketingData', () => {
    it('should export content marketing data in CSV format', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          titleEn: 'Digital Marketing Guide',
          status: ArticleStatus.PUBLISHED,
          scheduledAt: new Date('2024-01-15'),
          authorId: 'user-1',
          siteId: 'site-1',
          tags: [{ tag: { nameEn: 'marketing' } }],
          author: { id: 'user-1', name: 'John Doe' },
          category: { id: 'cat-1', nameEn: 'Marketing' },
        },
      ];

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await contentMarketingService.exportContentMarketingData('site-1', 'csv');

      expect(result).toContain('Title,Type,Status,Start Date,Priority,Assigned To');
      expect(result).toContain('Digital Marketing Guide,article,published,2024-01-15,medium,user-1');
    });

    it('should export content marketing data in JSON format', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          titleEn: 'Digital Marketing Guide',
          status: ArticleStatus.PUBLISHED,
          scheduledAt: new Date('2024-01-15'),
          authorId: 'user-1',
          siteId: 'site-1',
          tags: [{ tag: { nameEn: 'marketing' } }],
          author: { id: 'user-1', name: 'John Doe' },
          category: { id: 'cat-1', nameEn: 'Marketing' },
        },
      ];

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await contentMarketingService.exportContentMarketingData('site-1', 'json');

      const parsedResult = JSON.parse(result);
      expect(parsedResult).toHaveProperty('events');
      expect(parsedResult).toHaveProperty('channels');
    });
  });

  describe('private methods', () => {
    it('should map article status to calendar status correctly', () => {
      const service = contentMarketingService as any;
      
      expect(service.mapArticleStatusToCalendarStatus(ArticleStatus.DRAFT)).toBe('planned');
      expect(service.mapArticleStatusToCalendarStatus(ArticleStatus.REVIEW)).toBe('review');
      expect(service.mapArticleStatusToCalendarStatus(ArticleStatus.PUBLISHED)).toBe('published');
      expect(service.mapArticleStatusToCalendarStatus(ArticleStatus.SCHEDULED)).toBe('scheduled');
    });

    it('should calculate content priority correctly', () => {
      const service = contentMarketingService as any;
      
      const highPriorityArticle = {
        status: ArticleStatus.PUBLISHED,
        viewCount: 1500,
      };
      
      const scheduledArticle = {
        status: ArticleStatus.SCHEDULED,
        viewCount: 100,
      };
      
      const reviewArticle = {
        status: ArticleStatus.REVIEW,
        viewCount: 50,
      };
      
      const draftArticle = {
        status: ArticleStatus.DRAFT,
        viewCount: 0,
      };

      expect(service.calculateContentPriority(highPriorityArticle)).toBe('high');
      expect(service.calculateContentPriority(scheduledArticle)).toBe('medium');
      expect(service.calculateContentPriority(reviewArticle)).toBe('urgent');
      expect(service.calculateContentPriority(draftArticle)).toBe('low');
    });

    it('should generate performance trends', () => {
      const service = contentMarketingService as any;
      const trends = service.generateContentPerformanceTrends();
      
      expect(trends).toBeInstanceOf(Array);
      expect(trends).toHaveLength(30);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('views');
      expect(trends[0]).toHaveProperty('engagement');
      expect(trends[0]).toHaveProperty('conversions');
    });
  });
}); 