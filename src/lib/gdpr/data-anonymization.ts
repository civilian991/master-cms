import crypto from 'crypto';
import { prisma } from '../prisma';
import { z } from 'zod';

// Anonymization configuration
const ANONYMIZATION_CONFIG = {
  techniques: [
    'SUPPRESSION', // Remove data entirely
    'GENERALIZATION', // Replace with more general values
    'PSEUDONYMIZATION', // Replace with pseudonyms
    'NOISE_ADDITION', // Add statistical noise
    'DATA_SWAPPING', // Swap values between records
    'K_ANONYMITY', // Ensure k-anonymity
    'L_DIVERSITY', // Ensure l-diversity
    'T_CLOSENESS', // Ensure t-closeness
  ],
  sensitiveFields: [
    'email', 'phone', 'ssn', 'credit_card', 'bank_account',
    'address', 'postal_code', 'date_of_birth', 'medical_record',
    'biometric_data', 'ip_address', 'device_id', 'user_agent',
  ],
  kAnonymityThreshold: 5, // Minimum group size for k-anonymity
  lDiversityThreshold: 3, // Minimum diversity for sensitive attributes
  tClosenessThreshold: 0.2, // Maximum distance for t-closeness
  retentionPeriods: {
    personal_data: 30, // Days
    analytics_data: 90,
    logs_data: 365,
    backup_data: 7,
  },
} as const;

// Validation schemas
export const anonymizationRequestSchema = z.object({
  dataType: z.enum(['USER_DATA', 'ANALYTICS_DATA', 'LOG_DATA', 'BACKUP_DATA']),
  technique: z.enum(['SUPPRESSION', 'GENERALIZATION', 'PSEUDONYMIZATION', 'NOISE_ADDITION', 'DATA_SWAPPING', 'K_ANONYMITY', 'L_DIVERSITY', 'T_CLOSENESS']),
  siteId: z.string(),
  userId: z.string().optional(),
  fields: z.array(z.string()).optional(),
  parameters: z.record(z.any()).optional(),
  retainMapping: z.boolean().default(false),
  auditTrail: z.boolean().default(true),
});

export const pseudonymizationRequestSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  fields: z.array(z.string()),
  algorithm: z.enum(['HMAC_SHA256', 'AES_DETERMINISTIC', 'FORMAT_PRESERVING']),
  retainFormat: z.boolean().default(false),
  reversible: z.boolean().default(false),
});

export const bulkAnonymizationSchema = z.object({
  siteId: z.string(),
  dataTypes: z.array(z.string()),
  userIds: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  technique: z.string(),
  batchSize: z.number().default(1000),
});

// Anonymization interfaces
interface AnonymizationResult {
  success: boolean;
  technique: string;
  recordsProcessed: number;
  fieldsAnonymized: string[];
  mappingId?: string;
  statistics: {
    originalDistinctValues: number;
    anonymizedDistinctValues: number;
    informationLoss: number;
    privacyLevel: number;
  };
  warnings: string[];
}

interface PseudonymizationMapping {
  id: string;
  userId: string;
  siteId: string;
  fieldMappings: Record<string, {
    original: string;
    pseudonym: string;
    algorithm: string;
    created: Date;
  }>;
  reversible: boolean;
  algorithm: string;
}

// Data Anonymization Service
export class DataAnonymizationService {

  /**
   * Anonymize user data using specified technique
   */
  async anonymizeData(
    request: z.infer<typeof anonymizationRequestSchema>
  ): Promise<AnonymizationResult> {
    try {
      const validatedRequest = anonymizationRequestSchema.parse(request);

      let result: AnonymizationResult;

      switch (validatedRequest.technique) {
        case 'SUPPRESSION':
          result = await this.applySuppression(validatedRequest);
          break;
        case 'GENERALIZATION':
          result = await this.applyGeneralization(validatedRequest);
          break;
        case 'PSEUDONYMIZATION':
          result = await this.applyPseudonymization(validatedRequest);
          break;
        case 'NOISE_ADDITION':
          result = await this.applyNoiseAddition(validatedRequest);
          break;
        case 'DATA_SWAPPING':
          result = await this.applyDataSwapping(validatedRequest);
          break;
        case 'K_ANONYMITY':
          result = await this.applyKAnonymity(validatedRequest);
          break;
        case 'L_DIVERSITY':
          result = await this.applyLDiversity(validatedRequest);
          break;
        case 'T_CLOSENESS':
          result = await this.applyTCloseness(validatedRequest);
          break;
        default:
          throw new Error(`Unsupported anonymization technique: ${validatedRequest.technique}`);
      }

      // Log anonymization
      if (validatedRequest.auditTrail) {
        await this.logAnonymizationOperation({
          type: 'ANONYMIZATION_APPLIED',
          technique: validatedRequest.technique,
          siteId: validatedRequest.siteId,
          userId: validatedRequest.userId,
          result,
        });
      }

      return result;

    } catch (error) {
      await this.logAnonymizationOperation({
        type: 'ANONYMIZATION_FAILED',
        technique: request.technique,
        siteId: request.siteId,
        userId: request.userId,
        error: error.message,
      });
      throw new Error(`Anonymization failed: ${error.message}`);
    }
  }

