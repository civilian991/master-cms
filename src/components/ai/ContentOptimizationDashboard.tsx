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
  Image, 
  Zap, 
  Eye, 
  FileText, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target
} from 'lucide-react';

interface OptimizationStats {
  totalOptimizations: number;
  averageScore: number;
  issuesFound: number;
  optimizationsCompleted: number;
  pendingOptimizations: number;
}

interface SeoOptimization {
  id: string;
  contentId: string;
  contentType: string;
  metaTitle: string;
  metaDescription: string;
  score: number;
  status: string;
  optimizedAt: string;
}

interface ImageOptimization {
  id: string;
  originalUrl: string;
  optimizedSize: number;
  compressionRatio: number;
  score: number;
  status: string;
  optimizedAt: string;
}

interface PerformanceMetrics {
  id: string;
  url: string;
  lcp: number;
  fid: number;
  cls: number;
  score: number;
  status: string;
  recordedAt: string;
}

interface AccessibilityAudit {
  id: string;
  url: string;
  level: string;
  violations: number;
  warnings: number;
  score: number;
  status: string;
  auditedAt: string;
}

interface ContentQualityAnalysis {
  id: string;
  contentId: string;
  readabilityScore: number;
  structureScore: number;
  engagementScore: number;
  overallScore: number;
  status: string;
  analyzedAt: string;
}

interface OptimizationTrigger {
  id: string;
  name: string;
  triggerType: string;
  isActive: boolean;
  priority: string;
  createdAt: string;
}

export default function ContentOptimizationDashboard() {
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const [seoOptimizations, setSeoOptimizations] = useState<SeoOptimization[]>([]);
  const [imageOptimizations, setImageOptimizations] = useState<ImageOptimization[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [accessibilityAudits, setAccessibilityAudits] = useState<AccessibilityAudit[]>([]);
  const [qualityAnalyses, setQualityAnalyses] = useState<ContentQualityAnalysis[]>([]);
  const [triggers, setTriggers] = useState<OptimizationTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all optimization data
      const [statsRes, seoRes, imagesRes, perfRes, accRes, qualityRes, triggersRes] = await Promise.all([
        fetch('/api/ai/optimization/stats'),
        fetch('/api/ai/optimization/seo'),
        fetch('/api/ai/optimization/images'),
        fetch('/api/ai/optimization/performance'),
        fetch('/api/ai/optimization/accessibility'),
        fetch('/api/ai/optimization/quality'),
        fetch('/api/ai/optimization/triggers'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (seoRes.ok) {
        const seoData = await seoRes.json();
        setSeoOptimizations(seoData.optimizations || []);
      }

      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImageOptimizations(imagesData.optimizations || []);
      }

      if (perfRes.ok) {
        const perfData = await perfRes.json();
        setPerformanceMetrics(perfData.metrics || []);
      }

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccessibilityAudits(accData.audits || []);
      }

      if (qualityRes.ok) {
        const qualityData = await qualityRes.json();
        setQualityAnalyses(qualityData.analyses || []);
      }

      if (triggersRes.ok) {
        const triggersData = await triggersRes.json();
        setTriggers(triggersData.triggers || []);
      }
    } catch (err) {
      setError('Failed to fetch optimization data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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
          <h1 className="text-3xl font-bold tracking-tight">Content Optimization</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your content for SEO, performance, and accessibility
          </p>
        </div>
        <Button onClick={fetchDashboardData}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Optimizations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOptimizations}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.optimizationsCompleted} this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
              <Progress value={stats.averageScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.issuesFound}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOptimizations} pending fixes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOptimizations > 0 
                  ? Math.round((stats.optimizationsCompleted / stats.totalOptimizations) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.optimizationsCompleted} completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Triggers
          </TabsTrigger>
        </TabsList>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Optimizations</CardTitle>
              <CardDescription>
                Monitor and manage SEO optimizations for your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoOptimizations.map((seo) => (
                  <div key={seo.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(seo.status)}
                      <div>
                        <p className="font-medium">{seo.metaTitle}</p>
                        <p className="text-sm text-muted-foreground">{seo.contentType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${getScoreColor(seo.score)}`}>
                        {seo.score}
                      </div>
                      {getScoreBadge(seo.score)}
                    </div>
                  </div>
                ))}
                {seoOptimizations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No SEO optimizations found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Optimizations</CardTitle>
              <CardDescription>
                Track image compression and optimization results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imageOptimizations.map((img) => (
                  <div key={img.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(img.status)}
                      <div>
                        <p className="font-medium">Image Optimization</p>
                        <p className="text-sm text-muted-foreground">
                          {img.compressionRatio.toFixed(1)}% compression
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${getScoreColor(img.score)}`}>
                        {img.score}
                      </div>
                      {getScoreBadge(img.score)}
                    </div>
                  </div>
                ))}
                {imageOptimizations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No image optimizations found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Monitor Core Web Vitals and performance scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((perf) => (
                  <div key={perf.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(perf.status)}
                      <div>
                        <p className="font-medium">{perf.url}</p>
                        <p className="text-sm text-muted-foreground">
                          LCP: {perf.lcp}ms | FID: {perf.fid}ms | CLS: {perf.cls}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${getScoreColor(perf.score)}`}>
                        {perf.score}
                      </div>
                      {getScoreBadge(perf.score)}
                    </div>
                  </div>
                ))}
                {performanceMetrics.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No performance metrics found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Audits</CardTitle>
              <CardDescription>
                Track WCAG compliance and accessibility scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessibilityAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(audit.status)}
                      <div>
                        <p className="font-medium">{audit.url}</p>
                        <p className="text-sm text-muted-foreground">
                          WCAG {audit.level} | {audit.violations} violations, {audit.warnings} warnings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}
                      </div>
                      {getScoreBadge(audit.score)}
                    </div>
                  </div>
                ))}
                {accessibilityAudits.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No accessibility audits found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Quality Analysis</CardTitle>
              <CardDescription>
                Monitor content quality scores and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityAnalyses.map((quality) => (
                  <div key={quality.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(quality.status)}
                      <div>
                        <p className="font-medium">Content Quality</p>
                        <p className="text-sm text-muted-foreground">
                          Readability: {quality.readabilityScore} | Structure: {quality.structureScore} | Engagement: {quality.engagementScore}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-lg font-bold ${getScoreColor(quality.overallScore)}`}>
                        {quality.overallScore}
                      </div>
                      {getScoreBadge(quality.overallScore)}
                    </div>
                  </div>
                ))}
                {qualityAnalyses.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No quality analyses found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Triggers</CardTitle>
              <CardDescription>
                Manage automated optimization rules and triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{trigger.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {trigger.triggerType} • {trigger.priority} priority
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={trigger.isActive ? "default" : "secondary"}>
                        {trigger.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {triggers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No optimization triggers found
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