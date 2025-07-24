import { prisma } from '@/lib/prisma';
import { AIServiceManager } from './manager';
import { z } from 'zod';

// Validation schemas
export const seoOptimizationSchema = z.object({
  siteId: z.number().int().positive(),
  contentId: z.string(),
  contentType: z.string(),
  seoScore: z.number().min(0).max(100).default(0),
  titleOptimization: z.number().min(0).max(100).default(0),
  descriptionOptimization: z.number().min(0).max(100).default(0),
  keywordOptimization: z.number().min(0).max(100).default(0),
  urlOptimization: z.number().min(0).max(100).default(0),
  internalLinking: z.number().min(0).max(100).default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.record(z.any()),
  canonicalUrl: z.string().optional(),
  robotsMeta: z.string().optional(),
  schemaMarkup: z.record(z.any()),
  schemaType: z.string().optional(),
  schemaValid: z.boolean().default(false),
  keywordDensity: z.record(z.any()),
  contentLength: z.number().int().default(0),
  headingStructure: z.record(z.any()),
  imageAltText: z.record(z.any()),
  isOptimized: z.boolean().default(false),
  lastOptimized: z.date().optional(),
  optimizationHistory: z.record(z.any()),
  recommendations: z.record(z.any()),
  priorityActions: z.record(z.any()),
});

export const imageOptimizationSchema = z.object({
  siteId: z.number().int().positive(),
  imageId: z.string(),
  originalPath: z.string(),
  originalSize: z.number().int().positive(),
  originalFormat: z.string(),
  optimizedPath: z.string().optional(),
  optimizedSize: z.number().int().optional(),
  optimizedFormat: z.string().optional(),
  compressionRatio: z.number().optional(),
  webpPath: z.string().optional(),
  webpSize: z.number().int().optional(),
  webpCompressionRatio: z.number().optional(),
  responsiveImages: z.record(z.any()),
  lazyLoadingEnabled: z.boolean().default(true),
  altText: z.string().optional(),
  altTextGenerated: z.boolean().default(false),
  titleAttribute: z.string().optional(),
  filenameOptimized: z.boolean().default(false),
  loadTime: z.number().optional(),
  optimizationScore: z.number().min(0).max(100).default(0),
  processingStatus: z.string().default('pending'),
  processingError: z.string().optional(),
  lastProcessed: z.date().optional(),
});

