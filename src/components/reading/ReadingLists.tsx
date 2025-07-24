'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  BookOpen, 
  Plus, 
  Star,
  Clock,
  Eye,
  Heart,
  MoreHorizontal,
  Edit,
  Trash2,
  Share,
  Users,
  Lock,
  Globe,
  Calendar,
  Tag,
  Search,
  SortDesc,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface ReadingList {
  id: string
  name: string
  description: string
  isPublic: boolean
  articlesCount: number
  createdAt: string
  updatedAt: string
  tags: string[]
  color: string
  articles: ReadingListArticle[]
  collaborators?: Array<{
    id: string
    name: string
    avatar?: string
  }>
}

interface ReadingListArticle {
  id: string
  title: string
  excerpt: string
  slug: string
  author: string
  category: string
  readingTime: number
  publishedAt: string
  addedAt: string
  isRead: boolean
  rating?: number
  notes?: string
  progress?: number
}

interface ReadingListsProps {
  userId?: string
  showCreateForm?: boolean
  className?: string
}

export function ReadingLists({
  userId,
  showCreateForm = true,
  className
}: ReadingListsProps) {
  const { data: session } = useSession()
  const [lists, setLists] = useState<ReadingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewListForm, setShowNewListForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent')
  const [filterBy, setFilterBy] = useState<'all' | 'mine' | 'shared' | 'public'>('all')
  const [newList, setNewList] = useState({
    name: '',
    description: '',
    isPublic: false,
    color: 'blue',
    tags: ''
  })

  useEffect(() => {
    loadReadingLists()
  }, [userId, sortBy, filterBy])

  const loadReadingLists = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockLists: ReadingList[] = [
        {
          id: '1',
          name: 'AI & Technology',
          description: 'Articles about artificial intelligence, machine learning, and emerging technologies',
          isPublic: true,
          articlesCount: 12,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z',
          tags: ['AI', 'Technology', 'Future'],
          color: 'blue',
          articles: [
            {
              id: '1',
              title: 'The Future of AI in Media Production',
              excerpt: 'Exploring how artificial intelligence is revolutionizing content creation.',
              slug: 'future-ai-media-production',
              author: 'Sarah Al-Ahmad',
              category: 'Technology',
              readingTime: 8,
              publishedAt: '2024-01-15T10:00:00Z',
              addedAt: '2024-01-15T14:30:00Z',
              isRead: true,
              rating: 5,
              progress: 100
            },
            {
              id: '2',
              title: 'Machine Learning in Healthcare',
              excerpt: 'How ML is transforming patient care and medical diagnostics.',
              slug: 'ml-healthcare-applications',
              author: 'Dr. Sarah Chen',
              category: 'Technology',
              readingTime: 12,
              publishedAt: '2024-01-14T10:00:00Z',
              addedAt: '2024-01-14T16:20:00Z',
              isRead: false,
              progress: 45
            }
          ]
        },
        {
          id: '2',
          name: 'Business Insights',
          description: 'Strategic business articles and market analysis',
          isPublic: false,
          articlesCount: 8,
          createdAt: '2024-01-08T15:00:00Z',
          updatedAt: '2024-01-14T11:20:00Z',
          tags: ['Business', 'Strategy', 'Markets'],
          color: 'green',
          articles: [
            {
              id: '3',
              title: 'Economic Outlook 2024',
              excerpt: 'Comprehensive analysis of economic trends shaping the business landscape.',
              slug: 'economic-outlook-2024',
              author: 'Ahmed Hassan',
              category: 'Economy',
              readingTime: 12,
              publishedAt: '2024-01-14T14:30:00Z',
              addedAt: '2024-01-14T16:00:00Z',
              isRead: true,
              rating: 4
            }
          ],
          collaborators: [
            { id: '2', name: 'John Smith', avatar: '/avatars/john.jpg' },
            { id: '3', name: 'Jane Doe', avatar: '/avatars/jane.jpg' }
          ]
        },
        {
          id: '3',
          name: 'Weekend Reading',
          description: 'Lighter reads for weekend leisure time',
          isPublic: false,
          articlesCount: 5,
          createdAt: '2024-01-05T12:00:00Z',
          updatedAt: '2024-01-13T18:45:00Z',
          tags: ['Leisure', 'Culture', 'Entertainment'],
          color: 'purple',
          articles: []
        }
      ]
      
      setLists(mockLists)
    } catch (error) {
      console.error('Error loading reading lists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!newList.name.trim()) return
    
    try {
      const list: ReadingList = {
        id: Date.now().toString(),
        name: newList.name,
        description: newList.description,
        isPublic: newList.isPublic,
        articlesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: newList.tags.split(',').map(t => t.trim()).filter(Boolean),
        color: newList.color,
        articles: []
      }
      
      setLists([list, ...lists])
      setNewList({ name: '', description: '', isPublic: false, color: 'blue', tags: '' })
      setShowNewListForm(false)
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      setLists(lists.filter(list => list.id !== listId))
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      purple: 'border-purple-200 bg-purple-50',
      red: 'border-red-200 bg-red-50',
      orange: 'border-orange-200 bg-orange-50',
      yellow: 'border-yellow-200 bg-yellow-50'
    }
    return colorMap[color] || colorMap.blue
  }

  const filteredLists = lists
    .filter(list => {
      const matchesSearch = list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           list.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      switch (filterBy) {
        case 'mine': return matchesSearch && !list.collaborators
        case 'shared': return matchesSearch && list.collaborators
        case 'public': return matchesSearch && list.isPublic
        default: return matchesSearch
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'size': return b.articlesCount - a.articlesCount
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Reading Lists
          </CardTitle>
          <CardDescription>Loading your reading lists...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Reading Lists ({lists.length})
          </CardTitle>
          {showCreateForm && (
            <Button onClick={() => setShowNewListForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          )}
        </div>
        <CardDescription>
          Organize your articles into curated reading lists
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reading lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortDesc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('size')}>
                List Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterBy('all')}>
                All Lists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('mine')}>
                My Lists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('shared')}>
                Shared Lists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('public')}>
                Public Lists
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* New List Form */}
        {showNewListForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create New Reading List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="List name"
                  value={newList.name}
                  onChange={(e) => setNewList({...newList, name: e.target.value})}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newList.description}
                  onChange={(e) => setNewList({...newList, description: e.target.value})}
                  className="min-h-[60px]"
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={newList.tags}
                  onChange={(e) => setNewList({...newList, tags: e.target.value})}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={newList.isPublic}
                    onChange={(e) => setNewList({...newList, isPublic: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="public" className="text-sm">Make public</label>
                </div>
                
                <div className="flex gap-1">
                  {['blue', 'green', 'purple', 'red', 'orange', 'yellow'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewList({...newList, color})}
                      className={cn(
                        "w-6 h-6 rounded-full border-2",
                        newList.color === color ? 'border-gray-800' : 'border-gray-300',
                        `bg-${color}-200`
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateList} size="sm">
                  Create List
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewListForm(false)} 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reading Lists */}
        <div className="space-y-4">
          {filteredLists.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No reading lists found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first reading list to get started'}
              </p>
              {!searchQuery && showCreateForm && (
                <Button onClick={() => setShowNewListForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Reading List
                </Button>
              )}
            </div>
          ) : (
            filteredLists.map((list) => (
              <Card key={list.id} className={cn("border-l-4", getColorClasses(list.color))}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{list.name}</h3>
                        {list.isPublic ? (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        {list.collaborators && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      
                      {list.description && (
                        <p className="text-sm text-muted-foreground mb-3">{list.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {list.articlesCount} articles
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Updated {new Date(list.updatedAt).toLocaleDateString()}
                        </span>
                        {list.collaborators && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {list.collaborators.length} collaborators
                          </span>
                        )}
                      </div>
                      
                      {list.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {list.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Articles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit List
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="h-4 w-4 mr-2" />
                          Share List
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteList(list.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Recent Articles Preview */}
                  {list.articles.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="font-medium text-sm mb-3">Recent Articles</h4>
                      <div className="space-y-2">
                        {list.articles.slice(0, 2).map((article) => (
                          <Link
                            key={article.id}
                            href={`/articles/${article.slug}`}
                            className="block p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                           >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm line-clamp-1">{article.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {article.author} • {article.readingTime}m read
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-2">
                                {article.isRead && (
                                  <Badge variant="outline" className="text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Read
                                  </Badge>
                                )}
                                {article.rating && (
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span className="text-xs ml-1">{article.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {list.articles.length > 2 && (
                          <div className="text-center">
                            <Button variant="ghost" size="sm" className="text-xs">
                              View all {list.articlesCount} articles
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}