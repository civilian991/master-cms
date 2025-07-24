import { prisma } from '../../prisma';
import { siemService } from './siem-service';
import { z } from 'zod';

// Alerting configuration
const ALERTING_CONFIG = {
  channels: {
    email: { enabled: true, priority: 1 },
    sms: { enabled: true, priority: 2 },
    slack: { enabled: true, priority: 3 },
    webhook: { enabled: true, priority: 4 },
    dashboard: { enabled: true, priority: 5 },
  },
  escalationLevels: [
    { level: 1, delayMinutes: 5, channels: ['email', 'dashboard'] },
    { level: 2, delayMinutes: 15, channels: ['email', 'sms', 'slack'] },
    { level: 3, delayMinutes: 30, channels: ['email', 'sms', 'slack', 'webhook'] },
  ],
  severityThresholds: {
    INFO: { escalate: false, channels: ['dashboard'] },
    LOW: { escalate: false, channels: ['email', 'dashboard'] },
    MEDIUM: { escalate: true, maxLevel: 2, channels: ['email', 'slack', 'dashboard'] },
    HIGH: { escalate: true, maxLevel: 3, channels: ['email', 'sms', 'slack', 'dashboard'] },
    CRITICAL: { escalate: true, maxLevel: 3, channels: ['email', 'sms', 'slack', 'webhook', 'dashboard'] },
  },
} as const;

// Validation schemas
export const alertConfigSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  preferences: z.object({
    email: z.object({
      enabled: z.boolean().default(true),
      address: z.string().email(),
      severities: z.array(z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).default(['MEDIUM', 'HIGH', 'CRITICAL']),
    }),
    sms: z.object({
      enabled: z.boolean().default(false),
      number: z.string().optional(),
      severities: z.array(z.enum(['HIGH', 'CRITICAL'])).default(['HIGH', 'CRITICAL']),
    }),
    slack: z.object({
      enabled: z.boolean().default(false),
      webhook: z.string().url().optional(),
      channel: z.string().optional(),
      severities: z.array(z.enum(['MEDIUM', 'HIGH', 'CRITICAL'])).default(['MEDIUM', 'HIGH', 'CRITICAL']),
    }),
    dashboard: z.object({
      enabled: z.boolean().default(true),
      realTime: z.boolean().default(true),
    }),
  }),
  escalation: z.object({
    enabled: z.boolean().default(true),
    maxLevel: z.number().min(1).max(3).default(2),
    acknowledgmentRequired: z.boolean().default(true),
  }),
});

export const notificationSchema = z.object({
  type: z.enum(['SECURITY_ALERT', 'THREAT_DETECTED', 'INCIDENT_CREATED', 'SYSTEM_ALERT', 'COMPLIANCE_VIOLATION']),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string(),
  message: z.string(),
  targetUsers: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'slack', 'webhook', 'dashboard'])).optional(),
  metadata: z.record(z.any()).optional(),
  escalate: z.boolean().default(false),
});

