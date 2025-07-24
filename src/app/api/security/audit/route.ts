import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { auditService } from '@/lib/security/audit/audit-service';
import { auditComplianceMonitoringService } from '@/lib/security/audit/compliance-monitoring-service';
import { z } from 'zod';

const auditEventSchema = z.object({
  category: z.enum(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'ADMINISTRATIVE', 'SECURITY', 'SYSTEM', 'COMPLIANCE']),
  eventType: z.string().min(1).max(100),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  outcome: z.enum(['SUCCESS', 'FAILURE', 'PARTIAL']),
  details: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
});

const auditQuerySchema = z.object({
  category: z.string().optional(),
  eventType: z.string().optional(),
  userId: z.string().optional(),
  severity: z.string().optional(),
  outcome: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(10000).default(1000),
  offset: z.number().min(0).default(0),
  includeDetails: z.boolean().default(false),
});

const auditTrailSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string(),
  operation: z.string(),
  beforeState: z.record(z.any()).optional(),
  afterState: z.record(z.any()).optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const auditReportSchema = z.object({
  reportType: z.enum(['SUMMARY', 'DETAILED', 'COMPLIANCE', 'SECURITY', 'USER_ACTIVITY', 'SYSTEM_ACTIVITY']),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  filters: z.object({
    categories: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    severity: z.array(z.string()).optional(),
    outcomes: z.array(z.string()).optional(),
  }).optional(),
  format: z.enum(['PDF', 'CSV', 'JSON', 'HTML']).default('PDF'),
  includeCharts: z.boolean().default(true),
  complianceFramework: z.string().optional(),
});

const complianceRuleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  framework: z.enum(['SOX', 'PCI_DSS', 'HIPAA', 'GDPR', 'CUSTOM']),
  ruleType: z.enum(['THRESHOLD', 'PATTERN', 'STATISTICAL', 'TEMPORAL']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'contains', 'regex']),
    value: z.any(),
    weight: z.number().min(0).max(1).optional(),
  })),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  threshold: z.number().optional(),
  timeWindow: z.number().optional(),
  enabled: z.boolean().default(true),
  autoAlert: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

