'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminForm, AdminFormSection } from '@/components/admin/core/admin-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit as EditIcon } from 'lucide-react'
import { z } from 'zod'

const categorySchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  parentId: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
})

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ id: string; nameEn: string }[]>([])
  const [initialData, setInitialData] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, listRes] = await Promise.all([
          fetch(`/api/categories/${params.id}`),
          fetch('/api/categories?siteId=default'),
        ])
        if (listRes.ok) {
          const result = await listRes.json()
          if (result.success) setCategories(result.data)
        }
        if (catRes.ok) {
          const result = await catRes.json()
          if (result.success) setInitialData(result.data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

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
          options: [{ label: 'None', value: '' }, ...categories.filter(c => c.id !== params.id).map(c => ({ label: c.nameEn, value: c.id }))],
        },
        { name: 'descriptionEn', label: 'Description (English)', type: 'textarea', rows: 3 },
        { name: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', rows: 3 },
      ],
    },
  ]

  const handleSubmit = async (data: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, parentId: data.parentId || undefined }),
      })
      if (!res.ok) throw new Error('Failed to update category')
      router.push('/admin/categories')
    } catch (err) {
      console.error('Error updating category:', err)
      alert('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!initialData) return <div className="p-6">Category not found</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          <span>Admin</span> / <span>Categories</span> / <span className="text-foreground">Edit {initialData.nameEn}</span>
        </div>
      </div>
      <div className="border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <EditIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Edit Category</h1>
            <p className="text-muted-foreground">Update category information</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <AdminForm
          title=""
          sections={formSections}
          schema={categorySchema}
          defaultValues={initialData}
          loading={saving}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
