import { PerformanceMonitoringService, PerformanceMonitoringConfig } from '@/lib/services/performance-monitoring';

describe('PerformanceMonitoringService', () => {
  let performanceService: PerformanceMonitoringService;
  let mockConfig: PerformanceMonitoringConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'prometheus',
      region: 'us-east-1',
      prometheusUrl: 'http://localhost:9090',
      grafanaUrl: 'http://localhost:3001',
      apiKey: 'test-api-key',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    };

    performanceService = new PerformanceMonitoringService(mockConfig);
  });

  describe('constructor', () => {
    it('should create performance monitoring service with configuration', () => {
      expect(performanceService).toBeInstanceOf(PerformanceMonitoringService);
    });
  });

  describe('setupPrometheusMonitoring', () => {
    it('should set up Prometheus monitoring successfully', async () => {
      const result = await performanceService.setupPrometheusMonitoring();
      expect(result).toBe(true);
    });

    it('should handle Prometheus setup errors', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      const result = await invalidService.setupPrometheusMonitoring();
      expect(result).toBe(false);
    });
  });

  describe('configureGrafanaDashboards', () => {
    it('should configure Grafana dashboards successfully', async () => {
      const result = await performanceService.configureGrafanaDashboards();
      expect(result).toBe(true);
    });

    it('should handle Grafana configuration errors', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      const result = await invalidService.configureGrafanaDashboards();
      expect(result).toBe(false);
    });
  });

  describe('setupAPM', () => {
    it('should set up APM successfully', async () => {
      const result = await performanceService.setupAPM();
      expect(result).toBe(true);
    });

    it('should handle APM setup errors', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      const result = await invalidService.setupAPM();
      expect(result).toBe(false);
    });
  });

  describe('createCustomMetrics', () => {
    it('should create custom metrics successfully', async () => {
      const metrics = await performanceService.createCustomMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      const metric = metrics[0];
      expect(metric).toHaveProperty('name');
      expect(metric).toHaveProperty('type');
      expect(metric).toHaveProperty('description');
      expect(metric).toHaveProperty('labels');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('timestamp');
      
      expect(typeof metric.name).toBe('string');
      expect(['counter', 'gauge', 'histogram', 'summary']).toContain(metric.type);
      expect(typeof metric.description).toBe('string');
      expect(Array.isArray(metric.labels)).toBe(true);
      expect(typeof metric.value).toBe('number');
      expect(metric.timestamp).toBeInstanceOf(Date);
    });

    it('should include business metrics', async () => {
      const metrics = await performanceService.createCustomMetrics();
      
      const businessUsersMetric = metrics.find(m => m.name === 'business_users_active');
      expect(businessUsersMetric).toBeDefined();
      expect(businessUsersMetric?.type).toBe('gauge');
      expect(businessUsersMetric?.value).toBe(1250);
      
      const contentPublishedMetric = metrics.find(m => m.name === 'content_published_total');
      expect(contentPublishedMetric).toBeDefined();
      expect(contentPublishedMetric?.type).toBe('counter');
      expect(contentPublishedMetric?.value).toBe(15420);
    });

    it('should include technical metrics', async () => {
      const metrics = await performanceService.createCustomMetrics();
      
      const apiCallsMetric = metrics.find(m => m.name === 'api_calls_duration_seconds');
      expect(apiCallsMetric).toBeDefined();
      expect(apiCallsMetric?.type).toBe('histogram');
      expect(apiCallsMetric?.value).toBe(0.15);
      
      const dbConnectionsMetric = metrics.find(m => m.name === 'database_connections_active');
      expect(dbConnectionsMetric).toBeDefined();
      expect(dbConnectionsMetric?.type).toBe('gauge');
      expect(dbConnectionsMetric?.value).toBe(45);
    });
  });

  describe('setupLogAggregation', () => {
    it('should set up log aggregation successfully', async () => {
      const result = await performanceService.setupLogAggregation();
      expect(result).toBe(true);
    });

    it('should handle log aggregation setup errors', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      const result = await invalidService.setupLogAggregation();
      expect(result).toBe(false);
    });
  });

  describe('setupRealTimeTracking', () => {
    it('should set up real-time tracking successfully', async () => {
      const result = await performanceService.setupRealTimeTracking();
      expect(result).toBe(true);
    });

    it('should handle real-time tracking setup errors', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      const result = await invalidService.setupRealTimeTracking();
      expect(result).toBe(false);
    });
  });

  describe('createPerformanceRecommendations', () => {
    it('should create performance recommendations successfully', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      const recommendation = recommendations[0];
      expect(recommendation).toHaveProperty('id');
      expect(recommendation).toHaveProperty('category');
      expect(recommendation).toHaveProperty('title');
      expect(recommendation).toHaveProperty('description');
      expect(recommendation).toHaveProperty('impact');
      expect(recommendation).toHaveProperty('effort');
      expect(recommendation).toHaveProperty('priority');
      expect(recommendation).toHaveProperty('actions');
      expect(recommendation).toHaveProperty('estimatedImprovement');
      expect(recommendation).toHaveProperty('timestamp');
      
      expect(typeof recommendation.id).toBe('string');
      expect(['performance', 'scalability', 'optimization', 'security']).toContain(recommendation.category);
      expect(typeof recommendation.title).toBe('string');
      expect(typeof recommendation.description).toBe('string');
      expect(['low', 'medium', 'high']).toContain(recommendation.impact);
      expect(['low', 'medium', 'high']).toContain(recommendation.effort);
      expect(typeof recommendation.priority).toBe('number');
      expect(Array.isArray(recommendation.actions)).toBe(true);
      expect(typeof recommendation.estimatedImprovement).toBe('string');
      expect(recommendation.timestamp).toBeInstanceOf(Date);
    });

    it('should include performance recommendations', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      const dbOptimizationRec = recommendations.find(r => r.title.includes('Database Queries'));
      expect(dbOptimizationRec).toBeDefined();
      expect(dbOptimizationRec?.category).toBe('performance');
      expect(dbOptimizationRec?.impact).toBe('high');
      expect(dbOptimizationRec?.priority).toBe(1);
      expect(dbOptimizationRec?.actions).toContain('Add database indexes for frequently queried columns');
    });

    it('should include scalability recommendations', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      const cachingRec = recommendations.find(r => r.title.includes('Caching Strategy'));
      expect(cachingRec).toBeDefined();
      expect(cachingRec?.category).toBe('scalability');
      expect(cachingRec?.impact).toBe('high');
      expect(cachingRec?.priority).toBe(2);
      expect(cachingRec?.actions).toContain('Implement Redis caching for frequently accessed data');
    });

    it('should include optimization recommendations', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      const imageOptimizationRec = recommendations.find(r => r.title.includes('Image Delivery'));
      expect(imageOptimizationRec).toBeDefined();
      expect(imageOptimizationRec?.category).toBe('optimization');
      expect(imageOptimizationRec?.impact).toBe('medium');
      expect(imageOptimizationRec?.priority).toBe(3);
      expect(imageOptimizationRec?.actions).toContain('Implement image compression and optimization');
    });

    it('should include security recommendations', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      const rateLimitRec = recommendations.find(r => r.title.includes('Rate Limiting'));
      expect(rateLimitRec).toBeDefined();
      expect(rateLimitRec?.category).toBe('security');
      expect(rateLimitRec?.impact).toBe('medium');
      expect(rateLimitRec?.priority).toBe(4);
      expect(rateLimitRec?.actions).toContain('Implement API rate limiting');
    });
  });

  describe('setupAutomatedPerformanceTesting', () => {
    it('should set up automated performance testing successfully', async () => {
      const result = await performanceService.setupAutomatedPerformanceTesting();
      expect(result).toBe(true);
    });

    it('should handle automated testing setup errors', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      const result = await invalidService.setupAutomatedPerformanceTesting();
      expect(result).toBe(false);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should get performance metrics', async () => {
      const metrics = await performanceService.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('resourceUsage');
      expect(metrics).toHaveProperty('availability');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(metrics.responseTime).toHaveProperty('p50');
      expect(metrics.responseTime).toHaveProperty('p95');
      expect(metrics.responseTime).toHaveProperty('p99');
      expect(metrics.responseTime).toHaveProperty('average');
      
      expect(metrics.throughput).toHaveProperty('requestsPerSecond');
      expect(metrics.throughput).toHaveProperty('requestsPerMinute');
      expect(metrics.throughput).toHaveProperty('requestsPerHour');
      
      expect(metrics.errorRate).toHaveProperty('percentage');
      expect(metrics.errorRate).toHaveProperty('count');
      expect(metrics.errorRate).toHaveProperty('topErrors');
      
      expect(metrics.resourceUsage).toHaveProperty('cpu');
      expect(metrics.resourceUsage).toHaveProperty('memory');
      expect(metrics.resourceUsage).toHaveProperty('disk');
      expect(metrics.resourceUsage).toHaveProperty('network');
      
      expect(metrics.availability).toHaveProperty('uptime');
      expect(metrics.availability).toHaveProperty('downtime');
      expect(metrics.availability).toHaveProperty('sla');
      
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should include realistic performance data', async () => {
      const metrics = await performanceService.getPerformanceMetrics();
      
      expect(metrics.responseTime.p50).toBe(150);
      expect(metrics.responseTime.p95).toBe(800);
      expect(metrics.responseTime.p99).toBe(1500);
      expect(metrics.responseTime.average).toBe(200);
      
      expect(metrics.throughput.requestsPerSecond).toBe(120);
      expect(metrics.throughput.requestsPerMinute).toBe(7200);
      expect(metrics.throughput.requestsPerHour).toBe(432000);
      
      expect(metrics.errorRate.percentage).toBe(0.02);
      expect(metrics.errorRate.count).toBe(144);
      expect(metrics.errorRate.topErrors.length).toBeGreaterThan(0);
      
      expect(metrics.resourceUsage.cpu).toBe(45);
      expect(metrics.resourceUsage.memory).toBe(60);
      expect(metrics.resourceUsage.disk).toBe(25);
      expect(metrics.resourceUsage.network).toBe(30);
      
      expect(metrics.availability.uptime).toBe(99.95);
      expect(metrics.availability.downtime).toBe(0.05);
      expect(metrics.availability.sla).toBe(99.9);
    });

    it('should include top errors data', async () => {
      const metrics = await performanceService.getPerformanceMetrics();
      
      expect(metrics.errorRate.topErrors.length).toBeGreaterThan(0);
      
      const topError = metrics.errorRate.topErrors[0];
      expect(topError).toHaveProperty('error');
      expect(topError).toHaveProperty('count');
      expect(topError).toHaveProperty('percentage');
      
      expect(typeof topError.error).toBe('string');
      expect(typeof topError.count).toBe('number');
      expect(typeof topError.percentage).toBe('number');
      
      expect(topError.error).toBe('Database connection timeout');
      expect(topError.count).toBe(50);
      expect(topError.percentage).toBe(0.35);
    });
  });

  describe('getPerformanceAlerts', () => {
    it('should get performance alerts', async () => {
      const alerts = await performanceService.getPerformanceAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
      
      const alert = alerts[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('name');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('status');
      expect(alert).toHaveProperty('description');
      expect(alert).toHaveProperty('condition');
      expect(alert).toHaveProperty('value');
      expect(alert).toHaveProperty('threshold');
      expect(alert).toHaveProperty('timestamp');
      
      expect(typeof alert.id).toBe('string');
      expect(typeof alert.name).toBe('string');
      expect(['warning', 'critical']).toContain(alert.severity);
      expect(['firing', 'resolved']).toContain(alert.status);
      expect(typeof alert.description).toBe('string');
      expect(typeof alert.condition).toBe('string');
      expect(typeof alert.value).toBe('number');
      expect(typeof alert.threshold).toBe('number');
      expect(alert.timestamp).toBeInstanceOf(Date);
    });

    it('should include realistic alert data', async () => {
      const alerts = await performanceService.getPerformanceAlerts();
      
      const responseTimeAlert = alerts.find(a => a.name === 'High Response Time');
      expect(responseTimeAlert).toBeDefined();
      expect(responseTimeAlert?.severity).toBe('warning');
      expect(responseTimeAlert?.status).toBe('firing');
      expect(responseTimeAlert?.value).toBe(2500);
      expect(responseTimeAlert?.threshold).toBe(2000);
      
      const errorRateAlert = alerts.find(a => a.name === 'High Error Rate');
      expect(errorRateAlert).toBeDefined();
      expect(errorRateAlert?.severity).toBe('critical');
      expect(errorRateAlert?.status).toBe('firing');
      expect(errorRateAlert?.value).toBe(0.08);
      expect(errorRateAlert?.threshold).toBe(0.05);
    });
  });

  describe('integration tests', () => {
    it('should perform full performance monitoring setup workflow', async () => {
      // Set up Prometheus monitoring
      const prometheusResult = await performanceService.setupPrometheusMonitoring();
      expect(prometheusResult).toBe(true);

      // Configure Grafana dashboards
      const grafanaResult = await performanceService.configureGrafanaDashboards();
      expect(grafanaResult).toBe(true);

      // Set up APM
      const apmResult = await performanceService.setupAPM();
      expect(apmResult).toBe(true);

      // Set up log aggregation
      const logAggregationResult = await performanceService.setupLogAggregation();
      expect(logAggregationResult).toBe(true);

      // Set up real-time tracking
      const realTimeResult = await performanceService.setupRealTimeTracking();
      expect(realTimeResult).toBe(true);

      // Set up automated testing
      const testingResult = await performanceService.setupAutomatedPerformanceTesting();
      expect(testingResult).toBe(true);

      // Get metrics
      const metrics = await performanceService.getPerformanceMetrics();
      expect(metrics).toBeDefined();

      // Get alerts
      const alerts = await performanceService.getPerformanceAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      // Get recommendations
      const recommendations = await performanceService.createPerformanceRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      // Get custom metrics
      const customMetrics = await performanceService.createCustomMetrics();
      expect(customMetrics.length).toBeGreaterThan(0);
    });

    it('should handle performance monitoring with different providers', async () => {
      const providers: Array<'prometheus' | 'datadog' | 'newrelic' | 'custom'> = ['prometheus', 'datadog', 'newrelic', 'custom'];
      
      for (const provider of providers) {
        const testConfig: PerformanceMonitoringConfig = {
          provider,
          region: 'us-east-1',
        };

        const testService = new PerformanceMonitoringService(testConfig);
        
        // Test basic setup
        const setupResult = await testService.setupPrometheusMonitoring();
        expect(setupResult).toBe(true);
        
        // Test metrics retrieval
        const metrics = await testService.getPerformanceMetrics();
        expect(metrics).toBeDefined();
        
        // Test recommendations creation
        const recommendations = await testService.createPerformanceRecommendations();
        expect(recommendations).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const invalidConfig: PerformanceMonitoringConfig = {
        provider: 'invalid' as any,
        region: 'invalid-region',
      };

      const invalidService = new PerformanceMonitoringService(invalidConfig);
      
      const prometheusResult = await invalidService.setupPrometheusMonitoring();
      expect(prometheusResult).toBe(false);
      
      const grafanaResult = await invalidService.configureGrafanaDashboards();
      expect(grafanaResult).toBe(false);
      
      const apmResult = await invalidService.setupAPM();
      expect(apmResult).toBe(false);
    });

    it('should handle service errors gracefully', async () => {
      // Test with minimal configuration
      const minimalConfig: PerformanceMonitoringConfig = {
        provider: 'prometheus',
        region: 'us-east-1',
      };

      const minimalService = new PerformanceMonitoringService(minimalConfig);
      
      // These should still work with minimal config
      const metrics = await minimalService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      
      const alerts = await minimalService.getPerformanceAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const recommendations = await minimalService.createPerformanceRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      
      const customMetrics = await minimalService.createCustomMetrics();
      expect(customMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('performance tests', () => {
    it('should handle concurrent performance monitoring operations', async () => {
      const operations = [
        performanceService.getPerformanceMetrics(),
        performanceService.getPerformanceAlerts(),
        performanceService.createPerformanceRecommendations(),
        performanceService.createCustomMetrics(),
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();
      expect(results[3]).toBeDefined();
    });

    it('should handle rapid configuration changes', async () => {
      const configs = [
        { provider: 'prometheus' as const, region: 'us-east-1' },
        { provider: 'datadog' as const, region: 'us-west-2' },
        { provider: 'newrelic' as const, region: 'eu-west-1' },
      ];

      for (const config of configs) {
        const testConfig: PerformanceMonitoringConfig = {
          ...config,
        };

        const testService = new PerformanceMonitoringService(testConfig);
        const metrics = await testService.getPerformanceMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('recommendation validation', () => {
    it('should create actionable performance recommendations', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      recommendations.forEach(recommendation => {
        // Validate recommendation structure
        expect(recommendation.id).toMatch(/^rec-\d{3}$/);
        expect(recommendation.title).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.actions.length).toBeGreaterThan(0);
        expect(recommendation.estimatedImprovement).toBeDefined();
        
        // Validate priority ordering
        expect(recommendation.priority).toBeGreaterThan(0);
        expect(recommendation.priority).toBeLessThanOrEqual(10);
        
        // Validate impact and effort
        expect(['low', 'medium', 'high']).toContain(recommendation.impact);
        expect(['low', 'medium', 'high']).toContain(recommendation.effort);
        
        // Validate category
        expect(['performance', 'scalability', 'optimization', 'security']).toContain(recommendation.category);
      });
    });

    it('should prioritize high-impact recommendations', async () => {
      const recommendations = await performanceService.createPerformanceRecommendations();
      
      const highImpactRecs = recommendations.filter(r => r.impact === 'high');
      expect(highImpactRecs.length).toBeGreaterThan(0);
      
      // High impact recommendations should have higher priority
      const avgHighImpactPriority = highImpactRecs.reduce((sum, r) => sum + r.priority, 0) / highImpactRecs.length;
      const avgOtherPriority = recommendations
        .filter(r => r.impact !== 'high')
        .reduce((sum, r) => sum + r.priority, 0) / recommendations.filter(r => r.impact !== 'high').length;
      
      expect(avgHighImpactPriority).toBeLessThan(avgOtherPriority);
    });
  });
}); 