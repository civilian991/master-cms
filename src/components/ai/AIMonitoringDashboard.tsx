'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Clock,
  BarChart3,
  RefreshCw,
  Zap,
  Shield,
  Target
} from 'lucide-react';

interface AIMonitoringDashboardProps {
  siteId: number;
}

interface MonitoringData {
  health: {
    status: boolean;
    services: Record<string, any>;
  };
  quality: {
    totalRequests: number;
    successfulRequests: number;
    successRate: number;
    totalCost: number;
    averageQualityScore: number;
    averageResponseTime: number;
  };
  recentLogs: Array<{
    id: number;
    contentType: string;
    provider: string;
    model: string;
    status: string;
    cost: number;
    qualityScore: number;
    responseTime: number;
    createdAt: string;
  }>;
  costAnalysis: {
    totalCost: number;
    costByProvider: Record<string, number>;
    costByModel: Record<string, number>;
    dailyCosts: Record<string, number>;
    averageCostPerRequest: number;
  };
  performanceTrends: {
    responseTimeTrends: Record<string, number>;
    qualityTrends: Record<string, number>;
    successRate: number;
    averageResponseTime: number;
    averageQualityScore: number;
  };
}

export function AIMonitoringDashboard({ siteId }: AIMonitoringDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<MonitoringData | null>(null);

  useEffect(() => {
    loadMonitoringData();
  }, [siteId, timeRange]);

  const loadMonitoringData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai/monitoring?siteId=${siteId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to load monitoring data');
      }

      const monitoringData = await response.json();
      setData(monitoringData);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCircuitBreakers = async () => {
    try {
      const response = await fetch('/api/ai/monitoring/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId }),
      });

      if (response.ok) {
        loadMonitoringData(); // Reload data after reset
      } else {
        throw new Error('Failed to reset circuit breakers');
      }
    } catch (error) {
      console.error('Error resetting circuit breakers:', error);
      setError('Failed to reset circuit breakers');
    }
  };

  const getHealthStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    );
  };

  const getHealthStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Healthy
      </Badge>
    ) : (
      <Badge variant="destructive">Unhealthy</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
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

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No monitoring data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of AI service performance and usage
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadMonitoringData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Service Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getHealthStatusIcon(data.health.status)}
              <div>
                <div className="font-semibold">AI Services</div>
                <div className="text-sm text-muted-foreground">
                  {data.health.status ? 'All services operational' : 'Some services experiencing issues'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getHealthStatusBadge(data.health.status)}
              <Button variant="outline" size="sm" onClick={resetCircuitBreakers}>
                <Zap className="mr-2 h-4 w-4" />
                Reset Circuit Breakers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold">{data.quality.successRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {data.quality.successfulRequests} / {data.quality.totalRequests} requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Avg Response Time</span>
            </div>
            <div className="text-2xl font-bold">{formatDuration(data.quality.averageResponseTime)}</div>
            <div className="text-xs text-muted-foreground">
              Average processing time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Quality Score</span>
            </div>
            <div className="text-2xl font-bold">{data.quality.averageQualityScore.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">
              Average content quality
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Total Cost</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.quality.totalCost)}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(data.costAnalysis.averageCostPerRequest)} per request
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
            <CardDescription>AI service costs breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.costAnalysis.costByProvider).map(([provider, cost]) => (
                <div key={provider} className="flex items-center justify-between">
                  <span className="capitalize">{provider}</span>
                  <span className="font-medium">{formatCurrency(cost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
            <CardDescription>Cost breakdown by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.costAnalysis.costByModel).map(([model, cost]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="font-mono text-sm">{model}</span>
                  <span className="font-medium">{formatCurrency(cost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest AI processing logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{log.contentType}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.provider} • {log.model}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(log.cost)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(log.responseTime)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{log.qualityScore?.toFixed(1) || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Quality</div>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>Average response time over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.performanceTrends.responseTimeTrends)
                .slice(-7)
                .map(([date, time]) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                    <span className="font-medium">{formatDuration(time)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Trends</CardTitle>
            <CardDescription>Content quality scores over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.performanceTrends.qualityTrends)
                .slice(-7)
                .map(([date, score]) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                    <span className="font-medium">{score.toFixed(1)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 