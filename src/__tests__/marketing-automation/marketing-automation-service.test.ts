import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MarketingAutomationService } from '@/lib/services/marketing-automation';
import { 
  MarketingAutomationType,
  MarketingAutomationStatus,
  MarketingAutomationExecutionStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    marketingAutomation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    marketingAutomationExecution: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
    },
  },
}));

describe('MarketingAutomationService', () => {
  let marketingAutomationService: MarketingAutomationService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    marketingAutomationService = new MarketingAutomationService();
    jest.clearAllMocks();
  });

  describe('createAutomationWorkflow', () => {
    it('should create a new automation workflow', async () => {
      const siteId = 'site-1';
      const createdBy = 'user-1';
      const workflow = {
        name: 'Welcome Email Series',
        description: 'Automated welcome emails for new leads',
        type: MarketingAutomationType.LEAD_NURTURING,
        triggers: [
          { type: 'lead_created', conditions: { source: 'website' } },
        ],
        actions: [
          { type: 'send_email', parameters: { template: 'welcome-1' } },
        ],
        conditions: {},
        isActive: true,
      };

      const mockAutomation = {
        id: 'workflow-1',
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        status: MarketingAutomationStatus.DRAFT,
        triggers: workflow.triggers,
        actions: workflow.actions,
        conditions: workflow.conditions,
        isActive: workflow.isActive,
        siteId,
        createdBy,
      };

      mockPrisma.marketingAutomation.create.mockResolvedValue(mockAutomation);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await marketingAutomationService.createAutomationWorkflow(siteId, workflow, createdBy);

      expect(mockPrisma.marketingAutomation.create).toHaveBeenCalledWith({
        data: {
          name: workflow.name,
          description: workflow.description,
          type: workflow.type,
          status: MarketingAutomationStatus.DRAFT,
          triggers: workflow.triggers,
          actions: workflow.actions,
          conditions: workflow.conditions,
          isActive: workflow.isActive,
          siteId,
          createdBy,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'automation_workflow_created',
          value: 1,
          date: expect.any(Date),
          siteId,
          metadata: { workflowId: mockAutomation.id, type: workflow.type },
        },
      });

      expect(result).toEqual(mockAutomation);
    });

    it('should throw error for missing triggers', async () => {
      const siteId = 'site-1';
      const createdBy = 'user-1';
      const workflow = {
        name: 'Invalid Workflow',
        type: MarketingAutomationType.LEAD_NURTURING,
        triggers: [],
        actions: [{ type: 'send_email', parameters: {} }],
        conditions: {},
        isActive: true,
      };

      await expect(marketingAutomationService.createAutomationWorkflow(siteId, workflow, createdBy))
        .rejects.toThrow('Automation workflow must have at least one trigger');
    });

    it('should throw error for missing actions', async () => {
      const siteId = 'site-1';
      const createdBy = 'user-1';
      const workflow = {
        name: 'Invalid Workflow',
        type: MarketingAutomationType.LEAD_NURTURING,
        triggers: [{ type: 'lead_created', conditions: {} }],
        actions: [],
        conditions: {},
        isActive: true,
      };

      await expect(marketingAutomationService.createAutomationWorkflow(siteId, workflow, createdBy))
        .rejects.toThrow('Automation workflow must have at least one action');
    });
  });

  describe('getAutomationWorkflows', () => {
    it('should get automation workflows for a site', async () => {
      const siteId = 'site-1';
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Workflow 1',
          type: MarketingAutomationType.LEAD_NURTURING,
          status: MarketingAutomationStatus.ACTIVE,
          createdUser: { name: 'User 1' },
          executions: [],
        },
        {
          id: 'workflow-2',
          name: 'Workflow 2',
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          status: MarketingAutomationStatus.DRAFT,
          createdUser: { name: 'User 2' },
          executions: [],
        },
      ];

      mockPrisma.marketingAutomation.findMany.mockResolvedValue(mockWorkflows);

      const result = await marketingAutomationService.getAutomationWorkflows(siteId);

      expect(mockPrisma.marketingAutomation.findMany).toHaveBeenCalledWith({
        where: { siteId },
        include: {
          createdUser: true,
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockWorkflows);
    });

    it('should filter by status when provided', async () => {
      const siteId = 'site-1';
      const status = MarketingAutomationStatus.ACTIVE;

      mockPrisma.marketingAutomation.findMany.mockResolvedValue([]);

      await marketingAutomationService.getAutomationWorkflows(siteId, status);

      expect(mockPrisma.marketingAutomation.findMany).toHaveBeenCalledWith({
        where: { siteId, status },
        include: {
          createdUser: true,
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getAutomationWorkflow', () => {
    it('should get automation workflow by ID', async () => {
      const workflowId = 'workflow-1';
      const mockWorkflow = {
        id: workflowId,
        name: 'Workflow 1',
        type: MarketingAutomationType.LEAD_NURTURING,
        status: MarketingAutomationStatus.ACTIVE,
        createdUser: { name: 'User 1' },
        executions: [],
      };

      mockPrisma.marketingAutomation.findUnique.mockResolvedValue(mockWorkflow);

      const result = await marketingAutomationService.getAutomationWorkflow(workflowId);

      expect(mockPrisma.marketingAutomation.findUnique).toHaveBeenCalledWith({
        where: { id: workflowId },
        include: {
          createdUser: true,
          executions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      expect(result).toEqual(mockWorkflow);
    });

    it('should throw error for non-existent workflow', async () => {
      const workflowId = 'non-existent';

      mockPrisma.marketingAutomation.findUnique.mockResolvedValue(null);

      await expect(marketingAutomationService.getAutomationWorkflow(workflowId))
        .rejects.toThrow('Automation workflow not found');
    });
  });

  describe('updateAutomationStatus', () => {
    it('should update automation workflow status', async () => {
      const workflowId = 'workflow-1';
      const status = MarketingAutomationStatus.ACTIVE;
      const mockWorkflow = {
        id: workflowId,
        status,
        siteId: 'site-1',
      };

      mockPrisma.marketingAutomation.update.mockResolvedValue(mockWorkflow);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await marketingAutomationService.updateAutomationStatus(workflowId, status);

      expect(mockPrisma.marketingAutomation.update).toHaveBeenCalledWith({
        where: { id: workflowId },
        data: { status },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'automation_status_updated',
          value: 1,
          date: expect.any(Date),
          siteId: mockWorkflow.siteId,
          metadata: { workflowId, status },
        },
      });

      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('executeAutomationWorkflow', () => {
    it('should execute automation workflow successfully', async () => {
      const workflowId = 'workflow-1';
      const trigger = 'lead_created';
      const input = { leadId: 'lead-1' };

      const mockWorkflow = {
        id: workflowId,
        isActive: true,
        status: MarketingAutomationStatus.ACTIVE,
        siteId: 'site-1',
        actions: [
          { type: 'send_email', parameters: { template: 'welcome-1' } },
        ],
      };

      const mockExecution = {
        id: 'execution-1',
        status: MarketingAutomationExecutionStatus.RUNNING,
        trigger,
        input,
        automationId: workflowId,
        siteId: 'site-1',
      };

      mockPrisma.marketingAutomation.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.marketingAutomationExecution.create.mockResolvedValue(mockExecution);
      mockPrisma.marketingAutomationExecution.update.mockResolvedValue({
        ...mockExecution,
        status: MarketingAutomationExecutionStatus.COMPLETED,
        output: { send_email: { sent: true } },
        completedAt: new Date(),
      });
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await marketingAutomationService.executeAutomationWorkflow(workflowId, trigger, input);

      expect(mockPrisma.marketingAutomationExecution.create).toHaveBeenCalledWith({
        data: {
          status: MarketingAutomationExecutionStatus.RUNNING,
          trigger,
          input,
          automationId: workflowId,
          siteId: mockWorkflow.siteId,
        },
      });

      expect(result).toHaveProperty('executionId', mockExecution.id);
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('output');
    });

    it('should handle workflow execution failure', async () => {
      const workflowId = 'workflow-1';
      const trigger = 'lead_created';

      const mockWorkflow = {
        id: workflowId,
        isActive: true,
        status: MarketingAutomationStatus.ACTIVE,
        siteId: 'site-1',
        actions: [
          { type: 'send_email', parameters: { template: 'welcome-1' } },
        ],
      };

      const mockExecution = {
        id: 'execution-1',
        status: MarketingAutomationExecutionStatus.RUNNING,
        trigger,
        automationId: workflowId,
        siteId: 'site-1',
      };

      mockPrisma.marketingAutomation.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.marketingAutomationExecution.create.mockResolvedValue(mockExecution);
      mockPrisma.marketingAutomationExecution.update.mockResolvedValue({
        ...mockExecution,
        status: MarketingAutomationExecutionStatus.FAILED,
        error: 'Email service unavailable',
        completedAt: new Date(),
      });

      await expect(marketingAutomationService.executeAutomationWorkflow(workflowId, trigger))
        .rejects.toThrow('Email service unavailable');
    });

    it('should throw error for inactive workflow', async () => {
      const workflowId = 'workflow-1';
      const trigger = 'lead_created';

      const mockWorkflow = {
        id: workflowId,
        isActive: false,
        status: MarketingAutomationStatus.DRAFT,
        siteId: 'site-1',
        actions: [],
      };

      mockPrisma.marketingAutomation.findUnique.mockResolvedValue(mockWorkflow);

      await expect(marketingAutomationService.executeAutomationWorkflow(workflowId, trigger))
        .rejects.toThrow('Automation workflow is not active');
    });
  });

  describe('getAutomationAnalytics', () => {
    it('should get automation analytics', async () => {
      const workflowId = 'workflow-1';
      const mockWorkflow = {
        id: workflowId,
        executions: [
          {
            id: 'exec-1',
            status: MarketingAutomationExecutionStatus.COMPLETED,
            startedAt: new Date('2024-01-01T10:00:00Z'),
            completedAt: new Date('2024-01-01T10:01:00Z'),
          },
          {
            id: 'exec-2',
            status: MarketingAutomationExecutionStatus.COMPLETED,
            startedAt: new Date('2024-01-01T11:00:00Z'),
            completedAt: new Date('2024-01-01T11:02:00Z'),
          },
          {
            id: 'exec-3',
            status: MarketingAutomationExecutionStatus.FAILED,
            startedAt: new Date('2024-01-01T12:00:00Z'),
            completedAt: new Date('2024-01-01T12:00:30Z'),
          },
        ],
      };

      mockPrisma.marketingAutomation.findUnique.mockResolvedValue(mockWorkflow);

      const result = await marketingAutomationService.getAutomationAnalytics(workflowId);

      expect(result).toHaveProperty('workflowId', workflowId);
      expect(result).toHaveProperty('totalExecutions', 3);
      expect(result).toHaveProperty('successfulExecutions', 2);
      expect(result).toHaveProperty('failedExecutions', 1);
      expect(result).toHaveProperty('successRate', 66.66666666666666);
      expect(result).toHaveProperty('averageExecutionTime');
      expect(result).toHaveProperty('performanceMetrics');
    });
  });

  describe('getAutomationTemplates', () => {
    it('should get automation templates', async () => {
      const result = await marketingAutomationService.getAutomationTemplates();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('triggers');
        expect(template).toHaveProperty('actions');
        expect(template).toHaveProperty('estimatedDuration');
        expect(template).toHaveProperty('successRate');
        expect(template).toHaveProperty('complexity');
        expect(template).toHaveProperty('bestPractices');
        expect(template).toHaveProperty('useCases');

        expect(Array.isArray(template.triggers)).toBe(true);
        expect(Array.isArray(template.actions)).toBe(true);
        expect(Array.isArray(template.bestPractices)).toBe(true);
        expect(Array.isArray(template.useCases)).toBe(true);
        expect(typeof template.estimatedDuration).toBe('number');
        expect(typeof template.successRate).toBe('number');
        expect(['simple', 'medium', 'complex']).toContain(template.complexity);
      });
    });
  });

  describe('createAutomationTemplate', () => {
    it('should create automation template', async () => {
      const template = {
        name: 'Custom Template',
        description: 'A custom automation template',
        type: MarketingAutomationType.LEAD_NURTURING,
        category: 'Lead Management',
        triggers: [{ type: 'lead_created', conditions: {} }],
        actions: [{ type: 'send_email', parameters: {} }],
        estimatedDuration: 7,
        successRate: 85,
        complexity: 'simple' as const,
        bestPractices: ['Best practice 1'],
        useCases: ['Use case 1'],
      };

      const result = await marketingAutomationService.createAutomationTemplate(template);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', template.name);
      expect(result).toHaveProperty('description', template.description);
      expect(result).toHaveProperty('type', template.type);
      expect(result).toHaveProperty('category', template.category);
      expect(result).toHaveProperty('triggers', template.triggers);
      expect(result).toHaveProperty('actions', template.actions);
      expect(result).toHaveProperty('estimatedDuration', template.estimatedDuration);
      expect(result).toHaveProperty('successRate', template.successRate);
      expect(result).toHaveProperty('complexity', template.complexity);
      expect(result).toHaveProperty('bestPractices', template.bestPractices);
      expect(result).toHaveProperty('useCases', template.useCases);
    });
  });

  describe('getAutomationExecutions', () => {
    it('should get automation executions', async () => {
      const workflowId = 'workflow-1';
      const limit = 10;
      const mockExecutions = [
        {
          id: 'exec-1',
          status: MarketingAutomationExecutionStatus.COMPLETED,
          trigger: 'lead_created',
          startedAt: new Date(),
        },
        {
          id: 'exec-2',
          status: MarketingAutomationExecutionStatus.FAILED,
          trigger: 'lead_created',
          startedAt: new Date(),
        },
      ];

      mockPrisma.marketingAutomationExecution.findMany.mockResolvedValue(mockExecutions);

      const result = await marketingAutomationService.getAutomationExecutions(workflowId, limit);

      expect(mockPrisma.marketingAutomationExecution.findMany).toHaveBeenCalledWith({
        where: { automationId: workflowId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      expect(result).toEqual(mockExecutions);
    });
  });

  describe('monitorAutomationWorkflows', () => {
    it('should monitor automation workflows', async () => {
      const siteId = 'site-1';
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Workflow 1',
          status: MarketingAutomationStatus.ACTIVE,
          isActive: true,
          siteId,
          executions: [
            {
              id: 'exec-1',
              status: MarketingAutomationExecutionStatus.COMPLETED,
              startedAt: new Date(),
            },
          ],
        },
      ];

      mockPrisma.marketingAutomation.findMany.mockResolvedValue(mockWorkflows);

      const result = await marketingAutomationService.monitorAutomationWorkflows(siteId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('workflowId', 'workflow-1');
      expect(result[0]).toHaveProperty('workflowName', 'Workflow 1');
      expect(result[0]).toHaveProperty('status', MarketingAutomationStatus.ACTIVE);
      expect(result[0]).toHaveProperty('isActive', true);
      expect(result[0]).toHaveProperty('analytics');
      expect(result[0]).toHaveProperty('recentExecutions');
    });
  });

  describe('private methods', () => {
    it('should execute send email action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'send_email',
        parameters: { template: 'welcome-1', recipient: 'test@example.com', subject: 'Welcome' },
      };
      const input = { leadId: 'lead-1' };

      const result = await service.executeSendEmailAction(action, input);

      expect(result).toHaveProperty('sent', true);
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('recipient', 'test@example.com');
      expect(result).toHaveProperty('subject', 'Welcome');
      expect(result).toHaveProperty('template', 'welcome-1');
      expect(result).toHaveProperty('sentAt');
    });

    it('should execute send SMS action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'send_sms',
        parameters: { phoneNumber: '+1234567890', message: 'Welcome!' },
      };

      const result = await service.executeSendSMSAction(action);

      expect(result).toHaveProperty('sent', true);
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('phoneNumber', '+1234567890');
      expect(result).toHaveProperty('message', 'Welcome!');
      expect(result).toHaveProperty('sentAt');
    });

    it('should execute create task action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'create_task',
        parameters: { title: 'Follow up', description: 'Follow up with lead', assignee: 'user-1' },
      };

      const result = await service.executeCreateTaskAction(action);

      expect(result).toHaveProperty('created', true);
      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('title', 'Follow up');
      expect(result).toHaveProperty('description', 'Follow up with lead');
      expect(result).toHaveProperty('assignee', 'user-1');
      expect(result).toHaveProperty('createdAt');
    });

    it('should execute update lead action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'update_lead',
        parameters: { leadId: 'lead-1', updates: { status: 'qualified' } },
      };

      const result = await service.executeUpdateLeadAction(action);

      expect(result).toHaveProperty('updated', true);
      expect(result).toHaveProperty('leadId', 'lead-1');
      expect(result).toHaveProperty('updates', { status: 'qualified' });
      expect(result).toHaveProperty('updatedAt');
    });

    it('should execute add to segment action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'add_to_segment',
        parameters: { leadId: 'lead-1', segmentId: 'segment-1' },
      };

      const result = await service.executeAddToSegmentAction(action);

      expect(result).toHaveProperty('added', true);
      expect(result).toHaveProperty('leadId', 'lead-1');
      expect(result).toHaveProperty('segmentId', 'segment-1');
      expect(result).toHaveProperty('addedAt');
    });

    it('should execute remove from segment action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'remove_from_segment',
        parameters: { leadId: 'lead-1', segmentId: 'segment-1' },
      };

      const result = await service.executeRemoveFromSegmentAction(action);

      expect(result).toHaveProperty('removed', true);
      expect(result).toHaveProperty('leadId', 'lead-1');
      expect(result).toHaveProperty('segmentId', 'segment-1');
      expect(result).toHaveProperty('removedAt');
    });

    it('should execute post social action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'post_social',
        parameters: { platform: 'twitter', content: 'Hello world!' },
      };

      const result = await service.executePostSocialAction(action);

      expect(result).toHaveProperty('posted', true);
      expect(result).toHaveProperty('postId');
      expect(result).toHaveProperty('platform', 'twitter');
      expect(result).toHaveProperty('content', 'Hello world!');
      expect(result).toHaveProperty('postedAt');
    });

    it('should execute create campaign action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'create_campaign',
        parameters: { name: 'Summer Sale', type: 'email', targetAudience: 'all', budget: 1000 },
      };

      const result = await service.executeCreateCampaignAction(action);

      expect(result).toHaveProperty('created', true);
      expect(result).toHaveProperty('campaignId');
      expect(result).toHaveProperty('name', 'Summer Sale');
      expect(result).toHaveProperty('type', 'email');
      expect(result).toHaveProperty('targetAudience', 'all');
      expect(result).toHaveProperty('budget', 1000);
      expect(result).toHaveProperty('createdAt');
    });

    it('should execute send webhook action', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'send_webhook',
        parameters: { url: 'https://api.example.com/webhook', method: 'POST', body: { data: 'test' } },
      };

      const result = await service.executeSendWebhookAction(action);

      expect(result).toHaveProperty('sent', true);
      expect(result).toHaveProperty('webhookId');
      expect(result).toHaveProperty('url', 'https://api.example.com/webhook');
      expect(result).toHaveProperty('method', 'POST');
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('sentAt');
    });

    it('should throw error for unsupported action type', async () => {
      const service = marketingAutomationService as any;
      const action = {
        type: 'unsupported_action',
        parameters: {},
      };

      await expect(service.executeAction(action))
        .rejects.toThrow('Unsupported action type: unsupported_action');
    });
  });
}); 