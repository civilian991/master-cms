import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { campaignManagementService } from '@/lib/services/campaign-management';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
    } : undefined;

    const performance = await campaignManagementService.getCampaignPerformance(
      params.id,
      dateRange
    );

    return NextResponse.json({ performance });
  } catch (error) {
    console.error('Failed to get campaign performance:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign performance' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, value, metadata } = body;

    if (!type || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      );
    }

    const result = await campaignManagementService.trackCampaignEvent(
      params.id,
      { type, value, metadata }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to track campaign event:', error);
    return NextResponse.json(
      { error: 'Failed to track campaign event' },
      { status: 500 }
    );
  }
} 