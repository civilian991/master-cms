import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas for BI models
export const dataWarehouseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(), // postgresql, bigquery, snowflake, redshift
  connection: z.record(z.any()),
  schema: z.string(),
  isActive: z.boolean().default(true),
  refreshInterval: z.number().int().positive().default(3600),
  retentionDays: z.number().int().positive().default(730),
  siteId: z.string(),
});

export const dataSourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(), // internal, external, api, database, file
  source: z.string(),
  connection: z.record(z.any()),
  schema: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  refreshInterval: z.number().int().positive().default(3600),
  siteId: z.string(),
  warehouseId: z.string().optional(),
});

export const etlJobSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(), // extract, transform, load, full
  sourceId: z.string(),
  target: z.record(z.any()),
  transformation: z.record(z.any()).optional(),
  schedule: z.string().optional(), // cron expression
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
  maxRetries: z.number().int().default(3),
  warehouseId: z.string(),
});

export const analyticsDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(), // executive, operational, tactical, strategic, custom
  layout: z.record(z.any()),
  widgets: z.record(z.any()),
  filters: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  refreshInterval: z.number().int().positive().default(300),
  autoRefresh: z.boolean().default(true),
  permissions: z.record(z.any()).optional(),
  sharedWith: z.record(z.any()).optional(),
  siteId: z.string(),
  warehouseId: z.string().optional(),
});

export const businessMetricSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(), // revenue, traffic, engagement, conversion, operational
  type: z.string(), // kpi, metric, indicator
  formula: z.string().optional(),
  unit: z.string().optional(),
  target: z.number().optional(),
  threshold: z.number().optional(),
  alertEnabled: z.boolean().default(true),
  updateFrequency: z.string().default("daily"),
  siteId: z.string(),
});

export const competitiveIntelligenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  competitorName: z.string(),
  competitorUrl: z.string().optional(),
  competitorType: z.string(), // direct, indirect, potential
  metrics: z.record(z.any()),
  sources: z.record(z.any()),
  frequency: z.string().default("daily"),
  siteId: z.string(),
});

export class BusinessIntelligenceService {
  private static instance: BusinessIntelligenceService;

  private constructor() {}

  static getInstance(): BusinessIntelligenceService {
    if (!BusinessIntelligenceService.instance) {
      BusinessIntelligenceService.instance = new BusinessIntelligenceService();
    }
    return BusinessIntelligenceService.instance;
  }

  // Data Warehouse Management
  async createDataWarehouse(data: z.infer<typeof dataWarehouseSchema>) {
    const validatedData = dataWarehouseSchema.parse(data);
    
    return await prisma.dataWarehouse.create({
      data: validatedData,
      include: {
        site: true,
        etlJobs: true,
        dataSources: true,
        dashboards: true,
      },
    });
  }

