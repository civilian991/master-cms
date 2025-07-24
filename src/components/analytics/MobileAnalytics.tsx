/**
 * Mobile Analytics Components
 * React components for analytics integration and dashboard display
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  mobileAnalyticsService, 
  MobileAnalyticsEvent, 
  DeviceInfo, 
  UserEngagement, 
  PWAMetrics,
  PerformanceMetrics
} from '@/lib/services/mobile-analytics-service';
import { 
  BarChart3, 
  Users, 
  Smartphone, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Timer, 
  Wifi, 
  WifiOff,
  Battery,
  Memory,
  Zap,
  Target,
  Activity,
  Download,
  Share2,
  Bell,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

// Analytics Provider Component
interface AnalyticsProviderProps {
  children: React.ReactNode;
  userId?: string;
  config?: {
    enabled?: boolean;
    debug?: boolean;
    sampleRate?: number;
  };
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  userId,
  config
}) => {
  useEffect(() => {
    // Update configuration
    if (config) {
      mobileAnalyticsService.updateConfig(config);
    }

    // Set user ID if provided
    if (userId) {
      mobileAnalyticsService.setUserId(userId);
    }

    // Track initial page view
    mobileAnalyticsService.trackEvent('app_start', 'navigation', {
      timestamp: Date.now(),
      user_id: userId
    });

    return () => {
      // Flush any pending events on unmount
      mobileAnalyticsService.flush();
    };
  }, [userId, config]);

  return <>{children}</>;
};

// Analytics Dashboard Component
interface AnalyticsDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className,
  refreshInterval = 30000
}) => {
  const [summary, setSummary] = useState(mobileAnalyticsService.getAnalyticsSummary());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateSummary = () => {
      setSummary(mobileAnalyticsService.getAnalyticsSummary());
    };

    updateSummary();

    const interval = setInterval(updateSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleFlush = async () => {
    setIsLoading(true);
    try {
      await mobileAnalyticsService.flush();
      setSummary(mobileAnalyticsService.getAnalyticsSummary());
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mobile Analytics</h2>
          <p className="text-muted-foreground">Real-time mobile app analytics and insights</p>
        </div>
        <Button onClick={handleFlush} disabled={isLoading}>
          {isLoading ? 'Flushing...' : 'Flush Events'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Session ID"
          value={summary.session.substring(0, 8)}
          description="Current session"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="Events Queued"
          value={summary.eventsQueued}
          description="Pending analytics events"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          title="Device Type"
          value={summary.deviceInfo.deviceType}
          description={`${summary.deviceInfo.operatingSystem} ${summary.deviceInfo.osVersion}`}
          icon={<Smartphone className="h-4 w-4" />}
        />
        <MetricCard
          title="Screen Resolution"
          value={`${summary.deviceInfo.screenWidth}x${summary.deviceInfo.screenHeight}`}
          description={`${summary.deviceInfo.pixelRatio}x pixel ratio`}
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      {/* Device Information */}
      <DeviceInfoCard deviceInfo={summary.deviceInfo} />

      {/* Engagement Metrics */}
      <EngagementCard engagement={summary.engagement} />

      {/* PWA Metrics */}
      <PWAMetricsCard pwaMetrics={summary.pwaMetrics} />
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-muted rounded-lg">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500">{trend.value}%</span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Device Information Card
interface DeviceInfoCardProps {
  deviceInfo: DeviceInfo;
  className?: string;
}

