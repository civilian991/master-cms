import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { moderationService } from '@/lib/services/moderation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_moderation_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const dashboard = await moderationService.getModerationDashboard(siteId, timeRange);

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Error fetching moderation analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation analytics' },
      { status: 500 }
    );
  }
} 