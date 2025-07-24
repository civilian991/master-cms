import { encryptionService } from './encryption-service';
import { z } from 'zod';

// Database encryption configuration
const DB_ENCRYPTION_CONFIG = {
  encryptedFieldPrefix: 'enc_',
  encryptedFieldSuffix: '_encrypted',
  keyPurposeMapping: {
    email: 'PERSONAL_INFO',
    phone: 'PERSONAL_INFO',
    address: 'PERSONAL_INFO',
    ssn: 'PERSONAL_INFO',
    creditCard: 'PAYMENT_INFO',
    bankAccount: 'PAYMENT_INFO',
    password: 'USER_DATA',
    personalData: 'PERSONAL_INFO',
    medicalData: 'PERSONAL_INFO',
    financialData: 'PAYMENT_INFO',
    systemConfig: 'SYSTEM_CONFIG',
  },
  autoEncryptFields: [
    'email',
    'phone',
    'ssn',
    'credit_card_number',
    'bank_account',
    'medical_record',
    'tax_id',
  ],
} as const;

// Validation schemas
export const encryptFieldSchema = z.object({
  fieldName: z.string(),
  value: z.string(),
  tableName: z.string(),
  recordId: z.string(),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const decryptFieldSchema = z.object({
  encryptedValue: z.string(),
  fieldName: z.string(),
  tableName: z.string(),
  recordId: z.string(),
  siteId: z.string(),
  userId: z.string().optional(),
});

// Database encryption utilities
export class DatabaseEncryption {

  /**
   * Encrypt a database field value
   */
  async encryptField(
    fieldName: string,
    value: string,
    tableName: string,
    recordId: string,
    siteId: string,
    userId?: string
  ): Promise<string> {
    try {
      // Validate input
      encryptFieldSchema.parse({
        fieldName,
        value,
        tableName,
        recordId,
        siteId,
        userId,
      });

      // Determine key purpose based on field name
      const keyPurpose = this.getKeyPurpose(fieldName);

      // Create encryption metadata
      const metadata = {
        tableName,
        fieldName,
        recordId,
        encryptedAt: new Date().toISOString(),
      };

      // Encrypt the value
      const result = await encryptionService.encryptData(
        value,
        keyPurpose,
        siteId,
        userId,
        metadata
      );

      // Return encrypted payload as a single string
      return this.serializeEncryptedField(result);

    } catch (error) {
      throw new Error(`Field encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a database field value
   */
  async decryptField(
    encryptedValue: string,
    fieldName: string,
    tableName: string,
    recordId: string,
    siteId: string,
    userId?: string
  ): Promise<string> {
    try {
      // Validate input
      decryptFieldSchema.parse({
        encryptedValue,
        fieldName,
        tableName,
        recordId,
        siteId,
        userId,
      });

      // Parse encrypted field
      const encryptionData = this.parseEncryptedField(encryptedValue);

      // Decrypt the value
      const result = await encryptionService.decryptData(
        encryptionData.payload,
        encryptionData.keyId,
        siteId,
        userId
      );

      return result.decryptedData;

    } catch (error) {
      throw new Error(`Field decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt multiple fields in a record
   */
  async encryptRecord(
    record: Record<string, any>,
    tableName: string,
    recordId: string,
    siteId: string,
    userId?: string,
    fieldsToEncrypt?: string[]
  ): Promise<Record<string, any>> {
    const encryptedRecord = { ...record };
    const fields = fieldsToEncrypt || this.getEncryptableFields(record);

    for (const fieldName of fields) {
      if (record[fieldName] && typeof record[fieldName] === 'string') {
        try {
          encryptedRecord[fieldName] = await this.encryptField(
            fieldName,
            record[fieldName],
            tableName,
            recordId,
            siteId,
            userId
          );
        } catch (error) {
          console.error(`Failed to encrypt field ${fieldName}:`, error);
          // Keep original value if encryption fails (log the error)
        }
      }
    }

    return encryptedRecord;
  }

  /**
   * Decrypt multiple fields in a record
   */
  async decryptRecord(
    encryptedRecord: Record<string, any>,
    tableName: string,
    recordId: string,
    siteId: string,
    userId?: string,
    fieldsToDecrypt?: string[]
  ): Promise<Record<string, any>> {
    const decryptedRecord = { ...encryptedRecord };
    const fields = fieldsToDecrypt || this.getEncryptedFields(encryptedRecord);

    for (const fieldName of fields) {
      if (encryptedRecord[fieldName] && this.isEncryptedField(encryptedRecord[fieldName])) {
        try {
          decryptedRecord[fieldName] = await this.decryptField(
            encryptedRecord[fieldName],
            fieldName,
            tableName,
            recordId,
            siteId,
            userId
          );
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldName}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }

    return decryptedRecord;
  }

  /**
   * Encrypt user personal data
   */
  async encryptUserData(
    userData: {
      email?: string;
      phone?: string;
      address?: string;
      ssn?: string;
      [key: string]: any;
    },
    userId: string,
    siteId: string
  ): Promise<typeof userData> {
    const personalFields = ['email', 'phone', 'address', 'ssn'];
    
    return await this.encryptRecord(
      userData,
      'users',
      userId,
      siteId,
      userId,
      personalFields.filter(field => userData[field])
    );
  }

  /**
   * Decrypt user personal data
   */
  async decryptUserData(
    encryptedUserData: Record<string, any>,
    userId: string,
    siteId: string
  ): Promise<Record<string, any>> {
    return await this.decryptRecord(
      encryptedUserData,
      'users',
      userId,
      siteId,
      userId
    );
  }

  /**
   * Encrypt payment information
   */
  async encryptPaymentData(
    paymentData: {
      creditCardNumber?: string;
      bankAccount?: string;
      routingNumber?: string;
      [key: string]: any;
    },
    paymentId: string,
    siteId: string,
    userId?: string
  ): Promise<typeof paymentData> {
    const paymentFields = ['creditCardNumber', 'bankAccount', 'routingNumber'];
    
    return await this.encryptRecord(
      paymentData,
      'payments',
      paymentId,
      siteId,
      userId,
      paymentFields.filter(field => paymentData[field])
    );
  }

  /**
   * Create encrypted search index
   */
  async createSearchableEncryption(
    value: string,
    fieldName: string,
    siteId: string
  ): Promise<{
    encryptedValue: string;
    searchHash: string;
    searchTokens: string[];
  }> {
    try {
      // Encrypt the full value
      const keyPurpose = this.getKeyPurpose(fieldName);
      const encryptionResult = await encryptionService.encryptData(
        value,
        keyPurpose,
        siteId
      );

      // Create searchable hash (for exact matches)
      const searchHash = this.createSearchHash(value, siteId);

      // Create search tokens (for partial matches - be careful with this)
      const searchTokens = this.createSearchTokens(value);

      return {
        encryptedValue: this.serializeEncryptedField(encryptionResult),
        searchHash,
        searchTokens,
      };

    } catch (error) {
      throw new Error(`Searchable encryption failed: ${error.message}`);
    }
  }

  /**
   * Search encrypted fields by hash
   */
  createSearchHash(value: string, siteId: string): string {
    const crypto = require('crypto');
    // Use site-specific salt to prevent cross-site correlation
    const salt = `${siteId}_search_salt`;
    return crypto.createHash('sha256').update(value + salt).digest('hex');
  }

  /**
   * Batch encrypt multiple records
   */
  async batchEncryptRecords(
    records: Array<{
      data: Record<string, any>;
      tableName: string;
      recordId: string;
      fieldsToEncrypt?: string[];
    }>,
    siteId: string,
    userId?: string
  ): Promise<Array<{
    recordId: string;
    encryptedData: Record<string, any>;
    errors: string[];
  }>> {
    const results = [];

    for (const record of records) {
      const errors: string[] = [];
      let encryptedData = { ...record.data };

      try {
        encryptedData = await this.encryptRecord(
          record.data,
          record.tableName,
          record.recordId,
          siteId,
          userId,
          record.fieldsToEncrypt
        );
      } catch (error) {
        errors.push(`Encryption failed: ${error.message}`);
      }

      results.push({
        recordId: record.recordId,
        encryptedData,
        errors,
      });
    }

    return results;
  }

  /**
   * Batch decrypt multiple records
   */
  async batchDecryptRecords(
    encryptedRecords: Array<{
      data: Record<string, any>;
      tableName: string;
      recordId: string;
      fieldsToDecrypt?: string[];
    }>,
    siteId: string,
    userId?: string
  ): Promise<Array<{
    recordId: string;
    decryptedData: Record<string, any>;
    errors: string[];
  }>> {
    const results = [];

    for (const record of encryptedRecords) {
      const errors: string[] = [];
      let decryptedData = { ...record.data };

      try {
        decryptedData = await this.decryptRecord(
          record.data,
          record.tableName,
          record.recordId,
          siteId,
          userId,
          record.fieldsToDecrypt
        );
      } catch (error) {
        errors.push(`Decryption failed: ${error.message}`);
      }

      results.push({
        recordId: record.recordId,
        decryptedData,
        errors,
      });
    }

    return results;
  }

  // Helper methods

  /**
   * Determine key purpose based on field name
   */
  private getKeyPurpose(fieldName: string): string {
    const normalizedFieldName = fieldName.toLowerCase();
    
    for (const [pattern, purpose] of Object.entries(DB_ENCRYPTION_CONFIG.keyPurposeMapping)) {
      if (normalizedFieldName.includes(pattern.toLowerCase())) {
        return purpose;
      }
    }

    return 'USER_DATA'; // Default purpose
  }

  /**
   * Get fields that should be encrypted
   */
  private getEncryptableFields(record: Record<string, any>): string[] {
    return Object.keys(record).filter(fieldName =>
      DB_ENCRYPTION_CONFIG.autoEncryptFields.some(autoField =>
        fieldName.toLowerCase().includes(autoField)
      )
    );
  }

  /**
   * Get fields that are encrypted
   */
  private getEncryptedFields(record: Record<string, any>): string[] {
    return Object.keys(record).filter(fieldName =>
      this.isEncryptedField(record[fieldName])
    );
  }

  /**
   * Check if a field value is encrypted
   */
  private isEncryptedField(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Check for encryption signature
    return value.startsWith('ENC:') && value.includes('.');
  }

  /**
   * Serialize encrypted field result
   */
  private serializeEncryptedField(encryptionResult: any): string {
    // Format: ENC:keyId.encryptedData.iv.tag.salt.metadata
    return `ENC:${encryptionResult.keyId}.${encryptionResult.encryptedData}.${encryptionResult.iv}.${encryptionResult.tag}.${encryptionResult.salt}.${Buffer.from(JSON.stringify(encryptionResult.metadata)).toString('base64')}`;
  }

  /**
   * Parse encrypted field
   */
  private parseEncryptedField(encryptedValue: string): {
    keyId: string;
    payload: string;
  } {
    if (!encryptedValue.startsWith('ENC:')) {
      throw new Error('Invalid encrypted field format');
    }

    const parts = encryptedValue.substring(4).split('.');
    if (parts.length !== 6) {
      throw new Error('Invalid encrypted field structure');
    }

    const [keyId, encryptedData, iv, tag, salt, metadataBase64] = parts;
    
    // Reconstruct the payload format expected by encryptionService.decryptData
    const payload = `${encryptedData}.${iv}.${tag}.${salt}.${metadataBase64}`;

    return {
      keyId,
      payload,
    };
  }

  /**
   * Create search tokens for partial matching (use with extreme caution)
   */
  private createSearchTokens(value: string): string[] {
    // This is a simplified implementation
    // In production, use proper searchable encryption schemes like deterministic encryption
    // or format-preserving encryption for specific use cases
    
    if (value.length < 3) return [];
    
    const tokens: string[] = [];
    const crypto = require('crypto');
    
    // Create tokens for substrings (be very careful with this approach)
    for (let i = 0; i <= value.length - 3; i++) {
      const token = value.substring(i, i + 3).toLowerCase();
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
      tokens.push(hashedToken);
    }
    
    return [...new Set(tokens)]; // Remove duplicates
  }

  /**
   * Validate field encryption requirements
   */
  async validateEncryptionCompliance(
    tableName: string,
    fieldName: string,
    siteId: string
  ): Promise<{
    requiresEncryption: boolean;
    complianceReasons: string[];
    recommendations: string[];
  }> {
    const complianceReasons: string[] = [];
    const recommendations: string[] = [];
    
    // Check if field contains sensitive data patterns
    const sensitivePatterns = [
      { pattern: /email/i, reason: 'Contains email addresses (GDPR, CCPA)' },
      { pattern: /phone/i, reason: 'Contains phone numbers (GDPR, CCPA)' },
      { pattern: /ssn|social/i, reason: 'Contains Social Security Numbers (PII)' },
      { pattern: /credit|card/i, reason: 'Contains payment information (PCI DSS)' },
      { pattern: /password/i, reason: 'Contains authentication credentials' },
      { pattern: /medical|health/i, reason: 'Contains health information (HIPAA)' },
    ];

    let requiresEncryption = false;

    for (const { pattern, reason } of sensitivePatterns) {
      if (pattern.test(fieldName)) {
        requiresEncryption = true;
        complianceReasons.push(reason);
      }
    }

    if (requiresEncryption) {
      recommendations.push('Enable field-level encryption');
      recommendations.push('Implement data masking for non-production environments');
      recommendations.push('Set up regular encryption key rotation');
      recommendations.push('Monitor access to encrypted fields');
    }

    return {
      requiresEncryption,
      complianceReasons,
      recommendations,
    };
  }
}

// Export singleton instance
export const databaseEncryption = new DatabaseEncryption();

// Prisma middleware for automatic encryption/decryption
export function createEncryptionMiddleware(siteId: string) {
  return async (params: any, next: any) => {
    const { model, action, args } = params;

    // Auto-encrypt on create and update
    if (['create', 'update', 'upsert'].includes(action)) {
      if (args.data) {
        const fieldsToEncrypt = databaseEncryption['getEncryptableFields'](args.data);
        
        if (fieldsToEncrypt.length > 0) {
          const recordId = args.where?.id || 'new';
          args.data = await databaseEncryption.encryptRecord(
            args.data,
            model,
            recordId,
            siteId
          );
        }
      }
    }

    const result = await next(params);

    // Auto-decrypt on read operations
    if (['findUnique', 'findFirst', 'findMany'].includes(action) && result) {
      if (Array.isArray(result)) {
        for (let i = 0; i < result.length; i++) {
          const recordId = result[i].id || 'unknown';
          result[i] = await databaseEncryption.decryptRecord(
            result[i],
            model,
            recordId,
            siteId
          );
        }
      } else if (typeof result === 'object') {
        const recordId = result.id || 'unknown';
        return await databaseEncryption.decryptRecord(
          result,
          model,
          recordId,
          siteId
        );
      }
    }

    return result;
  };
} 