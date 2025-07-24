'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Activity,
  Lock,
  Eye,
  Settings,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  SecurityDashboardProps,
  SecurityMetrics,
  SecurityEvent,
  DeviceInfo,
  SecurityRiskLevel,
  MFAConfiguration,
} from '../types/security.types';
import { securityApi } from '../services/securityApi';

interface SecurityOverview {
  mfaEnabled: boolean;
  biometricsEnabled: boolean;
  trustedDevices: number;
  recentThreats: number;
  riskLevel: SecurityRiskLevel;
  lastUpdate: Date;
}

export function SecurityDashboard({ 
  userId, 
  timeRange, 
  onTimeRangeChange 
}: SecurityDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [mfaConfig, setMfaConfig] = useState<MFAConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchSecurityData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        statusResponse,
        metricsResponse,
        eventsResponse,
        devicesResponse,
        mfaResponse,
      ] = await Promise.all([
        securityApi.checkSecurityStatus(userId),
        securityApi.getSecurityMetrics(timeRange, userId),
        securityApi.getSecurityEvents({ 
          userId, 
          limit: 10,
          dateRange: getDateRange(timeRange),
        }),
        securityApi.getUserDevices(userId),
        securityApi.getMFAConfiguration(userId),
      ]);

      setOverview({
        ...statusResponse,
        lastUpdate: new Date(),
      });
      setMetrics(metricsResponse);
      setRecentEvents(eventsResponse);
      setDevices(devicesResponse);
      setMfaConfig(mfaResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return { start, end };
  };

  useEffect(() => {
    fetchSecurityData();
  }, [userId, timeRange]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getRiskLevelColor = (level: SecurityRiskLevel): string => {
    switch (level) {
      case 'very_low': return 'text-green-600 bg-green-50 border-green-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelIcon = (level: SecurityRiskLevel) => {
    switch (level) {
      case 'very_low': return <CheckCircle className="h-4 w-4" />;
      case 'low': return <Shield className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSecurityScore = (): number => {
    if (!overview) return 0;
    
    let score = 0;
    if (overview.mfaEnabled) score += 40;
    if (overview.biometricsEnabled) score += 30;
    if (overview.trustedDevices > 0) score += 20;
    if (overview.recentThreats === 0) score += 10;
    
    return Math.min(score, 100);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSecurityOverview = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Security Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getSecurityScore()}%</div>
          <Progress value={getSecurityScore()} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Based on your security settings
          </p>
        </CardContent>
      </Card>

      {/* MFA Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MFA Status</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {overview?.mfaEnabled ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">Enabled</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Disabled</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mfaConfig?.enabledMethods.length || 0} methods configured
          </p>
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trusted Devices</CardTitle>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.trustedDevices || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {devices.length} total devices
          </p>
        </CardContent>
      </Card>

      {/* Threat Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
          {overview && getRiskLevelIcon(overview.riskLevel)}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={overview ? getRiskLevelColor(overview.riskLevel) : ''}
            >
              {overview?.riskLevel.replace('_', ' ').toUpperCase() || 'Unknown'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {overview?.recentThreats || 0} recent threats
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Recent Security Events</span>
        </CardTitle>
        <CardDescription>
          Latest security events and alerts for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent security events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className={`p-1 rounded-full ${getRiskLevelColor(event.severity)}`}>
                  {getRiskLevelIcon(event.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {event.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {event.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.location.city}, {event.location.country}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.isResolved ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSecurityMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Authentication Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Successful Logins</span>
                <span className="font-semibold text-green-600">{metrics.successfulAuth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Failed Attempts</span>
                <span className="font-semibold text-red-600">{metrics.failedAuth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Threats Blocked</span>
                <span className="font-semibold text-orange-600">{metrics.threatsBlocked}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Devices</span>
                <span className="font-semibold text-blue-600">{metrics.newDevices}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Risk Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.riskDistribution).map(([level, count]) => {
                const total = Object.values(metrics.riskDistribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{level.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your account security
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityData}
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderSecurityOverview()}

      {/* Security Alerts */}
      {overview && overview.recentThreats > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Alert</AlertTitle>
          <AlertDescription>
            {overview.recentThreats} recent security threat{overview.recentThreats > 1 ? 's' : ''} detected. 
            Please review your recent activity and consider enabling additional security measures.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common security tasks and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span>MFA Settings</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Smartphone className="h-4 w-4" />
              <span>Manage Devices</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>View Audit Log</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="metrics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderSecurityMetrics()}
        </TabsContent>

        <TabsContent value="activity">
          {renderRecentActivity()}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {renderSecurityMetrics()}
          
          {/* Additional metrics can go here */}
          <Card>
            <CardHeader>
              <CardTitle>Security Compliance</CardTitle>
              <CardDescription>
                Your security posture against industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Multi-Factor Authentication</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Compliant
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Device Management</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Compliant
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Access Monitoring</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Compliant
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {overview?.lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}

export default SecurityDashboard; 