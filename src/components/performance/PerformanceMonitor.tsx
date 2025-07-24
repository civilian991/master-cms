"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity,
  Zap, 
  Clock,
  TrendingDown,
  TrendingUp,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface PerformanceMonitorProps {
  className?: string
  siteId?: string
  interval?: number // refresh interval in ms
}

interface WebVitals {
  lcp: number // Largest Contentful Paint (seconds)
  fid: number // First Input Delay (ms)
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint (seconds)
  ttfb: number // Time to First Byte (ms)
  tbt: number // Total Blocking Time (ms)
}

interface ResourceTiming {
  name: string
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'other'
  duration: number
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  initiatorType: string
}

interface PerformanceData {
  webVitals: WebVitals
  resourceTimings: ResourceTiming[]
  pageLoadTime: number
  networkType?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  timestamp: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// API Functions
const performanceApi = {
  async getPerformanceMetrics(siteId: string, timeframe: string = '1h'): Promise<ApiResponse<PerformanceData>> {
    const response = await fetch(`/api/analytics/performance/${siteId}?timeframe=${timeframe}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch performance metrics')
    }
    
    return data
  },

  async getWebVitals(siteId: string, period: string = 'day'): Promise<ApiResponse<WebVitals[]>> {
    const response = await fetch(`/api/analytics/performance/${siteId}/web-vitals?period=${period}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch web vitals')
    }
    
    return data
  },

  async getResourceTimings(siteId: string, limit: number = 20): Promise<ApiResponse<ResourceTiming[]>> {
    const response = await fetch(`/api/analytics/performance/${siteId}/resources?limit=${limit}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch resource timings')
    }
    
    return data
  }
}

export function PerformanceMonitor({ 
  className,
  siteId = '1', // Default site ID - should come from context
  interval = 30000 // 30 seconds default
}: PerformanceMonitorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Performance data state
  const [webVitals, setWebVitals] = useState<WebVitals>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
    tbt: 0
  })
  const [resourceTimings, setResourceTimings] = useState<ResourceTiming[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  
  const { toast } = useToast()

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch performance metrics
      const [metricsResponse, webVitalsResponse, resourcesResponse] = await Promise.all([
        performanceApi.getPerformanceMetrics(siteId),
        performanceApi.getWebVitals(siteId),
        performanceApi.getResourceTimings(siteId)
      ])
      
      setPerformanceData(metricsResponse.data)
      setWebVitals(metricsResponse.data.webVitals)
      setResourceTimings(resourcesResponse.data)
      setLastUpdate(new Date())
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load performance data'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      
      // Set fallback data to prevent UI breaking
      setWebVitals({
        lcp: 2.5,
        fid: 100,
        cls: 0.1,
        fcp: 1.8,
        ttfb: 200,
        tbt: 300
      })
      setResourceTimings([])
      
    } finally {
      setIsLoading(false)
    }
  }, [siteId, toast])

  // Initial load
  useEffect(() => {
    loadPerformanceData()
  }, [loadPerformanceData])

  // Auto-refresh interval
  useEffect(() => {
    if (interval > 0) {
      const intervalId = setInterval(loadPerformanceData, interval)
      return () => clearInterval(intervalId)
    }
  }, [loadPerformanceData, interval])

  const handleRefresh = () => {
    loadPerformanceData()
  }

  // Helper functions
  const getScoreColor = (score: number, type: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb' | 'tbt') => {
    const thresholds = {
      lcp: { good: 2.5, poor: 4.0 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1.8, poor: 3.0 },
      ttfb: { good: 200, poor: 500 },
      tbt: { good: 200, poor: 600 }
    }
    
    const threshold = thresholds[type]
    if (score <= threshold.good) return 'text-green-600'
    if (score <= threshold.poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number, type: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb' | 'tbt') => {
    const thresholds = {
      lcp: { good: 2.5, poor: 4.0 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1.8, poor: 3.0 },
      ttfb: { good: 200, poor: 500 },
      tbt: { good: 200, poor: 600 }
    }
    
    const threshold = thresholds[type]
    if (score <= threshold.good) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score <= threshold.poor) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Performance score calculation
  const calculateOverallScore = () => {
    const scores = {
      lcp: webVitals.lcp <= 2.5 ? 100 : webVitals.lcp <= 4.0 ? 50 : 0,
      fid: webVitals.fid <= 100 ? 100 : webVitals.fid <= 300 ? 50 : 0,
      cls: webVitals.cls <= 0.1 ? 100 : webVitals.cls <= 0.25 ? 50 : 0,
    }
    return Math.round((scores.lcp + scores.fid + scores.cls) / 3)
  }

  const overallScore = calculateOverallScore()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Performance Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time website performance metrics and Core Web Vitals
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Score
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-6xl font-bold mb-2" style={{
              color: overallScore >= 80 ? '#22c55e' : overallScore >= 50 ? '#eab308' : '#ef4444'
            }}>
              {overallScore}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Based on Core Web Vitals
            </div>
            <Progress 
              value={overallScore} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LCP */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {getScoreIcon(webVitals.lcp, 'lcp')}
                <span className="text-sm font-medium">LCP</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(webVitals.lcp, 'lcp')}`}>
                {webVitals.lcp.toFixed(2)}s
              </div>
              <div className="text-xs text-muted-foreground">
                Largest Contentful Paint
              </div>
            </div>

            {/* FID */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {getScoreIcon(webVitals.fid, 'fid')}
                <span className="text-sm font-medium">FID</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(webVitals.fid, 'fid')}`}>
                {Math.round(webVitals.fid)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                First Input Delay
              </div>
            </div>

            {/* CLS */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {getScoreIcon(webVitals.cls, 'cls')}
                <span className="text-sm font-medium">CLS</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(webVitals.cls, 'cls')}`}>
                {webVitals.cls.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">
                Cumulative Layout Shift
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Additional Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FCP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First Contentful Paint</span>
                {getScoreIcon(webVitals.fcp, 'fcp')}
              </div>
              <div className={`text-xl font-bold ${getScoreColor(webVitals.fcp, 'fcp')}`}>
                {webVitals.fcp.toFixed(2)}s
              </div>
            </div>

            {/* TTFB */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time to First Byte</span>
                {getScoreIcon(webVitals.ttfb, 'ttfb')}
              </div>
              <div className={`text-xl font-bold ${getScoreColor(webVitals.ttfb, 'ttfb')}`}>
                {Math.round(webVitals.ttfb)}ms
              </div>
            </div>

            {/* TBT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Blocking Time</span>
                {getScoreIcon(webVitals.tbt, 'tbt')}
              </div>
              <div className={`text-xl font-bold ${getScoreColor(webVitals.tbt, 'tbt')}`}>
                {Math.round(webVitals.tbt)}ms
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Resource Loading Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resourceTimings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading resource data...
                </div>
              ) : (
                <div>No resource data available</div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {resourceTimings.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{resource.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {resource.type} • {formatFileSize(resource.transferSize)}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">{formatDuration(resource.duration)}</div>
                    <Badge 
                      variant={resource.duration > 1000 ? "destructive" : resource.duration > 500 ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {resource.duration > 1000 ? "Slow" : resource.duration > 500 ? "Medium" : "Fast"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}