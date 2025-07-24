import { CommentsService, Comment, CommentModeration, CommentReport } from '@/lib/services/comments';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    commentModerationLog: {
      create: jest.fn(),
    },
    commentReport: {
      create: jest.fn(),
      count: jest.fn(),
    },
    article: {
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  comment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  commentModerationLog: {
    create: jest.fn(),
  },
  commentReport: {
    create: jest.fn(),
    count: jest.fn(),
  },
  article: {
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('CommentsService', () => {
  let commentsService: CommentsService;

  beforeEach(() => {
    commentsService = new CommentsService({
      enableSpamDetection: true,
      enableModeration: true,
      autoApprove: false,
      maxNestingLevel: 5,
    });
    jest.clearAllMocks();
  });

  describe('Comment CRUD Operations', () => {
    const mockComment: Comment = {
      id: 'comment_123',
      content: 'This is a test comment',
      authorId: 'user_123',
      articleId: 'article_123',
      siteId: 'site_123',
      isEdited: false,
      metadata: {},
    };

    it('should create a comment', async () => {
      const createdComment = {
        ...mockComment,
        status: 'pending',
        spamScore: 10,
        author: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        article: { id: 'article_123', title: 'Test Article', slug: 'test-article' },
        _count: { replies: 0, likes: 0 }
      };

      mockPrisma.user.findUnique.mockResolvedValue({ createdAt: new Date() });
      mockPrisma.comment.count.mockResolvedValue(5);
      mockPrisma.comment.create.mockResolvedValue(createdComment);
      mockPrisma.article.update.mockResolvedValue({});

      const result = await commentsService.createComment(mockComment);

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: mockComment.content,
          authorId: mockComment.authorId,
          articleId: mockComment.articleId,
          status: expect.any(String),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdComment);
    });

    it('should get a comment', async () => {
      const commentWithDetails = {
        ...mockComment,
        author: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        article: { id: 'article_123', title: 'Test Article', slug: 'test-article' },
        parent: null,
        replies: [],
        _count: { replies: 0, likes: 5 }
      };

      mockPrisma.comment.findUnique.mockResolvedValue(commentWithDetails);

      const result = await commentsService.getComment('comment_123');

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment_123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(commentWithDetails);
    });

    it('should get comments with filters', async () => {
      const mockComments = [mockComment];
      mockPrisma.comment.findMany.mockResolvedValue(mockComments);
      mockPrisma.comment.count.mockResolvedValue(1);

      const filter = {
        articleId: 'article_123',
        status: 'approved' as const,
        sortBy: 'date' as const,
        sortOrder: 'desc' as const,
        limit: 50,
        offset: 0,
        siteId: 'site_123',
      };

      const result = await commentsService.getComments(filter);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          articleId: 'article_123',
          status: 'approved',
          siteId: 'site_123',
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.comments).toEqual(mockComments);
      expect(result.total).toBe(1);
    });

    it('should update a comment', async () => {
      const updates = { content: 'Updated comment content' };
      const updatedComment = { ...mockComment, ...updates, isEdited: true };
      mockPrisma.comment.update.mockResolvedValue(updatedComment);

      const result = await commentsService.updateComment('comment_123', updates);

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment_123' },
        data: expect.objectContaining({
          ...updates,
          isEdited: true,
          editedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedComment);
    });

    it('should soft delete a comment by default', async () => {
      mockPrisma.comment.update.mockResolvedValue(mockComment);

      const result = await commentsService.deleteComment('comment_123');

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment_123' },
        data: {
          status: 'deleted',
          content: '[Comment deleted]',
          updatedAt: expect.any(Date),
        }
      });
      expect(result).toBe(true);
    });

    it('should hard delete a comment when specified', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ articleId: 'article_123' });
      mockPrisma.comment.delete.mockResolvedValue(mockComment);
      mockPrisma.comment.count.mockResolvedValue(5);
      mockPrisma.article.update.mockResolvedValue({});

      const result = await commentsService.deleteComment('comment_123', false);

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment_123' }
      });
      expect(mockPrisma.article.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Comment Threading', () => {
    it('should get comment thread for article', async () => {
      const rootComment = {
        id: 'comment_1',
        content: 'Root comment',
        parentId: null,
        author: { id: 'user_1', name: 'User 1', email: 'user1@example.com' },
        _count: { replies: 1, likes: 5 }
      };

      const childComment = {
        id: 'comment_2',
        content: 'Child comment',
        parentId: 'comment_1',
        author: { id: 'user_2', name: 'User 2', email: 'user2@example.com' },
        _count: { replies: 0, likes: 2 }
      };

      mockPrisma.comment.findMany
        .mockResolvedValueOnce([rootComment])
        .mockResolvedValueOnce([childComment])
        .mockResolvedValueOnce([]);

      const result = await commentsService.getCommentThread('article_123');

      expect(result).toHaveLength(1);
      expect(result[0].comment.id).toBe('comment_1');
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].comment.id).toBe('comment_2');
    });

    it('should respect maximum nesting level', async () => {
      const comments = [
        { id: 'comment_1', parentId: null, _count: { replies: 1, likes: 0 } },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(comments);

      const result = await commentsService.getCommentThread('article_123', { maxLevel: 2 });

      expect(result).toHaveLength(1);
    });
  });

  describe('Moderation', () => {
    const mockModeration: CommentModeration = {
      commentId: 'comment_123',
      action: 'approve',
      moderatorId: 'mod_123',
      reason: 'Good comment',
      siteId: 'site_123',
    };

    it('should moderate a comment', async () => {
      mockPrisma.commentModerationLog.create.mockResolvedValue({});
      mockPrisma.comment.update.mockResolvedValue({});

      const result = await commentsService.moderateComment(mockModeration);

      expect(mockPrisma.commentModerationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining(mockModeration),
      });
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment_123' },
        data: expect.objectContaining({ status: 'approved' }),
      });
      expect(result).toBe(true);
    });

    it('should handle different moderation actions', async () => {
      mockPrisma.commentModerationLog.create.mockResolvedValue({});
      mockPrisma.comment.update.mockResolvedValue({});

      const actions = ['approve', 'reject', 'hide', 'spam'] as const;

      for (const action of actions) {
        await commentsService.moderateComment({
          ...mockModeration,
          action,
        });

        expect(mockPrisma.comment.update).toHaveBeenCalledWith({
          where: { id: 'comment_123' },
          data: expect.objectContaining({ status: action }),
        });
      }
    });

    it('should report a comment', async () => {
      const reportData: CommentReport = {
        commentId: 'comment_123',
        reporterId: 'user_123',
        reason: 'spam',
        description: 'This looks like spam',
        siteId: 'site_123',
      };

      mockPrisma.commentReport.create.mockResolvedValue({});
      mockPrisma.commentReport.count.mockResolvedValue(1);

      const result = await commentsService.reportComment(reportData);

      expect(mockPrisma.commentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining(reportData),
      });
      expect(result).toBe(true);
    });

    it('should auto-flag comment with multiple reports', async () => {
      const reportData: CommentReport = {
        commentId: 'comment_123',
        reporterId: 'user_123',
        reason: 'spam',
        siteId: 'site_123',
      };

      mockPrisma.commentReport.create.mockResolvedValue({});
      mockPrisma.commentReport.count.mockResolvedValue(3);
      mockPrisma.commentModerationLog.create.mockResolvedValue({});
      mockPrisma.comment.update.mockResolvedValue({});

      const result = await commentsService.reportComment(reportData);

      expect(mockPrisma.commentModerationLog.create).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should get pending comments', async () => {
      const pendingComments = [
        { id: 'comment_1', status: 'pending', content: 'Pending comment 1' },
        { id: 'comment_2', status: 'pending', content: 'Pending comment 2' },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(pendingComments);

      const result = await commentsService.getPendingComments('site_123', 50);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site_123', status: 'pending' },
        include: expect.any(Object),
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      expect(result).toEqual(pendingComments);
    });
  });

  describe('Spam Detection', () => {
    it('should detect spam based on content analysis', async () => {
      const spamData = {
        content: 'BUY NOW!!! AMAZING DEALS!!! CLICK HERE!!! https://spam.com https://more-spam.com',
        authorId: 'user_123',
        previousComments: 0,
        accountAge: 0,
        siteId: 'site_123',
      };

      const result = await commentsService.detectSpam(spamData);

      expect(result.score).toBeGreaterThan(50);
      expect(result.action).toBe('flag');
      expect(result.reasons).toContain('Excessive capital letters');
      expect(result.reasons).toContain('Multiple URLs');
    });

    it('should detect spam based on user behavior', async () => {
      const spamData = {
        content: 'Normal content here',
        authorId: 'user_123',
        previousComments: 0,
        accountAge: 0,
        siteId: 'site_123',
      };

      const result = await commentsService.detectSpam(spamData);

      expect(result.reasons).toContain('Very new account');
      expect(result.reasons).toContain('First comment');
    });

    it('should allow legitimate content', async () => {
      const spamData = {
        content: 'This is a thoughtful and well-written comment about the article topic.',
        authorId: 'user_123',
        previousComments: 10,
        accountAge: 30,
        siteId: 'site_123',
      };

      const result = await commentsService.detectSpam(spamData);

      expect(result.score).toBeLessThan(50);
      expect(result.action).toBe('allow');
    });
  });

  describe('Analytics', () => {
    it('should get comment analytics', async () => {
      mockPrisma.comment.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // approved
        .mockResolvedValueOnce(15)  // pending
        .mockResolvedValueOnce(3)   // spam
        .mockResolvedValueOnce(2);  // rejected

      mockPrisma.article.count.mockResolvedValue(10);

      const result = await commentsService.getCommentAnalytics('site_123', '30d');

      expect(result.totalComments).toBe(100);
      expect(result.approvedComments).toBe(80);
      expect(result.pendingComments).toBe(15);
      expect(result.spamComments).toBe(3);
      expect(result.rejectedComments).toBe(2);
      expect(result.averageCommentsPerArticle).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle comment creation errors', async () => {
      mockPrisma.comment.create.mockRejectedValue(new Error('Database error'));

      await expect(commentsService.createComment({
        content: 'Test comment',
        authorId: 'user_123',
        articleId: 'article_123',
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle moderation errors gracefully', async () => {
      mockPrisma.commentModerationLog.create.mockRejectedValue(new Error('Moderation error'));

      const result = await commentsService.moderateComment({
        commentId: 'comment_123',
        action: 'approve',
        moderatorId: 'mod_123',
        siteId: 'site_123',
      });

      expect(result).toBe(false);
    });

    it('should handle delete errors gracefully', async () => {
      mockPrisma.comment.update.mockRejectedValue(new Error('Delete error'));

      const result = await commentsService.deleteComment('comment_123');

      expect(result).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate comment data', async () => {
      const invalidComment = {
        content: '', // Invalid: empty content
        authorId: 'user_123',
        articleId: 'article_123',
        siteId: 'site_123',
      };

      await expect(commentsService.createComment(invalidComment as any))
        .rejects.toThrow();
    });

    it('should validate moderation data', async () => {
      const invalidModeration = {
        commentId: '', // Invalid: empty comment ID
        action: 'approve',
        moderatorId: 'mod_123',
        siteId: 'site_123',
      };

      await expect(commentsService.moderateComment(invalidModeration as any))
        .rejects.toThrow();
    });

    it('should validate filter data', async () => {
      const invalidFilter = {
        siteId: '', // Invalid: empty site ID
        limit: 50,
        offset: 0,
      };

      await expect(commentsService.getComments(invalidFilter as any))
        .rejects.toThrow();
    });

    it('should validate content length', async () => {
      const tooLongComment = {
        content: 'a'.repeat(6000), // Invalid: too long
        authorId: 'user_123',
        articleId: 'article_123',
        siteId: 'site_123',
      };

      await expect(commentsService.createComment(tooLongComment as any))
        .rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete comment workflow', async () => {
      // Create comment
      mockPrisma.user.findUnique.mockResolvedValue({ createdAt: new Date() });
      mockPrisma.comment.count.mockResolvedValue(0);
      mockPrisma.comment.create.mockResolvedValue({
        id: 'comment_123',
        status: 'pending',
        spamScore: 25,
      });
      mockPrisma.article.update.mockResolvedValue({});

      const comment = await commentsService.createComment({
        content: 'Test comment',
        authorId: 'user_123',
        articleId: 'article_123',
        siteId: 'site_123',
      });

      expect(comment.status).toBe('pending');

      // Moderate comment
      mockPrisma.commentModerationLog.create.mockResolvedValue({});
      mockPrisma.comment.update.mockResolvedValue({});

      const moderationResult = await commentsService.moderateComment({
        commentId: 'comment_123',
        action: 'approve',
        moderatorId: 'mod_123',
        siteId: 'site_123',
      });

      expect(moderationResult).toBe(true);
    });

    it('should handle spam detection workflow', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ createdAt: new Date() });
      mockPrisma.comment.count.mockResolvedValue(0);
      mockPrisma.comment.create.mockResolvedValue({
        id: 'comment_123',
        status: 'spam',
        spamScore: 85,
      });
      mockPrisma.article.update.mockResolvedValue({});

      const spamComment = await commentsService.createComment({
        content: 'BUY NOW!!! CLICK HERE!!! https://spam.com https://more-spam.com',
        authorId: 'user_123',
        articleId: 'article_123',
        siteId: 'site_123',
      });

      expect(spamComment.status).toBe('spam');
      expect(spamComment.spamScore).toBeGreaterThan(80);
    });
  });
}); 