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
    const { siteId, ...adData } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();
    const advertisement = await advertisingService.createAdvertisement(adData, siteId);

    return NextResponse.json({
      success: true,
      advertisement,
    });
  } catch (error) {
    console.error('Failed to create advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to create advertisement' },
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
    const status = searchParams.get('status');
    const campaignId = searchParams.get('campaignId');
    const placementId = searchParams.get('placementId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();
    const advertisements = await advertisingService.getAdvertisements(siteId, {
      type: type || undefined,
      status: status || undefined,
      campaignId: campaignId || undefined,
      placementId: placementId || undefined,
    });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAds = advertisements.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      advertisements: paginatedAds,
      pagination: {
        page,
        limit,
        total: advertisements.length,
        pages: Math.ceil(advertisements.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch advertisements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisements' },
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
    const adId = searchParams.get('adId');

    if (!adId) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const advertisingService = AdvertisingService.getInstance();
    const advertisement = await advertisingService.updateAdvertisement(adId, body);

    return NextResponse.json({
      success: true,
      advertisement,
    });
  } catch (error) {
    console.error('Failed to update advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to update advertisement' },
      { status: 500 }
    );
  }
} 