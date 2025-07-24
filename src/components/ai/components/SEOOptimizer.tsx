'use client';

import React from 'react';
import { SEOOptimizerProps } from '../types/ai.types';

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  content,
  analysis,
  targets,
  onOptimize,
  isOptimizing = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Optimizer</h3>
      <div className="space-y-4">
        {analysis && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">SEO Score</span>
              <span className={`text-sm font-medium ${
                analysis.score >= 80 ? 'text-green-600' : 
                analysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  analysis.score >= 80 ? 'bg-green-500' : 
                  analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${analysis.score}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={() => onOptimize('Optimized content here')}
          disabled={isOptimizing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize for SEO'}
        </button>
        
        <div className="text-sm text-gray-500">
          Target keyword: {targets.primaryKeyword || 'None specified'}
        </div>
      </div>
    </div>
  );
};

export default SEOOptimizer; 