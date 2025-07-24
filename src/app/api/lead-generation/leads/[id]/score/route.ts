import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { leadGenerationService } from '@/lib/services/lead-generation';

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
    const { scoreChange, reason } = body;

    if (typeof scoreChange !== 'number') {
      return NextResponse.json(
        { error: 'Score change is required and must be a number' },
        { status: 400 }
      );
    }

    const result = await leadGenerationService.updateLeadScore(
      params.id,
      scoreChange,
      reason
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update lead score:', error);
    return NextResponse.json(
      { error: 'Failed to update lead score' },
      { status: 500 }
    );
  }
} 