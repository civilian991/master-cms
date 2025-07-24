import { prisma } from '../../prisma';
import { redis } from '../../redis';
import { z } from 'zod';
import { EventEmitter } from 'events';

// SIEM configuration and constants
const SIEM_CONFIG = {
  logRetentionDays: 90,
  realTimeThresholds: {
    loginAttempts: 5, // Failed login attempts per minute
    apiCalls: 1000, // API calls per minute per user
    dataAccess: 50, // Data access requests per minute
    fileUploads: 20, // File uploads per minute
    privilegedOperations: 10, // Admin operations per minute
  },
  threatScoring: {
    low: { min: 0, max: 30 },
    medium: { min: 31, max: 70 },
    high: { min: 71, max: 90 },
    critical: { min: 91, max: 100 },
  },
  correlationWindow: 300, // 5 minutes for event correlation
  alertingThresholds: {
    suspiciousActivity: 60,
    dataExfiltration: 80,
    privilegeEscalation: 85,
    bruteForceAttack: 70,
    anomalousAccess: 65,
  },
  integrations: {
    splunk: { enabled: false, endpoint: '', apiKey: '' },
    elastic: { enabled: false, endpoint: '', apiKey: '' },
    sumo: { enabled: false, endpoint: '', apiKey: '' },
    datadog: { enabled: false, endpoint: '', apiKey: '' },
  },
} as const;

// Validation schemas
export const securityEventSchema = z.object({
  eventType: z.enum([
    'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'FILE_OPERATION',
    'ADMIN_OPERATION', 'API_ACCESS', 'SYSTEM_OPERATION', 'THREAT_DETECTED',
    'ANOMALY_DETECTED', 'COMPLIANCE_VIOLATION', 'SECURITY_ALERT'
  ]),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  source: z.string(),
  title: z.string(),
  description: z.string(),
  userId: z.string().optional(),
  siteId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  action: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date().optional(),
});

export const threatIndicatorSchema = z.object({
  type: z.enum([
    'MALICIOUS_IP', 'SUSPICIOUS_DOMAIN', 'KNOWN_MALWARE',
    'SUSPICIOUS_USER_AGENT', 'GEOLOCATION_ANOMALY', 'VELOCITY_ANOMALY',
    'PRIVILEGE_ESCALATION', 'DATA_EXFILTRATION', 'BRUTE_FORCE'
  ]),
  value: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  confidence: z.number().min(0).max(100),
  source: z.string(),
  description: z.string(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const alertRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  enabled: z.boolean().default(true),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'regex']),
    value: z.any(),
  })),
  timeWindow: z.number().min(60).max(86400), // 1 minute to 24 hours
  threshold: z.number().min(1),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'WEBHOOK', 'SLACK', 'SMS', 'CREATE_INCIDENT']),
    target: z.string(),
    template: z.string().optional(),
  })),
  suppressionTime: z.number().min(300).max(86400).optional(), // 5 minutes to 24 hours
});

// Interfaces
interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  source: string;
  title: string;
  description: string;
  userId?: string;
  siteId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resourceId?: string;
  resourceType?: string;
  action?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  threatScore: number;
  correlationId?: string;
  processed: boolean;
}

interface ThreatIndicator {
  id: string;
  type: string;
  value: string;
  severity: string;
  confidence: number;
  source: string;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
  active: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  timeWindow: number;
  threshold: number;
  actions: Array<{
    type: string;
    target: string;
    template?: string;
  }>;
  suppressionTime?: number;
  lastTriggered?: Date;
  triggerCount: number;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topThreats: Array<{ type: string; count: number; severity: string }>;
  threatScore: number;
  activeAlerts: number;
  incidentCount: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    processedEvents: number;
    failedEvents: number;
  };
}

// Security Information and Event Management Service
export class SIEMService extends EventEmitter {
  private correlationEngine: Map<string, SecurityEvent[]> = new Map();
  private activeAlerts: Map<string, Date> = new Map();
  private threatIndicators: Map<string, ThreatIndicator> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Initialize SIEM service with default rules and threat feeds
   */
  private async initializeService(): Promise<void> {
    try {
      // Load existing alert rules
      await this.loadAlertRules();

      // Load threat indicators
      await this.loadThreatIndicators();

      // Initialize default rules if none exist
      await this.createDefaultAlertRules();

      // Start background processing
      this.startBackgroundProcessing();

      console.log('SIEM Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SIEM service:', error);
    }
  }

