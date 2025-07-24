"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Icon, House, Article, User, MagnifyingGlass, List, X, Gear, CaretRight, CaretDown } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

// Navigation item interface
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  isActive?: boolean;
  isExternal?: boolean;
  children?: NavigationItem[];
}

// Primary navigation props
export interface PrimaryNavigationProps {
  /**
   * Site logo configuration
   */
  logo?: {
    src?: string;
    alt?: string;
    href?: string;
  };
  
  /**
   * Navigation items
   */
  items: NavigationItem[];
  
  /**
   * Site name for fallback logo
   */
  siteName?: string;
  
  /**
   * Current path for active state
   */
  currentPath?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Search handler
   */
  onSearch?: (query: string) => void;
  
  /**
   * User menu configuration
   */
  userMenu?: {
    isAuthenticated: boolean;
    userName?: string;
    avatar?: string;
    menuItems: NavigationItem[];
  };
}

// Admin navigation props
export interface AdminNavigationProps {
  /**
   * Navigation items for admin sidebar
   */
  items: NavigationItem[];
  
  /**
   * Current path for active state
   */
  currentPath?: string;
  
  /**
   * Whether sidebar is collapsed
   */
  isCollapsed?: boolean;
  
  /**
   * Toggle collapse handler
   */
  onToggleCollapse?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Breadcrumb item interface
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

// Breadcrumb navigation props
export interface BreadcrumbNavigationProps {
  /**
   * Breadcrumb items
   */
  items: BreadcrumbItem[];
  
  /**
   * Separator icon
   */
  separator?: React.ComponentType<any>;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Footer navigation props
export interface FooterNavigationProps {
  /**
   * Footer navigation sections
   */
  sections: {
    title: string;
    items: NavigationItem[];
  }[];
  
  /**
   * Copyright text
   */
  copyright?: string;
  
  /**
   * Social media links
   */
  socialLinks?: NavigationItem[];
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Primary Navigation Component
 * 
 * Responsive navigation with:
 * - Horizontal layout on desktop
 * - Hamburger menu on mobile
 * - Site-specific branding
 * - Search functionality
 * - User authentication states
 */
export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  logo,
  items,
  siteName = "Master CMS",
  currentPath = "",
  className,
  onSearch,
  userMenu,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('.mobile-nav-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  // Toggle search
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  return (
    <nav className={cn("bg-background border-b border-border", className)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-4">
            <Link
              href={logo?.href || "/"}
              className="flex items-center space-3 font-bold text-primary hover:text-primary/80 transition-colors"
             >
              {logo?.src ? (
                <img 
                  src={logo.src} 
                  alt={logo.alt || siteName} 
                  className="h-8 w-auto"
                />
              ) : (
                <Icon icon={House} size="lg" className="text-primary" />
              )}
              <span className="text-xl font-bold">{siteName}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-6">
            {/* Main Navigation Items */}
            <div className="flex items-center space-4">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    item.isActive || currentPath === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                 >
                  <div className="flex items-center space-2">
                    {item.icon && <Icon icon={item.icon} size="sm" />}
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Search */}
            {onSearch && (
              <div className="relative">
                {isSearchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-64 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchOpen(false)}
                      className="ml-2"
                    >
                      <Icon icon={X} size="sm" />
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSearch}
                    aria-label="Open search"
                  >
                    <Icon icon={MagnifyingGlass} size="sm" />
                  </Button>
                )}
              </div>
            )}

