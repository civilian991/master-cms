import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { influencerOutreachService } from '@/lib/services/influencer-outreach';

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
    const { influencerId } = body;

    if (!influencerId) {
      return NextResponse.json(
        { error: 'Influencer ID is required' },
        { status: 400 }
      );
    }

    const result = await influencerOutreachService.executeOutreachWorkflow(
      params.id,
      influencerId
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to execute outreach workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute outreach workflow' },
      { status: 500 }
    );
  }
} 