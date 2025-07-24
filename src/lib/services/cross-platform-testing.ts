'use client';

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  osVersion: string;
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'unknown';
  browserVersion: string;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
    orientation: 'portrait' | 'landscape';
  };
  support: BrowserCapabilities;
}

export interface BrowserCapabilities {
  touchEvents: boolean;
  gestures: boolean;
  webGL: boolean;
  serviceWorker: boolean;
  pushNotifications: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
  webShare: boolean;
  clipboard: boolean;
  vibration: boolean;
  fullscreen: boolean;
  webAssembly: boolean;
  webRTC: boolean;
  geolocation: boolean;
  deviceMotion: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  webWorkers: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  mediaQueries: boolean;
  cssGrid: boolean;
  cssFlexbox: boolean;
  cssCustomProperties: boolean;
  es6: boolean;
  webp: boolean;
  avif: boolean;
  webm: boolean;
}

export interface TestResult {
  id: string;
  testName: string;
  category: 'layout' | 'functionality' | 'performance' | 'accessibility' | 'pwa';
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  details?: any;
  timestamp: Date;
  device: DeviceInfo;
}

export interface CompatibilityReport {
  deviceInfo: DeviceInfo;
  overallScore: number;
  testResults: TestResult[];
  recommendations: string[];
  criticalIssues: TestResult[];
  warnings: TestResult[];
  passed: TestResult[];
}

export interface PWAInstallability {
  canInstall: boolean;
  manifest: any;
  serviceWorker: boolean;
  httpsRequired: boolean;
  manifestValid: boolean;
  iconsSufficient: boolean;
  startUrlAccessible: boolean;
  installPromptAvailable: boolean;
  installationMethod: 'browser' | 'store' | 'manual' | 'none';
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

class CrossPlatformTestingService {
  private deviceInfo: DeviceInfo;
  private testResults: TestResult[] = [];
  private compatibilityCache: Map<string, CompatibilityReport> = new Map();
  private isInitialized = false;

  constructor() {
    this.deviceInfo = this.detectDeviceInfo();
    this.initializeService();
  }

  /**
   * Initialize the testing service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Run initial compatibility tests
      await this.runCompatibilityTests();
      
      this.isInitialized = true;
      console.log('Cross-Platform Testing Service initialized');
    } catch (error) {
      console.error('Failed to initialize Cross-Platform Testing Service:', error);
    }
  }

  /**
   * Detect comprehensive device information
   */
  private detectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    
    return {
      type: this.detectDeviceType(),
      os: this.detectOS(userAgent),
      osVersion: this.detectOSVersion(userAgent),
      browser: this.detectBrowser(userAgent),
      browserVersion: this.detectBrowserVersion(userAgent),
      screen: this.getScreenInfo(),
      support: this.detectBrowserCapabilities(),
    };
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const maxDimension = Math.max(screenWidth, screenHeight);

    // Check for tablet indicators
    if (userAgent.includes('ipad') || 
        (userAgent.includes('tablet') && !userAgent.includes('mobile')) ||
        (maxDimension >= 768 && maxDimension < 1024 && 'ontouchstart' in window)) {
      return 'tablet';
    }

    // Check for mobile indicators
    if (userAgent.includes('mobile') || 
        userAgent.includes('android') && userAgent.includes('mobile') ||
        userAgent.includes('iphone') ||
        userAgent.includes('ipod') ||
        userAgent.includes('blackberry') ||
        userAgent.includes('windows phone') ||
        maxDimension < 768) {
      return 'mobile';
    }

    return 'desktop';
  }

