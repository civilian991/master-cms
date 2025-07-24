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
  Target, 
  Zap, 
  Plus, 
  Download, 
  Upload,
  Filter,
  Search,
  UserCheck,
  UserX,
  DollarSign,
  Calendar,
  Building,
  Mail,
  Phone
} from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  budget?: string;
  timeline?: string;
  source: string;
  score: number;
  status: string;
  assignedTo?: string;
  assignedUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  lastContacted?: string;
  nextFollowUp?: string;
  createdAt: string;
  interactions: any[];
  tasks: any[];
}

interface LeadAnalytics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  averageScore: number;
  conversionRate: number;
  sourceBreakdown: Record<string, number>;
  industryBreakdown: Record<string, number>;
  timeToConversion: number;
}

interface NurturingWorkflow {
  id: string;
  name: string;
  description?: string;
  triggers: any[];
  actions: any[];
  isActive: boolean;
  createdAt: string;
}

export function LeadGenerationDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [workflows, setWorkflows] = useState<NurturingWorkflow[]>([]);
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [showImportLeads, setShowImportLeads] = useState(false);

  // Lead form
  const [leadFirstName, setLeadFirstName] = useState('');
  const [leadLastName, setLeadLastName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadJobTitle, setLeadJobTitle] = useState('');
  const [leadWebsite, setLeadWebsite] = useState('');
  const [leadIndustry, setLeadIndustry] = useState('');
  const [leadCompanySize, setLeadCompanySize] = useState('');
  const [leadBudget, setLeadBudget] = useState('');
  const [leadTimeline, setLeadTimeline] = useState('');
  const [leadSource, setLeadSource] = useState('website');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLeads(),
        loadWorkflows(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load lead generation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (scoreFilter) {
        const [min, max] = scoreFilter.split('-');
        if (min) params.append('minScore', min);
        if (max) params.append('maxScore', max);
      }

      const response = await fetch(`/api/lead-generation/leads?${params}`);
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`/api/lead-generation/workflows?siteId=${siteId}`);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/lead-generation/analytics?siteId=${siteId}`);
      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const createLead = async () => {
    if (!leadFirstName || !leadLastName || !leadEmail) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/lead-generation/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: leadFirstName,
          lastName: leadLastName,
          email: leadEmail,
          phone: leadPhone || undefined,
          company: leadCompany || undefined,
          jobTitle: leadJobTitle || undefined,
          website: leadWebsite || undefined,
          industry: leadIndustry || undefined,
          companySize: leadCompanySize || undefined,
          budget: leadBudget || undefined,
          timeline: leadTimeline || undefined,
          source: leadSource,
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateLead(false);
        resetLeadForm();
        loadLeads();
      } else {
        const error = await response.json();
        alert(`Failed to create lead: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
      alert('Failed to create lead');
    }
  };

  const updateLeadScore = async (leadId: string, scoreChange: number, reason?: string) => {
    try {
      const response = await fetch(`/api/lead-generation/leads/${leadId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreChange, reason }),
      });

      if (response.ok) {
        loadLeads();
      } else {
        const error = await response.json();
        alert(`Failed to update score: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update lead score:', error);
      alert('Failed to update lead score');
    }
  };

  const qualifyLead = async (leadId: string, isQualified: boolean) => {
    try {
      const response = await fetch(`/api/lead-generation/leads/${leadId}/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isQualified }),
      });

      if (response.ok) {
        loadLeads();
      } else {
        const error = await response.json();
        alert(`Failed to qualify lead: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to qualify lead:', error);
      alert('Failed to qualify lead');
    }
  };

  const convertLead = async (leadId: string) => {
    const dealValue = prompt('Enter deal value (optional):');
    const dealName = prompt('Enter deal name (optional):');

    try {
      const response = await fetch(`/api/lead-generation/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealValue: dealValue ? parseFloat(dealValue) : undefined,
          dealName: dealName || undefined,
        }),
      });

      if (response.ok) {
        loadLeads();
        alert('Lead converted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to convert lead: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to convert lead:', error);
      alert('Failed to convert lead');
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lead-generation/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadLeads();
      } else {
        const error = await response.json();
        alert(`Failed to delete lead: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('Failed to delete lead');
    }
  };

  const exportLeads = async () => {
    try {
      const params = new URLSearchParams({ siteId, format: 'csv' });
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const response = await fetch(`/api/lead-generation/import-export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export leads');
      }
    } catch (error) {
      console.error('Failed to export leads:', error);
      alert('Failed to export leads');
    }
  };

  const resetLeadForm = () => {
    setLeadFirstName('');
    setLeadLastName('');
    setLeadEmail('');
    setLeadPhone('');
    setLeadCompany('');
    setLeadJobTitle('');
    setLeadWebsite('');
    setLeadIndustry('');
    setLeadCompanySize('');
    setLeadBudget('');
    setLeadTimeline('');
    setLeadSource('website');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { color: 'bg-blue-100 text-blue-800', label: 'New' },
      QUALIFIED: { color: 'bg-green-100 text-green-800', label: 'Qualified' },
      DISQUALIFIED: { color: 'bg-red-100 text-red-800', label: 'Disqualified' },
      CONVERTED: { color: 'bg-purple-100 text-purple-800', label: 'Converted' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NEW;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getScoreBadge = (score: number) => {
    let color = 'bg-gray-100 text-gray-800';
    if (score >= 80) color = 'bg-green-100 text-green-800';
    else if (score >= 60) color = 'bg-yellow-100 text-yellow-800';
    else if (score >= 40) color = 'bg-orange-100 text-orange-800';
    else color = 'bg-red-100 text-red-800';

    return <Badge className={color}>{score}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredLeads = leads.filter(lead => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        lead.firstName.toLowerCase().includes(searchLower) ||
        lead.lastName.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Generation</h1>
          <p className="text-gray-600">Manage leads, scoring, nurturing, and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateLead(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
          <Button variant="outline" onClick={() => setShowImportLeads(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={exportLeads}>
            <Download className="mr-2 h-4 w-4" />
            Export
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
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{analytics.totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                  <p className="text-2xl font-bold">{analytics.qualifiedLeads}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold">{analytics.averageScore.toFixed(0)}</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Nurturing
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search leads..."
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
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="DISQUALIFIED">Disqualified</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All sources</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Score Range</label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All scores</SelectItem>
                      <SelectItem value="80-100">80-100 (Hot)</SelectItem>
                      <SelectItem value="60-79">60-79 (Warm)</SelectItem>
                      <SelectItem value="40-59">40-59 (Cool)</SelectItem>
                      <SelectItem value="0-39">0-39 (Cold)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Lead Form */}
          {showCreateLead && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name *</label>
                    <Input
                      value={leadFirstName}
                      onChange={(e) => setLeadFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name *</label>
                    <Input
                      value={leadLastName}
                      onChange={(e) => setLeadLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="Enter phone"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <Input
                      value={leadCompany}
                      onChange={(e) => setLeadCompany(e.target.value)}
                      placeholder="Enter company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Title</label>
                    <Input
                      value={leadJobTitle}
                      onChange={(e) => setLeadJobTitle(e.target.value)}
                      placeholder="Enter job title"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <Input
                      value={leadWebsite}
                      onChange={(e) => setLeadWebsite(e.target.value)}
                      placeholder="Enter website"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Industry</label>
                    <Select value={leadIndustry} onValueChange={setLeadIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Size</label>
                    <Select value={leadCompanySize} onValueChange={setLeadCompanySize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-1000">201-1000</SelectItem>
                        <SelectItem value="1000+">1000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget</label>
                    <Select value={leadBudget} onValueChange={setLeadBudget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<$10k">&lt;$10k</SelectItem>
                        <SelectItem value="$10k-$50k">$10k-$50k</SelectItem>
                        <SelectItem value="$50k-$100k">$50k-$100k</SelectItem>
                        <SelectItem value="$100k+">$100k+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timeline</label>
                    <Select value={leadTimeline} onValueChange={setLeadTimeline}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="1-3 months">1-3 months</SelectItem>
                        <SelectItem value="3-6 months">3-6 months</SelectItem>
                        <SelectItem value="6+ months">6+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <Select value={leadSource} onValueChange={setLeadSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createLead}>Create Lead</Button>
                  <Button variant="outline" onClick={() => setShowCreateLead(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leads List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No leads found</div>
            ) : (
              filteredLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{lead.firstName} {lead.lastName}</h3>
                          {getStatusBadge(lead.status)}
                          {getScoreBadge(lead.score)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.company && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.company}
                            </div>
                          )}
                          {lead.jobTitle && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {lead.jobTitle}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Source: {lead.source} • Created: {formatDate(lead.createdAt)}
                          {lead.lastContacted && (
                            <span className="ml-4">Last contacted: {formatDate(lead.lastContacted)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {lead.status === 'NEW' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => qualifyLead(lead.id, true)}
                            >
                              <UserCheck className="mr-1 h-3 w-3" />
                              Qualify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => qualifyLead(lead.id, false)}
                            >
                              <UserX className="mr-1 h-3 w-3" />
                              Disqualify
                            </Button>
                          </>
                        )}
                        {lead.status === 'QUALIFIED' && (
                          <Button
                            size="sm"
                            onClick={() => convertLead(lead.id)}
                          >
                            <DollarSign className="mr-1 h-3 w-3" />
                            Convert
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteLead(lead.id)}
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

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Lead Nurturing Workflows</h2>
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
                        <div className="text-sm text-gray-500">{workflow.triggers.length} triggers</div>
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
          <h2 className="text-xl font-bold">Lead Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.sourceBreakdown).map(([source, count]) => (
                      <div key={source} className="flex justify-between">
                        <span className="capitalize">{source}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Industries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.industryBreakdown).map(([industry, count]) => (
                      <div key={industry} className="flex justify-between">
                        <span>{industry}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>New Leads</span>
                      <span className="font-medium">{analytics.newLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Qualified Leads</span>
                      <span className="font-medium">{analytics.qualifiedLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Converted Leads</span>
                      <span className="font-medium">{analytics.convertedLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Time to Conversion</span>
                      <span className="font-medium">{analytics.timeToConversion.toFixed(1)} days</span>
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