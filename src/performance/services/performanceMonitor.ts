'use client';

import {
  PerformanceMetric,
  PerformanceSnapshot,
  WebVitalsMetrics,
  RuntimePerformanceMetrics,
  PerformanceCategory,
  MetricType,
  MonitoringStatus,
  PerformanceInsight,
  OptimizationRecommendation,
  MetricThreshold,
  AlertSeverity,
  PERFORMANCE_THRESHOLDS,
  DEFAULT_REFRESH_INTERVALS,
} from '../types/performance.types';

class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, Function> = new Map();
  private config: PerformanceMonitoringConfig;
  private isMonitoring = false;

  constructor(config?: Partial<PerformanceMonitoringConfig>) {
    this.config = {
      enabled: true,
      autoStart: true,
      collectWebVitals: true,
      collectRuntime: true,
      collectNavigation: true,
      collectResources: true,
      collectLongTasks: true,
      collectMemory: true,
      samplingRate: 1.0,
      bufferSize: 1000,
      flushInterval: 30000,
      thresholds: PERFORMANCE_THRESHOLDS,
      ...config,
    };

    if (this.config.autoStart && typeof window !== 'undefined') {
      this.startMonitoring();
    }
  }

  // ============================================================================
  // CORE MONITORING LIFECYCLE
  // ============================================================================

  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    console.log('🚀 Performance monitoring started');

    // Initialize Web Vitals collection
    if (this.config.collectWebVitals) {
      this.initializeWebVitals();
    }

    // Initialize Runtime monitoring
    if (this.config.collectRuntime) {
      this.initializeRuntimeMonitoring();
    }

    // Initialize Navigation monitoring
    if (this.config.collectNavigation) {
      this.initializeNavigationMonitoring();
    }

    // Initialize Resource monitoring
    if (this.config.collectResources) {
      this.initializeResourceMonitoring();
    }

    // Initialize Long Task monitoring
    if (this.config.collectLongTasks) {
      this.initializeLongTaskMonitoring();
    }

    // Initialize Memory monitoring
    if (this.config.collectMemory) {
      this.initializeMemoryMonitoring();
    }

    // Start periodic collection
    this.startPeriodicCollection();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');

    // Disconnect all observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();

    // Clear callbacks
    this.callbacks.clear();
  }

  // ============================================================================
  // WEB VITALS COLLECTION
  // ============================================================================

  private initializeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1] as PerformanceEntry & { renderTime: number; loadTime: number };
      const value = lcp.renderTime || lcp.loadTime || lcp.startTime;
      
      this.recordMetric({
        id: 'web_vitals_lcp',
        name: 'Largest Contentful Paint',
        type: 'gauge',
        category: 'core_web_vitals',
        value,
        unit: 'ms',
        timestamp: new Date(),
        labels: { element: this.getLCPElement(lcp) },
        threshold: {
          warning: PERFORMANCE_THRESHOLDS.WEB_VITALS.LCP.needs_improvement,
          critical: PERFORMANCE_THRESHOLDS.WEB_VITALS.LCP.good * 2,
          operator: 'gt',
          duration: 0,
          description: 'LCP should be under 2.5s for good user experience',
        },
      });
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const fid = entries[0] as PerformanceEntry & { processingStart: number };
      const value = fid.processingStart - fid.startTime;
      
      this.recordMetric({
        id: 'web_vitals_fid',
        name: 'First Input Delay',
        type: 'gauge',
        category: 'core_web_vitals',
        value,
        unit: 'ms',
        timestamp: new Date(),
        labels: { event: fid.name },
        threshold: {
          warning: PERFORMANCE_THRESHOLDS.WEB_VITALS.FID.needs_improvement,
          critical: PERFORMANCE_THRESHOLDS.WEB_VITALS.FID.good * 3,
          operator: 'gt',
          duration: 0,
          description: 'FID should be under 100ms for good responsiveness',
        },
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries as any[]) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            
            this.recordMetric({
              id: 'web_vitals_cls',
              name: 'Cumulative Layout Shift',
              type: 'gauge',
              category: 'core_web_vitals',
              value: clsValue,
              unit: 'score',
              timestamp: new Date(),
              labels: { 
                sources: entry.sources?.map((s: any) => s.node?.tagName || 'unknown').join(',') || 'unknown'
              },
              threshold: {
                warning: PERFORMANCE_THRESHOLDS.WEB_VITALS.CLS.needs_improvement,
                critical: PERFORMANCE_THRESHOLDS.WEB_VITALS.CLS.good * 2.5,
                operator: 'gt',
                duration: 0,
                description: 'CLS should be under 0.1 for good visual stability',
              },
            });
          }
        }
      }
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.recordMetric({
          id: 'web_vitals_fcp',
          name: 'First Contentful Paint',
          type: 'gauge',
          category: 'core_web_vitals',
          value: fcp.startTime,
          unit: 'ms',
          timestamp: new Date(),
          labels: {},
          threshold: {
            warning: PERFORMANCE_THRESHOLDS.WEB_VITALS.FCP.needs_improvement,
            critical: PERFORMANCE_THRESHOLDS.WEB_VITALS.FCP.good * 2,
            operator: 'gt',
            duration: 0,
            description: 'FCP should be under 1.8s for good perceived performance',
          },
        });
      }
    });

    // Time to First Byte (TTFB)
    if (window.performance.timing) {
      const ttfb = window.performance.timing.responseStart - window.performance.timing.navigationStart;
      this.recordMetric({
        id: 'web_vitals_ttfb',
        name: 'Time to First Byte',
        type: 'gauge',
        category: 'core_web_vitals',
        value: ttfb,
        unit: 'ms',
        timestamp: new Date(),
        labels: {},
        threshold: {
          warning: PERFORMANCE_THRESHOLDS.WEB_VITALS.TTFB.needs_improvement,
          critical: PERFORMANCE_THRESHOLDS.WEB_VITALS.TTFB.good * 2,
          operator: 'gt',
          duration: 0,
          description: 'TTFB should be under 800ms for good server response',
        },
      });
    }
  }

  // ============================================================================
  // RUNTIME PERFORMANCE MONITORING
  // ============================================================================

  private initializeRuntimeMonitoring(): void {
    const collectRuntimeMetrics = () => {
      try {
        // Memory metrics
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          
          this.recordMetric({
            id: 'runtime_memory_used',
            name: 'JS Heap Size Used',
            type: 'gauge',
            category: 'runtime',
            value: memory.usedJSHeapSize,
            unit: 'bytes',
            timestamp: new Date(),
            labels: { type: 'heap' },
            threshold: {
              warning: memory.jsHeapSizeLimit * 0.7,
              critical: memory.jsHeapSizeLimit * 0.9,
              operator: 'gt',
              duration: 5000,
              description: 'Memory usage should not exceed 70% of heap limit',
            },
          });

          this.recordMetric({
            id: 'runtime_memory_total',
            name: 'JS Heap Size Total',
            type: 'gauge',
            category: 'runtime',
            value: memory.totalJSHeapSize,
            unit: 'bytes',
            timestamp: new Date(),
            labels: { type: 'heap' },
          });
        }

        // Frame rate monitoring
        this.measureFrameRate();

        // Task duration monitoring
        this.measureTaskDuration();

      } catch (error) {
        console.warn('Runtime metrics collection failed:', error);
      }
    };

    // Collect runtime metrics every 5 seconds
    const interval = setInterval(collectRuntimeMetrics, 5000);
    this.intervals.set('runtime', interval);

    // Initial collection
    collectRuntimeMetrics();
  }

  private measureFrameRate(): void {
    let frames = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        this.recordMetric({
          id: 'runtime_frame_rate',
          name: 'Frame Rate',
          type: 'gauge',
          category: 'runtime',
          value: fps,
          unit: 'fps',
          timestamp: new Date(),
          labels: {},
          threshold: {
            warning: PERFORMANCE_THRESHOLDS.RUNTIME.FRAME_RATE.warning,
            critical: PERFORMANCE_THRESHOLDS.RUNTIME.FRAME_RATE.critical,
            operator: 'lt',
            duration: 3000,
            description: 'Frame rate should maintain 60fps for smooth interactions',
          },
        });

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }

  private measureTaskDuration(): void {
    const originalSetTimeout = window.setTimeout;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    
    // Measure setTimeout tasks
    window.setTimeout = function(callback: Function, delay: number = 0) {
      const start = performance.now();
      return originalSetTimeout(() => {
        const duration = performance.now() - start;
        if (duration > 50) { // Only track tasks longer than 50ms
          this.recordMetric({
            id: 'runtime_task_duration',
            name: 'Task Duration',
            type: 'histogram',
            category: 'runtime',
            value: duration,
            unit: 'ms',
            timestamp: new Date(),
            labels: { type: 'timeout' },
            threshold: {
              warning: PERFORMANCE_THRESHOLDS.RUNTIME.TASK_DURATION.warning,
              critical: PERFORMANCE_THRESHOLDS.RUNTIME.TASK_DURATION.critical,
              operator: 'gt',
              duration: 0,
              description: 'Long tasks should be under 50ms to avoid blocking main thread',
            },
          });
        }
        callback();
      }, delay);
    }.bind(this);

    // Measure RAF tasks
    window.requestAnimationFrame = function(callback: FrameRequestCallback) {
      return originalRequestAnimationFrame((timestamp) => {
        const start = performance.now();
        callback(timestamp);
        const duration = performance.now() - start;
        
        if (duration > 16.67) { // Tasks longer than one frame (60fps)
          this.recordMetric({
            id: 'runtime_frame_task_duration',
            name: 'Frame Task Duration',
            type: 'histogram',
            category: 'runtime',
            value: duration,
            unit: 'ms',
            timestamp: new Date(),
            labels: { type: 'animation_frame' },
          });
        }
      });
    }.bind(this);
  }

  // ============================================================================
  // NAVIGATION MONITORING
  // ============================================================================

  private initializeNavigationMonitoring(): void {
    this.observePerformanceEntry('navigation', (entries) => {
      const nav = entries[0] as PerformanceNavigationTiming;
      if (!nav) return;

      // DNS lookup time
      this.recordMetric({
        id: 'navigation_dns_time',
        name: 'DNS Lookup Time',
        type: 'gauge',
        category: 'network',
        value: nav.domainLookupEnd - nav.domainLookupStart,
        unit: 'ms',
        timestamp: new Date(),
        labels: { type: 'dns' },
      });

      // Connection time
      this.recordMetric({
        id: 'navigation_connect_time',
        name: 'Connection Time',
        type: 'gauge',
        category: 'network',
        value: nav.connectEnd - nav.connectStart,
        unit: 'ms',
        timestamp: new Date(),
        labels: { type: 'connection' },
      });

      // Request time
      this.recordMetric({
        id: 'navigation_request_time',
        name: 'Request Time',
        type: 'gauge',
        category: 'network',
        value: nav.responseStart - nav.requestStart,
        unit: 'ms',
        timestamp: new Date(),
        labels: { type: 'request' },
      });

      // Response time
      this.recordMetric({
        id: 'navigation_response_time',
        name: 'Response Time',
        type: 'gauge',
        category: 'network',
        value: nav.responseEnd - nav.responseStart,
        unit: 'ms',
        timestamp: new Date(),
        labels: { type: 'response' },
      });

      // DOM processing time
      this.recordMetric({
        id: 'navigation_dom_processing_time',
        name: 'DOM Processing Time',
        type: 'gauge',
        category: 'rendering',
        value: nav.domComplete - nav.domLoading,
        unit: 'ms',
        timestamp: new Date(),
        labels: { type: 'dom_processing' },
      });

      // Load complete time
      this.recordMetric({
        id: 'navigation_load_complete_time',
        name: 'Load Complete Time',
        type: 'gauge',
        category: 'rendering',
        value: nav.loadEventEnd - nav.navigationStart,
        unit: 'ms',
        timestamp: new Date(),
        labels: { type: 'load_complete' },
      });
    });
  }

  // ============================================================================
  // RESOURCE MONITORING
  // ============================================================================

  private initializeResourceMonitoring(): void {
    this.observePerformanceEntry('resource', (entries) => {
      entries.forEach((resource: PerformanceResourceTiming) => {
        const duration = resource.responseEnd - resource.startTime;
        const size = resource.transferSize || resource.encodedBodySize || 0;
        
        this.recordMetric({
          id: 'resource_load_time',
          name: 'Resource Load Time',
          type: 'histogram',
          category: 'network',
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          labels: {
            resource: this.getResourceName(resource.name),
            type: this.getResourceType(resource),
            cached: resource.transferSize === 0 ? 'true' : 'false',
          },
        });

        this.recordMetric({
          id: 'resource_size',
          name: 'Resource Size',
          type: 'histogram',
          category: 'network',
          value: size,
          unit: 'bytes',
          timestamp: new Date(),
          labels: {
            resource: this.getResourceName(resource.name),
            type: this.getResourceType(resource),
          },
        });

        // Track slow resources
        if (duration > 1000) {
          this.recordMetric({
            id: 'resource_slow_load',
            name: 'Slow Resource Load',
            type: 'counter',
            category: 'network',
            value: 1,
            unit: 'count',
            timestamp: new Date(),
            labels: {
              resource: this.getResourceName(resource.name),
              type: this.getResourceType(resource),
              duration: duration.toString(),
            },
          });
        }
      });
    });
  }

  // ============================================================================
  // LONG TASK MONITORING
  // ============================================================================

  private initializeLongTaskMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.observePerformanceEntry('longtask', (entries) => {
          entries.forEach((task: any) => {
            this.recordMetric({
              id: 'runtime_long_task',
              name: 'Long Task',
              type: 'histogram',
              category: 'runtime',
              value: task.duration,
              unit: 'ms',
              timestamp: new Date(),
              labels: {
                attribution: task.attribution?.[0]?.name || 'unknown',
                container: task.attribution?.[0]?.containerType || 'unknown',
              },
              threshold: {
                warning: 50,
                critical: 100,
                operator: 'gt',
                duration: 0,
                description: 'Long tasks block the main thread and should be avoided',
              },
            });
          });
        });
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }
  }

  // ============================================================================
  // MEMORY MONITORING
  // ============================================================================

  private initializeMemoryMonitoring(): void {
    const collectMemoryMetrics = () => {
      try {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          
          this.recordMetric({
            id: 'memory_usage_percentage',
            name: 'Memory Usage Percentage',
            type: 'gauge',
            category: 'runtime',
            value: usagePercentage,
            unit: 'percent',
            timestamp: new Date(),
            labels: { type: 'heap_percentage' },
            threshold: {
              warning: PERFORMANCE_THRESHOLDS.RUNTIME.MEMORY_USAGE.warning,
              critical: PERFORMANCE_THRESHOLDS.RUNTIME.MEMORY_USAGE.critical,
              operator: 'gt',
              duration: 10000,
              description: 'Memory usage should not exceed 80% to prevent GC pressure',
            },
          });
        }

        // Monitor potential memory leaks
        this.detectMemoryLeaks();
      } catch (error) {
        console.warn('Memory monitoring failed:', error);
      }
    };

    const interval = setInterval(collectMemoryMetrics, 10000); // Every 10 seconds
    this.intervals.set('memory', interval);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        if (Math.random() > this.config.samplingRate) return;
        callback(list.getEntries());
      });

      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    // Store metric
    this.metrics.set(metric.id, metric);

    // Check thresholds and trigger alerts
    if (metric.threshold) {
      this.checkThreshold(metric);
    }

    // Trigger callbacks
    this.callbacks.forEach((callback) => {
      try {
        callback(metric);
      } catch (error) {
        console.warn('Metric callback failed:', error);
      }
    });

    // Maintain buffer size
    if (this.metrics.size > this.config.bufferSize) {
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }
  }

  private checkThreshold(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    const { warning, critical, operator } = metric.threshold;
    const value = metric.value;

    let violationLevel: AlertSeverity | null = null;

    switch (operator) {
      case 'gt':
        if (value > critical) violationLevel = 'critical';
        else if (value > warning) violationLevel = 'warning';
        break;
      case 'lt':
        if (value < critical) violationLevel = 'critical';
        else if (value < warning) violationLevel = 'warning';
        break;
      case 'gte':
        if (value >= critical) violationLevel = 'critical';
        else if (value >= warning) violationLevel = 'warning';
        break;
      case 'lte':
        if (value <= critical) violationLevel = 'critical';
        else if (value <= warning) violationLevel = 'warning';
        break;
    }

    if (violationLevel) {
      this.triggerAlert(metric, violationLevel);
    }
  }

  private triggerAlert(metric: PerformanceMetric, severity: AlertSeverity): void {
    console.warn(`🚨 Performance Alert [${severity.toUpperCase()}]: ${metric.name} = ${metric.value}${metric.unit}`);
    
    // Emit custom event for alert handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-alert', {
        detail: { metric, severity }
      }));
    }
  }

  private getLCPElement(lcp: any): string {
    if (lcp.element) {
      return lcp.element.tagName?.toLowerCase() || 'unknown';
    }
    return 'unknown';
  }

  private getResourceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || 'root';
    } catch {
      return 'unknown';
    }
  }

  private getResourceType(resource: PerformanceResourceTiming): string {
    const name = resource.name.toLowerCase();
    
    if (name.includes('.js')) return 'script';
    if (name.includes('.css')) return 'stylesheet';
    if (name.includes('.png') || name.includes('.jpg') || name.includes('.jpeg') || name.includes('.gif') || name.includes('.webp')) return 'image';
    if (name.includes('.woff') || name.includes('.woff2') || name.includes('.ttf') || name.includes('.otf')) return 'font';
    if (name.includes('/api/')) return 'api';
    if (resource.initiatorType) return resource.initiatorType;
    
    return 'other';
  }

  private detectMemoryLeaks(): void {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    const currentUsage = memory.usedJSHeapSize;
    
    // Store usage history for trend analysis
    const usageHistory = this.getUsageHistory();
    usageHistory.push({ timestamp: Date.now(), usage: currentUsage });
    
    // Keep only last 10 measurements
    if (usageHistory.length > 10) {
      usageHistory.shift();
    }
    
    this.setUsageHistory(usageHistory);

    // Detect upward trend
    if (usageHistory.length >= 5) {
      const trend = this.calculateTrend(usageHistory);
      if (trend > 1.1) { // 10% increase trend
        this.recordMetric({
          id: 'memory_leak_detection',
          name: 'Memory Leak Detection',
          type: 'gauge',
          category: 'runtime',
          value: trend,
          unit: 'ratio',
          timestamp: new Date(),
          labels: { 
            type: 'leak_detection',
            trend: trend.toFixed(2),
          },
          threshold: {
            warning: 1.1,
            critical: 1.3,
            operator: 'gt',
            duration: 0,
            description: 'Potential memory leak detected',
          },
        });
      }
    }
  }

  private getUsageHistory(): Array<{ timestamp: number; usage: number }> {
    const stored = sessionStorage.getItem('perf_memory_history');
    return stored ? JSON.parse(stored) : [];
  }

  private setUsageHistory(history: Array<{ timestamp: number; usage: number }>): void {
    sessionStorage.setItem('perf_memory_history', JSON.stringify(history));
  }

  private calculateTrend(history: Array<{ timestamp: number; usage: number }>): number {
    if (history.length < 2) return 1;
    
    const first = history[0].usage;
    const last = history[history.length - 1].usage;
    
    return last / first;
  }

  private startPeriodicCollection(): void {
    const interval = setInterval(() => {
      this.collectCustomMetrics();
    }, this.config.flushInterval);
    
    this.intervals.set('periodic', interval);
  }

  private collectCustomMetrics(): void {
    // Collect React-specific metrics if available
    this.collectReactMetrics();
    
    // Collect Next.js metrics if available
    this.collectNextJSMetrics();
    
    // Collect bundle metrics
    this.collectBundleMetrics();
  }

  private collectReactMetrics(): void {
    // React DevTools metrics (if available)
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // Collect component render times, fiber work, etc.
      // This would require React DevTools integration
    }
  }

  private collectNextJSMetrics(): void {
    // Next.js specific metrics
    if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
      const nextData = (window as any).__NEXT_DATA__;
      
      this.recordMetric({
        id: 'nextjs_page_load',
        name: 'Next.js Page Load',
        type: 'gauge',
        category: 'custom',
        value: performance.now(),
        unit: 'ms',
        timestamp: new Date(),
        labels: {
          page: nextData.page || 'unknown',
          buildId: nextData.buildId || 'unknown',
        },
      });
    }
  }

  private collectBundleMetrics(): void {
    // Collect information about loaded scripts
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src && this.isOwnScript(src)) {
        // Get size from performance resource timing
        const resource = performance.getEntriesByName(src)[0] as PerformanceResourceTiming;
        if (resource) {
          totalSize += resource.transferSize || resource.encodedBodySize || 0;
        }
      }
    });

    this.recordMetric({
      id: 'bundle_total_size',
      name: 'Total Bundle Size',
      type: 'gauge',
      category: 'custom',
      value: totalSize,
      unit: 'bytes',
      timestamp: new Date(),
      labels: { type: 'javascript' },
    });
  }

  private isOwnScript(src: string): boolean {
    // Check if script is from same origin or our CDN
    try {
      const url = new URL(src);
      return url.origin === window.location.origin || 
             url.hostname.includes(window.location.hostname);
    } catch {
      return false;
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  getMetric(id: string): PerformanceMetric | undefined {
    return this.metrics.get(id);
  }

  getMetricsByCategory(category: PerformanceCategory): PerformanceMetric[] {
    return this.getMetrics().filter(metric => metric.category === category);
  }

  getSnapshot(): PerformanceSnapshot {
    const metrics = this.getMetrics();
    const insights = this.generateInsights(metrics);
    const recommendations = this.generateRecommendations(metrics);
    
    return {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date(),
      metrics,
      status: this.calculateOverallStatus(metrics),
      score: this.calculatePerformanceScore(metrics),
      insights,
      recommendations,
      duration: performance.now(),
      environment: process.env.NODE_ENV || 'unknown',
    };
  }

  private generateInsights(metrics: PerformanceMetric[]): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];

    // LCP insights
    const lcp = metrics.find(m => m.id === 'web_vitals_lcp');
    if (lcp && lcp.value > PERFORMANCE_THRESHOLDS.WEB_VITALS.LCP.needs_improvement) {
      insights.push({
        id: 'lcp_slow',
        type: 'regression',
        severity: lcp.value > PERFORMANCE_THRESHOLDS.WEB_VITALS.LCP.good * 2 ? 'critical' : 'warning',
        title: 'Slow Largest Contentful Paint',
        description: `LCP is ${lcp.value.toFixed(0)}ms, which affects user experience`,
        impact: Math.min(100, (lcp.value / PERFORMANCE_THRESHOLDS.WEB_VITALS.LCP.good) * 50),
        category: 'core_web_vitals',
        metrics: ['web_vitals_lcp'],
        suggestion: 'Optimize largest content element, consider image optimization or server response time',
      });
    }

    // Memory insights
    const memoryUsage = metrics.find(m => m.id === 'memory_usage_percentage');
    if (memoryUsage && memoryUsage.value > PERFORMANCE_THRESHOLDS.RUNTIME.MEMORY_USAGE.warning) {
      insights.push({
        id: 'high_memory_usage',
        type: 'anomaly',
        severity: memoryUsage.value > PERFORMANCE_THRESHOLDS.RUNTIME.MEMORY_USAGE.critical ? 'critical' : 'warning',
        title: 'High Memory Usage',
        description: `Memory usage at ${memoryUsage.value.toFixed(1)}%`,
        impact: memoryUsage.value,
        category: 'runtime',
        metrics: ['memory_usage_percentage'],
        suggestion: 'Check for memory leaks, optimize data structures, implement cleanup',
      });
    }

    // Long task insights
    const longTasks = metrics.filter(m => m.id === 'runtime_long_task');
    if (longTasks.length > 0) {
      const avgDuration = longTasks.reduce((sum, task) => sum + task.value, 0) / longTasks.length;
      insights.push({
        id: 'frequent_long_tasks',
        type: 'regression',
        severity: avgDuration > 100 ? 'critical' : 'warning',
        title: 'Frequent Long Tasks',
        description: `${longTasks.length} long tasks detected with average duration ${avgDuration.toFixed(0)}ms`,
        impact: Math.min(100, longTasks.length * 10),
        category: 'runtime',
        metrics: ['runtime_long_task'],
        suggestion: 'Break up long tasks, use scheduling APIs, implement code splitting',
      });
    }

    return insights;
  }

  private generateRecommendations(metrics: PerformanceMetric[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Bundle size recommendations
    const bundleSize = metrics.find(m => m.id === 'bundle_total_size');
    if (bundleSize && bundleSize.value > 1024 * 1024) { // > 1MB
      recommendations.push({
        id: 'optimize_bundle_size',
        priority: 'high',
        category: 'rendering',
        title: 'Optimize Bundle Size',
        description: 'Large bundle size affects loading performance',
        estimatedImpact: 25,
        estimatedEffort: 'medium',
        implementation: {
          type: 'code',
          steps: [
            'Implement code splitting',
            'Remove unused dependencies',
            'Enable tree shaking',
            'Optimize third-party libraries',
          ],
          codeExample: `
// Dynamic imports for code splitting
const Component = lazy(() => import('./Component'));

// Tree shaking optimization
import { specificFunction } from 'library';
          `,
        },
        metrics: ['bundle_total_size'],
        status: 'pending',
      });
    }

    // Performance recommendations based on Web Vitals
    const cls = metrics.find(m => m.id === 'web_vitals_cls');
    if (cls && cls.value > PERFORMANCE_THRESHOLDS.WEB_VITALS.CLS.good) {
      recommendations.push({
        id: 'reduce_layout_shift',
        priority: 'medium',
        category: 'rendering',
        title: 'Reduce Cumulative Layout Shift',
        description: 'Layout shifts harm user experience and SEO',
        estimatedImpact: 20,
        estimatedEffort: 'medium',
        implementation: {
          type: 'code',
          steps: [
            'Add size attributes to images',
            'Reserve space for dynamic content',
            'Avoid inserting content above existing content',
            'Use CSS transforms for animations',
          ],
          codeExample: `
// Reserve space for images
<img src="image.jpg" width="400" height="300" alt="Description" />

// Use transforms instead of changing layout properties
.animate {
  transform: translateY(10px);
  transition: transform 0.3s ease;
}
          `,
        },
        metrics: ['web_vitals_cls'],
        status: 'pending',
      });
    }

    return recommendations;
  }

  private calculateOverallStatus(metrics: PerformanceMetric[]): MonitoringStatus {
    let criticalCount = 0;
    let warningCount = 0;

    metrics.forEach(metric => {
      if (metric.threshold) {
        const { warning, critical, operator } = metric.threshold;
        const value = metric.value;

        switch (operator) {
          case 'gt':
            if (value > critical) criticalCount++;
            else if (value > warning) warningCount++;
            break;
          case 'lt':
            if (value < critical) criticalCount++;
            else if (value < warning) warningCount++;
            break;
        }
      }
    });

    if (criticalCount > 0) return 'critical';
    if (warningCount > 2) return 'degraded';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }

  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    // Web Vitals scoring (0-100)
    const lcp = metrics.find(m => m.id === 'web_vitals_lcp');
    const fid = metrics.find(m => m.id === 'web_vitals_fid');
    const cls = metrics.find(m => m.id === 'web_vitals_cls');

    let score = 100;

    if (lcp) {
      const lcpScore = Math.max(0, 100 - (lcp.value / PERFORMANCE_THRESHOLDS.WEB_VITALS.LCP.good) * 50);
      score = (score + lcpScore) / 2;
    }

    if (fid) {
      const fidScore = Math.max(0, 100 - (fid.value / PERFORMANCE_THRESHOLDS.WEB_VITALS.FID.good) * 50);
      score = (score + fidScore) / 2;
    }

    if (cls) {
      const clsScore = Math.max(0, 100 - (cls.value / PERFORMANCE_THRESHOLDS.WEB_VITALS.CLS.good) * 100);
      score = (score + clsScore) / 2;
    }

    return Math.round(score);
  }

  onMetric(callback: (metric: PerformanceMetric) => void): () => void {
    const id = Math.random().toString(36);
    this.callbacks.set(id, callback);
    
    return () => {
      this.callbacks.delete(id);
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      snapshot: this.getSnapshot(),
    }, null, 2);
  }
}

interface PerformanceMonitoringConfig {
  enabled: boolean;
  autoStart: boolean;
  collectWebVitals: boolean;
  collectRuntime: boolean;
  collectNavigation: boolean;
  collectResources: boolean;
  collectLongTasks: boolean;
  collectMemory: boolean;
  samplingRate: number;
  bufferSize: number;
  flushInterval: number;
  thresholds: any;
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitoringService();
export default performanceMonitor; 