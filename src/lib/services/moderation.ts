import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const ModerationRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().min(1, 'Rule description is required'),
  category: z.enum(['content', 'user', 'community', 'spam', 'safety', 'legal']),
  type: z.enum(['automated', 'manual', 'hybrid']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  action: z.enum(['flag', 'hide', 'remove', 'warn', 'suspend', 'ban', 'quarantine']),
  conditions: z.object({
    keywords: z.array(z.string()).default([]),
    patterns: z.array(z.string()).default([]),
    threshold: z.number().min(0).max(1).default(0.8),
    userReports: z.number().int().min(0).default(3),
    contentType: z.array(z.string()).default([]),
    userRole: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.any()).default({}),
  }),
  isActive: z.boolean().default(true),
  autoApply: z.boolean().default(false),
  requiresReview: z.boolean().default(true),
  escalationLevel: z.number().int().min(1).max(5).default(1),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ModerationActionSchema = z.object({
  id: z.string().optional(),
  targetType: z.enum(['post', 'comment', 'user', 'community', 'event', 'message']),
  targetId: z.string().min(1, 'Target ID is required'),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
  action: z.enum(['approve', 'reject', 'remove', 'hide', 'warn', 'suspend', 'ban', 'escalate']),
  reason: z.string().min(1, 'Reason is required'),
  duration: z.number().int().min(0).optional(), // in hours, 0 = permanent
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  notes: z.string().optional(),
  isReversible: z.boolean().default(true),
  notifyUser: z.boolean().default(true),
  publicReason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const UserReportSchema = z.object({
  id: z.string().optional(),
  reporterId: z.string().min(1, 'Reporter ID is required'),
  targetType: z.enum(['post', 'comment', 'user', 'community', 'event', 'message']),
  targetId: z.string().min(1, 'Target ID is required'),
  category: z.enum(['spam', 'harassment', 'hate_speech', 'violence', 'misinformation', 'copyright', 'other']),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
  evidence: z.array(z.string()).default([]), // URLs to evidence (screenshots, etc.)
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed', 'escalated']).default('pending'),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const SecurityEventSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['login_failed', 'suspicious_activity', 'rate_limit_exceeded', 'bot_detected', 'security_breach']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  evidence: z.record(z.string(), z.any()).default({}),
  status: z.enum(['detected', 'investigating', 'resolved', 'false_positive']).default('detected'),
  action: z.enum(['none', 'block_ip', 'suspend_user', 'require_verification', 'escalate']).optional(),
  createdAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ModerationQueueSchema = z.object({
  id: z.string().optional(),
  targetType: z.enum(['post', 'comment', 'user', 'community', 'event', 'message']),
  targetId: z.string().min(1, 'Target ID is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['content', 'user', 'community', 'spam', 'safety', 'legal']),
  status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'escalated']).default('pending'),
  assignedTo: z.string().optional(),
  reviewedBy: z.string().optional(),
  triggeredBy: z.enum(['automated', 'user_report', 'manual', 'appeal']),
  ruleId: z.string().optional(),
  reportId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

// Types
export type ModerationRule = z.infer<typeof ModerationRuleSchema>;
export type ModerationAction = z.infer<typeof ModerationActionSchema>;
export type UserReport = z.infer<typeof UserReportSchema>;
export type SecurityEvent = z.infer<typeof SecurityEventSchema>;
export type ModerationQueue = z.infer<typeof ModerationQueueSchema>;

export interface ModerationDashboard {
  overview: {
    pendingReviews: number;
    activeReports: number;
    securityEvents: number;
    automatedActions: number;
    moderatorWorkload: number;
  };
  queueStats: {
    total: number;
    pending: number;
    inReview: number;
    escalated: number;
    avgProcessingTime: number;
  };
  contentMetrics: {
    flaggedContent: number;
    removedContent: number;
    appealedActions: number;
    falsePositives: number;
    accuracy: number;
  };
  userMetrics: {
    suspendedUsers: number;
    bannedUsers: number;
    activeWarnings: number;
    reportingUsers: number;
  };
  securityMetrics: {
    suspiciousActivity: number;
    blockedIPs: number;
    botDetections: number;
    rateLimit: number;
  };
}

export interface ContentAnalysis {
  score: number;
  confidence: number;
  categories: Array<{
    name: string;
    score: number;
    threshold: number;
    triggered: boolean;
  }>;
  keywords: string[];
  patterns: string[];
  language: string;
  toxicity: number;
  sentiment: number;
  recommendations: string[];
}

export interface ModerationWorkflow {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    name: string;
    type: 'automated' | 'manual' | 'review';
    conditions: Record<string, any>;
    actions: string[];
    escalation?: {
      threshold: number;
      target: string;
    };
  }>;
  triggers: string[];
  isActive: boolean;
}

export class ModerationService {
  constructor(private config: {
    enableAIModeration?: boolean;
    enableRealTimeScanning?: boolean;
    enableAutoActions?: boolean;
    maxQueueSize?: number;
    aiConfidenceThreshold?: number;
  } = {}) {
    this.config = {
      enableAIModeration: true,
      enableRealTimeScanning: true,
      enableAutoActions: false,
      maxQueueSize: 10000,
      aiConfidenceThreshold: 0.85,
      ...config
    };
  }

  // Moderation Rules Management
  async createModerationRule(ruleData: ModerationRule): Promise<ModerationRule> {
    const validatedData = ModerationRuleSchema.parse(ruleData);

    const rule = await prisma.moderationRule.create({
      data: {
        ...validatedData,
        id: validatedData.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return rule;
  }

  async getModerationRules(siteId: string, options: {
    category?: string[];
    type?: string[];
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ rules: ModerationRule[]; total: number }> {
    const {
      category,
      type,
      isActive = true,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = {
      siteId,
      isActive,
    };

    if (category && category.length > 0) {
      whereClause.category = { in: category };
    }

    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    const [rules, total] = await Promise.all([
      prisma.moderationRule.findMany({
        where: whereClause,
        orderBy: [
          { severity: 'desc' },
          { escalationLevel: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.moderationRule.count({ where: whereClause })
    ]);

    return { rules, total };
  }

  async updateModerationRule(ruleId: string, updates: Partial<ModerationRule>): Promise<ModerationRule> {
    const rule = await prisma.moderationRule.update({
      where: { id: ruleId },
      data: {
        ...updates,
        updatedAt: new Date(),
      }
    });

    return rule;
  }

  // Content Analysis and Filtering
  async analyzeContent(content: string, contentType: string, metadata: Record<string, any> = {}): Promise<ContentAnalysis> {
    // Simulate AI content analysis
    const analysis: ContentAnalysis = {
      score: 0.2,
      confidence: 0.9,
      categories: [
        { name: 'toxicity', score: 0.1, threshold: 0.8, triggered: false },
        { name: 'hate_speech', score: 0.05, threshold: 0.7, triggered: false },
        { name: 'spam', score: 0.3, threshold: 0.6, triggered: false },
        { name: 'violence', score: 0.02, threshold: 0.8, triggered: false },
      ],
      keywords: this.extractKeywords(content),
      patterns: this.detectPatterns(content),
      language: this.detectLanguage(content),
      toxicity: 0.1,
      sentiment: 0.7,
      recommendations: [],
    };

    // Check against moderation rules
    const rules = await this.getApplicableRules(contentType, metadata);
    for (const rule of rules) {
      const ruleResult = await this.evaluateRule(content, rule, analysis);
      if (ruleResult.triggered) {
        analysis.categories.push({
          name: rule.name,
          score: ruleResult.score,
          threshold: rule.conditions.threshold,
          triggered: true,
        });
        analysis.recommendations.push(ruleResult.recommendation);
      }
    }

    return analysis;
  }

  async moderateContent(
    targetType: string,
    targetId: string,
    content: string,
    authorId: string,
    siteId: string
  ): Promise<{ action: string; reason: string; confidence: number; queueId?: string }> {
    const analysis = await this.analyzeContent(content, targetType);

    // Check if any category is triggered
    const triggeredCategories = analysis.categories.filter(cat => cat.triggered);

    if (triggeredCategories.length === 0) {
      return { action: 'approve', reason: 'Content passed all checks', confidence: analysis.confidence };
    }

    // Determine action based on severity
    const maxScore = Math.max(...triggeredCategories.map(cat => cat.score));
    const highestCategory = triggeredCategories.find(cat => cat.score === maxScore);

    if (analysis.confidence >= this.config.aiConfidenceThreshold! && this.config.enableAutoActions) {
      // Auto-action for high confidence
      if (maxScore >= 0.9) {
        await this.executeAction({
          targetType: targetType as any,
          targetId,
          moderatorId: 'system',
          action: 'remove',
          reason: `Automated removal: ${highestCategory?.name}`,
          severity: 'high',
          siteId,
        });
        return { action: 'remove', reason: 'Automated removal', confidence: analysis.confidence };
      } else if (maxScore >= 0.7) {
        await this.executeAction({
          targetType: targetType as any,
          targetId,
          moderatorId: 'system',
          action: 'hide',
          reason: `Automated hide: ${highestCategory?.name}`,
          severity: 'medium',
          siteId,
        });
        return { action: 'hide', reason: 'Automated hide', confidence: analysis.confidence };
      }
    }

    // Add to moderation queue for manual review
    const queueItem = await this.addToModerationQueue({
      targetType: targetType as any,
      targetId,
      priority: maxScore >= 0.8 ? 'high' : maxScore >= 0.5 ? 'medium' : 'low',
      category: this.getCategoryFromAnalysis(triggeredCategories),
      triggeredBy: 'automated',
      confidence: analysis.confidence,
      metadata: {
        analysis,
        triggeredCategories: triggeredCategories.map(cat => cat.name),
        maxScore,
      },
      siteId,
    });

    return {
      action: 'queue',
      reason: 'Flagged for manual review',
      confidence: analysis.confidence,
      queueId: queueItem.id,
    };
  }

  // User Reporting System
  async createReport(reportData: UserReport): Promise<UserReport> {
    const validatedData = UserReportSchema.parse(reportData);

    // Check for duplicate reports
    const existing = await prisma.userReport.findFirst({
      where: {
        reporterId: validatedData.reporterId,
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
        siteId: validatedData.siteId,
        status: { in: ['pending', 'reviewing'] },
      }
    });

    if (existing) {
      throw new Error('You have already reported this content');
    }

    const report = await prisma.userReport.create({
      data: {
        ...validatedData,
        id: validatedData.id || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    });

    // Check if this target has multiple reports
    const reportCount = await prisma.userReport.count({
      where: {
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
        siteId: validatedData.siteId,
        status: { in: ['pending', 'reviewing'] },
      }
    });

    // Auto-escalate if threshold reached
    if (reportCount >= 3) {
      await this.addToModerationQueue({
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
        priority: 'high',
        category: this.mapReportCategoryToModerationCategory(validatedData.category),
        triggeredBy: 'user_report',
        reportId: report.id,
        metadata: { reportCount },
        siteId: validatedData.siteId,
      });
    }

    return report;
  }

  async getReports(siteId: string, options: {
    status?: string[];
    category?: string[];
    priority?: string[];
    assignedTo?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ reports: UserReport[]; total: number }> {
    const {
      status,
      category,
      priority,
      assignedTo,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = { siteId };

    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    if (category && category.length > 0) {
      whereClause.category = { in: category };
    }

    if (priority && priority.length > 0) {
      whereClause.priority = { in: priority };
    }

    if (assignedTo) {
      whereClause.assignedTo = assignedTo;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where: whereClause,
        include: {
          reporter: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.userReport.count({ where: whereClause })
    ]);

    return { reports, total };
  }

  async updateReport(reportId: string, updates: Partial<UserReport>): Promise<UserReport> {
    const report = await prisma.userReport.update({
      where: { id: reportId },
      data: {
        ...updates,
        updatedAt: new Date(),
      }
    });

    return report;
  }

  // Moderation Actions
  async executeAction(actionData: ModerationAction): Promise<ModerationAction> {
    const validatedData = ModerationActionSchema.parse(actionData);

    const action = await prisma.moderationAction.create({
      data: {
        ...validatedData,
        id: validatedData.id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    });

    // Apply the action to the target
    await this.applyModerationAction(action);

    // Notify user if required
    if (validatedData.notifyUser) {
      await this.notifyUserOfAction(action);
    }

    return action;
  }

  async getModerationActions(siteId: string, options: {
    targetType?: string;
    targetId?: string;
    moderatorId?: string;
    action?: string[];
    severity?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ actions: ModerationAction[]; total: number }> {
    const {
      targetType,
      targetId,
      moderatorId,
      action,
      severity,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = { siteId };

    if (targetType) whereClause.targetType = targetType;
    if (targetId) whereClause.targetId = targetId;
    if (moderatorId) whereClause.moderatorId = moderatorId;

    if (action && action.length > 0) {
      whereClause.action = { in: action };
    }

    if (severity && severity.length > 0) {
      whereClause.severity = { in: severity };
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [actions, total] = await Promise.all([
      prisma.moderationAction.findMany({
        where: whereClause,
        include: {
          moderator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.moderationAction.count({ where: whereClause })
    ]);

    return { actions, total };
  }

  // Moderation Queue Management
  async addToModerationQueue(queueData: ModerationQueue): Promise<ModerationQueue> {
    const validatedData = ModerationQueueSchema.parse(queueData);

    // Check if already in queue
    const existing = await prisma.moderationQueue.findFirst({
      where: {
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
        siteId: validatedData.siteId,
        status: { in: ['pending', 'in_review'] },
      }
    });

    if (existing) {
      // Update priority if higher
      if (this.getPriorityWeight(validatedData.priority) > this.getPriorityWeight(existing.priority)) {
        return await prisma.moderationQueue.update({
          where: { id: existing.id },
          data: { priority: validatedData.priority }
        });
      }
      return existing;
    }

    const queueItem = await prisma.moderationQueue.create({
      data: {
        ...validatedData,
        id: validatedData.id || `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    });

    return queueItem;
  }

  async getModerationQueue(siteId: string, options: {
    status?: string[];
    priority?: string[];
    category?: string[];
    assignedTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ queue: ModerationQueue[]; total: number }> {
    const {
      status = ['pending', 'in_review'],
      priority,
      category,
      assignedTo,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = {
      siteId,
      status: { in: status },
    };

    if (priority && priority.length > 0) {
      whereClause.priority = { in: priority };
    }

    if (category && category.length > 0) {
      whereClause.category = { in: category };
    }

    if (assignedTo) {
      whereClause.assignedTo = assignedTo;
    }

    const [queue, total] = await Promise.all([
      prisma.moderationQueue.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.moderationQueue.count({ where: whereClause })
    ]);

    return { queue, total };
  }

  async assignQueueItem(queueId: string, moderatorId: string): Promise<ModerationQueue> {
    const queueItem = await prisma.moderationQueue.update({
      where: { id: queueId },
      data: {
        assignedTo: moderatorId,
        status: 'in_review',
        updatedAt: new Date(),
      }
    });

    return queueItem;
  }

  async processQueueItem(queueId: string, action: string, moderatorId: string, notes?: string): Promise<void> {
    const queueItem = await prisma.moderationQueue.findUnique({
      where: { id: queueId }
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Execute the moderation action
    await this.executeAction({
      targetType: queueItem.targetType,
      targetId: queueItem.targetId,
      moderatorId,
      action: action as any,
      reason: notes || 'Manual review',
      siteId: queueItem.siteId,
    });

    // Update queue item status
    await prisma.moderationQueue.update({
      where: { id: queueId },
      data: {
        status: action === 'escalate' ? 'escalated' : action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: moderatorId,
        updatedAt: new Date(),
      }
    });

    // Update related report if exists
    if (queueItem.reportId) {
      await this.updateReport(queueItem.reportId, {
        status: 'resolved',
        assignedTo: moderatorId,
        resolution: notes,
      });
    }
  }

  // Security Event Management
  async recordSecurityEvent(eventData: SecurityEvent): Promise<SecurityEvent> {
    const validatedData = SecurityEventSchema.parse(eventData);

    const event = await prisma.securityEvent.create({
      data: {
        ...validatedData,
        id: validatedData.id || `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    });

    // Auto-respond to critical security events
    if (validatedData.severity === 'critical' && validatedData.action) {
      await this.executeSecurityAction(event);
    }

    return event;
  }

  async getSecurityEvents(siteId: string, options: {
    type?: string[];
    severity?: string[];
    status?: string[];
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ events: SecurityEvent[]; total: number }> {
    const {
      type,
      severity,
      status,
      userId,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = { siteId };

    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    if (severity && severity.length > 0) {
      whereClause.severity = { in: severity };
    }

    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where: whereClause,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.securityEvent.count({ where: whereClause })
    ]);

    return { events, total };
  }

  // Analytics and Reporting
  async getModerationDashboard(siteId: string, timeRange: string = '30d'): Promise<ModerationDashboard> {
    const dateFilter = this.getDateFilter(timeRange);

    const [
      pendingReviews,
      activeReports,
      securityEvents,
      automatedActions,
      queueStats,
      contentMetrics,
      userMetrics,
      securityMetrics
    ] = await Promise.all([
      prisma.moderationQueue.count({
        where: { siteId, status: { in: ['pending', 'in_review'] } }
      }),
      prisma.userReport.count({
        where: { siteId, status: { in: ['pending', 'reviewing'] } }
      }),
      prisma.securityEvent.count({
        where: { siteId, createdAt: dateFilter }
      }),
      prisma.moderationAction.count({
        where: { siteId, moderatorId: 'system', createdAt: dateFilter }
      }),
      this.getQueueStats(siteId, dateFilter),
      this.getContentMetrics(siteId, dateFilter),
      this.getUserMetrics(siteId, dateFilter),
      this.getSecurityMetrics(siteId, dateFilter)
    ]);

    return {
      overview: {
        pendingReviews,
        activeReports,
        securityEvents,
        automatedActions,
        moderatorWorkload: pendingReviews + activeReports,
      },
      queueStats,
      contentMetrics,
      userMetrics,
      securityMetrics,
    };
  }

  // Helper methods
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return words.filter(word => word.length > 3 && !stopWords.has(word));
  }

  private detectPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    // Check for common spam patterns
    if (/(.)\1{4,}/.test(content)) patterns.push('repeated_characters');
    if (/[A-Z]{10,}/.test(content)) patterns.push('excessive_caps');
    if (/(https?:\/\/[^\s]+){3,}/.test(content)) patterns.push('multiple_links');
    if (/\b(\w+)\s+\1\b/gi.test(content)) patterns.push('repeated_words');
    
    return patterns;
  }

  private detectLanguage(content: string): string {
    // Simple language detection
    return 'en'; // Default to English
  }

  private async getApplicableRules(contentType: string, metadata: Record<string, any>): Promise<ModerationRule[]> {
    return await prisma.moderationRule.findMany({
      where: {
        isActive: true,
        'conditions.contentType': { hasSome: [contentType] }
      }
    });
  }

  private async evaluateRule(content: string, rule: ModerationRule, analysis: ContentAnalysis): Promise<{ triggered: boolean; score: number; recommendation: string }> {
    let score = 0;
    let triggered = false;
    let recommendation = '';

    // Keyword matching
    for (const keyword of rule.conditions.keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        score += 0.3;
        recommendation = `Contains flagged keyword: ${keyword}`;
      }
    }

    // Pattern matching
    for (const pattern of rule.conditions.patterns) {
      if (new RegExp(pattern, 'i').test(content)) {
        score += 0.4;
        recommendation = `Matches flagged pattern: ${pattern}`;
      }
    }

    // Check against threshold
    if (score >= rule.conditions.threshold) {
      triggered = true;
    }

    return { triggered, score, recommendation };
  }

  private getCategoryFromAnalysis(categories: Array<{ name: string }>): any {
    const categoryMap: Record<string, any> = {
      'toxicity': 'safety',
      'hate_speech': 'safety',
      'spam': 'spam',
      'violence': 'safety',
    };

    const firstCategory = categories[0]?.name;
    return categoryMap[firstCategory] || 'content';
  }

  private mapReportCategoryToModerationCategory(category: string): any {
    const categoryMap: Record<string, any> = {
      'spam': 'spam',
      'harassment': 'safety',
      'hate_speech': 'safety',
      'violence': 'safety',
      'misinformation': 'content',
      'copyright': 'legal',
      'other': 'content',
    };

    return categoryMap[category] || 'content';
  }

  private getPriorityWeight(priority: string): number {
    const weights = { low: 1, medium: 2, high: 3, urgent: 4 };
    return weights[priority as keyof typeof weights] || 1;
  }

  private async applyModerationAction(action: ModerationAction): Promise<void> {
    switch (action.action) {
      case 'remove':
        await this.removeContent(action.targetType, action.targetId);
        break;
      case 'hide':
        await this.hideContent(action.targetType, action.targetId);
        break;
      case 'suspend':
        if (action.targetType === 'user') {
          await this.suspendUser(action.targetId, action.duration);
        }
        break;
      case 'ban':
        if (action.targetType === 'user') {
          await this.banUser(action.targetId);
        }
        break;
    }
  }

  private async removeContent(targetType: string, targetId: string): Promise<void> {
    const updateData = { status: 'removed', removedAt: new Date() };
    
    switch (targetType) {
      case 'post':
        await prisma.post.update({ where: { id: targetId }, data: updateData });
        break;
      case 'comment':
        await prisma.comment.update({ where: { id: targetId }, data: updateData });
        break;
    }
  }

  private async hideContent(targetType: string, targetId: string): Promise<void> {
    const updateData = { status: 'hidden', hiddenAt: new Date() };
    
    switch (targetType) {
      case 'post':
        await prisma.post.update({ where: { id: targetId }, data: updateData });
        break;
      case 'comment':
        await prisma.comment.update({ where: { id: targetId }, data: updateData });
        break;
    }
  }

  private async suspendUser(userId: string, duration?: number): Promise<void> {
    const suspendedUntil = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'suspended',
        suspendedUntil,
        suspendedAt: new Date(),
      }
    });
  }

  private async banUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'banned',
        bannedAt: new Date(),
      }
    });
  }

  private async notifyUserOfAction(action: ModerationAction): Promise<void> {
    // Implementation for notifying users of moderation actions
    console.log('Notifying user of moderation action:', action.id);
  }

  private async executeSecurityAction(event: SecurityEvent): Promise<void> {
    switch (event.action) {
      case 'block_ip':
        await this.blockIP(event.ipAddress);
        break;
      case 'suspend_user':
        if (event.userId) {
          await this.suspendUser(event.userId, 24); // 24 hours
        }
        break;
      case 'require_verification':
        if (event.userId) {
          await this.requireVerification(event.userId);
        }
        break;
    }
  }

  private async blockIP(ipAddress?: string): Promise<void> {
    if (!ipAddress) return;
    
    await prisma.blockedIP.create({
      data: {
        id: `blocked_ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ipAddress,
        reason: 'Security event',
        createdAt: new Date(),
      }
    });
  }

  private async requireVerification(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        requiresVerification: true,
        verificationRequired: new Date(),
      }
    });
  }

  private getDateFilter(timeRange: string) {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return { gte: startDate };
  }

  private async getQueueStats(siteId: string, dateFilter: any) {
    const [total, pending, inReview, escalated] = await Promise.all([
      prisma.moderationQueue.count({ where: { siteId } }),
      prisma.moderationQueue.count({ where: { siteId, status: 'pending' } }),
      prisma.moderationQueue.count({ where: { siteId, status: 'in_review' } }),
      prisma.moderationQueue.count({ where: { siteId, status: 'escalated' } }),
    ]);

    return {
      total,
      pending,
      inReview,
      escalated,
      avgProcessingTime: 2.5, // hours - would calculate from actual data
    };
  }

  private async getContentMetrics(siteId: string, dateFilter: any) {
    // Implementation for content metrics
    return {
      flaggedContent: 0,
      removedContent: 0,
      appealedActions: 0,
      falsePositives: 0,
      accuracy: 0.85,
    };
  }

  private async getUserMetrics(siteId: string, dateFilter: any) {
    // Implementation for user metrics
    return {
      suspendedUsers: 0,
      bannedUsers: 0,
      activeWarnings: 0,
      reportingUsers: 0,
    };
  }

  private async getSecurityMetrics(siteId: string, dateFilter: any) {
    // Implementation for security metrics
    return {
      suspiciousActivity: 0,
      blockedIPs: 0,
      botDetections: 0,
      rateLimit: 0,
    };
  }
}

export const moderationService = new ModerationService({
  enableAIModeration: true,
  enableRealTimeScanning: true,
  enableAutoActions: false,
  maxQueueSize: 10000,
  aiConfidenceThreshold: 0.85,
}); 