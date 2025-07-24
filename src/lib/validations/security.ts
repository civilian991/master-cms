import { z } from 'zod';

// Security Event Validation
export const securityEventSchema = z.object({
  eventType: z.enum([
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET',
    'MFA_ENABLED',
    'MFA_DISABLED',
    'MFA_VERIFICATION',
    'ACCOUNT_LOCKED',
    'ACCOUNT_UNLOCKED',
    'SUSPICIOUS_ACTIVITY',
    'DATA_ACCESS',
    'DATA_EXPORT',
    'DATA_DELETION',
    'PERMISSION_CHANGE',
    'ADMIN_ACTION',
    'API_ACCESS',
    'SYSTEM_ACCESS',
    'SECURITY_POLICY_VIOLATION',
    'VULNERABILITY_DETECTED',
    'MALWARE_DETECTED',
    'INTRUSION_ATTEMPT',
    'DDoS_ATTACK',
    'SQL_INJECTION',
    'XSS_ATTEMPT',
    'CSRF_ATTEMPT',
    'UNAUTHORIZED_ACCESS',
    'DATA_BREACH',
    'COMPLIANCE_VIOLATION',
    'OTHER',
  ]),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  source: z.string().max(100),
  metadata: z.record(z.any()).default({}),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  location: z.record(z.any()).optional(),
  deviceInfo: z.record(z.any()).optional(),
  success: z.boolean(),
  detected: z.boolean().default(true),
  resolved: z.boolean().default(false),
  falsePositive: z.boolean().default(false),
  responseActions: z.array(z.string()).default([]),
  siteId: z.string().optional(),
  userId: z.string().optional(),
  responseUserId: z.string().optional(),
});

export const createSecurityEventSchema = securityEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  detectedAt: true,
  resolvedAt: true,
});

// Compliance Record Validation
export const complianceRecordSchema = z.object({
  regulation: z.enum(['GDPR', 'CCPA', 'HIPAA', 'SOX', 'PCI_DSS', 'ISO27001', 'SOC2', 'NIST', 'CUSTOM']),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'PENDING_REVIEW', 'IN_PROGRESS', 'NOT_APPLICABLE']),
  requirement: z.string().min(1).max(200),
  description: z.string().max(1000),
  evidence: z.record(z.any()).default({}),
  assessedBy: z.string().optional(),
  nextReview: z.date(),
  riskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NEGLIGIBLE']),
  findings: z.array(z.string()).default([]),
  remediation: z.array(z.string()).default([]),
  remediatedBy: z.string().optional(),
  auditTrail: z.array(z.record(z.any())).default([]),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const createComplianceRecordSchema = complianceRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assessedAt: true,
  remediatedAt: true,
});

// Vulnerability Scan Validation
export const vulnerabilityScanSchema = z.object({
  scanType: z.enum([
    'NETWORK',
    'WEB_APPLICATION',
    'MOBILE_APPLICATION',
    'INFRASTRUCTURE',
    'CONTAINER',
    'DEPENDENCY',
    'CONFIGURATION',
    'COMPLIANCE',
    'PENETRATION_TEST',
    'CODE_ANALYSIS',
  ]),
  status: z.enum(['SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED']),
  target: z.string().min(1).max(500),
  scanner: z.string().min(1).max(100),
  version: z.string().max(50).optional(),
  configuration: z.record(z.any()).default({}),
  scheduledBy: z.string().optional(),
  totalVulns: z.number().int().min(0).default(0),
  criticalVulns: z.number().int().min(0).default(0),
  highVulns: z.number().int().min(0).default(0),
  mediumVulns: z.number().int().min(0).default(0),
  lowVulns: z.number().int().min(0).default(0),
  infoVulns: z.number().int().min(0).default(0),
  results: z.array(z.record(z.any())).default([]),
  rawOutput: z.string().optional(),
  reportUrl: z.string().url().optional(),
  reviewed: z.boolean().default(false),
  reviewedBy: z.string().optional(),
  siteId: z.string(),
});

