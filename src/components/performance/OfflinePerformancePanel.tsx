'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Database,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive,
  Gauge,
  TrendingUp,
  Settings,
  CloudOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OfflineManager } from '../offline/OfflineManager'
import { CacheManager } from './CacheManager'
import { PerformanceMonitor } from './PerformanceMonitor'

interface SystemHealth {
  cpu: number
  memory: number
  storage: number
  network: number
  cache: number
  overall: number
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

interface OfflinePerformancePanelProps {
  className?: string
}

export function OfflinePerformancePanel({ className }: OfflinePerformancePanelProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 23,
    memory: 67,
    storage: 45,
    network: 89,
    cache: 78,
    overall: 70
  })
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Cache size approaching limit',
      description: 'Application cache is at 85% capacity. Consider clearing expired entries.',
      timestamp: '2024-01-16T14:30:00Z',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Offline content synchronized',
      description: '12 articles have been successfully cached for offline reading.',
      timestamp: '2024-01-16T13:15:00Z',
      resolved: true
    }
  ])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Monitor network status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Update system metrics periodically
    const interval = setInterval(updateSystemMetrics, 5000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const updateSystemMetrics = () => {
    setSystemHealth(prev => ({
      cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
      storage: Math.max(20, Math.min(95, prev.storage + (Math.random() - 0.5) * 5)),
      network: isOnline ? Math.max(70, Math.min(100, prev.network + (Math.random() - 0.5) * 15)) : 0,
      cache: Math.max(40, Math.min(95, prev.cache + (Math.random() - 0.5) * 6)),
      overall: 0 // Will be calculated below
    }))
    
    // Calculate overall health
    setSystemHealth(prev => ({
      ...prev,
      overall: Math.round((prev.cpu + prev.memory + prev.storage + prev.network + prev.cache) / 5)
    }))
  }

  const getHealthStatus = (value: number): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (value >= 90) return 'excellent'
    if (value >= 75) return 'good' 
    if (value >= 50) return 'warning'
    return 'critical'
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50'
      case 'good': return 'text-blue-600 bg-blue-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabItems = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: <Activity className="h-4 w-4" />,
      badge: systemHealth.overall >= 75 ? 'Healthy' : 'Issues'
    },
    {
      id: 'offline',
      label: 'Offline Manager',
      icon: <CloudOff className="h-4 w-4" />,
      badge: isOnline ? 'Online' : 'Offline'
    },
    {
      id: 'cache',
      label: 'Cache Manager',
      icon: <Database className="h-4 w-4" />,
      badge: `${systemHealth.cache}%`
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Gauge className="h-4 w-4" />,
      badge: 'Live'
    }
  ]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Offline & Performance Center
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              {isOnline ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(
                "font-medium",
                isOnline ? "text-green-600" : "text-red-600"
              )}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            <Badge className={cn(
              "text-xs",
              systemHealth.overall >= 90 ? "bg-green-500" :
              systemHealth.overall >= 75 ? "bg-blue-500" :
              systemHealth.overall >= 50 ? "bg-yellow-500" : "bg-red-500"
            )}>
              {systemHealth.overall}% Health
            </Badge>
          </div>
        </div>
        <CardDescription>
          Comprehensive offline capabilities and performance optimization tools
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex flex-col gap-1 h-auto py-3 px-2"
              >
                <div className="flex items-center gap-1">
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {item.badge}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* System Health Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">CPU Usage</div>
                  <div className={cn(
                    "text-lg font-bold",
                    systemHealth.cpu < 50 ? "text-green-600" :
                    systemHealth.cpu < 80 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(systemHealth.cpu)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHealthStatus(100 - systemHealth.cpu)}
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Memory</div>
                  <div className={cn(
                    "text-lg font-bold",
                    systemHealth.memory < 70 ? "text-green-600" :
                    systemHealth.memory < 85 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(systemHealth.memory)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHealthStatus(100 - systemHealth.memory)}
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Storage</div>
                  <div className={cn(
                    "text-lg font-bold",
                    systemHealth.storage < 75 ? "text-green-600" :
                    systemHealth.storage < 90 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(systemHealth.storage)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHealthStatus(100 - systemHealth.storage)}
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Network</div>
                  <div className={cn(
                    "text-lg font-bold",
                    systemHealth.network >= 80 ? "text-green-600" :
                    systemHealth.network >= 50 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(systemHealth.network)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {systemHealth.network === 0 ? 'offline' : getHealthStatus(systemHealth.network)}
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Cache</div>
                  <div className={cn(
                    "text-lg font-bold",
                    systemHealth.cache >= 70 ? "text-green-600" :
                    systemHealth.cache >= 50 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(systemHealth.cache)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHealthStatus(systemHealth.cache)}
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Overall</div>
                  <div className={cn(
                    "text-lg font-bold",
                    systemHealth.overall >= 80 ? "text-green-600" :
                    systemHealth.overall >= 60 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(systemHealth.overall)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getHealthStatus(systemHealth.overall)}
                  </div>
                </div>
              </Card>
            </div>

            {/* Alerts and Notifications */}
            {alerts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  System Alerts
                </h4>
                
                {alerts.map((alert) => (
                  <Card key={alert.id} className={cn(
                    "border-l-4",
                    alert.type === 'error' && "border-l-red-500",
                    alert.type === 'warning' && "border-l-yellow-500",
                    alert.type === 'info' && "border-l-blue-500",
                    alert.resolved && "opacity-60"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{alert.title}</span>
                            {alert.resolved && (
                              <Badge className="text-xs bg-green-500">
                                <CheckCircle className="h-2 w-2 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!alert.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <HardDrive className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium mb-1">Storage Optimization</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Free up space and improve performance
                  </p>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Optimize
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium mb-1">Cache Cleanup</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Clear expired cache entries
                  </p>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Clean
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium mb-1">Performance Boost</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Run automatic optimizations
                  </p>
                  <Button size="sm" variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    Boost
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="offline">
            <OfflineManager />
          </TabsContent>
          
          <TabsContent value="cache">
            <CacheManager />
          </TabsContent>
          
          <TabsContent value="performance">
            <PerformanceMonitor autoRefresh={true} refreshInterval={15000} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}