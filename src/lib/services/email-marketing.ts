import { prisma } from '../prisma';
import { EmailCampaignStatus, EmailRecipientStatus, MarketingAutomationType, MarketingAutomationStatus } from '@/generated/prisma';

// Email Campaign Data
interface EmailCampaignData {
  name: string;
  subject: string;
  content: string;
  template?: string;
  siteId: string;
  campaignId?: string;
  scheduledAt?: Date;
  recipientList?: string[];
  segmentId?: string;
  metadata?: Record<string, any>;
}

// Email Segmentation Data
interface EmailSegment {
  id: string;
  name: string;
  description?: string;
  criteria: SegmentCriteria[];
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

// Email Automation Workflow
interface EmailWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowTrigger {
  type: 'signup' | 'purchase' | 'abandoned_cart' | 'birthday' | 'anniversary' | 'custom';
  event?: string;
  delay?: number; // minutes
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

interface WorkflowAction {
  type: 'send_email' | 'add_to_segment' | 'remove_from_segment' | 'update_field' | 'delay';
  emailTemplateId?: string;
  segmentId?: string;
  field?: string;
  value?: any;
  delay?: number; // minutes
}

// Email Analytics
interface EmailAnalytics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  spamReports: number;
  date: Date;
}

// Email Marketing Service Class
export class EmailMarketingService {
  /**
   * Create a new email campaign
   */
  async createCampaign(data: EmailCampaignData, userId: string) {
    try {
      const campaign = await prisma.emailCampaign.create({
        data: {
          name: data.name,
          subject: data.subject,
          content: data.content,
          template: data.template,
          status: data.scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.DRAFT,
          scheduledAt: data.scheduledAt,
          siteId: data.siteId,
          campaignId: data.campaignId,
          metadata: data.metadata || {},
          createdBy: userId,
        },
      });

      // Add recipients if provided
      if (data.recipientList && data.recipientList.length > 0) {
        await this.addRecipients(campaign.id, data.recipientList, data.siteId);
      }

      // Schedule if needed
      if (data.scheduledAt) {
        this.scheduleCampaign(campaign.id, data.scheduledAt);
      }

      return campaign;
    } catch (error) {
      console.error('Failed to create email campaign:', error);
      throw error;
    }
  }

