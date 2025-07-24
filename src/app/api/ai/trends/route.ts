import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TrendAnalysisService } from '@/lib/services/ai/trend-analysis';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const trendService = TrendAnalysisService.getInstance();

    switch (action) {
      case 'detect':
        const trends = await trendService.detectTrends();
        return NextResponse.json({
          success: true,
          trends,
          count: trends.length,
        });

      case 'analyze':
        const { keyword } = body;
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required' },
            { status: 400 }
          );
        }
        
        const analysis = await trendService.analyzeTrend(keyword);
        return NextResponse.json({
          success: true,
          analysis,
        });

      case 'predict':
        const predictions = await trendService.predictTrends();
        return NextResponse.json({
          success: true,
          predictions,
        });

      case 'opportunities':
        const opportunities = await trendService.identifyOpportunities();
        return NextResponse.json({
          success: true,
          opportunities,
        });

      case 'competition':
        const competitiveAnalysis = await trendService.analyzeCompetition();
        return NextResponse.json({
          success: true,
          competitiveAnalysis,
        });

      case 'setup-alerts':
        const { keywords } = body;
        if (!keywords || !Array.isArray(keywords)) {
          return NextResponse.json(
            { error: 'Keywords array is required' },
            { status: 400 }
          );
        }
        
        await trendService.setupTrendAlerts(keywords);
        return NextResponse.json({
          success: true,
          message: 'Trend alerts setup successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Trend analysis error:', error);
    return NextResponse.json(
      { error: 'Trend analysis failed' },
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
    const category = searchParams.get('category');
    const minVolume = searchParams.get('minVolume');
    const activeOnly = searchParams.get('activeOnly');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (category) where.category = category;
    if (minVolume) where.volume = { gte: parseInt(minVolume) };
    if (activeOnly === 'true') where.expiresAt = { gt: new Date() };

    const [trends, total] = await Promise.all([
      prisma.contentTrend.findMany({
        where,
        orderBy: { volume: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentTrend.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      trends,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
} 