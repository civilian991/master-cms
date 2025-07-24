import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdvertisingService } from '@/lib/services/advertising';

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
    const type = searchParams.get('type'); // stats, blocking, strategy

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const advertisingService = AdvertisingService.getInstance();

    switch (type) {
      case 'stats':
        const stats = await advertisingService.getAdvertisingStats(
          siteId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        return NextResponse.json({
          success: true,
          stats,
        });

      case 'blocking':
        const blockingStats = await advertisingService.getAdBlockingStats(siteId);
        return NextResponse.json({
          success: true,
          blocking: blockingStats,
        });

      case 'strategy':
        const strategy = await advertisingService.getSiteSpecificStrategy(siteId);
        return NextResponse.json({
          success: true,
          strategy,
        });

      default:
        // Return comprehensive analytics
        const [allStats, allBlockingStats, allStrategy] = await Promise.all([
          advertisingService.getAdvertisingStats(
            siteId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
          ),
          advertisingService.getAdBlockingStats(siteId),
          advertisingService.getSiteSpecificStrategy(siteId),
        ]);

        return NextResponse.json({
          success: true,
          analytics: {
            stats: allStats,
            blocking: allBlockingStats,
            strategy: allStrategy,
          },
        });
    }
  } catch (error) {
    console.error('Failed to fetch advertising analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertising analytics' },
      { status: 500 }
    );
  }
} 