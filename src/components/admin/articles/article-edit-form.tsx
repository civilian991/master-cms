'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from '@/components/ui/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TagIcon, FolderIcon, ImageIcon, SaveIcon, SendIcon, TrashIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ArticleEditFormProps {
  articleId: string
}

interface Category {
  id: string
  name: string
  nameEn: string
  nameAr: string
}

interface Tag {
  id: string
  name: string
  nameEn: string
  nameAr: string
}

interface ArticleFormData {
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  excerptEn: string
  excerptAr: string
  categoryId: string
  tagIds: string[]
  featuredImage?: string
  seoTitleEn: string
  seoTitleAr: string
  seoDescriptionEn: string
  seoDescriptionAr: string
  seoKeywordsEn: string
  seoKeywordsAr: string
  scheduledAt?: Date
  expiresAt?: Date
  isActive: boolean
  isFeatured: boolean
  allowComments: boolean
  status: string
}

export const ArticleEditForm: React.FC<ArticleEditFormProps> = ({ articleId }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentLocale, setCurrentLocale] = useState<'en' | 'ar'>('en')
  
  const [formData, setFormData] = useState<ArticleFormData>({
    titleEn: '',
    titleAr: '',
    contentEn: '',
    contentAr: '',
    excerptEn: '',
    excerptAr: '',
    categoryId: '',
    tagIds: [],
    seoTitleEn: '',
    seoTitleAr: '',
    seoDescriptionEn: '',
    seoDescriptionAr: '',
    seoKeywordsEn: '',
    seoKeywordsAr: '',
    isActive: true,
    isFeatured: false,
    allowComments: true,
    status: 'DRAFT',
  })

  useEffect(() => {
    loadArticle()
    loadCategories()
    loadTags()
  }, [articleId])

  const loadArticle = async () => {
    try {
      const response = await fetch(`/api/content/articles/${articleId}`)
      const data = await response.json()
      if (data.success) {
        const article = data.article
        setFormData({
          titleEn: article.titleEn || '',
          titleAr: article.titleAr || '',
          contentEn: article.contentEn || '',
          contentAr: article.contentAr || '',
          excerptEn: article.excerptEn || '',
          excerptAr: article.excerptAr || '',
          categoryId: article.categoryId || '',
          tagIds: article.tags?.map((tag: any) => tag.id) || [],
          featuredImage: article.featuredImage || '',
          seoTitleEn: article.seoTitleEn || '',
          seoTitleAr: article.seoTitleAr || '',
          seoDescriptionEn: article.seoDescriptionEn || '',
          seoDescriptionAr: article.seoDescriptionAr || '',
          seoKeywordsEn: article.seoKeywordsEn || '',
          seoKeywordsAr: article.seoKeywordsAr || '',
          scheduledAt: article.scheduledAt ? new Date(article.scheduledAt) : undefined,
          expiresAt: article.expiresAt ? new Date(article.expiresAt) : undefined,
          isActive: article.isActive ?? true,
          isFeatured: article.isFeatured ?? false,
          allowComments: article.allowComments ?? true,
          status: article.status || 'DRAFT',
        })
        setSelectedTags(article.tags?.map((tag: any) => tag.id) || [])
      }
    } catch (error) {
      console.error('Error loading article:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setTags(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const handleInputChange = (field: keyof ArticleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
      
      handleInputChange('tagIds', newTags)
      return newTags
    })
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    try {
      const articleData = {
        ...formData,
        status: status.toUpperCase(),
        tagIds: selectedTags,
      }

      const response = await fetch(`/api/content/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/articles')
      } else {
        throw new Error(data.error || 'Failed to update article')
      }
    } catch (error) {
      console.error('Error updating article:', error)
      alert('Failed to update article')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/content/articles/${articleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/articles')
      } else {
        throw new Error(data.error || 'Failed to delete article')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading article...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={currentLocale === 'en' ? 'default' : 'outline'}
            onClick={() => setCurrentLocale('en')}
          >
            English
          </Button>
          <Button
            variant={currentLocale === 'ar' ? 'default' : 'outline'}
            onClick={() => setCurrentLocale('ar')}
          >
            العربية
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            <SendIcon className="w-4 h-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge variant={formData.status === 'PUBLISHED' ? 'default' : 'secondary'}>
          {formData.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor={`title-${currentLocale}`}>
                  Title ({currentLocale === 'en' ? 'English' : 'Arabic'}) *
                </Label>
                <Input
                  id={`title-${currentLocale}`}
                  value={currentLocale === 'en' ? formData.titleEn : formData.titleAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'titleEn' : 'titleAr', 
                    e.target.value
                  )}
                  placeholder={`Enter article title in ${currentLocale === 'en' ? 'English' : 'Arabic'}`}
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <Label>Content ({currentLocale === 'en' ? 'English' : 'Arabic'}) *</Label>
                <TiptapEditor
                  content={currentLocale === 'en' ? formData.contentEn : formData.contentAr}
                  onChange={(content) => handleInputChange(
                    currentLocale === 'en' ? 'contentEn' : 'contentAr',
                    content
                  )}
                  placeholder={`Edit your article content in ${currentLocale === 'en' ? 'English' : 'Arabic'}...`}
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor={`excerpt-${currentLocale}`}>
                  Excerpt ({currentLocale === 'en' ? 'English' : 'Arabic'})
                </Label>
                <Textarea
                  id={`excerpt-${currentLocale}`}
                  value={currentLocale === 'en' ? formData.excerptEn : formData.excerptAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'excerptEn' : 'excerptAr',
                    e.target.value
                  )}
                  placeholder="Brief description of the article"
                  rows={3}
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SEO Title ({currentLocale === 'en' ? 'English' : 'Arabic'})</Label>
                <Input
                  value={currentLocale === 'en' ? formData.seoTitleEn : formData.seoTitleAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'seoTitleEn' : 'seoTitleAr',
                    e.target.value
                  )}
                  placeholder="SEO optimized title"
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label>SEO Description ({currentLocale === 'en' ? 'English' : 'Arabic'})</Label>
                <Textarea
                  value={currentLocale === 'en' ? formData.seoDescriptionEn : formData.seoDescriptionAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'seoDescriptionEn' : 'seoDescriptionAr',
                    e.target.value
                  )}
                  placeholder="SEO meta description"
                  rows={2}
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label>SEO Keywords ({currentLocale === 'en' ? 'English' : 'Arabic'})</Label>
                <Input
                  value={currentLocale === 'en' ? formData.seoKeywordsEn : formData.seoKeywordsAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'seoKeywordsEn' : 'seoKeywordsAr',
                    e.target.value
                  )}
                  placeholder="Comma-separated keywords"
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch
                  id="featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="comments">Allow Comments</Label>
                <Switch
                  id="comments"
                  checked={formData.allowComments}
                  onCheckedChange={(checked) => handleInputChange('allowComments', checked)}
                />
              </div>

              {/* Schedule Publishing */}
              <div className="space-y-2">
                <Label>Schedule Publishing</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduledAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduledAt ? format(formData.scheduledAt, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledAt}
                      onSelect={(date) => handleInputChange('scheduledAt', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderIcon className="w-4 h-4 mr-2" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {currentLocale === 'en' ? category.nameEn : category.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TagIcon className="w-4 h-4 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId)
                    if (!tag) return null
                    return (
                      <Badge key={tagId} variant="secondary" className="cursor-pointer" onClick={() => handleTagToggle(tagId)}>
                        {currentLocale === 'en' ? tag.nameEn : tag.nameAr}
                        <span className="ml-1">×</span>
                      </Badge>
                    )
                  })}
                </div>
                
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={cn(
                        "p-2 cursor-pointer rounded hover:bg-gray-100",
                        selectedTags.includes(tag.id) && "bg-blue-50 text-blue-600"
                      )}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {currentLocale === 'en' ? tag.nameEn : tag.nameAr}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  value={formData.featuredImage || ''}
                  onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                  placeholder="Image URL or upload"
                />
                <Button variant="outline" className="w-full">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                {formData.featuredImage && (
                  <div className="mt-2">
                    <img
                      src={formData.featuredImage}
                      alt="Featured image preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 