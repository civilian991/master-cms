'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Hash,
  MoreHorizontal,
  Eye,
  Palette
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Tag {
  id: string
  nameEn: string
  nameAr?: string
  slug: string
  descriptionEn?: string
  descriptionAr?: string
  color?: string
  articleCount: number
  viewCount: number
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  createdAt: string
  updatedAt: string
}

const colorOptions = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
]

export default function TagsManagement() {
  const { data: session } = useSession()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    color: colorOptions[0],
    seoTitleEn: '',
    seoTitleAr: '',
    seoDescriptionEn: '',
    seoDescriptionAr: ''
  })

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tags?siteId=default&includeEmpty=true')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTags(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    try {
      const slug = formData.nameEn.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()

      const tagData = {
        ...formData,
        slug,
        siteId: 'default'
      }

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadTags()
          setIsCreateDialogOpen(false)
          resetForm()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create tag')
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag')
    }
  }

  const handleEditTag = async () => {
    if (!editingTag) return

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadTags()
        setEditingTag(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update tag')
      }
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Failed to update tag')
    }
  }

  const handleDeleteTag = async (tag: Tag) => {
    if (tag.articleCount > 0) {
      alert('Cannot delete tag with articles. Please remove from articles first.')
      return
    }

    if (!confirm(`Are you sure you want to delete "${tag.nameEn}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTags()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete tag')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      color: colorOptions[0],
      seoTitleEn: '',
      seoTitleAr: '',
      seoDescriptionEn: '',
      seoDescriptionAr: ''
    })
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      nameEn: tag.nameEn,
      nameAr: tag.nameAr || '',
      descriptionEn: tag.descriptionEn || '',
      descriptionAr: tag.descriptionAr || '',
      color: tag.color || colorOptions[0],
      seoTitleEn: tag.seoTitleEn || '',
      seoTitleAr: tag.seoTitleAr || '',
      seoDescriptionEn: tag.seoDescriptionEn || '',
      seoDescriptionAr: tag.seoDescriptionAr || ''
    })
  }

  const filteredTags = tags.filter(tag =>
    tag.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const TagForm = ({ onSubmit, submitLabel }: { onSubmit: () => void, submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameEn">Tag Name (English) *</Label>
          <Input
            id="nameEn"
            value={formData.nameEn}
            onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
            placeholder="Technology"
            required
          />
        </div>
        <div>
          <Label htmlFor="nameAr">Tag Name (Arabic)</Label>
          <Input
            id="nameAr"
            value={formData.nameAr}
            onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
            placeholder="التكنولوجيا"
            dir="rtl"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="color">Tag Color</Label>
        <div className="flex items-center space-x-2 mt-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 ${
                formData.color === color ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="descriptionEn">Description (English)</Label>
          <Textarea
            id="descriptionEn"
            value={formData.descriptionEn}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
            placeholder="Articles about technology and innovation"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="descriptionAr">Description (Arabic)</Label>
          <Textarea
            id="descriptionAr"
            value={formData.descriptionAr}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
            placeholder="مقالات حول التكنولوجيا والابتكار"
            rows={3}
            dir="rtl"
          />
        </div>
      </div>

      {/* SEO Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">SEO Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="seoTitleEn">SEO Title (English)</Label>
            <Input
              id="seoTitleEn"
              value={formData.seoTitleEn}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitleEn: e.target.value }))}
              placeholder="Technology Articles and News"
            />
          </div>
          <div>
            <Label htmlFor="seoTitleAr">SEO Title (Arabic)</Label>
            <Input
              id="seoTitleAr"
              value={formData.seoTitleAr}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitleAr: e.target.value }))}
              placeholder="مقالات وأخبار التكنولوجيا"
              dir="rtl"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="seoDescriptionEn">SEO Description (English)</Label>
            <Textarea
              id="seoDescriptionEn"
              value={formData.seoDescriptionEn}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescriptionEn: e.target.value }))}
              placeholder="Explore technology articles, reviews, and insights"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="seoDescriptionAr">SEO Description (Arabic)</Label>
            <Textarea
              id="seoDescriptionAr"
              value={formData.seoDescriptionAr}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescriptionAr: e.target.value }))}
              placeholder="استكشف مقالات التكنولوجيا والمراجعات والرؤى"
              rows={2}
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            setIsCreateDialogOpen(false)
            setEditingTag(null)
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tags Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading tags...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage tags to categorize your content
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to organize and categorize your content
              </DialogDescription>
            </DialogHeader>
            <TagForm onSubmit={handleCreateTag} submitLabel="Create Tag" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tags</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(tag => tag.articleCount > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.reduce((sum, tag) => sum + tag.articleCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Manage your content tags and their properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTags.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tags found</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create your first tag
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      style={{ backgroundColor: tag.color || colorOptions[0] }}
                      className="text-white"
                    >
                      #{tag.nameEn}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={tag.articleCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{tag.nameEn}</h3>
                      {tag.nameAr && (
                        <p className="text-sm text-gray-500" dir="rtl">{tag.nameAr}</p>
                      )}
                    </div>
                    
                    {tag.descriptionEn && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {tag.descriptionEn}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>/{tag.slug}</span>
                      <div className="flex items-center space-x-2">
                        <span>{tag.articleCount} articles</span>
                        <span>{tag.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => {
        if (!open) {
          setEditingTag(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update tag information and settings
            </DialogDescription>
          </DialogHeader>
          <TagForm onSubmit={handleEditTag} submitLabel="Update Tag" />
        </DialogContent>
      </Dialog>
    </div>
  )
} 