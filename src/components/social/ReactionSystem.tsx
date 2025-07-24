'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ThumbsUp, 
  ThumbsDown,
  Lightbulb,
  Flame as Fire,
  Zap,
  Trophy,
  Eye,
  Smile,
  Frown,
  Meh,
  Target,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Reaction {
  id: string
  type: 'like' | 'love' | 'insightful' | 'fire' | 'brilliant' | 'trophy' | 'thumbs_up' | 'thumbs_down'
  label: string
  icon: React.ReactNode
  count: number
  isActive: boolean
  color: string
  description: string
}

interface ReactionSystemProps {
  articleId: string
  initialReactions?: Partial<Record<Reaction['type'], number>>
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'compact' | 'expanded' | 'floating'
  className?: string
}

export function ReactionSystem({
  articleId,
  initialReactions = {},
  showLabels = true,
  size = 'md',
  variant = 'expanded',
  className
}: ReactionSystemProps) {
  const { data: session } = useSession()
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Initialize reactions
  useEffect(() => {
    const defaultReactions: Reaction[] = [
      {
        id: 'like',
        type: 'like',
        label: 'Like',
        icon: <ThumbsUp className="h-4 w-4" />,
        count: initialReactions.like || 0,
        isActive: false,
        color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
        description: 'I like this article'
      },
      {
        id: 'love',
        type: 'love',
        label: 'Love',
        icon: <Heart className="h-4 w-4" />,
        count: initialReactions.love || 0,
        isActive: false,
        color: 'text-red-600 bg-red-50 hover:bg-red-100',
        description: 'I love this content'
      },
      {
        id: 'insightful',
        type: 'insightful',
        label: 'Insightful',
        icon: <Lightbulb className="h-4 w-4" />,
        count: initialReactions.insightful || 0,
        isActive: false,
        color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
        description: 'This is very insightful'
      },
      {
        id: 'fire',
        type: 'fire',
        label: 'Fire',
        icon: <Fire className="h-4 w-4" />,
        count: initialReactions.fire || 0,
        isActive: false,
        color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
        description: 'This is fire content'
      },
      {
        id: 'brilliant',
        type: 'brilliant',
        label: 'Brilliant',
        icon: <Zap className="h-4 w-4" />,
        count: initialReactions.brilliant || 0,
        isActive: false,
        color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
        description: 'Brilliant analysis'
      },
      {
        id: 'trophy',
        type: 'trophy',
        label: 'Award',
        icon: <Trophy className="h-4 w-4" />,
        count: initialReactions.trophy || 0,
        isActive: false,
        color: 'text-green-600 bg-green-50 hover:bg-green-100',
        description: 'Award-worthy content'
      }
    ]
    
    setReactions(defaultReactions)
    loadUserReaction()
  }, [articleId])

  const loadUserReaction = async () => {
    if (!session) return
    
    try {
      // Mock API call to get user's reaction
      await new Promise(resolve => setTimeout(resolve, 300))
      // Simulate user having reacted with 'love'
      setUserReaction('love')
      setReactions(prev => prev.map(reaction => ({
        ...reaction,
        isActive: reaction.type === 'love'
      })))
    } catch (error) {
      console.error('Error loading user reaction:', error)
    }
  }

  const handleReaction = async (reactionType: string) => {
    if (!session) {
      // Show login prompt
      return
    }
    
    setIsLoading(true)
    try {
      const isCurrentReaction = userReaction === reactionType
      const newUserReaction = isCurrentReaction ? null : reactionType
      
      // Optimistic update
      setReactions(prev => prev.map(reaction => {
        if (reaction.type === reactionType) {
          return {
            ...reaction,
            count: isCurrentReaction ? reaction.count - 1 : reaction.count + 1,
            isActive: !isCurrentReaction
          }
        }
        if (reaction.type === userReaction && userReaction !== reactionType) {
          return {
            ...reaction,
            count: reaction.count - 1,
            isActive: false
          }
        }
        return {
          ...reaction,
          isActive: false
        }
      }))
      
      setUserReaction(newUserReaction)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Error updating reaction:', error)
      // Revert optimistic update
      loadUserReaction()
    } finally {
      setIsLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1'
      case 'lg': return 'text-base px-4 py-3'
      default: return 'text-sm px-3 py-2'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3'
      case 'lg': return 'h-5 w-5'
      default: return 'h-4 w-4'
    }
  }

  const totalReactions = reactions.reduce((sum, reaction) => sum + reaction.count, 0)
  const topReactions = reactions
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  if (variant === 'floating') {
    return (
      <div className={cn("fixed bottom-20 right-6 z-40 space-y-2", className)}>
        {reactions.slice(0, 3).map((reaction) => (
          <Button
            key={reaction.id}
            variant={reaction.isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReaction(reaction.type)}
            disabled={isLoading}
            className={cn(
              "w-12 h-12 rounded-full shadow-lg",
              !reaction.isActive && reaction.color
            )}
          >
            <div className="flex flex-col items-center">
              {reaction.icon}
              <span className="text-xs mt-1">{reaction.count}</span>
            </div>
          </Button>
        ))}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          {topReactions.slice(0, 3).map((reaction, index) => (
            <div key={reaction.id} className="flex items-center">
              {index > 0 && <span className="text-muted-foreground mx-1">•</span>}
              <div className={cn("flex items-center", getIconSize())}>
                {reaction.icon}
              </div>
            </div>
          ))}
        </div>
        {totalReactions > 0 && (
          <span className="text-sm text-muted-foreground">
            {totalReactions} reactions
          </span>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5" />
            Reader Reactions
          </CardTitle>
          {totalReactions > 0 && (
            <Badge variant="secondary">
              <TrendingUp className="h-3 w-3 mr-1" />
              {totalReactions} total
            </Badge>
          )}
        </div>
        <CardDescription>
          Share your reaction to this article
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Reaction Stats */}
        {totalReactions > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Most Popular Reactions</h4>
            <div className="space-y-2">
              {topReactions.map((reaction) => (
                <div key={reaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {reaction.icon}
                    <span className="text-sm">{reaction.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(reaction.count / totalReactions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {reaction.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reaction Buttons */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Add Your Reaction</h4>
          <div className="grid grid-cols-2 gap-2">
            {(showAll ? reactions : reactions.slice(0, 4)).map((reaction) => (
              <Button
                key={reaction.id}
                variant={reaction.isActive ? 'default' : 'outline'}
                onClick={() => handleReaction(reaction.type)}
                disabled={isLoading}
                className={cn(
                  "justify-start h-auto py-3",
                  getSizeClasses(),
                  !reaction.isActive && reaction.color
                )}
                title={reaction.description}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={getIconSize()}>
                    {reaction.icon}
                  </div>
                  {showLabels && (
                    <div className="flex-1 text-left">
                      <div className="font-medium">{reaction.label}</div>
                      <div className="text-xs opacity-70">{reaction.count}</div>
                    </div>
                  )}
                  {!showLabels && (
                    <span className="ml-auto text-sm">{reaction.count}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          {!showAll && reactions.length > 4 && (
            <Button
              variant="ghost"
              onClick={() => setShowAll(true)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Show More Reactions
            </Button>
          )}
        </div>

        {/* User's Current Reaction */}
        {userReaction && (
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              <Smile className="h-4 w-4 inline mr-1" />
              You reacted with{' '}
              <span className="font-medium">
                {reactions.find(r => r.type === userReaction)?.label}
              </span>
            </p>
          </div>
        )}

        {/* Login Prompt */}
        {!session && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Sign in to react to this article and join the conversation
            </p>
            <Button size="sm">
              Sign In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}