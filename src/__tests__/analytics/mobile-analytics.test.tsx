/**
 * Mobile Analytics System Tests
 * Comprehensive testing for mobile analytics service, components, and hooks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { 
  MobileAnalyticsService, 
  mobileAnalyticsService,
  MobileAnalyticsEvent,
  ConversionEvent
} from '@/lib/services/mobile-analytics-service';
import { 
  AnalyticsProvider,
  AnalyticsDashboard,
  PerformanceMonitor
} from '@/components/analytics/MobileAnalytics';
import { 
  useMobileAnalytics,
  useInteractionTracking,
  usePerformanceTracking,
  useEcommerceTracking
} from '@/hooks/useMobileAnalytics';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  usePathname: () => '/test-page',
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockSession = {
  user: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSession as jest.Mock).mockReturnValue({ data: mockSession });
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true })
  });
  
  // Reset analytics service
  mobileAnalyticsService.reset();
});

describe('MobileAnalyticsService', () => {
  let service: MobileAnalyticsService;

  beforeEach(() => {
    service = MobileAnalyticsService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MobileAnalyticsService.getInstance();
      const instance2 = MobileAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const config = {
        enabled: false,
        debug: true,
        sampleRate: 0.5
      };

      service.updateConfig(config);
      // Configuration is private, so we test through behavior
      service.trackEvent('test_event', 'interaction');
      
      // Should not track events when disabled
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(0);
    });

    it('should respect sample rate', () => {
      // Mock Math.random to return a value that should be excluded
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.9);

      service.updateConfig({ sampleRate: 0.5 });
      service.trackEvent('test_event', 'interaction');
      
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(0);

      Math.random = originalRandom;
    });
  });

  describe('Event Tracking', () => {
    it('should track events', () => {
      service.trackEvent('test_event', 'interaction', { test: 'data' });
      
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });

    it('should queue multiple events', () => {
      service.trackEvent('event_1', 'interaction');
      service.trackEvent('event_2', 'navigation');
      service.trackEvent('event_3', 'performance');
      
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(3);
    });

    it('should include device info in events', () => {
      service.trackEvent('test_event', 'interaction');
      
      const summary = service.getAnalyticsSummary();
      expect(summary.deviceInfo).toBeDefined();
      expect(summary.deviceInfo.deviceType).toBeDefined();
      expect(summary.deviceInfo.operatingSystem).toBeDefined();
    });
  });

  describe('Conversion Tracking', () => {
    it('should track conversion events', () => {
      const conversion: ConversionEvent = {
        eventName: 'purchase',
        value: 100,
        currency: 'USD',
        items: [
          { id: '1', name: 'Product', category: 'Test', quantity: 1, price: 100 }
        ]
      };

      service.trackConversion(conversion);
      
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
      expect(summary.engagement.conversionEvents).toContain('purchase');
    });
  });

  describe('User Management', () => {
    it('should set user ID', () => {
      service.setUserId('user-456');
      service.trackEvent('test_event', 'interaction');
      
      // User ID tracking is internal, verify through event tracking
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(2); // setUserId + trackEvent
    });
  });

  describe('Data Management', () => {
    it('should flush events', async () => {
      service.trackEvent('test_event', 'interaction');
      
      await service.flush();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('test_event')
      });
    });

    it('should reset analytics data', () => {
      service.trackEvent('test_event', 'interaction');
      service.setUserId('user-123');
      
      service.reset();
      
      const summary = service.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(0);
      expect(summary.engagement.conversionEvents).toHaveLength(0);
    });
  });

  describe('Device Detection', () => {
    it('should detect device type', () => {
      const summary = service.getAnalyticsSummary();
      expect(['mobile', 'tablet', 'desktop']).toContain(summary.deviceInfo.deviceType);
    });

    it('should detect touch support', () => {
      const summary = service.getAnalyticsSummary();
      expect(typeof summary.deviceInfo.touchSupport).toBe('boolean');
    });

    it('should collect screen information', () => {
      const summary = service.getAnalyticsSummary();
      expect(summary.deviceInfo.screenWidth).toBeGreaterThan(0);
      expect(summary.deviceInfo.screenHeight).toBeGreaterThan(0);
      expect(summary.deviceInfo.pixelRatio).toBeGreaterThan(0);
    });
  });
});

describe('AnalyticsProvider Component', () => {
  it('should initialize analytics with user ID', () => {
    const TestComponent = () => <div>Test Content</div>;
    
    render(
      <AnalyticsProvider userId="user-123">
        <TestComponent />
      </AnalyticsProvider>
    );

    // Should track analytics initialization
    const summary = mobileAnalyticsService.getAnalyticsSummary();
    expect(summary.eventsQueued).toBeGreaterThan(0);
  });

  it('should update configuration', () => {
    const TestComponent = () => <div>Test Content</div>;
    const config = { debug: true, sampleRate: 0.8 };
    
    render(
      <AnalyticsProvider config={config}>
        <TestComponent />
      </AnalyticsProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should flush events on unmount', () => {
    const TestComponent = () => <div>Test Content</div>;
    const flushSpy = jest.spyOn(mobileAnalyticsService, 'flush');
    
    const { unmount } = render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    unmount();
    
    expect(flushSpy).toHaveBeenCalled();
  });
});

describe('AnalyticsDashboard Component', () => {
  it('should render analytics summary', () => {
    // Add some test data
    mobileAnalyticsService.trackEvent('test_event', 'interaction');
    
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Mobile Analytics')).toBeInTheDocument();
    expect(screen.getByText('Real-time mobile app analytics and insights')).toBeInTheDocument();
  });

  it('should display session information', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Session ID')).toBeInTheDocument();
    expect(screen.getByText('Events Queued')).toBeInTheDocument();
    expect(screen.getByText('Device Type')).toBeInTheDocument();
  });

  it('should handle flush button click', async () => {
    const flushSpy = jest.spyOn(mobileAnalyticsService, 'flush');
    
    render(<AnalyticsDashboard />);
    
    const flushButton = screen.getByText('Flush Events');
    fireEvent.click(flushButton);
    
    await waitFor(() => {
      expect(flushSpy).toHaveBeenCalled();
    });
  });
});

describe('PerformanceMonitor Component', () => {
  beforeEach(() => {
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByType: jest.fn(() => [{
          navigationStart: 1000,
          loadEventEnd: 2000,
          domContentLoadedEventEnd: 1500,
          responseStart: 1200,
          requestStart: 1100
        }]),
        memory: {
          usedJSHeapSize: 10000000
        }
      },
      writable: true
    });
  });

  it('should render performance metrics', () => {
    render(<PerformanceMonitor />);
    
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
    expect(screen.getByText('Page Load')).toBeInTheDocument();
    expect(screen.getByText('DOM Ready')).toBeInTheDocument();
  });

  it('should display connection status', () => {
    render(<PerformanceMonitor />);
    
    expect(screen.getByText('Connection')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show memory usage when available', () => {
    render(<PerformanceMonitor />);
    
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Heap')).toBeInTheDocument();
  });
});

describe('useMobileAnalytics Hook', () => {
  const TestComponent: React.FC<{ options?: any }> = ({ options = {} }) => {
    const {
      trackEvent,
      trackPageView,
      trackClick,
      trackConversion,
      isEnabled,
      isInitialized,
      summary
    } = useMobileAnalytics(options);

    return (
      <div>
        <div data-testid="enabled">{isEnabled.toString()}</div>
        <div data-testid="initialized">{isInitialized.toString()}</div>
        <div data-testid="events-queued">{summary?.eventsQueued || 0}</div>
        <button onClick={() => trackEvent('test_event', 'interaction')}>
          Track Event
        </button>
        <button onClick={() => trackPageView('/test')}>
          Track Page View
        </button>
        <button onClick={() => trackClick('button')}>
          Track Click
        </button>
        <button onClick={() => trackConversion({ eventName: 'purchase', value: 100 })}>
          Track Conversion
        </button>
      </div>
    );
  };

  it('should initialize with default options', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('initialized')).toHaveTextContent('true');
  });

  it('should track events', async () => {
    render(<TestComponent />);
    
    const trackButton = screen.getByText('Track Event');
    fireEvent.click(trackButton);
    
    await waitFor(() => {
      expect(parseInt(screen.getByTestId('events-queued').textContent || '0')).toBeGreaterThan(0);
    });
  });

  it('should track page views', async () => {
    render(<TestComponent />);
    
    const trackButton = screen.getByText('Track Page View');
    fireEvent.click(trackButton);
    
    await waitFor(() => {
      expect(parseInt(screen.getByTestId('events-queued').textContent || '0')).toBeGreaterThan(0);
    });
  });

  it('should track clicks', async () => {
    render(<TestComponent />);
    
    const trackButton = screen.getByText('Track Click');
    fireEvent.click(trackButton);
    
    await waitFor(() => {
      expect(parseInt(screen.getByTestId('events-queued').textContent || '0')).toBeGreaterThan(0);
    });
  });

  it('should track conversions', async () => {
    render(<TestComponent />);
    
    const trackButton = screen.getByText('Track Conversion');
    fireEvent.click(trackButton);
    
    await waitFor(() => {
      expect(parseInt(screen.getByTestId('events-queued').textContent || '0')).toBeGreaterThan(0);
    });
  });

  it('should respect disabled state', () => {
    render(<TestComponent options={{ enabled: false }} />);
    
    expect(screen.getByTestId('enabled')).toHaveTextContent('false');
  });

  it('should auto-track page views when enabled', () => {
    const trackSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent options={{ autoTrackPageViews: true }} />);
    
    expect(trackSpy).toHaveBeenCalledWith(
      expect.stringContaining('page_view'),
      'navigation',
      expect.any(Object)
    );
  });
});

describe('useInteractionTracking Hook', () => {
  const TestComponent: React.FC = () => {
    const elementRef = React.useRef<HTMLDivElement>(null);
    
    useInteractionTracking(elementRef, {
      trackClicks: true,
      trackForms: true,
      trackScrolls: true
    });

    return (
      <div ref={elementRef} data-testid="tracked-element">
        <button>Click Me</button>
        <form>
          <input type="text" />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  };

  it('should track clicks on tracked element', () => {
    const trackSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent />);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(trackSpy).toHaveBeenCalledWith(
      'element_click',
      'interaction',
      expect.objectContaining({
        element_tag: 'button'
      })
    );
  });

  it('should track form submissions', () => {
    const trackSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent />);
    
    const form = screen.getByRole('button', { name: 'Submit' }).closest('form')!;
    fireEvent.submit(form);
    
    expect(trackSpy).toHaveBeenCalledWith(
      'form_submit',
      'interaction',
      expect.any(Object)
    );
  });
});

describe('usePerformanceTracking Hook', () => {
  const TestComponent: React.FC = () => {
    const { trackError, trackResourceLoad } = usePerformanceTracking();

    return (
      <div>
        <button onClick={() => trackError(new Error('Test error'))}>
          Track Error
        </button>
        <button onClick={() => trackResourceLoad('test.js', 100)}>
          Track Resource Load
        </button>
      </div>
    );
  };

  it('should track errors', () => {
    const trackSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent />);
    
    const errorButton = screen.getByText('Track Error');
    fireEvent.click(errorButton);
    
    expect(trackSpy).toHaveBeenCalledWith(
      'javascript_error',
      'error',
      expect.objectContaining({
        error_message: 'Test error'
      })
    );
  });

  it('should track resource loading', () => {
    const trackSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent />);
    
    const resourceButton = screen.getByText('Track Resource Load');
    fireEvent.click(resourceButton);
    
    expect(trackSpy).toHaveBeenCalledWith(
      'resource_load',
      'performance',
      expect.objectContaining({
        resource_name: 'test.js',
        load_time: 100
      })
    );
  });
});

describe('useEcommerceTracking Hook', () => {
  const TestComponent: React.FC = () => {
    const { trackPurchase, trackAddToCart } = useEcommerceTracking();

    return (
      <div>
        <button onClick={() => trackPurchase('txn-123', 100, 'USD', [])}>
          Track Purchase
        </button>
        <button onClick={() => trackAddToCart('item-1', 'Test Item', 50)}>
          Track Add to Cart
        </button>
      </div>
    );
  };

  it('should track purchases', () => {
    const conversionSpy = jest.spyOn(mobileAnalyticsService, 'trackConversion');
    const eventSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent />);
    
    const purchaseButton = screen.getByText('Track Purchase');
    fireEvent.click(purchaseButton);
    
    expect(conversionSpy).toHaveBeenCalledWith({
      eventName: 'purchase',
      value: 100,
      currency: 'USD',
      items: []
    });
    
    expect(eventSpy).toHaveBeenCalledWith(
      'ecommerce_purchase',
      'conversion',
      expect.objectContaining({
        transaction_id: 'txn-123',
        value: 100,
        currency: 'USD'
      })
    );
  });

  it('should track add to cart events', () => {
    const trackSpy = jest.spyOn(mobileAnalyticsService, 'trackEvent');
    
    render(<TestComponent />);
    
    const addToCartButton = screen.getByText('Track Add to Cart');
    fireEvent.click(addToCartButton);
    
    expect(trackSpy).toHaveBeenCalledWith(
      'add_to_cart',
      'interaction',
      expect.objectContaining({
        item_id: 'item-1',
        item_name: 'Test Item',
        value: 50
      })
    );
  });
});

describe('Analytics API Integration', () => {
  it('should send events to API endpoint', async () => {
    mobileAnalyticsService.trackEvent('test_event', 'interaction');
    
    await mobileAnalyticsService.flush();
    
    expect(global.fetch).toHaveBeenCalledWith('/api/analytics/mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('test_event')
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    mobileAnalyticsService.trackEvent('test_event', 'interaction');
    
    // Should not throw
    await expect(mobileAnalyticsService.flush()).resolves.not.toThrow();
  });

  it('should retry failed requests', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    
    mobileAnalyticsService.trackEvent('test_event', 'interaction');
    await mobileAnalyticsService.flush();
    
    // Event should still be in queue for retry
    const summary = mobileAnalyticsService.getAnalyticsSummary();
    expect(summary.eventsQueued).toBeGreaterThan(0);
  });
});

describe('Offline Analytics', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  it('should store events offline when network is unavailable', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    mobileAnalyticsService.trackEvent('offline_event', 'interaction');
    await mobileAnalyticsService.flush();
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'analytics_offline_events',
      expect.stringContaining('offline_event')
    );
  });

  it('should send offline events when back online', async () => {
    // Mock stored offline events
    (localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify([{
        eventName: 'offline_event',
        eventType: 'interaction',
        timestamp: Date.now(),
        sessionId: 'session-123',
        deviceInfo: {},
        pageInfo: {},
        properties: {}
      }])
    );

    // Simulate going back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Trigger online event
    window.dispatchEvent(new Event('online'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
}); 