import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/lib/services/ai/content-generation';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const contentGenerationService = new ContentGenerationService();

// Validation schemas
const singleGenerationSchema = z.object({
  siteId: z.number().int().positive(),
  contentType: z.enum(['article', 'summary', 'social', 'video_script', 'newsletter', 'press_release', 'blog_post']),
  topic: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  targetLength: z.number().positive().optional(),
  language: z.enum(['en', 'ar', 'bilingual']).optional(),
  template: z.string().optional(),
  context: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  categoryId: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.number().int().positive().optional(),
});

const batchGenerationSchema = z.object({
  requests: z.array(singleGenerationSchema),
});

// POST /api/ai/generate - Generate single content
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to generate content
    if (!user.permissions.includes('content:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = singleGenerationSchema.parse(body);

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const result = await contentGenerationService.generateContent(validatedData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        content: result.content,
        quality: result.quality,
        usage: result.usage,
        processingTime: result.processingTime,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        processingTime: result.processingTime,
      }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('AI content generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/generate - Generate batch content
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to generate content
    if (!user.permissions.includes('content:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = batchGenerationSchema.parse(body);

    // Validate that all requests are for sites the user has access to
    if (!user.permissions.includes('site:all')) {
      const unauthorizedSites = validatedData.requests.filter(
        req => req.siteId !== user.siteId
      );
      
      if (unauthorizedSites.length > 0) {
        return NextResponse.json(
          { error: 'Access denied to some sites' },
          { status: 403 }
        );
      }
    }

    // Limit batch size
    if (validatedData.requests.length > 50) {
      return NextResponse.json(
        { error: 'Batch size too large. Maximum 50 requests allowed.' },
        { status: 400 }
      );
    }

    const results = await contentGenerationService.generateBatch(validatedData.requests);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        successRate: (successful / results.length) * 100,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('AI batch content generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 