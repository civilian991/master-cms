'use client';

import {
  CacheConfiguration,
  CacheSystem,
  CacheLayer,
  CacheMetrics,
  CacheStrategy,
  CacheInvalidationRule,
  CacheWarmupStrategy,
  CacheOperationMetrics,
  CachePerformanceMetrics,
  CacheRecommendation,
} from '../types/performance.types';

class CacheManagerService {
  private layers: Map<string, CacheLayer> = new Map();
  private metrics: Map<string, CacheMetrics> = new Map();
  private invalidationRules: Map<string, CacheInvalidationRule[]> = new Map();
  private warmupStrategies: Map<string, CacheWarmupStrategy> = new Map();
  private activeWarmups: Set<string> = new Set();
  private config: CacheManagerConfig;

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = {
      enableAnalytics: true,
      enableOptimization: true,
      enablePredictiveWarming: true,
      globalTTL: 3600000, // 1 hour
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      evictionThreshold: 0.8,
      compressionThreshold: 1024, // 1KB
      ...config,
    };

    this.initializeDefaultLayers();
  }

  // ============================================================================
  // CACHE LAYER MANAGEMENT
  // ============================================================================

  private initializeDefaultLayers(): void {
    // Memory cache layer
    this.addLayer({
      name: 'memory',
      type: 'memory',
      configuration: {
        name: 'memory',
        strategy: 'lru',
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        compression: false,
        serialization: 'json',
        keyPrefix: 'mem:',
        tags: ['memory', 'fast'],
        invalidationRules: [],
      },
      metrics: this.createEmptyMetrics(),
      status: 'healthy',
      enabled: true,
    });

    // Browser cache layer
    if (typeof window !== 'undefined') {
      this.addLayer({
        name: 'browser',
        type: 'browser',
        configuration: {
          name: 'browser',
          strategy: 'ttl',
          maxSize: 100,
          ttl: 1800000, // 30 minutes
          compression: true,
          serialization: 'json',
          keyPrefix: 'browser:',
          tags: ['browser', 'persistent'],
          invalidationRules: [],
        },
        metrics: this.createEmptyMetrics(),
        status: 'healthy',
        enabled: true,
      });
    }

    // Service Worker cache layer
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      this.addLayer({
        name: 'service_worker',
        type: 'service_worker',
        configuration: {
          name: 'service_worker',
          strategy: 'lru',
          maxSize: 500,
          ttl: 7200000, // 2 hours
          compression: true,
          serialization: 'json',
          keyPrefix: 'sw:',
          tags: ['service_worker', 'offline'],
          invalidationRules: [],
        },
        metrics: this.createEmptyMetrics(),
        status: 'healthy',
        enabled: true,
      });
    }
  }

  addLayer(layer: CacheLayer): void {
    this.layers.set(layer.name, layer);
    this.metrics.set(layer.name, layer.metrics);
    this.initializeLayerStorage(layer);
    console.log(`✅ Cache layer "${layer.name}" added`);
  }

  removeLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      this.clearLayer(name);
      this.layers.delete(name);
      this.metrics.delete(name);
      console.log(`🗑️ Cache layer "${name}" removed`);
    }
  }

  getLayer(name: string): CacheLayer | undefined {
    return this.layers.get(name);
  }

  getAllLayers(): CacheLayer[] {
    return Array.from(this.layers.values());
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  async get<T = any>(key: string, layerName?: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      if (layerName) {
        // Get from specific layer
        const result = await this.getFromLayer<T>(key, layerName);
        this.recordOperation(layerName, 'get', performance.now() - startTime, result !== null);
        return result;
      }

      // Get from layers in order of speed (memory -> browser -> service worker -> redis)
      const layerOrder = ['memory', 'browser', 'service_worker', 'redis'];
      
      for (const name of layerOrder) {
        const layer = this.layers.get(name);
        if (layer && layer.enabled) {
          const result = await this.getFromLayer<T>(key, name);
          if (result !== null) {
            this.recordOperation(name, 'get', performance.now() - startTime, true);
            // Warm faster layers with the result
            await this.warmFasterLayers(key, result, name, layerOrder);
            return result;
          }
        }
      }

      // Record miss for all layers
      layerOrder.forEach(name => {
        if (this.layers.has(name)) {
          this.recordOperation(name, 'get', performance.now() - startTime, false);
        }
      });

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const startTime = performance.now();
    
    try {
      const {
        ttl = this.config.globalTTL,
        layers = ['memory', 'browser'],
        tags = [],
        compress = false,
      } = options || {};

      // Set in specified layers
      const promises = layers
        .map(name => this.layers.get(name))
        .filter((layer): layer is CacheLayer => layer !== undefined && layer.enabled)
        .map(async (layer) => {
          try {
            await this.setInLayer(key, value, layer.name, { ttl, tags, compress });
            this.recordOperation(layer.name, 'set', performance.now() - startTime, true);
          } catch (error) {
            console.error(`Failed to set in layer ${layer.name}:`, error);
            this.recordOperation(layer.name, 'set', performance.now() - startTime, false);
          }
        });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string, layerName?: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (layerName) {
        await this.deleteFromLayer(key, layerName);
        this.recordOperation(layerName, 'delete', performance.now() - startTime, true);
        return;
      }

      // Delete from all layers
      const promises = Array.from(this.layers.values())
        .filter(layer => layer.enabled)
        .map(async (layer) => {
          try {
            await this.deleteFromLayer(key, layer.name);
            this.recordOperation(layer.name, 'delete', performance.now() - startTime, true);
          } catch (error) {
            this.recordOperation(layer.name, 'delete', performance.now() - startTime, false);
          }
        });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(layerName?: string): Promise<void> {
    if (layerName) {
      await this.clearLayer(layerName);
      return;
    }

    // Clear all layers
    const promises = Array.from(this.layers.keys()).map(name => this.clearLayer(name));
    await Promise.allSettled(promises);
    console.log('🧹 All cache layers cleared');
  }

  // ============================================================================
  // LAYER-SPECIFIC OPERATIONS
  // ============================================================================

  private async getFromLayer<T>(key: string, layerName: string): Promise<T | null> {
    const layer = this.layers.get(layerName);
    if (!layer) return null;

    const fullKey = this.buildKey(key, layer.configuration.keyPrefix);

    switch (layer.type) {
      case 'memory':
        return this.getFromMemory<T>(fullKey);
      case 'browser':
        return this.getFromBrowser<T>(fullKey);
      case 'service_worker':
        return this.getFromServiceWorker<T>(fullKey);
      case 'redis':
        return this.getFromRedis<T>(fullKey);
      default:
        return null;
    }
  }

  private async setInLayer<T>(
    key: string, 
    value: T, 
    layerName: string, 
    options: { ttl: number; tags: string[]; compress: boolean }
  ): Promise<void> {
    const layer = this.layers.get(layerName);
    if (!layer) return;

    const fullKey = this.buildKey(key, layer.configuration.keyPrefix);
    const serializedValue = this.serialize(value, layer.configuration.serialization);
    const finalValue = options.compress && serializedValue.length > this.config.compressionThreshold
      ? await this.compress(serializedValue)
      : serializedValue;

    switch (layer.type) {
      case 'memory':
        this.setInMemory(fullKey, finalValue, options.ttl);
        break;
      case 'browser':
        this.setInBrowser(fullKey, finalValue, options.ttl);
        break;
      case 'service_worker':
        await this.setInServiceWorker(fullKey, finalValue, options.ttl);
        break;
      case 'redis':
        await this.setInRedis(fullKey, finalValue, options.ttl);
        break;
    }
  }

  private async deleteFromLayer(key: string, layerName: string): Promise<void> {
    const layer = this.layers.get(layerName);
    if (!layer) return;

    const fullKey = this.buildKey(key, layer.configuration.keyPrefix);

    switch (layer.type) {
      case 'memory':
        this.deleteFromMemory(fullKey);
        break;
      case 'browser':
        this.deleteFromBrowser(fullKey);
        break;
      case 'service_worker':
        await this.deleteFromServiceWorker(fullKey);
        break;
      case 'redis':
        await this.deleteFromRedis(fullKey);
        break;
    }
  }

  // ============================================================================
  // MEMORY CACHE IMPLEMENTATION
  // ============================================================================

  private memoryCache = new Map<string, { value: any; expiry: number; lastAccessed: number }>();

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    item.lastAccessed = Date.now();
    return this.deserialize<T>(item.value, 'json');
  }

  private setInMemory(key: string, value: any, ttl: number): void {
    // Check memory limits
    if (this.memoryCache.size >= this.config.maxMemoryUsage) {
      this.evictMemoryItems();
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
    });
  }

  private deleteFromMemory(key: string): void {
    this.memoryCache.delete(key);
  }

  private evictMemoryItems(): void {
    const layer = this.layers.get('memory');
    if (!layer) return;

    const items = Array.from(this.memoryCache.entries());
    
    switch (layer.configuration.strategy) {
      case 'lru':
        items.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'ttl':
        items.sort((a, b) => a[1].expiry - b[1].expiry);
        break;
    }

    // Remove oldest 20% of items
    const toRemove = Math.ceil(items.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(items[i][0]);
    }
  }

  // ============================================================================
  // BROWSER CACHE IMPLEMENTATION
  // ============================================================================

  private getFromBrowser<T>(key: string): T | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return this.deserialize<T>(parsed.value, 'json');
    } catch (error) {
      console.warn('Browser cache get error:', error);
      return null;
    }
  }

  private setInBrowser(key: string, value: any, ttl: number): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const item = {
        value,
        expiry: Date.now() + ttl,
        created: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        this.clearExpiredBrowserItems();
        try {
          localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + ttl }));
        } catch {
          console.warn('Browser cache storage quota exceeded');
        }
      } else {
        console.warn('Browser cache set error:', error);
      }
    }
  }

  private deleteFromBrowser(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(key);
  }

  private clearExpiredBrowserItems(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.expiry && Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Invalid JSON, remove it
        localStorage.removeItem(key);
      }
    });
  }

  // ============================================================================
  // SERVICE WORKER CACHE IMPLEMENTATION
  // ============================================================================

  private async getFromServiceWorker<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        return new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            const { success, data } = event.data;
            resolve(success ? this.deserialize<T>(data, 'json') : null);
          };

          registration.active!.postMessage({
            type: 'CACHE_GET',
            key,
          }, [channel.port2]);

          // Timeout after 1 second
          setTimeout(() => resolve(null), 1000);
        });
      }
    } catch (error) {
      console.warn('Service Worker cache get error:', error);
    }

    return null;
  }

  private async setInServiceWorker(key: string, value: any, ttl: number): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_SET',
          key,
          value,
          ttl,
        });
      }
    } catch (error) {
      console.warn('Service Worker cache set error:', error);
    }
  }

  private async deleteFromServiceWorker(key: string): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_DELETE',
          key,
        });
      }
    } catch (error) {
      console.warn('Service Worker cache delete error:', error);
    }
  }

  // ============================================================================
  // REDIS CACHE IMPLEMENTATION (stub for server-side)
  // ============================================================================

  private async getFromRedis<T>(key: string): Promise<T | null> {
    // This would be implemented on the server side
    // For client-side, we'll use a fetch to our cache API
    try {
      const response = await fetch(`/api/cache/${encodeURIComponent(key)}`);
      if (response.ok) {
        const data = await response.json();
        return this.deserialize<T>(data.value, 'json');
      }
    } catch (error) {
      console.warn('Redis cache get error:', error);
    }
    return null;
  }

  private async setInRedis(key: string, value: any, ttl: number): Promise<void> {
    try {
      await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, ttl }),
      });
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }
  }

  private async deleteFromRedis(key: string): Promise<void> {
    try {
      await fetch(`/api/cache/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Redis cache delete error:', error);
    }
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  async warmCache(keys: string[], layerName?: string): Promise<void> {
    console.log(`🔥 Warming cache for ${keys.length} keys`);
    
    const layers = layerName 
      ? [this.layers.get(layerName)].filter(Boolean) as CacheLayer[]
      : Array.from(this.layers.values()).filter(layer => layer.enabled);

    const warmupPromises = keys.map(async (key) => {
      if (this.activeWarmups.has(key)) return;
      
      this.activeWarmups.add(key);
      
      try {
        // Try to get data from slowest layer first
        const sourceLayer = layers.find(l => l.type === 'redis') || layers[layers.length - 1];
        const data = await this.getFromLayer(key, sourceLayer.name);
        
        if (data !== null) {
          // Warm faster layers
          const fasterLayers = layers.filter(l => l !== sourceLayer);
          await Promise.allSettled(
            fasterLayers.map(layer => 
              this.setInLayer(key, data, layer.name, { 
                ttl: layer.configuration.ttl, 
                tags: [], 
                compress: layer.configuration.compression 
              })
            )
          );
        }
      } catch (error) {
        console.warn(`Failed to warm cache for key ${key}:`, error);
      } finally {
        this.activeWarmups.delete(key);
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log(`✅ Cache warming completed for ${keys.length} keys`);
  }

  private async warmFasterLayers<T>(
    key: string, 
    value: T, 
    sourceLayerName: string, 
    layerOrder: string[]
  ): Promise<void> {
    const sourceIndex = layerOrder.indexOf(sourceLayerName);
    if (sourceIndex <= 0) return;

    const fasterLayers = layerOrder
      .slice(0, sourceIndex)
      .map(name => this.layers.get(name))
      .filter((layer): layer is CacheLayer => layer !== undefined && layer.enabled);

    const warmupPromises = fasterLayers.map(layer =>
      this.setInLayer(key, value, layer.name, {
        ttl: layer.configuration.ttl,
        tags: [],
        compress: layer.configuration.compression,
      })
    );

    await Promise.allSettled(warmupPromises);
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  async invalidate(pattern: string, layerName?: string): Promise<void> {
    console.log(`🗑️ Invalidating cache pattern: ${pattern}`);
    
    const layers = layerName 
      ? [this.layers.get(layerName)].filter(Boolean) as CacheLayer[]
      : Array.from(this.layers.values()).filter(layer => layer.enabled);

    const invalidationPromises = layers.map(async (layer) => {
      try {
        await this.invalidateInLayer(pattern, layer.name);
      } catch (error) {
        console.warn(`Failed to invalidate in layer ${layer.name}:`, error);
      }
    });

    await Promise.allSettled(invalidationPromises);
  }

  private async invalidateInLayer(pattern: string, layerName: string): Promise<void> {
    const layer = this.layers.get(layerName);
    if (!layer) return;

    const regex = new RegExp(pattern);

    switch (layer.type) {
      case 'memory':
        Array.from(this.memoryCache.keys())
          .filter(key => regex.test(key))
          .forEach(key => this.memoryCache.delete(key));
        break;
        
      case 'browser':
        if (typeof window !== 'undefined' && window.localStorage) {
          Object.keys(localStorage)
            .filter(key => regex.test(key))
            .forEach(key => localStorage.removeItem(key));
        }
        break;
        
      case 'service_worker':
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({
              type: 'CACHE_INVALIDATE',
              pattern,
            });
          }
        }
        break;
        
      case 'redis':
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern }),
        });
        break;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}${key}` : key;
  }

  private serialize(value: any, method: string): string {
    switch (method) {
      case 'json':
        return JSON.stringify(value);
      case 'msgpack':
        // Would use msgpack library
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  private deserialize<T>(value: string, method: string): T {
    switch (method) {
      case 'json':
        return JSON.parse(value);
      case 'msgpack':
        // Would use msgpack library
        return JSON.parse(value);
      default:
        return value as T;
    }
  }

  private async compress(data: string): Promise<string> {
    // In a real implementation, would use compression library
    return data;
  }

  private async decompress(data: string): Promise<string> {
    // In a real implementation, would use compression library
    return data;
  }

  private initializeLayerStorage(layer: CacheLayer): void {
    switch (layer.type) {
      case 'memory':
        // Already handled in class properties
        break;
      case 'browser':
        // Check localStorage availability
        if (typeof window !== 'undefined' && !window.localStorage) {
          layer.enabled = false;
          layer.status = 'unhealthy';
        }
        break;
      case 'service_worker':
        // Check service worker availability
        if (typeof window !== 'undefined' && !('serviceWorker' in navigator)) {
          layer.enabled = false;
          layer.status = 'unhealthy';
        }
        break;
    }
  }

  private async clearLayer(name: string): Promise<void> {
    const layer = this.layers.get(name);
    if (!layer) return;

    switch (layer.type) {
      case 'memory':
        this.memoryCache.clear();
        break;
      case 'browser':
        if (typeof window !== 'undefined' && window.localStorage) {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith(layer.configuration.keyPrefix || '')) {
              localStorage.removeItem(key);
            }
          });
        }
        break;
      case 'service_worker':
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({ type: 'CACHE_CLEAR' });
          }
        }
        break;
      case 'redis':
        await fetch('/api/cache/clear', { method: 'POST' });
        break;
    }

    console.log(`🧹 Cache layer "${name}" cleared`);
  }

  private recordOperation(
    layerName: string, 
    operation: string, 
    duration: number, 
    success: boolean
  ): void {
    const metrics = this.metrics.get(layerName);
    if (!metrics) return;

    // Update operation metrics
    metrics.operations.gets += operation === 'get' ? 1 : 0;
    metrics.operations.sets += operation === 'set' ? 1 : 0;
    metrics.operations.deletes += operation === 'delete' ? 1 : 0;

    if (operation === 'get') {
      if (success) {
        metrics.hits++;
        metrics.performance.cacheHits++;
      } else {
        metrics.misses++;
        metrics.performance.cacheMisses++;
      }
      metrics.hitRatio = metrics.hits / (metrics.hits + metrics.misses);
    }

    // Update performance metrics
    metrics.performance.totalRequests++;
    
    if (success) {
      metrics.operations.averageGetTime = operation === 'get' 
        ? (metrics.operations.averageGetTime + duration) / 2
        : metrics.operations.averageGetTime;
      metrics.operations.averageSetTime = operation === 'set'
        ? (metrics.operations.averageSetTime + duration) / 2
        : metrics.operations.averageSetTime;
    } else {
      metrics.operations.errors++;
      metrics.performance.errorRate = metrics.operations.errors / metrics.performance.totalRequests;
    }
  }

  private createEmptyMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0,
        clears: 0,
        errors: 0,
        averageGetTime: 0,
        averageSetTime: 0,
      },
      performance: {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitLatency: 0,
        missLatency: 0,
        throughput: 0,
        errorRate: 0,
      },
    };
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getMetrics(layerName?: string): CacheMetrics | Map<string, CacheMetrics> {
    if (layerName) {
      return this.metrics.get(layerName) || this.createEmptyMetrics();
    }
    return this.metrics;
  }

  getGlobalMetrics(): CacheMetrics {
    const globalMetrics = this.createEmptyMetrics();
    
    this.metrics.forEach((metrics) => {
      globalMetrics.hits += metrics.hits;
      globalMetrics.misses += metrics.misses;
      globalMetrics.evictions += metrics.evictions;
      globalMetrics.size += metrics.size;
      globalMetrics.memoryUsage += metrics.memoryUsage;
      
      globalMetrics.operations.gets += metrics.operations.gets;
      globalMetrics.operations.sets += metrics.operations.sets;
      globalMetrics.operations.deletes += metrics.operations.deletes;
      globalMetrics.operations.clears += metrics.operations.clears;
      globalMetrics.operations.errors += metrics.operations.errors;
      
      globalMetrics.performance.totalRequests += metrics.performance.totalRequests;
      globalMetrics.performance.cacheHits += metrics.performance.cacheHits;
      globalMetrics.performance.cacheMisses += metrics.performance.cacheMisses;
    });

    globalMetrics.hitRatio = globalMetrics.hits / (globalMetrics.hits + globalMetrics.misses);
    globalMetrics.performance.errorRate = globalMetrics.operations.errors / globalMetrics.performance.totalRequests;

    return globalMetrics;
  }

  getRecommendations(): CacheRecommendation[] {
    const recommendations: CacheRecommendation[] = [];
    const globalMetrics = this.getGlobalMetrics();

    // Low hit ratio recommendation
    if (globalMetrics.hitRatio < 0.8) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        description: 'Cache hit ratio is below 80%. Consider reviewing cache keys and TTL settings.',
        implementation: 'Analyze cache access patterns and optimize key strategies',
        estimatedImpact: 25,
      });
    }

    // High memory usage recommendation
    if (globalMetrics.memoryUsage > this.config.maxMemoryUsage * 0.8) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        description: 'Memory usage is high. Consider implementing compression or reducing cache size.',
        implementation: 'Enable compression for large values or reduce maxSize configuration',
        estimatedImpact: 15,
      });
    }

    // High error rate recommendation
    if (globalMetrics.performance.errorRate > 0.05) {
      recommendations.push({
        type: 'configuration',
        priority: 'critical',
        description: 'Cache error rate is above 5%. Check layer configurations and connectivity.',
        implementation: 'Review error logs and layer health status',
        estimatedImpact: 40,
      });
    }

    return recommendations;
  }

  getSystemInfo(): CacheSystem {
    return {
      layers: this.getAllLayers(),
      globalMetrics: this.getGlobalMetrics(),
      warmupStrategies: Array.from(this.warmupStrategies.values()),
      invalidationStrategies: [], // Would be implemented
      monitoring: {
        metricsCollection: this.config.enableAnalytics,
        alerting: false,
        thresholds: {},
        reporting: {
          enabled: false,
          frequency: 'hourly',
          metrics: [],
          destinations: [],
        },
      },
    };
  }

  enableLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.enabled = true;
      console.log(`✅ Cache layer "${name}" enabled`);
    }
  }

  disableLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.enabled = false;
      console.log(`⏸️ Cache layer "${name}" disabled`);
    }
  }

  async optimize(): Promise<void> {
    console.log('🔧 Optimizing cache system...');
    
    // Clear expired items
    await this.clearExpired();
    
    // Optimize memory usage
    this.optimizeMemoryUsage();
    
    // Generate and log recommendations
    const recommendations = this.getRecommendations();
    if (recommendations.length > 0) {
      console.log('💡 Cache optimization recommendations:', recommendations);
    }
    
    console.log('✅ Cache optimization completed');
  }

  private async clearExpired(): Promise<void> {
    // Clear expired browser items
    this.clearExpiredBrowserItems();
    
    // Clear expired memory items
    const now = Date.now();
    Array.from(this.memoryCache.entries()).forEach(([key, item]) => {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
      }
    });
  }

  private optimizeMemoryUsage(): void {
    if (this.memoryCache.size > this.config.maxMemoryUsage * this.config.evictionThreshold) {
      this.evictMemoryItems();
    }
  }
}

interface CacheManagerConfig {
  enableAnalytics: boolean;
  enableOptimization: boolean;
  enablePredictiveWarming: boolean;
  globalTTL: number;
  maxMemoryUsage: number;
  evictionThreshold: number;
  compressionThreshold: number;
}

interface CacheSetOptions {
  ttl?: number;
  layers?: string[];
  tags?: string[];
  compress?: boolean;
}

// Export singleton instance
export const cacheManager = new CacheManagerService();
export default cacheManager; 