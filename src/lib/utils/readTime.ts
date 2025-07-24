export function calculateReadTime(content: string): number {
  if (!content) return 0
  
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225
  
  // Count words (simple word count)
  const words = content.trim().split(/\s+/).length
  
  // Calculate reading time in minutes
  const readingTime = Math.ceil(words / wordsPerMinute)
  
  return Math.max(1, readingTime) // Minimum 1 minute
}

export function calculateReadTimeFromHTML(htmlContent: string): number {
  if (!htmlContent) return 0
  
  // Remove HTML tags and get text content
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ')
  
  return calculateReadTime(textContent)
} 