import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { abTestingService } from '@/lib/services/ab-testing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, ...workflowData } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'SiteId is required' },
        { status: 400 }
      );
    }

    const workflow = await abTestingService.createABTestWorkflow({
      ...workflowData,
      siteId,
      createdBy: session.user.email || 'unknown',
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Failed to create A/B test workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test workflow' },
      { status: 500 }
    );
  }
} 