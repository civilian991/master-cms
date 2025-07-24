'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Clock, 
  BookOpen,
  Target,
  Calendar,
  Award,
  Zap,
  Eye,
  Brain,
  Users,
  BarChart3,
  Activity,
  Flame,
  Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadingAnalyticsData {
  dailyGoals: {
    readingTime: { target: number; current: number }
    articlesRead: { target: number; current: number }
    streak: number
  }
  weeklyStats: {
    totalTime: number
    averageWPM: number
    articlesCompleted: number
    favoriteCategories: Array<{ name: string; count: number; percentage: number }>
    readingPattern: Array<{ hour: number; minutes: number }>
  }
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: React.ReactNode
    unlockedAt?: string
    progress?: number
    maxProgress?: number
  }>
  insights: Array<{
    type: 'improvement' | 'milestone' | 'trend' | 'recommendation'
    title: string
    description: string
    icon: React.ReactNode
    color: string
  }>
  comparisons: {
    readingSpeed: { user: number; average: number; percentile: number }
    completionRate: { user: number; average: number; percentile: number }
    engagement: { user: number; average: number; percentile: number }
  }
}

interface ReadingAnalyticsProps {
  userId?: string
  timeframe?: '7d' | '30d' | '90d' | 'all'
  className?: string
}

export function ReadingAnalytics({
  userId,
  timeframe = '7d',
  className
}: ReadingAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ReadingAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)

  useEffect(() => {
    loadAnalytics()
  }, [userId, selectedTimeframe])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockAnalytics: ReadingAnalyticsData = {
        dailyGoals: {
          readingTime: { target: 30, current: 23 },
          articlesRead: { target: 2, current: 1 },
          streak: 12
        },
        weeklyStats: {
          totalTime: 180, // minutes
          averageWPM: 245,
          articlesCompleted: 8,
          favoriteCategories: [
            { name: 'Technology', count: 12, percentage: 35 },
            { name: 'Business', count: 8, percentage: 24 },
            { name: 'Science', count: 6, percentage: 18 },
            { name: 'Culture', count: 4, percentage: 12 },
            { name: 'Politics', count: 4, percentage: 11 }
          ],
          readingPattern: [
            { hour: 8, minutes: 15 },
            { hour: 12, minutes: 25 },
            { hour: 18, minutes: 35 },
            { hour: 21, minutes: 45 }
          ]
        },
        achievements: [
          {
            id: 'speed-reader',
            name: 'Speed Reader',
            description: 'Read at 250+ WPM for 5 consecutive articles',
            icon: <Zap className="h-4 w-4" />,
            unlockedAt: '2024-01-10T14:30:00Z'
          },
          {
            id: 'streak-master',
            name: 'Streak Master',
            description: 'Maintain a 14-day reading streak',
            icon: <Flame className="h-4 w-4" />,
            progress: 12,
            maxProgress: 14
          },
          {
            id: 'diverse-reader',
            name: 'Diverse Reader',
            description: 'Read articles from 10 different categories',
            icon: <BookOpen className="h-4 w-4" />,
            progress: 7,
            maxProgress: 10
          },
          {
            id: 'engagement-expert',
            name: 'Engagement Expert',
            description: 'Comment on 25 articles',
            icon: <Users className="h-4 w-4" />,
            unlockedAt: '2024-01-05T09:15:00Z'
          }
        ],
        insights: [
          {
            type: 'improvement',
            title: 'Reading Speed Increased',
            description: 'Your reading speed improved by 15% this week!',
            icon: <TrendingUp className="h-4 w-4" />,
            color: 'text-green-600 bg-green-50'
          },
          {
            type: 'milestone',
            title: 'Goal Achievement',
            description: 'You\'re 2 days away from your longest streak!',
            icon: <Target className="h-4 w-4" />,
            color: 'text-blue-600 bg-blue-50'
          },
          {
            type: 'trend',
            title: 'Peak Reading Time',
            description: 'You read most effectively at 9 PM',
            icon: <Clock className="h-4 w-4" />,
            color: 'text-purple-600 bg-purple-50'
          },
          {
            type: 'recommendation',
            title: 'Explore New Topics',
            description: 'Try reading more Science articles to diversify',
            icon: <Brain className="h-4 w-4" />,
            color: 'text-orange-600 bg-orange-50'
          }
        ],
        comparisons: {
          readingSpeed: { user: 245, average: 200, percentile: 78 },
          completionRate: { user: 85, average: 65, percentile: 82 },
          engagement: { user: 92, average: 70, percentile: 89 }
        }
      }
      
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !analytics) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reading Analytics
          </CardTitle>
          <CardDescription>Loading your reading insights...</CardDescription>
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
            Reading Analytics
          </CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedTimeframe === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(period)}
                className="text-xs px-2"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Comprehensive insights into your reading habits and progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{analytics.weeklyStats.totalTime}m</div>
                <div className="text-sm text-muted-foreground">Reading Time</div>
                <div className="text-xs text-green-600 mt-1">+12% vs last week</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{analytics.weeklyStats.averageWPM}</div>
                <div className="text-sm text-muted-foreground">Words/Min</div>
                <div className="text-xs text-blue-600 mt-1">+15 WPM improvement</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{analytics.weeklyStats.articlesCompleted}</div>
                <div className="text-sm text-muted-foreground">Articles Read</div>
                <div className="text-xs text-purple-600 mt-1">85% completion rate</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{analytics.dailyGoals.streak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
                <div className="text-xs text-orange-600 mt-1">Personal best!</div>
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Performance vs Community</h4>
              {Object.entries(analytics.comparisons).map(([key, data]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">
                      {key === 'readingSpeed' ? `${data.user} WPM` : `${data.user}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(data.user / (key === 'readingSpeed' ? 300 : 100)) * 100} className="flex-1 h-2" />
                    <Badge variant="secondary" className="text-xs">
                      {data.percentile}th percentile
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Reading Categories */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Favorite Categories</h4>
              <div className="space-y-2">
                {analytics.weeklyStats.favoriteCategories.slice(0, 3).map((category) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <span>{category.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="font-medium w-8 text-right">{category.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="goals" className="space-y-6">
            <div className="space-y-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Daily Goals
              </h4>
              
              {/* Reading Time Goal */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reading Time</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.dailyGoals.readingTime.current}/{analytics.dailyGoals.readingTime.target} min
                  </span>
                </div>
                <Progress 
                  value={(analytics.dailyGoals.readingTime.current / analytics.dailyGoals.readingTime.target) * 100} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground">
                  {analytics.dailyGoals.readingTime.target - analytics.dailyGoals.readingTime.current} minutes remaining
                </div>
              </div>

              {/* Articles Goal */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Articles Read</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.dailyGoals.articlesRead.current}/{analytics.dailyGoals.articlesRead.target} articles
                  </span>
                </div>
                <Progress 
                  value={(analytics.dailyGoals.articlesRead.current / analytics.dailyGoals.articlesRead.target) * 100} 
                  className="h-3"
                />
              </div>

              {/* Streak */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Current Streak</span>
                  <Badge className="bg-orange-500">
                    <Flame className="h-3 w-3 mr-1" />
                    {analytics.dailyGoals.streak} days
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Keep reading daily to maintain your streak!
                </div>
              </div>

              {/* Goal Adjustment */}
              <div className="pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Adjust Goals
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements ({analytics.achievements.filter(a => a.unlockedAt).length}/{analytics.achievements.length})
              </h4>
              
              {analytics.achievements.map((achievement) => (
                <div key={achievement.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  achievement.unlockedAt 
                    ? "bg-green-50 border-green-200" 
                    : "bg-muted/30"
                )}>
                  <div className={cn(
                    "p-2 rounded-full",
                    achievement.unlockedAt 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {achievement.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                    
                    {achievement.progress !== undefined && (
                      <div className="mt-2">
                        <Progress 
                          value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                          className="h-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                      </div>
                    )}
                    
                    {achievement.unlockedAt && (
                      <div className="text-xs text-green-600 mt-1">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {achievement.unlockedAt && (
                    <Award className="h-5 w-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Personalized Insights
              </h4>
              
              {analytics.insights.map((insight, index) => (
                <div key={index} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  insight.color
                )}>
                  <div className="p-1 rounded">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-xs opacity-80 mt-1">{insight.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {insight.type}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}