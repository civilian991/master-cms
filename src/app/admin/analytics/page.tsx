'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Eye, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Analytics() {
  const quickStats = [
    { title: 'Page Views Today', value: '2,847', change: '+12%', icon: Eye },
    { title: 'Unique Visitors', value: '1,235', change: '+8%', icon: Users },
    { title: 'Bounce Rate', value: '34.2%', change: '-5%', icon: TrendingUp },
    { title: 'Avg. Session', value: '3m 24s', change: '+15%', icon: BarChart3 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-primary" />
            Analytics Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Quick insights and access to detailed analytics
          </p>
        </div>
        <Link href="/admin/analytics/dashboard">
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Detailed Dashboard
          </Button>
        </Link>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
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
                <Badge variant="outline" className="text-xs mt-2">
                  {stat.change} from yesterday
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {/* Analytics Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/analytics/dashboard">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Comprehensive Dashboard
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
              <CardDescription>
                Detailed analytics with charts, trends, and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View detailed page views, user behavior, content performance, and more.
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/performance">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Performance Monitor
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
              <CardDescription>
                Site speed, uptime, and technical metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor page load times, server performance, and core web vitals.
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Custom Reports
              <Badge variant="secondary">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Generate custom analytics reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Create custom reports for specific time periods and metrics.
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
          <CardDescription>
            Key metrics from the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">18,945</p>
              <p className="text-sm text-gray-500">Total Page Views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">3,247</p>
              <p className="text-sm text-gray-500">Unique Visitors</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">156</p>
              <p className="text-sm text-gray-500">New Articles Read</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 