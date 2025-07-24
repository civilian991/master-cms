'use client';

import { useState, useCallback, useRef } from 'react';
import { aiApi } from '../services/aiApi';
import {
  ContentGenerationRequest,
  ContentGenerationResponse,
  LoadingState,
  GenerationStatus,
} from '../types/ai.types';

interface UseAIGenerationOptions {
  enableStreaming?: boolean;
  autoSave?: boolean;
  onSuccess?: (response: ContentGenerationResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface UseAIGenerationReturn {
  generateContent: (request: ContentGenerationRequest) => Promise<void>;
  optimizeContent: (content: string, type: string) => Promise<void>;
  cancelGeneration: () => void;
  isGenerating: boolean;
  isOptimizing: boolean;
  progress: number;
  status: GenerationStatus;
  lastResponse: ContentGenerationResponse | null;
  error: string | null;
  streamedContent: string;
  clearError: () => void;
  reset: () => void;
}

export function useAIGeneration(options: UseAIGenerationOptions = {}): UseAIGenerationReturn {
  const {
    enableStreaming = false,
    autoSave = false,
    onSuccess,
    onError,
    onProgress,
  } = options;

  const [state, setState] = useState<{
    isGenerating: boolean;
    isOptimizing: boolean;
    progress: number;
    status: GenerationStatus;
    lastResponse: ContentGenerationResponse | null;
    error: string | null;
    streamedContent: string;
  }>({
    isGenerating: false,
    isOptimizing: false,
    progress: 0,
    status: 'pending',
    lastResponse: null,
    error: null,
    streamedContent: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const generationStartTimeRef = useRef<number>(0);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      isOptimizing: false,
      progress: 0,
      status: 'pending',
      lastResponse: null,
      error: null,
      streamedContent: '',
    });
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      isOptimizing: false,
      status: 'cancelled',
      progress: 0,
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
    onProgress?.(progress);
  }, [onProgress]);

  const handleStreamProgress = useCallback((chunk: string, progress: number) => {
    setState(prev => ({
      ...prev,
      streamedContent: prev.streamedContent + chunk,
      progress,
    }));
    
    onProgress?.(progress);
  }, [onProgress]);

  const generateContent = useCallback(async (request: ContentGenerationRequest) => {
    try {
      // Reset state
      setState(prev => ({
        ...prev,
        isGenerating: true,
        error: null,
        status: 'processing',
        progress: 0,
        streamedContent: '',
        lastResponse: null,
      }));

      generationStartTimeRef.current = Date.now();
      abortControllerRef.current = new AbortController();

      let response: ContentGenerationResponse;

      if (enableStreaming) {
        // Use streaming generation
        response = await aiApi.generateContentStream(request, handleStreamProgress);
      } else {
        // Use regular generation with progress simulation
        const progressInterval = setInterval(() => {
          setState(prev => {
            const newProgress = Math.min(prev.progress + 10, 90);
            onProgress?.(newProgress);
            return { ...prev, progress: newProgress };
          });
        }, 500);

        try {
          response = await aiApi.generateContent(request);
          clearInterval(progressInterval);
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      }

      // Check if generation was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Complete generation
      setState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'completed',
        progress: 100,
        lastResponse: response,
      }));

      // Auto-save if enabled
      if (autoSave) {
        try {
          await aiApi.saveToHistory(request, response);
        } catch (saveError) {
          console.warn('Failed to auto-save to history:', saveError);
        }
      }

      onSuccess?.(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'failed',
        error: errorMessage,
        progress: 0,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      abortControllerRef.current = null;
    }
  }, [enableStreaming, autoSave, onSuccess, onError, handleStreamProgress]);

  const optimizeContent = useCallback(async (content: string, type: string) => {
    try {
      setState(prev => ({
        ...prev,
        isOptimizing: true,
        error: null,
      }));

      const optimization = await aiApi.optimizeContent(content, type as any);

      setState(prev => ({
        ...prev,
        isOptimizing: false,
      }));

      // You could emit the optimization result via a callback if needed
      console.log('Content optimized:', optimization);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Optimization failed';
      
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [onError]);

  return {
    generateContent,
    optimizeContent,
    cancelGeneration,
    isGenerating: state.isGenerating,
    isOptimizing: state.isOptimizing,
    progress: state.progress,
    status: state.status,
    lastResponse: state.lastResponse,
    error: state.error,
    streamedContent: state.streamedContent,
    clearError,
    reset,
  };
}

// Hook for batch content generation
export function useBatchGeneration() {
  const [state, setState] = useState<{
    isProcessing: boolean;
    completedCount: number;
    totalCount: number;
    results: ContentGenerationResponse[];
    errors: string[];
  }>({
    isProcessing: false,
    completedCount: 0,
    totalCount: 0,
    results: [],
    errors: [],
  });

  const generateBatch = useCallback(async (requests: ContentGenerationRequest[]) => {
    setState({
      isProcessing: true,
      completedCount: 0,
      totalCount: requests.length,
      results: [],
      errors: [],
    });

    try {
      const results = await aiApi.batchGenerateContent(requests);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        completedCount: requests.length,
        results,
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch generation failed';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        errors: [errorMessage],
      }));

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      completedCount: 0,
      totalCount: 0,
      results: [],
      errors: [],
    });
  }, []);

  return {
    generateBatch,
    reset,
    ...state,
    progress: state.totalCount > 0 ? (state.completedCount / state.totalCount) * 100 : 0,
  };
}

// Hook for content analysis
export function useContentAnalysis() {
  const [state, setState] = useState<{
    isAnalyzing: boolean;
    analysis: any | null;
    error: string | null;
  }>({
    isAnalyzing: false,
    analysis: null,
    error: null,
  });

  const analyzeContent = useCallback(async (content: string) => {
    setState({
      isAnalyzing: true,
      analysis: null,
      error: null,
    });

    try {
      const analysis = await aiApi.analyzeContent(content);
      
      setState({
        isAnalyzing: false,
        analysis,
        error: null,
      });

      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      
      setState({
        isAnalyzing: false,
        analysis: null,
        error: errorMessage,
      });

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      analysis: null,
      error: null,
    });
  }, []);

  return {
    analyzeContent,
    reset,
    ...state,
  };
}

// Hook for content variations
export function useContentVariations() {
  const [state, setState] = useState<{
    isGenerating: boolean;
    variations: string[];
    error: string | null;
  }>({
    isGenerating: false,
    variations: [],
    error: null,
  });

  const generateVariations = useCallback(async (
    content: string,
    count = 3,
    variationType = 'tone'
  ) => {
    setState({
      isGenerating: true,
      variations: [],
      error: null,
    });

    try {
      const variations = await aiApi.generateVariations(content, count, variationType);
      
      setState({
        isGenerating: false,
        variations,
        error: null,
      });

      return variations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Variation generation failed';
      
      setState({
        isGenerating: false,
        variations: [],
        error: errorMessage,
      });

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      variations: [],
      error: null,
    });
  }, []);

  return {
    generateVariations,
    reset,
    ...state,
  };
}

export default useAIGeneration; 