import { NextRequest, NextResponse } from 'next/server';
import { businessIntelligenceService } from '@/lib/services/business-intelligence';
import { getUserFromRequest } from '@/lib/auth/middleware';

// POST /api/admin/business-intelligence/data-sources/[id]/sync - Sync data source
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to sync data sources
    if (!user.permissions.includes('analytics:write') && !user.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const action = body.action || 'sync';

    if (action === 'sync') {
      // Sync data source
      const result = await businessIntelligenceService.syncDataSource(id);
      
      return NextResponse.json({
        success: true,
        message: 'Data source synced successfully',
        result,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error syncing data source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 