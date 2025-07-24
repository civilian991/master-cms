import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { influencerOutreachService } from '@/lib/services/influencer-outreach';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      platform,
      minFollowers,
      maxFollowers,
      minEngagement,
      tags,
      keywords,
      siteId,
    } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const discoveryResults = await influencerOutreachService.discoverInfluencers({
      platform,
      minFollowers,
      maxFollowers,
      minEngagement,
      tags,
      keywords,
      siteId,
    });

    return NextResponse.json({ discoveryResults });
  } catch (error) {
    console.error('Failed to discover influencers:', error);
    return NextResponse.json(
      { error: 'Failed to discover influencers' },
      { status: 500 }
    );
  }
} 