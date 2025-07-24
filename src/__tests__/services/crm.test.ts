import { crmService } from '@/lib/services/crm';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      createMany: jest.fn(),
    },
    contact: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    campaign: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    campaignLead: {
      create: jest.fn(),
    },
    campaignContact: {
      create: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflow: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflowExecution: {
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('CRM Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lead Management', () => {
    const mockLead = {
      id: 'lead-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Example Corp',
      jobTitle: 'Manager',
      website: 'https://example.com',
      score: 75,
      status: 'NEW',
      source: 'website',
      sourceDetails: { page: '/contact' },
      industry: 'Technology',
      companySize: '51-200',
      budget: '$50k-$100k',
      timeline: '1-3 months',
      assignedTo: 'user-1',
      lastContacted: new Date(),
      nextFollowUp: new Date(),
      nurtureStage: 'awareness',
      convertedAt: null,
      convertedToContactId: null,
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: null,
      convertedContact: null,
      interactions: [],
      tasks: [],
      campaigns: [],
    };

    it('should create a lead', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        jobTitle: 'Manager',
        website: 'https://example.com',
        score: 75,
        status: 'NEW' as const,
        source: 'website',
        sourceDetails: { page: '/contact' },
        industry: 'Technology',
        companySize: '51-200',
        budget: '$50k-$100k',
        timeline: '1-3 months',
        assignedTo: 'user-1',
        lastContacted: new Date(),
        nextFollowUp: new Date(),
        nurtureStage: 'awareness',
        siteId: 'site-1',
      };

      mockPrisma.lead.create = jest.fn().mockResolvedValue(mockLead);

      const result = await crmService.createLead(leadData);

      expect(mockPrisma.lead.create).toHaveBeenCalled();
      expect(result).toEqual(mockLead);
    });

    it('should get leads with filters', async () => {
      const mockLeads = [mockLead];
      mockPrisma.lead.findMany = jest.fn().mockResolvedValue(mockLeads);

      const filters = {
        status: 'NEW',
        assignedTo: 'user-1',
        source: 'website',
        score: { min: 50, max: 100 },
        dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
      };

      const result = await crmService.getLeads('site-1', filters);

      expect(mockPrisma.lead.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockLeads);
    });

    it('should get a single lead', async () => {
      mockPrisma.lead.findFirst = jest.fn().mockResolvedValue(mockLead);

      const result = await crmService.getLead('lead-1', 'site-1');

      expect(mockPrisma.lead.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockLead);
    });

    it('should update a lead', async () => {
      const updateData = { score: 85, status: 'QUALIFIED' as const };
      const updatedLead = { ...mockLead, ...updateData };
      mockPrisma.lead.update = jest.fn().mockResolvedValue(updatedLead);

      const result = await crmService.updateLead('lead-1', 'site-1', updateData);

      expect(mockPrisma.lead.update).toHaveBeenCalled();
      expect(result).toEqual(updatedLead);
    });

    it('should delete a lead', async () => {
      mockPrisma.lead.delete = jest.fn().mockResolvedValue(mockLead);

      const result = await crmService.deleteLead('lead-1', 'site-1');

      expect(mockPrisma.lead.delete).toHaveBeenCalled();
      expect(result).toEqual(mockLead);
    });
  });

  describe('Contact Management', () => {
    const mockContact = {
      id: 'contact-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      mobile: '+1234567891',
      company: 'Example Corp',
      jobTitle: 'Director',
      department: 'Sales',
      website: 'https://example.com',
      address: { street: '123 Main St', city: 'New York' },
      socialMedia: { linkedin: 'jane-smith' },
      preferences: { email: true, phone: false },
      score: 85,
      status: 'ACTIVE' as const,
      engagementLevel: 'HIGH' as const,
      assignedTo: 'user-1',
      lastContacted: new Date(),
      lastEngaged: new Date(),
      lifetimeValue: 50000,
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: null,
      interactions: [],
      deals: [],
      tasks: [],
      campaigns: [],
      convertedLeads: [],
    };

    it('should create a contact', async () => {
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        mobile: '+1234567891',
        company: 'Example Corp',
        jobTitle: 'Director',
        department: 'Sales',
        website: 'https://example.com',
        address: { street: '123 Main St', city: 'New York' },
        socialMedia: { linkedin: 'jane-smith' },
        preferences: { email: true, phone: false },
        score: 85,
        status: 'ACTIVE' as const,
        engagementLevel: 'HIGH' as const,
        assignedTo: 'user-1',
        lastContacted: new Date(),
        lastEngaged: new Date(),
        lifetimeValue: 50000,
        siteId: 'site-1',
      };

      mockPrisma.contact.create = jest.fn().mockResolvedValue(mockContact);

      const result = await crmService.createContact(contactData);

      expect(mockPrisma.contact.create).toHaveBeenCalled();
      expect(result).toEqual(mockContact);
    });

    it('should get contacts with filters', async () => {
      const mockContacts = [mockContact];
      mockPrisma.contact.findMany = jest.fn().mockResolvedValue(mockContacts);

      const filters = {
        status: 'ACTIVE',
        assignedTo: 'user-1',
        engagementLevel: 'HIGH',
        dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
      };

      const result = await crmService.getContacts('site-1', filters);

      expect(mockPrisma.contact.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockContacts);
    });
  });

  describe('Deal Management', () => {
    const mockDeal = {
      id: 'deal-1',
      name: 'Enterprise Software License',
      description: 'Annual software license for enterprise client',
      value: 100000,
      currency: 'USD' as const,
      stage: 'NEGOTIATION' as const,
      probability: 75,
      expectedCloseDate: new Date('2024-06-30'),
      actualCloseDate: null,
      type: 'new business',
      source: 'lead conversion',
      tags: { industry: 'technology', size: 'enterprise' },
      assignedTo: 'user-1',
      contactId: 'contact-1',
      lastActivity: new Date(),
      nextActivity: new Date(),
      isWon: false,
      isLost: false,
      lostReason: null,
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: null,
      contact: null,
      interactions: [],
      tasks: [],
    };

    it('should create a deal', async () => {
      const dealData = {
        name: 'Enterprise Software License',
        description: 'Annual software license for enterprise client',
        value: 100000,
        currency: 'USD' as const,
        stage: 'NEGOTIATION' as const,
        probability: 75,
        expectedCloseDate: new Date('2024-06-30'),
        type: 'new business',
        source: 'lead conversion',
        tags: { industry: 'technology', size: 'enterprise' },
        assignedTo: 'user-1',
        contactId: 'contact-1',
        lastActivity: new Date(),
        nextActivity: new Date(),
        isWon: false,
        isLost: false,
        siteId: 'site-1',
      };

      mockPrisma.deal.create = jest.fn().mockResolvedValue(mockDeal);

      const result = await crmService.createDeal(dealData);

      expect(mockPrisma.deal.create).toHaveBeenCalled();
      expect(result).toEqual(mockDeal);
    });

    it('should close a deal as won', async () => {
      const closedDeal = { ...mockDeal, isWon: true, stage: 'CLOSED_WON' as const };
      mockPrisma.deal.update = jest.fn().mockResolvedValue(closedDeal);

      const result = await crmService.closeDeal('deal-1', 'site-1', true);

      expect(mockPrisma.deal.update).toHaveBeenCalled();
      expect(result).toEqual(closedDeal);
    });

    it('should close a deal as lost', async () => {
      const closedDeal = { ...mockDeal, isLost: true, stage: 'CLOSED_LOST' as const, lostReason: 'Budget constraints' };
      mockPrisma.deal.update = jest.fn().mockResolvedValue(closedDeal);

      const result = await crmService.closeDeal('deal-1', 'site-1', false, 'Budget constraints');

      expect(mockPrisma.deal.update).toHaveBeenCalled();
      expect(result).toEqual(closedDeal);
    });
  });

  describe('Interaction Management', () => {
    const mockInteraction = {
      id: 'interaction-1',
      type: 'EMAIL' as const,
      subject: 'Follow-up on proposal',
      content: 'Thank you for your interest in our solution...',
      duration: 30,
      leadId: 'lead-1',
      contactId: null,
      dealId: null,
      direction: 'OUTBOUND' as const,
      channel: 'email',
      outcome: 'positive',
      initiatedBy: 'user-1',
      scheduledAt: new Date(),
      completedAt: new Date(),
      requiresFollowUp: true,
      followUpDate: new Date(),
      followUpNotes: 'Schedule demo call',
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      initiatedUser: null,
      lead: null,
      contact: null,
      deal: null,
    };

    it('should create an interaction', async () => {
      const interactionData = {
        type: 'EMAIL' as const,
        subject: 'Follow-up on proposal',
        content: 'Thank you for your interest in our solution...',
        duration: 30,
        leadId: 'lead-1',
        direction: 'OUTBOUND' as const,
        channel: 'email',
        outcome: 'positive',
        initiatedBy: 'user-1',
        scheduledAt: new Date(),
        completedAt: new Date(),
        requiresFollowUp: true,
        followUpDate: new Date(),
        followUpNotes: 'Schedule demo call',
        siteId: 'site-1',
      };

      mockPrisma.interaction.create = jest.fn().mockResolvedValue(mockInteraction);

      const result = await crmService.createInteraction(interactionData);

      expect(mockPrisma.interaction.create).toHaveBeenCalled();
      expect(result).toEqual(mockInteraction);
    });
  });

  describe('Campaign Management', () => {
    const mockCampaign = {
      id: 'campaign-1',
      name: 'Q1 Email Campaign',
      description: 'Email campaign targeting enterprise leads',
      type: 'EMAIL' as const,
      status: 'ACTIVE' as const,
      targetAudience: { industry: 'technology', size: 'enterprise' },
      goals: { leads: 100, conversions: 10 },
      budget: 5000,
      currency: 'USD' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      scheduledAt: new Date(),
      subject: 'Transform Your Business',
      content: 'Discover how our solution can help...',
      template: 'enterprise-email',
      createdBy: 'user-1',
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdUser: null,
      leads: [],
      contacts: [],
      tasks: [],
    };

    it('should create a campaign', async () => {
      const campaignData = {
        name: 'Q1 Email Campaign',
        description: 'Email campaign targeting enterprise leads',
        type: 'EMAIL' as const,
        status: 'ACTIVE' as const,
        targetAudience: { industry: 'technology', size: 'enterprise' },
        goals: { leads: 100, conversions: 10 },
        budget: 5000,
        currency: 'USD' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        scheduledAt: new Date(),
        subject: 'Transform Your Business',
        content: 'Discover how our solution can help...',
        template: 'enterprise-email',
        createdBy: 'user-1',
        siteId: 'site-1',
      };

      mockPrisma.campaign.create = jest.fn().mockResolvedValue(mockCampaign);

      const result = await crmService.createCampaign(campaignData);

      expect(mockPrisma.campaign.create).toHaveBeenCalled();
      expect(result).toEqual(mockCampaign);
    });

    it('should add leads to campaign', async () => {
      const mockCampaignLeads = [
        { id: 'cl-1', campaignId: 'campaign-1', leadId: 'lead-1', siteId: 'site-1' },
        { id: 'cl-2', campaignId: 'campaign-1', leadId: 'lead-2', siteId: 'site-1' },
      ];

      mockPrisma.campaignLead.create = jest.fn()
        .mockResolvedValueOnce(mockCampaignLeads[0])
        .mockResolvedValueOnce(mockCampaignLeads[1]);

      const result = await crmService.addLeadsToCampaign('campaign-1', 'site-1', ['lead-1', 'lead-2']);

      expect(mockPrisma.campaignLead.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('Task Management', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Follow up with John Doe',
      description: 'Call to discuss proposal feedback',
      type: 'CALL' as const,
      priority: 'HIGH' as const,
      status: 'PENDING' as const,
      dueDate: new Date('2024-06-15'),
      completedAt: null,
      reminderAt: new Date('2024-06-14'),
      assignedTo: 'user-1',
      leadId: 'lead-1',
      contactId: null,
      dealId: null,
      campaignId: null,
      tags: { category: 'follow-up' },
      notes: 'Client requested call on Friday',
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: null,
      lead: null,
      contact: null,
      deal: null,
      campaign: null,
    };

    it('should create a task', async () => {
      const taskData = {
        title: 'Follow up with John Doe',
        description: 'Call to discuss proposal feedback',
        type: 'CALL' as const,
        priority: 'HIGH' as const,
        status: 'PENDING' as const,
        dueDate: new Date('2024-06-15'),
        reminderAt: new Date('2024-06-14'),
        assignedTo: 'user-1',
        leadId: 'lead-1',
        tags: { category: 'follow-up' },
        notes: 'Client requested call on Friday',
        siteId: 'site-1',
      };

      mockPrisma.task.create = jest.fn().mockResolvedValue(mockTask);

      const result = await crmService.createTask(taskData);

      expect(mockPrisma.task.create).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should complete a task', async () => {
      const completedTask = { ...mockTask, status: 'COMPLETED' as const, completedAt: new Date() };
      mockPrisma.task.update = jest.fn().mockResolvedValue(completedTask);

      const result = await crmService.completeTask('task-1', 'site-1');

      expect(mockPrisma.task.update).toHaveBeenCalled();
      expect(result).toEqual(completedTask);
    });
  });

  describe('Workflow Management', () => {
    const mockWorkflow = {
      id: 'workflow-1',
      name: 'Lead Nurturing Workflow',
      description: 'Automated lead nurturing sequence',
      type: 'LEAD_NURTURING' as const,
      status: 'ACTIVE' as const,
      triggers: { event: 'lead_created', conditions: { score: { gte: 50 } } },
      conditions: { lead_status: 'NEW' },
      actions: [
        { type: 'create_task', data: { title: 'Follow up', type: 'CALL' } },
        { type: 'send_email', data: { template: 'welcome' } },
      ],
      settings: { delay: 24, max_executions: 5 },
      isActive: true,
      createdBy: 'user-1',
      siteId: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdUser: null,
      executions: [],
    };

    it('should create a workflow', async () => {
      const workflowData = {
        name: 'Lead Nurturing Workflow',
        description: 'Automated lead nurturing sequence',
        type: 'LEAD_NURTURING' as const,
        status: 'ACTIVE' as const,
        triggers: { event: 'lead_created', conditions: { score: { gte: 50 } } },
        conditions: { lead_status: 'NEW' },
        actions: {
          create_task: { title: 'Follow up', type: 'CALL' },
          send_email: { template: 'welcome' },
        },
        settings: { delay: 24, max_executions: 5 },
        isActive: true,
        createdBy: 'user-1',
        siteId: 'site-1',
      };

      mockPrisma.workflow.create = jest.fn().mockResolvedValue(mockWorkflow);

      const result = await crmService.createWorkflow(workflowData);

      expect(mockPrisma.workflow.create).toHaveBeenCalled();
      expect(result).toEqual(mockWorkflow);
    });

    it('should execute a workflow', async () => {
      const mockExecution = {
        id: 'execution-1',
        workflowId: 'workflow-1',
        status: 'COMPLETED',
        trigger: 'manual',
        input: { leadId: 'lead-1' },
        output: { task: { id: 'task-1' } },
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 5,
        error: null,
        retryCount: 0,
        siteId: 'site-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.workflow.findFirst = jest.fn().mockResolvedValue(mockWorkflow);
      mockPrisma.workflowExecution.create = jest.fn().mockResolvedValue(mockExecution);
      mockPrisma.workflowExecution.update = jest.fn().mockResolvedValue(mockExecution);

      const result = await crmService.executeWorkflow('workflow-1', 'site-1', { leadId: 'lead-1' });

      expect(mockPrisma.workflowExecution.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.executionId).toBe('execution-1');
    });
  });

  describe('Analytics', () => {
    it('should get CRM analytics', async () => {
      const mockAnalytics = {
        overview: {
          totalLeads: 150,
          convertedLeads: 30,
          leadConversionRate: 20,
          totalContacts: 200,
          totalDeals: 50,
          wonDeals: 15,
          dealWinRate: 30,
          totalInteractions: 500,
          totalTasks: 75,
          totalCampaigns: 10,
        },
        pipeline: [
          { stage: 'PROSPECTING', _count: { stage: 20 }, _sum: { value: 200000 } },
          { stage: 'QUALIFICATION', _count: { stage: 15 }, _sum: { value: 300000 } },
          { stage: 'NEGOTIATION', _count: { stage: 10 }, _sum: { value: 500000 } },
        ],
        recentActivity: [],
        upcomingTasks: [],
      };

      mockPrisma.lead.count = jest.fn()
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(30);
      mockPrisma.contact.count = jest.fn().mockResolvedValue(200);
      mockPrisma.deal.count = jest.fn()
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(15);
      mockPrisma.interaction.count = jest.fn().mockResolvedValue(500);
      mockPrisma.task.count = jest.fn().mockResolvedValue(75);
      mockPrisma.campaign.count = jest.fn().mockResolvedValue(10);
      mockPrisma.deal.groupBy = jest.fn().mockResolvedValue(mockAnalytics.pipeline);
      mockPrisma.interaction.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.task.findMany = jest.fn().mockResolvedValue([]);

      const result = await crmService.getCRMAnalytics('site-1');

      expect(result.overview.totalLeads).toBe(150);
      expect(result.overview.leadConversionRate).toBe(20);
      expect(result.overview.dealWinRate).toBe(30);
      expect(result.pipeline).toHaveLength(3);
    });
  });

  describe('Data Import/Export', () => {
    it('should import leads', async () => {
      const leads = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          company: 'Example Corp',
          source: 'website',
          siteId: 'site-1',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          company: 'Test Corp',
          source: 'referral',
          siteId: 'site-1',
        },
      ];

      mockPrisma.lead.createMany = jest.fn().mockResolvedValue({ count: 2 });

      const result = await crmService.importLeads('site-1', leads);

      expect(mockPrisma.lead.createMany).toHaveBeenCalled();
      expect(result.count).toBe(2);
    });

    it('should export leads', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Example Corp',
          jobTitle: 'Manager',
          score: 75,
          status: 'NEW',
          source: 'website',
          industry: 'Technology',
          companySize: '51-200',
          budget: '$50k-$100k',
          timeline: '1-3 months',
          assignedTo: 'John Manager',
          createdAt: new Date(),
          lastContacted: new Date(),
        },
      ];

      mockPrisma.lead.findMany = jest.fn().mockResolvedValue(mockLeads);

      const result = await crmService.exportLeads('site-1');

      expect(mockPrisma.lead.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('firstName', 'John');
      expect(result[0]).toHaveProperty('lastName', 'Doe');
      expect(result[0]).toHaveProperty('email', 'john@example.com');
    });
  });
}); 