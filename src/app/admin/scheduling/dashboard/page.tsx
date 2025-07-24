'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Play, 
  Pause,
  Eye,
  Plus,
  Settings
} from 'lucide-react'

export default function SchedulingDashboard() {
  const scheduledContent = [
    { id: 1, title: 'AI Technology Trends 2025', type: 'Article', scheduledDate: '2025-01-15 09:00', status: 'scheduled' },
    { id: 2, title: 'Sustainable Business Practices', type: 'Blog Post', scheduledDate: '2025-01-16 14:30', status: 'scheduled' },
    { id: 3, title: 'Web Development Tutorial', type: 'Tutorial', scheduledDate: '2025-01-17 10:00', status: 'draft' },
    { id: 4, title: 'Industry News Roundup', type: 'Newsletter', scheduledDate: '2025-01-18 08:00', status: 'scheduled' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-primary" />
            Content Scheduler
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and automate your content publishing schedule
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Content
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Today's Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Queue Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Content</CardTitle>
          <CardDescription>Upcoming content scheduled for publication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduledContent.map((content) => (
              <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{content.title}</p>
                    <p className="text-sm text-gray-500">{content.type} • {content.scheduledDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={content.status === 'scheduled' ? 'default' : 'secondary'}>
                    {content.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 