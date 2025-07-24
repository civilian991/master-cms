'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Progress } from './progress'
import { Image, Upload, X, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ImageUploadProps {
  value?: string
  onChange: (imageUrl: string) => void
  onRemove?: () => void
  placeholder?: string
  className?: string
  maxSizeKB?: number
  allowedTypes?: string[]
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  placeholder = 'Upload an image...',
  className = '',
  maxSizeKB = 5120, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploadProps) {
  const { data: session } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      setError(`File too large. Maximum size: ${maxSizeKB / 1024}MB`)
      return
    }

    // Validate user session
    if (!session?.user) {
      setError('You must be logged in to upload images')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', file.name)
      formData.append('fileType', file.type)
      formData.append('fileSize', file.size.toString())
      formData.append('siteId', 'default') // TODO: Get from site config
      formData.append('uploadedBy', (session.user as any).id || session.user.email || 'unknown')
      formData.append('category', 'featured-images')

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      // Upload to API
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      if (result.success && result.data?.url) {
        onChange(result.data.url)
        setUploadProgress(0)
      } else {
        throw new Error('Upload succeeded but no URL returned')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    } else {
      onChange('')
    }
    setError(null)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      {!value && (
        <Button 
          type="button"
          variant="outline" 
          className="w-full h-32 border-dashed border-2 hover:border-primary/50"
          onClick={triggerFileSelect}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Upload className="h-6 w-6 animate-pulse" />
            ) : (
              <Image className="h-6 w-6" />
            )}
            <span className="text-sm">
              {isUploading ? 'Uploading...' : placeholder}
            </span>
            {!isUploading && (
              <span className="text-xs text-muted-foreground">
                Max {maxSizeKB / 1024}MB • {allowedTypes.map(t => t.split('/')[1]).join(', ')}
              </span>
            )}
          </div>
        </Button>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-2 pt-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {value && !isUploading && (
        <div className="relative group">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
            <img 
              src={value} 
              alt="Uploaded image" 
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load image')}
            />
          </div>
          
          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Replace button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={triggerFileSelect}
          >
            <Upload className="h-4 w-4 mr-1" />
            Replace
          </Button>
        </div>
      )}

      {/* Manual URL Input */}
      {!value && !isUploading && (
        <div className="text-center">
          <span className="text-sm text-muted-foreground">or</span>
          <div className="mt-2">
            <input
              type="url"
              placeholder="Enter image URL..."
              className="w-full px-3 py-2 border rounded-md text-sm"
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  onChange(e.target.value.trim())
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement
                  if (target.value.trim()) {
                    onChange(target.value.trim())
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function for validating image URLs
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(parsed.pathname);
  } catch {
    return false
  }
} 