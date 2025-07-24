import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { eventsService } from '@/lib/services/events';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const analytics = await eventsService.getEventAnalytics(siteId, timeRange);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event analytics' },
      { status: 500 }
    );
  }
} 