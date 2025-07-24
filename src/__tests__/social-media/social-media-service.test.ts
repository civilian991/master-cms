import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SocialMediaService } from '@/lib/services/social-media';
import { SocialMediaPlatform, SocialMediaPostStatus } from '@/generated/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    socialMediaPost: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    marketingAnalytics: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('SocialMediaService', () => {
  let socialMediaService: SocialMediaService;
  const mockPrisma = require('@/lib/prisma').prisma;

  beforeEach(() => {
    socialMediaService = new SocialMediaService();
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a draft post when no scheduledAt is provided', async () => {
      const postData = {
        content: 'Test post content',
        platform: SocialMediaPlatform.TWITTER,
        siteId: 'site-1',
        campaignId: 'campaign-1',
        metadata: { test: 'data' },
      };

      const mockPost = {
        id: 'post-1',
        ...postData,
        status: SocialMediaPostStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.socialMediaPost.create.mockResolvedValue(mockPost);

      const result = await socialMediaService.createPost(postData, 'user-1');

      expect(mockPrisma.socialMediaPost.create).toHaveBeenCalledWith({
        data: {
          ...postData,
          status: SocialMediaPostStatus.DRAFT,
          createdBy: 'user-1',
        },
      });
      expect(result).toEqual(mockPost);
    });

    it('should create a scheduled post when scheduledAt is provided', async () => {
      const scheduledAt = new Date('2024-01-01T10:00:00Z');
      const postData = {
        content: 'Test scheduled post',
        platform: SocialMediaPlatform.LINKEDIN,
        siteId: 'site-1',
        scheduledAt,
      };

      const mockPost = {
        id: 'post-2',
        ...postData,
        status: SocialMediaPostStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.socialMediaPost.create.mockResolvedValue(mockPost);

      const result = await socialMediaService.createPost(postData, 'user-1');

      expect(mockPrisma.socialMediaPost.create).toHaveBeenCalledWith({
        data: {
          ...postData,
          status: SocialMediaPostStatus.SCHEDULED,
          createdBy: 'user-1',
        },
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('getPosts', () => {
    it('should return posts for a site with default options', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          content: 'Test post 1',
          platform: SocialMediaPlatform.TWITTER,
          status: SocialMediaPostStatus.PUBLISHED,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'post-2',
          content: 'Test post 2',
          platform: SocialMediaPlatform.LINKEDIN,
          status: SocialMediaPostStatus.DRAFT,
          siteId: 'site-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.socialMediaPost.findMany.mockResolvedValue(mockPosts);

      const result = await socialMediaService.getPosts('site-1');

      expect(mockPrisma.socialMediaPost.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          platform: undefined,
          status: undefined,
        },
        include: {
          campaign: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual(mockPosts);
    });

    it('should return posts with custom options', async () => {
      const options = {
        platform: SocialMediaPlatform.TWITTER,
        status: SocialMediaPostStatus.PUBLISHED,
        limit: 10,
        offset: 20,
      };

      mockPrisma.socialMediaPost.findMany.mockResolvedValue([]);

      await socialMediaService.getPosts('site-1', options);

      expect(mockPrisma.socialMediaPost.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          platform: SocialMediaPlatform.TWITTER,
          status: SocialMediaPostStatus.PUBLISHED,
        },
        include: {
          campaign: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      const mockPost = {
        id: 'post-1',
        platform: SocialMediaPlatform.TWITTER,
        platformPostId: 'twitter-123',
        status: SocialMediaPostStatus.PUBLISHED,
      };

      mockPrisma.socialMediaPost.findUnique.mockResolvedValue(mockPost);
      mockPrisma.socialMediaPost.delete.mockResolvedValue(mockPost);

      const result = await socialMediaService.deletePost('post-1');

      expect(mockPrisma.socialMediaPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
      expect(mockPrisma.socialMediaPost.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when post not found', async () => {
      mockPrisma.socialMediaPost.findUnique.mockResolvedValue(null);

      await expect(socialMediaService.deletePost('nonexistent')).rejects.toThrow('Post not found');
    });
  });

  describe('getAvailablePlatforms', () => {
    it('should return available platforms', async () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        TWITTER_API_KEY: 'test-key',
        TWITTER_API_SECRET: 'test-secret',
        LINKEDIN_CLIENT_ID: 'test-client-id',
        LINKEDIN_CLIENT_SECRET: 'test-client-secret',
      };

      const platforms = await socialMediaService.getAvailablePlatforms();

      expect(platforms).toContain(SocialMediaPlatform.TWITTER);
      expect(platforms).toContain(SocialMediaPlatform.LINKEDIN);

      process.env = originalEnv;
    });
  });

  describe('testPlatformConnection', () => {
    it('should test Twitter connection successfully', async () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        TWITTER_API_KEY: 'test-key',
        TWITTER_API_SECRET: 'test-secret',
      };

      const result = await socialMediaService.testPlatformConnection(SocialMediaPlatform.TWITTER);

      expect(result).toEqual({
        success: true,
        message: 'Twitter connection successful',
      });

      process.env = originalEnv;
    });

    it('should throw error for unsupported platform', async () => {
      await expect(
        socialMediaService.testPlatformConnection('UNSUPPORTED' as SocialMediaPlatform)
      ).rejects.toThrow('Unsupported platform: UNSUPPORTED');
    });
  });

  describe('updateAnalytics', () => {
    it('should update analytics successfully', async () => {
      const analytics = {
        postId: 'post-1',
        platform: SocialMediaPlatform.TWITTER,
        impressions: 1000,
        reach: 500,
        engagement: 50,
        clicks: 25,
        shares: 10,
        likes: 15,
        comments: 5,
        date: new Date(),
      };

      mockPrisma.marketingAnalytics.create.mockResolvedValue({ id: 'analytics-1' });

      await socialMediaService.updateAnalytics(analytics);

      expect(mockPrisma.marketingAnalytics.create).toHaveBeenCalledWith({
        data: {
          type: 'SOCIAL_MEDIA',
          data: analytics,
          siteId: analytics.postId,
          metadata: {
            postId: analytics.postId,
            platform: analytics.platform,
            date: analytics.date,
          },
        },
      });
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for a site', async () => {
      const mockAnalytics = [
        {
          id: 'analytics-1',
          type: 'SOCIAL_MEDIA',
          data: { impressions: 1000, engagement: 50 },
          siteId: 'site-1',
          createdAt: new Date(),
        },
      ];

      mockPrisma.marketingAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await socialMediaService.getAnalytics('site-1', {
        platform: SocialMediaPlatform.TWITTER,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(mockPrisma.marketingAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          type: 'SOCIAL_MEDIA',
          metadata: {
            path: ['platform'],
            equals: SocialMediaPlatform.TWITTER,
          },
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAnalytics);
    });
  });
}); 