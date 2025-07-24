/**
 * Mobile Analytics API
 * API endpoints for collecting and retrieving mobile analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Types for analytics data
interface AnalyticsPayload {
  events: MobileAnalyticsEvent[];
  session: {
    sessionId: string;
    userId?: string;
    timestamp: number;
  };
}

interface MobileAnalyticsEvent {
  eventName: string;
  eventType: 'interaction' | 'navigation' | 'performance' | 'error' | 'conversion' | 'engagement';
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceInfo: any;
  pageInfo: any;
  properties: Record<string, any>;
  metrics?: any;
}

/**
 * POST /api/analytics/mobile
 * Collect mobile analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const payload: AnalyticsPayload = await request.json();
    
    if (!payload.events || !Array.isArray(payload.events)) {
      return NextResponse.json(
        { error: 'Invalid payload: events array required' },
        { status: 400 }
      );
    }

    // Get site ID from headers or session
    const siteId = request.headers.get('x-site-id') || '1';
    
    // Process events in batches for better performance
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < payload.events.length; i += batchSize) {
      batches.push(payload.events.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await processBatch(batch, siteId);
    }

    return NextResponse.json({
      success: true,
      processed: payload.events.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Mobile analytics collection error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/mobile
 * Retrieve mobile analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const eventType = searchParams.get('eventType');
    const deviceType = searchParams.get('deviceType');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Calculate time range
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeRangeMs = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h'];
    const startTime = new Date(Date.now() - timeRangeMs);

    // Build query filters
    const where: any = {
      createdAt: {
        gte: startTime
      }
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (deviceType) {
      where.deviceInfo = {
        path: ['deviceType'],
        equals: deviceType
      };
    }

    // Get analytics events
    const events = await prisma.mobileAnalyticsEvent.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get summary statistics
    const summary = await getAnalyticsSummary(startTime);

    return NextResponse.json({
      events,
      summary,
      pagination: {
        limit,
        offset,
        total: events.length
      },
      timeRange: {
        start: startTime.toISOString(),
        end: new Date().toISOString(),
        range: timeRange
      }
    });

  } catch (error) {
    console.error('Mobile analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}

/**
 * Process a batch of analytics events
 */
async function processBatch(events: MobileAnalyticsEvent[], siteId: string) {
  const analyticsData = events.map(event => ({
    siteId: parseInt(siteId),
    eventName: event.eventName,
    eventType: event.eventType,
    sessionId: event.sessionId,
    userId: event.userId,
    deviceInfo: event.deviceInfo,
    pageInfo: event.pageInfo,
    properties: event.properties,
    metrics: event.metrics,
    timestamp: new Date(event.timestamp),
    createdAt: new Date()
  }));

  // Insert analytics events
  await prisma.mobileAnalyticsEvent.createMany({
    data: analyticsData,
    skipDuplicates: true
  });

  // Update session data
  for (const event of events) {
    await upsertSession(event, siteId);
  }

  // Update aggregated metrics
  await updateAggregatedMetrics(events, siteId);
}

/**
 * Upsert session data
 */
async function upsertSession(event: MobileAnalyticsEvent, siteId: string) {
  try {
    await prisma.mobileAnalyticsSession.upsert({
      where: {
        sessionId: event.sessionId
      },
      create: {
        sessionId: event.sessionId,
        siteId: parseInt(siteId),
        userId: event.userId,
        deviceInfo: event.deviceInfo,
        startTime: new Date(event.timestamp),
        lastActivity: new Date(event.timestamp),
        pageViews: 1,
        interactions: event.eventType === 'interaction' ? 1 : 0,
        duration: 0,
        isActive: true
      },
      update: {
        lastActivity: new Date(event.timestamp),
        pageViews: event.eventName === 'page_view' ? { increment: 1 } : undefined,
        interactions: event.eventType === 'interaction' ? { increment: 1 } : undefined,
        duration: {
          set: event.timestamp - (await getSessionStartTime(event.sessionId))
        }
      }
    });
  } catch (error) {
    console.error('Session upsert error:', error);
  }
}

/**
 * Get session start time
 */
async function getSessionStartTime(sessionId: string): Promise<number> {
  try {
    const session = await prisma.mobileAnalyticsSession.findUnique({
      where: { sessionId },
      select: { startTime: true }
    });
    
    return session?.startTime.getTime() || Date.now();
  } catch (error) {
    return Date.now();
  }
}

/**
 * Update aggregated metrics
 */
