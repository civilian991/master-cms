import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { forumsService, ForumSearchSchema } from '@/lib/services/forums';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchData = {
      query: searchParams.get('query') || '',
      categoryId: searchParams.get('categoryId') || undefined,
      authorId: searchParams.get('authorId') || undefined,
      tags: searchParams.get('tags')?.split(',') || [],
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      siteId: searchParams.get('siteId') || '',
    };

    if (!searchData.query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (!searchData.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const validatedData = ForumSearchSchema.parse(searchData);
    const results = await forumsService.searchForums(validatedData);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching forums:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search forums' },
      { status: 500 }
    );
  }
} 