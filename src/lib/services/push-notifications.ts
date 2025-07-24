// Note: Using console for feedback until toast system is available
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
};

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  category: 'article' | 'comment' | 'system' | 'marketing' | 'engagement';
  variables?: string[];
  defaultData?: Record<string, any>;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: {
    articles: boolean;
    comments: boolean;
    system: boolean;
    marketing: boolean;
    engagement: boolean;
  };
  schedule: {
    quiet_hours_enabled: boolean;
    quiet_start: string; // "22:00"
    quiet_end: string; // "08:00"
    timezone: string;
  };
  frequency: {
    immediate: boolean;
    daily_digest: boolean;
    weekly_digest: boolean;
  };
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  templateId: string;
  payload: NotificationPayload;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
  sentAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationInteraction {
  id: string;
  notificationId: string;
  userId: string;
  action: 'received' | 'clicked' | 'dismissed' | 'action_clicked';
  actionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PushNotificationService {
  private vapidPublicKey: string;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      
      // Listen for service worker updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  public isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current permission status
   */
  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permissions
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notifications enabled successfully!');
      await this.subscribe();
    } else if (permission === 'denied') {
      toast.error('Notification permission denied');
    }

    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.initializeServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not available');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      this.subscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      toast.success('Successfully subscribed to notifications!');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error('Failed to subscribe to notifications');
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        const success = await subscription.unsubscribe();
        
        if (success) {
          await this.removeSubscriptionFromServer();
          this.subscription = null;
          toast.success('Unsubscribed from notifications');
        }
        
        return success;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast.error('Failed to unsubscribe from notifications');
      return false;
    }
  }

  /**
   * Get current subscription
   */
  public async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        this.subscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
          },
        };
      }
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }

  /**
   * Show local notification (for testing/immediate feedback)
   */
  public async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
      };

      // Add advanced properties if supported (not available in all browsers)
      if (payload.image && 'image' in Notification.prototype) {
        (notificationOptions as any).image = payload.image;
      }
      
      if (payload.vibrate && 'vibrate' in Notification.prototype) {
        (notificationOptions as any).vibrate = payload.vibrate;
      }

      const notification = new Notification(payload.title, notificationOptions);

      // Track notification interaction
      notification.onclick = (event) => {
        event.preventDefault();
        this.trackInteraction(payload.data?.id, 'clicked');
        
        // Handle notification click
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank');
        }
        
        notification.close();
      };

      notification.onclose = () => {
        this.trackInteraction(payload.data?.id, 'dismissed');
      };

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Track notification interaction
   */
  public async trackInteraction(
    notificationId: string,
    action: 'received' | 'clicked' | 'dismissed' | 'action_clicked',
    actionId?: string
  ): Promise<void> {
    try {
      await fetch('/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          action,
          actionId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track notification interaction:', error);
    }
  }

  /**
   * Get notification preferences
   */
  public async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await fetch('/api/notifications/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      
      // Return default preferences
      return {
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
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        frequency: {
          immediate: true,
          daily_digest: false,
          weekly_digest: false,
        },
      };
    }
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update notification preferences');
      throw error;
    }
  }

  /**
   * Test notification functionality
   */
  public async sendTestNotification(): Promise<void> {
    const testPayload: NotificationPayload = {
      title: 'Test Notification',
      body: 'This is a test notification to verify everything is working!',
      icon: '/icons/icon-192x192.png',
      tag: 'test',
      data: {
        id: 'test-' + Date.now(),
        url: window.location.href,
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };

    await this.showLocalNotification(testPayload);
  }

  /**
   * Utility: Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }
}

// Default notification templates
export const defaultNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'new-article',
    name: 'New Article Published',
    title: 'New Article: {{title}}',
    body: 'A new article "{{title}}" has been published by {{author}}',
    icon: '/icons/article-icon.png',
    category: 'article',
    variables: ['title', 'author'],
    defaultData: {
      url: '/articles/{{slug}}',
    },
  },
  {
    id: 'comment-reply',
    name: 'Comment Reply',
    title: 'New reply to your comment',
    body: '{{author}} replied to your comment on "{{articleTitle}}"',
    icon: '/icons/comment-icon.png',
    category: 'comment',
    variables: ['author', 'articleTitle'],
    defaultData: {
      url: '/articles/{{articleSlug}}#comment-{{commentId}}',
    },
  },
  {
    id: 'system-maintenance',
    name: 'System Maintenance',
    title: 'Scheduled Maintenance',
    body: 'System maintenance scheduled for {{date}} at {{time}}',
    icon: '/icons/system-icon.png',
    category: 'system',
    variables: ['date', 'time'],
    defaultData: {
      requireInteraction: true,
    },
  },
  {
    id: 'weekly-digest',
    name: 'Weekly Digest',
    title: 'Your Weekly Digest',
    body: 'Check out {{articleCount}} new articles this week',
    icon: '/icons/digest-icon.png',
    category: 'engagement',
    variables: ['articleCount'],
    defaultData: {
      url: '/digest/weekly',
    },
  },
  {
    id: 'marketing-promotion',
    name: 'Promotion Alert',
    title: '{{promotionTitle}}',
    body: '{{promotionDescription}} - Valid until {{expiryDate}}',
    icon: '/icons/promotion-icon.png',
    category: 'marketing',
    variables: ['promotionTitle', 'promotionDescription', 'expiryDate'],
    defaultData: {
      url: '/promotions/{{promotionId}}',
    },
  },
];

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService; 