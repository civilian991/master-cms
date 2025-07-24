import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/config/site';

interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

// Generate sitemap XML
async function generateSitemap(): Promise<string> {
  const config = siteConfig.getConfig();
  const baseUrl = config.domain;
  const entries: SitemapEntry[] = [];

  // Static pages with their priorities and change frequencies
  const staticPages = [
    { url: '/', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/articles', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/search', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  // Add static pages
  staticPages.forEach(page => {
    entries.push({
      url: `${baseUrl}${page.url}`,
      lastModified: new Date().toISOString(),
      changeFrequency: page.changeFrequency,
      priority: page.priority
    });
  });

  try {
    // Fetch articles from the Content Management API
    const articlesResponse = await fetch(`${baseUrl}/api/content/articles?status=PUBLISHED&limit=1000`, {
      cache: 'no-cache'
    });

    if (articlesResponse.ok) {
      const articlesResult = await articlesResponse.json();
      const articles = articlesResult.data?.articles || [];

      articles.forEach((article: any) => {
        entries.push({
          url: `${baseUrl}/articles/${article.slug}`,
          lastModified: article.updatedAt || article.publishedAt,
          changeFrequency: 'weekly',
          priority: 0.8
        });
      });
    }

    // Fetch categories
    const categoriesResponse = await fetch(`${baseUrl}/api/content/categories?limit=100`, {
      cache: 'no-cache'
    });

    if (categoriesResponse.ok) {
      const categoriesResult = await categoriesResponse.json();
      const categories = categoriesResult.data?.categories || [];

      categories.forEach((category: any) => {
        entries.push({
          url: `${baseUrl}/categories/${category.slug}`,
          lastModified: category.updatedAt || new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.7
        });
      });
    }

    // Fetch tags
    const tagsResponse = await fetch(`${baseUrl}/api/content/tags?limit=200`, {
      cache: 'no-cache'
    });

    if (tagsResponse.ok) {
      const tagsResult = await tagsResponse.json();
      const tags = tagsResult.data?.tags || [];

      tags.forEach((tag: any) => {
        entries.push({
          url: `${baseUrl}/tags/${tag.slug}`,
          lastModified: tag.updatedAt || new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.6
        });
      });
    }

    // Fetch authors (if available)
    const authorsResponse = await fetch(`${baseUrl}/api/content/authors?limit=100`, {
      cache: 'no-cache'
    });

    if (authorsResponse.ok) {
      const authorsResult = await authorsResponse.json();
      const authors = authorsResult.data?.authors || [];

      authors.forEach((author: any) => {
        entries.push({
          url: `${baseUrl}/authors/${author.slug || author.id}`,
          lastModified: author.updatedAt || new Date().toISOString(),
          changeFrequency: 'monthly',
          priority: 0.5
        });
      });
    }

  } catch (error) {
    console.error('Error fetching content for sitemap:', error);
    // Continue with static pages even if API calls fail
  }

  // Sort entries by priority (highest first) and then by URL
  entries.sort((a, b) => {
    if (a.priority !== b.priority) {
      return (b.priority || 0) - (a.priority || 0);
    }
    return a.url.localeCompare(b.url);
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

export async function GET(request: NextRequest) {
  try {
    const sitemap = await generateSitemap();
    
    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'CDN-Cache-Control': 'max-age=3600',
        'Vercel-CDN-Cache-Control': 'max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    return new NextResponse('Error generating sitemap', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// Optional: Add robots.txt generation
export async function generateRobotsTxt(): Promise<string> {
  const config = siteConfig.getConfig();
  const baseUrl = config.domain;

  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/

# Allow specific API endpoints that should be crawlable
Allow: /api/og/*

# Crawl delay (optional, adjust based on server capacity)
Crawl-delay: 1

# Specific directives for major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`;
} 