import { NextRequest, NextResponse } from 'next/server'
import { mediaService } from '../../../lib/services/media'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse search filters
    const filters = {
      fileType: searchParams.get('fileType')?.split(','),
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(','),
      uploadedBy: searchParams.get('uploadedBy') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      search: searchParams.get('search') || undefined,
      siteId: searchParams.get('siteId') || undefined,
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await mediaService.searchMedia(filters, page, limit)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const fileType = formData.get('fileType') as string
    const fileSize = parseInt(formData.get('fileSize') as string)
    const altTextEn = formData.get('altTextEn') as string
    const altTextAr = formData.get('altTextAr') as string
    const captionEn = formData.get('captionEn') as string
    const captionAr = formData.get('captionAr') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags')?.toString().split(',') || []
    const siteId = formData.get('siteId') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file || !fileName || !fileType || !siteId || !uploadedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fileBuffer = await file.arrayBuffer()
    
    const media = await mediaService.uploadMedia({
      file: Buffer.from(fileBuffer),
      fileName,
      fileType,
      fileSize,
      altTextEn,
      altTextAr,
      captionEn,
      captionAr,
      category,
      tags,
      siteId,
      uploadedBy,
    })

    return NextResponse.json({
      success: true,
      data: media,
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    )
  }
} 