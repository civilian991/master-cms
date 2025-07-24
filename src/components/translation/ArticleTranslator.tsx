'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Languages, 
  Globe, 
  RefreshCw,
  Copy,
  Download,
  Eye,
  EyeOff,
  Volume2,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TranslationResult {
  id: string
  targetLanguage: string
  translatedTitle: string
  translatedContent: string
  originalLanguage: string
  confidence: number
  quality: 'high' | 'medium' | 'low'
  translatedAt: string
  wordCount: number
  estimatedReadingTime: number
}

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  isSupported: boolean
  aiQuality?: 'excellent' | 'good' | 'fair'
}

interface ArticleTranslatorProps {
  articleId: string
  originalTitle: string
  originalContent: string
  originalLanguage: string
  showBilingualMode?: boolean
  className?: string
}

export function ArticleTranslator({
  articleId,
  originalTitle,
  originalContent,
  originalLanguage = 'en',
  showBilingualMode = true,
  className
}: ArticleTranslatorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [showBilingual, setShowBilingual] = useState(false)
  const [translationHistory, setTranslationHistory] = useState<TranslationResult[]>([])

  const supportedLanguages: Language[] = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isSupported: true, aiQuality: 'excellent' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isSupported: true, aiQuality: 'excellent' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isSupported: true, aiQuality: 'excellent' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isSupported: true, aiQuality: 'excellent' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isSupported: true, aiQuality: 'excellent' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isSupported: true, aiQuality: 'good' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isSupported: true, aiQuality: 'good' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isSupported: true, aiQuality: 'excellent' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isSupported: true, aiQuality: 'good' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isSupported: true, aiQuality: 'excellent' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', isSupported: true, aiQuality: 'good' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', isSupported: true, aiQuality: 'good' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isSupported: true, aiQuality: 'fair' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isSupported: true, aiQuality: 'good' }
  ]

  useEffect(() => {
    loadTranslationHistory()
  }, [articleId])

  const loadTranslationHistory = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockHistory: TranslationResult[] = [
        {
          id: '1',
          targetLanguage: 'ar',
          translatedTitle: 'مستقبل الذكاء الاصطناعي في إنتاج الوسائط',
          translatedContent: '<p>يعيد الذكاء الاصطناعي تشكيل منظر إنتاج الوسائط بسرعة...</p>',
          originalLanguage: 'en',
          confidence: 0.92,
          quality: 'high',
          translatedAt: '2024-01-15T10:30:00Z',
          wordCount: 1250,
          estimatedReadingTime: 8
        },
        {
          id: '2',
          targetLanguage: 'es',
          translatedTitle: 'El Futuro de la IA en la Producción de Medios',
          translatedContent: '<p>La inteligencia artificial está transformando rápidamente el panorama...</p>',
          originalLanguage: 'en',
          confidence: 0.95,
          quality: 'high',
          translatedAt: '2024-01-14T16:20:00Z',
          wordCount: 1180,
          estimatedReadingTime: 7
        }
      ]
      
      setTranslationHistory(mockHistory)
    } catch (error) {
      console.error('Error loading translation history:', error)
    }
  }

  const handleTranslate = async (targetLanguage: string) => {
    setIsTranslating(true)
    setTranslationProgress(0)
    
    try {
      // Simulate translation progress
      const progressInterval = setInterval(() => {
        setTranslationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      // Mock AI translation API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(progressInterval)
      setTranslationProgress(100)
      
      const targetLang = supportedLanguages.find(l => l.code === targetLanguage)
      
      const mockTranslation: TranslationResult = {
        id: Date.now().toString(),
        targetLanguage,
        translatedTitle: targetLanguage === 'ar' 
          ? 'مستقبل الذكاء الاصطناعي في إنتاج الوسائط'
          : targetLanguage === 'es' 
            ? 'El Futuro de la IA en la Producción de Medios'
            : targetLanguage === 'fr'
              ? 'L\'Avenir de l\'IA dans la Production Média'
              : `${originalTitle} (${targetLang?.name})`,
        translatedContent: generateMockTranslatedContent(targetLanguage),
        originalLanguage,
        confidence: 0.89 + Math.random() * 0.1,
        quality: Math.random() > 0.3 ? 'high' : 'medium',
        translatedAt: new Date().toISOString(),
        wordCount: Math.floor(originalContent.length * 0.8 + Math.random() * originalContent.length * 0.4),
        estimatedReadingTime: Math.ceil((originalContent.length / 200) * (0.8 + Math.random() * 0.4))
      }
      
      setTranslation(mockTranslation)
      setTranslationHistory([mockTranslation, ...translationHistory])
      
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
      setTranslationProgress(0)
    }
  }

  const generateMockTranslatedContent = (langCode: string): string => {
    switch (langCode) {
      case 'ar':
        return `
          <h2>مقدمة</h2>
          <p>يعيد الذكاء الاصطناعي تشكيل منظر إنتاج الوسائط بسرعة، مما يحدث ثورة في كيفية إنشاء المحتوى وتوزيعه واستهلاكه. من التحرير التلقائي للفيديو إلى النصوص المولدة بالذكاء الاصطناعي، تعيد التكنولوجيا تشكيل كل جانب من جوانب الصناعة.</p>
          
          <h2>إنشاء المحتوى بالذكاء الاصطناعي</h2>
          <p>يمكن للأنظمة الحديثة للذكاء الاصطناعي الآن إنشاء محتوى فيديو مقنع، وكتابة مقالات جذابة، وحتى تأليف الموسيقى. هذه الأدوات لا تحل محل الإبداع البشري بل تعززه، مما يسمح للمبدعين باستكشاف إمكانيات جديدة وتبسيط سير أعمالهم.</p>
          
          <h3>التحرير التلقائي للفيديو</h3>
          <p>يمكن لأدوات التحرير المدعومة بالذكاء الاصطناعي تحليل ساعات من اللقطات وإنشاء قطع وانتقالات وتأثيرات مقنعة تلقائياً. هذه التكنولوجيا ذات قيمة خاصة للمؤسسات الإخبارية ومنشئي المحتوى الذين يحتاجون إلى إنتاج مقاطع فيديو عالية الجودة بسرعة.</p>
        `
      case 'es':
        return `
          <h2>Introducción</h2>
          <p>La inteligencia artificial está transformando rápidamente el panorama de la producción de medios, revolucionando la forma en que se crea, distribuye y consume el contenido. Desde la edición automática de video hasta los guiones generados por IA, la tecnología está remodelando todos los aspectos de la industria.</p>
          
          <h2>Creación de Contenido Impulsada por IA</h2>
          <p>Los sistemas modernos de IA ahora pueden generar contenido de video convincente, escribir artículos atractivos e incluso componer música. Estas herramientas no están reemplazando la creatividad humana, sino que la están aumentando, permitiendo a los creadores explorar nuevas posibilidades y optimizar sus flujos de trabajo.</p>
          
          <h3>Edición Automática de Video</h3>
          <p>Las herramientas de edición impulsadas por IA pueden analizar horas de metraje y crear automáticamente cortes, transiciones y efectos convincentes. Esta tecnología es particularmente valiosa para organizaciones de noticias y creadores de contenido que necesitan producir videos de alta calidad rápidamente.</p>
        `
      case 'fr':
        return `
          <h2>Introduction</h2>
          <p>L'intelligence artificielle transforme rapidement le paysage de la production médiatique, révolutionnant la façon dont le contenu est créé, distribué et consommé. Du montage vidéo automatisé aux scripts générés par l'IA, la technologie remodèle tous les aspects de l'industrie.</p>
          
          <h2>Création de Contenu Alimentée par l'IA</h2>
          <p>Les systèmes d'IA modernes peuvent maintenant générer du contenu vidéo convaincant, rédiger des articles engageants et même composer de la musique. Ces outils ne remplacent pas la créativité humaine mais l'augmentent, permettant aux créateurs d'explorer de nouvelles possibilités et de rationaliser leurs flux de travail.</p>
          
          <h3>Montage Vidéo Automatisé</h3>
          <p>Les outils de montage alimentés par l'IA peuvent analyser des heures de séquences et créer automatiquement des coupes, des transitions et des effets convaincants. Cette technologie est particulièrement précieuse pour les organisations de presse et les créateurs de contenu qui ont besoin de produire rapidement des vidéos de haute qualité.</p>
        `
      default:
        return `
          <h2>Introduction (Translated)</h2>
          <p>This is a sample translated content in ${langCode.toUpperCase()}. The original article discusses how artificial intelligence is transforming media production workflows across the industry.</p>
        `
    }
  }

  const handleCopyTranslation = async () => {
    if (!translation) return
    
    const fullTranslation = `${translation.translatedTitle}\n\n${translation.translatedContent.replace(/<[^>]*>/g, '')}`
    
    try {
      await navigator.clipboard.writeText(fullTranslation)
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy translation:', error)
    }
  }

  const getQualityColor = (quality: TranslationResult['quality']) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-red-600 bg-red-50'
    }
  }

  const getQualityIcon = (quality: TranslationResult['quality']) => {
    switch (quality) {
      case 'high': return <CheckCircle className="h-3 w-3" />
      case 'medium': return <AlertCircle className="h-3 w-3" />
      case 'low': return <AlertCircle className="h-3 w-3" />
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            AI Translation
          </CardTitle>
          <Badge variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <CardDescription>
          Instantly translate this article into multiple languages with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="translate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="translate">Translate</TabsTrigger>
            <TabsTrigger value="history">History ({translationHistory.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="translate" className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Translate to:</label>
                  <Select onValueChange={setSelectedLanguage} value={selectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                            <span className="text-muted-foreground">({lang.nativeName})</span>
                            {lang.aiQuality && (
                              <Badge variant="outline" className="text-xs ml-auto">
                                {lang.aiQuality}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={() => selectedLanguage && handleTranslate(selectedLanguage)}
                  disabled={!selectedLanguage || isTranslating}
                  className="mt-6"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
              </div>

              {/* Translation Progress */}
              {isTranslating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Translation in progress...</span>
                    <span>{Math.round(translationProgress)}%</span>
                  </div>
                  <Progress value={translationProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    AI is analyzing and translating your content
                  </div>
                </div>
              )}
            </div>

            {/* Translation Result */}
            {translation && !isTranslating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Translation Result</h3>
                    <Badge className={cn("text-xs", getQualityColor(translation.quality))}>
                      {getQualityIcon(translation.quality)}
                      <span className="ml-1 capitalize">{translation.quality} Quality</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {showBilingualMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBilingual(!showBilingual)}
                      >
                        {showBilingual ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showBilingual ? 'Hide' : 'Show'} Bilingual
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={handleCopyTranslation}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Translation Metadata */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">{Math.round(translation.confidence * 100)}%</div>
                    <div className="text-muted-foreground text-xs">Confidence</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">{translation.wordCount}</div>
                    <div className="text-muted-foreground text-xs">Words</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">{translation.estimatedReadingTime}m</div>
                    <div className="text-muted-foreground text-xs">Reading Time</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">
                      {supportedLanguages.find(l => l.code === translation.targetLanguage)?.flag}
                    </div>
                    <div className="text-muted-foreground text-xs">Target Lang</div>
                  </div>
                </div>

                {/* Bilingual View */}
                {showBilingual ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">Original ({originalLanguage.toUpperCase()})</span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <h1 className="text-xl font-bold mb-4">{originalTitle}</h1>
                        <div 
                          dangerouslySetInnerHTML={{ __html: originalContent.substring(0, 500) + '...' }}
                          className="leading-relaxed"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span className="font-medium">
                          Translation ({supportedLanguages.find(l => l.code === translation.targetLanguage)?.name})
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <h1 className="text-xl font-bold mb-4">{translation.translatedTitle}</h1>
                        <div 
                          dangerouslySetInnerHTML={{ __html: translation.translatedContent }}
                          className="leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Translation Only View */
                  (<div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <span className="font-medium">
                        {supportedLanguages.find(l => l.code === translation.targetLanguage)?.name} Translation
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-2xl font-bold mb-6">{translation.translatedTitle}</h1>
                      <div 
                        dangerouslySetInnerHTML={{ __html: translation.translatedContent }}
                        className="leading-relaxed"
                      />
                    </div>
                  </div>)
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Translation History</h4>
              
              {translationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No translations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Your translation history will appear here
                  </p>
                </div>
              ) : (
                translationHistory.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {supportedLanguages.find(l => l.code === item.targetLanguage)?.flag}
                          </span>
                          <div>
                            <div className="font-medium text-sm">
                              {supportedLanguages.find(l => l.code === item.targetLanguage)?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.translatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getQualityColor(item.quality))}>
                            {getQualityIcon(item.quality)}
                            <span className="ml-1 capitalize">{item.quality}</span>
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTranslation(item)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="font-medium text-sm line-clamp-2">
                          {item.translatedTitle}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {item.wordCount} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.estimatedReadingTime}m read
                          </span>
                          <span>{Math.round(item.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}