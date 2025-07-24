import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { abTestingService } from '@/lib/services/ab-testing';
import { MarketingABTestStatus } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status') as MarketingABTestStatus;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const tests = await abTestingService.getABTests(siteId, status);

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Failed to get A/B tests:', error);
    return NextResponse.json(
      { error: 'Failed to get A/B tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, config } = body;

    if (!siteId || !config) {
      return NextResponse.json(
        { error: 'SiteId and config are required' },
        { status: 400 }
      );
    }

    const test = await abTestingService.createABTest(siteId, config, session.user.email || 'unknown');

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Failed to create A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
} 