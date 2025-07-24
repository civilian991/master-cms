import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { campaignManagementService } from '@/lib/services/campaign-management';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendations = await campaignManagementService.getOptimizationRecommendations(
      params.id
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Failed to get optimization recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get optimization recommendations' },
      { status: 500 }
    );
  }
} 