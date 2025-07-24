'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  TrendingUp,
  Target,
  Brain,
  TestTube,
  Eye,
  MousePointer,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  Filter,
  Calendar,
  Globe,
  Activity,
  PieChart,
  LineChart,
  ScatterChart,
  RefreshCw,
  Database,
  Server,
  BarChart,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users2,
  FileText,
  Shield,
  AlertTriangle,
  Info,
  ChevronUp,
  ChevronDown,
  Minus,
  Maximize2,
  Minimize2,
  Grid,
  List,
  Search,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Share2,
  Eye as EyeIcon,
  Settings as SettingsIcon,
  Bell,
  BellOff,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  MapPin,
  Globe as GlobeIcon,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryEmpty,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Snowflake,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudHail,
  CloudSleet,
  CloudHaze,
  CloudMist,
  CloudSmog,
  CloudDust,
  CloudSand,
  CloudAsh,
  CloudSmoke,
  CloudFunnel,
  CloudMoon,
  CloudSun,
  CloudMoonRain,
  CloudSunRain,
  CloudMoonSnow,
  CloudSunSnow,
  CloudMoonLightning,
  CloudSunLightning,
  CloudMoonFog,
  CloudSunFog,
  CloudMoonHail,
  CloudSunHail,
  CloudMoonSleet,
  CloudSunSleet,
  CloudMoonHaze,
  CloudSunHaze,
  CloudMoonMist,
  CloudSunMist,
  CloudMoonSmog,
  CloudSunSmog,
  CloudMoonDust,
  CloudSunDust,
  CloudMoonSand,
  CloudSunSand,
  CloudMoonAsh,
  CloudSunAsh,
  CloudMoonSmoke,
  CloudSunSmoke,
  CloudMoonFunnel,
  CloudSunFunnel,
} from 'lucide-react';

interface BusinessIntelligenceDashboardProps {
  siteId: string;
}

interface ComprehensiveAnalytics {
  trafficAnalytics: Array<{
    id: string;
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    date: string;
  }>;
  revenueAnalytics: Array<{
    id: string;
    revenue: number;
    currency: string;
    subscriptionRevenue: number;
    advertisingRevenue: number;
    otherRevenue: number;
    date: string;
  }>;
  userAnalytics: Array<{
    id: string;
    userId: string;
    pageViews: number;
    timeOnSite: number;
    articlesRead: number;
    lastVisit: string;
  }>;
  contentAnalytics: Array<{
    id: string;
    views: number;
    uniqueViews: number;
    timeOnPage: number;
    bounceRate: number;
    socialShares: number;
    date: string;
  }>;
  siteAnalytics: Array<{
    id: string;
    totalRevenue: number;
    totalSubscribers: number;
    totalArticles: number;
    avgEngagement: number;
    conversionRate: number;
    date: string;
  }>;
  businessMetrics: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    currentValue: number;
    previousValue: number;
    change: number;
    trend: string;
    target: number;
    threshold: number;
    alertEnabled: boolean;
  }>;
  competitiveIntelligence: Array<{
    id: string;
    name: string;
    competitorName: string;
    competitorType: string;
    marketShare: number;
    competitivePosition: string;
    lastCollected: string;
  }>;
  predictiveInsights: Array<{
    id: string;
    name: string;
    type: string;
    category: string;
    confidence: number;
    impact: string;
    timeframe: string;
    isVerified: boolean;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    condition: string;
    value: number;
    isActive: boolean;
    triggeredAt: string;
  }>;
  summary: {
    totalPageViews: number;
    totalUniqueVisitors: number;
    averageBounceRate: number;
    averageSessionDuration: number;
    totalRevenue: number;
    totalSubscribers: number;
    totalArticles: number;
    averageEngagement: number;
    conversionRate: number;
  };
}

