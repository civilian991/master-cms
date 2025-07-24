/**
 * Mobile Navigation Service
 * Manages mobile navigation state, routing, and user experience
 */

export type NavigationMode = 'bottom-tabs' | 'hamburger' | 'combined';
export type NavigationTheme = 'light' | 'dark' | 'auto';
export type SearchMode = 'overlay' | 'inline' | 'modal';

export interface NavigationItem {
  id: string;
  label: string;
  labelAr?: string;
  icon: string;
  activeIcon?: string;
  path: string;
  badge?: number | string;
  isExternal?: boolean;
  requiredRole?: string[];
  hideOnMobile?: boolean;
  showInTabs?: boolean;
  showInMenu?: boolean;
  order: number;
  category?: string;
}

export interface NavigationSection {
  id: string;
  title: string;
  titleAr?: string;
  items: NavigationItem[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  requiredRole?: string[];
}

export interface FloatingActionButton {
  id: string;
  icon: string;
  label: string;
  labelAr?: string;
  action: () => void;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center';
  color: string;
  size: 'sm' | 'md' | 'lg';
  isVisible: boolean;
  requiredRole?: string[];
  contextual?: boolean;
  hideOnScroll?: boolean;
}

export interface NavigationState {
  currentPath: string;
  isMenuOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  activeTab: string;
  scrollDirection: 'up' | 'down' | 'none';
  scrollPosition: number;
  isKeyboardVisible: boolean;
  history: string[];
  canGoBack: boolean;
}

export interface NavigationConfig {
  mode: NavigationMode;
  theme: NavigationTheme;
  searchMode: SearchMode;
  enableGestures: boolean;
  enableHapticFeedback: boolean;
  autoHideOnScroll: boolean;
  persistentTabs: boolean;
  maxHistoryLength: number;
}

export interface BreadcrumbItem {
  label: string;
  labelAr?: string;
  path?: string;
  isActive?: boolean;
}

export class MobileNavigationService {
  private static instance: MobileNavigationService;
  private state: NavigationState;
  private config: NavigationConfig;
  private navigationItems: NavigationItem[] = [];
  private navigationSections: NavigationSection[] = [];
  private floatingButtons: FloatingActionButton[] = [];
  private stateChangeListeners: Set<(state: NavigationState) => void> = new Set();
  private routeChangeListeners: Set<(path: string) => void> = new Set();

  public static getInstance(): MobileNavigationService {
    if (!MobileNavigationService.instance) {
      MobileNavigationService.instance = new MobileNavigationService();
    }
    return MobileNavigationService.instance;
  }

  private constructor() {
    this.state = {
      currentPath: '/',
      isMenuOpen: false,
      isSearchOpen: false,
      searchQuery: '',
      activeTab: 'home',
      scrollDirection: 'none',
      scrollPosition: 0,
      isKeyboardVisible: false,
      history: ['/'],
      canGoBack: false
    };

    this.config = {
      mode: 'combined',
      theme: 'auto',
      searchMode: 'overlay',
      enableGestures: true,
      enableHapticFeedback: true,
      autoHideOnScroll: false,
      persistentTabs: true,
      maxHistoryLength: 50
    };

    this.initializeDefaultNavigation();
    this.setupEventListeners();
  }

  /**
   * Initialize default navigation items
   */
  private initializeDefaultNavigation(): void {
    this.navigationItems = [
      {
        id: 'home',
        label: 'Home',
        labelAr: 'الرئيسية',
        icon: 'home',
        path: '/',
        showInTabs: true,
        showInMenu: true,
        order: 1
      },
      {
        id: 'articles',
        label: 'Articles',
        labelAr: 'المقالات',
        icon: 'newspaper',
        path: '/articles',
        showInTabs: true,
        showInMenu: true,
        order: 2
      },
      {
        id: 'categories',
        label: 'Categories',
        labelAr: 'التصنيفات',
        icon: 'folder',
        path: '/categories',
        showInTabs: false,
        showInMenu: true,
        order: 3
      },
      {
        id: 'search',
        label: 'Search',
        labelAr: 'البحث',
        icon: 'search',
        path: '/search',
        showInTabs: true,
        showInMenu: true,
        order: 4
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        labelAr: 'لوحة التحكم',
        icon: 'user',
        path: '/dashboard',
        showInTabs: true,
        showInMenu: true,
        order: 5,
        requiredRole: ['USER', 'EDITOR', 'ADMIN']
      }
    ];

    this.navigationSections = [
      {
        id: 'main',
        title: 'Main Navigation',
        titleAr: 'التنقل الرئيسي',
        items: this.navigationItems.filter(item => ['home', 'articles', 'categories'].includes(item.id)),
        defaultExpanded: true
      },
      {
        id: 'user',
        title: 'User',
        titleAr: 'المستخدم',
        items: this.navigationItems.filter(item => ['dashboard', 'search'].includes(item.id)),
        defaultExpanded: true,
        requiredRole: ['USER', 'EDITOR', 'ADMIN']
      }
    ];

    this.floatingButtons = [
      {
        id: 'write',
        icon: 'plus',
        label: 'Write',
        labelAr: 'كتابة',
        action: () => this.navigate('/dashboard/articles/new'),
        position: 'bottom-right',
        color: 'primary',
        size: 'lg',
        isVisible: false,
        requiredRole: ['EDITOR', 'ADMIN'],
        contextual: true
      },
      {
        id: 'scroll-top',
        icon: 'arrow-up',
        label: 'Back to Top',
        labelAr: 'العودة للأعلى',
        action: () => this.scrollToTop(),
        position: 'bottom-center',
        color: 'secondary',
        size: 'sm',
        isVisible: false,
        hideOnScroll: false
      }
    ];
  }

