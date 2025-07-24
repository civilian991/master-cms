import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIContentDashboard } from '@/components/ai/components/AIContentDashboard';

// Mock the AI hooks and services
jest.mock('@/components/ai/hooks/useAIGeneration', () => ({
  useAIGeneration: jest.fn(() => ({
    generateContent: jest.fn(),
    isGenerating: false,
    progress: 0,
    lastResponse: null,
    error: null,
    streamedContent: '',
    clearError: jest.fn(),
    reset: jest.fn(),
  })),
}));

jest.mock('@/components/ai/services/aiApi', () => ({
  aiApi: {
    generateContent: jest.fn(),
    getTrendingTopics: jest.fn(),
    getTemplates: jest.fn(),
  },
}));

describe('AIContentDashboard', () => {
  it('renders AI content dashboard', () => {
    render(<AIContentDashboard siteId="test" />);
    
    expect(screen.getByText('AI Content Generator')).toBeInTheDocument();
    expect(screen.getByText('Create engaging content with artificial intelligence')).toBeInTheDocument();
  });

  it('displays navigation tabs', () => {
    render(<AIContentDashboard siteId="test" />);
    
    expect(screen.getByText('AI Generator')).toBeInTheDocument();
    expect(screen.getByText('Trending Topics')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('displays reset and settings buttons', () => {
    render(<AIContentDashboard siteId="test" />);
    
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows content generator by default', () => {
    render(<AIContentDashboard siteId="test" />);
    
    expect(screen.getByText('Content Generator')).toBeInTheDocument();
    expect(screen.getByText('Content Preview')).toBeInTheDocument();
  });
}); 