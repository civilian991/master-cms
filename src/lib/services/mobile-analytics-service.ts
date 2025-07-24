/**
 * Mobile Analytics Service
 * Comprehensive mobile-specific analytics, performance monitoring, and user behavior tracking
 */

export interface MobileAnalyticsEvent {
  eventName: string;
  eventType: 'interaction' | 'navigation' | 'performance' | 'error' | 'conversion' | 'engagement';
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  pageInfo: PageInfo;
  properties: Record<string, any>;
  metrics?: PerformanceMetrics;
}

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  operatingSystem: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  connectionType?: string;
  memoryGB?: number;
}

export interface PageInfo {
  path: string;
  title: string;
  referrer: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  loadTime: number;
  isFirstVisit: boolean;
}

export interface TouchInteraction {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'scroll' | 'drag';
  element: string;
  elementType: string;
  coordinates: { x: number; y: number };
  duration: number;
  force?: number;
  velocity?: number;
  direction?: string;
  distance?: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Mobile-specific metrics
  battery?: number;
  memory?: number;
  connection?: string;
  renderTime?: number;
  frameRate?: number;
  
  // Navigation metrics
  pageLoadTime: number;
  domContentLoaded: number;
  firstInteraction?: number;
  scrollDepth: number;
  timeOnPage: number;
}

export interface UserEngagement {
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  scrollDepth: number;
  bounceRate: number;
  retentionRate: number;
  conversionEvents: string[];
}

export interface PWAMetrics {
  isInstalled: boolean;
  installPromptShown: boolean;
  installAccepted: boolean;
  offlineUsage: number;
  cacheHitRate: number;
  updatePromptShown: boolean;
  notificationPermission: string;
  shareUsage: number;
}

export interface ConversionEvent {
  eventName: string;
  value?: number;
  currency?: string;
  items?: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
  funnel?: string;
  step?: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  sampleRate: number;
  trackingId?: string;
  debug: boolean;
  enableAutoTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableConversionTracking: boolean;
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
}

export class MobileAnalyticsService {
  private static instance: MobileAnalyticsService;
  private config: AnalyticsConfig;
  private sessionId: string;
  private userId?: string;
  private deviceInfo: DeviceInfo;
  private eventQueue: MobileAnalyticsEvent[] = [];
  private performanceObserver?: PerformanceObserver;
  private touchInteractions: TouchInteraction[] = [];
  private pageStartTime: number = Date.now();
  private currentPageInfo: PageInfo;
  private engagementMetrics: UserEngagement;
  private pwaMetrics: PWAMetrics;
  private conversionFunnel: string[] = [];
  private isOnline: boolean = navigator.onLine;

