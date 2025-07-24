import { NextRequest, NextResponse } from 'next/server'
import { contentService, BulkOperationData } from '../../../../../lib/services/content.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkOperationData = await request.json()
    
    if (!body.articleIds || body.articleIds.length === 0) {
      return NextResponse.json(
        { error: 'Article IDs are required' },
        { status: 400 }
      )
    }

    if (!body.operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      )
    }

    const result = await contentService.bulkOperation({
      ...body,
      userId: session.user.id,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
} 