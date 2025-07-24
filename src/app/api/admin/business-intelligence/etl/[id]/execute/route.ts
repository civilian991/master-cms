import { NextRequest, NextResponse } from 'next/server';
import { businessIntelligenceService } from '@/lib/services/business-intelligence';
import { getUserFromRequest } from '@/lib/auth/middleware';

// POST /api/admin/business-intelligence/etl/[id]/execute - Execute ETL job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to execute ETL jobs
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const action = body.action || 'execute';

    if (action === 'execute') {
      // Execute ETL job
      const result = await businessIntelligenceService.executeETLJob(id);
      
      return NextResponse.json({
        success: true,
        message: 'ETL job executed successfully',
        result,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error executing ETL job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 