import { prisma } from '../../prisma';
import { redis } from '../../redis';
import { siemService } from '../monitoring/siem-service';
import { alertingService } from '../monitoring/alerting-service';
import { z } from 'zod';

// Incident response configuration
const INCIDENT_CONFIG = {
  // Incident severity levels and response times
  severityLevels: {
    P1_CRITICAL: {
      name: 'Critical',
      description: 'System down, major security breach, data loss',
      responseTime: 15, // minutes
      escalationTime: 30, // minutes
      maxResolutionTime: 4 * 60, // 4 hours
      autoEscalate: true,
      stakeholders: ['ciso', 'security-team', 'executives', 'legal'],
    },
    P2_HIGH: {
      name: 'High',
      description: 'Major functionality impaired, security threat detected',
      responseTime: 30, // minutes
      escalationTime: 60, // minutes
      maxResolutionTime: 8 * 60, // 8 hours
      autoEscalate: true,
      stakeholders: ['security-team', 'operations', 'management'],
    },
    P3_MEDIUM: {
      name: 'Medium',
      description: 'Minor functionality impaired, potential security issue',
      responseTime: 2 * 60, // 2 hours
      escalationTime: 4 * 60, // 4 hours
      maxResolutionTime: 24 * 60, // 24 hours
      autoEscalate: false,
      stakeholders: ['security-team', 'operations'],
    },
    P4_LOW: {
      name: 'Low',
      description: 'Minor issues, informational security events',
      responseTime: 8 * 60, // 8 hours
      escalationTime: 24 * 60, // 24 hours
      maxResolutionTime: 72 * 60, // 72 hours
      autoEscalate: false,
      stakeholders: ['security-team'],
    },
  },

  // Incident categories and automatic classification
  categories: {
    SECURITY_BREACH: {
      keywords: ['breach', 'unauthorized', 'intrusion', 'malware', 'ransomware'],
      defaultSeverity: 'P1_CRITICAL',
      playbook: 'security-breach-response',
      autoActions: ['isolate-systems', 'notify-stakeholders', 'collect-evidence'],
    },
    DATA_LEAK: {
      keywords: ['data leak', 'data loss', 'exfiltration', 'unauthorized access'],
      defaultSeverity: 'P1_CRITICAL',
      playbook: 'data-breach-response',
      autoActions: ['notify-legal', 'assess-scope', 'regulatory-notification'],
    },
    SYSTEM_OUTAGE: {
      keywords: ['outage', 'down', 'unavailable', 'service failure'],
      defaultSeverity: 'P2_HIGH',
      playbook: 'system-recovery',
      autoActions: ['status-page-update', 'escalate-operations'],
    },
    MALWARE_INFECTION: {
      keywords: ['malware', 'virus', 'trojan', 'infection', 'suspicious file'],
      defaultSeverity: 'P2_HIGH',
      playbook: 'malware-response',
      autoActions: ['quarantine-system', 'scan-network', 'update-signatures'],
    },
    PHISHING_ATTACK: {
      keywords: ['phishing', 'social engineering', 'suspicious email'],
      defaultSeverity: 'P3_MEDIUM',
      playbook: 'phishing-response',
      autoActions: ['block-sender', 'warn-users', 'analyze-payload'],
    },
    COMPLIANCE_VIOLATION: {
      keywords: ['compliance', 'violation', 'audit finding', 'regulatory'],
      defaultSeverity: 'P3_MEDIUM',
      playbook: 'compliance-response',
      autoActions: ['notify-compliance', 'document-violation'],
    },
  },

  // Incident workflow states
  workflowStates: [
    'NEW',           // Incident just created
    'ACKNOWLEDGED',  // Someone is aware of the incident
    'INVESTIGATING', // Actively investigating
    'RESPONDING',    // Taking action to resolve
    'MONITORING',    // Watching for resolution confirmation
    'RESOLVED',      // Issue resolved
    'CLOSED',        // Incident closed with documentation
  ],

  // Communication templates
  communicationTemplates: {
    INCIDENT_DECLARED: {
      subject: '[INCIDENT] {severity} - {title}',
      template: 'Security incident declared:\n\nTitle: {title}\nSeverity: {severity}\nDescription: {description}\n\nIncident Commander: {commander}\nNext Update: {nextUpdate}',
    },
    STATUS_UPDATE: {
      subject: '[INCIDENT UPDATE] {severity} - {title}',
      template: 'Incident Status Update:\n\nTitle: {title}\nStatus: {status}\nProgress: {progress}\n\nNext Update: {nextUpdate}',
    },
    INCIDENT_RESOLVED: {
      subject: '[INCIDENT RESOLVED] {title}',
      template: 'Incident has been resolved:\n\nTitle: {title}\nResolution: {resolution}\nDuration: {duration}\n\nPost-incident review will be scheduled.',
    },
  },

  // Automated response actions
  automatedActions: {
    'isolate-systems': {
      description: 'Isolate affected systems from network',
      script: 'isolate_systems.sh',
      confirmationRequired: true,
    },
    'block-ip': {
      description: 'Block malicious IP addresses',
      script: 'block_ip.sh',
      confirmationRequired: false,
    },
    'quarantine-system': {
      description: 'Quarantine infected system',
      script: 'quarantine_system.sh',
      confirmationRequired: true,
    },
    'collect-evidence': {
      description: 'Collect forensic evidence',
      script: 'collect_evidence.sh',
      confirmationRequired: false,
    },
    'notify-stakeholders': {
      description: 'Send notifications to stakeholders',
      script: 'notify_stakeholders.sh',
      confirmationRequired: false,
    },
  },
} as const;

