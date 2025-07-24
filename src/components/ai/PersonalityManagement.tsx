'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TestTube, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Globe,
  Users,
  Zap
} from 'lucide-react';

interface PersonalityManagementProps {
  siteId: number;
}

interface PersonalityTemplate {
  id: number;
  name: string;
  description: string;
  industry: string;
  baseConfiguration: any;
  features: any;
  culturalSupport: any;
  audienceTargeting: any;
}

interface AdvancedPersonality {
  id: number;
  siteId: number;
  basePersonality: any;
  personalityTemplate?: string;
  dynamicAdaptation: boolean;
  learningEnabled: boolean;
  adaptationRate: number;
  culturalContext: any;
  linguisticStyle: any;
  regionalPreferences: any;
  audienceSegments: any[];
  targetingEnabled: boolean;
  performanceTracking: boolean;
  optimizationEnabled: boolean;
  aBTestingEnabled: boolean;
  modelVersion: string;
  fineTunedModel?: string;
  trainingDataVersion?: string;
  performanceMetrics?: any[];
}

interface ABTest {
  id: number;
  personalityId: number;
  testName: string;
  variantA: any;
  variantB: any;
  variantAPerformance?: number;
  variantBPerformance?: number;
  statisticalSignificance?: number;
  winner?: 'A' | 'B' | null;
  status: string;
  startDate: string;
  endDate?: string;
  sampleSizeA: number;
  sampleSizeB: number;
}

