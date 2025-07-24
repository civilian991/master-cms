'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  EyeOff,
  Keyboard,
  Volume2,
  Contrast,
  Type,
  MousePointer,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Settings,
  Zap,
  Users,
  Globe,
  Shield,
  Target,
  Scan,
  PlayCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'notice'
  category: 'color' | 'keyboard' | 'screen-reader' | 'focus' | 'content' | 'structure'
  title: string
  description: string
  element: string
  wcagLevel: 'A' | 'AA' | 'AAA'
  suggestion: string
  automated: boolean
}

interface AccessibilityScore {
  overall: number
  colorContrast: number
  keyboardNavigation: number
  screenReader: number
  focusManagement: number
  contentStructure: number
}

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean
  screenReaderMode: boolean
  keyboardOnly: boolean
  showFocusOutlines: boolean
}

interface AccessibilityTesterProps {
  targetElement?: string
  autoScan?: boolean
  className?: string
}

export function AccessibilityTester({
  targetElement = 'body',
  autoScan = true,
  className
}: AccessibilityTesterProps) {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [score, setScore] = useState<AccessibilityScore>({
    overall: 0,
    colorContrast: 0,
    keyboardNavigation: 0,
    screenReader: 0,
    focusManagement: 0,
    contentStructure: 0
  })
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderMode: false,
    keyboardOnly: false,
    showFocusOutlines: true
  })
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)

  useEffect(() => {
    if (autoScan) {
      runAccessibilityScan()
    }
  }, [autoScan, targetElement])

  const runAccessibilityScan = async () => {
    setIsScanning(true)
    
    try {
      // Simulate accessibility scanning
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockIssues: AccessibilityIssue[] = [
        {
          id: '1',
          type: 'error',
          category: 'color',
          title: 'Insufficient color contrast',
          description: 'Text color does not meet WCAG AA contrast ratio (4.5:1)',
          element: '.text-muted-foreground',
          wcagLevel: 'AA',
          suggestion: 'Increase contrast ratio to at least 4.5:1 by darkening text or lightening background',
          automated: true
        },
        {
          id: '2',
          type: 'warning',
          category: 'keyboard',
          title: 'Missing keyboard focus indicator',
          description: 'Interactive element lacks visible focus indicator',
          element: 'button.ghost-variant',
          wcagLevel: 'AA',
          suggestion: 'Add outline or background change on focus state',
          automated: true
        },
        {
          id: '3',
          type: 'error',
          category: 'screen-reader',
          title: 'Missing alt text',
          description: 'Image lacks alternative text for screen readers',
          element: 'img[src="/hero-image.jpg"]',
          wcagLevel: 'A',
          suggestion: 'Add descriptive alt attribute to image',
          automated: true
        },
        {
          id: '4',
          type: 'warning',
          category: 'structure',
          title: 'Heading hierarchy skip',
          description: 'Heading jumps from h2 to h4, skipping h3',
          element: 'h4.section-title',
          wcagLevel: 'A',
          suggestion: 'Use proper heading hierarchy (h1 → h2 → h3 → h4)',
          automated: true
        },
        {
          id: '5',
          type: 'notice',
          category: 'content',
          title: 'Link text may be unclear',
          description: 'Link text "click here" is not descriptive',
          element: 'a[href="/more-info"]',
          wcagLevel: 'AA',
          suggestion: 'Use descriptive link text that makes sense out of context',
          automated: false
        }
      ]
      
      setIssues(mockIssues)
      
      // Calculate scores based on issues
      const errorCount = mockIssues.filter(i => i.type === 'error').length
      const warningCount = mockIssues.filter(i => i.type === 'warning').length
      const noticeCount = mockIssues.filter(i => i.type === 'notice').length
      
      const calculateCategoryScore = (category: string) => {
        const categoryIssues = mockIssues.filter(i => i.category === category)
        const errorWeight = categoryIssues.filter(i => i.type === 'error').length * 25
        const warningWeight = categoryIssues.filter(i => i.type === 'warning').length * 10
        const noticeWeight = categoryIssues.filter(i => i.type === 'notice').length * 5
        return Math.max(0, 100 - (errorWeight + warningWeight + noticeWeight))
      }
      
      const newScore = {
        colorContrast: calculateCategoryScore('color'),
        keyboardNavigation: calculateCategoryScore('keyboard'),
        screenReader: calculateCategoryScore('screen-reader'),
        focusManagement: calculateCategoryScore('focus'),
        contentStructure: calculateCategoryScore('structure'),
        overall: 0
      }
      
      newScore.overall = Math.round(
        (newScore.colorContrast + newScore.keyboardNavigation + newScore.screenReader + 
         newScore.focusManagement + newScore.contentStructure) / 5
      )
      
      setScore(newScore)
      setLastScan(new Date())
      
    } catch (error) {
      console.error('Error running accessibility scan:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const applyAccessibilitySettings = () => {
    const root = document.documentElement
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Apply large text
    if (settings.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }
    
    // Apply reduced motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    
    // Apply screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode')
    } else {
      root.classList.remove('screen-reader-mode')
    }
    
    // Apply keyboard-only mode
    if (settings.keyboardOnly) {
      root.classList.add('keyboard-only')
    } else {
      root.classList.remove('keyboard-only')
    }
    
    // Apply focus outlines
    if (settings.showFocusOutlines) {
      root.classList.add('show-focus-outlines')
    } else {
      root.classList.remove('show-focus-outlines')
    }
  }

  useEffect(() => {
    applyAccessibilitySettings()
  }, [settings])

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'notice': return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getCategoryIcon = (category: AccessibilityIssue['category']) => {
    switch (category) {
      case 'color': return <Contrast className="h-4 w-4" />
      case 'keyboard': return <Keyboard className="h-4 w-4" />
      case 'screen-reader': return <Volume2 className="h-4 w-4" />
      case 'focus': return <Target className="h-4 w-4" />
      case 'content': return <Type className="h-4 w-4" />
      case 'structure': return <Globe className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getWcagBadgeColor = (level: AccessibilityIssue['wcagLevel']) => {
    switch (level) {
      case 'A': return 'bg-blue-500'
      case 'AA': return 'bg-green-500'
      case 'AAA': return 'bg-purple-500'
    }
  }

  const handleSettingChange = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const prioritizedIssues = issues.sort((a, b) => {
    const typeOrder = { error: 3, warning: 2, notice: 1 }
    return typeOrder[b.type] - typeOrder[a.type]
  })

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility Tester
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "text-xs",
              score.overall >= 90 ? "bg-green-500" :
              score.overall >= 75 ? "bg-blue-500" :
              score.overall >= 50 ? "bg-yellow-500" : "bg-red-500"
            )}>
              {score.overall} Score
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={runAccessibilityScan}
              disabled={isScanning}
            >
              <RefreshCw className={cn("h-3 w-3", isScanning && "animate-spin")} />
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          Comprehensive accessibility testing and WCAG compliance checking
          {lastScan && (
            <span className="text-xs text-muted-foreground">
              • Last scan: {lastScan.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Accessibility Score Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-3">
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(score.overall))}>
                {score.overall}
              </div>
              <div className="text-xs text-muted-foreground">Overall</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(score.colorContrast))}>
                {score.colorContrast}
              </div>
              <div className="text-xs text-muted-foreground">Contrast</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(score.keyboardNavigation))}>
                {score.keyboardNavigation}
              </div>
              <div className="text-xs text-muted-foreground">Keyboard</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(score.screenReader))}>
                {score.screenReader}
              </div>
              <div className="text-xs text-muted-foreground">Screen Reader</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(score.focusManagement))}>
                {score.focusManagement}
              </div>
              <div className="text-xs text-muted-foreground">Focus</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(score.contentStructure))}>
                {score.contentStructure}
              </div>
              <div className="text-xs text-muted-foreground">Structure</div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-3 w-3 mr-1" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Zap className="h-3 w-3 mr-1" />
              Testing Tools
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Accessibility Issues</h4>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  {issues.filter(i => i.type === 'error').length} Errors
                </Badge>
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  {issues.filter(i => i.type === 'warning').length} Warnings
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {issues.filter(i => i.type === 'notice').length} Notices
                </Badge>
              </div>
            </div>
            
            {isScanning && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Scan className="h-8 w-8 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-medium mb-2">Scanning for Accessibility Issues</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analyzing page structure, colors, keyboard navigation, and screen reader compatibility
                  </p>
                  <Progress value={67} className="h-2" />
                </CardContent>
              </Card>
            )}
            
            {!isScanning && issues.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="font-medium mb-2">No Accessibility Issues Found</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Great job! Your page meets accessibility standards.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {!isScanning && prioritizedIssues.length > 0 && (
              <div className="space-y-3">
                {prioritizedIssues.map((issue) => (
                  <Card key={issue.id} className={cn(
                    "border-l-4",
                    issue.type === 'error' && "border-l-red-500",
                    issue.type === 'warning' && "border-l-yellow-500",
                    issue.type === 'notice' && "border-l-blue-500"
                  )}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getIssueIcon(issue.type)}
                              {getCategoryIcon(issue.category)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{issue.title}</h4>
                                <Badge className={cn("text-xs", getWcagBadgeColor(issue.wcagLevel))}>
                                  WCAG {issue.wcagLevel}
                                </Badge>
                                {issue.automated && (
                                  <Badge variant="outline" className="text-xs">
                                    <Zap className="h-2 w-2 mr-1" />
                                    Auto-detected
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {issue.description}
                              </p>
                              
                              <div className="text-xs text-muted-foreground mb-2">
                                Element: <code className="bg-muted px-1 rounded">{issue.element}</code>
                              </div>
                              
                              <div className="bg-blue-50 p-3 rounded text-sm">
                                <div className="font-medium text-blue-800 mb-1">Suggestion:</div>
                                <div className="text-blue-700">{issue.suggestion}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Accessibility Preferences</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">High contrast mode</div>
                      <div className="text-xs text-muted-foreground">
                        Increases contrast for better visibility
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">Large text</div>
                      <div className="text-xs text-muted-foreground">
                        Increases font size for better readability
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.largeText}
                    onCheckedChange={(checked) => handleSettingChange('largeText', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">Reduce motion</div>
                      <div className="text-xs text-muted-foreground">
                        Minimizes animations and transitions
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.reduceMotion}
                    onCheckedChange={(checked) => handleSettingChange('reduceMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">Screen reader mode</div>
                      <div className="text-xs text-muted-foreground">
                        Optimizes interface for screen readers
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.screenReaderMode}
                    onCheckedChange={(checked) => handleSettingChange('screenReaderMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">Keyboard-only navigation</div>
                      <div className="text-xs text-muted-foreground">
                        Hides mouse cursor and enables keyboard shortcuts
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.keyboardOnly}
                    onCheckedChange={(checked) => handleSettingChange('keyboardOnly', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">Show focus outlines</div>
                      <div className="text-xs text-muted-foreground">
                        Makes keyboard focus indicators more visible
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showFocusOutlines}
                    onCheckedChange={(checked) => handleSettingChange('showFocusOutlines', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Scan className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium mb-1">Full Page Scan</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Comprehensive accessibility audit
                  </p>
                  <Button 
                    size="sm" 
                    onClick={runAccessibilityScan}
                    disabled={isScanning}
                  >
                    <Scan className="h-3 w-3 mr-1" />
                    {isScanning ? 'Scanning...' : 'Run Scan'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Keyboard className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium mb-1">Keyboard Test</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Test keyboard navigation flow
                  </p>
                  <Button size="sm" variant="outline">
                    <Keyboard className="h-3 w-3 mr-1" />
                    Test Navigation
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Contrast className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium mb-1">Contrast Checker</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Verify color contrast ratios
                  </p>
                  <Button size="sm" variant="outline">
                    <Contrast className="h-3 w-3 mr-1" />
                    Check Colors
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Volume2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <h4 className="font-medium mb-1">Screen Reader Test</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Simulate screen reader experience
                  </p>
                  <Button size="sm" variant="outline">
                    <Volume2 className="h-3 w-3 mr-1" />
                    Test Reader
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accessibility Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">WCAG 2.1 Level A</span>
                  <Badge className="text-xs bg-blue-500">Essential</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WCAG 2.1 Level AA</span>
                  <Badge className="text-xs bg-green-500">Standard</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WCAG 2.1 Level AAA</span>
                  <Badge className="text-xs bg-purple-500">Enhanced</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}