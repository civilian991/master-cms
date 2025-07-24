import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { encryptionService } from '@/lib/encryption/encryption-service';
import { z } from 'zod';

const keyRotationSchema = z.object({
  keyId: z.string(),
  force: z.boolean().default(false),
  backupOldKey: z.boolean().default(true),
});

const keyManagementSchema = z.object({
  action: z.enum(['rotate', 'backup', 'retire', 'activate']),
  keyId: z.string(),
  options: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has key management permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'rotate') {
      // Validate rotation request
      const validatedData = keyRotationSchema.parse(body);

      // Rotate encryption key
      const result = await encryptionService.rotateEncryptionKey(
        validatedData.keyId,
        session.user.siteId,
        validatedData.force,
        validatedData.backupOldKey
      );

      return NextResponse.json({
        success: true,
        rotation: result,
        message: `Key rotated successfully from ${result.oldKeyId} to ${result.newKeyId}`,
      });

    } else if (action === 'auto-rotate') {
      // Process automatic rotations
      const result = await encryptionService.processAutomaticRotations(session.user.siteId);

      return NextResponse.json({
        success: true,
        rotatedKeys: result.rotatedKeys,
        errors: result.errors,
        message: `Processed ${result.rotatedKeys.length} automatic rotations`,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "rotate" or "auto-rotate"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Key management API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Key management operation failed' },
      { status: 500 }
    );
  }
}

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

    // Check if user has key viewing permissions
    if (!session.user.permissions?.includes('view_security_logs')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'metrics';
    const days = parseInt(url.searchParams.get('days') || '30');

    if (action === 'metrics') {
      // Get key metrics
      const metrics = await encryptionService.getEncryptionMetrics(session.user.siteId, days);

      return NextResponse.json({
        success: true,
        metrics,
      });

    } else if (action === 'rotation-schedule') {
      // Get rotation schedule
      const metrics = await encryptionService.getEncryptionMetrics(session.user.siteId, days);

      return NextResponse.json({
        success: true,
        rotationSchedule: metrics.rotationSchedule,
        keysNeedingRotation: metrics.keysNeedingRotation,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "metrics" or "rotation-schedule"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Key management GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get key information' },
      { status: 500 }
    );
  }
} 