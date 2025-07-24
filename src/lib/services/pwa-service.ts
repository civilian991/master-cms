/**
 * Progressive Web App Service
 * Manages PWA installation, updates, and app-like features
 */

export interface PWAInstallPrompt {
  canInstall: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  prompt?: any; // BeforeInstallPromptEvent
}

export interface PWAUpdateStatus {
  hasUpdate: boolean;
  isUpdating: boolean;
  updateAvailable: boolean;
  skipWaiting?: boolean;
}

export interface PWACapabilities {
  serviceWorker: boolean;
  pushNotifications: boolean;
  installPrompt: boolean;
  offlineSupport: boolean;
  backgroundSync: boolean;
  sharing: boolean;
  fileHandling: boolean;
}

export interface AppUpdateInfo {
  version: string;
  releaseNotes: string[];
  updateSize?: string;
  isRequired: boolean;
  downloadProgress?: number;
}

export interface PWAConfig {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  scope: string;
  icons: {
    sizes: string;
    src: string;
    type: string;
    purpose?: string;
  }[];
  screenshots?: {
    src: string;
    sizes: string;
    type: string;
    formFactor: 'narrow' | 'wide';
    label: string;
  }[];
  shortcuts?: {
    name: string;
    shortName: string;
    description: string;
    url: string;
    icons: { src: string; sizes: string }[];
  }[];
}

