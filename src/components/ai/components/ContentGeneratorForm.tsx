'use client';

import React from 'react';
import { ContentGeneratorFormProps } from '../types/ai.types';

export const ContentGeneratorForm: React.FC<ContentGeneratorFormProps> = ({
  onGenerate,
  isGenerating = false,
  templates,
  selectedTemplate,
  onTemplateSelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Content Generator</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
          <input
            type="text"
            placeholder="Enter your content topic..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>Article</option>
            <option>Blog Post</option>
            <option>Social Media Post</option>
          </select>
        </div>

        <button
          onClick={() => onGenerate({
            topic: 'Sample topic',
            contentType: 'article',
            targetAudience: 'General',
            tone: 'professional',
            length: 'medium'
          })}
          disabled={isGenerating}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </button>
      </div>
    </div>
  );
};

export default ContentGeneratorForm; 