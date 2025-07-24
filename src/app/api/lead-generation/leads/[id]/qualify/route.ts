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
    const { isQualified, qualificationScore, qualificationNotes, assignedTo } = body;

    if (typeof isQualified !== 'boolean') {
      return NextResponse.json(
        { error: 'isQualified is required and must be a boolean' },
        { status: 400 }
      );
    }

    const result = await leadGenerationService.qualifyLead(params.id, {
      isQualified,
      qualificationScore,
      qualificationNotes,
      assignedTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to qualify lead:', error);
    return NextResponse.json(
      { error: 'Failed to qualify lead' },
      { status: 500 }
    );
  }
} 