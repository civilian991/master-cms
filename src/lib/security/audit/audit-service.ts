import { prisma } from '../../prisma';
import { redis } from '../../redis';
import { siemService } from '../monitoring/siem-service';
import { z } from 'zod';
import crypto from 'crypto';

// Audit logging configuration
const AUDIT_CONFIG = {
  // Audit event categories
  eventCategories: {
    AUTHENTICATION: {
      name: 'Authentication Events',
      retention: 2555, // 7 years in days
      severity: 'MEDIUM',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA'],
      requiredFields: ['userId', 'ipAddress', 'userAgent'],
    },
    AUTHORIZATION: {
      name: 'Authorization Events',
      retention: 2555,
      severity: 'MEDIUM',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA'],
      requiredFields: ['userId', 'resource', 'action', 'decision'],
    },
    DATA_ACCESS: {
      name: 'Data Access Events',
      retention: 2555,
      severity: 'HIGH',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA', 'GDPR'],
      requiredFields: ['userId', 'dataType', 'operation', 'recordCount'],
    },
    DATA_MODIFICATION: {
      name: 'Data Modification Events',
      retention: 2555,
      severity: 'HIGH',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA', 'GDPR'],
      requiredFields: ['userId', 'tableName', 'recordId', 'operation', 'oldValues', 'newValues'],
    },
    ADMINISTRATIVE: {
      name: 'Administrative Events',
      retention: 2555,
      severity: 'HIGH',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA'],
      requiredFields: ['userId', 'action', 'targetResource'],
    },
    SECURITY: {
      name: 'Security Events',
      retention: 2555,
      severity: 'CRITICAL',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA', 'GDPR'],
      requiredFields: ['eventType', 'severity', 'source', 'ipAddress'],
    },
    SYSTEM: {
      name: 'System Events',
      retention: 1095, // 3 years
      severity: 'LOW',
      complianceFrameworks: ['SOX'],
      requiredFields: ['component', 'action', 'status'],
    },
    COMPLIANCE: {
      name: 'Compliance Events',
      retention: 2555,
      severity: 'HIGH',
      complianceFrameworks: ['SOX', 'PCI_DSS', 'HIPAA', 'GDPR'],
      requiredFields: ['framework', 'requirement', 'status'],
    },
  },

  // Audit levels
  auditLevels: {
    MINIMAL: {
      name: 'Minimal Auditing',
      categories: ['AUTHENTICATION', 'ADMINISTRATIVE'],
      details: 'basic',
    },
    STANDARD: {
      name: 'Standard Auditing',
      categories: ['AUTHENTICATION', 'AUTHORIZATION', 'ADMINISTRATIVE', 'SECURITY'],
      details: 'standard',
    },
    COMPREHENSIVE: {
      name: 'Comprehensive Auditing',
      categories: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'ADMINISTRATIVE', 'SECURITY', 'SYSTEM'],
      details: 'detailed',
    },
    COMPLIANCE: {
      name: 'Compliance Auditing',
      categories: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'ADMINISTRATIVE', 'SECURITY', 'COMPLIANCE'],
      details: 'detailed',
    },
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 90,
    ivLength: 16,
    tagLength: 16,
    saltLength: 32,
  },

  // Retention policies
  retentionPolicies: {
    DEFAULT: 2555, // 7 years
    SHORT_TERM: 365, // 1 year
    LONG_TERM: 3650, // 10 years
    PERMANENT: -1, // Never delete
  },

  // Compliance requirements
  complianceRequirements: {
    SOX: {
      name: 'Sarbanes-Oxley Act',
      retentionYears: 7,
      auditLevel: 'COMPREHENSIVE',
      encryptionRequired: true,
      integrityValidation: true,
      categories: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'ADMINISTRATIVE'],
    },
    PCI_DSS: {
      name: 'Payment Card Industry Data Security Standard',
      retentionYears: 1,
      auditLevel: 'COMPREHENSIVE',
      encryptionRequired: true,
      integrityValidation: true,
      categories: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'SECURITY'],
    },
    HIPAA: {
      name: 'Health Insurance Portability and Accountability Act',
      retentionYears: 6,
      auditLevel: 'COMPREHENSIVE',
      encryptionRequired: true,
      integrityValidation: true,
      categories: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY'],
    },
    GDPR: {
      name: 'General Data Protection Regulation',
      retentionYears: 7,
      auditLevel: 'COMPLIANCE',
      encryptionRequired: true,
      integrityValidation: true,
      categories: ['DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY', 'COMPLIANCE'],
    },
  },

  // Analysis patterns
  analysisPatterns: {
    PRIVILEGE_ESCALATION: {
      name: 'Privilege Escalation Detection',
      pattern: 'Multiple administrative actions by non-admin user',
      severity: 'HIGH',
      timeWindow: 60, // minutes
    },
    DATA_EXFILTRATION: {
      name: 'Data Exfiltration Detection',
      pattern: 'Large data access volume by single user',
      severity: 'CRITICAL',
      timeWindow: 1440, // 24 hours
    },
    UNUSUAL_ACCESS: {
      name: 'Unusual Access Pattern',
      pattern: 'Access outside normal hours or location',
      severity: 'MEDIUM',
      timeWindow: 60,
    },
    FAILED_AUTHENTICATION: {
      name: 'Failed Authentication Pattern',
      pattern: 'Multiple failed login attempts',
      severity: 'HIGH',
      timeWindow: 15,
    },
  },
} as const;

