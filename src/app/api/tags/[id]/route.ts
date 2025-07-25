import { NextRequest, NextResponse } from 'next/server'
import { categoryTagService } from '../../../../lib/services/categories'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tag = await categoryTagService.getTag(params.id)
    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: tag })
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tag' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const tag = await categoryTagService.updateTag(params.id, body)
    return NextResponse.json({ success: true, data: tag })
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await categoryTagService.deleteTag(params.id)
    return NextResponse.json({ success: true, message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
