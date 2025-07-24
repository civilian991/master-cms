import { ForumsService, ForumCategory, ForumThread, ForumPost } from '@/lib/services/forums';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    forumCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    forumThread: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    forumPost: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    forumModerationLog: {
      create: jest.fn(),
    },
    forumNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  forumCategory: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  forumThread: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  forumPost: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  forumModerationLog: {
    create: jest.fn(),
  },
  forumNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
};

describe('ForumsService', () => {
  let forumsService: ForumsService;

  beforeEach(() => {
    forumsService = new ForumsService();
    jest.clearAllMocks();
  });

  describe('Category Management', () => {
    const mockCategory: ForumCategory = {
      id: 'cat_123',
      name: 'General Discussion',
      description: 'General discussion category',
      slug: 'general-discussion',
      siteId: 'site_123',
      displayOrder: 1,
      isPrivate: false,
      isActive: true,
      moderatorIds: [],
    };

    it('should create a forum category', async () => {
      mockPrisma.forumCategory.create.mockResolvedValue(mockCategory);

      const result = await forumsService.createCategory(mockCategory);

      expect(mockPrisma.forumCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockCategory.name,
          description: mockCategory.description,
          slug: mockCategory.slug,
          siteId: mockCategory.siteId,
        }),
      });
      expect(result).toEqual(mockCategory);
    });

    it('should get categories for a site', async () => {
      const mockCategories = [mockCategory];
      mockPrisma.forumCategory.findMany.mockResolvedValue(mockCategories);

      const result = await forumsService.getCategories('site_123');

      expect(mockPrisma.forumCategory.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site_123', isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { threads: true }
          }
        }
      });
      expect(result).toEqual(mockCategories);
    });

    it('should update a category', async () => {
      const updates = { name: 'Updated Category' };
      const updatedCategory = { ...mockCategory, ...updates };
      mockPrisma.forumCategory.update.mockResolvedValue(updatedCategory);

      const result = await forumsService.updateCategory('cat_123', updates);

      expect(mockPrisma.forumCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat_123' },
        data: expect.objectContaining(updates),
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should delete a category with no threads', async () => {
      mockPrisma.forumThread.count.mockResolvedValue(0);
      mockPrisma.forumCategory.delete.mockResolvedValue(mockCategory);

      const result = await forumsService.deleteCategory('cat_123');

      expect(mockPrisma.forumThread.count).toHaveBeenCalledWith({
        where: { categoryId: 'cat_123' }
      });
      expect(mockPrisma.forumCategory.delete).toHaveBeenCalledWith({
        where: { id: 'cat_123' }
      });
      expect(result).toBe(true);
    });

    it('should soft delete a category with threads', async () => {
      mockPrisma.forumThread.count.mockResolvedValue(5);
      mockPrisma.forumCategory.update.mockResolvedValue(mockCategory);

      const result = await forumsService.deleteCategory('cat_123');

      expect(mockPrisma.forumCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat_123' },
        data: { isActive: false, updatedAt: expect.any(Date) }
      });
      expect(result).toBe(true);
    });
  });

  describe('Thread Management', () => {
    const mockThread: ForumThread = {
      id: 'thread_123',
      title: 'Test Thread',
      content: 'This is a test thread',
      categoryId: 'cat_123',
      authorId: 'user_123',
      siteId: 'site_123',
      isPinned: false,
      isLocked: false,
      tags: ['test', 'discussion'],
    };

    it('should create a forum thread', async () => {
      const createdThread = {
        ...mockThread,
        viewCount: 0,
        replyCount: 0,
        author: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        category: { id: 'cat_123', name: 'Test Category', slug: 'test-category' }
      };
      mockPrisma.forumThread.create.mockResolvedValue(createdThread);

      const result = await forumsService.createThread(mockThread);

      expect(mockPrisma.forumThread.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: mockThread.title,
          content: mockThread.content,
          categoryId: mockThread.categoryId,
          authorId: mockThread.authorId,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdThread);
    });

    it('should get threads in a category', async () => {
      const mockThreads = [mockThread];
      mockPrisma.forumThread.findMany.mockResolvedValue(mockThreads);
      mockPrisma.forumThread.count.mockResolvedValue(1);

      const result = await forumsService.getThreads('cat_123');

      expect(mockPrisma.forumThread.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat_123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result.threads).toEqual(mockThreads);
      expect(result.total).toBe(1);
    });

    it('should get a single thread and increment view count', async () => {
      const threadWithPosts = {
        ...mockThread,
        author: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        category: { id: 'cat_123', name: 'Test Category', slug: 'test-category' },
        posts: []
      };
      mockPrisma.forumThread.findUnique.mockResolvedValue(threadWithPosts);
      mockPrisma.forumThread.update.mockResolvedValue(threadWithPosts);

      const result = await forumsService.getThread('thread_123');

      expect(mockPrisma.forumThread.findUnique).toHaveBeenCalledWith({
        where: { id: 'thread_123' },
        include: expect.any(Object),
      });
      expect(mockPrisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread_123' },
        data: { viewCount: { increment: 1 } }
      });
      expect(result).toEqual(threadWithPosts);
    });

    it('should update a thread', async () => {
      const updates = { title: 'Updated Thread Title' };
      const updatedThread = { ...mockThread, ...updates };
      mockPrisma.forumThread.update.mockResolvedValue(updatedThread);

      const result = await forumsService.updateThread('thread_123', updates);

      expect(mockPrisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread_123' },
        data: expect.objectContaining(updates),
      });
      expect(result).toEqual(updatedThread);
    });

    it('should delete a thread', async () => {
      mockPrisma.forumThread.delete.mockResolvedValue(mockThread);

      const result = await forumsService.deleteThread('thread_123');

      expect(mockPrisma.forumThread.delete).toHaveBeenCalledWith({
        where: { id: 'thread_123' }
      });
      expect(result).toBe(true);
    });
  });

  describe('Post Management', () => {
    const mockPost: ForumPost = {
      id: 'post_123',
      content: 'This is a test post',
      threadId: 'thread_123',
      authorId: 'user_123',
      siteId: 'site_123',
    };

    it('should create a forum post', async () => {
      const createdPost = {
        ...mockPost,
        author: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        thread: { id: 'thread_123', title: 'Test Thread', authorId: 'user_456' }
      };
      mockPrisma.forumPost.create.mockResolvedValue(createdPost);
      mockPrisma.forumThread.update.mockResolvedValue({});

      const result = await forumsService.createPost(mockPost);

      expect(mockPrisma.forumPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: mockPost.content,
          threadId: mockPost.threadId,
          authorId: mockPost.authorId,
        }),
        include: expect.any(Object),
      });
      expect(mockPrisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: mockPost.threadId },
        data: {
          replyCount: { increment: 1 },
          lastActivityAt: expect.any(Date),
        }
      });
      expect(result).toEqual(createdPost);
    });

    it('should get posts in a thread', async () => {
      const mockPosts = [mockPost];
      mockPrisma.forumPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.forumPost.count.mockResolvedValue(1);

      const result = await forumsService.getPosts('thread_123');

      expect(mockPrisma.forumPost.findMany).toHaveBeenCalledWith({
        where: { threadId: 'thread_123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'asc' },
        take: 20,
        skip: 0,
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(1);
    });

    it('should update a post', async () => {
      const updates = { content: 'Updated post content' };
      const updatedPost = { ...mockPost, ...updates };
      mockPrisma.forumPost.update.mockResolvedValue(updatedPost);

      const result = await forumsService.updatePost('post_123', updates);

      expect(mockPrisma.forumPost.update).toHaveBeenCalledWith({
        where: { id: 'post_123' },
        data: expect.objectContaining(updates),
      });
      expect(result).toEqual(updatedPost);
    });

    it('should delete a post and update thread reply count', async () => {
      mockPrisma.forumPost.findUnique.mockResolvedValue({ threadId: 'thread_123' });
      mockPrisma.forumPost.delete.mockResolvedValue(mockPost);
      mockPrisma.forumThread.update.mockResolvedValue({});

      const result = await forumsService.deletePost('post_123');

      expect(mockPrisma.forumPost.delete).toHaveBeenCalledWith({
        where: { id: 'post_123' }
      });
      expect(mockPrisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread_123' },
        data: { replyCount: { decrement: 1 } }
      });
      expect(result).toBe(true);
    });
  });

  describe('Moderation', () => {
    it('should moderate content and log action', async () => {
      const moderationData = {
        action: 'lock' as const,
        targetType: 'thread' as const,
        targetId: 'thread_123',
        moderatorId: 'mod_123',
        reason: 'Inappropriate content',
        siteId: 'site_123',
      };

      mockPrisma.forumModerationLog.create.mockResolvedValue({});
      mockPrisma.forumThread.update.mockResolvedValue({});

      const result = await forumsService.moderateContent(moderationData);

      expect(mockPrisma.forumModerationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining(moderationData),
      });
      expect(mockPrisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread_123' },
        data: { isLocked: true }
      });
      expect(result).toBe(true);
    });

    it('should handle moderation errors gracefully', async () => {
      const moderationData = {
        action: 'lock' as const,
        targetType: 'thread' as const,
        targetId: 'thread_123',
        moderatorId: 'mod_123',
        siteId: 'site_123',
      };

      mockPrisma.forumModerationLog.create.mockRejectedValue(new Error('Database error'));

      const result = await forumsService.moderateContent(moderationData);

      expect(result).toBe(false);
    });
  });

  describe('Search', () => {
    it('should search forums with filters', async () => {
      const searchData = {
        query: 'test search',
        siteId: 'site_123',
        categoryId: 'cat_123',
        sortBy: 'relevance' as const,
        sortOrder: 'desc' as const,
        limit: 20,
        offset: 0,
        tags: ['test'],
      };

      const mockThreads = [{ id: 'thread_123', title: 'Test Thread' }];
      const mockPosts = [{ id: 'post_123', content: 'Test Post' }];

      mockPrisma.forumThread.findMany.mockResolvedValue(mockThreads);
      mockPrisma.forumPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.forumThread.count.mockResolvedValue(1);
      mockPrisma.forumPost.count.mockResolvedValue(1);

      const result = await forumsService.searchForums(searchData);

      expect(mockPrisma.forumThread.findMany).toHaveBeenCalled();
      expect(mockPrisma.forumPost.findMany).toHaveBeenCalled();
      expect(result.threads).toEqual(mockThreads);
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(2);
    });
  });

  describe('Analytics', () => {
    it('should get forum analytics', async () => {
      mockPrisma.forumThread.count.mockResolvedValue(10);
      mockPrisma.forumPost.count.mockResolvedValue(50);
      mockPrisma.forumCategory.count.mockResolvedValue(5);
      mockPrisma.user.count.mockResolvedValue(20);
      mockPrisma.forumCategory.findMany.mockResolvedValue([
        { id: 'cat_123', name: 'Test Category', _count: { threads: 5, posts: 25 } }
      ]);
      mockPrisma.forumThread.findMany.mockResolvedValue([
        { id: 'thread_123', title: 'Popular Thread', viewCount: 100, replyCount: 20 }
      ]);

      const result = await forumsService.getForumAnalytics('site_123', '30d');

      expect(result.totalThreads).toBe(10);
      expect(result.totalPosts).toBe(50);
      expect(result.totalCategories).toBe(5);
      expect(result.activeUsers).toBe(20);
      expect(result.topCategories).toHaveLength(1);
      expect(result.topThreads).toHaveLength(1);
      expect(result.timeRange).toBe('30d');
    });
  });

  describe('Notifications', () => {
    it('should send a notification', async () => {
      const notificationData = {
        userId: 'user_123',
        type: 'thread_reply' as const,
        threadId: 'thread_123',
        triggeredById: 'user_456',
        content: 'New reply in your thread',
        siteId: 'site_123',
      };

      mockPrisma.forumNotification.create.mockResolvedValue({});

      const result = await forumsService.sendNotification(notificationData);

      expect(mockPrisma.forumNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining(notificationData),
      });
      expect(result).toBe(true);
    });

    it('should get user notifications', async () => {
      const mockNotifications = [
        { id: 'notif_123', content: 'Test notification', isRead: false }
      ];
      mockPrisma.forumNotification.findMany.mockResolvedValue(mockNotifications);

      const result = await forumsService.getUserNotifications('user_123', 'site_123');

      expect(mockPrisma.forumNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123', siteId: 'site_123' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should mark notification as read', async () => {
      mockPrisma.forumNotification.update.mockResolvedValue({});

      const result = await forumsService.markNotificationAsRead('notif_123');

      expect(mockPrisma.forumNotification.update).toHaveBeenCalledWith({
        where: { id: 'notif_123' },
        data: { isRead: true }
      });
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle category creation errors', async () => {
      mockPrisma.forumCategory.create.mockRejectedValue(new Error('Database error'));

      await expect(forumsService.createCategory({
        name: 'Test Category',
        slug: 'test-category',
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle thread creation errors', async () => {
      mockPrisma.forumThread.create.mockRejectedValue(new Error('Database error'));

      await expect(forumsService.createThread({
        title: 'Test Thread',
        content: 'Test content',
        categoryId: 'cat_123',
        authorId: 'user_123',
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should return false on delete errors', async () => {
      mockPrisma.forumThread.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await forumsService.deleteThread('thread_123');

      expect(result).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate category data', async () => {
      const invalidCategory = {
        name: '', // Invalid: empty name
        slug: 'test',
        siteId: 'site_123',
      };

      await expect(forumsService.createCategory(invalidCategory as any))
        .rejects.toThrow();
    });

    it('should validate thread data', async () => {
      const invalidThread = {
        title: '', // Invalid: empty title
        content: 'Test content',
        categoryId: 'cat_123',
        authorId: 'user_123',
        siteId: 'site_123',
      };

      await expect(forumsService.createThread(invalidThread as any))
        .rejects.toThrow();
    });

    it('should validate search data', async () => {
      const invalidSearch = {
        query: '', // Invalid: empty query
        siteId: 'site_123',
      };

      await expect(forumsService.searchForums(invalidSearch as any))
        .rejects.toThrow();
    });
  });
}); 