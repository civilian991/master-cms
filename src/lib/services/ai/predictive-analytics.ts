import { prisma } from '@/lib/prisma';
import { AIServiceManager } from './manager';
import { z } from 'zod';

// Validation schemas
export const userBehaviorEventSchema = z.object({
  siteId: z.number().int().positive(),
  userId: z.string().optional(),
  sessionId: z.string(),
  deviceId: z.string().optional(),
  eventType: z.string(),
  eventCategory: z.string(),
  eventAction: z.string(),
  eventLabel: z.string().optional(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  referrerUrl: z.string().optional(),
  contentId: z.string().optional(),
  contentType: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.record(z.any()).optional(),
  deviceInfo: z.record(z.any()).optional(),
  timeOnPage: z.number().optional(),
  scrollDepth: z.number().optional(),
  interactionCount: z.number().default(0),
  properties: z.record(z.any()),
  consentGiven: z.boolean().default(false),
  dataRetention: z.date().optional(),
});

export const userProfileSchema = z.object({
  userId: z.string(),
  siteId: z.number().int().positive(),
  age: z.number().optional(),
  gender: z.string().optional(),
  location: z.record(z.any()).optional(),
  language: z.string().default('en'),
  timezone: z.string().optional(),
  interests: z.record(z.any()),
  contentPreferences: z.record(z.any()),
  readingLevel: z.string().optional(),
  topicsOfInterest: z.record(z.any()),
  activityLevel: z.string().default('medium'),
  preferredTime: z.record(z.any()).optional(),
  devicePreference: z.record(z.any()).optional(),
  personalizationEnabled: z.boolean().default(true),
  recommendationSettings: z.record(z.any()),
  privacySettings: z.record(z.any()),
});

export const mlModelSchema = z.object({
  siteId: z.number().int().positive(),
  modelName: z.string(),
  modelType: z.string(),
  modelVersion: z.string(),
  modelDescription: z.string().optional(),
  algorithm: z.string(),
  hyperparameters: z.record(z.any()),
  featureColumns: z.record(z.any()),
  targetColumn: z.string(),
  trainingDataSize: z.number().int().positive(),
  trainingAccuracy: z.number().min(0).max(1),
  validationAccuracy: z.number().min(0).max(1),
  testAccuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1).optional(),
  recall: z.number().min(0).max(1).optional(),
  f1Score: z.number().min(0).max(1).optional(),
  auc: z.number().min(0).max(1).optional(),
  modelPath: z.string(),
  modelSize: z.number().optional(),
  modelHash: z.string().optional(),
  status: z.string().default('training'),
  isActive: z.boolean().default(false),
  deployedAt: z.date().optional(),
});

export const userPredictionSchema = z.object({
  userId: z.string(),
  siteId: z.number().int().positive(),
  modelId: z.number().int().positive(),
  predictionType: z.string(),
  predictionValue: z.number(),
  predictionConfidence: z.number().min(0).max(1),
  predictionClass: z.string().optional(),
  inputFeatures: z.record(z.any()),
  featureImportance: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  triggerEvent: z.string().optional(),
  actualValue: z.number().optional(),
  actualClass: z.string().optional(),
  isCorrect: z.boolean().optional(),
  usedInPersonalization: z.boolean().default(false),
  usedInRecommendation: z.boolean().default(false),
  usedInOptimization: z.boolean().default(false),
});

export const contentRecommendationSchema = z.object({
  userId: z.string(),
  siteId: z.number().int().positive(),
  contentId: z.string(),
  contentType: z.string(),
  recommendationType: z.string(),
  recommendationScore: z.number().min(0).max(1),
  algorithm: z.string(),
  modelVersion: z.string().optional(),
  features: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  triggerEvent: z.string().optional(),
  isShown: z.boolean().default(false),
  isClicked: z.boolean().default(false),
  isEngaged: z.boolean().default(false),
  timeSpent: z.number().optional(),
  clickThroughRate: z.number().optional(),
  engagementRate: z.number().optional(),
  expiresAt: z.date().optional(),
  isExpired: z.boolean().default(false),
});

