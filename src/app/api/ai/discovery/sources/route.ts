import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentDiscoveryService } from '@/lib/services/ai/content-discovery';

// Validation schemas
const CreateSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['rss', 'api', 'scraper', 'social']),
  configuration: z.record(z.any()),
  reliabilityScore: z.number().min(0).max(1).default(0),
  isActive: z.boolean().default(true),
});

const UpdateSourceSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  type: z.enum(['rss', 'api', 'scraper', 'social']).optional(),
  configuration: z.record(z.any()).optional(),
  reliabilityScore: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateSourceSchema.parse(body);

    const discoveryService = ContentDiscoveryService.getInstance();
    const source = await discoveryService.addSource(validatedData);

    return NextResponse.json({
      success: true,
      source,
    });
  } catch (error) {
    console.error('Failed to create content source:', error);
    return NextResponse.json(
      { error: 'Failed to create content source' },
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
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === 'true';

    const [sources, total] = await Promise.all([
      prisma.contentSource.findMany({
        where,
        orderBy: { reliabilityScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentSource.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      sources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch content sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content sources' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateSourceSchema.parse(body);

    const discoveryService = ContentDiscoveryService.getInstance();
    const source = await discoveryService.updateSource(sourceId, validatedData);

    return NextResponse.json({
      success: true,
      source,
    });
  } catch (error) {
    console.error('Failed to update content source:', error);
    return NextResponse.json(
      { error: 'Failed to update content source' },
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
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    const discoveryService = ContentDiscoveryService.getInstance();
    await discoveryService.removeSource(sourceId);

    return NextResponse.json({
      success: true,
      message: 'Content source removed successfully',
    });
  } catch (error) {
    console.error('Failed to remove content source:', error);
    return NextResponse.json(
      { error: 'Failed to remove content source' },
      { status: 500 }
    );
  }
} 