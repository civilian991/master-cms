import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { incidentResponseService } from '@/lib/security/incident-response/incident-service';
import { postIncidentAnalysisService } from '@/lib/security/incident-response/post-incident-service';
import { z } from 'zod';

const incidentCreationSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  severity: z.enum(['P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW']),
  category: z.enum(['SECURITY_BREACH', 'DATA_LEAK', 'SYSTEM_OUTAGE', 'MALWARE_INFECTION', 'PHISHING_ATTACK', 'COMPLIANCE_VIOLATION', 'OTHER']),
  affectedSystems: z.array(z.string()).optional(),
  initialEvidence: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const incidentUpdateSchema = z.object({
  incidentId: z.string(),
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESPONDING', 'MONITORING', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  progress: z.string().optional(),
  resolution: z.string().optional(),
  lessonsLearned: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const incidentActionSchema = z.object({
  incidentId: z.string(),
  actionType: z.string(),
  assignedTo: z.string().optional(),
  automated: z.boolean().default(false),
});

const incidentCommunicationSchema = z.object({
  incidentId: z.string(),
  type: z.enum(['STATUS_UPDATE', 'ESCALATION', 'RESOLUTION', 'STAKEHOLDER_NOTIFICATION']),
  message: z.string(),
  recipients: z.array(z.string()),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  channels: z.array(z.enum(['email', 'sms', 'slack', 'teams'])).default(['email']),
});

const postIncidentReviewSchema = z.object({
  incidentId: z.string(),
  reviewType: z.enum(['PRELIMINARY', 'FULL', 'EXTENDED']),
  scheduledDate: z.string(),
  facilitator: z.string(),
  participants: z.array(z.object({
    userId: z.string(),
    role: z.string(),
    participation: z.enum(['REQUIRED', 'OPTIONAL', 'OBSERVER']),
  })),
  objectives: z.array(z.string()),
  framework: z.enum(['ROOT_CAUSE', 'TIMELINE', 'PROCESS', 'COMPREHENSIVE']),
});

const lessonsLearnedSchema = z.object({
  incidentId: z.string(),
  category: z.enum(['PREVENTION', 'DETECTION', 'RESPONSE', 'RECOVERY', 'COMMUNICATION', 'TRAINING', 'TECHNOLOGY', 'PROCESS']),
  lesson: z.string(),
  impact: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  actionable: z.boolean(),
  recommendation: z.string(),
  implementationEffort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  timeframe: z.enum(['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']),
  owner: z.string(),
  cost: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
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

    // Check incident response permissions
    if (!session.user.permissions?.includes('manage_incidents')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for incident management' },
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

    if (action === 'create-incident') {
      // Create new security incident
      const validatedData = incidentCreationSchema.parse(body);

      const incident = await incidentResponseService.createIncident({
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        category: validatedData.category,
        source: 'Manual Report',
        affectedSystems: validatedData.affectedSystems,
        initialEvidence: validatedData.initialEvidence,
        reportedBy: session.user.id,
        siteId: session.user.siteId!,
        metadata: {
          ...validatedData.metadata,
          reportedVia: 'API',
          reporterIP: ipAddress,
          reporterUserAgent: userAgent,
        },
      });

      return NextResponse.json({
        success: true,
        incident,
        message: 'Security incident created successfully',
      });

    } else if (action === 'update-incident') {
      // Update existing incident
      const validatedData = incidentUpdateSchema.parse(body);

      const incident = await incidentResponseService.updateIncident(
        validatedData,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        incident,
        message: 'Incident updated successfully',
      });

    } else if (action === 'add-timeline-entry') {
      // Add timeline entry to incident
      const { incidentId, description, metadata } = body;

      if (!incidentId || !description) {
        return NextResponse.json(
          { error: 'Incident ID and description are required' },
          { status: 400 }
        );
      }

      const timelineEntry = await incidentResponseService.addTimelineEntry(incidentId, {
        actor: session.user.id,
        action: 'MANUAL_UPDATE',
        description,
        metadata,
      });

      return NextResponse.json({
        success: true,
        timelineEntry,
        message: 'Timeline entry added successfully',
      });

    } else if (action === 'execute-action') {
      // Execute incident action
      const validatedData = incidentActionSchema.parse(body);

      const incidentAction = await incidentResponseService.executeIncidentAction(
        validatedData.incidentId,
        validatedData.actionType,
        validatedData.assignedTo || session.user.id,
        validatedData.automated
      );

      return NextResponse.json({
        success: true,
        action: incidentAction,
        message: 'Incident action executed successfully',
      });

    } else if (action === 'send-communication') {
      // Send incident communication
      const validatedData = incidentCommunicationSchema.parse(body);

      const communication = await incidentResponseService.sendIncidentCommunication(validatedData);

      return NextResponse.json({
        success: true,
        communication,
        message: 'Communication sent successfully',
      });

    } else if (action === 'schedule-review') {
      // Schedule post-incident review
      const validatedData = postIncidentReviewSchema.parse(body);

      const review = await postIncidentAnalysisService.schedulePostIncidentReview({
        incidentId: validatedData.incidentId,
        reviewType: validatedData.reviewType,
        scheduledDate: new Date(validatedData.scheduledDate),
        facilitator: validatedData.facilitator,
        participants: validatedData.participants,
        objectives: validatedData.objectives,
        framework: validatedData.framework,
      });

      return NextResponse.json({
        success: true,
        review,
        message: 'Post-incident review scheduled successfully',
      });

    } else if (action === 'conduct-review') {
      // Conduct post-incident review
      const { reviewId } = body;

      if (!reviewId) {
        return NextResponse.json(
          { error: 'Review ID is required' },
          { status: 400 }
        );
      }

      const reviewResults = await postIncidentAnalysisService.conductPostIncidentReview(
        reviewId,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        results: reviewResults,
        message: 'Post-incident review conducted successfully',
      });

    } else if (action === 'add-lesson-learned') {
      // Add lesson learned
      const validatedData = lessonsLearnedSchema.parse(body);

      const lesson = await postIncidentAnalysisService.createLessonLearned(validatedData);

      return NextResponse.json({
        success: true,
        lesson,
        message: 'Lesson learned added successfully',
      });

    } else if (action === 'update-improvement-action') {
      // Update improvement action progress
      const { actionId, status, progress, update, actualEffort, actualCost } = body;

      if (!actionId) {
        return NextResponse.json(
          { error: 'Action ID is required' },
          { status: 400 }
        );
      }

      const improvementAction = await postIncidentAnalysisService.updateImprovementAction(
        actionId,
        {
          status,
          progress,
          update,
          actualEffort,
          actualCost,
          completedDate: status === 'COMPLETED' ? new Date() : undefined,
        },
        session.user.id
      );

      return NextResponse.json({
        success: true,
        action: improvementAction,
        message: 'Improvement action updated successfully',
      });

    } else if (action === 'escalate-incident') {
      // Manually escalate incident
      const { incidentId, reason } = body;

      if (!incidentId) {
        return NextResponse.json(
          { error: 'Incident ID is required' },
          { status: 400 }
        );
      }

      // Add escalation timeline entry
      await incidentResponseService.addTimelineEntry(incidentId, {
        actor: session.user.id,
        action: 'MANUAL_ESCALATION',
        description: `Incident manually escalated. Reason: ${reason || 'No reason provided'}`,
        metadata: {
          escalatedBy: session.user.id,
          escalationReason: reason,
          escalationType: 'MANUAL',
        },
      });

      // Send escalation communication
      await incidentResponseService.sendIncidentCommunication({
        incidentId,
        type: 'ESCALATION',
        message: `Incident has been manually escalated by ${session.user.name || session.user.id}. Reason: ${reason || 'Critical situation requires immediate attention'}`,
        recipients: ['incident-commander', 'security-team', 'management'],
        priority: 'URGENT',
        channels: ['email', 'sms', 'slack'],
      });

      return NextResponse.json({
        success: true,
        message: 'Incident escalated successfully',
      });

    } else if (action === 'bulk-update-incidents') {
      // Bulk update multiple incidents
      const { incidentIds, updates } = body;

      if (!incidentIds || !Array.isArray(incidentIds) || incidentIds.length === 0) {
        return NextResponse.json(
          { error: 'Incident IDs array is required' },
          { status: 400 }
        );
      }

      const results = [];

      for (const incidentId of incidentIds) {
        try {
          const incident = await incidentResponseService.updateIncident(
            { incidentId, ...updates },
            session.user.id
          );
          results.push({ incidentId, success: true, incident });
        } catch (error) {
          results.push({ incidentId, success: false, error: error.message });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Bulk update completed. ${results.filter(r => r.success).length}/${incidentIds.length} incidents updated successfully`,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: create-incident, update-incident, add-timeline-entry, execute-action, send-communication, schedule-review, conduct-review, add-lesson-learned, update-improvement-action, escalate-incident, bulk-update-incidents' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Incident response API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Incident response operation failed', details: error.message },
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

    // Check view permissions
    if (!session.user.permissions?.includes('view_incidents')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view incidents' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list-incidents';

    if (action === 'list-incidents') {
      // Get incidents with filtering
      const status = url.searchParams.get('status');
      const severity = url.searchParams.get('severity');
      const category = url.searchParams.get('category');
      const assignedTo = url.searchParams.get('assignedTo');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      const filters: any = {
        siteId: session.user.siteId,
        limit,
      };

      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (category) filters.category = category;
      if (assignedTo) filters.assignedTo = assignedTo;

      if (startDate && endDate) {
        filters.timeRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      }

      const incidents = await incidentResponseService.getIncidents(filters);

      return NextResponse.json({
        success: true,
        incidents,
        totalCount: incidents.length,
      });

    } else if (action === 'get-incident') {
      // Get specific incident details
      const incidentId = url.searchParams.get('incidentId');

      if (!incidentId) {
        return NextResponse.json(
          { error: 'Incident ID is required' },
          { status: 400 }
        );
      }

      const incident = await incidentResponseService.getIncident(incidentId);

      if (!incident) {
        return NextResponse.json(
          { error: 'Incident not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        incident,
      });

    } else if (action === 'incident-dashboard') {
      // Get incident dashboard data
      const timeRange = url.searchParams.get('timeRange') || '7d'; // 7 days default
      
      let startDate: Date;
      const endDate = new Date();

      switch (timeRange) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
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
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      const incidents = await incidentResponseService.getIncidents({
        siteId: session.user.siteId,
        timeRange: { start: startDate, end: endDate },
      });

      // Calculate dashboard metrics
      const dashboard = {
        summary: {
          total: incidents.length,
          open: incidents.filter(i => !['RESOLVED', 'CLOSED'].includes(i.status)).length,
          critical: incidents.filter(i => i.severity === 'P1_CRITICAL').length,
          high: incidents.filter(i => i.severity === 'P2_HIGH').length,
          resolved: incidents.filter(i => i.status === 'RESOLVED').length,
        },
        byStatus: this.groupBy(incidents, 'status'),
        bySeverity: this.groupBy(incidents, 'severity'),
        byCategory: this.groupBy(incidents, 'category'),
        recentIncidents: incidents.slice(0, 10),
        averageResponseTime: this.calculateAverageResponseTime(incidents),
        averageResolutionTime: this.calculateAverageResolutionTime(incidents),
        trends: await this.calculateIncidentTrends(incidents, timeRange),
        topAssignees: this.getTopAssignees(incidents),
      };

      return NextResponse.json({
        success: true,
        dashboard,
      });

    } else if (action === 'improvement-actions') {
      // Get improvement actions dashboard
      const status = url.searchParams.get('status');
      const priority = url.searchParams.get('priority');
      const owner = url.searchParams.get('owner');
      const category = url.searchParams.get('category');

      const filters: any = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (owner) filters.owner = owner;
      if (category) filters.category = category;

      const dashboard = await postIncidentAnalysisService.getImprovementActionsDashboard(filters);

      return NextResponse.json({
        success: true,
        dashboard,
      });

    } else if (action === 'lessons-learned-report') {
      // Generate lessons learned report
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const category = url.searchParams.get('category');
      const impact = url.searchParams.get('impact');

      const filters: any = {};

      if (startDate && endDate) {
        filters.timeRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      }

      if (category) filters.category = category;
      if (impact) filters.impact = impact;

      const report = await postIncidentAnalysisService.generateLessonsLearnedReport(filters);

      return NextResponse.json({
        success: true,
        report,
      });

    } else if (action === 'incident-metrics') {
      // Get detailed incident metrics
      const timeRange = url.searchParams.get('timeRange') || '30d';
      
      const endDate = new Date();
      let startDate: Date;

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
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const incidents = await incidentResponseService.getIncidents({
        siteId: session.user.siteId,
        timeRange: { start: startDate, end: endDate },
      });

      const metrics = {
        timeRange: { start: startDate, end: endDate },
        totals: {
          incidents: incidents.length,
          resolved: incidents.filter(i => i.status === 'RESOLVED').length,
          critical: incidents.filter(i => i.severity === 'P1_CRITICAL').length,
          highPriority: incidents.filter(i => ['P1_CRITICAL', 'P2_HIGH'].includes(i.severity)).length,
        },
        averageTimes: {
          responseTime: this.calculateAverageResponseTime(incidents),
          resolutionTime: this.calculateAverageResolutionTime(incidents),
        },
        distributions: {
          bySeverity: this.groupBy(incidents, 'severity'),
          byCategory: this.groupBy(incidents, 'category'),
          byStatus: this.groupBy(incidents, 'status'),
        },
        trends: {
          daily: await this.calculateDailyTrends(incidents),
          weekly: await this.calculateWeeklyTrends(incidents),
          monthly: await this.calculateMonthlyTrends(incidents),
        },
        performance: {
          mttr: this.calculateMTTR(incidents), // Mean Time To Resolution
          mtbf: this.calculateMTBF(incidents), // Mean Time Between Failures
          slaMet: this.calculateSLACompliance(incidents),
        },
      };

      return NextResponse.json({
        success: true,
        metrics,
      });

    } else if (action === 'incident-templates') {
      // Get incident response templates and playbooks
      const templates = {
        severityLevels: [
          { value: 'P1_CRITICAL', label: 'P1 - Critical', description: 'System down, major security breach, data loss' },
          { value: 'P2_HIGH', label: 'P2 - High', description: 'Major functionality impaired, security threat detected' },
          { value: 'P3_MEDIUM', label: 'P3 - Medium', description: 'Minor functionality impaired, potential security issue' },
          { value: 'P4_LOW', label: 'P4 - Low', description: 'Minor issues, informational security events' },
        ],
        categories: [
          { value: 'SECURITY_BREACH', label: 'Security Breach', description: 'Unauthorized access or system compromise' },
          { value: 'DATA_LEAK', label: 'Data Leak', description: 'Unauthorized disclosure of sensitive data' },
          { value: 'SYSTEM_OUTAGE', label: 'System Outage', description: 'Service unavailability or major functionality loss' },
          { value: 'MALWARE_INFECTION', label: 'Malware Infection', description: 'Malicious software detected or suspected' },
          { value: 'PHISHING_ATTACK', label: 'Phishing Attack', description: 'Social engineering or email-based attack' },
          { value: 'COMPLIANCE_VIOLATION', label: 'Compliance Violation', description: 'Regulatory or policy violation' },
          { value: 'OTHER', label: 'Other', description: 'Other security-related incident' },
        ],
        actionTypes: [
          'isolate-systems',
          'block-ip',
          'quarantine-system',
          'collect-evidence',
          'notify-stakeholders',
          'update-signatures',
          'scan-network',
          'reset-passwords',
          'revoke-certificates',
          'backup-systems',
        ],
        communicationTypes: [
          { value: 'STATUS_UPDATE', label: 'Status Update' },
          { value: 'ESCALATION', label: 'Escalation' },
          { value: 'RESOLUTION', label: 'Resolution' },
          { value: 'STAKEHOLDER_NOTIFICATION', label: 'Stakeholder Notification' },
        ],
      };

      return NextResponse.json({
        success: true,
        templates,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Incident response GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get incident response data' },
      { status: 500 }
    );
  }
}

// Helper methods for calculations
function groupBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = item[key] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function calculateAverageResponseTime(incidents: any[]): number {
  const incidentsWithResponseTime = incidents.filter(i => i.responseTime);
  if (incidentsWithResponseTime.length === 0) return 0;
  
  const total = incidentsWithResponseTime.reduce((sum, i) => sum + i.responseTime, 0);
  return Math.round(total / incidentsWithResponseTime.length);
}

function calculateAverageResolutionTime(incidents: any[]): number {
  const resolvedIncidents = incidents.filter(i => i.resolutionTime);
  if (resolvedIncidents.length === 0) return 0;
  
  const total = resolvedIncidents.reduce((sum, i) => sum + i.resolutionTime, 0);
  return Math.round(total / resolvedIncidents.length);
}

function calculateIncidentTrends(incidents: any[], timeRange: string): any[] {
  // Implementation would calculate trends based on time range
  return [];
}

function getTopAssignees(incidents: any[]): any[] {
  const assigneeCounts = groupBy(incidents.filter(i => i.assignedTo), 'assignedTo');
  return Object.entries(assigneeCounts)
    .map(([assignee, count]) => ({ assignee, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculateDailyTrends(incidents: any[]): any[] {
  // Implementation would calculate daily trends
  return [];
}

function calculateWeeklyTrends(incidents: any[]): any[] {
  // Implementation would calculate weekly trends
  return [];
}

function calculateMonthlyTrends(incidents: any[]): any[] {
  // Implementation would calculate monthly trends
  return [];
}

function calculateMTTR(incidents: any[]): number {
  // Mean Time To Resolution
  return calculateAverageResolutionTime(incidents);
}

function calculateMTBF(incidents: any[]): number {
  // Mean Time Between Failures - would need more sophisticated calculation
  return 0;
}

function calculateSLACompliance(incidents: any[]): number {
  // SLA compliance percentage - would need SLA definitions
  return 0;
}

import { prisma } from '@/lib/prisma'; 