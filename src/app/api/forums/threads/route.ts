import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { forumsService, ForumThreadSchema } from '@/lib/services/forums';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const threadId = searchParams.get('threadId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') as 'date' | 'replies' | 'views' || 'date';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    if (threadId) {
      // Get single thread
      const thread = await forumsService.getThread(threadId);
      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }
      return NextResponse.json({ thread });
    } else if (categoryId) {
      // Get threads in category
      const result = await forumsService.getThreads(categoryId, {
        page,
        limit,
        sortBy,
        sortOrder
      });
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Category ID or Thread ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum threads' },
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
    const validatedData = ForumThreadSchema.parse({
      ...body,
      authorId: session.user.id
    });

    const thread = await forumsService.createThread(validatedData);

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error('Error creating forum thread:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create forum thread' },
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
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Check if user owns the thread or has moderation permissions
    const existingThread = await forumsService.getThread(threadId);
    if (!existingThread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (existingThread.authorId !== session.user.id && 
        !session.user.permissions?.includes('moderate_forums')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const thread = await forumsService.updateThread(threadId, body);

    return NextResponse.json({ thread });
  } catch (error) {
    console.error('Error updating forum thread:', error);
    return NextResponse.json(
      { error: 'Failed to update forum thread' },
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
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    // Check if user owns the thread or has moderation permissions
    const existingThread = await forumsService.getThread(threadId);
    if (!existingThread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (existingThread.authorId !== session.user.id && 
        !session.user.permissions?.includes('moderate_forums')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const success = await forumsService.deleteThread(threadId);

    if (success) {
      return NextResponse.json({ message: 'Thread deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting forum thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete forum thread' },
      { status: 500 }
    );
  }
} 