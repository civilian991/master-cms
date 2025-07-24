// Mobile Performance Optimization Utilities

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  networkType: string;
  devicePixelRatio: number;
  viewportSize: { width: number; height: number };
}

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  loadingClass?: string;
  loadedClass?: string;
  errorClass?: string;
  placeholder?: string;
}

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  responsive?: boolean;
  lazy?: boolean;
}

interface CacheStrategy {
  name: string;
  maxAge: number;
  maxEntries?: number;
  updateStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

// Performance monitoring class
export class MobilePerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observer: PerformanceObserver | null = null;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.metrics = this.initializeMetrics();
    this.setupPerformanceObserver();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: this.getMemoryUsage(),
      networkType: this.getNetworkType(),
      devicePixelRatio: window.devicePixelRatio || 1,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe different types of performance entries
      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
      } catch (error) {
        console.warn('Some performance entry types not supported:', error);
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics.loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
        break;

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.renderTime = entry.startTime;
        }
        break;

      case 'largest-contentful-paint':
        this.metrics.renderTime = entry.startTime;
        break;

      case 'first-input':
        this.metrics.interactionTime = (entry as any).processingStart - entry.startTime;
        break;
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getNetworkType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  public getMetrics(): PerformanceMetrics {
    this.metrics.memoryUsage = this.getMemoryUsage();
    return { ...this.metrics };
  }

  public markInteraction(name: string): void {
    performance.mark(`interaction-${name}-start`);
  }

  public measureInteraction(name: string): number {
    performance.mark(`interaction-${name}-end`);
    performance.measure(
      `interaction-${name}`,
      `interaction-${name}-start`,
      `interaction-${name}-end`
    );
    
    const measure = performance.getEntriesByName(`interaction-${name}`)[0];
    return measure ? measure.duration : 0;
  }

  public reportMetrics(): void {
    const metrics = this.getMetrics();
    console.log('Mobile Performance Metrics:', metrics);
    
    // Send to analytics if configured
    if (typeof gtag !== 'undefined') {
      gtag('event', 'mobile_performance', {
        custom_map: {
          load_time: metrics.loadTime,
          render_time: metrics.renderTime,
          memory_usage: metrics.memoryUsage,
          network_type: metrics.networkType,
        },
      });
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Lazy loading utility
export class LazyLoader {
  private observer: IntersectionObserver;
  private loadedElements = new Set<Element>();

  constructor(options: LazyLoadOptions = {}) {
    const {
      rootMargin = '100px',
      threshold = 0.1,
      loadingClass = 'lazy-loading',
      loadedClass = 'lazy-loaded',
      errorClass = 'lazy-error',
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=',
    } = options;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
            this.loadElement(entry.target as HTMLElement, {
              loadingClass,
              loadedClass,
              errorClass,
              placeholder,
            });
          }
        });
      },
      { rootMargin, threshold }
    );
  }

  private async loadElement(
    element: HTMLElement,
    classes: { loadingClass: string; loadedClass: string; errorClass: string; placeholder: string }
  ): Promise<void> {
    this.loadedElements.add(element);
    element.classList.add(classes.loadingClass);

    try {
      if (element.tagName === 'IMG') {
        await this.loadImage(element as HTMLImageElement, classes);
      } else if (element.hasAttribute('data-src')) {
        await this.loadContent(element, classes);
      }
    } catch (error) {
      element.classList.add(classes.errorClass);
      console.error('Error loading lazy element:', error);
    } finally {
      element.classList.remove(classes.loadingClass);
      this.observer.unobserve(element);
    }
  }

  private loadImage(img: HTMLImageElement, classes: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const dataSrc = img.getAttribute('data-src');
      if (!dataSrc) {
        reject(new Error('No data-src attribute found'));
        return;
      }

      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = dataSrc;
        img.classList.add(classes.loadedClass);
        resolve();
      };
      tempImg.onerror = reject;
      tempImg.src = dataSrc;
    });
  }

  private async loadContent(element: HTMLElement, classes: any): Promise<void> {
    const dataSrc = element.getAttribute('data-src');
    if (!dataSrc) {
      throw new Error('No data-src attribute found');
    }

    const response = await fetch(dataSrc);
    if (!response.ok) {
      throw new Error(`Failed to load content: ${response.statusText}`);
    }

    const content = await response.text();
    element.innerHTML = content;
    element.classList.add(classes.loadedClass);
  }

  public observe(element: Element): void {
    this.observer.observe(element);
  }

  public unobserve(element: Element): void {
    this.observer.unobserve(element);
    this.loadedElements.delete(element);
  }

  public disconnect(): void {
    this.observer.disconnect();
    this.loadedElements.clear();
  }
}

