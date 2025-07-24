import { z } from 'zod'
import { prisma } from '../prisma'

// Type definitions matching our simplified schema
type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
type WorkflowState = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'

// Content validation schemas
export const articleCreateSchema = z.object({
  titleEn: z.string().min(1, 'English title is required'),
  titleAr: z.string().optional(),
  contentEn: z.string().min(1, 'English content is required'),
  contentAr: z.string().optional(),
  excerptEn: z.string().optional(),
  excerptAr: z.string().optional(),
  featuredImage: z.string().optional(),
  authorId: z.string(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  seoTitleEn: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescriptionEn: z.string().optional(),
  seoDescriptionAr: z.string().optional(),
  seoKeywordsEn: z.string().optional(),
  seoKeywordsAr: z.string().optional(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
  siteId: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED']).optional(),
  workflowState: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().optional(),
})

export const articleUpdateSchema = articleCreateSchema.partial()

export interface ContentSearchFilters {
  status?: string[]
  workflowState?: string[]
  categoryId?: string
  tagIds?: string[]
  authorId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  siteId?: string
}

export class SimpleContentService {
  private static instance: SimpleContentService

  private constructor() {}

  public static getInstance(): SimpleContentService {
    if (!SimpleContentService.instance) {
      SimpleContentService.instance = new SimpleContentService()
    }
    return SimpleContentService.instance
  }

  // Generate URL-friendly slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100) + '-' + Date.now();
  }

  // Calculate reading time (words per minute)
  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  // Article CRUD Operations
  async createArticle(data: any) {
    const validatedData = articleCreateSchema.parse(data)
    
    // Generate slug from title
    const slug = this.generateSlug(validatedData.titleEn)
    
    // Calculate read time
    const readTime = this.calculateReadTime(validatedData.contentEn)
    
    // Create the article
    const article = await prisma.article.create({
      data: {
        titleEn: validatedData.titleEn,
        titleAr: validatedData.titleAr,
        contentEn: validatedData.contentEn,
        contentAr: validatedData.contentAr,
        excerptEn: validatedData.excerptEn,
        excerptAr: validatedData.excerptAr,
        featuredImage: validatedData.featuredImage,
        slug,
        readTime,
        status: validatedData.status || 'DRAFT',
        workflowState: validatedData.workflowState || 'DRAFT',
        published: validatedData.published || false,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        authorId: validatedData.authorId,
        categoryId: validatedData.categoryId,
        siteId: validatedData.siteId,
        seoTitleEn: validatedData.seoTitleEn,
        seoTitleAr: validatedData.seoTitleAr,
        seoDescriptionEn: validatedData.seoDescriptionEn,
        seoDescriptionAr: validatedData.seoDescriptionAr,
        seoKeywordsEn: validatedData.seoKeywordsEn,
        seoKeywordsAr: validatedData.seoKeywordsAr,
        version: 1,
        viewCount: 0,
        engagementScore: 0,
      },
      include: {
        author: true,
        category: true,
        site: true,
      },
    })

    // Handle tags if provided
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await prisma.articleTag.createMany({
        data: validatedData.tagIds.map(tagId => ({
          articleId: article.id,
          tagId,
        })),
      })
    }

    return article
  }

  async getArticle(id: string) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        site: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return article
  }

  async updateArticle(id: string, data: any) {
    const validatedData = articleUpdateSchema.parse(data)
    
    const updateData: any = {}
    
    // Only include fields that are provided
    if (validatedData.titleEn !== undefined) updateData.titleEn = validatedData.titleEn
    if (validatedData.titleAr !== undefined) updateData.titleAr = validatedData.titleAr
    if (validatedData.contentEn !== undefined) updateData.contentEn = validatedData.contentEn
    if (validatedData.contentAr !== undefined) updateData.contentAr = validatedData.contentAr
    if (validatedData.excerptEn !== undefined) updateData.excerptEn = validatedData.excerptEn
    if (validatedData.excerptAr !== undefined) updateData.excerptAr = validatedData.excerptAr
    if (validatedData.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.workflowState !== undefined) updateData.workflowState = validatedData.workflowState
    if (validatedData.published !== undefined) updateData.published = validatedData.published
    if (validatedData.publishedAt !== undefined) updateData.publishedAt = validatedData.publishedAt ? new Date(validatedData.publishedAt) : null
    if (validatedData.scheduledAt !== undefined) updateData.scheduledAt = validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null

    // Update slug if title changed
    if (validatedData.titleEn) {
      updateData.slug = this.generateSlug(validatedData.titleEn)
    }

    // Recalculate read time if content changed
    if (validatedData.contentEn) {
      updateData.readTime = this.calculateReadTime(validatedData.contentEn)
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: true,
        category: true,
        site: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Handle tags update if provided
    if (validatedData.tagIds !== undefined) {
      // Remove existing tags
      await prisma.articleTag.deleteMany({
        where: { articleId: id },
      })
      
      // Add new tags
      if (validatedData.tagIds.length > 0) {
        await prisma.articleTag.createMany({
          data: validatedData.tagIds.map(tagId => ({
            articleId: id,
            tagId,
          })),
        })
      }
    }

    return article
  }

  async deleteArticle(id: string) {
    // Delete tags first (cascade should handle this, but being explicit)
    await prisma.articleTag.deleteMany({
      where: { articleId: id },
    })

    await prisma.article.delete({
      where: { id },
    })
  }

  async searchArticles(filters: ContentSearchFilters, page = 1, limit = 20) {
    const where: any = {}

    if (filters.siteId) where.siteId = filters.siteId
    if (filters.status) where.status = { in: filters.status }
    if (filters.workflowState) where.workflowState = { in: filters.workflowState }
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.authorId) where.authorId = filters.authorId
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }
    if (filters.search) {
      where.OR = [
        { titleEn: { contains: filters.search } },
        { titleAr: { contains: filters.search } },
        { contentEn: { contains: filters.search } },
        { contentAr: { contains: filters.search } },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: true,
          category: true,
          site: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return {
      items: articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getScheduledArticles() {
    return await prisma.article.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date(),
        },
        published: false,
      },
      include: {
        author: true,
        category: true,
        site: true,
      },
    })
  }

  async scheduleArticle(articleId: string, scheduledAt: Date) {
    return await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'SCHEDULED',
        scheduledAt,
      },
    })
  }
}

export const contentService = SimpleContentService.getInstance() 