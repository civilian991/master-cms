import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { IncidentResponseService } from '../../../lib/security/incident-response/incident-service';
import { PostIncidentAnalysisService } from '../../../lib/security/incident-response/post-incident-service';

// Mock dependencies
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    securityIncident: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    incidentTimeline: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    incidentAction: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    incidentCommunication: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    incidentEvidence: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    postIncidentReview: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    lessonLearned: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    improvementAction: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
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
    on: jest.fn(),
    emit: jest.fn(),
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

describe('Incident Response System', () => {
  let incidentService: IncidentResponseService;
  let postIncidentService: PostIncidentAnalysisService;

  const mockUserId = 'user-123';
  const mockSiteId = 'site-123';
  const mockIncidentId = 'INC-P1-test123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instances
    incidentService = new IncidentResponseService();
    postIncidentService = new PostIncidentAnalysisService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Incident Response Service', () => {
    describe('Incident Creation', () => {
      it('should create critical security incident successfully', async () => {
        // Mock database creation
        (prisma.securityIncident.create as jest.Mock).mockResolvedValue({
          id: mockIncidentId,
          title: 'Critical Security Breach Detected',
          description: 'Unauthorized access detected in production systems',
          severity: 'P1_CRITICAL',
          category: 'SECURITY_BREACH',
          status: 'NEW',
          priority: 1,
          source: 'Automated Detection',
          affectedSystems: ['web-server-01', 'database-primary'],
          reportedBy: mockUserId,
          incidentCommander: 'commander-123',
          siteId: mockSiteId,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { autoDetected: true },
        });

        // Mock timeline creation
        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-123',
          incidentId: mockIncidentId,
          timestamp: new Date(),
          actor: mockUserId,
          action: 'INCIDENT_CREATED',
          description: 'Incident created: Critical Security Breach Detected',
          metadata: {},
        });

        // Mock SIEM event ingestion
        (siemService.ingestEvent as jest.Mock).mockResolvedValue({
          id: 'event-123',
          eventType: 'SECURITY_ALERT',
          severity: 'CRITICAL',
        });

        // Mock alerting service
        (alertingService.sendNotification as jest.Mock).mockResolvedValue({
          id: 'notification-123',
          status: 'SENT',
        });

        const incidentData = {
          title: 'Critical Security Breach Detected',
          description: 'Unauthorized access detected in production systems',
          severity: 'P1_CRITICAL' as const,
          category: 'SECURITY_BREACH' as const,
          source: 'Automated Detection',
          affectedSystems: ['web-server-01', 'database-primary'],
          reportedBy: mockUserId,
          siteId: mockSiteId,
          metadata: { detectionMethod: 'IDS', confidence: 95 },
        };

        const result = await incidentService.createIncident(incidentData);

        expect(result.id).toBe(mockIncidentId);
        expect(result.title).toBe('Critical Security Breach Detected');
        expect(result.severity).toBe('P1_CRITICAL');
        expect(result.category).toBe('SECURITY_BREACH');
        expect(result.status).toBe('NEW');
        expect(result.priority).toBe(1);
        expect(result.affectedSystems).toContain('web-server-01');
        expect(result.affectedSystems).toContain('database-primary');

        expect(prisma.securityIncident.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'Critical Security Breach Detected',
              severity: 'P1_CRITICAL',
              category: 'SECURITY_BREACH',
              status: 'NEW',
              priority: 1,
              reportedBy: mockUserId,
              siteId: mockSiteId,
            }),
          })
        );

        expect(prisma.incidentTimeline.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              actor: mockUserId,
              action: 'INCIDENT_CREATED',
            }),
          })
        );

        expect(siemService.ingestEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'SECURITY_ALERT',
            severity: 'CRITICAL',
            title: expect.stringContaining('Security Incident Created'),
          })
        );

        expect(alertingService.sendNotification).toHaveBeenCalled();
      });

      it('should assign incident commander based on severity', async () => {
        (prisma.securityIncident.create as jest.Mock).mockResolvedValue({
          id: 'INC-P2-test456',
          severity: 'P2_HIGH',
          incidentCommander: 'commander-456',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-456',
        });

        const incidentData = {
          title: 'High Priority Security Alert',
          description: 'Potential malware detected',
          severity: 'P2_HIGH' as const,
          category: 'MALWARE_INFECTION' as const,
          source: 'Antivirus System',
          reportedBy: mockUserId,
          siteId: mockSiteId,
        };

        const result = await incidentService.createIncident(incidentData);

        expect(result.incidentCommander).toBeDefined();
        expect(result.severity).toBe('P2_HIGH');
      });

      it('should execute automated actions for security breaches', async () => {
        (prisma.securityIncident.create as jest.Mock).mockResolvedValue({
          id: mockIncidentId,
          category: 'SECURITY_BREACH',
          severity: 'P1_CRITICAL',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-123',
        });

        (prisma.incidentAction.create as jest.Mock).mockResolvedValue({
          id: 'action-123',
          incidentId: mockIncidentId,
          actionType: 'isolate-systems',
          description: 'Isolate affected systems from network',
          status: 'PENDING',
          automated: true,
          metadata: {},
        });

        const incidentData = {
          title: 'Security Breach - Automated Response',
          description: 'Security breach detected, automated actions initiated',
          severity: 'P1_CRITICAL' as const,
          category: 'SECURITY_BREACH' as const,
          source: 'SIEM',
          reportedBy: mockUserId,
          siteId: mockSiteId,
        };

        const result = await incidentService.createIncident(incidentData);

        expect(result.category).toBe('SECURITY_BREACH');
        expect(prisma.incidentAction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              actionType: 'isolate-systems',
              automated: true,
            }),
          })
        );
      });

      it('should validate incident data and handle errors', async () => {
        const invalidIncidentData = {
          title: 'Short', // Too short
          description: 'Also short', // Too short
          severity: 'INVALID_SEVERITY' as any,
          category: 'INVALID_CATEGORY' as any,
          source: 'Test',
          reportedBy: mockUserId,
          siteId: mockSiteId,
        };

        await expect(incidentService.createIncident(invalidIncidentData)).rejects.toThrow();
      });
    });

    describe('Incident Updates', () => {
      it('should update incident status and track timeline', async () => {
        // Mock existing incident
        const existingIncident = {
          id: mockIncidentId,
          title: 'Test Incident',
          status: 'NEW',
          priority: 1,
          createdAt: new Date(),
          timeline: [],
          actions: [],
          communications: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.securityIncident.update as jest.Mock).mockResolvedValue({
          id: mockIncidentId,
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-update-123',
          incidentId: mockIncidentId,
          timestamp: new Date(),
          actor: mockUserId,
          action: 'STATUS_CHANGED',
          description: 'Status changed from NEW to ACKNOWLEDGED',
          metadata: { oldStatus: 'NEW', newStatus: 'ACKNOWLEDGED' },
        });

        const updateData = {
          incidentId: mockIncidentId,
          status: 'ACKNOWLEDGED' as const,
          progress: 'Initial assessment completed, investigating root cause',
        };

        const result = await incidentService.updateIncident(updateData, mockUserId);

        expect(result.status).toBe('ACKNOWLEDGED');
        expect(result.acknowledgedAt).toBeDefined();

        expect(prisma.securityIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockIncidentId },
            data: expect.objectContaining({
              status: 'ACKNOWLEDGED',
              acknowledgedAt: expect.any(Date),
            }),
          })
        );

        expect(prisma.incidentTimeline.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              actor: mockUserId,
              action: 'STATUS_CHANGED',
            }),
          })
        );
      });

      it('should calculate response and resolution times', async () => {
        const existingIncident = {
          id: mockIncidentId,
          status: 'INVESTIGATING',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          timeline: [],
          actions: [],
          communications: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.securityIncident.update as jest.Mock).mockResolvedValue({
          id: mockIncidentId,
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionTime: 30, // 30 minutes
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-resolved-123',
        });

        const updateData = {
          incidentId: mockIncidentId,
          status: 'RESOLVED' as const,
          resolution: 'Malware removed, systems secured, monitoring enhanced',
        };

        const result = await incidentService.updateIncident(updateData, mockUserId);

        expect(result.status).toBe('RESOLVED');
        expect(result.resolvedAt).toBeDefined();
        expect(result.resolutionTime).toBeDefined();
        expect(result.resolutionTime).toBeGreaterThan(0);
      });

      it('should handle incident assignment changes', async () => {
        const existingIncident = {
          id: mockIncidentId,
          assignedTo: 'old-assignee',
          timeline: [],
          actions: [],
          communications: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.securityIncident.update as jest.Mock).mockResolvedValue({
          id: mockIncidentId,
          assignedTo: 'new-assignee',
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-assignment-123',
        });

        const updateData = {
          incidentId: mockIncidentId,
          assignedTo: 'new-assignee',
        };

        const result = await incidentService.updateIncident(updateData, mockUserId);

        expect(result.assignedTo).toBe('new-assignee');

        expect(prisma.incidentTimeline.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'ASSIGNED',
              description: 'Incident assigned to new-assignee',
            }),
          })
        );
      });
    });

    describe('Incident Actions', () => {
      it('should execute automated incident actions', async () => {
        const existingIncident = {
          id: mockIncidentId,
          category: 'MALWARE_INFECTION',
          actions: [],
          timeline: [],
          communications: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.incidentAction.create as jest.Mock).mockResolvedValue({
          id: 'action-quarantine-123',
          incidentId: mockIncidentId,
          actionType: 'quarantine-system',
          description: 'Quarantine infected system',
          status: 'PENDING',
          automated: true,
          metadata: {
            script: 'quarantine_system.sh',
            confirmationRequired: true,
          },
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-action-123',
        });

        const result = await incidentService.executeIncidentAction(
          mockIncidentId,
          'quarantine-system',
          undefined,
          true
        );

        expect(result.actionType).toBe('quarantine-system');
        expect(result.automated).toBe(true);
        expect(result.status).toBe('PENDING');

        expect(prisma.incidentAction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              actionType: 'quarantine-system',
              automated: true,
            }),
          })
        );
      });

      it('should handle manual incident actions', async () => {
        const existingIncident = {
          id: mockIncidentId,
          actions: [],
          timeline: [],
          communications: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.incidentAction.create as jest.Mock).mockResolvedValue({
          id: 'action-manual-123',
          incidentId: mockIncidentId,
          actionType: 'collect-evidence',
          description: 'Collect forensic evidence',
          status: 'PENDING',
          assignedTo: mockUserId,
          automated: false,
          metadata: {},
        });

        (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
          id: 'timeline-manual-action-123',
        });

        const result = await incidentService.executeIncidentAction(
          mockIncidentId,
          'collect-evidence',
          mockUserId,
          false
        );

        expect(result.actionType).toBe('collect-evidence');
        expect(result.automated).toBe(false);
        expect(result.assignedTo).toBe(mockUserId);
        expect(result.status).toBe('PENDING');
      });
    });

    describe('Incident Communications', () => {
      it('should send incident status update communications', async () => {
        const existingIncident = {
          id: mockIncidentId,
          title: 'Critical Security Incident',
          severity: 'P1_CRITICAL',
          communications: [],
          timeline: [],
          actions: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.incidentCommunication.create as jest.Mock).mockResolvedValue({
          id: 'comm-123',
          incidentId: mockIncidentId,
          type: 'STATUS_UPDATE',
          message: 'Investigation in progress, systems isolated',
          sentAt: new Date(),
          sentBy: 'SYSTEM',
          recipients: ['security-team', 'management'],
          channels: ['email', 'slack'],
          status: 'PENDING',
        });

        (prisma.incidentCommunication.update as jest.Mock).mockResolvedValue({
          status: 'SENT',
        });

        (alertingService.sendNotification as jest.Mock).mockResolvedValue({
          id: 'notification-comm-123',
          status: 'SENT',
        });

        const communicationData = {
          incidentId: mockIncidentId,
          type: 'STATUS_UPDATE' as const,
          message: 'Investigation in progress, systems isolated',
          recipients: ['security-team', 'management'],
          priority: 'HIGH' as const,
          channels: ['email', 'slack'] as const,
        };

        const result = await incidentService.sendIncidentCommunication(communicationData);

        expect(result.type).toBe('STATUS_UPDATE');
        expect(result.message).toBe('Investigation in progress, systems isolated');
        expect(result.recipients).toContain('security-team');
        expect(result.recipients).toContain('management');
        expect(result.status).toBe('SENT');

        expect(alertingService.sendNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SECURITY_ALERT',
            title: expect.stringContaining('Incident Communication'),
            message: 'Investigation in progress, systems isolated',
            targetUsers: ['security-team', 'management'],
            channels: ['email', 'slack'],
          })
        );
      });

      it('should handle escalation communications', async () => {
        const existingIncident = {
          id: mockIncidentId,
          title: 'Escalated Security Incident',
          severity: 'P1_CRITICAL',
          communications: [],
          timeline: [],
          actions: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, existingIncident as any);

        (prisma.incidentCommunication.create as jest.Mock).mockResolvedValue({
          id: 'comm-escalation-123',
          type: 'ESCALATION',
          recipients: ['ciso', 'executives'],
          channels: ['email', 'sms'],
          status: 'PENDING',
        });

        (prisma.incidentCommunication.update as jest.Mock).mockResolvedValue({
          status: 'SENT',
        });

        const escalationData = {
          incidentId: mockIncidentId,
          type: 'ESCALATION' as const,
          message: 'Incident escalated due to severity and impact',
          recipients: ['ciso', 'executives'],
          priority: 'URGENT' as const,
          channels: ['email', 'sms'] as const,
        };

        const result = await incidentService.sendIncidentCommunication(escalationData);

        expect(result.type).toBe('ESCALATION');
        expect(result.recipients).toContain('ciso');
        expect(result.recipients).toContain('executives');
        expect(result.channels).toContain('email');
        expect(result.channels).toContain('sms');
      });
    });

    describe('Incident Retrieval', () => {
      it('should retrieve incident by ID', async () => {
        const mockIncident = {
          id: mockIncidentId,
          title: 'Retrieved Test Incident',
          status: 'INVESTIGATING',
          timeline: [],
          communications: [],
          actions: [],
          evidence: [],
          metadata: {},
        };

        incidentService['activeIncidents'].set(mockIncidentId, mockIncident as any);

        const result = await incidentService.getIncident(mockIncidentId);

        expect(result).toBeDefined();
        expect(result?.id).toBe(mockIncidentId);
        expect(result?.title).toBe('Retrieved Test Incident');
        expect(result?.status).toBe('INVESTIGATING');
      });

      it('should retrieve incidents with filtering', async () => {
        (prisma.securityIncident.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'INC-P1-001',
            title: 'Critical Incident 1',
            severity: 'P1_CRITICAL',
            status: 'RESOLVED',
            category: 'SECURITY_BREACH',
            createdAt: new Date(),
            timeline: [],
            communications: [],
            actions: [],
            evidence: [],
          },
          {
            id: 'INC-P2-002',
            title: 'High Priority Incident 2',
            severity: 'P2_HIGH',
            status: 'INVESTIGATING',
            category: 'MALWARE_INFECTION',
            createdAt: new Date(),
            timeline: [],
            communications: [],
            actions: [],
            evidence: [],
          },
        ]);

        const filters = {
          severity: 'P1_CRITICAL',
          status: 'RESOLVED',
          siteId: mockSiteId,
          limit: 10,
        };

        const result = await incidentService.getIncidents(filters);

        expect(result).toHaveLength(2);
        expect(result[0].severity).toBe('P1_CRITICAL');
        expect(result[1].severity).toBe('P2_HIGH');

        expect(prisma.securityIncident.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              severity: 'P1_CRITICAL',
              status: 'RESOLVED',
              siteId: mockSiteId,
            }),
            take: 10,
          })
        );
      });

      it('should handle incident not found', async () => {
        const result = await incidentService.getIncident('non-existent-incident');

        expect(result).toBeNull();
      });
    });
  });

  describe('Post-Incident Analysis Service', () => {
    describe('Post-Incident Review Scheduling', () => {
      it('should schedule post-incident review successfully', async () => {
        (prisma.postIncidentReview.create as jest.Mock).mockResolvedValue({
          id: 'review-123',
          incidentId: mockIncidentId,
          reviewType: 'FULL',
          status: 'SCHEDULED',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          facilitator: 'security-lead',
          participants: [
            { userId: 'user-1', role: 'security-analyst', participation: 'REQUIRED' },
            { userId: 'user-2', role: 'system-admin', participation: 'REQUIRED' },
          ],
          objectives: ['Identify root cause', 'Assess response effectiveness'],
          framework: 'ROOT_CAUSE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const reviewData = {
          incidentId: mockIncidentId,
          reviewType: 'FULL' as const,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          facilitator: 'security-lead',
          participants: [
            { userId: 'user-1', role: 'security-analyst', participation: 'REQUIRED' as const },
            { userId: 'user-2', role: 'system-admin', participation: 'REQUIRED' as const },
          ],
          objectives: ['Identify root cause', 'Assess response effectiveness'],
          framework: 'ROOT_CAUSE' as const,
        };

        const result = await postIncidentService.schedulePostIncidentReview(reviewData);

        expect(result.id).toBe('review-123');
        expect(result.reviewType).toBe('FULL');
        expect(result.status).toBe('SCHEDULED');
        expect(result.facilitator).toBe('security-lead');
        expect(result.participants).toHaveLength(2);
        expect(result.objectives).toContain('Identify root cause');

        expect(prisma.postIncidentReview.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              reviewType: 'FULL',
              status: 'SCHEDULED',
              facilitator: 'security-lead',
              framework: 'ROOT_CAUSE',
            }),
          })
        );
      });

      it('should validate review scheduling data', async () => {
        const invalidReviewData = {
          incidentId: '', // Empty incident ID
          reviewType: 'INVALID' as any,
          scheduledDate: new Date(),
          facilitator: '',
          participants: [],
          objectives: [],
          framework: 'INVALID' as any,
        };

        await expect(postIncidentService.schedulePostIncidentReview(invalidReviewData))
          .rejects.toThrow();
      });
    });

    describe('Lessons Learned Management', () => {
      it('should create actionable lesson learned', async () => {
        (prisma.lessonLearned.create as jest.Mock).mockResolvedValue({
          id: 'lesson-123',
          incidentId: mockIncidentId,
          category: 'DETECTION',
          lesson: 'Response time exceeded target due to delayed alerting',
          impact: 'HIGH',
          actionable: true,
          recommendation: 'Implement automated alerting for critical events',
          implementationEffort: 'MEDIUM',
          timeframe: 'SHORT_TERM',
          owner: 'security-team',
          cost: 5000,
          dependencies: ['alerting-system-upgrade'],
          status: 'IDENTIFIED',
          createdAt: new Date(),
        });

        (prisma.improvementAction.create as jest.Mock).mockResolvedValue({
          id: 'action-improve-123',
          incidentId: mockIncidentId,
          lessonId: 'lesson-123',
          title: 'Implement: Response time exceeded target due to delayed alerting',
          description: 'Implement automated alerting for critical events',
          category: 'DETECTION',
          priority: 'HIGH',
          owner: 'security-team',
          status: 'PLANNED',
          estimatedEffort: 40,
          estimatedCost: 5000,
          createdAt: new Date(),
        });

        const lessonData = {
          incidentId: mockIncidentId,
          category: 'DETECTION' as const,
          lesson: 'Response time exceeded target due to delayed alerting',
          impact: 'HIGH' as const,
          actionable: true,
          recommendation: 'Implement automated alerting for critical events',
          implementationEffort: 'MEDIUM' as const,
          timeframe: 'SHORT_TERM' as const,
          owner: 'security-team',
          cost: 5000,
          dependencies: ['alerting-system-upgrade'],
        };

        const result = await postIncidentService.createLessonLearned(lessonData);

        expect(result.id).toBe('lesson-123');
        expect(result.category).toBe('DETECTION');
        expect(result.impact).toBe('HIGH');
        expect(result.actionable).toBe(true);
        expect(result.recommendation).toContain('automated alerting');
        expect(result.cost).toBe(5000);

        expect(prisma.lessonLearned.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              category: 'DETECTION',
              lesson: 'Response time exceeded target due to delayed alerting',
              impact: 'HIGH',
              actionable: true,
              owner: 'security-team',
            }),
          })
        );

        // Should also create improvement action since it's actionable
        expect(prisma.improvementAction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              lessonId: 'lesson-123',
              category: 'DETECTION',
              priority: 'HIGH',
              status: 'PLANNED',
            }),
          })
        );
      });

      it('should create non-actionable lesson learned', async () => {
        (prisma.lessonLearned.create as jest.Mock).mockResolvedValue({
          id: 'lesson-nonactionable-123',
          incidentId: mockIncidentId,
          category: 'PROCESS',
          lesson: 'Communication was effective during incident response',
          impact: 'LOW',
          actionable: false,
          recommendation: 'Continue current communication procedures',
          implementationEffort: 'LOW',
          timeframe: 'IMMEDIATE',
          owner: 'incident-commander',
          status: 'IDENTIFIED',
          createdAt: new Date(),
        });

        const lessonData = {
          incidentId: mockIncidentId,
          category: 'PROCESS' as const,
          lesson: 'Communication was effective during incident response',
          impact: 'LOW' as const,
          actionable: false,
          recommendation: 'Continue current communication procedures',
          implementationEffort: 'LOW' as const,
          timeframe: 'IMMEDIATE' as const,
          owner: 'incident-commander',
        };

        const result = await postIncidentService.createLessonLearned(lessonData);

        expect(result.actionable).toBe(false);
        expect(result.impact).toBe('LOW');

        // Should not create improvement action for non-actionable lessons
        expect(prisma.improvementAction.create).not.toHaveBeenCalled();
      });
    });

    describe('Improvement Action Management', () => {
      it('should create improvement action successfully', async () => {
        (prisma.improvementAction.create as jest.Mock).mockResolvedValue({
          id: 'improvement-123',
          incidentId: mockIncidentId,
          lessonId: 'lesson-123',
          title: 'Enhance Security Monitoring',
          description: 'Implement advanced threat detection capabilities',
          category: 'TECHNOLOGY',
          priority: 'HIGH',
          owner: 'security-team',
          status: 'PLANNED',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          estimatedEffort: 160, // 160 hours (1 month)
          estimatedCost: 25000,
          dependencies: ['budget-approval', 'vendor-selection'],
          successCriteria: ['Reduced false positives', 'Faster threat detection'],
          riskOfNotImplementing: 'Continued vulnerability to advanced threats',
          progress: 0,
          updates: [],
          createdAt: new Date(),
        });

        const actionData = {
          incidentId: mockIncidentId,
          lessonId: 'lesson-123',
          title: 'Enhance Security Monitoring',
          description: 'Implement advanced threat detection capabilities',
          category: 'TECHNOLOGY' as const,
          priority: 'HIGH' as const,
          owner: 'security-team',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          estimatedEffort: 160,
          estimatedCost: 25000,
          dependencies: ['budget-approval', 'vendor-selection'],
          successCriteria: ['Reduced false positives', 'Faster threat detection'],
          riskOfNotImplementing: 'Continued vulnerability to advanced threats',
        };

        const result = await postIncidentService.createImprovementAction(actionData);

        expect(result.id).toBe('improvement-123');
        expect(result.title).toBe('Enhance Security Monitoring');
        expect(result.category).toBe('TECHNOLOGY');
        expect(result.priority).toBe('HIGH');
        expect(result.estimatedEffort).toBe(160);
        expect(result.estimatedCost).toBe(25000);
        expect(result.dependencies).toContain('budget-approval');
        expect(result.successCriteria).toContain('Reduced false positives');
        expect(result.status).toBe('PLANNED');
        expect(result.progress).toBe(0);

        expect(prisma.improvementAction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              incidentId: mockIncidentId,
              lessonId: 'lesson-123',
              title: 'Enhance Security Monitoring',
              category: 'TECHNOLOGY',
              priority: 'HIGH',
              estimatedCost: 25000,
            }),
          })
        );
      });

      it('should update improvement action progress', async () => {
        const mockAction = {
          id: 'improvement-123',
          incidentId: mockIncidentId,
          status: 'IN_PROGRESS',
          progress: 25,
          updates: [],
        };

        postIncidentService['trackingActions'].set('improvement-123', mockAction as any);

        (prisma.improvementAction.update as jest.Mock).mockResolvedValue({
          id: 'improvement-123',
          status: 'IN_PROGRESS',
          progress: 50,
          actualEffort: 80,
          updatedAt: new Date(),
        });

        const updateData = {
          status: 'IN_PROGRESS',
          progress: 50,
          update: 'Vendor selected, implementation started',
          actualEffort: 80,
        };

        const result = await postIncidentService.updateImprovementAction(
          'improvement-123',
          updateData,
          mockUserId
        );

        expect(result.status).toBe('IN_PROGRESS');
        expect(result.progress).toBe(50);
        expect(result.actualEffort).toBe(80);
        expect(result.updates).toHaveLength(1);
        expect(result.updates[0].update).toBe('Vendor selected, implementation started');
        expect(result.updates[0].updatedBy).toBe(mockUserId);

        expect(prisma.improvementAction.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'improvement-123' },
            data: expect.objectContaining({
              status: 'IN_PROGRESS',
              progress: 50,
              actualEffort: 80,
            }),
          })
        );
      });

      it('should handle improvement action completion', async () => {
        const mockAction = {
          id: 'improvement-complete-123',
          status: 'IN_PROGRESS',
          progress: 90,
          updates: [],
        };

        postIncidentService['trackingActions'].set('improvement-complete-123', mockAction as any);

        (prisma.improvementAction.update as jest.Mock).mockResolvedValue({
          id: 'improvement-complete-123',
          status: 'COMPLETED',
          progress: 100,
          completedDate: new Date(),
        });

        const updateData = {
          status: 'COMPLETED',
          progress: 100,
          update: 'Implementation completed successfully',
          completedDate: new Date(),
        };

        const result = await postIncidentService.updateImprovementAction(
          'improvement-complete-123',
          updateData,
          mockUserId
        );

        expect(result.status).toBe('COMPLETED');
        expect(result.progress).toBe(100);
        expect(result.completedDate).toBeDefined();
      });
    });

    describe('Improvement Actions Dashboard', () => {
      it('should generate improvement actions dashboard with statistics', async () => {
        (prisma.improvementAction.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'action-1',
            status: 'COMPLETED',
            priority: 'HIGH',
            category: 'TECHNOLOGY',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          },
          {
            id: 'action-2',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            category: 'PROCESS',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days future
          },
          {
            id: 'action-3',
            status: 'PLANNED',
            priority: 'HIGH',
            category: 'TRAINING',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
          },
          {
            id: 'action-4',
            status: 'IN_PROGRESS',
            priority: 'CRITICAL',
            category: 'TECHNOLOGY',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days future (due soon)
          },
        ]);

        const filters = {
          priority: 'HIGH',
        };

        const result = await postIncidentService.getImprovementActionsDashboard(filters);

        expect(result.actions).toHaveLength(4);
        expect(result.statistics.total).toBe(4);
        expect(result.statistics.byStatus.COMPLETED).toBe(1);
        expect(result.statistics.byStatus.IN_PROGRESS).toBe(2);
        expect(result.statistics.byStatus.PLANNED).toBe(1);
        expect(result.statistics.byPriority.HIGH).toBe(2);
        expect(result.statistics.byPriority.CRITICAL).toBe(1);
        expect(result.statistics.byCategory.TECHNOLOGY).toBe(2);
        expect(result.statistics.overdue).toBe(1); // action-3 is overdue
        expect(result.statistics.dueSoon).toBe(1); // action-4 is due soon

        expect(prisma.improvementAction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              priority: 'HIGH',
            }),
          })
        );
      });
    });

    describe('Lessons Learned Reporting', () => {
      it('should generate comprehensive lessons learned report', async () => {
        (prisma.lessonLearned.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'lesson-1',
            category: 'DETECTION',
            impact: 'HIGH',
            status: 'IMPLEMENTED',
            createdAt: new Date('2024-01-01'),
          },
          {
            id: 'lesson-2',
            category: 'RESPONSE',
            impact: 'MEDIUM',
            status: 'IN_PROGRESS',
            createdAt: new Date('2024-01-15'),
          },
          {
            id: 'lesson-3',
            category: 'DETECTION',
            impact: 'CRITICAL',
            status: 'IDENTIFIED',
            createdAt: new Date('2024-02-01'),
          },
        ]);

        const filters = {
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-02-28'),
          },
          impact: 'HIGH',
        };

        const result = await postIncidentService.generateLessonsLearnedReport(filters);

        expect(result.summary.totalLessons).toBe(3);
        expect(result.summary.byCategory.DETECTION).toBe(2);
        expect(result.summary.byCategory.RESPONSE).toBe(1);
        expect(result.summary.byImpact.HIGH).toBe(1);
        expect(result.summary.byImpact.CRITICAL).toBe(1);
        expect(result.summary.implementationRate).toBeCloseTo(33.33, 1); // 1 out of 3 implemented

        expect(result.topLessons.length).toBeGreaterThanOrEqual(0);
        expect(result.recommendations.length).toBeGreaterThan(0);

        expect(prisma.lessonLearned.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: {
                gte: filters.timeRange.start,
                lte: filters.timeRange.end,
              },
              impact: 'HIGH',
            }),
          })
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete incident lifecycle', async () => {
      // 1. Create incident
      (prisma.securityIncident.create as jest.Mock).mockResolvedValue({
        id: mockIncidentId,
        title: 'End-to-End Test Incident',
        severity: 'P2_HIGH',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      });

      (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-e2e-123',
      });

      const incident = await incidentService.createIncident({
        title: 'End-to-End Test Incident',
        description: 'Testing complete incident response workflow',
        severity: 'P2_HIGH',
        category: 'SECURITY_BREACH',
        source: 'Integration Test',
        reportedBy: mockUserId,
        siteId: mockSiteId,
      });

      expect(incident.id).toBe(mockIncidentId);

      // 2. Update incident status
      incidentService['activeIncidents'].set(mockIncidentId, {
        ...incident,
        timeline: [],
        communications: [],
        actions: [],
        evidence: [],
      });

      (prisma.securityIncident.update as jest.Mock).mockResolvedValue({
        status: 'RESOLVED',
        resolvedAt: new Date(),
      });

      const updatedIncident = await incidentService.updateIncident(
        {
          incidentId: mockIncidentId,
          status: 'RESOLVED',
          resolution: 'Threat contained and systems secured',
        },
        mockUserId
      );

      expect(updatedIncident.status).toBe('RESOLVED');

      // 3. Schedule post-incident review
      (prisma.postIncidentReview.create as jest.Mock).mockResolvedValue({
        id: 'review-e2e-123',
        incidentId: mockIncidentId,
        reviewType: 'FULL',
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const review = await postIncidentService.schedulePostIncidentReview({
        incidentId: mockIncidentId,
        reviewType: 'FULL',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        facilitator: 'security-lead',
        participants: [
          { userId: 'analyst-1', role: 'security-analyst', participation: 'REQUIRED' },
        ],
        objectives: ['Root cause analysis'],
        framework: 'ROOT_CAUSE',
      });

      expect(review.incidentId).toBe(mockIncidentId);

      // 4. Create lessons learned
      (prisma.lessonLearned.create as jest.Mock).mockResolvedValue({
        id: 'lesson-e2e-123',
        incidentId: mockIncidentId,
        category: 'PREVENTION',
        status: 'IDENTIFIED',
        createdAt: new Date(),
      });

      const lesson = await postIncidentService.createLessonLearned({
        incidentId: mockIncidentId,
        category: 'PREVENTION',
        lesson: 'Security controls need enhancement',
        impact: 'HIGH',
        actionable: true,
        recommendation: 'Implement additional monitoring',
        implementationEffort: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        owner: 'security-team',
      });

      expect(lesson.incidentId).toBe(mockIncidentId);

      // Verify all components worked together
      expect(prisma.securityIncident.create).toHaveBeenCalled();
      expect(prisma.securityIncident.update).toHaveBeenCalled();
      expect(prisma.postIncidentReview.create).toHaveBeenCalled();
      expect(prisma.lessonLearned.create).toHaveBeenCalled();
    });

    it('should handle automated incident detection and response', async () => {
      // Simulate automated incident creation from security event
      (prisma.securityIncident.create as jest.Mock).mockResolvedValue({
        id: 'INC-AUTO-123',
        title: 'Automated Security Incident',
        severity: 'P1_CRITICAL',
        category: 'SECURITY_BREACH',
        status: 'NEW',
        metadata: { autoDetected: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (prisma.incidentTimeline.create as jest.Mock).mockResolvedValue({
        id: 'timeline-auto-123',
      });

      (prisma.incidentAction.create as jest.Mock).mockResolvedValue({
        id: 'action-auto-123',
        actionType: 'isolate-systems',
        automated: true,
        status: 'PENDING',
      });

      // Create incident with automated detection
      const incident = await incidentService.createIncident({
        title: 'Automated Security Incident',
        description: 'Critical security breach detected by automated systems',
        severity: 'P1_CRITICAL',
        category: 'SECURITY_BREACH',
        source: 'SIEM',
        reportedBy: 'SYSTEM',
        siteId: mockSiteId,
        metadata: {
          autoDetected: true,
          detectionConfidence: 0.95,
          threatIndicators: ['malicious_ip', 'suspicious_payload'],
        },
      });

      expect(incident.severity).toBe('P1_CRITICAL');
      expect(incident.metadata.autoDetected).toBe(true);

      // Verify automated actions were triggered
      expect(prisma.incidentAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: 'isolate-systems',
            automated: true,
          }),
        })
      );

      // Verify notifications were sent
      expect(alertingService.sendNotification).toHaveBeenCalled();
    });
  });
});

