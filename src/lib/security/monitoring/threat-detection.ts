import { prisma } from '../../prisma';
import { redis } from '../../redis';
import { siemService, SecurityEvent } from './siem-service';
import { z } from 'zod';

// Threat detection configuration
const THREAT_DETECTION_CONFIG = {
  // Machine learning model parameters
  modelParameters: {
    anomalyThreshold: 0.7, // Threshold for anomaly detection
    behaviorWindowDays: 30, // Days of behavior history to analyze
    minDataPoints: 10, // Minimum data points for reliable analysis
    retrainingInterval: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Baseline metrics for normal behavior
  baselineMetrics: {
    maxLoginAttemptsPerHour: 10,
    maxAPICallsPerMinute: 100,
    maxDataAccessPerHour: 50,
    maxFileUploadsPerHour: 20,
    normalBusinessHours: { start: 8, end: 18 },
    commonCountries: ['US', 'CA', 'GB', 'DE', 'FR'],
  },

  // Threat patterns
  threatPatterns: {
    bruteForce: {
      failedAttempts: 5,
      timeWindow: 300, // 5 minutes
      severity: 'HIGH',
    },
    accountTakeover: {
      successAfterFailures: true,
      newDeviceLogin: true,
      geographicalAnomaly: true,
      severity: 'CRITICAL',
    },
    dataExfiltration: {
      unusualDataVolume: true,
      offHoursActivity: true,
      newDestination: true,
      severity: 'CRITICAL',
    },
    privilegeEscalation: {
      adminActionsByRegularUser: true,
      rapidPermissionChanges: true,
      unusualAdminActivity: true,
      severity: 'HIGH',
    },
    insiderThreat: {
      anomalousDataAccess: true,
      offHoursActivity: true,
      massDataDownload: true,
      severity: 'HIGH',
    },
  },

  // Anomaly detection algorithms
  algorithms: {
    statistical: {
      enabled: true,
      zScoreThreshold: 3.0, // Standard deviations from mean
      movingAverageWindow: 24, // Hours
    },
    isolation: {
      enabled: true,
      contaminationRate: 0.05, // Expected anomaly rate
      features: ['loginFrequency', 'dataAccess', 'apiCalls', 'fileOperations'],
    },
    clustering: {
      enabled: true,
      algorithm: 'DBSCAN',
      minSamples: 5,
      epsilon: 0.5,
    },
  },
} as const;

// Validation schemas
export const behaviorProfileSchema = z.object({
  userId: z.string(),
  profileType: z.enum(['LOGIN', 'API_USAGE', 'DATA_ACCESS', 'FILE_OPERATIONS', 'ADMIN_ACTIONS']),
  timeWindow: z.enum(['HOURLY', 'DAILY', 'WEEKLY']),
  metrics: z.record(z.number()),
  baseline: z.record(z.number()),
  lastUpdated: z.date(),
});

export const anomalyDetectionSchema = z.object({
  entityId: z.string(), // User, IP, or resource ID
  entityType: z.enum(['USER', 'IP_ADDRESS', 'RESOURCE', 'SESSION']),
  anomalyType: z.enum([
    'STATISTICAL', 'BEHAVIORAL', 'TEMPORAL', 'GEOGRAPHICAL',
    'VOLUME', 'PATTERN', 'FREQUENCY', 'SEQUENCE'
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  features: z.record(z.number()),
  baseline: z.record(z.number()),
  metadata: z.record(z.any()).optional(),
});

export const threatAssessmentSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['USER', 'RESOURCE', 'SYSTEM', 'NETWORK']),
  threatType: z.enum([
    'BRUTE_FORCE', 'ACCOUNT_TAKEOVER', 'DATA_EXFILTRATION',
    'PRIVILEGE_ESCALATION', 'INSIDER_THREAT', 'MALWARE',
    'PHISHING', 'SQL_INJECTION', 'XSS', 'DDoS'
  ]),
  riskScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  indicators: z.array(z.string()),
  mitigationActions: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
});

// Interfaces
interface BehaviorProfile {
  id: string;
  userId: string;
  profileType: string;
  timeWindow: string;
  metrics: Record<string, number>;
  baseline: Record<string, number>;
  lastUpdated: Date;
  anomalyScore: number;
  isAnomalous: boolean;
}

