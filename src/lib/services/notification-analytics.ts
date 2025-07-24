import { NotificationInteraction } from './push-notifications';

interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalDismissed: number;
  deliveryRate: number; // delivered / sent
  clickThroughRate: number; // clicked / delivered
  dismissalRate: number; // dismissed / delivered
}

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  category: string;
  metrics: NotificationMetrics;
  lastUsed: Date;
  averageEngagementTime: number; // milliseconds
  topActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
}

interface UserEngagement {
  userId: string;
  totalReceived: number;
  totalClicked: number;
  totalDismissed: number;
  preferredCategories: string[];
  optimalSendTime: string; // "14:30"
  engagementScore: number; // 0-100
  lastInteraction: Date;
}

interface NotificationEvent {
  id: string;
  notificationId: string;
  userId: string;
  action: 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'action_clicked';
  actionId?: string;
  timestamp: Date;
  metadata?: {
    templateId?: string;
    category?: string;
    platform?: string;
    userAgent?: string;
    location?: string;
    responseTime?: number; // milliseconds from delivery to interaction
  };
}

interface CampaignAnalytics {
  campaignId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  metrics: NotificationMetrics;
  segmentPerformance: Array<{
    segment: string;
    userCount: number;
    metrics: NotificationMetrics;
  }>;
  timeSeriesData: Array<{
    date: Date;
    sent: number;
    delivered: number;
    clicked: number;
    dismissed: number;
  }>;
}

class NotificationAnalyticsService {
  private events: Map<string, NotificationEvent> = new Map();
  private userEngagement: Map<string, UserEngagement> = new Map();
  private templatePerformance: Map<string, TemplatePerformance> = new Map();

  /**
   * Track a notification event
   */
  public async trackEvent(event: Omit<NotificationEvent, 'id'>): Promise<void> {
    const eventId = this.generateEventId();
    const notificationEvent: NotificationEvent = {
      id: eventId,
      ...event,
    };

    // Store event
    this.events.set(eventId, notificationEvent);

    // Update user engagement
    await this.updateUserEngagement(notificationEvent);

    // Update template performance
    if (notificationEvent.metadata?.templateId) {
      await this.updateTemplatePerformance(notificationEvent);
    }

    // Persist to database
    await this.saveEventToDatabase(notificationEvent);
  }

