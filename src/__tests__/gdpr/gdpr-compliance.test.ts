import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GDPRConsentManagementService } from '../../lib/gdpr/consent-management';
import { DataAnonymizationService } from '../../lib/gdpr/data-anonymization';
import { GDPRUserRightsService } from '../../lib/gdpr/user-rights';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userSecurityProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    complianceRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userSecuritySession: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../lib/encryption/database-encryption');
jest.mock('jszip');

import { prisma } from '../../lib/prisma';

describe('GDPR Compliance System', () => {
  let consentService: GDPRConsentManagementService;
  let anonymizationService: DataAnonymizationService;
  let userRightsService: GDPRUserRightsService;

  const mockUserId = 'user-123';
  const mockSiteId = 'site-123';

  beforeEach(() => {
    jest.clearAllMocks();
    consentService = new GDPRConsentManagementService();
    anonymizationService = new DataAnonymizationService();
    userRightsService = new GDPRUserRightsService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GDPR Consent Management', () => {
    describe('Consent Recording', () => {
      it('should record user consent successfully', async () => {
        // Mock user lookup
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: mockUserId,
          email: 'test@example.com',
          dateOfBirth: new Date('1990-01-01'), // Over 16 years old
        });

        // Mock compliance record creation
        (prisma.complianceRecord.create as jest.Mock).mockResolvedValue({
          id: 'consent-123',
          userId: mockUserId,
          siteId: mockSiteId,
          type: 'GDPR_CONSENT',
          status: 'COMPLIANT',
          createdAt: new Date(),
          metadata: {},
        });

        // Mock user security profile update
        (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({});

        // Mock audit log creation
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

        // Mock security event creation
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const consentData = {
          userId: mockUserId,
          siteId: mockSiteId,
          category: 'ANALYTICS' as const,
          purpose: 'Website analytics and performance monitoring',
          legalBasis: 'CONSENT' as const,
          granted: true,
          consentMethod: 'EXPLICIT' as const,
          dataTypes: ['page_views', 'click_events'],
          processingPurposes: ['analytics', 'performance_monitoring'],
          retentionPeriod: 365,
        };

        const result = await consentService.recordConsent(consentData);

        expect(result.id).toBe('consent-123');
        expect(result.category).toBe('ANALYTICS');
        expect(result.granted).toBe(true);
        expect(result.legalBasis).toBe('CONSENT');

        expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'GDPR_CONSENT',
              requirement: 'ANALYTICS_CONSENT',
              status: 'COMPLIANT',
            }),
          })
        );

        expect(prisma.securityEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              eventType: 'GDPR_CONSENT',
              title: 'GDPR Consent CONSENT_RECORDED',
            }),
          })
        );
      });

      it('should reject consent from underage users', async () => {
        // Mock underage user
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: mockUserId,
          email: 'child@example.com',
          dateOfBirth: new Date('2020-01-01'), // Under 16 years old
        });

        const consentData = {
          userId: mockUserId,
          siteId: mockSiteId,
          category: 'MARKETING' as const,
          purpose: 'Marketing communications',
          legalBasis: 'CONSENT' as const,
          granted: true,
          consentMethod: 'EXPLICIT' as const,
          dataTypes: ['email'],
          processingPurposes: ['marketing'],
        };

        await expect(consentService.recordConsent(consentData)).rejects.toThrow(
          'User must be at least 16 years old to provide consent'
        );
      });
    });

    describe('Consent Withdrawal', () => {
      it('should withdraw consent successfully', async () => {
        // Mock existing consent records
        (prisma.complianceRecord.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'consent-123',
            type: 'GDPR_CONSENT',
            status: 'COMPLIANT',
            evidence: { category: 'ANALYTICS' },
            metadata: {},
          },
        ]);

        // Mock consent update
        (prisma.complianceRecord.update as jest.Mock).mockResolvedValue({});

        // Mock user profile update
        (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({});

        // Mock audit and security logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

        const withdrawalData = {
          userId: mockUserId,
          siteId: mockSiteId,
          categories: ['ANALYTICS'],
          reason: 'No longer want analytics tracking',
          deletionRequested: true,
        };

        const result = await consentService.withdrawConsent(withdrawalData);

        expect(result.withdrawnConsents).toHaveLength(1);
        expect(result.withdrawnConsents[0]).toBe('consent-123');
        expect(result.deletionScheduled).toBe(true);

        expect(prisma.complianceRecord.update).toHaveBeenCalledWith({
          where: { id: 'consent-123' },
          data: expect.objectContaining({
            status: 'WITHDRAWN',
            metadata: expect.objectContaining({
              withdrawnDate: expect.any(String),
              deletionRequested: true,
            }),
          }),
        });
      });
    });

    describe('Consent Validation', () => {
      it('should validate existing consent correctly', async () => {
        // Mock valid consent record
        (prisma.complianceRecord.findFirst as jest.Mock).mockResolvedValue({
          id: 'consent-123',
          userId: mockUserId,
          siteId: mockSiteId,
          type: 'GDPR_CONSENT',
          requirement: 'ANALYTICS_CONSENT',
          status: 'COMPLIANT',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdAt: new Date(),
          evidence: {
            category: 'ANALYTICS',
            purpose: 'Website analytics',
            legalBasis: 'CONSENT',
            consentMethod: 'EXPLICIT',
            processingPurposes: ['analytics', 'performance'],
          },
          metadata: {},
        });

        const result = await consentService.hasValidConsent(
          mockUserId,
          mockSiteId,
          'ANALYTICS',
          'analytics'
        );

        expect(result.hasConsent).toBe(true);
        expect(result.consentRecord).toBeDefined();
        expect(result.consentRecord?.category).toBe('ANALYTICS');
        expect(result.expiresAt).toBeInstanceOf(Date);
      });

      it('should reject expired consent', async () => {
        // Mock expired consent record
        (prisma.complianceRecord.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await consentService.hasValidConsent(
          mockUserId,
          mockSiteId,
          'ANALYTICS'
        );

        expect(result.hasConsent).toBe(false);
        expect(result.reason).toBe('No valid consent found');
      });
    });

    describe('Consent Summary', () => {
      it('should generate comprehensive consent summary', async () => {
        // Mock consent records
        (prisma.complianceRecord.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'consent-1',
            status: 'COMPLIANT',
            createdAt: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            evidence: {
              category: 'ANALYTICS',
              consentMethod: 'EXPLICIT',
            },
          },
          {
            id: 'consent-2',
            status: 'COMPLIANT',
            createdAt: new Date(),
            expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            evidence: {
              category: 'MARKETING',
              consentMethod: 'OPT_IN',
            },
          },
          {
            id: 'consent-3',
            status: 'WITHDRAWN',
            createdAt: new Date(),
            evidence: {
              category: 'THIRD_PARTY',
              consentMethod: 'EXPLICIT',
            },
          },
        ]);

        const summary = await consentService.getUserConsentSummary(mockUserId, mockSiteId);

        expect(summary.userId).toBe(mockUserId);
        expect(summary.siteId).toBe(mockSiteId);
        expect(summary.overallStatus).toBe('PARTIAL_CONSENT');
        expect(summary.categories).toHaveProperty('ANALYTICS');
        expect(summary.categories).toHaveProperty('MARKETING');
        expect(summary.categories.ANALYTICS.granted).toBe(true);
        expect(summary.categories.MARKETING.granted).toBe(true);
        expect(summary.complianceScore).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Anonymization Service', () => {
    describe('Data Suppression', () => {
      it('should suppress sensitive data fields', async () => {
        // Mock user data update
        (prisma.user.update as jest.Mock).mockResolvedValue({});

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const request = {
          dataType: 'USER_DATA' as const,
          technique: 'SUPPRESSION' as const,
          siteId: mockSiteId,
          userId: mockUserId,
          fields: ['email', 'phone', 'address'],
        };

        const result = await anonymizationService.anonymizeData(request);

        expect(result.success).toBe(true);
        expect(result.technique).toBe('SUPPRESSION');
        expect(result.recordsProcessed).toBe(1);
        expect(result.fieldsAnonymized).toEqual(['email', 'phone', 'address']);
        expect(result.statistics.informationLoss).toBe(1.0); // Complete loss
        expect(result.statistics.privacyLevel).toBe(1.0); // Perfect privacy
        expect(result.warnings).toContain('Data permanently removed - irreversible operation');

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: mockUserId },
          data: {
            email: null,
            phone: null,
            address: null,
          },
        });
      });
    });

    describe('Pseudonymization', () => {
      it('should pseudonymize user data with mapping', async () => {
        // Mock user data
        const mockUserData = {
          id: mockUserId,
          email: 'test@example.com',
          phone: '+1234567890',
          name: 'John Doe',
        };

        anonymizationService['getUserData'] = jest.fn().mockResolvedValue(mockUserData);
        anonymizationService['storePseudonymizationMapping'] = jest.fn().mockResolvedValue(undefined);

        // Mock audit log
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

        const request = {
          userId: mockUserId,
          siteId: mockSiteId,
          fields: ['email', 'phone'],
          algorithm: 'HMAC_SHA256' as const,
          retainFormat: false,
          reversible: true,
        };

        const result = await anonymizationService.pseudonymizeUserData(request);

        expect(result.id).toBeDefined();
        expect(result.userId).toBe(mockUserId);
        expect(result.siteId).toBe(mockSiteId);
        expect(result.reversible).toBe(true);
        expect(result.algorithm).toBe('HMAC_SHA256');
        expect(result.fieldMappings).toHaveProperty('email');
        expect(result.fieldMappings).toHaveProperty('phone');
        expect(result.fieldMappings.email.original).toBe('test@example.com');
        expect(result.fieldMappings.email.pseudonym).toBeDefined();
        expect(result.fieldMappings.email.algorithm).toBe('HMAC_SHA256');
      });

      it('should pseudonymize without retaining original values', async () => {
        const mockUserData = {
          id: mockUserId,
          email: 'test@example.com',
          phone: '+1234567890',
        };

        anonymizationService['getUserData'] = jest.fn().mockResolvedValue(mockUserData);
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

        const request = {
          userId: mockUserId,
          siteId: mockSiteId,
          fields: ['email', 'phone'],
          algorithm: 'HMAC_SHA256' as const,
          retainFormat: false,
          reversible: false, // Don't retain original values
        };

        const result = await anonymizationService.pseudonymizeUserData(request);

        expect(result.reversible).toBe(false);
        expect(result.fieldMappings.email.original).toBe('[REDACTED]');
        expect(result.fieldMappings.phone.original).toBe('[REDACTED]');
      });
    });

    describe('Bulk Anonymization', () => {
      it('should process bulk anonymization request', async () => {
        // Mock records for anonymization
        anonymizationService['getRecordsForAnonymization'] = jest.fn()
          .mockResolvedValue([
            { id: 'user1', email: 'user1@example.com' },
            { id: 'user2', email: 'user2@example.com' },
            { id: 'user3', email: 'user3@example.com' },
          ]);

        // Mock batch processing
        anonymizationService['processBatch'] = jest.fn().mockResolvedValue({
          success: true,
          technique: 'PSEUDONYMIZATION',
          recordsProcessed: 3,
          fieldsAnonymized: ['email'],
          statistics: {
            originalDistinctValues: 3,
            anonymizedDistinctValues: 3,
            informationLoss: 0.9,
            privacyLevel: 0.95,
          },
          warnings: [],
        });

        // Mock audit logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const request = {
          siteId: mockSiteId,
          dataTypes: ['USER_DATA'],
          technique: 'PSEUDONYMIZATION',
          batchSize: 2,
        };

        const result = await anonymizationService.bulkAnonymizeData(request);

        expect(result.totalRecords).toBe(3);
        expect(result.processedRecords).toBe(6); // 2 batches of 3 records each
        expect(result.failedRecords).toBe(0);
        expect(result.batchResults).toHaveLength(2); // 2 batches
        expect(result.errors).toHaveLength(0);

        expect(anonymizationService['processBatch']).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('GDPR User Rights Service', () => {
    describe('Request Submission', () => {
      it('should submit data access request successfully', async () => {
        // Mock audit log creation
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({
          id: 'request-123',
          createdAt: new Date(),
          metadata: {},
        });

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const requestData = {
          userId: mockUserId,
          siteId: mockSiteId,
          requestType: 'ACCESS' as const,
          description: 'I want to access all my personal data',
          dataCategories: ['PERSONAL_DATA', 'ACCOUNT_DATA'] as const,
          urgentRequest: false,
          verificationMethod: 'EMAIL' as const,
          submittedBy: mockUserId,
          contactEmail: 'test@example.com',
        };

        const result = await userRightsService.submitGDPRRequest(requestData);

        expect(result.id).toBe('request-123');
        expect(result.requestType).toBe('ACCESS');
        expect(result.status).toBe('PENDING');
        expect(result.verificationStatus).toBe('PENDING');
        expect(result.dataCategories).toEqual(['PERSONAL_DATA', 'ACCOUNT_DATA']);

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'CREATE',
              resource: 'gdpr_request',
              resourceType: 'gdpr_rights',
              description: 'GDPR ACCESS request submitted',
            }),
          })
        );
      });

      it('should handle urgent requests with shorter deadline', async () => {
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({
          id: 'urgent-request-123',
          createdAt: new Date(),
          metadata: {},
        });

        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const requestData = {
          userId: mockUserId,
          siteId: mockSiteId,
          requestType: 'ERASURE' as const,
          description: 'Urgent data deletion request due to security breach',
          urgentRequest: true, // Urgent request
          submittedBy: mockUserId,
        };

        const result = await userRightsService.submitGDPRRequest(requestData);

        // Check that deadline is shorter for urgent requests (72 hours vs 30 days)
        const timeDiff = result.responseDeadline.getTime() - result.submittedAt.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        expect(hoursDiff).toBeLessThan(30 * 24); // Less than 30 days
        expect(hoursDiff).toBeLessThanOrEqual(72); // Should be 72 hours or less
      });
    });

    describe('Data Access Processing', () => {
      it('should process data access request and create export package', async () => {
        // Mock request lookup
        userRightsService['getGDPRRequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          userId: mockUserId,
          siteId: mockSiteId,
          requestType: 'ACCESS',
          verificationStatus: 'VERIFIED',
          dataCategories: ['PERSONAL_DATA', 'ACCOUNT_DATA'],
        });

        // Mock status updates
        userRightsService['updateRequestStatus'] = jest.fn().mockResolvedValue(undefined);

        // Mock data collection
        userRightsService['collectUserData'] = jest.fn().mockResolvedValue({
          personalData: { name: 'John Doe', email: 'john@example.com' },
          accountData: { preferences: { theme: 'dark' } },
        });

        // Mock export package creation
        userRightsService['createDataExportPackage'] = jest.fn().mockResolvedValue({
          requestId: 'request-123',
          userId: mockUserId,
          format: 'JSON',
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          downloadUrl: 'https://secure-downloads.example.com/request-123/data-export.zip',
          fileSize: 1024 * 1024, // 1MB
          dataCategories: ['personalData', 'accountData'],
          recordCounts: { personalData: 1, accountData: 1 },
          checksum: 'abc123def456',
        });

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const result = await userRightsService.processAccessRequest('request-123');

        expect(result.success).toBe(true);
        expect(result.dataPackage).toBeDefined();
        expect(result.dataPackage?.downloadUrl).toBe('https://secure-downloads.example.com/request-123/data-export.zip');
        expect(result.dataPackage?.dataCategories).toEqual(['personalData', 'accountData']);

        expect(userRightsService['updateRequestStatus']).toHaveBeenCalledWith('request-123', 'IN_PROGRESS');
        expect(userRightsService['updateRequestStatus']).toHaveBeenCalledWith('request-123', 'COMPLETED');
      });

      it('should reject processing unverified requests', async () => {
        userRightsService['getGDPRRequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          userId: mockUserId,
          verificationStatus: 'PENDING', // Not verified
        });

        await expect(
          userRightsService.processAccessRequest('request-123')
        ).rejects.toThrow('Request must be verified before processing');
      });
    });

    describe('Data Rectification', () => {
      it('should process data rectification request', async () => {
        // Mock request lookup
        userRightsService['getGDPRRequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          userId: mockUserId,
          verificationStatus: 'VERIFIED',
        });

        // Mock status updates
        userRightsService['updateRequestStatus'] = jest.fn().mockResolvedValue(undefined);

        // Mock field value checks and updates
        userRightsService['getUserFieldValue'] = jest.fn()
          .mockResolvedValueOnce('old-email@example.com') // Current email
          .mockResolvedValueOnce('John Smith'); // Current name

        userRightsService['updateUserFieldValue'] = jest.fn().mockResolvedValue(undefined);

        // Mock correction logging
        userRightsService['logDataCorrection'] = jest.fn().mockResolvedValue(undefined);

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const rectificationData = {
          userId: mockUserId,
          siteId: mockSiteId,
          requestId: 'request-123',
          corrections: [
            {
              field: 'email',
              currentValue: 'old-email@example.com',
              correctedValue: 'new-email@example.com',
              reason: 'Changed email address',
            },
            {
              field: 'name',
              currentValue: 'John Smith',
              correctedValue: 'John Johnson',
              reason: 'Legal name change',
            },
          ],
          justification: 'User requested data corrections',
        };

        const result = await userRightsService.processRectificationRequest(rectificationData);

        expect(result.success).toBe(true);
        expect(result.correctionsMade).toBe(2);
        expect(result.message).toBe('2 corrections applied successfully');

        expect(userRightsService['updateUserFieldValue']).toHaveBeenCalledWith(
          mockUserId,
          'email',
          'new-email@example.com'
        );
        expect(userRightsService['updateUserFieldValue']).toHaveBeenCalledWith(
          mockUserId,
          'name',
          'John Johnson'
        );
      });
    });

    describe('Data Erasure (Right to be Forgotten)', () => {
      it('should process data erasure request with proper retention checks', async () => {
        // Mock request lookup
        userRightsService['getGDPRRequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          userId: mockUserId,
          verificationStatus: 'VERIFIED',
        });

        // Mock status updates
        userRightsService['updateRequestStatus'] = jest.fn().mockResolvedValue(undefined);

        // Mock retention requirements check
        userRightsService['checkRetentionRequirements'] = jest.fn().mockResolvedValue({
          canDelete: ['email', 'phone', 'address'],
          cannotDelete: ['id', 'createdAt'],
          reasons: {
            id: 'Required for audit compliance',
            createdAt: 'Required for legal obligations',
          },
        });

        // Mock data anonymization
        const mockAnonymizationResult = {
          success: true,
          technique: 'PSEUDONYMIZATION',
          recordsProcessed: 1,
          fieldsAnonymized: ['id', 'createdAt'],
          statistics: {
            originalDistinctValues: 1,
            anonymizedDistinctValues: 1,
            informationLoss: 0.9,
            privacyLevel: 0.95,
          },
          warnings: [],
        };

        const { dataAnonymizationService } = await import('../../lib/gdpr/data-anonymization');
        dataAnonymizationService.anonymizeData = jest.fn().mockResolvedValue(mockAnonymizationResult);

        // Mock data deletion
        userRightsService['deleteUserData'] = jest.fn().mockResolvedValue(3);

        // Mock account marking
        userRightsService['markAccountForDeletion'] = jest.fn().mockResolvedValue(undefined);

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const result = await userRightsService.processErasureRequest('request-123');

        expect(result.success).toBe(true);
        expect(result.deletedRecords).toBe(3);
        expect(result.anonymizedRecords).toBe(1);
        expect(result.message).toContain('3 records deleted');
        expect(result.message).toContain('1 records anonymized');

        expect(dataAnonymizationService.anonymizeData).toHaveBeenCalledWith(
          expect.objectContaining({
            technique: 'PSEUDONYMIZATION',
            fields: ['id', 'createdAt'],
            retainMapping: false,
          })
        );
      });
    });

    describe('Data Portability', () => {
      it('should process data portability request with specified format', async () => {
        // Mock request lookup
        userRightsService['getGDPRRequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          userId: mockUserId,
          verificationStatus: 'VERIFIED',
        });

        // Mock status updates
        userRightsService['updateRequestStatus'] = jest.fn().mockResolvedValue(undefined);

        // Mock portable data collection
        userRightsService['collectPortableData'] = jest.fn().mockResolvedValue({
          personalData: { name: 'John Doe', email: 'john@example.com' },
          contentData: { articles: [{ title: 'My Article', content: 'Article content' }] },
        });

        // Mock export package creation
        userRightsService['createDataExportPackage'] = jest.fn().mockResolvedValue({
          requestId: 'request-123',
          userId: mockUserId,
          format: 'CSV',
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          downloadUrl: 'https://secure-downloads.example.com/request-123/portable-data.zip',
          fileSize: 2048,
          dataCategories: ['personalData', 'contentData'],
          recordCounts: { personalData: 1, contentData: 1 },
          checksum: 'def789ghi012',
        });

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const portabilityData = {
          userId: mockUserId,
          siteId: mockSiteId,
          requestId: 'request-123',
          format: 'CSV' as const,
          dataCategories: ['PERSONAL_DATA', 'CONTENT_DATA'],
          includeMetadata: true,
        };

        const result = await userRightsService.processPortabilityRequest(portabilityData);

        expect(result.format).toBe('CSV');
        expect(result.dataCategories).toEqual(['personalData', 'contentData']);
        expect(result.downloadUrl).toBe('https://secure-downloads.example.com/request-123/portable-data.zip');

        expect(userRightsService['collectPortableData']).toHaveBeenCalledWith(
          mockUserId,
          mockSiteId,
          ['PERSONAL_DATA', 'CONTENT_DATA']
        );
      });
    });

    describe('Request Management', () => {
      it('should get user GDPR requests', async () => {
        // Mock audit log query
        (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'request-1',
            userId: mockUserId,
            siteId: mockSiteId,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            status: 'COMPLETED',
            metadata: {
              requestType: 'ACCESS',
              description: 'Data access request',
              dataCategories: ['PERSONAL_DATA'],
              responseDeadline: new Date('2024-01-31').toISOString(),
              verificationStatus: 'VERIFIED',
            },
          },
          {
            id: 'request-2',
            userId: mockUserId,
            siteId: mockSiteId,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            status: 'PENDING',
            metadata: {
              requestType: 'ERASURE',
              description: 'Data deletion request',
              urgentRequest: true,
              responseDeadline: new Date('2024-01-18').toISOString(),
              verificationStatus: 'PENDING',
            },
          },
        ]);

        const requests = await userRightsService.getUserGDPRRequests(mockUserId, mockSiteId);

        expect(requests).toHaveLength(2);
        expect(requests[0].requestType).toBe('ACCESS');
        expect(requests[0].status).toBe('COMPLETED');
        expect(requests[1].requestType).toBe('ERASURE');
        expect(requests[1].status).toBe('PENDING');
        expect(requests[1].responseDeadline).toEqual(new Date('2024-01-18'));
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete GDPR compliance workflow', async () => {
      // 1. Record consent
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        dateOfBirth: new Date('1990-01-01'),
      });

      (prisma.complianceRecord.create as jest.Mock).mockResolvedValue({
        id: 'consent-123',
        createdAt: new Date(),
        metadata: {},
      });

      (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({});
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

      const consent = await consentService.recordConsent({
        userId: mockUserId,
        siteId: mockSiteId,
        category: 'ANALYTICS',
        purpose: 'Website analytics',
        legalBasis: 'CONSENT',
        granted: true,
        consentMethod: 'EXPLICIT',
        dataTypes: ['page_views'],
        processingPurposes: ['analytics'],
      });

      expect(consent.granted).toBe(true);

      // 2. Submit data access request
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'request-123',
        createdAt: new Date(),
        metadata: {},
      });

      const accessRequest = await userRightsService.submitGDPRRequest({
        userId: mockUserId,
        siteId: mockSiteId,
        requestType: 'ACCESS',
        description: 'I want to access my data',
        submittedBy: mockUserId,
      });

      expect(accessRequest.requestType).toBe('ACCESS');

      // 3. Later, withdraw consent and request deletion
      (prisma.complianceRecord.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'consent-123',
          evidence: { category: 'ANALYTICS' },
          metadata: {},
        },
      ]);

      (prisma.complianceRecord.update as jest.Mock).mockResolvedValue({});

      const withdrawal = await consentService.withdrawConsent({
        userId: mockUserId,
        siteId: mockSiteId,
        categories: ['ANALYTICS'],
        reason: 'Privacy concerns',
        deletionRequested: true,
      });

      expect(withdrawal.withdrawnConsents).toHaveLength(1);
      expect(withdrawal.deletionScheduled).toBe(true);

      // Verify all operations were logged properly
      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(3); // Consent, request, withdrawal
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(3); // Consent audit, request, deletion schedule
    });

    it('should handle GDPR compliance violations and corrections', async () => {
      // Simulate a compliance violation scenario

      // 1. Attempt to record consent for underage user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: 'child@example.com',
        dateOfBirth: new Date('2015-01-01'), // 9 years old
      });

      await expect(
        consentService.recordConsent({
          userId: mockUserId,
          siteId: mockSiteId,
          category: 'MARKETING',
          purpose: 'Marketing emails',
          legalBasis: 'CONSENT',
          granted: true,
          consentMethod: 'EXPLICIT',
          dataTypes: ['email'],
          processingPurposes: ['marketing'],
        })
      ).rejects.toThrow('User must be at least 16 years old');

      // 2. Process data with different legal basis for underage user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: 'child@example.com',
        dateOfBirth: new Date('2015-01-01'),
      });

      (prisma.complianceRecord.create as jest.Mock).mockResolvedValue({
        id: 'compliance-123',
        createdAt: new Date(),
        metadata: {},
      });

      (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({});
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

      // Use different legal basis for essential services
      const essentialConsent = await consentService.recordConsent({
        userId: mockUserId,
        siteId: mockSiteId,
        category: 'ESSENTIAL',
        purpose: 'Account management',
        legalBasis: 'CONTRACT', // Contract basis doesn't require consent
        granted: true,
        consentMethod: 'IMPLIED',
        dataTypes: ['account_info'],
        processingPurposes: ['account_management'],
      });

      expect(essentialConsent.legalBasis).toBe('CONTRACT');
      expect(essentialConsent.category).toBe('ESSENTIAL');
    });
  });
});

// Helper functions for test setup
function createMockGDPRRequest(overrides: any = {}) {
  return {
    id: 'request-123',
    userId: 'user-123',
    siteId: 'site-123',
    requestType: 'ACCESS',
    status: 'PENDING',
    submittedAt: new Date(),
    responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    verificationStatus: 'PENDING',
    dataCategories: ['PERSONAL_DATA'],
    metadata: {},
    ...overrides,
  };
}

function createMockConsentRecord(overrides: any = {}) {
  return {
    id: 'consent-123',
    userId: 'user-123',
    siteId: 'site-123',
    category: 'ANALYTICS',
    purpose: 'Website analytics',
    legalBasis: 'CONSENT',
    granted: true,
    consentMethod: 'EXPLICIT',
    dataTypes: ['page_views'],
    processingPurposes: ['analytics'],
    consentDate: new Date(),
    version: '2.0',
    metadata: {},
    ...overrides,
  };
} 