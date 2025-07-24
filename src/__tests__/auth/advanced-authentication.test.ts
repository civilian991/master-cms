import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MFAService } from '../../lib/auth/mfa';
import { SessionManager } from '../../lib/auth/session-manager';
import { PasswordPolicyService } from '../../lib/auth/password-policy';
import { AuthenticationAnalyticsService } from '../../lib/auth/analytics';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    userSecurityProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    userSecuritySession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    securityIncident: {
      count: jest.fn(),
    },
    policyViolation: {
      count: jest.fn(),
    },
    vulnerability: {
      count: jest.fn(),
    },
    complianceRecord: {
      count: jest.fn(),
    },
    encryptionKey: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    keyUsageLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock crypto
const mockCrypto = {
  randomUUID: jest.fn(() => 'mock-uuid'),
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-random-string'),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mock-hash'),
    })),
  })),
  randomInt: jest.fn(() => 123456),
};

jest.mock('crypto', () => mockCrypto);

// Mock otplib
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'mock-secret'),
    keyuri: jest.fn(() => 'otpauth://mock-uri'),
    verify: jest.fn(() => true),
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock-qr-code')),
}));

import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';

describe('Advanced Authentication System', () => {
  let mfaService: MFAService;
  let sessionManager: SessionManager;
  let passwordPolicyService: PasswordPolicyService;
  let authAnalyticsService: AuthenticationAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mfaService = new MFAService();
    sessionManager = new SessionManager();
    passwordPolicyService = new PasswordPolicyService();
    authAnalyticsService = new AuthenticationAnalyticsService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('MFA Service', () => {
    const mockUserId = 'user-123';
    const mockSiteId = 'site-123';

    describe('TOTP Setup', () => {
      it('should setup TOTP successfully', async () => {
        // Mock user lookup
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
        });

        // Mock profile upsert
        (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({
          id: 'profile-123',
          userId: mockUserId,
        });

        // Mock key usage log creation
        (prisma.keyUsageLog.create as jest.Mock).mockResolvedValue({});

        // Mock security event creation
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const result = await mfaService.setupTOTP(mockUserId, mockSiteId);

        expect(result).toHaveProperty('secret');
        expect(result).toHaveProperty('qrCode');
        expect(result).toHaveProperty('backupCodes');
        expect(result.backupCodes).toHaveLength(10);
        expect(prisma.userSecurityProfile.upsert).toHaveBeenCalled();
        expect(prisma.securityEvent.create).toHaveBeenCalled();
      });

      it('should handle user not found error', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(
          mfaService.setupTOTP(mockUserId, mockSiteId)
        ).rejects.toThrow('User not found');
      });
    });

    describe('TOTP Verification', () => {
      it('should verify TOTP token successfully', async () => {
        // Mock getting temp secret
        (prisma.keyUsageLog.findFirst as jest.Mock).mockResolvedValue({
          context: 'mock-secret',
        });

        // Mock profile update
        (prisma.userSecurityProfile.update as jest.Mock).mockResolvedValue({});

        // Mock encryption key creation
        (prisma.encryptionKey.create as jest.Mock).mockResolvedValue({});

        const result = await mfaService.verifyTOTPSetup(mockUserId, mockSiteId, '123456');

        expect(result).toBe(true);
        expect(prisma.userSecurityProfile.update).toHaveBeenCalledWith({
          where: { userId: mockUserId },
          data: {
            mfaEnabled: true,
            lastMFAVerification: expect.any(Date),
          },
        });
      });

      it('should fail verification with invalid token', async () => {
        (prisma.keyUsageLog.findFirst as jest.Mock).mockResolvedValue({
          context: 'mock-secret',
        });

        // Mock authenticator to return false
        const { authenticator } = await import('otplib');
        (authenticator.verify as jest.Mock).mockReturnValue(false);

        const result = await mfaService.verifyTOTPSetup(mockUserId, mockSiteId, 'invalid');

        expect(result).toBe(false);
        expect(prisma.securityEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              eventType: 'MFA_VERIFICATION_FAILED',
            }),
          })
        );
      });
    });

    describe('SMS Setup', () => {
      it('should setup SMS MFA successfully', async () => {
        (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({});
        (prisma.keyUsageLog.create as jest.Mock).mockResolvedValue({});
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const result = await mfaService.setupSMS(mockUserId, mockSiteId, '+1234567890');

        expect(result).toHaveProperty('verificationCode');
        expect(result).toHaveProperty('expiresAt');
        expect(result.verificationCode).toMatch(/^\d{6}$/);
        expect(prisma.userSecurityProfile.upsert).toHaveBeenCalled();
      });
    });

    describe('MFA Status', () => {
      it('should return MFA status correctly', async () => {
        (prisma.userSecurityProfile.findUnique as jest.Mock).mockResolvedValue({
          mfaEnabled: true,
          mfaMethod: 'TOTP',
          mfaBackupCodes: ['code1', 'code2', 'code3'],
          lastMFAVerification: new Date(),
        });

        const status = await mfaService.getMFAStatus(mockUserId);

        expect(status).toEqual({
          enabled: true,
          method: 'TOTP',
          backupCodesRemaining: 3,
          lastVerification: expect.any(Date),
        });
      });

      it('should handle user with no security profile', async () => {
        (prisma.userSecurityProfile.findUnique as jest.Mock).mockResolvedValue(null);

        const status = await mfaService.getMFAStatus(mockUserId);

        expect(status).toEqual({
          enabled: false,
          backupCodesRemaining: 0,
        });
      });
    });
  });

  describe('Session Manager', () => {
    const mockSessionData = {
      userId: 'user-123',
      siteId: 'site-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: {
        country: 'United States',
        city: 'San Francisco',
      },
      deviceInfo: {
        type: 'desktop' as const,
        os: 'Windows',
        browser: 'Chrome',
      },
    };

    describe('Session Creation', () => {
      it('should create session successfully', async () => {
        // Mock profile creation
        (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({
          id: 'profile-123',
          userId: 'user-123',
        });

        // Mock session limits check
        (prisma.userSecuritySession.count as jest.Mock).mockResolvedValue(2);

        // Mock recent sessions for suspicious activity check
        (prisma.userSecuritySession.findMany as jest.Mock).mockResolvedValue([]);

        // Mock session creation
        (prisma.userSecuritySession.create as jest.Mock).mockResolvedValue({
          sessionId: 'session-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        // Mock session count update
        (prisma.userSecuritySession.count as jest.Mock).mockResolvedValue(3);

        const result = await sessionManager.createSession(mockSessionData);

        expect(result).toHaveProperty('sessionId');
        expect(result).toHaveProperty('expiresAt');
        expect(result).toHaveProperty('trustedDevice');
        expect(result).toHaveProperty('warningFlags');
        expect(prisma.userSecuritySession.create).toHaveBeenCalled();
      });

      it('should detect suspicious activity', async () => {
        (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({
          id: 'profile-123',
        });

        // Mock recent sessions with different IP
        (prisma.userSecuritySession.findMany as jest.Mock).mockResolvedValue([
          {
            ipAddress: '10.0.0.1',
            deviceFingerprint: 'different-fingerprint',
            location: { country: 'Canada' },
            createdAt: new Date(Date.now() - 60 * 1000), // 1 minute ago
          },
        ]);

        (prisma.userSecuritySession.count as jest.Mock).mockResolvedValue(1);
        (prisma.userSecuritySession.create as jest.Mock).mockResolvedValue({
          sessionId: 'session-123',
        });

        const result = await sessionManager.createSession(mockSessionData);

        expect(result.warningFlags).toContain('new_ip_address');
        expect(result.warningFlags).toContain('new_device');
        expect(result.warningFlags).toContain('location_anomaly');
      });
    });

    describe('Session Validation', () => {
      it('should validate active session successfully', async () => {
        const mockSession = {
          sessionId: 'session-123',
          active: true,
          terminated: false,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          profile: {
            userId: 'user-123',
            user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
          },
          suspicious: false,
          verified: true,
        };

        (prisma.userSecuritySession.findUnique as jest.Mock).mockResolvedValue(mockSession);
        (prisma.userSecuritySession.update as jest.Mock).mockResolvedValue({});

        const result = await sessionManager.validateSession('session-123');

        expect(result.valid).toBe(true);
        expect(result.session).toBeDefined();
        expect(result.warnings).toHaveLength(0);
      });

      it('should reject expired session', async () => {
        const mockSession = {
          sessionId: 'session-123',
          active: true,
          terminated: false,
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (expired)
          lastActivity: new Date(Date.now() - 30 * 60 * 1000),
        };

        (prisma.userSecuritySession.findUnique as jest.Mock).mockResolvedValue(mockSession);
        (prisma.userSecuritySession.update as jest.Mock).mockResolvedValue({});

        const result = await sessionManager.validateSession('session-123');

        expect(result.valid).toBe(false);
        expect(result.warnings).toContain('Session expired');
      });
    });

    describe('Session Termination', () => {
      it('should terminate session successfully', async () => {
        const mockSession = {
          sessionId: 'session-123',
          profile: { userId: 'user-123' },
          siteId: 'site-123',
        };

        (prisma.userSecuritySession.findUnique as jest.Mock).mockResolvedValue(mockSession);
        (prisma.userSecuritySession.update as jest.Mock).mockResolvedValue({});
        (prisma.userSecuritySession.count as jest.Mock).mockResolvedValue(0);
        (prisma.userSecurityProfile.update as jest.Mock).mockResolvedValue({});

        const result = await sessionManager.terminateSession('session-123', 'user_request');

        expect(result).toBe(true);
        expect(prisma.userSecuritySession.update).toHaveBeenCalledWith({
          where: { sessionId: 'session-123' },
          data: {
            active: false,
            terminated: true,
            terminatedBy: undefined,
            terminatedReason: 'user_request',
          },
        });
      });
    });
  });

  describe('Password Policy Service', () => {
    const mockUserInfo = {
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    };

    describe('Password Validation', () => {
      it('should validate strong password successfully', async () => {
        // Mock password history check
        (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

        const result = await passwordPolicyService.validatePassword(
          'StrongPassword123!@#',
          'default',
          mockUserInfo,
          'user-123'
        );

        expect(result.isValid).toBe(true);
        expect(result.strength).toBeOneOf(['good', 'strong', 'very-strong']);
        expect(result.errors).toHaveLength(0);
        expect(result.score).toBeGreaterThan(50);
      });

      it('should reject weak password', async () => {
        const result = await passwordPolicyService.validatePassword(
          'password',
          'default',
          mockUserInfo
        );

        expect(result.isValid).toBe(false);
        expect(result.strength).toBe('very-weak');
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should detect user information in password', async () => {
        const result = await passwordPolicyService.validatePassword(
          'testuser123',
          'default',
          mockUserInfo
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must not contain personal information');
      });

      it('should check password history', async () => {
        // Mock password history with matching hash
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
          {
            metadata: { passwordHash: 'hashed-password' },
          },
        ]);

        const result = await passwordPolicyService.validatePassword(
          'ReusedPassword123!',
          'default',
          mockUserInfo,
          'user-123'
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password has been used recently and cannot be reused');
      });
    });

    describe('Password Change', () => {
      it('should change password successfully', async () => {
        const mockUser = {
          id: 'user-123',
          password: 'hashed-old-password',
          email: 'test@example.com',
          name: 'Test User',
          securityProfile: {
            mfaEnabled: false,
          },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Current password is correct
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
        (prisma.user.update as jest.Mock).mockResolvedValue({});
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
        (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]); // No password history

        const result = await passwordPolicyService.changePassword(
          'user-123',
          'oldpassword',
          'NewStrongPassword123!',
          'NewStrongPassword123!',
          'site-123'
        );

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(prisma.user.update).toHaveBeenCalled();
      });

      it('should reject incorrect current password', async () => {
        const mockUser = {
          password: 'hashed-password',
          email: 'test@example.com',
          name: 'Test User',
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Incorrect current password

        const result = await passwordPolicyService.changePassword(
          'user-123',
          'wrongpassword',
          'NewPassword123!',
          'NewPassword123!',
          'site-123'
        );

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Current password is incorrect');
      });

      it('should reject mismatched password confirmation', async () => {
        const result = await passwordPolicyService.changePassword(
          'user-123',
          'oldpassword',
          'NewPassword123!',
          'DifferentPassword123!',
          'site-123'
        );

        expect(result.success).toBe(false);
        expect(result.errors).toContain('New password and confirmation do not match');
      });
    });

    describe('Password Generation', () => {
      it('should generate secure password with default policy', () => {
        const password = passwordPolicyService.generateSecurePassword(16, 'default');

        expect(password).toHaveLength(16);
        expect(password).toMatch(/[a-z]/); // Contains lowercase
        expect(password).toMatch(/[A-Z]/); // Contains uppercase
        expect(password).toMatch(/[0-9]/); // Contains numbers
        expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/); // Contains special chars
      });

      it('should generate password with strict policy', () => {
        const password = passwordPolicyService.generateSecurePassword(20, 'strict');

        expect(password).toHaveLength(20);
        // Should meet strict requirements
      });
    });

    describe('Password Expiry', () => {
      it('should check password expiry correctly', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        (prisma.userSecurityProfile.findUnique as jest.Mock).mockResolvedValue({
          passwordExpiresAt: futureDate,
        });

        const result = await passwordPolicyService.checkPasswordExpiry('user-123');

        expect(result.expired).toBe(false);
        expect(result.daysUntilExpiry).toBe(30);
        expect(result.expiresAt).toEqual(futureDate);
      });

      it('should detect expired password', async () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

        (prisma.userSecurityProfile.findUnique as jest.Mock).mockResolvedValue({
          passwordExpiresAt: pastDate,
        });

        const result = await passwordPolicyService.checkPasswordExpiry('user-123');

        expect(result.expired).toBe(true);
        expect(result.daysUntilExpiry).toBe(0);
      });
    });
  });

  describe('Authentication Analytics Service', () => {
    beforeEach(() => {
      // Mock date to ensure consistent test results
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('Authentication Metrics', () => {
      it('should calculate authentication metrics correctly', async () => {
        const mockEvents = [
          { eventType: 'LOGIN_SUCCESS', success: true, userId: 'user1' },
          { eventType: 'LOGIN_SUCCESS', success: true, userId: 'user2' },
          { eventType: 'LOGIN_FAILURE', success: false, userId: 'user1' },
          { eventType: 'MFA_VERIFICATION', success: true, userId: 'user1' },
          { eventType: 'ACCOUNT_LOCKED', success: false, userId: 'user3' },
        ];

        (prisma.securityEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);
        (prisma.user.count as jest.Mock).mockResolvedValue(5); // New users

        const metrics = await authAnalyticsService.getAuthenticationMetrics('site-123');

        expect(metrics.totalLogins).toBe(3); // 2 success + 1 failure
        expect(metrics.successfulLogins).toBe(2);
        expect(metrics.failedLogins).toBe(1);
        expect(metrics.successRate).toBe(66.66666666666666); // 2/3 * 100
        expect(metrics.mfaUsage).toBe(1);
        expect(metrics.uniqueUsers).toBe(3);
        expect(metrics.newUsers).toBe(5);
        expect(metrics.blockedAttempts).toBe(1);
      });
    });

    describe('Security Metrics', () => {
      it('should calculate security metrics correctly', async () => {
        const mockSecurityEvents = [
          { eventType: 'SUSPICIOUS_ACTIVITY', severity: 'HIGH' },
          { eventType: 'SUSPICIOUS_ACTIVITY', severity: 'MEDIUM' },
        ];

        (prisma.securityEvent.findMany as jest.Mock).mockResolvedValue(mockSecurityEvents);
        (prisma.securityIncident.count as jest.Mock).mockResolvedValue(3);
        (prisma.policyViolation.count as jest.Mock).mockResolvedValue(2);
        (prisma.vulnerability.count as jest.Mock).mockResolvedValue(5);
        (prisma.complianceRecord.count as jest.Mock)
          .mockResolvedValueOnce(10) // Total records
          .mockResolvedValueOnce(8); // Compliant records

        const metrics = await authAnalyticsService.getSecurityMetrics('site-123');

        expect(metrics.suspiciousActivities).toBe(2);
        expect(metrics.securityIncidents).toBe(3);
        expect(metrics.policyViolations).toBe(2);
        expect(metrics.vulnerabilities).toBe(5);
        expect(metrics.complianceScore).toBe(80); // 8/10 * 100
      });
    });

    describe('User Risk Assessment', () => {
      it('should assess user risk correctly', async () => {
        const mockProfile = {
          mfaEnabled: false,
          riskScore: 45,
          riskFactors: ['unusual_location', 'new_device'],
          failedLoginAttempts: 2,
          lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          activeSessions: 3,
        };

        (prisma.userSecurityProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

        const assessment = await authAnalyticsService.assessUserRisk('user-123', 'site-123');

        expect(assessment.overallRisk).toBeGreaterThan(30); // Should have some risk
        expect(assessment.riskLevel).toBeOneOf(['low', 'medium', 'high', 'critical']);
        expect(assessment.factors.length).toBeGreaterThan(0);
        expect(assessment.recommendations.length).toBeGreaterThan(0);
        expect(assessment.recommendations).toContain('Enable multi-factor authentication');
      });

      it('should handle user with no security profile', async () => {
        (prisma.userSecurityProfile.findUnique as jest.Mock).mockResolvedValue(null);

        const assessment = await authAnalyticsService.assessUserRisk('user-123', 'site-123');

        expect(assessment.overallRisk).toBe(50);
        expect(assessment.riskLevel).toBe('medium');
        expect(assessment.factors).toEqual([
          { factor: 'No security profile', impact: 50, description: 'User has no security profile configured' },
        ]);
      });
    });

    describe('Anomaly Detection', () => {
      it('should detect authentication anomalies', async () => {
        // Mock login times (unusual hours)
        (prisma.securityEvent.findMany as jest.Mock).mockResolvedValue([
          { createdAt: new Date('2024-01-15T03:00:00Z') }, // 3 AM
          { createdAt: new Date('2024-01-15T04:00:00Z') }, // 4 AM
        ]);

        // Mock new devices
        (prisma.userSecuritySession.findMany as jest.Mock).mockResolvedValue([
          { deviceFingerprint: 'device1' },
          { deviceFingerprint: 'device2' },
          { deviceFingerprint: 'device3' },
          { deviceFingerprint: 'device4' }, // 4 unique devices
        ]);

        // Mock failed attempts
        (prisma.securityEvent.count as jest.Mock).mockResolvedValue(25); // High failed attempts

        const anomalies = await authAnalyticsService.detectAnomalies('site-123', 'user-123');

        expect(anomalies.anomalies.length).toBeGreaterThan(0);
        expect(anomalies.riskFactors.length).toBeGreaterThan(0);
        expect(anomalies.recommendations.length).toBeGreaterThan(0);

        // Should detect multiple anomaly types
        const anomalyTypes = anomalies.anomalies.map(a => a.type);
        expect(anomalyTypes).toContain('unusual_login_time');
        expect(anomalyTypes).toContain('multiple_new_devices');
        expect(anomalyTypes).toContain('brute_force_pattern');
      });
    });

    describe('Authentication Trends', () => {
      it('should generate trend data correctly', async () => {
        const mockEvents = [
          { eventType: 'LOGIN_SUCCESS', createdAt: new Date('2024-01-15T09:00:00Z'), success: true },
          { eventType: 'LOGIN_FAILURE', createdAt: new Date('2024-01-15T10:00:00Z'), success: false },
          { eventType: 'MFA_VERIFICATION', createdAt: new Date('2024-01-15T11:00:00Z'), success: true },
          { eventType: 'SUSPICIOUS_ACTIVITY', createdAt: new Date('2024-01-15T12:00:00Z'), success: false },
        ];

        (prisma.securityEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        const trends = await authAnalyticsService.getAuthenticationTrends('site-123', 7, 'day');

        expect(trends.labels.length).toBeGreaterThan(0);
        expect(trends.datasets).toHaveLength(4); // 4 different event types
        expect(trends.datasets[0].label).toBe('Login Success');
        expect(trends.datasets[1].label).toBe('Login Failure');
        expect(trends.datasets[2].label).toBe('MFA Usage');
        expect(trends.datasets[3].label).toBe('Suspicious Activity');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      // Mock user creation
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      };

      // Mock MFA setup
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userSecurityProfile.upsert as jest.Mock).mockResolvedValue({ id: 'profile-123' });

      // Setup MFA
      const mfaSetup = await mfaService.setupTOTP('user-123', 'site-123');
      expect(mfaSetup).toHaveProperty('secret');

      // Mock session creation
      (prisma.userSecuritySession.count as jest.Mock).mockResolvedValue(0);
      (prisma.userSecuritySession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userSecuritySession.create as jest.Mock).mockResolvedValue({
        sessionId: 'session-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Create session
      const session = await sessionManager.createSession({
        userId: 'user-123',
        siteId: 'site-123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      });

      expect(session).toHaveProperty('sessionId');

      // Mock password change
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      // Change password
      const passwordChange = await passwordPolicyService.changePassword(
        'user-123',
        'oldpassword',
        'NewSecurePassword123!',
        'NewSecurePassword123!',
        'site-123'
      );

      expect(passwordChange.success).toBe(true);

      // All operations should have triggered security events
      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(3); // MFA setup, session creation, password change
    });
  });
});

// Helper function for test expectations
expect.extend({
  toBeOneOf(received, validOptions) {
    const pass = validOptions.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validOptions.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${validOptions.join(', ')}`,
        pass: false,
      };
    }
  },
}); 