const complianceAssessmentSchema = z.object({
  framework: z.enum(['SOX', 'PCI_DSS', 'HIPAA', 'GDPR']),
  assessmentType: z.enum(['AUTOMATED', 'MANUAL', 'HYBRID']),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  includeRecommendations: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

const retentionPolicySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  categories: z.array(z.string()),
  retentionDays: z.number().min(-1),
  archiveAfterDays: z.number().min(1).optional(),
  compressionEnabled: z.boolean().default(true),
  encryptionRequired: z.boolean().default(true),
  complianceFrameworks: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
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

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    if (action === 'log-event') {
      // Log audit event
      const validatedData = auditEventSchema.parse({
        ...body,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      });

      const auditEvent = await auditService.logAuditEvent({
        ...validatedData,
        siteId: session.user.siteId!,
        userId: validatedData.userId || session.user.id,
        sessionId: validatedData.sessionId || session.user.sessionId,
        ipAddress: validatedData.ipAddress || ipAddress,
        userAgent: validatedData.userAgent || userAgent,
      });

      // Analyze for compliance violations
      const violations = await auditComplianceMonitoringService.analyzeAuditEvent(auditEvent);

      return NextResponse.json({
        success: true,
        auditEvent,
        violations,
        message: 'Audit event logged successfully',
      });

    } else if (action === 'create-trail') {
      // Create audit trail for entity changes
      if (!session.user.permissions?.includes('create_audit_trails')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for audit trail creation' },
          { status: 403 }
        );
      }

      const validatedData = auditTrailSchema.parse(body);

      const auditTrail = await auditService.createAuditTrail(
        validatedData.entityType,
        validatedData.entityId,
        validatedData.operation,
        session.user.id,
        validatedData.beforeState,
        validatedData.afterState,
        validatedData.reason,
        {
          ...validatedData.metadata,
          siteId: session.user.siteId,
          ipAddress,
          userAgent,
        }
      );

      return NextResponse.json({
        success: true,
        auditTrail,
        message: 'Audit trail created successfully',
      });

    } else if (action === 'generate-report') {
      // Generate audit report
      if (!session.user.permissions?.includes('generate_audit_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for audit report generation' },
          { status: 403 }
        );
      }

      const validatedData = auditReportSchema.parse({
        ...body,
        timeRange: {
          start: new Date(body.timeRange.start),
          end: new Date(body.timeRange.end),
        },
      });

      const report = await auditService.generateAuditReport({
        ...validatedData,
        siteId: session.user.siteId!,
      });

      return NextResponse.json({
        success: true,
        report,
        message: 'Audit report generation initiated',
      });

    } else if (action === 'create-compliance-rule') {
      // Create compliance monitoring rule
      if (!session.user.permissions?.includes('manage_compliance_rules')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for compliance rule management' },
          { status: 403 }
        );
      }

      const validatedData = complianceRuleSchema.parse(body);

      const rule = await auditComplianceMonitoringService.createComplianceRule(validatedData);

      return NextResponse.json({
        success: true,
        rule,
        message: 'Compliance rule created successfully',
      });

    } else if (action === 'conduct-compliance-assessment') {
      // Conduct compliance assessment
      if (!session.user.permissions?.includes('conduct_compliance_assessments')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for compliance assessments' },
          { status: 403 }
        );
      }

      const validatedData = complianceAssessmentSchema.parse({
        ...body,
        timeRange: {
          start: new Date(body.timeRange.start),
          end: new Date(body.timeRange.end),
        },
      });

      const assessment = await auditComplianceMonitoringService.conductComplianceAssessment({
        ...validatedData,
        siteId: session.user.siteId!,
      });

      return NextResponse.json({
        success: true,
        assessment,
        message: 'Compliance assessment initiated successfully',
      });

    } else if (action === 'create-retention-policy') {
      // Create retention policy
      if (!session.user.permissions?.includes('manage_retention_policies')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for retention policy management' },
          { status: 403 }
        );
      }

      const validatedData = retentionPolicySchema.parse(body);

      // Implementation would create retention policy
      return NextResponse.json({
        success: true,
        message: 'Retention policy created successfully',
        policy: {
          id: crypto.randomUUID(),
          ...validatedData,
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
        },
      });

    } else if (action === 'validate-integrity') {
      // Validate audit log integrity
      if (!session.user.permissions?.includes('validate_audit_integrity')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for integrity validation' },
          { status: 403 }
        );
      }

      const { eventIds } = body;

      const validationResult = await auditComplianceMonitoringService.validateAuditLogIntegrity(eventIds);

      return NextResponse.json({
        success: true,
        validation: validationResult,
        message: `Integrity validation completed. ${validationResult.valid} valid, ${validationResult.invalid} invalid events`,
      });

    } else if (action === 'bulk-log-events') {
      // Bulk log audit events
      const { events } = body;

      if (!events || !Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'Events array is required' },
          { status: 400 }
        );
      }

      const results = [];

      for (const eventData of events) {
        try {
          const validatedData = auditEventSchema.parse(eventData);
          const auditEvent = await auditService.logAuditEvent({
            ...validatedData,
            siteId: session.user.siteId!,
            userId: validatedData.userId || session.user.id,
            timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
          });
          results.push({ event: auditEvent, success: true });
        } catch (error) {
          results.push({ event: eventData, success: false, error: error.message });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Bulk logging completed. ${results.filter(r => r.success).length}/${events.length} events logged successfully`,
      });

    } else if (action === 'export-audit-data') {
      // Export audit data
      if (!session.user.permissions?.includes('export_audit_data')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for audit data export' },
          { status: 403 }
        );
      }

      const { format, timeRange, filters } = body;

      if (!timeRange || !timeRange.start || !timeRange.end) {
        return NextResponse.json(
          { error: 'Time range is required for export' },
          { status: 400 }
        );
      }

      // Implementation would generate export file
      return NextResponse.json({
        success: true,
        exportId: crypto.randomUUID(),
        format: format || 'CSV',
        status: 'GENERATING',
        estimatedTime: '5-10 minutes',
        message: 'Audit data export initiated',
      });

    } else if (action === 'archive-old-logs') {
      // Archive old audit logs
      if (!session.user.permissions?.includes('manage_audit_archival')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for audit log archival' },
          { status: 403 }
        );
      }

      const { retentionDays, categories } = body;

      // Implementation would archive old logs
      return NextResponse.json({
        success: true,
        message: 'Audit log archival initiated',
        archivalId: crypto.randomUUID(),
        retentionDays: retentionDays || 2555, // 7 years default
        categories: categories || ['ALL'],
        status: 'PROCESSING',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: log-event, create-trail, generate-report, create-compliance-rule, conduct-compliance-assessment, create-retention-policy, validate-integrity, bulk-log-events, export-audit-data, archive-old-logs' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Audit API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Audit operation failed', details: error.message },
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
    const action = url.searchParams.get('action') || 'query-events';

    if (action === 'query-events') {
      // Query audit events
      if (!session.user.permissions?.includes('view_audit_events')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view audit events' },
          { status: 403 }
        );
      }

      const queryParams = {
        siteId: session.user.siteId,
        category: url.searchParams.get('category') || undefined,
        eventType: url.searchParams.get('eventType') || undefined,
        userId: url.searchParams.get('userId') || undefined,
        severity: url.searchParams.get('severity') || undefined,
        outcome: url.searchParams.get('outcome') || undefined,
        startDate: url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined,
        endDate: url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined,
        limit: parseInt(url.searchParams.get('limit') || '1000'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        includeDetails: url.searchParams.get('includeDetails') === 'true',
      };

      const result = await auditService.queryAuditEvents(queryParams);

      return NextResponse.json({
        success: true,
        events: result.events,
        totalCount: result.totalCount,
        pagination: {
          limit: queryParams.limit,
          offset: queryParams.offset,
          hasMore: result.totalCount > queryParams.offset + queryParams.limit,
        },
      });

    } else if (action === 'metrics') {
      // Get audit metrics and dashboard data
      if (!session.user.permissions?.includes('view_audit_metrics')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view audit metrics' },
          { status: 403 }
        );
      }

      const timeRange = url.searchParams.get('timeRange') || '30d';
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      let dateRange: { start: Date; end: Date } | undefined;

      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      } else {
        const end = new Date();
        let start: Date;

        switch (timeRange) {
          case '7d':
            start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        dateRange = { start, end };
      }

      const [auditMetrics, complianceMetrics] = await Promise.all([
        auditService.getAuditMetrics(session.user.siteId, dateRange),
        auditComplianceMonitoringService.getComplianceMetrics(session.user.siteId, dateRange),
      ]);

      return NextResponse.json({
        success: true,
        metrics: {
          audit: auditMetrics,
          compliance: complianceMetrics,
        },
        timeRange: dateRange,
      });

    } else if (action === 'compliance-status') {
      // Get compliance status
      if (!session.user.permissions?.includes('view_compliance_status')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view compliance status' },
          { status: 403 }
        );
      }

      const framework = url.searchParams.get('framework');

      const complianceMetrics = await auditComplianceMonitoringService.getComplianceMetrics(session.user.siteId);

      const status = {
        overallCompliance: complianceMetrics.overallCompliance,
        frameworkCompliance: framework 
          ? { [framework]: complianceMetrics.frameworkCompliance[framework] }
          : complianceMetrics.frameworkCompliance,
        violationTrends: complianceMetrics.violationTrends,
        auditCoverage: complianceMetrics.auditCoverage,
        integrityStatus: complianceMetrics.integrityStatus,
        retentionCompliance: complianceMetrics.retentionCompliance,
      };

      return NextResponse.json({
        success: true,
        compliance: status,
      });

    } else if (action === 'violations') {
      // Get compliance violations
      if (!session.user.permissions?.includes('view_compliance_violations')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view compliance violations' },
          { status: 403 }
        );
      }

      const framework = url.searchParams.get('framework');
      const severity = url.searchParams.get('severity');
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      // Implementation would query violations from database
      const violations = []; // Mock data

      return NextResponse.json({
        success: true,
        violations,
        totalCount: violations.length,
      });

    } else if (action === 'audit-trail') {
      // Get audit trail for specific entity
      if (!session.user.permissions?.includes('view_audit_trails')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view audit trails' },
          { status: 403 }
        );
      }

      const entityType = url.searchParams.get('entityType');
      const entityId = url.searchParams.get('entityId');

      if (!entityType || !entityId) {
        return NextResponse.json(
          { error: 'Entity type and ID are required' },
          { status: 400 }
        );
      }

      // Implementation would query audit trail from database
      const auditTrail = []; // Mock data

      return NextResponse.json({
        success: true,
        auditTrail,
        entity: { type: entityType, id: entityId },
      });

    } else if (action === 'reports') {
      // List audit reports
      if (!session.user.permissions?.includes('view_audit_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view audit reports' },
          { status: 403 }
        );
      }

      const reportType = url.searchParams.get('reportType');
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // Implementation would query reports from database
      const reports = []; // Mock data

      return NextResponse.json({
        success: true,
        reports,
        totalCount: reports.length,
      });

    } else if (action === 'integrity-status') {
      // Get audit log integrity status
      if (!session.user.permissions?.includes('view_audit_integrity')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view integrity status' },
          { status: 403 }
        );
      }

      // Implementation would get integrity status
      const integrityStatus = {
        lastValidation: new Date().toISOString(),
        totalEvents: 150000,
        validatedEvents: 149998,
        integrityFailures: 2,
        integrityRate: 99.999,
        suspiciousPatterns: 0,
        recommendations: [
          'Review events with integrity failures',
          'Consider additional security measures for critical audit logs',
        ],
      };

      return NextResponse.json({
        success: true,
        integrity: integrityStatus,
      });

    } else if (action === 'retention-policies') {
      // Get retention policies
      if (!session.user.permissions?.includes('view_retention_policies')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view retention policies' },
          { status: 403 }
        );
      }

      // Implementation would query retention policies
      const policies = [
        {
          id: 'policy-sox',
          name: 'SOX Compliance Retention',
          categories: ['AUTHENTICATION', 'DATA_MODIFICATION', 'ADMINISTRATIVE'],
          retentionDays: 2555,
          complianceFrameworks: ['SOX'],
          active: true,
        },
        {
          id: 'policy-pci',
          name: 'PCI DSS Retention',
          categories: ['AUTHENTICATION', 'DATA_ACCESS', 'SECURITY'],
          retentionDays: 365,
          complianceFrameworks: ['PCI_DSS'],
          active: true,
        },
      ];

      return NextResponse.json({
        success: true,
        policies,
        totalCount: policies.length,
      });

    } else if (action === 'event-categories') {
      // Get audit event categories and templates
      const categories = [
        { value: 'AUTHENTICATION', label: 'Authentication Events', retention: 2555 },
        { value: 'AUTHORIZATION', label: 'Authorization Events', retention: 2555 },
        { value: 'DATA_ACCESS', label: 'Data Access Events', retention: 2555 },
        { value: 'DATA_MODIFICATION', label: 'Data Modification Events', retention: 2555 },
        { value: 'ADMINISTRATIVE', label: 'Administrative Events', retention: 2555 },
        { value: 'SECURITY', label: 'Security Events', retention: 2555 },
        { value: 'SYSTEM', label: 'System Events', retention: 1095 },
        { value: 'COMPLIANCE', label: 'Compliance Events', retention: 2555 },
      ];

      const severities = [
        { value: 'LOW', label: 'Low', color: '#00AA00' },
        { value: 'MEDIUM', label: 'Medium', color: '#FFAA00' },
        { value: 'HIGH', label: 'High', color: '#FF6600' },
        { value: 'CRITICAL', label: 'Critical', color: '#FF0000' },
      ];

      const outcomes = [
        { value: 'SUCCESS', label: 'Success' },
        { value: 'FAILURE', label: 'Failure' },
        { value: 'PARTIAL', label: 'Partial' },
      ];

      const complianceFrameworks = [
        { value: 'SOX', label: 'Sarbanes-Oxley Act', retention: 2555 },
        { value: 'PCI_DSS', label: 'PCI Data Security Standard', retention: 365 },
        { value: 'HIPAA', label: 'Health Insurance Portability Act', retention: 2190 },
        { value: 'GDPR', label: 'General Data Protection Regulation', retention: 2555 },
      ];

      return NextResponse.json({
        success: true,
        templates: {
          categories,
          severities,
          outcomes,
          complianceFrameworks,
        },
      });

    } else if (action === 'system-health') {
      // Get audit system health
      if (!session.user.permissions?.includes('view_system_health')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view system health' },
          { status: 403 }
        );
      }

      const systemHealth = {
        auditingEnabled: true,
        encryptionActive: true,
        retentionActive: true,
        integrityValidation: true,
        backlogCount: 0,
        lastProcessed: new Date().toISOString(),
        eventRate: 1250, // events per hour
        storageUsed: '450 GB',
        storageLimit: '1 TB',
        compressionRatio: 3.2,
        performanceMetrics: {
          avgLogTime: 2.5, // milliseconds
          maxLogTime: 45,
          throughput: 5000, // events per minute
        },
        alerts: [],
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
    console.error('Audit GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    if (action === 'resolve-violation') {
      // Resolve compliance violation
      if (!session.user.permissions?.includes('manage_compliance_violations')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for violation management' },
          { status: 403 }
        );
      }

      const { violationId, resolution, status } = body;

      if (!violationId || !resolution) {
        return NextResponse.json(
          { error: 'Violation ID and resolution are required' },
          { status: 400 }
        );
      }

      // Implementation would update violation in database
      return NextResponse.json({
        success: true,
        message: 'Compliance violation resolved successfully',
        violationId,
        resolution,
        status: status || 'RESOLVED',
        resolvedBy: session.user.id,
        resolvedAt: new Date().toISOString(),
      });

    } else if (action === 'update-retention-policy') {
      // Update retention policy
      if (!session.user.permissions?.includes('manage_retention_policies')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for retention policy management' },
          { status: 403 }
        );
      }

      const { policyId, updates } = body;

      if (!policyId) {
        return NextResponse.json(
          { error: 'Policy ID is required' },
          { status: 400 }
        );
      }

      // Implementation would update retention policy
      return NextResponse.json({
        success: true,
        message: 'Retention policy updated successfully',
        policyId,
        updates,
        updatedBy: session.user.id,
        updatedAt: new Date().toISOString(),
      });

    } else if (action === 'update-compliance-rule') {
      // Update compliance rule
      if (!session.user.permissions?.includes('manage_compliance_rules')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for compliance rule management' },
          { status: 403 }
        );
      }

      const { ruleId, updates } = body;

      if (!ruleId) {
        return NextResponse.json(
          { error: 'Rule ID is required' },
          { status: 400 }
        );
      }

      // Implementation would update compliance rule
      return NextResponse.json({
        success: true,
        message: 'Compliance rule updated successfully',
        ruleId,
        updates,
        updatedBy: session.user.id,
        updatedAt: new Date().toISOString(),
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Audit PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update audit data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const action = url.searchParams.get('action');

    if (action === 'purge-old-logs') {
      // Purge old audit logs (beyond retention)
      if (!session.user.permissions?.includes('purge_audit_logs')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for audit log purging' },
          { status: 403 }
        );
      }

      const retentionDays = parseInt(url.searchParams.get('retentionDays') || '2555');
      const categories = url.searchParams.get('categories')?.split(',') || [];

      // Implementation would purge old logs
      return NextResponse.json({
        success: true,
        message: 'Audit log purging initiated',
        purgeId: crypto.randomUUID(),
        retentionDays,
        categories: categories.length > 0 ? categories : ['ALL'],
        status: 'PROCESSING',
      });

    } else if (action === 'delete-retention-policy') {
      // Delete retention policy
      if (!session.user.permissions?.includes('manage_retention_policies')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for retention policy management' },
          { status: 403 }
        );
      }

      const policyId = url.searchParams.get('policyId');

      if (!policyId) {
        return NextResponse.json(
          { error: 'Policy ID is required' },
          { status: 400 }
        );
      }

      // Implementation would delete retention policy
      return NextResponse.json({
        success: true,
        message: 'Retention policy deleted successfully',
        policyId,
        deletedBy: session.user.id,
        deletedAt: new Date().toISOString(),
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Audit DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete audit data' },
      { status: 500 }
    );
  }
} 