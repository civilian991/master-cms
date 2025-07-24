import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { emailMarketingService } from '@/lib/services/email-marketing';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const segments = await emailMarketingService.getSegments(siteId);
    return NextResponse.json({ segments });
  } catch (error) {
    console.error('Failed to get email segments:', error);
    return NextResponse.json(
      { error: 'Failed to get email segments' },
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
    const { name, description, criteria, siteId } = body;

    if (!name || !siteId || !criteria) {
      return NextResponse.json(
        { error: 'Name, siteId, and criteria are required' },
        { status: 400 }
      );
    }

    const segment = await emailMarketingService.createSegment(
      name,
      description || '',
      criteria,
      siteId
    );

    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    console.error('Failed to create email segment:', error);
    return NextResponse.json(
      { error: 'Failed to create email segment' },
      { status: 500 }
    );
  }
} 