import { prisma } from '../prisma';
import { z } from 'zod';

// Analytics configuration
const ANALYTICS_CONFIG = {
  defaultTimeRange: 7, // days
  riskThresholds: {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
  },
  anomalyDetection: {
    enabled: true,
    sensitivity: 0.7,
    minSamples: 10,
  },
  alerting: {
    enabled: true,
    thresholds: {
      failedLogins: 10,
      suspiciousSessions: 5,
      newDevices: 3,
    },
  },
};

// Validation schemas
export const analyticsQuerySchema = z.object({
  siteId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  userId: z.string().optional(),
  eventTypes: z.array(z.string()).optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
});

export const riskAssessmentSchema = z.object({
  userId: z.string(),
  siteId: z.string(),
  sessionId: z.string().optional(),
  factors: z.array(z.string()).optional(),
});

// Analytics interfaces
interface AuthenticationMetrics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  mfaUsage: number;
  uniqueUsers: number;
  newUsers: number;
  blockedAttempts: number;
}

interface SecurityMetrics {
  suspiciousActivities: number;
  securityIncidents: number;
  policyViolations: number;
  riskScore: number;
  vulnerabilities: number;
  complianceScore: number;
}

interface SessionMetrics {
  activeSessions: number;
  averageSessionDuration: number;
  sessionsByDevice: Record<string, number>;
  sessionsByLocation: Record<string, number>;
  concurrentPeakSessions: number;
}

interface UserBehaviorMetrics {
  loginPatterns: Record<string, number>;
  deviceUsage: Record<string, number>;
  locationPatterns: Record<string, number>;
  timePatterns: Record<string, number>;
  riskDistribution: Record<string, number>;
}

// Authentication Analytics Service
export class AuthenticationAnalyticsService {

  /**
   * Get comprehensive authentication metrics
   */
  async getAuthenticationMetrics(
    siteId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuthenticationMetrics> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);

