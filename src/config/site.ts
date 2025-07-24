import { z } from 'zod'

// Site Configuration Schema
export const siteConfigSchema = z.object({
  // Basic Site Information
  name: z.string().min(1, 'Site name is required'),
  domain: z.string().url('Valid domain URL is required'),
  description: z.string().optional(),
  locale: z.enum(['en', 'ar']).default('en'),
  
  // Branding Configuration
  branding: z.object({
    logoUrl: z.string().url().optional(),
    logoAltEn: z.string().optional(),
    logoAltAr: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    fontFamily: z.string().optional(),
    customCss: z.string().optional(),
    faviconUrl: z.string().url().optional(),
  }).optional(),
  
  // SEO Configuration
  seo: z.object({
    titleEn: z.string().optional(),
    titleAr: z.string().optional(),
    descriptionEn: z.string().max(160).optional(),
    descriptionAr: z.string().max(160).optional(),
    keywordsEn: z.string().optional(),
    keywordsAr: z.string().optional(),
    ogImage: z.string().url().optional(),
    twitterCard: z.enum(['summary', 'summary_large_image']).optional(),
  }).optional(),
  
  // Navigation Configuration
  navigation: z.object({
    main: z.array(z.string()).default(['home', 'articles', 'about', 'contact']),
    footer: z.array(z.string()).default(['privacy', 'terms', 'sitemap']),
    sidebar: z.array(z.string()).optional(),
  }).optional(),
  
  // Content Type Configuration
  contentTypes: z.object({
    articles: z.boolean().default(true),
    newsletters: z.boolean().default(true),
    magazines: z.boolean().default(false),
    videos: z.boolean().default(false),
    podcasts: z.boolean().default(false),
    events: z.boolean().default(false),
  }).optional(),
  
  // Feature Configuration
  features: z.object({
    ai: z.boolean().default(true),
    analytics: z.boolean().default(true),
    monetization: z.boolean().default(true),
    multilingual: z.boolean().default(true),
    comments: z.boolean().default(false),
    socialSharing: z.boolean().default(true),
    search: z.boolean().default(true),
    rss: z.boolean().default(true),
  }).optional(),
  
  // Performance Configuration
  performance: z.object({
    enableCaching: z.boolean().default(true),
    enableCompression: z.boolean().default(true),
    enableCDN: z.boolean().default(false),
    cacheTTL: z.number().min(0).default(3600),
  }).optional(),
  
  // Security Configuration
  security: z.object({
    enableHttps: z.boolean().default(true),
    enableCSP: z.boolean().default(true),
    enableHSTS: z.boolean().default(true),
    maxLoginAttempts: z.number().min(1).max(10).default(5),
    sessionTimeout: z.number().min(300).default(3600),
  }).optional(),
})

export type SiteConfig = z.infer<typeof siteConfigSchema>

// Default Configuration
export const defaultSiteConfig: SiteConfig = {
  name: 'Master CMS Framework',
  domain: 'http://localhost:3000',
  description: 'AI-Powered CMS Framework for Media Companies',
  locale: 'en',
  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  seo: {
    titleEn: 'Master CMS Framework - AI-Powered Content Management',
    descriptionEn: 'Advanced content management system with AI capabilities',
    twitterCard: 'summary_large_image',
  },
  navigation: {
    main: ['home', 'articles', 'categories', 'tags', 'search', 'about', 'contact'],
    footer: ['privacy', 'terms', 'sitemap'],
    sidebar: ['dashboard', 'profile'],
  },
  contentTypes: {
    articles: true,
    newsletters: true,
    magazines: false,
    videos: false,
    podcasts: false,
    events: false,
  },
  features: {
    ai: true,
    analytics: true,
    monetization: true,
    multilingual: true,
    comments: false,
    socialSharing: true,
    search: true,
    rss: true,
  },
  performance: {
    enableCaching: true,
    enableCompression: true,
    enableCDN: false,
    cacheTTL: 3600,
  },
  security: {
    enableHttps: true,
    enableCSP: true,
    enableHSTS: true,
    maxLoginAttempts: 5,
    sessionTimeout: 3600,
  },
}

