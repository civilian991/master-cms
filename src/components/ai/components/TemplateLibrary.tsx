'use client';

import React from 'react';
import { TemplateLibraryProps } from '../types/ai.types';

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  selectedTemplate,
  onSelect,
  onCreateNew,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Template Library</h3>
        <button
          onClick={onCreateNew}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Create New
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No templates available. Create your first template to get started.
          </div>
        ) : (
          templates.map((template) => (
            <div 
              key={template.id}
              className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                selectedTemplate?.id === template.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
              onClick={() => onSelect(template)}
            >
              <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{template.contentType}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(template);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(template.id);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary; 