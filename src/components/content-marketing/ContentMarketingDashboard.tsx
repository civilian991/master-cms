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
  Calendar, 
  TrendingUp, 
  Share2, 
  BarChart3, 
  Plus, 
  Filter,
  Download,
  Upload,
  Play,
  Settings,
  FileText,
  Users,
  Target,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
  Mail,
  MessageSquare
} from 'lucide-react';

interface ContentCalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'article' | 'social' | 'email' | 'video' | 'infographic';
  status: 'planned' | 'in_progress' | 'review' | 'published' | 'scheduled';
  startDate: Date;
  endDate?: Date;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  siteId: string;
  createdBy: string;
}

interface ContentDistributionChannel {
  id: string;
  name: string;
  type: 'social_media' | 'email' | 'blog' | 'newsletter' | 'syndication';
  platform?: string;
  isActive: boolean;
  settings: Record<string, any>;
  siteId: string;
}

interface ContentAnalytics {
  totalContent: number;
  publishedContent: number;
  totalViews: number;
  averageEngagement: number;
  topPerformingContent: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
    engagement: number;
    conversions: number;
  }>;
  contentByType: Record<string, {
    count: number;
    totalViews: number;
    averageEngagement: number;
  }>;
  performanceTrends: Array<{
    date: string;
    views: number;
    engagement: number;
    conversions: number;
  }>;
}

interface ContentOptimizationSuggestion {
  type: 'title' | 'content' | 'seo' | 'engagement' | 'conversion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
  currentValue: string;
  suggestedValue: string;
  reasoning: string;
}

