import { prisma } from '../prisma'

export async function createSlug(title: string, table: string, siteId: string, excludeId?: string): Promise<string> {
  // Convert title to slug
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  // If slug is empty, use a default
  if (!slug) {
    slug = 'untitled'
  }

  // Check if slug already exists
  let counter = 0
  let finalSlug = slug

  while (true) {
    const whereClause: any = {
      slug: finalSlug,
      siteId: siteId
    }

    if (excludeId) {
      whereClause.id = { not: excludeId }
    }

    const existing = await prisma.article.findFirst({
      where: whereClause,
      select: { id: true }
    })

    if (!existing) {
      break
    }

    counter++
    finalSlug = `${slug}-${counter}`
  }

  return finalSlug
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
} 