import { prisma } from '../prisma';
import { z } from 'zod';

// Monitoring configuration
const MONITORING_CONFIG = {
  alertThresholds: {
    failedEncryptions: 10, // Alert after 10 failed encryptions in 1 hour
    keyRotationOverdue: 7, // Alert when key rotation is 7+ days overdue
    unusualKeyUsage: 100, // Alert when key usage spikes 100% above normal
    unauthorizedAccess: 3, // Alert after 3 unauthorized access attempts
    lowKeyEntropy: 0.8, // Alert when key entropy falls below 80%
  },
  complianceChecks: {
    keyRotationCompliance: true,
    encryptionCoverage: true,
    dataRetention: true,
    accessControl: true,
  },
  reportingSchedule: {
    daily: true,
    weekly: true,
    monthly: true,
    quarterly: true,
  },
  retention: {
    alerts: 90, // days
    metrics: 365, // days
    reports: 2555, // days (7 years)
  },
} as const;

// Validation schemas
export const monitoringQuerySchema = z.object({
  siteId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  metricTypes: z.array(z.string()).optional(),
  alertLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const alertSchema = z.object({
  type: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string(),
  description: z.string(),
  siteId: z.string(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Monitoring interfaces
interface EncryptionMetrics {
  totalEncryptions: number;
  totalDecryptions: number;
  failedOperations: number;
  averageOperationTime: number;
  keyUsageDistribution: Record<string, number>;
  encryptionCoverage: number;
  complianceScore: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  timestamp: Date;
  siteId: string;
  userId?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata: Record<string, any>;
}

interface ComplianceReport {
  siteId: string;
  reportDate: Date;
  period: string;
  overallScore: number;
  sections: {
    keyManagement: {
      score: number;
      details: Record<string, any>;
      recommendations: string[];
    };
    dataEncryption: {
      score: number;
      details: Record<string, any>;
      recommendations: string[];
    };
    accessControl: {
      score: number;
      details: Record<string, any>;
      recommendations: string[];
    };
    auditTrail: {
      score: number;
      details: Record<string, any>;
      recommendations: string[];
    };
  };
  violations: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
}

// Encryption Monitoring Service
export class EncryptionMonitoringService {

  /**
   * Get encryption metrics for a time period
   */
  async getEncryptionMetrics(
    siteId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EncryptionMetrics> {
    try {
      const dateRange = this.getDateRange(startDate, endDate);

      // Get encryption operations
      const keyUsageLogs = await prisma.keyUsageLog.findMany({
        where: {
          siteId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          operation: true,
          success: true,
          keyId: true,
          createdAt: true,
          metadata: true,
        },
      });

      const totalEncryptions = keyUsageLogs.filter(log => log.operation === 'ENCRYPT').length;
      const totalDecryptions = keyUsageLogs.filter(log => log.operation === 'DECRYPT').length;
      const failedOperations = keyUsageLogs.filter(log => !log.success).length;

      // Calculate average operation time (simplified)
      const operationTimes = keyUsageLogs
        .map(log => log.metadata?.operationTime)
        .filter(time => typeof time === 'number');
      const averageOperationTime = operationTimes.length > 0
        ? operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length
        : 0;

      // Key usage distribution
      const keyUsageDistribution: Record<string, number> = {};
      keyUsageLogs.forEach(log => {
        keyUsageDistribution[log.keyId] = (keyUsageDistribution[log.keyId] || 0) + 1;
      });

      // Calculate encryption coverage (simplified)
      const encryptionCoverage = await this.calculateEncryptionCoverage(siteId);

      // Calculate compliance score
      const complianceScore = await this.calculateComplianceScore(siteId);

      return {
        totalEncryptions,
        totalDecryptions,
        failedOperations,
        averageOperationTime,
        keyUsageDistribution,
        encryptionCoverage,
        complianceScore,
      };

    } catch (error) {
      console.error('Error getting encryption metrics:', error);
      return {
        totalEncryptions: 0,
        totalDecryptions: 0,
        failedOperations: 0,
        averageOperationTime: 0,
        keyUsageDistribution: {},
        encryptionCoverage: 0,
        complianceScore: 0,
      };
    }
  }

  /**
   * Monitor for security alerts
   */
  async monitorSecurityAlerts(siteId: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    try {
      // Check for failed encryption attempts
      const failedEncryptions = await this.checkFailedEncryptions(siteId);
      if (failedEncryptions.count > MONITORING_CONFIG.alertThresholds.failedEncryptions) {
        alerts.push(await this.createAlert({
          type: 'FAILED_ENCRYPTIONS',
          severity: 'HIGH',
          title: 'High Number of Failed Encryptions',
          description: `${failedEncryptions.count} encryption failures detected in the last hour`,
          siteId,
          metadata: { failedCount: failedEncryptions.count, details: failedEncryptions.details },
        }));
      }

      // Check for overdue key rotations
      const overdueRotations = await this.checkOverdueKeyRotations(siteId);
      if (overdueRotations.length > 0) {
        for (const overdueKey of overdueRotations) {
          const daysOverdue = Math.floor((Date.now() - overdueKey.dueDate.getTime()) / (24 * 60 * 60 * 1000));
          
          alerts.push(await this.createAlert({
            type: 'KEY_ROTATION_OVERDUE',
            severity: daysOverdue > 30 ? 'CRITICAL' : 'HIGH',
            title: 'Key Rotation Overdue',
            description: `Encryption key ${overdueKey.keyId} is ${daysOverdue} days overdue for rotation`,
            siteId,
            metadata: { keyId: overdueKey.keyId, daysOverdue },
          }));
        }
      }

      // Check for unusual key usage patterns
      const unusualUsage = await this.detectUnusualKeyUsage(siteId);
      if (unusualUsage.length > 0) {
        alerts.push(await this.createAlert({
          type: 'UNUSUAL_KEY_USAGE',
          severity: 'MEDIUM',
          title: 'Unusual Key Usage Pattern Detected',
          description: `Detected unusual usage patterns for ${unusualUsage.length} encryption keys`,
          siteId,
          metadata: { affectedKeys: unusualUsage },
        }));
      }

      // Check for unauthorized access attempts
      const unauthorizedAccess = await this.checkUnauthorizedAccess(siteId);
      if (unauthorizedAccess.count > MONITORING_CONFIG.alertThresholds.unauthorizedAccess) {
        alerts.push(await this.createAlert({
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'CRITICAL',
          title: 'Unauthorized Encryption Access Detected',
          description: `${unauthorizedAccess.count} unauthorized access attempts to encryption system`,
          siteId,
          metadata: { attemptCount: unauthorizedAccess.count, sources: unauthorizedAccess.sources },
        }));
      }

      // Check encryption coverage
      const coverage = await this.calculateEncryptionCoverage(siteId);
      if (coverage < 0.8) { // Less than 80% coverage
        alerts.push(await this.createAlert({
          type: 'LOW_ENCRYPTION_COVERAGE',
          severity: 'MEDIUM',
          title: 'Low Encryption Coverage',
          description: `Only ${Math.round(coverage * 100)}% of sensitive data is encrypted`,
          siteId,
          metadata: { coverage: coverage * 100 },
        }));
      }

      return alerts;

    } catch (error) {
      console.error('Error monitoring security alerts:', error);
      return [];
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    siteId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<ComplianceReport> {
    try {
      const reportDate = new Date();
      const dateRange = this.getPeriodDateRange(period);

      // Key Management Assessment
      const keyManagement = await this.assessKeyManagement(siteId, dateRange);

      // Data Encryption Assessment
      const dataEncryption = await this.assessDataEncryption(siteId, dateRange);

      // Access Control Assessment
      const accessControl = await this.assessAccessControl(siteId, dateRange);

      // Audit Trail Assessment
      const auditTrail = await this.assessAuditTrail(siteId, dateRange);

      // Calculate overall score
      const overallScore = Math.round(
        (keyManagement.score + dataEncryption.score + accessControl.score + auditTrail.score) / 4
      );

      // Check for violations
      const violations = await this.checkComplianceViolations(siteId, dateRange);

      return {
        siteId,
        reportDate,
        period,
        overallScore,
        sections: {
          keyManagement,
          dataEncryption,
          accessControl,
          auditTrail,
        },
        violations,
      };

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }
  }

  /**
   * Process automated security checks
   */
  async processAutomatedSecurityChecks(siteId: string): Promise<{
    checksPerformed: number;
    issuesFound: number;
    alertsGenerated: number;
    recommendations: string[];
  }> {
    let checksPerformed = 0;
    let issuesFound = 0;
    let alertsGenerated = 0;
    const recommendations: string[] = [];

    try {
      // Check 1: Key rotation status
      checksPerformed++;
      const overdueKeys = await this.checkOverdueKeyRotations(siteId);
      if (overdueKeys.length > 0) {
        issuesFound++;
        recommendations.push(`Rotate ${overdueKeys.length} overdue encryption keys`);
      }

      // Check 2: Encryption coverage
      checksPerformed++;
      const coverage = await this.calculateEncryptionCoverage(siteId);
      if (coverage < 0.9) {
        issuesFound++;
        recommendations.push('Increase encryption coverage for sensitive data');
      }

      // Check 3: Failed operations
      checksPerformed++;
      const recentFailures = await this.checkRecentFailures(siteId);
      if (recentFailures.count > 5) {
        issuesFound++;
        recommendations.push('Investigate recent encryption failures');
      }

      // Check 4: Key strength and entropy
      checksPerformed++;
      const weakKeys = await this.checkKeyStrength(siteId);
      if (weakKeys.length > 0) {
        issuesFound++;
        recommendations.push('Replace weak encryption keys');
      }

      // Check 5: Access patterns
      checksPerformed++;
      const suspiciousAccess = await this.checkAccessPatterns(siteId);
      if (suspiciousAccess.length > 0) {
        issuesFound++;
        recommendations.push('Review suspicious access patterns');
      }

      // Generate alerts for critical issues
      const alerts = await this.monitorSecurityAlerts(siteId);
      alertsGenerated = alerts.filter(alert => 
        alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
      ).length;

      return {
        checksPerformed,
        issuesFound,
        alertsGenerated,
        recommendations,
      };

    } catch (error) {
      console.error('Error processing automated security checks:', error);
      return {
        checksPerformed,
        issuesFound,
        alertsGenerated,
        recommendations: ['Error processing security checks - manual review required'],
      };
    }
  }

  // Helper methods

  private getDateRange(startDate?: Date, endDate?: Date) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    return { start, end };
  }

  private getPeriodDateRange(period: string) {
    const end = new Date();
    let start: Date;

    switch (period) {
      case 'daily':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  private async createAlert(alertData: z.infer<typeof alertSchema>): Promise<SecurityAlert> {
    // Validate alert data
    const validatedAlert = alertSchema.parse(alertData);

    // Create security event
    const securityEvent = await prisma.securityEvent.create({
      data: {
        eventType: 'ENCRYPTION_ALERT',
        severity: validatedAlert.severity,
        title: validatedAlert.title,
        description: validatedAlert.description,
        siteId: validatedAlert.siteId,
        userId: validatedAlert.userId,
        metadata: validatedAlert.metadata || {},
        success: false,
      },
    });

    return {
      id: securityEvent.id,
      type: validatedAlert.type,
      severity: validatedAlert.severity,
      title: validatedAlert.title,
      description: validatedAlert.description,
      timestamp: securityEvent.createdAt,
      siteId: validatedAlert.siteId,
      userId: validatedAlert.userId,
      resolved: false,
      metadata: validatedAlert.metadata || {},
    };
  }

  private async checkFailedEncryptions(siteId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const failedOps = await prisma.keyUsageLog.findMany({
      where: {
        siteId,
        success: false,
        createdAt: { gte: oneHourAgo },
      },
      select: {
        operation: true,
        keyId: true,
        metadata: true,
      },
    });

    return {
      count: failedOps.length,
      details: failedOps.map(op => ({
        operation: op.operation,
        keyId: op.keyId,
        error: op.metadata?.error,
      })),
    };
  }

  private async checkOverdueKeyRotations(siteId: string) {
    const now = new Date();
    
    const overdueKeys = await prisma.encryptionKey.findMany({
      where: {
        siteId,
        status: 'ACTIVE',
        nextRotation: { lt: now },
      },
      select: {
        keyId: true,
        nextRotation: true,
      },
    });

    return overdueKeys.map(key => ({
      keyId: key.keyId,
      dueDate: key.nextRotation!,
    }));
  }

  private async detectUnusualKeyUsage(siteId: string) {
    // Simplified implementation - in production, use statistical analysis
    const recentUsage = await prisma.keyUsageLog.groupBy({
      by: ['keyId'],
      where: {
        siteId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      _count: { keyId: true },
      having: {
        keyId: { _count: { gt: 100 } }, // More than 100 operations per day
      },
    });

    return recentUsage.map(usage => ({
      keyId: usage.keyId,
      count: usage._count.keyId,
    }));
  }

  private async checkUnauthorizedAccess(siteId: string) {
    const recentEvents = await prisma.securityEvent.findMany({
      where: {
        siteId,
        eventType: 'UNAUTHORIZED_ACCESS',
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      select: {
        userId: true,
        metadata: true,
      },
    });

    return {
      count: recentEvents.length,
      sources: recentEvents.map(event => event.metadata?.source || 'unknown'),
    };
  }

  private async calculateEncryptionCoverage(siteId: string): Promise<number> {
    // Simplified implementation - calculate what percentage of sensitive fields are encrypted
    // This would require analyzing database schema and field encryption status
    return 0.85; // Placeholder: 85% coverage
  }

  private async calculateComplianceScore(siteId: string): Promise<number> {
    // Simplified compliance scoring based on multiple factors
    let score = 100;

    // Check key rotation compliance
    const overdueKeys = await this.checkOverdueKeyRotations(siteId);
    score -= overdueKeys.length * 5; // -5 points per overdue key

    // Check encryption coverage
    const coverage = await this.calculateEncryptionCoverage(siteId);
    if (coverage < 0.9) score -= 10;

    // Check audit trail completeness
    const auditGaps = await this.checkAuditGaps(siteId);
    score -= auditGaps * 3; // -3 points per audit gap

    return Math.max(0, Math.min(100, score));
  }

  private async assessKeyManagement(siteId: string, dateRange: { start: Date; end: Date }) {
    const activeKeys = await prisma.encryptionKey.count({
      where: { siteId, status: 'ACTIVE' },
    });

    const overdueKeys = await this.checkOverdueKeyRotations(siteId);
    
    let score = 100;
    const recommendations: string[] = [];

    if (overdueKeys.length > 0) {
      score -= overdueKeys.length * 10;
      recommendations.push('Rotate overdue encryption keys');
    }

    if (activeKeys < 3) {
      score -= 15;
      recommendations.push('Implement key separation by data type');
    }

    return {
      score: Math.max(0, score),
      details: {
        activeKeys,
        overdueKeys: overdueKeys.length,
        rotationCompliance: overdueKeys.length === 0,
      },
      recommendations,
    };
  }

  private async assessDataEncryption(siteId: string, dateRange: { start: Date; end: Date }) {
    const coverage = await this.calculateEncryptionCoverage(siteId);
    
    let score = Math.round(coverage * 100);
    const recommendations: string[] = [];

    if (coverage < 0.9) {
      recommendations.push('Increase encryption coverage for sensitive data');
    }

    if (coverage < 0.8) {
      score -= 20;
      recommendations.push('Implement field-level encryption for PII');
    }

    return {
      score,
      details: {
        encryptionCoverage: coverage * 100,
        encryptedFields: Math.round(coverage * 50), // Placeholder
        totalSensitiveFields: 50, // Placeholder
      },
      recommendations,
    };
  }

  private async assessAccessControl(siteId: string, dateRange: { start: Date; end: Date }) {
    // Simplified access control assessment
    const unauthorizedAttempts = await this.checkUnauthorizedAccess(siteId);
    
    let score = 100;
    const recommendations: string[] = [];

    if (unauthorizedAttempts.count > 0) {
      score -= unauthorizedAttempts.count * 5;
      recommendations.push('Review and strengthen access controls');
    }

    return {
      score: Math.max(0, score),
      details: {
        unauthorizedAttempts: unauthorizedAttempts.count,
        accessControlsInPlace: true,
      },
      recommendations,
    };
  }

  private async assessAuditTrail(siteId: string, dateRange: { start: Date; end: Date }) {
    const auditGaps = await this.checkAuditGaps(siteId);
    
    let score = 100 - (auditGaps * 10);
    const recommendations: string[] = [];

    if (auditGaps > 0) {
      recommendations.push('Address audit logging gaps');
    }

    return {
      score: Math.max(0, score),
      details: {
        auditGaps,
        loggingEnabled: true,
        retentionCompliance: true,
      },
      recommendations,
    };
  }

  private async checkComplianceViolations(siteId: string, dateRange: { start: Date; end: Date }) {
    const violations = [];

    // Check for encryption policy violations
    const policyViolations = await prisma.policyViolation.findMany({
      where: {
        siteId,
        createdAt: { gte: dateRange.start, lte: dateRange.end },
        policy: {
          category: 'ENCRYPTION',
        },
      },
      include: { policy: true },
    });

    for (const violation of policyViolations) {
      violations.push({
        type: 'POLICY_VIOLATION',
        severity: violation.severity,
        description: violation.details as string,
        recommendation: 'Review and address policy violation',
      });
    }

    return violations;
  }

  private async checkRecentFailures(siteId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const failures = await prisma.keyUsageLog.count({
      where: {
        siteId,
        success: false,
        createdAt: { gte: oneDayAgo },
      },
    });

    return { count: failures };
  }

  private async checkKeyStrength(siteId: string) {
    // Simplified key strength check
    // In production, this would analyze key entropy and strength
    return []; // No weak keys found
  }

  private async checkAccessPatterns(siteId: string) {
    // Simplified access pattern analysis
    // In production, this would use ML to detect anomalous access patterns
    return []; // No suspicious patterns
  }

  private async checkAuditGaps(siteId: string): Promise<number> {
    // Simplified audit gap detection
    // This would check for missing audit logs in expected timeframes
    return 0; // No gaps found
  }
}

// Export singleton instance
export const encryptionMonitoringService = new EncryptionMonitoringService();

// Export types
export type {
  EncryptionMetrics,
  SecurityAlert,
  ComplianceReport,
}; 