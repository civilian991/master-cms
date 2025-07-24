import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { communityAnalyticsService } from '@/lib/services/community-analytics';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('export_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { siteId, options } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const exportOptions = {
      metrics: options?.metrics || ['all'],
      timeRange: options?.timeRange || '30d',
      format: options?.format || 'json',
      includeUserData: options?.includeUserData ?? true,
      includeCommunityData: options?.includeCommunityData ?? true,
    };

    const exportData = await communityAnalyticsService.exportAnalyticsData(siteId, exportOptions);

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', exportOptions.format === 'json' ? 'application/json' : 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    return new NextResponse(
      exportOptions.format === 'json' 
        ? JSON.stringify(exportData.data, null, 2)
        : exportData.data,
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
} 