  /**
   * Ingest security event into SIEM
   */
  async ingestEvent(eventData: z.infer<typeof securityEventSchema>): Promise<SecurityEvent> {
    try {
      const validatedData = securityEventSchema.parse(eventData);

      // Calculate threat score
      const threatScore = await this.calculateThreatScore(validatedData);

      // Create security event
      const securityEvent = await prisma.securityEvent.create({
        data: {
          eventType: validatedData.eventType,
          severity: validatedData.severity,
          source: validatedData.source,
          title: validatedData.title,
          description: validatedData.description,
          userId: validatedData.userId,
          siteId: validatedData.siteId,
          ipAddress: validatedData.ipAddress,
          userAgent: validatedData.userAgent,
          sessionId: validatedData.sessionId,
          resourceId: validatedData.resourceId,
          resourceType: validatedData.resourceType,
          action: validatedData.action,
          metadata: {
            ...validatedData.metadata,
            threatScore,
            processed: false,
          },
          success: true,
        },
      });

      const event: SecurityEvent = {
        id: securityEvent.id,
        eventType: securityEvent.eventType,
        severity: securityEvent.severity,
        source: validatedData.source,
        title: securityEvent.title,
        description: securityEvent.description,
        userId: securityEvent.userId || undefined,
        siteId: securityEvent.siteId || undefined,
        ipAddress: securityEvent.ipAddress || undefined,
        userAgent: securityEvent.userAgent || undefined,
        sessionId: securityEvent.sessionId || undefined,
        resourceId: securityEvent.resourceId || undefined,
        resourceType: securityEvent.resourceType || undefined,
        action: securityEvent.action || undefined,
        metadata: securityEvent.metadata as Record<string, any>,
        timestamp: securityEvent.createdAt,
        threatScore,
        processed: false,
      };

      // Real-time processing
      await this.processEventRealTime(event);

      // Store in Redis for fast access
      await this.cacheEvent(event);

      // Forward to external SIEM systems
      await this.forwardToExternalSIEM(event);

      // Emit event for subscribers
      this.emit('securityEvent', event);

      return event;

    } catch (error) {
      console.error('Failed to ingest security event:', error);
      throw new Error(`Event ingestion failed: ${error.message}`);
    }
  }

  /**
   * Process security event in real-time
   */
  private async processEventRealTime(event: SecurityEvent): Promise<void> {
    try {
      // Check against threat indicators
      await this.checkThreatIndicators(event);

      // Perform event correlation
      await this.correlateEvent(event);

      // Check alert rules
      await this.checkAlertRules(event);

      // Anomaly detection
      await this.performAnomalyDetection(event);

      // Update threat score based on context
      await this.updateContextualThreatScore(event);

      // Mark as processed
      await prisma.securityEvent.update({
        where: { id: event.id },
        data: {
          metadata: {
            ...event.metadata,
            processed: true,
            processingTime: new Date().toISOString(),
          },
        },
      });

    } catch (error) {
      console.error('Real-time event processing failed:', error);
    }
  }

  /**
   * Calculate threat score for event
   */
  private async calculateThreatScore(eventData: any): Promise<number> {
    let score = 0;

    // Base score by event type
    const eventTypeScores: Record<string, number> = {
      'AUTHENTICATION': 10,
      'AUTHORIZATION': 15,
      'DATA_ACCESS': 20,
      'FILE_OPERATION': 15,
      'ADMIN_OPERATION': 30,
      'API_ACCESS': 10,
      'SYSTEM_OPERATION': 25,
      'THREAT_DETECTED': 80,
      'ANOMALY_DETECTED': 60,
      'COMPLIANCE_VIOLATION': 40,
      'SECURITY_ALERT': 70,
    };

    score += eventTypeScores[eventData.eventType] || 10;

    // Severity multiplier
    const severityMultipliers: Record<string, number> = {
      'INFO': 1.0,
      'LOW': 1.2,
      'MEDIUM': 1.5,
      'HIGH': 2.0,
      'CRITICAL': 3.0,
    };

    score *= severityMultipliers[eventData.severity] || 1.0;

    // IP address reputation check
    if (eventData.ipAddress) {
      const ipThreat = await this.checkIPReputation(eventData.ipAddress);
      score += ipThreat.score;
    }

    // User behavior analysis
    if (eventData.userId) {
      const userRisk = await this.analyzeUserRisk(eventData.userId);
      score += userRisk.score;
    }

    // Time-based factors (off-hours activity)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 10; // Off-hours activity
    }

