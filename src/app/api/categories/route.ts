import { NextRequest, NextResponse } from 'next/server'
import { categoryTagService } from '../../../lib/services/categories'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      parentId: searchParams.get('parentId') || undefined,
      search: searchParams.get('search') || undefined,
      siteId: searchParams.get('siteId') || undefined,
      includeEmpty: searchParams.get('includeEmpty') === 'true',
    }

    const categories = await categoryTagService.searchCategories(filters)

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const category = await categoryTagService.createCategory(body)

    return NextResponse.json({
      success: true,
      data: category,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 400 }
    )
  }
} 