/**
 * Mobile Navigation Hook
 * React hook for managing mobile navigation state and interactions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  mobileNavigationService, 
  NavigationState, 
  NavigationItem, 
  NavigationSection, 
  FloatingActionButton,
  BreadcrumbItem,
  NavigationConfig
} from '@/lib/services/mobile-navigation-service';
import { gestureService } from '@/lib/services/gesture-service';

export interface UseMobileNavigationOptions {
  userRole?: string;
  enableHapticFeedback?: boolean;
  autoSyncWithRouter?: boolean;
}

export interface UseMobileNavigationReturn {
  // State
  navigationState: NavigationState;
  tabItems: NavigationItem[];
  menuSections: NavigationSection[];
  floatingButtons: FloatingActionButton[];
  breadcrumbs: BreadcrumbItem[];
  
  // Actions
  navigate: (path: string, replace?: boolean) => void;
  goBack: () => boolean;
  toggleMenu: (isOpen?: boolean) => void;
  toggleSearch: (isOpen?: boolean) => void;
  updateSearchQuery: (query: string) => void;
  scrollToTop: () => void;
  
  // Utilities
  isActive: (path: string) => boolean;
  canGoBack: boolean;
  addNavigationItem: (item: NavigationItem) => void;
  addFloatingButton: (button: FloatingActionButton) => void;
  updateConfig: (config: Partial<NavigationConfig>) => void;
}

export const useMobileNavigation = (
  options: UseMobileNavigationOptions = {}
): UseMobileNavigationReturn => {
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    userRole,
    enableHapticFeedback = true,
    autoSyncWithRouter = true
  } = options;

  // State
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );
  const [tabItems, setTabItems] = useState<NavigationItem[]>([]);
  const [menuSections, setMenuSections] = useState<NavigationSection[]>([]);
  const [floatingButtons, setFloatingButtons] = useState<FloatingActionButton[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Update navigation items when user role changes
  useEffect(() => {
    setTabItems(mobileNavigationService.getTabItems(userRole));
    setMenuSections(mobileNavigationService.getMenuSections(userRole));
    setFloatingButtons(mobileNavigationService.getFloatingButtons(userRole));
  }, [userRole]);

  // Subscribe to navigation state changes
  useEffect(() => {
    const unsubscribe = mobileNavigationService.onStateChange((state) => {
      setNavigationState(state);
      setBreadcrumbs(mobileNavigationService.generateBreadcrumbs());
      setFloatingButtons(mobileNavigationService.getFloatingButtons(userRole));
    });

    return unsubscribe;
  }, [userRole]);

  // Sync with router pathname
  useEffect(() => {
    if (autoSyncWithRouter) {
      mobileNavigationService.navigate(pathname, true);
    }
  }, [pathname, autoSyncWithRouter]);

  // Navigation actions
  const navigate = useCallback((path: string, replace = false) => {
    if (enableHapticFeedback) {
      gestureService.triggerHaptic('light');
    }
    
    router.push(path);
    mobileNavigationService.navigate(path, replace);
  }, [router, enableHapticFeedback]);

  const goBack = useCallback(() => {
    if (enableHapticFeedback) {
      gestureService.triggerHaptic('light');
    }
    
    const didGoBack = mobileNavigationService.goBack();
    
    if (!didGoBack) {
      // Fallback to router back
      router.back();
    }
    
    return didGoBack;
  }, [router, enableHapticFeedback]);

  const toggleMenu = useCallback((isOpen?: boolean) => {
    if (enableHapticFeedback) {
      gestureService.triggerHaptic('selection');
    }
    
    mobileNavigationService.toggleMenu(isOpen);
  }, [enableHapticFeedback]);

  const toggleSearch = useCallback((isOpen?: boolean) => {
    if (enableHapticFeedback) {
      gestureService.triggerHaptic('selection');
    }
    
    mobileNavigationService.toggleSearch(isOpen);
  }, [enableHapticFeedback]);

  const updateSearchQuery = useCallback((query: string) => {
    mobileNavigationService.updateSearchQuery(query);
  }, []);

  const scrollToTop = useCallback(() => {
    if (enableHapticFeedback) {
      gestureService.triggerHaptic('light');
    }
    
    mobileNavigationService.scrollToTop();
  }, [enableHapticFeedback]);

  // Utilities
  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return navigationState.currentPath === '/';
    }
    return navigationState.currentPath.startsWith(path);
  }, [navigationState.currentPath]);

  const addNavigationItem = useCallback((item: NavigationItem) => {
    mobileNavigationService.addNavigationItem(item);
    
    // Update local state
    setTabItems(mobileNavigationService.getTabItems(userRole));
    setMenuSections(mobileNavigationService.getMenuSections(userRole));
  }, [userRole]);

  const addFloatingButton = useCallback((button: FloatingActionButton) => {
    mobileNavigationService.addFloatingButton(button);
    
    // Update local state
    setFloatingButtons(mobileNavigationService.getFloatingButtons(userRole));
  }, [userRole]);

  const updateConfig = useCallback((config: Partial<NavigationConfig>) => {
    mobileNavigationService.updateConfig(config);
  }, []);

  return {
    // State
    navigationState,
    tabItems,
    menuSections,
    floatingButtons,
    breadcrumbs,
    
    // Actions
    navigate,
    goBack,
    toggleMenu,
    toggleSearch,
    updateSearchQuery,
    scrollToTop,
    
    // Utilities
    isActive,
    canGoBack: navigationState.canGoBack,
    addNavigationItem,
    addFloatingButton,
    updateConfig
  };
};

// Hook for search functionality
export interface UseSearchOptions {
  onSearch?: (query: string) => Promise<any[]>;
  debounceMs?: number;
  minQueryLength?: number;
}

export interface UseSearchReturn {
  query: string;
  results: any[];
  isLoading: boolean;
  isOpen: boolean;
  updateQuery: (query: string) => void;
  clearResults: () => void;
  toggleSearch: (isOpen?: boolean) => void;
}

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    onSearch,
    debounceMs = 300,
    minQueryLength = 2
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Subscribe to navigation search state
  useEffect(() => {
    const unsubscribe = mobileNavigationService.onStateChange((state) => {
      setQuery(state.searchQuery);
      setIsOpen(state.isSearchOpen);
    });

    return unsubscribe;
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.length >= minQueryLength && onSearch) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const searchResults = await onSearch(query);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);

      setDebounceTimer(timer);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query, onSearch, debounceMs, minQueryLength]);

  const updateQuery = useCallback((newQuery: string) => {
    mobileNavigationService.updateSearchQuery(newQuery);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
    mobileNavigationService.updateSearchQuery('');
  }, []);

  const toggleSearch = useCallback((open?: boolean) => {
    mobileNavigationService.toggleSearch(open);
  }, []);

  return {
    query,
    results,
    isLoading,
    isOpen,
    updateQuery,
    clearResults,
    toggleSearch
  };
};

// Hook for breadcrumb navigation
export interface UseBreadcrumbsOptions {
  customBreadcrumbs?: BreadcrumbItem[];
  maxItems?: number;
}

export interface UseBreadcrumbsReturn {
  breadcrumbs: BreadcrumbItem[];
  navigateTo: (path: string) => void;
  generateBreadcrumbs: (custom?: BreadcrumbItem[]) => BreadcrumbItem[];
}

export const useBreadcrumbs = (
  options: UseBreadcrumbsOptions = {}
): UseBreadcrumbsReturn => {
  const { customBreadcrumbs, maxItems = 5 } = options;
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const updateBreadcrumbs = () => {
      let crumbs = mobileNavigationService.generateBreadcrumbs(customBreadcrumbs);
      
      // Limit breadcrumbs if needed
      if (maxItems && crumbs.length > maxItems) {
        crumbs = [
          crumbs[0], // Keep home
          { label: '...', isActive: false }, // Ellipsis
          ...crumbs.slice(-(maxItems - 2)) // Keep last items
        ];
      }
      
      setBreadcrumbs(crumbs);
    };

    updateBreadcrumbs();

    const unsubscribe = mobileNavigationService.onStateChange(updateBreadcrumbs);
    return unsubscribe;
  }, [customBreadcrumbs, maxItems]);

  const navigateTo = useCallback((path: string) => {
    router.push(path);
    mobileNavigationService.navigate(path);
    gestureService.triggerHaptic('light');
  }, [router]);

  const generateBreadcrumbs = useCallback((custom?: BreadcrumbItem[]) => {
    return mobileNavigationService.generateBreadcrumbs(custom);
  }, []);

  return {
    breadcrumbs,
    navigateTo,
    generateBreadcrumbs
  };
};

// Hook for floating action buttons
export interface UseFloatingButtonsOptions {
  userRole?: string;
  contextualButtons?: FloatingActionButton[];
}

export interface UseFloatingButtonsReturn {
  buttons: FloatingActionButton[];
  addButton: (button: FloatingActionButton) => void;
  removeButton: (buttonId: string) => void;
  updateButtonVisibility: (buttonId: string, isVisible: boolean) => void;
}

export const useFloatingButtons = (
  options: UseFloatingButtonsOptions = {}
): UseFloatingButtonsReturn => {
  const { userRole, contextualButtons = [] } = options;
  const [buttons, setButtons] = useState<FloatingActionButton[]>([]);

  useEffect(() => {
    const updateButtons = () => {
      const serviceButtons = mobileNavigationService.getFloatingButtons(userRole);
      const allButtons = [...serviceButtons, ...contextualButtons];
      setButtons(allButtons);
    };

    updateButtons();

    const unsubscribe = mobileNavigationService.onStateChange(updateButtons);
    return unsubscribe;
  }, [userRole, contextualButtons]);

  const addButton = useCallback((button: FloatingActionButton) => {
    mobileNavigationService.addFloatingButton(button);
  }, []);

  const removeButton = useCallback((buttonId: string) => {
    // Remove from service and update local state
    const serviceButtons = mobileNavigationService.getFloatingButtons(userRole);
    const filteredButtons = serviceButtons.filter(button => button.id !== buttonId);
    
    // This is a simplified approach - in practice, you'd want a removeButton method in the service
    setButtons(prev => prev.filter(button => button.id !== buttonId));
  }, [userRole]);

  const updateButtonVisibility = useCallback((buttonId: string, isVisible: boolean) => {
    setButtons(prev => 
      prev.map(button => 
        button.id === buttonId 
          ? { ...button, isVisible }
          : button
      )
    );
  }, []);

  return {
    buttons,
    addButton,
    removeButton,
    updateButtonVisibility
  };
};

// Hook for gesture-based navigation
export interface UseNavigationGesturesOptions {
  enableSwipeBack?: boolean;
  enablePullToRefresh?: boolean;
  enableSwipeToMenu?: boolean;
  onSwipeBack?: () => void;
  onPullToRefresh?: () => void;
  onSwipeToMenu?: () => void;
}

export const useNavigationGestures = (
  options: UseNavigationGesturesOptions = {}
) => {
  const {
    enableSwipeBack = true,
    enablePullToRefresh = false,
    enableSwipeToMenu = true,
    onSwipeBack,
    onPullToRefresh,
    onSwipeToMenu
  } = options;

  const { goBack, toggleMenu } = useMobileNavigation();

  useEffect(() => {
    const handleGesture = (gestureType: string, data: any) => {
      switch (gestureType) {
        case 'swipe-right':
          if (enableSwipeBack && data.startX < 50) {
            onSwipeBack ? onSwipeBack() : goBack();
          }
          break;
          
        case 'swipe-left':
          if (enableSwipeToMenu && data.startX < 50) {
            onSwipeToMenu ? onSwipeToMenu() : toggleMenu(true);
          }
          break;
          
        case 'pull-down':
          if (enablePullToRefresh && data.startY < 100) {
            if (onPullToRefresh) {
              onPullToRefresh();
            } else {
              window.location.reload();
            }
          }
          break;
      }
    };

    // Listen for gesture events
    window.addEventListener('gesture', handleGesture as EventListener);

    return () => {
      window.removeEventListener('gesture', handleGesture as EventListener);
    };
  }, [
    enableSwipeBack,
    enablePullToRefresh, 
    enableSwipeToMenu,
    onSwipeBack,
    onPullToRefresh,
    onSwipeToMenu,
    goBack,
    toggleMenu
  ]);

  return {
    enableSwipeBack,
    enablePullToRefresh,
    enableSwipeToMenu
  };
}; 