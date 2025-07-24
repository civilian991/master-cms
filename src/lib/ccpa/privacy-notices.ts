import { prisma } from '../prisma';
import { z } from 'zod';

// Privacy notice configuration
const PRIVACY_NOTICE_CONFIG = {
  requiredSections: [
    'CATEGORIES_COLLECTED', // Categories of personal information collected
    'SOURCES', // Sources of personal information
    'BUSINESS_PURPOSES', // Business or commercial purposes for collecting PI
    'THIRD_PARTY_SHARING', // Categories of third parties with whom PI is shared
    'CONSUMER_RIGHTS', // Consumer rights under CCPA
    'CONTACT_INFO', // How to contact business about privacy
    'DATA_SALES', // Whether business sells personal information
    'NON_DISCRIMINATION', // Non-discrimination policy
  ],
  noticeTypes: [
    'PRIVACY_POLICY', // Comprehensive privacy policy
    'COLLECTION_NOTICE', // At-collection notice
    'SALE_OPT_OUT', // "Do Not Sell My Personal Information" notice
    'FINANCIAL_INCENTIVE', // Financial incentive notice
    'SERVICE_PROVIDER', // Service provider notice
  ],
  languages: ['en', 'es', 'zh', 'ko', 'vi', 'tl'], // California language requirements
  updateFrequency: 'ANNUAL', // Annual review required
  visibilityRequirements: {
    prominence: 'CONSPICUOUS', // Must be conspicuous
    accessibility: 'WCAG_AA', // WCAG 2.1 AA compliance
    placement: 'HOMEPAGE_FOOTER', // Accessible from homepage
  },
} as const;

// Validation schemas
export const privacyNoticeSchema = z.object({
  siteId: z.string(),
  type: z.enum(['PRIVACY_POLICY', 'COLLECTION_NOTICE', 'SALE_OPT_OUT', 'FINANCIAL_INCENTIVE', 'SERVICE_PROVIDER']),
  language: z.enum(['en', 'es', 'zh', 'ko', 'vi', 'tl']),
  businessInfo: z.object({
    name: z.string(),
    address: z.string(),
    website: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string().optional(),
    dpoContact: z.string().optional(),
  }),
  dataCollection: z.object({
    categories: z.array(z.string()),
    sources: z.array(z.string()),
    businessPurposes: z.array(z.string()),
    retentionPeriods: z.record(z.string()),
  }),
  thirdPartySharing: z.object({
    occurs: z.boolean(),
    categories: z.array(z.string()),
    purposes: z.array(z.string()),
    recipients: z.array(z.string()),
  }),
  dataSales: z.object({
    occurs: z.boolean(),
    categories: z.array(z.string()).optional(),
    optOutLink: z.string().optional(),
  }),
  consumerRights: z.object({
    rightToKnow: z.boolean().default(true),
    rightToDelete: z.boolean().default(true),
    rightToOptOut: z.boolean().default(true),
    rightToNonDiscrimination: z.boolean().default(true),
    rightToCorrect: z.boolean().default(false), // CPRA addition
  }),
  customSections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number(),
  })).optional(),
});

export const noticeUpdateSchema = z.object({
  noticeId: z.string(),
  changes: z.array(z.object({
    section: z.string(),
    oldContent: z.string(),
    newContent: z.string(),
    reason: z.string(),
  })),
  effectiveDate: z.date().optional(),
  notifyUsers: z.boolean().default(true),
});

// Privacy notice interfaces
interface PrivacyNotice {
  id: string;
  siteId: string;
  type: string;
  language: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveDate: Date;
  lastUpdated: Date;
  nextReview: Date;
  content: {
    businessInfo: any;
    sections: Record<string, any>;
    customSections?: any[];
  };
  complianceChecks: {
    ccpaCompliant: boolean;
    cpraCompliant: boolean;
    accessibilityCompliant: boolean;
    languageCompliant: boolean;
    issues: string[];
  };
  metadata: Record<string, any>;
}

interface NoticeTemplate {
  type: string;
  language: string;
  sections: Record<string, {
    title: string;
    template: string;
    required: boolean;
    variables: string[];
  }>;
}

// CCPA Privacy Notice Management Service
export class CCPAPrivacyNoticeService {

