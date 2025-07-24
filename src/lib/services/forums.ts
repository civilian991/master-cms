import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const ForumCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  parentId: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isPrivate: z.boolean().default(false),
  moderatorIds: z.array(z.string()).default([]),
  siteId: z.string().min(1, 'Site ID is required'),
  isActive: z.boolean().default(true),
});

export const ForumThreadSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Thread title is required'),
  content: z.string().min(1, 'Thread content is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ForumPostSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1, 'Post content is required'),
  threadId: z.string().min(1, 'Thread ID is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  parentId: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ForumModerationSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide', 'delete', 'lock', 'pin', 'move']),
  targetType: z.enum(['thread', 'post', 'category']),
  targetId: z.string().min(1, 'Target ID is required'),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
  reason: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ForumSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['relevance', 'date', 'replies', 'views']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ForumNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['thread_reply', 'mention', 'thread_locked', 'moderation', 'new_thread']),
  threadId: z.string().optional(),
  postId: z.string().optional(),
  categoryId: z.string().optional(),
  triggeredById: z.string().min(1, 'Triggered by user ID is required'),
  content: z.string().min(1, 'Notification content is required'),
  siteId: z.string().min(1, 'Site ID is required'),
});

// Types
export type ForumCategory = z.infer<typeof ForumCategorySchema>;
export type ForumThread = z.infer<typeof ForumThreadSchema>;
export type ForumPost = z.infer<typeof ForumPostSchema>;
export type ForumModeration = z.infer<typeof ForumModerationSchema>;
export type ForumSearch = z.infer<typeof ForumSearchSchema>;
export type ForumNotification = z.infer<typeof ForumNotificationSchema>;

export interface ForumAnalytics {
  totalThreads: number;
  totalPosts: number;
  totalCategories: number;
  activeUsers: number;
  topCategories: Array<{
    id: string;
    name: string;
    threadCount: number;
    postCount: number;
  }>;
  topThreads: Array<{
    id: string;
    title: string;
    viewCount: number;
    replyCount: number;
  }>;
  engagementMetrics: {
    averagePostsPerThread: number;
    averageThreadsPerDay: number;
    userRetentionRate: number;
  };
  timeRange: string;
}

export interface ForumStats {
  views: number;
  replies: number;
  lastActivity: Date;
  participants: number;
}

export class ForumsService {
  constructor(private config: { enableRealTime?: boolean; enableSearch?: boolean } = {}) {}

