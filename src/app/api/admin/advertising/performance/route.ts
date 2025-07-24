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
    const { siteId, ...performanceData } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();
    const performance = await advertisingService.trackPerformance(performanceData, siteId);

    return NextResponse.json({
      success: true,
      performance,
    });
  } catch (error) {
    console.error('Failed to track performance:', error);
    return NextResponse.json(
      { error: 'Failed to track performance' },
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const advertisementId = searchParams.get('advertisementId');
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
    const performances = await advertisingService.getPerformance(siteId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      advertisementId: advertisementId || undefined,
      campaignId: campaignId || undefined,
      placementId: placementId || undefined,
    });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPerformances = performances.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      performances: paginatedPerformances,
      pagination: {
        page,
        limit,
        total: performances.length,
        pages: Math.ceil(performances.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
} 