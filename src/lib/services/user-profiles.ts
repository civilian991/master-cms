import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const UserProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  displayName: z.string().min(1, 'Display name is required'),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  avatar: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  interests: z.array(z.string()).default([]),
  socialLinks: z.record(z.string(), z.string().url()).default({}),
  isPublic: z.boolean().default(true),
  allowFollowing: z.boolean().default(true),
  allowMessages: z.boolean().default(true),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ReputationScoreSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  siteId: z.string().min(1, 'Site ID is required'),
  score: z.number().int().min(0).default(0),
  level: z.string().default('Newcomer'),
  totalPosts: z.number().int().min(0).default(0),
  totalThreads: z.number().int().min(0).default(0),
  totalLikes: z.number().int().min(0).default(0),
  totalAchievements: z.number().int().min(0).default(0),
  joinedAt: z.date().default(() => new Date()),
  lastActiveAt: z.date().default(() => new Date()),
});

export const AchievementSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Achievement name is required'),
  description: z.string().min(1, 'Achievement description is required'),
  icon: z.string().optional(),
  category: z.enum(['posting', 'engagement', 'community', 'milestone', 'special']),
  requirements: z.record(z.string(), z.any()),
  points: z.number().int().min(0).default(0),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).default('common'),
  isActive: z.boolean().default(true),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const UserAchievementSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  achievementId: z.string().min(1, 'Achievement ID is required'),
  earnedAt: z.date().default(() => new Date()),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const ActivitySchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['post_created', 'thread_created', 'comment_created', 'like_given', 'achievement_earned', 'profile_updated', 'user_followed']),
  targetType: z.enum(['thread', 'post', 'comment', 'user', 'achievement']).optional(),
  targetId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const FollowSchema = z.object({
  followerId: z.string().min(1, 'Follower ID is required'),
  followingId: z.string().min(1, 'Following ID is required'),
  siteId: z.string().min(1, 'Site ID is required'),
});

// Types
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type ReputationScore = z.infer<typeof ReputationScoreSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type UserAchievement = z.infer<typeof UserAchievementSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Follow = z.infer<typeof FollowSchema>;

export interface UserStats {
  totalPosts: number;
  totalThreads: number;
  totalComments: number;
  totalLikes: number;
  reputationScore: number;
  achievements: number;
  followers: number;
  following: number;
  joinedDaysAgo: number;
}

export interface UserProfileAnalytics {
  profileViews: number;
  engagementRate: number;
  popularPosts: Array<{
    id: string;
    title: string;
    likes: number;
    views: number;
  }>;
  reputationHistory: Array<{
    date: Date;
    score: number;
    change: number;
  }>;
  achievementProgress: Array<{
    achievement: Achievement;
    progress: number;
    requirement: number;
  }>;
}

export class UserProfilesService {
  constructor(private config: { enableActivityTracking?: boolean; enableReputationSystem?: boolean } = {}) {}

  // Profile Management
  async createUserProfile(profileData: UserProfile): Promise<UserProfile> {
    const validatedData = UserProfileSchema.parse(profileData);
    
    const profile = await prisma.userProfile.create({
      data: {
        ...validatedData,
        id: validatedData.id || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Initialize reputation score
    await this.initializeReputationScore(profile.userId, profile.siteId);

    // Track activity
    if (this.config.enableActivityTracking) {
      await this.trackActivity({
        userId: profile.userId,
        type: 'profile_updated',
        siteId: profile.siteId,
      });
    }

    return profile;
  }

  async getUserProfile(userId: string, siteId: string): Promise<UserProfile | null> {
    const profile = await prisma.userProfile.findFirst({
      where: { userId, siteId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true }
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            threads: true,
          }
        }
      }
    });

    return profile;
  }

