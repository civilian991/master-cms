'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  HardDrive,
  RefreshCw,
  Trash2,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  FileText,
  Image,
  Volume2,
  Globe,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

interface OfflineContent {
  id: string
  title: string
  type: 'article' | 'image' | 'audio' | 'video'
  size: number // bytes
  downloadedAt: string
  lastAccessed: string
  status: 'downloading' | 'available' | 'syncing' | 'error'
  progress?: number
  url: string
  category: string
  expiresAt?: string
}

interface OfflineSettings {
  autoDownload: boolean
  wifiOnly: boolean
  maxStorage: number // MB
  autoCleanup: boolean
  cleanupAfterDays: number
  prefetchRecommendations: boolean
  compressImages: boolean
  downloadAudio: boolean
}

interface NetworkStatus {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown'
  downlink: number
  saveData: boolean
}

interface OfflineManagerProps {
  className?: string
}

export function OfflineManager({ className }: OfflineManagerProps) {
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([])
  const [settings, setSettings] = useState<OfflineSettings>({
    autoDownload: false,
    wifiOnly: true,
    maxStorage: 500,
    autoCleanup: true,
    cleanupAfterDays: 30,
    prefetchRecommendations: true,
    compressImages: true,
    downloadAudio: false
  })
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    saveData: false
  })
  const [storageUsed, setStorageUsed] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadOfflineContent()
    detectNetworkStatus()
    
    // Set up network status listeners
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, isOnline: false }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineContent = async () => {
    setIsLoading(true)
    
    try {
      // Mock API call to load offline content
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockContent: OfflineContent[] = [
        {
          id: '1',
          title: 'Advanced Machine Learning Techniques',
          type: 'article',
          size: 2.5 * 1024 * 1024, // 2.5MB
          downloadedAt: '2024-01-15T10:30:00Z',
          lastAccessed: '2024-01-16T09:15:00Z',
          status: 'available',
          url: '/articles/ml-techniques',
          category: 'AI/ML',
          expiresAt: '2024-02-15T10:30:00Z'
        },
        {
          id: '2',
          title: 'Cybersecurity Best Practices',
          type: 'article',
          size: 1.8 * 1024 * 1024, // 1.8MB
          downloadedAt: '2024-01-14T16:20:00Z',
          lastAccessed: '2024-01-15T14:30:00Z',
          status: 'available',
          url: '/articles/cybersecurity-practices',
          category: 'Security'
        },
        {
          id: '3',
          title: 'Cloud Architecture Diagram',
          type: 'image',
          size: 0.5 * 1024 * 1024, // 500KB
          downloadedAt: '2024-01-13T12:00:00Z',
          lastAccessed: '2024-01-16T11:00:00Z',
          status: 'available',
          url: '/images/cloud-architecture.png',
          category: 'Cloud'
        },
        {
          id: '4',
          title: 'Blockchain Explained - Audio',
          type: 'audio',
          size: 15 * 1024 * 1024, // 15MB
          downloadedAt: '2024-01-12T14:45:00Z',
          lastAccessed: '2024-01-13T08:20:00Z',
          status: 'available',
          url: '/audio/blockchain-explained.mp3',
          category: 'Blockchain'
        },
        {
          id: '5',
          title: 'React Performance Optimization',
          type: 'article',
          size: 3.2 * 1024 * 1024, // 3.2MB
          downloadedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          status: 'downloading',
          progress: 67,
          url: '/articles/react-performance',
          category: 'Web Development'
        }
      ]
      
      setOfflineContent(mockContent)
      
      // Calculate storage used
      const totalSize = mockContent
        .filter(item => item.status === 'available')
        .reduce((sum, item) => sum + item.size, 0)
      setStorageUsed(Math.round(totalSize / (1024 * 1024))) // Convert to MB
      
    } catch (error) {
      console.error('Error loading offline content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const detectNetworkStatus = () => {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection
      setNetworkStatus(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        saveData: connection.saveData || false
      }))
    }
  }

  const downloadContent = async (contentId: string) => {
    const content = offlineContent.find(c => c.id === contentId)
    if (!content) return

    // Update status to downloading
    setOfflineContent(prev => prev.map(item => 
      item.id === contentId 
        ? { ...item, status: 'downloading', progress: 0 }
        : item
    ))

    // Simulate download progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        clearInterval(interval)
        setOfflineContent(prev => prev.map(item => 
          item.id === contentId 
            ? { 
                ...item, 
                status: 'available', 
                progress: undefined,
                downloadedAt: new Date().toISOString()
              }
            : item
        ))
        // Update storage used
        setStorageUsed(prev => prev + Math.round(content.size / (1024 * 1024)))
      } else {
        setOfflineContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, progress }
            : item
        ))
      }
    }, 200)
  }

  const removeContent = (contentId: string) => {
    const content = offlineContent.find(c => c.id === contentId)
    if (content && content.status === 'available') {
      setStorageUsed(prev => prev - Math.round(content.size / (1024 * 1024)))
    }
    
    setOfflineContent(prev => prev.filter(item => item.id !== contentId))
  }

  const clearAllContent = () => {
    setOfflineContent([])
    setStorageUsed(0)
  }

  const getTypeIcon = (type: OfflineContent['type']) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />
      case 'image': return <Image className="h-4 w-4" />
      case 'audio': return <Volume2 className="h-4 w-4" />
      case 'video': return <BookOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: OfflineContent['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'downloading': return <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
      case 'syncing': return <Cloud className="h-3 w-3 text-orange-500" />
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)}KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConnectionIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff className="h-4 w-4 text-red-500" />
    
    switch (networkStatus.connectionType) {
      case 'wifi': return <Wifi className="h-4 w-4 text-green-500" />
      case 'cellular': return <Smartphone className="h-4 w-4 text-blue-500" />
      default: return <Globe className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Offline Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              {getConnectionIcon()}
              <span className={cn(
                "font-medium",
                networkStatus.isOnline ? "text-green-600" : "text-red-600"
              )}>
                {networkStatus.isOnline 
                  ? `${networkStatus.effectiveType?.toUpperCase()} ${networkStatus.connectionType}`
                  : 'Offline'
                }
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Smart Caching
            </Badge>
          </div>
        </div>
        <CardDescription>
          Download content for offline access and manage storage efficiently
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">{storageUsed}MB</div>
                <div className="text-xs text-muted-foreground">Used</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">{settings.maxStorage}MB</div>
                <div className="text-xs text-muted-foreground">Limit</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm font-medium">{offlineContent.filter(c => c.status === 'available').length}</div>
                <div className="text-xs text-muted-foreground">Downloaded</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              {networkStatus.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium">
                  {networkStatus.isOnline ? 'Online' : 'Offline'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Storage Usage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Storage Usage</span>
            <span>{storageUsed}MB / {settings.maxStorage}MB</span>
          </div>
          <Progress 
            value={(storageUsed / settings.maxStorage) * 100} 
            className={cn(
              "h-2",
              storageUsed / settings.maxStorage > 0.9 && "bg-red-200"
            )}
          />
          {storageUsed / settings.maxStorage > 0.8 && (
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Storage is getting full. Consider cleaning up old content.
            </div>
          )}
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Offline Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Downloaded Content</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOfflineContent}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllContent}
                  disabled={offlineContent.length === 0}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
            
            {offlineContent.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CloudOff className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Offline Content</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Download articles and media for offline access
                  </p>
                  <Button onClick={() => {}}>
                    <Download className="h-4 w-4 mr-2" />
                    Browse Content
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {offlineContent.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            {getStatusIcon(item.status)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm line-clamp-1">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{item.category}</span>
                              <span>{formatSize(item.size)}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(item.downloadedAt)}
                              </span>
                            </div>
                            
                            {item.status === 'downloading' && item.progress !== undefined && (
                              <div className="mt-2">
                                <Progress value={item.progress} className="h-1" />
                                <div className="text-xs text-muted-foreground mt-1">
                                  Downloading... {Math.round(item.progress)}%
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.status === 'available' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {/* Open content */}}
                              >
                                <BookOpen className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeContent(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          
                          {item.status === 'downloading' && (
                            <Button variant="ghost" size="sm" disabled>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            {/* Download Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Download Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto-download recommended content</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically download articles based on your interests
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoDownload}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoDownload: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Download only on WiFi</div>
                    <div className="text-xs text-muted-foreground">
                      Prevent downloads on cellular connection
                    </div>
                  </div>
                  <Switch
                    checked={settings.wifiOnly}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, wifiOnly: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Prefetch recommendations</div>
                    <div className="text-xs text-muted-foreground">
                      Pre-download content you might want to read
                    </div>
                  </div>
                  <Switch
                    checked={settings.prefetchRecommendations}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, prefetchRecommendations: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Download audio content</div>
                    <div className="text-xs text-muted-foreground">
                      Include audio files in offline downloads
                    </div>
                  </div>
                  <Switch
                    checked={settings.downloadAudio}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, downloadAudio: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Compress images</div>
                    <div className="text-xs text-muted-foreground">
                      Reduce image quality to save storage space
                    </div>
                  </div>
                  <Switch
                    checked={settings.compressImages}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compressImages: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Storage Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Storage Management</h4>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Storage Limit: {settings.maxStorage}MB
                    </span>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Adjust
                    </Button>
                  </div>
                  <Slider
                    value={[settings.maxStorage]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, maxStorage: value[0] }))}
                    max={2000}
                    min={100}
                    step={50}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto-cleanup old content</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically remove content after specified days
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoCleanup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoCleanup: checked }))}
                  />
                </div>

                {settings.autoCleanup && (
                  <div className="space-y-3">
                    <span className="text-sm font-medium">
                      Cleanup after: {settings.cleanupAfterDays} days
                    </span>
                    <Slider
                      value={[settings.cleanupAfterDays]}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, cleanupAfterDays: value[0] }))}
                      max={90}
                      min={7}
                      step={7}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}