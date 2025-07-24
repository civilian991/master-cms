"use client"

import { useState, useEffect } from 'react'
import { ModernInput, ModernTextarea, ModernSelect } from '@/components/ui/modern-input'
import { ModernFormLayout, ModernFieldGroup, ModernFormGrid, ModernMultiStepForm } from '@/components/ui/modern-form'
import { LoadingButton, SkeletonForm } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Settings,
  User,
  Hash,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

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
  status: string
  publishedAt: string
  metaDescriptionEn: string
  metaDescriptionAr: string
  featuredImage: string
}

// Mock data
const mockCategories = [
  { value: '1', label: 'Technology / التكنولوجيا' },
  { value: '2', label: 'Development / التطوير' },
  { value: '3', label: 'Design / التصميم' },
  { value: '4', label: 'Business / الأعمال' }
]

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'Under Review' },
  { value: 'PUBLISHED', label: 'Published' }
]

const mockTags = [
  { id: '1', name: 'React' },
  { id: '2', name: 'Next.js' },
  { id: '3', name: 'TypeScript' },
  { id: '4', name: 'Performance' },
  { id: '5', name: 'UI/UX' }
]

export default function ModernArticleFormDemo() {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('en')
  const [loading, setLoading] = useState(false)
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
    publishedAt: '',
    metaDescriptionEn: '',
    metaDescriptionAr: '',
    featuredImage: ''
  })
  const [formState, setFormState] = useState<{
    loading: boolean
    error: string
    success: string
  }>({
    loading: false,
    error: '',
    success: ''
  })

  // Auto-generate slug from English title
  const handleTitleChange = (value: string, language: 'en' | 'ar') => {
    const newData = {
      ...formData,
      [`title${language === 'en' ? 'En' : 'Ar'}`]: value
    }
    
    if (language === 'en') {
      newData.slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    
    setFormData(newData)
  }

  const updateField = (field: keyof ArticleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({ loading: true, error: '', success: '' })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate success
    setFormState({ 
      loading: false, 
      error: '', 
      success: 'Article created successfully!' 
    })

    // Clear success message after 3 seconds
    setTimeout(() => {
      setFormState(prev => ({ ...prev, success: '' }))
    }, 3000)
  }

  // Multi-step form configuration
  const formSteps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter the basic article details',
      component: ({ data, onChange }: any) => (
        <div className="space-y-6">
          {/* Language Toggle */}
          <Card className="border-0 shadow-soft bg-gradient-subtle">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-heading text-gray-900">Content Language</h3>
                    <p className="text-caption text-gray-600">Switch between languages</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={activeLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('en')}
                    className="shadow-soft"
                  >
                    English
                  </Button>
                  <Button
                    type="button"
                    variant={activeLanguage === 'ar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveLanguage('ar')}
                    className="shadow-soft"
                  >
                    العربية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <ModernFieldGroup
            title="Title & URL"
            description="Enter the article title and URL slug"
          >
            <ModernInput
              variant="floating"
              label={activeLanguage === 'en' ? 'Title (English)' : 'Title (Arabic)'}
              placeholder={activeLanguage === 'en' ? 'Enter article title...' : 'أدخل عنوان المقال...'}
              value={activeLanguage === 'en' ? data.titleEn : data.titleAr}
              onChange={(e) => handleTitleChange(e.target.value, activeLanguage)}
              leftIcon={BookOpen}
            />

            {activeLanguage === 'en' && (
              <ModernInput
                variant="floating"
                label="URL Slug"
                placeholder="article-url-slug"
                value={data.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                leftIcon={LinkIcon}
                hint={`URL: /articles/${data.slug || 'article-url-slug'}`}
              />
            )}
          </ModernFieldGroup>

          <ModernFieldGroup
            title="Excerpt"
            description="Brief description of the article"
          >
            <ModernTextarea
              variant="floating"
              label={activeLanguage === 'en' ? 'Excerpt (English)' : 'Excerpt (Arabic)'}
              placeholder={activeLanguage === 'en' ? 'Brief description...' : 'وصف مختصر...'}
              value={activeLanguage === 'en' ? data.excerptEn : data.excerptAr}
              onChange={(e) => updateField(
                activeLanguage === 'en' ? 'excerptEn' : 'excerptAr', 
                e.target.value
              )}
              resize={false}
            />
          </ModernFieldGroup>
        </div>
      )
    },
    {
      id: 'content',
      title: 'Article Content',
      description: 'Write your article content',
      component: ({ data, onChange }: any) => (
        <div className="space-y-6">
          <ModernFieldGroup
            title="Main Content"
            description="Write your article content using the rich text editor"
          >
            <div className="space-y-4">
              <div className="bg-white rounded-lg border-2 border-gray-200 focus-within:border-brand-500 focus-within:ring-brand-500/20 transition-all duration-200 shadow-soft">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-caption font-medium text-gray-700">
                      {activeLanguage === 'en' ? 'Article Content (English)' : 'Article Content (Arabic)'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <ModernTextarea
                    placeholder={activeLanguage === 'en' ? 'Write your article content here...' : 'اكتب محتوى المقال هنا...'}
                    value={activeLanguage === 'en' ? data.contentEn : data.contentAr}
                    onChange={(e) => updateField(
                      activeLanguage === 'en' ? 'contentEn' : 'contentAr', 
                      e.target.value
                    )}
                    className="min-h-[300px] border-0 shadow-none"
                  />
                </div>
              </div>
            </div>
          </ModernFieldGroup>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Publication Settings',
      description: 'Configure publication and SEO settings',
      component: ({ data, onChange }: any) => (
        <div className="space-y-6">
          <ModernFieldGroup
            title="Publication Details"
            description="Set the publication status and category"
          >
            <ModernFormGrid>
              <ModernSelect
                variant="floating"
                label="Status"
                options={statusOptions}
                value={data.status}
                onChange={(value) => updateField('status', value)}
              />
              <ModernSelect
                variant="floating"
                label="Category"
                placeholder="Select category"
                options={mockCategories}
                value={data.categoryId}
                onChange={(value) => updateField('categoryId', value)}
              />
            </ModernFormGrid>

            <ModernInput
              variant="floating"
              label="Publish Date"
              type="datetime-local"
              value={data.publishedAt}
              onChange={(e) => updateField('publishedAt', e.target.value)}
              leftIcon={Calendar}
            />
          </ModernFieldGroup>

          <ModernFieldGroup
            title="SEO Settings"
            description="Optimize your article for search engines"
          >
            <ModernTextarea
              variant="floating"
              label={activeLanguage === 'en' ? 'Meta Description (English)' : 'Meta Description (Arabic)'}
              placeholder={activeLanguage === 'en' ? 'SEO description...' : 'وصف محرك البحث...'}
              value={activeLanguage === 'en' ? data.metaDescriptionEn : data.metaDescriptionAr}
              onChange={(e) => updateField(
                activeLanguage === 'en' ? 'metaDescriptionEn' : 'metaDescriptionAr', 
                e.target.value
              )}
              hint="Recommended length: 150-160 characters"
              resize={false}
            />
          </ModernFieldGroup>

          <ModernFieldGroup
            title="Tags"
            description="Add relevant tags to your article"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {mockTags.map(tag => (
                  <label 
                    key={tag.id} 
                    className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-soft"
                  >
                    <input
                      type="checkbox"
                      checked={data.tags.includes(tag.id)}
                      onChange={(e) => {
                        const newTags = e.target.checked
                          ? [...data.tags, tag.id]
                          : data.tags.filter((id: string) => id !== tag.id)
                        updateField('tags', newTags)
                      }}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-caption text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
              
              {data.tags.length > 0 && (
                <div>
                  <p className="text-caption font-medium text-gray-700 mb-2">Selected Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tagId: string) => {
                      const tag = mockTags.find(t => t.id === tagId)
                      return tag ? (
                        <Badge 
                          key={tagId} 
                          variant="secondary" 
                          className="bg-brand-50 text-brand-700 border-brand-200"
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </ModernFieldGroup>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-25 animate-[fadeIn_0.5s_ease-out]">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between animate-[slideInDown_0.6s_ease-out]">
          <div className="flex items-center gap-4">
            <Link href="/admin/content/articles">
              <Button 
                variant="outline" 
                size="sm"
                className="shadow-soft hover:shadow-medium transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Articles
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-display text-gray-900">Create New Article</h1>
              <p className="text-body text-gray-600">Modern article creation with enhanced UX</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LoadingButton
              variant="outline"
              onClick={() => console.log('Preview')}
              disabled={!formData.titleEn}
              className="shadow-soft hover:shadow-medium"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </LoadingButton>
            <LoadingButton
              variant="outline"
              onClick={() => console.log('Save Draft')}
              className="shadow-soft hover:shadow-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </LoadingButton>
            <LoadingButton
              onClick={() => console.log('Publish')}
              disabled={!formData.titleEn || !formData.contentEn}
              className="bg-gradient-brand shadow-soft hover:shadow-medium"
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </LoadingButton>
          </div>
        </div>

        {/* Multi-Step Form */}
        <div className="animate-[slideInUp_0.8s_ease-out]">
          <ModernMultiStepForm
            title="Article Creation Wizard"
            description="Follow these steps to create a professional article"
            steps={formSteps}
            autoSave={true}
            autoSaveInterval={10000}
            onAutoSave={(data) => console.log('Auto-saving:', data)}
            onSubmit={(data) => console.log('Final submit:', data)}
            loading={formState.loading}
            error={formState.error}
            success={formState.success}
          />
        </div>

        {/* Alternative: Single Form Layout */}
        <div className="animate-[slideInUp_1s_ease-out]">
          <Card className="border-0 shadow-soft bg-gradient-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-heading">Alternative: Single Form Layout</CardTitle>
                  <p className="text-body text-gray-600 mt-1">
                    Traditional form approach with modern styling
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-body text-gray-600">
                  The multi-step form above demonstrates the modern approach.
                  Switch to single-form layout by replacing ModernMultiStepForm with ModernFormLayout.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 