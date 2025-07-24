import { prisma } from '../prisma'
import { Article, Category, Tag, Media, ContentTemplate, WorkflowState, ArticleStatus } from '@prisma/client'
import { createSlug } from '../utils/slug'
import { calculateReadTime } from '../utils/readTime'
import { generateSearchText } from '../utils/search'
import { redis } from '../redis'

export interface CreateArticleData {
  titleEn: string
  titleAr?: string
  contentEn: string
  contentAr?: string
  excerptEn?: string
  excerptAr?: string
  categoryId?: string
  tagIds?: string[]
  mediaIds?: string[]
  templateId?: string
  scheduledAt?: Date
  expiresAt?: Date
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  seoKeywordsEn?: string
  seoKeywordsAr?: string
  canonicalUrl?: string
  siteId: string
  authorId: string
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string
}

export interface ArticleFilters {
  siteId: string
  status?: ArticleStatus[]
  workflowState?: WorkflowState[]
  categoryId?: string
  tagIds?: string[]
  authorId?: string
  published?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount' | 'titleEn'
  sortOrder?: 'asc' | 'desc'
}

export interface BulkOperationData {
  articleIds: string[]
  operation: 'publish' | 'unpublish' | 'archive' | 'delete' | 'approve' | 'reject'
  userId: string
}

export class ContentService {
  // Article Management
  async createArticle(data: CreateArticleData): Promise<Article> {
    const slug = await createSlug(data.titleEn, 'articles', data.siteId)
    const readTime = calculateReadTime(data.contentEn)
    
    const article = await prisma.article.create({
      data: {
        ...data,
        slug,
        readTime,
        tagIds: undefined, // Remove from direct data
        mediaIds: undefined, // Remove from direct data
        tags: data.tagIds ? {
          create: data.tagIds.map(tagId => ({ tagId }))
        } : undefined,
        media: data.mediaIds ? {
          connect: data.mediaIds.map(mediaId => ({ id: mediaId }))
        } : undefined,
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
        template: true,
        site: true,
      }
    })

    // Create search index
    await this.createSearchIndex(article.id)
    
    // Clear cache
    await this.clearArticleCache(data.siteId)
    
    return article
  }

