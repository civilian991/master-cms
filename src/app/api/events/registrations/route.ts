import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { eventsService, EventRegistrationSchema } from '@/lib/services/events';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user can view registrations (event host or admin)
    const event = await eventsService.getEvent(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.hostId !== session.user.id && 
        !session.user.permissions?.includes('manage_events')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const options = {
      status: searchParams.get('status')?.split(','),
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await eventsService.getEventRegistrations(eventId, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event registrations' },
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
    const { action } = body;

    switch (action) {
      case 'register':
        const validatedData = EventRegistrationSchema.parse({
          ...body,
          userId: session.user.id
        });

        const registration = await eventsService.registerForEvent(validatedData);
        return NextResponse.json({ registration }, { status: 201 });

      case 'cancel':
        const { eventId } = body;
        if (!eventId) {
          return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const cancelResult = await eventsService.cancelRegistration(eventId, session.user.id);
        if (cancelResult) {
          return NextResponse.json({ message: 'Registration cancelled successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing registration:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      // Handle business logic errors
      if (error.message.includes('already registered') || 
          error.message.includes('not available') ||
          error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to process registration' },
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
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    // Check permissions (only event hosts and admins can update registrations)
    if (!session.user.permissions?.includes('manage_events')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const registration = await eventsService.updateRegistration(registrationId, body);

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
} 