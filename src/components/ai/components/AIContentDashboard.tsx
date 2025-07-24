'use client';

import React, { useState, useCallback } from 'react';
import { Bot, TrendingUp, FileText, History, Settings, Sparkles } from 'lucide-react';
import { AIContentDashboardProps, ContentGenerationRequest, ContentTemplate } from '../types/ai.types';
import { useAIGeneration } from '../hooks/useAIGeneration';
import { ContentGeneratorForm } from './ContentGeneratorForm';
import { ContentPreview } from './ContentPreview';
import { TrendingTopicsWidget } from './TrendingTopicsWidget';
import { TemplateLibrary } from './TemplateLibrary';
import { GenerationHistory } from './GenerationHistory';
import { SEOOptimizer } from './SEOOptimizer';

export const AIContentDashboard: React.FC<AIContentDashboardProps> = ({
  siteId,
  initialView = 'generator',
}) => {
  const [activeView, setActiveView] = useState(initialView);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | undefined>();
  const [templates] = useState<ContentTemplate[]>([]); // This would come from an API hook

  const {
    generateContent,
    isGenerating,
    progress,
    lastResponse,
    error,
    streamedContent,
    clearError,
    reset,
  } = useAIGeneration({
    enableStreaming: true,
    autoSave: true,
    onSuccess: (response) => {
      console.log('Content generated successfully:', response);
      // Could show success toast
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      // Could show error toast
    },
  });

  const handleGenerate = useCallback(async (request: ContentGenerationRequest) => {
    clearError();
    await generateContent(request);
  }, [generateContent, clearError]);

  const handleTemplateSelect = useCallback((template: ContentTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const navigationItems = [
    { id: 'generator', label: 'AI Generator', icon: Bot, description: 'Create new content with AI' },
    { id: 'trends', label: 'Trending Topics', icon: TrendingUp, description: 'Discover trending content opportunities' },
    { id: 'templates', label: 'Templates', icon: FileText, description: 'Manage content templates' },
    { id: 'history', label: 'History', icon: History, description: 'View generation history' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'generator':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <ContentGeneratorForm
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                templates={templates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
              />
            </div>
            
            <div className="space-y-6">
              <ContentPreview
                content={lastResponse?.content || null}
                seoAnalysis={lastResponse?.seoAnalysis || null}
                isLoading={isGenerating}
                onOptimize={(type) => {
                  console.log('Optimize content for:', type);
                }}
                onEdit={(content) => {
                  console.log('Edit content:', content);
                }}
              />
              
              {isGenerating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Generating Content</span>
                    <span className="text-sm text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {streamedContent && (
                    <div className="mt-3 p-3 bg-white rounded border text-sm text-gray-700">
                      {streamedContent}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-6">
            <TrendingTopicsWidget
              siteId={siteId}
              limit={20}
              onTopicSelect={(topic) => {
                console.log('Selected topic:', topic);
                // Could navigate to generator with pre-filled topic
                setActiveView('generator');
              }}
            />
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-6">
            <TemplateLibrary
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
              onCreateNew={() => {
                console.log('Create new template');
              }}
              onEdit={(template) => {
                console.log('Edit template:', template);
              }}
              onDelete={(templateId) => {
                console.log('Delete template:', templateId);
              }}
            />
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <GenerationHistory
              siteId={siteId}
              limit={50}
              onRegenerate={(request) => {
                console.log('Regenerate content:', request);
                setActiveView('generator');
                handleGenerate(request);
              }}
              onPublish={(content) => {
                console.log('Publish content:', content);
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Content Generator</h1>
                <p className="text-gray-600">Create engaging content with artificial intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={reset}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Reset
              </button>
              
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={clearError}
                      className="text-sm font-medium text-red-800 hover:text-red-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <nav className="flex space-x-8 p-6" aria-label="Tabs">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderActiveView()}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Content Generated</dt>
                  <dd className="text-lg font-medium text-gray-900">1,247</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">98.5%</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Templates</dt>
                  <dd className="text-lg font-medium text-gray-900">{templates.length}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Sparkles className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Words Generated</dt>
                  <dd className="text-lg font-medium text-gray-900">2.1M</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIContentDashboard; 