// Site Configuration Manager
export class SiteConfigurationManager {
  private static instance: SiteConfigurationManager
  private config: SiteConfig
  private cache: Map<string, any> = new Map()
  private cacheTTL: number = 3600 // 1 hour

  private constructor() {
    this.config = this.loadConfiguration()
  }

  public static getInstance(): SiteConfigurationManager {
    if (!SiteConfigurationManager.instance) {
      SiteConfigurationManager.instance = new SiteConfigurationManager()
    }
    return SiteConfigurationManager.instance
  }

  private loadConfiguration(): SiteConfig {
    try {
      // Load from environment variables
      const envConfig = this.loadFromEnvironment()
      
      // Merge with default configuration
      const mergedConfig = this.mergeConfigurations(defaultSiteConfig, envConfig)
      
      // Validate configuration
      const validatedConfig = siteConfigSchema.parse(mergedConfig)
      
      return validatedConfig
    } catch (error) {
      console.error('Configuration loading error:', error)
      return defaultSiteConfig
    }
  }

  private loadFromEnvironment(): Partial<SiteConfig> {
    const envConfig: Partial<SiteConfig> = {}

    // Basic site information
    if (process.env.SITE_NAME) envConfig.name = process.env.SITE_NAME
    if (process.env.SITE_DOMAIN) envConfig.domain = process.env.SITE_DOMAIN
    if (process.env.SITE_DESCRIPTION) envConfig.description = process.env.SITE_DESCRIPTION
    if (process.env.SITE_LOCALE) envConfig.locale = process.env.SITE_LOCALE as 'en' | 'ar'

    // Branding configuration
    if (process.env.BRANDING_PRIMARY_COLOR) {
      envConfig.branding = {
        ...envConfig.branding,
        primaryColor: process.env.BRANDING_PRIMARY_COLOR,
      }
    }
    if (process.env.BRANDING_SECONDARY_COLOR) {
      envConfig.branding = {
        ...envConfig.branding,
        secondaryColor: process.env.BRANDING_SECONDARY_COLOR,
      }
    }
    if (process.env.BRANDING_ACCENT_COLOR) {
      envConfig.branding = {
        ...envConfig.branding,
        accentColor: process.env.BRANDING_ACCENT_COLOR,
      }
    }
    if (process.env.BRANDING_FONT_FAMILY) {
      envConfig.branding = {
        ...envConfig.branding,
        fontFamily: process.env.BRANDING_FONT_FAMILY,
      }
    }
    if (process.env.BRANDING_LOGO_URL) {
      envConfig.branding = {
        ...envConfig.branding,
        logoUrl: process.env.BRANDING_LOGO_URL,
      }
    }

    // SEO configuration
    if (process.env.SEO_TITLE_EN) {
      envConfig.seo = {
        ...envConfig.seo,
        titleEn: process.env.SEO_TITLE_EN,
      }
    }
    if (process.env.SEO_DESCRIPTION_EN) {
      envConfig.seo = {
        ...envConfig.seo,
        descriptionEn: process.env.SEO_DESCRIPTION_EN,
      }
    }

    // Feature configuration
    if (process.env.FEATURES_AI || process.env.FEATURES_ANALYTICS || process.env.FEATURES_MONETIZATION) {
      envConfig.features = {
        ai: process.env.FEATURES_AI === 'true',
        analytics: process.env.FEATURES_ANALYTICS === 'true',
        monetization: process.env.FEATURES_MONETIZATION === 'true',
        multilingual: true,
        comments: false,
        socialSharing: true,
        search: true,
        rss: true,
      }
    }

    return envConfig
  }