      // Get authentication events
      const authEvents = await prisma.securityEvent.findMany({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          eventType: {
            in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'MFA_VERIFICATION', 'ACCOUNT_LOCKED'],
          },
        },
        select: {
          eventType: true,
          success: true,
          userId: true,
          metadata: true,
        },
      });

      const totalLogins = authEvents.filter(e => 
        e.eventType === 'LOGIN_SUCCESS' || e.eventType === 'LOGIN_FAILURE'
      ).length;

      const successfulLogins = authEvents.filter(e => 
        e.eventType === 'LOGIN_SUCCESS' && e.success
      ).length;

      const failedLogins = authEvents.filter(e => 
        e.eventType === 'LOGIN_FAILURE' || !e.success
      ).length;

      const mfaEvents = authEvents.filter(e => 
        e.eventType === 'MFA_VERIFICATION'
      ).length;

      const uniqueUsers = new Set(
        authEvents.filter(e => e.userId).map(e => e.userId)
      ).size;

      const blockedAttempts = authEvents.filter(e => 
        e.eventType === 'ACCOUNT_LOCKED'
      ).length;

      // Get new users in the period
      const newUsers = await prisma.user.count({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      });

      return {
        totalLogins,
        successfulLogins,
        failedLogins,
        successRate: totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0,
        mfaUsage: mfaEvents,
        uniqueUsers,
        newUsers,
        blockedAttempts,
      };

    } catch (error) {
      console.error('Error getting authentication metrics:', error);
      return {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        successRate: 0,
        mfaUsage: 0,
        uniqueUsers: 0,
        newUsers: 0,
        blockedAttempts: 0,
      };
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(
    siteId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SecurityMetrics> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);

      // Get security events
      const securityEvents = await prisma.securityEvent.findMany({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          eventType: true,
          severity: true,
        },
      });

      const suspiciousActivities = securityEvents.filter(e => 
        e.eventType === 'SUSPICIOUS_ACTIVITY'
      ).length;

      // Get security incidents
      const securityIncidents = await prisma.securityIncident.count({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      });

      // Get policy violations
      const policyViolations = await prisma.policyViolation.count({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      });

      // Get vulnerabilities
      const vulnerabilities = await prisma.vulnerability.count({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: 'OPEN',
        },
      });

      // Calculate risk score
      const riskScore = await this.calculateSiteRiskScore(siteId);

      // Calculate compliance score
      const complianceScore = await this.calculateComplianceScore(siteId);

      return {
        suspiciousActivities,
        securityIncidents,
        policyViolations,
        riskScore,
        vulnerabilities,
        complianceScore,
      };

    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        suspiciousActivities: 0,
        securityIncidents: 0,
        policyViolations: 0,
        riskScore: 0,
        vulnerabilities: 0,
        complianceScore: 0,
      };
    }
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(
    siteId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SessionMetrics> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);

      // Get sessions in the date range
      const sessions = await prisma.userSecuritySession.findMany({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          active: true,
          createdAt: true,
          lastActivity: true,
          userAgent: true,
          location: true,
        },
      });

      const activeSessions = sessions.filter(s => s.active).length;

      // Calculate average session duration
      const sessionDurations = sessions
        .filter(s => !s.active) // Only completed sessions
        .map(s => s.lastActivity.getTime() - s.createdAt.getTime());

      const averageSessionDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
        : 0;

      // Group by device type
      const sessionsByDevice: Record<string, number> = {};
      sessions.forEach(session => {
        const deviceType = this.detectDeviceType(session.userAgent);
        sessionsByDevice[deviceType] = (sessionsByDevice[deviceType] || 0) + 1;
      });

      // Group by location
      const sessionsByLocation: Record<string, number> = {};
      sessions.forEach(session => {
        const location = session.location as any;
        const country = location?.country || 'Unknown';
        sessionsByLocation[country] = (sessionsByLocation[country] || 0) + 1;
      });

      // Calculate concurrent peak sessions (simplified)
      const concurrentPeakSessions = Math.max(activeSessions, 0);

      return {
        activeSessions,
        averageSessionDuration: Math.round(averageSessionDuration / (1000 * 60)), // Convert to minutes
        sessionsByDevice,
        sessionsByLocation,
        concurrentPeakSessions,
      };

    } catch (error) {
      console.error('Error getting session metrics:', error);
      return {
        activeSessions: 0,
        averageSessionDuration: 0,
        sessionsByDevice: {},
        sessionsByLocation: {},
        concurrentPeakSessions: 0,
      };
    }
  }

  /**
   * Get user behavior metrics
   */
  async getUserBehaviorMetrics(
    siteId: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UserBehaviorMetrics> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);
      const whereClause: any = {
        siteId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      };

      if (userId) {
        whereClause.userId = userId;
      }

      // Get security events for user behavior analysis
      const events = await prisma.securityEvent.findMany({
        where: whereClause,
        select: {
          eventType: true,
          createdAt: true,
          metadata: true,
          userId: true,
        },
      });

      // Get user sessions for device and location analysis
      const sessions = await prisma.userSecuritySession.findMany({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          ...(userId && {
            profile: { userId },
          }),
        },
        select: {
          userAgent: true,
          location: true,
          createdAt: true,
          profile: {
            select: { riskScore: true },
          },
        },
      });

      // Analyze login patterns
      const loginPatterns: Record<string, number> = {};
      events
        .filter(e => e.eventType === 'LOGIN_SUCCESS')
        .forEach(event => {
          const hour = event.createdAt.getHours();
          const timeSlot = this.getTimeSlot(hour);
          loginPatterns[timeSlot] = (loginPatterns[timeSlot] || 0) + 1;
        });

      // Analyze device usage
      const deviceUsage: Record<string, number> = {};
      sessions.forEach(session => {
        const deviceType = this.detectDeviceType(session.userAgent);
        deviceUsage[deviceType] = (deviceUsage[deviceType] || 0) + 1;
      });

      // Analyze location patterns
      const locationPatterns: Record<string, number> = {};
      sessions.forEach(session => {
        const location = session.location as any;
        const country = location?.country || 'Unknown';
        locationPatterns[country] = (locationPatterns[country] || 0) + 1;
      });

      // Analyze time patterns
      const timePatterns: Record<string, number> = {};
      sessions.forEach(session => {
        const dayOfWeek = session.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
        timePatterns[dayOfWeek] = (timePatterns[dayOfWeek] || 0) + 1;
      });

      // Analyze risk distribution
      const riskDistribution: Record<string, number> = {};
      sessions.forEach(session => {
        const riskScore = session.profile.riskScore;
        const riskLevel = this.getRiskLevel(riskScore);
        riskDistribution[riskLevel] = (riskDistribution[riskLevel] || 0) + 1;
      });

      return {
        loginPatterns,
        deviceUsage,
        locationPatterns,
        timePatterns,
        riskDistribution,
      };

    } catch (error) {
      console.error('Error getting user behavior metrics:', error);
      return {
        loginPatterns: {},
        deviceUsage: {},
        locationPatterns: {},
        timePatterns: {},
        riskDistribution: {},
      };
    }
  }

  /**
   * Detect anomalies in authentication patterns
   */
  async detectAnomalies(
    siteId: string,
    userId?: string,
    days: number = 7
  ): Promise<{
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      confidence: number;
      timestamp: Date;
      metadata: any;
    }>;
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      const anomalies: any[] = [];
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Detect unusual login times
      const loginTimes = await this.getLoginTimes(siteId, userId, startDate, endDate);
      const unusualTimes = this.detectUnusualLoginTimes(loginTimes);
      
      if (unusualTimes.length > 0) {
        anomalies.push({
          type: 'unusual_login_time',
          description: 'Login attempts at unusual hours detected',
          severity: 'medium' as const,
          confidence: 0.8,
          timestamp: new Date(),
          metadata: { unusualTimes },
        });
        riskFactors.push('Off-hours login activity');
        recommendations.push('Review login activity during unusual hours');
      }

      // Detect new devices
      const newDevices = await this.detectNewDevices(siteId, userId, startDate, endDate);
      if (newDevices > ANALYTICS_CONFIG.alerting.thresholds.newDevices) {
        anomalies.push({
          type: 'multiple_new_devices',
          description: 'Multiple new devices detected',
          severity: 'high' as const,
          confidence: 0.9,
          timestamp: new Date(),
          metadata: { deviceCount: newDevices },
        });
        riskFactors.push('Multiple new device registrations');
        recommendations.push('Verify device ownership and enable MFA');
      }

      // Detect geographic anomalies
      const geoAnomalies = await this.detectGeographicAnomalies(siteId, userId, startDate, endDate);
      if (geoAnomalies.length > 0) {
        anomalies.push({
          type: 'geographic_anomaly',
          description: 'Unusual geographic login pattern detected',
          severity: 'high' as const,
          confidence: 0.85,
          timestamp: new Date(),
          metadata: { anomalies: geoAnomalies },
        });
        riskFactors.push('Unusual geographic access patterns');
        recommendations.push('Verify recent travel or remote access needs');
      }

      // Detect brute force patterns
      const bruteForceAttempts = await this.detectBruteForce(siteId, userId, startDate, endDate);
      if (bruteForceAttempts > 0) {
        anomalies.push({
          type: 'brute_force_pattern',
          description: 'Potential brute force attack detected',
          severity: 'high' as const,
          confidence: 0.95,
          timestamp: new Date(),
          metadata: { attempts: bruteForceAttempts },
        });
        riskFactors.push('Brute force attack indicators');
        recommendations.push('Enable account lockout and MFA immediately');
      }

      return {
        anomalies,
        riskFactors,
        recommendations,
      };

    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return {
        anomalies: [],
        riskFactors: [],
        recommendations: [],
      };
    }
  }

  /**
   * Generate security risk assessment for user
   */
  async assessUserRisk(userId: string, siteId: string): Promise<{
    overallRisk: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    recommendations: string[];
    score: number;
  }> {
    try {
      const factors: any[] = [];
      let totalRisk = 0;

      // Get user security profile
      const profile = await prisma.userSecurityProfile.findUnique({
        where: { userId },
        select: {
          mfaEnabled: true,
          riskScore: true,
          riskFactors: true,
          failedLoginAttempts: true,
          lastLoginAt: true,
          activeSessions: true,
        },
      });

      if (!profile) {
        return {
          overallRisk: 50,
          riskLevel: 'medium',
          factors: [{ factor: 'No security profile', impact: 50, description: 'User has no security profile configured' }],
          recommendations: ['Set up user security profile'],
          score: 50,
        };
      }

      // MFA status
      if (!profile.mfaEnabled) {
        factors.push({
          factor: 'No MFA',
          impact: 30,
          description: 'Multi-factor authentication is not enabled',
        });
        totalRisk += 30;
      }

      // Failed login attempts
      if (profile.failedLoginAttempts > 3) {
        const impact = Math.min(profile.failedLoginAttempts * 5, 25);
        factors.push({
          factor: 'Failed logins',
          impact,
          description: `${profile.failedLoginAttempts} recent failed login attempts`,
        });
        totalRisk += impact;
      }

      // Session activity
      if (profile.activeSessions > 5) {
        factors.push({
          factor: 'Multiple sessions',
          impact: 15,
          description: `${profile.activeSessions} active sessions detected`,
        });
        totalRisk += 15;
      }

      // Recent login activity
      if (profile.lastLoginAt) {
        const daysSinceLogin = (Date.now() - profile.lastLoginAt.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceLogin > 30) {
          factors.push({
            factor: 'Inactive account',
            impact: 10,
            description: `Account inactive for ${Math.round(daysSinceLogin)} days`,
          });
          totalRisk += 10;
        }
      }

      // Risk factors from profile
      const profileRiskFactors = profile.riskFactors as string[] || [];
      profileRiskFactors.forEach(factor => {
        factors.push({
          factor: factor.replace('_', ' '),
          impact: 10,
          description: `Risk factor: ${factor.replace('_', ' ')}`,
        });
        totalRisk += 10;
      });

      // Normalize risk score
      const overallRisk = Math.min(totalRisk, 100);
      const riskLevel = this.getRiskLevel(overallRisk);

      // Generate recommendations
      const recommendations: string[] = [];
      if (!profile.mfaEnabled) recommendations.push('Enable multi-factor authentication');
      if (profile.failedLoginAttempts > 3) recommendations.push('Review recent login attempts');
      if (profile.activeSessions > 5) recommendations.push('Review and terminate unnecessary sessions');
      if (overallRisk > 70) recommendations.push('Conduct immediate security review');

      return {
        overallRisk,
        riskLevel,
        factors,
        recommendations,
        score: 100 - overallRisk, // Convert risk to security score
      };

    } catch (error) {
      console.error('Error assessing user risk:', error);
      return {
        overallRisk: 100,
        riskLevel: 'critical',
        factors: [{ factor: 'Assessment error', impact: 100, description: 'Failed to assess user risk' }],
        recommendations: ['Contact security team'],
        score: 0,
      };
    }
  }

  /**
   * Get authentication trend data
   */
  async getAuthenticationTrends(
    siteId: string,
    days: number = 30,
    groupBy: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      type: 'login_success' | 'login_failure' | 'mfa_usage' | 'suspicious_activity';
    }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get security events
      const events = await prisma.securityEvent.findMany({
        where: {
          siteId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          eventType: {
            in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'MFA_VERIFICATION', 'SUSPICIOUS_ACTIVITY'],
          },
        },
        select: {
          eventType: true,
          createdAt: true,
          success: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group events by time period
      const groupedData = this.groupEventsByTime(events, groupBy, startDate, endDate);

      return groupedData;

    } catch (error) {
      console.error('Error getting authentication trends:', error);
      return {
        labels: [],
        datasets: [],
      };
    }
  }

  // Helper methods

  private getDateRange(startDate?: Date, endDate?: Date) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - ANALYTICS_CONFIG.defaultTimeRange * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private detectDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 22) return 'Evening';
    return 'Night';
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private async calculateSiteRiskScore(siteId: string): Promise<number> {
    // Simplified risk calculation
    const recentIncidents = await prisma.securityIncident.count({
      where: {
        siteId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const recentVulnerabilities = await prisma.vulnerability.count({
      where: {
        siteId,
        status: 'OPEN',
        severity: { in: ['CRITICAL', 'HIGH'] },
      },
    });

    return Math.min((recentIncidents * 20) + (recentVulnerabilities * 15), 100);
  }

  private async calculateComplianceScore(siteId: string): Promise<number> {
    const totalRecords = await prisma.complianceRecord.count({
      where: { siteId },
    });

    const compliantRecords = await prisma.complianceRecord.count({
      where: {
        siteId,
        status: 'COMPLIANT',
      },
    });

    return totalRecords > 0 ? (compliantRecords / totalRecords) * 100 : 0;
  }

  private async getLoginTimes(siteId: string, userId?: string, startDate?: Date, endDate?: Date): Promise<number[]> {
    const events = await prisma.securityEvent.findMany({
      where: {
        siteId,
        ...(userId && { userId }),
        eventType: 'LOGIN_SUCCESS',
        ...(startDate && endDate && {
          createdAt: { gte: startDate, lte: endDate },
        }),
      },
      select: { createdAt: true },
    });

    return events.map(e => e.createdAt.getHours());
  }

  private detectUnusualLoginTimes(loginTimes: number[]): number[] {
    // Simple anomaly detection for unusual hours (e.g., 2-5 AM)
    const unusualHours = [2, 3, 4, 5];
    return loginTimes.filter(hour => unusualHours.includes(hour));
  }

  private async detectNewDevices(siteId: string, userId?: string, startDate?: Date, endDate?: Date): Promise<number> {
    const sessions = await prisma.userSecuritySession.findMany({
      where: {
        siteId,
        ...(userId && { profile: { userId } }),
        ...(startDate && endDate && {
          createdAt: { gte: startDate, lte: endDate },
        }),
      },
      select: { deviceFingerprint: true },
      distinct: ['deviceFingerprint'],
    });

    return sessions.length;
  }

  private async detectGeographicAnomalies(siteId: string, userId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Simplified geographic anomaly detection
    const sessions = await prisma.userSecuritySession.findMany({
      where: {
        siteId,
        ...(userId && { profile: { userId } }),
        ...(startDate && endDate && {
          createdAt: { gte: startDate, lte: endDate },
        }),
      },
      select: { location: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const anomalies: any[] = [];
    
    // Detect rapid location changes
    for (let i = 1; i < sessions.length; i++) {
      const prev = sessions[i - 1].location as any;
      const curr = sessions[i].location as any;
      
      if (prev?.country && curr?.country && prev.country !== curr.country) {
        const timeDiff = sessions[i].createdAt.getTime() - sessions[i - 1].createdAt.getTime();
        const hoursDiff = timeDiff / (60 * 60 * 1000);
        
        if (hoursDiff < 12) { // Less than 12 hours between different countries
          anomalies.push({
            from: prev.country,
            to: curr.country,
            timespan: hoursDiff,
            timestamp: sessions[i].createdAt,
          });
        }
      }
    }

    return anomalies;
  }

  private async detectBruteForce(siteId: string, userId?: string, startDate?: Date, endDate?: Date): Promise<number> {
    const failedAttempts = await prisma.securityEvent.count({
      where: {
        siteId,
        ...(userId && { userId }),
        eventType: 'LOGIN_FAILURE',
        ...(startDate && endDate && {
          createdAt: { gte: startDate, lte: endDate },
        }),
      },
    });

    // Consider it brute force if more than 20 failed attempts in the period
    return failedAttempts > 20 ? failedAttempts : 0;
  }

  private groupEventsByTime(
    events: any[],
    groupBy: 'hour' | 'day' | 'week',
    startDate: Date,
    endDate: Date
  ): any {
    // Simplified implementation - in production, use a proper time series library
    const labels: string[] = [];
    const loginSuccess: number[] = [];
    const loginFailure: number[] = [];
    const mfaUsage: number[] = [];
    const suspiciousActivity: number[] = [];

    // Generate time labels and initialize data arrays
    const timePeriods = this.generateTimePeriods(startDate, endDate, groupBy);
    
    timePeriods.forEach(period => {
      labels.push(period.label);
      
      const periodEvents = events.filter(e => 
        e.createdAt >= period.start && e.createdAt < period.end
      );

      loginSuccess.push(periodEvents.filter(e => e.eventType === 'LOGIN_SUCCESS').length);
      loginFailure.push(periodEvents.filter(e => e.eventType === 'LOGIN_FAILURE').length);
      mfaUsage.push(periodEvents.filter(e => e.eventType === 'MFA_VERIFICATION').length);
      suspiciousActivity.push(periodEvents.filter(e => e.eventType === 'SUSPICIOUS_ACTIVITY').length);
    });

    return {
      labels,
      datasets: [
        { label: 'Login Success', data: loginSuccess, type: 'login_success' as const },
        { label: 'Login Failure', data: loginFailure, type: 'login_failure' as const },
        { label: 'MFA Usage', data: mfaUsage, type: 'mfa_usage' as const },
        { label: 'Suspicious Activity', data: suspiciousActivity, type: 'suspicious_activity' as const },
      ],
    };
  }

  private generateTimePeriods(startDate: Date, endDate: Date, groupBy: 'hour' | 'day' | 'week'): Array<{
    start: Date;
    end: Date;
    label: string;
  }> {
    const periods: any[] = [];
    let current = new Date(startDate);

    while (current < endDate) {
      const period = { start: new Date(current), end: new Date(), label: '' };

      switch (groupBy) {
        case 'hour':
          period.end = new Date(current.getTime() + 60 * 60 * 1000);
          period.label = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          period.end = new Date(current.getTime() + 24 * 60 * 60 * 1000);
          period.label = current.toLocaleDateString();
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          period.end = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
          period.label = `Week of ${current.toLocaleDateString()}`;
          current.setDate(current.getDate() + 7);
          break;
      }

      periods.push(period);
    }

    return periods;
  }
}

// Export singleton instance
export const authAnalyticsService = new AuthenticationAnalyticsService(); 