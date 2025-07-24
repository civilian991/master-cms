'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings,
  RefreshCw,
  Filter,
  Calendar,
  Target,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause
} from 'lucide-react';

interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: string;
  reliabilityScore: number;
  isActive: boolean;
  lastChecked?: string;
}

interface DiscoveredContent {
  id: string;
  title: string;
  description?: string;
  url: string;
  sourceId: string;
  source: ContentSource;
  relevanceScore: number;
  qualityScore: number;
  status: string;
  createdAt: string;
}

interface ContentCuration {
  id: string;
  contentId: string;
  siteId: string;
  selected: boolean;
  priority: number;
  approvalStatus: string;
  content: DiscoveredContent;
  site: any;
}

interface ContentTrend {
  id: string;
  keyword: string;
  category?: string;
  volume: number;
  growth: number;
  momentum: number;
  sentiment?: number;
  detectedAt: string;
}

interface DiscoveryStats {
  totalSources: number;
  activeSources: number;
  discoveredContent: number;
  analyzedContent: number;
  curatedContent: number;
  averageRelevanceScore: number;
}

export default function ContentDiscoveryDashboard() {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [discoveredContent, setDiscoveredContent] = useState<DiscoveredContent[]>([]);
  const [curations, setCurations] = useState<ContentCuration[]>([]);
  const [trends, setTrends] = useState<ContentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all discovery data
      const [statsRes, sourcesRes, contentRes, curationsRes, trendsRes] = await Promise.all([
        fetch('/api/ai/discovery/stats'),
        fetch('/api/ai/discovery/sources'),
        fetch('/api/ai/discovery/content'),
        fetch('/api/ai/curation/content'),
        fetch('/api/ai/trends'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.sources || []);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setDiscoveredContent(contentData.content || []);
      }

      if (curationsRes.ok) {
        const curationsData = await curationsRes.json();
        setCurations(curationsData.curations || []);
      }

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData.trends || []);
      }
    } catch (err) {
      setError('Failed to fetch discovery data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerDiscovery = async () => {
    try {
      setDiscovering(true);
      const response = await fetch('/api/ai/discovery/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover' }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Discovery completed:', result);
        await fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Discovery failed');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      setError('Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const analyzeContent = async (contentIds: string[]) => {
    try {
      const response = await fetch('/api/ai/discovery/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze',
          contentIds 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Analysis completed:', result);
        await fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Analysis failed');
    }
  };

  const selectContentForCuration = async (contentId: string, siteId: string) => {
    try {
      const response = await fetch('/api/ai/curation/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'select',
          contentId,
          siteId 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Content selected:', result);
        await fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Content selection failed');
      }
    } catch (error) {
      console.error('Content selection error:', error);
      setError('Content selection failed');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 0.6) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'discovered':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'curated':
        return <Target className="h-4 w-4 text-purple-600" />;
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Discovery & Curation</h1>
          <p className="text-muted-foreground">
            Discover, analyze, and curate content from multiple sources
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={triggerDiscovery} 
            disabled={discovering}
            variant="outline"
          >
            {discovering ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {discovering ? 'Discovering...' : 'Discover Content'}
          </Button>
          <Button onClick={fetchDashboardData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSources}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSources} active sources
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discovered Content</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.discoveredContent}</div>
              <p className="text-xs text-muted-foreground">
                {stats.analyzedContent} analyzed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Curated Content</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.curatedContent}</div>
              <p className="text-xs text-muted-foreground">
                Average relevance: {(stats.averageRelevanceScore * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trends.length}</div>
              <p className="text-xs text-muted-foreground">
                Trending topics detected
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="discovery" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Discovery
          </TabsTrigger>
          <TabsTrigger value="curation" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Curation
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Sources</CardTitle>
              <CardDescription>
                Manage content sources for discovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${source.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">{source.url}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {source.type} • Reliability: {(source.reliabilityScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{source.type}</Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {sources.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No content sources configured
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discovery Tab */}
        <TabsContent value="discovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discovered Content</CardTitle>
              <CardDescription>
                Content discovered from configured sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discoveredContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(content.status)}
                      <div>
                        <p className="font-medium">{content.title}</p>
                        <p className="text-sm text-muted-foreground">{content.source.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Relevance: {(content.relevanceScore * 100).toFixed(1)}% • Quality: {(content.qualityScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${getScoreColor(content.relevanceScore)}`}>
                        {(content.relevanceScore * 100).toFixed(0)}
                      </div>
                      {getScoreBadge(content.relevanceScore)}
                      <Button 
                        size="sm" 
                        onClick={() => selectContentForCuration(content.id, 'default-site-id')}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
                {discoveredContent.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No content discovered yet. Click "Discover Content" to start.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Curation Tab */}
        <TabsContent value="curation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Curation</CardTitle>
              <CardDescription>
                Manage content selection and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {curations.map((curation) => (
                  <div key={curation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${curation.selected ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="font-medium">{curation.content.title}</p>
                        <p className="text-sm text-muted-foreground">{curation.site.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Priority: {curation.priority} • Source: {curation.content.source.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getApprovalStatusBadge(curation.approvalStatus)}
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
                {curations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No content curated yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Trends</CardTitle>
              <CardDescription>
                Trending topics and opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.map((trend) => (
                  <div key={trend.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{trend.keyword}</p>
                        <p className="text-sm text-muted-foreground">
                          {trend.category || 'General'} • Volume: {trend.volume}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Growth: {(trend.growth * 100).toFixed(1)}% • Momentum: {(trend.momentum * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${trend.growth > 0.2 ? 'text-green-600' : 'text-gray-600'}`}>
                        {(trend.growth * 100).toFixed(0)}%
                      </div>
                      <Badge variant={trend.growth > 0.2 ? "default" : "secondary"}>
                        {trend.growth > 0.2 ? "Trending" : "Stable"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {trends.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No trends detected yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 