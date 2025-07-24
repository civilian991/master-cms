import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { gamificationService, LeaderboardSchema } from '@/lib/services/gamification';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const leaderboardId = searchParams.get('leaderboardId');
    const action = searchParams.get('action');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (leaderboardId && action === 'entries') {
      // Get leaderboard entries
      const options = {
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      const entries = await gamificationService.getLeaderboardEntries(leaderboardId, options);
      return NextResponse.json({ entries });
    }

    // Get leaderboards
    const options = {
      type: searchParams.get('type')?.split(','),
      isPublic: searchParams.get('public') !== 'false',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await gamificationService.getLeaderboards(siteId, options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_gamification')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = LeaderboardSchema.parse(body);

    const leaderboard = await gamificationService.createLeaderboard(validatedData);

    return NextResponse.json({ leaderboard }, { status: 201 });
  } catch (error) {
    console.error('Error creating leaderboard:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create leaderboard' },
      { status: 500 }
    );
  }
} 