import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { ArticlesTable } from "@/components/admin/content/articles-table"

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Manage your articles and content.
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Article
          </Button>
        </Link>
      </div>
      <ArticlesTable />
    </div>
  )
} 