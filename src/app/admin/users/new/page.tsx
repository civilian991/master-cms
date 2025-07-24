'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AdminForm, AdminFormSection } from '@/components/admin/core/admin-form'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { z } from 'zod'

// User creation schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "EDITOR", "AUTHOR", "USER"]),
  isActive: z.boolean().default(true),
  mfaEnabled: z.boolean().default(false),
  locale: z.enum(["en", "ar"]).default("en"),
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
        description: "User will receive login credentials at this email"
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

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      // API call to create user
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      // Navigate back to users list with success message
      router.push('/admin/users?created=success')
    } catch (error) {
      console.error('Error creating user:', error)
      // Handle error state
    } finally {
      setLoading(false)
    }
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
          <span>Admin</span> / <span>Users</span> / <span className="text-foreground">New User</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create New User</h1>
            <p className="text-muted-foreground">
              Add a new user account with appropriate permissions and access level
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
          loading={loading}
          onSubmit={handleSubmit}
          submitLabel="Create User"
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
} 