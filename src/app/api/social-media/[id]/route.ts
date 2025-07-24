import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/services/social-media';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// GET /api/social-media/[id] - Get a specific social media post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await socialMediaService.getPosts('', { limit: 1 });
    const foundPost = posts.find((p: any) => p.id === params.id);

    if (!foundPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post: foundPost });
  } catch (error) {
    console.error('Failed to get social media post:', error);
    return NextResponse.json(
      { error: 'Failed to get social media post' },
      { status: 500 }
    );
  }
}

// PUT /api/social-media/[id] - Update a social media post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, scheduledAt, metadata } = body;

    // For now, we'll just update the post in the database
    // In a full implementation, we'd need to update the platform post as well
    const { prisma } = await import('@/lib/prisma');
    
    const post = await prisma.socialMediaPost.update({
      where: { id: params.id },
      data: {
        content,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        metadata,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Failed to update social media post:', error);
    return NextResponse.json(
      { error: 'Failed to update social media post' },
      { status: 500 }
    );
  }
}

// DELETE /api/social-media/[id] - Delete a social media post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await socialMediaService.deletePost(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete social media post:', error);
    return NextResponse.json(
      { error: 'Failed to delete social media post' },
      { status: 500 }
    );
  }
} 