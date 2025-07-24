import { prisma } from '../../prisma';
import { incidentResponseService, Incident } from './incident-service';
import { z } from 'zod';

// Post-incident analysis configuration
const POST_INCIDENT_CONFIG = {
  // Review timelines by severity
  reviewTimelines: {
    P1_CRITICAL: { daysToSchedule: 1, daysToComplete: 3 },
    P2_HIGH: { daysToSchedule: 2, daysToComplete: 5 },
    P3_MEDIUM: { daysToSchedule: 5, daysToComplete: 10 },
    P4_LOW: { daysToSchedule: 10, daysToComplete: 15 },
  },

  // Review participants by role
  reviewParticipants: {
    required: ['incident-commander', 'security-analyst', 'system-admin'],
    optional: ['management', 'legal', 'compliance'],
    external: ['vendor-support', 'consultant'],
  },

  // Analysis frameworks
  analysisFrameworks: {
    ROOT_CAUSE: {
      name: '5 Whys Root Cause Analysis',
      questions: [
        'What happened?',
        'Why did it happen?',
        'Why was the system vulnerable?',
        'Why were controls insufficient?',
        'Why was detection delayed?',
      ],
    },
    TIMELINE: {
      name: 'Timeline Analysis',
      phases: ['Detection', 'Response', 'Containment', 'Eradication', 'Recovery', 'Lessons Learned'],
    },
    PROCESS: {
      name: 'Process Improvement',
      categories: ['People', 'Process', 'Technology', 'External Factors'],
    },
  },

  // Improvement categories
  improvementCategories: {
    PREVENTION: 'Prevent similar incidents from occurring',
    DETECTION: 'Improve detection speed and accuracy',
    RESPONSE: 'Enhance response procedures and coordination',
    RECOVERY: 'Accelerate recovery and restore operations',
    COMMUNICATION: 'Improve internal and external communication',
    TRAINING: 'Address knowledge and skill gaps',
    TECHNOLOGY: 'Implement technical controls and tools',
    PROCESS: 'Update policies and procedures',
  },

  // Metrics to track
  metricsToTrack: [
    'detection-time',
    'response-time',
    'containment-time',
    'recovery-time',
    'notification-time',
    'stakeholder-satisfaction',
    'process-effectiveness',
    'cost-impact',
  ],
} as const;

// Validation schemas
export const postIncidentReviewSchema = z.object({
  incidentId: z.string(),
  reviewType: z.enum(['PRELIMINARY', 'FULL', 'EXTENDED']),
  scheduledDate: z.date(),
  facilitator: z.string(),
  participants: z.array(z.object({
    userId: z.string(),
    role: z.string(),
    participation: z.enum(['REQUIRED', 'OPTIONAL', 'OBSERVER']),
  })),
  objectives: z.array(z.string()),
  framework: z.enum(['ROOT_CAUSE', 'TIMELINE', 'PROCESS', 'COMPREHENSIVE']),
});

export const lessonsLearnedSchema = z.object({
  incidentId: z.string(),
  category: z.enum(['PREVENTION', 'DETECTION', 'RESPONSE', 'RECOVERY', 'COMMUNICATION', 'TRAINING', 'TECHNOLOGY', 'PROCESS']),
  lesson: z.string(),
  impact: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  actionable: z.boolean(),
  recommendation: z.string(),
  implementationEffort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  timeframe: z.enum(['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']),
  owner: z.string(),
  cost: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
});

export const improvementActionSchema = z.object({
  incidentId: z.string(),
  lessonId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['PREVENTION', 'DETECTION', 'RESPONSE', 'RECOVERY', 'COMMUNICATION', 'TRAINING', 'TECHNOLOGY', 'PROCESS']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  owner: z.string(),
  dueDate: z.date(),
  estimatedEffort: z.number(), // hours
  estimatedCost: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
  successCriteria: z.array(z.string()),
  riskOfNotImplementing: z.string(),
});

