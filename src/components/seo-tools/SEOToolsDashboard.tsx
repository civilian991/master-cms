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
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Plus, 
  Filter,
  Download,
  Upload,
  Play,
  Settings,
  Globe,
  Calendar,
  Activity,
  Zap,
  Lightbulb,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface SEOKeyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc?: number;
  position?: number;
  url?: string;
  status: string;
  createdAt: string;
}

interface SEOCompetitor {
  id: string;
  domain: string;
  name?: string;
  metrics?: Record<string, any>;
  keywords?: Record<string, any>;
  status: string;
  createdAt: string;
}

interface SEOAnalytics {
  totalKeywords: number;
  rankingKeywords: number;
  averagePosition: number;
  totalTraffic: number;
  topPerformingKeywords: Array<{
    keyword: string;
    position: number;
    searchVolume: number;
    traffic: number;
    ctr: number;
  }>;
  competitorAnalysis: Array<{
    domain: string;
    name: string;
    sharedKeywords: number;
    trafficShare: number;
    averagePosition: number;
  }>;
  performanceTrends: Array<{
    date: string;
    traffic: number;
    keywords: number;
    averagePosition: number;
  }>;
}

interface SEORecommendation {
  type: 'keyword' | 'content' | 'technical' | 'onpage' | 'offpage';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
  estimatedTraffic: number;
  estimatedConversions: number;
  actions: string[];
}

interface KeywordResearchResult {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  relatedKeywords?: string[];
}

