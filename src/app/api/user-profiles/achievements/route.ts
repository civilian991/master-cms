import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { userProfilesService, AchievementSchema } from '@/lib/services/user-profiles';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'user-achievements':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const userAchievements = await userProfilesService.getUserAchievements(userId, siteId);
        return NextResponse.json({ userAchievements });

      case 'check':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        // Only allow users to check their own achievements
        if (userId !== session.user.id && !session.user.permissions?.includes('manage_achievements')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const newAchievements = await userProfilesService.checkAchievements(userId, siteId);
        return NextResponse.json({ newAchievements });

      default:
        const achievements = await userProfilesService.getAchievements(siteId);
        return NextResponse.json({ achievements });
    }
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_achievements')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'award') {
      const { userId, achievementId, siteId } = body;
      
      if (!userId || !achievementId || !siteId) {
        return NextResponse.json({ 
          error: 'User ID, Achievement ID, and Site ID are required' 
        }, { status: 400 });
      }

      const userAchievement = await userProfilesService.awardAchievement(userId, achievementId, siteId);
      return NextResponse.json({ userAchievement }, { status: 201 });
    } else {
      // Create new achievement
      const validatedData = AchievementSchema.parse(body);
      const achievement = await userProfilesService.createAchievement(validatedData);
      return NextResponse.json({ achievement }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating achievement:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
} 