  /**
   * Detect operating system
   */
  private detectOS(userAgent: string): DeviceInfo['os'] {
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      return 'ios';
    }
    if (userAgent.includes('android')) {
      return 'android';
    }
    if (userAgent.includes('windows')) {
      return 'windows';
    }
    if (userAgent.includes('mac os')) {
      return 'macos';
    }
    if (userAgent.includes('linux')) {
      return 'linux';
    }
    return 'unknown';
  }

  /**
   * Detect OS version
   */
  private detectOSVersion(userAgent: string): string {
    let match;
    
    // iOS version
    match = userAgent.match(/os (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    }

    // Android version
    match = userAgent.match(/android (\d+(?:\.\d+)*)/);
    if (match) {
      return match[1];
    }

    // Windows version
    match = userAgent.match(/windows nt (\d+\.\d+)/);
    if (match) {
      return match[1];
    }

    // macOS version
    match = userAgent.match(/mac os x (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    }

    return 'unknown';
  }

  /**
   * Detect browser
   */
  private detectBrowser(userAgent: string): DeviceInfo['browser'] {
    if (userAgent.includes('edg/')) {
      return 'edge';
    }
    if (userAgent.includes('samsungbrowser')) {
      return 'samsung';
    }
    if (userAgent.includes('opr/') || userAgent.includes('opera')) {
      return 'opera';
    }
    if (userAgent.includes('firefox')) {
      return 'firefox';
    }
    if (userAgent.includes('chrome')) {
      return 'chrome';
    }
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return 'safari';
    }
    return 'unknown';
  }

  /**
   * Detect browser version
   */
  private detectBrowserVersion(userAgent: string): string {
    let match;

    // Edge
    match = userAgent.match(/edg\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    // Samsung Browser
    match = userAgent.match(/samsungbrowser\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    // Opera
    match = userAgent.match(/(?:opr|opera)\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    // Firefox
    match = userAgent.match(/firefox\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    // Chrome
    match = userAgent.match(/chrome\/(\d+(?:\.\d+)*)/);
    if (match) return match[1];

    // Safari
    match = userAgent.match(/version\/(\d+(?:\.\d+)*)/);
    if (match && userAgent.includes('safari')) return match[1];

    return 'unknown';
  }

  /**
   * Get screen information
   */
  private getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.width > window.screen.height ? 'landscape' : 'portrait',
    };
  }

  /**
   * Detect browser capabilities
   */
  private detectBrowserCapabilities(): BrowserCapabilities {
    return {
      touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      gestures: 'ongesturestart' in window,
      webGL: this.hasWebGL(),
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window,
      webShare: 'share' in navigator,
      clipboard: 'clipboard' in navigator,
      vibration: 'vibrate' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement ||
                  'webkitRequestFullscreen' in document.documentElement ||
                  'mozRequestFullScreen' in document.documentElement,
      webAssembly: typeof WebAssembly === 'object',
      webRTC: 'RTCPeerConnection' in window,
      geolocation: 'geolocation' in navigator,
      deviceMotion: 'DeviceMotionEvent' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      webWorkers: 'Worker' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      mediaQueries: 'matchMedia' in window,
      cssGrid: this.hasCSSSupport('display', 'grid'),
      cssFlexbox: this.hasCSSSupport('display', 'flex'),
      cssCustomProperties: this.hasCSSCustomProperties(),
      es6: this.hasES6Support(),
      webp: false, // Will be tested asynchronously
      avif: false, // Will be tested asynchronously
      webm: this.hasWebMSupport(),
    };
  }

  /**
   * Check WebGL support
   */
  private hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Check localStorage support
   */
  private hasLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check sessionStorage support
   */
  private hasSessionStorage(): boolean {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check CSS property support
   */
  private hasCSSSupport(property: string, value: string): boolean {
    const element = document.createElement('div');
    element.style.setProperty(property, value);
    return element.style.getPropertyValue(property) === value;
  }

  /**
   * Check CSS custom properties support
   */
  private hasCSSCustomProperties(): boolean {
    return window.CSS && CSS.supports && CSS.supports('color', 'var(--fake-var)');
  }

  /**
   * Check ES6 support
   */
  private hasES6Support(): boolean {
    try {
      eval('class TestClass {}; const test = () => {}; const {a, b} = {a: 1, b: 2};');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check WebM support
   */
  private hasWebMSupport(): boolean {
    const video = document.createElement('video');
    return video.canPlayType('video/webm') !== '';
  }

  /**
   * Test image format support
   */
  private async testImageFormats(): Promise<void> {
    // Test WebP
    this.deviceInfo.support.webp = await this.testImageFormat('data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA');
    
    // Test AVIF
    this.deviceInfo.support.avif = await this.testImageFormat('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=');
  }

  /**
   * Test specific image format support
   */
  private testImageFormat(dataUri: string): Promise<boolean> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = dataUri;
    });
  }

  /**
   * Run comprehensive compatibility tests
   */
  public async runCompatibilityTests(): Promise<CompatibilityReport> {
    const testResults: TestResult[] = [];

    // Test image format support
    await this.testImageFormats();

    // Layout tests
    testResults.push(...this.runLayoutTests());

    // Functionality tests
    testResults.push(...this.runFunctionalityTests());

    // Performance tests
    testResults.push(...(await this.runPerformanceTests()));

    // Accessibility tests
    testResults.push(...this.runAccessibilityTests());

    // PWA tests
    testResults.push(...(await this.runPWATests()));

    this.testResults = testResults;

    const report = this.generateCompatibilityReport(testResults);
    
    // Cache the report
    const cacheKey = this.generateCacheKey();
    this.compatibilityCache.set(cacheKey, report);

    return report;
  }

  /**
   * Run layout tests
   */
  private runLayoutTests(): TestResult[] {
    const tests: TestResult[] = [];

    // Viewport meta tag test
    tests.push(this.createTest(
      'viewport-meta',
      'Viewport Meta Tag',
      'layout',
      this.testViewportMeta()
    ));

    // CSS Grid support
    tests.push(this.createTest(
      'css-grid',
      'CSS Grid Support',
      'layout',
      this.deviceInfo.support.cssGrid ? 'pass' : 'fail',
      this.deviceInfo.support.cssGrid ? 'CSS Grid is supported' : 'CSS Grid is not supported - using flexbox fallback'
    ));

    // CSS Flexbox support
    tests.push(this.createTest(
      'css-flexbox',
      'CSS Flexbox Support',
      'layout',
      this.deviceInfo.support.cssFlexbox ? 'pass' : 'fail',
      this.deviceInfo.support.cssFlexbox ? 'CSS Flexbox is supported' : 'CSS Flexbox is not supported'
    ));

    // Custom properties support
    tests.push(this.createTest(
      'css-custom-properties',
      'CSS Custom Properties',
      'layout',
      this.deviceInfo.support.cssCustomProperties ? 'pass' : 'warning',
      this.deviceInfo.support.cssCustomProperties ? 'CSS Custom Properties supported' : 'CSS Custom Properties not supported - using fallbacks'
    ));

    // Media queries support
    tests.push(this.createTest(
      'media-queries',
      'Media Queries Support',
      'layout',
      this.deviceInfo.support.mediaQueries ? 'pass' : 'fail',
      this.deviceInfo.support.mediaQueries ? 'Media queries are supported' : 'Media queries are not supported'
    ));

    // Responsive images test
    tests.push(this.createTest(
      'responsive-images',
      'Responsive Images',
      'layout',
      this.testResponsiveImages()
    ));

    return tests;
  }

  /**
   * Test viewport meta tag
   */
  private testViewportMeta(): 'pass' | 'fail' {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    return viewportMeta ? 'pass' : 'fail';
  }

  /**
   * Test responsive images support
   */
  private testResponsiveImages(): 'pass' | 'warning' {
    const testImg = document.createElement('img');
    const hasSrcset = 'srcset' in testImg;
    const hasSizes = 'sizes' in testImg;
    const hasPicture = 'HTMLPictureElement' in window;

    if (hasSrcset && hasSizes && hasPicture) {
      return 'pass';
    }
    return 'warning';
  }

  /**
   * Run functionality tests
   */
  private runFunctionalityTests(): TestResult[] {
    const tests: TestResult[] = [];

    // Touch events
    tests.push(this.createTest(
      'touch-events',
      'Touch Events Support',
      'functionality',
      this.deviceInfo.support.touchEvents ? 'pass' : 'warning',
      this.deviceInfo.support.touchEvents ? 'Touch events are supported' : 'Touch events not supported - using mouse events'
    ));

    // Service Worker
    tests.push(this.createTest(
      'service-worker',
      'Service Worker Support',
      'functionality',
      this.deviceInfo.support.serviceWorker ? 'pass' : 'fail',
      this.deviceInfo.support.serviceWorker ? 'Service Worker is supported' : 'Service Worker not supported - PWA features limited'
    ));

    // Push notifications
    tests.push(this.createTest(
      'push-notifications',
      'Push Notifications Support',
      'functionality',
      this.deviceInfo.support.pushNotifications ? 'pass' : 'warning',
      this.deviceInfo.support.pushNotifications ? 'Push notifications supported' : 'Push notifications not supported'
    ));

    // Web Share API
    tests.push(this.createTest(
      'web-share',
      'Web Share API',
      'functionality',
      this.deviceInfo.support.webShare ? 'pass' : 'warning',
      this.deviceInfo.support.webShare ? 'Web Share API supported' : 'Web Share API not supported - using fallback sharing'
    ));

    // Clipboard API
    tests.push(this.createTest(
      'clipboard',
      'Clipboard API',
      'functionality',
      this.deviceInfo.support.clipboard ? 'pass' : 'warning',
      this.deviceInfo.support.clipboard ? 'Clipboard API supported' : 'Clipboard API not supported'
    ));

    // Geolocation
    tests.push(this.createTest(
      'geolocation',
      'Geolocation API',
      'functionality',
      this.deviceInfo.support.geolocation ? 'pass' : 'warning',
      this.deviceInfo.support.geolocation ? 'Geolocation API supported' : 'Geolocation API not supported'
    ));

    // IndexedDB
    tests.push(this.createTest(
      'indexeddb',
      'IndexedDB Support',
      'functionality',
      this.deviceInfo.support.indexedDB ? 'pass' : 'warning',
      this.deviceInfo.support.indexedDB ? 'IndexedDB supported' : 'IndexedDB not supported - using localStorage fallback'
    ));

    return tests;
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Network connection test
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      
      tests.push(this.createTest(
        'network-speed',
        'Network Connection',
        'performance',
        effectiveType === '4g' ? 'pass' : effectiveType === '3g' ? 'warning' : 'fail',
        `Network type: ${effectiveType}, downlink: ${connection.downlink}Mbps`
      ));
    }

    // Memory test
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      tests.push(this.createTest(
        'memory-usage',
        'Memory Usage',
        'performance',
        memoryRatio < 0.8 ? 'pass' : memoryRatio < 0.9 ? 'warning' : 'fail',
        `Memory usage: ${Math.round(memoryRatio * 100)}%`
      ));
    }

    // Battery test
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        const level = battery.level;
        
        tests.push(this.createTest(
          'battery-level',
          'Battery Status',
          'performance',
          level > 0.2 ? 'pass' : 'warning',
          `Battery level: ${Math.round(level * 100)}%, charging: ${battery.charging}`
        ));
      } catch (error) {
        tests.push(this.createTest(
          'battery-level',
          'Battery Status',
          'performance',
          'skip',
          'Battery API not available'
        ));
      }
    }

    // WebGL performance test
    if (this.deviceInfo.support.webGL) {
      const glPerformance = this.testWebGLPerformance();
      tests.push(this.createTest(
        'webgl-performance',
        'WebGL Performance',
        'performance',
        glPerformance.score > 0.7 ? 'pass' : glPerformance.score > 0.4 ? 'warning' : 'fail',
        `WebGL performance score: ${Math.round(glPerformance.score * 100)}%`,
        glPerformance
      ));
    }

    return tests;
  }

  /**
   * Test WebGL performance
   */
  private testWebGLPerformance(): { score: number; renderer: string; vendor: string } {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { score: 0, renderer: 'unknown', vendor: 'unknown' };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';

      // Simple performance test - create a texture and measure time
      const startTime = performance.now();
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.finish();
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      const score = Math.max(0, Math.min(1, 1 - (renderTime / 100))); // Normalize to 0-1

      return { score, renderer, vendor };
    } catch (error) {
      return { score: 0, renderer: 'error', vendor: 'error' };
    }
  }

  /**
   * Run accessibility tests
   */
  private runAccessibilityTests(): TestResult[] {
    const tests: TestResult[] = [];

    // Speech synthesis
    tests.push(this.createTest(
      'speech-synthesis',
      'Speech Synthesis',
      'accessibility',
      this.deviceInfo.support.speechSynthesis ? 'pass' : 'warning',
      this.deviceInfo.support.speechSynthesis ? 'Speech synthesis supported' : 'Speech synthesis not supported'
    ));

    // Speech recognition
    tests.push(this.createTest(
      'speech-recognition',
      'Speech Recognition',
      'accessibility',
      this.deviceInfo.support.speechRecognition ? 'pass' : 'warning',
      this.deviceInfo.support.speechRecognition ? 'Speech recognition supported' : 'Speech recognition not supported'
    ));

    // Vibration
    tests.push(this.createTest(
      'vibration',
      'Vibration API',
      'accessibility',
      this.deviceInfo.support.vibration ? 'pass' : 'warning',
      this.deviceInfo.support.vibration ? 'Vibration API supported' : 'Vibration API not supported'
    ));

    // Screen reader detection
    const hasScreenReader = this.detectScreenReader();
    tests.push(this.createTest(
      'screen-reader',
      'Screen Reader Detection',
      'accessibility',
      hasScreenReader ? 'pass' : 'skip',
      hasScreenReader ? 'Screen reader detected' : 'No screen reader detected'
    ));

    return tests;
  }

  /**
   * Detect screen reader
   */
  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    const userAgent = navigator.userAgent.toLowerCase();
    const hasScreenReaderUA = userAgent.includes('nvda') || 
                             userAgent.includes('jaws') || 
                             userAgent.includes('voiceover');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return hasScreenReaderUA || prefersReducedMotion;
  }

  /**
   * Run PWA tests
   */
  private async runPWATests(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Service Worker registration
    if (this.deviceInfo.support.serviceWorker) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        tests.push(this.createTest(
          'sw-registration',
          'Service Worker Registration',
          'pwa',
          registrations.length > 0 ? 'pass' : 'warning',
          `${registrations.length} service worker(s) registered`
        ));
      } catch (error) {
        tests.push(this.createTest(
          'sw-registration',
          'Service Worker Registration',
          'pwa',
          'fail',
          'Failed to check service worker registrations'
        ));
      }
    }

    // Manifest test
    const manifestTest = this.testManifest();
    tests.push(this.createTest(
      'manifest',
      'Web App Manifest',
      'pwa',
      manifestTest.valid ? 'pass' : 'fail',
      manifestTest.message,
      manifestTest
    ));

    // Install prompt test
    const installability = await this.testPWAInstallability();
    tests.push(this.createTest(
      'pwa-installability',
      'PWA Installability',
      'pwa',
      installability.canInstall ? 'pass' : 'warning',
      installability.canInstall ? 'PWA can be installed' : 'PWA installation not available',
      installability
    ));

    return tests;
  }

  /**
   * Test web app manifest
   */
  private testManifest(): { valid: boolean; message: string; manifest?: any } {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (!manifestLink) {
      return { valid: false, message: 'No manifest link found' };
    }

    // Note: In a real implementation, we would fetch and parse the manifest
    // For this demo, we'll assume it's valid if the link exists
    return { 
      valid: true, 
      message: 'Manifest link found',
      manifest: { href: manifestLink.href }
    };
  }

  /**
   * Test PWA installability
   */
  private async testPWAInstallability(): Promise<PWAInstallability> {
    const result: PWAInstallability = {
      canInstall: false,
      manifest: null,
      serviceWorker: this.deviceInfo.support.serviceWorker,
      httpsRequired: location.protocol === 'https:',
      manifestValid: false,
      iconsSufficient: false,
      startUrlAccessible: true,
      installPromptAvailable: false,
      installationMethod: 'none',
      platform: this.deviceInfo.os === 'ios' ? 'ios' : 
                this.deviceInfo.os === 'android' ? 'android' : 'desktop',
    };

    // Check for beforeinstallprompt event support
    if ('onbeforeinstallprompt' in window) {
      result.installPromptAvailable = true;
      result.installationMethod = 'browser';
    }

    // iOS specific checks
    if (this.deviceInfo.os === 'ios') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone;
      result.canInstall = !isStandalone;
      result.installationMethod = 'manual';
    }

    // Android specific checks
    if (this.deviceInfo.os === 'android' && this.deviceInfo.support.serviceWorker) {
      result.canInstall = true;
      result.installationMethod = 'browser';
    }

    const manifestTest = this.testManifest();
    result.manifestValid = manifestTest.valid;
    result.manifest = manifestTest.manifest;

    // Basic icon check (simplified)
    result.iconsSufficient = manifestTest.valid;

    return result;
  }

  /**
   * Create a test result
   */
  private createTest(
    id: string,
    testName: string,
    category: TestResult['category'],
    status: TestResult['status'],
    message?: string,
    details?: any
  ): TestResult {
    return {
      id,
      testName,
      category,
      status,
      message: message || '',
      details,
      timestamp: new Date(),
      device: this.deviceInfo,
    };
  }

  /**
   * Generate compatibility report
   */
  private generateCompatibilityReport(testResults: TestResult[]): CompatibilityReport {
    const passed = testResults.filter(t => t.status === 'pass');
    const warnings = testResults.filter(t => t.status === 'warning');
    const criticalIssues = testResults.filter(t => t.status === 'fail');
    
    const totalTests = testResults.filter(t => t.status !== 'skip').length;
    const passedTests = passed.length;
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const recommendations: string[] = [];

    // Generate recommendations based on failures
    criticalIssues.forEach(issue => {
      switch (issue.id) {
        case 'service-worker':
          recommendations.push('Consider providing fallback functionality for offline scenarios');
          break;
        case 'css-grid':
          recommendations.push('Ensure flexbox fallbacks are properly implemented');
          break;
        case 'viewport-meta':
          recommendations.push('Add viewport meta tag for proper mobile rendering');
          break;
        case 'manifest':
          recommendations.push('Add web app manifest for PWA functionality');
          break;
      }
    });

    // Generate recommendations based on warnings
    warnings.forEach(warning => {
      switch (warning.id) {
        case 'push-notifications':
          recommendations.push('Consider alternative notification methods');
          break;
        case 'web-share':
          recommendations.push('Implement custom sharing interface');
          break;
        case 'network-speed':
          recommendations.push('Optimize for slower network connections');
          break;
      }
    });

    return {
      deviceInfo: this.deviceInfo,
      overallScore,
      testResults,
      recommendations,
      criticalIssues,
      warnings,
      passed,
    };
  }

  /**
   * Generate cache key for compatibility report
   */
  private generateCacheKey(): string {
    const { type, os, osVersion, browser, browserVersion } = this.deviceInfo;
    return `${type}-${os}-${osVersion}-${browser}-${browserVersion}`;
  }

  /**
   * Get device information
   */
  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Get last compatibility report
   */
  public getLastCompatibilityReport(): CompatibilityReport | null {
    const cacheKey = this.generateCacheKey();
    return this.compatibilityCache.get(cacheKey) || null;
  }

  /**
   * Run specific test category
   */
  public async runTestCategory(category: TestResult['category']): Promise<TestResult[]> {
    switch (category) {
      case 'layout':
        return this.runLayoutTests();
      case 'functionality':
        return this.runFunctionalityTests();
      case 'performance':
        return await this.runPerformanceTests();
      case 'accessibility':
        return this.runAccessibilityTests();
      case 'pwa':
        return await this.runPWATests();
      default:
        return [];
    }
  }

  /**
   * Check if device/browser combination is supported
   */
  public isSupported(): boolean {
    const report = this.getLastCompatibilityReport();
    if (!report) return false;

    // Consider supported if overall score is above 70% and no critical PWA issues
    const criticalPWAIssues = report.criticalIssues.filter(issue => 
      ['service-worker', 'manifest'].includes(issue.id)
    );

    return report.overallScore >= 70 && criticalPWAIssues.length === 0;
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const report = this.getLastCompatibilityReport();
    if (!report) return [];

    const recommendations = [...report.recommendations];

    // Device-specific recommendations
    if (this.deviceInfo.type === 'mobile') {
      recommendations.push('Optimize touch targets for mobile devices');
      recommendations.push('Ensure text is readable at mobile zoom levels');
    }

    if (this.deviceInfo.os === 'ios') {
      recommendations.push('Test PWA installation via Safari Add to Home Screen');
      recommendations.push('Ensure proper iOS safe area handling');
    }

    if (this.deviceInfo.os === 'android') {
      recommendations.push('Test PWA installation via Chrome install prompt');
      recommendations.push('Optimize for various Android screen sizes');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    this.compatibilityCache.clear();
    this.testResults = [];
    this.isInitialized = false;
  }
}

// Export singleton instance
export const crossPlatformTestingService = new CrossPlatformTestingService();
export default crossPlatformTestingService; 