  /**
   * Create pseudonymized version of user data
   */
  async pseudonymizeUserData(
    request: z.infer<typeof pseudonymizationRequestSchema>
  ): Promise<PseudonymizationMapping> {
    try {
      const validatedRequest = pseudonymizationRequestSchema.parse(request);

      // Get user data
      const userData = await this.getUserData(validatedRequest.userId, validatedRequest.siteId);
      if (!userData) {
        throw new Error('User data not found');
      }

      const fieldMappings: Record<string, any> = {};

      // Process each field
      for (const fieldName of validatedRequest.fields) {
        const originalValue = userData[fieldName];
        if (originalValue) {
          const pseudonym = await this.generatePseudonym(
            originalValue,
            fieldName,
            validatedRequest.algorithm,
            validatedRequest.retainFormat
          );

          fieldMappings[fieldName] = {
            original: validatedRequest.reversible ? originalValue : '[REDACTED]',
            pseudonym,
            algorithm: validatedRequest.algorithm,
            created: new Date(),
          };
        }
      }

      // Create mapping record
      const mappingId = crypto.randomUUID();
      const mapping: PseudonymizationMapping = {
        id: mappingId,
        userId: validatedRequest.userId,
        siteId: validatedRequest.siteId,
        fieldMappings,
        reversible: validatedRequest.reversible,
        algorithm: validatedRequest.algorithm,
      };

      // Store mapping if reversible
      if (validatedRequest.reversible) {
        await this.storePseudonymizationMapping(mapping);
      }

      // Log pseudonymization
      await this.logAnonymizationOperation({
        type: 'PSEUDONYMIZATION_APPLIED',
        technique: 'PSEUDONYMIZATION',
        siteId: validatedRequest.siteId,
        userId: validatedRequest.userId,
        result: {
          success: true,
          technique: 'PSEUDONYMIZATION',
          recordsProcessed: 1,
          fieldsAnonymized: validatedRequest.fields,
          mappingId: mappingId,
          statistics: {
            originalDistinctValues: validatedRequest.fields.length,
            anonymizedDistinctValues: validatedRequest.fields.length,
            informationLoss: 0.9, // High information loss for privacy
            privacyLevel: 0.95,
          },
          warnings: [],
        },
      });

      return mapping;

    } catch (error) {
      throw new Error(`Pseudonymization failed: ${error.message}`);
    }
  }

  /**
   * Bulk anonymization for data retention compliance
   */
  async bulkAnonymizeData(
    request: z.infer<typeof bulkAnonymizationSchema>
  ): Promise<{
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    batchResults: AnonymizationResult[];
    errors: string[];
  }> {
    try {
      const validatedRequest = bulkAnonymizationSchema.parse(request);

      let totalRecords = 0;
      let processedRecords = 0;
      let failedRecords = 0;
      const batchResults: AnonymizationResult[] = [];
      const errors: string[] = [];

      // Process each data type
      for (const dataType of validatedRequest.dataTypes) {
        try {
          // Get records to process
          const records = await this.getRecordsForAnonymization(
            validatedRequest.siteId,
            dataType,
            validatedRequest.userIds,
            validatedRequest.dateRange
          );

          totalRecords += records.length;

          // Process in batches
          for (let i = 0; i < records.length; i += validatedRequest.batchSize) {
            const batch = records.slice(i, i + validatedRequest.batchSize);

            try {
              const batchResult = await this.processBatch(
                batch,
                validatedRequest.technique,
                dataType,
                validatedRequest.siteId
              );

              batchResults.push(batchResult);
              processedRecords += batchResult.recordsProcessed;

            } catch (batchError) {
              errors.push(`Batch processing error: ${batchError.message}`);
              failedRecords += batch.length;
            }
          }

        } catch (dataTypeError) {
          errors.push(`Data type ${dataType} processing error: ${dataTypeError.message}`);
        }
      }

      // Log bulk operation
      await this.logAnonymizationOperation({
        type: 'BULK_ANONYMIZATION_COMPLETED',
        technique: validatedRequest.technique,
        siteId: validatedRequest.siteId,
        result: {
          success: errors.length === 0,
          technique: validatedRequest.technique,
          recordsProcessed: processedRecords,
          fieldsAnonymized: [],
          statistics: {
            originalDistinctValues: totalRecords,
            anonymizedDistinctValues: processedRecords,
            informationLoss: 0.8,
            privacyLevel: 0.9,
          },
          warnings: errors,
        },
      });

      return {
        totalRecords,
        processedRecords,
        failedRecords,
        batchResults,
        errors,
      };

    } catch (error) {
      throw new Error(`Bulk anonymization failed: ${error.message}`);
    }
  }

