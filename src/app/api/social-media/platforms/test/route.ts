import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/services/social-media';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// POST /api/social-media/platforms/test - Test platform connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    const result = await socialMediaService.testPlatformConnection(platform);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to test platform connection:', error);
    return NextResponse.json(
      { error: 'Failed to test platform connection' },
      { status: 500 }
    );
  }
} 