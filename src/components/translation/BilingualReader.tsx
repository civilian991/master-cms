'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { 
  Languages, 
  Eye, 
  EyeOff,
  RotateCcw,
  Settings,
  Columns,
  AlignLeft,
  RefreshCw,
  Zap,
  Globe,
  BookOpen,
  Volume2,
  Pause,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BilingualContent {
  original: {
    title: string
    content: string
    language: string
  }
  translated: {
    title: string
    content: string
    language: string
    confidence: number
  }
}

interface BilingualReaderProps {
  content: BilingualContent
  onLanguageChange?: (language: string) => void
  showControls?: boolean
  enableAudio?: boolean
  className?: string
}

export function BilingualReader({
  content,
  onLanguageChange,
  showControls = true,
  enableAudio = true,
  className
}: BilingualReaderProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'paragraph' | 'original' | 'translated'>('side-by-side')
  const [fontSize, setFontSize] = useState([16])
  const [lineHeight, setLineHeight] = useState([1.6])
  const [showOriginal, setShowOriginal] = useState(true)
  const [showTranslated, setShowTranslated] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [currentLanguage, setCurrentLanguage] = useState<'original' | 'translated'>('original')

  // Simulate reading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setReadingProgress(prev => {
        const newProgress = prev + Math.random() * 2
        return newProgress > 100 ? 0 : newProgress
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getLanguageInfo = (langCode: string) => {
    const languages: Record<string, { name: string; flag: string; dir: 'ltr' | 'rtl' }> = {
      'en': { name: 'English', flag: '🇺🇸', dir: 'ltr' },
      'ar': { name: 'Arabic', flag: '🇸🇦', dir: 'rtl' },
      'es': { name: 'Spanish', flag: '🇪🇸', dir: 'ltr' },
      'fr': { name: 'French', flag: '🇫🇷', dir: 'ltr' },
      'de': { name: 'German', flag: '🇩🇪', dir: 'ltr' },
      'zh': { name: 'Chinese', flag: '🇨🇳', dir: 'ltr' },
    }
    return languages[langCode] || { name: langCode.toUpperCase(), flag: '🌐', dir: 'ltr' }
  }

  const originalLang = getLanguageInfo(content.original.language)
  const translatedLang = getLanguageInfo(content.translated.language)

  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode)
    if (mode === 'original') {
      setShowOriginal(true)
      setShowTranslated(false)
    } else if (mode === 'translated') {
      setShowOriginal(false)
      setShowTranslated(true)
    } else {
      setShowOriginal(true)
      setShowTranslated(true)
    }
  }

  const renderContent = (text: string, lang: string, isOriginal: boolean = true) => {
    const langInfo = getLanguageInfo(lang)
    const style = {
      fontSize: `${fontSize[0]}px`,
      lineHeight: lineHeight[0],
      direction: langInfo.dir,
      textAlign: langInfo.dir === 'rtl' ? 'right' as const : 'left' as const
    }

    return (
      <div 
        className={cn(
          "prose max-w-none leading-relaxed",
          langInfo.dir === 'rtl' && "prose-rtl"
        )}
        style={style}
        dir={langInfo.dir}
      >
        <div dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    )
  }

  const splitIntoSentences = (html: string): string[] => {
    // Simple sentence splitting - in real implementation, use proper NLP
    const text = html.replace(/<[^>]*>/g, '')
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  const renderParagraphView = () => {
    const originalSentences = splitIntoSentences(content.original.content)
    const translatedSentences = splitIntoSentences(content.translated.content)
    
    const maxLength = Math.max(originalSentences.length, translatedSentences.length)
    
    return (
      <div className="space-y-6">
        {Array.from({ length: maxLength }, (_, i) => (
          <div key={i} className="space-y-3 p-4 bg-muted/30 rounded-lg">
            {originalSentences[i] && showOriginal && (
              <div className="border-l-4 border-blue-400 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{originalLang.flag}</span>
                  <Badge variant="outline" className="text-xs">
                    {originalLang.name}
                  </Badge>
                </div>
                <p 
                  className="leading-relaxed"
                  style={{ 
                    fontSize: `${fontSize[0]}px`, 
                    lineHeight: lineHeight[0],
                    direction: originalLang.dir,
                    textAlign: originalLang.dir === 'rtl' ? 'right' : 'left'
                  }}
                  dir={originalLang.dir}
                >
                  {originalSentences[i]}
                </p>
              </div>
            )}
            
            {translatedSentences[i] && showTranslated && (
              <div className="border-l-4 border-green-400 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{translatedLang.flag}</span>
                  <Badge variant="outline" className="text-xs">
                    {translatedLang.name}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(content.translated.confidence * 100)}% AI
                  </Badge>
                </div>
                <p 
                  className="leading-relaxed"
                  style={{ 
                    fontSize: `${fontSize[0]}px`, 
                    lineHeight: lineHeight[0],
                    direction: translatedLang.dir,
                    textAlign: translatedLang.dir === 'rtl' ? 'right' : 'left'
                  }}
                  dir={translatedLang.dir}
                >
                  {translatedSentences[i]}
                </p>
              </div>
            )}
            
            {enableAudio && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-3 w-3 mr-1" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    Listen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentLanguage(currentLanguage === 'original' ? 'translated' : 'original')}
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    {currentLanguage === 'original' ? originalLang.name : translatedLang.name}
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Sentence {i + 1} of {maxLength}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Bilingual Reader
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Translation: {Math.round(content.translated.confidence * 100)}%
            </Badge>
          </div>
        </div>
        <CardDescription>
          Read in both {originalLang.name} and {translatedLang.name} simultaneously
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Reading Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Reading Progress</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
          <Progress value={readingProgress} className="h-2" />
        </div>

        {showControls && (
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">View Options</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view" className="space-y-4">
              {/* View Mode Controls */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Reading Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('side-by-side')}
                    className="justify-start"
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Side by Side
                  </Button>
                  <Button
                    variant={viewMode === 'paragraph' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('paragraph')}
                    className="justify-start"
                  >
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Paragraph
                  </Button>
                  <Button
                    variant={viewMode === 'original' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('original')}
                    className="justify-start"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Original Only
                  </Button>
                  <Button
                    variant={viewMode === 'translated' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('translated')}
                    className="justify-start"
                  >
                    <Languages className="h-4 w-4 mr-2" />
                    Translation Only
                  </Button>
                </div>
              </div>

              {/* Language Visibility */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Language Visibility</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant={showOriginal ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowOriginal(!showOriginal)}
                  >
                    {showOriginal ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {originalLang.flag} {originalLang.name}
                  </Button>
                  <Button
                    variant={showTranslated ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowTranslated(!showTranslated)}
                  >
                    {showTranslated ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {translatedLang.flag} {translatedLang.name}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="typography" className="space-y-4">
              {/* Typography Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Size: {fontSize[0]}px</label>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    max={24}
                    min={12}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Line Height: {lineHeight[0]}</label>
                  <Slider
                    value={lineHeight}
                    onValueChange={setLineHeight}
                    max={2.0}
                    min={1.2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFontSize([16])
                    setLineHeight([1.6])
                  }}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Typography
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Content Display */}
        <div className="min-h-[400px]">
          {/* Titles */}
          <div className="mb-8 space-y-4">
            {showOriginal && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{originalLang.flag}</span>
                  <Badge variant="outline" className="text-xs">
                    {originalLang.name} - Original
                  </Badge>
                </div>
                <h1 
                  className="text-2xl font-bold leading-tight"
                  style={{ 
                    fontSize: `${Math.max(fontSize[0] + 8, 24)}px`,
                    direction: originalLang.dir,
                    textAlign: originalLang.dir === 'rtl' ? 'right' : 'left'
                  }}
                  dir={originalLang.dir}
                >
                  {content.original.title}
                </h1>
              </div>
            )}
            
            {showTranslated && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{translatedLang.flag}</span>
                  <Badge variant="outline" className="text-xs">
                    {translatedLang.name} - AI Translation
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(content.translated.confidence * 100)}% Confidence
                  </Badge>
                </div>
                <h1 
                  className="text-2xl font-bold leading-tight"
                  style={{ 
                    fontSize: `${Math.max(fontSize[0] + 8, 24)}px`,
                    direction: translatedLang.dir,
                    textAlign: translatedLang.dir === 'rtl' ? 'right' : 'left'
                  }}
                  dir={translatedLang.dir}
                >
                  {content.translated.title}
                </h1>
              </div>
            )}
          </div>

          {/* Content */}
          {viewMode === 'paragraph' ? (
            renderParagraphView()
          ) : viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {showOriginal && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">{originalLang.name} Original</span>
                  </div>
                  {renderContent(content.original.content, content.original.language, true)}
                </div>
              )}
              
              {showTranslated && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Languages className="h-4 w-4" />
                    <span className="font-medium">{translatedLang.name} Translation</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      AI: {Math.round(content.translated.confidence * 100)}%
                    </Badge>
                  </div>
                  {renderContent(content.translated.content, content.translated.language, false)}
                </div>
              )}
            </div>
          ) : viewMode === 'original' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Globe className="h-4 w-4" />
                <span className="font-medium">{originalLang.name} Original</span>
              </div>
              {renderContent(content.original.content, content.original.language, true)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Languages className="h-4 w-4" />
                <span className="font-medium">{translatedLang.name} Translation</span>
                <Badge variant="secondary" className="text-xs ml-auto">
                  AI Confidence: {Math.round(content.translated.confidence * 100)}%
                </Badge>
              </div>
              {renderContent(content.translated.content, content.translated.language, false)}
            </div>
          )}
        </div>

        {/* Audio Controls */}
        {enableAudio && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={isPlaying ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Audio
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play Audio
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentLanguage(currentLanguage === 'original' ? 'translated' : 'original')}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {currentLanguage === 'original' ? `${originalLang.flag} ${originalLang.name}` : `${translatedLang.flag} ${translatedLang.name}`}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Text-to-speech powered by AI
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}