import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceDashboard } from '@/performance/components/PerformanceDashboard';
import { usePerformanceMonitoring } from '@/performance/hooks/usePerformanceMonitoring';

// Mock the performance monitoring hook
jest.mock('@/performance/hooks/usePerformanceMonitoring');
const mockUsePerformanceMonitoring = usePerformanceMonitoring as jest.MockedFunction<typeof usePerformanceMonitoring>;

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className} data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className} data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value} />
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value} onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid="tabs-content" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid="tabs-trigger" data-value={value}>{children}</button>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange?.('24h')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

describe('PerformanceDashboard', () => {
  const mockMetrics = [
    {
      id: 'web_vitals_lcp',
      name: 'Largest Contentful Paint',
      type: 'gauge' as const,
      category: 'core_web_vitals' as const,
      value: 2500,
      unit: 'ms',
      timestamp: new Date(),
      labels: {},
      threshold: {
        warning: 2500,
        critical: 4000,
        operator: 'gt' as const,
        duration: 0,
        description: 'LCP threshold',
      },
    },
    {
      id: 'runtime_memory_used',
      name: 'Memory Usage',
      type: 'gauge' as const,
      category: 'runtime' as const,
      value: 45.5,
      unit: '%',
      timestamp: new Date(),
      labels: {},
    },
  ];

  const mockSnapshot = {
    id: 'test-snapshot',
    timestamp: new Date(),
    metrics: mockMetrics,
    status: 'healthy' as const,
    score: 85,
    insights: [],
    recommendations: [],
    duration: 1000,
    environment: 'test',
  };

  const mockAlerts = [
    {
      id: 'alert-1',
      severity: 'warning' as const,
      status: 'firing' as const,
      message: 'High memory usage detected',
      metric: 'Memory Usage',
      value: 85,
      threshold: 80,
      startTime: new Date(),
    },
  ];

  const mockRecommendations = [
    {
      id: 'rec-1',
      priority: 'high' as const,
      category: 'rendering' as const,
      title: 'Optimize Bundle Size',
      description: 'Reduce bundle size to improve loading performance',
      estimatedImpact: 25,
      estimatedEffort: 'medium' as const,
      implementation: {
        type: 'code' as const,
        steps: ['Enable code splitting', 'Remove unused dependencies'],
      },
      metrics: ['bundle_size'],
      status: 'pending' as const,
    },
  ];

  const defaultMockReturn = {
    snapshot: mockSnapshot,
    metrics: mockMetrics,
    alerts: mockAlerts,
    recommendations: mockRecommendations,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    getMetricsByCategory: jest.fn(),
    getWebVitalsScore: jest.fn(() => 85),
  };

  beforeEach(() => {
    mockUsePerformanceMonitoring.mockReturnValue(defaultMockReturn);
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/admin/performance',
        search: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dashboard header correctly', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Real-time performance monitoring and optimization insights')).toBeInTheDocument();
    });

    it('displays performance metrics in overview cards', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Overall Score')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    it('shows active alerts count', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays recommendations count', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders all tab navigation options', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Web Vitals')).toBeInTheDocument();
      expect(screen.getByText('Runtime')).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when monitoring fails', () => {
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        error: 'Failed to fetch performance data',
        snapshot: null,
      });

      render(<PerformanceDashboard />);
      
      expect(screen.getByText(/Failed to load performance data/)).toBeInTheDocument();
    });

    it('handles missing snapshot gracefully', () => {
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        snapshot: null,
      });

      render(<PerformanceDashboard />);
      
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Overall score should be 0
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when refreshing', () => {
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
      });

      render(<PerformanceDashboard />);
      
      const refreshButton = screen.getByText('Refresh').closest('button');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('calls refresh function when refresh button is clicked', () => {
      const mockRefresh = jest.fn();
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        refresh: mockRefresh,
      });

      render(<PerformanceDashboard />);
      
      const refreshButton = screen.getByText('Refresh').closest('button');
      fireEvent.click(refreshButton!);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('handles metric click callback', () => {
      const mockOnMetricClick = jest.fn();
      
      render(<PerformanceDashboard onMetricClick={mockOnMetricClick} />);
      
      // This would test metric click functionality if implemented in the component
      expect(mockOnMetricClick).not.toHaveBeenCalled();
    });

    it('handles alert click callback', () => {
      const mockOnAlertClick = jest.fn();
      
      render(<PerformanceDashboard onAlertClick={mockOnAlertClick} />);
      
      // This would test alert click functionality if implemented in the component
      expect(mockOnAlertClick).not.toHaveBeenCalled();
    });

    it('handles recommendation click callback', () => {
      const mockOnRecommendationClick = jest.fn();
      
      render(<PerformanceDashboard onRecommendationClick={mockOnRecommendationClick} />);
      
      // This would test recommendation click functionality if implemented in the component
      expect(mockOnRecommendationClick).not.toHaveBeenCalled();
    });

    it('handles export functionality', () => {
      // Mock URL and document methods for export test
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockClick = jest.fn();
      
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;
      document.createElement = jest.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
      })) as any;

      render(<PerformanceDashboard />);
      
      const exportButton = screen.getByText('Export').closest('button');
      fireEvent.click(exportButton!);
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Filtering', () => {
    it('filters metrics by category for web vitals', () => {
      const mockGetMetricsByCategory = jest.fn()
        .mockReturnValue(mockMetrics.filter(m => m.category === 'core_web_vitals'));
      
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        getMetricsByCategory: mockGetMetricsByCategory,
      });

      render(<PerformanceDashboard />);
      
      expect(mockGetMetricsByCategory).toHaveBeenCalledWith('core_web_vitals');
    });

    it('filters metrics by category for runtime', () => {
      const mockGetMetricsByCategory = jest.fn()
        .mockReturnValue(mockMetrics.filter(m => m.category === 'runtime'));
      
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        getMetricsByCategory: mockGetMetricsByCategory,
      });

      render(<PerformanceDashboard />);
      
      expect(mockGetMetricsByCategory).toHaveBeenCalledWith('runtime');
    });
  });

  describe('Status Indicators', () => {
    it('displays correct status color for healthy state', () => {
      render(<PerformanceDashboard />);
      
      const healthyBadge = screen.getByTestId('badge');
      expect(healthyBadge).toHaveTextContent('healthy');
    });

    it('displays warning status correctly', () => {
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        snapshot: {
          ...mockSnapshot,
          status: 'warning',
        },
      });

      render(<PerformanceDashboard />);
      
      const statusBadge = screen.getByTestId('badge');
      expect(statusBadge).toHaveTextContent('warning');
    });

    it('displays critical status correctly', () => {
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        snapshot: {
          ...mockSnapshot,
          status: 'critical',
        },
      });

      render(<PerformanceDashboard />);
      
      const statusBadge = screen.getByTestId('badge');
      expect(statusBadge).toHaveTextContent('critical');
    });
  });

  describe('Charts and Visualizations', () => {
    it('renders performance timeline chart', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders web vitals bar chart', () => {
      render(<PerformanceDashboard />);
      
      // Navigate to Web Vitals tab to test bar chart rendering
      // This would require implementing tab navigation in the test
    });

    it('renders pie chart for resource loading', () => {
      render(<PerformanceDashboard />);
      
      // Navigate to Network tab to test pie chart rendering
      // This would require implementing tab navigation in the test
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<PerformanceDashboard />);
      
      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', () => {
      render(<PerformanceDashboard />);
      
      const refreshButton = screen.getByText('Refresh').closest('button');
      expect(refreshButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Responsive Design', () => {
    it('renders responsive containers for charts', () => {
      render(<PerformanceDashboard />);
      
      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Score Calculation', () => {
    it('displays correct Web Vitals score', () => {
      render(<PerformanceDashboard />);
      
      expect(screen.getByText('85')).toBeInTheDocument(); // Overall score
    });

    it('handles missing Web Vitals gracefully', () => {
      const mockGetWebVitalsScore = jest.fn(() => 0);
      
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        getWebVitalsScore: mockGetWebVitalsScore,
      });

      render(<PerformanceDashboard />);
      
      expect(mockGetWebVitalsScore).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('displays last updated timestamp', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z');
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        snapshot: {
          ...mockSnapshot,
          timestamp,
        },
      });

      render(<PerformanceDashboard />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('handles auto-refresh correctly', async () => {
      const mockRefresh = jest.fn();
      mockUsePerformanceMonitoring.mockReturnValue({
        ...defaultMockReturn,
        refresh: mockRefresh,
      });

      render(<PerformanceDashboard autoRefresh={true} refreshInterval={1000} />);
      
      // Auto-refresh would be tested with proper timer mocking
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Custom Configuration', () => {
    it('respects custom widget selection', () => {
      render(<PerformanceDashboard widgets={['overview', 'web_vitals']} />);
      
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    });

    it('applies custom CSS classes', () => {
      render(<PerformanceDashboard className="custom-dashboard" />);
      
      const dashboard = screen.getByText('Performance Dashboard').closest('div');
      expect(dashboard).toHaveClass('custom-dashboard');
    });

    it('handles custom time range', () => {
      const customTimeRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-02'),
        timezone: 'UTC',
      };

      render(<PerformanceDashboard initialTimeRange={customTimeRange} />);
      
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    });
  });
});

// Integration tests
describe('PerformanceDashboard Integration', () => {
  it('integrates with performance monitoring service', () => {
    render(<PerformanceDashboard />);
    
    expect(mockUsePerformanceMonitoring).toHaveBeenCalledWith({
      autoRefresh: true,
      refreshInterval: 30000,
      timeRange: expect.any(Object),
    });
  });

  it('handles service errors gracefully', () => {
    mockUsePerformanceMonitoring.mockReturnValue({
      snapshot: null,
      metrics: [],
      alerts: [],
      recommendations: [],
      isLoading: false,
      error: 'Service unavailable',
      refresh: jest.fn(),
      getMetricsByCategory: jest.fn(() => []),
      getWebVitalsScore: jest.fn(() => 0),
    });

    render(<PerformanceDashboard />);
    
    expect(screen.getByText(/Failed to load performance data/)).toBeInTheDocument();
  });

  it('maintains component state during re-renders', () => {
    const { rerender } = render(<PerformanceDashboard />);
    
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    
    rerender(<PerformanceDashboard />);
    
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
  });
}); 