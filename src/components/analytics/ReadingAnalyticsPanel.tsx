"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Target, 
  Clock,
  Activity,
  Trophy,
  List,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ReadingAnalyticsPanelProps {
  className?: string
  userId?: string
  siteId?: string
  isMinimized?: boolean
  onToggleMinimized?: () => void
}

interface AnalyticsData {
  totalReadingTime: number // minutes this week
  articlesCompleted: number
  currentStreak: number
  averageWPM: number
  weeklyGoal: number // minutes
  weeklyProgress: number
  activeGoals: number
  completedGoals: number
  readingLists: number
  bookmarkedArticles: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// API Functions
const analyticsApi = {
  async getUserAnalytics(userId: string, timeframe: string = '7d'): Promise<ApiResponse<AnalyticsData>> {
    const response = await fetch(`/api/analytics/users/${userId}?timeframe=${timeframe}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user analytics')
    }
    
    return data
  },

  async getReadingStats(userId: string, period: string = 'week'): Promise<ApiResponse<any>> {
    const response = await fetch(`/api/analytics/users/${userId}/reading?period=${period}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch reading stats')
    }
    
    return data
  }
}

export function ReadingAnalyticsPanel({ 
  className, 
  userId = '1', // Default user ID - should come from session
  siteId = '1', // Default site ID - should come from context
  isMinimized = false, 
  onToggleMinimized 
}: ReadingAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [summaryStats, setSummaryStats] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await analyticsApi.getUserAnalytics(userId, '7d')
      setSummaryStats(response.data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      
      // Set fallback data to prevent UI breaking
      setSummaryStats({
        totalReadingTime: 0,
        articlesCompleted: 0,
        currentStreak: 0,
        averageWPM: 0,
        weeklyGoal: 300,
        weeklyProgress: 0,
        activeGoals: 0,
        completedGoals: 0,
        readingLists: 0,
        bookmarkedArticles: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [userId])

  const handleRefresh = () => {
    loadAnalytics()
  }

  const setIsMinimized = (minimized: boolean) => {
    if (onToggleMinimized) {
      onToggleMinimized()
    }
  }

  // Tab items configuration
  const tabItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'General reading statistics and progress',
      badge: summaryStats ? `${summaryStats.totalReadingTime}m` : '0m'
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Reading speed and improvement tracking',
      badge: summaryStats ? `${summaryStats.currentStreak} days` : '0 days'
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity className="h-4 w-4" />,
      description: 'Recent reading activity and sessions',
      badge: summaryStats ? `${summaryStats.articlesCompleted}` : '0'
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Target className="h-4 w-4" />,
      description: 'Personal reading objectives and achievements',
      badge: summaryStats ? `${summaryStats.activeGoals} Active` : '0 Active'
    },
    {
      id: 'lists',
      label: 'Lists',
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Curated reading lists and collections',
      badge: summaryStats ? `${summaryStats.readingLists} Lists` : '0 Lists'
    }
  ]

  if (isMinimized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              Reading Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-destructive mb-3">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load analytics</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          )}
          
          {summaryStats && !error && (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{summaryStats.totalReadingTime}m</div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{summaryStats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{summaryStats.articlesCompleted}</div>
                  <div className="text-xs text-muted-foreground">Articles</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{summaryStats.averageWPM}</div>
                  <div className="text-xs text-muted-foreground">WPM</div>
                </div>
              </div>
              
              {/* Weekly Progress */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Weekly Goal</span>
                  <span>{summaryStats.weeklyProgress}/{summaryStats.weeklyGoal}m</span>
                </div>
                <Progress 
                  value={(summaryStats.weeklyProgress / summaryStats.weeklyGoal) * 100} 
                  className="h-2" 
                />
              </div>
            </>
          )}
          
          {/* Tab Buttons */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-2">
              {tabItems.slice(0, 3).map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center gap-1"
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reading Analytics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track your reading progress and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-destructive mb-4 p-3 border border-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {summaryStats && !error && (
          <>
            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">{summaryStats.totalReadingTime}m</div>
                <div className="text-sm text-muted-foreground">This Week</div>
                <Progress 
                  value={(summaryStats.weeklyProgress / summaryStats.weeklyGoal) * 100} 
                  className="h-2" 
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold flex items-center justify-center gap-2">
                  {summaryStats.currentStreak}
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">{summaryStats.articlesCompleted}</div>
                <div className="text-sm text-muted-foreground">Articles Read</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">{summaryStats.averageWPM}</div>
                <div className="text-sm text-muted-foreground">Words/Min</div>
              </div>
            </div>
          </>
        )}

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            {tabItems.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {item.badge}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          {tabItems.map((item) => (
            <TabsContent key={item.id} value={item.id} className="mt-4">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.label}</h3>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                <div className="text-2xl font-bold text-primary">{item.badge}</div>
                {loading && (
                  <div className="mt-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading {item.label.toLowerCase()}...</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}