const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ deviceInfo, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Device Information
        </CardTitle>
        <CardDescription>
          Current device specifications and capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Device</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{deviceInfo.deviceType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS:</span>
                <span>{deviceInfo.operatingSystem} {deviceInfo.osVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Browser:</span>
                <span>{deviceInfo.browser} {deviceInfo.browserVersion}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Display</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution:</span>
                <span>{deviceInfo.screenWidth}×{deviceInfo.screenHeight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pixel Ratio:</span>
                <span>{deviceInfo.pixelRatio}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation:</span>
                <Badge variant="outline">{deviceInfo.orientation}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Capabilities</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Touch:</span>
                <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"}>
                  {deviceInfo.touchSupport ? 'Supported' : 'Not Supported'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connection:</span>
                <Badge variant="outline">{deviceInfo.connectionType || 'Unknown'}</Badge>
              </div>
              {deviceInfo.memoryGB && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory:</span>
                  <span>{deviceInfo.memoryGB}GB</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// User Engagement Card
interface EngagementCardProps {
  engagement: UserEngagement;
  className?: string;
}

const EngagementCard: React.FC<EngagementCardProps> = ({ engagement, className }) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Engagement
        </CardTitle>
        <CardDescription>
          Current session engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{engagement.pageViews}</div>
            <div className="text-sm text-muted-foreground">Page Views</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{engagement.interactions}</div>
            <div className="text-sm text-muted-foreground">Interactions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{engagement.scrollDepth}%</div>
            <div className="text-sm text-muted-foreground">Scroll Depth</div>
            <Progress value={engagement.scrollDepth} className="mt-2" />
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatDuration(engagement.sessionDuration)}
            </div>
            <div className="text-sm text-muted-foreground">Session Duration</div>
          </div>
        </div>

        {engagement.conversionEvents.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">Conversion Events</h4>
            <div className="flex flex-wrap gap-2">
              {engagement.conversionEvents.map((event, index) => (
                <Badge key={index} variant="outline">
                  <Target className="h-3 w-3 mr-1" />
                  {event}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// PWA Metrics Card
interface PWAMetricsCardProps {
  pwaMetrics: PWAMetrics;
  className?: string;
}

const PWAMetricsCard: React.FC<PWAMetricsCardProps> = ({ pwaMetrics, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          PWA Metrics
        </CardTitle>
        <CardDescription>
          Progressive Web App installation and usage statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Installation</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Installed:</span>
                <Badge variant={pwaMetrics.isInstalled ? "default" : "secondary"}>
                  {pwaMetrics.isInstalled ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prompt Shown:</span>
                <Badge variant={pwaMetrics.installPromptShown ? "default" : "secondary"}>
                  {pwaMetrics.installPromptShown ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Install Accepted:</span>
                <Badge variant={pwaMetrics.installAccepted ? "default" : "secondary"}>
                  {pwaMetrics.installAccepted ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Usage</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offline Usage:</span>
                <span className="text-sm">{pwaMetrics.offlineUsage} times</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cache Hit Rate:</span>
                <div className="flex items-center gap-2">
                  <Progress value={pwaMetrics.cacheHitRate} className="w-16" />
                  <span className="text-sm">{pwaMetrics.cacheHitRate}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Share Usage:</span>
                <span className="text-sm">{pwaMetrics.shareUsage} times</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Permissions</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notifications:</span>
                <Badge variant={
                  pwaMetrics.notificationPermission === 'granted' ? 'default' :
                  pwaMetrics.notificationPermission === 'denied' ? 'destructive' : 'secondary'
                }>
                  {pwaMetrics.notificationPermission}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Update Prompt:</span>
                <Badge variant={pwaMetrics.updatePromptShown ? "default" : "secondary"}>
                  {pwaMetrics.updatePromptShown ? 'Shown' : 'Not Shown'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Monitor Component
interface PerformanceMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateMetrics = () => {
      // Get current performance metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const currentMetrics: PerformanceMetrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          scrollDepth: 0,
          timeOnPage: Date.now() - navigation.navigationStart
        };

        // Add memory info if available
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          currentMetrics.memory = memory.usedJSHeapSize;
        }

        setMetrics(currentMetrics);
      }
    };

    updateMetrics();

    if (autoRefresh) {
      const interval = setInterval(updateMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading performance metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Real-time performance metrics and system status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Timer className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{Math.round(metrics.pageLoadTime)}ms</div>
            <div className="text-sm text-muted-foreground">Page Load</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <Activity className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{Math.round(metrics.domContentLoaded)}ms</div>
            <div className="text-sm text-muted-foreground">DOM Ready</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{Math.round(metrics.ttfb || 0)}ms</div>
            <div className="text-sm text-muted-foreground">TTFB</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            {isOnline ? (
              <Wifi className="h-6 w-6 mx-auto mb-2 text-green-500" />
            ) : (
              <WifiOff className="h-6 w-6 mx-auto mb-2 text-red-500" />
            )}
            <div className="text-lg font-bold">{isOnline ? 'Online' : 'Offline'}</div>
            <div className="text-sm text-muted-foreground">Connection</div>
          </div>
        </div>

        {metrics.memory && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Memory className="h-4 w-4" />
              <span className="font-medium">Memory Usage</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(metrics.memory / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-muted-foreground">JavaScript Heap</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Analytics Event Logger Component
export const AnalyticsEventLogger: React.FC<{ className?: string }> = ({ className }) => {
  const [events, setEvents] = useState<MobileAnalyticsEvent[]>([]);
  const [isLogging, setIsLogging] = useState(false);

  const startLogging = () => {
    setIsLogging(true);
    setEvents([]);
    
    // Capture events for demonstration
    const mockEvents: MobileAnalyticsEvent[] = [
      {
        eventName: 'page_view',
        eventType: 'navigation',
        timestamp: Date.now(),
        sessionId: 'demo-session',
        deviceInfo: {} as DeviceInfo,
        pageInfo: {} as any,
        properties: { page: '/dashboard' }
      }
    ];
    
    setEvents(mockEvents);
  };

  const stopLogging = () => {
    setIsLogging(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Event Logger
        </CardTitle>
        <CardDescription>
          Real-time analytics event monitoring
        </CardDescription>
        <div className="flex gap-2">
          <Button 
            onClick={startLogging} 
            disabled={isLogging}
            size="sm"
          >
            Start Logging
          </Button>
          <Button 
            onClick={stopLogging} 
            disabled={!isLogging}
            variant="outline"
            size="sm"
          >
            Stop Logging
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No events captured yet. Start logging to see analytics events.
            </div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{event.eventType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-medium">{event.eventName}</div>
                {Object.keys(event.properties).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {JSON.stringify(event.properties, null, 2)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 