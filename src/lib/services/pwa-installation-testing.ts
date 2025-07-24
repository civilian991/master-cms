'use client';

export interface PWAInstallPrompt {
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
  method: 'browser' | 'store' | 'manual' | 'a2hs';
  available: boolean;
  triggered: boolean;
  completed: boolean;
  error?: string;
  userAgent: string;
  timestamp: Date;
}

export interface PWACapability {
  manifestPresent: boolean;
  serviceWorkerRegistered: boolean;
  httpsEnabled: boolean;
  standalone: boolean;
  installable: boolean;
  displayMode: string;
  orientation: string;
  scope: string;
  startUrl: string;
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface PWAInstallTest {
  id: string;
  name: string;
  platform: string;
  browser: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  result?: string;
  error?: string;
  timestamp: Date;
  duration: number;
}

export interface PWACompatibilityReport {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  installability: PWACapability;
  tests: PWAInstallTest[];
  recommendations: string[];
  issues: string[];
  supportedPlatforms: string[];
}

class PWAInstallationTestingService {
  private installPrompt: any = null;
  private installAttempts: PWAInstallPrompt[] = [];
  private testResults: PWAInstallTest[] = [];
  private isInitialized = false;
  private manifestData: any = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize PWA installation testing service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set up install prompt listeners
      this.setupInstallPromptListeners();

      // Load and validate manifest
      await this.loadManifest();

      // Check service worker
      await this.checkServiceWorker();

      // Run initial compatibility tests
      await this.runCompatibilityTests();

