import { prisma } from '../prisma';
import { LeadStatus, ContactStatus, InteractionType, TaskType, TaskPriority, TaskStatus } from '@/generated/prisma';

// Lead Data Interface
interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  budget?: string;
  timeline?: string;
  source: string;
  sourceDetails?: Record<string, any>;
  siteId: string;
  assignedTo?: string;
}

// Lead Scoring Criteria
interface ScoringCriteria {
  field: string;
  value: any;
  points: number;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
}

// Lead Nurturing Workflow
interface NurturingWorkflow {
  id: string;
  name: string;
  description?: string;
  triggers: NurturingTrigger[];
  actions: NurturingAction[];
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NurturingTrigger {
  type: 'lead_created' | 'score_threshold' | 'activity' | 'time_based' | 'custom';
  conditions: NurturingCondition[];
  delay?: number; // minutes
}

interface NurturingCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

interface NurturingAction {
  type: 'send_email' | 'create_task' | 'update_score' | 'assign_lead' | 'schedule_followup' | 'add_to_campaign';
  emailTemplateId?: string;
  taskType?: TaskType;
  taskPriority?: TaskPriority;
  scoreChange?: number;
  assignTo?: string;
  followUpDelay?: number; // days
  campaignId?: string;
}

// Lead Analytics
interface LeadAnalytics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  averageScore: number;
  conversionRate: number;
  sourceBreakdown: Record<string, number>;
  industryBreakdown: Record<string, number>;
  timeToConversion: number; // days
  date: Date;
}

