import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { gamificationService, AchievementRuleSchema } from '@/lib/services/gamification';

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

    if (action === 'user-achievements' && userId) {
      // Get user's achievements
      const options = {
        category: searchParams.get('category'),
        isCompleted: searchParams.get('completed') === 'true' ? true : 
                     searchParams.get('completed') === 'false' ? false : undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      const result = await gamificationService.getUserAchievements(userId, siteId, options);
      return NextResponse.json(result);
    }

    if (action === 'rules') {
      // Get achievement rules
      const options = {
        category: searchParams.get('category'),
        type: searchParams.get('type')?.split(','),
        rarity: searchParams.get('rarity')?.split(','),
        isActive: searchParams.get('active') !== 'false',
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      const result = await gamificationService.getAchievementRules(siteId, options);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
    if (!session?.user?.permissions?.includes('manage_gamification')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-rule':
        const validatedRuleData = AchievementRuleSchema.parse(body.data);
        const rule = await gamificationService.createAchievementRule(validatedRuleData);
        return NextResponse.json({ rule }, { status: 201 });

      case 'award-achievement':
        const { userId, achievementId, siteId } = body;
        if (!userId || !achievementId || !siteId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userAchievement = await gamificationService.awardAchievement({
          userId,
          achievementId,
          siteId,
        });
        return NextResponse.json({ userAchievement }, { status: 201 });

      case 'update-progress':
        const { userId: progressUserId, achievementId: progressAchievementId, progress } = body;
        if (!progressUserId || !progressAchievementId || !progress) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedProgress = await gamificationService.updateAchievementProgress(
          progressUserId,
          progressAchievementId,
          progress
        );
        return NextResponse.json({ progress: updatedProgress });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing achievement action:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('already earned') || 
          error.message.includes('maximum earns')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to process achievement action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_gamification')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const achievementId = searchParams.get('achievementId');

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const achievement = await gamificationService.updateAchievementRule(achievementId, body);

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to update achievement' },
      { status: 500 }
    );
  }
} 