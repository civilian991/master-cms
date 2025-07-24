import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { marketingAutomationService } from '@/lib/services/marketing-automation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await marketingAutomationService.getAutomationTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to get automation templates:', error);
    return NextResponse.json(
      { error: 'Failed to get automation templates' },
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
    const template = await marketingAutomationService.createAutomationTemplate(body);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to create automation template:', error);
    return NextResponse.json(
      { error: 'Failed to create automation template' },
      { status: 500 }
    );
  }
} 