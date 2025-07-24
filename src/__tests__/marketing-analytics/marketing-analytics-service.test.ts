import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MarketingAnalyticsService } from '@/lib/services/marketing-analytics';
import { 
  MarketingAnalyticsType,
  MarketingCampaignType,
  MarketingCampaignStatus,
  MarketingLeadStatus
} from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    marketingAnalytics: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    marketingCampaign: {
      findMany: jest.fn(),
    },
  },
}));

describe('MarketingAnalyticsService', () => {
  let marketingAnalyticsService: MarketingAnalyticsService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    marketingAnalyticsService = new MarketingAnalyticsService();
    jest.clearAllMocks();
  });

  describe('trackMarketingPerformance', () => {
    it('should track marketing performance metrics', async () => {
      const siteId = 'site-1';
      const campaignId = 'campaign-1';
      const metrics = {
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        revenue: 5000,
        cost: 1000,
        ctr: 5.0,
        conversionRate: 10.0,
        cpa: 20.0,
        roas: 5.0,
        roi: 400.0,
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({});

      const result = await marketingAnalyticsService.trackMarketingPerformance(siteId, campaignId, metrics);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'performance',
          value: metrics.revenue,
          date: expect.any(Date),
          siteId,
          campaignId,
          metadata: metrics,
        },
      });

      expect(result).toEqual({ success: true, roi: 400 });
    });
  });

  describe('calculateMarketingROI', () => {
    it('should calculate marketing ROI for campaigns', async () => {
      const siteId = 'site-1';
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Summer Sale Campaign',
          type: MarketingCampaignType.SOCIAL_MEDIA,
          status: MarketingCampaignStatus.ACTIVE,
          leads: [
            { status: MarketingLeadStatus.CONVERTED },
            { status: MarketingLeadStatus.CONVERTED },
            { status: MarketingLeadStatus.NEW },
          ],
        },
      ];

      const mockAnalytics = [
        {
          value: 1000, // cost
          metadata: { revenue: 5000 },
        },
        {
          value: 500, // additional cost
          metadata: { revenue: 2000 },
        },
      ];

      mockPrisma.marketingCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await marketingAnalyticsService.calculateMarketingROI(siteId);

      expect(mockPrisma.marketingCampaign.findMany).toHaveBeenCalledWith({
        where: { siteId },
        include: { leads: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('campaignId', 'campaign-1');
      expect(result[0]).toHaveProperty('campaignName', 'Summer Sale Campaign');
      expect(result[0]).toHaveProperty('totalSpent', 1500);
      expect(result[0]).toHaveProperty('totalRevenue', 7000);
      expect(result[0]).toHaveProperty('totalConversions', 2);
      expect(result[0]).toHaveProperty('roi', 366.67);
      expect(result[0]).toHaveProperty('roas', 4.67);
      expect(result[0]).toHaveProperty('cpa', 750);
      expect(result[0]).toHaveProperty('cpl', 500);
      expect(result[0]).toHaveProperty('ltv', 3500);
      expect(result[0]).toHaveProperty('paybackPeriod', 0.21);
    });

    it('should handle campaigns with no cost', async () => {
      const siteId = 'site-1';
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Free Campaign',
          type: MarketingCampaignType.CONTENT,
          status: MarketingCampaignStatus.ACTIVE,
          leads: [],
        },
      ];

      mockPrisma.marketingCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.marketingAnalytics.findMany.mockResolvedValue([]);

      const result = await marketingAnalyticsService.calculateMarketingROI(siteId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('roi', 0);
      expect(result[0]).toHaveProperty('roas', 0);
      expect(result[0]).toHaveProperty('cpa', 0);
      expect(result[0]).toHaveProperty('cpl', 0);
      expect(result[0]).toHaveProperty('ltv', 0);
      expect(result[0]).toHaveProperty('paybackPeriod', 0);
    });
  });

  describe('buildMarketingAttribution', () => {
    it('should build marketing attribution model', async () => {
      const siteId = 'site-1';
      const conversionId = 'conversion-1';

      const result = await marketingAnalyticsService.buildMarketingAttribution(siteId, conversionId);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('touchpoint', 'google_ads');
      expect(result[0]).toHaveProperty('channel', 'paid_search');
      expect(result[0]).toHaveProperty('campaign', 'brand_campaign');
      expect(result[0]).toHaveProperty('weight', 0.4);
      expect(result[0]).toHaveProperty('firstTouch', true);
      expect(result[0]).toHaveProperty('lastTouch', false);
      expect(result[0]).toHaveProperty('assisted', false);
    });
  });

  describe('generateMarketingForecasts', () => {
    it('should generate marketing forecasts', async () => {
      const siteId = 'site-1';
      const periods = 6;

      const result = await marketingAnalyticsService.generateMarketingForecasts(siteId, periods);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(periods);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('predictedImpressions');
      expect(result[0]).toHaveProperty('predictedClicks');
      expect(result[0]).toHaveProperty('predictedConversions');
      expect(result[0]).toHaveProperty('predictedRevenue');
      expect(result[0]).toHaveProperty('predictedCost');
      expect(result[0]).toHaveProperty('confidence');
      expect(result[0]).toHaveProperty('factors');
      expect(result[0].factors).toBeInstanceOf(Array);
    });

    it('should use default periods when not specified', async () => {
      const siteId = 'site-1';

      const result = await marketingAnalyticsService.generateMarketingForecasts(siteId);

      expect(result).toHaveLength(12);
    });
  });

  describe('getMarketingAnalyticsDashboard', () => {
    it('should get comprehensive marketing analytics dashboard', async () => {
      const siteId = 'site-1';
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Test Campaign',
          type: MarketingCampaignType.SOCIAL_MEDIA,
          status: MarketingCampaignStatus.ACTIVE,
          leads: [{ status: MarketingLeadStatus.CONVERTED }],
        },
      ];

      const mockLeads = [
        { id: 'lead-1', status: MarketingLeadStatus.CONVERTED },
        { id: 'lead-2', status: MarketingLeadStatus.NEW },
      ];

      const mockAnalytics = [
        {
          value: 1000,
          metadata: { revenue: 5000 },
        },
      ];

      mockPrisma.marketingCampaign.findMany.mockResolvedValue(mockCampaigns);
      mockPrisma.marketingLead.findMany = jest.fn().mockResolvedValue(mockLeads);
      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await marketingAnalyticsService.getMarketingAnalyticsDashboard(siteId);

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('performanceByChannel');
      expect(result).toHaveProperty('topPerformingCampaigns');
      expect(result).toHaveProperty('attributionBreakdown');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('forecasts');

      expect(result.overview).toHaveProperty('totalCampaigns', 1);
      expect(result.overview).toHaveProperty('activeCampaigns', 1);
      expect(result.overview).toHaveProperty('totalLeads', 2);
      expect(result.overview).toHaveProperty('totalRevenue', 5000);
      expect(result.overview).toHaveProperty('totalSpent', 1000);
      expect(result.overview).toHaveProperty('overallROI', 400);

      expect(result.performanceByChannel).toBeInstanceOf(Array);
      expect(result.topPerformingCampaigns).toBeInstanceOf(Array);
      expect(result.attributionBreakdown).toBeInstanceOf(Array);
      expect(result.trends).toBeInstanceOf(Array);
      expect(result.forecasts).toBeInstanceOf(Array);
    });

    it('should handle date range filtering', async () => {
      const siteId = 'site-1';
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      mockPrisma.marketingCampaign.findMany.mockResolvedValue([]);
      mockPrisma.marketingLead.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.marketingAnalytics.findMany.mockResolvedValue([]);

      await marketingAnalyticsService.getMarketingAnalyticsDashboard(siteId, dateRange);

      expect(mockPrisma.marketingCampaign.findMany).toHaveBeenCalledWith({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        include: { leads: true },
      });
    });
  });

  describe('createMarketingReport', () => {
    it('should create marketing report', async () => {
      const siteId = 'site-1';
      const reportData = {
        name: 'Monthly Marketing Report',
        type: 'comprehensive' as const,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        data: { someData: 'value' },
        generatedBy: 'user-1',
      };

      const result = await marketingAnalyticsService.createMarketingReport(siteId, reportData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', reportData.name);
      expect(result).toHaveProperty('type', reportData.type);
      expect(result).toHaveProperty('dateRange', reportData.dateRange);
      expect(result).toHaveProperty('data', reportData.data);
      expect(result).toHaveProperty('generatedBy', reportData.generatedBy);
      expect(result).toHaveProperty('generatedAt');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getRealTimeMarketingAnalytics', () => {
    it('should get real-time marketing analytics', async () => {
      const siteId = 'site-1';
      const mockAnalytics = [
        {
          value: 100,
          metadata: { impressions: 1000, clicks: 50, conversions: 5, revenue: 500 },
        },
        {
          value: 200,
          metadata: { impressions: 2000, clicks: 100, conversions: 10, revenue: 1000 },
        },
      ];

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await marketingAnalyticsService.getRealTimeMarketingAnalytics(siteId);

      expect(mockPrisma.marketingAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          siteId,
          date: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      expect(result).toHaveProperty('impressions', 3000);
      expect(result).toHaveProperty('clicks', 150);
      expect(result).toHaveProperty('conversions', 15);
      expect(result).toHaveProperty('revenue', 1500);
      expect(result).toHaveProperty('lastUpdated');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('exportMarketingAnalytics', () => {
    it('should export marketing analytics in CSV format', async () => {
      const siteId = 'site-1';
      const format = 'csv';
      const mockAnalytics = [
        {
          date: new Date('2024-01-01'),
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'performance',
          value: 1000,
          campaign: { name: 'Test Campaign' },
          metadata: { revenue: 5000 },
        },
      ];

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await marketingAnalyticsService.exportMarketingAnalytics(siteId, format);

      expect(result).toContain('Date,Type,Metric,Value,Campaign,Metadata');
      expect(result).toContain('2024-01-01,CAMPAIGN,performance,1000,Test Campaign');
    });

    it('should export marketing analytics in JSON format', async () => {
      const siteId = 'site-1';
      const format = 'json';
      const mockAnalytics = [
        {
          date: new Date('2024-01-01'),
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'performance',
          value: 1000,
          campaign: { name: 'Test Campaign' },
          metadata: { revenue: 5000 },
        },
      ];

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await marketingAnalyticsService.exportMarketingAnalytics(siteId, format);

      const parsedResult = JSON.parse(result);
      expect(parsedResult).toBeInstanceOf(Array);
      expect(parsedResult).toHaveLength(1);
      expect(parsedResult[0]).toHaveProperty('type', 'CAMPAIGN');
      expect(parsedResult[0]).toHaveProperty('metric', 'performance');
    });

    it('should handle date range filtering for export', async () => {
      const siteId = 'site-1';
      const format = 'csv';
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue([]);

      await marketingAnalyticsService.exportMarketingAnalytics(siteId, format, dateRange);

      expect(mockPrisma.marketingAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          siteId,
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        include: {
          campaign: true,
        },
        orderBy: {
          date: 'desc',
        },
      });
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should calculate statistical significance for A/B tests', async () => {
      const variantA = { conversions: 50, impressions: 1000 };
      const variantB = { conversions: 60, impressions: 1000 };

      const result = await marketingAnalyticsService.calculateStatisticalSignificance(variantA, variantB);

      expect(result).toHaveProperty('significant');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('winner');
      expect(typeof result.significant).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.winner).toBe('string');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should identify significant differences', async () => {
      const variantA = { conversions: 10, impressions: 100 };
      const variantB = { conversions: 30, impressions: 100 };

      const result = await marketingAnalyticsService.calculateStatisticalSignificance(variantA, variantB);

      expect(result.significant).toBe(true);
      expect(result.confidence).toBeGreaterThan(95);
      expect(result.winner).toBe('B');
    });

    it('should handle no significant differences', async () => {
      const variantA = { conversions: 50, impressions: 1000 };
      const variantB = { conversions: 52, impressions: 1000 };

      const result = await marketingAnalyticsService.calculateStatisticalSignificance(variantA, variantB);

      expect(result.significant).toBe(false);
      expect(result.confidence).toBeLessThan(95);
    });
  });

  describe('private methods', () => {
    it('should generate trends data correctly', () => {
      const service = marketingAnalyticsService as any;
      const trends = service.generateTrendsData();
      
      expect(trends).toBeInstanceOf(Array);
      expect(trends).toHaveLength(30);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('impressions');
      expect(trends[0]).toHaveProperty('clicks');
      expect(trends[0]).toHaveProperty('conversions');
      expect(trends[0]).toHaveProperty('revenue');
      expect(trends[0]).toHaveProperty('cost');
    });

    it('should calculate normal CDF correctly', () => {
      const service = marketingAnalyticsService as any;
      
      // Test some known values
      expect(service.normalCDF(0)).toBeCloseTo(0.5, 2);
      expect(service.normalCDF(1)).toBeCloseTo(0.841, 2);
      expect(service.normalCDF(-1)).toBeCloseTo(0.159, 2);
    });

    it('should calculate error function correctly', () => {
      const service = marketingAnalyticsService as any;
      
      // Test some known values
      expect(service.erf(0)).toBeCloseTo(0, 2);
      expect(service.erf(1)).toBeCloseTo(0.843, 2);
      expect(service.erf(-1)).toBeCloseTo(-0.843, 2);
    });
  });
}); 