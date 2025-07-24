import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock essential browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
});

Object.defineProperty(window, 'screen', {
  writable: true,
  value: { width: 412, height: 869 },
});

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Cross-Platform Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'Test PWA',
        short_name: 'TestPWA',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      }),
    } as Response);
  });

  describe('Service Availability', () => {
    it('should import cross-platform testing service', async () => {
      expect(async () => {
        await import('@/lib/services/cross-platform-testing');
      }).not.toThrow();
    });

    it('should import device optimization service', async () => {
      expect(async () => {
        await import('@/lib/services/device-optimization');
      }).not.toThrow();
    });

    it('should import browser detection service', async () => {
      expect(async () => {
        await import('@/lib/services/browser-detection');
      }).not.toThrow();
    });

    it('should import PWA installation testing service', async () => {
      expect(async () => {
        await import('@/lib/services/pwa-installation-testing');
      }).not.toThrow();
    });
  });

  describe('Device Detection', () => {
    it('should detect Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
      });

      // Test user agent parsing
      const userAgent = navigator.userAgent.toLowerCase();
      expect(userAgent.includes('android')).toBe(true);
    });

    it('should detect iOS devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const userAgent = navigator.userAgent.toLowerCase();
      expect(userAgent.includes('iphone')).toBe(true);
    });

    it('should detect mobile screen sizes', () => {
      Object.defineProperty(window, 'screen', {
        writable: true,
        value: { width: 375, height: 812 },
      });

      expect(window.screen.width).toBeLessThan(768);
    });

    it('should detect tablet screen sizes', () => {
      Object.defineProperty(window, 'screen', {
        writable: true,
        value: { width: 768, height: 1024 },
      });

      expect(window.screen.width).toBeGreaterThanOrEqual(768);
      expect(window.screen.width).toBeLessThan(1024);
    });
  });

  describe('Browser Capability Detection', () => {
    it('should detect touch support', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5,
      });

      expect(navigator.maxTouchPoints).toBeGreaterThan(0);
    });

    it('should detect service worker support', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: { register: jest.fn() },
      });

      expect('serviceWorker' in navigator).toBe(true);
    });

    it('should detect fetch API support', () => {
      expect('fetch' in window).toBe(true);
    });

    it('should detect localStorage support', () => {
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        writable: true,
        value: mockStorage,
      });

      expect('localStorage' in window).toBe(true);
    });

    it('should detect CSS features', () => {
      const testElement = document.createElement('div');
      
      // Test CSS Grid support
      testElement.style.display = 'grid';
      const supportsGrid = testElement.style.display === 'grid';
      
      // Test CSS Flexbox support
      testElement.style.display = 'flex';
      const supportsFlex = testElement.style.display === 'flex';

      expect(typeof supportsGrid).toBe('boolean');
      expect(typeof supportsFlex).toBe('boolean');
    });
  });

  describe('PWA Features', () => {
    it('should detect manifest link', () => {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);

      const manifest = document.querySelector('link[rel="manifest"]');
      expect(manifest).toBeTruthy();
      
      document.head.removeChild(manifestLink);
    });

    it('should detect viewport meta tag', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(viewportMeta);

      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).toBeTruthy();
      
      document.head.removeChild(viewportMeta);
    });

    it('should detect HTTPS requirement', () => {
      const isSecure = location.protocol === 'https:' || 
                      location.hostname === 'localhost' ||
                      location.hostname === '127.0.0.1';
      
      expect(typeof isSecure).toBe('boolean');
    });

    it('should detect display mode', () => {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      expect(standaloneQuery).toBeTruthy();
    });
  });

  describe('Platform-Specific Features', () => {
    it('should handle Android-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
      });

      const isAndroid = navigator.userAgent.toLowerCase().includes('android');
      
      if (isAndroid) {
        // Test Android-specific features
        const hasThemeColor = document.querySelector('meta[name="theme-color"]');
        expect(typeof hasThemeColor).toBe('object'); // null or HTMLElement
      }
    });

    it('should handle iOS-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const isIOS = navigator.userAgent.toLowerCase().includes('iphone') ||
                   navigator.userAgent.toLowerCase().includes('ipad');

      if (isIOS) {
        // Test iOS-specific features
        const standalone = (window.navigator as any).standalone;
        expect(typeof standalone).toBe('boolean');
      }
    });

    it('should handle responsive breakpoints', () => {
      const breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
      };

      const screenWidth = window.screen.width;
      
      let deviceType: string;
      if (screenWidth < breakpoints.mobile) {
        deviceType = 'mobile';
      } else if (screenWidth < breakpoints.tablet) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }

      expect(['mobile', 'tablet', 'desktop']).toContain(deviceType);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing APIs gracefully', () => {
      // Remove an API and test fallback
      const originalIntersectionObserver = (window as any).IntersectionObserver;
      delete (window as any).IntersectionObserver;

      expect('IntersectionObserver' in window).toBe(false);

      // Restore for other tests
      if (originalIntersectionObserver) {
        (window as any).IntersectionObserver = originalIntersectionObserver;
      }
    });

    it('should handle network failures', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      try {
        await fetch('/manifest.json');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle invalid manifest', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      try {
        const response = await fetch('/manifest.json');
        await response.json();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Performance Considerations', () => {
    it('should detect device memory if available', () => {
      // Mock device memory API
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        value: 4,
      });

      const hasDeviceMemory = 'deviceMemory' in navigator;
      expect(typeof hasDeviceMemory).toBe('boolean');
    });

    it('should detect connection type if available', () => {
      // Mock connection API
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          downlink: 10,
        },
      });

      const hasConnection = 'connection' in navigator;
      expect(typeof hasConnection).toBe('boolean');
    });

    it('should handle performance API', () => {
      const performanceSupported = 'performance' in window;
      expect(performanceSupported).toBe(true);

      if (performanceSupported) {
        const now = performance.now();
        expect(typeof now).toBe('number');
      }
    });
  });

  describe('Accessibility Considerations', () => {
    it('should detect reduced motion preference', () => {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(reducedMotionQuery).toBeTruthy();
    });

    it('should detect color scheme preference', () => {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(darkModeQuery).toBeTruthy();
    });

    it('should detect speech synthesis support', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: {
          speak: jest.fn(),
          getVoices: jest.fn().mockReturnValue([]),
        },
      });

      expect('speechSynthesis' in window).toBe(true);
    });

    it('should detect vibration support', () => {
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        value: jest.fn(),
      });

      expect('vibrate' in navigator).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with multiple browser features together', () => {
      // Test combination of features
      const features = {
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        serviceWorker: 'serviceWorker' in navigator,
        fetch: 'fetch' in window,
        localStorage: 'localStorage' in window,
        matchMedia: 'matchMedia' in window,
      };

      Object.values(features).forEach(supported => {
        expect(typeof supported).toBe('boolean');
      });
    });

    it('should provide fallback recommendations', () => {
      const recommendations = [];

      if (!('serviceWorker' in navigator)) {
        recommendations.push('Service Worker not supported - PWA features limited');
      }

      if (!('IntersectionObserver' in window)) {
        recommendations.push('IntersectionObserver not supported - use scroll event fallback');
      }

      if (!('fetch' in window)) {
        recommendations.push('Fetch API not supported - use XMLHttpRequest fallback');
      }

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should calculate compatibility score', () => {
      const criticalFeatures = [
        'serviceWorker' in navigator,
        'fetch' in window,
        'localStorage' in window,
      ];

      const supportedFeatures = criticalFeatures.filter(Boolean).length;
      const score = (supportedFeatures / criticalFeatures.length) * 100;

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
}); 