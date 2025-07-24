import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { forumsService, ForumCategorySchema } from '@/lib/services/forums';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const hierarchical = searchParams.get('hierarchical') === 'true';

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const categories = hierarchical 
      ? await forumsService.getCategoryHierarchy(siteId)
      : await forumsService.getCategories(siteId);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_forums')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ForumCategorySchema.parse(body);

    const category = await forumsService.createCategory(validatedData);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating forum category:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create forum category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_forums')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const category = await forumsService.updateCategory(categoryId, body);

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating forum category:', error);
    return NextResponse.json(
      { error: 'Failed to update forum category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.permissions?.includes('manage_forums')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const success = await forumsService.deleteCategory(categoryId);

    if (success) {
      return NextResponse.json({ message: 'Category deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting forum category:', error);
    return NextResponse.json(
      { error: 'Failed to delete forum category' },
      { status: 500 }
    );
  }
} 