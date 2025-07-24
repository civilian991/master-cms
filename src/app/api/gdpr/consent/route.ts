import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { gdprConsentService } from '@/lib/gdpr/consent-management';
import { z } from 'zod';

const consentRecordApiSchema = z.object({
  category: z.enum(['ESSENTIAL', 'ANALYTICS', 'MARKETING', 'PERSONALIZATION', 'THIRD_PARTY']),
  purpose: z.string(),
  legalBasis: z.enum(['CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS']),
  granted: z.boolean(),
  consentMethod: z.enum(['EXPLICIT', 'IMPLIED', 'OPT_IN', 'OPT_OUT', 'PRE_TICKED', 'COOKIE_BANNER']),
  dataTypes: z.array(z.string()),
  processingPurposes: z.array(z.string()),
  retentionPeriod: z.number().optional(),
  thirdParties: z.array(z.string()).optional(),
  specialCategory: z.enum(['HEALTH', 'GENETIC', 'BIOMETRIC', 'POLITICAL', 'RELIGIOUS', 'UNION', 'SEXUAL', 'CRIMINAL']).optional(),
});

const consentWithdrawalApiSchema = z.object({
  consentIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  reason: z.string().optional(),
  effectiveDate: z.string().optional(),
  deletionRequested: z.boolean().default(false),
});

const bulkConsentUpdateSchema = z.object({
  consents: z.array(z.object({
    category: z.string(),
    granted: z.boolean(),
    purpose: z.string(),
    legalBasis: z.string(),
  })),
  updateReason: z.string().optional(),
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

    // Get user agent and IP for consent recording
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0] || xRealIp || 'unknown';

    if (action === 'record') {
      // Record new consent
      const validatedData = consentRecordApiSchema.parse(body);

      const consentRecord = await gdprConsentService.recordConsent({
        userId: session.user.id,
        siteId: session.user.siteId,
        category: validatedData.category,
        purpose: validatedData.purpose,
        legalBasis: validatedData.legalBasis,
        granted: validatedData.granted,
        consentMethod: validatedData.consentMethod,
        dataTypes: validatedData.dataTypes,
        processingPurposes: validatedData.processingPurposes,
        retentionPeriod: validatedData.retentionPeriod,
        thirdParties: validatedData.thirdParties,
        specialCategory: validatedData.specialCategory,
        userAgent,
        ipAddress,
        geoLocation: request.geo?.country || 'unknown',
      });

      return NextResponse.json({
        success: true,
        consent: consentRecord,
        message: 'Consent recorded successfully',
      });

    } else if (action === 'withdraw') {
      // Withdraw consent
      const validatedData = consentWithdrawalApiSchema.parse(body);

      const effectiveDate = validatedData.effectiveDate 
        ? new Date(validatedData.effectiveDate)
        : undefined;

      const withdrawalResult = await gdprConsentService.withdrawConsent({
        userId: session.user.id,
        siteId: session.user.siteId,
        consentIds: validatedData.consentIds,
        categories: validatedData.categories,
        reason: validatedData.reason,
        effectiveDate,
        deletionRequested: validatedData.deletionRequested,
      });

      return NextResponse.json({
        success: true,
        withdrawal: withdrawalResult,
        message: `Successfully withdrew ${withdrawalResult.withdrawnConsents.length} consents`,
      });

    } else if (action === 'update-bulk') {
      // Bulk update consents
      const validatedData = bulkConsentUpdateSchema.parse(body);

      const updatedConsents = await gdprConsentService.updateConsents({
        userId: session.user.id,
        siteId: session.user.siteId,
        consents: validatedData.consents,
        updateReason: validatedData.updateReason,
      });

      return NextResponse.json({
        success: true,
        consents: updatedConsents,
        message: `Updated ${updatedConsents.length} consents successfully`,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "record", "withdraw", or "update-bulk"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('GDPR consent API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Consent operation failed', details: error.message },
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
    const action = url.searchParams.get('action') || 'summary';

    if (action === 'summary') {
      // Get consent summary
      const consentSummary = await gdprConsentService.getUserConsentSummary(
        session.user.id,
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        summary: consentSummary,
      });

    } else if (action === 'check') {
      // Check specific consent
      const category = url.searchParams.get('category');
      const purpose = url.searchParams.get('purpose');

      if (!category) {
        return NextResponse.json(
          { error: 'Category parameter is required' },
          { status: 400 }
        );
      }

      const consentCheck = await gdprConsentService.hasValidConsent(
        session.user.id,
        session.user.siteId,
        category,
        purpose || undefined
      );

      return NextResponse.json({
        success: true,
        consent: consentCheck,
      });

    } else if (action === 'renewals') {
      // Get consent renewal reminders (admin only)
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const renewalReminders = await gdprConsentService.getConsentRenewalReminders(
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        renewals: renewalReminders,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "summary", "check", or "renewals"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('GDPR consent GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get consent information' },
      { status: 500 }
    );
  }
} 