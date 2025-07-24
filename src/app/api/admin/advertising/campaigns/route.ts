import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdvertisingService } from '@/lib/services/advertising';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, ...campaignData } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();
    const campaign = await advertisingService.createCampaign(campaignData, siteId);

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const type = searchParams.get('type');
    const objective = searchParams.get('objective');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();
    const campaigns = await advertisingService.getCampaigns(siteId, {
      type: type || undefined,
      objective: objective || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCampaigns = campaigns.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      campaigns: paginatedCampaigns,
      pagination: {
        page,
        limit,
        total: campaigns.length,
        pages: Math.ceil(campaigns.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const advertisingService = AdvertisingService.getInstance();
    const campaign = await advertisingService.updateCampaign(campaignId, body);

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
} 