import { NextRequest, NextResponse } from 'next/server';
import { AdvancedPersonalityService } from '@/lib/services/ai/personality';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const personalityService = AdvancedPersonalityService.getInstance();

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  industry: z.string().min(1),
  baseConfiguration: z.object({
    tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']),
    expertise: z.array(z.string()),
    writingStyle: z.string(),
    targetAudience: z.string(),
    culturalContext: z.string().optional(),
    language: z.enum(['en', 'ar', 'bilingual']),
  }),
  features: z.object({
    dynamicAdaptation: z.boolean().default(true),
    culturalLocalization: z.boolean().default(true),
    audienceTargeting: z.boolean().default(true),
    styleMatching: z.boolean().default(true),
    aBTesting: z.boolean().default(true),
  }),
  culturalSupport: z.object({
    regions: z.array(z.string()),
    languages: z.array(z.string()),
    culturalContexts: z.array(z.string()),
  }),
  audienceTargeting: z.object({
    segments: z.array(z.string()),
    demographics: z.array(z.string()),
    interests: z.array(z.string()),
  }),
});

const createPersonalitySchema = z.object({
  siteId: z.number().int().positive(),
  basePersonality: z.object({
    name: z.string(),
    description: z.string(),
    tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']),
    expertise: z.array(z.string()),
    writingStyle: z.string(),
    targetAudience: z.string(),
    culturalContext: z.string().optional(),
    language: z.enum(['en', 'ar', 'bilingual']),
  }),
  personalityTemplate: z.string().optional(),
  dynamicAdaptation: z.boolean().default(true),
  learningEnabled: z.boolean().default(true),
  adaptationRate: z.number().min(0).max(1).default(0.1),
  culturalContext: z.object({
    region: z.string(),
    language: z.string(),
    culturalNorms: z.array(z.string()),
    localPreferences: z.record(z.any()),
  }),
  linguisticStyle: z.object({
    formality: z.enum(['formal', 'semi-formal', 'casual']),
    vocabulary: z.enum(['technical', 'general', 'simplified']),
    sentenceStructure: z.enum(['complex', 'moderate', 'simple']),
    culturalReferences: z.boolean().default(true),
  }),
  regionalPreferences: z.object({
    dateFormats: z.string(),
    numberFormats: z.string(),
    currencyFormats: z.string(),
    measurementUnits: z.string(),
  }),
  audienceSegments: z.array(z.object({
    segment: z.string(),
    targeting: z.boolean().default(true),
    customization: z.record(z.any()),
  })),
  targetingEnabled: z.boolean().default(true),
  performanceTracking: z.boolean().default(true),
  optimizationEnabled: z.boolean().default(true),
  aBTestingEnabled: z.boolean().default(true),
  modelVersion: z.string(),
  fineTunedModel: z.string().optional(),
  trainingDataVersion: z.string().optional(),
});

// GET /api/ai/personalities/templates - Get personality templates
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view personalities
    if (!user.permissions.includes('ai:personality:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const siteId = searchParams.get('siteId');

    if (siteId) {
      // Get site-specific personality
      const personality = await personalityService.getAdvancedPersonality(parseInt(siteId));
      
      if (!personality) {
        return NextResponse.json({ error: 'Personality not found' }, { status: 404 });
      }

      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== parseInt(siteId)) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      // Get performance analytics
      const analytics = await personalityService.getPersonalityAnalytics(personality.id);

      return NextResponse.json({
        personality,
        analytics,
      });
    } else {
      // Get personality templates
      const templates = await personalityService.getPersonalityTemplates(industry || undefined);
      
      return NextResponse.json({
        templates,
      });
    }

  } catch (error) {
    console.error('Error fetching personalities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/personalities/templates - Create personality template
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create personalities
    if (!user.permissions.includes('ai:personality:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/templates')) {
      // Create personality template
      const validatedData = createTemplateSchema.parse(body);
      const template = await personalityService.createPersonalityTemplate(validatedData);
      
      return NextResponse.json({
        success: true,
        template,
      });
    } else {
      // Create advanced personality
      const validatedData = createPersonalitySchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const personality = await personalityService.createAdvancedPersonality(validatedData);
      
      return NextResponse.json({
        success: true,
        personality,
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating personality:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/personalities - Update personality
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update personalities
    if (!user.permissions.includes('ai:personality:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { siteId, ...updateData } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const personality = await personalityService.updateAdvancedPersonality(siteId, updateData);
    
    return NextResponse.json({
      success: true,
      personality,
    });

  } catch (error) {
    console.error('Error updating personality:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 