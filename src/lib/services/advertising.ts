import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schemas
const AdCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['display', 'video', 'native', 'programmatic']),
  objective: z.enum(['awareness', 'consideration', 'conversion']),
  budget: z.number().positive(),
  budgetType: z.enum(['daily', 'lifetime', 'monthly']),
  currency: z.enum(['USD', 'EUR', 'AED']).default('USD'),
  startDate: z.date(),
  endDate: z.date().optional(),
  targeting: z.record(z.any()).optional(),
  optimization: z.record(z.any()).optional(),
  adNetwork: z.string().optional(),
});

const AdPlacementSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['banner', 'sidebar', 'inline', 'video', 'native']),
  position: z.enum(['header', 'footer', 'sidebar', 'content', 'popup']),
  size: z.string(),
  responsive: z.boolean().default(true),
  priority: z.number().min(0).default(0),
  targeting: z.record(z.any()).optional(),
  restrictions: z.record(z.any()).optional(),
});

const AdvertisementSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['DISPLAY', 'VIDEO', 'NATIVE', 'BANNER', 'POPUP']),
  contentEn: z.string().min(1),
  contentAr: z.string().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  campaignId: z.string().optional(),
  placementId: z.string().optional(),
});

const AdPerformanceSchema = z.object({
  impressions: z.number().min(0).default(0),
  clicks: z.number().min(0).default(0),
  conversions: z.number().min(0).default(0),
  spend: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  date: z.date(),
  hour: z.number().min(0).max(23).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
});

export interface AdCampaign {
  id?: string;
  name: string;
  description?: string;
  type: 'display' | 'video' | 'native' | 'programmatic';
  objective: 'awareness' | 'consideration' | 'conversion';
  budget: number;
  budgetType: 'daily' | 'lifetime' | 'monthly';
  currency: 'USD' | 'EUR' | 'AED';
  startDate: Date;
  endDate?: Date;
  isActive?: boolean;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  revenue?: number;
  targeting?: Record<string, any>;
  optimization?: Record<string, any>;
  adNetwork?: string;
}

export interface AdPlacement {
  id?: string;
  name: string;
  description?: string;
  type: 'banner' | 'sidebar' | 'inline' | 'video' | 'native';
  position: 'header' | 'footer' | 'sidebar' | 'content' | 'popup';
  size: string;
  responsive?: boolean;
  isActive?: boolean;
  priority?: number;
  fillRate?: number;
  targeting?: Record<string, any>;
  restrictions?: Record<string, any>;
  impressions?: number;
  clicks?: number;
  revenue?: number;
  campaignId?: string;
}

export interface Advertisement {
  id?: string;
  name: string;
  type: 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'BANNER' | 'POPUP';
  contentEn: string;
  contentAr?: string;
  imageUrl?: string;
  linkUrl?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
  startDate: Date;
  endDate?: Date;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  revenue?: number;
  campaignId?: string;
  placementId?: string;
}

export interface AdPerformance {
  id?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  date: Date;
  hour?: number;
  country?: string;
  region?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  advertisementId?: string;
  campaignId?: string;
  placementId?: string;
}

export interface AdNetwork {
  id?: string;
  name: string;
  type: 'google' | 'facebook' | 'amazon' | 'direct' | 'programmatic';
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
  capabilities?: Record<string, any>;
  impressions?: number;
  clicks?: number;
  revenue?: number;
}

export interface AdTargeting {
  id?: string;
  type: 'demographic' | 'geographic' | 'behavioral' | 'contextual';
  criteria: Record<string, any>;
  isActive?: boolean;
  advertisementId: string;
}

export interface AdCreative {
  id?: string;
  name: string;
  type: 'image' | 'video' | 'text' | 'html';
  content: Record<string, any>;
  assets?: Record<string, any>;
  size?: string;
  format?: string;
  duration?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  advertisementId: string;
}

export interface AdOptimization {
  id?: string;
  type: 'placement' | 'creative' | 'targeting' | 'bidding';
  strategy: 'ctr' | 'cpc' | 'roas' | 'revenue';
  isActive?: boolean;
  settings?: Record<string, any>;
  rules?: Record<string, any>;
  beforeMetrics?: Record<string, any>;
  afterMetrics?: Record<string, any>;
  improvement?: number;
}

