'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bookmark, 
  BookmarkCheck, 
  Plus,
  Check,
  Loader2,
  Heart,
  Tag,
  Folder
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BookmarkButtonProps {
  articleId: string
  articleTitle: string
  articleUrl: string
  initialBookmarked?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'icon'
  className?: string
}

interface BookmarkCollection {
  id: string
  name: string
  count: number
  color: string
}

export function BookmarkButton({
  articleId,
  articleTitle,
  articleUrl,
  initialBookmarked = false,
  showLabel = true,
  size = 'md',
  variant = 'button',
  className
}: BookmarkButtonProps) {
  const { data: session } = useSession()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)
  const [showCollections, setShowCollections] = useState(false)

  // Mock collections - would come from API
  const [collections] = useState<BookmarkCollection[]>([
    { id: '1', name: 'Read Later', count: 12, color: 'blue' },
    { id: '2', name: 'Favorites', count: 8, color: 'red' },
    { id: '3', name: 'Tech Articles', count: 25, color: 'green' },
    { id: '4', name: 'Business Insights', count: 15, color: 'purple' },
  ])

  const handleBookmarkToggle = async () => {
    if (!session) {
      // Redirect to login or show login modal
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          action: isBookmarked ? 'remove' : 'add',
        }),
      })

      if (response.ok) {
        setIsBookmarked(!isBookmarked)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCollection = async (collectionId: string) => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/bookmarks/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          collectionId,
        }),
      })

      if (response.ok) {
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error adding to collection:', error)
    } finally {
      setIsLoading(false)
      setShowCollections(false)
    }
  }

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  if (variant === 'icon') {
    return (
      <Button
        variant={isBookmarked ? 'default' : 'outline'}
        size="icon"
        onClick={handleBookmarkToggle}
        disabled={isLoading}
        className={cn(sizeClasses[size], 'w-auto aspect-square', className)}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : isBookmarked ? (
          <BookmarkCheck className={cn(iconSizes[size], 'fill-current')} />
        ) : (
          <Bookmark className={iconSizes[size]} />
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isBookmarked ? 'default' : 'outline'}
        size={size}
        onClick={handleBookmarkToggle}
        disabled={isLoading}
        className={cn(sizeClasses[size], className)}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'mr-2 animate-spin')} />
        ) : isBookmarked ? (
          <BookmarkCheck className={cn(iconSizes[size], 'mr-2 fill-current')} />
        ) : (
          <Bookmark className={cn(iconSizes[size], 'mr-2')} />
        )}
        {showLabel && (isBookmarked ? 'Bookmarked' : 'Bookmark')}
      </Button>

      {session && (
        <DropdownMenu open={showCollections} onOpenChange={setShowCollections}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={size} className="px-2">
              <Plus className={iconSizes[size]} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Save to Collection
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => handleAddToCollection(collection.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full bg-${collection.color}-500`}
                  />
                  <span>{collection.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {collection.count}
                </Badge>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}