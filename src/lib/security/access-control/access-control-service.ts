import { prisma } from '../../prisma';
import { redis } from '../../redis';
import { siemService } from '../monitoring/siem-service';
import { z } from 'zod';

// Access control configuration
const ACCESS_CONTROL_CONFIG = {
  // Permission granularity levels
  permissionLevels: {
    SYSTEM: 'System-wide permissions',
    SITE: 'Site-specific permissions',
    RESOURCE: 'Resource-specific permissions',
    FIELD: 'Field-level permissions',
    OPERATION: 'Operation-specific permissions',
  },

  // Standard actions
  actions: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXECUTE: 'execute',
    APPROVE: 'approve',
    PUBLISH: 'publish',
    ARCHIVE: 'archive',
    EXPORT: 'export',
    IMPORT: 'import',
    ADMIN: 'admin',
    AUDIT: 'audit',
  },

  // Resource types
  resources: {
    CONTENT: 'content',
    MEDIA: 'media',
    USERS: 'users',
    SITES: 'sites',
    SECURITY: 'security',
    ANALYTICS: 'analytics',
    BILLING: 'billing',
    SETTINGS: 'settings',
    REPORTS: 'reports',
    WORKFLOWS: 'workflows',
    INTEGRATIONS: 'integrations',
    API: 'api',
  },

  // Attribute types for ABAC
  attributeTypes: {
    SUBJECT: {
      user_id: 'string',
      role: 'string',
      department: 'string',
      clearance_level: 'number',
      location: 'string',
      employment_type: 'string',
      manager_id: 'string',
      hire_date: 'date',
      last_training: 'date',
      mfa_enabled: 'boolean',
      active: 'boolean',
    },
    RESOURCE: {
      resource_type: 'string',
      classification: 'string',
      owner: 'string',
      created_date: 'date',
      modified_date: 'date',
      size: 'number',
      sensitivity: 'string',
      compliance_tags: 'array',
      access_history: 'array',
      encryption_status: 'boolean',
    },
    ENVIRONMENT: {
      time_of_access: 'date',
      ip_address: 'string',
      device_type: 'string',
      location: 'string',
      network_segment: 'string',
      risk_score: 'number',
      authentication_method: 'string',
      session_duration: 'number',
      concurrent_sessions: 'number',
    },
    ACTION: {
      action_type: 'string',
      urgency: 'string',
      business_justification: 'string',
      approval_required: 'boolean',
      audit_required: 'boolean',
      retention_period: 'number',
    },
  },

  // Policy decision points
  policyDecisionPoints: {
    PERMIT: 'permit',
    DENY: 'deny',
    NOT_APPLICABLE: 'not_applicable',
    INDETERMINATE: 'indeterminate',
  },

  // Risk levels
  riskLevels: {
    VERY_LOW: { score: 0, color: '#00FF00', label: 'Very Low' },
    LOW: { score: 1, color: '#80FF00', label: 'Low' },
    MEDIUM: { score: 2, color: '#FFFF00', label: 'Medium' },
    HIGH: { score: 3, color: '#FF8000', label: 'High' },
    VERY_HIGH: { score: 4, color: '#FF0000', label: 'Very High' },
    CRITICAL: { score: 5, color: '#800000', label: 'Critical' },
  },

  // Session management
  sessionLimits: {
    maxConcurrentSessions: 5,
    sessionTimeoutMinutes: 120,
    idleTimeoutMinutes: 30,
    maxSessionDurationHours: 8,
    refreshTokenLifetimeHours: 24,
  },

  // Automated actions
  automatedActions: {
    ACCOUNT_LOCKOUT: {
      trigger: 'failed_login_attempts',
      threshold: 5,
      duration: 30, // minutes
      escalate: true,
    },
    SESSION_TERMINATION: {
      trigger: 'high_risk_activity',
      threshold: 4, // risk score
      immediate: true,
      notify: true,
    },
    PRIVILEGE_ESCALATION_ALERT: {
      trigger: 'privilege_change',
      immediate: true,
      approvalRequired: true,
      auditLog: true,
    },
    DORMANT_ACCOUNT_REVIEW: {
      trigger: 'last_access',
      threshold: 90, // days
      autoDisable: false,
      notifyManager: true,
    },
  },
} as const;

