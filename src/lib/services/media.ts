import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

// Media validation schemas
export const mediaUploadSchema = z.object({
  file: z.any(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  altTextEn: z.string().optional(),
  altTextAr: z.string().optional(),
  captionEn: z.string().optional(),
  captionAr: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  siteId: z.string(),
  uploadedBy: z.string(),
})

export const mediaUpdateSchema = mediaUploadSchema.partial().omit({ file: true })

export interface MediaOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  resize?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface MediaSearchFilters {
  fileType?: string[]
  category?: string
  tags?: string[]
  uploadedBy?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  siteId?: string
}

export class MediaManagementService {
  private static instance: MediaManagementService
  private uploadDir: string

  private constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads'
  }

  public static getInstance(): MediaManagementService {
    if (!MediaManagementService.instance) {
      MediaManagementService.instance = new MediaManagementService()
    }
    return MediaManagementService.instance
  }

  // Media Upload and Processing
  async uploadMedia(data: z.infer<typeof mediaUploadSchema>): Promise<any> {
    const validatedData = mediaUploadSchema.parse(data)
    
    // Create upload directory if it doesn't exist
    await this.ensureUploadDirectory()
    
    // Generate unique filename
    const uniqueFileName = this.generateUniqueFileName(validatedData.fileName)
    const filePath = join(this.uploadDir, uniqueFileName)
    
    // Save original file
    await writeFile(filePath, validatedData.file)
    
    // Process and optimize image if it's an image
    const optimizedPaths = await this.optimizeImage(filePath, uniqueFileName)
    
    // Create media record
    const media = await prisma.media.create({
      data: {
        fileName: uniqueFileName,
        originalName: validatedData.fileName,
        filePath,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        mimeType: this.getMimeType(validatedData.fileType),
        altTextEn: validatedData.altTextEn,
        altTextAr: validatedData.altTextAr,
        captionEn: validatedData.captionEn,
        captionAr: validatedData.captionAr,
        category: validatedData.category,
        optimizedPaths,
        uploadedBy: validatedData.uploadedBy,
        siteId: validatedData.siteId,
        isActive: true,
      },
      include: {
        uploadedByUser: true,
        site: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Add tags if provided
    if (validatedData.tags?.length) {
      await this.addMediaTags(media.id, validatedData.tags)
    }

    return media
  }

  async getMedia(id: string): Promise<any | null> {
    return await prisma.media.findUnique({
      where: { id },
      include: {
        uploadedByUser: true,
        site: true,
        tags: {
          include: {
            tag: true,
          },
        },
        usage: {
          include: {
            article: true,
          },
        },
      },
    })
  }

  async updateMedia(id: string, data: z.infer<typeof mediaUpdateSchema>): Promise<any> {
    const validatedData = mediaUpdateSchema.parse(data)
    
    const media = await prisma.media.update({
      where: { id },
      data: validatedData,
      include: {
        uploadedByUser: true,
        site: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return media
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      throw new Error('Media not found')
    }

    // Check if media is being used
    const usage = await prisma.mediaUsage.findMany({
      where: { mediaId: id },
    })

    if (usage.length > 0) {
      throw new Error('Cannot delete media that is currently in use')
    }

    // Soft delete
    await prisma.media.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // Media Optimization
  private async optimizeImage(filePath: string, fileName: string): Promise<any> {
    try {
      const image = sharp(filePath)
      const metadata = await image.metadata()
      
      const optimizedPaths: any = {}
      
      // Generate different sizes
      const sizes = [
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 },
        { name: 'large', width: 1200, height: 1200 },
      ]

      for (const size of sizes) {
        const optimizedFileName = `${fileName.replace(/\.[^/.]+$/, '')}_${size.name}.webp`
        const optimizedPath = join(this.uploadDir, optimizedFileName)
        
        await image
          .resize(size.width, size.height, { fit: 'cover' })
          .webp({ quality: 80 })
          .toFile(optimizedPath)
        
        optimizedPaths[size.name] = optimizedPath
      }

      // Generate responsive images
      const responsiveSizes = [320, 640, 768, 1024, 1280, 1920]
      const responsivePaths: any = {}

      for (const width of responsiveSizes) {
        const responsiveFileName = `${fileName.replace(/\.[^/.]+$/, '')}_${width}w.webp`
        const responsivePath = join(this.uploadDir, responsiveFileName)
        
        await image
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(responsivePath)
        
        responsivePaths[`${width}w`] = responsivePath
      }

      optimizedPaths.responsive = responsivePaths
      
      return optimizedPaths
    } catch (error) {
      console.error('Error optimizing image:', error)
      return {}
    }
  }

  // Media Search and Filtering
  async searchMedia(filters: MediaSearchFilters, page = 1, limit = 20): Promise<{
    media: any[]
    total: number
    page: number
    totalPages: number
  }> {
    const where: any = {
      isActive: true,
    }

    if (filters.fileType?.length) {
      where.fileType = { in: filters.fileType }
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.uploadedBy) {
      where.uploadedBy = filters.uploadedBy
    }

    if (filters.siteId) {
      where.siteId = filters.siteId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    if (filters.search) {
      where.OR = [
        { originalName: { contains: filters.search, mode: 'insensitive' } },
        { altTextEn: { contains: filters.search, mode: 'insensitive' } },
        { altTextAr: { contains: filters.search, mode: 'insensitive' } },
        { captionEn: { contains: filters.search, mode: 'insensitive' } },
        { captionAr: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.tags?.length) {
      where.tags = {
        some: {
          tagId: { in: filters.tags },
        },
      }
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          uploadedByUser: true,
          site: true,
          tags: {
            include: {
              tag: true,
            },
          },
          usage: {
            include: {
              article: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count({ where }),
    ])

    return {
      media,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Media Categories
  async getMediaCategories(siteId: string): Promise<any[]> {
    const categories = await prisma.media.groupBy({
      by: ['category'],
      where: {
        siteId,
        isActive: true,
        category: { not: null },
      },
      _count: {
        category: true,
      },
    })

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }))
  }

  // Media Tags
  async addMediaTags(mediaId: string, tagIds: string[]): Promise<void> {
    const existingTags = await prisma.mediaTag.findMany({
      where: { mediaId },
      select: { tagId: true },
    })
    
    const existingTagIds = existingTags.map(t => t.tagId)
    const newTagIds = tagIds.filter(id => !existingTagIds.includes(id))
    
    if (newTagIds.length > 0) {
      await prisma.mediaTag.createMany({
        data: newTagIds.map(tagId => ({ mediaId, tagId })),
      })
    }
  }

  async removeMediaTags(mediaId: string, tagIds: string[]): Promise<void> {
    await prisma.mediaTag.deleteMany({
      where: {
        mediaId,
        tagId: { in: tagIds },
      },
    })
  }

  // Media Usage Tracking
  async trackMediaUsage(mediaId: string, articleId: string): Promise<void> {
    await prisma.mediaUsage.upsert({
      where: {
        mediaId_articleId: {
          mediaId,
          articleId,
        },
      },
      update: {
        lastUsed: new Date(),
      },
      create: {
        mediaId,
        articleId,
        lastUsed: new Date(),
      },
    })
  }

  async getMediaUsage(mediaId: string): Promise<any[]> {
    return await prisma.mediaUsage.findMany({
      where: { mediaId },
      include: {
        article: true,
      },
      orderBy: { lastUsed: 'desc' },
    })
  }

  // Media Analytics
  async getMediaAnalytics(mediaId: string): Promise<any> {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        usage: {
          include: {
            article: true,
          },
        },
      },
    })

    if (!media) {
      return null
    }

    const usageCount = media.usage.length
    const articlesUsingMedia = media.usage.map(u => u.article)
    
    return {
      mediaId,
      usageCount,
      articlesUsingMedia,
      lastUsed: media.usage.length > 0 ? media.usage[0].lastUsed : null,
    }
  }

  // Utility Methods
  private async ensureUploadDirectory(): Promise<void> {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }
  }

  private generateUniqueFileName(fileName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = fileName.split('.').pop()
    return `${timestamp}_${random}.${extension}`
  }

  private getMimeType(fileType: string): string {
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    }
    
    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream'
  }
}

export const mediaService = MediaManagementService.getInstance() 