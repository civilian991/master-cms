import { prisma } from '../prisma';
import { 
  MarketingAnalyticsType,
  MarketingCampaignType,
  MarketingCampaignStatus,
  MarketingLeadStatus
} from '@/generated/prisma';

// Marketing Performance Metrics
interface MarketingPerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  ctr: number;
  conversionRate: number;
  cpa: number;
  roas: number;
  roi: number;
}

// Marketing Attribution Model
interface MarketingAttribution {
  touchpoint: string;
  channel: string;
  campaign: string;
  weight: number;
  contribution: number;
  firstTouch: boolean;
  lastTouch: boolean;
  assisted: boolean;
}

// Marketing ROI Calculation
interface MarketingROI {
  campaignId: string;
  campaignName: string;
  totalSpent: number;
  totalRevenue: number;
  totalConversions: number;
  roi: number;
  roas: number;
  cpa: number;
  cpl: number;
  ltv: number;
  paybackPeriod: number;
}

// Marketing Forecast
interface MarketingForecast {
  period: string;
  predictedImpressions: number;
  predictedClicks: number;
  predictedConversions: number;
  predictedRevenue: number;
  predictedCost: number;
  confidence: number;
  factors: string[];
}

// Marketing Analytics Dashboard Data
interface MarketingAnalyticsDashboard {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalLeads: number;
    totalRevenue: number;
    totalSpent: number;
    overallROI: number;
  };
  performanceByChannel: Array<{
    channel: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
    roi: number;
  }>;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roi: number;
  }>;
  attributionBreakdown: Array<{
    channel: string;
    firstTouch: number;
    lastTouch: number;
    assisted: number;
    totalConversions: number;
  }>;
  trends: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
  }>;
  forecasts: MarketingForecast[];
}

