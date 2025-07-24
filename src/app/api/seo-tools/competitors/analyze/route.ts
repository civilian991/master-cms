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
    const { domain, siteId } = body;

    if (!domain || !siteId) {
      return NextResponse.json(
        { error: 'Domain and siteId are required' },
        { status: 400 }
      );
    }

    const analysis = await seoToolsService.analyzeCompetitor(domain, siteId);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Failed to analyze competitor:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitor' },
      { status: 500 }
    );
  }
} 