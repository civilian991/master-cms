import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';

// Validation schemas
const PerformanceMetricsRequestSchema = z.object({
  url: z.string().url(),
  contentType: z.enum(['article', 'page', 'category']),
  contentId: z.string().uuid().optional(),
  metrics: z.object({
    lcp: z.number().optional(),
    fid: z.number().optional(),
    cls: z.number().optional(),
    ttfb: z.number().optional(),
    fcp: z.number().optional(),
    si: z.number().optional(),
    tti: z.number().optional(),
    tbt: z.number().optional(),
  }),
  userAgent: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  connectionSpeed: z.enum(['slow', 'fast', '4g']).optional(),
});

const PerformanceBudgetRequestSchema = z.object({
  budgetType: z.enum(['lcp', 'fid', 'cls', 'ttfb', 'fcp', 'si', 'tti', 'tbt']),
  threshold: z.number().positive(),
  action: z.enum(['alert', 'block', 'optimize']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'track':
        return await handlePerformanceTracking(body);
      case 'analyze':
        return await handlePerformanceAnalysis(body);
      case 'set-budget':
        return await handleSetPerformanceBudget(body);
      case 'get-insights':
        return await handleGetPerformanceInsights(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePerformanceTracking(body: any) {
  const validatedData = PerformanceMetricsRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.trackPerformanceMetrics({
      url: validatedData.url,
      contentType: validatedData.contentType,
      contentId: validatedData.contentId,
      metrics: validatedData.metrics,
      userAgent: validatedData.userAgent,
      deviceType: validatedData.deviceType,
      connectionSpeed: validatedData.connectionSpeed,
    });

    // Save performance metrics
    const performanceMetrics = await prisma.performanceMetrics.create({
      data: {
        url: validatedData.url,
        contentType: validatedData.contentType,
        contentId: validatedData.contentId,
        lcp: validatedData.metrics.lcp,
        fid: validatedData.metrics.fid,
        cls: validatedData.metrics.cls,
        ttfb: validatedData.metrics.ttfb,
        fcp: validatedData.metrics.fcp,
        si: validatedData.metrics.si,
        tti: validatedData.metrics.tti,
        tbt: validatedData.metrics.tbt,
        userAgent: validatedData.userAgent,
        deviceType: validatedData.deviceType,
        connectionSpeed: validatedData.connectionSpeed,
        score: result.score,
        status: result.status,
        recordedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      metrics: performanceMetrics,
      result,
    });
  } catch (error) {
    console.error('Performance tracking failed:', error);
    return NextResponse.json(
      { error: 'Performance tracking failed' },
      { status: 500 }
    );
  }
}

async function handlePerformanceAnalysis(body: any) {
  const { url, contentType, timeRange } = body;

  if (!url) {
    return NextResponse.json(
      { error: 'URL is required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const analysis = await optimizationService.analyzePerformance({
      url,
      contentType,
      timeRange: timeRange || '7d',
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Performance analysis failed:', error);
    return NextResponse.json(
      { error: 'Performance analysis failed' },
      { status: 500 }
    );
  }
}

async function handleSetPerformanceBudget(body: any) {
  const validatedData = PerformanceBudgetRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const budget = await optimizationService.setPerformanceBudget({
      budgetType: validatedData.budgetType,
      threshold: validatedData.threshold,
      action: validatedData.action,
      priority: validatedData.priority,
    });

    // Save performance budget
    const performanceBudget = await prisma.performanceBudget.create({
      data: {
        budgetType: validatedData.budgetType,
        threshold: validatedData.threshold,
        action: validatedData.action,
        priority: validatedData.priority,
        isActive: true,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      budget: performanceBudget,
    });
  } catch (error) {
    console.error('Setting performance budget failed:', error);
    return NextResponse.json(
      { error: 'Setting performance budget failed' },
      { status: 500 }
    );
  }
}

async function handleGetPerformanceInsights(body: any) {
  const { contentType, timeRange } = body;

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const insights = await optimizationService.getPerformanceInsights({
      contentType,
      timeRange: timeRange || '30d',
    });

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Getting performance insights failed:', error);
    return NextResponse.json(
      { error: 'Getting performance insights failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const contentType = searchParams.get('contentType');
    const timeRange = searchParams.get('timeRange') || '7d';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (url) where.url = url;
    if (contentType) where.contentType = contentType;

    // Add time range filter
    const timeRangeDate = new Date();
    switch (timeRange) {
      case '1d':
        timeRangeDate.setDate(timeRangeDate.getDate() - 1);
        break;
      case '7d':
        timeRangeDate.setDate(timeRangeDate.getDate() - 7);
        break;
      case '30d':
        timeRangeDate.setDate(timeRangeDate.getDate() - 30);
        break;
      case '90d':
        timeRangeDate.setDate(timeRangeDate.getDate() - 90);
        break;
    }
    where.recordedAt = { gte: timeRangeDate };

    const [metrics, total] = await Promise.all([
      prisma.performanceMetrics.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.performanceMetrics.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      metrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 