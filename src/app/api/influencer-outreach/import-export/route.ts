import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { influencerOutreachService } from '@/lib/services/influencer-outreach';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const format = searchParams.get('format') as 'csv' | 'json' || 'csv';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const exportData = await influencerOutreachService.exportInfluencers(siteId, format);

    if (format === 'csv') {
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="influencers.csv"',
        },
      });
    }

    return NextResponse.json({ data: exportData });
  } catch (error) {
    console.error('Failed to export influencers:', error);
    return NextResponse.json(
      { error: 'Failed to export influencers' },
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
    const { influencers } = body;

    if (!influencers || !Array.isArray(influencers)) {
      return NextResponse.json(
        { error: 'Influencers array is required' },
        { status: 400 }
      );
    }

    const result = await influencerOutreachService.bulkImportInfluencers(influencers);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to import influencers:', error);
    return NextResponse.json(
      { error: 'Failed to import influencers' },
      { status: 500 }
    );
  }
} 