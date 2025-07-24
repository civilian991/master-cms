import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { OpenAIProcessor } from './openai';
import { GeminiProcessor } from './gemini';

// Validation schemas
const ContentCurationSchema = z.object({
  contentId: z.string(),
  siteId: z.string(),
  selected: z.boolean().default(false),
  priority: z.number().min(0).default(0),
  scheduledAt: z.date().optional(),
  curatorNotes: z.string().optional(),
});

const DuplicateDetectionSchema = z.object({
  originalId: z.string(),
  duplicateId: z.string(),
  similarityScore: z.number().min(0).max(1),
});

const ContentEnrichmentSchema = z.object({
  contentId: z.string(),
  metadata: z.record(z.any()),
  summary: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const SchedulingOptimizationSchema = z.object({
  siteId: z.string(),
  contentIds: z.array(z.string()),
  timeRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

export interface ContentCuration {
  id?: string;
  contentId: string;
  siteId: string;
  selected?: boolean;
  priority?: number;
  scheduledAt?: Date;
  publishedAt?: Date;
  curatorNotes?: string;
  approvalStatus?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface DuplicateContent {
  id?: string;
  originalId: string;
  duplicateId: string;
  similarityScore: number;
  detectedAt?: Date;
}

export interface EnrichedContent {
  contentId: string;
  metadata: Record<string, any>;
  summary?: string;
  keyPoints?: string[];
  tags?: string[];
  enhancedContent?: string;
}

export interface SchedulingOptimization {
  siteId: string;
  recommendations: Array<{
    contentId: string;
    optimalTime: Date;
    expectedEngagement: number;
    reasoning: string;
  }>;
  conflicts: Array<{
    contentId: string;
    conflictType: string;
    resolution: string;
  }>;
}

export interface CurationWorkflow {
  id?: string;
  name: string;
  description?: string;
  triggers: Record<string, any>;
  steps: Array<{
    id: string;
    type: string;
    action: string;
    conditions?: Record<string, any>;
  }>;
  isActive?: boolean;
  lastExecuted?: Date;
}

export class ContentCurationService {
  private static instance: ContentCurationService;
  private openaiProcessor: OpenAIProcessor;
  private geminiProcessor: GeminiProcessor;

  private constructor() {
    this.openaiProcessor = OpenAIProcessor.getInstance();
    this.geminiProcessor = GeminiProcessor.getInstance();
  }

  public static getInstance(): ContentCurationService {
    if (!ContentCurationService.instance) {
      ContentCurationService.instance = new ContentCurationService();
    }
    return ContentCurationService.instance;
  }

  // Content Curation Management
  async curateContent(content: any[], siteId: string): Promise<ContentCuration[]> {
    const curations: ContentCuration[] = [];

    for (const item of content) {
      try {
        // Analyze content for site relevance
        const relevance = await this.analyzeSiteRelevance(item, siteId);
        
        if (relevance.score > 0.7) {
          const curation = await this.selectContent(item.id, siteId);
          curation.priority = relevance.priority;
          curations.push(curation);
        }
      } catch (error) {
        console.error(`Error curating content ${item.id}:`, error);
      }
    }

    return curations;
  }

  async selectContent(contentId: string, siteId: string): Promise<ContentCuration> {
    const validatedData = ContentCurationSchema.parse({
      contentId,
      siteId,
      selected: true,
    });

    const curation = await prisma.contentCuration.create({
      data: {
        contentId: validatedData.contentId,
        siteId: validatedData.siteId,
        selected: validatedData.selected,
        priority: validatedData.priority,
        approvalStatus: 'pending',
      },
    });

    return curation;
  }

  async prioritizeContent(curationId: string, priority: number): Promise<ContentCuration> {
    const curation = await prisma.contentCuration.update({
      where: { id: curationId },
      data: {
        priority,
        updatedAt: new Date(),
      },
    });

    return curation;
  }

  async approveContent(curationId: string, approvedBy: string): Promise<ContentCuration> {
    const curation = await prisma.contentCuration.update({
      where: { id: curationId },
      data: {
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return curation;
  }

  async rejectContent(curationId: string, reason: string): Promise<ContentCuration> {
    const curation = await prisma.contentCuration.update({
      where: { id: curationId },
      data: {
        approvalStatus: 'rejected',
        curatorNotes: reason,
        updatedAt: new Date(),
      },
    });

    return curation;
  }

  // Duplicate Detection
  async detectDuplicates(content: any): Promise<DuplicateContent[]> {
    const duplicates: DuplicateContent[] = [];

    try {
      // Get existing content for comparison
      const existingContent = await prisma.discoveredContent.findMany({
        where: {
          id: { not: content.id },
          status: { in: ['analyzed', 'curated'] },
        },
        take: 100, // Limit for performance
      });

      for (const existing of existingContent) {
        const similarity = await this.calculateSimilarity(content, existing);
        
        if (similarity > 0.8) {
          duplicates.push({
            originalId: content.id,
            duplicateId: existing.id,
            similarityScore: similarity,
            detectedAt: new Date(),
          });
        }
      }

      // Save detected duplicates
      for (const duplicate of duplicates) {
        await prisma.duplicateContent.create({
          data: duplicate,
        });
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
    }

    return duplicates;
  }

  async mergeDuplicates(originalId: string, duplicateIds: string[]): Promise<void> {
    try {
      // Get original content
      const original = await prisma.discoveredContent.findUnique({
        where: { id: originalId },
      });

      if (!original) {
        throw new Error(`Original content not found: ${originalId}`);
      }

      // Merge content from duplicates
      for (const duplicateId of duplicateIds) {
        const duplicate = await prisma.discoveredContent.findUnique({
          where: { id: duplicateId },
        });

        if (duplicate) {
          // Merge content (append duplicate content to original)
          const mergedContent = `${original.content}\n\n---\n\n${duplicate.content}`;
          
          await prisma.discoveredContent.update({
            where: { id: originalId },
            data: {
              content: mergedContent,
              updatedAt: new Date(),
            },
          });

          // Mark duplicate as merged
          await prisma.discoveredContent.update({
            where: { id: duplicateId },
            data: {
              status: 'merged',
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error merging duplicates:', error);
      throw error;
    }
  }

  private async calculateSimilarity(content1: any, content2: any): Promise<number> {
    try {
      const prompt = `
        Calculate the similarity between these two pieces of content (0.0 to 1.0):
        
        Content 1:
        Title: ${content1.title}
        Content: ${content1.content.substring(0, 500)}...
        
        Content 2:
        Title: ${content2.title}
        Content: ${content2.content.substring(0, 500)}...
        
        Consider:
        - Semantic similarity
        - Topic overlap
        - Key concepts
        - Writing style
        
        Return only a number between 0.0 and 1.0.
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const similarity = parseFloat(response.trim());
      
      return isNaN(similarity) ? 0 : Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }

  // Content Enrichment
  async enrichContent(content: any): Promise<EnrichedContent> {
    try {
      const enrichment = await this.performContentEnrichment(content);
      
      // Update content with enrichment data
      await prisma.discoveredContent.update({
        where: { id: content.id },
        data: {
          tags: enrichment.tags,
          updatedAt: new Date(),
        },
      });

      return enrichment;
    } catch (error) {
      console.error('Error enriching content:', error);
      throw error;
    }
  }

  async generateMetadata(content: any): Promise<Record<string, any>> {
    try {
      const prompt = `
        Generate comprehensive metadata for this content:
        
        Title: ${content.title}
        Content: ${content.content.substring(0, 1000)}...
        
        Provide metadata in JSON format:
        {
          "keywords": ["keyword1", "keyword2"],
          "topics": ["topic1", "topic2"],
          "entities": ["entity1", "entity2"],
          "sentiment": "positive|negative|neutral",
          "complexity": "simple|moderate|complex",
          "targetAudience": ["audience1", "audience2"],
          "contentType": "article|news|analysis|opinion",
          "estimatedReadingTime": "number in minutes"
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const metadata = JSON.parse(response);

      return metadata;
    } catch (error) {
      console.error('Error generating metadata:', error);
      return {
        keywords: [],
        topics: [],
        entities: [],
        sentiment: 'neutral',
        complexity: 'moderate',
        targetAudience: [],
        contentType: 'article',
        estimatedReadingTime: 5,
      };
    }
  }

  private async performContentEnrichment(content: any): Promise<EnrichedContent> {
    try {
      const prompt = `
        Enrich this content with summary, key points, and tags:
        
        Title: ${content.title}
        Content: ${content.content.substring(0, 1000)}...
        
        Provide enrichment in JSON format:
        {
          "summary": "brief summary",
          "keyPoints": ["point1", "point2", "point3"],
          "tags": ["tag1", "tag2", "tag3"],
          "enhancedContent": "content with improved formatting"
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const enrichment = JSON.parse(response);

      return {
        contentId: content.id,
        metadata: await this.generateMetadata(content),
        summary: enrichment.summary,
        keyPoints: enrichment.keyPoints || [],
        tags: enrichment.tags || [],
        enhancedContent: enrichment.enhancedContent,
      };
    } catch (error) {
      console.error('Error performing content enrichment:', error);
      return {
        contentId: content.id,
        metadata: {},
        summary: '',
        keyPoints: [],
        tags: [],
      };
    }
  }

  // Scheduling
  async scheduleContent(curationId: string, scheduledAt: Date): Promise<ContentCuration> {
    const curation = await prisma.contentCuration.update({
      where: { id: curationId },
      data: {
        scheduledAt,
        updatedAt: new Date(),
      },
    });

    return curation;
  }

  async optimizeSchedule(optimizationData: SchedulingOptimizationSchema): Promise<SchedulingOptimization> {
    const { siteId, contentIds, timeRange } = optimizationData;

    try {
      const recommendations = await this.generateSchedulingRecommendations(
        siteId,
        contentIds,
        timeRange
      );

      const conflicts = await this.detectSchedulingConflicts(siteId, timeRange);

      return {
        siteId,
        recommendations,
        conflicts,
      };
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      throw error;
    }
  }

  private async generateSchedulingRecommendations(
    siteId: string,
    contentIds: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{
    contentId: string;
    optimalTime: Date;
    expectedEngagement: number;
    reasoning: string;
  }>> {
    const recommendations = [];

    for (const contentId of contentIds) {
      try {
        const content = await prisma.discoveredContent.findUnique({
          where: { id: contentId },
        });

        if (content) {
          const recommendation = await this.analyzeOptimalTiming(content, siteId, timeRange);
          recommendations.push(recommendation);
        }
      } catch (error) {
        console.error(`Error generating recommendation for ${contentId}:`, error);
      }
    }

    return recommendations;
  }

  private async analyzeOptimalTiming(
    content: any,
    siteId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    contentId: string;
    optimalTime: Date;
    expectedEngagement: number;
    reasoning: string;
  }> {
    try {
      const prompt = `
        Analyze optimal publishing time for this content:
        
        Title: ${content.title}
        Category: ${content.category || 'general'}
        Tags: ${content.tags?.join(', ') || ''}
        
        Time Range: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}
        
        Consider:
        - Content type and audience
        - Optimal engagement times
        - Content freshness
        - Competition timing
        
        Provide recommendation in JSON format:
        {
          "optimalTime": "ISO date string",
          "expectedEngagement": 0.0-1.0,
          "reasoning": "explanation"
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const analysis = JSON.parse(response);

      return {
        contentId: content.id,
        optimalTime: new Date(analysis.optimalTime),
        expectedEngagement: analysis.expectedEngagement || 0.5,
        reasoning: analysis.reasoning || 'Default timing recommendation',
      };
    } catch (error) {
      console.error('Error analyzing optimal timing:', error);
      return {
        contentId: content.id,
        optimalTime: timeRange.start,
        expectedEngagement: 0.5,
        reasoning: 'Default timing due to analysis error',
      };
    }
  }

  private async detectSchedulingConflicts(
    siteId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{
    contentId: string;
    conflictType: string;
    resolution: string;
  }>> {
    const conflicts = [];

    try {
      // Check for existing scheduled content in the time range
      const existingScheduled = await prisma.contentCuration.findMany({
        where: {
          siteId,
          scheduledAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
          approvalStatus: 'approved',
        },
        include: {
          content: true,
        },
      });

      for (const scheduled of existingScheduled) {
        conflicts.push({
          contentId: scheduled.contentId,
          conflictType: 'time_overlap',
          resolution: 'Reschedule to avoid overlap',
        });
      }

      // Check for content type conflicts (e.g., too many similar articles)
      const contentTypes = await this.analyzeContentTypeDistribution(siteId, timeRange);
      
      for (const [contentType, count] of Object.entries(contentTypes)) {
        if (count > 3) { // More than 3 articles of same type
          conflicts.push({
            contentId: 'multiple',
            conflictType: 'content_type_overload',
            resolution: `Too many ${contentType} articles - diversify content`,
          });
        }
      }
    } catch (error) {
      console.error('Error detecting scheduling conflicts:', error);
    }

    return conflicts;
  }

  private async analyzeContentTypeDistribution(
    siteId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Record<string, number>> {
    const scheduled = await prisma.contentCuration.findMany({
      where: {
        siteId,
        scheduledAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
        approvalStatus: 'approved',
      },
      include: {
        content: true,
      },
    });

    const typeCount: Record<string, number> = {};
    
    for (const curation of scheduled) {
      const contentType = curation.content.category || 'general';
      typeCount[contentType] = (typeCount[contentType] || 0) + 1;
    }

    return typeCount;
  }

  // Site Relevance Analysis
  private async analyzeSiteRelevance(content: any, siteId: string): Promise<{
    score: number;
    priority: number;
    reasoning: string;
  }> {
    try {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
      });

      if (!site) {
        throw new Error(`Site not found: ${siteId}`);
      }

      const prompt = `
        Analyze how relevant this content is for the site "${site.name}":
        
        Content:
        Title: ${content.title}
        Category: ${content.category || 'general'}
        Tags: ${content.tags?.join(', ') || ''}
        
        Site: ${site.name}
        Site Type: ${site.type || 'general'}
        
        Provide analysis in JSON format:
        {
          "score": 0.0-1.0,
          "priority": 1-10,
          "reasoning": "explanation"
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const analysis = JSON.parse(response);

      return {
        score: analysis.score || 0,
        priority: analysis.priority || 5,
        reasoning: analysis.reasoning || 'Default relevance analysis',
      };
    } catch (error) {
      console.error('Error analyzing site relevance:', error);
      return {
        score: 0.5,
        priority: 5,
        reasoning: 'Default relevance due to analysis error',
      };
    }
  }

  // Get curated content
  async getCuratedContent(filters?: {
    siteId?: string;
    approvalStatus?: string;
    selected?: boolean;
  }): Promise<ContentCuration[]> {
    const where: any = {};

    if (filters?.siteId) where.siteId = filters.siteId;
    if (filters?.approvalStatus) where.approvalStatus = filters.approvalStatus;
    if (filters?.selected !== undefined) where.selected = filters.selected;

    const curations = await prisma.contentCuration.findMany({
      where,
      include: {
        content: true,
        site: true,
      },
      orderBy: { priority: 'desc' },
    });

    return curations;
  }
} 