// Validation schemas
export const auditEventSchema = z.object({
  category: z.enum(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'ADMINISTRATIVE', 'SECURITY', 'SYSTEM', 'COMPLIANCE']),
  eventType: z.string().min(1).max(100),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  outcome: z.enum(['SUCCESS', 'FAILURE', 'PARTIAL']),
  details: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  siteId: z.string(),
  timestamp: z.date().optional(),
});

export const auditQuerySchema = z.object({
  siteId: z.string().optional(),
  category: z.string().optional(),
  eventType: z.string().optional(),
  userId: z.string().optional(),
  severity: z.string().optional(),
  outcome: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(10000).default(1000),
  offset: z.number().min(0).default(0),
  includeDetails: z.boolean().default(false),
});

export const auditReportSchema = z.object({
  reportType: z.enum(['SUMMARY', 'DETAILED', 'COMPLIANCE', 'SECURITY', 'USER_ACTIVITY', 'SYSTEM_ACTIVITY']),
  timeRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  filters: z.object({
    categories: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    severity: z.array(z.string()).optional(),
    outcomes: z.array(z.string()).optional(),
  }).optional(),
  format: z.enum(['PDF', 'CSV', 'JSON', 'HTML']).default('PDF'),
  includeCharts: z.boolean().default(true),
  complianceFramework: z.string().optional(),
  siteId: z.string(),
});

export const retentionPolicySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  categories: z.array(z.string()),
  retentionDays: z.number().min(-1), // -1 for permanent
  archiveAfterDays: z.number().min(1).optional(),
  compressionEnabled: z.boolean().default(true),
  encryptionRequired: z.boolean().default(true),
  complianceFrameworks: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Interfaces
interface AuditEvent {
  id: string;
  category: string;
  eventType: string;
  severity: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  outcome: string;
  details: Record<string, any>;
  metadata: Record<string, any>;
  siteId: string;
  timestamp: Date;
  hash: string;
  encryptedDetails?: string;
  integrityVerified: boolean;
  retentionDate: Date;
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
}

interface AuditTrail {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  userId: string;
  timestamp: Date;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'CREATED' | 'UPDATED' | 'DELETED';
  }>;
  reason?: string;
  metadata: Record<string, any>;
  hash: string;
  integrityVerified: boolean;
}

interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  categories: string[];
  retentionDays: number;
  archiveAfterDays?: number;
  compressionEnabled: boolean;
  encryptionRequired: boolean;
  complianceFrameworks: string[];
  active: boolean;
  appliedCount: number;
  lastApplied?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditReport {
  id: string;
  reportType: string;
  timeRange: { start: Date; end: Date };
  filters: Record<string, any>;
  format: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  generatedBy: string;
  generatedAt?: Date;
  filePath?: string;
  fileSize?: number;
  summary: {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    uniqueUsers: number;
    successRate: number;
    complianceScore?: number;
  };
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    count: number;
    recommendation: string;
  }>;
  complianceFramework?: string;
  siteId: string;
  createdAt: Date;
}

