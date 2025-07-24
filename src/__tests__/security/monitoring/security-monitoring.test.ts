import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SIEMService } from '../../../lib/security/monitoring/siem-service';
import { ThreatDetectionEngine } from '../../../lib/security/monitoring/threat-detection';
import { SecurityEventCorrelationEngine } from '../../../lib/security/monitoring/correlation-engine';
import { SecurityAnalyticsService } from '../../../lib/security/monitoring/analytics-service';

// Mock dependencies
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    threatIndicator: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    alertRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    securityAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    securityIncident: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    correlationResult: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    correlationRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    anomalyDetection: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    threatAssessment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userBehaviorProfile: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    kpiDefinition: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    kpiValue: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    analyticsReport: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    complianceRecord: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../lib/redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    lpush: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { redis } from '../../../lib/redis';

describe('Security Monitoring System', () => {
  let siemService: SIEMService;
  let threatDetectionEngine: ThreatDetectionEngine;
  let correlationEngine: SecurityEventCorrelationEngine;
  let analyticsService: SecurityAnalyticsService;

  const mockUserId = 'user-123';
  const mockSiteId = 'site-123';
  const mockIpAddress = '192.168.1.100';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instances with mocked dependencies
    siemService = new SIEMService();
    threatDetectionEngine = new ThreatDetectionEngine();
    correlationEngine = new SecurityEventCorrelationEngine();
    analyticsService = new SecurityAnalyticsService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('SIEM Service', () => {
    describe('Event Ingestion', () => {
      it('should ingest security event successfully', async () => {
        // Mock database creation
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-123',
          eventType: 'AUTHENTICATION',
          severity: 'MEDIUM',
          title: 'Login Attempt',
          description: 'User login attempt detected',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: mockIpAddress,
          createdAt: new Date(),
          metadata: { threatScore: 25 },
        });

        // Mock Redis caching
        (redis.setex as jest.Mock).mockResolvedValue('OK');

        const eventData = {
          eventType: 'AUTHENTICATION' as const,
          severity: 'MEDIUM' as const,
          source: 'TestSource',
          title: 'Login Attempt',
          description: 'User login attempt detected',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: mockIpAddress,
          metadata: { success: true },
        };

        const result = await siemService.ingestEvent(eventData);

        expect(result.id).toBe('event-123');
        expect(result.eventType).toBe('AUTHENTICATION');
        expect(result.threatScore).toBeGreaterThanOrEqual(0);
        expect(result.threatScore).toBeLessThanOrEqual(100);

        expect(prisma.securityEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              eventType: 'AUTHENTICATION',
              severity: 'MEDIUM',
              title: 'Login Attempt',
              description: 'User login attempt detected',
              userId: mockUserId,
              siteId: mockSiteId,
              ipAddress: mockIpAddress,
            }),
          })
        );

        expect(redis.setex).toHaveBeenCalledWith(
          `security:event:event-123`,
          3600,
          expect.any(String)
        );
      });

      it('should calculate threat score correctly', async () => {
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-high-threat',
          eventType: 'THREAT_DETECTED',
          severity: 'CRITICAL',
          createdAt: new Date(),
          metadata: { threatScore: 85 },
        });

        const eventData = {
          eventType: 'THREAT_DETECTED' as const,
          severity: 'CRITICAL' as const,
          source: 'ThreatDetection',
          title: 'High Severity Threat',
          description: 'Critical threat detected',
          ipAddress: '10.0.0.1', // Potentially suspicious IP
          metadata: { malwareDetected: true },
        };

        const result = await siemService.ingestEvent(eventData);

        expect(result.threatScore).toBeGreaterThan(50); // Should be high due to critical severity
      });

      it('should handle event ingestion errors gracefully', async () => {
        (prisma.securityEvent.create as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        const eventData = {
          eventType: 'AUTHENTICATION' as const,
          severity: 'LOW' as const,
          source: 'TestSource',
          title: 'Test Event',
          description: 'Test event description',
        };

        await expect(siemService.ingestEvent(eventData)).rejects.toThrow(
          'Event ingestion failed: Database connection failed'
        );
      });
    });

    describe('Threat Indicator Management', () => {
      it('should create threat indicator successfully', async () => {
        (prisma.threatIndicator.create as jest.Mock).mockResolvedValue({
          id: 'indicator-123',
          type: 'MALICIOUS_IP',
          value: '192.168.1.100',
          severity: 'HIGH',
          confidence: 90,
          source: 'ThreatIntel',
          description: 'Known malicious IP address',
          active: true,
          createdAt: new Date(),
          expiresAt: null,
          metadata: {},
        });

        const indicatorData = {
          type: 'MALICIOUS_IP' as const,
          value: '192.168.1.100',
          severity: 'HIGH' as const,
          confidence: 90,
          source: 'ThreatIntel',
          description: 'Known malicious IP address',
        };

        const result = await siemService.createThreatIndicator(indicatorData);

        expect(result.id).toBe('indicator-123');
        expect(result.type).toBe('MALICIOUS_IP');
        expect(result.value).toBe('192.168.1.100');
        expect(result.confidence).toBe(90);
        expect(result.active).toBe(true);

        expect(prisma.threatIndicator.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'MALICIOUS_IP',
              value: '192.168.1.100',
              severity: 'HIGH',
              confidence: 90,
              source: 'ThreatIntel',
              description: 'Known malicious IP address',
              active: true,
            }),
          })
        );
      });

      it('should handle threat indicator expiration', async () => {
        const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        (prisma.threatIndicator.create as jest.Mock).mockResolvedValue({
          id: 'indicator-expiring',
          type: 'SUSPICIOUS_DOMAIN',
          value: 'malicious.example.com',
          severity: 'MEDIUM',
          confidence: 75,
          source: 'DomainIntel',
          description: 'Suspicious domain with temporary threat status',
          active: true,
          createdAt: new Date(),
          expiresAt: expirationDate,
          metadata: {},
        });

        const indicatorData = {
          type: 'SUSPICIOUS_DOMAIN' as const,
          value: 'malicious.example.com',
          severity: 'MEDIUM' as const,
          confidence: 75,
          source: 'DomainIntel',
          description: 'Suspicious domain with temporary threat status',
          expiresAt: expirationDate,
        };

        const result = await siemService.createThreatIndicator(indicatorData);

        expect(result.expiresAt).toEqual(expirationDate);
        expect(result.active).toBe(true);
      });
    });

    describe('Alert Rule Management', () => {
      it('should create alert rule successfully', async () => {
        (prisma.alertRule.create as jest.Mock).mockResolvedValue({
          id: 'rule-123',
          name: 'Failed Login Attempts',
          description: 'Detect multiple failed login attempts',
          enabled: true,
          severity: 'HIGH',
          conditions: [
            { field: 'eventType', operator: 'equals', value: 'AUTHENTICATION' },
            { field: 'metadata.success', operator: 'equals', value: false },
          ],
          timeWindow: 300,
          threshold: 5,
          actions: [
            { type: 'EMAIL', target: 'security@company.com' },
            { type: 'CREATE_INCIDENT', target: 'security' },
          ],
          suppressionTime: 3600,
          triggerCount: 0,
        });

        const ruleData = {
          name: 'Failed Login Attempts',
          description: 'Detect multiple failed login attempts',
          enabled: true,
          severity: 'HIGH' as const,
          conditions: [
            { field: 'eventType', operator: 'equals' as const, value: 'AUTHENTICATION' },
            { field: 'metadata.success', operator: 'equals' as const, value: false },
          ],
          timeWindow: 300,
          threshold: 5,
          actions: [
            { type: 'EMAIL' as const, target: 'security@company.com' },
            { type: 'CREATE_INCIDENT' as const, target: 'security' },
          ],
          suppressionTime: 3600,
        };

        const result = await siemService.createAlertRule(ruleData);

        expect(result.id).toBe('rule-123');
        expect(result.name).toBe('Failed Login Attempts');
        expect(result.enabled).toBe(true);
        expect(result.threshold).toBe(5);
        expect(result.triggerCount).toBe(0);
      });

      it('should validate alert rule conditions', async () => {
        const invalidRuleData = {
          name: 'Invalid Rule',
          description: 'Rule with invalid conditions',
          enabled: true,
          severity: 'INVALID_SEVERITY' as any, // Invalid severity
          conditions: [],
          timeWindow: 300,
          threshold: 5,
          actions: [],
        };

        await expect(siemService.createAlertRule(invalidRuleData)).rejects.toThrow();
      });
    });

    describe('Security Metrics', () => {
      it('should calculate security metrics correctly', async () => {
        const timeRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02'),
        };

        // Mock event counts
        (prisma.securityEvent.count as jest.Mock).mockResolvedValue(150);
        (prisma.securityEvent.groupBy as jest.Mock)
          .mockResolvedValueOnce([
            { eventType: 'AUTHENTICATION', _count: { eventType: 75 } },
            { eventType: 'DATA_ACCESS', _count: { eventType: 45 } },
            { eventType: 'API_ACCESS', _count: { eventType: 30 } },
          ])
          .mockResolvedValueOnce([
            { severity: 'INFO', _count: { severity: 90 } },
            { severity: 'MEDIUM', _count: { severity: 45 } },
            { severity: 'HIGH', _count: { severity: 15 } },
          ]);

        // Mock threat and incident counts
        (prisma.threatAssessment.count as jest.Mock).mockResolvedValue(8);
        (prisma.securityIncident.count as jest.Mock).mockResolvedValue(3);
        (prisma.securityAlert.count as jest.Mock).mockResolvedValue(12);

        const metrics = await siemService.getSecurityMetrics(timeRange);

        expect(metrics.totalEvents).toBe(150);
        expect(metrics.eventsByType).toEqual({
          AUTHENTICATION: 75,
          DATA_ACCESS: 45,
          API_ACCESS: 30,
        });
        expect(metrics.eventsBySeverity).toEqual({
          INFO: 90,
          MEDIUM: 45,
          HIGH: 15,
        });
        expect(metrics.threatsDetected).toBe(8);
        expect(metrics.incidentCount).toBe(3);
        expect(metrics.activeAlerts).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Threat Detection Engine', () => {
    describe('Anomaly Detection', () => {
      it('should detect statistical anomalies', async () => {
        // Mock user behavior baseline
        threatDetectionEngine['userBaselines'] = new Map([
          [mockUserId, {
            userId: mockUserId,
            loginPatterns: {
              averageLoginsPerDay: 5,
              commonHours: [8, 9, 10, 17, 18],
              commonDaysOfWeek: [1, 2, 3, 4, 5],
              commonLocations: ['US'],
              commonDevices: ['Chrome/Windows'],
            },
            apiUsagePatterns: {
              averageCallsPerHour: 25,
              commonEndpoints: ['/api/data', '/api/users'],
              requestSizeDistribution: [100, 200, 150],
            },
            dataAccessPatterns: {
              averageAccessesPerDay: 10,
              commonResources: ['documents', 'reports'],
              accessTimeDistribution: [9, 10, 11, 14, 15, 16],
            },
            lastUpdated: new Date(),
          }],
        ]);

        // Mock recent events for statistical analysis
        threatDetectionEngine['getRecentUserEvents'] = jest.fn().mockResolvedValue([
          { timestamp: new Date(), metadata: { loginCount: 5 } },
          { timestamp: new Date(), metadata: { loginCount: 4 } },
          { timestamp: new Date(), metadata: { loginCount: 6 } },
          { timestamp: new Date(), metadata: { loginCount: 5 } },
          { timestamp: new Date(), metadata: { loginCount: 25 } }, // Anomalous value
        ]);

        (prisma.anomalyDetection.create as jest.Mock).mockResolvedValue({
          id: 'anomaly-123',
          entityId: mockUserId,
          entityType: 'USER',
          anomalyType: 'STATISTICAL',
          severity: 'HIGH',
          confidence: 0.85,
          description: 'Statistical anomaly in login count',
          features: { loginCount: 25, zScore: 4.2 },
          baseline: { mean: 5, stdDev: 0.8 },
          detectedAt: new Date(),
          resolved: false,
          metadata: {},
        });

        const mockEvent = {
          id: 'event-anomaly',
          eventType: 'AUTHENTICATION',
          severity: 'MEDIUM',
          source: 'AuthSystem',
          title: 'User Login',
          description: 'User authentication event',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: mockIpAddress,
          timestamp: new Date(),
          threatScore: 25,
          processed: false,
          metadata: { loginCount: 25 },
        } as any;

        const anomalies = await threatDetectionEngine.detectAnomalies(mockEvent);

        expect(anomalies).toHaveLength(1);
        expect(anomalies[0].anomalyType).toBe('STATISTICAL');
        expect(anomalies[0].severity).toBe('HIGH');
        expect(anomalies[0].confidence).toBeGreaterThan(0.8);
        expect(anomalies[0].features.loginCount).toBe(25);
      });

      it('should detect temporal anomalies', async () => {
        (prisma.anomalyDetection.create as jest.Mock).mockResolvedValue({
          id: 'temporal-anomaly-123',
        });

        // Create event at 2 AM (off-hours)
        const offHoursEvent = {
          id: 'event-off-hours',
          eventType: 'ADMIN_OPERATION',
          severity: 'HIGH',
          source: 'AdminPanel',
          title: 'Admin Action',
          description: 'Administrative operation performed',
          userId: mockUserId,
          siteId: mockSiteId,
          timestamp: new Date('2024-01-01T02:00:00Z'), // 2 AM
          threatScore: 30,
          processed: false,
          metadata: {},
        } as any;

        const anomalies = await threatDetectionEngine.detectAnomalies(offHoursEvent);

        expect(anomalies.length).toBeGreaterThan(0);
        
        const temporalAnomaly = anomalies.find(a => a.anomalyType === 'TEMPORAL');
        expect(temporalAnomaly).toBeDefined();
        expect(temporalAnomaly?.description).toContain('Off-hours activity');
        expect(temporalAnomaly?.features.hour).toBe(2);
        expect(temporalAnomaly?.features.isBusinessHours).toBe(false);
      });

      it('should detect geographical anomalies', async () => {
        // Mock user historical locations
        threatDetectionEngine['getUserHistoricalLocations'] = jest.fn().mockResolvedValue([
          { country: 'US', city: 'New York', latitude: 40.7128, longitude: -74.0060 },
          { country: 'US', city: 'Boston', latitude: 42.3601, longitude: -71.0589 },
        ]);

        // Mock location lookup for suspicious IP
        threatDetectionEngine['getLocationFromIP'] = jest.fn().mockResolvedValue({
          country: 'RU',
          city: 'Moscow',
          latitude: 55.7558,
          longitude: 37.6176,
        });

        (prisma.anomalyDetection.create as jest.Mock).mockResolvedValue({
          id: 'geo-anomaly-123',
        });

        const suspiciousLocationEvent = {
          id: 'event-suspicious-location',
          eventType: 'AUTHENTICATION',
          severity: 'MEDIUM',
          source: 'AuthSystem',
          title: 'Login from new location',
          description: 'User login from unusual geographic location',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: '85.143.202.58', // Russian IP
          timestamp: new Date(),
          threatScore: 40,
          processed: false,
          metadata: {},
        } as any;

        const anomalies = await threatDetectionEngine.detectAnomalies(suspiciousLocationEvent);

        const geoAnomaly = anomalies.find(a => a.anomalyType === 'GEOGRAPHICAL');
        expect(geoAnomaly).toBeDefined();
        expect(geoAnomaly?.description).toContain('unusual location');
        expect(geoAnomaly?.features.currentCountry).toBe('RU');
        expect(geoAnomaly?.severity).toBe('HIGH'); // Non-common country
      });

      it('should detect volume anomalies', async () => {
        // Mock recent activity volume
        threatDetectionEngine['getRecentActivityVolume'] = jest.fn().mockResolvedValue(150); // High volume

        (prisma.anomalyDetection.create as jest.Mock).mockResolvedValue({
          id: 'volume-anomaly-123',
        });

        const highVolumeEvent = {
          id: 'event-high-volume',
          eventType: 'API_ACCESS',
          severity: 'MEDIUM',
          source: 'APIGateway',
          title: 'API Request',
          description: 'API request processed',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: mockIpAddress,
          timestamp: new Date(),
          threatScore: 20,
          processed: false,
          metadata: {},
        } as any;

        const anomalies = await threatDetectionEngine.detectAnomalies(highVolumeEvent);

        const volumeAnomaly = anomalies.find(a => a.anomalyType === 'VOLUME');
        expect(volumeAnomaly).toBeDefined();
        expect(volumeAnomaly?.description).toContain('High volume');
        expect(volumeAnomaly?.features.currentVolume).toBe(150);
      });
    });

    describe('Threat Assessment', () => {
      it('should assess threat level correctly', async () => {
        const mockEvent = {
          id: 'event-assessment',
          eventType: 'AUTHENTICATION',
          severity: 'HIGH',
          source: 'AuthSystem',
          title: 'Suspicious Login',
          description: 'Login attempt with multiple anomalies',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: mockIpAddress,
          timestamp: new Date(),
          threatScore: 60,
          processed: false,
          metadata: {},
        } as any;

        const mockAnomalies = [
          {
            id: 'anomaly-1',
            entityId: mockUserId,
            entityType: 'USER',
            anomalyType: 'GEOGRAPHICAL',
            severity: 'HIGH',
            confidence: 0.9,
            description: 'Login from unusual country',
            features: {},
            baseline: {},
            detectedAt: new Date(),
            resolved: false,
            metadata: {},
          },
          {
            id: 'anomaly-2',
            entityId: mockUserId,
            entityType: 'USER',
            anomalyType: 'TEMPORAL',
            severity: 'MEDIUM',
            confidence: 0.7,
            description: 'Off-hours activity',
            features: {},
            baseline: {},
            detectedAt: new Date(),
            resolved: false,
            metadata: {},
          },
        ] as any;

        (prisma.threatAssessment.create as jest.Mock).mockResolvedValue({
          id: 'assessment-123',
          targetId: mockUserId,
          targetType: 'USER',
          threatType: 'ACCOUNT_TAKEOVER',
          riskScore: 85,
          confidence: 0.85,
          indicators: ['Geographical anomaly', 'Temporal anomaly'],
          mitigationActions: ['Force password reset', 'Enable MFA'],
          createdAt: new Date(),
          metadata: {},
        });

        const assessment = await threatDetectionEngine.assessThreat(mockEvent, mockAnomalies);

        expect(assessment.riskScore).toBeGreaterThan(80); // High risk due to multiple anomalies
        expect(assessment.threatType).toBe('ACCOUNT_TAKEOVER');
        expect(assessment.confidence).toBeGreaterThan(0.8);
        expect(assessment.indicators).toHaveLength(2);
        expect(assessment.mitigationActions.length).toBeGreaterThan(0);
      });

      it('should identify threat patterns correctly', async () => {
        // Mock attack pattern detection
        threatDetectionEngine['checkAttackPatterns'] = jest.fn().mockResolvedValue([
          {
            name: 'Brute Force Attack',
            type: 'BRUTE_FORCE',
            severity: 'HIGH',
            confidence: 0.95,
            features: { failedAttempts: 8, timeWindow: 300 },
            baseline: { normalFailedAttempts: 2 },
            rules: ['Multiple failed logins', 'Rapid succession'],
          },
        ]);

        const bruteForceEvent = {
          id: 'event-brute-force',
          eventType: 'AUTHENTICATION',
          severity: 'HIGH',
          source: 'AuthSystem',
          title: 'Failed Login',
          description: 'Authentication failed',
          userId: mockUserId,
          siteId: mockSiteId,
          ipAddress: mockIpAddress,
          timestamp: new Date(),
          threatScore: 70,
          processed: false,
          metadata: { success: false, attemptNumber: 8 },
        } as any;

        (prisma.threatAssessment.create as jest.Mock).mockResolvedValue({
          id: 'brute-force-assessment',
          threatType: 'BRUTE_FORCE',
          riskScore: 85,
        });

        const assessment = await threatDetectionEngine.assessThreat(bruteForceEvent, []);

        expect(assessment.threatType).toBe('BRUTE_FORCE');
        expect(assessment.riskScore).toBeGreaterThan(70);
      });
    });
  });

  describe('Correlation Engine', () => {
    describe('Event Correlation', () => {
      it('should perform temporal correlation', async () => {
        const events = [
          {
            id: 'event-1',
            eventType: 'AUTHENTICATION',
            severity: 'MEDIUM',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            userId: mockUserId,
            metadata: { success: false },
          },
          {
            id: 'event-2',
            eventType: 'AUTHENTICATION',
            severity: 'MEDIUM',
            timestamp: new Date('2024-01-01T10:01:00Z'),
            userId: mockUserId,
            metadata: { success: false },
          },
          {
            id: 'event-3',
            eventType: 'AUTHENTICATION',
            severity: 'LOW',
            timestamp: new Date('2024-01-01T10:02:00Z'),
            userId: mockUserId,
            metadata: { success: true },
          },
        ] as any;

        (prisma.correlationResult.create as jest.Mock).mockResolvedValue({
          id: 'correlation-123',
          name: 'Brute Force Pattern',
          type: 'SEQUENCE',
          confidence: 0.9,
          severity: 'HIGH',
          description: 'Failed logins followed by successful login',
          events,
          correlationFields: ['userId', 'eventType'],
          timeSpan: 120000, // 2 minutes
          createdAt: new Date(),
          metadata: {},
        });

        const correlationRequest = {
          timeRange: {
            start: new Date('2024-01-01T09:00:00Z'),
            end: new Date('2024-01-01T11:00:00Z'),
          },
          algorithms: ['temporal' as const],
        };

        const result = await correlationEngine.performCorrelationAnalysis(correlationRequest);

        expect(result.correlations.length).toBeGreaterThan(0);
        
        const temporalCorrelation = result.correlations.find(c => c.type === 'SEQUENCE');
        expect(temporalCorrelation).toBeDefined();
        expect(temporalCorrelation?.confidence).toBeGreaterThan(0.8);
        expect(temporalCorrelation?.events).toHaveLength(3);
      });

      it('should perform spatial correlation', async () => {
        const events = [
          {
            id: 'event-ip-1',
            eventType: 'AUTHENTICATION',
            severity: 'MEDIUM',
            timestamp: new Date(),
            ipAddress: '192.168.1.100',
            metadata: { success: false },
          },
          {
            id: 'event-ip-2',
            eventType: 'DATA_ACCESS',
            severity: 'HIGH',
            timestamp: new Date(),
            ipAddress: '192.168.1.100',
            metadata: { resource: 'sensitive-data' },
          },
          {
            id: 'event-ip-3',
            eventType: 'FILE_OPERATION',
            severity: 'HIGH',
            timestamp: new Date(),
            ipAddress: '192.168.1.100',
            metadata: { operation: 'download' },
          },
        ] as any;

        (prisma.correlationResult.create as jest.Mock).mockResolvedValue({
          id: 'spatial-correlation-123',
          name: 'IP-based Attack Pattern',
          type: 'CLUSTER',
          confidence: 0.8,
          severity: 'HIGH',
          description: 'Multiple suspicious activities from same IP',
          events,
          correlationFields: ['ipAddress'],
          timeSpan: 600000, // 10 minutes
          createdAt: new Date(),
          metadata: { ipAddress: '192.168.1.100' },
        });

        const correlationRequest = {
          timeRange: {
            start: new Date(Date.now() - 3600000), // 1 hour ago
            end: new Date(),
          },
          algorithms: ['spatial' as const],
        };

        const result = await correlationEngine.performCorrelationAnalysis(correlationRequest);

        expect(result.correlations.length).toBeGreaterThan(0);
        
        const spatialCorrelation = result.correlations.find(c => c.type === 'CLUSTER');
        expect(spatialCorrelation).toBeDefined();
        expect(spatialCorrelation?.correlationFields).toContain('ipAddress');
        expect(spatialCorrelation?.events.every(e => e.ipAddress === '192.168.1.100')).toBe(true);
      });

      it('should create correlation rules', async () => {
        (prisma.correlationRule.create as jest.Mock).mockResolvedValue({
          id: 'rule-correlation-123',
          name: 'Data Exfiltration Pattern',
          description: 'Detect potential data exfiltration sequences',
          enabled: true,
          priority: 'CRITICAL',
          conditions: [
            { field: 'eventType', operator: 'in', value: ['DATA_ACCESS', 'FILE_OPERATION'] },
          ],
          timeWindow: 1800,
          minEvents: 10,
          maxEvents: 1000,
          correlationFields: ['userId', 'resourceType'],
          actions: [
            { type: 'CREATE_INCIDENT', parameters: { severity: 'CRITICAL' } },
          ],
          suppressionTime: 7200,
          triggerCount: 0,
        });

        const ruleData = {
          name: 'Data Exfiltration Pattern',
          description: 'Detect potential data exfiltration sequences',
          enabled: true,
          priority: 'CRITICAL' as const,
          conditions: [
            { field: 'eventType', operator: 'in' as const, value: ['DATA_ACCESS', 'FILE_OPERATION'] },
          ],
          timeWindow: 1800,
          minEvents: 10,
          maxEvents: 1000,
          correlationFields: ['userId', 'resourceType'],
          actions: [
            { type: 'CREATE_INCIDENT' as const, parameters: { severity: 'CRITICAL' } },
          ],
          suppressionTime: 7200,
        };

        const rule = await correlationEngine.createCorrelationRule(ruleData);

        expect(rule.id).toBe('rule-correlation-123');
        expect(rule.name).toBe('Data Exfiltration Pattern');
        expect(rule.priority).toBe('CRITICAL');
        expect(rule.enabled).toBe(true);
        expect(rule.minEvents).toBe(10);
        expect(rule.correlationFields).toContain('userId');
        expect(rule.actions).toHaveLength(1);
      });
    });

    describe('Pattern Detection', () => {
      it('should detect brute force attack patterns', async () => {
        // Mock sequence pattern detection
        correlationEngine['detectSequencePattern'] = jest.fn().mockResolvedValue([
          {
            id: 'brute-force-pattern',
            name: 'Brute Force Attack Sequence',
            type: 'PATTERN',
            confidence: 0.95,
            severity: 'HIGH',
            description: 'Multiple failed logins followed by successful authentication',
            events: [], // Would contain actual events
            correlationFields: ['userId', 'ipAddress'],
            timeSpan: 300000, // 5 minutes
            createdAt: new Date(),
            metadata: {
              patternType: 'BRUTE_FORCE',
              failedAttempts: 8,
              successfulLogin: true,
            },
          },
        ]);

        const events = [] as any; // Would contain actual event data
        const pattern = { sequence: ['AUTHENTICATION_FAILED', 'AUTHENTICATION_FAILED', 'AUTHENTICATION_SUCCESS'] };

        const sequences = await correlationEngine['detectSequencePattern'](events, pattern);

        expect(sequences).toHaveLength(1);
        expect(sequences[0].name).toContain('Brute Force');
        expect(sequences[0].confidence).toBeGreaterThan(0.9);
        expect(sequences[0].metadata.patternType).toBe('BRUTE_FORCE');
      });
    });
  });

  describe('Analytics Service', () => {
    describe('Real-time Metrics', () => {
      it('should collect real-time security metrics', async () => {
        // Mock database queries for metrics
        (prisma.securityEvent.count as jest.Mock).mockResolvedValue(1500);
        (prisma.securityEvent.groupBy as jest.Mock)
          .mockResolvedValueOnce([
            { eventType: 'AUTHENTICATION', _count: { eventType: 800 } },
            { eventType: 'DATA_ACCESS', _count: { eventType: 400 } },
            { eventType: 'API_ACCESS', _count: { eventType: 300 } },
          ])
          .mockResolvedValueOnce([
            { severity: 'INFO', _count: { severity: 1000 } },
            { severity: 'MEDIUM', _count: { severity: 350 } },
            { severity: 'HIGH', _count: { severity: 100 } },
            { severity: 'CRITICAL', _count: { severity: 50 } },
          ]);

        (prisma.threatAssessment.count as jest.Mock).mockResolvedValue(25);
        (prisma.securityIncident.count as jest.Mock).mockResolvedValue(8);
        (prisma.securityAlert.count as jest.Mock).mockResolvedValue(45);

        // Mock compliance records
        (prisma.complianceRecord.findMany as jest.Mock).mockResolvedValue([
          { id: '1', requirement: 'ACCESS_CONTROL', status: 'COMPLIANT' },
          { id: '2', requirement: 'ACCESS_CONTROL', status: 'COMPLIANT' },
          { id: '3', requirement: 'DATA_PROTECTION', status: 'NON_COMPLIANT' },
          { id: '4', requirement: 'DATA_PROTECTION', status: 'COMPLIANT' },
        ]);

        const metrics = await analyticsService.getRealTimeMetrics();

        expect(metrics.security.totalEvents).toBe(1500);
        expect(metrics.security.eventsByType.AUTHENTICATION).toBe(800);
        expect(metrics.security.eventsBySeverity.CRITICAL).toBe(50);
        expect(metrics.security.threatsDetected).toBe(25);
        expect(metrics.security.incidentsCreated).toBe(8);
        
        expect(metrics.performance.systemHealth.uptime).toBeGreaterThan(0);
        expect(metrics.performance.systemHealth.availability).toBeGreaterThan(99);
        
        expect(metrics.compliance.overallScore).toBeGreaterThan(0);
        expect(metrics.compliance.policyCompliance.ACCESS_CONTROL).toBe(100);
        expect(metrics.compliance.policyCompliance.DATA_PROTECTION).toBe(50);
        
        expect(metrics.lastUpdated).toBeInstanceOf(Date);
      });
    });

    describe('KPI Management', () => {
      it('should create KPI definition successfully', async () => {
        (prisma.kpiDefinition.create as jest.Mock).mockResolvedValue({
          id: 'kpi-threat-detection',
          name: 'Threat Detection Rate',
          description: 'Percentage of threats successfully detected',
          category: 'security',
          unit: 'percentage',
          query: 'SELECT (COUNT(*) FILTER (WHERE detected = true) * 100.0 / COUNT(*)) FROM threats',
          thresholds: { warning: 90, target: 95 },
          frequency: 'hourly',
          enabled: true,
        });

        const kpiData = {
          name: 'Threat Detection Rate',
          description: 'Percentage of threats successfully detected',
          category: 'security' as const,
          unit: 'percentage',
          query: 'SELECT (COUNT(*) FILTER (WHERE detected = true) * 100.0 / COUNT(*)) FROM threats',
          thresholds: { warning: 90, target: 95 },
          frequency: 'hourly' as const,
          enabled: true,
        };

        const kpi = await analyticsService.createKPIDefinition(kpiData);

        expect(kpi.id).toBe('kpi-threat-detection');
        expect(kpi.name).toBe('Threat Detection Rate');
        expect(kpi.category).toBe('security');
        expect(kpi.unit).toBe('percentage');
        expect(kpi.thresholds.target).toBe(95);
        expect(kpi.enabled).toBe(true);
      });

      it('should calculate KPIs correctly', async () => {
        // Mock KPI definitions
        analyticsService['kpiDefinitions'] = new Map([
          ['kpi-1', {
            id: 'kpi-1',
            name: 'Threat Detection Rate',
            description: 'Test KPI',
            category: 'security',
            unit: 'percentage',
            query: 'SELECT 95.5',
            thresholds: { warning: 90, target: 95 },
            frequency: 'hourly',
            enabled: true,
          }],
        ]);

        // Mock KPI query execution
        analyticsService['executeKPIQuery'] = jest.fn().mockResolvedValue(95.5);
        analyticsService['calculateKPITrend'] = jest.fn().mockResolvedValue(2.1);

        (prisma.kpiValue.create as jest.Mock).mockResolvedValue({
          id: 'kpi-value-1',
          kpiId: 'kpi-1',
          value: 95.5,
          status: 'good',
          trend: 2.1,
          timestamp: new Date(),
        });

        const kpis = await analyticsService.calculateKPIs();

        expect(kpis['kpi-1']).toBeDefined();
        expect(kpis['kpi-1'].value).toBe(95.5);
        expect(kpis['kpi-1'].status).toBe('good');
        expect(kpis['kpi-1'].trend).toBe(2.1);
        expect(kpis['kpi-1'].unit).toBe('percentage');
      });
    });

    describe('Report Generation', () => {
      it('should generate operational security report', async () => {
        (prisma.analyticsReport.create as jest.Mock).mockResolvedValue({
          id: 'report-operational-123',
          reportType: 'operational',
          title: 'Security Operations Report',
          timeRangeStart: new Date('2024-01-01'),
          timeRangeEnd: new Date('2024-01-02'),
          format: 'html',
          sections: [],
          metadata: {},
          recipients: ['security-team@company.com'],
        });

        // Mock section generation
        analyticsService['generateOperationalSections'] = jest.fn().mockResolvedValue([
          {
            title: 'Security Overview',
            content: {
              totalEvents: 1500,
              threatsStopped: 25,
              incidentsResolved: 8,
            },
            visualization: 'chart',
          },
          {
            title: 'Top Threats',
            content: [
              { type: 'Brute Force', count: 12, severity: 'HIGH' },
              { type: 'Malware', count: 8, severity: 'CRITICAL' },
              { type: 'Phishing', count: 5, severity: 'MEDIUM' },
            ],
            visualization: 'table',
          },
        ]);

        const reportData = {
          reportType: 'operational' as const,
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-02'),
          },
          format: 'html' as const,
          recipients: ['security-team@company.com'],
        };

        const report = await analyticsService.generateReport(reportData);

        expect(report.id).toBe('report-operational-123');
        expect(report.reportType).toBe('operational');
        expect(report.title).toBe('Security Operations Report');
        expect(report.format).toBe('html');
        expect(report.recipients).toContain('security-team@company.com');
        expect(report.sections).toHaveLength(2);
        expect(report.sections[0].title).toBe('Security Overview');
        expect(report.sections[1].title).toBe('Top Threats');
      });

      it('should generate compliance report', async () => {
        (prisma.analyticsReport.create as jest.Mock).mockResolvedValue({
          id: 'report-compliance-123',
          reportType: 'compliance',
          title: 'Compliance Status Report',
          format: 'pdf',
        });

        analyticsService['generateComplianceSections'] = jest.fn().mockResolvedValue([
          {
            title: 'Compliance Overview',
            content: {
              overallScore: 92.5,
              gdprCompliance: 95,
              ccpaCompliance: 90,
              soxCompliance: 88,
            },
          },
          {
            title: 'Policy Violations',
            content: [
              { policy: 'Access Control', violations: 2, severity: 'MEDIUM' },
              { policy: 'Data Retention', violations: 1, severity: 'LOW' },
            ],
          },
        ]);

        const reportData = {
          reportType: 'compliance' as const,
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          format: 'pdf' as const,
        };

        const report = await analyticsService.generateReport(reportData);

        expect(report.reportType).toBe('compliance');
        expect(report.title).toBe('Compliance Status Report');
        expect(report.sections[0].content.overallScore).toBe(92.5);
        expect(report.sections[1].content).toHaveLength(2);
      });
    });

    describe('Trend Analysis', () => {
      it('should perform trend analysis correctly', async () => {
        // Mock metric data points
        analyticsService['getMetricDataPoints'] = jest.fn().mockResolvedValue([
          { timestamp: new Date('2024-01-01'), value: 100 },
          { timestamp: new Date('2024-01-02'), value: 105 },
          { timestamp: new Date('2024-01-03'), value: 110 },
          { timestamp: new Date('2024-01-04'), value: 115 },
          { timestamp: new Date('2024-01-05'), value: 120 },
        ]);

        // Mock forecast generation
        analyticsService['generateForecast'] = jest.fn().mockResolvedValue([
          { timestamp: new Date('2024-01-06'), predicted: 125, confidence: 0.85 },
          { timestamp: new Date('2024-01-07'), predicted: 130, confidence: 0.80 },
        ]);

        const trendAnalysis = await analyticsService.performTrendAnalysis('threats', 'daily');

        expect(trendAnalysis.metric).toBe('threats');
        expect(trendAnalysis.timeframe).toBe('daily');
        expect(trendAnalysis.trend).toBe('increasing'); // Values are increasing
        expect(trendAnalysis.changePercent).toBe(20); // 20% increase from 100 to 120
        expect(trendAnalysis.significance).toBe('high'); // 20% is significant
        expect(trendAnalysis.dataPoints).toHaveLength(5);
        expect(trendAnalysis.forecast).toHaveLength(2);
        expect(trendAnalysis.forecast![0].predicted).toBe(125);
      });
    });

    describe('Dashboard Data', () => {
      it('should provide comprehensive dashboard data', async () => {
        // Mock various data sources
        analyticsService['getOverviewMetrics'] = jest.fn().mockResolvedValue({
          totalEvents: 15420,
          threatsBlocked: 127,
          incidentsResolved: 8,
          complianceScore: 95.2,
        });

        analyticsService['getChartData'] = jest.fn().mockResolvedValue([
          {
            type: 'line',
            title: 'Security Events Over Time',
            data: [
              { timestamp: '2024-01-01', value: 100 },
              { timestamp: '2024-01-02', value: 150 },
              { timestamp: '2024-01-03', value: 125 },
            ],
            config: { xAxis: 'timestamp', yAxis: 'value' },
          },
        ]);

        analyticsService['getRecentAlerts'] = jest.fn().mockResolvedValue([
          { id: 'alert-1', type: 'THREAT_DETECTED', severity: 'HIGH', createdAt: new Date() },
          { id: 'alert-2', type: 'ANOMALY_DETECTED', severity: 'MEDIUM', createdAt: new Date() },
        ]);

        analyticsService['getTrendData'] = jest.fn().mockResolvedValue([
          { metric: 'threats', trend: 'increasing', changePercent: 5.2, significance: 'medium' },
          { metric: 'incidents', trend: 'decreasing', changePercent: -2.1, significance: 'low' },
        ]);

        const dashboardData = await analyticsService.getDashboardData();

        expect(dashboardData.overview.totalEvents).toBe(15420);
        expect(dashboardData.overview.threatsBlocked).toBe(127);
        expect(dashboardData.overview.complianceScore).toBe(95.2);
        
        expect(dashboardData.charts).toHaveLength(1);
        expect(dashboardData.charts[0].title).toBe('Security Events Over Time');
        expect(dashboardData.charts[0].data).toHaveLength(3);
        
        expect(dashboardData.alerts).toHaveLength(2);
        expect(dashboardData.alerts[0].type).toBe('THREAT_DETECTED');
        
        expect(dashboardData.trends).toHaveLength(2);
        expect(dashboardData.trends[0].metric).toBe('threats');
        expect(dashboardData.trends[0].trend).toBe('increasing');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle end-to-end security event processing', async () => {
      // Simulate a complete security event flow
      
      // 1. Ingest suspicious event
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-e2e-123',
        eventType: 'AUTHENTICATION',
        severity: 'HIGH',
        title: 'Suspicious Login',
        description: 'Login from unusual location',
        userId: mockUserId,
        siteId: mockSiteId,
        ipAddress: '10.0.0.1',
        createdAt: new Date(),
        metadata: { threatScore: 75 },
      });

      const suspiciousEvent = await siemService.ingestEvent({
        eventType: 'AUTHENTICATION',
        severity: 'HIGH',
        source: 'AuthSystem',
        title: 'Suspicious Login',
        description: 'Login from unusual location',
        userId: mockUserId,
        siteId: mockSiteId,
        ipAddress: '10.0.0.1',
        metadata: { geoAnomaly: true },
      });

      expect(suspiciousEvent.id).toBe('event-e2e-123');
      expect(suspiciousEvent.threatScore).toBe(75);

      // 2. Threat detection should analyze the event
      (prisma.anomalyDetection.create as jest.Mock).mockResolvedValue({
        id: 'anomaly-e2e-123',
      });

      (prisma.threatAssessment.create as jest.Mock).mockResolvedValue({
        id: 'assessment-e2e-123',
        threatType: 'ACCOUNT_TAKEOVER',
        riskScore: 85,
      });

      const anomalies = await threatDetectionEngine.detectAnomalies(suspiciousEvent);
      const assessment = await threatDetectionEngine.assessThreat(suspiciousEvent, anomalies);

      expect(assessment.riskScore).toBeGreaterThan(70);

      // 3. If high risk, should trigger correlation analysis
      if (assessment.riskScore >= 70) {
        (prisma.correlationResult.create as jest.Mock).mockResolvedValue({
          id: 'correlation-e2e-123',
        });

        const correlationResult = await correlationEngine.performCorrelationAnalysis({
          timeRange: {
            start: new Date(Date.now() - 3600000), // 1 hour ago
            end: new Date(),
          },
          algorithms: ['temporal', 'spatial'],
        });

        expect(correlationResult.correlations.length).toBeGreaterThanOrEqual(0);
      }

      // 4. Analytics should incorporate the event into metrics
      const realTimeMetrics = await analyticsService.getRealTimeMetrics();
      expect(realTimeMetrics.lastUpdated).toBeInstanceOf(Date);

      // Verify all components worked together
      expect(prisma.securityEvent.create).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalled(); // Event cached
    });

    it('should handle high-volume event processing', async () => {
      // Simulate processing multiple events simultaneously
      const eventPromises = [];

      for (let i = 0; i < 10; i++) {
        (prisma.securityEvent.create as jest.Mock).mockResolvedValueOnce({
          id: `event-volume-${i}`,
          eventType: 'API_ACCESS',
          severity: 'INFO',
          createdAt: new Date(),
          metadata: { threatScore: 10 },
        });

        eventPromises.push(
          siemService.ingestEvent({
            eventType: 'API_ACCESS',
            severity: 'INFO',
            source: 'APIGateway',
            title: `API Request ${i}`,
            description: `API request number ${i}`,
            userId: `user-${i}`,
            siteId: mockSiteId,
          })
        );
      }

      const results = await Promise.all(eventPromises);

      expect(results).toHaveLength(10);
      expect(results.every(r => r.id.startsWith('event-volume-'))).toBe(true);
      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(10);
    });

    it('should maintain data consistency across services', async () => {
      // Verify that data flows correctly between services
      
      // Create a threat indicator
      (prisma.threatIndicator.create as jest.Mock).mockResolvedValue({
        id: 'indicator-consistency-123',
        type: 'MALICIOUS_IP',
        value: '192.168.1.200',
        active: true,
      });

      const indicator = await siemService.createThreatIndicator({
        type: 'MALICIOUS_IP',
        value: '192.168.1.200',
        severity: 'HIGH',
        confidence: 95,
        source: 'ThreatIntel',
        description: 'Known malicious IP',
      });

      // Event from the same IP should trigger threat detection
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-consistency-123',
        ipAddress: '192.168.1.200',
        metadata: { threatScore: 80 },
      });

      const maliciousEvent = await siemService.ingestEvent({
        eventType: 'AUTHENTICATION',
        severity: 'HIGH',
        source: 'AuthSystem',
        title: 'Login from malicious IP',
        description: 'Authentication attempt from known bad IP',
        ipAddress: '192.168.1.200',
      });

      expect(maliciousEvent.threatScore).toBeGreaterThan(70); // Should be high due to malicious IP
      expect(indicator.value).toBe(maliciousEvent.ipAddress);
    });
  });
});

