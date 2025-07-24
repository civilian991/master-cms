import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CCPAComplianceService } from '../../lib/ccpa/ccpa-compliance';
import { CCPAPrivacyNoticeService } from '../../lib/ccpa/privacy-notices';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userSecurityProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    complianceRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';

describe('CCPA Compliance System', () => {
  let ccpaService: CCPAComplianceService;
  let privacyNoticeService: CCPAPrivacyNoticeService;

  const mockConsumerId = 'consumer-123';
  const mockSiteId = 'site-123';

  beforeEach(() => {
    jest.clearAllMocks();
    ccpaService = new CCPAComplianceService();
    privacyNoticeService = new CCPAPrivacyNoticeService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('CCPA Applicability', () => {
    it('should determine CCPA applicability based on business thresholds', async () => {
      // Mock business metrics that meet CCPA thresholds
      ccpaService['getBusinessMetrics'] = jest.fn().mockResolvedValue({
        annualRevenue: 30000000, // $30M (exceeds $25M threshold)
        personalInfoRecords: 75000, // 75K (exceeds 50K threshold)
        dataProcessingRevenue: 0.3, // 30% (below 50% threshold)
      });

      const result = await ccpaService.checkCCPAApplicability('business-123');

      expect(result.isSubject).toBe(true);
      expect(result.reasons).toContain('Annual revenue exceeds $25 million');
      expect(result.reasons).toContain('Processes personal information of 50,000+ California consumers');
      expect(result.reasons).not.toContain('Derives 50%+ of revenue from selling personal information');

      expect(result.thresholds.revenue.meets).toBe(true);
      expect(result.thresholds.records.meets).toBe(true);
      expect(result.thresholds.dataRevenue.meets).toBe(false);
    });

    it('should determine business is not subject to CCPA when below thresholds', async () => {
      ccpaService['getBusinessMetrics'] = jest.fn().mockResolvedValue({
        annualRevenue: 10000000, // $10M (below $25M threshold)
        personalInfoRecords: 25000, // 25K (below 50K threshold)
        dataProcessingRevenue: 0.2, // 20% (below 50% threshold)
      });

      const result = await ccpaService.checkCCPAApplicability('business-123');

      expect(result.isSubject).toBe(false);
      expect(result.reasons).toHaveLength(0);
      expect(result.thresholds.revenue.meets).toBe(false);
      expect(result.thresholds.records.meets).toBe(false);
      expect(result.thresholds.dataRevenue.meets).toBe(false);
    });
  });

  describe('CCPA Consumer Rights Requests', () => {
    beforeEach(() => {
      // Mock California residency verification
      ccpaService['verifyCaliforniaResidency'] = jest.fn().mockResolvedValue(true);
    });

    describe('Request Submission', () => {
      it('should submit Right to Know request successfully', async () => {
        // Mock audit log creation
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({
          id: 'ccpa-request-123',
          createdAt: new Date(),
          metadata: {},
        });

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const requestData = {
          consumerId: mockConsumerId,
          requestType: 'RIGHT_TO_KNOW' as const,
          specificRequest: 'I want to know what personal information you have collected about me',
          timeFrame: '12_MONTHS' as const,
          verificationMethod: 'EMAIL' as const,
          contactInfo: {
            email: 'consumer@example.com',
          },
        };

        const result = await ccpaService.submitCCPARequest(requestData, mockSiteId);

        expect(result.id).toBe('ccpa-request-123');
        expect(result.requestType).toBe('RIGHT_TO_KNOW');
        expect(result.status).toBe('ACKNOWLEDGED');
        expect(result.verificationStatus).toBe('PENDING');
        expect(result.timeFrame).toBe('12_MONTHS');

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'CREATE',
              resource: 'ccpa_request',
              resourceType: 'ccpa_rights',
              description: 'CCPA RIGHT_TO_KNOW request submitted',
              status: 'RECEIVED',
            }),
          })
        );

        expect(prisma.securityEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              eventType: 'CCPA_COMPLIANCE',
              title: 'CCPA RIGHT_TO_KNOW REQUEST_SUBMITTED',
            }),
          })
        );
      });

      it('should reject requests from non-California residents', async () => {
        ccpaService['verifyCaliforniaResidency'] = jest.fn().mockResolvedValue(false);

        const requestData = {
          consumerId: mockConsumerId,
          requestType: 'RIGHT_TO_KNOW' as const,
          timeFrame: '12_MONTHS' as const,
          verificationMethod: 'EMAIL' as const,
          contactInfo: { email: 'consumer@example.com' },
        };

        await expect(
          ccpaService.submitCCPARequest(requestData, mockSiteId)
        ).rejects.toThrow('CCPA rights are only available to California residents');
      });

      it('should handle authorized agent requests', async () => {
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({
          id: 'agent-request-123',
          createdAt: new Date(),
          metadata: {},
        });

        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const requestData = {
          consumerId: mockConsumerId,
          requestType: 'RIGHT_TO_DELETE' as const,
          timeFrame: '12_MONTHS' as const,
          verificationMethod: 'GOVERNMENT_ID' as const,
          contactInfo: { email: 'agent@law-firm.com' },
          agentInfo: {
            isAgent: true,
            agentName: 'Legal Representative',
            agentRelationship: 'Attorney',
            authorizationDocument: 'power-of-attorney.pdf',
          },
        };

        const result = await ccpaService.submitCCPARequest(requestData, mockSiteId);

        expect(result.agentInfo?.isAgent).toBe(true);
        expect(result.agentInfo?.agentName).toBe('Legal Representative');
        expect(result.verificationMethod).toBe('GOVERNMENT_ID');
      });
    });

    describe('Right to Know Processing', () => {
      it('should process Right to Know request and provide disclosure', async () => {
        // Mock request lookup
        ccpaService['getCCPARequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          consumerId: mockConsumerId,
          requestType: 'RIGHT_TO_KNOW',
          timeFrame: '12_MONTHS',
          verificationStatus: 'VERIFIED',
          specificRequest: 'Categories and sources of personal information',
        });

        // Mock status updates
        ccpaService['updateRequestStatus'] = jest.fn().mockResolvedValue(undefined);

        // Mock data gathering
        ccpaService['gatherConsumerInfo'] = jest.fn().mockResolvedValue({
          categories: {
            IDENTIFIERS: { email: true, phone: true, address: true },
            COMMERCIAL_INFO: { purchaseHistory: true, preferences: true },
            INTERNET_ACTIVITY: { browsingHistory: true, clickData: true },
          },
          sources: ['Direct submission', 'Website interaction', 'Third-party partners'],
          businessPurposes: ['Service provision', 'Analytics', 'Marketing'],
          thirdParties: ['Analytics providers', 'Marketing partners'],
          retention: { defaultPeriod: '7 years' },
        });

        // Mock response storage
        ccpaService['storeRequestResponse'] = jest.fn().mockResolvedValue(undefined);

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const result = await ccpaService.processRightToKnowRequest('request-123');

        expect(result.success).toBe(true);
        expect(result.disclosureInfo).toBeDefined();
        expect(result.disclosureInfo.categories).toHaveProperty('IDENTIFIERS');
        expect(result.disclosureInfo.categories).toHaveProperty('COMMERCIAL_INFO');
        expect(result.disclosureInfo.sources).toContain('Direct submission');

        expect(ccpaService['updateRequestStatus']).toHaveBeenCalledWith('request-123', 'IN_PROGRESS');
        expect(ccpaService['updateRequestStatus']).toHaveBeenCalledWith('request-123', 'COMPLETED');
      });

      it('should reject processing unverified requests', async () => {
        ccpaService['getCCPARequest'] = jest.fn().mockResolvedValue({
          id: 'request-123',
          consumerId: mockConsumerId,
          verificationStatus: 'PENDING', // Not verified
        });

        await expect(
          ccpaService.processRightToKnowRequest('request-123')
        ).rejects.toThrow('Request must be verified before processing');
      });
    });

    describe('Data Sale Opt-Out', () => {
      it('should process data sale opt-out request', async () => {
        // Mock compliance record creation
        (prisma.complianceRecord.create as jest.Mock).mockResolvedValue({
          id: 'opt-out-123',
          createdAt: new Date(),
        });

        // Mock user profile update
        ccpaService['updateConsumerOptOutStatus'] = jest.fn().mockResolvedValue(undefined);

        // Mock third-party notification
        ccpaService['notifyThirdPartiesOfOptOut'] = jest.fn().mockResolvedValue(undefined);

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const optOutData = {
          consumerId: mockConsumerId,
          optOutMethod: 'WEBSITE_FORM' as const,
          categories: ['MARKETING_DATA', 'ANALYTICS_DATA'],
          globalOptOut: false,
          userAgent: 'Mozilla/5.0...',
          ipAddress: '192.168.1.1',
        };

        const result = await ccpaService.processDataSaleOptOut(optOutData, mockSiteId);

        expect(result.success).toBe(true);
        expect(result.optOutId).toBeDefined();
        expect(result.effectiveDate).toBeInstanceOf(Date);

        expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'CCPA_OPT_OUT',
              requirement: 'DATA_SALE_OPT_OUT',
              status: 'COMPLIANT',
              evidence: expect.objectContaining({
                optOutMethod: 'WEBSITE_FORM',
                categories: ['MARKETING_DATA', 'ANALYTICS_DATA'],
                globalOptOut: false,
              }),
            }),
          })
        );

        expect(ccpaService['updateConsumerOptOutStatus']).toHaveBeenCalledWith(
          mockConsumerId,
          mockSiteId,
          true,
          ['MARKETING_DATA', 'ANALYTICS_DATA']
        );
      });

      it('should handle Global Privacy Control (GPC) opt-out', async () => {
        (prisma.complianceRecord.create as jest.Mock).mockResolvedValue({
          id: 'gpc-opt-out-123',
          createdAt: new Date(),
        });

        ccpaService['updateConsumerOptOutStatus'] = jest.fn().mockResolvedValue(undefined);
        ccpaService['notifyThirdPartiesOfOptOut'] = jest.fn().mockResolvedValue(undefined);
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const optOutData = {
          consumerId: mockConsumerId,
          optOutMethod: 'WEBSITE_FORM' as const,
          globalOptOut: true, // GPC signal
          userAgent: 'Mozilla/5.0 (compatible; GPC/1.0)',
          ipAddress: '192.168.1.1',
        };

        const result = await ccpaService.processDataSaleOptOut(optOutData, mockSiteId);

        expect(result.success).toBe(true);
        expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              evidence: expect.objectContaining({
                globalOptOut: true,
              }),
            }),
          })
        );
      });
    });

    describe('Opt-Out Status Checking', () => {
      it('should return opt-out status for consumer', async () => {
        // Mock opt-out record
        (prisma.complianceRecord.findFirst as jest.Mock).mockResolvedValue({
          id: 'opt-out-record-123',
          createdAt: new Date('2024-01-15'),
          evidence: {
            optOutMethod: 'WEBSITE_FORM',
            categories: ['MARKETING_DATA'],
            globalOptOut: false,
          },
        });

        const status = await ccpaService.getConsumerOptOutStatus(mockConsumerId, mockSiteId);

        expect(status.isOptedOut).toBe(true);
        expect(status.optOutDate).toEqual(new Date('2024-01-15'));
        expect(status.categories).toEqual(['MARKETING_DATA']);
        expect(status.method).toBe('WEBSITE_FORM');
        expect(status.globalOptOut).toBe(false);
      });

      it('should return false for consumers who have not opted out', async () => {
        (prisma.complianceRecord.findFirst as jest.Mock).mockResolvedValue(null);

        const status = await ccpaService.getConsumerOptOutStatus(mockConsumerId, mockSiteId);

        expect(status.isOptedOut).toBe(false);
        expect(status.categories).toEqual([]);
        expect(status.globalOptOut).toBe(false);
      });
    });
  });

  describe('CCPA Disclosure Generation', () => {
    it('should generate comprehensive CCPA disclosure report', async () => {
      // Mock business info
      ccpaService['getBusinessInfo'] = jest.fn().mockResolvedValue({
        name: 'Test Business Inc.',
        address: '123 Business St, San Francisco, CA 94103',
        website: 'https://testbusiness.com',
        contactInfo: 'privacy@testbusiness.com',
      });

      // Mock reporting period
      ccpaService['getReportingPeriod'] = jest.fn().mockReturnValue({
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31'),
        description: 'Calendar year 2023',
      });

      // Mock personal info categories
      ccpaService['getPersonalInfoCategories'] = jest.fn().mockResolvedValue([
        {
          category: 'IDENTIFIERS',
          description: 'Name, email address, IP address, and other identifiers',
          sources: ['Website', 'Mobile app'],
          businessPurposes: ['Service provision', 'Communication'],
          thirdParties: ['Analytics providers'],
          sold: false,
          disclosed: true,
          retentionPeriod: '7 years',
        },
        {
          category: 'COMMERCIAL_INFO',
          description: 'Purchase history and preferences',
          sources: ['Purchase transactions'],
          businessPurposes: ['Order fulfillment', 'Recommendations'],
          thirdParties: ['Payment processors'],
          sold: false,
          disclosed: true,
          retentionPeriod: '5 years',
        },
      ]);

      // Mock request statistics
      ccpaService['getRequestStatistics'] = jest.fn().mockResolvedValue({
        totalRequests: 25,
        requestsByType: {
          RIGHT_TO_KNOW: 15,
          RIGHT_TO_DELETE: 8,
          RIGHT_TO_OPT_OUT: 2,
        },
        averageResponseTime: 12.5,
        complianceRate: 96.0,
      });

      // Mock data sales info
      ccpaService['getDataSalesInfo'] = jest.fn().mockResolvedValue({
        occurred: false,
        categories: [],
        thirdParties: [],
        optOutRequests: 2,
      });

      // Mock third-party disclosures
      ccpaService['getThirdPartyDisclosures'] = jest.fn().mockResolvedValue([
        {
          category: 'IDENTIFIERS',
          recipients: ['Analytics Provider A'],
          businessPurpose: 'Website analytics',
        },
      ]);

      // Mock security event logging
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

      const disclosure = await ccpaService.generateCCPADisclosure(
        {
          businessName: 'Test Business Inc.',
          period: 'PREVIOUS_YEAR',
          includeThirdParties: true,
          includeServiceProviders: true,
          format: 'JSON',
        },
        mockSiteId
      );

      expect(disclosure.businessInfo.name).toBe('Test Business Inc.');
      expect(disclosure.reportingPeriod.description).toBe('Calendar year 2023');
      expect(disclosure.personalInfoCategories).toHaveLength(2);
      expect(disclosure.personalInfoCategories[0].category).toBe('IDENTIFIERS');
      expect(disclosure.personalInfoCategories[1].category).toBe('COMMERCIAL_INFO');
      expect(disclosure.requestStatistics.totalRequests).toBe(25);
      expect(disclosure.requestStatistics.complianceRate).toBe(96.0);
      expect(disclosure.dataSales.occurred).toBe(false);
      expect(disclosure.dataSales.optOutRequests).toBe(2);
      expect(disclosure.thirdPartyDisclosures).toHaveLength(1);
    });
  });

  describe('CCPA Privacy Notices', () => {
    describe('Notice Generation', () => {
      it('should generate CCPA-compliant privacy policy', async () => {
        // Mock template retrieval
        privacyNoticeService['getNoticeTemplate'] = jest.fn().mockResolvedValue({
          type: 'PRIVACY_POLICY',
          language: 'en',
          sections: {
            INTRODUCTION: {
              title: 'Privacy Policy',
              template: 'This Privacy Policy describes how {{businessName}} collects, uses, and protects your personal information.',
              required: true,
              variables: ['businessName'],
            },
            CONSUMER_RIGHTS: {
              title: 'Your California Privacy Rights',
              template: 'Under CCPA, you have the following rights: {{rights}}',
              required: true,
              variables: ['rights'],
            },
          },
        });

        // Mock content generation
        privacyNoticeService['generateNoticeContent'] = jest.fn().mockResolvedValue({
          businessInfo: {
            name: 'Test Company',
            contactEmail: 'privacy@testcompany.com',
          },
          sections: {
            INTRODUCTION: {
              title: 'Privacy Policy',
              content: 'This Privacy Policy describes how Test Company collects, uses, and protects your personal information.',
              required: true,
            },
            CONSUMER_RIGHTS: {
              title: 'Your California Privacy Rights',
              content: 'Under CCPA, you have the following rights: Right to Know, Right to Delete, Right to Opt-Out, Right to Non-Discrimination',
              required: true,
            },
          },
          customSections: [],
        });

        // Mock compliance checks
        privacyNoticeService['performComplianceChecks'] = jest.fn().mockResolvedValue({
          ccpaCompliant: true,
          cpraCompliant: true,
          accessibilityCompliant: true,
          languageCompliant: true,
          issues: [],
        });

        // Mock audit log creation
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({
          id: 'notice-123',
          createdAt: new Date(),
          metadata: {},
        });

        // Mock security event logging
        (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

        const noticeData = {
          siteId: mockSiteId,
          type: 'PRIVACY_POLICY' as const,
          language: 'en' as const,
          businessInfo: {
            name: 'Test Company',
            address: '123 Test St, San Francisco, CA 94103',
            website: 'https://testcompany.com',
            contactEmail: 'privacy@testcompany.com',
          },
          dataCollection: {
            categories: ['IDENTIFIERS', 'COMMERCIAL_INFO'],
            sources: ['Website', 'Customer service'],
            businessPurposes: ['Service provision', 'Analytics'],
            retentionPeriods: { IDENTIFIERS: '7 years', COMMERCIAL_INFO: '5 years' },
          },
          thirdPartySharing: {
            occurs: true,
            categories: ['IDENTIFIERS'],
            purposes: ['Analytics'],
            recipients: ['Analytics Provider'],
          },
          dataSales: {
            occurs: false,
          },
          consumerRights: {
            rightToKnow: true,
            rightToDelete: true,
            rightToOptOut: true,
            rightToNonDiscrimination: true,
          },
        };

        const result = await privacyNoticeService.generatePrivacyNotice(noticeData);

        expect(result.id).toBe('notice-123');
        expect(result.type).toBe('PRIVACY_POLICY');
        expect(result.language).toBe('en');
        expect(result.status).toBe('ACTIVE');
        expect(result.complianceChecks.ccpaCompliant).toBe(true);
        expect(result.content.businessInfo.name).toBe('Test Company');
        expect(result.content.sections.INTRODUCTION).toBeDefined();
        expect(result.content.sections.CONSUMER_RIGHTS).toBeDefined();
      });

      it('should generate multilingual privacy notices', async () => {
        const languages = ['en', 'es', 'zh'];
        const noticePromises = languages.map(async (language) => {
          privacyNoticeService['getNoticeTemplate'] = jest.fn().mockResolvedValue({
            type: 'PRIVACY_POLICY',
            language,
            sections: {},
          });

          privacyNoticeService['generateNoticeContent'] = jest.fn().mockResolvedValue({
            businessInfo: { name: 'Test Company' },
            sections: {
              CONSUMER_RIGHTS: {
                title: language === 'es' ? 'Sus Derechos de Privacidad' : 'Your Privacy Rights',
                content: `Privacy rights content in ${language}`,
              },
            },
          });

          privacyNoticeService['performComplianceChecks'] = jest.fn().mockResolvedValue({
            ccpaCompliant: true,
            languageCompliant: true,
            issues: [],
          });

          (prisma.auditLog.create as jest.Mock).mockResolvedValue({
            id: `notice-${language}`,
            createdAt: new Date(),
            metadata: {},
          });

          (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

          return await privacyNoticeService.generatePrivacyNotice({
            siteId: mockSiteId,
            type: 'PRIVACY_POLICY',
            language: language as any,
            businessInfo: {
              name: 'Test Company',
              address: '123 Test St',
              website: 'https://test.com',
              contactEmail: 'privacy@test.com',
            },
            dataCollection: {
              categories: ['IDENTIFIERS'],
              sources: ['Website'],
              businessPurposes: ['Service'],
              retentionPeriods: {},
            },
            thirdPartySharing: { occurs: false, categories: [], purposes: [], recipients: [] },
            dataSales: { occurs: false },
            consumerRights: {
              rightToKnow: true,
              rightToDelete: true,
              rightToOptOut: true,
              rightToNonDiscrimination: true,
            },
          });
        });

        const notices = await Promise.all(noticePromises);

        expect(notices).toHaveLength(3);
        expect(notices[0].language).toBe('en');
        expect(notices[1].language).toBe('es');
        expect(notices[2].language).toBe('zh');
      });
    });

    describe('Do Not Sell Page Generation', () => {
      it('should generate Do Not Sell page with proper content', async () => {
        // Mock business info
        privacyNoticeService['getBusinessInfo'] = jest.fn().mockResolvedValue({
          name: 'Test Company',
          address: '123 Test St',
          website: 'https://testcompany.com',
          contactEmail: 'privacy@testcompany.com',
        });

        // Mock page content generation
        privacyNoticeService['generateDoNotSellContent'] = jest.fn().mockResolvedValue(`
          <h1>Do Not Sell My Personal Information</h1>
          <p>This page allows you to opt out of the sale of your personal information by Test Company.</p>
          <form id="do-not-sell-form">
            <label for="email">Email Address:</label>
            <input type="email" id="email" name="email" required>
            <button type="submit">Submit Opt-Out Request</button>
          </form>
        `);

        // Mock audit log creation
        (prisma.auditLog.create as jest.Mock).mockResolvedValue({
          id: 'do-not-sell-page-123',
          createdAt: new Date(),
        });

        const result = await privacyNoticeService.generateDoNotSellPage(mockSiteId, 'en');

        expect(result.pageUrl).toBe('/do-not-sell-my-info?lang=en');
        expect(result.linkText).toBe('Do Not Sell My Personal Information');
        expect(result.pageContent).toContain('<h1>Do Not Sell My Personal Information</h1>');
        expect(result.pageContent).toContain('<form id="do-not-sell-form">');

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              resource: 'do_not_sell_page',
              resourceType: 'ccpa_page',
              metadata: expect.objectContaining({
                language: 'en',
                pageUrl: '/do-not-sell-my-info?lang=en',
                linkText: 'Do Not Sell My Personal Information',
              }),
            }),
          })
        );
      });

      it('should generate localized Do Not Sell pages', async () => {
        const languages = [
          { code: 'en', expectedText: 'Do Not Sell My Personal Information' },
          { code: 'es', expectedText: 'No Vender Mi Información Personal' },
          { code: 'zh', expectedText: '不要出售我的个人信息' },
        ];

        for (const { code, expectedText } of languages) {
          privacyNoticeService['getBusinessInfo'] = jest.fn().mockResolvedValue({
            name: 'Test Company',
          });

          privacyNoticeService['generateDoNotSellContent'] = jest.fn().mockResolvedValue(
            `<h1>${expectedText}</h1><form></form>`
          );

          (prisma.auditLog.create as jest.Mock).mockResolvedValue({
            id: `dns-page-${code}`,
            createdAt: new Date(),
          });

          const result = await privacyNoticeService.generateDoNotSellPage(mockSiteId, code as any);

          expect(result.linkText).toBe(expectedText);
          expect(result.pageContent).toContain(expectedText);
        }
      });
    });

    describe('Compliance Validation', () => {
      it('should validate CCPA compliance of privacy notices', async () => {
        // Mock notice retrieval
        privacyNoticeService['getPrivacyNotice'] = jest.fn().mockResolvedValue({
          id: 'notice-123',
          siteId: mockSiteId,
          type: 'PRIVACY_POLICY',
          language: 'en',
          content: {
            businessInfo: {
              contactEmail: 'privacy@test.com',
              contactPhone: '1-800-PRIVACY',
            },
            sections: {
              CATEGORIES_COLLECTED: { content: 'We collect identifiers...' },
              SOURCES: { content: 'We collect from websites...' },
              BUSINESS_PURPOSES: { content: 'We use for service provision...' },
              CONSUMER_RIGHTS: {
                rightToKnow: true,
                rightToDelete: true,
                rightToOptOut: true,
              },
              DATA_SALES: {
                occurs: false,
              },
              CONTACT_INFO: { content: 'Contact us at...' },
            },
          },
        });

        // Mock English version check
        privacyNoticeService['hasEnglishVersion'] = jest.fn().mockResolvedValue(true);

        // Mock compliance status update
        privacyNoticeService['updateNoticeComplianceStatus'] = jest.fn().mockResolvedValue(undefined);

        const result = await privacyNoticeService.validateNoticeCompliance('notice-123');

        expect(result.ccpaCompliant).toBe(true);
        expect(result.accessibilityCompliant).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should identify compliance issues in privacy notices', async () => {
        // Mock notice with missing sections
        privacyNoticeService['getPrivacyNotice'] = jest.fn().mockResolvedValue({
          id: 'notice-456',
          content: {
            businessInfo: {
              // Missing contact information
            },
            sections: {
              CATEGORIES_COLLECTED: { content: 'We collect...' },
              // Missing other required sections
              DATA_SALES: {
                occurs: true, // Data sales occur but no opt-out link
              },
            },
          },
        });

        privacyNoticeService['hasEnglishVersion'] = jest.fn().mockResolvedValue(false);
        privacyNoticeService['updateNoticeComplianceStatus'] = jest.fn().mockResolvedValue(undefined);

        const result = await privacyNoticeService.validateNoticeCompliance('notice-456');

        expect(result.ccpaCompliant).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        
        const errorIssues = result.issues.filter(issue => issue.type === 'ERROR');
        expect(errorIssues.some(issue => issue.message.includes('No contact method provided'))).toBe(true);
        expect(errorIssues.some(issue => issue.message.includes('Do Not Sell link missing'))).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete CCPA compliance workflow', async () => {
      // 1. Check CCPA applicability
      ccpaService['getBusinessMetrics'] = jest.fn().mockResolvedValue({
        annualRevenue: 30000000,
        personalInfoRecords: 75000,
        dataProcessingRevenue: 0.3,
      });

      const applicability = await ccpaService.checkCCPAApplicability('business-123');
      expect(applicability.isSubject).toBe(true);

      // 2. Submit consumer request
      ccpaService['verifyCaliforniaResidency'] = jest.fn().mockResolvedValue(true);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'ccpa-request-456',
        createdAt: new Date(),
        metadata: {},
      });
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

      const consumerRequest = await ccpaService.submitCCPARequest({
        consumerId: mockConsumerId,
        requestType: 'RIGHT_TO_KNOW',
        timeFrame: '12_MONTHS',
        verificationMethod: 'EMAIL',
        contactInfo: { email: 'consumer@example.com' },
      }, mockSiteId);

      expect(consumerRequest.status).toBe('ACKNOWLEDGED');

      // 3. Process opt-out request
      (prisma.complianceRecord.create as jest.Mock).mockResolvedValue({
        id: 'opt-out-789',
        createdAt: new Date(),
      });

      ccpaService['updateConsumerOptOutStatus'] = jest.fn().mockResolvedValue(undefined);
      ccpaService['notifyThirdPartiesOfOptOut'] = jest.fn().mockResolvedValue(undefined);

      const optOutResult = await ccpaService.processDataSaleOptOut({
        consumerId: mockConsumerId,
        optOutMethod: 'WEBSITE_FORM',
        globalOptOut: false,
      }, mockSiteId);

      expect(optOutResult.success).toBe(true);

      // 4. Generate privacy notice
      privacyNoticeService['getNoticeTemplate'] = jest.fn().mockResolvedValue({
        type: 'PRIVACY_POLICY',
        language: 'en',
        sections: {},
      });

      privacyNoticeService['generateNoticeContent'] = jest.fn().mockResolvedValue({
        businessInfo: { name: 'Test Company' },
        sections: {},
      });

      privacyNoticeService['performComplianceChecks'] = jest.fn().mockResolvedValue({
        ccpaCompliant: true,
        issues: [],
      });

      const privacyNotice = await privacyNoticeService.generatePrivacyNotice({
        siteId: mockSiteId,
        type: 'PRIVACY_POLICY',
        language: 'en',
        businessInfo: {
          name: 'Test Company',
          address: '123 Test St',
          website: 'https://test.com',
          contactEmail: 'privacy@test.com',
        },
        dataCollection: {
          categories: ['IDENTIFIERS'],
          sources: ['Website'],
          businessPurposes: ['Service'],
          retentionPeriods: {},
        },
        thirdPartySharing: { occurs: false, categories: [], purposes: [], recipients: [] },
        dataSales: { occurs: false },
        consumerRights: {
          rightToKnow: true,
          rightToDelete: true,
          rightToOptOut: true,
          rightToNonDiscrimination: true,
        },
      });

      expect(privacyNotice.complianceChecks.ccpaCompliant).toBe(true);

      // Verify all operations were logged
      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(3); // Request, opt-out, notice
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(2); // Request, notice
      expect(prisma.complianceRecord.create).toHaveBeenCalledTimes(1); // Opt-out
    });

    it('should handle non-compliant scenarios appropriately', async () => {
      // Test non-California resident
      ccpaService['verifyCaliforniaResidency'] = jest.fn().mockResolvedValue(false);

      await expect(
        ccpaService.submitCCPARequest({
          consumerId: 'non-ca-consumer',
          requestType: 'RIGHT_TO_KNOW',
          timeFrame: '12_MONTHS',
          verificationMethod: 'EMAIL',
          contactInfo: { email: 'user@example.com' },
        }, mockSiteId)
      ).rejects.toThrow('CCPA rights are only available to California residents');

      // Test business below CCPA thresholds
      ccpaService['getBusinessMetrics'] = jest.fn().mockResolvedValue({
        annualRevenue: 10000000, // Below $25M
        personalInfoRecords: 25000, // Below 50K
        dataProcessingRevenue: 0.2, // Below 50%
      });

      const applicability = await ccpaService.checkCCPAApplicability('small-business');
      expect(applicability.isSubject).toBe(false);
      expect(applicability.reasons).toHaveLength(0);
    });
  });
});

// Helper functions for test setup
function createMockCCPARequest(overrides: any = {}) {
  return {
    id: 'ccpa-request-123',
    consumerId: 'consumer-123',
    requestType: 'RIGHT_TO_KNOW',
    timeFrame: '12_MONTHS',
    status: 'ACKNOWLEDGED',
    submittedAt: new Date(),
    verificationStatus: 'PENDING',
    verificationMethod: 'EMAIL',
    contactInfo: { email: 'consumer@example.com' },
    metadata: {},
    ...overrides,
  };
}

function createMockPrivacyNotice(overrides: any = {}) {
  return {
    id: 'notice-123',
    siteId: 'site-123',
    type: 'PRIVACY_POLICY',
    language: 'en',
    version: '1.0',
    status: 'ACTIVE',
    effectiveDate: new Date(),
    lastUpdated: new Date(),
    nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    content: {
      businessInfo: { name: 'Test Company' },
      sections: {},
    },
    complianceChecks: {
      ccpaCompliant: true,
      cpraCompliant: true,
      accessibilityCompliant: true,
      issues: [],
    },
    metadata: {},
    ...overrides,
  };
} 