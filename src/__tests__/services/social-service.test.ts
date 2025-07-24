import { SocialService, UserFollow, ActivityFeed, SocialNotification, SocialPrivacy } from '@/lib/services/social';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userFollow: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    activityFeed: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    socialNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    socialPrivacy: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    socialShare: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    userAchievement: {
      count: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  userFollow: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  activityFeed: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  socialNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  socialPrivacy: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  socialShare: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  userAchievement: {
    count: jest.fn(),
  },
};

describe('SocialService', () => {
  let socialService: SocialService;

  beforeEach(() => {
    socialService = new SocialService({
      enableRealTimeUpdates: true,
      enableSocialIntegration: true,
      enableAnalytics: true,
      maxFeedItems: 1000,
      activityRetentionDays: 90,
    });
    jest.clearAllMocks();
  });

  describe('Following System', () => {
    const mockFollow: UserFollow = {
      id: 'follow_123',
      followerId: 'user_1',
      followingId: 'user_2',
      status: 'active',
      followedAt: new Date(),
      notificationsEnabled: true,
      metadata: {},
      siteId: 'site_123',
    };

    it('should allow user to follow another user', async () => {
      const mockPrivacy = {
        requireFollowApproval: false,
        allowFollowRequests: true,
      };

      mockPrisma.userFollow.findFirst.mockResolvedValue(null); // No existing follow
      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(mockPrivacy);
      mockPrisma.userFollow.create.mockResolvedValue(mockFollow);
      mockPrisma.activityFeed.create.mockResolvedValue({});
      mockPrisma.socialNotification.create.mockResolvedValue({});

      const result = await socialService.followUser(mockFollow);

      expect(mockPrisma.userFollow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          followerId: 'user_1',
          followingId: 'user_2',
          status: 'active',
        }),
      });
      expect(result).toEqual(mockFollow);
    });

    it('should prevent self-following', async () => {
      const selfFollow = {
        ...mockFollow,
        followerId: 'user_1',
        followingId: 'user_1',
      };

      await expect(socialService.followUser(selfFollow))
        .rejects.toThrow('Users cannot follow themselves');
    });

    it('should prevent duplicate follows', async () => {
      const existingFollow = { ...mockFollow, status: 'active' };
      mockPrisma.userFollow.findFirst.mockResolvedValue(existingFollow);

      await expect(socialService.followUser(mockFollow))
        .rejects.toThrow('Already following this user');
    });

    it('should require approval when privacy settings demand it', async () => {
      const mockPrivacy = {
        requireFollowApproval: true,
        allowFollowRequests: true,
      };

      const pendingFollow = { ...mockFollow, status: 'pending' };

      mockPrisma.userFollow.findFirst.mockResolvedValue(null);
      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(mockPrivacy);
      mockPrisma.userFollow.create.mockResolvedValue(pendingFollow);
      mockPrisma.activityFeed.create.mockResolvedValue({});
      mockPrisma.socialNotification.create.mockResolvedValue({});

      const result = await socialService.followUser(mockFollow);

      expect(result.status).toBe('pending');
    });

    it('should get user followers', async () => {
      const followers = [
        {
          ...mockFollow,
          follower: {
            id: 'user_1',
            name: 'Follower 1',
            email: 'follower1@example.com',
            avatar: null,
            bio: 'Bio 1',
            isOnline: true,
            lastActiveAt: new Date(),
          }
        }
      ];

      mockPrisma.userFollow.findMany.mockResolvedValue(followers);
      mockPrisma.userFollow.count.mockResolvedValue(1);
      
      // Mock getUserSocialStats calls
      mockPrisma.userFollow.count
        .mockResolvedValueOnce(10) // followersCount
        .mockResolvedValueOnce(15); // followingCount
      mockPrisma.post.count.mockResolvedValue(5);
      mockPrisma.userAchievement.count.mockResolvedValue(3);
      mockPrisma.socialPrivacy.findUnique.mockResolvedValue({
        profileVisibility: 'public',
        activityVisibility: 'followers',
      });
      mockPrisma.activityFeed.findMany.mockResolvedValue([]);

      const result = await socialService.getFollowers('user_2', 'site_123', {
        status: ['active'],
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.userFollow.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          followingId: 'user_2',
          siteId: 'site_123',
          status: { in: ['active'] },
        }),
        include: expect.any(Object),
        orderBy: { followedAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.followers).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should get user following list', async () => {
      const following = [
        {
          ...mockFollow,
          following: {
            id: 'user_2',
            name: 'Following 1',
            email: 'following1@example.com',
            avatar: null,
            bio: 'Bio 2',
            isOnline: false,
            lastActiveAt: new Date(),
          }
        }
      ];

      mockPrisma.userFollow.findMany.mockResolvedValue(following);
      mockPrisma.userFollow.count.mockResolvedValue(1);
      
      // Mock getUserSocialStats calls
      mockPrisma.userFollow.count
        .mockResolvedValueOnce(20) // followersCount
        .mockResolvedValueOnce(25); // followingCount
      mockPrisma.post.count.mockResolvedValue(8);
      mockPrisma.userAchievement.count.mockResolvedValue(6);
      mockPrisma.socialPrivacy.findUnique.mockResolvedValue({
        profileVisibility: 'public',
        activityVisibility: 'public',
      });
      mockPrisma.activityFeed.findMany.mockResolvedValue([]);

      const result = await socialService.getFollowing('user_1', 'site_123', {
        status: ['active'],
        limit: 50,
        offset: 0,
      });

      expect(result.following).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should get follow status between users', async () => {
      const followRelation = { status: 'active' };
      const followBackRelation = { status: 'active' };

      mockPrisma.userFollow.findFirst
        .mockResolvedValueOnce(followRelation) // user_1 follows user_2
        .mockResolvedValueOnce(followBackRelation) // user_2 follows user_1
        .mockResolvedValueOnce([]) // mutual connections query
        .mockResolvedValueOnce([]); // mutual connections query

      const result = await socialService.getFollowStatus('user_1', 'user_2', 'site_123');

      expect(result.isFollowing).toBe(true);
      expect(result.isFollowedBy).toBe(true);
      expect(result.status).toBe('active');
    });

    it('should unfollow user', async () => {
      mockPrisma.userFollow.updateMany.mockResolvedValue({ count: 1 });

      const result = await socialService.unfollowUser('user_1', 'user_2', 'site_123');

      expect(mockPrisma.userFollow.updateMany).toHaveBeenCalledWith({
        where: {
          followerId: 'user_1',
          followingId: 'user_2',
          siteId: 'site_123',
        },
        data: {
          status: 'blocked',
          unfollowedAt: expect.any(Date),
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('Activity Feed System', () => {
    const mockActivity: ActivityFeed = {
      id: 'activity_123',
      userId: 'user_1',
      actorId: 'user_2',
      action: 'post_created',
      targetType: 'post',
      targetId: 'post_123',
      visibility: 'public',
      priority: 'normal',
      metadata: {},
      createdAt: new Date(),
      siteId: 'site_123',
    };

    it('should create activity feed entry', async () => {
      mockPrisma.activityFeed.findFirst.mockResolvedValue(null); // No duplicate
      mockPrisma.activityFeed.create.mockResolvedValue(mockActivity);
      mockPrisma.activityFeed.findUnique.mockResolvedValue({
        ...mockActivity,
        actor: { id: 'user_2', name: 'Actor User', avatar: null }
      });
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post_123',
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post'
      });

      const result = await socialService.createActivity(mockActivity);

      expect(mockPrisma.activityFeed.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'user_2',
          action: 'post_created',
          targetType: 'post',
          targetId: 'post_123',
        }),
      });
      expect(result.actor.id).toBe('user_2');
    });

    it('should prevent duplicate activities', async () => {
      const existingActivity = { ...mockActivity };
      mockPrisma.activityFeed.findFirst.mockResolvedValue(existingActivity);
      mockPrisma.activityFeed.findUnique.mockResolvedValue({
        ...existingActivity,
        actor: { id: 'user_2', name: 'Actor User', avatar: null }
      });

      const result = await socialService.createActivity(mockActivity);

      expect(mockPrisma.activityFeed.create).not.toHaveBeenCalled();
      expect(result.actor.id).toBe('user_2');
    });

    it('should get user feed with following filter', async () => {
      const following = [
        { followingId: 'user_2' },
        { followingId: 'user_3' },
      ];

      const activities = [mockActivity];

      mockPrisma.userFollow.findMany.mockResolvedValue(following);
      mockPrisma.activityFeed.findMany.mockResolvedValue(activities);
      mockPrisma.activityFeed.count.mockResolvedValue(1);
      mockPrisma.activityFeed.findUnique.mockResolvedValue({
        ...mockActivity,
        actor: { id: 'user_2', name: 'Actor User', avatar: null }
      });
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post_123',
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post'
      });

      const result = await socialService.getUserFeed('user_1', 'site_123', {
        filters: { actions: ['post_created'] },
        includeOwnActivity: false,
        limit: 20,
        offset: 0,
      });

      expect(mockPrisma.activityFeed.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          actorId: { in: ['user_2', 'user_3'] },
          action: { in: ['post_created'] },
        }),
        orderBy: expect.any(Array),
        take: 20,
        skip: 0,
      });
      expect(result.activities).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should get discovery feed for new content', async () => {
      const following = [{ followingId: 'user_2' }];
      const activities = [
        {
          ...mockActivity,
          actorId: 'user_3', // Different user not followed
        }
      ];

      mockPrisma.userFollow.findMany.mockResolvedValue(following);
      mockPrisma.activityFeed.findMany.mockResolvedValue(activities);
      mockPrisma.activityFeed.count.mockResolvedValue(1);
      mockPrisma.activityFeed.findUnique.mockResolvedValue({
        ...activities[0],
        actor: { id: 'user_3', name: 'New User', avatar: null }
      });

      const result = await socialService.getDiscoverFeed('user_1', 'site_123', {
        limit: 20,
        offset: 0,
      });

      expect(mockPrisma.activityFeed.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          visibility: 'public',
          actorId: { notIn: ['user_2', 'user_1'] }, // Exclude followed and self
        }),
        orderBy: expect.any(Array),
        take: 20,
        skip: 0,
      });
      expect(result.activities).toHaveLength(1);
    });
  });

  describe('Social Notifications', () => {
    const mockNotification: SocialNotification = {
      id: 'notification_123',
      userId: 'user_1',
      actorId: 'user_2',
      type: 'new_follower',
      title: 'New Follower',
      message: 'Someone started following you',
      isRead: false,
      isDelivered: false,
      priority: 'normal',
      channels: ['in_app'],
      metadata: {},
      createdAt: new Date(),
      siteId: 'site_123',
    };

    it('should create notification', async () => {
      const mockPrivacy = {
        blockedUsers: [],
        allowFollowRequests: true,
      };

      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(mockPrivacy);
      mockPrisma.socialNotification.create.mockResolvedValue(mockNotification);

      const result = await socialService.createNotification(mockNotification);

      expect(mockPrisma.socialNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_1',
          actorId: 'user_2',
          type: 'new_follower',
          title: 'New Follower',
        }),
      });
      expect(result).toEqual(mockNotification);
    });

    it('should not create notification for blocked users', async () => {
      const mockPrivacy = {
        blockedUsers: ['user_2'], // Actor is blocked
        allowFollowRequests: true,
      };

      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(mockPrivacy);

      const result = await socialService.createNotification(mockNotification);

      expect(mockPrisma.socialNotification.create).not.toHaveBeenCalled();
      expect(result.userId).toBe('user_1'); // Returns original data without creating
    });

    it('should get user notifications', async () => {
      const notifications = [
        {
          ...mockNotification,
          actor: { id: 'user_2', name: 'Actor User', avatar: null }
        }
      ];

      mockPrisma.socialNotification.findMany.mockResolvedValue(notifications);
      mockPrisma.socialNotification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unread count

      const result = await socialService.getUserNotifications('user_1', 'site_123', {
        type: ['new_follower'],
        isRead: false,
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.socialNotification.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user_1',
          siteId: 'site_123',
          type: { in: ['new_follower'] },
          isRead: false,
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
    });

    it('should mark notification as read', async () => {
      mockPrisma.socialNotification.update.mockResolvedValue(mockNotification);

      const result = await socialService.markNotificationAsRead('notification_123');

      expect(mockPrisma.socialNotification.update).toHaveBeenCalledWith({
        where: { id: 'notification_123' },
        data: { isRead: true, readAt: expect.any(Date) }
      });
      expect(result).toBe(true);
    });
  });

  describe('Privacy Controls', () => {
    const mockPrivacy: SocialPrivacy = {
      userId: 'user_1',
      siteId: 'site_123',
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

    it('should update privacy settings', async () => {
      mockPrisma.socialPrivacy.upsert.mockResolvedValue(mockPrivacy);

      const result = await socialService.updatePrivacySettings(mockPrivacy);

      expect(mockPrisma.socialPrivacy.upsert).toHaveBeenCalledWith({
        where: { userId_siteId: { userId: 'user_1', siteId: 'site_123' } },
        update: mockPrivacy,
        create: expect.objectContaining(mockPrivacy),
      });
      expect(result).toEqual(mockPrivacy);
    });

    it('should get user privacy settings with defaults', async () => {
      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(null);

      const result = await socialService.getUserPrivacySettings('user_1', 'site_123');

      expect(result.profileVisibility).toBe('public');
      expect(result.activityVisibility).toBe('followers');
      expect(result.allowFollowRequests).toBe(true);
    });

    it('should block user', async () => {
      const existingPrivacy = { ...mockPrivacy, blockedUsers: [] };
      const updatedPrivacy = { ...mockPrivacy, blockedUsers: ['user_2'] };

      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(existingPrivacy);
      mockPrisma.socialPrivacy.upsert.mockResolvedValue(updatedPrivacy);
      mockPrisma.userFollow.updateMany.mockResolvedValue({ count: 1 });

      const result = await socialService.blockUser('user_1', 'user_2', 'site_123');

      expect(mockPrisma.socialPrivacy.upsert).toHaveBeenCalled();
      expect(mockPrisma.userFollow.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { followerId: 'user_1', followingId: 'user_2' },
            { followerId: 'user_2', followingId: 'user_1' }
          ],
          siteId: 'site_123',
        },
        data: { status: 'blocked' }
      });
      expect(result).toBe(true);
    });

    it('should mute user', async () => {
      const existingPrivacy = { ...mockPrivacy, mutedUsers: [] };
      const updatedPrivacy = { ...mockPrivacy, mutedUsers: ['user_2'] };

      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(existingPrivacy);
      mockPrisma.socialPrivacy.upsert.mockResolvedValue(updatedPrivacy);

      const result = await socialService.muteUser('user_1', 'user_2', 'site_123');

      expect(result).toBe(true);
    });
  });

  describe('Social Sharing', () => {
    it('should share content to social platform', async () => {
      const shareData = {
        userId: 'user_1',
        contentType: 'post' as const,
        contentId: 'post_123',
        platform: 'twitter' as const,
        shareUrl: 'https://example.com/posts/123',
        customMessage: 'Check this out!',
        siteId: 'site_123',
      };

      const createdShare = {
        ...shareData,
        id: 'share_123',
        status: 'pending' as const,
        analytics: { clicks: 0, shares: 0, engagement: 0 },
        createdAt: new Date(),
      };

      mockPrisma.socialShare.create.mockResolvedValue(createdShare);
      mockPrisma.activityFeed.create.mockResolvedValue({});

      const result = await socialService.shareContent(shareData);

      expect(mockPrisma.socialShare.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_1',
          contentType: 'post',
          platform: 'twitter',
          shareUrl: 'https://example.com/posts/123',
        }),
      });
      expect(result).toEqual(createdShare);
    });

    it('should get share analytics', async () => {
      const shareWithAnalytics = {
        id: 'share_123',
        analytics: { clicks: 25, shares: 5, engagement: 12.5 },
        user: { id: 'user_1', name: 'Test User', email: 'test@example.com' }
      };

      mockPrisma.socialShare.findUnique.mockResolvedValue(shareWithAnalytics);

      const result = await socialService.getShareAnalytics('share_123');

      expect(result).toEqual(shareWithAnalytics);
    });
  });

  describe('Analytics', () => {
    it('should get social analytics', async () => {
      const result = await socialService.getSocialAnalytics('site_123', '30d');

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('followNetwork');
      expect(result).toHaveProperty('activityTrends');
      expect(result).toHaveProperty('contentSharing');
    });
  });

  describe('Error Handling', () => {
    it('should handle follow creation errors', async () => {
      mockPrisma.userFollow.create.mockRejectedValue(new Error('Database error'));

      await expect(socialService.followUser({
        followerId: 'user_1',
        followingId: 'user_2',
        siteId: 'site_123',
        status: 'active',
        followedAt: new Date(),
        notificationsEnabled: true,
        metadata: {},
      })).rejects.toThrow('Database error');
    });

    it('should handle activity creation errors', async () => {
      mockPrisma.activityFeed.create.mockRejectedValue(new Error('Activity error'));

      await expect(socialService.createActivity({
        userId: 'user_1',
        actorId: 'user_2',
        action: 'post_created',
        targetType: 'post',
        targetId: 'post_123',
        siteId: 'site_123',
        visibility: 'public',
        priority: 'normal',
        metadata: {},
        createdAt: new Date(),
      })).rejects.toThrow('Activity error');
    });

    it('should handle notification errors gracefully', async () => {
      mockPrisma.socialNotification.update.mockRejectedValue(new Error('Update failed'));

      const result = await socialService.markNotificationAsRead('notification_123');

      expect(result).toBe(false);
    });

    it('should handle privacy update errors gracefully', async () => {
      mockPrisma.socialPrivacy.upsert.mockRejectedValue(new Error('Privacy error'));

      const result = await socialService.blockUser('user_1', 'user_2', 'site_123');

      expect(result).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate follow data', async () => {
      const invalidFollow = {
        followerId: '', // Invalid: empty follower ID
        followingId: 'user_2',
        siteId: 'site_123',
      };

      await expect(socialService.followUser(invalidFollow as any))
        .rejects.toThrow();
    });

    it('should validate activity data', async () => {
      const invalidActivity = {
        userId: 'user_1',
        actorId: '', // Invalid: empty actor ID
        action: 'post_created',
        targetType: 'post',
        targetId: 'post_123',
        siteId: 'site_123',
      };

      await expect(socialService.createActivity(invalidActivity as any))
        .rejects.toThrow();
    });

    it('should validate notification data', async () => {
      const invalidNotification = {
        userId: 'user_1',
        actorId: 'user_2',
        type: 'new_follower',
        title: '', // Invalid: empty title
        message: 'Test message',
        siteId: 'site_123',
      };

      const mockPrivacy = { blockedUsers: [], allowFollowRequests: true };
      mockPrisma.socialPrivacy.findUnique.mockResolvedValue(mockPrivacy);

      await expect(socialService.createNotification(invalidNotification as any))
        .rejects.toThrow();
    });
  });
}); 