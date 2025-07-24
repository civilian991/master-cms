'use client';

import {
  ErrorTrackingConfig,
  ErrorEvent,
  ExceptionDetails,
  UserContext,
  RequestContext,
  Breadcrumb,
  ErrorAlertRule,
  AlertChannel,
  AlertSeverity,
  ErrorFilter,
} from '../types/performance.types';

class ErrorTrackingService {
  private config: ErrorTrackingConfig;
  private events: ErrorEvent[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private userContext: UserContext | null = null;
  private isInitialized = false;
  private alertRules: ErrorAlertRule[] = [];
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, Date> = new Map();

  constructor(config?: Partial<ErrorTrackingConfig>) {
    this.config = {
      provider: 'custom',
      dsn: '',
      environment: process.env.NODE_ENV || 'development',
      release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      sampling: {
        errorSampleRate: 1.0,
        transactionSampleRate: 0.1,
        profilesSampleRate: 0.1,
        sessionReplay: false,
        performanceMonitoring: true,
      },
      filtering: {
        ignoreErrors: [
          'Network Error',
          'Script error',
          'ResizeObserver loop limit exceeded',
          'ChunkLoadError',
        ],
        ignoreUrls: [
          '/health',
          '/metrics',
          '/_next/static',
        ],
        allowUrls: [],
      },
      alerting: {
        enabled: true,
        channels: ['email'],
        rules: [],
        escalation: {
          levels: [
            { level: 1, channels: ['email'], delay: 0 },
            { level: 2, channels: ['slack'], delay: 15 },
          ],
          timeout: 30,
          maxEscalations: 2,
        },
        throttling: {
          enabled: true,
          cooldown: 300,
          maxAlerts: 10,
          timeWindow: 3600,
        },
      },
      integration: {
        github: { enabled: false, repository: '', token: '', autoCreateIssues: false, labels: [] },
        jira: { enabled: false, server: '', project: '', credentials: { type: 'basic' }, issueType: 'Bug' },
        slack: { enabled: false, webhook: '', channel: '', username: 'ErrorBot', icon: '🚨' },
        webhook: { enabled: false, url: '', method: 'POST', headers: {} },
      },
      ...config,
    };

    this.setupDefaultAlertRules();
    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    console.log('🚀 Error tracking initialized');

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Set up unhandled promise rejection handler
    this.setupPromiseRejectionHandler();

    // Set up performance monitoring
    if (this.config.sampling.performanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    // Set up automatic breadcrumb collection
    this.setupAutomaticBreadcrumbs();

    // Set up user context detection
    this.setupUserContextDetection();

    this.isInitialized = true;
  }

  private setupGlobalErrorHandlers(): void {
    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      const error = event.error;
      const filename = event.filename || 'unknown';
      const lineno = event.lineno || 0;
      const colno = event.colno || 0;

      if (this.shouldIgnoreError(event.message, filename)) return;

      const errorEvent: ErrorEvent = {
        id: this.generateId(),
        timestamp: new Date(),
        level: 'error',
        message: event.message,
        exception: {
          type: error?.constructor?.name || 'Error',
          value: event.message,
          stacktrace: this.parseStackTrace(error?.stack || ''),
          mechanism: {
            type: 'onerror',
            handled: false,
          },
        },
        user: this.userContext || this.getDefaultUserContext(),
        request: this.getCurrentRequestContext(),
        breadcrumbs: [...this.breadcrumbs],
        tags: {
          environment: this.config.environment,
          release: this.config.release,
        },
        extra: {
          filename,
          lineno,
          colno,
          userAgent: navigator.userAgent,
        },
        fingerprint: [event.message, filename],
        groupingHash: this.calculateGroupingHash(event.message, filename),
      };

      this.captureError(errorEvent);
    });

    // Unhandled promise rejection handler is set up separately
  }

  private setupPromiseRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      let stack = '';

      if (reason instanceof Error) {
        message = reason.message;
        stack = reason.stack || '';
      } else if (typeof reason === 'string') {
        message = reason;
      } else {
        message = JSON.stringify(reason);
      }