export const createVulnerabilityScanSchema = vulnerabilityScanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  scheduledAt: true,
  startedAt: true,
  completedAt: true,
  duration: true,
  reviewedAt: true,
});

// Vulnerability Validation
export const vulnerabilitySchema = z.object({
  scanId: z.string(),
  cveId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']),
  cvssScore: z.number().min(0).max(10).optional(),
  cvssVector: z.string().max(200).optional(),
  component: z.string().max(200).optional(),
  version: z.string().max(50).optional(),
  location: z.string().max(500).optional(),
  category: z.enum([
    'INJECTION',
    'BROKEN_AUTH',
    'SENSITIVE_DATA',
    'XML_EXTERNAL',
    'BROKEN_ACCESS',
    'SECURITY_MISCONFIG',
    'XSS',
    'DESERIALIZATION',
    'VULNERABLE_COMPONENTS',
    'LOGGING_MONITORING',
    'SSRF',
    'OTHER',
  ]),
  cweId: z.string().max(20).optional(),
  owasp: z.string().max(20).optional(),
  remediation: z.string().max(2000).optional(),
  references: z.array(z.string()).default([]),
  patch: z.string().max(500).optional(),
  workaround: z.string().max(1000).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'FIXED', 'ACCEPTED_RISK', 'FALSE_POSITIVE', 'DUPLICATE', 'DEFERRED']),
  assignedTo: z.string().optional(),
  exploitability: z.number().min(0).max(10).optional(),
  impact: z.number().min(0).max(10).optional(),
  riskScore: z.number().min(0).max(10).optional(),
  siteId: z.string(),
});

export const createVulnerabilitySchema = vulnerabilitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  discoveredAt: true,
  reportedAt: true,
  fixedAt: true,
  verifiedAt: true,
});

// Security Policy Validation
export const securityPolicySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  type: z.enum([
    'ACCESS_CONTROL',
    'DATA_PROTECTION',
    'AUTHENTICATION',
    'ENCRYPTION',
    'INCIDENT_RESPONSE',
    'VULNERABILITY_MANAGEMENT',
    'COMPLIANCE',
    'PRIVACY',
    'ACCEPTABLE_USE',
    'NETWORK_SECURITY',
    'APPLICATION_SECURITY',
    'PHYSICAL_SECURITY',
    'BUSINESS_CONTINUITY',
    'CUSTOM',
  ]),
  category: z.enum(['TECHNICAL', 'ADMINISTRATIVE', 'PHYSICAL', 'LEGAL', 'OPERATIONAL']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  policy: z.record(z.any()),
  enforcement: z.enum(['STRICT', 'MODERATE', 'ADVISORY', 'MONITORING_ONLY']),
  scope: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'RETIRED']),
  version: z.string().max(10).default('1.0'),
  effectiveDate: z.date(),
  expiryDate: z.date().optional(),
  ownerId: z.string(),
  approvedBy: z.string().optional(),
  regulations: z.array(z.string()).default([]),
  controls: z.array(z.string()).default([]),
  violations: z.number().int().min(0).default(0),
  reviewCycle: z.number().int().positive().optional(),
  reviewedBy: z.string().optional(),
  siteId: z.string(),
});

export const createSecurityPolicySchema = securityPolicySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  lastViolation: true,
  nextReview: true,
  lastReviewed: true,
});

// Policy Violation Validation
export const policyViolationSchema = z.object({
  policyId: z.string(),
  description: z.string().min(1).max(1000),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  context: z.record(z.any()).default({}),
  evidence: z.array(z.record(z.any())).default([]),
  detectedBy: z.string().optional(),
  source: z.string().max(200).optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED', 'ESCALATED']),
  resolvedBy: z.string().optional(),
  resolution: z.string().max(1000).optional(),
  impact: z.record(z.any()).default({}),
  riskScore: z.number().min(0).max(10).optional(),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const createPolicyViolationSchema = policyViolationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  detectedAt: true,
  resolvedAt: true,
});

