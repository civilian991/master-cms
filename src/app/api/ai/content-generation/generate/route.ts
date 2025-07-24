import { NextRequest, NextResponse } from 'next/server';
import { AdvancedContentGenerationService } from '@/lib/services/ai/content-generation-advanced';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const contentService = AdvancedContentGenerationService.getInstance();

// Validation schemas
const generateContentSchema = z.object({
  action: z.literal('generate'),
  sessionId: z.number().int().positive(),
  useTemplate: z.boolean().default(false),
  optimizeContent: z.boolean().default(true),
  personalizeContent: z.boolean().default(true),
});

const optimizeContentSchema = z.object({
  action: z.literal('optimize'),
  versionId: z.number().int().positive(),
});

const personalizeContentSchema = z.object({
  action: z.literal('personalize'),
  versionId: z.number().int().positive(),
  personalizationData: z.record(z.any()).optional(),
});

// POST /api/ai/content-generation/generate - Handle content generation operations
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (generate, optimize, or personalize)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'generate':
        return await handleGenerateContent(user, body);
      case 'optimize':
        return await handleOptimizeContent(user, body);
      case 'personalize':
        return await handlePersonalizeContent(user, body);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use generate, optimize, or personalize' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in content generation operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to handle content generation
async function handleGenerateContent(user: any, body: any) {
  // Check if user has permission to generate content
  if (!user.permissions.includes('ai:content:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validatedData = generateContentSchema.parse(body);

  // Get session to check permissions
  const session = await contentService.getContentSession(validatedData.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Check if user has access to the site
  if (!user.permissions.includes('site:all') && user.siteId !== session.siteId) {
    return NextResponse.json({ error: 'Access denied to this session' }, { status: 403 });
  }

  // Generate content
  const version = await contentService.generateContent(validatedData.sessionId, {
    useTemplate: validatedData.useTemplate,
    optimizeContent: validatedData.optimizeContent,
    personalizeContent: validatedData.personalizeContent,
  });

  return NextResponse.json({
    success: true,
    version,
  });
}

// Helper function to handle content optimization
async function handleOptimizeContent(user: any, body: any) {
  // Check if user has permission to optimize content
  if (!user.permissions.includes('ai:content:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validatedData = optimizeContentSchema.parse(body);

  // Get version to check permissions
  const version = await contentService.getContentVersion(validatedData.versionId);
  if (!version) {
    return NextResponse.json({ error: 'Content version not found' }, { status: 404 });
  }

  // Check if user has access to the site
  if (!user.permissions.includes('site:all') && user.siteId !== version.session.siteId) {
    return NextResponse.json({ error: 'Access denied to this content' }, { status: 403 });
  }

  // Optimize content
  const optimizedVersion = await contentService.optimizeContent(validatedData.versionId);

  return NextResponse.json({
    success: true,
    version: optimizedVersion,
  });
}

// Helper function to handle content personalization
async function handlePersonalizeContent(user: any, body: any) {
  // Check if user has permission to personalize content
  if (!user.permissions.includes('ai:content:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validatedData = personalizeContentSchema.parse(body);

  // Get version to check permissions
  const version = await contentService.getContentVersion(validatedData.versionId);
  if (!version) {
    return NextResponse.json({ error: 'Content version not found' }, { status: 404 });
  }

  // Check if user has access to the site
  if (!user.permissions.includes('site:all') && user.siteId !== version.session.siteId) {
    return NextResponse.json({ error: 'Access denied to this content' }, { status: 403 });
  }

  // Personalize content
  const personalizedVersion = await contentService.personalizeContent(
    validatedData.versionId,
    validatedData.personalizationData
  );

  return NextResponse.json({
    success: true,
    version: personalizedVersion,
  });
}

// GET /api/ai/content-generation/quality - Get content quality metrics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view quality metrics
    if (!user.permissions.includes('ai:content:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    // Get quality metrics
    const metrics = await prisma.contentQualityMetrics.findUnique({
      where: { versionId: parseInt(versionId) },
      include: {
        version: {
          include: {
            session: {
              include: {
                site: true,
              },
            },
          },
        },
      },
    });

    if (!metrics) {
      return NextResponse.json({ error: 'Quality metrics not found' }, { status: 404 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== metrics.version.session.siteId) {
      return NextResponse.json({ error: 'Access denied to this content' }, { status: 403 });
    }

    return NextResponse.json({
      metrics,
    });

  } catch (error) {
    console.error('Error fetching quality metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 