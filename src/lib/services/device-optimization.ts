'use client';

export interface DeviceOptimization {
  id: string;
  name: string;
  description: string;
  targetDevices: string[];
  targetOS: string[];
  targetBrowsers: string[];
  cssRules: string;
  jsOptimizations: (() => void)[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface AndroidOptimization {
  version: string;
  apiLevel: number;
  optimizations: DeviceOptimization[];
  issues: string[];
  recommendations: string[];
}

export interface IOSOptimization {
  version: string;
  optimizations: DeviceOptimization[];
  issues: string[];
  recommendations: string[];
}

export interface TabletOptimization {
  orientation: 'portrait' | 'landscape' | 'both';
  breakpoints: { min: number; max: number };
  optimizations: DeviceOptimization[];
}

export interface PerformanceOptimization {
  memoryConstraints: boolean;
  cpuOptimization: boolean;
  networkOptimization: boolean;
  batteryOptimization: boolean;
  optimizations: DeviceOptimization[];
}

class DeviceOptimizationService {
  private appliedOptimizations: Set<string> = new Set();
  private styleElement: HTMLStyleElement | null = null;
  private isInitialized = false;
  private orientationObserver: MediaQueryList | null = null;

  // Android version compatibility matrix
  private androidCompatibility: Record<string, AndroidOptimization> = {
    '14': {
      version: '14',
      apiLevel: 34,
      optimizations: [],
      issues: [],
      recommendations: ['Use latest WebView features', 'Optimize for predictive back'],
    },
    '13': {
      version: '13',
      apiLevel: 33,
      optimizations: [],
      issues: [],
      recommendations: ['Test themed icons', 'Optimize for dynamic color'],
    },
    '12': {
      version: '12',
      apiLevel: 31,
      optimizations: [],
      issues: ['Limited CSS Grid support in some WebView versions'],
      recommendations: ['Use flexbox fallbacks', 'Test notification permissions'],
    },
    '11': {
      version: '11',
      apiLevel: 30,
      optimizations: [],
      issues: ['Scoped storage changes', 'Background location restrictions'],
      recommendations: ['Update file access patterns', 'Test location permissions'],
    },
    '10': {
      version: '10',
      apiLevel: 29,
      optimizations: [],
      issues: ['Dark theme support required', 'Gesture navigation'],
      recommendations: ['Implement dark theme', 'Test edge-to-edge display'],
    },
    '9': {
      version: '9',
      apiLevel: 28,
      optimizations: [],
      issues: ['Network security config', 'Apache HTTP client removed'],
      recommendations: ['Use HTTPS', 'Migrate to OkHttp'],
    },
    '8': {
      version: '8',
      apiLevel: 26,
      optimizations: [],
      issues: ['Background execution limits', 'Notification channels'],
      recommendations: ['Optimize background tasks', 'Implement notification channels'],
    },
    '7': {
      version: '7',
      apiLevel: 24,
      optimizations: [],
      issues: ['File provider required', 'Multi-window mode'],
      recommendations: ['Use FileProvider', 'Test multi-window layouts'],
    },
  };

  // iOS version compatibility matrix
  private iosCompatibility: Record<string, IOSOptimization> = {
    '17': {
      version: '17',
      optimizations: [],
      issues: [],
      recommendations: ['Use iOS 17 WebKit features', 'Test StandBy mode'],
    },
    '16': {
      version: '16',
      optimizations: [],
      issues: [],
      recommendations: ['Test Lock Screen widgets', 'Use Safari 16 features'],
    },
    '15': {
      version: '15',
      optimizations: [],
      issues: [],
      recommendations: ['Test Focus modes', 'Use Safari 15 features'],
    },
    '14': {
      version: '14',
      optimizations: [],
      issues: ['App Library considerations', 'Widget support'],
      recommendations: ['Optimize for widgets', 'Test App Clips'],
    },
    '13': {
      version: '13',
      optimizations: [],
      issues: ['Dark mode required', 'Sign in with Apple'],
      recommendations: ['Implement dark mode', 'Add Sign in with Apple'],
    },
    '12': {
      version: '12',
      optimizations: [],
      issues: ['Shortcuts app integration', 'Screen Time API'],
      recommendations: ['Add Shortcuts support', 'Optimize for Screen Time'],
    },
  };

  private deviceOptimizations: DeviceOptimization[] = [
    {
      id: 'android-safe-area',
      name: 'Android Safe Area',
      description: 'Handle Android notches and edge-to-edge display',
      targetDevices: ['mobile'],
      targetOS: ['android'],
      targetBrowsers: ['chrome', 'samsung'],
      cssRules: `
        @supports (padding: env(safe-area-inset-top)) {
          .safe-area-top { padding-top: env(safe-area-inset-top); }
          .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
          .safe-area-left { padding-left: env(safe-area-inset-left); }
          .safe-area-right { padding-right: env(safe-area-inset-right); }
        }
        
        /* Android-specific notch handling */
        @media screen and (max-width: 768px) {
          .android-notch-padding {
            padding-top: max(24px, env(safe-area-inset-top));
          }
        }
      `,
      jsOptimizations: [
        () => this.handleAndroidGestureNavigation(),
        () => this.optimizeAndroidKeyboard(),
      ],
      priority: 'high',
      enabled: true,
    },
    {
      id: 'ios-safe-area',
      name: 'iOS Safe Area',
      description: 'Handle iOS notches and home indicator',
      targetDevices: ['mobile'],
      targetOS: ['ios'],
      targetBrowsers: ['safari'],
      cssRules: `
        @supports (padding: env(safe-area-inset-top)) {
          .ios-safe-area {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }
        
        /* iOS-specific home indicator spacing */
        .ios-home-indicator {
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        
        /* iPhone X series and newer */
        @media only screen 
          and (device-width: 375px) 
          and (device-height: 812px) 
          and (-webkit-device-pixel-ratio: 3) {
          .iphone-x-optimization {
            --notch-height: 44px;
            --home-indicator-height: 34px;
          }
        }
      `,
      jsOptimizations: [
        () => this.handleIOSViewport(),
        () => this.optimizeIOSScrolling(),
      ],
      priority: 'high',
      enabled: true,
    },
    {
      id: 'android-webview-optimization',
      name: 'Android WebView Optimization',
      description: 'Optimize for Android WebView performance',
      targetDevices: ['mobile'],
      targetOS: ['android'],
      targetBrowsers: ['chrome'],
      cssRules: `
        /* Android WebView performance optimizations */
        .android-webview-optimized {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* Reduce paint operations on Android */
        .android-scroll-optimization {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }
        
        /* Android-specific font rendering */
        .android-text-optimization {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `,
      jsOptimizations: [
        () => this.optimizeAndroidWebView(),
        () => this.handleAndroidBackButton(),
      ],
      priority: 'medium',
      enabled: true,
    },
    {
      id: 'samsung-browser-optimization',
      name: 'Samsung Browser Optimization',
      description: 'Specific optimizations for Samsung Internet',
      targetDevices: ['mobile'],
      targetOS: ['android'],
      targetBrowsers: ['samsung'],
      cssRules: `
        /* Samsung Internet specific optimizations */
        .samsung-browser-fix {
          /* Fix for Samsung Internet video playback */
          video::-webkit-media-controls-fullscreen-button {
            display: none !important;
          }
        }
        
        /* Samsung DeX mode optimization */
        @media screen and (min-width: 1024px) and (-webkit-min-device-pixel-ratio: 1) {
          .samsung-dex-mode {
            /* Desktop-like layout for DeX mode */
            max-width: 1200px;
            margin: 0 auto;
          }
        }
      `,
      jsOptimizations: [
        () => this.optimizeSamsungBrowser(),
        () => this.handleSamsungDexMode(),
      ],
      priority: 'low',
      enabled: true,
    },
    {
      id: 'tablet-optimization',
      name: 'Tablet Layout Optimization',
      description: 'Responsive layouts for tablet devices',
      targetDevices: ['tablet'],
      targetOS: ['android', 'ios'],
      targetBrowsers: ['chrome', 'safari', 'samsung'],
      cssRules: `
        /* Tablet-specific optimizations */
        @media screen and (min-width: 768px) and (max-width: 1024px) {
          .tablet-layout {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 24px;
          }
          
          .tablet-sidebar {
            position: sticky;
            top: 20px;
            height: fit-content;
          }
          
          .tablet-content {
            max-width: none;
          }
        }
        
        /* Tablet orientation handling */
        @media screen and (orientation: landscape) and (max-height: 768px) {
          .tablet-landscape {
            padding: 12px;
          }
          
          .tablet-landscape .header {
            height: 48px;
          }
        }
        
        @media screen and (orientation: portrait) and (min-width: 768px) {
          .tablet-portrait {
            padding: 24px;
          }
          
          .tablet-portrait .content {
            max-width: 600px;
            margin: 0 auto;
          }
        }
      `,
      jsOptimizations: [
        () => this.optimizeTabletLayout(),
        () => this.handleTabletOrientation(),
      ],
      priority: 'medium',
      enabled: true,
    },
    {
      id: 'low-memory-optimization',
      name: 'Low Memory Device Optimization',
      description: 'Optimizations for devices with limited memory',
      targetDevices: ['mobile', 'tablet'],
      targetOS: ['android', 'ios'],
      targetBrowsers: ['chrome', 'safari', 'samsung', 'firefox'],
      cssRules: `
        /* Low memory device optimizations */
        .low-memory-mode {
          /* Reduce complex animations */
          * {
            animation-duration: 0.1s !important;
            transition-duration: 0.1s !important;
          }
          
          /* Simplify shadows and effects */
          .card, .modal, .dropdown {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }
          
          /* Reduce gradient complexity */
          .gradient {
            background: solid-color !important;
          }
        }
      `,
      jsOptimizations: [
        () => this.optimizeForLowMemory(),
        () => this.reduceDOMComplexity(),
      ],
      priority: 'critical',
      enabled: false, // Enabled based on device capabilities
    },
    {
      id: 'firefox-mobile-optimization',
      name: 'Firefox Mobile Optimization',
      description: 'Specific optimizations for Firefox on mobile',
      targetDevices: ['mobile'],
      targetOS: ['android', 'ios'],
      targetBrowsers: ['firefox'],
      cssRules: `
        /* Firefox mobile specific fixes */
        .firefox-mobile-fix {
          /* Fix for Firefox mobile viewport issues */
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }
        
        /* Firefox mobile scroll optimization */
        .firefox-scroll-fix {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Firefox mobile form styling */
        input, textarea, select {
          -moz-appearance: none;
          appearance: none;
        }
      `,
      jsOptimizations: [
        () => this.optimizeFirefoxMobile(),
        () => this.handleFirefoxViewport(),
      ],
      priority: 'medium',
      enabled: true,
    },
  ];

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the device optimization service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create style element for device-specific CSS
      this.createStyleElement();

      // Detect device and apply optimizations
      await this.detectAndApplyOptimizations();

      // Setup orientation change listener
      this.setupOrientationObserver();

      // Setup memory pressure listener
      this.setupMemoryPressureListener();

      this.isInitialized = true;
      console.log('Device Optimization Service initialized');
    } catch (error) {
      console.error('Failed to initialize Device Optimization Service:', error);
    }
  }