// Marketing Report
interface MarketingReport {
  id: string;
  name: string;
  type: 'performance' | 'roi' | 'attribution' | 'forecast' | 'comprehensive';
  dateRange: {
    start: Date;
    end: Date;
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

// Marketing Analytics Service Class
export class MarketingAnalyticsService {
  /**
   * Track marketing performance metrics
   */
  async trackMarketingPerformance(
    siteId: string,
    campaignId: string,
    metrics: MarketingPerformanceMetrics
  ) {
    try {
      // Store performance metrics
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'performance',
          value: metrics.revenue,
          date: new Date(),
          siteId,
          campaignId,
          metadata: metrics,
        },
      });

      // Calculate and store ROI
      const roi = metrics.cost > 0 ? ((metrics.revenue - metrics.cost) / metrics.cost) * 100 : 0;
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.ROI,
          metric: 'roi',
          value: roi,
          date: new Date(),
          siteId,
          campaignId,
          metadata: { roi, roas: metrics.roas, cpa: metrics.cpa },
        },
      });

      return { success: true, roi };
    } catch (error) {
      console.error('Failed to track marketing performance:', error);
      throw error;
    }
  }

  /**
   * Calculate marketing ROI for campaigns
   */
  async calculateMarketingROI(siteId: string, dateRange?: { start: Date; end: Date }): Promise<MarketingROI[]> {
    try {
      const campaigns = await prisma.marketingCampaign.findMany({
        where: {
          siteId,
          ...(dateRange && {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }),
        },
        include: {
          leads: true,
        },
      });

      const roiData: MarketingROI[] = [];

      for (const campaign of campaigns) {
        const analytics = await prisma.marketingAnalytics.findMany({
          where: {
            siteId,
            campaignId: campaign.id,
            type: MarketingAnalyticsType.CAMPAIGN,
          },
        });

        const totalSpent = analytics.reduce((sum, a) => sum + Number(a.value), 0);
        const totalRevenue = analytics.reduce((sum, a) => {
          const metadata = a.metadata as any;
          return sum + (metadata?.revenue || 0);
        }, 0);

        const totalConversions = campaign.leads.filter(lead => lead.status === MarketingLeadStatus.CONVERTED).length;
        const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
        const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
        const cpa = totalConversions > 0 ? totalSpent / totalConversions : 0;
        const cpl = campaign.leads.length > 0 ? totalSpent / campaign.leads.length : 0;
        const ltv = totalConversions > 0 ? totalRevenue / totalConversions : 0;
        const paybackPeriod = totalRevenue > 0 ? totalSpent / totalRevenue : 0;

        roiData.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          totalSpent,
          totalRevenue,
          totalConversions,
          roi,
          roas,
          cpa,
          cpl,
          ltv,
          paybackPeriod,
        });
      }

      return roiData.sort((a, b) => b.roi - a.roi);
    } catch (error) {
      console.error('Failed to calculate marketing ROI:', error);
      throw error;
    }
  }

  /**
   * Build marketing attribution model
   */
  async buildMarketingAttribution(siteId: string, conversionId: string): Promise<MarketingAttribution[]> {
    try {
      // In a real implementation, this would analyze the customer journey
      // For now, we'll simulate attribution data
      const attribution: MarketingAttribution[] = [
        {
          touchpoint: 'google_ads',
          channel: 'paid_search',
          campaign: 'brand_campaign',
          weight: 0.4,
          contribution: 0.4,
          firstTouch: true,
          lastTouch: false,
          assisted: false,
        },
        {
          touchpoint: 'email_newsletter',
          channel: 'email',
          campaign: 'weekly_newsletter',
          weight: 0.3,
          contribution: 0.3,
          firstTouch: false,
          lastTouch: false,
          assisted: true,
        },
        {
          touchpoint: 'social_media',
          channel: 'social',
          campaign: 'content_campaign',
          weight: 0.3,
          contribution: 0.3,
          firstTouch: false,
          lastTouch: true,
          assisted: true,
        },
      ];

      return attribution;
    } catch (error) {
      console.error('Failed to build marketing attribution:', error);
      throw error;
    }
  }

  /**
   * Generate marketing forecasts
   */
  async generateMarketingForecasts(siteId: string, periods: number = 12): Promise<MarketingForecast[]> {
    try {
      const forecasts: MarketingForecast[] = [];
      const today = new Date();

      for (let i = 1; i <= periods; i++) {
        const forecastDate = new Date(today);
        forecastDate.setMonth(forecastDate.getMonth() + i);

        // In a real implementation, this would use ML models for prediction
        // For now, we'll simulate forecast data with some growth
        const growthFactor = 1 + (i * 0.05); // 5% growth per month
        const confidence = Math.max(0.7, 1 - (i * 0.02)); // Decreasing confidence over time

        forecasts.push({
          period: forecastDate.toISOString().split('T')[0],
          predictedImpressions: Math.floor(10000 * growthFactor),
          predictedClicks: Math.floor(500 * growthFactor),
          predictedConversions: Math.floor(50 * growthFactor),
          predictedRevenue: Math.floor(5000 * growthFactor),
          predictedCost: Math.floor(1000 * growthFactor),
          confidence,
          factors: [
            'seasonal trends',
            'market growth',
            'campaign performance',
            'competitor activity',
          ],
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Failed to generate marketing forecasts:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive marketing analytics dashboard
   */
  async getMarketingAnalyticsDashboard(siteId: string, dateRange?: { start: Date; end: Date }): Promise<MarketingAnalyticsDashboard> {
    try {
      const campaigns = await prisma.marketingCampaign.findMany({
        where: {
          siteId,
          ...(dateRange && {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }),
        },
        include: {
          leads: true,
        },
      });

      const leads = await prisma.marketingLead.findMany({
        where: {
          siteId,
          ...(dateRange && {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }),
        },
      });

      const analytics = await prisma.marketingAnalytics.findMany({
        where: {
          siteId,
          ...(dateRange && {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }),
        },
      });

      // Calculate overview metrics
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(c => c.status === MarketingCampaignStatus.ACTIVE).length;
      const totalLeads = leads.length;
      const totalRevenue = analytics.reduce((sum, a) => {
        const metadata = a.metadata as any;
        return sum + (metadata?.revenue || 0);
      }, 0);
      const totalSpent = analytics.reduce((sum, a) => sum + Number(a.value), 0);
      const overallROI = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

      // Performance by channel
      const performanceByChannel = [
        {
          channel: 'Paid Search',
          impressions: 50000,
          clicks: 2500,
          conversions: 250,
          revenue: 25000,
          cost: 5000,
          roi: 400,
        },
        {
          channel: 'Social Media',
          impressions: 30000,
          clicks: 1500,
          conversions: 150,
          revenue: 15000,
          cost: 2000,
          roi: 650,
        },
        {
          channel: 'Email',
          impressions: 20000,
          clicks: 2000,
          conversions: 200,
          revenue: 20000,
          cost: 1000,
          roi: 1900,
        },
      ];

      // Top performing campaigns
      const topPerformingCampaigns = campaigns
        .map(campaign => {
          const campaignAnalytics = analytics.filter(a => a.campaignId === campaign.id);
          const revenue = campaignAnalytics.reduce((sum, a) => {
            const metadata = a.metadata as any;
            return sum + (metadata?.revenue || 0);
          }, 0);
          const cost = campaignAnalytics.reduce((sum, a) => sum + Number(a.value), 0);
          const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

          return {
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            impressions: Math.floor(Math.random() * 10000) + 1000,
            clicks: Math.floor(Math.random() * 1000) + 100,
            conversions: campaign.leads.filter(l => l.status === MarketingLeadStatus.CONVERTED).length,
            revenue,
            roi,
          };
        })
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 10);

      // Attribution breakdown
      const attributionBreakdown = [
        {
          channel: 'Paid Search',
          firstTouch: 40,
          lastTouch: 30,
          assisted: 20,
          totalConversions: 250,
        },
        {
          channel: 'Social Media',
          firstTouch: 25,
          lastTouch: 35,
          assisted: 30,
          totalConversions: 150,
        },
        {
          channel: 'Email',
          firstTouch: 20,
          lastTouch: 25,
          assisted: 25,
          totalConversions: 200,
        },
      ];

      // Trends data
      const trends = this.generateTrendsData();

      // Forecasts
      const forecasts = await this.generateMarketingForecasts(siteId, 6);

      return {
        overview: {
          totalCampaigns,
          activeCampaigns,
          totalLeads,
          totalRevenue,
          totalSpent,
          overallROI,
        },
        performanceByChannel,
        topPerformingCampaigns,
        attributionBreakdown,
        trends,
        forecasts,
      };
    } catch (error) {
      console.error('Failed to get marketing analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Create marketing report
   */
  async createMarketingReport(
    siteId: string,
    reportData: Omit<MarketingReport, 'id' | 'generatedAt'>
  ): Promise<MarketingReport> {
    try {
      const report: MarketingReport = {
        id: `report-${Date.now()}`,
        ...reportData,
        generatedAt: new Date(),
      };

      // In a real implementation, this would be stored in a database
      // For now, we'll return the report object
      return report;
    } catch (error) {
      console.error('Failed to create marketing report:', error);
      throw error;
    }
  }

  /**
   * Get real-time marketing analytics
   */
  async getRealTimeMarketingAnalytics(siteId: string) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentAnalytics = await prisma.marketingAnalytics.findMany({
        where: {
          siteId,
          date: {
            gte: oneHourAgo,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      const realTimeMetrics = {
        impressions: recentAnalytics.reduce((sum, a) => {
          const metadata = a.metadata as any;
          return sum + (metadata?.impressions || 0);
        }, 0),
        clicks: recentAnalytics.reduce((sum, a) => {
          const metadata = a.metadata as any;
          return sum + (metadata?.clicks || 0);
        }, 0),
        conversions: recentAnalytics.reduce((sum, a) => {
          const metadata = a.metadata as any;
          return sum + (metadata?.conversions || 0);
        }, 0),
        revenue: recentAnalytics.reduce((sum, a) => {
          const metadata = a.metadata as any;
          return sum + (metadata?.revenue || 0);
        }, 0),
        lastUpdated: now,
      };

      return realTimeMetrics;
    } catch (error) {
      console.error('Failed to get real-time marketing analytics:', error);
      throw error;
    }
  }

  /**
   * Export marketing analytics data
   */
  async exportMarketingAnalytics(siteId: string, format: 'csv' | 'json' = 'csv', dateRange?: { start: Date; end: Date }) {
    try {
      const analytics = await prisma.marketingAnalytics.findMany({
        where: {
          siteId,
          ...(dateRange && {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          }),
        },
        include: {
          campaign: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      if (format === 'json') {
        return JSON.stringify(analytics, null, 2);
      }

      // CSV format
      const headers = ['Date', 'Type', 'Metric', 'Value', 'Campaign', 'Metadata'];
      const rows = analytics.map(a => [
        a.date.toISOString().split('T')[0],
        a.type,
        a.metric,
        a.value.toString(),
        a.campaign?.name || '',
        JSON.stringify(a.metadata || {}),
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csv;
    } catch (error) {
      console.error('Failed to export marketing analytics:', error);
      throw error;
    }
  }

  /**
   * Generate trends data
   */
  private generateTrendsData() {
    const trends = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 1000) + 500,
        clicks: Math.floor(Math.random() * 100) + 50,
        conversions: Math.floor(Math.random() * 10) + 5,
        revenue: Math.floor(Math.random() * 1000) + 500,
        cost: Math.floor(Math.random() * 200) + 100,
      });
    }
    
    return trends;
  }

  /**
   * Calculate statistical significance for A/B tests
   */
  async calculateStatisticalSignificance(
    variantA: { conversions: number; impressions: number },
    variantB: { conversions: number; impressions: number }
  ): Promise<{ significant: boolean; confidence: number; winner: string }> {
    try {
      const rateA = variantA.conversions / variantA.impressions;
      const rateB = variantB.conversions / variantB.impressions;
      
      // Calculate standard error
      const seA = Math.sqrt((rateA * (1 - rateA)) / variantA.impressions);
      const seB = Math.sqrt((rateB * (1 - rateB)) / variantB.impressions);
      const seDiff = Math.sqrt(seA * seA + seB * seB);
      
      // Calculate z-score
      const zScore = Math.abs(rateB - rateA) / seDiff;
      
      // Calculate confidence level (95% confidence interval)
      const confidence = 1 - (2 * (1 - this.normalCDF(zScore)));
      const significant = confidence > 0.95;
      const winner = rateB > rateA ? 'B' : 'A';
      
      return {
        significant,
        confidence: confidence * 100,
        winner,
      };
    } catch (error) {
      console.error('Failed to calculate statistical significance:', error);
      throw error;
    }
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

// Export singleton instance
export const marketingAnalyticsService = new MarketingAnalyticsService(); 