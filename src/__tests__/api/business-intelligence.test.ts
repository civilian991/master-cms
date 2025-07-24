// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    headers: Map<string, string>;
    json: jest.Mock;

    constructor(url: string) {
      this.url = url;
      this.headers = new Map();
      this.json = jest.fn();
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '@/app/api/admin/business-intelligence/route';
import { businessIntelligenceService } from '@/lib/services/business-intelligence';

// Mock the business intelligence service
jest.mock('@/lib/services/business-intelligence', () => ({
  businessIntelligenceService: {
    getComprehensiveAnalytics: jest.fn(),
    getDataWarehouses: jest.fn(),
    getDataSources: jest.fn(),
    getETLJobs: jest.fn(),
    getDashboards: jest.fn(),
    getBusinessMetrics: jest.fn(),
    getBusinessAlerts: jest.fn(),
    getCompetitiveIntelligence: jest.fn(),
    getMarketData: jest.fn(),
    getPredictiveInsights: jest.fn(),
    getAnalyticsEngines: jest.fn(),
    checkDataQuality: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    createDataWarehouse: jest.fn(),
    createDataSource: jest.fn(),
    createETLJob: jest.fn(),
    createDashboard: jest.fn(),
    createBusinessMetric: jest.fn(),
    createCompetitiveIntelligence: jest.fn(),
    createMarketData: jest.fn(),
    createPredictiveInsight: jest.fn(),
    createAnalyticsEngine: jest.fn(),
    updateBusinessMetric: jest.fn(),
    updateCompetitiveData: jest.fn(),
    verifyInsight: jest.fn(),
    acknowledgeAlert: jest.fn(),
    resolveAlert: jest.fn(),
  },
}));

// Mock the auth middleware
jest.mock('@/lib/auth/middleware', () => ({
  getUserFromRequest: jest.fn(),
}));

const mockBusinessIntelligenceService = businessIntelligenceService as jest.Mocked<typeof businessIntelligenceService>;
const { getUserFromRequest } = require('@/lib/auth/middleware');

describe('Business Intelligence API Routes', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/admin/business-intelligence',
      headers: new Map(),
      json: jest.fn(),
    } as any;
  });

  describe('GET /api/admin/business-intelligence', () => {
    it('should return 401 for unauthorized requests', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for users without analytics permissions', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['content:read'],
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should get comprehensive analytics', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      const mockAnalytics = {
        trafficAnalytics: [],
        revenueAnalytics: [],
        summary: { totalRevenue: 100000 },
      };

      mockBusinessIntelligenceService.getComprehensiveAnalytics.mockResolvedValue(mockAnalytics);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/comprehensive-analytics?siteId=site-1&startDate=2024-01-01&endDate=2024-01-31';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analytics).toEqual(mockAnalytics);
      expect(mockBusinessIntelligenceService.getComprehensiveAnalytics).toHaveBeenCalledWith(
        'site-1',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        }
      );
    });

    it('should get data warehouses', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      const mockWarehouses = [
        { id: 'warehouse-1', name: 'Main Warehouse', type: 'postgresql' },
      ];

      mockBusinessIntelligenceService.getDataWarehouses.mockResolvedValue(mockWarehouses);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/data-warehouses?siteId=site-1';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.warehouses).toEqual(mockWarehouses);
      expect(mockBusinessIntelligenceService.getDataWarehouses).toHaveBeenCalledWith('site-1', undefined);
    });

    it('should get business metrics', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      const mockMetrics = [
        { id: 'metric-1', name: 'Revenue Growth', category: 'revenue', currentValue: 12000 },
      ];

      mockBusinessIntelligenceService.getBusinessMetrics.mockResolvedValue(mockMetrics);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/business-metrics?siteId=site-1&category=revenue';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metrics).toEqual(mockMetrics);
      expect(mockBusinessIntelligenceService.getBusinessMetrics).toHaveBeenCalledWith('site-1', 'revenue', undefined);
    });

    it('should get competitive intelligence', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      const mockIntelligence = [
        { id: 'intelligence-1', competitorName: 'Competitor A', competitorType: 'direct' },
      ];

      mockBusinessIntelligenceService.getCompetitiveIntelligence.mockResolvedValue(mockIntelligence);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/competitive-intelligence?siteId=site-1';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.intelligence).toEqual(mockIntelligence);
      expect(mockBusinessIntelligenceService.getCompetitiveIntelligence).toHaveBeenCalledWith('site-1', undefined);
    });

    it('should get performance metrics', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      const mockPerformance = {
        etlJobs: { total: 5, active: 3, failed: 1, averageExecutionTime: 3000 },
        dashboards: { total: 3, active: 2, averageLoadTime: 2.5, totalViews: 1000 },
        analyticsEngines: { total: 2, active: 1, averageResponseTime: 150, averageThroughput: 100 },
      };

      mockBusinessIntelligenceService.getPerformanceMetrics.mockResolvedValue(mockPerformance);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/performance-metrics?siteId=site-1';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.performance).toEqual(mockPerformance);
      expect(mockBusinessIntelligenceService.getPerformanceMetrics).toHaveBeenCalledWith('site-1');
    });
  });

  describe('POST /api/admin/business-intelligence', () => {
    it('should return 401 for unauthorized requests', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for users without analytics write permissions', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should create a data warehouse', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const warehouseData = {
        name: 'Main Data Warehouse',
        type: 'postgresql',
        connection: { host: 'localhost' },
        schema: 'analytics',
        siteId: 'site-1',
      };

      const mockWarehouse = {
        id: 'warehouse-1',
        ...warehouseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBusinessIntelligenceService.createDataWarehouse.mockResolvedValue(mockWarehouse);
      (mockRequest.json as jest.Mock).mockResolvedValue(warehouseData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/data-warehouses';

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.warehouse).toEqual(mockWarehouse);
      expect(mockBusinessIntelligenceService.createDataWarehouse).toHaveBeenCalledWith(warehouseData);
    });

    it('should create a business metric', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const metricData = {
        name: 'Revenue Growth',
        category: 'revenue',
        type: 'kpi',
        siteId: 'site-1',
      };

      const mockMetric = {
        id: 'metric-1',
        ...metricData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBusinessIntelligenceService.createBusinessMetric.mockResolvedValue(mockMetric);
      (mockRequest.json as jest.Mock).mockResolvedValue(metricData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/business-metrics';

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metric).toEqual(mockMetric);
      expect(mockBusinessIntelligenceService.createBusinessMetric).toHaveBeenCalledWith(metricData);
    });

    it('should create competitive intelligence', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const intelligenceData = {
        name: 'Competitor Analysis',
        competitorName: 'Competitor A',
        competitorType: 'direct',
        metrics: { marketShare: 0.25 },
        sources: { googleAnalytics: true },
        siteId: 'site-1',
      };

      const mockIntelligence = {
        id: 'intelligence-1',
        ...intelligenceData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBusinessIntelligenceService.createCompetitiveIntelligence.mockResolvedValue(mockIntelligence);
      (mockRequest.json as jest.Mock).mockResolvedValue(intelligenceData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/competitive-intelligence';

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.intelligence).toEqual(mockIntelligence);
      expect(mockBusinessIntelligenceService.createCompetitiveIntelligence).toHaveBeenCalledWith(intelligenceData);
    });
  });

  describe('PUT /api/admin/business-intelligence', () => {
    it('should return 401 for unauthorized requests', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue(null);

      const response = await PUT(mockRequest, { params: { id: 'metric-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should update a business metric', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const updateData = {
        currentValue: 12000,
        previousValue: 10000,
        change: 20,
        trend: 'up',
      };

      const mockMetric = {
        id: 'metric-1',
        name: 'Revenue Growth',
        currentValue: 12000,
        previousValue: 10000,
        change: 20,
        trend: 'up',
        lastUpdated: new Date(),
      };

      mockBusinessIntelligenceService.updateBusinessMetric.mockResolvedValue(mockMetric);
      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/business-metrics/metric-1';

      const response = await PUT(mockRequest, { params: { id: 'metric-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metric).toEqual(mockMetric);
      expect(mockBusinessIntelligenceService.updateBusinessMetric).toHaveBeenCalledWith('metric-1', updateData);
    });

    it('should acknowledge an alert', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const alertData = { action: 'acknowledge' };
      const mockAlert = {
        id: 'alert-1',
        acknowledgedAt: new Date(),
      };

      mockBusinessIntelligenceService.acknowledgeAlert.mockResolvedValue(mockAlert);
      (mockRequest.json as jest.Mock).mockResolvedValue(alertData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/business-alerts/alert-1';

      const response = await PUT(mockRequest, { params: { id: 'alert-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert).toEqual(mockAlert);
      expect(mockBusinessIntelligenceService.acknowledgeAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should resolve an alert', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const alertData = { action: 'resolve' };
      const mockAlert = {
        id: 'alert-1',
        resolvedAt: new Date(),
        isActive: false,
      };

      mockBusinessIntelligenceService.resolveAlert.mockResolvedValue(mockAlert);
      (mockRequest.json as jest.Mock).mockResolvedValue(alertData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/business-alerts/alert-1';

      const response = await PUT(mockRequest, { params: { id: 'alert-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert).toEqual(mockAlert);
      expect(mockBusinessIntelligenceService.resolveAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should return 400 for invalid action', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const alertData = { action: 'invalid' };
      (mockRequest.json as jest.Mock).mockResolvedValue(alertData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/business-alerts/alert-1';

      const response = await PUT(mockRequest, { params: { id: 'alert-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:write'],
      });

      const invalidData = { name: '' }; // Invalid: name is required
      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/data-warehouses';

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should handle service errors', async () => {
      (getUserFromRequest as jest.Mock).mockResolvedValue({
        id: 'user-1',
        siteId: 'site-1',
        permissions: ['analytics:read'],
      });

      mockBusinessIntelligenceService.getComprehensiveAnalytics.mockRejectedValue(
        new Error('Database connection failed')
      );

      mockRequest.url = 'http://localhost:3000/api/admin/business-intelligence/comprehensive-analytics?siteId=site-1';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
}); 