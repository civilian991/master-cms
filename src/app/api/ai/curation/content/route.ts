import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentCurationService } from '@/lib/services/ai/content-curation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const curationService = ContentCurationService.getInstance();

    switch (action) {
      case 'curate':
        const { contentIds, siteId } = body;
        if (!contentIds || !siteId) {
          return NextResponse.json(
            { error: 'Content IDs and site ID are required' },
            { status: 400 }
          );
        }
        
        const contentToCurate = await prisma.discoveredContent.findMany({
          where: { id: { in: contentIds } },
        });
        
        const curations = await curationService.curateContent(contentToCurate, siteId);
        return NextResponse.json({
          success: true,
          curations,
        });

      case 'select':
        const { contentId, siteId: selectSiteId } = body;
        if (!contentId || !selectSiteId) {
          return NextResponse.json(
            { error: 'Content ID and site ID are required' },
            { status: 400 }
          );
        }
        
        const curation = await curationService.selectContent(contentId, selectSiteId);
        return NextResponse.json({
          success: true,
          curation,
        });

      case 'approve':
        const { curationId, approvedBy } = body;
        if (!curationId || !approvedBy) {
          return NextResponse.json(
            { error: 'Curation ID and approver are required' },
            { status: 400 }
          );
        }
        
        const approvedCuration = await curationService.approveContent(curationId, approvedBy);
        return NextResponse.json({
          success: true,
          curation: approvedCuration,
        });

      case 'reject':
        const { curationId: rejectCurationId, reason } = body;
        if (!rejectCurationId || !reason) {
          return NextResponse.json(
            { error: 'Curation ID and reason are required' },
            { status: 400 }
          );
        }
        
        const rejectedCuration = await curationService.rejectContent(rejectCurationId, reason);
        return NextResponse.json({
          success: true,
          curation: rejectedCuration,
        });

      case 'detect-duplicates':
        const { contentId: duplicateContentId } = body;
        if (!duplicateContentId) {
          return NextResponse.json(
            { error: 'Content ID is required' },
            { status: 400 }
          );
        }
        
        const content = await prisma.discoveredContent.findUnique({
          where: { id: duplicateContentId },
        });
        
        if (!content) {
          return NextResponse.json(
            { error: 'Content not found' },
            { status: 404 }
          );
        }
        
        const duplicates = await curationService.detectDuplicates(content);
        return NextResponse.json({
          success: true,
          duplicates,
        });

      case 'enrich':
        const { contentId: enrichContentId } = body;
        if (!enrichContentId) {
          return NextResponse.json(
            { error: 'Content ID is required' },
            { status: 400 }
          );
        }
        
        const contentToEnrich = await prisma.discoveredContent.findUnique({
          where: { id: enrichContentId },
        });
        
        if (!contentToEnrich) {
          return NextResponse.json(
            { error: 'Content not found' },
            { status: 404 }
          );
        }
        
        const enrichedContent = await curationService.enrichContent(contentToEnrich);
        return NextResponse.json({
          success: true,
          enrichedContent,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Content curation error:', error);
    return NextResponse.json(
      { error: 'Content curation failed' },
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
    const siteId = searchParams.get('siteId');
    const approvalStatus = searchParams.get('approvalStatus');
    const selected = searchParams.get('selected');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (siteId) where.siteId = siteId;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (selected !== null) where.selected = selected === 'true';

    const [curations, total] = await Promise.all([
      prisma.contentCuration.findMany({
        where,
        include: {
          content: true,
          site: true,
        },
        orderBy: { priority: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentCuration.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      curations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch curated content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curated content' },
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

    const body = await request.json();
    const { curationId, priority, scheduledAt } = body;

    if (!curationId) {
      return NextResponse.json(
        { error: 'Curation ID is required' },
        { status: 400 }
      );
    }

    const curationService = ContentCurationService.getInstance();
    let updatedCuration;

    if (priority !== undefined) {
      updatedCuration = await curationService.prioritizeContent(curationId, priority);
    } else if (scheduledAt) {
      updatedCuration = await curationService.scheduleContent(curationId, new Date(scheduledAt));
    } else {
      return NextResponse.json(
        { error: 'Priority or scheduledAt is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      curation: updatedCuration,
    });
  } catch (error) {
    console.error('Failed to update curation:', error);
    return NextResponse.json(
      { error: 'Failed to update curation' },
      { status: 500 }
    );
  }
} 