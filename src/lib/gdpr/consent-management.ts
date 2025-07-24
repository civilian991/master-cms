import { prisma } from '../prisma';
import { z } from 'zod';

// GDPR consent configuration
const CONSENT_CONFIG = {
  consentVersion: '2.0',
  consentCategories: [
    'ESSENTIAL', // Essential cookies and functionality
    'ANALYTICS', // Analytics and performance tracking
    'MARKETING', // Marketing and advertising
    'PERSONALIZATION', // Personalization and recommendations
    'THIRD_PARTY', // Third-party integrations
  ],
  legalBases: [
    'CONSENT', // Article 6(1)(a) - User consent
    'CONTRACT', // Article 6(1)(b) - Contract performance
    'LEGAL_OBLIGATION', // Article 6(1)(c) - Legal obligation
    'VITAL_INTERESTS', // Article 6(1)(d) - Vital interests
    'PUBLIC_TASK', // Article 6(1)(e) - Public task
    'LEGITIMATE_INTERESTS', // Article 6(1)(f) - Legitimate interests
  ],
  specialCategories: [
    'HEALTH', // Health data
    'GENETIC', // Genetic data
    'BIOMETRIC', // Biometric data
    'POLITICAL', // Political opinions
    'RELIGIOUS', // Religious beliefs
    'UNION', // Trade union membership
    'SEXUAL', // Sexual orientation
    'CRIMINAL', // Criminal convictions
  ],
  consentExpiryDays: 365, // Default consent expiry
  reminderDays: 30, // Days before expiry to remind
  minimumAge: 16, // GDPR minimum age for consent
} as const;

// Validation schemas
export const consentRecordSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  category: z.enum(['ESSENTIAL', 'ANALYTICS', 'MARKETING', 'PERSONALIZATION', 'THIRD_PARTY']),
  purpose: z.string(),
  legalBasis: z.enum(['CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS']),
  granted: z.boolean(),
  consentMethod: z.enum(['EXPLICIT', 'IMPLIED', 'OPT_IN', 'OPT_OUT', 'PRE_TICKED', 'COOKIE_BANNER']),
  dataTypes: z.array(z.string()),
  processingPurposes: z.array(z.string()),
  retentionPeriod: z.number().optional(), // Days
  thirdParties: z.array(z.string()).optional(),
  specialCategory: z.enum(['HEALTH', 'GENETIC', 'BIOMETRIC', 'POLITICAL', 'RELIGIOUS', 'UNION', 'SEXUAL', 'CRIMINAL']).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  geoLocation: z.string().optional(),
  consentVersion: z.string().default(CONSENT_CONFIG.consentVersion),
});

export const consentWithdrawalSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  consentIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  reason: z.string().optional(),
  effectiveDate: z.date().optional(),
  deletionRequested: z.boolean().default(false),
});

export const consentUpdateSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  consents: z.array(z.object({
    category: z.string(),
    granted: z.boolean(),
    purpose: z.string(),
    legalBasis: z.string(),
  })),
  updateReason: z.string().optional(),
});

// Consent interfaces
interface ConsentRecord {
  id: string;
  userId: string;
  siteId: string;
  category: string;
  purpose: string;
  legalBasis: string;
  granted: boolean;
  consentMethod: string;
  dataTypes: string[];
  processingPurposes: string[];
  retentionPeriod?: number;
  thirdParties?: string[];
  specialCategory?: string;
  consentDate: Date;
  expiryDate?: Date;
  withdrawnDate?: Date;
  version: string;
  metadata: Record<string, any>;
}

interface ConsentSummary {
  userId: string;
  siteId: string;
  overallStatus: 'FULL_CONSENT' | 'PARTIAL_CONSENT' | 'NO_CONSENT' | 'WITHDRAWN';
  categories: Record<string, {
    granted: boolean;
    date: Date;
    expiresAt?: Date;
    method: string;
  }>;
  lastUpdated: Date;
  nextReview: Date;
  complianceScore: number;
}

// GDPR Consent Management Service
export class GDPRConsentManagementService {

