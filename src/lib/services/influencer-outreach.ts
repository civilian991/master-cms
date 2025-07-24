import { prisma } from '../prisma';
import { 
  InfluencerStatus, 
  InfluencerCampaignStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// Influencer Data Interface
interface InfluencerData {
  name: string;
  email?: string;
  platform: string;
  handle: string;
  followers: number;
  engagement: number;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
  siteId: string;
}

// Influencer Scoring Criteria
interface ScoringCriteria {
  followers: { min: number; max: number; weight: number };
  engagement: { min: number; max: number; weight: number };
  platform: { [key: string]: number }; // platform-specific weights
  tags: { [key: string]: number }; // tag-specific weights
  activity: { min: number; max: number; weight: number };
}

// Influencer Outreach Workflow
interface OutreachWorkflow {
  id: string;
  name: string;
  description?: string;
  triggers: string[];
  actions: Array<{
    type: 'email' | 'social' | 'notification';
    template: string;
    delay?: number; // hours
    conditions?: Record<string, any>;
  }>;
  isActive: boolean;
  siteId: string;
  createdBy: string;
}

// Influencer Analytics
interface InfluencerAnalytics {
  totalInfluencers: number;
  activeInfluencers: number;
  totalFollowers: number;
  averageEngagement: number;
  topPerformingInfluencers: Array<{
    id: string;
    name: string;
    platform: string;
    followers: number;
    engagement: number;
    score: number;
  }>;
  platformBreakdown: Record<string, {
    count: number;
    totalFollowers: number;
    averageEngagement: number;
  }>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    influencerName: string;
    results: Record<string, any>;
    roi: number;
  }>;
}

// Influencer Campaign Data
interface InfluencerCampaignData {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  influencerId: string;
  siteId: string;
  createdBy: string;
}

