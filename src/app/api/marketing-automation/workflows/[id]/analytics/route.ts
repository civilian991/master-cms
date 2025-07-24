import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAutomationService } from '@/lib/services/marketing-automation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await marketingAutomationService.getAutomationAnalytics(params.id);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Failed to get automation analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get automation analytics' },
      { status: 500 }
    );
  }
} 