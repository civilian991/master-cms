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
      case 'followers':
        const followers = await userProfilesService.getFollowers(userId, siteId);
        return NextResponse.json({ followers });

      case 'following':
        const following = await userProfilesService.getFollowing(userId, siteId);
        return NextResponse.json({ following });

      case 'activity':
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const types = searchParams.get('types')?.split(',');

        // Only allow users to view their own activity unless they have permissions
        if (userId !== session.user.id && !session.user.permissions?.includes('view_user_activity')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const activityResult = await userProfilesService.getUserActivity(userId, siteId, {
          limit,
          offset,
          types
        });
        return NextResponse.json(activityResult);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching social data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, siteId } = body;

    if (!userId || !siteId) {
      return NextResponse.json({ 
        error: 'User ID and Site ID are required' 
      }, { status: 400 });
    }

    switch (action) {
      case 'follow':
        const follow = await userProfilesService.followUser(session.user.id, userId, siteId);
        return NextResponse.json({ follow }, { status: 201 });

      case 'unfollow':
        const success = await userProfilesService.unfollowUser(session.user.id, userId, siteId);
        if (success) {
          return NextResponse.json({ message: 'User unfollowed successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing social action:', error);
    return NextResponse.json(
      { error: 'Failed to perform social action' },
      { status: 500 }
    );
  }
} 