// Influencer Outreach Service Class
export class InfluencerOutreachService {
  /**
   * Create a new influencer
   */
  async createInfluencer(data: InfluencerData) {
    try {
      // Calculate initial score
      const score = this.calculateInfluencerScore(data);

      const influencer = await prisma.influencer.create({
        data: {
          name: data.name,
          email: data.email,
          platform: data.platform,
          handle: data.handle,
          followers: data.followers,
          engagement: data.engagement,
          score,
          tags: data.tags || {},
          metadata: data.metadata || {},
          siteId: data.siteId,
        },
      });

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'influencer_added',
          value: 1,
          date: new Date(),
          siteId: data.siteId,
          metadata: { influencerId: influencer.id, platform: data.platform },
        },
      });

      return influencer;
    } catch (error) {
      console.error('Failed to create influencer:', error);
      throw error;
    }
  }

  /**
   * Get influencers for a site
   */
  async getInfluencers(siteId: string, options: {
    status?: InfluencerStatus;
    platform?: string;
    minFollowers?: number;
    maxFollowers?: number;
    minEngagement?: number;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const whereClause: any = { siteId };

      if (options.status) whereClause.status = options.status;
      if (options.platform) whereClause.platform = options.platform;
      if (options.minFollowers) whereClause.followers = { gte: options.minFollowers };
      if (options.maxFollowers) {
        whereClause.followers = { ...whereClause.followers, lte: options.maxFollowers };
      }
      if (options.minEngagement) whereClause.engagement = { gte: options.minEngagement };

      const influencers = await prisma.influencer.findMany({
        where: whereClause,
        include: {
          campaigns: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { score: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      // Filter by tags if specified
      if (options.tags && options.tags.length > 0) {
        return influencers.filter(influencer => {
          const influencerTags = influencer.tags as Record<string, any> || {};
          return options.tags!.some(tag => influencerTags[tag]);
        });
      }

      return influencers;
    } catch (error) {
      console.error('Failed to get influencers:', error);
      throw error;
    }
  }

  /**
   * Get influencer by ID
   */
  async getInfluencer(influencerId: string) {
    try {
      const influencer = await prisma.influencer.findUnique({
        where: { id: influencerId },
        include: {
          campaigns: {
            orderBy: { createdAt: 'desc' },
            include: {
              createdUser: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      return influencer;
    } catch (error) {
      console.error('Failed to get influencer:', error);
      throw error;
    }
  }

  /**
   * Update influencer
   */
  async updateInfluencer(influencerId: string, data: Partial<InfluencerData>) {
    try {
      // Recalculate score if relevant fields changed
      let score;
      if (data.followers !== undefined || data.engagement !== undefined || data.tags) {
        const currentInfluencer = await this.getInfluencer(influencerId);
        if (currentInfluencer) {
          const updatedData = {
            ...currentInfluencer,
            ...data,
          };
          score = this.calculateInfluencerScore(updatedData);
        }
      }

      const updateData: any = { ...data };
      if (score !== undefined) {
        updateData.score = score;
      }

      const influencer = await prisma.influencer.update({
        where: { id: influencerId },
        data: updateData,
      });

      return influencer;
    } catch (error) {
      console.error('Failed to update influencer:', error);
      throw error;
    }
  }

  /**
   * Delete influencer
   */
  async deleteInfluencer(influencerId: string) {
    try {
      // Delete related campaigns first
      await prisma.influencerCampaign.deleteMany({
        where: { influencerId },
      });

      // Delete the influencer
      await prisma.influencer.delete({
        where: { id: influencerId },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete influencer:', error);
      throw error;
    }
  }

  /**
   * Calculate influencer score based on various criteria
   */
  private calculateInfluencerScore(influencer: InfluencerData | any): number {
    const criteria: ScoringCriteria = {
      followers: { min: 1000, max: 1000000, weight: 0.3 },
      engagement: { min: 1, max: 10, weight: 0.4 },
      platform: {
        instagram: 1.0,
        youtube: 0.9,
        tiktok: 0.8,
        twitter: 0.7,
        linkedin: 0.6,
        facebook: 0.5,
      },
      tags: {
        'tech': 1.2,
        'fashion': 1.1,
        'lifestyle': 1.0,
        'business': 1.3,
        'health': 1.1,
      },
      activity: { min: 1, max: 10, weight: 0.3 },
    };

    let score = 0;

    // Follower score (0-100)
    const followerScore = Math.min(
      100,
      (influencer.followers / criteria.followers.max) * 100
    );
    score += followerScore * criteria.followers.weight;

    // Engagement score (0-100)
    const engagementScore = Math.min(
      100,
      (influencer.engagement / criteria.engagement.max) * 100
    );
    score += engagementScore * criteria.engagement.weight;

    // Platform score
    const platformMultiplier = criteria.platform[influencer.platform.toLowerCase()] || 0.5;
    score *= platformMultiplier;

    // Tag score
    const tags = influencer.tags || {};
    let tagMultiplier = 1.0;
    Object.keys(tags).forEach(tag => {
      if (criteria.tags[tag.toLowerCase()]) {
        tagMultiplier *= criteria.tags[tag.toLowerCase()];
      }
    });
    score *= tagMultiplier;

    // Activity score (simplified - in real implementation, would check recent activity)
    const activityScore = 50; // Default activity score
    score += activityScore * criteria.activity.weight;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Discover influencers based on criteria
   */
  async discoverInfluencers(criteria: {
    platform?: string;
    minFollowers?: number;
    maxFollowers?: number;
    minEngagement?: number;
    tags?: string[];
    keywords?: string[];
    siteId: string;
  }) {
    try {
      // In a real implementation, this would integrate with social media APIs
      // For now, we'll return existing influencers that match criteria
      const influencers = await this.getInfluencers(criteria.siteId, {
        platform: criteria.platform,
        minFollowers: criteria.minFollowers,
        maxFollowers: criteria.maxFollowers,
        minEngagement: criteria.minEngagement,
        tags: criteria.tags,
      });

      // Simulate discovery results
      const discoveryResults = influencers.map(influencer => ({
        ...influencer,
        matchScore: this.calculateMatchScore(influencer, criteria),
        suggestedOutreach: this.generateOutreachSuggestion(influencer, criteria),
      }));

      return discoveryResults.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Failed to discover influencers:', error);
      throw error;
    }
  }

  /**
   * Calculate match score for discovery
   */
  private calculateMatchScore(influencer: any, criteria: any): number {
    let score = 0;

    // Platform match
    if (criteria.platform && influencer.platform.toLowerCase() === criteria.platform.toLowerCase()) {
      score += 25;
    }

    // Follower range match
    if (criteria.minFollowers && influencer.followers >= criteria.minFollowers) {
      score += 20;
    }
    if (criteria.maxFollowers && influencer.followers <= criteria.maxFollowers) {
      score += 20;
    }

    // Engagement match
    if (criteria.minEngagement && influencer.engagement >= criteria.minEngagement) {
      score += 25;
    }

    // Tag match
    if (criteria.tags && criteria.tags.length > 0) {
      const influencerTags = influencer.tags as Record<string, any> || {};
      const matchingTags = criteria.tags.filter((tag: string) => influencerTags[tag]);
      score += (matchingTags.length / criteria.tags.length) * 10;
    }

    return Math.min(100, score);
  }

  /**
   * Generate outreach suggestion
   */
  private generateOutreachSuggestion(influencer: any, criteria: any): string {
    const suggestions = [
      `Send personalized email to ${influencer.name} highlighting mutual interests`,
      `Engage with ${influencer.name}'s recent content before reaching out`,
      `Offer exclusive collaboration opportunity to ${influencer.name}`,
      `Invite ${influencer.name} to exclusive event or product launch`,
    ];

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  /**
   * Create influencer campaign
   */
  async createInfluencerCampaign(data: InfluencerCampaignData) {
    try {
      const campaign = await prisma.influencerCampaign.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          influencerId: data.influencerId,
          siteId: data.siteId,
          createdBy: data.createdBy,
        },
      });

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'influencer_campaign_created',
          value: 1,
          date: new Date(),
          siteId: data.siteId,
          metadata: { campaignId: campaign.id, influencerId: data.influencerId },
        },
      });

      return campaign;
    } catch (error) {
      console.error('Failed to create influencer campaign:', error);
      throw error;
    }
  }

  /**
   * Get influencer campaigns
   */
  async getInfluencerCampaigns(siteId: string, options: {
    status?: InfluencerCampaignStatus;
    influencerId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const whereClause: any = { siteId };

      if (options.status) whereClause.status = options.status;
      if (options.influencerId) whereClause.influencerId = options.influencerId;

      const campaigns = await prisma.influencerCampaign.findMany({
        where: whereClause,
        include: {
          influencer: true,
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return campaigns;
    } catch (error) {
      console.error('Failed to get influencer campaigns:', error);
      throw error;
    }
  }

  /**
   * Update influencer campaign
   */
  async updateInfluencerCampaign(campaignId: string, data: Partial<InfluencerCampaignData>) {
    try {
      const campaign = await prisma.influencerCampaign.update({
        where: { id: campaignId },
        data,
      });

      return campaign;
    } catch (error) {
      console.error('Failed to update influencer campaign:', error);
      throw error;
    }
  }

  /**
   * Get influencer analytics
   */
  async getInfluencerAnalytics(siteId: string, dateRange?: { start: Date; end: Date }) {
    try {
      const influencers = await this.getInfluencers(siteId);
      const campaigns = await this.getInfluencerCampaigns(siteId);

      const analytics: InfluencerAnalytics = {
        totalInfluencers: influencers.length,
        activeInfluencers: influencers.filter(i => i.status === 'ACTIVE').length,
        totalFollowers: influencers.reduce((sum, i) => sum + i.followers, 0),
        averageEngagement: influencers.length > 0 
          ? influencers.reduce((sum, i) => sum + i.engagement, 0) / influencers.length 
          : 0,
        topPerformingInfluencers: influencers
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(i => ({
            id: i.id,
            name: i.name,
            platform: i.platform,
            followers: i.followers,
            engagement: i.engagement,
            score: i.score,
          })),
        platformBreakdown: {},
        campaignPerformance: campaigns
          .filter(c => c.results)
          .map(c => ({
            id: c.id,
            name: c.name,
            influencerName: c.influencer.name,
            results: c.results as Record<string, any>,
            roi: this.calculateCampaignROI(c),
          })),
      };

      // Calculate platform breakdown
      const platformStats: Record<string, { count: number; totalFollowers: number; totalEngagement: number }> = {};
      influencers.forEach(influencer => {
        const platform = influencer.platform.toLowerCase();
        if (!platformStats[platform]) {
          platformStats[platform] = { count: 0, totalFollowers: 0, totalEngagement: 0 };
        }
        platformStats[platform].count++;
        platformStats[platform].totalFollowers += influencer.followers;
        platformStats[platform].totalEngagement += influencer.engagement;
      });

      Object.keys(platformStats).forEach(platform => {
        const stats = platformStats[platform];
        analytics.platformBreakdown[platform] = {
          count: stats.count,
          totalFollowers: stats.totalFollowers,
          averageEngagement: stats.count > 0 ? stats.totalEngagement / stats.count : 0,
        };
      });

      return analytics;
    } catch (error) {
      console.error('Failed to get influencer analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate campaign ROI
   */
  private calculateCampaignROI(campaign: any): number {
    if (!campaign.results || !campaign.budget) return 0;

    const results = campaign.results as Record<string, any>;
    const revenue = results.revenue || 0;
    const budget = Number(campaign.budget);

    if (budget === 0) return 0;

    return ((revenue - budget) / budget) * 100;
  }

  /**
   * Create outreach workflow
   */
  async createOutreachWorkflow(data: Omit<OutreachWorkflow, 'id'>) {
    try {
      // In a real implementation, this would be stored in a separate table
      // For now, we'll simulate workflow creation
      const workflow: OutreachWorkflow = {
        id: `workflow-${Date.now()}`,
        ...data,
      };

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'outreach_workflow_created',
          value: 1,
          date: new Date(),
          siteId: data.siteId,
          metadata: { workflowId: workflow.id },
        },
      });

      return workflow;
    } catch (error) {
      console.error('Failed to create outreach workflow:', error);
      throw error;
    }
  }

  /**
   * Execute outreach workflow
   */
  async executeOutreachWorkflow(workflowId: string, influencerId: string) {
    try {
      // In a real implementation, this would execute the workflow actions
      // For now, we'll simulate workflow execution
      const result = {
        workflowId,
        influencerId,
        status: 'executed',
        actions: [
          { type: 'email', status: 'sent', timestamp: new Date() },
          { type: 'notification', status: 'sent', timestamp: new Date() },
        ],
      };

      // Create analytics record
      const influencer = await this.getInfluencer(influencerId);
      if (influencer) {
        await prisma.marketingAnalytics.create({
          data: {
            type: MarketingAnalyticsType.CAMPAIGN,
            metric: 'outreach_workflow_executed',
            value: 1,
            date: new Date(),
            siteId: influencer.siteId,
            metadata: { workflowId, influencerId, result },
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to execute outreach workflow:', error);
      throw error;
    }
  }

  /**
   * Track influencer interaction
   */
  async trackInfluencerInteraction(influencerId: string, interaction: {
    type: string;
    value: number;
    metadata?: Record<string, any>;
  }) {
    try {
      const influencer = await this.getInfluencer(influencerId);
      if (!influencer) {
        throw new Error('Influencer not found');
      }

      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: `influencer_${interaction.type}`,
          value: interaction.value,
          date: new Date(),
          metadata: { influencerId, ...interaction.metadata },
          siteId: influencer.siteId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to track influencer interaction:', error);
      throw error;
    }
  }

  /**
   * Bulk import influencers
   */
  async bulkImportInfluencers(influencers: InfluencerData[]) {
    try {
      const results = [];
      const errors = [];

      for (const influencerData of influencers) {
        try {
          const influencer = await this.createInfluencer(influencerData);
          results.push(influencer);
        } catch (error) {
          errors.push({ data: influencerData, error: error.message });
        }
      }

      return {
        success: results.length,
        errors: errors.length,
        results,
        errorDetails: errors,
      };
    } catch (error) {
      console.error('Failed to bulk import influencers:', error);
      throw error;
    }
  }

  /**
   * Export influencers
   */
  async exportInfluencers(siteId: string, format: 'csv' | 'json' = 'csv') {
    try {
      const influencers = await this.getInfluencers(siteId, { limit: 1000 });

      if (format === 'json') {
        return JSON.stringify(influencers, null, 2);
      }

      // CSV format
      const headers = ['Name', 'Email', 'Platform', 'Handle', 'Followers', 'Engagement', 'Score', 'Status'];
      const rows = influencers.map(i => [
        i.name,
        i.email || '',
        i.platform,
        i.handle,
        i.followers,
        i.engagement,
        i.score,
        i.status,
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export influencers:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const influencerOutreachService = new InfluencerOutreachService(); 