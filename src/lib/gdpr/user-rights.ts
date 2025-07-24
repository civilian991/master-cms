import { prisma } from '../prisma';
import { databaseEncryption } from '../encryption/database-encryption';
import { dataAnonymizationService } from './data-anonymization';
import { z } from 'zod';
import JSZip from 'jszip';

// GDPR rights configuration
const GDPR_RIGHTS_CONFIG = {
  requestTypes: [
    'ACCESS', // Article 15 - Right of access
    'RECTIFICATION', // Article 16 - Right to rectification
    'ERASURE', // Article 17 - Right to erasure (right to be forgotten)
    'RESTRICT_PROCESSING', // Article 18 - Right to restriction of processing
    'DATA_PORTABILITY', // Article 20 - Right to data portability
    'OBJECT', // Article 21 - Right to object
    'AUTOMATED_DECISION', // Article 22 - Rights related to automated decision-making
  ],
  responseTimedays: 30, // GDPR mandated response time
  urgentResponseDays: 72, // For urgent requests (e.g., data breaches)
  dataCategories: [
    'PERSONAL_DATA', // Basic personal information
    'ACCOUNT_DATA', // Account settings and preferences
    'CONTENT_DATA', // User-generated content
    'BEHAVIORAL_DATA', // Usage patterns and analytics
    'TECHNICAL_DATA', // IP addresses, device info, etc.
    'COMMUNICATION_DATA', // Messages, comments, etc.
    'FINANCIAL_DATA', // Payment and billing information
    'SPECIAL_CATEGORY', // Sensitive personal data
  ],
  exportFormats: ['JSON', 'CSV', 'XML', 'PDF'],
  verificationMethods: ['EMAIL', 'SMS', 'DOCUMENT_UPLOAD', 'VIDEO_CALL'],
} as const;

// Validation schemas
export const gdprRequestSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  requestType: z.enum(['ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICT_PROCESSING', 'DATA_PORTABILITY', 'OBJECT', 'AUTOMATED_DECISION']),
  description: z.string().optional(),
  dataCategories: z.array(z.enum(['PERSONAL_DATA', 'ACCOUNT_DATA', 'CONTENT_DATA', 'BEHAVIORAL_DATA', 'TECHNICAL_DATA', 'COMMUNICATION_DATA', 'FINANCIAL_DATA', 'SPECIAL_CATEGORY'])).optional(),
  specificData: z.array(z.string()).optional(),
  urgentRequest: z.boolean().default(false),
  verificationMethod: z.enum(['EMAIL', 'SMS', 'DOCUMENT_UPLOAD', 'VIDEO_CALL']).optional(),
  submittedBy: z.string(), // User ID of person submitting (could be different from subject)
  legalBasis: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export const dataRectificationSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  requestId: z.string(),
  corrections: z.array(z.object({
    field: z.string(),
    currentValue: z.string(),
    correctedValue: z.string(),
    reason: z.string(),
  })),
  justification: z.string(),
  supportingDocuments: z.array(z.string()).optional(),
});

export const dataPortabilitySchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  requestId: z.string(),
  format: z.enum(['JSON', 'CSV', 'XML', 'PDF']),
  dataCategories: z.array(z.string()),
  includeMetadata: z.boolean().default(true),
  transferToController: z.string().optional(),
});

// User rights interfaces
interface GDPRRequest {
  id: string;
  userId: string;
  siteId: string;
  requestType: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
  submittedAt: Date;
  responseDeadline: Date;
  completedAt?: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verificationMethod?: string;
  dataCategories: string[];
  metadata: Record<string, any>;
}

interface DataExportPackage {
  requestId: string;
  userId: string;
  format: string;
  generatedAt: Date;
  expiresAt: Date;
  downloadUrl: string;
  fileSize: number;
  dataCategories: string[];
  recordCounts: Record<string, number>;
  checksum: string;
}

// GDPR User Rights Management Service
export class GDPRUserRightsService {

