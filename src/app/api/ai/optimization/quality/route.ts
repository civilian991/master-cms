import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';

// Validation schemas
const ContentQualityAnalysisRequestSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['article', 'page', 'category']),
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().optional(),
  targetAudience: z.enum(['general', 'technical', 'academic', 'casual']).optional(),
  language: z.string().default('en'),
});

const BatchQualityAnalysisRequestSchema = z.object({
  contentIds: z.array(z.string().uuid()),
  contentType: z.enum(['article', 'page', 'category']),
  targetAudience: z.enum(['general', 'technical', 'academic', 'casual']).optional(),
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
      case 'analyze':
        return await handleContentQualityAnalysis(body);
      case 'batch-analyze':
        return await handleBatchQualityAnalysis(body);
      case 'improve':
        return await handleContentImprovement(body);
      case 'generate-report':
        return await handleGenerateQualityReport(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Content quality analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleContentQualityAnalysis(body: any) {
  const validatedData = ContentQualityAnalysisRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.analyzeContentQuality({
      contentId: validatedData.contentId,
      contentType: validatedData.contentType,
      title: validatedData.title,
      content: validatedData.content,
      author: validatedData.author,
      targetAudience: validatedData.targetAudience,
      language: validatedData.language,
    });

    // Save content quality analysis
    const contentQualityAnalysis = await prisma.contentQualityAnalysis.create({
      data: {
        contentId: validatedData.contentId,
        contentType: validatedData.contentType,
        readabilityScore: result.readabilityScore,
        structureScore: result.structureScore,
        engagementScore: result.engagementScore,
        seoScore: result.seoScore,
        overallScore: result.overallScore,
        metrics: result.metrics,
        recommendations: result.recommendations,
        issues: result.issues,
        status: 'completed',
        analyzedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      analysis: contentQualityAnalysis,
      result,
    });
  } catch (error) {
    console.error('Content quality analysis failed:', error);
    return NextResponse.json(
      { error: 'Content quality analysis failed' },
      { status: 500 }
    );
  }
}

async function handleBatchQualityAnalysis(body: any) {
  const validatedData = BatchQualityAnalysisRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const results = await optimizationService.batchAnalyzeContentQuality({
      contentIds: validatedData.contentIds,
      contentType: validatedData.contentType,
      targetAudience: validatedData.targetAudience,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Batch quality analysis failed:', error);
    return NextResponse.json(
      { error: 'Batch quality analysis failed' },
      { status: 500 }
    );
  }
}

async function handleContentImprovement(body: any) {
  const { contentId, contentType, content, improvements } = body;

  if (!contentId || !contentType || !content) {
    return NextResponse.json(
      { error: 'Content ID, type, and content are required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.improveContent({
      contentId,
      contentType,
      content,
      improvements: improvements || [],
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Content improvement failed:', error);
    return NextResponse.json(
      { error: 'Content improvement failed' },
      { status: 500 }
    );
  }
}

async function handleGenerateQualityReport(body: any) {
  const { contentType, timeRange, targetAudience } = body;

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const report = await optimizationService.generateQualityReport({
      contentType,
      timeRange: timeRange || '30d',
      targetAudience,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Generating quality report failed:', error);
    return NextResponse.json(
      { error: 'Generating quality report failed' },
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
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (contentId) where.contentId = contentId;
    if (contentType) where.contentType = contentType;
    if (status) where.status = status;
    if (minScore) where.overallScore = { gte: parseFloat(minScore) };

    const [analyses, total] = await Promise.all([
      prisma.contentQualityAnalysis.findMany({
        where,
        orderBy: { analyzedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          content: true,
        },
      }),
      prisma.contentQualityAnalysis.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch content quality analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
} 