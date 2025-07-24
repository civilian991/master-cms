import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { emailMarketingService } from '@/lib/services/email-marketing';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
      include: {
        campaign: true,
        recipients: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Failed to get email campaign:', error);
    return NextResponse.json(
      { error: 'Failed to get email campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      scheduledAt,
      recipientList,
      metadata,
    } = body;

    const campaign = await prisma.emailCampaign.update({
      where: { id: params.id },
      data: {
        name,
        subject,
        content,
        template,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        metadata,
      },
    });

    // Add new recipients if provided
    if (recipientList && recipientList.length > 0) {
      await emailMarketingService.addRecipients(
        params.id,
        recipientList,
        campaign.siteId
      );
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Failed to update email campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update email campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Delete campaign and all recipients
    await prisma.emailCampaignRecipient.deleteMany({
      where: { campaignId: params.id },
    });

    await prisma.emailCampaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete email campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete email campaign' },
      { status: 500 }
    );
  }
} 