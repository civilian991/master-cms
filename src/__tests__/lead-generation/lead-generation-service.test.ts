import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LeadGenerationService } from '@/lib/services/lead-generation';
import { LeadStatus, ContactStatus, TaskType, TaskPriority, TaskStatus } from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contact: {
      create: jest.fn(),
    },
    deal: {
      create: jest.fn(),
    },
    task: {
      create: jest.fn(),
    },
    marketingAutomation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    marketingLeadActivity: {
      create: jest.fn(),
    },
    interaction: {
      deleteMany: jest.fn(),
    },
    campaignLead: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('LeadGenerationService', () => {
  let leadGenerationService: LeadGenerationService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    leadGenerationService = new LeadGenerationService();
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead with calculated score', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Tech Corp',
        jobTitle: 'Manager',
        website: 'https://techcorp.com',
        phone: '+1234567890',
        industry: 'Technology',
        companySize: '51-200',
        budget: '$50k-$100k',
        timeline: '1-3 months',
        source: 'website',
        siteId: 'site-1',
      };

      const mockLead = {
        id: 'lead-1',
        ...leadData,
        score: 85,
        status: LeadStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.lead.create.mockResolvedValue(mockLead);

      const result = await leadGenerationService.createLead(leadData);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: {
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          jobTitle: leadData.jobTitle,
          website: leadData.website,
          industry: leadData.industry,
          companySize: leadData.companySize,
          budget: leadData.budget,
          timeline: leadData.timeline,
          source: leadData.source,
          sourceDetails: {},
          score: expect.any(Number),
          status: LeadStatus.NEW,
          siteId: leadData.siteId,
          assignedTo: undefined,
        },
      });

      expect(result).toEqual(mockLead);
    });

    it('should calculate score based on lead data', async () => {
      const leadData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        source: 'referral',
        siteId: 'site-1',
      };

      const mockLead = {
        id: 'lead-2',
        ...leadData,
        score: 25, // referral source gets 25 points
        status: LeadStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.lead.create.mockResolvedValue(mockLead);

      const result = await leadGenerationService.createLead(leadData);

      expect(result.score).toBe(25);
    });
  });

  describe('updateLeadScore', () => {
    it('should update lead score successfully', async () => {
      const mockLead = {
        id: 'lead-1',
        score: 50,
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, score: 75 });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.updateLeadScore('lead-1', 25, 'Test reason');

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { score: 75 },
      });

      expect(mockPrisma.marketingLeadActivity.create).toHaveBeenCalledWith({
        data: {
          type: 'SCORE_CHANGE',
          description: 'Test reason',
          metadata: {
            oldScore: 50,
            newScore: 75,
            change: 25,
            reason: 'Test reason',
          },
          leadId: 'lead-1',
          siteId: 'site-1',
        },
      });

      expect(result).toEqual({ success: true, newScore: 75 });
    });

    it('should cap score at 100', async () => {
      const mockLead = {
        id: 'lead-1',
        score: 90,
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, score: 100 });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.updateLeadScore('lead-1', 20);

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { score: 100 },
      });

      expect(result.newScore).toBe(100);
    });

    it('should not allow negative scores', async () => {
      const mockLead = {
        id: 'lead-1',
        score: 10,
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, score: 0 });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.updateLeadScore('lead-1', -20);

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { score: 0 },
      });

      expect(result.newScore).toBe(0);
    });
  });

  describe('qualifyLead', () => {
    it('should qualify a lead successfully', async () => {
      const mockLead = {
        id: 'lead-1',
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, status: LeadStatus.QUALIFIED });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.qualifyLead('lead-1', {
        isQualified: true,
        qualificationScore: 80,
        qualificationNotes: 'High potential lead',
        assignedTo: 'user-1',
      });

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: {
          status: LeadStatus.QUALIFIED,
          assignedTo: 'user-1',
          score: 80,
        },
      });

      expect(mockPrisma.marketingLeadActivity.create).toHaveBeenCalledWith({
        data: {
          type: 'LEAD_QUALIFIED',
          description: 'High potential lead',
          metadata: {
            qualificationScore: 80,
            assignedTo: 'user-1',
          },
          leadId: 'lead-1',
          siteId: 'site-1',
        },
      });

      expect(result).toEqual({ success: true });
    });

    it('should disqualify a lead successfully', async () => {
      const mockLead = {
        id: 'lead-1',
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, status: LeadStatus.DISQUALIFIED });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.qualifyLead('lead-1', {
        isQualified: false,
        qualificationNotes: 'Not a good fit',
      });

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: {
          status: LeadStatus.DISQUALIFIED,
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('convertLead', () => {
    it('should convert lead to contact with deal', async () => {
      const mockLead = {
        id: 'lead-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        jobTitle: 'Manager',
        website: 'https://techcorp.com',
        score: 85,
        siteId: 'site-1',
      };

      const mockContact = {
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        jobTitle: 'Manager',
        website: 'https://techcorp.com',
        score: 85,
        status: ContactStatus.ACTIVE,
        engagementLevel: 'HIGH',
        siteId: 'site-1',
      };

      const mockDeal = {
        id: 'deal-1',
        name: 'Tech Corp Deal',
        description: 'New business deal',
        value: 50000,
        stage: 'PROSPECTING',
        probability: 10,
        contactId: 'contact-1',
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.contact.create.mockResolvedValue(mockContact);
      mockPrisma.deal.create.mockResolvedValue(mockDeal);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, status: LeadStatus.CONVERTED });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.convertLead('lead-1', {
        dealValue: 50000,
        dealName: 'Tech Corp Deal',
        dealDescription: 'New business deal',
        assignedTo: 'user-1',
      });

      expect(mockPrisma.contact.create).toHaveBeenCalledWith({
        data: {
          firstName: mockLead.firstName,
          lastName: mockLead.lastName,
          email: mockLead.email,
          phone: mockLead.phone,
          company: mockLead.company,
          jobTitle: mockLead.jobTitle,
          website: mockLead.website,
          score: mockLead.score,
          status: ContactStatus.ACTIVE,
          engagementLevel: 'HIGH',
          siteId: mockLead.siteId,
          assignedTo: 'user-1',
        },
      });

      expect(mockPrisma.deal.create).toHaveBeenCalledWith({
        data: {
          name: 'Tech Corp Deal',
          description: 'New business deal',
          value: 50000,
          stage: 'PROSPECTING',
          probability: 10,
          contactId: 'contact-1',
          siteId: 'site-1',
          assignedTo: 'user-1',
        },
      });

      expect(result).toEqual({ success: true, contact: mockContact, deal: mockDeal });
    });

    it('should convert lead without deal', async () => {
      const mockLead = {
        id: 'lead-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        siteId: 'site-1',
      };

      const mockContact = {
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        siteId: 'site-1',
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.contact.create.mockResolvedValue(mockContact);
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, status: LeadStatus.CONVERTED });
      mockPrisma.marketingLeadActivity.create.mockResolvedValue({});

      const result = await leadGenerationService.convertLead('lead-1', {});

      expect(mockPrisma.deal.create).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, contact: mockContact, deal: null });
    });
  });

  describe('getLeads', () => {
    it('should return leads with default options', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: LeadStatus.NEW,
          siteId: 'site-1',
          assignedUser: null,
          interactions: [],
          tasks: [],
        },
      ];

      mockPrisma.lead.findMany.mockResolvedValue(mockLeads);

      const result = await leadGenerationService.getLeads('site-1');

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        include: {
          assignedUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          tasks: {
            where: { status: TaskStatus.PENDING },
            orderBy: { dueDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockLeads);
    });

    it('should return leads with custom options', async () => {
      const options = {
        status: LeadStatus.QUALIFIED,
        assignedTo: 'user-1',
        source: 'website',
        minScore: 50,
        maxScore: 100,
        limit: 10,
        offset: 20,
      };

      mockPrisma.lead.findMany.mockResolvedValue([]);

      await leadGenerationService.getLeads('site-1', options);

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: LeadStatus.QUALIFIED,
          assignedTo: 'user-1',
          source: 'website',
          score: { gte: 50, lte: 100 },
        },
        include: {
          assignedUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          tasks: {
            where: { status: TaskStatus.PENDING },
            orderBy: { dueDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('getLeadAnalytics', () => {
    it('should return lead analytics', async () => {
      const mockLeads = [
        {
          status: LeadStatus.NEW,
          score: 50,
          source: 'website',
          industry: 'Technology',
          createdAt: new Date('2024-01-01'),
          convertedAt: null,
        },
        {
          status: LeadStatus.QUALIFIED,
          score: 75,
          source: 'referral',
          industry: 'Finance',
          createdAt: new Date('2024-01-02'),
          convertedAt: null,
        },
        {
          status: LeadStatus.CONVERTED,
          score: 90,
          source: 'website',
          industry: 'Technology',
          createdAt: new Date('2024-01-03'),
          convertedAt: new Date('2024-01-10'),
        },
      ];

      mockPrisma.lead.findMany.mockResolvedValue(mockLeads);

      const result = await leadGenerationService.getLeadAnalytics('site-1');

      expect(result).toEqual({
        totalLeads: 3,
        newLeads: 1,
        qualifiedLeads: 1,
        convertedLeads: 1,
        averageScore: 71.67,
        conversionRate: 33.33,
        sourceBreakdown: {
          website: 2,
          referral: 1,
        },
        industryBreakdown: {
          Technology: 2,
          Finance: 1,
        },
        timeToConversion: 7,
        date: expect.any(Date),
      });
    });
  });

  describe('createNurturingWorkflow', () => {
    it('should create nurturing workflow successfully', async () => {
      const workflowData = {
        name: 'Welcome Series',
        description: 'Welcome new leads',
        triggers: [
          {
            type: 'lead_created',
            conditions: [{ field: 'source', operator: 'equals', value: 'website' }],
          },
        ],
        actions: [
          {
            type: 'send_email',
            emailTemplateId: 'welcome',
          },
        ],
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

      const result = await leadGenerationService.createNurturingWorkflow(workflowData);

      expect(mockPrisma.marketingAutomation.create).toHaveBeenCalledWith({
        data: {
          name: workflowData.name,
          description: workflowData.description,
          type: 'LEAD_NURTURING',
          status: 'ACTIVE',
          metadata: {
            triggers: workflowData.triggers,
            actions: workflowData.actions,
            workflowType: 'lead_nurturing',
          },
          siteId: workflowData.siteId,
        },
      });

      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('getNurturingWorkflows', () => {
    it('should return nurturing workflows', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Welcome Series',
          description: 'Welcome new leads',
          status: 'ACTIVE',
          metadata: {
            triggers: [{ type: 'lead_created' }],
            actions: [{ type: 'send_email' }],
            workflowType: 'lead_nurturing',
          },
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.marketingAutomation.findMany.mockResolvedValue(mockWorkflows);

      const result = await leadGenerationService.getNurturingWorkflows('site-1');

      expect(mockPrisma.marketingAutomation.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          type: 'LEAD_NURTURING',
          metadata: {
            path: ['workflowType'],
            equals: 'lead_nurturing',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([
        {
          id: 'workflow-1',
          name: 'Welcome Series',
          description: 'Welcome new leads',
          triggers: [{ type: 'lead_created' }],
          actions: [{ type: 'send_email' }],
          isActive: true,
          siteId: 'site-1',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ]);
    });
  });

  describe('importLeads', () => {
    it('should import leads from CSV', async () => {
      const csvData = `firstName,lastName,email,company,source
John,Doe,john@example.com,Tech Corp,website
Jane,Smith,jane@example.com,Finance Inc,referral`;

      const mockLead1 = { id: 'lead-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      const mockLead2 = { id: 'lead-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' };

      mockPrisma.lead.create
        .mockResolvedValueOnce(mockLead1)
        .mockResolvedValueOnce(mockLead2);

      const result = await leadGenerationService.importLeads('site-1', csvData, { skipHeader: true });

      expect(result).toEqual({
        success: true,
        importedCount: 2,
        leads: [mockLead1, mockLead2],
      });
    });
  });

  describe('exportLeads', () => {
    it('should export leads as CSV', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Tech Corp',
          jobTitle: 'Manager',
          website: 'https://techcorp.com',
          industry: 'Technology',
          companySize: '51-200',
          budget: '$50k-$100k',
          timeline: '1-3 months',
          source: 'website',
          score: 85,
          status: LeadStatus.NEW,
          assignedUser: { firstName: 'Sales', lastName: 'Rep' },
          createdAt: new Date('2024-01-01'),
          lastContacted: new Date('2024-01-02'),
        },
      ];

      mockPrisma.lead.findMany.mockResolvedValue(mockLeads);

      const result = await leadGenerationService.exportLeads('site-1', { format: 'csv' });

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.data).toContain('ID,First Name,Last Name,Email');
      expect(result.data).toContain('lead-1,"John","Doe","john@example.com"');
    });

    it('should export leads as JSON', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      ];

      mockPrisma.lead.findMany.mockResolvedValue(mockLeads);

      const result = await leadGenerationService.exportLeads('site-1', { format: 'json' });

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.data).toEqual(mockLeads);
    });
  });
}); 