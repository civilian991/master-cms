import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const pricing = await subscriptionService.getSiteSpecificPricing(siteId);

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error('Failed to fetch subscription pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription pricing' },
      { status: 500 }
    );
  }
} 