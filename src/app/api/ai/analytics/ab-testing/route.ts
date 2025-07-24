import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalyticsService } from '@/lib/services/ai/predictive-analytics';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const analyticsService = PredictiveAnalyticsService.getInstance();

// Validation schemas
const createABTestSchema = z.object({
  siteId: z.number().int().positive(),
  testName: z.string(),
  testDescription: z.string().optional(),
  testType: z.string(),
  testHypothesis: z.string().optional(),
  variants: z.record(z.any()),
  controlVariant: z.string(),
  treatmentVariants: z.record(z.any()),
  trafficAllocation: z.record(z.any()),
  targetAudience: z.record(z.any()).optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional(),
  isActive: z.boolean().default(false),
  isPaused: z.boolean().default(false),
  primaryMetric: z.string(),
  secondaryMetrics: z.record(z.any()),
  conversionGoals: z.record(z.any()),
  significanceLevel: z.number().min(0).max(1).default(0.05),
  statisticalPower: z.number().min(0).max(1).default(0.8),
  minimumSampleSize: z.number().int().positive().default(1000),
  currentSampleSize: z.number().int().default(0),
  statisticalSignificance: z.boolean().default(false),
  winner: z.string().optional(),
  confidenceLevel: z.number().optional(),
  totalConversions: z.number().int().default(0),
  totalRevenue: z.number().default(0),
  averageOrderValue: z.number().default(0),
});

const assignUserSchema = z.object({
  testId: z.number().int().positive(),
  userId: z.string(),
  siteId: z.number().int().positive(),
});

const recordInteractionSchema = z.object({
  testId: z.number().int().positive(),
  userId: z.string(),
  eventType: z.string(),
  eventData: z.record(z.any()),
  conversion: z.boolean().optional(),
  revenue: z.number().optional(),
});

// GET /api/ai/analytics/ab-testing - Get A/B tests
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view A/B tests
    if (!user.permissions.includes('analytics:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = parseInt(searchParams.get('siteId') || '0');
    const status = searchParams.get('status') || undefined;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const tests = await analyticsService.getABTests(siteId, status);

    return NextResponse.json({
      success: true,
      tests,
      total: tests.length,
    });

  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/analytics/ab-testing - Create A/B test or assign user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/ab-testing')) {
      // Check if this is a test creation or user assignment
      if (body.testId) {
        // Assign user to A/B test
        const validatedData = assignUserSchema.parse(body);
        
        // Check if user has access to the site
        if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
          return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
        }

        const assignment = await analyticsService.assignUserToABTest(
          validatedData.testId,
          validatedData.userId,
          validatedData.siteId
        );
        
        return NextResponse.json({
          success: true,
          assignment,
        });
      } else {
        // Create new A/B test
        if (!user.permissions.includes('analytics:create')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const validatedData = createABTestSchema.parse(body);
        
        // Check if user has access to the site
        if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
          return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
        }

        const test = await analyticsService.createABTest(validatedData);
        
        return NextResponse.json({
          success: true,
          test,
        });
      }
    } else if (path.includes('/interaction')) {
      // Record A/B test interaction
      if (!user.permissions.includes('analytics:update')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const validatedData = recordInteractionSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const interaction = await analyticsService.recordABTestInteraction(
        validatedData.testId,
        validatedData.userId,
        {
          eventType: validatedData.eventType,
          eventData: validatedData.eventData,
          conversion: validatedData.conversion,
          revenue: validatedData.revenue,
        }
      );
      
      return NextResponse.json({
        success: true,
        interaction,
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

    console.error('Error with A/B testing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/analytics/ab-testing/[id] - Update A/B test
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update A/B tests
    if (!user.permissions.includes('analytics:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;
    const testId = parseInt(path.split('/').pop() || '0');

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // Get the test to check site access
    const tests = await analyticsService.getABTests(0); // Get all tests to find the one we want
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== test.siteId) {
      return NextResponse.json({ error: 'Access denied to this test' }, { status: 403 });
    }

    // Update the test
    const updatedTest = await prisma.aBTest.update({
      where: { id: testId },
      data: body,
      include: {
        site: true,
        abTestAssignments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      test: updatedTest,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating A/B test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 