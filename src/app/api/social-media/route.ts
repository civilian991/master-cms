import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/services/social-media';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// GET /api/social-media - Get social media posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const platform = searchParams.get('platform') as any;
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const posts = await socialMediaService.getPosts(siteId, {
      platform,
      status,
      limit,
      offset,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Failed to get social media posts:', error);
    return NextResponse.json(
      { error: 'Failed to get social media posts' },
      { status: 500 }
    );
  }
}

// POST /api/social-media - Create a new social media post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      platform,
      siteId,
      campaignId,
      scheduledAt,
      mediaUrls,
      metadata,
    } = body;

    if (!content || !platform || !siteId) {
      return NextResponse.json(
        { error: 'Content, platform, and siteId are required' },
        { status: 400 }
      );
    }

    const post = await socialMediaService.createPost(
      {
        content,
        platform,
        siteId,
        campaignId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        mediaUrls,
        metadata,
      },
      (session.user as any).id
    );

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Failed to create social media post:', error);
    return NextResponse.json(
      { error: 'Failed to create social media post' },
      { status: 500 }
    );
  }
} 