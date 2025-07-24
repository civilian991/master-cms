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

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const automations = await campaignManagementService.getCampaignAutomations(siteId);

    return NextResponse.json({ automations });
  } catch (error) {
    console.error('Failed to get campaign automations:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign automations' },
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
    const { name, description, type, triggers, actions, conditions, isActive, siteId } = body;

    if (!name || !type || !triggers || !actions || !siteId) {
      return NextResponse.json(
        { error: 'Name, type, triggers, actions, and siteId are required' },
        { status: 400 }
      );
    }

    const automation = await campaignManagementService.createCampaignAutomation({
      name,
      description,
      type,
      triggers,
      actions,
      conditions,
      isActive,
      siteId,
      createdBy: session.user.email || 'unknown',
    });

    return NextResponse.json({ automation }, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign automation:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign automation' },
      { status: 500 }
    );
  }
} 