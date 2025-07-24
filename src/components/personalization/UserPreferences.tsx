'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Settings, 
  User,
  Bell,
  Globe,
  Zap,
  Clock,
  BookOpen,
  Target,
  Brain,
  Star,
  TrendingUp,
  Shield,
  Save,
  RefreshCw,
  Eye,
  Volume2,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Type,
  Palette,
  Languages
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface UserPreference {
  id: string
  category: string
  subcategory: string
  weight: number
  enabled: boolean
}

interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  digest: 'daily' | 'weekly' | 'monthly' | 'disabled'
  recommendations: boolean
  comments: boolean
  mentions: boolean
}

interface ReadingSettings {
  preferredLength: [number, number] // min, max minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
  languages: string[]
  autoPlay: boolean
  fontSize: number
  theme: 'light' | 'dark' | 'auto'
  readingMode: 'normal' | 'focus' | 'immersive'
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends'
  trackingConsent: boolean
  personalization: boolean
  dataSharing: boolean
  analyticsOptIn: boolean
}

interface UserPreferencesProps {
  userId?: string
  onSettingsChange?: (settings: any) => void
  className?: string
}

export function UserPreferences({
  userId = 'current-user',
  onSettingsChange,
  className
}: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreference[]>([])
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: false,
    inApp: true,
    digest: 'weekly',
    recommendations: true,
    comments: true,
    mentions: true
  })
  const [reading, setReading] = useState<ReadingSettings>({
    preferredLength: [5, 15],
    difficulty: 'mixed',
    languages: ['en'],
    autoPlay: false,
    fontSize: 16,
    theme: 'auto',
    readingMode: 'normal'
  })
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    trackingConsent: true,
    personalization: true,
    dataSharing: false,
    analyticsOptIn: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const categories = [
    { id: 'security', name: 'Cybersecurity', icon: <Shield className="h-4 w-4" />, count: 342 },
    { id: 'ai', name: 'Artificial Intelligence', icon: <Brain className="h-4 w-4" />, count: 189 },
    { id: 'cloud', name: 'Cloud Computing', icon: <Globe className="h-4 w-4" />, count: 223 },
    { id: 'web', name: 'Web Development', icon: <Monitor className="h-4 w-4" />, count: 298 },
    { id: 'mobile', name: 'Mobile Development', icon: <Smartphone className="h-4 w-4" />, count: 167 },
    { id: 'data', name: 'Data Science', icon: <TrendingUp className="h-4 w-4" />, count: 134 }
  ]

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
  ]

  useEffect(() => {
    loadUserPreferences()
  }, [userId])

  const loadUserPreferences = async () => {
    setIsLoading(true)
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockPreferences: UserPreference[] = categories.map(cat => ({
        id: cat.id,
        category: cat.name,
        subcategory: 'General',
        weight: Math.random() * 0.8 + 0.2, // Random weight between 0.2 and 1.0
        enabled: Math.random() > 0.3 // 70% chance of being enabled
      }))
      
      setPreferences(mockPreferences)
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = (id: string, field: keyof UserPreference, value: any) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id ? { ...pref, [field]: value } : pref
    ))
  }

  const handleNotificationChange = (field: keyof NotificationSettings, value: any) => {
    setNotifications(prev => ({ ...prev, [field]: value }))
  }

  const handleReadingChange = (field: keyof ReadingSettings, value: any) => {
    setReading(prev => ({ ...prev, [field]: value }))
  }

  const handlePrivacyChange = (field: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const settings = {
        preferences,
        notifications,
        reading,
        privacy
      }
      
      onSettingsChange?.(settings)
      
      // Show success feedback
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    setNotifications({
      email: true,
      push: false,
      inApp: true,
      digest: 'weekly',
      recommendations: true,
      comments: true,
      mentions: true
    })
    setReading({
      preferredLength: [5, 15],
      difficulty: 'mixed',
      languages: ['en'],
      autoPlay: false,
      fontSize: 16,
      theme: 'auto',
      readingMode: 'normal'
    })
    setPrivacy({
      profileVisibility: 'public',
      trackingConsent: true,
      personalization: true,
      dataSharing: false,
      analyticsOptIn: true
    })
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Preferences
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
        <CardDescription>
          Customize your content experience and account settings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="interests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="interests">
              <Target className="h-3 w-3 mr-1" />
              Interests
            </TabsTrigger>
            <TabsTrigger value="reading">
              <BookOpen className="h-3 w-3 mr-1" />
              Reading
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-3 w-3 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-3 w-3 mr-1" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="interests" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Content Categories</h4>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Personalization
                </Badge>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {preferences.map((pref) => {
                    const category = categories.find(cat => cat.id === pref.id)
                    if (!category) return null
                    
                    return (
                      <Card key={pref.id} className={cn(
                        "transition-all",
                        pref.enabled ? "bg-muted/30" : "opacity-60"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {category.icon}
                                <div>
                                  <div className="font-medium text-sm">{category.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {category.count} articles available
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[60px]">
                                <div className="text-sm font-medium">
                                  {Math.round(pref.weight * 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground">Interest</div>
                              </div>
                              
                              <div className="w-24">
                                <Slider
                                  value={[pref.weight]}
                                  onValueChange={(value) => handlePreferenceChange(pref.id, 'weight', value[0])}
                                  max={1}
                                  min={0}
                                  step={0.1}
                                  disabled={!pref.enabled}
                                />
                              </div>
                              
                              <Switch
                                checked={pref.enabled}
                                onCheckedChange={(checked) => handlePreferenceChange(pref.id, 'enabled', checked)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reading" className="space-y-6">
            {/* Preferred Reading Length */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Preferred Article Length: {reading.preferredLength[0]}-{reading.preferredLength[1]} minutes
              </Label>
              <Slider
                value={reading.preferredLength}
                onValueChange={(value) => handleReadingChange('preferredLength', value as [number, number])}
                max={60}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quick reads (1m)</span>
                <span>Long reads (60m)</span>
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preferred Difficulty</Label>
              <Select 
                value={reading.difficulty}
                onValueChange={(value) => handleReadingChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="mixed">Mixed (All levels)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Languages */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preferred Languages</Label>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang.code}`}
                      checked={reading.languages.includes(lang.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleReadingChange('languages', [...reading.languages, lang.code])
                        } else {
                          handleReadingChange('languages', reading.languages.filter(l => l !== lang.code))
                        }
                      }}
                    />
                    <Label htmlFor={`lang-${lang.code}`} className="flex items-center gap-2 cursor-pointer">
                      <span>{lang.flag}</span>
                      {lang.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Display Settings</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    <span className="text-sm">Font Size: {reading.fontSize}px</span>
                  </div>
                  <div className="w-32">
                    <Slider
                      value={[reading.fontSize]}
                      onValueChange={(value) => handleReadingChange('fontSize', value[0])}
                      max={24}
                      min={12}
                      step={1}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="text-sm">Theme</span>
                  </div>
                  <Select 
                    value={reading.theme}
                    onValueChange={(value) => handleReadingChange('theme', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-3 w-3" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-3 w-3" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          Auto
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Auto-play audio</span>
                  </div>
                  <Switch
                    checked={reading.autoPlay}
                    onCheckedChange={(checked) => handleReadingChange('autoPlay', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Notification Channels</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm">Email notifications</span>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Push notifications</span>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">In-app notifications</span>
                  </div>
                  <Switch
                    checked={notifications.inApp}
                    onCheckedChange={(checked) => handleNotificationChange('inApp', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Notification Types</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">New recommendations</span>
                  </div>
                  <Switch
                    checked={notifications.recommendations}
                    onCheckedChange={(checked) => handleNotificationChange('recommendations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Comments on your activity</span>
                  </div>
                  <Switch
                    checked={notifications.comments}
                    onCheckedChange={(checked) => handleNotificationChange('comments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Mentions and replies</span>
                  </div>
                  <Switch
                    checked={notifications.mentions}
                    onCheckedChange={(checked) => handleNotificationChange('mentions', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Digest Frequency */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Email Digest</Label>
              <Select 
                value={notifications.digest}
                onValueChange={(value) => handleNotificationChange('digest', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                  <SelectItem value="monthly">Monthly digest</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-6">
            {/* Profile Visibility */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Profile Visibility</Label>
              <Select 
                value={privacy.profileVisibility}
                onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can see</SelectItem>
                  <SelectItem value="friends">Friends only</SelectItem>
                  <SelectItem value="private">Private - Only you</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Privacy Controls</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Allow tracking for personalization</div>
                    <div className="text-xs text-muted-foreground">
                      Enables better content recommendations
                    </div>
                  </div>
                  <Switch
                    checked={privacy.trackingConsent}
                    onCheckedChange={(checked) => handlePrivacyChange('trackingConsent', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">AI personalization</div>
                    <div className="text-xs text-muted-foreground">
                      Use AI to customize your experience
                    </div>
                  </div>
                  <Switch
                    checked={privacy.personalization}
                    onCheckedChange={(checked) => handlePrivacyChange('personalization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Share data with partners</div>
                    <div className="text-xs text-muted-foreground">
                      Anonymous data sharing for research
                    </div>
                  </div>
                  <Switch
                    checked={privacy.dataSharing}
                    onCheckedChange={(checked) => handlePrivacyChange('dataSharing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Analytics opt-in</div>
                    <div className="text-xs text-muted-foreground">
                      Help us improve the platform
                    </div>
                  </div>
                  <Switch
                    checked={privacy.analyticsOptIn}
                    onCheckedChange={(checked) => handlePrivacyChange('analyticsOptIn', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}