import crypto from 'crypto';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import path from 'path';
import { encryptionService } from './encryption-service';
import { z } from 'zod';

// File encryption configuration
const FILE_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  chunkSize: 64 * 1024, // 64KB chunks for streaming
  headerSize: 1024, // Size reserved for metadata header
  supportedMimeTypes: [
    'image/*',
    'application/pdf',
    'text/*',
    'application/json',
    'application/xml',
    'application/zip',
    'application/octet-stream',
  ],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  quarantineDir: './uploads/quarantine',
  encryptedDir: './uploads/encrypted',
  tempDir: './uploads/temp',
} as const;

// Validation schemas
export const fileEncryptionSchema = z.object({
  filePath: z.string(),
  siteId: z.string(),
  userId: z.string().optional(),
  metadata: z.object({
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    uploadedBy: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  encryptionLevel: z.enum(['STANDARD', 'HIGH', 'MAXIMUM']).default('STANDARD'),
});

export const fileDecryptionSchema = z.object({
  encryptedFilePath: z.string(),
  siteId: z.string(),
  userId: z.string().optional(),
  outputPath: z.string().optional(),
});

// File encryption interfaces
interface EncryptedFileMetadata {
  originalName: string;
  mimeType: string;
  originalSize: number;
  encryptedSize: number;
  keyId: string;
  algorithm: string;
  iv: string;
  authTag: string;
  checksum: string;
  encryptedAt: string;
  encryptionLevel: string;
  version: string;
  userMetadata: Record<string, any>;
}

interface FileEncryptionResult {
  encryptedFilePath: string;
  metadata: EncryptedFileMetadata;
  keyId: string;
  success: boolean;
  warnings: string[];
}

interface FileDecryptionResult {
  decryptedFilePath: string;
  metadata: EncryptedFileMetadata;
  success: boolean;
  verified: boolean;
}

// File Encryption Service
export class FileEncryptionService {

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Encrypt a file with streaming encryption
   */
  async encryptFile(
    inputFilePath: string,
    siteId: string,
    metadata: {
      originalName: string;
      mimeType: string;
      size: number;
      uploadedBy?: string;
      tags?: string[];
    },
    userId?: string,
    encryptionLevel: 'STANDARD' | 'HIGH' | 'MAXIMUM' = 'STANDARD'
  ): Promise<FileEncryptionResult> {
    try {
      // Validate input
      const validatedData = fileEncryptionSchema.parse({
        filePath: inputFilePath,
        siteId,
        userId,
        metadata,
        encryptionLevel,
      });

      const warnings: string[] = [];

      // Check file exists and size
      const fileStats = await fs.stat(inputFilePath);
      if (fileStats.size > FILE_ENCRYPTION_CONFIG.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${FILE_ENCRYPTION_CONFIG.maxFileSize} bytes`);
      }

      // Validate file type
      if (!this.isAllowedMimeType(metadata.mimeType)) {
        warnings.push(`MIME type ${metadata.mimeType} is not in allowed list`);
      }

      // Scan file for malware (placeholder - implement actual scanning)
      const scanResult = await this.scanFileForMalware(inputFilePath);
      if (!scanResult.clean) {
        throw new Error(`File failed security scan: ${scanResult.threats.join(', ')}`);
      }

      // Get encryption key
      const keyPurpose = this.getKeyPurposeForFile(metadata.mimeType, encryptionLevel);
      const encryptionKey = await this.getFileEncryptionKey(keyPurpose, siteId);

      // Generate encryption parameters
      const iv = crypto.randomBytes(16);
      const fileId = crypto.randomUUID();
      const encryptedFileName = `${fileId}.enc`;
      const encryptedFilePath = path.join(FILE_ENCRYPTION_CONFIG.encryptedDir, encryptedFileName);

      // Calculate file checksum
      const originalChecksum = await this.calculateFileChecksum(inputFilePath);

      // Create encryption metadata
      const encryptionMetadata: EncryptedFileMetadata = {
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        originalSize: fileStats.size,
        encryptedSize: 0, // Will be updated after encryption
        keyId: encryptionKey.keyId,
        algorithm: FILE_ENCRYPTION_CONFIG.algorithm,
        iv: iv.toString('base64'),
        authTag: '', // Will be set after encryption
        checksum: originalChecksum,
        encryptedAt: new Date().toISOString(),
        encryptionLevel,
        version: '1.0',
        userMetadata: {
          uploadedBy: metadata.uploadedBy,
          tags: metadata.tags || [],
        },
      };

      // Perform streaming encryption
      await this.streamEncryptFile(
        inputFilePath,
        encryptedFilePath,
        encryptionKey.keyData,
        iv,
        encryptionMetadata
      );

      // Update encrypted file size
      const encryptedStats = await fs.stat(encryptedFilePath);
      encryptionMetadata.encryptedSize = encryptedStats.size;

      // Log file encryption
      await this.logFileOperation('ENCRYPT', {
        fileId,
        originalName: metadata.originalName,
        originalSize: fileStats.size,
        encryptedSize: encryptedStats.size,
        keyId: encryptionKey.keyId,
        siteId,
        userId,
        encryptionLevel,
      });

      return {
        encryptedFilePath,
        metadata: encryptionMetadata,
        keyId: encryptionKey.keyId,
        success: true,
        warnings,
      };

    } catch (error) {
      await this.logFileOperation('ENCRYPT_FAILED', {
        error: error.message,
        filePath: inputFilePath,
        siteId,
        userId,
      });
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a file with streaming decryption
   */
  async decryptFile(
    encryptedFilePath: string,
    siteId: string,
    userId?: string,
    outputPath?: string
  ): Promise<FileDecryptionResult> {
    try {
      // Validate input
      const validatedData = fileDecryptionSchema.parse({
        encryptedFilePath,
        siteId,
        userId,
        outputPath,
      });

      // Read metadata from encrypted file
      const metadata = await this.readEncryptedFileMetadata(encryptedFilePath);

      // Get decryption key
      const decryptionKey = await this.getFileDecryptionKey(metadata.keyId, siteId);
      if (!decryptionKey) {
        throw new Error('Decryption key not found');
      }

      // Generate output path if not provided
      const finalOutputPath = outputPath || this.generateTempFilePath(metadata.originalName);

      // Perform streaming decryption
      await this.streamDecryptFile(
        encryptedFilePath,
        finalOutputPath,
        decryptionKey.keyData,
        metadata
      );

      // Verify file integrity
      const decryptedChecksum = await this.calculateFileChecksum(finalOutputPath);
      const verified = decryptedChecksum === metadata.checksum;

      if (!verified) {
        // Move to quarantine if verification fails
        const quarantinePath = path.join(
          FILE_ENCRYPTION_CONFIG.quarantineDir,
          `corrupted_${Date.now()}_${path.basename(finalOutputPath)}`
        );
        await fs.rename(finalOutputPath, quarantinePath);
        throw new Error('File integrity verification failed - file moved to quarantine');
      }

      // Log file decryption
      await this.logFileOperation('DECRYPT', {
        encryptedFilePath,
        decryptedPath: finalOutputPath,
        keyId: metadata.keyId,
        verified,
        siteId,
        userId,
      });

      return {
        decryptedFilePath: finalOutputPath,
        metadata,
        success: true,
        verified,
      };

    } catch (error) {
      await this.logFileOperation('DECRYPT_FAILED', {
        error: error.message,
        encryptedFilePath,
        siteId,
        userId,
      });
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  /**
   * Stream encrypt a file
   */
  private async streamEncryptFile(
    inputPath: string,
    outputPath: string,
    key: Buffer,
    iv: Buffer,
    metadata: EncryptedFileMetadata
  ): Promise<void> {
    const cipher = crypto.createCipher(FILE_ENCRYPTION_CONFIG.algorithm, key);
    cipher.setAAD(Buffer.from(JSON.stringify({
      keyId: metadata.keyId,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
    })));

    // Create transform stream for encryption
    const encryptTransform = new Transform({
      transform(chunk, encoding, callback) {
        try {
          const encrypted = cipher.update(chunk);
          callback(null, encrypted);
        } catch (error) {
          callback(error);
        }
      },
      flush(callback) {
        try {
          const final = cipher.final();
          // Get auth tag and store in metadata
          metadata.authTag = cipher.getAuthTag().toString('base64');
          callback(null, final);
        } catch (error) {
          callback(error);
        }
      },
    });

    // Create streams
    const readStream = createReadStream(inputPath);
    const writeStream = createWriteStream(outputPath);

    // Write metadata header first
    const headerBuffer = Buffer.alloc(FILE_ENCRYPTION_CONFIG.headerSize);
    const metadataJson = JSON.stringify(metadata);
    const metadataBuffer = Buffer.from(metadataJson, 'utf8');
    metadataBuffer.copy(headerBuffer, 0, 0, Math.min(metadataBuffer.length, headerBuffer.length - 4));
    headerBuffer.writeUInt32BE(metadataBuffer.length, headerBuffer.length - 4);
    
    writeStream.write(headerBuffer);

    // Perform streaming encryption
    await pipeline(readStream, encryptTransform, writeStream);
  }

  /**
   * Stream decrypt a file
   */
  private async streamDecryptFile(
    inputPath: string,
    outputPath: string,
    key: Buffer,
    metadata: EncryptedFileMetadata
  ): Promise<void> {
    const decipher = crypto.createDecipher(FILE_ENCRYPTION_CONFIG.algorithm, key);
    decipher.setAAD(Buffer.from(JSON.stringify({
      keyId: metadata.keyId,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
    })));
    decipher.setAuthTag(Buffer.from(metadata.authTag, 'base64'));

    // Create transform stream for decryption
    const decryptTransform = new Transform({
      transform(chunk, encoding, callback) {
        try {
          const decrypted = decipher.update(chunk);
          callback(null, decrypted);
        } catch (error) {
          callback(error);
        }
      },
      flush(callback) {
        try {
          const final = decipher.final();
          callback(null, final);
        } catch (error) {
          callback(error);
        }
      },
    });

    // Create read stream, skipping the metadata header
    const readStream = createReadStream(inputPath, {
      start: FILE_ENCRYPTION_CONFIG.headerSize,
    });
    const writeStream = createWriteStream(outputPath);

    // Perform streaming decryption
    await pipeline(readStream, decryptTransform, writeStream);
  }

  /**
   * Read metadata from encrypted file header
   */
  private async readEncryptedFileMetadata(encryptedFilePath: string): Promise<EncryptedFileMetadata> {
    const headerBuffer = Buffer.alloc(FILE_ENCRYPTION_CONFIG.headerSize);
    const file = await fs.open(encryptedFilePath, 'r');
    
    try {
      await file.read(headerBuffer, 0, FILE_ENCRYPTION_CONFIG.headerSize, 0);
      const metadataLength = headerBuffer.readUInt32BE(headerBuffer.length - 4);
      const metadataJson = headerBuffer.subarray(0, metadataLength).toString('utf8');
      return JSON.parse(metadataJson);
    } finally {
      await file.close();
    }
  }

  /**
   * Get or create file encryption key
   */
  private async getFileEncryptionKey(purpose: string, siteId: string) {
    // Use encryption service to get/create key for file storage
    const keyData = crypto.randomBytes(32); // For this implementation
    const keyId = `file_${purpose}_${Date.now()}`;
    
    // In real implementation, this would use the encryption service
    return {
      keyId,
      keyData,
      purpose,
    };
  }

  /**
   * Get file decryption key
   */
  private async getFileDecryptionKey(keyId: string, siteId: string) {
    // In real implementation, retrieve from encryption service
    // For now, return a mock key
    return {
      keyId,
      keyData: crypto.randomBytes(32),
    };
  }

  /**
   * Calculate file checksum
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    return hash.digest('hex');
  }

  /**
   * Scan file for malware (placeholder implementation)
   */
  private async scanFileForMalware(filePath: string): Promise<{
    clean: boolean;
    threats: string[];
    scanTime: number;
  }> {
    // Placeholder implementation
    // In production, integrate with actual antivirus/malware scanning service
    const startTime = Date.now();
    
    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check file size and extension for basic validation
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const threats: string[] = [];
    
    if (suspiciousExtensions.includes(ext)) {
      threats.push(`Suspicious file extension: ${ext}`);
    }
    
    if (stats.size === 0) {
      threats.push('Empty file');
    }
    
    return {
      clean: threats.length === 0,
      threats,
      scanTime: Date.now() - startTime,
    };
  }

  /**
   * Check if MIME type is allowed
   */
  private isAllowedMimeType(mimeType: string): boolean {
    return FILE_ENCRYPTION_CONFIG.supportedMimeTypes.some(allowed => {
      if (allowed.endsWith('*')) {
        return mimeType.startsWith(allowed.slice(0, -1));
      }
      return mimeType === allowed;
    });
  }

  /**
   * Get key purpose based on file type and encryption level
   */
  private getKeyPurposeForFile(mimeType: string, encryptionLevel: string): string {
    if (mimeType.startsWith('image/')) return 'FILE_STORAGE';
    if (mimeType === 'application/pdf') return 'FILE_STORAGE';
    if (mimeType.startsWith('text/')) return 'FILE_STORAGE';
    return 'FILE_STORAGE';
  }

  /**
   * Generate temporary file path
   */
  private generateTempFilePath(originalName: string): string {
    const tempId = crypto.randomUUID();
    const ext = path.extname(originalName);
    return path.join(FILE_ENCRYPTION_CONFIG.tempDir, `${tempId}${ext}`);
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      FILE_ENCRYPTION_CONFIG.quarantineDir,
      FILE_ENCRYPTION_CONFIG.encryptedDir,
      FILE_ENCRYPTION_CONFIG.tempDir,
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  /**
   * Log file operations
   */
  private async logFileOperation(operation: string, details: any): Promise<void> {
    try {
      // In real implementation, log to database
      console.log(`File ${operation}:`, details);
    } catch (error) {
      console.error('Failed to log file operation:', error);
    }
  }

  /**
   * Batch encrypt multiple files
   */
  async batchEncryptFiles(
    files: Array<{
      filePath: string;
      metadata: {
        originalName: string;
        mimeType: string;
        size: number;
        uploadedBy?: string;
        tags?: string[];
      };
    }>,
    siteId: string,
    userId?: string,
    encryptionLevel: 'STANDARD' | 'HIGH' | 'MAXIMUM' = 'STANDARD'
  ): Promise<Array<{
    originalPath: string;
    result?: FileEncryptionResult;
    error?: string;
  }>> {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.encryptFile(
          file.filePath,
          siteId,
          file.metadata,
          userId,
          encryptionLevel
        );
        results.push({ originalPath: file.filePath, result });
      } catch (error) {
        results.push({ originalPath: file.filePath, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get file encryption status
   */
  async getFileEncryptionStatus(encryptedFilePath: string): Promise<{
    encrypted: boolean;
    metadata?: EncryptedFileMetadata;
    keyExists: boolean;
    corruptionDetected: boolean;
  }> {
    try {
      // Check if file exists
      await fs.access(encryptedFilePath);

      // Try to read metadata
      const metadata = await this.readEncryptedFileMetadata(encryptedFilePath);

      // Check if key exists (simplified check)
      const keyExists = true; // In real implementation, check encryption service

      return {
        encrypted: true,
        metadata,
        keyExists,
        corruptionDetected: false,
      };

    } catch (error) {
      return {
        encrypted: false,
        keyExists: false,
        corruptionDetected: true,
      };
    }
  }

  /**
   * Secure file deletion
   */
  async secureDeleteFile(filePath: string, passes: number = 3): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      // Overwrite file multiple times
      for (let pass = 0; pass < passes; pass++) {
        const file = await fs.open(filePath, 'r+');
        try {
          // Overwrite with random data
          const randomData = crypto.randomBytes(Math.min(fileSize, 1024 * 1024)); // 1MB chunks
          let position = 0;
          
          while (position < fileSize) {
            const chunkSize = Math.min(randomData.length, fileSize - position);
            await file.write(randomData.subarray(0, chunkSize), 0, chunkSize, position);
            position += chunkSize;
          }
          
          await file.sync(); // Ensure data is written to disk
        } finally {
          await file.close();
        }
      }

      // Finally delete the file
      await fs.unlink(filePath);

    } catch (error) {
      throw new Error(`Secure file deletion failed: ${error.message}`);
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    let cleanedCount = 0;
    
    try {
      const tempFiles = await fs.readdir(FILE_ENCRYPTION_CONFIG.tempDir);
      const now = Date.now();

      for (const fileName of tempFiles) {
        const filePath = path.join(FILE_ENCRYPTION_CONFIG.tempDir, fileName);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.secureDeleteFile(filePath);
          cleanedCount++;
        }
      }

    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const fileEncryptionService = new FileEncryptionService();

// Export types
export type {
  EncryptedFileMetadata,
  FileEncryptionResult,
  FileDecryptionResult,
}; 