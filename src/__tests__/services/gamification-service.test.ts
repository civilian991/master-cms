import { GamificationService, AchievementRule, PointTransaction, UserAchievement } from '@/lib/services/gamification';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    achievementRule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userAchievement: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    pointTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    badge: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    leaderboard: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userStats: {
      upsert: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  achievementRule: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  userAchievement: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  pointTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  badge: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  leaderboard: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  userStats: {
    upsert: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('GamificationService', () => {
  let gamificationService: GamificationService;

  beforeEach(() => {
    gamificationService = new GamificationService({
      enableAutoAchievements: true,
      enableNotifications: true,
      pointsMultiplier: 1.0,
      cacheEnabled: true,
    });
    jest.clearAllMocks();
  });

  describe('Achievement Management', () => {
    const mockAchievement: AchievementRule = {
      id: 'achievement_123',
      name: 'First Post',
      description: 'Create your first post',
      category: 'Content Creation',
      type: 'milestone',
      rarity: 'common',
      points: 10,
      conditions: {
        action: 'post_created',
        target: 1,
        timeframe: 'all_time',
        consecutive: false,
        metadata: {},
      },
      isActive: true,
      isRepeatable: false,
      siteId: 'site_123',
    };

    it('should create an achievement rule', async () => {
      const createdAchievement = { ...mockAchievement, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.achievementRule.create.mockResolvedValue(createdAchievement);

      const result = await gamificationService.createAchievementRule(mockAchievement);

      expect(mockPrisma.achievementRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockAchievement.name,
          description: mockAchievement.description,
          category: mockAchievement.category,
          type: mockAchievement.type,
          points: mockAchievement.points,
        }),
      });
      expect(result).toEqual(createdAchievement);
    });

    it('should get achievement rules with filters', async () => {
      const achievements = [mockAchievement];
      mockPrisma.achievementRule.findMany.mockResolvedValue(achievements);
      mockPrisma.achievementRule.count.mockResolvedValue(1);

      const options = {
        category: 'Content Creation',
        type: ['milestone'],
        rarity: ['common'],
        isActive: true,
        limit: 50,
        offset: 0,
      };

      const result = await gamificationService.getAchievementRules('site_123', options);

      expect(mockPrisma.achievementRule.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          category: 'Content Creation',
          type: { in: ['milestone'] },
          rarity: { in: ['common'] },
          isActive: true,
        }),
        orderBy: expect.any(Array),
        take: 50,
        skip: 0,
      });
      expect(result.rules).toEqual(achievements);
      expect(result.total).toBe(1);
    });

    it('should update an achievement rule', async () => {
      const updates = { name: 'Updated Achievement', points: 20 };
      const updatedAchievement = { ...mockAchievement, ...updates, updatedAt: new Date() };

      mockPrisma.achievementRule.update.mockResolvedValue(updatedAchievement);

      const result = await gamificationService.updateAchievementRule('achievement_123', updates);

      expect(mockPrisma.achievementRule.update).toHaveBeenCalledWith({
        where: { id: 'achievement_123' },
        data: expect.objectContaining(updates),
      });
      expect(result.name).toBe('Updated Achievement');
      expect(result.points).toBe(20);
    });
  });

  describe('Points Management', () => {
    const mockPointTransaction: PointTransaction = {
      id: 'points_123',
      userId: 'user_123',
      points: 50,
      reason: 'Test points award',
      category: 'achievement',
      sourceType: 'achievement',
      sourceId: 'achievement_123',
      siteId: 'site_123',
      metadata: {},
    };

    it('should award points to user', async () => {
      const createdTransaction = { ...mockPointTransaction, createdAt: new Date() };
      mockPrisma.pointTransaction.create.mockResolvedValue(createdTransaction);
      mockPrisma.userStats.upsert.mockResolvedValue({});

      const result = await gamificationService.awardPoints(mockPointTransaction);

      expect(mockPrisma.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          points: 50,
          reason: 'Test points award',
          category: 'achievement',
        }),
      });
      expect(mockPrisma.userStats.upsert).toHaveBeenCalled();
      expect(result).toEqual(createdTransaction);
    });

    it('should apply points multiplier', async () => {
      const serviceWithMultiplier = new GamificationService({ pointsMultiplier: 2.0 });
      const createdTransaction = { ...mockPointTransaction, points: 100, createdAt: new Date() };
      
      mockPrisma.pointTransaction.create.mockResolvedValue(createdTransaction);
      mockPrisma.userStats.upsert.mockResolvedValue({});

      await serviceWithMultiplier.awardPoints(mockPointTransaction);

      expect(mockPrisma.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          points: 100, // 50 * 2.0
        }),
      });
    });

    it('should get user points and rank', async () => {
      const pointsAggregate = { _sum: { points: 250 } };
      const availableAggregate = { _sum: { points: 200 } };
      const recentTransactions = [mockPointTransaction];

      mockPrisma.pointTransaction.aggregate
        .mockResolvedValueOnce(pointsAggregate)
        .mockResolvedValueOnce(availableAggregate);
      mockPrisma.userStats.count.mockResolvedValue(5); // 5 users with more points
      mockPrisma.pointTransaction.findMany.mockResolvedValue(recentTransactions);

      const result = await gamificationService.getUserPoints('user_123', 'site_123');

      expect(result.totalPoints).toBe(250);
      expect(result.availablePoints).toBe(200);
      expect(result.rank).toBe(6); // 5 users ahead + 1
      expect(result.recentTransactions).toEqual(recentTransactions);
    });

    it('should get points leaderboard', async () => {
      const topUsers = [
        { userId: 'user_1', _sum: { points: 1000 } },
        { userId: 'user_2', _sum: { points: 800 } },
        { userId: 'user_3', _sum: { points: 600 } },
      ];

      const mockUsers = [
        { id: 'user_1', name: 'User 1', avatar: null },
        { id: 'user_2', name: 'User 2', avatar: null },
        { id: 'user_3', name: 'User 3', avatar: null },
      ];

      mockPrisma.pointTransaction.groupBy.mockResolvedValue(topUsers);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1])
        .mockResolvedValueOnce(mockUsers[2]);
      mockPrisma.badge.findMany.mockResolvedValue([]);
      mockPrisma.userAchievement.count.mockResolvedValue(5);

      const result = await gamificationService.getPointsLeaderboard('site_123', {
        timeframe: 'monthly',
        limit: 100,
        offset: 0,
      });

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[0].score).toBe(1000);
      expect(result[0].user.name).toBe('User 1');
    });
  });

  describe('User Achievements', () => {
    const mockUserAchievement: UserAchievement = {
      id: 'user_achievement_123',
      userId: 'user_123',
      achievementId: 'achievement_123',
      earnedAt: new Date(),
      progress: 100,
      currentValue: 1,
      isCompleted: true,
      metadata: {},
      siteId: 'site_123',
    };

    it('should award achievement to user', async () => {
      const achievement = {
        id: 'achievement_123',
        name: 'First Post',
        points: 10,
        isRepeatable: false,
      };

      mockPrisma.userAchievement.findFirst.mockResolvedValue(null); // No existing achievement
      mockPrisma.userAchievement.create.mockResolvedValue(mockUserAchievement);
      mockPrisma.achievementRule.findUnique.mockResolvedValue(achievement);
      mockPrisma.pointTransaction.create.mockResolvedValue({});
      mockPrisma.userStats.upsert.mockResolvedValue({});

      const result = await gamificationService.awardAchievement(mockUserAchievement);

      expect(mockPrisma.userAchievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          achievementId: 'achievement_123',
          isCompleted: true,
        }),
      });
      expect(mockPrisma.pointTransaction.create).toHaveBeenCalled(); // Points awarded
      expect(result).toEqual(mockUserAchievement);
    });

    it('should prevent duplicate achievement when not repeatable', async () => {
      const existingAchievement = {
        ...mockUserAchievement,
        achievement: { isRepeatable: false, maxEarns: null }
      };

      mockPrisma.userAchievement.findFirst.mockResolvedValue(existingAchievement);

      await expect(gamificationService.awardAchievement(mockUserAchievement))
        .rejects.toThrow('Achievement already earned and is not repeatable');
    });

    it('should allow repeatable achievements up to max earns', async () => {
      const existingAchievement = {
        ...mockUserAchievement,
        achievement: { isRepeatable: true, maxEarns: 3 }
      };

      mockPrisma.userAchievement.findFirst.mockResolvedValue(existingAchievement);
      mockPrisma.userAchievement.count.mockResolvedValue(2); // Already earned 2 times
      mockPrisma.userAchievement.create.mockResolvedValue(mockUserAchievement);
      mockPrisma.achievementRule.findUnique.mockResolvedValue({ points: 10 });
      mockPrisma.pointTransaction.create.mockResolvedValue({});
      mockPrisma.userStats.upsert.mockResolvedValue({});

      const result = await gamificationService.awardAchievement(mockUserAchievement);

      expect(result).toEqual(mockUserAchievement);
    });

    it('should prevent earning achievement beyond max earns', async () => {
      const existingAchievement = {
        ...mockUserAchievement,
        achievement: { isRepeatable: true, maxEarns: 3 }
      };

      mockPrisma.userAchievement.findFirst.mockResolvedValue(existingAchievement);
      mockPrisma.userAchievement.count.mockResolvedValue(3); // Already at max

      await expect(gamificationService.awardAchievement(mockUserAchievement))
        .rejects.toThrow('Maximum earns for this achievement reached');
    });

    it('should get user achievements with filters', async () => {
      const userAchievements = [
        { ...mockUserAchievement, achievement: { category: 'Content Creation' } }
      ];

      mockPrisma.userAchievement.findMany.mockResolvedValue(userAchievements);
      mockPrisma.userAchievement.count.mockResolvedValue(1);

      const result = await gamificationService.getUserAchievements('user_123', 'site_123', {
        category: 'Content Creation',
        isCompleted: true,
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.userAchievement.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user_123',
          siteId: 'site_123',
          isCompleted: true,
          achievement: { category: 'Content Creation' },
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
        take: 50,
        skip: 0,
      });
      expect(result.achievements).toEqual(userAchievements);
      expect(result.total).toBe(1);
    });

    it('should update achievement progress', async () => {
      const achievement = {
        id: 'achievement_123',
        conditions: { target: 10 },
        siteId: 'site_123',
      };

      const existingProgress = {
        id: 'user_achievement_123',
        userId: 'user_123',
        achievementId: 'achievement_123',
        progress: 50,
        currentValue: 5,
        isCompleted: false,
        metadata: {},
      };

      const updatedProgress = {
        ...existingProgress,
        progress: 80,
        currentValue: 8,
      };

      mockPrisma.achievementRule.findUnique.mockResolvedValue(achievement);
      mockPrisma.userAchievement.findFirst.mockResolvedValue(existingProgress);
      mockPrisma.userAchievement.update.mockResolvedValue(updatedProgress);

      const result = await gamificationService.updateAchievementProgress(
        'user_123',
        'achievement_123',
        { currentValue: 8 }
      );

      expect(mockPrisma.userAchievement.update).toHaveBeenCalledWith({
        where: { id: 'user_achievement_123' },
        data: expect.objectContaining({
          progress: 80,
          currentValue: 8,
          isCompleted: false,
        }),
      });
      expect(result).toEqual(updatedProgress);
    });

    it('should complete achievement when progress reaches 100%', async () => {
      const achievement = {
        id: 'achievement_123',
        conditions: { target: 10 },
        siteId: 'site_123',
      };

      const existingProgress = {
        id: 'user_achievement_123',
        userId: 'user_123',
        achievementId: 'achievement_123',
        progress: 90,
        currentValue: 9,
        isCompleted: false,
        metadata: {},
      };

      const completedProgress = {
        ...existingProgress,
        progress: 100,
        currentValue: 10,
        isCompleted: true,
        earnedAt: new Date(),
      };

      mockPrisma.achievementRule.findUnique.mockResolvedValue(achievement);
      mockPrisma.userAchievement.findFirst.mockResolvedValue(existingProgress);
      mockPrisma.userAchievement.update.mockResolvedValue(completedProgress);
      mockPrisma.userAchievement.create.mockResolvedValue(completedProgress);
      mockPrisma.pointTransaction.create.mockResolvedValue({});
      mockPrisma.userStats.upsert.mockResolvedValue({});

      const result = await gamificationService.updateAchievementProgress(
        'user_123',
        'achievement_123',
        { currentValue: 10 }
      );

      expect(result?.isCompleted).toBe(true);
      expect(result?.progress).toBe(100);
    });
  });

  describe('Badge Management', () => {
    it('should create a badge', async () => {
      const badgeData = {
        name: 'Content Creator',
        description: 'Active content creator',
        rarity: 'common' as const,
        siteId: 'site_123',
      };

      const createdBadge = {
        ...badgeData,
        id: 'badge_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.badge.create.mockResolvedValue(createdBadge);

      const result = await gamificationService.createBadge(badgeData);

      expect(mockPrisma.badge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Content Creator',
          description: 'Active content creator',
          rarity: 'common',
          siteId: 'site_123',
        }),
      });
      expect(result).toEqual(createdBadge);
    });

    it('should get user badges', async () => {
      const badges = [
        { id: 'badge_1', name: 'Badge 1', rarity: 'common' },
        { id: 'badge_2', name: 'Badge 2', rarity: 'rare' },
      ];

      mockPrisma.badge.findMany.mockResolvedValue(badges);

      const result = await gamificationService.getUserBadges('user_123', 'site_123');

      expect(mockPrisma.badge.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          isActive: true,
          userAchievements: {
            some: {
              userId: 'user_123',
              isCompleted: true,
            }
          }
        }),
        orderBy: expect.any(Array),
      });
      expect(result).toEqual(badges);
    });
  });

  describe('Leaderboard Management', () => {
    it('should create a leaderboard', async () => {
      const leaderboardData = {
        name: 'Top Contributors',
        description: 'Best content contributors',
        type: 'points' as const,
        timeframe: 'monthly' as const,
        siteId: 'site_123',
      };

      const createdLeaderboard = {
        ...leaderboardData,
        id: 'leaderboard_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.leaderboard.create.mockResolvedValue(createdLeaderboard);

      const result = await gamificationService.createLeaderboard(leaderboardData);

      expect(mockPrisma.leaderboard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Top Contributors',
          type: 'points',
          timeframe: 'monthly',
          siteId: 'site_123',
        }),
      });
      expect(result).toEqual(createdLeaderboard);
    });

    it('should get leaderboards with filters', async () => {
      const leaderboards = [
        { id: 'leaderboard_1', name: 'Points Leaderboard', type: 'points' },
        { id: 'leaderboard_2', name: 'Achievements Leaderboard', type: 'achievements' },
      ];

      mockPrisma.leaderboard.findMany.mockResolvedValue(leaderboards);
      mockPrisma.leaderboard.count.mockResolvedValue(2);

      const result = await gamificationService.getLeaderboards('site_123', {
        type: ['points', 'achievements'],
        isPublic: true,
        limit: 20,
        offset: 0,
      });

      expect(mockPrisma.leaderboard.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          isActive: true,
          isPublic: true,
          type: { in: ['points', 'achievements'] },
        }),
        orderBy: { name: 'asc' },
        take: 20,
        skip: 0,
      });
      expect(result.leaderboards).toEqual(leaderboards);
      expect(result.total).toBe(2);
    });
  });

  describe('User Statistics', () => {
    it('should get comprehensive user stats', async () => {
      const mockStats = {
        totalPoints: 500,
        availablePoints: 400,
        rank: 10,
        recentTransactions: [],
      };

      const mockBadges = [
        { id: 'badge_1', name: 'First Badge', rarity: 'common' },
      ];

      const mockRecentAchievements = [
        { id: 'achievement_1', achievement: { name: 'First Post' } },
      ];

      // Mock all the underlying method calls
      mockPrisma.pointTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { points: 500 } })
        .mockResolvedValueOnce({ _sum: { points: 400 } });
      mockPrisma.userStats.count.mockResolvedValue(9); // 9 users ahead
      mockPrisma.pointTransaction.findMany.mockResolvedValue([]);
      mockPrisma.userAchievement.count
        .mockResolvedValueOnce(15) // Total achievements
        .mockResolvedValueOnce(8); // For activity score calculation
      mockPrisma.userAchievement.groupBy.mockResolvedValue([]);
      mockPrisma.badge.findMany.mockResolvedValue(mockBadges);
      mockPrisma.userAchievement.findMany.mockResolvedValue(mockRecentAchievements);

      const result = await gamificationService.getUserStats('user_123', 'site_123');

      expect(result.totalPoints).toBe(500);
      expect(result.availablePoints).toBe(400);
      expect(result.pointsRank).toBe(10);
      expect(result.totalAchievements).toBe(15);
      expect(result.badges).toEqual(mockBadges);
      expect(result.recentAchievements).toEqual(mockRecentAchievements);
    });
  });

  describe('Analytics', () => {
    it('should get gamification analytics', async () => {
      const result = await gamificationService.getGamificationAnalytics('site_123', '30d');

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('leaderboards');
      expect(result).toHaveProperty('pointsDistribution');
    });
  });

  describe('Error Handling', () => {
    it('should handle achievement creation errors', async () => {
      mockPrisma.achievementRule.create.mockRejectedValue(new Error('Database error'));

      await expect(gamificationService.createAchievementRule({
        name: 'Test Achievement',
        description: 'Test description',
        category: 'Test',
        type: 'milestone',
        rarity: 'common',
        points: 10,
        conditions: {
          action: 'test_action',
          target: 1,
          timeframe: 'all_time',
          consecutive: false,
          metadata: {},
        },
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle points award errors', async () => {
      mockPrisma.pointTransaction.create.mockRejectedValue(new Error('Points error'));

      await expect(gamificationService.awardPoints({
        userId: 'user_123',
        points: 50,
        reason: 'Test',
        category: 'achievement',
        sourceType: 'achievement',
        siteId: 'site_123',
      })).rejects.toThrow('Points error');
    });

    it('should handle achievement progress errors gracefully', async () => {
      mockPrisma.achievementRule.findUnique.mockResolvedValue(null);

      const result = await gamificationService.updateAchievementProgress(
        'user_123',
        'nonexistent_achievement',
        { currentValue: 5 }
      );

      expect(result).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate achievement rule data', async () => {
      const invalidAchievement = {
        name: '', // Invalid: empty name
        description: 'Test description',
        category: 'Test',
        type: 'milestone',
        siteId: 'site_123',
      };

      await expect(gamificationService.createAchievementRule(invalidAchievement as any))
        .rejects.toThrow();
    });

    it('should validate point transaction data', async () => {
      const invalidPoints = {
        userId: '', // Invalid: empty user ID
        points: 50,
        reason: 'Test',
        category: 'achievement',
        sourceType: 'achievement',
        siteId: 'site_123',
      };

      await expect(gamificationService.awardPoints(invalidPoints as any))
        .rejects.toThrow();
    });

    it('should validate user achievement data', async () => {
      const invalidUserAchievement = {
        userId: 'user_123',
        achievementId: '', // Invalid: empty achievement ID
        siteId: 'site_123',
      };

      await expect(gamificationService.awardAchievement(invalidUserAchievement as any))
        .rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should apply points multiplier correctly', async () => {
      const serviceWithMultiplier = new GamificationService({ pointsMultiplier: 1.5 });
      
      mockPrisma.pointTransaction.create.mockResolvedValue({});
      mockPrisma.userStats.upsert.mockResolvedValue({});

      await serviceWithMultiplier.awardPoints({
        userId: 'user_123',
        points: 100,
        reason: 'Test',
        category: 'achievement',
        sourceType: 'achievement',
        siteId: 'site_123',
      });

      expect(mockPrisma.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          points: 150, // 100 * 1.5
        }),
      });
    });

    it('should respect auto-achievements setting', async () => {
      const serviceWithoutAuto = new GamificationService({ enableAutoAchievements: false });
      
      mockPrisma.pointTransaction.create.mockResolvedValue({});
      mockPrisma.userStats.upsert.mockResolvedValue({});

      await serviceWithoutAuto.awardPoints({
        userId: 'user_123',
        points: 50,
        reason: 'Test',
        category: 'achievement',
        sourceType: 'achievement',
        siteId: 'site_123',
      });

      // Should not check for point-based achievements when disabled
      expect(mockPrisma.achievementRule.findMany).not.toHaveBeenCalled();
    });
  });
}); 