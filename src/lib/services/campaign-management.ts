import { prisma } from '../prisma';
import { 
  MarketingCampaignType, 
  MarketingCampaignStatus, 
  MarketingAnalyticsType,
  EmailCampaignStatus,
  SocialMediaPostStatus,
  MarketingAutomationType,
  MarketingAutomationStatus
} from '@/generated/prisma';

// Campaign Data Interface
interface CampaignData {
  name: string;
  description?: string;
  type: MarketingCampaignType;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  targetAudience?: Record<string, any>;
  channels: string[];
  goals?: Record<string, any>;
  siteId: string;
  createdBy: string;
}

// Campaign Channel Configuration
interface ChannelConfig {
  channel: string;
  enabled: boolean;
  settings: Record<string, any>;
  budget?: number;
  schedule?: {
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
}

// Campaign Performance Metrics
interface CampaignPerformance {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roi: number;
  date: Date;
}

// Campaign Analytics
interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  averageROI: number;
  channelPerformance: Record<string, {
    campaigns: number;
    spend: number;
    conversions: number;
    roi: number;
  }>;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    roi: number;
    conversions: number;
    spend: number;
  }>;
  date: Date;
}

// Campaign Optimization Recommendation
interface OptimizationRecommendation {
  type: 'budget' | 'targeting' | 'creative' | 'timing' | 'channel';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: number; // percentage improvement expected
  action: string;
  data: Record<string, any>;
}

