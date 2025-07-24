import { prisma } from '@/lib/prisma';
import { AIServiceManager } from './manager';
import { 
  ContentGenerationRequest, 
  ContentGenerationResponse,
  ContentType,
  AIPersonality 
} from './base';
import { z } from 'zod';

// Content generation request schema
const contentGenerationRequestSchema = z.object({
  siteId: z.number().int().positive(),
  contentType: z.enum(['article', 'summary', 'social', 'video_script', 'newsletter', 'press_release', 'blog_post']),
  topic: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  targetLength: z.number().positive().optional(),
  language: z.enum(['en', 'ar', 'bilingual']).optional(),
  template: z.string().optional(),
  context: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  categoryId: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.number().int().positive().optional(),
});

// Content generation result
export interface ContentGenerationResult {
  success: boolean;
  content?: any;
  error?: string;
  quality?: {
    score: number;
    readability: number;
    seo: number;
    accuracy: number;
  };
  usage?: {
    tokens: number;
    cost: number;
    model: string;
  };
  processingTime: number;
}

export class ContentGenerationService {
  private aiManager: AIServiceManager;

  constructor() {
    this.aiManager = AIServiceManager.getInstance();
  }

  async generateContent(request: any): Promise<ContentGenerationResult> {
    const startTime = Date.now();

    try {
      // Validate request
      const validatedRequest = contentGenerationRequestSchema.parse(request);

      // Check if site has AI configuration
      const siteConfig = await prisma.siteAiConfig.findUnique({
        where: { siteId: validatedRequest.siteId },
      });

      if (!siteConfig) {
        throw new Error(`No AI configuration found for site ${validatedRequest.siteId}`);
      }

      // Check budget if enabled
      if (siteConfig.costTracking && siteConfig.monthlyBudget) {
        const monthlyUsage = await this.getMonthlyUsage(validatedRequest.siteId);
        if (monthlyUsage >= siteConfig.monthlyBudget) {
          throw new Error('Monthly AI budget exceeded');
        }
      }

      // Prepare AI request
      const aiRequest: ContentGenerationRequest = {
        contentType: validatedRequest.contentType,
        topic: validatedRequest.topic,
        keywords: validatedRequest.keywords,
        targetLength: validatedRequest.targetLength,
        language: validatedRequest.language || 'en',
        template: validatedRequest.template,
        context: validatedRequest.context,
        requirements: validatedRequest.requirements,
      };

      // Generate content using AI
      const aiResponse = await this.aiManager.generateContent(
        validatedRequest.siteId,
        aiRequest
      );

      // Create content in database
      const content = await this.createContent(validatedRequest, aiResponse);

      // Log AI processing
      await this.logAIProcessing(validatedRequest, aiResponse);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        content,
        quality: aiResponse.quality,
        usage: aiResponse.usage,
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('Content generation error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      };
    }
  }

  async generateBatch(requests: any[]): Promise<ContentGenerationResult[]> {
    const results: ContentGenerationResult[] = [];
    
    // Group requests by site for efficient processing
    const requestsBySite = this.groupRequestsBySite(requests);
    
    for (const [siteId, siteRequests] of Object.entries(requestsBySite)) {
      try {
        // Validate all requests for this site
        const validatedRequests = siteRequests.map(req => 
          contentGenerationRequestSchema.parse({ ...req, siteId: parseInt(siteId) })
        );

        // Check budget for batch processing
        const siteConfig = await prisma.siteAiConfig.findUnique({
          where: { siteId: parseInt(siteId) },
        });

        if (siteConfig?.costTracking && siteConfig?.monthlyBudget) {
          const monthlyUsage = await this.getMonthlyUsage(parseInt(siteId));
          const estimatedCost = this.estimateBatchCost(validatedRequests);
          
          if (monthlyUsage + estimatedCost > siteConfig.monthlyBudget) {
            // Add error results for all requests in this batch
            validatedRequests.forEach(() => {
              results.push({
                success: false,
                error: 'Monthly AI budget exceeded',
                processingTime: 0,
              });
            });
            continue;
          }
        }

        // Prepare AI requests
        const aiRequests: ContentGenerationRequest[] = validatedRequests.map(req => ({
          contentType: req.contentType,
          topic: req.topic,
          keywords: req.keywords,
          targetLength: req.targetLength,
          language: req.language || 'en',
          template: req.template,
          context: req.context,
          requirements: req.requirements,
        }));

        // Generate content using AI batch processing
        const aiResponses = await this.aiManager.generateBatch(
          parseInt(siteId),
          aiRequests
        );

        // Process results
        for (let i = 0; i < validatedRequests.length; i++) {
          const startTime = Date.now();
          const request = validatedRequests[i];
          const aiResponse = aiResponses[i];

          try {
            if (aiResponse.content) {
              // Create content in database
              const content = await this.createContent(request, aiResponse);
              
              // Log AI processing
              await this.logAIProcessing(request, aiResponse);

              const processingTime = Date.now() - startTime;

              results.push({
                success: true,
                content,
                quality: aiResponse.quality,
                usage: aiResponse.usage,
                processingTime,
              });
            } else {
              results.push({
                success: false,
                error: 'AI generation failed',
                processingTime: Date.now() - startTime,
              });
            }
          } catch (error) {
            results.push({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              processingTime: Date.now() - startTime,
            });
          }
        }

      } catch (error) {
        // Add error results for all requests in this site batch
        siteRequests.forEach(() => {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: 0,
          });
        });
      }
    }

