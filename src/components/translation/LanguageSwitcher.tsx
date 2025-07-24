'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Languages,
  CheckCircle,
  Settings,
  Zap,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  isAvailable: boolean
  translationQuality?: 'native' | 'high' | 'medium' | 'ai'
}

interface LanguageSwitcherProps {
  currentLanguage: string
  availableLanguages?: string[]
  onLanguageChange: (languageCode: string) => void
  showNativeNames?: boolean
  showQualityBadges?: boolean
  variant?: 'default' | 'compact' | 'button'
  className?: string
}

export function LanguageSwitcher({
  currentLanguage = 'en',
  availableLanguages = ['en', 'ar', 'es', 'fr'],
  onLanguageChange,
  showNativeNames = true,
  showQualityBadges = true,
  variant = 'default',
  className
}: LanguageSwitcherProps) {
  const [isTranslating, setIsTranslating] = useState(false)

  const allLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isAvailable: true, translationQuality: 'native' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isAvailable: true, translationQuality: 'high' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isAvailable: true, translationQuality: 'high' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isAvailable: true, translationQuality: 'high' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isAvailable: true, translationQuality: 'high' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isAvailable: true, translationQuality: 'high' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isAvailable: true, translationQuality: 'medium' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isAvailable: true, translationQuality: 'medium' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isAvailable: true, translationQuality: 'high' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isAvailable: true, translationQuality: 'medium' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isAvailable: true, translationQuality: 'high' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', isAvailable: true, translationQuality: 'medium' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', isAvailable: true, translationQuality: 'medium' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isAvailable: true, translationQuality: 'ai' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isAvailable: true, translationQuality: 'ai' }
  ]

  const supportedLanguages = allLanguages.filter(lang => 
    availableLanguages.includes(lang.code)
  )

  const currentLang = allLanguages.find(lang => lang.code === currentLanguage) || allLanguages[0]

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) return
    
    setIsTranslating(true)
    
    try {
      // Simulate translation loading time
      await new Promise(resolve => setTimeout(resolve, 1000))
      onLanguageChange(languageCode)
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const getQualityBadge = (quality: Language['translationQuality']) => {
    switch (quality) {
      case 'native':
        return (
          <Badge variant="default" className="text-xs bg-green-500">
            <CheckCircle className="h-2 w-2 mr-1" />
            Original
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            Professional
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant="outline" className="text-xs">
            Good
          </Badge>
        )
      case 'ai':
        return (
          <Badge variant="outline" className="text-xs">
            <Zap className="h-2 w-2 mr-1" />
            AI
          </Badge>
        )
      default:
        return null
    }
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="text-lg">{currentLang.flag}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isTranslating}>
              {isTranslating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Choose Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {supportedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "flex items-center gap-2",
                  lang.code === currentLanguage && "bg-accent"
                )}
              >
                <span>{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {lang.code === currentLanguage && (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("", className)} disabled={isTranslating}>
            {isTranslating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <>
                <span className="mr-2">{currentLang.flag}</span>
                <Languages className="h-4 w-4 mr-2" />
              </>
            )}
            <span>{currentLang.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Available Languages</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {supportedLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "flex items-center justify-between",
                lang.code === currentLanguage && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <div>
                  <div className="font-medium">{lang.name}</div>
                  {showNativeNames && (
                    <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {showQualityBadges && getQualityBadge(lang.translationQuality)}
                {lang.code === currentLanguage && (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <Settings className="h-4 w-4 mr-2" />
            Language Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <span className="text-lg">{currentLang.flag}</span>
        <div>
          <div className="font-medium text-sm">{currentLang.name}</div>
          {showNativeNames && (
            <div className="text-xs text-muted-foreground">{currentLang.nativeName}</div>
          )}
        </div>
        {showQualityBadges && getQualityBadge(currentLang.translationQuality)}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isTranslating}>
            {isTranslating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Switch Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Currently Selected */}
          <div className="px-2 py-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">CURRENT</div>
            <DropdownMenuItem className="bg-accent">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>{currentLang.flag}</span>
                  <div>
                    <div className="font-medium">{currentLang.name}</div>
                    {showNativeNames && (
                      <div className="text-xs text-muted-foreground">{currentLang.nativeName}</div>
                    )}
                  </div>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </DropdownMenuItem>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Available Languages */}
          <div className="px-2 py-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">AVAILABLE</div>
            {supportedLanguages
              .filter(lang => lang.code !== currentLanguage)
              .map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <div>
                      <div className="font-medium">{lang.name}</div>
                      {showNativeNames && (
                        <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                      )}
                    </div>
                  </div>
                  {showQualityBadges && getQualityBadge(lang.translationQuality)}
                </DropdownMenuItem>
              ))}
          </div>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <Settings className="h-4 w-4 mr-2" />
            Language Preferences
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}