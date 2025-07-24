import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { ccpaComplianceService } from '@/lib/ccpa/ccpa-compliance';
import { z } from 'zod';

const ccpaRequestApiSchema = z.object({
  requestType: z.enum(['RIGHT_TO_KNOW', 'RIGHT_TO_DELETE', 'RIGHT_TO_OPT_OUT', 'RIGHT_TO_NON_DISCRIMINATION', 'RIGHT_TO_DATA_PORTABILITY']),
  specificRequest: z.string().optional(),
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

const optOutRequestSchema = z.object({
  optOutMethod: z.enum(['WEBSITE_FORM', 'EMAIL', 'PHONE', 'MAIL']),
  categories: z.array(z.string()).optional(),
  effectiveDate: z.string().optional(),
  globalOptOut: z.boolean().default(false),
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

    const body = await request.json();
    const { action } = body;

    // Get user agent and IP for compliance tracking
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    if (action === 'submit-request') {
      // Submit CCPA consumer rights request
      const validatedData = ccpaRequestApiSchema.parse(body);

      const ccpaRequest = await ccpaComplianceService.submitCCPARequest(
        {
          consumerId: session.user.id,
          requestType: validatedData.requestType,
          specificRequest: validatedData.specificRequest,
          timeFrame: validatedData.timeFrame,
          verificationMethod: validatedData.verificationMethod,
          contactInfo: validatedData.contactInfo,
          agentInfo: validatedData.agentInfo,
        },
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        request: ccpaRequest,
        message: `CCPA ${validatedData.requestType} request submitted successfully`,
        acknowledgment: 'Your request will be acknowledged within 10 business days and fulfilled within 45 days.',
      });

    } else if (action === 'opt-out-data-sale') {
      // Process data sale opt-out request
      const validatedData = optOutRequestSchema.parse(body);

      const effectiveDate = validatedData.effectiveDate 
        ? new Date(validatedData.effectiveDate)
        : undefined;

      const optOutResult = await ccpaComplianceService.processDataSaleOptOut(
        {
          consumerId: session.user.id,
          optOutMethod: validatedData.optOutMethod,
          categories: validatedData.categories,
          effectiveDate,
          globalOptOut: validatedData.globalOptOut,
          userAgent,
          ipAddress,
        },
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        optOut: optOutResult,
        message: 'Data sale opt-out request processed successfully',
      });

    } else if (action === 'process-right-to-know') {
      // Process right to know request (admin/DPO only)
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to process requests' },
          { status: 403 }
        );
      }

      const { requestId } = body;
      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      const result = await ccpaComplianceService.processRightToKnowRequest(requestId);

      return NextResponse.json({
        success: result.success,
        disclosureInfo: result.disclosureInfo,
        message: result.message,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "submit-request", "opt-out-data-sale", or "process-right-to-know"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('CCPA consumer rights API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'CCPA request operation failed', details: error.message },
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
    const action = url.searchParams.get('action') || 'opt-out-status';

    if (action === 'opt-out-status') {
      // Get consumer's data sale opt-out status
      const optOutStatus = await ccpaComplianceService.getConsumerOptOutStatus(
        session.user.id,
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        optOutStatus,
      });

    } else if (action === 'applicability') {
      // Check if CCPA applies to this business (admin only)
      if (!session.user.permissions?.includes('view_security_logs')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const applicability = await ccpaComplianceService.checkCCPAApplicability(
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        applicability,
      });

    } else if (action === 'disclosure') {
      // Generate CCPA disclosure report (admin only)
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const businessName = url.searchParams.get('businessName') || 'Unknown Business';
      const period = (url.searchParams.get('period') as any) || 'LAST_12_MONTHS';
      const format = (url.searchParams.get('format') as any) || 'JSON';

      const disclosure = await ccpaComplianceService.generateCCPADisclosure(
        {
          businessName,
          period,
          includeThirdParties: true,
          includeServiceProviders: true,
          format,
        },
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        disclosure,
      });

    } else if (action === 'consumer-categories') {
      // Get personal information categories for consumer (informational)
      const categories = [
        {
          category: 'IDENTIFIERS',
          description: 'Name, email address, IP address, and other identifiers',
          collected: true,
          sources: ['Direct submission', 'Automatic collection'],
          purposes: ['Service provision', 'Communication', 'Security'],
        },
        {
          category: 'COMMERCIAL_INFO',
          description: 'Purchase history and preferences',
          collected: true,
          sources: ['Purchase transactions', 'User preferences'],
          purposes: ['Order fulfillment', 'Recommendations', 'Analytics'],
        },
        {
          category: 'INTERNET_ACTIVITY',
          description: 'Browsing history and website interactions',
          collected: true,
          sources: ['Website analytics', 'Cookies'],
          purposes: ['Website optimization', 'Analytics', 'Personalization'],
        },
        {
          category: 'GEOLOCATION_DATA',
          description: 'Approximate location information',
          collected: false,
          sources: [],
          purposes: [],
        },
        {
          category: 'INFERENCES',
          description: 'Preferences and characteristics derived from other data',
          collected: true,
          sources: ['Data analysis', 'User behavior'],
          purposes: ['Personalization', 'Recommendations', 'Analytics'],
        },
      ];

      return NextResponse.json({
        success: true,
        categories,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('CCPA consumer rights GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get CCPA information' },
      { status: 500 }
    );
  }
} 