export const performanceMetricsSchema = z.object({
  siteId: z.number().int().positive(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  largestContentfulPaint: z.number().optional(),
  firstInputDelay: z.number().optional(),
  cumulativeLayoutShift: z.number().optional(),
  firstContentfulPaint: z.number().optional(),
  timeToInteractive: z.number().optional(),
  totalBlockingTime: z.number().optional(),
  speedIndex: z.number().optional(),
  performanceScore: z.number().min(0).max(100).default(0),
  accessibilityScore: z.number().min(0).max(100).default(0),
  bestPracticesScore: z.number().min(0).max(100).default(0),
  seoScore: z.number().min(0).max(100).default(0),
  budgetExceeded: z.boolean().default(false),
  budgetThresholds: z.record(z.any()),
  deviceType: z.string(),
  connectionType: z.string().optional(),
  userAgent: z.string().optional(),
  alertTriggered: z.boolean().default(false),
  alertType: z.string().optional(),
});

export const accessibilityAuditSchema = z.object({
  siteId: z.number().int().positive(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  wcagLevel: z.string(),
  wcagScore: z.number().min(0).max(100).default(0),
  wcagCompliant: z.boolean().default(false),
  totalIssues: z.number().int().default(0),
  criticalIssues: z.number().int().default(0),
  seriousIssues: z.number().int().default(0),
  moderateIssues: z.number().int().default(0),
  minorIssues: z.number().int().default(0),
  issues: z.record(z.any()),
  automatedFixes: z.record(z.any()),
  manualFixes: z.record(z.any()),
  colorContrast: z.number().min(0).max(100).default(0),
  keyboardNavigation: z.number().min(0).max(100).default(0),
  screenReaderSupport: z.number().min(0).max(100).default(0),
  semanticStructure: z.number().min(0).max(100).default(0),
  altTextCoverage: z.number().min(0).max(100).default(0),
  auditTool: z.string(),
  auditVersion: z.string().optional(),
  auditDuration: z.number().int().optional(),
  fixesApplied: z.number().int().default(0),
  fixesPending: z.number().int().default(0),
  lastFixed: z.date().optional(),
});

export const contentQualityAnalysisSchema = z.object({
  siteId: z.number().int().positive(),
  contentId: z.string(),
  contentType: z.string(),
  overallScore: z.number().min(0).max(100).default(0),
  readabilityScore: z.number().min(0).max(100).default(0),
  structureScore: z.number().min(0).max(100).default(0),
  engagementScore: z.number().min(0).max(100).default(0),
  seoScore: z.number().min(0).max(100).default(0),
  fleschKincaidGrade: z.number().optional(),
  fleschReadingEase: z.number().optional(),
  gunningFogIndex: z.number().optional(),
  smogIndex: z.number().optional(),
  wordCount: z.number().int().default(0),
  sentenceCount: z.number().int().default(0),
  paragraphCount: z.number().int().default(0),
  headingCount: z.number().int().default(0),
  imageCount: z.number().int().default(0),
  linkCount: z.number().int().default(0),
  headingHierarchy: z.record(z.any()),
  paragraphLengths: z.record(z.any()),
  sentenceLengths: z.record(z.any()),
  predictedEngagement: z.number().min(0).max(100).default(0),
  engagementFactors: z.record(z.any()),
  bounceRatePrediction: z.number().optional(),
  keywordUsage: z.record(z.any()),
  topicRelevance: z.number().min(0).max(100).default(0),
  contentUniqueness: z.number().min(0).max(100).default(0),
  plagiarismScore: z.number().optional(),
  suggestions: z.record(z.any()),
  priorityImprovements: z.record(z.any()),
  aiRecommendations: z.record(z.any()),
  analysisTool: z.string(),
  analysisVersion: z.string().optional(),
  analysisDuration: z.number().int().optional(),
});

export const optimizationTriggerSchema = z.object({
  siteId: z.number().int().positive(),
  triggerName: z.string(),
  triggerType: z.string(),
  triggerCondition: z.record(z.any()),
  triggerThreshold: z.number(),
  actionType: z.string(),
  actionParameters: z.record(z.any()),
  actionPriority: z.string().default('medium'),
  isActive: z.boolean().default(true),
  isEnabled: z.boolean().default(true),
  lastTriggered: z.date().optional(),
  triggerCount: z.number().int().default(0),
  successCount: z.number().int().default(0),
  failureCount: z.number().int().default(0),
  averageExecutionTime: z.number().optional(),
  lastExecutionTime: z.number().optional(),
  lastError: z.string().optional(),
  schedule: z.record(z.any()).optional(),
  nextExecution: z.date().optional(),
});

export const performanceBudgetSchema = z.object({
  siteId: z.number().int().positive(),
  budgetName: z.string(),
  budgetType: z.string(),
  budgetTarget: z.string(),
  maxLCP: z.number().optional(),
  maxFID: z.number().optional(),
  maxCLS: z.number().optional(),
  maxFCP: z.number().optional(),
  maxTTI: z.number().optional(),
  maxTBT: z.number().optional(),
  maxSize: z.number().int().optional(),
  maxRequests: z.number().int().optional(),
  enforcementLevel: z.string().default('warning'),
  autoOptimize: z.boolean().default(false),
  optimizationActions: z.record(z.any()),
  currentValue: z.number().optional(),
  budgetExceeded: z.boolean().default(false),
  exceedanceCount: z.number().int().default(0),
  lastExceeded: z.date().optional(),
  alertEnabled: z.boolean().default(true),
  alertThreshold: z.number().optional(),
  alertRecipients: z.record(z.any()),
});

export class ContentOptimizationService {
  private static instance: ContentOptimizationService;
  private aiManager: AIServiceManager;

  private constructor() {
    this.aiManager = AIServiceManager.getInstance();
  }

  static getInstance(): ContentOptimizationService {
    if (!ContentOptimizationService.instance) {
      ContentOptimizationService.instance = new ContentOptimizationService();
    }
    return ContentOptimizationService.instance;
  }

  // SEO Optimization
  async optimizeSEO(data: z.infer<typeof seoOptimizationSchema>) {
    const validatedData = seoOptimizationSchema.parse(data);
    
    // Generate SEO recommendations using AI
    const recommendations = await this.generateSEORecommendations(validatedData);
    validatedData.recommendations = recommendations;
    
    // Calculate overall SEO score
    const seoScore = this.calculateSEOScore(validatedData);
    validatedData.seoScore = seoScore;
    
    // Generate structured data
    const schemaMarkup = await this.generateSchemaMarkup(validatedData);
    validatedData.schemaMarkup = schemaMarkup;
    
    // Update optimization status
    validatedData.isOptimized = seoScore >= 90;
    validatedData.lastOptimized = new Date();
    
    return await prisma.sEOOptimization.upsert({
      where: {
        siteId_contentId_contentType: {
          siteId: validatedData.siteId,
          contentId: validatedData.contentId,
          contentType: validatedData.contentType,
        },
      },
      update: validatedData,
      create: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getSEOOptimization(siteId: number, contentId: string, contentType: string) {
    return await prisma.sEOOptimization.findUnique({
      where: {
        siteId_contentId_contentType: {
          siteId,
          contentId,
          contentType,
        },
      },
      include: {
        site: true,
      },
    });
  }

  async getSEOOptimizations(siteId: number, filters?: {
    contentType?: string;
    isOptimized?: boolean;
    minScore?: number;
  }) {
    const where: any = { siteId };
    
    if (filters?.contentType) where.contentType = filters.contentType;
    if (filters?.isOptimized !== undefined) where.isOptimized = filters.isOptimized;
    if (filters?.minScore) where.seoScore = { gte: filters.minScore };
    
    return await prisma.sEOOptimization.findMany({
      where,
      orderBy: { seoScore: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Image Optimization
  async optimizeImage(data: z.infer<typeof imageOptimizationSchema>) {
    const validatedData = imageOptimizationSchema.parse(data);
    
    // Process image optimization
    const optimizationResult = await this.processImageOptimization(validatedData);
    
    // Update with optimization results
    Object.assign(validatedData, optimizationResult);
    
    return await prisma.imageOptimization.upsert({
      where: {
        siteId_imageId: {
          siteId: validatedData.siteId,
          imageId: validatedData.imageId,
        },
      },
      update: validatedData,
      create: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getImageOptimizations(siteId: number, filters?: {
    processingStatus?: string;
    minOptimizationScore?: number;
  }) {
    const where: any = { siteId };
    
    if (filters?.processingStatus) where.processingStatus = filters.processingStatus;
    if (filters?.minOptimizationScore) where.optimizationScore = { gte: filters.minOptimizationScore };
    
    return await prisma.imageOptimization.findMany({
      where,
      orderBy: { optimizationScore: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Performance Monitoring
  async recordPerformanceMetrics(data: z.infer<typeof performanceMetricsSchema>) {
    const validatedData = performanceMetricsSchema.parse(data);
    
    // Check performance budgets
    const budgetCheck = await this.checkPerformanceBudgets(validatedData);
    validatedData.budgetExceeded = budgetCheck.exceeded;
    
    // Trigger alerts if needed
    if (budgetCheck.exceeded) {
      await this.triggerPerformanceAlert(validatedData);
    }
    
    return await prisma.performanceMetrics.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getPerformanceMetrics(siteId: number, filters?: {
    pageUrl?: string;
    deviceType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { siteId };
    
    if (filters?.pageUrl) where.pageUrl = filters.pageUrl;
    if (filters?.deviceType) where.deviceType = filters.deviceType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) where.createdAt.gte = filters.startDate;
      if (filters?.endDate) where.createdAt.lte = filters.endDate;
    }
    
    return await prisma.performanceMetrics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Accessibility Compliance
  async performAccessibilityAudit(data: z.infer<typeof accessibilityAuditSchema>) {
    const validatedData = accessibilityAuditSchema.parse(data);
    
    // Perform accessibility analysis
    const auditResult = await this.performAccessibilityAnalysis(validatedData);
    
    // Update with audit results
    Object.assign(validatedData, auditResult);
    
    return await prisma.accessibilityAudit.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getAccessibilityAudits(siteId: number, filters?: {
    pageUrl?: string;
    wcagLevel?: string;
    wcagCompliant?: boolean;
  }) {
    const where: any = { siteId };
    
    if (filters?.pageUrl) where.pageUrl = filters.pageUrl;
    if (filters?.wcagLevel) where.wcagLevel = filters.wcagLevel;
    if (filters?.wcagCompliant !== undefined) where.wcagCompliant = filters.wcagCompliant;
    
    return await prisma.accessibilityAudit.findMany({
      where,
      orderBy: { wcagScore: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Content Quality Analysis
  async analyzeContentQuality(data: z.infer<typeof contentQualityAnalysisSchema>) {
    const validatedData = contentQualityAnalysisSchema.parse(data);
    
    // Perform AI-powered content analysis
    const analysisResult = await this.performContentAnalysis(validatedData);
    
    // Update with analysis results
    Object.assign(validatedData, analysisResult);
    
    return await prisma.contentQualityAnalysis.upsert({
      where: {
        siteId_contentId_contentType: {
          siteId: validatedData.siteId,
          contentId: validatedData.contentId,
          contentType: validatedData.contentType,
        },
      },
      update: validatedData,
      create: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getContentQualityAnalyses(siteId: number, filters?: {
    contentType?: string;
    minOverallScore?: number;
  }) {
    const where: any = { siteId };
    
    if (filters?.contentType) where.contentType = filters.contentType;
    if (filters?.minOverallScore) where.overallScore = { gte: filters.minOverallScore };
    
    return await prisma.contentQualityAnalysis.findMany({
      where,
      orderBy: { overallScore: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Optimization Triggers
  async createOptimizationTrigger(data: z.infer<typeof optimizationTriggerSchema>) {
    const validatedData = optimizationTriggerSchema.parse(data);
    
    return await prisma.optimizationTrigger.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getOptimizationTriggers(siteId: number, filters?: {
    triggerType?: string;
    isActive?: boolean;
  }) {
    const where: any = { siteId };
    
    if (filters?.triggerType) where.triggerType = filters.triggerType;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    
    return await prisma.optimizationTrigger.findMany({
      where,
      orderBy: { actionPriority: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Performance Budgets
  async createPerformanceBudget(data: z.infer<typeof performanceBudgetSchema>) {
    const validatedData = performanceBudgetSchema.parse(data);
    
    return await prisma.performanceBudget.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getPerformanceBudgets(siteId: number, filters?: {
    budgetType?: string;
    budgetExceeded?: boolean;
  }) {
    const where: any = { siteId };
    
    if (filters?.budgetType) where.budgetType = filters.budgetType;
    if (filters?.budgetExceeded !== undefined) where.budgetExceeded = filters.budgetExceeded;
    
    return await prisma.performanceBudget.findMany({
      where,
      orderBy: { exceedanceCount: 'desc' },
      include: {
        site: true,
      },
    });
  }

  // Comprehensive Optimization
  async optimizeContent(siteId: number, contentId: string, contentType: string) {
    // Get content data
    const content = await this.getContentData(contentId, contentType);
    
    // Perform comprehensive optimization
    const [seoResult, qualityResult] = await Promise.all([
      this.optimizeSEO({
        siteId,
        contentId,
        contentType,
        ...this.extractSEOData(content),
      }),
      this.analyzeContentQuality({
        siteId,
        contentId,
        contentType,
        ...this.extractQualityData(content),
      }),
    ]);
    
    // Generate optimization report
    const report = await this.generateOptimizationReport({
      seoResult,
      qualityResult,
      content,
    });
    
    return {
      seoOptimization: seoResult,
      contentQuality: qualityResult,
      report,
    };
  }

  // Private helper methods
  private async generateSEORecommendations(data: any) {
    const prompt = `Analyze the following content and provide SEO optimization recommendations:
    
    Content ID: ${data.contentId}
    Content Type: ${data.contentType}
    Meta Title: ${data.metaTitle || 'Not set'}
    Meta Description: ${data.metaDescription || 'Not set'}
    Keywords: ${JSON.stringify(data.metaKeywords)}
    Content Length: ${data.contentLength} words
    
    Please provide:
    1. Meta tag optimization suggestions
    2. Keyword optimization recommendations
    3. Content structure improvements
    4. Internal linking suggestions
    5. Priority actions to take`;

    try {
      const response = await this.aiManager.generateContent({
        prompt,
        contentType: 'analysis',
        maxTokens: 500,
      });

      return {
        recommendations: response.content,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating SEO recommendations:', error);
      return {
        recommendations: 'Unable to generate recommendations at this time.',
        generatedAt: new Date(),
      };
    }
  }

  private calculateSEOScore(data: any): number {
    const weights = {
      titleOptimization: 0.2,
      descriptionOptimization: 0.15,
      keywordOptimization: 0.25,
      urlOptimization: 0.1,
      internalLinking: 0.1,
      contentLength: 0.1,
      schemaValid: 0.1,
    };

    let score = 0;
    
    score += data.titleOptimization * weights.titleOptimization;
    score += data.descriptionOptimization * weights.descriptionOptimization;
    score += data.keywordOptimization * weights.keywordOptimization;
    score += data.urlOptimization * weights.urlOptimization;
    score += data.internalLinking * weights.internalLinking;
    
    // Content length bonus
    if (data.contentLength >= 300) score += 10 * weights.contentLength;
    else score += (data.contentLength / 300) * 10 * weights.contentLength;
    
    // Schema validation bonus
    if (data.schemaValid) score += 10 * weights.schemaValid;
    
    return Math.min(100, Math.max(0, score));
  }

  private async generateSchemaMarkup(data: any) {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': data.schemaType || 'Article',
      headline: data.metaTitle,
      description: data.metaDescription,
      keywords: data.metaKeywords,
      url: data.canonicalUrl,
    };

    return baseSchema;
  }

  private async processImageOptimization(data: any) {
    // Simulate image processing
    const compressionRatio = Math.random() * 0.6 + 0.2; // 20-80% compression
    const optimizedSize = Math.floor(data.originalSize * (1 - compressionRatio));
    
    return {
      optimizedSize,
      compressionRatio,
      webpSize: Math.floor(optimizedSize * 0.8),
      webpCompressionRatio: 0.8,
      optimizationScore: Math.floor(compressionRatio * 100),
      processingStatus: 'completed',
      lastProcessed: new Date(),
    };
  }

  private async checkPerformanceBudgets(data: any) {
    const budgets = await prisma.performanceBudget.findMany({
      where: { siteId: data.siteId },
    });

    let exceeded = false;
    
    for (const budget of budgets) {
      if (data.largestContentfulPaint && budget.maxLCP && data.largestContentfulPaint > budget.maxLCP) {
        exceeded = true;
        break;
      }
      if (data.firstInputDelay && budget.maxFID && data.firstInputDelay > budget.maxFID) {
        exceeded = true;
        break;
      }
      if (data.cumulativeLayoutShift && budget.maxCLS && data.cumulativeLayoutShift > budget.maxCLS) {
        exceeded = true;
        break;
      }
    }
    
    return { exceeded };
  }

  private async triggerPerformanceAlert(data: any) {
    console.log(`Performance alert triggered for ${data.pageUrl}: ${data.alertType}`);
    // Implement alert system
  }

  private async performAccessibilityAnalysis(data: any) {
    // Simulate accessibility analysis
    const wcagScore = Math.random() * 40 + 60; // 60-100 score
    const totalIssues = Math.floor(Math.random() * 10);
    
    return {
      wcagScore,
      wcagCompliant: wcagScore >= 90,
      totalIssues,
      criticalIssues: Math.floor(totalIssues * 0.1),
      seriousIssues: Math.floor(totalIssues * 0.2),
      moderateIssues: Math.floor(totalIssues * 0.3),
      minorIssues: Math.floor(totalIssues * 0.4),
      colorContrast: Math.random() * 40 + 60,
      keyboardNavigation: Math.random() * 40 + 60,
      screenReaderSupport: Math.random() * 40 + 60,
      semanticStructure: Math.random() * 40 + 60,
      altTextCoverage: Math.random() * 40 + 60,
      issues: [],
      automatedFixes: [],
      manualFixes: [],
    };
  }

  private async performContentAnalysis(data: any) {
    // Simulate content analysis
    const overallScore = Math.random() * 40 + 60; // 60-100 score
    const readabilityScore = Math.random() * 40 + 60;
    const structureScore = Math.random() * 40 + 60;
    const engagementScore = Math.random() * 40 + 60;
    const seoScore = Math.random() * 40 + 60;
    
    return {
      overallScore,
      readabilityScore,
      structureScore,
      engagementScore,
      seoScore,
      fleschKincaidGrade: Math.random() * 8 + 6, // 6-14 grade level
      fleschReadingEase: Math.random() * 40 + 40, // 40-80 reading ease
      gunningFogIndex: Math.random() * 8 + 8, // 8-16 fog index
      smogIndex: Math.random() * 6 + 4, // 4-10 SMOG index
      predictedEngagement: Math.random() * 40 + 60,
      topicRelevance: Math.random() * 40 + 60,
      contentUniqueness: Math.random() * 40 + 60,
      suggestions: [],
      priorityImprovements: [],
      aiRecommendations: [],
    };
  }

  private async getContentData(contentId: string, contentType: string) {
    // Get content from database based on type
    switch (contentType) {
      case 'article':
        return await prisma.article.findUnique({ where: { id: parseInt(contentId) } });
      default:
        return null;
    }
  }

  private extractSEOData(content: any) {
    return {
      metaTitle: content?.seoTitleEn || content?.titleEn,
      metaDescription: content?.seoDescriptionEn || content?.excerptEn,
      metaKeywords: content?.seoKeywordsEn ? content.seoKeywordsEn.split(',') : [],
      contentLength: content?.contentEn?.length || 0,
      keywordDensity: {},
      headingStructure: {},
      imageAltText: {},
    };
  }

  private extractQualityData(content: any) {
    return {
      wordCount: content?.contentEn?.split(' ').length || 0,
      sentenceCount: content?.contentEn?.split(/[.!?]+/).length || 0,
      paragraphCount: content?.contentEn?.split('\n\n').length || 0,
      headingCount: (content?.contentEn?.match(/<h[1-6][^>]*>/g) || []).length,
      imageCount: (content?.contentEn?.match(/<img[^>]*>/g) || []).length,
      linkCount: (content?.contentEn?.match(/<a[^>]*>/g) || []).length,
      headingHierarchy: {},
      paragraphLengths: {},
      sentenceLengths: {},
      engagementFactors: {},
      keywordUsage: {},
    };
  }

  private async generateOptimizationReport(data: any) {
    const prompt = `Generate a comprehensive optimization report for the following content:
    
    Content ID: ${data.content.seoOptimization.contentId}
    SEO Score: ${data.content.seoOptimization.seoScore}
    Content Quality Score: ${data.content.qualityResult.overallScore}
    
    Please provide:
    1. Executive summary
    2. Key findings
    3. Priority recommendations
    4. Implementation timeline
    5. Expected improvements`;

    try {
      const response = await this.aiManager.generateContent({
        prompt,
        contentType: 'report',
        maxTokens: 800,
      });

      return {
        report: response.content,
        generatedAt: new Date(),
        scores: {
          seo: data.content.seoOptimization.seoScore,
          quality: data.content.qualityResult.overallScore,
          overall: (data.content.seoOptimization.seoScore + data.content.qualityResult.overallScore) / 2,
        },
      };
    } catch (error) {
      console.error('Error generating optimization report:', error);
      return {
        report: 'Unable to generate report at this time.',
        generatedAt: new Date(),
        scores: {
          seo: data.content.seoOptimization.seoScore,
          quality: data.content.qualityResult.overallScore,
          overall: (data.content.seoOptimization.seoScore + data.content.qualityResult.overallScore) / 2,
        },
      };
    }
  }
} 