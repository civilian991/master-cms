import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communityAnalyticsService } from '@/lib/services/community-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_community_health')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const communityId = searchParams.get('communityId');
    const timeRange = searchParams.get('timeRange') || '30d';
    const action = searchParams.get('action');

    if (!siteId || !communityId) {
      return NextResponse.json({ error: 'Site ID and Community ID are required' }, { status: 400 });
    }

    switch (action) {
      case 'trends':
        const trends = await communityAnalyticsService.getCommunityHealthTrends(communityId, siteId, timeRange);
        return NextResponse.json({ trends });

      case 'current':
      default:
        const healthScore = await communityAnalyticsService.calculateCommunityHealthScore(communityId, siteId);
        return NextResponse.json({ healthScore });
    }
  } catch (error) {
    console.error('Error fetching community health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community health' },
      { status: 500 }
    );
  }
} 