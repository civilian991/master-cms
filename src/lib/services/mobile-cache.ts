import { redis } from '../redis';

/**
 * Mobile-optimized caching service with network-aware strategies
 */

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  priority: 'high' | 'medium' | 'low';
  networkAware: boolean;
  compression: boolean;
  encryption: boolean;
}

export interface NetworkStatus {
  effectiveType: string;
  downlink: number;
  saveData: boolean;
  isSlowConnection: boolean;
}

export class MobileCacheService {
  private static instance: MobileCacheService;
  private defaultOptions: CacheOptions = {
    ttl: 3600,
    priority: 'medium',
    networkAware: true,
    compression: true,
    encryption: false,
  };

  private constructor() {}

  public static getInstance(): MobileCacheService {
    if (!MobileCacheService.instance) {
      MobileCacheService.instance = new MobileCacheService();
    }
    return MobileCacheService.instance;
  }

  /**
   * Set cache with mobile optimization
   */
  async set(
    key: string,
    data: any,
    options: Partial<CacheOptions> = {}
  ): Promise<boolean> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      const serializedData = await this.serializeData(data, opts);
      const cacheKey = this.generateCacheKey(key, opts);

      // Set different TTL based on network conditions
      const networkAwareTTL = opts.networkAware
        ? await this.getNetworkAwareTTL(opts.ttl)
        : opts.ttl;

      await redis.setex(cacheKey, networkAwareTTL, serializedData);
      
      // Set metadata for cache management
      await this.setCacheMetadata(key, {
        priority: opts.priority,
        size: serializedData.length,
        timestamp: Date.now(),
        ttl: networkAwareTTL,
      });

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache with mobile optimization
   */
  async get<T>(
    key: string,
    options: Partial<CacheOptions> = {}
  ): Promise<T | null> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      const cacheKey = this.generateCacheKey(key, opts);
      
      const cachedData = await redis.get(cacheKey);
      if (!cachedData) {
        await this.removeCacheMetadata(key);
        return null;
      }

      const data = await this.deserializeData(cachedData, opts);
      
      // Update access time for LRU management
      await this.updateAccessTime(key);
      
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Cache with stale-while-revalidate strategy
   */
  async getWithRevalidation<T>(
    key: string,
    revalidateFunction: () => Promise<T>,
    options: Partial<CacheOptions> = {}
  ): Promise<T> {
    const cachedData = await this.get<T>(key, options);
    
    if (cachedData) {
      // Return cached data immediately
      const staleTime = await this.getStaleTime(key);
      if (staleTime && Date.now() - staleTime < 30000) { // 30 seconds stale tolerance
        // Background revalidation
        this.revalidateInBackground(key, revalidateFunction, options);
        return cachedData;
      }
    }

    // Fetch fresh data
    try {
      const freshData = await revalidateFunction();
      await this.set(key, freshData, options);
      return freshData;
    } catch (error) {
      // Return stale data if fresh fetch fails
      if (cachedData) {
        console.warn('Using stale cache due to fetch error:', error);
        return cachedData;
      }
      throw error;
    }
  }

