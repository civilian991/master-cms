import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { securityDashboardService } from '@/lib/security/dashboard/security-dashboard-service';
import { z } from 'zod';

const dashboardConfigSchema = z.object({
  dashboardType: z.enum(['EXECUTIVE', 'TECHNICAL', 'OPERATIONAL', 'COMPLIANCE']),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  widgets: z.array(z.string()).optional(),
  refreshInterval: z.number().min(5).max(3600).default(60),
  autoRefresh: z.boolean().default(true),
});

const reportConfigSchema = z.object({
  templateId: z.string(),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  recipients: z.array(z.string()),
  format: z.enum(['PDF', 'HTML', 'CSV', 'JSON']).default('PDF'),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
  scheduledDelivery: z.boolean().default(false),
  deliveryFrequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'get-dashboard') {
      // Get security dashboard
      if (!session.user.permissions?.includes('view_security_dashboard')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view security dashboard' },
          { status: 403 }
        );
      }

      const validatedData = dashboardConfigSchema.parse(body);

      const dashboard = await securityDashboardService.getDashboard({
        userId: session.user.id,
        role: session.user.role || 'SECURITY_ANALYST',
        dashboardType: validatedData.dashboardType,
        widgets: validatedData.widgets || [],
        timeRange: validatedData.timeRange ? {
          start: new Date(validatedData.timeRange.start),
          end: new Date(validatedData.timeRange.end),
        } : undefined,
        refreshInterval: validatedData.refreshInterval,
        autoRefresh: validatedData.autoRefresh,
        siteId: session.user.siteId!,
      });

      // Get metrics for dashboard
      const metrics = await securityDashboardService.getSecurityMetrics(
        session.user.siteId!,
        validatedData.timeRange ? {
          start: new Date(validatedData.timeRange.start),
          end: new Date(validatedData.timeRange.end),
        } : undefined
      );

      return NextResponse.json({
        success: true,
        dashboard: {
          ...dashboard,
          metrics,
        },
      });

    } else if (action === 'get-metrics') {
      // Get security metrics only
      if (!session.user.permissions?.includes('view_security_metrics')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view security metrics' },
          { status: 403 }
        );
      }

      const { timeRange } = body;

      const metrics = await securityDashboardService.getSecurityMetrics(
        session.user.siteId!,
        timeRange ? {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end),
        } : undefined
      );

      return NextResponse.json({
        success: true,
        metrics,
      });

    } else if (action === 'generate-report') {
      // Generate security report
      if (!session.user.permissions?.includes('generate_security_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to generate security reports' },
          { status: 403 }
        );
      }

      const validatedData = reportConfigSchema.parse(body);

      const report = await securityDashboardService.generateSecurityReport({
        templateId: validatedData.templateId,
        timeRange: {
          start: new Date(validatedData.timeRange.start),
          end: new Date(validatedData.timeRange.end),
        },
        recipients: validatedData.recipients,
        format: validatedData.format,
        includeCharts: validatedData.includeCharts,
        includeDetails: validatedData.includeDetails,
        scheduledDelivery: validatedData.scheduledDelivery,
        deliveryFrequency: validatedData.deliveryFrequency,
      });

      return NextResponse.json({
        success: true,
        report,
        message: 'Security report generation initiated',
      });

    } else if (action === 'export-dashboard') {
      // Export dashboard as PDF/image
      if (!session.user.permissions?.includes('export_security_dashboard')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to export dashboard' },
          { status: 403 }
        );
      }

      const { format, timeRange } = body;

      // Mock export functionality - would generate actual file
      const exportData = {
        exportId: crypto.randomUUID(),
        format: format || 'PDF',
        status: 'GENERATING',
        downloadUrl: `/api/security/dashboard/download/${crypto.randomUUID()}`,
        estimatedTime: '2-3 minutes',
      };

      return NextResponse.json({
        success: true,
        export: exportData,
        message: 'Dashboard export initiated',
      });

    } else if (action === 'get-widget-data') {
      // Get specific widget data
      const { widgetType, timeRange } = body;

      if (!widgetType) {
        return NextResponse.json(
          { error: 'Widget type is required' },
          { status: 400 }
        );
      }

      // Mock widget data - would call appropriate service methods
      let widgetData = {};

      switch (widgetType) {
        case 'SECURITY_OVERVIEW':
          widgetData = {
            overallScore: 87,
            trend: 'IMPROVING',
            keyMetrics: {
              vulnerabilityCount: 23,
              complianceScore: 92,
              incidentCount: 2,
              auditCoverage: 95,
            },
          };
          break;

        case 'VULNERABILITY_SUMMARY':
          widgetData = {
            total: 23,
            bySeverity: {
              CRITICAL: 1,
              HIGH: 4,
              MEDIUM: 12,
              LOW: 6,
            },
            trends: [
              { date: '2024-01-01', count: 35 },
              { date: '2024-01-08', count: 28 },
              { date: '2024-01-15', count: 23 },
            ],
            mttr: 320, // minutes
            sla_compliance: 94,
          };
          break;

        case 'COMPLIANCE_STATUS':
          widgetData = {
            overallScore: 92,
            frameworks: {
              OWASP_TOP_10_2021: { score: 95, status: 'COMPLIANT', violations: 0 },
              CIS_CONTROLS_V8: { score: 88, status: 'COMPLIANT', violations: 2 },
              NIST_CSF: { score: 92, status: 'COMPLIANT', violations: 1 },
              PCI_DSS_V4: { score: 89, status: 'PARTIALLY_COMPLIANT', violations: 3 },
            },
          };
          break;

        case 'INCIDENT_ALERTS':
          widgetData = {
            active: 2,
            total: 15,
            bySeverity: {
              CRITICAL: 0,
              HIGH: 1,
              MEDIUM: 1,
              LOW: 0,
            },
            mttr: 485, // minutes
            recent: [
              {
                id: 'inc-001',
                title: 'Suspicious Authentication Activity',
                severity: 'HIGH',
                status: 'INVESTIGATING',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'inc-002',
                title: 'Vulnerability Scan Alert',
                severity: 'MEDIUM',
                status: 'OPEN',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              },
            ],
          };
          break;

        case 'THREAT_INTELLIGENCE':
          widgetData = {
            threatLevel: 'MEDIUM',
            activeThreat: 8,
            blockedAttacks: 127,
            recentIndicators: [
              { type: 'IP_ADDRESS', severity: 'HIGH', count: 5, lastSeen: new Date().toISOString() },
              { type: 'DOMAIN', severity: 'MEDIUM', count: 12, lastSeen: new Date().toISOString() },
              { type: 'FILE_HASH', severity: 'LOW', count: 3, lastSeen: new Date().toISOString() },
            ],
          };
          break;

        default:
          return NextResponse.json(
            { error: 'Unknown widget type' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        widget: {
          type: widgetType,
          data: widgetData,
          lastUpdated: new Date().toISOString(),
        },
      });

    } else if (action === 'update-dashboard-config') {
      // Update dashboard configuration
      const { dashboardId, configuration } = body;

      if (!dashboardId) {
        return NextResponse.json(
          { error: 'Dashboard ID is required' },
          { status: 400 }
        );
      }

      // Mock configuration update
      return NextResponse.json({
        success: true,
        message: 'Dashboard configuration updated successfully',
        dashboardId,
        configuration,
        updatedAt: new Date().toISOString(),
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: get-dashboard, get-metrics, generate-report, export-dashboard, get-widget-data, update-dashboard-config' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security dashboard API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Dashboard operation failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'dashboard-overview';

    if (action === 'dashboard-overview') {
      // Get dashboard overview data
      if (!session.user.permissions?.includes('view_security_dashboard')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view dashboard overview' },
          { status: 403 }
        );
      }

      const dashboardOverview = {
        lastUpdated: new Date().toISOString(),
        availableDashboards: [
          { type: 'EXECUTIVE', name: 'Executive Dashboard', description: 'High-level security metrics for leadership' },
          { type: 'TECHNICAL', name: 'Technical Dashboard', description: 'Detailed technical security metrics' },
          { type: 'OPERATIONAL', name: 'Operational Dashboard', description: 'Day-to-day security operations' },
          { type: 'COMPLIANCE', name: 'Compliance Dashboard', description: 'Compliance monitoring and reporting' },
        ],
        permissions: session.user.permissions || [],
        role: session.user.role || 'SECURITY_ANALYST',
        quickStats: {
          overallSecurityScore: 87,
          activeIncidents: 2,
          vulnerabilities: 23,
          complianceScore: 92,
        },
      };

      return NextResponse.json({
        success: true,
        overview: dashboardOverview,
      });

    } else if (action === 'report-templates') {
      // Get available report templates
      if (!session.user.permissions?.includes('view_security_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view report templates' },
          { status: 403 }
        );
      }

      const templates = [
        {
          id: 'EXECUTIVE_SUMMARY',
          name: 'Executive Security Summary',
          type: 'EXECUTIVE',
          description: 'High-level security overview for executives',
          frequency: 'WEEKLY',
          format: 'PDF',
          sections: ['overview', 'key_metrics', 'risk_summary', 'recommendations'],
        },
        {
          id: 'SECURITY_METRICS',
          name: 'Security Metrics Report',
          type: 'TECHNICAL',
          description: 'Detailed security metrics and analysis',
          frequency: 'MONTHLY',
          format: 'PDF',
          sections: ['vulnerability_analysis', 'compliance_status', 'incident_summary', 'trending'],
        },
        {
          id: 'COMPLIANCE_AUDIT',
          name: 'Compliance Audit Report',
          type: 'COMPLIANCE',
          description: 'Comprehensive compliance assessment',
          frequency: 'QUARTERLY',
          format: 'PDF',
          sections: ['framework_compliance', 'gap_analysis', 'remediation_plan', 'evidence'],
        },
        {
          id: 'INCIDENT_ANALYSIS',
          name: 'Incident Analysis Report',
          type: 'OPERATIONAL',
          description: 'Incident response and analysis summary',
          frequency: 'MONTHLY',
          format: 'PDF',
          sections: ['incident_summary', 'response_analysis', 'lessons_learned', 'improvements'],
        },
      ];

      return NextResponse.json({
        success: true,
        templates,
      });

    } else if (action === 'widget-catalog') {
      // Get available widgets catalog
      const widgetCatalog = [
        {
          type: 'SECURITY_OVERVIEW',
          name: 'Security Overview',
          category: 'OVERVIEW',
          description: 'Overall security score and posture',
          size: 'LARGE',
          permissions: ['view_security_metrics'],
        },
        {
          type: 'VULNERABILITY_SUMMARY',
          name: 'Vulnerability Summary',
          category: 'VULNERABILITIES',
          description: 'Current vulnerabilities by severity',
          size: 'MEDIUM',
          permissions: ['view_vulnerabilities'],
        },
        {
          type: 'COMPLIANCE_STATUS',
          name: 'Compliance Status',
          category: 'COMPLIANCE',
          description: 'Compliance framework status',
          size: 'MEDIUM',
          permissions: ['view_compliance_status'],
        },
        {
          type: 'SECURITY_TRENDS',
          name: 'Security Trends',
          category: 'ANALYTICS',
          description: 'Security metrics trends over time',
          size: 'LARGE',
          permissions: ['view_security_analytics'],
        },
        {
          type: 'INCIDENT_ALERTS',
          name: 'Active Incidents',
          category: 'INCIDENTS',
          description: 'Current active security incidents',
          size: 'MEDIUM',
          permissions: ['view_incidents'],
        },
        {
          type: 'RECENT_SCANS',
          name: 'Recent Security Scans',
          category: 'SCANNING',
          description: 'Latest security scan results',
          size: 'MEDIUM',
          permissions: ['view_security_scans'],
        },
        {
          type: 'AUDIT_ACTIVITY',
          name: 'Audit Activity',
          category: 'AUDIT',
          description: 'Recent audit log activity',
          size: 'SMALL',
          permissions: ['view_audit_logs'],
        },
        {
          type: 'THREAT_INTELLIGENCE',
          name: 'Threat Intelligence',
          category: 'THREATS',
          description: 'Current threat landscape',
          size: 'SMALL',
          permissions: ['view_threat_intelligence'],
        },
      ];

      // Filter widgets based on user permissions
      const userPermissions = session.user.permissions || [];
      const availableWidgets = widgetCatalog.filter(widget =>
        widget.permissions.every(permission => userPermissions.includes(permission))
      );

      return NextResponse.json({
        success: true,
        widgets: availableWidgets,
      });

    } else if (action === 'reports') {
      // List generated reports
      if (!session.user.permissions?.includes('view_security_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view reports' },
          { status: 403 }
        );
      }

      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // Mock reports data
      const reports = [
        {
          id: 'report-001',
          title: 'Executive Security Summary - Jan 2024',
          type: 'EXECUTIVE',
          format: 'PDF',
          status: 'COMPLETED',
          generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          fileSize: '2.4 MB',
          downloadUrl: '/api/security/dashboard/download/report-001',
        },
        {
          id: 'report-002',
          title: 'Security Metrics Report - Dec 2023',
          type: 'TECHNICAL',
          format: 'PDF',
          status: 'COMPLETED',
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          fileSize: '5.1 MB',
          downloadUrl: '/api/security/dashboard/download/report-002',
        },
        {
          id: 'report-003',
          title: 'Compliance Audit Report - Q4 2023',
          type: 'COMPLIANCE',
          format: 'PDF',
          status: 'GENERATING',
          generatedAt: new Date().toISOString(),
          progress: 75,
        },
      ];

      const filteredReports = status ? reports.filter(r => r.status === status) : reports;

      return NextResponse.json({
        success: true,
        reports: filteredReports.slice(0, limit),
        totalCount: filteredReports.length,
      });

    } else if (action === 'system-health') {
      // Get dashboard system health
      if (!session.user.permissions?.includes('view_system_health')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view system health' },
          { status: 403 }
        );
      }

      const systemHealth = {
        dashboardStatus: 'HEALTHY',
        dataFreshness: {
          vulnerabilities: { lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(), status: 'FRESH' },
          compliance: { lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(), status: 'FRESH' },
          incidents: { lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(), status: 'FRESH' },
          threats: { lastUpdate: new Date(Date.now() - 10 * 60 * 1000).toISOString(), status: 'FRESH' },
        },
        performance: {
          avgResponseTime: 250, // milliseconds
          cacheHitRate: 94.5,
          errorRate: 0.1,
        },
        resources: {
          cpuUsage: 45,
          memoryUsage: 62,
          diskUsage: 38,
        },
        integrations: {
          vulnerabilityScanner: 'CONNECTED',
          complianceEngine: 'CONNECTED',
          incidentManagement: 'CONNECTED',
          threatIntelligence: 'CONNECTED',
        },
      };

      return NextResponse.json({
        success: true,
        systemHealth,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
} 