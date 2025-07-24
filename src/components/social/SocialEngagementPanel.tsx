'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  MessageCircle, 
  Heart,
  Share,
  TrendingUp,
  Target,
  Settings,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommentsSystem } from './CommentsSystem'
import { ReactionSystem } from './ReactionSystem'
import { SocialSharing } from './SocialSharing'

interface SocialEngagementPanelProps {
  articleId: string
  articleTitle: string
  articleUrl: string
  articleExcerpt: string
  author: string
  category: string
  tags: string[]
  featuredImage?: string
  views: number
  likes: number
  allowComments?: boolean
  className?: string
}

export function SocialEngagementPanel({
  articleId,
  articleTitle,
  articleUrl,
  articleExcerpt,
  author,
  category,
  tags,
  featuredImage,
  views,
  likes,
  allowComments = true,
  className
}: SocialEngagementPanelProps) {
  const [activeTab, setActiveTab] = useState('reactions')
  const [isMinimized, setIsMinimized] = useState(false)

  const tabItems = [
    {
      id: 'reactions',
      label: 'Reactions',
      icon: <Heart className="h-4 w-4" />,
      description: 'Reader reactions and feedback',
      count: likes
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: <MessageCircle className="h-4 w-4" />,
      description: 'Community discussion',
      count: 12 // Mock comment count
    },
    {
      id: 'sharing',
      label: 'Share',
      icon: <Share className="h-4 w-4" />,
      description: 'Social media sharing',
      count: 247 // Mock share count
    }
  ]

  if (isMinimized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Social Engagement
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
          <div className="grid grid-cols-3 gap-2 text-center">
            {tabItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                className="flex flex-col gap-1 h-auto py-2"
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMinimized(false)
                }}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {item.count}
                </Badge>
              </Button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{views.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>High engagement</span>
              </div>
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
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle className="text-base">Social Engagement</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active Community
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
          Connect with readers and share your thoughts
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
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
                  {item.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="reactions" className="mt-0">
            <ReactionSystem
              articleId={articleId}
              initialReactions={{
                like: 34,
                love: 23,
                insightful: 18,
                fire: 12,
                brilliant: 8,
                trophy: 5
              }}
              showLabels={true}
              variant="expanded"
            />
          </TabsContent>
          
          <TabsContent value="comments" className="mt-0">
            <CommentsSystem
              articleId={articleId}
              articleTitle={articleTitle}
              allowComments={allowComments}
            />
          </TabsContent>
          
          <TabsContent value="sharing" className="mt-0">
            <SocialSharing
              articleId={articleId}
              title={articleTitle}
              excerpt={articleExcerpt}
              url={articleUrl}
              author={author}
              featuredImage={featuredImage}
              category={category}
              tags={tags}
              showStats={true}
              showCustomization={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}