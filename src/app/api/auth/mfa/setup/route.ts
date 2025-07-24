import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { mfaService } from '@/lib/auth/mfa';
import { mfaSetupSchema } from '@/lib/auth/mfa';
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
    const validatedData = mfaSetupSchema.parse({
      userId: session.user.id,
      siteId: session.user.siteId,
      ...body,
    });

    let result;

    switch (validatedData.method) {
      case 'TOTP':
        result = await mfaService.setupTOTP(
          validatedData.userId,
          validatedData.siteId
        );
        break;

      case 'SMS':
        if (!validatedData.phoneNumber) {
          return NextResponse.json(
            { error: 'Phone number is required for SMS setup' },
            { status: 400 }
          );
        }
        result = await mfaService.setupSMS(
          validatedData.userId,
          validatedData.siteId,
          validatedData.phoneNumber
        );
        break;

      case 'BIOMETRIC':
        result = await mfaService.setupBiometric(
          validatedData.userId,
          validatedData.siteId,
          validatedData.deviceInfo || {}
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported MFA method' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      method: validatedData.method,
      data: result,
    });

  } catch (error) {
    console.error('MFA setup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'MFA setup failed' },
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

    // Get MFA status
    const status = await mfaService.getMFAStatus(session.user.id);

    return NextResponse.json({
      success: true,
      status,
    });

  } catch (error) {
    console.error('MFA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get MFA status' },
      { status: 500 }
    );
  }
} 