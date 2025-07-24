'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Target,
  Filter,
  Settings,
  TrendingUp,
  Zap,
  RefreshCw,
  User,
  BookOpen,
  Star,
  ChevronRight,
  BarChart3,
  Clock,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentFilter } from './ContentFilter'
import { RecommendationEngine } from './RecommendationEngine'
import { UserPreferences } from './UserPreferences'

interface PersonalizationStats {
  recommendationAccuracy: number
  engagementIncrease: number
  timeSpent: number
  articlesRead: number
  preferenceMatches: number
  totalInteractions: number
}

interface PersonalizationPanelProps {
  userId?: string
  currentArticleId?: string
  className?: string
}

export function PersonalizationPanel({
  userId = 'current-user',
  currentArticleId,
  className
}: PersonalizationPanelProps) {
  const [activeTab, setActiveTab] = useState('recommendations')
  const [stats, setStats] = useState<PersonalizationStats>({
    recommendationAccuracy: 94,
    engagementIncrease: 67,
    timeSpent: 142, // minutes this week
    articlesRead: 23,
    preferenceMatches: 89,
    totalInteractions: 156
  })
  const [isLoading, setIsLoading] = useState(false)
  const [filterCount, setFilterCount] = useState(3)

  useEffect(() => {
    loadPersonalizationData()
  }, [userId])

  const loadPersonalizationData = async () => {
    setIsLoading(true)
    
    try {
      // Mock API call to load personalization data
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Update stats with fresh data
      setStats(prev => ({
        ...prev,
        recommendationAccuracy: Math.min(97, prev.recommendationAccuracy + Math.random() * 3),
        engagementIncrease: Math.min(85, prev.engagementIncrease + Math.random() * 5),
        timeSpent: prev.timeSpent + Math.floor(Math.random() * 20),
        articlesRead: prev.articlesRead + Math.floor(Math.random() * 3),
        preferenceMatches: Math.min(95, prev.preferenceMatches + Math.random() * 4),
        totalInteractions: prev.totalInteractions + Math.floor(Math.random() * 10)
      }))
    } catch (error) {
      console.error('Error loading personalization data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFiltersChange = (filters: any) => {
    // Count active filters
    const activeFilters = [
      ...filters.categories,
      ...filters.tags,
      ...filters.authors,
      ...filters.languages,
      ...(filters.dateRange.preset !== 'all' ? [1] : []),
      ...(filters.difficulty !== 'all' ? [1] : []),
      ...(filters.readingTime[0] !== 1 || filters.readingTime[1] !== 60 ? [1] : []),
      ...(filters.minRating > 1 ? [1] : [])
    ]
    
    setFilterCount(activeFilters.length)
  }

  const tabItems = [
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Brain className="h-4 w-4" />,
      description: 'AI-powered content suggestions',
      badge: 'Smart',
      content: (
        <RecommendationEngine 
          userId={userId}
          currentArticleId={currentArticleId}
          maxRecommendations={8}
          showReasonings={true}
        />
      )
    },
    {
      id: 'filters',
      label: 'Content Filters',
      icon: <Filter className="h-4 w-4" />,
      description: 'Customize your content discovery',
      badge: `${filterCount} active`,
      content: (
        <ContentFilter 
          onFiltersChange={handleFiltersChange}
          activeFiltersCount={filterCount}
          totalArticles={1250}
          filteredCount={89}
        />
      )
    },
    {
      id: 'preferences',
      label: 'User Preferences',
      icon: <Settings className="h-4 w-4" />,
      description: 'Personal settings and privacy',
      badge: 'Settings',
      content: (
        <UserPreferences 
          userId={userId}
          onSettingsChange={(settings) => console.log('Settings updated:', settings)}
        />
      )
    }
  ]

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personalization Center
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPersonalizationData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Intelligent content discovery tailored to your interests and preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Personalization Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {stats.recommendationAccuracy}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                +{stats.engagementIncrease}%
              </div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatTime(stats.timeSpent)}
              </div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {stats.articlesRead}
              </div>
              <div className="text-xs text-muted-foreground">Articles Read</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-teal-600">
                {stats.preferenceMatches}%
              </div>
              <div className="text-xs text-muted-foreground">Matches</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-pink-600">
                {stats.totalInteractions}
              </div>
              <div className="text-xs text-muted-foreground">Interactions</div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
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
          
          {tabItems.map((item) => (
            <TabsContent key={item.id} value={item.id} className="mt-0">
              {item.content}
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Insights */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Personalization Insights
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Reading Patterns</div>
                    <div className="text-xs text-muted-foreground">
                      Peak activity: 8-10 AM, 7-9 PM
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Favorite Topics</div>
                    <div className="text-xs text-muted-foreground">
                      AI/ML (34%), Security (28%), Cloud (21%)
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Personalization Status */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>AI personalization is active and learning from your behavior</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Global insights
              </Badge>
              <Badge className="text-xs bg-green-500">
                <Zap className="h-3 w-3 mr-1" />
                Optimized
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}