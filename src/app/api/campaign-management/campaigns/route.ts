import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { campaignManagementService } from '@/lib/services/campaign-management';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const createdBy = searchParams.get('createdBy');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const campaigns = await campaignManagementService.getCampaigns(siteId, {
      status: status as any,
      type: type as any,
      createdBy: createdBy || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Failed to get campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to get campaigns' },
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
      name,
      description,
      type,
      startDate,
      endDate,
      budget,
      targetAudience,
      channels,
      goals,
      siteId,
    } = body;

    if (!name || !type || !siteId || !channels) {
      return NextResponse.json(
        { error: 'Name, type, siteId, and channels are required' },
        { status: 400 }
      );
    }

    const campaign = await campaignManagementService.createCampaign({
      name,
      description,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      targetAudience,
      channels,
      goals,
      siteId,
      createdBy: session.user.email || 'unknown',
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
} 