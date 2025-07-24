'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText,
  Users,
  Image,
  Settings,
  BarChart3,
  Shield,
  Menu, 
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  Folder,
  Tags,
  Brain,
  Search,
  Calendar,
  Share2,
  Zap,
  ShoppingCart,
  TrendingUp,
  Globe,
  Activity,
  Lock,
  Target,
  Megaphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ModernThemeToggle } from '@/components/ui/modern-theme-toggle'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface SidebarSection {
  title: string
  items: {
    title: string
    href: string
    icon: React.ElementType
    description: string
    badge?: string
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }[]
  defaultOpen?: boolean
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        description: 'Admin overview and stats'
      }
    ],
    defaultOpen: true
  },
  {
    title: 'Content Management',
    items: [
      {
        title: 'Articles',
        href: '/admin/articles',
        icon: FileText,
        description: 'Manage articles and content',
        badge: '156',
        badgeVariant: 'secondary'
      },
      {
        title: 'Categories',
        href: '/admin/categories',
        icon: Folder,
        description: 'Organize content categories',
        badge: '12',
        badgeVariant: 'secondary'
      },
      {
        title: 'Tags',
        href: '/admin/tags',
        icon: Tags,
        description: 'Manage content tags',
        badge: '28',
        badgeVariant: 'secondary'
      },
      {
        title: 'Media',
        href: '/admin/media',
        icon: Image,
        description: 'Upload and manage media files',
        badge: '89',
        badgeVariant: 'secondary'
      },
      {
        title: 'Scheduler',
        href: '/admin/scheduling/dashboard',
        icon: Calendar,
        description: 'Schedule and automate content',
        badge: '5',
        badgeVariant: 'destructive'
      }
    ],
    defaultOpen: true
  },
  {
    title: 'AI & Automation',
    items: [
      {
        title: 'Content Generator',
        href: '/admin/ai/generator',
        icon: Brain,
        description: 'AI-powered content creation',
        badge: 'New',
        badgeVariant: 'default'
      }
    ]
  },
  {
    title: 'Analytics & Performance',
    items: [
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        description: 'View site analytics and reports'
      },
      {
        title: 'Analytics Dashboard',
        href: '/admin/analytics/dashboard',
        icon: TrendingUp,
        description: 'Comprehensive analytics overview'
      },
      {
        title: 'Performance Monitor',
        href: '/admin/performance',
        icon: Activity,
        description: 'Site performance metrics'
      }
    ]
  },
  {
    title: 'Marketing & Social',
    items: [
      {
        title: 'Social Management',
        href: '/admin/social',
        icon: Share2,
        description: 'Social media integration'
      }
    ]
  },
  {
    title: 'E-commerce',
    items: [
      {
        title: 'E-commerce Tools',
        href: '/admin/ecommerce',
        icon: ShoppingCart,
        description: 'Online store management'
      }
    ]
  },
  {
    title: 'System Management',
    items: [
      {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
        description: 'Manage user accounts',
        badge: '42',
        badgeVariant: 'secondary'
      },
      {
        title: 'Security Dashboard',
        href: '/admin/security/dashboard',
        icon: Shield,
        description: 'Security monitoring and controls',
        badge: '!',
        badgeVariant: 'destructive'
      },
      {
        title: 'Search Management',
        href: '/admin/search',
        icon: Search,
        description: 'Search configuration and indexing'
      },
      {
        title: 'System Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'Site configuration'
      }
    ]
  }
]

const CollapsibleSection = ({ 
  section, 
  pathname 
}: { 
  section: SidebarSection
  pathname: string 
}) => {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? false)
  
  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-caption font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors duration-200 group"
      >
        <span>{section.title}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-200",
          isOpen ? "rotate-180" : ""
        )} />
      </button>
      
      {isOpen && (
        <div className="space-y-1 pl-2">
          {section.items.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-brand text-white shadow-soft"
                    : "text-gray-700 hover:bg-white/40 hover:text-gray-900 hover:shadow-soft"
                )}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Icon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  <span className="truncate">{item.title}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant || 'secondary'}
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 h-5",
                        isActive && "bg-white/20 text-white border-white/30"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-25">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  // Check if user has admin role
  const userRole = session?.user ? (session.user as any).role : null;
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const currentPage = sidebarSections.flatMap(section => section.items).find(item => item.href === pathname)

  return (
    <div className="flex h-screen bg-gray-25">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Enhanced Sidebar */}
      <div 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          "bg-gradient-sidebar border-r border-gray-200/50 shadow-elevated backdrop-blur-sm",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header with Glassmorphism */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100/50 bg-white/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-soft hover:shadow-medium transition-all duration-300">
                <span className="text-white font-bold text-lg tracking-tight">M</span>
              </div>
              <div>
                <p className="text-heading text-gray-900">Master CMS</p>
                <p className="text-caption">v2.1.0 • Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-1 h-8 w-8 hover:bg-white/50 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {sidebarSections.map((section) => (
              <CollapsibleSection
                key={section.title}
                section={section}
                pathname={pathname}
              />
            ))}
          </nav>

          {/* Enhanced Footer */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center p-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors duration-200">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span>User Dashboard</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900 p-3 h-auto"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Top bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4 lg:px-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 h-9 w-9 hover:bg-gray-100/50 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-heading text-gray-900">
                  {currentPage?.title || 'Admin'}
                </h1>
                <p className="text-caption text-gray-500 mt-0.5">
                  {currentPage?.description || 'Admin panel'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ModernThemeToggle />
              <Badge 
                variant="outline" 
                className="text-xs font-medium bg-brand-50 text-brand-700 border-brand-200 shadow-soft"
              >
                {(session?.user as any)?.role || 'User'}
              </Badge>
              <div className="text-right">
                <p className="text-caption font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-caption text-gray-500">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-25">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 