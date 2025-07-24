import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const CommunitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Community name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Community slug is required'),
  type: z.enum(['public', 'private', 'secret', 'premium']),
  category: z.string().optional(),
  avatar: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  guidelines: z.string().optional(),
  maxMembers: z.number().int().min(1).optional(),
  membershipFee: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  requiresApproval: z.boolean().default(false),
  allowInvites: z.boolean().default(true),
  allowMemberPosts: z.boolean().default(true),
  allowEvents: z.boolean().default(true),
  ownerId: z.string().min(1, 'Owner ID is required'),
  moderators: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const CommunityMembershipSchema = z.object({
  id: z.string().optional(),
  communityId: z.string().min(1, 'Community ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['owner', 'moderator', 'member', 'pending', 'banned']).default('member'),
  status: z.enum(['active', 'inactive', 'pending', 'banned', 'left']).default('active'),
  joinedAt: z.date().default(() => new Date()),
  leftAt: z.date().optional(),
  invitedBy: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  notes: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const CommunityPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Post title is required'),
  content: z.string().min(1, 'Post content is required'),
  type: z.enum(['discussion', 'announcement', 'event', 'poll', 'resource', 'question']),
  authorId: z.string().min(1, 'Author ID is required'),
  communityId: z.string().min(1, 'Community ID is required'),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const CommunityInviteSchema = z.object({
  id: z.string().optional(),
  communityId: z.string().min(1, 'Community ID is required'),
  inviterId: z.string().min(1, 'Inviter ID is required'),
  inviteeEmail: z.string().email('Valid email is required'),
  inviteeId: z.string().optional(),
  message: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']).default('pending'),
  expiresAt: z.date(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const CommunityModerationSchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
  targetType: z.enum(['member', 'post', 'comment']),
  targetId: z.string().min(1, 'Target ID is required'),
  action: z.enum(['warn', 'mute', 'ban', 'remove', 'approve', 'reject']),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
  reason: z.string().optional(),
  duration: z.number().int().min(0).optional(), // in days, 0 = permanent
  notes: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

// Types
export type Community = z.infer<typeof CommunitySchema>;
export type CommunityMembership = z.infer<typeof CommunityMembershipSchema>;
export type CommunityPost = z.infer<typeof CommunityPostSchema>;
export type CommunityInvite = z.infer<typeof CommunityInviteSchema>;
export type CommunityModeration = z.infer<typeof CommunityModerationSchema>;

export interface CommunityDetails extends Community {
  owner: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  postCount: number;
  activeMembers: number;
  isUserMember?: boolean;
  userRole?: string;
  userStatus?: string;
  recentActivity?: Array<{
    type: string;
    user: string;
    timestamp: Date;
    description: string;
  }>;
}

export interface CommunityAnalytics {
  totalCommunities: number;
  activeCommunities: number;
  totalMembers: number;
  totalPosts: number;
  averageMembersPerCommunity: number;
  averagePostsPerCommunity: number;
  memberGrowth: Array<{
    date: string;
    newMembers: number;
    totalMembers: number;
  }>;
  popularCommunities: Array<{
    id: string;
    name: string;
    memberCount: number;
    postCount: number;
    activityScore: number;
  }>;
  engagementMetrics: {
    averagePostsPerMember: number;
    averageCommentsPerPost: number;
    dailyActiveMembers: number;
    monthlyActiveMembers: number;
  };
  topCategories: Array<{
    category: string;
    communityCount: number;
    memberCount: number;
  }>;
}

export interface MemberProfile {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  membership: CommunityMembership;
  stats: {
    postsCount: number;
    commentsCount: number;
    likesReceived: number;
    joinedDaysAgo: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt: Date;
  }>;
}

export class CommunitiesService {
  constructor(private config: {
    enableModeration?: boolean;
    enableAnalytics?: boolean;
    enableNotifications?: boolean;
    maxCommunitiesPerUser?: number;
  } = {}) {
    this.config = {
      enableModeration: true,
      enableAnalytics: true,
      enableNotifications: true,
      maxCommunitiesPerUser: 10,
      ...config
    };
  }

  // Community Management
  async createCommunity(communityData: Community): Promise<CommunityDetails> {
    const validatedData = CommunitySchema.parse(communityData);

    // Check if user hasn't exceeded community creation limit
    if (this.config.maxCommunitiesPerUser) {
      const userCommunityCount = await prisma.community.count({
        where: { ownerId: validatedData.ownerId, siteId: validatedData.siteId }
      });

      if (userCommunityCount >= this.config.maxCommunitiesPerUser) {
        throw new Error(`Maximum communities per user exceeded (${this.config.maxCommunitiesPerUser})`);
      }
    }

    // Check if slug is unique within site
    const existingSlug = await prisma.community.findFirst({
      where: { slug: validatedData.slug, siteId: validatedData.siteId }
    });

    if (existingSlug) {
      throw new Error('Community slug already exists');
    }

    const community = await prisma.community.create({
      data: {
        ...validatedData,
        id: validatedData.id || `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            members: { where: { status: 'active' } },
            posts: true,
            activeMembers: { where: { status: 'active', joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
          }
        }
      }
    });

    // Automatically add owner as first member
    await this.addMember({
      communityId: community.id,
      userId: validatedData.ownerId,
      role: 'owner',
      status: 'active',
      siteId: validatedData.siteId,
    });

    return {
      ...community,
      memberCount: community._count.members,
      postCount: community._count.posts,
      activeMembers: community._count.activeMembers,
    };
  }

  async getCommunity(communityId: string, userId?: string): Promise<CommunityDetails | null> {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            members: { where: { status: 'active' } },
            posts: true,
            activeMembers: { where: { status: 'active', joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
          }
        }
      }
    });

    if (!community) return null;

    let userMembership = null;
    if (userId) {
      userMembership = await prisma.communityMembership.findFirst({
        where: { communityId, userId }
      });
    }

    const recentActivity = await this.getCommunityActivity(communityId, 10);

    return {
      ...community,
      memberCount: community._count.members,
      postCount: community._count.posts,
      activeMembers: community._count.activeMembers,
      isUserMember: !!userMembership,
      userRole: userMembership?.role,
      userStatus: userMembership?.status,
      recentActivity,
    };
  }

  async getCommunities(options: {
    siteId: string;
    type?: string[];
    category?: string;
    ownerId?: string;
    userId?: string; // For user's communities
    search?: string;
    sortBy?: 'name' | 'members' | 'posts' | 'activity' | 'created';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ communities: CommunityDetails[]; total: number }> {
    const {
      siteId,
      type,
      category,
      ownerId,
      userId,
      search,
      sortBy = 'created',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    const whereClause: any = {
      siteId,
      isActive: true,
    };

    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    if (category) {
      whereClause.category = category;
    }

    if (ownerId) {
      whereClause.ownerId = ownerId;
    }

    if (userId) {
      whereClause.members = {
        some: { userId, status: 'active' }
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const orderBy = this.getCommunityOrderBy(sortBy, sortOrder);

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where: whereClause,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              members: { where: { status: 'active' } },
              posts: true,
              activeMembers: { where: { status: 'active', joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.community.count({ where: whereClause })
    ]);

    const communityDetails = communities.map(community => ({
      ...community,
      memberCount: community._count.members,
      postCount: community._count.posts,
      activeMembers: community._count.activeMembers,
    }));

    return { communities: communityDetails, total };
  }

  async updateCommunity(communityId: string, updates: Partial<Community>): Promise<CommunityDetails> {
    const community = await prisma.community.update({
      where: { id: communityId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            members: { where: { status: 'active' } },
            posts: true,
            activeMembers: { where: { status: 'active', joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
          }
        }
      }
    });

    return {
      ...community,
      memberCount: community._count.members,
      postCount: community._count.posts,
      activeMembers: community._count.activeMembers,
    };
  }

  async deleteCommunity(communityId: string): Promise<boolean> {
    try {
      // Soft delete by marking as inactive
      await prisma.community.update({
        where: { id: communityId },
        data: { isActive: false, updatedAt: new Date() }
      });

      return true;
    } catch (error) {
      console.error('Error deleting community:', error);
      return false;
    }
  }

  // Membership Management
  async addMember(membershipData: CommunityMembership): Promise<CommunityMembership> {
    const validatedData = CommunityMembershipSchema.parse(membershipData);

    // Check if community exists and is active
    const community = await prisma.community.findUnique({
      where: { id: validatedData.communityId },
      include: { _count: { select: { members: { where: { status: 'active' } } } } }
    });

    if (!community || !community.isActive) {
      throw new Error('Community not found or inactive');
    }

    // Check if user is already a member
    const existing = await prisma.communityMembership.findFirst({
      where: {
        communityId: validatedData.communityId,
        userId: validatedData.userId
      }
    });

    if (existing && existing.status !== 'left') {
      throw new Error('User is already a member of this community');
    }

    // Check member limit
    if (community.maxMembers && community._count.members >= community.maxMembers) {
      throw new Error('Community has reached maximum member capacity');
    }

    // Determine initial status
    let status = validatedData.status;
    if (community.requiresApproval && validatedData.role === 'member') {
      status = 'pending';
    }

    const membership = await prisma.communityMembership.create({
      data: {
        ...validatedData,
        id: validatedData.id || `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        community: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Send notifications
    if (this.config.enableNotifications) {
      await this.sendMembershipNotification(membership, 'joined');
    }

    return membership;
  }

  async getCommunityMembers(communityId: string, options: {
    role?: string[];
    status?: string[];
    search?: string;
    sortBy?: 'joined' | 'name' | 'role' | 'activity';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ members: MemberProfile[]; total: number }> {
    const {
      role,
      status = ['active'],
      search,
      sortBy = 'joined',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = {
      communityId,
      status: { in: status }
    };

    if (role && role.length > 0) {
      whereClause.role = { in: role };
    }

    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const orderBy = this.getMemberOrderBy(sortBy, sortOrder);

    const [memberships, total] = await Promise.all([
      prisma.communityMembership.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.communityMembership.count({ where: whereClause })
    ]);

    const memberProfiles: MemberProfile[] = await Promise.all(
      memberships.map(async (membership) => {
        const stats = await this.getMemberStats(membership.userId, communityId);
        const badges = await this.getMemberBadges(membership.userId, communityId);

        return {
          user: membership.user,
          membership,
          stats,
          badges,
        };
      })
    );

    return { members: memberProfiles, total };
  }

  async updateMembership(membershipId: string, updates: Partial<CommunityMembership>): Promise<CommunityMembership> {
    const membership = await prisma.communityMembership.update({
      where: { id: membershipId },
      data: updates,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        community: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Send notifications for role/status changes
    if (this.config.enableNotifications && (updates.role || updates.status)) {
      await this.sendMembershipNotification(membership, 'updated');
    }

    return membership;
  }

  async removeMember(communityId: string, userId: string, reason?: string): Promise<boolean> {
    try {
      await prisma.communityMembership.updateMany({
        where: { communityId, userId },
        data: {
          status: 'left',
          leftAt: new Date(),
          notes: reason,
        }
      });

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }

  // Community Posts
  async createCommunityPost(postData: CommunityPost): Promise<CommunityPost> {
    const validatedData = CommunityPostSchema.parse(postData);

    // Check if user is a member and can post
    const membership = await prisma.communityMembership.findFirst({
      where: {
        communityId: validatedData.communityId,
        userId: validatedData.authorId,
        status: 'active'
      }
    });

    if (!membership) {
      throw new Error('User is not an active member of this community');
    }

    const community = await prisma.community.findUnique({
      where: { id: validatedData.communityId }
    });

    if (!community?.allowMemberPosts && membership.role === 'member') {
      throw new Error('Members are not allowed to create posts in this community');
    }

    const post = await prisma.communityPost.create({
      data: {
        ...validatedData,
        id: validatedData.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: validatedData.requiresApproval ? 'pending' : 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        community: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    return post;
  }

  async getCommunityPosts(communityId: string, options: {
    type?: string[];
    authorId?: string;
    isPinned?: boolean;
    sortBy?: 'date' | 'likes' | 'comments' | 'title';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ posts: CommunityPost[]; total: number }> {
    const {
      type,
      authorId,
      isPinned,
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    const whereClause: any = {
      communityId,
      status: 'published'
    };

    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    if (authorId) {
      whereClause.authorId = authorId;
    }

    if (isPinned !== undefined) {
      whereClause.isPinned = isPinned;
    }

    const orderBy = this.getPostOrderBy(sortBy, sortOrder);

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          community: {
            select: { id: true, name: true, slug: true }
          },
          _count: {
            select: { comments: true, likes: true }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.communityPost.count({ where: whereClause })
    ]);

    return { posts, total };
  }

  // Invitations
  async createInvite(inviteData: CommunityInvite): Promise<CommunityInvite> {
    const validatedData = CommunityInviteSchema.parse(inviteData);

    // Check if inviter has permission to invite
    const membership = await prisma.communityMembership.findFirst({
      where: {
        communityId: validatedData.communityId,
        userId: validatedData.inviterId,
        status: 'active'
      }
    });

    if (!membership) {
      throw new Error('User is not a member of this community');
    }

    const community = await prisma.community.findUnique({
      where: { id: validatedData.communityId }
    });

    if (!community?.allowInvites && membership.role === 'member') {
      throw new Error('Members are not allowed to invite others to this community');
    }

    const invite = await prisma.communityInvite.create({
      data: {
        ...validatedData,
        id: validatedData.id || `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true }
        },
        community: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Send invitation email
    await this.sendInvitationEmail(invite);

    return invite;
  }

  // Moderation
  async moderateCommunity(moderationData: CommunityModeration): Promise<boolean> {
    const validatedData = CommunityModerationSchema.parse(moderationData);

    try {
      // Log moderation action
      await prisma.communityModerationLog.create({
        data: {
          id: `modlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validatedData,
          createdAt: new Date(),
        }
      });

      // Apply moderation action
      switch (validatedData.targetType) {
        case 'member':
          await this.moderateMember(validatedData);
          break;
        case 'post':
          await this.moderatePost(validatedData);
          break;
        case 'comment':
          await this.moderateComment(validatedData);
          break;
      }

      return true;
    } catch (error) {
      console.error('Error moderating community:', error);
      return false;
    }
  }

  // Analytics
  async getCommunityAnalytics(siteId: string, timeRange: string = '30d'): Promise<CommunityAnalytics> {
    const dateFilter = this.getDateFilter(timeRange);

    const [
      totalCommunities,
      activeCommunities,
      totalMembers,
      totalPosts,
      memberGrowth,
      popularCommunities,
      engagementMetrics,
      topCategories
    ] = await Promise.all([
      prisma.community.count({
        where: { siteId, isActive: true }
      }),
      prisma.community.count({
        where: { 
          siteId, 
          isActive: true,
          updatedAt: dateFilter
        }
      }),
      prisma.communityMembership.count({
        where: { siteId, status: 'active' }
      }),
      prisma.communityPost.count({
        where: { siteId, createdAt: dateFilter }
      }),
      this.getMemberGrowthTrends(siteId, timeRange),
      this.getPopularCommunities(siteId, dateFilter),
      this.getCommunityEngagementMetrics(siteId, dateFilter),
      this.getTopCategories(siteId)
    ]);

    const averageMembersPerCommunity = totalCommunities > 0 ? totalMembers / totalCommunities : 0;
    const averagePostsPerCommunity = totalCommunities > 0 ? totalPosts / totalCommunities : 0;

    return {
      totalCommunities,
      activeCommunities,
      totalMembers,
      totalPosts,
      averageMembersPerCommunity,
      averagePostsPerCommunity,
      memberGrowth,
      popularCommunities,
      engagementMetrics,
      topCategories,
    };
  }

  // Helper methods
  private async getCommunityActivity(communityId: string, limit: number = 10) {
    // Implementation for getting recent community activity
    return [];
  }

  private async getMemberStats(userId: string, communityId: string) {
    const [postsCount, commentsCount, likesReceived, user] = await Promise.all([
      prisma.communityPost.count({
        where: { authorId: userId, communityId }
      }),
      prisma.comment.count({
        where: { authorId: userId, communityPost: { communityId } }
      }),
      prisma.like.count({
        where: { 
          OR: [
            { post: { authorId: userId, communityId } },
            { comment: { author: { id: userId }, communityPost: { communityId } } }
          ]
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })
    ]);

    const joinedDaysAgo = user?.createdAt 
      ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      postsCount,
      commentsCount,
      likesReceived,
      joinedDaysAgo,
    };
  }

  private async getMemberBadges(userId: string, communityId: string) {
    // Implementation for getting member badges
    return [];
  }

  private async sendMembershipNotification(membership: any, type: string): Promise<void> {
    // Implementation for sending membership notifications
    console.log('Sending membership notification:', membership.id, type);
  }

  private async sendInvitationEmail(invite: any): Promise<void> {
    // Implementation for sending invitation emails
    console.log('Sending invitation email:', invite.id);
  }

  private async moderateMember(moderation: CommunityModeration): Promise<void> {
    const updates: any = {};

    switch (moderation.action) {
      case 'ban':
        updates.status = 'banned';
        break;
      case 'mute':
        updates.permissions = ['no_post', 'no_comment'];
        break;
      case 'warn':
        // Add warning to member notes
        updates.notes = `Warning: ${moderation.reason}`;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.communityMembership.updateMany({
        where: { 
          communityId: moderation.communityId,
          userId: moderation.targetId
        },
        data: updates
      });
    }
  }

  private async moderatePost(moderation: CommunityModeration): Promise<void> {
    const updates: any = {};

    switch (moderation.action) {
      case 'remove':
        updates.status = 'removed';
        break;
      case 'approve':
        updates.status = 'published';
        break;
      case 'reject':
        updates.status = 'rejected';
        break;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.communityPost.update({
        where: { id: moderation.targetId },
        data: updates
      });
    }
  }

  private async moderateComment(moderation: CommunityModeration): Promise<void> {
    const updates: any = {};

    switch (moderation.action) {
      case 'remove':
        updates.status = 'removed';
        break;
      case 'approve':
        updates.status = 'approved';
        break;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.comment.update({
        where: { id: moderation.targetId },
        data: updates
      });
    }
  }

  private getCommunityOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'members':
        return { members: { _count: order } };
      case 'posts':
        return { posts: { _count: order } };
      case 'activity':
        return { updatedAt: order };
      case 'created':
      default:
        return { createdAt: order };
    }
  }

  private getMemberOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'name':
        return { user: { name: order } };
      case 'role':
        return { role: order };
      case 'activity':
        return { updatedAt: order };
      case 'joined':
      default:
        return { joinedAt: order };
    }
  }

  private getPostOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'title':
        return { title: order };
      case 'likes':
        return { likes: { _count: order } };
      case 'comments':
        return { comments: { _count: order } };
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

  private async getMemberGrowthTrends(siteId: string, timeRange: string) {
    // Implementation for member growth trends
    return [];
  }

  private async getPopularCommunities(siteId: string, dateFilter: any) {
    // Implementation for popular communities
    return [];
  }

  private async getCommunityEngagementMetrics(siteId: string, dateFilter: any) {
    // Implementation for engagement metrics
    return {
      averagePostsPerMember: 0,
      averageCommentsPerPost: 0,
      dailyActiveMembers: 0,
      monthlyActiveMembers: 0,
    };
  }

  private async getTopCategories(siteId: string) {
    // Implementation for top categories
    return [];
  }
}

export const communitiesService = new CommunitiesService({
  enableModeration: true,
  enableAnalytics: true,
  enableNotifications: true,
  maxCommunitiesPerUser: 10,
}); 