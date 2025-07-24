'use client';

import React from 'react';
import { ContentPerformanceWidgetProps } from '../types/analytics.types';
import { useContentMetrics } from '../hooks/useAnalyticsData';

export const ContentPerformanceWidget: React.FC<ContentPerformanceWidgetProps> = ({
  siteId,
  timeRange,
  contentType = 'all',
  limit = 10,
  onContentClick,
}) => {
  const filters = { siteId, timeRange, contentType };
  const { data: contentMetrics, loading, error } = useContentMetrics(filters, limit);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Content</h3>
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : !contentMetrics || contentMetrics.length === 0 ? (
        <div className="text-gray-500">No content data available</div>
      ) : (
        <div className="space-y-4">
          {contentMetrics.map((content) => (
            <div 
              key={content.id}
              className="border-b border-gray-100 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => onContentClick?.(content.id)}
            >
              <h4 className="font-medium text-gray-900">{content.title}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                <span>{content.views.toLocaleString()} views</span>
                <span>{content.shares} shares</span>
                <span>{content.comments} comments</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentPerformanceWidget; 