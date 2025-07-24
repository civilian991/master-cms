'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConfiguration } from '../config/ConfigurationProvider'

interface ArticleEditorProps {
  articleId?: string
  initialData?: any
  onSave?: (article: any) => void
  onCancel?: () => void
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  articleId,
  initialData,
  onSave,
  onCancel,
}) => {
  const router = useRouter()
  const { config } = useConfiguration()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState({
    titleEn: '',
    titleAr: '',
    contentEn: '',
    contentAr: '',
    excerptEn: '',
    excerptAr: '',
    categoryId: '',
    tagIds: [] as string[],
    templateId: '',
    seoTitleEn: '',
    seoTitleAr: '',
    seoDescriptionEn: '',
    seoDescriptionAr: '',
    seoKeywordsEn: '',
    seoKeywordsAr: '',
    scheduledAt: '',
    expiresAt: '',
    ...initialData,
  })

  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => {
    if (initialData) {
      setArticle(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  useEffect(() => {
    loadCategories()
    loadTags()
    loadTemplates()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/categories?siteId=${config.siteId}`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await fetch(`/api/tags?siteId=${config.siteId}`)
      const data = await response.json()
      if (data.success) {
        setTags(data.data)
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/content/templates?siteId=${config.siteId}`)
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setArticle(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (status: 'draft' | 'publish' = 'draft') => {
    setSaving(true)
    try {
      const articleData = {
        ...article,
        siteId: config.siteId,
        status: status === 'publish' ? 'PUBLISHED' : 'DRAFT',
      }

      const url = articleId ? `/api/content/articles/${articleId}` : '/api/content/articles'
      const method = articleId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      const data = await response.json()

      if (data.success) {
        if (onSave) {
          onSave(data.data)
        } else {
          router.push('/admin/content/articles')
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!articleId) {
      alert('Please save the article first before submitting for review')
      return
    }

    try {
      const response = await fetch('/api/content/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          action: 'submit_for_review',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Article submitted for review')
        router.push('/admin/content/articles')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error submitting for review:', error)
      alert('Failed to submit for review')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {articleId ? 'Edit Article' : 'Create New Article'}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => onCancel?.()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('publish')}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
            {articleId && (
              <button
                onClick={handleSubmitForReview}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Submit for Review
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (English) *
              </label>
              <input
                type="text"
                value={article.titleEn}
                onChange={(e) => handleInputChange('titleEn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter article title in English"
              />
            </div>

            {config.features?.multilingual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Arabic)
                </label>
                <input
                  type="text"
                  value={article.titleAr}
                  onChange={(e) => handleInputChange('titleAr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter article title in Arabic"
                  dir="rtl"
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (English) *
              </label>
              <textarea
                value={article.contentEn}
                onChange={(e) => handleInputChange('contentEn', e.target.value)}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter article content in English"
              />
            </div>

            {config.features?.multilingual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (Arabic)
                </label>
                <textarea
                  value={article.contentAr}
                  onChange={(e) => handleInputChange('contentAr', e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter article content in Arabic"
                  dir="rtl"
                />
              </div>
            )}

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt (English)
              </label>
              <textarea
                value={article.excerptEn}
                onChange={(e) => handleInputChange('excerptEn', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter article excerpt in English"
              />
            </div>

            {config.features?.multilingual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt (Arabic)
                </label>
                <textarea
                  value={article.excerptAr}
                  onChange={(e) => handleInputChange('excerptAr', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter article excerpt in Arabic"
                  dir="rtl"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={article.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <select
                multiple
                value={article.tagIds}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                  handleInputChange('tagIds', selectedOptions)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={article.templateId}
                onChange={(e) => handleInputChange('templateId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Publish
              </label>
              <input
                type="datetime-local"
                value={article.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires At
              </label>
              <input
                type="datetime-local"
                value={article.expiresAt}
                onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* SEO Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title (English)
                  </label>
                  <input
                    type="text"
                    value={article.seoTitleEn}
                    onChange={(e) => handleInputChange('seoTitleEn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO title for English"
                  />
                </div>

                {config.features?.multilingual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title (Arabic)
                    </label>
                    <input
                      type="text"
                      value={article.seoTitleAr}
                      onChange={(e) => handleInputChange('seoTitleAr', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO title for Arabic"
                      dir="rtl"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description (English)
                  </label>
                  <textarea
                    value={article.seoDescriptionEn}
                    onChange={(e) => handleInputChange('seoDescriptionEn', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO description for English"
                  />
                </div>

                {config.features?.multilingual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description (Arabic)
                    </label>
                    <textarea
                      value={article.seoDescriptionAr}
                      onChange={(e) => handleInputChange('seoDescriptionAr', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO description for Arabic"
                      dir="rtl"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords (English)
                  </label>
                  <input
                    type="text"
                    value={article.seoKeywordsEn}
                    onChange={(e) => handleInputChange('seoKeywordsEn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Keywords separated by commas"
                  />
                </div>

                {config.features?.multilingual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Keywords (Arabic)
                    </label>
                    <input
                      type="text"
                      value={article.seoKeywordsAr}
                      onChange={(e) => handleInputChange('seoKeywordsAr', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Keywords separated by commas"
                      dir="rtl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}