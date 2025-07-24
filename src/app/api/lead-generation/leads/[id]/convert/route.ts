import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { leadGenerationService } from '@/lib/services/lead-generation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dealValue, dealName, dealDescription, assignedTo } = body;

    const result = await leadGenerationService.convertLead(params.id, {
      dealValue,
      dealName,
      dealDescription,
      assignedTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to convert lead:', error);
    return NextResponse.json(
      { error: 'Failed to convert lead' },
      { status: 500 }
    );
  }
} 