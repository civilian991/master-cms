import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAnalyticsService } from '@/lib/services/marketing-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const realTimeMetrics = await marketingAnalyticsService.getRealTimeMarketingAnalytics(siteId);

    return NextResponse.json({ realTimeMetrics });
  } catch (error) {
    console.error('Failed to get real-time marketing analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get real-time marketing analytics' },
      { status: 500 }
    );
  }
} 