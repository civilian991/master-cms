'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Languages, 
  Globe, 
  Settings,
  Zap,
  BookOpen,
  Eye,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ArticleTranslator } from './ArticleTranslator'
import { LanguageSwitcher } from './LanguageSwitcher'
import { BilingualReader } from './BilingualReader'

interface TranslationPanelProps {
  articleId: string
  originalTitle: string
  originalContent: string
  originalLanguage?: string
  availableTranslations?: string[]
  className?: string
}

export function TranslationPanel({
  articleId,
  originalTitle,
  originalContent,
  originalLanguage = 'en',
  availableTranslations = ['en'],
  className
}: TranslationPanelProps) {
  const [activeTab, setActiveTab] = useState('translator')
  const [currentLanguage, setCurrentLanguage] = useState(originalLanguage)
  const [isMinimized, setIsMinimized] = useState(false)
  const [bilingualContent, setBilingualContent] = useState<any>(null)

  const tabItems = [
    {
      id: 'translator',
      label: 'Translator',
      icon: <Languages className="h-4 w-4" />,
      description: 'AI-powered translation to multiple languages',
      badge: 'AI'
    },
    {
      id: 'switcher',
      label: 'Languages',
      icon: <Globe className="h-4 w-4" />,
      description: 'Switch between available languages',
      badge: `${availableTranslations.length} Available`
    },
    {
      id: 'bilingual',
      label: 'Bilingual',
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Read in two languages simultaneously',
      badge: 'Premium'
    }
  ]

  // Mock bilingual content for demo
  const mockBilingualContent = {
    original: {
      title: originalTitle,
      content: originalContent,
      language: originalLanguage
    },
    translated: {
      title: currentLanguage === 'ar' 
        ? 'مستقبل الذكاء الاصطناعي في إنتاج الوسائط'
        : currentLanguage === 'es'
          ? 'El Futuro de la IA en la Producción de Medios'
          : `${originalTitle} (Translated)`,
      content: generateMockTranslatedContent(currentLanguage),
      language: currentLanguage,
      confidence: 0.89
    }
  }

  function generateMockTranslatedContent(langCode: string): string {
    switch (langCode) {
      case 'ar':
        return `
          <h2>مقدمة</h2>
          <p>يعيد الذكاء الاصطناعي تشكيل منظر إنتاج الوسائط بسرعة، مما يحدث ثورة في كيفية إنشاء المحتوى وتوزيعه واستهلاكه. من التحرير التلقائي للفيديو إلى النصوص المولدة بالذكاء الاصطناعي، تعيد التكنولوجيا تشكيل كل جانب من جوانب الصناعة.</p>
          
          <h2>إنشاء المحتوى بالذكاء الاصطناعي</h2>
          <p>يمكن للأنظمة الحديثة للذكاء الاصطناعي الآن إنشاء محتوى فيديو مقنع، وكتابة مقالات جذابة، وحتى تأليف الموسيقى. هذه الأدوات لا تحل محل الإبداع البشري بل تعززه، مما يسمح للمبدعين باستكشاف إمكانيات جديدة وتبسيط سير أعمالهم.</p>
        `
      case 'es':
        return `
          <h2>Introducción</h2>
          <p>La inteligencia artificial está transformando rápidamente el panorama de la producción de medios, revolucionando la forma en que se crea, distribuye y consume el contenido. Desde la edición automática de video hasta los guiones generados por IA, la tecnología está remodelando todos los aspectos de la industria.</p>
          
          <h2>Creación de Contenido Impulsada por IA</h2>
          <p>Los sistemas modernos de IA ahora pueden generar contenido de video convincente, escribir artículos atractivos e incluso componer música. Estas herramientas no están reemplazando la creatividad humana, sino que la están aumentando, permitiendo a los creadores explorar nuevas posibilidades y optimizar sus flujos de trabajo.</p>
        `
      default:
        return originalContent
    }
  }

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language)
    // In a real app, this would trigger content fetching/translation
  }

  if (isMinimized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-5 w-5" />
              Translation
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Current Language Display */}
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {currentLanguage === 'en' ? '🇺🇸' : 
                   currentLanguage === 'ar' ? '🇸🇦' : 
                   currentLanguage === 'es' ? '🇪🇸' : '🌐'}
                </span>
                <span className="text-sm font-medium">
                  {currentLanguage === 'en' ? 'English' : 
                   currentLanguage === 'ar' ? 'Arabic' : 
                   currentLanguage === 'es' ? 'Spanish' : 'Current'}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Original
              </Badge>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              {tabItems.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="flex flex-col gap-1 h-auto py-2"
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMinimized(false)
                  }}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            <CardTitle className="text-base">Translation Suite</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              availableLanguages={availableTranslations}
              onLanguageChange={handleLanguageChange}
              variant="compact"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Advanced translation tools and multilingual reading experience
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex flex-col gap-1 h-auto py-2 px-1"
              >
                <div className="flex items-center gap-1">
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {item.badge}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="translator" className="mt-0">
            <ArticleTranslator
              articleId={articleId}
              originalTitle={originalTitle}
              originalContent={originalContent}
              originalLanguage={originalLanguage}
              showBilingualMode={true}
            />
          </TabsContent>
          
          <TabsContent value="switcher" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Language Selection</CardTitle>
                <CardDescription>
                  Choose your preferred reading language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LanguageSwitcher
                  currentLanguage={currentLanguage}
                  availableLanguages={availableTranslations}
                  onLanguageChange={handleLanguageChange}
                  variant="default"
                  showNativeNames={true}
                  showQualityBadges={true}
                />
                
                {/* Language Statistics */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="font-bold text-lg">{availableTranslations.length}</div>
                    <div className="text-xs text-muted-foreground">Available Languages</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="font-bold text-lg">89%</div>
                    <div className="text-xs text-muted-foreground">Avg Translation Quality</div>
                  </div>
                </div>
                
                {/* Quick Access */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Quick Access</h4>
                  <div className="flex flex-wrap gap-2">
                    {['ar', 'es', 'fr', 'de', 'zh'].map((lang) => (
                      <Button
                        key={lang}
                        variant={currentLanguage === lang ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleLanguageChange(lang)}
                        className="text-xs"
                      >
                        {lang === 'ar' ? '🇸🇦 العربية' :
                         lang === 'es' ? '🇪🇸 Español' :
                         lang === 'fr' ? '🇫🇷 Français' :
                         lang === 'de' ? '🇩🇪 Deutsch' :
                         lang === 'zh' ? '🇨🇳 中文' : lang}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bilingual" className="mt-0">
            <BilingualReader
              content={mockBilingualContent}
              onLanguageChange={handleLanguageChange}
              showControls={true}
              enableAudio={true}
            />
          </TabsContent>
        </Tabs>
        
        {/* Translation Status */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>Currently reading in {
                currentLanguage === 'en' ? 'English' :
                currentLanguage === 'ar' ? 'Arabic' :
                currentLanguage === 'es' ? 'Spanish' : 'Unknown'
              }</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Translation Ready
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}