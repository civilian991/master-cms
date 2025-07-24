"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database,
  Trash2,
  RefreshCw,
  BarChart3,
  Clock,
  HardDrive,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface CacheEntry {
  key: string
  type: 'page' | 'api' | 'asset' | 'database'
  size: number // in bytes
  hits: number
  misses: number
  lastAccess: string
  expiresAt: string
  region?: string
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  totalHits: number
  totalMisses: number
  hitRate: number
  memoryUsage: number
  maxMemory: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

interface CacheManagerProps {
  className?: string
  siteId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

// API Functions
const cacheApi = {
  async getCacheStats(siteId: string): Promise<ApiResponse<CacheStats>> {
    const response = await fetch(`/api/infrastructure/cache/${siteId}/stats`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cache statistics')
    }
    
    return data
  },

  async getCacheEntries(siteId: string, limit: number = 100): Promise<ApiResponse<CacheEntry[]>> {
    const response = await fetch(`/api/infrastructure/cache/${siteId}/entries?limit=${limit}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cache entries')
    }
    
    return data
  },

  async clearCache(siteId: string, type?: string): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/infrastructure/cache/${siteId}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear cache')
    }
    
    return data
  },

  async deleteCacheEntry(siteId: string, key: string): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/infrastructure/cache/${siteId}/entries/${encodeURIComponent(key)}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete cache entry')
    }
    
    return data
  },

  async preloadCache(siteId: string, urls: string[]): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/infrastructure/cache/${siteId}/preload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to preload cache')
    }
    
    return data
  }
}

export function CacheManager({ 
  className,
  siteId = '1', // Default site ID - should come from context
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}: CacheManagerProps) {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([])
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  
  const { toast } = useToast()

  // Load cache data
  const loadCacheData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch cache statistics and entries in parallel
      const [statsResponse, entriesResponse] = await Promise.all([
        cacheApi.getCacheStats(siteId),
        cacheApi.getCacheEntries(siteId, 100)
      ])
      
      setCacheStats(statsResponse.data)
      setCacheEntries(entriesResponse.data)
      setLastUpdate(new Date())
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cache data'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      
      // Set fallback data to prevent UI breaking
      setCacheStats({
        totalEntries: 0,
        totalSize: 0,
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
        memoryUsage: 0,
        maxMemory: 1024 * 1024 * 1024 // 1GB default
      })
      setCacheEntries([])
      
    } finally {
      setIsLoading(false)
    }
  }, [siteId, toast])

  // Initial load
  useEffect(() => {
    loadCacheData()
  }, [loadCacheData])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(loadCacheData, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [loadCacheData, autoRefresh, refreshInterval])

  const handleRefresh = () => {
    loadCacheData()
  }

  const handleClearCache = async (type?: string) => {
    try {
      await cacheApi.clearCache(siteId, type)
      toast({
        title: "Success",
        description: `Cache ${type ? `(${type})` : ''} cleared successfully`
      })
      loadCacheData() // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cache'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleDeleteEntry = async (key: string) => {
    try {
      await cacheApi.deleteCacheEntry(siteId, key)
      toast({
        title: "Success",
        description: "Cache entry deleted successfully"
      })
      loadCacheData() // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete cache entry'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Helper functions
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'page': return 'bg-blue-100 text-blue-800'
      case 'api': return 'bg-green-100 text-green-800'
      case 'asset': return 'bg-purple-100 text-purple-800'
      case 'database': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEntries = selectedType === 'all' 
    ? cacheEntries 
    : cacheEntries.filter(entry => entry.type === selectedType)

  const typeStats = cacheEntries.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Cache Manager
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage application cache performance
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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleClearCache()}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
            Clear All
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

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{cacheStats.totalEntries.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{formatBytes(cacheStats.totalSize)}</div>
                  <div className="text-sm text-muted-foreground">Cache Size</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(cacheStats.hitRate * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Hit Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{cacheStats.totalHits.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Cache Hits</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Memory Usage */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Memory Used</span>
                <span>{formatBytes(cacheStats.memoryUsage)} / {formatBytes(cacheStats.maxMemory)}</span>
              </div>
              <Progress 
                value={(cacheStats.memoryUsage / cacheStats.maxMemory) * 100} 
                className="h-3"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cache Hits:</span> {cacheStats.totalHits.toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Cache Misses:</span> {cacheStats.totalMisses.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Type Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cache Entries
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Type Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All ({cacheEntries.length})
            </Button>
            {Object.entries(typeStats).map(([type, count]) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type} ({count})
              </Button>
            ))}
          </div>

          {/* Cache Entries List */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading cache entries...
                </div>
              ) : (
                <div>No cache entries found</div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{entry.key}</span>
                      <Badge className={getTypeColor(entry.type)}>
                        {entry.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span>Size: {formatBytes(entry.size)}</span>
                      <span>Hits: {entry.hits}</span>
                      <span>Misses: {entry.misses}</span>
                      <span>Last access: {new Date(entry.lastAccess).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {entry.hits > 0 ? Math.round((entry.hits / (entry.hits + entry.misses)) * 100) : 0}%
                      </div>
                      <div className="text-muted-foreground">Hit Rate</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clear by Type Buttons */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {Object.keys(typeStats).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearCache(type)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}