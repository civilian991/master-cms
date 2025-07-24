// AI and Automation Validation Schemas
// Note: Using basic validation until Zod is installed

export interface AIConfigurationValidation {
  personality: string
  tone: string
  languageStyle: string
  contentLength: string
  seoOptimization: boolean
  autoPublish: boolean
  qualityThreshold: number
}

export interface ContentGenerationValidation {
  prompt: string
  generatedContent: string
  contentType: 'ARTICLE' | 'NEWSLETTER' | 'SOCIAL_POST' | 'EMAIL' | 'ADVERTISEMENT'
  quality: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  metadata?: Record<string, any>
}

export interface AutomationWorkflowValidation {
  name: string
  description?: string
  workflow: Record<string, any>
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ERROR'
  lastRun?: Date
  nextRun?: Date
}

export interface ContentOptimizationValidation {
  articleId: string
  seoScore: number
  readabilityScore: number
  performanceScore: number
  suggestions?: Record<string, any>
  optimizedContent?: string
}

// Validation functions
export const validateAIConfiguration = (data: any): AIConfigurationValidation => {
  const required = ['personality', 'tone', 'languageStyle', 'contentLength', 'seoOptimization', 'autoPublish', 'qualityThreshold']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.qualityThreshold < 0 || data.qualityThreshold > 1) {
    throw new Error('Quality threshold must be between 0 and 1')
  }
  
  const validPersonalities = ['professional', 'casual', 'formal', 'friendly', 'authoritative']
  if (!validPersonalities.includes(data.personality)) {
    throw new Error('Invalid personality type')
  }
  
  const validTones = ['neutral', 'positive', 'negative', 'informative', 'persuasive']
  if (!validTones.includes(data.tone)) {
    throw new Error('Invalid tone type')
  }
  
  const validLanguageStyles = ['modern', 'classic', 'technical', 'conversational', 'academic']
  if (!validLanguageStyles.includes(data.languageStyle)) {
    throw new Error('Invalid language style')
  }
  
  const validContentLengths = ['short', 'medium', 'long', 'extended']
  if (!validContentLengths.includes(data.contentLength)) {
    throw new Error('Invalid content length')
  }
  
  return data as AIConfigurationValidation
}

export const validateContentGeneration = (data: any): ContentGenerationValidation => {
  const required = ['prompt', 'generatedContent', 'contentType', 'quality', 'status']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.prompt.length < 10) {
    throw new Error('Prompt must be at least 10 characters long')
  }
  
  if (data.generatedContent.length < 50) {
    throw new Error('Generated content must be at least 50 characters long')
  }
  
  if (data.quality < 0 || data.quality > 1) {
    throw new Error('Quality must be between 0 and 1')
  }
  
  const validContentTypes = ['ARTICLE', 'NEWSLETTER', 'SOCIAL_POST', 'EMAIL', 'ADVERTISEMENT']
  if (!validContentTypes.includes(data.contentType)) {
    throw new Error('Invalid content type')
  }
  
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']
  if (!validStatuses.includes(data.status)) {
    throw new Error('Invalid status')
  }
  
  return data as ContentGenerationValidation
}

export const validateAutomationWorkflow = (data: any): AutomationWorkflowValidation => {
  const required = ['name', 'workflow', 'status']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.name.length < 3) {
    throw new Error('Workflow name must be at least 3 characters long')
  }
  
  if (typeof data.workflow !== 'object' || data.workflow === null) {
    throw new Error('Workflow must be a valid object')
  }
  
  const validStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR']
  if (!validStatuses.includes(data.status)) {
    throw new Error('Invalid workflow status')
  }
  
  return data as AutomationWorkflowValidation
}

export const validateContentOptimization = (data: any): ContentOptimizationValidation => {
  const required = ['articleId', 'seoScore', 'readabilityScore', 'performanceScore']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.seoScore < 0 || data.seoScore > 100) {
    throw new Error('SEO score must be between 0 and 100')
  }
  
  if (data.readabilityScore < 0 || data.readabilityScore > 100) {
    throw new Error('Readability score must be between 0 and 100')
  }
  
  if (data.performanceScore < 0 || data.performanceScore > 100) {
    throw new Error('Performance score must be between 0 and 100')
  }
  
  return data as ContentOptimizationValidation
} 