import { prisma } from '../prisma';
import { gdprConsentService } from '../gdpr/consent-management';
import { gdprUserRightsService } from '../gdpr/user-rights';
import { dataAnonymizationService } from '../gdpr/data-anonymization';
import { z } from 'zod';

// CCPA compliance configuration
const CCPA_CONFIG = {
  applicabilityThresholds: {
    annualRevenue: 25000000, // $25 million
    personalInfoRecords: 50000, // 50,000 consumers
    dataProcessingRevenue: 0.5, // 50% of revenue from selling personal info
  },
  consumerRights: [
    'RIGHT_TO_KNOW', // Categories and specific pieces of PI collected
    'RIGHT_TO_DELETE', // Deletion of personal information
    'RIGHT_TO_OPT_OUT', // Opt-out of sale of personal information
    'RIGHT_TO_NON_DISCRIMINATION', // Non-discrimination for exercising rights
    'RIGHT_TO_DATA_PORTABILITY', // Access to personal information in portable format
  ],
  piCategories: [
    'IDENTIFIERS', // Name, alias, postal address, unique personal identifier, online identifier, IP address, email, account name, SSN, driver's license, passport, or other similar identifiers
    'PERSONAL_RECORDS', // Records containing personal information, as defined in Cal. Civil Code § 1798.80(e)
    'PROTECTED_CLASSIFICATIONS', // Age, race, color, ancestry, national origin, citizenship, religion, marital status, medical condition, physical or mental disability, sex, sexual orientation, veteran or military status, genetic information
    'COMMERCIAL_INFO', // Records of personal property, products or services purchased, obtaining history, or other purchasing or consuming histories or tendencies
    'BIOMETRIC_INFO', // Genetic, physiological, behavioral, and biological characteristics, or activity patterns used to extract a template or other identifier or identifying information
    'INTERNET_ACTIVITY', // Browsing history, search history, information on a consumer's interaction with a website, application, or advertisement
    'GEOLOCATION_DATA', // Physical location or movements
    'SENSORY_DATA', // Audio, electronic, visual, thermal, olfactory, or similar information
    'PROFESSIONAL_INFO', // Current or past job history or performance evaluations
    'EDUCATION_INFO', // Information that is not publicly available personally identifiable information as defined in the Family Educational Rights and Privacy Act
    'INFERENCES', // Profile reflecting a person's preferences, characteristics, psychological trends, predispositions, behavior, attitudes, intelligence, abilities, and aptitudes
  ],
  businessPurposes: [
    'PROVIDING_SERVICES', // Performing services, including maintaining or servicing accounts, providing customer service, processing or fulfilling orders and transactions, verifying customer information, processing payments, providing financing, providing advertising or marketing services, providing analytic services, or providing similar services
    'SECURITY', // Detecting security incidents, protecting against malicious, deceptive, fraudulent, or illegal activity, and prosecuting those responsible for that activity
    'DEBUGGING', // Debugging to identify and repair errors that impair existing intended functionality
    'SHORT_TERM_USE', // Short-term, transient use, including, but not limited to, non-personalized advertising shown as part of a consumer's current interaction with the business, provided that the consumer's personal information is not disclosed to another third party and is not used to build a profile about the consumer or otherwise alter the consumer's experience outside the current interaction with the business
    'QUALITY_ASSURANCE', // Performing services on behalf of the business or service provider, including maintaining or servicing accounts, providing customer service, processing or fulfilling orders and transactions, verifying customer information, processing payments, providing financing, providing advertising or marketing services, providing analytic services, or providing similar services
    'RESEARCH', // Undertaking internal research for technological development and demonstration
    'QUALITY_IMPROVEMENT', // Undertaking activities to verify or maintain the quality or safety of a service or device that is owned, manufactured, manufactured for, or controlled by the business, and to improve, upgrade, or enhance the service or device that is owned, manufactured, manufactured for, or controlled by the business
  ],
  responseTimeframes: {
    acknowledgeRequest: 10, // Days to acknowledge request
    fulfillRequest: 45, // Days to fulfill request (can be extended by 45 more days)
    notifyDataSale: 0, // Immediate notification required
  },
  verificationMethods: ['EMAIL', 'PHONE', 'GOVERNMENT_ID', 'UTILITY_BILL'],
  saleOptOutMethods: ['WEBSITE_FORM', 'EMAIL', 'PHONE', 'MAIL'],
} as const;

