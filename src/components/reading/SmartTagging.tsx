'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { 
  Tag, 
  Brain, 
  Plus,
  X,
  Search,
  Sparkles,
  TrendingUp,
  Hash,
  Target,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartTag {
  id: string
  name: string
  confidence: number
  category: 'topic' | 'entity' | 'sentiment' | 'concept' | 'industry'
  description?: string
  trending?: boolean
  relatedCount?: number
}

interface SmartTaggingProps {
  articleId: string
  content: string
  title: string
  existingTags?: string[]
  onTagsUpdate?: (tags: string[]) => void
  className?: string
}

export function SmartTagging({
  articleId,
  content,
  title,
  existingTags = [],
  onTagsUpdate,
  className
}: SmartTaggingProps) {
  const [suggestedTags, setSuggestedTags] = useState<SmartTag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags)
  const [customTag, setCustomTag] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    generateSmartTags()
  }, [articleId])

  const generateSmartTags = async () => {
    setIsLoading(true)
    setIsGenerating(true)
    try {
      // Mock AI tag generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockTags: SmartTag[] = [
        {
          id: '1',
          name: 'Artificial Intelligence',
          confidence: 0.95,
          category: 'topic',
          description: 'Core AI technology and applications',
          trending: true,
          relatedCount: 342
        },
        {
          id: '2',
          name: 'Media Production',
          confidence: 0.88,
          category: 'industry',
          description: 'Content creation and media workflows',
          relatedCount: 156
        },
        {
          id: '3',
          name: 'Automation',
          confidence: 0.82,
          category: 'concept',
          description: 'Process automation and efficiency',
          trending: true,
          relatedCount: 234
        },
        {
          id: '4',
          name: 'Creative Technology',
          confidence: 0.79,
          category: 'topic',
          description: 'Technology enhancing creative processes',
          relatedCount: 89
        },
        {
          id: '5',
          name: 'Future Trends',
          confidence: 0.75,
          category: 'concept',
          description: 'Emerging trends and predictions',
          relatedCount: 167
        },
        {
          id: '6',
          name: 'Innovation',
          confidence: 0.71,
          category: 'sentiment',
          description: 'Innovation and forward-thinking',
          trending: true,
          relatedCount: 445
        },
        {
          id: '7',
          name: 'Content Creation',
          confidence: 0.68,
          category: 'topic',
          description: 'Digital content creation processes',
          relatedCount: 298
        },
        {
          id: '8',
          name: 'Machine Learning',
          confidence: 0.65,
          category: 'entity',
          description: 'ML algorithms and applications',
          relatedCount: 567
        }
      ]
      
      setSuggestedTags(mockTags)
    } catch (error) {
      console.error('Error generating smart tags:', error)
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  const handleTagSelect = (tag: SmartTag) => {
    if (!selectedTags.includes(tag.name)) {
      const newTags = [...selectedTags, tag.name]
      setSelectedTags(newTags)
      onTagsUpdate?.(newTags)
    }
  }

  const handleTagRemove = (tagName: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagName)
    setSelectedTags(newTags)
    onTagsUpdate?.(newTags)
  }

  const handleCustomTagAdd = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      const newTags = [...selectedTags, customTag.trim()]
      setSelectedTags(newTags)
      onTagsUpdate?.(newTags)
      setCustomTag('')
    }
  }

  const getCategoryIcon = (category: SmartTag['category']) => {
    switch (category) {
      case 'topic': return <Hash className="h-3 w-3" />
      case 'entity': return <Target className="h-3 w-3" />
      case 'sentiment': return <TrendingUp className="h-3 w-3" />
      case 'concept': return <Brain className="h-3 w-3" />
      case 'industry': return <Zap className="h-3 w-3" />
      default: return <Tag className="h-3 w-3" />
    }
  }

  const getCategoryColor = (category: SmartTag['category']) => {
    switch (category) {
      case 'topic': return 'border-blue-200 bg-blue-50 text-blue-700'
      case 'entity': return 'border-green-200 bg-green-50 text-green-700'
      case 'sentiment': return 'border-purple-200 bg-purple-50 text-purple-700'
      case 'concept': return 'border-orange-200 bg-orange-50 text-orange-700'
      case 'industry': return 'border-red-200 bg-red-50 text-red-700'
      default: return 'border-gray-200 bg-gray-50 text-gray-700'
    }
  }

  const filteredTags = suggestedTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Tagging
          </CardTitle>
          <CardDescription>
            Analyzing content for intelligent tag suggestions...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
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
            Smart Tagging
            {isGenerating && <Clock className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSmartTags}
            disabled={isGenerating}
          >
            <Brain className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
        <CardDescription>
          AI-powered content analysis and tag suggestions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Applied Tags ({selectedTags.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Suggested Tags
          </h4>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suggested tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Suggested Tags */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                selectedTags.includes(tag.name) && "bg-muted border-primary/50",
                getCategoryColor(tag.category)
              )}
              onClick={() => handleTagSelect(tag)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(tag.category)}
                  <span className="font-medium text-sm">{tag.name}</span>
                  {tag.trending && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      <TrendingUp className="h-2.5 w-2.5 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{Math.round(tag.confidence * 100)}%</span>
                  {tag.relatedCount && (
                    <span>• {tag.relatedCount} articles</span>
                  )}
                </div>
              </div>
              
              {selectedTags.includes(tag.name) ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Plus className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Custom Tag Input */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Tag
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomTagAdd()}
              className="flex-1"
            />
            <Button
              onClick={handleCustomTagAdd}
              disabled={!customTag.trim() || selectedTags.includes(customTag.trim())}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tag Categories Legend */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-semibold text-sm">Tag Categories</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-blue-600" />
              <span>Topic</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-green-600" />
              <span>Entity</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span>Sentiment</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3 text-orange-600" />
              <span>Concept</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-red-600" />
              <span>Industry</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}