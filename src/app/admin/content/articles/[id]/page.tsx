'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TiptapEditorClient } from '@/components/ui/tiptap-editor-client'
import { ImageUpload } from '@/components/ui/image-upload'
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
  Trash2,
  History,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface ArticleFormData {
  id: string
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
  createdAt: string
  updatedAt: string
  authorId: string
  views: number
}

interface EditArticlePageProps {
  params: { id: string }
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

// Mock function to get article data
async function getArticle(id: string): Promise<ArticleFormData | null> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock data - replace with real API call
  return {
    id,
    titleEn: 'Getting Started with Next.js 15',
    titleAr: 'البدء مع Next.js 15',
    contentEn: `Next.js 15 introduces several exciting new features that make building React applications even more powerful and efficient. In this comprehensive guide, we'll explore the key improvements and how to leverage them in your projects.

## What's New in Next.js 15

The latest version of Next.js brings significant improvements to performance, developer experience, and deployment capabilities. Here are the highlights:

### 1. Enhanced App Router
The App Router has been further refined with better performance and new features that make routing more intuitive.

### 2. Improved Static Generation
Static site generation has been optimized for better build times and smaller bundle sizes.

### 3. Better Developer Experience
Enhanced error messages, improved hot reloading, and better TypeScript support make development smoother.

## Getting Started

To get started with Next.js 15, you can create a new project using:

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

This will set up a new Next.js 15 project with all the latest features enabled by default.`,
    contentAr: `يقدم Next.js 15 عدة ميزات جديدة مثيرة تجعل بناء تطبيقات React أكثر قوة وكفاءة. في هذا الدليل الشامل، سنستكشف التحسينات الرئيسية وكيفية الاستفادة منها في مشاريعك.

## ما الجديد في Next.js 15

يجلب الإصدار الأحدث من Next.js تحسينات كبيرة في الأداء وتجربة المطور وقدرات النشر. إليك النقاط البارزة:

### 1. App Router المحسن
تم تحسين App Router أكثر مع أداء أفضل وميزات جديدة تجعل التوجيه أكثر سهولة.

### 2. Static Generation محسن
تم تحسين إنشاء المواقع الثابتة لأوقات بناء أفضل وأحجام حزم أصغر.

### 3. تجربة مطور أفضل
رسائل خطأ محسنة، وإعادة تحميل ساخن محسن، ودعم أفضل لـ TypeScript يجعل التطوير أكثر سلاسة.`,
    excerptEn: 'Learn the fundamentals of Next.js 15 and its new features that enhance React development.',
    excerptAr: 'تعلم أساسيات Next.js 15 وميزاته الجديدة التي تعزز تطوير React.',
    slug: 'getting-started-nextjs-15',
    categoryId: '1',
    tags: ['1', '2', '3'],
    featured: true,
    status: 'PUBLISHED',
    publishedAt: '2024-01-15T10:00:00Z',
    metaDescriptionEn: 'Complete guide to Next.js 15 features and improvements for React developers.',
    metaDescriptionAr: 'دليل شامل لميزات وتحسينات Next.js 15 لمطوري React.',
    featuredImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    authorId: 'user1',
    views: 1245
  }
}

export default function EditArticlePage({ params: { id } }: EditArticlePageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('en')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const [formData, setFormData] = useState<ArticleFormData | null>(null)

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const article = await getArticle(id)
        setFormData(article)
      } catch (error) {
        console.error('Error loading article:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadArticle()
  }, [id])

  const handleSave = async (action: 'save' | 'preview' | 'publish') => {
    if (!formData) return
    
    setIsSaving(true)
    
    try {
      const payload = {
        ...formData,
        status: action === 'publish' ? 'PUBLISHED' : formData.status,
        publishedAt: action === 'publish' ? new Date().toISOString() : formData.publishedAt,
        updatedAt: new Date().toISOString()
      }

      // TODO: Replace with actual API call
      console.log('Updating article:', payload)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (action === 'preview') {
        window.open(`/preview/articles/${formData.slug}`, '_blank')
      } else {
        router.push('/admin/content/articles')
      }
    } catch (error) {
      console.error('Error saving article:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!formData) return
    
    try {
      // TODO: Replace with actual API call
      console.log('Deleting article:', formData.id)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push('/admin/content/articles')
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!formData) return
    
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleTagToggle = (tagId: string) => {
    if (!formData) return
    
    setFormData(prev => prev ? {
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    } : null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h2>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been deleted.</p>
          <Link href="/admin/content/articles">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Button>
          </Link>
        </div>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Article</h1>
            <p className="text-gray-600 mt-2">
              {formData.titleEn} • Created {new Date(formData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave('preview')}
            disabled={isSaving}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSave('save')}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button 
            onClick={() => handleSave('publish')}
            disabled={isSaving}
          >
            <Send className="h-4 w-4 mr-2" />
            {formData.status === 'PUBLISHED' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>
      {/* Article Info Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Badge variant={formData.status === 'PUBLISHED' ? 'default' : formData.status === 'DRAFT' ? 'secondary' : 'outline'}>
                  {formData.status}
                </Badge>
                {formData.featured && <Badge variant="outline">Featured</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                Views: {formData.views.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(formData.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Article
            </Button>
          </div>
        </CardContent>
      </Card>
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
                  onChange={(e) => handleInputChange(
                    activeLanguage === 'en' ? 'titleEn' : 'titleAr', 
                    e.target.value
                  )}
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
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    URL: /articles/{formData.slug}
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
                  onChange={(e) => handleInputChange(
                    activeLanguage === 'en' ? 'excerptEn' : 'excerptAr',
                    e.target.value
                  )}
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
                  onChange={(content) => handleInputChange(
                    activeLanguage === 'en' ? 'contentEn' : 'contentAr',
                    content
                  )}
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
                  onChange={(e) => handleInputChange('status', e.target.value)}
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
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                />
                <Label htmlFor="featured">Featured Article</Label>
              </div>

              <div>
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input
                  id="publishDate"
                  type="datetime-local"
                  value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('publishedAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
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
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
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
                  onChange={(url) => handleInputChange('featuredImage', url)}
                  placeholder="Upload featured image..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Delete Article
              </CardTitle>
              <CardDescription>
                Are you sure you want to delete this article? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 