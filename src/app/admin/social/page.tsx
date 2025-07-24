'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share2, Facebook, Twitter, Instagram, Linkedin, Plus } from 'lucide-react'

export default function SocialManagement() {
  const socialAccounts = [
    { platform: 'Facebook', status: 'connected', followers: '12.4K', posts: 156 },
    { platform: 'Twitter', status: 'connected', followers: '8.7K', posts: 289 },
    { platform: 'Instagram', status: 'disconnected', followers: '5.2K', posts: 78 },
    { platform: 'LinkedIn', status: 'connected', followers: '3.1K', posts: 45 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Share2 className="h-8 w-8 mr-3 text-primary" />
            Social Media Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage social media accounts and content distribution
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Connect Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {socialAccounts.map((account, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{account.platform}</span>
                <Badge variant={account.status === 'connected' ? 'default' : 'secondary'}>
                  {account.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Followers:</span>
                  <span className="font-medium">{account.followers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts:</span>
                  <span className="font-medium">{account.posts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Dashboard</CardTitle>
          <CardDescription>Manage posts, scheduling, and analytics across platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Social media management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 