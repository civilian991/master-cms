import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { seoToolsService } from '@/lib/services/seo-tools';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const competitors = await seoToolsService.getSEOCompetitors(siteId, {
      status: status as any,
      limit,
      offset,
    });

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Failed to get SEO competitors:', error);
    return NextResponse.json(
      { error: 'Failed to get SEO competitors' },
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
    const { domain, name, metrics, keywords, siteId } = body;

    if (!domain || !siteId) {
      return NextResponse.json(
        { error: 'Domain and siteId are required' },
        { status: 400 }
      );
    }

    const competitor = await seoToolsService.createSEOCompetitor({
      domain,
      name,
      metrics,
      keywords,
      siteId,
    });

    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    console.error('Failed to create SEO competitor:', error);
    return NextResponse.json(
      { error: 'Failed to create SEO competitor' },
      { status: 500 }
    );
  }
} 