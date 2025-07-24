import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { emailMarketingService } from '@/lib/services/email-marketing';

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

    const campaigns = await emailMarketingService.getCampaigns(siteId, {
      status: status as any,
      limit,
      offset,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Failed to get email campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to get email campaigns' },
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
      subject,
      content,
      template,
      siteId,
      campaignId,
      scheduledAt,
      recipientList,
      segmentId,
      metadata,
    } = body;

    if (!name || !subject || !content || !siteId) {
      return NextResponse.json(
        { error: 'Name, subject, content, and siteId are required' },
        { status: 400 }
      );
    }

    const campaign = await emailMarketingService.createCampaign(
      {
        name,
        subject,
        content,
        template,
        siteId,
        campaignId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        recipientList,
        segmentId,
        metadata,
      },
      session.user.email || 'unknown'
    );

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Failed to create email campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create email campaign' },
      { status: 500 }
    );
  }
} 