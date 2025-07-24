import { UserProfilesService, UserProfile, ReputationScore, Achievement } from '@/lib/services/user-profiles';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userProfile: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    reputationScore: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    achievement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userAchievement: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    follow: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    forumPost: {
      count: jest.fn(),
    },
    forumThread: {
      count: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
    like: {
      count: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  userProfile: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reputationScore: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  achievement: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  userAchievement: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  activity: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  follow: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  forumPost: {
    count: jest.fn(),
  },
  forumThread: {
    count: jest.fn(),
  },
  comment: {
    count: jest.fn(),
  },
  like: {
    count: jest.fn(),
  },
};

describe('UserProfilesService', () => {
  let userProfilesService: UserProfilesService;

  beforeEach(() => {
    userProfilesService = new UserProfilesService({
      enableActivityTracking: true,
      enableReputationSystem: true
    });
    jest.clearAllMocks();
  });

  describe('Profile Management', () => {
    const mockProfile: UserProfile = {
      id: 'profile_123',
      userId: 'user_123',
      displayName: 'Test User',
      bio: 'Test bio',
      location: 'Test City',
      website: 'https://example.com',
      avatar: 'https://example.com/avatar.jpg',
      interests: ['programming', 'design'],
      socialLinks: { twitter: 'https://twitter.com/testuser' },
      isPublic: true,
      allowFollowing: true,
      allowMessages: true,
      siteId: 'site_123',
    };

    it('should create a user profile', async () => {
      mockPrisma.userProfile.create.mockResolvedValue(mockProfile);
      mockPrisma.reputationScore.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.reputationScore.updateMany.mockResolvedValue({});

      const result = await userProfilesService.createUserProfile(mockProfile);

      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockProfile.userId,
          displayName: mockProfile.displayName,
          bio: mockProfile.bio,
        }),
      });
      expect(result).toEqual(mockProfile);
    });

    it('should get a user profile', async () => {
      const profileWithUser = {
        ...mockProfile,
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com', createdAt: new Date() },
        _count: { followers: 5, following: 3, posts: 10, threads: 2 }
      };
      mockPrisma.userProfile.findFirst.mockResolvedValue(profileWithUser);

      const result = await userProfilesService.getUserProfile('user_123', 'site_123');

      expect(mockPrisma.userProfile.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user_123', siteId: 'site_123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(profileWithUser);
    });

    it('should update a user profile', async () => {
      const updates = { displayName: 'Updated Name', bio: 'Updated bio' };
      const updatedProfile = { ...mockProfile, ...updates };
      mockPrisma.userProfile.update.mockResolvedValue(updatedProfile);
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.reputationScore.updateMany.mockResolvedValue({});

      const result = await userProfilesService.updateUserProfile('user_123', 'site_123', updates);

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId_siteId: { userId: 'user_123', siteId: 'site_123' } },
        data: expect.objectContaining(updates),
      });
      expect(result).toEqual(updatedProfile);
    });

    it('should search user profiles', async () => {
      const mockProfiles = [mockProfile];
      mockPrisma.userProfile.findMany.mockResolvedValue(mockProfiles);
      mockPrisma.userProfile.count.mockResolvedValue(1);

      const result = await userProfilesService.searchUserProfiles('site_123', {
        query: 'test',
        interests: ['programming'],
        sortBy: 'reputation',
        limit: 20,
        offset: 0
      });

      expect(mockPrisma.userProfile.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          isPublic: true,
          interests: { hasSome: ['programming'] }
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
      expect(result.profiles).toEqual(mockProfiles);
      expect(result.total).toBe(1);
    });
  });

  describe('Reputation System', () => {
    const mockReputation: ReputationScore = {
      userId: 'user_123',
      siteId: 'site_123',
      score: 100,
      level: 'Member',
      totalPosts: 10,
      totalThreads: 2,
      totalLikes: 5,
      totalAchievements: 1,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };

    it('should initialize reputation score', async () => {
      mockPrisma.reputationScore.create.mockResolvedValue(mockReputation);

      const result = await userProfilesService.initializeReputationScore('user_123', 'site_123');

      expect(mockPrisma.reputationScore.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          siteId: 'site_123',
          score: 0,
          level: 'Newcomer',
        }),
      });
      expect(result).toEqual(mockReputation);
    });

    it('should get reputation score', async () => {
      mockPrisma.reputationScore.findFirst.mockResolvedValue(mockReputation);

      const result = await userProfilesService.getReputationScore('user_123', 'site_123');

      expect(mockPrisma.reputationScore.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user_123', siteId: 'site_123' },
      });
      expect(result).toEqual(mockReputation);
    });

    it('should update reputation score', async () => {
      const currentReputation = { ...mockReputation, id: 'rep_123' };
      mockPrisma.reputationScore.findFirst.mockResolvedValue(currentReputation);
      
      const updatedReputation = { ...currentReputation, score: 150, level: 'Regular' };
      mockPrisma.reputationScore.update.mockResolvedValue(updatedReputation);
      mockPrisma.achievement.findMany.mockResolvedValue([]);

      const result = await userProfilesService.updateReputationScore('user_123', 'site_123', {
        scoreChange: 50,
        postsChange: 1
      });

      expect(mockPrisma.reputationScore.update).toHaveBeenCalledWith({
        where: { id: 'rep_123' },
        data: expect.objectContaining({
          score: 150,
          totalPosts: 11,
        }),
      });
      expect(result).toEqual(updatedReputation);
    });

    it('should get leaderboard', async () => {
      const leaderboard = [mockReputation];
      mockPrisma.reputationScore.findMany.mockResolvedValue(leaderboard);

      const result = await userProfilesService.getLeaderboard('site_123', {
        type: 'reputation',
        timeframe: 'month',
        limit: 50
      });

      expect(mockPrisma.reputationScore.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ siteId: 'site_123' }),
        include: expect.any(Object),
        orderBy: { score: 'desc' },
        take: 50,
      });
      expect(result).toEqual(leaderboard);
    });
  });

  describe('Achievement System', () => {
    const mockAchievement: Achievement = {
      id: 'achieve_123',
      name: 'First Post',
      description: 'Create your first post',
      category: 'posting',
      requirements: { posts: 1 },
      points: 10,
      rarity: 'common',
      isActive: true,
      siteId: 'site_123',
    };

    it('should create an achievement', async () => {
      mockPrisma.achievement.create.mockResolvedValue(mockAchievement);

      const result = await userProfilesService.createAchievement(mockAchievement);

      expect(mockPrisma.achievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockAchievement.name,
          description: mockAchievement.description,
          category: mockAchievement.category,
        }),
      });
      expect(result).toEqual(mockAchievement);
    });

    it('should get achievements', async () => {
      const achievements = [mockAchievement];
      mockPrisma.achievement.findMany.mockResolvedValue(achievements);

      const result = await userProfilesService.getAchievements('site_123');

      expect(mockPrisma.achievement.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site_123', isActive: true },
        orderBy: [{ category: 'asc' }, { points: 'desc' }],
      });
      expect(result).toEqual(achievements);
    });

    it('should award achievement to user', async () => {
      const userAchievement = {
        id: 'userachieve_123',
        userId: 'user_123',
        achievementId: 'achieve_123',
        siteId: 'site_123',
        earnedAt: new Date(),
        achievement: mockAchievement
      };

      mockPrisma.userAchievement.findFirst.mockResolvedValue(null);
      mockPrisma.userAchievement.create.mockResolvedValue(userAchievement);
      mockPrisma.reputationScore.findFirst.mockResolvedValue({ id: 'rep_123', score: 100 });
      mockPrisma.reputationScore.update.mockResolvedValue({});
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.reputationScore.updateMany.mockResolvedValue({});

      const result = await userProfilesService.awardAchievement('user_123', 'achieve_123', 'site_123');

      expect(mockPrisma.userAchievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          achievementId: 'achieve_123',
          siteId: 'site_123',
        }),
        include: { achievement: true },
      });
      expect(result).toEqual(userAchievement);
    });

    it('should not award duplicate achievement', async () => {
      const existingAchievement = {
        id: 'userachieve_123',
        userId: 'user_123',
        achievementId: 'achieve_123',
        siteId: 'site_123',
        earnedAt: new Date(),
      };

      mockPrisma.userAchievement.findFirst.mockResolvedValue(existingAchievement);

      const result = await userProfilesService.awardAchievement('user_123', 'achieve_123', 'site_123');

      expect(mockPrisma.userAchievement.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingAchievement);
    });

    it('should check achievements for user', async () => {
      const achievements = [mockAchievement];
      const userStats = {
        totalPosts: 1,
        totalThreads: 0,
        totalComments: 0,
        totalLikes: 0,
        reputationScore: 10,
        achievements: 0,
        followers: 0,
        following: 0,
        joinedDaysAgo: 1,
      };
      const userAchievements: any[] = [];

      mockPrisma.achievement.findMany.mockResolvedValue(achievements);
      mockPrisma.userAchievement.findMany.mockResolvedValue(userAchievements);
      
      // Mock getUserStats method calls
      mockPrisma.userProfile.findFirst.mockResolvedValue({ user: { createdAt: new Date() } });
      mockPrisma.reputationScore.findFirst.mockResolvedValue({ score: 10 });
      mockPrisma.forumPost.count.mockResolvedValue(1);
      mockPrisma.forumThread.count.mockResolvedValue(0);
      mockPrisma.comment.count.mockResolvedValue(0);
      mockPrisma.like.count.mockResolvedValue(0);
      mockPrisma.userAchievement.count.mockResolvedValue(0);
      mockPrisma.follow.count.mockResolvedValue(0);

      // Mock awardAchievement
      mockPrisma.userAchievement.findFirst.mockResolvedValue(null);
      mockPrisma.userAchievement.create.mockResolvedValue({
        id: 'userachieve_123',
        userId: 'user_123',
        achievementId: 'achieve_123',
        siteId: 'site_123',
        achievement: mockAchievement
      });
      mockPrisma.reputationScore.update.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.reputationScore.updateMany.mockResolvedValue({});

      const result = await userProfilesService.checkAchievements('user_123', 'site_123');

      expect(result).toHaveLength(1);
      expect(result[0].achievementId).toBe('achieve_123');
    });
  });

  describe('Following System', () => {
    const mockFollow = {
      id: 'follow_123',
      followerId: 'user_123',
      followingId: 'user_456',
      siteId: 'site_123',
      createdAt: new Date(),
    };

    it('should follow a user', async () => {
      mockPrisma.follow.findFirst.mockResolvedValue(null);
      mockPrisma.follow.create.mockResolvedValue(mockFollow);
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.reputationScore.updateMany.mockResolvedValue({});

      const result = await userProfilesService.followUser('user_123', 'user_456', 'site_123');

      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          followerId: 'user_123',
          followingId: 'user_456',
          siteId: 'site_123',
        }),
      });
      expect(result).toEqual(mockFollow);
    });

    it('should not allow following yourself', async () => {
      await expect(
        userProfilesService.followUser('user_123', 'user_123', 'site_123')
      ).rejects.toThrow('Cannot follow yourself');
    });

    it('should return existing follow if already following', async () => {
      mockPrisma.follow.findFirst.mockResolvedValue(mockFollow);

      const result = await userProfilesService.followUser('user_123', 'user_456', 'site_123');

      expect(mockPrisma.follow.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockFollow);
    });

    it('should unfollow a user', async () => {
      mockPrisma.follow.delete.mockResolvedValue(mockFollow);

      const result = await userProfilesService.unfollowUser('user_123', 'user_456', 'site_123');

      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId_siteId: {
            followerId: 'user_123',
            followingId: 'user_456',
            siteId: 'site_123'
          }
        }
      });
      expect(result).toBe(true);
    });

    it('should get followers', async () => {
      const followers = [{ ...mockFollow, follower: { userProfile: [] } }];
      mockPrisma.follow.findMany.mockResolvedValue(followers);

      const result = await userProfilesService.getFollowers('user_456', 'site_123');

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followingId: 'user_456', siteId: 'site_123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(followers);
    });

    it('should get following', async () => {
      const following = [{ ...mockFollow, following: { userProfile: [] } }];
      mockPrisma.follow.findMany.mockResolvedValue(following);

      const result = await userProfilesService.getFollowing('user_123', 'site_123');

      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: 'user_123', siteId: 'site_123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(following);
    });
  });

  describe('Activity Tracking', () => {
    const mockActivity = {
      id: 'activity_123',
      userId: 'user_123',
      type: 'post_created' as const,
      targetType: 'post' as const,
      targetId: 'post_123',
      metadata: { postTitle: 'Test Post' },
      siteId: 'site_123',
      createdAt: new Date(),
    };

    it('should track activity', async () => {
      mockPrisma.activity.create.mockResolvedValue(mockActivity);
      mockPrisma.reputationScore.updateMany.mockResolvedValue({});

      const result = await userProfilesService.trackActivity(mockActivity);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          type: 'post_created',
          targetType: 'post',
          targetId: 'post_123',
        }),
      });
      expect(result).toEqual(mockActivity);
    });

    it('should get user activity', async () => {
      const activities = [mockActivity];
      mockPrisma.activity.findMany.mockResolvedValue(activities);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await userProfilesService.getUserActivity('user_123', 'site_123', {
        limit: 50,
        offset: 0,
        types: ['post_created']
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          siteId: 'site_123',
          type: { in: ['post_created'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.activities).toEqual(activities);
      expect(result.total).toBe(1);
    });
  });

  describe('User Stats', () => {
    it('should get user stats', async () => {
      mockPrisma.userProfile.findFirst.mockResolvedValue({
        user: { createdAt: new Date() }
      });
      mockPrisma.reputationScore.findFirst.mockResolvedValue({ score: 100 });
      mockPrisma.forumPost.count.mockResolvedValue(10);
      mockPrisma.forumThread.count.mockResolvedValue(2);
      mockPrisma.comment.count.mockResolvedValue(5);
      mockPrisma.like.count.mockResolvedValue(8);
      mockPrisma.userAchievement.count.mockResolvedValue(3);
      mockPrisma.follow.count
        .mockResolvedValueOnce(4) // followers
        .mockResolvedValueOnce(6); // following

      const result = await userProfilesService.getUserStats('user_123', 'site_123');

      expect(result).toEqual({
        totalPosts: 10,
        totalThreads: 2,
        totalComments: 5,
        totalLikes: 8,
        reputationScore: 100,
        achievements: 3,
        followers: 4,
        following: 6,
        joinedDaysAgo: expect.any(Number),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle profile creation errors', async () => {
      mockPrisma.userProfile.create.mockRejectedValue(new Error('Database error'));

      await expect(userProfilesService.createUserProfile({
        userId: 'user_123',
        displayName: 'Test User',
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle reputation update without existing score', async () => {
      mockPrisma.reputationScore.findFirst.mockResolvedValue(null);

      await expect(
        userProfilesService.updateReputationScore('user_123', 'site_123', { scoreChange: 10 })
      ).rejects.toThrow('Reputation score not found');
    });

    it('should handle unfollow errors gracefully', async () => {
      mockPrisma.follow.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await userProfilesService.unfollowUser('user_123', 'user_456', 'site_123');

      expect(result).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate profile data', async () => {
      const invalidProfile = {
        userId: '', // Invalid: empty user ID
        displayName: 'Test User',
        siteId: 'site_123',
      };

      await expect(userProfilesService.createUserProfile(invalidProfile as any))
        .rejects.toThrow();
    });

    it('should validate achievement data', async () => {
      const invalidAchievement = {
        name: '', // Invalid: empty name
        description: 'Test achievement',
        category: 'posting',
        siteId: 'site_123',
      };

      await expect(userProfilesService.createAchievement(invalidAchievement as any))
        .rejects.toThrow();
    });

    it('should validate activity data', async () => {
      const invalidActivity = {
        userId: '', // Invalid: empty user ID
        type: 'post_created',
        siteId: 'site_123',
      };

      await expect(userProfilesService.trackActivity(invalidActivity as any))
        .rejects.toThrow();
    });
  });
}); 