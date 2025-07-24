import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { mfaService } from '@/lib/auth/mfa';
import { mfaVerificationSchema } from '@/lib/auth/mfa';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For MFA verification, we might not have a full session yet
    // So we'll get user info from the request body
    const validatedData = mfaVerificationSchema.parse(body);

    // Get device info from headers
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    const deviceInfo = {
      ...validatedData.deviceInfo,
      userAgent,
      ipAddress,
      timestamp: new Date().toISOString(),
    };

    // Verify MFA token
    const result = await mfaService.verifyMFA(
      validatedData.userId,
      validatedData.siteId,
      validatedData.method,
      validatedData.token,
      deviceInfo
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        verified: true,
        trustedDevice: result.trustedDevice,
        message: 'MFA verification successful',
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        requiresBackup: result.requiresBackup,
        message: 'MFA verification failed',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('MFA verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message.includes('rate limit') || error.message.includes('locked')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'MFA verification failed' },
      { status: 500 }
    );
  }
} 