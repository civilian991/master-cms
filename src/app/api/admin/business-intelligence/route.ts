import { NextRequest, NextResponse } from 'next/server';
import { businessIntelligenceService } from '@/lib/services/business-intelligence';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

// Validation schemas
const timeRangeSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

const siteIdSchema = z.object({
  siteId: z.string(),
});

// GET /api/admin/business-intelligence - Get comprehensive BI data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view BI data
    if (!user.permissions.includes('analytics:read') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const path = new URL(request.url).pathname;

    // Get site ID from query params or user's site
    const siteId = searchParams.get('siteId') || user.siteId;

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    if (path.includes('/comprehensive-analytics')) {
      // Get comprehensive analytics
      const validatedData = timeRangeSchema.parse({
        startDate: searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: searchParams.get('endDate') || new Date().toISOString(),
      });

      const analytics = await businessIntelligenceService.getComprehensiveAnalytics(
        siteId,
        {
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
        }
      );

      return NextResponse.json({
        success: true,
        analytics,
      });
    } else if (path.includes('/data-warehouses')) {
      // Get data warehouses
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const warehouses = await businessIntelligenceService.getDataWarehouses(siteId, isActive);

      return NextResponse.json({
        success: true,
        warehouses,
      });
    } else if (path.includes('/data-sources')) {
      // Get data sources
      const type = searchParams.get('type') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const sources = await businessIntelligenceService.getDataSources(siteId, type, isActive);

      return NextResponse.json({
        success: true,
        sources,
      });
    } else if (path.includes('/etl-jobs')) {
      // Get ETL jobs
      const status = searchParams.get('status') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const jobs = await businessIntelligenceService.getETLJobs(siteId, status, isActive);

      return NextResponse.json({
        success: true,
        jobs,
      });
    } else if (path.includes('/dashboards')) {
      // Get dashboards
      const type = searchParams.get('type') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const dashboards = await businessIntelligenceService.getDashboards(siteId, type, isActive);

      return NextResponse.json({
        success: true,
        dashboards,
      });
    } else if (path.includes('/business-metrics')) {
      // Get business metrics
      const category = searchParams.get('category') || undefined;
      const type = searchParams.get('type') || undefined;
      const metrics = await businessIntelligenceService.getBusinessMetrics(siteId, category, type);

      return NextResponse.json({
        success: true,
        metrics,
      });
    } else if (path.includes('/business-alerts')) {
      // Get business alerts
      const severity = searchParams.get('severity') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const alerts = await businessIntelligenceService.getBusinessAlerts(siteId, severity, isActive);

      return NextResponse.json({
        success: true,
        alerts,
      });
    } else if (path.includes('/competitive-intelligence')) {
      // Get competitive intelligence
      const competitorType = searchParams.get('competitorType') || undefined;
      const intelligence = await businessIntelligenceService.getCompetitiveIntelligence(siteId, competitorType);

      return NextResponse.json({
        success: true,
        intelligence,
      });
    } else if (path.includes('/market-data')) {
      // Get market data
      const marketType = searchParams.get('marketType') || undefined;
      const dataType = searchParams.get('dataType') || undefined;
      const period = searchParams.get('period') || undefined;
      const marketData = await businessIntelligenceService.getMarketData(siteId, marketType, dataType, period);

      return NextResponse.json({
        success: true,
        marketData,
      });
    } else if (path.includes('/predictive-insights')) {
      // Get predictive insights
      const type = searchParams.get('type') || undefined;
      const category = searchParams.get('category') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const insights = await businessIntelligenceService.getPredictiveInsights(siteId, type, category, isActive);

      return NextResponse.json({
        success: true,
        insights,
      });
    } else if (path.includes('/analytics-engines')) {
      // Get analytics engines
      const type = searchParams.get('type') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      const engines = await businessIntelligenceService.getAnalyticsEngines(siteId, type, isActive);

      return NextResponse.json({
        success: true,
        engines,
      });
    } else if (path.includes('/data-quality')) {
      // Get data quality report
      const qualityReport = await businessIntelligenceService.checkDataQuality(siteId);

      return NextResponse.json({
        success: true,
        qualityReport,
      });
    } else if (path.includes('/performance-metrics')) {
      // Get performance metrics
      const performance = await businessIntelligenceService.getPerformanceMetrics(siteId);

      return NextResponse.json({
        success: true,
        performance,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching business intelligence data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/business-intelligence - Create BI resources
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create BI resources
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    // Get site ID from body or user's site
    const siteId = body.siteId || user.siteId;

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    if (path.includes('/data-warehouses')) {
      // Create data warehouse
      const warehouse = await businessIntelligenceService.createDataWarehouse(body);
      
      return NextResponse.json({
        success: true,
        warehouse,
      });
    } else if (path.includes('/data-sources')) {
      // Create data source
      const source = await businessIntelligenceService.createDataSource(body);
      
      return NextResponse.json({
        success: true,
        source,
      });
    } else if (path.includes('/etl-jobs')) {
      // Create ETL job
      const job = await businessIntelligenceService.createETLJob(body);
      
      return NextResponse.json({
        success: true,
        job,
      });
    } else if (path.includes('/dashboards')) {
      // Create dashboard
      const dashboard = await businessIntelligenceService.createDashboard(body);
      
      return NextResponse.json({
        success: true,
        dashboard,
      });
    } else if (path.includes('/business-metrics')) {
      // Create business metric
      const metric = await businessIntelligenceService.createBusinessMetric(body);
      
      return NextResponse.json({
        success: true,
        metric,
      });
    } else if (path.includes('/competitive-intelligence')) {
      // Create competitive intelligence
      const intelligence = await businessIntelligenceService.createCompetitiveIntelligence(body);
      
      return NextResponse.json({
        success: true,
        intelligence,
      });
    } else if (path.includes('/market-data')) {
      // Create market data
      const marketData = await businessIntelligenceService.createMarketData(body);
      
      return NextResponse.json({
        success: true,
        marketData,
      });
    } else if (path.includes('/predictive-insights')) {
      // Create predictive insight
      const insight = await businessIntelligenceService.createPredictiveInsight(body);
      
      return NextResponse.json({
        success: true,
        insight,
      });
    } else if (path.includes('/analytics-engines')) {
      // Create analytics engine
      const engine = await businessIntelligenceService.createAnalyticsEngine(body);
      
      return NextResponse.json({
        success: true,
        engine,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating business intelligence resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/business-intelligence - Update BI resources
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update BI resources
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/business-metrics/')) {
      // Update business metric
      const id = path.split('/').pop();
      if (!id) {
        return NextResponse.json({ error: 'Metric ID required' }, { status: 400 });
      }

      const metric = await businessIntelligenceService.updateBusinessMetric(id, body);
      
      return NextResponse.json({
        success: true,
        metric,
      });
    } else if (path.includes('/competitive-intelligence/')) {
      // Update competitive intelligence
      const id = path.split('/').pop();
      if (!id) {
        return NextResponse.json({ error: 'Intelligence ID required' }, { status: 400 });
      }

      const intelligence = await businessIntelligenceService.updateCompetitiveData(id, body);
      
      return NextResponse.json({
        success: true,
        intelligence,
      });
    } else if (path.includes('/predictive-insights/')) {
      // Verify predictive insight
      const id = path.split('/').pop();
      if (!id) {
        return NextResponse.json({ error: 'Insight ID required' }, { status: 400 });
      }

      const insight = await businessIntelligenceService.verifyInsight(id, body.accuracy);
      
      return NextResponse.json({
        success: true,
        insight,
      });
    } else if (path.includes('/business-alerts/')) {
      // Acknowledge or resolve alert
      const id = path.split('/').pop();
      if (!id) {
        return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
      }

      let alert;
      if (body.action === 'acknowledge') {
        alert = await businessIntelligenceService.acknowledgeAlert(id);
      } else if (body.action === 'resolve') {
        alert = await businessIntelligenceService.resolveAlert(id);
      } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        alert,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating business intelligence resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 