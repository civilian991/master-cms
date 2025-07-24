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
  Zap, 
  Play, 
  Pause, 
  StopCircle,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  BarChart3,
  Workflow,
  Template,
  Activity,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  ShoppingCart,
  FileText,
  Share2,
  Globe,
  Filter,
  Search,
  Download,
  Upload,
  Copy,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Circle,
  Square,
  Triangle
} from 'lucide-react';
import { 
  MarketingAutomationType,
  MarketingAutomationStatus,
  MarketingAutomationExecutionStatus
} from '@/generated/prisma';

interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  type: MarketingAutomationType;
  status: MarketingAutomationStatus;
  triggers: any[];
  actions: any[];
  conditions?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdUser: any;
  executions: any[];
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  type: MarketingAutomationType;
  category: string;
  triggers: any[];
  actions: any[];
  estimatedDuration: number;
  successRate: number;
  complexity: 'simple' | 'medium' | 'complex';
  bestPractices: string[];
  useCases: string[];
}

interface AutomationAnalytics {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecution?: Date;
  nextExecution?: Date;
  performanceMetrics: {
    emailsSent: number;
    leadsConverted: number;
    revenueGenerated: number;
    engagementRate: number;
  };
}

export function MarketingAutomationDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [workflowAnalytics, setWorkflowAnalytics] = useState<AutomationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: MarketingAutomationType.LEAD_NURTURING,
    triggers: [],
    actions: [],
    conditions: {},
    isActive: true,
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
        loadWorkflows(),
        loadTemplates(),
      ]);
    } catch (error) {
      console.error('Failed to load automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/marketing-automation/workflows?${params}`);
      const data = await response.json();
      setWorkflows(data.workflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/marketing-automation/templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadWorkflowAnalytics = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/marketing-automation/workflows/${workflowId}/analytics`);
      const data = await response.json();
      setWorkflowAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to load workflow analytics:', error);
    }
  };

  const createWorkflow = async () => {
    try {
      const response = await fetch('/api/marketing-automation/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          workflow: formData,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          type: MarketingAutomationType.LEAD_NURTURING,
          triggers: [],
          actions: [],
          conditions: {},
          isActive: true,
        });
        loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const updateWorkflowStatus = async (workflowId: string, status: MarketingAutomationStatus) => {
    try {
      const response = await fetch(`/api/marketing-automation/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to update workflow status:', error);
    }
  };

  const executeWorkflow = async (workflowId: string, trigger: string) => {
    try {
      const response = await fetch(`/api/marketing-automation/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, input: {} }),
      });

      if (response.ok) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const selectWorkflow = async (workflow: AutomationWorkflow) => {
    setSelectedWorkflow(workflow);
    await loadWorkflowAnalytics(workflow.id);
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
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const getStatusBadge = (status: MarketingAutomationStatus) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: FileText },
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active', icon: Play },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: Pause },
      ARCHIVED: { color: 'bg-red-100 text-red-800', label: 'Archived', icon: StopCircle },
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

  const getTypeIcon = (type: MarketingAutomationType) => {
    const iconConfig = {
      LEAD_NURTURING: Users,
      EMAIL_SEQUENCE: Mail,
      SOCIAL_MEDIA: Share2,
      CONTENT_DISTRIBUTION: FileText,
      LEAD_SCORING: Target,
      CUSTOM: Settings,
    };

    const Icon = iconConfig[type] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      simple: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      complex: 'bg-red-100 text-red-800',
    };
    return colors[complexity as keyof typeof colors] || colors.simple;
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading automation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Automation Engine</h1>
          <p className="text-gray-600">Workflow automation, triggers, and monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Create Workflow Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Automation Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workflow Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Workflow Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as MarketingAutomationType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MarketingAutomationType.LEAD_NURTURING}>Lead Nurturing</SelectItem>
                    <SelectItem value={MarketingAutomationType.EMAIL_SEQUENCE}>Email Sequence</SelectItem>
                    <SelectItem value={MarketingAutomationType.SOCIAL_MEDIA}>Social Media</SelectItem>
                    <SelectItem value={MarketingAutomationType.CONTENT_DISTRIBUTION}>Content Distribution</SelectItem>
                    <SelectItem value={MarketingAutomationType.LEAD_SCORING}>Lead Scoring</SelectItem>
                    <SelectItem value={MarketingAutomationType.CUSTOM}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter workflow description"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createWorkflow}>Create Workflow</Button>
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
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
                <p className="text-xs text-gray-500">
                  {workflows.filter(w => w.status === MarketingAutomationStatus.ACTIVE).length} active
                </p>
              </div>
              <Workflow className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">
                  {workflows.filter(w => w.status === MarketingAutomationStatus.ACTIVE).length}
                </p>
                <p className="text-xs text-gray-500">Running now</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.executions.length, 0)}
                </p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {workflows.length > 0 
                    ? `${Math.round((workflows.filter(w => w.executions.some(e => e.status === MarketingAutomationExecutionStatus.COMPLETED)).length / workflows.length) * 100)}%`
                    : '0%'
                  }
                </p>
                <p className="text-xs text-gray-500">Workflows with successful executions</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
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
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Template className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows.slice(0, 5).map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(workflow.type)}
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-gray-500">{workflow.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(workflow.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectWorkflow(workflow)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.filter(w => w.executions.length > 0).slice(0, 3).map((workflow) => (
                    <div key={workflow.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{workflow.name}</p>
                        <Badge className="bg-blue-100 text-blue-800">
                          {workflow.executions.length} executions
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Success Rate</p>
                          <p className="font-medium">
                            {workflow.executions.length > 0 
                              ? `${Math.round((workflow.executions.filter(e => e.status === MarketingAutomationExecutionStatus.COMPLETED).length / workflow.executions.length) * 100)}%`
                              : '0%'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Run</p>
                          <p className="font-medium">
                            {workflow.executions.length > 0 
                              ? new Date(workflow.executions[0].startedAt).toLocaleDateString()
                              : 'Never'
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

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
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
                      <SelectItem value={MarketingAutomationStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={MarketingAutomationStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={MarketingAutomationStatus.PAUSED}>Paused</SelectItem>
                      <SelectItem value={MarketingAutomationStatus.ARCHIVED}>Archived</SelectItem>
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
                      <SelectItem value={MarketingAutomationType.LEAD_NURTURING}>Lead Nurturing</SelectItem>
                      <SelectItem value={MarketingAutomationType.EMAIL_SEQUENCE}>Email Sequence</SelectItem>
                      <SelectItem value={MarketingAutomationType.SOCIAL_MEDIA}>Social Media</SelectItem>
                      <SelectItem value={MarketingAutomationType.CONTENT_DISTRIBUTION}>Content Distribution</SelectItem>
                      <SelectItem value={MarketingAutomationType.LEAD_SCORING}>Lead Scoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadWorkflows} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflows List */}
          <Card>
            <CardHeader>
              <CardTitle>All Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getTypeIcon(workflow.type)}
                      <div>
                        <h3 className="font-medium">{workflow.name}</h3>
                        <p className="text-sm text-gray-500">{workflow.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(workflow.status)}
                          <span className="text-xs text-gray-400">
                            Created {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectWorkflow(workflow)}
                      >
                        View Details
                      </Button>
                      {workflow.status === MarketingAutomationStatus.DRAFT && (
                        <Button
                          size="sm"
                          onClick={() => updateWorkflowStatus(workflow.id, MarketingAutomationStatus.ACTIVE)}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Activate
                        </Button>
                      )}
                      {workflow.status === MarketingAutomationStatus.ACTIVE && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateWorkflowStatus(workflow.id, MarketingAutomationStatus.PAUSED)}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeWorkflow(workflow.id, 'manual')}
                      >
                        <Zap className="mr-1 h-3 w-3" />
                        Execute
                      </Button>
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
              <CardTitle>Automation Templates</CardTitle>
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
                          <TrendingUp className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{template.successRate}% success rate</span>
                        </div>
                        <Badge className={getComplexityColor(template.complexity)}>
                          {template.complexity}
                        </Badge>
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

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(workflow.type)}
                        <div>
                          <h3 className="font-medium">{workflow.name}</h3>
                          <p className="text-sm text-gray-500">{workflow.type}</p>
                        </div>
                      </div>
                      {getStatusBadge(workflow.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Executions</p>
                        <p className="font-medium">{workflow.executions.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Success Rate</p>
                        <p className="font-medium">
                          {workflow.executions.length > 0 
                            ? `${Math.round((workflow.executions.filter(e => e.status === MarketingAutomationExecutionStatus.COMPLETED).length / workflow.executions.length) * 100)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Execution</p>
                        <p className="font-medium">
                          {workflow.executions.length > 0 
                            ? new Date(workflow.executions[0].startedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium">{workflow.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600">View detailed analytics and insights for your automation workflows.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Details Modal */}
      {selectedWorkflow && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedWorkflow.type)}
                {selectedWorkflow.name}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedWorkflow.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWorkflow(null)}
                >
                  Close
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="executions">Executions</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedWorkflow.description || 'No description provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Triggers</h4>
                      <div className="space-y-2">
                        {(selectedWorkflow.triggers as any[]).map((trigger, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <strong>{trigger.type}</strong>
                            {trigger.conditions && Object.keys(trigger.conditions).length > 0 && (
                              <p className="text-gray-600">Conditions: {JSON.stringify(trigger.conditions)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="space-y-2">
                        {(selectedWorkflow.actions as any[]).map((action, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <strong>{action.type}</strong>
                            {action.parameters && Object.keys(action.parameters).length > 0 && (
                              <p className="text-gray-600">Parameters: {JSON.stringify(action.parameters)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                {workflowAnalytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Total Executions</p>
                          <p className="text-2xl font-bold">{workflowAnalytics.totalExecutions}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Success Rate</p>
                          <p className="text-2xl font-bold">{formatPercentage(workflowAnalytics.successRate)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                          <p className="text-2xl font-bold">{formatDuration(workflowAnalytics.averageExecutionTime)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Failed Executions</p>
                          <p className="text-2xl font-bold">{workflowAnalytics.failedExecutions}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                          <p className="text-2xl font-bold">{workflowAnalytics.performanceMetrics.emailsSent}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Leads Converted</p>
                          <p className="text-2xl font-bold">{workflowAnalytics.performanceMetrics.leadsConverted}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Revenue Generated</p>
                          <p className="text-2xl font-bold">${workflowAnalytics.performanceMetrics.revenueGenerated}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                          <p className="text-2xl font-bold">{formatPercentage(workflowAnalytics.performanceMetrics.engagementRate)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No analytics available yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="executions">
                <div className="space-y-3">
                  {selectedWorkflow.executions.map((execution) => (
                    <div key={execution.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{execution.trigger}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(execution.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={
                          execution.status === MarketingAutomationExecutionStatus.COMPLETED 
                            ? 'bg-green-100 text-green-800'
                            : execution.status === MarketingAutomationExecutionStatus.FAILED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {execution.status}
                        </Badge>
                      </div>
                      {execution.error && (
                        <p className="text-sm text-red-600">Error: {execution.error}</p>
                      )}
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