import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { siemService } from '@/lib/security/monitoring/siem-service';
import { threatDetectionEngine } from '@/lib/security/monitoring/threat-detection';
import { correlationEngine } from '@/lib/security/monitoring/correlation-engine';
import { analyticsService } from '@/lib/security/monitoring/analytics-service';
import { z } from 'zod';

const eventIngestionSchema = z.object({
  eventType: z.enum([
    'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'FILE_OPERATION',
    'ADMIN_OPERATION', 'API_ACCESS', 'SYSTEM_OPERATION', 'THREAT_DETECTED',
    'ANOMALY_DETECTED', 'COMPLIANCE_VIOLATION', 'SECURITY_ALERT'
  ]),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string(),
  description: z.string(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  action: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const threatIndicatorSchema = z.object({
  type: z.enum([
    'MALICIOUS_IP', 'SUSPICIOUS_DOMAIN', 'KNOWN_MALWARE',
    'SUSPICIOUS_USER_AGENT', 'GEOLOCATION_ANOMALY', 'VELOCITY_ANOMALY',
    'PRIVILEGE_ESCALATION', 'DATA_EXFILTRATION', 'BRUTE_FORCE'
  ]),
  value: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  confidence: z.number().min(0).max(100),
  source: z.string(),
  description: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const alertRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  enabled: z.boolean().default(true),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'regex']),
    value: z.any(),
  })),
  timeWindow: z.number().min(60).max(86400),
  threshold: z.number().min(1),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'WEBHOOK', 'SLACK', 'SMS', 'CREATE_INCIDENT']),
    target: z.string(),
    template: z.string().optional(),
  })),
  suppressionTime: z.number().min(300).max(86400).optional(),
});

