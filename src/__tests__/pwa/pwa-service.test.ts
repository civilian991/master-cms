/**
 * PWA Service Tests
 */

import { PWAService } from '@/lib/services/pwa-service';

// Mock window object and web APIs
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  addEventListener: jest.fn(),
  postMessage: jest.fn(),
  update: jest.fn(),
  showNotification: jest.fn()
};

const mockServiceWorker = {
  register: jest.fn(),
  addEventListener: jest.fn(),
  controller: null
};

const mockNavigator = {
  serviceWorker: mockServiceWorker,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  onLine: true,
  share: jest.fn(),
  standalone: false
};

const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  matchMedia: jest.fn(),
  location: { href: 'https://example.com', reload: jest.fn() },
  dispatchEvent: jest.fn()
};

const mockCaches = {
  keys: jest.fn(),
  open: jest.fn(),
  delete: jest.fn()
};

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn()
};

// Set up global mocks
beforeAll(() => {
  Object.defineProperty(global, 'window', { value: mockWindow, writable: true });
  Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true });
  Object.defineProperty(global, 'caches', { value: mockCaches, writable: true });
  Object.defineProperty(global, 'Notification', { 
    value: mockNotification, 
    writable: true,
    configurable: true 
  });
});

describe('PWAService', () => {
  let pwaService: PWAService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset service worker mock
    mockServiceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);
    
    // Create new instance
    pwaService = PWAService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PWAService.getInstance();
      const instance2 = PWAService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      // Service worker registration happens in constructor
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
    });

    it('should handle service worker registration failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));
      
      // Create new instance to trigger registration
      const newService = new (PWAService as any)();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith('Service Worker registration failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should skip registration when service worker not supported', () => {
      const originalNavigator = global.navigator;
      // @ts-ignore
      global.navigator = { userAgent: 'test' };
      
      const newService = new (PWAService as any)();
      
      expect(mockServiceWorker.register).not.toHaveBeenCalled();
      
      global.navigator = originalNavigator;
    });
  });

  describe('Platform Detection', () => {
    it('should detect iOS platform', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.platform).toBe('ios');
    });

    it('should detect Android platform', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)';
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.platform).toBe('android');
    });

    it('should detect desktop platform', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.platform).toBe('desktop');
    });

    it('should default to unknown platform', () => {
      mockNavigator.userAgent = 'Unknown browser';
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.platform).toBe('unknown');
    });
  });

  describe('App Installation Detection', () => {
    it('should detect standalone mode installation', () => {
      mockWindow.matchMedia = jest.fn().mockReturnValue({ matches: true });
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.isInstalled).toBe(true);
    });

    it('should detect iOS standalone installation', () => {
      mockWindow.matchMedia = jest.fn().mockReturnValue({ matches: false });
      (navigator as any).standalone = true;
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.isInstalled).toBe(true);
    });

    it('should detect non-installed state', () => {
      mockWindow.matchMedia = jest.fn().mockReturnValue({ matches: false });
      (navigator as any).standalone = false;
      const prompt = pwaService.getInstallPrompt();
      expect(prompt.isInstalled).toBe(false);
    });
  });

  describe('Install Prompt', () => {
    it('should handle install prompt successfully', async () => {
      const mockPrompt = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };
      
      // Set up deferred prompt
      (pwaService as any).deferredPrompt = mockPrompt;
      
      const result = await pwaService.promptInstall();
      
      expect(mockPrompt.prompt).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.outcome).toBe('accepted');
    });

    it('should handle install prompt dismissal', async () => {
      const mockPrompt = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };
      
      (pwaService as any).deferredPrompt = mockPrompt;
      
      const result = await pwaService.promptInstall();
      
      expect(result.success).toBe(false);
      expect(result.outcome).toBe('dismissed');
    });

    it('should handle no install prompt available', async () => {
      (pwaService as any).deferredPrompt = null;
      
      const result = await pwaService.promptInstall();
      
      expect(result.success).toBe(false);
      expect(result.outcome).toBe('No install prompt available');
    });

    it('should handle install prompt error', async () => {
      const mockPrompt = {
        prompt: jest.fn().mockRejectedValue(new Error('Prompt failed'))
      };
      
      (pwaService as any).deferredPrompt = mockPrompt;
      
      const result = await pwaService.promptInstall();
      
      expect(result.success).toBe(false);
      expect(result.outcome).toBe('Prompt failed');
    });
  });

  describe('Capabilities Detection', () => {
    it('should detect all capabilities when supported', () => {
      Object.defineProperty(window, 'PushManager', { value: {}, writable: true });
      Object.defineProperty(window, 'Notification', { value: {}, writable: true });
      Object.defineProperty(window, 'ServiceWorkerRegistration', { 
        value: { prototype: { sync: {} } }, 
        writable: true 
      });
      Object.defineProperty(window, 'launchQueue', { value: {}, writable: true });
      
      const capabilities = pwaService.getCapabilities();
      
      expect(capabilities.serviceWorker).toBe(true);
      expect(capabilities.pushNotifications).toBe(true);
      expect(capabilities.offlineSupport).toBe(true);
      expect(capabilities.sharing).toBe(true);
      expect(capabilities.fileHandling).toBe(true);
    });

    it('should detect limited capabilities', () => {
      // Remove some global objects
      delete (window as any).PushManager;
      delete (window as any).launchQueue;
      delete (navigator as any).share;
      
      const capabilities = pwaService.getCapabilities();
      
      expect(capabilities.pushNotifications).toBe(false);
      expect(capabilities.sharing).toBe(false);
      expect(capabilities.fileHandling).toBe(false);
    });
  });

  describe('Update Management', () => {
    it('should check for updates successfully', async () => {
      mockServiceWorkerRegistration.waiting = { state: 'installed' };
      (pwaService as any).registration = mockServiceWorkerRegistration;
      
      const status = await pwaService.checkForUpdates();
      
      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
      expect(status.hasUpdate).toBe(true);
      expect(status.updateAvailable).toBe(true);
    });

    it('should handle no updates available', async () => {
      mockServiceWorkerRegistration.waiting = null;
      (pwaService as any).registration = mockServiceWorkerRegistration;
      
      const status = await pwaService.checkForUpdates();
      
      expect(status.hasUpdate).toBe(false);
      expect(status.updateAvailable).toBe(false);
    });

    it('should handle update check error', async () => {
      mockServiceWorkerRegistration.update.mockRejectedValue(new Error('Update failed'));
      (pwaService as any).registration = mockServiceWorkerRegistration;
      
      const status = await pwaService.checkForUpdates();
      
      expect(status.hasUpdate).toBe(false);
      expect(status.updateAvailable).toBe(false);
    });

    it('should apply update successfully', async () => {
      const mockWaiting = { postMessage: jest.fn() };
      mockServiceWorkerRegistration.waiting = mockWaiting;
      (pwaService as any).registration = mockServiceWorkerRegistration;
      
      await pwaService.applyUpdate();
      
      expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      expect(mockWindow.location.reload).toHaveBeenCalled();
    });

    it('should throw error when no update available for apply', async () => {
      mockServiceWorkerRegistration.waiting = null;
      (pwaService as any).registration = mockServiceWorkerRegistration;
      
      await expect(pwaService.applyUpdate()).rejects.toThrow('No update available');
    });
  });

  describe('Online Status Monitoring', () => {
    it('should track online status', () => {
      mockNavigator.onLine = true;
      expect(pwaService.isOnlineStatus()).toBe(true);
      
      mockNavigator.onLine = false;
      expect(pwaService.isOnlineStatus()).toBe(false);
    });

    it('should listen for online/offline events', () => {
      // Check that event listeners were added
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Web Share API', () => {
    it('should share content successfully', async () => {
      mockNavigator.share.mockResolvedValue(undefined);
      
      const result = await pwaService.shareContent({
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      });
      
      expect(mockNavigator.share).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      });
      expect(result.success).toBe(true);
    });

    it('should handle share cancellation', async () => {
      const abortError = new Error('Share cancelled');
      abortError.name = 'AbortError';
      mockNavigator.share.mockRejectedValue(abortError);
      
      const result = await pwaService.shareContent({ title: 'Test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Share cancelled by user');
    });

    it('should handle share API not supported', async () => {
      delete (navigator as any).share;
      
      const result = await pwaService.shareContent({ title: 'Test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Web Share API not supported');
    });
  });

  describe('Notifications', () => {
    it('should request notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      Object.defineProperty(Notification, 'permission', { 
        value: 'default',
        writable: true 
      });
      
      const permission = await pwaService.requestNotificationPermission();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should return granted permission if already granted', async () => {
      Object.defineProperty(Notification, 'permission', { 
        value: 'granted',
        writable: true 
      });
      
      const permission = await pwaService.requestNotificationPermission();
      
      expect(permission).toBe('granted');
      expect(mockNotification.requestPermission).not.toHaveBeenCalled();
    });

    it('should throw error for denied permission', async () => {
      Object.defineProperty(Notification, 'permission', { 
        value: 'denied',
        writable: true 
      });
      
      await expect(pwaService.requestNotificationPermission())
        .rejects.toThrow('Notification permission denied');
    });

    it('should show notification with service worker', async () => {
      Object.defineProperty(Notification, 'permission', { 
        value: 'granted',
        writable: true 
      });
      (pwaService as any).registration = mockServiceWorkerRegistration;
      
      await pwaService.showNotification('Test Title', { body: 'Test Body' });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test Body',
          icon: '/icons/icon-192x192.png'
        })
      );
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', async () => {
      mockCaches.keys.mockResolvedValue(['cache1', 'cache2']);
      mockCaches.delete.mockResolvedValue(true);
      
      await pwaService.clearAllCaches();
      
      expect(mockCaches.keys).toHaveBeenCalled();
      expect(mockCaches.delete).toHaveBeenCalledWith('cache1');
      expect(mockCaches.delete).toHaveBeenCalledWith('cache2');
    });

    it('should get cache info', async () => {
      const mockCache = {
        keys: jest.fn().mockResolvedValue([new Request('/test')]),
        match: jest.fn().mockResolvedValue(new Response('test', { 
          headers: { 'content-length': '4' } 
        }))
      };
      
      mockCaches.keys.mockResolvedValue(['test-cache']);
      mockCaches.open.mockResolvedValue(mockCache);
      
      // Mock Response.blob for size calculation
      const mockBlob = { size: 4 };
      Response.prototype.blob = jest.fn().mockResolvedValue(mockBlob);
      
      const cacheInfo = await pwaService.getCacheInfo();
      
      expect(cacheInfo.caches).toHaveLength(1);
      expect(cacheInfo.caches[0].name).toBe('test-cache');
      expect(cacheInfo.totalSize).toBe(4);
    });
  });

  describe('Install Instructions', () => {
    it('should provide iOS instructions', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      
      const instructions = pwaService.getInstallInstructions();
      
      expect(instructions.platform).toBe('ios');
      expect(instructions.instructions).toContain('Open this page in Safari');
      expect(instructions.instructions).toContain('Tap the Share button (square with arrow)');
    });

    it('should provide Android instructions with prompt', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)';
      (pwaService as any).deferredPrompt = { prompt: jest.fn() };
      
      const instructions = pwaService.getInstallInstructions();
      
      expect(instructions.platform).toBe('android');
      expect(instructions.canPrompt).toBe(true);
      expect(instructions.instructions).toContain('Tap the "Install App" button');
    });

    it('should provide desktop instructions', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      
      const instructions = pwaService.getInstallInstructions();
      
      expect(instructions.platform).toBe('desktop');
      expect(instructions.instructions).toContain('Open this page in Chrome or Edge');
    });
  });

  describe('Manifest Generation', () => {
    it('should generate valid manifest', () => {
      const config = {
        appName: 'Test App',
        shortName: 'TestApp',
        description: 'Test Description',
        themeColor: '#000000',
        backgroundColor: '#FFFFFF',
        startUrl: '/',
        scope: '/',
        icons: [
          { sizes: '192x192', src: '/icon.png', type: 'image/png' }
        ]
      };
      
      const manifest = pwaService.generateManifest(config);
      
      expect(manifest).toMatchObject({
        name: 'Test App',
        short_name: 'TestApp',
        description: 'Test Description',
        start_url: '/',
        display: 'standalone'
      });
    });
  });

  describe('Event Listeners and Cleanup', () => {
    it('should add and remove update status listeners', () => {
      const handler = jest.fn();
      const cleanup = pwaService.onUpdateStatusChange(handler);
      
      // Simulate update status change
      (pwaService as any).notifyUpdateHandlers({ hasUpdate: true, updateAvailable: true });
      
      expect(handler).toHaveBeenCalledWith({ hasUpdate: true, updateAvailable: true });
      
      // Cleanup
      cleanup();
      
      // Handler should not be called after cleanup
      (pwaService as any).notifyUpdateHandlers({ hasUpdate: false, updateAvailable: false });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle install prompt availability', () => {
      const handler = jest.fn();
      pwaService.onInstallPromptAvailable(handler);
      
      // Simulate beforeinstallprompt event
      const mockEvent = { preventDefault: jest.fn() };
      const beforeInstallPromptHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1];
      
      if (beforeInstallPromptHandler) {
        beforeInstallPromptHandler(mockEvent);
        expect(handler).toHaveBeenCalledWith(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle service worker not supported gracefully', () => {
      const originalNavigator = global.navigator;
      // @ts-ignore
      global.navigator = {};
      
      expect(() => {
        new (PWAService as any)();
      }).not.toThrow();
      
      global.navigator = originalNavigator;
    });

    it('should handle cache API not supported', async () => {
      const originalCaches = global.caches;
      // @ts-ignore
      delete global.caches;
      
      await expect(pwaService.clearAllCaches())
        .rejects.toThrow('Cache API not supported');
      
      global.caches = originalCaches;
    });

    it('should handle notification API not supported', async () => {
      const originalNotification = global.Notification;
      // @ts-ignore
      delete global.Notification;
      
      await expect(pwaService.requestNotificationPermission())
        .rejects.toThrow('Notifications not supported');
      
      global.Notification = originalNotification;
    });
  });
});

describe('PWA Service Integration', () => {
  it('should provide comprehensive PWA functionality', () => {
    const service = PWAService.getInstance();
    
    // Check that all major methods are available
    expect(typeof service.getInstallPrompt).toBe('function');
    expect(typeof service.promptInstall).toBe('function');
    expect(typeof service.getCapabilities).toBe('function');
    expect(typeof service.checkForUpdates).toBe('function');
    expect(typeof service.applyUpdate).toBe('function');
    expect(typeof service.shareContent).toBe('function');
    expect(typeof service.requestNotificationPermission).toBe('function');
    expect(typeof service.showNotification).toBe('function');
    expect(typeof service.clearAllCaches).toBe('function');
    expect(typeof service.getCacheInfo).toBe('function');
  });

  it('should maintain consistent state across operations', async () => {
    const service = PWAService.getInstance();
    
    // Test that online status is tracked consistently
    const initialOnlineStatus = service.isOnlineStatus();
    expect(typeof initialOnlineStatus).toBe('boolean');
    
    // Test that capabilities don't change unexpectedly
    const capabilities1 = service.getCapabilities();
    const capabilities2 = service.getCapabilities();
    expect(capabilities1).toEqual(capabilities2);
  });
}); 