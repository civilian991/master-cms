"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  FileTextIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  LanguagesIcon,
  BarChart3Icon,
  Clock,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
} from "lucide-react"

import { AdminTable, AdminTableColumn } from "@/components/admin/core/admin-table"
import { AdminForm, AdminFormSection } from "@/components/admin/core/admin-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"

// TypeScript interfaces for Article data
export interface Article {
  id: string
  titleEn: string
  titleAr?: string
  slug: string
  excerptEn?: string
  excerptAr?: string
  contentEn?: string
  contentAr?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  workflowState: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'
  author: {
    id: string
    name: string
    email: string
  }
  category?: {
    id: string
    nameEn: string
    nameAr?: string
  }
  tags: Array<{
    id: string
    nameEn: string
    nameAr?: string
  }>
  published: boolean
  publishedAt?: string
  scheduledAt?: string
  viewCount: number
  engagementScore: number
  readTime?: number
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Form schema for article creation/editing
const articleSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().optional(),
  excerptEn: z.string().optional(),
  excerptAr: z.string().optional(),
  contentEn: z.string().min(1, "English content is required"),
  contentAr: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  scheduledAt: z.string().optional(),
})

// API Functions
const articlesApi = {
  // Fetch articles with filters and pagination
  async getArticles(params: {
    page?: number
    limit?: number
    search?: string
    status?: string[]
    workflowState?: string[]
    categoryId?: string
    authorId?: string
    siteId?: string
  } = {}): Promise<ApiResponse<{ articles: Article[]; total: number }>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.status?.length) searchParams.set('status', params.status.join(','))
    if (params.workflowState?.length) searchParams.set('workflowState', params.workflowState.join(','))
    if (params.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params.authorId) searchParams.set('authorId', params.authorId)
    if (params.siteId) searchParams.set('siteId', params.siteId)

    const response = await fetch(`/api/content/articles?${searchParams}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch articles')
    }
    
    return data
  },

  // Create new article
  async createArticle(articleData: z.infer<typeof articleSchema>): Promise<ApiResponse<Article>> {
    const response = await fetch('/api/content/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleData)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create article')
    }
    
    return data
  },

  // Update article
  async updateArticle(id: string, articleData: Partial<z.infer<typeof articleSchema>>): Promise<ApiResponse<Article>> {
    const response = await fetch(`/api/content/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleData)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update article')
    }
    
    return data
  },

  // Delete article
  async deleteArticle(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/content/articles/${id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete article')
    }
    
    return data
  },

  // Bulk operations
  async bulkOperation(operation: string, articleIds: string[], data?: any): Promise<ApiResponse<any>> {
    const response = await fetch('/api/content/articles/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        articleIds,
        ...data
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to perform bulk operation')
    }
    
    return result
  }
}

