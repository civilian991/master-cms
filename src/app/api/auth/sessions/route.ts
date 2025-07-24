import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { sessionManager } from '@/lib/auth/session-manager';
import { z } from 'zod';

const terminateSessionSchema = z.object({
  sessionId: z.string(),
  reason: z.string().optional().default('user_request'),
});

const terminateAllSessionsSchema = z.object({
  reason: z.string().optional().default('user_request'),
  excludeCurrent: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's active sessions
    const sessions = await sessionManager.getUserSessions(
      session.user.id,
      session.user.siteId
    );

    return NextResponse.json({
      success: true,
      sessions,
    });

  } catch (error) {
    console.error('Session list error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'terminate-all') {
      // Terminate all sessions
      const body = await request.json();
      const validatedData = terminateAllSessionsSchema.parse(body);

      const currentSessionId = url.searchParams.get('current_session');
      const excludeSessionId = validatedData.excludeCurrent ? currentSessionId : undefined;

      const terminatedCount = await sessionManager.terminateAllUserSessions(
        session.user.id,
        session.user.siteId,
        validatedData.reason,
        excludeSessionId || undefined,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        message: `Terminated ${terminatedCount} sessions`,
        terminatedCount,
      });

    } else {
      // Terminate specific session
      const body = await request.json();
      const validatedData = terminateSessionSchema.parse(body);

      const success = await sessionManager.terminateSession(
        validatedData.sessionId,
        validatedData.reason,
        session.user.id
      );

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Session terminated successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Session not found or already terminated',
        }, { status: 404 });
      }
    }

  } catch (error) {
    console.error('Session termination error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Session termination failed' },
      { status: 500 }
    );
  }
} 