// Validation schemas
export const permissionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  resource: z.string(),
  action: z.string(),
  conditions: z.array(z.object({
    attribute: z.string(),
    operator: z.enum(['equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than', 'contains', 'regex']),
    value: z.any(),
  })).optional(),
  effect: z.enum(['PERMIT', 'DENY']).default('PERMIT'),
  priority: z.number().min(1).max(1000).default(100),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export const roleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  permissions: z.array(z.string()),
  inheritsFrom: z.array(z.string()).optional(),
  constraints: z.object({
    maxUsers: z.number().optional(),
    requiresApproval: z.boolean().default(false),
    temporaryDuration: z.number().optional(), // hours
    ipRestrictions: z.array(z.string()).optional(),
    timeRestrictions: z.object({
      allowedHours: z.array(z.number()).optional(),
      allowedDays: z.array(z.number()).optional(),
      timezone: z.string().optional(),
    }).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export const policySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500),
  target: z.object({
    subjects: z.array(z.string()).optional(),
    resources: z.array(z.string()).optional(),
    actions: z.array(z.string()).optional(),
    environments: z.array(z.string()).optional(),
  }),
  rules: z.array(z.object({
    id: z.string(),
    description: z.string(),
    condition: z.string(), // ABAC expression
    effect: z.enum(['PERMIT', 'DENY']),
    priority: z.number().min(1).max(1000),
    obligations: z.array(z.object({
      type: z.string(),
      value: z.any(),
    })).optional(),
  })),
  combiningAlgorithm: z.enum(['deny_overrides', 'permit_overrides', 'first_applicable', 'only_one_applicable']).default('deny_overrides'),
  active: z.boolean().default(true),
  effectiveDate: z.date().optional(),
  expirationDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const accessRequestSchema = z.object({
  requesterId: z.string(),
  targetUserId: z.string().optional(),
  requestType: z.enum(['PERMISSION', 'ROLE', 'RESOURCE_ACCESS', 'TEMPORARY_ELEVATION']),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  justification: z.string().min(10),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  duration: z.number().optional(), // hours
  approvers: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const accessEvaluationSchema = z.object({
  subjectId: z.string(),
  resource: z.string(),
  action: z.string(),
  environment: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
});

// Interfaces
interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions: Array<{
    attribute: string;
    operator: string;
    value: any;
  }>;
  effect: 'PERMIT' | 'DENY';
  priority: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inheritsFrom: string[];
  constraints: {
    maxUsers?: number;
    requiresApproval?: boolean;
    temporaryDuration?: number;
    ipRestrictions?: string[];
    timeRestrictions?: {
      allowedHours?: number[];
      allowedDays?: number[];
      timezone?: string;
    };
  };
  assignedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  target: {
    subjects?: string[];
    resources?: string[];
    actions?: string[];
    environments?: string[];
  };
  rules: Array<{
    id: string;
    description: string;
    condition: string;
    effect: 'PERMIT' | 'DENY';
    priority: number;
    obligations?: Array<{
      type: string;
      value: any;
    }>;
  }>;
  combiningAlgorithm: string;
  active: boolean;
  effectiveDate?: Date;
  expirationDate?: Date;
  evaluationCount: number;
  lastEvaluated?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

interface AccessRequest {
  id: string;
  requesterId: string;
  targetUserId?: string;
  requestType: string;
  resourceType: string;
  resourceId?: string;
  permissions?: string[];
  roles?: string[];
  justification: string;
  urgency: string;
  duration?: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
  approvers: string[];
  approvals: Array<{
    approverId: string;
    decision: 'APPROVED' | 'DENIED';
    timestamp: Date;
    comments?: string;
  }>;
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: Date;
    details: Record<string, any>;
  }>;
  riskScore: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

interface AccessEvaluation {
  id: string;
  subjectId: string;
  resource: string;
  action: string;
  decision: 'PERMIT' | 'DENY' | 'NOT_APPLICABLE' | 'INDETERMINATE';
  policiesEvaluated: string[];
  appliedRules: Array<{
    policyId: string;
    ruleId: string;
    effect: string;
    priority: number;
  }>;
  obligations: Array<{
    type: string;
    value: any;
  }>;
  riskScore: number;
  evaluationTime: number; // milliseconds
  environment: Record<string, any>;
  context: Record<string, any>;
  timestamp: Date;
  cached: boolean;
  cacheExpiry?: Date;
}

interface AccessSession {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  riskScore: number;
  authenticationMethod: string;
  mfaVerified: boolean;
  startTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'LOCKED';
  permissions: string[];
  elevatedUntil?: Date;
  violations: Array<{
    type: string;
    severity: string;
    timestamp: Date;
    details: Record<string, any>;
  }>;
  metadata: Record<string, any>;
}

interface AccessMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPermissions: number;
  totalRoles: number;
  totalPolicies: number;
  pendingRequests: number;
  riskDistribution: Record<string, number>;
  accessPatterns: Array<{
    resource: string;
    accessCount: number;
    uniqueUsers: number;
    riskScore: number;
  }>;
  complianceStatus: {
    segregationOfDuties: number;
    leastPrivilege: number;
    regularReview: number;
    overallScore: number;
  };
  violations: Array<{
    type: string;
    count: number;
    severity: string;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  }>;
}

// Advanced Access Control Service
export class AdvancedAccessControlService {
  private permissionCache: Map<string, Permission[]> = new Map();
  private policyCache: Map<string, Policy> = new Map();
  private evaluationCache: Map<string, AccessEvaluation> = new Map();
  private activeSessions: Map<string, AccessSession> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize access control service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load permissions and policies into cache
      await this.loadPermissionsCache();
      await this.loadPoliciesCache();

      // Load active sessions
      await this.loadActiveSessions();

      // Start background processors
      this.startBackgroundProcessors();

      // Initialize policy decision point
      await this.initializePolicyDecisionPoint();

      console.log('Advanced Access Control Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Advanced Access Control Service:', error);
    }
  }

  /**
   * Create fine-grained permission
   */
  async createPermission(
    permissionData: z.infer<typeof permissionSchema>
  ): Promise<Permission> {
    try {
      const validatedData = permissionSchema.parse(permissionData);

      // Check for permission conflicts
      await this.validatePermissionConflicts(validatedData);

      // Create permission record
      const permission = await prisma.permission.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          resource: validatedData.resource,
          action: validatedData.action,
          conditions: validatedData.conditions || [],
          effect: validatedData.effect,
          priority: validatedData.priority,
          active: validatedData.active,
          metadata: validatedData.metadata || {},
        },
      });

      const permissionObj: Permission = {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        conditions: permission.conditions as any,
        effect: permission.effect as any,
        priority: permission.priority,
        active: permission.active,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
        metadata: permission.metadata as Record<string, any>,
      };

      // Clear cache to force reload
      await this.clearPermissionCache();

      // Log permission creation
      await siemService.ingestEvent({
        eventType: 'ACCESS_CONTROL',
        severity: 'INFO',
        source: 'AccessControl',
        title: `Permission Created: ${validatedData.name}`,
        description: `New permission created for ${validatedData.resource}:${validatedData.action}`,
        metadata: {
          permissionId: permission.id,
          resource: validatedData.resource,
          action: validatedData.action,
          effect: validatedData.effect,
        },
      });

      return permissionObj;

    } catch (error) {
      console.error('Failed to create permission:', error);
      throw new Error(`Permission creation failed: ${error.message}`);
    }
  }

  /**
   * Create role with inheritance
   */
  async createRole(
    roleData: z.infer<typeof roleSchema>
  ): Promise<Role> {
    try {
      const validatedData = roleSchema.parse(roleData);

      // Validate permissions exist
      await this.validatePermissionsExist(validatedData.permissions);

      // Validate inheritance hierarchy
      if (validatedData.inheritsFrom) {
        await this.validateRoleInheritance(validatedData.inheritsFrom);
      }

      // Create role record
      const role = await prisma.role.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          permissions: validatedData.permissions,
          inheritsFrom: validatedData.inheritsFrom || [],
          constraints: validatedData.constraints || {},
          assignedUsers: [],
          metadata: validatedData.metadata || {},
        },
      });

      const roleObj: Role = {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions as string[],
        inheritsFrom: role.inheritsFrom as string[],
        constraints: role.constraints as any,
        assignedUsers: [],
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        metadata: role.metadata as Record<string, any>,
      };

      // Log role creation
      await siemService.ingestEvent({
        eventType: 'ACCESS_CONTROL',
        severity: 'INFO',
        source: 'AccessControl',
        title: `Role Created: ${validatedData.name}`,
        description: `New role created with ${validatedData.permissions.length} permissions`,
        metadata: {
          roleId: role.id,
          permissionCount: validatedData.permissions.length,
          inheritsFrom: validatedData.inheritsFrom,
        },
      });

      return roleObj;

    } catch (error) {
      console.error('Failed to create role:', error);
      throw new Error(`Role creation failed: ${error.message}`);
    }
  }

  /**
   * Create ABAC policy
   */
  async createPolicy(
    policyData: z.infer<typeof policySchema>
  ): Promise<Policy> {
    try {
      const validatedData = policySchema.parse(policyData);

      // Validate policy syntax
      await this.validatePolicySyntax(validatedData);

      // Test policy compilation
      await this.compilePolicyRules(validatedData.rules);

      // Create policy record
      const policy = await prisma.accessPolicy.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          target: validatedData.target,
          rules: validatedData.rules,
          combiningAlgorithm: validatedData.combiningAlgorithm,
          active: validatedData.active,
          effectiveDate: validatedData.effectiveDate,
          expirationDate: validatedData.expirationDate,
          evaluationCount: 0,
          metadata: validatedData.metadata || {},
        },
      });

      const policyObj: Policy = {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        target: policy.target as any,
        rules: policy.rules as any,
        combiningAlgorithm: policy.combiningAlgorithm,
        active: policy.active,
        effectiveDate: policy.effectiveDate || undefined,
        expirationDate: policy.expirationDate || undefined,
        evaluationCount: policy.evaluationCount,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        metadata: policy.metadata as Record<string, any>,
      };

      // Add to cache
      this.policyCache.set(policy.id, policyObj);

      // Log policy creation
      await siemService.ingestEvent({
        eventType: 'ACCESS_CONTROL',
        severity: 'INFO',
        source: 'AccessControl',
        title: `Access Policy Created: ${validatedData.name}`,
        description: `New ABAC policy created with ${validatedData.rules.length} rules`,
        metadata: {
          policyId: policy.id,
          ruleCount: validatedData.rules.length,
          combiningAlgorithm: validatedData.combiningAlgorithm,
        },
      });

      return policyObj;

    } catch (error) {
      console.error('Failed to create policy:', error);
      throw new Error(`Policy creation failed: ${error.message}`);
    }
  }

  /**
   * Evaluate access request using ABAC
   */
  async evaluateAccess(
    evaluationData: z.infer<typeof accessEvaluationSchema>
  ): Promise<AccessEvaluation> {
    try {
      const validatedData = accessEvaluationSchema.parse(evaluationData);
      const startTime = Date.now();

      // Check cache first
      const cacheKey = this.generateEvaluationCacheKey(validatedData);
      const cached = this.evaluationCache.get(cacheKey);
      if (cached && cached.cacheExpiry && cached.cacheExpiry > new Date()) {
        return cached;
      }

      // Get subject attributes
      const subjectAttributes = await this.getSubjectAttributes(validatedData.subjectId);

      // Get resource attributes
      const resourceAttributes = await this.getResourceAttributes(validatedData.resource);

      // Get environment attributes
      const environmentAttributes = {
        ...validatedData.environment,
        timestamp: new Date(),
        ip_address: validatedData.context?.ipAddress || 'unknown',
        risk_score: await this.calculateRiskScore(validatedData),
      };

      // Get applicable policies
      const applicablePolicies = await this.getApplicablePolicies(
        validatedData.resource,
        validatedData.action
      );

      // Evaluate policies
      const evaluationResults = await this.evaluatePolicies(
        applicablePolicies,
        subjectAttributes,
        resourceAttributes,
        environmentAttributes,
        validatedData.action
      );

      // Combine decisions
      const finalDecision = this.combineDecisions(evaluationResults);

      // Calculate risk score
      const riskScore = await this.calculateAccessRiskScore(
        subjectAttributes,
        resourceAttributes,
        environmentAttributes,
        finalDecision
      );

      // Create evaluation result
      const evaluation: AccessEvaluation = {
        id: crypto.randomUUID(),
        subjectId: validatedData.subjectId,
        resource: validatedData.resource,
        action: validatedData.action,
        decision: finalDecision.decision,
        policiesEvaluated: applicablePolicies.map(p => p.id),
        appliedRules: evaluationResults.appliedRules,
        obligations: finalDecision.obligations,
        riskScore,
        evaluationTime: Date.now() - startTime,
        environment: environmentAttributes,
        context: validatedData.context || {},
        timestamp: new Date(),
        cached: false,
        cacheExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };

      // Cache result
      this.evaluationCache.set(cacheKey, evaluation);

      // Update policy evaluation counts
      await this.updatePolicyEvaluationCounts(applicablePolicies.map(p => p.id));

      // Log access evaluation
      await this.logAccessEvaluation(evaluation);

      // Trigger automated actions if needed
      await this.triggerAutomatedActions(evaluation);

      return evaluation;

    } catch (error) {
      console.error('Failed to evaluate access:', error);
      throw new Error(`Access evaluation failed: ${error.message}`);
    }
  }

  /**
   * Create access request
   */
  async createAccessRequest(
    requestData: z.infer<typeof accessRequestSchema>
  ): Promise<AccessRequest> {
    try {
      const validatedData = accessRequestSchema.parse(requestData);

      // Calculate risk score for request
      const riskScore = await this.calculateRequestRiskScore(validatedData);

      // Determine approvers
      const approvers = validatedData.approvers || (await this.determineApprovers(validatedData));

      // Create request record
      const request = await prisma.accessRequest.create({
        data: {
          requesterId: validatedData.requesterId,
          targetUserId: validatedData.targetUserId,
          requestType: validatedData.requestType,
          resourceType: validatedData.resourceType,
          resourceId: validatedData.resourceId,
          permissions: validatedData.permissions || [],
          roles: validatedData.roles || [],
          justification: validatedData.justification,
          urgency: validatedData.urgency,
          duration: validatedData.duration,
          status: 'PENDING',
          approvers,
          approvals: [],
          auditTrail: [
            {
              action: 'REQUEST_CREATED',
              actor: validatedData.requesterId,
              timestamp: new Date(),
              details: {
                requestType: validatedData.requestType,
                urgency: validatedData.urgency,
              },
            },
          ],
          riskScore,
          metadata: validatedData.metadata || {},
        },
      });

      const requestObj: AccessRequest = {
        id: request.id,
        requesterId: request.requesterId,
        targetUserId: request.targetUserId || undefined,
        requestType: request.requestType,
        resourceType: request.resourceType,
        resourceId: request.resourceId || undefined,
        permissions: request.permissions as string[],
        roles: request.roles as string[],
        justification: request.justification,
        urgency: request.urgency,
        duration: request.duration || undefined,
        status: request.status as any,
        approvers: request.approvers as string[],
        approvals: [],
        riskScore: request.riskScore,
        auditTrail: request.auditTrail as any,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        metadata: request.metadata as Record<string, any>,
      };

      // Send notifications to approvers
      await this.notifyApprovers(requestObj);

      // Log request creation
      await siemService.ingestEvent({
        eventType: 'ACCESS_REQUEST',
        severity: riskScore > 3 ? 'MEDIUM' : 'INFO',
        source: 'AccessControl',
        title: `Access Request Created: ${validatedData.requestType}`,
        description: `${validatedData.requestType} request for ${validatedData.resourceType}`,
        userId: validatedData.requesterId,
        metadata: {
          requestId: request.id,
          requestType: validatedData.requestType,
          urgency: validatedData.urgency,
          riskScore,
        },
      });

      return requestObj;

    } catch (error) {
      console.error('Failed to create access request:', error);
      throw new Error(`Access request creation failed: ${error.message}`);
    }
  }

  /**
   * Get access control metrics
   */
  async getAccessMetrics(siteId?: string): Promise<AccessMetrics> {
    try {
      const whereClause = siteId ? { siteId } : {};

      // Get user counts
      const [totalUsers, activeUsers] = await Promise.all([
        prisma.user.count({ where: whereClause }),
        prisma.user.count({
          where: {
            ...whereClause,
            lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      // Get permission and role counts
      const [totalPermissions, totalRoles, totalPolicies] = await Promise.all([
        prisma.permission.count({ where: { active: true } }),
        prisma.role.count(),
        prisma.accessPolicy.count({ where: { active: true } }),
      ]);

      // Get pending requests
      const pendingRequests = await prisma.accessRequest.count({
        where: { status: 'PENDING' },
      });

      // Calculate risk distribution
      const riskDistribution = await this.calculateRiskDistribution(siteId);

      // Get access patterns
      const accessPatterns = await this.getAccessPatterns(siteId);

      // Calculate compliance status
      const complianceStatus = await this.calculateComplianceStatus(siteId);

      // Get violations
      const violations = await this.getAccessViolations(siteId);

      return {
        totalUsers,
        activeUsers,
        totalPermissions,
        totalRoles,
        totalPolicies,
        pendingRequests,
        riskDistribution,
        accessPatterns,
        complianceStatus,
        violations,
      };

    } catch (error) {
      console.error('Failed to get access metrics:', error);
      throw new Error(`Metrics calculation failed: ${error.message}`);
    }
  }

  // Helper methods (private)

  private async loadPermissionsCache(): Promise<void> {
    const permissions = await prisma.permission.findMany({
      where: { active: true },
    });

    // Group by resource for faster lookups
    const groupedPermissions = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const key = `${permission.resource}:${permission.action}`;
      if (!groupedPermissions.has(key)) {
        groupedPermissions.set(key, []);
      }
      groupedPermissions.get(key)!.push(this.mapPrismaPermissionToPermission(permission));
    }

    this.permissionCache = groupedPermissions;
  }

  private async loadPoliciesCache(): Promise<void> {
    const policies = await prisma.accessPolicy.findMany({
      where: { active: true },
    });

    for (const policy of policies) {
      this.policyCache.set(policy.id, this.mapPrismaPolicyToPolicy(policy));
    }
  }

  private async loadActiveSessions(): Promise<void> {
    // Load active sessions from database/cache
    const sessions = await prisma.userSession.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    for (const session of sessions) {
      this.activeSessions.set(session.id, this.mapPrismaSessionToSession(session));
    }
  }

  private startBackgroundProcessors(): void {
    // Clean expired cache entries every 5 minutes
    setInterval(async () => {
      await this.cleanExpiredCacheEntries();
    }, 5 * 60 * 1000);

    // Process access requests every minute
    setInterval(async () => {
      await this.processAccessRequests();
    }, 60 * 1000);

    // Monitor session violations every 30 seconds
    setInterval(async () => {
      await this.monitorSessionViolations();
    }, 30 * 1000);

    // Generate daily access reports
    setInterval(async () => {
      await this.generateDailyAccessReports();
    }, 24 * 60 * 60 * 1000);
  }

  private async initializePolicyDecisionPoint(): Promise<void> {
    // Initialize ABAC policy decision point
    console.log('Initializing ABAC Policy Decision Point...');
  }

  private async validatePermissionConflicts(permission: any): Promise<void> {
    // Check for conflicting permissions
    const existing = await prisma.permission.findFirst({
      where: {
        resource: permission.resource,
        action: permission.action,
        effect: 'DENY',
        active: true,
      },
    });

    if (existing && permission.effect === 'PERMIT') {
      console.warn(`Potential permission conflict detected for ${permission.resource}:${permission.action}`);
    }
  }

  private async clearPermissionCache(): Promise<void> {
    this.permissionCache.clear();
    await this.loadPermissionsCache();
  }

  private async validatePermissionsExist(permissionIds: string[]): Promise<void> {
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new Error('One or more permissions do not exist');
    }
  }

  private async validateRoleInheritance(roleIds: string[]): Promise<void> {
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new Error('One or more inherited roles do not exist');
    }

    // Check for circular inheritance
    // Implementation would detect cycles in inheritance graph
  }

  private async validatePolicySyntax(policy: any): Promise<void> {
    // Validate ABAC policy syntax
    for (const rule of policy.rules) {
      if (!rule.condition || typeof rule.condition !== 'string') {
        throw new Error(`Invalid condition in rule ${rule.id}`);
      }
    }
  }

  private async compilePolicyRules(rules: any[]): Promise<void> {
    // Compile and validate policy rules
    for (const rule of rules) {
      try {
        // Test rule compilation
        await this.evaluateRuleCondition(rule.condition, {}, {}, {});
      } catch (error) {
        throw new Error(`Failed to compile rule ${rule.id}: ${error.message}`);
      }
    }
  }

  private generateEvaluationCacheKey(data: any): string {
    return `eval:${data.subjectId}:${data.resource}:${data.action}`;
  }

  private async getSubjectAttributes(subjectId: string): Promise<Record<string, any>> {
    const user = await prisma.user.findUnique({
      where: { id: subjectId },
      include: { roles: true },
    });

    if (!user) {
      throw new Error('Subject not found');
    }

    return {
      user_id: user.id,
      role: user.roles.map(r => r.name),
      department: user.metadata?.department || 'unknown',
      clearance_level: user.metadata?.clearanceLevel || 1,
      location: user.metadata?.location || 'unknown',
      employment_type: user.metadata?.employmentType || 'employee',
      mfa_enabled: user.mfaEnabled || false,
      active: user.active,
      last_login: user.lastLoginAt,
    };
  }

  private async getResourceAttributes(resource: string): Promise<Record<string, any>> {
    // Implementation would get resource attributes
    return {
      resource_type: resource.split('/')[0] || resource,
      classification: 'internal',
      sensitivity: 'medium',
    };
  }

  private async getApplicablePolicies(resource: string, action: string): Promise<Policy[]> {
    const policies: Policy[] = [];

    for (const policy of this.policyCache.values()) {
      if (this.isPolicyApplicable(policy, resource, action)) {
        policies.push(policy);
      }
    }

    return policies.sort((a, b) => b.rules[0]?.priority - a.rules[0]?.priority);
  }

  private isPolicyApplicable(policy: Policy, resource: string, action: string): boolean {
    const { target } = policy;

    // Check if policy applies to this resource/action
    if (target.resources && !target.resources.some(r => resource.includes(r))) {
      return false;
    }

    if (target.actions && !target.actions.includes(action)) {
      return false;
    }

    return true;
  }

  private async evaluatePolicies(
    policies: Policy[],
    subject: Record<string, any>,
    resource: Record<string, any>,
    environment: Record<string, any>,
    action: string
  ): Promise<{ decision: string; obligations: any[]; appliedRules: any[] }> {
    const appliedRules: any[] = [];
    const obligations: any[] = [];
    let decision = 'NOT_APPLICABLE';

    for (const policy of policies) {
      for (const rule of policy.rules) {
        const ruleResult = await this.evaluateRule(rule, subject, resource, environment);

        if (ruleResult.applicable) {
          appliedRules.push({
            policyId: policy.id,
            ruleId: rule.id,
            effect: rule.effect,
            priority: rule.priority,
          });

          if (rule.effect === 'DENY') {
            decision = 'DENY';
            break;
          } else if (rule.effect === 'PERMIT') {
            decision = 'PERMIT';
          }

          if (rule.obligations) {
            obligations.push(...rule.obligations);
          }
        }
      }

      if (decision === 'DENY') break;
    }

    return { decision, obligations, appliedRules };
  }

  private async evaluateRule(
    rule: any,
    subject: Record<string, any>,
    resource: Record<string, any>,
    environment: Record<string, any>
  ): Promise<{ applicable: boolean; result: boolean }> {
    try {
      const result = await this.evaluateRuleCondition(rule.condition, subject, resource, environment);
      return { applicable: true, result };
    } catch (error) {
      console.error(`Rule evaluation error: ${error.message}`);
      return { applicable: false, result: false };
    }
  }

  private async evaluateRuleCondition(
    condition: string,
    subject: Record<string, any>,
    resource: Record<string, any>,
    environment: Record<string, any>
  ): Promise<boolean> {
    // Simple expression evaluator for ABAC conditions
    // In production, would use a proper policy language evaluator
    
    // Replace variables in condition
    let evaluatedCondition = condition
      .replace(/subject\.(\w+)/g, (match, prop) => JSON.stringify(subject[prop]))
      .replace(/resource\.(\w+)/g, (match, prop) => JSON.stringify(resource[prop]))
      .replace(/environment\.(\w+)/g, (match, prop) => JSON.stringify(environment[prop]));

    // Basic evaluation (would use proper expression parser in production)
    try {
      return eval(evaluatedCondition);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  private combineDecisions(results: any): { decision: string; obligations: any[] } {
    // Implement policy combining algorithm
    if (results.decision === 'DENY') {
      return { decision: 'DENY', obligations: results.obligations };
    } else if (results.decision === 'PERMIT') {
      return { decision: 'PERMIT', obligations: results.obligations };
    } else {
      return { decision: 'NOT_APPLICABLE', obligations: [] };
    }
  }

  // Additional helper methods would continue here...
  private async calculateRiskScore(data: any): Promise<number> { return 2; }
  private async calculateAccessRiskScore(s: any, r: any, e: any, d: any): Promise<number> { return 2; }
  private async updatePolicyEvaluationCounts(policyIds: string[]): Promise<void> { /* Implementation */ }
  private async logAccessEvaluation(evaluation: AccessEvaluation): Promise<void> { /* Implementation */ }
  private async triggerAutomatedActions(evaluation: AccessEvaluation): Promise<void> { /* Implementation */ }
  private async calculateRequestRiskScore(request: any): Promise<number> { return 2; }
  private async determineApprovers(request: any): Promise<string[]> { return ['manager-1']; }
  private async notifyApprovers(request: AccessRequest): Promise<void> { /* Implementation */ }
  private async calculateRiskDistribution(siteId?: string): Promise<Record<string, number>> { return {}; }
  private async getAccessPatterns(siteId?: string): Promise<any[]> { return []; }
  private async calculateComplianceStatus(siteId?: string): Promise<any> { return {}; }
  private async getAccessViolations(siteId?: string): Promise<any[]> { return []; }
  private mapPrismaPermissionToPermission(permission: any): Permission { return {} as Permission; }
  private mapPrismaPolicyToPolicy(policy: any): Policy { return {} as Policy; }
  private mapPrismaSessionToSession(session: any): AccessSession { return {} as AccessSession; }
  private async cleanExpiredCacheEntries(): Promise<void> { /* Implementation */ }
  private async processAccessRequests(): Promise<void> { /* Implementation */ }
  private async monitorSessionViolations(): Promise<void> { /* Implementation */ }
  private async generateDailyAccessReports(): Promise<void> { /* Implementation */ }
}

// Export singleton instance
export const advancedAccessControlService = new AdvancedAccessControlService();

// Export types
export type {
  Permission,
  Role,
  Policy,
  AccessRequest,
  AccessEvaluation,
  AccessSession,
  AccessMetrics,
}; 