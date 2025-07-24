import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { campaignManagementService } from '@/lib/services/campaign-management';

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
    const { newName } = body;

    if (!newName) {
      return NextResponse.json(
        { error: 'New name is required' },
        { status: 400 }
      );
    }

    const campaign = await campaignManagementService.duplicateCampaign(
      params.id,
      newName,
      session.user.email || 'unknown'
    );

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Failed to duplicate campaign:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate campaign' },
      { status: 500 }
    );
  }
} 