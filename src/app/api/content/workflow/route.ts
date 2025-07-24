import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../lib/services/content'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const article = await contentService.updateWorkflow(body)

    return NextResponse.json({
      success: true,
      data: article,
    })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow' },
      { status: 400 }
    )
  }
} 