export interface AdBlocking {
  id?: string;
  detected: boolean;
  blockRate: number;
  userAgent?: string;
  ipAddress?: string;
  action: 'redirect' | 'alternative' | 'message';
  alternativeUrl?: string;
  message?: string;
}

export class AdvertisingService {
  private static instance: AdvertisingService;

  private constructor() {}

  public static getInstance(): AdvertisingService {
    if (!AdvertisingService.instance) {
      AdvertisingService.instance = new AdvertisingService();
    }
    return AdvertisingService.instance;
  }

  // Campaign Management
  async createCampaign(campaignData: AdCampaign, siteId: string): Promise<AdCampaign> {
    const validatedData = AdCampaignSchema.parse(campaignData);
    
    const campaign = await prisma.adCampaign.create({
      data: {
        ...validatedData,
        siteId,
        isActive: true,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      },
    });

    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign> {
    const campaign = await prisma.adCampaign.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return campaign;
  }

  async getCampaigns(siteId: string, filters?: {
    type?: string;
    objective?: string;
    isActive?: boolean;
  }): Promise<AdCampaign[]> {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.objective) where.objective = filters.objective;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const campaigns = await prisma.adCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  async getCampaign(id: string): Promise<AdCampaign | null> {
    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
      include: {
        advertisements: true,
        placements: true,
        performances: true,
      },
    });

