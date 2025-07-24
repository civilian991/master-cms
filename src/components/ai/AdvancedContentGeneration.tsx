'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Users, 
  Settings, 
  Play,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Globe,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AdvancedContentGenerationProps {
  siteId: number;
}

interface ContentTemplate {
  id: number;
  name: string;
  description: string;
  contentType: string;
  templateStructure: any;
  aiPrompts: any;
  optimizationRules: any;
  qualityCriteria: any;
  usageCount: number;
  successRate: number;
}

interface ContentSession {
  id: number;
  sessionType: string;
  contentType: string;
  status: string;
  progress: number;
  generationTime?: number;
  qualityScore?: number;
  optimizationScore?: number;
  template?: ContentTemplate;
  versions: ContentVersion[];
}

interface ContentVersion {
  id: number;
  versionNumber: number;
  content: string;
  metadata: any;
  qualityScore?: number;
  seoScore?: number;
  readabilityScore?: number;
  engagementScore?: number;
  optimizationData: any;
  improvementSuggestions: any;
  createdAt: string;
}

interface ContentSchedule {
  id: number;
  scheduleName: string;
  scheduleType: string;
  contentType: string;
  status: string;
  nextRun?: string;
  lastRun?: string;
  successRate: number;
  totalPublished: number;
}

export function AdvancedContentGeneration({ siteId }: AdvancedContentGenerationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [schedules, setSchedules] = useState<ContentSchedule[]>([]);
  const [selectedSession, setSelectedSession] = useState<ContentSession | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    contentType: 'article',
    systemPrompt: '',
    userPrompt: '',
    seoKeywords: '',
    targetLength: { min: 500, max: 2000 },
    tone: 'professional',
    style: 'informative',
  });

  const [sessionForm, setSessionForm] = useState({
    sessionType: 'single',
    contentType: 'article',
    topic: '',
    keywords: '',
    targetAudience: '',
    tone: '',
    length: 1000,
    language: 'en',
    templateId: '',
    seoOptimization: true,
    readabilityOptimization: true,
    engagementOptimization: true,
    plagiarismCheck: true,
  });

  const [scheduleForm, setScheduleForm] = useState({
    scheduleName: '',
    scheduleType: 'single',
    contentType: 'article',
    frequency: 'daily',
    startDate: '',
    endDate: '',
    topic: '',
    publishChannels: ['website'],
  });

  useEffect(() => {
    loadContentGenerationData();
  }, [siteId]);

  const loadContentGenerationData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/content-generation/advanced?siteId=${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        setSessions(data.sessions || []);
        setSchedules(data.schedules || []);
      } else {
        throw new Error('Failed to load content generation data');
      }
    } catch (error) {
      console.error('Error loading content generation data:', error);
      setError('Failed to load content generation data');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const templateData = {
        siteId,
        name: templateForm.name,
        description: templateForm.description,
        contentType: templateForm.contentType,
        templateStructure: {
          sections: [
            { name: 'Introduction', type: 'text', required: true },
            { name: 'Main Content', type: 'text', required: true },
            { name: 'Conclusion', type: 'text', required: true },
          ],
          format: 'article',
          style: templateForm.style,
        },
        aiPrompts: {
          systemPrompt: templateForm.systemPrompt,
          userPrompt: templateForm.userPrompt,
        },
        optimizationRules: {
          seoKeywords: templateForm.seoKeywords.split(',').map(k => k.trim()),
          targetLength: templateForm.targetLength,
          tone: templateForm.tone,
          style: templateForm.style,
        },
        qualityCriteria: {
          readabilityTarget: 80,
          seoScoreTarget: 90,
          engagementTarget: 85,
        },
      };

      const response = await fetch('/api/ai/content-generation/advanced/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        await loadContentGenerationData();
        setTemplateForm({
          name: '',
          description: '',
          contentType: 'article',
          systemPrompt: '',
          userPrompt: '',
          seoKeywords: '',
          targetLength: { min: 500, max: 2000 },
          tone: 'professional',
          style: 'informative',
        });
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
    }
  };

  const createSession = async () => {
    try {
      const sessionData = {
        siteId,
        sessionType: sessionForm.sessionType,
        contentType: sessionForm.contentType,
        templateId: sessionForm.templateId ? parseInt(sessionForm.templateId) : undefined,
        generationParams: {
          topic: sessionForm.topic,
          keywords: sessionForm.keywords.split(',').map(k => k.trim()).filter(k => k),
          targetAudience: sessionForm.targetAudience,
          tone: sessionForm.tone,
          length: sessionForm.length,
          language: sessionForm.language,
        },
        optimizationSettings: {
          seoOptimization: sessionForm.seoOptimization,
          readabilityOptimization: sessionForm.readabilityOptimization,
          engagementOptimization: sessionForm.engagementOptimization,
          plagiarismCheck: sessionForm.plagiarismCheck,
        },
      };

      const response = await fetch('/api/ai/content-generation/advanced/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data.session);
        await loadContentGenerationData();
        setSessionForm({
          sessionType: 'single',
          contentType: 'article',
          topic: '',
          keywords: '',
          targetAudience: '',
          tone: '',
          length: 1000,
          language: 'en',
          templateId: '',
          seoOptimization: true,
          readabilityOptimization: true,
          engagementOptimization: true,
          plagiarismCheck: true,
        });
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
    }
  };

  const generateContent = async (sessionId: number) => {
    try {
      const response = await fetch('/api/ai/content-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          useTemplate: true,
          optimizeContent: true,
          personalizeContent: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedVersion(data.version);
        await loadContentGenerationData();
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate content');
    }
  };

  const createSchedule = async () => {
    try {
      const scheduleData = {
        siteId,
        scheduleName: scheduleForm.scheduleName,
        scheduleType: scheduleForm.scheduleType,
        scheduleConfig: {
          frequency: scheduleForm.frequency,
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate || undefined,
        },
        contentType: scheduleForm.contentType,
        generationParams: {
          topic: scheduleForm.topic,
        },
        publishChannels: scheduleForm.publishChannels,
        publishSettings: {},
      };

      const response = await fetch('/api/ai/content-generation/advanced/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        await loadContentGenerationData();
        setScheduleForm({
          scheduleName: '',
          scheduleType: 'single',
          contentType: 'article',
          frequency: 'daily',
          startDate: '',
          endDate: '',
          topic: '',
          publishChannels: ['website'],
        });
      } else {
        throw new Error('Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError('Failed to create schedule');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'generating':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Generating</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Content Generation</h2>
          <p className="text-muted-foreground">
            Create, optimize, and schedule AI-powered content
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-muted-foreground">Content templates available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-muted-foreground">Content generation sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schedules.length}</div>
                <p className="text-muted-foreground">Automated content schedules</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{session.contentType}</p>
                        <p className="text-sm text-muted-foreground">{session.sessionType}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                        {session.qualityScore && (
                          <span className={`text-sm ${getQualityColor(session.qualityScore)}`}>
                            {session.qualityScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedules.filter(s => s.status === 'active').slice(0, 5).map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{schedule.scheduleName}</p>
                        <p className="text-sm text-muted-foreground">{schedule.contentType}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(schedule.status)}
                        <span className="text-sm text-muted-foreground">
                          {schedule.totalPublished} published
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Content Templates</h3>
            <Button onClick={() => setActiveTab('templates')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.name}</span>
                    <Badge variant="outline">{template.contentType}</Badge>
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage Count:</span>
                      <span>{template.usageCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className={getQualityColor(template.successRate)}>
                        {template.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first content template to streamline content generation
                </p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Content Sessions</h3>
            <Button onClick={() => setActiveTab('sessions')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="cursor-pointer hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{session.contentType}</span>
                    {getStatusBadge(session.status)}
                  </CardTitle>
                  <CardDescription>
                    {session.sessionType} • {session.template?.name || 'No template'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span>{session.progress}%</span>
                    </div>
                    {session.generationTime && (
                      <div className="flex justify-between text-sm">
                        <span>Generation Time:</span>
                        <span>{session.generationTime}ms</span>
                      </div>
                    )}
                    {session.qualityScore && (
                      <div className="flex justify-between text-sm">
                        <span>Quality Score:</span>
                        <span className={getQualityColor(session.qualityScore)}>
                          {session.qualityScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {session.status === 'draft' && (
                      <Button 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => generateContent(session.id)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Generate Content
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sessions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first content generation session
                </p>
                <Button onClick={() => setActiveTab('sessions')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Content Schedules</h3>
            <Button onClick={() => setActiveTab('schedules')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{schedule.scheduleName}</span>
                    {getStatusBadge(schedule.status)}
                  </CardTitle>
                  <CardDescription>
                    {schedule.contentType} • {schedule.scheduleType}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className={getQualityColor(schedule.successRate)}>
                        {schedule.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Published:</span>
                      <span>{schedule.totalPublished}</span>
                    </div>
                    {schedule.nextRun && (
                      <div className="flex justify-between text-sm">
                        <span>Next Run:</span>
                        <span>{new Date(schedule.nextRun).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {schedules.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Schedules</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first content schedule for automated publishing
                </p>
                <Button onClick={() => setActiveTab('schedules')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Schedule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Creation Form */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Content Template</CardTitle>
            <CardDescription>
              Create a reusable template for content generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label>Content Type</Label>
                <Select
                  value={templateForm.contentType}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="video">Video Script</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Enter template description"
              />
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea
                value={templateForm.systemPrompt}
                onChange={(e) => setTemplateForm({ ...templateForm, systemPrompt: e.target.value })}
                placeholder="Enter AI system prompt"
              />
            </div>
            <div>
              <Label>User Prompt</Label>
              <Textarea
                value={templateForm.userPrompt}
                onChange={(e) => setTemplateForm({ ...templateForm, userPrompt: e.target.value })}
                placeholder="Enter AI user prompt"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>SEO Keywords</Label>
                <Input
                  value={templateForm.seoKeywords}
                  onChange={(e) => setTemplateForm({ ...templateForm, seoKeywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div>
                <Label>Tone</Label>
                <Select
                  value={templateForm.tone}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Style</Label>
                <Select
                  value={templateForm.style}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, style: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informative">Informative</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="entertaining">Entertaining</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={createTemplate} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session Creation Form */}
      {activeTab === 'sessions' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Content Session</CardTitle>
            <CardDescription>
              Start a new content generation session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Session Type</Label>
                <Select
                  value={sessionForm.sessionType}
                  onValueChange={(value) => setSessionForm({ ...sessionForm, sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="batch">Batch</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content Type</Label>
                <Select
                  value={sessionForm.contentType}
                  onValueChange={(value) => setSessionForm({ ...sessionForm, contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="video">Video Script</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Topic</Label>
              <Input
                value={sessionForm.topic}
                onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                placeholder="Enter content topic"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Keywords</Label>
                <Input
                  value={sessionForm.keywords}
                  onChange={(e) => setSessionForm({ ...sessionForm, keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div>
                <Label>Target Length (words)</Label>
                <Input
                  type="number"
                  value={sessionForm.length}
                  onChange={(e) => setSessionForm({ ...sessionForm, length: parseInt(e.target.value) })}
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Target Audience</Label>
                <Input
                  value={sessionForm.targetAudience}
                  onChange={(e) => setSessionForm({ ...sessionForm, targetAudience: e.target.value })}
                  placeholder="Enter target audience"
                />
              </div>
              <div>
                <Label>Template (Optional)</Label>
                <Select
                  value={sessionForm.templateId}
                  onValueChange={(value) => setSessionForm({ ...sessionForm, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Optimization Settings</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={sessionForm.seoOptimization}
                    onCheckedChange={(checked) => setSessionForm({ ...sessionForm, seoOptimization: !!checked })}
                  />
                  <Label>SEO Optimization</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={sessionForm.readabilityOptimization}
                    onCheckedChange={(checked) => setSessionForm({ ...sessionForm, readabilityOptimization: !!checked })}
                  />
                  <Label>Readability</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={sessionForm.engagementOptimization}
                    onCheckedChange={(checked) => setSessionForm({ ...sessionForm, engagementOptimization: !!checked })}
                  />
                  <Label>Engagement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={sessionForm.plagiarismCheck}
                    onCheckedChange={(checked) => setSessionForm({ ...sessionForm, plagiarismCheck: !!checked })}
                  />
                  <Label>Plagiarism Check</Label>
                </div>
              </div>
            </div>
            <Button onClick={createSession} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule Creation Form */}
      {activeTab === 'schedules' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Content Schedule</CardTitle>
            <CardDescription>
              Set up automated content generation and publishing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Schedule Name</Label>
                <Input
                  value={scheduleForm.scheduleName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleName: e.target.value })}
                  placeholder="Enter schedule name"
                />
              </div>
              <div>
                <Label>Schedule Type</Label>
                <Select
                  value={scheduleForm.scheduleType}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, scheduleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Content Type</Label>
                <Select
                  value={scheduleForm.contentType}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="video">Video Script</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={scheduleForm.frequency}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={scheduleForm.startDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={scheduleForm.endDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Topic</Label>
              <Input
                value={scheduleForm.topic}
                onChange={(e) => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                placeholder="Enter content topic"
              />
            </div>
            <Button onClick={createSchedule} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Version Display */}
      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              Version {selectedVersion.versionNumber} • {new Date(selectedVersion.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedVersion.qualityScore && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(selectedVersion.qualityScore)}`}>
                      {selectedVersion.qualityScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                  </div>
                )}
                {selectedVersion.seoScore && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(selectedVersion.seoScore)}`}>
                      {selectedVersion.seoScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">SEO Score</div>
                  </div>
                )}
                {selectedVersion.readabilityScore && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(selectedVersion.readabilityScore)}`}>
                      {selectedVersion.readabilityScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Readability</div>
                  </div>
                )}
                {selectedVersion.engagementScore && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(selectedVersion.engagementScore)}`}>
                      {selectedVersion.engagementScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Engagement</div>
                  </div>
                )}
              </div>
              <div className="border rounded p-4 bg-muted/50">
                <div className="prose max-w-none">
                  {selectedVersion.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
              {selectedVersion.improvementSuggestions && (
                <div>
                  <h4 className="font-semibold mb-2">Improvement Suggestions</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedVersion.improvementSuggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 