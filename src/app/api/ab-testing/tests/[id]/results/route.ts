import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { abTestingService } from '@/lib/services/ab-testing';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await abTestingService.calculateABTestResults(params.id);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Failed to get A/B test results:', error);
    return NextResponse.json(
      { error: 'Failed to get A/B test results' },
      { status: 500 }
    );
  }
} 