export class PWAService {
  private static instance: PWAService;
  private deferredPrompt: any = null;
  private installPromptHandler: ((event: any) => void) | null = null;
  private updateHandlers: Set<(status: PWAUpdateStatus) => void> = new Set();
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline: boolean = true;

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializePWA();
    }
  }

  /**
   * Initialize PWA functionality
   */
  private async initializePWA(): Promise<void> {
    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Set up install prompt listener
      this.setupInstallPromptListener();
      
      // Set up update listeners
      this.setupUpdateListeners();
      
      // Monitor online/offline status
      this.setupOnlineStatusMonitoring();
      
      // Set up app shortcuts and protocol handlers
      this.setupAppFeatures();
      
      console.log('PWA Service initialized successfully');
    } catch (error) {
      console.error('PWA Service initialization failed:', error);
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate();
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Set up install prompt listener
   */
  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      
      if (this.installPromptHandler) {
        this.installPromptHandler(event);
      }
      
      console.log('PWA install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.deferredPrompt = null;
    });
  }

  /**
   * Set up update listeners
   */
  private setupUpdateListeners(): void {
    if (!this.registration) return;

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        this.notifyUpdateHandlers({
          hasUpdate: true,
          isUpdating: false,
          updateAvailable: true
        });
      }
    });
  }

  /**
   * Handle service worker update
   */
  private handleServiceWorkerUpdate(): void {
    if (!this.registration?.installing) return;

    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version is available
        this.notifyUpdateHandlers({
          hasUpdate: true,
          isUpdating: false,
          updateAvailable: true
        });
      }
    });
  }

  /**
   * Monitor online/offline status
   */
  private setupOnlineStatusMonitoring(): void {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
    });
  }

  /**
   * Set up app features like shortcuts and protocol handlers
   */
  private setupAppFeatures(): void {
    // Set up file handling if supported
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        if (launchParams.files && launchParams.files.length) {
          // Handle file imports
          this.handleFileImport(launchParams.files);
        }
      });
    }

    // Set up share target if supported
    if ('serviceWorker' in navigator && 'share' in navigator) {
      // Share functionality is handled by the manifest
      console.log('Web Share API supported');
    }
  }

  /**
   * Get PWA installation status
   */
  public getInstallPrompt(): PWAInstallPrompt {
    const platform = this.detectPlatform();
    const isInstalled = this.isAppInstalled();
    
    return {
      canInstall: !!this.deferredPrompt && !isInstalled,
      isInstalled,
      isInstallable: !!this.deferredPrompt,
      platform,
      prompt: this.deferredPrompt
    };
  }

  /**
   * Detect platform for install instructions
   */
  private detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }
    
    if (/android/.test(userAgent)) {
      return 'android';
    }
    
    if (/windows|macintosh|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  /**
   * Check if app is installed
   */
  private isAppInstalled(): boolean {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // Check for navigator.standalone (iOS)
    if ('standalone' in navigator && (navigator as any).standalone) {
      return true;
    }
    
    return false;
  }

  /**
   * Trigger install prompt
   */
  public async promptInstall(): Promise<{ success: boolean; outcome?: string }> {
    if (!this.deferredPrompt) {
      return { success: false, outcome: 'No install prompt available' };
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;
      
      // Clear the prompt
      this.deferredPrompt = null;
      
      return { success: outcome === 'accepted', outcome };
    } catch (error) {
      console.error('Install prompt failed:', error);
      return { success: false, outcome: 'Prompt failed' };
    }
  }

  /**
   * Get PWA capabilities
   */
  public getCapabilities(): PWACapabilities {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window && 'Notification' in window,
      installPrompt: !!this.deferredPrompt,
      offlineSupport: 'serviceWorker' in navigator && 'caches' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype,
      sharing: 'share' in navigator,
      fileHandling: 'launchQueue' in window
    };
  }

  /**
   * Check for app updates
   */
  public async checkForUpdates(): Promise<PWAUpdateStatus> {
    if (!this.registration) {
      return {
        hasUpdate: false,
        isUpdating: false,
        updateAvailable: false
      };
    }

    try {
      await this.registration.update();
      
      const hasUpdate = !!this.registration.waiting;
      
      return {
        hasUpdate,
        isUpdating: false,
        updateAvailable: hasUpdate
      };
    } catch (error) {
      console.error('Update check failed:', error);
      return {
        hasUpdate: false,
        isUpdating: false,
        updateAvailable: false
      };
    }
  }

  /**
   * Apply pending update
   */
  public async applyUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      throw new Error('No update available');
    }

    // Tell the waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page to activate the new service worker
    window.location.reload();
  }

  /**
   * Generate dynamic manifest
   */
  public generateManifest(config: PWAConfig): object {
    return {
      name: config.appName,
      short_name: config.shortName,
      description: config.description,
      start_url: config.startUrl,
      scope: config.scope,
      display: 'standalone',
      display_override: ['window-controls-overlay', 'minimal-ui'],
      orientation: 'portrait-primary',
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      lang: 'en',
      dir: 'ltr',
      icons: config.icons,
      screenshots: config.screenshots || [],
      shortcuts: config.shortcuts || [],
      categories: ['news', 'education', 'business', 'productivity'],
      related_applications: [],
      prefer_related_applications: false,
      edge_side_panel: {
        preferred_width: 400
      },
      launch_handler: {
        client_mode: 'focus-existing'
      },
      handle_links: 'preferred',
      protocol_handlers: [
        {
          protocol: 'web+cms',
          url: '/share?url=%s'
        }
      ],
      share_target: {
        action: '/share',
        method: 'POST',
        params: {
          title: 'title',
          text: 'text',
          url: 'url'
        }
      },
      file_handlers: [
        {
          action: '/import',
          accept: {
            'text/markdown': ['.md'],
            'text/plain': ['.txt']
          }
        }
      ]
    };
  }

  /**
   * Get install instructions for current platform
   */
  public getInstallInstructions(): {
    platform: string;
    instructions: string[];
    canPrompt: boolean;
  } {
    const platform = this.detectPlatform();
    const canPrompt = !!this.deferredPrompt;

    const instructions = {
      ios: [
        'Open this page in Safari',
        'Tap the Share button (square with arrow)',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install the app'
      ],
      android: canPrompt ? [
        'Tap the "Install App" button when it appears',
        'Or tap the three dots menu and select "Install app"'
      ] : [
        'Open this page in Chrome',
        'Tap the three dots menu',
        'Select "Install app" or "Add to Home screen"'
      ],
      desktop: canPrompt ? [
        'Click the "Install App" button in the address bar',
        'Or click the install icon that appears'
      ] : [
        'Open this page in Chrome or Edge',
        'Look for the install icon in the address bar',
        'Click it to install the app'
      ],
      unknown: [
        'Open this page in a modern browser',
        'Look for install options in your browser menu',
        'Follow your browser\'s installation prompts'
      ]
    };

    return {
      platform,
      instructions: instructions[platform],
      canPrompt
    };
  }

  /**
   * Handle file import from launch queue
   */
  private async handleFileImport(files: FileSystemFileHandle[]): Promise<void> {
    try {
      for (const fileHandle of files) {
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        // Dispatch custom event for file import
        window.dispatchEvent(new CustomEvent('pwa:fileImport', {
          detail: { file, content, handle: fileHandle }
        }));
      }
    } catch (error) {
      console.error('File import failed:', error);
    }
  }

  /**
   * Add update status listener
   */
  public onUpdateStatusChange(handler: (status: PWAUpdateStatus) => void): () => void {
    this.updateHandlers.add(handler);
    
    // Return cleanup function
    return () => {
      this.updateHandlers.delete(handler);
    };
  }

  /**
   * Set install prompt handler
   */
  public onInstallPromptAvailable(handler: (event: any) => void): void {
    this.installPromptHandler = handler;
  }

  /**
   * Notify update handlers
   */
  private notifyUpdateHandlers(status: PWAUpdateStatus): void {
    this.updateHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Update handler error:', error);
      }
    });
  }

  /**
   * Get current online status
   */
  public isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Share content using Web Share API
   */
  public async shareContent(data: {
    title?: string;
    text?: string;
    url?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!('share' in navigator)) {
      return { success: false, error: 'Web Share API not supported' };
    }

    try {
      await navigator.share(data);
      return { success: true };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, error: 'Share cancelled by user' };
      }
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Show local notification
   */
  public async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-96x96.png',
        ...options
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options
      });
    }
  }

  /**
   * Clear all caches (for troubleshooting)
   */
  public async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );

    console.log('All caches cleared');
  }

  /**
   * Get cache usage information
   */
  public async getCacheInfo(): Promise<{
    caches: { name: string; size: number }[];
    totalSize: number;
  }> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    const cacheNames = await caches.keys();
    const cacheInfo = [];
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      let cacheSize = 0;

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          cacheSize += blob.size;
        }
      }

      cacheInfo.push({ name: cacheName, size: cacheSize });
      totalSize += cacheSize;
    }

    return { caches: cacheInfo, totalSize };
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance(); 