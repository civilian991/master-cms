import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { PerformanceMonitoringService, PerformanceMonitoringConfig } from '@/lib/services/performance-monitoring';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const performanceConfig: PerformanceMonitoringConfig = {
      provider: 'prometheus',
      region: process.env.AWS_REGION || 'us-east-1',
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://localhost:9090',
      grafanaUrl: process.env.GRAFANA_URL || 'http://localhost:3001',
      apiKey: process.env.PERFORMANCE_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const performanceService = new PerformanceMonitoringService(performanceConfig);

    switch (action) {
      case 'metrics':
        const metrics = await performanceService.getPerformanceMetrics();
        return NextResponse.json({ metrics });

      case 'alerts':
        const alerts = await performanceService.getPerformanceAlerts();
        return NextResponse.json({ alerts });

      case 'recommendations':
        const recommendations = await performanceService.createPerformanceRecommendations();
        return NextResponse.json({ recommendations });

      case 'custom-metrics':
        const customMetrics = await performanceService.createCustomMetrics();
        return NextResponse.json({ customMetrics });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    const performanceConfig: PerformanceMonitoringConfig = {
      provider: data.provider || 'prometheus',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      prometheusUrl: data.prometheusUrl || process.env.PROMETHEUS_URL || 'http://localhost:9090',
      grafanaUrl: data.grafanaUrl || process.env.GRAFANA_URL || 'http://localhost:3001',
      apiKey: data.apiKey || process.env.PERFORMANCE_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const performanceService = new PerformanceMonitoringService(performanceConfig);

    switch (action) {
      case 'setup-prometheus':
        const prometheusResult = await performanceService.setupPrometheusMonitoring();
        return NextResponse.json({ success: prometheusResult });

      case 'setup-grafana':
        const grafanaResult = await performanceService.configureGrafanaDashboards();
        return NextResponse.json({ success: grafanaResult });

      case 'setup-apm':
        const apmResult = await performanceService.setupAPM();
        return NextResponse.json({ success: apmResult });

      case 'setup-log-aggregation':
        const logAggregationResult = await performanceService.setupLogAggregation();
        return NextResponse.json({ success: logAggregationResult });

      case 'setup-real-time-tracking':
        const realTimeResult = await performanceService.setupRealTimeTracking();
        return NextResponse.json({ success: realTimeResult });

      case 'setup-automated-testing':
        const testingResult = await performanceService.setupAutomatedPerformanceTesting();
        return NextResponse.json({ success: testingResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 