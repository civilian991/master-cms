'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModernInput, ModernTextarea, ModernSelect } from '@/components/ui/modern-input'
import { ModernFormLayout, ModernFieldGroup, ModernFormGrid } from '@/components/ui/modern-form'
import { LoadingButton, SkeletonForm } from '@/components/ui/skeleton'
import { TiptapEditorClient } from '@/components/ui/tiptap-editor-client'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Send,
  Calendar,
  Image,
  Tag,
  FileText,
  Globe,
  Clock,
  BookOpen,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/image-upload'

interface ArticleFormData {
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  excerptEn: string
  excerptAr: string
  slug: string
  categoryId: string
  tags: string[]
  featured: boolean
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED'
  publishedAt: string | null
  metaDescriptionEn: string
  metaDescriptionAr: string
  featuredImage: string
}

const mockCategories = [
  { id: '1', name: 'Technology', nameAr: 'التكنولوجيا' },
  { id: '2', name: 'Development', nameAr: 'التطوير' },
  { id: '3', name: 'Design', nameAr: 'التصميم' },
  { id: '4', name: 'Business', nameAr: 'الأعمال' }
]

const mockTags = [
  { id: '1', name: 'React', nameAr: 'ريآكت' },
  { id: '2', name: 'Next.js', nameAr: 'نكست.جي إس' },
  { id: '3', name: 'TypeScript', nameAr: 'تايب سكريبت' },
  { id: '4', name: 'Performance', nameAr: 'الأداء' },
  { id: '5', name: 'UI/UX', nameAr: 'واجهة المستخدم' }
]

