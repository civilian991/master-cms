import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { moderationService, ModerationRuleSchema } from '@/lib/services/moderation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_moderation')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const options = {
      category: searchParams.get('category')?.split(','),
      type: searchParams.get('type')?.split(','),
      isActive: searchParams.get('active') !== 'false',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await moderationService.getModerationRules(siteId, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching moderation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_moderation')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-rule':
        const validatedRuleData = ModerationRuleSchema.parse(body.data);
        const rule = await moderationService.createModerationRule(validatedRuleData);
        return NextResponse.json({ rule }, { status: 201 });

      case 'analyze-content':
        const { content, contentType, metadata } = body;
        if (!content || !contentType) {
          return NextResponse.json({ error: 'Content and content type are required' }, { status: 400 });
        }

        const analysis = await moderationService.analyzeContent(content, contentType, metadata);
        return NextResponse.json({ analysis });

      case 'moderate-content':
        const { targetType, targetId, content: moderateContent, authorId, siteId } = body;
        if (!targetType || !targetId || !moderateContent || !authorId || !siteId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const moderationResult = await moderationService.moderateContent(
          targetType,
          targetId,
          moderateContent,
          authorId,
          siteId
        );
        return NextResponse.json({ result: moderationResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing moderation action:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_moderation')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const rule = await moderationService.updateModerationRule(ruleId, body);

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating moderation rule:', error);
    return NextResponse.json(
      { error: 'Failed to update moderation rule' },
      { status: 500 }
    );
  }
} 