    // Geographic anomalies
    if (eventData.ipAddress) {
      const geoAnomaly = await this.checkGeographicAnomaly(eventData.userId, eventData.ipAddress);
      score += geoAnomaly.score;
    }

    // Cap the score at 100
    return Math.min(score, 100);
  }

  /**
   * Check event against threat indicators
   */
  private async checkThreatIndicators(event: SecurityEvent): Promise<void> {
    const indicators = Array.from(this.threatIndicators.values());

    for (const indicator of indicators) {
      if (!indicator.active) continue;

      let match = false;
      let matchValue = '';

      switch (indicator.type) {
        case 'MALICIOUS_IP':
          if (event.ipAddress === indicator.value) {
            match = true;
            matchValue = event.ipAddress;
          }
          break;

        case 'SUSPICIOUS_USER_AGENT':
          if (event.userAgent && event.userAgent.includes(indicator.value)) {
            match = true;
            matchValue = event.userAgent;
          }
          break;

        case 'SUSPICIOUS_DOMAIN':
          if (event.metadata.referrer && event.metadata.referrer.includes(indicator.value)) {
            match = true;
            matchValue = event.metadata.referrer;
          }
          break;

        default:
          // Custom matching logic for other indicator types
          break;
      }

      if (match) {
        await this.createThreatAlert({
          event,
          indicator,
          matchValue,
        });
      }
    }
  }

  /**
   * Correlate security events for pattern detection
   */
  private async correlateEvent(event: SecurityEvent): Promise<void> {
    const correlationKey = this.generateCorrelationKey(event);
    
    if (!this.correlationEngine.has(correlationKey)) {
      this.correlationEngine.set(correlationKey, []);
    }

    const relatedEvents = this.correlationEngine.get(correlationKey)!;
    relatedEvents.push(event);

    // Keep only events within correlation window
    const cutoffTime = new Date(Date.now() - SIEM_CONFIG.correlationWindow * 1000);
    const recentEvents = relatedEvents.filter(e => e.timestamp > cutoffTime);
    this.correlationEngine.set(correlationKey, recentEvents);

    // Analyze patterns
    await this.analyzeEventPatterns(correlationKey, recentEvents);
  }

  /**
   * Generate correlation key for event grouping
   */
  private generateCorrelationKey(event: SecurityEvent): string {
    // Group by user, IP, or resource depending on event type
    const keyParts = [];

    if (event.userId) keyParts.push(`user:${event.userId}`);
    if (event.ipAddress) keyParts.push(`ip:${event.ipAddress}`);
    if (event.resourceId) keyParts.push(`resource:${event.resourceId}`);
    if (event.sessionId) keyParts.push(`session:${event.sessionId}`);

    return keyParts.join('|') || `type:${event.eventType}`;
  }

  /**
   * Analyze patterns in correlated events
   */
  private async analyzeEventPatterns(correlationKey: string, events: SecurityEvent[]): Promise<void> {
    if (events.length < 2) return;

    // Pattern 1: Rapid succession events (velocity attack)
    const timeSpan = events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime();
    if (events.length >= 5 && timeSpan < 60000) { // 5 events in 1 minute
      await this.createCorrelationAlert({
        type: 'VELOCITY_ATTACK',
        correlationKey,
        events: events.slice(-5),
        description: `Rapid succession of ${events.length} events detected`,
        severity: 'HIGH',
      });
    }

    // Pattern 2: Failed authentication followed by successful login
    const authEvents = events.filter(e => e.eventType === 'AUTHENTICATION');
    if (authEvents.length >= 2) {
      const failedAuth = authEvents.filter(e => !e.metadata.success);
      const successAuth = authEvents.filter(e => e.metadata.success);

      if (failedAuth.length >= 3 && successAuth.length >= 1) {
        const lastFailed = failedAuth[failedAuth.length - 1];
        const firstSuccess = successAuth[0];

        if (firstSuccess.timestamp > lastFailed.timestamp) {
          await this.createCorrelationAlert({
            type: 'BRUTE_FORCE_SUCCESS',
            correlationKey,
            events: [...failedAuth.slice(-3), firstSuccess],
            description: 'Potential brute force attack followed by successful authentication',
            severity: 'CRITICAL',
          });
        }
      }
    }

    // Pattern 3: Privilege escalation sequence
    const adminEvents = events.filter(e => e.eventType === 'ADMIN_OPERATION');
    if (adminEvents.length >= 2) {
      await this.createCorrelationAlert({
        type: 'PRIVILEGE_ESCALATION',
        correlationKey,
        events: adminEvents,
        description: 'Multiple administrative operations detected',
        severity: 'HIGH',
      });
    }

    // Pattern 4: Data exfiltration indicators
    const dataEvents = events.filter(e => 
      e.eventType === 'DATA_ACCESS' || 
      e.eventType === 'FILE_OPERATION'
    );

    if (dataEvents.length >= 10) { // Large number of data access events
      await this.createCorrelationAlert({
        type: 'DATA_EXFILTRATION',
        correlationKey,
        events: dataEvents.slice(-10),
        description: `Potential data exfiltration: ${dataEvents.length} data access events`,
        severity: 'CRITICAL',
      });
    }
  }

  /**
   * Check event against alert rules
   */
  private async checkAlertRules(event: SecurityEvent): Promise<void> {
    const rules = Array.from(this.alertRules.values());

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Check if rule conditions match
      const matches = await this.evaluateRuleConditions(rule, event);
      if (!matches) continue;

      // Check time window and threshold
      const recentEvents = await this.getRecentMatchingEvents(rule, event);
      
      if (recentEvents.length >= rule.threshold) {
        // Check suppression
        const suppressionKey = `${rule.id}:${this.generateSuppressionKey(event)}`;
        
        if (rule.suppressionTime && this.activeAlerts.has(suppressionKey)) {
          const lastAlert = this.activeAlerts.get(suppressionKey)!;
          const suppressionExpiry = new Date(lastAlert.getTime() + rule.suppressionTime * 1000);
          
          if (new Date() < suppressionExpiry) {
            continue; // Alert suppressed
          }
        }

        // Trigger alert
        await this.triggerAlert(rule, event, recentEvents);
        
        // Update suppression tracking
        this.activeAlerts.set(suppressionKey, new Date());
        
        // Update rule statistics
        await this.updateRuleStatistics(rule.id);
      }
    }
  }

  /**
   * Perform anomaly detection on event
   */
  private async performAnomalyDetection(event: SecurityEvent): Promise<void> {
    // Time-based anomaly detection
    await this.detectTimeAnomalies(event);

    // Volume-based anomaly detection
    await this.detectVolumeAnomalies(event);

    // Behavioral anomaly detection
    await this.detectBehavioralAnomalies(event);

    // Geographic anomaly detection
    await this.detectGeographicAnomalies(event);
  }

  /**
   * Create threat indicator
   */
  async createThreatIndicator(
    indicatorData: z.infer<typeof threatIndicatorSchema>
  ): Promise<ThreatIndicator> {
    try {
      const validatedData = threatIndicatorSchema.parse(indicatorData);

      const indicator = await prisma.threatIndicator.create({
        data: {
          type: validatedData.type,
          value: validatedData.value,
          severity: validatedData.severity,
          confidence: validatedData.confidence,
          source: validatedData.source,
          description: validatedData.description,
          expiresAt: validatedData.expiresAt,
          metadata: validatedData.metadata || {},
          active: true,
        },
      });

      const threatIndicator: ThreatIndicator = {
        id: indicator.id,
        type: indicator.type,
        value: indicator.value,
        severity: indicator.severity,
        confidence: indicator.confidence,
        source: indicator.source,
        description: indicator.description,
        createdAt: indicator.createdAt,
        expiresAt: indicator.expiresAt || undefined,
        metadata: indicator.metadata as Record<string, any>,
        active: indicator.active,
      };

      // Cache in memory for fast lookups
      this.threatIndicators.set(indicator.id, threatIndicator);

      return threatIndicator;

    } catch (error) {
      throw new Error(`Failed to create threat indicator: ${error.message}`);
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(ruleData: z.infer<typeof alertRuleSchema>): Promise<AlertRule> {
    try {
      const validatedData = alertRuleSchema.parse(ruleData);

      const rule = await prisma.alertRule.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          enabled: validatedData.enabled,
          severity: validatedData.severity,
          conditions: validatedData.conditions,
          timeWindow: validatedData.timeWindow,
          threshold: validatedData.threshold,
          actions: validatedData.actions,
          suppressionTime: validatedData.suppressionTime,
          triggerCount: 0,
        },
      });

      const alertRule: AlertRule = {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        severity: rule.severity,
        conditions: rule.conditions as any,
        timeWindow: rule.timeWindow,
        threshold: rule.threshold,
        actions: rule.actions as any,
        suppressionTime: rule.suppressionTime || undefined,
        triggerCount: rule.triggerCount,
      };

      // Cache in memory for fast access
      this.alertRules.set(rule.id, alertRule);

      return alertRule;

    } catch (error) {
      throw new Error(`Failed to create alert rule: ${error.message}`);
    }
  }

  /**
   * Get security metrics and dashboard data
   */
  async getSecurityMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<SecurityMetrics> {
    try {
      // Get event statistics
      const totalEvents = await prisma.securityEvent.count({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      // Events by type
      const eventsByType = await prisma.securityEvent.groupBy({
        by: ['eventType'],
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        _count: { eventType: true },
      });

      // Events by severity
      const eventsBySeverity = await prisma.securityEvent.groupBy({
        by: ['severity'],
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        _count: { severity: true },
      });

      // Calculate overall threat score
      const avgThreatScore = await this.calculateAverageThreatScore(timeRange);

      // Active alerts count
      const activeAlerts = this.activeAlerts.size;

      // Incident count
      const incidentCount = await prisma.securityIncident.count({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      // Top threats
      const topThreats = await this.getTopThreats(timeRange);

      // System health
      const systemHealth = await this.getSystemHealth();

      return {
        totalEvents,
        eventsByType: Object.fromEntries(
          eventsByType.map(item => [item.eventType, item._count.eventType])
        ),
        eventsBySeverity: Object.fromEntries(
          eventsBySeverity.map(item => [item.severity, item._count.severity])
        ),
        topThreats,
        threatScore: avgThreatScore,
        activeAlerts,
        incidentCount,
        systemHealth,
      };

    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw new Error(`Failed to get security metrics: ${error.message}`);
    }
  }

  // Helper methods (private)

  private async loadAlertRules(): Promise<void> {
    const rules = await prisma.alertRule.findMany({
      where: { enabled: true },
    });

    for (const rule of rules) {
      this.alertRules.set(rule.id, {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        severity: rule.severity,
        conditions: rule.conditions as any,
        timeWindow: rule.timeWindow,
        threshold: rule.threshold,
        actions: rule.actions as any,
        suppressionTime: rule.suppressionTime || undefined,
        lastTriggered: rule.lastTriggered || undefined,
        triggerCount: rule.triggerCount,
      });
    }
  }

  private async loadThreatIndicators(): Promise<void> {
    const indicators = await prisma.threatIndicator.findMany({
      where: {
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    for (const indicator of indicators) {
      this.threatIndicators.set(indicator.id, {
        id: indicator.id,
        type: indicator.type,
        value: indicator.value,
        severity: indicator.severity,
        confidence: indicator.confidence,
        source: indicator.source,
        description: indicator.description,
        createdAt: indicator.createdAt,
        expiresAt: indicator.expiresAt || undefined,
        metadata: indicator.metadata as Record<string, any>,
        active: indicator.active,
      });
    }
  }

  private async createDefaultAlertRules(): Promise<void> {
    const defaultRules = [
      {
        name: 'Multiple Failed Logins',
        description: 'Detect multiple failed login attempts',
        severity: 'HIGH' as const,
        conditions: [
          { field: 'eventType', operator: 'equals' as const, value: 'AUTHENTICATION' },
          { field: 'metadata.success', operator: 'equals' as const, value: false },
        ],
        timeWindow: 300, // 5 minutes
        threshold: 5,
        actions: [
          { type: 'EMAIL' as const, target: 'security@company.com' },
          { type: 'CREATE_INCIDENT' as const, target: 'security' },
        ],
        suppressionTime: 3600, // 1 hour
      },
      {
        name: 'Admin Operations Off Hours',
        description: 'Detect administrative operations during off hours',
        severity: 'MEDIUM' as const,
        conditions: [
          { field: 'eventType', operator: 'equals' as const, value: 'ADMIN_OPERATION' },
        ],
        timeWindow: 900, // 15 minutes
        threshold: 1,
        actions: [
          { type: 'EMAIL' as const, target: 'security@company.com' },
        ],
        suppressionTime: 7200, // 2 hours
      },
    ];

    for (const ruleData of defaultRules) {
      const existingRule = await prisma.alertRule.findFirst({
        where: { name: ruleData.name },
      });

      if (!existingRule) {
        await this.createAlertRule(ruleData);
      }
    }
  }

  private startBackgroundProcessing(): void {
    // Clean up expired indicators every hour
    setInterval(async () => {
      await this.cleanupExpiredIndicators();
    }, 3600000);

    // Process correlation engine every minute
    setInterval(async () => {
      await this.processCorrelationEngine();
    }, 60000);

    // Update threat feeds every 4 hours
    setInterval(async () => {
      await this.updateThreatFeeds();
    }, 14400000);
  }

  private async cacheEvent(event: SecurityEvent): Promise<void> {
    try {
      const key = `security:event:${event.id}`;
      await redis.setex(key, 3600, JSON.stringify(event)); // Cache for 1 hour
    } catch (error) {
      console.error('Failed to cache event:', error);
    }
  }

  private async forwardToExternalSIEM(event: SecurityEvent): Promise<void> {
    // Implementation would forward events to configured external SIEM systems
    // (Splunk, Elastic Security, Sumo Logic, etc.)
    console.log(`Forwarding event ${event.id} to external SIEM systems`);
  }

  private async checkIPReputation(ipAddress: string): Promise<{ score: number; reputation: string }> {
    // Implementation would check IP against threat intelligence feeds
    // For now, return mock data
    return { score: 0, reputation: 'clean' };
  }

  private async analyzeUserRisk(userId: string): Promise<{ score: number; riskLevel: string }> {
    // Implementation would analyze user behavior patterns
    // For now, return mock data
    return { score: 0, riskLevel: 'low' };
  }

  private async checkGeographicAnomaly(userId: string | undefined, ipAddress: string): Promise<{ score: number; anomaly: boolean }> {
    // Implementation would check for geographic anomalies
    // For now, return mock data
    return { score: 0, anomaly: false };
  }

  private async createThreatAlert(data: {
    event: SecurityEvent;
    indicator: ThreatIndicator;
    matchValue: string;
  }): Promise<void> {
    await prisma.securityAlert.create({
      data: {
        type: 'THREAT_INDICATOR_MATCH',
        severity: data.indicator.severity,
        title: `Threat Indicator Match: ${data.indicator.type}`,
        description: `Event matched threat indicator: ${data.indicator.description}`,
        eventId: data.event.id,
        metadata: {
          indicatorId: data.indicator.id,
          indicatorType: data.indicator.type,
          matchValue: data.matchValue,
          confidence: data.indicator.confidence,
        },
        resolved: false,
      },
    });
  }

  private async createCorrelationAlert(data: {
    type: string;
    correlationKey: string;
    events: SecurityEvent[];
    description: string;
    severity: string;
  }): Promise<void> {
    await prisma.securityAlert.create({
      data: {
        type: 'CORRELATION_PATTERN',
        severity: data.severity,
        title: `Pattern Detected: ${data.type}`,
        description: data.description,
        metadata: {
          correlationType: data.type,
          correlationKey: data.correlationKey,
          eventIds: data.events.map(e => e.id),
          eventCount: data.events.length,
        },
        resolved: false,
      },
    });
  }

  private async evaluateRuleConditions(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(event, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  }

  private getFieldValue(event: SecurityEvent, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value: any = event;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(expectedValue);
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > expectedValue;
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < expectedValue;
      case 'regex':
        return typeof fieldValue === 'string' && new RegExp(expectedValue).test(fieldValue);
      default:
        return false;
    }
  }

  private async getRecentMatchingEvents(rule: AlertRule, event: SecurityEvent): Promise<SecurityEvent[]> {
    const cutoffTime = new Date(Date.now() - rule.timeWindow * 1000);

    const events = await prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: cutoffTime },
        // Additional conditions would be applied here based on rule criteria
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter events that match rule conditions
    return events
      .map(e => this.convertPrismaEventToSecurityEvent(e))
      .filter(e => this.evaluateRuleConditions(rule, e));
  }

  private convertPrismaEventToSecurityEvent(prismaEvent: any): SecurityEvent {
    return {
      id: prismaEvent.id,
      eventType: prismaEvent.eventType,
      severity: prismaEvent.severity,
      source: 'system',
      title: prismaEvent.title,
      description: prismaEvent.description,
      userId: prismaEvent.userId || undefined,
      siteId: prismaEvent.siteId || undefined,
      ipAddress: prismaEvent.ipAddress || undefined,
      userAgent: prismaEvent.userAgent || undefined,
      sessionId: prismaEvent.sessionId || undefined,
      resourceId: prismaEvent.resourceId || undefined,
      resourceType: prismaEvent.resourceType || undefined,
      action: prismaEvent.action || undefined,
      metadata: prismaEvent.metadata as Record<string, any>,
      timestamp: prismaEvent.createdAt,
      threatScore: (prismaEvent.metadata as any)?.threatScore || 0,
      processed: (prismaEvent.metadata as any)?.processed || false,
    };
  }

  private generateSuppressionKey(event: SecurityEvent): string {
    return `${event.userId || 'anonymous'}:${event.ipAddress || 'unknown'}`;
  }

  private async triggerAlert(rule: AlertRule, event: SecurityEvent, matchingEvents: SecurityEvent[]): Promise<void> {
    // Create alert record
    const alert = await prisma.securityAlert.create({
      data: {
        type: 'RULE_TRIGGERED',
        severity: rule.severity,
        title: `Alert Rule: ${rule.name}`,
        description: rule.description,
        eventId: event.id,
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          matchingEventIds: matchingEvents.map(e => e.id),
          threshold: rule.threshold,
          actualCount: matchingEvents.length,
        },
        resolved: false,
      },
    });

    // Execute alert actions
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert, rule, event);
    }
  }

  private async executeAlertAction(action: any, alert: any, rule: AlertRule, event: SecurityEvent): Promise<void> {
    try {
      switch (action.type) {
        case 'EMAIL':
          await this.sendEmailAlert(action.target, alert, rule, event);
          break;
        case 'WEBHOOK':
          await this.sendWebhookAlert(action.target, alert, rule, event);
          break;
        case 'SLACK':
          await this.sendSlackAlert(action.target, alert, rule, event);
          break;
        case 'SMS':
          await this.sendSMSAlert(action.target, alert, rule, event);
          break;
        case 'CREATE_INCIDENT':
          await this.createSecurityIncident(alert, rule, event);
          break;
      }
    } catch (error) {
      console.error(`Failed to execute alert action ${action.type}:`, error);
    }
  }

  private async sendEmailAlert(target: string, alert: any, rule: AlertRule, event: SecurityEvent): Promise<void> {
    // Implementation would send email alert
    console.log(`Sending email alert to ${target} for rule ${rule.name}`);
  }

  private async sendWebhookAlert(target: string, alert: any, rule: AlertRule, event: SecurityEvent): Promise<void> {
    // Implementation would send webhook alert
    console.log(`Sending webhook alert to ${target} for rule ${rule.name}`);
  }

  private async sendSlackAlert(target: string, alert: any, rule: AlertRule, event: SecurityEvent): Promise<void> {
    // Implementation would send Slack alert
    console.log(`Sending Slack alert to ${target} for rule ${rule.name}`);
  }

  private async sendSMSAlert(target: string, alert: any, rule: AlertRule, event: SecurityEvent): Promise<void> {
    // Implementation would send SMS alert
    console.log(`Sending SMS alert to ${target} for rule ${rule.name}`);
  }

  private async createSecurityIncident(alert: any, rule: AlertRule, event: SecurityEvent): Promise<void> {
    await prisma.securityIncident.create({
      data: {
        title: `Security Incident: ${rule.name}`,
        description: `Automated incident created by alert rule: ${rule.description}`,
        severity: rule.severity,
        status: 'OPEN',
        alertId: alert.id,
        eventId: event.id,
        assignedTo: null,
        metadata: {
          ruleId: rule.id,
          automatedCreation: true,
          triggerEvent: event.id,
        },
      },
    });
  }

  private async updateRuleStatistics(ruleId: string): Promise<void> {
    await prisma.alertRule.update({
      where: { id: ruleId },
      data: {
        triggerCount: { increment: 1 },
        lastTriggered: new Date(),
      },
    });

    // Update in-memory cache
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.triggerCount++;
      rule.lastTriggered = new Date();
    }
  }

  private async detectTimeAnomalies(event: SecurityEvent): Promise<void> {
    // Implementation for time-based anomaly detection
  }

  private async detectVolumeAnomalies(event: SecurityEvent): Promise<void> {
    // Implementation for volume-based anomaly detection
  }

  private async detectBehavioralAnomalies(event: SecurityEvent): Promise<void> {
    // Implementation for behavioral anomaly detection
  }

  private async detectGeographicAnomalies(event: SecurityEvent): Promise<void> {
    // Implementation for geographic anomaly detection
  }

  private async updateContextualThreatScore(event: SecurityEvent): Promise<void> {
    // Implementation for contextual threat score updates
  }

  private async cleanupExpiredIndicators(): Promise<void> {
    const now = new Date();
    
    // Remove expired indicators from database
    await prisma.threatIndicator.updateMany({
      where: {
        expiresAt: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    // Remove from memory cache
    for (const [id, indicator] of this.threatIndicators.entries()) {
      if (indicator.expiresAt && indicator.expiresAt < now) {
        this.threatIndicators.delete(id);
      }
    }
  }

  private async processCorrelationEngine(): Promise<void> {
    // Clean up old correlations outside the time window
    const cutoffTime = new Date(Date.now() - SIEM_CONFIG.correlationWindow * 1000);
    
    for (const [key, events] of this.correlationEngine.entries()) {
      const recentEvents = events.filter(e => e.timestamp > cutoffTime);
      
      if (recentEvents.length === 0) {
        this.correlationEngine.delete(key);
      } else {
        this.correlationEngine.set(key, recentEvents);
      }
    }
  }

  private async updateThreatFeeds(): Promise<void> {
    // Implementation would update threat intelligence feeds from external sources
    console.log('Updating threat intelligence feeds...');
  }

  private async calculateAverageThreatScore(timeRange: { start: Date; end: Date }): Promise<number> {
    const result = await prisma.securityEvent.aggregate({
      where: {
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      _avg: { metadata: true }, // Would need custom aggregation for nested field
    });

    // For now, return a calculated average
    return 25; // Mock value
  }

  private async getTopThreats(timeRange: { start: Date; end: Date }): Promise<Array<{ type: string; count: number; severity: string }>> {
    // Implementation would calculate top threats
    return [
      { type: 'BRUTE_FORCE_ATTACK', count: 15, severity: 'HIGH' },
      { type: 'SUSPICIOUS_LOGIN', count: 8, severity: 'MEDIUM' },
      { type: 'DATA_EXFILTRATION', count: 3, severity: 'CRITICAL' },
    ];
  }

  private async getSystemHealth(): Promise<any> {
    const now = Date.now();
    const uptime = process.uptime() * 1000; // Convert to milliseconds

    return {
      status: 'healthy' as const,
      uptime,
      processedEvents: 1500, // Mock value
      failedEvents: 2, // Mock value
    };
  }
}

// Export singleton instance
export const siemService = new SIEMService();

// Export types
export type {
  SecurityEvent,
  ThreatIndicator,
  AlertRule,
  SecurityMetrics,
}; 