  // Category Management
  async createCategory(categoryData: ForumCategory): Promise<ForumCategory> {
    const validatedData = ForumCategorySchema.parse(categoryData);
    
    const category = await prisma.forumCategory.create({
      data: {
        ...validatedData,
        id: validatedData.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return category;
  }

  async getCategories(siteId: string): Promise<ForumCategory[]> {
    const categories = await prisma.forumCategory.findMany({
      where: { 
        siteId,
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            threads: true,
          }
        }
      }
    });

    return categories;
  }

  async getCategoryHierarchy(siteId: string): Promise<ForumCategory[]> {
    const categories = await this.getCategories(siteId);
    
    // Build hierarchical structure
    const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, children: [] }]));
    const rootCategories: any[] = [];

    categories.forEach(category => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId)!.children.push(categoryMap.get(category.id));
      } else {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    return rootCategories;
  }

  async updateCategory(categoryId: string, updates: Partial<ForumCategory>): Promise<ForumCategory> {
    const category = await prisma.forumCategory.update({
      where: { id: categoryId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return category;
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      // Check if category has threads
      const threadCount = await prisma.forumThread.count({
        where: { categoryId }
      });

      if (threadCount > 0) {
        // Soft delete by marking as inactive
        await prisma.forumCategory.update({
          where: { id: categoryId },
          data: { isActive: false, updatedAt: new Date() }
        });
      } else {
        // Hard delete if no threads
        await prisma.forumCategory.delete({
          where: { id: categoryId }
        });
      }

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  // Thread Management
  async createThread(threadData: ForumThread): Promise<ForumThread> {
    const validatedData = ForumThreadSchema.parse(threadData);
    
    const thread = await prisma.forumThread.create({
      data: {
        ...validatedData,
        id: validatedData.id || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        viewCount: 0,
        replyCount: 0,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Send notifications to category followers
    await this.sendCategoryNotifications(thread.categoryId, 'new_thread', thread.id, thread.authorId);

    return thread;
  }

  async getThreads(categoryId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'replies' | 'views';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ threads: ForumThread[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const sortBy = options.sortBy || 'date';
    const sortOrder = options.sortOrder || 'desc';

    const orderBy = this.getThreadOrderBy(sortBy, sortOrder);

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where: { categoryId },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          category: {
            select: { id: true, name: true, slug: true }
          },
          _count: {
            select: { posts: true }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.forumThread.count({
        where: { categoryId }
      })
    ]);

    return { threads, total };
  }

  async getThread(threadId: string): Promise<ForumThread | null> {
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true, slug: true }
        },
        posts: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (thread) {
      // Increment view count
      await prisma.forumThread.update({
        where: { id: threadId },
        data: { viewCount: { increment: 1 } }
      });
    }

    return thread;
  }

  async updateThread(threadId: string, updates: Partial<ForumThread>): Promise<ForumThread> {
    const thread = await prisma.forumThread.update({
      where: { id: threadId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return thread;
  }

  async deleteThread(threadId: string): Promise<boolean> {
    try {
      await prisma.forumThread.delete({
        where: { id: threadId }
      });
      return true;
    } catch (error) {
      console.error('Error deleting thread:', error);
      return false;
    }
  }

  // Post Management
  async createPost(postData: ForumPost): Promise<ForumPost> {
    const validatedData = ForumPostSchema.parse(postData);
    
    const post = await prisma.forumPost.create({
      data: {
        ...validatedData,
        id: validatedData.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        thread: {
          select: { id: true, title: true, authorId: true }
        }
      }
    });

    // Update thread reply count and last activity
    await prisma.forumThread.update({
      where: { id: post.threadId },
      data: {
        replyCount: { increment: 1 },
        lastActivityAt: new Date(),
      }
    });

    // Send notification to thread author and followers
    await this.sendThreadNotifications(post.threadId, 'thread_reply', post.id, post.authorId);

    return post;
  }

  async getPosts(threadId: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ posts: ForumPost[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where: { threadId },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.forumPost.count({
        where: { threadId }
      })
    ]);

    return { posts, total };
  }

  async updatePost(postId: string, updates: Partial<ForumPost>): Promise<ForumPost> {
    const post = await prisma.forumPost.update({
      where: { id: postId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return post;
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { threadId: true }
      });

      if (post) {
        await prisma.forumPost.delete({
          where: { id: postId }
        });

        // Update thread reply count
        await prisma.forumThread.update({
          where: { id: post.threadId },
          data: { replyCount: { decrement: 1 } }
        });
      }

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Moderation
  async moderateContent(moderationData: ForumModeration): Promise<boolean> {
    const validatedData = ForumModerationSchema.parse(moderationData);

    try {
      // Log moderation action
      await prisma.forumModerationLog.create({
        data: {
          id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validatedData,
          createdAt: new Date(),
        }
      });

      // Apply moderation action
      switch (validatedData.action) {
        case 'lock':
          if (validatedData.targetType === 'thread') {
            await prisma.forumThread.update({
              where: { id: validatedData.targetId },
              data: { isLocked: true }
            });
          }
          break;
        case 'pin':
          if (validatedData.targetType === 'thread') {
            await prisma.forumThread.update({
              where: { id: validatedData.targetId },
              data: { isPinned: true }
            });
          }
          break;
        case 'hide':
          if (validatedData.targetType === 'post') {
            await prisma.forumPost.update({
              where: { id: validatedData.targetId },
              data: { isHidden: true }
            });
          }
          break;
        case 'delete':
          if (validatedData.targetType === 'thread') {
            await this.deleteThread(validatedData.targetId);
          } else if (validatedData.targetType === 'post') {
            await this.deletePost(validatedData.targetId);
          }
          break;
      }

      return true;
    } catch (error) {
      console.error('Error moderating content:', error);
      return false;
    }
  }

  // Search
  async searchForums(searchData: ForumSearch): Promise<{
    threads: ForumThread[];
    posts: ForumPost[];
    total: number;
  }> {
    const validatedData = ForumSearchSchema.parse(searchData);

    const whereClause: any = {
      siteId: validatedData.siteId,
      OR: [
        { title: { contains: validatedData.query, mode: 'insensitive' } },
        { content: { contains: validatedData.query, mode: 'insensitive' } },
      ]
    };

    if (validatedData.categoryId) {
      whereClause.categoryId = validatedData.categoryId;
    }

    if (validatedData.authorId) {
      whereClause.authorId = validatedData.authorId;
    }

    if (validatedData.tags.length > 0) {
      whereClause.tags = { hasSome: validatedData.tags };
    }

    if (validatedData.dateFrom || validatedData.dateTo) {
      whereClause.createdAt = {};
      if (validatedData.dateFrom) {
        whereClause.createdAt.gte = new Date(validatedData.dateFrom);
      }
      if (validatedData.dateTo) {
        whereClause.createdAt.lte = new Date(validatedData.dateTo);
      }
    }

    const orderBy = this.getSearchOrderBy(validatedData.sortBy, validatedData.sortOrder);

    const [threads, posts, threadCount, postCount] = await Promise.all([
      prisma.forumThread.findMany({
        where: whereClause,
        include: {
          author: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { posts: true } }
        },
        orderBy,
        take: validatedData.limit,
        skip: validatedData.offset,
      }),
      prisma.forumPost.findMany({
        where: {
          ...whereClause,
          thread: { siteId: validatedData.siteId }
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          thread: { select: { id: true, title: true, categoryId: true } }
        },
        orderBy,
        take: validatedData.limit,
        skip: validatedData.offset,
      }),
      prisma.forumThread.count({ where: whereClause }),
      prisma.forumPost.count({
        where: {
          ...whereClause,
          thread: { siteId: validatedData.siteId }
        }
      })
    ]);

    return {
      threads,
      posts,
      total: threadCount + postCount
    };
  }

  // Analytics
  async getForumAnalytics(siteId: string, timeRange: string = '30d'): Promise<ForumAnalytics> {
    const dateFilter = this.getDateFilter(timeRange);

    const [
      totalThreads,
      totalPosts,
      totalCategories,
      activeUsers,
      topCategories,
      topThreads
    ] = await Promise.all([
      prisma.forumThread.count({
        where: { siteId, createdAt: dateFilter }
      }),
      prisma.forumPost.count({
        where: { 
          siteId,
          createdAt: dateFilter
        }
      }),
      prisma.forumCategory.count({
        where: { siteId, isActive: true }
      }),
      prisma.user.count({
        where: {
          posts: {
            some: {
              siteId,
              createdAt: dateFilter
            }
          }
        }
      }),
      prisma.forumCategory.findMany({
        where: { siteId, isActive: true },
        include: {
          _count: {
            select: {
              threads: {
                where: { createdAt: dateFilter }
              },
              posts: {
                where: { createdAt: dateFilter }
              }
            }
          }
        },
        orderBy: {
          threads: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      prisma.forumThread.findMany({
        where: { siteId, createdAt: dateFilter },
        orderBy: [
          { viewCount: 'desc' },
          { replyCount: 'desc' }
        ],
        take: 10,
        select: {
          id: true,
          title: true,
          viewCount: true,
          replyCount: true
        }
      })
    ]);

    const engagementMetrics = {
      averagePostsPerThread: totalThreads > 0 ? totalPosts / totalThreads : 0,
      averageThreadsPerDay: this.calculateAveragePerDay(totalThreads, timeRange),
      userRetentionRate: this.calculateUserRetention(siteId, timeRange)
    };

    return {
      totalThreads,
      totalPosts,
      totalCategories,
      activeUsers,
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        threadCount: cat._count.threads,
        postCount: cat._count.posts
      })),
      topThreads,
      engagementMetrics,
      timeRange
    };
  }

  // Notifications
  async sendNotification(notificationData: ForumNotification): Promise<boolean> {
    const validatedData = ForumNotificationSchema.parse(notificationData);

    try {
      await prisma.forumNotification.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validatedData,
          isRead: false,
          createdAt: new Date(),
        }
      });

      // If real-time is enabled, emit WebSocket event
      if (this.config.enableRealTime) {
        // WebSocket implementation would go here
        console.log('Real-time notification sent:', validatedData);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async getUserNotifications(userId: string, siteId: string): Promise<ForumNotification[]> {
    const notifications = await prisma.forumNotification.findMany({
      where: { userId, siteId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await prisma.forumNotification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Helper methods
  private async sendCategoryNotifications(categoryId: string, type: string, threadId: string, triggeredById: string): Promise<void> {
    // Implementation for sending notifications to category followers
    // This would typically involve querying category followers and sending notifications
  }

  private async sendThreadNotifications(threadId: string, type: string, postId: string, triggeredById: string): Promise<void> {
    // Implementation for sending notifications to thread followers
    // This would typically involve querying thread followers and sending notifications
  }

  private getThreadOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'replies':
        return { replyCount: order };
      case 'views':
        return { viewCount: order };
      case 'date':
      default:
        return { createdAt: order };
    }
  }

  private getSearchOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'replies':
        return { replyCount: order };
      case 'views':
        return { viewCount: order };
      case 'relevance':
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

  private calculateAveragePerDay(total: number, timeRange: string): number {
    const days = parseInt(timeRange.replace('d', '')) || 30;
    return total / days;
  }

  private async calculateUserRetention(siteId: string, timeRange: string): Promise<number> {
    // Simple retention calculation - users who posted in both periods
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const halfPeriod = Math.floor(days / 2);
    
    const midDate = new Date(Date.now() - (halfPeriod * 24 * 60 * 60 * 1000));
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const [earlierUsers, laterUsers] = await Promise.all([
      prisma.user.count({
        where: {
          posts: {
            some: {
              siteId,
              createdAt: { gte: startDate, lt: midDate }
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          posts: {
            some: {
              siteId,
              createdAt: { gte: midDate }
            }
          }
        }
      })
    ]);

    return earlierUsers > 0 ? (laterUsers / earlierUsers) * 100 : 0;
  }
}

export const forumsService = new ForumsService({
  enableRealTime: true,
  enableSearch: true,
}); 