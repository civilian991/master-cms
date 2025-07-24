import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Personality configuration schemas
export const personalityTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  industry: z.string().min(1),
  baseConfiguration: z.object({
    tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']),
    expertise: z.array(z.string()),
    writingStyle: z.string(),
    targetAudience: z.string(),
    culturalContext: z.string().optional(),
    language: z.enum(['en', 'ar', 'bilingual']),
  }),
  features: z.object({
    dynamicAdaptation: z.boolean().default(true),
    culturalLocalization: z.boolean().default(true),
    audienceTargeting: z.boolean().default(true),
    styleMatching: z.boolean().default(true),
    aBTesting: z.boolean().default(true),
  }),
  culturalSupport: z.object({
    regions: z.array(z.string()),
    languages: z.array(z.string()),
    culturalContexts: z.array(z.string()),
  }),
  audienceTargeting: z.object({
    segments: z.array(z.string()),
    demographics: z.array(z.string()),
    interests: z.array(z.string()),
  }),
});

export const advancedPersonalitySchema = z.object({
  siteId: z.number().int().positive(),
  basePersonality: z.object({
    name: z.string(),
    description: z.string(),
    tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']),
    expertise: z.array(z.string()),
    writingStyle: z.string(),
    targetAudience: z.string(),
    culturalContext: z.string().optional(),
    language: z.enum(['en', 'ar', 'bilingual']),
  }),
  personalityTemplate: z.string().optional(),
  dynamicAdaptation: z.boolean().default(true),
  learningEnabled: z.boolean().default(true),
  adaptationRate: z.number().min(0).max(1).default(0.1),
  culturalContext: z.object({
    region: z.string(),
    language: z.string(),
    culturalNorms: z.array(z.string()),
    localPreferences: z.record(z.any()),
  }),
  linguisticStyle: z.object({
    formality: z.enum(['formal', 'semi-formal', 'casual']),
    vocabulary: z.enum(['technical', 'general', 'simplified']),
    sentenceStructure: z.enum(['complex', 'moderate', 'simple']),
    culturalReferences: z.boolean().default(true),
  }),
  regionalPreferences: z.object({
    dateFormats: z.string(),
    numberFormats: z.string(),
    currencyFormats: z.string(),
    measurementUnits: z.string(),
  }),
  audienceSegments: z.array(z.object({
    segment: z.string(),
    targeting: z.boolean().default(true),
    customization: z.record(z.any()),
  })),
  targetingEnabled: z.boolean().default(true),
  performanceTracking: z.boolean().default(true),
  optimizationEnabled: z.boolean().default(true),
  aBTestingEnabled: z.boolean().default(true),
  modelVersion: z.string(),
  fineTunedModel: z.string().optional(),
  trainingDataVersion: z.string().optional(),
});

export const personalityPerformanceSchema = z.object({
  personalityId: z.number().int().positive(),
  contentQualityScore: z.number().min(0).max(100),
  audienceEngagement: z.number().min(0).max(100),
  culturalRelevance: z.number().min(0).max(100),
  consistencyScore: z.number().min(0).max(100),
  contentCount: z.number().int().nonnegative(),
  publishedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  audienceSegment: z.string().optional(),
  segmentPerformance: z.number().min(0).max(100).optional(),
  measurementDate: z.date(),
  timeRange: z.enum(['day', 'week', 'month']),
});

export const abTestSchema = z.object({
  personalityId: z.number().int().positive(),
  testName: z.string().min(1),
  variantA: z.record(z.any()),
  variantB: z.record(z.any()),
  startDate: z.date(),
  endDate: z.date().optional(),
  sampleSizeA: z.number().int().nonnegative().default(0),
  sampleSizeB: z.number().int().nonnegative().default(0),
});

export class AdvancedPersonalityService {
  private static instance: AdvancedPersonalityService;

  private constructor() {}

  static getInstance(): AdvancedPersonalityService {
    if (!AdvancedPersonalityService.instance) {
      AdvancedPersonalityService.instance = new AdvancedPersonalityService();
    }
    return AdvancedPersonalityService.instance;
  }

  // Personality Template Management
  async createPersonalityTemplate(data: z.infer<typeof personalityTemplateSchema>) {
    const validatedData = personalityTemplateSchema.parse(data);
    
    return await prisma.personalityTemplate.create({
      data: validatedData,
    });
  }

