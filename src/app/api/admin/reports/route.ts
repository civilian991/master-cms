import { NextRequest, NextResponse } from 'next/server';
import { reportingService } from '@/lib/services/reporting';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

// GET /api/admin/reports - Get reports
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view reports
    if (!user.permissions.includes('analytics:read') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const path = new URL(request.url).pathname;

    // Get site ID from query params or user's site
    const siteId = searchParams.get('siteId') || user.siteId;

    // Check if user has access to the site
    if (!user.permissions.includes('site:all') && user.siteId !== siteId) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 });
    }

    if (path.includes('/templates')) {
      // Get report templates
      const templates = await reportingService.getReportTemplates();
      
      return NextResponse.json({
        success: true,
        templates,
      });
    } else if (path.includes('/analytics')) {
      // Get report analytics
      const reportId = searchParams.get('reportId') || undefined;
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      
      const analytics = await reportingService.getReportAnalytics(
        reportId,
        startDate && endDate ? { startDate, endDate } : undefined
      );
      
      return NextResponse.json({
        success: true,
        analytics,
      });
    } else {
      // Get reports
      const dashboardId = searchParams.get('dashboardId') || undefined;
      const type = searchParams.get('type') || undefined;
      const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
      
      const reports = await reportingService.getReports(dashboardId, type, isActive);
      
      return NextResponse.json({
        success: true,
        reports,
      });
    }

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reports - Create report
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create reports
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const path = new URL(request.url).pathname;

    if (path.includes('/execute')) {
      // Execute report
      const result = await reportingService.executeReport(body);
      
      return NextResponse.json({
        success: true,
        message: 'Report executed successfully',
        result,
      });
    } else {
      // Create report
      const report = await reportingService.createReport(body);
      
      return NextResponse.json({
        success: true,
        report,
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating/executing report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reports/[id] - Update report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update reports
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    const report = await reportingService.updateReport(id, body);
    
    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reports/[id] - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete reports
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    await reportingService.deleteReport(id);
    
    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 