interface AnomalyDetection {
  id: string;
  entityId: string;
  entityType: string;
  anomalyType: string;
  severity: string;
  confidence: number;
  description: string;
  features: Record<string, number>;
  baseline: Record<string, number>;
  detectedAt: Date;
  resolved: boolean;
  metadata: Record<string, any>;
}

interface ThreatAssessment {
  id: string;
  targetId: string;
  targetType: string;
  threatType: string;
  riskScore: number;
  confidence: number;
  indicators: string[];
  mitigationActions: string[];
  createdAt: Date;
  metadata: Record<string, any>;
}

interface UserBehaviorBaseline {
  userId: string;
  loginPatterns: {
    averageLoginsPerDay: number;
    commonHours: number[];
    commonDaysOfWeek: number[];
    commonLocations: string[];
    commonDevices: string[];
  };
  apiUsagePatterns: {
    averageCallsPerHour: number;
    commonEndpoints: string[];
    requestSizeDistribution: number[];
  };
  dataAccessPatterns: {
    averageAccessesPerDay: number;
    commonResources: string[];
    accessTimeDistribution: number[];
  };
  lastUpdated: Date;
}

// Threat Detection Engine
export class ThreatDetectionEngine {
  private userBaselines: Map<string, UserBehaviorBaseline> = new Map();
  private anomalyDetectors: Map<string, any> = new Map();
  private threatModels: Map<string, any> = new Map();

  constructor() {
    this.initializeEngine();
  }

  /**
   * Initialize threat detection engine
   */
  private async initializeEngine(): Promise<void> {
    try {
      // Load existing behavior profiles
      await this.loadBehaviorProfiles();

      // Initialize ML models
      await this.initializeMLModels();

      // Start background processing
      this.startBackgroundProcessing();

      // Subscribe to security events
      siemService.on('securityEvent', (event: SecurityEvent) => {
        this.processSecurityEvent(event);
      });

      console.log('Threat Detection Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Threat Detection Engine:', error);
    }
  }

  /**
   * Process security event for threat detection
   */
  async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Update behavior profiles
      await this.updateBehaviorProfile(event);

      // Perform real-time anomaly detection
      const anomalies = await this.detectAnomalies(event);

      // Assess threat level
      const threatAssessment = await this.assessThreat(event, anomalies);

      // Generate alerts if necessary
      if (threatAssessment.riskScore >= 70) {
        await this.generateThreatAlert(event, threatAssessment, anomalies);
      }