  async getPersonalityTemplates(industry?: string) {
    const where = industry ? { industry, isActive: true } : { isActive: true };
    
    return await prisma.personalityTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getPersonalityTemplate(id: number) {
    return await prisma.personalityTemplate.findUnique({
      where: { id },
    });
  }

  // Advanced Personality Management
  async createAdvancedPersonality(data: z.infer<typeof advancedPersonalitySchema>) {
    const validatedData = advancedPersonalitySchema.parse(data);
    
    return await prisma.advancedPersonality.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getAdvancedPersonality(siteId: number) {
    return await prisma.advancedPersonality.findUnique({
      where: { siteId },
      include: {
        site: true,
        performanceMetrics: {
          orderBy: { measurementDate: 'desc' },
          take: 10,
        },
      },
    });
  }

  async updateAdvancedPersonality(siteId: number, data: Partial<z.infer<typeof advancedPersonalitySchema>>) {
    return await prisma.advancedPersonality.update({
      where: { siteId },
      data,
      include: {
        site: true,
      },
    });
  }

  // Performance Tracking
  async recordPersonalityPerformance(data: z.infer<typeof personalityPerformanceSchema>) {
    const validatedData = personalityPerformanceSchema.parse(data);
    
    return await prisma.personalityPerformance.create({
      data: validatedData,
    });
  }

  async getPersonalityPerformance(personalityId: number, timeRange: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(timeRange);
    
    return await prisma.personalityPerformance.findMany({
      where: {
        personalityId,
        measurementDate: {
          gte: startDate,
        },
      },
      orderBy: { measurementDate: 'asc' },
    });
  }

  async getPersonalityAnalytics(personalityId: number) {
    const performance = await prisma.personalityPerformance.findMany({
      where: { personalityId },
      orderBy: { measurementDate: 'desc' },
      take: 30, // Last 30 measurements
    });

    if (performance.length === 0) {
      return null;
    }

    // Calculate averages
    const averages = {
      contentQualityScore: performance.reduce((sum, p) => sum + p.contentQualityScore, 0) / performance.length,
      audienceEngagement: performance.reduce((sum, p) => sum + p.audienceEngagement, 0) / performance.length,
      culturalRelevance: performance.reduce((sum, p) => sum + p.culturalRelevance, 0) / performance.length,
      consistencyScore: performance.reduce((sum, p) => sum + p.consistencyScore, 0) / performance.length,
    };

    // Calculate trends
    const recent = performance.slice(0, 7);
    const older = performance.slice(7, 14);
    
    const trends = {
      contentQualityTrend: this.calculateTrend(recent, older, 'contentQualityScore'),
      engagementTrend: this.calculateTrend(recent, older, 'audienceEngagement'),
      culturalTrend: this.calculateTrend(recent, older, 'culturalRelevance'),
      consistencyTrend: this.calculateTrend(recent, older, 'consistencyScore'),
    };

    return {
      averages,
      trends,
      recentPerformance: performance.slice(0, 7),
    };
  }

  // Training Data Management
  async addTrainingData(personalityId: number, data: {
    contentType: string;
    content: string;
    metadata: Record<string, any>;
    performanceScore?: number;
    audienceFeedback?: Record<string, any>;
    engagementMetrics?: Record<string, any>;
    qualityScore?: number;
    culturalScore?: number;
    relevanceScore?: number;
  }) {
    const dataVersion = `v${Date.now()}`;
    
    return await prisma.personalityTrainingData.create({
      data: {
        personalityId,
        dataVersion,
        ...data,
      },
    });
  }

  async getTrainingData(personalityId: number, isActive: boolean = true) {
    return await prisma.personalityTrainingData.findMany({
      where: {
        personalityId,
        isActive,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTrainingDataQuality(id: number, scores: {
    qualityScore?: number;
    culturalScore?: number;
    relevanceScore?: number;
  }) {
    return await prisma.personalityTrainingData.update({
      where: { id },
      data: scores,
    });
  }

  // A/B Testing
  async createABTest(data: z.infer<typeof abTestSchema>) {
    const validatedData = abTestSchema.parse(data);
    
    return await prisma.personalityABTest.create({
      data: {
        ...validatedData,
        status: 'running',
      },
    });
  }

  async updateABTestResults(id: number, results: {
    variantAPerformance?: number;
    variantBPerformance?: number;
    statisticalSignificance?: number;
    winner?: 'A' | 'B' | null;
    sampleSizeA?: number;
    sampleSizeB?: number;
  }) {
    const updateData: any = { ...results };
    
    if (results.winner) {
      updateData.status = 'completed';
      updateData.endDate = new Date();
    }
    
    return await prisma.personalityABTest.update({
      where: { id },
      data: updateData,
    });
  }

  async getABTests(personalityId: number, status?: string) {
    const where: any = { personalityId };
    if (status) {
      where.status = status;
    }
    
    return await prisma.personalityABTest.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  // Dynamic Adaptation
  async adaptPersonality(siteId: number, performanceData: {
    contentQualityScore: number;
    audienceEngagement: number;
    culturalRelevance: number;
    consistencyScore: number;
  }) {
    const personality = await this.getAdvancedPersonality(siteId);
    if (!personality || !personality.dynamicAdaptation) {
      return null;
    }

    // Calculate adaptation based on performance
    const adaptation = this.calculateAdaptation(personality, performanceData);
    
    // Apply adaptation with rate limiting
    const adaptedPersonality = this.applyAdaptation(personality, adaptation, personality.adaptationRate);
    
    // Update personality
    return await this.updateAdvancedPersonality(siteId, {
      basePersonality: adaptedPersonality.basePersonality,
      modelVersion: `v${Date.now()}`,
    });
  }

  // Cultural Adaptation
  async adaptCulturalContext(siteId: number, culturalData: {
    region: string;
    language: string;
    culturalNorms: string[];
    localPreferences: Record<string, any>;
  }) {
    const personality = await this.getAdvancedPersonality(siteId);
    if (!personality) {
      return null;
    }

    const adaptedCulturalContext = {
      ...personality.culturalContext,
      ...culturalData,
      lastUpdated: new Date().toISOString(),
    };

    return await this.updateAdvancedPersonality(siteId, {
      culturalContext: adaptedCulturalContext,
    });
  }

  // Audience Targeting
  async updateAudienceTargeting(siteId: number, audienceData: {
    segments: Array<{
      segment: string;
      targeting: boolean;
      customization: Record<string, any>;
    }>;
  }) {
    const personality = await this.getAdvancedPersonality(siteId);
    if (!personality) {
      return null;
    }

    return await this.updateAdvancedPersonality(siteId, {
      audienceSegments: audienceData.segments,
    });
  }

  // Helper methods
  private getStartDate(timeRange: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    
    switch (timeRange) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateTrend(recent: any[], older: any[], field: string): number {
    if (recent.length === 0 || older.length === 0) {
      return 0;
    }

    const recentAvg = recent.reduce((sum, p) => sum + p[field], 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p[field], 0) / older.length;
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  private calculateAdaptation(personality: any, performanceData: any) {
    // Simple adaptation algorithm - can be enhanced with ML
    const adaptation: any = {};
    
    // Adapt tone based on engagement
    if (performanceData.audienceEngagement < 70) {
      adaptation.tone = this.suggestToneAdaptation(personality.basePersonality.tone);
    }
    
    // Adapt expertise based on quality
    if (performanceData.contentQualityScore < 80) {
      adaptation.expertise = this.suggestExpertiseAdaptation(personality.basePersonality.expertise);
    }
    
    // Adapt writing style based on consistency
    if (performanceData.consistencyScore < 85) {
      adaptation.writingStyle = this.suggestStyleAdaptation(personality.basePersonality.writingStyle);
    }
    
    return adaptation;
  }

  private applyAdaptation(personality: any, adaptation: any, rate: number) {
    const adapted = { ...personality.basePersonality };
    
    Object.keys(adaptation).forEach(key => {
      if (adaptation[key]) {
        adapted[key] = adaptation[key];
      }
    });
    
    return adapted;
  }

  private suggestToneAdaptation(currentTone: string): string {
    const toneMap: Record<string, string[]> = {
      'professional': ['conversational', 'authoritative'],
      'casual': ['conversational', 'professional'],
      'technical': ['professional', 'conversational'],
      'conversational': ['casual', 'professional'],
      'authoritative': ['professional', 'technical'],
    };
    
    const suggestions = toneMap[currentTone] || ['professional'];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  private suggestExpertiseAdaptation(currentExpertise: string[]): string[] {
    // Add or modify expertise areas based on performance
    const additionalExpertise = [
      'market analysis', 'trend forecasting', 'industry insights',
      'best practices', 'case studies', 'expert interviews'
    ];
    
    const newExpertise = additionalExpertise.filter(exp => 
      !currentExpertise.includes(exp)
    );
    
    return [...currentExpertise, ...newExpertise.slice(0, 2)];
  }

  private suggestStyleAdaptation(currentStyle: string): string {
    const styleEnhancements = [
      'with clear examples and practical insights',
      'focusing on actionable takeaways',
      'incorporating data-driven analysis',
      'with engaging storytelling elements',
      'emphasizing real-world applications'
    ];
    
    const enhancement = styleEnhancements[Math.floor(Math.random() * styleEnhancements.length)];
    return `${currentStyle}, ${enhancement}`;
  }
} 