import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../lib/services/content'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await contentService.bulkOperation(body)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 400 }
    )
  }
} 