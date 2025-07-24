import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { 
  siteConfigSchema, 
  defaultSiteConfig, 
  SiteConfigurationManager,
  SiteConfig 
} from '../../config/site'

// Mock environment variables
const mockEnv = {
  SITE_NAME: 'Test Site',
  SITE_DOMAIN: 'https://test.com',
  SITE_DESCRIPTION: 'Test description',
  SITE_LOCALE: 'en',
  BRANDING_PRIMARY_COLOR: '#ff0000',
  BRANDING_SECONDARY_COLOR: '#00ff00',
  BRANDING_ACCENT_COLOR: '#0000ff',
  BRANDING_FONT_FAMILY: 'Arial, sans-serif',
  BRANDING_LOGO_URL: 'https://test.com/logo.png',
  SEO_TITLE_EN: 'Test SEO Title',
  SEO_DESCRIPTION_EN: 'Test SEO description',
  FEATURES_AI: 'true',
  FEATURES_ANALYTICS: 'false',
  FEATURES_MONETIZATION: 'true',
}

describe('Site Configuration System', () => {
  let configManager: SiteConfigurationManager

  beforeEach(() => {
    // Reset environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key]
    })
    
    // Reset singleton instance
    jest.resetModules()
  })

  describe('Configuration Schema Validation', () => {
    it('should validate a complete configuration', () => {
      const validConfig: SiteConfig = {
        name: 'Test Site',
        domain: 'https://test.com',
        description: 'Test description',
        locale: 'en',
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          fontFamily: 'Inter, sans-serif',
        },
        seo: {
          titleEn: 'Test Title',
          descriptionEn: 'Test description',
        },
        navigation: {
          main: ['home', 'about'],
          footer: ['privacy', 'terms'],
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

      const result = siteConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should reject invalid domain URL', () => {
      const invalidConfig = {
        ...defaultSiteConfig,
        domain: 'invalid-url',
      }

      const result = siteConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Valid domain URL is required')
      }
    })

    it('should reject invalid color format', () => {
      const invalidConfig = {
        ...defaultSiteConfig,
        branding: {
          primaryColor: 'invalid-color',
        },
      }

      const result = siteConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    it('should accept valid color format', () => {
      const validConfig = {
        ...defaultSiteConfig,
        branding: {
          primaryColor: '#ff0000',
          secondaryColor: '#00ff00',
          accentColor: '#0000ff',
        },
      }

      const result = siteConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Configuration Manager', () => {
    beforeEach(() => {
      configManager = SiteConfigurationManager.getInstance()
    })

    it('should load default configuration when no environment variables are set', () => {
      const config = configManager.getConfig()
      
      expect(config.name).toBe('Master CMS Framework')
      expect(config.domain).toBe('http://localhost:3000')
      expect(config.locale).toBe('en')
    })

    it('should load configuration from environment variables', () => {
      // Set environment variables
      process.env.SITE_NAME = mockEnv.SITE_NAME
      process.env.SITE_DOMAIN = mockEnv.SITE_DOMAIN
      process.env.SITE_DESCRIPTION = mockEnv.SITE_DESCRIPTION
      process.env.BRANDING_PRIMARY_COLOR = mockEnv.BRANDING_PRIMARY_COLOR

      // Create new instance to load from environment
      const newConfigManager = SiteConfigurationManager.getInstance()
      const config = newConfigManager.getConfig()

      expect(config.name).toBe('Test Site')
      expect(config.domain).toBe('https://test.com')
      expect(config.description).toBe('Test description')
      expect(config.branding?.primaryColor).toBe('#ff0000')
    })

    it('should merge environment configuration with defaults', () => {
      process.env.SITE_NAME = 'Custom Site Name'
      process.env.BRANDING_PRIMARY_COLOR = '#ff0000'

      const newConfigManager = SiteConfigurationManager.getInstance()
      const config = newConfigManager.getConfig()

      expect(config.name).toBe('Custom Site Name')
      expect(config.branding?.primaryColor).toBe('#ff0000')
      expect(config.locale).toBe('en') // Should keep default
      expect(config.domain).toBe('http://localhost:3000') // Should keep default
    })

    it('should validate configuration updates', () => {
      const validUpdate = {
        name: 'Updated Site Name',
        branding: {
          primaryColor: '#00ff00',
        },
      }

      const validation = configManager.validateConfig(validUpdate)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject invalid configuration updates', () => {
      const invalidUpdate = {
        domain: 'invalid-url',
        branding: {
          primaryColor: 'invalid-color',
        },
      }

      const validation = configManager.validateConfig(invalidUpdate)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should update configuration successfully', () => {
      const updates = {
        name: 'Updated Site',
        branding: {
          primaryColor: '#ff0000',
        },
      }

      configManager.updateConfig(updates)
      const config = configManager.getConfig()

      expect(config.name).toBe('Updated Site')
      expect(config.branding?.primaryColor).toBe('#ff0000')
    })

    it('should get nested configuration values', () => {
      const primaryColor = configManager.getConfigValue('branding.primaryColor', '#default')
      expect(primaryColor).toBe('#2563eb') // From default config

      const nonExistentValue = configManager.getConfigValue('non.existent.path', 'default')
      expect(nonExistentValue).toBe('default')
    })

    it('should cache configuration values', () => {
      const value1 = configManager.getConfigValue('name')
      const value2 = configManager.getConfigValue('name')
      
      expect(value1).toBe(value2)
    })

    it('should clear cache when configuration is updated', () => {
      const originalValue = configManager.getConfigValue('name')
      
      configManager.updateConfig({ name: 'New Name' })
      const newValue = configManager.getConfigValue('name')
      
      expect(newValue).toBe('New Name')
      expect(newValue).not.toBe(originalValue)
    })

    it('should generate environment configuration', () => {
      const envConfig = configManager.getEnvironmentConfig()
      
      expect(envConfig.SITE_NAME).toBe('Master CMS Framework')
      expect(envConfig.SITE_DOMAIN).toBe('http://localhost:3000')
      expect(envConfig.SITE_LOCALE).toBe('en')
    })
  })

  describe('Feature Configuration', () => {
    it('should handle boolean feature flags from environment', () => {
      process.env.FEATURES_AI = 'true'
      process.env.FEATURES_ANALYTICS = 'false'
      process.env.FEATURES_MONETIZATION = 'true'

      const newConfigManager = SiteConfigurationManager.getInstance()
      const config = newConfigManager.getConfig()

      expect(config.features?.ai).toBe(true)
      expect(config.features?.analytics).toBe(false)
      expect(config.features?.monetization).toBe(true)
    })

    it('should use default values for missing feature flags', () => {
      const config = configManager.getConfig()

      expect(config.features?.ai).toBe(true)
      expect(config.features?.analytics).toBe(true)
      expect(config.features?.monetization).toBe(true)
      expect(config.features?.comments).toBe(false)
    })
  })

  describe('Branding Configuration', () => {
    it('should load branding from environment variables', () => {
      process.env.BRANDING_PRIMARY_COLOR = '#ff0000'
      process.env.BRANDING_SECONDARY_COLOR = '#00ff00'
      process.env.BRANDING_ACCENT_COLOR = '#0000ff'
      process.env.BRANDING_FONT_FAMILY = 'Arial, sans-serif'
      process.env.BRANDING_LOGO_URL = 'https://test.com/logo.png'

      const newConfigManager = SiteConfigurationManager.getInstance()
      const config = newConfigManager.getConfig()

      expect(config.branding?.primaryColor).toBe('#ff0000')
      expect(config.branding?.secondaryColor).toBe('#00ff00')
      expect(config.branding?.accentColor).toBe('#0000ff')
      expect(config.branding?.fontFamily).toBe('Arial, sans-serif')
      expect(config.branding?.logoUrl).toBe('https://test.com/logo.png')
    })
  })

  describe('SEO Configuration', () => {
    it('should load SEO settings from environment variables', () => {
      process.env.SEO_TITLE_EN = 'Test SEO Title'
      process.env.SEO_DESCRIPTION_EN = 'Test SEO description'

      const newConfigManager = SiteConfigurationManager.getInstance()
      const config = newConfigManager.getConfig()

      expect(config.seo?.titleEn).toBe('Test SEO Title')
      expect(config.seo?.descriptionEn).toBe('Test SEO description')
    })

    it('should validate SEO description length', () => {
      const longDescription = 'A'.repeat(200) // Too long
      const config = {
        ...defaultSiteConfig,
        seo: {
          descriptionEn: longDescription,
        },
      }

      const result = siteConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle configuration loading errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // This should not throw an error
      expect(() => {
        SiteConfigurationManager.getInstance()
      }).not.toThrow()

      consoleSpy.mockRestore()
    })

    it('should return default configuration on validation errors', () => {
      // Set invalid environment variable
      process.env.SITE_DOMAIN = 'invalid-url'

      const newConfigManager = SiteConfigurationManager.getInstance()
      const config = newConfigManager.getConfig()

      // Should fall back to default domain
      expect(config.domain).toBe('http://localhost:3000')
    })
  })
}) 