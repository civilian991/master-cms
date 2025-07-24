import { BusinessIntelligenceService } from '@/lib/services/business-intelligence';
import { prisma } from '@/lib/prisma';

// Mock the validation schemas
jest.mock('@/lib/services/business-intelligence', () => {
  const originalModule = jest.requireActual('@/lib/services/business-intelligence');
  return {
    ...originalModule,
    dataWarehouseSchema: {
      parse: jest.fn((data) => data),
    },
    dataSourceSchema: {
      parse: jest.fn((data) => data),
    },
    etlJobSchema: {
      parse: jest.fn((data) => data),
    },
    analyticsDashboardSchema: {
      parse: jest.fn((data) => data),
    },
    businessMetricSchema: {
      parse: jest.fn((data) => data),
    },
    competitiveIntelligenceSchema: {
      parse: jest.fn((data) => data),
    },
  };
});

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dataWarehouse: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dataSource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eTLJob: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eTLExecution: {
      create: jest.fn(),
      update: jest.fn(),
    },
    analyticsDashboard: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    businessMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    businessAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    competitiveIntelligence: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    marketData: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    predictiveInsight: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    analyticsEngine: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    analytics: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    revenueAnalytics: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    userAnalytics: {
      findMany: jest.fn(),
    },
    contentAnalytics: {
      findMany: jest.fn(),
    },
    siteAnalytics: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('BusinessIntelligenceService', () => {
  let service: BusinessIntelligenceService;

  beforeEach(() => {
    service = BusinessIntelligenceService.getInstance();
    jest.clearAllMocks();
  });

  describe('Data Warehouse Management', () => {
    it('should create a data warehouse', async () => {
      const warehouseData = {
        name: 'Main Data Warehouse',
        description: 'Primary data warehouse for analytics',
        type: 'postgresql',
        connection: { host: 'localhost', port: 5432 },
        schema: 'analytics',
        isActive: true,
        refreshInterval: 3600,
        retentionDays: 730,
        siteId: 'site-1',
      };

      const expectedWarehouse = {
        id: 'warehouse-1',
        ...warehouseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        etlJobs: [],
        dataSources: [],
        dashboards: [],
        site: { id: 'site-1', name: 'Test Site' },
      };

      mockPrisma.dataWarehouse.create = jest.fn().mockResolvedValue(expectedWarehouse);

      const result = await service.createDataWarehouse(warehouseData);

      expect(result).toEqual(expectedWarehouse);
      expect(mockPrisma.dataWarehouse.create).toHaveBeenCalledWith({
        data: warehouseData,
        include: {
          site: true,
          etlJobs: true,
          dataSources: true,
          dashboards: true,
        },
      });
    });

    it('should get data warehouses for a site', async () => {
      const warehouses = [
        {
          id: 'warehouse-1',
          name: 'Main Data Warehouse',
          type: 'postgresql',
          isActive: true,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.dataWarehouse.findMany = jest.fn().mockResolvedValue(warehouses);

      const result = await service.getDataWarehouses('site-1', true);

      expect(result).toEqual(warehouses);
      expect(mockPrisma.dataWarehouse.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1', isActive: true },
        include: {
          site: true,
          etlJobs: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
          dataSources: {
            where: { isActive: true },
          },
          dashboards: {
            where: { isActive: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Data Source Management', () => {
    it('should create a data source', async () => {
      const sourceData = {
        name: 'Google Analytics',
        description: 'Google Analytics data source',
        type: 'external',
        source: 'google_analytics',
        connection: { apiKey: 'test-key' },
        isActive: true,
        refreshInterval: 3600,
        siteId: 'site-1',
        warehouseId: 'warehouse-1',
      };

      const expectedSource = {
        id: 'source-1',
        ...sourceData,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
        warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
        etlJobs: [],
      };

      mockPrisma.dataSource.create = jest.fn().mockResolvedValue(expectedSource);

      const result = await service.createDataSource(sourceData);

      expect(result).toEqual(expectedSource);
    });

    it('should sync a data source', async () => {
      const dataSource = {
        id: 'source-1',
        name: 'Google Analytics',
        type: 'external',
        siteId: 'site-1',
        warehouse: { id: 'warehouse-1' },
      };

      mockPrisma.dataSource.findUnique = jest.fn().mockResolvedValue(dataSource);
      mockPrisma.dataSource.update = jest.fn().mockResolvedValue(dataSource);

      const result = await service.syncDataSource('source-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Data source synced successfully');
      expect(mockPrisma.dataSource.update).toHaveBeenCalledWith({
        where: { id: 'source-1' },
        data: {
          syncStatus: 'completed',
          dataQuality: {
            recordsProcessed: expect.any(Number),
            recordsFailed: expect.any(Number),
            dataSize: expect.any(Number),
          },
        },
      });
    });
  });

  describe('ETL Job Management', () => {
    it('should create an ETL job', async () => {
      const jobData = {
        name: 'Daily Analytics Sync',
        description: 'Sync analytics data daily',
        type: 'full',
        sourceId: 'source-1',
        target: { table: 'analytics_daily' },
        isActive: true,
        priority: 1,
        maxRetries: 3,
        warehouseId: 'warehouse-1',
      };

      const expectedJob = {
        id: 'job-1',
        ...jobData,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: { id: 'source-1', name: 'Google Analytics' },
        warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
        executions: [],
      };

      mockPrisma.eTLJob.create = jest.fn().mockResolvedValue(expectedJob);

      const result = await service.createETLJob(jobData);

      expect(result).toEqual(expectedJob);
    });

    it('should execute an ETL job', async () => {
      const job = {
        id: 'job-1',
        name: 'Daily Analytics Sync',
        source: { id: 'source-1' },
        warehouse: { id: 'warehouse-1' },
        refreshInterval: 3600,
      };

      const execution = {
        id: 'execution-1',
        jobId: 'job-1',
        status: 'running',
        startedAt: new Date(),
      };

      mockPrisma.eTLJob.findUnique = jest.fn().mockResolvedValue(job);
      mockPrisma.eTLExecution.create = jest.fn().mockResolvedValue(execution);
      mockPrisma.eTLExecution.update = jest.fn().mockResolvedValue(execution);
      mockPrisma.eTLJob.update = jest.fn().mockResolvedValue(job);

      const result = await service.executeETLJob('job-1');

      expect(result.success).toBe(true);
      expect(result.executionId).toBe('execution-1');
    }, 10000); // Increased timeout to 10 seconds
  });

  describe('Analytics Dashboard Management', () => {
    it('should create a dashboard', async () => {
      const dashboardData = {
        name: 'Executive Dashboard',
        description: 'High-level business metrics',
        type: 'executive',
        layout: { widgets: [] },
        widgets: { summary: {}, charts: {} },
        isActive: true,
        isPublic: false,
        refreshInterval: 300,
        autoRefresh: true,
        permissions: {},
        sharedWith: {},
        siteId: 'site-1',
        warehouseId: 'warehouse-1',
      };

      const expectedDashboard = {
        id: 'dashboard-1',
        ...dashboardData,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
        warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
        reports: [],
      };

      mockPrisma.analyticsDashboard.create = jest.fn().mockResolvedValue(expectedDashboard);

      const result = await service.createDashboard(dashboardData);

      expect(result).toEqual(expectedDashboard);
    });

    it('should get dashboards for a site', async () => {
      const dashboards = [
        {
          id: 'dashboard-1',
          name: 'Executive Dashboard',
          type: 'executive',
          isActive: true,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.analyticsDashboard.findMany = jest.fn().mockResolvedValue(dashboards);

      const result = await service.getDashboards('site-1', 'executive', true);

      expect(result).toEqual(dashboards);
    });
  });

  describe('Business Metrics Management', () => {
    it('should create a business metric', async () => {
      const metricData = {
        name: 'Revenue Growth',
        description: 'Monthly revenue growth rate',
        category: 'revenue',
        type: 'kpi',
        formula: '((current - previous) / previous) * 100',
        unit: 'percentage',
        target: 15,
        threshold: 10,
        alertEnabled: true,
        updateFrequency: 'daily',
        siteId: 'site-1',
      };

      const expectedMetric = {
        id: 'metric-1',
        ...metricData,
        currentValue: null,
        previousValue: null,
        change: null,
        trend: null,
        lastUpdated: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
        alerts: [],
      };

      mockPrisma.businessMetric.create = jest.fn().mockResolvedValue(expectedMetric);

      const result = await service.createBusinessMetric(metricData);

      expect(result).toEqual(expectedMetric);
    });

    it('should update a business metric', async () => {
      const metric = {
        id: 'metric-1',
        currentValue: 1000,
        target: 1500,
        threshold: 1000,
        alertEnabled: true,
        siteId: 'site-1',
      };

      const updateData = {
        currentValue: 1200,
        previousValue: 1000,
        change: 20,
        trend: 'up',
      };

      mockPrisma.businessMetric.findUnique = jest.fn().mockResolvedValue(metric);
      mockPrisma.businessMetric.update = jest.fn().mockResolvedValue({
        ...metric,
        ...updateData,
        lastUpdated: new Date(),
      });

      const result = await service.updateBusinessMetric('metric-1', updateData);

      expect(result.currentValue).toBe(1200);
      expect(result.change).toBe(20);
      expect(result.trend).toBe('up');
    });
  });

  describe('Business Alert Management', () => {
    it('should create a business alert', async () => {
      const alertData = {
        metricId: 'metric-1',
        type: 'threshold',
        severity: 'high',
        condition: 'below',
        value: 1000,
        recipients: { emails: ['admin@example.com'] },
        siteId: 'site-1',
      };

      const expectedAlert = {
        id: 'alert-1',
        ...alertData,
        isActive: true,
        isTriggered: true,
        triggeredAt: new Date(),
        acknowledgedAt: null,
        resolvedAt: null,
        notificationSent: false,
        notificationSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metric: { id: 'metric-1', name: 'Revenue Growth' },
        site: { id: 'site-1', name: 'Test Site' },
      };

      mockPrisma.businessAlert.create = jest.fn().mockResolvedValue(expectedAlert);

      const result = await service.createBusinessAlert(alertData);

      expect(result).toEqual(expectedAlert);
    });

    it('should get business alerts', async () => {
      const alerts = [
        {
          id: 'alert-1',
          type: 'threshold',
          severity: 'high',
          isActive: true,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.businessAlert.findMany = jest.fn().mockResolvedValue(alerts);

      const result = await service.getBusinessAlerts('site-1', 'high', true);

      expect(result).toEqual(alerts);
    });
  });

  describe('Competitive Intelligence Management', () => {
    it('should create competitive intelligence', async () => {
      const intelligenceData = {
        name: 'Competitor Analysis',
        description: 'Analysis of main competitors',
        competitorName: 'Competitor A',
        competitorUrl: 'https://competitor-a.com',
        competitorType: 'direct',
        metrics: { marketShare: 0.25, traffic: 100000 },
        sources: { googleAnalytics: true, socialMedia: true },
        frequency: 'daily',
        siteId: 'site-1',
      };

      const expectedIntelligence = {
        id: 'intelligence-1',
        ...intelligenceData,
        lastCollected: null,
        dataPoints: null,
        trends: null,
        marketShare: null,
        competitivePosition: null,
        strengths: null,
        weaknesses: null,
        opportunities: null,
        threats: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
      };

      mockPrisma.competitiveIntelligence.create = jest.fn().mockResolvedValue(expectedIntelligence);

      const result = await service.createCompetitiveIntelligence(intelligenceData);

      expect(result).toEqual(expectedIntelligence);
    });

    it('should update competitive data', async () => {
      const updateData = {
        dataPoints: { marketShare: 0.25, traffic: 100000 },
        trends: { growth: 0.15 },
        marketShare: 0.25,
        competitivePosition: 'challenger',
        strengths: ['strong brand'],
        weaknesses: ['limited reach'],
        opportunities: ['new markets'],
        threats: ['new competitors'],
      };

      mockPrisma.competitiveIntelligence.update = jest.fn().mockResolvedValue({
        id: 'intelligence-1',
        ...updateData,
        lastCollected: new Date(),
      });

      const result = await service.updateCompetitiveData('intelligence-1', updateData);

      expect(result.marketShare).toBe(0.25);
      expect(result.competitivePosition).toBe('challenger');
    });
  });

  describe('Market Data Management', () => {
    it('should create market data', async () => {
      const marketData = {
        marketName: 'E-commerce Market',
        marketType: 'industry',
        dataType: 'size',
        value: 1000000000,
        currency: 'USD',
        unit: 'dollars',
        period: 'yearly',
        date: new Date('2024-01-01'),
        year: 2024,
        month: 1,
        quarter: 1,
        source: 'Market Research Inc',
        sourceUrl: 'https://marketresearch.com',
        confidence: 0.95,
        siteId: 'site-1',
      };

      const expectedMarketData = {
        id: 'market-1',
        ...marketData,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
      };

      mockPrisma.marketData.create = jest.fn().mockResolvedValue(expectedMarketData);

      const result = await service.createMarketData(marketData);

      expect(result).toEqual(expectedMarketData);
    });
  });

  describe('Predictive Insights Management', () => {
    it('should create a predictive insight', async () => {
      const insightData = {
        name: 'Revenue Forecast',
        description: 'AI-powered revenue prediction',
        type: 'forecast',
        category: 'revenue',
        confidence: 0.85,
        prediction: { nextMonth: 150000, nextQuarter: 450000 },
        factors: { seasonality: 0.1, growth: 0.15 },
        impact: 'high',
        timeframe: 'medium-term',
        siteId: 'site-1',
      };

      const expectedInsight = {
        id: 'insight-1',
        ...insightData,
        isActive: true,
        isVerified: false,
        verifiedAt: null,
        accuracy: null,
        usedInDecisions: 0,
        lastUsed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
      };

      mockPrisma.predictiveInsight.create = jest.fn().mockResolvedValue(expectedInsight);

      const result = await service.createPredictiveInsight(insightData);

      expect(result).toEqual(expectedInsight);
    });

    it('should verify an insight', async () => {
      const accuracy = 0.92;

      mockPrisma.predictiveInsight.update = jest.fn().mockResolvedValue({
        id: 'insight-1',
        isVerified: true,
        verifiedAt: new Date(),
        accuracy,
      });

      const result = await service.verifyInsight('insight-1', accuracy);

      expect(result.isVerified).toBe(true);
      expect(result.accuracy).toBe(accuracy);
    });
  });

  describe('Analytics Engine Management', () => {
    it('should create an analytics engine', async () => {
      const engineData = {
        name: 'ML Analytics Engine',
        description: 'Machine learning analytics engine',
        type: 'internal',
        provider: 'tensorflow',
        connection: { endpoint: 'http://localhost:8000' },
        capabilities: { prediction: true, classification: true },
        isActive: true,
        maxConcurrentJobs: 10,
        timeout: 3600,
        siteId: 'site-1',
      };

      const expectedEngine = {
        id: 'engine-1',
        ...engineData,
        responseTime: null,
        throughput: null,
        errorRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        site: { id: 'site-1', name: 'Test Site' },
        models: [],
        predictions: [],
      };

      mockPrisma.analyticsEngine.create = jest.fn().mockResolvedValue(expectedEngine);

      const result = await service.createAnalyticsEngine(engineData);

      expect(result).toEqual(expectedEngine);
    });
  });

  describe('Comprehensive Analytics', () => {
    it('should get comprehensive analytics', async () => {
      const timeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockData = {
        trafficAnalytics: [{ id: '1', pageViews: 1000, uniqueVisitors: 500, bounceRate: 0.3, avgSessionDuration: 180, date: '2024-01-01' }],
        revenueAnalytics: [{ id: '1', revenue: 10000, currency: 'USD', subscriptionRevenue: 8000, advertisingRevenue: 2000, otherRevenue: 0, date: '2024-01-01' }],
        userAnalytics: [{ id: '1', userId: 'user-1', pageViews: 10, timeOnSite: 300, articlesRead: 5, lastVisit: '2024-01-01' }],
        contentAnalytics: [{ id: '1', views: 100, uniqueViews: 80, timeOnPage: 120, bounceRate: 0.2, socialShares: 5, date: '2024-01-01' }],
        siteAnalytics: [{ id: '1', totalRevenue: 10000, totalSubscribers: 100, totalArticles: 50, avgEngagement: 0.15, conversionRate: 0.1, date: '2024-01-01' }],
        businessMetrics: [{ id: '1', name: 'Revenue Growth', category: 'revenue', type: 'kpi', currentValue: 12000, previousValue: 10000, change: 20, trend: 'up', target: 15000, threshold: 10000, alertEnabled: true }],
        competitiveIntelligence: [{ id: '1', name: 'Competitor Analysis', competitorName: 'Competitor A', competitorType: 'direct', marketShare: 0.25, competitivePosition: 'challenger', lastCollected: '2024-01-01' }],
        predictiveInsights: [{ id: '1', name: 'Revenue Forecast', type: 'forecast', category: 'revenue', confidence: 0.85, impact: 'high', timeframe: 'medium-term', isVerified: false }],
        alerts: [{ id: '1', type: 'threshold', severity: 'high', condition: 'below', value: 10000, isActive: true, triggeredAt: '2024-01-01' }],
      };

      mockPrisma.analytics.findMany = jest.fn().mockResolvedValue(mockData.trafficAnalytics);
      mockPrisma.revenueAnalytics.findMany = jest.fn().mockResolvedValue(mockData.revenueAnalytics);
      mockPrisma.userAnalytics.findMany = jest.fn().mockResolvedValue(mockData.userAnalytics);
      mockPrisma.contentAnalytics.findMany = jest.fn().mockResolvedValue(mockData.contentAnalytics);
      mockPrisma.siteAnalytics.findMany = jest.fn().mockResolvedValue(mockData.siteAnalytics);
      mockPrisma.businessMetric.findMany = jest.fn().mockResolvedValue(mockData.businessMetrics);
      mockPrisma.competitiveIntelligence.findMany = jest.fn().mockResolvedValue(mockData.competitiveIntelligence);
      mockPrisma.predictiveInsight.findMany = jest.fn().mockResolvedValue(mockData.predictiveInsights);
      mockPrisma.businessAlert.findMany = jest.fn().mockResolvedValue(mockData.alerts);

      const result = await service.getComprehensiveAnalytics('site-1', timeRange);

      expect(result.trafficAnalytics).toEqual(mockData.trafficAnalytics);
      expect(result.revenueAnalytics).toEqual(mockData.revenueAnalytics);
      expect(result.userAnalytics).toEqual(mockData.userAnalytics);
      expect(result.contentAnalytics).toEqual(mockData.contentAnalytics);
      expect(result.siteAnalytics).toEqual(mockData.siteAnalytics);
      expect(result.businessMetrics).toEqual(mockData.businessMetrics);
      expect(result.competitiveIntelligence).toEqual(mockData.competitiveIntelligence);
      expect(result.predictiveInsights).toEqual(mockData.predictiveInsights);
      expect(result.alerts).toEqual(mockData.alerts);
      expect(result.summary).toBeDefined();
    });
  });

  describe('Real-time Analytics Updates', () => {
    it('should update real-time analytics', async () => {
      const eventData = {
        pageViews: 1,
        uniqueVisitors: 1,
        timeOnPage: 120,
        revenue: 100,
      };

      mockPrisma.analytics.upsert = jest.fn().mockResolvedValue({});
      mockPrisma.revenueAnalytics.upsert = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction = jest.fn().mockResolvedValue([{}, {}]);

      await service.updateRealTimeAnalytics('site-1', eventData);

      expect(mockPrisma.analytics.upsert).toHaveBeenCalled();
      expect(mockPrisma.revenueAnalytics.upsert).toHaveBeenCalled();
    });
  });

  describe('Data Quality Monitoring', () => {
    it('should check data quality', async () => {
      const dataSources = [
        {
          id: 'source-1',
          name: 'Google Analytics',
          type: 'external',
          lastSync: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          syncStatus: 'completed',
          dataQuality: { recordsProcessed: 1000, recordsFailed: 0 },
        },
        {
          id: 'source-2',
          name: 'Database',
          type: 'internal',
          lastSync: new Date(),
          syncStatus: 'failed',
          dataQuality: null,
        },
      ];

      mockPrisma.dataSource.findMany = jest.fn().mockResolvedValue(dataSources);

      const result = await service.checkDataQuality('site-1');

      expect(result).toHaveLength(2);
      expect(result[0].issues).toContain('Data source not synced in the last 24 hours');
      expect(result[1].issues).toContain('Last sync failed');
    });
  });

  describe('Performance Monitoring', () => {
    it('should get performance metrics', async () => {
      const etlJobs = [
        { id: 'job-1', isActive: true, status: 'completed', duration: 60 },
        { id: 'job-2', isActive: true, status: 'failed', duration: 30 },
      ];

      const dashboards = [
        { id: 'dashboard-1', isActive: true, loadTime: 2.5, viewCount: 100 },
        { id: 'dashboard-2', isActive: false, loadTime: 1.5, viewCount: 50 },
      ];

      const engines = [
        { id: 'engine-1', isActive: true, responseTime: 100, throughput: 50 },
        { id: 'engine-2', isActive: false, responseTime: 200, throughput: 25 },
      ];

      mockPrisma.eTLJob.findMany = jest.fn().mockResolvedValue(etlJobs);
      mockPrisma.analyticsDashboard.findMany = jest.fn().mockResolvedValue(dashboards);
      mockPrisma.analyticsEngine.findMany = jest.fn().mockResolvedValue(engines);

      const result = await service.getPerformanceMetrics('site-1');

      expect(result.etlJobs.total).toBe(2);
      expect(result.etlJobs.active).toBe(2);
      expect(result.etlJobs.failed).toBe(1);
      expect(result.dashboards.total).toBe(2);
      expect(result.dashboards.active).toBe(1);
      expect(result.analyticsEngines.total).toBe(2);
      expect(result.analyticsEngines.active).toBe(1);
    });
  });
}); 