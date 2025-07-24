import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AdvancedAccessControlService } from '../../../lib/security/access-control/access-control-service';
import { AccessControlMonitoringService } from '../../../lib/security/access-control/monitoring-service';

// Mock dependencies
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    permission: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    role: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    accessPolicy: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    accessRequest: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    accessMonitoringRule: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    accessAlert: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    accessReview: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    accessReport: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userSession: {
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

jest.mock('../../../lib/security/monitoring/alerting-service', () => ({
  alertingService: {
    sendNotification: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { siemService } from '../../../lib/security/monitoring/siem-service';
import { alertingService } from '../../../lib/security/monitoring/alerting-service';

describe('Advanced Access Control System', () => {
  let accessControlService: AdvancedAccessControlService;
  let monitoringService: AccessControlMonitoringService;

  const mockUserId = 'user-123';
  const mockSiteId = 'site-123';
  const mockPermissionId = 'perm-123';
  const mockRoleId = 'role-123';
  const mockPolicyId = 'policy-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instances
    accessControlService = new AdvancedAccessControlService();
    monitoringService = new AccessControlMonitoringService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Permission Management', () => {
    describe('Permission Creation', () => {
      it('should create fine-grained permission successfully', async () => {
        // Mock database creation
        (prisma.permission.create as jest.Mock).mockResolvedValue({
          id: mockPermissionId,
          name: 'content:create:article',
          description: 'Permission to create articles',
          resource: 'content',
          action: 'create',
          conditions: [
            {
              attribute: 'resource.type',
              operator: 'equals',
              value: 'article',
            },
          ],
          effect: 'PERMIT',
          priority: 100,
          active: true,
          metadata: { category: 'content' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Mock SIEM event ingestion
        (siemService.ingestEvent as jest.Mock).mockResolvedValue({
          id: 'event-123',
          eventType: 'ACCESS_CONTROL',
        });

        // Mock validation methods
        accessControlService['validatePermissionConflicts'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['clearPermissionCache'] = jest.fn().mockResolvedValue(undefined);

        const permissionData = {
          name: 'content:create:article',
          description: 'Permission to create articles',
          resource: 'content',
          action: 'create',
          conditions: [
            {
              attribute: 'resource.type',
              operator: 'equals' as const,
              value: 'article',
            },
          ],
          effect: 'PERMIT' as const,
          priority: 100,
          active: true,
          metadata: { category: 'content' },
        };

        const result = await accessControlService.createPermission(permissionData);

        expect(result.id).toBe(mockPermissionId);
        expect(result.name).toBe('content:create:article');
        expect(result.resource).toBe('content');
        expect(result.action).toBe('create');
        expect(result.effect).toBe('PERMIT');
        expect(result.conditions).toHaveLength(1);
        expect(result.conditions[0].attribute).toBe('resource.type');
        expect(result.conditions[0].operator).toBe('equals');
        expect(result.conditions[0].value).toBe('article');
        expect(result.priority).toBe(100);
        expect(result.active).toBe(true);

        expect(prisma.permission.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'content:create:article',
              resource: 'content',
              action: 'create',
              effect: 'PERMIT',
              priority: 100,
              active: true,
            }),
          })
        );

        expect(siemService.ingestEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'ACCESS_CONTROL',
            title: expect.stringContaining('Permission Created'),
          })
        );

        expect(accessControlService['validatePermissionConflicts']).toHaveBeenCalledWith(permissionData);
        expect(accessControlService['clearPermissionCache']).toHaveBeenCalled();
      });

      it('should create DENY permission for security restrictions', async () => {
        (prisma.permission.create as jest.Mock).mockResolvedValue({
          id: 'perm-deny-123',
          name: 'admin:deny:weekend',
          description: 'Deny admin access on weekends',
          resource: 'admin',
          action: '*',
          conditions: [
            {
              attribute: 'environment.day_of_week',
              operator: 'in',
              value: [0, 6], // Sunday and Saturday
            },
          ],
          effect: 'DENY',
          priority: 1000, // High priority for DENY rules
          active: true,
          metadata: { reason: 'security_policy' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        accessControlService['validatePermissionConflicts'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['clearPermissionCache'] = jest.fn().mockResolvedValue(undefined);

        const permissionData = {
          name: 'admin:deny:weekend',
          description: 'Deny admin access on weekends',
          resource: 'admin',
          action: '*',
          conditions: [
            {
              attribute: 'environment.day_of_week',
              operator: 'in' as const,
              value: [0, 6],
            },
          ],
          effect: 'DENY' as const,
          priority: 1000,
          active: true,
          metadata: { reason: 'security_policy' },
        };

        const result = await accessControlService.createPermission(permissionData);

        expect(result.effect).toBe('DENY');
        expect(result.priority).toBe(1000);
        expect(result.conditions[0].operator).toBe('in');
        expect(result.conditions[0].value).toEqual([0, 6]);
      });

      it('should validate permission data and handle errors', async () => {
        const invalidPermissionData = {
          name: 'ab', // Too short
          description: 'Invalid permission',
          resource: '',
          action: '',
          effect: 'INVALID' as any,
        };

        await expect(accessControlService.createPermission(invalidPermissionData)).rejects.toThrow();
      });
    });
  });

  describe('Role Management', () => {
    describe('Role Creation', () => {
      it('should create role with permission inheritance', async () => {
        // Mock permission validation
        accessControlService['validatePermissionsExist'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['validateRoleInheritance'] = jest.fn().mockResolvedValue(undefined);

        // Mock database creation
        (prisma.role.create as jest.Mock).mockResolvedValue({
          id: mockRoleId,
          name: 'content-editor',
          description: 'Content editor with article management permissions',
          permissions: ['content:read', 'content:create:article', 'content:update:own'],
          inheritsFrom: ['basic-user'],
          constraints: {
            maxUsers: 50,
            requiresApproval: false,
            timeRestrictions: {
              allowedHours: [9, 17],
              allowedDays: [1, 2, 3, 4, 5],
              timezone: 'UTC',
            },
          },
          assignedUsers: [],
          metadata: { department: 'editorial' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const roleData = {
          name: 'content-editor',
          description: 'Content editor with article management permissions',
          permissions: ['content:read', 'content:create:article', 'content:update:own'],
          inheritsFrom: ['basic-user'],
          constraints: {
            maxUsers: 50,
            requiresApproval: false,
            timeRestrictions: {
              allowedHours: [9, 17],
              allowedDays: [1, 2, 3, 4, 5],
              timezone: 'UTC',
            },
          },
          metadata: { department: 'editorial' },
        };

        const result = await accessControlService.createRole(roleData);

        expect(result.id).toBe(mockRoleId);
        expect(result.name).toBe('content-editor');
        expect(result.permissions).toContain('content:read');
        expect(result.permissions).toContain('content:create:article');
        expect(result.permissions).toContain('content:update:own');
        expect(result.inheritsFrom).toContain('basic-user');
        expect(result.constraints.maxUsers).toBe(50);
        expect(result.constraints.timeRestrictions?.allowedHours).toEqual([9, 17]);
        expect(result.constraints.timeRestrictions?.allowedDays).toEqual([1, 2, 3, 4, 5]);

        expect(accessControlService['validatePermissionsExist']).toHaveBeenCalledWith(roleData.permissions);
        expect(accessControlService['validateRoleInheritance']).toHaveBeenCalledWith(roleData.inheritsFrom);

        expect(prisma.role.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'content-editor',
              permissions: roleData.permissions,
              inheritsFrom: ['basic-user'],
              constraints: expect.objectContaining({
                maxUsers: 50,
                requiresApproval: false,
              }),
            }),
          })
        );
      });

      it('should create role with approval requirements', async () => {
        accessControlService['validatePermissionsExist'] = jest.fn().mockResolvedValue(undefined);

        (prisma.role.create as jest.Mock).mockResolvedValue({
          id: 'role-admin-123',
          name: 'system-administrator',
          description: 'Full system administrator with all permissions',
          permissions: ['*:*'],
          inheritsFrom: [],
          constraints: {
            maxUsers: 5,
            requiresApproval: true,
            temporaryDuration: 8, // 8 hours
            ipRestrictions: ['192.168.1.0/24'],
          },
          assignedUsers: [],
          metadata: { riskLevel: 'HIGH' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const roleData = {
          name: 'system-administrator',
          description: 'Full system administrator with all permissions',
          permissions: ['*:*'],
          constraints: {
            maxUsers: 5,
            requiresApproval: true,
            temporaryDuration: 8,
            ipRestrictions: ['192.168.1.0/24'],
          },
          metadata: { riskLevel: 'HIGH' },
        };

        const result = await accessControlService.createRole(roleData);

        expect(result.name).toBe('system-administrator');
        expect(result.permissions).toContain('*:*');
        expect(result.constraints.requiresApproval).toBe(true);
        expect(result.constraints.maxUsers).toBe(5);
        expect(result.constraints.temporaryDuration).toBe(8);
        expect(result.constraints.ipRestrictions).toContain('192.168.1.0/24');
      });

      it('should handle role validation errors', async () => {
        accessControlService['validatePermissionsExist'] = jest.fn().mockRejectedValue(new Error('Permission not found'));

        const roleData = {
          name: 'invalid-role',
          description: 'Role with invalid permissions',
          permissions: ['nonexistent:permission'],
        };

        await expect(accessControlService.createRole(roleData)).rejects.toThrow('Role creation failed');
      });
    });
  });

  describe('ABAC Policy Management', () => {
    describe('Policy Creation', () => {
      it('should create comprehensive ABAC policy', async () => {
        // Mock policy validation
        accessControlService['validatePolicySyntax'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['compilePolicyRules'] = jest.fn().mockResolvedValue(undefined);

        // Mock database creation
        (prisma.accessPolicy.create as jest.Mock).mockResolvedValue({
          id: mockPolicyId,
          name: 'business-hours-access',
          description: 'Allow access only during business hours for sensitive resources',
          target: {
            subjects: ['user'],
            resources: ['sensitive_data', 'financial_reports'],
            actions: ['read', 'update'],
            environments: ['production'],
          },
          rules: [
            {
              id: 'rule-1',
              description: 'Allow access during business hours',
              condition: 'environment.time_of_access.hour >= 9 && environment.time_of_access.hour <= 17 && subject.department == "finance"',
              effect: 'PERMIT',
              priority: 100,
              obligations: [
                {
                  type: 'LOG_ACCESS',
                  value: 'DETAILED',
                },
              ],
            },
            {
              id: 'rule-2',
              description: 'Deny access outside business hours',
              condition: 'environment.time_of_access.hour < 9 || environment.time_of_access.hour > 17',
              effect: 'DENY',
              priority: 200,
            },
          ],
          combiningAlgorithm: 'deny_overrides',
          active: true,
          effectiveDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          evaluationCount: 0,
          metadata: { compliance: 'SOX' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const policyData = {
          name: 'business-hours-access',
          description: 'Allow access only during business hours for sensitive resources',
          target: {
            subjects: ['user'],
            resources: ['sensitive_data', 'financial_reports'],
            actions: ['read', 'update'],
            environments: ['production'],
          },
          rules: [
            {
              id: 'rule-1',
              description: 'Allow access during business hours',
              condition: 'environment.time_of_access.hour >= 9 && environment.time_of_access.hour <= 17 && subject.department == "finance"',
              effect: 'PERMIT' as const,
              priority: 100,
              obligations: [
                {
                  type: 'LOG_ACCESS',
                  value: 'DETAILED',
                },
              ],
            },
            {
              id: 'rule-2',
              description: 'Deny access outside business hours',
              condition: 'environment.time_of_access.hour < 9 || environment.time_of_access.hour > 17',
              effect: 'DENY' as const,
              priority: 200,
            },
          ],
          combiningAlgorithm: 'deny_overrides' as const,
          active: true,
          effectiveDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          metadata: { compliance: 'SOX' },
        };

        const result = await accessControlService.createPolicy(policyData);

        expect(result.id).toBe(mockPolicyId);
        expect(result.name).toBe('business-hours-access');
        expect(result.target.resources).toContain('sensitive_data');
        expect(result.target.resources).toContain('financial_reports');
        expect(result.rules).toHaveLength(2);
        expect(result.rules[0].effect).toBe('PERMIT');
        expect(result.rules[1].effect).toBe('DENY');
        expect(result.rules[0].obligations).toHaveLength(1);
        expect(result.combiningAlgorithm).toBe('deny_overrides');
        expect(result.active).toBe(true);
        expect(result.effectiveDate).toBeDefined();
        expect(result.expirationDate).toBeDefined();

        expect(accessControlService['validatePolicySyntax']).toHaveBeenCalledWith(policyData);
        expect(accessControlService['compilePolicyRules']).toHaveBeenCalledWith(policyData.rules);

        expect(prisma.accessPolicy.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'business-hours-access',
              combiningAlgorithm: 'deny_overrides',
              active: true,
            }),
          })
        );
      });

      it('should create risk-based access policy', async () => {
        accessControlService['validatePolicySyntax'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['compilePolicyRules'] = jest.fn().mockResolvedValue(undefined);

        (prisma.accessPolicy.create as jest.Mock).mockResolvedValue({
          id: 'policy-risk-123',
          name: 'risk-based-access',
          description: 'Adjust access based on risk score',
          target: {
            subjects: ['*'],
            resources: ['*'],
            actions: ['*'],
          },
          rules: [
            {
              id: 'low-risk-rule',
              description: 'Allow low-risk access',
              condition: 'environment.risk_score <= 2.0',
              effect: 'PERMIT',
              priority: 100,
            },
            {
              id: 'high-risk-rule',
              description: 'Require MFA for high-risk access',
              condition: 'environment.risk_score > 6.0',
              effect: 'PERMIT',
              priority: 200,
              obligations: [
                {
                  type: 'REQUIRE_MFA',
                  value: true,
                },
                {
                  type: 'LOG_DETAILED',
                  value: true,
                },
              ],
            },
          ],
          combiningAlgorithm: 'permit_overrides',
          active: true,
          evaluationCount: 0,
          metadata: { category: 'risk_management' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const policyData = {
          name: 'risk-based-access',
          description: 'Adjust access based on risk score',
          target: {
            subjects: ['*'],
            resources: ['*'],
            actions: ['*'],
          },
          rules: [
            {
              id: 'low-risk-rule',
              description: 'Allow low-risk access',
              condition: 'environment.risk_score <= 2.0',
              effect: 'PERMIT' as const,
              priority: 100,
            },
            {
              id: 'high-risk-rule',
              description: 'Require MFA for high-risk access',
              condition: 'environment.risk_score > 6.0',
              effect: 'PERMIT' as const,
              priority: 200,
              obligations: [
                {
                  type: 'REQUIRE_MFA',
                  value: true,
                },
                {
                  type: 'LOG_DETAILED',
                  value: true,
                },
              ],
            },
          ],
          combiningAlgorithm: 'permit_overrides' as const,
          active: true,
          metadata: { category: 'risk_management' },
        };

        const result = await accessControlService.createPolicy(policyData);

        expect(result.name).toBe('risk-based-access');
        expect(result.rules[1].obligations).toHaveLength(2);
        expect(result.rules[1].obligations[0].type).toBe('REQUIRE_MFA');
        expect(result.combiningAlgorithm).toBe('permit_overrides');
      });

      it('should handle policy validation errors', async () => {
        accessControlService['validatePolicySyntax'] = jest.fn().mockRejectedValue(new Error('Invalid syntax'));

        const policyData = {
          name: 'invalid-policy',
          description: 'Policy with invalid syntax',
          target: {},
          rules: [
            {
              id: 'invalid-rule',
              description: 'Rule with invalid condition',
              condition: 'invalid syntax here',
              effect: 'PERMIT' as const,
              priority: 100,
            },
          ],
        };

        await expect(accessControlService.createPolicy(policyData)).rejects.toThrow('Policy creation failed');
      });
    });
  });

  describe('Access Evaluation', () => {
    describe('ABAC Policy Evaluation', () => {
      it('should evaluate access and return PERMIT decision', async () => {
        // Mock cache miss
        accessControlService['evaluationCache'] = new Map();

        // Mock subject attributes
        accessControlService['getSubjectAttributes'] = jest.fn().mockResolvedValue({
          user_id: mockUserId,
          role: ['content-editor'],
          department: 'editorial',
          clearance_level: 3,
          mfa_enabled: true,
          active: true,
        });

        // Mock resource attributes
        accessControlService['getResourceAttributes'] = jest.fn().mockResolvedValue({
          resource_type: 'content',
          classification: 'internal',
          sensitivity: 'medium',
        });

        // Mock applicable policies
        accessControlService['getApplicablePolicies'] = jest.fn().mockResolvedValue([
          {
            id: 'policy-content-access',
            name: 'Content Access Policy',
            rules: [
              {
                id: 'rule-1',
                effect: 'PERMIT',
                priority: 100,
              },
            ],
          },
        ]);

        // Mock policy evaluation
        accessControlService['evaluatePolicies'] = jest.fn().mockResolvedValue({
          decision: 'PERMIT',
          obligations: [
            {
              type: 'LOG_ACCESS',
              value: 'STANDARD',
            },
          ],
          appliedRules: [
            {
              policyId: 'policy-content-access',
              ruleId: 'rule-1',
              effect: 'PERMIT',
              priority: 100,
            },
          ],
        });

        accessControlService['combineDecisions'] = jest.fn().mockReturnValue({
          decision: 'PERMIT',
          obligations: [],
        });

        accessControlService['calculateRiskScore'] = jest.fn().mockResolvedValue(2.5);
        accessControlService['calculateAccessRiskScore'] = jest.fn().mockResolvedValue(2.5);
        accessControlService['updatePolicyEvaluationCounts'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['logAccessEvaluation'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['triggerAutomatedActions'] = jest.fn().mockResolvedValue(undefined);

        const evaluationData = {
          subjectId: mockUserId,
          resource: 'content/articles/123',
          action: 'read',
          environment: {
            time_of_access: new Date(),
            ip_address: '192.168.1.100',
          },
          context: {
            userAgent: 'Mozilla/5.0',
          },
        };

        const result = await accessControlService.evaluateAccess(evaluationData);

        expect(result.subjectId).toBe(mockUserId);
        expect(result.resource).toBe('content/articles/123');
        expect(result.action).toBe('read');
        expect(result.decision).toBe('PERMIT');
        expect(result.riskScore).toBe(2.5);
        expect(result.policiesEvaluated).toContain('policy-content-access');
        expect(result.appliedRules).toHaveLength(1);
        expect(result.evaluationTime).toBeGreaterThan(0);
        expect(result.timestamp).toBeDefined();
        expect(result.cached).toBe(false);

        expect(accessControlService['getSubjectAttributes']).toHaveBeenCalledWith(mockUserId);
        expect(accessControlService['getResourceAttributes']).toHaveBeenCalledWith('content/articles/123');
        expect(accessControlService['getApplicablePolicies']).toHaveBeenCalledWith('content/articles/123', 'read');
      });

      it('should evaluate access and return DENY decision', async () => {
        accessControlService['evaluationCache'] = new Map();

        accessControlService['getSubjectAttributes'] = jest.fn().mockResolvedValue({
          user_id: mockUserId,
          role: ['basic-user'],
          department: 'marketing',
          clearance_level: 1,
          mfa_enabled: false,
          active: true,
        });

        accessControlService['getResourceAttributes'] = jest.fn().mockResolvedValue({
          resource_type: 'financial',
          classification: 'confidential',
          sensitivity: 'high',
        });

        accessControlService['getApplicablePolicies'] = jest.fn().mockResolvedValue([
          {
            id: 'policy-financial-access',
            name: 'Financial Data Access Policy',
            rules: [
              {
                id: 'rule-deny',
                effect: 'DENY',
                priority: 200,
              },
            ],
          },
        ]);

        accessControlService['evaluatePolicies'] = jest.fn().mockResolvedValue({
          decision: 'DENY',
          obligations: [],
          appliedRules: [
            {
              policyId: 'policy-financial-access',
              ruleId: 'rule-deny',
              effect: 'DENY',
              priority: 200,
            },
          ],
        });

        accessControlService['combineDecisions'] = jest.fn().mockReturnValue({
          decision: 'DENY',
          obligations: [],
        });

        accessControlService['calculateRiskScore'] = jest.fn().mockResolvedValue(8.5);
        accessControlService['calculateAccessRiskScore'] = jest.fn().mockResolvedValue(8.5);
        accessControlService['updatePolicyEvaluationCounts'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['logAccessEvaluation'] = jest.fn().mockResolvedValue(undefined);
        accessControlService['triggerAutomatedActions'] = jest.fn().mockResolvedValue(undefined);

        const evaluationData = {
          subjectId: mockUserId,
          resource: 'financial/reports/quarterly',
          action: 'read',
          environment: {
            time_of_access: new Date(),
            ip_address: '10.0.0.50',
          },
        };

        const result = await accessControlService.evaluateAccess(evaluationData);

        expect(result.decision).toBe('DENY');
        expect(result.riskScore).toBe(8.5);
        expect(result.appliedRules[0].effect).toBe('DENY');
      });

      it('should use cached evaluation results', async () => {
        const cachedEvaluation = {
          id: 'cached-eval-123',
          subjectId: mockUserId,
          resource: 'content/articles/123',
          action: 'read',
          decision: 'PERMIT',
          riskScore: 2.0,
          cached: true,
          cacheExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes future
          timestamp: new Date(),
          policiesEvaluated: ['policy-123'],
          appliedRules: [],
          obligations: [],
          evaluationTime: 5,
          environment: {},
          context: {},
        };

        accessControlService['evaluationCache'].set('eval:user-123:content/articles/123:read', cachedEvaluation as any);

        const evaluationData = {
          subjectId: mockUserId,
          resource: 'content/articles/123',
          action: 'read',
        };

        const result = await accessControlService.evaluateAccess(evaluationData);

        expect(result).toBe(cachedEvaluation);
        expect(result.cached).toBe(true);
      });
    });
  });

  describe('Access Request Management', () => {
    describe('Request Creation', () => {
      it('should create access request with risk assessment', async () => {
        // Mock risk calculation
        accessControlService['calculateRequestRiskScore'] = jest.fn().mockResolvedValue(4.5);
        accessControlService['determineApprovers'] = jest.fn().mockResolvedValue(['manager-123', 'security-lead']);
        accessControlService['notifyApprovers'] = jest.fn().mockResolvedValue(undefined);

        // Mock database creation
        (prisma.accessRequest.create as jest.Mock).mockResolvedValue({
          id: 'request-123',
          requesterId: mockUserId,
          targetUserId: 'target-user-456',
          requestType: 'TEMPORARY_ELEVATION',
          resourceType: 'admin',
          resourceId: 'admin-panel',
          permissions: [],
          roles: ['admin'],
          justification: 'Need temporary admin access to investigate security incident',
          urgency: 'HIGH',
          duration: 4, // 4 hours
          status: 'PENDING',
          approvers: ['manager-123', 'security-lead'],
          approvals: [],
          auditTrail: [
            {
              action: 'REQUEST_CREATED',
              actor: mockUserId,
              timestamp: new Date(),
              details: {
                requestType: 'TEMPORARY_ELEVATION',
                urgency: 'HIGH',
              },
            },
          ],
          riskScore: 4.5,
          metadata: { incident_id: 'INC-2024-001' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const requestData = {
          requesterId: mockUserId,
          targetUserId: 'target-user-456',
          requestType: 'TEMPORARY_ELEVATION' as const,
          resourceType: 'admin',
          resourceId: 'admin-panel',
          roles: ['admin'],
          justification: 'Need temporary admin access to investigate security incident',
          urgency: 'HIGH' as const,
          duration: 4,
          metadata: { incident_id: 'INC-2024-001' },
        };

        const result = await accessControlService.createAccessRequest(requestData);

        expect(result.id).toBe('request-123');
        expect(result.requesterId).toBe(mockUserId);
        expect(result.targetUserId).toBe('target-user-456');
        expect(result.requestType).toBe('TEMPORARY_ELEVATION');
        expect(result.urgency).toBe('HIGH');
        expect(result.duration).toBe(4);
        expect(result.status).toBe('PENDING');
        expect(result.approvers).toContain('manager-123');
        expect(result.approvers).toContain('security-lead');
        expect(result.riskScore).toBe(4.5);
        expect(result.auditTrail).toHaveLength(1);
        expect(result.auditTrail[0].action).toBe('REQUEST_CREATED');

        expect(accessControlService['calculateRequestRiskScore']).toHaveBeenCalledWith(requestData);
        expect(accessControlService['determineApprovers']).toHaveBeenCalledWith(requestData);
        expect(accessControlService['notifyApprovers']).toHaveBeenCalledWith(result);

        expect(siemService.ingestEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'ACCESS_REQUEST',
            severity: 'MEDIUM', // High risk score
            title: expect.stringContaining('Access Request Created'),
          })
        );
      });

      it('should create role assignment request', async () => {
        accessControlService['calculateRequestRiskScore'] = jest.fn().mockResolvedValue(2.0);
        accessControlService['determineApprovers'] = jest.fn().mockResolvedValue(['hr-manager']);
        accessControlService['notifyApprovers'] = jest.fn().mockResolvedValue(undefined);

        (prisma.accessRequest.create as jest.Mock).mockResolvedValue({
          id: 'request-role-123',
          requesterId: mockUserId,
          requestType: 'ROLE',
          resourceType: 'user_role',
          roles: ['content-editor', 'media-manager'],
          justification: 'New team member needs content and media management access',
          urgency: 'MEDIUM',
          status: 'PENDING',
          approvers: ['hr-manager'],
          approvals: [],
          riskScore: 2.0,
          auditTrail: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const requestData = {
          requesterId: mockUserId,
          requestType: 'ROLE' as const,
          resourceType: 'user_role',
          roles: ['content-editor', 'media-manager'],
          justification: 'New team member needs content and media management access',
          urgency: 'MEDIUM' as const,
        };

        const result = await accessControlService.createAccessRequest(requestData);

        expect(result.requestType).toBe('ROLE');
        expect(result.roles).toContain('content-editor');
        expect(result.roles).toContain('media-manager');
        expect(result.riskScore).toBe(2.0);
        expect(result.approvers).toContain('hr-manager');
      });

      it('should validate request data and handle errors', async () => {
        const invalidRequestData = {
          requesterId: '',
          requestType: 'INVALID' as any,
          resourceType: '',
          justification: 'short', // Too short
        };

        await expect(accessControlService.createAccessRequest(invalidRequestData)).rejects.toThrow();
      });
    });
  });

  describe('Access Control Monitoring', () => {
    describe('Monitoring Rule Creation', () => {
      it('should create behavioral monitoring rule', async () => {
        // Mock rule validation
        monitoringService['validateRuleConditions'] = jest.fn().mockResolvedValue(undefined);

        // Mock database creation
        (prisma.accessMonitoringRule.create as jest.Mock).mockResolvedValue({
          id: 'rule-behavioral-123',
          name: 'unusual-access-pattern',
          description: 'Detect unusual access patterns based on user behavior',
          ruleType: 'BEHAVIORAL',
          conditions: [
            {
              field: 'access_time.hour',
              operator: 'not_in',
              value: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
              weight: 0.4,
            },
            {
              field: 'location.country',
              operator: 'not_equals',
              value: 'US',
              weight: 0.6,
            },
          ],
          threshold: 0.7,
          timeWindow: 60, // 1 hour
          severity: 'MEDIUM',
          actions: ['ALERT', 'REQUIRE_MFA'],
          enabled: true,
          triggerCount: 0,
          effectiveness: 0,
          falsePositiveRate: 0,
          metadata: { category: 'behavioral_analysis' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const ruleData = {
          name: 'unusual-access-pattern',
          description: 'Detect unusual access patterns based on user behavior',
          ruleType: 'BEHAVIORAL' as const,
          conditions: [
            {
              field: 'access_time.hour',
              operator: 'not_in' as const,
              value: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
              weight: 0.4,
            },
            {
              field: 'location.country',
              operator: 'not_equals' as const,
              value: 'US',
              weight: 0.6,
            },
          ],
          threshold: 0.7,
          timeWindow: 60,
          severity: 'MEDIUM' as const,
          actions: ['ALERT', 'REQUIRE_MFA'] as const,
          enabled: true,
          metadata: { category: 'behavioral_analysis' },
        };

        const result = await monitoringService.createMonitoringRule(ruleData);

        expect(result.id).toBe('rule-behavioral-123');
        expect(result.name).toBe('unusual-access-pattern');
        expect(result.ruleType).toBe('BEHAVIORAL');
        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0].field).toBe('access_time.hour');
        expect(result.conditions[0].operator).toBe('not_in');
        expect(result.conditions[0].weight).toBe(0.4);
        expect(result.threshold).toBe(0.7);
        expect(result.timeWindow).toBe(60);
        expect(result.severity).toBe('MEDIUM');
        expect(result.actions).toContain('ALERT');
        expect(result.actions).toContain('REQUIRE_MFA');
        expect(result.enabled).toBe(true);

        expect(monitoringService['validateRuleConditions']).toHaveBeenCalledWith(ruleData.conditions);

        expect(siemService.ingestEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'ACCESS_CONTROL',
            title: expect.stringContaining('Monitoring Rule Created'),
          })
        );
      });

      it('should create threshold monitoring rule', async () => {
        monitoringService['validateRuleConditions'] = jest.fn().mockResolvedValue(undefined);

        (prisma.accessMonitoringRule.create as jest.Mock).mockResolvedValue({
          id: 'rule-threshold-123',
          name: 'failed-login-threshold',
          description: 'Alert on multiple failed login attempts',
          ruleType: 'THRESHOLD',
          conditions: [
            {
              field: 'event_type',
              operator: 'equals',
              value: 'LOGIN_FAILED',
            },
            {
              field: 'success',
              operator: 'equals',
              value: false,
            },
          ],
          threshold: 5,
          timeWindow: 15, // 15 minutes
          severity: 'HIGH',
          actions: ['ALERT', 'BLOCK'],
          enabled: true,
          triggerCount: 0,
          effectiveness: 0,
          falsePositiveRate: 0,
          metadata: { category: 'authentication' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const ruleData = {
          name: 'failed-login-threshold',
          description: 'Alert on multiple failed login attempts',
          ruleType: 'THRESHOLD' as const,
          conditions: [
            {
              field: 'event_type',
              operator: 'equals' as const,
              value: 'LOGIN_FAILED',
            },
            {
              field: 'success',
              operator: 'equals' as const,
              value: false,
            },
          ],
          threshold: 5,
          timeWindow: 15,
          severity: 'HIGH' as const,
          actions: ['ALERT', 'BLOCK'] as const,
          enabled: true,
          metadata: { category: 'authentication' },
        };

        const result = await monitoringService.createMonitoringRule(ruleData);

        expect(result.ruleType).toBe('THRESHOLD');
        expect(result.threshold).toBe(5);
        expect(result.timeWindow).toBe(15);
        expect(result.severity).toBe('HIGH');
        expect(result.actions).toContain('BLOCK');
      });
    });

    describe('Access Event Monitoring', () => {
      it('should monitor access event and trigger alerts', async () => {
        // Mock rule evaluation
        const mockRule = {
          id: 'rule-123',
          name: 'Test Rule',
          ruleType: 'BEHAVIORAL',
          severity: 'MEDIUM',
          actions: ['ALERT'],
          enabled: true,
          conditions: [],
        };

        monitoringService['monitoringRules'].set('rule-123', mockRule as any);

        monitoringService['updateBehaviorProfile'] = jest.fn().mockResolvedValue(undefined);
        monitoringService['evaluateRule'] = jest.fn().mockResolvedValue({
          triggered: true,
          score: 0.8,
          details: { matchedConditions: 2, totalConditions: 2 },
        });

        monitoringService['createAlert'] = jest.fn().mockResolvedValue({
          id: 'alert-123',
          severity: 'MEDIUM',
          title: 'Test Rule triggered',
          status: 'OPEN',
        });

        monitoringService['executeAutomatedActions'] = jest.fn().mockResolvedValue(undefined);
        monitoringService['checkBehavioralAnomalies'] = jest.fn().mockResolvedValue([]);
        monitoringService['updateRuleEffectiveness'] = jest.fn().mockResolvedValue(undefined);

        const accessEvent = {
          eventType: 'LOGIN',
          userId: mockUserId,
          resource: 'admin-panel',
          action: 'access',
          timestamp: new Date(),
          ipAddress: '203.0.113.50', // Different country IP
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-123',
          success: true,
          riskScore: 6.5,
          metadata: { location: 'Unknown' },
        };

        const result = await monitoringService.monitorAccessEvent(accessEvent);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('alert-123');
        expect(result[0].severity).toBe('MEDIUM');

        expect(monitoringService['updateBehaviorProfile']).toHaveBeenCalledWith(mockUserId, accessEvent);
        expect(monitoringService['evaluateRule']).toHaveBeenCalledWith(mockRule, accessEvent);
        expect(monitoringService['createAlert']).toHaveBeenCalled();
        expect(monitoringService['executeAutomatedActions']).toHaveBeenCalled();
      });

      it('should not trigger alerts for normal access patterns', async () => {
        const mockRule = {
          id: 'rule-456',
          name: 'Normal Pattern Rule',
          enabled: true,
        };

        monitoringService['monitoringRules'].set('rule-456', mockRule as any);
        monitoringService['updateBehaviorProfile'] = jest.fn().mockResolvedValue(undefined);
        monitoringService['evaluateRule'] = jest.fn().mockResolvedValue({
          triggered: false,
          score: 0.2,
          details: { matchedConditions: 0, totalConditions: 2 },
        });
        monitoringService['checkBehavioralAnomalies'] = jest.fn().mockResolvedValue([]);
        monitoringService['updateRuleEffectiveness'] = jest.fn().mockResolvedValue(undefined);

        const normalEvent = {
          eventType: 'LOGIN',
          userId: mockUserId,
          resource: 'content',
          action: 'read',
          timestamp: new Date(),
          ipAddress: '192.168.1.100', // Normal office IP
          success: true,
          riskScore: 1.5,
        };

        const result = await monitoringService.monitorAccessEvent(normalEvent);

        expect(result).toHaveLength(0);
        expect(monitoringService['evaluateRule']).toHaveBeenCalledWith(mockRule, normalEvent);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete access control lifecycle', async () => {
      // 1. Create permission
      (prisma.permission.create as jest.Mock).mockResolvedValue({
        id: 'integration-perm-123',
        name: 'content:manage',
        resource: 'content',
        action: 'manage',
        effect: 'PERMIT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      accessControlService['validatePermissionConflicts'] = jest.fn().mockResolvedValue(undefined);
      accessControlService['clearPermissionCache'] = jest.fn().mockResolvedValue(undefined);

      const permission = await accessControlService.createPermission({
        name: 'content:manage',
        description: 'Manage content resources',
        resource: 'content',
        action: 'manage',
      });

      expect(permission.id).toBe('integration-perm-123');

      // 2. Create role with permission
      (prisma.role.create as jest.Mock).mockResolvedValue({
        id: 'integration-role-123',
        name: 'content-manager',
        permissions: ['integration-perm-123'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      accessControlService['validatePermissionsExist'] = jest.fn().mockResolvedValue(undefined);

      const role = await accessControlService.createRole({
        name: 'content-manager',
        description: 'Content management role',
        permissions: ['integration-perm-123'],
      });

      expect(role.id).toBe('integration-role-123');

      // 3. Create ABAC policy
      (prisma.accessPolicy.create as jest.Mock).mockResolvedValue({
        id: 'integration-policy-123',
        name: 'content-access-policy',
        rules: [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      accessControlService['validatePolicySyntax'] = jest.fn().mockResolvedValue(undefined);
      accessControlService['compilePolicyRules'] = jest.fn().mockResolvedValue(undefined);

      const policy = await accessControlService.createPolicy({
        name: 'content-access-policy',
        description: 'Policy for content access',
        target: { resources: ['content'] },
        rules: [{
          id: 'rule-1',
          description: 'Allow content access',
          condition: 'subject.role.includes("content-manager")',
          effect: 'PERMIT',
          priority: 100,
        }],
      });

      expect(policy.id).toBe('integration-policy-123');

      // 4. Evaluate access
      accessControlService['evaluationCache'] = new Map();
      accessControlService['getSubjectAttributes'] = jest.fn().mockResolvedValue({
        user_id: mockUserId,
        role: ['content-manager'],
      });
      accessControlService['getResourceAttributes'] = jest.fn().mockResolvedValue({
        resource_type: 'content',
      });
      accessControlService['getApplicablePolicies'] = jest.fn().mockResolvedValue([policy]);
      accessControlService['evaluatePolicies'] = jest.fn().mockResolvedValue({
        decision: 'PERMIT',
        obligations: [],
        appliedRules: [],
      });
      accessControlService['combineDecisions'] = jest.fn().mockReturnValue({
        decision: 'PERMIT',
        obligations: [],
      });
      accessControlService['calculateRiskScore'] = jest.fn().mockResolvedValue(2.0);
      accessControlService['calculateAccessRiskScore'] = jest.fn().mockResolvedValue(2.0);
      accessControlService['updatePolicyEvaluationCounts'] = jest.fn().mockResolvedValue(undefined);
      accessControlService['logAccessEvaluation'] = jest.fn().mockResolvedValue(undefined);
      accessControlService['triggerAutomatedActions'] = jest.fn().mockResolvedValue(undefined);

      const evaluation = await accessControlService.evaluateAccess({
        subjectId: mockUserId,
        resource: 'content/articles',
        action: 'manage',
      });

      expect(evaluation.decision).toBe('PERMIT');

      // 5. Monitor access event
      monitoringService['monitoringRules'] = new Map();
      monitoringService['updateBehaviorProfile'] = jest.fn().mockResolvedValue(undefined);
      monitoringService['checkBehavioralAnomalies'] = jest.fn().mockResolvedValue([]);
      monitoringService['updateRuleEffectiveness'] = jest.fn().mockResolvedValue(undefined);

      const alerts = await monitoringService.monitorAccessEvent({
        eventType: 'RESOURCE_ACCESS',
        userId: mockUserId,
        resource: 'content/articles',
        action: 'manage',
        timestamp: new Date(),
        success: true,
        riskScore: 2.0,
      });

      expect(alerts).toHaveLength(0); // No alerts for normal access

      // Verify all components worked together
      expect(prisma.permission.create).toHaveBeenCalled();
      expect(prisma.role.create).toHaveBeenCalled();
      expect(prisma.accessPolicy.create).toHaveBeenCalled();
      expect(accessControlService['getSubjectAttributes']).toHaveBeenCalledWith(mockUserId);
      expect(monitoringService['updateBehaviorProfile']).toHaveBeenCalled();
    });
  });
});

// Helper functions for test setup
function createMockPermission(overrides: any = {}) {
  return {
    id: 'perm-test-123',
    name: 'test:permission',
    description: 'Test permission',
    resource: 'test',
    action: 'test',
    conditions: [],
    effect: 'PERMIT',
    priority: 100,
    active: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRole(overrides: any = {}) {
  return {
    id: 'role-test-123',
    name: 'test-role',
    description: 'Test role',
    permissions: ['perm-test-123'],
    inheritsFrom: [],
    constraints: {},
    assignedUsers: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockPolicy(overrides: any = {}) {
  return {
    id: 'policy-test-123',
    name: 'test-policy',
    description: 'Test ABAC policy',
    target: { resources: ['test'] },
    rules: [{
      id: 'rule-1',
      description: 'Test rule',
      condition: 'true',
      effect: 'PERMIT',
      priority: 100,
    }],
    combiningAlgorithm: 'deny_overrides',
    active: true,
    evaluationCount: 0,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockAccessRequest(overrides: any = {}) {
  return {
    id: 'request-test-123',
    requesterId: 'user-123',
    requestType: 'PERMISSION',
    resourceType: 'test',
    justification: 'Test access request',
    urgency: 'MEDIUM',
    status: 'PENDING',
    approvers: ['manager-123'],
    approvals: [],
    riskScore: 2.0,
    auditTrail: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockMonitoringRule(overrides: any = {}) {
  return {
    id: 'rule-test-123',
    name: 'test-rule',
    description: 'Test monitoring rule',
    ruleType: 'THRESHOLD',
    conditions: [],
    threshold: 5,
    timeWindow: 60,
    severity: 'MEDIUM',
    actions: ['ALERT'],
    enabled: true,
    triggerCount: 0,
    effectiveness: 0,
    falsePositiveRate: 0,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
} 