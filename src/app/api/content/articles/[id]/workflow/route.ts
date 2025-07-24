import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../../../lib/services/content.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { WorkflowState } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workflowState } = await request.json()
    
    if (!workflowState || !Object.values(WorkflowState).includes(workflowState)) {
      return NextResponse.json(
        { error: 'Valid workflow state is required' },
        { status: 400 }
      )
    }

    const article = await contentService.updateWorkflowState(
      params.id,
      workflowState,
      session.user.id
    )
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating workflow state:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow state' },
      { status: 500 }
    )
  }
} 