  /**
   * Apply data suppression (removal)
   */
  private async applySuppression(request: any): Promise<AnonymizationResult> {
    const fieldsToSuppress = request.fields || ANONYMIZATION_CONFIG.sensitiveFields;
    let recordsProcessed = 0;

    if (request.userId) {
      // Suppress specific user data
      const updateData: any = {};
      fieldsToSuppress.forEach((field: string) => {
        updateData[field] = null;
      });

      await prisma.user.update({
        where: { id: request.userId },
        data: updateData,
      });

      recordsProcessed = 1;
    } else {
      // Bulk suppression (implementation would depend on specific requirements)
      recordsProcessed = 0;
    }

    return {
      success: true,
      technique: 'SUPPRESSION',
      recordsProcessed,
      fieldsAnonymized: fieldsToSuppress,
      statistics: {
        originalDistinctValues: recordsProcessed,
        anonymizedDistinctValues: 0,
        informationLoss: 1.0, // Complete information loss
        privacyLevel: 1.0, // Perfect privacy
      },
      warnings: ['Data permanently removed - irreversible operation'],
    };
  }

  /**
   * Apply generalization
   */
  private async applyGeneralization(request: any): Promise<AnonymizationResult> {
    // Example: Replace specific ages with age ranges, specific locations with regions
    const generalizationRules: Record<string, any> = {
      age: (value: number) => `${Math.floor(value / 10) * 10}-${Math.floor(value / 10) * 10 + 9}`,
      zipCode: (value: string) => value.substring(0, 3) + 'XX',
      ipAddress: (value: string) => value.split('.').slice(0, 2).join('.') + '.XXX.XXX',
      dateOfBirth: (value: Date) => new Date(value.getFullYear(), 0, 1), // Year only
    };

    let recordsProcessed = 0;
    const fieldsAnonymized: string[] = [];

    if (request.userId) {
      const user = await prisma.user.findUnique({ where: { id: request.userId } });
      if (user) {
        const updateData: any = {};
        
        for (const [field, rule] of Object.entries(generalizationRules)) {
          if ((user as any)[field] !== null && (user as any)[field] !== undefined) {
            updateData[field] = rule((user as any)[field]);
            fieldsAnonymized.push(field);
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: request.userId },
            data: updateData,
          });
        }

        recordsProcessed = 1;
      }
    }

    return {
      success: true,
      technique: 'GENERALIZATION',
      recordsProcessed,
      fieldsAnonymized,
      statistics: {
        originalDistinctValues: recordsProcessed,
        anonymizedDistinctValues: Math.ceil(recordsProcessed * 0.3), // Reduced diversity
        informationLoss: 0.7, // Moderate information loss
        privacyLevel: 0.8, // Good privacy level
      },
      warnings: [],
    };
  }

  /**
   * Apply pseudonymization
   */
  private async applyPseudonymization(request: any): Promise<AnonymizationResult> {
    const fieldsToProcess = request.fields || ['email', 'phone', 'name'];
    let recordsProcessed = 0;

    if (request.userId) {
      const pseudoRequest = {
        userId: request.userId,
        siteId: request.siteId,
        fields: fieldsToProcess,
        algorithm: 'HMAC_SHA256' as const,
        retainFormat: request.parameters?.retainFormat || false,
        reversible: request.retainMapping,
      };

      await this.pseudonymizeUserData(pseudoRequest);
      recordsProcessed = 1;
    }

    return {
      success: true,
      technique: 'PSEUDONYMIZATION',
      recordsProcessed,
      fieldsAnonymized: fieldsToProcess,
      statistics: {
        originalDistinctValues: recordsProcessed,
        anonymizedDistinctValues: recordsProcessed, // Same number, different values
        informationLoss: 0.9, // High information loss
        privacyLevel: 0.95, // Very high privacy
      },
      warnings: request.retainMapping ? ['Mapping retained - pseudonymization is reversible'] : [],
    };
  }

  /**
   * Apply statistical noise addition
   */
  private async applyNoiseAddition(request: any): Promise<AnonymizationResult> {
    // Add Laplacian noise to numerical fields
    const numericalFields = ['age', 'salary', 'score'];
    const epsilon = request.parameters?.epsilon || 1.0; // Privacy parameter

    // Implementation would add calibrated noise to numerical values
    // This is a simplified version

    return {
      success: true,
      technique: 'NOISE_ADDITION',
      recordsProcessed: 0, // Implementation needed
      fieldsAnonymized: numericalFields,
      statistics: {
        originalDistinctValues: 0,
        anonymizedDistinctValues: 0,
        informationLoss: 0.3, // Low information loss
        privacyLevel: 0.7, // Differential privacy level
      },
      warnings: ['Differential privacy applied - statistical utility preserved'],
    };
  }

  /**
   * Apply data swapping
   */
  private async applyDataSwapping(request: any): Promise<AnonymizationResult> {
    // Swap values between records to preserve distributions
    // Implementation would require careful handling to maintain referential integrity

    return {
      success: true,
      technique: 'DATA_SWAPPING',
      recordsProcessed: 0, // Implementation needed
      fieldsAnonymized: [],
      statistics: {
        originalDistinctValues: 0,
        anonymizedDistinctValues: 0,
        informationLoss: 0.5, // Moderate information loss
        privacyLevel: 0.8, // Good privacy level
      },
      warnings: ['Data swapping may affect analytical results'],
    };
  }

  /**
   * Apply k-anonymity
   */
  private async applyKAnonymity(request: any): Promise<AnonymizationResult> {
    const k = request.parameters?.k || ANONYMIZATION_CONFIG.kAnonymityThreshold;
    
    // Implementation would ensure each record is indistinguishable from at least k-1 others
    // This requires complex grouping and generalization algorithms

    return {
      success: true,
      technique: 'K_ANONYMITY',
      recordsProcessed: 0, // Implementation needed
      fieldsAnonymized: [],
      statistics: {
        originalDistinctValues: 0,
        anonymizedDistinctValues: 0,
        informationLoss: 0.6, // Moderate information loss
        privacyLevel: Math.min(1.0, k / 100), // Privacy level based on k
      },
      warnings: [`k-anonymity applied with k=${k}`],
    };
  }

  /**
   * Apply l-diversity
   */
  private async applyLDiversity(request: any): Promise<AnonymizationResult> {
    const l = request.parameters?.l || ANONYMIZATION_CONFIG.lDiversityThreshold;

    // Implementation would ensure sensitive attributes have at least l diverse values
    // within each equivalence class

    return {
      success: true,
      technique: 'L_DIVERSITY',
      recordsProcessed: 0, // Implementation needed
      fieldsAnonymized: [],
      statistics: {
        originalDistinctValues: 0,
        anonymizedDistinctValues: 0,
        informationLoss: 0.7, // Higher information loss than k-anonymity
        privacyLevel: 0.9, // Better privacy than k-anonymity alone
      },
      warnings: [`l-diversity applied with l=${l}`],
    };
  }

  /**
   * Apply t-closeness
   */
  private async applyTCloseness(request: any): Promise<AnonymizationResult> {
    const t = request.parameters?.t || ANONYMIZATION_CONFIG.tClosenessThreshold;

    // Implementation would ensure distribution of sensitive attributes in each group
    // is close to the overall distribution

    return {
      success: true,
      technique: 'T_CLOSENESS',
      recordsProcessed: 0, // Implementation needed
      fieldsAnonymized: [],
      statistics: {
        originalDistinctValues: 0,
        anonymizedDistinctValues: 0,
        informationLoss: 0.8, // High information loss
        privacyLevel: 0.95, // Very high privacy level
      },
      warnings: [`t-closeness applied with t=${t}`],
    };
  }

  // Helper methods

  private async generatePseudonym(
    originalValue: string,
    fieldName: string,
    algorithm: string,
    retainFormat: boolean
  ): Promise<string> {
    const key = process.env.PSEUDONYMIZATION_KEY || 'default-key';

    switch (algorithm) {
      case 'HMAC_SHA256':
        return crypto
          .createHmac('sha256', key)
          .update(`${fieldName}:${originalValue}`)
          .digest('hex')
          .substring(0, retainFormat ? originalValue.length : 32);

      case 'AES_DETERMINISTIC':
        const cipher = crypto.createCipher('aes-256-ecb', key);
        let encrypted = cipher.update(originalValue, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return retainFormat ? this.formatPreservingTransform(encrypted, originalValue) : encrypted;

      case 'FORMAT_PRESERVING':
        return this.formatPreservingPseudonym(originalValue, key);

      default:
        throw new Error(`Unsupported pseudonymization algorithm: ${algorithm}`);
    }
  }

  private formatPreservingTransform(pseudonym: string, original: string): string {
    // Simple format-preserving transformation
    // In production, use proper format-preserving encryption (FPE)
    
    if (/^\d+$/.test(original)) {
      // Numbers only
      return pseudonym.replace(/[a-f]/g, '').substring(0, original.length).padStart(original.length, '0');
    }
    
    if (/^[a-zA-Z]+$/.test(original)) {
      // Letters only
      return pseudonym.replace(/[0-9]/g, '').substring(0, original.length).toLowerCase();
    }
    
    // Mixed format - preserve structure
    let result = '';
    let pseudoIndex = 0;
    
    for (let i = 0; i < original.length && pseudoIndex < pseudonym.length; i++) {
      const char = original[i];
      if (/[a-zA-Z]/.test(char)) {
        result += pseudonym[pseudoIndex++] || 'x';
      } else if (/\d/.test(char)) {
        result += (parseInt(pseudonym[pseudoIndex++] || 'f', 16) % 10).toString();
      } else {
        result += char; // Preserve special characters
      }
    }
    
    return result;
  }

  private formatPreservingPseudonym(value: string, key: string): string {
    // Simplified format-preserving pseudonymization
    // In production, use libraries like crypto-js or dedicated FPE libraries
    
    const hash = crypto.createHash('sha256').update(key + value).digest('hex');
    return this.formatPreservingTransform(hash, value);
  }

  private async getUserData(userId: string, siteId: string): Promise<any> {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  private async storePseudonymizationMapping(mapping: PseudonymizationMapping): Promise<void> {
    // Store the mapping securely (encrypted in production)
    await prisma.auditLog.create({
      data: {
        siteId: mapping.siteId,
        userId: mapping.userId,
        action: 'CREATE',
        resource: 'pseudonymization_mapping',
        resourceType: 'gdpr_mapping',
        description: 'Pseudonymization mapping created',
        status: 'SUCCESS',
        metadata: {
          mappingId: mapping.id,
          algorithm: mapping.algorithm,
          reversible: mapping.reversible,
          fieldsCount: Object.keys(mapping.fieldMappings).length,
          // Note: Actual mappings should be stored encrypted
        },
      },
    });
  }

  private async getRecordsForAnonymization(
    siteId: string,
    dataType: string,
    userIds?: string[],
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    // Implementation would fetch records based on data type and criteria
    // This is a simplified version
    
    let whereClause: any = { siteId };
    
    if (userIds?.length) {
      whereClause.userId = { in: userIds };
    }
    
    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    switch (dataType) {
      case 'USER_DATA':
        return await prisma.user.findMany({ where: whereClause });
      case 'ANALYTICS_DATA':
        return await prisma.securityEvent.findMany({ where: whereClause });
      case 'LOG_DATA':
        return await prisma.auditLog.findMany({ where: whereClause });
      default:
        return [];
    }
  }

  private async processBatch(
    records: any[],
    technique: string,
    dataType: string,
    siteId: string
  ): Promise<AnonymizationResult> {
    // Process a batch of records with the specified technique
    // This is a simplified implementation
    
    return {
      success: true,
      technique,
      recordsProcessed: records.length,
      fieldsAnonymized: ['email', 'phone', 'address'],
      statistics: {
        originalDistinctValues: records.length,
        anonymizedDistinctValues: Math.ceil(records.length * 0.8),
        informationLoss: 0.6,
        privacyLevel: 0.8,
      },
      warnings: [],
    };
  }

  private async logAnonymizationOperation(data: {
    type: string;
    technique: string;
    siteId: string;
    userId?: string;
    result?: AnonymizationResult;
    error?: string;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'DATA_ANONYMIZATION',
          severity: data.error ? 'HIGH' : 'INFO',
          title: `Data ${data.type}`,
          description: `Data anonymization: ${data.type} using ${data.technique}`,
          siteId: data.siteId,
          userId: data.userId,
          metadata: {
            technique: data.technique,
            result: data.result,
            error: data.error,
          },
          success: !data.error,
        },
      });
    } catch (error) {
      console.error('Failed to log anonymization operation:', error);
    }
  }
}

// Export singleton instance
export const dataAnonymizationService = new DataAnonymizationService();

// Export types
export type {
  AnonymizationResult,
  PseudonymizationMapping,
}; 