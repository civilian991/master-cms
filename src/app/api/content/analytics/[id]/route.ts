import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../../lib/services/content.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const analytics = await contentService.getAnalytics(params.id, days)
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    
    await contentService.trackView(params.id, userId)
    
    return NextResponse.json({ message: 'View tracked successfully' })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
} 