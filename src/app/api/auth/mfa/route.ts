import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MFAService } from '@/lib/auth/mfa';
import { EmailService } from '@/lib/auth/email';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const mfaService = MFAService.getInstance();
const emailService = EmailService.getInstance();

// Validation schemas
const setupMFASchema = z.object({
  userId: z.number().int().positive(),
});

const verifyMFASchema = z.object({
  userId: z.number().int().positive(),
  token: z.string().min(6).max(6),
});

const enableMFASchema = z.object({
  userId: z.number().int().positive(),
  token: z.string().min(6).max(6),
  backupCodes: z.array(z.string()).length(10),
});

const disableMFASchema = z.object({
  userId: z.number().int().positive(),
  password: z.string().min(1),
});

// GET /api/auth/mfa - Get MFA status
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const targetUserId = parseInt(userId);
      
      // Check if user has permission to view other users' MFA status
      if (!user.permissions.includes('user:read')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const mfaStatus = await mfaService.getMFAStatus(targetUserId);
      return NextResponse.json(mfaStatus);
    } else {
      // Get current user's MFA status
      const mfaStatus = await mfaService.getMFAStatus(user.id as number);
      return NextResponse.json(mfaStatus);
    }
  } catch (error) {
    console.error('Error getting MFA status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/auth/mfa - Setup MFA
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = setupMFASchema.parse(body);

    // Check if user has permission to modify MFA settings
    if (validatedData.userId !== user.id && !user.permissions.includes('user:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if MFA is already enabled
    const currentStatus = await mfaService.getMFAStatus(validatedData.userId);
    if (currentStatus.enabled) {
      return NextResponse.json({
        error: 'MFA is already enabled for this user',
      }, { status: 400 });
    }

    // Generate MFA secret and QR code
    const mfaSetup = await mfaService.enableMFA(validatedData.userId);

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'MFA_SETUP_INITIATED',
        userId: user.id as number,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          targetUserId: validatedData.userId,
        },
      },
    });

    return NextResponse.json({
      message: 'MFA setup initiated',
      secret: mfaSetup.secret,
      qrCode: mfaSetup.qrCode,
      backupCodes: mfaSetup.backupCodes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Error setting up MFA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/mfa - Enable MFA
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = enableMFASchema.parse(body);

    // Check if user has permission to modify MFA settings
    if (validatedData.userId !== user.id && !user.permissions.includes('user:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the token and enable MFA
    const success = await mfaService.verifyMFAToken(validatedData.userId, validatedData.token);
    
    if (!success) {
      return NextResponse.json({
        error: 'Invalid MFA token',
      }, { status: 400 });
    }

    // Enable MFA with backup codes
    await mfaService.enableMFA(validatedData.userId, validatedData.backupCodes);

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'MFA_ENABLED',
        userId: user.id as number,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          targetUserId: validatedData.userId,
        },
      },
    });

    // Send MFA enabled notification
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (targetUser) {
      await emailService.sendMFAEnabledNotification(targetUser.email, targetUser.name || '');
    }

    return NextResponse.json({
      message: 'MFA has been enabled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Error enabling MFA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/mfa - Disable MFA
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = disableMFASchema.parse(body);

    // Check if user has permission to modify MFA settings
    if (validatedData.userId !== user.id && !user.permissions.includes('user:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify password before disabling MFA
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordService = (await import('@/lib/auth/password')).PasswordService.getInstance();
    const isPasswordValid = await passwordService.verifyPassword(validatedData.password, targetUser.password);

    if (!isPasswordValid) {
      return NextResponse.json({
        error: 'Invalid password',
      }, { status: 400 });
    }

    // Disable MFA
    await mfaService.disableMFA(validatedData.userId);

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'MFA_DISABLED',
        userId: user.id as number,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          targetUserId: validatedData.userId,
        },
      },
    });

    // Send MFA disabled notification
    await emailService.sendMFADisabledNotification(targetUser.email, targetUser.name || '');

    return NextResponse.json({
      message: 'MFA has been disabled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Error disabling MFA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 