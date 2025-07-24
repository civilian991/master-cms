import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { contentService } from '../../lib/services/content'

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    article: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    contentAnalytics: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    articleTag: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    contentTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}))

describe('ContentManagementService', () => {
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma = require('@prisma/client').PrismaClient
  })

  describe('createArticle', () => {
    it('should create an article with valid data', async () => {
      const mockArticle = {
        id: '1',
        titleEn: 'Test Article',
        contentEn: 'Test content',
        slug: 'test-article',
        authorId: 'user1',
        siteId: 'site1',
        status: 'DRAFT',
        workflowState: 'DRAFT',
        version: 1,
        published: false,
        viewCount: 0,
        engagementScore: 0,
        readTime: 1,
      }

      mockPrisma.mockImplementation(() => ({
        article: {
          create: jest.fn().mockResolvedValue(mockArticle),
        },
        contentAnalytics: {
          create: jest.fn().mockResolvedValue({}),
        },
      }))

      const articleData = {
        titleEn: 'Test Article',
        contentEn: 'Test content',
        authorId: 'user1',
        siteId: 'site1',
      }

      const result = await contentService.createArticle(articleData)

      expect(result).toEqual(mockArticle)
      expect(mockPrisma().article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          titleEn: 'Test Article',
          contentEn: 'Test content',
          slug: 'test-article',
          status: 'DRAFT',
          workflowState: 'DRAFT',
          version: 1,
          published: false,
          viewCount: 0,
          engagementScore: 0,
          readTime: 1,
        }),
        include: expect.any(Object),
      })
    })

    it('should throw error for invalid data', async () => {
      const invalidData = {
        titleEn: '', // Empty title should fail validation
        contentEn: 'Test content',
        authorId: 'user1',
        siteId: 'site1',
      }

      await expect(contentService.createArticle(invalidData)).rejects.toThrow()
    })
  })

  describe('getArticle', () => {
    it('should return article with analytics when requested', async () => {
      const mockArticle = {
        id: '1',
        titleEn: 'Test Article',
        contentEn: 'Test content',
        viewCount: 10,
      }

      mockPrisma.mockImplementation(() => ({
        article: {
          findUnique: jest.fn().mockResolvedValue(mockArticle),
        },
        contentAnalytics: {
          update: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn().mockResolvedValue([{}, {}]),
      }))

      const result = await contentService.getArticle('1', true)

      expect(result).toEqual(mockArticle)
      expect(mockPrisma().article.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      })
    })

    it('should return null for non-existent article', async () => {
      mockPrisma.mockImplementation(() => ({
        article: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }))

      const result = await contentService.getArticle('999')

      expect(result).toBeNull()
    })
  })

  describe('updateArticle', () => {
    it('should update article with new data', async () => {
      const currentArticle = {
        id: '1',
        titleEn: 'Old Title',
        contentEn: 'Old content',
        version: 1,
        readTime: 1,
      }

      const updatedArticle = {
        ...currentArticle,
        titleEn: 'New Title',
        contentEn: 'New content',
        version: 2,
        readTime: 2,
      }

      mockPrisma.mockImplementation(() => ({
        article: {
          findUnique: jest.fn().mockResolvedValue(currentArticle),
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue(updatedArticle),
        },
      }))

      const updateData = {
        titleEn: 'New Title',
        contentEn: 'New content',
      }

      const result = await contentService.updateArticle('1', updateData)

      expect(result).toEqual(updatedArticle)
      expect(mockPrisma().article.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining(updateData),
        include: expect.any(Object),
      })
    })
  })

  describe('updateWorkflow', () => {
    it('should update workflow state to IN_REVIEW', async () => {
      const mockArticle = {
        id: '1',
        titleEn: 'Test Article',
        workflowState: 'DRAFT',
      }

      const updatedArticle = {
        ...mockArticle,
        workflowState: 'IN_REVIEW',
        reviewedBy: 'reviewer1',
        reviewedAt: expect.any(Date),
      }

      mockPrisma.mockImplementation(() => ({
        article: {
          findUnique: jest.fn().mockResolvedValue(mockArticle),
          update: jest.fn().mockResolvedValue(updatedArticle),
        },
      }))

      const workflowData = {
        articleId: '1',
        action: 'submit_for_review',
        reviewerId: 'reviewer1',
      }

      const result = await contentService.updateWorkflow(workflowData)

      expect(result.workflowState).toBe('IN_REVIEW')
      expect(mockPrisma().article.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          workflowState: 'IN_REVIEW',
          reviewedBy: 'reviewer1',
        }),
        include: expect.any(Object),
      })
    })

    it('should update workflow state to PUBLISHED', async () => {
      const mockArticle = {
        id: '1',
        titleEn: 'Test Article',
        workflowState: 'APPROVED',
        published: false,
      }

      const updatedArticle = {
        ...mockArticle,
        workflowState: 'PUBLISHED',
        status: 'PUBLISHED',
        published: true,
        publishedAt: expect.any(Date),
      }

      mockPrisma.mockImplementation(() => ({
        article: {
          findUnique: jest.fn().mockResolvedValue(mockArticle),
          update: jest.fn().mockResolvedValue(updatedArticle),
        },
      }))

      const workflowData = {
        articleId: '1',
        action: 'publish',
      }

      const result = await contentService.updateWorkflow(workflowData)

      expect(result.workflowState).toBe('PUBLISHED')
      expect(result.published).toBe(true)
    })
  })

  describe('searchArticles', () => {
    it('should search articles with filters', async () => {
      const mockArticles = [
        {
          id: '1',
          titleEn: 'Test Article 1',
          status: 'PUBLISHED',
          workflowState: 'PUBLISHED',
        },
        {
          id: '2',
          titleEn: 'Test Article 2',
          status: 'DRAFT',
          workflowState: 'DRAFT',
        },
      ]

      mockPrisma.mockImplementation(() => ({
        article: {
          findMany: jest.fn().mockResolvedValue(mockArticles),
          count: jest.fn().mockResolvedValue(2),
        },
      }))

      const filters = {
        status: ['PUBLISHED'],
        search: 'Test',
        siteId: 'site1',
      }

      const result = await contentService.searchArticles(filters, 1, 20)

      expect(result.articles).toEqual(mockArticles)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('bulkOperation', () => {
    it('should perform bulk publish operation', async () => {
      const mockPrismaInstance = {
        article: {
          update: jest.fn().mockResolvedValue({}),
        },
      }

      mockPrisma.mockImplementation(() => mockPrismaInstance)

      const bulkData = {
        articleIds: ['1', '2', '3'],
        operation: 'publish',
      }

      const result = await contentService.bulkOperation(bulkData)

      expect(result.success).toBe(3)
      expect(result.failed).toBe(0)
    })

    it('should handle bulk operation failures', async () => {
      const mockPrismaInstance = {
        article: {
          update: jest.fn()
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('Update failed'))
            .mockResolvedValueOnce({}),
        },
      }

      mockPrisma.mockImplementation(() => mockPrismaInstance)

      const bulkData = {
        articleIds: ['1', '2', '3'],
        operation: 'publish',
      }

      const result = await contentService.bulkOperation(bulkData)

      expect(result.success).toBe(2)
      expect(result.failed).toBe(1)
    })
  })

  describe('contentAnalytics', () => {
    it('should increment view count', async () => {
      mockPrisma.mockImplementation(() => ({
        $transaction: jest.fn().mockResolvedValue([{}, {}]),
      }))

      await contentService.incrementViewCount('1')

      expect(mockPrisma().$transaction).toHaveBeenCalledWith([
        expect.any(Object),
        expect.any(Object),
      ])
    })

    it('should update engagement score', async () => {
      mockPrisma.mockImplementation(() => ({
        $transaction: jest.fn().mockResolvedValue([{}, {}]),
      }))

      await contentService.updateEngagementScore('1', 0.85)

      expect(mockPrisma().$transaction).toHaveBeenCalledWith([
        expect.any(Object),
        expect.any(Object),
      ])
    })
  })

  describe('contentTemplates', () => {
    it('should create content template', async () => {
      const mockTemplate = {
        id: '1',
        name: 'Test Template',
        content: { sections: ['header', 'body', 'footer'] },
        siteId: 'site1',
      }

      mockPrisma.mockImplementation(() => ({
        contentTemplate: {
          create: jest.fn().mockResolvedValue(mockTemplate),
        },
      }))

      const templateData = {
        name: 'Test Template',
        content: { sections: ['header', 'body', 'footer'] },
        siteId: 'site1',
      }

      const result = await contentService.createContentTemplate(templateData)

      expect(result).toEqual(mockTemplate)
      expect(mockPrisma().contentTemplate.create).toHaveBeenCalledWith({
        data: templateData,
      })
    })

    it('should get content templates for site', async () => {
      const mockTemplates = [
        { id: '1', name: 'Template 1', isActive: true },
        { id: '2', name: 'Template 2', isActive: true },
      ]

      mockPrisma.mockImplementation(() => ({
        contentTemplate: {
          findMany: jest.fn().mockResolvedValue(mockTemplates),
        },
      }))

      const result = await contentService.getContentTemplates('site1')

      expect(result).toEqual(mockTemplates)
      expect(mockPrisma().contentTemplate.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site1',
          isActive: true,
        },
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('utility methods', () => {
    it('should generate slug from title', () => {
      const title = 'Test Article Title!'
      const slug = contentService['generateSlug'](title)
      expect(slug).toBe('test-article-title')
    })

    it('should calculate read time', () => {
      const content = 'This is a test article with multiple words to calculate reading time.'
      const readTime = contentService['calculateReadTime'](content)
      expect(readTime).toBeGreaterThan(0)
    })

    it('should detect content changes', () => {
      const currentArticle = {
        titleEn: 'Old Title',
        titleAr: 'العنوان القديم',
        contentEn: 'Old content',
        contentAr: 'المحتوى القديم',
      }

      const newData = {
        titleEn: 'New Title',
        contentEn: 'New content',
      }

      const hasChanged = contentService['hasContentChanged'](currentArticle, newData)
      expect(hasChanged).toBe(true)
    })
  })
}) 