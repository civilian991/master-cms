'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  User, 
  Tag,
  ArrowRight,
  RefreshCw,
  Brain,
  Target,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface RecommendedArticle {
  id: string
  title: string
  excerpt: string
  slug: string
  author: {
    name: string
    avatar?: string
  }
  category: string
  readingTime: number
  publishedAt: string
  similarity: number
  reason: string
  tags: string[]
}

interface RecommendationPanelProps {
  currentArticleId: string
  currentCategory: string
  currentTags: string[]
  className?: string
}

export function RecommendationPanel({
  currentArticleId,
  currentCategory, 
  currentTags,
  className
}: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<RecommendedArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchRecommendations()
  }, [currentArticleId, refreshKey])

  const fetchRecommendations = async () => {
    setIsLoading(true)
    try {
      // Mock API call to AI recommendations endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock recommendations with AI-powered similarity scores
      const mockRecommendations: RecommendedArticle[] = [
        {
          id: '1',
          title: 'Machine Learning Applications in Content Creation',
          excerpt: 'Exploring how ML algorithms are revolutionizing automated content generation and personalization.',
          slug: 'ml-content-creation',
          author: {
            name: 'Dr. Sarah Chen',
            avatar: '/avatars/sarah-chen.jpg'
          },
          category: 'Technology',
          readingTime: 12,
          publishedAt: '2024-01-10T14:30:00Z',
          similarity: 0.89,
          reason: 'Similar AI and technology themes',
          tags: ['AI', 'Machine Learning', 'Content Creation']
        },
        {
          id: '2', 
          title: 'The Economics of Digital Transformation',
          excerpt: 'How businesses are adapting their economic models to succeed in the digital age.',
          slug: 'economics-digital-transformation',
          author: {
            name: 'Ahmed Hassan',
            avatar: '/avatars/ahmed.jpg'
          },
          category: 'Business',
          readingTime: 15,
          publishedAt: '2024-01-08T09:15:00Z',
          similarity: 0.76,
          reason: 'Related business innovation topics',
          tags: ['Digital Transformation', 'Business', 'Economics']
        },
        {
          id: '3',
          title: 'Ethical Considerations in AI Development',
          excerpt: 'Addressing the moral and ethical challenges in modern artificial intelligence systems.',
          slug: 'ai-ethics-considerations',
          author: {
            name: 'Prof. Maria Rodriguez',
            avatar: '/avatars/maria.jpg'
          },
          category: 'Technology',
          readingTime: 10,
          publishedAt: '2024-01-06T16:45:00Z',
          similarity: 0.82,
          reason: 'AI technology focus with ethical perspective',
          tags: ['AI', 'Ethics', 'Technology Policy']
        }
      ]
      
      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return 'text-green-600 bg-green-50'
    if (similarity > 0.6) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <Skeleton className="h-8 w-20" />
          </div>
          <CardDescription>
            Finding personalized content based on your interests...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        <CardDescription>
          Personalized content suggestions powered by AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations.map((article, index) => (
          <div key={article.id} className="group space-y-3 pb-6 border-b border-border last:border-b-0 last:pb-0">
            {/* Similarity Score & Reason */}
            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getSimilarityColor(article.similarity))}
              >
                <Brain className="h-3 w-3 mr-1" />
                {Math.round(article.similarity * 100)}% match
              </Badge>
              <span className="text-xs text-muted-foreground">{article.reason}</span>
            </div>

            {/* Article Link */}
            <Link
              href={`/articles/${article.slug}`}
              className="block space-y-2 group-hover:text-primary transition-colors"
             >
              <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                {article.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
            </Link>

            {/* Article Metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{article.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{article.readingTime}m</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {article.category}
              </Badge>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Read Button */}
            <Link href={`/articles/${article.slug}`}>
              <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <span>Read Article</span>
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        ))}

        {/* More Recommendations */}
        <div className="pt-4 border-t border-border">
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/recommendations">
              <TrendingUp className="h-4 w-4 mr-2" />
              View All Recommendations
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Personalization Note */}
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">
            <Target className="h-3 w-3 inline mr-1" />
            Recommendations improve based on your reading history and preferences
          </p>
        </div>
      </CardContent>
    </Card>
  );
}