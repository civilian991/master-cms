import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { emailMarketingService } from '@/lib/services/email-marketing';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await emailMarketingService.sendCampaign(params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to send email campaign:', error);
    return NextResponse.json(
      { error: 'Failed to send email campaign' },
      { status: 500 }
    );
  }
} 