  /**
   * Generate CCPA-compliant privacy notice
   */
  async generatePrivacyNotice(
    noticeData: z.infer<typeof privacyNoticeSchema>
  ): Promise<PrivacyNotice> {
    try {
      const validatedData = privacyNoticeSchema.parse(noticeData);

      // Get appropriate template
      const template = await this.getNoticeTemplate(validatedData.type, validatedData.language);

      // Generate notice content
      const content = await this.generateNoticeContent(validatedData, template);

      // Perform compliance checks
      const complianceChecks = await this.performComplianceChecks(content, validatedData);

      // Create notice record
      const notice = await prisma.auditLog.create({
        data: {
          siteId: validatedData.siteId,
          action: 'CREATE',
          resource: 'privacy_notice',
          resourceType: 'ccpa_notice',
          description: `CCPA ${validatedData.type} notice created in ${validatedData.language}`,
          status: complianceChecks.ccpaCompliant ? 'ACTIVE' : 'DRAFT',
          metadata: {
            type: validatedData.type,
            language: validatedData.language,
            version: '1.0',
            effectiveDate: new Date().toISOString(),
            nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            content,
            complianceChecks,
            ccpaCompliance: true,
          },
        },
      });

      // Log notice creation
      await this.logPrivacyNoticeEvent({
        type: 'NOTICE_CREATED',
        noticeType: validatedData.type,
        siteId: validatedData.siteId,
        metadata: {
          noticeId: notice.id,
          language: validatedData.language,
          compliant: complianceChecks.ccpaCompliant,
        },
      });

      return {
        id: notice.id,
        siteId: validatedData.siteId,
        type: validatedData.type,
        language: validatedData.language,
        version: '1.0',
        status: complianceChecks.ccpaCompliant ? 'ACTIVE' : 'DRAFT',
        effectiveDate: notice.createdAt,
        lastUpdated: notice.createdAt,
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        content,
        complianceChecks,
        metadata: notice.metadata as Record<string, any>,
      };

    } catch (error) {
      await this.logPrivacyNoticeEvent({
        type: 'NOTICE_CREATION_FAILED',
        noticeType: noticeData.type,
        siteId: noticeData.siteId,
        metadata: { error: error.message },
      });
      throw new Error(`Failed to generate privacy notice: ${error.message}`);
    }
  }

  /**
   * Update existing privacy notice
   */
  async updatePrivacyNotice(
    updateData: z.infer<typeof noticeUpdateSchema>
  ): Promise<{
    success: boolean;
    newVersion: string;
    changesApplied: number;
  }> {
    try {
      const validatedData = noticeUpdateSchema.parse(updateData);

      // Get existing notice
      const existingNotice = await this.getPrivacyNotice(validatedData.noticeId);
      if (!existingNotice) {
        throw new Error('Privacy notice not found');
      }

      // Archive current version
      await this.archiveNoticeVersion(validatedData.noticeId);

      // Apply changes
      const updatedContent = this.applyContentChanges(
        existingNotice.content,
        validatedData.changes
      );

      // Increment version
      const newVersion = this.incrementVersion(existingNotice.version);

      // Perform compliance checks on updated content
      const complianceChecks = await this.performComplianceChecks(
        updatedContent,
        existingNotice
      );

      // Create new version
      const effectiveDate = validatedData.effectiveDate || new Date();
      await prisma.auditLog.update({
        where: { id: validatedData.noticeId },
        data: {
          status: complianceChecks.ccpaCompliant ? 'ACTIVE' : 'DRAFT',
          metadata: {
            ...existingNotice.metadata,
            version: newVersion,
            effectiveDate: effectiveDate.toISOString(),
            lastUpdated: new Date().toISOString(),
            content: updatedContent,
            complianceChecks,
            changes: validatedData.changes,
          },
        },
      });

      // Notify users if required
      if (validatedData.notifyUsers && complianceChecks.ccpaCompliant) {
        await this.notifyUsersOfPrivacyUpdate(
          existingNotice.siteId,
          validatedData.changes,
          effectiveDate
        );
      }

      // Log update
      await this.logPrivacyNoticeEvent({
        type: 'NOTICE_UPDATED',
        noticeType: existingNotice.type,
        siteId: existingNotice.siteId,
        metadata: {
          noticeId: validatedData.noticeId,
          newVersion,
          changesCount: validatedData.changes.length,
          compliant: complianceChecks.ccpaCompliant,
        },
      });

      return {
        success: true,
        newVersion,
        changesApplied: validatedData.changes.length,
      };

    } catch (error) {
      await this.logPrivacyNoticeEvent({
        type: 'NOTICE_UPDATE_FAILED',
        noticeType: '',
        siteId: '',
        metadata: { noticeId: updateData.noticeId, error: error.message },
      });
      throw new Error(`Failed to update privacy notice: ${error.message}`);
    }
  }

