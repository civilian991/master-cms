import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { gdprUserRightsService } from '@/lib/gdpr/user-rights';
import { z } from 'zod';

const gdprRequestApiSchema = z.object({
  requestType: z.enum(['ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICT_PROCESSING', 'DATA_PORTABILITY', 'OBJECT', 'AUTOMATED_DECISION']),
  description: z.string().optional(),
  dataCategories: z.array(z.enum(['PERSONAL_DATA', 'ACCOUNT_DATA', 'CONTENT_DATA', 'BEHAVIORAL_DATA', 'TECHNICAL_DATA', 'COMMUNICATION_DATA', 'FINANCIAL_DATA', 'SPECIAL_CATEGORY'])).optional(),
  specificData: z.array(z.string()).optional(),
  urgentRequest: z.boolean().default(false),
  verificationMethod: z.enum(['EMAIL', 'SMS', 'DOCUMENT_UPLOAD', 'VIDEO_CALL']).optional(),
  legalBasis: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

const rectificationRequestSchema = z.object({
  requestId: z.string(),
  corrections: z.array(z.object({
    field: z.string(),
    currentValue: z.string(),
    correctedValue: z.string(),
    reason: z.string(),
  })),
  justification: z.string(),
  supportingDocuments: z.array(z.string()).optional(),
});

const portabilityRequestSchema = z.object({
  requestId: z.string(),
  format: z.enum(['JSON', 'CSV', 'XML', 'PDF']),
  dataCategories: z.array(z.string()),
  includeMetadata: z.boolean().default(true),
  transferToController: z.string().optional(),
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

    if (action === 'submit-request') {
      // Submit new GDPR request
      const validatedData = gdprRequestApiSchema.parse(body);

      const gdprRequest = await gdprUserRightsService.submitGDPRRequest({
        userId: session.user.id,
        siteId: session.user.siteId,
        requestType: validatedData.requestType,
        description: validatedData.description,
        dataCategories: validatedData.dataCategories,
        specificData: validatedData.specificData,
        urgentRequest: validatedData.urgentRequest,
        verificationMethod: validatedData.verificationMethod,
        submittedBy: session.user.id,
        legalBasis: validatedData.legalBasis,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
      });

      return NextResponse.json({
        success: true,
        request: gdprRequest,
        message: `GDPR ${validatedData.requestType} request submitted successfully`,
      });

    } else if (action === 'process-access') {
      // Process data access request
      const { requestId } = body;

      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      // Check if user has permission to process requests (admin/DPO)
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to process requests' },
          { status: 403 }
        );
      }

      const result = await gdprUserRightsService.processAccessRequest(requestId);

      return NextResponse.json({
        success: result.success,
        dataPackage: result.dataPackage,
        message: result.message,
      });

    } else if (action === 'process-rectification') {
      // Process data rectification request
      const validatedData = rectificationRequestSchema.parse(body);

      // Check if user owns the request or has admin permissions
      const request = await gdprUserRightsService['getGDPRRequest'](validatedData.requestId);
      if (!request || (request.userId !== session.user.id && !session.user.permissions?.includes('manage_security'))) {
        return NextResponse.json(
          { error: 'Unauthorized to process this request' },
          { status: 403 }
        );
      }

      const result = await gdprUserRightsService.processRectificationRequest({
        userId: session.user.id,
        siteId: session.user.siteId,
        requestId: validatedData.requestId,
        corrections: validatedData.corrections,
        justification: validatedData.justification,
        supportingDocuments: validatedData.supportingDocuments,
      });

      return NextResponse.json({
        success: result.success,
        correctionsMade: result.correctionsMade,
        message: result.message,
      });

    } else if (action === 'process-erasure') {
      // Process data erasure request
      const { requestId } = body;

      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      // Check permissions
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to process erasure requests' },
          { status: 403 }
        );
      }

      const result = await gdprUserRightsService.processErasureRequest(requestId);

      return NextResponse.json({
        success: result.success,
        deletedRecords: result.deletedRecords,
        anonymizedRecords: result.anonymizedRecords,
        message: result.message,
      });

    } else if (action === 'process-portability') {
      // Process data portability request
      const validatedData = portabilityRequestSchema.parse(body);

      // Check if user owns the request or has admin permissions
      const request = await gdprUserRightsService['getGDPRRequest'](validatedData.requestId);
      if (!request || (request.userId !== session.user.id && !session.user.permissions?.includes('manage_security'))) {
        return NextResponse.json(
          { error: 'Unauthorized to process this request' },
          { status: 403 }
        );
      }

      const dataPackage = await gdprUserRightsService.processPortabilityRequest({
        userId: session.user.id,
        siteId: session.user.siteId,
        requestId: validatedData.requestId,
        format: validatedData.format,
        dataCategories: validatedData.dataCategories,
        includeMetadata: validatedData.includeMetadata,
        transferToController: validatedData.transferToController,
      });

      return NextResponse.json({
        success: true,
        dataPackage,
        message: 'Data portability request processed successfully',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('GDPR user rights API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'GDPR request operation failed', details: error.message },
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
    const action = url.searchParams.get('action') || 'my-requests';

    if (action === 'my-requests') {
      // Get user's GDPR requests
      const userRequests = await gdprUserRightsService.getUserGDPRRequests(
        session.user.id,
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        requests: userRequests,
      });

    } else if (action === 'all-requests') {
      // Get all GDPR requests (admin/DPO only)
      if (!session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Implementation would get all requests for the site
      // This is a simplified version
      const allRequests = await gdprUserRightsService.getUserGDPRRequests(
        '', // Empty userId to get all (implementation needed)
        session.user.siteId
      );

      return NextResponse.json({
        success: true,
        requests: allRequests,
      });

    } else if (action === 'request-details') {
      // Get specific request details
      const requestId = url.searchParams.get('requestId');

      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      const request = await gdprUserRightsService['getGDPRRequest'](requestId);

      if (!request) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      // Check if user owns the request or has admin permissions
      if (request.userId !== session.user.id && !session.user.permissions?.includes('manage_security')) {
        return NextResponse.json(
          { error: 'Unauthorized to view this request' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        request,
      });

    } else if (action === 'statistics') {
      // Get GDPR request statistics (admin/DPO only)
      if (!session.user.permissions?.includes('view_security_logs')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const statistics = await this.getGDPRStatistics(session.user.siteId);

      return NextResponse.json({
        success: true,
        statistics,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('GDPR user rights GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get GDPR information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, requestId } = body;

    if (action === 'verify-request') {
      // Verify a GDPR request
      const { verificationStatus, verificationNotes } = body;

      await gdprUserRightsService['updateRequestStatus'](requestId, 'VERIFIED');

      // Log verification
      await this.logGDPRVerification({
        requestId,
        verifiedBy: session.user.id,
        status: verificationStatus,
        notes: verificationNotes,
      });

      return NextResponse.json({
        success: true,
        message: 'Request verified successfully',
      });

    } else if (action === 'reject-request') {
      // Reject a GDPR request
      const { rejectionReason } = body;

      await gdprUserRightsService['updateRequestStatus'](requestId, 'REJECTED');

      // Log rejection
      await this.logGDPRRejection({
        requestId,
        rejectedBy: session.user.id,
        reason: rejectionReason,
      });

      return NextResponse.json({
        success: true,
        message: 'Request rejected',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('GDPR user rights PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update GDPR request' },
      { status: 500 }
    );
  }
}

// Helper methods for statistics and logging
async function getGDPRStatistics(siteId: string) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const requests = await prisma.auditLog.findMany({
      where: {
        siteId,
        resourceType: 'gdpr_rights',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        status: true,
        metadata: true,
        createdAt: true,
      },
    });

    const statistics = {
      totalRequests: requests.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageResponseTime: 0,
      complianceRate: 0,
    };

    requests.forEach(request => {
      const metadata = request.metadata as any;
      const requestType = metadata?.requestType || 'UNKNOWN';
      const status = request.status;

      statistics.byType[requestType] = (statistics.byType[requestType] || 0) + 1;
      statistics.byStatus[status] = (statistics.byStatus[status] || 0) + 1;
    });

    // Calculate compliance rate (completed within deadline)
    const completedRequests = requests.filter(r => r.status === 'COMPLETED');
    statistics.complianceRate = requests.length > 0 
      ? (completedRequests.length / requests.length) * 100
      : 100;

    return statistics;

  } catch (error) {
    console.error('Error getting GDPR statistics:', error);
    return {
      totalRequests: 0,
      byType: {},
      byStatus: {},
      averageResponseTime: 0,
      complianceRate: 0,
    };
  }
}

async function logGDPRVerification(data: {
  requestId: string;
  verifiedBy: string;
  status: string;
  notes?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        siteId: '', // Will be filled from request
        userId: data.verifiedBy,
        action: 'UPDATE',
        resource: 'gdpr_request',
        resourceType: 'gdpr_verification',
        description: `GDPR request verified: ${data.status}`,
        status: 'SUCCESS',
        metadata: {
          requestId: data.requestId,
          verificationStatus: data.status,
          notes: data.notes,
          verifiedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log GDPR verification:', error);
  }
}

async function logGDPRRejection(data: {
  requestId: string;
  rejectedBy: string;
  reason: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        siteId: '', // Will be filled from request
        userId: data.rejectedBy,
        action: 'UPDATE',
        resource: 'gdpr_request',
        resourceType: 'gdpr_rejection',
        description: `GDPR request rejected: ${data.reason}`,
        status: 'SUCCESS',
        metadata: {
          requestId: data.requestId,
          rejectionReason: data.reason,
          rejectedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log GDPR rejection:', error);
  }
}

import { prisma } from '@/lib/prisma'; 