// Interfaces
interface AlertConfig {
  id: string;
  userId: string;
  siteId: string;
  preferences: {
    email: { enabled: boolean; address: string; severities: string[] };
    sms: { enabled: boolean; number?: string; severities: string[] };
    slack: { enabled: boolean; webhook?: string; channel?: string; severities: string[] };
    dashboard: { enabled: boolean; realTime: boolean };
  };
  escalation: {
    enabled: boolean;
    maxLevel: number;
    acknowledgmentRequired: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Notification {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  targetUsers: string[];
  targetRoles: string[];
  channels: string[];
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'ACKNOWLEDGED';
  sentAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  attempts: number;
  metadata: Record<string, any>;
  escalationLevel: number;
  createdAt: Date;
}

interface EscalationTracker {
  notificationId: string;
  currentLevel: number;
  maxLevel: number;
  nextEscalationAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// Security Alerting Service
export class SecurityAlertingService {
  private escalationTrackers: Map<string, EscalationTracker> = new Map();
  private activeNotifications: Map<string, Notification> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize alerting service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load active escalations
      await this.loadActiveEscalations();

      // Start escalation processor
      this.startEscalationProcessor();

      // Subscribe to security events
      siemService.on('securityEvent', (event) => {
        this.processSecurityEventForAlerting(event);
      });

      console.log('Security Alerting Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Security Alerting Service:', error);
    }
  }

  /**
   * Send notification
   */
  async sendNotification(
    notificationData: z.infer<typeof notificationSchema>
  ): Promise<Notification> {
    try {
      const validatedData = notificationSchema.parse(notificationData);

      // Create notification record
      const notification: Notification = {
        id: crypto.randomUUID(),
        type: validatedData.type,
        severity: validatedData.severity,
        title: validatedData.title,
        message: validatedData.message,
        targetUsers: validatedData.targetUsers || [],
        targetRoles: validatedData.targetRoles || [],
        channels: validatedData.channels || this.getDefaultChannels(validatedData.severity),
        status: 'PENDING',
        attempts: 0,
        metadata: validatedData.metadata || {},
        escalationLevel: 0,
        createdAt: new Date(),
      };

      // Store notification
      await this.storeNotification(notification);

      // Send through configured channels
      await this.deliverNotification(notification);

      // Set up escalation if needed
      if (validatedData.escalate && this.shouldEscalate(validatedData.severity)) {
        await this.setupEscalation(notification);
      }

      this.activeNotifications.set(notification.id, notification);

      return notification;

    } catch (error) {
      console.error('Failed to send notification:', error);
      throw new Error(`Notification delivery failed: ${error.message}`);
    }
  }

  /**
   * Configure user alert preferences
   */
  async configureAlertPreferences(
    configData: z.infer<typeof alertConfigSchema>
  ): Promise<AlertConfig> {
    try {
      const validatedData = alertConfigSchema.parse(configData);

      const config = await prisma.alertConfig.upsert({
        where: {
          userId_siteId: {
            userId: validatedData.userId,
            siteId: validatedData.siteId,
          },
        },
        create: {
          userId: validatedData.userId,
          siteId: validatedData.siteId,
          preferences: validatedData.preferences,
          escalation: validatedData.escalation,
        },
        update: {
          preferences: validatedData.preferences,
          escalation: validatedData.escalation,
          updatedAt: new Date(),
        },
      });

      return {
        id: config.id,
        userId: config.userId,
        siteId: config.siteId,
        preferences: config.preferences as any,
        escalation: config.escalation as any,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

    } catch (error) {
      throw new Error(`Failed to configure alert preferences: ${error.message}`);
    }
  }

  /**
   * Acknowledge notification
   */
  async acknowledgeNotification(
    notificationId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      const notification = this.activeNotifications.get(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Update notification status
      notification.status = 'ACKNOWLEDGED';
      notification.acknowledgedAt = new Date();
      notification.acknowledgedBy = userId;

      if (notes) {
        notification.metadata.acknowledgmentNotes = notes;
      }

      // Update database
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
          metadata: notification.metadata,
        },
      });

      // Stop escalation
      const escalation = this.escalationTrackers.get(notificationId);
      if (escalation) {
        escalation.acknowledged = true;
        escalation.acknowledgedBy = userId;
        escalation.acknowledgedAt = new Date();
      }

      // Log acknowledgment
      await siemService.ingestEvent({
        eventType: 'ADMIN_OPERATION',
        severity: 'INFO',
        source: 'AlertingService',
        title: 'Notification Acknowledged',
        description: `Notification ${notificationId} acknowledged by user`,
        userId,
        action: 'ACKNOWLEDGE_NOTIFICATION',
        metadata: {
          notificationId,
          notificationType: notification.type,
          originalSeverity: notification.severity,
          acknowledgmentNotes: notes,
        },
      });

    } catch (error) {
      throw new Error(`Failed to acknowledge notification: ${error.message}`);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    filters?: {
      status?: string;
      severity?: string;
      type?: string;
      limit?: number;
    }
  ): Promise<Notification[]> {
    try {
      const whereClause: any = {
        OR: [
          { targetUsers: { has: userId } },
          { targetRoles: { hasSome: await this.getUserRoles(userId) } },
        ],
      };

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.severity) {
        whereClause.severity = filters.severity;
      }

      if (filters?.type) {
        whereClause.type = filters.type;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
      });