interface DataWarehouse {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  refreshInterval: number;
  retentionDays: number;
  etlJobs: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    lastRun: string;
    nextRun: string;
    duration: number;
    recordsProcessed: number;
    recordsFailed: number;
  }>;
  dataSources: Array<{
    id: string;
    name: string;
    type: string;
    syncStatus: string;
    lastSync: string;
  }>;
}

interface PerformanceMetrics {
  etlJobs: {
    total: number;
    active: number;
    failed: number;
    averageExecutionTime: number;
  };
  dashboards: {
    total: number;
    active: number;
    averageLoadTime: number;
    totalViews: number;
  };
  analyticsEngines: {
    total: number;
    active: number;
    averageResponseTime: number;
    averageThroughput: number;
  };
}

export function BusinessIntelligenceDashboard({ siteId }: BusinessIntelligenceDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [dataWarehouses, setDataWarehouses] = useState<DataWarehouse[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    category: '',
    type: '',
    severity: '',
  });

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormType, setCreateFormType] = useState<'warehouse' | 'metric' | 'intelligence' | null>(null);

  useEffect(() => {
    loadBIData();
  }, [siteId, filters]);

  const loadBIData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        analyticsResponse,
        warehousesResponse,
        performanceResponse,
      ] = await Promise.all([
        fetch(`/api/admin/business-intelligence/comprehensive-analytics?siteId=${siteId}&startDate=${filters.startDate}&endDate=${filters.endDate}`),
        fetch(`/api/admin/business-intelligence/data-warehouses?siteId=${siteId}`),
        fetch(`/api/admin/business-intelligence/performance-metrics?siteId=${siteId}`),
      ]);

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json();
        setAnalytics(data.analytics);
      }

      if (warehousesResponse.ok) {
        const data = await warehousesResponse.json();
        setDataWarehouses(data.warehouses);
      }

      if (performanceResponse.ok) {
        const data = await performanceResponse.json();
        setPerformanceMetrics(data.performance);
      }

    } catch (error) {
      console.error('Error loading BI data:', error);
      setError('Failed to load business intelligence data');
    } finally {
      setIsLoading(false);
    }
  };

  const executeETLJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/business-intelligence/etl/${jobId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      });

      if (response.ok) {
        // Reload data after execution
        await loadBIData();
      }
    } catch (error) {
      console.error('Error executing ETL job:', error);
    }
  };

  const syncDataSource = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/admin/business-intelligence/data-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });

      if (response.ok) {
        // Reload data after sync
        await loadBIData();
      }
    } catch (error) {
      console.error('Error syncing data source:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      running: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      high: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Info },
      low: { color: 'bg-blue-100 text-blue-800', icon: Info },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {severity}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ChevronUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ChevronDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading Business Intelligence Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for data-driven decision making
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadBIData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Resource
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="warehouse">Data Warehouse</TabsTrigger>
          <TabsTrigger value="intelligence">Competitive Intelligence</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analytics && (
            <>
              {/* KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analytics.summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{formatPercentage(analytics.summary.conversionRate)} conversion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(analytics.summary.totalUniqueVisitors)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(analytics.summary.totalPageViews)} page views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPercentage(analytics.summary.averageEngagement)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(analytics.summary.averageSessionDuration / 60)} min avg session
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(analytics.summary.totalSubscribers)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(analytics.summary.totalArticles)} articles published
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              {performanceMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>ETL, Dashboard, and Analytics Engine metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">ETL Jobs</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{performanceMetrics.etlJobs.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active:</span>
                            <span className="text-green-600">{performanceMetrics.etlJobs.active}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Failed:</span>
                            <span className="text-red-600">{performanceMetrics.etlJobs.failed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Execution:</span>
                            <span>{Math.round(performanceMetrics.etlJobs.averageExecutionTime)}s</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Dashboards</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{performanceMetrics.dashboards.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active:</span>
                            <span className="text-green-600">{performanceMetrics.dashboards.active}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Load Time:</span>
                            <span>{performanceMetrics.dashboards.averageLoadTime.toFixed(2)}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Views:</span>
                            <span>{formatNumber(performanceMetrics.dashboards.totalViews)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Analytics Engines</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{performanceMetrics.analyticsEngines.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active:</span>
                            <span className="text-green-600">{performanceMetrics.analyticsEngines.active}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Response:</span>
                            <span>{performanceMetrics.analyticsEngines.averageResponseTime.toFixed(2)}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Throughput:</span>
                            <span>{performanceMetrics.analyticsEngines.averageThroughput.toFixed(1)} req/s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Business Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Metrics</CardTitle>
                  <CardDescription>Key performance indicators and business metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.businessMetrics.map((metric) => (
                      <Card key={metric.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{metric.name}</h4>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <div className="text-2xl font-bold mb-1">
                          {metric.currentValue?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{metric.category} • {metric.type}</span>
                          <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                          </span>
                        </div>
                        {metric.target && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs">
                              <span>Target: {metric.target.toLocaleString()}</span>
                              <span>{((metric.currentValue || 0) / metric.target * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min((metric.currentValue || 0) / metric.target * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Traffic Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Analytics</CardTitle>
                  <CardDescription>Page views, unique visitors, and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.trafficAnalytics.slice(0, 10).map((traffic) => (
                      <div key={traffic.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{new Date(traffic.date).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(traffic.uniqueVisitors)} unique visitors
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(traffic.pageViews)} views</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPercentage(traffic.bounceRate)} bounce rate
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Data Warehouse Tab */}
        <TabsContent value="warehouse" className="space-y-6">
          {/* Data Warehouses */}
          <Card>
            <CardHeader>
              <CardTitle>Data Warehouses</CardTitle>
              <CardDescription>Data warehouse configurations and ETL job status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataWarehouses.map((warehouse) => (
                  <Card key={warehouse.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{warehouse.name}</h4>
                        <p className="text-sm text-muted-foreground">{warehouse.type}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(warehouse.isActive ? 'completed' : 'failed')}
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ETL Jobs */}
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">ETL Jobs</h5>
                      <div className="space-y-2">
                        {warehouse.etlJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{job.name}</div>
                              <div className="text-xs text-muted-foreground">{job.type}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(job.status)}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => executeETLJob(job.id)}
                                disabled={job.status === 'running'}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Sources */}
                    <div>
                      <h5 className="font-medium mb-2">Data Sources</h5>
                      <div className="space-y-2">
                        {warehouse.dataSources.map((source) => (
                          <div key={source.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{source.name}</div>
                              <div className="text-xs text-muted-foreground">{source.type}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(source.syncStatus)}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => syncDataSource(source.id)}
                                disabled={source.syncStatus === 'running'}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Competitive Intelligence</CardTitle>
                <CardDescription>Market analysis and competitor monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.competitiveIntelligence.map((intelligence) => (
                    <Card key={intelligence.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{intelligence.competitorName}</h4>
                        <Badge variant="outline">{intelligence.competitorType}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Market Share:</span>
                          <span className="font-medium">{formatPercentage(intelligence.marketShare || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Position:</span>
                          <span className="font-medium">{intelligence.competitivePosition || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Updated:</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(intelligence.lastCollected).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictive Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-powered predictions and business forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.predictiveInsights.map((insight) => (
                    <Card key={insight.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{insight.name}</h4>
                        <Badge variant={insight.isVerified ? "default" : "secondary"}>
                          {insight.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Type:</span>
                          <span className="font-medium">{insight.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Category:</span>
                          <span className="font-medium">{insight.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence:</span>
                          <span className="font-medium">{formatPercentage(insight.confidence)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Impact:</span>
                          <span className="font-medium">{insight.impact}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Timeframe:</span>
                          <span className="font-medium">{insight.timeframe}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Business Alerts</CardTitle>
                <CardDescription>Active alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.alerts.map((alert) => (
                    <Card key={alert.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {getSeverityBadge(alert.severity)}
                            <span className="font-medium">{alert.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.condition} {alert.value} - Triggered {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            Acknowledge
                          </Button>
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 