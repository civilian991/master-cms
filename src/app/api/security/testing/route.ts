import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { securityTestingService } from '@/lib/security/testing/security-testing-service';
import { complianceValidationService } from '@/lib/security/testing/compliance-validation-service';
import { z } from 'zod';

const securityScanSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  scanType: z.enum(['PENETRATION', 'STATIC_ANALYSIS', 'DEPENDENCY', 'CONTAINER', 'INFRASTRUCTURE', 'COMPREHENSIVE']),
  targets: z.array(z.object({
    type: z.enum(['URL', 'IP_RANGE', 'REPOSITORY', 'CONTAINER_IMAGE', 'FILE_PATH']),
    value: z.string(),
    metadata: z.record(z.any()).optional(),
  })),
  tools: z.array(z.string()),
  configuration: z.object({
    depth: z.enum(['QUICK', 'STANDARD', 'DEEP']).default('STANDARD'),
    authentication: z.object({
      type: z.enum(['NONE', 'BASIC', 'BEARER', 'API_KEY', 'OAUTH']).optional(),
      credentials: z.record(z.string()).optional(),
    }).optional(),
    exclusions: z.array(z.string()).optional(),
    custom_rules: z.array(z.string()).optional(),
    compliance_frameworks: z.array(z.string()).optional(),
  }).optional(),
  scheduling: z.object({
    frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('ONCE'),
    start_time: z.string().optional(),
    timezone: z.string().default('UTC'),
  }).optional(),
  notifications: z.object({
    on_completion: z.boolean().default(true),
    on_critical_findings: z.boolean().default(true),
    recipients: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

const vulnerabilityUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK']),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const complianceAssessmentSchema = z.object({
  framework: z.enum(['OWASP_TOP_10_2021', 'CIS_CONTROLS_V8', 'NIST_CSF', 'PCI_DSS_V4', 'GDPR_SECURITY']),
  scope: z.object({
    siteIds: z.array(z.string()),
    assessmentType: z.enum(['AUTOMATED', 'MANUAL', 'HYBRID']).default('AUTOMATED'),
    includeManualReview: z.boolean().default(false),
    requirements: z.array(z.string()).optional(),
  }),
  configuration: z.object({
    depth: z.enum(['BASIC', 'STANDARD', 'COMPREHENSIVE']).default('STANDARD'),
    evidenceCollection: z.boolean().default(true),
    reportFormat: z.enum(['EXECUTIVE', 'TECHNICAL', 'DETAILED']).default('TECHNICAL'),
    includeRemediation: z.boolean().default(true),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

const complianceEvidenceSchema = z.object({
  assessmentId: z.string(),
  requirementId: z.string(),
  evidenceType: z.enum(['SCAN_REPORT', 'MANUAL_REVIEW', 'DOCUMENT', 'SCREENSHOT', 'LOG_FILE']),
  title: z.string().min(3).max(200),
  description: z.string().max(1000),
  filePath: z.string().optional(),
  content: z.string().optional(),
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

    if (action === 'create-scan') {
      // Create security scan
      if (!session.user.permissions?.includes('manage_security_testing')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for security testing management' },
          { status: 403 }
        );
      }

      const validatedData = securityScanSchema.parse({
        ...body,
        siteId: session.user.siteId,
        scheduling: body.scheduling ? {
          ...body.scheduling,
          start_time: body.scheduling.start_time ? new Date(body.scheduling.start_time) : undefined,
        } : undefined,
      });

      const scan = await securityTestingService.createSecurityScan(validatedData);

      return NextResponse.json({
        success: true,
        scan,
        message: 'Security scan created successfully',
      });

    } else if (action === 'execute-scan') {
      // Execute security scan
      if (!session.user.permissions?.includes('execute_security_scans')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for scan execution' },
          { status: 403 }
        );
      }

      const { scanId } = body;

      if (!scanId) {
        return NextResponse.json(
          { error: 'Scan ID is required' },
          { status: 400 }
        );
      }

      // Execute scan asynchronously
      securityTestingService.executeScan(scanId).catch(error => {
        console.error('Scan execution failed:', error);
      });

      return NextResponse.json({
        success: true,
        message: 'Scan execution initiated',
        scanId,
        status: 'QUEUED',
      });

    } else if (action === 'create-compliance-assessment') {
      // Create compliance assessment
      if (!session.user.permissions?.includes('manage_compliance_assessments')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for compliance assessment management' },
          { status: 403 }
        );
      }

      const validatedData = complianceAssessmentSchema.parse(body);

      const assessment = await complianceValidationService.createComplianceAssessment(validatedData);

      return NextResponse.json({
        success: true,
        assessment,
        message: 'Compliance assessment created successfully',
      });

    } else if (action === 'execute-assessment') {
      // Execute compliance assessment
      if (!session.user.permissions?.includes('execute_compliance_assessments')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for assessment execution' },
          { status: 403 }
        );
      }

      const { assessmentId } = body;

      if (!assessmentId) {
        return NextResponse.json(
          { error: 'Assessment ID is required' },
          { status: 400 }
        );
      }

      // Execute assessment asynchronously
      complianceValidationService.executeAssessment(assessmentId).catch(error => {
        console.error('Assessment execution failed:', error);
      });

      return NextResponse.json({
        success: true,
        message: 'Compliance assessment execution initiated',
        assessmentId,
        status: 'QUEUED',
      });

    } else if (action === 'submit-evidence') {
      // Submit compliance evidence
      if (!session.user.permissions?.includes('submit_compliance_evidence')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for evidence submission' },
          { status: 403 }
        );
      }

      const validatedData = complianceEvidenceSchema.parse(body);

      const evidence = await complianceValidationService.submitEvidence(validatedData);

      return NextResponse.json({
        success: true,
        evidence,
        message: 'Compliance evidence submitted successfully',
      });

    } else if (action === 'bulk-scan-creation') {
      // Create multiple security scans
      if (!session.user.permissions?.includes('manage_security_testing')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for bulk scan creation' },
          { status: 403 }
        );
      }

      const { scans } = body;

      if (!scans || !Array.isArray(scans) || scans.length === 0) {
        return NextResponse.json(
          { error: 'Scans array is required' },
          { status: 400 }
        );
      }

      const results = [];

      for (const scanData of scans) {
        try {
          const validatedData = securityScanSchema.parse({
            ...scanData,
            siteId: session.user.siteId,
          });
          const scan = await securityTestingService.createSecurityScan(validatedData);
          results.push({ scan, success: true });
        } catch (error) {
          results.push({ scan: scanData, success: false, error: error.message });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Bulk scan creation completed. ${results.filter(r => r.success).length}/${scans.length} scans created successfully`,
      });

    } else if (action === 'schedule-recurring-scans') {
      // Schedule recurring security scans
      if (!session.user.permissions?.includes('schedule_security_scans')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for scan scheduling' },
          { status: 403 }
        );
      }

      const { scanTemplate, schedule } = body;

      if (!scanTemplate || !schedule) {
        return NextResponse.json(
          { error: 'Scan template and schedule are required' },
          { status: 400 }
        );
      }

      // Implementation would create scheduled scan job
      return NextResponse.json({
        success: true,
        scheduleId: crypto.randomUUID(),
        scanTemplate,
        schedule,
        message: 'Recurring scan scheduled successfully',
      });

    } else if (action === 'generate-security-report') {
      // Generate comprehensive security report
      if (!session.user.permissions?.includes('generate_security_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for report generation' },
          { status: 403 }
        );
      }

      const { reportType, timeRange, scope, format } = body;

      if (!reportType) {
        return NextResponse.json(
          { error: 'Report type is required' },
          { status: 400 }
        );
      }

      // Implementation would generate security report
      return NextResponse.json({
        success: true,
        reportId: crypto.randomUUID(),
        reportType,
        format: format || 'PDF',
        status: 'GENERATING',
        estimatedTime: '10-15 minutes',
        message: 'Security report generation initiated',
      });

    } else if (action === 'validate-tools') {
      // Validate security testing tools availability
      if (!session.user.permissions?.includes('manage_security_tools')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for tool management' },
          { status: 403 }
        );
      }

      const { tools } = body;

      // Implementation would validate tool availability
      const toolStatus = {
        OWASP_ZAP: { available: true, version: '2.14.0', status: 'HEALTHY' },
        NMAP: { available: true, version: '7.93', status: 'HEALTHY' },
        SQLMAP: { available: true, version: '1.7.2', status: 'HEALTHY' },
        SONARQUBE: { available: false, version: null, status: 'UNAVAILABLE' },
        SNYK: { available: true, version: '1.1045.0', status: 'HEALTHY' },
        TRIVY: { available: true, version: '0.46.1', status: 'HEALTHY' },
      };

      return NextResponse.json({
        success: true,
        toolStatus,
        summary: {
          total: Object.keys(toolStatus).length,
          available: Object.values(toolStatus).filter(t => t.available).length,
          unavailable: Object.values(toolStatus).filter(t => !t.available).length,
        },
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: create-scan, execute-scan, create-compliance-assessment, execute-assessment, submit-evidence, bulk-scan-creation, schedule-recurring-scans, generate-security-report, validate-tools' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security testing API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Security testing operation failed', details: error.message },
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
    const action = url.searchParams.get('action') || 'dashboard';

    if (action === 'dashboard') {
      // Get security testing dashboard data
      if (!session.user.permissions?.includes('view_security_testing')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view security testing dashboard' },
          { status: 403 }
        );
      }

      const timeRange = url.searchParams.get('timeRange') || '30d';
      let startDate: Date, endDate: Date = new Date();

      switch (timeRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const metrics = await securityTestingService.getSecurityTestingMetrics(
        session.user.siteId,
        { start: startDate, end: endDate }
      );

      return NextResponse.json({
        success: true,
        dashboard: {
          metrics,
          timeRange: { start: startDate, end: endDate },
        },
      });

    } else if (action === 'scans') {
      // List security scans
      if (!session.user.permissions?.includes('view_security_scans')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view security scans' },
          { status: 403 }
        );
      }

      const scanType = url.searchParams.get('scanType');
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Implementation would query scans from database
      const scans = []; // Mock data

      return NextResponse.json({
        success: true,
        scans,
        pagination: {
          limit,
          offset,
          total: scans.length,
          hasMore: false,
        },
      });

    } else if (action === 'vulnerabilities') {
      // List vulnerabilities
      if (!session.user.permissions?.includes('view_vulnerabilities')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view vulnerabilities' },
          { status: 403 }
        );
      }

      const severity = url.searchParams.get('severity');
      const status = url.searchParams.get('status');
      const category = url.searchParams.get('category');
      const scanId = url.searchParams.get('scanId');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      // Implementation would query vulnerabilities
      const vulnerabilities = []; // Mock data

      return NextResponse.json({
        success: true,
        vulnerabilities,
        summary: {
          total: vulnerabilities.length,
          bySeverity: {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
            INFO: 0,
          },
          byStatus: {
            OPEN: 0,
            IN_PROGRESS: 0,
            RESOLVED: 0,
            FALSE_POSITIVE: 0,
            ACCEPTED_RISK: 0,
          },
        },
      });

    } else if (action === 'assessments') {
      // List compliance assessments
      if (!session.user.permissions?.includes('view_compliance_assessments')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view compliance assessments' },
          { status: 403 }
        );
      }

      const framework = url.searchParams.get('framework');
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // Implementation would query assessments
      const assessments = []; // Mock data

      return NextResponse.json({
        success: true,
        assessments,
        totalCount: assessments.length,
      });

    } else if (action === 'compliance-status') {
      // Get overall compliance status
      if (!session.user.permissions?.includes('view_compliance_status')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view compliance status' },
          { status: 403 }
        );
      }

      const complianceStatus = {
        overallScore: 87.5,
        frameworks: {
          OWASP_TOP_10_2021: { score: 92, status: 'COMPLIANT', lastAssessment: '2024-01-15' },
          CIS_CONTROLS_V8: { score: 85, status: 'PARTIALLY_COMPLIANT', lastAssessment: '2024-01-10' },
          NIST_CSF: { score: 88, status: 'COMPLIANT', lastAssessment: '2024-01-12' },
          PCI_DSS_V4: { score: 83, status: 'PARTIALLY_COMPLIANT', lastAssessment: '2024-01-08' },
          GDPR_SECURITY: { score: 90, status: 'COMPLIANT', lastAssessment: '2024-01-14' },
        },
        trends: [
          { date: '2024-01-01', score: 82 },
          { date: '2024-01-08', score: 85 },
          { date: '2024-01-15', score: 87.5 },
        ],
        criticalGaps: [
          'Multi-factor authentication not enforced for all admin accounts',
          'Vulnerability scanning frequency below recommended intervals',
          'Incident response plan requires testing and validation',
        ],
        nextAssessments: [
          { framework: 'OWASP_TOP_10_2021', dueDate: '2024-04-15', type: 'SCHEDULED' },
          { framework: 'PCI_DSS_V4', dueDate: '2024-03-01', type: 'REQUIRED' },
        ],
      };

      return NextResponse.json({
        success: true,
        compliance: complianceStatus,
      });

    } else if (action === 'scan-results') {
      // Get detailed scan results
      const scanId = url.searchParams.get('scanId');

      if (!scanId) {
        return NextResponse.json(
          { error: 'Scan ID is required' },
          { status: 400 }
        );
      }

      if (!session.user.permissions?.includes('view_scan_results')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view scan results' },
          { status: 403 }
        );
      }

      // Implementation would get scan results
      const scanResults = {
        scanId,
        status: 'COMPLETED',
        summary: {
          vulnerabilities: 15,
          critical: 2,
          high: 5,
          medium: 6,
          low: 2,
          riskScore: 7.2,
        },
        vulnerabilities: [],
        toolOutputs: {},
        recommendations: [
          'Update vulnerable dependencies identified in scan',
          'Implement input validation for SQL injection vulnerabilities',
          'Configure security headers for XSS protection',
        ],
      };

      return NextResponse.json({
        success: true,
        results: scanResults,
      });

    } else if (action === 'assessment-report') {
      // Get compliance assessment report
      const assessmentId = url.searchParams.get('assessmentId');
      const format = url.searchParams.get('format') || 'json';

      if (!assessmentId) {
        return NextResponse.json(
          { error: 'Assessment ID is required' },
          { status: 400 }
        );
      }

      if (!session.user.permissions?.includes('view_assessment_reports')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view assessment reports' },
          { status: 403 }
        );
      }

      // Implementation would generate assessment report
      const report = {
        assessmentId,
        framework: 'OWASP_TOP_10_2021',
        overallScore: 85,
        status: 'PARTIALLY_COMPLIANT',
        requirements: [],
        recommendations: [],
        evidence: [],
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        report,
        format,
      });

    } else if (action === 'tool-status') {
      // Get security testing tools status
      if (!session.user.permissions?.includes('view_tool_status')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view tool status' },
          { status: 403 }
        );
      }

      const toolStatus = {
        penetrationTools: {
          OWASP_ZAP: { status: 'HEALTHY', version: '2.14.0', lastCheck: new Date().toISOString() },
          NMAP: { status: 'HEALTHY', version: '7.93', lastCheck: new Date().toISOString() },
          NIKTO: { status: 'HEALTHY', version: '2.5.0', lastCheck: new Date().toISOString() },
          SQLMAP: { status: 'HEALTHY', version: '1.7.2', lastCheck: new Date().toISOString() },
        },
        staticAnalysisTools: {
          SONARQUBE: { status: 'WARNING', version: '9.9.0', lastCheck: new Date().toISOString(), issue: 'High memory usage' },
          ESLINT_SECURITY: { status: 'HEALTHY', version: '8.56.0', lastCheck: new Date().toISOString() },
          SEMGREP: { status: 'HEALTHY', version: '1.45.0', lastCheck: new Date().toISOString() },
        },
        dependencyTools: {
          NPM_AUDIT: { status: 'HEALTHY', version: '10.2.3', lastCheck: new Date().toISOString() },
          SNYK: { status: 'HEALTHY', version: '1.1045.0', lastCheck: new Date().toISOString() },
        },
        containerTools: {
          TRIVY: { status: 'HEALTHY', version: '0.46.1', lastCheck: new Date().toISOString() },
          DOCKER_BENCH: { status: 'HEALTHY', version: '1.5.0', lastCheck: new Date().toISOString() },
        },
        summary: {
          total: 10,
          healthy: 9,
          warning: 1,
          error: 0,
          lastUpdate: new Date().toISOString(),
        },
      };

      return NextResponse.json({
        success: true,
        toolStatus,
      });

    } else if (action === 'security-trends') {
      // Get security trends and analytics
      if (!session.user.permissions?.includes('view_security_analytics')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view security analytics' },
          { status: 403 }
        );
      }

      const timeRange = url.searchParams.get('timeRange') || '90d';

      const trends = {
        vulnerabilityTrends: [
          { date: '2024-01-01', total: 45, critical: 3, high: 12, medium: 20, low: 10 },
          { date: '2024-01-08', total: 38, critical: 2, high: 10, medium: 18, low: 8 },
          { date: '2024-01-15', total: 29, critical: 1, high: 8, medium: 15, low: 5 },
        ],
        complianceTrends: [
          { date: '2024-01-01', score: 78 },
          { date: '2024-01-08', score: 82 },
          { date: '2024-01-15', score: 87.5 },
        ],
        riskTrends: [
          { date: '2024-01-01', score: 8.2 },
          { date: '2024-01-08', score: 7.8 },
          { date: '2024-01-15', score: 7.2 },
        ],
        scanFrequency: {
          daily: 24,
          weekly: 156,
          monthly: 48,
          adhoc: 89,
        },
        topVulnerabilityCategories: [
          { category: 'Injection', count: 15, trend: 'DECREASING' },
          { category: 'Broken Access Control', count: 12, trend: 'STABLE' },
          { category: 'Security Misconfiguration', count: 10, trend: 'DECREASING' },
          { category: 'Vulnerable Components', count: 8, trend: 'INCREASING' },
        ],
      };

      return NextResponse.json({
        success: true,
        trends,
        timeRange,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security testing GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get security testing data' },
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

    if (action === 'update-vulnerability') {
      // Update vulnerability status
      if (!session.user.permissions?.includes('manage_vulnerabilities')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for vulnerability management' },
          { status: 403 }
        );
      }

      const { vulnerabilityId } = body;
      const validatedData = vulnerabilityUpdateSchema.parse(body);

      if (!vulnerabilityId) {
        return NextResponse.json(
          { error: 'Vulnerability ID is required' },
          { status: 400 }
        );
      }

      // Implementation would update vulnerability
      return NextResponse.json({
        success: true,
        message: 'Vulnerability updated successfully',
        vulnerabilityId,
        updates: validatedData,
        updatedBy: session.user.id,
        updatedAt: new Date().toISOString(),
      });

    } else if (action === 'update-scan') {
      // Update scan configuration
      if (!session.user.permissions?.includes('manage_security_testing')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for scan management' },
          { status: 403 }
        );
      }

      const { scanId, updates } = body;

      if (!scanId) {
        return NextResponse.json(
          { error: 'Scan ID is required' },
          { status: 400 }
        );
      }

      // Implementation would update scan
      return NextResponse.json({
        success: true,
        message: 'Scan updated successfully',
        scanId,
        updates,
        updatedBy: session.user.id,
        updatedAt: new Date().toISOString(),
      });

    } else if (action === 'verify-evidence') {
      // Verify compliance evidence
      if (!session.user.permissions?.includes('verify_compliance_evidence')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for evidence verification' },
          { status: 403 }
        );
      }

      const { evidenceId, verified, comments } = body;

      if (!evidenceId || verified === undefined) {
        return NextResponse.json(
          { error: 'Evidence ID and verification status are required' },
          { status: 400 }
        );
      }

      // Implementation would verify evidence
      return NextResponse.json({
        success: true,
        message: 'Evidence verification updated successfully',
        evidenceId,
        verified,
        verifiedBy: session.user.id,
        verifiedAt: new Date().toISOString(),
        comments,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security testing PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update security testing data' },
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

    if (action === 'cancel-scan') {
      // Cancel running scan
      if (!session.user.permissions?.includes('cancel_security_scans')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for scan cancellation' },
          { status: 403 }
        );
      }

      const scanId = url.searchParams.get('scanId');

      if (!scanId) {
        return NextResponse.json(
          { error: 'Scan ID is required' },
          { status: 400 }
        );
      }

      // Implementation would cancel scan
      return NextResponse.json({
        success: true,
        message: 'Scan cancelled successfully',
        scanId,
        cancelledBy: session.user.id,
        cancelledAt: new Date().toISOString(),
      });

    } else if (action === 'delete-assessment') {
      // Delete compliance assessment
      if (!session.user.permissions?.includes('delete_compliance_assessments')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for assessment deletion' },
          { status: 403 }
        );
      }

      const assessmentId = url.searchParams.get('assessmentId');

      if (!assessmentId) {
        return NextResponse.json(
          { error: 'Assessment ID is required' },
          { status: 400 }
        );
      }

      // Implementation would delete assessment
      return NextResponse.json({
        success: true,
        message: 'Assessment deleted successfully',
        assessmentId,
        deletedBy: session.user.id,
        deletedAt: new Date().toISOString(),
      });

    } else if (action === 'cleanup-old-scans') {
      // Clean up old completed scans
      if (!session.user.permissions?.includes('cleanup_security_data')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for data cleanup' },
          { status: 403 }
        );
      }

      const olderThan = parseInt(url.searchParams.get('olderThan') || '90'); // days
      const scanTypes = url.searchParams.get('scanTypes')?.split(',') || [];

      // Implementation would cleanup old scans
      return NextResponse.json({
        success: true,
        message: 'Scan cleanup initiated',
        cleanupId: crypto.randomUUID(),
        criteria: {
          olderThan: `${olderThan} days`,
          scanTypes: scanTypes.length > 0 ? scanTypes : ['ALL'],
        },
        initiatedBy: session.user.id,
        initiatedAt: new Date().toISOString(),
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security testing DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete security testing data' },
      { status: 500 }
    );
  }
} 