export function ContentMarketingDashboard({ siteId }: { siteId: string }) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [events, setEvents] = useState<ContentCalendarEvent[]>([]);
  const [channels, setChannels] = useState<ContentDistributionChannel[]>([]);
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<ContentOptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDistributeContent, setShowDistributeContent] = useState(false);

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventStatus, setEventStatus] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventAssignedTo, setEventAssignedTo] = useState('');
  const [eventPriority, setEventPriority] = useState('');
  const [eventTags, setEventTags] = useState('');

  // Channel form
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('');
  const [channelPlatform, setChannelPlatform] = useState('');
  const [channelIsActive, setChannelIsActive] = useState(true);

  // Distribution form
  const [distributeContentId, setDistributeContentId] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

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
        loadEvents(),
        loadChannels(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load content marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/content-marketing/calendar?${params}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadChannels = async () => {
    try {
      const response = await fetch(`/api/content-marketing/distribution?siteId=${siteId}`);
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/content-marketing/analytics?siteId=${siteId}`);
      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const createEvent = async () => {
    if (!eventTitle || !eventType || !eventStartDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/content-marketing/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          type: eventType,
          status: eventStatus || 'planned',
          startDate: eventStartDate,
          endDate: eventEndDate || undefined,
          assignedTo: eventAssignedTo || undefined,
          priority: eventPriority || 'medium',
          tags: eventTags ? eventTags.split(',').map(t => t.trim()) : [],
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateEvent(false);
        resetEventForm();
        loadEvents();
      } else {
        const error = await response.json();
        alert(`Failed to create event: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  };

  const createChannel = async () => {
    if (!channelName || !channelType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/content-marketing/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: channelName,
          type: channelType,
          platform: channelPlatform || undefined,
          isActive: channelIsActive,
          settings: {},
          siteId,
        }),
      });

      if (response.ok) {
        setShowCreateChannel(false);
        resetChannelForm();
        loadChannels();
      } else {
        const error = await response.json();
        alert(`Failed to create channel: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      alert('Failed to create channel');
    }
  };

  const distributeContent = async () => {
    if (!distributeContentId || selectedChannels.length === 0) {
      alert('Please select content and channels');
      return;
    }

    try {
      const response = await fetch('/api/content-marketing/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: distributeContentId,
          channels: selectedChannels,
          siteId,
        }),
      });

      if (response.ok) {
        setShowDistributeContent(false);
        resetDistributionForm();
        alert('Content distributed successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to distribute content: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to distribute content:', error);
      alert('Failed to distribute content');
    }
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventType('');
    setEventStatus('');
    setEventStartDate('');
    setEventEndDate('');
    setEventAssignedTo('');
    setEventPriority('');
    setEventTags('');
  };

  const resetChannelForm = () => {
    setChannelName('');
    setChannelType('');
    setChannelPlatform('');
    setChannelIsActive(true);
  };

  const resetDistributionForm = () => {
    setDistributeContentId('');
    setSelectedChannels([]);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { color: 'bg-gray-100 text-gray-800', label: 'Planned', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: Settings },
      review: { color: 'bg-yellow-100 text-yellow-800', label: 'Review', icon: AlertCircle },
      published: { color: 'bg-green-100 text-green-800', label: 'Published', icon: CheckCircle },
      scheduled: { color: 'bg-purple-100 text-purple-800', label: 'Scheduled', icon: Calendar },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-green-100 text-green-800', label: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      article: { color: 'bg-blue-100 text-blue-800', label: 'Article', icon: FileText },
      social: { color: 'bg-purple-100 text-purple-800', label: 'Social', icon: Share2 },
      email: { color: 'bg-green-100 text-green-800', label: 'Email', icon: Mail },
      video: { color: 'bg-red-100 text-red-800', label: 'Video', icon: Play },
      infographic: { color: 'bg-orange-100 text-orange-800', label: 'Infographic', icon: BarChart3 },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.article;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getChannelTypeBadge = (type: string) => {
    const typeConfig = {
      social_media: { color: 'bg-purple-100 text-purple-800', label: 'Social Media', icon: Share2 },
      email: { color: 'bg-green-100 text-green-800', label: 'Email', icon: Mail },
      blog: { color: 'bg-blue-100 text-blue-800', label: 'Blog', icon: FileText },
      newsletter: { color: 'bg-orange-100 text-orange-800', label: 'Newsletter', icon: MessageSquare },
      syndication: { color: 'bg-red-100 text-red-800', label: 'Syndication', icon: Globe },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.social_media;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString();
  };

  const filteredEvents = events.filter(event => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return event.title.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Marketing</h1>
          <p className="text-gray-600">Calendar planning, distribution, and performance tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateEvent(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
          <Button variant="outline" onClick={() => setShowCreateChannel(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
          <Button variant="outline" onClick={() => setShowDistributeContent(true)}>
            <Globe className="mr-2 h-4 w-4" />
            Distribute
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
                  <p className="text-sm font-medium text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold">{analytics.totalContent}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold">{analytics.publishedContent}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                  <p className="text-2xl font-bold">{(analytics.averageEngagement * 100).toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
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
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="infographic">Infographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadEvents} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Event Form */}
          {showCreateEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Calendar Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <Input
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="infographic">Infographic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Enter event description"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <Input
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Input
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <Select value={eventPriority} onValueChange={setEventPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select value={eventStatus} onValueChange={setEventStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <Input
                      value={eventTags}
                      onChange={(e) => setEventTags(e.target.value)}
                      placeholder="Enter tags (comma-separated)"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createEvent}>Add Event</Button>
                  <Button variant="outline" onClick={() => setShowCreateEvent(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No events found</div>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          {getStatusBadge(event.status)}
                          {getTypeBadge(event.type)}
                          {getPriorityBadge(event.priority)}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(event.startDate)}
                          </div>
                          {event.endDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(event.endDate)}
                            </div>
                          )}
                          {event.assignedTo && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.assignedTo}
                            </div>
                          )}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {event.tags.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Play className="mr-1 h-3 w-3" />
                          Execute
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Content Distribution Channels</h2>
            <Button onClick={() => setShowCreateChannel(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </div>

          {/* Create Channel Form */}
          {showCreateChannel && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Distribution Channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <Input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Enter channel name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <Select value={channelType} onValueChange={setChannelType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="syndication">Syndication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform</label>
                    <Input
                      value={channelPlatform}
                      onChange={(e) => setChannelPlatform(e.target.value)}
                      placeholder="Enter platform (optional)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="channelActive"
                      checked={channelIsActive}
                      onChange={(e) => setChannelIsActive(e.target.checked)}
                    />
                    <label htmlFor="channelActive" className="text-sm font-medium">
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createChannel}>Add Channel</Button>
                  <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Channels List */}
          <div className="space-y-4">
            {channels.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No channels found</div>
            ) : (
              channels.map((channel) => (
                <Card key={channel.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{channel.name}</h3>
                          {getChannelTypeBadge(channel.type)}
                          {channel.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </div>
                        {channel.platform && (
                          <p className="text-sm text-gray-600 mb-2">Platform: {channel.platform}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="mr-1 h-3 w-3" />
                          Configure
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

          {/* Distribute Content Form */}
          {showDistributeContent && (
            <Card>
              <CardHeader>
                <CardTitle>Distribute Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Content ID</label>
                  <Input
                    value={distributeContentId}
                    onChange={(e) => setDistributeContentId(e.target.value)}
                    placeholder="Enter content ID to distribute"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Channels</label>
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <div key={channel.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={channel.id}
                          checked={selectedChannels.includes(channel.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannels([...selectedChannels, channel.id]);
                            } else {
                              setSelectedChannels(selectedChannels.filter(id => id !== channel.id));
                            }
                          }}
                        />
                        <label htmlFor={channel.id} className="text-sm">
                          {channel.name} ({channel.type})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={distributeContent}>Distribute Content</Button>
                  <Button variant="outline" onClick={() => setShowDistributeContent(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <h2 className="text-xl font-bold">Content Performance Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topPerformingContent.slice(0, 5).map((content, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="truncate">{content.title}</span>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(content.views)} views</div>
                          <div className="text-sm text-gray-500">
                            {(content.engagement * 100).toFixed(1)}% engagement
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.contentByType).map(([type, data]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <div className="text-right">
                          <div className="font-medium">{data.count} items</div>
                          <div className="text-sm text-gray-500">
                            {formatNumber(data.totalViews)} views
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
                          <span className="text-sm">{formatNumber(trend.views)} views</span>
                          <span className="text-sm">{(trend.engagement * 100).toFixed(1)}% engagement</span>
                          <span className="text-sm">{trend.conversions} conversions</span>
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
          <h2 className="text-xl font-bold">Content Optimization Suggestions</h2>
          
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No optimization suggestions available</div>
            ) : (
              suggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          {getPriorityBadge(suggestion.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Impact: {suggestion.impact}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            Effort: {suggestion.effort}%
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowUp className="h-3 w-3" />
                            Current: {suggestion.currentValue}
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowDown className="h-3 w-3" />
                            Suggested: {suggestion.suggestedValue}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Reasoning:</p>
                          <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Lightbulb className="mr-1 h-3 w-3" />
                          Apply
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

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <h2 className="text-xl font-bold">Content Marketing Workflows</h2>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create automated workflows to streamline your content marketing processes.
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 