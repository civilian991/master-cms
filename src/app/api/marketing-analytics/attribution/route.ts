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
    const conversionId = searchParams.get('conversionId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (!conversionId) {
      return NextResponse.json({ error: 'Conversion ID is required' }, { status: 400 });
    }

    const attribution = await marketingAnalyticsService.buildMarketingAttribution(siteId, conversionId);

    return NextResponse.json({ attribution });
  } catch (error) {
    console.error('Failed to build marketing attribution:', error);
    return NextResponse.json(
      { error: 'Failed to build marketing attribution' },
      { status: 500 }
    );
  }
} 