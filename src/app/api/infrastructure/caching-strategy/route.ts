import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { CachingStrategyService, CachingStrategyConfig } from '@/lib/services/caching-strategy';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const cachingConfig: CachingStrategyConfig = {
      provider: 'redis',
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.REDIS_ENDPOINT || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      apiKey: process.env.CACHING_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const cachingService = new CachingStrategyService(cachingConfig);

    switch (action) {
      case 'metrics':
        const metrics = await cachingService.getCacheMetrics();
        return NextResponse.json({ metrics });

      case 'health':
        const health = await cachingService.getCacheHealth();
        return NextResponse.json({ health });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Caching Strategy API error:', error);
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

    const cachingConfig: CachingStrategyConfig = {
      provider: data.provider || 'redis',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      endpoint: data.endpoint || process.env.REDIS_ENDPOINT || 'localhost',
      port: data.port || parseInt(process.env.REDIS_PORT || '6379'),
      apiKey: data.apiKey || process.env.CACHING_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const cachingService = new CachingStrategyService(cachingConfig);

    switch (action) {
      case 'setup-redis-caching':
        const redisResult = await cachingService.setupRedisCaching();
        return NextResponse.json({ success: redisResult });

      case 'implement-application-caching':
        const appCachingResult = await cachingService.implementApplicationCaching();
        return NextResponse.json({ success: appCachingResult });

      case 'configure-cdn-caching':
        const cdnResult = await cachingService.configureCDNCaching();
        return NextResponse.json({ success: cdnResult });

      case 'create-cache-invalidation':
        const invalidationResult = await cachingService.createCacheInvalidationStrategies();
        return NextResponse.json({ success: invalidationResult });

      case 'implement-cache-monitoring':
        const monitoringResult = await cachingService.implementCacheMonitoring();
        return NextResponse.json({ success: monitoringResult });

      case 'setup-cache-performance':
        const performanceResult = await cachingService.setupCachePerformanceOptimization();
        return NextResponse.json({ success: performanceResult });

      case 'create-cache-security':
        const securityResult = await cachingService.createCacheSecurity();
        return NextResponse.json({ success: securityResult });

      case 'implement-cache-failover':
        const failoverResult = await cachingService.implementCacheFailover();
        return NextResponse.json({ success: failoverResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Caching Strategy API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 