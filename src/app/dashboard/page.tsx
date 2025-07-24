'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, 
  CreditCard, 
  Heart, 
  Bell, 
  Shield, 
  TrendingUp, 
  Clock,
  BookmarkCheck,
  Activity
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()
  
  // Mock data - would come from API in real implementation
  const stats = {
    articlesRead: 42,
    bookmarked: 15,
    totalReadingTime: '12h 30m',
    lastActive: '2 hours ago'
  }

  const quickActions = [
    {
      title: 'Update Profile',
      description: 'Manage your personal information',
      icon: User,
      href: '/dashboard/profile',
      color: 'bg-blue-500'
    },
    {
      title: 'Billing & Plans',
      description: 'View subscription details',
      icon: CreditCard,
      href: '/dashboard/subscription',
      color: 'bg-green-500'
    },
    {
      title: 'Reading Preferences',
      description: 'Customize your content feed',
      icon: Heart,
      href: '/dashboard/preferences',
      color: 'bg-purple-500'
    },
    {
      title: 'Security Settings',
      description: 'Enable two-factor authentication',
      icon: Shield,
      href: '/dashboard/security',
      color: 'bg-orange-500'
    }
  ]

  const recentActivity = [
    {
      action: 'Read article',
      title: 'Advanced React Patterns',
      time: '2 hours ago'
    },
    {
      action: 'Bookmarked',
      title: 'TypeScript Best Practices',
      time: '1 day ago'
    },
    {
      action: 'Updated preferences',
      title: 'Enabled email notifications',
      time: '3 days ago'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your account overview and recent activity
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {session?.user?.mfaEnabled && (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Secured
              </Badge>
            )}
            <Badge variant="outline">
              {session?.user?.role || 'Member'}
            </Badge>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Read</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articlesRead}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
            <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookmarked}</div>
            <p className="text-xs text-muted-foreground">
              +3 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReadingTime}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastActive}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                 >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest interactions and account changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.action}: <span className="font-normal">{item.title}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}