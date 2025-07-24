import { prisma } from '@/lib/prisma';
import { AIServiceManager } from './manager';
import { AdvancedPersonalityService } from './personality';
import { z } from 'zod';

// Content generation schemas
export const contentTemplateSchema = z.object({
  siteId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  templateStructure: z.object({
    sections: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'list', 'quote', 'image', 'video']),
      required: z.boolean(),
      maxLength: z.number().optional(),
    })),
    format: z.string(),
    style: z.string(),
  }),
  aiPrompts: z.object({
    systemPrompt: z.string(),
    userPrompt: z.string(),
    examples: z.array(z.string()).optional(),
  }),
  optimizationRules: z.object({
    seoKeywords: z.array(z.string()),
    targetLength: z.object({
      min: z.number(),
      max: z.number(),
    }),
    tone: z.string(),
    style: z.string(),
  }),
  qualityCriteria: z.object({
    readabilityTarget: z.number().min(0).max(100),
    seoScoreTarget: z.number().min(0).max(100),
    engagementTarget: z.number().min(0).max(100),
  }),
  parentTemplate: z.number().int().positive().optional(),
  templateVariables: z.record(z.any()).optional(),
});

export const contentSessionSchema = z.object({
  siteId: z.number().int().positive(),
  sessionType: z.enum(['single', 'batch', 'campaign']),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  templateId: z.number().int().positive().optional(),
  generationParams: z.object({
    topic: z.string(),
    keywords: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    tone: z.string().optional(),
    length: z.number().optional(),
    language: z.string().optional(),
  }),
  optimizationSettings: z.object({
    seoOptimization: z.boolean().default(true),
    readabilityOptimization: z.boolean().default(true),
    engagementOptimization: z.boolean().default(true),
    plagiarismCheck: z.boolean().default(true),
  }),
  personalizationData: z.record(z.any()).optional(),
});

export const contentVersionSchema = z.object({
  sessionId: z.number().int().positive(),
  versionNumber: z.number().int().positive(),
  content: z.string().min(1),
  metadata: z.record(z.any()),
  parentVersion: z.number().int().positive().optional(),
  changeSummary: z.string().optional(),
});

export const contentScheduleSchema = z.object({
  siteId: z.number().int().positive(),
  scheduleName: z.string().min(1),
  scheduleType: z.enum(['single', 'recurring', 'campaign']),
  scheduleConfig: z.object({
    frequency: z.string().optional(),
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)).optional(),
    timeSlots: z.array(z.string()).optional(),
  }),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  templateId: z.number().int().positive().optional(),
  generationParams: z.record(z.any()),
  publishChannels: z.array(z.string()),
  publishSettings: z.record(z.any()),
});

export class AdvancedContentGenerationService {
  private static instance: AdvancedContentGenerationService;
  private aiManager: AIServiceManager;
  private personalityService: AdvancedPersonalityService;

  private constructor() {
    this.aiManager = AIServiceManager.getInstance();
    this.personalityService = AdvancedPersonalityService.getInstance();
  }

  static getInstance(): AdvancedContentGenerationService {
    if (!AdvancedContentGenerationService.instance) {
      AdvancedContentGenerationService.instance = new AdvancedContentGenerationService();
    }
    return AdvancedContentGenerationService.instance;
  }

