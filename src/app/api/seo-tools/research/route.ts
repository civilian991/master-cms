import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { seoToolsService } from '@/lib/services/seo-tools';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, siteId } = body;

    if (!query || !siteId) {
      return NextResponse.json(
        { error: 'Query and siteId are required' },
        { status: 400 }
      );
    }

    const researchResults = await seoToolsService.researchKeywords(query, siteId);

    return NextResponse.json({ researchResults });
  } catch (error) {
    console.error('Failed to research keywords:', error);
    return NextResponse.json(
      { error: 'Failed to research keywords' },
      { status: 500 }
    );
  }
} 