      this.isInitialized = true;
      console.log('PWA Installation Testing Service initialized');
    } catch (error) {
      console.error('Failed to initialize PWA Installation Testing Service:', error);
    }
  }

  /**
   * Setup install prompt listeners
   */
  private setupInstallPromptListeners(): void {
    // Listen for beforeinstallprompt event (Chrome/Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      this.installPrompt = e;
      
      this.recordInstallPrompt({
        platform: this.detectPlatform(),
        method: 'browser',
        available: true,
        triggered: false,
        completed: false,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      });
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA was installed');
      this.recordInstallCompletion();
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA is running in standalone mode');
      this.recordInstallCompletion();
    }
  }

  /**
   * Load and validate manifest
   */
  private async loadManifest(): Promise<void> {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (!manifestLink) {
        throw new Error('No manifest link found');
      }

      const response = await fetch(manifestLink.href);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`);
      }

      this.manifestData = await response.json();
      console.log('Manifest loaded successfully', this.manifestData);
    } catch (error) {
      console.error('Failed to load manifest:', error);
      this.manifestData = null;
    }
  }

  /**
   * Check service worker status
   */
  private async checkServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        this.serviceWorkerRegistration = registrations[0] || null;
        
        if (this.serviceWorkerRegistration) {
          console.log('Service Worker is registered');
        } else {
          console.warn('No Service Worker registered');
        }
      } catch (error) {
        console.error('Failed to check Service Worker:', error);
      }
    }
  }

  /**
   * Run comprehensive PWA compatibility tests
   */
  private async runCompatibilityTests(): Promise<PWACompatibilityReport> {
    const tests: PWAInstallTest[] = [];

    // Test manifest presence and validity
    tests.push(await this.testManifest());

    // Test service worker
    tests.push(await this.testServiceWorker());

    // Test HTTPS requirement
    tests.push(this.testHTTPS());

    // Test icons
    tests.push(await this.testIcons());

    // Test start URL
    tests.push(await this.testStartURL());

    // Test display modes
    tests.push(this.testDisplayModes());

    // Platform-specific tests
    const platform = this.detectPlatform();
    if (platform === 'android') {
      tests.push(...(await this.runAndroidTests()));
    } else if (platform === 'ios') {
      tests.push(...(await this.runIOSTests()));
    } else if (platform === 'desktop') {
      tests.push(...(await this.runDesktopTests()));
    }

    this.testResults = tests;
    return this.generateCompatibilityReport(tests);
  }

  /**
   * Test manifest
   */
  private async testManifest(): Promise<PWAInstallTest> {
    const test: PWAInstallTest = {
      id: 'manifest',
      name: 'Web App Manifest',
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    try {
      if (!this.manifestData) {
        throw new Error('Manifest not found or invalid');
      }

      // Check required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !this.manifestData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate icons
      if (!Array.isArray(this.manifestData.icons) || this.manifestData.icons.length === 0) {
        throw new Error('No icons defined in manifest');
      }

      // Check for PWA-suitable icons
      const hasLargeIcon = this.manifestData.icons.some((icon: any) => {
        const sizes = icon.sizes?.split('x');
        return sizes && parseInt(sizes[0]) >= 192;
      });

      if (!hasLargeIcon) {
        test.status = 'warning';
        test.result = 'Manifest valid but missing large icon (192x192 or larger)';
      } else {
        test.status = 'passed';
        test.result = 'Manifest is valid and complete';
      }
    } catch (error) {
      test.status = 'failed';
      test.error = (error as Error).message;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test service worker
   */
  private async testServiceWorker(): Promise<PWAInstallTest> {
    const test: PWAInstallTest = {
      id: 'service-worker',
      name: 'Service Worker',
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      if (!this.serviceWorkerRegistration) {
        throw new Error('No Service Worker registered');
      }

      // Check if service worker is active
      if (!this.serviceWorkerRegistration.active) {
        throw new Error('Service Worker is not active');
      }

      // Test service worker response
      const swScope = this.serviceWorkerRegistration.scope;
      test.status = 'passed';
      test.result = `Service Worker active with scope: ${swScope}`;
    } catch (error) {
      test.status = 'failed';
      test.error = (error as Error).message;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test HTTPS requirement
   */
  private testHTTPS(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'https',
      name: 'HTTPS Requirement',
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    const isHTTPS = location.protocol === 'https:';
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    if (isHTTPS || isLocalhost) {
      test.status = 'passed';
      test.result = `Secure context: ${location.protocol}`;
    } else {
      test.status = 'failed';
      test.error = 'HTTPS required for PWA installation (except localhost)';
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test icons
   */
  private async testIcons(): Promise<PWAInstallTest> {
    const test: PWAInstallTest = {
      id: 'icons',
      name: 'PWA Icons',
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    try {
      if (!this.manifestData?.icons) {
        throw new Error('No icons defined in manifest');
      }

      const icons = this.manifestData.icons;
      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = icons.map((icon: any) => icon.sizes).filter(Boolean);

      const missingSizes = requiredSizes.filter(size => 
        !availableSizes.some(available => available.includes(size))
      );

      if (missingSizes.length > 0) {
        test.status = 'warning';
        test.result = `Missing recommended icon sizes: ${missingSizes.join(', ')}`;
      } else {
        // Test if icons are accessible
        const iconTests = await Promise.all(
          icons.slice(0, 3).map((icon: any) => this.testIconAccessibility(icon.src))
        );

        const failedIcons = iconTests.filter(result => !result);
        
        if (failedIcons.length > 0) {
          test.status = 'warning';
          test.result = `${failedIcons.length} icon(s) not accessible`;
        } else {
          test.status = 'passed';
          test.result = `All required icons present and accessible`;
        }
      }
    } catch (error) {
      test.status = 'failed';
      test.error = (error as Error).message;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test icon accessibility
   */
  private testIconAccessibility(iconSrc: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = new URL(iconSrc, window.location.href).href;
    });
  }

  /**
   * Test start URL
   */
  private async testStartURL(): Promise<PWAInstallTest> {
    const test: PWAInstallTest = {
      id: 'start-url',
      name: 'Start URL Accessibility',
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    try {
      const startUrl = this.manifestData?.start_url || '/';
      const fullStartUrl = new URL(startUrl, window.location.href).href;

      const response = await fetch(fullStartUrl, { method: 'HEAD' });
      
      if (response.ok) {
        test.status = 'passed';
        test.result = `Start URL accessible: ${startUrl}`;
      } else {
        throw new Error(`Start URL returned ${response.status}`);
      }
    } catch (error) {
      test.status = 'failed';
      test.error = (error as Error).message;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test display modes
   */
  private testDisplayModes(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'display-mode',
      name: 'Display Mode Support',
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    const displayMode = this.manifestData?.display || 'browser';
    const supportedModes = ['standalone', 'minimal-ui', 'fullscreen'];

    if (supportedModes.includes(displayMode)) {
      test.status = 'passed';
      test.result = `Display mode: ${displayMode}`;
    } else {
      test.status = 'warning';
      test.result = `Display mode '${displayMode}' may not provide app-like experience`;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Run Android-specific tests
   */
  private async runAndroidTests(): Promise<PWAInstallTest[]> {
    const tests: PWAInstallTest[] = [];

    // Test Chrome install prompt
    tests.push(this.testChromeInstallPrompt());

    // Test WebAPK generation
    tests.push(await this.testWebAPKSupport());

    // Test Add to Home Screen
    tests.push(this.testAddToHomeScreen());

    return tests;
  }

  /**
   * Test Chrome install prompt (Android)
   */
  private testChromeInstallPrompt(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'chrome-install-prompt',
      name: 'Chrome Install Prompt',
      platform: 'android',
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    if (this.installPrompt) {
      test.status = 'passed';
      test.result = 'Install prompt available';
    } else {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        test.status = 'passed';
        test.result = 'PWA already installed';
      } else {
        test.status = 'warning';
        test.result = 'Install prompt not available (may not meet criteria)';
      }
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test WebAPK support
   */
  private async testWebAPKSupport(): Promise<PWAInstallTest> {
    const test: PWAInstallTest = {
      id: 'webapk-support',
      name: 'WebAPK Support',
      platform: 'android',
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    try {
      // Check for WebAPK indicators
      const hasThemeColor = !!document.querySelector('meta[name="theme-color"]');
      const hasManifestThemeColor = !!this.manifestData?.theme_color;
      const hasBackgroundColor = !!this.manifestData?.background_color;

      if (hasThemeColor && hasManifestThemeColor && hasBackgroundColor) {
        test.status = 'passed';
        test.result = 'WebAPK requirements met';
      } else {
        const missing = [];
        if (!hasThemeColor) missing.push('theme-color meta tag');
        if (!hasManifestThemeColor) missing.push('manifest theme_color');
        if (!hasBackgroundColor) missing.push('manifest background_color');

        test.status = 'warning';
        test.result = `Missing WebAPK requirements: ${missing.join(', ')}`;
      }
    } catch (error) {
      test.status = 'failed';
      test.error = (error as Error).message;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test Add to Home Screen
   */
  private testAddToHomeScreen(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'add-to-home-screen',
      name: 'Add to Home Screen',
      platform: 'android',
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    // Check if meets A2HS criteria
    const hasManifest = !!this.manifestData;
    const hasServiceWorker = !!this.serviceWorkerRegistration;
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';

    if (hasManifest && hasServiceWorker && isSecure) {
      test.status = 'passed';
      test.result = 'Meets Add to Home Screen criteria';
    } else {
      const missing = [];
      if (!hasManifest) missing.push('manifest');
      if (!hasServiceWorker) missing.push('service worker');
      if (!isSecure) missing.push('HTTPS');

      test.status = 'failed';
      test.error = `Missing A2HS requirements: ${missing.join(', ')}`;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Run iOS-specific tests
   */
  private async runIOSTests(): Promise<PWAInstallTest[]> {
    const tests: PWAInstallTest[] = [];

    // Test Safari Add to Home Screen
    tests.push(this.testSafariAddToHome());

    // Test iOS meta tags
    tests.push(this.testIOSMetaTags());

    // Test iOS icons
    tests.push(this.testIOSIcons());

    return tests;
  }

  /**
   * Test Safari Add to Home Screen
   */
  private testSafariAddToHome(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'safari-add-to-home',
      name: 'Safari Add to Home Screen',
      platform: 'ios',
      browser: 'safari',
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone;

    if (isStandalone) {
      test.status = 'passed';
      test.result = 'PWA running in standalone mode';
    } else {
      test.status = 'passed';
      test.result = 'Manual Add to Home Screen available in Safari';
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test iOS meta tags
   */
  private testIOSMetaTags(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'ios-meta-tags',
      name: 'iOS Meta Tags',
      platform: 'ios',
      browser: 'safari',
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    const requiredMetaTags = {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': this.manifestData?.short_name || this.manifestData?.name,
    };

    const missingTags: string[] = [];
    const incorrectTags: string[] = [];

    Object.entries(requiredMetaTags).forEach(([name, expectedContent]) => {
      const metaTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      
      if (!metaTag) {
        missingTags.push(name);
      } else if (expectedContent && metaTag.content !== expectedContent) {
        incorrectTags.push(name);
      }
    });

    if (missingTags.length === 0 && incorrectTags.length === 0) {
      test.status = 'passed';
      test.result = 'All iOS meta tags present and correct';
    } else {
      test.status = 'warning';
      test.result = `Missing: ${missingTags.join(', ')}. Incorrect: ${incorrectTags.join(', ')}`;
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test iOS icons
   */
  private testIOSIcons(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'ios-icons',
      name: 'iOS Touch Icons',
      platform: 'ios',
      browser: 'safari',
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    const touchIcons = document.querySelectorAll('link[rel*="apple-touch-icon"]');
    const requiredSizes = ['180x180', '167x167', '152x152', '120x120'];

    if (touchIcons.length === 0) {
      test.status = 'warning';
      test.result = 'No apple-touch-icon defined';
    } else {
      const availableSizes = Array.from(touchIcons)
        .map(icon => (icon as HTMLLinkElement).sizes)
        .filter(Boolean);

      const missingSizes = requiredSizes.filter(size =>
        !availableSizes.some(available => available.includes(size))
      );

      if (missingSizes.length === 0) {
        test.status = 'passed';
        test.result = 'All recommended iOS icon sizes present';
      } else {
        test.status = 'warning';
        test.result = `Missing iOS icon sizes: ${missingSizes.join(', ')}`;
      }
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Run desktop-specific tests
   */
  private async runDesktopTests(): Promise<PWAInstallTest[]> {
    const tests: PWAInstallTest[] = [];

    // Test desktop install prompt
    tests.push(this.testDesktopInstallPrompt());

    // Test window controls overlay
    tests.push(this.testWindowControlsOverlay());

    return tests;
  }

  /**
   * Test desktop install prompt
   */
  private testDesktopInstallPrompt(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'desktop-install-prompt',
      name: 'Desktop Install Prompt',
      platform: 'desktop',
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    if (this.installPrompt) {
      test.status = 'passed';
      test.result = 'Desktop install prompt available';
    } else {
      test.status = 'warning';
      test.result = 'Desktop install prompt not available';
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Test window controls overlay
   */
  private testWindowControlsOverlay(): PWAInstallTest {
    const test: PWAInstallTest = {
      id: 'window-controls-overlay',
      name: 'Window Controls Overlay',
      platform: 'desktop',
      browser: this.detectBrowser(),
      status: 'running',
      timestamp: new Date(),
      duration: 0,
    };

    const startTime = Date.now();

    const hasDisplayOverride = this.manifestData?.display_override?.includes('window-controls-overlay');
    
    if (hasDisplayOverride) {
      test.status = 'passed';
      test.result = 'Window Controls Overlay configured';
    } else {
      test.status = 'warning';
      test.result = 'Window Controls Overlay not configured';
    }

    test.duration = Date.now() - startTime;
    return test;
  }

  /**
   * Generate compatibility report
   */
  private generateCompatibilityReport(tests: PWAInstallTest[]): PWACompatibilityReport {
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const totalTests = tests.length;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    let overall: PWACompatibilityReport['overall'];
    if (score >= 90) overall = 'excellent';
    else if (score >= 75) overall = 'good';
    else if (score >= 50) overall = 'fair';
    else overall = 'poor';

    const issues = tests
      .filter(t => t.status === 'failed')
      .map(t => t.error || 'Unknown error');

    const recommendations = this.generateRecommendations(tests);
    const supportedPlatforms = this.getSupportedPlatforms(tests);

    return {
      overall,
      score,
      installability: this.getPWACapability(),
      tests,
      recommendations,
      issues,
      supportedPlatforms,
    };
  }

  /**
   * Get PWA capability
   */
  private getPWACapability(): PWACapability {
    return {
      manifestPresent: !!this.manifestData,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration,
      httpsEnabled: location.protocol === 'https:',
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      installable: !!this.installPrompt,
      displayMode: this.manifestData?.display || 'browser',
      orientation: this.manifestData?.orientation || 'any',
      scope: this.manifestData?.scope || '/',
      startUrl: this.manifestData?.start_url || '/',
      icons: this.manifestData?.icons || [],
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(tests: PWAInstallTest[]): string[] {
    const recommendations: string[] = [];
    const failedTests = tests.filter(t => t.status === 'failed');
    const warningTests = tests.filter(t => t.status === 'warning');

    failedTests.forEach(test => {
      switch (test.id) {
        case 'manifest':
          recommendations.push('Add a valid web app manifest with required fields');
          break;
        case 'service-worker':
          recommendations.push('Register a service worker for offline functionality');
          break;
        case 'https':
          recommendations.push('Deploy application over HTTPS for PWA installation');
          break;
        case 'start-url':
          recommendations.push('Ensure start URL is accessible and returns 200 status');
          break;
      }
    });

    warningTests.forEach(test => {
      switch (test.id) {
        case 'icons':
          recommendations.push('Add missing icon sizes (192x192, 512x512) for better platform support');
          break;
        case 'ios-meta-tags':
          recommendations.push('Add iOS-specific meta tags for better Safari integration');
          break;
        case 'webapk-support':
          recommendations.push('Add theme colors for WebAPK generation on Android');
          break;
      }
    });

    return recommendations;
  }

  /**
   * Get supported platforms
   */
  private getSupportedPlatforms(tests: PWAInstallTest[]): string[] {
    const platforms: string[] = [];
    
    const androidTests = tests.filter(t => t.platform === 'android');
    const iosTests = tests.filter(t => t.platform === 'ios');
    const desktopTests = tests.filter(t => t.platform === 'desktop');

    if (androidTests.every(t => t.status !== 'failed')) {
      platforms.push('Android');
    }
    
    if (iosTests.every(t => t.status !== 'failed')) {
      platforms.push('iOS');
    }
    
    if (desktopTests.every(t => t.status !== 'failed')) {
      platforms.push('Desktop');
    }

    return platforms;
  }

  /**
   * Helper methods
   */
  private detectPlatform(): 'android' | 'ios' | 'desktop' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows') || userAgent.includes('mac') || userAgent.includes('linux')) return 'desktop';
    
    return 'unknown';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('samsungbrowser')) return 'samsung';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    
    return 'unknown';
  }

  private recordInstallPrompt(prompt: PWAInstallPrompt): void {
    this.installAttempts.push(prompt);
  }

  private recordInstallCompletion(): void {
    const lastPrompt = this.installAttempts[this.installAttempts.length - 1];
    if (lastPrompt) {
      lastPrompt.completed = true;
    }
  }

  /**
   * Public methods
   */
  public async triggerInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      const result = await this.installPrompt.prompt();
      const accepted = result.outcome === 'accepted';
      
      this.recordInstallPrompt({
        platform: this.detectPlatform(),
        method: 'browser',
        available: true,
        triggered: true,
        completed: accepted,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      });

      if (accepted) {
        this.installPrompt = null;
      }

      return accepted;
    } catch (error) {
      console.error('Failed to trigger install prompt:', error);
      return false;
    }
  }

  public async runFullCompatibilityTest(): Promise<PWACompatibilityReport> {
    await this.loadManifest();
    await this.checkServiceWorker();
    return await this.runCompatibilityTests();
  }

  public getInstallPromptAvailability(): boolean {
    return !!this.installPrompt;
  }

  public getInstallHistory(): PWAInstallPrompt[] {
    return [...this.installAttempts];
  }

  public getLastTestResults(): PWAInstallTest[] {
    return [...this.testResults];
  }

  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  public getPlatformSpecificInstructions(): string[] {
    const platform = this.detectPlatform();
    const browser = this.detectBrowser();

    switch (platform) {
      case 'android':
        if (browser === 'chrome') {
          return [
            '1. Tap the menu button (⋮) in Chrome',
            '2. Select "Add to Home screen"',
            '3. Confirm by tapping "Add"',
          ];
        }
        return [
          '1. Open in Chrome browser',
          '2. Look for install prompt or',
          '3. Use browser menu → Add to Home screen',
        ];

      case 'ios':
        return [
          '1. Open in Safari browser',
          '2. Tap the Share button (□↗)',
          '3. Scroll down and tap "Add to Home Screen"',
          '4. Tap "Add" to confirm',
        ];

      case 'desktop':
        return [
          '1. Look for install icon in address bar',
          '2. Or use browser menu → Install app',
          '3. Follow installation prompts',
        ];

      default:
        return ['Installation method depends on your browser and platform'];
    }
  }

  public cleanup(): void {
    this.installPrompt = null;
    this.installAttempts = [];
    this.testResults = [];
    this.manifestData = null;
    this.serviceWorkerRegistration = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const pwaInstallationTestingService = new PWAInstallationTestingService();
export default pwaInstallationTestingService; 