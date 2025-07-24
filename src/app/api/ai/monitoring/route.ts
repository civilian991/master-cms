import { NextRequest, NextResponse } from 'next/server';
import { AIServiceManager } from '@/lib/services/ai/manager';
import { ContentGenerationService } from '@/lib/services/ai/content-generation';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const aiManager = AIServiceManager.getInstance();
const contentGenerationService = new ContentGenerationService();

// Validation schemas
const monitoringQuerySchema = z.object({
  siteId: z.number().int().positive(),
  timeRange: z.enum(['day', 'week', 'month']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/ai/monitoring - Get AI monitoring data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view monitoring
    if (!user.permissions.includes('ai:monitor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      siteId: parseInt(searchParams.get('siteId') || '0'),
      timeRange: searchParams.get('timeRange') as 'day' | 'week' | 'month' | undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validatedQuery = monitoringQuerySchema.parse(queryData);

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== validatedQuery.siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    // Get AI service health
    const healthStatus = await aiManager.isHealthy(validatedQuery.siteId);
    const serviceMetrics = await aiManager.getMetrics(validatedQuery.siteId);

    // Get quality metrics
    const qualityMetrics = await contentGenerationService.getQualityMetrics(
      validatedQuery.siteId,
      validatedQuery.timeRange || 'week'
    );

    // Get recent processing logs
    const recentLogs = await prisma.aiProcessingLog.findMany({
      where: {
        siteId: validatedQuery.siteId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get cost analysis
    const costAnalysis = await getCostAnalysis(validatedQuery.siteId, validatedQuery.timeRange);

    // Get performance trends
    const performanceTrends = await getPerformanceTrends(validatedQuery.siteId, validatedQuery.timeRange);

    return NextResponse.json({
      health: {
        status: healthStatus,
        services: serviceMetrics,
      },
      quality: qualityMetrics,
      recentLogs,
      costAnalysis,
      performanceTrends,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('AI monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/monitoring/reset - Reset circuit breakers
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage AI services
    if (!user.permissions.includes('ai:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { siteId } = body;

    if (!siteId || typeof siteId !== 'number') {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    await aiManager.resetCircuitBreakers(siteId);

    return NextResponse.json({
      success: true,
      message: 'Circuit breakers reset successfully',
    });

  } catch (error) {
    console.error('AI monitoring reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getCostAnalysis(siteId: number, timeRange?: string): Promise<any> {
  const startDate = getStartDate(timeRange);

  const logs = await prisma.aiProcessingLog.findMany({
    where: {
      siteId,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      cost: true,
      provider: true,
      model: true,
      createdAt: true,
    },
  });

  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const costByProvider = logs.reduce((acc, log) => {
    const provider = log.provider || 'unknown';
    acc[provider] = (acc[provider] || 0) + (log.cost || 0);
    return acc;
  }, {} as Record<string, number>);

  const costByModel = logs.reduce((acc, log) => {
    const model = log.model || 'unknown';
    acc[model] = (acc[model] || 0) + (log.cost || 0);
    return acc;
  }, {} as Record<string, number>);

  // Daily cost breakdown
  const dailyCosts = logs.reduce((acc, log) => {
    const date = log.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + (log.cost || 0);
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCost,
    costByProvider,
    costByModel,
    dailyCosts,
    averageCostPerRequest: logs.length > 0 ? totalCost / logs.length : 0,
  };
}

async function getPerformanceTrends(siteId: number, timeRange?: string): Promise<any> {
  const startDate = getStartDate(timeRange);

  const logs = await prisma.aiProcessingLog.findMany({
    where: {
      siteId,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      responseTime: true,
      qualityScore: true,
      status: true,
      createdAt: true,
    },
  });

  const successfulLogs = logs.filter(log => log.status === 'success');
  const failedLogs = logs.filter(log => log.status !== 'success');

  // Response time trends
  const responseTimeTrends = successfulLogs.reduce((acc, log) => {
    const date = log.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0 };
    }
    acc[date].total += log.responseTime || 0;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Calculate averages
  Object.keys(responseTimeTrends).forEach(date => {
    const data = responseTimeTrends[date];
    responseTimeTrends[date] = data.count > 0 ? data.total / data.count : 0;
  });

  // Quality score trends
  const qualityTrends = successfulLogs.reduce((acc, log) => {
    const date = log.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0 };
    }
    acc[date].total += log.qualityScore || 0;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Calculate averages
  Object.keys(qualityTrends).forEach(date => {
    const data = qualityTrends[date];
    qualityTrends[date] = data.count > 0 ? data.total / data.count : 0;
  });

  return {
    responseTimeTrends,
    qualityTrends,
    successRate: logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0,
    averageResponseTime: successfulLogs.length > 0 
      ? successfulLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / successfulLogs.length 
      : 0,
    averageQualityScore: successfulLogs.length > 0 
      ? successfulLogs.reduce((sum, log) => sum + (log.qualityScore || 0), 0) / successfulLogs.length 
      : 0,
  };
}

function getStartDate(timeRange?: string): Date {
  const now = new Date();
  
  switch (timeRange) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to week
  }
} 