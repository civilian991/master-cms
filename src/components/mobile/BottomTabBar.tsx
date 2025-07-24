'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  FileText, 
  User, 
  Search,
  Settings,
  BookOpen,
  Bookmark,
  Bell
} from 'lucide-react'

interface TabItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<any>
  badge?: number
  disabled?: boolean
}

interface BottomTabBarProps {
  className?: string
  variant?: 'default' | 'floating' | 'minimal'
  showLabels?: boolean
  maxTabs?: number
}

const defaultTabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home
  },
  {
    id: 'articles',
    label: 'Articles',
    href: '/articles',
    icon: FileText
  },
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: Search
  },
  {
    id: 'bookmarks',
    label: 'Saved',
    href: '/dashboard/bookmarks',
    icon: Bookmark
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/dashboard',
    icon: User
  }
]

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  className,
  variant = 'default',
  showLabels = true,
  maxTabs = 5
}) => {
  const pathname = usePathname()
  const visibleTabs = defaultTabs.slice(0, maxTabs)

  const variantClasses = {
    default: 'bg-white border-t border-gray-200 shadow-lg',
    floating: 'bg-white rounded-t-2xl shadow-2xl border border-gray-200',
    minimal: 'bg-white/95 backdrop-blur-sm border-t border-gray-100'
  }

  const isTabActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'mobile-safe-area',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = isTabActive(tab.href)
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'touch-target-comfortable',
                'flex flex-col items-center justify-center',
                'min-w-0 flex-1 relative',
                'transition-colors duration-200',
                'rounded-lg',
                tab.disabled && 'opacity-50 pointer-events-none'
              )}
             >
              <div className={cn(
                'flex flex-col items-center justify-center',
                'px-2 py-1 rounded-lg',
                'transition-all duration-200',
                isActive && 'bg-blue-50 text-blue-600',
                !isActive && 'text-gray-600 hover:text-gray-900'
              )}>
                <div className="relative">
                  <Icon 
                    size={24} 
                    className={cn(
                      'transition-transform duration-200',
                      isActive && 'scale-110'
                    )}
                  />
                  {tab.badge && tab.badge > 0 && (
                    <span className={cn(
                      'absolute -top-2 -right-2',
                      'bg-red-500 text-white',
                      'text-xs font-bold',
                      'min-w-[18px] h-[18px]',
                      'rounded-full',
                      'flex items-center justify-center',
                      'border-2 border-white'
                    )}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                
                {showLabels && (
                  <span className={cn(
                    'text-xs font-medium mt-1',
                    'max-w-full truncate',
                    isActive && 'text-blue-600',
                    !isActive && 'text-gray-600'
                  )}>
                    {tab.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      {/* Safe area bottom padding for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}

// Compact version for contexts where space is limited
interface CompactTabBarProps {
  tabs?: TabItem[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export const CompactTabBar: React.FC<CompactTabBarProps> = ({
  tabs = defaultTabs.slice(0, 4),
  className,
  orientation = 'horizontal'
}) => {
  const pathname = usePathname()

  const isTabActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn(
      'flex bg-gray-100 rounded-lg p-1',
      orientation === 'vertical' && 'flex-col',
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = isTabActive(tab.href)
        
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'touch-target',
              'flex items-center justify-center',
              'rounded-md px-3 py-2',
              'transition-all duration-200',
              'relative',
              isActive && 'bg-white shadow-sm text-blue-600',
              !isActive && 'text-gray-600 hover:text-gray-900',
              orientation === 'vertical' && 'w-full justify-start gap-3',
              tab.disabled && 'opacity-50 pointer-events-none'
            )}
           >
            <Icon size={20} />
            {orientation === 'vertical' && (
              <span className="text-sm font-medium">{tab.label}</span>
            )}
            {tab.badge && tab.badge > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1',
                'bg-red-500 text-white',
                'text-xs font-bold',
                'min-w-[16px] h-[16px]',
                'rounded-full',
                'flex items-center justify-center'
              )}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// Floating action button for primary actions
interface FloatingActionButtonProps {
  icon: React.ComponentType<any>
  label?: string
  onClick: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  className,
  variant = 'primary',
  size = 'md',
  position = 'bottom-right'
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
  }

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28
  }

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40',
        'rounded-full',
        'touch-target-comfortable',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        variantClasses[variant],
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      aria-label={label}
    >
      <Icon size={iconSizes[size]} />
    </button>
  )
}

// Tab bar context for managing active states and custom tabs
interface TabBarContextType {
  tabs: TabItem[]
  setTabs: (tabs: TabItem[]) => void
  addTab: (tab: TabItem) => void
  removeTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<TabItem>) => void
}

const TabBarContext = React.createContext<TabBarContextType | undefined>(undefined)

export const TabBarProvider: React.FC<{
  children: React.ReactNode
  initialTabs?: TabItem[]
}> = ({
  children,
  initialTabs = defaultTabs
}) => {
  const [tabs, setTabs] = React.useState<TabItem[]>(initialTabs)

  const addTab = React.useCallback((tab: TabItem) => {
    setTabs(prev => [...prev, tab])
  }, [])

  const removeTab = React.useCallback((tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId))
  }, [])

  const updateTab = React.useCallback((tabId: string, updates: Partial<TabItem>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }, [])

  const value = React.useMemo(() => ({
    tabs,
    setTabs,
    addTab,
    removeTab,
    updateTab
  }), [tabs, addTab, removeTab, updateTab])

  return (
    <TabBarContext.Provider value={value}>
      {children}
    </TabBarContext.Provider>
  )
}

export const useTabBar = () => {
  const context = React.useContext(TabBarContext)
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider')
  }
  return context
} 