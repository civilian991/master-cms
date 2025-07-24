'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  UseMobileNavigationOptions,
  NavigationHistoryItem,
  NavigationType,
} from '../types/mobile.types';

interface NavigationState {
  currentScreen: string;
  history: NavigationHistoryItem[];
  canGoBack: boolean;
  canGoForward: boolean;
}

export function useMobileNavigation(options: UseMobileNavigationOptions) {
  const {
    type,
    initialScreen = 'home',
    persistState = true,
    animateTransitions = true,
  } = options;

  const [state, setState] = useState<NavigationState>({
    currentScreen: initialScreen,
    history: [
      {
        screen: initialScreen,
        timestamp: new Date(),
        title: initialScreen.charAt(0).toUpperCase() + initialScreen.slice(1),
      },
    ],
    canGoBack: false,
    canGoForward: false,
  });

  // Navigation functions
  const navigate = useCallback((screen: string, params?: Record<string, any>) => {
    setState(prev => {
      const newHistoryItem: NavigationHistoryItem = {
        screen,
        params,
        timestamp: new Date(),
        title: screen.charAt(0).toUpperCase() + screen.slice(1),
      };

      const newHistory = [...prev.history, newHistoryItem];
      
      return {
        currentScreen: screen,
        history: newHistory,
        canGoBack: newHistory.length > 1,
        canGoForward: false, // Clear forward history when navigating
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.history.length <= 1) return prev;

      const newHistory = prev.history.slice(0, -1);
      const previousScreen = newHistory[newHistory.length - 1];

      return {
        currentScreen: previousScreen.screen,
        history: newHistory,
        canGoBack: newHistory.length > 1,
        canGoForward: true,
      };
    });
  }, []);

  const goForward = useCallback(() => {
    // Implementation for forward navigation would require a more complex history structure
    console.log('Forward navigation not implemented in this simple version');
  }, []);

  const reset = useCallback((screen: string = initialScreen) => {
    setState({
      currentScreen: screen,
      history: [
        {
          screen,
          timestamp: new Date(),
          title: screen.charAt(0).toUpperCase() + screen.slice(1),
        },
      ],
      canGoBack: false,
      canGoForward: false,
    });
  }, [initialScreen]);

  const replace = useCallback((screen: string, params?: Record<string, any>) => {
    setState(prev => {
      const newHistoryItem: NavigationHistoryItem = {
        screen,
        params,
        timestamp: new Date(),
        title: screen.charAt(0).toUpperCase() + screen.slice(1),
      };

      const newHistory = [...prev.history.slice(0, -1), newHistoryItem];
      
      return {
        currentScreen: screen,
        history: newHistory,
        canGoBack: newHistory.length > 1,
        canGoForward: false,
      };
    });
  }, []);

  // Persist navigation state to localStorage
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      const storageKey = `mobile-navigation-${type}`;
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, persistState, type]);

  // Load persisted navigation state
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      const storageKey = `mobile-navigation-${type}`;
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          // Validate the saved state before applying
          if (parsedState.currentScreen && Array.isArray(parsedState.history)) {
            setState(parsedState);
          }
        } catch (error) {
          console.warn('Failed to load persisted navigation state:', error);
        }
      }
    }
  }, [persistState, type]);

  return {
    currentScreen: state.currentScreen,
    history: state.history,
    canGoBack: state.canGoBack,
    canGoForward: state.canGoForward,
    navigate,
    goBack,
    goForward,
    reset,
    replace,
  };
}

export default useMobileNavigation; 