import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communitiesService, CommunityMembershipSchema } from '@/lib/services/communities';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });
    }

    // Check if user can view members (must be a member or have permissions)
    const community = await communitiesService.getCommunity(communityId, session.user.id);
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (!community.isUserMember && 
        !session.user.permissions?.includes('manage_communities')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const options = {
      role: searchParams.get('role')?.split(','),
      status: searchParams.get('status')?.split(','),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy') as 'joined' | 'name' | 'role' | 'activity' || 'joined',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await communitiesService.getCommunityMembers(communityId, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching community members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community members' },
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
      case 'join':
        const { communityId } = body;
        if (!communityId) {
          return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });
        }

        const membershipData = CommunityMembershipSchema.parse({
          communityId,
          userId: session.user.id,
          role: 'member',
          status: 'active',
          siteId: body.siteId
        });

        const membership = await communitiesService.addMember(membershipData);
        return NextResponse.json({ membership }, { status: 201 });

      case 'leave':
        const { communityId: leaveCommId } = body;
        if (!leaveCommId) {
          return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });
        }

        const success = await communitiesService.removeMember(leaveCommId, session.user.id, 'User left');
        if (success) {
          return NextResponse.json({ message: 'Left community successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to leave community' }, { status: 500 });
        }

      case 'invite':
        // Only members with invite permissions can invite others
        const inviteData = {
          ...body,
          inviterId: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        const invite = await communitiesService.createInvite(inviteData);
        return NextResponse.json({ invite }, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing membership action:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      // Handle business logic errors
      if (error.message.includes('already a member') || 
          error.message.includes('not found') ||
          error.message.includes('capacity') ||
          error.message.includes('not allowed')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to process membership action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get('membershipId');

    if (!membershipId) {
      return NextResponse.json({ error: 'Membership ID is required' }, { status: 400 });
    }

    // Check permissions (only community owners/moderators can update memberships)
    if (!session.user.permissions?.includes('manage_communities')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const membership = await communitiesService.updateMembership(membershipId, body);

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    );
  }
} 