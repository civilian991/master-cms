'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Users, 
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Plus,
  Play,
  Pause,
  StopCircle,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  Search,
  Settings,
  FileText,
  Share2,
  Globe,
  Mail,
  MessageSquare,
  Zap,
  Clock,
  Eye,
  MousePointer,
  ShoppingCart,
  PieChart,
  LineChart,
  Activity,
  Lightbulb,
  Rocket,
  Timer,
  Award,
  ChartBar,
  Calculator,
  Brain,
  Workflow
} from 'lucide-react';
import { 
  MarketingABTestType,
  MarketingABTestStatus
} from '@/generated/prisma';

interface ABTest {
  id: string;
  name: string;
  description?: string;
  type: MarketingABTestType;
  status: MarketingABTestStatus;
  startDate?: Date;
  endDate?: Date;
  variants: any[];
  results?: any;
  winner?: string;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ABTestResults {
  testId: string;
  variantResults: Array<{
    variantId: string;
    variantName: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    averageOrderValue: number;
    statisticalSignificance: number;
    confidence: number;
  }>;
  overallResults: {
    totalImpressions: number;
    totalConversions: number;
    overallConversionRate: number;
    totalRevenue: number;
    testDuration: number;
    isSignificant: boolean;
    winner: string | null;
    confidence: number;
    recommendation: string;
  };
  statisticalAnalysis: {
    pValue: number;
    confidenceInterval: number[];
    effectSize: number;
    power: number;
  };
}

interface ABTestTemplate {
  id: string;
  name: string;
  description: string;
  type: MarketingABTestType;
  defaultConfig: any;
  bestPractices: string[];
  commonMetrics: string[];
  estimatedDuration: number;
  successCriteria: string[];
}

interface OptimizationRecommendation {
  type: 'test_extension' | 'sample_size_increase' | 'variant_optimization' | 'test_termination';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
  reasoning: string;
}

export function ABTestingDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [tests, setTests] = useState<ABTest[]>([]);
  const [templates, setTemplates] = useState<ABTestTemplate[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testResults, setTestResults] = useState<ABTestResults | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: MarketingABTestType.EMAIL,
    variants: [
      { id: 'control', name: 'Control', description: 'Original version', content: {}, trafficAllocation: 50, isControl: true },
      { id: 'variant-a', name: 'Variant A', description: 'Test version', content: {}, trafficAllocation: 50, isControl: false },
    ],
    minimumSampleSize: 1000,
    confidenceLevel: 0.95,
    testDuration: 7,
    primaryMetric: 'conversion_rate',
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTests(),
        loadTemplates(),
      ]);
    } catch (error) {
      console.error('Failed to load A/B testing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/ab-testing/tests?${params}`);
      const data = await response.json();
      setTests(data.tests);
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ab-testing/templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadTestResults = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-testing/tests/${testId}/results`);
      const data = await response.json();
      setTestResults(data.results);
    } catch (error) {
      console.error('Failed to load test results:', error);
    }
  };

  const loadRecommendations = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-testing/tests/${testId}/recommendations`);
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const createTest = async () => {
    try {
      const response = await fetch('/api/ab-testing/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          config: formData,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          type: MarketingABTestType.EMAIL,
          variants: [
            { id: 'control', name: 'Control', description: 'Original version', content: {}, trafficAllocation: 50, isControl: true },
            { id: 'variant-a', name: 'Variant A', description: 'Test version', content: {}, trafficAllocation: 50, isControl: false },
          ],
          minimumSampleSize: 1000,
          confidenceLevel: 0.95,
          testDuration: 7,
          primaryMetric: 'conversion_rate',
        });
        loadTests();
      }
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  const updateTestStatus = async (testId: string, status: MarketingABTestStatus) => {
    try {
      const response = await fetch(`/api/ab-testing/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadTests();
      }
    } catch (error) {
      console.error('Failed to update test status:', error);
    }
  };

  const selectTest = async (test: ABTest) => {
    setSelectedTest(test);
    await Promise.all([
      loadTestResults(test.id),
      loadRecommendations(test.id),
    ]);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: MarketingABTestStatus) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: FileText },
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active', icon: Play },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: Pause },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', label: 'Completed', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: MarketingABTestType) => {
    const iconConfig = {
      EMAIL: Mail,
      CONTENT: FileText,
      SOCIAL_MEDIA: Share2,
      PAID_ADVERTISING: Target,
      LANDING_PAGE: Globe,
      CTA: Target,
    };

    const Icon = iconConfig[type] || Target;
    return <Icon className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (loading && tests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading A/B testing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Framework</h1>
          <p className="text-gray-600">Statistical testing, automation, and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Create Test Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter test name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Test Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as MarketingABTestType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MarketingABTestType.EMAIL}>Email</SelectItem>
                    <SelectItem value={MarketingABTestType.CONTENT}>Content</SelectItem>
                    <SelectItem value={MarketingABTestType.SOCIAL_MEDIA}>Social Media</SelectItem>
                    <SelectItem value={MarketingABTestType.PAID_ADVERTISING}>Paid Advertising</SelectItem>
                    <SelectItem value={MarketingABTestType.LANDING_PAGE}>Landing Page</SelectItem>
                    <SelectItem value={MarketingABTestType.CTA}>Call-to-Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter test description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Sample Size</label>
                <Input
                  type="number"
                  value={formData.minimumSampleSize}
                  onChange={(e) => setFormData({ ...formData, minimumSampleSize: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confidence Level</label>
                <Select
                  value={formData.confidenceLevel.toString()}
                  onValueChange={(value) => setFormData({ ...formData, confidenceLevel: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.90">90%</SelectItem>
                    <SelectItem value="0.95">95%</SelectItem>
                    <SelectItem value="0.99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Test Duration (days)</label>
                <Input
                  type="number"
                  value={formData.testDuration}
                  onChange={(e) => setFormData({ ...formData, testDuration: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createTest}>Create Test</Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold">{tests.length}</p>
                <p className="text-xs text-gray-500">
                  {tests.filter(t => t.status === MarketingABTestStatus.ACTIVE).length} active
                </p>
              </div>
              <TestTube className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tests</p>
                <p className="text-2xl font-bold">
                  {tests.filter(t => t.status === MarketingABTestStatus.COMPLETED).length}
                </p>
                <p className="text-xs text-gray-500">With results</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold">
                  {tests.filter(t => t.status === MarketingABTestStatus.ACTIVE).length}
                </p>
                <p className="text-xs text-gray-500">Running now</p>
              </div>
              <Play className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {tests.filter(t => t.status === MarketingABTestStatus.COMPLETED).length > 0 
                    ? `${Math.round((tests.filter(t => t.winner).length / tests.filter(t => t.status === MarketingABTestStatus.COMPLETED).length) * 100)}%`
                    : '0%'
                  }
                </p>
                <p className="text-xs text-gray-500">Tests with winners</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Template className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tests.slice(0, 5).map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(test.type)}
                        <div>
                          <p className="font-medium">{test.name}</p>
                          <p className="text-sm text-gray-500">{test.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectTest(test)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Test Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Test Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.filter(t => t.status === MarketingABTestStatus.COMPLETED).slice(0, 3).map((test) => (
                    <div key={test.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{test.name}</p>
                        {test.winner && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="mr-1 h-3 w-3" />
                            Winner Found
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Confidence</p>
                          <p className="font-medium">{test.confidence ? `${test.confidence.toFixed(1)}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">
                            {test.startDate && test.endDate 
                              ? `${Math.round((test.endDate.getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status Filter</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value={MarketingABTestStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={MarketingABTestStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={MarketingABTestStatus.PAUSED}>Paused</SelectItem>
                      <SelectItem value={MarketingABTestStatus.COMPLETED}>Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type Filter</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value={MarketingABTestType.EMAIL}>Email</SelectItem>
                      <SelectItem value={MarketingABTestType.CONTENT}>Content</SelectItem>
                      <SelectItem value={MarketingABTestType.SOCIAL_MEDIA}>Social Media</SelectItem>
                      <SelectItem value={MarketingABTestType.PAID_ADVERTISING}>Paid Advertising</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadTests} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tests List */}
          <Card>
            <CardHeader>
              <CardTitle>All Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getTypeIcon(test.type)}
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-500">{test.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(test.status)}
                          <span className="text-xs text-gray-400">
                            Created {new Date(test.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectTest(test)}
                      >
                        View Details
                      </Button>
                      {test.status === MarketingABTestStatus.DRAFT && (
                        <Button
                          size="sm"
                          onClick={() => updateTestStatus(test.id, MarketingABTestStatus.ACTIVE)}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Start
                        </Button>
                      )}
                      {test.status === MarketingABTestStatus.ACTIVE && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTestStatus(test.id, MarketingABTestStatus.PAUSED)}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(template.type)}
                        {template.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{template.estimatedDuration} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{template.commonMetrics.join(', ')}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button size="sm" className="w-full">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Automation Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Yet</h3>
                <p className="text-gray-600 mb-4">Create automated workflows to streamline your A/B testing process.</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ChartBar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600">View detailed analytics and insights for your A/B tests.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Details Modal */}
      {selectedTest && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedTest.type)}
                {selectedTest.name}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTest.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTest(null)}
                >
                  Close
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="results" className="space-y-4">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                {testResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Total Impressions</p>
                          <p className="text-2xl font-bold">{formatNumber(testResults.overallResults.totalImpressions)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Total Conversions</p>
                          <p className="text-2xl font-bold">{formatNumber(testResults.overallResults.totalConversions)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                          <p className="text-2xl font-bold">{formatPercentage(testResults.overallResults.overallConversionRate)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      {testResults.variantResults.map((variant) => (
                        <div key={variant.variantId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{variant.variantName}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {formatPercentage(variant.conversionRate)} conversion rate
                              </span>
                              {variant.confidence > 95 && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Significant
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Impressions</p>
                              <p className="font-medium">{formatNumber(variant.impressions)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Conversions</p>
                              <p className="font-medium">{formatNumber(variant.conversions)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Revenue</p>
                              <p className="font-medium">{formatCurrency(variant.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">AOV</p>
                              <p className="font-medium">{formatCurrency(variant.averageOrderValue)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Recommendation</h4>
                      <p className="text-sm text-gray-700">{testResults.overallResults.recommendation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No results available yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations">
                <div className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{recommendation.title}</h3>
                          <p className="text-sm text-gray-600">{recommendation.description}</p>
                        </div>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Impact</p>
                          <p className="font-medium">{recommendation.impact}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Effort</p>
                          <p className="font-medium">{recommendation.effort}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{recommendation.reasoning}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="variants">
                <div className="space-y-3">
                  {(selectedTest.variants as any[]).map((variant: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{variant.name}</h3>
                        {variant.isControl && (
                          <Badge className="bg-blue-100 text-blue-800">Control</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{variant.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Traffic Allocation:</span>
                        <span className="font-medium">{variant.trafficAllocation}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 