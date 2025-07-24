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
    const minSearchVolume = searchParams.get('minSearchVolume');
    const maxDifficulty = searchParams.get('maxDifficulty');
    const hasPosition = searchParams.get('hasPosition');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const keywords = await seoToolsService.getSEOKeywords(siteId, {
      status: status as any,
      minSearchVolume: minSearchVolume ? parseInt(minSearchVolume) : undefined,
      maxDifficulty: maxDifficulty ? parseInt(maxDifficulty) : undefined,
      hasPosition: hasPosition ? hasPosition === 'true' : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('Failed to get SEO keywords:', error);
    return NextResponse.json(
      { error: 'Failed to get SEO keywords' },
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
    const {
      keyword,
      searchVolume,
      difficulty,
      cpc,
      position,
      url,
      siteId,
    } = body;

    if (!keyword || !siteId) {
      return NextResponse.json(
        { error: 'Keyword and siteId are required' },
        { status: 400 }
      );
    }

    const seoKeyword = await seoToolsService.createSEOKeyword({
      keyword,
      searchVolume: searchVolume || 0,
      difficulty: difficulty || 0,
      cpc: cpc ? parseFloat(cpc) : undefined,
      position: position ? parseInt(position) : undefined,
      url,
      siteId,
    });

    return NextResponse.json({ keyword: seoKeyword }, { status: 201 });
  } catch (error) {
    console.error('Failed to create SEO keyword:', error);
    return NextResponse.json(
      { error: 'Failed to create SEO keyword' },
      { status: 500 }
    );
  }
} 