'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Type, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff,
  Settings,
  BookOpen,
  Maximize,
  Minimize,
  Palette,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadingSettings {
  fontSize: number
  lineHeight: number
  fontFamily: 'serif' | 'sans-serif' | 'mono'
  theme: 'light' | 'dark' | 'sepia' | 'high-contrast'
  focusMode: boolean
  readingMode: boolean
  columnWidth: 'narrow' | 'medium' | 'wide'
}

interface ArticleReaderProps {
  content: string
  title: string
  onReadingProgressUpdate?: (progress: number) => void
  className?: string
}

export function ArticleReader({ 
  content, 
  title, 
  onReadingProgressUpdate,
  className 
}: ArticleReaderProps) {
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'serif',
    theme: 'light',
    focusMode: false,
    readingMode: false,
    columnWidth: 'medium'
  })
  
  const [showSettings, setShowSettings] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [estimatedReadTime, setEstimatedReadTime] = useState(0)

  // Calculate reading time and progress
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '') // Strip HTML tags
    const words = text.split(/\s+/).length
    const avgWordsPerMinute = 200
    setEstimatedReadTime(Math.ceil(words / avgWordsPerMinute))
  }, [content])

  // Track reading progress on scroll
  useEffect(() => {
    const handleScroll = () => {
      const article = document.getElementById('article-content')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const articleHeight = article.scrollHeight
      const viewportHeight = window.innerHeight
      const scrollTop = window.scrollY
      
      const articleTop = scrollTop + rect.top
      const articleBottom = articleTop + articleHeight
      
      if (scrollTop >= articleTop && scrollTop <= articleBottom) {
        const progress = Math.min(100, Math.max(0, 
          ((scrollTop - articleTop) / (articleHeight - viewportHeight)) * 100
        ))
        setReadingProgress(progress)
        onReadingProgressUpdate?.(progress)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onReadingProgressUpdate])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('reading-settings', JSON.stringify(settings))
  }, [settings])

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reading-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse reading settings:', e)
      }
    }
  }, [])

  const updateSetting = <K extends keyof ReadingSettings>(
    key: K, 
    value: ReadingSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings({
      fontSize: 16,
      lineHeight: 1.6,
      fontFamily: 'serif',
      theme: 'light',
      focusMode: false,
      readingMode: false,
      columnWidth: 'medium'
    })
  }

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-900',
    'high-contrast': 'bg-black text-white'
  }

  const fontFamilyClasses = {
    serif: 'font-serif',
    'sans-serif': 'font-sans',
    mono: 'font-mono'
  }

  const columnWidthClasses = {
    narrow: 'max-w-2xl',
    medium: 'max-w-4xl',
    wide: 'max-w-6xl'
  }

  return (
    <div className={cn(
      'relative transition-all duration-300',
      themeClasses[settings.theme],
      settings.readingMode && 'min-h-screen',
      className
    )}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Reading Settings Panel */}
      {showSettings && (
        <div className="fixed top-4 right-4 z-40 w-80">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Reading Settings
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size: {settings.fontSize}px</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting('fontSize', value)}
                  min={12}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line Height: {settings.lineHeight}</Label>
                <Slider
                  value={[settings.lineHeight]}
                  onValueChange={([value]) => updateSetting('lineHeight', value)}
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Family</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['serif', 'sans-serif', 'mono'] as const).map((font) => (
                    <Button
                      key={font}
                      variant={settings.fontFamily === font ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('fontFamily', font)}
                      className="text-xs"
                    >
                      {font === 'sans-serif' ? 'Sans' : font.charAt(0).toUpperCase() + font.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['light', 'dark', 'sepia', 'high-contrast'] as const).map((theme) => (
                    <Button
                      key={theme}
                      variant={settings.theme === theme ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('theme', theme)}
                      className="text-xs flex items-center gap-1"
                    >
                      {theme === 'light' && <Sun className="h-3 w-3" />}
                      {theme === 'dark' && <Moon className="h-3 w-3" />}
                      {theme === 'sepia' && <Palette className="h-3 w-3" />}
                      {theme === 'high-contrast' && <Eye className="h-3 w-3" />}
                      {theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Column Width */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Column Width</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['narrow', 'medium', 'wide'] as const).map((width) => (
                    <Button
                      key={width}
                      variant={settings.columnWidth === width ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('columnWidth', width)}
                      className="text-xs"
                    >
                      {width.charAt(0).toUpperCase() + width.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="focus-mode" className="text-sm font-medium">Focus Mode</Label>
                  <Switch
                    id="focus-mode"
                    checked={settings.focusMode}
                    onCheckedChange={(checked) => updateSetting('focusMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="reading-mode" className="text-sm font-medium">Reading Mode</Label>
                  <Switch
                    id="reading-mode"
                    checked={settings.readingMode}
                    onCheckedChange={(checked) => updateSetting('readingMode', checked)}
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetSettings}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="shadow-lg"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          onClick={() => updateSetting('readingMode', !settings.readingMode)}
          className="shadow-lg"
        >
          {settings.readingMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Reading Stats */}
      <div className="sticky top-4 z-30 flex justify-center mb-6">
        <Card className="px-4 py-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{estimatedReadTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{Math.round(readingProgress)}% complete</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Article Content */}
      <div className={cn(
        'mx-auto px-4 transition-all duration-300',
        columnWidthClasses[settings.columnWidth],
        settings.focusMode && 'filter blur-0 focus-within:filter-none',
        settings.readingMode && 'py-8'
      )}>
        <div
          id="article-content"
          className={cn(
            'prose prose-lg max-w-none transition-all duration-300',
            fontFamilyClasses[settings.fontFamily],
            settings.theme === 'dark' && 'prose-invert',
            settings.theme === 'sepia' && 'prose-amber',
            settings.theme === 'high-contrast' && 'prose-invert contrast-more'
          )}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          <h1 className="mb-8">{title}</h1>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>

      {/* Focus Mode Overlay */}
      {settings.focusMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 pointer-events-none" />
      )}
    </div>
  )
}