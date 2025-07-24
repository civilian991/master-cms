import { z } from 'zod'
import { prisma } from '../prisma'

// Type definitions
type Article = any
type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
type WorkflowState = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED'

// Content validation schemas
export const articleCreateSchema = z.object({
  titleEn: z.string().min(1, 'English title is required'),
  titleAr: z.string().optional(),
  contentEn: z.string().min(1, 'English content is required'),
  contentAr: z.string().optional(),
  excerptEn: z.string().optional(),
  excerptAr: z.string().optional(),
  authorId: z.string(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  templateId: z.string().optional(),
  seoTitleEn: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescriptionEn: z.string().optional(),
  seoDescriptionAr: z.string().optional(),
  seoKeywordsEn: z.string().optional(),
  seoKeywordsAr: z.string().optional(),
  scheduledAt: z.date().optional(),
  expiresAt: z.date().optional(),
  siteId: z.string(),
})

export const articleUpdateSchema = articleCreateSchema.partial()

export const contentWorkflowSchema = z.object({
  articleId: z.string(),
  action: z.enum(['submit_for_review', 'approve', 'reject', 'publish', 'archive']),
  reviewerId: z.string().optional(),
  comments: z.string().optional(),
})

export const bulkOperationSchema = z.object({
  articleIds: z.array(z.string()),
  operation: z.enum(['publish', 'archive', 'delete', 'move_category', 'add_tags', 'remove_tags']),
  data: z.record(z.any()).optional(),
})

export interface ContentAnalytics {
  viewCount: number
  engagementScore: number
  readTime: number
  bounceRate: number
  timeOnPage: number
}

export interface ContentSearchFilters {
  status?: ArticleStatus[]
  workflowState?: WorkflowState[]
  categoryId?: string
  tagIds?: string[]
  authorId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  siteId?: string
}

export class ContentManagementService {
  private static instance: ContentManagementService

  private constructor() {}

  public static getInstance(): ContentManagementService {
    if (!ContentManagementService.instance) {
      ContentManagementService.instance = new ContentManagementService()
    }
    return ContentManagementService.instance
  }

  // Article CRUD Operations
  async createArticle(data: any): Promise<Article> {
    const validatedData = articleCreateSchema.parse(data)
    
    // Generate slug from title
    const slug = this.generateSlug(validatedData.titleEn)
    
    // Calculate read time
    const readTime = this.calculateReadTime(validatedData.contentEn)
    
    const article = await prisma.article.create({
      data: {
        ...validatedData,
        slug,
        readTime,
        status: 'DRAFT' as ArticleStatus,
        workflowState: 'DRAFT' as WorkflowState,
        version: 1,
        published: false,
        viewCount: 0,
        engagementScore: 0,
      },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        template: true,
        site: true,
      },
    })

    // Create content analytics record
    await prisma.contentAnalytics.create({
      data: {
        articleId: article.id,
        viewCount: 0,
        engagementScore: 0,
        readTime,
        bounceRate: 0,
        timeOnPage: 0,
      },
    })

    return article
  }

  async getArticle(id: string, includeAnalytics = false): Promise<Article | null> {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        template: true,
        site: true,
        reviewer: true,
        approver: true,
        versions: true,
        contentAnalytics: includeAnalytics,
      },
    })

    if (article && includeAnalytics) {
      // Increment view count
      await this.incrementViewCount(article.id)
    }

    return article
  }

  async updateArticle(id: string, data: z.infer<typeof articleUpdateSchema>): Promise<Article> {
    const validatedData = articleUpdateSchema.parse(data)
    
    // Get current article for versioning
    const currentArticle = await prisma.article.findUnique({
      where: { id },
      include: { contentAnalytics: true },
    })

    if (!currentArticle) {
      throw new Error('Article not found')
    }

    // Create new version if content changed
    const shouldCreateVersion = this.hasContentChanged(currentArticle, validatedData)
    
    if (shouldCreateVersion) {
      await this.createArticleVersion(currentArticle)
    }

    // Update read time if content changed
    let readTime = currentArticle.readTime
    if (validatedData.contentEn) {
      readTime = this.calculateReadTime(validatedData.contentEn)
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...validatedData,
        readTime,
        version: shouldCreateVersion ? currentArticle.version + 1 : currentArticle.version,
      },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        template: true,
        site: true,
        contentAnalytics: true,
      },
    })

    return article
  }

  async deleteArticle(id: string): Promise<void> {
    await prisma.article.update({
      where: { id },
      data: {
        status: 'DELETED' as ArticleStatus,
        workflowState: 'ARCHIVED' as WorkflowState,
      },
    })
  }

  // Content Workflow Management
  async updateWorkflow(data: z.infer<typeof contentWorkflowSchema>): Promise<Article> {
    const validatedData = contentWorkflowSchema.parse(data)
    
    const article = await prisma.article.findUnique({
      where: { id: validatedData.articleId },
    })

    if (!article) {
      throw new Error('Article not found')
    }

    let updateData: any = {}

    switch (validatedData.action) {
      case 'submit_for_review':
        updateData = {
          workflowState: 'IN_REVIEW' as WorkflowState,
          reviewedBy: validatedData.reviewerId,
          reviewedAt: new Date(),
        }
        break
      case 'approve':
        updateData = {
          workflowState: 'APPROVED' as WorkflowState,
          approvedBy: validatedData.reviewerId,
          approvedAt: new Date(),
        }
        break
      case 'reject':
        updateData = {
          workflowState: 'REJECTED' as WorkflowState,
          reviewedBy: validatedData.reviewerId,
          reviewedAt: new Date(),
        }
        break
      case 'publish':
        updateData = {
          workflowState: 'PUBLISHED' as WorkflowState,
          status: 'PUBLISHED' as ArticleStatus,
          published: true,
          publishedAt: new Date(),
        }
        break
      case 'archive':
        updateData = {
          workflowState: 'ARCHIVED' as WorkflowState,
          status: 'ARCHIVED' as ArticleStatus,
          published: false,
        }
        break
    }

    return await prisma.article.update({
      where: { id: validatedData.articleId },
      data: updateData,
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        template: true,
        site: true,
      },
    })
  }

  // Content Scheduling
  async scheduleArticle(id: string, scheduledAt: Date): Promise<Article> {
    return await prisma.article.update({
      where: { id },
      data: {
        scheduledAt,
        workflowState: 'APPROVED' as WorkflowState,
      },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        template: true,
        site: true,
      },
    })
  }

  async getScheduledArticles(): Promise<Article[]> {
    const now = new Date()
    return await prisma.article.findMany({
      where: {
        scheduledAt: {
          lte: now,
        },
        workflowState: 'APPROVED' as WorkflowState,
        published: false,
      },
      include: {
        author: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        template: true,
        site: true,
      },
    })
  }

  // Bulk Operations
  async bulkOperation(data: z.infer<typeof bulkOperationSchema>): Promise<{ success: number; failed: number }> {
    const validatedData = bulkOperationSchema.parse(data)
    
    let success = 0
    let failed = 0

    for (const articleId of validatedData.articleIds) {
      try {
        switch (validatedData.operation) {
          case 'publish':
            await this.updateWorkflow({
              articleId,
              action: 'publish',
            })
            break
          case 'archive':
            await this.updateWorkflow({
              articleId,
              action: 'archive',
            })
            break
          case 'delete':
            await this.deleteArticle(articleId)
            break
          case 'move_category':
            if (validatedData.data?.categoryId) {
              await prisma.article.update({
                where: { id: articleId },
                data: { categoryId: validatedData.data.categoryId },
              })
            }
            break
          case 'add_tags':
            if (validatedData.data?.tagIds) {
              const existingTags = await prisma.articleTag.findMany({
                where: { articleId },
                select: { tagId: true },
              })
              const existingTagIds = existingTags.map((t: any) => t.tagId)
              const newTagIds = validatedData.data.tagIds.filter((id: string) => !existingTagIds.includes(id))
              
              if (newTagIds.length > 0) {
                await prisma.articleTag.createMany({
                  data: newTagIds.map((tagId: string) => ({ articleId, tagId })),
                })
              }
            }
            break
          case 'remove_tags':
            if (validatedData.data?.tagIds) {
              await prisma.articleTag.deleteMany({
                where: {
                  articleId,
                  tagId: { in: validatedData.data.tagIds },
                },
              })
            }
            break
        }
        success++
      } catch (error) {
        console.error(`Failed to process article ${articleId}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  // Content Search and Filtering
  async searchArticles(filters: ContentSearchFilters, page = 1, limit = 20): Promise<{
    articles: Article[]
    total: number
    page: number
    totalPages: number
  }> {
    const where: any = {
      status: { not: 'DELETED' as ArticleStatus },
    }

    if (filters.status?.length) {
      where.status = { in: filters.status }
    }

    if (filters.workflowState?.length) {
      where.workflowState = { in: filters.workflowState }
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId
    }

    if (filters.authorId) {
      where.authorId = filters.authorId
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
        { titleEn: { contains: filters.search, mode: 'insensitive' } },
        { titleAr: { contains: filters.search, mode: 'insensitive' } },
        { contentEn: { contains: filters.search, mode: 'insensitive' } },
        { contentAr: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.tagIds?.length) {
      where.tags = {
        some: {
          tagId: { in: filters.tagIds },
        },
      }
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: true,
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
          template: true,
          site: true,
          contentAnalytics: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return {
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Content Analytics
  async incrementViewCount(articleId: string): Promise<void> {
    await prisma.$transaction([
      prisma.article.update({
        where: { id: articleId },
        data: {
          viewCount: { increment: 1 },
        },
      }),
      prisma.contentAnalytics.update({
        where: { articleId },
        data: {
          viewCount: { increment: 1 },
        },
      }),
    ])
  }

  async updateEngagementScore(articleId: string, score: number): Promise<void> {
    await prisma.$transaction([
      prisma.article.update({
        where: { id: articleId },
        data: {
          engagementScore: score,
        },
      }),
      prisma.contentAnalytics.update({
        where: { articleId },
        data: {
          engagementScore: score,
        },
      }),
    ])
  }

  async getContentAnalytics(articleId: string): Promise<ContentAnalytics | null> {
    const analytics = await prisma.contentAnalytics.findUnique({
      where: { articleId },
    })

    return analytics
  }

  // Content Templates
  async createContentTemplate(data: {
    name: string
    description?: string
    content: any
    siteId: string
  }): Promise<any> {
    return await prisma.contentTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        siteId: data.siteId,
      },
    })
  }

  async getContentTemplates(siteId: string): Promise<any[]> {
    return await prisma.contentTemplate.findMany({
      where: {
        siteId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  // Utility Methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  private hasContentChanged(currentArticle: Article, newData: any): boolean {
    return (
      newData.titleEn !== currentArticle.titleEn ||
      newData.titleAr !== currentArticle.titleAr ||
      newData.contentEn !== currentArticle.contentEn ||
      newData.contentAr !== currentArticle.contentAr
    )
  }

  private async createArticleVersion(article: Article): Promise<void> {
    await prisma.article.create({
      data: {
        titleEn: article.titleEn,
        titleAr: article.titleAr,
        contentEn: article.contentEn,
        contentAr: article.contentAr,
        excerptEn: article.excerptEn,
        excerptAr: article.excerptAr,
        slug: `${article.slug}-v${article.version + 1}`,
        authorId: article.authorId,
        categoryId: article.categoryId,
        templateId: article.templateId,
        seoTitleEn: article.seoTitleEn,
        seoTitleAr: article.seoTitleAr,
        seoDescriptionEn: article.seoDescriptionEn,
        seoDescriptionAr: article.seoDescriptionAr,
        seoKeywordsEn: article.seoKeywordsEn,
        seoKeywordsAr: article.seoKeywordsAr,
        canonicalUrl: article.canonicalUrl,
        siteId: article.siteId,
        status: 'DRAFT' as ArticleStatus,
        workflowState: 'DRAFT' as WorkflowState,
        version: article.version + 1,
        parentVersionId: article.id,
        published: false,
        viewCount: 0,
        engagementScore: 0,
        readTime: article.readTime,
      },
    })
  }
}

export const contentService = ContentManagementService.getInstance() 