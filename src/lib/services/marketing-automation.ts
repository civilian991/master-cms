import { prisma } from '../prisma';
import { 
  MarketingAutomationType,
  MarketingAutomationStatus,
  MarketingAutomationExecutionStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Automation Trigger
interface AutomationTrigger {
  type: 'lead_created' | 'lead_scored' | 'lead_converted' | 'email_opened' | 'email_clicked' | 'social_engagement' | 'website_visit' | 'form_submitted' | 'purchase_made' | 'custom';
  conditions: Record<string, any>;
  schedule?: {
    type: 'immediate' | 'delayed' | 'scheduled' | 'recurring';
    delay?: number; // minutes
    schedule?: string; // cron expression
  };
}

// Automation Action
interface AutomationAction {
  type: 'send_email' | 'send_sms' | 'create_task' | 'update_lead' | 'add_to_segment' | 'remove_from_segment' | 'post_social' | 'create_campaign' | 'send_webhook' | 'custom';
  parameters: Record<string, any>;
  delay?: number; // minutes
  conditions?: Record<string, any>;
}

// Automation Workflow
interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  type: MarketingAutomationType;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  conditions?: Record<string, any>;
  isActive: boolean;
  siteId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Automation Execution
interface AutomationExecution {
  id: string;
  automationId: string;
  status: MarketingAutomationExecutionStatus;
  trigger: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  siteId: string;
}

// Automation Analytics
interface AutomationAnalytics {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecution?: Date;
  nextExecution?: Date;
  performanceMetrics: {
    emailsSent: number;
    leadsConverted: number;
    revenueGenerated: number;
    engagementRate: number;
  };
}

// Automation Template
interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  type: MarketingAutomationType;
  category: string;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  estimatedDuration: number;
  successRate: number;
  complexity: 'simple' | 'medium' | 'complex';
  bestPractices: string[];
  useCases: string[];
}

