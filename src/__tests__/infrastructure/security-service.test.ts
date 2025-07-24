import { SecurityService, SecurityConfig } from '@/lib/services/security';

describe('SecurityService', () => {
  let securityService: SecurityService;
  let mockConfig: SecurityConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'aws',
      region: 'us-east-1',
      domain: 'example.com',
      sslCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
      wafWebAclArn: 'arn:aws:wafv2:us-east-1:123456789012:webacl/test-waf',
      apiKey: 'test-api-key',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    };

    securityService = new SecurityService(mockConfig);
  });

  describe('constructor', () => {
    it('should create security service with configuration', () => {
      expect(securityService).toBeInstanceOf(SecurityService);
    });
  });

  describe('configureSSL', () => {
    it('should configure SSL successfully', async () => {
      const result = await securityService.configureSSL();
      expect(result).toBe(true);
    });

    it('should handle SSL configuration errors', async () => {
      const invalidConfig: SecurityConfig = {
        provider: 'aws',
        region: 'us-east-1',
        domain: 'invalid-domain',
        sslCertificateArn: undefined,
      };

      const invalidService = new SecurityService(invalidConfig);
      const result = await invalidService.configureSSL();
      expect(result).toBe(false);
    });
  });

  describe('configureWAF', () => {
    it('should configure WAF successfully', async () => {
      const wafConfig = await securityService.configureWAF();
      
      expect(wafConfig.enabled).toBe(true);
      expect(wafConfig.defaultAction).toBe('block');
      expect(wafConfig.rules).toHaveLength(4);
      expect(wafConfig.rateLimit.enabled).toBe(true);
      expect(wafConfig.geoBlocking.enabled).toBe(false);
      expect(wafConfig.ipBlocking.enabled).toBe(true);
    });

    it('should create default WAF rules', async () => {
      const wafConfig = await securityService.configureWAF();
      const rules = wafConfig.rules;
      
      expect(rules).toHaveLength(4);
      
      const rateLimitRule = rules.find(r => r.id === 'rate-limit');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule?.action).toBe('block');
      expect(rateLimitRule?.priority).toBe(1);
      
      const sqlInjectionRule = rules.find(r => r.id === 'sql-injection');
      expect(sqlInjectionRule).toBeDefined();
      expect(sqlInjectionRule?.action).toBe('block');
      expect(sqlInjectionRule?.priority).toBe(2);
      
      const xssRule = rules.find(r => r.id === 'xss-protection');
      expect(xssRule).toBeDefined();
      expect(xssRule?.action).toBe('block');
      expect(xssRule?.priority).toBe(3);
      
      const badBotsRule = rules.find(r => r.id === 'bad-bots');
      expect(badBotsRule).toBeDefined();
      expect(badBotsRule?.action).toBe('block');
      expect(badBotsRule?.priority).toBe(4);
    });
  });

  describe('configureDDoSProtection', () => {
    it('should configure DDoS protection successfully', async () => {
      const ddosConfig = await securityService.configureDDoSProtection();
      
      expect(ddosConfig.enabled).toBe(true);
      expect(ddosConfig.level).toBe('advanced');
      expect(ddosConfig.mitigation.automatic).toBe(true);
      expect(ddosConfig.mitigation.manual).toBe(true);
      expect(ddosConfig.mitigation.threshold).toBe(1000);
      expect(ddosConfig.monitoring.enabled).toBe(true);
      expect(ddosConfig.monitoring.alertThreshold).toBe(500);
      expect(ddosConfig.monitoring.notificationChannels).toContain('email');
      expect(ddosConfig.monitoring.notificationChannels).toContain('slack');
      expect(ddosConfig.monitoring.notificationChannels).toContain('pagerduty');
    });
  });

  describe('configureSecurityHeaders', () => {
    it('should configure security headers successfully', async () => {
      const headers = await securityService.configureSecurityHeaders();
      
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
      expect(headers['Permissions-Policy']).toBe('geolocation=(), microphone=(), camera=()');
      expect(headers['X-DNS-Prefetch-Control']).toBe('on');
    });

    it('should include comprehensive CSP policy', async () => {
      const headers = await securityService.configureSecurityHeaders();
      const csp = headers['Content-Security-Policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("img-src 'self' data: https:");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe('configureRateLimiting', () => {
    it('should configure rate limiting successfully', async () => {
      const rateLimitConfig = await securityService.configureRateLimiting();
      
      expect(rateLimitConfig.enabled).toBe(true);
      expect(rateLimitConfig.global.requestsPerMinute).toBe(1000);
      expect(rateLimitConfig.global.burstSize).toBe(100);
      expect(rateLimitConfig.api.requestsPerMinute).toBe(500);
      expect(rateLimitConfig.api.burstSize).toBe(50);
      expect(rateLimitConfig.auth.requestsPerMinute).toBe(10);
      expect(rateLimitConfig.auth.burstSize).toBe(5);
      expect(Object.keys(rateLimitConfig.custom)).toHaveLength(2);
    });

    it('should include custom rate limiting rules', async () => {
      const rateLimitConfig = await securityService.configureRateLimiting();
      
      expect(rateLimitConfig.custom['api/users']).toBeDefined();
      expect(rateLimitConfig.custom['api/users'].requestsPerMinute).toBe(100);
      expect(rateLimitConfig.custom['api/users'].burstSize).toBe(10);
      
      expect(rateLimitConfig.custom['api/posts']).toBeDefined();
      expect(rateLimitConfig.custom['api/posts'].requestsPerMinute).toBe(200);
      expect(rateLimitConfig.custom['api/posts'].burstSize).toBe(20);
    });
  });

  describe('setupSecurityMonitoring', () => {
    it('should set up security monitoring successfully', async () => {
      const result = await securityService.setupSecurityMonitoring();
      expect(result).toBe(true);
    });

    it('should handle monitoring setup errors', async () => {
      const invalidConfig: SecurityConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        domain: 'example.com',
      };

      const invalidService = new SecurityService(invalidConfig);
      const result = await invalidService.setupSecurityMonitoring();
      expect(result).toBe(false);
    });
  });

  describe('createIncidentResponseProcedures', () => {
    it('should create incident response procedures', async () => {
      const procedures = await securityService.createIncidentResponseProcedures();
      
      expect(procedures).toHaveProperty('ddos');
      expect(procedures).toHaveProperty('waf');
      expect(procedures).toHaveProperty('ssl');
      expect(procedures).toHaveProperty('unauthorized_access');
      
      expect(Array.isArray(procedures.ddos)).toBe(true);
      expect(Array.isArray(procedures.waf)).toBe(true);
      expect(Array.isArray(procedures.ssl)).toBe(true);
      expect(Array.isArray(procedures.unauthorized_access)).toBe(true);
    });

    it('should include comprehensive DDoS procedures', async () => {
      const procedures = await securityService.createIncidentResponseProcedures();
      const ddosProcedures = procedures.ddos;
      
      expect(ddosProcedures).toContain('1. Detect and analyze attack pattern');
      expect(ddosProcedures).toContain('2. Activate automatic DDoS mitigation');
      expect(ddosProcedures).toContain('3. Notify security team and stakeholders');
      expect(ddosProcedures).toContain('4. Monitor attack progression');
      expect(ddosProcedures).toContain('5. Implement additional manual mitigations if needed');
      expect(ddosProcedures).toContain('6. Document incident details');
      expect(ddosProcedures).toContain('7. Post-incident analysis and lessons learned');
    });

    it('should include comprehensive WAF procedures', async () => {
      const procedures = await securityService.createIncidentResponseProcedures();
      const wafProcedures = procedures.waf;
      
      expect(wafProcedures).toContain('1. Review WAF logs and blocked requests');
      expect(wafProcedures).toContain('2. Identify attack patterns and sources');
      expect(wafProcedures).toContain('3. Update WAF rules if necessary');
      expect(wafProcedures).toContain('4. Block malicious IPs and user agents');
      expect(wafProcedures).toContain('5. Monitor for new attack patterns');
      expect(wafProcedures).toContain('6. Document incident and response actions');
    });
  });

  describe('setupComplianceMonitoring', () => {
    it('should set up compliance monitoring successfully', async () => {
      const result = await securityService.setupComplianceMonitoring();
      expect(result).toBe(true);
    });

    it('should handle compliance setup errors', async () => {
      const invalidConfig: SecurityConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        domain: 'example.com',
      };

      const invalidService = new SecurityService(invalidConfig);
      const result = await invalidService.setupComplianceMonitoring();
      expect(result).toBe(false);
    });
  });

  describe('getSecurityMetrics', () => {
    it('should get security metrics', async () => {
      const metrics = await securityService.getSecurityMetrics();
      
      expect(metrics).toHaveProperty('totalIncidents');
      expect(metrics).toHaveProperty('incidentsByType');
      expect(metrics).toHaveProperty('incidentsBySeverity');
      expect(metrics).toHaveProperty('averageResolutionTime');
      expect(metrics).toHaveProperty('wafBlockedRequests');
      expect(metrics).toHaveProperty('ddosAttacks');
      expect(metrics).toHaveProperty('sslCertificateExpiry');
      expect(metrics).toHaveProperty('rateLimitViolations');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(typeof metrics.totalIncidents).toBe('number');
      expect(typeof metrics.averageResolutionTime).toBe('number');
      expect(typeof metrics.wafBlockedRequests).toBe('number');
      expect(typeof metrics.ddosAttacks).toBe('number');
      expect(typeof metrics.rateLimitViolations).toBe('number');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should include incident type breakdown', async () => {
      const metrics = await securityService.getSecurityMetrics();
      
      expect(metrics.incidentsByType).toHaveProperty('ddos');
      expect(metrics.incidentsByType).toHaveProperty('waf');
      expect(metrics.incidentsByType).toHaveProperty('ssl');
      expect(metrics.incidentsByType).toHaveProperty('rate_limit');
      expect(metrics.incidentsByType).toHaveProperty('malware');
      expect(metrics.incidentsByType).toHaveProperty('unauthorized_access');
    });

    it('should include incident severity breakdown', async () => {
      const metrics = await securityService.getSecurityMetrics();
      
      expect(metrics.incidentsBySeverity).toHaveProperty('low');
      expect(metrics.incidentsBySeverity).toHaveProperty('medium');
      expect(metrics.incidentsBySeverity).toHaveProperty('high');
      expect(metrics.incidentsBySeverity).toHaveProperty('critical');
    });
  });

  describe('getSSLCertificates', () => {
    it('should get SSL certificates', async () => {
      const certificates = await securityService.getSSLCertificates();
      
      expect(Array.isArray(certificates)).toBe(true);
      expect(certificates.length).toBeGreaterThan(0);
      
      const certificate = certificates[0];
      expect(certificate).toHaveProperty('id');
      expect(certificate).toHaveProperty('domain');
      expect(certificate).toHaveProperty('status');
      expect(certificate).toHaveProperty('issuer');
      expect(certificate).toHaveProperty('validFrom');
      expect(certificate).toHaveProperty('validTo');
      expect(certificate).toHaveProperty('type');
      expect(certificate).toHaveProperty('autoRenewal');
      
      expect(certificate.domain).toBe('example.com');
      expect(certificate.status).toBe('active');
      expect(certificate.issuer).toBe('Let\'s Encrypt');
      expect(certificate.type).toBe('single');
      expect(certificate.autoRenewal).toBe(true);
    });
  });

  describe('getSecurityIncidents', () => {
    it('should get security incidents', async () => {
      const incidents = await securityService.getSecurityIncidents();
      
      expect(Array.isArray(incidents)).toBe(true);
      expect(incidents.length).toBeGreaterThan(0);
      
      const incident = incidents[0];
      expect(incident).toHaveProperty('id');
      expect(incident).toHaveProperty('type');
      expect(incident).toHaveProperty('severity');
      expect(incident).toHaveProperty('status');
      expect(incident).toHaveProperty('description');
      expect(incident).toHaveProperty('source');
      expect(incident).toHaveProperty('timestamp');
      expect(incident).toHaveProperty('affectedResources');
      expect(incident).toHaveProperty('mitigationActions');
      
      expect(['ddos', 'waf', 'ssl', 'rate_limit', 'malware', 'unauthorized_access']).toContain(incident.type);
      expect(['low', 'medium', 'high', 'critical']).toContain(incident.severity);
      expect(['open', 'investigating', 'mitigated', 'resolved']).toContain(incident.status);
      expect(Array.isArray(incident.affectedResources)).toBe(true);
      expect(Array.isArray(incident.mitigationActions)).toBe(true);
      expect(incident.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('integration tests', () => {
    it('should perform full security setup workflow', async () => {
      // Configure SSL
      const sslConfigured = await securityService.configureSSL();
      expect(sslConfigured).toBe(true);

      // Configure WAF
      const wafConfig = await securityService.configureWAF();
      expect(wafConfig.enabled).toBe(true);

      // Configure DDoS protection
      const ddosConfig = await securityService.configureDDoSProtection();
      expect(ddosConfig.enabled).toBe(true);

      // Configure security headers
      const headers = await securityService.configureSecurityHeaders();
      expect(headers['X-Frame-Options']).toBe('DENY');

      // Configure rate limiting
      const rateLimitConfig = await securityService.configureRateLimiting();
      expect(rateLimitConfig.enabled).toBe(true);

      // Set up monitoring
      const monitoringSetup = await securityService.setupSecurityMonitoring();
      expect(monitoringSetup).toBe(true);

      // Set up compliance
      const complianceSetup = await securityService.setupComplianceMonitoring();
      expect(complianceSetup).toBe(true);

      // Get metrics
      const metrics = await securityService.getSecurityMetrics();
      expect(metrics).toBeDefined();

      // Get certificates
      const certificates = await securityService.getSSLCertificates();
      expect(certificates.length).toBeGreaterThan(0);

      // Get incidents
      const incidents = await securityService.getSecurityIncidents();
      expect(incidents.length).toBeGreaterThan(0);

      // Get procedures
      const procedures = await securityService.createIncidentResponseProcedures();
      expect(procedures).toHaveProperty('ddos');
    });

    it('should handle security incident workflow', async () => {
      const incidents = await securityService.getSecurityIncidents();
      const procedures = await securityService.createIncidentResponseProcedures();
      
      // Simulate incident response
      const ddosIncident = incidents.find(i => i.type === 'ddos');
      if (ddosIncident) {
        expect(ddosIncident.severity).toBe('high');
        expect(ddosIncident.status).toBe('resolved');
        expect(ddosIncident.mitigationActions).toContain('Activated DDoS protection');
      }
      
      const wafIncident = incidents.find(i => i.type === 'waf');
      if (wafIncident) {
        expect(wafIncident.severity).toBe('medium');
        expect(wafIncident.status).toBe('investigating');
        expect(wafIncident.mitigationActions).toContain('Blocked source IP');
      }
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const invalidConfig: SecurityConfig = {
        provider: 'invalid' as any,
        region: 'invalid-region',
        domain: 'invalid-domain',
      };

      const invalidService = new SecurityService(invalidConfig);
      
      const sslResult = await invalidService.configureSSL();
      expect(sslResult).toBe(false);
      
      const monitoringResult = await invalidService.setupSecurityMonitoring();
      expect(monitoringResult).toBe(false);
      
      const complianceResult = await invalidService.setupComplianceMonitoring();
      expect(complianceResult).toBe(false);
    });

    it('should handle service errors gracefully', async () => {
      // Test with missing configuration
      const minimalConfig: SecurityConfig = {
        provider: 'aws',
        region: 'us-east-1',
        domain: 'example.com',
      };

      const minimalService = new SecurityService(minimalConfig);
      
      // These should still work with minimal config
      const metrics = await minimalService.getSecurityMetrics();
      expect(metrics).toBeDefined();
      
      const certificates = await minimalService.getSSLCertificates();
      expect(certificates.length).toBeGreaterThan(0);
      
      const incidents = await minimalService.getSecurityIncidents();
      expect(incidents.length).toBeGreaterThan(0);
    });
  });

  describe('performance tests', () => {
    it('should handle concurrent security operations', async () => {
      const operations = [
        securityService.getSecurityMetrics(),
        securityService.getSSLCertificates(),
        securityService.getSecurityIncidents(),
        securityService.createIncidentResponseProcedures(),
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
        { provider: 'cloudflare' as const, region: 'us-west-2' },
        { provider: 'azure' as const, region: 'east-us' },
      ];

      for (const config of configs) {
        const testConfig: SecurityConfig = {
          ...config,
          domain: 'example.com',
        };

        const testService = new SecurityService(testConfig);
        const metrics = await testService.getSecurityMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });
}); 