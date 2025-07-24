import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Fetch statistics from all optimization tables
    const [
      seoOptimizations,
      imageOptimizations,
      performanceMetrics,
      accessibilityAudits,
      qualityAnalyses,
      triggers,
    ] = await Promise.all([
      prisma.sEOOptimization.findMany({
        where: {
          optimizedAt: { gte: startDate, lte: endDate },
        },
        select: {
          score: true,
          status: true,
        },
      }),
      prisma.imageOptimization.findMany({
        where: {
          optimizedAt: { gte: startDate, lte: endDate },
        },
        select: {
          score: true,
          status: true,
        },
      }),
      prisma.performanceMetrics.findMany({
        where: {
          recordedAt: { gte: startDate, lte: endDate },
        },
        select: {
          score: true,
          status: true,
        },
      }),
      prisma.accessibilityAudit.findMany({
        where: {
          auditedAt: { gte: startDate, lte: endDate },
        },
        select: {
          score: true,
          status: true,
        },
      }),
      prisma.contentQualityAnalysis.findMany({
        where: {
          analyzedAt: { gte: startDate, lte: endDate },
        },
        select: {
          overallScore: true,
          status: true,
        },
      }),
      prisma.optimizationTrigger.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          triggerType: true,
        },
      }),
    ]);

    // Calculate statistics
    const allOptimizations = [
      ...seoOptimizations.map(o => ({ score: o.score, status: o.status })),
      ...imageOptimizations.map(o => ({ score: o.score, status: o.status })),
      ...performanceMetrics.map(o => ({ score: o.score, status: o.status })),
      ...accessibilityAudits.map(o => ({ score: o.score, status: o.status })),
      ...qualityAnalyses.map(o => ({ score: o.overallScore, status: o.status })),
    ];

    const totalOptimizations = allOptimizations.length;
    const completedOptimizations = allOptimizations.filter(o => o.status === 'completed').length;
    const averageScore = totalOptimizations > 0 
      ? allOptimizations.reduce((sum, o) => sum + (o.score || 0), 0) / totalOptimizations
      : 0;
    
    const issuesFound = allOptimizations.filter(o => (o.score || 0) < 70).length;
    const pendingOptimizations = allOptimizations.filter(o => o.status === 'pending').length;

    const stats = {
      totalOptimizations,
      averageScore: Math.round(averageScore * 10) / 10,
      issuesFound,
      optimizationsCompleted: completedOptimizations,
      pendingOptimizations,
      activeTriggers: triggers.length,
      breakdown: {
        seo: seoOptimizations.length,
        images: imageOptimizations.length,
        performance: performanceMetrics.length,
        accessibility: accessibilityAudits.length,
        quality: qualityAnalyses.length,
      },
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch optimization stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 