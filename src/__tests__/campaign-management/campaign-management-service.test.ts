import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CampaignManagementService } from '@/lib/services/campaign-management';
import { 
  MarketingCampaignType, 
  MarketingCampaignStatus, 
  MarketingAnalyticsType,
  MarketingAutomationType,
  MarketingAutomationStatus
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    marketingAutomation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    marketingLead: {
      updateMany: jest.fn(),
    },
    emailCampaign: {
      updateMany: jest.fn(),
    },
    socialMediaPost: {
      updateMany: jest.fn(),
    },
    marketingABTest: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('CampaignManagementService', () => {
  let campaignManagementService: CampaignManagementService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    campaignManagementService = new CampaignManagementService();
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a new marketing campaign', async () => {
      const campaignData = {
        name: 'Summer Sale Campaign',
        description: 'Promote summer products',
        type: MarketingCampaignType.CONVERSION,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        budget: 10000,
        targetAudience: { age: '25-45', interests: ['shopping'] },
        channels: ['email', 'social', 'ads'],
        goals: { conversions: 100, revenue: 50000 },
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      const mockCampaign = {
        id: 'campaign-1',
        ...campaignData,
        status: MarketingCampaignStatus.DRAFT,
        spent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.marketingCampaign.create.mockResolvedValue(mockCampaign);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await campaignManagementService.createCampaign(campaignData);

      expect(mockPrisma.marketingCampaign.create).toHaveBeenCalledWith({
        data: {
          name: campaignData.name,
          description: campaignData.description,
          type: campaignData.type,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
          budget: campaignData.budget,
          targetAudience: campaignData.targetAudience,
          channels: campaignData.channels,
          goals: campaignData.goals,
          siteId: campaignData.siteId,
          createdBy: campaignData.createdBy,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'campaign_created',
          value: 1,
          date: expect.any(Date),
          siteId: campaignData.siteId,
          campaignId: mockCampaign.id,
        },
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe('getCampaigns', () => {
    it('should return campaigns with default options', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Summer Sale',
          type: MarketingCampaignType.CONVERSION,
          status: MarketingCampaignStatus.ACTIVE,
          siteId: 'site-1',
          createdUser: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          leads: [],
          emails: [],
          socialPosts: [],
          analytics: [],
        },
      ];

      mockPrisma.marketingCampaign.findMany.mockResolvedValue(mockCampaigns);

      const result = await campaignManagementService.getCampaigns('site-1');

      expect(mockPrisma.marketingCampaign.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          leads: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          emails: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          socialPosts: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          analytics: {
            take: 10,
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockCampaigns);
    });

    it('should return campaigns with custom options', async () => {
      const options = {
        status: MarketingCampaignStatus.ACTIVE,
        type: MarketingCampaignType.CONVERSION,
        createdBy: 'user-1',
        limit: 10,
        offset: 20,
      };

      mockPrisma.marketingCampaign.findMany.mockResolvedValue([]);

      await campaignManagementService.getCampaigns('site-1', options);

      expect(mockPrisma.marketingCampaign.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: MarketingCampaignStatus.ACTIVE,
          type: MarketingCampaignType.CONVERSION,
          createdBy: 'user-1',
        },
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          leads: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          emails: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          socialPosts: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          analytics: {
            take: 10,
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('getCampaign', () => {
    it('should return a campaign by ID', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Summer Sale',
        type: MarketingCampaignType.CONVERSION,
        status: MarketingCampaignStatus.ACTIVE,
        siteId: 'site-1',
        createdUser: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        leads: [],
        emails: [],
        socialPosts: [],
        analytics: [],
        abTests: [],
      };

      mockPrisma.marketingCampaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await campaignManagementService.getCampaign('campaign-1');

      expect(mockPrisma.marketingCampaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          leads: {
            orderBy: { createdAt: 'desc' },
          },
          emails: {
            orderBy: { createdAt: 'desc' },
          },
          socialPosts: {
            orderBy: { createdAt: 'desc' },
          },
          analytics: {
            orderBy: { date: 'desc' },
          },
          abTests: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
        budget: 15000,
      };

      const mockUpdatedCampaign = {
        id: 'campaign-1',
        ...updateData,
        type: MarketingCampaignType.CONVERSION,
        status: MarketingCampaignStatus.ACTIVE,
        siteId: 'site-1',
      };

      mockPrisma.marketingCampaign.update.mockResolvedValue(mockUpdatedCampaign);

      const result = await campaignManagementService.updateCampaign('campaign-1', updateData);

      expect(mockPrisma.marketingCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: updateData,
      });

      expect(result).toEqual(mockUpdatedCampaign);
    });
  });

  describe('updateCampaignStatus', () => {
    it('should update campaign status successfully', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        status: MarketingCampaignStatus.DRAFT,
        siteId: 'site-1',
      };

      mockPrisma.marketingCampaign.update.mockResolvedValue({ ...mockCampaign, status: MarketingCampaignStatus.ACTIVE });
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await campaignManagementService.updateCampaignStatus(
        'campaign-1',
        MarketingCampaignStatus.ACTIVE
      );

      expect(mockPrisma.marketingCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { status: MarketingCampaignStatus.ACTIVE },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'status_change',
          value: 1,
          date: expect.any(Date),
          metadata: { status: MarketingCampaignStatus.ACTIVE, previousStatus: MarketingCampaignStatus.DRAFT },
          siteId: 'site-1',
          campaignId: 'campaign-1',
        },
      });

      expect(result.status).toBe(MarketingCampaignStatus.ACTIVE);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign and related data', async () => {
      mockPrisma.marketingAnalytics.deleteMany.mockResolvedValue({});
      mockPrisma.marketingABTest.deleteMany.mockResolvedValue({});
      mockPrisma.marketingLead.updateMany.mockResolvedValue({});
      mockPrisma.emailCampaign.updateMany.mockResolvedValue({});
      mockPrisma.socialMediaPost.updateMany.mockResolvedValue({});
      mockPrisma.marketingCampaign.delete.mockResolvedValue({});

      const result = await campaignManagementService.deleteCampaign('campaign-1');

      expect(mockPrisma.marketingAnalytics.deleteMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
      });

      expect(mockPrisma.marketingABTest.deleteMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
      });

      expect(mockPrisma.marketingLead.updateMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        data: { campaignId: null },
      });

      expect(mockPrisma.emailCampaign.updateMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        data: { campaignId: null },
      });

      expect(mockPrisma.socialMediaPost.updateMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        data: { campaignId: null },
      });

      expect(mockPrisma.marketingCampaign.delete).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('getCampaignPerformance', () => {
    it('should return campaign performance metrics', async () => {
      const mockAnalytics = [
        { metric: 'impressions', value: 1000 },
        { metric: 'clicks', value: 100 },
        { metric: 'conversions', value: 10 },
        { metric: 'spend', value: 500 },
      ];

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await campaignManagementService.getCampaignPerformance('campaign-1');

      expect(mockPrisma.marketingAnalytics.findMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        orderBy: { date: 'asc' },
      });

      expect(result).toEqual({
        campaignId: 'campaign-1',
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 500,
        ctr: 10, // (100/1000) * 100
        cpc: 5, // 500/100
        cpa: 50, // 500/10
        roi: 0, // Simplified calculation
        date: expect.any(Date),
      });
    });

    it('should handle date range filtering', async () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      };

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue([]);

      await campaignManagementService.getCampaignPerformance('campaign-1', dateRange);

      expect(mockPrisma.marketingAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          campaignId: 'campaign-1',
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Campaign 1',
          status: MarketingCampaignStatus.ACTIVE,
          spent: 1000,
          analytics: [
            { metric: 'conversions', value: 10 },
            { metric: 'revenue', value: 5000 },
          ],
        },
        {
          id: 'campaign-2',
          name: 'Campaign 2',
          status: MarketingCampaignStatus.DRAFT,
          spent: 500,
          analytics: [
            { metric: 'conversions', value: 5 },
            { metric: 'revenue', value: 2000 },
          ],
        },
      ];

      mockPrisma.marketingCampaign.findMany.mockResolvedValue(mockCampaigns);

      const result = await campaignManagementService.getCampaignAnalytics('site-1');

      expect(result).toEqual({
        totalCampaigns: 2,
        activeCampaigns: 1,
        totalSpend: 1500,
        totalConversions: 15,
        averageROI: expect.any(Number),
        channelPerformance: {},
        topPerformingCampaigns: expect.any(Array),
        date: expect.any(Date),
      });
    });
  });

  describe('createCampaignAutomation', () => {
    it('should create campaign automation successfully', async () => {
      const automationData = {
        name: 'Campaign Trigger Automation',
        description: 'Automate campaign actions based on triggers',
        type: MarketingAutomationType.CAMPAIGN_TRIGGER,
        triggers: [{ type: 'campaign_launched' }],
        actions: [{ type: 'send_email' }],
        conditions: { threshold: 100 },
        isActive: true,
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      const mockAutomation = {
        id: 'automation-1',
        ...automationData,
        status: MarketingAutomationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.marketingAutomation.create.mockResolvedValue(mockAutomation);

      const result = await campaignManagementService.createCampaignAutomation(automationData);

      expect(mockPrisma.marketingAutomation.create).toHaveBeenCalledWith({
        data: {
          name: automationData.name,
          description: automationData.description,
          type: automationData.type,
          status: MarketingAutomationStatus.DRAFT,
          triggers: automationData.triggers,
          actions: automationData.actions,
          conditions: automationData.conditions,
          isActive: automationData.isActive,
          siteId: automationData.siteId,
          createdBy: automationData.createdBy,
        },
      });

      expect(result).toEqual(mockAutomation);
    });
  });

  describe('getCampaignAutomations', () => {
    it('should return campaign automations', async () => {
      const mockAutomations = [
        {
          id: 'automation-1',
          name: 'Campaign Trigger',
          type: MarketingAutomationType.CAMPAIGN_TRIGGER,
          status: MarketingAutomationStatus.ACTIVE,
          isActive: true,
          triggers: [{ type: 'campaign_launched' }],
          actions: [{ type: 'send_email' }],
          siteId: 'site-1',
          createdUser: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          executions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.marketingAutomation.findMany.mockResolvedValue(mockAutomations);

      const result = await campaignManagementService.getCampaignAutomations('site-1');

      expect(mockPrisma.marketingAutomation.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          type: {
            in: [
              MarketingAutomationType.CAMPAIGN_TRIGGER,
              MarketingAutomationType.CROSS_CHANNEL,
              MarketingAutomationType.REAL_TIME,
            ],
          },
        },
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          executions: {
            take: 5,
            orderBy: { startedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockAutomations);
    });
  });

  describe('trackCampaignEvent', () => {
    it('should track campaign event successfully', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        siteId: 'site-1',
      };

      mockPrisma.marketingCampaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const event = {
        type: 'impression',
        value: 1,
        metadata: { source: 'facebook' },
      };

      const result = await campaignManagementService.trackCampaignEvent('campaign-1', event);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'impression',
          value: 1,
          date: expect.any(Date),
          metadata: { source: 'facebook' },
          siteId: 'site-1',
          campaignId: 'campaign-1',
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('duplicateCampaign', () => {
    it('should duplicate campaign successfully', async () => {
      const originalCampaign = {
        id: 'campaign-1',
        name: 'Original Campaign',
        description: 'Original description',
        type: MarketingCampaignType.CONVERSION,
        budget: 10000,
        targetAudience: { age: '25-45' },
        channels: ['email', 'social'],
        goals: { conversions: 100 },
        siteId: 'site-1',
      };

      const duplicatedCampaign = {
        id: 'campaign-2',
        name: 'Duplicated Campaign',
        description: 'Original description',
        type: MarketingCampaignType.CONVERSION,
        status: MarketingCampaignStatus.DRAFT,
        spent: 0,
        siteId: 'site-1',
      };

      mockPrisma.marketingCampaign.findUnique.mockResolvedValue(originalCampaign);
      mockPrisma.marketingCampaign.create.mockResolvedValue(duplicatedCampaign);

      const result = await campaignManagementService.duplicateCampaign(
        'campaign-1',
        'Duplicated Campaign',
        'user-1'
      );

      expect(mockPrisma.marketingCampaign.create).toHaveBeenCalledWith({
        data: {
          name: 'Duplicated Campaign',
          description: originalCampaign.description,
          type: originalCampaign.type,
          startDate: null,
          endDate: null,
          budget: originalCampaign.budget,
          targetAudience: originalCampaign.targetAudience,
          channels: originalCampaign.channels,
          goals: originalCampaign.goals,
          status: MarketingCampaignStatus.DRAFT,
          spent: 0,
          siteId: originalCampaign.siteId,
          createdBy: 'user-1',
        },
      });

      expect(result).toEqual(duplicatedCampaign);
    });
  });

  describe('getOptimizationRecommendations', () => {
    it('should return optimization recommendations', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        budget: 1000,
        channels: ['email', 'social'],
      };

      mockPrisma.marketingCampaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.marketingAnalytics.findMany.mockResolvedValue([
        { metric: 'spend', value: 900 },
        { metric: 'clicks', value: 50 },
        { metric: 'impressions', value: 1000 },
      ]);

      const result = await campaignManagementService.getOptimizationRecommendations('campaign-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('impact');
      expect(result[0]).toHaveProperty('action');
    });
  });
}); 