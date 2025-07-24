import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
export const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  score: z.number().int().min(0).max(100).default(0),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'DISQUALIFIED']).default('NEW'),
  source: z.string().min(1, 'Source is required'),
  sourceDetails: z.record(z.any()).optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  assignedTo: z.string().optional(),
  lastContacted: z.date().optional(),
  nextFollowUp: z.date().optional(),
  nurtureStage: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.record(z.any()).optional(),
  socialMedia: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  score: z.number().int().min(0).max(100).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'PARTNER', 'VENDOR']).default('ACTIVE'),
  engagementLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).default('LOW'),
  assignedTo: z.string().optional(),
  lastContacted: z.date().optional(),
  lastEngaged: z.date().optional(),
  lifetimeValue: z.number().positive().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  description: z.string().optional(),
  value: z.number().positive('Deal value must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD']).default('USD'),
  stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('PROSPECTING'),
  probability: z.number().int().min(0).max(100).default(10),
  expectedCloseDate: z.date().optional(),
  actualCloseDate: z.date().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  tags: z.record(z.any()).optional(),
  assignedTo: z.string().optional(),
  contactId: z.string().min(1, 'Contact ID is required'),
  lastActivity: z.date().optional(),
  nextActivity: z.date().optional(),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
  lostReason: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const interactionSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE_CALL', 'MEETING', 'CHAT', 'SOCIAL_MEDIA', 'WEBSITE_VISIT', 'FORM_SUBMISSION', 'OTHER']),
  subject: z.string().optional(),
  content: z.string().optional(),
  duration: z.number().int().positive().optional(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('INBOUND'),
  channel: z.string().min(1, 'Channel is required'),
  outcome: z.string().optional(),
  initiatedBy: z.string().optional(),
  scheduledAt: z.date().optional(),
  completedAt: z.date().optional(),
  requiresFollowUp: z.boolean().default(false),
  followUpDate: z.date().optional(),
  followUpNotes: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  type: z.enum(['EMAIL', 'SOCIAL_MEDIA', 'CONTENT_MARKETING', 'PAID_ADVERTISING', 'EVENT', 'REFERRAL', 'OTHER']),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  targetAudience: z.record(z.any()).optional(),
  goals: z.record(z.any()).optional(),
  budget: z.number().positive().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD']).default('USD'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  scheduledAt: z.date().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  template: z.string().optional(),
  createdBy: z.string().min(1, 'Created by is required'),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'RESEARCH', 'PROPOSAL', 'PRESENTATION', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED']).default('PENDING'),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  reminderAt: z.date().optional(),
  assignedTo: z.string().optional(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  campaignId: z.string().optional(),
  tags: z.record(z.any()).optional(),
  notes: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  type: z.enum(['LEAD_NURTURING', 'FOLLOW_UP', 'TASK_ASSIGNMENT', 'NOTIFICATION', 'DATA_ENRICHMENT', 'CUSTOM']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  triggers: z.record(z.any()),
  conditions: z.record(z.any()).optional(),
  actions: z.record(z.any()),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().min(1, 'Created by is required'),
  siteId: z.string().min(1, 'Site ID is required'),
});

class CRMService {
  // Lead Management
  async createLead(data: z.infer<typeof leadSchema>) {
    const validatedData = leadSchema.parse(data);
    return await prisma.lead.create({
      data: validatedData,
      include: {
        assignedUser: true,
        convertedContact: true,
        interactions: true,
        tasks: true,
        campaigns: {
          include: {
            campaign: true,
          },
        },
      },
    });
  }

  async getLeads(siteId: string, filters?: {
    status?: string;
    assignedTo?: string;
    source?: string;
    score?: { min?: number; max?: number };
    dateRange?: { start: Date; end: Date };
  }) {
    const where: any = { siteId };

    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.source) where.source = filters.source;
    if (filters?.score) {
      where.score = {};
      if (filters.score.min !== undefined) where.score.gte = filters.score.min;
      if (filters.score.max !== undefined) where.score.lte = filters.score.max;
    }
    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return await prisma.lead.findMany({
      where,
      include: {
        assignedUser: true,
        convertedContact: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLead(id: string, siteId: string) {
    return await prisma.lead.findFirst({
      where: { id, siteId },
      include: {
        assignedUser: true,
        convertedContact: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            initiatedUser: true,
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedUser: true,
          },
        },
        campaigns: {
          include: {
            campaign: true,
          },
        },
      },
    });
  }

  async updateLead(id: string, siteId: string, data: Partial<z.infer<typeof leadSchema>>) {
    const validatedData = leadSchema.partial().parse(data);
    return await prisma.lead.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        assignedUser: true,
        convertedContact: true,
      },
    });
  }

  async deleteLead(id: string, siteId: string) {
    return await prisma.lead.delete({
      where: { id, siteId },
    });
  }

  async convertLeadToContact(leadId: string, siteId: string, contactData: z.infer<typeof contactSchema>) {
    const lead = await this.getLead(leadId, siteId);
    if (!lead) throw new Error('Lead not found');

    const contact = await this.createContact(contactData);
    
    await prisma.lead.update({
      where: { id: leadId, siteId },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedToContactId: contact.id,
      },
    });

    return contact;
  }

  // Contact Management
  async createContact(data: z.infer<typeof contactSchema>) {
    const validatedData = contactSchema.parse(data);
    return await prisma.contact.create({
      data: validatedData,
      include: {
        assignedUser: true,
        interactions: true,
        deals: true,
        tasks: true,
        campaigns: {
          include: {
            campaign: true,
          },
        },
      },
    });
  }

  async getContacts(siteId: string, filters?: {
    status?: string;
    assignedTo?: string;
    engagementLevel?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const where: any = { siteId };

    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.engagementLevel) where.engagementLevel = filters.engagementLevel;
    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return await prisma.contact.findMany({
      where,
      include: {
        assignedUser: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        deals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContact(id: string, siteId: string) {
    return await prisma.contact.findFirst({
      where: { id, siteId },
      include: {
        assignedUser: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            initiatedUser: true,
            lead: true,
            deal: true,
          },
        },
        deals: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedUser: true,
            tasks: {
              where: { status: { not: 'COMPLETED' } },
            },
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedUser: true,
          },
        },
        campaigns: {
          include: {
            campaign: true,
          },
        },
        convertedLeads: true,
      },
    });
  }

  async updateContact(id: string, siteId: string, data: Partial<z.infer<typeof contactSchema>>) {
    const validatedData = contactSchema.partial().parse(data);
    return await prisma.contact.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        assignedUser: true,
      },
    });
  }

  async deleteContact(id: string, siteId: string) {
    return await prisma.contact.delete({
      where: { id, siteId },
    });
  }

  // Deal Management
  async createDeal(data: z.infer<typeof dealSchema>) {
    const validatedData = dealSchema.parse(data);
    return await prisma.deal.create({
      data: validatedData,
      include: {
        assignedUser: true,
        contact: true,
        interactions: true,
        tasks: true,
      },
    });
  }

  async getDeals(siteId: string, filters?: {
    stage?: string;
    assignedTo?: string;
    isWon?: boolean;
    isLost?: boolean;
    dateRange?: { start: Date; end: Date };
  }) {
    const where: any = { siteId };

    if (filters?.stage) where.stage = filters.stage;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.isWon !== undefined) where.isWon = filters.isWon;
    if (filters?.isLost !== undefined) where.isLost = filters.isLost;
    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return await prisma.deal.findMany({
      where,
      include: {
        assignedUser: true,
        contact: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeal(id: string, siteId: string) {
    return await prisma.deal.findFirst({
      where: { id, siteId },
      include: {
        assignedUser: true,
        contact: {
          include: {
            assignedUser: true,
          },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            initiatedUser: true,
            lead: true,
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedUser: true,
          },
        },
      },
    });
  }

  async updateDeal(id: string, siteId: string, data: Partial<z.infer<typeof dealSchema>>) {
    const validatedData = dealSchema.partial().parse(data);
    return await prisma.deal.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        assignedUser: true,
        contact: true,
      },
    });
  }

  async deleteDeal(id: string, siteId: string) {
    return await prisma.deal.delete({
      where: { id, siteId },
    });
  }

  async closeDeal(id: string, siteId: string, isWon: boolean, reason?: string) {
    return await prisma.deal.update({
      where: { id, siteId },
      data: {
        isWon,
        isLost: !isWon,
        lostReason: !isWon ? reason : null,
        actualCloseDate: new Date(),
        stage: isWon ? 'CLOSED_WON' : 'CLOSED_LOST',
      },
      include: {
        assignedUser: true,
        contact: true,
      },
    });
  }

  // Interaction Management
  async createInteraction(data: z.infer<typeof interactionSchema>) {
    const validatedData = interactionSchema.parse(data);
    return await prisma.interaction.create({
      data: validatedData,
      include: {
        initiatedUser: true,
        lead: true,
        contact: true,
        deal: true,
      },
    });
  }

  async getInteractions(siteId: string, filters?: {
    type?: string;
    leadId?: string;
    contactId?: string;
    dealId?: string;
    initiatedBy?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.contactId) where.contactId = filters.contactId;
    if (filters?.dealId) where.dealId = filters.dealId;
    if (filters?.initiatedBy) where.initiatedBy = filters.initiatedBy;
    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return await prisma.interaction.findMany({
      where,
      include: {
        initiatedUser: true,
        lead: true,
        contact: true,
        deal: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInteraction(id: string, siteId: string) {
    return await prisma.interaction.findFirst({
      where: { id, siteId },
      include: {
        initiatedUser: true,
        lead: true,
        contact: true,
        deal: true,
      },
    });
  }

  async updateInteraction(id: string, siteId: string, data: Partial<z.infer<typeof interactionSchema>>) {
    const validatedData = interactionSchema.partial().parse(data);
    return await prisma.interaction.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        initiatedUser: true,
        lead: true,
        contact: true,
        deal: true,
      },
    });
  }

  async deleteInteraction(id: string, siteId: string) {
    return await prisma.interaction.delete({
      where: { id, siteId },
    });
  }

  // Campaign Management
  async createCampaign(data: z.infer<typeof campaignSchema>) {
    const validatedData = campaignSchema.parse(data);
    return await prisma.campaign.create({
      data: validatedData,
      include: {
        createdUser: true,
        leads: {
          include: {
            lead: true,
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        tasks: true,
      },
    });
  }

  async getCampaigns(siteId: string, filters?: {
    type?: string;
    status?: string;
    createdBy?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.createdBy) where.createdBy = filters.createdBy;
    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return await prisma.campaign.findMany({
      where,
      include: {
        createdUser: true,
        leads: {
          include: {
            lead: true,
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string, siteId: string) {
    return await prisma.campaign.findFirst({
      where: { id, siteId },
      include: {
        createdUser: true,
        leads: {
          include: {
            lead: {
              include: {
                assignedUser: true,
              },
            },
          },
        },
        contacts: {
          include: {
            contact: {
              include: {
                assignedUser: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignedUser: true,
          },
        },
      },
    });
  }

  async updateCampaign(id: string, siteId: string, data: Partial<z.infer<typeof campaignSchema>>) {
    const validatedData = campaignSchema.partial().parse(data);
    return await prisma.campaign.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        createdUser: true,
      },
    });
  }

  async deleteCampaign(id: string, siteId: string) {
    return await prisma.campaign.delete({
      where: { id, siteId },
    });
  }

  async addLeadsToCampaign(campaignId: string, siteId: string, leadIds: string[]) {
    const campaign = await this.getCampaign(campaignId, siteId);
    if (!campaign) throw new Error('Campaign not found');

    const campaignLeads = await Promise.all(
      leadIds.map(leadId =>
        prisma.campaignLead.create({
          data: {
            campaignId,
            leadId,
            siteId,
          },
          include: {
            lead: true,
          },
        })
      )
    );

    return campaignLeads;
  }

  async addContactsToCampaign(campaignId: string, siteId: string, contactIds: string[]) {
    const campaign = await this.getCampaign(campaignId, siteId);
    if (!campaign) throw new Error('Campaign not found');

    const campaignContacts = await Promise.all(
      contactIds.map(contactId =>
        prisma.campaignContact.create({
          data: {
            campaignId,
            contactId,
            siteId,
          },
          include: {
            contact: true,
          },
        })
      )
    );

    return campaignContacts;
  }

  // Task Management
  async createTask(data: z.infer<typeof taskSchema>) {
    const validatedData = taskSchema.parse(data);
    return await prisma.task.create({
      data: validatedData,
      include: {
        assignedUser: true,
        lead: true,
        contact: true,
        deal: true,
        campaign: true,
      },
    });
  }

  async getTasks(siteId: string, filters?: {
    type?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    dueDate?: { start: Date; end: Date };
  }) {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.dueDate) {
      where.dueDate = {
        gte: filters.dueDate.start,
        lte: filters.dueDate.end,
      };
    }

    return await prisma.task.findMany({
      where,
      include: {
        assignedUser: true,
        lead: true,
        contact: true,
        deal: true,
        campaign: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getTask(id: string, siteId: string) {
    return await prisma.task.findFirst({
      where: { id, siteId },
      include: {
        assignedUser: true,
        lead: true,
        contact: true,
        deal: true,
        campaign: true,
      },
    });
  }

  async updateTask(id: string, siteId: string, data: Partial<z.infer<typeof taskSchema>>) {
    const validatedData = taskSchema.partial().parse(data);
    return await prisma.task.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        assignedUser: true,
        lead: true,
        contact: true,
        deal: true,
        campaign: true,
      },
    });
  }

  async deleteTask(id: string, siteId: string) {
    return await prisma.task.delete({
      where: { id, siteId },
    });
  }

  async completeTask(id: string, siteId: string) {
    return await prisma.task.update({
      where: { id, siteId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        assignedUser: true,
        lead: true,
        contact: true,
        deal: true,
        campaign: true,
      },
    });
  }

  // Workflow Management
  async createWorkflow(data: z.infer<typeof workflowSchema>) {
    const validatedData = workflowSchema.parse(data);
    return await prisma.workflow.create({
      data: validatedData,
      include: {
        createdUser: true,
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getWorkflows(siteId: string, filters?: {
    type?: string;
    status?: string;
    createdBy?: string;
    isActive?: boolean;
  }) {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.createdBy) where.createdBy = filters.createdBy;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return await prisma.workflow.findMany({
      where,
      include: {
        createdUser: true,
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkflow(id: string, siteId: string) {
    return await prisma.workflow.findFirst({
      where: { id, siteId },
      include: {
        createdUser: true,
        executions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateWorkflow(id: string, siteId: string, data: Partial<z.infer<typeof workflowSchema>>) {
    const validatedData = workflowSchema.partial().parse(data);
    return await prisma.workflow.update({
      where: { id, siteId },
      data: validatedData,
      include: {
        createdUser: true,
      },
    });
  }

  async deleteWorkflow(id: string, siteId: string) {
    return await prisma.workflow.delete({
      where: { id, siteId },
    });
  }

  async executeWorkflow(id: string, siteId: string, input?: any) {
    const workflow = await this.getWorkflow(id, siteId);
    if (!workflow) throw new Error('Workflow not found');
    if (!workflow.isActive) throw new Error('Workflow is not active');

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: 'RUNNING',
        trigger: 'manual',
        input: input || {},
        siteId,
      },
    });

    try {
      // Execute workflow logic based on type and actions
      const output = await this.executeWorkflowActions(workflow, input);
      
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          output,
          completedAt: new Date(),
          duration: Math.floor((Date.now() - execution.startedAt.getTime()) / 1000),
        },
      });

      await prisma.workflow.update({
        where: { id },
        data: {
          lastExecuted: new Date(),
          executionCount: { increment: 1 },
        },
      });

      return { success: true, executionId: execution.id, output };
    } catch (error) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
          duration: Math.floor((Date.now() - execution.startedAt.getTime()) / 1000),
        },
      });

      throw error;
    }
  }

  private async executeWorkflowActions(workflow: any, input: any) {
    const actions = workflow.actions;
    const output: any = {};

    for (const action of actions) {
      switch (action.type) {
        case 'create_task':
          output.task = await this.createTask({
            ...action.data,
            siteId: workflow.siteId,
          });
          break;
        case 'send_email':
          // Implement email sending logic
          output.email = { sent: true, to: action.data.to };
          break;
        case 'update_lead':
          if (action.data.leadId) {
            output.lead = await this.updateLead(
              action.data.leadId,
              workflow.siteId,
              action.data.updates
            );
          }
          break;
        case 'create_interaction':
          output.interaction = await this.createInteraction({
            ...action.data,
            siteId: workflow.siteId,
          });
          break;
        default:
          console.warn(`Unknown workflow action type: ${action.type}`);
      }
    }

    return output;
  }

  // Analytics and Reporting
  async getCRMAnalytics(siteId: string, dateRange?: { start: Date; end: Date }) {
    const where = dateRange ? {
      siteId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    } : { siteId };

    const [
      totalLeads,
      convertedLeads,
      totalContacts,
      totalDeals,
      wonDeals,
      totalInteractions,
      totalTasks,
      totalCampaigns,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
      prisma.contact.count({ where }),
      prisma.deal.count({ where }),
      prisma.deal.count({ where: { ...where, isWon: true } }),
      prisma.interaction.count({ where }),
      prisma.task.count({ where }),
      prisma.campaign.count({ where }),
    ]);

    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const dealWinRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    // Pipeline analysis
    const pipelineStages = await prisma.deal.groupBy({
      by: ['stage'],
      where,
      _count: { stage: true },
      _sum: { value: true },
    });

    // Recent activity
    const recentInteractions = await prisma.interaction.findMany({
      where,
      include: {
        initiatedUser: true,
        lead: true,
        contact: true,
        deal: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Upcoming tasks
    const upcomingTasks = await prisma.task.findMany({
      where: {
        ...where,
        status: { not: 'COMPLETED' },
        dueDate: { gte: new Date() },
      },
      include: {
        assignedUser: true,
        lead: true,
        contact: true,
        deal: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    return {
      overview: {
        totalLeads,
        convertedLeads,
        leadConversionRate,
        totalContacts,
        totalDeals,
        wonDeals,
        dealWinRate,
        totalInteractions,
        totalTasks,
        totalCampaigns,
      },
      pipeline: pipelineStages,
      recentActivity: recentInteractions,
      upcomingTasks,
    };
  }

  // Data Import/Export
  async importLeads(siteId: string, leads: any[]) {
    const validatedLeads = leads.map(lead => ({
      ...leadSchema.parse(lead),
      siteId,
    }));

    return await prisma.lead.createMany({
      data: validatedLeads,
    });
  }

  async importContacts(siteId: string, contacts: any[]) {
    const validatedContacts = contacts.map(contact => ({
      ...contactSchema.parse(contact),
      siteId,
    }));

    return await prisma.contact.createMany({
      data: validatedContacts,
    });
  }

  async exportLeads(siteId: string, filters?: any) {
    const leads = await this.getLeads(siteId, filters);
    return leads.map(lead => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.jobTitle,
      score: lead.score,
      status: lead.status,
      source: lead.source,
      industry: lead.industry,
      companySize: lead.companySize,
      budget: lead.budget,
      timeline: lead.timeline,
      assignedTo: lead.assignedUser?.name,
      createdAt: lead.createdAt,
      lastContacted: lead.lastContacted,
    }));
  }

  async exportContacts(siteId: string, filters?: any) {
    const contacts = await this.getContacts(siteId, filters);
    return contacts.map(contact => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      company: contact.company,
      jobTitle: contact.jobTitle,
      department: contact.department,
      score: contact.score,
      status: contact.status,
      engagementLevel: contact.engagementLevel,
      assignedTo: contact.assignedUser?.name,
      lifetimeValue: contact.lifetimeValue,
      createdAt: contact.createdAt,
      lastContacted: contact.lastContacted,
    }));
  }
}

export const crmService = new CRMService(); 