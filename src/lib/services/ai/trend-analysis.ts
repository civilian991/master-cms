import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { OpenAIProcessor } from './openai';
import { GeminiProcessor } from './gemini';

// Validation schemas
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

const ContentOpportunitySchema = z.object({
  keyword: z.string().min(1),
  category: z.string(),
  volume: z.number().min(0),
  competition: z.number().min(0).max(1),
  opportunity: z.number().min(0).max(1),
  recommendedContent: z.array(z.string()),
  estimatedImpact: z.number().min(0).max(1),
});

const CompetitiveAnalysisSchema = z.object({
  competitor: z.string(),
  contentAnalysis: z.record(z.any()),
  performanceMetrics: z.record(z.any()),
  recommendations: z.array(z.string()),
});

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

export interface CompetitiveAnalysis {
  competitor: string;
  contentAnalysis: Record<string, any>;
  performanceMetrics: Record<string, any>;
  recommendations: string[];
}

export interface TrendAlert {
  id?: string;
  keyword: string;
  threshold: number;
  condition: 'above' | 'below' | 'change';
  isActive: boolean;
  lastTriggered?: Date;
  createdAt?: Date;
}

export interface TrendPrediction {
  keyword: string;
  predictedVolume: number;
  confidence: number;
  timeframe: '1d' | '7d' | '30d';
  factors: string[];
}

export class TrendAnalysisService {
  private static instance: TrendAnalysisService;
  private openaiProcessor: OpenAIProcessor;
  private geminiProcessor: GeminiProcessor;

  private constructor() {
    this.openaiProcessor = OpenAIProcessor.getInstance();
    this.geminiProcessor = GeminiProcessor.getInstance();
  }

  public static getInstance(): TrendAnalysisService {
    if (!TrendAnalysisService.instance) {
      TrendAnalysisService.instance = new TrendAnalysisService();
    }
    return TrendAnalysisService.instance;
  }

