import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/admin/crm/route';
import { crmService } from '@/lib/services/crm';
import { prisma } from '@/lib/prisma';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'user-1', email: 'test@example.com' }
  })),
}));

// Mock the CRM service
jest.mock('@/lib/services/crm', () => ({
  crmService: {
    createLead: jest.fn(),
    getLeads: jest.fn(),
    getLead: jest.fn(),
    updateLead: jest.fn(),
    deleteLead: jest.fn(),
    convertLeadToContact: jest.fn(),
    createContact: jest.fn(),
    getContacts: jest.fn(),
    getContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
    createDeal: jest.fn(),
    getDeals: jest.fn(),
    getDeal: jest.fn(),
    updateDeal: jest.fn(),
    deleteDeal: jest.fn(),
    closeDeal: jest.fn(),
    createInteraction: jest.fn(),
    getInteractions: jest.fn(),
    getInteraction: jest.fn(),
    updateInteraction: jest.fn(),
    deleteInteraction: jest.fn(),
    createCampaign: jest.fn(),
    getCampaigns: jest.fn(),
    getCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    addLeadsToCampaign: jest.fn(),
    addContactsToCampaign: jest.fn(),
    createTask: jest.fn(),
    getTasks: jest.fn(),
    getTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    completeTask: jest.fn(),
    createWorkflow: jest.fn(),
    getWorkflows: jest.fn(),
    getWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    deleteWorkflow: jest.fn(),
    executeWorkflow: jest.fn(),
    getCRMAnalytics: jest.fn(),
    importLeads: jest.fn(),
    importContacts: jest.fn(),
    exportLeads: jest.fn(),
    exportContacts: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

const mockCrmService = crmService as jest.Mocked<typeof crmService>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('CRM API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findFirst = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      siteId: 'site-1',
    });
  });

  describe('GET /api/admin/crm', () => {
    it('should return 401 if not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if siteId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Site ID is required');
    });

    it('should return 403 if user has no access to site', async () => {
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied');
    });

    it('should get leads', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'NEW',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getLeads = jest.fn().mockResolvedValue(mockLeads);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getLeads).toHaveBeenCalledWith('site-1', {
        status: undefined,
        assignedTo: undefined,
        source: undefined,
        score: undefined,
        dateRange: undefined,
      });
      expect(data).toEqual(mockLeads);
    });

    it('should get leads with filters', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'NEW',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getLeads = jest.fn().mockResolvedValue(mockLeads);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/crm?resource=leads&siteId=site-1&status=NEW&assignedTo=user-1&source=website&scoreMin=50&scoreMax=100&startDate=2024-01-01&endDate=2024-12-31'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getLeads).toHaveBeenCalledWith('site-1', {
        status: 'NEW',
        assignedTo: 'user-1',
        source: 'website',
        score: { min: 50, max: 100 },
        dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
      });
      expect(data).toEqual(mockLeads);
    });

    it('should get contacts', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          status: 'ACTIVE',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getContacts = jest.fn().mockResolvedValue(mockContacts);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=contacts&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getContacts).toHaveBeenCalledWith('site-1', {
        status: undefined,
        assignedTo: undefined,
        engagementLevel: undefined,
        dateRange: undefined,
      });
      expect(data).toEqual(mockContacts);
    });

    it('should get deals', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          name: 'Enterprise Deal',
          value: 100000,
          stage: 'NEGOTIATION',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getDeals = jest.fn().mockResolvedValue(mockDeals);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=deals&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getDeals).toHaveBeenCalledWith('site-1', {
        stage: undefined,
        assignedTo: undefined,
        isWon: undefined,
        isLost: undefined,
        dateRange: undefined,
      });
      expect(data).toEqual(mockDeals);
    });

    it('should get interactions', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          type: 'EMAIL',
          subject: 'Follow-up',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getInteractions = jest.fn().mockResolvedValue(mockInteractions);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=interactions&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getInteractions).toHaveBeenCalledWith('site-1', {
        type: undefined,
        leadId: undefined,
        contactId: undefined,
        dealId: undefined,
        initiatedBy: undefined,
        dateRange: undefined,
      });
      expect(data).toEqual(mockInteractions);
    });

    it('should get campaigns', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Q1 Campaign',
          type: 'EMAIL',
          status: 'ACTIVE',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getCampaigns = jest.fn().mockResolvedValue(mockCampaigns);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=campaigns&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getCampaigns).toHaveBeenCalledWith('site-1', {
        type: undefined,
        status: undefined,
        createdBy: undefined,
        dateRange: undefined,
      });
      expect(data).toEqual(mockCampaigns);
    });

    it('should get tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Follow up call',
          type: 'CALL',
          priority: 'HIGH',
          status: 'PENDING',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getTasks = jest.fn().mockResolvedValue(mockTasks);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=tasks&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getTasks).toHaveBeenCalledWith('site-1', {
        type: undefined,
        priority: undefined,
        status: undefined,
        assignedTo: undefined,
        dueDate: undefined,
      });
      expect(data).toEqual(mockTasks);
    });

    it('should get workflows', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Lead Nurturing',
          type: 'LEAD_NURTURING',
          status: 'ACTIVE',
          siteId: 'site-1',
        },
      ];

      mockCrmService.getWorkflows = jest.fn().mockResolvedValue(mockWorkflows);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=workflows&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getWorkflows).toHaveBeenCalledWith('site-1', {
        type: undefined,
        status: undefined,
        createdBy: undefined,
        isActive: undefined,
      });
      expect(data).toEqual(mockWorkflows);
    });

    it('should get analytics', async () => {
      const mockAnalytics = {
        overview: {
          totalLeads: 150,
          convertedLeads: 30,
          leadConversionRate: 20,
        },
        pipeline: [],
        recentActivity: [],
        upcomingTasks: [],
      };

      mockCrmService.getCRMAnalytics = jest.fn().mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=analytics&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.getCRMAnalytics).toHaveBeenCalledWith('site-1', undefined);
      expect(data).toEqual(mockAnalytics);
    });

    it('should return 400 for invalid resource', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=invalid&siteId=site-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid resource');
    });
  });

  describe('POST /api/admin/crm', () => {
    it('should return 401 if not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads', {
        method: 'POST',
        body: JSON.stringify({ siteId: 'site-1' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if siteId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Site ID is required');
    });

    it('should create a lead', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        source: 'website',
        siteId: 'site-1',
      };

      const mockLead = { id: 'lead-1', ...leadData };
      mockCrmService.createLead = jest.fn().mockResolvedValue(mockLead);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createLead).toHaveBeenCalledWith(leadData);
      expect(data).toEqual(mockLead);
    });

    it('should create a contact', async () => {
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        siteId: 'site-1',
      };

      const mockContact = { id: 'contact-1', ...contactData };
      mockCrmService.createContact = jest.fn().mockResolvedValue(mockContact);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=contacts', {
        method: 'POST',
        body: JSON.stringify(contactData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createContact).toHaveBeenCalledWith(contactData);
      expect(data).toEqual(mockContact);
    });

    it('should create a deal', async () => {
      const dealData = {
        name: 'Enterprise Deal',
        value: 100000,
        contactId: 'contact-1',
        siteId: 'site-1',
      };

      const mockDeal = { id: 'deal-1', ...dealData };
      mockCrmService.createDeal = jest.fn().mockResolvedValue(mockDeal);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=deals', {
        method: 'POST',
        body: JSON.stringify(dealData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createDeal).toHaveBeenCalledWith(dealData);
      expect(data).toEqual(mockDeal);
    });

    it('should create an interaction', async () => {
      const interactionData = {
        type: 'EMAIL',
        subject: 'Follow-up',
        channel: 'email',
        siteId: 'site-1',
      };

      const mockInteraction = { id: 'interaction-1', ...interactionData };
      mockCrmService.createInteraction = jest.fn().mockResolvedValue(mockInteraction);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=interactions', {
        method: 'POST',
        body: JSON.stringify(interactionData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createInteraction).toHaveBeenCalledWith(interactionData);
      expect(data).toEqual(mockInteraction);
    });

    it('should create a campaign', async () => {
      const campaignData = {
        name: 'Q1 Campaign',
        type: 'EMAIL',
        createdBy: 'user-1',
        siteId: 'site-1',
      };

      const mockCampaign = { id: 'campaign-1', ...campaignData };
      mockCrmService.createCampaign = jest.fn().mockResolvedValue(mockCampaign);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createCampaign).toHaveBeenCalledWith(campaignData);
      expect(data).toEqual(mockCampaign);
    });

    it('should create a task', async () => {
      const taskData = {
        title: 'Follow up call',
        type: 'CALL',
        siteId: 'site-1',
      };

      const mockTask = { id: 'task-1', ...taskData };
      mockCrmService.createTask = jest.fn().mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createTask).toHaveBeenCalledWith(taskData);
      expect(data).toEqual(mockTask);
    });

    it('should create a workflow', async () => {
      const workflowData = {
        name: 'Lead Nurturing',
        type: 'LEAD_NURTURING',
        triggers: { event: 'lead_created' },
        actions: [{ type: 'create_task' }],
        createdBy: 'user-1',
        siteId: 'site-1',
      };

      const mockWorkflow = { id: 'workflow-1', ...workflowData };
      mockCrmService.createWorkflow = jest.fn().mockResolvedValue(mockWorkflow);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=workflows', {
        method: 'POST',
        body: JSON.stringify(workflowData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.createWorkflow).toHaveBeenCalledWith(workflowData);
      expect(data).toEqual(mockWorkflow);
    });

    it('should convert lead to contact', async () => {
      const convertData = {
        leadId: 'lead-1',
        contactData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          siteId: 'site-1',
        },
        siteId: 'site-1',
      };

      const mockContact = { id: 'contact-1', ...convertData.contactData };
      mockCrmService.convertLeadToContact = jest.fn().mockResolvedValue(mockContact);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=convert-lead', {
        method: 'POST',
        body: JSON.stringify(convertData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.convertLeadToContact).toHaveBeenCalledWith(
        'lead-1',
        'site-1',
        convertData.contactData
      );
      expect(data).toEqual(mockContact);
    });

    it('should add leads to campaign', async () => {
      const campaignData = {
        campaignId: 'campaign-1',
        leadIds: ['lead-1', 'lead-2'],
        siteId: 'site-1',
      };

      const mockCampaignLeads = [
        { id: 'cl-1', campaignId: 'campaign-1', leadId: 'lead-1' },
        { id: 'cl-2', campaignId: 'campaign-1', leadId: 'lead-2' },
      ];
      mockCrmService.addLeadsToCampaign = jest.fn().mockResolvedValue(mockCampaignLeads);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=add-leads-to-campaign', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCrmService.addLeadsToCampaign).toHaveBeenCalledWith(
        'campaign-1',
        'site-1',
        ['lead-1', 'lead-2']
      );
      expect(data).toEqual(mockCampaignLeads);
    });

    it('should execute workflow', async () => {
      const workflowData = {
        workflowId: 'workflow-1',
        input: { leadId: 'lead-1' },
        siteId: 'site-1',
      };

      const mockResult = { success: true, executionId: 'exec-1' };
      mockCrmService.executeWorkflow = jest.fn().mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=execute-workflow', {
        method: 'POST',
        body: JSON.stringify(workflowData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.executeWorkflow).toHaveBeenCalledWith(
        'workflow-1',
        'site-1',
        { leadId: 'lead-1' }
      );
      expect(data).toEqual(mockResult);
    });
  });

  describe('PUT /api/admin/crm', () => {
    it('should return 401 if not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&id=lead-1', {
        method: 'PUT',
        body: JSON.stringify({ siteId: 'site-1' }),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads', {
        method: 'PUT',
        body: JSON.stringify({ siteId: 'site-1' }),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Resource ID is required');
    });

    it('should update a lead', async () => {
      const updateData = {
        score: 85,
        status: 'QUALIFIED',
        siteId: 'site-1',
      };

      const mockLead = { id: 'lead-1', ...updateData };
      mockCrmService.updateLead = jest.fn().mockResolvedValue(mockLead);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&id=lead-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.updateLead).toHaveBeenCalledWith('lead-1', 'site-1', updateData);
      expect(data).toEqual(mockLead);
    });

    it('should close a deal as won', async () => {
      const closeData = {
        isWon: true,
        siteId: 'site-1',
      };

      const mockDeal = { id: 'deal-1', isWon: true, stage: 'CLOSED_WON' };
      mockCrmService.closeDeal = jest.fn().mockResolvedValue(mockDeal);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=close-deal&id=deal-1', {
        method: 'PUT',
        body: JSON.stringify(closeData),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.closeDeal).toHaveBeenCalledWith('deal-1', 'site-1', true, undefined);
      expect(data).toEqual(mockDeal);
    });

    it('should close a deal as lost', async () => {
      const closeData = {
        isWon: false,
        reason: 'Budget constraints',
        siteId: 'site-1',
      };

      const mockDeal = { id: 'deal-1', isWon: false, stage: 'CLOSED_LOST', lostReason: 'Budget constraints' };
      mockCrmService.closeDeal = jest.fn().mockResolvedValue(mockDeal);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=close-deal&id=deal-1', {
        method: 'PUT',
        body: JSON.stringify(closeData),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.closeDeal).toHaveBeenCalledWith('deal-1', 'site-1', false, 'Budget constraints');
      expect(data).toEqual(mockDeal);
    });

    it('should complete a task', async () => {
      const completeData = {
        siteId: 'site-1',
      };

      const mockTask = { id: 'task-1', status: 'COMPLETED', completedAt: new Date() };
      mockCrmService.completeTask = jest.fn().mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=complete-task&id=task-1', {
        method: 'PUT',
        body: JSON.stringify(completeData),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.completeTask).toHaveBeenCalledWith('task-1', 'site-1');
      expect(data).toEqual(mockTask);
    });
  });

  describe('DELETE /api/admin/crm', () => {
    it('should return 401 if not authenticated', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&id=lead-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if id or siteId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&id=lead-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Resource ID and Site ID are required');
    });

    it('should delete a lead', async () => {
      const mockLead = { id: 'lead-1', firstName: 'John', lastName: 'Doe' };
      mockCrmService.deleteLead = jest.fn().mockResolvedValue(mockLead);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=leads&id=lead-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteLead).toHaveBeenCalledWith('lead-1', 'site-1');
      expect(data).toEqual({ success: true });
    });

    it('should delete a contact', async () => {
      const mockContact = { id: 'contact-1', firstName: 'Jane', lastName: 'Smith' };
      mockCrmService.deleteContact = jest.fn().mockResolvedValue(mockContact);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=contacts&id=contact-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteContact).toHaveBeenCalledWith('contact-1', 'site-1');
      expect(data).toEqual({ success: true });
    });

    it('should delete a deal', async () => {
      const mockDeal = { id: 'deal-1', name: 'Enterprise Deal' };
      mockCrmService.deleteDeal = jest.fn().mockResolvedValue(mockDeal);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=deals&id=deal-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteDeal).toHaveBeenCalledWith('deal-1', 'site-1');
      expect(data).toEqual({ success: true });
    });

    it('should delete an interaction', async () => {
      const mockInteraction = { id: 'interaction-1', type: 'EMAIL' };
      mockCrmService.deleteInteraction = jest.fn().mockResolvedValue(mockInteraction);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=interactions&id=interaction-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteInteraction).toHaveBeenCalledWith('interaction-1', 'site-1');
      expect(data).toEqual({ success: true });
    });

    it('should delete a campaign', async () => {
      const mockCampaign = { id: 'campaign-1', name: 'Q1 Campaign' };
      mockCrmService.deleteCampaign = jest.fn().mockResolvedValue(mockCampaign);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=campaigns&id=campaign-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteCampaign).toHaveBeenCalledWith('campaign-1', 'site-1');
      expect(data).toEqual({ success: true });
    });

    it('should delete a task', async () => {
      const mockTask = { id: 'task-1', title: 'Follow up call' };
      mockCrmService.deleteTask = jest.fn().mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=tasks&id=task-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteTask).toHaveBeenCalledWith('task-1', 'site-1');
      expect(data).toEqual({ success: true });
    });

    it('should delete a workflow', async () => {
      const mockWorkflow = { id: 'workflow-1', name: 'Lead Nurturing' };
      mockCrmService.deleteWorkflow = jest.fn().mockResolvedValue(mockWorkflow);

      const request = new NextRequest('http://localhost:3000/api/admin/crm?resource=workflows&id=workflow-1&siteId=site-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCrmService.deleteWorkflow).toHaveBeenCalledWith('workflow-1', 'site-1');
      expect(data).toEqual({ success: true });
    });
  });
}); 