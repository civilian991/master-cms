'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { SiteConfig, siteConfig } from '../../config/site'

interface ConfigurationContextType {
  config: SiteConfig
  updateConfig: (updates: Partial<SiteConfig>) => void
  validateConfig: (config: Partial<SiteConfig>) => { valid: boolean; errors: string[] }
  isLoading: boolean
  error: string | null
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined)

export const useConfiguration = () => {
  const context = useContext(ConfigurationContext)
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider')
  }
  return context
}

interface ConfigurationProviderProps {
  children: React.ReactNode
  initialConfig?: Partial<SiteConfig>
}

export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({
  children,
  initialConfig,
}) => {
  const [config, setConfig] = useState<SiteConfig>(siteConfig.getConfig())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Apply initial configuration if provided
        if (initialConfig) {
          siteConfig.updateConfig(initialConfig)
        }

        // Get the current configuration
        const currentConfig = siteConfig.getConfig()
        setConfig(currentConfig)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration')
        console.error('Configuration loading error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfiguration()
  }, [initialConfig])

  const updateConfig = (updates: Partial<SiteConfig>) => {
    try {
      // Validate the updated configuration
      const validation = siteConfig.validateConfig({ ...config, ...updates })
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
      }

      // Update the configuration
      siteConfig.updateConfig(updates)
      setConfig(siteConfig.getConfig())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration')
      console.error('Configuration update error:', err)
    }
  }

  const validateConfig = (configToValidate: Partial<SiteConfig>) => {
    return siteConfig.validateConfig(configToValidate)
  }

  const value: ConfigurationContextType = {
    config,
    updateConfig,
    validateConfig,
    isLoading,
    error,
  }

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  )
} 