'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  TrendingUp,
  Star,
  Clock,
  User,
  BookOpen,
  Zap,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Share,
  Bookmark,
  ChevronRight,
  Brain,
  Users,
  Globe,
  Tag,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  excerpt: string
  author: string
  publishedAt: string
  readingTime: number
  category: string
  tags: string[]
  rating: number
  views: number
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  thumbnailUrl?: string
  confidenceScore: number
  reasonCode: 'similar_content' | 'author_preference' | 'trending' | 'category_match' | 'collaborative_filtering'
}

interface RecommendationEngineProps {
  userId?: string
  currentArticleId?: string
  maxRecommendations?: number
  showReasonings?: boolean
  className?: string
}

export function RecommendationEngine({
  userId = 'current-user',
  currentArticleId,
  maxRecommendations = 12,
  showReasonings = true,
  className
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userInteractions, setUserInteractions] = useState<Record<string, 'like' | 'dislike' | null>>({})
  const [activeTab, setActiveTab] = useState('personalized')

  useEffect(() => {
    loadRecommendations()
  }, [userId, currentArticleId, activeTab])

  const loadRecommendations = async () => {
    setIsLoading(true)
    
    try {
      // Mock API call to recommendation service
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockRecommendations: Article[] = [
        {
          id: '1',
          title: 'Advanced Machine Learning Techniques for Cybersecurity',
          excerpt: 'Explore cutting-edge ML algorithms that are revolutionizing threat detection and prevention in modern security systems.',
          author: 'Dr. Sarah Chen',
          publishedAt: '2024-01-15T10:30:00Z',
          readingTime: 12,
          category: 'AI Security',
          tags: ['Machine Learning', 'Cybersecurity', 'Threat Detection'],
          rating: 4.8,
          views: 2847,
          language: 'en',
          difficulty: 'advanced',
          confidenceScore: 0.94,
          reasonCode: 'similar_content'
        },
        {
          id: '2',
          title: 'Building Resilient Cloud Infrastructure',
          excerpt: 'Learn best practices for designing fault-tolerant cloud architectures that can withstand various failure scenarios.',
          author: 'Michael Rodriguez',
          publishedAt: '2024-01-14T16:20:00Z',
          readingTime: 8,
          category: 'Cloud Computing',
          tags: ['Cloud', 'Infrastructure', 'DevOps'],
          rating: 4.6,
          views: 1923,
          language: 'en',
          difficulty: 'intermediate',
          confidenceScore: 0.87,
          reasonCode: 'author_preference'
        },
        {
          id: '3',
          title: 'Quantum Computing: The Next Frontier',
          excerpt: 'Discover how quantum computing is poised to transform industries and solve complex computational problems.',
          author: 'Dr. Emily Watson',
          publishedAt: '2024-01-13T14:15:00Z',
          readingTime: 15,
          category: 'Emerging Tech',
          tags: ['Quantum Computing', 'Future Tech', 'Research'],
          rating: 4.9,
          views: 3456,
          language: 'en',
          difficulty: 'advanced',
          confidenceScore: 0.91,
          reasonCode: 'trending'
        },
        {
          id: '4',
          title: 'Blockchain Security: Protecting Digital Assets',
          excerpt: 'Understanding the security challenges and solutions in blockchain technology and cryptocurrency systems.',
          author: 'Alex Kim',
          publishedAt: '2024-01-12T11:45:00Z',
          readingTime: 10,
          category: 'Blockchain',
          tags: ['Blockchain', 'Security', 'Cryptocurrency'],
          rating: 4.7,
          views: 2134,
          language: 'en',
          difficulty: 'intermediate',
          confidenceScore: 0.85,
          reasonCode: 'category_match'
        },
        {
          id: '5',
          title: 'AI Ethics in Modern Development',
          excerpt: 'Examining the ethical implications of AI development and deployment in various industries and applications.',
          author: 'Dr. Maria Garcia',
          publishedAt: '2024-01-11T09:30:00Z',
          readingTime: 7,
          category: 'AI Ethics',
          tags: ['AI', 'Ethics', 'Technology'],
          rating: 4.5,
          views: 1876,
          language: 'en',
          difficulty: 'beginner',
          confidenceScore: 0.82,
          reasonCode: 'collaborative_filtering'
        },
        {
          id: '6',
          title: 'Microservices Architecture Best Practices',
          excerpt: 'Comprehensive guide to designing, implementing, and maintaining microservices-based applications.',
          author: 'David Thompson',
          publishedAt: '2024-01-10T13:20:00Z',
          readingTime: 14,
          category: 'Software Architecture',
          tags: ['Microservices', 'Architecture', 'Scalability'],
          rating: 4.6,
          views: 2567,
          language: 'en',
          difficulty: 'intermediate',
          confidenceScore: 0.88,
          reasonCode: 'similar_content'
        }
      ]
      
      setRecommendations(mockRecommendations.slice(0, maxRecommendations))
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getReasonText = (reason: Article['reasonCode']): string => {
    switch (reason) {
      case 'similar_content': return 'Similar to articles you\'ve read'
      case 'author_preference': return 'Author you follow'
      case 'trending': return 'Trending in your interests'
      case 'category_match': return 'Matches your preferences'
      case 'collaborative_filtering': return 'Others like you also read'
      default: return 'Recommended for you'
    }
  }

  const getReasonIcon = (reason: Article['reasonCode']) => {
    switch (reason) {
      case 'similar_content': return <BookOpen className="h-3 w-3" />
      case 'author_preference': return <User className="h-3 w-3" />
      case 'trending': return <TrendingUp className="h-3 w-3" />
      case 'category_match': return <Target className="h-3 w-3" />
      case 'collaborative_filtering': return <Users className="h-3 w-3" />
      default: return <Brain className="h-3 w-3" />
    }
  }

  const getDifficultyColor = (difficulty: Article['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
    }
  }

  const handleInteraction = (articleId: string, type: 'like' | 'dislike') => {
    setUserInteractions(prev => ({
      ...prev,
      [articleId]: prev[articleId] === type ? null : type
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const renderArticleCard = (article: Article, index: number) => (
    <Card key={article.id} className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with confidence score */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getDifficultyColor(article.difficulty))}
                >
                  {article.difficulty}
                </Badge>
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.floor(article.rating) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {article.rating}
                  </span>
                </div>
              </div>
              
              <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.excerpt}
              </p>
            </div>
            
            <div className="text-right ml-4">
              <div className="text-xs text-muted-foreground mb-1">
                {Math.round(article.confidenceScore * 100)}% match
              </div>
              <Progress 
                value={article.confidenceScore * 100} 
                className="h-2 w-16"
              />
            </div>
          </div>

          {/* Meta information */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.publishedAt)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readingTime}m read
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views.toLocaleString()}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{article.tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Reasoning */}
          {showReasonings && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getReasonIcon(article.reasonCode)}
                {getReasonText(article.reasonCode)}
              </Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant={userInteractions[article.id] === 'like' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleInteraction(article.id, 'like')}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant={userInteractions[article.id] === 'dislike' ? 'destructive' : 'ghost'}
                size="sm"
                onClick={() => handleInteraction(article.id, 'dislike')}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bookmark className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-3 w-3" />
              </Button>
            </div>
            
            <Link href={`/articles/${article.id}`}>
              <Button variant="outline" size="sm">
                Read Article
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Personalized
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRecommendations}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Discover content tailored to your interests and reading patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personalized">
              <Target className="h-3 w-3 mr-1" />
              For You
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="similar">
              <BookOpen className="h-3 w-3 mr-1" />
              Similar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personalized" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((article, index) => renderArticleCard(article, index))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trending" className="mt-6">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Trending Content</h3>
              <p className="text-sm text-muted-foreground">
                Discover what's popular in your areas of interest
              </p>
              <Button className="mt-4" onClick={() => setActiveTab('personalized')}>
                <Zap className="h-4 w-4 mr-2" />
                Switch to Personalized
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="similar" className="mt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Similar Articles</h3>
              <p className="text-sm text-muted-foreground">
                Find content related to what you're currently reading
              </p>
              <Button className="mt-4" onClick={() => setActiveTab('personalized')}>
                <Target className="h-4 w-4 mr-2" />
                View Personalized
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recommendation Stats */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold">94%</div>
              <div className="text-xs text-muted-foreground">Avg Match</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">{recommendations.length}</div>
              <div className="text-xs text-muted-foreground">Suggestions</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">4.7★</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">12m</div>
              <div className="text-xs text-muted-foreground">Avg Read</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}