  private mergeConfigurations(defaultConfig: SiteConfig, envConfig: Partial<SiteConfig>): SiteConfig {
    return {
      ...defaultConfig,
      ...envConfig,
      branding: envConfig.branding ? {
        ...defaultConfig.branding,
        ...envConfig.branding,
      } : defaultConfig.branding,
      seo: envConfig.seo ? {
        ...defaultConfig.seo,
        ...envConfig.seo,
      } : defaultConfig.seo,
      navigation: envConfig.navigation ? {
        ...defaultConfig.navigation,
        ...envConfig.navigation,
      } : defaultConfig.navigation,
      contentTypes: envConfig.contentTypes ? {
        ...defaultConfig.contentTypes,
        ...envConfig.contentTypes,
      } : defaultConfig.contentTypes,
      features: envConfig.features ? {
        ...defaultConfig.features,
        ...envConfig.features,
      } : defaultConfig.features,
      performance: envConfig.performance ? {
        ...defaultConfig.performance,
        ...envConfig.performance,
      } : defaultConfig.performance,
      security: envConfig.security ? {
        ...defaultConfig.security,
        ...envConfig.security,
      } : defaultConfig.security,
    }
  }

  public getConfig(): SiteConfig {
    return this.config
  }

  public getConfigValue<T>(key: string, defaultValue?: T): T {
    const cacheKey = `config_${key}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL * 1000) {
      return cached.value
    }

    const value = this.getNestedValue(this.config, key) ?? defaultValue
    this.cache.set(cacheKey, { value, timestamp: Date.now() })
    
    return value
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  public updateConfig(updates: Partial<SiteConfig>): void {
    this.config = this.mergeConfigurations(this.config, updates)
    this.cache.clear() // Clear cache when config changes
  }

  public validateConfig(config: Partial<SiteConfig>): { valid: boolean; errors: string[] } {
    try {
      siteConfigSchema.parse(config)
      return { valid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError
        return {
          valid: false,
          errors: zodError.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`),
        }
      }
      return { valid: false, errors: ['Unknown validation error'] }
    }
  }

  public getEnvironmentConfig(): Record<string, string> {
    const envConfig: Record<string, string> = {}
    
    // Convert config to environment variables format
    if (this.config.name) envConfig.SITE_NAME = this.config.name
    if (this.config.domain) envConfig.SITE_DOMAIN = this.config.domain
    if (this.config.description) envConfig.SITE_DESCRIPTION = this.config.description
    if (this.config.locale) envConfig.SITE_LOCALE = this.config.locale
    
    if (this.config.branding?.primaryColor) {
      envConfig.BRANDING_PRIMARY_COLOR = this.config.branding.primaryColor
    }
    if (this.config.branding?.secondaryColor) {
      envConfig.BRANDING_SECONDARY_COLOR = this.config.branding.secondaryColor
    }
    if (this.config.branding?.accentColor) {
      envConfig.BRANDING_ACCENT_COLOR = this.config.branding.accentColor
    }
    if (this.config.branding?.fontFamily) {
      envConfig.BRANDING_FONT_FAMILY = this.config.branding.fontFamily
    }
    if (this.config.branding?.logoUrl) {
      envConfig.BRANDING_LOGO_URL = this.config.branding.logoUrl
    }
    
    if (this.config.seo?.titleEn) {
      envConfig.SEO_TITLE_EN = this.config.seo.titleEn
    }
    if (this.config.seo?.descriptionEn) {
      envConfig.SEO_DESCRIPTION_EN = this.config.seo.descriptionEn
    }
    
    if (this.config.features?.ai !== undefined) {
      envConfig.FEATURES_AI = this.config.features.ai.toString()
    }
    if (this.config.features?.analytics !== undefined) {
      envConfig.FEATURES_ANALYTICS = this.config.features.analytics.toString()
    }
    if (this.config.features?.monetization !== undefined) {
      envConfig.FEATURES_MONETIZATION = this.config.features.monetization.toString()
    }
    
    return envConfig
  }

  public clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const siteConfig = SiteConfigurationManager.getInstance() 