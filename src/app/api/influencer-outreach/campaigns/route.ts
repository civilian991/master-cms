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
    const influencerId = searchParams.get('influencerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const campaigns = await influencerOutreachService.getInfluencerCampaigns(siteId, {
      status: status as any,
      influencerId: influencerId || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Failed to get influencer campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to get influencer campaigns' },
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
      description,
      startDate,
      endDate,
      budget,
      influencerId,
      siteId,
    } = body;

    if (!name || !influencerId || !siteId) {
      return NextResponse.json(
        { error: 'Name, influencerId, and siteId are required' },
        { status: 400 }
      );
    }

    const campaign = await influencerOutreachService.createInfluencerCampaign({
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      influencerId,
      siteId,
      createdBy: session.user.email || 'unknown',
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Failed to create influencer campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create influencer campaign' },
      { status: 500 }
    );
  }
} 