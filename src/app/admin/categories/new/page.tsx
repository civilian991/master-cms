'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminForm, AdminFormSection } from '@/components/admin/core/admin-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { z } from 'zod'

const categorySchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  parentId: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
})

export default function NewCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameEn: string }[]>([])

  useEffect(() => {
    fetch('/api/categories?siteId=default')
      .then(async (res) => {
        if (res.ok) {
          const result = await res.json()
          if (result.success) setCategories(result.data)
        }
      })
      .catch((err) => console.error('Error loading categories:', err))
  }, [])

  const formSections: AdminFormSection[] = [
    {
      title: 'Category',
      fields: [
        { name: 'nameEn', label: 'Category Name (English)', type: 'text', required: true },
        { name: 'nameAr', label: 'Category Name (Arabic)', type: 'text' },
        {
          name: 'parentId',
          label: 'Parent Category',
          type: 'select',
          options: [{ label: 'None', value: '' }, ...categories.map(c => ({ label: c.nameEn, value: c.id }))],
        },
        { name: 'descriptionEn', label: 'Description (English)', type: 'textarea', rows: 3 },
        { name: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', rows: 3 },
      ],
    },
  ]

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, parentId: data.parentId || undefined, siteId: 'default' }),
      })
      if (!res.ok) throw new Error('Failed to create category')
      router.push('/admin/categories')
    } catch (err) {
      console.error('Error creating category:', err)
      alert('Failed to create category')
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
          <span>Admin</span> / <span>Categories</span> / <span className="text-foreground">New Category</span>
        </div>
      </div>
      <div className="border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create New Category</h1>
            <p className="text-muted-foreground">Add a new content category.</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <AdminForm
          title=""
          sections={formSections}
          schema={categorySchema}
          loading={loading}
          onSubmit={handleSubmit}
          submitLabel="Create Category"
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
