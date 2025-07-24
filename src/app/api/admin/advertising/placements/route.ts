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
    const { siteId, ...placementData } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();
    const placement = await advertisingService.createPlacement(placementData, siteId);

    return NextResponse.json({
      success: true,
      placement,
    });
  } catch (error) {
    console.error('Failed to create placement:', error);
    return NextResponse.json(
      { error: 'Failed to create placement' },
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
    const position = searchParams.get('position');
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
    const placements = await advertisingService.getPlacements(siteId, {
      type: type || undefined,
      position: position || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlacements = placements.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      placements: paginatedPlacements,
      pagination: {
        page,
        limit,
        total: placements.length,
        pages: Math.ceil(placements.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch placements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch placements' },
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
    const placementId = searchParams.get('placementId');

    if (!placementId) {
      return NextResponse.json(
        { error: 'Placement ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const advertisingService = AdvertisingService.getInstance();
    const placement = await advertisingService.updatePlacement(placementId, body);

    return NextResponse.json({
      success: true,
      placement,
    });
  } catch (error) {
    console.error('Failed to update placement:', error);
    return NextResponse.json(
      { error: 'Failed to update placement' },
      { status: 500 }
    );
  }
} 