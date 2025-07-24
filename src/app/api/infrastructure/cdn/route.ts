import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { CDNService, CDNConfiguration } from '@/lib/services/cdn';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const cdnConfig: CDNConfiguration = {
      provider: 'cloudflare',
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    };

    const cdnService = new CDNService(cdnConfig);

    switch (action) {
      case 'analytics':
        const timeRange = searchParams.get('timeRange') || '24h';
        const analytics = await cdnService.getAnalytics(timeRange);
        return NextResponse.json({ analytics });

      case 'performance':
        const performance = await cdnService.getPerformanceMetrics();
        return NextResponse.json({ performance });

      case 'costs':
        const costOptimization = await cdnService.optimizeCosts();
        return NextResponse.json({ costOptimization });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CDN API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    const cdnConfig: CDNConfiguration = {
      provider: data.provider || 'cloudflare',
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    };

    const cdnService = new CDNService(cdnConfig);

    switch (action) {
      case 'configure':
        const configured = await cdnService.configureCDN();
        return NextResponse.json({ success: configured });

      case 'invalidate':
        const { paths } = data;
        if (!paths || !Array.isArray(paths)) {
          return NextResponse.json(
            { error: 'Paths array is required' },
            { status: 400 }
          );
        }
        const invalidated = await cdnService.invalidateCache(paths);
        return NextResponse.json({ success: invalidated });

      case 'failover':
        const failoverConfigured = await cdnService.configureFailover();
        return NextResponse.json({ success: failoverConfigured });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CDN API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 