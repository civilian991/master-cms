import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAnalyticsService } from '@/lib/services/marketing-analytics';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, campaignId, metrics } = body;

    if (!siteId || !campaignId || !metrics) {
      return NextResponse.json(
        { error: 'SiteId, campaignId, and metrics are required' },
        { status: 400 }
      );
    }

    const result = await marketingAnalyticsService.trackMarketingPerformance(siteId, campaignId, metrics);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to track marketing performance:', error);
    return NextResponse.json(
      { error: 'Failed to track marketing performance' },
      { status: 500 }
    );
  }
} 