  // Trend Detection
  async detectTrends(): Promise<ContentTrend[]> {
    const trends: ContentTrend[] = [];

    try {
      // Analyze recent content for trending topics
      const recentContent = await prisma.discoveredContent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
          status: { in: ['analyzed', 'curated'] },
        },
        take: 100,
      });

      // Extract keywords and analyze trends
      const keywordAnalysis = await this.analyzeKeywords(recentContent);
      
      for (const [keyword, data] of Object.entries(keywordAnalysis)) {
        if (data.volume > 5 && data.growth > 0.2) { // Minimum threshold for trend
          const trend = await this.createTrend(keyword, data);
          trends.push(trend);
        }
      }

      // Save trends to database
      for (const trend of trends) {
        await prisma.contentTrend.create({
          data: {
            keyword: trend.keyword,
            category: trend.category,
            volume: trend.volume,
            growth: trend.growth,
            momentum: trend.momentum,
            sentiment: trend.sentiment,
            sources: trend.sources,
            opportunities: trend.opportunities,
            detectedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }
    } catch (error) {
      console.error('Error detecting trends:', error);
    }

    return trends;
  }

  async analyzeTrend(keyword: string): Promise<{
    trend: ContentTrend;
    analysis: Record<string, any>;
    predictions: TrendPrediction[];
  }> {
    try {
      // Get existing trend or create new one
      let trend = await prisma.contentTrend.findFirst({
        where: { keyword },
        orderBy: { detectedAt: 'desc' },
      });

      if (!trend) {
        // Create new trend analysis
        const trendData = await this.analyzeKeywordTrend(keyword);
        trend = await prisma.contentTrend.create({
          data: {
            keyword,
            category: trendData.category,
            volume: trendData.volume,
            growth: trendData.growth,
            momentum: trendData.momentum,
            sentiment: trendData.sentiment,
            sources: trendData.sources,
            opportunities: trendData.opportunities,
            detectedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Perform detailed analysis
      const analysis = await this.performTrendAnalysis(keyword);
      
      // Generate predictions
      const predictions = await this.predictTrend(keyword);

      return {
        trend,
        analysis,
        predictions,
      };
    } catch (error) {
      console.error('Error analyzing trend:', error);
      throw error;
    }
  }

  async predictTrends(): Promise<TrendPrediction[]> {
    const predictions: TrendPrediction[] = [];

    try {
      // Get active trends
      const activeTrends = await prisma.contentTrend.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { volume: 'desc' },
        take: 20,
      });

      for (const trend of activeTrends) {
        const prediction = await this.predictTrend(trend.keyword);
        predictions.push(...prediction);
      }
    } catch (error) {
      console.error('Error predicting trends:', error);
    }

    return predictions;
  }

  // Opportunity Detection
  async identifyOpportunities(): Promise<ContentOpportunity[]> {
    const opportunities: ContentOpportunity[] = [];

    try {
      // Analyze current trends for opportunities
      const trends = await prisma.contentTrend.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { volume: 'desc' },
        take: 50,
      });

      for (const trend of trends) {
        const opportunity = await this.analyzeOpportunity(trend);
        if (opportunity.opportunity > 0.6) { // High opportunity threshold
          opportunities.push(opportunity);
        }
      }

      // Analyze content gaps
      const contentGaps = await this.analyzeContentGaps();
      opportunities.push(...contentGaps);
    } catch (error) {
      console.error('Error identifying opportunities:', error);
    }

    return opportunities;
  }

  async analyzeCompetition(): Promise<CompetitiveAnalysis[]> {
    const analyses: CompetitiveAnalysis[] = [];

    try {
      // Define competitors (this would be configurable per site)
      const competitors = [
        'techcrunch.com',
        'wired.com',
        'theverge.com',
        'arstechnica.com',
      ];

      for (const competitor of competitors) {
        const analysis = await this.performCompetitiveAnalysis(competitor);
        analyses.push(analysis);
      }
    } catch (error) {
      console.error('Error analyzing competition:', error);
    }

    return analyses;
  }

  // Alert System
  async setupTrendAlerts(keywords: string[]): Promise<void> {
    for (const keyword of keywords) {
      try {
        await prisma.trendAlert.create({
          data: {
            keyword,
            threshold: 0.5,
            condition: 'above',
            isActive: true,
          },
        });
      } catch (error) {
        console.error(`Error setting up alert for ${keyword}:`, error);
      }
    }
  }

  async sendTrendNotifications(trends: ContentTrend[]): Promise<void> {
    for (const trend of trends) {
      try {
        // Check if trend meets alert conditions
        const alerts = await prisma.trendAlert.findMany({
          where: {
            keyword: trend.keyword,
            isActive: true,
          },
        });

        for (const alert of alerts) {
          const shouldTrigger = this.evaluateAlertCondition(alert, trend);
          
          if (shouldTrigger) {
            await this.triggerAlert(alert, trend);
          }
        }
      } catch (error) {
        console.error(`Error sending notification for trend ${trend.keyword}:`, error);
      }
    }
  }

  // Private helper methods
  private async analyzeKeywords(content: any[]): Promise<Record<string, any>> {
    const keywordCount: Record<string, any> = {};

    try {
      for (const item of content) {
        const keywords = await this.extractKeywords(item);
        
        for (const keyword of keywords) {
          if (!keywordCount[keyword]) {
            keywordCount[keyword] = {
              volume: 0,
              growth: 0,
              momentum: 0,
              sentiment: 0,
              sources: new Set(),
            };
          }
          
          keywordCount[keyword].volume++;
          keywordCount[keyword].sources.add(item.sourceId);
          
          // Calculate sentiment (simplified)
          if (item.sentimentScore) {
            keywordCount[keyword].sentiment += item.sentimentScore;
          }
        }
      }

      // Calculate growth and momentum
      for (const [keyword, data] of Object.entries(keywordCount)) {
        data.sources = Array.from(data.sources);
        data.sentiment = data.sentiment / data.volume;
        data.growth = this.calculateGrowth(keyword, data.volume);
        data.momentum = this.calculateMomentum(keyword, data.volume);
      }
    } catch (error) {
      console.error('Error analyzing keywords:', error);
    }

    return keywordCount;
  }

  private async extractKeywords(content: any): Promise<string[]> {
    try {
      const prompt = `
        Extract key topics and keywords from this content:
        
        Title: ${content.title}
        Content: ${content.content.substring(0, 500)}...
        
        Return only a JSON array of keywords: ["keyword1", "keyword2", "keyword3"]
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const keywords = JSON.parse(response);
      
      return Array.isArray(keywords) ? keywords : [];
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  private calculateGrowth(keyword: string, currentVolume: number): number {
    // Simplified growth calculation
    // In real implementation, this would compare with historical data
    return Math.random() * 0.5; // Mock growth rate
  }

  private calculateMomentum(keyword: string, volume: number): number {
    // Simplified momentum calculation
    // In real implementation, this would analyze velocity of change
    return Math.random() * 0.3; // Mock momentum
  }

  private async createTrend(keyword: string, data: any): Promise<ContentTrend> {
    return {
      keyword,
      category: await this.categorizeKeyword(keyword),
      volume: data.volume,
      growth: data.growth,
      momentum: data.momentum,
      sentiment: data.sentiment,
      sources: data.sources,
      opportunities: await this.identifyTrendOpportunities(keyword, data),
      detectedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  private async categorizeKeyword(keyword: string): Promise<string> {
    try {
      const prompt = `
        Categorize this keyword into a content category:
        
        Keyword: ${keyword}
        
        Categories: technology, business, politics, entertainment, sports, science, health, education, finance, lifestyle
        
        Return only the category name.
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      return response.trim().toLowerCase();
    } catch (error) {
      console.error('Error categorizing keyword:', error);
      return 'general';
    }
  }

  private async identifyTrendOpportunities(keyword: string, data: any): Promise<Record<string, any>> {
    try {
      const prompt = `
        Identify content opportunities for this trending keyword:
        
        Keyword: ${keyword}
        Volume: ${data.volume}
        Growth: ${data.growth}
        Sentiment: ${data.sentiment}
        
        Provide opportunities in JSON format:
        {
          "contentTypes": ["article", "video", "infographic"],
          "angles": ["angle1", "angle2"],
          "targetAudience": ["audience1", "audience2"],
          "estimatedEngagement": 0.0-1.0
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error identifying opportunities:', error);
      return {
        contentTypes: ['article'],
        angles: ['general'],
        targetAudience: ['general'],
        estimatedEngagement: 0.5,
      };
    }
  }

  private async analyzeKeywordTrend(keyword: string): Promise<any> {
    try {
      const prompt = `
        Analyze the trend for this keyword:
        
        Keyword: ${keyword}
        
        Provide analysis in JSON format:
        {
          "category": "category",
          "volume": 0-100,
          "growth": 0.0-1.0,
          "momentum": 0.0-1.0,
          "sentiment": -1.0 to 1.0,
          "sources": ["source1", "source2"],
          "opportunities": {}
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing keyword trend:', error);
      return {
        category: 'general',
        volume: 10,
        growth: 0.2,
        momentum: 0.1,
        sentiment: 0,
        sources: [],
        opportunities: {},
      };
    }
  }

  private async performTrendAnalysis(keyword: string): Promise<Record<string, any>> {
    try {
      const prompt = `
        Perform detailed trend analysis for this keyword:
        
        Keyword: ${keyword}
        
        Provide comprehensive analysis in JSON format:
        {
          "trendStrength": 0.0-1.0,
          "audienceInterest": 0.0-1.0,
          "contentGaps": ["gap1", "gap2"],
          "competitionLevel": "low|medium|high",
          "recommendedActions": ["action1", "action2"],
          "riskFactors": ["risk1", "risk2"]
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error performing trend analysis:', error);
      return {
        trendStrength: 0.5,
        audienceInterest: 0.5,
        contentGaps: [],
        competitionLevel: 'medium',
        recommendedActions: [],
        riskFactors: [],
      };
    }
  }

  private async predictTrend(keyword: string): Promise<TrendPrediction[]> {
    const predictions: TrendPrediction[] = [];

    try {
      const timeframes: Array<'1d' | '7d' | '30d'> = ['1d', '7d', '30d'];
      
      for (const timeframe of timeframes) {
        const prediction = await this.generatePrediction(keyword, timeframe);
        predictions.push(prediction);
      }
    } catch (error) {
      console.error('Error predicting trend:', error);
    }

    return predictions;
  }

  private async generatePrediction(keyword: string, timeframe: '1d' | '7d' | '30d'): Promise<TrendPrediction> {
    try {
      const prompt = `
        Predict trend for this keyword in ${timeframe}:
        
        Keyword: ${keyword}
        Timeframe: ${timeframe}
        
        Provide prediction in JSON format:
        {
          "predictedVolume": 0-100,
          "confidence": 0.0-1.0,
          "factors": ["factor1", "factor2"]
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const prediction = JSON.parse(response);

      return {
        keyword,
        predictedVolume: prediction.predictedVolume || 10,
        confidence: prediction.confidence || 0.5,
        timeframe,
        factors: prediction.factors || [],
      };
    } catch (error) {
      console.error('Error generating prediction:', error);
      return {
        keyword,
        predictedVolume: 10,
        confidence: 0.5,
        timeframe,
        factors: ['Default prediction'],
      };
    }
  }

  private async analyzeOpportunity(trend: ContentTrend): Promise<ContentOpportunity> {
    try {
      const prompt = `
        Analyze content opportunity for this trend:
        
        Keyword: ${trend.keyword}
        Volume: ${trend.volume}
        Growth: ${trend.growth}
        Category: ${trend.category}
        
        Provide opportunity analysis in JSON format:
        {
          "competition": 0.0-1.0,
          "opportunity": 0.0-1.0,
          "recommendedContent": ["content1", "content2"],
          "estimatedImpact": 0.0-1.0
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const analysis = JSON.parse(response);

      return {
        keyword: trend.keyword,
        category: trend.category || 'general',
        volume: trend.volume,
        competition: analysis.competition || 0.5,
        opportunity: analysis.opportunity || 0.5,
        recommendedContent: analysis.recommendedContent || [],
        estimatedImpact: analysis.estimatedImpact || 0.5,
      };
    } catch (error) {
      console.error('Error analyzing opportunity:', error);
      return {
        keyword: trend.keyword,
        category: trend.category || 'general',
        volume: trend.volume,
        competition: 0.5,
        opportunity: 0.5,
        recommendedContent: [],
        estimatedImpact: 0.5,
      };
    }
  }

  private async analyzeContentGaps(): Promise<ContentOpportunity[]> {
    const gaps: ContentOpportunity[] = [];

    try {
      // Analyze what content is missing based on trends
      const trends = await prisma.contentTrend.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { volume: 'desc' },
        take: 20,
      });

      for (const trend of trends) {
        // Check if we have content for this trend
        const existingContent = await prisma.discoveredContent.findMany({
          where: {
            OR: [
              { title: { contains: trend.keyword, mode: 'insensitive' } },
              { tags: { has: trend.keyword } },
            ],
          },
        });

        if (existingContent.length < 3) { // Gap if less than 3 articles
          gaps.push({
            keyword: trend.keyword,
            category: trend.category || 'general',
            volume: trend.volume,
            competition: 0.3, // Lower competition for gaps
            opportunity: 0.8, // High opportunity for gaps
            recommendedContent: [`Create comprehensive article about ${trend.keyword}`],
            estimatedImpact: 0.7,
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing content gaps:', error);
    }

    return gaps;
  }

  private async performCompetitiveAnalysis(competitor: string): Promise<CompetitiveAnalysis> {
    try {
      const prompt = `
        Analyze this competitor's content strategy:
        
        Competitor: ${competitor}
        
        Provide competitive analysis in JSON format:
        {
          "contentAnalysis": {
            "topics": ["topic1", "topic2"],
            "tone": "formal|casual|technical",
            "frequency": "daily|weekly|monthly"
          },
          "performanceMetrics": {
            "engagement": 0.0-1.0,
            "reach": 0.0-1.0,
            "consistency": 0.0-1.0
          },
          "recommendations": ["rec1", "rec2"]
        }
      `;

      const response = await this.openaiProcessor.generateText(prompt);
      const analysis = JSON.parse(response);

      return {
        competitor,
        contentAnalysis: analysis.contentAnalysis || {},
        performanceMetrics: analysis.performanceMetrics || {},
        recommendations: analysis.recommendations || [],
      };
    } catch (error) {
      console.error('Error performing competitive analysis:', error);
      return {
        competitor,
        contentAnalysis: {},
        performanceMetrics: {},
        recommendations: ['Default competitive analysis'],
      };
    }
  }

  private evaluateAlertCondition(alert: TrendAlert, trend: ContentTrend): boolean {
    switch (alert.condition) {
      case 'above':
        return trend.volume > alert.threshold;
      case 'below':
        return trend.volume < alert.threshold;
      case 'change':
        return Math.abs(trend.growth) > alert.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(alert: TrendAlert, trend: ContentTrend): Promise<void> {
    try {
      // Update alert last triggered time
      await prisma.trendAlert.update({
        where: { id: alert.id },
        data: { lastTriggered: new Date() },
      });

      // Send notification (implement notification service)
      console.log(`Trend alert triggered: ${alert.keyword} - ${trend.volume} volume`);
      
      // In real implementation, this would send email, Slack, etc.
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  // Get trends
  async getTrends(filters?: {
    category?: string;
    minVolume?: number;
    activeOnly?: boolean;
  }): Promise<ContentTrend[]> {
    const where: any = {};

    if (filters?.category) where.category = filters.category;
    if (filters?.minVolume) where.volume = { gte: filters.minVolume };
    if (filters?.activeOnly) where.expiresAt = { gt: new Date() };

    const trends = await prisma.contentTrend.findMany({
      where,
      orderBy: { volume: 'desc' },
    });

    return trends;
  }
} 