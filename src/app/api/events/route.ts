import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { eventsService, EventSchema } from '@/lib/services/events';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const action = searchParams.get('action');

    if (eventId) {
      // Get single event
      const event = await eventsService.getEvent(eventId, session.user.id);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    if (action === 'calendar') {
      // Get calendar events
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const siteId = searchParams.get('siteId');
      const hostId = searchParams.get('hostId');
      const type = searchParams.get('type')?.split(',');
      const status = searchParams.get('status')?.split(',');

      if (!startDate || !endDate || !siteId) {
        return NextResponse.json({ 
          error: 'Start date, end date, and site ID are required for calendar view' 
        }, { status: 400 });
      }

      const calendarEvents = await eventsService.getEventCalendar({
        startDate,
        endDate,
        siteId,
        hostId,
        type,
        status,
      });

      return NextResponse.json({ events: calendarEvents });
    }

    // Get events with filters
    const options = {
      siteId: searchParams.get('siteId') || '',
      hostId: searchParams.get('hostId'),
      type: searchParams.get('type')?.split(','),
      status: searchParams.get('status')?.split(','),
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      includePrivate: searchParams.get('includePrivate') === 'true',
      sortBy: searchParams.get('sortBy') as 'startTime' | 'title' | 'registrations' || 'startTime',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    if (!options.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const result = await eventsService.getEvents(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('create_events')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = EventSchema.parse({
      ...body,
      hostId: session.user.id,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });

    const event = await eventsService.createEvent(validatedData);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
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
    const eventId = searchParams.get('eventId');
    const action = searchParams.get('action');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user owns the event or has management permissions
    const existingEvent = await eventsService.getEvent(eventId);
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.hostId !== session.user.id && 
        !session.user.permissions?.includes('manage_events')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    switch (action) {
      case 'start-stream':
        if (!session.user.permissions?.includes('manage_streaming')) {
          return NextResponse.json({ error: 'Insufficient permissions for streaming' }, { status: 403 });
        }
        const startResult = await eventsService.startLiveStream(eventId);
        return NextResponse.json({ success: startResult });

      case 'end-stream':
        if (!session.user.permissions?.includes('manage_streaming')) {
          return NextResponse.json({ error: 'Insufficient permissions for streaming' }, { status: 403 });
        }
        const endResult = await eventsService.endLiveStream(eventId, body.recordingUrl);
        return NextResponse.json({ success: endResult });

      case 'configure-streaming':
        if (!session.user.permissions?.includes('manage_streaming')) {
          return NextResponse.json({ error: 'Insufficient permissions for streaming' }, { status: 403 });
        }
        const configResult = await eventsService.configureStreaming(eventId, body.streamingConfig);
        return NextResponse.json({ success: configResult });

      default:
        // Regular event update
        const updates: any = { ...body };
        if (updates.startTime) updates.startTime = new Date(updates.startTime);
        if (updates.endTime) updates.endTime = new Date(updates.endTime);

        const event = await eventsService.updateEvent(eventId, updates);
        return NextResponse.json({ event });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user owns the event or has management permissions
    const existingEvent = await eventsService.getEvent(eventId);
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.hostId !== session.user.id && 
        !session.user.permissions?.includes('manage_events')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const success = await eventsService.deleteEvent(eventId);

    if (success) {
      return NextResponse.json({ message: 'Event deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 