export function ArticlesTable() {
  const [articles, setArticles] = useState<Article[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([])
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Load articles from API
  const loadArticles = async (params: {
    page?: number
    search?: string
  } = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await articlesApi.getArticles({
        page: params.page || currentPage,
        limit: 20,
        search: params.search || searchQuery,
        siteId: "1" // Get from context/session
      })
      
      setArticles(response.data.articles)
      setTotalCount(response.data.total)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load articles'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadArticles()
  }, [currentPage])

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadArticles({ search: searchQuery })
      } else {
        setCurrentPage(1) // This will trigger loadArticles via the useEffect above
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Table columns configuration
  const columns: AdminTableColumn<Article>[] = [
    {
      key: "titleEn",
      label: "Title",
      sortable: true,
      render: (_, article) => (
        <div className="space-y-1">
          <div className="font-medium">{article.titleEn}</div>
          {article.titleAr && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <LanguagesIcon className="h-3 w-3" />
              {article.titleAr}
            </div>
          )}
        </div>
      )
    },
    {
      key: "author.name",
      label: "Author",
      sortable: true,
      render: (_, article) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{article.author.name}</div>
            <div className="text-sm text-muted-foreground">{article.author.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status) => {
        const variants = {
          DRAFT: "secondary",
          PUBLISHED: "default",
          ARCHIVED: "outline"
        } as const
        return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
      }
    },
    {
      key: "workflowState",
      label: "Workflow",
      sortable: true,
      render: (state) => {
        const config = {
          DRAFT: { icon: EditIcon, color: "text-gray-500" },
          REVIEW: { icon: AlertCircleIcon, color: "text-yellow-500" },
          APPROVED: { icon: CheckCircleIcon, color: "text-green-500" },
          PUBLISHED: { icon: CheckCircleIcon, color: "text-blue-500" },
          REJECTED: { icon: XCircleIcon, color: "text-red-500" }
        }
        const { icon: Icon, color } = config[state as keyof typeof config] || config.DRAFT
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-sm">{state}</span>
          </div>
        )
      }
    },
    {
      key: "category.nameEn",
      label: "Category",
      render: (_, article) => article.category ? (
        <Badge variant="outline">{article.category.nameEn}</Badge>
      ) : (
        <span className="text-muted-foreground">Uncategorized</span>
      )
    },
    {
      key: "viewCount",
      label: "Views",
      sortable: true,
      align: "right",
      render: (views) => (
        <div className="flex items-center gap-2">
          <EyeIcon className="h-4 w-4 text-muted-foreground" />
          {views.toLocaleString()}
        </div>
      )
    },
    {
      key: "engagementScore",
      label: "Engagement",
      sortable: true,
      align: "center",
      render: (score) => (
        <div className="flex items-center gap-2">
          <Progress value={score * 100} className="w-16" />
          <span className="text-sm">{Math.round(score * 100)}%</span>
        </div>
      )
    },
    {
      key: "publishedAt",
      label: "Published",
      sortable: true,
      render: (publishedAt) => publishedAt ? (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {new Date(publishedAt).toLocaleDateString()}
        </div>
      ) : (
        <span className="text-muted-foreground">Not published</span>
      )
    }
  ]

  // Bulk actions configuration
  const bulkActions = [
    { label: "Publish Selected", value: "publish" },
    { label: "Archive Selected", value: "archive" },
    { label: "Delete Selected", value: "delete", variant: "destructive" as const }
  ]

  // Row actions configuration
  const rowActions = [
    { label: "View", value: "view", icon: EyeIcon },
    { label: "Edit", value: "edit", icon: EditIcon },
    { label: "Analytics", value: "analytics", icon: BarChart3Icon },
    { label: "Delete", value: "delete", icon: Trash2Icon, variant: "destructive" as const }
  ]

  // Article form sections
  const formSections: AdminFormSection[] = [
    {
      title: "Content",
      description: "Basic article information and content",
      fields: [
        {
          name: "titleEn",
          label: "Title (English)",
          type: "text",
          required: true,
          placeholder: "Enter article title in English",
          grid: { colSpan: 2 }
        },
        {
          name: "titleAr",
          label: "Title (Arabic)",
          type: "text",
          placeholder: "Enter article title in Arabic",
          grid: { colSpan: 2 }
        },
        {
          name: "excerptEn",
          label: "Excerpt (English)",
          type: "textarea",
          placeholder: "Brief description of the article",
          rows: 3,
          grid: { colSpan: 2 }
        },
        {
          name: "excerptAr",
          label: "Excerpt (Arabic)",
          type: "textarea",
          placeholder: "وصف موجز للمقال",
          rows: 3,
          grid: { colSpan: 2 }
        },
        {
          name: "contentEn",
          label: "Content (English)",
          type: "textarea",
          required: true,
          placeholder: "Write your article content here...",
          rows: 10,
          grid: { colSpan: 2 }
        },
        {
          name: "contentAr",
          label: "Content (Arabic)",
          type: "textarea",
          placeholder: "اكتب محتوى المقال هنا...",
          rows: 10,
          grid: { colSpan: 2 }
        }
      ]
    },
    {
      title: "Metadata",
      description: "Article categorization and publishing options",
      fields: [
        {
          name: "categoryId",
          label: "Category",
          type: "select",
          placeholder: "Select a category",
          options: [
            { label: "Technology", value: "1" },
            { label: "Development", value: "2" },
            { label: "Design", value: "3" }
          ]
        },
        {
          name: "tags",
          label: "Tags",
          type: "tags",
          placeholder: "Add tags...",
          description: "Press Enter to add tags"
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Draft", value: "DRAFT" },
            { label: "Published", value: "PUBLISHED" },
            { label: "Archived", value: "ARCHIVED" }
          ]
        },
        {
          name: "scheduledAt",
          label: "Schedule Publication",
          type: "date",
          description: "Leave empty to publish immediately"
        }
      ]
    }
  ]

  // Event handlers
  const handleRowAction = async (action: string, article: Article) => {
    switch (action) {
      case "view":
        // Navigate to article view
        window.open(`/articles/${article.slug}`, '_blank')
        break
      case "edit":
        router.push(`/admin/articles/${article.id}/edit`)
        break
      case "analytics":
        // Navigate to analytics
        window.open(`/admin/analytics/articles/${article.id}`, '_blank')
        break
      case "delete":
        if (confirm('Are you sure you want to delete this article?')) {
          try {
            await articlesApi.deleteArticle(article.id)
            toast({
              title: "Success",
              description: "Article deleted successfully"
            })
            loadArticles()
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete article'
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive"
            })
          }
        }
        break
    }
  }

  const handleBulkAction = async (action: string, selectedArticles: Article[]) => {
    try {
      const articleIds = selectedArticles.map(a => a.id)
      await articlesApi.bulkOperation(action, articleIds)
      
      toast({
        title: "Success",
        description: `Bulk ${action} completed successfully`
      })
      
      loadArticles()
      setSelectedArticles([])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to perform bulk ${action}`
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }
  const handleExport = (format: 'csv' | 'pdf') => {
    // TODO: Implement export functionality with real API
    console.log(`Exporting articles as ${format}`)
    toast({
      title: "Export",
      description: `Exporting articles as ${format.toUpperCase()}...`
    })
  }

  const handleRefresh = () => {
    loadArticles()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground">
            Manage your content with multilingual support and advanced workflow
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Table */}
      <AdminTable
        title="All Articles"
        description="Manage and monitor your article content with advanced filtering and bulk operations"
        columns={columns}
        data={articles}
        loading={loading}
        totalCount={totalCount}
        pageSize={20}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRowSelect={setSelectedArticles}
        onRowAction={handleRowAction}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onRefresh={handleRefresh}
        bulkActions={bulkActions}
        rowActions={rowActions}
        searchPlaceholder="Search articles..."
        emptyStateTitle="No articles found"
        emptyStateDescription="Get started by creating your first article."
      />
    </div>
  )
}
