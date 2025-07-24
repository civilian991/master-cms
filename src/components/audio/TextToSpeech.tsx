'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Square,
  Volume2,
  Download,
  Settings,
  Mic,
  Globe,
  RefreshCw,
  FileAudio,
  Zap,
  Clock,
  Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Voice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'middle' | 'mature'
  accent?: string
  quality: 'standard' | 'premium' | 'neural'
  sample?: string
}

interface TextToSpeechProps {
  text: string
  title?: string
  language?: string
  onAudioGenerated?: (audioUrl: string) => void
  autoGenerate?: boolean
  className?: string
}

export function TextToSpeech({
  text,
  title = "Article Content",
  language = 'en',
  onAudioGenerated,
  autoGenerate = false,
  className
}: TextToSpeechProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [speechRate, setSpeechRate] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [volume, setVolume] = useState([0.8])

  const availableVoices: Voice[] = [
    { id: 'sarah-neural', name: 'Sarah', language: 'en', gender: 'female', age: 'young', quality: 'neural', accent: 'US' },
    { id: 'james-neural', name: 'James', language: 'en', gender: 'male', age: 'middle', quality: 'neural', accent: 'UK' },
    { id: 'emma-premium', name: 'Emma', language: 'en', gender: 'female', age: 'mature', quality: 'premium', accent: 'AU' },
    { id: 'david-standard', name: 'David', language: 'en', gender: 'male', age: 'middle', quality: 'standard', accent: 'US' },
    { id: 'layla-neural', name: 'Layla', language: 'ar', gender: 'female', age: 'young', quality: 'neural' },
    { id: 'omar-premium', name: 'Omar', language: 'ar', gender: 'male', age: 'middle', quality: 'premium' },
    { id: 'sofia-neural', name: 'Sofia', language: 'es', gender: 'female', age: 'young', quality: 'neural', accent: 'ES' },
    { id: 'carlos-premium', name: 'Carlos', language: 'es', gender: 'male', age: 'mature', quality: 'premium', accent: 'MX' },
    { id: 'amelie-neural', name: 'Amelie', language: 'fr', gender: 'female', age: 'young', quality: 'neural' },
    { id: 'marcel-premium', name: 'Marcel', language: 'fr', gender: 'male', age: 'middle', quality: 'premium' }
  ]

  const filteredVoices = availableVoices.filter(voice => 
    voice.language === language || language === 'auto'
  )

  const getLanguageInfo = (langCode: string) => {
    const languages: Record<string, { name: string; flag: string }> = {
      'en': { name: 'English', flag: '🇺🇸' },
      'ar': { name: 'Arabic', flag: '🇸🇦' },
      'es': { name: 'Spanish', flag: '🇪🇸' },
      'fr': { name: 'French', flag: '🇫🇷' },
      'de': { name: 'German', flag: '🇩🇪' },
      'zh': { name: 'Chinese', flag: '🇨🇳' },
      'auto': { name: 'Auto-detect', flag: '🌐' }
    }
    return languages[langCode] || { name: langCode.toUpperCase(), flag: '🌐' }
  }

  const getQualityBadge = (quality: Voice['quality']) => {
    switch (quality) {
      case 'neural':
        return <Badge className="text-xs bg-purple-500"><Zap className="h-2 w-2 mr-1" />Neural</Badge>
      case 'premium':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Premium</Badge>
      case 'standard':
        return <Badge variant="outline" className="text-xs">Standard</Badge>
    }
  }

  const getEstimatedDuration = (text: string): number => {
    // Estimate reading time based on average speaking rate (150 WPM)
    const words = text.split(/\s+/).length
    const baseMinutes = words / 150
    const adjustedMinutes = baseMinutes * (2 - speechRate[0]) // Adjust for speech rate
    return Math.ceil(adjustedMinutes * 60) // Return seconds
  }

  const generateAudio = async () => {
    if (!selectedVoice || !text.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20
        })
      }, 300)

      // Mock API call to TTS service
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(progressInterval)
      setGenerationProgress(100)

      // Mock generated audio URL
      const mockAudioUrl = `https://example.com/tts/audio/${Date.now()}.mp3`
      setAudioUrl(mockAudioUrl)
      onAudioGenerated?.(mockAudioUrl)

      // Reset progress after a delay
      setTimeout(() => {
        setGenerationProgress(0)
      }, 1500)

    } catch (error) {
      console.error('TTS generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate if enabled
  useEffect(() => {
    if (autoGenerate && filteredVoices.length > 0 && !selectedVoice) {
      setSelectedVoice(filteredVoices[0].id)
    }
  }, [autoGenerate, filteredVoices, selectedVoice])

  useEffect(() => {
    if (autoGenerate && selectedVoice && !audioUrl && !isGenerating) {
      generateAudio()
    }
  }, [autoGenerate, selectedVoice, audioUrl, isGenerating])

  const langInfo = getLanguageInfo(language)
  const selectedVoiceInfo = availableVoices.find(v => v.id === selectedVoice)
  const estimatedDuration = getEstimatedDuration(text)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Text-to-Speech
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <span className="mr-1">{langInfo.flag}</span>
              {langInfo.name}
            </Badge>
            {audioUrl && (
              <Badge className="text-xs bg-green-500">
                <Headphones className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Generate natural-sounding audio from text using AI voice synthesis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Audio</TabsTrigger>
            <TabsTrigger value="settings">Voice Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-6">
            {/* Content Preview */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Content to Convert</label>
              <div className="p-4 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                <div className="text-sm leading-relaxed">
                  {text.length > 200 ? `${text.substring(0, 200)}...` : text}
                </div>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                  <span>{text.split(/\s+/).length} words</span>
                  <span>~{Math.ceil(estimatedDuration / 60)}m audio</span>
                  <span>{Math.ceil(text.length / 1000)}KB text</span>
                </div>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Voice</label>
              <Select onValueChange={setSelectedVoice} value={selectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voice for narration" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {filteredVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">
                            {voice.gender === 'male' ? '👨' : voice.gender === 'female' ? '👩' : '🤖'}
                          </div>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {voice.gender} • {voice.age} • {voice.accent || voice.language.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {getQualityBadge(voice.quality)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Generating audio...</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  AI is converting text to speech using {selectedVoiceInfo?.name}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateAudio}
              disabled={!selectedVoice || !text.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                <>
                  <FileAudio className="h-4 w-4 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>

            {/* Success State */}
            {audioUrl && !isGenerating && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-800">
                      Audio generated successfully!
                    </span>
                  </div>
                  <Badge className="text-xs bg-green-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.ceil(estimatedDuration / 60)}m
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Download MP3
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            {/* Speech Controls */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Speech Rate: {speechRate[0]}x</label>
                <Slider
                  value={speechRate}
                  onValueChange={setSpeechRate}
                  max={2.0}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slower (0.5x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Faster (2.0x)</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Pitch: {pitch[0]}</label>
                <Slider
                  value={pitch}
                  onValueChange={setPitch}
                  max={2.0}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lower (0.5)</span>
                  <span>Normal (1.0)</span>
                  <span>Higher (2.0)</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Volume: {Math.round(volume[0] * 100)}%</label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={1.0}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Audio Format Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Output Format</label>
                <Select defaultValue="mp3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3 - Compressed (recommended)</SelectItem>
                    <SelectItem value="wav">WAV - Uncompressed</SelectItem>
                    <SelectItem value="ogg">OGG - Open format</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Audio Quality</label>
                <Select defaultValue="high">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (64 kbps) - Smaller file</SelectItem>
                    <SelectItem value="medium">Medium (128 kbps) - Balanced</SelectItem>
                    <SelectItem value="high">High (256 kbps) - Best quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voice Preview */}
            {selectedVoiceInfo && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Voice Preview</h4>
                  {getQualityBadge(selectedVoiceInfo.quality)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Voice:</span>
                    <span className="font-medium">{selectedVoiceInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gender:</span>
                    <span className="capitalize">{selectedVoiceInfo.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span className="capitalize">{selectedVoiceInfo.age}</span>
                  </div>
                  {selectedVoiceInfo.accent && (
                    <div className="flex justify-between">
                      <span>Accent:</span>
                      <span>{selectedVoiceInfo.accent}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Play className="h-3 w-3 mr-1" />
                  Test Voice
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}