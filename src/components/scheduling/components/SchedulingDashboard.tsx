'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users,
  BarChart3,
  Settings,
  Plus,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Timeline,
  Kanban,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  SchedulingDashboardProps,
  ScheduledContent,
  CalendarEvent,
  ConflictData,
  ScheduleStatus,
  CalendarView,
  PublishingPlatform,
  Priority,
} from '../types/scheduling.types';
import { schedulingApi } from '../services/schedulingApi';

interface SchedulingOverview {
  totalScheduled: number;
  upcomingPublishes: number;
  pendingApprovals: number;
  failedPublishes: number;
  successRate: number;
  platformDistribution: Record<PublishingPlatform, number>;
  lastUpdate: Date;
}

export function SchedulingDashboard({
  userId,
  view,
  onViewChange,
  filters,
  onFiltersChange,
}: SchedulingDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<SchedulingOverview | null>(null);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showConflicts, setShowConflicts] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(selectedDate.getDate() + 30);

      const [contentResponse, calendarResponse] = await Promise.all([
        schedulingApi.getScheduledContent({ 
          userId, 
          ...filters,
          dateRange: { start: selectedDate, end: endDate },
        }),
        schedulingApi.getCalendarEvents({
          view,
          dateRange: { start: selectedDate, end: endDate },
          filters,
        }),
      ]);

      setScheduledContent(contentResponse);
      setCalendarEvents(calendarResponse.events);
      setConflicts(calendarResponse.conflicts);

      // Calculate overview statistics
      const overview: SchedulingOverview = {
        totalScheduled: contentResponse.length,
        upcomingPublishes: contentResponse.filter(c => 
          c.status === 'scheduled' && 
          new Date(c.scheduledAt) > new Date()
        ).length,
        pendingApprovals: contentResponse.filter(c => c.status === 'pending_approval').length,
        failedPublishes: contentResponse.filter(c => c.status === 'failed').length,
        successRate: calculateSuccessRate(contentResponse),
        platformDistribution: calculatePlatformDistribution(contentResponse),
        lastUpdate: new Date(),
      };

      setOverview(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSuccessRate = (content: ScheduledContent[]): number => {
    const published = content.filter(c => c.status === 'published').length;
    const total = content.filter(c => c.status !== 'draft').length;
    return total > 0 ? (published / total) * 100 : 0;
  };

  const calculatePlatformDistribution = (content: ScheduledContent[]): Record<PublishingPlatform, number> => {
    const distribution: Record<string, number> = {};
    content.forEach(item => {
      item.platforms.forEach(platform => {
        distribution[platform] = (distribution[platform] || 0) + 1;
      });
    });
    return distribution as Record<PublishingPlatform, number>;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId, view, filters, selectedDate]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getStatusColor = (status: ScheduleStatus): string => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50 border-green-200';
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending_approval': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getViewIcon = (viewType: CalendarView) => {
    switch (viewType) {
      case 'month': return <Calendar className="h-4 w-4" />;
      case 'week': return <Grid3X3 className="h-4 w-4" />;
      case 'day': return <Clock className="h-4 w-4" />;
      case 'timeline': return <Timeline className="h-4 w-4" />;
      case 'kanban': return <Kanban className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderOverviewCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Scheduled */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.totalScheduled || 0}</div>
          <p className="text-xs text-muted-foreground">
            Content items scheduled
          </p>
        </CardContent>
      </Card>

      {/* Upcoming Publishes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.upcomingPublishes || 0}</div>
          <p className="text-xs text-muted-foreground">
            Publishing soon
          </p>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.pendingApprovals || 0}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting review
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(overview?.successRate || 0)}%</div>
          <p className="text-xs text-muted-foreground">
            Successful publishes
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderCalendarView = () => (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Content Calendar</span>
            </CardTitle>
            <CardDescription>
              Schedule and manage your content publishing
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Switcher */}
            <div className="flex items-center border rounded-md">
              {(['month', 'week', 'day', 'timeline', 'kanban', 'list'] as CalendarView[]).map((viewType) => (
                <Button
                  key={viewType}
                  variant={view === viewType ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange(viewType)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  {getViewIcon(viewType)}
                  <span className="ml-1 hidden sm:inline capitalize">{viewType}</span>
                </Button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() + 7);
                  setSelectedDate(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar content would go here - this is a simplified version */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{selectedDate.toLocaleDateString()} - {view} view</span>
            <span>{calendarEvents.length} events</span>
          </div>
          
          {/* Simple event list for demo */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {calendarEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.startTime).toLocaleString()}
                  </div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {event.conflictsWith && event.conflictsWith.length > 0 && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {event.allDay ? 'All Day' : 'Scheduled'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {calendarEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events scheduled for this period</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderUpcomingContent = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Upcoming Content</span>
        </CardTitle>
        <CardDescription>
          Content scheduled for publishing soon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheduledContent
            .filter(content => 
              content.status === 'scheduled' && 
              new Date(content.scheduledAt) > new Date()
            )
            .slice(0, 5)
            .map((content) => (
              <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{content.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(content.scheduledAt).toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    {content.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getPriorityColor(content.priority)}>
                    {content.priority}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(content.status)}>
                    {content.status}
                  </Badge>
                </div>
              </div>
            ))}
          
          {scheduledContent.filter(c => c.status === 'scheduled').length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>No upcoming content scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPlatformAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Platform Distribution</span>
        </CardTitle>
        <CardDescription>
          Content distribution across platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overview?.platformDistribution && Object.entries(overview.platformDistribution).map(([platform, count]) => (
            <div key={platform} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="capitalize font-medium">{platform}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-muted-foreground">{count} items</div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(count / (overview.totalScheduled || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {!overview?.platformDistribution && (
            <div className="text-center py-4 text-muted-foreground">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>No platform data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading scheduling dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Scheduling</h1>
          <p className="text-muted-foreground">
            Plan, schedule, and manage your content publishing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Content
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Scheduling Conflicts Detected</AlertTitle>
          <AlertDescription>
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found. 
            <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setShowConflicts(true)}>
              Review conflicts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar View */}
        <div className="md:col-span-2">
          {renderCalendarView()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {renderUpcomingContent()}
          {renderPlatformAnalytics()}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common scheduling tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Workflow Settings
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              AI Optimization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {overview?.lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}

export default SchedulingDashboard; 