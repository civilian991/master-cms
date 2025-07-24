'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ModernDataTable } from '@/components/admin/core/modern-data-table'
import { ModernMetricCard } from '@/components/admin/dashboard/modern-metric-card'
import { SkeletonTable, SkeletonCard, LoadingButton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  MoreHorizontal,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

// Mock data - replace with real API calls
const mockArticles = [
  {
    id: '1',
    title: 'Getting Started with Next.js 15',
    author: 'John Doe',
    category: 'Technology',
    status: 'PUBLISHED',
    publishedAt: '2024-01-15',
    views: 1250,
    featured: true
  },
  {
    id: '2',
    title: 'The Future of Web Development',
    author: 'Sarah Wilson',
    category: 'Development',
    status: 'DRAFT',
    publishedAt: null,
    views: 0,
    featured: false
  },
  {
    id: '3',
    title: 'Understanding Modern CSS',
    author: 'Mike Johnson',
    category: 'Web Design',
    status: 'REVIEW',
    publishedAt: null,
    views: 0,
    featured: false
  },
  {
    id: '4',
    title: 'Building Scalable Applications',
    author: 'Emily Davis',
    category: 'Architecture',
    status: 'PUBLISHED',
    publishedAt: '2024-01-10',
    views: 890,
    featured: true
  }
]

const statusColors = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-red-100 text-red-800'
}

export default function AdminArticles() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleSearch = (query: string) => {
    setSearchTerm(query)
  }

  const handleRowAction = (action: string, article: any) => {
    console.log(`Action: ${action}`, article)
  }

  const handleBulkAction = (action: string, articles: any[]) => {
    console.log(`Bulk action: ${action}`, articles)
  }

  const handleNewArticle = () => {
    // Navigate to new article page
    window.location.href = '/admin/content/articles/new'
  }

  // Table columns configuration
  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (value: string, article: any) => (
        <div className="space-y-1">
          <p className="text-body font-medium text-gray-900">{value}</p>
          {article.featured && (
            <Badge variant="secondary" className="text-xs">
              Featured
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'author',
      label: 'Author',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-brand-600" />
          </div>
          <span className="text-body text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: string) => (
        <Badge variant="outline" className="text-caption">
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const variants = {
          PUBLISHED: 'bg-success-100 text-success-800 border-success-200',
          DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
          REVIEW: 'bg-warning-100 text-warning-800 border-warning-200',
          ARCHIVED: 'bg-error-100 text-error-800 border-error-200'
        }
        return (
          <Badge className={variants[value as keyof typeof variants] || variants.DRAFT}>
            {value}
          </Badge>
        )
      }
    },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (value: string | null) => value ? (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-caption text-gray-600">{value}</span>
        </div>
      ) : (
        <span className="text-caption text-gray-400">Not published</span>
      )
    },
    {
      key: 'views',
      label: 'Views',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Eye className="h-3 w-3 text-gray-400" />
          <span className="text-caption text-gray-900">{value.toLocaleString()}</span>
        </div>
      )
    }
  ]

  // Metrics data
  const metrics = [
    {
      title: 'Total Articles',
      value: mockArticles.length.toString(),
      trend: 'up' as const,
      change: 12,
      icon: FileText
    },
    {
      title: 'Published',
      value: mockArticles.filter(a => a.status === 'PUBLISHED').length.toString(),
      trend: 'up' as const,
      change: 8,
      icon: Eye
    },
    {
      title: 'Drafts',
      value: mockArticles.filter(a => a.status === 'DRAFT').length.toString(),
      trend: 'stable' as const,
      change: 0,
      icon: Edit
    },
    {
      title: 'Total Views',
      value: mockArticles.reduce((sum, a) => sum + a.views, 0).toLocaleString(),
      trend: 'up' as const,
      change: 24,
      icon: BarChart3
    }
  ]

  return (
    <div className="min-h-screen bg-gray-25 animate-[fadeIn_0.5s_ease-out]">
      <div className="space-y-8 p-6">
        {/* Enhanced Header */}
        <div className="flex justify-between items-start animate-[slideInDown_0.6s_ease-out]">
          <div className="space-y-2">
            <h1 className="text-display text-gray-900">Articles</h1>
            <p className="text-body text-gray-600">
              Manage your content articles and publications
            </p>
          </div>
          <LoadingButton
            onClick={handleNewArticle}
            className="bg-gradient-brand shadow-soft hover:shadow-medium transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </LoadingButton>
        </div>
              {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-[slideInUp_0.7s_ease-out]">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard 
                key={index} 
                showImage={false} 
                showTitle={true} 
                showDescription={false} 
                showActions={false} 
                className="h-32"
              />
            ))
          ) : (
                         metrics.map((metric, index) => (
               <ModernMetricCard
                 key={metric.title}
                 title={metric.title}
                 value={metric.value}
                 trend={metric.trend}
                 change={metric.change}
                 icon={metric.icon}
                 className="animate-[scaleIn_0.5s_ease-out]"
               />
             ))
          )}
        </div>

        {/* Enhanced Data Table */}
        <div className="animate-[slideInUp_0.8s_ease-out]">
          {loading ? (
            <div className="bg-white rounded-xl border-0 shadow-soft ring-1 ring-gray-200/50 overflow-hidden">
              <div className="p-6 border-b border-gray-100/50 bg-gradient-subtle">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-80 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              <SkeletonTable rows={6} columns={6} showHeader={true} className="p-6" />
            </div>
          ) : (
            <ModernDataTable
              title="Article Management"
              description="Search, filter, and manage your content articles"
              columns={columns}
              data={filteredArticles}
              loading={refreshing}
              totalCount={filteredArticles.length}
              pageSize={10}
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              onNewItem={handleNewArticle}
              onRowAction={handleRowAction}
              onBulkAction={handleBulkAction}
              searchPlaceholder="Search articles by title or author..."
              emptyStateTitle="No articles found"
              emptyStateDescription={
                searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first article to get started'
              }
              bulkActions={[
                { label: 'Publish', value: 'publish' },
                { label: 'Archive', value: 'archive', variant: 'destructive' }
              ]}
              className="shadow-soft ring-1 ring-gray-200/50"
            />
          )}
        </div>
      </div>
    </div>
  );
} 