  /**
   * Submit a GDPR rights request
   */
  async submitGDPRRequest(
    requestData: z.infer<typeof gdprRequestSchema>
  ): Promise<GDPRRequest> {
    try {
      // Validate request data
      const validatedData = gdprRequestSchema.parse(requestData);

      // Calculate response deadline
      const responseDeadline = new Date();
      responseDeadline.setDate(
        responseDeadline.getDate() + 
        (validatedData.urgentRequest ? GDPR_RIGHTS_CONFIG.urgentResponseDays : GDPR_RIGHTS_CONFIG.responseTimedays)
      );

      // Create request record
      const request = await prisma.auditLog.create({
        data: {
          siteId: validatedData.siteId,
          userId: validatedData.userId,
          action: 'CREATE',
          resource: 'gdpr_request',
          resourceType: 'gdpr_rights',
          description: `GDPR ${validatedData.requestType} request submitted`,
          status: 'PENDING',
          metadata: {
            requestType: validatedData.requestType,
            description: validatedData.description,
            dataCategories: validatedData.dataCategories || [],
            specificData: validatedData.specificData || [],
            urgentRequest: validatedData.urgentRequest,
            verificationMethod: validatedData.verificationMethod,
            submittedBy: validatedData.submittedBy,
            legalBasis: validatedData.legalBasis,
            contactEmail: validatedData.contactEmail,
            contactPhone: validatedData.contactPhone,
            responseDeadline: responseDeadline.toISOString(),
            verificationStatus: 'PENDING',
          },
        },
      });

      // Initialize verification process
      if (validatedData.verificationMethod) {
        await this.initiateVerification(
          request.id,
          validatedData.userId,
          validatedData.verificationMethod
        );
      }

      // Log security event
      await this.logGDPREvent({
        type: 'GDPR_REQUEST_SUBMITTED',
        requestType: validatedData.requestType,
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        metadata: {
          requestId: request.id,
          urgent: validatedData.urgentRequest,
          dataCategories: validatedData.dataCategories,
        },
      });

      // Send confirmation email
      await this.sendRequestConfirmation(request.id, validatedData);

      return {
        id: request.id,
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        requestType: validatedData.requestType,
        description: validatedData.description,
        status: 'PENDING',
        submittedAt: request.createdAt,
        responseDeadline,
        verificationStatus: 'PENDING',
        verificationMethod: validatedData.verificationMethod,
        dataCategories: validatedData.dataCategories || [],
        metadata: request.metadata as Record<string, any>,
      };

    } catch (error) {
      await this.logGDPREvent({
        type: 'GDPR_REQUEST_FAILED',
        requestType: requestData.requestType,
        userId: requestData.userId,
        siteId: requestData.siteId,
        metadata: { error: error.message },
      });
      throw new Error(`Failed to submit GDPR request: ${error.message}`);
    }
  }