  /**
   * Record user consent
   */
  async recordConsent(
    consentData: z.infer<typeof consentRecordSchema>
  ): Promise<ConsentRecord> {
    try {
      // Validate consent data
      const validatedData = consentRecordSchema.parse(consentData);

      // Check if user is of minimum age
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
        select: { dateOfBirth: true, email: true },
      });

      if (user?.dateOfBirth) {
        const age = this.calculateAge(user.dateOfBirth);
        if (age < CONSENT_CONFIG.minimumAge) {
          throw new Error(`User must be at least ${CONSENT_CONFIG.minimumAge} years old to provide consent`);
        }
      }

      // Calculate expiry date
      const expiryDate = validatedData.retentionPeriod
        ? new Date(Date.now() + validatedData.retentionPeriod * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + CONSENT_CONFIG.consentExpiryDays * 24 * 60 * 60 * 1000);

      // Check for existing consent in this category
      const existingConsent = await prisma.userSecurityProfile.findUnique({
        where: { userId: validatedData.userId },
      });

      // Create consent record
      const consentRecord = await prisma.complianceRecord.create({
        data: {
          siteId: validatedData.siteId,
          userId: validatedData.userId,
          type: 'GDPR_CONSENT',
          requirement: `${validatedData.category}_CONSENT`,
          status: validatedData.granted ? 'COMPLIANT' : 'NON_COMPLIANT',
          evidence: {
            category: validatedData.category,
            purpose: validatedData.purpose,
            legalBasis: validatedData.legalBasis,
            consentMethod: validatedData.consentMethod,
            dataTypes: validatedData.dataTypes,
            processingPurposes: validatedData.processingPurposes,
            thirdParties: validatedData.thirdParties || [],
            specialCategory: validatedData.specialCategory,
            userAgent: validatedData.userAgent,
            ipAddress: validatedData.ipAddress,
            geoLocation: validatedData.geoLocation,
            version: validatedData.consentVersion,
          },
          expiryDate,
          metadata: {
            consentGranted: validatedData.granted,
            consentDate: new Date().toISOString(),
            retentionPeriod: validatedData.retentionPeriod,
          },
        },
      });

      // Update user's consent preferences
      await this.updateUserConsentPreferences(
        validatedData.userId,
        validatedData.siteId,
        validatedData.category,
        validatedData.granted
      );

      // Log consent event
      await this.logConsentEvent({
        type: 'CONSENT_RECORDED',
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        category: validatedData.category,
        granted: validatedData.granted,
        metadata: {
          purpose: validatedData.purpose,
          legalBasis: validatedData.legalBasis,
          method: validatedData.consentMethod,
        },
      });

      // Create audit log
      await this.createConsentAuditLog({
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        action: 'CONSENT_GRANTED',
        details: `User granted consent for ${validatedData.category}: ${validatedData.purpose}`,
        consentId: consentRecord.id,
        metadata: validatedData,
      });