// Campaign Management Service Class
export class CampaignManagementService {
  /**
   * Create a new marketing campaign
   */
  async createCampaign(data: CampaignData) {
    try {
      const campaign = await prisma.marketingCampaign.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          targetAudience: data.targetAudience || {},
          channels: data.channels,
          goals: data.goals || {},
          siteId: data.siteId,
          createdBy: data.createdBy,
        },
      });

      // Create initial analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'campaign_created',
          value: 1,
          date: new Date(),
          siteId: data.siteId,
          campaignId: campaign.id,
        },
      });

      return campaign;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaigns for a site
   */
  async getCampaigns(siteId: string, options: {
    status?: MarketingCampaignStatus;
    type?: MarketingCampaignType;
    createdBy?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const whereClause: any = { siteId };

      if (options.status) whereClause.status = options.status;
      if (options.type) whereClause.type = options.type;
      if (options.createdBy) whereClause.createdBy = options.createdBy;

      const campaigns = await prisma.marketingCampaign.findMany({
        where: whereClause,
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          leads: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          emails: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          socialPosts: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          analytics: {
            take: 10,
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return campaigns;
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string) {
    try {
      const campaign = await prisma.marketingCampaign.findUnique({
        where: { id: campaignId },
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          leads: {
            orderBy: { createdAt: 'desc' },
          },
          emails: {
            orderBy: { createdAt: 'desc' },
          },
          socialPosts: {
            orderBy: { createdAt: 'desc' },
          },
          analytics: {
            orderBy: { date: 'desc' },
          },
          abTests: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return campaign;
    } catch (error) {
      console.error('Failed to get campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, data: Partial<CampaignData>) {
    try {
      const campaign = await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          targetAudience: data.targetAudience,
          channels: data.channels,
          goals: data.goals,
        },
      });

      return campaign;
    } catch (error) {
      console.error('Failed to update campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: MarketingCampaignStatus) {
    try {
      const campaign = await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { status },
      });

      // Log status change
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'status_change',
          value: 1,
          date: new Date(),
          metadata: { status, previousStatus: campaign.status },
          siteId: campaign.siteId,
          campaignId: campaign.id,
        },
      });

      return campaign;
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string) {
    try {
      // Delete related data first
      await prisma.marketingAnalytics.deleteMany({
        where: { campaignId },
      });

      await prisma.marketingABTest.deleteMany({
        where: { campaignId },
      });

      await prisma.marketingLead.updateMany({
        where: { campaignId },
        data: { campaignId: null },
      });

      await prisma.emailCampaign.updateMany({
        where: { campaignId },
        data: { campaignId: null },
      });

      await prisma.socialMediaPost.updateMany({
        where: { campaignId },
        data: { campaignId: null },
      });

      // Delete the campaign
      await prisma.marketingCampaign.delete({
        where: { id: campaignId },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string, dateRange?: { start: Date; end: Date }) {
    try {
      const whereClause: any = { campaignId };
      
      if (dateRange) {
        whereClause.date = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const analytics = await prisma.marketingAnalytics.findMany({
        where: whereClause,
        orderBy: { date: 'asc' },
      });

      // Calculate performance metrics
      const performance: CampaignPerformance = {
        campaignId,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roi: 0,
        date: new Date(),
      };

      analytics.forEach((metric) => {
        switch (metric.metric) {
          case 'impressions':
            performance.impressions += Number(metric.value);
            break;
          case 'clicks':
            performance.clicks += Number(metric.value);
            break;
          case 'conversions':
            performance.conversions += Number(metric.value);
            break;
          case 'spend':
            performance.spend += Number(metric.value);
            break;
        }
      });

      // Calculate derived metrics
      if (performance.impressions > 0) {
        performance.ctr = (performance.clicks / performance.impressions) * 100;
      }
      if (performance.clicks > 0) {
        performance.cpc = performance.spend / performance.clicks;
      }
      if (performance.conversions > 0) {
        performance.cpa = performance.spend / performance.conversions;
      }

      return performance;
    } catch (error) {
      console.error('Failed to get campaign performance:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(siteId: string, dateRange?: { start: Date; end: Date }) {
    try {
      const whereClause: any = { siteId };
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const campaigns = await prisma.marketingCampaign.findMany({
        where: whereClause,
        include: {
          analytics: true,
        },
      });

      const analytics: CampaignAnalytics = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
        totalSpend: 0,
        totalConversions: 0,
        averageROI: 0,
        channelPerformance: {},
        topPerformingCampaigns: [],
        date: new Date(),
      };

      let totalRevenue = 0;

      campaigns.forEach((campaign) => {
        // Calculate campaign metrics
        const campaignSpend = Number(campaign.spent);
        const campaignConversions = campaign.analytics
          .filter(a => a.metric === 'conversions')
          .reduce((sum, a) => sum + Number(a.value), 0);
        const campaignRevenue = campaign.analytics
          .filter(a => a.metric === 'revenue')
          .reduce((sum, a) => sum + Number(a.value), 0);

        analytics.totalSpend += campaignSpend;
        analytics.totalConversions += campaignConversions;
        totalRevenue += campaignRevenue;

        // Calculate ROI
        const roi = campaignSpend > 0 ? ((campaignRevenue - campaignSpend) / campaignSpend) * 100 : 0;

        // Track channel performance
        const channels = Array.isArray(campaign.channels) ? campaign.channels : [];
        channels.forEach((channel: string) => {
          if (!analytics.channelPerformance[channel]) {
            analytics.channelPerformance[channel] = {
              campaigns: 0,
              spend: 0,
              conversions: 0,
              roi: 0,
            };
          }
          analytics.channelPerformance[channel].campaigns++;
          analytics.channelPerformance[channel].spend += campaignSpend;
          analytics.channelPerformance[channel].conversions += campaignConversions;
        });

        // Track top performing campaigns
        analytics.topPerformingCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          roi,
          conversions: campaignConversions,
          spend: campaignSpend,
        });
      });

      // Calculate averages
      if (analytics.totalCampaigns > 0) {
        analytics.averageROI = totalRevenue > 0 ? ((totalRevenue - analytics.totalSpend) / analytics.totalSpend) * 100 : 0;
      }

      // Sort top performing campaigns by ROI
      analytics.topPerformingCampaigns.sort((a, b) => b.roi - a.roi);
      analytics.topPerformingCampaigns = analytics.topPerformingCampaigns.slice(0, 10);

      // Calculate channel ROI
      Object.keys(analytics.channelPerformance).forEach((channel) => {
        const channelData = analytics.channelPerformance[channel];
        if (channelData.spend > 0) {
          // This is a simplified calculation - in reality, you'd track revenue per channel
          channelData.roi = ((channelData.conversions * 100) - channelData.spend) / channelData.spend * 100;
        }
      });

      return analytics;
    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Create campaign automation workflow
   */
  async createCampaignAutomation(data: {
    name: string;
    description?: string;
    type: MarketingAutomationType;
    triggers: any[];
    actions: any[];
    conditions?: any[];
    isActive?: boolean;
    siteId: string;
    createdBy: string;
  }) {
    try {
      const automation = await prisma.marketingAutomation.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: MarketingAutomationStatus.DRAFT,
          triggers: data.triggers,
          actions: data.actions,
          conditions: data.conditions || {},
          isActive: data.isActive !== false,
          siteId: data.siteId,
          createdBy: data.createdBy,
        },
      });

      return automation;
    } catch (error) {
      console.error('Failed to create campaign automation:', error);
      throw error;
    }
  }

  /**
   * Get campaign automation workflows
   */
  async getCampaignAutomations(siteId: string) {
    try {
      const automations = await prisma.marketingAutomation.findMany({
        where: {
          siteId,
          type: {
            in: [
              MarketingAutomationType.CAMPAIGN_TRIGGER,
              MarketingAutomationType.CROSS_CHANNEL,
              MarketingAutomationType.REAL_TIME,
            ],
          },
        },
        include: {
          createdUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          executions: {
            take: 5,
            orderBy: { startedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return automations;
    } catch (error) {
      console.error('Failed to get campaign automations:', error);
      throw error;
    }
  }

  /**
   * Generate campaign optimization recommendations
   */
  async getOptimizationRecommendations(campaignId: string): Promise<OptimizationRecommendation[]> {
    try {
      const campaign = await this.getCampaign(campaignId);
      const performance = await this.getCampaignPerformance(campaignId);
      const recommendations: OptimizationRecommendation[] = [];

      // Budget optimization
      if (campaign?.budget && performance.spend > Number(campaign.budget) * 0.8) {
        recommendations.push({
          type: 'budget',
          priority: 'high',
          description: 'Campaign is approaching budget limit',
          impact: 15,
          action: 'Consider increasing budget or optimizing spend allocation',
          data: { currentSpend: performance.spend, budget: campaign.budget },
        });
      }

      // CTR optimization
      if (performance.ctr < 2) {
        recommendations.push({
          type: 'creative',
          priority: 'medium',
          description: 'Low click-through rate indicates creative optimization needed',
          impact: 25,
          action: 'Test new ad creatives and improve targeting',
          data: { currentCtr: performance.ctr, targetCtr: 2 },
        });
      }

      // Conversion rate optimization
      if (performance.ctr > 0 && performance.conversions / performance.clicks < 0.02) {
        recommendations.push({
          type: 'targeting',
          priority: 'high',
          description: 'Low conversion rate suggests targeting improvements needed',
          impact: 30,
          action: 'Refine audience targeting and improve landing page experience',
          data: { 
            currentConversionRate: (performance.conversions / performance.clicks) * 100,
            targetConversionRate: 2,
          },
        });
      }

      // Channel performance optimization
      const channels = Array.isArray(campaign?.channels) ? campaign.channels : [];
      if (channels.length > 1) {
        const channelAnalytics = await this.getChannelPerformance(campaignId);
        const underperformingChannels = Object.entries(channelAnalytics)
          .filter(([_, data]) => data.roi < 0)
          .map(([channel, _]) => channel);

        if (underperformingChannels.length > 0) {
          recommendations.push({
            type: 'channel',
            priority: 'medium',
            description: `Underperforming channels: ${underperformingChannels.join(', ')}`,
            impact: 20,
            action: 'Consider pausing or optimizing underperforming channels',
            data: { underperformingChannels },
          });
        }
      }

      // Timing optimization
      const timeAnalytics = await this.getTimePerformance(campaignId);
      if (timeAnalytics.peakHours && timeAnalytics.peakHours.length > 0) {
        recommendations.push({
          type: 'timing',
          priority: 'low',
          description: 'Peak performance hours identified',
          impact: 10,
          action: 'Increase ad spend during peak hours',
          data: { peakHours: timeAnalytics.peakHours },
        });
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Failed to get optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * Get channel performance for a campaign
   */
  private async getChannelPerformance(campaignId: string) {
    try {
      const analytics = await prisma.marketingAnalytics.findMany({
        where: {
          campaignId,
          metric: { in: ['channel_impressions', 'channel_clicks', 'channel_spend'] },
        },
        orderBy: { date: 'desc' },
      });

      const channelData: Record<string, any> = {};

      analytics.forEach((metric) => {
        const channel = (metric.metadata as any)?.channel || 'unknown';
        if (!channelData[channel]) {
          channelData[channel] = { impressions: 0, clicks: 0, spend: 0 };
        }

        switch (metric.metric) {
          case 'channel_impressions':
            channelData[channel].impressions += Number(metric.value);
            break;
          case 'channel_clicks':
            channelData[channel].clicks += Number(metric.value);
            break;
          case 'channel_spend':
            channelData[channel].spend += Number(metric.value);
            break;
        }
      });

      // Calculate ROI for each channel
      Object.keys(channelData).forEach((channel) => {
        const data = channelData[channel];
        data.ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
        data.cpc = data.clicks > 0 ? data.spend / data.clicks : 0;
        // Simplified ROI calculation
        data.roi = data.spend > 0 ? ((data.clicks * 10) - data.spend) / data.spend * 100 : 0;
      });

      return channelData;
    } catch (error) {
      console.error('Failed to get channel performance:', error);
      return {};
    }
  }

  /**
   * Get time-based performance for a campaign
   */
  private async getTimePerformance(campaignId: string) {
    try {
      const analytics = await prisma.marketingAnalytics.findMany({
        where: {
          campaignId,
          metric: 'hourly_performance',
        },
        orderBy: { date: 'desc' },
      });

      const hourlyData: Record<number, number> = {};
      
      analytics.forEach((metric) => {
        const hour = (metric.metadata as any)?.hour;
        if (hour !== undefined) {
          hourlyData[hour] = (hourlyData[hour] || 0) + Number(metric.value);
        }
      });

      // Find peak hours
      const peakHours = Object.entries(hourlyData)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour, _]) => parseInt(hour));

      return { hourlyData, peakHours };
    } catch (error) {
      console.error('Failed to get time performance:', error);
      return { hourlyData: {}, peakHours: [] };
    }
  }

  /**
   * Track campaign event
   */
  async trackCampaignEvent(campaignId: string, event: {
    type: string;
    value: number;
    metadata?: Record<string, any>;
  }) {
    try {
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: event.type,
          value: event.value,
          date: new Date(),
          metadata: event.metadata || {},
          siteId: (await this.getCampaign(campaignId))?.siteId || '',
          campaignId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to track campaign event:', error);
      throw error;
    }
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(campaignId: string, newName: string, createdBy: string) {
    try {
      const originalCampaign = await this.getCampaign(campaignId);
      if (!originalCampaign) {
        throw new Error('Campaign not found');
      }

      const newCampaign = await prisma.marketingCampaign.create({
        data: {
          name: newName,
          description: originalCampaign.description,
          type: originalCampaign.type,
          startDate: null, // Reset dates for new campaign
          endDate: null,
          budget: originalCampaign.budget,
          targetAudience: originalCampaign.targetAudience,
          channels: originalCampaign.channels,
          goals: originalCampaign.goals,
          status: MarketingCampaignStatus.DRAFT,
          spent: 0,
          siteId: originalCampaign.siteId,
          createdBy,
        },
      });

      return newCampaign;
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const campaignManagementService = new CampaignManagementService(); 