import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecurityDashboardService } from '../../../lib/security/dashboard/security-dashboard-service';

// Mock dependencies
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    securityReport: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

jest.mock('../../../lib/security/vulnerability/vulnerability-management-service', () => ({
  vulnerabilityManagementService: {
    getVulnerabilityMetrics: jest.fn(),
  },
}));

jest.mock('../../../lib/security/testing/security-testing-service', () => ({
  securityTestingService: {
    getSecurityTestingMetrics: jest.fn(),
  },
}));

jest.mock('../../../lib/security/testing/compliance-validation-service', () => ({
  complianceValidationService: {
    getComplianceMetrics: jest.fn(),
  },
}));

jest.mock('../../../lib/security/incident/incident-response-service', () => ({
  incidentResponseService: {
    getIncidentMetrics: jest.fn(),
  },
}));

jest.mock('../../../lib/security/audit/audit-service', () => ({
  auditService: {
    getAuditMetrics: jest.fn(),
  },
}));

jest.mock('../../../lib/security/monitoring/siem-service', () => ({
  siemService: {
    getThreatMetrics: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { vulnerabilityManagementService } from '../../../lib/security/vulnerability/vulnerability-management-service';
import { securityTestingService } from '../../../lib/security/testing/security-testing-service';
import { complianceValidationService } from '../../../lib/security/testing/compliance-validation-service';
import { incidentResponseService } from '../../../lib/security/incident/incident-response-service';
import { auditService } from '../../../lib/security/audit/audit-service';
import { siemService } from '../../../lib/security/monitoring/siem-service';

describe('Security Dashboard System', () => {
  let securityDashboardService: SecurityDashboardService;

  const mockSiteId = 'site-123';
  const mockUserId = 'user-123';
  const mockDashboardId = 'dashboard-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instance
    securityDashboardService = new SecurityDashboardService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Dashboard Management', () => {
    describe('Dashboard Creation', () => {
      it('should create executive dashboard with appropriate widgets', async () => {
        // Mock service methods
        securityDashboardService['getUserPermissions'] = jest.fn().mockReturnValue({
          dashboards: ['EXECUTIVE'],
          widgets: ['SECURITY_OVERVIEW', 'COMPLIANCE_STATUS', 'SECURITY_TRENDS'],
          actions: ['VIEW', 'EXPORT'],
        });

        securityDashboardService['createDashboard'] = jest.fn().mockResolvedValue({
          id: mockDashboardId,
          userId: mockUserId,
          role: 'EXECUTIVE',
          dashboardType: 'EXECUTIVE',
          widgets: [
            {
              id: 'widget-SECURITY_OVERVIEW-0',
              type: 'SECURITY_OVERVIEW',
              name: 'Security Overview',
              position: { x: 0, y: 0, width: 6, height: 4 },
              configuration: {},
              data: null,
              lastUpdated: new Date(),
            },
            {
              id: 'widget-COMPLIANCE_STATUS-1',
              type: 'COMPLIANCE_STATUS',
              name: 'Compliance Status',
              position: { x: 6, y: 0, width: 6, height: 4 },
              configuration: {},
              data: null,
              lastUpdated: new Date(),
            },
          ],
          configuration: {
            refreshInterval: 60,
            autoRefresh: true,
            theme: 'LIGHT',
            layout: 'GRID',
          },
          permissions: ['VIEW', 'EXPORT'],
          lastAccessed: new Date(),
          siteId: mockSiteId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        securityDashboardService['loadWidgetData'] = jest.fn().mockResolvedValue(undefined);

        const configData = {
          userId: mockUserId,
          role: 'EXECUTIVE' as const,
          dashboardType: 'EXECUTIVE' as const,
          widgets: [],
          refreshInterval: 60,
          autoRefresh: true,
          siteId: mockSiteId,
        };

        const result = await securityDashboardService.getDashboard(configData);

        expect(result.id).toBe(mockDashboardId);
        expect(result.dashboardType).toBe('EXECUTIVE');
        expect(result.role).toBe('EXECUTIVE');
        expect(result.widgets).toHaveLength(2);
        expect(result.widgets[0].type).toBe('SECURITY_OVERVIEW');
        expect(result.widgets[1].type).toBe('COMPLIANCE_STATUS');
        expect(result.permissions).toContain('VIEW');
        expect(result.permissions).toContain('EXPORT');
        expect(result.configuration.refreshInterval).toBe(60);

        expect(securityDashboardService['getUserPermissions']).toHaveBeenCalledWith('EXECUTIVE');
        expect(securityDashboardService['createDashboard']).toHaveBeenCalledWith(configData);
        expect(securityDashboardService['loadWidgetData']).toHaveBeenCalledWith(expect.any(Object), undefined);
      });

      it('should create technical dashboard with appropriate widgets', async () => {
        securityDashboardService['getUserPermissions'] = jest.fn().mockReturnValue({
          dashboards: ['TECHNICAL'],
          widgets: ['VULNERABILITY_SUMMARY', 'RECENT_SCANS', 'SECURITY_TRENDS'],
          actions: ['VIEW', 'CONFIGURE', 'EXPORT'],
        });

        securityDashboardService['createDashboard'] = jest.fn().mockResolvedValue({
          id: 'dashboard-technical-123',
          userId: mockUserId,
          role: 'SECURITY_ANALYST',
          dashboardType: 'TECHNICAL',
          widgets: [
            {
              id: 'widget-VULNERABILITY_SUMMARY-0',
              type: 'VULNERABILITY_SUMMARY',
              name: 'Vulnerability Summary',
              position: { x: 0, y: 0, width: 6, height: 4 },
              configuration: {},
              data: null,
              lastUpdated: new Date(),
            },
            {
              id: 'widget-RECENT_SCANS-1',
              type: 'RECENT_SCANS',
              name: 'Recent Security Scans',
              position: { x: 6, y: 0, width: 6, height: 4 },
              configuration: {},
              data: null,
              lastUpdated: new Date(),
            },
            {
              id: 'widget-SECURITY_TRENDS-2',
              type: 'SECURITY_TRENDS',
              name: 'Security Trends',
              position: { x: 0, y: 4, width: 12, height: 4 },
              configuration: {},
              data: null,
              lastUpdated: new Date(),
            },
          ],
          configuration: {
            refreshInterval: 30,
            autoRefresh: true,
            theme: 'DARK',
            layout: 'GRID',
          },
          permissions: ['VIEW', 'CONFIGURE', 'EXPORT'],
          siteId: mockSiteId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        securityDashboardService['loadWidgetData'] = jest.fn().mockResolvedValue(undefined);

        const configData = {
          userId: mockUserId,
          role: 'SECURITY_ANALYST' as const,
          dashboardType: 'TECHNICAL' as const,
          widgets: [],
          refreshInterval: 30,
          autoRefresh: true,
          siteId: mockSiteId,
        };

        const result = await securityDashboardService.getDashboard(configData);

        expect(result.dashboardType).toBe('TECHNICAL');
        expect(result.role).toBe('SECURITY_ANALYST');
        expect(result.widgets).toHaveLength(3);
        expect(result.widgets.map(w => w.type)).toContain('VULNERABILITY_SUMMARY');
        expect(result.widgets.map(w => w.type)).toContain('RECENT_SCANS');
        expect(result.widgets.map(w => w.type)).toContain('SECURITY_TRENDS');
        expect(result.permissions).toContain('CONFIGURE');
        expect(result.configuration.refreshInterval).toBe(30);
      });

      it('should enforce role-based dashboard access', async () => {
        securityDashboardService['getUserPermissions'] = jest.fn().mockReturnValue({
          dashboards: ['OPERATIONAL'], // User only has access to operational dashboard
          widgets: [],
          actions: ['VIEW'],
        });

        const configData = {
          userId: mockUserId,
          role: 'IT_MANAGER' as const,
          dashboardType: 'EXECUTIVE' as const, // Trying to access executive dashboard
          widgets: [],
          siteId: mockSiteId,
        };

        await expect(securityDashboardService.getDashboard(configData)).rejects.toThrow(
          'Insufficient permissions for dashboard type: EXECUTIVE'
        );

        expect(securityDashboardService['getUserPermissions']).toHaveBeenCalledWith('IT_MANAGER');
      });
    });

    describe('Widget Data Loading', () => {
      it('should load security overview widget data', async () => {
        securityDashboardService['getSecurityOverviewData'] = jest.fn().mockResolvedValue({
          overallScore: 87,
          trend: 'IMPROVING',
          keyMetrics: {
            vulnerabilityCount: 23,
            complianceScore: 92,
            incidentCount: 2,
            auditCoverage: 95,
          },
          lastAssessment: new Date(),
        });

        const widgetData = await securityDashboardService['getWidgetData'](
          'SECURITY_OVERVIEW',
          mockSiteId,
          { start: new Date('2024-01-01'), end: new Date('2024-01-31') }
        );

        expect(widgetData.overallScore).toBe(87);
        expect(widgetData.trend).toBe('IMPROVING');
        expect(widgetData.keyMetrics.vulnerabilityCount).toBe(23);
        expect(widgetData.keyMetrics.complianceScore).toBe(92);

        expect(securityDashboardService['getSecurityOverviewData']).toHaveBeenCalledWith(
          mockSiteId,
          { start: new Date('2024-01-01'), end: new Date('2024-01-31') }
        );
      });

      it('should load vulnerability summary widget data', async () => {
        securityDashboardService['getVulnerabilitySummaryData'] = jest.fn().mockResolvedValue({
          total: 23,
          bySeverity: {
            CRITICAL: 1,
            HIGH: 4,
            MEDIUM: 12,
            LOW: 6,
          },
          trends: [
            { date: new Date('2024-01-01'), count: 35, severity: { CRITICAL: 2, HIGH: 8, MEDIUM: 15, LOW: 10 } },
            { date: new Date('2024-01-15'), count: 28, severity: { CRITICAL: 1, HIGH: 6, MEDIUM: 13, LOW: 8 } },
            { date: new Date('2024-01-31'), count: 23, severity: { CRITICAL: 1, HIGH: 4, MEDIUM: 12, LOW: 6 } },
          ],
          mttr: 320, // minutes
          sla_compliance: 94,
        });

        const widgetData = await securityDashboardService['getWidgetData'](
          'VULNERABILITY_SUMMARY',
          mockSiteId
        );

        expect(widgetData.total).toBe(23);
        expect(widgetData.bySeverity.CRITICAL).toBe(1);
        expect(widgetData.bySeverity.HIGH).toBe(4);
        expect(widgetData.trends).toHaveLength(3);
        expect(widgetData.trends[0].count).toBe(35);
        expect(widgetData.trends[2].count).toBe(23);
        expect(widgetData.mttr).toBe(320);
        expect(widgetData.sla_compliance).toBe(94);
      });

      it('should handle widget data loading errors gracefully', async () => {
        const mockDashboard = {
          widgets: [
            {
              id: 'widget-error-test',
              type: 'SECURITY_OVERVIEW',
              name: 'Security Overview',
              position: { x: 0, y: 0, width: 6, height: 4 },
              configuration: {},
              data: null,
              lastUpdated: new Date(),
            },
          ],
          siteId: mockSiteId,
        };

        securityDashboardService['getWidgetData'] = jest.fn().mockRejectedValue(
          new Error('Service unavailable')
        );

        await securityDashboardService['loadWidgetData'](mockDashboard as any);

        expect(mockDashboard.widgets[0].error).toBe('Service unavailable');
        expect(mockDashboard.widgets[0].data).toBeNull();
      });
    });
  });

  describe('Security Metrics Calculation', () => {
    describe('Overall Security Score', () => {
      it('should calculate comprehensive security metrics', async () => {
        const timeRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        };

        // Mock service responses
        securityDashboardService['calculateOverallSecurityScore'] = jest.fn().mockResolvedValue(87);
        securityDashboardService['getVulnerabilityMetrics'] = jest.fn().mockResolvedValue({
          total: 23,
          bySeverity: { CRITICAL: 1, HIGH: 4, MEDIUM: 12, LOW: 6 },
          byCategory: { 'Injection': 8, 'XSS': 5, 'Access Control': 4, 'Crypto': 3, 'Other': 3 },
          trends: [
            { date: new Date('2024-01-01'), count: 35, severity: { CRITICAL: 2, HIGH: 8, MEDIUM: 15, LOW: 10 } },
            { date: new Date('2024-01-15'), count: 28, severity: { CRITICAL: 1, HIGH: 6, MEDIUM: 13, LOW: 8 } },
            { date: new Date('2024-01-31'), count: 23, severity: { CRITICAL: 1, HIGH: 4, MEDIUM: 12, LOW: 6 } },
          ],
          mttr: 320,
          sla_compliance: 94,
        });

        securityDashboardService['getComplianceMetrics'] = jest.fn().mockResolvedValue({
          overallScore: 92,
          frameworks: {
            OWASP_TOP_10_2021: { score: 95, status: 'COMPLIANT', lastAssessment: new Date(), violations: 0 },
            CIS_CONTROLS_V8: { score: 88, status: 'COMPLIANT', lastAssessment: new Date(), violations: 2 },
            NIST_CSF: { score: 92, status: 'COMPLIANT', lastAssessment: new Date(), violations: 1 },
            PCI_DSS_V4: { score: 89, status: 'PARTIALLY_COMPLIANT', lastAssessment: new Date(), violations: 3 },
          },
          trends: [
            { date: new Date('2024-01-01'), score: 89, violations: 8 },
            { date: new Date('2024-01-15'), score: 91, violations: 5 },
            { date: new Date('2024-01-31'), score: 92, violations: 3 },
          ],
          certifications: [
            { framework: 'SOC2', status: 'VALID', expiryDate: new Date('2024-12-31') },
            { framework: 'ISO27001', status: 'PENDING', expiryDate: undefined },
          ],
        });

        securityDashboardService['getIncidentMetrics'] = jest.fn().mockResolvedValue({
          total: 15,
          active: 2,
          resolved: 13,
          bySeverity: { CRITICAL: 0, HIGH: 1, MEDIUM: 1, LOW: 0 },
          mttr: 485,
          mttr_trend: 'IMPROVING',
          escalationRate: 12,
        });

        securityDashboardService['getAuditMetrics'] = jest.fn().mockResolvedValue({
          totalEvents: 150000,
          coverage: 95,
          integrityRate: 99.9,
          retentionCompliance: 98,
          recentActivity: [
            { category: 'AUTHENTICATION', count: 45000, trend: 'UP' },
            { category: 'DATA_ACCESS', count: 32000, trend: 'STABLE' },
            { category: 'ADMINISTRATIVE', count: 8500, trend: 'DOWN' },
          ],
        });

        securityDashboardService['getThreatMetrics'] = jest.fn().mockResolvedValue({
          activeThreat: 8,
          blockedAttacks: 127,
          threatLevel: 'MEDIUM',
          recentIndicators: [
            { type: 'IP_ADDRESS', severity: 'HIGH', count: 5, lastSeen: new Date() },
            { type: 'DOMAIN', severity: 'MEDIUM', count: 12, lastSeen: new Date() },
            { type: 'FILE_HASH', severity: 'LOW', count: 3, lastSeen: new Date() },
          ],
        });

        securityDashboardService['calculateSecurityTrend'] = jest.fn().mockReturnValue('IMPROVING');

        const result = await securityDashboardService.getSecurityMetrics(mockSiteId, timeRange);

        expect(result.overallScore).toBe(87);
        expect(result.securityPosture.score).toBe(87);
        expect(result.securityPosture.trend).toBe('IMPROVING');
        expect(result.securityPosture.keyMetrics.vulnerabilityCount).toBe(23);
        expect(result.securityPosture.keyMetrics.complianceScore).toBe(92);
        expect(result.securityPosture.keyMetrics.incidentCount).toBe(15);
        expect(result.securityPosture.keyMetrics.auditCoverage).toBe(95);

        expect(result.vulnerabilityMetrics.total).toBe(23);
        expect(result.vulnerabilityMetrics.bySeverity.CRITICAL).toBe(1);
        expect(result.vulnerabilityMetrics.trends).toHaveLength(3);
        expect(result.vulnerabilityMetrics.mttr).toBe(320);

        expect(result.complianceMetrics.overallScore).toBe(92);
        expect(result.complianceMetrics.frameworks.OWASP_TOP_10_2021.score).toBe(95);
        expect(result.complianceMetrics.frameworks.PCI_DSS_V4.status).toBe('PARTIALLY_COMPLIANT');

        expect(result.incidentMetrics.total).toBe(15);
        expect(result.incidentMetrics.active).toBe(2);
        expect(result.incidentMetrics.mttr).toBe(485);

        expect(result.auditMetrics.totalEvents).toBe(150000);
        expect(result.auditMetrics.coverage).toBe(95);
        expect(result.auditMetrics.integrityRate).toBe(99.9);

        expect(result.threatMetrics.activeThreat).toBe(8);
        expect(result.threatMetrics.threatLevel).toBe('MEDIUM');

        expect(securityDashboardService['calculateOverallSecurityScore']).toHaveBeenCalledWith(mockSiteId, timeRange);
        expect(securityDashboardService['getVulnerabilityMetrics']).toHaveBeenCalledWith(mockSiteId, timeRange);
        expect(securityDashboardService['getComplianceMetrics']).toHaveBeenCalledWith(mockSiteId, timeRange);
        expect(securityDashboardService['getIncidentMetrics']).toHaveBeenCalledWith(mockSiteId, timeRange);
        expect(securityDashboardService['getAuditMetrics']).toHaveBeenCalledWith(mockSiteId, timeRange);
        expect(securityDashboardService['getThreatMetrics']).toHaveBeenCalledWith(mockSiteId, timeRange);
      });

      it('should cache metrics for performance optimization', async () => {
        const timeRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        };

        // First call - should calculate metrics
        securityDashboardService['calculateOverallSecurityScore'] = jest.fn().mockResolvedValue(87);
        securityDashboardService['getVulnerabilityMetrics'] = jest.fn().mockResolvedValue({ total: 23 });
        securityDashboardService['getComplianceMetrics'] = jest.fn().mockResolvedValue({ overallScore: 92 });
        securityDashboardService['getIncidentMetrics'] = jest.fn().mockResolvedValue({ total: 15 });
        securityDashboardService['getAuditMetrics'] = jest.fn().mockResolvedValue({ totalEvents: 150000 });
        securityDashboardService['getThreatMetrics'] = jest.fn().mockResolvedValue({ activeThreat: 8 });
        securityDashboardService['calculateSecurityTrend'] = jest.fn().mockReturnValue('STABLE');

        const firstCall = await securityDashboardService.getSecurityMetrics(mockSiteId, timeRange);

        // Second call - should use cached data
        const secondCall = await securityDashboardService.getSecurityMetrics(mockSiteId, timeRange);

        expect(firstCall.overallScore).toBe(secondCall.overallScore);
        expect(firstCall.vulnerabilityMetrics.total).toBe(secondCall.vulnerabilityMetrics.total);

        // Verify service methods were called only once (cached on second call)
        expect(securityDashboardService['calculateOverallSecurityScore']).toHaveBeenCalledTimes(1);
        expect(securityDashboardService['getVulnerabilityMetrics']).toHaveBeenCalledTimes(1);
      });

      it('should handle metrics calculation errors gracefully', async () => {
        securityDashboardService['calculateOverallSecurityScore'] = jest.fn().mockRejectedValue(
          new Error('Service unavailable')
        );

        await expect(securityDashboardService.getSecurityMetrics(mockSiteId)).rejects.toThrow(
          'Metrics calculation failed'
        );
      });
    });
  });

  describe('Report Generation', () => {
    describe('Security Reports', () => {
      it('should generate executive summary report', async () => {
        // Mock database creation
        (prisma.securityReport.create as jest.Mock).mockResolvedValue({
          id: 'report-exec-123',
          templateId: 'EXECUTIVE_SUMMARY',
          title: 'Executive Security Summary',
          type: 'EXECUTIVE',
          format: 'PDF',
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          status: 'GENERATING',
          sections: [],
          summary: {
            keyFindings: [],
            recommendations: [],
            riskLevel: 'MEDIUM',
            complianceStatus: 'PENDING',
          },
          metadata: {
            generatedBy: 'SYSTEM',
            recipients: ['ceo@company.com', 'ciso@company.com'],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        securityDashboardService['getReportTemplate'] = jest.fn().mockReturnValue({
          name: 'Executive Security Summary',
          type: 'EXECUTIVE',
          sections: ['overview', 'key_metrics', 'risk_summary', 'recommendations'],
        });

        securityDashboardService['generateReportContent'] = jest.fn().mockResolvedValue(undefined);

        const reportConfig = {
          templateId: 'EXECUTIVE_SUMMARY',
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          recipients: ['ceo@company.com', 'ciso@company.com'],
          format: 'PDF' as const,
          includeCharts: true,
          includeDetails: false,
          scheduledDelivery: false,
        };

        const result = await securityDashboardService.generateSecurityReport(reportConfig);

        expect(result.id).toBe('report-exec-123');
        expect(result.templateId).toBe('EXECUTIVE_SUMMARY');
        expect(result.title).toBe('Executive Security Summary');
        expect(result.type).toBe('EXECUTIVE');
        expect(result.format).toBe('PDF');
        expect(result.status).toBe('GENERATING');
        expect(result.metadata.recipients).toContain('ceo@company.com');
        expect(result.metadata.recipients).toContain('ciso@company.com');

        expect(securityDashboardService['getReportTemplate']).toHaveBeenCalledWith('EXECUTIVE_SUMMARY');
        expect(securityDashboardService['generateReportContent']).toHaveBeenCalledWith(
          result,
          expect.any(Object),
          reportConfig
        );

        expect(prisma.securityReport.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              templateId: 'EXECUTIVE_SUMMARY',
              title: 'Executive Security Summary',
              type: 'EXECUTIVE',
              format: 'PDF',
            }),
          })
        );
      });

      it('should generate technical security metrics report', async () => {
        (prisma.securityReport.create as jest.Mock).mockResolvedValue({
          id: 'report-tech-123',
          templateId: 'SECURITY_METRICS',
          title: 'Security Metrics Report',
          type: 'TECHNICAL',
          format: 'PDF',
          status: 'GENERATING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        securityDashboardService['getReportTemplate'] = jest.fn().mockReturnValue({
          name: 'Security Metrics Report',
          type: 'TECHNICAL',
          sections: ['vulnerability_analysis', 'compliance_status', 'incident_summary', 'trending'],
        });

        securityDashboardService['generateReportContent'] = jest.fn().mockResolvedValue(undefined);

        const reportConfig = {
          templateId: 'SECURITY_METRICS',
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          recipients: ['security-team@company.com'],
          format: 'PDF' as const,
          includeCharts: true,
          includeDetails: true,
          scheduledDelivery: false,
        };

        const result = await securityDashboardService.generateSecurityReport(reportConfig);

        expect(result.templateId).toBe('SECURITY_METRICS');
        expect(result.title).toBe('Security Metrics Report');
        expect(result.type).toBe('TECHNICAL');
      });

      it('should handle invalid report template gracefully', async () => {
        securityDashboardService['getReportTemplate'] = jest.fn().mockReturnValue(null);

        const reportConfig = {
          templateId: 'INVALID_TEMPLATE',
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          recipients: ['test@company.com'],
        };

        await expect(securityDashboardService.generateSecurityReport(reportConfig)).rejects.toThrow(
          'Report template not found: INVALID_TEMPLATE'
        );

        expect(securityDashboardService['getReportTemplate']).toHaveBeenCalledWith('INVALID_TEMPLATE');
        expect(prisma.securityReport.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete dashboard workflow', async () => {
      // 1. Create dashboard
      securityDashboardService['getUserPermissions'] = jest.fn().mockReturnValue({
        dashboards: ['TECHNICAL'],
        actions: ['VIEW', 'EXPORT'],
      });

      securityDashboardService['createDashboard'] = jest.fn().mockResolvedValue({
        id: 'integration-dashboard-123',
        userId: mockUserId,
        dashboardType: 'TECHNICAL',
        widgets: [
          { id: 'widget-1', type: 'SECURITY_OVERVIEW', data: null },
          { id: 'widget-2', type: 'VULNERABILITY_SUMMARY', data: null },
        ],
        siteId: mockSiteId,
      });

      // 2. Load widget data
      securityDashboardService['getWidgetData'] = jest.fn()
        .mockResolvedValueOnce({ overallScore: 87 }) // SECURITY_OVERVIEW
        .mockResolvedValueOnce({ total: 23, bySeverity: { CRITICAL: 1 } }); // VULNERABILITY_SUMMARY

      securityDashboardService['loadWidgetData'] = jest.fn().mockImplementation(async (dashboard) => {
        dashboard.widgets[0].data = { overallScore: 87 };
        dashboard.widgets[1].data = { total: 23, bySeverity: { CRITICAL: 1 } };
      });

      const dashboard = await securityDashboardService.getDashboard({
        userId: mockUserId,
        role: 'SECURITY_ANALYST',
        dashboardType: 'TECHNICAL',
        widgets: [],
        siteId: mockSiteId,
      });

      expect(dashboard.id).toBe('integration-dashboard-123');
      expect(dashboard.widgets[0].data.overallScore).toBe(87);
      expect(dashboard.widgets[1].data.total).toBe(23);

      // 3. Get metrics
      securityDashboardService['calculateOverallSecurityScore'] = jest.fn().mockResolvedValue(87);
      securityDashboardService['getVulnerabilityMetrics'] = jest.fn().mockResolvedValue({ total: 23 });
      securityDashboardService['getComplianceMetrics'] = jest.fn().mockResolvedValue({ overallScore: 92 });
      securityDashboardService['getIncidentMetrics'] = jest.fn().mockResolvedValue({ total: 15 });
      securityDashboardService['getAuditMetrics'] = jest.fn().mockResolvedValue({ totalEvents: 150000 });
      securityDashboardService['getThreatMetrics'] = jest.fn().mockResolvedValue({ activeThreat: 8 });
      securityDashboardService['calculateSecurityTrend'] = jest.fn().mockReturnValue('STABLE');

      const metrics = await securityDashboardService.getSecurityMetrics(mockSiteId);

      expect(metrics.overallScore).toBe(87);
      expect(metrics.vulnerabilityMetrics.total).toBe(23);

      // 4. Generate report
      (prisma.securityReport.create as jest.Mock).mockResolvedValue({
        id: 'integration-report-123',
        templateId: 'SECURITY_METRICS',
        title: 'Security Metrics Report',
        status: 'GENERATING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      securityDashboardService['getReportTemplate'] = jest.fn().mockReturnValue({
        name: 'Security Metrics Report',
        type: 'TECHNICAL',
      });

      securityDashboardService['generateReportContent'] = jest.fn().mockResolvedValue(undefined);

      const report = await securityDashboardService.generateSecurityReport({
        templateId: 'SECURITY_METRICS',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        recipients: ['test@company.com'],
      });

      expect(report.id).toBe('integration-report-123');

      // Verify all components worked together
      expect(securityDashboardService['createDashboard']).toHaveBeenCalled();
      expect(securityDashboardService['loadWidgetData']).toHaveBeenCalled();
      expect(securityDashboardService['calculateOverallSecurityScore']).toHaveBeenCalled();
      expect(prisma.securityReport.create).toHaveBeenCalled();
    });
  });
});

// Helper functions for test setup
function createMockDashboard(overrides: any = {}) {
  return {
    id: 'dashboard-test-123',
    userId: 'user-123',
    role: 'SECURITY_ANALYST',
    dashboardType: 'TECHNICAL',
    widgets: [],
    configuration: {
      refreshInterval: 60,
      autoRefresh: true,
      theme: 'LIGHT',
      layout: 'GRID',
    },
    permissions: ['VIEW', 'EXPORT'],
    lastAccessed: new Date(),
    siteId: 'site-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockSecurityMetrics(overrides: any = {}) {
  return {
    overallScore: 87,
    securityPosture: {
      score: 87,
      trend: 'STABLE',
      keyMetrics: {
        vulnerabilityCount: 23,
        complianceScore: 92,
        incidentCount: 15,
        auditCoverage: 95,
      },
    },
    vulnerabilityMetrics: {
      total: 23,
      bySeverity: { CRITICAL: 1, HIGH: 4, MEDIUM: 12, LOW: 6 },
      trends: [],
      mttr: 320,
      sla_compliance: 94,
    },
    complianceMetrics: {
      overallScore: 92,
      frameworks: {},
    },
    incidentMetrics: {
      total: 15,
      active: 2,
      bySeverity: {},
      mttr: 485,
    },
    auditMetrics: {
      totalEvents: 150000,
      coverage: 95,
      integrityRate: 99.9,
      retentionCompliance: 98,
    },
    threatMetrics: {
      activeThreat: 8,
      blockedAttacks: 127,
      threatLevel: 'MEDIUM',
    },
    ...overrides,
  };
}

function createMockSecurityReport(overrides: any = {}) {
  return {
    id: 'report-test-123',
    templateId: 'EXECUTIVE_SUMMARY',
    title: 'Executive Security Summary',
    type: 'EXECUTIVE',
    format: 'PDF',
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    },
    status: 'GENERATING',
    sections: [],
    summary: {
      keyFindings: [],
      recommendations: [],
      riskLevel: 'MEDIUM',
      complianceStatus: 'PENDING',
    },
    metadata: {
      generatedBy: 'SYSTEM',
      recipients: ['test@company.com'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
} 