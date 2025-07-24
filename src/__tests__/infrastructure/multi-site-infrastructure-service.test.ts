import { MultiSiteInfrastructureService, MultiSiteInfrastructureConfig } from '@/lib/services/multi-site-infrastructure';

describe('MultiSiteInfrastructureService', () => {
  let multiSiteService: MultiSiteInfrastructureService;
  let mockConfig: MultiSiteInfrastructureConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'aws',
      region: 'us-east-1',
      sites: [
        {
          id: 'site-1',
          name: 'Main Site',
          domain: 'example.com',
          region: 'us-east-1',
          environment: 'production',
          configuration: {
            enabled: true,
            vpc: {
              enabled: true,
              cidr: '10.0.0.0/16',
              subnets: [],
            },
            compute: {
              enabled: true,
              instanceTypes: ['t3.medium'],
              autoScaling: true,
              loadBalancer: true,
            },
            storage: {
              enabled: true,
              type: 's3',
              bucket: 'main-site-storage',
              backup: true,
            },
            database: {
              enabled: true,
              type: 'rds',
              instanceClass: 'db.t3.micro',
              multiAz: true,
            },
            cdn: {
              enabled: true,
              provider: 'cloudflare',
              zones: ['example.com'],
            },
          },
          resources: {
            compute: {
              instances: 3,
              cpu: 6,
              memory: 12,
            },
            storage: {
              size: 100,
              type: 'gp3',
            },
            network: {
              bandwidth: 1000,
              connections: 1000,
            },
            database: {
              instances: 1,
              storage: 20,
            },
          },
          monitoring: {
            enabled: true,
            metrics: {
              enabled: true,
              collection: ['cpu', 'memory'],
              retention: '30d',
            },
            alerting: {
              enabled: true,
              rules: [],
              channels: ['slack'],
            },
            dashboards: {
              enabled: true,
              templates: ['site-overview'],
            },
            logging: {
              enabled: true,
              retention: '30d',
              analysis: true,
            },
          },
          security: {
            enabled: true,
            waf: {
              enabled: true,
              rules: [],
              rateLimiting: true,
            },
            ssl: {
              enabled: true,
              certificates: [],
              autoRenewal: true,
            },
            access: {
              enabled: true,
              iam: true,
              network: {
                vpc: true,
                securityGroups: [],
                subnets: [],
                whitelist: [],
              },
            },
            compliance: {
              enabled: true,
              standards: ['gdpr'],
              scanning: true,
            },
          },
          performance: {
            enabled: true,
            optimization: {
              enabled: true,
              strategies: [],
              autoOptimization: true,
            },
            caching: {
              enabled: true,
              layers: [],
              invalidation: true,
            },
            cdn: {
              enabled: true,
              optimization: {
                compression: true,
                minification: true,
                imageOptimization: true,
                http2: true,
                http3: true,
              },
            },
            monitoring: {
              enabled: true,
              metrics: ['response_time'],
              thresholds: {},
            },
          },
          scaling: {
            enabled: true,
            autoScaling: {
              enabled: true,
              minInstances: 2,
              maxInstances: 10,
              targetCPU: 70,
              targetMemory: 80,
            },
            loadBalancing: {
              enabled: true,
              type: 'application',
              healthChecks: true,
              stickySessions: true,
            },
            database: {
              enabled: true,
              readReplicas: 2,
              connectionPooling: true,
            },
            storage: {
              enabled: true,
              autoScaling: true,
              lifecycle: true,
            },
          },
          cost: {
            enabled: true,
            budget: {
              enabled: true,
              amount: 500,
              period: 'monthly',
              currency: 'USD',
            },
            optimization: {
              enabled: true,
              strategies: [],
              autoOptimization: true,
            },
            monitoring: {
              enabled: true,
              alerts: [],
              reporting: true,
            },
            allocation: {
              enabled: true,
              method: 'usage',
              tags: {},
            },
          },
        },
      ],
      apiKey: 'test-api-key',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    };

    multiSiteService = new MultiSiteInfrastructureService(mockConfig);
  });

  describe('constructor', () => {
    it('should create multi-site infrastructure service with configuration', () => {
      expect(multiSiteService).toBeInstanceOf(MultiSiteInfrastructureService);
    });
  });

  describe('createSiteSpecificConfigurations', () => {
    it('should create site-specific configurations successfully', async () => {
      const result = await multiSiteService.createSiteSpecificConfigurations();
      expect(result).toBe(true);
    });

    it('should handle site-specific configurations creation errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.createSiteSpecificConfigurations();
      expect(result).toBe(false);
    });
  });

  describe('implementCrossSiteResourceSharing', () => {
    it('should implement cross-site resource sharing successfully', async () => {
      const result = await multiSiteService.implementCrossSiteResourceSharing();
      expect(result).toBe(true);
    });

    it('should handle cross-site resource sharing implementation errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.implementCrossSiteResourceSharing();
      expect(result).toBe(false);
    });
  });

  describe('setupSiteSpecificMonitoring', () => {
    it('should set up site-specific monitoring successfully', async () => {
      const result = await multiSiteService.setupSiteSpecificMonitoring();
      expect(result).toBe(true);
    });

    it('should handle site-specific monitoring setup errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.setupSiteSpecificMonitoring();
      expect(result).toBe(false);
    });
  });

  describe('createSiteSpecificBackup', () => {
    it('should create site-specific backup successfully', async () => {
      const result = await multiSiteService.createSiteSpecificBackup();
      expect(result).toBe(true);
    });

    it('should handle site-specific backup creation errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.createSiteSpecificBackup();
      expect(result).toBe(false);
    });
  });

  describe('implementSiteSpecificSecurity', () => {
    it('should implement site-specific security successfully', async () => {
      const result = await multiSiteService.implementSiteSpecificSecurity();
      expect(result).toBe(true);
    });

    it('should handle site-specific security implementation errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.implementSiteSpecificSecurity();
      expect(result).toBe(false);
    });
  });

  describe('setupSiteSpecificPerformance', () => {
    it('should set up site-specific performance successfully', async () => {
      const result = await multiSiteService.setupSiteSpecificPerformance();
      expect(result).toBe(true);
    });

    it('should handle site-specific performance setup errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.setupSiteSpecificPerformance();
      expect(result).toBe(false);
    });
  });

  describe('createSiteSpecificScaling', () => {
    it('should create site-specific scaling successfully', async () => {
      const result = await multiSiteService.createSiteSpecificScaling();
      expect(result).toBe(true);
    });

    it('should handle site-specific scaling creation errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.createSiteSpecificScaling();
      expect(result).toBe(false);
    });
  });

  describe('implementSiteSpecificCostManagement', () => {
    it('should implement site-specific cost management successfully', async () => {
      const result = await multiSiteService.implementSiteSpecificCostManagement();
      expect(result).toBe(true);
    });

    it('should handle site-specific cost management implementation errors', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      const result = await invalidService.implementSiteSpecificCostManagement();
      expect(result).toBe(false);
    });
  });

  describe('getMultiSiteMetrics', () => {
    it('should get multi-site metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      expect(metrics).toHaveProperty('sites');
      expect(metrics).toHaveProperty('resources');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('costs');
      expect(metrics).toHaveProperty('security');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(metrics.sites).toHaveProperty('total');
      expect(metrics.sites).toHaveProperty('active');
      expect(metrics.sites).toHaveProperty('inactive');
      
      expect(metrics.resources).toHaveProperty('total');
      expect(metrics.resources).toHaveProperty('shared');
      expect(metrics.resources).toHaveProperty('dedicated');
      
      expect(metrics.performance).toHaveProperty('averageResponseTime');
      expect(metrics.performance).toHaveProperty('availability');
      expect(metrics.performance).toHaveProperty('throughput');
      
      expect(metrics.costs).toHaveProperty('total');
      expect(metrics.costs).toHaveProperty('perSite');
      expect(metrics.costs).toHaveProperty('shared');
      expect(metrics.costs).toHaveProperty('optimization');
      
      expect(metrics.security).toHaveProperty('vulnerabilities');
      expect(metrics.security).toHaveProperty('incidents');
      expect(metrics.security).toHaveProperty('compliance');
      
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should include realistic multi-site data', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      expect(metrics.sites.total).toBe(3);
      expect(metrics.sites.active).toBe(3);
      expect(metrics.sites.inactive).toBe(0);
      
      expect(metrics.resources.total).toBe(25);
      expect(metrics.resources.shared).toBe(8);
      expect(metrics.resources.dedicated).toBe(17);
      
      expect(metrics.performance.averageResponseTime).toBe(850);
      expect(metrics.performance.availability).toBe(99.95);
      expect(metrics.performance.throughput).toBe(2500);
      
      expect(metrics.costs.total).toBe(1200);
      expect(metrics.costs.perSite).toBe(400);
      expect(metrics.costs.shared).toBe(300);
      expect(metrics.costs.optimization).toBe(150);
      
      expect(metrics.security.vulnerabilities).toBe(1);
      expect(metrics.security.incidents).toBe(0);
      expect(metrics.security.compliance).toBe(98);
    });

    it('should have valid multi-site metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      // Validate site metrics
      expect(metrics.sites.total).toBeGreaterThan(0);
      expect(metrics.sites.active).toBeGreaterThanOrEqual(0);
      expect(metrics.sites.inactive).toBeGreaterThanOrEqual(0);
      expect(metrics.sites.active + metrics.sites.inactive).toBe(metrics.sites.total);
      
      // Validate resource metrics
      expect(metrics.resources.total).toBeGreaterThan(0);
      expect(metrics.resources.shared).toBeGreaterThanOrEqual(0);
      expect(metrics.resources.dedicated).toBeGreaterThanOrEqual(0);
      expect(metrics.resources.shared + metrics.resources.dedicated).toBe(metrics.resources.total);
      
      // Validate performance metrics
      expect(metrics.performance.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.availability).toBeGreaterThan(0);
      expect(metrics.performance.availability).toBeLessThanOrEqual(100);
      expect(metrics.performance.throughput).toBeGreaterThan(0);
      
      // Validate cost metrics
      expect(metrics.costs.total).toBeGreaterThanOrEqual(0);
      expect(metrics.costs.perSite).toBeGreaterThanOrEqual(0);
      expect(metrics.costs.shared).toBeGreaterThanOrEqual(0);
      expect(metrics.costs.optimization).toBeGreaterThanOrEqual(0);
      
      // Validate security metrics
      expect(metrics.security.vulnerabilities).toBeGreaterThanOrEqual(0);
      expect(metrics.security.incidents).toBeGreaterThanOrEqual(0);
      expect(metrics.security.compliance).toBeGreaterThanOrEqual(0);
      expect(metrics.security.compliance).toBeLessThanOrEqual(100);
    });
  });

  describe('getMultiSiteHealth', () => {
    it('should get multi-site health', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('sites');
      expect(health).toHaveProperty('overall');
      
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(Array.isArray(health.sites)).toBe(true);
      expect(health.sites.length).toBeGreaterThan(0);
      expect(health.overall).toHaveProperty('status');
      expect(health.overall).toHaveProperty('message');
      expect(health.overall).toHaveProperty('lastCheck');
      expect(health.overall.lastCheck).toBeInstanceOf(Date);
    });

    it('should include comprehensive site health data', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.sites.length).toBe(2);
      
      const site1 = health.sites.find(s => s.siteId === 'site-1');
      expect(site1).toBeDefined();
      expect(site1?.status).toBe('healthy');
      expect(site1?.checks.length).toBe(2);
      
      const site2 = health.sites.find(s => s.siteId === 'site-2');
      expect(site2).toBeDefined();
      expect(site2?.status).toBe('healthy');
      expect(site2?.checks.length).toBe(2);
      
      expect(health.overall.status).toBe('healthy');
      expect(health.overall.message).toBe('All sites are healthy');
    });

    it('should include site health check details', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      health.sites.forEach(site => {
        expect(site).toHaveProperty('siteId');
        expect(site).toHaveProperty('status');
        expect(site).toHaveProperty('checks');
        expect(site).toHaveProperty('lastCheck');
        
        expect(['healthy', 'warning', 'critical']).toContain(site.status);
        expect(Array.isArray(site.checks)).toBe(true);
        expect(site.checks.length).toBeGreaterThan(0);
        expect(site.lastCheck).toBeInstanceOf(Date);
        
        site.checks.forEach(check => {
          expect(check).toHaveProperty('name');
          expect(check).toHaveProperty('status');
          expect(check).toHaveProperty('message');
          expect(check).toHaveProperty('duration');
          expect(check).toHaveProperty('timestamp');
          
          expect(['pass', 'fail', 'warning']).toContain(check.status);
          expect(typeof check.duration).toBe('number');
          expect(check.timestamp).toBeInstanceOf(Date);
        });
      });
    });

    it('should have valid timestamps', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      expect(health.overall.lastCheck).toBeInstanceOf(Date);
      
      health.sites.forEach(site => {
        expect(site.lastCheck).toBeInstanceOf(Date);
      });
    });
  });

  describe('integration tests', () => {
    it('should perform full multi-site infrastructure setup workflow', async () => {
      // Create site-specific configurations
      const siteConfigResult = await multiSiteService.createSiteSpecificConfigurations();
      expect(siteConfigResult).toBe(true);

      // Implement cross-site resource sharing
      const resourceSharingResult = await multiSiteService.implementCrossSiteResourceSharing();
      expect(resourceSharingResult).toBe(true);

      // Set up site-specific monitoring
      const monitoringResult = await multiSiteService.setupSiteSpecificMonitoring();
      expect(monitoringResult).toBe(true);

      // Create site-specific backup
      const backupResult = await multiSiteService.createSiteSpecificBackup();
      expect(backupResult).toBe(true);

      // Implement site-specific security
      const securityResult = await multiSiteService.implementSiteSpecificSecurity();
      expect(securityResult).toBe(true);

      // Set up site-specific performance
      const performanceResult = await multiSiteService.setupSiteSpecificPerformance();
      expect(performanceResult).toBe(true);

      // Create site-specific scaling
      const scalingResult = await multiSiteService.createSiteSpecificScaling();
      expect(scalingResult).toBe(true);

      // Implement site-specific cost management
      const costResult = await multiSiteService.implementSiteSpecificCostManagement();
      expect(costResult).toBe(true);

      // Get metrics
      const metrics = await multiSiteService.getMultiSiteMetrics();
      expect(metrics).toBeDefined();

      // Get health
      const health = await multiSiteService.getMultiSiteHealth();
      expect(health).toBeDefined();
    });

    it('should handle multi-site infrastructure with different providers', async () => {
      const providers: Array<'aws' | 'azure' | 'gcp' | 'multi-cloud'> = ['aws', 'azure', 'gcp', 'multi-cloud'];
      
      for (const provider of providers) {
        const testConfig: MultiSiteInfrastructureConfig = {
          provider,
          region: 'us-east-1',
          sites: [],
        };

        const testService = new MultiSiteInfrastructureService(testConfig);
        
        // Test basic setup
        const setupResult = await testService.createSiteSpecificConfigurations();
        expect(setupResult).toBe(true);
        
        // Test metrics retrieval
        const metrics = await testService.getMultiSiteMetrics();
        expect(metrics).toBeDefined();
        
        // Test health check
        const health = await testService.getMultiSiteHealth();
        expect(health).toBeDefined();
      }
    });

    it('should handle multi-site infrastructure with different site configurations', async () => {
      const siteConfigs = [
        {
          id: 'site-1',
          name: 'Production Site',
          environment: 'production' as const,
        },
        {
          id: 'site-2',
          name: 'Staging Site',
          environment: 'staging' as const,
        },
        {
          id: 'site-3',
          name: 'Development Site',
          environment: 'dev' as const,
        },
      ];
      
      for (const siteConfig of siteConfigs) {
        const testConfig: MultiSiteInfrastructureConfig = {
          provider: 'aws',
          region: 'us-east-1',
          sites: [{
            ...siteConfig,
            domain: `${siteConfig.id}.example.com`,
            region: 'us-east-1',
            configuration: {
              enabled: true,
              vpc: { enabled: true, cidr: '10.0.0.0/16', subnets: [] },
              compute: { enabled: true, instanceTypes: ['t3.micro'], autoScaling: true, loadBalancer: true },
              storage: { enabled: true, type: 's3', bucket: 'test-bucket', backup: true },
              database: { enabled: true, type: 'rds', instanceClass: 'db.t3.micro', multiAz: false },
              cdn: { enabled: true, provider: 'cloudflare', zones: [] },
            },
            resources: {
              compute: { instances: 1, cpu: 2, memory: 4 },
              storage: { size: 20, type: 'gp3' },
              network: { bandwidth: 100, connections: 100 },
              database: { instances: 1, storage: 10 },
            },
            monitoring: {
              enabled: true,
              metrics: { enabled: true, collection: [], retention: '7d' },
              alerting: { enabled: true, rules: [], channels: [] },
              dashboards: { enabled: true, templates: [] },
              logging: { enabled: true, retention: '7d', analysis: false },
            },
            security: {
              enabled: true,
              waf: { enabled: true, rules: [], rateLimiting: true },
              ssl: { enabled: true, certificates: [], autoRenewal: true },
              access: { enabled: true, iam: true, network: { vpc: true, securityGroups: [], subnets: [], whitelist: [] } },
              compliance: { enabled: true, standards: [], scanning: true },
            },
            performance: {
              enabled: true,
              optimization: { enabled: true, strategies: [], autoOptimization: true },
              caching: { enabled: true, layers: [], invalidation: true },
              cdn: { enabled: true, optimization: { compression: true, minification: true, imageOptimization: true, http2: true, http3: true } },
              monitoring: { enabled: true, metrics: [], thresholds: {} },
            },
            scaling: {
              enabled: true,
              autoScaling: { enabled: true, minInstances: 1, maxInstances: 3, targetCPU: 70, targetMemory: 80 },
              loadBalancing: { enabled: true, type: 'application', healthChecks: true, stickySessions: true },
              database: { enabled: true, readReplicas: 0, connectionPooling: true },
              storage: { enabled: true, autoScaling: true, lifecycle: true },
            },
            cost: {
              enabled: true,
              budget: { enabled: true, amount: 100, period: 'monthly', currency: 'USD' },
              optimization: { enabled: true, strategies: [], autoOptimization: true },
              monitoring: { enabled: true, alerts: [], reporting: true },
              allocation: { enabled: true, method: 'usage', tags: {} },
            },
          }],
        };

        const testService = new MultiSiteInfrastructureService(testConfig);
        
        // Test basic setup
        const setupResult = await testService.createSiteSpecificConfigurations();
        expect(setupResult).toBe(true);
        
        // Test metrics retrieval
        const metrics = await testService.getMultiSiteMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const invalidConfig: MultiSiteInfrastructureConfig = {
        provider: 'invalid' as any,
        region: 'invalid-region',
        sites: [],
      };

      const invalidService = new MultiSiteInfrastructureService(invalidConfig);
      
      const siteConfigResult = await invalidService.createSiteSpecificConfigurations();
      expect(siteConfigResult).toBe(false);
      
      const resourceSharingResult = await invalidService.implementCrossSiteResourceSharing();
      expect(resourceSharingResult).toBe(false);
      
      const monitoringResult = await invalidService.setupSiteSpecificMonitoring();
      expect(monitoringResult).toBe(false);
    });

    it('should handle service errors gracefully', async () => {
      // Test with minimal configuration
      const minimalConfig: MultiSiteInfrastructureConfig = {
        provider: 'aws',
        region: 'us-east-1',
        sites: [],
      };

      const minimalService = new MultiSiteInfrastructureService(minimalConfig);
      
      // These should still work with minimal config
      const metrics = await minimalService.getMultiSiteMetrics();
      expect(metrics).toBeDefined();
      
      const health = await minimalService.getMultiSiteHealth();
      expect(health).toBeDefined();
    });
  });

  describe('performance tests', () => {
    it('should handle concurrent multi-site infrastructure operations', async () => {
      const operations = [
        multiSiteService.getMultiSiteMetrics(),
        multiSiteService.getMultiSiteHealth(),
        multiSiteService.createSiteSpecificConfigurations(),
        multiSiteService.setupSiteSpecificMonitoring(),
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
        { provider: 'aws' as const, sites: 1 },
        { provider: 'azure' as const, sites: 2 },
        { provider: 'gcp' as const, sites: 3 },
      ];

      for (const config of configs) {
        const testConfig: MultiSiteInfrastructureConfig = {
          ...config,
          region: 'us-east-1',
          sites: [],
        };

        const testService = new MultiSiteInfrastructureService(testConfig);
        const metrics = await testService.getMultiSiteMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('metrics validation', () => {
    it('should return valid site metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      // Validate site metrics
      expect(metrics.sites.total).toBeGreaterThan(0);
      expect(metrics.sites.active).toBeGreaterThanOrEqual(0);
      expect(metrics.sites.inactive).toBeGreaterThanOrEqual(0);
      expect(metrics.sites.active + metrics.sites.inactive).toBe(metrics.sites.total);
    });

    it('should return valid resource metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      // Validate resource metrics
      expect(metrics.resources.total).toBeGreaterThan(0);
      expect(metrics.resources.shared).toBeGreaterThanOrEqual(0);
      expect(metrics.resources.dedicated).toBeGreaterThanOrEqual(0);
      expect(metrics.resources.shared + metrics.resources.dedicated).toBe(metrics.resources.total);
    });

    it('should return valid performance metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      // Validate performance metrics
      expect(metrics.performance.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.performance.availability).toBeGreaterThan(0);
      expect(metrics.performance.availability).toBeLessThanOrEqual(100);
      expect(metrics.performance.throughput).toBeGreaterThan(0);
    });

    it('should return valid cost metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      // Validate cost metrics
      expect(metrics.costs.total).toBeGreaterThanOrEqual(0);
      expect(metrics.costs.perSite).toBeGreaterThanOrEqual(0);
      expect(metrics.costs.shared).toBeGreaterThanOrEqual(0);
      expect(metrics.costs.optimization).toBeGreaterThanOrEqual(0);
    });

    it('should return valid security metrics', async () => {
      const metrics = await multiSiteService.getMultiSiteMetrics();
      
      // Validate security metrics
      expect(metrics.security.vulnerabilities).toBeGreaterThanOrEqual(0);
      expect(metrics.security.incidents).toBeGreaterThanOrEqual(0);
      expect(metrics.security.compliance).toBeGreaterThanOrEqual(0);
      expect(metrics.security.compliance).toBeLessThanOrEqual(100);
    });
  });

  describe('health check validation', () => {
    it('should return valid health check status', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      // Validate health status
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(['healthy', 'warning', 'critical']).toContain(health.overall.status);
      
      // Validate site health
      expect(health.sites.length).toBeGreaterThan(0);
      health.sites.forEach(site => {
        expect(['healthy', 'warning', 'critical']).toContain(site.status);
        expect(site.checks.length).toBeGreaterThan(0);
        site.checks.forEach(check => {
          expect(['pass', 'fail', 'warning']).toContain(check.status);
          expect(check.duration).toBeGreaterThan(0);
          expect(check.timestamp).toBeInstanceOf(Date);
        });
      });
    });

    it('should include all required health checks', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      health.sites.forEach(site => {
        const checkNames = site.checks.map(c => c.name);
        expect(checkNames.some(name => name.includes('Availability'))).toBe(true);
        expect(checkNames.some(name => name.includes('Performance'))).toBe(true);
      });
    });

    it('should have valid timestamps', async () => {
      const health = await multiSiteService.getMultiSiteHealth();
      
      expect(health.overall.lastCheck).toBeInstanceOf(Date);
      
      health.sites.forEach(site => {
        expect(site.lastCheck).toBeInstanceOf(Date);
        site.checks.forEach(check => {
          expect(check.timestamp).toBeInstanceOf(Date);
        });
      });
    });
  });
}); 