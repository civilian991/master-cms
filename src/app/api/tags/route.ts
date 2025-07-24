import { NextRequest, NextResponse } from 'next/server'
import { categoryTagService } from '../../../lib/services/categories'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      search: searchParams.get('search') || undefined,
      siteId: searchParams.get('siteId') || undefined,
      includeEmpty: searchParams.get('includeEmpty') === 'true',
    }

    const tags = await categoryTagService.searchTags(filters)

    return NextResponse.json({
      success: true,
      data: tags,
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const tag = await categoryTagService.createTag(body)

    return NextResponse.json({
      success: true,
      data: tag,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 400 }
    )
  }
} 