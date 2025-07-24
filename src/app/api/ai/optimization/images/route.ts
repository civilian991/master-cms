import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';

// Validation schemas
const ImageOptimizationRequestSchema = z.object({
  imageUrl: z.string().url(),
  imageId: z.string().uuid().optional(),
  contentType: z.enum(['article', 'page', 'gallery']),
  optimizationLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  formats: z.array(z.enum(['webp', 'avif', 'jpeg'])).default(['webp']),
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional(),
  quality: z.number().min(1).max(100).optional(),
});

const BatchImageOptimizationRequestSchema = z.object({
  imageUrls: z.array(z.string().url()),
  contentType: z.enum(['article', 'page', 'gallery']),
  optimizationLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  formats: z.array(z.enum(['webp', 'avif', 'jpeg'])).default(['webp']),
});

const ImageAnalysisRequestSchema = z.object({
  imageUrl: z.string().url(),
  imageId: z.string().uuid().optional(),
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
        return await handleImageOptimization(body);
      case 'batch-optimize':
        return await handleBatchImageOptimization(body);
      case 'analyze':
        return await handleImageAnalysis(body);
      case 'convert-format':
        return await handleFormatConversion(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleImageOptimization(body: any) {
  const validatedData = ImageOptimizationRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.optimizeImage({
      imageUrl: validatedData.imageUrl,
      imageId: validatedData.imageId,
      contentType: validatedData.contentType,
      optimizationLevel: validatedData.optimizationLevel,
      formats: validatedData.formats,
      maxWidth: validatedData.maxWidth,
      maxHeight: validatedData.maxHeight,
      quality: validatedData.quality,
    });

    // Save optimization record
    const imageOptimization = await prisma.imageOptimization.create({
      data: {
        originalUrl: validatedData.imageUrl,
        imageId: validatedData.imageId,
        contentType: validatedData.contentType,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        compressionRatio: result.compressionRatio,
        formats: result.formats,
        optimizedUrls: result.optimizedUrls,
        score: result.score,
        recommendations: result.recommendations,
        status: 'completed',
        optimizedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      optimization: imageOptimization,
      result,
    });
  } catch (error) {
    console.error('Image optimization failed:', error);
    return NextResponse.json(
      { error: 'Image optimization failed' },
      { status: 500 }
    );
  }
}

async function handleBatchImageOptimization(body: any) {
  const validatedData = BatchImageOptimizationRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const results = await optimizationService.batchOptimizeImages({
      imageUrls: validatedData.imageUrls,
      contentType: validatedData.contentType,
      optimizationLevel: validatedData.optimizationLevel,
      formats: validatedData.formats,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Batch image optimization failed:', error);
    return NextResponse.json(
      { error: 'Batch image optimization failed' },
      { status: 500 }
    );
  }
}

async function handleImageAnalysis(body: any) {
  const validatedData = ImageAnalysisRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const analysis = await optimizationService.analyzeImage({
      imageUrl: validatedData.imageUrl,
      imageId: validatedData.imageId,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Image analysis failed:', error);
    return NextResponse.json(
      { error: 'Image analysis failed' },
      { status: 500 }
    );
  }
}

async function handleFormatConversion(body: any) {
  const { imageUrl, targetFormat, quality } = body;

  if (!imageUrl || !targetFormat) {
    return NextResponse.json(
      { error: 'Image URL and target format are required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.convertImageFormat({
      imageUrl,
      targetFormat,
      quality: quality || 85,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Format conversion failed:', error);
    return NextResponse.json(
      { error: 'Format conversion failed' },
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
    const imageId = searchParams.get('imageId');
    const contentType = searchParams.get('contentType');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (imageId) where.imageId = imageId;
    if (contentType) where.contentType = contentType;
    if (status) where.status = status;

    const [optimizations, total] = await Promise.all([
      prisma.imageOptimization.findMany({
        where,
        orderBy: { optimizedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.imageOptimization.count({ where }),
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
    console.error('Failed to fetch image optimizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimizations' },
      { status: 500 }
    );
  }
} 