  /**
   * Add recipients to a campaign
   */
  async addRecipients(campaignId: string, emails: string[], siteId: string) {
    try {
      const recipients = emails.map(email => ({
        email,
        campaignId,
        siteId,
        status: EmailRecipientStatus.PENDING,
      }));

      await prisma.emailCampaignRecipient.createMany({
        data: recipients,
        skipDuplicates: true,
      });

      // Update campaign recipient count
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          recipientCount: {
            increment: emails.length,
          },
        },
      });
    } catch (error) {
      console.error('Failed to add recipients:', error);
      throw error;
    }
  }

  /**
   * Send an email campaign
   */
  async sendCampaign(campaignId: string) {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: { recipients: true },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status !== EmailCampaignStatus.DRAFT && campaign.status !== EmailCampaignStatus.SCHEDULED) {
        throw new Error('Campaign cannot be sent in current status');
      }

      // Update campaign status
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: EmailCampaignStatus.SENDING,
          sentAt: new Date(),
        },
      });

      // Send emails to recipients
      const pendingRecipients = campaign.recipients.filter((r: any) => r.status === EmailRecipientStatus.PENDING);
      
      for (const recipient of pendingRecipients) {
        try {
          await this.sendEmail(recipient.email, campaign.subject, campaign.content);
          
          // Update recipient status
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: EmailRecipientStatus.SENT,
              sentAt: new Date(),
            },
          });
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          
          // Update recipient status to failed
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: EmailRecipientStatus.BOUNCED,
              bouncedAt: new Date(),
            },
          });
        }
      }

      // Update campaign status to sent
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: EmailCampaignStatus.SENT,
        },
      });

      return { success: true, sentCount: pendingRecipients.length };
    } catch (error) {
      console.error('Failed to send campaign:', error);
      throw error;
    }
  }

  /**
   * Send individual email (simulated)
   */
  private async sendEmail(to: string, subject: string, content: string) {
    // This would integrate with SendGrid or other email service
    console.log(`Sending email to ${to}: ${subject}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate success/failure
    if (Math.random() > 0.95) {
      throw new Error('Email delivery failed');
    }
  }

  /**
   * Schedule a campaign for later sending
   */
  private scheduleCampaign(campaignId: string, scheduledAt: Date) {
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await this.sendCampaign(campaignId);
        } catch (error) {
          console.error('Failed to send scheduled campaign:', error);
        }
      }, delay);
    }
  }

  /**
   * Get email campaigns for a site
   */
  async getCampaigns(siteId: string, options: {
    status?: EmailCampaignStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const campaigns = await prisma.emailCampaign.findMany({
        where: {
          siteId,
          status: options.status,
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
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return campaigns;
    } catch (error) {
      console.error('Failed to get email campaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: { recipients: true },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const analytics: EmailAnalytics = {
        campaignId,
        sent: campaign.recipients.filter((r: any) => r.status === EmailRecipientStatus.SENT).length,
        delivered: campaign.recipients.filter((r: any) => r.status === EmailRecipientStatus.DELIVERED).length,
        opened: campaign.recipients.filter((r: any) => r.openedAt).length,
        clicked: campaign.recipients.filter((r: any) => r.clickedAt).length,
        bounced: campaign.recipients.filter((r: any) => r.status === EmailRecipientStatus.BOUNCED).length,
        unsubscribed: campaign.recipients.filter((r: any) => r.status === EmailRecipientStatus.UNSUBSCRIBED).length,
        spamReports: 0, // Would be tracked separately
        date: new Date(),
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Create email segment
   */
  async createSegment(name: string, description: string, criteria: SegmentCriteria[], siteId: string) {
    try {
      const segment = await prisma.marketingAutomation.create({
        data: {
          name,
          description,
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          status: MarketingAutomationStatus.ACTIVE,
          metadata: {
            criteria,
            segmentType: 'email',
          },
          siteId,
        },
      });

      return segment;
    } catch (error) {
      console.error('Failed to create email segment:', error);
      throw error;
    }
  }

  /**
   * Get email segments for a site
   */
  async getSegments(siteId: string) {
    try {
      const segments = await prisma.marketingAutomation.findMany({
        where: {
          siteId,
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          metadata: {
            path: ['segmentType'],
            equals: 'email',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return segments.map((segment: any) => ({
        id: segment.id,
        name: segment.name,
        description: segment.description,
        criteria: segment.metadata?.criteria || [],
        siteId: segment.siteId,
        createdAt: segment.createdAt,
        updatedAt: segment.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get email segments:', error);
      throw error;
    }
  }

  /**
   * Create email automation workflow
   */
  async createWorkflow(workflow: Omit<EmailWorkflow, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const automation = await prisma.marketingAutomation.create({
        data: {
          name: workflow.name,
          description: workflow.description,
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          status: workflow.isActive ? MarketingAutomationStatus.ACTIVE : MarketingAutomationStatus.DRAFT,
          metadata: {
            trigger: workflow.trigger,
            conditions: workflow.conditions,
            actions: workflow.actions,
            workflowType: 'email',
          },
          siteId: workflow.siteId,
        },
      });

      return automation;
    } catch (error) {
      console.error('Failed to create email workflow:', error);
      throw error;
    }
  }

  /**
   * Get email workflows for a site
   */
  async getWorkflows(siteId: string) {
    try {
      const workflows = await prisma.marketingAutomation.findMany({
        where: {
          siteId,
          type: MarketingAutomationType.EMAIL_SEQUENCE,
          metadata: {
            path: ['workflowType'],
            equals: 'email',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return workflows.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        trigger: workflow.metadata?.trigger,
        conditions: workflow.metadata?.conditions || [],
        actions: workflow.metadata?.actions || [],
        isActive: workflow.status === MarketingAutomationStatus.ACTIVE,
        siteId: workflow.siteId,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get email workflows:', error);
      throw error;
    }
  }

  /**
   * Execute email workflow
   */
  async executeWorkflow(workflowId: string, triggerData: any) {
    try {
      const workflow = await prisma.marketingAutomation.findUnique({
        where: { id: workflowId },
      });

      if (!workflow || workflow.status !== MarketingAutomationStatus.ACTIVE) {
        throw new Error('Workflow not found or inactive');
      }

      const trigger = workflow.metadata?.trigger;
      const conditions = workflow.metadata?.conditions || [];
      const actions = workflow.metadata?.actions || [];

      // Check conditions
      const conditionsMet = this.evaluateConditions(conditions, triggerData);
      if (!conditionsMet) {
        return { executed: false, reason: 'Conditions not met' };
      }

      // Execute actions
      for (const action of actions) {
        await this.executeAction(action, triggerData);
      }

      // Log execution
      await prisma.marketingAutomationExecution.create({
        data: {
          automationId: workflowId,
          status: 'COMPLETED',
          metadata: {
            triggerData,
            executedAt: new Date(),
          },
          siteId: workflow.siteId,
        },
      });

      return { executed: true, actionsExecuted: actions.length };
    } catch (error) {
      console.error('Failed to execute email workflow:', error);
      throw error;
    }
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
    for (const condition of conditions) {
      const value = data[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          if (value !== condition.value) return false;
          break;
        case 'contains':
          if (!String(value).includes(String(condition.value))) return false;
          break;
        case 'greater_than':
          if (Number(value) <= Number(condition.value)) return false;
          break;
        case 'less_than':
          if (Number(value) >= Number(condition.value)) return false;
          break;
      }
    }
    
    return true;
  }

  /**
   * Execute workflow action
   */
  private async executeAction(action: WorkflowAction, data: any) {
    switch (action.type) {
      case 'send_email':
        if (action.emailTemplateId && data.email) {
          // Send email using template
          console.log(`Sending email template ${action.emailTemplateId} to ${data.email}`);
        }
        break;
      case 'add_to_segment':
        if (action.segmentId && data.email) {
          // Add email to segment
          console.log(`Adding ${data.email} to segment ${action.segmentId}`);
        }
        break;
      case 'delay':
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay! * 60 * 1000));
        }
        break;
      default:
        console.log(`Executing action: ${action.type}`);
    }
  }

  /**
   * Track email events (open, click, etc.)
   */
  async trackEmailEvent(recipientId: string, event: 'open' | 'click' | 'bounce' | 'unsubscribe') {
    try {
      const updateData: any = {};
      
      switch (event) {
        case 'open':
          updateData.openedAt = new Date();
          break;
        case 'click':
          updateData.clickedAt = new Date();
          break;
        case 'bounce':
          updateData.bouncedAt = new Date();
          updateData.status = EmailRecipientStatus.BOUNCED;
          break;
        case 'unsubscribe':
          updateData.status = EmailRecipientStatus.UNSUBSCRIBED;
          break;
      }

      await prisma.emailCampaignRecipient.update({
        where: { id: recipientId },
        data: updateData,
      });
    } catch (error) {
      console.error('Failed to track email event:', error);
      throw error;
    }
  }

  /**
   * Get email templates
   */
  async getEmailTemplates(siteId: string) {
    try {
      // This would typically come from a template system
      // For now, return mock templates
      return [
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
      ];
    } catch (error) {
      console.error('Failed to get email templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailMarketingService = new EmailMarketingService(); 