// Lead Generation Service Class
export class LeadGenerationService {
  /**
   * Create a new lead
   */
  async createLead(data: LeadData) {
    try {
      // Calculate initial score
      const initialScore = this.calculateLeadScore(data);

      const lead = await prisma.lead.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          jobTitle: data.jobTitle,
          website: data.website,
          industry: data.industry,
          companySize: data.companySize,
          budget: data.budget,
          timeline: data.timeline,
          source: data.source,
          sourceDetails: data.sourceDetails || {},
          score: initialScore,
          status: LeadStatus.NEW,
          siteId: data.siteId,
          assignedTo: data.assignedTo,
        },
      });

      // Trigger nurturing workflows
      await this.triggerNurturingWorkflows(lead);

      return lead;
    } catch (error) {
      console.error('Failed to create lead:', error);
      throw error;
    }
  }

  /**
   * Calculate lead score based on various criteria
   */
  private calculateLeadScore(leadData: LeadData): number {
    let score = 0;

    // Basic scoring criteria
    const scoringRules: ScoringCriteria[] = [
      // Company information
      { field: 'company', value: null, points: 0, operator: 'equals' },
      { field: 'company', value: '', points: 5, operator: 'not_in' },
      { field: 'jobTitle', value: null, points: 0, operator: 'equals' },
      { field: 'jobTitle', value: '', points: 10, operator: 'not_in' },
      { field: 'website', value: null, points: 0, operator: 'equals' },
      { field: 'website', value: '', points: 15, operator: 'not_in' },
      { field: 'phone', value: null, points: 0, operator: 'equals' },
      { field: 'phone', value: '', points: 10, operator: 'not_in' },

      // Industry scoring
      { field: 'industry', value: ['Technology', 'Software', 'SaaS'], points: 20, operator: 'in' },
      { field: 'industry', value: ['Finance', 'Healthcare', 'Education'], points: 15, operator: 'in' },
      { field: 'industry', value: ['Manufacturing', 'Retail', 'Real Estate'], points: 10, operator: 'in' },

      // Company size scoring
      { field: 'companySize', value: ['51-200', '201-1000', '1000+'], points: 15, operator: 'in' },
      { field: 'companySize', value: ['11-50'], points: 10, operator: 'in' },
      { field: 'companySize', value: ['1-10'], points: 5, operator: 'in' },

      // Budget scoring
      { field: 'budget', value: ['$50k-$100k', '$100k+'], points: 20, operator: 'in' },
      { field: 'budget', value: ['$10k-$50k'], points: 15, operator: 'in' },
      { field: 'budget', value: ['<$10k'], points: 5, operator: 'in' },

      // Timeline scoring
      { field: 'timeline', value: ['immediate'], points: 25, operator: 'equals' },
      { field: 'timeline', value: ['1-3 months'], points: 20, operator: 'equals' },
      { field: 'timeline', value: ['3-6 months'], points: 15, operator: 'equals' },
      { field: 'timeline', value: ['6+ months'], points: 5, operator: 'equals' },

      // Source scoring
      { field: 'source', value: 'referral', points: 25, operator: 'equals' },
      { field: 'source', value: 'website', points: 15, operator: 'equals' },
      { field: 'source', value: 'social', points: 10, operator: 'equals' },
      { field: 'source', value: 'campaign', points: 10, operator: 'equals' },
    ];

    for (const rule of scoringRules) {
      const fieldValue = (leadData as any)[rule.field];
      
      switch (rule.operator) {
        case 'equals':
          if (fieldValue === rule.value) score += rule.points;
          break;
        case 'contains':
          if (fieldValue && String(fieldValue).includes(String(rule.value))) score += rule.points;
          break;
        case 'greater_than':
          if (fieldValue && Number(fieldValue) > Number(rule.value)) score += rule.points;
          break;
        case 'less_than':
          if (fieldValue && Number(fieldValue) < Number(rule.value)) score += rule.points;
          break;
        case 'in':
          if (fieldValue && Array.isArray(rule.value) && rule.value.includes(fieldValue)) score += rule.points;
          break;
        case 'not_in':
          if (fieldValue && fieldValue !== rule.value) score += rule.points;
          break;
      }
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Update lead score
   */
  async updateLeadScore(leadId: string, scoreChange: number, reason?: string) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      const newScore = Math.max(0, Math.min(100, lead.score + scoreChange));

      await prisma.lead.update({
        where: { id: leadId },
        data: { score: newScore },
      });

      // Log score change
      await prisma.marketingLeadActivity.create({
        data: {
          type: 'SCORE_CHANGE',
          description: reason || `Score changed by ${scoreChange > 0 ? '+' : ''}${scoreChange}`,
          metadata: {
            oldScore: lead.score,
            newScore,
            change: scoreChange,
            reason,
          },
          leadId,
          siteId: lead.siteId,
        },
      });

      return { success: true, newScore };
    } catch (error) {
      console.error('Failed to update lead score:', error);
      throw error;
    }
  }

  /**
   * Qualify a lead
   */
  async qualifyLead(leadId: string, qualificationData: {
    isQualified: boolean;
    qualificationScore?: number;
    qualificationNotes?: string;
    assignedTo?: string;
  }) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      const updateData: any = {
        status: qualificationData.isQualified ? LeadStatus.QUALIFIED : LeadStatus.DISQUALIFIED,
      };

      if (qualificationData.assignedTo) {
        updateData.assignedTo = qualificationData.assignedTo;
      }

      if (qualificationData.isQualified && qualificationData.qualificationScore) {
        updateData.score = qualificationData.qualificationScore;
      }

      await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });

      // Log qualification activity
      await prisma.marketingLeadActivity.create({
        data: {
          type: qualificationData.isQualified ? 'LEAD_QUALIFIED' : 'LEAD_DISQUALIFIED',
          description: qualificationData.qualificationNotes || `Lead ${qualificationData.isQualified ? 'qualified' : 'disqualified'}`,
          metadata: {
            qualificationScore: qualificationData.qualificationScore,
            assignedTo: qualificationData.assignedTo,
          },
          leadId,
          siteId: lead.siteId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to qualify lead:', error);
      throw error;
    }
  }

  /**
   * Convert lead to contact
   */
  async convertLead(leadId: string, conversionData: {
    dealValue?: number;
    dealName?: string;
    dealDescription?: string;
    assignedTo?: string;
  }) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          jobTitle: lead.jobTitle,
          website: lead.website,
          score: lead.score,
          status: ContactStatus.ACTIVE,
          engagementLevel: 'HIGH',
          siteId: lead.siteId,
          assignedTo: conversionData.assignedTo || lead.assignedTo,
        },
      });

      // Create deal if value provided
      let deal = null;
      if (conversionData.dealValue) {
        deal = await prisma.deal.create({
          data: {
            name: conversionData.dealName || `Deal for ${contact.firstName} ${contact.lastName}`,
            description: conversionData.dealDescription,
            value: conversionData.dealValue,
            stage: 'PROSPECTING',
            probability: 10,
            contactId: contact.id,
            siteId: lead.siteId,
            assignedTo: conversionData.assignedTo || lead.assignedTo,
          },
        });
      }

      // Update lead
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          convertedToContactId: contact.id,
        },
      });

      // Log conversion activity
      await prisma.marketingLeadActivity.create({
        data: {
          type: 'LEAD_CONVERTED',
          description: `Lead converted to contact with deal value: $${conversionData.dealValue || 0}`,
          metadata: {
            contactId: contact.id,
            dealId: deal?.id,
            dealValue: conversionData.dealValue,
          },
          leadId,
          siteId: lead.siteId,
        },
      });

      return { success: true, contact, deal };
    } catch (error) {
      console.error('Failed to convert lead:', error);
      throw error;
    }
  }

  /**
   * Get leads for a site
   */
  async getLeads(siteId: string, options: {
    status?: LeadStatus;
    assignedTo?: string;
    source?: string;
    minScore?: number;
    maxScore?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const whereClause: any = { siteId };

      if (options.status) whereClause.status = options.status;
      if (options.assignedTo) whereClause.assignedTo = options.assignedTo;
      if (options.source) whereClause.source = options.source;
      if (options.minScore !== undefined) whereClause.score = { gte: options.minScore };
      if (options.maxScore !== undefined) {
        whereClause.score = { ...whereClause.score, lte: options.maxScore };
      }

      const leads = await prisma.lead.findMany({
        where: whereClause,
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
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return leads;
    } catch (error) {
      console.error('Failed to get leads:', error);
      throw error;
    }
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(siteId: string, dateRange?: { start: Date; end: Date }) {
    try {
      const whereClause: any = { siteId };
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const leads = await prisma.lead.findMany({
        where: whereClause,
        select: {
          status: true,
          score: true,
          source: true,
          industry: true,
          createdAt: true,
          convertedAt: true,
        },
      });

      // Calculate analytics
      const analytics: LeadAnalytics = {
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === LeadStatus.NEW).length,
        qualifiedLeads: leads.filter(l => l.status === LeadStatus.QUALIFIED).length,
        convertedLeads: leads.filter(l => l.status === LeadStatus.CONVERTED).length,
        averageScore: leads.length > 0 ? leads.reduce((sum, l) => sum + l.score, 0) / leads.length : 0,
        conversionRate: leads.length > 0 ? (leads.filter(l => l.status === LeadStatus.CONVERTED).length / leads.length) * 100 : 0,
        sourceBreakdown: {},
        industryBreakdown: {},
        timeToConversion: 0,
        date: new Date(),
      };

      // Calculate source breakdown
      leads.forEach(lead => {
        analytics.sourceBreakdown[lead.source] = (analytics.sourceBreakdown[lead.source] || 0) + 1;
        if (lead.industry) {
          analytics.industryBreakdown[lead.industry] = (analytics.industryBreakdown[lead.industry] || 0) + 1;
        }
      });

      // Calculate average time to conversion
      const convertedLeads = leads.filter(l => l.status === LeadStatus.CONVERTED && l.convertedAt);
      if (convertedLeads.length > 0) {
        const totalDays = convertedLeads.reduce((sum, lead) => {
          const days = Math.ceil((lead.convertedAt!.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        analytics.timeToConversion = totalDays / convertedLeads.length;
      }

      return analytics;
    } catch (error) {
      console.error('Failed to get lead analytics:', error);
      throw error;
    }
  }

  /**
   * Create nurturing workflow
   */
  async createNurturingWorkflow(workflow: Omit<NurturingWorkflow, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const automation = await prisma.marketingAutomation.create({
        data: {
          name: workflow.name,
          description: workflow.description,
          type: 'LEAD_NURTURING',
          status: workflow.isActive ? 'ACTIVE' : 'DRAFT',
          metadata: {
            triggers: workflow.triggers,
            actions: workflow.actions,
            workflowType: 'lead_nurturing',
          },
          siteId: workflow.siteId,
        },
      });

      return automation;
    } catch (error) {
      console.error('Failed to create nurturing workflow:', error);
      throw error;
    }
  }

  /**
   * Get nurturing workflows
   */
  async getNurturingWorkflows(siteId: string) {
    try {
      const workflows = await prisma.marketingAutomation.findMany({
        where: {
          siteId,
          type: 'LEAD_NURTURING',
          metadata: {
            path: ['workflowType'],
            equals: 'lead_nurturing',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return workflows.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        triggers: workflow.metadata?.triggers || [],
        actions: workflow.metadata?.actions || [],
        isActive: workflow.status === 'ACTIVE',
        siteId: workflow.siteId,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get nurturing workflows:', error);
      throw error;
    }
  }

  /**
   * Trigger nurturing workflows for a lead
   */
  private async triggerNurturingWorkflows(lead: any) {
    try {
      const workflows = await this.getNurturingWorkflows(lead.siteId);
      
      for (const workflow of workflows) {
        if (!workflow.isActive) continue;

        for (const trigger of workflow.triggers) {
          if (trigger.type === 'lead_created') {
            // Check if conditions are met
            const conditionsMet = this.evaluateNurturingConditions(trigger.conditions, lead);
            
            if (conditionsMet) {
              await this.executeNurturingActions(workflow.actions, lead);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to trigger nurturing workflows:', error);
    }
  }

  /**
   * Evaluate nurturing conditions
   */
  private evaluateNurturingConditions(conditions: NurturingCondition[], lead: any): boolean {
    for (const condition of conditions) {
      const value = (lead as any)[condition.field];
      
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
   * Execute nurturing actions
   */
  private async executeNurturingActions(actions: NurturingAction[], lead: any) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_task':
            await prisma.task.create({
              data: {
                title: `Follow up with ${lead.firstName} ${lead.lastName}`,
                description: `Lead from ${lead.source} - Score: ${lead.score}`,
                type: action.taskType || TaskType.FOLLOW_UP,
                priority: action.taskPriority || TaskPriority.MEDIUM,
                status: TaskStatus.PENDING,
                dueDate: new Date(Date.now() + (action.followUpDelay || 1) * 24 * 60 * 60 * 1000),
                leadId: lead.id,
                siteId: lead.siteId,
                assignedTo: action.assignTo || lead.assignedTo,
              },
            });
            break;

          case 'update_score':
            if (action.scoreChange) {
              await this.updateLeadScore(lead.id, action.scoreChange, 'Nurturing workflow action');
            }
            break;

          case 'assign_lead':
            if (action.assignTo) {
              await prisma.lead.update({
                where: { id: lead.id },
                data: { assignedTo: action.assignTo },
              });
            }
            break;

          case 'schedule_followup':
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                nextFollowUp: new Date(Date.now() + (action.followUpDelay || 1) * 24 * 60 * 60 * 1000),
              },
            });
            break;

          default:
            console.log(`Executing nurturing action: ${action.type}`);
        }
      } catch (error) {
        console.error(`Failed to execute nurturing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Import leads from CSV
   */
  async importLeads(siteId: string, csvData: string, options: {
    skipHeader?: boolean;
    delimiter?: string;
    mapping?: Record<string, string>;
  } = {}) {
    try {
      const lines = csvData.split('\n');
      const delimiter = options.delimiter || ',';
      const skipHeader = options.skipHeader !== false;
      
      const startIndex = skipHeader ? 1 : 0;
      const importedLeads = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(delimiter);
        const leadData: any = { siteId };

        // Map CSV columns to lead fields
        const mapping = options.mapping || {
          0: 'firstName',
          1: 'lastName',
          2: 'email',
          3: 'phone',
          4: 'company',
          5: 'jobTitle',
          6: 'website',
          7: 'industry',
          8: 'companySize',
          9: 'budget',
          10: 'timeline',
          11: 'source',
        };

        for (const [index, field] of Object.entries(mapping)) {
          const value = values[parseInt(index)];
          if (value && value.trim()) {
            leadData[field] = value.trim();
          }
        }

        // Set default source if not provided
        if (!leadData.source) {
          leadData.source = 'import';
        }

        try {
          const lead = await this.createLead(leadData);
          importedLeads.push(lead);
        } catch (error) {
          console.error(`Failed to import lead at line ${i + 1}:`, error);
        }
      }

      return { success: true, importedCount: importedLeads.length, leads: importedLeads };
    } catch (error) {
      console.error('Failed to import leads:', error);
      throw error;
    }
  }

  /**
   * Export leads to CSV
   */
  async exportLeads(siteId: string, options: {
    status?: LeadStatus;
    assignedTo?: string;
    source?: string;
    format?: 'csv' | 'json';
  } = {}) {
    try {
      const leads = await this.getLeads(siteId, options);

      if (options.format === 'json') {
        return { success: true, data: leads, format: 'json' };
      }

      // Generate CSV
      const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title',
        'Website', 'Industry', 'Company Size', 'Budget', 'Timeline', 'Source',
        'Score', 'Status', 'Assigned To', 'Created At', 'Last Contacted'
      ];

      const csvLines = [headers.join(',')];

      for (const lead of leads) {
        const row = [
          lead.id,
          `"${lead.firstName}"`,
          `"${lead.lastName}"`,
          `"${lead.email}"`,
          lead.phone ? `"${lead.phone}"` : '',
          lead.company ? `"${lead.company}"` : '',
          lead.jobTitle ? `"${lead.jobTitle}"` : '',
          lead.website ? `"${lead.website}"` : '',
          lead.industry ? `"${lead.industry}"` : '',
          lead.companySize ? `"${lead.companySize}"` : '',
          lead.budget ? `"${lead.budget}"` : '',
          lead.timeline ? `"${lead.timeline}"` : '',
          `"${lead.source}"`,
          lead.score,
          lead.status,
          lead.assignedUser ? `"${lead.assignedUser.firstName} ${lead.assignedUser.lastName}"` : '',
          lead.createdAt.toISOString(),
          lead.lastContacted ? lead.lastContacted.toISOString() : '',
        ];
        csvLines.push(row.join(','));
      }

      return { success: true, data: csvLines.join('\n'), format: 'csv' };
    } catch (error) {
      console.error('Failed to export leads:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadGenerationService = new LeadGenerationService(); 