  // Content Template Management
  async createContentTemplate(data: z.infer<typeof contentTemplateSchema>) {
    const validatedData = contentTemplateSchema.parse(data);
    
    return await prisma.contentTemplate.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getContentTemplates(siteId: number, contentType?: string) {
    const where: any = { siteId };
    if (contentType) {
      where.contentType = contentType;
    }
    
    return await prisma.contentTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        site: true,
      },
    });
  }

  async getContentTemplate(id: number) {
    return await prisma.contentTemplate.findUnique({
      where: { id },
      include: {
        site: true,
        sessions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateContentTemplate(id: number, data: Partial<z.infer<typeof contentTemplateSchema>>) {
    return await prisma.contentTemplate.update({
      where: { id },
      data,
      include: {
        site: true,
      },
    });
  }

  // Content Generation Sessions
  async createContentSession(data: z.infer<typeof contentSessionSchema>) {
    const validatedData = contentSessionSchema.parse(data);
    
    // Get site personality for generation
    const personality = await this.personalityService.getAdvancedPersonality(validatedData.siteId);
    
    const session = await prisma.contentGenerationSession.create({
      data: {
        ...validatedData,
        status: 'draft',
        progress: 0,
        collaborators: [],
        versionHistory: [],
      },
      include: {
        site: true,
        template: true,
      },
    });

    return session;
  }

  async generateContent(sessionId: number, options?: {
    useTemplate?: boolean;
    optimizeContent?: boolean;
    personalizeContent?: boolean;
  }) {
    const session = await prisma.contentGenerationSession.findUnique({
      where: { id: sessionId },
      include: {
        site: true,
        template: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Update session status
    await prisma.contentGenerationSession.update({
      where: { id: sessionId },
      data: { status: 'generating', progress: 10 },
    });

    try {
      // Get site personality
      const personality = await this.personalityService.getAdvancedPersonality(session.siteId);
      
      // Build generation prompt
      const prompt = await this.buildGenerationPrompt(session, personality, options);
      
      // Generate content using AI
      const startTime = Date.now();
      const generatedContent = await this.aiManager.generateContent({
        prompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        contentType: session.contentType,
        language: session.generationParams.language || 'en',
        maxTokens: this.getMaxTokens(session.contentType),
        temperature: 0.7,
      });

      const generationTime = Date.now() - startTime;

      // Create content version
      const version = await this.createContentVersion({
        sessionId,
        versionNumber: (session.versions[0]?.versionNumber || 0) + 1,
        content: generatedContent.content,
        metadata: {
          generationTime,
          aiProvider: generatedContent.provider,
          model: generatedContent.model,
          tokens: generatedContent.tokens,
          cost: generatedContent.cost,
        },
      });

      // Optimize content if requested
      if (options?.optimizeContent) {
        await this.optimizeContent(version.id);
      }

      // Personalize content if requested
      if (options?.personalizeContent) {
        await this.personalizeContent(version.id, session.personalizationData);
      }

      // Update session
      await prisma.contentGenerationSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          progress: 100,
          generationTime,
          qualityScore: version.qualityScore,
          optimizationScore: version.seoScore,
        },
      });

      return version;

    } catch (error) {
      await prisma.contentGenerationSession.update({
        where: { id: sessionId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async createContentVersion(data: z.infer<typeof contentVersionSchema>) {
    const validatedData = contentVersionSchema.parse(data);
    
    // Analyze content quality
    const qualityMetrics = await this.analyzeContentQuality(validatedData.content);
    
    const version = await prisma.contentVersion.create({
      data: {
        ...validatedData,
        qualityScore: qualityMetrics.overallScore,
        seoScore: qualityMetrics.seoOptimization,
        readabilityScore: qualityMetrics.readabilityScore,
        engagementScore: qualityMetrics.engagementPrediction,
        optimizationData: qualityMetrics,
        improvementSuggestions: qualityMetrics.improvementSuggestions,
      },
      include: {
        session: {
          include: {
            site: true,
            template: true,
          },
        },
      },
    });

    // Create quality metrics record
    await prisma.contentQualityMetrics.create({
      data: {
        versionId: version.id,
        overallScore: qualityMetrics.overallScore,
        contentQuality: qualityMetrics.contentQuality,
        seoOptimization: qualityMetrics.seoOptimization,
        readabilityScore: qualityMetrics.readabilityScore,
        engagementPrediction: qualityMetrics.engagementPrediction,
        keywordDensity: qualityMetrics.keywordDensity,
        contentStructure: qualityMetrics.contentStructure,
        toneAnalysis: qualityMetrics.toneAnalysis,
        grammarCheck: qualityMetrics.grammarCheck,
        improvementSuggestions: qualityMetrics.improvementSuggestions,
        priorityActions: qualityMetrics.priorityActions,
      },
    });

    return version;
  }

  async getContentSession(id: number) {
    return await prisma.contentGenerationSession.findUnique({
      where: { id },
      include: {
        site: true,
        template: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            session: true,
          },
        },
      },
    });
  }

  async getContentSessions(siteId: number, status?: string) {
    const where: any = { siteId };
    if (status) {
      where.status = status;
    }
    
    return await prisma.contentGenerationSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        site: true,
        template: true,
        versions: {
          take: 1,
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  // Content Optimization
  async optimizeContent(versionId: number) {
    const version = await prisma.contentVersion.findUnique({
      where: { id: versionId },
      include: {
        session: {
          include: {
            site: true,
            template: true,
          },
        },
      },
    });

    if (!version) {
      throw new Error('Content version not found');
    }

    // SEO optimization
    const seoOptimized = await this.optimizeSEO(version.content, version.session.generationParams);
    
    // Readability optimization
    const readabilityOptimized = await this.optimizeReadability(seoOptimized);
    
    // Engagement optimization
    const engagementOptimized = await this.optimizeEngagement(readabilityOptimized);

    // Create new optimized version
    const optimizedVersion = await this.createContentVersion({
      sessionId: version.sessionId,
      versionNumber: version.versionNumber + 1,
      content: engagementOptimized,
      metadata: {
        ...version.metadata,
        optimizationType: 'comprehensive',
        originalVersionId: version.id,
      },
      parentVersion: version.id,
      changeSummary: 'Comprehensive optimization applied',
    });

    return optimizedVersion;
  }

  async personalizeContent(versionId: number, personalizationData?: any) {
    const version = await prisma.contentVersion.findUnique({
      where: { id: versionId },
      include: {
        session: {
          include: {
            site: true,
          },
        },
      },
    });

    if (!version) {
      throw new Error('Content version not found');
    }

    // Get personality for personalization
    const personality = await this.personalityService.getAdvancedPersonality(version.session.siteId);
    
    // Apply personalization
    const personalizedContent = await this.applyPersonalization(
      version.content,
      personality,
      personalizationData
    );

    // Create personalized version
    const personalizedVersion = await this.createContentVersion({
      sessionId: version.sessionId,
      versionNumber: version.versionNumber + 1,
      content: personalizedContent,
      metadata: {
        ...version.metadata,
        personalizationType: 'audience-specific',
        personalizationData,
      },
      parentVersion: version.id,
      changeSummary: 'Content personalized for target audience',
    });

    return personalizedVersion;
  }

  // Content Scheduling
  async createContentSchedule(data: z.infer<typeof contentScheduleSchema>) {
    const validatedData = contentScheduleSchema.parse(data);
    
    return await prisma.contentSchedule.create({
      data: {
        ...validatedData,
        status: 'active',
        nextRun: validatedData.scheduleConfig.startDate,
      },
      include: {
        site: true,
        template: true,
      },
    });
  }

  async getContentSchedules(siteId: number, status?: string) {
    const where: any = { siteId };
    if (status) {
      where.status = status;
    }
    
    return await prisma.contentSchedule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        site: true,
        template: true,
      },
    });
  }

  async executeScheduledContent(scheduleId: number) {
    const schedule = await prisma.contentSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        site: true,
        template: true,
      },
    });

    if (!schedule || schedule.status !== 'active') {
      throw new Error('Schedule not found or not active');
    }

    try {
      // Create content session
      const session = await this.createContentSession({
        siteId: schedule.siteId,
        sessionType: 'single',
        contentType: schedule.contentType,
        templateId: schedule.templateId,
        generationParams: schedule.generationParams,
        optimizationSettings: {
          seoOptimization: true,
          readabilityOptimization: true,
          engagementOptimization: true,
          plagiarismCheck: true,
        },
      });

      // Generate content
      const version = await this.generateContent(session.id, {
        optimizeContent: true,
        personalizeContent: true,
      });

      // Update schedule
      await prisma.contentSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(schedule.scheduleConfig),
          totalPublished: schedule.totalPublished + 1,
          successRate: ((schedule.successRate * schedule.totalPublished) + 1) / (schedule.totalPublished + 1),
        },
      });

      return version;

    } catch (error) {
      // Update schedule with failure
      await prisma.contentSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRun: new Date(),
          successRate: (schedule.successRate * schedule.totalPublished) / (schedule.totalPublished + 1),
        },
      });
      throw error;
    }
  }

  // Batch Content Generation
  async generateBatchContent(siteId: number, batchConfig: {
    contentType: string;
    topics: string[];
    templateId?: number;
    optimizationSettings?: any;
  }) {
    const sessions = [];
    const results = [];

    for (const topic of batchConfig.topics) {
      // Create session for each topic
      const session = await this.createContentSession({
        siteId,
        sessionType: 'batch',
        contentType: batchConfig.contentType as any,
        templateId: batchConfig.templateId,
        generationParams: { topic },
        optimizationSettings: batchConfig.optimizationSettings || {
          seoOptimization: true,
          readabilityOptimization: true,
          engagementOptimization: true,
          plagiarismCheck: true,
        },
      });

      sessions.push(session);

      // Generate content
      try {
        const version = await this.generateContent(session.id, {
          optimizeContent: true,
          personalizeContent: true,
        });
        results.push({ session, version, success: true });
      } catch (error) {
        results.push({ session, error, success: false });
      }
    }

    return results;
  }

  // Helper methods
  private async buildGenerationPrompt(session: any, personality: any, options?: any) {
    const template = session.template;
    const params = session.generationParams;
    
    let systemPrompt = '';
    let userPrompt = '';

    if (template) {
      // Use template prompts
      systemPrompt = template.aiPrompts.systemPrompt;
      userPrompt = template.aiPrompts.userPrompt;
    } else {
      // Build default prompts
      systemPrompt = this.buildDefaultSystemPrompt(session.contentType, personality);
      userPrompt = this.buildDefaultUserPrompt(params);
    }

    // Apply personality
    if (personality) {
      systemPrompt = this.applyPersonalityToPrompt(systemPrompt, personality);
    }

    return { systemPrompt, userPrompt };
  }

  private buildDefaultSystemPrompt(contentType: string, personality: any): string {
    const basePrompt = `You are an expert content creator specializing in ${contentType} content. `;
    
    if (personality) {
      return `${basePrompt}${personality.basePersonality.description} Write in a ${personality.basePersonality.tone} tone with expertise in ${personality.basePersonality.expertise.join(', ')}.`;
    }
    
    return `${basePrompt}Create engaging, informative, and well-structured content.`;
  }

  private buildDefaultUserPrompt(params: any): string {
    return `Create content about: ${params.topic}${params.keywords ? `\nKeywords: ${params.keywords.join(', ')}` : ''}${params.targetAudience ? `\nTarget audience: ${params.targetAudience}` : ''}${params.tone ? `\nTone: ${params.tone}` : ''}${params.length ? `\nTarget length: ${params.length} words` : ''}`;
  }

  private applyPersonalityToPrompt(prompt: string, personality: any): string {
    return `${prompt}\n\nPersonality Context:\n- Tone: ${personality.basePersonality.tone}\n- Expertise: ${personality.basePersonality.expertise.join(', ')}\n- Writing Style: ${personality.basePersonality.writingStyle}\n- Target Audience: ${personality.basePersonality.targetAudience}`;
  }

  private getMaxTokens(contentType: string): number {
    const tokenLimits = {
      article: 4000,
      social: 500,
      newsletter: 2000,
      video: 1500,
      podcast: 2000,
    };
    return tokenLimits[contentType as keyof typeof tokenLimits] || 2000;
  }

  private async analyzeContentQuality(content: string) {
    // This would integrate with actual content analysis services
    // For now, return mock analysis
    return {
      overallScore: 85,
      contentQuality: 88,
      seoOptimization: 82,
      readabilityScore: 90,
      engagementPrediction: 87,
      keywordDensity: { primary: 2.1, secondary: 1.8 },
      contentStructure: { headings: 5, paragraphs: 12, lists: 2 },
      toneAnalysis: { tone: 'professional', confidence: 0.92 },
      grammarCheck: { errors: 0, suggestions: 2 },
      improvementSuggestions: [
        'Add more specific examples',
        'Include a call-to-action',
        'Optimize for target keywords',
      ],
      priorityActions: [
        'Improve keyword density',
        'Add internal links',
        'Enhance readability',
      ],
    };
  }

  private async optimizeSEO(content: string, params: any): Promise<string> {
    // SEO optimization logic
    const optimized = content;
    // Add SEO improvements
    return optimized;
  }

  private async optimizeReadability(content: string): Promise<string> {
    // Readability optimization logic
    const optimized = content;
    // Add readability improvements
    return optimized;
  }

  private async optimizeEngagement(content: string): Promise<string> {
    // Engagement optimization logic
    const optimized = content;
    // Add engagement improvements
    return optimized;
  }

  private async applyPersonalization(content: string, personality: any, personalizationData?: any): Promise<string> {
    // Personalization logic
    const personalized = content;
    // Apply personalization based on personality and data
    return personalized;
  }

  private calculateNextRun(scheduleConfig: any): Date {
    // Calculate next run based on schedule configuration
    const now = new Date();
    // Add logic for different schedule types
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: next day
  }
} 