  /**
   * Create style element for device optimizations
   */
  private createStyleElement(): void {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'device-optimization-styles';
    document.head.appendChild(this.styleElement);
  }

  /**
   * Detect device and apply appropriate optimizations
   */
  private async detectAndApplyOptimizations(): Promise<void> {
    const userAgent = navigator.userAgent.toLowerCase();
    const deviceInfo = this.getDeviceInfo();

    // Apply optimizations based on device type and OS
    for (const optimization of this.deviceOptimizations) {
      if (this.shouldApplyOptimization(optimization, deviceInfo)) {
        this.applyOptimization(optimization);
      }
    }

    // Apply Android-specific optimizations
    if (deviceInfo.os === 'android') {
      await this.applyAndroidOptimizations(deviceInfo.osVersion);
    }

    // Apply iOS-specific optimizations
    if (deviceInfo.os === 'ios') {
      await this.applyIOSOptimizations(deviceInfo.osVersion);
    }

    // Apply memory-based optimizations
    if (this.isLowMemoryDevice()) {
      this.enableLowMemoryMode();
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    return {
      type: this.getDeviceType(),
      os: this.getOS(userAgent),
      osVersion: this.getOSVersion(userAgent),
      browser: this.getBrowser(userAgent),
      browserVersion: this.getBrowserVersion(userAgent),
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
      },
    };
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const maxDimension = Math.max(screenWidth, window.screen.height);

    if (userAgent.includes('ipad') || (maxDimension >= 768 && maxDimension < 1024)) {
      return 'tablet';
    }
    if (userAgent.includes('mobile') || maxDimension < 768) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get operating system
   */
  private getOS(userAgent: string): string {
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  /**
   * Get OS version
   */
  private getOSVersion(userAgent: string): string {
    let match;
    
    // iOS version
    match = userAgent.match(/os (\d+)_(\d+)/);
    if (match) return `${match[1]}.${match[2]}`;

    // Android version
    match = userAgent.match(/android (\d+(?:\.\d+)*)/);
    if (match) return match[1];

    return 'unknown';
  }

  /**
   * Get browser
   */
  private getBrowser(userAgent: string): string {
    if (userAgent.includes('samsungbrowser')) return 'samsung';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    return 'unknown';
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(userAgent: string): string {
    let match;
    
    match = userAgent.match(/samsungbrowser\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    match = userAgent.match(/firefox\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    match = userAgent.match(/chrome\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    match = userAgent.match(/version\/(\d+(?:\.\d+)*)/);
    if (match && userAgent.includes('safari')) return match[1];

    return 'unknown';
  }

  /**
   * Check if optimization should be applied
   */
  private shouldApplyOptimization(optimization: DeviceOptimization, deviceInfo: any): boolean {
    if (!optimization.enabled) return false;

    const deviceMatch = optimization.targetDevices.length === 0 || 
                       optimization.targetDevices.includes(deviceInfo.type);
    const osMatch = optimization.targetOS.length === 0 || 
                   optimization.targetOS.includes(deviceInfo.os);
    const browserMatch = optimization.targetBrowsers.length === 0 || 
                        optimization.targetBrowsers.includes(deviceInfo.browser);

    return deviceMatch && osMatch && browserMatch;
  }

  /**
   * Apply optimization
   */
  private applyOptimization(optimization: DeviceOptimization): void {
    if (this.appliedOptimizations.has(optimization.id)) return;

    // Apply CSS rules
    if (optimization.cssRules && this.styleElement) {
      this.styleElement.textContent += `\n/* ${optimization.name} */\n${optimization.cssRules}\n`;
    }

    // Apply JavaScript optimizations
    optimization.jsOptimizations.forEach(optimization => {
      try {
        optimization();
      } catch (error) {
        console.error(`Failed to apply JS optimization for ${optimization.id}:`, error);
      }
    });

    this.appliedOptimizations.add(optimization.id);
    console.log(`Applied optimization: ${optimization.name}`);
  }

  /**
   * Apply Android-specific optimizations
   */
  private async applyAndroidOptimizations(osVersion: string): Promise<void> {
    const majorVersion = osVersion.split('.')[0];
    const androidOpt = this.androidCompatibility[majorVersion];

    if (!androidOpt) return;

    // Apply version-specific optimizations
    androidOpt.optimizations.forEach(opt => this.applyOptimization(opt));

    // Add Android-specific body classes
    document.body.classList.add('android-device', `android-${majorVersion}`);

    // Handle Android-specific issues
    this.handleAndroidSpecificIssues(majorVersion);
  }

  /**
   * Apply iOS-specific optimizations
   */
  private async applyIOSOptimizations(osVersion: string): Promise<void> {
    const majorVersion = osVersion.split('.')[0];
    const iosOpt = this.iosCompatibility[majorVersion];

    if (!iosOpt) return;

    // Apply version-specific optimizations
    iosOpt.optimizations.forEach(opt => this.applyOptimization(opt));

    // Add iOS-specific body classes
    document.body.classList.add('ios-device', `ios-${majorVersion}`);

    // Handle iOS-specific issues
    this.handleIOSSpecificIssues(majorVersion);
  }

  /**
   * Handle Android-specific issues
   */
  private handleAndroidSpecificIssues(version: string): void {
    const versionNum = parseInt(version);

    // Android 12+ themed icons
    if (versionNum >= 12) {
      this.handleThemedIcons();
    }

    // Android 10+ dark theme
    if (versionNum >= 10) {
      this.handleAndroidDarkTheme();
    }

    // Android 9+ network security
    if (versionNum >= 9) {
      this.handleNetworkSecurity();
    }
  }

  /**
   * Handle iOS-specific issues
   */
  private handleIOSSpecificIssues(version: string): void {
    const versionNum = parseInt(version);

    // iOS 15+ Safari tab bar
    if (versionNum >= 15) {
      this.handleIOSSafariTabBar();
    }

    // iOS 13+ dark mode
    if (versionNum >= 13) {
      this.handleIOSDarkMode();
    }

    // iOS 11+ safe area
    if (versionNum >= 11) {
      this.handleIOSSafeArea();
    }
  }

  /**
   * Check if device has low memory
   */
  private isLowMemoryDevice(): boolean {
    // Check device memory if available
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      return deviceMemory <= 2; // 2GB or less
    }

    // Check performance memory if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const totalMemory = memory.jsHeapSizeLimit;
      return totalMemory < 1073741824; // Less than 1GB JS heap
    }

    // Fallback: check user agent for low-end devices
    const userAgent = navigator.userAgent.toLowerCase();
    const lowEndIndicators = ['android 4', 'android 5', 'android 6', 'go edition'];
    
    return lowEndIndicators.some(indicator => userAgent.includes(indicator));
  }

  /**
   * Enable low memory mode
   */
  private enableLowMemoryMode(): void {
    const lowMemoryOpt = this.deviceOptimizations.find(opt => opt.id === 'low-memory-optimization');
    if (lowMemoryOpt) {
      lowMemoryOpt.enabled = true;
      this.applyOptimization(lowMemoryOpt);
    }

    document.body.classList.add('low-memory-device');
  }

  /**
   * Setup orientation observer
   */
  private setupOrientationObserver(): void {
    this.orientationObserver = window.matchMedia('(orientation: landscape)');
    this.orientationObserver.addEventListener('change', (e) => {
      this.handleOrientationChange(e.matches ? 'landscape' : 'portrait');
    });
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(orientation: 'landscape' | 'portrait'): void {
    document.body.classList.remove('orientation-landscape', 'orientation-portrait');
    document.body.classList.add(`orientation-${orientation}`);

    // Apply orientation-specific optimizations
    if (this.getDeviceType() === 'tablet') {
      this.optimizeTabletLayout();
    }

    // Trigger resize event for components
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Setup memory pressure listener
   */
  private setupMemoryPressureListener(): void {
    // Listen for memory pressure events (if supported)
    if ('onmemorywarning' in window) {
      window.addEventListener('memorywarning', () => {
        this.handleMemoryPressure();
      });
    }

    // Periodic memory check
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle memory pressure
   */
  private handleMemoryPressure(): void {
    console.warn('Memory pressure detected - applying optimizations');
    
    if (!document.body.classList.contains('low-memory-device')) {
      this.enableLowMemoryMode();
    }

    // Additional memory optimizations
    this.clearImageCache();
    this.reduceDOMComplexity();
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (memoryUsage > 0.9) {
        this.handleMemoryPressure();
      }
    }
  }

  /**
   * Device-specific optimization methods
   */
  private handleAndroidGestureNavigation(): void {
    // Handle Android 10+ gesture navigation
    const isGestureNav = window.matchMedia('(display-mode: fullscreen)').matches;
    if (isGestureNav) {
      document.body.classList.add('android-gesture-nav');
    }
  }

  private optimizeAndroidKeyboard(): void {
    // Handle Android keyboard appearance
    let initialViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const keyboardHeight = initialViewportHeight - currentHeight;
      
      if (keyboardHeight > 150) {
        document.body.classList.add('keyboard-open');
        document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      } else {
        document.body.classList.remove('keyboard-open');
        document.body.style.removeProperty('--keyboard-height');
      }
    });
  }

  private handleIOSViewport(): void {
    // Fix iOS viewport height issues
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
    });
  }

  private optimizeIOSScrolling(): void {
    // Enable momentum scrolling on iOS
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Fix iOS scroll bounce on body
    document.body.addEventListener('touchmove', (e) => {
      if (document.body.scrollTop === 0) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  private optimizeAndroidWebView(): void {
    // Enable hardware acceleration
    document.body.style.transform = 'translateZ(0)';
    
    // Optimize text rendering
    document.body.style.textRendering = 'optimizeLegibility';
    document.body.style.webkitFontSmoothing = 'antialiased';
  }

  private handleAndroidBackButton(): void {
    // Handle Android hardware back button
    window.addEventListener('popstate', (e) => {
      // Custom back button handling
      const modals = document.querySelectorAll('.modal:not(.hidden)');
      if (modals.length > 0) {
        e.preventDefault();
        const topModal = modals[modals.length - 1] as HTMLElement;
        const closeButton = topModal.querySelector('[data-dismiss="modal"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    });
  }

  private optimizeSamsungBrowser(): void {
    // Samsung Internet specific optimizations
    document.body.classList.add('samsung-internet');
    
    // Handle Samsung DeX mode detection
    const isDeXMode = window.screen.width >= 1024 && window.devicePixelRatio === 1;
    if (isDeXMode) {
      document.body.classList.add('samsung-dex-mode');
    }
  }

  private handleSamsungDexMode(): void {
    // Optimize for Samsung DeX desktop mode
    const mediaQuery = window.matchMedia('(min-width: 1024px) and (-webkit-min-device-pixel-ratio: 1)');
    
    const handleDeXMode = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.body.classList.add('dex-mode');
        // Enable desktop-like interactions
        document.body.style.cursor = 'default';
      } else {
        document.body.classList.remove('dex-mode');
        document.body.style.cursor = '';
      }
    };

    handleDeXMode(mediaQuery);
    mediaQuery.addEventListener('change', handleDeXMode);
  }

  private optimizeTabletLayout(): void {
    const isTablet = this.getDeviceType() === 'tablet';
    if (!isTablet) return;

    document.body.classList.add('tablet-device');
    
    // Optimize touch targets for tablet
    const elements = document.querySelectorAll('button, a, input, select');
    elements.forEach(el => {
      (el as HTMLElement).style.minHeight = '48px';
      (el as HTMLElement).style.minWidth = '48px';
    });
  }

  private handleTabletOrientation(): void {
    // Specific tablet orientation handling
    const updateTabletLayout = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      
      if (isLandscape) {
        document.body.classList.add('tablet-landscape');
        document.body.classList.remove('tablet-portrait');
      } else {
        document.body.classList.add('tablet-portrait');
        document.body.classList.remove('tablet-landscape');
      }
    };

    updateTabletLayout();
    window.addEventListener('orientationchange', () => {
      setTimeout(updateTabletLayout, 100);
    });
  }

  private optimizeForLowMemory(): void {
    // Reduce image quality
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.src.includes('quality=')) {
        const separator = img.src.includes('?') ? '&' : '?';
        img.src += `${separator}quality=60`;
      }
    });

    // Disable complex animations
    document.body.classList.add('reduced-animations');
  }

  private reduceDOMComplexity(): void {
    // Remove non-essential elements
    const nonEssential = document.querySelectorAll('.decoration, .animation-only');
    nonEssential.forEach(el => el.remove());

    // Simplify complex selectors
    const complexElements = document.querySelectorAll('[class*="gradient"], [class*="shadow"]');
    complexElements.forEach(el => {
      el.classList.add('simplified');
    });
  }

  private optimizeFirefoxMobile(): void {
    // Firefox mobile specific optimizations
    document.body.classList.add('firefox-mobile');
    
    // Fix viewport height
    const fixFirefoxViewport = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--firefox-vh', `${vh}px`);
    };

    fixFirefoxViewport();
    window.addEventListener('resize', fixFirefoxViewport);
  }

  private handleFirefoxViewport(): void {
    // Firefox mobile viewport handling
    const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (meta && navigator.userAgent.toLowerCase().includes('firefox')) {
      meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    }
  }

  private handleThemedIcons(): void {
    // Android 12+ themed icons
    const iconLinks = document.querySelectorAll('link[rel*="icon"]');
    iconLinks.forEach(link => {
      const href = (link as HTMLLinkElement).href;
      if (href && !href.includes('themed')) {
        // Add themed icon variant if available
        const themedHref = href.replace('.png', '-themed.png');
        const themedLink = document.createElement('link');
        themedLink.rel = 'icon';
        themedLink.href = themedHref;
        themedLink.type = 'image/png';
        document.head.appendChild(themedLink);
      }
    });
  }

  private handleAndroidDarkTheme(): void {
    // Android dark theme handling
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.body.classList.add('android-dark-theme');
      } else {
        document.body.classList.remove('android-dark-theme');
      }
    };

    updateTheme(prefersDark);
    prefersDark.addEventListener('change', updateTheme);
  }

