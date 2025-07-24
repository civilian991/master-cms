'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Globe, Clock } from 'lucide-react'

export default function PerformanceMonitor() {
  const performanceMetrics = [
    { title: 'Page Load Time', value: '1.2s', status: 'good', icon: Clock },
    { title: 'Core Web Vitals', value: 'Good', status: 'good', icon: Zap },
    { title: 'Uptime', value: '99.9%', status: 'excellent', icon: Activity },
    { title: 'Global CDN', value: 'Active', status: 'good', icon: Globe }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="h-8 w-8 mr-3 text-primary" />
            Performance Monitor
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor site performance metrics and optimization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <Badge variant={metric.status === 'excellent' ? 'default' : 'outline'} className="text-xs mt-2">
                  {metric.status === 'excellent' ? 'Excellent' : 'Good'}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Detailed performance metrics and optimization recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Performance monitoring interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 