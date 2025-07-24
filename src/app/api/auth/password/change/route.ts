import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { passwordPolicyService } from '@/lib/auth/password-policy';
import { passwordChangeSchema } from '@/lib/auth/password-policy';
import { z } from 'zod';

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

    const body = await request.json();
    
    // Validate request data
    const validatedData = passwordChangeSchema.parse({
      userId: session.user.id,
      siteId: session.user.siteId,
      ...body,
    });

    // Change password
    const result = await passwordPolicyService.changePassword(
      validatedData.userId,
      validatedData.currentPassword,
      validatedData.newPassword,
      validatedData.confirmPassword,
      validatedData.siteId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully',
        requiresMFA: result.requiresMFA,
      });
    } else {
      return NextResponse.json({
        success: false,
        errors: result.errors,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Password change error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Password change failed' },
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

    // Check password expiry
    const expiryInfo = await passwordPolicyService.checkPasswordExpiry(session.user.id);

    return NextResponse.json({
      success: true,
      expiry: expiryInfo,
    });

  } catch (error) {
    console.error('Password expiry check error:', error);
    return NextResponse.json(
      { error: 'Failed to check password expiry' },
      { status: 500 }
    );
  }
} 