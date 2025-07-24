'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Heart, 
  ThumbsUp, 
  Lightbulb,
  Flame as Fire,
  Zap,
  Trophy,
  Plus,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingReaction {
  id: string
  type: string
  icon: React.ReactNode
  count: number
  isActive: boolean
  color: string
}

interface FloatingReactionsProps {
  articleId: string
  position?: 'left' | 'right' | 'bottom'
  showCounts?: boolean
  autoHide?: boolean
  className?: string
}

export function FloatingReactions({
  articleId,
  position = 'right',
  showCounts = true,
  autoHide = true,
  className
}: FloatingReactionsProps) {
  const { data: session } = useSession()
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Initialize reactions
    const initialReactions: FloatingReaction[] = [
      {
        id: 'like',
        type: 'like',
        icon: <ThumbsUp className="h-4 w-4" />,
        count: 34,
        isActive: false,
        color: 'hover:bg-blue-50 hover:text-blue-600'
      },
      {
        id: 'love',
        type: 'love',
        icon: <Heart className="h-4 w-4" />,
        count: 23,
        isActive: false,
        color: 'hover:bg-red-50 hover:text-red-600'
      },
      {
        id: 'insightful',
        type: 'insightful',
        icon: <Lightbulb className="h-4 w-4" />,
        count: 18,
        isActive: false,
        color: 'hover:bg-yellow-50 hover:text-yellow-600'
      },
      {
        id: 'fire',
        type: 'fire',
        icon: <Fire className="h-4 w-4" />,
        count: 12,
        isActive: false,
        color: 'hover:bg-orange-50 hover:text-orange-600'
      },
      {
        id: 'brilliant',
        type: 'brilliant',
        icon: <Zap className="h-4 w-4" />,
        count: 8,
        isActive: false,
        color: 'hover:bg-purple-50 hover:text-purple-600'
      },
      {
        id: 'trophy',
        type: 'trophy',
        icon: <Trophy className="h-4 w-4" />,
        count: 5,
        isActive: false,
        color: 'hover:bg-green-50 hover:text-green-600'
      }
    ]
    
    setReactions(initialReactions)
    loadUserReaction()
  }, [articleId])

  useEffect(() => {
    if (!autoHide) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Show when scrolled past header, hide near footer
      const showPosition = windowHeight * 0.3
      const hidePosition = documentHeight - windowHeight * 1.5
      
      setIsScrolled(scrollY > showPosition && scrollY < hidePosition)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [autoHide])

  const loadUserReaction = async () => {
    if (!session) return
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
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
    if (!session) return
    
    try {
      const isCurrentReaction = userReaction === reactionType
      const newUserReaction = isCurrentReaction ? null : reactionType
      
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
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'fixed left-6 top-1/2 transform -translate-y-1/2 z-40'
      case 'bottom':
        return 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40'
      default:
        return 'fixed right-6 top-1/2 transform -translate-y-1/2 z-40'
    }
  }

  const getLayoutClasses = () => {
    if (position === 'bottom') {
      return isExpanded ? 'flex-row space-x-2' : 'flex-row space-x-1'
    }
    return isExpanded ? 'flex-col space-y-2' : 'flex-col space-y-1'
  }

  if (!isVisible || (autoHide && !isScrolled)) {
    return null
  }

  const visibleReactions = isExpanded ? reactions : reactions.slice(0, 3)
  const totalCount = reactions.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className={cn(getPositionClasses(), className)}>
      <Card className="shadow-lg border-2 overflow-hidden">
        <CardContent className="p-2">
          <div className={cn("flex", getLayoutClasses())}>
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-10 h-10 p-0 rounded-full",
                position === 'bottom' ? 'order-first' : ''
              )}
            >
              {position === 'bottom' ? (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
              ) : (
                isExpanded ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />
              )}
            </Button>

            {/* Reaction Buttons */}
            {visibleReactions.map((reaction) => (
              <Button
                key={reaction.id}
                variant={reaction.isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleReaction(reaction.type)}
                className={cn(
                  "relative w-10 h-10 p-0 rounded-full transition-all duration-200",
                  !reaction.isActive && reaction.color,
                  reaction.isActive && "shadow-md"
                )}
                title={`React with ${reaction.type}`}
              >
                <div className="flex flex-col items-center justify-center">
                  {reaction.icon}
                  {showCounts && reaction.count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs rounded-full"
                    >
                      {reaction.count > 99 ? '99+' : reaction.count}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}

            {/* Total Count Display */}
            {isExpanded && totalCount > 0 && (
              <div className={cn(
                "flex items-center justify-center text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-1",
                position === 'bottom' ? 'order-last' : ''
              )}>
                <span className="font-medium">{totalCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hide Button */}
      {isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="mt-2 w-10 h-6 p-0 rounded-full opacity-50 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}