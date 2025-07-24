'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Filter, 
  X, 
  Search,
  Calendar,
  User,
  Tag,
  Clock,
  TrendingUp,
  Star,
  Globe,
  Zap,
  Target,
  Settings,
  RefreshCw,
  CheckCircle,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FilterCriteria {
  categories: string[]
  tags: string[]
  authors: string[]
  languages: string[]
  dateRange: {
    start?: string
    end?: string
    preset?: 'today' | 'week' | 'month' | 'year' | 'all'
  }
  readingTime: [number, number] // min, max in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all'
  contentType: ('article' | 'tutorial' | 'news' | 'analysis' | 'opinion')[]
  sortBy: 'latest' | 'trending' | 'popular' | 'recommended' | 'reading-time'
  showRead: boolean
  showBookmarked: boolean
  minRating: number
}

interface ContentFilterProps {
  onFiltersChange: (filters: FilterCriteria) => void
  activeFiltersCount?: number
  totalArticles?: number
  filteredCount?: number
  className?: string
}

export function ContentFilter({
  onFiltersChange,
  activeFiltersCount = 0,
  totalArticles = 1250,
  filteredCount = 89,
  className
}: ContentFilterProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    categories: [],
    tags: [],
    authors: [],
    languages: [],
    dateRange: { preset: 'all' },
    readingTime: [1, 60],
    difficulty: 'all',
    contentType: ['article', 'tutorial', 'news', 'analysis', 'opinion'],
    sortBy: 'latest',
    showRead: true,
    showBookmarked: true,
    minRating: 1
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  // Mock data
  const availableCategories = [
    { id: 'security', name: 'Cybersecurity', count: 342 },
    { id: 'ai', name: 'Artificial Intelligence', count: 189 },
    { id: 'blockchain', name: 'Blockchain', count: 156 },
    { id: 'cloud', name: 'Cloud Computing', count: 223 },
    { id: 'mobile', name: 'Mobile Development', count: 167 },
    { id: 'web', name: 'Web Development', count: 298 },
    { id: 'data', name: 'Data Science', count: 134 },
    { id: 'devops', name: 'DevOps', count: 178 }
  ]

  const popularTags = [
    { name: 'Machine Learning', count: 89 },
    { name: 'Python', count: 156 },
    { name: 'JavaScript', count: 234 },
    { name: 'React', count: 145 },
    { name: 'Docker', count: 98 },
    { name: 'Kubernetes', count: 76 },
    { name: 'AWS', count: 134 },
    { name: 'Security', count: 201 }
  ]

  const topAuthors = [
    { id: '1', name: 'Alex Chen', articles: 23 },
    { id: '2', name: 'Maria Rodriguez', articles: 18 },
    { id: '3', name: 'David Kim', articles: 31 },
    { id: '4', name: 'Sarah Johnson', articles: 15 }
  ]

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', count: 1024 },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', count: 89 },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', count: 76 },
    { code: 'fr', name: 'French', flag: '🇫🇷', count: 45 },
    { code: 'de', name: 'German', flag: '🇩🇪', count: 38 }
  ]

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterChange = <K extends keyof FilterCriteria>(
    key: K,
    value: FilterCriteria[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = <K extends keyof FilterCriteria>(
    key: K,
    value: string
  ) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    handleFilterChange(key, newArray as FilterCriteria[K])
  }

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      authors: [],
      languages: [],
      dateRange: { preset: 'all' },
      readingTime: [1, 60],
      difficulty: 'all',
      contentType: ['article', 'tutorial', 'news', 'analysis', 'opinion'],
      sortBy: 'latest',
      showRead: true,
      showBookmarked: true,
      minRating: 1
    })
    setSearchQuery('')
  }

  const getPresetDateRange = (preset: string) => {
    const now = new Date()
    switch (preset) {
      case 'today':
        return 'Today'
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      case 'year':
        return 'This Year'
      default:
        return 'All Time'
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-5 w-5" />
            Content Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
        <CardDescription>
          Customize your content discovery with intelligent filtering
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search and Quick Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles, authors, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Sort by:</span>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => handleFilterChange('sortBy', value as FilterCriteria['sortBy'])}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Latest
                  </div>
                </SelectItem>
                <SelectItem value="trending">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    Popular
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    Recommended
                  </div>
                </SelectItem>
                <SelectItem value="reading-time">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Reading Time
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Filters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            {/* Categories */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Categories</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={filters.categories.includes(category.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('categories', category.id)}
                    className="text-xs"
                  >
                    {category.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Content Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'article', name: 'Articles', icon: <BookOpen className="h-3 w-3" /> },
                  { id: 'tutorial', name: 'Tutorials', icon: <Target className="h-3 w-3" /> },
                  { id: 'news', name: 'News', icon: <Globe className="h-3 w-3" /> },
                  { id: 'analysis', name: 'Analysis', icon: <TrendingUp className="h-3 w-3" /> }
                ].map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={filters.contentType.includes(type.id as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('contentType', [...filters.contentType, type.id as any])
                        } else {
                          handleFilterChange('contentType', filters.contentType.filter(t => t !== type.id))
                        }
                      }}
                    />
                    <label htmlFor={type.id} className="text-sm flex items-center gap-2 cursor-pointer">
                      {type.icon}
                      {type.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading Time */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Reading Time: {filters.readingTime[0]}-{filters.readingTime[1]} minutes
              </label>
              <Slider
                value={filters.readingTime}
                onValueChange={(value) => handleFilterChange('readingTime', value as [number, number])}
                max={60}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Published Date</label>
              <Select 
                value={filters.dateRange.preset || 'all'}
                onValueChange={(value) => handleFilterChange('dateRange', { preset: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            {/* Authors */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Authors</label>
              <div className="space-y-2">
                {topAuthors.map((author) => (
                  <div key={author.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`author-${author.id}`}
                      checked={filters.authors.includes(author.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('authors', [...filters.authors, author.id])
                        } else {
                          handleFilterChange('authors', filters.authors.filter(a => a !== author.id))
                        }
                      }}
                    />
                    <label htmlFor={`author-${author.id}`} className="text-sm flex items-center justify-between flex-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {author.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {author.articles} articles
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Languages</label>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang.code}`}
                      checked={filters.languages.includes(lang.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('languages', [...filters.languages, lang.code])
                        } else {
                          handleFilterChange('languages', filters.languages.filter(l => l !== lang.code))
                        }
                      }}
                    />
                    <label htmlFor={`lang-${lang.code}`} className="text-sm flex items-center justify-between flex-1 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        {lang.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {lang.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Popular Tags</label>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Button
                    key={tag.name}
                    variant={filters.tags.includes(tag.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('tags', tag.name)}
                    className="text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.name}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {tag.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Difficulty Level</label>
              <Select 
                value={filters.difficulty}
                onValueChange={(value) => handleFilterChange('difficulty', value as FilterCriteria['difficulty'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Minimum Rating: {filters.minRating} stars
              </label>
              <Slider
                value={[filters.minRating]}
                onValueChange={(value) => handleFilterChange('minRating', value[0])}
                max={5}
                min={1}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Read Status */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Reading Status</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Show read articles
                  </span>
                  <Switch
                    checked={filters.showRead}
                    onCheckedChange={(checked) => handleFilterChange('showRead', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Show bookmarked articles
                  </span>
                  <Switch
                    checked={filters.showBookmarked}
                    onCheckedChange={(checked) => handleFilterChange('showBookmarked', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Filter Summary */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Showing {filteredCount.toLocaleString()} of {totalArticles.toLocaleString()} articles</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AI Personalized
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}