'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Users, 
  Image, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import Link from 'next/link'

// Enhanced mock data with trend information
const stats = {
  totalArticles: {
    value: 156,
    change: 12,
    trend: 'up' as const,
    previousValue: 139
  },
  totalUsers: {
    value: 42,
    change: 5,
    trend: 'up' as const,
    previousValue: 40
  },
  totalMedia: {
    value: 89,
    change: 8,
    trend: 'up' as const,
    previousValue: 82
  },
  monthlyViews: {
    value: 15420,
    change: -3,
    trend: 'down' as const,
    previousValue: 15897
  }
}

const recentActivity = [
  {
    id: 1,
    action: 'Article published',
    item: 'Understanding Modern Web Development',
    user: 'John Doe',
    time: '2 hours ago',
    type: 'publish' as const
  },
  {
    id: 2,
    action: 'New user registered',
    item: 'jane.smith@example.com',
    user: 'System',
    time: '4 hours ago',
    type: 'user' as const
  },
  {
    id: 3,
    action: 'Media uploaded',
    item: 'hero-image.jpg',
    user: 'Sarah Wilson',
    time: '6 hours ago',
    type: 'media' as const
  }
]

// Enhanced metrics card component
const ModernMetricsCard = ({ 
  title, 
  value, 
  change, 
  trend,
  icon: Icon, 
  previousValue 
}: {
  title: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  previousValue: number
}) => {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  const trendBg = trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
  
  return (
    <Card className="group border-0 shadow-card hover:shadow-card-hover transition-all duration-200 bg-white ring-1 ring-gray-200/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendBg} ${trendColor}`}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {Math.abs(change)}%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {trend === 'up' ? 'Increased' : trend === 'down' ? 'Decreased' : 'No change'} from {previousValue.toLocaleString()} last month
            </p>
          </div>
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors duration-200">
            <Icon className="h-6 w-6 text-brand-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Here's what's happening with your site today.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Link href="/admin/content/articles/new">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernMetricsCard
          title="Total Articles"
          value={stats.totalArticles.value}
          change={stats.totalArticles.change}
          trend={stats.totalArticles.trend}
          icon={FileText}
          previousValue={stats.totalArticles.previousValue}
        />
        <ModernMetricsCard
          title="Total Users"
          value={stats.totalUsers.value}
          change={stats.totalUsers.change}
          trend={stats.totalUsers.trend}
          icon={Users}
          previousValue={stats.totalUsers.previousValue}
        />
        <ModernMetricsCard
          title="Media Files"
          value={stats.totalMedia.value}
          change={stats.totalMedia.change}
          trend={stats.totalMedia.trend}
          icon={Image}
          previousValue={stats.totalMedia.previousValue}
        />
        <ModernMetricsCard
          title="Monthly Views"
          value={stats.monthlyViews.value}
          change={stats.monthlyViews.change}
          trend={stats.monthlyViews.trend}
          icon={BarChart3}
          previousValue={stats.monthlyViews.previousValue}
        />
      </div>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:shadow-card-hover transition-all duration-200 border-0 shadow-card ring-1 ring-gray-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Content Management
            </CardTitle>
            <CardDescription className="text-gray-600">
              Create and manage your articles, categories, and tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link href="/admin/content/articles">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                View All Articles
              </Button>
            </Link>
            <Link href="/admin/content/articles/new">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                Create New Article
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-card-hover transition-all duration-200 border-0 shadow-card ring-1 ring-gray-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              User Management
            </CardTitle>
            <CardDescription className="text-gray-600">
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                View All Users
              </Button>
            </Link>
            <Link href="/admin/users/new">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                Add New User
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-card-hover transition-all duration-200 border-0 shadow-card ring-1 ring-gray-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              Analytics & Reports
            </CardTitle>
            <CardDescription className="text-gray-600">
              View detailed analytics and performance reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                View Analytics
              </Button>
            </Link>
            <Link href="/admin/analytics/reports">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                Generate Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Activity */}
      <Card className="border-0 shadow-card ring-1 ring-gray-200/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-600">
            Latest actions and updates across your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const activityColors = {
                publish: 'bg-green-500',
                user: 'bg-blue-500',
                media: 'bg-purple-500'
              }
              
              return (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-25 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 ${activityColors[activity.type]} rounded-full`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}: <span className="text-brand-600 font-semibold">{activity.item}</span>
                      </p>
                      <p className="text-xs text-gray-500">by {activity.user}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600 border-0">
                    {activity.time}
                  </Badge>
                </div>
              )
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/admin/activity">
              <Button variant="outline" size="sm" className="font-medium">
                View All Activity
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-card ring-1 ring-gray-200/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Database</span>
              <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Cache</span>
              <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Storage</span>
              <Badge className="bg-warning-100 text-warning-800 border-warning-200 font-medium">85% Used</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card ring-1 ring-gray-200/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Quick Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                Site Configuration
              </Button>
            </Link>
            <Link href="/admin/security">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                Security Settings
              </Button>
            </Link>
            <Link href="/admin/settings/backup">
              <Button variant="outline" className="w-full justify-start h-11 font-medium">
                Backup & Restore
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 