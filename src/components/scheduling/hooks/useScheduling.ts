'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { schedulingApi } from '../services/schedulingApi';
import {
  ScheduledContent,
  CalendarEvent,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ConflictData,
  ScheduleFilter,
  CalendarView,
  DateRange,
  UseSchedulingOptions,
  ScheduleStatus,
  PublishingPlatform,
} from '../types/scheduling.types';

interface SchedulingState {
  isLoading: boolean;
  scheduledContent: ScheduledContent[];
  calendarEvents: CalendarEvent[];
  conflicts: ConflictData[];
  error: string | null;
  selectedContent: ScheduledContent | null;
  view: CalendarView;
  dateRange: DateRange;
  filters: ScheduleFilter;
}

export function useScheduling(options: UseSchedulingOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 300000,
    enableOptimization = true,
    enableConflictDetection = true,
  } = options;

  const [state, setState] = useState<SchedulingState>({
    isLoading: false,
    scheduledContent: [],
    calendarEvents: [],
    conflicts: [],
    error: null,
    selectedContent: null,
    view: 'month',
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    filters: {},
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchScheduledContent = useCallback(async (filters?: ScheduleFilter) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const content = await schedulingApi.getScheduledContent(filters || state.filters);
      setState(prev => ({
        ...prev,
        scheduledContent: content,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch scheduled content',
        isLoading: false,
      }));
    }
  }, [state.filters]);

  const fetchCalendarEvents = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await schedulingApi.getCalendarEvents({
        view: state.view,
        dateRange: state.dateRange,
        filters: state.filters,
      });

      setState(prev => ({
        ...prev,
        calendarEvents: response.events,
        conflicts: response.conflicts,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events',
        isLoading: false,
      }));
    }
  }, [state.view, state.dateRange, state.filters]);

  const fetchData = useCallback(async () => {
    await Promise.all([
      fetchScheduledContent(state.filters),
      fetchCalendarEvents(),
    ]);
  }, [fetchScheduledContent, fetchCalendarEvents, state.filters]);

  // ============================================================================
  // SCHEDULE MANAGEMENT
  // ============================================================================

  const createSchedule = useCallback(async (request: CreateScheduleRequest): Promise<ScheduledContent> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check for conflicts if enabled
      if (enableConflictDetection) {
        const conflicts = await schedulingApi.checkConflicts(
          request.scheduledAt,
          undefined,
          request.platforms
        );

        if (conflicts.length > 0) {
          const criticalConflicts = conflicts.filter(c => c.severity === 'high');
          if (criticalConflicts.length > 0) {
            throw new Error(`Schedule conflicts detected: ${criticalConflicts[0].description}`);
          }
        }
      }

      const response = await schedulingApi.createSchedule(request);
      
      if (!response.success) {
        throw new Error('Failed to create schedule');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        scheduledContent: [...prev.scheduledContent, response.scheduledContent],
        isLoading: false,
      }));

      // Refresh calendar events
      await fetchCalendarEvents();

      return response.scheduledContent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create schedule',
        isLoading: false,
      }));
      throw error;
    }
  }, [enableConflictDetection, fetchCalendarEvents]);

  const updateSchedule = useCallback(async (
    scheduleId: string,
    updates: UpdateScheduleRequest
  ): Promise<ScheduledContent> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check for conflicts if updating scheduled time
      if (enableConflictDetection && updates.scheduledAt) {
        const conflicts = await schedulingApi.checkConflicts(
          updates.scheduledAt,
          undefined,
          updates.platforms
        );

        if (conflicts.length > 0) {
          const criticalConflicts = conflicts.filter(c => c.severity === 'high');
          if (criticalConflicts.length > 0) {
            throw new Error(`Schedule conflicts detected: ${criticalConflicts[0].description}`);
          }
        }
      }

      const updatedContent = await schedulingApi.updateSchedule(scheduleId, updates);

      // Update local state
      setState(prev => ({
        ...prev,
        scheduledContent: prev.scheduledContent.map(content =>
          content.id === scheduleId ? updatedContent : content
        ),
        selectedContent: prev.selectedContent?.id === scheduleId ? updatedContent : prev.selectedContent,
        isLoading: false,
      }));

      // Refresh calendar events
      await fetchCalendarEvents();

      return updatedContent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update schedule',
        isLoading: false,
      }));
      throw error;
    }
  }, [enableConflictDetection, fetchCalendarEvents]);

  const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await schedulingApi.deleteSchedule(scheduleId);

      // Update local state
      setState(prev => ({
        ...prev,
        scheduledContent: prev.scheduledContent.filter(content => content.id !== scheduleId),
        selectedContent: prev.selectedContent?.id === scheduleId ? null : prev.selectedContent,
        isLoading: false,
      }));

      // Refresh calendar events
      await fetchCalendarEvents();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete schedule',
        isLoading: false,
      }));
      throw error;
    }
  }, [fetchCalendarEvents]);

  const duplicateSchedule = useCallback(async (
    scheduleId: string,
    newScheduledAt: Date,
    platforms?: PublishingPlatform[]
  ): Promise<ScheduledContent> => {
    const originalContent = state.scheduledContent.find(c => c.id === scheduleId);
    if (!originalContent) {
      throw new Error('Original content not found');
    }

    const duplicateRequest: CreateScheduleRequest = {
      contentId: originalContent.contentId,
      scheduledAt: newScheduledAt,
      platforms: platforms || originalContent.platforms,
      priority: originalContent.priority,
      metadata: { ...originalContent.metadata, duplicatedFrom: scheduleId },
    };

    return await createSchedule(duplicateRequest);
  }, [state.scheduledContent, createSchedule]);

  const rescheduleContent = useCallback(async (
    scheduleId: string,
    newScheduledAt: Date
  ): Promise<ScheduledContent> => {
    return await updateSchedule(scheduleId, { scheduledAt: newScheduledAt });
  }, [updateSchedule]);

  // ============================================================================
  // CALENDAR MANAGEMENT
  // ============================================================================

  const setView = useCallback((view: CalendarView) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const setDateRange = useCallback((dateRange: DateRange) => {
    setState(prev => ({ ...prev, dateRange }));
  }, []);

  const setFilters = useCallback((filters: ScheduleFilter) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const navigateCalendar = useCallback((direction: 'prev' | 'next') => {
    setState(prev => {
      const { start, end } = prev.dateRange;
      const diff = end.getTime() - start.getTime();
      
      const newStart = new Date(start);
      const newEnd = new Date(end);

      if (direction === 'next') {
        newStart.setTime(start.getTime() + diff);
        newEnd.setTime(end.getTime() + diff);
      } else {
        newStart.setTime(start.getTime() - diff);
        newEnd.setTime(end.getTime() - diff);
      }

      return {
        ...prev,
        dateRange: { start: newStart, end: newEnd },
      };
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    setState(prev => ({
      ...prev,
      dateRange: { start: startOfWeek, end: endOfWeek },
    }));
  }, []);

  // ============================================================================
  // CALENDAR EVENTS
  // ============================================================================

  const createCalendarEvent = useCallback(async (event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newEvent = await schedulingApi.createCalendarEvent(event);
      
      setState(prev => ({
        ...prev,
        calendarEvents: [...prev.calendarEvents, newEvent],
        isLoading: false,
      }));

      return newEvent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create calendar event',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const updateCalendarEvent = useCallback(async (
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedEvent = await schedulingApi.updateCalendarEvent(eventId, updates);
      
      setState(prev => ({
        ...prev,
        calendarEvents: prev.calendarEvents.map(event =>
          event.id === eventId ? updatedEvent : event
        ),
        isLoading: false,
      }));

      return updatedEvent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update calendar event',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const deleteCalendarEvent = useCallback(async (eventId: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await schedulingApi.deleteCalendarEvent(eventId);
      
      setState(prev => ({
        ...prev,
        calendarEvents: prev.calendarEvents.filter(event => event.id !== eventId),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete calendar event',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  const checkConflicts = useCallback(async (
    scheduledAt: Date,
    duration?: number,
    platforms?: PublishingPlatform[]
  ): Promise<ConflictData[]> => {
    if (!enableConflictDetection) return [];

    try {
      return await schedulingApi.checkConflicts(scheduledAt, duration, platforms);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return [];
    }
  }, [enableConflictDetection]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'reschedule' | 'force' | 'cancel'
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(conflict => conflict.type !== conflictId),
    }));
  }, []);

  // ============================================================================
  // SELECTION AND INTERACTION
  // ============================================================================

  const selectContent = useCallback((content: ScheduledContent | null) => {
    setState(prev => ({ ...prev, selectedContent: content }));
  }, []);

  const getContentByStatus = useCallback((status: ScheduleStatus): ScheduledContent[] => {
    return state.scheduledContent.filter(content => content.status === status);
  }, [state.scheduledContent]);

  const getContentByPlatform = useCallback((platform: PublishingPlatform): ScheduledContent[] => {
    return state.scheduledContent.filter(content => content.platforms.includes(platform));
  }, [state.scheduledContent]);

  const getUpcomingContent = useCallback((hours: number = 24): ScheduledContent[] => {
    const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000);
    return state.scheduledContent.filter(content => 
      content.scheduledAt <= cutoff && 
      content.status === 'scheduled'
    );
  }, [state.scheduledContent]);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const retry = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchData, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  // Fetch data when view or date range changes
  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  // Fetch data when filters change
  useEffect(() => {
    fetchScheduledContent(state.filters);
  }, [fetchScheduledContent, state.filters]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getStatistics = useCallback(() => {
    const total = state.scheduledContent.length;
    const published = state.scheduledContent.filter(c => c.status === 'published').length;
    const scheduled = state.scheduledContent.filter(c => c.status === 'scheduled').length;
    const draft = state.scheduledContent.filter(c => c.status === 'draft').length;
    const failed = state.scheduledContent.filter(c => c.status === 'failed').length;

    return {
      total,
      published,
      scheduled,
      draft,
      failed,
      successRate: total > 0 ? (published / total) * 100 : 0,
    };
  }, [state.scheduledContent]);

  const isSlotAvailable = useCallback((
    dateTime: Date,
    duration: number = 60,
    platforms: PublishingPlatform[] = []
  ): boolean => {
    const endTime = new Date(dateTime.getTime() + duration * 60 * 1000);
    
    return !state.scheduledContent.some(content => {
      if (content.status === 'cancelled' || content.status === 'failed') return false;
      
      const contentStart = new Date(content.scheduledAt);
      const contentEnd = new Date(contentStart.getTime() + (content.estimatedDuration || 60) * 60 * 1000);
      
      // Check time overlap
      const timeOverlap = (dateTime < contentEnd && endTime > contentStart);
      
      // Check platform overlap
      const platformOverlap = platforms.some(platform => content.platforms.includes(platform));
      
      return timeOverlap && platformOverlap;
    });
  }, [state.scheduledContent]);

  return {
    // State
    ...state,
    
    // Data fetching
    fetchData,
    fetchScheduledContent,
    fetchCalendarEvents,
    
    // Schedule management
    createSchedule,
    updateSchedule,
    deleteSchedule,
    duplicateSchedule,
    rescheduleContent,
    
    // Calendar management
    setView,
    setDateRange,
    setFilters,
    navigateCalendar,
    goToToday,
    
    // Calendar events
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    
    // Conflict detection
    checkConflicts,
    resolveConflict,
    
    // Selection and interaction
    selectContent,
    getContentByStatus,
    getContentByPlatform,
    getUpcomingContent,
    
    // Error handling
    clearError,
    retry,
    
    // Utilities
    getStatistics,
    isSlotAvailable,
  };
}

export default useScheduling; 