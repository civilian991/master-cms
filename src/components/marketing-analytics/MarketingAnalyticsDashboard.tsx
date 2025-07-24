'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Target,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  ShoppingCart,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  Search,
  Settings,
  FileText,
  Share2,
  Globe,
  Mail,
  MessageSquare,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';

interface MarketingAnalyticsDashboard {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalLeads: number;
    totalRevenue: number;
    totalSpent: number;
    overallROI: number;
  };
  performanceByChannel: Array<{
    channel: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
    roi: number;
  }>;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roi: number;
  }>;
  attributionBreakdown: Array<{
    channel: string;
    firstTouch: number;
    lastTouch: number;
    assisted: number;
    totalConversions: number;
  }>;
  trends: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
  }>;
  forecasts: Array<{
    period: string;
    predictedImpressions: number;
    predictedClicks: number;
    predictedConversions: number;
    predictedRevenue: number;
    predictedCost: number;
    confidence: number;
    factors: string[];
  }>;
}

interface MarketingROI {
  campaignId: string;
  campaignName: string;
  totalSpent: number;
  totalRevenue: number;
  totalConversions: number;
  roi: number;
  roas: number;
  cpa: number;
  cpl: number;
  ltv: number;
  paybackPeriod: number;
}

interface RealTimeMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  lastUpdated: string;
}