// Validation schemas
export const ccpaRequestSchema = z.object({
  consumerId: z.string(),
  requestType: z.enum(['RIGHT_TO_KNOW', 'RIGHT_TO_DELETE', 'RIGHT_TO_OPT_OUT', 'RIGHT_TO_NON_DISCRIMINATION', 'RIGHT_TO_DATA_PORTABILITY']),
  specificRequest: z.string().optional(), // Specific categories or pieces of information requested
  timeFrame: z.enum(['12_MONTHS', 'ALL_TIME']).default('12_MONTHS'),
  verificationMethod: z.enum(['EMAIL', 'PHONE', 'GOVERNMENT_ID', 'UTILITY_BILL']),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mailingAddress: z.string().optional(),
  }),
  agentInfo: z.object({
    isAgent: z.boolean().default(false),
    agentName: z.string().optional(),
    agentRelationship: z.string().optional(),
    authorizationDocument: z.string().optional(),
  }).optional(),
});

export const dataSaleOptOutSchema = z.object({
  consumerId: z.string(),
  optOutMethod: z.enum(['WEBSITE_FORM', 'EMAIL', 'PHONE', 'MAIL']),
  categories: z.array(z.string()).optional(), // Specific categories to opt out of
  effectiveDate: z.date().optional(),
  globalOptOut: z.boolean().default(false), // Global Privacy Control (GPC) signal
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export const ccpaDisclosureSchema = z.object({
  businessName: z.string(),
  period: z.enum(['LAST_12_MONTHS', 'CURRENT_YEAR', 'PREVIOUS_YEAR']),
  includeThirdParties: z.boolean().default(true),
  includeServiceProviders: z.boolean().default(true),
  format: z.enum(['JSON', 'HTML', 'PDF']),
});

// CCPA interfaces
interface CCPARequest {
  id: string;
  consumerId: string;
  requestType: string;
  specificRequest?: string;
  timeFrame: string;
  status: 'RECEIVED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'DENIED' | 'EXPIRED';
  submittedAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'INSUFFICIENT';
  verificationMethod: string;
  contactInfo: {
    email?: string;
    phone?: string;
    mailingAddress?: string;
  };
  agentInfo?: {
    isAgent: boolean;
    agentName?: string;
    agentRelationship?: string;
    authorizationDocument?: string;
  };
  response?: any;
  metadata: Record<string, any>;
}

interface CCPADisclosure {
  businessInfo: {
    name: string;
    address: string;
    website: string;
    contactInfo: string;
  };
  reportingPeriod: {
    start: Date;
    end: Date;
    description: string;
  };
  personalInfoCategories: Array<{
    category: string;
    description: string;
    sources: string[];
    businessPurposes: string[];
    thirdParties: string[];
    sold: boolean;
    disclosed: boolean;
    retentionPeriod: string;
  }>;
  consumerRights: string[];
  requestStatistics: {
    totalRequests: number;
    requestsByType: Record<string, number>;
    averageResponseTime: number;
    complianceRate: number;
  };
  dataSales: {
    occurred: boolean;
    categories: string[];
    thirdParties: string[];
    optOutRequests: number;
  };
  thirdPartyDisclosures: Array<{
    category: string;
    recipients: string[];
    businessPurpose: string;
  }>;
}

// CCPA Compliance Service
export class CCPAComplianceService {

  /**
   * Check if business is subject to CCPA
   */
  async checkCCPAApplicability(businessId: string): Promise<{
    isSubject: boolean;
    reasons: string[];
    thresholds: {
      revenue: { current: number; threshold: number; meets: boolean };
      records: { current: number; threshold: number; meets: boolean };
      dataRevenue: { current: number; threshold: number; meets: boolean };
    };
  }> {
    try {
      // Get business metrics (simplified - would integrate with actual business data)
      const metrics = await this.getBusinessMetrics(businessId);

      const thresholds = {
        revenue: {
          current: metrics.annualRevenue,
          threshold: CCPA_CONFIG.applicabilityThresholds.annualRevenue,
          meets: metrics.annualRevenue >= CCPA_CONFIG.applicabilityThresholds.annualRevenue,
        },
        records: {
          current: metrics.personalInfoRecords,
          threshold: CCPA_CONFIG.applicabilityThresholds.personalInfoRecords,
          meets: metrics.personalInfoRecords >= CCPA_CONFIG.applicabilityThresholds.personalInfoRecords,
        },
        dataRevenue: {
          current: metrics.dataProcessingRevenue,
          threshold: CCPA_CONFIG.applicabilityThresholds.dataProcessingRevenue,
          meets: metrics.dataProcessingRevenue >= CCPA_CONFIG.applicabilityThresholds.dataProcessingRevenue,
        },
      };

      const isSubject = Object.values(thresholds).some(t => t.meets);
      
      const reasons = [];
      if (thresholds.revenue.meets) reasons.push('Annual revenue exceeds $25 million');
      if (thresholds.records.meets) reasons.push('Processes personal information of 50,000+ California consumers');
      if (thresholds.dataRevenue.meets) reasons.push('Derives 50%+ of revenue from selling personal information');

      return {
        isSubject,
        reasons,
        thresholds,
      };

    } catch (error) {
      console.error('Error checking CCPA applicability:', error);
      return {
        isSubject: false,
        reasons: ['Error determining applicability'],
        thresholds: {
          revenue: { current: 0, threshold: CCPA_CONFIG.applicabilityThresholds.annualRevenue, meets: false },
          records: { current: 0, threshold: CCPA_CONFIG.applicabilityThresholds.personalInfoRecords, meets: false },
          dataRevenue: { current: 0, threshold: CCPA_CONFIG.applicabilityThresholds.dataProcessingRevenue, meets: false },
        },
      };
    }
  }

  /**
   * Submit CCPA consumer request
   */
  async submitCCPARequest(
    requestData: z.infer<typeof ccpaRequestSchema>,
    siteId: string
  ): Promise<CCPARequest> {
    try {
      const validatedData = ccpaRequestSchema.parse(requestData);

      // Check if consumer is a California resident (simplified validation)
      const isCaliforniaResident = await this.verifyCaliforniaResidency(validatedData.consumerId);
      if (!isCaliforniaResident) {
        throw new Error('CCPA rights are only available to California residents');
      }

      // Create CCPA request record
      const ccpaRequest = await prisma.auditLog.create({
        data: {
          siteId,
          userId: validatedData.consumerId,
          action: 'CREATE',
          resource: 'ccpa_request',
          resourceType: 'ccpa_rights',
          description: `CCPA ${validatedData.requestType} request submitted`,
          status: 'RECEIVED',
          metadata: {
            requestType: validatedData.requestType,
            specificRequest: validatedData.specificRequest,
            timeFrame: validatedData.timeFrame,
            verificationMethod: validatedData.verificationMethod,
            contactInfo: validatedData.contactInfo,
            agentInfo: validatedData.agentInfo,
            submittedAt: new Date().toISOString(),
            ccpaCompliance: true,
          },
        },
      });

      // Send acknowledgment (CCPA requires acknowledgment within 10 days)
      await this.sendRequestAcknowledgment(ccpaRequest.id, validatedData);

      // Update status to acknowledged
      await this.updateRequestStatus(ccpaRequest.id, 'ACKNOWLEDGED');

      // Initialize verification process
      await this.initiateVerification(ccpaRequest.id, validatedData.verificationMethod);

      // Log CCPA event
      await this.logCCPAEvent({
        type: 'REQUEST_SUBMITTED',
        requestType: validatedData.requestType,
        consumerId: validatedData.consumerId,
        siteId,
        metadata: {
          requestId: ccpaRequest.id,
          timeFrame: validatedData.timeFrame,
          isAgent: validatedData.agentInfo?.isAgent || false,
        },
      });

      return {
        id: ccpaRequest.id,
        consumerId: validatedData.consumerId,
        requestType: validatedData.requestType,
        specificRequest: validatedData.specificRequest,
        timeFrame: validatedData.timeFrame,
        status: 'ACKNOWLEDGED',
        submittedAt: ccpaRequest.createdAt,
        acknowledgedAt: new Date(),
        verificationStatus: 'PENDING',
        verificationMethod: validatedData.verificationMethod,
        contactInfo: validatedData.contactInfo,
        agentInfo: validatedData.agentInfo,
        metadata: ccpaRequest.metadata as Record<string, any>,
      };

    } catch (error) {
      await this.logCCPAEvent({
        type: 'REQUEST_FAILED',
        requestType: requestData.requestType,
        consumerId: requestData.consumerId,
        siteId,
        metadata: { error: error.message },
      });
      throw new Error(`Failed to submit CCPA request: ${error.message}`);
    }
  }

  /**
   * Process "Right to Know" request
   */
  async processRightToKnowRequest(requestId: string): Promise<{
    success: boolean;
    disclosureInfo?: any;
    message: string;
  }> {
    try {
      const request = await this.getCCPARequest(requestId);
      if (!request || request.verificationStatus !== 'VERIFIED') {
        throw new Error('Request must be verified before processing');
      }

      await this.updateRequestStatus(requestId, 'IN_PROGRESS');

      // Gather information based on timeframe
      const disclosureInfo = await this.gatherConsumerInfo(
        request.consumerId,
        request.timeFrame,
        request.specificRequest
      );

      // Store response
      await this.storeRequestResponse(requestId, disclosureInfo);

      await this.updateRequestStatus(requestId, 'COMPLETED');

      await this.logCCPAEvent({
        type: 'RIGHT_TO_KNOW_COMPLETED',
        requestType: 'RIGHT_TO_KNOW',
        consumerId: request.consumerId,
        siteId: '',
        metadata: {
          requestId,
          categoriesDisclosed: Object.keys(disclosureInfo.categories || {}),
        },
      });

      return {
        success: true,
        disclosureInfo,
        message: 'Right to know request completed successfully',
      };

    } catch (error) {
      await this.updateRequestStatus(requestId, 'DENIED');
      throw new Error(`Failed to process right to know request: ${error.message}`);
    }
  }

  /**
   * Process data sale opt-out request
   */
  async processDataSaleOptOut(
    optOutData: z.infer<typeof dataSaleOptOutSchema>,
    siteId: string
  ): Promise<{
    success: boolean;
    effectiveDate: Date;
    optOutId: string;
  }> {
    try {
      const validatedData = dataSaleOptOutSchema.parse(optOutData);

      const effectiveDate = validatedData.effectiveDate || new Date();
      const optOutId = crypto.randomUUID();

      // Create opt-out record
      await prisma.complianceRecord.create({
        data: {
          siteId,
          userId: validatedData.consumerId,
          type: 'CCPA_OPT_OUT',
          requirement: 'DATA_SALE_OPT_OUT',
          status: 'COMPLIANT',
          evidence: {
            optOutMethod: validatedData.optOutMethod,
            categories: validatedData.categories || 'ALL',
            globalOptOut: validatedData.globalOptOut,
            userAgent: validatedData.userAgent,
            ipAddress: validatedData.ipAddress,
            effectiveDate: effectiveDate.toISOString(),
          },
          metadata: {
            optOutId,
            ccpaCompliance: true,
          },
        },
      });

      // Update user profile to reflect opt-out status
      await this.updateConsumerOptOutStatus(
        validatedData.consumerId,
        siteId,
        true,
        validatedData.categories
      );

      // Notify third parties of opt-out (if applicable)
      await this.notifyThirdPartiesOfOptOut(
        validatedData.consumerId,
        validatedData.categories || []
      );

      // Log opt-out event
      await this.logCCPAEvent({
        type: 'DATA_SALE_OPT_OUT',
        requestType: 'RIGHT_TO_OPT_OUT',
        consumerId: validatedData.consumerId,
        siteId,
        metadata: {
          optOutId,
          method: validatedData.optOutMethod,
          globalOptOut: validatedData.globalOptOut,
          categories: validatedData.categories,
        },
      });

      return {
        success: true,
        effectiveDate,
        optOutId,
      };

    } catch (error) {
      await this.logCCPAEvent({
        type: 'OPT_OUT_FAILED',
        requestType: 'RIGHT_TO_OPT_OUT',
        consumerId: optOutData.consumerId,
        siteId,
        metadata: { error: error.message },
      });
      throw new Error(`Failed to process opt-out request: ${error.message}`);
    }
  }

  /**
   * Generate CCPA disclosure report
   */
  async generateCCPADisclosure(
    disclosureData: z.infer<typeof ccpaDisclosureSchema>,
    siteId: string
  ): Promise<CCPADisclosure> {
    try {
      const validatedData = ccpaDisclosureSchema.parse(disclosureData);

      const disclosure: CCPADisclosure = {
        businessInfo: await this.getBusinessInfo(validatedData.businessName, siteId),
        reportingPeriod: this.getReportingPeriod(validatedData.period),
        personalInfoCategories: await this.getPersonalInfoCategories(siteId, validatedData.period),
        consumerRights: CCPA_CONFIG.consumerRights,
        requestStatistics: await this.getRequestStatistics(siteId, validatedData.period),
        dataSales: await this.getDataSalesInfo(siteId, validatedData.period),
        thirdPartyDisclosures: await this.getThirdPartyDisclosures(siteId, validatedData.period),
      };

      // Log disclosure generation
      await this.logCCPAEvent({
        type: 'DISCLOSURE_GENERATED',
        requestType: 'DISCLOSURE',
        consumerId: '',
        siteId,
        metadata: {
          period: validatedData.period,
          format: validatedData.format,
          categoriesCount: disclosure.personalInfoCategories.length,
        },
      });

      return disclosure;

    } catch (error) {
      console.error('Error generating CCPA disclosure:', error);
      throw new Error(`Failed to generate CCPA disclosure: ${error.message}`);
    }
  }

  /**
   * Check consumer opt-out status
   */
  async getConsumerOptOutStatus(consumerId: string, siteId: string): Promise<{
    isOptedOut: boolean;
    optOutDate?: Date;
    categories: string[];
    method?: string;
    globalOptOut: boolean;
  }> {
    try {
      const optOutRecord = await prisma.complianceRecord.findFirst({
        where: {
          userId: consumerId,
          siteId,
          type: 'CCPA_OPT_OUT',
          status: 'COMPLIANT',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!optOutRecord) {
        return {
          isOptedOut: false,
          categories: [],
          globalOptOut: false,
        };
      }

      const evidence = optOutRecord.evidence as any;

      return {
        isOptedOut: true,
        optOutDate: optOutRecord.createdAt,
        categories: Array.isArray(evidence.categories) ? evidence.categories : ['ALL'],
        method: evidence.optOutMethod,
        globalOptOut: evidence.globalOptOut || false,
      };

    } catch (error) {
      console.error('Error getting opt-out status:', error);
      return {
        isOptedOut: false,
        categories: [],
        globalOptOut: false,
      };
    }
  }

  // Helper methods

  private async getBusinessMetrics(businessId: string): Promise<{
    annualRevenue: number;
    personalInfoRecords: number;
    dataProcessingRevenue: number;
  }> {
    // Simplified implementation - would integrate with actual business metrics
    return {
      annualRevenue: 30000000, // $30M
      personalInfoRecords: 75000, // 75K records
      dataProcessingRevenue: 0.3, // 30% of revenue
    };
  }

  private async verifyCaliforniaResidency(consumerId: string): Promise<boolean> {
    // Simplified implementation - would use proper residency verification
    const user = await prisma.user.findUnique({
      where: { id: consumerId },
      select: { metadata: true },
    });

    const metadata = user?.metadata as any;
    return metadata?.state === 'CA' || metadata?.residency === 'California';
  }

  private async getCCPARequest(requestId: string): Promise<CCPARequest | null> {
    const request = await prisma.auditLog.findUnique({
      where: { id: requestId },
    });

    if (!request) return null;

    const metadata = request.metadata as any;
    return {
      id: request.id,
      consumerId: request.userId!,
      requestType: metadata.requestType,
      specificRequest: metadata.specificRequest,
      timeFrame: metadata.timeFrame,
      status: request.status as any,
      submittedAt: request.createdAt,
      acknowledgedAt: metadata.acknowledgedAt ? new Date(metadata.acknowledgedAt) : undefined,
      completedAt: metadata.completedAt ? new Date(metadata.completedAt) : undefined,
      verificationStatus: metadata.verificationStatus,
      verificationMethod: metadata.verificationMethod,
      contactInfo: metadata.contactInfo,
      agentInfo: metadata.agentInfo,
      response: metadata.response,
      metadata,
    };
  }

  private async updateRequestStatus(requestId: string, status: string): Promise<void> {
    await prisma.auditLog.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  private async sendRequestAcknowledgment(requestId: string, requestData: any): Promise<void> {
    // Implementation would send acknowledgment email/letter
    console.log(`Sending CCPA request acknowledgment for ${requestId}`);
  }

  private async initiateVerification(requestId: string, method: string): Promise<void> {
    // Implementation would start verification process based on method
    console.log(`Initiating ${method} verification for CCPA request ${requestId}`);
  }

  private async gatherConsumerInfo(
    consumerId: string,
    timeFrame: string,
    specificRequest?: string
  ): Promise<any> {
    const endDate = new Date();
    const startDate = timeFrame === '12_MONTHS' 
      ? new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())
      : new Date('2000-01-01'); // All time

    // Gather information by CCPA categories
    return {
      categories: await this.getConsumerDataByCategory(consumerId, startDate, endDate),
      sources: await this.getDataSources(consumerId, startDate, endDate),
      businessPurposes: await this.getBusinessPurposes(consumerId, startDate, endDate),
      thirdParties: await this.getThirdPartySharing(consumerId, startDate, endDate),
      retention: await this.getRetentionInfo(consumerId),
    };
  }

  private async getConsumerDataByCategory(
    consumerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    // Implementation would collect data by CCPA categories
    return {
      IDENTIFIERS: { email: true, phone: true, address: true },
      COMMERCIAL_INFO: { purchaseHistory: true, preferences: true },
      INTERNET_ACTIVITY: { browsingHistory: true, clickData: true },
      GEOLOCATION_DATA: { approximateLocation: true },
      INFERENCES: { preferences: true, interests: true },
    };
  }

  private async getDataSources(consumerId: string, startDate: Date, endDate: Date): Promise<string[]> {
    return ['Direct submission', 'Website interaction', 'Third-party partners', 'Public records'];
  }

  private async getBusinessPurposes(consumerId: string, startDate: Date, endDate: Date): Promise<string[]> {
    return ['Providing services', 'Security', 'Analytics', 'Marketing', 'Legal compliance'];
  }

  private async getThirdPartySharing(consumerId: string, startDate: Date, endDate: Date): Promise<any> {
    return {
      shared: true,
      categories: ['Analytics providers', 'Marketing partners', 'Service providers'],
      purposes: ['Analytics', 'Advertising', 'Customer service'],
    };
  }

  private async getRetentionInfo(consumerId: string): Promise<any> {
    return {
      defaultPeriod: '7 years',
      categorySpecific: {
        IDENTIFIERS: '7 years',
        COMMERCIAL_INFO: '5 years',
        INTERNET_ACTIVITY: '2 years',
      },
    };
  }

  private async storeRequestResponse(requestId: string, response: any): Promise<void> {
    await prisma.auditLog.update({
      where: { id: requestId },
      data: {
        metadata: {
          response,
          completedAt: new Date().toISOString(),
        },
      },
    });
  }

  private async updateConsumerOptOutStatus(
    consumerId: string,
    siteId: string,
    optedOut: boolean,
    categories?: string[]
  ): Promise<void> {
    await prisma.userSecurityProfile.upsert({
      where: { userId: consumerId },
      create: {
        userId: consumerId,
        siteId,
        mfaEnabled: false,
        riskScore: 0,
        consentGiven: false,
        dataSaleOptOut: optedOut,
        optOutCategories: categories || [],
      },
      update: {
        dataSaleOptOut: optedOut,
        optOutCategories: categories || [],
      },
    });
  }

  private async notifyThirdPartiesOfOptOut(consumerId: string, categories: string[]): Promise<void> {
    // Implementation would notify third parties of consumer opt-out
    console.log(`Notifying third parties of opt-out for consumer ${consumerId}`);
  }

  private async getBusinessInfo(businessName: string, siteId: string): Promise<any> {
    return {
      name: businessName,
      address: '123 Business St, San Francisco, CA 94103',
      website: 'https://example.com',
      contactInfo: 'privacy@example.com',
    };
  }

  private getReportingPeriod(period: string): any {
    const now = new Date();
    switch (period) {
      case 'LAST_12_MONTHS':
        return {
          start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          end: now,
          description: 'Last 12 months',
        };
      case 'CURRENT_YEAR':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
          description: 'Current calendar year',
        };
      case 'PREVIOUS_YEAR':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31),
          description: 'Previous calendar year',
        };
      default:
        return {
          start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          end: now,
          description: 'Last 12 months',
        };
    }
  }

  private async getPersonalInfoCategories(siteId: string, period: string): Promise<any[]> {
    // Implementation would return actual categories collected
    return CCPA_CONFIG.piCategories.map(category => ({
      category,
      description: this.getCategoryDescription(category),
      sources: ['Website', 'Mobile app', 'Customer service'],
      businessPurposes: ['Service provision', 'Analytics', 'Marketing'],
      thirdParties: ['Analytics providers', 'Marketing partners'],
      sold: false, // Most businesses don't "sell" data in CCPA sense
      disclosed: true,
      retentionPeriod: '7 years',
    }));
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      IDENTIFIERS: 'Name, alias, postal address, unique personal identifier, online identifier, IP address, email address, account name, social security number, driver\'s license number, passport number, or other similar identifiers',
      PERSONAL_RECORDS: 'A name, signature, social security number, physical characteristics or description, address, telephone number, passport number, driver\'s license or state identification card number, insurance policy number, education, employment, employment history, bank account number, credit card number, debit card number, or any other financial information, medical information, or health insurance information',
      PROTECTED_CLASSIFICATIONS: 'Age (40 years or older), race, color, ancestry, national origin, citizenship, religion or creed, marital status, medical condition, physical or mental disability, sex (including gender, gender identity, gender expression, pregnancy or childbirth and related medical conditions), sexual orientation, veteran or military status, genetic information',
      COMMERCIAL_INFO: 'Records of personal property, products or services purchased, obtained, or considered, or other purchasing or consuming histories or tendencies',
      BIOMETRIC_INFO: 'Genetic, physiological, behavioral, and biological characteristics, or activity patterns used to extract a template or other identifier or identifying information, such as, fingerprints, faceprints, and voiceprints, iris or retina scans, keystroke, gait, or other physical patterns, and sleep, health, or exercise data',
      INTERNET_ACTIVITY: 'Browsing history, search history, information on a consumer\'s interaction with a website, application, or advertisement',
      GEOLOCATION_DATA: 'Physical location or movements',
      SENSORY_DATA: 'Audio, electronic, visual, thermal, olfactory, or similar information',
      PROFESSIONAL_INFO: 'Current or past job history or performance evaluations',
      EDUCATION_INFO: 'Information that is not publicly available personally identifiable information as defined in the Family Educational Rights and Privacy Act (20 U.S.C. section 1232g, 34 C.F.R. Part 99)',
      INFERENCES: 'Profile reflecting a person\'s preferences, characteristics, psychological trends, predispositions, behavior, attitudes, intelligence, abilities, and aptitudes',
    };

    return descriptions[category] || 'Personal information category';
  }

  private async getRequestStatistics(siteId: string, period: string): Promise<any> {
    const dateRange = this.getReportingPeriod(period);
    
    const requests = await prisma.auditLog.findMany({
      where: {
        siteId,
        resourceType: 'ccpa_rights',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const requestsByType = requests.reduce((acc, req) => {
      const metadata = req.metadata as any;
      const type = metadata?.requestType || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average response time
    const completedRequests = requests.filter(r => r.status === 'COMPLETED');
    const totalResponseTime = completedRequests.reduce((total, req) => {
      const responseTime = req.updatedAt.getTime() - req.createdAt.getTime();
      return total + responseTime;
    }, 0);

    const averageResponseTime = completedRequests.length > 0 
      ? totalResponseTime / completedRequests.length / (24 * 60 * 60 * 1000) // Convert to days
      : 0;

    const complianceRate = requests.length > 0 
      ? (completedRequests.length / requests.length) * 100
      : 100;

    return {
      totalRequests: requests.length,
      requestsByType,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      complianceRate: Math.round(complianceRate * 10) / 10,
    };
  }

  private async getDataSalesInfo(siteId: string, period: string): Promise<any> {
    // Check if business actually sells data (most don't in CCPA sense)
    const optOutRecords = await prisma.complianceRecord.count({
      where: {
        siteId,
        type: 'CCPA_OPT_OUT',
      },
    });

    return {
      occurred: false, // Most businesses don't sell data
      categories: [],
      thirdParties: [],
      optOutRequests: optOutRecords,
    };
  }

  private async getThirdPartyDisclosures(siteId: string, period: string): Promise<any[]> {
    return [
      {
        category: 'IDENTIFIERS',
        recipients: ['Analytics Provider A', 'Customer Service Platform B'],
        businessPurpose: 'Analytics and customer support',
      },
      {
        category: 'INTERNET_ACTIVITY',
        recipients: ['Analytics Provider A'],
        businessPurpose: 'Website analytics and optimization',
      },
    ];
  }

  private async logCCPAEvent(data: {
    type: string;
    requestType: string;
    consumerId: string;
    siteId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'CCPA_COMPLIANCE',
          severity: data.type.includes('FAILED') ? 'HIGH' : 'INFO',
          title: `CCPA ${data.requestType} ${data.type}`,
          description: `CCPA compliance event: ${data.type}`,
          userId: data.consumerId || undefined,
          siteId: data.siteId || undefined,
          metadata: {
            ccpaRequestType: data.requestType,
            eventType: data.type,
            ccpaCompliance: true,
            ...data.metadata,
          },
          success: !data.type.includes('FAILED'),
        },
      });
    } catch (error) {
      console.error('Failed to log CCPA event:', error);
    }
  }
}

// Export singleton instance
export const ccpaComplianceService = new CCPAComplianceService();

// Export types
export type {
  CCPARequest,
  CCPADisclosure,
}; 