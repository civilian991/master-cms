import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { moderationService } from '@/lib/services/moderation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('moderate_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const options = {
      status: searchParams.get('status')?.split(','),
      priority: searchParams.get('priority')?.split(','),
      category: searchParams.get('category')?.split(','),
      assignedTo: searchParams.get('assignedTo'),
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await moderationService.getModerationQueue(siteId, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('moderate_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, queueId } = body;

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'assign':
        const queueItem = await moderationService.assignQueueItem(queueId, session.user.id);
        return NextResponse.json({ queueItem });

      case 'process':
        const { decision, notes } = body;
        if (!decision) {
          return NextResponse.json({ error: 'Decision is required' }, { status: 400 });
        }

        await moderationService.processQueueItem(queueId, decision, session.user.id, notes);
        return NextResponse.json({ message: 'Queue item processed successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing queue action:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to process queue action' },
      { status: 500 }
    );
  }
} 