'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Brain, 
  Tag,
  Network,
  FileText,
  TrendingUp,
  Layers,
  Lightbulb,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContentSummary } from './ContentSummary'
import { SmartTagging } from './SmartTagging'
import { ContentClustering } from './ContentClustering'
import { RecommendationPanel } from './RecommendationPanel'
import { ContentAnalytics } from './ContentAnalytics'

interface AIPanelProps {
  articleId: string
  content: string
  title: string
  category: string
  tags: string[]
  readingTime: number
  views: number
  likes: number
  publishedAt: string
  className?: string
}

export function AIPanel({
  articleId,
  content,
  title,
  category,
  tags,
  readingTime,
  views,
  likes,
  publishedAt,
  className
}: AIPanelProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const [isMinimized, setIsMinimized] = useState(false)

  const tabItems = [
    {
      id: 'summary',
      label: 'Summary',
      icon: <FileText className="h-4 w-4" />,
      description: 'AI-generated content analysis',
      badge: 'Smart'
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Personalized content suggestions',
      badge: 'AI'
    },
    {
      id: 'tagging',
      label: 'Smart Tags',
      icon: <Tag className="h-4 w-4" />,
      description: 'Intelligent content tagging',
      badge: 'Auto'
    },
    {
      id: 'clusters',
      label: 'Clusters',
      icon: <Network className="h-4 w-4" />,
      description: 'Content relationship analysis',
      badge: 'New'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Performance insights and metrics',
      badge: 'Live'
    }
  ]

  if (isMinimized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5" />
              AI Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {tabItems.slice(0, 4).map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMinimized(false)
                }}
              >
                {item.icon}
                <span className="ml-2 text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setActiveTab('analytics')
                setIsMinimized(false)
              }}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="ml-2 text-xs">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle className="text-base">AI Assistant</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Intelligent content analysis and recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex flex-col gap-1 h-auto py-2 px-1"
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
          
          <TabsContent value="summary" className="mt-0">
            <ContentSummary
              articleId={articleId}
              content={content}
              title={title}
              category={category}
              readingTime={readingTime}
            />
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-0">
            <RecommendationPanel
              currentArticleId={articleId}
              currentCategory={category}
              currentTags={tags}
            />
          </TabsContent>
          
          <TabsContent value="tagging" className="mt-0">
            <SmartTagging
              articleId={articleId}
              content={content}
              title={title}
              existingTags={tags}
            />
          </TabsContent>
          
          <TabsContent value="clusters" className="mt-0">
            <ContentClustering
              articleId={articleId}
              category={category}
              tags={tags}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <ContentAnalytics
              articleId={articleId}
              views={views}
              likes={likes}
              readingTime={readingTime}
              publishedAt={publishedAt}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}