import { subscriptionService } from '@/lib/services/subscription';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    site: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const subscriptionData = {
        planType: 'PREMIUM' as const,
        status: 'ACTIVE' as const,
        currency: 'USD' as const,
        amount: 29.99,
        billingCycle: 'MONTHLY' as const,
        startDate: new Date(),
        siteId: 'site-1',
        userId: 'user-1',
      };

      const mockSubscription = {
        id: 'sub-1',
        ...subscriptionData,
        user: { id: 'user-1', name: 'Test User' },
        site: { id: 'site-1', name: 'Test Site' },
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.subscription.create.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: {
          ...subscriptionData,
          status: 'ACTIVE',
          currency: 'USD',
          billingCycle: 'MONTHLY',
        },
        include: {
          user: true,
          site: true,
          payments: true,
        },
      });

      expect(result).toEqual(mockSubscription);
    });

    it('should throw error for invalid subscription data', async () => {
      const invalidData = {
        planType: 'INVALID' as any,
        amount: -10, // Invalid amount
        siteId: 'site-1',
        userId: 'user-1',
      };

      await expect(subscriptionService.createSubscription(invalidData)).rejects.toThrow();
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription successfully', async () => {
      const updates = {
        status: 'CANCELLED' as const,
        endDate: new Date(),
      };

      const mockUpdatedSubscription = {
        id: 'sub-1',
        planType: 'PREMIUM',
        status: 'CANCELLED',
        currency: 'USD',
        amount: 29.99,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(),
        siteId: 'site-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' },
        site: { id: 'site-1', name: 'Test Site' },
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.subscription.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await subscriptionService.updateSubscription('sub-1', updates);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          ...updates,
          updatedAt: expect.any(Date),
        },
        include: {
          user: true,
          site: true,
          payments: true,
        },
      });

      expect(result).toEqual(mockUpdatedSubscription);
    });
  });

  describe('getSubscription', () => {
    it('should return cached subscription if available', async () => {
      const mockSubscription = {
        id: 'sub-1',
        planType: 'PREMIUM',
        status: 'ACTIVE',
        currency: 'USD',
        amount: 29.99,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        siteId: 'site-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' },
        site: { id: 'site-1', name: 'Test Site' },
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSubscription));

      const result = await subscriptionService.getSubscription('sub-1');

      expect(mockRedis.get).toHaveBeenCalledWith('subscription:sub-1');
      expect(result).toEqual(mockSubscription);
      expect(mockPrisma.subscription.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      const mockSubscription = {
        id: 'sub-1',
        planType: 'PREMIUM',
        status: 'ACTIVE',
        currency: 'USD',
        amount: 29.99,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        siteId: 'site-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' },
        site: { id: 'site-1', name: 'Test Site' },
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.getSubscription('sub-1');

      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        include: {
          user: true,
          site: true,
          payments: true,
        },
      });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'subscription:sub-1',
        300,
        JSON.stringify(mockSubscription)
      );

      expect(result).toEqual(mockSubscription);
    });

    it('should return null if subscription not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const result = await subscriptionService.getSubscription('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSubscriptions', () => {
    it('should return subscriptions with filters', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          planType: 'PREMIUM',
          status: 'ACTIVE',
          currency: 'USD',
          amount: 29.99,
          billingCycle: 'MONTHLY',
          startDate: new Date(),
          siteId: 'site-1',
          userId: 'user-1',
          user: { id: 'user-1', name: 'Test User' },
          site: { id: 'site-1', name: 'Test Site' },
          payments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await subscriptionService.getSubscriptions('site-1', {
        status: 'ACTIVE',
        planType: 'PREMIUM',
      });

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-1',
          status: 'ACTIVE',
          planType: 'PREMIUM',
        },
        include: {
          user: true,
          site: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockSubscriptions);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription successfully', async () => {
      const mockCancelledSubscription = {
        id: 'sub-1',
        planType: 'PREMIUM',
        status: 'CANCELLED',
        currency: 'USD',
        amount: 29.99,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(),
        siteId: 'site-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' },
        site: { id: 'site-1', name: 'Test Site' },
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.subscription.update.mockResolvedValue(mockCancelledSubscription);

      const result = await subscriptionService.cancelSubscription('sub-1', 'User requested cancellation');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'CANCELLED',
          endDate: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        include: {
          user: true,
          site: true,
          payments: true,
        },
      });

      expect(result).toEqual(mockCancelledSubscription);
    });
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const paymentData = {
        amount: 29.99,
        currency: 'USD' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'CREDIT_CARD' as const,
        gateway: 'STRIPE' as const,
        transactionId: 'txn_123',
        siteId: 'site-1',
        userId: 'user-1',
        subscriptionId: 'sub-1',
      };

      const mockPayment = {
        id: 'payment-1',
        ...paymentData,
        user: { id: 'user-1', name: 'Test User' },
        site: { id: 'site-1', name: 'Test Site' },
        subscription: { id: 'sub-1', planType: 'PREMIUM' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      const result = await subscriptionService.createPayment(paymentData);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          ...paymentData,
          status: 'COMPLETED',
        },
        include: {
          user: true,
          site: true,
          subscription: true,
        },
      });

      expect(result).toEqual(mockPayment);
    });
  });

  describe('getSubscriptionAnalytics', () => {
    it('should return subscription analytics', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          planType: 'PREMIUM',
          status: 'ACTIVE',
          amount: 29.99,
          createdAt: new Date(),
        },
        {
          id: 'sub-2',
          planType: 'BASIC',
          status: 'ACTIVE',
          amount: 9.99,
          createdAt: new Date(),
        },
        {
          id: 'sub-3',
          planType: 'PREMIUM',
          status: 'CANCELLED',
          amount: 29.99,
          createdAt: new Date(),
        },
      ];

      const mockPayments = [
        {
          id: 'payment-1',
          amount: 29.99,
          status: 'COMPLETED',
        },
        {
          id: 'payment-2',
          amount: 9.99,
          status: 'COMPLETED',
        },
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      const result = await subscriptionService.getSubscriptionAnalytics('site-1');

      expect(result).toEqual({
        totalSubscriptions: 3,
        activeSubscriptions: 2,
        monthlyRevenue: 39.98,
        churnRate: 33.33,
        averageRevenuePerUser: 19.99,
        subscriptionGrowth: 0,
        topPlans: expect.arrayContaining([
          expect.objectContaining({
            planType: 'PREMIUM',
            count: 2,
            revenue: 59.98,
          }),
          expect.objectContaining({
            planType: 'BASIC',
            count: 1,
            revenue: 9.99,
          }),
        ]),
      });
    });
  });

  describe('getSiteSpecificPricing', () => {
    it('should return site-specific pricing for unlock-bc.com', async () => {
      const mockSite = {
        id: 'site-1',
        domain: 'unlock-bc.com',
        name: 'Unlock BC',
      };

      mockPrisma.site.findUnique.mockResolvedValue(mockSite);

      const result = await subscriptionService.getSiteSpecificPricing('site-1');

      expect(result).toHaveLength(3);
      expect(result[0].planType).toBe('FREE');
      expect(result[1].planType).toBe('BASIC');
      expect(result[2].planType).toBe('PREMIUM');
      expect(result[1].pricing.USD).toBe(9.99);
      expect(result[2].pricing.USD).toBe(29.99);
    });

    it('should return default pricing for unknown site', async () => {
      const mockSite = {
        id: 'site-1',
        domain: 'unknown-site.com',
        name: 'Unknown Site',
      };

      mockPrisma.site.findUnique.mockResolvedValue(mockSite);

      const result = await subscriptionService.getSiteSpecificPricing('site-1');

      expect(result).toHaveLength(3);
      expect(result[0].planType).toBe('FREE');
    });

    it('should throw error if site not found', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(null);

      await expect(subscriptionService.getSiteSpecificPricing('nonexistent')).rejects.toThrow('Site not found');
    });
  });

  describe('processRecurringBilling', () => {
    it('should process recurring billing for active subscriptions', async () => {
      const mockActiveSubscriptions = [
        {
          id: 'sub-1',
          planType: 'PREMIUM',
          status: 'ACTIVE',
          amount: 29.99,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          siteId: 'site-1',
          userId: 'user-1',
          user: { id: 'user-1', name: 'Test User' },
          site: { id: 'site-1', name: 'Test Site' },
        },
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockActiveSubscriptions);
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-1',
        amount: 29.99,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await subscriptionService.processRecurringBilling();

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endDate: null,
        },
        include: {
          user: true,
          site: true,
        },
      });

      expect(mockPrisma.payment.create).toHaveBeenCalled();
      expect(mockPrisma.subscription.update).toHaveBeenCalled();
    });
  });

  describe('calculateNextBillingDate', () => {
    it('should calculate next billing date for monthly cycle', () => {
      const startDate = new Date('2024-01-15');
      const nextDate = (subscriptionService as any).calculateNextBillingDate(startDate, 'MONTHLY');
      
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(15);
    });

    it('should calculate next billing date for quarterly cycle', () => {
      const startDate = new Date('2024-01-15');
      const nextDate = (subscriptionService as any).calculateNextBillingDate(startDate, 'QUARTERLY');
      
      expect(nextDate.getMonth()).toBe(3); // April
      expect(nextDate.getDate()).toBe(15);
    });

    it('should calculate next billing date for yearly cycle', () => {
      const startDate = new Date('2024-01-15');
      const nextDate = (subscriptionService as any).calculateNextBillingDate(startDate, 'YEARLY');
      
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getDate()).toBe(15);
    });
  });
}); 