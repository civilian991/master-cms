import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAnalyticsService } from '@/lib/services/marketing-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const format = searchParams.get('format') as 'csv' | 'json' || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
    } : undefined;

    const exportData = await marketingAnalyticsService.exportMarketingAnalytics(siteId, format, dateRange);

    if (format === 'csv') {
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="marketing-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json({ data: exportData });
    }
  } catch (error) {
    console.error('Failed to export marketing analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export marketing analytics' },
      { status: 500 }
    );
  }
} 