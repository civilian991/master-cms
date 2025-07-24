import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { influencerOutreachService } from '@/lib/services/influencer-outreach';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const influencer = await influencerOutreachService.getInfluencer(params.id);

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    return NextResponse.json({ influencer });
  } catch (error) {
    console.error('Failed to get influencer:', error);
    return NextResponse.json(
      { error: 'Failed to get influencer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      platform,
      handle,
      followers,
      engagement,
      tags,
      metadata,
    } = body;

    const influencer = await influencerOutreachService.updateInfluencer(params.id, {
      name,
      email,
      platform,
      handle,
      followers: followers ? parseInt(followers) : undefined,
      engagement: engagement ? parseFloat(engagement) : undefined,
      tags,
      metadata,
    });

    return NextResponse.json({ influencer });
  } catch (error) {
    console.error('Failed to update influencer:', error);
    return NextResponse.json(
      { error: 'Failed to update influencer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await influencerOutreachService.deleteInfluencer(params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to delete influencer:', error);
    return NextResponse.json(
      { error: 'Failed to delete influencer' },
      { status: 500 }
    );
  }
} 