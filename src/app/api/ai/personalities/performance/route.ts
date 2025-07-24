import { NextRequest, NextResponse } from 'next/server';
import { AdvancedPersonalityService } from '@/lib/services/ai/personality';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const personalityService = AdvancedPersonalityService.getInstance();

// Validation schemas
const performanceDataSchema = z.object({
  personalityId: z.number().int().positive(),
  contentQualityScore: z.number().min(0).max(100),
  audienceEngagement: z.number().min(0).max(100),
  culturalRelevance: z.number().min(0).max(100),
  consistencyScore: z.number().min(0).max(100),
  contentCount: z.number().int().nonnegative(),
  publishedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  audienceSegment: z.string().optional(),
  segmentPerformance: z.number().min(0).max(100).optional(),
  measurementDate: z.string().transform(str => new Date(str)),
  timeRange: z.enum(['day', 'week', 'month']),
});

const trainingDataSchema = z.object({
  personalityId: z.number().int().positive(),
  contentType: z.string(),
  content: z.string(),
  metadata: z.record(z.any()),
  performanceScore: z.number().min(0).max(100).optional(),
  audienceFeedback: z.record(z.any()).optional(),
  engagementMetrics: z.record(z.any()).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  culturalScore: z.number().min(0).max(100).optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
});

// GET /api/ai/personalities/performance - Get performance data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view performance data
    if (!user.permissions.includes('ai:personality:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const personalityId = searchParams.get('personalityId');
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' | undefined;

    if (!personalityId) {
      return NextResponse.json({ error: 'Personality ID is required' }, { status: 400 });
    }

    // Get performance data
    const performance = await personalityService.getPersonalityPerformance(
      parseInt(personalityId),
      timeRange || 'week'
    );

    // Get analytics
    const analytics = await personalityService.getPersonalityAnalytics(parseInt(personalityId));

    return NextResponse.json({
      performance,
      analytics,
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/personalities/performance - Record performance data
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to record performance data
    if (!user.permissions.includes('ai:personality:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/training')) {
      // Add training data
      const validatedData = trainingDataSchema.parse(body);
      const trainingData = await personalityService.addTrainingData(
        validatedData.personalityId,
        validatedData
      );
      
      return NextResponse.json({
        success: true,
        trainingData,
      });
    } else {
      // Record performance data
      const validatedData = performanceDataSchema.parse(body);
      const performance = await personalityService.recordPersonalityPerformance(validatedData);
      
      return NextResponse.json({
        success: true,
        performance,
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error recording performance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/personalities/performance/training - Update training data quality
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update training data
    if (!user.permissions.includes('ai:personality:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, qualityScore, culturalScore, relevanceScore } = body;

    if (!id) {
      return NextResponse.json({ error: 'Training data ID is required' }, { status: 400 });
    }

    const trainingData = await personalityService.updateTrainingDataQuality(parseInt(id), {
      qualityScore,
      culturalScore,
      relevanceScore,
    });
    
    return NextResponse.json({
      success: true,
      trainingData,
    });

  } catch (error) {
    console.error('Error updating training data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 