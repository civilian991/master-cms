import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '../../../../../../lib/services/content.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newVersion = await contentService.createVersion(params.id, session.user.id)
    
    return NextResponse.json(newVersion, { status: 201 })
  } catch (error) {
    console.error('Error creating version:', error)
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { versionId } = await request.json()
    
    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      )
    }

    const article = await contentService.rollbackToVersion(params.id, versionId)
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Error rolling back to version:', error)
    return NextResponse.json(
      { error: 'Failed to rollback to version' },
      { status: 500 }
    )
  }
} 