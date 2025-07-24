import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { OpenAIProcessor } from './openai';
import { GeminiProcessor } from './gemini';

// Validation schemas
const ContentSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['rss', 'api', 'scraper', 'social']),
  configuration: z.record(z.any()),
  reliabilityScore: z.number().min(0).max(1).default(0),
  isActive: z.boolean().default(true),
});

const DiscoveredContentSchema = z.object({
  sourceId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.date().optional(),
  author: z.string().optional(),
});

const ContentAnalysisSchema = z.object({
  relevanceScore: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(1),
  sentimentScore: z.number().min(-1).max(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()),
});

const ContentCurationSchema = z.object({
  contentId: z.string(),
  siteId: z.string(),
  selected: z.boolean().default(false),
  priority: z.number().min(0).default(0),
  scheduledAt: z.date().optional(),
  curatorNotes: z.string().optional(),
});

const TrendAnalysisSchema = z.object({
  keyword: z.string().min(1),
  category: z.string().optional(),
  volume: z.number().min(0),
  growth: z.number(),
  momentum: z.number(),
  sentiment: z.number().min(-1).max(1).optional(),
  sources: z.array(z.string()),
  opportunities: z.record(z.any()).optional(),
});

export interface ContentSource {
  id?: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper' | 'social';
  configuration: Record<string, any>;
  reliabilityScore?: number;
  isActive?: boolean;
  lastChecked?: Date;
}

export interface DiscoveredContent {
  id?: string;
  sourceId: string;
  title: string;
  description?: string;
  content: string;
  url: string;
  publishedAt?: Date;
  author?: string;
  relevanceScore?: number;
  qualityScore?: number;
  sentimentScore?: number;
  category?: string;
  tags?: string[];
  status?: string;
  processedAt?: Date;
}

export interface ContentAnalysis {
  relevanceScore: number;
  qualityScore: number;
  sentimentScore?: number;
  category?: string;
  tags: string[];
  summary?: string;
  keyPoints?: string[];
  recommendations?: string[];
}

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

export interface ContentTrend {
  id?: string;
  keyword: string;
  category?: string;
  volume: number;
  growth: number;
  momentum: number;
  sentiment?: number;
  sources: string[];
  opportunities?: Record<string, any>;
  detectedAt?: Date;
  expiresAt?: Date;
}

export interface ContentOpportunity {
  keyword: string;
  category: string;
  volume: number;
  competition: number;
  opportunity: number;
  recommendedContent: string[];
  estimatedImpact: number;
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

export class ContentDiscoveryService {
  private static instance: ContentDiscoveryService;
  private openaiProcessor: OpenAIProcessor;
  private geminiProcessor: GeminiProcessor;

  private constructor() {
    this.openaiProcessor = OpenAIProcessor.getInstance();
    this.geminiProcessor = GeminiProcessor.getInstance();
  }

  public static getInstance(): ContentDiscoveryService {
    if (!ContentDiscoveryService.instance) {
      ContentDiscoveryService.instance = new ContentDiscoveryService();
    }
    return ContentDiscoveryService.instance;
  }

