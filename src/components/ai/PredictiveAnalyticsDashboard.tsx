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
  BarChart3, 
  Users, 
  TrendingUp,
  Target,
  Brain,
  TestTube,
  Eye,
  MousePointer,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  Filter,
  Calendar,
  Globe,
  Activity,
  PieChart,
  LineChart,
  ScatterChart,
  RefreshCw
} from 'lucide-react';

interface PredictiveAnalyticsDashboardProps {
  siteId: number;
}

interface UserBehaviorEvent {
  id: number;
  eventType: string;
  eventCategory: string;
  eventAction: string;
  pageUrl: string;
  contentId?: string;
  contentType?: string;
  timeOnPage?: number;
  scrollDepth?: number;
  interactionCount: number;
  createdAt: string;
}

interface MLModel {
  id: number;
  modelName: string;
  modelType: string;
  modelVersion: string;
  algorithm: string;
  status: string;
  isActive: boolean;
  trainingAccuracy: number;
  testAccuracy: number;
  totalPredictions: number;
  averageResponseTime?: number;
  lastPrediction?: string;
}

interface UserPrediction {
  id: number;
  predictionType: string;
  predictionValue: number;
  predictionConfidence: number;
  predictionClass?: string;
  isCorrect?: boolean;
  usedInPersonalization: boolean;
  usedInRecommendation: boolean;
  usedInOptimization: boolean;
  createdAt: string;
}

interface ContentRecommendation {
  id: number;
  contentId: string;
  contentType: string;
  recommendationType: string;
  recommendationScore: number;
  algorithm: string;
  isShown: boolean;
  isClicked: boolean;
  isEngaged: boolean;
  timeSpent?: number;
  clickThroughRate?: number;
  engagementRate?: number;
  createdAt: string;
}

interface ABTest {
  id: number;
  testName: string;
  testType: string;
  testHypothesis?: string;
  isActive: boolean;
  isPaused: boolean;
  startDate: string;
  endDate?: string;
  currentSampleSize: number;
  statisticalSignificance: boolean;
  winner?: string;
  confidenceLevel?: number;
  totalConversions: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface AnalyticsInsights {
  totalEvents: number;
  uniqueUsers: number;
  topContent: Array<{ contentId: string; viewCount: number }>;
  userEngagement: {
    averageTimeOnPage: number;
    averageScrollDepth: number;
    averageInteractions: number;
  };
  conversionRates: {
    totalEvents: number;
    conversionEvents: number;
    conversionRate: number;
  };
  insights: string;
}

export function PredictiveAnalyticsDashboard({ siteId }: PredictiveAnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [events, setEvents] = useState<UserBehaviorEvent[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  
  // Form states
  const [eventForm, setEventForm] = useState({
    eventType: 'page_view',
    eventCategory: 'navigation',
    eventAction: 'view',
    pageUrl: '',
    contentId: '',
    contentType: '',
    timeOnPage: 0,
    scrollDepth: 0,
    interactionCount: 0,
    properties: {},
  });

  const [modelForm, setModelForm] = useState({
    modelName: '',
    modelType: 'classification',
    modelVersion: '1.0.0',
    algorithm: 'random_forest',
    description: '',
    hyperparameters: {},
    featureColumns: {},
    targetColumn: '',
    trainingDataSize: 1000,
    trainingAccuracy: 0.85,
    validationAccuracy: 0.83,
    testAccuracy: 0.82,
  });

  const [abTestForm, setAbTestForm] = useState({
    testName: '',
    testType: 'content',
    testHypothesis: '',
    controlVariant: 'control',
    treatmentVariants: ['variant_a', 'variant_b'],
    trafficAllocation: { control: 0.5, variant_a: 0.25, variant_b: 0.25 },
    primaryMetric: 'conversion_rate',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Filter states
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    eventType: '',
    contentType: '',
    modelType: '',
    predictionType: '',
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [siteId, filters]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        eventsResponse,
        modelsResponse,
        predictionsResponse,
        recommendationsResponse,
        abTestsResponse,
        insightsResponse,
      ] = await Promise.all([
        fetch(`/api/ai/analytics/events?siteId=${siteId}&startDate=${filters.startDate}&endDate=${filters.endDate}&eventType=${filters.eventType}&contentType=${filters.contentType}`),
        fetch(`/api/ai/analytics/models?siteId=${siteId}&modelType=${filters.modelType}`),
        fetch(`/api/ai/analytics/models/predictions?siteId=${siteId}&predictionType=${filters.predictionType}`),
        fetch(`/api/ai/analytics/recommendations?siteId=${siteId}`),
        fetch(`/api/ai/analytics/ab-testing?siteId=${siteId}`),
        fetch(`/api/ai/analytics/insights?siteId=${siteId}&startDate=${filters.startDate}&endDate=${filters.endDate}`),
      ]);

      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setEvents(data.events || []);
      }

      if (modelsResponse.ok) {
        const data = await modelsResponse.json();
        setModels(data.models || []);
      }

      if (predictionsResponse.ok) {
        const data = await predictionsResponse.json();
        setPredictions(data.predictions || []);
      }

      if (recommendationsResponse.ok) {
        const data = await recommendationsResponse.json();
        setRecommendations(data.recommendations || []);
      }

      if (abTestsResponse.ok) {
        const data = await abTestsResponse.json();
        setAbTests(data.tests || []);
      }

      if (insightsResponse.ok) {
        const data = await insightsResponse.json();
        setInsights(data.insights);
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const trackEvent = async () => {
    try {
      const response = await fetch('/api/ai/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          sessionId: 'test-session',
          ...eventForm,
        }),
      });

      if (response.ok) {
        // Reset form and reload data
        setEventForm({
          eventType: 'page_view',
          eventCategory: 'navigation',
          eventAction: 'view',
          pageUrl: '',
          contentId: '',
          contentType: '',
          timeOnPage: 0,
          scrollDepth: 0,
          interactionCount: 0,
          properties: {},
        });
        loadAnalyticsData();
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const createModel = async () => {
    try {
      const response = await fetch('/api/ai/analytics/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          ...modelForm,
        }),
      });

      if (response.ok) {
        // Reset form and reload data
        setModelForm({
          modelName: '',
          modelType: 'classification',
          modelVersion: '1.0.0',
          algorithm: 'random_forest',
          description: '',
          hyperparameters: {},
          featureColumns: {},
          targetColumn: '',
          trainingDataSize: 1000,
          trainingAccuracy: 0.85,
          validationAccuracy: 0.83,
          testAccuracy: 0.82,
        });
        loadAnalyticsData();
      }
    } catch (error) {
      console.error('Error creating model:', error);
    }
  };