// Helper functions for test setup
function createMockIncident(overrides: any = {}) {
  return {
    id: 'INC-TEST-123',
    title: 'Mock Security Incident',
    description: 'Mock incident for testing',
    severity: 'P2_HIGH',
    category: 'SECURITY_BREACH',
    status: 'NEW',
    priority: 2,
    source: 'Test',
    affectedSystems: ['test-system'],
    reportedBy: 'test-user',
    siteId: 'test-site',
    createdAt: new Date(),
    updatedAt: new Date(),
    timeline: [],
    communications: [],
    actions: [],
    evidence: [],
    metadata: {},
    ...overrides,
  };
}

function createMockLessonLearned(overrides: any = {}) {
  return {
    id: 'lesson-test-123',
    incidentId: 'INC-TEST-123',
    category: 'DETECTION',
    lesson: 'Mock lesson learned',
    impact: 'MEDIUM',
    actionable: true,
    recommendation: 'Mock recommendation',
    implementationEffort: 'MEDIUM',
    timeframe: 'SHORT_TERM',
    owner: 'security-team',
    dependencies: [],
    status: 'IDENTIFIED',
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockImprovementAction(overrides: any = {}) {
  return {
    id: 'action-test-123',
    incidentId: 'INC-TEST-123',
    lessonId: 'lesson-test-123',
    title: 'Mock Improvement Action',
    description: 'Mock action for testing',
    category: 'TECHNOLOGY',
    priority: 'HIGH',
    owner: 'security-team',
    status: 'PLANNED',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    estimatedEffort: 40,
    dependencies: [],
    successCriteria: ['Mock success criteria'],
    riskOfNotImplementing: 'Mock risk',
    progress: 0,
    updates: [],
    createdAt: new Date(),
    ...overrides,
  };
} 