  // Source Management
  async addSource(sourceData: ContentSource): Promise<ContentSource> {
    const validatedData = ContentSourceSchema.parse(sourceData);
    
    const source = await prisma.contentSource.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        type: validatedData.type,
        configuration: validatedData.configuration,
        reliabilityScore: validatedData.reliabilityScore || 0,
        isActive: validatedData.isActive ?? true,
      },
    });

    return source;
  }

  async updateSource(id: string, updates: Partial<ContentSource>): Promise<ContentSource> {
    const source = await prisma.contentSource.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return source;
  }

  async removeSource(id: string): Promise<void> {
    await prisma.contentSource.delete({
      where: { id },
    });
  }

  async getSources(): Promise<ContentSource[]> {
    const sources = await prisma.contentSource.findMany({
      where: { isActive: true },
      orderBy: { reliabilityScore: 'desc' },
    });

    return sources;
  }

  // Content Discovery
  async discoverContent(): Promise<DiscoveredContent[]> {
    const sources = await this.getSources();
    const discoveredContent: DiscoveredContent[] = [];

    for (const source of sources) {
      try {
        const content = await this.processSource(source.id!);
        discoveredContent.push(...content);
        
        // Update source last checked time
        await this.updateSource(source.id!, { lastChecked: new Date() });
      } catch (error) {
        console.error(`Error processing source ${source.id}:`, error);
        // Decrease reliability score for failed sources
        await this.updateSource(source.id!, { 
          reliabilityScore: Math.max(0, source.reliabilityScore - 0.1) 
        });
      }
    }

    return discoveredContent;
  }

  async processSource(sourceId: string): Promise<DiscoveredContent[]> {
    const source = await prisma.contentSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    let content: DiscoveredContent[] = [];

    switch (source.type) {
      case 'rss':
        content = await this.processRSSSource(source);
        break;
      case 'api':
        content = await this.processAPISource(source);
        break;
      case 'scraper':
        content = await this.processScraperSource(source);
        break;
      case 'social':
        content = await this.processSocialSource(source);
        break;
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }

    // Save discovered content
    const savedContent: DiscoveredContent[] = [];
    for (const item of content) {
      const saved = await prisma.discoveredContent.create({
        data: {
          sourceId: item.sourceId,
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          publishedAt: item.publishedAt,
          author: item.author,
          status: 'discovered',
        },
      });
      savedContent.push(saved);
    }

    return savedContent;
  }

  private async processRSSSource(source: any): Promise<DiscoveredContent[]> {
    // Implement RSS feed processing
    // This would use a library like 'rss-parser' to fetch and parse RSS feeds
    const content: DiscoveredContent[] = [];
    
    try {
      // Mock RSS processing for now
      // In real implementation, this would fetch RSS feed and parse items
      console.log(`Processing RSS source: ${source.url}`);
      
      // Example RSS item processing
      const mockRSSItems = [
        {
          title: 'Sample RSS Article',
          description: 'This is a sample RSS article description',
          content: 'This is the full content of the RSS article...',
          url: 'https://example.com/article1',
          publishedAt: new Date(),
          author: 'Sample Author',
        },
      ];

      for (const item of mockRSSItems) {
        content.push({
          sourceId: source.id,
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          publishedAt: item.publishedAt,
          author: item.author,
        });
      }
    } catch (error) {
      console.error(`Error processing RSS source ${source.url}:`, error);
    }

    return content;
  }

  private async processAPISource(source: any): Promise<DiscoveredContent[]> {
    // Implement API source processing
    const content: DiscoveredContent[] = [];
    
    try {
      console.log(`Processing API source: ${source.url}`);
      
      // Mock API processing for now
      // In real implementation, this would make API calls and process responses
      const mockAPIItems = [
        {
          title: 'Sample API Article',
          description: 'This is a sample API article description',
          content: 'This is the full content of the API article...',
          url: 'https://example.com/article2',
          publishedAt: new Date(),
          author: 'API Author',
        },
      ];

      for (const item of mockAPIItems) {
        content.push({
          sourceId: source.id,
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          publishedAt: item.publishedAt,
          author: item.author,
        });
      }
    } catch (error) {
      console.error(`Error processing API source ${source.url}:`, error);
    }

    return content;
  }

  private async processScraperSource(source: any): Promise<DiscoveredContent[]> {
    // Implement web scraper processing
    const content: DiscoveredContent[] = [];
    
    try {
      console.log(`Processing scraper source: ${source.url}`);
      
      // Mock scraper processing for now
      // In real implementation, this would use a library like 'puppeteer' or 'cheerio'
      const mockScrapedItems = [
        {
          title: 'Sample Scraped Article',
          description: 'This is a sample scraped article description',
          content: 'This is the full content of the scraped article...',
          url: 'https://example.com/article3',
          publishedAt: new Date(),
          author: 'Scraped Author',
        },
      ];

      for (const item of mockScrapedItems) {
        content.push({
          sourceId: source.id,
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          publishedAt: item.publishedAt,
          author: item.author,
        });
      }
    } catch (error) {
      console.error(`Error processing scraper source ${source.url}:`, error);
    }

    return content;
  }

  private async processSocialSource(source: any): Promise<DiscoveredContent[]> {
    // Implement social media source processing
    const content: DiscoveredContent[] = [];
    
    try {
      console.log(`Processing social source: ${source.url}`);
      
      // Mock social media processing for now
      // In real implementation, this would use social media APIs
      const mockSocialItems = [
        {
          title: 'Sample Social Post',
          description: 'This is a sample social media post',
          content: 'This is the full content of the social post...',
          url: 'https://example.com/social1',
          publishedAt: new Date(),
          author: 'Social Author',
        },
      ];

      for (const item of mockSocialItems) {
        content.push({
          sourceId: source.id,
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          publishedAt: item.publishedAt,
          author: item.author,
        });
      }
    } catch (error) {
      console.error(`Error processing social source ${source.url}:`, error);
    }

    return content;
  }

  // Content Analysis
  async analyzeContent(content: DiscoveredContent): Promise<ContentAnalysis> {
    const analysis = await this.performContentAnalysis(content);
    
    // Update content with analysis results
    await prisma.discoveredContent.update({
      where: { id: content.id },
      data: {
        relevanceScore: analysis.relevanceScore,
        qualityScore: analysis.qualityScore,
        sentimentScore: analysis.sentimentScore,
        category: analysis.category,
        tags: analysis.tags,
        status: 'analyzed',
        processedAt: new Date(),
      },
    });

    return analysis;
  }

  async batchAnalyzeContent(content: DiscoveredContent[]): Promise<ContentAnalysis[]> {
    const analyses: ContentAnalysis[] = [];

    for (const item of content) {
      try {
        const analysis = await this.analyzeContent(item);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing content ${item.id}:`, error);
        // Add default analysis for failed items
        analyses.push({
          relevanceScore: 0,
          qualityScore: 0,
          tags: [],
        });
      }
    }

    return analyses;
  }

  private async performContentAnalysis(content: DiscoveredContent): Promise<ContentAnalysis> {
    try {
      // Use AI to analyze content
      const prompt = `
        Analyze the following content for relevance, quality, sentiment, category, and tags:
        
        Title: ${content.title}
        Description: ${content.description || ''}
        Content: ${content.content.substring(0, 1000)}...
        
        Provide analysis in JSON format with the following structure:
        {
          "relevanceScore": 0.0-1.0,
          "qualityScore": 0.0-1.0,
          "sentimentScore": -1.0 to 1.0,
          "category": "string",
          "tags": ["tag1", "tag2"],
          "summary": "brief summary",
          "keyPoints": ["point1", "point2"],
          "recommendations": ["rec1", "rec2"]
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const analysis = JSON.parse(response);

      return {
        relevanceScore: analysis.relevanceScore || 0,
        qualityScore: analysis.qualityScore || 0,
        sentimentScore: analysis.sentimentScore,
        category: analysis.category,
        tags: analysis.tags || [],
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        recommendations: analysis.recommendations,
      };
    } catch (error) {
      console.error('Error performing content analysis:', error);
      // Return default analysis on error
      return {
        relevanceScore: 0.5,
        qualityScore: 0.5,
        tags: [],
      };
    }
  }

  // Quality Assessment
  async assessQuality(content: DiscoveredContent): Promise<{ score: number; issues: string[] }> {
    try {
      const prompt = `
        Assess the quality of the following content:
        
        Title: ${content.title}
        Content: ${content.content.substring(0, 1000)}...
        
        Provide quality assessment in JSON format:
        {
          "score": 0.0-1.0,
          "issues": ["issue1", "issue2"],
          "strengths": ["strength1", "strength2"]
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const assessment = JSON.parse(response);

      return {
        score: assessment.score || 0,
        issues: assessment.issues || [],
      };
    } catch (error) {
      console.error('Error assessing content quality:', error);
      return {
        score: 0.5,
        issues: ['Quality assessment failed'],
      };
    }
  }

  async validateContent(content: DiscoveredContent): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!content.title || content.title.length < 5) {
      errors.push('Title is too short');
    }

    if (!content.content || content.content.length < 50) {
      errors.push('Content is too short');
    }

    if (!content.url) {
      errors.push('URL is required');
    }

    // Check for spam indicators
    const spamIndicators = ['buy now', 'click here', 'limited time', 'act now'];
    const contentLower = content.content.toLowerCase();
    const spamCount = spamIndicators.filter(indicator => 
      contentLower.includes(indicator)
    ).length;

    if (spamCount > 2) {
      errors.push('Content appears to be spam');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Get discovered content
  async getDiscoveredContent(filters?: {
    status?: string;
    sourceId?: string;
    minRelevanceScore?: number;
    minQualityScore?: number;
  }): Promise<DiscoveredContent[]> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.sourceId) where.sourceId = filters.sourceId;
    if (filters?.minRelevanceScore) where.relevanceScore = { gte: filters.minRelevanceScore };
    if (filters?.minQualityScore) where.qualityScore = { gte: filters.minQualityScore };

    const content = await prisma.discoveredContent.findMany({
      where,
      include: {
        source: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return content;
  }
} 