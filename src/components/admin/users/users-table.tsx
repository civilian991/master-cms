"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  UsersIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  ShieldIcon,
  MailIcon,
  KeyIcon,
  LockIcon,
  UnlockIcon,
  CrownIcon,
  UserIcon,
  CalendarIcon,
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react"

import { AdminTable, AdminTableColumn } from "@/components/admin/core/admin-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { TableSkeleton } from "@/components/ui/loading-skeleton"


// TypeScript interfaces for User data
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER'
  isActive: boolean
  emailVerified: boolean
  mfaEnabled: boolean
  lockedUntil?: string
  lastLoginAt?: string
  loginCount?: number
  avatar?: string
  locale: 'en' | 'ar'
  siteRoles: Array<{
    id: string
    site: {
      id: string
      name: string
    }
    role: {
      id: string
      name: string
    }
  }>
  securityEvents: Array<{
    type: string
    timestamp: string
    ip: string
    userAgent: string
  }>
  createdAt: string
  updatedAt: string
}

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@himaya.com",
    name: "Admin User",
    role: "ADMIN",
    isActive: true,
    emailVerified: true,
    mfaEnabled: true,
    lastLoginAt: "2024-01-15T08:30:00Z",
    loginCount: 127,
    avatar: "/avatars/admin.jpg",
    locale: "en",
    siteRoles: [
      {
        id: "1",
        site: {
          id: "1",
          name: "Main Site"
        },
        role: {
          id: "ADMIN",
          name: "ADMIN"
        }
      }
    ],
    securityEvents: [
      {
        type: "LOGIN_SUCCESS",
        timestamp: "2024-01-15T08:30:00Z",
        ip: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    ],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2024-01-15T08:30:00Z"
  },
  {
    id: "2",
    email: "editor@himaya.com",
    name: "Jane Editor",
    role: "EDITOR",
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    lastLoginAt: "2024-01-14T16:20:00Z",
    loginCount: 45,
    locale: "en",
    siteRoles: [
      {
        id: "1",
        site: {
          id: "1",
          name: "Main Site"
        },
        role: {
          id: "EDITOR",
          name: "EDITOR"
        }
      }
    ],
    securityEvents: [
      {
        type: "LOGIN_SUCCESS",
        timestamp: "2024-01-14T16:20:00Z",
        ip: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    ],
    createdAt: "2023-06-15T00:00:00Z",
    updatedAt: "2024-01-14T16:20:00Z"
  },
  {
    id: "3",
    email: "author@himaya.com",
    name: "محمد الكاتب",
    role: "AUTHOR",
    isActive: false,
    emailVerified: true,
    mfaEnabled: false,
    lockedUntil: "2024-01-16T00:00:00Z",
    lastLoginAt: "2024-01-10T14:15:00Z",
    loginCount: 12,
    locale: "ar",
    siteRoles: [
      {
        id: "1",
        site: {
          id: "1",
          name: "Main Site"
        },
        role: {
          id: "AUTHOR",
          name: "AUTHOR"
        }
      }
    ],
    securityEvents: [
      {
        type: "LOGIN_FAILED",
        timestamp: "2024-01-13T10:30:00Z",
        ip: "192.168.1.102",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    ],
    createdAt: "2023-09-20T00:00:00Z",
    updatedAt: "2024-01-13T10:30:00Z"
  }
]



export function UsersTable() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/auth/users')
        if (!response.ok) {
          throw new Error('Failed to load users')
        }
        const data = await response.json()
        setUsers(data.users || mockUsers) // Fallback to mock data
      } catch (err) {
        console.error('Error loading users:', err)
        setError('Failed to load users')
        setUsers(mockUsers) // Use mock data as fallback
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Table columns configuration
  const columns: AdminTableColumn<User>[] = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (_, user) => {
        const roleConfig = {
          ADMIN: { variant: "default" as const, icon: CrownIcon },
          EDITOR: { variant: "secondary" as const, icon: EditIcon },
          AUTHOR: { variant: "outline" as const, icon: UserIcon },
          USER: { variant: "outline" as const, icon: UserIcon },
          PUBLISHER: { variant: "outline" as const, icon: UserIcon }
        }
        
        // Get role from siteRoles array (API structure)
        const userRole = user.siteRoles?.[0]?.role?.id || user.role || 'USER'
        const config = roleConfig[userRole as keyof typeof roleConfig] || roleConfig.USER
        const { variant, icon: Icon } = config
        
        return (
          <Badge variant={variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {userRole}
          </Badge>
        )
      }
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (_, user) => {
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          return (
            <Badge variant="destructive" className="gap-1">
              <LockIcon className="h-3 w-3" />
              Locked
            </Badge>
          )
        }
        return user.isActive ? (
          <Badge variant="default" className="gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangleIcon className="h-3 w-3" />
            Inactive
          </Badge>
        )
      }
    },
    {
      key: "mfaEnabled",
      label: "Security",
      render: (_, user) => (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={user.emailVerified ? "default" : "destructive"} className="h-6 w-6 p-0">
                  <MailIcon className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Email {user.emailVerified ? "Verified" : "Not Verified"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={user.mfaEnabled ? "default" : "outline"} className="h-6 w-6 p-0">
                  <ShieldIcon className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                MFA {user.mfaEnabled ? "Enabled" : "Disabled"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      key: "siteRoles",
      label: "Site Access",
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
                  {user.siteRoles.slice(0, 2).map((siteRole, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {siteRole.site.name}: {siteRole.role.name}
          </Badge>
        ))}
          {user.siteRoles.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{user.siteRoles.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      sortable: true,
      render: (lastLogin) => lastLogin ? (
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {new Date(lastLogin).toLocaleDateString()}
            <div className="text-xs text-muted-foreground">
              {new Date(lastLogin).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">Never</span>
      )
    },
    {
      key: "loginCount",
      label: "Logins",
      sortable: true,
      align: "right",
      render: (count) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {count ? count.toLocaleString() : '0'}
        </div>
      )
    }
  ]

  // Bulk actions configuration
  const bulkActions = [
    { label: "Activate Selected", value: "activate" },
    { label: "Deactivate Selected", value: "deactivate" },
    { label: "Enable MFA", value: "enable_mfa" },
    { label: "Disable MFA", value: "disable_mfa" },
    { label: "Reset Password", value: "reset_password" },
    { label: "Delete Selected", value: "delete", variant: "destructive" as const }
  ]

  // Row actions configuration
  const rowActions = [
    { label: "View Profile", value: "view", icon: EyeIcon },
    { label: "Edit User", value: "edit", icon: EditIcon },
    { label: "Security Settings", value: "security", icon: ShieldIcon },
    { label: "Reset Password", value: "reset_password", icon: KeyIcon },
    { label: "Login As User", value: "impersonate", icon: UserIcon },
    { label: "Delete User", value: "delete", icon: Trash2Icon, variant: "destructive" as const }
  ]



  // Event handlers
  const handleRowAction = (action: string, user: User) => {
    switch (action) {
      case "view":
        router.push(`/admin/users/${user.id}`)
        break
      case "edit":
        router.push(`/admin/users/${user.id}/edit`)
        break
      case "security":
        router.push(`/admin/users/${user.id}/security`)
        break
      case "reset_password":
        console.log("Reset password for:", user.id)
        break
      case "impersonate":
        console.log("Login as user:", user.id)
        break
      case "delete":
        console.log("Delete user:", user.id)
        break
    }
  }

  const handleBulkAction = (action: string, selectedUsers: User[]) => {
    console.log(`Bulk ${action}:`, selectedUsers.map(u => u.id))
    // Implement bulk operations
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting users as ${format}`)
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  if (loading) {
    return <TableSkeleton rows={7} />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangleIcon className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load users</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-First Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
            <div className="sm:ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and security settings
          </p>
        </div>
        <Button 
          onClick={() => router.push('/admin/users/new')}
          className="w-full sm:w-auto shadow-sm"
          size="default"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          <span>New User</span>
        </Button>
      </div>

      {/* Responsive Table Container */}
      <div className="bg-card rounded-lg border overflow-hidden shadow-sm">
        <AdminTable
          title="All Users"
          description="Manage user accounts with role-based access control and security features"
          columns={columns}
          data={users}
          loading={loading}
          totalCount={users.length}
          pageSize={20}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onRowSelect={setSelectedUsers}
          onRowAction={handleRowAction}
          onBulkAction={handleBulkAction}
          onExport={handleExport}
          onRefresh={handleRefresh}
          bulkActions={bulkActions}
          rowActions={rowActions}
          searchPlaceholder="Search users..."
          emptyStateTitle="No users found"
          emptyStateDescription="Get started by creating your first user account."
          className="border-0"
        />
      </div>
    </div>
  )
} 