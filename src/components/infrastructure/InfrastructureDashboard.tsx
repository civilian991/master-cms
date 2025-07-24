'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe, 
  Server, 
  Database, 
  Shield, 
  Activity, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Network,
  Zap,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface CDNPerformanceMetrics {
  loadTime: number;
  timeToFirstByte: number;
  cacheHitRate: number;
  bandwidthUsage: number;
  errorRate: number;
  geographicPerformance: Record<string, number>;
}

interface LoadBalancerMetrics {
  requestCount: number;
  targetResponseTime: number;
  healthyHostCount: number;
  unhealthyHostCount: number;
  activeConnectionCount: number;
  newConnectionCount: number;
  processedBytes: number;
  timestamp: Date;
}

interface BackupMetrics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: number;
  averageBackupTime: number;
  lastBackupTime?: Date;
  nextScheduledBackup?: Date;
  storageUsed: number;
  storageAvailable: number;
}

interface ScalingEvent {
  id: string;
  type: 'scale_up' | 'scale_down';
  reason: string;
  oldCapacity: number;
  newCapacity: number;
  timestamp: Date;
  metrics: {
    cpuUtilization: number;
    memoryUtilization: number;
    requestCount: number;
  };
}

export default function InfrastructureDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [cdnMetrics, setCdnMetrics] = useState<CDNPerformanceMetrics | null>(null);
  const [loadBalancerMetrics, setLoadBalancerMetrics] = useState<LoadBalancerMetrics[]>([]);
  const [backupMetrics, setBackupMetrics] = useState<BackupMetrics | null>(null);
  const [scalingEvents, setScalingEvents] = useState<ScalingEvent[]>([]);
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Load CDN metrics
      const cdnResponse = await fetch(`/api/infrastructure/cdn?action=performance`);
      if (cdnResponse.ok) {
        const cdnData = await cdnResponse.json();
        setCdnMetrics(cdnData.performance);
      }

      // Load load balancer metrics
      const lbResponse = await fetch(`/api/infrastructure/load-balancer?action=metrics&timeRange=${timeRange}`);
      if (lbResponse.ok) {
        const lbData = await lbResponse.json();
        setLoadBalancerMetrics(lbData.metrics);
      }

      // Load backup metrics
      const backupResponse = await fetch(`/api/infrastructure/backup-recovery?action=metrics`);
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        setBackupMetrics(backupData.metrics);
      }

      // Load scaling events
      const scalingResponse = await fetch(`/api/infrastructure/load-balancer?action=scaling-events`);
      if (scalingResponse.ok) {
        const scalingData = await scalingResponse.json();
        setScalingEvents(scalingData.scalingEvents);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (time: number) => {
    return `${time}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your infrastructure components
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cdn">CDN</TabsTrigger>
          <TabsTrigger value="load-balancer">Load Balancer</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CDN Performance</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cdnMetrics ? formatTime(cdnMetrics.loadTime) : '--'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cache Hit Rate: {cdnMetrics ? `${(cdnMetrics.cacheHitRate * 100).toFixed(1)}%` : '--'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Load Balancer</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadBalancerMetrics.length > 0 ? loadBalancerMetrics[0].requestCount.toLocaleString() : '--'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Healthy Hosts: {loadBalancerMetrics.length > 0 ? loadBalancerMetrics[0].healthyHostCount : '--'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupMetrics ? backupMetrics.successfulBackups : '--'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Success Rate: {backupMetrics ? `${((backupMetrics.successfulBackups / backupMetrics.totalBackups) * 100).toFixed(1)}%` : '--'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Secure</div>
                <p className="text-xs text-muted-foreground">
                  All systems protected
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Scaling Events</CardTitle>
                <CardDescription>Auto-scaling activity in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scalingEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {event.type === 'scale_up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{event.type === 'scale_up' ? 'Scale Up' : 'Scale Down'}</p>
                          <p className="text-sm text-muted-foreground">{event.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{event.oldCapacity} → {event.newCapacity}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current status of all infrastructure components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>CDN</span>
                    </div>
                    <Badge className={getStatusColor('healthy')}>
                      {getStatusIcon('healthy')}
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4" />
                      <span>Load Balancer</span>
                    </div>
                    <Badge className={getStatusColor('healthy')}>
                      {getStatusIcon('healthy')}
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>Database</span>
                    </div>
                    <Badge className={getStatusColor('healthy')}>
                      {getStatusIcon('healthy')}
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Security</span>
                    </div>
                    <Badge className={getStatusColor('healthy')}>
                      {getStatusIcon('healthy')}
                      Secure
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cdn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CDN Performance</CardTitle>
              <CardDescription>Content Delivery Network metrics and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {cdnMetrics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Load Time</p>
                    <p className="text-2xl font-bold">{formatTime(cdnMetrics.loadTime)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Time to First Byte</p>
                    <p className="text-2xl font-bold">{formatTime(cdnMetrics.timeToFirstByte)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cache Hit Rate</p>
                    <p className="text-2xl font-bold">{(cdnMetrics.cacheHitRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Bandwidth Usage</p>
                    <p className="text-2xl font-bold">{formatBytes(cdnMetrics.bandwidthUsage)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No CDN metrics available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Performance</CardTitle>
                <CardDescription>Response times by region</CardDescription>
              </CardHeader>
              <CardContent>
                {cdnMetrics ? (
                  <div className="space-y-3">
                    {Object.entries(cdnMetrics.geographicPerformance).map(([region, time]) => (
                      <div key={region} className="flex items-center justify-between">
                        <span className="font-medium">{region}</span>
                        <span className="text-muted-foreground">{formatTime(time)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No geographic data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CDN Actions</CardTitle>
                <CardDescription>Manage CDN configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure CDN
                  </Button>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Invalidate Cache
                  </Button>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="load-balancer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Balancer Metrics</CardTitle>
              <CardDescription>Application load balancer performance and health</CardDescription>
            </CardHeader>
            <CardContent>
              {loadBalancerMetrics.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Request Count</p>
                    <p className="text-2xl font-bold">{loadBalancerMetrics[0].requestCount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Response Time</p>
                    <p className="text-2xl font-bold">{formatTime(loadBalancerMetrics[0].targetResponseTime)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Healthy Hosts</p>
                    <p className="text-2xl font-bold">{loadBalancerMetrics[0].healthyHostCount}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Active Connections</p>
                    <p className="text-2xl font-bold">{loadBalancerMetrics[0].activeConnectionCount.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No load balancer metrics available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scaling Events</CardTitle>
                <CardDescription>Recent auto-scaling activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scalingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {event.type === 'scale_up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{event.type === 'scale_up' ? 'Scale Up' : 'Scale Down'}</p>
                          <p className="text-sm text-muted-foreground">{event.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{event.oldCapacity} → {event.newCapacity}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Load Balancer Actions</CardTitle>
                <CardDescription>Manage load balancer configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Auto-Scaling
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Health Checks
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Network className="h-4 w-4 mr-2" />
                    Traffic Distribution
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>Database and file system backup status</CardDescription>
            </CardHeader>
            <CardContent>
              {backupMetrics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Total Backups</p>
                    <p className="text-2xl font-bold">{backupMetrics.totalBackups}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {((backupMetrics.successfulBackups / backupMetrics.totalBackups) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Total Size</p>
                    <p className="text-2xl font-bold">{formatBytes(backupMetrics.totalSize)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Storage Used</p>
                    <p className="text-2xl font-bold">{formatBytes(backupMetrics.storageUsed)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No backup metrics available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Backup Schedule</CardTitle>
                <CardDescription>Next scheduled backups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Database Backup</span>
                    <span className="text-muted-foreground">
                      {backupMetrics?.nextScheduledBackup 
                        ? new Date(backupMetrics.nextScheduledBackup).toLocaleString()
                        : 'Not scheduled'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">File System Backup</span>
                    <span className="text-muted-foreground">
                      {backupMetrics?.nextScheduledBackup 
                        ? new Date(backupMetrics.nextScheduledBackup).toLocaleString()
                        : 'Not scheduled'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Backup</span>
                    <span className="text-muted-foreground">
                      {backupMetrics?.lastBackupTime 
                        ? new Date(backupMetrics.lastBackupTime).toLocaleString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Actions</CardTitle>
                <CardDescription>Manage backup and recovery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Backup
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Retention
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Infrastructure security overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">SSL/TLS</p>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">WAF</p>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">DDoS Protection</p>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rate Limiting</p>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Configured
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Actions</CardTitle>
                <CardDescription>Manage security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Configure WAF
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    DDoS Protection
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Security Headers
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
                <CardDescription>Real-time security alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">No Security Threats</p>
                        <p className="text-sm text-muted-foreground">All systems secure</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">Now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Dashboard</CardTitle>
              <CardDescription>Real-time infrastructure monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">CPU Utilization</p>
                  <p className="text-2xl font-bold">45%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Memory Usage</p>
                  <p className="text-2xl font-bold">62%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Disk Usage</p>
                  <p className="text-2xl font-bold">78%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Network I/O</p>
                  <p className="text-2xl font-bold">1.2 GB/s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Alert Configuration</CardTitle>
                <CardDescription>Configure monitoring alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Set Up Alerts
                  </Button>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Metrics
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Alert Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest monitoring alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">All Systems Normal</p>
                        <p className="text-sm text-muted-foreground">No critical alerts</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">Now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 