import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { userProfilesService, UserProfileSchema } from '@/lib/services/user-profiles';

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
      case 'stats':
        const stats = await userProfilesService.getUserStats(userId, siteId);
        return NextResponse.json({ stats });

      case 'analytics':
        if (userId !== session.user.id && !session.user.permissions?.includes('view_analytics')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const analytics = await userProfilesService.getUserProfileAnalytics(userId, siteId);
        return NextResponse.json({ analytics });

      case 'search':
        const query = searchParams.get('query');
        const interests = searchParams.get('interests')?.split(',') || [];
        const location = searchParams.get('location');
        const minReputation = searchParams.get('minReputation') ? parseInt(searchParams.get('minReputation')!) : undefined;
        const sortBy = searchParams.get('sortBy') as 'reputation' | 'activity' | 'joined' | 'name' || 'reputation';
        const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const searchResults = await userProfilesService.searchUserProfiles(siteId, {
          query,
          interests,
          location,
          minReputation,
          sortBy,
          sortOrder,
          limit,
          offset
        });
        return NextResponse.json(searchResults);

      default:
        const profile = await userProfilesService.getUserProfile(userId, siteId);
        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        return NextResponse.json({ profile });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
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
    const validatedData = UserProfileSchema.parse({
      ...body,
      userId: session.user.id
    });

    const profile = await userProfilesService.createUserProfile(validatedData);

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Error creating user profile:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user profile' },
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
    const userId = searchParams.get('userId') || session.user.id;
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Only allow users to update their own profile unless they have admin permissions
    if (userId !== session.user.id && !session.user.permissions?.includes('manage_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const profile = await userProfilesService.updateUserProfile(userId, siteId, body);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 