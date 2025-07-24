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
    const periods = searchParams.get('periods');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const periodsCount = periods ? parseInt(periods) : 12;

    const forecasts = await marketingAnalyticsService.generateMarketingForecasts(siteId, periodsCount);

    return NextResponse.json({ forecasts });
  } catch (error) {
    console.error('Failed to generate marketing forecasts:', error);
    return NextResponse.json(
      { error: 'Failed to generate marketing forecasts' },
      { status: 500 }
    );
  }
} 