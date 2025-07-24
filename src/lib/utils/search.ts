export function generateSearchText(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function generateSearchKeywords(text: string): string[] {
  if (!text) return []
  
  const words = generateSearchText(text)
    .split(' ')
    .filter(word => word.length > 2) // Filter out short words
  
  // Remove duplicates
  return [...new Set(words)]
}

export function calculateSearchRelevance(searchText: string, contentText: string): number {
  if (!searchText || !contentText) return 0
  
  const searchWords = generateSearchKeywords(searchText)
  const contentWords = generateSearchKeywords(contentText)
  
  if (searchWords.length === 0) return 0
  
  let matches = 0
  for (const searchWord of searchWords) {
    if (contentWords.includes(searchWord)) {
      matches++
    }
  }
  
  return matches / searchWords.length
} 