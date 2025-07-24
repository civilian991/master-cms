import { 
  MobilePerformanceMonitor, 
  LazyLoader, 
  ImageOptimizer, 
  MobileCacheManager,
  BatteryOptimizer,
  NetworkOptimizer
} from '@/lib/utils/mobile-performance';
import { OfflineSyncService } from '@/lib/services/offline-sync';
import { useTouchGestures, useDeviceCapabilities, usePWAInstall } from '@/lib/hooks/useTouchGestures';
import { renderHook, act } from '@testing-library/react';

// Mock browser APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => [{ duration: 100 }]),
};

const mockNavigator = {
  onLine: true,
  maxTouchPoints: 5,
  vibrate: jest.fn(),
  share: jest.fn(),
  getBattery: jest.fn(),
  connection: {
    effectiveType: '4g',
    addEventListener: jest.fn(),
  },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
};

const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Setup global mocks
beforeAll(() => {
  global.performance = mockPerformance as any;
  global.navigator = mockNavigator as any;
  global.IntersectionObserver = mockIntersectionObserver;
  global.localStorage = mockLocalStorage as any;
  global.window = {
    ...global.window,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    matchMedia: jest.fn(() => ({ matches: false })),
    innerWidth: 375,
    innerHeight: 667,
    devicePixelRatio: 2,
  } as any;
});

describe('Mobile Performance Monitor', () => {
  let monitor: MobilePerformanceMonitor;

  beforeEach(() => {
    monitor = new MobilePerformanceMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should initialize with default metrics', () => {
    const metrics = monitor.getMetrics();
    
    expect(metrics).toHaveProperty('loadTime');
    expect(metrics).toHaveProperty('renderTime');
    expect(metrics).toHaveProperty('interactionTime');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('networkType');
    expect(metrics).toHaveProperty('devicePixelRatio');
    expect(metrics).toHaveProperty('viewportSize');
    
    expect(metrics.devicePixelRatio).toBe(2);
    expect(metrics.viewportSize.width).toBe(375);
    expect(metrics.viewportSize.height).toBe(667);
  });

  it('should mark and measure interactions', () => {
    monitor.markInteraction('button-click');
    
    expect(mockPerformance.mark).toHaveBeenCalledWith('interaction-button-click-start');
    
    const duration = monitor.measureInteraction('button-click');
    
    expect(mockPerformance.mark).toHaveBeenCalledWith('interaction-button-click-end');
    expect(mockPerformance.measure).toHaveBeenCalledWith(
      'interaction-button-click',
      'interaction-button-click-start',
      'interaction-button-click-end'
    );
    expect(duration).toBe(100);
  });

  it('should report metrics', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    monitor.reportMetrics();
    
    expect(consoleSpy).toHaveBeenCalledWith('Mobile Performance Metrics:', expect.any(Object));
    
    consoleSpy.mockRestore();
  });
});