// Audit Log Validation
export const auditLogSchema = z.object({
  action: z.enum([
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'EXPORT',
    'IMPORT',
    'APPROVE',
    'REJECT',
    'ACTIVATE',
    'DEACTIVATE',
    'CONFIGURE',
    'INSTALL',
    'UNINSTALL',
    'BACKUP',
    'RESTORE',
    'ENCRYPT',
    'DECRYPT',
    'GRANT_ACCESS',
    'REVOKE_ACCESS',
    'ESCALATE_PRIVILEGE',
    'OTHER',
  ]),
  resource: z.string().min(1).max(200),
  resourceId: z.string().max(100).optional(),
  resourceType: z.string().min(1).max(100),
  description: z.string().max(1000),
  details: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
  method: z.string().max(10).optional(),
  endpoint: z.string().max(500).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  sessionId: z.string().max(100).optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'WARNING', 'PENDING']),
  errorMessage: z.string().max(1000).optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  riskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NEGLIGIBLE']).default('LOW'),
  compliance: z.array(z.string()).default([]),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const createAuditLogSchema = auditLogSchema.omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

// Encryption Key Validation
export const encryptionKeySchema = z.object({
  keyId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  algorithm: z.enum(['AES_256', 'AES_128', 'RSA_2048', 'RSA_4096', 'ECC_P256', 'ECC_P384', 'CHACHA20', 'OTHER']),
  keySize: z.number().int().positive(),
  purpose: z.enum(['ENCRYPTION', 'DECRYPTION', 'SIGNING', 'VERIFICATION', 'KEY_EXCHANGE', 'AUTHENTICATION', 'BACKUP', 'RECOVERY', 'OTHER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_ACTIVATION', 'EXPIRED', 'COMPROMISED', 'RETIRED', 'DESTROYED']),
  expiresAt: z.date().optional(),
  rotationCycle: z.number().int().positive().optional(),
  autoRotate: z.boolean().default(false),
  usageCount: z.number().int().min(0).default(0),
  backupKey: z.string().max(500).optional(),
  recoveryKey: z.string().max(500).optional(),
  compliance: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  siteId: z.string(),
});

export const createEncryptionKeySchema = encryptionKeySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  generatedAt: true,
  activatedAt: true,
  rotatedAt: true,
  retiredAt: true,
  nextRotation: true,
  lastUsed: true,
});

