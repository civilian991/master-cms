import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { leadGenerationService } from '@/lib/services/lead-generation';

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

    const workflows = await leadGenerationService.getNurturingWorkflows(siteId);
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Failed to get nurturing workflows:', error);
    return NextResponse.json(
      { error: 'Failed to get nurturing workflows' },
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
    const { name, description, triggers, actions, isActive, siteId } = body;

    if (!name || !siteId || !triggers || !actions) {
      return NextResponse.json(
        { error: 'Name, siteId, triggers, and actions are required' },
        { status: 400 }
      );
    }

    const workflow = await leadGenerationService.createNurturingWorkflow({
      name,
      description,
      triggers,
      actions,
      isActive: isActive !== false,
      siteId,
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('Failed to create nurturing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create nurturing workflow' },
      { status: 500 }
    );
  }
} 