  /**
   * Process data access request (Article 15)
   */
  async processAccessRequest(requestId: string): Promise<{
    success: boolean;
    dataPackage?: DataExportPackage;
    message: string;
  }> {
    try {
      // Get request details
      const request = await this.getGDPRRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.verificationStatus !== 'VERIFIED') {
        throw new Error('Request must be verified before processing');
      }

      // Update request status
      await this.updateRequestStatus(requestId, 'IN_PROGRESS');

      // Collect user data
      const userData = await this.collectUserData(
        request.userId,
        request.siteId,
        request.dataCategories
      );

      // Create data export package
      const dataPackage = await this.createDataExportPackage(
        requestId,
        request.userId,
        userData,
        'JSON',
        true
      );

      // Update request status
      await this.updateRequestStatus(requestId, 'COMPLETED');

      // Log completion
      await this.logGDPREvent({
        type: 'ACCESS_REQUEST_COMPLETED',
        requestType: 'ACCESS',
        userId: request.userId,
        siteId: request.siteId,
        metadata: {
          requestId,
          packageId: dataPackage.requestId,
          recordCounts: dataPackage.recordCounts,
        },
      });

      return {
        success: true,
        dataPackage,
        message: 'Data access request completed successfully',
      };

    } catch (error) {
      await this.updateRequestStatus(requestId, 'REJECTED');
      await this.logGDPREvent({
        type: 'ACCESS_REQUEST_FAILED',
        requestType: 'ACCESS',
        userId: '',
        siteId: '',
        metadata: { requestId, error: error.message },
      });
      throw new Error(`Failed to process access request: ${error.message}`);
    }
  }

  /**
   * Process data rectification request (Article 16)
   */
  async processRectificationRequest(
    rectificationData: z.infer<typeof dataRectificationSchema>
  ): Promise<{
    success: boolean;
    correctionsMade: number;
    message: string;
  }> {
    try {
      const validatedData = dataRectificationSchema.parse(rectificationData);

      // Verify request exists and is verified
      const request = await this.getGDPRRequest(validatedData.requestId);
      if (!request || request.verificationStatus !== 'VERIFIED') {
        throw new Error('Invalid or unverified request');
      }

      // Update request status
      await this.updateRequestStatus(validatedData.requestId, 'IN_PROGRESS');

      let correctionsMade = 0;

      // Process each correction
      for (const correction of validatedData.corrections) {
        try {
          // Validate current value matches what user claims
          const currentData = await this.getUserFieldValue(
            validatedData.userId,
            correction.field
          );

          if (currentData !== correction.currentValue) {
            continue; // Skip if current value doesn't match
          }

          // Apply correction
          await this.updateUserFieldValue(
            validatedData.userId,
            correction.field,
            correction.correctedValue
          );

          // Log correction
          await this.logDataCorrection({
            userId: validatedData.userId,
            siteId: validatedData.siteId,
            requestId: validatedData.requestId,
            field: correction.field,
            oldValue: correction.currentValue,
            newValue: correction.correctedValue,
            reason: correction.reason,
          });

          correctionsMade++;

        } catch (correctionError) {
          console.error(`Failed to correct field ${correction.field}:`, correctionError);
        }
      }

      // Update request status
      await this.updateRequestStatus(validatedData.requestId, 'COMPLETED');

      // Log completion
      await this.logGDPREvent({
        type: 'RECTIFICATION_REQUEST_COMPLETED',
        requestType: 'RECTIFICATION',
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        metadata: {
          requestId: validatedData.requestId,
          correctionsMade,
          totalRequested: validatedData.corrections.length,
        },
      });

      return {
        success: true,
        correctionsMade,
        message: `${correctionsMade} corrections applied successfully`,
      };

    } catch (error) {
      await this.updateRequestStatus(rectificationData.requestId, 'REJECTED');
      throw new Error(`Failed to process rectification request: ${error.message}`);
    }
  }

  /**
   * Process data erasure request (Article 17 - Right to be forgotten)
   */
  async processErasureRequest(requestId: string): Promise<{
    success: boolean;
    deletedRecords: number;
    anonymizedRecords: number;
    message: string;
  }> {
    try {
      // Get request details
      const request = await this.getGDPRRequest(requestId);
      if (!request || request.verificationStatus !== 'VERIFIED') {
        throw new Error('Invalid or unverified request');
      }

      // Update request status
      await this.updateRequestStatus(requestId, 'IN_PROGRESS');

      let deletedRecords = 0;
      let anonymizedRecords = 0;

      // Check for legal obligations to retain data
      const retentionRequirements = await this.checkRetentionRequirements(
        request.userId,
        request.siteId
      );

      if (retentionRequirements.cannotDelete.length > 0) {
        // Anonymize instead of delete where legally required
        const anonymizationResult = await dataAnonymizationService.anonymizeData({
          dataType: 'USER_DATA',
          technique: 'PSEUDONYMIZATION',
          siteId: request.siteId,
          userId: request.userId,
          fields: retentionRequirements.cannotDelete,
          retainMapping: false,
          auditTrail: true,
        });

        anonymizedRecords = anonymizationResult.recordsProcessed;
      }

      // Delete data that can be safely removed
      if (retentionRequirements.canDelete.length > 0) {
        deletedRecords = await this.deleteUserData(
          request.userId,
          request.siteId,
          retentionRequirements.canDelete
        );
      }

      // Update user account status
      await this.markAccountForDeletion(request.userId);

      // Update request status
      await this.updateRequestStatus(requestId, 'COMPLETED');

      // Log completion
      await this.logGDPREvent({
        type: 'ERASURE_REQUEST_COMPLETED',
        requestType: 'ERASURE',
        userId: request.userId,
        siteId: request.siteId,
        metadata: {
          requestId,
          deletedRecords,
          anonymizedRecords,
          retentionRequirements,
        },
      });

      return {
        success: true,
        deletedRecords,
        anonymizedRecords,
        message: `Data erasure completed: ${deletedRecords} records deleted, ${anonymizedRecords} records anonymized`,
      };

    } catch (error) {
      await this.updateRequestStatus(requestId, 'REJECTED');
      throw new Error(`Failed to process erasure request: ${error.message}`);
    }
  }

  /**
   * Process data portability request (Article 20)
   */
  async processPortabilityRequest(
    portabilityData: z.infer<typeof dataPortabilitySchema>
  ): Promise<DataExportPackage> {
    try {
      const validatedData = dataPortabilitySchema.parse(portabilityData);

      // Verify request
      const request = await this.getGDPRRequest(validatedData.requestId);
      if (!request || request.verificationStatus !== 'VERIFIED') {
        throw new Error('Invalid or unverified request');
      }

      // Update request status
      await this.updateRequestStatus(validatedData.requestId, 'IN_PROGRESS');

      // Collect portable data (structured, commonly used formats)
      const portableData = await this.collectPortableData(
        validatedData.userId,
        validatedData.siteId,
        validatedData.dataCategories
      );

      // Create export package
      const dataPackage = await this.createDataExportPackage(
        validatedData.requestId,
        validatedData.userId,
        portableData,
        validatedData.format,
        validatedData.includeMetadata
      );

      // If transferring to another controller, prepare secure transfer
      if (validatedData.transferToController) {
        await this.prepareSecureTransfer(
          dataPackage,
          validatedData.transferToController
        );
      }

      // Update request status
      await this.updateRequestStatus(validatedData.requestId, 'COMPLETED');

      // Log completion
      await this.logGDPREvent({
        type: 'PORTABILITY_REQUEST_COMPLETED',
        requestType: 'DATA_PORTABILITY',
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        metadata: {
          requestId: validatedData.requestId,
          format: validatedData.format,
          transferTo: validatedData.transferToController,
          recordCounts: dataPackage.recordCounts,
        },
      });

      return dataPackage;

    } catch (error) {
      await this.updateRequestStatus(portabilityData.requestId, 'REJECTED');
      throw new Error(`Failed to process portability request: ${error.message}`);
    }
  }

  /**
   * Get user's GDPR requests
   */
  async getUserGDPRRequests(userId: string, siteId: string): Promise<GDPRRequest[]> {
    try {
      const requests = await prisma.auditLog.findMany({
        where: {
          userId,
          siteId,
          resourceType: 'gdpr_rights',
          action: 'CREATE',
        },
        orderBy: { createdAt: 'desc' },
      });

      return requests.map(request => {
        const metadata = request.metadata as any;
        return {
          id: request.id,
          userId: request.userId!,
          siteId: request.siteId,
          requestType: metadata.requestType,
          description: metadata.description,
          status: request.status as any,
          submittedAt: request.createdAt,
          responseDeadline: new Date(metadata.responseDeadline),
          completedAt: request.updatedAt,
          verificationStatus: metadata.verificationStatus,
          verificationMethod: metadata.verificationMethod,
          dataCategories: metadata.dataCategories || [],
          metadata,
        };
      });

    } catch (error) {
      console.error('Error getting user GDPR requests:', error);
      return [];
    }
  }

  // Helper methods

  private async getGDPRRequest(requestId: string): Promise<GDPRRequest | null> {
    const request = await prisma.auditLog.findUnique({
      where: { id: requestId },
    });

    if (!request) return null;

    const metadata = request.metadata as any;
    return {
      id: request.id,
      userId: request.userId!,
      siteId: request.siteId,
      requestType: metadata.requestType,
      description: metadata.description,
      status: request.status as any,
      submittedAt: request.createdAt,
      responseDeadline: new Date(metadata.responseDeadline),
      completedAt: request.updatedAt,
      verificationStatus: metadata.verificationStatus,
      verificationMethod: metadata.verificationMethod,
      dataCategories: metadata.dataCategories || [],
      metadata,
    };
  }

  private async updateRequestStatus(requestId: string, status: string): Promise<void> {
    await prisma.auditLog.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  private async initiateVerification(
    requestId: string,
    userId: string,
    method: string
  ): Promise<void> {
    // Implementation would initiate verification process based on method
    console.log(`Initiating ${method} verification for request ${requestId}`);
  }

  private async sendRequestConfirmation(
    requestId: string,
    requestData: any
  ): Promise<void> {
    // Implementation would send confirmation email/SMS
    console.log(`Sending confirmation for request ${requestId}`);
  }

  private async collectUserData(
    userId: string,
    siteId: string,
    dataCategories: string[]
  ): Promise<any> {
    const userData: any = {};

    for (const category of dataCategories) {
      switch (category) {
        case 'PERSONAL_DATA':
          userData.personalData = await this.getPersonalData(userId);
          break;
        case 'ACCOUNT_DATA':
          userData.accountData = await this.getAccountData(userId);
          break;
        case 'CONTENT_DATA':
          userData.contentData = await this.getContentData(userId, siteId);
          break;
        case 'BEHAVIORAL_DATA':
          userData.behavioralData = await this.getBehavioralData(userId, siteId);
          break;
        case 'TECHNICAL_DATA':
          userData.technicalData = await this.getTechnicalData(userId, siteId);
          break;
        case 'COMMUNICATION_DATA':
          userData.communicationData = await this.getCommunicationData(userId, siteId);
          break;
        case 'FINANCIAL_DATA':
          userData.financialData = await this.getFinancialData(userId, siteId);
          break;
        case 'SPECIAL_CATEGORY':
          userData.specialCategoryData = await this.getSpecialCategoryData(userId, siteId);
          break;
      }
    }

    return userData;
  }

  private async getPersonalData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Decrypt sensitive fields
    const decryptedUser = await databaseEncryption.decryptUserData(
      user,
      userId,
      user.siteId
    );

    return {
      id: decryptedUser.id,
      name: decryptedUser.name,
      email: decryptedUser.email,
      createdAt: decryptedUser.createdAt,
      updatedAt: decryptedUser.updatedAt,
      // Additional fields as needed
    };
  }

  private async getAccountData(userId: string): Promise<any> {
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { userId },
    });

    return {
      securitySettings: profile ? {
        mfaEnabled: profile.mfaEnabled,
        lastLoginAt: profile.lastLoginAt,
        activeSessions: profile.activeSessions,
        consentPreferences: profile.consentPreferences,
      } : null,
    };
  }

  private async getContentData(userId: string, siteId: string): Promise<any> {
    // Get user-generated content (articles, comments, etc.)
    // Implementation depends on content models
    return {};
  }

  private async getBehavioralData(userId: string, siteId: string): Promise<any> {
    const events = await prisma.securityEvent.findMany({
      where: { userId, siteId },
      select: {
        eventType: true,
        createdAt: true,
        metadata: true,
      },
    });

    return { events };
  }

  private async getTechnicalData(userId: string, siteId: string): Promise<any> {
    const sessions = await prisma.userSecuritySession.findMany({
      where: {
        profile: { userId },
        siteId,
      },
      select: {
        ipAddress: true,
        userAgent: true,
        location: true,
        createdAt: true,
      },
    });

    return { sessions };
  }

  private async getCommunicationData(userId: string, siteId: string): Promise<any> {
    // Get communication data (messages, notifications, etc.)
    return {};
  }

  private async getFinancialData(userId: string, siteId: string): Promise<any> {
    // Get financial/billing data
    return {};
  }

  private async getSpecialCategoryData(userId: string, siteId: string): Promise<any> {
    // Get special category data (health, genetic, biometric, etc.)
    return {};
  }

  private async collectPortableData(
    userId: string,
    siteId: string,
    dataCategories: string[]
  ): Promise<any> {
    // Collect data in machine-readable format for portability
    return await this.collectUserData(userId, siteId, dataCategories);
  }

  private async createDataExportPackage(
    requestId: string,
    userId: string,
    userData: any,
    format: string,
    includeMetadata: boolean
  ): Promise<DataExportPackage> {
    const zip = new JSZip();
    const recordCounts: Record<string, number> = {};

    // Add data files to zip
    for (const [category, data] of Object.entries(userData)) {
      if (data && typeof data === 'object') {
        let content: string;
        
        switch (format) {
          case 'JSON':
            content = JSON.stringify(data, null, 2);
            zip.file(`${category}.json`, content);
            break;
          case 'CSV':
            content = this.convertToCSV(data);
            zip.file(`${category}.csv`, content);
            break;
          case 'XML':
            content = this.convertToXML(data);
            zip.file(`${category}.xml`, content);
            break;
        }

        recordCounts[category] = Array.isArray(data) ? data.length : 1;
      }
    }

    // Add metadata file
    if (includeMetadata) {
      const metadata = {
        exportedAt: new Date().toISOString(),
        requestId,
        userId,
        format,
        dataCategories: Object.keys(userData),
        recordCounts,
        gdprCompliant: true,
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(zipBuffer)
      .digest('hex');

    // Save to secure location (implementation needed)
    const downloadUrl = await this.saveExportPackage(requestId, zipBuffer);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return {
      requestId,
      userId,
      format,
      generatedAt: new Date(),
      expiresAt,
      downloadUrl,
      fileSize: zipBuffer.length,
      dataCategories: Object.keys(userData),
      recordCounts,
      checksum,
    };
  }

  private async prepareSecureTransfer(
    dataPackage: DataExportPackage,
    targetController: string
  ): Promise<void> {
    // Implementation for secure data transfer to another controller
    console.log(`Preparing secure transfer to ${targetController}`);
  }

  private async checkRetentionRequirements(
    userId: string,
    siteId: string
  ): Promise<{
    canDelete: string[];
    cannotDelete: string[];
    reasons: Record<string, string>;
  }> {
    // Check legal obligations, contracts, etc. that require data retention
    return {
      canDelete: ['email', 'phone', 'address'],
      cannotDelete: ['id', 'createdAt'], // Required for audit trails
      reasons: {
        id: 'Required for audit compliance',
        createdAt: 'Required for legal obligations',
      },
    };
  }

  private async deleteUserData(
    userId: string,
    siteId: string,
    fieldsToDelete: string[]
  ): Promise<number> {
    // Implementation to safely delete specified user data
    let deletedRecords = 0;

    try {
      // Update user record
      const updateData: any = {};
      fieldsToDelete.forEach(field => {
        updateData[field] = null;
      });

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      deletedRecords++;

      // Delete related records as needed
      // Implementation depends on data model

    } catch (error) {
      console.error('Error deleting user data:', error);
    }

    return deletedRecords;
  }

  private async markAccountForDeletion(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Mark account as deleted but retain for audit purposes
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });
  }

  private async getUserFieldValue(userId: string, field: string): Promise<any> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? (user as any)[field] : null;
  }

  private async updateUserFieldValue(
    userId: string,
    field: string,
    value: any
  ): Promise<void> {
    const updateData = { [field]: value };
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private async logDataCorrection(data: {
    userId: string;
    siteId: string;
    requestId: string;
    field: string;
    oldValue: string;
    newValue: string;
    reason: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        siteId: data.siteId,
        userId: data.userId,
        action: 'UPDATE',
        resource: 'user_data',
        resourceType: 'data_correction',
        description: `Data corrected for field ${data.field}`,
        status: 'SUCCESS',
        metadata: {
          requestId: data.requestId,
          field: data.field,
          oldValue: data.oldValue,
          newValue: data.newValue,
          reason: data.reason,
          gdprCompliance: true,
        },
      },
    });
  }

  private async saveExportPackage(requestId: string, zipBuffer: Buffer): Promise<string> {
    // Implementation to save export package securely and return download URL
    // This would typically involve cloud storage with temporary signed URLs
    return `https://secure-downloads.example.com/${requestId}/data-export.zip`;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - production would use proper CSV library
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    }
    
    return Object.entries(data).map(([key, value]) => `${key},${value}`).join('\n');
  }

  private convertToXML(data: any): string {
    // Simple XML conversion - production would use proper XML library
    const xmlItems: string[] = [];
    
    if (Array.isArray(data)) {
      xmlItems.push('<items>');
      for (const item of data) {
        xmlItems.push('  <item>');
        for (const [key, value] of Object.entries(item)) {
          xmlItems.push(`    <${key}>${this.escapeXml(String(value))}</${key}>`);
        }
        xmlItems.push('  </item>');
      }
      xmlItems.push('</items>');
    } else {
      xmlItems.push('<data>');
      for (const [key, value] of Object.entries(data)) {
        xmlItems.push(`  <${key}>${this.escapeXml(String(value))}</${key}>`);
      }
      xmlItems.push('</data>');
    }
    
    return xmlItems.join('\n');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async logGDPREvent(data: {
    type: string;
    requestType: string;
    userId: string;
    siteId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'GDPR_RIGHTS',
          severity: data.type.includes('FAILED') ? 'HIGH' : 'INFO',
          title: `GDPR ${data.requestType} ${data.type}`,
          description: `GDPR user rights event: ${data.type}`,
          userId: data.userId || undefined,
          siteId: data.siteId || undefined,
          metadata: {
            gdprRequestType: data.requestType,
            eventType: data.type,
            ...data.metadata,
          },
          success: !data.type.includes('FAILED'),
        },
      });
    } catch (error) {
      console.error('Failed to log GDPR event:', error);
    }
  }
}

// Export singleton instance
export const gdprUserRightsService = new GDPRUserRightsService();

// Export types
export type {
  GDPRRequest,
  DataExportPackage,
}; 