// Key Usage Log Validation
export const keyUsageLogSchema = z.object({
  keyId: z.string(),
  operation: z.enum(['GENERATE', 'ACTIVATE', 'USE', 'ROTATE', 'BACKUP', 'RESTORE', 'RETIRE', 'DESTROY', 'EXPORT', 'IMPORT']),
  context: z.string().max(500).optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().max(1000).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  sessionId: z.string().max(100).optional(),
  metadata: z.record(z.any()).default({}),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const createKeyUsageLogSchema = keyUsageLogSchema.omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

// Security Incident Validation
export const securityIncidentSchema = z.object({
  incidentNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  priority: z.enum(['P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW']),
  category: z.enum([
    'MALWARE',
    'PHISHING',
    'WEB_ATTACK',
    'BRUTE_FORCE',
    'DENIAL_OF_SERVICE',
    'DATA_BREACH',
    'INSIDER_THREAT',
    'SOCIAL_ENGINEERING',
    'PHYSICAL_SECURITY',
    'COMPLIANCE_VIOLATION',
    'SYSTEM_COMPROMISE',
    'NETWORK_INTRUSION',
    'APPLICATION_VULNERABILITY',
    'CONFIGURATION_ERROR',
    'HUMAN_ERROR',
    'NATURAL_DISASTER',
    'OTHER',
  ]),
  type: z.enum(['SECURITY_INCIDENT', 'PRIVACY_INCIDENT', 'COMPLIANCE_INCIDENT', 'OPERATIONAL_INCIDENT', 'TECHNICAL_INCIDENT']),
  source: z.enum(['INTERNAL', 'EXTERNAL', 'THIRD_PARTY', 'UNKNOWN']),
  vector: z.enum(['EMAIL', 'WEB', 'NETWORK', 'PHYSICAL', 'SOCIAL', 'SUPPLY_CHAIN', 'INSIDER', 'API', 'MOBILE', 'CLOUD', 'OTHER']).optional(),
  detectedAt: z.date(),
  assignedTo: z.string().optional(),
  reportedBy: z.string(),
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'RESOLVED', 'CLOSED', 'REOPENED']),
  stage: z.enum(['DETECTION', 'ANALYSIS', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'LESSONS_LEARNED']),
  impact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  affectedSystems: z.array(z.string()).default([]),
  affectedUsers: z.number().int().min(0).optional(),
  dataCompromised: z.boolean().default(false),
  estimatedLoss: z.number().min(0).optional(),
  responseTeam: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  containment: z.record(z.any()).default({}),
  eradication: z.record(z.any()).default({}),
  recovery: z.record(z.any()).default({}),
  notifications: z.array(z.record(z.any())).default([]),
  external: z.boolean().default(false),
  regulatory: z.boolean().default(false),
  rootCause: z.string().max(2000).optional(),
  lessonsLearned: z.string().max(2000).optional(),
  improvements: z.array(z.string()).default([]),
  followUpTasks: z.array(z.string()).default([]),
  nextReview: z.date().optional(),
  siteId: z.string(),
});

export const createSecurityIncidentSchema = securityIncidentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reportedAt: true,
  acknowledgedAt: true,
  resolvedAt: true,
  closedAt: true,
});

// Incident Timeline Validation
export const incidentTimelineSchema = z.object({
  incidentId: z.string(),
  action: z.string().min(1).max(200),
  description: z.string().max(1000),
  category: z.enum([
    'DETECTION',
    'ANALYSIS',
    'CONTAINMENT',
    'COMMUNICATION',
    'ERADICATION',
    'RECOVERY',
    'DOCUMENTATION',
    'MANAGEMENT',
    'EXTERNAL',
    'OTHER',
  ]),
  details: z.record(z.any()).default({}),
  attachments: z.array(z.string()).default([]),
  duration: z.number().int().min(0).optional(),
  siteId: z.string(),
  userId: z.string().optional(),
});

export const createIncidentTimelineSchema = incidentTimelineSchema.omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

// User Security Profile Validation
export const userSecurityProfileSchema = z.object({
  userId: z.string(),
  mfaEnabled: z.boolean().default(false),
  mfaMethod: z.enum(['TOTP', 'SMS', 'EMAIL', 'HARDWARE_TOKEN', 'BIOMETRIC', 'BACKUP_CODES']).optional(),
  mfaBackupCodes: z.array(z.string()).default([]),
  passwordExpiresAt: z.date().optional(),
  failedLoginAttempts: z.number().int().min(0).default(0),
  lockedUntil: z.date().optional(),
  maxSessions: z.number().int().positive().default(5),
  activeSessions: z.number().int().min(0).default(0),
  lastLoginIP: z.string().ip().optional(),
  lastLoginLocation: z.record(z.any()).optional(),
  securityNotifications: z.boolean().default(true),
  suspiciousActivity: z.boolean().default(true),
  dataExportRequest: z.boolean().default(true),
  riskScore: z.number().min(0).max(100).default(0),
  riskFactors: z.array(z.string()).default([]),
  dataRetention: z.number().int().positive().optional(),
  consentGiven: z.boolean().default(false),
  consentDate: z.date().optional(),
  dataProcessingConsent: z.record(z.boolean()).default({}),
  securityEventCount: z.number().int().min(0).default(0),
  siteId: z.string(),
});

export const createUserSecurityProfileSchema = userSecurityProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMFAVerification: true,
  passwordChangedAt: true,
  lastPasswordReset: true,
  lastLoginAt: true,
  lastRiskAssessment: true,
  lastSecurityEvent: true,
});

