import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { encryptionService } from '@/lib/encryption/encryption-service';
import { z } from 'zod';

const encryptDataSchema = z.object({
  data: z.string().min(1),
  keyPurpose: z.enum(['USER_DATA', 'SYSTEM_CONFIG', 'PAYMENT_INFO', 'PERSONAL_INFO', 'FILE_STORAGE']),
  metadata: z.record(z.any()).optional(),
});

const decryptDataSchema = z.object({
  encryptedData: z.string(),
  keyId: z.string(),
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

    // Check if user has encryption permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'encrypt') {
      // Validate encryption request
      const validatedData = encryptDataSchema.parse(body);

      // Encrypt data
      const result = await encryptionService.encryptData(
        validatedData.data,
        validatedData.keyPurpose,
        session.user.siteId,
        session.user.id,
        validatedData.metadata
      );

      return NextResponse.json({
        success: true,
        result: {
          encryptedData: result.encryptedData,
          keyId: result.keyId,
          algorithm: result.algorithm,
          metadata: result.metadata,
        },
      });

    } else if (action === 'decrypt') {
      // Validate decryption request
      const validatedData = decryptDataSchema.parse(body);

      // Decrypt data
      const result = await encryptionService.decryptData(
        validatedData.encryptedData,
        validatedData.keyId,
        session.user.siteId,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        result: {
          decryptedData: result.decryptedData,
          keyId: result.keyId,
          metadata: result.metadata,
        },
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "encrypt" or "decrypt"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Encryption API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Encryption operation failed' },
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

    // Check if user has encryption permissions
    if (!session.user.permissions?.includes('view_security_logs')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    // Get encryption metrics
    const metrics = await encryptionService.getEncryptionMetrics(session.user.siteId, days);

    return NextResponse.json({
      success: true,
      metrics,
    });

  } catch (error) {
    console.error('Encryption metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to get encryption metrics' },
      { status: 500 }
    );
  }
} 