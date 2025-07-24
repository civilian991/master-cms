import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communityAnalyticsService, UserBehaviorEventSchema } from '@/lib/services/community-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_user_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (userId) {
      // Get analytics for specific user
      const userAnalytics = await communityAnalyticsService.getUserAnalytics(userId, siteId, timeRange);
      return NextResponse.json({ analytics: userAnalytics });
    } else {
      // Get aggregated user analytics
      const dashboard = await communityAnalyticsService.getCommunityAnalyticsDashboard(siteId, timeRange);
      return NextResponse.json({ userMetrics: dashboard.users });
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
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
    const { action } = body;

    switch (action) {
      case 'track-event':
        const validatedEventData = UserBehaviorEventSchema.parse({
          ...body.eventData,
          userId: session.user.id,
        });

        const event = await communityAnalyticsService.trackUserBehavior(validatedEventData);
        return NextResponse.json({ event }, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing user analytics action:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process user analytics action' },
      { status: 500 }
    );
  }
} 