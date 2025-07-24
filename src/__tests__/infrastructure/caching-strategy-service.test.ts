import { CachingStrategyService, CachingStrategyConfig } from '@/lib/services/caching-strategy';

describe('CachingStrategyService', () => {
  let cachingService: CachingStrategyService;
  let mockConfig: CachingStrategyConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'redis',
      region: 'us-east-1',
      endpoint: 'localhost',
      port: 6379,
      apiKey: 'test-api-key',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    };

    cachingService = new CachingStrategyService(mockConfig);
  });

  describe('constructor', () => {
    it('should create caching strategy service with configuration', () => {
      expect(cachingService).toBeInstanceOf(CachingStrategyService);
    });
  });

  describe('setupRedisCaching', () => {
    it('should set up Redis caching successfully', async () => {
      const result = await cachingService.setupRedisCaching();
      expect(result).toBe(true);
    });

    it('should handle Redis caching setup errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.setupRedisCaching();
      expect(result).toBe(false);
    });
  });

  describe('implementApplicationCaching', () => {
    it('should implement application caching successfully', async () => {
      const result = await cachingService.implementApplicationCaching();
      expect(result).toBe(true);
    });

    it('should handle application caching implementation errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.implementApplicationCaching();
      expect(result).toBe(false);
    });
  });

  describe('configureCDNCaching', () => {
    it('should configure CDN caching successfully', async () => {
      const result = await cachingService.configureCDNCaching();
      expect(result).toBe(true);
    });

    it('should handle CDN caching configuration errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.configureCDNCaching();
      expect(result).toBe(false);
    });
  });

  describe('createCacheInvalidationStrategies', () => {
    it('should create cache invalidation strategies successfully', async () => {
      const result = await cachingService.createCacheInvalidationStrategies();
      expect(result).toBe(true);
    });

    it('should handle cache invalidation strategies creation errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.createCacheInvalidationStrategies();
      expect(result).toBe(false);
    });
  });

  describe('implementCacheMonitoring', () => {
    it('should implement cache monitoring successfully', async () => {
      const result = await cachingService.implementCacheMonitoring();
      expect(result).toBe(true);
    });

    it('should handle cache monitoring implementation errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.implementCacheMonitoring();
      expect(result).toBe(false);
    });
  });

  describe('setupCachePerformanceOptimization', () => {
    it('should set up cache performance optimization successfully', async () => {
      const result = await cachingService.setupCachePerformanceOptimization();
      expect(result).toBe(true);
    });

    it('should handle cache performance optimization setup errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.setupCachePerformanceOptimization();
      expect(result).toBe(false);
    });
  });

  describe('createCacheSecurity', () => {
    it('should create cache security successfully', async () => {
      const result = await cachingService.createCacheSecurity();
      expect(result).toBe(true);
    });

    it('should handle cache security creation errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.createCacheSecurity();
      expect(result).toBe(false);
    });
  });

  describe('implementCacheFailover', () => {
    it('should implement cache failover successfully', async () => {
      const result = await cachingService.implementCacheFailover();
      expect(result).toBe(true);
    });

    it('should handle cache failover implementation errors', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        endpoint: 'invalid-endpoint',
        port: 6379,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      const result = await invalidService.implementCacheFailover();
      expect(result).toBe(false);
    });
  });

  describe('getCacheMetrics', () => {
    it('should get cache metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('usage');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('availability');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(metrics.performance).toHaveProperty('hitRate');
      expect(metrics.performance).toHaveProperty('missRate');
      expect(metrics.performance).toHaveProperty('averageLatency');
      expect(metrics.performance).toHaveProperty('throughput');
      expect(metrics.performance).toHaveProperty('evictions');
      
      expect(metrics.usage).toHaveProperty('memoryUsage');
      expect(metrics.usage).toHaveProperty('keyCount');
      expect(metrics.usage).toHaveProperty('connectionCount');
      expect(metrics.usage).toHaveProperty('activeConnections');
      
      expect(metrics.errors).toHaveProperty('connectionErrors');
      expect(metrics.errors).toHaveProperty('timeoutErrors');
      expect(metrics.errors).toHaveProperty('memoryErrors');
      expect(metrics.errors).toHaveProperty('totalErrors');
      
      expect(metrics.availability).toHaveProperty('uptime');
      expect(metrics.availability).toHaveProperty('downtime');
      expect(metrics.availability).toHaveProperty('sla');
      
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should include realistic performance data', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      expect(metrics.performance.hitRate).toBe(0.85);
      expect(metrics.performance.missRate).toBe(0.15);
      expect(metrics.performance.averageLatency).toBe(2.5);
      expect(metrics.performance.throughput).toBe(5000);
      expect(metrics.performance.evictions).toBe(150);
      
      expect(metrics.usage.memoryUsage).toBe(65);
      expect(metrics.usage.keyCount).toBe(50000);
      expect(metrics.usage.connectionCount).toBe(100);
      expect(metrics.usage.activeConnections).toBe(75);
      
      expect(metrics.errors.connectionErrors).toBe(5);
      expect(metrics.errors.timeoutErrors).toBe(2);
      expect(metrics.errors.memoryErrors).toBe(0);
      expect(metrics.errors.totalErrors).toBe(7);
      
      expect(metrics.availability.uptime).toBe(99.95);
      expect(metrics.availability.downtime).toBe(0.05);
      expect(metrics.availability.sla).toBe(99.9);
    });

    it('should have valid performance metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate performance metrics
      expect(metrics.performance.hitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.performance.hitRate).toBeLessThanOrEqual(1);
      expect(metrics.performance.missRate).toBeGreaterThanOrEqual(0);
      expect(metrics.performance.missRate).toBeLessThanOrEqual(1);
      expect(metrics.performance.averageLatency).toBeGreaterThan(0);
      expect(metrics.performance.throughput).toBeGreaterThan(0);
      expect(metrics.performance.evictions).toBeGreaterThanOrEqual(0);
    });

    it('should have valid usage metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate usage metrics
      expect(metrics.usage.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.usage.memoryUsage).toBeLessThanOrEqual(100);
      expect(metrics.usage.keyCount).toBeGreaterThan(0);
      expect(metrics.usage.connectionCount).toBeGreaterThan(0);
      expect(metrics.usage.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.usage.activeConnections).toBeLessThanOrEqual(metrics.usage.connectionCount);
    });

    it('should have valid error metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate error metrics
      expect(metrics.errors.connectionErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.timeoutErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.memoryErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.totalErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.totalErrors).toBe(
        metrics.errors.connectionErrors + metrics.errors.timeoutErrors + metrics.errors.memoryErrors
      );
    });
  });

  describe('getCacheHealth', () => {
    it('should get cache health', async () => {
      const health = await cachingService.getCacheHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(health).toHaveProperty('lastCheck');
      expect(health).toHaveProperty('nextCheck');
      
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(Array.isArray(health.checks)).toBe(true);
      expect(health.checks.length).toBeGreaterThan(0);
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.nextCheck).toBeInstanceOf(Date);
    });

    it('should include comprehensive health checks', async () => {
      const health = await cachingService.getCacheHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.checks.length).toBe(4);
      
      const connectionCheck = health.checks.find(c => c.name === 'Cache Connection');
      expect(connectionCheck).toBeDefined();
      expect(connectionCheck?.status).toBe('pass');
      expect(connectionCheck?.message).toBe('Cache is accessible');
      
      const memoryCheck = health.checks.find(c => c.name === 'Memory Usage');
      expect(memoryCheck).toBeDefined();
      expect(memoryCheck?.status).toBe('pass');
      expect(memoryCheck?.message).toBe('Memory usage is within normal range');
      
      const performanceCheck = health.checks.find(c => c.name === 'Performance Check');
      expect(performanceCheck).toBeDefined();
      expect(performanceCheck?.status).toBe('pass');
      expect(performanceCheck?.message).toBe('Cache performance is optimal');
      
      const replicationCheck = health.checks.find(c => c.name === 'Replication Status');
      expect(replicationCheck).toBeDefined();
      expect(replicationCheck?.status).toBe('pass');
      expect(replicationCheck?.message).toBe('Cache replication is healthy');
    });

    it('should include health check details', async () => {
      const health = await cachingService.getCacheHealth();
      
      health.checks.forEach(check => {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(check).toHaveProperty('duration');
        expect(check).toHaveProperty('timestamp');
        
        expect(typeof check.name).toBe('string');
        expect(['pass', 'fail', 'warning']).toContain(check.status);
        expect(typeof check.message).toBe('string');
        expect(typeof check.duration).toBe('number');
        expect(check.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should have valid timestamps', async () => {
      const health = await cachingService.getCacheHealth();
      
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.nextCheck).toBeInstanceOf(Date);
      expect(health.nextCheck.getTime()).toBeGreaterThan(health.lastCheck.getTime());
    });
  });

  describe('integration tests', () => {
    it('should perform full caching strategy setup workflow', async () => {
      // Set up Redis caching
      const redisResult = await cachingService.setupRedisCaching();
      expect(redisResult).toBe(true);

      // Implement application caching
      const appCachingResult = await cachingService.implementApplicationCaching();
      expect(appCachingResult).toBe(true);

      // Configure CDN caching
      const cdnResult = await cachingService.configureCDNCaching();
      expect(cdnResult).toBe(true);

      // Create cache invalidation strategies
      const invalidationResult = await cachingService.createCacheInvalidationStrategies();
      expect(invalidationResult).toBe(true);

      // Implement cache monitoring
      const monitoringResult = await cachingService.implementCacheMonitoring();
      expect(monitoringResult).toBe(true);

      // Set up cache performance optimization
      const performanceResult = await cachingService.setupCachePerformanceOptimization();
      expect(performanceResult).toBe(true);

      // Create cache security
      const securityResult = await cachingService.createCacheSecurity();
      expect(securityResult).toBe(true);

      // Implement cache failover
      const failoverResult = await cachingService.implementCacheFailover();
      expect(failoverResult).toBe(true);

      // Get metrics
      const metrics = await cachingService.getCacheMetrics();
      expect(metrics).toBeDefined();

      // Get health
      const health = await cachingService.getCacheHealth();
      expect(health).toBeDefined();
    });

    it('should handle caching strategy with different providers', async () => {
      const providers: Array<'redis' | 'memcached' | 'elasticache' | 'custom'> = ['redis', 'memcached', 'elasticache', 'custom'];
      
      for (const provider of providers) {
        const testConfig: CachingStrategyConfig = {
          provider,
          region: 'us-east-1',
          endpoint: 'localhost',
          port: 6379,
        };

        const testService = new CachingStrategyService(testConfig);
        
        // Test basic setup
        const setupResult = await testService.setupRedisCaching();
        expect(setupResult).toBe(true);
        
        // Test metrics retrieval
        const metrics = await testService.getCacheMetrics();
        expect(metrics).toBeDefined();
        
        // Test health check
        const health = await testService.getCacheHealth();
        expect(health).toBeDefined();
      }
    });

    it('should handle caching strategy with different configurations', async () => {
      const configs = [
        { endpoint: 'redis-1:6379', port: 6379 },
        { endpoint: 'redis-2:6380', port: 6380 },
        { endpoint: 'redis-cluster:6379', port: 6379 },
      ];

      for (const config of configs) {
        const testConfig: CachingStrategyConfig = {
          provider: 'redis',
          region: 'us-east-1',
          endpoint: config.endpoint,
          port: config.port,
        };

        const testService = new CachingStrategyService(testConfig);
        
        // Test basic setup
        const setupResult = await testService.setupRedisCaching();
        expect(setupResult).toBe(true);
        
        // Test metrics retrieval
        const metrics = await testService.getCacheMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const invalidConfig: CachingStrategyConfig = {
        provider: 'invalid' as any,
        region: 'invalid-region',
        endpoint: 'invalid-endpoint',
        port: -1,
      };

      const invalidService = new CachingStrategyService(invalidConfig);
      
      const redisResult = await invalidService.setupRedisCaching();
      expect(redisResult).toBe(false);
      
      const appCachingResult = await invalidService.implementApplicationCaching();
      expect(appCachingResult).toBe(false);
      
      const cdnResult = await invalidService.configureCDNCaching();
      expect(cdnResult).toBe(false);
    });

    it('should handle service errors gracefully', async () => {
      // Test with minimal configuration
      const minimalConfig: CachingStrategyConfig = {
        provider: 'redis',
        region: 'us-east-1',
        endpoint: 'localhost',
        port: 6379,
      };

      const minimalService = new CachingStrategyService(minimalConfig);
      
      // These should still work with minimal config
      const metrics = await minimalService.getCacheMetrics();
      expect(metrics).toBeDefined();
      
      const health = await minimalService.getCacheHealth();
      expect(health).toBeDefined();
    });
  });

  describe('performance tests', () => {
    it('should handle concurrent caching strategy operations', async () => {
      const operations = [
        cachingService.getCacheMetrics(),
        cachingService.getCacheHealth(),
        cachingService.setupRedisCaching(),
        cachingService.implementCacheMonitoring(),
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBe(true);
      expect(results[3]).toBe(true);
    });

    it('should handle rapid configuration changes', async () => {
      const configs = [
        { provider: 'redis' as const, endpoint: 'redis-1:6379' },
        { provider: 'memcached' as const, endpoint: 'memcached-1:11211' },
        { provider: 'elasticache' as const, endpoint: 'elasticache-1:6379' },
      ];

      for (const config of configs) {
        const testConfig: CachingStrategyConfig = {
          ...config,
          region: 'us-east-1',
          port: 6379,
        };

        const testService = new CachingStrategyService(testConfig);
        const metrics = await testService.getCacheMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('metrics validation', () => {
    it('should return valid performance metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate performance metrics
      expect(metrics.performance.hitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.performance.hitRate).toBeLessThanOrEqual(1);
      expect(metrics.performance.missRate).toBeGreaterThanOrEqual(0);
      expect(metrics.performance.missRate).toBeLessThanOrEqual(1);
      expect(metrics.performance.averageLatency).toBeGreaterThan(0);
      expect(metrics.performance.throughput).toBeGreaterThan(0);
      expect(metrics.performance.evictions).toBeGreaterThanOrEqual(0);
      
      // Hit rate and miss rate should sum to 1
      expect(metrics.performance.hitRate + metrics.performance.missRate).toBeCloseTo(1, 2);
    });

    it('should return valid usage metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate usage metrics
      expect(metrics.usage.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.usage.memoryUsage).toBeLessThanOrEqual(100);
      expect(metrics.usage.keyCount).toBeGreaterThan(0);
      expect(metrics.usage.connectionCount).toBeGreaterThan(0);
      expect(metrics.usage.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.usage.activeConnections).toBeLessThanOrEqual(metrics.usage.connectionCount);
    });

    it('should return valid error metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate error metrics
      expect(metrics.errors.connectionErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.timeoutErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.memoryErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.totalErrors).toBeGreaterThanOrEqual(0);
      expect(metrics.errors.totalErrors).toBe(
        metrics.errors.connectionErrors + metrics.errors.timeoutErrors + metrics.errors.memoryErrors
      );
    });

    it('should return valid availability metrics', async () => {
      const metrics = await cachingService.getCacheMetrics();
      
      // Validate availability metrics
      expect(metrics.availability.uptime).toBeGreaterThan(0);
      expect(metrics.availability.uptime).toBeLessThanOrEqual(100);
      expect(metrics.availability.downtime).toBeGreaterThanOrEqual(0);
      expect(metrics.availability.downtime).toBeLessThanOrEqual(100);
      expect(metrics.availability.sla).toBeGreaterThan(0);
      expect(metrics.availability.sla).toBeLessThanOrEqual(100);
    });
  });

  describe('health check validation', () => {
    it('should return valid health check status', async () => {
      const health = await cachingService.getCacheHealth();
      
      // Validate health status
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      
      // Validate health checks
      expect(health.checks.length).toBeGreaterThan(0);
      health.checks.forEach(check => {
        expect(['pass', 'fail', 'warning']).toContain(check.status);
        expect(check.duration).toBeGreaterThan(0);
        expect(check.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should include all required health checks', async () => {
      const health = await cachingService.getCacheHealth();
      
      const checkNames = health.checks.map(c => c.name);
      expect(checkNames).toContain('Cache Connection');
      expect(checkNames).toContain('Memory Usage');
      expect(checkNames).toContain('Performance Check');
      expect(checkNames).toContain('Replication Status');
    });

    it('should have valid timestamps', async () => {
      const health = await cachingService.getCacheHealth();
      
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.nextCheck).toBeInstanceOf(Date);
      expect(health.nextCheck.getTime()).toBeGreaterThan(health.lastCheck.getTime());
    });
  });
}); 