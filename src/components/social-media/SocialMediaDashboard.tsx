'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Calendar, 
  Zap, 
  Target, 
  BarChart3, 
  Settings,
  TrendingUp,
  Users,
  Share2,
  Heart
} from 'lucide-react';
import { SocialMediaManager } from './SocialMediaManager';
import { SocialMediaCalendar } from './SocialMediaCalendar';
import { SocialMediaAutomation } from './SocialMediaAutomation';
import { SocialMediaOptimization } from './SocialMediaOptimization';

interface DashboardStats {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalEngagement: number;
  totalReach: number;
  activeWorkflows: number;
}

export function SocialMediaDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('manager');
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    activeWorkflows: 0,
  });

  // Mock stats - in real implementation, these would be fetched from API
  React.useEffect(() => {
    setStats({
      totalPosts: 156,
      scheduledPosts: 23,
      publishedPosts: 133,
      totalEngagement: 2847,
      totalReach: 45620,
      activeWorkflows: 5,
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Management</h1>
          <p className="text-gray-600">Manage your social media presence across all platforms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold">{stats.publishedPosts}</p>
              </div>
              <Share2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                <p className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <p className="text-2xl font-bold">{stats.totalReach.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          <SocialMediaManager siteId={siteId} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <SocialMediaCalendar siteId={siteId} />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <SocialMediaAutomation siteId={siteId} />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <SocialMediaOptimization siteId={siteId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Social Media Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Performance */}
                <div>
                  <h3 className="font-semibold mb-4">Platform Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Twitter</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">2.4K</div>
                        <div className="text-sm text-gray-500">engagement</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span>LinkedIn</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">1.8K</div>
                        <div className="text-sm text-gray-500">engagement</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
                        <span>Facebook</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">3.2K</div>
                        <div className="text-sm text-gray-500">engagement</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Performance */}
                <div>
                  <h3 className="font-semibold mb-4">Recent Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Last 7 Days</div>
                        <div className="text-sm text-gray-500">vs previous period</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">+12%</span>
                        </div>
                        <div className="text-sm text-gray-500">engagement</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Last 30 Days</div>
                        <div className="text-sm text-gray-500">vs previous period</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">+8%</span>
                        </div>
                        <div className="text-sm text-gray-500">reach</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export Report
                  </Button>
                  <Button variant="outline" size="sm">
                    Schedule Analysis
                  </Button>
                  <Button variant="outline" size="sm">
                    Compare Periods
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 