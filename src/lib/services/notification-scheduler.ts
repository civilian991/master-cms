import {
  ScheduledNotification,
  NotificationPayload,
  NotificationPreferences,
} from './push-notifications';
import notificationTemplateService from './notification-templates';

interface ScheduleOptions {
  scheduledFor: Date;
  timezone?: string;
  respectQuietHours?: boolean;
  maxRetries?: number;
  retryDelay?: number; // minutes
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationQueue {
  id: string;
  userId: string;
  payload: NotificationPayload;
  scheduledFor: Date;
  priority: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
  lastAttempt?: Date;
  metadata?: Record<string, any>;
}

interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryAfter?: Date;
}

interface QuietHours {
  enabled: boolean;
  start: string; // "22:00"
  end: string; // "08:00"
  timezone: string;
}

class NotificationSchedulerService {
  private queue: Map<string, NotificationQueue> = new Map();
  private processInterval: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private readonly PROCESS_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_BATCH_SIZE = 50;

  constructor() {
    this.startProcessing();
  }

  /**
   * Schedule a notification for delivery
   */
  public async scheduleNotification(
    userId: string,
    templateId: string,
    context: Record<string, any>,
    options: ScheduleOptions
  ): Promise<string> {
    const notificationId = this.generateId();
    
    try {
      // Get user preferences to check if notifications are enabled
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences.enabled) {
        throw new Error('Notifications disabled for user');
      }

      // Render notification from template
      const payload = notificationTemplateService.createNotificationPayload(
        templateId,
        context,
        { userId }
      );

      // Check category preferences
      const template = notificationTemplateService.getTemplate(templateId);
      if (template && !preferences.categories[template.category as keyof typeof preferences.categories]) {
        throw new Error(`Category '${template.category}' disabled for user`);
      }

      // Adjust scheduling based on quiet hours
      let scheduledFor = options.scheduledFor;
             if (options.respectQuietHours !== false) {
         const quietHours: QuietHours = {
           enabled: preferences.schedule.quiet_hours_enabled,
           start: preferences.schedule.quiet_start,
           end: preferences.schedule.quiet_end,
           timezone: preferences.schedule.timezone,
         };
         
         scheduledFor = this.adjustForQuietHours(
           scheduledFor,
           quietHours,
           options.timezone
         );
       }

      // Create queue item
      const queueItem: NotificationQueue = {
        id: notificationId,
        userId,
        payload,
        scheduledFor,
        priority: this.getPriorityScore(options.priority || 'normal'),
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        status: 'pending',
        createdAt: new Date(),
        metadata: {
          templateId,
          originalContext: context,
          options,
        },
      };

      this.queue.set(notificationId, queueItem);
      
      // Save to database (if implemented)
      await this.saveToDatabase(queueItem);

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(notificationId: string): Promise<boolean> {
    const queueItem = this.queue.get(notificationId);
    
    if (!queueItem) {
      return false;
    }

    if (queueItem.status === 'sent') {
      return false; // Cannot cancel already sent notification
    }

    queueItem.status = 'cancelled';
    await this.updateInDatabase(queueItem);
    
    return true;
  }

  /**
   * Reschedule a notification
   */
  public async rescheduleNotification(
    notificationId: string,
    newScheduledFor: Date
  ): Promise<boolean> {
    const queueItem = this.queue.get(notificationId);
    
    if (!queueItem || queueItem.status === 'sent') {
      return false;
    }

    queueItem.scheduledFor = newScheduledFor;
    queueItem.status = 'pending';
    queueItem.retryCount = 0;
    
    await this.updateInDatabase(queueItem);
    
    return true;
  }

  /**
   * Get notification status
   */
  public getNotificationStatus(notificationId: string): ScheduledNotification | null {
    const queueItem = this.queue.get(notificationId);
    
    if (!queueItem) {
      return null;
    }

    return {
      id: queueItem.id,
      userId: queueItem.userId,
      templateId: queueItem.metadata?.templateId || '',
      payload: queueItem.payload,
      scheduledFor: queueItem.scheduledFor,
             status: queueItem.status === 'processing' ? 'pending' : queueItem.status,
      createdAt: queueItem.createdAt,
      sentAt: queueItem.status === 'sent' ? queueItem.lastAttempt : undefined,
      metadata: queueItem.metadata,
    };
  }

  /**
   * Get pending notifications for a user
   */
  public getUserPendingNotifications(userId: string): ScheduledNotification[] {
    return Array.from(this.queue.values())
      .filter(item => item.userId === userId && item.status === 'pending')
      .map(item => this.getNotificationStatus(item.id)!)
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Schedule bulk notifications
   */
  public async scheduleBulkNotifications(
    notifications: Array<{
      userId: string;
      templateId: string;
      context: Record<string, any>;
      options: ScheduleOptions;
    }>
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const notification of notifications) {
      try {
        const id = await this.scheduleNotification(
          notification.userId,
          notification.templateId,
          notification.context,
          notification.options
        );
        results.push(id);
      } catch (error) {
        console.error('Failed to schedule bulk notification:', error);
        // Continue with other notifications
      }
    }
    
    return results;
  }

  /**
   * Schedule recurring notifications (daily, weekly, monthly)
   */
  public async scheduleRecurringNotification(
    userId: string,
    templateId: string,
    context: Record<string, any>,
    pattern: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string; // "09:00"
      daysOfWeek?: number[]; // [1,2,3,4,5] for weekdays
      dayOfMonth?: number; // 1-31 for monthly
      endDate?: Date;
    },
    options: Omit<ScheduleOptions, 'scheduledFor'>
  ): Promise<string[]> {
    const notifications: string[] = [];
    const now = new Date();
    const endDate = pattern.endDate || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    let currentDate = new Date(now);
    currentDate.setHours(parseInt(pattern.time.split(':')[0]), parseInt(pattern.time.split(':')[1]), 0, 0);

    // Ensure first notification is in the future
    if (currentDate <= now) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    while (currentDate <= endDate) {
      let shouldSchedule = false;

      switch (pattern.frequency) {
        case 'daily':
          shouldSchedule = true;
          break;
        case 'weekly':
          if (pattern.daysOfWeek) {
            shouldSchedule = pattern.daysOfWeek.includes(currentDate.getDay());
          } else {
            shouldSchedule = true;
          }
          break;
        case 'monthly':
          if (pattern.dayOfMonth) {
            shouldSchedule = currentDate.getDate() === pattern.dayOfMonth;
          } else {
            shouldSchedule = currentDate.getDate() === 1; // First of month
          }
          break;
      }

      if (shouldSchedule) {
        try {
          const id = await this.scheduleNotification(
            userId,
            templateId,
            context,
            {
              ...options,
              scheduledFor: new Date(currentDate),
            }
          );
          notifications.push(id);
        } catch (error) {
          console.error('Failed to schedule recurring notification:', error);
        }
      }

      // Move to next occurrence
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return notifications;
  }

  /**
   * Start processing the notification queue
   */
  private startProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }

