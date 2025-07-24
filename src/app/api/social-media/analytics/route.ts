import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/services/social-media';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// GET /api/social-media/analytics - Get social media analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const platform = searchParams.get('platform') as any;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const analytics = await socialMediaService.getAnalytics(siteId, {
      platform,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Failed to get social media analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get social media analytics' },
      { status: 500 }
    );
  }
} 