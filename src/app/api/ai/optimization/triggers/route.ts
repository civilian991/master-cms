import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';

// Validation schemas
const OptimizationTriggerRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(['seo', 'image', 'performance', 'accessibility', 'quality']),
  conditions: z.object({
    metric: z.string(),
    operator: z.enum(['lt', 'lte', 'eq', 'gte', 'gt']),
    value: z.number(),
    contentType: z.enum(['article', 'page', 'category']).optional(),
  }),
  actions: z.array(z.object({
    type: z.enum(['optimize', 'alert', 'block', 'schedule']),
    parameters: z.record(z.any()),
  })),
  isActive: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const TriggerExecutionRequestSchema = z.object({
  triggerId: z.string().uuid(),
  contentId: z.string().uuid().optional(),
  contentType: z.enum(['article', 'page', 'category']).optional(),
  context: z.record(z.any()).optional(),
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
      case 'create':
        return await handleCreateTrigger(body);
      case 'update':
        return await handleUpdateTrigger(body);
      case 'execute':
        return await handleExecuteTrigger(body);
      case 'test':
        return await handleTestTrigger(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Optimization trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreateTrigger(body: any) {
  const validatedData = OptimizationTriggerRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const trigger = await optimizationService.createOptimizationTrigger({
      name: validatedData.name,
      description: validatedData.description,
      triggerType: validatedData.triggerType,
      conditions: validatedData.conditions,
      actions: validatedData.actions,
      isActive: validatedData.isActive,
      priority: validatedData.priority,
    });

    // Save optimization trigger
    const optimizationTrigger = await prisma.optimizationTrigger.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        triggerType: validatedData.triggerType,
        conditions: validatedData.conditions,
        actions: validatedData.actions,
        isActive: validatedData.isActive,
        priority: validatedData.priority,
        createdBy: session?.user?.id,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      trigger: optimizationTrigger,
    });
  } catch (error) {
    console.error('Creating optimization trigger failed:', error);
    return NextResponse.json(
      { error: 'Creating optimization trigger failed' },
      { status: 500 }
    );
  }
}

async function handleUpdateTrigger(body: any) {
  const { triggerId, ...updateData } = body;

  if (!triggerId) {
    return NextResponse.json(
      { error: 'Trigger ID is required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const trigger = await optimizationService.updateOptimizationTrigger({
      triggerId,
      ...updateData,
    });

    // Update optimization trigger
    const optimizationTrigger = await prisma.optimizationTrigger.update({
      where: { id: triggerId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      trigger: optimizationTrigger,
    });
  } catch (error) {
    console.error('Updating optimization trigger failed:', error);
    return NextResponse.json(
      { error: 'Updating optimization trigger failed' },
      { status: 500 }
    );
  }
}

async function handleExecuteTrigger(body: any) {
  const validatedData = TriggerExecutionRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.executeOptimizationTrigger({
      triggerId: validatedData.triggerId,
      contentId: validatedData.contentId,
      contentType: validatedData.contentType,
      context: validatedData.context,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Executing optimization trigger failed:', error);
    return NextResponse.json(
      { error: 'Executing optimization trigger failed' },
      { status: 500 }
    );
  }
}

async function handleTestTrigger(body: any) {
  const { triggerId, testData } = body;

  if (!triggerId) {
    return NextResponse.json(
      { error: 'Trigger ID is required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.testOptimizationTrigger({
      triggerId,
      testData,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Testing optimization trigger failed:', error);
    return NextResponse.json(
      { error: 'Testing optimization trigger failed' },
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
    const triggerType = searchParams.get('triggerType');
    const isActive = searchParams.get('isActive');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (triggerType) where.triggerType = triggerType;
    if (isActive !== null) where.isActive = isActive === 'true';
    if (priority) where.priority = priority;

    const [triggers, total] = await Promise.all([
      prisma.optimizationTrigger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.optimizationTrigger.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      triggers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch optimization triggers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch triggers' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const triggerId = searchParams.get('triggerId');

    if (!triggerId) {
      return NextResponse.json(
        { error: 'Trigger ID is required' },
        { status: 400 }
      );
    }

    await prisma.optimizationTrigger.delete({
      where: { id: triggerId },
    });

    return NextResponse.json({
      success: true,
      message: 'Optimization trigger deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete optimization trigger:', error);
    return NextResponse.json(
      { error: 'Failed to delete trigger' },
      { status: 500 }
    );
  }
} 