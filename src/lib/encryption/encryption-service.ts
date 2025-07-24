import crypto from 'crypto';
import { prisma } from '../prisma';
import { z } from 'zod';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  tagLength: 16, // 128 bits
  keyDerivationIterations: 100000, // PBKDF2 iterations
  keyRotationDays: 90, // Days between key rotations
  backupRetentionDays: 365, // Days to keep backup keys
  compressionEnabled: true,
  integrityChecking: true,
} as const;

// Validation schemas
export const encryptionRequestSchema = z.object({
  data: z.string().min(1),
  keyPurpose: z.enum(['USER_DATA', 'SYSTEM_CONFIG', 'PAYMENT_INFO', 'PERSONAL_INFO', 'FILE_STORAGE']),
  siteId: z.string(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const decryptionRequestSchema = z.object({
  encryptedData: z.string(),
  keyId: z.string(),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const keyRotationSchema = z.object({
  keyId: z.string(),
  siteId: z.string(),
  force: z.boolean().default(false),
  backupOldKey: z.boolean().default(true),
});

// Encryption interfaces
interface EncryptionResult {
  encryptedData: string;
  keyId: string;
  algorithm: string;
  iv: string;
  tag: string;
  salt?: string;
  metadata: {
    timestamp: string;
    version: string;
    checksum: string;
    compressed: boolean;
  };
}

interface DecryptionResult {
  decryptedData: string;
  keyId: string;
  metadata: {
    timestamp: string;
    version: string;
    verified: boolean;
  };
}

interface KeyMetrics {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  keysNeedingRotation: number;
  keyUsageStats: Record<string, number>;
  rotationSchedule: Array<{
    keyId: string;
    nextRotation: Date;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Encryption Service Class
export class EncryptionService {

  /**
   * Encrypt data with specified key purpose
   */
  async encryptData(
    data: string,
    keyPurpose: string,
    siteId: string,
    userId?: string,
    metadata?: any
  ): Promise<EncryptionResult> {
    try {
      // Validate input
      const validatedData = encryptionRequestSchema.parse({
        data,
        keyPurpose,
        siteId,
        userId,
        metadata,
      });

      // Get or create encryption key
      const key = await this.getOrCreateEncryptionKey(keyPurpose, siteId);

      // Compress data if enabled
      const processedData = ENCRYPTION_CONFIG.compressionEnabled
        ? await this.compressData(data)
        : data;

      // Generate initialization vector and salt
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
      const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);

      // Derive key from master key
      const derivedKey = await this.deriveKey(key.keyData, salt);

      // Create cipher
      const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, derivedKey);
      cipher.setAAD(Buffer.from(JSON.stringify({ keyId: key.keyId, siteId, purpose: keyPurpose })));

      // Encrypt data
      let encryptedData = cipher.update(processedData, 'utf8', 'base64');
      encryptedData += cipher.final('base64');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Calculate checksum for integrity
      const checksum = this.calculateChecksum(data);

      // Create result
      const result: EncryptionResult = {
        encryptedData,
        keyId: key.keyId,
        algorithm: ENCRYPTION_CONFIG.algorithm,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt.toString('base64'),
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          checksum,
          compressed: ENCRYPTION_CONFIG.compressionEnabled,
        },
      };

      // Log encryption operation
      await this.logKeyUsage(key.keyId, 'ENCRYPT', siteId, userId, {
        dataSize: data.length,
        purpose: keyPurpose,
        checksum,
      });

      // Update key usage statistics
      await this.updateKeyUsageStats(key.keyId);

      return result;

    } catch (error) {
      await this.logEncryptionError('ENCRYPT', error.message, siteId, userId);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using specified key
   */
  async decryptData(
    encryptedData: string,
    keyId: string,
    siteId: string,
    userId?: string
  ): Promise<DecryptionResult> {
    try {
      // Validate input
      const validatedData = decryptionRequestSchema.parse({
        encryptedData,
        keyId,
        siteId,
        userId,
      });

      // Get encryption key
      const key = await this.getEncryptionKey(keyId, siteId);
      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Parse encryption metadata
      const encryptionInfo = await this.parseEncryptionMetadata(encryptedData);

      // Derive key from master key
      const derivedKey = await this.deriveKey(
        key.keyData,
        Buffer.from(encryptionInfo.salt, 'base64')
      );

      // Create decipher
      const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, derivedKey);
      decipher.setAAD(Buffer.from(JSON.stringify({
        keyId,
        siteId,
        purpose: key.purpose,
      })));
      decipher.setAuthTag(Buffer.from(encryptionInfo.tag, 'base64'));

      // Decrypt data
      let decryptedData = decipher.update(encryptionInfo.data, 'base64', 'utf8');
      decryptedData += decipher.final('utf8');

      // Decompress if needed
      const processedData = encryptionInfo.metadata.compressed
        ? await this.decompressData(decryptedData)
        : decryptedData;

      // Verify integrity
      const verified = this.verifyChecksum(processedData, encryptionInfo.metadata.checksum);

      if (!verified && ENCRYPTION_CONFIG.integrityChecking) {
        throw new Error('Data integrity verification failed');
      }

      // Log decryption operation
      await this.logKeyUsage(keyId, 'DECRYPT', siteId, userId, {
        dataSize: processedData.length,
        verified,
      });

      return {
        decryptedData: processedData,
        keyId,
        metadata: {
          timestamp: encryptionInfo.metadata.timestamp,
          version: encryptionInfo.metadata.version,
          verified,
        },
      };

    } catch (error) {
      await this.logEncryptionError('DECRYPT', error.message, siteId, userId);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(
    keyId: string,
    siteId: string,
    force: boolean = false,
    backupOldKey: boolean = true
  ): Promise<{
    oldKeyId: string;
    newKeyId: string;
    rotationTime: Date;
    backupCreated: boolean;
  }> {
    try {
      // Get current key
      const currentKey = await this.getEncryptionKey(keyId, siteId);
      if (!currentKey) {
        throw new Error('Key not found for rotation');
      }

      // Check if rotation is needed
      if (!force && !this.isRotationNeeded(currentKey)) {
        throw new Error('Key rotation not needed');
      }

      // Create backup of old key if requested
      let backupCreated = false;
      if (backupOldKey) {
        await this.backupEncryptionKey(currentKey);
        backupCreated = true;
      }

      // Generate new key
      const newKeyData = crypto.randomBytes(ENCRYPTION_CONFIG.keyLength);
      const newKeyId = `${currentKey.purpose}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

      // Create new encryption key record
      const newKey = await prisma.encryptionKey.create({
        data: {
          keyId: newKeyId,
          name: `${currentKey.name} (Rotated)`,
          description: `Rotated from ${keyId}`,
          algorithm: 'AES_256',
          keySize: 256,
          purpose: currentKey.purpose as any,
          status: 'ACTIVE',
          siteId,
          generatedAt: new Date(),
          activatedAt: new Date(),
          rotationCycle: currentKey.rotationCycle,
          nextRotation: new Date(Date.now() + (currentKey.rotationCycle || 90) * 24 * 60 * 60 * 1000),
          autoRotate: currentKey.autoRotate,
          metadata: {
            ...currentKey.metadata,
            rotatedFrom: keyId,
            keyData: newKeyData.toString('base64'),
          },
          compliance: currentKey.compliance,
        },
      });

      // Mark old key as retired
      await prisma.encryptionKey.update({
        where: { id: currentKey.id },
        data: {
          status: 'RETIRED',
          retiredAt: new Date(),
        },
      });

      // Log rotation operation
      await this.logKeyUsage(newKeyId, 'ROTATE', siteId, undefined, {
        rotatedFrom: keyId,
        backupCreated,
        force,
      });

      // Update key rotation schedule
      await this.updateRotationSchedule(siteId);

      const rotationTime = new Date();

      return {
        oldKeyId: keyId,
        newKeyId,
        rotationTime,
        backupCreated,
      };

    } catch (error) {
      await this.logEncryptionError('ROTATE', error.message, siteId);
      throw new Error(`Key rotation failed: ${error.message}`);
    }
  }

  /**
   * Get or create encryption key for purpose
   */
  private async getOrCreateEncryptionKey(
    purpose: string,
    siteId: string
  ): Promise<{
    id: string;
    keyId: string;
    keyData: Buffer;
    purpose: string;
    name: string;
    rotationCycle?: number;
    autoRotate: boolean;
    metadata: any;
    compliance: any[];
  }> {
    // Try to find existing active key
    let key = await prisma.encryptionKey.findFirst({
      where: {
        siteId,
        purpose: purpose as any,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!key) {
      // Create new key
      const keyData = crypto.randomBytes(ENCRYPTION_CONFIG.keyLength);
      const keyId = `${purpose}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

      key = await prisma.encryptionKey.create({
        data: {
          keyId,
          name: `${purpose} Encryption Key`,
          description: `AES-256 encryption key for ${purpose}`,
          algorithm: 'AES_256',
          keySize: 256,
          purpose: purpose as any,
          status: 'ACTIVE',
          siteId,
          generatedAt: new Date(),
          activatedAt: new Date(),
          rotationCycle: ENCRYPTION_CONFIG.keyRotationDays,
          nextRotation: new Date(Date.now() + ENCRYPTION_CONFIG.keyRotationDays * 24 * 60 * 60 * 1000),
          autoRotate: true,
          metadata: {
            keyData: keyData.toString('base64'),
            version: '1.0',
            algorithm: ENCRYPTION_CONFIG.algorithm,
          },
          compliance: this.getComplianceRequirements(purpose),
        },
      });
    }

    return {
      id: key.id,
      keyId: key.keyId,
      keyData: Buffer.from(key.metadata?.keyData || '', 'base64'),
      purpose: key.purpose,
      name: key.name,
      rotationCycle: key.rotationCycle || undefined,
      autoRotate: key.autoRotate,
      metadata: key.metadata,
      compliance: key.compliance as any[],
    };
  }

  /**
   * Get encryption key by ID
   */
  private async getEncryptionKey(keyId: string, siteId: string) {
    const key = await prisma.encryptionKey.findFirst({
      where: {
        keyId,
        siteId,
      },
    });

    if (!key) return null;

    return {
      id: key.id,
      keyId: key.keyId,
      keyData: Buffer.from(key.metadata?.keyData || '', 'base64'),
      purpose: key.purpose,
      name: key.name,
      rotationCycle: key.rotationCycle || undefined,
      autoRotate: key.autoRotate,
      metadata: key.metadata,
      compliance: key.compliance,
    };
  }

  /**
   * Derive key using PBKDF2
   */
  private async deriveKey(masterKey: Buffer, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        masterKey,
        salt,
        ENCRYPTION_CONFIG.keyDerivationIterations,
        ENCRYPTION_CONFIG.keyLength,
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Compress data using gzip
   */
  private async compressData(data: string): Promise<string> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data, 'utf8'), (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed.toString('base64'));
      });
    });
  }

  /**
   * Decompress data using gzip
   */
  private async decompressData(compressedData: string): Promise<string> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(Buffer.from(compressedData, 'base64'), (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString('utf8'));
      });
    });
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Verify checksum
   */
  private verifyChecksum(data: string, expectedChecksum: string): boolean {
    const actualChecksum = this.calculateChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Parse encryption metadata
   */
  private async parseEncryptionMetadata(encryptedPayload: string): Promise<{
    data: string;
    iv: string;
    tag: string;
    salt: string;
    metadata: any;
  }> {
    // Simple implementation - in production, use proper structured format
    const parts = encryptedPayload.split('.');
    if (parts.length !== 5) {
      throw new Error('Invalid encrypted payload format');
    }

    return {
      data: parts[0],
      iv: parts[1],
      tag: parts[2],
      salt: parts[3],
      metadata: JSON.parse(Buffer.from(parts[4], 'base64').toString('utf8')),
    };
  }

  /**
   * Check if key rotation is needed
   */
  private isRotationNeeded(key: any): boolean {
    if (!key.nextRotation) return false;
    return new Date() >= new Date(key.nextRotation);
  }

  /**
   * Backup encryption key
   */
  private async backupEncryptionKey(key: any): Promise<void> {
    await prisma.encryptionKey.create({
      data: {
        keyId: `${key.keyId}_backup_${Date.now()}`,
        name: `${key.name} (Backup)`,
        description: `Backup of ${key.keyId}`,
        algorithm: key.algorithm,
        keySize: key.keySize,
        purpose: 'BACKUP',
        status: 'RETIRED',
        siteId: key.siteId,
        generatedAt: key.generatedAt,
        retiredAt: new Date(),
        metadata: {
          ...key.metadata,
          backupOf: key.keyId,
          backupDate: new Date().toISOString(),
        },
        compliance: key.compliance,
      },
    });
  }

  /**
   * Log key usage
   */
  private async logKeyUsage(
    keyId: string,
    operation: string,
    siteId: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.keyUsageLog.create({
        data: {
          keyId,
          siteId,
          userId,
          operation: operation as any,
          success: true,
          metadata: metadata || {},
        },
      });

      // Update key usage count
      await prisma.encryptionKey.updateMany({
        where: { keyId },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log key usage:', error);
    }
  }

  /**
   * Log encryption errors
   */
  private async logEncryptionError(
    operation: string,
    error: string,
    siteId: string,
    userId?: string
  ): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'DATA_ENCRYPTION_ERROR',
          severity: 'HIGH',
          title: `Encryption ${operation} Failed`,
          description: `Data encryption operation failed: ${error}`,
          siteId,
          userId,
          metadata: {
            operation,
            error,
            timestamp: new Date().toISOString(),
          },
          success: false,
        },
      });
    } catch (logError) {
      console.error('Failed to log encryption error:', logError);
    }
  }

  /**
   * Update key usage statistics
   */
  private async updateKeyUsageStats(keyId: string): Promise<void> {
    // Implementation for updating key usage statistics
    // This could include metrics like operations per day, data volume, etc.
  }

  /**
   * Update rotation schedule
   */
  private async updateRotationSchedule(siteId: string): Promise<void> {
    // Implementation for updating key rotation schedule
    // This could trigger automated rotation jobs
  }

  /**
   * Get compliance requirements for key purpose
   */
  private getComplianceRequirements(purpose: string): string[] {
    const complianceMap: Record<string, string[]> = {
      USER_DATA: ['GDPR', 'CCPA'],
      PAYMENT_INFO: ['PCI_DSS', 'GDPR'],
      PERSONAL_INFO: ['GDPR', 'CCPA', 'HIPAA'],
      SYSTEM_CONFIG: ['ISO27001', 'SOC2'],
      FILE_STORAGE: ['GDPR', 'SOC2'],
    };

    return complianceMap[purpose] || ['ISO27001'];
  }

  /**
   * Get encryption metrics
   */
  async getEncryptionMetrics(siteId: string, days: number = 30): Promise<KeyMetrics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get key counts
      const [totalKeys, activeKeys, expiredKeys] = await Promise.all([
        prisma.encryptionKey.count({ where: { siteId } }),
        prisma.encryptionKey.count({ where: { siteId, status: 'ACTIVE' } }),
        prisma.encryptionKey.count({ where: { siteId, status: 'EXPIRED' } }),
      ]);

      // Get keys needing rotation
      const keysNeedingRotation = await prisma.encryptionKey.count({
        where: {
          siteId,
          status: 'ACTIVE',
          nextRotation: { lte: new Date() },
        },
      });

      // Get key usage statistics
      const keyUsage = await prisma.keyUsageLog.groupBy({
        by: ['operation'],
        where: {
          siteId,
          createdAt: { gte: startDate },
        },
        _count: { operation: true },
      });

      const keyUsageStats = keyUsage.reduce((acc, item) => {
        acc[item.operation] = item._count.operation;
        return acc;
      }, {} as Record<string, number>);

      // Get rotation schedule
      const upcomingRotations = await prisma.encryptionKey.findMany({
        where: {
          siteId,
          status: 'ACTIVE',
          nextRotation: { gte: new Date() },
        },
        select: {
          keyId: true,
          nextRotation: true,
        },
        orderBy: { nextRotation: 'asc' },
        take: 10,
      });

      const rotationSchedule = upcomingRotations.map(key => ({
        keyId: key.keyId,
        nextRotation: key.nextRotation!,
        priority: this.getRotationPriority(key.nextRotation!),
      }));

      return {
        totalKeys,
        activeKeys,
        expiredKeys,
        keysNeedingRotation,
        keyUsageStats,
        rotationSchedule,
      };

    } catch (error) {
      console.error('Error getting encryption metrics:', error);
      return {
        totalKeys: 0,
        activeKeys: 0,
        expiredKeys: 0,
        keysNeedingRotation: 0,
        keyUsageStats: {},
        rotationSchedule: [],
      };
    }
  }

  /**
   * Get rotation priority based on time until rotation
   */
  private getRotationPriority(nextRotation: Date): 'low' | 'medium' | 'high' {
    const daysUntilRotation = (nextRotation.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    
    if (daysUntilRotation <= 7) return 'high';
    if (daysUntilRotation <= 30) return 'medium';
    return 'low';
  }

  /**
   * Process automatic key rotations
   */
  async processAutomaticRotations(siteId: string): Promise<{
    rotatedKeys: string[];
    errors: string[];
  }> {
    const rotatedKeys: string[] = [];
    const errors: string[] = [];

    try {
      // Find keys that need rotation
      const keysToRotate = await prisma.encryptionKey.findMany({
        where: {
          siteId,
          status: 'ACTIVE',
          autoRotate: true,
          nextRotation: { lte: new Date() },
        },
      });

      // Rotate each key
      for (const key of keysToRotate) {
        try {
          const result = await this.rotateEncryptionKey(key.keyId, siteId, false, true);
          rotatedKeys.push(result.newKeyId);
        } catch (error) {
          errors.push(`Failed to rotate key ${key.keyId}: ${error.message}`);
        }
      }

    } catch (error) {
      errors.push(`Failed to process automatic rotations: ${error.message}`);
    }

    return { rotatedKeys, errors };
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export types
export type {
  EncryptionResult,
  DecryptionResult,
  KeyMetrics,
}; 