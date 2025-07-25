'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Tag, Hash, Eye } from 'lucide-react'

interface TagType {
  id: string
  nameEn: string
  nameAr?: string
  slug: string
  color?: string
  articleCount: number
  viewCount: number
}

export default function TagsManagement() {
  const [tags, setTags] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { loadTags() }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tags?siteId=default&includeEmpty=true')
      if (res.ok) {
        const result = await res.json()
        if (result.success) setTags(result.data)
      }
    } catch (err) {
      console.error('Error loading tags:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tag: TagType) => {
    if (tag.articleCount > 0) {
      alert('Cannot delete tag with articles.')
      return
    }
    if (!confirm(`Delete "${tag.nameEn}"?`)) return
    try {
      const res = await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' })
      if (res.ok) loadTags()
      else alert('Failed to delete tag')
    } catch (err) {
      console.error('Error deleting tag:', err)
      alert('Failed to delete tag')
    }
  }

  const filtered = tags.filter(t =>
    t.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-6">Loading tags...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-gray-600 mt-2">Create and manage tags to categorize your content</p>
        </div>
        <Link href="/admin/tags/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </Link>
      </div>
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
            <div className="text-2xl font-bold">{tags.filter(t => t.articleCount > 0).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.reduce((sum, t) => sum + t.articleCount, 0)}</div>
          </CardContent>
        </Card>
      </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Manage your content tags and their properties</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tags found</p>
              <Link href="/admin/tags/new">
                <Button variant="outline" className="mt-2">Create your first tag</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(tag => (
                <div key={tag.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <Badge style={{ backgroundColor: tag.color || '#3B82F6' }} className="text-white">
                      #{tag.nameEn}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Link href={`/admin/tags/${tag.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tag)} disabled={tag.articleCount > 0}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{tag.nameEn}</h3>
                      {tag.nameAr && <p className="text-sm text-gray-500" dir="rtl">{tag.nameAr}</p>}
                    </div>
                    {tag.descriptionEn && <p className="text-sm text-gray-600 line-clamp-2">{tag.descriptionEn}</p>}
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
    </div>
  )
}
