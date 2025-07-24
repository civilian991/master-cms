'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Headphones, 
  Mic,
  Volume2,
  Download,
  Settings,
  RefreshCw,
  Zap,
  FileAudio,
  Globe,
  Play,
  Pause,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AudioPlayer } from './AudioPlayer'
import { TextToSpeech } from './TextToSpeech'

interface AudioContent {
  id: string
  title: string
  duration: number
  language: string
  voiceType: 'male' | 'female' | 'neutral'
  quality: 'standard' | 'premium' | 'neural'
  audioUrl?: string
  generatedAt: string
  plays: number
  isAvailable: boolean
}

interface AudioContentPanelProps {
  articleId: string
  articleTitle: string
  articleContent: string
  originalLanguage?: string
  className?: string
}

export function AudioContentPanel({
  articleId,
  articleTitle,
  articleContent,
  originalLanguage = 'en',
  className
}: AudioContentPanelProps) {
  const [activeTab, setActiveTab] = useState('player')
  const [availableAudio, setAvailableAudio] = useState<AudioContent[]>([])
  const [currentAudio, setCurrentAudio] = useState<AudioContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  useEffect(() => {
    loadAvailableAudio()
  }, [articleId])

  const loadAvailableAudio = async () => {
    try {
      // Mock API call to load existing audio versions
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockAudioContent: AudioContent[] = [
        {
          id: '1',
          title: `${articleTitle} (Sarah - Neural)`,
          duration: 420, // 7 minutes
          language: 'en',
          voiceType: 'female',
          quality: 'neural',
          audioUrl: '/audio/articles/article-1-1750155660963.mp3',
          generatedAt: '2024-01-15T10:30:00Z',
          plays: 147,
          isAvailable: true
        },
        {
          id: '2',
          title: `${articleTitle} (James - Premium)`,
          duration: 385,
          language: 'en',
          voiceType: 'male',
          quality: 'premium',
          audioUrl: undefined, // Not yet generated
          generatedAt: '2024-01-14T16:20:00Z',
          plays: 89,
          isAvailable: false
        }
      ]
      
      setAvailableAudio(mockAudioContent)
      if (mockAudioContent.length > 0 && mockAudioContent[0].isAvailable) {
        setCurrentAudio(mockAudioContent[0])
      }
    } catch (error) {
      console.error('Error loading audio content:', error)
    }
  }

  const handleAudioGenerated = async (audioUrl: string) => {
    // Create new audio content entry
    const newAudio: AudioContent = {
      id: Date.now().toString(),
      title: `${articleTitle} (AI Generated)`,
      duration: Math.ceil((articleContent.split(/\s+/).length / 150) * 60),
      language: originalLanguage,
      voiceType: 'neutral',
      quality: 'neural',
      audioUrl,
      generatedAt: new Date().toISOString(),
      plays: 0,
      isAvailable: true
    }
    
    setAvailableAudio([newAudio, ...availableAudio])
    setCurrentAudio(newAudio)
    setActiveTab('player')
  }

  const getLanguageInfo = (langCode: string) => {
    const languages: Record<string, { name: string; flag: string }> = {
      'en': { name: 'English', flag: '🇺🇸' },
      'ar': { name: 'Arabic', flag: '🇸🇦' },
      'es': { name: 'Spanish', flag: '🇪🇸' },
      'fr': { name: 'French', flag: '🇫🇷' },
      'de': { name: 'German', flag: '🇩🇪' },
      'zh': { name: 'Chinese', flag: '🇨🇳' },
    }
    return languages[langCode] || { name: langCode.toUpperCase(), flag: '🌐' }
  }

  const getQualityBadge = (quality: AudioContent['quality']) => {
    switch (quality) {
      case 'neural':
        return <Badge className="text-xs bg-purple-500"><Zap className="h-2 w-2 mr-1" />Neural AI</Badge>
      case 'premium':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Premium</Badge>
      case 'standard':
        return <Badge variant="outline" className="text-xs">Standard</Badge>
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const tabItems = [
    {
      id: 'player',
      label: 'Audio Player',
      icon: <Headphones className="h-4 w-4" />,
      description: 'Play and control audio content',
      badge: currentAudio ? 'Ready' : 'No Audio'
    },
    {
      id: 'generate',
      label: 'Generate Audio',
      icon: <Mic className="h-4 w-4" />,
      description: 'Convert text to speech with AI',
      badge: 'AI Powered'
    },
    {
      id: 'library',
      label: 'Audio Library',
      icon: <FileAudio className="h-4 w-4" />,
      description: 'Browse available audio versions',
      badge: `${availableAudio.length} Available`
    }
  ]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Content Suite
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
            {currentAudio && (
              <Badge className="text-xs bg-green-500">
                <FileAudio className="h-3 w-3 mr-1" />
                Audio Ready
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Comprehensive audio experience with AI-powered text-to-speech and audio playback
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex flex-col gap-1 h-auto py-3 px-2"
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
          
          <TabsContent value="player" className="mt-0">
            {currentAudio ? (
              <AudioPlayer
                audioSrc={currentAudio.audioUrl}
                title={currentAudio.title}
                duration={currentAudio.duration}
                autoGenerated={currentAudio.quality === 'neural'}
                language={currentAudio.language}
                voiceType={currentAudio.voiceType}
                onPlay={() => console.log('Audio started playing')}
                onPause={() => console.log('Audio paused')}
                onEnded={() => console.log('Audio finished playing')}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Headphones className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Audio Available</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Generate audio from text or upload an audio file to get started
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setActiveTab('generate')}>
                      <Mic className="h-4 w-4 mr-2" />
                      Generate Audio
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Upload Audio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="generate" className="mt-0">
            <TextToSpeech
              text={articleContent}
              title={articleTitle}
              language={originalLanguage}
              onAudioGenerated={handleAudioGenerated}
              autoGenerate={false}
            />
          </TabsContent>
          
          <TabsContent value="library" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Available Audio Versions</h4>
              <Button variant="outline" size="sm" onClick={loadAvailableAudio}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            
            {availableAudio.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileAudio className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Audio Versions</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Generate your first audio version to build your library
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableAudio.map((audio) => (
                  <Card key={audio.id} className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    currentAudio?.id === audio.id && "ring-2 ring-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">
                            {audio.voiceType === 'male' ? '👨' : 
                             audio.voiceType === 'female' ? '👩' : '🤖'}
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-sm line-clamp-1">
                              {audio.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(audio.duration)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {audio.plays} plays
                              </span>
                              <span className="flex items-center gap-1">
                                {getLanguageInfo(audio.language).flag}
                                {getLanguageInfo(audio.language).name}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getQualityBadge(audio.quality)}
                          
                          {audio.isAvailable ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentAudio(audio)}
                              >
                                {currentAudio?.id === audio.id ? (
                                  <>
                                    <Pause className="h-3 w-3 mr-1" />
                                    Selected
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 mr-1" />
                                    Select
                                  </>
                                )}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="h-2 w-2 mr-1" />
                              Generating...
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Library Statistics */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="text-center p-3 bg-muted/30 rounded">
                <div className="font-bold text-lg">{availableAudio.length}</div>
                <div className="text-xs text-muted-foreground">Audio Versions</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded">
                <div className="font-bold text-lg">
                  {Math.ceil(availableAudio.reduce((sum, a) => sum + a.duration, 0) / 60)}m
                </div>
                <div className="text-xs text-muted-foreground">Total Duration</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded">
                <div className="font-bold text-lg">
                  {availableAudio.reduce((sum, a) => sum + a.plays, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Plays</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded">
                <div className="font-bold text-lg">
                  {new Set(availableAudio.map(a => a.language)).size}
                </div>
                <div className="text-xs text-muted-foreground">Languages</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Quick Actions */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Audio engagement: +15% this week</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-3 w-3 mr-1" />
                Audio Settings
              </Button>
              <Button variant="ghost" size="sm">
                <Globe className="h-3 w-3 mr-1" />
                Language Options
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}