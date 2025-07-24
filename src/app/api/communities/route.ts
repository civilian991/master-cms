import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communitiesService, CommunitySchema } from '@/lib/services/communities';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const action = searchParams.get('action');

    if (communityId) {
      // Get single community
      const community = await communitiesService.getCommunity(communityId, session.user.id);
      if (!community) {
        return NextResponse.json({ error: 'Community not found' }, { status: 404 });
      }
      return NextResponse.json({ community });
    }

    if (action === 'my-communities') {
      // Get user's communities
      const options = {
        siteId: searchParams.get('siteId') || '',
        userId: session.user.id,
        sortBy: searchParams.get('sortBy') as 'name' | 'members' | 'posts' | 'activity' | 'created' || 'created',
        sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
        limit: parseInt(searchParams.get('limit') || '20'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      if (!options.siteId) {
        return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
      }

      const result = await communitiesService.getCommunities(options);
      return NextResponse.json(result);
    }

    // Get communities with filters
    const options = {
      siteId: searchParams.get('siteId') || '',
      type: searchParams.get('type')?.split(','),
      category: searchParams.get('category'),
      ownerId: searchParams.get('ownerId'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy') as 'name' | 'members' | 'posts' | 'activity' | 'created' || 'created',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    if (!options.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const result = await communitiesService.getCommunities(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('create_communities')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CommunitySchema.parse({
      ...body,
      ownerId: session.user.id
    });

    const community = await communitiesService.createCommunity(validatedData);

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error('Error creating community:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      // Handle business logic errors
      if (error.message.includes('exceeded') || 
          error.message.includes('already exists') ||
          error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create community' },
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
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });
    }

    // Check if user owns the community or has management permissions
    const existingCommunity = await communitiesService.getCommunity(communityId);
    if (!existingCommunity) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (existingCommunity.ownerId !== session.user.id && 
        !session.user.permissions?.includes('manage_communities')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const community = await communitiesService.updateCommunity(communityId, body);

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Check if user owns the community or has management permissions
    const existingCommunity = await communitiesService.getCommunity(communityId);
    if (!existingCommunity) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (existingCommunity.ownerId !== session.user.id && 
        !session.user.permissions?.includes('manage_communities')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const success = await communitiesService.deleteCommunity(communityId);

    if (success) {
      return NextResponse.json({ message: 'Community deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete community' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    );
  }
} 