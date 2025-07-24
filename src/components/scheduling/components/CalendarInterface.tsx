'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarInterfaceProps,
  CalendarEvent,
  CalendarView,
  DateRange,
} from '../types/scheduling.types';

export function CalendarInterface({
  view,
  dateRange,
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
  isDragEnabled = true,
  isReadOnly = false,
}: CalendarInterfaceProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  // ============================================================================
  // CALENDAR UTILITIES
  // ============================================================================

  const getCalendarDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    // For month view, include the full weeks
    if (view === 'month') {
      const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
      const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      
      // Start from Sunday of the week containing the first day
      const calendarStart = new Date(monthStart);
      calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
      
      // End on Saturday of the week containing the last day
      const calendarEnd = new Date(monthEnd);
      calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
      
      for (let d = new Date(calendarStart); d <= calendarEnd; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
    } else {
      // For other views, just use the date range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
    }

    return days;
  }, [dateRange, view]);

  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [events]);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === dateRange.start.getMonth();
  }, [dateRange.start]);

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragStart = useCallback((event: CalendarEvent, e: React.DragEvent) => {
    if (!isDragEnabled || isReadOnly) return;
    
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  }, [isDragEnabled, isReadOnly]);

  const handleDragOver = useCallback((date: Date, e: React.DragEvent) => {
    if (!isDragEnabled || isReadOnly || !draggedEvent) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  }, [isDragEnabled, isReadOnly, draggedEvent]);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback((date: Date, e: React.DragEvent) => {
    if (!isDragEnabled || isReadOnly || !draggedEvent) return;
    
    e.preventDefault();
    
    const newStartTime = new Date(date);
    newStartTime.setHours(
      draggedEvent.startTime.getHours(),
      draggedEvent.startTime.getMinutes()
    );

    const updates: Partial<CalendarEvent> = {
      startTime: newStartTime,
    };

    if (draggedEvent.endTime) {
      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
      updates.endTime = new Date(newStartTime.getTime() + duration);
    }

    onEventUpdate(draggedEvent.id, updates);
    
    setDraggedEvent(null);
    setDragOverDate(null);
  }, [isDragEnabled, isReadOnly, draggedEvent, onEventUpdate]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleDateClick = useCallback((date: Date) => {
    if (isReadOnly) return;
    
    const newEvent: Partial<CalendarEvent> = {
      title: 'New Event',
      startTime: date,
      allDay: false,
      isEditable: true,
      metadata: {},
      scheduledContentId: '',
    };
    
    onEventCreate(newEvent);
  }, [isReadOnly, onEventCreate]);

  const handleEventClick = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  }, []);

  const handleEventDelete = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isReadOnly && event.isEditable) {
      onEventDelete(event.id);
    }
  }, [isReadOnly, onEventDelete]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderEventBadge = (event: CalendarEvent) => {
    const hasConflicts = event.conflictsWith && event.conflictsWith.length > 0;
    
    return (
      <div
        key={event.id}
        className={`
          text-xs p-1 mb-1 rounded border cursor-pointer transition-colors
          ${event.color ? `bg-${event.color}-100 border-${event.color}-300 text-${event.color}-700` : 'bg-blue-100 border-blue-300 text-blue-700'}
          ${draggedEvent?.id === event.id ? 'opacity-50' : ''}
          ${hasConflicts ? 'border-orange-400 bg-orange-50' : ''}
          hover:shadow-sm
        `}
        draggable={isDragEnabled && !isReadOnly && event.isEditable}
        onDragStart={(e) => handleDragStart(event, e)}
        onClick={(e) => handleEventClick(event, e)}
        title={event.description || event.title}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 truncate">
            <div className="font-medium truncate">{event.title}</div>
            {!event.allDay && (
              <div className="text-xs opacity-75">
                {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-1">
            {hasConflicts && (
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            )}
            {!isReadOnly && event.isEditable && (
              <button
                onClick={(e) => handleEventDelete(event, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const weeks: Date[][] = [];
    for (let i = 0; i < getCalendarDays.length; i += 7) {
      weeks.push(getCalendarDays.slice(i, i + 7));
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((date, dayIndex) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentDay = isToday(date);
                const isCurrentMonthDay = isCurrentMonth(date);
                const isDragOver = dragOverDate?.getTime() === date.getTime();

                return (
                  <div
                    key={dayIndex}
                    className={`
                      min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors group
                      ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                      ${!isCurrentMonthDay ? 'opacity-40' : ''}
                      ${isDragOver ? 'bg-blue-100 border-blue-400' : ''}
                      hover:bg-gray-50
                    `}
                    onClick={() => handleDateClick(date)}
                    onDragOver={(e) => handleDragOver(date, e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(date, e)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isCurrentDay ? 'font-bold text-blue-600' : ''}`}>
                        {date.getDate()}
                      </span>
                      {!isReadOnly && (
                        <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => renderEventBadge(event))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-4">
        {/* Week Header */}
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2"></div> {/* Time column header */}
          {getCalendarDays.slice(0, 7).map((date, index) => (
            <div key={index} className="p-2 text-center">
              <div className="font-medium">{date.toLocaleDateString([], { weekday: 'short' })}</div>
              <div className={`text-sm ${isToday(date) ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-8 gap-1 max-h-96 overflow-y-auto">
          {hours.map(hour => (
            <React.Fragment key={hour}>
              {/* Time Label */}
              <div className="p-2 text-xs text-muted-foreground text-right border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              
              {/* Day Columns */}
              {getCalendarDays.slice(0, 7).map((date, dayIndex) => {
                const hourDate = new Date(date);
                hourDate.setHours(hour, 0, 0, 0);
                const hourEvents = events.filter(event => {
                  const eventHour = new Date(event.startTime);
                  return eventHour.getTime() === hourDate.getTime();
                });

                return (
                  <div
                    key={dayIndex}
                    className="min-h-[40px] p-1 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleDateClick(hourDate)}
                  >
                    {hourEvents.map(event => renderEventBadge(event))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-2">
      {events.map(event => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{event.title}</h3>
                  {event.conflictsWith && event.conflictsWith.length > 0 && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {event.allDay 
                        ? 'All day' 
                        : `${event.startTime.toLocaleString()} ${event.endTime ? `- ${event.endTime.toLocaleTimeString()}` : ''}`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {!isReadOnly && event.isEditable && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => handleEventDelete(event, e)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No events found</p>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const renderCalendarContent = () => {
    switch (view) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'list':
        return renderListView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Content */}
      {renderCalendarContent()}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedEvent.title}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedEvent.description && (
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.allDay 
                      ? 'All day' 
                      : `${selectedEvent.startTime.toLocaleString()} ${selectedEvent.endTime ? `- ${selectedEvent.endTime.toLocaleTimeString()}` : ''}`
                    }
                  </p>
                </div>
                
                {selectedEvent.conflictsWith && selectedEvent.conflictsWith.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-orange-600">Conflicts</label>
                    <p className="text-sm text-orange-600">
                      This event conflicts with {selectedEvent.conflictsWith.length} other event{selectedEvent.conflictsWith.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                {!isReadOnly && selectedEvent.isEditable && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      handleEventDelete(selectedEvent, e);
                      setSelectedEvent(null);
                    }}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default CalendarInterface; 