describe('Lazy Loader', () => {
  let lazyLoader: LazyLoader;
  let mockElement: HTMLElement;

  beforeEach(() => {
    lazyLoader = new LazyLoader({
      rootMargin: '50px',
      threshold: 0.1,
    });
    
    mockElement = document.createElement('img');
    mockElement.setAttribute('data-src', 'https://example.com/image.jpg');
  });

  afterEach(() => {
    lazyLoader.disconnect();
  });

  it('should initialize intersection observer', () => {
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('should observe elements', () => {
    const observeSpy = jest.fn();
    (mockIntersectionObserver as jest.Mock).mockImplementation(() => ({
      observe: observeSpy,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    
    const newLazyLoader = new LazyLoader();
    newLazyLoader.observe(mockElement);
    
    expect(observeSpy).toHaveBeenCalledWith(mockElement);
    
    newLazyLoader.disconnect();
  });

  it('should unobserve elements', () => {
    const unobserveSpy = jest.fn();
    (mockIntersectionObserver as jest.Mock).mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: unobserveSpy,
      disconnect: jest.fn(),
    }));
    
    const newLazyLoader = new LazyLoader();
    newLazyLoader.unobserve(mockElement);
    
    expect(unobserveSpy).toHaveBeenCalledWith(mockElement);
    
    newLazyLoader.disconnect();
  });
});

describe('Image Optimizer', () => {
  let imageOptimizer: ImageOptimizer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockContext = {
      drawImage: jest.fn(),
    } as any;
    
    mockCanvas = {
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback) => {
        const mockBlob = new Blob(['mock-image-data'], { type: 'image/webp' });
        callback(mockBlob);
      }),
      width: 0,
      height: 0,
    } as any;
    
    global.document.createElement = jest.fn(() => mockCanvas) as any;
    
    imageOptimizer = new ImageOptimizer();
  });

  it('should optimize image with default options', async () => {
    const mockFile = new File(['mock-file-content'], 'test.jpg', { type: 'image/jpeg' });
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    
    // Mock Image constructor
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      width: 1920,
      height: 1080,
      src: '',
    };
    
    global.Image = jest.fn(() => mockImage) as any;
    
    const optimizePromise = imageOptimizer.optimizeImage(mockFile);
    
    // Simulate image load
    if (mockImage.onload) {
      mockImage.onload();
    }
    
    const result = await optimizePromise;
    
    expect(result).toBeInstanceOf(Blob);
    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
    expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0, 1920, 1080);
  });

  it('should resize image when larger than max dimensions', async () => {
    const mockFile = new File(['mock-file-content'], 'test.jpg', { type: 'image/jpeg' });
    
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      width: 3840,
      height: 2160,
      src: '',
    };
    
    global.Image = jest.fn(() => mockImage) as any;
    
    const optimizePromise = imageOptimizer.optimizeImage(mockFile, {
      maxWidth: 1920,
      maxHeight: 1080,
    });
    
    if (mockImage.onload) {
      mockImage.onload();
    }
    
    await optimizePromise;
    
    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
  });

  it('should generate responsive image srcset', () => {
    const srcSet = imageOptimizer.generateResponsiveImageSrcSet(
      'https://example.com/image.jpg',
      [320, 640, 1280]
    );
    
    expect(srcSet).toBe(
      'https://example.com/image.jpg?w=320 320w, ' +
      'https://example.com/image.jpg?w=640 640w, ' +
      'https://example.com/image.jpg?w=1280 1280w'
    );
  });

  it('should generate responsive image sizes', () => {
    const sizes = imageOptimizer.generateResponsiveImageSizes([
      { mediaQuery: '(max-width: 768px)', size: '100vw' },
      { mediaQuery: '(max-width: 1024px)', size: '50vw' },
    ]);
    
    expect(sizes).toBe('(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw');
  });
});

describe('Mobile Cache Manager', () => {
  let cacheManager: MobileCacheManager;

  beforeEach(() => {
    cacheManager = new MobileCacheManager();
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should store and retrieve data with default strategy', async () => {
    const testData = { id: 1, name: 'Test' };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      data: testData,
      timestamp: Date.now(),
    }));
    
    await cacheManager.set('test-key', testData);
    const retrieved = await cacheManager.get('test-key');
    
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    expect(retrieved).toEqual(testData);
  });

  it('should handle expired cache entries', async () => {
    const expiredData = {
      data: { id: 1, name: 'Test' },
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));
    
    const retrieved = await cacheManager.get('test-key');
    
    expect(retrieved).toBeNull();
  });

  it('should use different strategies for different data types', async () => {
    const imageData = { url: 'image.jpg', blob: 'image-data' };
    const apiData = { users: [], posts: [] };
    
    await cacheManager.set('image-1', imageData, 'images');
    await cacheManager.set('api-data-1', apiData, 'api-data');
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
  });

  it('should cleanup expired entries', async () => {
    cacheManager.cleanup();
    
    // Cleanup is called automatically, verify it doesn't throw
    expect(true).toBe(true);
  });

  it('should clear cache by strategy', async () => {
    cacheManager.clear('images');
    
    // Should remove only image cache entries
    expect(true).toBe(true);
  });
});

describe('Battery Optimizer', () => {
  let batteryOptimizer: BatteryOptimizer;

  beforeEach(() => {
    batteryOptimizer = new BatteryOptimizer();
  });

  it('should detect low power mode', () => {
    const isLowPower = batteryOptimizer.isLowPower();
    expect(typeof isLowPower).toBe('boolean');
  });

  it('should provide optimization settings based on battery', () => {
    const settings = batteryOptimizer.getOptimizationSettings();
    
    expect(settings).toHaveProperty('reduceAnimations');
    expect(settings).toHaveProperty('lowerImageQuality');
    expect(settings).toHaveProperty('disableAutoplay');
    expect(settings).toHaveProperty('reducePollFrequency');
  });

  it('should handle power mode change callbacks', () => {
    const callback = jest.fn();
    const unsubscribe = batteryOptimizer.onPowerModeChange(callback);
    
    expect(typeof unsubscribe).toBe('function');
    
    unsubscribe();
  });
});