async function updateAggregatedMetrics(events: MobileAnalyticsEvent[], siteId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Group events by type for aggregation
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = [];
      }
      acc[event.eventType].push(event);
      return acc;
    }, {} as Record<string, MobileAnalyticsEvent[]>);

    // Update daily aggregations
    for (const [eventType, typeEvents] of Object.entries(eventsByType)) {
      await prisma.mobileAnalyticsDailyAggregation.upsert({
        where: {
          siteId_date_eventType: {
            siteId: parseInt(siteId),
            date: today,
            eventType
          }
        },
        create: {
          siteId: parseInt(siteId),
          date: today,
          eventType,
          count: typeEvents.length,
          uniqueSessions: new Set(typeEvents.map(e => e.sessionId)).size,
          uniqueUsers: new Set(typeEvents.map(e => e.userId).filter(Boolean)).size,
          metadata: {
            deviceTypes: getDeviceTypeBreakdown(typeEvents),
            topEvents: getTopEvents(typeEvents)
          }
        },
        update: {
          count: { increment: typeEvents.length },
          uniqueSessions: {
            set: await getUniqueSessionCount(siteId, today, eventType)
          },
          uniqueUsers: {
            set: await getUniqueUserCount(siteId, today, eventType)
          },
          metadata: {
            set: {
              deviceTypes: getDeviceTypeBreakdown(typeEvents),
              topEvents: getTopEvents(typeEvents)
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Aggregation update error:', error);
  }
}

/**
 * Get unique session count for aggregation
 */
async function getUniqueSessionCount(siteId: string, date: Date, eventType: string): Promise<number> {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const result = await prisma.mobileAnalyticsEvent.groupBy({
    by: ['sessionId'],
    where: {
      siteId: parseInt(siteId),
      eventType,
      timestamp: {
        gte: date,
        lt: nextDay
      }
    }
  });

  return result.length;
}

/**
 * Get unique user count for aggregation
 */
async function getUniqueUserCount(siteId: string, date: Date, eventType: string): Promise<number> {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const result = await prisma.mobileAnalyticsEvent.groupBy({
    by: ['userId'],
    where: {
      siteId: parseInt(siteId),
      eventType,
      userId: { not: null },
      timestamp: {
        gte: date,
        lt: nextDay
      }
    }
  });

  return result.length;
}

/**
 * Get device type breakdown
 */
function getDeviceTypeBreakdown(events: MobileAnalyticsEvent[]): Record<string, number> {
  return events.reduce((acc, event) => {
    const deviceType = event.deviceInfo?.deviceType || 'unknown';
    acc[deviceType] = (acc[deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get top events
 */
function getTopEvents(events: MobileAnalyticsEvent[]): Array<{ name: string; count: number }> {
  const eventCounts = events.reduce((acc, event) => {
    acc[event.eventName] = (acc[event.eventName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Get analytics summary
 */
async function getAnalyticsSummary(startTime: Date) {
  try {
    // Get total events
    const totalEvents = await prisma.mobileAnalyticsEvent.count({
      where: {
        createdAt: { gte: startTime }
      }
    });

    // Get unique sessions
    const uniqueSessions = await prisma.mobileAnalyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        createdAt: { gte: startTime }
      }
    });

    // Get unique users
    const uniqueUsers = await prisma.mobileAnalyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startTime },
        userId: { not: null }
      }
    });

    // Get top events
    const eventCounts = await prisma.mobileAnalyticsEvent.groupBy({
      by: ['eventName'],
      _count: {
        eventName: true
      },
      where: {
        createdAt: { gte: startTime }
      },
      orderBy: {
        _count: {
          eventName: 'desc'
        }
      },
      take: 10
    });

    // Get device breakdown
    const deviceBreakdown = await prisma.$queryRaw`
      SELECT 
        JSON_EXTRACT(deviceInfo, '$.deviceType') as deviceType,
        COUNT(*) as count
      FROM MobileAnalyticsEvent 
      WHERE createdAt >= ${startTime}
      GROUP BY JSON_EXTRACT(deviceInfo, '$.deviceType')
    ` as Array<{ deviceType: string; count: bigint }>;

    return {
      totalEvents,
      uniqueSessions: uniqueSessions.length,
      uniqueUsers: uniqueUsers.length,
      topEvents: eventCounts.map(e => ({
        name: e.eventName,
        count: e._count.eventName
      })),
      deviceBreakdown: deviceBreakdown.map(d => ({
        deviceType: d.deviceType,
        count: Number(d.count)
      }))
    };

  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      totalEvents: 0,
      uniqueSessions: 0,
      uniqueUsers: 0,
      topEvents: [],
      deviceBreakdown: []
    };
  }
} 