  /**
   * Track notification interaction (legacy method for compatibility)
   */
  public async trackInteraction(
    notificationId: string,
    userId: string,
    action: 'received' | 'clicked' | 'dismissed' | 'action_clicked',
    actionId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      notificationId,
      userId,
      action: action === 'received' ? 'delivered' : action,
      actionId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Get metrics for a specific notification
   */
  public getNotificationMetrics(notificationId: string): NotificationMetrics {
    const events = Array.from(this.events.values())
      .filter(event => event.notificationId === notificationId);

    return this.calculateMetrics(events);
  }

  /**
   * Get template performance analytics
   */
  public getTemplatePerformance(templateId: string): TemplatePerformance | null {
    return this.templatePerformance.get(templateId) || null;
  }

  /**
   * Get all template performance sorted by engagement
   */
  public getAllTemplatePerformance(): TemplatePerformance[] {
    return Array.from(this.templatePerformance.values())
      .sort((a, b) => b.metrics.clickThroughRate - a.metrics.clickThroughRate);
  }

  /**
   * Get user engagement data
   */
  public getUserEngagement(userId: string): UserEngagement | null {
    return this.userEngagement.get(userId) || null;
  }

  /**
   * Get users with low engagement (for re-engagement campaigns)
   */
  public getLowEngagementUsers(threshold: number = 20): UserEngagement[] {
    return Array.from(this.userEngagement.values())
      .filter(user => user.engagementScore < threshold)
      .sort((a, b) => a.engagementScore - b.engagementScore);
  }

  /**
   * Get high-engagement users (for premium features)
   */
  public getHighEngagementUsers(threshold: number = 80): UserEngagement[] {
    return Array.from(this.userEngagement.values())
      .filter(user => user.engagementScore >= threshold)
      .sort((a, b) => b.engagementScore - a.engagementScore);
  }

  /**
   * Get engagement trends over time
   */
  public getEngagementTrends(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Array<{
    date: Date;
    sent: number;
    delivered: number;
    clicked: number;
    dismissed: number;
    ctr: number;
  }> {
    const events = Array.from(this.events.values())
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate);

    const groupedData = this.groupEventsByTime(events, granularity);
    
    return groupedData.map(group => {
      const sent = group.events.filter(e => e.action === 'sent').length;
      const delivered = group.events.filter(e => e.action === 'delivered').length;
      const clicked = group.events.filter(e => e.action === 'clicked').length;
      const dismissed = group.events.filter(e => e.action === 'dismissed').length;
      
      return {
        date: group.date,
        sent,
        delivered,
        clicked,
        dismissed,
        ctr: delivered > 0 ? (clicked / delivered) * 100 : 0,
      };
    });
  }

  /**
   * Get best sending times based on user engagement
   */
  public getBestSendingTimes(userId?: string): Array<{
    hour: number;
    day: string;
    clickRate: number;
    volume: number;
  }> {
    const events = userId ?
      Array.from(this.events.values()).filter(e => e.userId === userId) :
      Array.from(this.events.values());

    const timeSlots = new Map<string, { clicks: number; total: number }>();

    for (const event of events) {
      if (event.action === 'delivered' || event.action === 'clicked') {
        const hour = event.timestamp.getHours();
        const day = event.timestamp.toLocaleDateString('en-US', { weekday: 'long' });
        const key = `${day}-${hour}`;

        if (!timeSlots.has(key)) {
          timeSlots.set(key, { clicks: 0, total: 0 });
        }

        const slot = timeSlots.get(key)!;
        slot.total++;
        
        if (event.action === 'clicked') {
          slot.clicks++;
        }
      }
    }

    return Array.from(timeSlots.entries())
      .map(([key, data]) => {
        const [day, hourStr] = key.split('-');
        return {
          hour: parseInt(hourStr),
          day,
          clickRate: data.total > 0 ? (data.clicks / data.total) * 100 : 0,
          volume: data.total,
        };
      })
      .filter(slot => slot.volume >= 5) // Minimum volume threshold
      .sort((a, b) => b.clickRate - a.clickRate);
  }

  /**
   * Generate A/B test report
   */
  public getABTestResults(
    variantA: string,
    variantB: string,
    startDate: Date,
    endDate: Date
  ): {
    variantA: { templateId: string; metrics: NotificationMetrics };
    variantB: { templateId: string; metrics: NotificationMetrics };
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    significanceLevel: number;
  } {
    const eventsA = this.getTemplateEvents(variantA, startDate, endDate);
    const eventsB = this.getTemplateEvents(variantB, startDate, endDate);

    const metricsA = this.calculateMetrics(eventsA);
    const metricsB = this.calculateMetrics(eventsB);

    // Simple significance test (in real implementation, use proper statistical tests)
    const ctrDifference = Math.abs(metricsA.clickThroughRate - metricsB.clickThroughRate);
    const minVolume = Math.min(metricsA.totalDelivered, metricsB.totalDelivered);
    
    let winner: 'A' | 'B' | 'tie' = 'tie';
    let confidence = 0;
    
    if (minVolume >= 100 && ctrDifference >= 1) { // Minimum volume and difference
      winner = metricsA.clickThroughRate > metricsB.clickThroughRate ? 'A' : 'B';
      confidence = Math.min(95, ctrDifference * 10); // Simplified confidence calculation
    }

    return {
      variantA: { templateId: variantA, metrics: metricsA },
      variantB: { templateId: variantB, metrics: metricsB },
      winner,
      confidence,
      significanceLevel: 95,
    };
  }

  /**
   * Get personalization insights for a user
   */
  public getPersonalizationInsights(userId: string): {
    preferredCategories: string[];
    optimalSendTime: { hour: number; confidence: number };
    devicePreference: string;
    engagementPattern: 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    const userEvents = Array.from(this.events.values())
      .filter(event => event.userId === userId);

    const engagement = this.getUserEngagement(userId);
    
    // Analyze category preferences
    const categoryEngagement = new Map<string, { clicks: number; total: number }>();
    
    for (const event of userEvents) {
      const category = event.metadata?.category;
      if (category && (event.action === 'delivered' || event.action === 'clicked')) {
        if (!categoryEngagement.has(category)) {
          categoryEngagement.set(category, { clicks: 0, total: 0 });
        }
        
        const stats = categoryEngagement.get(category)!;
        stats.total++;
        
        if (event.action === 'clicked') {
          stats.clicks++;
        }
      }
    }

    const preferredCategories = Array.from(categoryEngagement.entries())
      .map(([category, stats]) => ({
        category,
        ctr: stats.total > 0 ? stats.clicks / stats.total : 0,
      }))
      .filter(item => item.ctr > 0.1) // 10% CTR threshold
      .sort((a, b) => b.ctr - a.ctr)
      .map(item => item.category);

    // Analyze optimal send time
    const timeSlots = this.getBestSendingTimes(userId);
    const optimalTime = timeSlots[0] || { hour: 14, clickRate: 0 };

    // Analyze device preference
    const platforms = new Map<string, number>();
    userEvents.forEach(event => {
      const platform = event.metadata?.platform || 'unknown';
      platforms.set(platform, (platforms.get(platform) || 0) + 1);
    });
    
    const devicePreference = Array.from(platforms.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Determine engagement pattern
    const engagementScore = engagement?.engagementScore || 0;
    const engagementPattern = 
      engagementScore >= 70 ? 'high' :
      engagementScore >= 40 ? 'medium' : 'low';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (engagementPattern === 'low') {
      recommendations.push('Consider reducing notification frequency');
      recommendations.push('Focus on high-value content only');
    }
    
    if (preferredCategories.length > 0) {
      recommendations.push(`Prioritize ${preferredCategories[0]} category content`);
    }
    
    if (optimalTime.clickRate > 20) {
      recommendations.push(`Send notifications around ${optimalTime.hour}:00 for better engagement`);
    }

    return {
      preferredCategories: preferredCategories.slice(0, 3),
      optimalSendTime: {
        hour: optimalTime.hour,
        confidence: Math.min(100, optimalTime.clickRate * 2),
      },
      devicePreference,
      engagementPattern,
      recommendations,
    };
  }

  /**
   * Get real-time dashboard metrics
   */
  public getDashboardMetrics(): {
    last24Hours: NotificationMetrics;
    last7Days: NotificationMetrics;
    last30Days: NotificationMetrics;
    topPerformingTemplates: Array<{
      templateId: string;
      name: string;
      ctr: number;
      volume: number;
    }>;
    recentActivity: Array<{
      timestamp: Date;
      action: string;
      count: number;
    }>;
  } {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const events24h = Array.from(this.events.values()).filter(e => e.timestamp >= last24h);
    const events7d = Array.from(this.events.values()).filter(e => e.timestamp >= last7d);
    const events30d = Array.from(this.events.values()).filter(e => e.timestamp >= last30d);

    const topTemplates = Array.from(this.templatePerformance.values())
      .map(template => ({
        templateId: template.templateId,
        name: template.templateName,
        ctr: template.metrics.clickThroughRate,
        volume: template.metrics.totalDelivered,
      }))
      .filter(template => template.volume >= 10)
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5);

    // Recent activity (last 24 hours, grouped by hour)
    const recentActivity = this.groupEventsByTime(events24h, 'hour')
      .map(group => ({
        timestamp: group.date,
        action: 'notifications',
        count: group.events.length,
      }))
      .slice(-24); // Last 24 hours

    return {
      last24Hours: this.calculateMetrics(events24h),
      last7Days: this.calculateMetrics(events7d),
      last30Days: this.calculateMetrics(events30d),
      topPerformingTemplates: topTemplates,
      recentActivity,
    };
  }

  /**
   * Calculate metrics from events
   */
  private calculateMetrics(events: NotificationEvent[]): NotificationMetrics {
    const sent = events.filter(e => e.action === 'sent').length;
    const delivered = events.filter(e => e.action === 'delivered').length;
    const clicked = events.filter(e => e.action === 'clicked').length;
    const dismissed = events.filter(e => e.action === 'dismissed').length;

    return {
      totalSent: sent,
      totalDelivered: delivered,
      totalClicked: clicked,
      totalDismissed: dismissed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      clickThroughRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
      dismissalRate: delivered > 0 ? (dismissed / delivered) * 100 : 0,
    };
  }

  /**
   * Update user engagement data
   */
  private async updateUserEngagement(event: NotificationEvent): Promise<void> {
    let engagement = this.userEngagement.get(event.userId);
    
    if (!engagement) {
      engagement = {
        userId: event.userId,
        totalReceived: 0,
        totalClicked: 0,
        totalDismissed: 0,
        preferredCategories: [],
        optimalSendTime: '14:00',
        engagementScore: 50,
        lastInteraction: event.timestamp,
      };
    }

    // Update counts
    if (event.action === 'delivered') {
      engagement.totalReceived++;
    } else if (event.action === 'clicked') {
      engagement.totalClicked++;
    } else if (event.action === 'dismissed') {
      engagement.totalDismissed++;
    }

    // Update engagement score (0-100)
    const totalInteractions = engagement.totalClicked + engagement.totalDismissed;
    if (totalInteractions > 0) {
      engagement.engagementScore = Math.round(
        (engagement.totalClicked / totalInteractions) * 100
      );
    }

    engagement.lastInteraction = event.timestamp;
    this.userEngagement.set(event.userId, engagement);
  }

  /**
   * Update template performance data
   */
  private async updateTemplatePerformance(event: NotificationEvent): Promise<void> {
    const templateId = event.metadata!.templateId!;
    let performance = this.templatePerformance.get(templateId);
    
    if (!performance) {
      performance = {
        templateId,
        templateName: `Template ${templateId}`,
        category: event.metadata?.category || 'unknown',
        metrics: {
          totalSent: 0,
          totalDelivered: 0,
          totalClicked: 0,
          totalDismissed: 0,
          deliveryRate: 0,
          clickThroughRate: 0,
          dismissalRate: 0,
        },
        lastUsed: event.timestamp,
        averageEngagementTime: 0,
        topActions: [],
      };
    }

    // Update metrics
    if (event.action === 'sent') performance.metrics.totalSent++;
    if (event.action === 'delivered') performance.metrics.totalDelivered++;
    if (event.action === 'clicked') performance.metrics.totalClicked++;
    if (event.action === 'dismissed') performance.metrics.totalDismissed++;

    // Recalculate rates
    const { totalSent, totalDelivered, totalClicked, totalDismissed } = performance.metrics;
    
    performance.metrics.deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    performance.metrics.clickThroughRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    performance.metrics.dismissalRate = totalDelivered > 0 ? (totalDismissed / totalDelivered) * 100 : 0;
    
    performance.lastUsed = event.timestamp;
    
    this.templatePerformance.set(templateId, performance);
  }

  /**
   * Group events by time period
   */
  private groupEventsByTime(
    events: NotificationEvent[],
    granularity: 'hour' | 'day' | 'week'
  ): Array<{ date: Date; events: NotificationEvent[] }> {
    const groups = new Map<string, NotificationEvent[]>();

    for (const event of events) {
      let key: string;
      
      switch (granularity) {
        case 'hour':
          key = event.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          key = event.timestamp.toISOString().substring(0, 10); // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(event.timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().substring(0, 10);
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(event);
    }

    return Array.from(groups.entries())
      .map(([key, events]) => ({
        date: new Date(key),
        events,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get template events in date range
   */
  private getTemplateEvents(
    templateId: string,
    startDate: Date,
    endDate: Date
  ): NotificationEvent[] {
    return Array.from(this.events.values()).filter(event =>
      event.metadata?.templateId === templateId &&
      event.timestamp >= startDate &&
      event.timestamp <= endDate
    );
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save event to database (mock implementation)
   */
  private async saveEventToDatabase(event: NotificationEvent): Promise<void> {
    // This would save to your analytics database
    console.log('Saving event to analytics database:', event.id, event.action);
  }

  /**
   * Export analytics data for external tools
   */
  public exportAnalyticsData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): string {
    const events = Array.from(this.events.values())
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate);

    if (format === 'csv') {
      const headers = [
        'eventId', 'notificationId', 'userId', 'action', 'actionId',
        'timestamp', 'templateId', 'category', 'platform'
      ];
      
      const rows = events.map(event => [
        event.id,
        event.notificationId,
        event.userId,
        event.action,
        event.actionId || '',
        event.timestamp.toISOString(),
        event.metadata?.templateId || '',
        event.metadata?.category || '',
        event.metadata?.platform || ''
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(events, null, 2);
  }
}

// Export singleton instance
export const notificationAnalytics = new NotificationAnalyticsService();
export default notificationAnalytics; 