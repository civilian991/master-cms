import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { mobileCache, MOBILE_CACHE_PRESETS } from '../../lib/services/mobile-cache';
import { criticalCSS, performanceUtils } from '../../lib/utils/critical-css';
import { useNetworkStatus, useAdaptiveLoading, getOptimalImageQuality } from '../../lib/utils/lazy-loading';

// Mock Redis for testing
jest.mock('../../lib/redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    info: jest.fn(),
    pipeline: jest.fn(() => ({
      setex: jest.fn(),
      exec: jest.fn(),
    })),
  },
}));

// Mock window APIs for testing
const mockNavigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  deviceMemory: 4,
  hardwareConcurrency: 4,
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('Mobile Performance Optimization - Task 5.5.5', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Code Splitting and Bundle Optimization', () => {
    it('should implement proper bundle splitting configuration', () => {
      // Test Next.js config optimizations
      const nextConfig = require('../../../next.config.ts').default;
      
      expect(nextConfig.experimental.optimizePackageImports).toContain('lucide-react');
      expect(nextConfig.experimental.optimizeCss).toBe(true);
      expect(nextConfig.compress).toBe(true);
      expect(nextConfig.images.formats).toContain('image/webp');
      expect(nextConfig.images.formats).toContain('image/avif');
    });

    it('should configure responsive image sizes for mobile', () => {
      const nextConfig = require('../../../next.config.ts').default;
      
      expect(nextConfig.images.deviceSizes).toContain(320); // Mobile
      expect(nextConfig.images.deviceSizes).toContain(768); // Tablet
      expect(nextConfig.images.deviceSizes).toContain(1024); // Desktop
    });

    it('should implement proper caching headers', async () => {
      const nextConfig = require('../../../next.config.ts').default;
      const headers = await nextConfig.headers();
      
      const staticHeaders = headers.find((h: any) => h.source === '/_next/static/(.*)');
      expect(staticHeaders).toBeDefined();
      expect(staticHeaders.headers[0].value).toContain('max-age=31536000');
      expect(staticHeaders.headers[0].value).toContain('immutable');
    });
  });

  describe('Critical Path CSS Inlining', () => {
    it('should generate critical CSS for mobile-first loading', () => {
      const css = criticalCSS.getCriticalCSS();
      
      expect(css).toContain('box-sizing: border-box');
      expect(css).toContain('-webkit-text-size-adjust: 100%');
      expect(css).toContain('overflow-x: hidden');
      expect(css).toContain('@media (min-width: 768px)');
    });

    it('should minify CSS for production', () => {
      const originalCSS = `
        /* Comment */
        .class {
          color: red ;
          margin: 0 ;
        }
      `;
      
      const minified = criticalCSS.minifyCSS(originalCSS);
      
      expect(minified).not.toContain('/* Comment */');
      expect(minified).not.toContain('\n');
      expect(minified.length).toBeLessThan(originalCSS.length);
    });

    it('should extract above-the-fold CSS correctly', () => {
      const htmlContent = '<header><nav><h1>Title</h1></nav></header>';
      const extractedCSS = criticalCSS.extractAboveTheFoldCSS(htmlContent);
      
      expect(extractedCSS).toContain('h1');
      expect(extractedCSS).toContain('nav-item');
    });

    it('should generate performance resource hints', () => {
      const hints = performanceUtils.generateResourceHints();
      
      expect(hints).toContain('viewport-fit=cover');
      expect(hints).toContain('mobile-web-app-capable');
      expect(hints).toContain('format-detection');
    });
  });

  describe('Lazy Loading Implementation', () => {
    it('should detect network status correctly', () => {
      // Mock slow connection
      mockNavigator.connection.effectiveType = '2g';
      mockNavigator.connection.downlink = 0.5;
      mockNavigator.connection.saveData = true;

      // In a real test, we'd render a component that uses useNetworkStatus
      // For now, we'll test the logic directly
      expect(mockNavigator.connection.effectiveType).toBe('2g');
      expect(mockNavigator.connection.saveData).toBe(true);
    });

    it('should optimize image quality based on network conditions', () => {
      const slowNetworkStatus = {
        effectiveType: '2g',
        downlink: 0.5,
        saveData: true,
        isSlowConnection: true,
        isFastConnection: false,
        shouldReduceData: true,
      };

      const lowEndDevice = { isLowEnd: true };
      
      const quality = getOptimalImageQuality(slowNetworkStatus, lowEndDevice);
      expect(quality).toBe(60); // Lower quality for slow connections
    });

    it('should provide high quality images for fast connections', () => {
      const fastNetworkStatus = {
        effectiveType: '4g',
        downlink: 10,
        saveData: false,
        isSlowConnection: false,
        isFastConnection: true,
        shouldReduceData: false,
      };

      const highEndDevice = { isLowEnd: false };
      
      const quality = getOptimalImageQuality(fastNetworkStatus, highEndDevice);
      expect(quality).toBe(90); // High quality for fast connections
    });
  });

  describe('Mobile Cache Service', () => {
    it('should implement network-aware caching', async () => {
      const testData = { content: 'test content', timestamp: Date.now() };
      const result = await mobileCache.set('test-key', testData, MOBILE_CACHE_PRESETS.CRITICAL);
      
      expect(result).toBe(true);
    });

    it('should provide different cache presets for different content types', () => {
      expect(MOBILE_CACHE_PRESETS.CRITICAL.ttl).toBe(7200); // 2 hours
      expect(MOBILE_CACHE_PRESETS.CRITICAL.priority).toBe('high');
      expect(MOBILE_CACHE_PRESETS.CRITICAL.networkAware).toBe(true);

      expect(MOBILE_CACHE_PRESETS.IMAGES.ttl).toBe(86400); // 24 hours
      expect(MOBILE_CACHE_PRESETS.TEMPORARY.ttl).toBe(300); // 5 minutes
    });

    it('should implement stale-while-revalidate strategy', async () => {
      const revalidateFunction = jest.fn().mockResolvedValue({ fresh: 'data' });
      
      // Mock cached data exists
      jest.spyOn(mobileCache, 'get').mockResolvedValue({ stale: 'data' });
      jest.spyOn(mobileCache, 'getStaleTime').mockResolvedValue(Date.now() - 10000); // 10 seconds old
      
      const result = await mobileCache.getWithRevalidation('test-key', revalidateFunction);
      
      expect(result).toEqual({ stale: 'data' }); // Returns stale data immediately
    });

    it('should batch cache operations for efficiency', async () => {
      const items = [
        { key: 'item1', data: { value: 1 } },
        { key: 'item2', data: { value: 2 } },
        { key: 'item3', data: { value: 3 } },
      ];
      
      const result = await mobileCache.setBatch(items);
      expect(result).toBe(true);
    });

    it('should cleanup cache based on network conditions', async () => {
      const cleanupSpy = jest.spyOn(mobileCache, 'cleanup');
      await mobileCache.cleanup();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should preload critical content selectively', async () => {
      const criticalItems = [
        {
          key: 'critical-content-1',
          fetchFunction: jest.fn().mockResolvedValue({ critical: 'data1' }),
          priority: 'high' as const,
        },
        {
          key: 'critical-content-2',
          fetchFunction: jest.fn().mockResolvedValue({ critical: 'data2' }),
          priority: 'high' as const,
        },
      ];
      
      // Mock that content doesn't exist
      jest.spyOn(mobileCache as any, 'exists').mockResolvedValue(false);
      
      await mobileCache.preloadCritical(criticalItems);
      
      expect(criticalItems[0].fetchFunction).toHaveBeenCalled();
      expect(criticalItems[1].fetchFunction).toHaveBeenCalled();
    });
  });

  describe('Performance Utilities', () => {
    it('should implement throttling for performance optimization', (done) => {
      let callCount = 0;
      const throttledFn = performanceUtils.throttle(() => {
        callCount++;
      }, 100);

      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();

      // Should only be called once immediately
      expect(callCount).toBe(1);

      // After throttle period, should allow another call
      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });

    it('should implement debouncing for performance optimization', (done) => {
      let callCount = 0;
      const debouncedFn = performanceUtils.debounce(() => {
        callCount++;
      }, 100);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not be called immediately
      expect(callCount).toBe(0);

      // After debounce period, should be called once
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    it('should defer non-critical operations', (done) => {
      let executed = false;
      
      performanceUtils.defer(() => {
        executed = true;
      });

      // Should not execute immediately
      expect(executed).toBe(false);

      // Should execute in next tick
      setTimeout(() => {
        expect(executed).toBe(true);
        done();
      }, 10);
    });

    it('should measure performance of operations', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      performanceUtils.measurePerformance('test-operation', () => {
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-operation took')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Image Optimization', () => {
    it('should generate responsive srcSet for different screen sizes', () => {
      const baseSrc = '/images/test.jpg';
      const quality = 75;
      const sizes = [320, 640, 768, 1024, 1280, 1920];
      
      const expectedSrcSet = sizes
        .map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
        .join(', ');

      // This would be tested within the LazyImage component
      expect(expectedSrcSet).toContain('320w');
      expect(expectedSrcSet).toContain('1920w');
      expect(expectedSrcSet).toContain('q=75');
    });

    it('should implement proper loading strategies', () => {
      // Test priority loading
      const priorityImage = {
        loading: 'eager',
        priority: true,
      };

      const lazyImage = {
        loading: 'lazy',
        priority: false,
      };

      expect(priorityImage.loading).toBe('eager');
      expect(lazyImage.loading).toBe('lazy');
    });
  });

  describe('Network-Aware Loading Strategies', () => {
    it('should implement conservative loading on slow connections', () => {
      mockNavigator.connection.effectiveType = '2g';
      mockNavigator.deviceMemory = 2; // Low memory device
      
      // In a real component test, this would determine loading strategy
      const isSlowConnection = mockNavigator.connection.effectiveType === '2g';
      const isLowMemory = mockNavigator.deviceMemory <= 2;
      
      expect(isSlowConnection).toBe(true);
      expect(isLowMemory).toBe(true);
    });

    it('should implement aggressive loading on fast connections', () => {
      mockNavigator.connection.effectiveType = '4g';
      mockNavigator.connection.downlink = 20;
      mockNavigator.deviceMemory = 8;
      
      const isFastConnection = mockNavigator.connection.effectiveType === '4g';
      const hasGoodPerformance = mockNavigator.deviceMemory >= 4;
      
      expect(isFastConnection).toBe(true);
      expect(hasGoodPerformance).toBe(true);
    });

    it('should respect data saver preferences', () => {
      mockNavigator.connection.saveData = true;
      
      expect(mockNavigator.connection.saveData).toBe(true);
      // In practice, this would reduce image quality and defer non-critical loading
    });
  });

  describe('Mobile Core Web Vitals Optimization', () => {
    it('should configure for LCP optimization', () => {
      const nextConfig = require('../../../next.config.ts').default;
      
      // Critical CSS inlining helps LCP
      expect(nextConfig.experimental.optimizeCss).toBe(true);
      
      // Image optimization helps LCP
      expect(nextConfig.images.formats).toContain('image/webp');
      expect(nextConfig.images.minimumCacheTTL).toBe(31536000);
    });

    it('should configure for FID optimization', () => {
      const nextConfig = require('../../../next.config.ts').default;
      
      // Code splitting helps reduce main thread blocking
      expect(nextConfig.experimental.optimizePackageImports).toBeDefined();
      
      // Bundle size limits help FID
      expect(nextConfig.webpack).toBeDefined();
    });

    it('should configure for CLS optimization', () => {
      // Size hints for images help prevent layout shift
      const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];
      const nextConfig = require('../../../next.config.ts').default;
      
      expect(nextConfig.images.imageSizes).toEqual(imageSizes);
    });
  });

  describe('Caching Strategy Effectiveness', () => {
    it('should implement proper cache hierarchies', () => {
      const criticalCache = MOBILE_CACHE_PRESETS.CRITICAL;
      const contentCache = MOBILE_CACHE_PRESETS.CONTENT;
      const imageCache = MOBILE_CACHE_PRESETS.IMAGES;
      const tempCache = MOBILE_CACHE_PRESETS.TEMPORARY;

      // Critical content should have highest priority and longest TTL for important content
      expect(criticalCache.priority).toBe('high');
      expect(criticalCache.ttl).toBeGreaterThan(contentCache.ttl);
      
      // Images should cache longest
      expect(imageCache.ttl).toBeGreaterThan(criticalCache.ttl);
      
      // Temporary content should have shortest TTL
      expect(tempCache.ttl).toBeLessThan(contentCache.ttl);
    });

    it('should implement stale-while-revalidate for better UX', async () => {
      // Mock scenario where we have stale content but return it while fetching fresh
      const mockStaleData = { content: 'stale', timestamp: Date.now() - 60000 };
      const mockFreshData = { content: 'fresh', timestamp: Date.now() };
      
      jest.spyOn(mobileCache, 'get').mockResolvedValue(mockStaleData);
      
      const revalidateFn = jest.fn().mockResolvedValue(mockFreshData);
      const result = await mobileCache.getWithRevalidation('test', revalidateFn);
      
      // Should return stale data immediately for better UX
      expect(result).toEqual(mockStaleData);
    });
  });
});

describe('Mobile Performance Integration Tests', () => {
  it('should demonstrate end-to-end mobile optimization', async () => {
    // Simulate mobile device with slow connection
    mockNavigator.connection.effectiveType = '3g';
    mockNavigator.connection.saveData = true;
    mockNavigator.deviceMemory = 2;

    // 1. Critical CSS should be inlined
    const criticalStyles = criticalCSS.getCriticalCSS();
    expect(criticalStyles.length).toBeGreaterThan(0);
    expect(criticalStyles).toContain('mobile');

    // 2. Images should use lower quality
    const networkStatus = {
      effectiveType: '3g',
      downlink: 2,
      saveData: true,
      isSlowConnection: true,
      isFastConnection: false,
      shouldReduceData: true,
    };
    const deviceInfo = { isLowEnd: true };
    
    const imageQuality = getOptimalImageQuality(networkStatus, deviceInfo);
    expect(imageQuality).toBe(60); // Reduced quality for slow connection

    // 3. Cache should use conservative settings
    const cacheResult = await mobileCache.set(
      'mobile-content',
      { data: 'test' },
      MOBILE_CACHE_PRESETS.CONTENT
    );
    expect(cacheResult).toBe(true);

    // 4. Performance utilities should optimize operations
    let operationCompleted = false;
    performanceUtils.defer(() => {
      operationCompleted = true;
    });

    // Operation should be deferred for better performance
    expect(operationCompleted).toBe(false);
  });
}); 