            {/* User Menu */}
            {userMenu && (
              <div className="flex items-center space-2">
                {userMenu.isAuthenticated ? (
                  <div className="relative group">
                    <Button variant="ghost" size="sm" className="flex items-center space-2">
                      {userMenu.avatar ? (
                        <img 
                          src={userMenu.avatar} 
                          alt={userMenu.userName || "User"} 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <Icon icon={User} size="sm" />
                      )}
                      <span className="hidden lg:inline">{userMenu.userName}</span>
                    </Button>
                    
                    {/* User Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        {userMenu.menuItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                           >
                            <div className="flex items-center space-2">
                              {item.icon && <Icon icon={item.icon} size="xs" />}
                              <span>{item.label}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth/signin">
                    <Button variant="default" size="sm">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon icon={isMobileMenuOpen ? X : List} size="md" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-container md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              {onSearch && (
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex items-center space-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit" size="sm">
                      <Icon icon={MagnifyingGlass} size="sm" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Mobile Navigation Items */}
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    item.isActive || currentPath === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                 >
                  <div className="flex items-center space-3">
                    {item.icon && <Icon icon={item.icon} size="sm" />}
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}

              {/* Mobile User Menu */}
              {userMenu && (
                <div className="pt-4 border-t border-border">
                  {userMenu.isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                        {userMenu.userName || "Account"}
                      </div>
                      {userMenu.menuItems.map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                         >
                          <div className="flex items-center space-3">
                            {item.icon && <Icon icon={item.icon} size="sm" />}
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

PrimaryNavigation.displayName = "PrimaryNavigation";

/**
 * Admin Navigation Component
 * 
 * Sidebar navigation for admin interfaces with:
 * - Collapsible/expandable sidebar
 * - Hierarchical menu support
 * - Active state management
 * - Icons and labels
 */
export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  items,
  currentPath = "",
  isCollapsed = false,
  onToggleCollapse,
  className,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavigationItem, index: number, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(index);
    const isActive = item.isActive || currentPath === item.href;

    return (
      <li key={index}>
        <div
          className={cn(
            "flex items-center w-full text-left transition-colors duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground",
            depth > 0 && "ml-4",
            isCollapsed ? "px-2 py-3" : "px-3 py-2"
          )}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(index)}
              className="flex items-center w-full text-left"
              aria-expanded={isExpanded}
            >
              {item.icon && (
                <Icon 
                  icon={item.icon} 
                  size="sm" 
                  className={cn("shrink-0", !isCollapsed && "mr-3")} 
                />
              )}
              {!isCollapsed && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <Icon 
                    icon={isExpanded ? CaretDown : CaretRight} 
                    size="xs" 
                    className="ml-auto"
                  />
                </>
              )}
            </button>
          ) : (
            <Link
              href={item.href}
              className="flex items-center w-full"
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noopener noreferrer" : undefined}
             >
              {item.icon && (
                <Icon 
                  icon={item.icon} 
                  size="sm" 
                  className={cn("shrink-0", !isCollapsed && "mr-3")} 
                />
              )}
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          )}
        </div>
        {/* Submenu */}
        {hasChildren && isExpanded && !isCollapsed && (
          <ul className="space-y-1">
            {item.children!.map((childItem, childIndex) => 
              renderNavItem(childItem, `${index}-${childIndex}` as any, depth + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside 
      className={cn(
        "bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h2 className="font-semibold text-card-foreground">Admin Menu</h2>
        )}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon icon={List} size="sm" />
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="p-2">
        <ul className="space-y-1">
          {items.map((item, index) => renderNavItem(item, index))}
        </ul>
      </nav>
    </aside>
  );
};

AdminNavigation.displayName = "AdminNavigation";

/**
 * Breadcrumb Navigation Component
 * 
 * Hierarchical navigation showing current page path with:
 * - Clickable parent paths
 * - Current page indicator
 * - Custom separator support
 * - Responsive design
 */
export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  separator = CaretRight,
  className,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("py-3", className)}>
      <ol className="flex items-center space-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <Icon 
                icon={separator} 
                size="xs" 
                className="mx-2 text-muted-foreground" 
              />
            )}
            
            {item.href && !item.isActive ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
               >
                {item.label}
              </Link>
            ) : (
              <span 
                className={cn(
                  item.isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
                aria-current={item.isActive ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

BreadcrumbNavigation.displayName = "BreadcrumbNavigation";

/**
 * Footer Navigation Component
 * 
 * Site footer with:
 * - Multiple navigation sections
 * - Social media links
 * - Copyright information
 * - Responsive design
 */
export const FooterNavigation: React.FC<FooterNavigationProps> = ({
  sections,
  copyright,
  socialLinks,
  className,
}) => {
  return (
    <footer className={cn("bg-muted border-t border-border", className)}>
      <div className="container mx-auto px-4 py-8">
        {/* Footer Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {sections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noopener noreferrer" : undefined}
                     >
                      <div className="flex items-center space-2">
                        {item.icon && <Icon icon={item.icon} size="xs" />}
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          {copyright && (
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              {copyright}
            </p>
          )}

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex items-center space-4">
              {socialLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                  aria-label={link.label}
                 >
                  {link.icon && <Icon icon={link.icon} size="sm" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

FooterNavigation.displayName = "FooterNavigation"; 