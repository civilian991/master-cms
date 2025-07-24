import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas for reporting
export const reportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(), // scheduled, on-demand, automated
  template: z.record(z.any()),
  parameters: z.record(z.any()).optional(),
  format: z.string().default("pdf"), // pdf, excel, csv, json
  isActive: z.boolean().default(true),
  schedule: z.string().optional(), // cron expression
  recipients: z.record(z.any()),
  deliveryMethod: z.string().default("email"), // email, webhook, api
  dashboardId: z.string(),
});

export const reportExecutionSchema = z.object({
  reportId: z.string(),
  parameters: z.record(z.any()).optional(),
  format: z.string().default("pdf"),
  recipients: z.record(z.any()).optional(),
  priority: z.string().default("normal"), // low, normal, high, urgent
});

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  // Report Management
  async createReport(data: z.infer<typeof reportSchema>) {
    const validatedData = reportSchema.parse(data);
    
    return await prisma.analyticsReport.create({
      data: validatedData,
      include: {
        dashboard: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async getReports(dashboardId?: string, type?: string, isActive?: boolean) {
    const where: any = {};
    if (dashboardId) where.dashboardId = dashboardId;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.analyticsReport.findMany({
      where,
      include: {
        dashboard: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReport(id: string) {
    return await prisma.analyticsReport.findUnique({
      where: { id },
      include: {
        dashboard: true,
        executions: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });
  }

  async updateReport(id: string, data: Partial<z.infer<typeof reportSchema>>) {
    return await prisma.analyticsReport.update({
      where: { id },
      data,
      include: {
        dashboard: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async deleteReport(id: string) {
    return await prisma.analyticsReport.delete({
      where: { id },
    });
  }

  // Report Execution
  async executeReport(data: z.infer<typeof reportExecutionSchema>) {
    const validatedData = reportExecutionSchema.parse(data);
    
    const report = await this.getReport(validatedData.reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Create execution record
    const execution = await prisma.reportExecution.create({
      data: {
        reportId: validatedData.reportId,
        status: 'running',
        startedAt: new Date(),
        format: validatedData.format,
        recipients: validatedData.recipients || report.recipients,
      },
    });

    try {
      // Generate report content
      const reportContent = await this.generateReportContent(report, validatedData.parameters);
      
      // Convert to requested format
      const formattedContent = await this.formatReport(reportContent, validatedData.format);
      
      // Save file
      const filePath = await this.saveReportFile(formattedContent, validatedData.format, execution.id);
      
      // Update execution with success
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime(),
          filePath,
          fileSize: formattedContent.length,
          url: `/api/reports/${execution.id}/download`,
        },
      });

      // Deliver report
      await this.deliverReport(execution.id, report, validatedData.recipients || report.recipients);

      return { success: true, executionId: execution.id, filePath };
    } catch (error) {
      // Update execution with failure
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  async getReportExecutions(reportId?: string, status?: string, limit?: number) {
    const where: any = {};
    if (reportId) where.reportId = reportId;
    if (status) where.status = status;

    return await prisma.reportExecution.findMany({
      where,
      include: {
        report: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit || 50,
    });
  }

  async getReportExecution(id: string) {
    return await prisma.reportExecution.findUnique({
      where: { id },
      include: {
        report: true,
      },
    });
  }

  // Report Generation
  private async generateReportContent(report: any, parameters?: any) {
    const template = report.template;
    const dashboard = report.dashboard;
    
    // Get dashboard data
    const dashboardData = await this.getDashboardData(dashboard.id, parameters);
    
    // Apply template
    const content = {
      reportName: report.name,
      generatedAt: new Date().toISOString(),
      parameters: parameters || {},
      data: dashboardData,
      template: template,
    };

    return content;
  }

  private async getDashboardData(dashboardId: string, parameters?: any) {
    // This would integrate with the Business Intelligence service
    // to get the actual dashboard data
    const timeRange = parameters?.timeRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };

    // Mock data for demonstration
    return {
      summary: {
        totalRevenue: 125000,
        totalVisitors: 45000,
        conversionRate: 0.15,
        averageOrderValue: 125,
      },
      trends: [
        { date: '2024-01-01', revenue: 12000, visitors: 4000 },
        { date: '2024-01-02', revenue: 13500, visitors: 4200 },
        { date: '2024-01-03', revenue: 11800, visitors: 3800 },
      ],
      metrics: [
        { name: 'Revenue Growth', value: 12.5, trend: 'up' },
        { name: 'Visitor Growth', value: 8.2, trend: 'up' },
        { name: 'Conversion Rate', value: 15.0, trend: 'stable' },
      ],
    };
  }

  private async formatReport(content: any, format: string) {
    switch (format.toLowerCase()) {
      case 'pdf':
        return await this.formatAsPDF(content);
      case 'excel':
        return await this.formatAsExcel(content);
      case 'csv':
        return await this.formatAsCSV(content);
      case 'json':
        return JSON.stringify(content, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async formatAsPDF(content: any) {
    // Mock PDF generation
    return `PDF Report: ${content.reportName}\nGenerated: ${content.generatedAt}\n\n${JSON.stringify(content.data, null, 2)}`;
  }

  private async formatAsExcel(content: any) {
    // Mock Excel generation
    return `Excel Report: ${content.reportName}\nGenerated: ${content.generatedAt}\n\n${JSON.stringify(content.data, null, 2)}`;
  }

  private async formatAsCSV(content: any) {
    // Mock CSV generation
    const data = content.data;
    let csv = 'Metric,Value,Trend\n';
    
    if (data.metrics) {
      data.metrics.forEach((metric: any) => {
        csv += `${metric.name},${metric.value},${metric.trend}\n`;
      });
    }
    
    return csv;
  }

  private async saveReportFile(content: string, format: string, executionId: string) {
    // Mock file saving
    const fileName = `report_${executionId}_${Date.now()}.${format}`;
    const filePath = `/reports/${fileName}`;
    
    // In a real implementation, this would save to a file system or cloud storage
    console.log(`Saving report to: ${filePath}`);
    
    return filePath;
  }

  private async deliverReport(executionId: string, report: any, recipients: any) {
    const execution = await this.getReportExecution(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    // Update delivery status
    await prisma.reportExecution.update({
      where: { id: executionId },
      data: {
        deliveredAt: new Date(),
        deliveryStatus: 'delivered',
      },
    });

    // Mock delivery based on method
    switch (report.deliveryMethod) {
      case 'email':
        await this.deliverViaEmail(execution, recipients);
        break;
      case 'webhook':
        await this.deliverViaWebhook(execution, recipients);
        break;
      case 'api':
        await this.deliverViaAPI(execution, recipients);
        break;
      default:
        throw new Error(`Unsupported delivery method: ${report.deliveryMethod}`);
    }
  }

  private async deliverViaEmail(execution: any, recipients: any) {
    // Mock email delivery
    console.log(`Sending report via email to: ${JSON.stringify(recipients)}`);
    
    // Update delivery tracking
    await prisma.reportExecution.update({
      where: { id: execution.id },
      data: {
        openedCount: 0,
        clickedCount: 0,
      },
    });
  }

  private async deliverViaWebhook(execution: any, recipients: any) {
    // Mock webhook delivery
    console.log(`Sending report via webhook to: ${JSON.stringify(recipients)}`);
  }

  private async deliverViaAPI(execution: any, recipients: any) {
    // Mock API delivery
    console.log(`Sending report via API to: ${JSON.stringify(recipients)}`);
  }

  // Scheduled Reports
  async processScheduledReports() {
    const scheduledReports = await this.getReports(undefined, 'scheduled', true);
    const now = new Date();

    for (const report of scheduledReports) {
      if (report.schedule && this.shouldExecuteReport(report.schedule, now)) {
        try {
          await this.executeReport({
            reportId: report.id,
            format: report.format,
            recipients: report.recipients,
          });
        } catch (error) {
          console.error(`Failed to execute scheduled report ${report.id}:`, error);
        }
      }
    }
  }

  private shouldExecuteReport(schedule: string, now: Date): boolean {
    // Simple cron-like schedule checking
    // In a real implementation, use a proper cron parser
    const parts = schedule.split(' ');
    if (parts.length !== 5) return false;

    const [minute, hour, day, month, weekday] = parts;
    
    // Check if current time matches schedule
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentWeekday = now.getDay();

    return (
      this.matchesCronPart(minute, currentMinute) &&
      this.matchesCronPart(hour, currentHour) &&
      this.matchesCronPart(day, currentDay) &&
      this.matchesCronPart(month, currentMonth) &&
      this.matchesCronPart(weekday, currentWeekday)
    );
  }

  private matchesCronPart(pattern: string, value: number): boolean {
    if (pattern === '*') return true;
    if (pattern.includes(',')) {
      return pattern.split(',').some(part => parseInt(part) === value);
    }
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(part => parseInt(part));
      return value >= start && value <= end;
    }
    if (pattern.includes('/')) {
      const [range, step] = pattern.split('/');
      const stepValue = parseInt(step);
      if (range === '*') {
        return value % stepValue === 0;
      }
      const rangeValue = parseInt(range);
      return value >= rangeValue && (value - rangeValue) % stepValue === 0;
    }
    return parseInt(pattern) === value;
  }

  // Report Analytics
  async getReportAnalytics(reportId?: string, timeRange?: { startDate: Date; endDate: Date }) {
    const where: any = {};
    if (reportId) where.reportId = reportId;
    if (timeRange) {
      where.startedAt = {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      };
    }

    const executions = await prisma.reportExecution.findMany({
      where,
      include: {
        report: true,
      },
    });

    const analytics = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      averageExecutionTime: executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length,
      totalDelivered: executions.filter(e => e.deliveryStatus === 'delivered').length,
      totalOpened: executions.reduce((sum, e) => sum + e.openedCount, 0),
      totalClicked: executions.reduce((sum, e) => sum + e.clickedCount, 0),
      averageOpenRate: 0,
      averageClickRate: 0,
    };

    if (analytics.totalDelivered > 0) {
      analytics.averageOpenRate = analytics.totalOpened / analytics.totalDelivered;
      analytics.averageClickRate = analytics.totalClicked / analytics.totalDelivered;
    }

    return analytics;
  }

  // Report Templates
  async getReportTemplates() {
    return [
      {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'High-level business metrics and KPIs',
        template: {
          sections: [
            { type: 'summary', title: 'Key Metrics' },
            { type: 'chart', title: 'Revenue Trends', chartType: 'line' },
            { type: 'chart', title: 'Traffic Overview', chartType: 'bar' },
            { type: 'table', title: 'Top Performers' },
          ],
        },
      },
      {
        id: 'operational-report',
        name: 'Operational Report',
        description: 'Detailed operational metrics and performance data',
        template: {
          sections: [
            { type: 'summary', title: 'Performance Overview' },
            { type: 'chart', title: 'System Performance', chartType: 'line' },
            { type: 'table', title: 'ETL Job Status' },
            { type: 'table', title: 'Data Quality Metrics' },
          ],
        },
      },
      {
        id: 'competitive-analysis',
        name: 'Competitive Analysis',
        description: 'Market analysis and competitive intelligence',
        template: {
          sections: [
            { type: 'summary', title: 'Market Overview' },
            { type: 'chart', title: 'Market Share', chartType: 'pie' },
            { type: 'table', title: 'Competitor Analysis' },
            { type: 'chart', title: 'Trend Analysis', chartType: 'line' },
          ],
        },
      },
    ];
  }
}

export const reportingService = ReportingService.getInstance(); 