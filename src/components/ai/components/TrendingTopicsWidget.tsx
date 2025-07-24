'use client';

import React from 'react';
import { TrendingTopicsWidgetProps, TrendingTopic } from '../types/ai.types';

export const TrendingTopicsWidget: React.FC<TrendingTopicsWidgetProps> = ({
  siteId,
  limit = 10,
  categories,
  onTopicSelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Trending Topics</h3>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            onClick={() => onTopicSelect?.({
              id: i.toString(),
              topic: `Sample Topic ${i}`,
              searchVolume: 1000 * i,
              trend: 10 * i,
              difficulty: 50,
              category: 'Technology',
              keywords: [`keyword${i}`],
              relatedTopics: [],
              contentGap: true,
              opportunityScore: 80,
              lastUpdated: new Date().toISOString(),
            } as TrendingTopic)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Sample Topic {i}</span>
              <span className="text-sm text-green-600">+{10 * i}%</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {1000 * i} searches • Technology
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopicsWidget; 