    return results;
  }

  private groupRequestsBySite(requests: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    requests.forEach(request => {
      const siteId = request.siteId?.toString() || 'unknown';
      if (!grouped[siteId]) {
        grouped[siteId] = [];
      }
      grouped[siteId].push(request);
    });
    
    return grouped;
  }

  private async createContent(request: any, aiResponse: ContentGenerationResponse): Promise<any> {
    const contentData: any = {
      siteId: request.siteId,
      title: aiResponse.title || this.generateTitle(request.topic),
      content: aiResponse.content,
      summary: aiResponse.summary,
      keywords: aiResponse.keywords || request.keywords || [],
      language: request.language || 'en',
      status: 'DRAFT',
      authorId: request.authorId,
      categoryId: request.categoryId,
      metadata: {
        aiGenerated: true,
        contentType: request.contentType,
        aiModel: aiResponse.usage?.model,
        generationCost: aiResponse.usage?.cost,
        qualityScore: aiResponse.quality?.score,
        ...aiResponse.metadata,
      },
    };

    // Create article
    const article = await prisma.article.create({
      data: contentData,
      include: {
        category: true,
        tags: true,
        author: true,
      },
    });

    // Add tags if provided
    if (request.tags && request.tags.length > 0) {
      const tagIds = await this.getOrCreateTags(request.siteId, request.tags);
      await prisma.article.update({
        where: { id: article.id },
        data: {
          tags: {
            connect: tagIds.map(id => ({ id })),
          },
        },
      });
    }

    return article;
  }

  private async logAIProcessing(request: any, aiResponse: ContentGenerationResponse): Promise<void> {
    await prisma.aiProcessingLog.create({
      data: {
        siteId: request.siteId,
        contentType: request.contentType,
        provider: aiResponse.usage?.model?.includes('gpt') ? 'openai' : 'gemini',
        model: aiResponse.usage?.model || 'unknown',
        responseTime: 0, // Will be updated by the calling method
        tokenCount: aiResponse.usage?.tokens || 0,
        cost: aiResponse.usage?.cost || 0,
        qualityScore: aiResponse.quality?.score || 0,
        accuracyScore: aiResponse.quality?.accuracy || 0,
        readabilityScore: aiResponse.quality?.readability || 0,
        status: 'success',
        contentId: null, // Will be updated after content creation
        contentType: 'article',
      },
    });
  }

  private generateTitle(topic: string): string {
    // Simple title generation - in practice, this could use AI
    return topic.charAt(0).toUpperCase() + topic.slice(1);
  }

  private async getOrCreateTags(siteId: number, tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];
    
    for (const tagName of tagNames) {
      const tag = await prisma.tag.upsert({
        where: {
          siteId_name: {
            siteId,
            name: tagName,
          },
        },
        update: {},
        create: {
          siteId,
          name: tagName,
          slug: this.generateSlug(tagName),
        },
      });
      
      tagIds.push(tag.id);
    }
    
    return tagIds;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async getMonthlyUsage(siteId: number): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.aiProcessingLog.aggregate({
      where: {
        siteId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        cost: true,
      },
    });

    return result._sum.cost || 0;
  }

  private estimateBatchCost(requests: any[]): number {
    // Rough estimation: $0.01 per request
    return requests.length * 0.01;
  }

  async getContentTemplates(siteId: number): Promise<any[]> {
    const siteConfig = await prisma.siteAiConfig.findUnique({
      where: { siteId },
    });

    if (!siteConfig?.contentTemplates) {
      return [];
    }

    return siteConfig.contentTemplates as any[];
  }

  async getQualityMetrics(siteId: number, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const logs = await prisma.aiProcessingLog.findMany({
      where: {
        siteId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(log => log.status === 'success').length;
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const avgQualityScore = logs.length > 0 
      ? logs.reduce((sum, log) => sum + (log.qualityScore || 0), 0) / logs.length 
      : 0;

    return {
      totalRequests,
      successfulRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      totalCost,
      averageQualityScore: avgQualityScore,
      averageResponseTime: logs.length > 0 
        ? logs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / logs.length 
        : 0,
    };
  }
} 