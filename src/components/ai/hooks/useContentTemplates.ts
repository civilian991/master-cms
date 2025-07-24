'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiApi } from '../services/aiApi';
import { ContentTemplate, ContentType } from '../types/ai.types';

export function useContentTemplates(contentType?: ContentType) {
  const [state, setState] = useState<{
    isLoading: boolean;
    templates: ContentTemplate[];
    error: string | null;
  }>({
    isLoading: false,
    templates: [],
    error: null,
  });

  const fetchTemplates = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const templates = await aiApi.getTemplates(contentType);
      setState({
        isLoading: false,
        templates,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
      }));
    }
  }, [contentType]);

  const createTemplate = useCallback(async (template: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTemplate = await aiApi.createTemplate(template);
      setState(prev => ({
        ...prev,
        templates: [...prev.templates, newTemplate],
      }));
      return newTemplate;
    } catch (error) {
      console.error('Template creation failed:', error);
      throw error;
    }
  }, []);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<ContentTemplate>) => {
    try {
      const updatedTemplate = await aiApi.updateTemplate(templateId, updates);
      setState(prev => ({
        ...prev,
        templates: prev.templates.map(template => 
          template.id === templateId ? updatedTemplate : template
        ),
      }));
      return updatedTemplate;
    } catch (error) {
      console.error('Template update failed:', error);
      throw error;
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await aiApi.deleteTemplate(templateId);
      setState(prev => ({
        ...prev,
        templates: prev.templates.filter(template => template.id !== templateId),
      }));
    } catch (error) {
      console.error('Template deletion failed:', error);
      throw error;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    ...state,
    refresh: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

export default useContentTemplates; 