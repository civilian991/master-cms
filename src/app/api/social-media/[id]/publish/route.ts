import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/services/social-media';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// POST /api/social-media/[id]/publish - Publish a social media post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await socialMediaService.publishPost(params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to publish social media post:', error);
    return NextResponse.json(
      { error: 'Failed to publish social media post' },
      { status: 500 }
    );
  }
} 