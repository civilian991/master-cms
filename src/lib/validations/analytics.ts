// Analytics Validation Schemas
// Note: Using basic validation until Zod is installed

export interface AnalyticsValidation {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  date: Date
}

export interface RevenueAnalyticsValidation {
  revenue: number
  currency: 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD'
  subscriptionRevenue: number
  advertisingRevenue: number
  otherRevenue: number
  date: Date
}

export interface UserAnalyticsValidation {
  userId: string
  pageViews: number
  timeOnSite: number
  articlesRead: number
  lastVisit: Date
}

export interface ContentAnalyticsValidation {
  articleId: string
  views: number
  uniqueViews: number
  timeOnPage: number
  bounceRate: number
  socialShares: number
  date: Date
}

export interface SiteAnalyticsValidation {
  totalRevenue: number
  totalSubscribers: number
  totalArticles: number
  avgEngagement: number
  conversionRate: number
  date: Date
}

// Validation functions
export const validateAnalytics = (data: any): AnalyticsValidation => {
  const required = ['pageViews', 'uniqueVisitors', 'bounceRate', 'avgSessionDuration', 'date']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.pageViews < 0 || data.uniqueVisitors < 0) {
    throw new Error('Page views and unique visitors must be non-negative')
  }
  
  if (data.bounceRate < 0 || data.bounceRate > 1) {
    throw new Error('Bounce rate must be between 0 and 1')
  }
  
  if (data.avgSessionDuration < 0) {
    throw new Error('Average session duration must be non-negative')
  }
  
  return data as AnalyticsValidation
}

export const validateRevenueAnalytics = (data: any): RevenueAnalyticsValidation => {
  const required = ['revenue', 'currency', 'subscriptionRevenue', 'advertisingRevenue', 'otherRevenue', 'date']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.revenue < 0 || data.subscriptionRevenue < 0 || data.advertisingRevenue < 0 || data.otherRevenue < 0) {
    throw new Error('Revenue values must be non-negative')
  }
  
  return data as RevenueAnalyticsValidation
}

export const validateUserAnalytics = (data: any): UserAnalyticsValidation => {
  const required = ['userId', 'pageViews', 'timeOnSite', 'articlesRead', 'lastVisit']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.pageViews < 0 || data.timeOnSite < 0 || data.articlesRead < 0) {
    throw new Error('Analytics values must be non-negative')
  }
  
  return data as UserAnalyticsValidation
}

export const validateContentAnalytics = (data: any): ContentAnalyticsValidation => {
  const required = ['articleId', 'views', 'uniqueViews', 'timeOnPage', 'bounceRate', 'socialShares', 'date']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.views < 0 || data.uniqueViews < 0 || data.timeOnPage < 0 || data.socialShares < 0) {
    throw new Error('Analytics values must be non-negative')
  }
  
  if (data.bounceRate < 0 || data.bounceRate > 1) {
    throw new Error('Bounce rate must be between 0 and 1')
  }
  
  return data as ContentAnalyticsValidation
}

export const validateSiteAnalytics = (data: any): SiteAnalyticsValidation => {
  const required = ['totalRevenue', 'totalSubscribers', 'totalArticles', 'avgEngagement', 'conversionRate', 'date']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.totalRevenue < 0 || data.totalSubscribers < 0 || data.totalArticles < 0) {
    throw new Error('Site analytics values must be non-negative')
  }
  
  if (data.avgEngagement < 0 || data.avgEngagement > 1) {
    throw new Error('Average engagement must be between 0 and 1')
  }
  
  if (data.conversionRate < 0 || data.conversionRate > 1) {
    throw new Error('Conversion rate must be between 0 and 1')
  }
  
  return data as SiteAnalyticsValidation
} 