export default function NewArticlePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('en')
  
  const [formData, setFormData] = useState<ArticleFormData>({
    titleEn: '',
    titleAr: '',
    contentEn: '',
    contentAr: '',
    excerptEn: '',
    excerptAr: '',
    slug: '',
    categoryId: '',
    tags: [],
    featured: false,
    status: 'DRAFT',
    publishedAt: null,
    metaDescriptionEn: '',
    metaDescriptionAr: '',
    featuredImage: ''
  })

  // Load categories and tags from API
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        // Load categories
        const categoriesResponse = await fetch('/api/categories?siteId=default')
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json()
          if (categoriesResult.success) {
            setCategories(categoriesResult.data)
          }
        }

        // Load tags  
        const tagsResponse = await fetch('/api/tags?siteId=default')
        if (tagsResponse.ok) {
          const tagsResult = await tagsResponse.json()
          if (tagsResult.success) {
            setTags(tagsResult.data)
          }
        }
      } catch (error) {
        console.error('Error loading categories/tags:', error)
        // Keep mock data as fallback
      }
    }

    loadCategoriesAndTags()
  }, [])

  // Auto-generate slug from English title
  const handleTitleChange = (value: string, language: 'en' | 'ar') => {
    setFormData(prev => ({
      ...prev,
      [`title${language === 'en' ? 'En' : 'Ar'}`]: value,
      ...(language === 'en' && { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })
    }))
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }))
  }

  const handleSave = async (action: 'save' | 'preview' | 'publish') => {
    setIsLoading(true)
    
    try {
      // Validate required fields
      if (!formData.titleEn.trim()) {
        throw new Error('English title is required')
      }
      if (!formData.contentEn.trim()) {
        throw new Error('English content is required')
      }
      if (!session?.user) {
        throw new Error('You must be logged in to create articles')
      }

      const payload = {
        titleEn: formData.titleEn,
        titleAr: formData.titleAr || undefined,
        contentEn: formData.contentEn,
        contentAr: formData.contentAr || undefined,
        excerptEn: formData.excerptEn || undefined,
        excerptAr: formData.excerptAr || undefined,
        featuredImage: formData.featuredImage || undefined,
        status: action === 'publish' ? 'PUBLISHED' : 'DRAFT',
        published: action === 'publish',
        publishedAt: action === 'publish' ? new Date().toISOString() : undefined,
        scheduledAt: formData.publishedAt || undefined,
        authorId: (session.user as any)?.id || session.user.email,
        categoryId: formData.categoryId || undefined,
        tagIds: formData.tags.length > 0 ? formData.tags : undefined,
        siteId: 'default', // TODO: Get from site config
        seoTitleEn: formData.metaTitle || undefined,
        seoDescriptionEn: formData.metaDescription || undefined,
        workflowState: action === 'publish' ? 'PUBLISHED' : 'DRAFT'
      }

      console.log('Creating article:', payload)

      // Call the actual API
      const response = await fetch('/api/content/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create article`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create article')
      }

      const article = result.data

      if (action === 'preview') {
        // Open preview in new tab - using the article slug or ID
        const previewUrl = `/articles/${article.slug || article.id}?preview=true`
        window.open(previewUrl, '_blank')
      } else {
        // Redirect to the article list or edit page
        if (action === 'publish') {
          router.push(`/admin/content/articles?created=${article.id}&published=true`)
        } else {
          router.push(`/admin/content/articles/${article.id}?created=true`)
        }
      }
    } catch (error) {
      console.error('Error saving article:', error)
      // You might want to show a toast or error message here
      alert(error instanceof Error ? error.message : 'Failed to save article')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/content/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Article</h1>
            <p className="text-gray-600 mt-2">Write and publish a new article</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => handleSave('preview')}
            disabled={isLoading || !formData.titleEn}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSave('save')}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('publish')}
            disabled={isLoading || !formData.titleEn || !formData.contentEn}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Language Selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle>Content Language</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={activeLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={activeLanguage === 'ar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('ar')}
                  >
                    العربية
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Title and Slug */}
          <Card>
            <CardHeader>
              <CardTitle>Title & URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">
                  {activeLanguage === 'en' ? 'Title (English)' : 'Title (Arabic)'}
                </Label>
                <Input
                  id="title"
                  value={activeLanguage === 'en' ? formData.titleEn : formData.titleAr}
                  onChange={(e) => handleTitleChange(e.target.value, activeLanguage)}
                  placeholder={activeLanguage === 'en' ? 'Enter article title...' : 'أدخل عنوان المقال...'}
                  dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}
                  className={activeLanguage === 'ar' ? 'text-right' : ''}
                />
              </div>

              {activeLanguage === 'en' && (
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="article-url-slug"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    URL: /articles/{formData.slug || 'article-url-slug'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="excerpt">
                  {activeLanguage === 'en' ? 'Excerpt (English)' : 'Excerpt (Arabic)'}
                </Label>
                <Textarea
                  id="excerpt"
                  value={activeLanguage === 'en' ? formData.excerptEn : formData.excerptAr}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    [activeLanguage === 'en' ? 'excerptEn' : 'excerptAr']: e.target.value 
                  }))}
                  placeholder={activeLanguage === 'en' ? 'Brief description...' : 'وصف مختصر...'}
                  rows={3}
                  dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}
                  className={activeLanguage === 'ar' ? 'text-right' : ''}
                />
              </div>

              <div>
                <Label htmlFor="content">
                  {activeLanguage === 'en' ? 'Article Content (English)' : 'Article Content (Arabic)'}
                </Label>
                <TiptapEditorClient
                  content={activeLanguage === 'en' ? formData.contentEn : formData.contentAr}
                  onChange={(content) => setFormData(prev => ({ 
                    ...prev, 
                    [activeLanguage === 'en' ? 'contentEn' : 'contentAr']: content 
                  }))}
                  placeholder={activeLanguage === 'en' ? 'Write your article content here...' : 'اكتب محتوى المقال هنا...'}
                  dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}
                  className="min-h-[400px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Publish Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Under Review</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                />
                <Label htmlFor="featured">Featured Article</Label>
              </div>

              <div>
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input
                  id="publishDate"
                  type="datetime-local"
                  value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Category</option>
                {mockCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} / {category.nameAr}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockTags.map(tag => (
                  <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <span className="text-sm">
                      {tag.name} / {tag.nameAr}
                    </span>
                  </label>
                ))}
              </div>
              
              {formData.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map(tagId => {
                      const tag = mockTags.find(t => t.id === tagId)
                      return tag ? (
                        <Badge key={tagId} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ImageUpload
                  value={formData.featuredImage}
                  onChange={(url) => setFormData(prev => ({ ...prev, featuredImage: url }))}
                  placeholder="Upload featured image..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 