  async getDataWarehouses(siteId: string, isActive?: boolean) {
    const where: any = { siteId };
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.dataWarehouse.findMany({
      where,
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
  }

  async updateDataWarehouse(id: string, data: Partial<z.infer<typeof dataWarehouseSchema>>) {
    return await prisma.dataWarehouse.update({
      where: { id },
      data,
      include: {
        site: true,
        etlJobs: true,
        dataSources: true,
        dashboards: true,
      },
    });
  }

  // Data Source Management
  async createDataSource(data: z.infer<typeof dataSourceSchema>) {
    const validatedData = dataSourceSchema.parse(data);
    
    return await prisma.dataSource.create({
      data: validatedData,
      include: {
        site: true,
        warehouse: true,
        etlJobs: true,
      },
    });
  }

  async getDataSources(siteId: string, type?: string, isActive?: boolean) {
    const where: any = { siteId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.dataSource.findMany({
      where,
      include: {
        site: true,
        warehouse: true,
        etlJobs: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async syncDataSource(id: string) {
    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
      include: { warehouse: true },
    });

    if (!dataSource) {
      throw new Error('Data source not found');
    }

    // Update sync status
    await prisma.dataSource.update({
      where: { id },
      data: {
        syncStatus: 'running',
        lastSync: new Date(),
      },
    });

    try {
      // Simulate data sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update with success
      await prisma.dataSource.update({
        where: { id },
        data: {
          syncStatus: 'completed',
          dataQuality: {
            recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
            recordsFailed: Math.floor(Math.random() * 10),
            dataSize: Math.floor(Math.random() * 1000000) + 100000,
          },
        },
      });

      return { success: true, message: 'Data source synced successfully' };
    } catch (error) {
      // Update with failure
      await prisma.dataSource.update({
        where: { id },
        data: {
          syncStatus: 'failed',
        },
      });
      throw error;
    }
  }

  // ETL Job Management
  async createETLJob(data: z.infer<typeof etlJobSchema>) {
    const validatedData = etlJobSchema.parse(data);
    
    return await prisma.eTLJob.create({
      data: validatedData,
      include: {
        source: true,
        warehouse: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async getETLJobs(siteId: string, status?: string, isActive?: boolean) {
    const where: any = { warehouse: { siteId } };
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.eTLJob.findMany({
      where,
      include: {
        source: true,
        warehouse: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { priority: 'desc', createdAt: 'desc' },
    });
  }

  async executeETLJob(id: string) {
    const job = await prisma.eTLJob.findUnique({
      where: { id },
      include: { source: true, warehouse: true },
    });

    if (!job) {
      throw new Error('ETL job not found');
    }

    // Create execution record
    const execution = await prisma.eTLExecution.create({
      data: {
        jobId: id,
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      // Simulate ETL execution
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const recordsProcessed = Math.floor(Math.random() * 100000) + 10000;
      const recordsFailed = Math.floor(Math.random() * 100);
      const duration = Math.floor(Math.random() * 300) + 60;

      // Update execution with success
      await prisma.eTLExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          duration,
          recordsProcessed,
          recordsFailed,
          dataSize: recordsProcessed * 1024, // Simulate data size
          throughput: recordsProcessed / (duration / 60), // records per minute
        },
      });

      // Update job status
      await prisma.eTLJob.update({
        where: { id },
        data: {
          lastRun: new Date(),
          nextRun: new Date(Date.now() + job.refreshInterval * 1000),
          status: 'completed',
          duration,
          recordsProcessed,
          recordsFailed,
        },
      });

      return { success: true, executionId: execution.id };
    } catch (error) {
      // Update execution with failure
      await prisma.eTLExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Update job status
      await prisma.eTLJob.update({
        where: { id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  // Analytics Dashboard Management
  async createDashboard(data: z.infer<typeof analyticsDashboardSchema>) {
    const validatedData = analyticsDashboardSchema.parse(data);
    
    return await prisma.analyticsDashboard.create({
      data: validatedData,
      include: {
        site: true,
        warehouse: true,
        reports: true,
      },
    });
  }

  async getDashboards(siteId: string, type?: string, isActive?: boolean) {
    const where: any = { siteId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.analyticsDashboard.findMany({
      where,
      include: {
        site: true,
        warehouse: true,
        reports: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboard(id: string) {
    return await prisma.analyticsDashboard.findUnique({
      where: { id },
      include: {
        site: true,
        warehouse: true,
        reports: true,
      },
    });
  }

  async updateDashboardView(id: string) {
    return await prisma.analyticsDashboard.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date(),
      },
    });
  }

  // Business Metrics Management
  async createBusinessMetric(data: z.infer<typeof businessMetricSchema>) {
    const validatedData = businessMetricSchema.parse(data);
    
    return await prisma.businessMetric.create({
      data: validatedData,
      include: {
        site: true,
        alerts: true,
      },
    });
  }

  async getBusinessMetrics(siteId: string, category?: string, type?: string) {
    const where: any = { siteId };
    if (category) where.category = category;
    if (type) where.type = type;

    return await prisma.businessMetric.findMany({
      where,
      include: {
        site: true,
        alerts: {
          where: { isActive: true },
        },
      },
      orderBy: { category: 'asc', name: 'asc' },
    });
  }

  async updateBusinessMetric(id: string, data: {
    currentValue?: number;
    previousValue?: number;
    change?: number;
    trend?: string;
  }) {
    const metric = await prisma.businessMetric.findUnique({
      where: { id },
      include: { alerts: true },
    });

    if (!metric) {
      throw new Error('Business metric not found');
    }

    const updatedMetric = await prisma.businessMetric.update({
      where: { id },
      data: {
        ...data,
        lastUpdated: new Date(),
      },
      include: {
        site: true,
        alerts: true,
      },
    });

    // Check for alerts
    if (metric.alertEnabled && metric.threshold) {
      const currentValue = data.currentValue || metric.currentValue;
      if (currentValue && currentValue < metric.threshold) {
        await this.createBusinessAlert({
          metricId: id,
          type: 'threshold',
          severity: 'high',
          condition: 'below',
          value: metric.threshold,
          recipients: { emails: ['admin@example.com'] },
          siteId: metric.siteId,
        });
      }
    }

    return updatedMetric;
  }

  // Business Alert Management
  async createBusinessAlert(data: {
    metricId: string;
    type: string;
    severity: string;
    condition: string;
    value: number;
    recipients: any;
    siteId: string;
  }) {
    return await prisma.businessAlert.create({
      data: {
        ...data,
        isActive: true,
        isTriggered: true,
        triggeredAt: new Date(),
      },
      include: {
        metric: true,
        site: true,
      },
    });
  }

  async getBusinessAlerts(siteId: string, severity?: string, isActive?: boolean) {
    const where: any = { siteId };
    if (severity) where.severity = severity;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.businessAlert.findMany({
      where,
      include: {
        metric: true,
        site: true,
      },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  async acknowledgeAlert(id: string) {
    return await prisma.businessAlert.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
      },
      include: {
        metric: true,
        site: true,
      },
    });
  }

  async resolveAlert(id: string) {
    return await prisma.businessAlert.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        isActive: false,
      },
      include: {
        metric: true,
        site: true,
      },
    });
  }

  // Competitive Intelligence Management
  async createCompetitiveIntelligence(data: z.infer<typeof competitiveIntelligenceSchema>) {
    const validatedData = competitiveIntelligenceSchema.parse(data);
    
    return await prisma.competitiveIntelligence.create({
      data: validatedData,
      include: {
        site: true,
      },
    });
  }

  async getCompetitiveIntelligence(siteId: string, competitorType?: string) {
    const where: any = { siteId };
    if (competitorType) where.competitorType = competitorType;

    return await prisma.competitiveIntelligence.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCompetitiveData(id: string, data: {
    dataPoints?: any;
    trends?: any;
    marketShare?: number;
    competitivePosition?: string;
    strengths?: any;
    weaknesses?: any;
    opportunities?: any;
    threats?: any;
  }) {
    return await prisma.competitiveIntelligence.update({
      where: { id },
      data: {
        ...data,
        lastCollected: new Date(),
      },
      include: {
        site: true,
      },
    });
  }

  // Market Data Management
  async createMarketData(data: {
    marketName: string;
    marketType: string;
    dataType: string;
    value: number;
    currency: string;
    unit?: string;
    period: string;
    date: Date;
    year: number;
    month?: number;
    quarter?: number;
    source: string;
    sourceUrl?: string;
    confidence?: number;
    siteId: string;
  }) {
    return await prisma.marketData.create({
      data,
      include: {
        site: true,
      },
    });
  }

  async getMarketData(siteId: string, marketType?: string, dataType?: string, period?: string) {
    const where: any = { siteId };
    if (marketType) where.marketType = marketType;
    if (dataType) where.dataType = dataType;
    if (period) where.period = period;

    return await prisma.marketData.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  // Predictive Insights Management
  async createPredictiveInsight(data: {
    name: string;
    description?: string;
    type: string;
    category: string;
    confidence: number;
    prediction: any;
    factors?: any;
    impact?: string;
    timeframe?: string;
    siteId: string;
  }) {
    return await prisma.predictiveInsight.create({
      data,
      include: {
        site: true,
      },
    });
  }

  async getPredictiveInsights(siteId: string, type?: string, category?: string, isActive?: boolean) {
    const where: any = { siteId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.predictiveInsight.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyInsight(id: string, accuracy: number) {
    return await prisma.predictiveInsight.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        accuracy,
      },
      include: {
        site: true,
      },
    });
  }

  // Analytics Engine Management
  async createAnalyticsEngine(data: {
    name: string;
    description?: string;
    type: string;
    provider?: string;
    connection: any;
    capabilities: any;
    isActive?: boolean;
    maxConcurrentJobs?: number;
    timeout?: number;
    siteId: string;
  }) {
    return await prisma.analyticsEngine.create({
      data,
      include: {
        site: true,
        models: true,
        predictions: true,
      },
    });
  }

  async getAnalyticsEngines(siteId: string, type?: string, isActive?: boolean) {
    const where: any = { siteId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.analyticsEngine.findMany({
      where,
      include: {
        site: true,
        models: {
          where: { isActive: true },
        },
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Comprehensive Analytics Dashboard
  async getComprehensiveAnalytics(siteId: string, timeRange: {
    startDate: Date;
    endDate: Date;
  }) {
    const [
      trafficAnalytics,
      revenueAnalytics,
      userAnalytics,
      contentAnalytics,
      siteAnalytics,
      businessMetrics,
      competitiveIntelligence,
      predictiveInsights,
      alerts,
    ] = await Promise.all([
      // Traffic Analytics
      prisma.analytics.findMany({
        where: {
          siteId,
          date: { gte: timeRange.startDate, lte: timeRange.endDate },
        },
        orderBy: { date: 'asc' },
      }),

      // Revenue Analytics
      prisma.revenueAnalytics.findMany({
        where: {
          siteId,
          date: { gte: timeRange.startDate, lte: timeRange.endDate },
        },
        orderBy: { date: 'asc' },
      }),

      // User Analytics
      prisma.userAnalytics.findMany({
        where: {
          siteId,
          lastVisit: { gte: timeRange.startDate, lte: timeRange.endDate },
        },
        include: { user: true },
        orderBy: { lastVisit: 'desc' },
      }),

      // Content Analytics
      prisma.contentAnalytics.findMany({
        where: {
          siteId,
          date: { gte: timeRange.startDate, lte: timeRange.endDate },
        },
        include: { article: true },
        orderBy: { date: 'desc' },
      }),

      // Site Analytics
      prisma.siteAnalytics.findMany({
        where: {
          siteId,
          date: { gte: timeRange.startDate, lte: timeRange.endDate },
        },
        orderBy: { date: 'asc' },
      }),

      // Business Metrics
      this.getBusinessMetrics(siteId),

      // Competitive Intelligence
      this.getCompetitiveIntelligence(siteId),

      // Predictive Insights
      this.getPredictiveInsights(siteId, undefined, undefined, true),

      // Business Alerts
      this.getBusinessAlerts(siteId, undefined, true),
    ]);

    // Calculate summary metrics
    const summary = {
      totalPageViews: trafficAnalytics.reduce((sum, a) => sum + a.pageViews, 0),
      totalUniqueVisitors: trafficAnalytics.reduce((sum, a) => sum + a.uniqueVisitors, 0),
      averageBounceRate: trafficAnalytics.reduce((sum, a) => sum + a.bounceRate, 0) / trafficAnalytics.length,
      averageSessionDuration: trafficAnalytics.reduce((sum, a) => sum + a.avgSessionDuration, 0) / trafficAnalytics.length,
      totalRevenue: revenueAnalytics.reduce((sum, r) => sum + Number(r.revenue), 0),
      totalSubscribers: userAnalytics.length,
      totalArticles: contentAnalytics.length,
      averageEngagement: siteAnalytics.reduce((sum, s) => sum + s.avgEngagement, 0) / siteAnalytics.length,
      conversionRate: siteAnalytics.reduce((sum, s) => sum + s.conversionRate, 0) / siteAnalytics.length,
    };

    return {
      trafficAnalytics,
      revenueAnalytics,
      userAnalytics,
      contentAnalytics,
      siteAnalytics,
      businessMetrics,
      competitiveIntelligence,
      predictiveInsights,
      alerts,
      summary,
    };
  }

  // Real-time Analytics Updates
  async updateRealTimeAnalytics(siteId: string, eventData: any) {
    // Update real-time metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        siteId_date: {
          siteId,
          date: today,
        },
      },
      update: {
        pageViews: { increment: 1 },
        uniqueVisitors: eventData.userId ? { increment: 1 } : undefined,
        avgSessionDuration: eventData.timeOnPage ? { increment: eventData.timeOnPage } : undefined,
      },
      create: {
        siteId,
        date: today,
        pageViews: 1,
        uniqueVisitors: eventData.userId ? 1 : 0,
        bounceRate: 0.5,
        avgSessionDuration: eventData.timeOnPage || 0,
      },
    });

    // Update business metrics if applicable
    if (eventData.revenue) {
      await prisma.revenueAnalytics.upsert({
        where: {
          siteId_date: {
            siteId,
            date: today,
          },
        },
        update: {
          revenue: { increment: eventData.revenue },
        },
        create: {
          siteId,
          date: today,
          revenue: eventData.revenue,
          currency: 'USD',
          subscriptionRevenue: 0,
          advertisingRevenue: 0,
          otherRevenue: 0,
        },
      });
    }
  }

  // Data Quality Monitoring
  async checkDataQuality(siteId: string) {
    const dataSources = await this.getDataSources(siteId);
    const qualityReport = [];

    for (const source of dataSources) {
      const quality = {
        sourceId: source.id,
        sourceName: source.name,
        lastSync: source.lastSync,
        syncStatus: source.syncStatus,
        dataQuality: source.dataQuality,
        issues: [],
      };

      // Check for data quality issues
      if (source.lastSync && new Date().getTime() - source.lastSync.getTime() > 24 * 60 * 60 * 1000) {
        quality.issues.push('Data source not synced in the last 24 hours');
      }

      if (source.syncStatus === 'failed') {
        quality.issues.push('Last sync failed');
      }

      if (source.dataQuality) {
        const dq = source.dataQuality as any;
        if (dq.recordsFailed > 0) {
          quality.issues.push(`${dq.recordsFailed} records failed to process`);
        }
      }

      qualityReport.push(quality);
    }

    return qualityReport;
  }

  // Performance Monitoring
  async getPerformanceMetrics(siteId: string) {
    const [
      etlJobs,
      dashboards,
      analyticsEngines,
    ] = await Promise.all([
      this.getETLJobs(siteId),
      this.getDashboards(siteId),
      this.getAnalyticsEngines(siteId),
    ]);

    const performance = {
      etlJobs: {
        total: etlJobs.length,
        active: etlJobs.filter(job => job.isActive).length,
        failed: etlJobs.filter(job => job.status === 'failed').length,
        averageExecutionTime: etlJobs.reduce((sum, job) => sum + (job.duration || 0), 0) / etlJobs.length,
      },
      dashboards: {
        total: dashboards.length,
        active: dashboards.filter(d => d.isActive).length,
        averageLoadTime: dashboards.reduce((sum, d) => sum + (d.loadTime || 0), 0) / dashboards.length,
        totalViews: dashboards.reduce((sum, d) => sum + d.viewCount, 0),
      },
      analyticsEngines: {
        total: analyticsEngines.length,
        active: analyticsEngines.filter(e => e.isActive).length,
        averageResponseTime: analyticsEngines.reduce((sum, e) => sum + (e.responseTime || 0), 0) / analyticsEngines.length,
        averageThroughput: analyticsEngines.reduce((sum, e) => sum + (e.throughput || 0), 0) / analyticsEngines.length,
      },
    };

    return performance;
  }
}

export const businessIntelligenceService = BusinessIntelligenceService.getInstance(); 