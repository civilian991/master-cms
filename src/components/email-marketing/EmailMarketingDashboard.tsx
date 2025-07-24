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
  Mail, 
  Users, 
  BarChart3, 
  Zap, 
  Plus, 
  Send, 
  Calendar,
  TrendingUp,
  Eye,
  MousePointer,
  AlertTriangle,
  UserMinus
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface EmailSegment {
  id: string;
  name: string;
  description?: string;
  criteria: any[];
  createdAt: string;
}

interface EmailWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: any;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  createdAt: string;
}

interface EmailAnalytics {
  totalCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  averageOpenRate: number;
  averageClickRate: number;
}

export function EmailMarketingDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [segments, setSegments] = useState<EmailSegment[]>([]);
  const [workflows, setWorkflows] = useState<EmailWorkflow[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateSegment, setShowCreateSegment] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);

  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [campaignTemplate, setCampaignTemplate] = useState('');
  const [campaignScheduledAt, setCampaignScheduledAt] = useState('');
  const [recipientList, setRecipientList] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCampaigns(),
        loadSegments(),
        loadWorkflows(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load email marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`/api/email-marketing/campaigns?siteId=${siteId}`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadSegments = async () => {
    try {
      const response = await fetch(`/api/email-marketing/segments?siteId=${siteId}`);
      const data = await response.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error('Failed to load segments:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`/api/email-marketing/workflows?siteId=${siteId}`);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/email-marketing/analytics?siteId=${siteId}`);
      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const createCampaign = async () => {
    if (!campaignName || !campaignSubject || !campaignContent) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/email-marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          subject: campaignSubject,
          content: campaignContent,
          template: campaignTemplate || undefined,
          siteId,
          scheduledAt: campaignScheduledAt || undefined,
          recipientList: recipientList ? recipientList.split(',').map(e => e.trim()) : undefined,
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

  const sendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) {
      return;
    }

    try {
      const response = await fetch(`/api/email-marketing/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        loadCampaigns();
        alert('Campaign sent successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to send campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const response = await fetch(`/api/email-marketing/campaigns/${campaignId}`, {
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
    setCampaignSubject('');
    setCampaignContent('');
    setCampaignTemplate('');
    setCampaignScheduledAt('');
    setRecipientList('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      SCHEDULED: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      SENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Sending' },
      SENT: { color: 'bg-green-100 text-green-800', label: 'Sent' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-gray-600">Manage your email campaigns, segments, and automation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateCampaign(true)}>
            <Plus className="mr-2 h-4 w-4" />
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
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold">{analytics.totalCampaigns}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold">{analytics.totalSent.toLocaleString()}</p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold">{analytics.averageOpenRate.toFixed(1)}%</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold">{analytics.averageClickRate.toFixed(1)}%</p>
                </div>
                <MousePointer className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {showCreateCampaign && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name</label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject Line</label>
                    <Input
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="Enter subject line"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    value={campaignContent}
                    onChange={(e) => setCampaignContent(e.target.value)}
                    placeholder="Enter email content (HTML supported)"
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Template (Optional)</label>
                    <Input
                      value={campaignTemplate}
                      onChange={(e) => setCampaignTemplate(e.target.value)}
                      placeholder="Template ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={campaignScheduledAt}
                      onChange={(e) => setCampaignScheduledAt(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Recipients (Optional)</label>
                  <Textarea
                    value={recipientList}
                    onChange={(e) => setRecipientList(e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    rows={2}
                  />
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

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
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
                        <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Recipients:</span>
                            <span className="ml-1 font-medium">{campaign.recipientCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Opened:</span>
                            <span className="ml-1 font-medium">{campaign.openCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Clicked:</span>
                            <span className="ml-1 font-medium">{campaign.clickCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Bounced:</span>
                            <span className="ml-1 font-medium">{campaign.bounceCount}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {formatDate(campaign.createdAt)}
                          {campaign.scheduledAt && (
                            <span className="ml-4">
                              Scheduled: {formatDate(campaign.scheduledAt)}
                            </span>
                          )}
                          {campaign.sentAt && (
                            <span className="ml-4">
                              Sent: {formatDate(campaign.sentAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() => sendCampaign(campaign.id)}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Send
                          </Button>
                        )}
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

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Email Segments</h2>
            <Button onClick={() => setShowCreateSegment(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Segment
            </Button>
          </div>

          <div className="space-y-4">
            {segments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No segments found</div>
            ) : (
              segments.map((segment) => (
                <Card key={segment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{segment.name}</h3>
                        {segment.description && (
                          <p className="text-sm text-gray-600 mt-1">{segment.description}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {formatDate(segment.createdAt)}
                        </div>
                      </div>
                      <Badge variant="outline">{segment.criteria.length} criteria</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Email Automation</h2>
            <Button onClick={() => setShowCreateWorkflow(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>

          <div className="space-y-4">
            {workflows.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No workflows found</div>
            ) : (
              workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge className={workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {workflow.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Created: {formatDate(workflow.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Trigger: {workflow.trigger?.type}</div>
                        <div className="text-sm text-gray-500">{workflow.actions.length} actions</div>
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
          <h2 className="text-xl font-bold">Email Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Sent</span>
                      <span className="font-medium">{analytics.totalSent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Opened</span>
                      <span className="font-medium">{analytics.totalOpened.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Clicked</span>
                      <span className="font-medium">{analytics.totalClicked.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Bounced</span>
                      <span className="font-medium">{analytics.totalBounced.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Open Rate</span>
                      <span className="font-medium">{analytics.averageOpenRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Click Rate</span>
                      <span className="font-medium">{analytics.averageClickRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounce Rate</span>
                      <span className="font-medium">
                        {analytics.totalSent > 0 ? ((analytics.totalBounced / analytics.totalSent) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
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