  /**
   * Generate "Do Not Sell" link and page
   */
  async generateDoNotSellPage(siteId: string, language: string = 'en'): Promise<{
    pageUrl: string;
    pageContent: string;
    linkText: string;
  }> {
    try {
      const businessInfo = await this.getBusinessInfo(siteId);
      
      const linkText = this.getDoNotSellLinkText(language);
      const pageContent = await this.generateDoNotSellContent(businessInfo, language);
      const pageUrl = `/do-not-sell-my-info?lang=${language}`;

      // Store Do Not Sell page
      await prisma.auditLog.create({
        data: {
          siteId,
          action: 'CREATE',
          resource: 'do_not_sell_page',
          resourceType: 'ccpa_page',
          description: `Do Not Sell page created in ${language}`,
          status: 'ACTIVE',
          metadata: {
            language,
            pageUrl,
            linkText,
            pageContent,
            ccpaCompliance: true,
          },
        },
      });

      return {
        pageUrl,
        pageContent,
        linkText,
      };

    } catch (error) {
      throw new Error(`Failed to generate Do Not Sell page: ${error.message}`);
    }
  }

  /**
   * Validate privacy notice compliance
   */
  async validateNoticeCompliance(noticeId: string): Promise<{
    ccpaCompliant: boolean;
    cpraCompliant: boolean;
    accessibilityCompliant: boolean;
    issues: Array<{
      type: 'ERROR' | 'WARNING';
      section: string;
      message: string;
      recommendation: string;
    }>;
  }> {
    try {
      const notice = await this.getPrivacyNotice(noticeId);
      if (!notice) {
        throw new Error('Privacy notice not found');
      }

      const issues: any[] = [];
      let ccpaCompliant = true;
      let cpraCompliant = true;
      let accessibilityCompliant = true;

      // Check required CCPA sections
      const requiredSections = PRIVACY_NOTICE_CONFIG.requiredSections;
      for (const section of requiredSections) {
        if (!notice.content.sections[section]) {
          issues.push({
            type: 'ERROR',
            section,
            message: `Required section "${section}" is missing`,
            recommendation: `Add the ${section} section to comply with CCPA requirements`,
          });
          ccpaCompliant = false;
        }
      }

      // Check consumer rights disclosure
      const consumerRights = notice.content.sections.CONSUMER_RIGHTS;
      if (consumerRights) {
        const requiredRights = ['rightToKnow', 'rightToDelete', 'rightToOptOut'];
        for (const right of requiredRights) {
          if (!consumerRights[right]) {
            issues.push({
              type: 'ERROR',
              section: 'CONSUMER_RIGHTS',
              message: `Consumer right "${right}" not properly disclosed`,
              recommendation: `Clearly explain the ${right} in the consumer rights section`,
            });
            ccpaCompliant = false;
          }
        }
      }

      // Check contact information
      const businessInfo = notice.content.businessInfo;
      if (!businessInfo.contactEmail && !businessInfo.contactPhone) {
        issues.push({
          type: 'ERROR',
          section: 'CONTACT_INFO',
          message: 'No contact method provided for privacy requests',
          recommendation: 'Provide at least email or phone contact for privacy requests',
        });
        ccpaCompliant = false;
      }

      // Check language accessibility
      if (notice.language !== 'en') {
        const hasEnglishVersion = await this.hasEnglishVersion(notice.siteId, notice.type);
        if (!hasEnglishVersion) {
          issues.push({
            type: 'WARNING',
            section: 'LANGUAGE',
            message: 'No English version available',
            recommendation: 'Provide English version for broader accessibility',
          });
        }
      }

      // Check for "Do Not Sell" link if data sales occur
      const dataSales = notice.content.sections.DATA_SALES;
      if (dataSales?.occurs && !dataSales.optOutLink) {
        issues.push({
          type: 'ERROR',
          section: 'DATA_SALES',
          message: 'Do Not Sell link missing despite data sales occurring',
          recommendation: 'Provide clear and conspicuous Do Not Sell My Personal Information link',
        });
        ccpaCompliant = false;
      }

      // CPRA-specific checks (California Privacy Rights Act)
      if (!notice.content.sections.SENSITIVE_PI) {
        issues.push({
          type: 'WARNING',
          section: 'SENSITIVE_PI',
          message: 'CPRA requires disclosure of sensitive personal information practices',
          recommendation: 'Add section explaining sensitive personal information handling',
        });
        cpraCompliant = false;
      }

      // Basic accessibility checks
      const content = JSON.stringify(notice.content);
      if (content.length > 10000 && !content.includes('summary')) {
        issues.push({
          type: 'WARNING',
          section: 'ACCESSIBILITY',
          message: 'Long privacy notice without summary',
          recommendation: 'Consider adding an executive summary for better readability',
        });
        accessibilityCompliant = false;
      }

      // Update compliance status
      await this.updateNoticeComplianceStatus(noticeId, {
        ccpaCompliant,
        cpraCompliant,
        accessibilityCompliant,
        issues,
      });

      return {
        ccpaCompliant,
        cpraCompliant,
        accessibilityCompliant,
        issues,
      };

    } catch (error) {
      console.error('Error validating notice compliance:', error);
      return {
        ccpaCompliant: false,
        cpraCompliant: false,
        accessibilityCompliant: false,
        issues: [{
          type: 'ERROR',
          section: 'VALIDATION',
          message: 'Failed to validate compliance',
          recommendation: 'Review notice manually',
        }],
      };
    }
  }

