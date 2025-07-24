import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const UserFollowSchema = z.object({
  id: z.string().optional(),
  followerId: z.string().min(1, 'Follower ID is required'),
  followingId: z.string().min(1, 'Following ID is required'),
  status: z.enum(['active', 'pending', 'blocked', 'muted']).default('active'),
  followedAt: z.date().default(() => new Date()),
  notificationsEnabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ActivityFeedSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  actorId: z.string().min(1, 'Actor ID is required'),
  action: z.enum([
    'post_created', 'post_liked', 'post_shared', 'post_commented',
    'user_followed', 'achievement_earned', 'badge_received',
    'community_joined', 'event_created', 'event_attended',
    'profile_updated', 'content_published', 'forum_post_created'
  ]),
  targetType: z.enum(['post', 'comment', 'user', 'community', 'event', 'achievement', 'forum_post']),
  targetId: z.string().min(1, 'Target ID is required'),
  visibility: z.enum(['public', 'followers', 'friends', 'private']).default('followers'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const SocialShareSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  contentType: z.enum(['post', 'article', 'event', 'community', 'achievement']),
  contentId: z.string().min(1, 'Content ID is required'),
  platform: z.enum(['twitter', 'facebook', 'linkedin', 'instagram', 'pinterest', 'whatsapp', 'telegram', 'email']),
  shareUrl: z.string().url('Valid URL is required'),
  customMessage: z.string().optional(),
  scheduledAt: z.date().optional(),
  status: z.enum(['pending', 'published', 'failed', 'scheduled']).default('pending'),
  analytics: z.object({
    clicks: z.number().int().min(0).default(0),
    shares: z.number().int().min(0).default(0),
    engagement: z.number().min(0).default(0),
  }).default({}),
  metadata: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const SocialNotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  actorId: z.string().min(1, 'Actor ID is required'),
  type: z.enum([
    'new_follower', 'follow_request', 'post_liked', 'post_commented', 'post_shared',
    'mention', 'tag', 'achievement_earned', 'friend_request', 'community_invite'
  ]),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  actionUrl: z.string().url().optional(),
  isRead: z.boolean().default(false),
  isDelivered: z.boolean().default(false),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  channels: z.array(z.enum(['in_app', 'email', 'push', 'sms'])).default(['in_app']),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const SocialPrivacySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  profileVisibility: z.enum(['public', 'followers', 'friends', 'private']).default('public'),
  activityVisibility: z.enum(['public', 'followers', 'friends', 'private']).default('followers'),
  allowFollowRequests: z.boolean().default(true),
  requireFollowApproval: z.boolean().default(false),
  showOnlineStatus: z.boolean().default(true),
  allowMentions: z.enum(['everyone', 'followers', 'friends', 'none']).default('everyone'),
  allowDirectMessages: z.enum(['everyone', 'followers', 'friends', 'none']).default('followers'),
  blockedUsers: z.array(z.string()).default([]),
  mutedUsers: z.array(z.string()).default([]),
  mutedKeywords: z.array(z.string()).default([]),
  customSettings: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

// Types
export type UserFollow = z.infer<typeof UserFollowSchema>;
export type ActivityFeed = z.infer<typeof ActivityFeedSchema>;
export type SocialShare = z.infer<typeof SocialShareSchema>;
export type SocialNotification = z.infer<typeof SocialNotificationSchema>;
export type SocialPrivacy = z.infer<typeof SocialPrivacySchema>;

export interface UserSocialProfile {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    isOnline?: boolean;
    lastActiveAt?: Date;
  };
  followersCount: number;
  followingCount: number;
  postsCount: number;
  achievementsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  mutualConnections: number;
  recentActivity: ActivityFeed[];
  privacySettings: SocialPrivacy;
}

export interface ActivityFeedItem extends ActivityFeed {
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
  target?: {
    id: string;
    title?: string;
    content?: string;
    url?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
  };
  timeAgo: string;
}

export interface SocialAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalFollows: number;
    totalActivities: number;
    averageFollowersPerUser: number;
    engagementRate: number;
  };
  followNetwork: {
    topInfluencers: Array<{
      userId: string;
      username: string;
      followersCount: number;
      engagementScore: number;
    }>;
    networkGrowth: Array<{
      date: string;
      newFollows: number;
      totalFollows: number;
    }>;
    mutualConnections: number;
  };
  activityTrends: {
    dailyActivity: Array<{
      date: string;
      activities: number;
      uniqueUsers: number;
    }>;
    popularActions: Array<{
      action: string;
      count: number;
      percentage: number;
    }>;
    peakHours: Array<{
      hour: number;
      activity: number;
    }>;
  };
  contentSharing: {
    totalShares: number;
    sharesByPlatform: Array<{
      platform: string;
      shares: number;
      clicks: number;
      engagement: number;
    }>;
    viralContent: Array<{
      contentId: string;
      title: string;
      shares: number;
      reach: number;
    }>;
  };
}