export function MarketingAnalyticsDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<MarketingAnalyticsDashboard | null>(null);
  const [roiData, setRoiData] = useState<MarketingROI[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Filters
  const [channelFilter, setChannelFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [siteId, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboard(),
        loadROIData(),
        loadRealTimeData(),
      ]);
    } catch (error) {
      console.error('Failed to load marketing analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const params = new URLSearchParams({
        siteId,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/marketing-analytics/dashboard?${params}`);
      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const loadROIData = async () => {
    try {
      const params = new URLSearchParams({
        siteId,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/marketing-analytics/roi?${params}`);
      const data = await response.json();
      setRoiData(data.roiData);
    } catch (error) {
      console.error('Failed to load ROI data:', error);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const response = await fetch(`/api/marketing-analytics/realtime?siteId=${siteId}`);
      const data = await response.json();
      setRealTimeMetrics(data.realTimeMetrics);
    } catch (error) {
      console.error('Failed to load real-time data:', error);
    }
  };

  const exportData = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const params = new URLSearchParams({
        siteId,
        format,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/marketing-analytics/export?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marketing-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marketing-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getROIColor = (roi: number) => {
    if (roi > 0) return 'text-green-600';
    if (roi < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active', icon: Play },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: Pause },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', label: 'Completed', icon: CheckCircle },
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: FileText },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getChannelIcon = (channel: string) => {
    const iconConfig = {
      'Paid Search': Globe,
      'Social Media': Share2,
      'Email': Mail,
      'Content': FileText,
      'Direct': Target,
    };

    const Icon = iconConfig[channel as keyof typeof iconConfig] || Target;
    return <Icon className="h-4 w-4" />;
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading marketing analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">No marketing analytics data found for this site.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Analytics</h1>
          <p className="text-gray-600">Performance tracking, ROI analysis, and forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => exportData('json')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{dashboard.overview.totalCampaigns}</p>
                <p className="text-xs text-gray-500">
                  {dashboard.overview.activeCampaigns} active
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{formatNumber(dashboard.overview.totalLeads)}</p>
                <p className="text-xs text-gray-500">Generated</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.overview.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Generated</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall ROI</p>
                <p className={`text-2xl font-bold ${getROIColor(dashboard.overview.overallROI)}`}>
                  {formatPercentage(dashboard.overview.overallROI)}
                </p>
                <p className="text-xs text-gray-500">
                  Spent: {formatCurrency(dashboard.overview.totalSpent)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Metrics
              <Badge className="bg-green-100 text-green-800">
                <Clock className="mr-1 h-3 w-3" />
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Impressions</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(realTimeMetrics.impressions)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MousePointer className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Clicks</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(realTimeMetrics.clicks)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Conversions</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(realTimeMetrics.conversions)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(realTimeMetrics.revenue)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Last updated: {new Date(realTimeMetrics.lastUpdated).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            ROI Analysis
          </TabsTrigger>
          <TabsTrigger value="attribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Attribution
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Forecasts
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.performanceByChannel.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.channel)}
                        <div>
                          <p className="font-medium">{channel.channel}</p>
                          <p className="text-sm text-gray-500">
                            {formatNumber(channel.impressions)} impressions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getROIColor(channel.roi)}`}>
                          {formatPercentage(channel.roi)} ROI
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(channel.revenue)} revenue
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.topPerformingCampaigns.slice(0, 5).map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{campaign.name}</p>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatNumber(campaign.impressions)} impressions • {formatNumber(campaign.clicks)} clicks
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getROIColor(campaign.roi)}`}>
                          {formatPercentage(campaign.roi)} ROI
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(campaign.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROI Analysis Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign ROI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Campaign</th>
                      <th className="text-right p-2">Spent</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Conversions</th>
                      <th className="text-right p-2">ROI</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-right p-2">CPA</th>
                      <th className="text-right p-2">LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiData.map((roi) => (
                      <tr key={roi.campaignId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{roi.campaignName}</td>
                        <td className="p-2 text-right">{formatCurrency(roi.totalSpent)}</td>
                        <td className="p-2 text-right">{formatCurrency(roi.totalRevenue)}</td>
                        <td className="p-2 text-right">{roi.totalConversions}</td>
                        <td className={`p-2 text-right font-bold ${getROIColor(roi.roi)}`}>
                          {formatPercentage(roi.roi)}
                        </td>
                        <td className="p-2 text-right">{roi.roas.toFixed(2)}x</td>
                        <td className="p-2 text-right">{formatCurrency(roi.cpa)}</td>
                        <td className="p-2 text-right">{formatCurrency(roi.ltv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Attribution Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.attributionBreakdown.map((attribution, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(attribution.channel)}
                        <h3 className="font-medium">{attribution.channel}</h3>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {attribution.totalConversions} conversions
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{attribution.firstTouch}</p>
                        <p className="text-sm text-gray-600">First Touch</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{attribution.lastTouch}</p>
                        <p className="text-sm text-gray-600">Last Touch</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{attribution.assisted}</p>
                        <p className="text-sm text-gray-600">Assisted</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.performanceByChannel.map((channel, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel.channel)}
                        <h3 className="font-medium">{channel.channel}</h3>
                      </div>
                      <Badge className={`${getROIColor(channel.roi)} bg-opacity-10`}>
                        {formatPercentage(channel.roi)} ROI
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(channel.impressions)}</p>
                        <p className="text-sm text-gray-600">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(channel.clicks)}</p>
                        <p className="text-sm text-gray-600">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(channel.conversions)}</p>
                        <p className="text-sm text-gray-600">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatCurrency(channel.revenue)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.forecasts.slice(0, 6).map((forecast, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{forecast.period}</h3>
                      <Badge className={`${forecast.confidence > 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {(forecast.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(forecast.predictedImpressions)}</p>
                        <p className="text-sm text-gray-600">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(forecast.predictedClicks)}</p>
                        <p className="text-sm text-gray-600">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(forecast.predictedConversions)}</p>
                        <p className="text-sm text-gray-600">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatCurrency(forecast.predictedRevenue)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatCurrency(forecast.predictedCost)}</p>
                        <p className="text-sm text-gray-600">Cost</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Factors: {forecast.factors.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.trends.slice(-7).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{trend.date}</span>
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">{formatNumber(trend.impressions)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointer className="h-3 w-3 text-green-500" />
                        <span className="text-sm">{formatNumber(trend.clicks)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-3 w-3 text-purple-500" />
                        <span className="text-sm">{formatNumber(trend.conversions)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(trend.revenue)}</p>
                      <p className="text-sm text-gray-500">Cost: {formatCurrency(trend.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 