'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Music,
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Edit, 
  Eye,
  FolderOpen,
  Grid,
  List,
  Calendar,
  User,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: number
  url: string
  thumbnail?: string
  uploadedBy: string
  uploadedAt: string
  tags: string[]
  altText?: string
  caption?: string
  category: string
  dimensions?: { width: number; height: number }
  duration?: number
}

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'hero-banner.jpg',
    type: 'image',
    size: 2048576,
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200',
    uploadedBy: 'John Smith',
    uploadedAt: '2024-01-15T10:30:00Z',
    tags: ['hero', 'banner', 'homepage'],
    altText: 'Modern office workspace',
    caption: 'A beautiful modern office workspace for the homepage hero section',
    category: 'banners',
    dimensions: { width: 1920, height: 1080 }
  },
  {
    id: '2',
    name: 'product-demo.mp4',
    type: 'video',
    size: 15728640,
    url: '/videos/product-demo.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200',
    uploadedBy: 'Sarah Johnson',
    uploadedAt: '2024-01-14T14:20:00Z',
    tags: ['product', 'demo', 'tutorial'],
    caption: 'Product demonstration video',
    category: 'videos',
    dimensions: { width: 1280, height: 720 },
    duration: 180
  },
  {
    id: '3',
    name: 'brand-guidelines.pdf',
    type: 'document',
    size: 3145728,
    url: '/documents/brand-guidelines.pdf',
    uploadedBy: 'Michael Chen',
    uploadedAt: '2024-01-13T09:15:00Z',
    tags: ['brand', 'guidelines', 'design'],
    caption: 'Official brand guidelines document',
    category: 'documents'
  },
  {
    id: '4',
    name: 'podcast-intro.mp3',
    type: 'audio',
    size: 1048576,
    url: '/audio/podcast-intro.mp3',
    uploadedBy: 'Emma Wilson',
    uploadedAt: '2024-01-12T16:45:00Z',
    tags: ['podcast', 'intro', 'audio'],
    caption: 'Podcast intro music',
    category: 'audio',
    duration: 30
  },
  {
    id: '5',
    name: 'team-photo.jpg',
    type: 'image',
    size: 1572864,
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200',
    uploadedBy: 'John Smith',
    uploadedAt: '2024-01-11T11:30:00Z',
    tags: ['team', 'about', 'people'],
    altText: 'Company team photo',
    caption: 'Our amazing team working together',
    category: 'team',
    dimensions: { width: 1600, height: 1200 }
  }
]

const typeIcons = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText
}

const typeColors = {
  image: 'bg-green-100 text-green-800',
  video: 'bg-blue-100 text-blue-800',
  audio: 'bg-purple-100 text-purple-800',
  document: 'bg-orange-100 text-orange-800'
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AdminMediaPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)

  const filteredFiles = mockMediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === 'all' || file.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
    
    return matchesSearch && matchesType && matchesCategory
  })

  const categories = [...new Set(mockMediaFiles.map(file => file.category))]

  const handleSelectAll = (checked: boolean) => {
    setSelectedFiles(checked ? filteredFiles.map(file => file.id) : [])
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    )
  }

  const totalSize = mockMediaFiles.reduce((sum, file) => sum + file.size, 0)
  const usedStorage = formatFileSize(totalSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-2">Manage your files, images, and media assets</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{mockMediaFiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Image className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Images</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockMediaFiles.filter(f => f.type === 'image').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Videos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockMediaFiles.filter(f => f.type === 'video').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{usedStorage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files by name or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {selectedFiles.length} file(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Tags
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Media Files ({filteredFiles.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFiles.map((file) => {
                const TypeIcon = typeIcons[file.type]
                
                return (
                  <div
                    key={file.id}
                    className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                        className="rounded bg-white bg-opacity-80"
                      />
                    </div>

                    {/* File Preview */}
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {file.type === 'image' && file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.altText || file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <TypeIcon className="h-12 w-12 text-gray-400" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate flex-1">
                          {file.name}
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={typeColors[file.type]}>
                            {file.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </span>
                        </div>

                        {file.dimensions && (
                          <div className="text-xs text-gray-500">
                            {file.dimensions.width} × {file.dimensions.height}
                          </div>
                        )}

                        {file.duration && (
                          <div className="text-xs text-gray-500">
                            Duration: {formatDuration(file.duration)}
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          By {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>

                        {file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {file.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {file.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{file.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">File</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Uploaded</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => {
                    const TypeIcon = typeIcons[file.type]
                    
                    return (
                      <tr key={file.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              {file.type === 'image' && file.thumbnail ? (
                                <img
                                  src={file.thumbnail}
                                  alt={file.altText || file.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <TypeIcon className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{file.name}</div>
                              <div className="text-sm text-gray-500">{file.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={typeColors[file.type]}>
                            {file.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">{formatFileSize(file.size)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-500">
                            <div>{new Date(file.uploadedAt).toLocaleDateString()}</div>
                            <div>by {file.uploadedBy}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                  <p className="text-gray-500">
                    {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first file to get started'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload images, videos, documents, and audio files to your media library.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drag & Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drag & drop files here
                </h3>
                <p className="text-gray-500 mb-4">
                  or click to browse and select files
                </p>
                <Button>
                  Choose Files
                </Button>
              </div>

              {/* File Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <Input placeholder="Enter tags separated by commas" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (for images)
                </label>
                <Input placeholder="Describe the image for accessibility" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <Input placeholder="Optional caption or description" />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </Button>
                <Button>
                  Upload Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 