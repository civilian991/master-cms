'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { SaveIcon, FolderIcon } from 'lucide-react'
import { useConfiguration } from '@/components/config/ConfigurationProvider'

interface CategoryFormData {
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  slug: string
  isActive: boolean
  parentId?: string
}

export const CategoryCreateForm: React.FC = () => {
  const router = useRouter()
  const { config } = useConfiguration()
  const [loading, setLoading] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<'en' | 'ar'>('en')
  
  const [formData, setFormData] = useState<CategoryFormData>({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    slug: '',
    isActive: true,
  })

  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from English name
    if (field === 'nameEn' && value) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const categoryData = {
        ...formData,
        siteId: config.siteId,
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/categories')
      } else {
        throw new Error(data.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.nameEn}
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderIcon className="w-5 h-5 mr-2" />
                Category Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor={`name-${currentLocale}`}>
                  Name ({currentLocale === 'en' ? 'English' : 'Arabic'}) *
                </Label>
                <Input
                  id={`name-${currentLocale}`}
                  value={currentLocale === 'en' ? formData.nameEn : formData.nameAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'nameEn' : 'nameAr', 
                    e.target.value
                  )}
                  placeholder={`Enter category name in ${currentLocale === 'en' ? 'English' : 'Arabic'}`}
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor={`description-${currentLocale}`}>
                  Description ({currentLocale === 'en' ? 'English' : 'Arabic'})
                </Label>
                <Textarea
                  id={`description-${currentLocale}`}
                  value={currentLocale === 'en' ? formData.descriptionEn : formData.descriptionAr}
                  onChange={(e) => handleInputChange(
                    currentLocale === 'en' ? 'descriptionEn' : 'descriptionAr',
                    e.target.value
                  )}
                  placeholder={`Enter category description in ${currentLocale === 'en' ? 'English' : 'Arabic'}`}
                  rows={3}
                  dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="category-url-slug"
                />
                <p className="text-sm text-muted-foreground">
                  This will be used in the URL. Automatically generated from English name.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 