// Image optimization utility
export class ImageOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  public async optimizeImage(file: File, options: ImageOptimizationOptions = {}): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'webp',
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          this.canvas.width = width;
          this.canvas.height = height;

          this.ctx.drawImage(img, 0, 0, width, height);

          this.canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  public generateResponsiveImageSrcSet(
    baseUrl: string,
    widths: number[] = [320, 640, 960, 1280, 1920]
  ): string {
    return widths
      .map((width) => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  }

  public generateResponsiveImageSizes(
    breakpoints: Array<{ mediaQuery: string; size: string }> = [
      { mediaQuery: '(max-width: 320px)', size: '100vw' },
      { mediaQuery: '(max-width: 768px)', size: '100vw' },
      { mediaQuery: '(max-width: 1024px)', size: '50vw' },
    ]
  ): string {
    const sizes = breakpoints.map(bp => `${bp.mediaQuery} ${bp.size}`);
    sizes.push('33vw'); // Default size
    return sizes.join(', ');
  }
}

// Mobile cache manager
export class MobileCacheManager {
  private strategies: Map<string, CacheStrategy> = new Map();
  private defaultStrategy: CacheStrategy = {
    name: 'default',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
    updateStrategy: 'stale-while-revalidate',
  };

  constructor() {
    this.setupDefaultStrategies();
  }

  private setupDefaultStrategies(): void {
    this.strategies.set('images', {
      name: 'images',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 50,
      updateStrategy: 'cache-first',
    });

    this.strategies.set('api-data', {
      name: 'api-data',
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 20,
      updateStrategy: 'network-first',
    });

    this.strategies.set('static-assets', {
      name: 'static-assets',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEntries: 200,
      updateStrategy: 'cache-first',
    });
  }

