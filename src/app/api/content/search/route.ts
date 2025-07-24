import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../lib/services/content.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const siteId = searchParams.get('siteId')
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }
    
    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    const filters = {
      categoryId: searchParams.get('categoryId') || undefined,
      tagIds: searchParams.get('tagIds')?.split(',') || undefined,
      authorId: searchParams.get('authorId') || undefined,
    }

    const articles = await contentService.searchArticles(siteId, query, filters)
    
    return NextResponse.json({ articles, query, total: articles.length })
  } catch (error) {
    console.error('Error searching articles:', error)
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    )
  }
} 