'use client';

import {
  MFAConfiguration,
  BiometricCredential,
  DeviceInfo,
  SecurityEvent,
  ThreatAnalysis,
  SecuritySession,
  RecoveryCode,
  BackupAuthMethod,
  SecurityAuditLog,
  SecurityPolicy,
  MFASetupRequest,
  MFASetupResponse,
  AuthenticationRequest,
  AuthenticationResponse,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  ThreatDetectionRequest,
  ThreatDetectionResponse,
  RecoveryRequest,
  RecoveryResponse,
  SecurityEventFilter,
  DeviceFilter,
  SecurityMetrics,
  BiometricCapabilities,
  AuthenticationMethod,
  BiometricType,
  DeviceTrustLevel,
  SecurityRiskLevel,
} from '../types/security.types';

class SecurityApiService {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCacheKey(endpoint: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramStr}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================================================
  // HTTP CLIENT WITH RETRY AND DEDUPLICATION
  // ============================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTTL?: number,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, { ...options, body: options.body });

    // Check cache first for GET requests
    if (options.method === 'GET' || !options.method) {
      if (useCache) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) return cached;
      }
    }

    // Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful GET requests
      if ((options.method === 'GET' || !options.method) && useCache && cacheTTL) {
        this.setCache(cacheKey, result, cacheTTL);
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    let lastError: Error;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }
        
        return await response.text() as any;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Network request failed');
        
        if (attempt === maxRetries - 1) break;
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // ============================================================================
  // MFA CONFIGURATION APIS
  // ============================================================================

  async getMFAConfiguration(userId: string): Promise<MFAConfiguration | null> {
    try {
      return await this.makeRequest<MFAConfiguration>(
        `/security/mfa/${userId}`,
        { method: 'GET' },
        300000 // 5 minutes cache
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async setupMFA(request: MFASetupRequest): Promise<MFASetupResponse> {
    const response = await this.makeRequest<MFASetupResponse>(
      '/security/mfa/setup',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );

    // Clear MFA cache after setup
    this.clearCacheByPattern('/security/mfa/');
    return response;
  }

  async updateMFAConfiguration(
    userId: string,
    updates: Partial<MFAConfiguration>
  ): Promise<MFAConfiguration> {
    const response = await this.makeRequest<MFAConfiguration>(
      `/security/mfa/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/mfa/');
    return response;
  }

  async disableMFA(userId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/security/mfa/${userId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/security/mfa/');
    return response;
  }

  // ============================================================================
  // AUTHENTICATION APIS
  // ============================================================================

  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResponse> {
    return await this.makeRequest<AuthenticationResponse>(
      '/security/auth/authenticate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );
  }

  async verifySession(sessionId: string): Promise<SecuritySession> {
    return await this.makeRequest<SecuritySession>(
      `/security/auth/sessions/${sessionId}`,
      { method: 'GET' },
      60000 // 1 minute cache
    );
  }

  async terminateSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/security/auth/sessions/${sessionId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/security/auth/sessions/');
    return response;
  }

  async getUserSessions(userId: string): Promise<SecuritySession[]> {
    return await this.makeRequest<SecuritySession[]>(
      `/security/auth/users/${userId}/sessions`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // BIOMETRIC AUTHENTICATION APIS
  // ============================================================================

  async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    return await this.makeRequest<BiometricCapabilities>(
      '/security/biometric/capabilities',
      { method: 'GET' },
      3600000 // 1 hour cache
    );
  }

  async enrollBiometric(
    userId: string,
    type: BiometricType,
    credentialData: any
  ): Promise<BiometricCredential> {
    const response = await this.makeRequest<BiometricCredential>(
      '/security/biometric/enroll',
      {
        method: 'POST',
        body: JSON.stringify({ userId, type, credentialData }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/biometric/');
    return response;
  }

  async getBiometricCredentials(userId: string): Promise<BiometricCredential[]> {
    return await this.makeRequest<BiometricCredential[]>(
      `/security/biometric/users/${userId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async deleteBiometricCredential(credentialId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/security/biometric/credentials/${credentialId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/security/biometric/');
    return response;
  }

  async verifyBiometric(
    credentialId: string,
    assertion: any
  ): Promise<AuthenticationResponse> {
    return await this.makeRequest<AuthenticationResponse>(
      '/security/biometric/verify',
      {
        method: 'POST',
        body: JSON.stringify({ credentialId, assertion }),
      },
      0,
      false
    );
  }

  // ============================================================================
  // DEVICE MANAGEMENT APIS
  // ============================================================================

  async registerDevice(request: DeviceRegistrationRequest): Promise<DeviceRegistrationResponse> {
    const response = await this.makeRequest<DeviceRegistrationResponse>(
      '/security/devices/register',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/devices/');
    return response;
  }

  async getUserDevices(userId: string, filter?: DeviceFilter): Promise<DeviceInfo[]> {
    const params = filter ? `?${new URLSearchParams(filter as any)}` : '';
    return await this.makeRequest<DeviceInfo[]>(
      `/security/devices/users/${userId}${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async updateDeviceTrust(
    deviceId: string,
    trustLevel: DeviceTrustLevel
  ): Promise<DeviceInfo> {
    const response = await this.makeRequest<DeviceInfo>(
      `/security/devices/${deviceId}/trust`,
      {
        method: 'PATCH',
        body: JSON.stringify({ trustLevel }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/devices/');
    return response;
  }

  async revokeDevice(deviceId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/security/devices/${deviceId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/security/devices/');
    return response;
  }

  async remoteWipeDevice(deviceId: string): Promise<{ success: boolean }> {
    return await this.makeRequest<{ success: boolean }>(
      `/security/devices/${deviceId}/wipe`,
      { method: 'POST' },
      0,
      false
    );
  }

  // ============================================================================
  // THREAT DETECTION APIS
  // ============================================================================

  async analyzeThreat(request: ThreatDetectionRequest): Promise<ThreatDetectionResponse> {
    return await this.makeRequest<ThreatDetectionResponse>(
      '/security/threats/analyze',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );
  }

  async getSecurityEvents(filter?: SecurityEventFilter): Promise<SecurityEvent[]> {
    const params = filter ? `?${new URLSearchParams(filter as any)}` : '';
    return await this.makeRequest<SecurityEvent[]>(
      `/security/events${params}`,
      { method: 'GET' },
      60000 // 1 minute cache
    );
  }

  async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    notes?: string
  ): Promise<SecurityEvent> {
    const response = await this.makeRequest<SecurityEvent>(
      `/security/events/${eventId}/resolve`,
      {
        method: 'PATCH',
        body: JSON.stringify({ resolvedBy, notes }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/events');
    return response;
  }

  async getSecurityMetrics(
    timeRange: string,
    userId?: string
  ): Promise<SecurityMetrics> {
    const params = new URLSearchParams({ timeRange });
    if (userId) params.set('userId', userId);
    
    return await this.makeRequest<SecurityMetrics>(
      `/security/metrics?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // RECOVERY APIS
  // ============================================================================

  async generateRecoveryCodes(userId: string): Promise<RecoveryCode[]> {
    const response = await this.makeRequest<RecoveryCode[]>(
      `/security/recovery/codes/${userId}`,
      { method: 'POST' },
      0,
      false
    );

    this.clearCacheByPattern('/security/recovery/');
    return response;
  }

  async getRecoveryCodes(userId: string): Promise<RecoveryCode[]> {
    return await this.makeRequest<RecoveryCode[]>(
      `/security/recovery/codes/${userId}`,
      { method: 'GET' },
      0, // Don't cache recovery codes
      false
    );
  }

  async initiateRecovery(request: RecoveryRequest): Promise<RecoveryResponse> {
    return await this.makeRequest<RecoveryResponse>(
      '/security/recovery/initiate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      0,
      false
    );
  }

  async verifyRecovery(
    recoveryToken: string,
    verificationCode: string
  ): Promise<{ success: boolean; sessionToken?: string }> {
    return await this.makeRequest<{ success: boolean; sessionToken?: string }>(
      '/security/recovery/verify',
      {
        method: 'POST',
        body: JSON.stringify({ recoveryToken, verificationCode }),
      },
      0,
      false
    );
  }

  async getBackupMethods(userId: string): Promise<BackupAuthMethod[]> {
    return await this.makeRequest<BackupAuthMethod[]>(
      `/security/recovery/backup-methods/${userId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async setupBackupMethod(
    userId: string,
    method: string,
    data: Record<string, any>
  ): Promise<BackupAuthMethod> {
    const response = await this.makeRequest<BackupAuthMethod>(
      '/security/recovery/backup-methods',
      {
        method: 'POST',
        body: JSON.stringify({ userId, method, data }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/recovery/');
    return response;
  }

  // ============================================================================
  // ADMIN & POLICY APIS
  // ============================================================================

  async getSecurityPolicies(organizationId: string): Promise<SecurityPolicy[]> {
    return await this.makeRequest<SecurityPolicy[]>(
      `/security/policies?organizationId=${organizationId}`,
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    const response = await this.makeRequest<SecurityPolicy>(
      '/security/policies',
      {
        method: 'POST',
        body: JSON.stringify(policy),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/policies');
    return response;
  }

  async updateSecurityPolicy(
    policyId: string,
    updates: Partial<SecurityPolicy>
  ): Promise<SecurityPolicy> {
    const response = await this.makeRequest<SecurityPolicy>(
      `/security/policies/${policyId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/security/policies');
    return response;
  }

  async getAuditLogs(
    filter: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<SecurityAuditLog[]> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value.toString());
      }
    });

    return await this.makeRequest<SecurityAuditLog[]>(
      `/security/audit-logs?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async performAdminAction(
    action: string,
    targetUserId: string,
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return await this.makeRequest<{ success: boolean; message: string }>(
      '/security/admin/actions',
      {
        method: 'POST',
        body: JSON.stringify({ action, targetUserId, adminId, reason }),
      },
      0,
      false
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async checkSecurityStatus(userId: string): Promise<{
    mfaEnabled: boolean;
    biometricsEnabled: boolean;
    trustedDevices: number;
    recentThreats: number;
    riskLevel: SecurityRiskLevel;
  }> {
    return await this.makeRequest(
      `/security/status/${userId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async validateSecurityCompliance(
    organizationId: string
  ): Promise<{
    compliant: boolean;
    standards: Record<string, boolean>;
    issues: string[];
    recommendations: string[];
  }> {
    return await this.makeRequest(
      `/security/compliance/${organizationId}`,
      { method: 'GET' },
      3600000 // 1 hour cache
    );
  }

  // Clear all caches
  clearAllCaches(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const securityApi = new SecurityApiService();
export default securityApi; 