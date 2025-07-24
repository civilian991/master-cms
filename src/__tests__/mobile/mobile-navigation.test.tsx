/**
 * Mobile Navigation System Tests
 * Testing mobile navigation service, components, and hooks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  MobileNavigationService, 
  mobileNavigationService,
  NavigationItem,
  FloatingActionButton
} from '@/lib/services/mobile-navigation-service';
import { 
  BottomTabNavigation,
  HamburgerMenu,
  SearchOverlay,
  FloatingActionButtons,
  BreadcrumbNavigation,
  BackButton,
  MenuToggle
} from '@/components/mobile/MobileNavigation';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { gestureService } from '@/lib/services/gesture-service';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('next-auth/react');
jest.mock('@/lib/services/gesture-service');

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  pathname: '/'
};

const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER'
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useSession as jest.Mock).mockReturnValue({ data: mockSession });
  (gestureService.triggerHaptic as jest.Mock).mockImplementation(() => {});
  
  // Reset service state
  mobileNavigationService.reset();
});

describe('MobileNavigationService', () => {
  let service: MobileNavigationService;

  beforeEach(() => {
    service = MobileNavigationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MobileNavigationService.getInstance();
      const instance2 = MobileNavigationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Navigation State Management', () => {
    it('should initialize with default state', () => {
      const state = service.getState();
      expect(state.currentPath).toBe('/');
      expect(state.isMenuOpen).toBe(false);
      expect(state.isSearchOpen).toBe(false);
      expect(state.activeTab).toBe('home');
      expect(state.canGoBack).toBe(false);
    });

    it('should update state when navigating', () => {
      service.navigate('/articles');
      const state = service.getState();
      
      expect(state.currentPath).toBe('/articles');
      expect(state.activeTab).toBe('articles');
      expect(state.canGoBack).toBe(true);
    });

    it('should maintain navigation history', () => {
      service.navigate('/articles');
      service.navigate('/articles/123');
      
      const state = service.getState();
      expect(state.history).toEqual(['/', '/articles', '/articles/123']);
      expect(state.canGoBack).toBe(true);
    });

    it('should limit history length', () => {
      service.updateConfig({ maxHistoryLength: 3 });
      
      // Navigate to more pages than the limit
      for (let i = 1; i <= 5; i++) {
        service.navigate(`/page-${i}`);
      }
      
      const state = service.getState();
      expect(state.history.length).toBe(3);
    });
  });

  describe('Menu and Search Management', () => {
    it('should toggle menu state', () => {
      service.toggleMenu(true);
      expect(service.getState().isMenuOpen).toBe(true);
      
      service.toggleMenu(false);
      expect(service.getState().isMenuOpen).toBe(false);
    });

    it('should close search when menu opens', () => {
      service.toggleSearch(true);
      service.toggleMenu(true);
      
      const state = service.getState();
      expect(state.isMenuOpen).toBe(true);
      expect(state.isSearchOpen).toBe(false);
    });

    it('should update search query', () => {
      const query = 'test search';
      service.updateSearchQuery(query);
      
      expect(service.getState().searchQuery).toBe(query);
    });
  });

  describe('Navigation Items Management', () => {
    it('should filter tab items by user role', () => {
      const tabItems = service.getTabItems('USER');
      const dashboardItem = tabItems.find(item => item.id === 'dashboard');
      
      expect(dashboardItem).toBeDefined();
    });

    it('should filter tab items for anonymous users', () => {
      const tabItems = service.getTabItems();
      const dashboardItem = tabItems.find(item => item.id === 'dashboard');
      
      expect(dashboardItem).toBeUndefined();
    });

    it('should add custom navigation items', () => {
      const customItem: NavigationItem = {
        id: 'custom',
        label: 'Custom',
        icon: 'star',
        path: '/custom',
        showInTabs: true,
        showInMenu: true,
        order: 10
      };

      service.addNavigationItem(customItem);
      const tabItems = service.getTabItems();
      
      expect(tabItems.find(item => item.id === 'custom')).toBeDefined();
    });
  });

  describe('Floating Action Buttons', () => {
    it('should manage floating button visibility', () => {
      // Navigate to an article page to trigger contextual buttons
      service.navigate('/articles/123');
      
      const buttons = service.getFloatingButtons('EDITOR');
      const writeButton = buttons.find(button => button.id === 'write');
      
      expect(writeButton?.isVisible).toBe(true);
    });

    it('should add custom floating buttons', () => {
      const customButton: FloatingActionButton = {
        id: 'custom-action',
        icon: 'star',
        label: 'Custom Action',
        action: jest.fn(),
        position: 'bottom-right',
        color: 'primary',
        size: 'md',
        isVisible: true
      };

      service.addFloatingButton(customButton);
      const buttons = service.getFloatingButtons();
      
      expect(buttons.find(button => button.id === 'custom-action')).toBeDefined();
    });
  });

  describe('Breadcrumb Generation', () => {
    it('should generate breadcrumbs for nested paths', () => {
      service.navigate('/articles/category/tech');
      const breadcrumbs = service.generateBreadcrumbs();
      
      expect(breadcrumbs).toHaveLength(4); // Home + Articles + Category + Tech
      expect(breadcrumbs[0].label).toBe('Home');
      expect(breadcrumbs[3].isActive).toBe(true);
    });

    it('should use custom breadcrumbs when provided', () => {
      const customBreadcrumbs = [
        { label: 'Custom Home', path: '/' },
        { label: 'Custom Page', isActive: true }
      ];

      const breadcrumbs = service.generateBreadcrumbs(customBreadcrumbs);
      expect(breadcrumbs).toEqual(customBreadcrumbs);
    });
  });

  describe('State Change Listeners', () => {
    it('should notify listeners of state changes', () => {
      const listener = jest.fn();
      const unsubscribe = service.onStateChange(listener);
      
      service.navigate('/test');
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
      service.navigate('/test2');
      
      // Should only be called once since we unsubscribed
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BottomTabNavigation Component', () => {
  it('should render tab items', () => {
    render(<BottomTabNavigation userRole="USER" />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should handle tab clicks', () => {
    render(<BottomTabNavigation userRole="USER" />);
    
    const articlesTab = screen.getByText('Articles');
    fireEvent.click(articlesTab);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/articles');
  });

  it('should show active tab', () => {
    // Mock current path
    jest.spyOn(mobileNavigationService, 'getState').mockReturnValue({
      ...mobileNavigationService.getState(),
      activeTab: 'articles'
    });

    render(<BottomTabNavigation userRole="USER" />);
    
    const articlesTab = screen.getByText('Articles').closest('button');
    expect(articlesTab).toHaveClass('bg-accent');
  });

  it('should handle search tab specially', () => {
    render(<BottomTabNavigation userRole="USER" />);
    
    const searchTab = screen.getByText('Search');
    fireEvent.click(searchTab);
    
    // Should open search overlay instead of navigating
    expect(mobileNavigationService.getState().isSearchOpen).toBe(true);
  });
});

describe('HamburgerMenu Component', () => {
  it('should render menu sections', () => {
    // Open the menu first
    act(() => {
      mobileNavigationService.toggleMenu(true);
    });

    render(<HamburgerMenu userRole="USER" />);
    
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Main Navigation')).toBeInTheDocument();
  });

  it('should handle menu item clicks', () => {
    act(() => {
      mobileNavigationService.toggleMenu(true);
    });

    render(<HamburgerMenu userRole="USER" />);
    
    const homeItem = screen.getByText('Home');
    fireEvent.click(homeItem);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
    expect(mobileNavigationService.getState().isMenuOpen).toBe(false);
  });

  it('should close menu when backdrop is clicked', () => {
    act(() => {
      mobileNavigationService.toggleMenu(true);
    });

    render(<HamburgerMenu userRole="USER" />);
    
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mobileNavigationService.getState().isMenuOpen).toBe(false);
    }
  });
});

describe('SearchOverlay Component', () => {
  it('should open search overlay', () => {
    act(() => {
      mobileNavigationService.toggleSearch(true);
    });

    render(<SearchOverlay />);
    
    expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    act(() => {
      mobileNavigationService.toggleSearch(true);
    });

    render(<SearchOverlay />);
    
    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(mobileNavigationService.getState().searchQuery).toBe('test query');
    });
  });

  it('should show search results', async () => {
    const mockOnSearch = jest.fn().mockResolvedValue([
      { id: 1, title: 'Test Article', type: 'article', path: '/articles/1' }
    ]);

    act(() => {
      mobileNavigationService.toggleSearch(true);
    });

    render(<SearchOverlay onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });

  it('should close search when back button is clicked', () => {
    act(() => {
      mobileNavigationService.toggleSearch(true);
    });

    render(<SearchOverlay />);
    
    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);
    
    expect(mobileNavigationService.getState().isSearchOpen).toBe(false);
  });
});

describe('FloatingActionButtons Component', () => {
  it('should render visible floating buttons', () => {
    // Set up a visible button
    const testButton: FloatingActionButton = {
      id: 'test-fab',
      icon: 'plus',
      label: 'Test Action',
      action: jest.fn(),
      position: 'bottom-right',
      color: 'primary',
      size: 'lg',
      isVisible: true
    };

    act(() => {
      mobileNavigationService.addFloatingButton(testButton);
    });

    render(<FloatingActionButtons userRole="USER" />);
    
    const button = screen.getByTitle('Test Action');
    expect(button).toBeInTheDocument();
  });

  it('should handle button clicks', () => {
    const mockAction = jest.fn();
    const testButton: FloatingActionButton = {
      id: 'test-fab',
      icon: 'plus',
      label: 'Test Action',
      action: mockAction,
      position: 'bottom-right',
      color: 'primary',
      size: 'lg',
      isVisible: true
    };

    act(() => {
      mobileNavigationService.addFloatingButton(testButton);
    });

    render(<FloatingActionButtons userRole="USER" />);
    
    const button = screen.getByTitle('Test Action');
    fireEvent.click(button);
    
    expect(mockAction).toHaveBeenCalled();
    expect(gestureService.triggerHaptic).toHaveBeenCalledWith('medium');
  });
});

describe('BreadcrumbNavigation Component', () => {
  it('should render breadcrumbs', () => {
    act(() => {
      mobileNavigationService.navigate('/articles/category/tech');
    });

    render(<BreadcrumbNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
  });

  it('should handle breadcrumb clicks', () => {
    act(() => {
      mobileNavigationService.navigate('/articles/category');
    });

    render(<BreadcrumbNavigation />);
    
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('should not render for single breadcrumb', () => {
    act(() => {
      mobileNavigationService.navigate('/');
    });

    render(<BreadcrumbNavigation />);
    
    // Should not render anything for home page
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});

describe('BackButton Component', () => {
  it('should handle back navigation', () => {
    // Set up history
    act(() => {
      mobileNavigationService.navigate('/articles');
      mobileNavigationService.navigate('/articles/123');
    });

    render(<BackButton />);
    
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(mobileNavigationService.getState().currentPath).toBe('/articles');
  });

  it('should use fallback path when no history', () => {
    render(<BackButton fallbackPath="/custom" />);
    
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/custom');
  });
});

describe('MenuToggle Component', () => {
  it('should toggle menu state', () => {
    render(<MenuToggle />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    expect(mobileNavigationService.getState().isMenuOpen).toBe(true);
    
    fireEvent.click(toggleButton);
    expect(mobileNavigationService.getState().isMenuOpen).toBe(false);
  });

  it('should show correct icon based on menu state', () => {
    const { rerender } = render(<MenuToggle />);
    
    // Menu closed - should show menu icon
    expect(document.querySelector('[data-lucide="menu"]')).toBeInTheDocument();
    
    act(() => {
      mobileNavigationService.toggleMenu(true);
    });
    
    rerender(<MenuToggle />);
    
    // Menu open - should show X icon
    expect(document.querySelector('[data-lucide="x"]')).toBeInTheDocument();
  });
});

describe('useMobileNavigation Hook', () => {
  const TestComponent: React.FC<{ userRole?: string }> = ({ userRole }) => {
    const {
      navigationState,
      tabItems,
      navigate,
      toggleMenu,
      isActive
    } = useMobileNavigation({ userRole });

    return (
      <div>
        <div data-testid="current-path">{navigationState.currentPath}</div>
        <div data-testid="tab-count">{tabItems.length}</div>
        <div data-testid="menu-open">{navigationState.isMenuOpen.toString()}</div>
        <button onClick={() => navigate('/test')}>Navigate</button>
        <button onClick={() => toggleMenu()}>Toggle Menu</button>
        <div data-testid="is-active-home">{isActive('/').toString()}</div>
      </div>
    );
  };

  it('should provide navigation state', () => {
    render(<TestComponent userRole="USER" />);
    
    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(screen.getByTestId('menu-open')).toHaveTextContent('false');
  });

  it('should handle navigation', () => {
    render(<TestComponent userRole="USER" />);
    
    const navigateButton = screen.getByText('Navigate');
    fireEvent.click(navigateButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/test');
  });

  it('should filter items by user role', () => {
    const { rerender } = render(<TestComponent />);
    const anonymousTabCount = screen.getByTestId('tab-count').textContent;
    
    rerender(<TestComponent userRole="USER" />);
    const userTabCount = screen.getByTestId('tab-count').textContent;
    
    expect(Number(userTabCount)).toBeGreaterThan(Number(anonymousTabCount));
  });

  it('should handle menu toggle', () => {
    render(<TestComponent userRole="USER" />);
    
    const toggleButton = screen.getByText('Toggle Menu');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('menu-open')).toHaveTextContent('true');
  });

  it('should provide isActive utility', () => {
    render(<TestComponent userRole="USER" />);
    
    expect(screen.getByTestId('is-active-home')).toHaveTextContent('true');
  });
});

describe('Mobile Navigation Integration', () => {
  it('should coordinate between service and components', () => {
    render(
      <div>
        <MenuToggle />
        <HamburgerMenu userRole="USER" />
      </div>
    );
    
    // Open menu via toggle
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Check that menu is visible
    expect(screen.getByText('Menu')).toBeInTheDocument();
    
    // Close menu via backdrop
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mobileNavigationService.getState().isMenuOpen).toBe(false);
    }
  });

  it('should handle scroll direction changes', () => {
    // Mock scroll event
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    
    // Trigger scroll event
    fireEvent.scroll(window);
    
    // Check that scroll position is updated
    const state = mobileNavigationService.getState();
    expect(state.scrollPosition).toBe(100);
  });

  it('should handle keyboard visibility changes', () => {
    // Mock visual viewport API
    const mockVisualViewport = {
      height: 400,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    Object.defineProperty(window, 'visualViewport', {
      value: mockVisualViewport,
      writable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true
    });
    
    // Simulate keyboard appearing (viewport height < 75% of window height)
    mockVisualViewport.height = 500;
    fireEvent(window, new Event('resize'));
    
    const state = mobileNavigationService.getState();
    expect(state.isKeyboardVisible).toBe(true);
  });
}); 