  public static getInstance(): MobileAnalyticsService {
    if (!MobileAnalyticsService.instance) {
      MobileAnalyticsService.instance = new MobileAnalyticsService();
    }
    return MobileAnalyticsService.instance;
  }

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      debug: false,
      enableAutoTracking: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableConversionTracking: true,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      retentionDays: 30
    };

    this.deviceInfo = this.collectDeviceInfo();
    this.currentPageInfo = this.collectPageInfo();
    this.engagementMetrics = this.initializeEngagementMetrics();
    this.pwaMetrics = this.initializePWAMetrics();

    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  /**
   * Initialize all tracking mechanisms
   */
  private initializeTracking(): void {
    if (!this.config.enabled) return;

    this.setupPerformanceTracking();
    this.setupInteractionTracking();
    this.setupNavigationTracking();
    this.setupErrorTracking();
    this.setupNetworkTracking();
    this.setupVisibilityTracking();
    this.startFlushTimer();

    // Track initial page load
    this.trackEvent('page_view', 'navigation', {
      initial_load: true,
      user_agent: navigator.userAgent
    });
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceTracking(): void {
    if (!this.config.enablePerformanceTracking) return;

    // Core Web Vitals tracking
    this.trackWebVitals();

    // Custom performance metrics
    this.trackCustomMetrics();

    // Frame rate monitoring
    this.monitorFrameRate();

    // Memory usage tracking
    this.trackMemoryUsage();
  }

  /**
   * Track Web Vitals metrics
   */
  private trackWebVitals(): void {
    // LCP tracking
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.trackEvent('web_vital_lcp', 'performance', {
          value: lastEntry.startTime,
          element: (lastEntry as any).element?.tagName || 'unknown'
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP tracking not supported:', e);
      }

      // FID tracking
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackEvent('web_vital_fid', 'performance', {
            value: entry.processingStart - entry.startTime,
            event_type: (entry as any).name
          });
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID tracking not supported:', e);
      }

      // CLS tracking
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });

        this.trackEvent('web_vital_cls', 'performance', {
          value: clsValue
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS tracking not supported:', e);
      }
    }
  }

  /**
   * Track custom performance metrics
   */
  private trackCustomMetrics(): void {
    // Page load metrics
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.trackEvent('page_performance', 'performance', {
          dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp_connect: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          page_load_complete: navigation.loadEventEnd - navigation.navigationStart,
          redirect_time: navigation.redirectEnd - navigation.redirectStart
        });
      }
    });

    // Resource loading metrics
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 1000) { // Track slow resources
          this.trackEvent('slow_resource', 'performance', {
            resource_name: entry.name,
            duration: entry.duration,
            size: (entry as any).transferSize || 0,
            type: (entry as any).initiatorType
          });
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource tracking not supported:', e);
    }
  }

  /**
   * Monitor frame rate for smooth animations
   */
  private monitorFrameRate(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;

    const measureFrameRate = (currentTime: number) => {
      frameCount++;
      totalFrameTime += currentTime - lastTime;
      lastTime = currentTime;

      // Report every 60 frames
      if (frameCount >= 60) {
        const avgFrameTime = totalFrameTime / frameCount;
        const fps = 1000 / avgFrameTime;

        this.trackEvent('frame_rate', 'performance', {
          fps: Math.round(fps),
          avg_frame_time: Math.round(avgFrameTime)
        });

        frameCount = 0;
        totalFrameTime = 0;
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Track memory usage
   */
  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      this.trackEvent('memory_usage', 'performance', {
        used_js_heap_size: memory.usedJSHeapSize,
        total_js_heap_size: memory.totalJSHeapSize,
        js_heap_size_limit: memory.jsHeapSizeLimit,
        usage_percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      });
    }
  }

  /**
   * Set up interaction tracking
   */
  private setupInteractionTracking(): void {
    // Touch event tracking
    this.setupTouchTracking();

    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Form interaction tracking
    this.setupFormTracking();

    // Scroll tracking
    this.setupScrollTracking();
  }

  /**
   * Set up touch-specific tracking
   */
  private setupTouchTracking(): void {
    let touchStartTime: number;
    let touchStartPos: { x: number; y: number };
    let touchStartElement: Element | null;

    document.addEventListener('touchstart', (event) => {
      touchStartTime = Date.now();
      const touch = event.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      touchStartElement = event.target as Element;
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (!touchStartElement) return;

      const touchEndTime = Date.now();
      const duration = touchEndTime - touchStartTime;
      const touch = event.changedTouches[0];
      const endPos = { x: touch.clientX, y: touch.clientY };
      
      const distance = Math.sqrt(
        Math.pow(endPos.x - touchStartPos.x, 2) + 
        Math.pow(endPos.y - touchStartPos.y, 2)
      );

      const interaction: TouchInteraction = {
        type: distance < 10 ? 'tap' : 'swipe',
        element: this.getElementSelector(touchStartElement),
        elementType: touchStartElement.tagName.toLowerCase(),
        coordinates: touchStartPos,
        duration,
        distance,
        timestamp: touchStartTime
      };

      this.touchInteractions.push(interaction);
      this.trackTouchInteraction(interaction);
    }, { passive: true });

    // Long press detection
    let longPressTimer: NodeJS.Timeout;
    
    document.addEventListener('touchstart', (event) => {
      longPressTimer = setTimeout(() => {
        const element = event.target as Element;
        const touch = event.touches[0];
        
        const interaction: TouchInteraction = {
          type: 'long-press',
          element: this.getElementSelector(element),
          elementType: element.tagName.toLowerCase(),
          coordinates: { x: touch.clientX, y: touch.clientY },
          duration: 500,
          timestamp: Date.now()
        };

        this.trackTouchInteraction(interaction);
      }, 500);
    });

    document.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    });
  }

  /**
   * Track touch interaction
   */
  private trackTouchInteraction(interaction: TouchInteraction): void {
    this.trackEvent('touch_interaction', 'interaction', {
      touch_type: interaction.type,
      element: interaction.element,
      element_type: interaction.elementType,
      coordinates: interaction.coordinates,
      duration: interaction.duration,
      distance: interaction.distance,
      force: interaction.force,
      velocity: interaction.velocity
    });
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    const element = event.target as Element;
    const rect = element.getBoundingClientRect();
    
    this.trackEvent('click', 'interaction', {
      element: this.getElementSelector(element),
      element_type: element.tagName.toLowerCase(),
      element_text: element.textContent?.substring(0, 100) || '',
      coordinates: {
        x: event.clientX,
        y: event.clientY,
        relative_x: event.clientX - rect.left,
        relative_y: event.clientY - rect.top
      },
      modifier_keys: {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      }
    });
  }

  /**
   * Set up form tracking
   */
  private setupFormTracking(): void {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const fields = Array.from(formData.keys());

      this.trackEvent('form_submit', 'interaction', {
        form_id: form.id || 'unknown',
        form_name: form.name || 'unknown',
        field_count: fields.length,
        fields: fields
      });
    });

    // Track form field interactions
    document.addEventListener('focusin', (event) => {
      const element = event.target as HTMLElement;
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        this.trackEvent('form_field_focus', 'interaction', {
          field_type: (element as HTMLInputElement).type || element.tagName.toLowerCase(),
          field_name: (element as HTMLInputElement).name || 'unknown',
          form_id: (element.closest('form') as HTMLFormElement)?.id || 'unknown'
        });
      }
    });
  }

  /**
   * Set up scroll tracking
   */
  private setupScrollTracking(): void {
    let maxScrollDepth = 0;
    let scrollTimer: NodeJS.Timeout;

    const trackScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.engagementMetrics.scrollDepth = scrollDepth;

        // Track scroll milestones
        if (scrollDepth >= 25 && scrollDepth < 50) {
          this.trackEvent('scroll_depth_25', 'engagement', { depth: scrollDepth });
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          this.trackEvent('scroll_depth_50', 'engagement', { depth: scrollDepth });
        } else if (scrollDepth >= 75 && scrollDepth < 90) {
          this.trackEvent('scroll_depth_75', 'engagement', { depth: scrollDepth });
        } else if (scrollDepth >= 90) {
          this.trackEvent('scroll_depth_90', 'engagement', { depth: scrollDepth });
        }
      }
    };

    window.addEventListener('scroll', () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      scrollTimer = setTimeout(trackScroll, 100);
    }, { passive: true });
  }

  /**
   * Set up navigation tracking
   */
  private setupNavigationTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', 'navigation', {
          time_on_page: Date.now() - this.pageStartTime
        });
      } else {
        this.trackEvent('page_visible', 'navigation', {
          return_time: Date.now()
        });
      }
    });

    // Track beforeunload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', 'navigation', {
        time_on_page: Date.now() - this.pageStartTime,
        scroll_depth: this.engagementMetrics.scrollDepth
      });
      
      this.flush(); // Send any pending analytics
    });
  }

  /**
   * Set up error tracking
   */
  private setupErrorTracking(): void {
    if (!this.config.enableErrorTracking) return;

    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', 'error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString() || 'unknown'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('unhandled_promise_rejection', 'error', {
        reason: event.reason?.toString() || 'unknown'
      });
    });
  }

  /**
   * Set up network tracking
   */
  private setupNetworkTracking(): void {
    // Network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('network_online', 'performance', {
        connection_type: this.getConnectionType()
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('network_offline', 'performance', {});
    });

    // Connection type changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.trackEvent('connection_change', 'performance', {
          connection_type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  /**
   * Set up visibility tracking
   */
  private setupVisibilityTracking(): void {
    let visibilityStartTime = Date.now();

    const handleVisibilityChange = () => {
      const currentTime = Date.now();
      
      if (document.hidden) {
        const visibleTime = currentTime - visibilityStartTime;
        this.trackEvent('tab_hidden', 'engagement', {
          visible_time: visibleTime
        });
      } else {
        visibilityStartTime = currentTime;
        this.trackEvent('tab_visible', 'engagement', {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Track a custom event
   */
  public trackEvent(
    eventName: string, 
    eventType: MobileAnalyticsEvent['eventType'], 
    properties: Record<string, any> = {}
  ): void {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return;
    }

    const event: MobileAnalyticsEvent = {
      eventName,
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      deviceInfo: this.deviceInfo,
      pageInfo: this.currentPageInfo,
      properties,
      metrics: this.getCurrentMetrics()
    };

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('Mobile Analytics Event:', event);
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track conversion events
   */
  public trackConversion(conversionEvent: ConversionEvent): void {
    this.trackEvent('conversion', 'conversion', conversionEvent);
    this.engagementMetrics.conversionEvents.push(conversionEvent.eventName);
  }

  /**
   * Track PWA metrics
   */
  public trackPWAMetrics(metrics: Partial<PWAMetrics>): void {
    this.pwaMetrics = { ...this.pwaMetrics, ...metrics };
    this.trackEvent('pwa_metrics', 'engagement', this.pwaMetrics);
  }

  /**
   * Track user engagement
   */
  public trackEngagement(engagement: Partial<UserEngagement>): void {
    this.engagementMetrics = { ...this.engagementMetrics, ...engagement };
    this.trackEvent('user_engagement', 'engagement', this.engagementMetrics);
  }

  /**
   * Get current performance metrics
   */
  private getCurrentMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      pageLoadTime: Date.now() - this.pageStartTime,
      domContentLoaded: 0,
      scrollDepth: this.engagementMetrics.scrollDepth,
      timeOnPage: Date.now() - this.pageStartTime
    };

    // Add battery info if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        metrics.battery = Math.round(battery.level * 100);
      });
    }

    // Add memory info if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memory = memory.usedJSHeapSize;
    }

    // Add connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      metrics.connection = connection.effectiveType;
    }

    return metrics;
  }

  /**
   * Collect device information
   */
  private collectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    return {
      deviceType: this.getDeviceType(),
      operatingSystem: this.getOperatingSystem(),
      osVersion: this.getOSVersion(),
      browser: this.getBrowser(),
      browserVersion: this.getBrowserVersion(),
      screenWidth: screen.width,
      screenHeight: screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      touchSupport: 'ontouchstart' in window,
      connectionType: this.getConnectionType(),
      memoryGB: this.getMemoryGB()
    };
  }

  /**
   * Collect page information
   */
  private collectPageInfo(): PageInfo {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      utm: {
        source: urlParams.get('utm_source') || undefined,
        medium: urlParams.get('utm_medium') || undefined,
        campaign: urlParams.get('utm_campaign') || undefined,
        term: urlParams.get('utm_term') || undefined,
        content: urlParams.get('utm_content') || undefined
      },
      loadTime: Date.now(),
      isFirstVisit: !localStorage.getItem('analytics_visited')
    };
  }

  /**
   * Initialize engagement metrics
   */
  private initializeEngagementMetrics(): UserEngagement {
    return {
      sessionDuration: 0,
      pageViews: 1,
      interactions: 0,
      scrollDepth: 0,
      bounceRate: 0,
      retentionRate: 0,
      conversionEvents: []
    };
  }

  /**
   * Initialize PWA metrics
   */
  private initializePWAMetrics(): PWAMetrics {
    return {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      installPromptShown: false,
      installAccepted: false,
      offlineUsage: 0,
      cacheHitRate: 0,
      updatePromptShown: false,
      notificationPermission: Notification.permission,
      shareUsage: 0
    };
  }

  /**
   * Utility functions for device detection
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  private getOSVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Android|iPhone OS|Mac OS X|Windows NT)\s([\d._]+)/);
    return match ? match[1].replace(/_/g, '.') : 'Unknown';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Chrome|Safari|Firefox|Edge)\/(\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      return (navigator as any).connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getMemoryGB(): number | undefined {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }
    return undefined;
  }

  /**
   * Get element selector for tracking
   */
  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush events to analytics endpoint
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to analytics endpoint
      await this.sendEvents(events);
      
      if (this.config.debug) {
        console.log(`Flushed ${events.length} analytics events`);
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      
      // Re-queue events if send failed
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Send events to analytics endpoint
   */
  private async sendEvents(events: MobileAnalyticsEvent[]): Promise<void> {
    if (!this.isOnline) {
      // Store offline for later
      this.storeOfflineEvents(events);
      return;
    }

    const payload = {
      events,
      session: {
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now()
      }
    };

    const response = await fetch('/api/analytics/mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  /**
   * Store events offline
   */
  private storeOfflineEvents(events: MobileAnalyticsEvent[]): void {
    try {
      const stored = localStorage.getItem('analytics_offline_events');
      const offlineEvents = stored ? JSON.parse(stored) : [];
      
      offlineEvents.push(...events);
      
      // Limit offline storage
      if (offlineEvents.length > 1000) {
        offlineEvents.splice(0, offlineEvents.length - 1000);
      }
      
      localStorage.setItem('analytics_offline_events', JSON.stringify(offlineEvents));
    } catch (error) {
      console.warn('Failed to store offline analytics events:', error);
    }
  }

  /**
   * Send offline events when back online
   */
  private async sendOfflineEvents(): Promise<void> {
    try {
      const stored = localStorage.getItem('analytics_offline_events');
      if (!stored) return;

      const offlineEvents = JSON.parse(stored);
      if (offlineEvents.length === 0) return;

      await this.sendEvents(offlineEvents);
      localStorage.removeItem('analytics_offline_events');
      
      console.log(`Sent ${offlineEvents.length} offline analytics events`);
    } catch (error) {
      console.error('Failed to send offline analytics events:', error);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    this.trackEvent('user_identified', 'engagement', { user_id: userId });
  }

  /**
   * Get analytics summary
   */
  public getAnalyticsSummary(): {
    session: string;
    eventsQueued: number;
    deviceInfo: DeviceInfo;
    engagement: UserEngagement;
    pwaMetrics: PWAMetrics;
  } {
    return {
      session: this.sessionId,
      eventsQueued: this.eventQueue.length,
      deviceInfo: this.deviceInfo,
      engagement: this.engagementMetrics,
      pwaMetrics: this.pwaMetrics
    };
  }

  /**
   * Reset analytics data
   */
  public reset(): void {
    this.sessionId = this.generateSessionId();
    this.userId = undefined;
    this.eventQueue = [];
    this.touchInteractions = [];
    this.pageStartTime = Date.now();
    this.engagementMetrics = this.initializeEngagementMetrics();
    this.conversionFunnel = [];
  }
}

// Export singleton instance
export const mobileAnalyticsService = MobileAnalyticsService.getInstance(); 