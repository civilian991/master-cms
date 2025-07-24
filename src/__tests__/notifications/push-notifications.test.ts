import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  pushNotificationService,
  NotificationPayload,
  NotificationPreferences,
  defaultNotificationTemplates 
} from '@/lib/services/push-notifications';
import notificationTemplateService from '@/lib/services/notification-templates';
import notificationScheduler from '@/lib/services/notification-scheduler';
import notificationAnalytics from '@/lib/services/notification-analytics';

// Define interfaces locally for testing
interface TemplateContext {
  [key: string]: string | number | boolean | Date;
}

interface NotificationPersonalization {
  userId: string;
  userPreferences?: {
    language?: string;
    timezone?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ScheduleOptions {
  scheduledFor: Date;
  timezone?: string;
  respectQuietHours?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationEvent {
  id: string;
  notificationId: string;
  userId: string;
  action: 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'action_clicked';
  actionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Mock global objects
const mockNavigator = {
  serviceWorker: {
    register: jest.fn(),
    getRegistration: jest.fn(),
  },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  platform: 'Win32',
};

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn(),
};

const mockPushManager = {
  subscribe: jest.fn(),
  getSubscription: jest.fn(),
  unsubscribe: jest.fn(),
};

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
  showNotification: jest.fn(),
  getNotifications: jest.fn(),
  addEventListener: jest.fn(),
};

// Setup global mocks
Object.assign(global, {
  navigator: mockNavigator,
  Notification: mockNotification,
  fetch: vi.fn(),
  window: {
    btoa: (str: string) => Buffer.from(str).toString('base64'),
    atob: (str: string) => Buffer.from(str, 'base64').toString(),
  },
});

describe('Push Notifications System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset notification permission
    mockNotification.permission = 'default';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PushNotificationService', () => {
    describe('Browser Support Detection', () => {
      it('should detect push notification support correctly', () => {
        // Test supported environment
        expect(pushNotificationService.isSupported()).toBe(true);

        // Test unsupported environment
        delete (global as any).navigator.serviceWorker;
        expect(pushNotificationService.isSupported()).toBe(false);

        // Restore for other tests
        (global as any).navigator.serviceWorker = mockNavigator.serviceWorker;
      });

      it('should get current permission status', () => {
        mockNotification.permission = 'granted';
        expect(pushNotificationService.getPermissionStatus()).toBe('granted');

        mockNotification.permission = 'denied';
        expect(pushNotificationService.getPermissionStatus()).toBe('denied');
      });
    });

    describe('Permission Management', () => {
      it('should request notification permissions successfully', async () => {
        mockNotification.requestPermission.mockResolvedValue('granted');
        mockNavigator.serviceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);
        mockPushManager.subscribe.mockResolvedValue({
          endpoint: 'https://fcm.googleapis.com/test',
          getKey: vi.fn().mockImplementation((keyType) => {
            if (keyType === 'p256dh') return new ArrayBuffer(65);
            if (keyType === 'auth') return new ArrayBuffer(16);
            return null;
          }),
        });

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const permission = await pushNotificationService.requestPermission();
        
        expect(permission).toBe('granted');
        expect(mockNotification.requestPermission).toHaveBeenCalled();
        expect(mockPushManager.subscribe).toHaveBeenCalled();
      });

      it('should handle permission denial gracefully', async () => {
        mockNotification.requestPermission.mockResolvedValue('denied');

        const permission = await pushNotificationService.requestPermission();
        
        expect(permission).toBe('denied');
        expect(mockPushManager.subscribe).not.toHaveBeenCalled();
      });
    });

    describe('Subscription Management', () => {
      beforeEach(() => {
        mockNavigator.serviceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      it('should subscribe to push notifications', async () => {
        const mockSubscription = {
          endpoint: 'https://fcm.googleapis.com/test',
          getKey: vi.fn().mockImplementation((keyType) => {
            if (keyType === 'p256dh') return new ArrayBuffer(65);
            if (keyType === 'auth') return new ArrayBuffer(16);
            return null;
          }),
        };

        mockPushManager.subscribe.mockResolvedValue(mockSubscription);

        const subscription = await pushNotificationService.subscribe();
        
        expect(subscription).toBeDefined();
        expect(subscription?.endpoint).toBe('https://fcm.googleapis.com/test');
        expect(mockPushManager.subscribe).toHaveBeenCalledWith({
          userVisibleOnly: true,
          applicationServerKey: expect.any(Uint8Array),
        });
      });

      it('should unsubscribe from push notifications', async () => {
        const mockSubscription = {
          unsubscribe: vi.fn().mockResolvedValue(true),
        };

        mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

        const success = await pushNotificationService.unsubscribe();
        
        expect(success).toBe(true);
        expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      });

      it('should get current subscription', async () => {
        const mockSubscription = {
          endpoint: 'https://fcm.googleapis.com/test',
          getKey: vi.fn().mockImplementation((keyType) => {
            if (keyType === 'p256dh') return new ArrayBuffer(65);
            if (keyType === 'auth') return new ArrayBuffer(16);
            return null;
          }),
        };

        mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

        const subscription = await pushNotificationService.getSubscription();
        
        expect(subscription).toBeDefined();
        expect(subscription?.endpoint).toBe('https://fcm.googleapis.com/test');
      });
    });

    describe('Local Notifications', () => {
      beforeEach(() => {
        mockNotification.permission = 'granted';
        global.Notification = vi.fn().mockImplementation((title, options) => ({
          title,
          ...options,
          onclick: null,
          onclose: null,
          close: vi.fn(),
        }));
      });

      it('should show local notification with basic payload', async () => {
        const payload: NotificationPayload = {
          title: 'Test Notification',
          body: 'This is a test notification',
          icon: '/test-icon.png',
          data: { id: 'test-123' },
        };

        await pushNotificationService.showLocalNotification(payload);
        
        expect(global.Notification).toHaveBeenCalledWith(
          'Test Notification',
          expect.objectContaining({
            body: 'This is a test notification',
            icon: '/test-icon.png',
            data: { id: 'test-123' },
          })
        );
      });

      it('should show test notification', async () => {
        await pushNotificationService.sendTestNotification();
        
        expect(global.Notification).toHaveBeenCalledWith(
          'Test Notification',
          expect.objectContaining({
            body: 'This is a test notification to verify everything is working!',
            tag: 'test',
            vibrate: [200, 100, 200],
          })
        );
      });
    });

    describe('Preferences Management', () => {
      it('should get default preferences when API fails', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const preferences = await pushNotificationService.getPreferences();
        
        expect(preferences).toEqual({
          enabled: false,
          categories: {
            articles: true,
            comments: true,
            system: true,
            marketing: false,
            engagement: true,
          },
          schedule: {
            quiet_hours_enabled: true,
            quiet_start: '22:00',
            quiet_end: '08:00',
            timezone: expect.any(String),
          },
          frequency: {
            immediate: true,
            daily_digest: false,
            weekly_digest: false,
          },
        });
      });

      it('should update preferences successfully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const preferences: Partial<NotificationPreferences> = {
          enabled: true,
          categories: {
            articles: true,
            comments: false,
            system: true,
            marketing: true,
            engagement: false,
          },
        };

        await expect(pushNotificationService.updatePreferences(preferences)).resolves.not.toThrow();
        
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/preferences',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preferences),
          })
        );
      });
    });
  });

  describe('NotificationTemplateService', () => {
    describe('Template Management', () => {
      it('should load default templates', () => {
        const templates = notificationTemplateService.getAllTemplates();
        
        expect(templates.length).toBeGreaterThan(0);
        expect(templates).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'new-article',
              name: 'New Article Published',
              category: 'article',
            }),
          ])
        );
      });

      it('should register new template', () => {
        const customTemplate = {
          id: 'custom-test',
          name: 'Custom Test Template',
          title: 'Custom: {{title}}',
          body: 'Custom notification for {{user}}',
          category: 'system' as const,
          variables: ['title', 'user'],
        };

        notificationTemplateService.registerTemplate(customTemplate);
        
        const template = notificationTemplateService.getTemplate('custom-test');
        expect(template).toEqual(customTemplate);
      });

      it('should get templates by category', () => {
        const articleTemplates = notificationTemplateService.getTemplatesByCategory('article');
        
        expect(articleTemplates.length).toBeGreaterThan(0);
        expect(articleTemplates.every(t => t.category === 'article')).toBe(true);
      });

      it('should remove template', () => {
        const removed = notificationTemplateService.removeTemplate('new-article');
        expect(removed).toBe(true);
        
        const template = notificationTemplateService.getTemplate('new-article');
        expect(template).toBeUndefined();
      });
    });

    describe('Template Rendering', () => {
      it('should render notification from template', () => {
        const context: TemplateContext = {
          title: 'Amazing Article',
          author: 'John Doe',
        };

        const rendered = notificationTemplateService.renderNotification(
          'new-article',
          context
        );

        expect(rendered.title).toBe('New Article: Amazing Article');
        expect(rendered.body).toContain('Amazing Article');
        expect(rendered.body).toContain('John Doe');
        expect(rendered.data?.templateId).toBe('new-article');
      });

      it('should render with personalization', () => {
        const context: TemplateContext = {
          title: 'Personal Article',
          author: 'Jane Smith',
        };

        const personalization: NotificationPersonalization = {
          userId: 'user-123',
          userPreferences: {
            firstName: 'Alice',
            lastName: 'Johnson',
            timezone: 'America/New_York',
          },
        };

        const rendered = notificationTemplateService.renderNotification(
          'new-article',
          context,
          personalization
        );

        expect(rendered.data?.userId).toBe('user-123');
        expect(rendered.title).toBe('New Article: Personal Article');
      });

      it('should create complete notification payload', () => {
        const context: TemplateContext = {
          title: 'Test Article',
          author: 'Test Author',
        };

        const payload = notificationTemplateService.createNotificationPayload(
          'new-article',
          context,
          { userId: 'user-456' }
        );

        expect(payload).toEqual(
          expect.objectContaining({
            title: 'New Article: Test Article',
            body: expect.stringContaining('Test Article'),
            tag: 'new-article-user-456',
            requireInteraction: false,
            silent: false,
          })
        );
      });
    });

    describe('Template Validation', () => {
      it('should validate template context', () => {
        const context: TemplateContext = {
          title: 'Complete Article',
          author: 'Complete Author',
        };

        const validation = notificationTemplateService.validateTemplateContext(
          'new-article',
          context
        );

        expect(validation.isValid).toBe(true);
        expect(validation.missingVariables).toHaveLength(0);
      });

      it('should detect missing variables', () => {
        const context: TemplateContext = {
          title: 'Incomplete Article',
          // Missing 'author' variable
        };

        const validation = notificationTemplateService.validateTemplateContext(
          'new-article',
          context
        );

        expect(validation.isValid).toBe(false);
        expect(validation.missingVariables).toContain('author');
      });

      it('should handle non-existent template', () => {
        const validation = notificationTemplateService.validateTemplateContext(
          'non-existent',
          {}
        );

        expect(validation.isValid).toBe(false);
      });
    });

    describe('Localization', () => {
      it('should get localized template', () => {
        const spanishTemplate = notificationTemplateService.getLocalizedTemplate(
          'new-article',
          'es'
        );

        expect(spanishTemplate?.id).toBe('new-article-es');
        expect(spanishTemplate?.title).toContain('Nuevo Artículo');
      });

      it('should fallback to default template', () => {
        const fallbackTemplate = notificationTemplateService.getLocalizedTemplate(
          'new-article',
          'unknown'
        );

        expect(fallbackTemplate?.id).toBe('new-article');
        expect(fallbackTemplate?.title).toContain('New Article');
      });
    });

    describe('Template Testing and Preview', () => {
      it('should preview notification', () => {
        const context: TemplateContext = {
          title: 'Preview Article',
          author: 'Preview Author',
        };

        const preview = notificationTemplateService.previewNotification(
          'new-article',
          context
        );

        expect(preview.rendered.title).toBe('New Article: Preview Article');
        expect(preview.validation.isValid).toBe(true);
        expect(preview.preview).toContain('📱');
        expect(preview.preview).toContain('Preview Article');
      });

      it('should test template with sample data', () => {
        const testResult = notificationTemplateService.testTemplate('new-article');

        expect(testResult.isValid).toBe(true);
        expect(testResult.errors).toHaveLength(0);
        expect(testResult.preview).toBeTruthy();
      });

      it('should handle invalid template in testing', () => {
        const testResult = notificationTemplateService.testTemplate('invalid-template');

        expect(testResult.isValid).toBe(false);
        expect(testResult.errors.length).toBeGreaterThan(0);
        expect(testResult.preview).toBeNull();
      });
    });

    describe('A/B Testing Support', () => {
      it('should create template variant', () => {
        const variant = notificationTemplateService.createVariant(
          'new-article',
          'new-article-variant-a',
          {
            title: 'Fresh Article: {{title}}',
            body: 'Check out this fresh article "{{title}}" by {{author}}',
          }
        );

        expect(variant).toBeDefined();
        expect(variant?.id).toBe('new-article-variant-a');
        expect(variant?.title).toBe('Fresh Article: {{title}}');
      });

      it('should return null for non-existent base template', () => {
        const variant = notificationTemplateService.createVariant(
          'non-existent',
          'variant-id',
          { title: 'New Title' }
        );

        expect(variant).toBeNull();
      });
    });
  });

  describe('NotificationSchedulerService', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          enabled: true,
          categories: {
            articles: true,
            comments: true,
            system: true,
            marketing: false,
            engagement: true,
          },
          schedule: {
            quiet_hours_enabled: true,
            quiet_start: '22:00',
            quiet_end: '08:00',
            timezone: 'UTC',
          },
          frequency: {
            immediate: true,
            daily_digest: false,
            weekly_digest: false,
          },
        }),
      });
    });

    describe('Basic Scheduling', () => {
      it('should schedule notification successfully', async () => {
        const scheduledFor = new Date(Date.now() + 60000); // 1 minute from now
        const options: ScheduleOptions = {
          scheduledFor,
          priority: 'normal',
        };

        const notificationId = await notificationScheduler.scheduleNotification(
          'user-123',
          'new-article',
          { title: 'Scheduled Article', author: 'Scheduler' },
          options
        );

        expect(notificationId).toMatch(/^notif_/);

        const status = notificationScheduler.getNotificationStatus(notificationId);
        expect(status?.status).toBe('pending');
        expect(status?.scheduledFor).toEqual(scheduledFor);
      });

      it('should cancel scheduled notification', async () => {
        const notificationId = await notificationScheduler.scheduleNotification(
          'user-123',
          'new-article',
          { title: 'Cancelable Article', author: 'Canceler' },
          { scheduledFor: new Date(Date.now() + 60000) }
        );

        const success = await notificationScheduler.cancelNotification(notificationId);
        expect(success).toBe(true);

        const status = notificationScheduler.getNotificationStatus(notificationId);
        expect(status?.status).toBe('cancelled');
      });

      it('should reschedule notification', async () => {
        const originalTime = new Date(Date.now() + 60000);
        const newTime = new Date(Date.now() + 120000);

        const notificationId = await notificationScheduler.scheduleNotification(
          'user-123',
          'new-article',
          { title: 'Reschedulable Article', author: 'Rescheduler' },
          { scheduledFor: originalTime }
        );

        const success = await notificationScheduler.rescheduleNotification(
          notificationId,
          newTime
        );
        expect(success).toBe(true);

        const status = notificationScheduler.getNotificationStatus(notificationId);
        expect(status?.scheduledFor).toEqual(newTime);
      });
    });

    describe('Bulk Operations', () => {
      it('should schedule bulk notifications', async () => {
        const notifications = [
          {
            userId: 'user-1',
            templateId: 'new-article',
            context: { title: 'Article 1', author: 'Author 1' },
            options: { scheduledFor: new Date(Date.now() + 60000) },
          },
          {
            userId: 'user-2',
            templateId: 'new-article',
            context: { title: 'Article 2', author: 'Author 2' },
            options: { scheduledFor: new Date(Date.now() + 120000) },
          },
        ];

        const results = await notificationScheduler.scheduleBulkNotifications(notifications);
        
        expect(results).toHaveLength(2);
        expect(results.every(id => id.startsWith('notif_'))).toBe(true);
      });
    });

    describe('Recurring Notifications', () => {
      it('should schedule daily recurring notifications', async () => {
        const pattern = {
          frequency: 'daily' as const,
          time: '09:00',
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        const notificationIds = await notificationScheduler.scheduleRecurringNotification(
          'user-123',
          'weekly-digest',
          { articleCount: '5' },
          pattern,
          { priority: 'normal' }
        );

        expect(notificationIds.length).toBe(7); // 7 daily notifications
      });

      it('should schedule weekly recurring notifications', async () => {
        const pattern = {
          frequency: 'weekly' as const,
          time: '10:00',
          daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        const notificationIds = await notificationScheduler.scheduleRecurringNotification(
          'user-123',
          'weekly-digest',
          { articleCount: '10' },
          pattern,
          { priority: 'normal' }
        );

        expect(notificationIds.length).toBeGreaterThan(0);
      });
    });

    describe('User Management', () => {
      it('should get user pending notifications', async () => {
        // Schedule multiple notifications for the same user
        await notificationScheduler.scheduleNotification(
          'user-123',
          'new-article',
          { title: 'Article 1', author: 'Author 1' },
          { scheduledFor: new Date(Date.now() + 60000) }
        );

        await notificationScheduler.scheduleNotification(
          'user-123',
          'new-article',
          { title: 'Article 2', author: 'Author 2' },
          { scheduledFor: new Date(Date.now() + 120000) }
        );

        const pendingNotifications = notificationScheduler.getUserPendingNotifications('user-123');
        
        expect(pendingNotifications.length).toBe(2);
        expect(pendingNotifications[0].scheduledFor.getTime()).toBeLessThan(
          pendingNotifications[1].scheduledFor.getTime()
        );
      });
    });

    describe('Queue Management', () => {
      it('should get queue statistics', async () => {
        await notificationScheduler.scheduleNotification(
          'user-123',
          'new-article',
          { title: 'Stats Article', author: 'Stats Author' },
          { scheduledFor: new Date(Date.now() + 60000) }
        );

        const stats = notificationScheduler.getQueueStats();
        
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.pending).toBeGreaterThan(0);
      });

      it('should clear completed notifications', async () => {
        const clearedCount = notificationScheduler.clearCompletedNotifications();
        expect(typeof clearedCount).toBe('number');
      });
    });
  });

  describe('NotificationAnalyticsService', () => {
    describe('Event Tracking', () => {
      it('should track notification events', async () => {
        const event: Omit<NotificationEvent, 'id'> = {
          notificationId: 'notif-123',
          userId: 'user-123',
          action: 'delivered',
          timestamp: new Date(),
          metadata: {
            templateId: 'new-article',
            category: 'article',
            platform: 'web',
          },
        };

        await expect(notificationAnalytics.trackEvent(event)).resolves.not.toThrow();
      });

      it('should track interaction with legacy method', async () => {
        await expect(
          notificationAnalytics.trackInteraction(
            'notif-123',
            'user-123',
            'clicked',
            undefined,
            { templateId: 'new-article' }
          )
        ).resolves.not.toThrow();
      });
    });

    describe('Metrics Calculation', () => {
      beforeEach(async () => {
        // Seed some test events
        const baseEvent = {
          notificationId: 'notif-metrics-test',
          userId: 'user-metrics',
          timestamp: new Date(),
          metadata: { templateId: 'new-article', category: 'article' },
        };

        await notificationAnalytics.trackEvent({ ...baseEvent, action: 'sent' });
        await notificationAnalytics.trackEvent({ ...baseEvent, action: 'delivered' });
        await notificationAnalytics.trackEvent({ ...baseEvent, action: 'clicked' });
      });

      it('should calculate notification metrics', () => {
        const metrics = notificationAnalytics.getNotificationMetrics('notif-metrics-test');

        expect(metrics.totalSent).toBe(1);
        expect(metrics.totalDelivered).toBe(1);
        expect(metrics.totalClicked).toBe(1);
        expect(metrics.deliveryRate).toBe(100);
        expect(metrics.clickThroughRate).toBe(100);
      });
    });

    describe('Engagement Analysis', () => {
      it('should get user engagement data', () => {
        const engagement = notificationAnalytics.getUserEngagement('user-metrics');
        expect(engagement).toBeDefined();
        expect(engagement?.userId).toBe('user-metrics');
      });

      it('should get low engagement users', () => {
        const lowEngagementUsers = notificationAnalytics.getLowEngagementUsers(30);
        expect(Array.isArray(lowEngagementUsers)).toBe(true);
      });

      it('should get high engagement users', () => {
        const highEngagementUsers = notificationAnalytics.getHighEngagementUsers(70);
        expect(Array.isArray(highEngagementUsers)).toBe(true);
      });
    });

    describe('Timing Analysis', () => {
      it('should get best sending times', () => {
        const bestTimes = notificationAnalytics.getBestSendingTimes();
        expect(Array.isArray(bestTimes)).toBe(true);
      });

      it('should get user-specific best times', () => {
        const userBestTimes = notificationAnalytics.getBestSendingTimes('user-123');
        expect(Array.isArray(userBestTimes)).toBe(true);
      });
    });

    describe('Trend Analysis', () => {
      it('should get engagement trends', () => {
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const trends = notificationAnalytics.getEngagementTrends(startDate, endDate, 'day');
        expect(Array.isArray(trends)).toBe(true);
      });
    });

    describe('A/B Testing Analytics', () => {
      it('should generate A/B test results', () => {
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const results = notificationAnalytics.getABTestResults(
          'template-a',
          'template-b',
          startDate,
          endDate
        );

        expect(results).toHaveProperty('variantA');
        expect(results).toHaveProperty('variantB');
        expect(results).toHaveProperty('winner');
        expect(results).toHaveProperty('confidence');
      });
    });

    describe('Personalization Insights', () => {
      it('should get personalization insights', () => {
        const insights = notificationAnalytics.getPersonalizationInsights('user-123');

        expect(insights).toHaveProperty('preferredCategories');
        expect(insights).toHaveProperty('optimalSendTime');
        expect(insights).toHaveProperty('devicePreference');
        expect(insights).toHaveProperty('engagementPattern');
        expect(insights).toHaveProperty('recommendations');
        expect(Array.isArray(insights.recommendations)).toBe(true);
      });
    });

    describe('Dashboard Metrics', () => {
      it('should get dashboard metrics', () => {
        const dashboardMetrics = notificationAnalytics.getDashboardMetrics();

        expect(dashboardMetrics).toHaveProperty('last24Hours');
        expect(dashboardMetrics).toHaveProperty('last7Days');
        expect(dashboardMetrics).toHaveProperty('last30Days');
        expect(dashboardMetrics).toHaveProperty('topPerformingTemplates');
        expect(dashboardMetrics).toHaveProperty('recentActivity');
      });
    });

    describe('Data Export', () => {
      it('should export analytics data as JSON', () => {
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const jsonData = notificationAnalytics.exportAnalyticsData(startDate, endDate, 'json');
        
        expect(() => JSON.parse(jsonData)).not.toThrow();
      });

      it('should export analytics data as CSV', () => {
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const csvData = notificationAnalytics.exportAnalyticsData(startDate, endDate, 'csv');
        
        expect(csvData).toContain('eventId,notificationId,userId');
        expect(csvData.split('\n').length).toBeGreaterThan(1);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end from template to analytics', async () => {
      // 1. Create and render notification from template
      const context = { title: 'Integration Test Article', author: 'Test Author' };
      const payload = notificationTemplateService.createNotificationPayload(
        'new-article',
        context,
        { userId: 'integration-user' }
      );

      expect(payload.title).toBe('New Article: Integration Test Article');

      // 2. Schedule the notification
      const notificationId = await notificationScheduler.scheduleNotification(
        'integration-user',
        'new-article',
        context,
        { scheduledFor: new Date(Date.now() + 1000) }
      );

      expect(notificationId).toBeDefined();

      // 3. Track analytics events
      await notificationAnalytics.trackEvent({
        notificationId,
        userId: 'integration-user',
        action: 'delivered',
        timestamp: new Date(),
        metadata: { templateId: 'new-article', category: 'article' },
      });

      await notificationAnalytics.trackEvent({
        notificationId,
        userId: 'integration-user',
        action: 'clicked',
        timestamp: new Date(),
        metadata: { templateId: 'new-article', category: 'article' },
      });

      // 4. Verify analytics
      const metrics = notificationAnalytics.getNotificationMetrics(notificationId);
      expect(metrics.totalDelivered).toBe(1);
      expect(metrics.totalClicked).toBe(1);
      expect(metrics.clickThroughRate).toBe(100);
    });

    it('should handle template validation in scheduling pipeline', async () => {
      // Test with invalid template context
      const incompleteContext = { title: 'Missing Author Article' };
      
      const validation = notificationTemplateService.validateTemplateContext(
        'new-article',
        incompleteContext
      );

      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables).toContain('author');
    });

    it('should support localized notifications', () => {
      const spanishTemplate = notificationTemplateService.getLocalizedTemplate(
        'new-article',
        'es'
      );

      const context = { title: 'Artículo Español', author: 'Autor Español' };
      const rendered = notificationTemplateService.renderNotification(
        spanishTemplate!.id,
        context
      );

      expect(rendered.title).toBe('Nuevo Artículo: Artículo Español');
      expect(rendered.body).toContain('Artículo Español');
    });
  });
}); 