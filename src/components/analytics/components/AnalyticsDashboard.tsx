'use client';

import React, { useState, useCallback } from 'react';
import { RefreshCw, Download, Settings, AlertCircle, Activity } from 'lucide-react';
import { AnalyticsDashboardProps, TIME_RANGES, TimeRange } from '../types/analytics.types';
import { useAnalyticsWithTimeRange } from '../hooks/useAnalyticsData';
import { DateRangePicker } from './DateRangePicker';
import { UserMetricsWidget } from './UserMetricsWidget';
import { ContentPerformanceWidget } from './ContentPerformanceWidget';
import { RealTimeVisitorWidget } from './RealTimeVisitorWidget';
import { ExportReportModal } from './ExportReportModal';
import { MetricCardGrid } from './MetricCard';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  siteId,
  initialTimeRange = TIME_RANGES[2], // Default to 30 days
  config,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute
  
  const {
    timeRange,
    setTimeRange,
    filters,
    analytics: {
      userMetrics,
      contentMetrics,
      userTrends,
      isLoading,
      hasError,
      refresh,
    },
  } = useAnalyticsWithTimeRange(siteId, initialTimeRange, {
    autoRefresh,
    refreshInterval,
    onError: (error) => {
      console.error('Analytics error:', error);
      // You could add toast notifications here
    },
  });

  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
      // You could add a success toast here
    } catch (error) {
      console.error('Manual refresh failed:', error);
      // You could add an error toast here
    }
  }, [refresh]);

  const handleTimeRangeChange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  }, [setTimeRange]);

  const handleExportClick = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Monitor your site performance and user engagement
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExportClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={toggleAutoRefresh}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  autoRefresh
                    ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Auto Refresh {autoRefresh ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mt-6">
            <DateRangePicker
              value={timeRange}
              onChange={handleTimeRangeChange}
              disabled={isLoading}
            />
          </div>

          {/* Status Indicators */}
          <div className="mt-4 flex items-center space-x-4">
            {hasError && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Some data failed to load</span>
              </div>
            )}
            
            {userMetrics.lastUpdated && (
              <div className="text-sm text-gray-500">
                Last updated: {userMetrics.lastUpdated.toLocaleTimeString()}
              </div>
            )}
            
            {autoRefresh && (
              <div className="text-sm text-green-600">
                Auto-refreshing every {refreshInterval / 1000} seconds
              </div>
            )}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-8">
          {/* Overview Metrics */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <MetricCardGrid>
              <UserMetricsWidget
                siteId={siteId}
                timeRange={timeRange}
                refreshInterval={autoRefresh ? refreshInterval : 0}
              />
            </MetricCardGrid>
          </section>

          {/* Real-time Activity */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeVisitorWidget
                siteId={siteId}
                autoRefresh={autoRefresh}
                maxEvents={50}
              />
              
              {/* Additional real-time widgets can go here */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Live Page Views</h3>
                <div className="text-center py-8 text-gray-500">
                  Live page view tracking widget will be implemented here
                </div>
              </div>
            </div>
          </section>

          {/* Content Performance */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h2>
            <ContentPerformanceWidget
              siteId={siteId}
              timeRange={timeRange}
              limit={10}
              onContentClick={(contentId: string) => {
                // Navigate to content details
                console.log('Navigate to content:', contentId);
              }}
            />
          </section>

          {/* Trends and Charts */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Trends Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity Trends</h3>
                {userTrends.loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                ) : userTrends.error ? (
                  <div className="text-center py-8 text-red-500">
                    Error loading trends: {userTrends.error}
                  </div>
                ) : userTrends.data ? (
                  <div className="text-center py-8 text-gray-500">
                    Chart component will display trends data here
                    <div className="mt-2 text-xs">
                      Data points: {userTrends.data.length}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No trend data available
                  </div>
                )}
              </div>

              {/* Additional chart placeholder */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Metrics</h3>
                <div className="text-center py-8 text-gray-500">
                  Engagement metrics chart will be implemented here
                </div>
              </div>
            </div>
          </section>

          {/* Geographic Data */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Geographic Insights</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8 text-gray-500">
                Geographic distribution map and data will be implemented here
              </div>
            </div>
          </section>

          {/* Device and Technology */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device & Technology</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Device Types</h3>
                <div className="text-center py-4 text-gray-500">
                  Device breakdown chart
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Browsers</h3>
                <div className="text-center py-4 text-gray-500">
                  Browser usage chart
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Systems</h3>
                <div className="text-center py-4 text-gray-500">
                  OS distribution chart
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Export Modal */}
        <ExportReportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          siteId={siteId}
          availableMetrics={[
            { id: 'users', label: 'User Metrics', description: 'Active users, new users, session data', category: 'user', isDefault: true },
            { id: 'content', label: 'Content Performance', description: 'Page views, engagement, top content', category: 'content', isDefault: true },
            { id: 'trends', label: 'Trend Data', description: 'Historical trends and patterns', category: 'engagement', isDefault: false },
            { id: 'geographic', label: 'Geographic Data', description: 'Location-based analytics', category: 'user', isDefault: false },
            { id: 'technical', label: 'Technical Metrics', description: 'Device, browser, and technical data', category: 'technical', isDefault: false },
          ]}
          dateRange={{
            startDate: new Date(Date.now() - timeRange.days * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          }}
          onExportSuccess={(response: any) => {
            console.log('Export successful:', response);
            // You could add a success toast here
          }}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 