  public async get(key: string, strategyName?: string): Promise<any> {
    const strategy = this.strategies.get(strategyName || 'default') || this.defaultStrategy;
    
    try {
      const cached = localStorage.getItem(`mobile-cache-${strategy.name}-${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < strategy.maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error reading from cache:', error);
    }
    
    return null;
  }

  public async set(key: string, data: any, strategyName?: string): Promise<void> {
    const strategy = this.strategies.get(strategyName || 'default') || this.defaultStrategy;
    
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(
        `mobile-cache-${strategy.name}-${key}`,
        JSON.stringify(cacheEntry)
      );
      
      // Enforce maxEntries limit
      if (strategy.maxEntries) {
        this.enforceMaxEntries(strategy);
      }
    } catch (error) {
      console.warn('Error writing to cache:', error);
      // If storage is full, try to clear old entries
      this.cleanup();
    }
  }

  private enforceMaxEntries(strategy: CacheStrategy): void {
    const prefix = `mobile-cache-${strategy.name}-`;
    const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
    
    if (keys.length > strategy.maxEntries!) {
      // Sort by timestamp (oldest first)
      const entries = keys.map(key => ({
        key,
        timestamp: JSON.parse(localStorage.getItem(key) || '{}').timestamp || 0,
      })).sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest entries
      const toRemove = entries.slice(0, keys.length - strategy.maxEntries!);
      toRemove.forEach(entry => localStorage.removeItem(entry.key));
    }
  }

  public cleanup(): void {
    const now = Date.now();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mobile-cache-')) {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(key) || '{}');
          const strategy = this.getStrategyFromKey(key);
          
          if (strategy && now - timestamp > strategy.maxAge) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });
  }

  private getStrategyFromKey(key: string): CacheStrategy | undefined {
    const parts = key.split('-');
    if (parts.length >= 3) {
      const strategyName = parts[2];
      return this.strategies.get(strategyName);
    }
    return undefined;
  }

  public clear(strategyName?: string): void {
    if (strategyName) {
      const prefix = `mobile-cache-${strategyName}-`;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('mobile-cache-')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

// Battery optimization utility
export class BatteryOptimizer {
  private battery: any = null;
  private isLowPowerMode = false;
  private callbacks = new Set<(isLowPower: boolean) => void>();

  constructor() {
    this.initializeBatteryAPI();
  }

  private async initializeBatteryAPI(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        this.battery = await (navigator as any).getBattery();
        this.updatePowerMode();
        
        this.battery.addEventListener('levelchange', () => this.updatePowerMode());
        this.battery.addEventListener('chargingchange', () => this.updatePowerMode());
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  private updatePowerMode(): void {
    if (!this.battery) return;
    
    const wasLowPower = this.isLowPowerMode;
    this.isLowPowerMode = this.battery.level < 0.2 && !this.battery.charging;
    
    if (wasLowPower !== this.isLowPowerMode) {
      this.callbacks.forEach(callback => callback(this.isLowPowerMode));
    }
  }

  public onPowerModeChange(callback: (isLowPower: boolean) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  public isLowPower(): boolean {
    return this.isLowPowerMode;
  }

  public getOptimizationSettings(): {
    reduceAnimations: boolean;
    lowerImageQuality: boolean;
    disableAutoplay: boolean;
    reducePollFrequency: boolean;
  } {
    return {
      reduceAnimations: this.isLowPowerMode,
      lowerImageQuality: this.isLowPowerMode,
      disableAutoplay: this.isLowPowerMode,
      reducePollFrequency: this.isLowPowerMode,
    };
  }
}

// Network optimization utility
export class NetworkOptimizer {
  private connection: any = null;
  private isSlowConnection = false;
  private callbacks = new Set<(isSlow: boolean) => void>();

  constructor() {
    this.initializeNetworkAPI();
  }

  private initializeNetworkAPI(): void {
    if ('connection' in navigator) {
      this.connection = (navigator as any).connection;
      this.updateConnectionStatus();
      
      this.connection.addEventListener('change', () => this.updateConnectionStatus());
    }
  }

  private updateConnectionStatus(): void {
    if (!this.connection) return;
    
    const wasSlow = this.isSlowConnection;
    const effectiveType = this.connection.effectiveType;
    this.isSlowConnection = ['slow-2g', '2g'].includes(effectiveType);
    
    if (wasSlow !== this.isSlowConnection) {
      this.callbacks.forEach(callback => callback(this.isSlowConnection));
    }
  }

  public onConnectionChange(callback: (isSlow: boolean) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  public isSlow(): boolean {
    return this.isSlowConnection;
  }

  public getOptimizationSettings(): {
    preloadStrategy: 'none' | 'metadata' | 'auto';
    imageQuality: number;
    enableCompression: boolean;
    batchRequests: boolean;
  } {
    if (this.isSlowConnection) {
      return {
        preloadStrategy: 'none',
        imageQuality: 0.6,
        enableCompression: true,
        batchRequests: true,
      };
    }
    
    return {
      preloadStrategy: 'metadata',
      imageQuality: 0.8,
      enableCompression: false,
      batchRequests: false,
    };
  }
}

// Initialize global performance monitoring
export const performanceMonitor = new MobilePerformanceMonitor();
export const lazyLoader = new LazyLoader();
export const imageOptimizer = new ImageOptimizer();
export const cacheManager = new MobileCacheManager();
export const batteryOptimizer = new BatteryOptimizer();
export const networkOptimizer = new NetworkOptimizer();

// Auto cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.destroy();
  lazyLoader.disconnect();
  cacheManager.cleanup();
});

// Periodic cache cleanup
setInterval(() => {
  cacheManager.cleanup();
}, 60 * 60 * 1000); // Every hour 