// Marketing Automation Service Class
export class MarketingAutomationService {
  /**
   * Create a new marketing automation workflow
   */
  async createAutomationWorkflow(siteId: string, workflow: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string) {
    try {
      // Validate workflow
      if (!workflow.triggers || workflow.triggers.length === 0) {
        throw new Error('Automation workflow must have at least one trigger');
      }

      if (!workflow.actions || workflow.actions.length === 0) {
        throw new Error('Automation workflow must have at least one action');
      }

      const automation = await prisma.marketingAutomation.create({
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

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'automation_workflow_created',
          value: 1,
          date: new Date(),
          siteId,
          metadata: { workflowId: automation.id, type: workflow.type },
        },
      });

      return automation;
    } catch (error) {
      console.error('Failed to create automation workflow:', error);
      throw error;
    }
  }

  /**
   * Get automation workflows for a site
   */
  async getAutomationWorkflows(siteId: string, status?: MarketingAutomationStatus) {
    try {
      const workflows = await prisma.marketingAutomation.findMany({
        where: {
          siteId,
          ...(status && { status }),
        },
        include: {
          createdUser: true,
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return workflows;
    } catch (error) {
      console.error('Failed to get automation workflows:', error);
      throw error;
    }
  }

  /**
   * Get automation workflow by ID
   */
  async getAutomationWorkflow(workflowId: string) {
    try {
      const workflow = await prisma.marketingAutomation.findUnique({
        where: { id: workflowId },
        include: {
          createdUser: true,
          executions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!workflow) {
        throw new Error('Automation workflow not found');
      }

      return workflow;
    } catch (error) {
      console.error('Failed to get automation workflow:', error);
      throw error;
    }
  }

  /**
   * Update automation workflow status
   */
  async updateAutomationStatus(workflowId: string, status: MarketingAutomationStatus) {
    try {
      const workflow = await prisma.marketingAutomation.update({
        where: { id: workflowId },
        data: { status },
      });

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'automation_status_updated',
          value: 1,
          date: new Date(),
          siteId: workflow.siteId,
          metadata: { workflowId, status },
        },
      });

      return workflow;
    } catch (error) {
      console.error('Failed to update automation status:', error);
      throw error;
    }
  }

  /**
   * Execute automation workflow
   */
  async executeAutomationWorkflow(workflowId: string, trigger: string, input?: Record<string, any>) {
    try {
      const workflow = await this.getAutomationWorkflow(workflowId);
      
      if (!workflow.isActive || workflow.status !== MarketingAutomationStatus.ACTIVE) {
        throw new Error('Automation workflow is not active');
      }

      // Create execution record
      const execution = await prisma.marketingAutomationExecution.create({
        data: {
          status: MarketingAutomationExecutionStatus.RUNNING,
          trigger,
          input,
          automationId: workflowId,
          siteId: workflow.siteId,
        },
      });

      try {
        // Execute actions
        const actions = workflow.actions as AutomationAction[];
        const output: Record<string, any> = {};

        for (const action of actions) {
          const actionResult = await this.executeAction(action, input);
          output[action.type] = actionResult;
        }

        // Update execution as completed
        await prisma.marketingAutomationExecution.update({
          where: { id: execution.id },
          data: {
            status: MarketingAutomationExecutionStatus.COMPLETED,
            output,
            completedAt: new Date(),
          },
        });

        // Create analytics record
        await prisma.marketingAnalytics.create({
          data: {
            type: MarketingAnalyticsType.CAMPAIGN,
            metric: 'automation_executed',
            value: 1,
            date: new Date(),
            siteId: workflow.siteId,
            metadata: { workflowId, executionId: execution.id, trigger },
          },
        });

        return { executionId: execution.id, status: 'completed', output };
      } catch (error) {
        // Update execution as failed
        await prisma.marketingAutomationExecution.update({
          where: { id: execution.id },
          data: {
            status: MarketingAutomationExecutionStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });

        throw error;
      }
    } catch (error) {
      console.error('Failed to execute automation workflow:', error);
      throw error;
    }
  }

  /**
   * Execute individual action
   */
  private async executeAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    try {
      switch (action.type) {
        case 'send_email':
          return await this.executeSendEmailAction(action, input);
        case 'send_sms':
          return await this.executeSendSMSAction(action, input);
        case 'create_task':
          return await this.executeCreateTaskAction(action, input);
        case 'update_lead':
          return await this.executeUpdateLeadAction(action, input);
        case 'add_to_segment':
          return await this.executeAddToSegmentAction(action, input);
        case 'remove_from_segment':
          return await this.executeRemoveFromSegmentAction(action, input);
        case 'post_social':
          return await this.executePostSocialAction(action, input);
        case 'create_campaign':
          return await this.executeCreateCampaignAction(action, input);
        case 'send_webhook':
          return await this.executeSendWebhookAction(action, input);
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
      throw error;
    }
  }

  /**
   * Execute send email action
   */
  private async executeSendEmailAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would integrate with email service
    const { template, recipient, subject, content } = action.parameters;
    
    // Simulate email sending
    const emailResult = {
      sent: true,
      messageId: `email-${Date.now()}`,
      recipient,
      subject,
      template,
      sentAt: new Date(),
    };

    return emailResult;
  }

  /**
   * Execute send SMS action
   */
  private async executeSendSMSAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would integrate with SMS service
    const { phoneNumber, message } = action.parameters;
    
    // Simulate SMS sending
    const smsResult = {
      sent: true,
      messageId: `sms-${Date.now()}`,
      phoneNumber,
      message,
      sentAt: new Date(),
    };

    return smsResult;
  }

  /**
   * Execute create task action
   */
  private async executeCreateTaskAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would create a task in the system
    const { title, description, assignee, dueDate } = action.parameters;
    
    // Simulate task creation
    const taskResult = {
      created: true,
      taskId: `task-${Date.now()}`,
      title,
      description,
      assignee,
      dueDate,
      createdAt: new Date(),
    };

    return taskResult;
  }

  /**
   * Execute update lead action
   */
  private async executeUpdateLeadAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would update lead data
    const { leadId, updates } = action.parameters;
    
    // Simulate lead update
    const updateResult = {
      updated: true,
      leadId,
      updates,
      updatedAt: new Date(),
    };

    return updateResult;
  }

  /**
   * Execute add to segment action
   */
  private async executeAddToSegmentAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would add lead to segment
    const { leadId, segmentId } = action.parameters;
    
    // Simulate segment addition
    const segmentResult = {
      added: true,
      leadId,
      segmentId,
      addedAt: new Date(),
    };

    return segmentResult;
  }

  /**
   * Execute remove from segment action
   */
  private async executeRemoveFromSegmentAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would remove lead from segment
    const { leadId, segmentId } = action.parameters;
    
    // Simulate segment removal
    const segmentResult = {
      removed: true,
      leadId,
      segmentId,
      removedAt: new Date(),
    };

    return segmentResult;
  }

  /**
   * Execute post social action
   */
  private async executePostSocialAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would post to social media
    const { platform, content, image } = action.parameters;
    
    // Simulate social media posting
    const socialResult = {
      posted: true,
      postId: `post-${Date.now()}`,
      platform,
      content,
      image,
      postedAt: new Date(),
    };

    return socialResult;
  }

  /**
   * Execute create campaign action
   */
  private async executeCreateCampaignAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would create a marketing campaign
    const { name, type, targetAudience, budget } = action.parameters;
    
    // Simulate campaign creation
    const campaignResult = {
      created: true,
      campaignId: `campaign-${Date.now()}`,
      name,
      type,
      targetAudience,
      budget,
      createdAt: new Date(),
    };

    return campaignResult;
  }

  /**
   * Execute send webhook action
   */
  private async executeSendWebhookAction(action: AutomationAction, input?: Record<string, any>): Promise<any> {
    // In a real implementation, this would send webhook to external service
    const { url, method, headers, body } = action.parameters;
    
    // Simulate webhook sending
    const webhookResult = {
      sent: true,
      webhookId: `webhook-${Date.now()}`,
      url,
      method,
      statusCode: 200,
      sentAt: new Date(),
    };

    return webhookResult;
  }

  /**
   * Get automation analytics
   */
  async getAutomationAnalytics(workflowId: string): Promise<AutomationAnalytics> {
    try {
      const workflow = await this.getAutomationWorkflow(workflowId);
      const executions = workflow.executions;

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === MarketingAutomationExecutionStatus.COMPLETED).length;
      const failedExecutions = executions.filter(e => e.status === MarketingAutomationExecutionStatus.FAILED).length;

      const executionTimes = executions
        .filter(e => e.completedAt && e.startedAt)
        .map(e => e.completedAt!.getTime() - e.startedAt.getTime());

      const averageExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
        : 0;

      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      const lastExecution = executions.length > 0 ? executions[0].startedAt : undefined;

      // Calculate performance metrics
      const performanceMetrics = {
        emailsSent: executions.filter(e => e.output && e.output.send_email).length,
        leadsConverted: executions.filter(e => e.output && e.output.update_lead).length,
        revenueGenerated: 0, // Would be calculated from actual data
        engagementRate: successRate,
      };

      return {
        workflowId,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime,
        successRate,
        lastExecution,
        nextExecution: undefined, // Would be calculated based on schedule
        performanceMetrics,
      };
    } catch (error) {
      console.error('Failed to get automation analytics:', error);
      throw error;
    }
  }

  /**
   * Get automation templates
   */
  async getAutomationTemplates(): Promise<AutomationTemplate[]> {
    try {
      // In a real implementation, this would fetch from database
      // For now, we'll return predefined templates
      return [
        {
          id: 'welcome-series',
          name: 'Welcome Email Series',
          description: 'Automated welcome email sequence for new leads',
          type: MarketingAutomationType.LEAD_NURTURING,
          category: 'Lead Nurturing',
          triggers: [
            {
              type: 'lead_created',
              conditions: { source: 'website' },
            },
          ],
          actions: [
            {
              type: 'send_email',
              parameters: { template: 'welcome-1', delay: 0 },
            },
            {
              type: 'send_email',
              parameters: { template: 'welcome-2', delay: 1440 }, // 24 hours
            },
            {
              type: 'send_email',
              parameters: { template: 'welcome-3', delay: 10080 }, // 7 days
            },
          ],
          estimatedDuration: 7,
          successRate: 85,
          complexity: 'simple',
          bestPractices: [
            'Send first email immediately',
            'Space emails 24-48 hours apart',
            'Include clear call-to-action',
            'Personalize content based on lead source',
          ],
          useCases: [
            'New website signups',
            'Product trial starts',
            'Newsletter subscriptions',
          ],
        },
        {
          id: 'lead-scoring',
          name: 'Lead Scoring Automation',
          description: 'Automated lead scoring and qualification workflow',
          type: MarketingAutomationType.LEAD_SCORING,
          category: 'Lead Management',
          triggers: [
            {
              type: 'lead_created',
              conditions: {},
            },
            {
              type: 'email_opened',
              conditions: {},
            },
            {
              type: 'website_visit',
              conditions: {},
            },
          ],
          actions: [
            {
              type: 'update_lead',
              parameters: { field: 'score', operation: 'increment', value: 10 },
            },
            {
              type: 'add_to_segment',
              parameters: { segmentId: 'qualified-leads' },
              conditions: { score: { gte: 50 } },
            },
          ],
          estimatedDuration: 30,
          successRate: 90,
          complexity: 'medium',
          bestPractices: [
            'Score based on engagement level',
            'Update scores in real-time',
            'Set clear qualification thresholds',
            'Review and adjust scoring criteria regularly',
          ],
          useCases: [
            'Lead qualification',
            'Sales team prioritization',
            'Campaign targeting',
          ],
        },
        {
          id: 'abandoned-cart',
          name: 'Abandoned Cart Recovery',
          description: 'Recover abandoned shopping carts with targeted emails',
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          category: 'E-commerce',
          triggers: [
            {
              type: 'purchase_made',
              conditions: { status: 'abandoned' },
            },
          ],
          actions: [
            {
              type: 'send_email',
              parameters: { template: 'cart-reminder-1', delay: 60 },
            },
            {
              type: 'send_email',
              parameters: { template: 'cart-reminder-2', delay: 1440 },
            },
            {
              type: 'send_email',
              parameters: { template: 'cart-reminder-3', delay: 4320 },
            },
          ],
          estimatedDuration: 3,
          successRate: 75,
          complexity: 'simple',
          bestPractices: [
            'Send first reminder within 1 hour',
            'Include product images and prices',
            'Offer incentives for completion',
            'Limit to 3-4 reminder emails',
          ],
          useCases: [
            'E-commerce stores',
            'Online retailers',
            'Digital product sales',
          ],
        },
        {
          id: 'social-engagement',
          name: 'Social Media Engagement',
          description: 'Automated social media posting and engagement tracking',
          type: MarketingAutomationType.SOCIAL_MEDIA,
          category: 'Social Media',
          triggers: [
            {
              type: 'social_engagement',
              conditions: { threshold: 100 },
            },
          ],
          actions: [
            {
              type: 'post_social',
              parameters: { platform: 'twitter', content: 'Thank you for engaging!' },
            },
            {
              type: 'update_lead',
              parameters: { field: 'social_engagement_score', operation: 'set', value: 'high' },
            },
          ],
          estimatedDuration: 1,
          successRate: 80,
          complexity: 'medium',
          bestPractices: [
            'Respond quickly to engagement',
            'Personalize responses',
            'Track engagement metrics',
            'Maintain brand voice',
          ],
          useCases: [
            'Social media management',
            'Customer service',
            'Brand engagement',
          ],
        },
      ];
    } catch (error) {
      console.error('Failed to get automation templates:', error);
      throw error;
    }
  }

  /**
   * Create automation template
   */
  async createAutomationTemplate(template: Omit<AutomationTemplate, 'id'>): Promise<AutomationTemplate> {
    try {
      // In a real implementation, this would be stored in a database
      // For now, we'll return the template with a generated ID
      return {
        id: `template-${Date.now()}`,
        ...template,
      };
    } catch (error) {
      console.error('Failed to create automation template:', error);
      throw error;
    }
  }

  /**
   * Get automation executions
   */
  async getAutomationExecutions(workflowId: string, limit = 50) {
    try {
      const executions = await prisma.marketingAutomationExecution.findMany({
        where: { automationId: workflowId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return executions;
    } catch (error) {
      console.error('Failed to get automation executions:', error);
      throw error;
    }
  }

  /**
   * Monitor automation workflows
   */
  async monitorAutomationWorkflows(siteId: string) {
    try {
      const workflows = await this.getAutomationWorkflows(siteId);
      const monitoringData = [];

      for (const workflow of workflows) {
        const analytics = await this.getAutomationAnalytics(workflow.id);
        const recentExecutions = await this.getAutomationExecutions(workflow.id, 10);

        monitoringData.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          status: workflow.status,
          isActive: workflow.isActive,
          analytics,
          recentExecutions,
          lastExecution: recentExecutions[0]?.startedAt,
          nextExecution: undefined, // Would be calculated based on schedule
        });
      }

      return monitoringData;
    } catch (error) {
      console.error('Failed to monitor automation workflows:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const marketingAutomationService = new MarketingAutomationService(); 