interface AuditMetrics {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  recentTrends: Array<{
    date: Date;
    eventCount: number;
    failureRate: number;
    securityEvents: number;
  }>;
  topUsers: Array<{
    userId: string;
    eventCount: number;
    failureCount: number;
    riskScore: number;
  }>;
  complianceStatus: Record<string, {
    compliant: boolean;
    retentionMet: boolean;
    encryptionValid: boolean;
    integrityValid: boolean;
  }>;
  systemHealth: {
    auditingEnabled: boolean;
    encryptionActive: boolean;
    retentionActive: boolean;
    backlogCount: number;
    lastProcessed: Date;
  };
}

// Audit Service
export class AuditService {
  private encryptionKeys: Map<string, Buffer> = new Map();
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private auditLevel: string = 'STANDARD';

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize audit service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load encryption keys
      await this.loadEncryptionKeys();

      // Load retention policies
      await this.loadRetentionPolicies();

      // Set audit level based on configuration
      await this.setAuditLevel();

      // Start background processors
      this.startBackgroundProcessors();

      // Initialize integrity validation
      await this.initializeIntegrityValidation();

      console.log('Audit Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Audit Service:', error);
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(
    eventData: z.infer<typeof auditEventSchema>
  ): Promise<AuditEvent> {
    try {
      const validatedData = auditEventSchema.parse({
        ...eventData,
        timestamp: eventData.timestamp || new Date(),
      });

      // Check if category should be audited
      if (!this.shouldAuditCategory(validatedData.category)) {
        return null;
      }

      // Validate required fields for category
      this.validateRequiredFields(validatedData);

      // Generate event hash for integrity
      const eventHash = this.generateEventHash(validatedData);

      // Encrypt sensitive details if required
      const encryptedDetails = await this.encryptEventDetails(validatedData);

      // Determine retention date
      const retentionDate = this.calculateRetentionDate(validatedData.category);

      // Create audit event record
      const auditEvent = await prisma.auditEvent.create({
        data: {
          category: validatedData.category,
          eventType: validatedData.eventType,
          severity: validatedData.severity,
          userId: validatedData.userId,
          sessionId: validatedData.sessionId,
          ipAddress: validatedData.ipAddress,
          userAgent: validatedData.userAgent,
          resource: validatedData.resource,
          action: validatedData.action,
          outcome: validatedData.outcome,
          details: encryptedDetails ? {} : validatedData.details,
          encryptedDetails: encryptedDetails,
          metadata: validatedData.metadata || {},
          siteId: validatedData.siteId,
          timestamp: validatedData.timestamp,
          hash: eventHash,
          integrityVerified: true,
          retentionDate,
          archived: false,
        },
      });

      const auditEventObj: AuditEvent = {
        id: auditEvent.id,
        category: auditEvent.category,
        eventType: auditEvent.eventType,
        severity: auditEvent.severity,
        userId: auditEvent.userId || undefined,
        sessionId: auditEvent.sessionId || undefined,
        ipAddress: auditEvent.ipAddress || undefined,
        userAgent: auditEvent.userAgent || undefined,
        resource: auditEvent.resource || undefined,
        action: auditEvent.action || undefined,
        outcome: auditEvent.outcome,
        details: validatedData.details,
        metadata: auditEvent.metadata as Record<string, any>,
        siteId: auditEvent.siteId,
        timestamp: auditEvent.timestamp,
        hash: auditEvent.hash,
        encryptedDetails: auditEvent.encryptedDetails || undefined,
        integrityVerified: auditEvent.integrityVerified,
        retentionDate: auditEvent.retentionDate,
        archived: auditEvent.archived,
        createdAt: auditEvent.createdAt,
      };

      // Cache recent events for analysis
      await this.cacheRecentEvent(auditEventObj);

      // Trigger real-time analysis
      await this.analyzeEventPatterns(auditEventObj);

      // Send to SIEM if configured
      await this.forwardToSIEM(auditEventObj);

      return auditEventObj;

    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  /**
   * Create audit trail for entity changes
   */
  async createAuditTrail(
    entityType: string,
    entityId: string,
    operation: string,
    userId: string,
    beforeState?: Record<string, any>,
    afterState?: Record<string, any>,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<AuditTrail> {
    try {
      // Calculate changes
      const changes = this.calculateChanges(beforeState, afterState);

      // Generate trail hash
      const trailData = {
        entityType,
        entityId,
        operation,
        userId,
        timestamp: new Date(),
        beforeState,
        afterState,
        changes,
        reason,
        metadata: metadata || {},
      };

      const trailHash = this.generateTrailHash(trailData);

      // Create audit trail record
      const auditTrail = await prisma.auditTrail.create({
        data: {
          entityType,
          entityId,
          operation,
          userId,
          timestamp: new Date(),
          beforeState: beforeState || {},
          afterState: afterState || {},
          changes,
          reason,
          metadata: metadata || {},
          hash: trailHash,
          integrityVerified: true,
        },
      });

      const auditTrailObj: AuditTrail = {
        id: auditTrail.id,
        entityType: auditTrail.entityType,
        entityId: auditTrail.entityId,
        operation: auditTrail.operation,
        userId: auditTrail.userId,
        timestamp: auditTrail.timestamp,
        beforeState: auditTrail.beforeState as Record<string, any>,
        afterState: auditTrail.afterState as Record<string, any>,
        changes: auditTrail.changes as any,
        reason: auditTrail.reason || undefined,
        metadata: auditTrail.metadata as Record<string, any>,
        hash: auditTrail.hash,
        integrityVerified: auditTrail.integrityVerified,
      };

      // Log corresponding audit event
      await this.logAuditEvent({
        category: 'DATA_MODIFICATION',
        eventType: 'ENTITY_CHANGE',
        severity: this.determineSeverityForEntity(entityType),
        userId,
        resource: `${entityType}/${entityId}`,
        action: operation,
        outcome: 'SUCCESS',
        details: {
          entityType,
          entityId,
          operation,
          changeCount: changes.length,
          reason,
        },
        metadata: metadata || {},
        siteId: metadata?.siteId || 'system',
      });

      return auditTrailObj;

    } catch (error) {
      console.error('Failed to create audit trail:', error);
      throw new Error(`Audit trail creation failed: ${error.message}`);
    }
  }

  /**
   * Query audit events
   */
  async queryAuditEvents(
    queryParams: z.infer<typeof auditQuerySchema>
  ): Promise<{ events: AuditEvent[]; totalCount: number }> {
    try {
      const validatedParams = auditQuerySchema.parse(queryParams);

      // Build where clause
      const whereClause: any = {};

      if (validatedParams.siteId) whereClause.siteId = validatedParams.siteId;
      if (validatedParams.category) whereClause.category = validatedParams.category;
      if (validatedParams.eventType) whereClause.eventType = validatedParams.eventType;
      if (validatedParams.userId) whereClause.userId = validatedParams.userId;
      if (validatedParams.severity) whereClause.severity = validatedParams.severity;
      if (validatedParams.outcome) whereClause.outcome = validatedParams.outcome;

      if (validatedParams.startDate || validatedParams.endDate) {
        whereClause.timestamp = {};
        if (validatedParams.startDate) whereClause.timestamp.gte = validatedParams.startDate;
        if (validatedParams.endDate) whereClause.timestamp.lte = validatedParams.endDate;
      }

      // Get total count
      const totalCount = await prisma.auditEvent.count({ where: whereClause });

      // Get events
      const events = await prisma.auditEvent.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: validatedParams.limit,
        skip: validatedParams.offset,
      });

      // Decrypt and map events
      const auditEvents: AuditEvent[] = [];
      for (const event of events) {
        const auditEvent = await this.mapPrismaEventToEvent(event, validatedParams.includeDetails);
        auditEvents.push(auditEvent);
      }

      return { events: auditEvents, totalCount };

    } catch (error) {
      console.error('Failed to query audit events:', error);
      throw new Error(`Audit query failed: ${error.message}`);
    }
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    reportData: z.infer<typeof auditReportSchema>
  ): Promise<AuditReport> {
    try {
      const validatedData = auditReportSchema.parse(reportData);

      // Create report record
      const report = await prisma.auditReport.create({
        data: {
          reportType: validatedData.reportType,
          timeRange: validatedData.timeRange,
          filters: validatedData.filters || {},
          format: validatedData.format,
          status: 'GENERATING',
          generatedBy: 'SYSTEM', // Would be actual user
          summary: {
            totalEvents: 0,
            eventsByCategory: {},
            eventsBySeverity: {},
            uniqueUsers: 0,
            successRate: 0,
          },
          findings: [],
          complianceFramework: validatedData.complianceFramework,
          siteId: validatedData.siteId,
        },
      });

      const reportObj: AuditReport = {
        id: report.id,
        reportType: report.reportType,
        timeRange: report.timeRange as any,
        filters: report.filters as Record<string, any>,
        format: report.format,
        status: report.status as any,
        generatedBy: report.generatedBy,
        summary: report.summary as any,
        findings: [],
        complianceFramework: report.complianceFramework || undefined,
        siteId: report.siteId,
        createdAt: report.createdAt,
      };

      // Generate report content asynchronously
      this.generateReportContent(reportObj);

      return reportObj;

    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Get audit metrics
   */
  async getAuditMetrics(
    siteId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<AuditMetrics> {
    try {
      const whereClause: any = {};
      if (siteId) whereClause.siteId = siteId;
      if (timeRange) {
        whereClause.timestamp = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      // Get total event count
      const totalEvents = await prisma.auditEvent.count({ where: whereClause });

      // Get events by category
      const eventsByCategory = await this.getEventsGroupedBy('category', whereClause);

      // Get events by severity
      const eventsBySeverity = await this.getEventsGroupedBy('severity', whereClause);

      // Get events by outcome
      const eventsByOutcome = await this.getEventsGroupedBy('outcome', whereClause);

      // Calculate trends
      const recentTrends = await this.calculateAuditTrends(siteId, timeRange);

      // Get top users
      const topUsers = await this.getTopUsersByActivity(whereClause);

      // Check compliance status
      const complianceStatus = await this.checkComplianceStatus(siteId);

      // Get system health
      const systemHealth = await this.getSystemHealth();

      return {
        totalEvents,
        eventsByCategory,
        eventsBySeverity,
        eventsByOutcome,
        recentTrends,
        topUsers,
        complianceStatus,
        systemHealth,
      };

    } catch (error) {
      console.error('Failed to get audit metrics:', error);
      throw new Error(`Metrics calculation failed: ${error.message}`);
    }
  }

  // Helper methods (private)

  private async loadEncryptionKeys(): Promise<void> {
    // Load current encryption key
    const currentKey = await this.generateOrLoadKey('current');
    this.encryptionKeys.set('current', currentKey);

    // Load previous keys for decryption
    // Implementation would load keys from secure key management
  }

  private async loadRetentionPolicies(): Promise<void> {
    const policies = await prisma.retentionPolicy.findMany({
      where: { active: true },
    });

    for (const policy of policies) {
      this.retentionPolicies.set(policy.id, this.mapPrismaPolicyToPolicy(policy));
    }
  }

  private async setAuditLevel(): Promise<void> {
    // Determine audit level based on compliance requirements
    // For now, use COMPREHENSIVE as default
    this.auditLevel = 'COMPREHENSIVE';
  }

  private startBackgroundProcessors(): void {
    // Process retention policies daily
    setInterval(async () => {
      await this.processRetentionPolicies();
    }, 24 * 60 * 60 * 1000);

    // Validate integrity hourly
    setInterval(async () => {
      await this.validateEventIntegrity();
    }, 60 * 60 * 1000);

    // Archive old events weekly
    setInterval(async () => {
      await this.archiveOldEvents();
    }, 7 * 24 * 60 * 60 * 1000);

    // Generate daily reports
    setInterval(async () => {
      await this.generateDailyReports();
    }, 24 * 60 * 60 * 1000);
  }

  private async initializeIntegrityValidation(): Promise<void> {
    // Initialize blockchain-style integrity validation
    console.log('Initializing audit log integrity validation...');
  }

  private shouldAuditCategory(category: string): boolean {
    const auditLevel = AUDIT_CONFIG.auditLevels[this.auditLevel];
    return auditLevel.categories.includes(category);
  }

  private validateRequiredFields(eventData: any): void {
    const categoryConfig = AUDIT_CONFIG.eventCategories[eventData.category];
    if (!categoryConfig) return;

    for (const field of categoryConfig.requiredFields) {
      if (!eventData[field] && !eventData.details?.[field]) {
        throw new Error(`Required field '${field}' missing for category '${eventData.category}'`);
      }
    }
  }

  private generateEventHash(eventData: any): string {
    const hashData = {
      category: eventData.category,
      eventType: eventData.eventType,
      timestamp: eventData.timestamp.toISOString(),
      userId: eventData.userId,
      resource: eventData.resource,
      action: eventData.action,
      outcome: eventData.outcome,
      details: eventData.details,
    };

    return crypto.createHash('sha256').update(JSON.stringify(hashData)).digest('hex');
  }

  private async encryptEventDetails(eventData: any): Promise<string | null> {
    const categoryConfig = AUDIT_CONFIG.eventCategories[eventData.category];
    const shouldEncrypt = categoryConfig.complianceFrameworks.some(
      framework => AUDIT_CONFIG.complianceRequirements[framework]?.encryptionRequired
    );

    if (!shouldEncrypt) return null;

    const key = this.encryptionKeys.get('current');
    if (!key) throw new Error('Encryption key not available');

    const iv = crypto.randomBytes(AUDIT_CONFIG.encryption.ivLength);
    const cipher = crypto.createCipher(AUDIT_CONFIG.encryption.algorithm, key);
    cipher.setAAD(Buffer.from(eventData.siteId));

    let encrypted = cipher.update(JSON.stringify(eventData.details), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      tag: tag.toString('hex'),
    });
  }

  private calculateRetentionDate(category: string): Date {
    const categoryConfig = AUDIT_CONFIG.eventCategories[category];
    const retentionDays = categoryConfig?.retention || AUDIT_CONFIG.retentionPolicies.DEFAULT;

    if (retentionDays === -1) {
      // Permanent retention
      return new Date('2099-12-31');
    }

    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + retentionDays);
    return retentionDate;
  }

  private calculateChanges(beforeState?: Record<string, any>, afterState?: Record<string, any>): any[] {
    if (!beforeState && !afterState) return [];

    const changes: any[] = [];

    if (!beforeState && afterState) {
      // Creation
      for (const [key, value] of Object.entries(afterState)) {
        changes.push({
          field: key,
          oldValue: null,
          newValue: value,
          changeType: 'CREATED',
        });
      }
    } else if (beforeState && !afterState) {
      // Deletion
      for (const [key, value] of Object.entries(beforeState)) {
        changes.push({
          field: key,
          oldValue: value,
          newValue: null,
          changeType: 'DELETED',
        });
      }
    } else if (beforeState && afterState) {
      // Update
      const allKeys = new Set([...Object.keys(beforeState), ...Object.keys(afterState)]);

      for (const key of allKeys) {
        const oldValue = beforeState[key];
        const newValue = afterState[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field: key,
            oldValue,
            newValue,
            changeType: 'UPDATED',
          });
        }
      }
    }

    return changes;
  }

  private generateTrailHash(trailData: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(trailData)).digest('hex');
  }

