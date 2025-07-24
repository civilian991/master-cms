import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/services/social-media';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

// GET /api/social-media/platforms - Get available platforms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platforms = await socialMediaService.getAvailablePlatforms();

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('Failed to get available platforms:', error);
    return NextResponse.json(
      { error: 'Failed to get available platforms' },
      { status: 500 }
    );
  }
} 