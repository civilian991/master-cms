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
  Megaphone, 
  TrendingUp, 
  Target, 
  Zap, 
  Plus, 
  Copy,
  Play,
  Pause,
  Stop,
  Settings,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Lightbulb,
  Activity
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  spent: number;
  targetAudience?: Record<string, any>;
  channels: string[];
  goals?: Record<string, any>;
  createdAt: string;
  createdUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  leads: any[];
  emails: any[];
  socialPosts: any[];
  analytics: any[];
}

interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  averageROI: number;
  channelPerformance: Record<string, {
    campaigns: number;
    spend: number;
    conversions: number;
    roi: number;
  }>;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    roi: number;
    conversions: number;
    spend: number;
  }>;
}

interface CampaignPerformance {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roi: number;
}

interface OptimizationRecommendation {
  type: 'budget' | 'targeting' | 'creative' | 'timing' | 'channel';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: number;
  action: string;
  data: Record<string, any>;
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  isActive: boolean;
  triggers: any[];
  actions: any[];
  createdAt: string;
  createdUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function CampaignManagementDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateAutomation, setShowCreateAutomation] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');
  const [campaignChannels, setCampaignChannels] = useState<string[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCampaigns(),
        loadAutomations(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/campaign-management/campaigns?${params}`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadAutomations = async () => {
    try {
      const response = await fetch(`/api/campaign-management/automations?siteId=${siteId}`);
      const data = await response.json();
      setAutomations(data.automations || []);
    } catch (error) {
      console.error('Failed to load automations:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/campaign-management/analytics?siteId=${siteId}`);
      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const createCampaign = async () => {
    if (!campaignName || !campaignType || campaignChannels.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/campaign-management/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          description: campaignDescription || undefined,
          type: campaignType,
          startDate: campaignStartDate || undefined,
          endDate: campaignEndDate || undefined,
          budget: campaignBudget ? parseFloat(campaignBudget) : undefined,
          channels: campaignChannels,
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateCampaign(false);
        resetCampaignForm();
        loadCampaigns();
      } else {
        const error = await response.json();
        alert(`Failed to create campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/api/campaign-management/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadCampaigns();
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      alert('Failed to update campaign status');
    }
  };

  const duplicateCampaign = async (campaignId: string) => {
    const newName = prompt('Enter new campaign name:');
    if (!newName) return;

    try {
      const response = await fetch(`/api/campaign-management/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });

      if (response.ok) {
        loadCampaigns();
        alert('Campaign duplicated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to duplicate campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
      alert('Failed to duplicate campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const response = await fetch(`/api/campaign-management/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCampaigns();
      } else {
        const error = await response.json();
        alert(`Failed to delete campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const resetCampaignForm = () => {
    setCampaignName('');
    setCampaignDescription('');
    setCampaignType('');
    setCampaignStartDate('');
    setCampaignEndDate('');
    setCampaignBudget('');
    setCampaignChannels([]);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      AWARENESS: { color: 'bg-purple-100 text-purple-800', label: 'Awareness' },
      CONSIDERATION: { color: 'bg-blue-100 text-blue-800', label: 'Consideration' },
      CONVERSION: { color: 'bg-green-100 text-green-800', label: 'Conversion' },
      RETENTION: { color: 'bg-orange-100 text-orange-800', label: 'Retention' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.AWARENESS;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(searchLower) ||
        (campaign.description && campaign.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-gray-600">Manage multi-channel marketing campaigns and automation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateCampaign(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
          <Button variant="outline" onClick={() => setShowCreateAutomation(true)}>
            <Zap className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold">{analytics.totalCampaigns}</p>
                </div>
                <Megaphone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold">{analytics.activeCampaigns}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spend</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalSpend)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg ROI</p>
                  <p className="text-2xl font-bold">{analytics.averageROI.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="AWARENESS">Awareness</SelectItem>
                      <SelectItem value="CONSIDERATION">Consideration</SelectItem>
                      <SelectItem value="CONVERSION">Conversion</SelectItem>
                      <SelectItem value="RETENTION">Retention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadCampaigns} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Campaign Form */}
          {showCreateCampaign && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Type *</label>
                    <Select value={campaignType} onValueChange={setCampaignType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AWARENESS">Awareness</SelectItem>
                        <SelectItem value="CONSIDERATION">Consideration</SelectItem>
                        <SelectItem value="CONVERSION">Conversion</SelectItem>
                        <SelectItem value="RETENTION">Retention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Enter campaign description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={campaignStartDate}
                      onChange={(e) => setCampaignStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Input
                      type="date"
                      value={campaignEndDate}
                      onChange={(e) => setCampaignEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget</label>
                    <Input
                      type="number"
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                      placeholder="Enter budget"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Channels *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['email', 'social', 'ads', 'content'].map((channel) => (
                      <label key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={campaignChannels.includes(channel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCampaignChannels([...campaignChannels, channel]);
                            } else {
                              setCampaignChannels(campaignChannels.filter(c => c !== channel));
                            }
                          }}
                        />
                        <span className="capitalize">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCampaign}>Create Campaign</Button>
                  <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaigns List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading campaigns...</div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No campaigns found</div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          {getTypeBadge(campaign.type)}
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(campaign.spent)}
                            {campaign.budget && ` / ${formatCurrency(campaign.budget)}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.leads.length} leads
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {campaign.startDate && formatDate(campaign.startDate)}
                            {campaign.endDate && ` - ${formatDate(campaign.endDate)}`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Channels: {campaign.channels.join(', ')} • Created: {formatDate(campaign.createdAt)}
                          {campaign.createdUser && (
                            <span className="ml-4">by {campaign.createdUser.firstName} {campaign.createdUser.lastName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() => updateCampaignStatus(campaign.id, 'ACTIVE')}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Activate
                          </Button>
                        )}
                        {campaign.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCampaignStatus(campaign.id, 'PAUSED')}
                          >
                            <Pause className="mr-1 h-3 w-3" />
                            Pause
                          </Button>
                        )}
                        {campaign.status === 'PAUSED' && (
                          <Button
                            size="sm"
                            onClick={() => updateCampaignStatus(campaign.id, 'ACTIVE')}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Resume
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateCampaign(campaign.id)}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCampaign(campaign.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Campaign Automations</h2>
            <Button onClick={() => setShowCreateAutomation(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </div>

          <div className="space-y-4">
            {automations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No automations found</div>
            ) : (
              automations.map((automation) => (
                <Card key={automation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{automation.name}</h3>
                          <Badge className={automation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {automation.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {automation.description && (
                          <p className="text-sm text-gray-600 mb-2">{automation.description}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Created: {formatDate(automation.createdAt)}
                          {automation.createdUser && (
                            <span className="ml-4">by {automation.createdUser.firstName} {automation.createdUser.lastName}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{automation.triggers.length} triggers</div>
                        <div className="text-sm text-gray-500">{automation.actions.length} actions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-bold">Campaign Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.channelPerformance).map(([channel, data]) => (
                      <div key={channel} className="flex justify-between items-center">
                        <span className="capitalize">{channel}</span>
                        <div className="text-right">
                          <div className="font-medium">{data.campaigns} campaigns</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(data.spend)} • {data.roi.toFixed(1)}% ROI
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topPerformingCampaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex justify-between items-center">
                        <span className="truncate">{campaign.name}</span>
                        <div className="text-right">
                          <div className="font-medium">{campaign.roi.toFixed(1)}% ROI</div>
                          <div className="text-sm text-gray-500">
                            {campaign.conversions} conversions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <h2 className="text-xl font-bold">Campaign Optimization</h2>
          
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No campaigns available for optimization</div>
            ) : (
              campaigns.slice(0, 5).map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      {campaign.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 mb-4">
                      Click to view optimization recommendations for this campaign
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // In a real implementation, this would fetch and display recommendations
                        alert(`Optimization recommendations for ${campaign.name} would be displayed here`);
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      View Recommendations
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 