  /**
   * Get all privacy notices for a site
   */
  async getSitePrivacyNotices(siteId: string): Promise<PrivacyNotice[]> {
    try {
      const notices = await prisma.auditLog.findMany({
        where: {
          siteId,
          resourceType: 'ccpa_notice',
          status: { in: ['ACTIVE', 'DRAFT'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      return notices.map(notice => {
        const metadata = notice.metadata as any;
        return {
          id: notice.id,
          siteId: notice.siteId,
          type: metadata.type,
          language: metadata.language,
          version: metadata.version,
          status: notice.status as any,
          effectiveDate: new Date(metadata.effectiveDate),
          lastUpdated: notice.updatedAt,
          nextReview: new Date(metadata.nextReview),
          content: metadata.content,
          complianceChecks: metadata.complianceChecks,
          metadata,
        };
      });

    } catch (error) {
      console.error('Error getting site privacy notices:', error);
      return [];
    }
  }

  // Helper methods

  private async getNoticeTemplate(type: string, language: string): Promise<NoticeTemplate> {
    // Return appropriate template based on type and language
    const templates: Record<string, NoticeTemplate> = {
      PRIVACY_POLICY: {
        type: 'PRIVACY_POLICY',
        language,
        sections: {
          INTRODUCTION: {
            title: 'Privacy Policy',
            template: 'This Privacy Policy describes how {{businessName}} collects, uses, and protects your personal information.',
            required: true,
            variables: ['businessName'],
          },
          CATEGORIES_COLLECTED: {
            title: 'Categories of Personal Information We Collect',
            template: 'We collect the following categories of personal information: {{categories}}',
            required: true,
            variables: ['categories'],
          },
          SOURCES: {
            title: 'Sources of Personal Information',
            template: 'We collect personal information from: {{sources}}',
            required: true,
            variables: ['sources'],
          },
          BUSINESS_PURPOSES: {
            title: 'How We Use Personal Information',
            template: 'We use personal information for: {{purposes}}',
            required: true,
            variables: ['purposes'],
          },
          CONSUMER_RIGHTS: {
            title: 'Your California Privacy Rights',
            template: 'Under the California Consumer Privacy Act (CCPA), you have the right to: {{rights}}',
            required: true,
            variables: ['rights'],
          },
          CONTACT_INFO: {
            title: 'Contact Us',
            template: 'For privacy-related inquiries, contact us at: {{contactInfo}}',
            required: true,
            variables: ['contactInfo'],
          },
        },
      },
      SALE_OPT_OUT: {
        type: 'SALE_OPT_OUT',
        language,
        sections: {
          OPT_OUT_FORM: {
            title: 'Do Not Sell My Personal Information',
            template: 'Use this form to opt out of the sale of your personal information.',
            required: true,
            variables: [],
          },
        },
      },
    };

    return templates[type] || templates.PRIVACY_POLICY;
  }

  private async generateNoticeContent(
    noticeData: any,
    template: NoticeTemplate
  ): Promise<any> {
    const content = {
      businessInfo: noticeData.businessInfo,
      sections: {},
      customSections: noticeData.customSections || [],
    };

    // Generate each section from template
    for (const [sectionKey, sectionTemplate] of Object.entries(template.sections)) {
      content.sections[sectionKey] = {
        title: sectionTemplate.title,
        content: this.fillTemplate(sectionTemplate.template, noticeData),
        required: sectionTemplate.required,
      };
    }

    return content;
  }

  private fillTemplate(template: string, data: any): string {
    let filled = template;

    // Replace business name
    filled = filled.replace(/\{\{businessName\}\}/g, data.businessInfo.name);

    // Replace categories
    if (filled.includes('{{categories}}')) {
      const categoriesList = data.dataCollection.categories.join(', ');
      filled = filled.replace(/\{\{categories\}\}/g, categoriesList);
    }

    // Replace sources
    if (filled.includes('{{sources}}')) {
      const sourcesList = data.dataCollection.sources.join(', ');
      filled = filled.replace(/\{\{sources\}\}/g, sourcesList);
    }

    // Replace purposes
    if (filled.includes('{{purposes}}')) {
      const purposesList = data.dataCollection.businessPurposes.join(', ');
      filled = filled.replace(/\{\{purposes\}\}/g, purposesList);
    }

    // Replace rights
    if (filled.includes('{{rights}}')) {
      const rights = [];
      if (data.consumerRights.rightToKnow) rights.push('Right to Know');
      if (data.consumerRights.rightToDelete) rights.push('Right to Delete');
      if (data.consumerRights.rightToOptOut) rights.push('Right to Opt-Out');
      if (data.consumerRights.rightToNonDiscrimination) rights.push('Right to Non-Discrimination');
      filled = filled.replace(/\{\{rights\}\}/g, rights.join(', '));
    }

    // Replace contact info
    if (filled.includes('{{contactInfo}}')) {
      const contacts = [];
      if (data.businessInfo.contactEmail) contacts.push(data.businessInfo.contactEmail);
      if (data.businessInfo.contactPhone) contacts.push(data.businessInfo.contactPhone);
      filled = filled.replace(/\{\{contactInfo\}\}/g, contacts.join(', '));
    }

    return filled;
  }

  private async performComplianceChecks(content: any, noticeData: any): Promise<any> {
    const issues: string[] = [];
    let ccpaCompliant = true;
    let cpraCompliant = true;
    let accessibilityCompliant = true;
    let languageCompliant = true;

    // Check required sections
    const requiredSections = PRIVACY_NOTICE_CONFIG.requiredSections;
    for (const section of requiredSections) {
      if (!content.sections[section]) {
        issues.push(`Missing required section: ${section}`);
        ccpaCompliant = false;
      }
    }

    // Check contact information
    if (!content.businessInfo.contactEmail && !content.businessInfo.contactPhone) {
      issues.push('No contact method provided');
      ccpaCompliant = false;
    }

    // Check language requirements
    if (!PRIVACY_NOTICE_CONFIG.languages.includes(noticeData.language)) {
      issues.push('Language not supported');
      languageCompliant = false;
    }

    return {
      ccpaCompliant,
      cpraCompliant,
      accessibilityCompliant,
      languageCompliant,
      issues,
    };
  }

  private async getPrivacyNotice(noticeId: string): Promise<PrivacyNotice | null> {
    const notice = await prisma.auditLog.findUnique({
      where: { id: noticeId },
    });

    if (!notice) return null;

    const metadata = notice.metadata as any;
    return {
      id: notice.id,
      siteId: notice.siteId,
      type: metadata.type,
      language: metadata.language,
      version: metadata.version,
      status: notice.status as any,
      effectiveDate: new Date(metadata.effectiveDate),
      lastUpdated: notice.updatedAt,
      nextReview: new Date(metadata.nextReview),
      content: metadata.content,
      complianceChecks: metadata.complianceChecks,
      metadata,
    };
  }

  private async archiveNoticeVersion(noticeId: string): Promise<void> {
    // Implementation would create archive copy
    console.log(`Archiving notice version ${noticeId}`);
  }

  private applyContentChanges(existingContent: any, changes: any[]): any {
    const updatedContent = JSON.parse(JSON.stringify(existingContent));

    for (const change of changes) {
      if (updatedContent.sections[change.section]) {
        updatedContent.sections[change.section].content = change.newContent;
      }
    }

    return updatedContent;
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1] || '0');
    return `${major}.${minor + 1}`;
  }

  private async notifyUsersOfPrivacyUpdate(
    siteId: string,
    changes: any[],
    effectiveDate: Date
  ): Promise<void> {
    // Implementation would send notifications to users
    console.log(`Notifying users of privacy policy update for site ${siteId}`);
  }

  private getDoNotSellLinkText(language: string): string {
    const texts: Record<string, string> = {
      en: 'Do Not Sell My Personal Information',
      es: 'No Vender Mi Información Personal',
      zh: '不要出售我的个人信息',
      ko: '내 개인정보를 판매하지 마십시오',
      vi: 'Đừng Bán Thông Tin Cá Nhân Của Tôi',
      tl: 'Huwag Ibenta ang Aking Personal na Impormasyon',
    };

    return texts[language] || texts.en;
  }

  private async generateDoNotSellContent(businessInfo: any, language: string): Promise<string> {
    // Generate localized Do Not Sell page content
    const content = `
    <h1>${this.getDoNotSellLinkText(language)}</h1>
    <p>This page allows you to opt out of the sale of your personal information by ${businessInfo.name}.</p>
    <form id="do-not-sell-form">
      <label for="email">Email Address:</label>
      <input type="email" id="email" name="email" required>
      
      <label for="phone">Phone Number (optional):</label>
      <input type="tel" id="phone" name="phone">
      
      <button type="submit">Submit Opt-Out Request</button>
    </form>
    `;

    return content;
  }

  private async hasEnglishVersion(siteId: string, type: string): Promise<boolean> {
    const englishNotice = await prisma.auditLog.findFirst({
      where: {
        siteId,
        resourceType: 'ccpa_notice',
        'metadata.type': type,
        'metadata.language': 'en',
      },
    });

    return !!englishNotice;
  }

  private async updateNoticeComplianceStatus(
    noticeId: string,
    complianceStatus: any
  ): Promise<void> {
    await prisma.auditLog.update({
      where: { id: noticeId },
      data: {
        metadata: {
          complianceChecks: complianceStatus,
          lastComplianceCheck: new Date().toISOString(),
        },
      },
    });
  }

  private async getBusinessInfo(siteId: string): Promise<any> {
    // Implementation would get actual business info
    return {
      name: 'Example Business',
      address: '123 Business St, San Francisco, CA 94103',
      website: 'https://example.com',
      contactEmail: 'privacy@example.com',
    };
  }

  private async logPrivacyNoticeEvent(data: {
    type: string;
    noticeType: string;
    siteId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'CCPA_PRIVACY_NOTICE',
          severity: data.type.includes('FAILED') ? 'HIGH' : 'INFO',
          title: `CCPA Privacy Notice ${data.type}`,
          description: `CCPA privacy notice event: ${data.type}`,
          siteId: data.siteId || undefined,
          metadata: {
            noticeType: data.noticeType,
            eventType: data.type,
            ccpaCompliance: true,
            ...data.metadata,
          },
          success: !data.type.includes('FAILED'),
        },
      });
    } catch (error) {
      console.error('Failed to log privacy notice event:', error);
    }
  }
}

// Export singleton instance
export const ccpaPrivacyNoticeService = new CCPAPrivacyNoticeService();

// Export types
export type {
  PrivacyNotice,
  NoticeTemplate,
}; 