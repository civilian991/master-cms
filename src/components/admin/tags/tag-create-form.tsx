'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { SaveIcon, TagIcon } from 'lucide-react'

interface TagFormData {
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  slug: string
  color: string
  isActive: boolean
}

export const TagCreateForm: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<'en' | 'ar'>('en')
  
  const [formData, setFormData] = useState<TagFormData>({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    slug: '',
    color: '#3b82f6',
    isActive: true,
  })

  const handleInputChange = (field: keyof TagFormData, value: any) => {
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
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/tags')
      } else {
        throw new Error(data.error || 'Failed to create tag')
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag')
    } finally {
      setLoading(false)
    }
  }

  const colorOptions = [
    '#3b82f6', '#ef4444', '#f97316', '#eab308', 
    '#22c55e', '#8b5cf6', '#ec4899', '#6b7280'
  ]

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
            {loading ? 'Creating...' : 'Create Tag'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TagIcon className="w-5 h-5 mr-2" />
                Tag Details
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
                  placeholder={`Enter tag name in ${currentLocale === 'en' ? 'English' : 'Arabic'}`}
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
                  placeholder={`Enter tag description in ${currentLocale === 'en' ? 'English' : 'Arabic'}`}
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
                  placeholder="tag-url-slug"
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

          {/* Color */}
          <Card>
            <CardHeader>
              <CardTitle>Tag Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-12 h-12 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-color">Custom Color</Label>
                  <Input
                    id="custom-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 