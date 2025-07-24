/**
 * Mobile Navigation Components
 * Complete mobile navigation system with bottom tabs, hamburger menu, and search
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { gestureService } from '@/lib/services/gesture-service';
import { 
  mobileNavigationService, 
  NavigationItem, 
  NavigationSection, 
  FloatingActionButton,
  NavigationState,
  BreadcrumbItem
} from '@/lib/services/mobile-navigation-service';
import { 
  Home,
  Newspaper,
  Search,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowUp,
  Folder,
  Settings,
  Bell,
  Share2,
  Bookmark,
  Heart,
  MessageCircle
} from 'lucide-react';

// Icon mapping
const iconMap = {
  home: Home,
  newspaper: Newspaper,
  search: Search,
  user: User,
  menu: Menu,
  folder: Folder,
  settings: Settings,
  bell: Bell,
  plus: Plus,
  'arrow-up': ArrowUp,
  share: Share2,
  bookmark: Bookmark,
  heart: Heart,
  message: MessageCircle
};

// Bottom Tab Navigation Component
interface BottomTabNavigationProps {
  className?: string;
  userRole?: string;
}

export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  className,
  userRole
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );
  const [tabItems, setTabItems] = useState<NavigationItem[]>([]);

  useEffect(() => {
    // Update tab items based on user role
    setTabItems(mobileNavigationService.getTabItems(userRole));

    // Subscribe to navigation state changes
    const unsubscribe = mobileNavigationService.onStateChange(setNavigationState);

    // Sync with current pathname
    mobileNavigationService.navigate(pathname, true);

    return unsubscribe;
  }, [userRole, pathname]);

  const handleTabClick = (item: NavigationItem) => {
    if (item.path === '/search') {
      mobileNavigationService.toggleSearch(true);
    } else {
      router.push(item.path);
      mobileNavigationService.navigate(item.path);
    }

    // Haptic feedback
    gestureService.triggerHaptic('selection');
  };

  const getIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Home;
    return (
      <IconComponent 
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
    );
  };

  if (tabItems.length === 0) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border",
        "transform transition-transform duration-300 ease-in-out",
        navigationState.isKeyboardVisible ? "translate-y-full" : "translate-y-0",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {tabItems.map((item) => {
          const isActive = navigationState.activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg",
                "min-w-[60px] transition-colors duration-200",
                "hover:bg-accent/50 active:bg-accent",
                isActive && "bg-accent"
              )}
            >
              <div className="relative">
                {getIcon(item.icon, isActive)}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span 
                className={cn(
                  "text-xs mt-1 transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Hamburger Menu Component
interface HamburgerMenuProps {
  className?: string;
  userRole?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  className,
  userRole
}) => {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );
  const [menuSections, setMenuSections] = useState<NavigationSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Update menu sections based on user role
    const sections = mobileNavigationService.getMenuSections(userRole);
    setMenuSections(sections);

    // Initialize expanded sections
    const defaultExpanded = new Set(
      sections
        .filter(section => section.defaultExpanded)
        .map(section => section.id)
    );
    setExpandedSections(defaultExpanded);

    // Subscribe to navigation state changes
    const unsubscribe = mobileNavigationService.onStateChange(setNavigationState);
    return unsubscribe;
  }, [userRole]);

  const handleItemClick = (item: NavigationItem) => {
    router.push(item.path);
    mobileNavigationService.navigate(item.path);
    mobileNavigationService.toggleMenu(false);

    // Haptic feedback
    gestureService.triggerHaptic('light');
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);

    // Haptic feedback
    gestureService.triggerHaptic('selection');
  };

  const closeMenu = () => {
    mobileNavigationService.toggleMenu(false);
  };

  const getIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Home;
    return (
      <IconComponent 
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
    );
  };

  return (
    <>
      {/* Backdrop */}
      {navigationState.isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-background",
          "border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out",
          navigationState.isMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMenu}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id}>
                {/* Section Header */}
                {section.isCollapsible ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <h3 className="p-2 text-sm font-medium text-muted-foreground">
                    {section.title}
                  </h3>
                )}

                {/* Section Items */}
                {(!section.isCollapsible || isExpanded) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = navigationState.currentPath === item.path ||
                        (item.path !== '/' && navigationState.currentPath.startsWith(item.path));
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg text-left",
                            "transition-colors duration-200",
                            "hover:bg-accent active:bg-accent/80",
                            isActive && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="relative">
                            {getIcon(item.icon, isActive)}
                            {item.badge && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// Search Overlay Component
interface SearchOverlayProps {
  className?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  className,
  onSearch,
  placeholder = "Search articles..."
}) => {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = mobileNavigationService.onStateChange(setNavigationState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Focus search input when overlay opens
    if (navigationState.isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [navigationState.isSearchOpen]);

  const handleSearch = async (query: string) => {
    mobileNavigationService.updateSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock search results
      const mockResults = [
        { id: 1, title: `Result for "${query}"`, type: 'article', path: '/articles/1' },
        { id: 2, title: `Another result for "${query}"`, type: 'category', path: '/categories/tech' }
      ];
      
      setSearchResults(mockResults);
      
      if (onSearch) {
        onSearch(query);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: any) => {
    router.push(result.path);
    mobileNavigationService.navigate(result.path);
    mobileNavigationService.toggleSearch(false);

    // Haptic feedback
    gestureService.triggerHaptic('light');
  };

  const closeSearch = () => {
    mobileNavigationService.toggleSearch(false);
    mobileNavigationService.updateSearchQuery('');
    setSearchResults([]);
  };

  if (!navigationState.isSearchOpen) return null;

  return (
    <div className={cn("fixed inset-0 z-50 bg-background", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={closeSearch}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder={placeholder}
            value={navigationState.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="border-none bg-accent/50 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Searching...</p>
          </div>
        )}

        {!isLoading && navigationState.searchQuery && searchResults.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No results found for "{navigationState.searchQuery}"</p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{navigationState.searchQuery}"
            </p>
            
            {searchResults.map((result) => (
              <Card 
                key={result.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent rounded-lg">
                      {result.type === 'article' ? (
                        <Newspaper className="h-4 w-4" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {result.type}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!navigationState.searchQuery && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Newspaper className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Articles</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Folder className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Categories</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Recent Searches</h3>
              <div className="space-y-2">
                <button className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Technology trends
                </button>
                <button className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Mobile development
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Floating Action Buttons Component
interface FloatingActionButtonsProps {
  className?: string;
  userRole?: string;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  className,
  userRole
}) => {
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );
  const [floatingButtons, setFloatingButtons] = useState<FloatingActionButton[]>([]);

  useEffect(() => {
    const unsubscribe = mobileNavigationService.onStateChange((state) => {
      setNavigationState(state);
      setFloatingButtons(mobileNavigationService.getFloatingButtons(userRole));
    });

    // Initial load
    setFloatingButtons(mobileNavigationService.getFloatingButtons(userRole));

    return unsubscribe;
  }, [userRole]);

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Plus;
    return <IconComponent className="h-5 w-5" />;
  };

  const getPositionClasses = (position: FloatingActionButton['position']) => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-20 right-4';
      case 'bottom-left':
        return 'bottom-20 left-4';
      case 'bottom-center':
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
      default:
        return 'bottom-20 right-4';
    }
  };

  const getSizeClasses = (size: FloatingActionButton['size']) => {
    switch (size) {
      case 'sm':
        return 'h-10 w-10';
      case 'md':
        return 'h-12 w-12';
      case 'lg':
        return 'h-14 w-14';
      default:
        return 'h-12 w-12';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/90';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };

  const handleButtonClick = (button: FloatingActionButton) => {
    // Haptic feedback
    gestureService.triggerHaptic('medium');
    
    // Execute action
    button.action();
  };

  return (
    <div className={className}>
      {floatingButtons.map((button) => (
        <button
          key={button.id}
          onClick={() => handleButtonClick(button)}
          className={cn(
            "fixed z-30 rounded-full shadow-lg transition-all duration-200",
            "hover:scale-110 active:scale-95",
            "transform transition-transform duration-300",
            navigationState.scrollDirection === 'down' && button.hideOnScroll
              ? "translate-y-20 opacity-0"
              : "translate-y-0 opacity-100",
            getPositionClasses(button.position),
            getSizeClasses(button.size),
            getColorClasses(button.color)
          )}
          title={button.label}
        >
          {getIcon(button.icon)}
        </button>
      ))}
    </div>
  );
};

// Breadcrumb Navigation Component
interface BreadcrumbNavigationProps {
  className?: string;
  customBreadcrumbs?: BreadcrumbItem[];
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  className,
  customBreadcrumbs
}) => {
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const updateBreadcrumbs = () => {
      const crumbs = mobileNavigationService.generateBreadcrumbs(customBreadcrumbs);
      setBreadcrumbs(crumbs);
    };

    updateBreadcrumbs();

    const unsubscribe = mobileNavigationService.onStateChange(updateBreadcrumbs);
    return unsubscribe;
  }, [customBreadcrumbs]);

  const handleBreadcrumbClick = (path: string) => {
    router.push(path);
    mobileNavigationService.navigate(path);

    // Haptic feedback
    gestureService.triggerHaptic('light');
  };

  if (breadcrumbs.length <= 1) return null;

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 text-sm", className)}>
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          {crumb.path ? (
            <button
              onClick={() => handleBreadcrumbClick(crumb.path!)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
};

// Back Button Component
interface BackButtonProps {
  className?: string;
  label?: string;
  fallbackPath?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  className,
  label = "Back",
  fallbackPath = "/"
}) => {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );

  useEffect(() => {
    const unsubscribe = mobileNavigationService.onStateChange(setNavigationState);
    return unsubscribe;
  }, []);

  const handleBack = () => {
    const didGoBack = mobileNavigationService.goBack();
    
    if (!didGoBack) {
      // Fallback to provided path or home
      router.push(fallbackPath);
      mobileNavigationService.navigate(fallbackPath);
    }

    // Haptic feedback
    gestureService.triggerHaptic('light');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("gap-2", className)}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};

// Menu Toggle Button
interface MenuToggleProps {
  className?: string;
}

export const MenuToggle: React.FC<MenuToggleProps> = ({ className }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>(
    mobileNavigationService.getState()
  );

  useEffect(() => {
    const unsubscribe = mobileNavigationService.onStateChange(setNavigationState);
    return unsubscribe;
  }, []);

  const toggleMenu = () => {
    mobileNavigationService.toggleMenu();
    
    // Haptic feedback
    gestureService.triggerHaptic('selection');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMenu}
      className={cn("h-8 w-8 p-0", className)}
    >
      {navigationState.isMenuOpen ? (
        <X className="h-4 w-4" />
      ) : (
        <Menu className="h-4 w-4" />
      )}
    </Button>
  );
}; 