export function PersonalityManagement({ siteId }: PersonalityManagementProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personality, setPersonality] = useState<AdvancedPersonality | null>(null);
  const [templates, setTemplates] = useState<PersonalityTemplate[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPersonalityData();
  }, [siteId]);

  const loadPersonalityData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load personality
      const personalityResponse = await fetch(`/api/ai/personalities?siteId=${siteId}`);
      if (personalityResponse.ok) {
        const data = await personalityResponse.json();
        setPersonality(data.personality);
        setAnalytics(data.analytics);
      }

      // Load templates
      const templatesResponse = await fetch('/api/ai/personalities/templates');
      if (templatesResponse.ok) {
        const data = await templatesResponse.json();
        setTemplates(data.templates);
      }

      // Load A/B tests
      if (personality) {
        const abTestsResponse = await fetch(`/api/ai/personalities/ab-testing?personalityId=${personality.id}`);
        if (abTestsResponse.ok) {
          const data = await abTestsResponse.json();
          setAbTests(data.abTests);
        }
      }
    } catch (error) {
      console.error('Error loading personality data:', error);
      setError('Failed to load personality data');
    } finally {
      setIsLoading(false);
    }
  };

  const createPersonality = async (templateId?: number) => {
    try {
      const template = templateId ? templates.find(t => t.id === templateId) : null;
      
      const personalityData = {
        siteId,
        basePersonality: template ? template.baseConfiguration : {
          name: 'Default Personality',
          description: 'Default AI personality for this site',
          tone: 'professional',
          expertise: ['general'],
          writingStyle: 'Clear and informative',
          targetAudience: 'General audience',
          language: 'en',
        },
        personalityTemplate: template?.name,
        dynamicAdaptation: true,
        learningEnabled: true,
        adaptationRate: 0.1,
        culturalContext: {
          region: 'Global',
          language: 'en',
          culturalNorms: [],
          localPreferences: {},
        },
        linguisticStyle: {
          formality: 'semi-formal',
          vocabulary: 'general',
          sentenceStructure: 'moderate',
          culturalReferences: true,
        },
        regionalPreferences: {
          dateFormats: 'MM/DD/YYYY',
          numberFormats: '1,234.56',
          currencyFormats: '$1,234.56',
          measurementUnits: 'metric',
        },
        audienceSegments: [],
        targetingEnabled: true,
        performanceTracking: true,
        optimizationEnabled: true,
        aBTestingEnabled: true,
        modelVersion: 'v1.0.0',
      };

      const response = await fetch('/api/ai/personalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalityData),
      });

      if (response.ok) {
        await loadPersonalityData();
      } else {
        throw new Error('Failed to create personality');
      }
    } catch (error) {
      console.error('Error creating personality:', error);
      setError('Failed to create personality');
    }
  };

  const createABTest = async () => {
    if (!personality) return;

    try {
      const abTestData = {
        personalityId: personality.id,
        testName: `Test ${Date.now()}`,
        variantA: {
          ...personality.basePersonality,
          tone: 'professional',
        },
        variantB: {
          ...personality.basePersonality,
          tone: 'conversational',
        },
        startDate: new Date().toISOString(),
        sampleSizeA: 0,
        sampleSizeB: 0,
      };

      const response = await fetch('/api/ai/personalities/ab-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(abTestData),
      });

      if (response.ok) {
        await loadPersonalityData();
      } else {
        throw new Error('Failed to create A/B test');
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      setError('Failed to create A/B test');
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Personality Management</h2>
          <p className="text-muted-foreground">
            Manage and optimize site-specific AI personalities
          </p>
        </div>
        {!personality && (
          <Button onClick={() => createPersonality()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Personality
          </Button>
        )}
      </div>

      {!personality ? (
        <Card>
          <CardHeader>
            <CardTitle>No Personality Configured</CardTitle>
            <CardDescription>
              Create a personality for this site or select from templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => createPersonality()} className="w-full">
                <Brain className="mr-2 h-4 w-4" />
                Create Default Personality
              </Button>
              
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Or select from templates:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md">
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <Badge variant="outline" className="mt-2">{template.industry}</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 w-full"
                            onClick={() => createPersonality(template.id)}
                          >
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5" />
                    Personality Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm">{personality.basePersonality.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tone</Label>
                    <Badge variant="outline">{personality.basePersonality.tone}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <Badge variant="outline">{personality.basePersonality.language}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Expertise</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {personality.basePersonality.expertise.map((exp: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={personality.dynamicAdaptation} disabled />
                    <Label>Dynamic Adaptation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={personality.learningEnabled} disabled />
                    <Label>Learning Enabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={personality.targetingEnabled} disabled />
                    <Label>Audience Targeting</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={personality.aBTestingEnabled} disabled />
                    <Label>A/B Testing</Label>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Adaptation Rate</Label>
                    <p className="text-sm">{personality.adaptationRate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(analytics.averages.contentQualityScore)}`}>
                        {analytics.averages.contentQualityScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Content Quality</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(analytics.averages.audienceEngagement)}`}>
                        {analytics.averages.audienceEngagement.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(analytics.averages.culturalRelevance)}`}>
                        {analytics.averages.culturalRelevance.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Cultural Relevance</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(analytics.averages.consistencyScore)}`}>
                        {analytics.averages.consistencyScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Consistency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">Recent Performance</h4>
                        <div className="space-y-2">
                          {analytics.recentPerformance.map((metric: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 border rounded">
                              <span className="text-sm">{new Date(metric.measurementDate).toLocaleDateString()}</span>
                              <div className="flex space-x-4">
                                <span className="text-sm">{metric.contentQualityScore.toFixed(1)}</span>
                                <span className="text-sm">{metric.audienceEngagement.toFixed(1)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-4">Trends</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Content Quality</span>
                            <span className={analytics.trends.contentQualityTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                              {analytics.trends.contentQualityTrend > 0 ? '+' : ''}{analytics.trends.contentQualityTrend.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Engagement</span>
                            <span className={analytics.trends.engagementTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                              {analytics.trends.engagementTrend > 0 ? '+' : ''}{analytics.trends.engagementTrend.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cultural Relevance</span>
                            <span className={analytics.trends.culturalTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                              {analytics.trends.culturalTrend > 0 ? '+' : ''}{analytics.trends.culturalTrend.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consistency</span>
                            <span className={analytics.trends.consistencyTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                              {analytics.trends.consistencyTrend > 0 ? '+' : ''}{analytics.trends.consistencyTrend.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No performance data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ab-testing" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">A/B Testing</h3>
              <Button onClick={createABTest}>
                <TestTube className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {abTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{test.testName}</span>
                      {getStatusBadge(test.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Variant A</Label>
                          <p className="text-sm">{test.variantA.tone}</p>
                          {test.variantAPerformance && (
                            <p className="text-sm font-medium">{test.variantAPerformance.toFixed(1)}%</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Variant B</Label>
                          <p className="text-sm">{test.variantB.tone}</p>
                          {test.variantBPerformance && (
                            <p className="text-sm font-medium">{test.variantBPerformance.toFixed(1)}%</p>
                          )}
                        </div>
                      </div>
                      
                      {test.statisticalSignificance && (
                        <div>
                          <Label className="text-sm font-medium">Statistical Significance</Label>
                          <p className="text-sm">{test.statisticalSignificance.toFixed(3)}</p>
                        </div>
                      )}
                      
                      {test.winner && (
                        <div>
                          <Label className="text-sm font-medium">Winner</Label>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Variant {test.winner}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(test.startDate).toLocaleDateString()}
                        {test.endDate && (
                          <span> • Ended: {new Date(test.endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {abTests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No A/B Tests</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first A/B test to compare personality variants
                  </p>
                  <Button onClick={createABTest}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Create First Test
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personality Settings</CardTitle>
                <CardDescription>
                  Configure advanced personality features and optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Learning & Adaptation</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={personality.dynamicAdaptation} disabled />
                        <Label>Enable Dynamic Adaptation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={personality.learningEnabled} disabled />
                        <Label>Enable Learning</Label>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Adaptation Rate</Label>
                        <p className="text-sm">{personality.adaptationRate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Performance & Testing</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={personality.performanceTracking} disabled />
                        <Label>Performance Tracking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={personality.optimizationEnabled} disabled />
                        <Label>Auto Optimization</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={personality.aBTestingEnabled} disabled />
                        <Label>A/B Testing</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Model Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Model Version</Label>
                      <p className="text-sm">{personality.modelVersion}</p>
                    </div>
                    {personality.fineTunedModel && (
                      <div>
                        <Label className="text-sm font-medium">Fine-tuned Model</Label>
                        <p className="text-sm">{personality.fineTunedModel}</p>
                      </div>
                    )}
                    {personality.trainingDataVersion && (
                      <div>
                        <Label className="text-sm font-medium">Training Data Version</Label>
                        <p className="text-sm">{personality.trainingDataVersion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 