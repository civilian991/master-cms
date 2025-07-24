import { NextRequest, NextResponse } from 'next/server';
import { AdvancedPersonalityService } from '@/lib/services/ai/personality';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const personalityService = AdvancedPersonalityService.getInstance();

// Validation schemas
const createABTestSchema = z.object({
  action: z.literal('create'),
  personalityId: z.number().int().positive(),
  testName: z.string().min(1),
  variantA: z.record(z.any()),
  variantB: z.record(z.any()),
  startDate: z.string().transform((str, ctx) => new Date(str)),
  endDate: z.string().transform((str, ctx) => new Date(str)).optional(),
  sampleSizeA: z.number().int().nonnegative().default(0),
  sampleSizeB: z.number().int().nonnegative().default(0),
});

const updateABTestResultsSchema = z.object({
  action: z.literal('update'),
  id: z.number().int().positive(),
  variantAPerformance: z.number().min(0).max(100).optional(),
  variantBPerformance: z.number().min(0).max(100).optional(),
  statisticalSignificance: z.number().min(0).max(1).optional(),
  winner: z.enum(['A', 'B']).optional(),
  sampleSizeA: z.number().int().nonnegative().optional(),
  sampleSizeB: z.number().int().nonnegative().optional(),
});

const calculateSignificanceSchema = z.object({
  action: z.literal('calculate'),
  variantAPerformance: z.number().min(0).max(100),
  variantBPerformance: z.number().min(0).max(100),
  sampleSizeA: z.number().int().positive(),
  sampleSizeB: z.number().int().positive(),
});

// GET /api/ai/personalities/ab-testing - Get A/B tests
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read A/B tests
    if (!user.permissions.includes('ai:personality:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const personalityId = searchParams.get('personalityId');

    // Get A/B tests with optional filtering by personality ID
    const abTests = personalityId 
      ? await personalityService.getABTests(parseInt(personalityId))
      : await personalityService.getABTests();

    return NextResponse.json({
      success: true,
      abTests,
    });

  } catch (error) {
    console.error('Error getting A/B tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/personalities/ab-testing - Handle A/B test operations
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
        { error: 'Action is required (create, update, or calculate)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        return await handleCreateABTest(user, body);
      case 'update':
        return await handleUpdateABTest(user, body);
      case 'calculate':
        return await handleCalculateSignificance(user, body);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use create, update, or calculate' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in A/B test operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to handle A/B test creation
async function handleCreateABTest(user: any, body: any) {
  // Check if user has permission to create A/B tests
  if (!user.permissions.includes('ai:personality:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validatedData = createABTestSchema.parse(body);

  // Create A/B test
  const abTest = await personalityService.createABTest(validatedData);
  
  return NextResponse.json({
    success: true,
    abTest,
  });
}

// Helper function to handle A/B test updates
async function handleUpdateABTest(user: any, body: any) {
  // Check if user has permission to update A/B tests
  if (!user.permissions.includes('ai:personality:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validatedData = updateABTestResultsSchema.parse(body);

  // Update A/B test results
  const abTest = await personalityService.updateABTestResults(
    validatedData.id,
    validatedData
  );
  
  return NextResponse.json({
    success: true,
    abTest,
  });
}

// Helper function to handle statistical significance calculation
async function handleCalculateSignificance(user: any, body: any) {
  // Check if user has permission to calculate statistical significance
  if (!user.permissions.includes('ai:personality:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validatedData = calculateSignificanceSchema.parse(body);

  // Calculate statistical significance using t-test
  const significance = calculateStatisticalSignificance(
    validatedData.variantAPerformance,
    validatedData.variantBPerformance,
    validatedData.sampleSizeA,
    validatedData.sampleSizeB
  );

  // Determine winner
  let winner = null;
  if (significance < 0.05) { // 95% confidence level
    winner = validatedData.variantAPerformance > validatedData.variantBPerformance ? 'A' : 'B';
  }

  return NextResponse.json({
    statisticalSignificance: significance,
    winner,
    confidence: significance < 0.05 ? 'high' : 'low',
  });
}

// PUT /api/ai/personalities/ab-testing - Update A/B test results (deprecated, use POST with action=update)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update A/B tests
    if (!user.permissions.includes('ai:personality:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateABTestResultsSchema.parse({...body, action: 'update'});

    // Update A/B test results
    const abTest = await personalityService.updateABTestResults(
      validatedData.id,
      validatedData
    );
    
    return NextResponse.json({
      success: true,
      abTest,
    });

  } catch (error) {
          if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.issues },
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

// Helper function to calculate statistical significance
function calculateStatisticalSignificance(
  variantAPerformance: number,
  variantBPerformance: number,
  sampleSizeA: number,
  sampleSizeB: number
): number {
  // Calculate pooled standard error
  const pooledVariance = 
    ((sampleSizeA - 1) * (variantAPerformance * (100 - variantAPerformance)) +
     (sampleSizeB - 1) * (variantBPerformance * (100 - variantBPerformance))) /
    (sampleSizeA + sampleSizeB - 2);

  const standardError = Math.sqrt(pooledVariance * (1/sampleSizeA + 1/sampleSizeB));
  
  // Calculate t-statistic
  const tStatistic = Math.abs(variantAPerformance - variantBPerformance) / standardError;
  
  // Calculate degrees of freedom
  const degreesOfFreedom = sampleSizeA + sampleSizeB - 2;
  
  // Simplified p-value approximation (for a more accurate calculation, use a statistics library)
  const pValue = 2 * (1 - normalCDF(tStatistic));
  
  return Math.min(1, Math.max(0, pValue));
}

// Helper function for normal cumulative distribution function approximation
function normalCDF(z: number): number {
  // Approximation using the error function
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// Helper function for error function approximation
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
} 