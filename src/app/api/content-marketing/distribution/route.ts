import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { contentMarketingService } from '@/lib/services/content-marketing';

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

    const channels = await contentMarketingService.getContentDistributionChannels(siteId);

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Failed to get content distribution channels:', error);
    return NextResponse.json(
      { error: 'Failed to get content distribution channels' },
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
    const {
      name,
      type,
      platform,
      isActive,
      settings,
      siteId,
    } = body;

    if (!name || !type || !siteId) {
      return NextResponse.json(
        { error: 'Name, type, and siteId are required' },
        { status: 400 }
      );
    }

    const channel = await contentMarketingService.createContentDistributionChannel({
      name,
      type,
      platform: platform || undefined,
      isActive: isActive !== false,
      settings: settings || {},
      siteId,
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Failed to create content distribution channel:', error);
    return NextResponse.json(
      { error: 'Failed to create content distribution channel' },
      { status: 500 }
    );
  }
} 