import { APIGatewayService, APIGatewayConfig } from '@/lib/services/api-gateway';

describe('APIGatewayService', () => {
  let apiGatewayService: APIGatewayService;
  let mockConfig: APIGatewayConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'aws',
      region: 'us-east-1',
      apiId: 'test-api-id',
      stageName: 'prod',
      domainName: 'api.example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    };

    apiGatewayService = new APIGatewayService(mockConfig);
  });

  describe('constructor', () => {
    it('should create API gateway service with configuration', () => {
      expect(apiGatewayService).toBeInstanceOf(APIGatewayService);
    });
  });

  describe('setupAPIGateway', () => {
    it('should set up API gateway successfully', async () => {
      const result = await apiGatewayService.setupAPIGateway();
      expect(result).toBe(true);
    });

    it('should handle API gateway setup errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.setupAPIGateway();
      expect(result).toBe(false);
    });
  });

  describe('configureAPIRateLimiting', () => {
    it('should configure API rate limiting successfully', async () => {
      const result = await apiGatewayService.configureAPIRateLimiting();
      expect(result).toBe(true);
    });

    it('should handle rate limiting configuration errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.configureAPIRateLimiting();
      expect(result).toBe(false);
    });
  });

  describe('configureAPIAuthentication', () => {
    it('should configure API authentication successfully', async () => {
      const result = await apiGatewayService.configureAPIAuthentication();
      expect(result).toBe(true);
    });

    it('should handle authentication configuration errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.configureAPIAuthentication();
      expect(result).toBe(false);
    });
  });

  describe('createAPIDocumentation', () => {
    it('should create API documentation successfully', async () => {
      const documentation = await apiGatewayService.createAPIDocumentation();
      
      expect(documentation).toHaveProperty('title');
      expect(documentation).toHaveProperty('version');
      expect(documentation).toHaveProperty('description');
      expect(documentation).toHaveProperty('baseUrl');
      expect(documentation).toHaveProperty('endpoints');
      expect(documentation).toHaveProperty('schemas');
      expect(documentation).toHaveProperty('examples');
      expect(documentation).toHaveProperty('authentication');
      
      expect(documentation.title).toBe('Master CMS API');
      expect(documentation.version).toBe('1.0.0');
      expect(documentation.description).toBe('Comprehensive API for Master CMS external integrations');
      expect(Array.isArray(documentation.endpoints)).toBe(true);
      expect(documentation.endpoints.length).toBeGreaterThan(0);
    });

    it('should include comprehensive endpoint documentation', async () => {
      const documentation = await apiGatewayService.createAPIDocumentation();
      const usersEndpoint = documentation.endpoints.find(e => e.id === 'users-api');
      
      expect(usersEndpoint).toBeDefined();
      expect(usersEndpoint?.name).toBe('Users API');
      expect(usersEndpoint?.path).toBe('/api/users');
      expect(usersEndpoint?.method).toBe('GET');
      expect(usersEndpoint?.authentication).toBe(true);
      expect(usersEndpoint?.rateLimit.enabled).toBe(true);
      expect(usersEndpoint?.caching.enabled).toBe(true);
      expect(usersEndpoint?.cors.enabled).toBe(true);
    });

    it('should include authentication information', async () => {
      const documentation = await apiGatewayService.createAPIDocumentation();
      
      expect(documentation.authentication.type).toBe('api_key');
      expect(documentation.authentication.description).toBe('Use your API key in the Authorization header');
      expect(Array.isArray(documentation.authentication.endpoints)).toBe(true);
      expect(documentation.authentication.endpoints).toContain('/api/users');
      expect(documentation.authentication.endpoints).toContain('/api/posts');
    });

    it('should include data schemas', async () => {
      const documentation = await apiGatewayService.createAPIDocumentation();
      
      expect(documentation.schemas).toHaveProperty('User');
      expect(documentation.schemas).toHaveProperty('Post');
      
      const userSchema = documentation.schemas.User;
      expect(userSchema.type).toBe('object');
      expect(userSchema.properties).toHaveProperty('id');
      expect(userSchema.properties).toHaveProperty('name');
      expect(userSchema.properties).toHaveProperty('email');
      expect(userSchema.properties).toHaveProperty('createdAt');
      expect(Array.isArray(userSchema.required)).toBe(true);
      expect(userSchema.required).toContain('id');
      expect(userSchema.required).toContain('name');
      expect(userSchema.required).toContain('email');
    });
  });

  describe('setupAPIMonitoring', () => {
    it('should set up API monitoring successfully', async () => {
      const result = await apiGatewayService.setupAPIMonitoring();
      expect(result).toBe(true);
    });

    it('should handle monitoring setup errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.setupAPIMonitoring();
      expect(result).toBe(false);
    });
  });

  describe('setupAPIVersioning', () => {
    it('should set up API versioning successfully', async () => {
      const result = await apiGatewayService.setupAPIVersioning();
      expect(result).toBe(true);
    });

    it('should handle versioning setup errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.setupAPIVersioning();
      expect(result).toBe(false);
    });
  });

  describe('setupAPISecurity', () => {
    it('should set up API security successfully', async () => {
      const result = await apiGatewayService.setupAPISecurity();
      expect(result).toBe(true);
    });

    it('should handle security setup errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.setupAPISecurity();
      expect(result).toBe(false);
    });
  });

  describe('setupAPIPerformanceOptimization', () => {
    it('should set up API performance optimization successfully', async () => {
      const result = await apiGatewayService.setupAPIPerformanceOptimization();
      expect(result).toBe(true);
    });

    it('should handle performance optimization setup errors', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        stageName: 'prod',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      const result = await invalidService.setupAPIPerformanceOptimization();
      expect(result).toBe(false);
    });
  });

  describe('getAPIMetrics', () => {
    it('should get API metrics', async () => {
      const metrics = await apiGatewayService.getAPIMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('requestsPerMinute');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('topEndpoints');
      expect(metrics).toHaveProperty('topErrors');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.successfulRequests).toBe('number');
      expect(typeof metrics.failedRequests).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.requestsPerMinute).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(Array.isArray(metrics.topEndpoints)).toBe(true);
      expect(Array.isArray(metrics.topErrors)).toBe(true);
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should include top endpoints data', async () => {
      const metrics = await apiGatewayService.getAPIMetrics();
      
      expect(metrics.topEndpoints.length).toBeGreaterThan(0);
      
      const topEndpoint = metrics.topEndpoints[0];
      expect(topEndpoint).toHaveProperty('path');
      expect(topEndpoint).toHaveProperty('method');
      expect(topEndpoint).toHaveProperty('requests');
      expect(topEndpoint).toHaveProperty('avgResponseTime');
      
      expect(typeof topEndpoint.path).toBe('string');
      expect(typeof topEndpoint.method).toBe('string');
      expect(typeof topEndpoint.requests).toBe('number');
      expect(typeof topEndpoint.avgResponseTime).toBe('number');
    });

    it('should include top errors data', async () => {
      const metrics = await apiGatewayService.getAPIMetrics();
      
      expect(metrics.topErrors.length).toBeGreaterThan(0);
      
      const topError = metrics.topErrors[0];
      expect(topError).toHaveProperty('code');
      expect(topError).toHaveProperty('message');
      expect(topError).toHaveProperty('count');
      
      expect(typeof topError.code).toBe('number');
      expect(typeof topError.message).toBe('string');
      expect(typeof topError.count).toBe('number');
    });
  });

  describe('getAPIKeys', () => {
    it('should get API keys', async () => {
      const apiKeys = await apiGatewayService.getAPIKeys();
      
      expect(Array.isArray(apiKeys)).toBe(true);
      expect(apiKeys.length).toBeGreaterThan(0);
      
      const apiKey = apiKeys[0];
      expect(apiKey).toHaveProperty('id');
      expect(apiKey).toHaveProperty('name');
      expect(apiKey).toHaveProperty('key');
      expect(apiKey).toHaveProperty('status');
      expect(apiKey).toHaveProperty('permissions');
      expect(apiKey).toHaveProperty('rateLimit');
      expect(apiKey).toHaveProperty('createdAt');
      
      expect(typeof apiKey.id).toBe('string');
      expect(typeof apiKey.name).toBe('string');
      expect(typeof apiKey.key).toBe('string');
      expect(['active', 'inactive', 'expired']).toContain(apiKey.status);
      expect(Array.isArray(apiKey.permissions)).toBe(true);
      expect(apiKey.rateLimit).toHaveProperty('requestsPerMinute');
      expect(apiKey.rateLimit).toHaveProperty('burstSize');
      expect(apiKey.createdAt).toBeInstanceOf(Date);
    });

    it('should include production and development API keys', async () => {
      const apiKeys = await apiGatewayService.getAPIKeys();
      
      const productionKey = apiKeys.find(k => k.name.includes('Production'));
      const developmentKey = apiKeys.find(k => k.name.includes('Development'));
      
      expect(productionKey).toBeDefined();
      expect(developmentKey).toBeDefined();
      
      expect(productionKey?.status).toBe('active');
      expect(developmentKey?.status).toBe('active');
      
      expect(productionKey?.permissions).toContain('users:read');
      expect(productionKey?.permissions).toContain('posts:read');
      expect(developmentKey?.permissions).toContain('users:write');
      expect(developmentKey?.permissions).toContain('posts:write');
    });
  });

  describe('getAPIVersions', () => {
    it('should get API versions', async () => {
      const versions = await apiGatewayService.getAPIVersions();
      
      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);
      
      const version = versions[0];
      expect(version).toHaveProperty('version');
      expect(version).toHaveProperty('status');
      expect(version).toHaveProperty('releaseDate');
      expect(version).toHaveProperty('changes');
      
      expect(typeof version.version).toBe('string');
      expect(['active', 'deprecated', 'retired']).toContain(version.status);
      expect(version.releaseDate).toBeInstanceOf(Date);
      expect(Array.isArray(version.changes)).toBe(true);
    });

    it('should include version change history', async () => {
      const versions = await apiGatewayService.getAPIVersions();
      
      const v2Version = versions.find(v => v.version === 'v2');
      expect(v2Version).toBeDefined();
      expect(v2Version?.status).toBe('active');
      expect(v2Version?.changes.length).toBeGreaterThan(0);
      
      const change = v2Version?.changes[0];
      expect(change).toHaveProperty('type');
      expect(change).toHaveProperty('description');
      expect(change).toHaveProperty('impact');
      
      expect(['added', 'modified', 'removed', 'breaking']).toContain(change?.type);
      expect(['low', 'medium', 'high']).toContain(change?.impact);
    });
  });

  describe('integration tests', () => {
    it('should perform full API gateway setup workflow', async () => {
      // Set up API gateway
      const setupResult = await apiGatewayService.setupAPIGateway();
      expect(setupResult).toBe(true);

      // Configure rate limiting
      const rateLimitResult = await apiGatewayService.configureAPIRateLimiting();
      expect(rateLimitResult).toBe(true);

      // Configure authentication
      const authResult = await apiGatewayService.configureAPIAuthentication();
      expect(authResult).toBe(true);

      // Set up monitoring
      const monitoringResult = await apiGatewayService.setupAPIMonitoring();
      expect(monitoringResult).toBe(true);

      // Set up versioning
      const versioningResult = await apiGatewayService.setupAPIVersioning();
      expect(versioningResult).toBe(true);

      // Set up security
      const securityResult = await apiGatewayService.setupAPISecurity();
      expect(securityResult).toBe(true);

      // Set up performance optimization
      const performanceResult = await apiGatewayService.setupAPIPerformanceOptimization();
      expect(performanceResult).toBe(true);

      // Get metrics
      const metrics = await apiGatewayService.getAPIMetrics();
      expect(metrics).toBeDefined();

      // Get documentation
      const documentation = await apiGatewayService.createAPIDocumentation();
      expect(documentation).toBeDefined();

      // Get API keys
      const apiKeys = await apiGatewayService.getAPIKeys();
      expect(apiKeys.length).toBeGreaterThan(0);

      // Get versions
      const versions = await apiGatewayService.getAPIVersions();
      expect(versions.length).toBeGreaterThan(0);
    });

    it('should handle API gateway configuration with different providers', async () => {
      const providers: Array<'aws' | 'azure' | 'gcp' | 'custom'> = ['aws', 'azure', 'gcp', 'custom'];
      
      for (const provider of providers) {
        const testConfig: APIGatewayConfig = {
          provider,
          region: 'us-east-1',
          stageName: 'prod',
        };

        const testService = new APIGatewayService(testConfig);
        
        // Test basic setup
        const setupResult = await testService.setupAPIGateway();
        expect(setupResult).toBe(true);
        
        // Test metrics retrieval
        const metrics = await testService.getAPIMetrics();
        expect(metrics).toBeDefined();
        
        // Test documentation creation
        const documentation = await testService.createAPIDocumentation();
        expect(documentation).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const invalidConfig: APIGatewayConfig = {
        provider: 'invalid' as any,
        region: 'invalid-region',
        stageName: 'invalid-stage',
      };

      const invalidService = new APIGatewayService(invalidConfig);
      
      const setupResult = await invalidService.setupAPIGateway();
      expect(setupResult).toBe(false);
      
      const rateLimitResult = await invalidService.configureAPIRateLimiting();
      expect(rateLimitResult).toBe(false);
      
      const authResult = await invalidService.configureAPIAuthentication();
      expect(authResult).toBe(false);
    });

    it('should handle service errors gracefully', async () => {
      // Test with minimal configuration
      const minimalConfig: APIGatewayConfig = {
        provider: 'aws',
        region: 'us-east-1',
        stageName: 'prod',
      };

      const minimalService = new APIGatewayService(minimalConfig);
      
      // These should still work with minimal config
      const metrics = await minimalService.getAPIMetrics();
      expect(metrics).toBeDefined();
      
      const documentation = await minimalService.createAPIDocumentation();
      expect(documentation).toBeDefined();
      
      const apiKeys = await minimalService.getAPIKeys();
      expect(apiKeys.length).toBeGreaterThan(0);
      
      const versions = await minimalService.getAPIVersions();
      expect(versions.length).toBeGreaterThan(0);
    });
  });

  describe('performance tests', () => {
    it('should handle concurrent API gateway operations', async () => {
      const operations = [
        apiGatewayService.getAPIMetrics(),
        apiGatewayService.createAPIDocumentation(),
        apiGatewayService.getAPIKeys(),
        apiGatewayService.getAPIVersions(),
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
        { provider: 'aws' as const, region: 'us-east-1' },
        { provider: 'azure' as const, region: 'east-us' },
        { provider: 'gcp' as const, region: 'us-central1' },
      ];

      for (const config of configs) {
        const testConfig: APIGatewayConfig = {
          ...config,
          stageName: 'prod',
        };

        const testService = new APIGatewayService(testConfig);
        const metrics = await testService.getAPIMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('documentation validation', () => {
    it('should create valid OpenAPI-compatible documentation', async () => {
      const documentation = await apiGatewayService.createAPIDocumentation();
      
      // Validate basic OpenAPI structure
      expect(documentation.title).toBeDefined();
      expect(documentation.version).toBeDefined();
      expect(documentation.description).toBeDefined();
      expect(documentation.baseUrl).toBeDefined();
      
      // Validate endpoints
      expect(Array.isArray(documentation.endpoints)).toBe(true);
      documentation.endpoints.forEach(endpoint => {
        expect(endpoint.id).toBeDefined();
        expect(endpoint.name).toBeDefined();
        expect(endpoint.path).toBeDefined();
        expect(endpoint.method).toBeDefined();
        expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(endpoint.method);
      });
      
      // Validate schemas
      expect(typeof documentation.schemas).toBe('object');
      Object.keys(documentation.schemas).forEach(schemaName => {
        const schema = documentation.schemas[schemaName];
        expect(schema.type).toBeDefined();
        expect(schema.properties).toBeDefined();
      });
    });

    it('should include comprehensive endpoint documentation', async () => {
      const documentation = await apiGatewayService.createAPIDocumentation();
      
      documentation.endpoints.forEach(endpoint => {
        expect(endpoint.documentation.description).toBeDefined();
        expect(Array.isArray(endpoint.documentation.parameters)).toBe(true);
        expect(Array.isArray(endpoint.documentation.responses)).toBe(true);
        
        // Validate parameters
        endpoint.documentation.parameters.forEach(param => {
          expect(param.name).toBeDefined();
          expect(param.type).toBeDefined();
          expect(param.required).toBeDefined();
          expect(param.description).toBeDefined();
        });
        
        // Validate responses
        endpoint.documentation.responses.forEach(response => {
          expect(response.code).toBeDefined();
          expect(response.description).toBeDefined();
          expect(response.schema).toBeDefined();
        });
      });
    });
  });
}); 