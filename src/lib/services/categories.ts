import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Category validation schemas
export const categoryCreateSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  parentId: z.string().optional(),
  seoTitleEn: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescriptionEn: z.string().optional(),
  seoDescriptionAr: z.string().optional(),
  siteId: z.string(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

// Tag validation schemas
export const tagCreateSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  color: z.string().optional(),
  siteId: z.string(),
})

export const tagUpdateSchema = tagCreateSchema.partial()

export interface CategoryTree {
  id: string
  nameEn: string
  nameAr?: string
  descriptionEn?: string
  descriptionAr?: string
  slug: string
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  articleCount: number
  viewCount: number
  children: CategoryTree[]
  level: number
}

export interface CategorySearchFilters {
  parentId?: string
  search?: string
  siteId?: string
  includeEmpty?: boolean
}

export interface TagSearchFilters {
  search?: string
  siteId?: string
  includeEmpty?: boolean
}

export class CategoryTagManagementService {
  private static instance: CategoryTagManagementService

  private constructor() {}

  public static getInstance(): CategoryTagManagementService {
    if (!CategoryTagManagementService.instance) {
      CategoryTagManagementService.instance = new CategoryTagManagementService()
    }
    return CategoryTagManagementService.instance
  }

  // Category Management
  async createCategory(data: z.infer<typeof categoryCreateSchema>): Promise<any> {
    const validatedData = categoryCreateSchema.parse(data)
    
    // Generate slug from name
    const slug = this.generateSlug(validatedData.nameEn)
    
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug,
        articleCount: 0,
        viewCount: 0,
      },
      include: {
        parent: true,
        children: true,
        site: true,
      },
    })

    return category
  }

  async getCategory(id: string): Promise<any | null> {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        site: true,
        articles: {
          include: {
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  async updateCategory(id: string, data: z.infer<typeof categoryUpdateSchema>): Promise<any> {
    const validatedData = categoryUpdateSchema.parse(data)
    
    // Generate new slug if name changed
    if (validatedData.nameEn) {
      validatedData.slug = this.generateSlug(validatedData.nameEn)
    }
    
    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
      include: {
        parent: true,
        children: true,
        site: true,
      },
    })

    return category
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        articles: true,
      },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    if (category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories')
    }

    if (category.articles.length > 0) {
      throw new Error('Cannot delete category with articles')
    }

    await prisma.category.delete({
      where: { id },
    })
  }

  // Category Tree and Hierarchy
  async getCategoryTree(siteId: string): Promise<CategoryTree[]> {
    const categories = await prisma.category.findMany({
      where: {
        siteId,
        parentId: null, // Root categories only
      },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { nameEn: 'asc' },
    })

    return categories.map(cat => this.buildCategoryTree(cat, 0))
  }

  async getCategoryPath(id: string): Promise<any[]> {
    const path: any[] = []
    let currentId = id

    while (currentId) {
      const category = await prisma.category.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          slug: true,
          parentId: true,
        },
      })

      if (!category) break

      path.unshift(category)
      currentId = category.parentId || ''
    }

    return path
  }

  async moveCategory(id: string, newParentId: string | null): Promise<any> {
    // Check for circular reference
    if (newParentId) {
      const isCircular = await this.checkCircularReference(id, newParentId)
      if (isCircular) {
        throw new Error('Cannot move category: would create circular reference')
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: { parentId: newParentId },
      include: {
        parent: true,
        children: true,
        site: true,
      },
    })

    return category
  }

  // Category Search and Filtering
  async searchCategories(filters: CategorySearchFilters): Promise<any[]> {
    const where: any = {}

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId
    }

    if (filters.siteId) {
      where.siteId = filters.siteId
    }

    if (filters.search) {
      where.OR = [
        { nameEn: { contains: filters.search, mode: 'insensitive' } },
        { nameAr: { contains: filters.search, mode: 'insensitive' } },
        { descriptionEn: { contains: filters.search, mode: 'insensitive' } },
        { descriptionAr: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (!filters.includeEmpty) {
      where.articleCount = { gt: 0 }
    }

    return await prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        site: true,
      },
      orderBy: { nameEn: 'asc' },
    })
  }

  // Category Analytics
  async updateCategoryAnalytics(categoryId: string): Promise<void> {
    const [articleCount, viewCount] = await Promise.all([
      prisma.article.count({
        where: {
          categoryId,
          status: { not: 'DELETED' },
        },
      }),
      prisma.article.aggregate({
        where: {
          categoryId,
          status: { not: 'DELETED' },
        },
        _sum: {
          viewCount: true,
        },
      }),
    ])

    await prisma.category.update({
      where: { id: categoryId },
      data: {
        articleCount,
        viewCount: viewCount._sum.viewCount || 0,
      },
    })
  }

  async getCategoryAnalytics(categoryId: string): Promise<any> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        articles: {
          where: {
            status: { not: 'DELETED' },
          },
          include: {
            contentAnalytics: true,
          },
        },
      },
    })

    if (!category) {
      return null
    }

    const totalViews = category.articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)
    const avgEngagement = category.articles.length > 0 
      ? category.articles.reduce((sum, article) => sum + (article.engagementScore || 0), 0) / category.articles.length
      : 0

    return {
      categoryId,
      articleCount: category.articles.length,
      totalViews,
      avgEngagement,
      articles: category.articles,
    }
  }

  // Tag Management
  async createTag(data: z.infer<typeof tagCreateSchema>): Promise<any> {
    const validatedData = tagCreateSchema.parse(data)
    
    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        articleCount: 0,
      },
      include: {
        site: true,
      },
    })

    return tag
  }

  async getTag(id: string): Promise<any | null> {
    return await prisma.tag.findUnique({
      where: { id },
      include: {
        site: true,
        articles: {
          include: {
            author: true,
            category: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  async updateTag(id: string, data: z.infer<typeof tagUpdateSchema>): Promise<any> {
    const validatedData = tagUpdateSchema.parse(data)
    
    const tag = await prisma.tag.update({
      where: { id },
      data: validatedData,
      include: {
        site: true,
      },
    })

    return tag
  }

  async deleteTag(id: string): Promise<void> {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        articles: true,
      },
    })

    if (!tag) {
      throw new Error('Tag not found')
    }

    if (tag.articles.length > 0) {
      throw new Error('Cannot delete tag that is used by articles')
    }

    await prisma.tag.delete({
      where: { id },
    })
  }

  // Tag Search and Filtering
  async searchTags(filters: TagSearchFilters): Promise<any[]> {
    const where: any = {}

    if (filters.siteId) {
      where.siteId = filters.siteId
    }

    if (filters.search) {
      where.OR = [
        { nameEn: { contains: filters.search, mode: 'insensitive' } },
        { nameAr: { contains: filters.search, mode: 'insensitive' } },
        { descriptionEn: { contains: filters.search, mode: 'insensitive' } },
        { descriptionAr: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (!filters.includeEmpty) {
      where.articleCount = { gt: 0 }
    }

    return await prisma.tag.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: { nameEn: 'asc' },
    })
  }

  // Tag Analytics
  async updateTagAnalytics(tagId: string): Promise<void> {
    const articleCount = await prisma.articleTag.count({
      where: { tagId },
    })

    await prisma.tag.update({
      where: { id: tagId },
      data: { articleCount },
    })
  }

  async getTagAnalytics(tagId: string): Promise<any> {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        articles: {
          include: {
            article: {
              include: {
                contentAnalytics: true,
              },
            },
          },
        },
      },
    })

    if (!tag) {
      return null
    }

    const totalViews = tag.articles.reduce((sum, articleTag) => 
      sum + (articleTag.article.viewCount || 0), 0
    )
    const avgEngagement = tag.articles.length > 0 
      ? tag.articles.reduce((sum, articleTag) => 
          sum + (articleTag.article.engagementScore || 0), 0
        ) / tag.articles.length
      : 0

    return {
      tagId,
      articleCount: tag.articles.length,
      totalViews,
      avgEngagement,
      articles: tag.articles.map(at => at.article),
    }
  }

  // Bulk Operations
  async bulkUpdateCategories(categoryIds: string[], updates: Partial<z.infer<typeof categoryUpdateSchema>>): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const categoryId of categoryIds) {
      try {
        await this.updateCategory(categoryId, updates)
        success++
      } catch (error) {
        console.error(`Failed to update category ${categoryId}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  async bulkUpdateTags(tagIds: string[], updates: Partial<z.infer<typeof tagUpdateSchema>>): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const tagId of tagIds) {
      try {
        await this.updateTag(tagId, updates)
        success++
      } catch (error) {
        console.error(`Failed to update tag ${tagId}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  // Utility Methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private buildCategoryTree(category: any, level: number): CategoryTree {
    return {
      id: category.id,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      slug: category.slug,
      seoTitleEn: category.seoTitleEn,
      seoTitleAr: category.seoTitleAr,
      seoDescriptionEn: category.seoDescriptionEn,
      seoDescriptionAr: category.seoDescriptionAr,
      articleCount: category.articleCount,
      viewCount: category.viewCount,
      children: category.children.map((child: any) => this.buildCategoryTree(child, level + 1)),
      level,
    }
  }

  private async checkCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
    let currentId = newParentId
    
    while (currentId) {
      if (currentId === categoryId) {
        return true
      }
      
      const parent = await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })
      
      if (!parent) break
      currentId = parent.parentId || ''
    }
    
    return false
  }
}

export const categoryTagService = CategoryTagManagementService.getInstance() 