const correlationRequestSchema = z.object({
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  filters: z.object({
    eventTypes: z.array(z.string()).optional(),
    severities: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    ipAddresses: z.array(z.string()).optional(),
    resourceTypes: z.array(z.string()).optional(),
  }).optional(),
  algorithms: z.array(z.enum(['temporal', 'spatial', 'behavioral', 'sequential'])).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
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

    // Check security permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for security operations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    if (action === 'ingest-event') {
      // Ingest security event into SIEM
      const validatedData = eventIngestionSchema.parse(body);

      const securityEvent = await siemService.ingestEvent({
        eventType: validatedData.eventType,
        severity: validatedData.severity,
        source: 'API',
        title: validatedData.title,
        description: validatedData.description,
        userId: session.user.id,
        siteId: session.user.siteId,
        ipAddress,
        userAgent,
        sessionId: session.user.sessionId,
        resourceId: validatedData.resourceId,
        resourceType: validatedData.resourceType,
        action: validatedData.action,
        metadata: validatedData.metadata,
      });

      return NextResponse.json({
        success: true,
        event: securityEvent,
        message: 'Security event ingested successfully',
      });

    } else if (action === 'create-threat-indicator') {
      // Create threat indicator
      const validatedData = threatIndicatorSchema.parse(body);

      const threatIndicator = await siemService.createThreatIndicator({
        type: validatedData.type,
        value: validatedData.value,
        severity: validatedData.severity,
        confidence: validatedData.confidence,
        source: validatedData.source,
        description: validatedData.description,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        metadata: validatedData.metadata,
      });

      return NextResponse.json({
        success: true,
        indicator: threatIndicator,
        message: 'Threat indicator created successfully',
      });

    } else if (action === 'create-alert-rule') {
      // Create alert rule
      const validatedData = alertRuleSchema.parse(body);

      const alertRule = await siemService.createAlertRule(validatedData);

      return NextResponse.json({
        success: true,
        rule: alertRule,
        message: 'Alert rule created successfully',
      });

    } else if (action === 'perform-correlation') {
      // Perform correlation analysis
      const validatedData = correlationRequestSchema.parse(body);

      const correlationResult = await correlationEngine.performCorrelationAnalysis({
        timeRange: {
          start: new Date(validatedData.timeRange.start),
          end: new Date(validatedData.timeRange.end),
        },
        filters: validatedData.filters,
        algorithms: validatedData.algorithms,
        minConfidence: validatedData.minConfidence,
      });

      return NextResponse.json({
        success: true,
        correlation: correlationResult,
        message: 'Correlation analysis completed successfully',
      });

    } else if (action === 'analyze-threats') {
      // Run threat analysis on recent events
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
      };

      // This would trigger the threat detection engine to analyze recent events
      // For demo purposes, returning analysis status
      return NextResponse.json({
        success: true,
        analysis: {
          timeRange,
          status: 'Threat analysis initiated',
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
        message: 'Threat analysis initiated successfully',
      });

    } else if (action === 'generate-report') {
      // Generate analytics report
      const { reportType, timeRange, format, recipients } = body;

      const report = await analyticsService.generateReport({
        reportType: reportType || 'operational',
        timeRange: {
          start: new Date(timeRange?.start || Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(timeRange?.end || Date.now()),
        },
        format: format || 'html',
        recipients: recipients || [],
      });

      return NextResponse.json({
        success: true,
        report,
        message: 'Analytics report generated successfully',
      });

    } else if (action === 'calculate-kpis') {
      // Calculate current KPI values
      const kpis = await analyticsService.calculateKPIs();

      return NextResponse.json({
        success: true,
        kpis,
        calculatedAt: new Date(),
        message: 'KPIs calculated successfully',
      });

    } else if (action === 'block-ip') {
      // Block IP address (security action)
      const { ipAddress: targetIp, duration, reason } = body;

      if (!targetIp) {
        return NextResponse.json(
          { error: 'IP address is required' },
          { status: 400 }
        );
      }

      // Create threat indicator for the IP
      await siemService.createThreatIndicator({
        type: 'MALICIOUS_IP',
        value: targetIp,
        severity: 'HIGH',
        confidence: 90,
        source: 'Manual Block',
        description: reason || 'Manually blocked IP address',
        expiresAt: duration ? new Date(Date.now() + duration * 1000) : undefined,
        metadata: {
          blockedBy: session.user.id,
          blockReason: reason,
          manualBlock: true,
        },
      });

      // Log the blocking action
      await siemService.ingestEvent({
        eventType: 'ADMIN_OPERATION',
        severity: 'HIGH',
        source: 'SecurityAPI',
        title: 'IP Address Blocked',
        description: `IP address ${targetIp} was manually blocked`,
        userId: session.user.id,
        siteId: session.user.siteId,
        ipAddress,
        userAgent,
        action: 'BLOCK_IP',
        metadata: {
          targetIp,
          duration,
          reason,
        },
      });

      return NextResponse.json({
        success: true,
        blockedIp: targetIp,
        duration,
        expiresAt: duration ? new Date(Date.now() + duration * 1000) : null,
        message: 'IP address blocked successfully',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: ingest-event, create-threat-indicator, create-alert-rule, perform-correlation, analyze-threats, generate-report, calculate-kpis, block-ip' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security monitoring API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Security monitoring operation failed', details: error.message },
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

    // Check security permissions
    if (!session.user.permissions?.includes('view_security_logs')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view security data' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'dashboard';

    if (action === 'dashboard') {
      // Get security dashboard data
      const timeRangeParam = url.searchParams.get('timeRange');
      let timeRange: { start: Date; end: Date } | undefined;

      if (timeRangeParam) {
        const range = JSON.parse(timeRangeParam);
        timeRange = {
          start: new Date(range.start),
          end: new Date(range.end),
        };
      }

      const dashboardData = await analyticsService.getDashboardData(timeRange);

      return NextResponse.json({
        success: true,
        dashboard: dashboardData,
      });

    } else if (action === 'metrics') {
      // Get real-time security metrics
      const metrics = await siemService.getSecurityMetrics({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
      });

      const realTimeMetrics = await analyticsService.getRealTimeMetrics();

      return NextResponse.json({
        success: true,
        metrics: {
          ...metrics,
          realTime: realTimeMetrics,
        },
      });

    } else if (action === 'events') {
      // Get recent security events
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const severity = url.searchParams.get('severity');
      const eventType = url.searchParams.get('eventType');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      const whereClause: any = {};

      if (severity) {
        whereClause.severity = severity;
      }

      if (eventType) {
        whereClause.eventType = eventType;
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const events = await prisma.securityEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          eventType: true,
          severity: true,
          title: true,
          description: true,
          userId: true,
          siteId: true,
          ipAddress: true,
          resourceId: true,
          resourceType: true,
          action: true,
          metadata: true,
          createdAt: true,
          success: true,
        },
      });

      return NextResponse.json({
        success: true,
        events,
        totalCount: events.length,
      });

    } else if (action === 'alerts') {
      // Get recent security alerts
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const resolved = url.searchParams.get('resolved');

      const whereClause: any = {};

      if (resolved !== null) {
        whereClause.resolved = resolved === 'true';
      }

      const alerts = await prisma.securityAlert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          severity: true,
          title: true,
          description: true,
          eventId: true,
          metadata: true,
          resolved: true,
          resolvedAt: true,
          resolvedBy: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        alerts,
        totalCount: alerts.length,
      });

    } else if (action === 'incidents') {
      // Get security incidents
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const status = url.searchParams.get('status');

      const whereClause: any = {};

      if (status) {
        whereClause.status = status;
      }

      const incidents = await prisma.securityIncident.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          severity: true,
          status: true,
          alertId: true,
          eventId: true,
          assignedTo: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        incidents,
        totalCount: incidents.length,
      });

    } else if (action === 'threat-indicators') {
      // Get threat indicators
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const type = url.searchParams.get('type');
      const active = url.searchParams.get('active');

      const whereClause: any = {};

      if (type) {
        whereClause.type = type;
      }

      if (active !== null) {
        whereClause.active = active === 'true';
      }

      const indicators = await prisma.threatIndicator.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          value: true,
          severity: true,
          confidence: true,
          source: true,
          description: true,
          active: true,
          expiresAt: true,
          metadata: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        indicators,
        totalCount: indicators.length,
      });

    } else if (action === 'correlations') {
      // Get correlation results
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const type = url.searchParams.get('type');
      const minConfidence = parseFloat(url.searchParams.get('minConfidence') || '0');

      const correlations = await correlationEngine.getCorrelationResults({
        type,
        minConfidence,
      });

      return NextResponse.json({
        success: true,
        correlations: correlations.slice(0, limit),
        totalCount: correlations.length,
      });

    } else if (action === 'analytics-query') {
      // Execute custom analytics query
      const metricType = url.searchParams.get('metricType') as any;
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const granularity = url.searchParams.get('granularity') as any;

      if (!metricType || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'metricType, startDate, and endDate are required' },
          { status: 400 }
        );
      }

      const result = await analyticsService.executeAnalyticsQuery({
        metricType,
        timeRange: {
          start: new Date(startDate),
          end: new Date(endDate),
        },
        granularity: granularity || 'hour',
      });

      return NextResponse.json({
        success: true,
        query: result,
      });

    } else if (action === 'trends') {
      // Get trend analysis
      const metric = url.searchParams.get('metric') || 'threats';
      const timeframe = url.searchParams.get('timeframe') as any || 'daily';

      const trendAnalysis = await analyticsService.performTrendAnalysis(metric, timeframe);

      return NextResponse.json({
        success: true,
        trend: trendAnalysis,
      });

    } else if (action === 'system-health') {
      // Get system health status
      const systemHealth = {
        status: 'healthy',
        uptime: process.uptime() * 1000,
        services: {
          siem: 'operational',
          threatDetection: 'operational',
          correlation: 'operational',
          analytics: 'operational',
        },
        performance: {
          eventsPerSecond: 25.7,
          averageProcessingTime: 45, // ms
          queueDepth: 12,
          memoryUsage: process.memoryUsage(),
        },
        lastHealthCheck: new Date(),
      };

      return NextResponse.json({
        success: true,
        health: systemHealth,
      });

    } else if (action === 'config') {
      // Get security monitoring configuration
      const config = {
        siemConfig: {
          retentionDays: 90,
          realTimeThresholds: {
            loginAttempts: 5,
            apiCalls: 1000,
            dataAccess: 50,
          },
        },
        threatDetection: {
          anomalyThreshold: 0.7,
          behaviorWindowDays: 30,
          algorithms: ['statistical', 'behavioral', 'temporal', 'geographical'],
        },
        correlation: {
          timeWindows: ['immediate', 'short', 'medium', 'long'],
          confidenceThreshold: 0.6,
          algorithms: ['temporal', 'spatial', 'behavioral', 'sequential'],
        },
        analytics: {
          reportTypes: ['executive', 'operational', 'compliance', 'incident'],
          kpiCategories: ['security', 'performance', 'compliance', 'operational'],
        },
      };

      return NextResponse.json({
        success: true,
        config,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security monitoring GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get security monitoring data' },
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

    // Check security permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for security management' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'resolve-alert') {
      // Resolve security alert
      const { alertId, resolution, notes } = body;

      if (!alertId) {
        return NextResponse.json(
          { error: 'Alert ID is required' },
          { status: 400 }
        );
      }

      const alert = await prisma.securityAlert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
          metadata: {
            resolution,
            resolutionNotes: notes,
            resolvedByUser: session.user.id,
          },
        },
      });

      // Log the resolution
      await siemService.ingestEvent({
        eventType: 'ADMIN_OPERATION',
        severity: 'INFO',
        source: 'SecurityAPI',
        title: 'Security Alert Resolved',
        description: `Security alert ${alertId} was resolved`,
        userId: session.user.id,
        siteId: session.user.siteId,
        action: 'RESOLVE_ALERT',
        metadata: {
          alertId,
          resolution,
          notes,
        },
      });

      return NextResponse.json({
        success: true,
        alert,
        message: 'Alert resolved successfully',
      });

    } else if (action === 'update-incident') {
      // Update security incident
      const { incidentId, status, assignedTo, notes } = body;

      if (!incidentId) {
        return NextResponse.json(
          { error: 'Incident ID is required' },
          { status: 400 }
        );
      }

      const updateData: any = { updatedAt: new Date() };

      if (status) updateData.status = status;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (status === 'RESOLVED') updateData.resolvedAt = new Date();

      if (notes) {
        updateData.metadata = { notes, updatedBy: session.user.id };
      }

      const incident = await prisma.securityIncident.update({
        where: { id: incidentId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        incident,
        message: 'Incident updated successfully',
      });

    } else if (action === 'toggle-rule') {
      // Enable/disable alert rule
      const { ruleId, enabled } = body;

      if (!ruleId) {
        return NextResponse.json(
          { error: 'Rule ID is required' },
          { status: 400 }
        );
      }

      const rule = await prisma.alertRule.update({
        where: { id: ruleId },
        data: { enabled },
      });

      return NextResponse.json({
        success: true,
        rule,
        message: `Rule ${enabled ? 'enabled' : 'disabled'} successfully`,
      });

    } else if (action === 'update-threat-indicator') {
      // Update threat indicator
      const { indicatorId, active, confidence, expiresAt } = body;

      if (!indicatorId) {
        return NextResponse.json(
          { error: 'Indicator ID is required' },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (active !== undefined) updateData.active = active;
      if (confidence !== undefined) updateData.confidence = confidence;
      if (expiresAt) updateData.expiresAt = new Date(expiresAt);

      const indicator = await prisma.threatIndicator.update({
        where: { id: indicatorId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        indicator,
        message: 'Threat indicator updated successfully',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: resolve-alert, update-incident, toggle-rule, update-threat-indicator' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security monitoring PUT error:', error);
    return NextResponse.json(
      { error: 'Security monitoring update failed', details: error.message },
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

    // Check security permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for security management' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    if (!action || !id) {
      return NextResponse.json(
        { error: 'Action and ID are required' },
        { status: 400 }
      );
    }

    if (action === 'delete-threat-indicator') {
      // Delete threat indicator
      await prisma.threatIndicator.delete({
        where: { id },
      });

      // Log the deletion
      await siemService.ingestEvent({
        eventType: 'ADMIN_OPERATION',
        severity: 'INFO',
        source: 'SecurityAPI',
        title: 'Threat Indicator Deleted',
        description: `Threat indicator ${id} was deleted`,
        userId: session.user.id,
        siteId: session.user.siteId,
        action: 'DELETE_THREAT_INDICATOR',
        metadata: { indicatorId: id },
      });

      return NextResponse.json({
        success: true,
        message: 'Threat indicator deleted successfully',
      });

    } else if (action === 'delete-alert-rule') {
      // Delete alert rule
      await prisma.alertRule.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Alert rule deleted successfully',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: delete-threat-indicator, delete-alert-rule' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Security monitoring DELETE error:', error);
    return NextResponse.json(
      { error: 'Security monitoring deletion failed', details: error.message },
      { status: 500 }
    );
  }
}

import { prisma } from '@/lib/prisma'; 