export interface FeedFilters {
  actorIds?: string[];
  actions?: string[];
  targetTypes?: string[];
  visibility?: string[];
  priority?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasEngagement?: boolean;
}

export class SocialService {
  constructor(private config: {
    enableRealTimeUpdates?: boolean;
    enableSocialIntegration?: boolean;
    enableAnalytics?: boolean;
    maxFeedItems?: number;
    activityRetentionDays?: number;
  } = {}) {
    this.config = {
      enableRealTimeUpdates: true,
      enableSocialIntegration: true,
      enableAnalytics: true,
      maxFeedItems: 1000,
      activityRetentionDays: 90,
      ...config
    };
  }

  // Following System
  async followUser(followData: UserFollow): Promise<UserFollow> {
    const validatedData = UserFollowSchema.parse(followData);

    // Prevent self-following
    if (validatedData.followerId === validatedData.followingId) {
      throw new Error('Users cannot follow themselves');
    }

    // Check if already following
    const existing = await prisma.userFollow.findFirst({
      where: {
        followerId: validatedData.followerId,
        followingId: validatedData.followingId,
        siteId: validatedData.siteId,
      }
    });

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('Already following this user');
      } else {
        // Update existing record
        return await prisma.userFollow.update({
          where: { id: existing.id },
          data: {
            status: 'active',
            followedAt: new Date(),
            notificationsEnabled: validatedData.notificationsEnabled,
          }
        });
      }
    }

    // Check privacy settings
    const targetPrivacy = await this.getUserPrivacySettings(validatedData.followingId, validatedData.siteId);
    let status = validatedData.status;

    if (targetPrivacy.requireFollowApproval) {
      status = 'pending';
    }

    const follow = await prisma.userFollow.create({
      data: {
        ...validatedData,
        id: validatedData.id || `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status,
      }
    });

    // Create activity feed entry
    await this.createActivity({
      userId: validatedData.followingId, // Target user's feed
      actorId: validatedData.followerId,
      action: 'user_followed',
      targetType: 'user',
      targetId: validatedData.followingId,
      visibility: 'public',
      siteId: validatedData.siteId,
    });

    // Send notification
    if (status === 'pending') {
      await this.createNotification({
        userId: validatedData.followingId,
        actorId: validatedData.followerId,
        type: 'follow_request',
        title: 'New Follow Request',
        message: 'Someone requested to follow you',
        siteId: validatedData.siteId,
      });
    } else {
      await this.createNotification({
        userId: validatedData.followingId,
        actorId: validatedData.followerId,
        type: 'new_follower',
        title: 'New Follower',
        message: 'Someone started following you',
        siteId: validatedData.siteId,
      });
    }

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string, siteId: string): Promise<boolean> {
    try {
      await prisma.userFollow.updateMany({
        where: {
          followerId,
          followingId,
          siteId,
        },
        data: {
          status: 'blocked', // Soft delete
          unfollowedAt: new Date(),
        }
      });

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async getFollowers(userId: string, siteId: string, options: {
    status?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ followers: UserSocialProfile[]; total: number }> {
    const {
      status = ['active'],
      search,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = {
      followingId: userId,
      siteId,
      status: { in: status }
    };

    if (search) {
      whereClause.follower = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [follows, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: whereClause,
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              bio: true,
              isOnline: true,
              lastActiveAt: true,
            }
          }
        },
        orderBy: { followedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.userFollow.count({ where: whereClause })
    ]);

    const followers: UserSocialProfile[] = await Promise.all(
      follows.map(async (follow) => {
        const stats = await this.getUserSocialStats(follow.follower.id, siteId);
        const privacy = await this.getUserPrivacySettings(follow.follower.id, siteId);
        const recentActivity = await this.getUserRecentActivity(follow.follower.id, siteId, 5);

        return {
          user: follow.follower,
          ...stats,
          recentActivity,
          privacySettings: privacy,
        };
      })
    );

    return { followers, total };
  }

  async getFollowing(userId: string, siteId: string, options: {
    status?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ following: UserSocialProfile[]; total: number }> {
    const {
      status = ['active'],
      search,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = {
      followerId: userId,
      siteId,
      status: { in: status }
    };

    if (search) {
      whereClause.following = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [follows, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: whereClause,
        include: {
          following: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              bio: true,
              isOnline: true,
              lastActiveAt: true,
            }
          }
        },
        orderBy: { followedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.userFollow.count({ where: whereClause })
    ]);

    const following: UserSocialProfile[] = await Promise.all(
      follows.map(async (follow) => {
        const stats = await this.getUserSocialStats(follow.following.id, siteId);
        const privacy = await this.getUserPrivacySettings(follow.following.id, siteId);
        const recentActivity = await this.getUserRecentActivity(follow.following.id, siteId, 5);

        return {
          user: follow.following,
          ...stats,
          recentActivity,
          privacySettings: privacy,
        };
      })
    );

    return { following, total };
  }

  async getFollowStatus(followerId: string, followingId: string, siteId: string): Promise<{
    isFollowing: boolean;
    isFollowedBy: boolean;
    status?: string;
    mutualConnections: number;
  }> {
    const [following, followedBy, mutualConnections] = await Promise.all([
      prisma.userFollow.findFirst({
        where: { followerId, followingId, siteId }
      }),
      prisma.userFollow.findFirst({
        where: { followerId: followingId, followingId: followerId, siteId }
      }),
      this.getMutualConnections(followerId, followingId, siteId)
    ]);

    return {
      isFollowing: following?.status === 'active',
      isFollowedBy: followedBy?.status === 'active',
      status: following?.status,
      mutualConnections,
    };
  }

  // Activity Feed System
  async createActivity(activityData: ActivityFeed): Promise<ActivityFeedItem> {
    const validatedData = ActivityFeedSchema.parse(activityData);

    // Check if this activity already exists (prevent duplicates)
    const existing = await prisma.activityFeed.findFirst({
      where: {
        actorId: validatedData.actorId,
        action: validatedData.action,
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    if (existing) {
      return await this.getActivityFeedItem(existing.id);
    }

    const activity = await prisma.activityFeed.create({
      data: {
        ...validatedData,
        id: validatedData.id || `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    });

    // Clean up old activities if needed
    await this.cleanupOldActivities(validatedData.siteId);

    return await this.getActivityFeedItem(activity.id);
  }

  async getUserFeed(userId: string, siteId: string, options: {
    filters?: FeedFilters;
    includeOwnActivity?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ activities: ActivityFeedItem[]; total: number; hasMore: boolean }> {
    const {
      filters = {},
      includeOwnActivity = false,
      limit = 20,
      offset = 0
    } = options;

    // Get user's following list
    const following = await prisma.userFollow.findMany({
      where: {
        followerId: userId,
        siteId,
        status: 'active'
      },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);
    if (includeOwnActivity) {
      followingIds.push(userId);
    }

    const whereClause: any = {
      siteId,
      actorId: { in: followingIds },
      OR: [
        { visibility: 'public' },
        { visibility: 'followers' },
        { userId } // User's own feed
      ]
    };

    // Apply filters
    if (filters.actions && filters.actions.length > 0) {
      whereClause.action = { in: filters.actions };
    }

    if (filters.targetTypes && filters.targetTypes.length > 0) {
      whereClause.targetType = { in: filters.targetTypes };
    }

    if (filters.priority && filters.priority.length > 0) {
      whereClause.priority = { in: filters.priority };
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) whereClause.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.createdAt.lte = filters.dateTo;
    }

    const [activities, total] = await Promise.all([
      prisma.activityFeed.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.activityFeed.count({ where: whereClause })
    ]);

    const activityItems = await Promise.all(
      activities.map(activity => this.getActivityFeedItem(activity.id))
    );

    return {
      activities: activityItems,
      total,
      hasMore: total > offset + limit,
    };
  }

  async getDiscoverFeed(userId: string, siteId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ activities: ActivityFeedItem[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    // Get trending/popular activities from users not followed
    const following = await prisma.userFollow.findMany({
      where: {
        followerId: userId,
        siteId,
        status: 'active'
      },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Exclude own content

    const whereClause = {
      siteId,
      visibility: 'public',
      actorId: { notIn: followingIds },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    };

    const [activities, total] = await Promise.all([
      prisma.activityFeed.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.activityFeed.count({ where: whereClause })
    ]);

    const activityItems = await Promise.all(
      activities.map(activity => this.getActivityFeedItem(activity.id))
    );

    return { activities: activityItems, total };
  }

  // Social Sharing
  async shareContent(shareData: SocialShare): Promise<SocialShare> {
    const validatedData = SocialShareSchema.parse(shareData);

    const share = await prisma.socialShare.create({
      data: {
        ...validatedData,
        id: validatedData.id || `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      }
    });

    // Create activity for sharing
    await this.createActivity({
      userId: validatedData.userId,
      actorId: validatedData.userId,
      action: 'post_shared',
      targetType: validatedData.contentType as any,
      targetId: validatedData.contentId,
      visibility: 'public',
      metadata: { platform: validatedData.platform },
      siteId: validatedData.siteId,
    });

    // Process social media sharing if enabled
    if (this.config.enableSocialIntegration) {
      await this.processSocialMediaShare(share);
    }

    return share;
  }

  async getShareAnalytics(shareId: string): Promise<SocialShare | null> {
    return await prisma.socialShare.findUnique({
      where: { id: shareId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  // Social Notifications
  async createNotification(notificationData: SocialNotification): Promise<SocialNotification> {
    const validatedData = SocialNotificationSchema.parse(notificationData);

    // Check user notification preferences
    const privacy = await this.getUserPrivacySettings(validatedData.userId, validatedData.siteId);
    
    // Check if user allows this type of notification
    if (!this.shouldSendNotification(validatedData, privacy)) {
      return validatedData; // Return without creating
    }

    const notification = await prisma.socialNotification.create({
      data: {
        ...validatedData,
        id: validatedData.id || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    });

    // Send real-time notification if enabled
    if (this.config.enableRealTimeUpdates) {
      await this.sendRealTimeNotification(notification);
    }

    return notification;
  }

  async getUserNotifications(userId: string, siteId: string, options: {
    type?: string[];
    isRead?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ notifications: SocialNotification[]; total: number; unreadCount: number }> {
    const {
      type,
      isRead,
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = {
      userId,
      siteId,
    };

    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.socialNotification.findMany({
        where: whereClause,
        include: {
          actor: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.socialNotification.count({ where: whereClause }),
      prisma.socialNotification.count({
        where: { userId, siteId, isRead: false }
      })
    ]);

    return { notifications, total, unreadCount };
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await prisma.socialNotification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() }
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Privacy Controls
  async updatePrivacySettings(privacyData: SocialPrivacy): Promise<SocialPrivacy> {
    const validatedData = SocialPrivacySchema.parse(privacyData);

    const privacy = await prisma.socialPrivacy.upsert({
      where: { userId_siteId: { userId: validatedData.userId, siteId: validatedData.siteId } },
      update: validatedData,
      create: {
        id: `privacy_${validatedData.userId}_${validatedData.siteId}`,
        ...validatedData,
      }
    });

    return privacy;
  }

  async getUserPrivacySettings(userId: string, siteId: string): Promise<SocialPrivacy> {
    const privacy = await prisma.socialPrivacy.findUnique({
      where: { userId_siteId: { userId, siteId } }
    });

    if (!privacy) {
      // Return default privacy settings
      return {
        userId,
        siteId,
        profileVisibility: 'public',
        activityVisibility: 'followers',
        allowFollowRequests: true,
        requireFollowApproval: false,
        showOnlineStatus: true,
        allowMentions: 'everyone',
        allowDirectMessages: 'followers',
        blockedUsers: [],
        mutedUsers: [],
        mutedKeywords: [],
        customSettings: {},
      };
    }

    return privacy;
  }

  async blockUser(blockerId: string, blockedId: string, siteId: string): Promise<boolean> {
    try {
      // Update privacy settings to include blocked user
      const privacy = await this.getUserPrivacySettings(blockerId, siteId);
      const updatedBlockedUsers = [...new Set([...privacy.blockedUsers, blockedId])];

      await this.updatePrivacySettings({
        ...privacy,
        blockedUsers: updatedBlockedUsers,
      });

      // Remove any existing follow relationships
      await prisma.userFollow.updateMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId }
          ],
          siteId,
        },
        data: { status: 'blocked' }
      });

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  async muteUser(muterId: string, mutedId: string, siteId: string): Promise<boolean> {
    try {
      const privacy = await this.getUserPrivacySettings(muterId, siteId);
      const updatedMutedUsers = [...new Set([...privacy.mutedUsers, mutedId])];

      await this.updatePrivacySettings({
        ...privacy,
        mutedUsers: updatedMutedUsers,
      });

      return true;
    } catch (error) {
      console.error('Error muting user:', error);
      return false;
    }
  }

  // Analytics
  async getSocialAnalytics(siteId: string, timeRange: string = '30d'): Promise<SocialAnalytics> {
    const dateFilter = this.getDateFilter(timeRange);

    const [
      overview,
      followNetwork,
      activityTrends,
      contentSharing
    ] = await Promise.all([
      this.getOverviewAnalytics(siteId, dateFilter),
      this.getFollowNetworkAnalytics(siteId, dateFilter),
      this.getActivityTrendsAnalytics(siteId, dateFilter),
      this.getContentSharingAnalytics(siteId, dateFilter)
    ]);

    return {
      overview,
      followNetwork,
      activityTrends,
      contentSharing,
    };
  }

  // Helper methods
  private async getUserSocialStats(userId: string, siteId: string) {
    const [followersCount, followingCount, postsCount, achievementsCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: userId, siteId, status: 'active' }
      }),
      prisma.userFollow.count({
        where: { followerId: userId, siteId, status: 'active' }
      }),
      prisma.post.count({
        where: { authorId: userId, siteId, status: 'published' }
      }),
      prisma.userAchievement.count({
        where: { userId, siteId, isCompleted: true }
      })
    ]);

    return {
      followersCount,
      followingCount,
      postsCount,
      achievementsCount,
      mutualConnections: 0, // Would be calculated based on current user
    };
  }

  private async getUserRecentActivity(userId: string, siteId: string, limit: number): Promise<ActivityFeed[]> {
    return await prisma.activityFeed.findMany({
      where: { actorId: userId, siteId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async getMutualConnections(user1Id: string, user2Id: string, siteId: string): Promise<number> {
    const user1Following = await prisma.userFollow.findMany({
      where: { followerId: user1Id, siteId, status: 'active' },
      select: { followingId: true }
    });

    const user2Following = await prisma.userFollow.findMany({
      where: { followerId: user2Id, siteId, status: 'active' },
      select: { followingId: true }
    });

    const user1FollowingIds = new Set(user1Following.map(f => f.followingId));
    const user2FollowingIds = new Set(user2Following.map(f => f.followingId));

    const mutual = [...user1FollowingIds].filter(id => user2FollowingIds.has(id));
    return mutual.length;
  }

  private async getActivityFeedItem(activityId: string): Promise<ActivityFeedItem> {
    const activity = await prisma.activityFeed.findUnique({
      where: { id: activityId },
      include: {
        actor: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    const target = await this.getActivityTarget(activity.targetType, activity.targetId);
    const engagement = await this.getActivityEngagement(activityId);
    const timeAgo = this.formatTimeAgo(activity.createdAt);

    return {
      ...activity,
      target,
      engagement,
      timeAgo,
    };
  }

  private async getActivityTarget(targetType: string, targetId: string) {
    switch (targetType) {
      case 'post':
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { id: true, title: true, content: true, slug: true }
        });
        return post ? {
          id: post.id,
          title: post.title,
          content: post.content?.substring(0, 100) + '...',
          url: `/posts/${post.slug}`
        } : null;
      
      case 'user':
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, avatar: true }
        });
        return user ? {
          id: user.id,
          title: user.name,
          url: `/users/${user.id}`
        } : null;
      
      default:
        return null;
    }
  }

  private async getActivityEngagement(activityId: string) {
    // Mock engagement data - would be calculated from likes, comments, shares
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
    };
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  private async cleanupOldActivities(siteId: string): Promise<void> {
    if (!this.config.activityRetentionDays) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.activityRetentionDays);

    await prisma.activityFeed.deleteMany({
      where: {
        siteId,
        createdAt: { lt: cutoffDate }
      }
    });
  }

  private shouldSendNotification(notification: SocialNotification, privacy: SocialPrivacy): boolean {
    // Check if user is blocked
    if (privacy.blockedUsers.includes(notification.actorId)) {
      return false;
    }

    // Check notification type preferences
    switch (notification.type) {
      case 'mention':
        return privacy.allowMentions !== 'none';
      case 'new_follower':
      case 'follow_request':
        return privacy.allowFollowRequests;
      default:
        return true;
    }
  }

  private async sendRealTimeNotification(notification: SocialNotification): Promise<void> {
    // Implementation for real-time notifications (WebSocket, push notifications, etc.)
    console.log('Sending real-time notification:', notification.id);
  }

  private async processSocialMediaShare(share: SocialShare): Promise<void> {
    // Implementation for social media platform integrations
    console.log('Processing social media share:', share.id, share.platform);
  }

  private getDateFilter(timeRange: string) {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return { gte: startDate };
  }

  private async getOverviewAnalytics(siteId: string, dateFilter: any) {
    // Implementation for overview analytics
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalFollows: 0,
      totalActivities: 0,
      averageFollowersPerUser: 0,
      engagementRate: 0,
    };
  }

  private async getFollowNetworkAnalytics(siteId: string, dateFilter: any) {
    // Implementation for follow network analytics
    return {
      topInfluencers: [],
      networkGrowth: [],
      mutualConnections: 0,
    };
  }

  private async getActivityTrendsAnalytics(siteId: string, dateFilter: any) {
    // Implementation for activity trends analytics
    return {
      dailyActivity: [],
      popularActions: [],
      peakHours: [],
    };
  }

  private async getContentSharingAnalytics(siteId: string, dateFilter: any) {
    // Implementation for content sharing analytics
    return {
      totalShares: 0,
      sharesByPlatform: [],
      viralContent: [],
    };
  }
}

export const socialService = new SocialService({
  enableRealTimeUpdates: true,
  enableSocialIntegration: true,
  enableAnalytics: true,
  maxFeedItems: 1000,
  activityRetentionDays: 90,
}); 