// Validation schemas
export const incidentCreationSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  severity: z.enum(['P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW']),
  category: z.enum(['SECURITY_BREACH', 'DATA_LEAK', 'SYSTEM_OUTAGE', 'MALWARE_INFECTION', 'PHISHING_ATTACK', 'COMPLIANCE_VIOLATION', 'OTHER']),
  source: z.string(),
  affectedSystems: z.array(z.string()).optional(),
  initialEvidence: z.array(z.string()).optional(),
  reportedBy: z.string(),
  siteId: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const incidentUpdateSchema = z.object({
  incidentId: z.string(),
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESPONDING', 'MONITORING', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  progress: z.string().optional(),
  resolution: z.string().optional(),
  lessonsLearned: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const incidentCommunicationSchema = z.object({
  incidentId: z.string(),
  type: z.enum(['STATUS_UPDATE', 'ESCALATION', 'RESOLUTION', 'STAKEHOLDER_NOTIFICATION']),
  message: z.string(),
  recipients: z.array(z.string()),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  channels: z.array(z.enum(['email', 'sms', 'slack', 'teams'])).default(['email']),
});

// Interfaces
interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  priority: number;
  source: string;
  affectedSystems: string[];
  reportedBy: string;
  assignedTo?: string;
  incidentCommander?: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  responseTime?: number; // minutes
  resolutionTime?: number; // minutes
  timeline: IncidentTimelineEntry[];
  communications: IncidentCommunication[];
  actions: IncidentAction[];
  evidence: IncidentEvidence[];
  metadata: Record<string, any>;
}

interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  timestamp: Date;
  actor: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
}

interface IncidentCommunication {
  id: string;
  incidentId: string;
  type: string;
  message: string;
  sentAt: Date;
  sentBy: string;
  recipients: string[];
  channels: string[];
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
}

interface IncidentAction {
  id: string;
  incidentId: string;
  actionType: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  assignedTo?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  results?: string;
  automated: boolean;
  metadata: Record<string, any>;
}

interface IncidentEvidence {
  id: string;
  incidentId: string;
  type: 'LOG_FILE' | 'SCREENSHOT' | 'NETWORK_CAPTURE' | 'MEMORY_DUMP' | 'DOCUMENT' | 'OTHER';
  fileName: string;
  filePath: string;
  collectedBy: string;
  collectedAt: Date;
  hash: string;
  chainOfCustody: Array<{
    transferredTo: string;
    transferredAt: Date;
    purpose: string;
  }>;
  metadata: Record<string, any>;
}

interface IncidentPlaybook {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    estimatedTime: number;
    required: boolean;
    automatable: boolean;
    script?: string;
  }>;
  roles: Array<{
    role: string;
    responsibilities: string[];
  }>;
  communicationPlan: Array<{
    trigger: string;
    recipients: string[];
    template: string;
    frequency: string;
  }>;
  escalationCriteria: string[];
  successCriteria: string[];
}