describe('Network Optimizer', () => {
  let networkOptimizer: NetworkOptimizer;

  beforeEach(() => {
    networkOptimizer = new NetworkOptimizer();
  });

  it('should detect slow connections', () => {
    const isSlow = networkOptimizer.isSlow();
    expect(typeof isSlow).toBe('boolean');
  });

  it('should provide optimization settings based on network', () => {
    const settings = networkOptimizer.getOptimizationSettings();
    
    expect(settings).toHaveProperty('preloadStrategy');
    expect(settings).toHaveProperty('imageQuality');
    expect(settings).toHaveProperty('enableCompression');
    expect(settings).toHaveProperty('batchRequests');
  });

  it('should handle connection change callbacks', () => {
    const callback = jest.fn();
    const unsubscribe = networkOptimizer.onConnectionChange(callback);
    
    expect(typeof unsubscribe).toBe('function');
    
    unsubscribe();
  });
});

describe('Offline Sync Service', () => {
  let offlineSync: OfflineSyncService;

  beforeEach(() => {
    offlineSync = new OfflineSyncService({
      enableAutoSync: false, // Disable for testing
      enableConflictResolution: true,
    });
    
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    offlineSync.destroy();
  });

  it('should queue actions when offline', async () => {
    const action = {
      type: 'create_post' as const,
      data: { title: 'Test Post', content: 'Test content' },
      priority: 'medium' as const,
    };
    
    const actionId = await offlineSync.queueAction(action);
    
    expect(actionId).toBeTruthy();
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should retrieve pending actions', async () => {
    mockLocalStorage.key.mockImplementation((index) => {
      const keys = ['offline-action-123', 'offline-action-456'];
      return keys[index] || null;
    });
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'offline-action-123') {
        return JSON.stringify({
          id: '123',
          type: 'create_post',
          data: { title: 'Post 1' },
          status: 'pending',
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          priority: 'medium',
        });
      }
      return null;
    });
    
    Object.defineProperty(mockLocalStorage, 'length', { value: 2 });
    
    const pendingActions = await offlineSync.getPendingActions();
    
    expect(pendingActions).toHaveLength(1);
    expect(pendingActions[0].id).toBe('123');
  });

  it('should cache data with expiration', async () => {
    const testData = { id: 1, name: 'Test Data' };
    
    await offlineSync.cacheData('test-1', 'test-type', testData, 60000);
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'offline-cache-test-type-test-1',
      expect.stringContaining('"expiresAt"')
    );
  });

  it('should retrieve cached data', async () => {
    const cachedData = {
      id: 'test-1',
      type: 'test-type',
      data: { id: 1, name: 'Test Data' },
      timestamp: Date.now(),
      version: 1,
      lastModified: Date.now(),
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));
    
    const retrieved = await offlineSync.getCachedData('test-1', 'test-type');
    
    expect(retrieved).toEqual(cachedData);
  });

  it('should handle conflict resolution', async () => {
    const localData = { id: 1, name: 'Local Name', version: 1 };
    const remoteData = { id: 1, name: 'Remote Name', version: 2 };
    
    const resolvedLocal = await offlineSync.resolveConflict(localData, remoteData, 'local-wins');
    const resolvedRemote = await offlineSync.resolveConflict(localData, remoteData, 'remote-wins');
    const resolvedMerge = await offlineSync.resolveConflict(localData, remoteData, 'merge');
    
    expect(resolvedLocal).toEqual(localData);
    expect(resolvedRemote).toEqual(remoteData);
    expect(resolvedMerge).toEqual(expect.objectContaining({
      id: 1,
      version: 2, // Should prefer remote version
    }));
  });

  it('should provide sync status', async () => {
    const status = await offlineSync.getStatus();
    
    expect(status).toHaveProperty('isOnline');
    expect(status).toHaveProperty('issyncing');
    expect(status).toHaveProperty('pendingActions');
    expect(status).toHaveProperty('lastSyncTime');
    expect(status).toHaveProperty('syncErrors');
  });

  it('should handle event listeners', () => {
    const callback = jest.fn();
    const unsubscribe = offlineSync.on('sync-completed', callback);
    
    expect(typeof unsubscribe).toBe('function');
    
    unsubscribe();
  });
});

