import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsDashboard } from '@/components/analytics/components/AnalyticsDashboard';

// Mock the hooks and services
jest.mock('@/components/analytics/hooks/useAnalyticsData', () => ({
  useAnalyticsWithTimeRange: jest.fn(() => ({
    timeRange: { value: '30d', label: 'Last 30 Days', days: 30 },
    setTimeRange: jest.fn(),
    filters: { siteId: 'test', timeRange: { value: '30d', label: 'Last 30 Days', days: 30 } },
    analytics: {
      userMetrics: { data: null, loading: false, error: null, refresh: jest.fn() },
      contentMetrics: { data: null, loading: false, error: null, refresh: jest.fn() },
      userTrends: { data: null, loading: false, error: null, refresh: jest.fn() },
      isLoading: false,
      hasError: false,
      refresh: jest.fn(),
    },
  })),
}));

jest.mock('@/components/analytics/services/websocketService', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    subscribeToConnection: jest.fn(),
  },
}));

describe('AnalyticsDashboard', () => {
  it('renders analytics dashboard', () => {
    render(<AnalyticsDashboard siteId="test" />);
    
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitor your site performance and user engagement')).toBeInTheDocument();
  });

  it('displays refresh button', () => {
    render(<AnalyticsDashboard siteId="test" />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('displays export button', () => {
    render(<AnalyticsDashboard siteId="test" />);
    
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
}); 