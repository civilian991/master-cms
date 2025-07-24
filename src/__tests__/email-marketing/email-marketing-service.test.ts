import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EmailMarketingService } from '@/lib/services/email-marketing';
import { EmailCampaignStatus, EmailRecipientStatus, MarketingAutomationType, MarketingAutomationStatus } from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailCampaign: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailCampaignRecipient: {
      createMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    marketingAutomation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    marketingAutomationExecution: {
      create: jest.fn(),
    },
  },
}));

describe('EmailMarketingService', () => {
  let emailMarketingService: EmailMarketingService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    emailMarketingService = new EmailMarketingService();
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a draft campaign when no scheduledAt is provided', async () => {
      const campaignData = {
        name: 'Test Campaign',
        subject: 'Test Subject',
        content: '<h1>Test Content</h1>',
        siteId: 'site-1',
        recipientList: ['test@example.com'],
      };

      const mockCampaign = {
        id: 'campaign-1',
        ...campaignData,
        status: EmailCampaignStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.emailCampaign.create.mockResolvedValue(mockCampaign);
      mockPrisma.emailCampaignRecipient.createMany.mockResolvedValue({ count: 1 });

      const result = await emailMarketingService.createCampaign(campaignData, 'user-1');

      expect(mockPrisma.emailCampaign.create).toHaveBeenCalledWith({
        data: {
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          template: undefined,
          status: EmailCampaignStatus.DRAFT,
          scheduledAt: undefined,
          siteId: campaignData.siteId,
          campaignId: undefined,
          metadata: {},
          createdBy: 'user-1',
        },
      });

      expect(mockPrisma.emailCampaignRecipient.createMany).toHaveBeenCalledWith({
        data: [
          {
            email: 'test@example.com',
            campaignId: 'campaign-1',
            siteId: 'site-1',
            status: EmailRecipientStatus.PENDING,
          },
        ],
        skipDuplicates: true,
      });

      expect(result).toEqual(mockCampaign);
    });

    it('should create a scheduled campaign when scheduledAt is provided', async () => {
      const scheduledAt = new Date('2024-01-01T10:00:00Z');
      const campaignData = {
        name: 'Scheduled Campaign',
        subject: 'Scheduled Subject',
        content: '<h1>Scheduled Content</h1>',
        siteId: 'site-1',
        scheduledAt,
      };

      const mockCampaign = {
        id: 'campaign-2',
        ...campaignData,
        status: EmailCampaignStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.emailCampaign.create.mockResolvedValue(mockCampaign);

      const result = await emailMarketingService.createCampaign(campaignData, 'user-1');

      expect(mockPrisma.emailCampaign.create).toHaveBeenCalledWith({
        data: {
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          template: undefined,
          status: EmailCampaignStatus.SCHEDULED,
          scheduledAt,
          siteId: campaignData.siteId,
          campaignId: undefined,
          metadata: {},
          createdBy: 'user-1',
        },
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe('getCampaigns', () => {
    it('should return campaigns for a site with default options', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Test Campaign 1',
          subject: 'Test Subject 1',
          status: EmailCampaignStatus.SENT,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          campaign: null,
          recipients: [{ status: EmailRecipientStatus.SENT }],
        },
        {
          id: 'campaign-2',
          name: 'Test Campaign 2',
          subject: 'Test Subject 2',
          status: EmailCampaignStatus.DRAFT,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          campaign: null,
          recipients: [{ status: EmailRecipientStatus.PENDING }],
        },
      ];

      mockPrisma.emailCampaign.findMany.mockResolvedValue(mockCampaigns);

      const result = await emailMarketingService.getCampaigns('site-1');

      expect(mockPrisma.emailCampaign.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: undefined,
        },
        include: {
          campaign: true,
          recipients: {
            select: {
              status: true,
            },
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
        status: EmailCampaignStatus.SENT,
        limit: 10,
        offset: 20,
      };

      mockPrisma.emailCampaign.findMany.mockResolvedValue([]);

      await emailMarketingService.getCampaigns('site-1', options);

      expect(mockPrisma.emailCampaign.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: EmailCampaignStatus.SENT,
        },
        include: {
          campaign: true,
          recipients: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('sendCampaign', () => {
    it('should send a campaign successfully', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Test Campaign',
        subject: 'Test Subject',
        content: '<h1>Test Content</h1>',
        status: EmailCampaignStatus.DRAFT,
        recipients: [
          {
            id: 'recipient-1',
            email: 'test@example.com',
            status: EmailRecipientStatus.PENDING,
          },
        ],
      };

      mockPrisma.emailCampaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.emailCampaign.update.mockResolvedValue(mockCampaign);
      mockPrisma.emailCampaignRecipient.update.mockResolvedValue({});

      const result = await emailMarketingService.sendCampaign('campaign-1');

      expect(mockPrisma.emailCampaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        include: { recipients: true },
      });

      expect(mockPrisma.emailCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: {
          status: EmailCampaignStatus.SENDING,
          sentAt: expect.any(Date),
        },
      });

      expect(result).toEqual({ success: true, sentCount: 1 });
    });

    it('should throw error when campaign not found', async () => {
      mockPrisma.emailCampaign.findUnique.mockResolvedValue(null);

      await expect(emailMarketingService.sendCampaign('nonexistent')).rejects.toThrow('Campaign not found');
    });

    it('should throw error when campaign cannot be sent', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        status: EmailCampaignStatus.SENT,
        recipients: [],
      };

      mockPrisma.emailCampaign.findUnique.mockResolvedValue(mockCampaign);

      await expect(emailMarketingService.sendCampaign('campaign-1')).rejects.toThrow('Campaign cannot be sent in current status');
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        recipients: [
          { status: EmailRecipientStatus.SENT },
          { status: EmailRecipientStatus.SENT, openedAt: new Date() },
          { status: EmailRecipientStatus.SENT, clickedAt: new Date() },
          { status: EmailRecipientStatus.BOUNCED },
        ],
      };

      mockPrisma.emailCampaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await emailMarketingService.getCampaignAnalytics('campaign-1');

      expect(result).toEqual({
        campaignId: 'campaign-1',
        sent: 3,
        delivered: 0,
        opened: 1,
        clicked: 1,
        bounced: 1,
        unsubscribed: 0,
        spamReports: 0,
        date: expect.any(Date),
      });
    });

    it('should throw error when campaign not found', async () => {
      mockPrisma.emailCampaign.findUnique.mockResolvedValue(null);

      await expect(emailMarketingService.getCampaignAnalytics('nonexistent')).rejects.toThrow('Campaign not found');
    });
  });

  describe('createSegment', () => {
    it('should create email segment successfully', async () => {
      const segmentData = {
        name: 'Test Segment',
        description: 'Test segment description',
        criteria: [
          { field: 'email', operator: 'contains', value: '@example.com' },
        ],
        siteId: 'site-1',
      };

      const mockSegment = {
        id: 'segment-1',
        ...segmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.marketingAutomation.create.mockResolvedValue(mockSegment);

      const result = await emailMarketingService.createSegment(
        segmentData.name,
        segmentData.description,
        segmentData.criteria,
        segmentData.siteId
      );

      expect(mockPrisma.marketingAutomation.create).toHaveBeenCalledWith({
        data: {
          name: segmentData.name,
          description: segmentData.description,
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          status: MarketingAutomationStatus.ACTIVE,
          metadata: {
            criteria: segmentData.criteria,
            segmentType: 'email',
          },
          siteId: segmentData.siteId,
        },
      });

      expect(result).toEqual(mockSegment);
    });
  });

  describe('getSegments', () => {
    it('should return email segments for a site', async () => {
      const mockSegments = [
        {
          id: 'segment-1',
          name: 'Test Segment 1',
          description: 'Test description 1',
          metadata: { criteria: [{ field: 'email', operator: 'contains', value: '@example.com' }] },
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.marketingAutomation.findMany.mockResolvedValue(mockSegments);

      const result = await emailMarketingService.getSegments('site-1');

      expect(mockPrisma.marketingAutomation.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          metadata: {
            path: ['segmentType'],
            equals: 'email',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([
        {
          id: 'segment-1',
          name: 'Test Segment 1',
          description: 'Test description 1',
          criteria: [{ field: 'email', operator: 'contains', value: '@example.com' }],
          siteId: 'site-1',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ]);
    });
  });

  describe('createWorkflow', () => {
    it('should create email workflow successfully', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'Test workflow description',
        trigger: { type: 'signup' },
        conditions: [],
        actions: [{ type: 'send_email', emailTemplateId: 'welcome' }],
        isActive: true,
        siteId: 'site-1',
      };

      const mockWorkflow = {
        id: 'workflow-1',
        ...workflowData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.marketingAutomation.create.mockResolvedValue(mockWorkflow);

      const result = await emailMarketingService.createWorkflow(workflowData);

      expect(mockPrisma.marketingAutomation.create).toHaveBeenCalledWith({
        data: {
          name: workflowData.name,
          description: workflowData.description,
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          status: MarketingAutomationStatus.ACTIVE,
          metadata: {
            trigger: workflowData.trigger,
            conditions: workflowData.conditions,
            actions: workflowData.actions,
            workflowType: 'email',
          },
          siteId: workflowData.siteId,
        },
      });

      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('getWorkflows', () => {
    it('should return email workflows for a site', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          description: 'Test description 1',
          status: MarketingAutomationStatus.ACTIVE,
          metadata: {
            trigger: { type: 'signup' },
            conditions: [],
            actions: [{ type: 'send_email' }],
            workflowType: 'email',
          },
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.marketingAutomation.findMany.mockResolvedValue(mockWorkflows);

      const result = await emailMarketingService.getWorkflows('site-1');

      expect(mockPrisma.marketingAutomation.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          metadata: {
            path: ['workflowType'],
            equals: 'email',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          description: 'Test description 1',
          trigger: { type: 'signup' },
          conditions: [],
          actions: [{ type: 'send_email' }],
          isActive: true,
          siteId: 'site-1',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ]);
    });
  });

  describe('trackEmailEvent', () => {
    it('should track email open event', async () => {
      mockPrisma.emailCampaignRecipient.update.mockResolvedValue({});

      await emailMarketingService.trackEmailEvent('recipient-1', 'open');

      expect(mockPrisma.emailCampaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: {
          openedAt: expect.any(Date),
        },
      });
    });

    it('should track email click event', async () => {
      mockPrisma.emailCampaignRecipient.update.mockResolvedValue({});

      await emailMarketingService.trackEmailEvent('recipient-1', 'click');

      expect(mockPrisma.emailCampaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: {
          clickedAt: expect.any(Date),
        },
      });
    });

    it('should track email bounce event', async () => {
      mockPrisma.emailCampaignRecipient.update.mockResolvedValue({});

      await emailMarketingService.trackEmailEvent('recipient-1', 'bounce');

      expect(mockPrisma.emailCampaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: {
          bouncedAt: expect.any(Date),
          status: EmailRecipientStatus.BOUNCED,
        },
      });
    });

    it('should track email unsubscribe event', async () => {
      mockPrisma.emailCampaignRecipient.update.mockResolvedValue({});

      await emailMarketingService.trackEmailEvent('recipient-1', 'unsubscribe');

      expect(mockPrisma.emailCampaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: {
          status: EmailRecipientStatus.UNSUBSCRIBED,
        },
      });
    });
  });

  describe('getEmailTemplates', () => {
    it('should return email templates', async () => {
      const result = await emailMarketingService.getEmailTemplates('site-1');

      expect(result).toEqual([
        {
          id: 'welcome',
          name: 'Welcome Email',
          subject: 'Welcome to our platform!',
          content: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
        },
        {
          id: 'newsletter',
          name: 'Newsletter',
          subject: 'Weekly Newsletter',
          content: '<h1>This Week\'s Updates</h1><p>Here are the latest updates...</p>',
        },
        {
          id: 'promotion',
          name: 'Promotional Email',
          subject: 'Special Offer Just for You!',
          content: '<h1>Limited Time Offer</h1><p>Don\'t miss out on this amazing deal!</p>',
        },
      ]);
    });
  });
}); 