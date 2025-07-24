import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalyticsService } from '@/lib/services/ai/predictive-analytics';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const analyticsService = PredictiveAnalyticsService.getInstance();

// Validation schemas
const createRecommendationSchema = z.object({
  userId: z.string(),
  siteId: z.number().int().positive(),
  contentId: z.string(),
  contentType: z.string(),
  recommendationType: z.string(),
  recommendationScore: z.number().min(0).max(1),
  algorithm: z.string(),
  modelVersion: z.string().optional(),
  features: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  triggerEvent: z.string().optional(),
  isShown: z.boolean().default(false),
  isClicked: z.boolean().default(false),
  isEngaged: z.boolean().default(false),
  timeSpent: z.number().optional(),
  clickThroughRate: z.number().optional(),
  engagementRate: z.number().optional(),
  expiresAt: z.string().transform(str => new Date(str)).optional(),
  isExpired: z.boolean().default(false),
});

const updateInteractionSchema = z.object({
  isShown: z.boolean().optional(),
  isClicked: z.boolean().optional(),
  isEngaged: z.boolean().optional(),
  timeSpent: z.number().optional(),
});

// GET /api/ai/analytics/recommendations - Get content recommendations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view recommendations
    if (!user.permissions.includes('analytics:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const siteId = parseInt(searchParams.get('siteId') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId || !siteId) {
      return NextResponse.json({ error: 'User ID and Site ID are required' }, { status: 400 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const recommendations = await analyticsService.getContentRecommendations(userId, siteId, limit);

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length,
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/analytics/recommendations - Create content recommendation
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create recommendations
    if (!user.permissions.includes('analytics:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRecommendationSchema.parse(body);
    
    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const recommendation = await analyticsService.createContentRecommendation(validatedData);
    
    return NextResponse.json({
      success: true,
      recommendation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating recommendation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/analytics/recommendations/[id] - Update recommendation interaction
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update recommendations
    if (!user.permissions.includes('analytics:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateInteractionSchema.parse(body);
    const path = new URL(request.url).pathname;
    const recommendationId = parseInt(path.split('/').pop() || '0');

    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    const updatedRecommendation = await analyticsService.updateRecommendationInteraction(
      recommendationId,
      validatedData
    );
    
    return NextResponse.json({
      success: true,
      recommendation: updatedRecommendation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating recommendation interaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 