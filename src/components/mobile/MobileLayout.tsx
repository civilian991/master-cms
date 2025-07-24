/**
 * Mobile Layout Component
 * Complete mobile layout with navigation, search, and responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { 
  BottomTabNavigation,
  HamburgerMenu,
  SearchOverlay,
  FloatingActionButtons,
  BreadcrumbNavigation,
  BackButton,
  MenuToggle
} from './MobileNavigation';
import { Button } from '@/components/ui/button';
import { Bell, Search, User } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomTabs?: boolean;
  showBreadcrumbs?: boolean;
  showFloatingButtons?: boolean;
  headerTitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showHeader = true,
  showBottomTabs = true,
  showBreadcrumbs = false,
  showFloatingButtons = true,
  headerTitle,
  headerActions,
  className,
  contentClassName
}) => {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  
  const {
    navigationState,
    toggleSearch,
    isActive,
    canGoBack
  } = useMobileNavigation({ 
    userRole,
    enableHapticFeedback: true,
    autoSyncWithRouter: true
  });

  // Show back button on non-home pages
  const showBackButton = canGoBack && !isActive('/');

  // Handle search button click
  const handleSearchClick = () => {
    toggleSearch(true);
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Mobile Header */}
      {showHeader && (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="container flex h-14 items-center justify-between px-4">
            {/* Left side */}
            <div className="flex items-center gap-2">
              {showBackButton ? (
                <BackButton className="h-8 w-8 p-0" />
              ) : (
                <MenuToggle />
              )}
              
              {headerTitle && (
                <h1 className="text-lg font-semibold truncate max-w-[200px]">
                  {headerTitle}
                </h1>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchClick}
                className="h-8 w-8 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Notifications (if user is logged in) */}
              {session && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 relative"
                >
                  <Bell className="h-4 w-4" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
                </Button>
              )}

              {/* Profile (if user is logged in) */}
              {session && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <User className="h-4 w-4" />
                </Button>
              )}

              {/* Custom header actions */}
              {headerActions}
            </div>
          </div>
        </header>
      )}

      {/* Breadcrumbs (optional) */}
      {showBreadcrumbs && (
        <BreadcrumbNavigation className="border-b border-border" />
      )}

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1",
          showBottomTabs && "pb-16", // Add bottom padding for tab navigation
          contentClassName
        )}
      >
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      {showBottomTabs && (
        <BottomTabNavigation 
          userRole={userRole}
          className="safe-area-pb"
        />
      )}

      {/* Hamburger Menu */}
      <HamburgerMenu userRole={userRole} />

      {/* Search Overlay */}
      <SearchOverlay />

      {/* Floating Action Buttons */}
      {showFloatingButtons && (
        <FloatingActionButtons userRole={userRole} />
      )}
    </div>
  );
};

// Article Layout - specialized mobile layout for article pages
interface MobileArticleLayoutProps {
  children: React.ReactNode;
  articleTitle?: string;
  showReadingProgress?: boolean;
  className?: string;
}

export const MobileArticleLayout: React.FC<MobileArticleLayoutProps> = ({
  children,
  articleTitle,
  showReadingProgress = true,
  className
}) => {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (!showReadingProgress) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showReadingProgress]);

  return (
    <MobileLayout
      headerTitle={articleTitle}
      showBreadcrumbs={true}
      className={className}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Share</span>
            📤
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Bookmark</span>
            🔖
          </Button>
        </div>
      }
    >
      {/* Reading Progress Bar */}
      {showReadingProgress && (
        <div className="fixed top-14 left-0 right-0 z-20 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {children}
    </MobileLayout>
  );
};

// Dashboard Layout - specialized mobile layout for dashboard pages
interface MobileDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showStats?: boolean;
  className?: string;
}

export const MobileDashboardLayout: React.FC<MobileDashboardLayoutProps> = ({
  children,
  title = "Dashboard",
  showStats = true,
  className
}) => {
  return (
    <MobileLayout
      headerTitle={title}
      showBottomTabs={true}
      showFloatingButtons={true}
      className={className}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Settings</span>
            ⚙️
          </Button>
        </div>
      }
    >
      {/* Quick Stats (optional) */}
      {showStats && (
        <div className="bg-muted/50 border-b border-border p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-muted-foreground">Articles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">1.2k</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">86%</div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
          </div>
        </div>
      )}

      {children}
    </MobileLayout>
  );
};

// Search Layout - specialized layout for search pages
interface MobileSearchLayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  resultCount?: number;
  className?: string;
}

export const MobileSearchLayout: React.FC<MobileSearchLayoutProps> = ({
  children,
  searchQuery,
  resultCount,
  className
}) => {
  return (
    <MobileLayout
      headerTitle={searchQuery ? `"${searchQuery}"` : "Search"}
      showBottomTabs={true}
      className={className}
      headerActions={
        resultCount !== undefined && (
          <div className="text-sm text-muted-foreground">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </div>
        )
      }
    >
      {children}
    </MobileLayout>
  );
};

// Category Layout - specialized layout for category pages
interface MobileCategoryLayoutProps {
  children: React.ReactNode;
  categoryName?: string;
  categoryDescription?: string;
  articleCount?: number;
  className?: string;
}

export const MobileCategoryLayout: React.FC<MobileCategoryLayoutProps> = ({
  children,
  categoryName,
  categoryDescription,
  articleCount,
  className
}) => {
  return (
    <MobileLayout
      headerTitle={categoryName}
      showBreadcrumbs={true}
      className={className}
      headerActions={
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Filter</span>
          🔍
        </Button>
      }
    >
      {/* Category Header */}
      {(categoryDescription || articleCount !== undefined) && (
        <div className="bg-muted/50 border-b border-border p-4">
          {categoryDescription && (
            <p className="text-sm text-muted-foreground mb-2">
              {categoryDescription}
            </p>
          )}
          {articleCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {articleCount} article{articleCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {children}
    </MobileLayout>
  );
};

// Safe area utilities for mobile devices
export const MobileSafeArea: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn("safe-area-inset", className)}>
      {children}
    </div>
  );
};

// Mobile-specific CSS classes utility
export const mobileCssClasses = {
  // Safe areas
  safeTop: 'pt-safe-top',
  safeBottom: 'pb-safe-bottom',
  safeLeft: 'pl-safe-left',
  safeRight: 'pr-safe-right',
  safeInset: 'p-safe',
  
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Mobile spacing
  mobileSpacing: 'p-4 md:p-6',
  mobileSpacingSmall: 'p-2 md:p-4',
  
  // Mobile typography
  mobileTitle: 'text-xl md:text-2xl lg:text-3xl',
  mobileBody: 'text-sm md:text-base',
  
  // Mobile containers
  mobileContainer: 'max-w-none md:max-w-2xl lg:max-w-4xl mx-auto px-4',
  
  // Mobile visibility
  showOnMobile: 'block md:hidden',
  hideOnMobile: 'hidden md:block',
  
  // Mobile interactions
  mobileHover: 'active:bg-accent md:hover:bg-accent',
  mobileFocus: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
};

export default MobileLayout; 