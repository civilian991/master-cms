'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminForm, AdminFormSection } from '@/components/admin/core/admin-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit as EditIcon } from 'lucide-react'
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

export default function EditTagPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialData, setInitialData] = useState<any | null>(null)

  useEffect(() => {
    fetch(`/api/tags/${params.id}`)
      .then(async (res) => {
        if (res.ok) {
          const result = await res.json()
          if (result.success) setInitialData(result.data)
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

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
    setSaving(true)
    try {
      const res = await fetch(`/api/tags/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update tag')
      router.push('/admin/tags')
    } catch (err) {
      console.error('Error updating tag:', err)
      alert('Failed to update tag')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!initialData) return <div className="p-6">Tag not found</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          <span>Admin</span> / <span>Tags</span> / <span className="text-foreground">Edit {initialData.nameEn}</span>
        </div>
      </div>
      <div className="border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <EditIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Edit Tag</h1>
            <p className="text-muted-foreground">Update tag information</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <AdminForm
          title=""
          sections={formSections}
          schema={tagSchema}
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
