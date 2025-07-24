import { PrismaClient } from './src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Seeding security data...');

  // Create sample sites if they don't exist
  const site = await prisma.site.upsert({
    where: { domain: 'demo.example.com' },
    update: {},
    create: {
      id: 'site_security_demo',
      name: 'Security Demo Site',
      domain: 'demo.example.com',
      description: 'Demo site for security features',
      locale: 'en',
      theme: 'default',
      branding: 'default',
      isActive: true,
    },
  });

  // Create security admin user
  const securityAdmin = await prisma.user.upsert({
    where: { email: 'security@demo.com' },
    update: {},
    create: {
      id: 'user_security_admin',
      email: 'security@demo.com',
      password: await bcrypt.hash('SecurePass123!', 12),
      name: 'Security Administrator',
      role: 'ADMIN',
      isActive: true,
      siteId: site.id,
      profile: {
        create: {
          bio: 'Security Administrator responsible for managing security policies and incidents',
          avatar: '/avatars/security-admin.png',
        }
      }
    },
  });

  // Create security compliance officer
  const complianceOfficer = await prisma.user.upsert({
    where: { email: 'compliance@demo.com' },
    update: {},
    create: {
      id: 'user_compliance_officer',
      email: 'compliance@demo.com',
      password: await bcrypt.hash('CompliancePass123!', 12),
      name: 'Compliance Officer',
      role: 'ADMIN',
      isActive: true,
      siteId: site.id,
      profile: {
        create: {
          bio: 'Compliance Officer ensuring regulatory compliance',
          avatar: '/avatars/compliance-officer.png',
        }
      }
    },
  });

  console.log('✅ Created security users');

  // Create security policies
  const securityPolicies = [
    {
      id: 'policy_data_protection',
      name: 'Data Protection Policy',
      description: 'Comprehensive data protection and privacy policy',
      type: 'DATA_PROTECTION' as const,
      category: 'LEGAL' as const,
      priority: 'CRITICAL' as const,
      policy: {
        rules: [
          'All personal data must be encrypted at rest and in transit',
          'Data retention periods must be clearly defined and enforced',
          'Users must provide explicit consent for data processing',
          'Data access must be logged and monitored',
        ],
        requirements: ['GDPR', 'CCPA'],
        controls: ['encryption', 'access_logging', 'consent_management'],
      },
      enforcement: 'STRICT' as const,
      scope: ['user_data', 'personal_information', 'payment_data'],
      status: 'ACTIVE' as const,
      effectiveDate: new Date('2024-01-01'),
      ownerId: securityAdmin.id,
      approvedBy: complianceOfficer.id,
      approvedAt: new Date('2024-01-01'),
      regulations: ['GDPR', 'CCPA'],
      controls: ['data_encryption', 'access_control', 'audit_logging'],
      reviewCycle: 365, // Annual review
      nextReview: new Date('2025-01-01'),
      siteId: site.id,
    },
    {
      id: 'policy_access_control',
      name: 'Access Control Policy',
      description: 'Role-based access control and authentication policy',
      type: 'ACCESS_CONTROL' as const,
      category: 'TECHNICAL' as const,
      priority: 'HIGH' as const,
      policy: {
        rules: [
          'Multi-factor authentication required for administrative access',
          'Password complexity requirements must be enforced',
          'Access privileges follow principle of least privilege',
          'Regular access reviews must be conducted',
        ],
        requirements: ['strong_passwords', 'mfa', 'role_based_access'],
        controls: ['authentication', 'authorization', 'session_management'],
      },
      enforcement: 'STRICT' as const,
      scope: ['admin_access', 'user_authentication', 'system_access'],
      status: 'ACTIVE' as const,
      effectiveDate: new Date('2024-01-01'),
      ownerId: securityAdmin.id,
      approvedBy: securityAdmin.id,
      approvedAt: new Date('2024-01-01'),
      regulations: ['ISO27001', 'SOC2'],
      controls: ['mfa', 'rbac', 'password_policy'],
      reviewCycle: 180, // Semi-annual review
      nextReview: new Date('2024-07-01'),
      siteId: site.id,
    },
    {
      id: 'policy_incident_response',
      name: 'Incident Response Policy',
      description: 'Security incident response procedures and workflows',
      type: 'INCIDENT_RESPONSE' as const,
      category: 'OPERATIONAL' as const,
      priority: 'CRITICAL' as const,
      policy: {
        rules: [
          'All security incidents must be reported within 24 hours',
          'Incident response team must be activated for critical incidents',
          'Evidence preservation procedures must be followed',
          'Post-incident reviews must be conducted',
        ],
        requirements: ['incident_detection', 'response_team', 'documentation'],
        controls: ['monitoring', 'alerting', 'forensics'],
      },
      enforcement: 'STRICT' as const,
      scope: ['security_incidents', 'data_breaches', 'system_compromises'],
      status: 'ACTIVE' as const,
      effectiveDate: new Date('2024-01-01'),
      ownerId: securityAdmin.id,
      approvedBy: complianceOfficer.id,
      approvedAt: new Date('2024-01-01'),
      regulations: ['GDPR', 'HIPAA', 'SOX'],
      controls: ['incident_management', 'forensics', 'communication'],
      reviewCycle: 365, // Annual review
      nextReview: new Date('2025-01-01'),
      siteId: site.id,
    },
  ];

  for (const policyData of securityPolicies) {
    await prisma.securityPolicy.upsert({
      where: { id: policyData.id },
      update: policyData,
      create: policyData,
    });
  }

  console.log('✅ Created security policies');

  // Create compliance records
  const complianceRecords = [
    {
      id: 'compliance_gdpr_2024',
      regulation: 'GDPR' as const,
      status: 'COMPLIANT' as const,
      requirement: 'Article 32 - Security of processing',
      description: 'Technical and organizational measures for data security',
      evidence: {
        encryption: 'AES-256 encryption implemented',
        access_control: 'RBAC system in place',
        monitoring: 'Comprehensive audit logging enabled',
        training: 'Security awareness training completed',
      },
      assessedBy: complianceOfficer.id,
      assessedAt: new Date('2024-01-15'),
      nextReview: new Date('2024-07-15'),
      riskLevel: 'LOW' as const,
      findings: [],
      remediation: [],
      auditTrail: [
        {
          date: '2024-01-15',
          action: 'Initial assessment completed',
          officer: complianceOfficer.name,
        },
      ],
      siteId: site.id,
      userId: complianceOfficer.id,
    },
    {
      id: 'compliance_ccpa_2024',
      regulation: 'CCPA' as const,
      status: 'COMPLIANT' as const,
      requirement: 'Right to Know - Data disclosure requirements',
      description: 'Consumer rights regarding personal information collection',
      evidence: {
        privacy_policy: 'Comprehensive privacy policy published',
        consent_management: 'Consent management system implemented',
        data_mapping: 'Data flow mapping completed',
        response_procedures: 'Consumer request procedures established',
      },
      assessedBy: complianceOfficer.id,
      assessedAt: new Date('2024-01-20'),
      nextReview: new Date('2024-07-20'),
      riskLevel: 'LOW' as const,
      findings: [],
      remediation: [],
      auditTrail: [
        {
          date: '2024-01-20',
          action: 'CCPA compliance assessment completed',
          officer: complianceOfficer.name,
        },
      ],
      siteId: site.id,
      userId: complianceOfficer.id,
    },
    {
      id: 'compliance_iso27001_2024',
      regulation: 'ISO27001' as const,
      status: 'PARTIAL' as const,
      requirement: 'A.12.6.1 - Management of technical vulnerabilities',
      description: 'Vulnerability management process implementation',
      evidence: {
        vulnerability_scanning: 'Automated scanning tools deployed',
        patch_management: 'Patch management process documented',
        risk_assessment: 'Vulnerability risk assessments conducted',
      },
      assessedBy: securityAdmin.id,
      assessedAt: new Date('2024-02-01'),
      nextReview: new Date('2024-05-01'),
      riskLevel: 'MEDIUM' as const,
      findings: [
        'Patch deployment process needs improvement',
        'Vulnerability response times exceed policy requirements',
      ],
      remediation: [
        'Implement automated patch management system',
        'Reduce vulnerability response time to 72 hours for critical issues',
      ],
      auditTrail: [
        {
          date: '2024-02-01',
          action: 'Vulnerability management assessment',
          officer: securityAdmin.name,
        },
      ],
      siteId: site.id,
      userId: securityAdmin.id,
    },
  ];

  for (const recordData of complianceRecords) {
    await prisma.complianceRecord.upsert({
      where: { id: recordData.id },
      update: recordData,
      create: recordData,
    });
  }

  console.log('✅ Created compliance records');

  // Create encryption keys
  const encryptionKeys = [
    {
      id: 'key_data_encryption',
      keyId: 'himaya-data-enc-2024-01',
      name: 'Data Encryption Key',
      description: 'Primary key for encrypting user data at rest',
      algorithm: 'AES_256' as const,
      keySize: 256,
      purpose: 'ENCRYPTION' as const,
      status: 'ACTIVE' as const,
      generatedAt: new Date('2024-01-01'),
      activatedAt: new Date('2024-01-01'),
      expiresAt: new Date('2025-01-01'),
      rotationCycle: 365,
      nextRotation: new Date('2025-01-01'),
      autoRotate: true,
      usageCount: 0,
      compliance: ['GDPR', 'CCPA', 'HIPAA'],
      metadata: {
        version: '1.0',
        environment: 'production',
        backup_location: 'encrypted',
      },
      tags: ['production', 'data-encryption', 'auto-rotate'],
      siteId: site.id,
    },
    {
      id: 'key_session_signing',
      keyId: 'himaya-session-sign-2024-01',
      name: 'Session Signing Key',
      description: 'Key for signing user session tokens',
      algorithm: 'RSA_2048' as const,
      keySize: 2048,
      purpose: 'SIGNING' as const,
      status: 'ACTIVE' as const,
      generatedAt: new Date('2024-01-01'),
      activatedAt: new Date('2024-01-01'),
      expiresAt: new Date('2024-07-01'),
      rotationCycle: 180,
      nextRotation: new Date('2024-07-01'),
      autoRotate: true,
      usageCount: 0,
      compliance: ['ISO27001', 'SOC2'],
      metadata: {
        version: '1.0',
        environment: 'production',
        key_strength: 'high',
      },
      tags: ['production', 'session-signing', 'jwt'],
      siteId: site.id,
    },
  ];

  for (const keyData of encryptionKeys) {
    await prisma.encryptionKey.upsert({
      where: { id: keyData.id },
      update: keyData,
      create: keyData,
    });
  }

  console.log('✅ Created encryption keys');

  // Create sample security events
  const securityEvents = [
    {
      id: 'event_login_success_001',
      eventType: 'LOGIN_SUCCESS' as const,
      severity: 'INFO' as const,
      title: 'Successful User Login',
      description: 'User successfully logged in to the system',
      source: 'authentication_service',
      metadata: {
        login_method: 'password',
        mfa_used: false,
        session_duration: '24h',
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: {
        country: 'United States',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles',
      },
      deviceInfo: {
        device_type: 'desktop',
        os: 'Windows 10',
        browser: 'Chrome',
      },
      success: true,
      detected: true,
      resolved: true,
      detectedAt: new Date('2024-01-15T10:30:00Z'),
      resolvedAt: new Date('2024-01-15T10:30:00Z'),
      siteId: site.id,
      userId: securityAdmin.id,
    },
    {
      id: 'event_suspicious_login_001',
      eventType: 'SUSPICIOUS_ACTIVITY' as const,
      severity: 'MEDIUM' as const,
      title: 'Suspicious Login Attempt',
      description: 'Login attempt from unusual location detected',
      source: 'security_monitoring',
      metadata: {
        risk_score: 75,
        unusual_location: true,
        new_device: true,
        geolocation_mismatch: true,
      },
      ipAddress: '203.0.113.45',
      userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      location: {
        country: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC',
      },
      deviceInfo: {
        device_type: 'mobile',
        os: 'Android',
        browser: 'Chrome Mobile',
      },
      success: false,
      detected: true,
      resolved: false,
      detectedAt: new Date('2024-01-15T14:45:00Z'),
      responseUserId: securityAdmin.id,
      responseActions: ['account_locked', 'notification_sent', 'investigation_started'],
      siteId: site.id,
      userId: complianceOfficer.id,
    },
    {
      id: 'event_data_export_001',
      eventType: 'DATA_EXPORT' as const,
      severity: 'HIGH' as const,
      title: 'Large Data Export Detected',
      description: 'Unusual large data export operation detected',
      source: 'data_loss_prevention',
      metadata: {
        export_size: '500MB',
        record_count: 10000,
        data_types: ['user_profiles', 'payment_info'],
        export_format: 'CSV',
      },
      ipAddress: '10.0.1.50',
      userAgent: 'API Client v1.0',
      success: true,
      detected: true,
      resolved: false,
      detectedAt: new Date('2024-01-16T09:15:00Z'),
      responseUserId: securityAdmin.id,
      responseActions: ['export_verified', 'user_contacted', 'audit_log_created'],
      siteId: site.id,
      userId: complianceOfficer.id,
    },
  ];

  for (const eventData of securityEvents) {
    await prisma.securityEvent.upsert({
      where: { id: eventData.id },
      update: eventData,
      create: eventData,
    });
  }

  console.log('✅ Created security events');

  // Create sample audit logs
  const auditLogs = [
    {
      id: 'audit_policy_update_001',
      action: 'UPDATE' as const,
      resource: 'SecurityPolicy',
      resourceId: 'policy_data_protection',
      resourceType: 'security_policy',
      description: 'Updated data protection policy effective date',
      details: {
        field_changed: 'effectiveDate',
        change_reason: 'Compliance requirement update',
      },
      metadata: {
        change_request_id: 'CR-2024-001',
        approver: complianceOfficer.name,
      },
      method: 'PUT',
      endpoint: '/api/security/policies/policy_data_protection',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      sessionId: 'sess_security_admin_001',
      status: 'SUCCESS' as const,
      oldValues: {
        effectiveDate: '2023-12-31',
      },
      newValues: {
        effectiveDate: '2024-01-01',
      },
      riskLevel: 'LOW' as const,
      compliance: ['GDPR', 'CCPA'],
      siteId: site.id,
      userId: securityAdmin.id,
    },
    {
      id: 'audit_key_rotation_001',
      action: 'ROTATE' as const,
      resource: 'EncryptionKey',
      resourceId: 'key_data_encryption',
      resourceType: 'encryption_key',
      description: 'Automatic key rotation performed',
      details: {
        rotation_type: 'automatic',
        old_key_retired: true,
        new_key_activated: true,
      },
      metadata: {
        rotation_schedule: 'annual',
        backup_created: true,
      },
      status: 'SUCCESS' as const,
      riskLevel: 'LOW' as const,
      compliance: ['GDPR', 'HIPAA'],
      siteId: site.id,
    },
    {
      id: 'audit_incident_creation_001',
      action: 'CREATE' as const,
      resource: 'SecurityIncident',
      resourceId: 'incident_suspicious_activity_001',
      resourceType: 'security_incident',
      description: 'Security incident created for suspicious activity',
      details: {
        incident_type: 'suspicious_activity',
        severity: 'medium',
        auto_created: true,
      },
      metadata: {
        trigger_event: 'event_suspicious_login_001',
        response_team_notified: true,
      },
      method: 'POST',
      endpoint: '/api/security/incidents',
      ipAddress: '127.0.0.1',
      userAgent: 'Security-Monitor/1.0',
      status: 'SUCCESS' as const,
      newValues: {
        title: 'Suspicious Login Activity Detected',
        severity: 'MEDIUM',
        status: 'NEW',
      },
      riskLevel: 'MEDIUM' as const,
      compliance: ['ISO27001'],
      siteId: site.id,
      userId: securityAdmin.id,
    },
  ];

  for (const logData of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: logData.id },
      update: logData,
      create: logData,
    });
  }

  console.log('✅ Created audit logs');

  // Create user security profiles
  const userSecurityProfiles = [
    {
      id: 'profile_security_admin',
      userId: securityAdmin.id,
      mfaEnabled: true,
      mfaMethod: 'TOTP' as const,
      mfaBackupCodes: ['12345678', '87654321', '11223344'], // In real app, these would be hashed
      lastMFAVerification: new Date('2024-01-15T10:30:00Z'),
      passwordChangedAt: new Date('2024-01-01'),
      passwordExpiresAt: new Date('2024-04-01'),
      failedLoginAttempts: 0,
      maxSessions: 3,
      activeSessions: 1,
      lastLoginAt: new Date('2024-01-15T10:30:00Z'),
      lastLoginIP: '192.168.1.100',
      lastLoginLocation: {
        country: 'United States',
        city: 'San Francisco',
      },
      securityNotifications: true,
      suspiciousActivity: true,
      dataExportRequest: true,
      riskScore: 25.0,
      riskFactors: ['admin_privileges'],
      lastRiskAssessment: new Date('2024-01-15'),
      consentGiven: true,
      consentDate: new Date('2024-01-01'),
      dataProcessingConsent: {
        analytics: true,
        marketing: false,
        security_monitoring: true,
      },
      lastSecurityEvent: new Date('2024-01-15T10:30:00Z'),
      securityEventCount: 1,
      siteId: site.id,
    },
    {
      id: 'profile_compliance_officer',
      userId: complianceOfficer.id,
      mfaEnabled: true,
      mfaMethod: 'HARDWARE_TOKEN' as const,
      lastMFAVerification: new Date('2024-01-15T08:00:00Z'),
      passwordChangedAt: new Date('2024-01-01'),
      passwordExpiresAt: new Date('2024-04-01'),
      failedLoginAttempts: 0,
      maxSessions: 5,
      activeSessions: 2,
      lastLoginAt: new Date('2024-01-15T08:00:00Z'),
      lastLoginIP: '192.168.1.101',
      lastLoginLocation: {
        country: 'United States',
        city: 'San Francisco',
      },
      securityNotifications: true,
      suspiciousActivity: true,
      dataExportRequest: true,
      riskScore: 30.0,
      riskFactors: ['admin_privileges', 'data_access'],
      lastRiskAssessment: new Date('2024-01-15'),
      consentGiven: true,
      consentDate: new Date('2024-01-01'),
      dataProcessingConsent: {
        analytics: true,
        marketing: false,
        security_monitoring: true,
        compliance_monitoring: true,
      },
      lastSecurityEvent: new Date('2024-01-15T14:45:00Z'),
      securityEventCount: 2,
      siteId: site.id,
    },
  ];

  for (const profileData of userSecurityProfiles) {
    await prisma.userSecurityProfile.upsert({
      where: { id: profileData.id },
      update: profileData,
      create: profileData,
    });
  }

  console.log('✅ Created user security profiles');

  // Create sample vulnerability scan
  const vulnerabilityScan = {
    id: 'scan_web_app_001',
    scanType: 'WEB_APPLICATION' as const,
    status: 'COMPLETED' as const,
    target: 'https://demo.example.com',
    scanner: 'OWASP ZAP',
    version: '2.14.0',
    configuration: {
      scan_type: 'full',
      authentication: false,
      spider_enabled: true,
      passive_scan: true,
      active_scan: true,
    },
    scheduledBy: securityAdmin.id,
    scheduledAt: new Date('2024-01-14T22:00:00Z'),
    startedAt: new Date('2024-01-14T22:00:00Z'),
    completedAt: new Date('2024-01-14T23:30:00Z'),
    duration: 5400, // 90 minutes
    totalVulns: 12,
    criticalVulns: 0,
    highVulns: 2,
    mediumVulns: 5,
    lowVulns: 4,
    infoVulns: 1,
    results: [
      {
        title: 'Missing HTTPS Strict Transport Security Header',
        severity: 'medium',
        description: 'The HSTS header is not present in the response',
        recommendation: 'Add Strict-Transport-Security header',
      },
      {
        title: 'X-Content-Type-Options Header Missing',
        severity: 'low',
        description: 'Anti-MIME-Sniffing header not present',
        recommendation: 'Add X-Content-Type-Options: nosniff header',
      },
    ],
    reportUrl: '/security/reports/scan_web_app_001.html',
    reviewed: true,
    reviewedBy: securityAdmin.id,
    reviewedAt: new Date('2024-01-15T09:00:00Z'),
    siteId: site.id,
  };

  await prisma.vulnerabilityScan.upsert({
    where: { id: vulnerabilityScan.id },
    update: vulnerabilityScan,
    create: vulnerabilityScan,
  });

  console.log('✅ Created vulnerability scan');

  // Create sample security incident
  const securityIncident = {
    id: 'incident_suspicious_activity_001',
    incidentNumber: 'INC-2024-001',
    title: 'Suspicious Login Activity Detected',
    description: 'Multiple failed login attempts followed by successful login from unusual location',
    severity: 'MEDIUM' as const,
    priority: 'P2_HIGH' as const,
    category: 'SUSPICIOUS_ACTIVITY' as const,
    type: 'SECURITY_INCIDENT' as const,
    source: 'EXTERNAL' as const,
    vector: 'WEB' as const,
    detectedAt: new Date('2024-01-15T14:45:00Z'),
    reportedAt: new Date('2024-01-15T14:50:00Z'),
    acknowledgedAt: new Date('2024-01-15T15:00:00Z'),
    assignedTo: securityAdmin.id,
    reportedBy: securityAdmin.id,
    status: 'INVESTIGATING' as const,
    stage: 'ANALYSIS' as const,
    impact: 'LOW' as const,
    affectedSystems: ['authentication_service', 'user_portal'],
    affectedUsers: 1,
    dataCompromised: false,
    responseTeam: [securityAdmin.id, complianceOfficer.id],
    actions: [
      'Account temporarily locked',
      'User notification sent',
      'Security team alerted',
      'Investigation initiated',
    ],
    containment: {
      actions_taken: ['account_lock', 'session_termination'],
      timestamp: '2024-01-15T15:00:00Z',
      effective: true,
    },
    notifications: [
      {
        recipient: 'user',
        method: 'email',
        timestamp: '2024-01-15T15:05:00Z',
      },
      {
        recipient: 'security_team',
        method: 'slack',
        timestamp: '2024-01-15T14:50:00Z',
      },
    ],
    external: false,
    regulatory: false,
    siteId: site.id,
  };

  await prisma.securityIncident.upsert({
    where: { id: securityIncident.id },
    update: securityIncident,
    create: securityIncident,
  });

  console.log('✅ Created security incident');

  // Create incident timeline
  const incidentTimelines = [
    {
      id: 'timeline_001_detection',
      incidentId: securityIncident.id,
      action: 'Incident Detected',
      description: 'Automated monitoring system detected suspicious login activity',
      category: 'DETECTION' as const,
      details: {
        detection_method: 'automated',
        risk_score: 75,
        trigger_rules: ['unusual_location', 'multiple_failures'],
      },
      timestamp: new Date('2024-01-15T14:45:00Z'),
      siteId: site.id,
    },
    {
      id: 'timeline_001_analysis',
      incidentId: securityIncident.id,
      userId: securityAdmin.id,
      action: 'Initial Analysis',
      description: 'Security team reviewed the detected activity and confirmed suspicious behavior',
      category: 'ANALYSIS' as const,
      details: {
        analyst: securityAdmin.name,
        findings: 'Login attempts from geographically distant location within short timeframe',
        recommendation: 'Investigate and contain',
      },
      timestamp: new Date('2024-01-15T15:00:00Z'),
      duration: 15,
      siteId: site.id,
    },
    {
      id: 'timeline_001_containment',
      incidentId: securityIncident.id,
      userId: securityAdmin.id,
      action: 'Containment Actions',
      description: 'Implemented containment measures to prevent further unauthorized access',
      category: 'CONTAINMENT' as const,
      details: {
        actions: ['account_locked', 'sessions_terminated', 'access_blocked'],
        effective_time: '2024-01-15T15:05:00Z',
      },
      timestamp: new Date('2024-01-15T15:05:00Z'),
      duration: 5,
      siteId: site.id,
    },
  ];

  for (const timelineData of incidentTimelines) {
    await prisma.incidentTimeline.upsert({
      where: { id: timelineData.id },
      update: timelineData,
      create: timelineData,
    });
  }

  console.log('✅ Created incident timeline');

  console.log('🎉 Security data seeding completed successfully!');
  console.log(`
  Created:
  - 2 Security users (admin & compliance officer)
  - 3 Security policies
  - 3 Compliance records
  - 2 Encryption keys
  - 3 Security events
  - 3 Audit logs
  - 2 User security profiles
  - 1 Vulnerability scan
  - 1 Security incident with timeline
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding security data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 