'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Heart, 
  Reply,
  MoreHorizontal,
  Send,
  Flag,
  Edit,
  Trash2,
  Pin,
  Award,
  TrendingUp,
  Filter,
  SortDesc
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    role?: 'admin' | 'moderator' | 'verified' | 'user'
    reputation?: number
  }
  createdAt: string
  updatedAt?: string
  likes: number
  isLiked: boolean
  isPinned: boolean
  replies: Comment[]
  isDeleted: boolean
  parentId?: string
}

interface CommentsSystemProps {
  articleId: string
  articleTitle: string
  initialComments?: Comment[]
  allowComments?: boolean
  className?: string
}

export function CommentsSystem({
  articleId,
  articleTitle,
  initialComments = [],
  allowComments = true,
  className
}: CommentsSystemProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [filterBy, setFilterBy] = useState<'all' | 'verified' | 'pinned'>('all')

  // Load mock comments
  useEffect(() => {
    loadComments()
  }, [articleId, sortBy, filterBy])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockComments: Comment[] = [
        {
          id: '1',
          content: 'This is an excellent analysis of AI in media production. The points about balancing automation with human creativity really resonate with my experience in the industry.',
          author: {
            id: '1',
            name: 'Sarah Chen',
            avatar: '/avatars/sarah.jpg',
            role: 'verified',
            reputation: 1240
          },
          createdAt: '2024-01-15T14:30:00Z',
          likes: 23,
          isLiked: false,
          isPinned: true,
          replies: [
            {
              id: '2',
              content: 'I completely agree, Sarah. Have you tried any of the newer AI editing tools mentioned in the article?',
              author: {
                id: '2',
                name: 'Mike Rodriguez',
                avatar: '/avatars/mike.jpg',
                role: 'user',
                reputation: 89
              },
              createdAt: '2024-01-15T15:45:00Z',
              likes: 8,
              isLiked: true,
              isPinned: false,
              replies: [],
              isDeleted: false,
              parentId: '1'
            }
          ],
          isDeleted: false
        },
        {
          id: '3',
          content: 'Great article! I\'d love to see more content about the ethical implications of AI in creative fields.',
          author: {
            id: '3',
            name: 'Alex Thompson',
            avatar: '/avatars/alex.jpg',
            role: 'moderator',
            reputation: 567
          },
          createdAt: '2024-01-15T16:20:00Z',
          likes: 15,
          isLiked: false,
          isPinned: false,
          replies: [],
          isDeleted: false
        },
        {
          id: '4',
          content: 'This technology is fascinating but also concerning. What safeguards are in place to prevent misuse?',
          author: {
            id: '4',
            name: 'Dr. Jennifer Liu',
            avatar: '/avatars/jennifer.jpg',
            role: 'verified',
            reputation: 892
          },
          createdAt: '2024-01-15T17:10:00Z',
          likes: 31,
          isLiked: false,
          isPinned: false,
          replies: [],
          isDeleted: false
        }
      ]
      
      setComments(mockComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session) return
    
    setIsLoading(true)
    try {
      // Mock API call
      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: {
          id: session.user?.id || 'current-user',
          name: session.user?.name || 'Anonymous',
          avatar: session.user?.image,
          role: 'user',
          reputation: 0
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isPinned: false,
        replies: [],
        isDeleted: false
      }
      
      setComments([comment, ...comments])
      setNewComment('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !session) return
    
    setIsLoading(true)
    try {
      // Mock API call
      const reply: Comment = {
        id: Date.now().toString(),
        content: replyContent,
        author: {
          id: session.user?.id || 'current-user',
          name: session.user?.name || 'Anonymous',
          avatar: session.user?.image,
          role: 'user',
          reputation: 0
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isPinned: false,
        replies: [],
        isDeleted: false,
        parentId
      }
      
      setComments(comments.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ))
      setReplyContent('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!session) return
    
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        }
      }
      return {
        ...comment,
        replies: comment.replies.map(reply => 
          reply.id === commentId 
            ? {
                ...reply,
                likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                isLiked: !reply.isLiked
              }
            : reply
        )
      }
    }))
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin': return <Award className="h-3 w-3 text-red-500" />
      case 'moderator': return <Pin className="h-3 w-3 text-blue-500" />
      case 'verified': return <Badge className="h-3 w-3 text-green-500" />
      default: return null
    }
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700'
      case 'moderator': return 'bg-blue-100 text-blue-700'
      case 'verified': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={cn("space-y-3", isReply && "ml-8 pl-4 border-l-2 border-muted")}>
      {comment.isPinned && (
        <Badge className="bg-blue-100 text-blue-700 text-xs">
          <Pin className="h-3 w-3 mr-1" />
          Pinned
        </Badge>
      )}
      
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            {comment.author.role && (
              <Badge className={cn("text-xs px-1.5 py-0.5", getRoleBadgeColor(comment.author.role))}>
                {getRoleIcon(comment.author.role)}
                <span className="ml-1 capitalize">{comment.author.role}</span>
              </Badge>
            )}
            {comment.author.reputation !== undefined && (
              <Badge variant="outline" className="text-xs">
                {comment.author.reputation} pts
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          
          <p className="text-sm leading-relaxed">{comment.content}</p>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeComment(comment.id)}
              className={cn(
                "h-7 px-2 text-xs",
                comment.isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-3 w-3 mr-1", comment.isLiked && "fill-current")} />
              {comment.likes}
            </Button>
            
            {!isReply && session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
                className="h-7 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                {session?.user?.id === comment.author.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="space-y-3 pt-3">
              <Textarea
                placeholder={`Reply to ${comment.author.name}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isLoading}
                >
                  <Send className="h-3 w-3 mr-2" />
                  Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentComponent key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)})
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterBy('all')}>
                  All Comments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('verified')}>
                  Verified Users
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('pinned')}>
                  Pinned Comments
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortDesc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                  Most Popular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription>
          Join the conversation about "{articleTitle}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        {allowComments && session && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'User'} />
                <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share your thoughts about this article..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/1000 characters
                  </span>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
            <Separator />
          </div>
        )}
        
        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No comments yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts on this article.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentComponent key={comment.id} comment={comment} />
            ))
          )}
        </div>
        
        {/* Load More */}
        {comments.length > 0 && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={loadComments} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load More Comments'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}