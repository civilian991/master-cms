import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { socialService, SocialPrivacySchema } from '@/lib/services/social';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId') || session.user.id;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Only allow users to view their own privacy settings or admins to view others
    if (userId !== session.user.id && !session.user.permissions?.includes('manage_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const privacySettings = await socialService.getUserPrivacySettings(userId, siteId);

    return NextResponse.json({ privacySettings });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
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

    const body = await request.json();
    const validatedData = SocialPrivacySchema.parse({
      ...body,
      userId: session.user.id,
    });

    const privacySettings = await socialService.updatePrivacySettings(validatedData);

    return NextResponse.json({ privacySettings });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
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
    const { action, targetUserId, siteId } = body;

    if (!targetUserId || !siteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot perform this action on yourself' }, { status: 400 });
    }

    switch (action) {
      case 'block':
        const blockSuccess = await socialService.blockUser(session.user.id, targetUserId, siteId);
        if (blockSuccess) {
          return NextResponse.json({ message: 'User blocked successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
        }

      case 'mute':
        const muteSuccess = await socialService.muteUser(session.user.id, targetUserId, siteId);
        if (muteSuccess) {
          return NextResponse.json({ message: 'User muted successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to mute user' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing privacy action:', error);
    return NextResponse.json(
      { error: 'Failed to process privacy action' },
      { status: 500 }
    );
  }
} 