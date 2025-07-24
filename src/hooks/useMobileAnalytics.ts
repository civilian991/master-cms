/**
 * Mobile Analytics Hook
 * React hook for easy mobile analytics integration and tracking
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { 
  mobileAnalyticsService, 
  MobileAnalyticsEvent, 
  ConversionEvent,
  PWAMetrics,
  UserEngagement,
  AnalyticsConfig
} from '@/lib/services/mobile-analytics-service';

export interface UseMobileAnalyticsOptions {
  enabled?: boolean;
  debug?: boolean;
  sampleRate?: number;
  autoTrackPageViews?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScrolls?: boolean;
  trackingId?: string;
}

export interface AnalyticsSummary {
  session: string;
  eventsQueued: number;
  deviceInfo: any;
  engagement: UserEngagement;
  pwaMetrics: PWAMetrics;
}

export interface UseMobileAnalyticsReturn {
  // Core tracking methods
  trackEvent: (
    eventName: string, 
    eventType: MobileAnalyticsEvent['eventType'], 
    properties?: Record<string, any>
  ) => void;
  trackPageView: (path?: string, title?: string) => void;
  trackClick: (element: string, properties?: Record<string, any>) => void;
  trackConversion: (conversion: ConversionEvent) => void;
  trackUserEngagement: (engagement: Partial<UserEngagement>) => void;
  trackPWAMetrics: (metrics: Partial<PWAMetrics>) => void;
  
  // User management
  setUserId: (userId: string) => void;
  clearUserId: () => void;
  
  // Configuration
  updateConfig: (config: Partial<AnalyticsConfig>) => void;
  
  // Data management
  flush: () => Promise<void>;
  getSummary: () => AnalyticsSummary;
  reset: () => void;
  
  // State
  isEnabled: boolean;
  isInitialized: boolean;
  summary: AnalyticsSummary | null;
}

export const useMobileAnalytics = (
  options: UseMobileAnalyticsOptions = {}
): UseMobileAnalyticsReturn => {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const {
    enabled = true,
    debug = false,
    sampleRate = 1.0,
    autoTrackPageViews = true,
    autoTrackClicks = true,
    autoTrackScrolls = true,
    trackingId
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const previousPathname = useRef<string>('');
  const clickTrackingSetup = useRef<boolean>(false);
  const scrollTrackingSetup = useRef<boolean>(false);

  // Initialize analytics service
  useEffect(() => {
    if (!enabled) return;

    const config: Partial<AnalyticsConfig> = {
      enabled,
      debug,
      sampleRate,
      trackingId,
      enableAutoTracking: autoTrackPageViews || autoTrackClicks || autoTrackScrolls
    };

    mobileAnalyticsService.updateConfig(config);
    
    // Set user ID if available
    if (session?.user?.id) {
      mobileAnalyticsService.setUserId(session.user.id);
    }

    setIsInitialized(true);
    updateSummary();

    // Track initial app start
    mobileAnalyticsService.trackEvent('analytics_initialized', 'navigation', {
      auto_track_page_views: autoTrackPageViews,
      auto_track_clicks: autoTrackClicks,
      auto_track_scrolls: autoTrackScrolls,
      user_id: session?.user?.id || null
    });

  }, [enabled, debug, sampleRate, trackingId, session?.user?.id]);

  // Auto-track page views
  useEffect(() => {
    if (!enabled || !autoTrackPageViews || !isInitialized) return;

    if (pathname !== previousPathname.current) {
      trackPageView(pathname, document.title);
      previousPathname.current = pathname;
    }
  }, [pathname, enabled, autoTrackPageViews, isInitialized]);

  // Set up auto click tracking
  useEffect(() => {
    if (!enabled || !autoTrackClicks || !isInitialized || clickTrackingSetup.current) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementType = target.tagName.toLowerCase();
      const elementText = target.textContent?.substring(0, 50) || '';
      const elementId = target.id || '';
      const elementClass = target.className || '';

      trackClick(`${elementType}${elementId ? `#${elementId}` : ''}${elementClass ? `.${elementClass.split(' ')[0]}` : ''}`, {
        element_text: elementText,
        element_type: elementType,
        coordinates: {
          x: event.clientX,
          y: event.clientY
        }
      });
    };

    document.addEventListener('click', handleClick, true);
    clickTrackingSetup.current = true;

    return () => {
      document.removeEventListener('click', handleClick, true);
      clickTrackingSetup.current = false;
    };
  }, [enabled, autoTrackClicks, isInitialized]);

  // Set up auto scroll tracking
  useEffect(() => {
    if (!enabled || !autoTrackScrolls || !isInitialized || scrollTrackingSetup.current) return;

    let maxScrollDepth = 0;
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;

        // Track scroll milestones
        if (scrollDepth >= 25 && scrollDepth < 50) {
          trackEvent('scroll_depth_25', 'engagement', { depth: scrollDepth });
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          trackEvent('scroll_depth_50', 'engagement', { depth: scrollDepth });
        } else if (scrollDepth >= 75 && scrollDepth < 90) {
          trackEvent('scroll_depth_75', 'engagement', { depth: scrollDepth });
        } else if (scrollDepth >= 90) {
          trackEvent('scroll_depth_90', 'engagement', { depth: scrollDepth });
        }
      }
    };

    const throttledScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    scrollTrackingSetup.current = true;

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTrackingSetup.current = false;
    };
  }, [enabled, autoTrackScrolls, isInitialized]);

  // Update summary periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(updateSummary, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Core tracking methods
  const trackEvent = useCallback((
    eventName: string, 
    eventType: MobileAnalyticsEvent['eventType'], 
    properties: Record<string, any> = {}
  ) => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.trackEvent(eventName, eventType, {
      ...properties,
      pathname,
      timestamp: Date.now()
    });

    // Update summary after tracking
    setTimeout(updateSummary, 100);
  }, [enabled, isInitialized, pathname]);

  const trackPageView = useCallback((path?: string, title?: string) => {
    if (!enabled || !isInitialized) return;

    const pagePath = path || pathname;
    const pageTitle = title || document.title;

    trackEvent('page_view', 'navigation', {
      page_path: pagePath,
      page_title: pageTitle,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    });
  }, [enabled, isInitialized, pathname, trackEvent]);

  const trackClick = useCallback((element: string, properties: Record<string, any> = {}) => {
    if (!enabled || !isInitialized) return;

    trackEvent('click', 'interaction', {
      element,
      page_path: pathname,
      ...properties
    });
  }, [enabled, isInitialized, pathname, trackEvent]);

  const trackConversion = useCallback((conversion: ConversionEvent) => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.trackConversion(conversion);
    setTimeout(updateSummary, 100);
  }, [enabled, isInitialized]);

  const trackUserEngagement = useCallback((engagement: Partial<UserEngagement>) => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.trackEngagement(engagement);
    setTimeout(updateSummary, 100);
  }, [enabled, isInitialized]);

  const trackPWAMetrics = useCallback((metrics: Partial<PWAMetrics>) => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.trackPWAMetrics(metrics);
    setTimeout(updateSummary, 100);
  }, [enabled, isInitialized]);

  // User management
  const setUserId = useCallback((userId: string) => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.setUserId(userId);
    updateSummary();
  }, [enabled, isInitialized]);

  const clearUserId = useCallback(() => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.setUserId('');
    updateSummary();
  }, [enabled, isInitialized]);

  // Configuration
  const updateConfig = useCallback((config: Partial<AnalyticsConfig>) => {
    mobileAnalyticsService.updateConfig(config);
  }, []);

  // Data management
  const flush = useCallback(async () => {
    if (!enabled || !isInitialized) return;

    await mobileAnalyticsService.flush();
    updateSummary();
  }, [enabled, isInitialized]);

  const getSummary = useCallback(() => {
    return mobileAnalyticsService.getAnalyticsSummary();
  }, []);

  const reset = useCallback(() => {
    if (!enabled || !isInitialized) return;

    mobileAnalyticsService.reset();
    updateSummary();
  }, [enabled, isInitialized]);

  // Update summary helper
  const updateSummary = useCallback(() => {
    if (!isInitialized) return;

    const newSummary = mobileAnalyticsService.getAnalyticsSummary();
    setSummary(newSummary);
  }, [isInitialized]);

  return {
    // Core tracking methods
    trackEvent,
    trackPageView,
    trackClick,
    trackConversion,
    trackUserEngagement,
    trackPWAMetrics,
    
    // User management
    setUserId,
    clearUserId,
    
    // Configuration
    updateConfig,
    
    // Data management
    flush,
    getSummary,
    reset,
    
    // State
    isEnabled: enabled,
    isInitialized,
    summary
  };
};

// Hook for tracking specific user interactions
export interface UseInteractionTrackingOptions {
  trackClicks?: boolean;
  trackForms?: boolean;
  trackScrolls?: boolean;
  trackKeyboard?: boolean;
  debounceMs?: number;
}

export const useInteractionTracking = (
  elementRef: React.RefObject<HTMLElement>,
  options: UseInteractionTrackingOptions = {}
) => {
  const { trackEvent } = useMobileAnalytics();
  
  const {
    trackClicks = true,
    trackForms = true,
    trackScrolls = false,
    trackKeyboard = false,
    debounceMs = 100
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handlers: Array<{ event: string; handler: EventListener }> = [];

    // Click tracking
    if (trackClicks) {
      const clickHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        trackEvent('element_click', 'interaction', {
          element_tag: target.tagName.toLowerCase(),
          element_id: target.id || null,
          element_class: target.className || null,
          element_text: target.textContent?.substring(0, 50) || null
        });
      };
      element.addEventListener('click', clickHandler);
      handlers.push({ event: 'click', handler: clickHandler });
    }

    // Form tracking
    if (trackForms) {
      const submitHandler = (event: Event) => {
        const form = event.target as HTMLFormElement;
        trackEvent('form_submit', 'interaction', {
          form_id: form.id || null,
          form_action: form.action || null,
          form_method: form.method || null
        });
      };
      element.addEventListener('submit', submitHandler);
      handlers.push({ event: 'submit', handler: submitHandler });
    }

    // Scroll tracking
    if (trackScrolls) {
      let scrollTimer: NodeJS.Timeout;
      const scrollHandler = () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          trackEvent('element_scroll', 'interaction', {
            scroll_top: element.scrollTop,
            scroll_height: element.scrollHeight,
            client_height: element.clientHeight
          });
        }, debounceMs);
      };
      element.addEventListener('scroll', scrollHandler, { passive: true });
      handlers.push({ event: 'scroll', handler: scrollHandler });
    }

    // Keyboard tracking
    if (trackKeyboard) {
      const keyHandler = (event: KeyboardEvent) => {
        trackEvent('keyboard_interaction', 'interaction', {
          key: event.key,
          code: event.code,
          ctrl: event.ctrlKey,
          alt: event.altKey,
          shift: event.shiftKey,
          meta: event.metaKey
        });
      };
      element.addEventListener('keydown', keyHandler);
      handlers.push({ event: 'keydown', handler: keyHandler });
    }

    // Cleanup
    return () => {
      handlers.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    };
  }, [elementRef, trackClicks, trackForms, trackScrolls, trackKeyboard, debounceMs, trackEvent]);
};

// Hook for tracking performance metrics
export const usePerformanceTracking = () => {
  const { trackEvent } = useMobileAnalytics();

  const trackPageLoad = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        trackEvent('page_load_performance', 'performance', {
          load_time: navigation.loadEventEnd - navigation.navigationStart,
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          first_byte: navigation.responseStart - navigation.requestStart,
          dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp_connect: navigation.connectEnd - navigation.connectStart
        });
      }
    });
  }, [trackEvent]);

  const trackResourceLoad = useCallback((resourceName: string, loadTime: number) => {
    trackEvent('resource_load', 'performance', {
      resource_name: resourceName,
      load_time: loadTime
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent('javascript_error', 'error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500) || null,
      error_context: context || null
    });
  }, [trackEvent]);

  useEffect(() => {
    trackPageLoad();

    // Global error handler
    const errorHandler = (event: ErrorEvent) => {
      trackError(event.error, 'global_error_handler');
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      trackError(new Error(event.reason), 'unhandled_promise_rejection');
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, [trackPageLoad, trackError]);

  return {
    trackPageLoad,
    trackResourceLoad,
    trackError
  };
};

// Hook for e-commerce tracking
export const useEcommerceTracking = () => {
  const { trackConversion, trackEvent } = useMobileAnalytics();

  const trackPurchase = useCallback((transactionId: string, value: number, currency: string, items: any[]) => {
    trackConversion({
      eventName: 'purchase',
      value,
      currency,
      items
    });

    trackEvent('ecommerce_purchase', 'conversion', {
      transaction_id: transactionId,
      value,
      currency,
      item_count: items.length
    });
  }, [trackConversion, trackEvent]);

  const trackAddToCart = useCallback((itemId: string, itemName: string, value: number) => {
    trackEvent('add_to_cart', 'interaction', {
      item_id: itemId,
      item_name: itemName,
      value
    });
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((itemId: string, itemName: string) => {
    trackEvent('remove_from_cart', 'interaction', {
      item_id: itemId,
      item_name: itemName
    });
  }, [trackEvent]);

  const trackBeginCheckout = useCallback((value: number, currency: string) => {
    trackEvent('begin_checkout', 'conversion', {
      value,
      currency
    });
  }, [trackEvent]);

  return {
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout
  };
}; 