// Interfaces
interface PostIncidentReview {
  id: string;
  incidentId: string;
  reviewType: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: Date;
  completedDate?: Date;
  facilitator: string;
  participants: Array<{
    userId: string;
    role: string;
    participation: string;
    attended?: boolean;
  }>;
  objectives: string[];
  framework: string;
  findings: PostIncidentFinding[];
  lessonsLearned: LessonLearned[];
  improvementActions: ImprovementAction[];
  metrics: PostIncidentMetrics;
  report: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PostIncidentFinding {
  id: string;
  reviewId: string;
  category: string;
  finding: string;
  evidence: string[];
  impact: string;
  rootCause?: string;
  contributingFactors: string[];
  recommendations: string[];
}

interface LessonLearned {
  id: string;
  incidentId: string;
  reviewId?: string;
  category: string;
  lesson: string;
  impact: string;
  actionable: boolean;
  recommendation: string;
  implementationEffort: string;
  timeframe: string;
  owner: string;
  cost?: number;
  dependencies: string[];
  status: 'IDENTIFIED' | 'APPROVED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'VERIFIED';
  createdAt: Date;
}

interface ImprovementAction {
  id: string;
  incidentId: string;
  lessonId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  owner: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED';
  dueDate: Date;
  completedDate?: Date;
  estimatedEffort: number;
  actualEffort?: number;
  estimatedCost?: number;
  actualCost?: number;
  dependencies: string[];
  successCriteria: string[];
  riskOfNotImplementing: string;
  progress: number; // 0-100
  updates: Array<{
    date: Date;
    update: string;
    updatedBy: string;
  }>;
  createdAt: Date;
}

interface PostIncidentMetrics {
  detectionTime: number; // minutes
  responseTime: number; // minutes
  containmentTime: number; // minutes
  recoveryTime: number; // minutes
  totalIncidentDuration: number; // minutes
  stakeholdersNotified: number;
  notificationTime: number; // minutes
  actionsCompleted: number;
  actionsPlanned: number;
  costImpact: number;
  reputationImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
  customersAffected: number;
  systemsAffected: number;
  dataCompromised: boolean;
  regulatoryReporting: boolean;
}

// Post-Incident Analysis Service
export class PostIncidentAnalysisService {
  private scheduledReviews: Map<string, PostIncidentReview> = new Map();
  private trackingActions: Map<string, ImprovementAction> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize post-incident analysis service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load scheduled reviews
      await this.loadScheduledReviews();

      // Load active improvement actions
      await this.loadActiveActions();

      // Start background processors
      this.startBackgroundProcessors();

