import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalyticsService } from '@/lib/services/ai/predictive-analytics';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const analyticsService = PredictiveAnalyticsService.getInstance();

// Validation schemas
const trackEventSchema = z.object({
  siteId: z.number().int().positive(),
  userId: z.string().optional(),
  sessionId: z.string(),
  deviceId: z.string().optional(),
  eventType: z.string(),
  eventCategory: z.string(),
  eventAction: z.string(),
  eventLabel: z.string().optional(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  referrerUrl: z.string().optional(),
  contentId: z.string().optional(),
  contentType: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.record(z.any()).optional(),
  deviceInfo: z.record(z.any()).optional(),
  timeOnPage: z.number().optional(),
  scrollDepth: z.number().optional(),
  interactionCount: z.number().default(0),
  properties: z.record(z.any()),
  consentGiven: z.boolean().default(false),
});

const getEventsSchema = z.object({
  siteId: z.number().int().positive(),
  userId: z.string().optional(),
  eventType: z.string().optional(),
  contentType: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  limit: z.number().int().positive().optional(),
});

const getInsightsSchema = z.object({
  siteId: z.number().int().positive(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

// POST /api/ai/analytics/track - Track user behavior event
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/track')) {
      // Track user behavior event
      const validatedData = trackEventSchema.parse(body);
      
      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      // Add IP address from request if not provided
      if (!validatedData.ipAddress) {
        validatedData.ipAddress = request.headers.get('x-forwarded-for') || 
                                 request.headers.get('x-real-ip') || 
                                 'unknown';
      }

      const event = await analyticsService.trackUserBehavior(validatedData);
      
      return NextResponse.json({
        success: true,
        event,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error tracking user behavior:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/ai/analytics/events - Get user behavior events
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view analytics
    if (!user.permissions.includes('analytics:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const path = new URL(request.url).pathname;

    if (path.includes('/events')) {
      // Get user behavior events
      const validatedData = getEventsSchema.parse({
        siteId: parseInt(searchParams.get('siteId') || '0'),
        userId: searchParams.get('userId') || undefined,
        eventType: searchParams.get('eventType') || undefined,
        contentType: searchParams.get('contentType') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      });

      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const events = await analyticsService.getUserBehaviorEvents(
        validatedData.siteId,
        {
          userId: validatedData.userId,
          eventType: validatedData.eventType,
          contentType: validatedData.contentType,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          limit: validatedData.limit,
        }
      );

      return NextResponse.json({
        success: true,
        events,
        total: events.length,
      });
    } else if (path.includes('/insights')) {
      // Get analytics insights
      const validatedData = getInsightsSchema.parse({
        siteId: parseInt(searchParams.get('siteId') || '0'),
        startDate: searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        endDate: searchParams.get('endDate') || new Date().toISOString(),
      });

      // Check if user has access to the site
      if (!user.permissions.includes('site:all') && user.siteId !== validatedData.siteId) {
        return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
      }

      const insights = await analyticsService.getAnalyticsInsights(
        validatedData.siteId,
        {
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
        }
      );

      return NextResponse.json({
        success: true,
        insights,
      });
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 