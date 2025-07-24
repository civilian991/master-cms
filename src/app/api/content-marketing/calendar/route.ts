import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { contentMarketingService } from '@/lib/services/content-marketing';

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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const events = await contentMarketingService.getContentCalendarEvents(siteId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type: type || undefined,
      status: status || undefined,
      assignedTo: assignedTo || undefined,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to get content calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to get content calendar events' },
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
      title,
      description,
      type,
      status,
      startDate,
      endDate,
      assignedTo,
      priority,
      tags,
      siteId,
    } = body;

    if (!title || !type || !startDate || !siteId) {
      return NextResponse.json(
        { error: 'Title, type, startDate, and siteId are required' },
        { status: 400 }
      );
    }

    const event = await contentMarketingService.createContentCalendarEvent({
      title,
      description,
      type,
      status: status || 'planned',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      assignedTo: assignedTo || undefined,
      priority: priority || 'medium',
      tags: tags || [],
      siteId,
      createdBy: session.user.email || 'unknown',
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Failed to create content calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create content calendar event' },
      { status: 500 }
    );
  }
} 