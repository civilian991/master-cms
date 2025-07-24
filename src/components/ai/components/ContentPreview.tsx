'use client';

import React from 'react';
import { ContentPreviewProps, OptimizationType } from '../types/ai.types';

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  seoAnalysis,
  isLoading,
  onOptimize,
  onEdit,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Content Preview</h3>
        {content && (
          <div className="flex space-x-2">
            <button
              onClick={() => onOptimize?.('seo' as OptimizationType)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Optimize SEO
            </button>
            <button
              onClick={() => onEdit?.(content.content)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {content ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{content.title}</h4>
            <div className="prose prose-sm max-w-none text-gray-700">
              {content.content}
            </div>
          </div>
          
          {seoAnalysis && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">SEO Score</span>
                <span className={`text-sm font-medium ${
                  seoAnalysis.score >= 80 ? 'text-green-600' : 
                  seoAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {seoAnalysis.score}/100
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    seoAnalysis.score >= 80 ? 'bg-green-500' : 
                    seoAnalysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${seoAnalysis.score}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Generate content to see preview
        </div>
      )}
    </div>
  );
};

export default ContentPreview; 