  async updateUserProfile(userId: string, siteId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await prisma.userProfile.update({
      where: {
        userId_siteId: { userId, siteId }
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    // Track activity
    if (this.config.enableActivityTracking) {
      await this.trackActivity({
        userId,
        type: 'profile_updated',
        siteId,
        metadata: { updatedFields: Object.keys(updates) }
      });
    }

    return profile;
  }

  async searchUserProfiles(siteId: string, options: {
    query?: string;
    interests?: string[];
    location?: string;
    minReputation?: number;
    sortBy?: 'reputation' | 'activity' | 'joined' | 'name';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ profiles: UserProfile[]; total: number }> {
    const {
      query,
      interests,
      location,
      minReputation,
      sortBy = 'reputation',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    const whereClause: any = {
      siteId,
      isPublic: true,
    };

    if (query) {
      whereClause.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (interests && interests.length > 0) {
      whereClause.interests = { hasSome: interests };
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    if (minReputation) {
      whereClause.reputationScore = { gte: minReputation };
    }

    const orderBy = this.getProfileOrderBy(sortBy, sortOrder);

    const [profiles, total] = await Promise.all([
      prisma.userProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, createdAt: true }
          },
          _count: {
            select: { followers: true, following: true }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.userProfile.count({ where: whereClause })
    ]);

    return { profiles, total };
  }

  // Reputation System
  async initializeReputationScore(userId: string, siteId: string): Promise<ReputationScore> {
    const reputationData = {
      userId,
      siteId,
      score: 0,
      level: 'Newcomer',
      totalPosts: 0,
      totalThreads: 0,
      totalLikes: 0,
      totalAchievements: 0,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };

    const reputation = await prisma.reputationScore.create({
      data: {
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...reputationData,
      },
    });

    return reputation;
  }

  async getReputationScore(userId: string, siteId: string): Promise<ReputationScore | null> {
    const reputation = await prisma.reputationScore.findFirst({
      where: { userId, siteId },
    });

    return reputation;
  }

  async updateReputationScore(userId: string, siteId: string, changes: {
    scoreChange?: number;
    postsChange?: number;
    threadsChange?: number;
    likesChange?: number;
    achievementsChange?: number;
  }): Promise<ReputationScore> {
    const current = await this.getReputationScore(userId, siteId);
    if (!current) {
      throw new Error('Reputation score not found');
    }

    const newScore = current.score + (changes.scoreChange || 0);
    const newLevel = this.calculateLevel(newScore);

    const reputation = await prisma.reputationScore.update({
      where: { id: current.id },
      data: {
        score: newScore,
        level: newLevel,
        totalPosts: current.totalPosts + (changes.postsChange || 0),
        totalThreads: current.totalThreads + (changes.threadsChange || 0),
        totalLikes: current.totalLikes + (changes.likesChange || 0),
        totalAchievements: current.totalAchievements + (changes.achievementsChange || 0),
        lastActiveAt: new Date(),
      },
    });

    // Check for level-based achievements
    if (newLevel !== current.level) {
      await this.checkLevelAchievements(userId, siteId, newLevel);
    }

    return reputation;
  }

  async getLeaderboard(siteId: string, options: {
    type?: 'reputation' | 'posts' | 'likes';
    timeframe?: 'week' | 'month' | 'all';
    limit?: number;
  } = {}): Promise<ReputationScore[]> {
    const { type = 'reputation', timeframe = 'all', limit = 50 } = options;

    let orderBy: any = { score: 'desc' };
    let where: any = { siteId };

    switch (type) {
      case 'posts':
        orderBy = { totalPosts: 'desc' };
        break;
      case 'likes':
        orderBy = { totalLikes: 'desc' };
        break;
    }

    if (timeframe !== 'all') {
      const days = timeframe === 'week' ? 7 : 30;
      const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      where.lastActiveAt = { gte: cutoffDate };
    }

    const leaderboard = await prisma.reputationScore.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true }
        },
        userProfile: {
          select: { displayName: true, avatar: true }
        }
      },
      orderBy,
      take: limit,
    });

    return leaderboard;
  }

  // Achievement System
  async createAchievement(achievementData: Achievement): Promise<Achievement> {
    const validatedData = AchievementSchema.parse(achievementData);
    
    const achievement = await prisma.achievement.create({
      data: {
        ...validatedData,
        id: validatedData.id || `achieve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return achievement;
  }

  async getAchievements(siteId: string): Promise<Achievement[]> {
    const achievements = await prisma.achievement.findMany({
      where: { siteId, isActive: true },
      orderBy: [
        { category: 'asc' },
        { points: 'desc' }
      ],
    });

    return achievements;
  }

  async getUserAchievements(userId: string, siteId: string): Promise<UserAchievement[]> {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId, siteId },
      include: {
        achievement: true
      },
      orderBy: { earnedAt: 'desc' },
    });

    return userAchievements;
  }

  async awardAchievement(userId: string, achievementId: string, siteId: string): Promise<UserAchievement> {
    // Check if user already has this achievement
    const existing = await prisma.userAchievement.findFirst({
      where: { userId, achievementId, siteId }
    });

    if (existing) {
      return existing;
    }

    const userAchievement = await prisma.userAchievement.create({
      data: {
        id: `userachieve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        achievementId,
        siteId,
        earnedAt: new Date(),
      },
      include: {
        achievement: true
      }
    });

    // Update reputation score
    if (this.config.enableReputationSystem) {
      await this.updateReputationScore(userId, siteId, {
        scoreChange: userAchievement.achievement.points,
        achievementsChange: 1
      });
    }

    // Track activity
    if (this.config.enableActivityTracking) {
      await this.trackActivity({
        userId,
        type: 'achievement_earned',
        targetType: 'achievement',
        targetId: achievementId,
        siteId,
        metadata: { achievementName: userAchievement.achievement.name }
      });
    }

    return userAchievement;
  }

  async checkAchievements(userId: string, siteId: string): Promise<UserAchievement[]> {
    const [achievements, userStats, userAchievements] = await Promise.all([
      this.getAchievements(siteId),
      this.getUserStats(userId, siteId),
      this.getUserAchievements(userId, siteId)
    ]);

    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
    const newAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      if (this.meetsAchievementRequirements(achievement, userStats)) {
        const userAchievement = await this.awardAchievement(userId, achievement.id, siteId);
        newAchievements.push(userAchievement);
      }
    }

    return newAchievements;
  }

