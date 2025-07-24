import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAutomationService } from '@/lib/services/marketing-automation';
import { MarketingAutomationStatus } from '@/generated/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await marketingAutomationService.getAutomationWorkflow(params.id);

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Failed to get automation workflow:', error);
    return NextResponse.json(
      { error: 'Failed to get automation workflow' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const workflow = await marketingAutomationService.updateAutomationStatus(params.id, status);

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Failed to update automation workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update automation workflow' },
      { status: 500 }
    );
  }
} 