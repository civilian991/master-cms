import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { leadGenerationService } from '@/lib/services/lead-generation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, csvData, options } = body;

    if (!siteId || !csvData) {
      return NextResponse.json(
        { error: 'Site ID and CSV data are required' },
        { status: 400 }
      );
    }

    const result = await leadGenerationService.importLeads(siteId, csvData, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to import leads:', error);
    return NextResponse.json(
      { error: 'Failed to import leads' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const source = searchParams.get('source');
    const format = searchParams.get('format') as 'csv' | 'json' || 'csv';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const result = await leadGenerationService.exportLeads(siteId, {
      status: status as any,
      assignedTo: assignedTo || undefined,
      source: source || undefined,
      format,
    });

    if (format === 'csv') {
      return new NextResponse(result.data, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="leads.csv"',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to export leads:', error);
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    );
  }
} 