// Helper functions for test setup
function createMockSecurityEvent(overrides: any = {}) {
  return {
    id: 'mock-event-123',
    eventType: 'AUTHENTICATION',
    severity: 'MEDIUM',
    source: 'TestSource',
    title: 'Test Event',
    description: 'Test security event',
    userId: 'user-123',
    siteId: 'site-123',
    ipAddress: '192.168.1.100',
    timestamp: new Date(),
    threatScore: 25,
    processed: false,
    metadata: {},
    ...overrides,
  };
}

function createMockThreatIndicator(overrides: any = {}) {
  return {
    id: 'mock-indicator-123',
    type: 'MALICIOUS_IP',
    value: '192.168.1.100',
    severity: 'HIGH',
    confidence: 90,
    source: 'ThreatIntel',
    description: 'Mock threat indicator',
    active: true,
    createdAt: new Date(),
    metadata: {},
    ...overrides,
  };
}

function createMockCorrelationResult(overrides: any = {}) {
  return {
    id: 'mock-correlation-123',
    name: 'Mock Correlation',
    type: 'PATTERN',
    confidence: 0.8,
    severity: 'HIGH',
    description: 'Mock correlation result',
    events: [],
    correlationFields: ['userId'],
    timeSpan: 300000,
    createdAt: new Date(),
    metadata: {},
    ...overrides,
  };
} 