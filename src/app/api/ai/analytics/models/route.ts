import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalyticsService } from '@/lib/services/ai/predictive-analytics';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const analyticsService = PredictiveAnalyticsService.getInstance();

// Validation schemas
const createModelSchema = z.object({
  siteId: z.number().int().positive(),
  modelName: z.string(),
  modelType: z.string(),
  modelVersion: z.string(),
  modelDescription: z.string().optional(),
  algorithm: z.string(),
  hyperparameters: z.record(z.any()),
  featureColumns: z.record(z.any()),
  targetColumn: z.string(),
  trainingDataSize: z.number().int().positive(),
  trainingAccuracy: z.number().min(0).max(1),
  validationAccuracy: z.number().min(0).max(1),
  testAccuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1).optional(),
  recall: z.number().min(0).max(1).optional(),
  f1Score: z.number().min(0).max(1).optional(),
  auc: z.number().min(0).max(1).optional(),
  modelPath: z.string(),
  modelSize: z.number().optional(),
  modelHash: z.string().optional(),
  status: z.string().default('training'),
  isActive: z.boolean().default(false),
  deployedAt: z.string().transform(str => new Date(str)).optional(),
});

const createPredictionSchema = z.object({
  userId: z.string(),
  siteId: z.number().int().positive(),
  modelId: z.number().int().positive(),
  predictionType: z.string(),
  predictionValue: z.number(),
  predictionConfidence: z.number().min(0).max(1),
  predictionClass: z.string().optional(),
  inputFeatures: z.record(z.any()),
  featureImportance: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  triggerEvent: z.string().optional(),
  actualValue: z.number().optional(),
  actualClass: z.string().optional(),
  isCorrect: z.boolean().optional(),
  usedInPersonalization: z.boolean().default(false),
  usedInRecommendation: z.boolean().default(false),
  usedInOptimization: z.boolean().default(false),
});

// GET /api/ai/analytics/models - Get ML models
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view models
    if (!user.permissions.includes('analytics:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = parseInt(searchParams.get('siteId') || '0');
    const modelType = searchParams.get('modelType') || undefined;
    const status = searchParams.get('status') || undefined;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    const models = await analyticsService.getMLModels(siteId, modelType, status);

    return NextResponse.json({
      success: true,
      models,
      total: models.length,
    });

  } catch (error) {
    console.error('Error fetching ML models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/analytics/models - Create ML model
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create models
    if (!user.permissions.includes('analytics:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/models')) {
      // Create ML model
      const validatedData = createModelSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const model = await analyticsService.createMLModel(validatedData);
      
      return NextResponse.json({
        success: true,
        model,
      });
    } else if (path.includes('/predictions')) {
      // Create user prediction
      const validatedData = createPredictionSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const prediction = await analyticsService.createUserPrediction(validatedData);
      
      return NextResponse.json({
        success: true,
        prediction,
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

    console.error('Error creating ML model or prediction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/analytics/models/[id] - Update ML model
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update models
    if (!user.permissions.includes('analytics:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;
    const modelId = parseInt(path.split('/').pop() || '0');

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Get the model to check site access
    const models = await analyticsService.getMLModels(0); // Get all models to find the one we want
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== model.siteId) {
      return NextResponse.json({ error: 'Access denied to this model' }, { status: 403 });
    }

    const updatedModel = await analyticsService.updateMLModel(modelId, body);
    
    return NextResponse.json({
      success: true,
      model: updatedModel,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating ML model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 