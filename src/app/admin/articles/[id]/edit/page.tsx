import { ArticleEditForm } from '@/components/admin/articles/article-edit-form'

interface ArticleEditPageProps {
  params: {
    id: string
  }
}

export default function ArticleEditPage({ params }: ArticleEditPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
        <p className="text-muted-foreground">
          Update article content and publishing settings.
        </p>
      </div>
      <ArticleEditForm articleId={params.id} />
    </div>
  )
} 