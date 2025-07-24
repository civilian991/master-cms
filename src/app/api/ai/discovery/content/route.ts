import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentDiscoveryService } from '@/lib/services/ai/content-discovery';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sourceId } = body;

    const discoveryService = ContentDiscoveryService.getInstance();

    switch (action) {
      case 'discover':
        const discoveredContent = await discoveryService.discoverContent();
        return NextResponse.json({
          success: true,
          content: discoveredContent,
          count: discoveredContent.length,
        });

      case 'process-source':
        if (!sourceId) {
          return NextResponse.json(
            { error: 'Source ID is required' },
            { status: 400 }
          );
        }
        const sourceContent = await discoveryService.processSource(sourceId);
        return NextResponse.json({
          success: true,
          content: sourceContent,
          count: sourceContent.length,
        });

      case 'analyze':
        const { contentIds } = body;
        if (!contentIds || !Array.isArray(contentIds)) {
          return NextResponse.json(
            { error: 'Content IDs array is required' },
            { status: 400 }
          );
        }
        
        const contentToAnalyze = await prisma.discoveredContent.findMany({
          where: { id: { in: contentIds } },
        });
        
        const analyses = await discoveryService.batchAnalyzeContent(contentToAnalyze);
        return NextResponse.json({
          success: true,
          analyses,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Content discovery error:', error);
    return NextResponse.json(
      { error: 'Content discovery failed' },
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
    const status = searchParams.get('status');
    const sourceId = searchParams.get('sourceId');
    const minRelevanceScore = searchParams.get('minRelevanceScore');
    const minQualityScore = searchParams.get('minQualityScore');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (status) where.status = status;
    if (sourceId) where.sourceId = sourceId;
    if (minRelevanceScore) where.relevanceScore = { gte: parseFloat(minRelevanceScore) };
    if (minQualityScore) where.qualityScore = { gte: parseFloat(minQualityScore) };
    if (category) where.category = category;

    const [content, total] = await Promise.all([
      prisma.discoveredContent.findMany({
        where,
        include: {
          source: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.discoveredContent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch discovered content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovered content' },
      { status: 500 }
    );
  }
} 