  /**
   * Set up event listeners for scroll and keyboard
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    let scrollTimer: NodeJS.Timeout;
    let lastScrollY = 0;

    // Handle scroll events
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      
      this.updateState({
        scrollDirection,
        scrollPosition: currentScrollY
      });

      // Update floating button visibility
      this.updateFloatingButtonVisibility();

      lastScrollY = currentScrollY;

      // Clear existing timer
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // Set scroll direction to none after scroll stops
      scrollTimer = setTimeout(() => {
        this.updateState({ scrollDirection: 'none' });
      }, 150);
    };

    // Handle resize events for keyboard detection
    const handleResize = () => {
      if (window.visualViewport) {
        const isKeyboardVisible = window.visualViewport.height < window.innerHeight * 0.75;
        this.updateState({ isKeyboardVisible });
      }
    };

    // Handle popstate for back button
    const handlePopstate = () => {
      this.updateHistory(window.location.pathname);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('popstate', handlePopstate);

    // Visual viewport API for better keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
  }

  /**
   * Update navigation state
   */
  private updateState(updates: Partial<NavigationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Navigation state listener error:', error);
      }
    });
  }

  /**
   * Navigate to a path
   */
  public navigate(path: string, replace: boolean = false): void {
    if (this.state.currentPath === path) return;

    const previousPath = this.state.currentPath;
    
    this.updateState({ currentPath: path });
    this.updateHistory(path, replace);
    this.updateActiveTab(path);
    
    // Close menu and search on navigation
    if (this.state.isMenuOpen) {
      this.toggleMenu(false);
    }
    if (this.state.isSearchOpen) {
      this.toggleSearch(false);
    }

    // Notify route change listeners
    this.routeChangeListeners.forEach(listener => {
      try {
        listener(path);
      } catch (error) {
        console.error('Route change listener error:', error);
      }
    });

    // Update floating button context
    this.updateFloatingButtonContext(path);
  }

  /**
   * Update navigation history
   */
  private updateHistory(path: string, replace: boolean = false): void {
    let newHistory = [...this.state.history];
    
    if (replace && newHistory.length > 0) {
      newHistory[newHistory.length - 1] = path;
    } else {
      newHistory.push(path);
      
      // Limit history length
      if (newHistory.length > this.config.maxHistoryLength) {
        newHistory = newHistory.slice(-this.config.maxHistoryLength);
      }
    }

    this.updateState({
      history: newHistory,
      canGoBack: newHistory.length > 1
    });
  }

  /**
   * Update active tab based on path
   */
  private updateActiveTab(path: string): void {
    const matchingItem = this.navigationItems.find(item => {
      if (item.path === '/') {
        return path === '/';
      }
      return path.startsWith(item.path);
    });

    if (matchingItem) {
      this.updateState({ activeTab: matchingItem.id });
    }
  }

  /**
   * Update floating button context based on path
   */
  private updateFloatingButtonContext(path: string): void {
    this.floatingButtons.forEach(button => {
      if (button.contextual) {
        // Show write button on article pages
        if (button.id === 'write' && path.startsWith('/articles/')) {
          button.isVisible = true;
        }
        // Hide write button on write page
        else if (button.id === 'write' && path.includes('/new')) {
          button.isVisible = false;
        }
      }
    });
  }

  /**
   * Update floating button visibility based on scroll
   */
  private updateFloatingButtonVisibility(): void {
    const scrollThreshold = 200;
    
    this.floatingButtons.forEach(button => {
      if (button.id === 'scroll-top') {
        button.isVisible = this.state.scrollPosition > scrollThreshold;
      }
    });
  }

  /**
   * Go back in navigation history
   */
  public goBack(): boolean {
    if (!this.state.canGoBack || this.state.history.length <= 1) {
      return false;
    }

    const newHistory = [...this.state.history];
    newHistory.pop(); // Remove current page
    const previousPath = newHistory[newHistory.length - 1];

    this.updateState({
      history: newHistory,
      canGoBack: newHistory.length > 1,
      currentPath: previousPath
    });

    this.updateActiveTab(previousPath);
    
    // Update browser history
    if (typeof window !== 'undefined') {
      window.history.back();
    }

    return true;
  }

  /**
   * Toggle hamburger menu
   */
  public toggleMenu(isOpen?: boolean): void {
    const newIsOpen = isOpen !== undefined ? isOpen : !this.state.isMenuOpen;
    this.updateState({ isMenuOpen: newIsOpen });
    
    // Close search if menu is opening
    if (newIsOpen && this.state.isSearchOpen) {
      this.updateState({ isSearchOpen: false });
    }
  }

  /**
   * Toggle search overlay
   */
  public toggleSearch(isOpen?: boolean): void {
    const newIsOpen = isOpen !== undefined ? isOpen : !this.state.isSearchOpen;
    this.updateState({ isSearchOpen: newIsOpen });
    
    // Close menu if search is opening
    if (newIsOpen && this.state.isMenuOpen) {
      this.updateState({ isMenuOpen: false });
    }
  }

  /**
   * Update search query
   */
  public updateSearchQuery(query: string): void {
    this.updateState({ searchQuery: query });
  }

  /**
   * Scroll to top
   */
  public scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Get navigation items for tabs
   */
  public getTabItems(userRole?: string): NavigationItem[] {
    return this.navigationItems
      .filter(item => 
        item.showInTabs && 
        this.hasPermission(item, userRole)
      )
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get navigation sections for menu
   */
  public getMenuSections(userRole?: string): NavigationSection[] {
    return this.navigationSections
      .filter(section => this.hasPermission(section, userRole))
      .map(section => ({
        ...section,
        items: section.items
          .filter(item => 
            item.showInMenu && 
            this.hasPermission(item, userRole)
          )
          .sort((a, b) => a.order - b.order)
      }))
      .filter(section => section.items.length > 0);
  }

  /**
   * Get visible floating action buttons
   */
  public getFloatingButtons(userRole?: string): FloatingActionButton[] {
    return this.floatingButtons.filter(button => 
      button.isVisible && 
      this.hasPermission(button, userRole)
    );
  }

  /**
   * Check if user has permission for item
   */
  private hasPermission(item: { requiredRole?: string[] }, userRole?: string): boolean {
    if (!item.requiredRole || item.requiredRole.length === 0) {
      return true;
    }
    
    if (!userRole) {
      return false;
    }
    
    return item.requiredRole.includes(userRole);
  }

  /**
   * Generate breadcrumbs for current path
   */
  public generateBreadcrumbs(customBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = this.state.currentPath.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', labelAr: 'الرئيسية', path: '/' }
    ];

    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      
      const matchingItem = this.navigationItems.find(item => item.path === currentPath);
      if (matchingItem) {
        breadcrumbs.push({
          label: matchingItem.label,
          labelAr: matchingItem.labelAr,
          path: currentPath
        });
      } else {
        // Generate breadcrumb from segment
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        breadcrumbs.push({
          label,
          path: currentPath
        });
      }
    }

    // Mark last item as active
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isActive = true;
      breadcrumbs[breadcrumbs.length - 1].path = undefined; // Remove link from active item
    }

    return breadcrumbs;
  }

  /**
   * Add custom navigation item
   */
  public addNavigationItem(item: NavigationItem): void {
    const existingIndex = this.navigationItems.findIndex(existing => existing.id === item.id);
    
    if (existingIndex >= 0) {
      this.navigationItems[existingIndex] = item;
    } else {
      this.navigationItems.push(item);
    }
    
    // Re-sort by order
    this.navigationItems.sort((a, b) => a.order - b.order);
  }

  /**
   * Add floating action button
   */
  public addFloatingButton(button: FloatingActionButton): void {
    const existingIndex = this.floatingButtons.findIndex(existing => existing.id === button.id);
    
    if (existingIndex >= 0) {
      this.floatingButtons[existingIndex] = button;
    } else {
      this.floatingButtons.push(button);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current state
   */
  public getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  public getConfig(): NavigationConfig {
    return { ...this.config };
  }

  /**
   * Add state change listener
   */
  public onStateChange(listener: (state: NavigationState) => void): () => void {
    this.stateChangeListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  /**
   * Add route change listener
   */
  public onRouteChange(listener: (path: string) => void): () => void {
    this.routeChangeListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.routeChangeListeners.delete(listener);
    };
  }

  /**
   * Reset navigation state
   */
  public reset(): void {
    this.state = {
      currentPath: '/',
      isMenuOpen: false,
      isSearchOpen: false,
      searchQuery: '',
      activeTab: 'home',
      scrollDirection: 'none',
      scrollPosition: 0,
      isKeyboardVisible: false,
      history: ['/'],
      canGoBack: false
    };
    
    this.notifyStateChange();
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    this.stateChangeListeners.clear();
    this.routeChangeListeners.clear();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', () => {});
      window.removeEventListener('resize', () => {});
      window.removeEventListener('popstate', () => {});
    }
  }
}

// Export singleton instance
export const mobileNavigationService = MobileNavigationService.getInstance(); 