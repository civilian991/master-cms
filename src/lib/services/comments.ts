import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const CommentSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment too long'),
  authorId: z.string().min(1, 'Author ID is required'),
  articleId: z.string().min(1, 'Article ID is required'),
  parentId: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
  isEdited: z.boolean().default(false),
  editedAt: z.date().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export const CommentModerationSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  action: z.enum(['approve', 'reject', 'hide', 'delete', 'flag', 'spam']),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
  reason: z.string().optional(),
  notes: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const CommentReportSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  reporterId: z.string().min(1, 'Reporter ID is required'),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'off_topic', 'misinformation', 'other']),
  description: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const CommentFilterSchema = z.object({
  articleId: z.string().optional(),
  authorId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'hidden', 'spam']).optional(),
  parentId: z.string().optional(),
  hasReplies: z.boolean().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  sortBy: z.enum(['date', 'likes', 'replies', 'author']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const SpamDetectionSchema = z.object({
  content: z.string().min(1),
  authorId: z.string().min(1),
  authorEmail: z.string().email().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  previousComments: z.number().int().min(0).default(0),
  accountAge: z.number().int().min(0).default(0),
  siteId: z.string().min(1),
});

// Types
export type Comment = z.infer<typeof CommentSchema>;
export type CommentModeration = z.infer<typeof CommentModerationSchema>;
export type CommentReport = z.infer<typeof CommentReportSchema>;
export type CommentFilter = z.infer<typeof CommentFilterSchema>;
export type SpamDetection = z.infer<typeof SpamDetectionSchema>;

export interface CommentAnalytics {
  totalComments: number;
  approvedComments: number;
  pendingComments: number;
  spamComments: number;
  rejectedComments: number;
  averageCommentsPerArticle: number;
  topCommenters: Array<{
    authorId: string;
    authorName: string;
    commentCount: number;
    approvalRate: number;
  }>;
  commentTrends: Array<{
    date: string;
    count: number;
    spamCount: number;
  }>;
  moderationStats: {
    averageResponseTime: number;
    moderationActions: Record<string, number>;
  };
  engagementMetrics: {
    averageLikes: number;
    averageReplies: number;
    responseRate: number;
  };
}

export interface CommentThread {
  comment: Comment;
  replies: CommentThread[];
  replyCount: number;
  level: number;
}

export interface SpamScore {
  score: number;
  confidence: number;
  reasons: string[];
  action: 'allow' | 'flag' | 'block';
}

export class CommentsService {
  constructor(private config: {
    enableSpamDetection?: boolean;
    enableModeration?: boolean;
    autoApprove?: boolean;
    maxNestingLevel?: number;
  } = {}) {
    this.config = {
      enableSpamDetection: true,
      enableModeration: true,
      autoApprove: false,
      maxNestingLevel: 5,
      ...config
    };
  }

  // Comment CRUD Operations
  async createComment(commentData: Comment): Promise<Comment> {
    const validatedData = CommentSchema.parse(commentData);

    // Check spam
    let spamScore: SpamScore | null = null;
    if (this.config.enableSpamDetection) {
      const authorStats = await this.getAuthorStats(validatedData.authorId, validatedData.siteId);
      spamScore = await this.detectSpam({
        content: validatedData.content,
        authorId: validatedData.authorId,
        previousComments: authorStats.commentCount,
        accountAge: authorStats.accountAge,
        siteId: validatedData.siteId,
      });
    }

    // Determine initial status
    let status = 'approved';
    if (this.config.enableModeration && !this.config.autoApprove) {
      status = 'pending';
    }
    if (spamScore && spamScore.action === 'block') {
      status = 'spam';
    } else if (spamScore && spamScore.action === 'flag') {
      status = 'pending';
    }

    const comment = await prisma.comment.create({
      data: {
        ...validatedData,
        id: validatedData.id || `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status,
        spamScore: spamScore?.score || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        article: {
          select: { id: true, title: true, slug: true }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      }
    });

    // Send notifications
    await this.sendCommentNotifications(comment);

    // Update article comment count
    await this.updateArticleCommentCount(comment.articleId);

    return comment;
  }

  async getComment(commentId: string): Promise<Comment | null> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        article: {
          select: { id: true, title: true, slug: true }
        },
        parent: {
          select: { id: true, content: true, authorId: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { replies: true, likes: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      }
    });

    return comment;
  }

  async getComments(filter: CommentFilter): Promise<{ comments: Comment[]; total: number }> {
    const validatedFilter = CommentFilterSchema.parse(filter);

    const whereClause: any = {
      siteId: validatedFilter.siteId,
    };

    if (validatedFilter.articleId) {
      whereClause.articleId = validatedFilter.articleId;
    }

    if (validatedFilter.authorId) {
      whereClause.authorId = validatedFilter.authorId;
    }

    if (validatedFilter.status) {
      whereClause.status = validatedFilter.status;
    }

    if (validatedFilter.parentId !== undefined) {
      whereClause.parentId = validatedFilter.parentId;
    }

    if (validatedFilter.hasReplies !== undefined) {
      if (validatedFilter.hasReplies) {
        whereClause.replies = { some: {} };
      } else {
        whereClause.replies = { none: {} };
      }
    }

    if (validatedFilter.fromDate || validatedFilter.toDate) {
      whereClause.createdAt = {};
      if (validatedFilter.fromDate) {
        whereClause.createdAt.gte = new Date(validatedFilter.fromDate);
      }
      if (validatedFilter.toDate) {
        whereClause.createdAt.lte = new Date(validatedFilter.toDate);
      }
    }

    const orderBy = this.getCommentOrderBy(validatedFilter.sortBy, validatedFilter.sortOrder);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          article: {
            select: { id: true, title: true, slug: true }
          },
          _count: {
            select: { replies: true, likes: true }
          }
        },
        orderBy,
        take: validatedFilter.limit,
        skip: validatedFilter.offset,
      }),
      prisma.comment.count({ where: whereClause })
    ]);

    return { comments, total };
  }

  async updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment> {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...updates,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        article: {
          select: { id: true, title: true, slug: true }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      }
    });

    return comment;
  }

  async deleteComment(commentId: string, soft: boolean = true): Promise<boolean> {
    try {
      if (soft) {
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            status: 'deleted',
            content: '[Comment deleted]',
            updatedAt: new Date(),
          }
        });
      } else {
        // Get comment to update article count
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: { articleId: true }
        });

        await prisma.comment.delete({
          where: { id: commentId }
        });

        if (comment) {
          await this.updateArticleCommentCount(comment.articleId);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Comment Threading
  async getCommentThread(articleId: string, options: {
    maxLevel?: number;
    sortBy?: string;
    includeHidden?: boolean;
  } = {}): Promise<CommentThread[]> {
    const { maxLevel = 5, sortBy = 'date', includeHidden = false } = options;

    const whereClause: any = {
      articleId,
      parentId: null,
    };

    if (!includeHidden) {
      whereClause.status = { in: ['approved'] };
    }

    const rootComments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { replies: true, likes: true }
        }
      },
      orderBy: this.getCommentOrderBy(sortBy, 'desc'),
    });

    const threads: CommentThread[] = [];

    for (const comment of rootComments) {
      const thread = await this.buildCommentThread(comment, maxLevel, 0, includeHidden);
      threads.push(thread);
    }

    return threads;
  }

  private async buildCommentThread(
    comment: any,
    maxLevel: number,
    currentLevel: number,
    includeHidden: boolean
  ): Promise<CommentThread> {
    const replies: CommentThread[] = [];

    if (currentLevel < maxLevel) {
      const whereClause: any = { parentId: comment.id };
      if (!includeHidden) {
        whereClause.status = { in: ['approved'] };
      }

      const childComments = await prisma.comment.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { replies: true, likes: true }
          }
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const childComment of childComments) {
        const childThread = await this.buildCommentThread(
          childComment,
          maxLevel,
          currentLevel + 1,
          includeHidden
        );
        replies.push(childThread);
      }
    }

    return {
      comment,
      replies,
      replyCount: comment._count.replies,
      level: currentLevel,
    };
  }

  // Moderation
  async moderateComment(moderationData: CommentModeration): Promise<boolean> {
    const validatedData = CommentModerationSchema.parse(moderationData);

    try {
      // Log moderation action
      await prisma.commentModerationLog.create({
        data: {
          id: `modlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validatedData,
          createdAt: new Date(),
        }
      });

      // Apply moderation action
      const updates: any = { updatedAt: new Date() };

      switch (validatedData.action) {
        case 'approve':
          updates.status = 'approved';
          break;
        case 'reject':
          updates.status = 'rejected';
          break;
        case 'hide':
          updates.status = 'hidden';
          break;
        case 'spam':
          updates.status = 'spam';
          break;
        case 'delete':
          return await this.deleteComment(validatedData.commentId, true);
      }

      if (Object.keys(updates).length > 1) {
        await prisma.comment.update({
          where: { id: validatedData.commentId },
          data: updates
        });
      }

      // Send notification to comment author
      await this.sendModerationNotification(validatedData);

      return true;
    } catch (error) {
      console.error('Error moderating comment:', error);
      return false;
    }
  }

  async reportComment(reportData: CommentReport): Promise<boolean> {
    const validatedData = CommentReportSchema.parse(reportData);

    try {
      await prisma.commentReport.create({
        data: {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validatedData,
          createdAt: new Date(),
        }
      });

      // Auto-flag comment if it has multiple reports
      const reportCount = await prisma.commentReport.count({
        where: { commentId: validatedData.commentId }
      });

      if (reportCount >= 3) {
        await this.moderateComment({
          commentId: validatedData.commentId,
          action: 'flag',
          moderatorId: 'system',
          reason: 'Multiple reports received',
          siteId: validatedData.siteId,
        });
      }

      return true;
    } catch (error) {
      console.error('Error reporting comment:', error);
      return false;
    }
  }

  async getPendingComments(siteId: string, limit: number = 50): Promise<Comment[]> {
    const comments = await prisma.comment.findMany({
      where: {
        siteId,
        status: 'pending'
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        article: {
          select: { id: true, title: true, slug: true }
        },
        reports: {
          include: {
            reporter: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return comments;
  }

  // Spam Detection
  async detectSpam(spamData: SpamDetection): Promise<SpamScore> {
    const validatedData = SpamDetectionSchema.parse(spamData);

    let score = 0;
    const reasons: string[] = [];

    // Content analysis
    const contentScore = this.analyzeContentForSpam(validatedData.content);
    score += contentScore.score;
    reasons.push(...contentScore.reasons);

    // User behavior analysis
    const behaviorScore = this.analyzeUserBehavior(validatedData);
    score += behaviorScore.score;
    reasons.push(...behaviorScore.reasons);

    // Determine action based on score
    let action: 'allow' | 'flag' | 'block' = 'allow';
    if (score >= 80) {
      action = 'block';
    } else if (score >= 50) {
      action = 'flag';
    }

    const confidence = Math.min(score / 100, 1);

    return {
      score,
      confidence,
      reasons,
      action
    };
  }

  private analyzeContentForSpam(content: string): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) {
      score += 30;
      reasons.push('Excessive capital letters');
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 0) {
      score += 20;
      reasons.push('Excessive punctuation');
    }

    // Check for URLs
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 2) {
      score += 40;
      reasons.push('Multiple URLs');
    }

    // Check for repeated words
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    const maxRepeats = Math.max(...wordCounts.values());
    if (maxRepeats > 5) {
      score += 25;
      reasons.push('Repeated words');
    }

    // Check length extremes
    if (content.length < 10) {
      score += 15;
      reasons.push('Very short content');
    } else if (content.length > 2000) {
      score += 20;
      reasons.push('Very long content');
    }

    return { score, reasons };
  }

  private analyzeUserBehavior(data: SpamDetection): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // New account
    if (data.accountAge < 1) {
      score += 25;
      reasons.push('Very new account');
    } else if (data.accountAge < 7) {
      score += 15;
      reasons.push('New account');
    }

    // No previous comments
    if (data.previousComments === 0) {
      score += 20;
      reasons.push('First comment');
    }

    // Rapid posting (would need additional data)
    // This would require tracking recent comment timestamps

    return { score, reasons };
  }

  // Analytics
  async getCommentAnalytics(siteId: string, timeRange: string = '30d'): Promise<CommentAnalytics> {
    const dateFilter = this.getDateFilter(timeRange);

    const [
      totalComments,
      approvedComments,
      pendingComments,
      spamComments,
      rejectedComments,
      articleCount,
      topCommenters,
      commentTrends,
      moderationStats
    ] = await Promise.all([
      prisma.comment.count({
        where: { siteId, createdAt: dateFilter }
      }),
      prisma.comment.count({
        where: { siteId, status: 'approved', createdAt: dateFilter }
      }),
      prisma.comment.count({
        where: { siteId, status: 'pending', createdAt: dateFilter }
      }),
      prisma.comment.count({
        where: { siteId, status: 'spam', createdAt: dateFilter }
      }),
      prisma.comment.count({
        where: { siteId, status: 'rejected', createdAt: dateFilter }
      }),
      prisma.article.count({ where: { siteId } }),
      this.getTopCommenters(siteId, dateFilter),
      this.getCommentTrends(siteId, timeRange),
      this.getModerationStats(siteId, dateFilter)
    ]);

    const averageCommentsPerArticle = articleCount > 0 ? totalComments / articleCount : 0;

    const engagementMetrics = await this.calculateEngagementMetrics(siteId, dateFilter);

    return {
      totalComments,
      approvedComments,
      pendingComments,
      spamComments,
      rejectedComments,
      averageCommentsPerArticle,
      topCommenters,
      commentTrends,
      moderationStats,
      engagementMetrics,
    };
  }

  // Helper methods
  private async getAuthorStats(authorId: string, siteId: string) {
    const [user, commentCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authorId },
        select: { createdAt: true }
      }),
      prisma.comment.count({
        where: { authorId, siteId }
      })
    ]);

    const accountAge = user?.createdAt
      ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return { commentCount, accountAge };
  }

  private async sendCommentNotifications(comment: any): Promise<void> {
    // Implementation for sending notifications
    // This would integrate with your notification system
  }

  private async sendModerationNotification(moderation: CommentModeration): Promise<void> {
    // Implementation for sending moderation notifications
  }

  private async updateArticleCommentCount(articleId: string): Promise<void> {
    const commentCount = await prisma.comment.count({
      where: { articleId, status: 'approved' }
    });

    await prisma.article.update({
      where: { id: articleId },
      data: { commentCount }
    });
  }

  private getCommentOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'likes':
        return { likes: { _count: order } };
      case 'replies':
        return { replies: { _count: order } };
      case 'author':
        return { author: { name: order } };
      case 'date':
      default:
        return { createdAt: order };
    }
  }

  private getDateFilter(timeRange: string) {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return { gte: startDate };
  }

  private async getTopCommenters(siteId: string, dateFilter: any) {
    // Implementation for getting top commenters
    return [];
  }

  private async getCommentTrends(siteId: string, timeRange: string) {
    // Implementation for getting comment trends
    return [];
  }

  private async getModerationStats(siteId: string, dateFilter: any) {
    // Implementation for getting moderation stats
    return {
      averageResponseTime: 0,
      moderationActions: {}
    };
  }

  private async calculateEngagementMetrics(siteId: string, dateFilter: any) {
    // Implementation for calculating engagement metrics
    return {
      averageLikes: 0,
      averageReplies: 0,
      responseRate: 0
    };
  }
}

export const commentsService = new CommentsService({
  enableSpamDetection: true,
  enableModeration: true,
  autoApprove: false,
  maxNestingLevel: 5,
}); 