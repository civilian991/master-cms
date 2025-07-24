import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../lib/services/content'

export async function GET(request: NextRequest) {
  try {
    const scheduledArticles = await contentService.getScheduledArticles()

    return NextResponse.json({
      success: true,
      data: scheduledArticles,
    })
  } catch (error) {
    console.error('Error fetching scheduled articles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, scheduledAt } = body
    
    if (!articleId || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'Article ID and scheduled date are required' },
        { status: 400 }
      )
    }

    const article = await contentService.scheduleArticle(articleId, new Date(scheduledAt))

    return NextResponse.json({
      success: true,
      data: article,
    })
  } catch (error) {
    console.error('Error scheduling article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to schedule article' },
      { status: 400 }
    )
  }
} 