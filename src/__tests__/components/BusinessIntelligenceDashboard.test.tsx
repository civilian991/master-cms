import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessIntelligenceDashboard } from '@/components/admin/business-intelligence/BusinessIntelligenceDashboard';

// Mock the fetch API
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('BusinessIntelligenceDashboard', () => {
  const mockSiteId = 'site-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should render the dashboard with loading state initially', () => {
    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);
    
    expect(screen.getByText('Business Intelligence Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load and display comprehensive analytics data', async () => {
    const mockAnalytics = {
      trafficAnalytics: [
        {
          id: '1',
          pageViews: 1000,
          uniqueVisitors: 500,
          bounceRate: 0.3,
          avgSessionDuration: 120,
          date: '2024-01-01',
        },
      ],
      revenueAnalytics: [
        {
          id: '1',
          revenue: 5000,
          currency: 'USD',
          subscriptionRevenue: 3000,
          advertisingRevenue: 2000,
          otherRevenue: 0,
          date: '2024-01-01',
        },
      ],
      summary: {
        totalPageViews: 1000,
        totalUniqueVisitors: 500,
        averageBounceRate: 0.3,
        averageSessionDuration: 120,
        totalRevenue: 5000,
        totalSubscribers: 100,
        totalArticles: 50,
        averageEngagement: 0.8,
        conversionRate: 0.05,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total page views
      expect(screen.getByText('$5,000')).toBeInTheDocument(); // Total revenue
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Error loading business intelligence data')).toBeInTheDocument();
    });
  });

  it('should switch between different dashboard tabs', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Click on Analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText('Traffic Analytics')).toBeInTheDocument();
    });

    // Click on Data Warehouse tab
    const warehouseTab = screen.getByText('Data Warehouse');
    fireEvent.click(warehouseTab);

    await waitFor(() => {
      expect(screen.getByText('Data Warehouses')).toBeInTheDocument();
    });
  });

  it('should execute ETL jobs when requested', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, analytics: mockAnalytics }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'ETL job executed successfully' }),
      });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Data Warehouse')).toBeInTheDocument();
    });

    // Navigate to Data Warehouse tab
    const warehouseTab = screen.getByText('Data Warehouse');
    fireEvent.click(warehouseTab);

    await waitFor(() => {
      expect(screen.getByText('Data Warehouses')).toBeInTheDocument();
    });

    // Mock ETL job execution
    const executeButton = screen.getByText('Execute');
    if (executeButton) {
      fireEvent.click(executeButton);
    }
  });

  it('should sync data sources when requested', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, analytics: mockAnalytics }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Data source synced successfully' }),
      });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Data Warehouse')).toBeInTheDocument();
    });

    // Navigate to Data Warehouse tab
    const warehouseTab = screen.getByText('Data Warehouse');
    fireEvent.click(warehouseTab);

    await waitFor(() => {
      expect(screen.getByText('Data Warehouses')).toBeInTheDocument();
    });

    // Mock data source sync
    const syncButton = screen.getByText('Sync');
    if (syncButton) {
      fireEvent.click(syncButton);
    }
  });

  it('should display business metrics with proper formatting', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      businessMetrics: [
        {
          id: '1',
          name: 'Revenue Growth',
          category: 'revenue',
          type: 'kpi',
          currentValue: 15.5,
          previousValue: 12.0,
          change: 3.5,
          trend: 'up',
          target: 20.0,
          threshold: 10.0,
          alertEnabled: true,
        },
      ],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });
  });

  it('should display competitive intelligence data', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      competitiveIntelligence: [
        {
          id: '1',
          name: 'Competitor Analysis',
          competitorName: 'Competitor A',
          competitorType: 'direct',
          marketShare: 25.5,
          competitivePosition: 'strong',
          lastCollected: '2024-01-01',
        },
      ],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Competitive Intelligence')).toBeInTheDocument();
    });

    // Navigate to Competitive Intelligence tab
    const competitiveTab = screen.getByText('Competitive Intelligence');
    fireEvent.click(competitiveTab);

    await waitFor(() => {
      expect(screen.getByText('Competitor A')).toBeInTheDocument();
    });
  });

  it('should display predictive insights', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      predictiveInsights: [
        {
          id: '1',
          name: 'Revenue Forecast',
          type: 'forecast',
          category: 'revenue',
          confidence: 0.85,
          impact: 'high',
          timeframe: '30 days',
          isVerified: false,
        },
      ],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
    });

    // Navigate to Predictive Insights tab
    const insightsTab = screen.getByText('Predictive Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
    });
  });

  it('should display business alerts', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      alerts: [
        {
          id: '1',
          type: 'threshold',
          severity: 'high',
          condition: 'below',
          value: 1000,
          isActive: true,
          triggeredAt: '2024-01-01',
        },
      ],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    // Navigate to Alerts tab
    const alertsTab = screen.getByText('Alerts');
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('should handle date range filtering', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analytics: mockAnalytics }),
    });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    // Test date range selection
    const dateRangeSelect = screen.getByDisplayValue('Last 30 Days');
    if (dateRangeSelect) {
      fireEvent.change(dateRangeSelect, { target: { value: 'last_7_days' } });
    }
  });

  it('should refresh data when refresh button is clicked', async () => {
    const mockAnalytics = {
      trafficAnalytics: [],
      revenueAnalytics: [],
      summary: { totalRevenue: 0 },
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, analytics: mockAnalytics }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, analytics: mockAnalytics }),
      });

    render(<BusinessIntelligenceDashboard siteId={mockSiteId} />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
}); 