    this.processInterval = setInterval(
      () => this.processQueue(),
      this.PROCESS_INTERVAL_MS
    );
  }

  /**
   * Stop processing the notification queue
   */
  public stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Process the notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      const pendingNotifications = Array.from(this.queue.values())
        .filter(item => 
          item.status === 'pending' && 
          item.scheduledFor <= now
        )
        .sort((a, b) => b.priority - a.priority || a.scheduledFor.getTime() - b.scheduledFor.getTime())
        .slice(0, this.MAX_BATCH_SIZE);

      for (const notification of pendingNotifications) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(notification: NotificationQueue): Promise<void> {
    notification.status = 'processing';
    notification.lastAttempt = new Date();

    try {
      const result = await this.sendNotification(notification.userId, notification.payload);
      
      if (result.success) {
        notification.status = 'sent';
        await this.trackDelivery(notification, result);
      } else {
        await this.handleFailure(notification, result);
      }
    } catch (error) {
      await this.handleFailure(notification, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    await this.updateInDatabase(notification);
  }

  /**
   * Send notification to user
   */
  private async sendNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<DeliveryResult> {
    try {
      // In a real implementation, this would send via push service
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          payload,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Handle notification delivery failure
   */
  private async handleFailure(
    notification: NotificationQueue,
    result: DeliveryResult
  ): Promise<void> {
    notification.retryCount++;

    if (notification.retryCount >= notification.maxRetries) {
      notification.status = 'failed';
    } else {
      notification.status = 'pending';
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, notification.retryCount) * 5; // 5, 10, 20 minutes
      notification.scheduledFor = new Date(Date.now() + retryDelay * 60 * 1000);
    }
  }

  /**
   * Track successful notification delivery
   */
  private async trackDelivery(
    notification: NotificationQueue,
    result: DeliveryResult
  ): Promise<void> {
    try {
      await fetch('/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notification.id,
          action: 'delivered',
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track delivery:', error);
    }
  }

  /**
   * Adjust scheduling based on quiet hours
   */
  private adjustForQuietHours(
    scheduledFor: Date,
    schedule: QuietHours,
    timezone?: string
  ): Date {
    if (!schedule.enabled) {
      return scheduledFor;
    }

    const userTime = timezone ? 
      new Date(scheduledFor.toLocaleString("en-US", { timeZone: timezone })) :
      scheduledFor;

    const hour = userTime.getHours();
    const minute = userTime.getMinutes();
    const currentTime = hour * 60 + minute;

    const [quietStartHour, quietStartMinute] = schedule.start.split(':').map(Number);
    const [quietEndHour, quietEndMinute] = schedule.end.split(':').map(Number);
    
    const quietStart = quietStartHour * 60 + quietStartMinute;
    const quietEnd = quietEndHour * 60 + quietEndMinute;

    // Handle quiet hours that span midnight
    const isInQuietHours = quietStart > quietEnd ?
      (currentTime >= quietStart || currentTime < quietEnd) :
      (currentTime >= quietStart && currentTime < quietEnd);

    if (isInQuietHours) {
      // Move to end of quiet hours
      const adjustedTime = new Date(userTime);
      adjustedTime.setHours(quietEndHour, quietEndMinute, 0, 0);
      
      // If end time is next day
      if (quietStart > quietEnd && currentTime >= quietStart) {
        adjustedTime.setDate(adjustedTime.getDate() + 1);
      }

      return adjustedTime;
    }

    return scheduledFor;
  }

  /**
   * Get priority score for sorting
   */
  private getPriorityScore(priority: string): number {
    const scores = {
      low: 1,
      normal: 2,
      high: 3,
      urgent: 4,
    };
    return scores[priority as keyof typeof scores] || 2;
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user notification preferences (mock implementation)
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get user preferences:', error);
    }

    // Return default preferences
    return {
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
    };
  }

  /**
   * Save notification to database (mock implementation)
   */
  private async saveToDatabase(notification: NotificationQueue): Promise<void> {
    // This would save to your database
    console.log('Saving notification to database:', notification.id);
  }

  /**
   * Update notification in database (mock implementation)
   */
  private async updateInDatabase(notification: NotificationQueue): Promise<void> {
    // This would update in your database
    console.log('Updating notification in database:', notification.id, notification.status);
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
  } {
    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const notification of this.queue.values()) {
      stats.total++;
      stats[notification.status]++;
    }

    return stats;
  }

  /**
   * Clear completed notifications (sent, failed, cancelled)
   */
  public clearCompletedNotifications(): number {
    const toRemove: string[] = [];
    
    for (const [id, notification] of this.queue.entries()) {
      if (['sent', 'failed', 'cancelled'].includes(notification.status)) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.queue.delete(id);
    }

    return toRemove.length;
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationSchedulerService();
export default notificationScheduler; 