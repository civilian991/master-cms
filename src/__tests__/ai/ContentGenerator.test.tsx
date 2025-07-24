import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContentGeneratorForm } from '@/components/ai/components/ContentGeneratorForm';

describe('ContentGeneratorForm', () => {
  const mockOnGenerate = jest.fn();
  const mockOnTemplateSelect = jest.fn();

  const defaultProps = {
    onGenerate: mockOnGenerate,
    isGenerating: false,
    templates: [],
    selectedTemplate: undefined,
    onTemplateSelect: mockOnTemplateSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders content generator form', () => {
    render(<ContentGeneratorForm {...defaultProps} />);
    
    expect(screen.getByText('Content Generator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your content topic...')).toBeInTheDocument();
    expect(screen.getByText('Generate Content')).toBeInTheDocument();
  });

  it('shows loading state when generating', () => {
    render(<ContentGeneratorForm {...defaultProps} isGenerating={true} />);
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('calls onGenerate when form is submitted', () => {
    render(<ContentGeneratorForm {...defaultProps} />);
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    expect(mockOnGenerate).toHaveBeenCalledWith({
      topic: 'Sample topic',
      contentType: 'article',
      targetAudience: 'General',
      tone: 'professional',
      length: 'medium',
    });
  });

  it('displays content type options', () => {
    render(<ContentGeneratorForm {...defaultProps} />);
    
    expect(screen.getByText('Article')).toBeInTheDocument();
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Social Media Post')).toBeInTheDocument();
  });
}); 