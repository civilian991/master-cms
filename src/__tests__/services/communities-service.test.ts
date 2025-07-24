import { CommunitiesService, Community, CommunityMembership, CommunityPost } from '@/lib/services/communities';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    community: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    communityMembership: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    communityPost: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    communityInvite: {
      create: jest.fn(),
    },
    communityModerationLog: {
      create: jest.fn(),
    },
    comment: {
      count: jest.fn(),
      update: jest.fn(),
    },
    like: {
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  community: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  communityMembership: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  communityPost: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  communityInvite: {
    create: jest.fn(),
  },
  communityModerationLog: {
    create: jest.fn(),
  },
  comment: {
    count: jest.fn(),
    update: jest.fn(),
  },
  like: {
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('CommunitiesService', () => {
  let communitiesService: CommunitiesService;

  beforeEach(() => {
    communitiesService = new CommunitiesService({
      enableModeration: true,
      enableAnalytics: true,
      enableNotifications: true,
      maxCommunitiesPerUser: 10,
    });
    jest.clearAllMocks();
  });

  describe('Community Management', () => {
    const mockCommunity: Community = {
      id: 'comm_123',
      name: 'Tech Enthusiasts',
      description: 'A community for tech lovers',
      slug: 'tech-enthusiasts',
      type: 'public',
      category: 'Technology',
      tags: ['tech', 'programming'],
      rules: ['Be respectful', 'No spam'],
      maxMembers: 1000,
      membershipFee: 0,
      currency: 'USD',
      requiresApproval: false,
      allowInvites: true,
      allowMemberPosts: true,
      allowEvents: true,
      ownerId: 'owner_123',
      moderators: [],
      isActive: true,
      metadata: {},
      siteId: 'site_123',
    };

    it('should create a community', async () => {
      const createdCommunity = {
        ...mockCommunity,
        owner: { id: 'owner_123', name: 'Owner User', email: 'owner@example.com' },
        _count: { members: 0, posts: 0, activeMembers: 0 }
      };

      mockPrisma.community.count.mockResolvedValue(2); // Under limit
      mockPrisma.community.findFirst.mockResolvedValue(null); // Slug not taken
      mockPrisma.community.create.mockResolvedValue(createdCommunity);
      mockPrisma.communityMembership.create.mockResolvedValue({});

      const result = await communitiesService.createCommunity(mockCommunity);

      expect(mockPrisma.community.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockCommunity.name,
          slug: mockCommunity.slug,
          type: mockCommunity.type,
          ownerId: mockCommunity.ownerId,
        }),
        include: expect.any(Object),
      });
      expect(result.memberCount).toBe(0);
    });

    it('should prevent creating community with duplicate slug', async () => {
      mockPrisma.community.count.mockResolvedValue(2);
      mockPrisma.community.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(communitiesService.createCommunity(mockCommunity))
        .rejects.toThrow('Community slug already exists');
    });

    it('should prevent exceeding community creation limit', async () => {
      mockPrisma.community.count.mockResolvedValue(10); // At limit

      await expect(communitiesService.createCommunity(mockCommunity))
        .rejects.toThrow('Maximum communities per user exceeded');
    });

    it('should get a community with user membership status', async () => {
      const communityWithDetails = {
        ...mockCommunity,
        owner: { id: 'owner_123', name: 'Owner User', email: 'owner@example.com' },
        _count: { members: 150, posts: 89, activeMembers: 45 }
      };

      const userMembership = {
        communityId: 'comm_123',
        userId: 'user_123',
        role: 'member',
        status: 'active'
      };

      mockPrisma.community.findUnique.mockResolvedValue(communityWithDetails);
      mockPrisma.communityMembership.findFirst.mockResolvedValue(userMembership);

      const result = await communitiesService.getCommunity('comm_123', 'user_123');

      expect(result?.isUserMember).toBe(true);
      expect(result?.userRole).toBe('member');
      expect(result?.memberCount).toBe(150);
    });

    it('should get communities with filters', async () => {
      const communities = [mockCommunity];
      mockPrisma.community.findMany.mockResolvedValue(communities);
      mockPrisma.community.count.mockResolvedValue(1);

      const options = {
        siteId: 'site_123',
        type: ['public'],
        category: 'Technology',
        search: 'tech',
        limit: 20,
        offset: 0,
      };

      const result = await communitiesService.getCommunities(options);

      expect(mockPrisma.community.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          type: { in: ['public'] },
          category: 'Technology',
          OR: expect.any(Array),
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 20,
        skip: 0,
      });
      expect(result.total).toBe(1);
    });

    it('should update a community', async () => {
      const updates = { name: 'Updated Community Name', description: 'Updated description' };
      const updatedCommunity = {
        ...mockCommunity,
        ...updates,
        owner: { id: 'owner_123', name: 'Owner User', email: 'owner@example.com' },
        _count: { members: 150, posts: 89, activeMembers: 45 }
      };

      mockPrisma.community.update.mockResolvedValue(updatedCommunity);

      const result = await communitiesService.updateCommunity('comm_123', updates);

      expect(mockPrisma.community.update).toHaveBeenCalledWith({
        where: { id: 'comm_123' },
        data: expect.objectContaining(updates),
        include: expect.any(Object),
      });
      expect(result.name).toBe('Updated Community Name');
    });

    it('should soft delete a community', async () => {
      mockPrisma.community.update.mockResolvedValue(mockCommunity);

      const result = await communitiesService.deleteCommunity('comm_123');

      expect(mockPrisma.community.update).toHaveBeenCalledWith({
        where: { id: 'comm_123' },
        data: { isActive: false, updatedAt: expect.any(Date) }
      });
      expect(result).toBe(true);
    });
  });

  describe('Membership Management', () => {
    const mockMembership: CommunityMembership = {
      id: 'mem_123',
      communityId: 'comm_123',
      userId: 'user_123',
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
      permissions: [],
      siteId: 'site_123',
    };

    it('should add a member to community', async () => {
      const community = {
        id: 'comm_123',
        isActive: true,
        maxMembers: 1000,
        requiresApproval: false,
        _count: { members: 500 }
      };

      const createdMembership = {
        ...mockMembership,
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        community: { id: 'comm_123', name: 'Test Community', slug: 'test-community' }
      };

      mockPrisma.community.findUnique.mockResolvedValue(community);
      mockPrisma.communityMembership.findFirst.mockResolvedValue(null);
      mockPrisma.communityMembership.create.mockResolvedValue(createdMembership);

      const result = await communitiesService.addMember(mockMembership);

      expect(mockPrisma.communityMembership.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          communityId: 'comm_123',
          userId: 'user_123',
          role: 'member',
          status: 'active',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdMembership);
    });

    it('should set status to pending when approval is required', async () => {
      const communityWithApproval = {
        id: 'comm_123',
        isActive: true,
        maxMembers: 1000,
        requiresApproval: true,
        _count: { members: 500 }
      };

      const pendingMembership = {
        ...mockMembership,
        status: 'pending',
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        community: { id: 'comm_123', name: 'Test Community', slug: 'test-community' }
      };

      mockPrisma.community.findUnique.mockResolvedValue(communityWithApproval);
      mockPrisma.communityMembership.findFirst.mockResolvedValue(null);
      mockPrisma.communityMembership.create.mockResolvedValue(pendingMembership);

      const result = await communitiesService.addMember(mockMembership);

      expect(result.status).toBe('pending');
    });

    it('should prevent duplicate membership', async () => {
      const community = {
        id: 'comm_123',
        isActive: true,
        _count: { members: 500 }
      };

      const existingMembership = { ...mockMembership };

      mockPrisma.community.findUnique.mockResolvedValue(community);
      mockPrisma.communityMembership.findFirst.mockResolvedValue(existingMembership);

      await expect(communitiesService.addMember(mockMembership))
        .rejects.toThrow('User is already a member of this community');
    });

    it('should prevent joining when community is at capacity', async () => {
      const fullCommunity = {
        id: 'comm_123',
        isActive: true,
        maxMembers: 1000,
        _count: { members: 1000 } // At capacity
      };

      mockPrisma.community.findUnique.mockResolvedValue(fullCommunity);
      mockPrisma.communityMembership.findFirst.mockResolvedValue(null);

      await expect(communitiesService.addMember(mockMembership))
        .rejects.toThrow('Community has reached maximum member capacity');
    });

    it('should get community members with profiles', async () => {
      const memberships = [
        {
          ...mockMembership,
          user: { id: 'user_123', name: 'Test User', email: 'test@example.com', avatar: null }
        }
      ];

      mockPrisma.communityMembership.findMany.mockResolvedValue(memberships);
      mockPrisma.communityMembership.count.mockResolvedValue(1);
      
      // Mock member stats
      mockPrisma.communityPost.count.mockResolvedValue(5);
      mockPrisma.comment.count.mockResolvedValue(10);
      mockPrisma.like.count.mockResolvedValue(20);
      mockPrisma.user.findUnique.mockResolvedValue({ createdAt: new Date() });

      const result = await communitiesService.getCommunityMembers('comm_123', {
        status: ['active'],
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.communityMembership.findMany).toHaveBeenCalledWith({
        where: { communityId: 'comm_123', status: { in: ['active'] } },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 50,
        skip: 0,
      });
      expect(result.members).toHaveLength(1);
      expect(result.members[0].stats.postsCount).toBe(5);
    });

    it('should update membership', async () => {
      const updates = { role: 'moderator' as const, status: 'active' as const };
      const updatedMembership = {
        ...mockMembership,
        ...updates,
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        community: { id: 'comm_123', name: 'Test Community', slug: 'test-community' }
      };

      mockPrisma.communityMembership.update.mockResolvedValue(updatedMembership);

      const result = await communitiesService.updateMembership('mem_123', updates);

      expect(mockPrisma.communityMembership.update).toHaveBeenCalledWith({
        where: { id: 'mem_123' },
        data: updates,
        include: expect.any(Object),
      });
      expect(result.role).toBe('moderator');
    });

    it('should remove member from community', async () => {
      mockPrisma.communityMembership.updateMany.mockResolvedValue({ count: 1 });

      const result = await communitiesService.removeMember('comm_123', 'user_123', 'Violation of rules');

      expect(mockPrisma.communityMembership.updateMany).toHaveBeenCalledWith({
        where: { communityId: 'comm_123', userId: 'user_123' },
        data: {
          status: 'left',
          leftAt: expect.any(Date),
          notes: 'Violation of rules',
        }
      });
      expect(result).toBe(true);
    });
  });

  describe('Community Posts', () => {
    const mockPost: CommunityPost = {
      id: 'post_123',
      title: 'Welcome to the Community',
      content: 'This is our first community post!',
      type: 'announcement',
      authorId: 'user_123',
      communityId: 'comm_123',
      tags: ['welcome', 'announcement'],
      attachments: [],
      isPinned: false,
      isLocked: false,
      requiresApproval: false,
      metadata: {},
      siteId: 'site_123',
    };

    it('should create a community post', async () => {
      const membership = {
        communityId: 'comm_123',
        userId: 'user_123',
        status: 'active',
        role: 'member'
      };

      const community = {
        id: 'comm_123',
        allowMemberPosts: true
      };

      const createdPost = {
        ...mockPost,
        status: 'published',
        author: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
        community: { id: 'comm_123', name: 'Test Community', slug: 'test-community' },
        _count: { comments: 0, likes: 0 }
      };

      mockPrisma.communityMembership.findFirst.mockResolvedValue(membership);
      mockPrisma.community.findUnique.mockResolvedValue(community);
      mockPrisma.communityPost.create.mockResolvedValue(createdPost);

      const result = await communitiesService.createCommunityPost(mockPost);

      expect(mockPrisma.communityPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: mockPost.title,
          content: mockPost.content,
          type: mockPost.type,
          authorId: mockPost.authorId,
          communityId: mockPost.communityId,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdPost);
    });

    it('should prevent non-members from posting', async () => {
      mockPrisma.communityMembership.findFirst.mockResolvedValue(null);

      await expect(communitiesService.createCommunityPost(mockPost))
        .rejects.toThrow('User is not an active member of this community');
    });

    it('should prevent members from posting when not allowed', async () => {
      const membership = {
        communityId: 'comm_123',
        userId: 'user_123',
        status: 'active',
        role: 'member'
      };

      const restrictedCommunity = {
        id: 'comm_123',
        allowMemberPosts: false
      };

      mockPrisma.communityMembership.findFirst.mockResolvedValue(membership);
      mockPrisma.community.findUnique.mockResolvedValue(restrictedCommunity);

      await expect(communitiesService.createCommunityPost(mockPost))
        .rejects.toThrow('Members are not allowed to create posts in this community');
    });

    it('should get community posts with filters', async () => {
      const posts = [mockPost];
      mockPrisma.communityPost.findMany.mockResolvedValue(posts);
      mockPrisma.communityPost.count.mockResolvedValue(1);

      const result = await communitiesService.getCommunityPosts('comm_123', {
        type: ['announcement'],
        authorId: 'user_123',
        isPinned: false,
        sortBy: 'date',
        limit: 20,
        offset: 0,
      });

      expect(mockPrisma.communityPost.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          communityId: 'comm_123',
          type: { in: ['announcement'] },
          authorId: 'user_123',
          isPinned: false,
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result.posts).toEqual(posts);
      expect(result.total).toBe(1);
    });
  });

  describe('Invitations', () => {
    it('should create an invitation', async () => {
      const membership = {
        communityId: 'comm_123',
        userId: 'inviter_123',
        status: 'active',
        role: 'member'
      };

      const community = {
        id: 'comm_123',
        allowInvites: true
      };

      const inviteData = {
        communityId: 'comm_123',
        inviterId: 'inviter_123',
        inviteeEmail: 'invite@example.com',
        message: 'Join our community!',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        siteId: 'site_123',
      };

      const createdInvite = {
        ...inviteData,
        id: 'invite_123',
        status: 'pending',
        inviter: { id: 'inviter_123', name: 'Inviter User', email: 'inviter@example.com' },
        community: { id: 'comm_123', name: 'Test Community', slug: 'test-community' }
      };

      mockPrisma.communityMembership.findFirst.mockResolvedValue(membership);
      mockPrisma.community.findUnique.mockResolvedValue(community);
      mockPrisma.communityInvite.create.mockResolvedValue(createdInvite);

      const result = await communitiesService.createInvite(inviteData);

      expect(mockPrisma.communityInvite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          communityId: 'comm_123',
          inviterId: 'inviter_123',
          inviteeEmail: 'invite@example.com',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdInvite);
    });

    it('should prevent non-members from inviting', async () => {
      mockPrisma.communityMembership.findFirst.mockResolvedValue(null);

      const inviteData = {
        communityId: 'comm_123',
        inviterId: 'non_member_123',
        inviteeEmail: 'invite@example.com',
        expiresAt: new Date(),
        siteId: 'site_123',
      };

      await expect(communitiesService.createInvite(inviteData))
        .rejects.toThrow('User is not a member of this community');
    });
  });

  describe('Moderation', () => {
    it('should moderate community content', async () => {
      const moderationData = {
        communityId: 'comm_123',
        targetType: 'member' as const,
        targetId: 'user_123',
        action: 'ban' as const,
        moderatorId: 'mod_123',
        reason: 'Violation of community rules',
        siteId: 'site_123',
      };

      mockPrisma.communityModerationLog.create.mockResolvedValue({});
      mockPrisma.communityMembership.updateMany.mockResolvedValue({ count: 1 });

      const result = await communitiesService.moderateCommunity(moderationData);

      expect(mockPrisma.communityModerationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining(moderationData),
      });
      expect(mockPrisma.communityMembership.updateMany).toHaveBeenCalledWith({
        where: { communityId: 'comm_123', userId: 'user_123' },
        data: { status: 'banned' }
      });
      expect(result).toBe(true);
    });

    it('should handle different moderation actions', async () => {
      const moderationData = {
        communityId: 'comm_123',
        targetType: 'post' as const,
        targetId: 'post_123',
        action: 'remove' as const,
        moderatorId: 'mod_123',
        siteId: 'site_123',
      };

      mockPrisma.communityModerationLog.create.mockResolvedValue({});
      mockPrisma.communityPost.update.mockResolvedValue({});

      const result = await communitiesService.moderateCommunity(moderationData);

      expect(mockPrisma.communityPost.update).toHaveBeenCalledWith({
        where: { id: 'post_123' },
        data: { status: 'removed' }
      });
      expect(result).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should get community analytics', async () => {
      mockPrisma.community.count
        .mockResolvedValueOnce(25)  // total communities
        .mockResolvedValueOnce(20); // active communities

      mockPrisma.communityMembership.count.mockResolvedValue(500); // total members
      mockPrisma.communityPost.count.mockResolvedValue(150); // total posts

      const result = await communitiesService.getCommunityAnalytics('site_123', '30d');

      expect(result.totalCommunities).toBe(25);
      expect(result.activeCommunities).toBe(20);
      expect(result.totalMembers).toBe(500);
      expect(result.totalPosts).toBe(150);
      expect(result.averageMembersPerCommunity).toBe(20);
      expect(result.averagePostsPerCommunity).toBe(6);
    });
  });

  describe('Error Handling', () => {
    it('should handle community creation errors', async () => {
      mockPrisma.community.create.mockRejectedValue(new Error('Database error'));

      await expect(communitiesService.createCommunity({
        name: 'Test Community',
        slug: 'test-community',
        type: 'public',
        ownerId: 'owner_123',
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle membership errors gracefully', async () => {
      const community = { id: 'comm_123', isActive: false };
      mockPrisma.community.findUnique.mockResolvedValue(community);

      await expect(communitiesService.addMember({
        communityId: 'comm_123',
        userId: 'user_123',
        role: 'member',
        status: 'active',
        siteId: 'site_123',
      })).rejects.toThrow('Community not found or inactive');
    });

    it('should handle moderation errors gracefully', async () => {
      mockPrisma.communityModerationLog.create.mockRejectedValue(new Error('Moderation error'));

      const result = await communitiesService.moderateCommunity({
        communityId: 'comm_123',
        targetType: 'member',
        targetId: 'user_123',
        action: 'ban',
        moderatorId: 'mod_123',
        siteId: 'site_123',
      });

      expect(result).toBe(false);
    });

    it('should handle delete errors gracefully', async () => {
      mockPrisma.community.update.mockRejectedValue(new Error('Delete failed'));

      const result = await communitiesService.deleteCommunity('comm_123');

      expect(result).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate community data', async () => {
      const invalidCommunity = {
        name: '', // Invalid: empty name
        slug: 'test',
        type: 'public',
        ownerId: 'owner_123',
        siteId: 'site_123',
      };

      await expect(communitiesService.createCommunity(invalidCommunity as any))
        .rejects.toThrow();
    });

    it('should validate membership data', async () => {
      const invalidMembership = {
        communityId: '', // Invalid: empty community ID
        userId: 'user_123',
        role: 'member',
        status: 'active',
        siteId: 'site_123',
      };

      await expect(communitiesService.addMember(invalidMembership as any))
        .rejects.toThrow();
    });

    it('should validate post data', async () => {
      const invalidPost = {
        title: '', // Invalid: empty title
        content: 'Test content',
        type: 'discussion',
        authorId: 'user_123',
        communityId: 'comm_123',
        siteId: 'site_123',
      };

      const membership = { communityId: 'comm_123', userId: 'user_123', status: 'active', role: 'member' };
      const community = { id: 'comm_123', allowMemberPosts: true };

      mockPrisma.communityMembership.findFirst.mockResolvedValue(membership);
      mockPrisma.community.findUnique.mockResolvedValue(community);

      await expect(communitiesService.createCommunityPost(invalidPost as any))
        .rejects.toThrow();
    });
  });
}); 