  async updateArticle(data: UpdateArticleData): Promise<Article> {
    const { id, tagIds, mediaIds, ...updateData } = data
    
    // Handle slug update if title changed
    if (updateData.titleEn) {
      updateData.slug = await createSlug(updateData.titleEn, 'articles', data.siteId!, id)
    }
    
    // Handle read time update if content changed
    if (updateData.contentEn) {
      updateData.readTime = calculateReadTime(updateData.contentEn)
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...updateData,
        tags: tagIds ? {
          deleteMany: {},
          create: tagIds.map(tagId => ({ tagId }))
        } : undefined,
        media: mediaIds ? {
          set: mediaIds.map(mediaId => ({ id: mediaId }))
        } : undefined,
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
        template: true,
        site: true,
      }
    })

    // Update search index
    await this.updateSearchIndex(article.id)
    
    // Clear cache
    await this.clearArticleCache(article.siteId)
    
    return article
  }

  async getArticle(id: string, includeRelations = true): Promise<Article | null> {
    const cacheKey = `article:${id}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: includeRelations ? {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
        template: true,
        site: true,
        versions: true,
        parentVersion: true,
      } : undefined,
    })

    if (article) {
      await redis.setex(cacheKey, 3600, JSON.stringify(article)) // Cache for 1 hour
    }

    return article
  }

  async getArticles(filters: ArticleFilters): Promise<{ articles: Article[], total: number, page: number, totalPages: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filterData } = filters
    const skip = (page - 1) * limit

    const where: any = {
      siteId: filterData.siteId,
    }

    if (filterData.status?.length) {
      where.status = { in: filterData.status }
    }

    if (filterData.workflowState?.length) {
      where.workflowState = { in: filterData.workflowState }
    }

    if (filterData.categoryId) {
      where.categoryId = filterData.categoryId
    }

    if (filterData.tagIds?.length) {
      where.tags = {
        some: {
          tagId: { in: filterData.tagIds }
        }
      }
    }

    if (filterData.authorId) {
      where.authorId = filterData.authorId
    }

    if (filterData.published !== undefined) {
      where.published = filterData.published
    }

    if (filterData.search) {
      where.OR = [
        { titleEn: { contains: filterData.search, mode: 'insensitive' } },
        { titleAr: { contains: filterData.search, mode: 'insensitive' } },
        { contentEn: { contains: filterData.search, mode: 'insensitive' } },
        { contentAr: { contains: filterData.search, mode: 'insensitive' } },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: true,
          category: true,
          tags: { include: { tag: true } },
          media: true,
          _count: { select: { versions: true } }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.article.count({ where })
    ])

    return {
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  }

  async deleteArticle(id: string): Promise<void> {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { siteId: true }
    })

    if (!article) {
      throw new Error('Article not found')
    }

    await prisma.article.delete({ where: { id } })
    await this.clearArticleCache(article.siteId)
  }

  // Workflow Management
  async updateWorkflowState(articleId: string, workflowState: WorkflowState, userId: string): Promise<Article> {
    const updateData: any = { workflowState }

    switch (workflowState) {
      case 'IN_REVIEW':
        updateData.reviewedBy = userId
        updateData.reviewedAt = new Date()
        break
      case 'APPROVED':
        updateData.approvedBy = userId
        updateData.approvedAt = new Date()
        break
      case 'PUBLISHED':
        updateData.published = true
        updateData.publishedAt = new Date()
        updateData.status = 'PUBLISHED'
        break
      case 'ARCHIVED':
        updateData.published = false
        updateData.status = 'ARCHIVED'
        break
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
      }
    })

    await this.clearArticleCache(article.siteId)
    return article
  }

  async bulkOperation(data: BulkOperationData): Promise<{ success: number, failed: number }> {
    const { articleIds, operation, userId } = data
    let success = 0
    let failed = 0

    for (const articleId of articleIds) {
      try {
        switch (operation) {
          case 'publish':
            await this.updateWorkflowState(articleId, 'PUBLISHED', userId)
            break
          case 'unpublish':
            await prisma.article.update({
              where: { id: articleId },
              data: { published: false, workflowState: 'DRAFT' }
            })
            break
          case 'archive':
            await this.updateWorkflowState(articleId, 'ARCHIVED', userId)
            break
          case 'delete':
            await this.deleteArticle(articleId)
            break
          case 'approve':
            await this.updateWorkflowState(articleId, 'APPROVED', userId)
            break
          case 'reject':
            await this.updateWorkflowState(articleId, 'REJECTED', userId)
            break
        }
        success++
      } catch (error) {
        console.error(`Failed to ${operation} article ${articleId}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  // Versioning
  async createVersion(articleId: string, userId: string): Promise<Article> {
    const originalArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        tags: { include: { tag: true } },
        media: true,
      }
    })

    if (!originalArticle) {
      throw new Error('Article not found')
    }

    const newVersion = await prisma.article.create({
      data: {
        ...originalArticle,
        id: undefined, // Let Prisma generate new ID
        parentVersionId: articleId,
        version: originalArticle.version + 1,
        workflowState: 'DRAFT',
        published: false,
        publishedAt: null,
        viewCount: 0,
        engagementScore: 0,
        tags: {
          create: originalArticle.tags.map(tag => ({ tagId: tag.tagId }))
        },
        media: {
          connect: originalArticle.media.map(media => ({ id: media.id }))
        }
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
      }
    })

    await this.clearArticleCache(originalArticle.siteId)
    return newVersion
  }

  async rollbackToVersion(articleId: string, versionId: string): Promise<Article> {
    const version = await prisma.article.findUnique({
      where: { id: versionId },
      include: {
        tags: { include: { tag: true } },
        media: true,
      }
    })

    if (!version) {
      throw new Error('Version not found')
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        titleEn: version.titleEn,
        titleAr: version.titleAr,
        contentEn: version.contentEn,
        contentAr: version.contentAr,
        excerptEn: version.excerptEn,
        excerptAr: version.excerptAr,
        tags: {
          deleteMany: {},
          create: version.tags.map(tag => ({ tagId: tag.tagId }))
        },
        media: {
          set: version.media.map(media => ({ id: media.id }))
        }
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
      }
    })

    await this.clearArticleCache(updatedArticle.siteId)
    return updatedArticle
  }

  // Content Templates
  async createTemplate(data: { name: string; description?: string; content: any; siteId: string }): Promise<ContentTemplate> {
    return await prisma.contentTemplate.create({
      data,
      include: { site: true }
    })
  }

  async getTemplates(siteId: string): Promise<ContentTemplate[]> {
    return await prisma.contentTemplate.findMany({
      where: { siteId, isActive: true },
      include: { site: true }
    })
  }

  async updateTemplate(id: string, data: Partial<ContentTemplate>): Promise<ContentTemplate> {
    return await prisma.contentTemplate.update({
      where: { id },
      data,
      include: { site: true }
    })
  }

  async deleteTemplate(id: string): Promise<void> {
    await prisma.contentTemplate.delete({ where: { id } })
  }

  // Analytics
  async trackView(articleId: string, userId?: string): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.$transaction([
      // Update article view count
      prisma.article.update({
        where: { id: articleId },
        data: { viewCount: { increment: 1 } }
      }),
      // Update daily analytics
      prisma.contentAnalytics.upsert({
        where: {
          articleId_date: {
            articleId,
            date: today
          }
        },
        update: {
          pageViews: { increment: 1 },
          uniqueViews: userId ? { increment: 1 } : undefined
        },
        create: {
          articleId,
          date: today,
          pageViews: 1,
          uniqueViews: userId ? 1 : 0
        }
      })
    ])
  }

  async getAnalytics(articleId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const analytics = await prisma.contentAnalytics.findMany({
      where: {
        articleId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    })

    return analytics
  }

  // Search
  async searchArticles(siteId: string, query: string, filters?: Partial<ArticleFilters>): Promise<Article[]> {
    const searchText = generateSearchText(query)

    const articles = await prisma.article.findMany({
      where: {
        siteId,
        published: true,
        OR: [
          { titleEn: { contains: searchText, mode: 'insensitive' } },
          { titleAr: { contains: searchText, mode: 'insensitive' } },
          { contentEn: { contains: searchText, mode: 'insensitive' } },
          { contentAr: { contains: searchText, mode: 'insensitive' } },
        ],
        ...filters
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        media: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 20
    })

    return articles
  }

  // Cache Management
  private async clearArticleCache(siteId: string): Promise<void> {
    const keys = await redis.keys(`article:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  private async createSearchIndex(articleId: string): Promise<void> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } }
      }
    })

    if (!article) return

    const searchTextEn = generateSearchText(`${article.titleEn} ${article.contentEn} ${article.excerptEn || ''}`)
    const searchTextAr = generateSearchText(`${article.titleAr || ''} ${article.contentAr || ''} ${article.excerptAr || ''}`)

    await prisma.contentSearchIndex.upsert({
      where: { articleId },
      update: {
        searchTextEn,
        searchTextAr,
        tags: article.tags.map(t => t.tag.nameEn),
        category: article.category?.nameEn,
        author: article.author.name,
      },
      create: {
        articleId,
        searchTextEn,
        searchTextAr,
        tags: article.tags.map(t => t.tag.nameEn),
        category: article.category?.nameEn,
        author: article.author.name,
      }
    })
  }

  private async updateSearchIndex(articleId: string): Promise<void> {
    await this.createSearchIndex(articleId)
  }
}

export const contentService = new ContentService() 