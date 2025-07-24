import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { contentMarketingService } from '@/lib/services/content-marketing';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const siteId = searchParams.get('siteId');

    if (!contentId || !siteId) {
      return NextResponse.json(
        { error: 'ContentId and siteId are required' },
        { status: 400 }
      );
    }

    const suggestions = await contentMarketingService.generateContentOptimizationSuggestions(contentId, siteId);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Failed to get content optimization suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get content optimization suggestions' },
      { status: 500 }
    );
  }
} 