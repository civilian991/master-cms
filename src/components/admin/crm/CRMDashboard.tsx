'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CalendarIcon, Plus, Search, Filter, Download, Upload, BarChart3, Users, Target, MessageSquare, Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CRMData {
  leads: any[];
  contacts: any[];
  deals: any[];
  interactions: any[];
  campaigns: any[];
  tasks: any[];
  workflows: any[];
  analytics: any;
}

interface CRMDashboardProps {
  siteId: string;
}

export function CRMDashboard({ siteId }: CRMDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<CRMData>({
    leads: [],
    contacts: [],
    deals: [],
    interactions: [],
    campaigns: [],
    tasks: [],
    workflows: [],
    analytics: null,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    assignedTo: '',
    dateRange: { start: '', end: '' },
  });

  useEffect(() => {
    loadCRMData();
  }, [siteId]);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      const [leads, contacts, deals, interactions, campaigns, tasks, workflows, analytics] = await Promise.all([
        fetch(`/api/admin/crm?resource=leads&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=contacts&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=deals&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=interactions&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=campaigns&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=tasks&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=workflows&siteId=${siteId}`).then(res => res.json()),
        fetch(`/api/admin/crm?resource=analytics&siteId=${siteId}`).then(res => res.json()),
      ]);

      setData({
        leads: leads.error ? [] : leads,
        contacts: contacts.error ? [] : contacts,
        deals: deals.error ? [] : deals,
        interactions: interactions.error ? [] : interactions,
        campaigns: campaigns.error ? [] : campaigns,
        tasks: tasks.error ? [] : tasks,
        workflows: workflows.error ? [] : workflows,
        analytics: analytics.error ? null : analytics,
      });
    } catch (error) {
      console.error('Error loading CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      PROPOSAL_SENT: 'bg-purple-100 text-purple-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      CONVERTED: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
      DISQUALIFIED: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PROSPECT: 'bg-blue-100 text-blue-800',
      CUSTOMER: 'bg-green-100 text-green-800',
      PARTNER: 'bg-purple-100 text-purple-800',
      VENDOR: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DEFERRED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships, leads, and sales pipeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leads.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.leads.filter(lead => lead.status === 'CONVERTED').length} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.contacts.filter(contact => contact.status === 'CUSTOMER').length} customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.deals
                .filter(deal => !deal.isWon && !deal.isLost)
                .reduce((sum, deal) => sum + Number(deal.value), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.deals.filter(deal => !deal.isWon && !deal.isLost).length} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.tasks.filter(task => task.status !== 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.tasks.filter(task => task.status === 'URGENT').length} urgent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.interactions.slice(0, 5).map((interaction) => (
                    <div key={interaction.id} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {interaction.lead?.firstName} {interaction.lead?.lastName} ||
                          {interaction.contact?.firstName} {interaction.contact?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {interaction.type} - {interaction.subject}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interaction.createdAt), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.tasks
                    .filter(task => task.status !== 'COMPLETED' && task.dueDate)
                    .slice(0, 5)
                    .map((task) => (
                      <div key={task.id} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {data.analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.analytics.overview?.leadConversionRate?.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Lead Conversion Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.analytics.overview?.dealWinRate?.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Deal Win Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {data.analytics.overview?.totalInteractions}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Interactions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.analytics.overview?.totalCampaigns}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search leads..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>Manage and track your leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <p className="text-sm text-muted-foreground">{lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                      <Badge variant="outline">Score: {lead.score}</Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search contacts..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>Manage your contact database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        <p className="text-sm text-muted-foreground">{contact.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(contact.status)}>{contact.status}</Badge>
                      <Badge variant="outline">Score: {contact.score}</Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search deals..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deals</CardTitle>
              <CardDescription>Track your sales pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{deal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {deal.contact?.firstName} {deal.contact?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{deal.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(deal.stage)}>{deal.stage}</Badge>
                      <Badge variant="outline">${deal.value.toLocaleString()}</Badge>
                      <Badge variant="outline">{deal.probability}%</Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search interactions..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Interaction
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Interactions</CardTitle>
              <CardDescription>Track all customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.interactions.map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{interaction.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {interaction.lead?.firstName} {interaction.lead?.lastName} ||
                          {interaction.contact?.firstName} {interaction.contact?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{interaction.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{interaction.type}</Badge>
                      <Badge variant="outline">{interaction.channel}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(interaction.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search campaigns..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Manage your marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.leads?.length || 0} leads, {campaign.contacts?.length || 0} contacts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                      <Badge variant="outline">{campaign.type}</Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search tasks..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage your follow-up tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.lead?.firstName} {task.lead?.lastName} ||
                          {task.contact?.firstName} {task.contact?.lastName} ||
                          {task.deal?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      {task.dueDate && (
                        <span className="text-sm text-muted-foreground">
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search workflows..." className="w-64" />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Automate your CRM processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {workflow.executionCount} executions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
                      <Badge variant="outline">{workflow.type}</Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
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