      return {
        id: consentRecord.id,
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        category: validatedData.category,
        purpose: validatedData.purpose,
        legalBasis: validatedData.legalBasis,
        granted: validatedData.granted,
        consentMethod: validatedData.consentMethod,
        dataTypes: validatedData.dataTypes,
        processingPurposes: validatedData.processingPurposes,
        retentionPeriod: validatedData.retentionPeriod,
        thirdParties: validatedData.thirdParties,
        specialCategory: validatedData.specialCategory,
        consentDate: consentRecord.createdAt,
        expiryDate,
        version: validatedData.consentVersion,
        metadata: consentRecord.metadata as Record<string, any>,
      };

    } catch (error) {
      await this.logConsentEvent({
        type: 'CONSENT_ERROR',
        userId: consentData.userId,
        siteId: consentData.siteId,
        metadata: { error: error.message },
      });
      throw new Error(`Failed to record consent: ${error.message}`);
    }
  }

  /**
   * Withdraw user consent
   */
  async withdrawConsent(
    withdrawalData: z.infer<typeof consentWithdrawalSchema>
  ): Promise<{
    withdrawnConsents: string[];
    effectiveDate: Date;
    deletionScheduled: boolean;
  }> {
    try {
      // Validate withdrawal data
      const validatedData = consentWithdrawalSchema.parse(withdrawalData);
      
      const effectiveDate = validatedData.effectiveDate || new Date();
      const withdrawnConsents: string[] = [];

      // Find consents to withdraw
      let whereClause: any = {
        siteId: validatedData.siteId,
        userId: validatedData.userId,
        type: 'GDPR_CONSENT',
        status: 'COMPLIANT',
      };

      if (validatedData.consentIds?.length) {
        whereClause.id = { in: validatedData.consentIds };
      }

      if (validatedData.categories?.length) {
        whereClause.requirement = { in: validatedData.categories.map(cat => `${cat}_CONSENT`) };
      }

      const consentsToWithdraw = await prisma.complianceRecord.findMany({
        where: whereClause,
      });

      // Process each consent withdrawal
      for (const consent of consentsToWithdraw) {
        await prisma.complianceRecord.update({
          where: { id: consent.id },
          data: {
            status: 'WITHDRAWN',
            metadata: {
              ...consent.metadata,
              withdrawnDate: effectiveDate.toISOString(),
              withdrawalReason: validatedData.reason,
              deletionRequested: validatedData.deletionRequested,
            },
          },
        });

        withdrawnConsents.push(consent.id);

        // Update user preferences
        const category = (consent.evidence as any)?.category;
        if (category) {
          await this.updateUserConsentPreferences(
            validatedData.userId,
            validatedData.siteId,
            category,
            false
          );
        }

        // Log withdrawal
        await this.logConsentEvent({
          type: 'CONSENT_WITHDRAWN',
          userId: validatedData.userId,
          siteId: validatedData.siteId,
          category: category || 'UNKNOWN',
          granted: false,
          metadata: {
            consentId: consent.id,
            reason: validatedData.reason,
            deletionRequested: validatedData.deletionRequested,
          },
        });

        // Create audit log
        await this.createConsentAuditLog({
          userId: validatedData.userId,
          siteId: validatedData.siteId,
          action: 'CONSENT_WITHDRAWN',
          details: `User withdrew consent for ${category}: ${validatedData.reason || 'No reason provided'}`,
          consentId: consent.id,
          metadata: validatedData,
        });
      }

      // Schedule data deletion if requested
      let deletionScheduled = false;
      if (validatedData.deletionRequested) {
        await this.scheduleDataDeletion(
          validatedData.userId,
          validatedData.siteId,
          withdrawnConsents,
          effectiveDate
        );
        deletionScheduled = true;
      }

      return {
        withdrawnConsents,
        effectiveDate,
        deletionScheduled,
      };

    } catch (error) {
      await this.logConsentEvent({
        type: 'WITHDRAWAL_ERROR',
        userId: withdrawalData.userId,
        siteId: withdrawalData.siteId,
        metadata: { error: error.message },
      });
      throw new Error(`Failed to withdraw consent: ${error.message}`);
    }
  }

  /**
   * Get user consent summary
   */
  async getUserConsentSummary(userId: string, siteId: string): Promise<ConsentSummary> {
    try {
      // Get all consent records for user
      const consentRecords = await prisma.complianceRecord.findMany({
        where: {
          userId,
          siteId,
          type: 'GDPR_CONSENT',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by category and get latest for each
      const categoryConsents: Record<string, any> = {};
      const categories: Record<string, any> = {};

      for (const record of consentRecords) {
        const evidence = record.evidence as any;
        const category = evidence?.category;
        
        if (category && !categoryConsents[category]) {
          categoryConsents[category] = record;
          categories[category] = {
            granted: record.status === 'COMPLIANT',
            date: record.createdAt,
            expiresAt: record.expiryDate,
            method: evidence.consentMethod,
          };
        }
      }

      // Determine overall status
      const grantedCategories = Object.values(categories).filter((c: any) => c.granted);
      const totalCategories = Object.keys(categories).length;
      
      let overallStatus: ConsentSummary['overallStatus'];
      if (grantedCategories.length === 0) {
        overallStatus = 'NO_CONSENT';
      } else if (grantedCategories.length === totalCategories) {
        overallStatus = 'FULL_CONSENT';
      } else {
        overallStatus = 'PARTIAL_CONSENT';
      }

      // Check for any withdrawn consents
      const hasWithdrawn = consentRecords.some(r => r.status === 'WITHDRAWN');
      if (hasWithdrawn && grantedCategories.length === 0) {
        overallStatus = 'WITHDRAWN';
      }

      // Calculate next review date
      const lastUpdated = consentRecords.length > 0 
        ? consentRecords[0].createdAt 
        : new Date();
      
      const nextReview = new Date(lastUpdated.getTime() + CONSENT_CONFIG.reminderDays * 24 * 60 * 60 * 1000);

      // Calculate compliance score
      const complianceScore = this.calculateConsentComplianceScore(categories);

      return {
        userId,
        siteId,
        overallStatus,
        categories,
        lastUpdated,
        nextReview,
        complianceScore,
      };

    } catch (error) {
      console.error('Error getting consent summary:', error);
      throw new Error(`Failed to get consent summary: ${error.message}`);
    }
  }

  /**
   * Update multiple consents
   */
  async updateConsents(
    updateData: z.infer<typeof consentUpdateSchema>
  ): Promise<ConsentRecord[]> {
    try {
      const validatedData = consentUpdateSchema.parse(updateData);
      const updatedConsents: ConsentRecord[] = [];

      for (const consent of validatedData.consents) {
        const consentRecord = await this.recordConsent({
          userId: validatedData.userId,
          siteId: validatedData.siteId,
          category: consent.category as any,
          purpose: consent.purpose,
          legalBasis: consent.legalBasis as any,
          granted: consent.granted,
          consentMethod: 'EXPLICIT',
          dataTypes: [],
          processingPurposes: [consent.purpose],
          consentVersion: CONSENT_CONFIG.consentVersion,
        });

        updatedConsents.push(consentRecord);
      }

      // Log bulk update
      await this.logConsentEvent({
        type: 'CONSENT_BULK_UPDATE',
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        metadata: {
          updateCount: updatedConsents.length,
          reason: validatedData.updateReason,
          categories: validatedData.consents.map(c => c.category),
        },
      });

      return updatedConsents;

    } catch (error) {
      throw new Error(`Failed to update consents: ${error.message}`);
    }
  }

  /**
   * Check if user has valid consent for specific purpose
   */
  async hasValidConsent(
    userId: string,
    siteId: string,
    category: string,
    purpose?: string
  ): Promise<{
    hasConsent: boolean;
    consentRecord?: ConsentRecord;
    expiresAt?: Date;
    reason?: string;
  }> {
    try {
      const consent = await prisma.complianceRecord.findFirst({
        where: {
          userId,
          siteId,
          type: 'GDPR_CONSENT',
          requirement: `${category}_CONSENT`,
          status: 'COMPLIANT',
          expiryDate: { gt: new Date() }, // Not expired
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!consent) {
        return {
          hasConsent: false,
          reason: 'No valid consent found',
        };
      }

      const evidence = consent.evidence as any;
      
      // Check specific purpose if provided
      if (purpose && evidence.processingPurposes && !evidence.processingPurposes.includes(purpose)) {
        return {
          hasConsent: false,
          reason: 'Consent not granted for this specific purpose',
        };
      }

      return {
        hasConsent: true,
        consentRecord: {
          id: consent.id,
          userId,
          siteId,
          category: evidence.category,
          purpose: evidence.purpose,
          legalBasis: evidence.legalBasis,
          granted: true,
          consentMethod: evidence.consentMethod,
          dataTypes: evidence.dataTypes || [],
          processingPurposes: evidence.processingPurposes || [],
          retentionPeriod: consent.metadata?.retentionPeriod,
          thirdParties: evidence.thirdParties,
          specialCategory: evidence.specialCategory,
          consentDate: consent.createdAt,
          expiryDate: consent.expiryDate || undefined,
          version: evidence.version,
          metadata: consent.metadata as Record<string, any>,
        },
        expiresAt: consent.expiryDate || undefined,
      };

    } catch (error) {
      console.error('Error checking consent:', error);
      return {
        hasConsent: false,
        reason: 'Error checking consent',
      };
    }
  }

  /**
   * Get consent renewal reminders
   */
  async getConsentRenewalReminders(siteId: string): Promise<Array<{
    userId: string;
    category: string;
    expiresAt: Date;
    daysUntilExpiry: number;
    userEmail?: string;
  }>> {
    try {
      const reminderDate = new Date(Date.now() + CONSENT_CONFIG.reminderDays * 24 * 60 * 60 * 1000);

      const expiringConsents = await prisma.complianceRecord.findMany({
        where: {
          siteId,
          type: 'GDPR_CONSENT',
          status: 'COMPLIANT',
          expiryDate: {
            gte: new Date(),
            lte: reminderDate,
          },
        },
        include: {
          user: {
            select: { email: true },
          },
        },
      });

      return expiringConsents.map(consent => {
        const evidence = consent.evidence as any;
        const daysUntilExpiry = Math.ceil(
          (consent.expiryDate!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        return {
          userId: consent.userId!,
          category: evidence?.category || 'UNKNOWN',
          expiresAt: consent.expiryDate!,
          daysUntilExpiry,
          userEmail: consent.user?.email,
        };
      });

    } catch (error) {
      console.error('Error getting renewal reminders:', error);
      return [];
    }
  }

  // Helper methods

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private async updateUserConsentPreferences(
    userId: string,
    siteId: string,
    category: string,
    granted: boolean
  ): Promise<void> {
    try {
      const profile = await prisma.userSecurityProfile.findUnique({
        where: { userId },
      });

      const currentPreferences = (profile?.consentPreferences as Record<string, any>) || {};
      currentPreferences[category] = {
        granted,
        updatedAt: new Date().toISOString(),
      };

      await prisma.userSecurityProfile.upsert({
        where: { userId },
        create: {
          userId,
          siteId,
          mfaEnabled: false,
          riskScore: 0,
          consentGiven: granted,
          consentDate: new Date(),
          consentPreferences: currentPreferences,
        },
        update: {
          consentGiven: granted,
          consentDate: new Date(),
          consentPreferences: currentPreferences,
        },
      });
    } catch (error) {
      console.error('Error updating consent preferences:', error);
    }
  }

  private async scheduleDataDeletion(
    userId: string,
    siteId: string,
    consentIds: string[],
    effectiveDate: Date
  ): Promise<void> {
    // Create data deletion request
    await prisma.auditLog.create({
      data: {
        siteId,
        userId,
        action: 'CREATE',
        resource: 'data_deletion_request',
        resourceType: 'gdpr_request',
        description: 'User requested data deletion after consent withdrawal',
        status: 'PENDING',
        metadata: {
          type: 'GDPR_DELETION',
          consentIds,
          effectiveDate: effectiveDate.toISOString(),
          scheduledFor: new Date(effectiveDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours grace period
        },
      },
    });
  }

  private calculateConsentComplianceScore(categories: Record<string, any>): number {
    const totalCategories = Object.keys(categories).length;
    if (totalCategories === 0) return 0;

    const grantedCategories = Object.values(categories).filter((c: any) => c.granted).length;
    return Math.round((grantedCategories / totalCategories) * 100);
  }

  private async logConsentEvent(data: {
    type: string;
    userId: string;
    siteId: string;
    category?: string;
    granted?: boolean;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'GDPR_CONSENT',
          severity: 'INFO',
          title: `GDPR Consent ${data.type}`,
          description: `GDPR consent event: ${data.type}`,
          userId: data.userId,
          siteId: data.siteId,
          metadata: {
            consentType: data.type,
            category: data.category,
            granted: data.granted,
            ...data.metadata,
          },
          success: !data.type.includes('ERROR'),
        },
      });
    } catch (error) {
      console.error('Failed to log consent event:', error);
    }
  }

  private async createConsentAuditLog(data: {
    userId: string;
    siteId: string;
    action: string;
    details: string;
    consentId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          siteId: data.siteId,
          userId: data.userId,
          action: data.action,
          resource: 'gdpr_consent',
          resourceType: 'consent',
          description: data.details,
          status: 'SUCCESS',
          metadata: {
            consentId: data.consentId,
            gdprCompliance: true,
            ...data.metadata,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create consent audit log:', error);
    }
  }
}

// Export singleton instance
export const gdprConsentService = new GDPRConsentManagementService();

// Export types
export type {
  ConsentRecord,
  ConsentSummary,
}; 