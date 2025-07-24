import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { commentsService, CommentModerationSchema, CommentReportSchema } from '@/lib/services/comments';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('moderate_comments')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'pending':
        const limit = parseInt(searchParams.get('limit') || '50');
        const pendingComments = await commentsService.getPendingComments(siteId, limit);
        return NextResponse.json({ pendingComments });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching moderation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation data' },
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
      case 'moderate':
        if (!session.user.permissions?.includes('moderate_comments')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const moderationData = CommentModerationSchema.parse({
          ...body,
          moderatorId: session.user.id
        });

        const moderationSuccess = await commentsService.moderateComment(moderationData);

        if (moderationSuccess) {
          return NextResponse.json({ 
            message: 'Comment moderated successfully',
            action: moderationData.action
          });
        } else {
          return NextResponse.json({ error: 'Failed to moderate comment' }, { status: 500 });
        }

      case 'report':
        const reportData = CommentReportSchema.parse({
          ...body,
          reporterId: session.user.id
        });

        const reportSuccess = await commentsService.reportComment(reportData);

        if (reportSuccess) {
          return NextResponse.json({ message: 'Comment reported successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to report comment' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing moderation action:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform moderation action' },
      { status: 500 }
    );
  }
} 