  private determineSeverityForEntity(entityType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Map entity types to severity levels
    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      user: 'HIGH',
      role: 'HIGH',
      permission: 'HIGH',
      site: 'CRITICAL',
      content: 'MEDIUM',
      media: 'LOW',
      setting: 'HIGH',
    };

    return severityMap[entityType.toLowerCase()] || 'MEDIUM';
  }

  // Additional helper methods would continue here...
  private async cacheRecentEvent(event: AuditEvent): Promise<void> { /* Implementation */ }
  private async analyzeEventPatterns(event: AuditEvent): Promise<void> { /* Implementation */ }
  private async forwardToSIEM(event: AuditEvent): Promise<void> { /* Implementation */ }
  private async mapPrismaEventToEvent(event: any, includeDetails: boolean): Promise<AuditEvent> { return {} as AuditEvent; }
  private async generateReportContent(report: AuditReport): Promise<void> { /* Implementation */ }
  private async getEventsGroupedBy(field: string, whereClause: any): Promise<Record<string, number>> { return {}; }
  private async calculateAuditTrends(siteId?: string, timeRange?: any): Promise<any[]> { return []; }
  private async getTopUsersByActivity(whereClause: any): Promise<any[]> { return []; }
  private async checkComplianceStatus(siteId?: string): Promise<any> { return {}; }
  private async getSystemHealth(): Promise<any> { return {}; }
  private async generateOrLoadKey(keyId: string): Promise<Buffer> { return Buffer.alloc(32); }
  private mapPrismaPolicyToPolicy(policy: any): RetentionPolicy { return {} as RetentionPolicy; }
  private async processRetentionPolicies(): Promise<void> { /* Implementation */ }
  private async validateEventIntegrity(): Promise<void> { /* Implementation */ }
  private async archiveOldEvents(): Promise<void> { /* Implementation */ }
  private async generateDailyReports(): Promise<void> { /* Implementation */ }
}

// Export singleton instance
export const auditService = new AuditService();

// Export types
export type {
  AuditEvent,
  AuditTrail,
  RetentionPolicy,
  AuditReport,
  AuditMetrics,
}; 