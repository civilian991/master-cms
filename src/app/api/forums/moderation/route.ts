import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { forumsService, ForumModerationSchema } from '@/lib/services/forums';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('moderate_forums')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ForumModerationSchema.parse({
      ...body,
      moderatorId: session.user.id
    });

    const success = await forumsService.moderateContent(validatedData);

    if (success) {
      return NextResponse.json({ 
        message: 'Moderation action completed successfully',
        action: validatedData.action,
        targetType: validatedData.targetType,
        targetId: validatedData.targetId
      });
    } else {
      return NextResponse.json({ error: 'Failed to complete moderation action' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error moderating content:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to moderate content' },
      { status: 500 }
    );
  }
} 