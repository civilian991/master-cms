import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { socialService, UserFollowSchema } from '@/lib/services/social';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId') || session.user.id;
    const targetUserId = searchParams.get('targetUserId');
    const action = searchParams.get('action');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (action === 'status' && targetUserId) {
      // Get follow status between users
      const status = await socialService.getFollowStatus(session.user.id, targetUserId, siteId);
      return NextResponse.json({ status });
    }

    if (action === 'followers') {
      // Get user's followers
      const options = {
        status: searchParams.get('status')?.split(','),
        search: searchParams.get('search'),
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      const result = await socialService.getFollowers(userId, siteId, options);
      return NextResponse.json(result);
    }

    if (action === 'following') {
      // Get user's following list
      const options = {
        status: searchParams.get('status')?.split(','),
        search: searchParams.get('search'),
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      const result = await socialService.getFollowing(userId, siteId, options);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing follow request:', error);
    return NextResponse.json(
      { error: 'Failed to process follow request' },
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
    const { action } = body;

    switch (action) {
      case 'follow':
        const { followingId, siteId } = body;
        if (!followingId || !siteId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const followData = UserFollowSchema.parse({
          followerId: session.user.id,
          followingId,
          siteId,
          status: 'active',
          notificationsEnabled: body.notificationsEnabled ?? true,
        });

        const follow = await socialService.followUser(followData);
        return NextResponse.json({ follow }, { status: 201 });

      case 'unfollow':
        const { followingId: unfollowId, siteId: unfollowSiteId } = body;
        if (!unfollowId || !unfollowSiteId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const success = await socialService.unfollowUser(session.user.id, unfollowId, unfollowSiteId);
        if (success) {
          return NextResponse.json({ message: 'Unfollowed successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing follow action:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('cannot follow themselves') || 
          error.message.includes('already following')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to process follow action' },
      { status: 500 }
    );
  }
} 