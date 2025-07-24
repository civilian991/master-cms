"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LayoutDashboardIcon,
  FileTextIcon,
  UsersIcon,
  FolderIcon,
  TagIcon,
  ImageIcon,
  GlobeIcon,
  MailIcon,
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  MessageSquareIcon,
  HeartIcon,
  ShareIcon,
  CalendarIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminTable, AdminTableColumn } from "@/components/admin/core/admin-table"
import { ModernMetricCard, EnhancedMetricCard } from "@/components/admin/dashboard/modern-metric-card"

// Quick stats interface
interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalUsers: number
  activeUsers: number
  totalViews: number
  totalComments: number
  totalEngagement: number
  articlesThisMonth: number
  usersThisMonth: number
  viewsThisMonth: number
}

// Recent activity interface
interface RecentActivity {
  id: string
  type: 'article_created' | 'article_published' | 'user_registered' | 'comment_added'
  title: string
  description: string
  user: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

// Mock data
const mockStats: DashboardStats = {
  totalArticles: 1247,
  publishedArticles: 892,
  draftArticles: 355,
  totalUsers: 156,
  activeUsers: 89,
  totalViews: 245678,
  totalComments: 3421,
  totalEngagement: 78.5,
  articlesThisMonth: 23,
  usersThisMonth: 12,
  viewsThisMonth: 45230,
}

const mockRecentActivity: RecentActivity[] = [
  {
    id: "1",
    type: "article_published",
    title: "New article published",
    description: "Getting Started with Next.js 15",
    user: "John Doe",
    timestamp: "2024-01-15T10:30:00Z",
    status: "success"
  },
  {
    id: "2",
    type: "user_registered",
    title: "New user registered",
    description: "jane.smith@example.com joined the platform",
    user: "Jane Smith",
    timestamp: "2024-01-15T09:15:00Z",
    status: "success"
  },
  {
    id: "3",
    type: "article_created",
    title: "Draft article created",
    description: "Advanced TypeScript Patterns",
    user: "Mike Johnson",
    timestamp: "2024-01-15T08:45:00Z",
    status: "warning"
  },
  {
    id: "4",
    type: "comment_added",
    title: "New comment",
    description: "Comment on 'React Best Practices'",
    user: "Sarah Wilson",
    timestamp: "2024-01-15T08:20:00Z",
    status: "success"
  }
]

const mockTopArticles = [
  {
    id: "1",
    title: "Getting Started with Next.js 15",
    views: 12450,
    engagement: 85,
    comments: 67,
    publishedAt: "2024-01-10"
  },
  {
    id: "2",
    title: "React Performance Optimization",
    views: 9876,
    engagement: 78,
    comments: 45,
    publishedAt: "2024-01-08"
  },
  {
    id: "3",
    title: "TypeScript Advanced Patterns",
    views: 7654,
    engagement: 82,
    comments: 38,
    publishedAt: "2024-01-05"
  }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(mockRecentActivity)
  const [loading, setLoading] = useState(false)

  // Calculate growth percentages (mock)
  const growthStats = {
    articles: 15.2,
    users: 8.7,
    views: 23.4,
    engagement: -2.1
  }

  const activityColumns: AdminTableColumn<RecentActivity>[] = [
    {
      key: "type",
      label: "Type",
      render: (type) => {
        const config = {
          article_created: { icon: FileTextIcon, color: "text-blue-500", label: "Article" },
          article_published: { icon: CheckCircleIcon, color: "text-green-500", label: "Published" },
          user_registered: { icon: UsersIcon, color: "text-purple-500", label: "User" },
          comment_added: { icon: MessageSquareIcon, color: "text-orange-500", label: "Comment" }
        }
        const { icon: Icon, color, label } = config[type as keyof typeof config]
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-sm">{label}</span>
          </div>
        )
      }
    },
    {
      key: "title",
      label: "Activity",
      render: (_, activity) => (
        <div>
          <div className="font-medium">{activity.title}</div>
          <div className="text-sm text-muted-foreground">{activity.description}</div>
        </div>
      )
    },
    {
      key: "user",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          {user}
        </div>
      )
    },
    {
      key: "timestamp",
      label: "Time",
      render: (timestamp) => (
        <div className="text-sm text-muted-foreground">
          {new Date(timestamp).toLocaleString()}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (status) => {
        const variants = {
          success: "default",
          warning: "secondary",
          error: "destructive"
        } as const
        return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 space-y-8 p-6">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-display text-gray-900">Admin Dashboard</h1>
              <p className="text-body text-gray-600">
                Welcome to your content management system
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/articles/new">
                <Button className="bg-gradient-brand hover:opacity-90 shadow-soft hover:shadow-medium transition-all duration-200">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernMetricCard
              title="Total Articles"
              value={stats.totalArticles}
              change={growthStats.articles}
              trend={growthStats.articles > 0 ? 'up' : 'down'}
              icon={FileTextIcon}
              onClick={() => window.location.href = '/admin/articles'}
            />

            <ModernMetricCard
              title="Active Users"
              value={stats.activeUsers}
              change={growthStats.users}
              trend={growthStats.users > 0 ? 'up' : 'down'}
              icon={UsersIcon}
              onClick={() => window.location.href = '/admin/users'}
            />

            <ModernMetricCard
              title="Total Views"
              value={stats.totalViews}
              change={growthStats.views}
              trend={growthStats.views > 0 ? 'up' : 'down'}
              icon={EyeIcon}
              onClick={() => window.location.href = '/admin/analytics'}
            />

            <ModernMetricCard
              title="Engagement Rate"
              value={`${stats.totalEngagement}%`}
              change={growthStats.engagement}
              trend={growthStats.engagement > 0 ? 'up' : 'down'}
              icon={HeartIcon}
              onClick={() => window.location.href = '/admin/analytics'}
            />
          </div>

          {/* Enhanced Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/articles">
              <Card className="group card-modern hover:shadow-elevated hover:-translate-y-1 cursor-pointer border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-heading text-gray-900">
                    <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <FileTextIcon className="h-5 w-5 text-white" />
                    </div>
                    Articles Management
                  </CardTitle>
                  <CardDescription className="text-body text-gray-600 leading-relaxed">
                    Create, edit, and manage articles with multilingual support
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between bg-gray-50/50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-caption text-gray-500">Published</div>
                      <div className="text-xl font-bold text-gray-900">{stats.publishedArticles}</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-caption text-gray-500">Drafts</div>
                      <div className="text-xl font-bold text-gray-900">{stats.draftArticles}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="group card-modern hover:shadow-elevated hover:-translate-y-1 cursor-pointer border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-heading text-gray-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <UsersIcon className="h-5 w-5 text-white" />
                    </div>
                    Users Management
                  </CardTitle>
                  <CardDescription className="text-body text-gray-600 leading-relaxed">
                    Manage user accounts, roles, and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between bg-gray-50/50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-caption text-gray-500">Total Users</div>
                      <div className="text-xl font-bold text-gray-900">{stats.totalUsers}</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-caption text-gray-500">Active</div>
                      <div className="text-xl font-bold text-gray-900">{stats.activeUsers}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/categories">
              <Card className="group card-modern hover:shadow-elevated hover:-translate-y-1 cursor-pointer border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-heading text-gray-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <FolderIcon className="h-5 w-5 text-white" />
                    </div>
                    Categories & Tags
                  </CardTitle>
                  <CardDescription className="text-body text-gray-600 leading-relaxed">
                    Organize content with hierarchical categories and tags
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 bg-gray-50/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-gray-600">Content Organization</span>
                      <Badge variant="outline" className="text-caption bg-orange-50 text-orange-700 border-orange-200">12 Categories</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-gray-600">Tag System</span>
                      <Badge variant="outline" className="text-caption bg-orange-50 text-orange-700 border-orange-200">45 Tags</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/media">
              <Card className="group card-modern hover:shadow-elevated hover:-translate-y-1 cursor-pointer border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-heading text-gray-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                    Media Library
                  </CardTitle>
                  <CardDescription className="text-body text-gray-600 leading-relaxed">
                    Manage images, videos, and other media files
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 bg-gray-50/50 rounded-lg p-4">
                    <Progress value={68} className="h-3 bg-gray-200" />
                    <div className="text-caption text-gray-600">
                      2.4GB used of 10GB storage
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/sites">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GlobeIcon className="h-5 w-5" />
                    Sites & Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage multiple sites and global settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Active Sites</span>
                      <Badge variant="outline">3 Sites</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Global Config</span>
                      <Badge variant="default">Synced</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5" />
                    Analytics & Reports
                  </CardTitle>
                  <CardDescription>
                    View detailed analytics and generate reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Monthly Views</span>
                      <span className="font-semibold">{stats.viewsThisMonth.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Engagement</span>
                      <span className="font-semibold">{stats.totalEngagement}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="top-content">Top Content</TabsTrigger>
              <TabsTrigger value="analytics">Quick Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <div className="bg-white rounded-xl border-0 shadow-soft ring-1 ring-gray-200/50 overflow-hidden">
                {/* Enhanced Table Header */}
                <div className="p-6 border-b border-gray-100/50 bg-gradient-subtle">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-heading text-gray-900">Recent Activity</h3>
                      <p className="text-body text-gray-600 mt-1">Latest actions and events in your system</p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="p-4 text-left">
                          <span className="text-caption font-semibold text-gray-700">Type</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-caption font-semibold text-gray-700">Activity</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-caption font-semibold text-gray-700">User</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-caption font-semibold text-gray-700">Time</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-caption font-semibold text-gray-700">Status</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity, index) => (
                        <tr 
                          key={activity.id}
                          className="group border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-200"
                        >
                          <td className="p-4">
                            {activityColumns[0].render?.(activity.type, activity)}
                          </td>
                          <td className="p-4">
                            {activityColumns[1].render?.(activity.title, activity)}
                          </td>
                          <td className="p-4">
                            {activityColumns[2].render?.(activity.user, activity)}
                          </td>
                          <td className="p-4">
                            {activityColumns[3].render?.(activity.timestamp, activity)}
                          </td>
                          <td className="p-4">
                            {activityColumns[4].render?.(activity.status, activity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="top-content">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Articles</CardTitle>
                  <CardDescription>
                    Your most viewed and engaging content this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTopArticles.map((article, index) => (
                      <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-muted-foreground">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{article.title}</div>
                            <div className="text-sm text-muted-foreground">
                              Published {new Date(article.publishedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <EyeIcon className="h-4 w-4" />
                            {article.views.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquareIcon className="h-4 w-4" />
                            {article.comments}
                          </div>
                          <div className="flex items-center gap-1">
                            <HeartIcon className="h-4 w-4" />
                            {article.engagement}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Performance</CardTitle>
                    <CardDescription>Article publishing and engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Published Articles</span>
                        <div className="flex items-center gap-2">
                          <Progress value={71} className="w-24" />
                          <span className="text-sm font-medium">71%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Draft Articles</span>
                        <div className="flex items-center gap-2">
                          <Progress value={29} className="w-24" />
                          <span className="text-sm font-medium">29%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Average Engagement</span>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.totalEngagement} className="w-24" />
                          <span className="text-sm font-medium">{stats.totalEngagement}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>User registration and activity patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Active Users</span>
                        <div className="flex items-center gap-2">
                          <Progress value={57} className="w-24" />
                          <span className="text-sm font-medium">57%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>New Users (Month)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.usersThisMonth} className="w-24" />
                          <span className="text-sm font-medium">{stats.usersThisMonth}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>User Retention</span>
                        <div className="flex items-center gap-2">
                          <Progress value={83} className="w-24" />
                          <span className="text-sm font-medium">83%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 