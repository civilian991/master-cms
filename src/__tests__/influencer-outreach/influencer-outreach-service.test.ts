import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InfluencerOutreachService } from '@/lib/services/influencer-outreach';
import { 
  InfluencerStatus, 
  InfluencerCampaignStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    influencer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    influencerCampaign: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
    },
  },
}));

describe('InfluencerOutreachService', () => {
  let influencerOutreachService: InfluencerOutreachService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    influencerOutreachService = new InfluencerOutreachService();
    jest.clearAllMocks();
  });

  describe('createInfluencer', () => {
    it('should create a new influencer', async () => {
      const influencerData = {
        name: 'John Doe',
        email: 'john@example.com',
        platform: 'instagram',
        handle: 'johndoe',
        followers: 50000,
        engagement: 3.5,
        tags: { tech: true, lifestyle: true },
        metadata: { location: 'New York' },
        siteId: 'site-1',
      };

      const mockInfluencer = {
        id: 'influencer-1',
        ...influencerData,
        score: 75,
        status: InfluencerStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.influencer.create.mockResolvedValue(mockInfluencer);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await influencerOutreachService.createInfluencer(influencerData);

      expect(mockPrisma.influencer.create).toHaveBeenCalledWith({
        data: {
          name: influencerData.name,
          email: influencerData.email,
          platform: influencerData.platform,
          handle: influencerData.handle,
          followers: influencerData.followers,
          engagement: influencerData.engagement,
          score: expect.any(Number),
          tags: influencerData.tags,
          metadata: influencerData.metadata,
          siteId: influencerData.siteId,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'influencer_added',
          value: 1,
          date: expect.any(Date),
          siteId: influencerData.siteId,
          metadata: { influencerId: mockInfluencer.id, platform: influencerData.platform },
        },
      });

      expect(result).toEqual(mockInfluencer);
    });
  });

  describe('getInfluencers', () => {
    it('should return influencers with default options', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'John Doe',
          platform: 'instagram',
          handle: 'johndoe',
          followers: 50000,
          engagement: 3.5,
          score: 75,
          status: InfluencerStatus.ACTIVE,
          siteId: 'site-1',
          campaigns: [],
        },
      ];

      mockPrisma.influencer.findMany.mockResolvedValue(mockInfluencers);

      const result = await influencerOutreachService.getInfluencers('site-1');

      expect(mockPrisma.influencer.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        include: {
          campaigns: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { score: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockInfluencers);
    });

    it('should return influencers with custom options', async () => {
      const options = {
        status: InfluencerStatus.ACTIVE,
        platform: 'instagram',
        minFollowers: 10000,
        maxFollowers: 100000,
        minEngagement: 2.0,
        tags: ['tech', 'lifestyle'],
        limit: 10,
        offset: 20,
      };

      mockPrisma.influencer.findMany.mockResolvedValue([]);

      await influencerOutreachService.getInfluencers('site-1', options);

      expect(mockPrisma.influencer.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: InfluencerStatus.ACTIVE,
          platform: 'instagram',
          followers: { gte: 10000, lte: 100000 },
          engagement: { gte: 2.0 },
        },
        include: {
          campaigns: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { score: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('getInfluencer', () => {
    it('should return influencer by ID', async () => {
      const mockInfluencer = {
        id: 'influencer-1',
        name: 'John Doe',
        platform: 'instagram',
        handle: 'johndoe',
        followers: 50000,
        engagement: 3.5,
        score: 75,
        status: InfluencerStatus.ACTIVE,
        siteId: 'site-1',
        campaigns: [],
      };

      mockPrisma.influencer.findUnique.mockResolvedValue(mockInfluencer);

      const result = await influencerOutreachService.getInfluencer('influencer-1');

      expect(mockPrisma.influencer.findUnique).toHaveBeenCalledWith({
        where: { id: 'influencer-1' },
        include: {
          campaigns: {
            orderBy: { createdAt: 'desc' },
            include: {
              createdUser: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockInfluencer);
    });
  });

  describe('updateInfluencer', () => {
    it('should update influencer successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        followers: 60000,
        engagement: 4.0,
      };

      const mockUpdatedInfluencer = {
        id: 'influencer-1',
        ...updateData,
        platform: 'instagram',
        handle: 'johndoe',
        score: 80,
        status: InfluencerStatus.ACTIVE,
        siteId: 'site-1',
      };

      mockPrisma.influencer.update.mockResolvedValue(mockUpdatedInfluencer);

      const result = await influencerOutreachService.updateInfluencer('influencer-1', updateData);

      expect(mockPrisma.influencer.update).toHaveBeenCalledWith({
        where: { id: 'influencer-1' },
        data: updateData,
      });

      expect(result).toEqual(mockUpdatedInfluencer);
    });
  });

  describe('deleteInfluencer', () => {
    it('should delete influencer and related data', async () => {
      mockPrisma.influencerCampaign.deleteMany.mockResolvedValue({});
      mockPrisma.influencer.delete.mockResolvedValue({});

      const result = await influencerOutreachService.deleteInfluencer('influencer-1');

      expect(mockPrisma.influencerCampaign.deleteMany).toHaveBeenCalledWith({
        where: { influencerId: 'influencer-1' },
      });

      expect(mockPrisma.influencer.delete).toHaveBeenCalledWith({
        where: { id: 'influencer-1' },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('discoverInfluencers', () => {
    it('should discover influencers based on criteria', async () => {
      const criteria = {
        platform: 'instagram',
        minFollowers: 10000,
        maxFollowers: 100000,
        minEngagement: 2.0,
        tags: ['tech'],
        keywords: ['programming'],
        siteId: 'site-1',
      };

      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'John Doe',
          platform: 'instagram',
          handle: 'johndoe',
          followers: 50000,
          engagement: 3.5,
          score: 75,
          tags: { tech: true },
        },
      ];

      mockPrisma.influencer.findMany.mockResolvedValue(mockInfluencers);

      const result = await influencerOutreachService.discoverInfluencers(criteria);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('matchScore');
      expect(result[0]).toHaveProperty('suggestedOutreach');
    });
  });

  describe('createInfluencerCampaign', () => {
    it('should create influencer campaign successfully', async () => {
      const campaignData = {
        name: 'Summer Product Launch',
        description: 'Promote new summer products',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        budget: 5000,
        influencerId: 'influencer-1',
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      const mockCampaign = {
        id: 'campaign-1',
        ...campaignData,
        status: InfluencerCampaignStatus.DRAFT,
        results: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.influencerCampaign.create.mockResolvedValue(mockCampaign);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await influencerOutreachService.createInfluencerCampaign(campaignData);

      expect(mockPrisma.influencerCampaign.create).toHaveBeenCalledWith({
        data: {
          name: campaignData.name,
          description: campaignData.description,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
          budget: campaignData.budget,
          influencerId: campaignData.influencerId,
          siteId: campaignData.siteId,
          createdBy: campaignData.createdBy,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'influencer_campaign_created',
          value: 1,
          date: expect.any(Date),
          siteId: campaignData.siteId,
          metadata: { campaignId: mockCampaign.id, influencerId: campaignData.influencerId },
        },
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe('getInfluencerCampaigns', () => {
    it('should return influencer campaigns', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Summer Product Launch',
          status: InfluencerCampaignStatus.ACTIVE,
          influencerId: 'influencer-1',
          siteId: 'site-1',
          influencer: {
            id: 'influencer-1',
            name: 'John Doe',
            platform: 'instagram',
          },
          createdUser: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
      ];

      mockPrisma.influencerCampaign.findMany.mockResolvedValue(mockCampaigns);

      const result = await influencerOutreachService.getInfluencerCampaigns('site-1');

      expect(mockPrisma.influencerCampaign.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        include: {
          influencer: true,
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockCampaigns);
    });
  });

  describe('updateInfluencerCampaign', () => {
    it('should update influencer campaign successfully', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        budget: 7500,
      };

      const mockUpdatedCampaign = {
        id: 'campaign-1',
        ...updateData,
        status: InfluencerCampaignStatus.ACTIVE,
        influencerId: 'influencer-1',
        siteId: 'site-1',
      };

      mockPrisma.influencerCampaign.update.mockResolvedValue(mockUpdatedCampaign);

      const result = await influencerOutreachService.updateInfluencerCampaign('campaign-1', updateData);

      expect(mockPrisma.influencerCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: updateData,
      });

      expect(result).toEqual(mockUpdatedCampaign);
    });
  });

  describe('getInfluencerAnalytics', () => {
    it('should return influencer analytics', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'John Doe',
          platform: 'instagram',
          followers: 50000,
          engagement: 3.5,
          score: 75,
          status: InfluencerStatus.ACTIVE,
        },
        {
          id: 'influencer-2',
          name: 'Jane Smith',
          platform: 'youtube',
          followers: 100000,
          engagement: 4.2,
          score: 85,
          status: InfluencerStatus.ACTIVE,
        },
      ];

      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Summer Launch',
          influencer: { name: 'John Doe' },
          results: { revenue: 10000 },
          budget: 5000,
        },
      ];

      mockPrisma.influencer.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.influencerCampaign.findMany.mockResolvedValue(mockCampaigns);

      const result = await influencerOutreachService.getInfluencerAnalytics('site-1');

      expect(result).toEqual({
        totalInfluencers: 2,
        activeInfluencers: 2,
        totalFollowers: 150000,
        averageEngagement: 3.85,
        topPerformingInfluencers: expect.any(Array),
        platformBreakdown: expect.any(Object),
        campaignPerformance: expect.any(Array),
      });
    });
  });

  describe('createOutreachWorkflow', () => {
    it('should create outreach workflow successfully', async () => {
      const workflowData = {
        name: 'New Influencer Outreach',
        description: 'Automated outreach for new influencers',
        triggers: ['influencer_added'],
        actions: [
          {
            type: 'email',
            template: 'Welcome email template',
            delay: 24,
          },
        ],
        isActive: true,
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await influencerOutreachService.createOutreachWorkflow(workflowData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(workflowData.name);
      expect(result.triggers).toEqual(workflowData.triggers);
      expect(result.actions).toEqual(workflowData.actions);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'outreach_workflow_created',
          value: 1,
          date: expect.any(Date),
          siteId: workflowData.siteId,
          metadata: { workflowId: result.id },
        },
      });
    });
  });

  describe('executeOutreachWorkflow', () => {
    it('should execute outreach workflow successfully', async () => {
      const mockInfluencer = {
        id: 'influencer-1',
        siteId: 'site-1',
      };

      mockPrisma.influencer.findUnique.mockResolvedValue(mockInfluencer);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await influencerOutreachService.executeOutreachWorkflow(
        'workflow-1',
        'influencer-1'
      );

      expect(result).toEqual({
        workflowId: 'workflow-1',
        influencerId: 'influencer-1',
        status: 'executed',
        actions: expect.any(Array),
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'outreach_workflow_executed',
          value: 1,
          date: expect.any(Date),
          siteId: 'site-1',
          metadata: {
            workflowId: 'workflow-1',
            influencerId: 'influencer-1',
            result: expect.any(Object),
          },
        },
      });
    });
  });

  describe('trackInfluencerInteraction', () => {
    it('should track influencer interaction successfully', async () => {
      const mockInfluencer = {
        id: 'influencer-1',
        siteId: 'site-1',
      };

      mockPrisma.influencer.findUnique.mockResolvedValue(mockInfluencer);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const interaction = {
        type: 'email_opened',
        value: 1,
        metadata: { emailId: 'email-1' },
      };

      const result = await influencerOutreachService.trackInfluencerInteraction(
        'influencer-1',
        interaction
      );

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'influencer_email_opened',
          value: 1,
          date: expect.any(Date),
          metadata: {
            influencerId: 'influencer-1',
            emailId: 'email-1',
          },
          siteId: 'site-1',
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('bulkImportInfluencers', () => {
    it('should bulk import influencers successfully', async () => {
      const influencers = [
        {
          name: 'John Doe',
          platform: 'instagram',
          handle: 'johndoe',
          followers: 50000,
          engagement: 3.5,
          siteId: 'site-1',
        },
        {
          name: 'Jane Smith',
          platform: 'youtube',
          handle: 'janesmith',
          followers: 100000,
          engagement: 4.2,
          siteId: 'site-1',
        },
      ];

      mockPrisma.influencer.create
        .mockResolvedValueOnce({ id: 'influencer-1', ...influencers[0] })
        .mockResolvedValueOnce({ id: 'influencer-2', ...influencers[1] });

      const result = await influencerOutreachService.bulkImportInfluencers(influencers);

      expect(result).toEqual({
        success: 2,
        errors: 0,
        results: expect.any(Array),
        errorDetails: expect.any(Array),
      });

      expect(mockPrisma.influencer.create).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during bulk import', async () => {
      const influencers = [
        {
          name: 'John Doe',
          platform: 'instagram',
          handle: 'johndoe',
          followers: 50000,
          engagement: 3.5,
          siteId: 'site-1',
        },
      ];

      mockPrisma.influencer.create.mockRejectedValue(new Error('Database error'));

      const result = await influencerOutreachService.bulkImportInfluencers(influencers);

      expect(result.success).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toHaveLength(1);
    });
  });

  describe('exportInfluencers', () => {
    it('should export influencers in CSV format', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'John Doe',
          email: 'john@example.com',
          platform: 'instagram',
          handle: 'johndoe',
          followers: 50000,
          engagement: 3.5,
          score: 75,
          status: InfluencerStatus.ACTIVE,
        },
      ];

      mockPrisma.influencer.findMany.mockResolvedValue(mockInfluencers);

      const result = await influencerOutreachService.exportInfluencers('site-1', 'csv');

      expect(result).toContain('Name,Email,Platform,Handle,Followers,Engagement,Score,Status');
      expect(result).toContain('John Doe,john@example.com,instagram,johndoe,50000,3.5,75,ACTIVE');
    });

    it('should export influencers in JSON format', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'John Doe',
          platform: 'instagram',
          handle: 'johndoe',
          followers: 50000,
          engagement: 3.5,
          score: 75,
          status: InfluencerStatus.ACTIVE,
        },
      ];

      mockPrisma.influencer.findMany.mockResolvedValue(mockInfluencers);

      const result = await influencerOutreachService.exportInfluencers('site-1', 'json');

      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual(mockInfluencers);
    });
  });

  describe('calculateInfluencerScore', () => {
    it('should calculate influencer score correctly', () => {
      const influencer = {
        name: 'John Doe',
        platform: 'instagram',
        followers: 50000,
        engagement: 3.5,
        tags: { tech: true },
      };

      // This tests the private method indirectly through createInfluencer
      mockPrisma.influencer.create.mockResolvedValue({
        id: 'influencer-1',
        ...influencer,
        score: 75,
      });
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      return influencerOutreachService.createInfluencer({
        ...influencer,
        siteId: 'site-1',
      }).then(result => {
        expect(result.score).toBeGreaterThan(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });
    });
  });
}); 