export function SEOToolsDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('keywords');
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [competitors, setCompetitors] = useState<SEOCompetitor[]>([]);
  const [analytics, setAnalytics] = useState<SEOAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<SEORecommendation[]>([]);
  const [researchResults, setResearchResults] = useState<KeywordResearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showCreateKeyword, setShowCreateKeyword] = useState(false);
  const [showCreateCompetitor, setShowCreateCompetitor] = useState(false);
  const [showKeywordResearch, setShowKeywordResearch] = useState(false);
  const [showCompetitorAnalysis, setShowCompetitorAnalysis] = useState(false);

  // Keyword form
  const [keywordText, setKeywordText] = useState('');
  const [searchVolume, setSearchVolume] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [cpc, setCpc] = useState('');
  const [position, setPosition] = useState('');
  const [url, setUrl] = useState('');

  // Competitor form
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [competitorName, setCompetitorName] = useState('');

  // Research form
  const [researchQuery, setResearchQuery] = useState('');
  const [analysisDomain, setAnalysisDomain] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKeywords(),
        loadCompetitors(),
        loadAnalytics(),
        loadRecommendations(),
      ]);
    } catch (error) {
      console.error('Failed to load SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKeywords = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/seo-tools/keywords?${params}`);
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Failed to load keywords:', error);
    }
  };

  const loadCompetitors = async () => {
    try {
      const response = await fetch(`/api/seo-tools/competitors?siteId=${siteId}`);
      const data = await response.json();
      setCompetitors(data.competitors || []);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/seo-tools/analytics?siteId=${siteId}`);
      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/seo-tools/recommendations?siteId=${siteId}`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const createKeyword = async () => {
    if (!keywordText) {
      alert('Please enter a keyword');
      return;
    }

    try {
      const response = await fetch('/api/seo-tools/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keywordText,
          searchVolume: searchVolume ? parseInt(searchVolume) : 0,
          difficulty: difficulty ? parseInt(difficulty) : 0,
          cpc: cpc ? parseFloat(cpc) : undefined,
          position: position ? parseInt(position) : undefined,
          url: url || undefined,
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateKeyword(false);
        resetKeywordForm();
        loadKeywords();
      } else {
        const error = await response.json();
        alert(`Failed to create keyword: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create keyword:', error);
      alert('Failed to create keyword');
    }
  };

  const createCompetitor = async () => {
    if (!competitorDomain) {
      alert('Please enter a domain');
      return;
    }

    try {
      const response = await fetch('/api/seo-tools/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: competitorDomain,
          name: competitorName || undefined,
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateCompetitor(false);
        resetCompetitorForm();
        loadCompetitors();
      } else {
        const error = await response.json();
        alert(`Failed to create competitor: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create competitor:', error);
      alert('Failed to create competitor');
    }
  };

  const researchKeywords = async () => {
    if (!researchQuery) {
      alert('Please enter a research query');
      return;
    }

    try {
      const response = await fetch('/api/seo-tools/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: researchQuery,
          siteId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResearchResults(data.researchResults || []);
        setShowKeywordResearch(true);
      } else {
        const error = await response.json();
        alert(`Failed to research keywords: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to research keywords:', error);
      alert('Failed to research keywords');
    }
  };

  const analyzeCompetitor = async () => {
    if (!analysisDomain) {
      alert('Please enter a domain to analyze');
      return;
    }

    try {
      const response = await fetch('/api/seo-tools/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: analysisDomain,
          siteId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Analysis completed for ${analysisDomain}. Check the competitors tab for details.`);
        setShowCompetitorAnalysis(false);
        loadCompetitors();
      } else {
        const error = await response.json();
        alert(`Failed to analyze competitor: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to analyze competitor:', error);
      alert('Failed to analyze competitor');
    }
  };

  const resetKeywordForm = () => {
    setKeywordText('');
    setSearchVolume('');
    setDifficulty('');
    setCpc('');
    setPosition('');
    setUrl('');
  };

  const resetCompetitorForm = () => {
    setCompetitorDomain('');
    setCompetitorName('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      TARGETED: { color: 'bg-blue-100 text-blue-800', label: 'Targeted' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      low: { color: 'bg-green-100 text-green-800', label: 'Low' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      keyword: { color: 'bg-blue-100 text-blue-800', label: 'Keyword' },
      content: { color: 'bg-purple-100 text-purple-800', label: 'Content' },
      technical: { color: 'bg-orange-100 text-orange-800', label: 'Technical' },
      onpage: { color: 'bg-green-100 text-green-800', label: 'On-Page' },
      offpage: { color: 'bg-red-100 text-red-800', label: 'Off-Page' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.keyword;
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

  const filteredKeywords = keywords.filter(keyword => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return keyword.keyword.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Tools</h1>
          <p className="text-gray-600">Keyword research, competitor analysis, and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateKeyword(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Keyword
          </Button>
          <Button variant="outline" onClick={() => setShowKeywordResearch(true)}>
            <Search className="mr-2 h-4 w-4" />
            Research
          </Button>
          <Button variant="outline" onClick={() => setShowCreateCompetitor(true)}>
            <Users className="mr-2 h-4 w-4" />
            Add Competitor
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
                  <p className="text-sm font-medium text-gray-600">Total Keywords</p>
                  <p className="text-2xl font-bold">{analytics.totalKeywords}</p>
                </div>
                <Search className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ranking Keywords</p>
                  <p className="text-2xl font-bold">{analytics.rankingKeywords}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Position</p>
                  <p className="text-2xl font-bold">{analytics.averagePosition.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Traffic</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.totalTraffic)}</p>
                </div>
                <Globe className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Research
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search keywords..."
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
                      <SelectItem value="TARGETED">Targeted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadKeywords} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Keyword Form */}
          {showCreateKeyword && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Keyword</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Keyword *</label>
                    <Input
                      value={keywordText}
                      onChange={(e) => setKeywordText(e.target.value)}
                      placeholder="Enter keyword"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL</label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Enter target URL"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Search Volume</label>
                    <Input
                      type="number"
                      value={searchVolume}
                      onChange={(e) => setSearchVolume(e.target.value)}
                      placeholder="Enter search volume"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      placeholder="Enter difficulty (0-100)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CPC</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cpc}
                      onChange={(e) => setCpc(e.target.value)}
                      placeholder="Enter CPC"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Position</label>
                  <Input
                    type="number"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Enter current position"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createKeyword}>Add Keyword</Button>
                  <Button variant="outline" onClick={() => setShowCreateKeyword(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keywords List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading keywords...</div>
            ) : filteredKeywords.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No keywords found</div>
            ) : (
              filteredKeywords.map((keyword) => (
                <Card key={keyword.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{keyword.keyword}</h3>
                          {getStatusBadge(keyword.status)}
                          {keyword.position && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Position {keyword.position}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Search className="h-3 w-3" />
                            {formatNumber(keyword.searchVolume)} searches
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Difficulty: {keyword.difficulty}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {keyword.cpc ? formatCurrency(keyword.cpc) : 'No CPC'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {keyword.url || 'No URL'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Added: {formatDate(keyword.createdAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="mr-1 h-3 w-3" />
                          Track
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">SEO Competitors</h2>
            <Button onClick={() => setShowCreateCompetitor(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Competitor
            </Button>
          </div>

          {/* Create Competitor Form */}
          {showCreateCompetitor && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Competitor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Domain *</label>
                    <Input
                      value={competitorDomain}
                      onChange={(e) => setCompetitorDomain(e.target.value)}
                      placeholder="Enter competitor domain"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      value={competitorName}
                      onChange={(e) => setCompetitorName(e.target.value)}
                      placeholder="Enter competitor name"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCompetitor}>Add Competitor</Button>
                  <Button variant="outline" onClick={() => setShowCreateCompetitor(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitors List */}
          <div className="space-y-4">
            {competitors.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No competitors found</div>
            ) : (
              competitors.map((competitor) => (
                <Card key={competitor.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{competitor.domain}</h3>
                          {getStatusBadge(competitor.status)}
                        </div>
                        {competitor.name && (
                          <p className="text-sm text-gray-600 mb-2">{competitor.name}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Added: {formatDate(competitor.createdAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <BarChart3 className="mr-1 h-3 w-3" />
                          Analyze
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="mr-1 h-3 w-3" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-4">
          <h2 className="text-xl font-bold">Keyword Research</h2>
          
          {/* Research Form */}
          <Card>
            <CardHeader>
              <CardTitle>Research Keywords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Research Query</label>
                  <Input
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="Enter keyword to research"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={researchKeywords} className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Research Keywords
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Results */}
          {researchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Research Results</h3>
              {researchResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{result.keyword}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Search className="h-3 w-3" />
                            {formatNumber(result.searchVolume)} searches
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Difficulty: {result.difficulty}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatCurrency(result.cpc)}
                          </div>
                        </div>
                        {result.relatedKeywords && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Related Keywords:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.relatedKeywords.map((related, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {related}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Domain to Analyze</label>
                  <Input
                    value={analysisDomain}
                    onChange={(e) => setAnalysisDomain(e.target.value)}
                    placeholder="Enter competitor domain"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={analyzeCompetitor} className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analyze Competitor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <h2 className="text-xl font-bold">SEO Optimization Recommendations</h2>
          
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No recommendations available</div>
            ) : (
              recommendations.map((recommendation, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{recommendation.title}</h3>
                          {getPriorityBadge(recommendation.priority)}
                          {getTypeBadge(recommendation.type)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Impact: {recommendation.impact}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Effort: {recommendation.effort}%
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +{formatNumber(recommendation.estimatedTraffic)} traffic
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            +{formatNumber(recommendation.estimatedConversions)} conversions
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Recommended Actions:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {recommendation.actions.map((action, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <ArrowUp className="h-3 w-3 text-green-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Play className="mr-1 h-3 w-3" />
                          Implement
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="mr-1 h-3 w-3" />
                          Details
                        </Button>
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
          <h2 className="text-xl font-bold">SEO Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topPerformingKeywords.slice(0, 5).map((keyword, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="truncate">{keyword.keyword}</span>
                        <div className="text-right">
                          <div className="font-medium">Position {keyword.position}</div>
                          <div className="text-sm text-gray-500">
                            {formatNumber(keyword.traffic)} traffic
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.competitorAnalysis.slice(0, 5).map((competitor, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="truncate">{competitor.name}</span>
                        <div className="text-right">
                          <div className="font-medium">{competitor.sharedKeywords} keywords</div>
                          <div className="text-sm text-gray-500">
                            {competitor.trafficShare.toFixed(1)}% traffic share
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.performanceTrends.slice(-7).map((trend, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{trend.date}</span>
                        <div className="flex gap-4">
                          <span className="text-sm">{formatNumber(trend.traffic)} traffic</span>
                          <span className="text-sm">{trend.keywords} keywords</span>
                          <span className="text-sm">Pos {trend.averagePosition.toFixed(1)}</span>
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