import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecurityTestingService } from '../../../lib/security/testing/security-testing-service';
import { ComplianceValidationService } from '../../../lib/security/testing/compliance-validation-service';

// Mock dependencies
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    securityScan: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    vulnerability: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    complianceAssessment: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    complianceEvidence: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    site: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../lib/redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../../../lib/security/monitoring/siem-service', () => ({
  siemService: {
    ingestEvent: jest.fn(),
  },
}));

jest.mock('../../../lib/security/audit/audit-service', () => ({
  auditService: {
    logAuditEvent: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { siemService } from '../../../lib/security/monitoring/siem-service';
import { auditService } from '../../../lib/security/audit/audit-service';

describe('Security Testing System', () => {
  let securityTestingService: SecurityTestingService;
  let complianceValidationService: ComplianceValidationService;

  const mockSiteId = 'site-123';
  const mockUserId = 'user-123';
  const mockScanId = 'scan-123';
  const mockAssessmentId = 'assessment-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instances
    securityTestingService = new SecurityTestingService();
    complianceValidationService = new ComplianceValidationService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Security Scan Management', () => {
    describe('Scan Creation', () => {
      it('should create penetration testing scan successfully', async () => {
        // Mock database creation
        (prisma.securityScan.create as jest.Mock).mockResolvedValue({
          id: mockScanId,
          name: 'Web Application Penetration Test',
          description: 'Comprehensive penetration test for web application',
          scanType: 'PENETRATION',
          targets: [
            { type: 'URL', value: 'https://example.com', metadata: {} },
            { type: 'URL', value: 'https://api.example.com', metadata: {} },
          ],
          tools: ['OWASP_ZAP', 'NMAP', 'SQLMAP'],
          configuration: {
            depth: 'STANDARD',
            authentication: {
              type: 'BEARER',
              credentials: { token: 'test-token' },
            },
            exclusions: ['/admin/debug'],
            compliance_frameworks: ['OWASP_TOP_10_2021'],
          },
          scheduling: {
            frequency: 'WEEKLY',
            start_time: new Date(),
            timezone: 'UTC',
          },
          notifications: {
            on_completion: true,
            on_critical_findings: true,
            recipients: ['security@example.com'],
          },
          status: 'PENDING',
          progress: 0,
          vulnerabilitiesFound: 0,
          criticalFindings: 0,
          siteId: mockSiteId,
          createdBy: 'SYSTEM',
          metadata: { requestedBy: mockUserId },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock service methods
        securityTestingService['validateToolsAvailable'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['validateScanTargets'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['queueScan'] = jest.fn().mockResolvedValue(undefined);

        const scanData = {
          name: 'Web Application Penetration Test',
          description: 'Comprehensive penetration test for web application',
          scanType: 'PENETRATION' as const,
          targets: [
            { type: 'URL' as const, value: 'https://example.com', metadata: {} },
            { type: 'URL' as const, value: 'https://api.example.com', metadata: {} },
          ],
          tools: ['OWASP_ZAP', 'NMAP', 'SQLMAP'],
          configuration: {
            depth: 'STANDARD' as const,
            authentication: {
              type: 'BEARER' as const,
              credentials: { token: 'test-token' },
            },
            exclusions: ['/admin/debug'],
            compliance_frameworks: ['OWASP_TOP_10_2021'],
          },
          scheduling: {
            frequency: 'WEEKLY' as const,
            start_time: new Date(),
            timezone: 'UTC',
          },
          notifications: {
            on_completion: true,
            on_critical_findings: true,
            recipients: ['security@example.com'],
          },
          siteId: mockSiteId,
          metadata: { requestedBy: mockUserId },
        };

        const result = await securityTestingService.createSecurityScan(scanData);

        expect(result.id).toBe(mockScanId);
        expect(result.name).toBe('Web Application Penetration Test');
        expect(result.scanType).toBe('PENETRATION');
        expect(result.targets).toHaveLength(2);
        expect(result.targets[0].type).toBe('URL');
        expect(result.targets[0].value).toBe('https://example.com');
        expect(result.tools).toContain('OWASP_ZAP');
        expect(result.tools).toContain('NMAP');
        expect(result.tools).toContain('SQLMAP');
        expect(result.configuration.depth).toBe('STANDARD');
        expect(result.configuration.authentication?.type).toBe('BEARER');
        expect(result.scheduling?.frequency).toBe('WEEKLY');
        expect(result.status).toBe('PENDING');
        expect(result.siteId).toBe(mockSiteId);

        expect(securityTestingService['validateToolsAvailable']).toHaveBeenCalledWith(['OWASP_ZAP', 'NMAP', 'SQLMAP']);
        expect(securityTestingService['validateScanTargets']).toHaveBeenCalledWith(scanData.targets);
        expect(securityTestingService['queueScan']).toHaveBeenCalledWith(result);

        expect(prisma.securityScan.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'Web Application Penetration Test',
              scanType: 'PENETRATION',
              tools: ['OWASP_ZAP', 'NMAP', 'SQLMAP'],
              siteId: mockSiteId,
            }),
          })
        );

        expect(auditService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'SECURITY',
            eventType: 'SECURITY_SCAN_CREATED',
            severity: 'MEDIUM',
          })
        );
      });

      it('should create static analysis scan with custom rules', async () => {
        (prisma.securityScan.create as jest.Mock).mockResolvedValue({
          id: 'scan-static-123',
          name: 'Code Security Analysis',
          scanType: 'STATIC_ANALYSIS',
          targets: [{ type: 'REPOSITORY', value: 'https://github.com/org/repo' }],
          tools: ['SONARQUBE', 'ESLINT_SECURITY', 'SEMGREP'],
          configuration: {
            depth: 'DEEP',
            custom_rules: ['security-rules.yml', 'custom-patterns.yml'],
            compliance_frameworks: ['CIS_CONTROLS_V8'],
          },
          status: 'PENDING',
          siteId: mockSiteId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        securityTestingService['validateToolsAvailable'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['validateScanTargets'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['queueScan'] = jest.fn().mockResolvedValue(undefined);

        const scanData = {
          name: 'Code Security Analysis',
          scanType: 'STATIC_ANALYSIS' as const,
          targets: [{ type: 'REPOSITORY' as const, value: 'https://github.com/org/repo' }],
          tools: ['SONARQUBE', 'ESLINT_SECURITY', 'SEMGREP'],
          configuration: {
            depth: 'DEEP' as const,
            custom_rules: ['security-rules.yml', 'custom-patterns.yml'],
            compliance_frameworks: ['CIS_CONTROLS_V8'],
          },
          siteId: mockSiteId,
        };

        const result = await securityTestingService.createSecurityScan(scanData);

        expect(result.scanType).toBe('STATIC_ANALYSIS');
        expect(result.targets[0].type).toBe('REPOSITORY');
        expect(result.configuration.depth).toBe('DEEP');
        expect(result.configuration.custom_rules).toContain('security-rules.yml');
        expect(result.configuration.compliance_frameworks).toContain('CIS_CONTROLS_V8');
      });

      it('should validate tools availability before scan creation', async () => {
        securityTestingService['validateToolsAvailable'] = jest.fn().mockRejectedValue(
          new Error("Tool 'INVALID_TOOL' is not available or not properly configured")
        );

        const scanData = {
          name: 'Invalid Tool Scan',
          scanType: 'PENETRATION' as const,
          targets: [{ type: 'URL' as const, value: 'https://example.com' }],
          tools: ['INVALID_TOOL'],
          siteId: mockSiteId,
        };

        await expect(securityTestingService.createSecurityScan(scanData)).rejects.toThrow(
          "Tool 'INVALID_TOOL' is not available or not properly configured"
        );

        expect(securityTestingService['validateToolsAvailable']).toHaveBeenCalledWith(['INVALID_TOOL']);
        expect(prisma.securityScan.create).not.toHaveBeenCalled();
      });

      it('should validate scan targets before creation', async () => {
        securityTestingService['validateToolsAvailable'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['validateScanTargets'] = jest.fn().mockRejectedValue(
          new Error('Invalid URL target: invalid-url')
        );

        const scanData = {
          name: 'Invalid Target Scan',
          scanType: 'PENETRATION' as const,
          targets: [{ type: 'URL' as const, value: 'invalid-url' }],
          tools: ['OWASP_ZAP'],
          siteId: mockSiteId,
        };

        await expect(securityTestingService.createSecurityScan(scanData)).rejects.toThrow('Invalid URL target');

        expect(securityTestingService['validateScanTargets']).toHaveBeenCalledWith(scanData.targets);
        expect(prisma.securityScan.create).not.toHaveBeenCalled();
      });
    });

    describe('Scan Execution', () => {
      it('should execute penetration scan with multiple tools', async () => {
        const mockScan = {
          id: mockScanId,
          name: 'Penetration Test',
          scanType: 'PENETRATION',
          targets: [{ type: 'URL', value: 'https://target.com' }],
          tools: ['OWASP_ZAP', 'NMAP'],
          configuration: { depth: 'STANDARD' },
          status: 'PENDING',
          siteId: mockSiteId,
        };

        // Mock service methods
        securityTestingService['getScanById'] = jest.fn().mockResolvedValue(mockScan);
        securityTestingService['updateScanStatus'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['runScanWithTools'] = jest.fn().mockResolvedValue({
          vulnerabilities: [
            {
              title: 'SQL Injection Vulnerability',
              description: 'SQL injection found in login form',
              severity: 'HIGH',
              category: 'Injection',
              affected_component: '/login',
              remediation: {
                recommendation: 'Use parameterized queries',
                effort: 'MEDIUM',
                priority: 'HIGH',
                fix_available: true,
              },
            },
            {
              title: 'XSS Vulnerability',
              description: 'Cross-site scripting in search results',
              severity: 'MEDIUM',
              category: 'XSS',
              affected_component: '/search',
              remediation: {
                recommendation: 'Implement output encoding',
                effort: 'LOW',
                priority: 'MEDIUM',
                fix_available: true,
              },
            },
          ],
          tool_outputs: {
            OWASP_ZAP: { scan_duration: 300, findings: 15 },
            NMAP: { scan_duration: 120, open_ports: 3 },
          },
          compliance_results: {
            OWASP_TOP_10_2021: { score: 75, violations: ['A03_Injection'] },
          },
        });
        securityTestingService['processScanResults'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['sendScanNotifications'] = jest.fn().mockResolvedValue(undefined);

        await securityTestingService.executeScan(mockScanId);

        expect(securityTestingService['getScanById']).toHaveBeenCalledWith(mockScanId);
        expect(securityTestingService['updateScanStatus']).toHaveBeenCalledWith(mockScanId, 'RUNNING', 0);
        expect(securityTestingService['runScanWithTools']).toHaveBeenCalledWith(mockScan);
        expect(securityTestingService['processScanResults']).toHaveBeenCalled();
        expect(securityTestingService['updateScanStatus']).toHaveBeenCalledWith(mockScanId, 'COMPLETED', 100);
        expect(securityTestingService['sendScanNotifications']).toHaveBeenCalled();

        expect(auditService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'SECURITY',
            eventType: 'SECURITY_SCAN_STARTED',
            severity: 'MEDIUM',
          })
        );
      });

      it('should handle scan execution failure gracefully', async () => {
        const mockScan = {
          id: mockScanId,
          scanType: 'PENETRATION',
          siteId: mockSiteId,
        };

        securityTestingService['getScanById'] = jest.fn().mockResolvedValue(mockScan);
        securityTestingService['updateScanStatus'] = jest.fn().mockResolvedValue(undefined);
        securityTestingService['runScanWithTools'] = jest.fn().mockRejectedValue(
          new Error('Tool execution failed')
        );

        await expect(securityTestingService.executeScan(mockScanId)).rejects.toThrow('Scan execution failed');

        expect(securityTestingService['updateScanStatus']).toHaveBeenCalledWith(mockScanId, 'FAILED', 0);
      });

      it('should handle missing scan gracefully', async () => {
        securityTestingService['getScanById'] = jest.fn().mockResolvedValue(null);

        await expect(securityTestingService.executeScan('nonexistent-scan')).rejects.toThrow('Scan not found');
      });
    });
  });

  describe('Vulnerability Management', () => {
    describe('Vulnerability Processing', () => {
      it('should process and store scan vulnerabilities', async () => {
        const mockScan = {
          id: mockScanId,
          siteId: mockSiteId,
        };

        const mockResults = {
          vulnerabilities: [
            {
              title: 'Critical SQL Injection',
              description: 'SQL injection in user authentication',
              severity: 'CRITICAL',
              category: 'Injection',
              cwe_id: 'CWE-89',
              cve_id: 'CVE-2024-12345',
              owasp_category: 'A03_Injection',
              affected_component: '/api/auth/login',
              location: {
                file_path: 'src/auth/login.js',
                line_number: 45,
                parameter: 'username',
              },
              evidence: {
                request: 'POST /api/auth/login',
                response: 'SQL error: syntax error',
                proof_of_concept: "' OR 1=1 --",
              },
              remediation: {
                recommendation: 'Use parameterized queries and input validation',
                effort: 'MEDIUM',
                priority: 'CRITICAL',
                fix_available: true,
              },
              metadata: { tool: 'SQLMAP', confidence: 'HIGH' },
            },
          ],
        };

        // Mock vulnerability creation
        (prisma.vulnerability.create as jest.Mock).mockResolvedValue({
          id: 'vuln-123',
          scanId: mockScanId,
          title: 'Critical SQL Injection',
          severity: 'CRITICAL',
          riskScore: 10,
          discoveredAt: new Date(),
          status: 'OPEN',
        });

        // Mock scan update
        (prisma.securityScan.update as jest.Mock).mockResolvedValue({
          id: mockScanId,
          vulnerabilitiesFound: 1,
          criticalFindings: 1,
        });

        securityTestingService['calculateVulnerabilityRiskScore'] = jest.fn().mockReturnValue(10);

        await securityTestingService['processScanResults'](mockScan, mockResults);

        expect(prisma.vulnerability.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              scanId: mockScanId,
              title: 'Critical SQL Injection',
              severity: 'CRITICAL',
              category: 'Injection',
              cwe_id: 'CWE-89',
              cve_id: 'CVE-2024-12345',
              owasp_category: 'A03_Injection',
              affected_component: '/api/auth/login',
              status: 'OPEN',
              riskScore: 10,
            }),
          })
        );

        expect(prisma.securityScan.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockScanId },
            data: expect.objectContaining({
              vulnerabilitiesFound: 1,
              criticalFindings: 1,
            }),
          })
        );
      });

      it('should calculate vulnerability risk scores correctly', async () => {
        const criticalVuln = { severity: 'CRITICAL', category: 'Injection' };
        const mediumVuln = { severity: 'MEDIUM', category: 'XSS' };
        const lowVuln = { severity: 'LOW', category: 'Information Disclosure' };

        const criticalScore = securityTestingService['calculateVulnerabilityRiskScore'](criticalVuln);
        const mediumScore = securityTestingService['calculateVulnerabilityRiskScore'](mediumVuln);
        const lowScore = securityTestingService['calculateVulnerabilityRiskScore'](lowVuln);

        expect(criticalScore).toBeGreaterThan(mediumScore);
        expect(mediumScore).toBeGreaterThan(lowScore);
        expect(criticalScore).toBe(10); // Based on config
        expect(lowScore).toBe(4); // Based on config
      });
    });
  });

  describe('Compliance Assessment', () => {
    describe('Assessment Creation', () => {
      it('should create OWASP Top 10 compliance assessment', async () => {
        // Mock database creation
        (prisma.complianceAssessment.create as jest.Mock).mockResolvedValue({
          id: mockAssessmentId,
          framework: 'OWASP_TOP_10_2021',
          scope: {
            siteIds: [mockSiteId],
            assessmentType: 'AUTOMATED',
            includeManualReview: false,
          },
          configuration: {
            depth: 'STANDARD',
            evidenceCollection: true,
            reportFormat: 'TECHNICAL',
            includeRemediation: true,
          },
          status: 'PLANNING',
          progress: 0,
          overallScore: 0,
          complianceStatus: 'NOT_ASSESSED',
          results: {
            requirements: [],
            summary: {
              totalRequirements: 0,
              passedRequirements: 0,
              failedRequirements: 0,
              partialRequirements: 0,
              notTestedRequirements: 0,
            },
            riskLevel: 'MEDIUM',
            complianceGaps: [],
            nextSteps: [],
          },
          evidence: [],
          assessor: 'SYSTEM',
          metadata: { requestedBy: mockUserId },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock validation
        complianceValidationService['validateAssessmentScope'] = jest.fn().mockResolvedValue(undefined);

        const assessmentData = {
          framework: 'OWASP_TOP_10_2021' as const,
          scope: {
            siteIds: [mockSiteId],
            assessmentType: 'AUTOMATED' as const,
            includeManualReview: false,
          },
          configuration: {
            depth: 'STANDARD' as const,
            evidenceCollection: true,
            reportFormat: 'TECHNICAL' as const,
            includeRemediation: true,
          },
          metadata: { requestedBy: mockUserId },
        };

        const result = await complianceValidationService.createComplianceAssessment(assessmentData);

        expect(result.id).toBe(mockAssessmentId);
        expect(result.framework).toBe('OWASP_TOP_10_2021');
        expect(result.scope.siteIds).toContain(mockSiteId);
        expect(result.scope.assessmentType).toBe('AUTOMATED');
        expect(result.configuration.depth).toBe('STANDARD');
        expect(result.status).toBe('PLANNING');
        expect(result.progress).toBe(0);
        expect(result.complianceStatus).toBe('NOT_ASSESSED');

        expect(complianceValidationService['validateAssessmentScope']).toHaveBeenCalledWith(assessmentData);

        expect(prisma.complianceAssessment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              framework: 'OWASP_TOP_10_2021',
              status: 'PLANNING',
              progress: 0,
            }),
          })
        );

        expect(auditService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'COMPLIANCE',
            eventType: 'COMPLIANCE_ASSESSMENT_CREATED',
            severity: 'MEDIUM',
          })
        );
      });

      it('should create NIST CSF compliance assessment with custom scope', async () => {
        (prisma.complianceAssessment.create as jest.Mock).mockResolvedValue({
          id: 'assessment-nist-123',
          framework: 'NIST_CSF',
          scope: {
            siteIds: [mockSiteId],
            assessmentType: 'HYBRID',
            includeManualReview: true,
            requirements: ['IDENTIFY', 'PROTECT'],
          },
          configuration: {
            depth: 'COMPREHENSIVE',
            evidenceCollection: true,
            reportFormat: 'EXECUTIVE',
            includeRemediation: true,
          },
          status: 'PLANNING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        complianceValidationService['validateAssessmentScope'] = jest.fn().mockResolvedValue(undefined);

        const assessmentData = {
          framework: 'NIST_CSF' as const,
          scope: {
            siteIds: [mockSiteId],
            assessmentType: 'HYBRID' as const,
            includeManualReview: true,
            requirements: ['IDENTIFY', 'PROTECT'],
          },
          configuration: {
            depth: 'COMPREHENSIVE' as const,
            evidenceCollection: true,
            reportFormat: 'EXECUTIVE' as const,
            includeRemediation: true,
          },
        };

        const result = await complianceValidationService.createComplianceAssessment(assessmentData);

        expect(result.framework).toBe('NIST_CSF');
        expect(result.scope.assessmentType).toBe('HYBRID');
        expect(result.scope.includeManualReview).toBe(true);
        expect(result.scope.requirements).toContain('IDENTIFY');
        expect(result.scope.requirements).toContain('PROTECT');
        expect(result.configuration.depth).toBe('COMPREHENSIVE');
        expect(result.configuration.reportFormat).toBe('EXECUTIVE');
      });

      it('should validate assessment scope before creation', async () => {
        complianceValidationService['validateAssessmentScope'] = jest.fn().mockRejectedValue(
          new Error('One or more sites not found')
        );

        const assessmentData = {
          framework: 'OWASP_TOP_10_2021' as const,
          scope: {
            siteIds: ['nonexistent-site'],
            assessmentType: 'AUTOMATED' as const,
          },
        };

        await expect(complianceValidationService.createComplianceAssessment(assessmentData)).rejects.toThrow(
          'One or more sites not found'
        );

        expect(complianceValidationService['validateAssessmentScope']).toHaveBeenCalledWith(assessmentData);
        expect(prisma.complianceAssessment.create).not.toHaveBeenCalled();
      });
    });

    describe('Assessment Execution', () => {
      it('should execute OWASP Top 10 assessment with all requirements', async () => {
        const mockAssessment = {
          id: mockAssessmentId,
          framework: 'OWASP_TOP_10_2021',
          scope: {
            siteIds: [mockSiteId],
            assessmentType: 'AUTOMATED',
          },
          configuration: {
            depth: 'STANDARD',
          },
        };

        // Mock framework requirements
        const mockFramework = {
          name: 'OWASP Top 10 (2021)',
          requirements: [
            {
              id: 'A01',
              name: 'Broken Access Control',
              tests: ['access_control_testing', 'privilege_escalation_testing'],
              weight: 10,
            },
            {
              id: 'A02',
              name: 'Cryptographic Failures',
              tests: ['encryption_testing', 'tls_testing'],
              weight: 9,
            },
          ],
        };

        complianceValidationService['activeAssessments'].set(mockAssessmentId, mockAssessment as any);
        complianceValidationService['updateAssessmentStatus'] = jest.fn().mockResolvedValue(undefined);
        complianceValidationService['executeFrameworkTests'] = jest.fn().mockResolvedValue({
          requirements: [
            {
              id: 'A01',
              name: 'Broken Access Control',
              score: 85,
              status: 'PARTIAL',
              findings: ['Some access control weaknesses found'],
              evidence: ['scan-report-a01.json'],
              recommendations: ['Implement role-based access control'],
            },
            {
              id: 'A02',
              name: 'Cryptographic Failures',
              score: 95,
              status: 'PASS',
              findings: [],
              evidence: ['tls-scan-report.json'],
              recommendations: [],
            },
          ],
          summary: {
            totalRequirements: 2,
            passedRequirements: 1,
            failedRequirements: 0,
            partialRequirements: 1,
            notTestedRequirements: 0,
          },
          riskLevel: 'MEDIUM',
          complianceGaps: ['Access control improvements needed'],
          nextSteps: ['Implement recommended security controls'],
        });

        complianceValidationService['calculateOverallScore'] = jest.fn().mockReturnValue(90);
        complianceValidationService['determineComplianceStatus'] = jest.fn().mockReturnValue('COMPLIANT');
        complianceValidationService['updateAssessmentResults'] = jest.fn().mockResolvedValue(undefined);
        complianceValidationService['generateComplianceReport'] = jest.fn().mockResolvedValue(undefined);

        await complianceValidationService.executeAssessment(mockAssessmentId);

        expect(complianceValidationService['updateAssessmentStatus']).toHaveBeenCalledWith(mockAssessmentId, 'RUNNING', 0);
        expect(complianceValidationService['executeFrameworkTests']).toHaveBeenCalledWith(mockAssessment, expect.any(Object));
        expect(complianceValidationService['calculateOverallScore']).toHaveBeenCalled();
        expect(complianceValidationService['determineComplianceStatus']).toHaveBeenCalledWith(90);
        expect(complianceValidationService['updateAssessmentResults']).toHaveBeenCalledWith(
          mockAssessmentId,
          expect.any(Object),
          90,
          'COMPLIANT'
        );
        expect(complianceValidationService['generateComplianceReport']).toHaveBeenCalledWith(mockAssessment);
        expect(complianceValidationService['updateAssessmentStatus']).toHaveBeenCalledWith(mockAssessmentId, 'COMPLETED', 100);
      });

      it('should handle assessment execution failure', async () => {
        const mockAssessment = {
          id: mockAssessmentId,
          framework: 'INVALID_FRAMEWORK',
        };

        complianceValidationService['activeAssessments'].set(mockAssessmentId, mockAssessment as any);
        complianceValidationService['updateAssessmentStatus'] = jest.fn().mockResolvedValue(undefined);

        await expect(complianceValidationService.executeAssessment(mockAssessmentId)).rejects.toThrow('Assessment execution failed');

        expect(complianceValidationService['updateAssessmentStatus']).toHaveBeenCalledWith(mockAssessmentId, 'FAILED', 0);
      });
    });

    describe('Evidence Management', () => {
      it('should submit compliance evidence successfully', async () => {
        // Mock database creation
        (prisma.complianceEvidence.create as jest.Mock).mockResolvedValue({
          id: 'evidence-123',
          assessmentId: mockAssessmentId,
          requirementId: 'A01',
          evidenceType: 'SCAN_REPORT',
          title: 'Access Control Test Results',
          description: 'Penetration testing results for access control mechanisms',
          filePath: '/evidence/access-control-scan.json',
          content: null,
          verificationStatus: 'PENDING',
          metadata: { scanId: mockScanId, tool: 'OWASP_ZAP' },
          createdAt: new Date(),
        });

        const evidenceData = {
          assessmentId: mockAssessmentId,
          requirementId: 'A01',
          evidenceType: 'SCAN_REPORT' as const,
          title: 'Access Control Test Results',
          description: 'Penetration testing results for access control mechanisms',
          filePath: '/evidence/access-control-scan.json',
          metadata: { scanId: mockScanId, tool: 'OWASP_ZAP' },
        };

        const result = await complianceValidationService.submitEvidence(evidenceData);

        expect(result.id).toBe('evidence-123');
        expect(result.assessmentId).toBe(mockAssessmentId);
        expect(result.requirementId).toBe('A01');
        expect(result.evidenceType).toBe('SCAN_REPORT');
        expect(result.title).toBe('Access Control Test Results');
        expect(result.verificationStatus).toBe('PENDING');
        expect(result.metadata.scanId).toBe(mockScanId);

        expect(prisma.complianceEvidence.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              assessmentId: mockAssessmentId,
              requirementId: 'A01',
              evidenceType: 'SCAN_REPORT',
              title: 'Access Control Test Results',
              verificationStatus: 'PENDING',
            }),
          })
        );
      });

      it('should validate evidence data before submission', async () => {
        const invalidEvidenceData = {
          assessmentId: '',
          requirementId: 'A01',
          evidenceType: 'INVALID_TYPE' as any,
          title: 'ab', // Too short
          description: 'Invalid evidence',
        };

        await expect(complianceValidationService.submitEvidence(invalidEvidenceData)).rejects.toThrow();
      });
    });
  });

  describe('Security Testing Metrics', () => {
    describe('Metrics Calculation', () => {
      it('should calculate comprehensive security testing metrics', async () => {
        const timeRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        };

        // Mock database counts
        (prisma.securityScan.count as jest.Mock)
          .mockResolvedValueOnce(50) // total scans
          .mockResolvedValueOnce(3)  // active scans
          .mockResolvedValueOnce(45) // completed scans
          .mockResolvedValueOnce(2); // failed scans

        (prisma.vulnerability.count as jest.Mock).mockResolvedValue(127); // total vulnerabilities

        // Mock service methods
        securityTestingService['getVulnerabilitiesBySeverity'] = jest.fn().mockResolvedValue({
          CRITICAL: 8,
          HIGH: 23,
          MEDIUM: 45,
          LOW: 35,
          INFO: 16,
        });

        securityTestingService['getVulnerabilitiesByCategory'] = jest.fn().mockResolvedValue({
          'Injection': 25,
          'Broken Access Control': 18,
          'Security Misconfiguration': 15,
          'Vulnerable Components': 12,
          'XSS': 10,
        });

        securityTestingService['calculateAverageScanDuration'] = jest.fn().mockResolvedValue(847); // seconds
        securityTestingService['calculateComplianceScores'] = jest.fn().mockResolvedValue({
          OWASP_TOP_10_2021: 87,
          CIS_CONTROLS_V8: 82,
          NIST_CSF: 85,
        });

        securityTestingService['calculateRiskTrends'] = jest.fn().mockResolvedValue([
          { date: new Date('2024-01-01'), riskScore: 7.5, vulnerabilityCount: 150, criticalCount: 12 },
          { date: new Date('2024-01-15'), riskScore: 6.8, vulnerabilityCount: 135, criticalCount: 10 },
          { date: new Date('2024-01-31'), riskScore: 6.2, vulnerabilityCount: 127, criticalCount: 8 },
        ]);

        securityTestingService['calculateToolEffectiveness'] = jest.fn().mockResolvedValue({
          OWASP_ZAP: {
            scansRun: 35,
            vulnerabilitiesFound: 78,
            falsePositiveRate: 0.12,
            averageDuration: 1200,
          },
          NMAP: {
            scansRun: 40,
            vulnerabilitiesFound: 25,
            falsePositiveRate: 0.05,
            averageDuration: 300,
          },
          SQLMAP: {
            scansRun: 15,
            vulnerabilitiesFound: 12,
            falsePositiveRate: 0.08,
            averageDuration: 900,
          },
        });

        securityTestingService['getComplianceStatus'] = jest.fn().mockResolvedValue({
          OWASP_TOP_10_2021: {
            score: 87,
            requirements_met: 8,
            total_requirements: 10,
            last_assessment: new Date('2024-01-15'),
          },
          CIS_CONTROLS_V8: {
            score: 82,
            requirements_met: 5,
            total_requirements: 6,
            last_assessment: new Date('2024-01-10'),
          },
        });

        const result = await securityTestingService.getSecurityTestingMetrics(mockSiteId, timeRange);

        expect(result.totalScans).toBe(50);
        expect(result.activeScans).toBe(3);
        expect(result.completedScans).toBe(45);
        expect(result.failedScans).toBe(2);
        expect(result.totalVulnerabilities).toBe(127);

        expect(result.vulnerabilitiesBySeverity.CRITICAL).toBe(8);
        expect(result.vulnerabilitiesBySeverity.HIGH).toBe(23);
        expect(result.vulnerabilitiesBySeverity.MEDIUM).toBe(45);

        expect(result.vulnerabilitiesByCategory['Injection']).toBe(25);
        expect(result.vulnerabilitiesByCategory['Broken Access Control']).toBe(18);

        expect(result.averageScanDuration).toBe(847);

        expect(result.complianceScores.OWASP_TOP_10_2021).toBe(87);
        expect(result.complianceScores.CIS_CONTROLS_V8).toBe(82);

        expect(result.riskTrends).toHaveLength(3);
        expect(result.riskTrends[0].riskScore).toBe(7.5);
        expect(result.riskTrends[2].riskScore).toBe(6.2);

        expect(result.toolEffectiveness.OWASP_ZAP.scansRun).toBe(35);
        expect(result.toolEffectiveness.OWASP_ZAP.vulnerabilitiesFound).toBe(78);
        expect(result.toolEffectiveness.OWASP_ZAP.falsePositiveRate).toBe(0.12);

        expect(result.complianceStatus.OWASP_TOP_10_2021.score).toBe(87);
        expect(result.complianceStatus.CIS_CONTROLS_V8.requirements_met).toBe(5);
      });

      it('should handle metrics calculation with no data', async () => {
        // Mock empty database responses
        (prisma.securityScan.count as jest.Mock).mockResolvedValue(0);
        (prisma.vulnerability.count as jest.Mock).mockResolvedValue(0);

        securityTestingService['getVulnerabilitiesBySeverity'] = jest.fn().mockResolvedValue({});
        securityTestingService['getVulnerabilitiesByCategory'] = jest.fn().mockResolvedValue({});
        securityTestingService['calculateAverageScanDuration'] = jest.fn().mockResolvedValue(0);
        securityTestingService['calculateComplianceScores'] = jest.fn().mockResolvedValue({});
        securityTestingService['calculateRiskTrends'] = jest.fn().mockResolvedValue([]);
        securityTestingService['calculateToolEffectiveness'] = jest.fn().mockResolvedValue({});
        securityTestingService['getComplianceStatus'] = jest.fn().mockResolvedValue({});

        const result = await securityTestingService.getSecurityTestingMetrics(mockSiteId);

        expect(result.totalScans).toBe(0);
        expect(result.totalVulnerabilities).toBe(0);
        expect(result.averageScanDuration).toBe(0);
        expect(result.riskTrends).toHaveLength(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete security testing lifecycle', async () => {
      // 1. Create security scan
      (prisma.securityScan.create as jest.Mock).mockResolvedValue({
        id: 'integration-scan-123',
        name: 'Integration Test Scan',
        scanType: 'COMPREHENSIVE',
        tools: ['OWASP_ZAP', 'NMAP', 'SQLMAP'],
        status: 'PENDING',
        siteId: mockSiteId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      securityTestingService['validateToolsAvailable'] = jest.fn().mockResolvedValue(undefined);
      securityTestingService['validateScanTargets'] = jest.fn().mockResolvedValue(undefined);
      securityTestingService['queueScan'] = jest.fn().mockResolvedValue(undefined);

      const scan = await securityTestingService.createSecurityScan({
        name: 'Integration Test Scan',
        scanType: 'COMPREHENSIVE',
        targets: [{ type: 'URL', value: 'https://test.com' }],
        tools: ['OWASP_ZAP', 'NMAP', 'SQLMAP'],
        siteId: mockSiteId,
      });

      expect(scan.id).toBe('integration-scan-123');

      // 2. Execute scan
      const mockScanData = {
        id: 'integration-scan-123',
        tools: ['OWASP_ZAP', 'NMAP', 'SQLMAP'],
        siteId: mockSiteId,
      };

      securityTestingService['getScanById'] = jest.fn().mockResolvedValue(mockScanData);
      securityTestingService['updateScanStatus'] = jest.fn().mockResolvedValue(undefined);
      securityTestingService['runScanWithTools'] = jest.fn().mockResolvedValue({
        vulnerabilities: [
          {
            title: 'Test Vulnerability',
            severity: 'HIGH',
            category: 'Injection',
            affected_component: '/test',
            remediation: { recommendation: 'Fix', effort: 'LOW', priority: 'HIGH', fix_available: true },
          },
        ],
        tool_outputs: {},
      });
      securityTestingService['processScanResults'] = jest.fn().mockResolvedValue(undefined);
      securityTestingService['sendScanNotifications'] = jest.fn().mockResolvedValue(undefined);

      await securityTestingService.executeScan('integration-scan-123');

      // 3. Create compliance assessment
      (prisma.complianceAssessment.create as jest.Mock).mockResolvedValue({
        id: 'integration-assessment-123',
        framework: 'OWASP_TOP_10_2021',
        scope: { siteIds: [mockSiteId] },
        status: 'PLANNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      complianceValidationService['validateAssessmentScope'] = jest.fn().mockResolvedValue(undefined);

      const assessment = await complianceValidationService.createComplianceAssessment({
        framework: 'OWASP_TOP_10_2021',
        scope: { siteIds: [mockSiteId], assessmentType: 'AUTOMATED' },
      });

      expect(assessment.id).toBe('integration-assessment-123');

      // 4. Submit evidence
      (prisma.complianceEvidence.create as jest.Mock).mockResolvedValue({
        id: 'integration-evidence-123',
        assessmentId: 'integration-assessment-123',
        requirementId: 'A03',
        evidenceType: 'SCAN_REPORT',
        title: 'Injection Test Results',
        createdAt: new Date(),
      });

      const evidence = await complianceValidationService.submitEvidence({
        assessmentId: 'integration-assessment-123',
        requirementId: 'A03',
        evidenceType: 'SCAN_REPORT',
        title: 'Injection Test Results',
        description: 'Results from SQL injection testing',
      });

      expect(evidence.id).toBe('integration-evidence-123');

      // Verify all components worked together
      expect(prisma.securityScan.create).toHaveBeenCalled();
      expect(securityTestingService['runScanWithTools']).toHaveBeenCalled();
      expect(prisma.complianceAssessment.create).toHaveBeenCalled();
      expect(prisma.complianceEvidence.create).toHaveBeenCalled();
      expect(auditService.logAuditEvent).toHaveBeenCalledTimes(2); // Scan + Assessment creation
    });
  });
});

// Helper functions for test setup
function createMockSecurityScan(overrides: any = {}) {
  return {
    id: 'scan-test-123',
    name: 'Test Security Scan',
    scanType: 'PENETRATION',
    targets: [{ type: 'URL', value: 'https://test.com' }],
    tools: ['OWASP_ZAP'],
    configuration: { depth: 'STANDARD' },
    status: 'PENDING',
    progress: 0,
    vulnerabilitiesFound: 0,
    criticalFindings: 0,
    siteId: 'site-123',
    createdBy: 'SYSTEM',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockVulnerability(overrides: any = {}) {
  return {
    id: 'vuln-test-123',
    scanId: 'scan-123',
    title: 'Test Vulnerability',
    description: 'Test vulnerability description',
    severity: 'MEDIUM',
    category: 'Test Category',
    affected_component: '/test',
    remediation: {
      recommendation: 'Fix the vulnerability',
      effort: 'MEDIUM',
      priority: 'MEDIUM',
      fix_available: true,
    },
    status: 'OPEN',
    riskScore: 6,
    discoveredAt: new Date(),
    lastUpdated: new Date(),
    metadata: {},
    ...overrides,
  };
}

function createMockComplianceAssessment(overrides: any = {}) {
  return {
    id: 'assessment-test-123',
    framework: 'OWASP_TOP_10_2021',
    scope: {
      siteIds: ['site-123'],
      assessmentType: 'AUTOMATED',
      includeManualReview: false,
    },
    configuration: {
      depth: 'STANDARD',
      evidenceCollection: true,
      reportFormat: 'TECHNICAL',
      includeRemediation: true,
    },
    status: 'PLANNING',
    progress: 0,
    overallScore: 0,
    complianceStatus: 'NOT_ASSESSED',
    results: {
      requirements: [],
      summary: {},
      riskLevel: 'MEDIUM',
      complianceGaps: [],
      nextSteps: [],
    },
    evidence: [],
    assessor: 'SYSTEM',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
} 