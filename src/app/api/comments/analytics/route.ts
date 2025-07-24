import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { commentsService } from '@/lib/services/comments';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const analytics = await commentsService.getCommentAnalytics(siteId, timeRange);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching comment analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment analytics' },
      { status: 500 }
    );
  }
} 