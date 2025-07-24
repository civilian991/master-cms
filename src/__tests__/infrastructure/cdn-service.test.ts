import { CDNService, CDNConfiguration } from '@/lib/services/cdn';

// Mock fetch
global.fetch = jest.fn();

describe('CDNService', () => {
  let cdnService: CDNService;
  let mockConfig: CDNConfiguration;

  beforeEach(() => {
    mockConfig = {
      provider: 'cloudflare',
      zoneId: 'test-zone-id',
      apiToken: 'test-api-token',
    };

    cdnService = new CDNService(mockConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create CDN service with configuration', () => {
      expect(cdnService).toBeInstanceOf(CDNService);
    });
  });

  describe('configureCDN', () => {
    it('should configure CloudFlare CDN successfully', async () => {
      const result = await cdnService.configureCDN();
      expect(result).toBe(true);
    });

    it('should configure AWS CloudFront CDN successfully', async () => {
      const awsConfig: CDNConfiguration = {
        provider: 'aws-cloudfront',
        distributionId: 'test-distribution-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1',
      };

      const awsCdnService = new CDNService(awsConfig);
      const result = await awsCdnService.configureCDN();
      expect(result).toBe(true);
    });

    it('should handle unsupported provider', async () => {
      const unsupportedConfig: CDNConfiguration = {
        provider: 'unsupported' as any,
      };

      const unsupportedService = new CDNService(unsupportedConfig);
      const result = await unsupportedService.configureCDN();
      expect(result).toBe(false);
    });
  });

  describe('createCacheRules', () => {
    it('should create default cache rules', async () => {
      const rules = await cdnService.createCacheRules();
      
      expect(rules).toHaveLength(3);
      expect(rules[0].id).toBe('static-assets');
      expect(rules[1].id).toBe('api-cache');
      expect(rules[2].id).toBe('html-cache');
      
      expect(rules[0].cacheLevel).toBe('cache_everything');
      expect(rules[1].cacheLevel).toBe('override');
      expect(rules[2].cacheLevel).toBe('cache_everything');
    });
  });

  describe('configureSecurity', () => {
    it('should configure security features', async () => {
      const securityConfig = await cdnService.configureSecurity();
      
      expect(securityConfig.wafEnabled).toBe(true);
      expect(securityConfig.ddosProtection).toBe(true);
      expect(securityConfig.sslMode).toBe('full');
      expect(securityConfig.rateLimiting.enabled).toBe(true);
      expect(securityConfig.rateLimiting.requestsPerMinute).toBe(1000);
    });
  });

  describe('getAnalytics', () => {
    it('should get CloudFlare analytics', async () => {
      const analytics = await cdnService.getAnalytics('24h');
      
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBeGreaterThan(0);
      
      const firstAnalytic = analytics[0];
      expect(firstAnalytic).toHaveProperty('bandwidth');
      expect(firstAnalytic).toHaveProperty('requests');
      expect(firstAnalytic).toHaveProperty('cacheHitRate');
      expect(firstAnalytic).toHaveProperty('responseTime');
      expect(firstAnalytic).toHaveProperty('errors');
      expect(firstAnalytic).toHaveProperty('timestamp');
    });

    it('should get CloudFront analytics', async () => {
      const awsConfig: CDNConfiguration = {
        provider: 'aws-cloudfront',
        distributionId: 'test-distribution-id',
      };

      const awsCdnService = new CDNService(awsConfig);
      const analytics = await awsCdnService.getAnalytics('24h');
      
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBeGreaterThan(0);
    });

    it('should handle unsupported provider for analytics', async () => {
      const unsupportedConfig: CDNConfiguration = {
        provider: 'unsupported' as any,
      };

      const unsupportedService = new CDNService(unsupportedConfig);
      const analytics = await unsupportedService.getAnalytics('24h');
      expect(analytics).toEqual([]);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate CloudFlare cache successfully', async () => {
      const paths = ['/api/users', '/static/css/main.css'];
      const result = await cdnService.invalidateCache(paths);
      expect(result).toBe(true);
    });

    it('should invalidate CloudFront cache successfully', async () => {
      const awsConfig: CDNConfiguration = {
        provider: 'aws-cloudfront',
        distributionId: 'test-distribution-id',
      };

      const awsCdnService = new CDNService(awsConfig);
      const paths = ['/api/users', '/static/css/main.css'];
      const result = await awsCdnService.invalidateCache(paths);
      expect(result).toBe(true);
    });

    it('should handle cache invalidation failure', async () => {
      const unsupportedConfig: CDNConfiguration = {
        provider: 'unsupported' as any,
      };

      const unsupportedService = new CDNService(unsupportedConfig);
      const paths = ['/api/users'];
      const result = await unsupportedService.invalidateCache(paths);
      expect(result).toBe(false);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should get performance metrics', async () => {
      const metrics = await cdnService.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('loadTime');
      expect(metrics).toHaveProperty('timeToFirstByte');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('bandwidthUsage');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('geographicPerformance');
      
      expect(typeof metrics.loadTime).toBe('number');
      expect(typeof metrics.timeToFirstByte).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(typeof metrics.bandwidthUsage).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(typeof metrics.geographicPerformance).toBe('object');
    });
  });

  describe('configureFailover', () => {
    it('should configure failover successfully', async () => {
      const result = await cdnService.configureFailover();
      expect(result).toBe(true);
    });
  });

  describe('optimizeCosts', () => {
    it('should provide cost optimization recommendations', async () => {
      const optimization = await cdnService.optimizeCosts();
      
      expect(optimization).toHaveProperty('savings');
      expect(optimization).toHaveProperty('recommendations');
      
      expect(typeof optimization.savings).toBe('number');
      expect(Array.isArray(optimization.recommendations)).toBe(true);
      expect(optimization.savings).toBeGreaterThan(0);
      expect(optimization.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('configurePerformance', () => {
    it('should configure performance optimization', async () => {
      await expect(cdnService.configurePerformance()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const invalidConfig: CDNConfiguration = {
        provider: 'cloudflare',
        zoneId: undefined,
        apiToken: undefined,
      };

      const invalidService = new CDNService(invalidConfig);
      const result = await invalidService.configureCDN();
      expect(result).toBe(false);
    });

    it('should handle analytics errors gracefully', async () => {
      const invalidConfig: CDNConfiguration = {
        provider: 'cloudflare',
        zoneId: 'invalid-zone',
        apiToken: 'invalid-token',
      };

      const invalidService = new CDNService(invalidConfig);
      const analytics = await invalidService.getAnalytics('24h');
      expect(analytics).toEqual([]);
    });
  });

  describe('integration tests', () => {
    it('should perform full CDN setup workflow', async () => {
      // Configure CDN
      const configured = await cdnService.configureCDN();
      expect(configured).toBe(true);

      // Create cache rules
      const rules = await cdnService.createCacheRules();
      expect(rules.length).toBeGreaterThan(0);

      // Configure security
      const security = await cdnService.configureSecurity();
      expect(security.wafEnabled).toBe(true);

      // Configure performance
      await expect(cdnService.configurePerformance()).resolves.not.toThrow();

      // Configure failover
      const failover = await cdnService.configureFailover();
      expect(failover).toBe(true);

      // Get metrics
      const metrics = await cdnService.getPerformanceMetrics();
      expect(metrics).toBeDefined();

      // Optimize costs
      const optimization = await cdnService.optimizeCosts();
      expect(optimization.savings).toBeGreaterThan(0);
    });

    it('should handle cache invalidation workflow', async () => {
      const paths = [
        '/api/users',
        '/api/posts',
        '/static/css/main.css',
        '/static/js/app.js',
        '/images/logo.png'
      ];

      const result = await cdnService.invalidateCache(paths);
      expect(result).toBe(true);
    });

    it('should handle analytics workflow', async () => {
      const timeRanges = ['1h', '6h', '24h', '7d'];
      
      for (const timeRange of timeRanges) {
        const analytics = await cdnService.getAnalytics(timeRange);
        expect(Array.isArray(analytics)).toBe(true);
      }
    });
  });

  describe('performance tests', () => {
    it('should handle large cache invalidation requests', async () => {
      const largePaths = Array.from({ length: 1000 }, (_, i) => `/api/resource-${i}`);
      const result = await cdnService.invalidateCache(largePaths);
      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      const operations = [
        cdnService.getAnalytics('24h'),
        cdnService.getPerformanceMetrics(),
        cdnService.optimizeCosts(),
        cdnService.configureSecurity(),
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();
      expect(results[3]).toBeDefined();
    });
  });

  describe('configuration validation', () => {
    it('should validate CloudFlare configuration', () => {
      const validConfig: CDNConfiguration = {
        provider: 'cloudflare',
        zoneId: 'valid-zone-id',
        apiToken: 'valid-api-token',
      };

      const service = new CDNService(validConfig);
      expect(service).toBeInstanceOf(CDNService);
    });

    it('should validate AWS CloudFront configuration', () => {
      const validConfig: CDNConfiguration = {
        provider: 'aws-cloudfront',
        distributionId: 'valid-distribution-id',
        accessKeyId: 'valid-access-key',
        secretAccessKey: 'valid-secret-key',
        region: 'us-east-1',
      };

      const service = new CDNService(validConfig);
      expect(service).toBeInstanceOf(CDNService);
    });
  });
}); 