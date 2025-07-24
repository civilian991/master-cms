import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

// Validation schemas
const SubscriptionSchema = z.object({
  planType: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE', 'TRIAL']).default('ACTIVE'),
  currency: z.enum(['USD', 'EUR', 'AED', 'GBP', 'CAD']).default('USD'),
  amount: z.number().positive(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.date(),
  endDate: z.date().optional(),
  trialEndDate: z.date().optional(),
});

const PaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'AED', 'GBP', 'CAD']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).default('PENDING'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO']),
  gateway: z.enum(['STRIPE', 'PAYPAL', 'SQUARE', 'CRYPTO_GATEWAY']),
  transactionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export interface Subscription {
  id?: string;
  planType: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'TRIAL';
  currency: 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD';
  amount: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  siteId: string;
  userId: string;
}

export interface Payment {
  id?: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';
  gateway: 'STRIPE' | 'PAYPAL' | 'SQUARE' | 'CRYPTO_GATEWAY';
  transactionId?: string;
  metadata?: Record<string, any>;
  siteId: string;
  userId: string;
  subscriptionId?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  planType: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  pricing: {
    USD: number;
    EUR: number;
    AED: number;
    GBP: number;
    CAD: number;
  };
  features: string[];
  siteId: string;
}

export interface BillingInfo {
  subscriptionId: string;
  nextBillingDate: Date;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  subscriptionGrowth: number;
  topPlans: Array<{
    planType: string;
    count: number;
    revenue: number;
  }>;
}

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  // Subscription Management
  async createSubscription(subscriptionData: Subscription): Promise<Subscription> {
    const validatedData = SubscriptionSchema.parse(subscriptionData);
    
    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        status: validatedData.status || 'ACTIVE',
        currency: validatedData.currency || 'USD',
        billingCycle: validatedData.billingCycle || 'MONTHLY',
      },
      include: {
        user: true,
        site: true,
        payments: true,
      },
    });

    // Clear cache
    await this.clearSubscriptionCache(subscriptionData.siteId, subscriptionData.userId);
    
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        site: true,
        payments: true,
      },
    });

    // Clear cache
    await this.clearSubscriptionCache(subscription.siteId, subscription.userId);
    
    return subscription;
  }

  async getSubscription(id: string): Promise<Subscription | null> {
    const cacheKey = `subscription:${id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
        site: true,
        payments: true,
      },
    });

    if (subscription) {
      await redis.setex(cacheKey, 300, JSON.stringify(subscription)); // 5 minutes cache
    }

    return subscription;
  }

  async getSubscriptions(siteId: string, filters?: {
    status?: string;
    planType?: string;
    userId?: string;
  }): Promise<Subscription[]> {
    const where: any = { siteId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.planType) where.planType = filters.planType;
    if (filters?.userId) where.userId = filters.userId;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: true,
        site: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions;
  }

  async cancelSubscription(id: string, reason?: string): Promise<Subscription> {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: true,
        site: true,
        payments: true,
      },
    });

    // Clear cache
    await this.clearSubscriptionCache(subscription.siteId, subscription.userId);
    
    return subscription;
  }

  async upgradeSubscription(id: string, newPlanType: string, newAmount: number): Promise<Subscription> {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        planType: newPlanType as any,
        amount: newAmount,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        site: true,
        payments: true,
      },
    });

    // Clear cache
    await this.clearSubscriptionCache(subscription.siteId, subscription.userId);
    
    return subscription;
  }

  // Payment Management
  async createPayment(paymentData: Payment): Promise<Payment> {
    const validatedData = PaymentSchema.parse(paymentData);
    
    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        status: validatedData.status || 'PENDING',
      },
      include: {
        user: true,
        site: true,
        subscription: true,
      },
    });

    // Clear cache
    await this.clearPaymentCache(paymentData.siteId, paymentData.userId);
    
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        site: true,
        subscription: true,
      },
    });

    // Clear cache
    await this.clearPaymentCache(payment.siteId, payment.userId);
    
    return payment;
  }

  async getPayments(siteId: string, filters?: {
    status?: string;
    gateway?: string;
    userId?: string;
    subscriptionId?: string;
  }): Promise<Payment[]> {
    const where: any = { siteId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.gateway) where.gateway = filters.gateway;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.subscriptionId) where.subscriptionId = filters.subscriptionId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: true,
        site: true,
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

  // Billing Management
  async getBillingInfo(subscriptionId: string): Promise<BillingInfo | null> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) return null;

    const nextBillingDate = this.calculateNextBillingDate(subscription.startDate, subscription.billingCycle);
    
    return {
      subscriptionId,
      nextBillingDate,
      amount: subscription.amount,
      currency: subscription.currency,
      status: subscription.status,
    };
  }

  async processRecurringBilling(): Promise<void> {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: null,
      },
      include: {
        user: true,
        site: true,
      },
    });

    for (const subscription of activeSubscriptions) {
      const nextBillingDate = this.calculateNextBillingDate(subscription.startDate, subscription.billingCycle);
      
      if (nextBillingDate <= new Date()) {
        // Process billing
        await this.processBilling(subscription);
      }
    }
  }

  private async processBilling(subscription: any): Promise<void> {
    try {
      // Create payment record
      await this.createPayment({
        amount: subscription.amount,
        currency: subscription.currency,
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD', // Default, should be from user's saved method
        gateway: 'STRIPE', // Default gateway
        siteId: subscription.siteId,
        userId: subscription.userId,
        subscriptionId: subscription.id,
      });

      // Update subscription dates
      await this.updateSubscription(subscription.id, {
        startDate: new Date(),
      });
    } catch (error) {
      console.error(`Failed to process billing for subscription ${subscription.id}:`, error);
      
      // Mark subscription as past due
      await this.updateSubscription(subscription.id, {
        status: 'PAST_DUE',
      });
    }
  }

  private calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
    const nextDate = new Date(startDate);
    
    switch (billingCycle) {
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }

  // Analytics
  async getSubscriptionAnalytics(siteId: string, startDate?: Date, endDate?: Date): Promise<SubscriptionAnalytics> {
    const where: any = { siteId };
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const subscriptions = await prisma.subscription.findMany({ where });
    const payments = await prisma.payment.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
      },
    });

    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const monthlyRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Calculate churn rate (simplified)
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'CANCELLED').length;
    const churnRate = totalSubscriptions > 0 ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0;
    
    const averageRevenuePerUser = activeSubscriptions > 0 ? monthlyRevenue / activeSubscriptions : 0;
    
    // Calculate subscription growth (simplified)
    const lastMonthSubscriptions = subscriptions.filter(s => 
      s.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    const subscriptionGrowth = totalSubscriptions > 0 ? (lastMonthSubscriptions / totalSubscriptions) * 100 : 0;

    // Top plans
    const planStats = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.planType]) {
        acc[sub.planType] = { count: 0, revenue: 0 };
      }
      acc[sub.planType].count++;
      acc[sub.planType].revenue += Number(sub.amount);
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const topPlans = Object.entries(planStats)
      .map(([planType, stats]) => ({
        planType,
        count: stats.count,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSubscriptions,
      activeSubscriptions,
      monthlyRevenue,
      churnRate,
      averageRevenuePerUser,
      subscriptionGrowth,
      topPlans,
    };
  }

  // Site-specific pricing
  async getSiteSpecificPricing(siteId: string): Promise<SubscriptionPlan[]> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) throw new Error('Site not found');

    // Site-specific pricing strategies
    const pricingStrategies: Record<string, SubscriptionPlan[]> = {
      'unlock-bc.com': [
        {
          id: 'free',
          name: 'Free',
          description: 'Basic access to crypto content',
          planType: 'FREE',
          pricing: { USD: 0, EUR: 0, AED: 0, GBP: 0, CAD: 0 },
          features: ['Basic articles', 'Newsletter access'],
          siteId,
        },
        {
          id: 'basic',
          name: 'Basic',
          description: 'Enhanced crypto analysis',
          planType: 'BASIC',
          pricing: { USD: 9.99, EUR: 8.99, AED: 36.99, GBP: 7.99, CAD: 12.99 },
          features: ['Premium articles', 'Market analysis', 'Crypto payments'],
          siteId,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Full crypto trading insights',
          planType: 'PREMIUM',
          pricing: { USD: 29.99, EUR: 26.99, AED: 109.99, GBP: 23.99, CAD: 38.99 },
          features: ['All features', 'Trading signals', 'Portfolio tracking', 'Priority support'],
          siteId,
        },
      ],
      'iktissadonline.com': [
        {
          id: 'free',
          name: 'Free',
          description: 'Basic financial news',
          planType: 'FREE',
          pricing: { USD: 0, EUR: 0, AED: 0, GBP: 0, CAD: 0 },
          features: ['Basic articles', 'Market updates'],
          siteId,
        },
        {
          id: 'basic',
          name: 'Basic',
          description: 'Enhanced financial analysis',
          planType: 'BASIC',
          pricing: { USD: 19.99, EUR: 17.99, AED: 73.99, GBP: 15.99, CAD: 25.99 },
          features: ['Premium articles', 'Financial data', 'Market reports'],
          siteId,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Professional financial insights',
          planType: 'PREMIUM',
          pricing: { USD: 49.99, EUR: 44.99, AED: 183.99, GBP: 39.99, CAD: 64.99 },
          features: ['All features', 'Real-time data', 'Investment advice', 'Expert consultations'],
          siteId,
        },
      ],
      'himaya.io': [
        {
          id: 'free',
          name: 'Free',
          description: 'Basic security content',
          planType: 'FREE',
          pricing: { USD: 0, EUR: 0, AED: 0, GBP: 0, CAD: 0 },
          features: ['Basic articles', 'Security tips'],
          siteId,
        },
        {
          id: 'basic',
          name: 'Basic',
          description: 'Enhanced security analysis',
          planType: 'BASIC',
          pricing: { USD: 24.99, EUR: 22.99, AED: 91.99, GBP: 19.99, CAD: 32.99 },
          features: ['Premium articles', 'Threat analysis', 'Security tools'],
          siteId,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Enterprise security solutions',
          planType: 'PREMIUM',
          pricing: { USD: 99.99, EUR: 89.99, AED: 367.99, GBP: 79.99, CAD: 129.99 },
          features: ['All features', 'Custom solutions', 'Security audits', '24/7 support'],
          siteId,
        },
      ],
      'defaiya.com': [
        {
          id: 'free',
          name: 'Free',
          description: 'Basic defense content',
          planType: 'FREE',
          pricing: { USD: 0, EUR: 0, AED: 0, GBP: 0, CAD: 0 },
          features: ['Basic articles', 'Defense news'],
          siteId,
        },
        {
          id: 'basic',
          name: 'Basic',
          description: 'Enhanced defense analysis',
          planType: 'BASIC',
          pricing: { USD: 39.99, EUR: 35.99, AED: 147.99, GBP: 31.99, CAD: 51.99 },
          features: ['Premium articles', 'Strategic analysis', 'Defense reports'],
          siteId,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Government-level insights',
          planType: 'PREMIUM',
          pricing: { USD: 199.99, EUR: 179.99, AED: 735.99, GBP: 159.99, CAD: 259.99 },
          features: ['All features', 'Classified analysis', 'Strategic consulting', 'Government access'],
          siteId,
        },
      ],
    };

    return pricingStrategies[site.domain] || pricingStrategies['unlock-bc.com'];
  }

  // Cache management
  private async clearSubscriptionCache(siteId: string, userId: string): Promise<void> {
    const keys = [
      `subscription:${userId}`,
      `subscriptions:${siteId}`,
      `analytics:${siteId}`,
    ];
    
    for (const key of keys) {
      await redis.del(key);
    }
  }

  private async clearPaymentCache(siteId: string, userId: string): Promise<void> {
    const keys = [
      `payments:${userId}`,
      `payments:${siteId}`,
    ];
    
    for (const key of keys) {
      await redis.del(key);
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance(); 