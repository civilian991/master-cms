// ============================================================================
// SECURITY TYPE DEFINITIONS
// ============================================================================

// Authentication Types
export type AuthenticationMethod = 
  | 'password' 
  | 'totp' 
  | 'sms' 
  | 'email' 
  | 'biometric_fingerprint' 
  | 'biometric_face' 
  | 'biometric_voice' 
  | 'hardware_key' 
  | 'backup_code' 
  | 'admin_override';

export type AuthenticationStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'success' 
  | 'failed' 
  | 'expired' 
  | 'blocked';

export type BiometricType = 
  | 'fingerprint' 
  | 'face' 
  | 'voice' 
  | 'iris' 
  | 'palm';

export type SecurityRiskLevel = 
  | 'very_low' 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export type ThreatType = 
  | 'brute_force' 
  | 'suspicious_location' 
  | 'device_anomaly' 
  | 'credential_stuffing' 
  | 'session_hijacking' 
  | 'account_takeover' 
  | 'malware' 
  | 'phishing';

export type DeviceTrustLevel = 
  | 'trusted' 
  | 'recognized' 
  | 'new' 
  | 'suspicious' 
  | 'blocked';

export type RecoveryMethod = 
  | 'backup_code' 
  | 'email_verification' 
  | 'sms_verification' 
  | 'security_questions' 
  | 'trusted_contact' 
  | 'admin_override';

export type ComplianceStandard = 
  | 'soc2' 
  | 'gdpr' 
  | 'hipaa' 
  | 'pci_dss' 
  | 'iso27001' 
  | 'nist';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface MFAConfiguration {
  id: string;
  userId: string;
  enabledMethods: AuthenticationMethod[];
  primaryMethod: AuthenticationMethod;
  backupMethods: AuthenticationMethod[];
  isRequired: boolean;
  gracePeriodEndDate?: Date;
  lastUpdated: Date;
  createdAt: Date;
}

export interface BiometricCredential {
  id: string;
  userId: string;
  type: BiometricType;
  credentialId: string;
  publicKey: string;
  counter: number;
  isActive: boolean;
  deviceInfo: DeviceInfo;
  enrollmentDate: Date;
  lastUsed?: Date;
  nickname?: string;
}

