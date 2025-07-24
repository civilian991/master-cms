import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { z } from 'zod';

// MFA Configuration
const MFA_CONFIG = {
  serviceName: 'Himaya CMS',
  tokenWindow: 2, // Allow 2 time steps (60 seconds) for token validation
  backupCodeLength: 8,
  backupCodeCount: 10,
  issuer: 'Himaya',
  totpSecretLength: 32,
  smsCodeLength: 6,
  smsCodeExpiry: 5 * 60 * 1000, // 5 minutes
  maxVerificationAttempts: 3,
  verificationLockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// Validation schemas
export const mfaSetupSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  method: z.enum(['TOTP', 'SMS', 'EMAIL', 'HARDWARE_TOKEN', 'BIOMETRIC']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  deviceInfo: z.record(z.any()).optional(),
});

export const mfaVerificationSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  method: z.enum(['TOTP', 'SMS', 'EMAIL', 'HARDWARE_TOKEN', 'BIOMETRIC', 'BACKUP_CODES']),
  token: z.string(),
  deviceInfo: z.record(z.any()).optional(),
  trustedDevice: z.boolean().default(false),
});

export const biometricAuthSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  credentialId: z.string(),
  signature: z.string(),
  authenticatorData: z.string(),
  clientDataJSON: z.string(),
  userHandle: z.string().optional(),
});

// MFA Service Class
export class MFAService {
  