  private handleNetworkSecurity(): void {
    // Ensure HTTPS is used for sensitive operations
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('HTTPS required for secure operation on Android 9+');
    }
  }

  private handleIOSSafariTabBar(): void {
    // iOS 15+ Safari tab bar handling
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#ffffff';
    meta.media = '(prefers-color-scheme: light)';
    document.head.appendChild(meta);

    const metaDark = document.createElement('meta');
    metaDark.name = 'theme-color';
    metaDark.content = '#000000';
    metaDark.media = '(prefers-color-scheme: dark)';
    document.head.appendChild(metaDark);
  }

  private handleIOSDarkMode(): void {
    // iOS dark mode handling
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.body.classList.add('ios-dark-mode');
      } else {
        document.body.classList.remove('ios-dark-mode');
      }
    };

    updateTheme(prefersDark);
    prefersDark.addEventListener('change', updateTheme);
  }

  private handleIOSSafeArea(): void {
    // iOS safe area handling
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top, 0px);
        --safe-area-inset-right: env(safe-area-inset-right, 0px);
        --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-inset-left: env(safe-area-inset-left, 0px);
      }
    `;
    document.head.appendChild(style);
  }

  private clearImageCache(): void {
    // Clear image cache to free memory
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getBoundingClientRect().top < window.innerHeight) {
        img.src = '';
      }
    });
  }

  /**
   * Public methods
   */
  public getAppliedOptimizations(): string[] {
    return Array.from(this.appliedOptimizations);
  }

  public getCompatibilityInfo(): { android: AndroidOptimization | null; ios: IOSOptimization | null } {
    const deviceInfo = this.getDeviceInfo();
    const majorVersion = deviceInfo.osVersion.split('.')[0];

    return {
      android: deviceInfo.os === 'android' ? this.androidCompatibility[majorVersion] || null : null,
      ios: deviceInfo.os === 'ios' ? this.iosCompatibility[majorVersion] || null : null,
    };
  }

  public forceOptimization(optimizationId: string): void {
    const optimization = this.deviceOptimizations.find(opt => opt.id === optimizationId);
    if (optimization) {
      optimization.enabled = true;
      this.applyOptimization(optimization);
    }
  }

  public disableOptimization(optimizationId: string): void {
    this.appliedOptimizations.delete(optimizationId);
    
    const optimization = this.deviceOptimizations.find(opt => opt.id === optimizationId);
    if (optimization) {
      optimization.enabled = false;
    }
  }

  public cleanup(): void {
    if (this.orientationObserver) {
      this.orientationObserver.removeEventListener('change', () => {});
    }

    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    this.appliedOptimizations.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const deviceOptimizationService = new DeviceOptimizationService();
export default deviceOptimizationService; 