import { z } from 'zod'

// Site Configuration Validation
export const siteConfigurationSchema = z.object({
  seoTitleEn: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescriptionEn: z.string().max(160).optional(),
  seoDescriptionAr: z.string().max(160).optional(),
  seoKeywordsEn: z.string().optional(),
  seoKeywordsAr: z.string().optional(),
  navigationStructure: z.record(z.any()).optional(),
  contentTypes: z.record(z.any()).optional(),
  features: z.record(z.any()).optional(),
})

export const siteBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  logoAltEn: z.string().optional(),
  logoAltAr: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  fontFamily: z.string().optional(),
  customCss: z.string().optional(),
  faviconUrl: z.string().url().optional(),
})

export const sitePermissionSchema = z.object({
  role: z.enum(['USER', 'EDITOR', 'PUBLISHER', 'ADMIN']),
  permissions: z.record(z.any()),
})

// Site Creation/Update Validation
export const siteCreateSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().url(),
  description: z.string().optional(),
  locale: z.enum(['en', 'ar']).default('en'),
  theme: z.string().default('default'),
  branding: z.string().default('default'),
  isActive: z.boolean().default(true),
  configuration: siteConfigurationSchema.optional(),
  siteBranding: siteBrandingSchema.optional(),
})

export const siteUpdateSchema = siteCreateSchema.partial()

// Site Settings Validation
export const siteSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  description: z.string().optional(),
})

export const siteSettingsUpdateSchema = z.record(z.string(), z.string()) 