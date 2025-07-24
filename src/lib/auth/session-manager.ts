import { prisma } from '../prisma';
import crypto from 'crypto';
import { z } from 'zod';

// Session configuration
const SESSION_CONFIG = {
  maxSessionsPerUser: 5,
  sessionInactivityTimeout: 30 * 60 * 1000, // 30 minutes
  sessionAbsoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours
  trustedDeviceExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  suspiciousActivityThreshold: 0.7, // Risk score threshold
  geoLocationEnabled: true,
  deviceTrackingEnabled: true,
  concurrentSessionLimit: 3,
  sessionExtensionWindow: 15 * 60 * 1000, // 15 minutes before expiry
};

// Validation schemas
export const sessionCreateSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    timezone: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  deviceInfo: z.object({
    type: z.enum(['desktop', 'mobile', 'tablet', 'unknown']),
    os: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
    platform: z.string().optional(),
    fingerprint: z.string().optional(),
  }).optional(),
  trustedDevice: z.boolean().default(false),
});

export const sessionUpdateSchema = z.object({
  sessionId: z.string(),
  lastActivity: z.date().optional(),
  suspicious: z.boolean().optional(),
  suspicionReasons: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Session Manager Class
export class SessionManager {

  /**
   * Create a new security session
   */
  async createSession(data: z.infer<typeof sessionCreateSchema>): Promise<{
    sessionId: string;
    expiresAt: Date;
    trustedDevice: boolean;
    warningFlags: string[];
  }> {
    try {
      // Validate input
      const validatedData = sessionCreateSchema.parse(data);

      // Generate session ID
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + SESSION_CONFIG.sessionAbsoluteTimeout);

      // Get or create user security profile
      const profile = await this.getOrCreateUserProfile(validatedData.userId, validatedData.siteId);

      // Check for session limits
      await this.enforceSessionLimits(validatedData.userId);

      // Generate device fingerprint
      const deviceFingerprint = this.generateDeviceFingerprint(validatedData);

      // Check for suspicious activity
      const suspiciousActivity = await this.detectSuspiciousActivity(
        validatedData.userId,
        validatedData.ipAddress,
        validatedData.location,
        deviceFingerprint
      );

      // Determine if device should be trusted
      const trustedDevice = validatedData.trustedDevice && !suspiciousActivity.suspicious;

      // Create session record
      const session = await prisma.userSecuritySession.create({
        data: {
          sessionId,
          profileId: profile.id,
          siteId: validatedData.siteId,
          ipAddress: validatedData.ipAddress,
          userAgent: validatedData.userAgent,
          location: validatedData.location || {},
          deviceFingerprint,
          expiresAt,
          active: true,
          terminated: false,
          suspicious: suspiciousActivity.suspicious,
          suspicionReasons: suspiciousActivity.reasons,
          verified: trustedDevice,
        },
      });

      // Update user's active session count
      await this.updateActiveSessionCount(validatedData.userId);

      // Log session creation
      await this.logSecurityEvent({
        eventType: 'SESSION_CREATED',
        userId: validatedData.userId,
        siteId: validatedData.siteId,
        sessionId,
        metadata: {
          ipAddress: validatedData.ipAddress,
          deviceType: validatedData.deviceInfo?.type,
          suspicious: suspiciousActivity.suspicious,
          trustedDevice,
        },
      });

      // Update risk score if suspicious
      if (suspiciousActivity.suspicious) {
        await this.updateUserRiskScore(validatedData.userId, suspiciousActivity.riskIncrease);
      }

      return {
        sessionId,
        expiresAt,
        trustedDevice,
        warningFlags: suspiciousActivity.reasons,
      };

    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'SESSION_CREATE_FAILED',
        userId: data.userId,
        siteId: data.siteId,
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Validate and update existing session
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    session?: any;
    extendSession?: boolean;
    warnings: string[];
  }> {
    try {
      const session = await prisma.userSecuritySession.findUnique({
        where: { sessionId },
        include: {
          profile: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!session) {
        return { valid: false, warnings: ['Session not found'] };
      }

      const now = new Date();
      const warnings: string[] = [];

      // Check if session is expired
      if (session.expiresAt < now) {
        await this.terminateSession(sessionId, 'expired');
        return { valid: false, warnings: ['Session expired'] };
      }

      // Check if session is active
      if (!session.active || session.terminated) {
        return { valid: false, warnings: ['Session terminated'] };
      }

      // Check for inactivity timeout
      const inactivityLimit = new Date(session.lastActivity.getTime() + SESSION_CONFIG.sessionInactivityTimeout);
      if (inactivityLimit < now) {
        await this.terminateSession(sessionId, 'inactivity_timeout');
        return { valid: false, warnings: ['Session timed out due to inactivity'] };
      }

      // Check for suspicious activity flags
      if (session.suspicious) {
        warnings.push('Suspicious activity detected');
      }

      // Determine if session should be extended
      const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
      const extendSession = timeUntilExpiry < SESSION_CONFIG.sessionExtensionWindow;

      // Update last activity
      await prisma.userSecuritySession.update({
        where: { sessionId },
        data: { lastActivity: now },
      });

      // Extend session if needed
      if (extendSession) {
        const newExpiresAt = new Date(now.getTime() + SESSION_CONFIG.sessionAbsoluteTimeout);
        await prisma.userSecuritySession.update({
          where: { sessionId },
          data: { expiresAt: newExpiresAt },
        });
      }

      return {
        valid: true,
        session: {
          id: session.sessionId,
          userId: session.profile.userId,
          siteId: session.siteId,
          user: session.profile.user,
          expiresAt: extendSession ? new Date(now.getTime() + SESSION_CONFIG.sessionAbsoluteTimeout) : session.expiresAt,
          suspicious: session.suspicious,
          trustedDevice: session.verified,
        },
        extendSession,
        warnings,
      };

    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'SESSION_VALIDATION_ERROR',
        userId: '',
        siteId: '',
        sessionId,
        metadata: { error: error.message },
      });
      return { valid: false, warnings: ['Session validation error'] };
    }
  }

  /**
   * Terminate a session
   */
  async terminateSession(
    sessionId: string,
    reason: string,
    terminatedBy?: string
  ): Promise<boolean> {
    try {
      const session = await prisma.userSecuritySession.findUnique({
        where: { sessionId },
        include: { profile: true },
      });

      if (!session) {
        return false;
      }

      // Update session as terminated
      await prisma.userSecuritySession.update({
        where: { sessionId },
        data: {
          active: false,
          terminated: true,
          terminatedBy,
          terminatedReason: reason,
        },
      });

      // Update active session count
      await this.updateActiveSessionCount(session.profile.userId);

      // Log session termination
      await this.logSecurityEvent({
        eventType: 'SESSION_TERMINATED',
        userId: session.profile.userId,
        siteId: session.siteId,
        sessionId,
        metadata: {
          reason,
          terminatedBy: terminatedBy || 'system',
        },
      });

      return true;

    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'SESSION_TERMINATION_FAILED',
        userId: '',
        siteId: '',
        sessionId,
        metadata: { error: error.message, reason },
      });
      throw error;
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(
    userId: string,
    siteId: string,
    reason: string,
    excludeSessionId?: string,
    terminatedBy?: string
  ): Promise<number> {
    try {
      const whereClause: any = {
        profile: { userId },
        siteId,
        active: true,
        terminated: false,
      };

      if (excludeSessionId) {
        whereClause.sessionId = { not: excludeSessionId };
      }

      const sessions = await prisma.userSecuritySession.findMany({
        where: whereClause,
        select: { sessionId: true },
      });

      // Terminate each session
      const terminationPromises = sessions.map(session =>
        this.terminateSession(session.sessionId, reason, terminatedBy)
      );

      await Promise.all(terminationPromises);

      // Log bulk termination
      await this.logSecurityEvent({
        eventType: 'BULK_SESSION_TERMINATION',
        userId,
        siteId,
        metadata: {
          reason,
          sessionCount: sessions.length,
          excludedSession: excludeSessionId,
          terminatedBy: terminatedBy || 'system',
        },
      });

      return sessions.length;

    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'BULK_SESSION_TERMINATION_FAILED',
        userId,
        siteId,
        metadata: { error: error.message, reason },
      });
      throw error;
    }
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string, siteId: string): Promise<Array<{
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    location: any;
    deviceInfo: any;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    suspicious: boolean;
    verified: boolean;
    current?: boolean;
  }>> {
    try {
      const sessions = await prisma.userSecuritySession.findMany({
        where: {
          profile: { userId },
          siteId,
          active: true,
          terminated: false,
        },
        orderBy: { lastActivity: 'desc' },
      });

      return sessions.map(session => ({
        sessionId: session.sessionId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location,
        deviceInfo: this.parseDeviceInfo(session.userAgent, session.deviceFingerprint),
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        suspicious: session.suspicious,
        verified: session.verified,
      }));

    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Flag session as suspicious
   */
  async flagSuspiciousSession(
    sessionId: string,
    reasons: string[],
    metadata?: any
  ): Promise<void> {
    try {
      const session = await prisma.userSecuritySession.findUnique({
        where: { sessionId },
        include: { profile: true },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Update session
      const existingReasons = session.suspicionReasons as string[] || [];
      const updatedReasons = [...new Set([...existingReasons, ...reasons])];

      await prisma.userSecuritySession.update({
        where: { sessionId },
        data: {
          suspicious: true,
          suspicionReasons: updatedReasons,
        },
      });

      // Log suspicious activity
      await this.logSecurityEvent({
        eventType: 'SUSPICIOUS_SESSION_DETECTED',
        userId: session.profile.userId,
        siteId: session.siteId,
        sessionId,
        metadata: {
          reasons: updatedReasons,
          additionalInfo: metadata,
        },
      });

      // Update user risk score
      await this.updateUserRiskScore(session.profile.userId, 10);

    } catch (error) {
      console.error('Error flagging suspicious session:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious activity
   */
  private async detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
    location?: any,
    deviceFingerprint?: string
  ): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskIncrease: number;
  }> {
    const reasons: string[] = [];
    let riskIncrease = 0;

    try {
      // Get recent sessions for comparison
      const recentSessions = await prisma.userSecuritySession.findMany({
        where: {
          profile: { userId },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Check for new IP address
      const knownIPs = recentSessions.map(s => s.ipAddress);
      if (!knownIPs.includes(ipAddress)) {
        reasons.push('new_ip_address');
        riskIncrease += 5;
      }

      // Check for new device
      if (deviceFingerprint) {
        const knownDevices = recentSessions.map(s => s.deviceFingerprint).filter(Boolean);
        if (!knownDevices.includes(deviceFingerprint)) {
          reasons.push('new_device');
          riskIncrease += 10;
        }
      }

      // Check for geographical anomalies
      if (location && SESSION_CONFIG.geoLocationEnabled) {
        const recentLocations = recentSessions
          .map(s => s.location as any)
          .filter(l => l && l.country);

        if (recentLocations.length > 0) {
          const lastLocation = recentLocations[0];
          if (lastLocation.country && location.country !== lastLocation.country) {
            reasons.push('location_anomaly');
            riskIncrease += 15;
          }
        }
      }

      // Check for rapid succession logins
      const recentLogin = recentSessions.find(s =>
        s.createdAt > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      );
      if (recentLogin && recentLogin.ipAddress !== ipAddress) {
        reasons.push('rapid_location_change');
        riskIncrease += 20;
      }

      // Check for suspicious user agent patterns
      if (this.isSuspiciousUserAgent(deviceFingerprint || '')) {
        reasons.push('suspicious_user_agent');
        riskIncrease += 5;
      }

      const suspicious = riskIncrease >= 15; // Threshold for suspicious activity

      return { suspicious, reasons, riskIncrease };

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return { suspicious: false, reasons: [], riskIncrease: 0 };
    }
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(data: z.infer<typeof sessionCreateSchema>): string {
    const fingerprint = {
      userAgent: data.userAgent,
      deviceType: data.deviceInfo?.type,
      os: data.deviceInfo?.os,
      browser: data.deviceInfo?.browser,
      platform: data.deviceInfo?.platform,
      timezone: data.location?.timezone,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprint))
      .digest('hex');
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
      /script/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Parse device information from user agent
   */
  private parseDeviceInfo(userAgent: string, fingerprint?: string): any {
    // Simple device detection (in production, use a proper library like ua-parser-js)
    const deviceInfo: any = {
      userAgent,
      fingerprint,
    };

    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      deviceInfo.type = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceInfo.type = 'tablet';
    } else {
      deviceInfo.type = 'desktop';
    }

    // Extract OS
    if (/Windows/i.test(userAgent)) deviceInfo.os = 'Windows';
    else if (/Mac OS/i.test(userAgent)) deviceInfo.os = 'macOS';
    else if (/Linux/i.test(userAgent)) deviceInfo.os = 'Linux';
    else if (/Android/i.test(userAgent)) deviceInfo.os = 'Android';
    else if (/iOS/i.test(userAgent)) deviceInfo.os = 'iOS';

    // Extract browser
    if (/Chrome/i.test(userAgent)) deviceInfo.browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) deviceInfo.browser = 'Firefox';
    else if (/Safari/i.test(userAgent)) deviceInfo.browser = 'Safari';
    else if (/Edge/i.test(userAgent)) deviceInfo.browser = 'Edge';

    return deviceInfo;
  }

  /**
   * Enforce session limits
   */
  private async enforceSessionLimits(userId: string): Promise<void> {
    const activeSessions = await prisma.userSecuritySession.count({
      where: {
        profile: { userId },
        active: true,
        terminated: false,
      },
    });

    if (activeSessions >= SESSION_CONFIG.maxSessionsPerUser) {
      // Terminate oldest session
      const oldestSession = await prisma.userSecuritySession.findFirst({
        where: {
          profile: { userId },
          active: true,
          terminated: false,
        },
        orderBy: { lastActivity: 'asc' },
      });

      if (oldestSession) {
        await this.terminateSession(oldestSession.sessionId, 'session_limit_exceeded');
      }
    }
  }

  /**
   * Get or create user security profile
   */
  private async getOrCreateUserProfile(userId: string, siteId: string) {
    return await prisma.userSecurityProfile.upsert({
      where: { userId },
      create: {
        userId,
        siteId,
        mfaEnabled: false,
        riskScore: 0,
        consentGiven: false,
        securityNotifications: true,
        suspiciousActivity: true,
        dataExportRequest: true,
      },
      update: {},
    });
  }

  /**
   * Update active session count
   */
  private async updateActiveSessionCount(userId: string): Promise<void> {
    const count = await prisma.userSecuritySession.count({
      where: {
        profile: { userId },
        active: true,
        terminated: false,
      },
    });

    await prisma.userSecurityProfile.update({
      where: { userId },
      data: { activeSessions: count },
    });
  }

  /**
   * Update user risk score
   */
  private async updateUserRiskScore(userId: string, increase: number): Promise<void> {
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { userId },
      select: { riskScore: true, riskFactors: true },
    });

    if (profile) {
      const newScore = Math.min(100, profile.riskScore + increase);
      const riskFactors = profile.riskFactors as string[] || [];

      await prisma.userSecurityProfile.update({
        where: { userId },
        data: {
          riskScore: newScore,
          lastRiskAssessment: new Date(),
          riskFactors: [...new Set([...riskFactors, 'suspicious_session'])],
        },
      });
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(data: {
    eventType: string;
    userId: string;
    siteId: string;
    sessionId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: data.eventType as any,
          severity: data.eventType.includes('SUSPICIOUS') ? 'HIGH' : 'INFO',
          title: `Session ${data.eventType}`,
          description: `Session management event: ${data.eventType}`,
          userId: data.userId || undefined,
          siteId: data.siteId || undefined,
          metadata: data.metadata || {},
          success: !data.eventType.includes('FAILED'),
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await prisma.userSecuritySession.findMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              lastActivity: {
                lt: new Date(Date.now() - SESSION_CONFIG.sessionInactivityTimeout),
              },
            },
          ],
          active: true,
          terminated: false,
        },
        select: { sessionId: true },
      });

      // Terminate expired sessions
      const cleanupPromises = expiredSessions.map(session =>
        this.terminateSession(session.sessionId, 'expired_cleanup')
      );

      await Promise.all(cleanupPromises);

      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
      return expiredSessions.length;

    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(siteId: string, days: number = 7): Promise<{
    totalSessions: number;
    activeSessions: number;
    suspiciousSessions: number;
    deviceBreakdown: Record<string, number>;
    locationBreakdown: Record<string, number>;
    hourlyDistribution: Record<string, number>;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const sessions = await prisma.userSecuritySession.findMany({
        where: {
          siteId,
          createdAt: { gte: startDate },
        },
        select: {
          active: true,
          suspicious: true,
          userAgent: true,
          location: true,
          createdAt: true,
        },
      });

      const totalSessions = sessions.length;
      const activeSessions = sessions.filter(s => s.active).length;
      const suspiciousSessions = sessions.filter(s => s.suspicious).length;

      // Device breakdown
      const deviceBreakdown: Record<string, number> = {};
      sessions.forEach(session => {
        const deviceInfo = this.parseDeviceInfo(session.userAgent);
        const deviceType = deviceInfo.type || 'unknown';
        deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
      });

      // Location breakdown
      const locationBreakdown: Record<string, number> = {};
      sessions.forEach(session => {
        const location = session.location as any;
        const country = location?.country || 'unknown';
        locationBreakdown[country] = (locationBreakdown[country] || 0) + 1;
      });

      // Hourly distribution
      const hourlyDistribution: Record<string, number> = {};
      sessions.forEach(session => {
        const hour = session.createdAt.getHours().toString();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      return {
        totalSessions,
        activeSessions,
        suspiciousSessions,
        deviceBreakdown,
        locationBreakdown,
        hourlyDistribution,
      };

    } catch (error) {
      console.error('Error getting session analytics:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        suspiciousSessions: 0,
        deviceBreakdown: {},
        locationBreakdown: {},
        hourlyDistribution: {},
      };
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager(); 