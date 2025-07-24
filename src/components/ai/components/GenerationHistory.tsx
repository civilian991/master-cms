'use client';

import React from 'react';
import { GenerationHistoryProps } from '../types/ai.types';

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  siteId,
  limit = 20,
  onRegenerate,
  onPublish,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Generation History</h3>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Sample Generated Content {i}</h4>
                <p className="text-sm text-gray-600 mt-1">Article • Professional tone • {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 mt-2">Topic: How to improve website performance</p>
              </div>
              <div className="flex space-x-2">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Regenerate
                </button>
                <button className="text-sm text-green-600 hover:text-green-700">
                  Publish
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {limit > 3 && (
          <div className="text-center py-4 text-gray-500">
            No additional history items available
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationHistory; 