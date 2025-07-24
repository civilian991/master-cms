import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SEOToolsService } from '@/lib/services/seo-tools';
import { 
  SEOKeywordStatus, 
  SEOCompetitorStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sEOKeyword: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sEOCompetitor: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
    },
  },
}));

describe('SEOToolsService', () => {
  let seoToolsService: SEOToolsService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    seoToolsService = new SEOToolsService();
    jest.clearAllMocks();
  });

  describe('createSEOKeyword', () => {
    it('should create a new SEO keyword', async () => {
      const keywordData = {
        keyword: 'digital marketing',
        searchVolume: 5000,
        difficulty: 45,
        cpc: 2.50,
        position: 15,
        url: 'https://example.com/digital-marketing',
        siteId: 'site-1',
      };

      const mockKeyword = {
        id: 'keyword-1',
        ...keywordData,
        status: SEOKeywordStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.sEOKeyword.create.mockResolvedValue(mockKeyword);
      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await seoToolsService.createSEOKeyword(keywordData);

      expect(mockPrisma.sEOKeyword.create).toHaveBeenCalledWith({
        data: {
          keyword: keywordData.keyword,
          searchVolume: keywordData.searchVolume,
          difficulty: keywordData.difficulty,
          cpc: keywordData.cpc,
          position: keywordData.position,
          url: keywordData.url,
          siteId: keywordData.siteId,
        },
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'seo_keyword_added',
          value: 1,
          date: expect.any(Date),
          siteId: keywordData.siteId,
          metadata: { keywordId: mockKeyword.id, keyword: keywordData.keyword },
        },
      });

      expect(result).toEqual(mockKeyword);
    });
  });

  describe('getSEOKeywords', () => {
    it('should return SEO keywords with default options', async () => {
      const mockKeywords = [
        {
          id: 'keyword-1',
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          cpc: 2.50,
          position: 15,
          url: 'https://example.com/digital-marketing',
          status: SEOKeywordStatus.ACTIVE,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.sEOKeyword.findMany.mockResolvedValue(mockKeywords);

      const result = await seoToolsService.getSEOKeywords('site-1');

      expect(mockPrisma.sEOKeyword.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        orderBy: { searchVolume: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockKeywords);
    });

    it('should return SEO keywords with custom options', async () => {
      const options = {
        status: SEOKeywordStatus.ACTIVE,
        minSearchVolume: 1000,
        maxDifficulty: 50,
        hasPosition: true,
        limit: 10,
        offset: 20,
      };

      mockPrisma.sEOKeyword.findMany.mockResolvedValue([]);

      await seoToolsService.getSEOKeywords('site-1', options);

      expect(mockPrisma.sEOKeyword.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: SEOKeywordStatus.ACTIVE,
          searchVolume: { gte: 1000 },
          difficulty: { lte: 50 },
          position: { not: null },
        },
        orderBy: { searchVolume: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('updateSEOKeyword', () => {
    it('should update SEO keyword successfully', async () => {
      const updateData = {
        keyword: 'updated keyword',
        searchVolume: 6000,
        difficulty: 50,
      };

      const mockUpdatedKeyword = {
        id: 'keyword-1',
        ...updateData,
        cpc: 2.50,
        position: 15,
        url: 'https://example.com/updated-keyword',
        status: SEOKeywordStatus.ACTIVE,
        siteId: 'site-1',
      };

      mockPrisma.sEOKeyword.update.mockResolvedValue(mockUpdatedKeyword);

      const result = await seoToolsService.updateSEOKeyword('keyword-1', updateData);

      expect(mockPrisma.sEOKeyword.update).toHaveBeenCalledWith({
        where: { id: 'keyword-1' },
        data: updateData,
      });

      expect(result).toEqual(mockUpdatedKeyword);
    });
  });

  describe('deleteSEOKeyword', () => {
    it('should delete SEO keyword successfully', async () => {
      mockPrisma.sEOKeyword.delete.mockResolvedValue({});

      const result = await seoToolsService.deleteSEOKeyword('keyword-1');

      expect(mockPrisma.sEOKeyword.delete).toHaveBeenCalledWith({
        where: { id: 'keyword-1' },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('researchKeywords', () => {
    it('should research keywords successfully', async () => {
      const query = 'digital marketing';
      const siteId = 'site-1';

      const result = await seoToolsService.researchKeywords(query, siteId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('keyword');
      expect(result[0]).toHaveProperty('searchVolume');
      expect(result[0]).toHaveProperty('difficulty');
      expect(result[0]).toHaveProperty('cpc');
    });
  });

  describe('createSEOCompetitor', () => {
    it('should create a new SEO competitor', async () => {
      const competitorData = {
        domain: 'competitor.com',
        name: 'Competitor Inc',
        metrics: { organicTraffic: 100000, organicKeywords: 5000 },
        keywords: { shared: 50 },
        siteId: 'site-1',
      };

      const mockCompetitor = {
        id: 'competitor-1',
        ...competitorData,
        status: SEOCompetitorStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.sEOCompetitor.create.mockResolvedValue(mockCompetitor);

      const result = await seoToolsService.createSEOCompetitor(competitorData);

      expect(mockPrisma.sEOCompetitor.create).toHaveBeenCalledWith({
        data: {
          domain: competitorData.domain,
          name: competitorData.name,
          metrics: competitorData.metrics,
          keywords: competitorData.keywords,
          siteId: competitorData.siteId,
        },
      });

      expect(result).toEqual(mockCompetitor);
    });
  });

  describe('getSEOCompetitors', () => {
    it('should return SEO competitors', async () => {
      const mockCompetitors = [
        {
          id: 'competitor-1',
          domain: 'competitor.com',
          name: 'Competitor Inc',
          metrics: { organicTraffic: 100000 },
          keywords: { shared: 50 },
          status: SEOCompetitorStatus.ACTIVE,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.sEOCompetitor.findMany.mockResolvedValue(mockCompetitors);

      const result = await seoToolsService.getSEOCompetitors('site-1');

      expect(mockPrisma.sEOCompetitor.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockCompetitors);
    });
  });

  describe('analyzeCompetitor', () => {
    it('should analyze competitor successfully', async () => {
      const domain = 'competitor.com';
      const siteId = 'site-1';

      const result = await seoToolsService.analyzeCompetitor(domain, siteId);

      expect(result).toHaveProperty('domain', domain);
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('topKeywords');
      expect(result).toHaveProperty('sharedKeywords');
      expect(result).toHaveProperty('trafficShare');
    });
  });

  describe('trackSEOPerformance', () => {
    it('should track SEO performance successfully', async () => {
      const siteId = 'site-1';
      const metrics = {
        organicTraffic: 50000,
        organicKeywords: 1000,
        averagePosition: 15.5,
        clickThroughRate: 3.2,
        impressions: 100000,
        clicks: 3200,
        conversions: 160,
        conversionRate: 5.0,
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await seoToolsService.trackSEOPerformance(siteId, metrics);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'seo_performance',
          value: metrics.organicTraffic,
          date: expect.any(Date),
          siteId,
          metadata: metrics,
        },
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('getSEOAnalytics', () => {
    it('should return SEO analytics', async () => {
      const mockKeywords = [
        {
          id: 'keyword-1',
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          position: 15,
          status: SEOKeywordStatus.ACTIVE,
        },
        {
          id: 'keyword-2',
          keyword: 'seo tools',
          searchVolume: 3000,
          difficulty: 35,
          position: 5,
          status: SEOKeywordStatus.ACTIVE,
        },
      ];

      const mockCompetitors = [
        {
          id: 'competitor-1',
          domain: 'competitor.com',
          name: 'Competitor Inc',
          keywords: { shared: 50 },
          status: SEOCompetitorStatus.ACTIVE,
        },
      ];

      mockPrisma.sEOKeyword.findMany.mockResolvedValue(mockKeywords);
      mockPrisma.sEOCompetitor.findMany.mockResolvedValue(mockCompetitors);

      const result = await seoToolsService.getSEOAnalytics('site-1');

      expect(result).toEqual({
        totalKeywords: 2,
        rankingKeywords: 2,
        averagePosition: 10,
        totalTraffic: 8000,
        topPerformingKeywords: expect.any(Array),
        competitorAnalysis: expect.any(Array),
        performanceTrends: expect.any(Array),
      });
    });
  });

  describe('generateSEORecommendations', () => {
    it('should generate SEO recommendations', async () => {
      const mockKeywords = [
        {
          id: 'keyword-1',
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          position: 25, // Low ranking
          status: SEOKeywordStatus.ACTIVE,
        },
        {
          id: 'keyword-2',
          keyword: 'seo tools',
          searchVolume: 3000,
          difficulty: 35,
          position: 5, // High ranking
          status: SEOKeywordStatus.ACTIVE,
        },
      ];

      mockPrisma.sEOKeyword.findMany.mockResolvedValue(mockKeywords);

      const result = await seoToolsService.generateSEORecommendations('site-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('impact');
      expect(result[0]).toHaveProperty('effort');
      expect(result[0]).toHaveProperty('estimatedTraffic');
      expect(result[0]).toHaveProperty('estimatedConversions');
      expect(result[0]).toHaveProperty('actions');
    });
  });

  describe('createSEOWorkflow', () => {
    it('should create SEO workflow successfully', async () => {
      const workflowData = {
        name: 'Weekly SEO Audit',
        description: 'Automated weekly SEO audit workflow',
        triggers: ['weekly'],
        actions: [
          {
            type: 'keyword_research',
            parameters: { query: 'digital marketing' },
            schedule: 'weekly',
          },
        ],
        isActive: true,
        siteId: 'site-1',
        createdBy: 'user-1',
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await seoToolsService.createSEOWorkflow(workflowData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(workflowData.name);
      expect(result.triggers).toEqual(workflowData.triggers);
      expect(result.actions).toEqual(workflowData.actions);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'seo_workflow_created',
          value: 1,
          date: expect.any(Date),
          siteId: workflowData.siteId,
          metadata: { workflowId: result.id },
        },
      });
    });
  });

  describe('executeSEOWorkflow', () => {
    it('should execute SEO workflow successfully', async () => {
      const workflowId = 'workflow-1';
      const siteId = 'site-1';

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await seoToolsService.executeSEOWorkflow(workflowId, siteId);

      expect(result).toEqual({
        workflowId,
        siteId,
        status: 'executed',
        actions: expect.any(Array),
      });

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'seo_workflow_executed',
          value: 1,
          date: expect.any(Date),
          siteId,
          metadata: {
            workflowId,
            result: expect.any(Object),
          },
        },
      });
    });
  });

  describe('bulkImportSEOKeywords', () => {
    it('should bulk import SEO keywords successfully', async () => {
      const keywords = [
        {
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          siteId: 'site-1',
        },
        {
          keyword: 'seo tools',
          searchVolume: 3000,
          difficulty: 35,
          siteId: 'site-1',
        },
      ];

      mockPrisma.sEOKeyword.create
        .mockResolvedValueOnce({ id: 'keyword-1', ...keywords[0] })
        .mockResolvedValueOnce({ id: 'keyword-2', ...keywords[1] });

      const result = await seoToolsService.bulkImportSEOKeywords(keywords);

      expect(result).toEqual({
        success: 2,
        errors: 0,
        results: expect.any(Array),
        errorDetails: expect.any(Array),
      });

      expect(mockPrisma.sEOKeyword.create).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during bulk import', async () => {
      const keywords = [
        {
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          siteId: 'site-1',
        },
      ];

      mockPrisma.sEOKeyword.create.mockRejectedValue(new Error('Database error'));

      const result = await seoToolsService.bulkImportSEOKeywords(keywords);

      expect(result.success).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toHaveLength(1);
    });
  });

  describe('exportSEOData', () => {
    it('should export SEO data in CSV format', async () => {
      const mockKeywords = [
        {
          id: 'keyword-1',
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          cpc: 2.50,
          position: 15,
          url: 'https://example.com/digital-marketing',
          status: SEOKeywordStatus.ACTIVE,
        },
      ];

      mockPrisma.sEOKeyword.findMany.mockResolvedValue(mockKeywords);
      mockPrisma.sEOCompetitor.findMany.mockResolvedValue([]);

      const result = await seoToolsService.exportSEOData('site-1', 'csv');

      expect(result).toContain('Keyword,Search Volume,Difficulty,CPC,Position,URL,Status');
      expect(result).toContain('digital marketing,5000,45,2.5,15,https://example.com/digital-marketing,ACTIVE');
    });

    it('should export SEO data in JSON format', async () => {
      const mockKeywords = [
        {
          id: 'keyword-1',
          keyword: 'digital marketing',
          searchVolume: 5000,
          difficulty: 45,
          status: SEOKeywordStatus.ACTIVE,
        },
      ];

      mockPrisma.sEOKeyword.findMany.mockResolvedValue(mockKeywords);
      mockPrisma.sEOCompetitor.findMany.mockResolvedValue([]);

      const result = await seoToolsService.exportSEOData('site-1', 'json');

      const parsedResult = JSON.parse(result);
      expect(parsedResult).toHaveProperty('keywords');
      expect(parsedResult).toHaveProperty('competitors');
    });
  });
}); 