// Incident Response Service
export class IncidentResponseService {
  private activeIncidents: Map<string, Incident> = new Map();
  private playbooks: Map<string, IncidentPlaybook> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize incident response service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load existing active incidents
      await this.loadActiveIncidents();

      // Load incident response playbooks
      await this.loadPlaybooks();

      // Start background processors
      this.startBackgroundProcessors();

      // Subscribe to security events for automated incident detection
      siemService.on('securityEvent', (event) => {
        this.processEventForIncidentDetection(event);
      });

      // Subscribe to threat assessments
      siemService.on('threatAssessment', (assessment) => {
        this.processThreatAssessmentForIncidents(assessment);
      });

      console.log('Incident Response Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Incident Response Service:', error);
    }
  }

  /**
   * Create new security incident
   */
  async createIncident(
    incidentData: z.infer<typeof incidentCreationSchema>
  ): Promise<Incident> {
    try {
      const validatedData = incidentCreationSchema.parse(incidentData);

      // Generate incident ID
      const incidentId = this.generateIncidentId(validatedData.severity);

      // Determine incident commander based on severity
      const incidentCommander = await this.assignIncidentCommander(validatedData.severity);

      // Create incident record
      const incident = await prisma.securityIncident.create({
        data: {
          id: incidentId,
          title: validatedData.title,
          description: validatedData.description,
          severity: validatedData.severity,
          category: validatedData.category,
          status: 'NEW',
          priority: this.calculatePriority(validatedData.severity, validatedData.category),
          source: validatedData.source,
          affectedSystems: validatedData.affectedSystems || [],
          reportedBy: validatedData.reportedBy,
          incidentCommander,
          siteId: validatedData.siteId,
          metadata: {
            ...validatedData.metadata,
            initialEvidence: validatedData.initialEvidence || [],
            autoDetected: false,
          },
        },
      });

      // Create incident object
      const incidentObj: Incident = {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        category: incident.category,
        status: incident.status,
        priority: incident.priority,
        source: incident.source,
        affectedSystems: incident.affectedSystems as string[],
        reportedBy: incident.reportedBy,
        incidentCommander: incident.incidentCommander || undefined,
        siteId: incident.siteId,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        timeline: [],
        communications: [],
        actions: [],
        evidence: [],
        metadata: incident.metadata as Record<string, any>,
      };

      // Add to active incidents
      this.activeIncidents.set(incidentId, incidentObj);

      // Add initial timeline entry
      await this.addTimelineEntry(incidentId, {
        actor: validatedData.reportedBy,
        action: 'INCIDENT_CREATED',
        description: `Incident created: ${validatedData.title}`,
        metadata: { severity: validatedData.severity, category: validatedData.category },
      });

      // Execute automated actions based on category
      await this.executeAutomatedActions(incidentObj);

      // Send initial notifications
      await this.sendIncidentNotifications(incidentObj, 'INCIDENT_DECLARED');

      // Set up escalation timers
      this.setupEscalationTimer(incidentObj);

      // Log incident creation
      await siemService.ingestEvent({
        eventType: 'SECURITY_ALERT',
        severity: validatedData.severity === 'P1_CRITICAL' ? 'CRITICAL' : 'HIGH',
        source: 'IncidentResponse',
        title: `Security Incident Created: ${validatedData.title}`,
        description: `New ${validatedData.severity} incident: ${validatedData.description}`,
        userId: validatedData.reportedBy,
        siteId: validatedData.siteId,
        metadata: {
          incidentId,
          category: validatedData.category,
          incidentCommander,
          affectedSystems: validatedData.affectedSystems,
        },
      });

      return incidentObj;

    } catch (error) {
      console.error('Failed to create incident:', error);
      throw new Error(`Incident creation failed: ${error.message}`);
    }
  }

  /**
   * Update incident status and information
   */
  async updateIncident(
    updateData: z.infer<typeof incidentUpdateSchema>,
    updatedBy: string
  ): Promise<Incident> {
    try {
      const validatedData = incidentUpdateSchema.parse(updateData);
      const incident = this.activeIncidents.get(validatedData.incidentId);

      if (!incident) {
        throw new Error('Incident not found');
      }

      const updateFields: any = { updatedAt: new Date() };
      const timelineEntries: Array<{ actor: string; action: string; description: string; metadata?: any }> = [];

      // Update status
      if (validatedData.status && validatedData.status !== incident.status) {
        updateFields.status = validatedData.status;
        incident.status = validatedData.status;

        timelineEntries.push({
          actor: updatedBy,
          action: 'STATUS_CHANGED',
          description: `Status changed from ${incident.status} to ${validatedData.status}`,
          metadata: { oldStatus: incident.status, newStatus: validatedData.status },
        });

        // Handle special status transitions
        if (validatedData.status === 'ACKNOWLEDGED' && !incident.acknowledgedAt) {
          updateFields.acknowledgedAt = new Date();
          incident.acknowledgedAt = new Date();
          incident.responseTime = this.calculateResponseTime(incident.createdAt, incident.acknowledgedAt);
        }

        if (validatedData.status === 'RESOLVED' && !incident.resolvedAt) {
          updateFields.resolvedAt = new Date();
          incident.resolvedAt = new Date();
          incident.resolutionTime = this.calculateResponseTime(incident.createdAt, incident.resolvedAt);
          
          // Clear escalation timer
          this.clearEscalationTimer(incident.id);
        }

        if (validatedData.status === 'CLOSED') {
          updateFields.closedAt = new Date();
          incident.closedAt = new Date();
        }
      }

      // Update assignment
      if (validatedData.assignedTo && validatedData.assignedTo !== incident.assignedTo) {
        updateFields.assignedTo = validatedData.assignedTo;
        incident.assignedTo = validatedData.assignedTo;

        timelineEntries.push({
          actor: updatedBy,
          action: 'ASSIGNED',
          description: `Incident assigned to ${validatedData.assignedTo}`,
          metadata: { assignedTo: validatedData.assignedTo },
        });
      }

      // Update priority
      if (validatedData.priority && validatedData.priority !== incident.priority) {
        updateFields.priority = validatedData.priority;
        incident.priority = validatedData.priority;

        timelineEntries.push({
          actor: updatedBy,
          action: 'PRIORITY_CHANGED',
          description: `Priority changed to ${validatedData.priority}`,
          metadata: { newPriority: validatedData.priority },
        });
      }

      // Add progress update
      if (validatedData.progress) {
        timelineEntries.push({
          actor: updatedBy,
          action: 'PROGRESS_UPDATE',
          description: validatedData.progress,
        });
      }

      // Add resolution information
      if (validatedData.resolution) {
        updateFields.resolution = validatedData.resolution;
        incident.metadata.resolution = validatedData.resolution;

        timelineEntries.push({
          actor: updatedBy,
          action: 'RESOLUTION_ADDED',
          description: `Resolution documented: ${validatedData.resolution}`,
        });
      }

      // Add lessons learned
      if (validatedData.lessonsLearned) {
        incident.metadata.lessonsLearned = validatedData.lessonsLearned;

        timelineEntries.push({
          actor: updatedBy,
          action: 'LESSONS_LEARNED_ADDED',
          description: 'Lessons learned documented',
        });
      }

      // Update metadata
      if (validatedData.metadata) {
        updateFields.metadata = { ...incident.metadata, ...validatedData.metadata };
        incident.metadata = updateFields.metadata;
      }

      // Update database
      await prisma.securityIncident.update({
        where: { id: validatedData.incidentId },
        data: updateFields,
      });

      // Add timeline entries
      for (const entry of timelineEntries) {
        await this.addTimelineEntry(validatedData.incidentId, entry);
      }

      // Send status update notifications
      if (validatedData.status) {
        await this.sendIncidentNotifications(incident, 'STATUS_UPDATE');
      }

      // Handle incident resolution
      if (validatedData.status === 'RESOLVED') {
        await this.handleIncidentResolution(incident);
      }

      return incident;

    } catch (error) {
      console.error('Failed to update incident:', error);
      throw new Error(`Incident update failed: ${error.message}`);
    }
  }

  /**
   * Add timeline entry to incident
   */
  async addTimelineEntry(
    incidentId: string,
    entry: {
      actor: string;
      action: string;
      description: string;
      metadata?: Record<string, any>;
    }
  ): Promise<IncidentTimelineEntry> {
    try {
      const timelineEntry = await prisma.incidentTimeline.create({
        data: {
          incidentId,
          timestamp: new Date(),
          actor: entry.actor,
          action: entry.action,
          description: entry.description,
          metadata: entry.metadata || {},
        },
      });

      const timelineObj: IncidentTimelineEntry = {
        id: timelineEntry.id,
        incidentId: timelineEntry.incidentId,
        timestamp: timelineEntry.timestamp,
        actor: timelineEntry.actor,
        action: timelineEntry.action,
        description: timelineEntry.description,
        metadata: timelineEntry.metadata as Record<string, any>,
      };

      // Add to incident object
      const incident = this.activeIncidents.get(incidentId);
      if (incident) {
        incident.timeline.push(timelineObj);
      }

      return timelineObj;

    } catch (error) {
      console.error('Failed to add timeline entry:', error);
      throw new Error(`Timeline entry creation failed: ${error.message}`);
    }
  }

  /**
   * Execute automated incident action
   */
  async executeIncidentAction(
    incidentId: string,
    actionType: string,
    assignedTo?: string,
    automated: boolean = false
  ): Promise<IncidentAction> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      const actionConfig = INCIDENT_CONFIG.automatedActions[actionType as keyof typeof INCIDENT_CONFIG.automatedActions];
      if (!actionConfig) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      // Create action record
      const action = await prisma.incidentAction.create({
        data: {
          incidentId,
          actionType,
          description: actionConfig.description,
          status: 'PENDING',
          assignedTo,
          automated,
          metadata: {
            script: actionConfig.script,
            confirmationRequired: actionConfig.confirmationRequired,
          },
        },
      });

      const actionObj: IncidentAction = {
        id: action.id,
        incidentId: action.incidentId,
        actionType: action.actionType,
        description: action.description,
        status: action.status as any,
        assignedTo: action.assignedTo || undefined,
        automated: action.automated,
        metadata: action.metadata as Record<string, any>,
      };

      // Add to incident
      incident.actions.push(actionObj);

      // Execute action if automated and no confirmation required
      if (automated && !actionConfig.confirmationRequired) {
        await this.executeActionScript(actionObj);
      }

      // Add timeline entry
      await this.addTimelineEntry(incidentId, {
        actor: assignedTo || 'SYSTEM',
        action: 'ACTION_CREATED',
        description: `${automated ? 'Automated' : 'Manual'} action created: ${actionConfig.description}`,
        metadata: { actionId: action.id, actionType },
      });

      return actionObj;

    } catch (error) {
      console.error('Failed to execute incident action:', error);
      throw new Error(`Action execution failed: ${error.message}`);
    }
  }

  /**
   * Send incident communication
   */
  async sendIncidentCommunication(
    communicationData: z.infer<typeof incidentCommunicationSchema>
  ): Promise<IncidentCommunication> {
    try {
      const validatedData = incidentCommunicationSchema.parse(communicationData);
      const incident = this.activeIncidents.get(validatedData.incidentId);

      if (!incident) {
        throw new Error('Incident not found');
      }

      // Create communication record
      const communication = await prisma.incidentCommunication.create({
        data: {
          incidentId: validatedData.incidentId,
          type: validatedData.type,
          message: validatedData.message,
          sentAt: new Date(),
          sentBy: 'SYSTEM', // Would be actual user ID
          recipients: validatedData.recipients,
          channels: validatedData.channels,
          status: 'PENDING',
        },
      });

      const commObj: IncidentCommunication = {
        id: communication.id,
        incidentId: communication.incidentId,
        type: communication.type,
        message: communication.message,
        sentAt: communication.sentAt,
        sentBy: communication.sentBy,
        recipients: communication.recipients as string[],
        channels: communication.channels as string[],
        status: communication.status as any,
      };

      // Send through alerting service
      await alertingService.sendNotification({
        type: 'SECURITY_ALERT',
        severity: incident.severity === 'P1_CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: `Incident Communication: ${incident.title}`,
        message: validatedData.message,
        targetUsers: validatedData.recipients,
        channels: validatedData.channels as any,
        metadata: {
          incidentId: validatedData.incidentId,
          communicationType: validatedData.type,
        },
      });

      // Update status
      await prisma.incidentCommunication.update({
        where: { id: communication.id },
        data: { status: 'SENT' },
      });

      commObj.status = 'SENT';
      incident.communications.push(commObj);

      return commObj;

    } catch (error) {
      console.error('Failed to send incident communication:', error);
      throw new Error(`Communication failed: ${error.message}`);
    }
  }

  /**
   * Get incident details
   */
  async getIncident(incidentId: string): Promise<Incident | null> {
    try {
      // Try to get from active incidents first
      const activeIncident = this.activeIncidents.get(incidentId);
      if (activeIncident) {
        return activeIncident;
      }

      // Load from database
      const incident = await prisma.securityIncident.findUnique({
        where: { id: incidentId },
        include: {
          timeline: { orderBy: { timestamp: 'asc' } },
          communications: { orderBy: { sentAt: 'desc' } },
          actions: { orderBy: { createdAt: 'asc' } },
          evidence: { orderBy: { collectedAt: 'desc' } },
        },
      });

      if (!incident) {
        return null;
      }

      return this.mapPrismaIncidentToIncident(incident);

    } catch (error) {
      console.error('Failed to get incident:', error);
      return null;
    }
  }

  /**
   * Get incidents with filtering
   */
  async getIncidents(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    assignedTo?: string;
    siteId?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }): Promise<Incident[]> {
    try {
      const whereClause: any = {};

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.severity) {
        whereClause.severity = filters.severity;
      }

      if (filters?.category) {
        whereClause.category = filters.category;
      }

      if (filters?.assignedTo) {
        whereClause.assignedTo = filters.assignedTo;
      }

      if (filters?.siteId) {
        whereClause.siteId = filters.siteId;
      }

      if (filters?.timeRange) {
        whereClause.createdAt = {
          gte: filters.timeRange.start,
          lte: filters.timeRange.end,
        };
      }

      const incidents = await prisma.securityIncident.findMany({
        where: whereClause,
        include: {
          timeline: { orderBy: { timestamp: 'asc' } },
          communications: { orderBy: { sentAt: 'desc' } },
          actions: { orderBy: { createdAt: 'asc' } },
          evidence: { orderBy: { collectedAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
      });

      return incidents.map(this.mapPrismaIncidentToIncident.bind(this));

    } catch (error) {
      console.error('Failed to get incidents:', error);
      return [];
    }
  }

  // Helper methods (private)

  private async loadActiveIncidents(): Promise<void> {
    const activeIncidents = await prisma.securityIncident.findMany({
      where: {
        status: { in: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESPONDING', 'MONITORING'] },
      },
      include: {
        timeline: { orderBy: { timestamp: 'asc' } },
        communications: { orderBy: { sentAt: 'desc' } },
        actions: { orderBy: { createdAt: 'asc' } },
        evidence: { orderBy: { collectedAt: 'desc' } },
      },
    });

    for (const incident of activeIncidents) {
      const incidentObj = this.mapPrismaIncidentToIncident(incident);
      this.activeIncidents.set(incident.id, incidentObj);
      
      // Restore escalation timers for active incidents
      this.setupEscalationTimer(incidentObj);
    }
  }

  private async loadPlaybooks(): Promise<void> {
    // Load incident response playbooks from database or configuration
    const defaultPlaybooks = [
      {
        id: 'security-breach-response',
        name: 'Security Breach Response',
        description: 'Response procedures for security breaches',
        category: 'SECURITY_BREACH',
        steps: [
          { order: 1, title: 'Immediate Assessment', description: 'Assess scope and impact', estimatedTime: 15, required: true, automatable: false },
          { order: 2, title: 'Containment', description: 'Isolate affected systems', estimatedTime: 30, required: true, automatable: true, script: 'isolate_systems.sh' },
          { order: 3, title: 'Evidence Collection', description: 'Collect forensic evidence', estimatedTime: 60, required: true, automatable: true, script: 'collect_evidence.sh' },
          { order: 4, title: 'Stakeholder Notification', description: 'Notify required stakeholders', estimatedTime: 15, required: true, automatable: true, script: 'notify_stakeholders.sh' },
          { order: 5, title: 'Recovery Planning', description: 'Plan system recovery', estimatedTime: 90, required: true, automatable: false },
        ],
        roles: [
          { role: 'Incident Commander', responsibilities: ['Overall incident coordination', 'Decision making', 'Stakeholder communication'] },
          { role: 'Security Analyst', responsibilities: ['Technical analysis', 'Evidence collection', 'Threat assessment'] },
          { role: 'System Administrator', responsibilities: ['System isolation', 'Recovery operations', 'Technical remediation'] },
        ],
        communicationPlan: [
          { trigger: 'Incident Declaration', recipients: ['management', 'security-team'], template: 'INCIDENT_DECLARED', frequency: 'immediate' },
          { trigger: 'Every 2 hours', recipients: ['stakeholders'], template: 'STATUS_UPDATE', frequency: 'recurring' },
        ],
        escalationCriteria: ['No progress after 1 hour', 'Additional systems affected', 'Data exfiltration confirmed'],
        successCriteria: ['All systems secured', 'No ongoing threat', 'Recovery plan implemented'],
      },
    ];

    for (const playbook of defaultPlaybooks) {
      this.playbooks.set(playbook.id, playbook as IncidentPlaybook);
    }
  }

  private startBackgroundProcessors(): void {
    // Check for escalations every 5 minutes
    setInterval(async () => {
      await this.processEscalations();
    }, 5 * 60 * 1000);

    // Clean up closed incidents from memory every hour
    setInterval(async () => {
      await this.cleanupClosedIncidents();
    }, 60 * 60 * 1000);
  }

  private async processEventForIncidentDetection(event: any): Promise<void> {
    // Auto-detect incidents based on security events
    if (event.severity === 'CRITICAL' || event.threatScore > 80) {
      await this.createAutomaticIncident(event);
    }
  }

  private async processThreatAssessmentForIncidents(assessment: any): Promise<void> {
    // Create incidents for high-risk threat assessments
    if (assessment.riskScore > 85) {
      await this.createIncidentFromThreatAssessment(assessment);
    }
  }

  private generateIncidentId(severity: string): string {
    const prefix = severity.split('_')[0]; // P1, P2, P3, P4
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `INC-${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  private async assignIncidentCommander(severity: string): Promise<string> {
    // Logic to assign incident commander based on severity and availability
    // For now, return a default value
    return 'security-commander-1';
  }

  private calculatePriority(severity: string, category: string): number {
    const severityScores = { P1_CRITICAL: 1, P2_HIGH: 2, P3_MEDIUM: 3, P4_LOW: 4 };
    return severityScores[severity as keyof typeof severityScores] || 5;
  }

  private async executeAutomatedActions(incident: Incident): Promise<void> {
    const categoryConfig = INCIDENT_CONFIG.categories[incident.category as keyof typeof INCIDENT_CONFIG.categories];
    if (categoryConfig && categoryConfig.autoActions) {
      for (const action of categoryConfig.autoActions) {
        await this.executeIncidentAction(incident.id, action, undefined, true);
      }
    }
  }

  private async sendIncidentNotifications(incident: Incident, type: string): Promise<void> {
    const severityConfig = INCIDENT_CONFIG.severityLevels[incident.severity as keyof typeof INCIDENT_CONFIG.severityLevels];
    const template = INCIDENT_CONFIG.communicationTemplates[type as keyof typeof INCIDENT_CONFIG.communicationTemplates];

    if (severityConfig && template) {
      const message = this.populateTemplate(template.template, incident);
      
      await this.sendIncidentCommunication({
        incidentId: incident.id,
        type: type as any,
        message,
        recipients: severityConfig.stakeholders,
        priority: incident.severity === 'P1_CRITICAL' ? 'URGENT' : 'HIGH',
        channels: ['email', 'slack'],
      });
    }
  }

  private setupEscalationTimer(incident: Incident): void {
    const severityConfig = INCIDENT_CONFIG.severityLevels[incident.severity as keyof typeof INCIDENT_CONFIG.severityLevels];
    
    if (severityConfig.autoEscalate && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
      const escalationTime = severityConfig.escalationTime * 60 * 1000; // Convert to milliseconds
      
      const timer = setTimeout(async () => {
        await this.escalateIncident(incident.id);
      }, escalationTime);

      this.escalationTimers.set(incident.id, timer);
    }
  }

  private clearEscalationTimer(incidentId: string): void {
    const timer = this.escalationTimers.get(incidentId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(incidentId);
    }
  }

  private calculateResponseTime(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // Minutes
  }

  private async handleIncidentResolution(incident: Incident): Promise<void> {
    // Send resolution notifications
    await this.sendIncidentNotifications(incident, 'INCIDENT_RESOLVED');

    // Schedule post-incident review
    await this.schedulePostIncidentReview(incident);

    // Update incident metrics
    await this.updateIncidentMetrics(incident);
  }

  private async executeActionScript(action: IncidentAction): Promise<void> {
    // Implementation would execute actual scripts
    // For now, just simulate execution
    action.status = 'IN_PROGRESS';
    
    setTimeout(async () => {
      action.status = 'COMPLETED';
      action.completedAt = new Date();
      action.results = 'Action completed successfully';

      await prisma.incidentAction.update({
        where: { id: action.id },
        data: {
          status: action.status,
          completedAt: action.completedAt,
          results: action.results,
        },
      });
    }, 5000); // Simulate 5 second execution
  }

  private populateTemplate(template: string, incident: Incident): string {
    return template
      .replace('{title}', incident.title)
      .replace('{severity}', incident.severity)
      .replace('{description}', incident.description)
      .replace('{status}', incident.status)
      .replace('{commander}', incident.incidentCommander || 'TBD')
      .replace('{nextUpdate}', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()); // 2 hours from now
  }

  private mapPrismaIncidentToIncident(prismaIncident: any): Incident {
    return {
      id: prismaIncident.id,
      title: prismaIncident.title,
      description: prismaIncident.description,
      severity: prismaIncident.severity,
      category: prismaIncident.category,
      status: prismaIncident.status,
      priority: prismaIncident.priority,
      source: prismaIncident.source,
      affectedSystems: prismaIncident.affectedSystems || [],
      reportedBy: prismaIncident.reportedBy,
      assignedTo: prismaIncident.assignedTo || undefined,
      incidentCommander: prismaIncident.incidentCommander || undefined,
      siteId: prismaIncident.siteId,
      createdAt: prismaIncident.createdAt,
      updatedAt: prismaIncident.updatedAt,
      acknowledgedAt: prismaIncident.acknowledgedAt || undefined,
      resolvedAt: prismaIncident.resolvedAt || undefined,
      closedAt: prismaIncident.closedAt || undefined,
      responseTime: prismaIncident.responseTime || undefined,
      resolutionTime: prismaIncident.resolutionTime || undefined,
      timeline: prismaIncident.timeline?.map((t: any) => ({
        id: t.id,
        incidentId: t.incidentId,
        timestamp: t.timestamp,
        actor: t.actor,
        action: t.action,
        description: t.description,
        metadata: t.metadata,
      })) || [],
      communications: prismaIncident.communications?.map((c: any) => ({
        id: c.id,
        incidentId: c.incidentId,
        type: c.type,
        message: c.message,
        sentAt: c.sentAt,
        sentBy: c.sentBy,
        recipients: c.recipients,
        channels: c.channels,
        status: c.status,
      })) || [],
      actions: prismaIncident.actions?.map((a: any) => ({
        id: a.id,
        incidentId: a.incidentId,
        actionType: a.actionType,
        description: a.description,
        status: a.status,
        assignedTo: a.assignedTo,
        scheduledAt: a.scheduledAt,
        completedAt: a.completedAt,
        results: a.results,
        automated: a.automated,
        metadata: a.metadata,
      })) || [],
      evidence: prismaIncident.evidence?.map((e: any) => ({
        id: e.id,
        incidentId: e.incidentId,
        type: e.type,
        fileName: e.fileName,
        filePath: e.filePath,
        collectedBy: e.collectedBy,
        collectedAt: e.collectedAt,
        hash: e.hash,
        chainOfCustody: e.chainOfCustody,
        metadata: e.metadata,
      })) || [],
      metadata: prismaIncident.metadata || {},
    };
  }

  // Additional helper methods would continue here...
  private async createAutomaticIncident(event: any): Promise<void> { /* Implementation */ }
  private async createIncidentFromThreatAssessment(assessment: any): Promise<void> { /* Implementation */ }
  private async processEscalations(): Promise<void> { /* Implementation */ }
  private async cleanupClosedIncidents(): Promise<void> { /* Implementation */ }
  private async escalateIncident(incidentId: string): Promise<void> { /* Implementation */ }
  private async schedulePostIncidentReview(incident: Incident): Promise<void> { /* Implementation */ }
  private async updateIncidentMetrics(incident: Incident): Promise<void> { /* Implementation */ }
}

// Export singleton instance
export const incidentResponseService = new IncidentResponseService();

// Export types
export type {
  Incident,
  IncidentTimelineEntry,
  IncidentCommunication,
  IncidentAction,
  IncidentEvidence,
  IncidentPlaybook,
}; 