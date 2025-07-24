'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useConfiguration } from './ConfigurationProvider'

interface BrandingContextType {
  logoUrl: string | null
  logoAlt: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  customCss: string
  faviconUrl: string | null
  updateBranding: (updates: Partial<BrandingContextType>) => void
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export const useBranding = () => {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}

interface BrandingProviderProps {
  children: React.ReactNode
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const { config, updateConfig } = useConfiguration()
  const [customCss, setCustomCss] = useState<string>('')

  const branding = config.branding || {}

  useEffect(() => {
    // Apply custom CSS to document
    if (branding.customCss) {
      setCustomCss(branding.customCss)
    }

    // Apply font family to document
    if (branding.fontFamily) {
      document.documentElement.style.setProperty('--font-family', branding.fontFamily)
    }

    // Apply color variables to document
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor)
    }
    if (branding.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor)
    }
    if (branding.accentColor) {
      document.documentElement.style.setProperty('--accent-color', branding.accentColor)
    }

    // Update favicon
    if (branding.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
      if (link instanceof HTMLLinkElement) {
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = branding.faviconUrl
        document.getElementsByTagName('head')[0].appendChild(link)
      }
    }
  }, [branding])

  const updateBranding = (updates: Partial<BrandingContextType>) => {
    const brandingUpdates: any = {}
    
    if (updates.logoUrl !== undefined) brandingUpdates.logoUrl = updates.logoUrl
    if (updates.logoAlt !== undefined) brandingUpdates.logoAltEn = updates.logoAlt
    if (updates.primaryColor !== undefined) brandingUpdates.primaryColor = updates.primaryColor
    if (updates.secondaryColor !== undefined) brandingUpdates.secondaryColor = updates.secondaryColor
    if (updates.accentColor !== undefined) brandingUpdates.accentColor = updates.accentColor
    if (updates.fontFamily !== undefined) brandingUpdates.fontFamily = updates.fontFamily
    if (updates.customCss !== undefined) brandingUpdates.customCss = updates.customCss
    if (updates.faviconUrl !== undefined) brandingUpdates.faviconUrl = updates.faviconUrl

    updateConfig({
      branding: {
        ...config.branding,
        ...brandingUpdates,
      },
    })
  }

  const value: BrandingContextType = {
    logoUrl: branding.logoUrl || null,
    logoAlt: branding.logoAltEn || 'Site Logo',
    primaryColor: branding.primaryColor || '#2563eb',
    secondaryColor: branding.secondaryColor || '#64748b',
    accentColor: branding.accentColor || '#f59e0b',
    fontFamily: branding.fontFamily || 'Inter, system-ui, sans-serif',
    customCss: customCss,
    faviconUrl: branding.faviconUrl || null,
    updateBranding,
  }

  return (
    <BrandingContext.Provider value={value}>
      {children}
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
    </BrandingContext.Provider>
  )
}

// Dynamic Logo Component
export const DynamicLogo: React.FC<{
  className?: string
  width?: number
  height?: number
  alt?: string
}> = ({ className = '', width = 150, height = 50, alt }) => {
  const { logoUrl, logoAlt } = useBranding()

  if (!logoUrl) {
    return (
      <div 
        className={`text-2xl font-bold ${className}`}
        style={{ color: 'var(--primary-color, #2563eb)' }}
      >
        {logoAlt}
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={alt || logoAlt}
      width={width}
      height={height}
      className={className}
    />
  )
}

// Dynamic Color Scheme Component
export const ColorSchemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { primaryColor, secondaryColor, accentColor } = useBranding()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary-color', primaryColor)
    root.style.setProperty('--secondary-color', secondaryColor)
    root.style.setProperty('--accent-color', accentColor)
  }, [primaryColor, secondaryColor, accentColor])

  return <>{children}</>
}

// Typography Provider Component
export const TypographyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fontFamily } = useBranding()

  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamily)
  }, [fontFamily])

  return <>{children}</>
} 