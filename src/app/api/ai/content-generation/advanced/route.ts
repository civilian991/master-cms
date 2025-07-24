import { NextRequest, NextResponse } from 'next/server';
import { AdvancedContentGenerationService } from '@/lib/services/ai/content-generation-advanced';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const contentService = AdvancedContentGenerationService.getInstance();

// Validation schemas
const createTemplateSchema = z.object({
  siteId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  templateStructure: z.object({
    sections: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'list', 'quote', 'image', 'video']),
      required: z.boolean(),
      maxLength: z.number().optional(),
    })),
    format: z.string(),
    style: z.string(),
  }),
  aiPrompts: z.object({
    systemPrompt: z.string(),
    userPrompt: z.string(),
    examples: z.array(z.string()).optional(),
  }),
  optimizationRules: z.object({
    seoKeywords: z.array(z.string()),
    targetLength: z.object({
      min: z.number(),
      max: z.number(),
    }),
    tone: z.string(),
    style: z.string(),
  }),
  qualityCriteria: z.object({
    readabilityTarget: z.number().min(0).max(100),
    seoScoreTarget: z.number().min(0).max(100),
    engagementTarget: z.number().min(0).max(100),
  }),
  parentTemplate: z.number().int().positive().optional(),
  templateVariables: z.record(z.any()).optional(),
});

const createSessionSchema = z.object({
  siteId: z.number().int().positive(),
  sessionType: z.enum(['single', 'batch', 'campaign']),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  templateId: z.number().int().positive().optional(),
  generationParams: z.object({
    topic: z.string(),
    keywords: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    tone: z.string().optional(),
    length: z.number().optional(),
    language: z.string().optional(),
  }),
  optimizationSettings: z.object({
    seoOptimization: z.boolean().default(true),
    readabilityOptimization: z.boolean().default(true),
    engagementOptimization: z.boolean().default(true),
    plagiarismCheck: z.boolean().default(true),
  }),
  personalizationData: z.record(z.any()).optional(),
});

const batchGenerationSchema = z.object({
  siteId: z.number().int().positive(),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  topics: z.array(z.string()).min(1),
  templateId: z.number().int().positive().optional(),
  optimizationSettings: z.record(z.any()).optional(),
});

const createScheduleSchema = z.object({
  siteId: z.number().int().positive(),
  scheduleName: z.string().min(1),
  scheduleType: z.enum(['single', 'recurring', 'campaign']),
  scheduleConfig: z.object({
    frequency: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    timeSlots: z.array(z.string()).optional(),
  }),
  contentType: z.enum(['article', 'social', 'newsletter', 'video', 'podcast']),
  templateId: z.number().int().positive().optional(),
  generationParams: z.record(z.any()),
  publishChannels: z.array(z.string()),
  publishSettings: z.record(z.any()),
});

// GET /api/ai/content-generation/advanced - Get content generation data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view content generation
    if (!user.permissions.includes('ai:content:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const type = searchParams.get('type'); // templates, sessions, schedules
    const contentType = searchParams.get('contentType');
    const status = searchParams.get('status');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== parseInt(siteId)) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const siteIdNum = parseInt(siteId);

    switch (type) {
      case 'templates':
        const templates = await contentService.getContentTemplates(siteIdNum, contentType || undefined);
        return NextResponse.json({ templates });

      case 'sessions':
        const sessions = await contentService.getContentSessions(siteIdNum, status || undefined);
        return NextResponse.json({ sessions });

      case 'schedules':
        const schedules = await contentService.getContentSchedules(siteIdNum, status || undefined);
        return NextResponse.json({ schedules });

      default:
        // Return overview data
        const [allTemplates, allSessions, allSchedules] = await Promise.all([
          contentService.getContentTemplates(siteIdNum),
          contentService.getContentSessions(siteIdNum),
          contentService.getContentSchedules(siteIdNum),
        ]);

        return NextResponse.json({
          templates: allTemplates,
          sessions: allSessions,
          schedules: allSchedules,
        });
    }

  } catch (error) {
    console.error('Error fetching content generation data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/content-generation/advanced - Create content generation resources
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create content
    if (!user.permissions.includes('ai:content:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/templates')) {
      // Create content template
      const validatedData = createTemplateSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const template = await contentService.createContentTemplate(validatedData);
      
      return NextResponse.json({
        success: true,
        template,
      });
    } else if (path.includes('/sessions')) {
      // Create content session
      const validatedData = createSessionSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const session = await contentService.createContentSession(validatedData);
      
      return NextResponse.json({
        success: true,
        session,
      });
    } else if (path.includes('/batch')) {
      // Batch content generation
      const validatedData = batchGenerationSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const results = await contentService.generateBatchContent(validatedData.siteId, validatedData);
      
      return NextResponse.json({
        success: true,
        results,
      });
    } else if (path.includes('/schedules')) {
      // Create content schedule
      const validatedData = createScheduleSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const schedule = await contentService.createContentSchedule(validatedData);
      
      return NextResponse.json({
        success: true,
        schedule,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating content generation resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/content-generation/advanced - Update content generation resources
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update content
    if (!user.permissions.includes('ai:content:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/templates')) {
      const { id, ...updateData } = body;
      
      if (!id) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
      }

      const template = await contentService.updateContentTemplate(id, updateData);
      
      return NextResponse.json({
        success: true,
        template,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating content generation resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 