      if (this.shouldIgnoreError(message)) return;

      const errorEvent: ErrorEvent = {
        id: this.generateId(),
        timestamp: new Date(),
        level: 'error',
        message,
        exception: {
          type: reason instanceof Error ? reason.constructor.name : 'UnhandledRejection',
          value: message,
          stacktrace: this.parseStackTrace(stack),
          mechanism: {
            type: 'onunhandledrejection',
            handled: false,
          },
        },
        user: this.userContext || this.getDefaultUserContext(),
        request: this.getCurrentRequestContext(),
        breadcrumbs: [...this.breadcrumbs],
        tags: {
          environment: this.config.environment,
          release: this.config.release,
          type: 'promise_rejection',
        },
        extra: {
          reason: typeof reason === 'object' ? JSON.stringify(reason) : reason,
          userAgent: navigator.userAgent,
        },
        fingerprint: [message, 'promise_rejection'],
        groupingHash: this.calculateGroupingHash(message, 'promise_rejection'),
      };

      this.captureError(errorEvent);
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.addBreadcrumb({
                timestamp: new Date(),
                type: 'navigation',
                category: 'performance',
                message: 'Long task detected',
                level: 'warning',
                data: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  attribution: entry.attribution?.[0]?.name || 'unknown',
                },
              });
            }
          });
        });

        observer.observe({ type: 'longtask', buffered: true });
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }

    // Monitor resource load errors
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== window) {
        this.addBreadcrumb({
          timestamp: new Date(),
          type: 'error',
          category: 'resource',
          message: 'Resource load failed',
          level: 'error',
          data: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
          },
        });
      }
    }, true);
  }

  private setupAutomaticBreadcrumbs(): void {
    // Navigation breadcrumbs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      this.addBreadcrumb({
        timestamp: new Date(),
        type: 'navigation',
        category: 'navigation',
        message: 'Page navigation',
        level: 'info',
        data: { to: args[2] },
      });
      return originalPushState.apply(history, args);
    }.bind(this);

    history.replaceState = function(...args) {
      this.addBreadcrumb({
        timestamp: new Date(),
        type: 'navigation',
        category: 'navigation',
        message: 'Page replace',
        level: 'info',
        data: { to: args[2] },
      });
      return originalReplaceState.apply(history, args);
    }.bind(this);

    // Click breadcrumbs
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.addBreadcrumb({
          timestamp: new Date(),
          type: 'user',
          category: 'ui.click',
          message: 'User clicked element',
          level: 'info',
          data: {
            tagName: target.tagName,
            className: target.className,
            id: target.id,
            textContent: target.textContent?.substring(0, 50),
          },
        });
      }
    });

    // Console breadcrumbs
    this.instrumentConsole();
  }

  private instrumentConsole(): void {
    const originalConsole = { ...console };
    const levels: (keyof Console)[] = ['log', 'warn', 'error', 'info', 'debug'];

    levels.forEach(level => {
      console[level] = (...args: any[]) => {
        this.addBreadcrumb({
          timestamp: new Date(),
          type: 'debug',
          category: 'console',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '),
          level: level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info',
          data: { level, args },
        });

        return (originalConsole[level] as any).apply(console, args);
      };
    });
  }

  private setupUserContextDetection(): void {
    // Try to detect user context from common sources
    this.detectUserContext();

    // Listen for context changes
    window.addEventListener('storage', () => {
      this.detectUserContext();
    });
  }

  // ============================================================================
  // ERROR CAPTURE
  // ============================================================================

  captureError(errorEvent: ErrorEvent): void {
    // Apply sampling
    if (Math.random() > this.config.sampling.errorSampleRate) return;

    // Apply filtering
    if (this.shouldIgnoreError(errorEvent.message)) return;

    // Store the error
    this.events.push(errorEvent);

    // Limit stored events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // Update error counts for alerting
    this.updateErrorCounts(errorEvent);

    // Check alert rules
    this.checkAlertRules(errorEvent);

    // Send to external service if configured
    this.sendToExternalService(errorEvent);

    // Log to console in development
    if (this.config.environment === 'development') {
      console.group('🚨 Error Captured');
      console.error('Message:', errorEvent.message);
      console.error('Exception:', errorEvent.exception);
      console.log('Context:', {
        user: errorEvent.user,
        request: errorEvent.request,
        breadcrumbs: errorEvent.breadcrumbs,
      });
      console.groupEnd();
    }
  }

  captureException(error: Error, context?: Partial<ErrorEvent>): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      exception: {
        type: error.constructor.name,
        value: error.message,
        stacktrace: this.parseStackTrace(error.stack || ''),
        mechanism: {
          type: 'manual',
          handled: true,
        },
      },
      user: this.userContext || this.getDefaultUserContext(),
      request: this.getCurrentRequestContext(),
      breadcrumbs: [...this.breadcrumbs],
      tags: {
        environment: this.config.environment,
        release: this.config.release,
        ...context?.tags,
      },
      extra: {
        userAgent: navigator.userAgent,
        ...context?.extra,
      },
      fingerprint: [error.message, error.stack?.split('\n')[1] || ''],
      groupingHash: this.calculateGroupingHash(error.message, error.stack || ''),
      ...context,
    };

    this.captureError(errorEvent);
  }

  captureMessage(message: string, level: AlertSeverity = 'info', context?: Partial<ErrorEvent>): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      exception: {
        type: 'Message',
        value: message,
        stacktrace: [],
        mechanism: {
          type: 'manual',
          handled: true,
        },
      },
      user: this.userContext || this.getDefaultUserContext(),
      request: this.getCurrentRequestContext(),
      breadcrumbs: [...this.breadcrumbs],
      tags: {
        environment: this.config.environment,
        release: this.config.release,
        ...context?.tags,
      },
      extra: {
        userAgent: navigator.userAgent,
        ...context?.extra,
      },
      fingerprint: [message],
      groupingHash: this.calculateGroupingHash(message),
      ...context,
    };

    this.captureError(errorEvent);
  }

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  // ============================================================================
  // USER CONTEXT
  // ============================================================================

  setUserContext(user: UserContext): void {
    this.userContext = user;
  }

  private detectUserContext(): void {
    try {
      // Try to get user info from localStorage/sessionStorage
      const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        this.userContext = {
          id: user.id || 'unknown',
          username: user.username || user.name,
          email: user.email,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
        };
      }
    } catch (error) {
      // Fallback to basic context
      this.userContext = this.getDefaultUserContext();
    }
  }

  private getDefaultUserContext(): UserContext {
    return {
      id: this.getSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error_tracking_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('error_tracking_session_id', sessionId);
    }
    return sessionId;
  }

  private getClientIP(): string {
    // In a real implementation, this would come from the server
    return 'unknown';
  }

  // ============================================================================
  // REQUEST CONTEXT
  // ============================================================================

  private getCurrentRequestContext(): RequestContext {
    return {
      url: window.location.href,
      method: 'GET', // Can't determine method in client-side
      queryString: window.location.search,
      data: {},
      headers: {},
      env: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled.toString(),
      },
    };
  }

  // ============================================================================
  // ALERT SYSTEM
  // ============================================================================

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          type: 'frequency',
          threshold: 10,
          timeWindow: 5, // 5 minutes
        },
        severity: 'critical',
        channels: ['email', 'slack'],
        enabled: true,
      },
      {
        id: 'new_error',
        name: 'New Error Type',
        condition: {
          type: 'new_issue',
          threshold: 1,
          timeWindow: 0,
        },
        severity: 'warning',
        channels: ['email'],
        enabled: true,
      },
      {
        id: 'critical_error',
        name: 'Critical Error',
        condition: {
          type: 'custom',
          threshold: 1,
          timeWindow: 0,
          filter: {
            message: 'critical',
          },
        },
        severity: 'critical',
        channels: ['email', 'slack'],
        enabled: true,
      },
    ];
  }

  private updateErrorCounts(errorEvent: ErrorEvent): void {
    const key = errorEvent.groupingHash;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    this.lastErrors.set(key, errorEvent.timestamp);
  }

  private checkAlertRules(errorEvent: ErrorEvent): void {
    if (!this.config.alerting.enabled) return;

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      const shouldTrigger = this.evaluateAlertCondition(rule, errorEvent);
      if (shouldTrigger) {
        this.triggerAlert(rule, errorEvent);
      }
    });
  }

  private evaluateAlertCondition(rule: ErrorAlertRule, errorEvent: ErrorEvent): boolean {
    const { condition } = rule;

    switch (condition.type) {
      case 'frequency': {
        const now = Date.now();
        const timeWindow = condition.timeWindow * 60 * 1000; // Convert to ms
        const recentErrors = this.events.filter(event => 
          now - event.timestamp.getTime() < timeWindow
        );
        return recentErrors.length >= condition.threshold;
      }

      case 'new_issue': {
        const key = errorEvent.groupingHash;
        return !this.lastErrors.has(key);
      }

      case 'custom': {
        if (condition.filter?.message) {
          return errorEvent.message.toLowerCase().includes(condition.filter.message.toLowerCase());
        }
        return true;
      }

      default:
        return false;
    }
  }

  private async triggerAlert(rule: ErrorAlertRule, errorEvent: ErrorEvent): Promise<void> {
    const alertData = {
      rule,
      event: errorEvent,
      timestamp: new Date(),
      environment: this.config.environment,
    };

    // Check throttling
    if (this.config.alerting.throttling.enabled) {
      const lastAlertKey = `alert_${rule.id}`;
      const lastAlertTime = this.lastErrors.get(lastAlertKey);
      const cooldownMs = this.config.alerting.throttling.cooldown * 1000;
      
      if (lastAlertTime && Date.now() - lastAlertTime.getTime() < cooldownMs) {
        return; // Skip alert due to throttling
      }
      
      this.lastErrors.set(lastAlertKey, new Date());
    }

    // Send alerts to configured channels
    for (const channel of rule.channels) {
      try {
        await this.sendAlert(channel, alertData);
      } catch (error) {
        console.error(`Failed to send alert to ${channel}:`, error);
      }
    }
  }

  private async sendAlert(channel: AlertChannel, alertData: any): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmailAlert(alertData);
        break;
      case 'slack':
        await this.sendSlackAlert(alertData);
        break;
      case 'webhook':
        await this.sendWebhookAlert(alertData);
        break;
      default:
        console.warn(`Unknown alert channel: ${channel}`);
    }
  }

  private async sendEmailAlert(alertData: any): Promise<void> {
    // Implementation would send email via API
    console.log('📧 Email alert sent:', alertData);
  }

  private async sendSlackAlert(alertData: any): Promise<void> {
    if (!this.config.integration.slack.enabled || !this.config.integration.slack.webhook) {
      return;
    }

    const message = {
      channel: this.config.integration.slack.channel,
      username: this.config.integration.slack.username,
      icon_emoji: this.config.integration.slack.icon,
      text: `🚨 ${alertData.rule.name}`,
      attachments: [
        {
          color: alertData.rule.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            {
              title: 'Error Message',
              value: alertData.event.message,
              short: false,
            },
            {
              title: 'Environment',
              value: alertData.environment,
              short: true,
            },
            {
              title: 'User',
              value: alertData.event.user.username || alertData.event.user.id,
              short: true,
            },
          ],
          ts: Math.floor(alertData.timestamp.getTime() / 1000),
        },
      ],
    };

    try {
      await fetch(this.config.integration.slack.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private async sendWebhookAlert(alertData: any): Promise<void> {
    if (!this.config.integration.webhook.enabled || !this.config.integration.webhook.url) {
      return;
    }

    try {
      await fetch(this.config.integration.webhook.url, {
        method: this.config.integration.webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.integration.webhook.headers,
        },
        body: JSON.stringify(alertData),
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  // ============================================================================
  // EXTERNAL SERVICES
  // ============================================================================

  private async sendToExternalService(errorEvent: ErrorEvent): Promise<void> {
    if (!this.config.dsn) return;

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorEvent),
      });
    } catch (error) {
      console.warn('Failed to send error to external service:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private shouldIgnoreError(message: string, filename?: string): boolean {
    // Check ignore patterns
    const shouldIgnoreMessage = this.config.filtering.ignoreErrors.some(pattern =>
      message.includes(pattern)
    );

    const shouldIgnoreUrl = filename && this.config.filtering.ignoreUrls.some(pattern =>
      filename.includes(pattern)
    );

    // Check allow patterns (if specified, only allow these)
    const shouldAllowUrl = this.config.filtering.allowUrls.length === 0 || 
      (filename && this.config.filtering.allowUrls.some(pattern => filename.includes(pattern)));

    return shouldIgnoreMessage || shouldIgnoreUrl || !shouldAllowUrl;
  }

  private parseStackTrace(stack: string): any[] {
    if (!stack) return [];

    return stack.split('\n')
      .slice(1) // Remove the error message line
      .map(line => {
        const match = line.match(/\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            filename: match[2],
            function: match[1],
            lineno: parseInt(match[3]),
            colno: parseInt(match[4]),
            absPath: match[2],
            contextLine: '',
            preContext: [],
            postContext: [],
            inApp: !match[2].includes('node_modules'),
          };
        }
        return {
          filename: 'unknown',
          function: line.trim(),
          lineno: 0,
          colno: 0,
          absPath: 'unknown',
          contextLine: '',
          preContext: [],
          postContext: [],
          inApp: true,
        };
      })
      .filter(frame => frame.function !== '');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private calculateGroupingHash(message: string, additional?: string): string {
    const content = additional ? `${message}:${additional}` : message;
    // Simple hash function - in production, use a proper hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getEvents(filter?: ErrorFilter): ErrorEvent[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.environment?.length) {
        filteredEvents = filteredEvents.filter(event =>
          filter.environment!.includes(event.tags.environment || '')
        );
      }

      if (filter.release?.length) {
        filteredEvents = filteredEvents.filter(event =>
          filter.release!.includes(event.tags.release || '')
        );
      }

      if (filter.user?.length) {
        filteredEvents = filteredEvents.filter(event =>
          filter.user!.includes(event.user.id || '')
        );
      }

      if (filter.message) {
        filteredEvents = filteredEvents.filter(event =>
          event.message.toLowerCase().includes(filter.message!.toLowerCase())
        );
      }
    }

    return filteredEvents;
  }

  getErrorStats(): {
    total: number;
    byLevel: Record<AlertSeverity, number>;
    byType: Record<string, number>;
    recentTrend: number[];
  } {
    const events = this.events;
    const byLevel: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
      fatal: 0,
    };
    const byType: Record<string, number> = {};

    events.forEach(event => {
      byLevel[event.level]++;
      const type = event.exception.type;
      byType[type] = (byType[type] || 0) + 1;
    });

    // Calculate recent trend (last 24 hours by hour)
    const now = Date.now();
    const recentTrend: number[] = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;
      const count = events.filter(event =>
        event.timestamp.getTime() >= hourStart && event.timestamp.getTime() < hourEnd
      ).length;
      recentTrend.push(count);
    }

    return {
      total: events.length,
      byLevel,
      byType,
      recentTrend,
    };
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  getUserContext(): UserContext | null {
    return this.userContext;
  }

  getConfig(): ErrorTrackingConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  addAlertRule(rule: ErrorAlertRule): void {
    this.alertRules.push(rule);
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  getAlertRules(): ErrorAlertRule[] {
    return [...this.alertRules];
  }

  clearEvents(): void {
    this.events = [];
    this.errorCounts.clear();
    this.lastErrors.clear();
  }

  exportData(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      events: this.events,
      breadcrumbs: this.breadcrumbs,
      userContext: this.userContext,
      stats: this.getErrorStats(),
      config: this.config,
    }, null, 2);
  }

  // Test method for development
  testError(): void {
    if (this.config.environment === 'development') {
      this.captureException(new Error('Test error from ErrorTracker'));
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTrackingService();
export default errorTracker; 