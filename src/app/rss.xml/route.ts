import { NextResponse } from 'next/server'
import { siteConfig } from '@/config/site'

export async function GET() {
  const config = siteConfig.getConfig()
  const baseUrl = config.domain

  try {
    const res = await fetch(`${baseUrl}/api/content/articles?status=PUBLISHED&limit=20&sort=newest`, { cache: 'no-cache' })
    let articles: any[] = []
    if (res.ok) {
      const data = await res.json()
      articles = data.data?.articles || []
    }

    const items = articles.map(article => {
      const url = `${baseUrl}/articles/${article.slug}`
      return `<item><title>${article.title}</title><link>${url}</link><guid>${url}</guid><pubDate>${article.publishedAt || article.updatedAt}</pubDate></item>`
    }).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${config.name}</title><link>${baseUrl}</link><description>${config.description || ''}</description>${items}</channel></rss>`

    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Error generating RSS feed', { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}
