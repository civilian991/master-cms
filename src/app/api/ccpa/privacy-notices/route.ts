import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { ccpaPrivacyNoticeService } from '@/lib/ccpa/privacy-notices';
import { z } from 'zod';

const noticeGenerationSchema = z.object({
  type: z.enum(['PRIVACY_POLICY', 'COLLECTION_NOTICE', 'SALE_OPT_OUT', 'FINANCIAL_INCENTIVE', 'SERVICE_PROVIDER']),
  language: z.enum(['en', 'es', 'zh', 'ko', 'vi', 'tl']).default('en'),
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
    rightToCorrect: z.boolean().default(false),
  }),
  customSections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number(),
  })).optional(),
});

const noticeUpdateSchema = z.object({
  noticeId: z.string(),
  changes: z.array(z.object({
    section: z.string(),
    oldContent: z.string(),
    newContent: z.string(),
    reason: z.string(),
  })),
  effectiveDate: z.string().optional(),
  notifyUsers: z.boolean().default(true),
});

const doNotSellPageSchema = z.object({
  language: z.enum(['en', 'es', 'zh', 'ko', 'vi', 'tl']).default('en'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage privacy notices' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'generate-notice') {
      // Generate new privacy notice
      const validatedData = noticeGenerationSchema.parse(body);

      const privacyNotice = await ccpaPrivacyNoticeService.generatePrivacyNotice({
        siteId: session.user.siteId,
        type: validatedData.type,
        language: validatedData.language,
        businessInfo: validatedData.businessInfo,
        dataCollection: validatedData.dataCollection,
        thirdPartySharing: validatedData.thirdPartySharing,
        dataSales: validatedData.dataSales,
        consumerRights: validatedData.consumerRights,
        customSections: validatedData.customSections,
      });

      return NextResponse.json({
        success: true,
        notice: privacyNotice,
        message: `${validatedData.type} privacy notice generated successfully`,
      });

    } else if (action === 'update-notice') {
      // Update existing privacy notice
      const validatedData = noticeUpdateSchema.parse(body);

      const effectiveDate = validatedData.effectiveDate 
        ? new Date(validatedData.effectiveDate)
        : undefined;

      const updateResult = await ccpaPrivacyNoticeService.updatePrivacyNotice({
        noticeId: validatedData.noticeId,
        changes: validatedData.changes,
        effectiveDate,
        notifyUsers: validatedData.notifyUsers,
      });

      return NextResponse.json({
        success: updateResult.success,
        newVersion: updateResult.newVersion,
        changesApplied: updateResult.changesApplied,
        message: `Privacy notice updated to version ${updateResult.newVersion}`,
      });

    } else if (action === 'generate-do-not-sell') {
      // Generate Do Not Sell page
      const validatedData = doNotSellPageSchema.parse(body);

      const doNotSellPage = await ccpaPrivacyNoticeService.generateDoNotSellPage(
        session.user.siteId,
        validatedData.language
      );

      return NextResponse.json({
        success: true,
        doNotSellPage,
        message: 'Do Not Sell page generated successfully',
      });

    } else if (action === 'validate-compliance') {
      // Validate notice compliance
      const { noticeId } = body;

      if (!noticeId) {
        return NextResponse.json(
          { error: 'Notice ID is required' },
          { status: 400 }
        );
      }

      const complianceResult = await ccpaPrivacyNoticeService.validateNoticeCompliance(noticeId);

      return NextResponse.json({
        success: true,
        compliance: complianceResult,
        message: complianceResult.ccpaCompliant 
          ? 'Privacy notice is CCPA compliant'
          : 'Privacy notice has compliance issues',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "generate-notice", "update-notice", "generate-do-not-sell", or "validate-compliance"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('CCPA privacy notices API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Privacy notice operation failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list-notices';

    if (action === 'list-notices') {
      // Get all privacy notices for the site
      if (!session.user.permissions?.includes('view_security_logs')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const notices = await ccpaPrivacyNoticeService.getSitePrivacyNotices(session.user.siteId);

      return NextResponse.json({
        success: true,
        notices,
      });

    } else if (action === 'notice-details') {
      // Get specific notice details
      const noticeId = url.searchParams.get('noticeId');

      if (!noticeId) {
        return NextResponse.json(
          { error: 'Notice ID is required' },
          { status: 400 }
        );
      }

      if (!session.user.permissions?.includes('view_security_logs')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const notice = await ccpaPrivacyNoticeService['getPrivacyNotice'](noticeId);

      if (!notice) {
        return NextResponse.json(
          { error: 'Privacy notice not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        notice,
      });

    } else if (action === 'compliance-check') {
      // Check compliance for a specific notice
      const noticeId = url.searchParams.get('noticeId');

      if (!noticeId) {
        return NextResponse.json(
          { error: 'Notice ID is required' },
          { status: 400 }
        );
      }

      if (!session.user.permissions?.includes('view_security_logs')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const complianceResult = await ccpaPrivacyNoticeService.validateNoticeCompliance(noticeId);

      return NextResponse.json({
        success: true,
        compliance: complianceResult,
      });

    } else if (action === 'templates') {
      // Get available privacy notice templates
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const templates = {
        types: [
          {
            type: 'PRIVACY_POLICY',
            name: 'Comprehensive Privacy Policy',
            description: 'Complete CCPA-compliant privacy policy with all required sections',
            required: true,
          },
          {
            type: 'COLLECTION_NOTICE',
            name: 'At-Collection Notice',
            description: 'Notice provided at the point of data collection',
            required: true,
          },
          {
            type: 'SALE_OPT_OUT',
            name: 'Do Not Sell Notice',
            description: 'Dedicated page for opting out of data sales',
            required: true,
          },
          {
            type: 'FINANCIAL_INCENTIVE',
            name: 'Financial Incentive Notice',
            description: 'Notice for programs offering financial incentives for personal information',
            required: false,
          },
          {
            type: 'SERVICE_PROVIDER',
            name: 'Service Provider Notice',
            description: 'Notice for service provider relationships',
            required: false,
          },
        ],
        languages: [
          { code: 'en', name: 'English', required: true },
          { code: 'es', name: 'Spanish', required: false },
          { code: 'zh', name: 'Chinese (Simplified)', required: false },
          { code: 'ko', name: 'Korean', required: false },
          { code: 'vi', name: 'Vietnamese', required: false },
          { code: 'tl', name: 'Filipino (Tagalog)', required: false },
        ],
        requiredSections: [
          'CATEGORIES_COLLECTED',
          'SOURCES',
          'BUSINESS_PURPOSES',
          'THIRD_PARTY_SHARING',
          'CONSUMER_RIGHTS',
          'CONTACT_INFO',
          'DATA_SALES',
          'NON_DISCRIMINATION',
        ],
      };

      return NextResponse.json({
        success: true,
        templates,
      });

    } else if (action === 'sample-content') {
      // Get sample content for privacy notice sections
      const sectionType = url.searchParams.get('section') || 'CONSUMER_RIGHTS';
      const language = url.searchParams.get('language') || 'en';

      const sampleContent = this.getSampleContent(sectionType, language);

      return NextResponse.json({
        success: true,
        sampleContent,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('CCPA privacy notices GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get privacy notice information' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!session.user.permissions?.includes('manage_security')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete privacy notices' },
        { status: 403 }
      );
    }

    const { noticeId, reason } = await request.json();

    if (!noticeId) {
      return NextResponse.json(
        { error: 'Notice ID is required' },
        { status: 400 }
      );
    }

    // Archive notice instead of deleting (for compliance)
    await prisma.auditLog.update({
      where: { id: noticeId },
      data: {
        status: 'ARCHIVED',
        metadata: {
          archivedAt: new Date().toISOString(),
          archivedBy: session.user.id,
          archiveReason: reason || 'Manual archive',
        },
      },
    });

    // Log archive action
    await prisma.securityEvent.create({
      data: {
        eventType: 'CCPA_PRIVACY_NOTICE',
        severity: 'INFO',
        title: 'Privacy Notice Archived',
        description: `Privacy notice ${noticeId} was archived`,
        userId: session.user.id,
        siteId: session.user.siteId,
        metadata: {
          noticeId,
          reason,
          action: 'ARCHIVE',
        },
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Privacy notice archived successfully',
    });

  } catch (error) {
    console.error('Privacy notice archive error:', error);
    return NextResponse.json(
      { error: 'Failed to archive privacy notice' },
      { status: 500 }
    );
  }
}

// Helper function to get sample content
function getSampleContent(sectionType: string, language: string): any {
  const sampleContent: Record<string, Record<string, string>> = {
    CONSUMER_RIGHTS: {
      en: `Under the California Consumer Privacy Act (CCPA), California residents have the following rights:

• Right to Know: You have the right to request information about the categories and specific pieces of personal information we have collected about you, the categories of sources from which we collected your personal information, our business or commercial purpose for collecting your personal information, and the categories of third parties with whom we share your personal information.

• Right to Delete: You have the right to request that we delete personal information we have collected from you, subject to certain exceptions.

• Right to Opt-Out: You have the right to opt out of the sale of your personal information.

• Right to Non-Discrimination: You have the right not to receive discriminatory treatment for exercising your CCPA rights.`,
      es: `Bajo la Ley de Privacidad del Consumidor de California (CCPA), los residentes de California tienen los siguientes derechos:

• Derecho a Saber: Tiene derecho a solicitar información sobre las categorías y piezas específicas de información personal que hemos recopilado sobre usted.

• Derecho a Eliminar: Tiene derecho a solicitar que eliminemos la información personal que hemos recopilado de usted.

• Derecho a Optar por No Participar: Tiene derecho a optar por no participar en la venta de su información personal.

• Derecho a la No Discriminación: Tiene derecho a no recibir trato discriminatorio por ejercer sus derechos CCPA.`,
    },
    DATA_SALES: {
      en: `We do not sell personal information to third parties for monetary consideration. However, we may share personal information with third parties for business purposes as described in this privacy policy.

If you are a California resident and would like to opt out of any potential sale of personal information, you can do so by clicking the "Do Not Sell My Personal Information" link.`,
      es: `No vendemos información personal a terceros por consideración monetaria. Sin embargo, podemos compartir información personal con terceros para fines comerciales como se describe en esta política de privacidad.`,
    },
    CONTACT_INFO: {
      en: `To exercise your CCPA rights or if you have questions about this privacy policy, please contact us at:

Email: privacy@company.com
Phone: 1-800-PRIVACY
Mail: Privacy Officer, Company Name, 123 Main St, City, CA 12345

We will respond to your request within the timeframe required by law.`,
      es: `Para ejercer sus derechos CCPA o si tiene preguntas sobre esta política de privacidad, contáctenos en:

Correo electrónico: privacy@company.com
Teléfono: 1-800-PRIVACY
Correo: Oficial de Privacidad, Nombre de la Empresa, 123 Main St, Ciudad, CA 12345`,
    },
  };

  return {
    section: sectionType,
    language,
    content: sampleContent[sectionType]?.[language] || sampleContent[sectionType]?.['en'] || 'Sample content not available',
  };
}

import { prisma } from '@/lib/prisma'; 