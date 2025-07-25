import { TagCreateForm } from '@/components/admin/tags/tag-create-form'

export default function NewTagPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Tag</h1>
        <p className="text-muted-foreground">
          Create a new tag to label and organize your content.
        </p>
      </div>
      <TagCreateForm />
    </div>
  )
} 