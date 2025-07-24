'use client'

import React, { createContext, useContext, useState } from 'react'
import Link from 'next/link'
import { useConfiguration } from './ConfigurationProvider'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: string
  children?: NavigationItem[]
}

interface NavigationContextType {
  mainNavigation: NavigationItem[]
  footerNavigation: NavigationItem[]
  sidebarNavigation: NavigationItem[]
  updateNavigation: (type: 'main' | 'footer' | 'sidebar', items: NavigationItem[]) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

interface NavigationProviderProps {
  children: React.ReactNode
}

// Default navigation items
const defaultNavigationItems: Record<string, NavigationItem> = {
  home: { id: 'home', label: 'Home', href: '/' },
  articles: { id: 'articles', label: 'Articles', href: '/articles' },
  categories: { id: 'categories', label: 'Categories', href: '/categories' },
  tags: { id: 'tags', label: 'Tags', href: '/tags' },
  search: { id: 'search', label: 'Search', href: '/search' },
  about: { id: 'about', label: 'About', href: '/about' },
  contact: { id: 'contact', label: 'Contact', href: '/contact' },
  dashboard: { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  profile: { id: 'profile', label: 'Profile', href: '/dashboard/profile' },
  privacy: { id: 'privacy', label: 'Privacy Policy', href: '/privacy' },
  terms: { id: 'terms', label: 'Terms of Service', href: '/terms' },
  sitemap: { id: 'sitemap', label: 'Sitemap', href: '/sitemap' },
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const { config, updateConfig } = useConfiguration()
  const [mainNavigation, setMainNavigation] = useState<NavigationItem[]>([])
  const [footerNavigation, setFooterNavigation] = useState<NavigationItem[]>([])
  const [sidebarNavigation, setSidebarNavigation] = useState<NavigationItem[]>([])

  // Initialize navigation from config
  React.useEffect(() => {
    const navigation = config.navigation || { main: [], footer: [], sidebar: [] }
    
    const mainItems = (navigation.main || []).map((id: string) => defaultNavigationItems[id]).filter(Boolean)
    const footerItems = (navigation.footer || []).map((id: string) => defaultNavigationItems[id]).filter(Boolean)
    const sidebarItems = (navigation.sidebar || []).map((id: string) => defaultNavigationItems[id]).filter(Boolean)
    
    setMainNavigation(mainItems)
    setFooterNavigation(footerItems)
    setSidebarNavigation(sidebarItems)
  }, [config.navigation])

  const updateNavigation = (type: 'main' | 'footer' | 'sidebar', items: NavigationItem[]) => {
    const navigationIds = items.map(item => item.id)
    
    const updatedNavigation = {
      main: config.navigation?.main || [],
      footer: config.navigation?.footer || [],
      sidebar: config.navigation?.sidebar || [],
      [type]: navigationIds,
    }

    updateConfig({
      navigation: updatedNavigation,
    })

    // Update local state
    switch (type) {
      case 'main':
        setMainNavigation(items)
        break
      case 'footer':
        setFooterNavigation(items)
        break
      case 'sidebar':
        setSidebarNavigation(items)
        break
    }
  }

  const value: NavigationContextType = {
    mainNavigation,
    footerNavigation,
    sidebarNavigation,
    updateNavigation,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

// Main Navigation Component
export const MainNavigation: React.FC<{
  className?: string
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}> = ({ className = '', mobileMenuOpen = false, onMobileMenuToggle }) => {
  const { mainNavigation } = useNavigation()

  return (
    <nav className={`main-navigation ${className}`}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-6">
        {mainNavigation.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="text-gray-700 hover:text-primary-color transition-colors duration-200"
           >
            {item.label}
          </Link>
        ))}
      </div>
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={onMobileMenuToggle}
          className="text-gray-700 hover:text-primary-color transition-colors duration-200"
        >
          <span className="sr-only">Open menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t">
            <div className="px-4 py-2 space-y-2">
              {mainNavigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block py-2 text-gray-700 hover:text-primary-color transition-colors duration-200"
                  onClick={onMobileMenuToggle}
                 >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Footer Navigation Component
export const FooterNavigation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { footerNavigation } = useNavigation()

  return (
    <nav className={`footer-navigation ${className}`}>
      <div className="flex flex-wrap justify-center space-x-6">
        {footerNavigation.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
           >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Sidebar Navigation Component
export const SidebarNavigation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { sidebarNavigation } = useNavigation()

  if (sidebarNavigation.length === 0) {
    return null
  }

  return (
    <nav className={`sidebar-navigation ${className}`}>
      <div className="space-y-2">
        {sidebarNavigation.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-color rounded transition-colors duration-200"
           >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Breadcrumb Navigation Component
export const BreadcrumbNavigation: React.FC<{
  items: Array<{ label: string; href?: string }>
  className?: string
}> = ({ items, className = '' }) => {
  return (
    <nav className={`breadcrumb-navigation ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-primary-color transition-colors duration-200"
               >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 