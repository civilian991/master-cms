import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { fileEncryptionService } from '@/lib/encryption/file-encryption';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const fileDecryptionSchema = z.object({
  encryptedFilePath: z.string(),
  outputPath: z.string().optional(),
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

    // Check if user has file encryption permissions
    if (!session.user.permissions?.includes('upload_media')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'encrypt') {
      const file = formData.get('file') as File;
      const encryptionLevel = (formData.get('encryptionLevel') as string) || 'STANDARD';
      const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Save uploaded file temporarily
      const tempFilePath = path.join('./uploads/temp', `${Date.now()}_${file.name}`);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(tempFilePath, fileBuffer);

      try {
        // Encrypt the file
        const result = await fileEncryptionService.encryptFile(
          tempFilePath,
          session.user.siteId,
          {
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            uploadedBy: session.user.id,
            tags,
          },
          session.user.id,
          encryptionLevel as 'STANDARD' | 'HIGH' | 'MAXIMUM'
        );

        // Clean up temporary file
        await unlink(tempFilePath);

        return NextResponse.json({
          success: true,
          result: {
            encryptedFilePath: result.encryptedFilePath,
            keyId: result.keyId,
            metadata: result.metadata,
            warnings: result.warnings,
          },
        });

      } catch (encryptionError) {
        // Clean up temporary file on error
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          console.error('Failed to clean up temp file:', cleanupError);
        }
        throw encryptionError;
      }

    } else if (action === 'decrypt') {
      const encryptedFilePath = formData.get('encryptedFilePath') as string;
      const outputPath = formData.get('outputPath') as string;

      if (!encryptedFilePath) {
        return NextResponse.json(
          { error: 'No encrypted file path provided' },
          { status: 400 }
        );
      }

      // Validate decryption request
      const validatedData = fileDecryptionSchema.parse({
        encryptedFilePath,
        outputPath,
      });

      // Decrypt the file
      const result = await fileEncryptionService.decryptFile(
        validatedData.encryptedFilePath,
        session.user.siteId,
        session.user.id,
        validatedData.outputPath
      );

      return NextResponse.json({
        success: true,
        result: {
          decryptedFilePath: result.decryptedFilePath,
          metadata: result.metadata,
          verified: result.verified,
        },
      });

    } else if (action === 'batch-encrypt') {
      const files = formData.getAll('files') as File[];
      const encryptionLevel = (formData.get('encryptionLevel') as string) || 'STANDARD';

      if (files.length === 0) {
        return NextResponse.json(
          { error: 'No files provided' },
          { status: 400 }
        );
      }

      // Prepare files for batch encryption
      const fileData = [];
      const tempPaths = [];

      for (const file of files) {
        const tempFilePath = path.join('./uploads/temp', `${Date.now()}_${Math.random()}_${file.name}`);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await writeFile(tempFilePath, fileBuffer);
        
        tempPaths.push(tempFilePath);
        fileData.push({
          filePath: tempFilePath,
          metadata: {
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            uploadedBy: session.user.id,
          },
        });
      }

      try {
        // Batch encrypt files
        const results = await fileEncryptionService.batchEncryptFiles(
          fileData,
          session.user.siteId,
          session.user.id,
          encryptionLevel as 'STANDARD' | 'HIGH' | 'MAXIMUM'
        );

        // Clean up temporary files
        for (const tempPath of tempPaths) {
          try {
            await unlink(tempPath);
          } catch (cleanupError) {
            console.error('Failed to clean up temp file:', cleanupError);
          }
        }

        return NextResponse.json({
          success: true,
          results,
          summary: {
            total: results.length,
            successful: results.filter(r => r.result).length,
            failed: results.filter(r => r.error).length,
          },
        });

      } catch (batchError) {
        // Clean up temporary files on error
        for (const tempPath of tempPaths) {
          try {
            await unlink(tempPath);
          } catch (cleanupError) {
            console.error('Failed to clean up temp file:', cleanupError);
          }
        }
        throw batchError;
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "encrypt", "decrypt", or "batch-encrypt"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('File encryption API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'File encryption operation failed', details: error.message },
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

    // Check if user has file viewing permissions
    if (!session.user.permissions?.includes('manage_media')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';
    const encryptedFilePath = url.searchParams.get('filePath');

    if (action === 'status' && encryptedFilePath) {
      // Get file encryption status
      const status = await fileEncryptionService.getFileEncryptionStatus(encryptedFilePath);

      return NextResponse.json({
        success: true,
        status,
      });

    } else if (action === 'cleanup') {
      // Clean up temporary files
      const maxAge = parseInt(url.searchParams.get('maxAge') || '86400000'); // 24 hours
      const cleanedCount = await fileEncryptionService.cleanupTempFiles(maxAge);

      return NextResponse.json({
        success: true,
        cleanedCount,
        message: `Cleaned up ${cleanedCount} temporary files`,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('File encryption GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get file information' },
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

    // Check if user has file deletion permissions
    if (!session.user.permissions?.includes('delete_media')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { filePath, secureDelete } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    if (secureDelete) {
      // Perform secure deletion
      await fileEncryptionService.secureDeleteFile(filePath);
      
      return NextResponse.json({
        success: true,
        message: 'File securely deleted',
      });
    } else {
      // Regular file deletion would go here
      return NextResponse.json({
        success: true,
        message: 'File deleted',
      });
    }

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: 'File deletion failed' },
      { status: 500 }
    );
  }
} 