  // Activity Tracking
  async trackActivity(activityData: Activity): Promise<Activity> {
    if (!this.config.enableActivityTracking) return activityData as Activity;

    const validatedData = ActivitySchema.parse(activityData);
    
    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        id: validatedData.id || `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      },
    });

    // Update last active time
    await prisma.reputationScore.updateMany({
      where: { userId: activity.userId, siteId: activity.siteId },
      data: { lastActiveAt: new Date() }
    });

    return activity;
  }

  async getUserActivity(userId: string, siteId: string, options: {
    limit?: number;
    offset?: number;
    types?: string[];
  } = {}): Promise<{ activities: Activity[]; total: number }> {
    const { limit = 50, offset = 0, types } = options;

    const whereClause: any = { userId, siteId };
    if (types && types.length > 0) {
      whereClause.type = { in: types };
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({ where: whereClause })
    ]);

    return { activities, total };
  }

  // Following System
  async followUser(followerId: string, followingId: string, siteId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existing = await prisma.follow.findFirst({
      where: { followerId, followingId, siteId }
    });

    if (existing) {
      return existing;
    }

    const follow = await prisma.follow.create({
      data: {
        id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        followerId,
        followingId,
        siteId,
        createdAt: new Date(),
      },
    });

    // Track activity
    if (this.config.enableActivityTracking) {
      await this.trackActivity({
        userId: followerId,
        type: 'user_followed',
        targetType: 'user',
        targetId: followingId,
        siteId,
      });
    }

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string, siteId: string): Promise<boolean> {
    try {
      await prisma.follow.delete({
        where: {
          followerId_followingId_siteId: { followerId, followingId, siteId }
        }
      });
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async getFollowers(userId: string, siteId: string): Promise<Follow[]> {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId, siteId },
      include: {
        follower: {
          include: {
            userProfile: {
              where: { siteId }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return followers;
  }

  async getFollowing(userId: string, siteId: string): Promise<Follow[]> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId, siteId },
      include: {
        following: {
          include: {
            userProfile: {
              where: { siteId }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return following;
  }

  // Analytics
  async getUserStats(userId: string, siteId: string): Promise<UserStats> {
    const [
      profile,
      reputation,
      postsCount,
      threadsCount,
      commentsCount,
      likesCount,
      achievementsCount,
      followersCount,
      followingCount
    ] = await Promise.all([
      this.getUserProfile(userId, siteId),
      this.getReputationScore(userId, siteId),
      prisma.forumPost.count({ where: { authorId: userId, siteId } }),
      prisma.forumThread.count({ where: { authorId: userId, siteId } }),
      prisma.comment.count({ where: { authorId: userId, siteId } }),
      prisma.like.count({ where: { userId, siteId } }),
      prisma.userAchievement.count({ where: { userId, siteId } }),
      prisma.follow.count({ where: { followingId: userId, siteId } }),
      prisma.follow.count({ where: { followerId: userId, siteId } })
    ]);

    const joinedAt = profile?.user?.createdAt || new Date();
    const joinedDaysAgo = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalPosts: postsCount,
      totalThreads: threadsCount,
      totalComments: commentsCount,
      totalLikes: likesCount,
      reputationScore: reputation?.score || 0,
      achievements: achievementsCount,
      followers: followersCount,
      following: followingCount,
      joinedDaysAgo,
    };
  }

  async getUserProfileAnalytics(userId: string, siteId: string): Promise<UserProfileAnalytics> {
    // This would typically involve more complex analytics queries
    // For now, returning basic structure
    return {
      profileViews: 0,
      engagementRate: 0,
      popularPosts: [],
      reputationHistory: [],
      achievementProgress: [],
    };
  }

  // Helper methods
  private calculateLevel(score: number): string {
    if (score >= 10000) return 'Expert';
    if (score >= 5000) return 'Advanced';
    if (score >= 2000) return 'Intermediate';
    if (score >= 500) return 'Regular';
    if (score >= 100) return 'Member';
    return 'Newcomer';
  }

  private async checkLevelAchievements(userId: string, siteId: string, newLevel: string): Promise<void> {
    const levelAchievements = await prisma.achievement.findMany({
      where: {
        siteId,
        category: 'milestone',
        requirements: {
          path: ['level'],
          equals: newLevel
        }
      }
    });

    for (const achievement of levelAchievements) {
      await this.awardAchievement(userId, achievement.id, siteId);
    }
  }

  private meetsAchievementRequirements(achievement: Achievement, userStats: UserStats): boolean {
    const requirements = achievement.requirements;

    if (requirements.posts && userStats.totalPosts < requirements.posts) return false;
    if (requirements.threads && userStats.totalThreads < requirements.threads) return false;
    if (requirements.likes && userStats.totalLikes < requirements.likes) return false;
    if (requirements.reputation && userStats.reputationScore < requirements.reputation) return false;
    if (requirements.followers && userStats.followers < requirements.followers) return false;
    if (requirements.daysActive && userStats.joinedDaysAgo < requirements.daysActive) return false;

    return true;
  }

  private getProfileOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'activity':
        return { lastActiveAt: order };
      case 'joined':
        return { createdAt: order };
      case 'name':
        return { displayName: order };
      case 'reputation':
      default:
        return { reputationScore: { score: order } };
    }
  }
}

export const userProfilesService = new UserProfilesService({
  enableActivityTracking: true,
  enableReputationSystem: true,
}); 