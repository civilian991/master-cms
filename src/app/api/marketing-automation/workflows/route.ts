import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAutomationService } from '@/lib/services/marketing-automation';
import { MarketingAutomationStatus } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status') as MarketingAutomationStatus;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const workflows = await marketingAutomationService.getAutomationWorkflows(siteId, status);

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Failed to get automation workflows:', error);
    return NextResponse.json(
      { error: 'Failed to get automation workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, workflow } = body;

    if (!siteId || !workflow) {
      return NextResponse.json(
        { error: 'SiteId and workflow are required' },
        { status: 400 }
      );
    }

    const result = await marketingAutomationService.createAutomationWorkflow(
      siteId,
      workflow,
      session.user.email || 'unknown'
    );

    return NextResponse.json({ workflow: result });
  } catch (error) {
    console.error('Failed to create automation workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create automation workflow' },
      { status: 500 }
    );
  }
} 