    return campaign;
  }

  // Placement Management
  async createPlacement(placementData: AdPlacement, siteId: string): Promise<AdPlacement> {
    const validatedData = AdPlacementSchema.parse(placementData);
    
    const placement = await prisma.adPlacement.create({
      data: {
        ...validatedData,
        siteId,
        isActive: true,
        fillRate: 0,
        impressions: 0,
        clicks: 0,
        revenue: 0,
      },
    });

    return placement;
  }

  async updatePlacement(id: string, updates: Partial<AdPlacement>): Promise<AdPlacement> {
    const placement = await prisma.adPlacement.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return placement;
  }

  async getPlacements(siteId: string, filters?: {
    type?: string;
    position?: string;
    isActive?: boolean;
  }): Promise<AdPlacement[]> {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.position) where.position = filters.position;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const placements = await prisma.adPlacement.findMany({
      where,
      orderBy: { priority: 'desc' },
    });

    return placements;
  }

  // Advertisement Management
  async createAdvertisement(adData: Advertisement, siteId: string): Promise<Advertisement> {
    const validatedData = AdvertisementSchema.parse(adData);
    
    const advertisement = await prisma.advertisement.create({
      data: {
        ...validatedData,
        siteId,
        status: 'ACTIVE',
        impressions: 0,
        clicks: 0,
        ctr: 0,
        revenue: 0,
      },
    });

    return advertisement;
  }

  async updateAdvertisement(id: string, updates: Partial<Advertisement>): Promise<Advertisement> {
    const advertisement = await prisma.advertisement.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return advertisement;
  }

  async getAdvertisements(siteId: string, filters?: {
    type?: string;
    status?: string;
    campaignId?: string;
    placementId?: string;
  }): Promise<Advertisement[]> {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.placementId) where.placementId = filters.placementId;

    const advertisements = await prisma.advertisement.findMany({
      where,
      include: {
        campaign: true,
        placement: true,
        performances: true,
        targeting: true,
        creatives: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return advertisements;
  }

  // Performance Tracking
  async trackPerformance(performanceData: AdPerformance, siteId: string): Promise<AdPerformance> {
    const validatedData = AdPerformanceSchema.parse(performanceData);
    
    // Calculate derived metrics
    const ctr = validatedData.impressions > 0 ? validatedData.clicks / validatedData.impressions : 0;
    const cpc = validatedData.clicks > 0 ? validatedData.spend / validatedData.clicks : 0;
    const cpm = validatedData.impressions > 0 ? (validatedData.spend / validatedData.impressions) * 1000 : 0;
    const roas = validatedData.spend > 0 ? validatedData.revenue / validatedData.spend : 0;

    const performance = await prisma.adPerformance.create({
      data: {
        ...validatedData,
        siteId,
        ctr,
        cpc,
        cpm,
        roas,
      },
    });

    // Update related entities
    await this.updateEntityPerformance(performance);

    return performance;
  }

  private async updateEntityPerformance(performance: AdPerformance): Promise<void> {
    // Update advertisement performance
    if (performance.advertisementId) {
      await prisma.advertisement.update({
        where: { id: performance.advertisementId },
        data: {
          impressions: { increment: performance.impressions },
          clicks: { increment: performance.clicks },
          revenue: { increment: performance.revenue },
          ctr: performance.ctr,
        },
      });
    }

    // Update campaign performance
    if (performance.campaignId) {
      await prisma.adCampaign.update({
        where: { id: performance.campaignId },
        data: {
          impressions: { increment: performance.impressions },
          clicks: { increment: performance.clicks },
          conversions: { increment: performance.conversions },
          spend: { increment: performance.spend },
          revenue: { increment: performance.revenue },
        },
      });
    }

    // Update placement performance
    if (performance.placementId) {
      await prisma.adPlacement.update({
        where: { id: performance.placementId },
        data: {
          impressions: { increment: performance.impressions },
          clicks: { increment: performance.clicks },
          revenue: { increment: performance.revenue },
        },
      });
    }
  }

  async getPerformance(siteId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    advertisementId?: string;
    campaignId?: string;
    placementId?: string;
  }): Promise<AdPerformance[]> {
    const where: any = { siteId };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.advertisementId) where.advertisementId = filters.advertisementId;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.placementId) where.placementId = filters.placementId;

    const performances = await prisma.adPerformance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return performances;
  }

  // Ad Network Management
  async createAdNetwork(networkData: AdNetwork, siteId: string): Promise<AdNetwork> {
    const network = await prisma.adNetwork.create({
      data: {
        ...networkData,
        siteId,
        isActive: true,
        impressions: 0,
        clicks: 0,
        revenue: 0,
      },
    });

    return network;
  }

  async updateAdNetwork(id: string, updates: Partial<AdNetwork>): Promise<AdNetwork> {
    const network = await prisma.adNetwork.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return network;
  }

  async getAdNetworks(siteId: string, filters?: {
    type?: string;
    isActive?: boolean;
  }): Promise<AdNetwork[]> {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const networks = await prisma.adNetwork.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return networks;
  }

  // Targeting Management
  async createTargeting(targetingData: AdTargeting): Promise<AdTargeting> {
    const targeting = await prisma.adTargeting.create({
      data: targetingData,
    });

    return targeting;
  }

  async updateTargeting(id: string, updates: Partial<AdTargeting>): Promise<AdTargeting> {
    const targeting = await prisma.adTargeting.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return targeting;
  }

  async getTargeting(advertisementId: string): Promise<AdTargeting[]> {
    const targeting = await prisma.adTargeting.findMany({
      where: { advertisementId },
    });

    return targeting;
  }

  // Creative Management
  async createCreative(creativeData: AdCreative): Promise<AdCreative> {
    const creative = await prisma.adCreative.create({
      data: {
        ...creativeData,
        impressions: 0,
        clicks: 0,
        ctr: 0,
      },
    });

    return creative;
  }

  async updateCreative(id: string, updates: Partial<AdCreative>): Promise<AdCreative> {
    const creative = await prisma.adCreative.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return creative;
  }

  async getCreatives(advertisementId: string): Promise<AdCreative[]> {
    const creatives = await prisma.adCreative.findMany({
      where: { advertisementId },
    });

    return creatives;
  }

  // Optimization Management
  async createOptimization(optimizationData: AdOptimization, siteId: string): Promise<AdOptimization> {
    const optimization = await prisma.adOptimization.create({
      data: {
        ...optimizationData,
        siteId,
        isActive: true,
      },
    });

    return optimization;
  }

  async updateOptimization(id: string, updates: Partial<AdOptimization>): Promise<AdOptimization> {
    const optimization = await prisma.adOptimization.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return optimization;
  }

  async getOptimizations(siteId: string, filters?: {
    type?: string;
    strategy?: string;
    isActive?: boolean;
  }): Promise<AdOptimization[]> {
    const where: any = { siteId };

    if (filters?.type) where.type = filters.type;
    if (filters?.strategy) where.strategy = filters.strategy;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const optimizations = await prisma.adOptimization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return optimizations;
  }

  // Ad Blocking Detection
  async detectAdBlocking(siteId: string, userAgent?: string, ipAddress?: string): Promise<AdBlocking> {
    // Simple ad blocking detection (in real implementation, this would be more sophisticated)
    const detected = Math.random() < 0.15; // 15% chance of ad blocking
    const blockRate = detected ? Math.random() * 0.3 + 0.1 : 0; // 10-40% block rate if detected

    const adBlocking = await prisma.adBlocking.create({
      data: {
        siteId,
        detected,
        blockRate,
        userAgent,
        ipAddress,
        action: detected ? 'message' : 'redirect',
        message: detected ? 'Please disable your ad blocker to support our content' : undefined,
      },
    });

    return adBlocking;
  }

  async getAdBlockingStats(siteId: string): Promise<{
    totalDetections: number;
    averageBlockRate: number;
    recentDetections: AdBlocking[];
  }> {
    const [totalDetections, averageBlockRate, recentDetections] = await Promise.all([
      prisma.adBlocking.count({ where: { siteId, detected: true } }),
      prisma.adBlocking.aggregate({
        where: { siteId, detected: true },
        _avg: { blockRate: true },
      }),
      prisma.adBlocking.findMany({
        where: { siteId, detected: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalDetections,
      averageBlockRate: averageBlockRate._avg.blockRate || 0,
      recentDetections,
    };
  }

  // Analytics and Reporting
  async getAdvertisingStats(siteId: string, startDate?: Date, endDate?: Date): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    averageCTR: number;
    averageCPC: number;
    averageCPM: number;
    totalSpend: number;
    roas: number;
  }> {
    const where: any = { siteId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const stats = await prisma.adPerformance.aggregate({
      where,
      _sum: {
        impressions: true,
        clicks: true,
        revenue: true,
        spend: true,
      },
      _avg: {
        ctr: true,
        cpc: true,
        cpm: true,
      },
    });

    const totalImpressions = stats._sum.impressions || 0;
    const totalClicks = stats._sum.clicks || 0;
    const totalRevenue = stats._sum.revenue || 0;
    const totalSpend = stats._sum.spend || 0;

    return {
      totalImpressions,
      totalClicks,
      totalRevenue,
      averageCTR: stats._avg.ctr || 0,
      averageCPC: stats._avg.cpc || 0,
      averageCPM: stats._avg.cpm || 0,
      totalSpend,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    };
  }

  // Site-specific advertising strategies
  async getSiteSpecificStrategy(siteId: string): Promise<{
    recommendedAdTypes: string[];
    optimalPlacements: string[];
    targetingRecommendations: Record<string, any>;
    revenueOptimization: Record<string, any>;
  }> {
    // Get site information to determine strategy
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    // Site-specific strategies based on domain/name
    const strategies: Record<string, any> = {
      'unlock-bc.com': {
        recommendedAdTypes: ['DISPLAY', 'NATIVE'],
        optimalPlacements: ['sidebar', 'content'],
        targetingRecommendations: {
          interests: ['cryptocurrency', 'blockchain', 'trading'],
          demographics: { age: [25, 45], income: 'high' },
        },
        revenueOptimization: {
          focus: 'cpc',
          networks: ['google', 'direct'],
        },
      },
      'iktissadonline.com': {
        recommendedAdTypes: ['DISPLAY', 'BANNER'],
        optimalPlacements: ['header', 'sidebar'],
        targetingRecommendations: {
          interests: ['finance', 'economics', 'business'],
          demographics: { age: [30, 55], income: 'high' },
        },
        revenueOptimization: {
          focus: 'roas',
          networks: ['google', 'facebook'],
        },
      },
      'himaya.io': {
        recommendedAdTypes: ['DISPLAY', 'NATIVE'],
        optimalPlacements: ['content', 'sidebar'],
        targetingRecommendations: {
          interests: ['cybersecurity', 'technology', 'business'],
          demographics: { age: [25, 50], income: 'medium' },
        },
        revenueOptimization: {
          focus: 'ctr',
          networks: ['google', 'direct'],
        },
      },
      'defaiya.com': {
        recommendedAdTypes: ['DISPLAY', 'VIDEO'],
        optimalPlacements: ['header', 'content'],
        targetingRecommendations: {
          interests: ['defense', 'military', 'technology'],
          demographics: { age: [30, 60], income: 'high' },
        },
        revenueOptimization: {
          focus: 'revenue',
          networks: ['google', 'amazon'],
        },
      },
    };

    return strategies[site.domain] || {
      recommendedAdTypes: ['DISPLAY', 'BANNER'],
      optimalPlacements: ['header', 'sidebar'],
      targetingRecommendations: {},
      revenueOptimization: { focus: 'ctr', networks: ['google'] },
    };
  }
} 