'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AdminForm, AdminFormSection } from '@/components/admin/core/admin-form'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, UserCog, AlertCircle } from 'lucide-react'
import { z } from 'zod'

// User edit schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "EDITOR", "AUTHOR", "USER"]),
  isActive: z.boolean(),
  mfaEnabled: z.boolean(),
  locale: z.enum(["en", "ar"]),
})

const formSections: AdminFormSection[] = [
  {
    title: "User Information",
    description: "Basic user account details",
    fields: [
      {
        name: "name",
        label: "Full Name",
        type: "text",
        placeholder: "Enter user's full name",
        required: true
      },
      {
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "user@example.com",
        required: true,
        description: "Changing email will require re-verification"
      }
    ]
  },
  {
    title: "Permissions & Settings",
    description: "Configure user access level and preferences",
    fields: [
      {
        name: "role",
        label: "User Role",
        type: "select",
        required: true,
        options: [
          { label: "Administrator", value: "ADMIN" },
          { label: "Editor", value: "EDITOR" },
          { label: "Author", value: "AUTHOR" },
          { label: "User", value: "USER" }
        ],
        description: "This sets the user's global permissions level"
      },
      {
        name: "locale",
        label: "Language Preference",
        type: "select",
        options: [
          { label: "English", value: "en" },
          { label: "Arabic", value: "ar" }
        ]
      },
      {
        name: "isActive",
        label: "Account Active",
        type: "switch",
        description: "Enable or disable user account access"
      },
      {
        name: "mfaEnabled",
        label: "Multi-Factor Authentication",
        type: "switch",
        description: "Require MFA for enhanced security"
      }
    ]
  }
]

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER'
  isActive: boolean
  mfaEnabled: boolean
  locale: 'en' | 'ar'
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${params.id}`)
        if (!response.ok) {
          throw new Error('User not found')
        }
        const userData = await response.json()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setInitialLoading(false)
      }
    }

    loadUser()
  }, [params.id])

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      // Navigate back to users list with success message
      router.push('/admin/users?updated=success')
    } catch (error) {
      console.error('Error updating user:', error)
      // Handle error state
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="border-b pb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="border border-destructive rounded-lg p-6 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Error Loading User</h3>
              <p className="text-sm text-muted-foreground">
                {error || 'The requested user could not be found.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          <span>Admin</span> / <span>Users</span> / <span className="text-foreground">Edit {user.name}</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">
              Update user information, permissions, and access settings
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-lg border p-6">
                 <AdminForm
           title=""
           sections={formSections}
           schema={userSchema}
           defaultValues={user}
           loading={loading}
           onSubmit={handleSubmit}
           submitLabel="Save Changes"
           onCancel={() => router.back()}
         />
      </div>
    </div>
  )
} 