export const abTestSchema = z.object({
  siteId: z.number().int().positive(),
  testName: z.string(),
  testDescription: z.string().optional(),
  testType: z.string(),
  testHypothesis: z.string().optional(),
  variants: z.record(z.any()),
  controlVariant: z.string(),
  treatmentVariants: z.record(z.any()),
  trafficAllocation: z.record(z.any()),
  targetAudience: z.record(z.any()).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(false),
  isPaused: z.boolean().default(false),
  primaryMetric: z.string(),
  secondaryMetrics: z.record(z.any()),
  conversionGoals: z.record(z.any()),
  significanceLevel: z.number().min(0).max(1).default(0.05),
  statisticalPower: z.number().min(0).max(1).default(0.8),
  minimumSampleSize: z.number().int().positive().default(1000),
  currentSampleSize: z.number().int().default(0),
  statisticalSignificance: z.boolean().default(false),
  winner: z.string().optional(),
  confidenceLevel: z.number().optional(),
  totalConversions: z.number().int().default(0),
  totalRevenue: z.number().default(0),
  averageOrderValue: z.number().default(0),
});

export const personalizationRuleSchema = z.object({
  siteId: z.number().int().positive(),
  ruleName: z.string(),
  ruleDescription: z.string().optional(),
  ruleType: z.string(),
  ruleCategory: z.string(),
  conditions: z.record(z.any()),
  targetAudience: z.record(z.any()).optional(),
  contentFilters: z.record(z.any()).optional(),
  actions: z.record(z.any()),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isEnabled: z.boolean().default(true),
  matchCount: z.number().int().default(0),
  actionCount: z.number().int().default(0),
  successRate: z.number().default(0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  schedule: z.record(z.any()).optional(),
});

export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private aiManager: AIServiceManager;

  private constructor() {
    this.aiManager = AIServiceManager.getInstance();
  }

  static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  // User Behavior Tracking
  async trackUserBehavior(data: z.infer<typeof userBehaviorEventSchema>) {
    const validatedData = userBehaviorEventSchema.parse(data);
    
    // Add privacy compliance checks
    if (!validatedData.consentGiven) {
      // Anonymize data for users without consent
      validatedData.userId = undefined;
      validatedData.ipAddress = undefined;
      validatedData.userAgent = undefined;
      validatedData.location = undefined;
    }

    // Set data retention if not provided
    if (!validatedData.dataRetention) {
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + 2); // 2 years retention
      validatedData.dataRetention = retentionDate;
    }

    const event = await prisma.userBehaviorEvent.create({
      data: validatedData,
      include: {
        site: true,
        user: true,
      },
    });

    // Trigger real-time analytics updates
    await this.updateRealTimeAnalytics(event);

    return event;
  }

  async getUserBehaviorEvents(siteId: number, filters?: {
    userId?: string;
    eventType?: string;
    contentType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = { siteId };
    
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.contentType) where.contentType = filters.contentType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) where.createdAt.gte = filters.startDate;
      if (filters?.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.userBehaviorEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      include: {
        site: true,
        user: true,
      },
    });
  }

  // User Profile Management
  async createUserProfile(data: z.infer<typeof userProfileSchema>) {
    const validatedData = userProfileSchema.parse(data);
    
    return await prisma.userProfile.create({
      data: validatedData,
      include: {
        user: true,
        site: true,
      },
    });
  }

  async getUserProfile(userId: string, siteId: number) {
    return await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        site: true,
      },
    });
  }

  async updateUserProfile(userId: string, data: Partial<z.infer<typeof userProfileSchema>>) {
    return await prisma.userProfile.update({
      where: { userId },
      data,
      include: {
        user: true,
        site: true,
      },
    });
  }

  // ML Model Management
  async createMLModel(data: z.infer<typeof mlModelSchema>) {
    const validatedData = mlModelSchema.parse(data);
    
    return await prisma.mLModel.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getMLModels(siteId: number, modelType?: string, status?: string) {
    const where: any = { siteId };
    if (modelType) where.modelType = modelType;
    if (status) where.status = status;
    
    return await prisma.mLModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        site: true,
      },
    });
  }

  async getActiveMLModel(siteId: number, modelName: string) {
    return await prisma.mLModel.findFirst({
      where: {
        siteId,
        modelName,
        isActive: true,
        status: 'active',
      },
      include: {
        site: true,
      },
    });
  }

  async updateMLModel(id: number, data: Partial<z.infer<typeof mlModelSchema>>) {
    return await prisma.mLModel.update({
      where: { id },
      data,
      include: {
        site: true,
      },
    });
  }

  // User Predictions
  async createUserPrediction(data: z.infer<typeof userPredictionSchema>) {
    const validatedData = userPredictionSchema.parse(data);
    
    const prediction = await prisma.userPrediction.create({
      data: validatedData,
      include: {
        user: true,
        site: true,
        model: true,
      },
    });

    // Update model performance metrics
    await this.updateModelPerformance(prediction.modelId);

    return prediction;
  }

  async getUserPredictions(userId: string, siteId: number, predictionType?: string) {
    const where: any = { userId, siteId };
    if (predictionType) where.predictionType = predictionType;
    
    return await prisma.userPrediction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
      },
    });
  }

  async getLatestPrediction(userId: string, siteId: number, predictionType: string) {
    return await prisma.userPrediction.findFirst({
      where: {
        userId,
        siteId,
        predictionType,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
      },
    });
  }

  // Content Recommendations
  async createContentRecommendation(data: z.infer<typeof contentRecommendationSchema>) {
    const validatedData = contentRecommendationSchema.parse(data);
    
    return await prisma.contentRecommendation.create({
      data: validatedData,
      include: {
        user: true,
        site: true,
      },
    });
  }

  async getContentRecommendations(userId: string, siteId: number, limit: number = 10) {
    return await prisma.contentRecommendation.findMany({
      where: {
        userId,
        siteId,
        isExpired: false,
      },
      orderBy: { recommendationScore: 'desc' },
      take: limit,
      include: {
        user: true,
        site: true,
      },
    });
  }

  async updateRecommendationInteraction(recommendationId: number, interaction: {
    isShown?: boolean;
    isClicked?: boolean;
    isEngaged?: boolean;
    timeSpent?: number;
  }) {
    const updateData: any = { ...interaction };
    
    if (interaction.isShown) updateData.shownAt = new Date();
    if (interaction.isClicked) updateData.clickedAt = new Date();
    
    return await prisma.contentRecommendation.update({
      where: { id: recommendationId },
      data: updateData,
      include: {
        user: true,
        site: true,
      },
    });
  }

  // A/B Testing
  async createABTest(data: z.infer<typeof abTestSchema>) {
    const validatedData = abTestSchema.parse(data);
    
    return await prisma.aBTest.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getABTests(siteId: number, status?: string) {
    const where: any = { siteId };
    if (status) where.status = status;
    
    return await prisma.aBTest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        site: true,
        abTestAssignments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async assignUserToABTest(testId: number, userId: string, siteId: number) {
    // Check if user is already assigned
    const existingAssignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_userId: {
          testId,
          userId,
        },
      },
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    // Get test configuration
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
    });

    if (!test || !test.isActive) {
      throw new Error('Test not found or not active');
    }

    // Determine variant assignment
    const variant = this.assignVariant(test.variants, test.trafficAllocation, userId);

    // Create assignment
    const assignment = await prisma.aBTestAssignment.create({
      data: {
        testId,
        userId,
        siteId,
        assignedVariant: variant,
        assignmentMethod: 'user_id_hash',
        assignmentHash: this.generateAssignmentHash(userId, testId),
      },
      include: {
        test: true,
        user: true,
        site: true,
      },
    });

    return assignment;
  }

  async recordABTestInteraction(testId: number, userId: string, interaction: {
    eventType: string;
    eventData: any;
    conversion?: boolean;
    revenue?: number;
  }) {
    const assignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_userId: {
          testId,
          userId,
        },
      },
    });

    if (!assignment) {
      throw new Error('User not assigned to test');
    }

    // Update assignment with interaction
    const updateData: any = {
      isExposed: true,
      lastExposureAt: new Date(),
      exposureCount: { increment: 1 },
      interactions: {
        push: {
          timestamp: new Date(),
          eventType: interaction.eventType,
          eventData: interaction.eventData,
        },
      },
    };

    if (interaction.conversion) {
      updateData.conversions = {
        push: {
          timestamp: new Date(),
          eventType: interaction.eventType,
          eventData: interaction.eventData,
        },
      };
      updateData.revenue = { increment: interaction.revenue || 0 };
    }

    return await prisma.aBTestAssignment.update({
      where: { id: assignment.id },
      data: updateData,
      include: {
        test: true,
        user: true,
        site: true,
      },
    });
  }

  // Personalization Rules
  async createPersonalizationRule(data: z.infer<typeof personalizationRuleSchema>) {
    const validatedData = personalizationRuleSchema.parse(data);
    
    return await prisma.personalizationRule.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getPersonalizationRules(siteId: number, ruleType?: string, isActive?: boolean) {
    const where: any = { siteId };
    if (ruleType) where.ruleType = ruleType;
    if (isActive !== undefined) where.isActive = isActive;
    
    return await prisma.personalizationRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        site: true,
      },
    });
  }

  async evaluatePersonalizationRules(userId: string, siteId: number, context: any) {
    const rules = await this.getPersonalizationRules(siteId, undefined, true);
    const userProfile = await this.getUserProfile(userId, siteId);
    
    const matchedRules = [];
    
    for (const rule of rules) {
      if (this.evaluateRuleConditions(rule.conditions, userProfile, context)) {
        matchedRules.push({
          rule,
          priority: rule.priority,
          actions: rule.actions,
        });
      }
    }
    
    // Sort by priority and return top matches
    return matchedRules
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5); // Return top 5 matches
  }

  // Analytics and Insights
  async getAnalyticsInsights(siteId: number, timeRange: {
    startDate: Date;
    endDate: Date;
  }) {
    const [
      totalEvents,
      uniqueUsers,
      topContent,
      userEngagement,
      conversionRates,
    ] = await Promise.all([
      this.getTotalEvents(siteId, timeRange),
      this.getUniqueUsers(siteId, timeRange),
      this.getTopContent(siteId, timeRange),
      this.getUserEngagement(siteId, timeRange),
      this.getConversionRates(siteId, timeRange),
    ]);

    return {
      totalEvents,
      uniqueUsers,
      topContent,
      userEngagement,
      conversionRates,
      insights: await this.generateInsights({
        totalEvents,
        uniqueUsers,
        topContent,
        userEngagement,
        conversionRates,
      }),
    };
  }

  // Private helper methods
  private async updateRealTimeAnalytics(event: any) {
    // Update real-time analytics counters
    // This would typically involve Redis or similar for real-time updates
    console.log('Updating real-time analytics for event:', event.id);
  }

  private async updateModelPerformance(modelId: number) {
    const predictions = await prisma.userPrediction.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    if (predictions.length === 0) return;

    const recentPredictions = predictions.slice(0, 100);
    const validatedPredictions = recentPredictions.filter(p => p.isCorrect !== null);

    if (validatedPredictions.length === 0) return;

    const accuracy = validatedPredictions.filter(p => p.isCorrect).length / validatedPredictions.length;
    const averageResponseTime = recentPredictions.reduce((sum, p) => sum + (p.predictionValue || 0), 0) / recentPredictions.length;

    await prisma.mLModel.update({
      where: { id: modelId },
      data: {
        testAccuracy: accuracy,
        averageResponseTime,
        lastPrediction: new Date(),
        totalPredictions: { increment: 1 },
      },
    });
  }

  private assignVariant(variants: any, trafficAllocation: any, userId: string): string {
    // Simple hash-based assignment for consistency
    const hash = this.generateAssignmentHash(userId, 0);
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const normalizedValue = (hashValue % 100) / 100;

    let cumulative = 0;
    for (const [variant, allocation] of Object.entries(trafficAllocation)) {
      cumulative += allocation as number;
      if (normalizedValue <= cumulative) {
        return variant;
      }
    }

    return Object.keys(variants)[0]; // Fallback to first variant
  }

  private generateAssignmentHash(userId: string, testId: number): string {
    const combined = `${userId}-${testId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private evaluateRuleConditions(conditions: any, userProfile: any, context: any): boolean {
    // Simple rule evaluation logic
    // In a real implementation, this would be more sophisticated
    return true; // Placeholder
  }

  private async getTotalEvents(siteId: number, timeRange: { startDate: Date; endDate: Date }) {
    return await prisma.userBehaviorEvent.count({
      where: {
        siteId,
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    });
  }

  private async getUniqueUsers(siteId: number, timeRange: { startDate: Date; endDate: Date }) {
    const events = await prisma.userBehaviorEvent.findMany({
      where: {
        siteId,
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      select: { userId: true },
    });

    const uniqueUserIds = new Set(events.map(e => e.userId).filter(Boolean));
    return uniqueUserIds.size;
  }

  private async getTopContent(siteId: number, timeRange: { startDate: Date; endDate: Date }) {
    const events = await prisma.userBehaviorEvent.groupBy({
      by: ['contentId'],
      where: {
        siteId,
        contentId: { not: null },
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      _count: { contentId: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: 10,
    });

    return events.map(e => ({
      contentId: e.contentId,
      viewCount: e._count.contentId,
    }));
  }

  private async getUserEngagement(siteId: number, timeRange: { startDate: Date; endDate: Date }) {
    const events = await prisma.userBehaviorEvent.findMany({
      where: {
        siteId,
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      select: {
        timeOnPage: true,
        scrollDepth: true,
        interactionCount: true,
      },
    });

    const validEvents = events.filter(e => e.timeOnPage || e.scrollDepth || e.interactionCount);
    
    if (validEvents.length === 0) return { averageTimeOnPage: 0, averageScrollDepth: 0, averageInteractions: 0 };

    return {
      averageTimeOnPage: validEvents.reduce((sum, e) => sum + (e.timeOnPage || 0), 0) / validEvents.length,
      averageScrollDepth: validEvents.reduce((sum, e) => sum + (e.scrollDepth || 0), 0) / validEvents.length,
      averageInteractions: validEvents.reduce((sum, e) => sum + (e.interactionCount || 0), 0) / validEvents.length,
    };
  }

  private async getConversionRates(siteId: number, timeRange: { startDate: Date; endDate: Date }) {
    const totalEvents = await prisma.userBehaviorEvent.count({
      where: {
        siteId,
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    });

    const conversionEvents = await prisma.userBehaviorEvent.count({
      where: {
        siteId,
        eventCategory: 'conversion',
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    });

    return {
      totalEvents,
      conversionEvents,
      conversionRate: totalEvents > 0 ? conversionEvents / totalEvents : 0,
    };
  }

  private async generateInsights(data: any) {
    // Generate AI-powered insights using the AI service
    const prompt = `Analyze the following analytics data and provide actionable insights:
    
    Total Events: ${data.totalEvents}
    Unique Users: ${data.uniqueUsers}
    Top Content: ${JSON.stringify(data.topContent)}
    User Engagement: ${JSON.stringify(data.userEngagement)}
    Conversion Rates: ${JSON.stringify(data.conversionRates)}
    
    Please provide:
    1. Key trends and patterns
    2. Areas for improvement
    3. Recommended actions
    4. Performance insights`;

    try {
      const response = await this.aiManager.generateContent({
        prompt,
        contentType: 'analysis',
        maxTokens: 500,
      });

      return response.content;
    } catch (error) {
      console.error('Error generating insights:', error);
      return 'Unable to generate insights at this time.';
    }
  }
} 