      // Update threat intelligence
      await this.updateThreatIntelligence(event, threatAssessment);

    } catch (error) {
      console.error('Failed to process security event for threat detection:', error);
    }
  }

  /**
   * Detect anomalies in security event
   */
  async detectAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    try {
      // Statistical anomaly detection
      if (THREAT_DETECTION_CONFIG.algorithms.statistical.enabled) {
        const statisticalAnomalies = await this.detectStatisticalAnomalies(event);
        anomalies.push(...statisticalAnomalies);
      }

      // Behavioral anomaly detection
      const behavioralAnomalies = await this.detectBehavioralAnomalies(event);
      anomalies.push(...behavioralAnomalies);

      // Temporal anomaly detection
      const temporalAnomalies = await this.detectTemporalAnomalies(event);
      anomalies.push(...temporalAnomalies);

      // Geographical anomaly detection
      const geographicalAnomalies = await this.detectGeographicalAnomalies(event);
      anomalies.push(...geographicalAnomalies);

      // Volume anomaly detection
      const volumeAnomalies = await this.detectVolumeAnomalies(event);
      anomalies.push(...volumeAnomalies);

      // Pattern anomaly detection
      const patternAnomalies = await this.detectPatternAnomalies(event);
      anomalies.push(...patternAnomalies);

      // Store anomalies in database
      for (const anomaly of anomalies) {
        await this.storeAnomaly(anomaly);
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect anomalies:', error);
      return [];
    }
  }

  /**
   * Assess threat level based on event and anomalies
   */
  async assessThreat(
    event: SecurityEvent,
    anomalies: AnomalyDetection[]
  ): Promise<ThreatAssessment> {
    try {
      let riskScore = event.threatScore || 0;
      let confidence = 0.5;
      const indicators: string[] = [];
      const mitigationActions: string[] = [];

      // Analyze anomalies
      for (const anomaly of anomalies) {
        riskScore += this.getAnomalyRiskContribution(anomaly);
        confidence = Math.max(confidence, anomaly.confidence);
        indicators.push(`${anomaly.anomalyType}: ${anomaly.description}`);
      }

      // Pattern-based threat detection
      const threatType = await this.identifyThreatType(event, anomalies);
      const patternRisk = await this.assessThreatPattern(threatType, event, anomalies);
      
      riskScore += patternRisk.additionalRisk;
      indicators.push(...patternRisk.indicators);
      mitigationActions.push(...patternRisk.mitigations);

      // Historical context analysis
      const historicalRisk = await this.analyzeHistoricalContext(event);
      riskScore += historicalRisk;

      // Cap risk score at 100
      riskScore = Math.min(riskScore, 100);

      // Determine threat type if not identified
      const finalThreatType = threatType || this.categorizeThreatByScore(riskScore);

      const assessment: ThreatAssessment = {
        id: crypto.randomUUID(),
        targetId: event.userId || event.ipAddress || 'unknown',
        targetType: event.userId ? 'USER' : 'NETWORK',
        threatType: finalThreatType,
        riskScore,
        confidence,
        indicators,
        mitigationActions,
        createdAt: new Date(),
        metadata: {
          eventId: event.id,
          anomaliesCount: anomalies.length,
          baselineThreatScore: event.threatScore,
          anomalyContribution: riskScore - (event.threatScore || 0),
        },
      };

      // Store threat assessment
      await this.storeThreatAssessment(assessment);

      return assessment;

    } catch (error) {
      console.error('Failed to assess threat:', error);
      throw new Error(`Threat assessment failed: ${error.message}`);
    }
  }

  /**
   * Update behavior profile based on security event
   */
  private async updateBehaviorProfile(event: SecurityEvent): Promise<void> {
    if (!event.userId) return;

    try {
      // Get or create baseline
      let baseline = this.userBaselines.get(event.userId);
      if (!baseline) {
        baseline = await this.createUserBaseline(event.userId);
        this.userBaselines.set(event.userId, baseline);
      }

      // Update baseline with new event data
      await this.updateUserBaseline(baseline, event);

      // Store updated baseline
      await this.storeUserBaseline(baseline);

    } catch (error) {
      console.error('Failed to update behavior profile:', error);
    }
  }

  /**
   * Detect statistical anomalies using z-score analysis
   */
  private async detectStatisticalAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    if (!event.userId) return anomalies;

    try {
      // Get recent events for statistical analysis
      const recentEvents = await this.getRecentUserEvents(
        event.userId,
        THREAT_DETECTION_CONFIG.algorithms.statistical.movingAverageWindow
      );

      if (recentEvents.length < THREAT_DETECTION_CONFIG.modelParameters.minDataPoints) {
        return anomalies; // Not enough data for reliable analysis
      }

      // Calculate metrics for current event
      const currentMetrics = this.extractEventMetrics(event);

      // Calculate baseline metrics from recent events
      const baselineMetrics = this.calculateBaselineMetrics(recentEvents);

      // Detect anomalies using z-score
      for (const [metric, value] of Object.entries(currentMetrics)) {
        if (baselineMetrics[metric]) {
          const zScore = this.calculateZScore(
            value,
            baselineMetrics[metric].mean,
            baselineMetrics[metric].stdDev
          );

          if (Math.abs(zScore) > THREAT_DETECTION_CONFIG.algorithms.statistical.zScoreThreshold) {
            anomalies.push({
              id: crypto.randomUUID(),
              entityId: event.userId,
              entityType: 'USER',
              anomalyType: 'STATISTICAL',
              severity: this.getSeverityFromZScore(zScore),
              confidence: Math.min(Math.abs(zScore) / 5, 1), // Normalize confidence
              description: `Statistical anomaly in ${metric}: z-score ${zScore.toFixed(2)}`,
              features: { [metric]: value, zScore },
              baseline: baselineMetrics[metric],
              detectedAt: new Date(),
              resolved: false,
              metadata: {
                eventId: event.id,
                algorithm: 'z-score',
                threshold: THREAT_DETECTION_CONFIG.algorithms.statistical.zScoreThreshold,
              },
            });
          }
        }
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect statistical anomalies:', error);
      return [];
    }
  }

  /**
   * Detect behavioral anomalies
   */
  private async detectBehavioralAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    if (!event.userId) return anomalies;

    try {
      const baseline = this.userBaselines.get(event.userId);
      if (!baseline) return anomalies;

      // Check login patterns
      if (event.eventType === 'AUTHENTICATION') {
        const loginAnomalies = await this.checkLoginPatternAnomalies(event, baseline);
        anomalies.push(...loginAnomalies);
      }

      // Check API usage patterns
      if (event.eventType === 'API_ACCESS') {
        const apiAnomalies = await this.checkAPIUsageAnomalies(event, baseline);
        anomalies.push(...apiAnomalies);
      }

      // Check data access patterns
      if (event.eventType === 'DATA_ACCESS') {
        const dataAnomalies = await this.checkDataAccessAnomalies(event, baseline);
        anomalies.push(...dataAnomalies);
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect behavioral anomalies:', error);
      return [];
    }
  }

  /**
   * Detect temporal anomalies (unusual timing)
   */
  private async detectTemporalAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    try {
      const eventTime = event.timestamp;
      const hour = eventTime.getHours();
      const dayOfWeek = eventTime.getDay();

      // Check if event occurs during business hours
      const isBusinessHours = hour >= THREAT_DETECTION_CONFIG.baselineMetrics.normalBusinessHours.start && 
                             hour <= THREAT_DETECTION_CONFIG.baselineMetrics.normalBusinessHours.end;

      // Check if it's a weekday
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      // Off-hours activity is suspicious for certain event types
      const suspiciousOffHours = ['ADMIN_OPERATION', 'DATA_ACCESS', 'FILE_OPERATION'];
      
      if (!isBusinessHours && suspiciousOffHours.includes(event.eventType)) {
        anomalies.push({
          id: crypto.randomUUID(),
          entityId: event.userId || event.ipAddress || 'unknown',
          entityType: event.userId ? 'USER' : 'IP_ADDRESS',
          anomalyType: 'TEMPORAL',
          severity: 'MEDIUM',
          confidence: 0.7,
          description: `Off-hours activity detected: ${event.eventType} at ${hour}:00`,
          features: { hour, dayOfWeek, isBusinessHours: false },
          baseline: { 
            normalStartHour: THREAT_DETECTION_CONFIG.baselineMetrics.normalBusinessHours.start,
            normalEndHour: THREAT_DETECTION_CONFIG.baselineMetrics.normalBusinessHours.end,
          },
          detectedAt: new Date(),
          resolved: false,
          metadata: {
            eventId: event.id,
            eventTime: eventTime.toISOString(),
          },
        });
      }

      // Weekend activity for sensitive operations
      if (!isWeekday && suspiciousOffHours.includes(event.eventType)) {
        anomalies.push({
          id: crypto.randomUUID(),
          entityId: event.userId || event.ipAddress || 'unknown',
          entityType: event.userId ? 'USER' : 'IP_ADDRESS',
          anomalyType: 'TEMPORAL',
          severity: 'MEDIUM',
          confidence: 0.6,
          description: `Weekend activity detected: ${event.eventType} on ${dayOfWeek}`,
          features: { dayOfWeek, isWeekday: false },
          baseline: { normalDays: [1, 2, 3, 4, 5] },
          detectedAt: new Date(),
          resolved: false,
          metadata: {
            eventId: event.id,
            eventTime: eventTime.toISOString(),
          },
        });
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect temporal anomalies:', error);
      return [];
    }
  }

  /**
   * Detect geographical anomalies
   */
  private async detectGeographicalAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    if (!event.ipAddress || !event.userId) return anomalies;

    try {
      // Get user's historical locations
      const userLocations = await this.getUserHistoricalLocations(event.userId);
      
      // Get current location from IP
      const currentLocation = await this.getLocationFromIP(event.ipAddress);
      
      if (!currentLocation || !userLocations.length) return anomalies;

      // Check if current location is in common locations
      const isCommonLocation = userLocations.some(loc => 
        this.calculateDistance(loc, currentLocation) < 100 // Within 100km
      );

      // Check if country is in common countries
      const isCommonCountry = THREAT_DETECTION_CONFIG.baselineMetrics.commonCountries.includes(
        currentLocation.country
      );

      if (!isCommonLocation) {
        const severity = isCommonCountry ? 'MEDIUM' : 'HIGH';
        const confidence = isCommonCountry ? 0.6 : 0.8;

        anomalies.push({
          id: crypto.randomUUID(),
          entityId: event.userId,
          entityType: 'USER',
          anomalyType: 'GEOGRAPHICAL',
          severity,
          confidence,
          description: `Login from unusual location: ${currentLocation.city}, ${currentLocation.country}`,
          features: {
            currentCountry: currentLocation.country,
            currentCity: currentLocation.city,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          baseline: {
            commonCountries: THREAT_DETECTION_CONFIG.baselineMetrics.commonCountries,
            historicalLocations: userLocations.length,
          },
          detectedAt: new Date(),
          resolved: false,
          metadata: {
            eventId: event.id,
            ipAddress: event.ipAddress,
            newLocation: !isCommonLocation,
            newCountry: !isCommonCountry,
          },
        });
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect geographical anomalies:', error);
      return [];
    }
  }

  /**
   * Detect volume anomalies
   */
  private async detectVolumeAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    try {
      // Get recent activity volume for comparison
      const recentVolume = await this.getRecentActivityVolume(
        event.userId || event.ipAddress || 'unknown',
        event.eventType,
        3600 // 1 hour window
      );

      // Check against baseline thresholds
      const threshold = this.getVolumeThreshold(event.eventType);
      
      if (recentVolume > threshold) {
        anomalies.push({
          id: crypto.randomUUID(),
          entityId: event.userId || event.ipAddress || 'unknown',
          entityType: event.userId ? 'USER' : 'IP_ADDRESS',
          anomalyType: 'VOLUME',
          severity: this.getVolumeSeverity(recentVolume, threshold),
          confidence: Math.min((recentVolume / threshold) / 2, 1),
          description: `High volume of ${event.eventType}: ${recentVolume} events in last hour`,
          features: { currentVolume: recentVolume, timeWindow: 3600 },
          baseline: { normalThreshold: threshold },
          detectedAt: new Date(),
          resolved: false,
          metadata: {
            eventId: event.id,
            eventType: event.eventType,
            exceedsThreshold: recentVolume > threshold,
          },
        });
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect volume anomalies:', error);
      return [];
    }
  }

  /**
   * Detect pattern anomalies
   */
  private async detectPatternAnomalies(event: SecurityEvent): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    try {
      // Check for known attack patterns
      const patterns = await this.checkAttackPatterns(event);
      
      for (const pattern of patterns) {
        anomalies.push({
          id: crypto.randomUUID(),
          entityId: event.userId || event.ipAddress || 'unknown',
          entityType: event.userId ? 'USER' : 'IP_ADDRESS',
          anomalyType: 'PATTERN',
          severity: pattern.severity,
          confidence: pattern.confidence,
          description: `Attack pattern detected: ${pattern.name}`,
          features: pattern.features,
          baseline: pattern.baseline,
          detectedAt: new Date(),
          resolved: false,
          metadata: {
            eventId: event.id,
            patternName: pattern.name,
            patternType: pattern.type,
            matchedRules: pattern.rules,
          },
        });
      }

      return anomalies;

    } catch (error) {
      console.error('Failed to detect pattern anomalies:', error);
      return [];
    }
  }

  // Helper methods (continued in next part due to length)

  private async loadBehaviorProfiles(): Promise<void> {
    // Load existing user baselines from database
    const profiles = await prisma.userBehaviorProfile.findMany({
      where: { 
        lastUpdated: { 
          gte: new Date(Date.now() - THREAT_DETECTION_CONFIG.modelParameters.behaviorWindowDays * 24 * 60 * 60 * 1000) 
        } 
      },
    });

    for (const profile of profiles) {
      const baseline: UserBehaviorBaseline = {
        userId: profile.userId,
        loginPatterns: profile.loginPatterns as any,
        apiUsagePatterns: profile.apiUsagePatterns as any,
        dataAccessPatterns: profile.dataAccessPatterns as any,
        lastUpdated: profile.lastUpdated,
      };
      
      this.userBaselines.set(profile.userId, baseline);
    }
  }

  private async initializeMLModels(): Promise<void> {
    // Initialize machine learning models for anomaly detection
    // This would typically involve loading pre-trained models or initializing new ones
    console.log('Initializing ML models for threat detection...');
  }

  private startBackgroundProcessing(): void {
    // Update behavior baselines every hour
    setInterval(async () => {
      await this.updateAllBehaviorBaselines();
    }, 3600000);

    // Retrain models daily
    setInterval(async () => {
      await this.retrainAnomalyModels();
    }, THREAT_DETECTION_CONFIG.modelParameters.retrainingInterval);

    // Clean up old anomalies weekly
    setInterval(async () => {
      await this.cleanupOldAnomalies();
    }, 7 * 24 * 3600000);
  }

  private async createUserBaseline(userId: string): Promise<UserBehaviorBaseline> {
    // Create initial baseline from historical data
    const historicalEvents = await this.getUserHistoricalEvents(userId);
    
    return {
      userId,
      loginPatterns: this.calculateLoginPatterns(historicalEvents),
      apiUsagePatterns: this.calculateAPIUsagePatterns(historicalEvents),
      dataAccessPatterns: this.calculateDataAccessPatterns(historicalEvents),
      lastUpdated: new Date(),
    };
  }

  private async updateUserBaseline(baseline: UserBehaviorBaseline, event: SecurityEvent): Promise<void> {
    // Update baseline with exponential moving average
    const alpha = 0.1; // Learning rate

    switch (event.eventType) {
      case 'AUTHENTICATION':
        this.updateLoginPatterns(baseline.loginPatterns, event, alpha);
        break;
      case 'API_ACCESS':
        this.updateAPIUsagePatterns(baseline.apiUsagePatterns, event, alpha);
        break;
      case 'DATA_ACCESS':
        this.updateDataAccessPatterns(baseline.dataAccessPatterns, event, alpha);
        break;
    }

    baseline.lastUpdated = new Date();
  }

  private async storeUserBaseline(baseline: UserBehaviorBaseline): Promise<void> {
    await prisma.userBehaviorProfile.upsert({
      where: { userId: baseline.userId },
      create: {
        userId: baseline.userId,
        loginPatterns: baseline.loginPatterns,
        apiUsagePatterns: baseline.apiUsagePatterns,
        dataAccessPatterns: baseline.dataAccessPatterns,
        lastUpdated: baseline.lastUpdated,
      },
      update: {
        loginPatterns: baseline.loginPatterns,
        apiUsagePatterns: baseline.apiUsagePatterns,
        dataAccessPatterns: baseline.dataAccessPatterns,
        lastUpdated: baseline.lastUpdated,
      },
    });
  }

  private async storeAnomaly(anomaly: AnomalyDetection): Promise<void> {
    await prisma.anomalyDetection.create({
      data: {
        entityId: anomaly.entityId,
        entityType: anomaly.entityType,
        anomalyType: anomaly.anomalyType,
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        description: anomaly.description,
        features: anomaly.features,
        baseline: anomaly.baseline,
        resolved: anomaly.resolved,
        metadata: anomaly.metadata,
      },
    });
  }

  private async storeThreatAssessment(assessment: ThreatAssessment): Promise<void> {
    await prisma.threatAssessment.create({
      data: {
        targetId: assessment.targetId,
        targetType: assessment.targetType,
        threatType: assessment.threatType,
        riskScore: assessment.riskScore,
        confidence: assessment.confidence,
        indicators: assessment.indicators,
        mitigationActions: assessment.mitigationActions,
        metadata: assessment.metadata,
      },
    });
  }

  private getAnomalyRiskContribution(anomaly: AnomalyDetection): number {
    const severityScores = { LOW: 5, MEDIUM: 15, HIGH: 25, CRITICAL: 40 };
    return (severityScores[anomaly.severity as keyof typeof severityScores] || 5) * anomaly.confidence;
  }

  private async identifyThreatType(event: SecurityEvent, anomalies: AnomalyDetection[]): Promise<string> {
    // Logic to identify threat type based on event and anomalies
    const patterns = await this.checkAttackPatterns(event);
    
    if (patterns.length > 0) {
      return patterns[0].type;
    }

    // Fallback based on event type and anomalies
    if (event.eventType === 'AUTHENTICATION' && anomalies.some(a => a.anomalyType === 'VOLUME')) {
      return 'BRUTE_FORCE';
    }

    if (event.eventType === 'DATA_ACCESS' && anomalies.some(a => a.anomalyType === 'VOLUME')) {
      return 'DATA_EXFILTRATION';
    }

    if (event.eventType === 'ADMIN_OPERATION') {
      return 'PRIVILEGE_ESCALATION';
    }

    return 'UNKNOWN';
  }

  private async assessThreatPattern(
    threatType: string,
    event: SecurityEvent,
    anomalies: AnomalyDetection[]
  ): Promise<{ additionalRisk: number; indicators: string[]; mitigations: string[] }> {
    const patterns = THREAT_DETECTION_CONFIG.threatPatterns;
    let additionalRisk = 0;
    const indicators: string[] = [];
    const mitigations: string[] = [];

    switch (threatType) {
      case 'BRUTE_FORCE':
        additionalRisk = 30;
        indicators.push('Multiple failed authentication attempts');
        mitigations.push('Implement account lockout', 'Enable CAPTCHA', 'Monitor login attempts');
        break;

      case 'ACCOUNT_TAKEOVER':
        additionalRisk = 40;
        indicators.push('Successful login after failures', 'New device/location');
        mitigations.push('Force password reset', 'Enable MFA', 'Review account activity');
        break;

      case 'DATA_EXFILTRATION':
        additionalRisk = 45;
        indicators.push('Unusual data volume access', 'Off-hours activity');
        mitigations.push('Monitor data access', 'Implement DLP', 'Review user permissions');
        break;

      case 'PRIVILEGE_ESCALATION':
        additionalRisk = 35;
        indicators.push('Administrative actions by regular user');
        mitigations.push('Review permissions', 'Implement PAM', 'Monitor admin actions');
        break;

      default:
        additionalRisk = 10;
        indicators.push('General suspicious activity');
        mitigations.push('Monitor user activity', 'Review security logs');
        break;
    }

    return { additionalRisk, indicators, mitigations };
  }

  private async analyzeHistoricalContext(event: SecurityEvent): Promise<number> {
    // Analyze historical context for additional risk
    let contextRisk = 0;

    if (event.userId) {
      // Check if user has been flagged recently
      const recentFlags = await this.getRecentUserFlags(event.userId);
      contextRisk += recentFlags * 5;

      // Check if user has elevated privileges
      const hasElevatedPrivileges = await this.userHasElevatedPrivileges(event.userId);
      if (hasElevatedPrivileges) {
        contextRisk += 10;
      }
    }

    if (event.ipAddress) {
      // Check IP reputation
      const ipReputation = await this.getIPReputation(event.ipAddress);
      contextRisk += ipReputation.riskScore;
    }

    return contextRisk;
  }

  private categorizeThreatByScore(riskScore: number): string {
    if (riskScore >= 80) return 'CRITICAL_THREAT';
    if (riskScore >= 60) return 'HIGH_THREAT';
    if (riskScore >= 40) return 'MEDIUM_THREAT';
    return 'LOW_THREAT';
  }

  private async generateThreatAlert(
    event: SecurityEvent,
    assessment: ThreatAssessment,
    anomalies: AnomalyDetection[]
  ): Promise<void> {
    await siemService.ingestEvent({
      eventType: 'THREAT_DETECTED',
      severity: this.getRiskSeverity(assessment.riskScore),
      source: 'ThreatDetectionEngine',
      title: `${assessment.threatType} Detected`,
      description: `High-risk threat detected: ${assessment.threatType} (Risk Score: ${assessment.riskScore})`,
      userId: event.userId,
      siteId: event.siteId,
      ipAddress: event.ipAddress,
      metadata: {
        originalEventId: event.id,
        threatAssessmentId: assessment.id,
        riskScore: assessment.riskScore,
        confidence: assessment.confidence,
        anomaliesCount: anomalies.length,
        indicators: assessment.indicators,
        mitigationActions: assessment.mitigationActions,
      },
    });
  }

  private async updateThreatIntelligence(
    event: SecurityEvent,
    assessment: ThreatAssessment
  ): Promise<void> {
    // Update threat intelligence based on assessment
    if (assessment.riskScore >= 80 && event.ipAddress) {
      await siemService.createThreatIndicator({
        type: 'MALICIOUS_IP',
        value: event.ipAddress,
        severity: 'HIGH',
        confidence: assessment.confidence * 100,
        source: 'ThreatDetectionEngine',
        description: `IP flagged by threat detection: ${assessment.threatType}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        metadata: {
          threatType: assessment.threatType,
          riskScore: assessment.riskScore,
          detectionTime: new Date().toISOString(),
        },
      });
    }
  }

  // Additional helper methods would continue here...
  // Due to length constraints, showing the core structure and key methods

  private getRiskSeverity(riskScore: number): 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= 90) return 'CRITICAL';
    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    if (riskScore >= 30) return 'LOW';
    return 'INFO';
  }

  // Placeholder implementations for remaining helper methods
  private async getRecentUserEvents(userId: string, hours: number): Promise<SecurityEvent[]> { return []; }
  private extractEventMetrics(event: SecurityEvent): Record<string, number> { return {}; }
  private calculateBaselineMetrics(events: SecurityEvent[]): Record<string, any> { return {}; }
  private calculateZScore(value: number, mean: number, stdDev: number): number { return 0; }
  private getSeverityFromZScore(zScore: number): string { return 'MEDIUM'; }
  private async checkLoginPatternAnomalies(event: SecurityEvent, baseline: UserBehaviorBaseline): Promise<AnomalyDetection[]> { return []; }
  private async checkAPIUsageAnomalies(event: SecurityEvent, baseline: UserBehaviorBaseline): Promise<AnomalyDetection[]> { return []; }
  private async checkDataAccessAnomalies(event: SecurityEvent, baseline: UserBehaviorBaseline): Promise<AnomalyDetection[]> { return []; }
  private async getUserHistoricalLocations(userId: string): Promise<any[]> { return []; }
  private async getLocationFromIP(ipAddress: string): Promise<any> { return null; }
  private calculateDistance(loc1: any, loc2: any): number { return 0; }
  private async getRecentActivityVolume(entityId: string, eventType: string, window: number): Promise<number> { return 0; }
  private getVolumeThreshold(eventType: string): number { return 100; }
  private getVolumeSeverity(volume: number, threshold: number): string { return 'MEDIUM'; }
  private async checkAttackPatterns(event: SecurityEvent): Promise<any[]> { return []; }
  private async getUserHistoricalEvents(userId: string): Promise<SecurityEvent[]> { return []; }
  private calculateLoginPatterns(events: SecurityEvent[]): any { return {}; }
  private calculateAPIUsagePatterns(events: SecurityEvent[]): any { return {}; }
  private calculateDataAccessPatterns(events: SecurityEvent[]): any { return {}; }
  private updateLoginPatterns(patterns: any, event: SecurityEvent, alpha: number): void { }
  private updateAPIUsagePatterns(patterns: any, event: SecurityEvent, alpha: number): void { }
  private updateDataAccessPatterns(patterns: any, event: SecurityEvent, alpha: number): void { }
  private async updateAllBehaviorBaselines(): Promise<void> { }
  private async retrainAnomalyModels(): Promise<void> { }
  private async cleanupOldAnomalies(): Promise<void> { }
  private async getRecentUserFlags(userId: string): Promise<number> { return 0; }
  private async userHasElevatedPrivileges(userId: string): Promise<boolean> { return false; }
  private async getIPReputation(ipAddress: string): Promise<{ riskScore: number }> { return { riskScore: 0 }; }
}

// Export singleton instance
export const threatDetectionEngine = new ThreatDetectionEngine();

// Export types
export type {
  BehaviorProfile,
  AnomalyDetection,
  ThreatAssessment,
  UserBehaviorBaseline,
}; 