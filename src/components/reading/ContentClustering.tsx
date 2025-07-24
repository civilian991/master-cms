'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Network, 
  Brain, 
  TrendingUp,
  Users,
  Globe,
  Layers,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Target,
  BookOpen,
  Clock,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ContentCluster {
  id: string
  name: string
  description: string
  articleCount: number
  similarity: number
  topics: string[]
  articles: ClusterArticle[]
  trend: 'rising' | 'stable' | 'declining'
  engagement: number
}

interface ClusterArticle {
  id: string
  title: string
  excerpt: string
  slug: string
  author: string
  publishedAt: string
  readingTime: number
  views: number
  similarity: number
}

interface ContentClusteringProps {
  articleId: string
  category: string
  tags: string[]
  className?: string
}

export function ContentClustering({
  articleId,
  category,
  tags,
  className
}: ContentClusteringProps) {
  const [clusters, setClusters] = useState<ContentCluster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)

  useEffect(() => {
    generateContentClusters()
  }, [articleId, category, tags])

  const generateContentClusters = async () => {
    setIsLoading(true)
    try {
      // Mock AI clustering analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockClusters: ContentCluster[] = [
        {
          id: 'ai-innovation',
          name: 'AI Innovation Hub',
          description: 'Articles exploring artificial intelligence breakthroughs and applications',
          articleCount: 23,
          similarity: 0.87,
          topics: ['AI', 'Machine Learning', 'Innovation', 'Technology'],
          trend: 'rising',
          engagement: 92,
          articles: [
            {
              id: '1',
              title: 'Machine Learning in Healthcare: Revolutionary Applications',
              excerpt: 'How ML is transforming patient care and medical diagnostics.',
              slug: 'ml-healthcare-applications',
              author: 'Dr. Sarah Chen',
              publishedAt: '2024-01-14T10:00:00Z',
              readingTime: 12,
              views: 3420,
              similarity: 0.91
            },
            {
              id: '2',
              title: 'The Ethics of Autonomous AI Systems',
              excerpt: 'Examining moral frameworks for self-governing AI technologies.',
              slug: 'ai-ethics-autonomous-systems',
              author: 'Prof. Michael Torres',
              publishedAt: '2024-01-13T14:30:00Z',
              readingTime: 15,
              views: 2890,
              similarity: 0.85
            },
            {
              id: '3',
              title: 'Neural Networks: Beyond Deep Learning',
              excerpt: 'Exploring next-generation neural network architectures.',
              slug: 'neural-networks-beyond-deep-learning',
              author: 'Dr. Lisa Wang',
              publishedAt: '2024-01-12T09:15:00Z',
              readingTime: 18,
              views: 4156,
              similarity: 0.83
            }
          ]
        },
        {
          id: 'digital-transformation',
          name: 'Digital Transformation',
          description: 'Content covering business digitization and technological adaptation',
          articleCount: 18,
          similarity: 0.76,
          topics: ['Digital Transformation', 'Business', 'Technology', 'Strategy'],
          trend: 'stable',
          engagement: 78,
          articles: [
            {
              id: '4',
              title: 'Cloud Migration Strategies for Modern Enterprises',
              excerpt: 'Best practices for seamless cloud adoption and integration.',
              slug: 'cloud-migration-strategies',
              author: 'James Rodriguez',
              publishedAt: '2024-01-11T16:45:00Z',
              readingTime: 10,
              views: 2341,
              similarity: 0.79
            },
            {
              id: '5',
              title: 'Remote Work: Reshaping Corporate Culture',
              excerpt: 'How distributed teams are changing organizational dynamics.',
              slug: 'remote-work-corporate-culture',
              author: 'Amanda Johnson',
              publishedAt: '2024-01-10T11:20:00Z',
              readingTime: 8,
              views: 1987,
              similarity: 0.74
            }
          ]
        },
        {
          id: 'future-trends',
          name: 'Future Technology Trends',
          description: 'Forward-looking analysis of emerging technologies and predictions',
          articleCount: 15,
          similarity: 0.71,
          topics: ['Future Tech', 'Predictions', 'Emerging Tech', 'Innovation'],
          trend: 'rising',
          engagement: 85,
          articles: [
            {
              id: '6',
              title: 'Quantum Computing: The Next Frontier',
              excerpt: 'Understanding quantum computing potential and current limitations.',
              slug: 'quantum-computing-next-frontier',
              author: 'Dr. Robert Kim',
              publishedAt: '2024-01-09T13:00:00Z',
              readingTime: 20,
              views: 5234,
              similarity: 0.73
            }
          ]
        }
      ]
      
      setClusters(mockClusters)
    } catch (error) {
      console.error('Error generating content clusters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: ContentCluster['trend']) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'declining': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
      default: return <TrendingUp className="h-3 w-3 text-blue-600 rotate-90" />
    }
  }

  const getTrendColor = (trend: ContentCluster['trend']) => {
    switch (trend) {
      case 'rising': return 'text-green-600 bg-green-50'
      case 'declining': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Content Clusters
          </CardTitle>
          <CardDescription>
            Analyzing content relationships and clustering...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-4 border rounded-lg">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
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
            <Network className="h-5 w-5" />
            Content Clusters
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateContentClusters}
          >
            <Brain className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <CardDescription>
          AI-discovered content relationships and thematic groupings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className={cn(
              "border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md",
              selectedCluster === cluster.id && "border-primary bg-primary/5"
            )}
            onClick={() => setSelectedCluster(
              selectedCluster === cluster.id ? null : cluster.id
            )}
          >
            {/* Cluster Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">{cluster.name}</h4>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {cluster.articleCount} articles
                </Badge>
                <Badge className={cn("text-xs", getTrendColor(cluster.trend))}>
                  {getTrendIcon(cluster.trend)}
                  <span className="ml-1 capitalize">{cluster.trend}</span>
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {Math.round(cluster.similarity * 100)}% match
                </span>
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    selectedCluster === cluster.id && "rotate-90"
                  )} 
                />
              </div>
            </div>

            {/* Cluster Description */}
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {cluster.description}
            </p>

            {/* Cluster Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{cluster.engagement}% engagement</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{Math.round(cluster.similarity * 100)}% similarity</span>
              </div>
            </div>

            {/* Topics */}
            <div className="flex flex-wrap gap-1 mb-3">
              {cluster.topics.map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs px-1.5 py-0.5">
                  {topic}
                </Badge>
              ))}
            </div>

            {/* Expanded Cluster Articles */}
            {selectedCluster === cluster.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <h5 className="font-medium text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Articles in this cluster
                </h5>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cluster.articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                     >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h6 className="font-medium text-sm line-clamp-2 mb-1">
                            {article.title}
                          </h6>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {article.excerpt}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{article.author}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{article.readingTime}m</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{article.views.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(article.similarity * 100)}% match
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/explore/clusters/${cluster.id}`}>
                      <Globe className="h-4 w-4 mr-2" />
                      Explore Full Cluster
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Cluster Insights */}
        <div className="pt-4 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Content clusters are generated using AI semantic analysis to discover thematic relationships
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}