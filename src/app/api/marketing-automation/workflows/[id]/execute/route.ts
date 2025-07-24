import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAutomationService } from '@/lib/services/marketing-automation';

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
    const { trigger, input } = body;

    if (!trigger) {
      return NextResponse.json(
        { error: 'Trigger is required' },
        { status: 400 }
      );
    }

    const result = await marketingAutomationService.executeAutomationWorkflow(
      params.id,
      trigger,
      input
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to execute automation workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute automation workflow' },
      { status: 500 }
    );
  }
} 