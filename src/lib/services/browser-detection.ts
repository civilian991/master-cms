'use client';

export interface BrowserCapability {
  name: string;
  supported: boolean;
  fallback?: () => void;
  polyfill?: string;
  alternative?: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface FeatureDetection {
  html5: {
    canvas: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    webWorkers: boolean;
    history: boolean;
    placeholder: boolean;
    autofocus: boolean;
    required: boolean;
  };
  css3: {
    flexbox: boolean;
    grid: boolean;
    transforms: boolean;
    transitions: boolean;
    animations: boolean;
    customProperties: boolean;
    calc: boolean;
    objectFit: boolean;
  };
  javascript: {
    es6: boolean;
    promises: boolean;
    asyncAwait: boolean;
    destructuring: boolean;
    spread: boolean;
    templateLiterals: boolean;
    arrow: boolean;
    classes: boolean;
  };
  apis: {
    fetch: boolean;
    intersectionObserver: boolean;
    mutationObserver: boolean;
    resizeObserver: boolean;
    mediaQueries: boolean;
    geolocation: boolean;
    notification: boolean;
    vibration: boolean;
  };
  media: {
    webp: boolean;
    avif: boolean;
    webm: boolean;
    mp4: boolean;
    audioContext: boolean;
    mediaStream: boolean;
  };
  advanced: {
    serviceWorker: boolean;
    webAssembly: boolean;
    webGL: boolean;
    webRTC: boolean;
    indexedDB: boolean;
    webCrypto: boolean;
    paymentRequest: boolean;
    webShare: boolean;
  };
}

export interface PolyfillStrategy {
  condition: () => boolean;
  load: () => Promise<void>;
  fallback: () => void;
  priority: 'high' | 'medium' | 'low';
}

class BrowserDetectionService {
  private capabilities: Map<string, BrowserCapability> = new Map();
  private featureDetection: FeatureDetection | null = null;
  private polyfillsLoaded: Set<string> = new Set();
  private fallbacksApplied: Set<string> = new Set();
  private isInitialized = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize browser detection service
   */
  private async initializeService(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Detect all features
      this.featureDetection = this.detectAllFeatures();

      // Initialize capabilities
      this.initializeCapabilities();

      // Apply necessary polyfills and fallbacks
      await this.applyPolyfillsAndFallbacks();

      this.isInitialized = true;
      console.log('Browser Detection Service initialized');
    } catch (error) {
      console.error('Failed to initialize Browser Detection Service:', error);
    }
  }

  /**
   * Detect all browser features
   */
  private detectAllFeatures(): FeatureDetection {
    return {
      html5: this.detectHTML5Features(),
      css3: this.detectCSS3Features(),
      javascript: this.detectJavaScriptFeatures(),
      apis: this.detectAPIFeatures(),
      media: this.detectMediaFeatures(),
      advanced: this.detectAdvancedFeatures(),
    };
  }

  /**
   * Detect HTML5 features
   */
  private detectHTML5Features() {
    return {
      canvas: this.hasCanvas(),
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      webWorkers: 'Worker' in window,
      history: 'history' in window && 'pushState' in history,
      placeholder: 'placeholder' in document.createElement('input'),
      autofocus: 'autofocus' in document.createElement('input'),
      required: 'required' in document.createElement('input'),
    };
  }

  /**
   * Detect CSS3 features
   */
  private detectCSS3Features() {
    return {
      flexbox: this.hasCSS('display', 'flex'),
      grid: this.hasCSS('display', 'grid'),
      transforms: this.hasCSS('transform', 'translateX(1px)'),
      transitions: this.hasCSS('transition', 'opacity 1s'),
      animations: this.hasCSS('animation', 'test 1s'),
      customProperties: this.hasCSS('color', 'var(--test)'),
      calc: this.hasCSS('width', 'calc(100% - 10px)'),
      objectFit: this.hasCSS('object-fit', 'cover'),
    };
  }

