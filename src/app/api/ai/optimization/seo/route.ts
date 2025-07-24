import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';

// Validation schemas
const SeoOptimizationRequestSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['article', 'page', 'category']),
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(160),
  keywords: z.array(z.string()).optional(),
  content: z.string().min(1),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
});

const StructuredDataRequestSchema = z.object({
  contentType: z.enum(['article', 'organization', 'website', 'breadcrumb']),
  data: z.record(z.any()),
});

const BatchOptimizationRequestSchema = z.object({
  contentIds: z.array(z.string().uuid()),
  contentType: z.enum(['article', 'page', 'category']),
  optimizationType: z.enum(['meta', 'structured', 'full']),
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
      case 'optimize':
        return await handleSeoOptimization(body);
      case 'generate-structured-data':
        return await handleStructuredDataGeneration(body);
      case 'batch-optimize':
        return await handleBatchOptimization(body);
      case 'analyze':
        return await handleSeoAnalysis(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('SEO optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSeoOptimization(body: any) {
  const validatedData = SeoOptimizationRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.optimizeSEO({
      contentId: validatedData.contentId,
      contentType: validatedData.contentType,
      title: validatedData.title,
      description: validatedData.description,
      keywords: validatedData.keywords || [],
      content: validatedData.content,
      url: validatedData.url,
      imageUrl: validatedData.imageUrl,
    });

    // Save optimization record
    const seoOptimization = await prisma.sEOOptimization.create({
      data: {
        contentId: validatedData.contentId,
        contentType: validatedData.contentType,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        keywords: result.keywords,
        structuredData: result.structuredData,
        score: result.score,
        recommendations: result.recommendations,
        status: 'completed',
        optimizedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      optimization: seoOptimization,
      result,
    });
  } catch (error) {
    console.error('SEO optimization failed:', error);
    return NextResponse.json(
      { error: 'SEO optimization failed' },
      { status: 500 }
    );
  }
}

async function handleStructuredDataGeneration(body: any) {
  const validatedData = StructuredDataRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const structuredData = await optimizationService.generateStructuredData(
      validatedData.contentType,
      validatedData.data
    );

    return NextResponse.json({
      success: true,
      structuredData,
    });
  } catch (error) {
    console.error('Structured data generation failed:', error);
    return NextResponse.json(
      { error: 'Structured data generation failed' },
      { status: 500 }
    );
  }
}

async function handleBatchOptimization(body: any) {
  const validatedData = BatchOptimizationRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const results = await optimizationService.batchOptimizeSEO({
      contentIds: validatedData.contentIds,
      contentType: validatedData.contentType,
      optimizationType: validatedData.optimizationType,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Batch optimization failed:', error);
    return NextResponse.json(
      { error: 'Batch optimization failed' },
      { status: 500 }
    );
  }
}

async function handleSeoAnalysis(body: any) {
  const { contentId, contentType } = body;

  if (!contentId || !contentType) {
    return NextResponse.json(
      { error: 'Content ID and type are required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const analysis = await optimizationService.analyzeSEO({
      contentId,
      contentType,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('SEO analysis failed:', error);
    return NextResponse.json(
      { error: 'SEO analysis failed' },
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (contentId) where.contentId = contentId;
    if (contentType) where.contentType = contentType;
    if (status) where.status = status;

    const [optimizations, total] = await Promise.all([
      prisma.sEOOptimization.findMany({
        where,
        orderBy: { optimizedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          content: true,
        },
      }),
      prisma.sEOOptimization.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      optimizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch SEO optimizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimizations' },
      { status: 500 }
    );
  }
} 