import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { leadGenerationService } from '@/lib/services/lead-generation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const source = searchParams.get('source');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const leads = await leadGenerationService.getLeads(siteId, {
      status: status as any,
      assignedTo: assignedTo || undefined,
      source: source || undefined,
      minScore: minScore ? parseInt(minScore) : undefined,
      maxScore: maxScore ? parseInt(maxScore) : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Failed to get leads:', error);
    return NextResponse.json(
      { error: 'Failed to get leads' },
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
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      website,
      industry,
      companySize,
      budget,
      timeline,
      source,
      sourceDetails,
      siteId,
      assignedTo,
    } = body;

    if (!firstName || !lastName || !email || !siteId) {
      return NextResponse.json(
        { error: 'First name, last name, email, and siteId are required' },
        { status: 400 }
      );
    }

    const lead = await leadGenerationService.createLead({
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      website,
      industry,
      companySize,
      budget,
      timeline,
      source: source || 'website',
      sourceDetails,
      siteId,
      assignedTo,
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Failed to create lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
} 