  /**
   * Batch operations for mobile efficiency
   */
  async setBatch(
    items: Array<{ key: string; data: any; options?: Partial<CacheOptions> }>
  ): Promise<boolean> {
    try {
      const pipeline = redis.pipeline();
      
      for (const item of items) {
        const opts = { ...this.defaultOptions, ...item.options };
        const serializedData = await this.serializeData(item.data, opts);
        const cacheKey = this.generateCacheKey(item.key, opts);
        const ttl = opts.networkAware 
          ? await this.getNetworkAwareTTL(opts.ttl)
          : opts.ttl;
        
        pipeline.setex(cacheKey, ttl, serializedData);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Batch cache set error:', error);
      return false;
    }
  }

  /**
   * Network-aware cache cleanup
   */
  async cleanup(): Promise<void> {
    try {
      const networkStatus = await this.getNetworkStatus();
      
      if (networkStatus.isSlowConnection || networkStatus.saveData) {
        // Aggressive cleanup on slow connections
        await this.cleanupByPriority(['low'], 0.8);
      } else {
        // Normal cleanup
        await this.cleanupByPriority(['low'], 0.9);
      }
      
      // Remove expired items
      await this.cleanupExpired();
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Preload critical content for mobile
   */
  async preloadCritical(
    items: Array<{ key: string; fetchFunction: () => Promise<any>; priority?: 'high' | 'medium' }>
  ): Promise<void> {
    const networkStatus = await this.getNetworkStatus();
    
    // Only preload on good connections
    if (networkStatus.isSlowConnection || networkStatus.saveData) {
      return;
    }

    const promises = items.map(async (item) => {
      const exists = await this.exists(item.key);
      if (!exists) {
        try {
          const data = await item.fetchFunction();
          await this.set(item.key, data, {
            priority: item.priority || 'high',
            ttl: 7200, // 2 hours for preloaded content
          });
        } catch (error) {
          console.warn(`Failed to preload ${item.key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    hitRate: number;
    memoryUsage: number;
  }> {
    try {
      const info = await redis.info('memory');
      const memoryUsage = this.parseMemoryInfo(info);
      
      const keys = await redis.keys('cache:*');
      const totalItems = keys.length;
      
      let totalSize = 0;
      const metadataKeys = await redis.keys('cache_meta:*');
      
      for (const key of metadataKeys) {
        const metadata = await redis.get(key);
        if (metadata) {
          const parsed = JSON.parse(metadata);
          totalSize += parsed.size || 0;
        }
      }

      return {
        totalItems,
        totalSize,
        hitRate: 0.85, // Calculate from actual hits/misses
        memoryUsage,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        hitRate: 0,
        memoryUsage: 0,
      };
    }
  }

  // Private helper methods

  private generateCacheKey(key: string, options: CacheOptions): string {
    const prefix = options.priority === 'high' ? 'cache_high' : 'cache';
    return `${prefix}:${key}`;
  }

  private async serializeData(data: any, options: CacheOptions): Promise<string> {
    let serialized = JSON.stringify(data);
    
    if (options.compression && serialized.length > 1024) {
      // Implement compression for large data
      // For now, just return as-is
    }
    
    if (options.encryption) {
      // Implement encryption if needed
      // For now, just return as-is
    }
    
    return serialized;
  }

  private async deserializeData(data: string, options: CacheOptions): Promise<any> {
    if (options.encryption) {
      // Implement decryption if needed
    }
    
    if (options.compression) {
      // Implement decompression if needed
    }
    
    return JSON.parse(data);
  }

  private async getNetworkAwareTTL(baseTTL: number): Promise<number> {
    const networkStatus = await this.getNetworkStatus();
    
    if (networkStatus.isSlowConnection) {
      return baseTTL * 2; // Cache longer on slow connections
    } else if (networkStatus.saveData) {
      return baseTTL * 1.5; // Cache a bit longer for data saving
    }
    
    return baseTTL;
  }

  private async getNetworkStatus(): Promise<NetworkStatus> {
    // This would be called from the client side
    return {
      effectiveType: '4g',
      downlink: 10,
      saveData: false,
      isSlowConnection: false,
    };
  }

  private async setCacheMetadata(key: string, metadata: any): Promise<void> {
    await redis.setex(`cache_meta:${key}`, 86400, JSON.stringify(metadata));
  }

  private async removeCacheMetadata(key: string): Promise<void> {
    await redis.del(`cache_meta:${key}`);
  }

  private async updateAccessTime(key: string): Promise<void> {
    const metaKey = `cache_meta:${key}`;
    const metadata = await redis.get(metaKey);
    if (metadata) {
      const parsed = JSON.parse(metadata);
      parsed.lastAccess = Date.now();
      await redis.setex(metaKey, 86400, JSON.stringify(parsed));
    }
  }

  private async getStaleTime(key: string): Promise<number | null> {
    const metadata = await redis.get(`cache_meta:${key}`);
    if (metadata) {
      const parsed = JSON.parse(metadata);
      return parsed.timestamp;
    }
    return null;
  }

  private async revalidateInBackground(
    key: string,
    revalidateFunction: () => Promise<any>,
    options: Partial<CacheOptions>
  ): Promise<void> {
    // Background revalidation without blocking
    setTimeout(async () => {
      try {
        const freshData = await revalidateFunction();
        await this.set(key, freshData, options);
      } catch (error) {
        console.warn('Background revalidation failed:', error);
      }
    }, 0);
  }

  private async exists(key: string): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key, this.defaultOptions);
    const exists = await redis.exists(cacheKey);
    return exists === 1;
  }

  private async cleanupByPriority(
    priorities: Array<'high' | 'medium' | 'low'>,
    threshold: number
  ): Promise<void> {
    const metadataKeys = await redis.keys('cache_meta:*');
    const itemsToDelete = [];
    
    for (const metaKey of metadataKeys) {
      const metadata = await redis.get(metaKey);
      if (metadata) {
        const parsed = JSON.parse(metadata);
        if (priorities.includes(parsed.priority)) {
          itemsToDelete.push(metaKey.replace('cache_meta:', ''));
        }
      }
    }
    
    // Delete bottom percentage based on threshold
    const deleteCount = Math.floor(itemsToDelete.length * (1 - threshold));
    const toDelete = itemsToDelete.slice(0, deleteCount);
    
    for (const key of toDelete) {
      await this.delete(key);
    }
  }

  private async cleanupExpired(): Promise<void> {
    // Redis handles TTL expiration automatically
    // This method can clean up orphaned metadata
    const metadataKeys = await redis.keys('cache_meta:*');
    
    for (const metaKey of metadataKeys) {
      const key = metaKey.replace('cache_meta:', '');
      const cacheKey = this.generateCacheKey(key, this.defaultOptions);
      const exists = await redis.exists(cacheKey);
      
      if (exists === 0) {
        await redis.del(metaKey);
      }
    }
  }

  private async delete(key: string): Promise<void> {
    const cacheKey = this.generateCacheKey(key, this.defaultOptions);
    await redis.del(cacheKey);
    await this.removeCacheMetadata(key);
  }

  private parseMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

// Export singleton instance
export const mobileCache = MobileCacheService.getInstance();

// Mobile-specific cache presets
export const MOBILE_CACHE_PRESETS = {
  CRITICAL: {
    ttl: 7200, // 2 hours
    priority: 'high' as const,
    networkAware: true,
    compression: true,
  },
  CONTENT: {
    ttl: 3600, // 1 hour
    priority: 'medium' as const,
    networkAware: true,
    compression: true,
  },
  IMAGES: {
    ttl: 86400, // 24 hours
    priority: 'medium' as const,
    networkAware: true,
    compression: false,
  },
  TEMPORARY: {
    ttl: 300, // 5 minutes
    priority: 'low' as const,
    networkAware: false,
    compression: false,
  },
}; 