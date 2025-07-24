'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [timeRange])

  const statsCards = [
    {
      title: 'Total Page Views',
      value: '127,450',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      description: 'Page views in the last ' + (timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : 'year')
    },
    {
      title: 'Unique Visitors',
      value: '23,840',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      description: 'Unique visitors in the selected period'
    },
    {
      title: 'Avg. Session Duration',
      value: '4m 32s',
      change: '-2.1%',
      trend: 'down',
      icon: Clock,
      description: 'Average time spent per session'
    },
    {
      title: 'Content Engagement',
      value: '68.5%',
      change: '+5.7%',
      trend: 'up',
      icon: TrendingUp,
      description: 'Users engaging with content'
    }
  ]

  const topPages = [
    { url: '/articles/ai-future-2025', views: 12540, title: 'The Future of AI in 2025' },
    { url: '/categories/technology', views: 9870, title: 'Technology Category' },
    { url: '/articles/web-development-trends', views: 8760, title: 'Web Development Trends' },
    { url: '/about', views: 7650, title: 'About Us' },
    { url: '/articles/sustainable-tech', views: 6540, title: 'Sustainable Technology' }
  ]

  const trafficSources = [
    { source: 'Organic Search', percentage: 45.2, visitors: 10800 },
    { source: 'Direct', percentage: 28.7, visitors: 6840 },
    { source: 'Social Media', percentage: 15.1, visitors: 3600 },
    { source: 'Referral', percentage: 8.3, visitors: 1980 },
    { source: 'Email', percentage: 2.7, visitors: 642 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for your content performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant={stat.trend === 'up' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Pages
            </CardTitle>
            <CardDescription>
              Most visited pages in the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {page.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {page.url}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {page.views.toLocaleString()} views
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Traffic Sources
            </CardTitle>
            <CardDescription>
              Where your visitors are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {source.source}
                    </span>
                    <span className="text-sm text-gray-500">
                      {source.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {source.visitors.toLocaleString()} visitors
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
          <CardDescription>
            Live visitor activity and content performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-4 w-4"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Real-time analytics will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 