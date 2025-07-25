'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
  Folder,
  FolderOpen,
  MoreHorizontal,
  Eye,
  Settings
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Category {
  id: string
  nameEn: string
  nameAr?: string
  slug: string
  descriptionEn?: string
  descriptionAr?: string
  parentId?: string
  articleCount: number
  viewCount: number
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  createdAt: string
  updatedAt: string
  children?: Category[]
  parent?: Category
}

export default function CategoriesManagement() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    parentId: '',
    seoTitleEn: '',
    seoTitleAr: '',
    seoDescriptionEn: '',
    seoDescriptionAr: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?siteId=default&includeEmpty=true')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCategories(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      const slug = formData.nameEn.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()

      const categoryData = {
        ...formData,
        slug,
        siteId: 'default',
        parentId: formData.parentId || undefined
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadCategories()
          setIsCreateDialogOpen(false)
          resetForm()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadCategories()
        setEditingCategory(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category')
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (category.articleCount > 0) {
      alert('Cannot delete category with articles. Please move articles to another category first.')
      return
    }

    if (!confirm(`Are you sure you want to delete "${category.nameEn}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      parentId: '',
      seoTitleEn: '',
      seoTitleAr: '',
      seoDescriptionEn: '',
      seoDescriptionAr: ''
    })
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      nameEn: category.nameEn,
      nameAr: category.nameAr || '',
      descriptionEn: category.descriptionEn || '',
      descriptionAr: category.descriptionAr || '',
      parentId: category.parentId || '',
      seoTitleEn: category.seoTitleEn || '',
      seoTitleAr: category.seoTitleAr || '',
      seoDescriptionEn: category.seoDescriptionEn || '',
      seoDescriptionAr: category.seoDescriptionAr || ''
    })
  }

  const filteredCategories = categories.filter(category =>
    category.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const CategoryForm = ({ onSubmit, submitLabel }: { onSubmit: () => void, submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameEn">Category Name (English) *</Label>
          <Input
            id="nameEn"
            value={formData.nameEn}
            onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
            placeholder="Technology"
            required
          />
        </div>
        <div>
          <Label htmlFor="nameAr">Category Name (Arabic)</Label>
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
        <Label htmlFor="parentId">Parent Category</Label>
        <select
          id="parentId"
          value={formData.parentId}
          onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">No Parent (Top Level)</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="descriptionEn">Description (English)</Label>
          <Textarea
            id="descriptionEn"
            value={formData.descriptionEn}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
            placeholder="Technology articles and news"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="descriptionAr">Description (Arabic)</Label>
          <Textarea
            id="descriptionAr"
            value={formData.descriptionAr}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
            placeholder="مقالات وأخبار التكنولوجيا"
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
              placeholder="Technology News and Articles"
            />
          </div>
          <div>
            <Label htmlFor="seoTitleAr">SEO Title (Arabic)</Label>
            <Input
              id="seoTitleAr"
              value={formData.seoTitleAr}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitleAr: e.target.value }))}
              placeholder="أخبار ومقالات التكنولوجيا"
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
              placeholder="Latest technology news, reviews, and insights"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="seoDescriptionAr">SEO Description (Arabic)</Label>
            <Textarea
              id="seoDescriptionAr"
              value={formData.seoDescriptionAr}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescriptionAr: e.target.value }))}
              placeholder="آخر أخبار التكنولوجيا والمراجعات والرؤى"
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
            setEditingCategory(null)
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
          <h1 className="text-3xl font-bold">Categories Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-gray-600 mt-2">
            Organize your content with categories and subcategories
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/categories/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </Link>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your content
              </DialogDescription>
            </DialogHeader>
            <CategoryForm onSubmit={handleCreateCategory} submitLabel="Create Category" />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Level Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(cat => !cat.parentId).length}
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
              {categories.reduce((sum, cat) => sum + cat.articleCount, 0)}
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
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your content categories and their hierarchical structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No categories found</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create your first category
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Folder className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{category.nameEn}</h3>
                          {category.nameAr && (
                            <span className="text-sm text-gray-500">({category.nameAr})</span>
                          )}
                          {category.parent && (
                            <Badge variant="outline" className="text-xs">
                              {category.parent.nameEn}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>/{category.slug}</span>
                          <span>{category.articleCount} articles</span>
                          <span>{category.viewCount} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={category.articleCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setEditingCategory(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information and settings
            </DialogDescription>
          </DialogHeader>
          <CategoryForm onSubmit={handleEditCategory} submitLabel="Update Category" />
        </DialogContent>
      </Dialog>
    </div>
  )
} 