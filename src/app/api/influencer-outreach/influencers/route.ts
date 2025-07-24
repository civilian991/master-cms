import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { influencerOutreachService } from '@/lib/services/influencer-outreach';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const minFollowers = searchParams.get('minFollowers');
    const maxFollowers = searchParams.get('maxFollowers');
    const minEngagement = searchParams.get('minEngagement');
    const tags = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const influencers = await influencerOutreachService.getInfluencers(siteId, {
      status: status as any,
      platform: platform || undefined,
      minFollowers: minFollowers ? parseInt(minFollowers) : undefined,
      maxFollowers: maxFollowers ? parseInt(maxFollowers) : undefined,
      minEngagement: minEngagement ? parseFloat(minEngagement) : undefined,
      tags: tags ? tags.split(',') : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ influencers });
  } catch (error) {
    console.error('Failed to get influencers:', error);
    return NextResponse.json(
      { error: 'Failed to get influencers' },
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
    const {
      name,
      email,
      platform,
      handle,
      followers,
      engagement,
      tags,
      metadata,
      siteId,
    } = body;

    if (!name || !platform || !handle || !siteId) {
      return NextResponse.json(
        { error: 'Name, platform, handle, and siteId are required' },
        { status: 400 }
      );
    }

    const influencer = await influencerOutreachService.createInfluencer({
      name,
      email,
      platform,
      handle,
      followers: followers || 0,
      engagement: engagement || 0,
      tags,
      metadata,
      siteId,
    });

    return NextResponse.json({ influencer }, { status: 201 });
  } catch (error) {
    console.error('Failed to create influencer:', error);
    return NextResponse.json(
      { error: 'Failed to create influencer' },
      { status: 500 }
    );
  }
} 