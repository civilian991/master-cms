import { ArticleCreateForm } from '@/components/admin/articles/article-create-form'

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Article</h1>
        <p className="text-muted-foreground">
          Create a new article with rich content and publishing options.
        </p>
      </div>
      <ArticleCreateForm />
    </div>
  )
} 