// User Security Session Validation
export const userSecuritySessionSchema = z.object({
  profileId: z.string(),
  sessionId: z.string(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(500),
  location: z.record(z.any()).optional(),
  deviceFingerprint: z.string().max(500).optional(),
  expiresAt: z.date(),
  active: z.boolean().default(true),
  terminated: z.boolean().default(false),
  terminatedBy: z.string().optional(),
  terminatedReason: z.string().max(500).optional(),
  suspicious: z.boolean().default(false),
  suspicionReasons: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  siteId: z.string(),
});

export const createUserSecuritySessionSchema = userSecuritySessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivity: true,
});

// Search and filter schemas
export const securityEventFilterSchema = z.object({
  eventType: z.string().optional(),
  severity: z.string().optional(),
  resolved: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  userId: z.string().optional(),
  siteId: z.string().optional(),
});

export const vulnerabilityFilterSchema = z.object({
  severity: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  scanId: z.string().optional(),
  siteId: z.string().optional(),
});

export const incidentFilterSchema = z.object({
  severity: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  reportedBy: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  siteId: z.string().optional(),
});

export const auditLogFilterSchema = z.object({
  action: z.string().optional(),
  resourceType: z.string().optional(),
  status: z.string().optional(),
  riskLevel: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  siteId: z.string().optional(),
});

// Batch operations
export const bulkSecurityEventSchema = z.object({
  events: z.array(createSecurityEventSchema).min(1).max(100),
});

export const bulkVulnerabilitySchema = z.object({
  vulnerabilities: z.array(createVulnerabilitySchema).min(1).max(50),
});

// Export all schemas
export type SecurityEvent = z.infer<typeof securityEventSchema>;
export type CreateSecurityEvent = z.infer<typeof createSecurityEventSchema>;
export type ComplianceRecord = z.infer<typeof complianceRecordSchema>;
export type CreateComplianceRecord = z.infer<typeof createComplianceRecordSchema>;
export type VulnerabilityScan = z.infer<typeof vulnerabilityScanSchema>;
export type CreateVulnerabilityScan = z.infer<typeof createVulnerabilityScanSchema>;
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;
export type CreateVulnerability = z.infer<typeof createVulnerabilitySchema>;
export type SecurityPolicy = z.infer<typeof securityPolicySchema>;
export type CreateSecurityPolicy = z.infer<typeof createSecurityPolicySchema>;
export type PolicyViolation = z.infer<typeof policyViolationSchema>;
export type CreatePolicyViolation = z.infer<typeof createPolicyViolationSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;
export type EncryptionKey = z.infer<typeof encryptionKeySchema>;
export type CreateEncryptionKey = z.infer<typeof createEncryptionKeySchema>;
export type KeyUsageLog = z.infer<typeof keyUsageLogSchema>;
export type CreateKeyUsageLog = z.infer<typeof createKeyUsageLogSchema>;
export type SecurityIncident = z.infer<typeof securityIncidentSchema>;
export type CreateSecurityIncident = z.infer<typeof createSecurityIncidentSchema>;
export type IncidentTimeline = z.infer<typeof incidentTimelineSchema>;
export type CreateIncidentTimeline = z.infer<typeof createIncidentTimelineSchema>;
export type UserSecurityProfile = z.infer<typeof userSecurityProfileSchema>;
export type CreateUserSecurityProfile = z.infer<typeof createUserSecurityProfileSchema>;
export type UserSecuritySession = z.infer<typeof userSecuritySessionSchema>;
export type CreateUserSecuritySession = z.infer<typeof createUserSecuritySessionSchema>;

export type SecurityEventFilter = z.infer<typeof securityEventFilterSchema>;
export type VulnerabilityFilter = z.infer<typeof vulnerabilityFilterSchema>;
export type IncidentFilter = z.infer<typeof incidentFilterSchema>;
export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>; 