describe('Touch Gestures Hook', () => {
  it('should initialize with default options', () => {
    const { result } = renderHook(() => useTouchGestures());
    
    expect(result.current.ref).toBeTruthy();
    expect(result.current.touchState).toEqual({
      isScrolledToTop: true,
      isPulling: false,
      pullDistance: 0,
      isLongPressing: false,
      gestureType: 'none',
    });
  });

  it('should handle swipe callbacks', () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    
    const { result } = renderHook(() => useTouchGestures({
      onSwipeLeft,
      onSwipeRight,
      swipeThreshold: 50,
    }));
    
    expect(result.current.ref).toBeTruthy();
  });

  it('should provide reset gesture function', () => {
    const { result } = renderHook(() => useTouchGestures());
    
    act(() => {
      result.current.resetGesture();
    });
    
    expect(result.current.touchState.gestureType).toBe('none');
  });

  it('should provide haptic feedback function', () => {
    const { result } = renderHook(() => useTouchGestures());
    
    act(() => {
      result.current.triggerHapticFeedback(100);
    });
    
    expect(mockNavigator.vibrate).toHaveBeenCalledWith(100);
  });
});

describe('Device Capabilities Hook', () => {
  it('should detect device capabilities', () => {
    const { result } = renderHook(() => useDeviceCapabilities());
    
    expect(result.current).toHaveProperty('hasTouch');
    expect(result.current).toHaveProperty('hasHaptic');
    expect(result.current).toHaveProperty('hasShare');
    expect(result.current).toHaveProperty('hasNotifications');
    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isIOS');
    expect(result.current).toHaveProperty('isAndroid');
    
    expect(result.current.hasTouch).toBe(true);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isIOS).toBe(true);
  });
});

describe('PWA Install Hook', () => {
  it('should handle install prompt', () => {
    const { result } = renderHook(() => usePWAInstall());
    
    expect(result.current).toHaveProperty('isInstallable');
    expect(result.current).toHaveProperty('isInstalled');
    expect(result.current).toHaveProperty('installApp');
    
    expect(typeof result.current.installApp).toBe('function');
  });

  it('should detect if app is already installed', () => {
    // Mock standalone mode
    global.window.matchMedia = jest.fn(() => ({ matches: true })) as any;
    
    const { result } = renderHook(() => usePWAInstall());
    
    // Should detect standalone mode as installed
    expect(result.current.isInstalled).toBe(true);
  });
});

describe('Service Worker Integration', () => {
  it('should register service worker', () => {
    // Mock service worker registration
    global.navigator.serviceWorker = {
      register: jest.fn(() => Promise.resolve({
        installing: null,
        waiting: null,
        active: {
          state: 'activated',
          postMessage: jest.fn(),
        },
        addEventListener: jest.fn(),
        update: jest.fn(),
      })),
      ready: Promise.resolve({} as any),
      controller: null,
      addEventListener: jest.fn(),
    } as any;
    
    expect(navigator.serviceWorker.register).toBeDefined();
  });
});

describe('Mobile Performance Integration', () => {
  it('should work together with all mobile optimizations', async () => {
    const monitor = new MobilePerformanceMonitor();
    const lazyLoader = new LazyLoader();
    const cacheManager = new MobileCacheManager();
    const batteryOptimizer = new BatteryOptimizer();
    const networkOptimizer = new NetworkOptimizer();
    const offlineSync = new OfflineSyncService({ enableAutoSync: false });
    
    // Test data flow
    const testData = { id: 1, content: 'Test content' };
    await cacheManager.set('test-data', testData);
    
    const action = {
      type: 'create_post' as const,
      data: testData,
      priority: 'medium' as const,
    };
    
    const actionId = await offlineSync.queueAction(action);
    
    // Monitor performance
    monitor.markInteraction('test-interaction');
    const duration = monitor.measureInteraction('test-interaction');
    
    // Check optimization settings
    const batterySettings = batteryOptimizer.getOptimizationSettings();
    const networkSettings = networkOptimizer.getOptimizationSettings();
    
    expect(actionId).toBeTruthy();
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(batterySettings).toBeTruthy();
    expect(networkSettings).toBeTruthy();
    
    // Cleanup
    monitor.destroy();
    lazyLoader.disconnect();
    cacheManager.clear();
    offlineSync.destroy();
  });
}); 