  const createABTest = async () => {
    try {
      const response = await fetch('/api/ai/analytics/ab-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          ...abTestForm,
        }),
      });

      if (response.ok) {
        // Reset form and reload data
        setAbTestForm({
          testName: '',
          testType: 'content',
          testHypothesis: '',
          controlVariant: 'control',
          treatmentVariants: ['variant_a', 'variant_b'],
          trafficAllocation: { control: 0.5, variant_a: 0.25, variant_b: 0.25 },
          primaryMetric: 'conversion_rate',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        loadAnalyticsData();
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'training':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Training</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Predictive Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced analytics, ML models, and personalization insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={filters.eventType} onValueChange={(value) => setFilters({ ...filters, eventType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  <SelectItem value="page_view">Page View</SelectItem>
                  <SelectItem value="click">Click</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="form_submit">Form Submit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content Type</Label>
              <Select value={filters.contentType} onValueChange={(value) => setFilters({ ...filters, contentType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All content</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {insights && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{insights.totalEvents.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{insights.uniqueUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(insights.conversionRates.conversionRate * 100).toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {insights.conversionRates.conversionEvents} conversions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(insights.userEngagement.averageTimeOnPage)}s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average engagement
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{insights.insights}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Top Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Top Performing Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.topContent.slice(0, 5).map((content, index) => (
                      <div key={content.contentId} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center">
                          <span className="font-mono text-sm text-muted-foreground w-8">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{content.contentId}</span>
                        </div>
                        <Badge variant="outline">{content.viewCount} views</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  User Behavior Events
                </div>
                <Button onClick={trackEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Track Event
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{event.eventType}</Badge>
                      <div>
                        <p className="font-medium">{event.eventAction}</p>
                        <p className="text-sm text-muted-foreground">{event.pageUrl}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                      {event.timeOnPage && (
                        <p className="text-xs text-muted-foreground">
                          {event.timeOnPage}s on page
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ML Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  ML Models
                </div>
                <Button onClick={createModel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Model
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{model.modelName}</p>
                        <p className="text-sm text-muted-foreground">
                          {model.algorithm} • v{model.modelVersion}
                        </p>
                      </div>
                      {getStatusBadge(model.status)}
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getAccuracyColor(model.testAccuracy)}`}>
                        {(model.testAccuracy * 100).toFixed(1)}% accuracy
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {model.totalPredictions} predictions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                User Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.slice(0, 10).map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{prediction.predictionType}</Badge>
                      <div>
                        <p className="font-medium">
                          {prediction.predictionClass || `${(prediction.predictionValue * 100).toFixed(1)}%`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(prediction.predictionConfidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(prediction.createdAt).toLocaleDateString()}
                      </p>
                      {prediction.isCorrect !== undefined && (
                        <Badge variant={prediction.isCorrect ? "default" : "destructive"}>
                          {prediction.isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Content Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.slice(0, 10).map((recommendation) => (
                  <div key={recommendation.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{recommendation.recommendationType}</Badge>
                      <div>
                        <p className="font-medium">{recommendation.contentId}</p>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.algorithm} • {(recommendation.recommendationScore * 100).toFixed(1)}% score
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {recommendation.isShown && <Badge variant="outline">Shown</Badge>}
                        {recommendation.isClicked && <Badge variant="default">Clicked</Badge>}
                        {recommendation.isEngaged && <Badge variant="secondary">Engaged</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {recommendation.clickThroughRate && `${(recommendation.clickThroughRate * 100).toFixed(1)}% CTR`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="ab-testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  A/B Tests
                </div>
                <Button onClick={createABTest}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{test.testName}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.testType} • {test.currentSampleSize} participants
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {test.isActive && <Badge variant="default">Active</Badge>}
                        {test.isPaused && <Badge variant="secondary">Paused</Badge>}
                        {test.statisticalSignificance && <Badge variant="outline">Significant</Badge>}
                        {test.winner && <Badge variant="default">Winner: {test.winner}</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{test.totalConversions} conversions</p>
                      <p className="text-sm text-muted-foreground">
                        ${test.totalRevenue.toFixed(2)} revenue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 