'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Ear, 
  Hand, 
  Keyboard, 
  Mic, 
  Volume2, 
  MousePointer2, 
  Zap, 
  Settings, 
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Upload
} from 'lucide-react';

// Import accessibility services
import { mobileAccessibilityService } from '@/lib/services/mobile-accessibility';
import { visualAccessibilityService } from '@/lib/services/visual-accessibility';
import { motorAccessibilityService } from '@/lib/services/motor-accessibility';
import { voiceControlService } from '@/lib/services/voice-control';
import { keyboardNavigationService } from '@/lib/services/keyboard-navigation';

interface AccessibilityProfile {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: any;
}

interface AccessibilityViolation {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  fix?: string;
}

export default function AccessibilitySettings() {
  // State for all accessibility preferences
  const [mobilePrefs, setMobilePrefs] = useState<any>(null);
  const [visualPrefs, setVisualPrefs] = useState<any>(null);
  const [motorPrefs, setMotorPrefs] = useState<any>(null);
  const [voicePrefs, setVoicePrefs] = useState<any>(null);
  const [keyboardPrefs, setKeyboardPrefs] = useState<any>(null);

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  const [testInProgress, setTestInProgress] = useState<string | null>(null);

  // Load all preferences on mount
  useEffect(() => {
    loadAllPreferences();
    runAccessibilityAudit();
  }, []);

  const loadAllPreferences = async () => {
    try {
      setIsLoading(true);
      
      const [mobile, visual, motor, voice, keyboard] = await Promise.all([
        mobileAccessibilityService.getPreferences(),
        visualAccessibilityService.getPreferences(),
        motorAccessibilityService.getPreferences(),
        voiceControlService.getSettings(),
        keyboardNavigationService.getPreferences(),
      ]);

      setMobilePrefs(mobile);
      setVisualPrefs(visual);
      setMotorPrefs(motor);
      setVoicePrefs(voice);
      setKeyboardPrefs(keyboard);
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAccessibilityAudit = async () => {
    const newViolations: AccessibilityViolation[] = [];

    try {
      // Check touch targets
      const motorViolations = motorAccessibilityService.getAccessibilityViolations();
      if (motorViolations.smallTargets.length > 0) {
        newViolations.push({
          type: 'error',
          message: `${motorViolations.smallTargets.length} touch targets are too small`,
          fix: 'Enable larger touch targets in Motor Accessibility settings',
        });
      }

      // Check color contrast
      if (visualPrefs && visualPrefs.contrast.mode === 'normal') {
        newViolations.push({
          type: 'warning',
          message: 'Consider enabling high contrast mode for better visibility',
          fix: 'Enable high contrast in Visual Accessibility settings',
        });
      }

      // Check keyboard navigation
      if (keyboardPrefs && !keyboardPrefs.enabled) {
        newViolations.push({
          type: 'info',
          message: 'Keyboard navigation is disabled',
          fix: 'Enable keyboard navigation for better accessibility',
        });
      }

      setViolations(newViolations);
    } catch (error) {
      console.error('Failed to run accessibility audit:', error);
    }
  };

  const saveAllPreferences = async () => {
    try {
      setIsSaving(true);

      await Promise.all([
        mobileAccessibilityService.savePreferences(mobilePrefs),
        visualAccessibilityService.updatePreferences(visualPrefs),
        motorAccessibilityService.updatePreferences(motorPrefs),
        voiceControlService.updateSettings(voicePrefs),
        keyboardNavigationService.updatePreferences(keyboardPrefs),
      ]);

      // Re-run audit after saving
      await runAccessibilityAudit();
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all accessibility settings to defaults?')) {
      loadAllPreferences();
    }
  };

  const testFeature = async (feature: string) => {
    setTestInProgress(feature);
    
    try {
      switch (feature) {
        case 'voice':
          if (voiceControlService.isSupported()) {
            await voiceControlService.startListening();
            setTimeout(() => voiceControlService.stopListening(), 5000);
          }
          break;
        case 'touch':
          motorAccessibilityService.testGesture('tap');
          break;
        case 'keyboard':
          keyboardNavigationService.showKeyboardHelp();
          break;
        case 'screen-reader':
          mobileAccessibilityService.announce({
            message: 'Screen reader test announcement',
            priority: 'polite',
            category: 'status',
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to test ${feature}:`, error);
    } finally {
      setTimeout(() => setTestInProgress(null), 2000);
    }
  };

  const exportSettings = () => {
    const settings = {
      mobile: mobilePrefs,
      visual: visualPrefs,
      motor: motorPrefs,
      voice: voicePrefs,
      keyboard: keyboardPrefs,
      exported: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        if (settings.mobile) setMobilePrefs(settings.mobile);
        if (settings.visual) setVisualPrefs(settings.visual);
        if (settings.motor) setMotorPrefs(settings.motor);
        if (settings.voice) setVoicePrefs(settings.voice);
        if (settings.keyboard) setKeyboardPrefs(settings.keyboard);
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  // Predefined accessibility profiles
  const accessibilityProfiles: AccessibilityProfile[] = [
    {
      id: 'vision-impaired',
      name: 'Vision Impaired',
      description: 'High contrast, large text, screen reader optimized',
      icon: <Eye className="h-5 w-5" />,
      settings: {
        visual: {
          fontSize: { scale: 1.5, minSize: 18 },
          contrast: { mode: 'high' },
          animations: { reducedMotion: true },
        },
        mobile: {
          screenReader: { enabled: true, verbosityLevel: 'verbose' },
        },
      },
    },
    {
      id: 'motor-impaired',
      name: 'Motor Impaired',
      description: 'Larger touch targets, gesture assistance, dwell click',
      icon: <Hand className="h-5 w-5" />,
      settings: {
        motor: {
          touchTargets: { minimumSize: 60, enlargeAll: true },
          clickAssistance: { dwellClick: true, dwellTime: 1500 },
          gestureAssistance: { extendedTimeout: 3000 },
        },
      },
    },
    {
      id: 'hearing-impaired',
      name: 'Hearing Impaired',
      description: 'Visual notifications, vibration feedback',
      icon: <Ear className="h-5 w-5" />,
      settings: {
        mobile: {
          visualAids: { focusIndicators: true },
        },
      },
    },
    {
      id: 'cognitive-assistance',
      name: 'Cognitive Assistance',
      description: 'Simplified interface, reduced animations, clear navigation',
      icon: <Zap className="h-5 w-5" />,
      settings: {
        visual: {
          animations: { reducedMotion: true, disableAutoplay: true },
          spacing: { paragraphSpacing: 1.5 },
        },
        keyboard: {
          skipLinks: true,
          customShortcuts: true,
        },
      },
    },
  ];

  const applyProfile = (profile: AccessibilityProfile) => {
    if (profile.settings.mobile) {
      setMobilePrefs({ ...mobilePrefs, ...profile.settings.mobile });
    }
    if (profile.settings.visual) {
      setVisualPrefs({ ...visualPrefs, ...profile.settings.visual });
    }
    if (profile.settings.motor) {
      setMotorPrefs({ ...motorPrefs, ...profile.settings.motor });
    }
    if (profile.settings.voice) {
      setVoicePrefs({ ...voicePrefs, ...profile.settings.voice });
    }
    if (profile.settings.keyboard) {
      setKeyboardPrefs({ ...keyboardPrefs, ...profile.settings.keyboard });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading accessibility settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Settings</h1>
          <p className="text-gray-600 mt-2">
            Customize your experience with comprehensive accessibility features
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <Button onClick={saveAllPreferences} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Accessibility Audit Results */}
      {violations.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Accessibility Audit Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.map((violation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded border">
                  <Badge variant={violation.type === 'error' ? 'destructive' : 
                                violation.type === 'warning' ? 'secondary' : 'default'}>
                    {violation.type}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">{violation.message}</p>
                    {violation.fix && (
                      <p className="text-sm text-gray-600 mt-1">{violation.fix}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="motor">Motor</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="keyboard">Keyboard</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Profiles</CardTitle>
              <CardDescription>
                Choose a pre-configured accessibility profile that matches your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accessibilityProfiles.map((profile) => (
                  <Card key={profile.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => applyProfile(profile)}>
                    <CardContent className="p-4 text-center">
                      <div className="mb-3 text-blue-600">
                        {profile.icon}
                      </div>
                      <h3 className="font-semibold mb-2">{profile.name}</h3>
                      <p className="text-sm text-gray-600">{profile.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Testing</CardTitle>
              <CardDescription>
                Test accessibility features to ensure they work properly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => testFeature('voice')}
                  disabled={testInProgress === 'voice'}
                  className="h-20 flex-col"
                >
                  {testInProgress === 'voice' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <Mic className="h-6 w-6 mb-2" />
                  )}
                  Test Voice
                </Button>

                <Button
                  variant="outline"
                  onClick={() => testFeature('touch')}
                  disabled={testInProgress === 'touch'}
                  className="h-20 flex-col"
                >
                  {testInProgress === 'touch' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <MousePointer2 className="h-6 w-6 mb-2" />
                  )}
                  Test Touch
                </Button>

                <Button
                  variant="outline"
                  onClick={() => testFeature('keyboard')}
                  disabled={testInProgress === 'keyboard'}
                  className="h-20 flex-col"
                >
                  {testInProgress === 'keyboard' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <Keyboard className="h-6 w-6 mb-2" />
                  )}
                  Test Keyboard
                </Button>

                <Button
                  variant="outline"
                  onClick={() => testFeature('screen-reader')}
                  disabled={testInProgress === 'screen-reader'}
                  className="h-20 flex-col"
                >
                  {testInProgress === 'screen-reader' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <Volume2 className="h-6 w-6 mb-2" />
                  )}
                  Test Reader
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {mobilePrefs?.screenReader?.enabled ? '✓' : '✗'}
                  </div>
                  <p className="text-sm">Screen Reader</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {visualPrefs?.contrast?.mode !== 'normal' ? '✓' : '✗'}
                  </div>
                  <p className="text-sm">High Contrast</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {motorPrefs?.touchTargets?.enlargeAll ? '✓' : '✗'}
                  </div>
                  <p className="text-sm">Large Targets</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {voicePrefs?.enabled ? '✓' : '✗'}
                  </div>
                  <p className="text-sm">Voice Control</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {keyboardPrefs?.enabled ? '✓' : '✗'}
                  </div>
                  <p className="text-sm">Keyboard Nav</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Tab */}
        <TabsContent value="visual" className="space-y-6">
          {visualPrefs && (
            <>
              {/* Font Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Font & Text Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Font Size Scale: {Math.round(visualPrefs.fontSize.scale * 100)}%
                    </label>
                    <Slider
                      value={[visualPrefs.fontSize.scale]}
                      onValueChange={([value]) => 
                        setVisualPrefs({
                          ...visualPrefs,
                          fontSize: { ...visualPrefs.fontSize, scale: value }
                        })
                      }
                      min={0.8}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Line Height: {visualPrefs.fontSize.lineHeight}
                    </label>
                    <Slider
                      value={[visualPrefs.fontSize.lineHeight]}
                      onValueChange={([value]) => 
                        setVisualPrefs({
                          ...visualPrefs,
                          fontSize: { ...visualPrefs.fontSize, lineHeight: value }
                        })
                      }
                      min={1.0}
                      max={2.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Text Spacing</label>
                    <Select
                      value={visualPrefs.spacing.letterSpacing.toString()}
                      onValueChange={(value) =>
                        setVisualPrefs({
                          ...visualPrefs,
                          spacing: { ...visualPrefs.spacing, letterSpacing: parseFloat(value) }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Normal</SelectItem>
                        <SelectItem value="0.05">Relaxed</SelectItem>
                        <SelectItem value="0.1">Loose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contrast Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Contrast & Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contrast Mode</label>
                    <Select
                      value={visualPrefs.contrast.mode}
                      onValueChange={(value) =>
                        setVisualPrefs({
                          ...visualPrefs,
                          contrast: { ...visualPrefs.contrast, mode: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High Contrast</SelectItem>
                        <SelectItem value="extra-high">Extra High Contrast</SelectItem>
                        <SelectItem value="inverted">Inverted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Color Blindness Support</label>
                    <Select
                      value={visualPrefs.colorBlindness.mode}
                      onValueChange={(value) =>
                        setVisualPrefs({
                          ...visualPrefs,
                          colorBlindness: { ...visualPrefs.colorBlindness, mode: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                        <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                        <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                        <SelectItem value="achromatopsia">Achromatopsia (Complete)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Animation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Animation & Motion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reduced-motion" className="text-sm font-medium">
                      Reduce Motion
                    </label>
                    <Switch
                      id="reduced-motion"
                      checked={visualPrefs.animations.reducedMotion}
                      onCheckedChange={(checked) =>
                        setVisualPrefs({
                          ...visualPrefs,
                          animations: { ...visualPrefs.animations, reducedMotion: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="disable-autoplay" className="text-sm font-medium">
                      Disable Autoplay
                    </label>
                    <Switch
                      id="disable-autoplay"
                      checked={visualPrefs.animations.disableAutoplay}
                      onCheckedChange={(checked) =>
                        setVisualPrefs({
                          ...visualPrefs,
                          animations: { ...visualPrefs.animations, disableAutoplay: checked }
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Motor Tab */}
        <TabsContent value="motor" className="space-y-6">
          {motorPrefs && (
            <>
              {/* Touch Target Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Touch Targets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Minimum Size: {motorPrefs.touchTargets.minimumSize}px
                    </label>
                    <Slider
                      value={[motorPrefs.touchTargets.minimumSize]}
                      onValueChange={([value]) =>
                        setMotorPrefs({
                          ...motorPrefs,
                          touchTargets: { ...motorPrefs.touchTargets, minimumSize: value }
                        })
                      }
                      min={32}
                      max={80}
                      step={4}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="enlarge-all" className="text-sm font-medium">
                      Enlarge All Touch Targets
                    </label>
                    <Switch
                      id="enlarge-all"
                      checked={motorPrefs.touchTargets.enlargeAll}
                      onCheckedChange={(checked) =>
                        setMotorPrefs({
                          ...motorPrefs,
                          touchTargets: { ...motorPrefs.touchTargets, enlargeAll: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="show-hit-areas" className="text-sm font-medium">
                      Show Hit Areas
                    </label>
                    <Switch
                      id="show-hit-areas"
                      checked={motorPrefs.touchTargets.showHitAreas}
                      onCheckedChange={(checked) =>
                        setMotorPrefs({
                          ...motorPrefs,
                          touchTargets: { ...motorPrefs.touchTargets, showHitAreas: checked }
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Click Assistance */}
              <Card>
                <CardHeader>
                  <CardTitle>Click Assistance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dwell-click" className="text-sm font-medium">
                      Dwell Click
                    </label>
                    <Switch
                      id="dwell-click"
                      checked={motorPrefs.clickAssistance.dwellClick}
                      onCheckedChange={(checked) =>
                        setMotorPrefs({
                          ...motorPrefs,
                          clickAssistance: { ...motorPrefs.clickAssistance, dwellClick: checked }
                        })
                      }
                    />
                  </div>

                  {motorPrefs.clickAssistance.dwellClick && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Dwell Time: {motorPrefs.clickAssistance.dwellTime}ms
                      </label>
                      <Slider
                        value={[motorPrefs.clickAssistance.dwellTime]}
                        onValueChange={([value]) =>
                          setMotorPrefs({
                            ...motorPrefs,
                            clickAssistance: { ...motorPrefs.clickAssistance, dwellTime: value }
                          })
                        }
                        min={500}
                        max={3000}
                        step={100}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label htmlFor="click-lock" className="text-sm font-medium">
                      Click Lock
                    </label>
                    <Switch
                      id="click-lock"
                      checked={motorPrefs.clickAssistance.clickLock}
                      onCheckedChange={(checked) =>
                        setMotorPrefs({
                          ...motorPrefs,
                          clickAssistance: { ...motorPrefs.clickAssistance, clickLock: checked }
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* One-Handed Mode */}
              <Card>
                <CardHeader>
                  <CardTitle>One-Handed Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="one-handed" className="text-sm font-medium">
                      Enable One-Handed Mode
                    </label>
                    <Switch
                      id="one-handed"
                      checked={motorPrefs.customization.oneHandedMode}
                      onCheckedChange={(checked) =>
                        setMotorPrefs({
                          ...motorPrefs,
                          customization: { ...motorPrefs.customization, oneHandedMode: checked }
                        })
                      }
                    />
                  </div>

                  {motorPrefs.customization.oneHandedMode && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Dominant Hand</label>
                      <Select
                        value={motorPrefs.customization.dominantHand}
                        onValueChange={(value) =>
                          setMotorPrefs({
                            ...motorPrefs,
                            customization: { ...motorPrefs.customization, dominantHand: value }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-6">
          {voicePrefs && (
            <>
              {/* Voice Control */}
              <Card>
                <CardHeader>
                  <CardTitle>Voice Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="voice-enabled" className="text-sm font-medium">
                      Enable Voice Control
                    </label>
                    <Switch
                      id="voice-enabled"
                      checked={voicePrefs.enabled}
                      onCheckedChange={(checked) =>
                        setVoicePrefs({ ...voicePrefs, enabled: checked })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <Select
                      value={voicePrefs.language}
                      onValueChange={(value) =>
                        setVoicePrefs({ ...voicePrefs, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Sensitivity</label>
                    <Select
                      value={voicePrefs.sensitivity}
                      onValueChange={(value) =>
                        setVoicePrefs({ ...voicePrefs, sensitivity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Dictation */}
              <Card>
                <CardHeader>
                  <CardTitle>Dictation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dictation-mode" className="text-sm font-medium">
                      Dictation Mode
                    </label>
                    <Switch
                      id="dictation-mode"
                      checked={voicePrefs.dictationMode}
                      onCheckedChange={(checked) =>
                        setVoicePrefs({ ...voicePrefs, dictationMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="auto-correction" className="text-sm font-medium">
                      Auto Correction
                    </label>
                    <Switch
                      id="auto-correction"
                      checked={voicePrefs.autoCorrection}
                      onCheckedChange={(checked) =>
                        setVoicePrefs({ ...voicePrefs, autoCorrection: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="voice-feedback" className="text-sm font-medium">
                      Voice Feedback
                    </label>
                    <Switch
                      id="voice-feedback"
                      checked={voicePrefs.voiceFeedback}
                      onCheckedChange={(checked) =>
                        setVoicePrefs({ ...voicePrefs, voiceFeedback: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Keyboard Tab */}
        <TabsContent value="keyboard" className="space-y-6">
          {keyboardPrefs && (
            <>
              {/* Keyboard Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="keyboard-enabled" className="text-sm font-medium">
                      Enable Keyboard Navigation
                    </label>
                    <Switch
                      id="keyboard-enabled"
                      checked={keyboardPrefs.enabled}
                      onCheckedChange={(checked) =>
                        setKeyboardPrefs({ ...keyboardPrefs, enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="skip-links" className="text-sm font-medium">
                      Skip Links
                    </label>
                    <Switch
                      id="skip-links"
                      checked={keyboardPrefs.skipLinks}
                      onCheckedChange={(checked) =>
                        setKeyboardPrefs({ ...keyboardPrefs, skipLinks: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="arrow-navigation" className="text-sm font-medium">
                      Arrow Key Navigation
                    </label>
                    <Switch
                      id="arrow-navigation"
                      checked={keyboardPrefs.arrowKeyNavigation}
                      onCheckedChange={(checked) =>
                        setKeyboardPrefs({ ...keyboardPrefs, arrowKeyNavigation: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="spatial-navigation" className="text-sm font-medium">
                      Spatial Navigation
                    </label>
                    <Switch
                      id="spatial-navigation"
                      checked={keyboardPrefs.spatialNavigation}
                      onCheckedChange={(checked) =>
                        setKeyboardPrefs({ ...keyboardPrefs, spatialNavigation: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="focus-wrap" className="text-sm font-medium">
                      Focus Wrap Around
                    </label>
                    <Switch
                      id="focus-wrap"
                      checked={keyboardPrefs.focusWrapAround}
                      onCheckedChange={(checked) =>
                        setKeyboardPrefs({ ...keyboardPrefs, focusWrapAround: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                  <CardDescription>
                    Press F1 or Alt+/ to view all available shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Alt + H</span>
                      <span className="text-sm">Focus main heading</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Alt + M</span>
                      <span className="text-sm">Focus main content</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Alt + N</span>
                      <span className="text-sm">Focus navigation</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Alt + S</span>
                      <span className="text-sm">Focus search</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">F1</span>
                      <span className="text-sm">Show help</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Screen Reader Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Screen Reader</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mobilePrefs && (
                <>
                  <div className="flex items-center justify-between">
                    <label htmlFor="screen-reader" className="text-sm font-medium">
                      Enable Screen Reader Support
                    </label>
                    <Switch
                      id="screen-reader"
                      checked={mobilePrefs.screenReader.enabled}
                      onCheckedChange={(checked) =>
                        setMobilePrefs({
                          ...mobilePrefs,
                          screenReader: { ...mobilePrefs.screenReader, enabled: checked }
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Verbosity Level</label>
                    <Select
                      value={mobilePrefs.screenReader.verbosityLevel}
                      onValueChange={(value) =>
                        setMobilePrefs({
                          ...mobilePrefs,
                          screenReader: { ...mobilePrefs.screenReader, verbosityLevel: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="verbose">Verbose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="announce-changes" className="text-sm font-medium">
                      Announce Page Changes
                    </label>
                    <Switch
                      id="announce-changes"
                      checked={mobilePrefs.screenReader.announcePageChanges}
                      onCheckedChange={(checked) =>
                        setMobilePrefs({
                          ...mobilePrefs,
                          screenReader: { ...mobilePrefs.screenReader, announcePageChanges: checked }
                        })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Performance & Memory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                These settings help optimize performance for assistive technologies.
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="reduce-animations" className="text-sm font-medium">
                  Reduce Animations
                </label>
                <Switch
                  id="reduce-animations"
                  checked={visualPrefs?.animations?.reducedMotion || false}
                  onCheckedChange={(checked) =>
                    setVisualPrefs({
                      ...visualPrefs,
                      animations: { ...visualPrefs.animations, reducedMotion: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="limit-notifications" className="text-sm font-medium">
                  Limit Background Notifications
                </label>
                <Switch id="limit-notifications" />
              </div>
            </CardContent>
          </Card>

          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Export your accessibility settings to share across devices or import previously saved settings.
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={exportSettings} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                
                <label className="flex-1">
                  <Button variant="outline" asChild className="w-full">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </label>
              </div>

              <Separator />

              <Button variant="outline" onClick={resetToDefaults} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All to Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 