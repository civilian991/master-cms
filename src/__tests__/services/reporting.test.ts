import { ReportingService } from '@/lib/services/reporting';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    analyticsReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reportExecution: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = ReportingService.getInstance();
    jest.clearAllMocks();
  });

  describe('Report Management', () => {
    it('should create a report', async () => {
      const reportData = {
        name: 'Monthly Executive Report',
        description: 'Monthly business performance report',
        type: 'scheduled',
        template: {
          sections: [
            { type: 'summary', title: 'Key Metrics' },
            { type: 'chart', title: 'Revenue Trends', chartType: 'line' },
          ],
        },
        parameters: { timeRange: 'monthly' },
        format: 'pdf',
        isActive: true,
        schedule: '0 9 1 * *', // First day of month at 9 AM
        recipients: { emails: ['executive@company.com'] },
        deliveryMethod: 'email',
        dashboardId: 'dashboard-1',
      };

      const expectedReport = {
        id: 'report-1',
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date(),
        dashboard: { id: 'dashboard-1', name: 'Executive Dashboard' },
        executions: [],
      };

      mockPrisma.analyticsReport.create = jest.fn().mockResolvedValue(expectedReport);

      const result = await service.createReport(reportData);

      expect(result).toEqual(expectedReport);
      expect(mockPrisma.analyticsReport.create).toHaveBeenCalledWith({
        data: reportData,
        include: {
          dashboard: true,
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 5,
          },
        },
      });
    });

    it('should get reports', async () => {
      const reports = [
        {
          id: 'report-1',
          name: 'Monthly Executive Report',
          type: 'scheduled',
          isActive: true,
          dashboardId: 'dashboard-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.analyticsReport.findMany = jest.fn().mockResolvedValue(reports);

      const result = await service.getReports('dashboard-1', 'scheduled', true);

      expect(result).toEqual(reports);
      expect(mockPrisma.analyticsReport.findMany).toHaveBeenCalledWith({
        where: { dashboardId: 'dashboard-1', type: 'scheduled', isActive: true },
        include: {
          dashboard: true,
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should get a specific report', async () => {
      const report = {
        id: 'report-1',
        name: 'Monthly Executive Report',
        type: 'scheduled',
        dashboardId: 'dashboard-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.analyticsReport.findUnique = jest.fn().mockResolvedValue(report);

      const result = await service.getReport('report-1');

      expect(result).toEqual(report);
      expect(mockPrisma.analyticsReport.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        include: {
          dashboard: true,
          executions: {
            orderBy: { startedAt: 'desc' },
          },
        },
      });
    });

    it('should update a report', async () => {
      const updateData = {
        name: 'Updated Monthly Report',
        isActive: false,
      };

      const updatedReport = {
        id: 'report-1',
        name: 'Updated Monthly Report',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.analyticsReport.update = jest.fn().mockResolvedValue(updatedReport);

      const result = await service.updateReport('report-1', updateData);

      expect(result).toEqual(updatedReport);
      expect(mockPrisma.analyticsReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: updateData,
        include: {
          dashboard: true,
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 5,
          },
        },
      });
    });

    it('should delete a report', async () => {
      mockPrisma.analyticsReport.delete = jest.fn().mockResolvedValue({});

      await service.deleteReport('report-1');

      expect(mockPrisma.analyticsReport.delete).toHaveBeenCalledWith({
        where: { id: 'report-1' },
      });
    });
  });

  describe('Report Execution', () => {
    it('should execute a report successfully', async () => {
      const report = {
        id: 'report-1',
        name: 'Monthly Executive Report',
        template: { sections: [] },
        dashboard: { id: 'dashboard-1' },
        recipients: { emails: ['executive@company.com'] },
        deliveryMethod: 'email',
      };

      const execution = {
        id: 'execution-1',
        reportId: 'report-1',
        status: 'running',
        startedAt: new Date(),
        format: 'pdf',
        recipients: { emails: ['executive@company.com'] },
      };

      mockPrisma.analyticsReport.findUnique = jest.fn().mockResolvedValue(report);
      mockPrisma.reportExecution.create = jest.fn().mockResolvedValue(execution);
      mockPrisma.reportExecution.update = jest.fn().mockResolvedValue({
        ...execution,
        status: 'completed',
        completedAt: new Date(),
        duration: 5000,
        filePath: '/reports/report_1.pdf',
        fileSize: 1024,
        url: '/api/reports/execution-1/download',
      });

      const result = await service.executeReport({
        reportId: 'report-1',
        format: 'pdf',
        recipients: { emails: ['executive@company.com'] },
      });

      expect(result.success).toBe(true);
      expect(result.executionId).toBe('execution-1');
      expect(result.filePath).toBe('/reports/report_1.pdf');
    });

    it('should handle report execution failure', async () => {
      const report = {
        id: 'report-1',
        name: 'Monthly Executive Report',
        template: { sections: [] },
        dashboard: { id: 'dashboard-1' },
        recipients: { emails: ['executive@company.com'] },
        deliveryMethod: 'email',
      };

      const execution = {
        id: 'execution-1',
        reportId: 'report-1',
        status: 'running',
        startedAt: new Date(),
        format: 'pdf',
        recipients: { emails: ['executive@company.com'] },
      };

      mockPrisma.analyticsReport.findUnique = jest.fn().mockResolvedValue(report);
      mockPrisma.reportExecution.create = jest.fn().mockResolvedValue(execution);
      mockPrisma.reportExecution.update = jest.fn().mockResolvedValue({
        ...execution,
        status: 'failed',
        completedAt: new Date(),
        duration: 1000,
        errorMessage: 'Template processing failed',
      });

      await expect(service.executeReport({
        reportId: 'report-1',
        format: 'pdf',
      })).rejects.toThrow('Template processing failed');

      expect(mockPrisma.reportExecution.update).toHaveBeenCalledWith({
        where: { id: 'execution-1' },
        data: {
          status: 'failed',
          completedAt: expect.any(Date),
          duration: expect.any(Number),
          errorMessage: 'Template processing failed',
        },
      });
    });

    it('should get report executions', async () => {
      const executions = [
        {
          id: 'execution-1',
          reportId: 'report-1',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 5000,
          filePath: '/reports/report_1.pdf',
          format: 'pdf',
          deliveryStatus: 'delivered',
          recipients: { emails: ['executive@company.com'] },
          openedCount: 1,
          clickedCount: 0,
        },
      ];

      mockPrisma.reportExecution.findMany = jest.fn().mockResolvedValue(executions);

      const result = await service.getReportExecutions('report-1', 'completed', 10);

      expect(result).toEqual(executions);
      expect(mockPrisma.reportExecution.findMany).toHaveBeenCalledWith({
        where: { reportId: 'report-1', status: 'completed' },
        include: {
          report: true,
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
    });

    it('should get a specific report execution', async () => {
      const execution = {
        id: 'execution-1',
        reportId: 'report-1',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 5000,
        filePath: '/reports/report_1.pdf',
        format: 'pdf',
        deliveryStatus: 'delivered',
        recipients: { emails: ['executive@company.com'] },
        openedCount: 1,
        clickedCount: 0,
      };

      mockPrisma.reportExecution.findUnique = jest.fn().mockResolvedValue(execution);

      const result = await service.getReportExecution('execution-1');

      expect(result).toEqual(execution);
      expect(mockPrisma.reportExecution.findUnique).toHaveBeenCalledWith({
        where: { id: 'execution-1' },
        include: {
          report: true,
        },
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate report content', async () => {
      const report = {
        id: 'report-1',
        name: 'Monthly Executive Report',
        template: {
          sections: [
            { type: 'summary', title: 'Key Metrics' },
            { type: 'chart', title: 'Revenue Trends', chartType: 'line' },
          ],
        },
        dashboard: { id: 'dashboard-1' },
      };

      const parameters = { timeRange: 'monthly' };

      // Mock the private method by accessing it through the service instance
      const serviceInstance = service as any;
      const result = await serviceInstance.generateReportContent(report, parameters);

      expect(result.reportName).toBe('Monthly Executive Report');
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(parameters);
      expect(result.template).toEqual(report.template);
      expect(result.data).toBeDefined();
    });

    it('should format report as PDF', async () => {
      const content = {
        reportName: 'Monthly Executive Report',
        generatedAt: '2024-01-01T00:00:00Z',
        data: { summary: { revenue: 100000 } },
      };

      const serviceInstance = service as any;
      const result = await serviceInstance.formatAsPDF(content);

      expect(result).toContain('PDF Report: Monthly Executive Report');
      expect(result).toContain('Generated: 2024-01-01T00:00:00Z');
    });

    it('should format report as Excel', async () => {
      const content = {
        reportName: 'Monthly Executive Report',
        generatedAt: '2024-01-01T00:00:00Z',
        data: { summary: { revenue: 100000 } },
      };

      const serviceInstance = service as any;
      const result = await serviceInstance.formatAsExcel(content);

      expect(result).toContain('Excel Report: Monthly Executive Report');
      expect(result).toContain('Generated: 2024-01-01T00:00:00Z');
    });

    it('should format report as CSV', async () => {
      const content = {
        reportName: 'Monthly Executive Report',
        generatedAt: '2024-01-01T00:00:00Z',
        data: {
          metrics: [
            { name: 'Revenue Growth', value: 12.5, trend: 'up' },
            { name: 'Visitor Growth', value: 8.2, trend: 'up' },
          ],
        },
      };

      const serviceInstance = service as any;
      const result = await serviceInstance.formatAsCSV(content);

      expect(result).toContain('Metric,Value,Trend');
      expect(result).toContain('Revenue Growth,12.5,up');
      expect(result).toContain('Visitor Growth,8.2,up');
    });

    it('should save report file', async () => {
      const content = 'PDF report content';
      const format = 'pdf';
      const executionId = 'execution-1';

      const serviceInstance = service as any;
      const result = await serviceInstance.saveReportFile(content, format, executionId);

      expect(result).toContain('report_execution-1_');
      expect(result).toContain('.pdf');
      expect(result).toContain('/reports/');
    });
  });

  describe('Report Delivery', () => {
    it('should deliver report via email', async () => {
      const execution = {
        id: 'execution-1',
        reportId: 'report-1',
        status: 'completed',
        filePath: '/reports/report_1.pdf',
      };

      const report = {
        id: 'report-1',
        name: 'Monthly Executive Report',
        deliveryMethod: 'email',
        recipients: { emails: ['executive@company.com'] },
      };

      const recipients = { emails: ['executive@company.com'] };

      mockPrisma.reportExecution.update = jest.fn().mockResolvedValue(execution);

      const serviceInstance = service as any;
      await serviceInstance.deliverViaEmail(execution, recipients);

      expect(mockPrisma.reportExecution.update).toHaveBeenCalledWith({
        where: { id: 'execution-1' },
        data: {
          openedCount: 0,
          clickedCount: 0,
        },
      });
    });

    it('should deliver report via webhook', async () => {
      const execution = {
        id: 'execution-1',
        reportId: 'report-1',
        status: 'completed',
        filePath: '/reports/report_1.pdf',
      };

      const recipients = { webhook: 'https://api.company.com/webhook' };

      const serviceInstance = service as any;
      await serviceInstance.deliverViaWebhook(execution, recipients);

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should deliver report via API', async () => {
      const execution = {
        id: 'execution-1',
        reportId: 'report-1',
        status: 'completed',
        filePath: '/reports/report_1.pdf',
      };

      const recipients = { api: 'https://api.company.com/reports' };

      const serviceInstance = service as any;
      await serviceInstance.deliverViaAPI(execution, recipients);

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Scheduled Reports', () => {
    it('should process scheduled reports', async () => {
      const scheduledReports = [
        {
          id: 'report-1',
          name: 'Daily Report',
          type: 'scheduled',
          isActive: true,
          schedule: '0 9 * * *', // Daily at 9 AM
        },
        {
          id: 'report-2',
          name: 'Weekly Report',
          type: 'scheduled',
          isActive: true,
          schedule: '0 9 * * 1', // Weekly on Monday at 9 AM
        },
      ];

      mockPrisma.analyticsReport.findMany = jest.fn().mockResolvedValue(scheduledReports);
      mockPrisma.analyticsReport.findUnique = jest.fn().mockResolvedValue(scheduledReports[0]);
      mockPrisma.reportExecution.create = jest.fn().mockResolvedValue({
        id: 'execution-1',
        reportId: 'report-1',
        status: 'running',
        startedAt: new Date(),
      });
      mockPrisma.reportExecution.update = jest.fn().mockResolvedValue({
        id: 'execution-1',
        status: 'completed',
        completedAt: new Date(),
      });

      // Mock the current time to match the schedule
      const mockDate = new Date('2024-01-01T09:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await service.processScheduledReports();

      expect(mockPrisma.analyticsReport.findMany).toHaveBeenCalledWith({
        where: { type: 'scheduled', isActive: true },
        include: {
          dashboard: true,
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Restore the original Date implementation
      jest.restoreAllMocks();
    });

    it('should check if report should execute', async () => {
      const serviceInstance = service as any;
      
      // Test daily schedule
      const dailySchedule = '0 9 * * *';
      const dailyTime = new Date('2024-01-01T09:00:00Z');
      expect(serviceInstance.shouldExecuteReport(dailySchedule, dailyTime)).toBe(true);

      // Test weekly schedule
      const weeklySchedule = '0 9 * * 1';
      const mondayTime = new Date('2024-01-01T09:00:00Z'); // Monday
      expect(serviceInstance.shouldExecuteReport(weeklySchedule, mondayTime)).toBe(true);

      // Test monthly schedule
      const monthlySchedule = '0 9 1 * *';
      const firstDayTime = new Date('2024-01-01T09:00:00Z'); // First day of month
      expect(serviceInstance.shouldExecuteReport(monthlySchedule, firstDayTime)).toBe(true);
    });

    it('should match cron parts correctly', async () => {
      const serviceInstance = service as any;
      
      // Test wildcard
      expect(serviceInstance.matchesCronPart('*', 5)).toBe(true);
      
      // Test specific value
      expect(serviceInstance.matchesCronPart('5', 5)).toBe(true);
      expect(serviceInstance.matchesCronPart('5', 6)).toBe(false);
      
      // Test range
      expect(serviceInstance.matchesCronPart('1-5', 3)).toBe(true);
      expect(serviceInstance.matchesCronPart('1-5', 6)).toBe(false);
      
      // Test list
      expect(serviceInstance.matchesCronPart('1,3,5', 3)).toBe(true);
      expect(serviceInstance.matchesCronPart('1,3,5', 2)).toBe(false);
      
      // Test step
      expect(serviceInstance.matchesCronPart('*/2', 4)).toBe(true);
      expect(serviceInstance.matchesCronPart('*/2', 5)).toBe(false);
    });
  });

  describe('Report Analytics', () => {
    it('should get report analytics', async () => {
      const executions = [
        {
          id: 'execution-1',
          reportId: 'report-1',
          status: 'completed',
          duration: 5000,
          deliveryStatus: 'delivered',
          openedCount: 1,
          clickedCount: 0,
        },
        {
          id: 'execution-2',
          reportId: 'report-1',
          status: 'failed',
          duration: 1000,
          deliveryStatus: 'failed',
          openedCount: 0,
          clickedCount: 0,
        },
        {
          id: 'execution-3',
          reportId: 'report-1',
          status: 'completed',
          duration: 3000,
          deliveryStatus: 'delivered',
          openedCount: 2,
          clickedCount: 1,
        },
      ];

      mockPrisma.reportExecution.findMany = jest.fn().mockResolvedValue(executions);

      const result = await service.getReportAnalytics('report-1');

      expect(result.totalExecutions).toBe(3);
      expect(result.successfulExecutions).toBe(2);
      expect(result.failedExecutions).toBe(1);
      expect(result.averageExecutionTime).toBe(3000);
      expect(result.totalDelivered).toBe(2);
      expect(result.totalOpened).toBe(3);
      expect(result.totalClicked).toBe(1);
      expect(result.averageOpenRate).toBe(1.5);
      expect(result.averageClickRate).toBe(0.5);
    });
  });

  describe('Report Templates', () => {
    it('should get report templates', async () => {
      const templates = await service.getReportTemplates();

      expect(templates).toHaveLength(3);
      expect(templates[0].id).toBe('executive-summary');
      expect(templates[0].name).toBe('Executive Summary');
      expect(templates[1].id).toBe('operational-report');
      expect(templates[1].name).toBe('Operational Report');
      expect(templates[2].id).toBe('competitive-analysis');
      expect(templates[2].name).toBe('Competitive Analysis');
    });
  });
}); 