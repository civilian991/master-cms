'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share,
  BookOpen,
  Target,
  Zap,
  Brain,
  Globe,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentAnalyticsProps {
  articleId: string
  views: number
  likes: number
  readingTime: number
  publishedAt: string
  className?: string
}

interface AnalyticsData {
  engagement: {
    overall: number
    readCompletion: number
    socialShares: number
    averageTimeOnPage: number
    bounceRate: number
  }
  demographics: {
    topCountries: Array<{ country: string; percentage: number }>
    ageGroups: Array<{ range: string; percentage: number }>
    deviceTypes: Array<{ type: string; percentage: number }>
  }
  performance: {
    readabilityScore: number
    seoScore: number
    accessibilityScore: number
    performanceScore: number
  }
  trends: {
    viewsGrowth: number
    engagementTrend: 'up' | 'down' | 'stable'
    peakReadingTimes: string[]
    topReferrers: Array<{ source: string; percentage: number }>
  }
}

export function ContentAnalytics({
  articleId,
  views,
  likes,
  readingTime,
  publishedAt,
  className
}: ContentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [articleId, timeframe])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      // Mock analytics data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockAnalytics: AnalyticsData = {
        engagement: {
          overall: 78,
          readCompletion: 65,
          socialShares: 23,
          averageTimeOnPage: 420, // seconds
          bounceRate: 32
        },
        demographics: {
          topCountries: [
            { country: 'United States', percentage: 35 },
            { country: 'United Kingdom', percentage: 18 },
            { country: 'Canada', percentage: 12 },
            { country: 'Australia', percentage: 8 },
            { country: 'Germany', percentage: 7 }
          ],
          ageGroups: [
            { range: '25-34', percentage: 32 },
            { range: '35-44', percentage: 28 },
            { range: '18-24', percentage: 20 },
            { range: '45-54', percentage: 15 },
            { range: '55+', percentage: 5 }
          ],
          deviceTypes: [
            { type: 'Desktop', percentage: 52 },
            { type: 'Mobile', percentage: 38 },
            { type: 'Tablet', percentage: 10 }
          ]
        },
        performance: {
          readabilityScore: 82,
          seoScore: 91,
          accessibilityScore: 88,
          performanceScore: 76
        },
        trends: {
          viewsGrowth: 15.3,
          engagementTrend: 'up',
          peakReadingTimes: ['9:00 AM', '1:00 PM', '8:00 PM'],
          topReferrers: [
            { source: 'Google Search', percentage: 45 },
            { source: 'Social Media', percentage: 23 },
            { source: 'Direct', percentage: 18 },
            { source: 'Email', percentage: 10 },
            { source: 'Other', percentage: 4 }
          ]
        }
      }
      
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default: return <TrendingUp className="h-4 w-4 text-blue-600 rotate-90" />
    }
  }

  if (isLoading || !analytics) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Analytics
          </CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Analytics
          </CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(period)}
                className="text-xs px-2"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Comprehensive content performance insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Total Views</span>
            </div>
            <div className="text-2xl font-bold">{views.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(analytics.trends.engagementTrend)}
              <span className="text-green-600">+{analytics.trends.viewsGrowth}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>Engagement</span>
            </div>
            <div className="text-2xl font-bold">{analytics.engagement.overall}%</div>
            <div className="text-xs text-muted-foreground">
              {analytics.engagement.readCompletion}% completion rate
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Engagement Breakdown
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Read Completion</span>
              <span className="font-medium">{analytics.engagement.readCompletion}%</span>
            </div>
            <Progress value={analytics.engagement.readCompletion} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Social Shares</span>
              <span className="font-medium">{analytics.engagement.socialShares}</span>
            </div>
            <Progress value={analytics.engagement.socialShares} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg. Time on Page</span>
              <span className="font-medium">{Math.floor(analytics.engagement.averageTimeOnPage / 60)}m {analytics.engagement.averageTimeOnPage % 60}s</span>
            </div>
          </div>
        </div>

        {/* Performance Scores */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance Scores
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className={cn("text-lg font-bold", getScoreColor(analytics.performance.readabilityScore))}>
                {analytics.performance.readabilityScore}
              </div>
              <div className="text-xs text-muted-foreground">Readability</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className={cn("text-lg font-bold", getScoreColor(analytics.performance.seoScore))}>
                {analytics.performance.seoScore}
              </div>
              <div className="text-xs text-muted-foreground">SEO</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className={cn("text-lg font-bold", getScoreColor(analytics.performance.accessibilityScore))}>
                {analytics.performance.accessibilityScore}
              </div>
              <div className="text-xs text-muted-foreground">Accessibility</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className={cn("text-lg font-bold", getScoreColor(analytics.performance.performanceScore))}>
                {analytics.performance.performanceScore}
              </div>
              <div className="text-xs text-muted-foreground">Performance</div>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Top Audiences
          </h4>
          
          <div className="space-y-2">
            {analytics.demographics.topCountries.slice(0, 3).map((country) => (
              <div key={country.country} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{country.country}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                  <span className="font-medium w-8">{country.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Reading Times */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Peak Reading Times
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {analytics.trends.peakReadingTimes.map((time) => (
              <Badge key={time} variant="secondary" className="text-xs">
                {time}
              </Badge>
            ))}
          </div>
        </div>

        {/* Refresh Analytics */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            Refresh Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}