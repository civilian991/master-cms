import { CategoryCreateForm } from '@/components/admin/categories/category-create-form'

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Category</h1>
        <p className="text-muted-foreground">
          Create a new category to organize your content.
        </p>
      </div>
      <CategoryCreateForm />
    </div>
  )
} 