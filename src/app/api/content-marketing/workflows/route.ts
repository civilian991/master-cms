import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { contentMarketingService } from '@/lib/services/content-marketing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      triggers,
      actions,
      isActive,
      siteId,
    } = body;

    if (!name || !triggers || !actions || !siteId) {
      return NextResponse.json(
        { error: 'Name, triggers, actions, and siteId are required' },
        { status: 400 }
      );
    }

    const workflow = await contentMarketingService.createContentMarketingWorkflow({
      name,
      description,
      triggers,
      actions,
      isActive: isActive !== false,
      siteId,
      createdBy: session.user.email || 'unknown',
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('Failed to create content marketing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create content marketing workflow' },
      { status: 500 }
    );
  }
} 