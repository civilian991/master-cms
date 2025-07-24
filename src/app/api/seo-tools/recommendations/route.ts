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

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const recommendations = await seoToolsService.generateSEORecommendations(siteId);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Failed to get SEO recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get SEO recommendations' },
      { status: 500 }
    );
  }
} 