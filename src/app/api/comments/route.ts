import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { commentsService, CommentSchema, CommentFilterSchema } from '@/lib/services/comments';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const action = searchParams.get('action');

    if (commentId) {
      // Get single comment
      const comment = await commentsService.getComment(commentId);
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      return NextResponse.json({ comment });
    }

    if (action === 'thread') {
      // Get comment thread for article
      const articleId = searchParams.get('articleId');
      if (!articleId) {
        return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
      }

      const maxLevel = parseInt(searchParams.get('maxLevel') || '5');
      const sortBy = searchParams.get('sortBy') || 'date';
      const includeHidden = searchParams.get('includeHidden') === 'true';

      const thread = await commentsService.getCommentThread(articleId, {
        maxLevel,
        sortBy,
        includeHidden: includeHidden && session.user.permissions?.includes('moderate_comments')
      });

      return NextResponse.json({ thread });
    }

    // Get comments with filters
    const filterData = {
      articleId: searchParams.get('articleId'),
      authorId: searchParams.get('authorId'),
      status: searchParams.get('status'),
      parentId: searchParams.get('parentId'),
      hasReplies: searchParams.get('hasReplies') === 'true' ? true : 
                   searchParams.get('hasReplies') === 'false' ? false : undefined,
      fromDate: searchParams.get('fromDate'),
      toDate: searchParams.get('toDate'),
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      siteId: searchParams.get('siteId') || '',
    };

    if (!filterData.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const validatedFilter = CommentFilterSchema.parse(filterData);
    const result = await commentsService.getComments(validatedFilter);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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
    const validatedData = CommentSchema.parse({
      ...body,
      authorId: session.user.id
    });

    const comment = await commentsService.createComment(validatedData);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
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
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check if user owns the comment or has moderation permissions
    const existingComment = await commentsService.getComment(commentId);
    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.authorId !== session.user.id && 
        !session.user.permissions?.includes('moderate_comments')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const comment = await commentsService.updateComment(commentId, body);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
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
    const commentId = searchParams.get('commentId');
    const hard = searchParams.get('hard') === 'true';

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check if user owns the comment or has moderation permissions
    const existingComment = await commentsService.getComment(commentId);
    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.authorId !== session.user.id && 
        !session.user.permissions?.includes('moderate_comments')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Only allow hard delete for moderators
    const performHardDelete = hard && session.user.permissions?.includes('moderate_comments');
    const success = await commentsService.deleteComment(commentId, !performHardDelete);

    if (success) {
      return NextResponse.json({ message: 'Comment deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
} 