      console.log('Post-Incident Analysis Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Post-Incident Analysis Service:', error);
    }
  }

  /**
   * Schedule post-incident review
   */
  async schedulePostIncidentReview(
    reviewData: z.infer<typeof postIncidentReviewSchema>
  ): Promise<PostIncidentReview> {
    try {
      const validatedData = postIncidentReviewSchema.parse(reviewData);

      // Create review record
      const review = await prisma.postIncidentReview.create({
        data: {
          incidentId: validatedData.incidentId,
          reviewType: validatedData.reviewType,
          status: 'SCHEDULED',
          scheduledDate: validatedData.scheduledDate,
          facilitator: validatedData.facilitator,
          participants: validatedData.participants,
          objectives: validatedData.objectives,
          framework: validatedData.framework,
          metrics: {},
          findings: [],
          lessonsLearned: [],
          improvementActions: [],
        },
      });

      const reviewObj: PostIncidentReview = {
        id: review.id,
        incidentId: review.incidentId,
        reviewType: review.reviewType,
        status: review.status as any,
        scheduledDate: review.scheduledDate,
        facilitator: review.facilitator,
        participants: review.participants as any,
        objectives: review.objectives as string[],
        framework: review.framework,
        findings: [],
        lessonsLearned: [],
        improvementActions: [],
        metrics: {} as PostIncidentMetrics,
        report: '',
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };

      this.scheduledReviews.set(review.id, reviewObj);

      // Send calendar invitations to participants
      await this.sendReviewInvitations(reviewObj);

      // Create reminder tasks
      await this.scheduleReviewReminders(reviewObj);

      return reviewObj;

    } catch (error) {
      console.error('Failed to schedule post-incident review:', error);
      throw new Error(`Review scheduling failed: ${error.message}`);
    }
  }

  /**
   * Conduct post-incident review
   */
  async conductPostIncidentReview(
    reviewId: string,
    conductedBy: string
  ): Promise<{
    findings: PostIncidentFinding[];
    lessonsLearned: LessonLearned[];
    recommendations: string[];
    metrics: PostIncidentMetrics;
  }> {
    try {
      const review = this.scheduledReviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Update review status
      review.status = 'IN_PROGRESS';
      await this.updateReviewStatus(reviewId, 'IN_PROGRESS');

      // Get incident details
      const incident = await incidentResponseService.getIncident(review.incidentId);
      if (!incident) {
        throw new Error('Associated incident not found');
      }

      // Calculate incident metrics
      const metrics = await this.calculateIncidentMetrics(incident);

      // Perform analysis based on framework
      const analysis = await this.performAnalysis(incident, review.framework);

      // Identify lessons learned
      const lessonsLearned = await this.identifyLessonsLearned(incident, analysis);

      // Generate improvement recommendations
      const recommendations = await this.generateRecommendations(analysis, lessonsLearned);

      // Update review with results
      review.findings = analysis.findings;
      review.lessonsLearned = lessonsLearned;
      review.metrics = metrics;
      review.status = 'COMPLETED';
      review.completedDate = new Date();

      // Store results
      await this.storeReviewResults(review);

      // Generate and distribute report
      await this.generatePostIncidentReport(review);

      return {
        findings: analysis.findings,
        lessonsLearned,
        recommendations,
        metrics,
      };

    } catch (error) {
      console.error('Failed to conduct post-incident review:', error);
      throw new Error(`Review conduction failed: ${error.message}`);
    }
  }

  /**
   * Create lesson learned entry
   */
  async createLessonLearned(
    lessonData: z.infer<typeof lessonsLearnedSchema>
  ): Promise<LessonLearned> {
    try {
      const validatedData = lessonsLearnedSchema.parse(lessonData);

      const lesson = await prisma.lessonLearned.create({
        data: {
          incidentId: validatedData.incidentId,
          category: validatedData.category,
          lesson: validatedData.lesson,
          impact: validatedData.impact,
          actionable: validatedData.actionable,
          recommendation: validatedData.recommendation,
          implementationEffort: validatedData.implementationEffort,
          timeframe: validatedData.timeframe,
          owner: validatedData.owner,
          cost: validatedData.cost,
          dependencies: validatedData.dependencies || [],
          status: 'IDENTIFIED',
        },
      });

      const lessonObj: LessonLearned = {
        id: lesson.id,
        incidentId: lesson.incidentId,
        category: lesson.category,
        lesson: lesson.lesson,
        impact: lesson.impact,
        actionable: lesson.actionable,
        recommendation: lesson.recommendation,
        implementationEffort: lesson.implementationEffort,
        timeframe: lesson.timeframe,
        owner: lesson.owner,
        cost: lesson.cost || undefined,
        dependencies: lesson.dependencies as string[],
        status: lesson.status as any,
        createdAt: lesson.createdAt,
      };

      // If actionable, create improvement action
      if (validatedData.actionable) {
        await this.createImprovementAction({
          incidentId: validatedData.incidentId,
          lessonId: lesson.id,
          title: `Implement: ${validatedData.lesson}`,
          description: validatedData.recommendation,
          category: validatedData.category,
          priority: validatedData.impact as any,
          owner: validatedData.owner,
          dueDate: this.calculateDueDate(validatedData.timeframe),
          estimatedEffort: this.estimateEffortHours(validatedData.implementationEffort),
          estimatedCost: validatedData.cost,
          dependencies: validatedData.dependencies || [],
          successCriteria: [validatedData.recommendation],
          riskOfNotImplementing: `May lead to similar incidents in the future`,
        });
      }

      return lessonObj;

    } catch (error) {
      console.error('Failed to create lesson learned:', error);
      throw new Error(`Lesson learned creation failed: ${error.message}`);
    }
  }

  /**
   * Create improvement action
   */
  async createImprovementAction(
    actionData: z.infer<typeof improvementActionSchema>
  ): Promise<ImprovementAction> {
    try {
      const validatedData = improvementActionSchema.parse(actionData);

      const action = await prisma.improvementAction.create({
        data: {
          incidentId: validatedData.incidentId,
          lessonId: validatedData.lessonId,
          title: validatedData.title,
          description: validatedData.description,
          category: validatedData.category,
          priority: validatedData.priority,
          owner: validatedData.owner,
          status: 'PLANNED',
          dueDate: validatedData.dueDate,
          estimatedEffort: validatedData.estimatedEffort,
          estimatedCost: validatedData.estimatedCost,
          dependencies: validatedData.dependencies || [],
          successCriteria: validatedData.successCriteria,
          riskOfNotImplementing: validatedData.riskOfNotImplementing,
          progress: 0,
          updates: [],
        },
      });

      const actionObj: ImprovementAction = {
        id: action.id,
        incidentId: action.incidentId,
        lessonId: action.lessonId,
        title: action.title,
        description: action.description,
        category: action.category,
        priority: action.priority,
        owner: action.owner,
        status: action.status as any,
        dueDate: action.dueDate,
        estimatedEffort: action.estimatedEffort,
        estimatedCost: action.estimatedCost || undefined,
        dependencies: action.dependencies as string[],
        successCriteria: action.successCriteria as string[],
        riskOfNotImplementing: action.riskOfNotImplementing,
        progress: action.progress,
        updates: [],
        createdAt: action.createdAt,
      };

      this.trackingActions.set(action.id, actionObj);

      // Schedule progress tracking
      await this.scheduleActionTracking(actionObj);

      return actionObj;

    } catch (error) {
      console.error('Failed to create improvement action:', error);
      throw new Error(`Improvement action creation failed: ${error.message}`);
    }
  }

  /**
   * Update improvement action progress
   */
  async updateImprovementAction(
    actionId: string,
    update: {
      status?: string;
      progress?: number;
      update?: string;
      actualEffort?: number;
      actualCost?: number;
      completedDate?: Date;
    },
    updatedBy: string
  ): Promise<ImprovementAction> {
    try {
      const action = this.trackingActions.get(actionId);
      if (!action) {
        throw new Error('Improvement action not found');
      }

      const updateFields: any = { updatedAt: new Date() };

      if (update.status) {
        updateFields.status = update.status;
        action.status = update.status as any;
      }

      if (update.progress !== undefined) {
        updateFields.progress = update.progress;
        action.progress = update.progress;
      }

      if (update.actualEffort !== undefined) {
        updateFields.actualEffort = update.actualEffort;
        action.actualEffort = update.actualEffort;
      }

      if (update.actualCost !== undefined) {
        updateFields.actualCost = update.actualCost;
        action.actualCost = update.actualCost;
      }

      if (update.completedDate) {
        updateFields.completedDate = update.completedDate;
        action.completedDate = update.completedDate;
      }

      // Add update to history
      if (update.update) {
        const newUpdate = {
          date: new Date(),
          update: update.update,
          updatedBy,
        };

        action.updates.push(newUpdate);
        updateFields.updates = action.updates;
      }

      // Update database
      await prisma.improvementAction.update({
        where: { id: actionId },
        data: updateFields,
      });

      // Check if action is completed
      if (update.status === 'COMPLETED') {
        await this.verifyActionCompletion(action);
      }

      return action;

    } catch (error) {
      console.error('Failed to update improvement action:', error);
      throw new Error(`Action update failed: ${error.message}`);
    }
  }

  /**
   * Get improvement actions dashboard
   */
  async getImprovementActionsDashboard(filters?: {
    status?: string;
    priority?: string;
    owner?: string;
    category?: string;
    dueDate?: { start: Date; end: Date };
  }): Promise<{
    actions: ImprovementAction[];
    statistics: {
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
      byCategory: Record<string, number>;
      overdue: number;
      dueSoon: number;
    };
  }> {
    try {
      const whereClause: any = {};

      if (filters?.status) whereClause.status = filters.status;
      if (filters?.priority) whereClause.priority = filters.priority;
      if (filters?.owner) whereClause.owner = filters.owner;
      if (filters?.category) whereClause.category = filters.category;

      if (filters?.dueDate) {
        whereClause.dueDate = {
          gte: filters.dueDate.start,
          lte: filters.dueDate.end,
        };
      }

      const actions = await prisma.improvementAction.findMany({
        where: whereClause,
        orderBy: { dueDate: 'asc' },
      });

      const actionObjects = actions.map(this.mapPrismaActionToAction.bind(this));

      // Calculate statistics
      const statistics = {
        total: actions.length,
        byStatus: this.groupByField(actions, 'status'),
        byPriority: this.groupByField(actions, 'priority'),
        byCategory: this.groupByField(actions, 'category'),
        overdue: actions.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'COMPLETED').length,
        dueSoon: actions.filter(a => {
          const daysDiff = (new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7 && daysDiff > 0 && a.status !== 'COMPLETED';
        }).length,
      };

      return {
        actions: actionObjects,
        statistics,
      };

    } catch (error) {
      console.error('Failed to get improvement actions dashboard:', error);
      throw new Error(`Dashboard retrieval failed: ${error.message}`);
    }
  }

  /**
   * Generate lessons learned report
   */
  async generateLessonsLearnedReport(
    filters?: {
      timeRange?: { start: Date; end: Date };
      category?: string;
      impact?: string;
    }
  ): Promise<{
    summary: {
      totalLessons: number;
      byCategory: Record<string, number>;
      byImpact: Record<string, number>;
      implementationRate: number;
    };
    topLessons: LessonLearned[];
    trends: Array<{
      period: string;
      lessonsIdentified: number;
      lessonsImplemented: number;
    }>;
    recommendations: string[];
  }> {
    try {
      const whereClause: any = {};

      if (filters?.timeRange) {
        whereClause.createdAt = {
          gte: filters.timeRange.start,
          lte: filters.timeRange.end,
        };
      }

      if (filters?.category) whereClause.category = filters.category;
      if (filters?.impact) whereClause.impact = filters.impact;

      const lessons = await prisma.lessonLearned.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      const lessonsObjects = lessons.map(this.mapPrismaLessonToLesson.bind(this));

      // Calculate summary
      const implementedCount = lessons.filter(l => l.status === 'IMPLEMENTED').length;
      const summary = {
        totalLessons: lessons.length,
        byCategory: this.groupByField(lessons, 'category'),
        byImpact: this.groupByField(lessons, 'impact'),
        implementationRate: lessons.length > 0 ? (implementedCount / lessons.length) * 100 : 0,
      };

      // Get top lessons by impact
      const topLessons = lessonsObjects
        .filter(l => l.impact === 'CRITICAL' || l.impact === 'HIGH')
        .slice(0, 10);

      // Calculate trends (monthly data for last 12 months)
      const trends = await this.calculateLessonsLearnedTrends();

      // Generate recommendations
      const recommendations = await this.generateLessonsLearnedRecommendations(lessonsObjects);

      return {
        summary,
        topLessons,
        trends,
        recommendations,
      };

    } catch (error) {
      console.error('Failed to generate lessons learned report:', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  // Helper methods (private)

  private async loadScheduledReviews(): Promise<void> {
    const reviews = await prisma.postIncidentReview.findMany({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    });

    for (const review of reviews) {
      const reviewObj = this.mapPrismaReviewToReview(review);
      this.scheduledReviews.set(review.id, reviewObj);
    }
  }

  private async loadActiveActions(): Promise<void> {
    const actions = await prisma.improvementAction.findMany({
      where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
    });

    for (const action of actions) {
      const actionObj = this.mapPrismaActionToAction(action);
      this.trackingActions.set(action.id, actionObj);
    }
  }

  private startBackgroundProcessors(): void {
    // Check for overdue reviews daily
    setInterval(async () => {
      await this.checkOverdueReviews();
    }, 24 * 60 * 60 * 1000);

    // Check for overdue actions daily
    setInterval(async () => {
      await this.checkOverdueActions();
    }, 24 * 60 * 60 * 1000);

    // Send weekly status reports
    setInterval(async () => {
      await this.sendWeeklyStatusReports();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  private async calculateIncidentMetrics(incident: Incident): Promise<PostIncidentMetrics> {
    const detectionTime = incident.timeline.find(t => t.action === 'INCIDENT_CREATED')?.timestamp || incident.createdAt;
    const responseTime = incident.acknowledgedAt || incident.createdAt;
    const recoveryTime = incident.resolvedAt || new Date();

    return {
      detectionTime: 0, // Would be calculated from first indicator to detection
      responseTime: incident.responseTime || 0,
      containmentTime: 0, // Would be calculated from response to containment
      recoveryTime: incident.resolutionTime || 0,
      totalIncidentDuration: incident.resolutionTime || 0,
      stakeholdersNotified: incident.communications.length,
      notificationTime: 0, // Would be calculated
      actionsCompleted: incident.actions.filter(a => a.status === 'COMPLETED').length,
      actionsPlanned: incident.actions.length,
      costImpact: 0, // Would be calculated
      reputationImpact: 'LOW',
      customersAffected: 0, // Would be determined from incident details
      systemsAffected: incident.affectedSystems.length,
      dataCompromised: incident.category === 'DATA_LEAK',
      regulatoryReporting: ['DATA_LEAK', 'SECURITY_BREACH'].includes(incident.category),
    };
  }

  private async performAnalysis(incident: Incident, framework: string): Promise<{ findings: PostIncidentFinding[] }> {
    const findings: PostIncidentFinding[] = [];

    // Timeline analysis
    findings.push({
      id: crypto.randomUUID(),
      reviewId: '',
      category: 'TIMELINE',
      finding: 'Incident timeline analysis completed',
      evidence: incident.timeline.map(t => `${t.timestamp}: ${t.description}`),
      impact: 'MEDIUM',
      contributingFactors: [],
      recommendations: ['Improve incident documentation', 'Enhance timeline tracking'],
    });

    // Process analysis
    findings.push({
      id: crypto.randomUUID(),
      reviewId: '',
      category: 'PROCESS',
      finding: 'Response process effectiveness analysis',
      evidence: [`${incident.actions.length} actions taken`, `${incident.communications.length} communications sent`],
      impact: 'MEDIUM',
      contributingFactors: [],
      recommendations: ['Review response procedures', 'Update communication protocols'],
    });

    return { findings };
  }

  private async identifyLessonsLearned(incident: Incident, analysis: any): Promise<LessonLearned[]> {
    const lessons: LessonLearned[] = [];

    // Automatic lesson identification based on incident characteristics
    if (incident.responseTime && incident.responseTime > 30) {
      lessons.push({
        id: crypto.randomUUID(),
        incidentId: incident.id,
        category: 'DETECTION',
        lesson: 'Response time exceeded target threshold',
        impact: 'MEDIUM',
        actionable: true,
        recommendation: 'Implement automated alerting for faster response',
        implementationEffort: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        owner: 'security-team',
        dependencies: [],
        status: 'IDENTIFIED',
        createdAt: new Date(),
      });
    }

    if (incident.category === 'SECURITY_BREACH') {
      lessons.push({
        id: crypto.randomUUID(),
        incidentId: incident.id,
        category: 'PREVENTION',
        lesson: 'Security controls were insufficient to prevent breach',
        impact: 'HIGH',
        actionable: true,
        recommendation: 'Conduct security control assessment and enhancement',
        implementationEffort: 'HIGH',
        timeframe: 'MEDIUM_TERM',
        owner: 'security-team',
        dependencies: [],
        status: 'IDENTIFIED',
        createdAt: new Date(),
      });
    }

    return lessons;
  }

  private async generateRecommendations(analysis: any, lessonsLearned: LessonLearned[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Generate recommendations based on findings and lessons
    recommendations.push('Conduct regular incident response drills');
    recommendations.push('Update incident response procedures based on lessons learned');
    recommendations.push('Implement automated detection and response capabilities');
    recommendations.push('Enhance stakeholder communication processes');
    recommendations.push('Improve evidence collection and forensic capabilities');

    return recommendations;
  }

  private calculateDueDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'IMMEDIATE': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
      case 'SHORT_TERM': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
      case 'MEDIUM_TERM': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months
      case 'LONG_TERM': return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  private estimateEffortHours(effort: string): number {
    switch (effort) {
      case 'LOW': return 8; // 1 day
      case 'MEDIUM': return 40; // 1 week
      case 'HIGH': return 160; // 1 month
      default: return 40;
    }
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  // Additional helper methods would continue here...
  private async sendReviewInvitations(review: PostIncidentReview): Promise<void> { /* Implementation */ }
  private async scheduleReviewReminders(review: PostIncidentReview): Promise<void> { /* Implementation */ }
  private async updateReviewStatus(reviewId: string, status: string): Promise<void> { /* Implementation */ }
  private async storeReviewResults(review: PostIncidentReview): Promise<void> { /* Implementation */ }
  private async generatePostIncidentReport(review: PostIncidentReview): Promise<void> { /* Implementation */ }
  private async scheduleActionTracking(action: ImprovementAction): Promise<void> { /* Implementation */ }
  private async verifyActionCompletion(action: ImprovementAction): Promise<void> { /* Implementation */ }
  private async checkOverdueReviews(): Promise<void> { /* Implementation */ }
  private async checkOverdueActions(): Promise<void> { /* Implementation */ }
  private async sendWeeklyStatusReports(): Promise<void> { /* Implementation */ }
  private async calculateLessonsLearnedTrends(): Promise<any[]> { return []; }
  private async generateLessonsLearnedRecommendations(lessons: LessonLearned[]): Promise<string[]> { return []; }
  
  private mapPrismaReviewToReview(review: any): PostIncidentReview { return {} as PostIncidentReview; }
  private mapPrismaActionToAction(action: any): ImprovementAction { return {} as ImprovementAction; }
  private mapPrismaLessonToLesson(lesson: any): LessonLearned { return {} as LessonLearned; }
}

// Export singleton instance
export const postIncidentAnalysisService = new PostIncidentAnalysisService();

// Export types
export type {
  PostIncidentReview,
  PostIncidentFinding,
  LessonLearned,
  ImprovementAction,
  PostIncidentMetrics,
}; 