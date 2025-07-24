import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { abTestingService } from '@/lib/services/ab-testing';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await abTestingService.getABTestTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to get A/B test templates:', error);
    return NextResponse.json(
      { error: 'Failed to get A/B test templates' },
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
    const template = await abTestingService.createABTestTemplate(body);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to create A/B test template:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test template' },
      { status: 500 }
    );
  }
} 