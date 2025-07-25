'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminForm, AdminFormSection } from '@/components/admin/core/admin-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { z } from 'zod'

const tagSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  color: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
})

const colorOptions = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
]

export default function NewTagPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const formSections: AdminFormSection[] = [
    {
      title: 'Tag',
      fields: [
        { name: 'nameEn', label: 'Tag Name (English)', type: 'text', required: true },
        { name: 'nameAr', label: 'Tag Name (Arabic)', type: 'text' },
        { name: 'color', label: 'Color', type: 'select', options: colorOptions.map(c => ({ label: c, value: c })) },
        { name: 'descriptionEn', label: 'Description (English)', type: 'textarea', rows: 3 },
        { name: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', rows: 3 },
      ],
    },
  ]

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, siteId: 'default' }),
      })
      if (!res.ok) throw new Error('Failed to create tag')
      router.push('/admin/tags')
    } catch (err) {
      console.error('Error creating tag:', err)
      alert('Failed to create tag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          <span>Admin</span> / <span>Tags</span> / <span className="text-foreground">New Tag</span>
        </div>
      </div>
      <div className="border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create New Tag</h1>
            <p className="text-muted-foreground">Add a new tag to categorize content.</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <AdminForm
          title=""
          sections={formSections}
          schema={tagSchema}
          loading={loading}
          onSubmit={handleSubmit}
          submitLabel="Create Tag"
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
