import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { contentMarketingService } from '@/lib/services/content-marketing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, channels, siteId } = body;

    if (!contentId || !channels || !siteId) {
      return NextResponse.json(
        { error: 'ContentId, channels, and siteId are required' },
        { status: 400 }
      );
    }

    const results = await contentMarketingService.distributeContent(contentId, channels, siteId);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Failed to distribute content:', error);
    return NextResponse.json(
      { error: 'Failed to distribute content' },
      { status: 500 }
    );
  }
} 