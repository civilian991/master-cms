import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { emailMarketingService } from '@/lib/services/email-marketing';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const workflows = await emailMarketingService.getWorkflows(siteId);
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Failed to get email workflows:', error);
    return NextResponse.json(
      { error: 'Failed to get email workflows' },
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
    const { name, description, trigger, conditions, actions, isActive, siteId } = body;

    if (!name || !siteId || !trigger || !actions) {
      return NextResponse.json(
        { error: 'Name, siteId, trigger, and actions are required' },
        { status: 400 }
      );
    }

    const workflow = await emailMarketingService.createWorkflow({
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions,
      isActive: isActive !== false,
      siteId,
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('Failed to create email workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create email workflow' },
      { status: 500 }
    );
  }
} 