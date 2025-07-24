'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Memory,
  Monitor,
  Network,
  Timer,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Zap,
  Clock,
} from 'lucide-react';

import {
  PerformanceSnapshot,
  PerformanceMetric,
  ActiveAlert,
  OptimizationRecommendation,
  MonitoringStatus,
  TimeRange,
  PerformanceDashboardProps,
} from '../types/performance.types';

import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export function PerformanceDashboard({
  initialTimeRange = { from: new Date(Date.now() - 24 * 60 * 60 * 1000), to: new Date(), timezone: 'UTC' },
  autoRefresh = true,
  refreshInterval = 30000,
  layout = 'grid',
  theme = 'auto',
  widgets = ['overview', 'web_vitals', 'runtime', 'network', 'database', 'cache'],
  filters = [],
  onMetricClick,
  onAlertClick,
  onRecommendationClick,
  className = '',
}: PerformanceDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(initialTimeRange);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);

  const {
    snapshot,
    metrics,
    alerts,
    recommendations,
    isLoading,
    error,
    refresh,
    getMetricsByCategory,
    getWebVitalsScore,
  } = usePerformanceMonitoring({
    autoRefresh,
    refreshInterval,
    timeRange: selectedTimeRange,
  });

  // Memoized calculations
  const webVitalsMetrics = useMemo(() => getMetricsByCategory('core_web_vitals'), [metrics]);
  const runtimeMetrics = useMemo(() => getMetricsByCategory('runtime'), [metrics]);
  const networkMetrics = useMemo(() => getMetricsByCategory('network'), [metrics]);
  const renderingMetrics = useMemo(() => getMetricsByCategory('rendering'), [metrics]);

  const overallScore = useMemo(() => {
    if (!snapshot) return 0;
    return snapshot.score;
  }, [snapshot]);

  const statusColor = useMemo(() => {
    if (!snapshot) return 'gray';
    switch (snapshot.status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'degraded': return 'orange';
      case 'unhealthy': return 'red';
      case 'critical': return 'red';
      default: return 'gray';
    }
  }, [snapshot?.status]);

  // Time range options
  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour', duration: 60 * 60 * 1000 },
    { value: '6h', label: 'Last 6 Hours', duration: 6 * 60 * 60 * 1000 },
    { value: '24h', label: 'Last 24 Hours', duration: 24 * 60 * 60 * 1000 },
    { value: '7d', label: 'Last 7 Days', duration: 7 * 24 * 60 * 60 * 1000 },
    { value: '30d', label: 'Last 30 Days', duration: 30 * 24 * 60 * 60 * 1000 },
  ];

  const handleTimeRangeChange = (value: string) => {
    const option = timeRangeOptions.find(opt => opt.value === value);
    if (option) {
      setSelectedTimeRange({
        from: new Date(Date.now() - option.duration),
        to: new Date(),
        timezone: 'UTC',
      });
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleExport = () => {
    if (!snapshot) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      snapshot,
      metrics,
      alerts,
      recommendations,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <span>Failed to load performance data: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and optimization insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select onValueChange={handleTimeRangeChange} defaultValue="24h">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold">{overallScore}</span>
                  <span className="text-sm text-muted-foreground ml-1">/100</span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-${statusColor}-100`}>
                <Monitor className={`w-6 h-6 text-${statusColor}-600`} />
              </div>
            </div>
            <Progress value={overallScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center mt-2">
                  <Badge variant={snapshot?.status === 'healthy' ? 'default' : 'destructive'}>
                    {snapshot?.status === 'healthy' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {snapshot?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {snapshot?.timestamp ? new Date(snapshot.timestamp).toLocaleTimeString() : '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold">{alerts.length}</span>
                  {alerts.length > 0 && (
                    <TrendingUp className="w-4 h-4 text-red-500 ml-2" />
                  )}
                </div>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {alerts.filter(a => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recommendations</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold">{recommendations.length}</span>
                  <TrendingUp className="w-4 h-4 text-green-500 ml-2" />
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {recommendations.filter(r => r.priority === 'high').length} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="web_vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="runtime">Runtime</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            metrics={metrics}
            webVitalsMetrics={webVitalsMetrics}
            runtimeMetrics={runtimeMetrics}
            networkMetrics={networkMetrics}
            onMetricClick={onMetricClick}
          />
        </TabsContent>

        <TabsContent value="web_vitals" className="space-y-6">
          <WebVitalsTab 
            metrics={webVitalsMetrics}
            score={getWebVitalsScore()}
            onMetricClick={onMetricClick}
          />
        </TabsContent>

        <TabsContent value="runtime" className="space-y-6">
          <RuntimeTab 
            metrics={runtimeMetrics}
            onMetricClick={onMetricClick}
          />
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <NetworkTab 
            metrics={networkMetrics}
            onMetricClick={onMetricClick}
          />
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <DatabaseTab 
            onMetricClick={onMetricClick}
          />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <OptimizationTab 
            recommendations={recommendations}
            alerts={alerts}
            onRecommendationClick={onRecommendationClick}
            onAlertClick={onAlertClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({ 
  metrics, 
  webVitalsMetrics, 
  runtimeMetrics, 
  networkMetrics,
  onMetricClick 
}: {
  metrics: PerformanceMetric[];
  webVitalsMetrics: PerformanceMetric[];
  runtimeMetrics: PerformanceMetric[];
  networkMetrics: PerformanceMetric[];
  onMetricClick?: (metric: PerformanceMetric) => void;
}) {
  // Prepare chart data
  const timeSeriesData = useMemo(() => {
    const data: any[] = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000); // Last 24 hours
      data.push({
        time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit' }),
        lcp: Math.random() * 1000 + 1500, // Mock data
        fid: Math.random() * 50 + 50,
        cls: Math.random() * 0.1 + 0.05,
        memory: Math.random() * 20 + 40,
      });
    }
    
    return data;
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lcp" stroke="#8884d8" name="LCP (ms)" />
              <Line type="monotone" dataKey="fid" stroke="#82ca9d" name="FID (ms)" />
              <Line type="monotone" dataKey="memory" stroke="#ffc658" name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Web Vitals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webVitalsMetrics.slice(0, 3).map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => onMetricClick?.(metric)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Runtime Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            Runtime Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runtimeMetrics.slice(0, 3).map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => onMetricClick?.(metric)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WebVitalsTab({ 
  metrics, 
  score, 
  onMetricClick 
}: {
  metrics: PerformanceMetric[];
  score: number;
  onMetricClick?: (metric: PerformanceMetric) => void;
}) {
  const webVitalsData = useMemo(() => {
    return metrics.map((metric, index) => ({
      name: metric.name,
      value: metric.value,
      threshold: metric.threshold?.warning || 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Core Web Vitals Score: {score}/100</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={webVitalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
              <Bar dataKey="threshold" fill="#ff7300" opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => onMetricClick?.(metric)}
                detailed
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RuntimeTab({ 
  metrics, 
  onMetricClick 
}: {
  metrics: PerformanceMetric[];
  onMetricClick?: (metric: PerformanceMetric) => void;
}) {
  const memoryMetrics = metrics.filter(m => m.name.toLowerCase().includes('memory'));
  const cpuMetrics = metrics.filter(m => m.name.toLowerCase().includes('cpu') || m.name.toLowerCase().includes('task'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Memory className="w-5 h-5 mr-2" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memoryMetrics.map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => onMetricClick?.(metric)}
                detailed
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            CPU & Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cpuMetrics.map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => onMetricClick?.(metric)}
                detailed
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NetworkTab({ 
  metrics, 
  onMetricClick 
}: {
  metrics: PerformanceMetric[];
  onMetricClick?: (metric: PerformanceMetric) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="w-5 h-5 mr-2" />
            Network Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => onMetricClick?.(metric)}
                detailed
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resource Loading</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'JavaScript', value: 400 },
                  { name: 'CSS', value: 150 },
                  { name: 'Images', value: 800 },
                  { name: 'Fonts', value: 200 },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function DatabaseTab({ 
  onMetricClick 
}: {
  onMetricClick?: (metric: PerformanceMetric) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Query Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Average Query Time</span>
              <span className="text-lg font-bold">24ms</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Slow Queries</span>
              <span className="text-lg font-bold text-yellow-600">3</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Connection Pool</span>
              <span className="text-lg font-bold">85%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Storage & Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Cache Hit Ratio</span>
              <span className="text-lg font-bold text-green-600">94%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Index Efficiency</span>
              <span className="text-lg font-bold">89%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Storage Usage</span>
              <span className="text-lg font-bold">67%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OptimizationTab({ 
  recommendations, 
  alerts, 
  onRecommendationClick, 
  onAlertClick 
}: {
  recommendations: OptimizationRecommendation[];
  alerts: ActiveAlert[];
  onRecommendationClick?: (recommendation: OptimizationRecommendation) => void;
  onAlertClick?: (alert: ActiveAlert) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onRecommendationClick?.(recommendation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}>
                        {recommendation.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {recommendation.estimatedImpact}% improvement
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{alert.message}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.metric}: {alert.value}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <AlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MetricCard({ 
  metric, 
  onClick, 
  detailed = false 
}: {
  metric: PerformanceMetric;
  onClick?: () => void;
  detailed?: boolean;
}) {
  const getStatusColor = (metric: PerformanceMetric) => {
    if (!metric.threshold) return 'green';
    
    const { warning, critical, operator } = metric.threshold;
    const value = metric.value;
    
    switch (operator) {
      case 'gt':
        if (value > critical) return 'red';
        if (value > warning) return 'yellow';
        return 'green';
      case 'lt':
        if (value < critical) return 'red';
        if (value < warning) return 'yellow';
        return 'green';
      default:
        return 'green';
    }
  };

  const statusColor = getStatusColor(metric);

  return (
    <div
      className={`p-3 border rounded-lg ${onClick ? 'cursor-pointer hover:bg-muted' : ''} transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{metric.name}</p>
          <div className="flex items-center mt-1">
            <span className="text-lg font-bold">
              {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
            </span>
            <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
          </div>
          {detailed && metric.threshold && (
            <p className="text-xs text-muted-foreground mt-1">
              Threshold: {metric.threshold.warning} {metric.unit}
            </p>
          )}
        </div>
        <div className={`w-3 h-3 rounded-full bg-${statusColor}-500`} />
      </div>
    </div>
  );
}

export default PerformanceDashboard; 