      return notifications.map(n => ({
        id: n.id,
        type: n.type,
        severity: n.severity,
        title: n.title,
        message: n.message,
        targetUsers: n.targetUsers as string[],
        targetRoles: n.targetRoles as string[],
        channels: n.channels as string[],
        status: n.status as any,
        sentAt: n.sentAt || undefined,
        acknowledgedAt: n.acknowledgedAt || undefined,
        acknowledgedBy: n.acknowledgedBy || undefined,
        attempts: n.attempts,
        metadata: n.metadata as Record<string, any>,
        escalationLevel: n.escalationLevel,
        createdAt: n.createdAt,
      }));

    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(timeRange?: { start: Date; end: Date }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byChannel: Record<string, number>;
    acknowledgmentRate: number;
    averageResponseTime: number;
  }> {
    try {
      const whereClause: any = {};

      if (timeRange) {
        whereClause.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      const [
        total,
        byStatus,
        bySeverity,
        byType,
        acknowledged
      ] = await Promise.all([
        prisma.notification.count({ where: whereClause }),
        prisma.notification.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true },
        }),
        prisma.notification.groupBy({
          by: ['severity'],
          where: whereClause,
          _count: { severity: true },
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true },
        }),
        prisma.notification.findMany({
          where: {
            ...whereClause,
            acknowledgedAt: { not: null },
          },
          select: {
            createdAt: true,
            acknowledgedAt: true,
          },
        }),
      ]);

      // Calculate acknowledgment rate
      const acknowledgmentRate = total > 0 ? (acknowledged.length / total) * 100 : 0;

      // Calculate average response time
      const responseTimes = acknowledged
        .filter(n => n.acknowledgedAt)
        .map(n => n.acknowledgedAt!.getTime() - n.createdAt.getTime());

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000 / 60 // Convert to minutes
        : 0;

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.status])),
        bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count.severity])),
        byType: Object.fromEntries(byType.map(t => [t.type, t._count.type])),
        byChannel: {}, // Would be calculated from delivery logs
        acknowledgmentRate,
        averageResponseTime,
      };

    } catch (error) {
      console.error('Failed to get notification statistics:', error);
      throw new Error(`Failed to get notification statistics: ${error.message}`);
    }
  }

  // Helper methods

  private async processSecurityEventForAlerting(event: any): Promise<void> {
    // Auto-generate notifications for high-severity events
    if (['HIGH', 'CRITICAL'].includes(event.severity)) {
      await this.sendNotification({
        type: 'SECURITY_ALERT',
        severity: event.severity,
        title: `Security Alert: ${event.title}`,
        message: event.description,
        escalate: event.severity === 'CRITICAL',
        metadata: {
          eventId: event.id,
          eventType: event.eventType,
          threatScore: event.threatScore,
        },
      });
    }
  }

  private getDefaultChannels(severity: string): string[] {
    return ALERTING_CONFIG.severityThresholds[severity as keyof typeof ALERTING_CONFIG.severityThresholds]?.channels || ['dashboard'];
  }

  private shouldEscalate(severity: string): boolean {
    return ALERTING_CONFIG.severityThresholds[severity as keyof typeof ALERTING_CONFIG.severityThresholds]?.escalate || false;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    const deliveryPromises = notification.channels.map(channel => 
      this.deliverToChannel(notification, channel)
    );

    try {
      await Promise.all(deliveryPromises);
      notification.status = 'SENT';
      notification.sentAt = new Date();
    } catch (error) {
      notification.status = 'FAILED';
      console.error('Failed to deliver notification:', error);
    }

    await this.updateNotificationStatus(notification);
  }

  private async deliverToChannel(notification: Notification, channel: string): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'sms':
        await this.sendSMSNotification(notification);
        break;
      case 'slack':
        await this.sendSlackNotification(notification);
        break;
      case 'webhook':
        await this.sendWebhookNotification(notification);
        break;
      case 'dashboard':
        await this.sendDashboardNotification(notification);
        break;
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Implementation would send actual email
    console.log(`Sending email notification: ${notification.title}`);
  }

  private async sendSMSNotification(notification: Notification): Promise<void> {
    // Implementation would send SMS
    console.log(`Sending SMS notification: ${notification.title}`);
  }

  private async sendSlackNotification(notification: Notification): Promise<void> {
    // Implementation would send Slack message
    console.log(`Sending Slack notification: ${notification.title}`);
  }

  private async sendWebhookNotification(notification: Notification): Promise<void> {
    // Implementation would send webhook
    console.log(`Sending webhook notification: ${notification.title}`);
  }

  private async sendDashboardNotification(notification: Notification): Promise<void> {
    // Implementation would update dashboard
    console.log(`Sending dashboard notification: ${notification.title}`);
  }

  private async setupEscalation(notification: Notification): Promise<void> {
    const maxLevel = ALERTING_CONFIG.severityThresholds[notification.severity as keyof typeof ALERTING_CONFIG.severityThresholds]?.maxLevel || 1;
    const firstEscalation = ALERTING_CONFIG.escalationLevels[0];

    const escalation: EscalationTracker = {
      notificationId: notification.id,
      currentLevel: 0,
      maxLevel,
      nextEscalationAt: new Date(Date.now() + firstEscalation.delayMinutes * 60 * 1000),
      acknowledged: false,
    };

    this.escalationTrackers.set(notification.id, escalation);
  }

  private async storeNotification(notification: Notification): Promise<void> {
    await prisma.notification.create({
      data: {
        id: notification.id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        targetUsers: notification.targetUsers,
        targetRoles: notification.targetRoles,
        channels: notification.channels,
        status: notification.status,
        attempts: notification.attempts,
        metadata: notification.metadata,
        escalationLevel: notification.escalationLevel,
      },
    });
  }

  private async updateNotificationStatus(notification: Notification): Promise<void> {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: notification.status,
        sentAt: notification.sentAt,
        attempts: notification.attempts,
      },
    });
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    // Implementation would get user roles
    return ['user'];
  }

  private async loadActiveEscalations(): Promise<void> {
    // Implementation would load active escalations from database
  }

  private startEscalationProcessor(): void {
    // Check for escalations every minute
    setInterval(async () => {
      await this.processEscalations();
    }, 60000);
  }

  private async processEscalations(): Promise<void> {
    const now = new Date();

    for (const [notificationId, escalation] of this.escalationTrackers.entries()) {
      if (escalation.acknowledged || escalation.currentLevel >= escalation.maxLevel) {
        continue;
      }

      if (now >= escalation.nextEscalationAt) {
        await this.escalateNotification(notificationId, escalation);
      }
    }
  }

  private async escalateNotification(notificationId: string, escalation: EscalationTracker): Promise<void> {
    const notification = this.activeNotifications.get(notificationId);
    if (!notification) return;

    escalation.currentLevel++;
    
    if (escalation.currentLevel < ALERTING_CONFIG.escalationLevels.length) {
      const nextLevel = ALERTING_CONFIG.escalationLevels[escalation.currentLevel];
      
      // Send escalated notification
      await this.sendNotification({
        type: 'SYSTEM_ALERT',
        severity: 'HIGH',
        title: `ESCALATED: ${notification.title}`,
        message: `This is an escalated notification (Level ${escalation.currentLevel + 1}): ${notification.message}`,
        channels: nextLevel.channels as any,
        metadata: {
          originalNotificationId: notificationId,
          escalationLevel: escalation.currentLevel + 1,
        },
      });

      // Set next escalation time
      if (escalation.currentLevel < escalation.maxLevel - 1) {
        const nextEscalationLevel = ALERTING_CONFIG.escalationLevels[escalation.currentLevel + 1];
        escalation.nextEscalationAt = new Date(Date.now() + nextEscalationLevel.delayMinutes * 60 * 1000);
      }
    }
  }
}

// Export singleton instance
export const alertingService = new SecurityAlertingService();

// Export types
export type {
  AlertConfig,
  Notification,
  EscalationTracker,
}; 