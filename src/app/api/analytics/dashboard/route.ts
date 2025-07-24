import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communityAnalyticsService } from '@/lib/services/community-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const timeRange = searchParams.get('timeRange') || '30d';
    const type = searchParams.get('type') || 'overview';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    switch (type) {
      case 'overview':
        const dashboard = await communityAnalyticsService.getCommunityAnalyticsDashboard(siteId, timeRange);
        return NextResponse.json({ dashboard });

      case 'realtime':
        const realtimeMetrics = await communityAnalyticsService.getRealTimeMetrics(siteId);
        return NextResponse.json({ metrics: realtimeMetrics });

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics dashboard' },
      { status: 500 }
    );
  }
} 