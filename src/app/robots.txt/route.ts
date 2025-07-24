import { NextResponse } from 'next/server'
import { generateRobotsTxt } from '../sitemap.xml/route'

export async function GET() {
  try {
    const robots = await generateRobotsTxt()
    return new NextResponse(robots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    return new NextResponse('Error generating robots.txt', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