export interface DeviceInfo {
  id: string;
  fingerprint: string;
  userAgent: string;
  platform: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  timezone: string;
  language: string;
  ipAddress: string;
  location?: GeolocationData;
  isMobile: boolean;
  isTablet: boolean;
  trustLevel: DeviceTrustLevel;
  firstSeen: Date;
  lastSeen: Date;
  accessCount: number;
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  isVPN: boolean;
  isProxy: boolean;
  threatLevel: SecurityRiskLevel;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  sessionId: string;
  type: ThreatType;
  severity: SecurityRiskLevel;
  description: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: GeolocationData;
  context: Record<string, any>;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ThreatAnalysis {
  riskScore: number;
  riskLevel: SecurityRiskLevel;
  factors: ThreatFactor[];
  recommendations: string[];
  blockedReasons?: string[];
  requiresAdditionalAuth: boolean;
  allowedWithWarning: boolean;
  analysisTime: Date;
}

export interface ThreatFactor {
  type: string;
  severity: SecurityRiskLevel;
  score: number;
  description: string;
  evidence: Record<string, any>;
}

export interface SecuritySession {
  id: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  location?: GeolocationData;
  authenticationMethods: AuthenticationMethod[];
  riskScore: number;
  riskLevel: SecurityRiskLevel;
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export interface RecoveryCode {
  id: string;
  userId: string;
  code: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface BackupAuthMethod {
  id: string;
  userId: string;
  method: RecoveryMethod;
  isActive: boolean;
  data: Record<string, any>;
  lastVerified?: Date;
  createdAt: Date;
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  adminId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface SecurityPolicy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isActive: boolean;
  rules: SecurityRule[];
  complianceStandards: ComplianceStandard[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  type: string;
  condition: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
  isActive: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface MFASetupRequest {
  method: AuthenticationMethod;
  deviceInfo: Partial<DeviceInfo>;
  biometricData?: {
    type: BiometricType;
    credentialData: any;
  };
}

export interface MFASetupResponse {
  success: boolean;
  mfaId: string;
  qrCode?: string;
  backupCodes?: string[];
  setupToken?: string;
  expiresAt?: Date;
}

export interface AuthenticationRequest {
  userId: string;
  method: AuthenticationMethod;
  credential: string;
  deviceFingerprint: string;
  challengeResponse?: any;
  biometricAssertion?: any;
}

export interface AuthenticationResponse {
  success: boolean;
  sessionId?: string;
  requiresAdditionalAuth: boolean;
  availableMethods?: AuthenticationMethod[];
  challenge?: any;
  riskAssessment: ThreatAnalysis;
  blockedReason?: string;
}

export interface DeviceRegistrationRequest {
  deviceInfo: DeviceInfo;
  authenticationProof: string;
  trustLevel?: DeviceTrustLevel;
}

export interface DeviceRegistrationResponse {
  success: boolean;
  deviceId: string;
  trustLevel: DeviceTrustLevel;
  requiresAdditionalVerification: boolean;
}

export interface ThreatDetectionRequest {
  userId: string;
  sessionId: string;
  activity: SecurityActivity;
  context: Record<string, any>;
}

export interface ThreatDetectionResponse {
  isBlocked: boolean;
  riskScore: number;
  riskLevel: SecurityRiskLevel;
  detectedThreats: ThreatType[];
  recommendedActions: string[];
  requiresImmediateAction: boolean;
}

export interface SecurityActivity {
  type: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: GeolocationData;
  data: Record<string, any>;
}

export interface RecoveryRequest {
  method: RecoveryMethod;
  identifier: string; // email, phone, userId
  verificationData?: Record<string, any>;
}

export interface RecoveryResponse {
  success: boolean;
  recoveryToken?: string;
  expiresAt?: Date;
  nextStep?: string;
  availableMethods?: RecoveryMethod[];
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface MFASetupWizardProps {
  userId: string;
  onComplete: (mfaConfig: MFAConfiguration) => void;
  onCancel: () => void;
  allowedMethods?: AuthenticationMethod[];
  isRequired?: boolean;
}

export interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: AuthenticationResponse) => void;
  onError: (error: string) => void;
  biometricType: BiometricType;
  challenge?: any;
}

export interface DeviceManagementProps {
  userId: string;
  devices: DeviceInfo[];
  onDeviceAction: (deviceId: string, action: string) => void;
  onRefresh: () => void;
}

export interface SecurityDashboardProps {
  userId: string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export interface ThreatMonitorProps {
  userId?: string;
  organizationId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onThreatDetected?: (threat: SecurityEvent) => void;
}

export interface RecoveryFlowProps {
  onSuccess: (recoveryToken: string) => void;
  onCancel: () => void;
  availableMethods: RecoveryMethod[];
}

export interface AdminSecurityPanelProps {
  organizationId: string;
  onPolicyUpdate: (policy: SecurityPolicy) => void;
  onUserSecurityAction: (userId: string, action: string) => void;
}

export interface SecuritySettingsProps {
  userId: string;
  currentConfig: MFAConfiguration;
  onConfigUpdate: (config: Partial<MFAConfiguration>) => void;
  onBackup: () => void;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseMFASetupOptions {
  autoSave?: boolean;
  validateStrength?: boolean;
  allowedMethods?: AuthenticationMethod[];
}

export interface UseBiometricAuthOptions {
  timeout?: number;
  allowFallback?: boolean;
  preferredTypes?: BiometricType[];
}

export interface UseDeviceManagerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  trustLevelFilter?: DeviceTrustLevel[];
}

export interface UseSecurityMonitorOptions {
  realTime?: boolean;
  alertOnHigh?: boolean;
  autoResolve?: boolean;
  includeResolved?: boolean;
}

export interface UseRecoveryFlowOptions {
  preferredMethod?: RecoveryMethod;
  autoValidate?: boolean;
  maxAttempts?: number;
}

// ============================================================================
// CONSTANTS AND UTILITIES
// ============================================================================

export const SECURITY_RISK_SCORES = {
  VERY_LOW: { min: 0, max: 20 },
  LOW: { min: 21, max: 40 },
  MEDIUM: { min: 41, max: 60 },
  HIGH: { min: 61, max: 80 },
  CRITICAL: { min: 81, max: 100 },
} as const;

export const BIOMETRIC_SUPPORT = {
  FINGERPRINT: 'fingerprint',
  FACE: 'face',
  VOICE: 'voice',
  IRIS: 'iris',
  PALM: 'palm',
} as const;

export const DEFAULT_THREAT_THRESHOLDS = {
  BLOCK_SCORE: 80,
  WARNING_SCORE: 60,
  ADDITIONAL_AUTH_SCORE: 40,
  MONITORING_SCORE: 20,
} as const;

export const SESSION_TIMEOUTS = {
  LOW_RISK: 24 * 60 * 60 * 1000, // 24 hours
  MEDIUM_RISK: 8 * 60 * 60 * 1000, // 8 hours  
  HIGH_RISK: 2 * 60 * 60 * 1000, // 2 hours
  CRITICAL_RISK: 30 * 60 * 1000, // 30 minutes
} as const;

export const RECOVERY_CODE_CONFIG = {
  COUNT: 10,
  LENGTH: 8,
  EXPIRY_DAYS: 90,
  USAGE_LIMIT: 1,
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SecurityEventFilter = {
  userId?: string;
  severity?: SecurityRiskLevel[];
  type?: ThreatType[];
  dateRange?: { start: Date; end: Date };
  isResolved?: boolean;
  limit?: number;
  offset?: number;
};

export type DeviceFilter = {
  userId?: string;
  trustLevel?: DeviceTrustLevel[];
  platform?: string;
  isActive?: boolean;
  lastSeenRange?: { start: Date; end: Date };
};

export type SecurityMetrics = {
  totalEvents: number;
  threatsBlocked: number;
  successfulAuth: number;
  failedAuth: number;
  newDevices: number;
  riskDistribution: Record<SecurityRiskLevel, number>;
  methodUsage: Record<AuthenticationMethod, number>;
};

export type BiometricCapabilities = {
  fingerprint: boolean;
  face: boolean;
  voice: boolean;
  iris: boolean;
  palm: boolean;
  hardwareKey: boolean;
  platform: string;
};

export default {}; 