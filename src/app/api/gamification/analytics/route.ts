import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { gamificationService } from '@/lib/services/gamification';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (action === 'user-stats' && userId) {
      // Get user statistics
      const stats = await gamificationService.getUserStats(userId, siteId);
      return NextResponse.json({ stats });
    }

    // Get gamification analytics
    const analytics = await gamificationService.getGamificationAnalytics(siteId, timeRange);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching gamification analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gamification analytics' },
      { status: 500 }
    );
  }
} 