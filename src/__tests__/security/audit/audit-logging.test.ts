import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuditService } from '../../../lib/security/audit/audit-service';
import { AuditComplianceMonitoringService } from '../../../lib/security/audit/compliance-monitoring-service';

// Mock dependencies
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    auditEvent: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    auditTrail: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    auditReport: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    complianceRule: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    complianceViolation: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    complianceAssessment: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    retentionPolicy: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    anomalyDetector: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../lib/redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../../../lib/security/monitoring/siem-service', () => ({
  siemService: {
    ingestEvent: jest.fn(),
  },
}));

jest.mock('../../../lib/security/monitoring/alerting-service', () => ({
  alertingService: {
    sendNotification: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { siemService } from '../../../lib/security/monitoring/siem-service';
import { alertingService } from '../../../lib/security/monitoring/alerting-service';

describe('Audit Logging System', () => {
  let auditService: AuditService;
  let complianceMonitoringService: AuditComplianceMonitoringService;

  const mockSiteId = 'site-123';
  const mockUserId = 'user-123';
  const mockSessionId = 'session-123';
  const mockEventId = 'event-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instances
    auditService = new AuditService();
    complianceMonitoringService = new AuditComplianceMonitoringService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Audit Event Logging', () => {
    describe('Event Creation', () => {
      it('should log authentication event successfully', async () => {
        // Mock database creation
        (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
          id: mockEventId,
          category: 'AUTHENTICATION',
          eventType: 'USER_LOGIN',
          severity: 'MEDIUM',
          userId: mockUserId,
          sessionId: mockSessionId,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          resource: 'authentication',
          action: 'login',
          outcome: 'SUCCESS',
          details: {},
          encryptedDetails: null,
          metadata: { loginMethod: 'password' },
          siteId: mockSiteId,
          timestamp: new Date(),
          hash: 'sha256hash',
          integrityVerified: true,
          retentionDate: new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000), // 7 years
          archived: false,
          createdAt: new Date(),
        });

        // Mock service methods
        auditService['shouldAuditCategory'] = jest.fn().mockReturnValue(true);
        auditService['validateRequiredFields'] = jest.fn().mockResolvedValue(undefined);
        auditService['generateEventHash'] = jest.fn().mockReturnValue('sha256hash');
        auditService['encryptEventDetails'] = jest.fn().mockResolvedValue(null);
        auditService['calculateRetentionDate'] = jest.fn().mockReturnValue(new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000));
        auditService['cacheRecentEvent'] = jest.fn().mockResolvedValue(undefined);
        auditService['analyzeEventPatterns'] = jest.fn().mockResolvedValue(undefined);
        auditService['forwardToSIEM'] = jest.fn().mockResolvedValue(undefined);

        const eventData = {
          category: 'AUTHENTICATION' as const,
          eventType: 'USER_LOGIN',
          severity: 'MEDIUM' as const,
          userId: mockUserId,
          sessionId: mockSessionId,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          resource: 'authentication',
          action: 'login',
          outcome: 'SUCCESS' as const,
          details: {
            loginMethod: 'password',
            mfaUsed: false,
            deviceFingerprint: 'device123',
          },
          metadata: { loginMethod: 'password' },
          siteId: mockSiteId,
        };

        const result = await auditService.logAuditEvent(eventData);

        expect(result.id).toBe(mockEventId);
        expect(result.category).toBe('AUTHENTICATION');
        expect(result.eventType).toBe('USER_LOGIN');
        expect(result.severity).toBe('MEDIUM');
        expect(result.userId).toBe(mockUserId);
        expect(result.outcome).toBe('SUCCESS');
        expect(result.hash).toBe('sha256hash');
        expect(result.integrityVerified).toBe(true);
        expect(result.archived).toBe(false);

        expect(auditService['shouldAuditCategory']).toHaveBeenCalledWith('AUTHENTICATION');
        expect(auditService['validateRequiredFields']).toHaveBeenCalledWith(eventData);
        expect(auditService['generateEventHash']).toHaveBeenCalledWith(eventData);

        expect(prisma.auditEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              category: 'AUTHENTICATION',
              eventType: 'USER_LOGIN',
              severity: 'MEDIUM',
              userId: mockUserId,
              outcome: 'SUCCESS',
              siteId: mockSiteId,
            }),
          })
        );
      });

      it('should log data modification event with encryption', async () => {
        // Mock encryption for sensitive data
        (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-data-mod-123',
          category: 'DATA_MODIFICATION',
          eventType: 'RECORD_UPDATE',
          severity: 'HIGH',
          userId: mockUserId,
          resource: 'user_profiles',
          action: 'update',
          outcome: 'SUCCESS',
          details: {},
          encryptedDetails: JSON.stringify({
            iv: 'randomiv',
            encrypted: 'encrypteddata',
            tag: 'authtag',
          }),
          metadata: { compliance: ['GDPR', 'HIPAA'] },
          siteId: mockSiteId,
          timestamp: new Date(),
          hash: 'modificationhash',
          integrityVerified: true,
          retentionDate: new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000),
          archived: false,
          createdAt: new Date(),
        });

        auditService['shouldAuditCategory'] = jest.fn().mockReturnValue(true);
        auditService['validateRequiredFields'] = jest.fn().mockResolvedValue(undefined);
        auditService['generateEventHash'] = jest.fn().mockReturnValue('modificationhash');
        auditService['encryptEventDetails'] = jest.fn().mockResolvedValue(JSON.stringify({
          iv: 'randomiv',
          encrypted: 'encrypteddata',
          tag: 'authtag',
        }));
        auditService['calculateRetentionDate'] = jest.fn().mockReturnValue(new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000));
        auditService['cacheRecentEvent'] = jest.fn().mockResolvedValue(undefined);
        auditService['analyzeEventPatterns'] = jest.fn().mockResolvedValue(undefined);
        auditService['forwardToSIEM'] = jest.fn().mockResolvedValue(undefined);

        const eventData = {
          category: 'DATA_MODIFICATION' as const,
          eventType: 'RECORD_UPDATE',
          severity: 'HIGH' as const,
          userId: mockUserId,
          resource: 'user_profiles',
          action: 'update',
          outcome: 'SUCCESS' as const,
          details: {
            tableName: 'user_profiles',
            recordId: 'profile-456',
            changedFields: ['email', 'phone'],
            oldValues: { email: 'old@example.com', phone: '555-0123' },
            newValues: { email: 'new@example.com', phone: '555-0456' },
          },
          metadata: { compliance: ['GDPR', 'HIPAA'] },
          siteId: mockSiteId,
        };

        const result = await auditService.logAuditEvent(eventData);

        expect(result.category).toBe('DATA_MODIFICATION');
        expect(result.severity).toBe('HIGH');
        expect(result.encryptedDetails).toBeDefined();
        expect(auditService['encryptEventDetails']).toHaveBeenCalledWith(eventData);
      });

      it('should handle security events with critical severity', async () => {
        (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-security-123',
          category: 'SECURITY',
          eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          severity: 'CRITICAL',
          userId: mockUserId,
          ipAddress: '203.0.113.50',
          resource: 'admin_panel',
          action: 'access_attempt',
          outcome: 'FAILURE',
          details: {},
          metadata: { riskScore: 9.5 },
          siteId: mockSiteId,
          timestamp: new Date(),
          hash: 'securityhash',
          integrityVerified: true,
          retentionDate: new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000),
          archived: false,
          createdAt: new Date(),
        });

        auditService['shouldAuditCategory'] = jest.fn().mockReturnValue(true);
        auditService['validateRequiredFields'] = jest.fn().mockResolvedValue(undefined);
        auditService['generateEventHash'] = jest.fn().mockReturnValue('securityhash');
        auditService['encryptEventDetails'] = jest.fn().mockResolvedValue(null);
        auditService['calculateRetentionDate'] = jest.fn().mockReturnValue(new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000));
        auditService['cacheRecentEvent'] = jest.fn().mockResolvedValue(undefined);
        auditService['analyzeEventPatterns'] = jest.fn().mockResolvedValue(undefined);
        auditService['forwardToSIEM'] = jest.fn().mockResolvedValue(undefined);

        const eventData = {
          category: 'SECURITY' as const,
          eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          severity: 'CRITICAL' as const,
          userId: mockUserId,
          ipAddress: '203.0.113.50',
          userAgent: 'Suspicious-Agent/1.0',
          resource: 'admin_panel',
          action: 'access_attempt',
          outcome: 'FAILURE' as const,
          details: {
            attemptedRole: 'system_admin',
            currentRole: 'basic_user',
            suspiciousActivity: true,
            geolocation: 'Unknown Country',
          },
          metadata: { riskScore: 9.5 },
          siteId: mockSiteId,
        };

        const result = await auditService.logAuditEvent(eventData);

        expect(result.category).toBe('SECURITY');
        expect(result.severity).toBe('CRITICAL');
        expect(result.outcome).toBe('FAILURE');
        expect(result.metadata.riskScore).toBe(9.5);
      });

      it('should validate required fields for category', async () => {
        auditService['shouldAuditCategory'] = jest.fn().mockReturnValue(true);
        auditService['validateRequiredFields'] = jest.fn().mockImplementation(() => {
          throw new Error("Required field 'userId' missing for category 'AUTHENTICATION'");
        });

        const invalidEventData = {
          category: 'AUTHENTICATION' as const,
          eventType: 'USER_LOGIN',
          severity: 'MEDIUM' as const,
          // Missing userId which is required for AUTHENTICATION
          outcome: 'SUCCESS' as const,
          details: {},
          siteId: mockSiteId,
        };

        await expect(auditService.logAuditEvent(invalidEventData)).rejects.toThrow(
          "Required field 'userId' missing for category 'AUTHENTICATION'"
        );
      });

      it('should skip logging for non-audited categories', async () => {
        auditService['shouldAuditCategory'] = jest.fn().mockReturnValue(false);

        const eventData = {
          category: 'SYSTEM' as const,
          eventType: 'CACHE_REFRESH',
          severity: 'LOW' as const,
          outcome: 'SUCCESS' as const,
          details: {},
          siteId: mockSiteId,
        };

        const result = await auditService.logAuditEvent(eventData);

        expect(result).toBeNull();
        expect(auditService['shouldAuditCategory']).toHaveBeenCalledWith('SYSTEM');
        expect(prisma.auditEvent.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('Audit Trail Management', () => {
    describe('Trail Creation', () => {
      it('should create audit trail for entity creation', async () => {
        // Mock database creation
        (prisma.auditTrail.create as jest.Mock).mockResolvedValue({
          id: 'trail-123',
          entityType: 'user',
          entityId: 'user-456',
          operation: 'CREATE',
          userId: mockUserId,
          timestamp: new Date(),
          beforeState: {},
          afterState: {
            id: 'user-456',
            email: 'new.user@example.com',
            role: 'user',
            status: 'active',
          },
          changes: [
            { field: 'id', oldValue: null, newValue: 'user-456', changeType: 'CREATED' },
            { field: 'email', oldValue: null, newValue: 'new.user@example.com', changeType: 'CREATED' },
            { field: 'role', oldValue: null, newValue: 'user', changeType: 'CREATED' },
            { field: 'status', oldValue: null, newValue: 'active', changeType: 'CREATED' },
          ],
          reason: 'New user registration',
          metadata: { registrationSource: 'web' },
          hash: 'trailhash',
          integrityVerified: true,
        });

        // Mock corresponding audit event creation
        (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-trail-123',
          category: 'DATA_MODIFICATION',
          eventType: 'ENTITY_CHANGE',
          severity: 'HIGH',
          userId: mockUserId,
          outcome: 'SUCCESS',
          siteId: mockSiteId,
          timestamp: new Date(),
          hash: 'eventhash',
          integrityVerified: true,
          createdAt: new Date(),
        });

        // Mock service methods
        auditService['calculateChanges'] = jest.fn().mockReturnValue([
          { field: 'id', oldValue: null, newValue: 'user-456', changeType: 'CREATED' },
          { field: 'email', oldValue: null, newValue: 'new.user@example.com', changeType: 'CREATED' },
          { field: 'role', oldValue: null, newValue: 'user', changeType: 'CREATED' },
          { field: 'status', oldValue: null, newValue: 'active', changeType: 'CREATED' },
        ]);
        auditService['generateTrailHash'] = jest.fn().mockReturnValue('trailhash');
        auditService['determineSeverityForEntity'] = jest.fn().mockReturnValue('HIGH');

        const afterState = {
          id: 'user-456',
          email: 'new.user@example.com',
          role: 'user',
          status: 'active',
        };

        const result = await auditService.createAuditTrail(
          'user',
          'user-456',
          'CREATE',
          mockUserId,
          undefined, // no before state for creation
          afterState,
          'New user registration',
          { registrationSource: 'web', siteId: mockSiteId }
        );

        expect(result.id).toBe('trail-123');
        expect(result.entityType).toBe('user');
        expect(result.entityId).toBe('user-456');
        expect(result.operation).toBe('CREATE');
        expect(result.userId).toBe(mockUserId);
        expect(result.changes).toHaveLength(4);
        expect(result.changes[0].changeType).toBe('CREATED');
        expect(result.reason).toBe('New user registration');
        expect(result.hash).toBe('trailhash');
        expect(result.integrityVerified).toBe(true);

        expect(auditService['calculateChanges']).toHaveBeenCalledWith(undefined, afterState);
        expect(auditService['generateTrailHash']).toHaveBeenCalled();

        expect(prisma.auditTrail.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              entityType: 'user',
              entityId: 'user-456',
              operation: 'CREATE',
              userId: mockUserId,
            }),
          })
        );

        // Should also create corresponding audit event
        expect(prisma.auditEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              category: 'DATA_MODIFICATION',
              eventType: 'ENTITY_CHANGE',
              severity: 'HIGH',
            }),
          })
        );
      });

      it('should create audit trail for entity update', async () => {
        (prisma.auditTrail.create as jest.Mock).mockResolvedValue({
          id: 'trail-update-123',
          entityType: 'user_profile',
          entityId: 'profile-789',
          operation: 'UPDATE',
          userId: mockUserId,
          timestamp: new Date(),
          beforeState: {
            email: 'old.email@example.com',
            phone: '555-0123',
            lastLogin: '2024-01-01T00:00:00Z',
          },
          afterState: {
            email: 'new.email@example.com',
            phone: '555-0456',
            lastLogin: '2024-01-15T12:00:00Z',
          },
          changes: [
            { field: 'email', oldValue: 'old.email@example.com', newValue: 'new.email@example.com', changeType: 'UPDATED' },
            { field: 'phone', oldValue: '555-0123', newValue: '555-0456', changeType: 'UPDATED' },
            { field: 'lastLogin', oldValue: '2024-01-01T00:00:00Z', newValue: '2024-01-15T12:00:00Z', changeType: 'UPDATED' },
          ],
          reason: 'User profile update',
          metadata: { updateSource: 'settings_page' },
          hash: 'updatehash',
          integrityVerified: true,
        });

        (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-update-123',
          category: 'DATA_MODIFICATION',
          eventType: 'ENTITY_CHANGE',
          severity: 'MEDIUM',
          createdAt: new Date(),
        });

        auditService['calculateChanges'] = jest.fn().mockReturnValue([
          { field: 'email', oldValue: 'old.email@example.com', newValue: 'new.email@example.com', changeType: 'UPDATED' },
          { field: 'phone', oldValue: '555-0123', newValue: '555-0456', changeType: 'UPDATED' },
          { field: 'lastLogin', oldValue: '2024-01-01T00:00:00Z', newValue: '2024-01-15T12:00:00Z', changeType: 'UPDATED' },
        ]);
        auditService['generateTrailHash'] = jest.fn().mockReturnValue('updatehash');
        auditService['determineSeverityForEntity'] = jest.fn().mockReturnValue('MEDIUM');

        const beforeState = {
          email: 'old.email@example.com',
          phone: '555-0123',
          lastLogin: '2024-01-01T00:00:00Z',
        };

        const afterState = {
          email: 'new.email@example.com',
          phone: '555-0456',
          lastLogin: '2024-01-15T12:00:00Z',
        };

        const result = await auditService.createAuditTrail(
          'user_profile',
          'profile-789',
          'UPDATE',
          mockUserId,
          beforeState,
          afterState,
          'User profile update',
          { updateSource: 'settings_page', siteId: mockSiteId }
        );

        expect(result.operation).toBe('UPDATE');
        expect(result.changes).toHaveLength(3);
        expect(result.changes[0].changeType).toBe('UPDATED');
        expect(result.changes[0].field).toBe('email');
        expect(result.changes[0].oldValue).toBe('old.email@example.com');
        expect(result.changes[0].newValue).toBe('new.email@example.com');

        expect(auditService['calculateChanges']).toHaveBeenCalledWith(beforeState, afterState);
      });

      it('should create audit trail for entity deletion', async () => {
        (prisma.auditTrail.create as jest.Mock).mockResolvedValue({
          id: 'trail-delete-123',
          entityType: 'content',
          entityId: 'content-999',
          operation: 'DELETE',
          userId: mockUserId,
          timestamp: new Date(),
          beforeState: {
            id: 'content-999',
            title: 'Sample Content',
            status: 'published',
            authorId: 'author-123',
          },
          afterState: {},
          changes: [
            { field: 'id', oldValue: 'content-999', newValue: null, changeType: 'DELETED' },
            { field: 'title', oldValue: 'Sample Content', newValue: null, changeType: 'DELETED' },
            { field: 'status', oldValue: 'published', newValue: null, changeType: 'DELETED' },
            { field: 'authorId', oldValue: 'author-123', newValue: null, changeType: 'DELETED' },
          ],
          reason: 'Content deletion by author',
          metadata: { deletionReason: 'outdated_content' },
          hash: 'deletehash',
          integrityVerified: true,
        });

        (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-delete-123',
          category: 'DATA_MODIFICATION',
          eventType: 'ENTITY_CHANGE',
          severity: 'MEDIUM',
          createdAt: new Date(),
        });

        auditService['calculateChanges'] = jest.fn().mockReturnValue([
          { field: 'id', oldValue: 'content-999', newValue: null, changeType: 'DELETED' },
          { field: 'title', oldValue: 'Sample Content', newValue: null, changeType: 'DELETED' },
          { field: 'status', oldValue: 'published', newValue: null, changeType: 'DELETED' },
          { field: 'authorId', oldValue: 'author-123', newValue: null, changeType: 'DELETED' },
        ]);
        auditService['generateTrailHash'] = jest.fn().mockReturnValue('deletehash');
        auditService['determineSeverityForEntity'] = jest.fn().mockReturnValue('MEDIUM');

        const beforeState = {
          id: 'content-999',
          title: 'Sample Content',
          status: 'published',
          authorId: 'author-123',
        };

        const result = await auditService.createAuditTrail(
          'content',
          'content-999',
          'DELETE',
          mockUserId,
          beforeState,
          undefined, // no after state for deletion
          'Content deletion by author',
          { deletionReason: 'outdated_content', siteId: mockSiteId }
        );

        expect(result.operation).toBe('DELETE');
        expect(result.changes).toHaveLength(4);
        expect(result.changes[0].changeType).toBe('DELETED');
        expect(result.changes[0].newValue).toBeNull();
        expect(result.reason).toBe('Content deletion by author');

        expect(auditService['calculateChanges']).toHaveBeenCalledWith(beforeState, undefined);
      });
    });
  });

  describe('Audit Query Operations', () => {
    describe('Event Querying', () => {
      it('should query audit events with filters', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            category: 'AUTHENTICATION',
            eventType: 'USER_LOGIN',
            severity: 'MEDIUM',
            userId: mockUserId,
            outcome: 'SUCCESS',
            timestamp: new Date('2024-01-15T10:00:00Z'),
            siteId: mockSiteId,
            details: {},
            metadata: {},
            hash: 'hash1',
            integrityVerified: true,
            createdAt: new Date(),
          },
          {
            id: 'event-2',
            category: 'AUTHENTICATION',
            eventType: 'USER_LOGOUT',
            severity: 'LOW',
            userId: mockUserId,
            outcome: 'SUCCESS',
            timestamp: new Date('2024-01-15T15:30:00Z'),
            siteId: mockSiteId,
            details: {},
            metadata: {},
            hash: 'hash2',
            integrityVerified: true,
            createdAt: new Date(),
          },
        ];

        (prisma.auditEvent.count as jest.Mock).mockResolvedValue(2);
        (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        // Mock service methods
        auditService['mapPrismaEventToEvent'] = jest.fn().mockImplementation((event, includeDetails) => ({
          id: event.id,
          category: event.category,
          eventType: event.eventType,
          severity: event.severity,
          userId: event.userId,
          outcome: event.outcome,
          timestamp: event.timestamp,
          siteId: event.siteId,
          details: includeDetails ? event.details : {},
          metadata: event.metadata,
          hash: event.hash,
          integrityVerified: event.integrityVerified,
          archived: false,
          retentionDate: new Date(),
          createdAt: event.createdAt,
        }));

        const queryParams = {
          siteId: mockSiteId,
          category: 'AUTHENTICATION',
          userId: mockUserId,
          startDate: new Date('2024-01-15T00:00:00Z'),
          endDate: new Date('2024-01-15T23:59:59Z'),
          limit: 100,
          offset: 0,
          includeDetails: true,
        };

        const result = await auditService.queryAuditEvents(queryParams);

        expect(result.totalCount).toBe(2);
        expect(result.events).toHaveLength(2);
        expect(result.events[0].id).toBe('event-1');
        expect(result.events[0].category).toBe('AUTHENTICATION');
        expect(result.events[1].id).toBe('event-2');

        expect(prisma.auditEvent.count).toHaveBeenCalledWith({
          where: expect.objectContaining({
            siteId: mockSiteId,
            category: 'AUTHENTICATION',
            userId: mockUserId,
            timestamp: {
              gte: new Date('2024-01-15T00:00:00Z'),
              lte: new Date('2024-01-15T23:59:59Z'),
            },
          }),
        });

        expect(prisma.auditEvent.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            siteId: mockSiteId,
            category: 'AUTHENTICATION',
            userId: mockUserId,
          }),
          orderBy: { timestamp: 'desc' },
          take: 100,
          skip: 0,
        });

        expect(auditService['mapPrismaEventToEvent']).toHaveBeenCalledTimes(2);
        expect(auditService['mapPrismaEventToEvent']).toHaveBeenCalledWith(mockEvents[0], true);
      });

      it('should handle pagination in queries', async () => {
        (prisma.auditEvent.count as jest.Mock).mockResolvedValue(150);
        (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue([]);

        auditService['mapPrismaEventToEvent'] = jest.fn().mockReturnValue({});

        const queryParams = {
          siteId: mockSiteId,
          limit: 50,
          offset: 100,
          includeDetails: false,
        };

        const result = await auditService.queryAuditEvents(queryParams);

        expect(result.totalCount).toBe(150);
        expect(prisma.auditEvent.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 50,
            skip: 100,
          })
        );
      });

      it('should handle query errors gracefully', async () => {
        (prisma.auditEvent.count as jest.Mock).mockRejectedValue(new Error('Database error'));

        const queryParams = {
          siteId: mockSiteId,
        };

        await expect(auditService.queryAuditEvents(queryParams)).rejects.toThrow('Audit query failed');
      });
    });
  });

  describe('Compliance Monitoring', () => {
    describe('Compliance Rule Creation', () => {
      it('should create SOX compliance rule successfully', async () => {
        // Mock database creation
        (prisma.complianceRule.create as jest.Mock).mockResolvedValue({
          id: 'rule-sox-123',
          name: 'SOX Financial Data Access',
          description: 'Monitor access to financial data for SOX compliance',
          framework: 'SOX',
          ruleType: 'THRESHOLD',
          conditions: [
            {
              field: 'resource',
              operator: 'contains',
              value: 'financial',
              weight: 1.0,
            },
            {
              field: 'action',
              operator: 'in',
              value: ['read', 'update', 'delete'],
              weight: 0.8,
            },
          ],
          severity: 'HIGH',
          threshold: 1.0,
          timeWindow: 60,
          enabled: true,
          autoAlert: true,
          triggerCount: 0,
          effectiveness: 0,
          falsePositiveRate: 0,
          metadata: { complianceRequirement: '302.4' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock SIEM event ingestion
        (siemService.ingestEvent as jest.Mock).mockResolvedValue({
          id: 'siem-event-123',
        });

        const ruleData = {
          name: 'SOX Financial Data Access',
          description: 'Monitor access to financial data for SOX compliance',
          framework: 'SOX' as const,
          ruleType: 'THRESHOLD' as const,
          conditions: [
            {
              field: 'resource',
              operator: 'contains' as const,
              value: 'financial',
              weight: 1.0,
            },
            {
              field: 'action',
              operator: 'in' as const,
              value: ['read', 'update', 'delete'],
              weight: 0.8,
            },
          ],
          severity: 'HIGH' as const,
          threshold: 1.0,
          timeWindow: 60,
          enabled: true,
          autoAlert: true,
          metadata: { complianceRequirement: '302.4' },
        };

        const result = await complianceMonitoringService.createComplianceRule(ruleData);

        expect(result.id).toBe('rule-sox-123');
        expect(result.name).toBe('SOX Financial Data Access');
        expect(result.framework).toBe('SOX');
        expect(result.ruleType).toBe('THRESHOLD');
        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0].field).toBe('resource');
        expect(result.conditions[0].operator).toBe('contains');
        expect(result.conditions[0].value).toBe('financial');
        expect(result.severity).toBe('HIGH');
        expect(result.threshold).toBe(1.0);
        expect(result.enabled).toBe(true);
        expect(result.autoAlert).toBe(true);

        expect(prisma.complianceRule.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'SOX Financial Data Access',
              framework: 'SOX',
              ruleType: 'THRESHOLD',
              severity: 'HIGH',
            }),
          })
        );

        expect(siemService.ingestEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'COMPLIANCE_MANAGEMENT',
            title: expect.stringContaining('Compliance Rule Created'),
          })
        );
      });

      it('should create GDPR data processing rule', async () => {
        (prisma.complianceRule.create as jest.Mock).mockResolvedValue({
          id: 'rule-gdpr-123',
          name: 'GDPR Personal Data Processing',
          description: 'Monitor personal data processing for GDPR compliance',
          framework: 'GDPR',
          ruleType: 'PATTERN',
          conditions: [
            {
              field: 'details.dataType',
              operator: 'equals',
              value: 'personal_data',
            },
            {
              field: 'details.hasConsent',
              operator: 'equals',
              value: false,
            },
          ],
          severity: 'CRITICAL',
          enabled: true,
          autoAlert: true,
          triggerCount: 0,
          effectiveness: 0,
          falsePositiveRate: 0,
          metadata: { gdprArticle: '6' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const ruleData = {
          name: 'GDPR Personal Data Processing',
          description: 'Monitor personal data processing for GDPR compliance',
          framework: 'GDPR' as const,
          ruleType: 'PATTERN' as const,
          conditions: [
            {
              field: 'details.dataType',
              operator: 'equals' as const,
              value: 'personal_data',
            },
            {
              field: 'details.hasConsent',
              operator: 'equals' as const,
              value: false,
            },
          ],
          severity: 'CRITICAL' as const,
          enabled: true,
          autoAlert: true,
          metadata: { gdprArticle: '6' },
        };

        const result = await complianceMonitoringService.createComplianceRule(ruleData);

        expect(result.framework).toBe('GDPR');
        expect(result.ruleType).toBe('PATTERN');
        expect(result.severity).toBe('CRITICAL');
        expect(result.conditions[1].field).toBe('details.hasConsent');
        expect(result.conditions[1].value).toBe(false);
      });
    });

    describe('Event Analysis', () => {
      it('should analyze audit event and detect compliance violations', async () => {
        // Mock compliance rule
        const mockRule = {
          id: 'rule-test-123',
          name: 'Financial Data Access Rule',
          framework: 'SOX',
          ruleType: 'THRESHOLD',
          conditions: [
            {
              field: 'resource',
              operator: 'contains',
              value: 'financial',
            },
          ],
          severity: 'HIGH',
          threshold: 1.0,
          enabled: true,
          autoAlert: true,
        };

        complianceMonitoringService['complianceRules'].set('rule-test-123', mockRule as any);

        // Mock rule evaluation
        complianceMonitoringService['evaluateComplianceRule'] = jest.fn().mockResolvedValue({
          violated: true,
          score: 1.0,
          details: { matchedConditions: 1, totalConditions: 1 },
        });

        // Mock violation creation
        (prisma.complianceViolation.create as jest.Mock).mockResolvedValue({
          id: 'violation-123',
          framework: 'SOX',
          ruleId: 'rule-test-123',
          violationType: 'THRESHOLD',
          severity: 'HIGH',
          description: 'Compliance violation detected: Financial Data Access Rule',
          auditEventIds: [mockEventId],
          userId: mockUserId,
          resource: 'financial_reports',
          status: 'OPEN',
          impact: 'Medium impact',
          recommendations: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        complianceMonitoringService['createComplianceViolation'] = jest.fn().mockResolvedValue({
          id: 'violation-123',
          framework: 'SOX',
          ruleId: 'rule-test-123',
          severity: 'HIGH',
          status: 'OPEN',
        });

        complianceMonitoringService['detectAnomalies'] = jest.fn().mockResolvedValue([]);
        complianceMonitoringService['updateRuleEffectiveness'] = jest.fn().mockResolvedValue(undefined);
        complianceMonitoringService['sendComplianceAlert'] = jest.fn().mockResolvedValue(undefined);

        const auditEvent = {
          id: mockEventId,
          category: 'DATA_ACCESS',
          eventType: 'RECORD_READ',
          severity: 'MEDIUM',
          userId: mockUserId,
          resource: 'financial_reports',
          action: 'read',
          outcome: 'SUCCESS',
          details: {
            recordCount: 50,
            dataType: 'financial',
          },
          timestamp: new Date(),
        };

        const result = await complianceMonitoringService.analyzeAuditEvent(auditEvent);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('violation-123');
        expect(result[0].framework).toBe('SOX');
        expect(result[0].severity).toBe('HIGH');

        expect(complianceMonitoringService['evaluateComplianceRule']).toHaveBeenCalledWith(mockRule, auditEvent);
        expect(complianceMonitoringService['createComplianceViolation']).toHaveBeenCalled();
        expect(complianceMonitoringService['sendComplianceAlert']).toHaveBeenCalled();
      });

      it('should not trigger violations for compliant events', async () => {
        const mockRule = {
          id: 'rule-normal-123',
          enabled: true,
        };

        complianceMonitoringService['complianceRules'].set('rule-normal-123', mockRule as any);
        complianceMonitoringService['evaluateComplianceRule'] = jest.fn().mockResolvedValue({
          violated: false,
          score: 0.0,
          details: { matchedConditions: 0, totalConditions: 1 },
        });
        complianceMonitoringService['detectAnomalies'] = jest.fn().mockResolvedValue([]);
        complianceMonitoringService['updateRuleEffectiveness'] = jest.fn().mockResolvedValue(undefined);

        const normalEvent = {
          id: 'event-normal-123',
          category: 'AUTHENTICATION',
          eventType: 'USER_LOGIN',
          severity: 'LOW',
          outcome: 'SUCCESS',
          timestamp: new Date(),
        };

        const result = await complianceMonitoringService.analyzeAuditEvent(normalEvent);

        expect(result).toHaveLength(0);
        expect(complianceMonitoringService['evaluateComplianceRule']).toHaveBeenCalledWith(mockRule, normalEvent);
      });
    });

    describe('Integrity Validation', () => {
      it('should validate audit log integrity successfully', async () => {
        const mockEvents = [
          {
            id: 'event-integrity-1',
            hash: 'valihash1',
            timestamp: new Date(),
            category: 'AUTHENTICATION',
          },
          {
            id: 'event-integrity-2',
            hash: 'validhash2',
            timestamp: new Date(),
            category: 'DATA_ACCESS',
          },
        ];

        (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        // Mock integrity validation
        complianceMonitoringService['validateEventIntegrity'] = jest.fn()
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true);

        complianceMonitoringService['updateIntegrityStatus'] = jest.fn().mockResolvedValue(undefined);

        const result = await complianceMonitoringService.validateAuditLogIntegrity(['event-integrity-1', 'event-integrity-2']);

        expect(result.valid).toBe(2);
        expect(result.invalid).toBe(0);
        expect(result.details).toHaveLength(0);

        expect(prisma.auditEvent.findMany).toHaveBeenCalledWith({
          where: { id: { in: ['event-integrity-1', 'event-integrity-2'] } },
          orderBy: { timestamp: 'asc' },
        });

        expect(complianceMonitoringService['validateEventIntegrity']).toHaveBeenCalledTimes(2);
        expect(complianceMonitoringService['updateIntegrityStatus']).toHaveBeenCalledWith(result);
      });

      it('should detect integrity violations', async () => {
        const mockEvents = [
          {
            id: 'event-tampered-1',
            hash: 'tampered-hash',
            timestamp: new Date(),
            category: 'SECURITY',
          },
        ];

        (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        complianceMonitoringService['validateEventIntegrity'] = jest.fn().mockResolvedValue(false);
        complianceMonitoringService['createIntegrityViolation'] = jest.fn().mockResolvedValue(undefined);
        complianceMonitoringService['updateIntegrityStatus'] = jest.fn().mockResolvedValue(undefined);

        const result = await complianceMonitoringService.validateAuditLogIntegrity(['event-tampered-1']);

        expect(result.valid).toBe(0);
        expect(result.invalid).toBe(1);
        expect(result.details).toHaveLength(1);
        expect(result.details[0].eventId).toBe('event-tampered-1');
        expect(result.details[0].issue).toContain('Hash mismatch');
        expect(result.details[0].severity).toBe('CRITICAL');

        expect(complianceMonitoringService['createIntegrityViolation']).toHaveBeenCalledWith(mockEvents[0]);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete audit lifecycle', async () => {
      // 1. Log audit event
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({
        id: 'integration-event-123',
        category: 'DATA_MODIFICATION',
        eventType: 'RECORD_UPDATE',
        severity: 'HIGH',
        userId: mockUserId,
        outcome: 'SUCCESS',
        siteId: mockSiteId,
        timestamp: new Date(),
        hash: 'integrationhash',
        integrityVerified: true,
        createdAt: new Date(),
      });

      auditService['shouldAuditCategory'] = jest.fn().mockReturnValue(true);
      auditService['validateRequiredFields'] = jest.fn().mockResolvedValue(undefined);
      auditService['generateEventHash'] = jest.fn().mockReturnValue('integrationhash');
      auditService['encryptEventDetails'] = jest.fn().mockResolvedValue(null);
      auditService['calculateRetentionDate'] = jest.fn().mockReturnValue(new Date());
      auditService['cacheRecentEvent'] = jest.fn().mockResolvedValue(undefined);
      auditService['analyzeEventPatterns'] = jest.fn().mockResolvedValue(undefined);
      auditService['forwardToSIEM'] = jest.fn().mockResolvedValue(undefined);

      const auditEvent = await auditService.logAuditEvent({
        category: 'DATA_MODIFICATION',
        eventType: 'RECORD_UPDATE',
        severity: 'HIGH',
        userId: mockUserId,
        outcome: 'SUCCESS',
        details: { recordId: 'rec-123' },
        siteId: mockSiteId,
      });

      expect(auditEvent.id).toBe('integration-event-123');

      // 2. Analyze for compliance
      const mockRule = {
        id: 'integration-rule-123',
        enabled: true,
        autoAlert: true,
      };

      complianceMonitoringService['complianceRules'].set('integration-rule-123', mockRule as any);
      complianceMonitoringService['evaluateComplianceRule'] = jest.fn().mockResolvedValue({
        violated: true,
        score: 1.0,
      });

      (prisma.complianceViolation.create as jest.Mock).mockResolvedValue({
        id: 'integration-violation-123',
        framework: 'SOX',
        severity: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      complianceMonitoringService['createComplianceViolation'] = jest.fn().mockResolvedValue({
        id: 'integration-violation-123',
        framework: 'SOX',
        severity: 'HIGH',
        status: 'OPEN',
      });

      complianceMonitoringService['detectAnomalies'] = jest.fn().mockResolvedValue([]);
      complianceMonitoringService['updateRuleEffectiveness'] = jest.fn().mockResolvedValue(undefined);
      complianceMonitoringService['sendComplianceAlert'] = jest.fn().mockResolvedValue(undefined);

      const violations = await complianceMonitoringService.analyzeAuditEvent(auditEvent);

      expect(violations).toHaveLength(1);
      expect(violations[0].id).toBe('integration-violation-123');

      // 3. Query events
      (prisma.auditEvent.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditEvent.findMany as jest.Mock).mockResolvedValue([{
        id: 'integration-event-123',
        category: 'DATA_MODIFICATION',
        siteId: mockSiteId,
        timestamp: new Date(),
        hash: 'integrationhash',
        integrityVerified: true,
        createdAt: new Date(),
      }]);

      auditService['mapPrismaEventToEvent'] = jest.fn().mockReturnValue(auditEvent);

      const queryResult = await auditService.queryAuditEvents({
        siteId: mockSiteId,
        category: 'DATA_MODIFICATION',
      });

      expect(queryResult.totalCount).toBe(1);
      expect(queryResult.events[0].id).toBe('integration-event-123');

      // Verify all components worked together
      expect(prisma.auditEvent.create).toHaveBeenCalled();
      expect(complianceMonitoringService['evaluateComplianceRule']).toHaveBeenCalled();
      expect(prisma.auditEvent.findMany).toHaveBeenCalled();
    });
  });
});

// Helper functions for test setup
function createMockAuditEvent(overrides: any = {}) {
  return {
    id: 'audit-test-123',
    category: 'AUTHENTICATION',
    eventType: 'USER_LOGIN',
    severity: 'MEDIUM',
    userId: 'user-123',
    outcome: 'SUCCESS',
    details: {},
    metadata: {},
    siteId: 'site-123',
    timestamp: new Date(),
    hash: 'testhash',
    integrityVerified: true,
    archived: false,
    retentionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockAuditTrail(overrides: any = {}) {
  return {
    id: 'trail-test-123',
    entityType: 'user',
    entityId: 'user-456',
    operation: 'UPDATE',
    userId: 'user-123',
    timestamp: new Date(),
    beforeState: { email: 'old@example.com' },
    afterState: { email: 'new@example.com' },
    changes: [
      { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com', changeType: 'UPDATED' },
    ],
    reason: 'Profile update',
    metadata: {},
    hash: 'trailhash',
    integrityVerified: true,
    ...overrides,
  };
}

function createMockComplianceRule(overrides: any = {}) {
  return {
    id: 'rule-test-123',
    name: 'Test Compliance Rule',
    description: 'Test rule for compliance monitoring',
    framework: 'SOX',
    ruleType: 'THRESHOLD',
    conditions: [
      { field: 'severity', operator: 'equals', value: 'CRITICAL' },
    ],
    severity: 'HIGH',
    threshold: 1.0,
    enabled: true,
    autoAlert: true,
    triggerCount: 0,
    effectiveness: 0,
    falsePositiveRate: 0,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockComplianceViolation(overrides: any = {}) {
  return {
    id: 'violation-test-123',
    framework: 'SOX',
    ruleId: 'rule-test-123',
    violationType: 'THRESHOLD',
    severity: 'HIGH',
    description: 'Test compliance violation',
    auditEventIds: ['event-test-123'],
    userId: 'user-123',
    resource: 'test-resource',
    status: 'OPEN',
    impact: 'Medium impact',
    recommendations: ['Test recommendation'],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
} 