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
  Users, 
  TrendingUp, 
  Search, 
  Plus, 
  Mail,
  MessageSquare,
  BarChart3,
  Filter,
  Download,
  Upload,
  Play,
  Settings,
  Target,
  Star,
  Globe,
  Calendar,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';

interface Influencer {
  id: string;
  name: string;
  email?: string;
  platform: string;
  handle: string;
  followers: number;
  engagement: number;
  score: number;
  status: string;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  campaigns: any[];
}

interface InfluencerCampaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  results?: Record<string, any>;
  createdAt: string;
  influencer: Influencer;
  createdUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface InfluencerAnalytics {
  totalInfluencers: number;
  activeInfluencers: number;
  totalFollowers: number;
  averageEngagement: number;
  topPerformingInfluencers: Array<{
    id: string;
    name: string;
    platform: string;
    followers: number;
    engagement: number;
    score: number;
  }>;
  platformBreakdown: Record<string, {
    count: number;
    totalFollowers: number;
    averageEngagement: number;
  }>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    influencerName: string;
    results: Record<string, any>;
    roi: number;
  }>;
}

interface DiscoveryResult {
  id: string;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  engagement: number;
  score: number;
  matchScore: number;
  suggestedOutreach: string;
}

export function InfluencerOutreachDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('influencers');
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [campaigns, setCampaigns] = useState<InfluencerCampaign[]>([]);
  const [analytics, setAnalytics] = useState<InfluencerAnalytics | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showCreateInfluencer, setShowCreateInfluencer] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  // Influencer form
  const [influencerName, setInfluencerName] = useState('');
  const [influencerEmail, setInfluencerEmail] = useState('');
  const [influencerPlatform, setInfluencerPlatform] = useState('');
  const [influencerHandle, setInfluencerHandle] = useState('');
  const [influencerFollowers, setInfluencerFollowers] = useState('');
  const [influencerEngagement, setInfluencerEngagement] = useState('');
  const [influencerTags, setInfluencerTags] = useState<string[]>([]);

  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');
  const [campaignInfluencerId, setCampaignInfluencerId] = useState('');

  // Discovery form
  const [discoveryPlatform, setDiscoveryPlatform] = useState('');
  const [discoveryMinFollowers, setDiscoveryMinFollowers] = useState('');
  const [discoveryMaxFollowers, setDiscoveryMaxFollowers] = useState('');
  const [discoveryMinEngagement, setDiscoveryMinEngagement] = useState('');
  const [discoveryTags, setDiscoveryTags] = useState<string[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInfluencers(),
        loadCampaigns(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load influencer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInfluencers = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);
      if (platformFilter) params.append('platform', platformFilter);

      const response = await fetch(`/api/influencer-outreach/influencers?${params}`);
      const data = await response.json();
      setInfluencers(data.influencers || []);
    } catch (error) {
      console.error('Failed to load influencers:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`/api/influencer-outreach/campaigns?siteId=${siteId}`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/influencer-outreach/analytics?siteId=${siteId}`);
      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const createInfluencer = async () => {
    if (!influencerName || !influencerPlatform || !influencerHandle) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/influencer-outreach/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: influencerName,
          email: influencerEmail || undefined,
          platform: influencerPlatform,
          handle: influencerHandle,
          followers: influencerFollowers ? parseInt(influencerFollowers) : 0,
          engagement: influencerEngagement ? parseFloat(influencerEngagement) : 0,
          tags: influencerTags.reduce((acc, tag) => ({ ...acc, [tag]: true }), {}),
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateInfluencer(false);
        resetInfluencerForm();
        loadInfluencers();
      } else {
        const error = await response.json();
        alert(`Failed to create influencer: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create influencer:', error);
      alert('Failed to create influencer');
    }
  };

  const createCampaign = async () => {
    if (!campaignName || !campaignInfluencerId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/influencer-outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          description: campaignDescription || undefined,
          startDate: campaignStartDate || undefined,
          endDate: campaignEndDate || undefined,
          budget: campaignBudget ? parseFloat(campaignBudget) : undefined,
          influencerId: campaignInfluencerId,
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

  const discoverInfluencers = async () => {
    try {
      const response = await fetch('/api/influencer-outreach/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: discoveryPlatform || undefined,
          minFollowers: discoveryMinFollowers ? parseInt(discoveryMinFollowers) : undefined,
          maxFollowers: discoveryMaxFollowers ? parseInt(discoveryMaxFollowers) : undefined,
          minEngagement: discoveryMinEngagement ? parseFloat(discoveryMinEngagement) : undefined,
          tags: discoveryTags,
          siteId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscoveryResults(data.discoveryResults || []);
        setShowDiscovery(true);
      } else {
        const error = await response.json();
        alert(`Failed to discover influencers: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to discover influencers:', error);
      alert('Failed to discover influencers');
    }
  };

  const deleteInfluencer = async (influencerId: string) => {
    if (!confirm('Are you sure you want to delete this influencer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/influencer-outreach/influencers/${influencerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadInfluencers();
      } else {
        const error = await response.json();
        alert(`Failed to delete influencer: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete influencer:', error);
      alert('Failed to delete influencer');
    }
  };

  const resetInfluencerForm = () => {
    setInfluencerName('');
    setInfluencerEmail('');
    setInfluencerPlatform('');
    setInfluencerHandle('');
    setInfluencerFollowers('');
    setInfluencerEngagement('');
    setInfluencerTags([]);
  };

  const resetCampaignForm = () => {
    setCampaignName('');
    setCampaignDescription('');
    setCampaignStartDate('');
    setCampaignEndDate('');
    setCampaignBudget('');
    setCampaignInfluencerId('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPlatformBadge = (platform: string) => {
    const platformConfig = {
      instagram: { color: 'bg-pink-100 text-pink-800', label: 'Instagram' },
      youtube: { color: 'bg-red-100 text-red-800', label: 'YouTube' },
      tiktok: { color: 'bg-black text-white', label: 'TikTok' },
      twitter: { color: 'bg-blue-100 text-blue-800', label: 'Twitter' },
      linkedin: { color: 'bg-blue-100 text-blue-800', label: 'LinkedIn' },
      facebook: { color: 'bg-blue-100 text-blue-800', label: 'Facebook' },
    };

    const config = platformConfig[platform.toLowerCase() as keyof typeof platformConfig] || platformConfig.twitter;
    return <Badge className={config.color}>{config.label}</Badge>;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredInfluencers = influencers.filter(influencer => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        influencer.name.toLowerCase().includes(searchLower) ||
        influencer.handle.toLowerCase().includes(searchLower) ||
        (influencer.email && influencer.email.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Influencer Outreach</h1>
          <p className="text-gray-600">Discover, manage, and collaborate with influencers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateInfluencer(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Influencer
          </Button>
          <Button variant="outline" onClick={() => setShowDiscovery(true)}>
            <Search className="mr-2 h-4 w-4" />
            Discover
          </Button>
          <Button variant="outline" onClick={() => setShowCreateCampaign(true)}>
            <Target className="mr-2 h-4 w-4" />
            New Campaign
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
                  <p className="text-sm font-medium text-gray-600">Total Influencers</p>
                  <p className="text-2xl font-bold">{analytics.totalInfluencers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Influencers</p>
                  <p className="text-2xl font-bold">{analytics.activeInfluencers}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Followers</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.totalFollowers)}</p>
                </div>
                <Globe className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                  <p className="text-2xl font-bold">{analytics.averageEngagement.toFixed(1)}%</p>
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
          <TabsTrigger value="influencers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Influencers
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="discovery" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Discovery
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Influencers Tab */}
        <TabsContent value="influencers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search influencers..."
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
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All platforms</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadInfluencers} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Influencer Form */}
          {showCreateInfluencer && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Influencer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <Input
                      value={influencerName}
                      onChange={(e) => setInfluencerName(e.target.value)}
                      placeholder="Enter influencer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={influencerEmail}
                      onChange={(e) => setInfluencerEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform *</label>
                    <Select value={influencerPlatform} onValueChange={setInfluencerPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Handle *</label>
                    <Input
                      value={influencerHandle}
                      onChange={(e) => setInfluencerHandle(e.target.value)}
                      placeholder="Enter handle/username"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Followers</label>
                    <Input
                      type="number"
                      value={influencerFollowers}
                      onChange={(e) => setInfluencerFollowers(e.target.value)}
                      placeholder="Enter follower count"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Engagement Rate (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={influencerEngagement}
                      onChange={(e) => setInfluencerEngagement(e.target.value)}
                      placeholder="Enter engagement rate"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createInfluencer}>Add Influencer</Button>
                  <Button variant="outline" onClick={() => setShowCreateInfluencer(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Influencers List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading influencers...</div>
            ) : filteredInfluencers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No influencers found</div>
            ) : (
              filteredInfluencers.map((influencer) => (
                <Card key={influencer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{influencer.name}</h3>
                          {getStatusBadge(influencer.status)}
                          {getPlatformBadge(influencer.platform)}
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="mr-1 h-3 w-3" />
                            {influencer.score}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {formatNumber(influencer.followers)} followers
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {influencer.engagement}% engagement
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {influencer.campaigns.length} campaigns
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          @{influencer.handle} • Added: {formatDate(influencer.createdAt)}
                          {influencer.email && <span className="ml-4">• {influencer.email}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Mail className="mr-1 h-3 w-3" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline">
                          <Target className="mr-1 h-3 w-3" />
                          Campaign
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInfluencer(influencer.id)}
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

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Influencer Campaigns</h2>
            <Button onClick={() => setShowCreateCampaign(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>

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
                    <label className="block text-sm font-medium mb-2">Influencer *</label>
                    <Select value={campaignInfluencerId} onValueChange={setCampaignInfluencerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select influencer" />
                      </SelectTrigger>
                      <SelectContent>
                        {influencers.map((influencer) => (
                          <SelectItem key={influencer.id} value={influencer.id}>
                            {influencer.name} (@{influencer.handle})
                          </SelectItem>
                        ))}
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
            {campaigns.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No campaigns found</div>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.influencer.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {campaign.budget ? formatCurrency(campaign.budget) : 'No budget'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {campaign.startDate && formatDate(campaign.startDate)}
                            {campaign.endDate && ` - ${formatDate(campaign.endDate)}`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {formatDate(campaign.createdAt)}
                          {campaign.createdUser && (
                            <span className="ml-4">by {campaign.createdUser.firstName} {campaign.createdUser.lastName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="mr-1 h-3 w-3" />
                          Manage
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="mr-1 h-3 w-3" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Discovery Tab */}
        <TabsContent value="discovery" className="space-y-4">
          <h2 className="text-xl font-bold">Influencer Discovery</h2>
          
          {/* Discovery Form */}
          <Card>
            <CardHeader>
              <CardTitle>Search Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <Select value={discoveryPlatform} onValueChange={setDiscoveryPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All platforms</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Engagement (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={discoveryMinEngagement}
                    onChange={(e) => setDiscoveryMinEngagement(e.target.value)}
                    placeholder="Enter minimum engagement"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Followers</label>
                  <Input
                    type="number"
                    value={discoveryMinFollowers}
                    onChange={(e) => setDiscoveryMinFollowers(e.target.value)}
                    placeholder="Enter minimum followers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Followers</label>
                  <Input
                    type="number"
                    value={discoveryMaxFollowers}
                    onChange={(e) => setDiscoveryMaxFollowers(e.target.value)}
                    placeholder="Enter maximum followers"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={discoverInfluencers}>
                  <Search className="mr-2 h-4 w-4" />
                  Discover Influencers
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Discovery Results */}
          {discoveryResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Discovery Results</h3>
              {discoveryResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{result.name}</h3>
                          {getPlatformBadge(result.platform)}
                          <Badge className="bg-green-100 text-green-800">
                            {result.matchScore}% match
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {formatNumber(result.followers)} followers
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {result.engagement}% engagement
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Score: {result.score}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          @{result.handle} • {result.suggestedOutreach}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="mr-1 h-3 w-3" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-bold">Influencer Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.platformBreakdown).map(([platform, data]) => (
                      <div key={platform} className="flex justify-between items-center">
                        <span className="capitalize">{platform}</span>
                        <div className="text-right">
                          <div className="font-medium">{data.count} influencers</div>
                          <div className="text-sm text-gray-500">
                            {formatNumber(data.totalFollowers)} followers • {data.averageEngagement.toFixed(1)}% engagement
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Influencers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topPerformingInfluencers.slice(0, 5).map((influencer) => (
                      <div key={influencer.id} className="flex justify-between items-center">
                        <span className="truncate">{influencer.name}</span>
                        <div className="text-right">
                          <div className="font-medium">{influencer.score} score</div>
                          <div className="text-sm text-gray-500">
                            {formatNumber(influencer.followers)} followers
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.campaignPerformance.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex justify-between items-center">
                        <span className="truncate">{campaign.name}</span>
                        <div className="text-right">
                          <div className="font-medium">{campaign.roi.toFixed(1)}% ROI</div>
                          <div className="text-sm text-gray-500">
                            {campaign.influencerName}
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
      </Tabs>
    </div>
  );
} 