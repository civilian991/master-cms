import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { leadGenerationService } from '@/lib/services/lead-generation';
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

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        assignedUser: {
          select: { firstName: true, lastName: true, email: true },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
        campaigns: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Failed to get lead:', error);
    return NextResponse.json(
      { error: 'Failed to get lead' },
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
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      website,
      industry,
      companySize,
      budget,
      timeline,
      assignedTo,
    } = body;

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        jobTitle,
        website,
        industry,
        companySize,
        budget,
        timeline,
        assignedTo,
      },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Failed to update lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
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

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete related data
    await prisma.interaction.deleteMany({
      where: { leadId: params.id },
    });

    await prisma.task.deleteMany({
      where: { leadId: params.id },
    });

    await prisma.campaignLead.deleteMany({
      where: { leadId: params.id },
    });

    await prisma.marketingLeadActivity.deleteMany({
      where: { leadId: params.id },
    });

    // Delete the lead
    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
} 