  /**
   * Detect JavaScript features
   */
  private detectJavaScriptFeatures() {
    return {
      es6: this.hasES6(),
      promises: 'Promise' in window,
      asyncAwait: this.hasAsyncAwait(),
      destructuring: this.hasDestructuring(),
      spread: this.hasSpreadOperator(),
      templateLiterals: this.hasTemplateLiterals(),
      arrow: this.hasArrowFunctions(),
      classes: this.hasClasses(),
    };
  }

  /**
   * Detect API features
   */
  private detectAPIFeatures() {
    return {
      fetch: 'fetch' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      mediaQueries: 'matchMedia' in window,
      geolocation: 'geolocation' in navigator,
      notification: 'Notification' in window,
      vibration: 'vibrate' in navigator,
    };
  }

  /**
   * Detect media features
   */
  private detectMediaFeatures() {
    return {
      webp: false, // Will be tested asynchronously
      avif: false, // Will be tested asynchronously
      webm: this.hasWebM(),
      mp4: this.hasMP4(),
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
      mediaStream: 'MediaStream' in window,
    };
  }

  /**
   * Detect advanced features
   */
  private detectAdvancedFeatures() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      webAssembly: 'WebAssembly' in window,
      webGL: this.hasWebGL(),
      webRTC: 'RTCPeerConnection' in window,
      indexedDB: 'indexedDB' in window,
      webCrypto: 'crypto' in window && 'subtle' in crypto,
      paymentRequest: 'PaymentRequest' in window,
      webShare: 'share' in navigator,
    };
  }

  /**
   * Feature detection methods
   */
  private hasCanvas(): boolean {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  }

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

  private hasCSS(property: string, value: string): boolean {
    const element = document.createElement('div');
    try {
      element.style.setProperty(property, value);
      return element.style.getPropertyValue(property) !== '';
    } catch (e) {
      return false;
    }
  }

  private hasES6(): boolean {
    try {
      eval('const test = () => {}; class Test {}; const {a, b} = {a: 1, b: 2};');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasAsyncAwait(): boolean {
    try {
      eval('async function test() { await Promise.resolve(); }');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasDestructuring(): boolean {
    try {
      eval('const {a, b} = {a: 1, b: 2};');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasSpreadOperator(): boolean {
    try {
      eval('const arr = [1, 2, 3]; const newArr = [...arr];');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasTemplateLiterals(): boolean {
    try {
      eval('const test = `template ${1 + 1} literal`;');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasArrowFunctions(): boolean {
    try {
      eval('const test = () => {};');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasClasses(): boolean {
    try {
      eval('class TestClass {}');
      return true;
    } catch (e) {
      return false;
    }
  }

  private hasWebM(): boolean {
    const video = document.createElement('video');
    return video.canPlayType('video/webm') !== '';
  }

  private hasMP4(): boolean {
    const video = document.createElement('video');
    return video.canPlayType('video/mp4') !== '';
  }

  private hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Test image format support
   */
  private async testImageFormats(): Promise<void> {
    if (!this.featureDetection) return;

    // Test WebP
    this.featureDetection.media.webp = await this.testImageFormat(
      'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'
    );

    // Test AVIF
    this.featureDetection.media.avif = await this.testImageFormat(
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    );
  }

  private testImageFormat(dataUri: string): Promise<boolean> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = dataUri;
    });
  }

  /**
   * Initialize capabilities with fallbacks
   */
  private initializeCapabilities(): void {
    if (!this.featureDetection) return;

    // Fetch API
    this.capabilities.set('fetch', {
      name: 'Fetch API',
      supported: this.featureDetection.apis.fetch,
      fallback: this.fetchFallback,
      polyfill: 'https://polyfill.io/v3/polyfill.min.js?features=fetch',
      alternative: 'XMLHttpRequest',
      description: 'Modern HTTP request API',
      impact: 'high',
    });

    // IntersectionObserver
    this.capabilities.set('intersectionObserver', {
      name: 'Intersection Observer',
      supported: this.featureDetection.apis.intersectionObserver,
      fallback: this.intersectionObserverFallback,
      polyfill: 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver',
      alternative: 'Scroll event listeners',
      description: 'Efficient element visibility detection',
      impact: 'medium',
    });

    // CSS Grid
    this.capabilities.set('cssGrid', {
      name: 'CSS Grid',
      supported: this.featureDetection.css3.grid,
      fallback: this.cssGridFallback,
      alternative: 'CSS Flexbox',
      description: 'Two-dimensional layout system',
      impact: 'medium',
    });

    // CSS Custom Properties
    this.capabilities.set('customProperties', {
      name: 'CSS Custom Properties',
      supported: this.featureDetection.css3.customProperties,
      fallback: this.customPropertiesFallback,
      polyfill: 'https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2',
      alternative: 'SCSS variables',
      description: 'Dynamic CSS variables',
      impact: 'low',
    });

    // Service Worker
    this.capabilities.set('serviceWorker', {
      name: 'Service Worker',
      supported: this.featureDetection.advanced.serviceWorker,
      fallback: this.serviceWorkerFallback,
      alternative: 'Application Cache (deprecated)',
      description: 'Background scripts for PWA features',
      impact: 'critical',
    });

    // Web Share API
    this.capabilities.set('webShare', {
      name: 'Web Share API',
      supported: this.featureDetection.advanced.webShare,
      fallback: this.webShareFallback,
      alternative: 'Custom share dialog',
      description: 'Native sharing interface',
      impact: 'low',
    });

    // Resize Observer
    this.capabilities.set('resizeObserver', {
      name: 'Resize Observer',
      supported: this.featureDetection.apis.resizeObserver,
      fallback: this.resizeObserverFallback,
      polyfill: 'https://polyfill.io/v3/polyfill.min.js?features=ResizeObserver',
      alternative: 'Window resize events',
      description: 'Element resize detection',
      impact: 'low',
    });

    // Payment Request API
    this.capabilities.set('paymentRequest', {
      name: 'Payment Request API',
      supported: this.featureDetection.advanced.paymentRequest,
      fallback: this.paymentRequestFallback,
      alternative: 'Traditional payment forms',
      description: 'Streamlined payment experience',
      impact: 'medium',
    });

    // Notification API
    this.capabilities.set('notification', {
      name: 'Notification API',
      supported: this.featureDetection.apis.notification,
      fallback: this.notificationFallback,
      alternative: 'In-app notifications',
      description: 'System notifications',
      impact: 'medium',
    });

    // WebP/AVIF images
    this.capabilities.set('modernImages', {
      name: 'Modern Image Formats',
      supported: this.featureDetection.media.webp || this.featureDetection.media.avif,
      fallback: this.modernImagesFallback,
      alternative: 'JPEG/PNG fallbacks',
      description: 'Efficient image formats',
      impact: 'low',
    });
  }

  /**
   * Apply polyfills and fallbacks
   */
  private async applyPolyfillsAndFallbacks(): Promise<void> {
    const criticalFeatures = Array.from(this.capabilities.values())
      .filter(cap => cap.impact === 'critical' && !cap.supported);

    const highPriorityFeatures = Array.from(this.capabilities.values())
      .filter(cap => cap.impact === 'high' && !cap.supported);

    // Apply critical polyfills/fallbacks immediately
    for (const feature of criticalFeatures) {
      await this.applyFeatureFallback(feature);
    }

    // Apply high priority polyfills/fallbacks
    for (const feature of highPriorityFeatures) {
      await this.applyFeatureFallback(feature);
    }

    // Apply medium/low priority fallbacks
    setTimeout(async () => {
      const otherFeatures = Array.from(this.capabilities.values())
        .filter(cap => ['medium', 'low'].includes(cap.impact) && !cap.supported);

      for (const feature of otherFeatures) {
        await this.applyFeatureFallback(feature);
      }
    }, 1000);
  }

  /**
   * Apply feature fallback
   */
  private async applyFeatureFallback(capability: BrowserCapability): Promise<void> {
    if (this.fallbacksApplied.has(capability.name)) return;

    try {
      // Try to load polyfill first
      if (capability.polyfill && !this.polyfillsLoaded.has(capability.name)) {
        await this.loadPolyfill(capability.polyfill);
        this.polyfillsLoaded.add(capability.name);
        
        // Recheck if feature is now supported
        capability.supported = this.recheckFeature(capability.name);
      }

      // Apply fallback if still not supported
      if (!capability.supported && capability.fallback) {
        capability.fallback();
        this.fallbacksApplied.add(capability.name);
        console.log(`Applied fallback for ${capability.name}`);
      }
    } catch (error) {
      console.error(`Failed to apply fallback for ${capability.name}:`, error);
      
      // Apply JavaScript fallback as last resort
      if (capability.fallback) {
        capability.fallback();
        this.fallbacksApplied.add(capability.name);
      }
    }
  }

  /**
   * Load polyfill
   */
  private loadPolyfill(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load polyfill: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Recheck feature support after polyfill
   */
  private recheckFeature(featureName: string): boolean {
    switch (featureName) {
      case 'Fetch API':
        return 'fetch' in window;
      case 'Intersection Observer':
        return 'IntersectionObserver' in window;
      case 'Resize Observer':
        return 'ResizeObserver' in window;
      case 'CSS Custom Properties':
        return this.hasCSS('color', 'var(--test)');
      default:
        return false;
    }
  }

  /**
   * Fallback implementations
   */
  private fetchFallback = (): void => {
    if (!('fetch' in window)) {
      (window as any).fetch = (url: string, options: any = {}) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(options.method || 'GET', url);
          
          if (options.headers) {
            Object.keys(options.headers).forEach(key => {
              xhr.setRequestHeader(key, options.headers[key]);
            });
          }

          xhr.onload = () => {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText),
            });
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(options.body);
        });
      };
    }
  };

  private intersectionObserverFallback = (): void => {
    if (!('IntersectionObserver' in window)) {
      (window as any).IntersectionObserver = class {
        constructor(callback: Function) {
          this.callback = callback;
          this.elements = new Set();
        }

        observe(element: Element) {
          this.elements.add(element);
          this.checkIntersection(element);
        }

        unobserve(element: Element) {
          this.elements.delete(element);
        }

        disconnect() {
          this.elements.clear();
        }

        checkIntersection(element: Element) {
          const rect = element.getBoundingClientRect();
          const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
          
          this.callback([{
            target: element,
            isIntersecting,
            boundingClientRect: rect,
            intersectionRatio: isIntersecting ? 1 : 0,
          }]);
        }
      };
    }
  };

  private cssGridFallback = (): void => {
    const style = document.createElement('style');
    style.textContent = `
      .grid-fallback {
        display: flex;
        flex-wrap: wrap;
      }
      
      .grid-fallback > * {
        flex: 1;
        min-width: 300px;
      }
    `;
    document.head.appendChild(style);

    // Add fallback class to grid containers
    document.querySelectorAll('[class*="grid"]').forEach(el => {
      el.classList.add('grid-fallback');
    });
  };

  private customPropertiesFallback = (): void => {
    // Simple CSS variable fallback
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        --success-color: #28a745;
        --danger-color: #dc3545;
        --warning-color: #ffc107;
        --info-color: #17a2b8;
        --light-color: #f8f9fa;
        --dark-color: #343a40;
      }
      
      .color-primary { color: #007bff; }
      .bg-primary { background-color: #007bff; }
      .color-secondary { color: #6c757d; }
      .bg-secondary { background-color: #6c757d; }
    `;
    document.head.appendChild(style);
  };

  private serviceWorkerFallback = (): void => {
    console.warn('Service Worker not supported - PWA features will be limited');
    
    // Implement basic offline detection
    window.addEventListener('online', () => {
      document.body.classList.remove('offline');
      this.showConnectionStatus('Back online', 'success');
    });

    window.addEventListener('offline', () => {
      document.body.classList.add('offline');
      this.showConnectionStatus('You are offline', 'warning');
    });
  };

  private webShareFallback = (): void => {
    if (!('share' in navigator)) {
      (navigator as any).share = (data: any) => {
        return new Promise((resolve, reject) => {
          // Create custom share dialog
          const shareDialog = this.createShareDialog(data);
          document.body.appendChild(shareDialog);
          
          shareDialog.addEventListener('close', () => {
            document.body.removeChild(shareDialog);
            resolve(undefined);
          });
        });
      };
    }
  };

  private resizeObserverFallback = (): void => {
    if (!('ResizeObserver' in window)) {
      (window as any).ResizeObserver = class {
        constructor(callback: Function) {
          this.callback = callback;
          this.elements = new Map();
          this.handleResize = this.handleResize.bind(this);
          window.addEventListener('resize', this.handleResize);
        }

        observe(element: Element) {
          const rect = element.getBoundingClientRect();
          this.elements.set(element, { width: rect.width, height: rect.height });
        }

        unobserve(element: Element) {
          this.elements.delete(element);
        }

        disconnect() {
          this.elements.clear();
          window.removeEventListener('resize', this.handleResize);
        }

        handleResize() {
          const entries: any[] = [];
          
          this.elements.forEach((oldSize, element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width !== oldSize.width || rect.height !== oldSize.height) {
              entries.push({
                target: element,
                contentRect: rect,
              });
              this.elements.set(element, { width: rect.width, height: rect.height });
            }
          });

          if (entries.length > 0) {
            this.callback(entries);
          }
        }
      };
    }
  };

  private paymentRequestFallback = (): void => {
    console.warn('Payment Request API not supported - using traditional payment form');
    
    // Add payment form enhancement
    const style = document.createElement('style');
    style.textContent = `
      .payment-form-enhanced {
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 8px;
        background: #f9f9f9;
      }
      
      .payment-form-enhanced .field {
        margin-bottom: 16px;
      }
      
      .payment-form-enhanced label {
        display: block;
        margin-bottom: 4px;
        font-weight: bold;
      }
      
      .payment-form-enhanced input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  };

  private notificationFallback = (): void => {
    if (!('Notification' in window)) {
      (window as any).Notification = class {
        constructor(title: string, options: any = {}) {
          this.title = title;
          this.body = options.body || '';
          this.icon = options.icon || '';
          
          // Show in-app notification
          this.showInAppNotification();
        }

        static requestPermission() {
          return Promise.resolve('granted');
        }

        showInAppNotification() {
          const notification = document.createElement('div');
          notification.className = 'in-app-notification';
          notification.innerHTML = `
            <div class="notification-content">
              <div class="notification-title">${this.title}</div>
              <div class="notification-body">${this.body}</div>
              <button class="notification-close">&times;</button>
            </div>
          `;

          const style = document.createElement('style');
          style.textContent = `
            .in-app-notification {
              position: fixed;
              top: 20px;
              right: 20px;
              background: white;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 10000;
              max-width: 300px;
              animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            
            .notification-title {
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .notification-close {
              position: absolute;
              top: 8px;
              right: 8px;
              border: none;
              background: none;
              font-size: 18px;
              cursor: pointer;
            }
          `;
          document.head.appendChild(style);

          document.body.appendChild(notification);

          // Auto-remove after 5 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 5000);

          // Close on click
          notification.querySelector('.notification-close')?.addEventListener('click', () => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          });
        }
      };
    }
  };

  private modernImagesFallback = (): void => {
    // Replace WebP/AVIF images with fallbacks
    document.querySelectorAll('img[data-src-webp], img[data-src-avif]').forEach(img => {
      const imgEl = img as HTMLImageElement;
      const fallbackSrc = imgEl.dataset.srcFallback || imgEl.dataset.src;
      
      if (fallbackSrc) {
        imgEl.src = fallbackSrc;
      }
    });

    // Set up picture element fallbacks
    document.querySelectorAll('picture').forEach(picture => {
      const img = picture.querySelector('img');
      if (img && !img.src) {
        const fallbackSource = picture.querySelector('source[type="image/jpeg"], source[type="image/png"]');
        if (fallbackSource) {
          img.src = (fallbackSource as HTMLSourceElement).srcset;
        }
      }
    });
  };

  /**
   * Helper methods
   */
  private showConnectionStatus(message: string, type: 'success' | 'warning' | 'error'): void {
    const toast = document.createElement('div');
    toast.className = `connection-toast ${type}`;
    toast.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      .connection-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      }
      
      .connection-toast.success { background: #28a745; }
      .connection-toast.warning { background: #ffc107; color: #000; }
      .connection-toast.error { background: #dc3545; }
      
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100%); }
        to { transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  private createShareDialog(data: any): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'share-dialog-overlay';
    dialog.innerHTML = `
      <div class="share-dialog">
        <div class="share-header">
          <h3>Share</h3>
          <button class="share-close">&times;</button>
        </div>
        <div class="share-content">
          <div class="share-options">
            <button class="share-option" data-method="copy">Copy Link</button>
            <button class="share-option" data-method="twitter">Twitter</button>
            <button class="share-option" data-method="facebook">Facebook</button>
            <button class="share-option" data-method="email">Email</button>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .share-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .share-dialog {
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
      }
      
      .share-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .share-close {
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
      }
      
      .share-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .share-option {
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
      }
      
      .share-option:hover {
        background: #f0f0f0;
      }
    `;
    document.head.appendChild(style);

    // Handle share methods
    dialog.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('share-close') || target.classList.contains('share-dialog-overlay')) {
        dialog.dispatchEvent(new CustomEvent('close'));
      }
      
      if (target.classList.contains('share-option')) {
        const method = target.dataset.method;
        const url = data.url || window.location.href;
        const title = data.title || document.title;
        
        switch (method) {
          case 'copy':
            navigator.clipboard?.writeText(url);
            break;
          case 'twitter':
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
            break;
          case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
            break;
          case 'email':
            window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
            break;
        }
        
        dialog.dispatchEvent(new CustomEvent('close'));
      }
    });

    return dialog;
  }

  /**
   * Public methods
   */
  public getFeatureDetection(): FeatureDetection | null {
    return this.featureDetection;
  }

  public getCapabilities(): Map<string, BrowserCapability> {
    return new Map(this.capabilities);
  }

  public isFeatureSupported(featureName: string): boolean {
    const capability = this.capabilities.get(featureName);
    return capability ? capability.supported : false;
  }

  public getUnsupportedFeatures(): BrowserCapability[] {
    return Array.from(this.capabilities.values()).filter(cap => !cap.supported);
  }

  public getCriticalIssues(): BrowserCapability[] {
    return Array.from(this.capabilities.values())
      .filter(cap => !cap.supported && cap.impact === 'critical');
  }

  public getCompatibilityScore(): number {
    const totalFeatures = this.capabilities.size;
    const supportedFeatures = Array.from(this.capabilities.values())
      .filter(cap => cap.supported).length;
    
    return totalFeatures > 0 ? (supportedFeatures / totalFeatures) * 100 : 0;
  }

  public async runCompatibilityTest(): Promise<void> {
    // Test image formats
    await this.testImageFormats();
    
    // Update capabilities based on test results
    this.initializeCapabilities();
    
    // Apply any new fallbacks needed
    await this.applyPolyfillsAndFallbacks();
  }

  public cleanup(): void {
    this.capabilities.clear();
    this.polyfillsLoaded.clear();
    this.fallbacksApplied.clear();
    this.featureDetection = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const browserDetectionService = new BrowserDetectionService();
export default browserDetectionService; 