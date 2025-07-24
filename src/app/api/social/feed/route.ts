import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { socialService, ActivityFeedSchema } from '@/lib/services/social';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const feedType = searchParams.get('type') || 'user';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const commonOptions = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    if (feedType === 'discover') {
      // Get discovery feed
      const result = await socialService.getDiscoverFeed(session.user.id, siteId, commonOptions);
      return NextResponse.json(result);
    }

    // Get user feed with filters
    const filters = {
      actions: searchParams.get('actions')?.split(','),
      targetTypes: searchParams.get('targetTypes')?.split(','),
      priority: searchParams.get('priority')?.split(','),
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
    };

    const options = {
      filters,
      includeOwnActivity: searchParams.get('includeOwnActivity') === 'true',
      ...commonOptions,
    };

    const result = await socialService.getUserFeed(session.user.id, siteId, options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ActivityFeedSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const activity = await socialService.createActivity(validatedData);

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
} 