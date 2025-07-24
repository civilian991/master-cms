import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { userProfilesService } from '@/lib/services/user-profiles';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const siteId = searchParams.get('siteId');
    const action = searchParams.get('action');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'leaderboard':
        const type = searchParams.get('type') as 'reputation' | 'posts' | 'likes' || 'reputation';
        const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'all' || 'all';
        const limit = parseInt(searchParams.get('limit') || '50');

        const leaderboard = await userProfilesService.getLeaderboard(siteId, {
          type,
          timeframe,
          limit
        });
        return NextResponse.json({ leaderboard });

      default:
        const reputation = await userProfilesService.getReputationScore(userId, siteId);
        if (!reputation) {
          return NextResponse.json({ error: 'Reputation score not found' }, { status: 404 });
        }
        return NextResponse.json({ reputation });
    }
  } catch (error) {
    console.error('Error fetching reputation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reputation data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_reputation')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const siteId = searchParams.get('siteId');

    if (!userId || !siteId) {
      return NextResponse.json({ error: 'User ID and Site ID are required' }, { status: 400 });
    }

    const body = await request.json();
    const reputation = await userProfilesService.updateReputationScore(userId, siteId, body);

    return NextResponse.json({ reputation });
  } catch (error) {
    console.error('Error updating reputation score:', error);
    return NextResponse.json(
      { error: 'Failed to update reputation score' },
      { status: 500 }
    );
  }
} 