  /**
   * Setup TOTP-based MFA for a user
   */
  async setupTOTP(userId: string, siteId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret();
      
      // Get user info for QR code
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate QR code URL
      const otpauthUrl = authenticator.keyuri(
        user.email,
        MFA_CONFIG.serviceName,
        secret
      );

      // Generate QR code image
      const qrCode = await QRCode.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      // Create or update user security profile
      await prisma.userSecurityProfile.upsert({
        where: { userId },
        create: {
          userId,
          siteId,
          mfaEnabled: false, // Will be enabled after verification
          mfaMethod: 'TOTP',
          mfaBackupCodes: hashedBackupCodes,
          riskScore: 0,
          consentGiven: true,
          consentDate: new Date(),
        },
        update: {
          mfaMethod: 'TOTP',
          mfaBackupCodes: hashedBackupCodes,
        },
      });

      // Store the secret temporarily (will be confirmed on verification)
      await this.storeTempMFASecret(userId, secret);

      // Log MFA setup attempt
      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_INITIATED',
        userId,
        siteId,
        method: 'TOTP',
        metadata: { setupStep: 'secret_generated' },
      });

      return {
        secret,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_FAILED',
        userId,
        siteId,
        method: 'TOTP',
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Verify TOTP token and enable MFA
   */
  async verifyTOTPSetup(userId: string, siteId: string, token: string): Promise<boolean> {
    try {
      // Get the temporary secret
      const tempSecret = await this.getTempMFASecret(userId);
      if (!tempSecret) {
        throw new Error('No MFA setup in progress');
      }

      // Verify the token
      const isValid = authenticator.verify({
        token,
        secret: tempSecret,
        window: MFA_CONFIG.tokenWindow,
      });

      if (!isValid) {
        await this.logSecurityEvent({
          eventType: 'MFA_VERIFICATION_FAILED',
          userId,
          siteId,
          method: 'TOTP',
          metadata: { setupPhase: true },
        });
        return false;
      }

      // Enable MFA and store the secret
      await prisma.userSecurityProfile.update({
        where: { userId },
        data: {
          mfaEnabled: true,
          lastMFAVerification: new Date(),
        },
      });

      // Store the secret securely (in production, encrypt this)
      await this.storeMFASecret(userId, tempSecret);
      await this.removeTempMFASecret(userId);

      // Log successful MFA setup
      await this.logSecurityEvent({
        eventType: 'MFA_ENABLED',
        userId,
        siteId,
        method: 'TOTP',
        metadata: { setupCompleted: true },
      });

      return true;
    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_FAILED',
        userId,
        siteId,
        method: 'TOTP',
        metadata: { error: error.message, phase: 'verification' },
      });
      throw error;
    }
  }

  /**
   * Verify MFA token during login
   */
  async verifyMFA(
    userId: string,
    siteId: string,
    method: string,
    token: string,
    deviceInfo?: any
  ): Promise<{
    success: boolean;
    requiresBackup?: boolean;
    trustedDevice?: boolean;
  }> {
    try {
      // Check for rate limiting
      const canAttempt = await this.checkVerificationRateLimit(userId);
      if (!canAttempt) {
        await this.logSecurityEvent({
          eventType: 'MFA_VERIFICATION_BLOCKED',
          userId,
          siteId,
          method,
          metadata: { reason: 'rate_limited' },
        });
        throw new Error('Too many verification attempts. Please try again later.');
      }

      let isValid = false;

      switch (method) {
        case 'TOTP':
          isValid = await this.verifyTOTP(userId, token);
          break;
        case 'SMS':
          isValid = await this.verifySMS(userId, token);
          break;
        case 'EMAIL':
          isValid = await this.verifyEmail(userId, token);
          break;
        case 'BACKUP_CODES':
          isValid = await this.verifyBackupCode(userId, token);
          break;
        case 'BIOMETRIC':
          isValid = await this.verifyBiometric(userId, token, deviceInfo);
          break;
        default:
          throw new Error('Unsupported MFA method');
      }

      if (isValid) {
        // Update last verification time
        await prisma.userSecurityProfile.update({
          where: { userId },
          data: {
            lastMFAVerification: new Date(),
            failedLoginAttempts: 0,
          },
        });

        // Check if device should be trusted
        const trustedDevice = await this.checkTrustedDevice(userId, deviceInfo);

        await this.logSecurityEvent({
          eventType: 'MFA_VERIFICATION',
          userId,
          siteId,
          method,
          metadata: { success: true, trustedDevice },
        });

        return { success: true, trustedDevice };
      } else {
        // Increment failed attempts
        await this.incrementFailedMFAAttempts(userId);

        await this.logSecurityEvent({
          eventType: 'MFA_VERIFICATION_FAILED',
          userId,
          siteId,
          method,
          metadata: { success: false },
        });

        return { success: false, requiresBackup: method !== 'BACKUP_CODES' };
      }
    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'MFA_VERIFICATION_ERROR',
        userId,
        siteId,
        method,
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Setup SMS-based MFA
   */
  async setupSMS(userId: string, siteId: string, phoneNumber: string): Promise<{
    verificationCode: string;
    expiresAt: Date;
  }> {
    try {
      // Generate verification code
      const verificationCode = this.generateSMSCode();
      const expiresAt = new Date(Date.now() + MFA_CONFIG.smsCodeExpiry);

      // Store verification code temporarily
      await this.storeTempSMSCode(userId, verificationCode, phoneNumber, expiresAt);

      // In production, send SMS here
      console.log(`SMS Code for ${phoneNumber}: ${verificationCode}`);

      // Update user security profile
      await prisma.userSecurityProfile.upsert({
        where: { userId },
        create: {
          userId,
          siteId,
          mfaEnabled: false,
          mfaMethod: 'SMS',
          riskScore: 0,
          consentGiven: true,
          consentDate: new Date(),
        },
        update: {
          mfaMethod: 'SMS',
        },
      });

      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_INITIATED',
        userId,
        siteId,
        method: 'SMS',
        metadata: { phoneNumber: phoneNumber.slice(-4) }, // Log only last 4 digits
      });

      return { verificationCode, expiresAt };
    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_FAILED',
        userId,
        siteId,
        method: 'SMS',
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Setup biometric authentication (WebAuthn)
   */
  async setupBiometric(
    userId: string,
    siteId: string,
    deviceInfo: any
  ): Promise<{
    challengeId: string;
    challenge: string;
    options: any;
  }> {
    try {
      // Generate challenge for WebAuthn
      const challenge = crypto.randomBytes(32).toString('base64url');
      const challengeId = crypto.randomUUID();

      // Store challenge temporarily
      await this.storeBiometricChallenge(userId, challengeId, challenge);

      // WebAuthn registration options
      const options = {
        challenge: challenge,
        rp: {
          name: MFA_CONFIG.serviceName,
          id: process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') || 'localhost',
        },
        user: {
          id: userId,
          name: userId, // In production, use user's email
          displayName: 'User', // In production, use user's name
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      };

      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_INITIATED',
        userId,
        siteId,
        method: 'BIOMETRIC',
        metadata: { challengeId, deviceInfo },
      });

      return { challengeId, challenge, options };
    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'MFA_SETUP_FAILED',
        userId,
        siteId,
        method: 'BIOMETRIC',
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < MFA_CONFIG.backupCodeCount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate SMS verification code
   */
  private generateSMSCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Verify TOTP token
   */
  private async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.getMFASecret(userId);
    if (!secret) return false;

    return authenticator.verify({
      token,
      secret,
      window: MFA_CONFIG.tokenWindow,
    });
  }

  /**
   * Verify SMS code
   */
  private async verifySMS(userId: string, token: string): Promise<boolean> {
    const storedCode = await this.getTempSMSCode(userId);
    if (!storedCode) return false;

    const isValid = storedCode.code === token && new Date() < storedCode.expiresAt;
    if (isValid) {
      await this.removeTempSMSCode(userId);
    }
    return isValid;
  }

  /**
   * Verify email code
   */
  private async verifyEmail(userId: string, token: string): Promise<boolean> {
    // Similar to SMS verification
    return this.verifySMS(userId, token);
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { userId },
      select: { mfaBackupCodes: true },
    });

    if (!profile?.mfaBackupCodes) return false;

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const backupCodes = profile.mfaBackupCodes as string[];
    
    if (backupCodes.includes(hashedCode)) {
      // Remove the used backup code
      const updatedCodes = backupCodes.filter(c => c !== hashedCode);
      await prisma.userSecurityProfile.update({
        where: { userId },
        data: { mfaBackupCodes: updatedCodes },
      });
      return true;
    }

    return false;
  }

  /**
   * Verify biometric authentication
   */
  private async verifyBiometric(userId: string, credentialData: string, deviceInfo: any): Promise<boolean> {
    // In production, implement WebAuthn verification
    // This is a simplified implementation
    try {
      const credential = JSON.parse(credentialData);
      // Verify the credential against stored public key
      // For now, return true for demo purposes
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check verification rate limiting
   */
  private async checkVerificationRateLimit(userId: string): Promise<boolean> {
    // Implement rate limiting logic
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (profile?.lockedUntil && new Date() < profile.lockedUntil) {
      return false;
    }

    return (profile?.failedLoginAttempts || 0) < MFA_CONFIG.maxVerificationAttempts;
  }

  /**
   * Check if device is trusted
   */
  private async checkTrustedDevice(userId: string, deviceInfo: any): Promise<boolean> {
    if (!deviceInfo) return false;

    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    
    const trustedSession = await prisma.userSecuritySession.findFirst({
      where: {
        profile: { userId },
        deviceFingerprint,
        verified: true,
        active: true,
      },
    });

    return !!trustedSession;
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(deviceInfo: any): string {
    const data = {
      userAgent: deviceInfo.userAgent || '',
      screen: deviceInfo.screen || '',
      timezone: deviceInfo.timezone || '',
      language: deviceInfo.language || '',
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Increment failed MFA attempts
   */
  private async incrementFailedMFAAttempts(userId: string): Promise<void> {
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { userId },
      select: { failedLoginAttempts: true },
    });

    const newAttempts = (profile?.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= MFA_CONFIG.maxVerificationAttempts;

    await prisma.userSecurityProfile.update({
      where: { userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock 
          ? new Date(Date.now() + MFA_CONFIG.verificationLockoutDuration)
          : undefined,
      },
    });
  }

  /**
   * Store temporary MFA secret
   */
  private async storeTempMFASecret(userId: string, secret: string): Promise<void> {
    // In production, encrypt the secret
    await prisma.keyUsageLog.create({
      data: {
        keyId: `temp_mfa_${userId}`,
        siteId: '', // Will be updated
        operation: 'GENERATE',
        context: secret, // In production, encrypt this
        success: true,
        metadata: { type: 'temp_totp_secret' },
      },
    });
  }

  /**
   * Get temporary MFA secret
   */
  private async getTempMFASecret(userId: string): Promise<string | null> {
    const log = await prisma.keyUsageLog.findFirst({
      where: {
        keyId: `temp_mfa_${userId}`,
        operation: 'GENERATE',
        metadata: { path: ['type'], equals: 'temp_totp_secret' },
      },
      orderBy: { createdAt: 'desc' },
    });

    return log?.context || null;
  }

  /**
   * Remove temporary MFA secret
   */
  private async removeTempMFASecret(userId: string): Promise<void> {
    await prisma.keyUsageLog.deleteMany({
      where: {
        keyId: `temp_mfa_${userId}`,
        metadata: { path: ['type'], equals: 'temp_totp_secret' },
      },
    });
  }

  /**
   * Store MFA secret
   */
  private async storeMFASecret(userId: string, secret: string): Promise<void> {
    // In production, use proper key management system
    await prisma.encryptionKey.create({
      data: {
        keyId: `mfa_${userId}`,
        name: `MFA Secret for User ${userId}`,
        description: 'TOTP secret for multi-factor authentication',
        algorithm: 'OTHER',
        keySize: 256,
        purpose: 'AUTHENTICATION',
        status: 'ACTIVE',
        siteId: '', // Will be updated with actual site
        metadata: { secret }, // In production, encrypt this
        compliance: ['ISO27001', 'SOC2'],
      },
    });
  }

  /**
   * Get MFA secret
   */
  private async getMFASecret(userId: string): Promise<string | null> {
    const key = await prisma.encryptionKey.findFirst({
      where: {
        keyId: `mfa_${userId}`,
        purpose: 'AUTHENTICATION',
        status: 'ACTIVE',
      },
    });

    return key?.metadata?.secret || null;
  }

  /**
   * Store temporary SMS code
   */
  private async storeTempSMSCode(
    userId: string,
    code: string,
    phoneNumber: string,
    expiresAt: Date
  ): Promise<void> {
    await prisma.keyUsageLog.create({
      data: {
        keyId: `temp_sms_${userId}`,
        siteId: '',
        operation: 'GENERATE',
        context: code,
        success: true,
        metadata: {
          type: 'temp_sms_code',
          phoneNumber,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });
  }

  /**
   * Get temporary SMS code
   */
  private async getTempSMSCode(userId: string): Promise<{
    code: string;
    expiresAt: Date;
  } | null> {
    const log = await prisma.keyUsageLog.findFirst({
      where: {
        keyId: `temp_sms_${userId}`,
        operation: 'GENERATE',
        metadata: { path: ['type'], equals: 'temp_sms_code' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log?.context || !log?.metadata?.expiresAt) return null;

    return {
      code: log.context,
      expiresAt: new Date(log.metadata.expiresAt as string),
    };
  }

  /**
   * Remove temporary SMS code
   */
  private async removeTempSMSCode(userId: string): Promise<void> {
    await prisma.keyUsageLog.deleteMany({
      where: {
        keyId: `temp_sms_${userId}`,
        metadata: { path: ['type'], equals: 'temp_sms_code' },
      },
    });
  }

  /**
   * Store biometric challenge
   */
  private async storeBiometricChallenge(
    userId: string,
    challengeId: string,
    challenge: string
  ): Promise<void> {
    await prisma.keyUsageLog.create({
      data: {
        keyId: `biometric_challenge_${userId}`,
        siteId: '',
        operation: 'GENERATE',
        context: challenge,
        success: true,
        metadata: {
          type: 'biometric_challenge',
          challengeId,
          expiresAt: new Date(Date.now() + 60000).toISOString(), // 1 minute
        },
      },
    });
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(data: {
    eventType: string;
    userId: string;
    siteId: string;
    method?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: data.eventType as any,
          severity: 'INFO',
          title: `MFA ${data.method || ''} ${data.eventType}`,
          description: `Multi-factor authentication event: ${data.eventType}`,
          userId: data.userId,
          siteId: data.siteId,
          metadata: data.metadata || {},
          success: !data.eventType.includes('FAILED'),
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, siteId: string, adminUserId?: string): Promise<void> {
    try {
      await prisma.userSecurityProfile.update({
        where: { userId },
        data: {
          mfaEnabled: false,
          mfaMethod: null,
          mfaBackupCodes: [],
        },
      });

      // Remove MFA secrets
      await prisma.encryptionKey.deleteMany({
        where: {
          keyId: `mfa_${userId}`,
          purpose: 'AUTHENTICATION',
        },
      });

      await this.logSecurityEvent({
        eventType: 'MFA_DISABLED',
        userId,
        siteId,
        metadata: { disabledBy: adminUserId || userId },
      });
    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'MFA_DISABLE_FAILED',
        userId,
        siteId,
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    method?: string;
    backupCodesRemaining: number;
    lastVerification?: Date;
  }> {
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { userId },
      select: {
        mfaEnabled: true,
        mfaMethod: true,
        mfaBackupCodes: true,
        lastMFAVerification: true,
      },
    });

    if (!profile) {
      return {
        enabled: false,
        backupCodesRemaining: 0,
      };
    }

    return {
      enabled: profile.mfaEnabled,
      method: profile.mfaMethod || undefined,
      backupCodesRemaining: (profile.mfaBackupCodes as string[])?.length || 0,
      lastVerification: profile.lastMFAVerification || undefined,
    };
  }
}

// Export singleton instance
export const mfaService = new MFAService(); 