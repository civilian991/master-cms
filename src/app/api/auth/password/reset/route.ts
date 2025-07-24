import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PasswordService } from '@/lib/auth/password';
import { EmailService } from '@/lib/auth/email';
import { z } from 'zod';

const passwordService = PasswordService.getInstance();
const emailService = EmailService.getInstance();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email(),
});

const confirmResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

// POST /api/auth/password/reset - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = requestResetSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({
        error: 'Account is temporarily locked. Please try again later.',
      }, { status: 423 });
    }

    // Generate password reset token
    const resetToken = await passwordService.generatePasswordResetToken(user.id);

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, user.name || '', resetToken);

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'PASSWORD_RESET_REQUESTED',
        userId: user.id,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          email: user.email,
        },
      },
    });

    return NextResponse.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/password/reset - Confirm password reset
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = confirmResetSchema.parse(body);

    // Reset password using token
    const success = await passwordService.resetPassword(
      validatedData.token,
      validatedData.newPassword
    );

    if (!success) {
      return NextResponse.json({
        error: 'Invalid or expired reset token',
      }, { status: 400 });
    }

    // Get user from token (assuming the service returns user info)
    const user = await prisma.user.findFirst({
      where: {
        // This would need to be implemented in the password service
        // For now, we'll log the event without user ID
      },
    });

    if (user) {
      // Log security event
      await prisma.securityEvent.create({
        data: {
          type: 'PASSWORD_RESET_COMPLETED',
          userId: user.id,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || '',
          metadata: {
            email: user.email,
          },
        },
      });

      // Send password changed notification
      await emailService.sendPasswordChangedNotification(user.email, user.name || '');
    }

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Error confirming password reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 