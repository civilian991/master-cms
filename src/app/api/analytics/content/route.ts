import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communityAnalyticsService } from '@/lib/services/community-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_content_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (contentId && contentType) {
      // Get analytics for specific content
      const contentAnalytics = await communityAnalyticsService.getContentAnalytics(contentId, contentType, siteId);
      return NextResponse.json({ analytics: contentAnalytics });
    } else {
      // Get aggregated content analytics
      const dashboard = await communityAnalyticsService.getCommunityAnalyticsDashboard(siteId);
      return NextResponse.json({ contentMetrics: dashboard.content });
    }
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content analytics' },
      { status: 500 }
    );
  }
} 