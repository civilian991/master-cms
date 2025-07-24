'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Eye, 
  MousePointer, 
  DollarSign,
  Target,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Play,
  Pause,
  AlertTriangle,
  Calendar,
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

interface AdCampaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  objective: string;
  budget: number;
  budgetType: string;
  currency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

interface AdPlacement {
  id: string;
  name: string;
  description?: string;
  type: string;
  position: string;
  size: string;
  responsive: boolean;
  isActive: boolean;
  priority: number;
  fillRate: number;
  impressions: number;
  clicks: number;
  revenue: number;
}

interface Advertisement {
  id: string;
  name: string;
  type: string;
  contentEn: string;
  contentAr?: string;
  imageUrl?: string;
  linkUrl?: string;
  status: string;
  startDate: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  campaign?: AdCampaign;
  placement?: AdPlacement;
}

interface AdPerformance {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  date: string;
  hour?: number;
  country?: string;
  region?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
}

interface AdvertisingStats {
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  averageCTR: number;
  averageCPC: number;
  averageCPM: number;
  totalSpend: number;
  roas: number;
}

interface AdBlockingStats {
  totalDetections: number;
  averageBlockRate: number;
  recentDetections: Array<{
    id: string;
    detected: boolean;
    blockRate: number;
    userAgent?: string;
    ipAddress?: string;
    action: string;
    createdAt: string;
  }>;
}

interface SiteStrategy {
  recommendedAdTypes: string[];
  optimalPlacements: string[];
  targetingRecommendations: Record<string, any>;
  revenueOptimization: Record<string, any>;
}

export default function AdvertisingDashboard() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [performances, setPerformances] = useState<AdPerformance[]>([]);
  const [stats, setStats] = useState<AdvertisingStats | null>(null);
  const [blockingStats, setBlockingStats] = useState<AdBlockingStats | null>(null);
  const [strategy, setStrategy] = useState<SiteStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('default-site-id');

  useEffect(() => {
    fetchAdvertisingData();
  }, [selectedSiteId]);

  const fetchAdvertisingData = async () => {
    try {
      setLoading(true);
      
      // Fetch all advertising data
      const [campaignsRes, placementsRes, adsRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/advertising/campaigns?siteId=${selectedSiteId}`),
        fetch(`/api/admin/advertising/placements?siteId=${selectedSiteId}`),
        fetch(`/api/admin/advertising/ads?siteId=${selectedSiteId}`),
        fetch(`/api/admin/advertising/analytics?siteId=${selectedSiteId}&type=all`),
      ]);

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);
      }

      if (placementsRes.ok) {
        const placementsData = await placementsRes.json();
        setPlacements(placementsData.placements || []);
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAdvertisements(adsData.advertisements || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        const { analytics } = analyticsData;
        setStats(analytics.stats);
        setBlockingStats(analytics.blocking);
        setStrategy(analytics.strategy);
      }
    } catch (err) {
      setError('Failed to fetch advertising data');
      console.error('Advertising data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'PAUSED':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">Completed</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      'DISPLAY': 'bg-blue-100 text-blue-800',
      'VIDEO': 'bg-purple-100 text-purple-800',
      'NATIVE': 'bg-green-100 text-green-800',
      'BANNER': 'bg-orange-100 text-orange-800',
      'POPUP': 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="secondary" className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const getObjectiveBadge = (objective: string) => {
    const objectiveColors: Record<string, string> = {
      'awareness': 'bg-blue-100 text-blue-800',
      'consideration': 'bg-yellow-100 text-yellow-800',
      'conversion': 'bg-green-100 text-green-800',
    };

    return (
      <Badge variant="secondary" className={objectiveColors[objective] || 'bg-gray-100 text-gray-800'}>
        {objective}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertising Management</h1>
          <p className="text-muted-foreground">
            Manage campaigns, placements, and track performance across all sites
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchAdvertisingData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalImpressions)}</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalClicks)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(stats.averageCTR)} CTR
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.averageCPC)} avg CPC
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roas.toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground">
                Return on ad spend
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="placements" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Placements
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Advertisements
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Campaigns</CardTitle>
              <CardDescription>
                Manage advertising campaigns and track performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${campaign.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getTypeBadge(campaign.type.toUpperCase())}
                          {getObjectiveBadge(campaign.objective)}
                          <span className="text-xs text-muted-foreground">
                            Budget: {formatCurrency(campaign.budget, campaign.currency)} {campaign.budgetType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(campaign.impressions)} impressions</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(campaign.clicks)} clicks</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(campaign.revenue, campaign.currency)} revenue</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No campaigns created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Placements</CardTitle>
              <CardDescription>
                Manage ad placement zones and positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {placements.map((placement) => (
                  <div key={placement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${placement.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="font-medium">{placement.name}</p>
                        <p className="text-sm text-muted-foreground">{placement.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{placement.type}</Badge>
                          <Badge variant="secondary">{placement.position}</Badge>
                          <span className="text-xs text-muted-foreground">{placement.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(placement.impressions)} impressions</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(placement.clicks)} clicks</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(placement.revenue)} revenue</p>
                        <p className="text-xs text-muted-foreground">Fill rate: {formatPercentage(placement.fillRate)}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {placements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No placements configured yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advertisements Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advertisements</CardTitle>
              <CardDescription>
                Manage individual advertisements and creative assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advertisements.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${ad.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="font-medium">{ad.name}</p>
                        <p className="text-sm text-muted-foreground">{ad.contentEn.substring(0, 100)}...</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getTypeBadge(ad.type)}
                          {getStatusBadge(ad.status)}
                          {ad.campaign && (
                            <Badge variant="outline">{ad.campaign.name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(ad.impressions)} impressions</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(ad.clicks)} clicks</p>
                        <p className="text-xs text-muted-foreground">{formatPercentage(ad.ctr)} CTR</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(ad.revenue)} revenue</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {advertisements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No advertisements created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Click-Through Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatPercentage(stats.averageCTR)}</div>
                      <Progress value={stats.averageCTR * 100} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Cost Per Click</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.averageCPC)}</div>
                      <p className="text-xs text-muted-foreground">Average CPC</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Cost Per Mille</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.averageCPM)}</div>
                      <p className="text-xs text-muted-foreground">Per 1,000 impressions</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ad Blocking Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Ad Blocking Detection</CardTitle>
                <CardDescription>
                  Monitor ad blocking and recovery strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blockingStats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Detections</span>
                      <span className="font-medium">{formatNumber(blockingStats.totalDetections)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Block Rate</span>
                      <span className="font-medium">{formatPercentage(blockingStats.averageBlockRate)}</span>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Detections</p>
                      {blockingStats.recentDetections.slice(0, 3).map((detection) => (
                        <div key={detection.id} className="flex items-center justify-between text-xs">
                          <span>{detection.detected ? 'Blocked' : 'Allowed'}</span>
                          <span>{formatPercentage(detection.blockRate)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Site Strategy */}
            <Card>
              <CardHeader>
                <CardTitle>Site Strategy</CardTitle>
                <CardDescription>
                  Recommended advertising strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {strategy && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended Ad Types</p>
                      <div className="flex flex-wrap gap-1">
                        {strategy.recommendedAdTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Optimal Placements</p>
                      <div className="flex flex-wrap gap-1">
                        {strategy.optimalPlacements.map((placement) => (
                          <Badge key={placement} variant="secondary" className="text-xs">
                            {placement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Revenue Focus</p>
                      <Badge variant="default" className="text-xs">
                        {strategy.revenueOptimization.focus}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 