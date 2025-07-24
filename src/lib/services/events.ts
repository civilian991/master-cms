import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const EventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  type: z.enum(['webinar', 'livestream', 'workshop', 'conference', 'meetup', 'presentation']),
  status: z.enum(['draft', 'published', 'live', 'completed', 'cancelled']).default('draft'),
  startTime: z.date(),
  endTime: z.date(),
  timezone: z.string().default('UTC'),
  maxAttendees: z.number().int().min(1).optional(),
  price: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  location: z.string().optional(),
  isOnline: z.boolean().default(true),
  streamingUrl: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
  hostId: z.string().min(1, 'Host ID is required'),
  coHosts: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isRecorded: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  reminderTimes: z.array(z.number()).default([24, 1]), // hours before event
  metadata: z.record(z.string(), z.any()).default({}),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const EventRegistrationSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().min(1, 'Event ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum(['registered', 'waitlisted', 'approved', 'rejected', 'cancelled', 'attended']).default('registered'),
  registeredAt: z.date().default(() => new Date()),
  attendedAt: z.date().optional(),
  questions: z.record(z.string(), z.any()).default({}),
  notes: z.string().optional(),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const EventNotificationSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().min(1, 'Event ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['reminder', 'update', 'cancellation', 'recording_ready', 'start_soon', 'started']),
  scheduledFor: z.date(),
  sentAt: z.date().optional(),
  status: z.enum(['scheduled', 'sent', 'failed']).default('scheduled'),
  content: z.string().min(1, 'Notification content is required'),
  siteId: z.string().min(1, 'Site ID is required'),
});

export const EventCalendarSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  siteId: z.string().min(1, 'Site ID is required'),
  hostId: z.string().optional(),
  type: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  timezone: z.string().default('UTC'),
});

export const StreamingConfigSchema = z.object({
  platform: z.enum(['youtube', 'twitch', 'zoom', 'webex', 'teams', 'custom']),
  streamKey: z.string().optional(),
  serverUrl: z.string().url().optional(),
  meetingId: z.string().optional(),
  password: z.string().optional(),
  settings: z.record(z.string(), z.any()).default({}),
});

// Types
export type Event = z.infer<typeof EventSchema>;
export type EventRegistration = z.infer<typeof EventRegistrationSchema>;
export type EventNotification = z.infer<typeof EventNotificationSchema>;
export type EventCalendar = z.infer<typeof EventCalendarSchema>;
export type StreamingConfig = z.infer<typeof StreamingConfigSchema>;

export interface EventAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  totalAttendees: number;
  averageAttendanceRate: number;
  popularEventTypes: Array<{
    type: string;
    count: number;
    attendanceRate: number;
  }>;
  registrationTrends: Array<{
    date: string;
    registrations: number;
    attendees: number;
  }>;
  topHosts: Array<{
    hostId: string;
    hostName: string;
    eventCount: number;
    totalAttendees: number;
  }>;
  revenueMetrics: {
    totalRevenue: number;
    averageTicketPrice: number;
    paidEvents: number;
  };
}

export interface EventDetails extends Event {
  host: {
    id: string;
    name: string;
    email: string;
  };
  registrationCount: number;
  attendeeCount: number;
  waitlistCount: number;
  isUserRegistered?: boolean;
  userRegistrationStatus?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  status: string;
  attendeeCount: number;
  maxAttendees?: number;
  color: string;
}

export class EventsService {
  constructor(private config: {
    enableReminders?: boolean;
    enableRecording?: boolean;
    enableStreaming?: boolean;
    maxEventDuration?: number; // hours
  } = {}) {
    this.config = {
      enableReminders: true,
      enableRecording: true,
      enableStreaming: true,
      maxEventDuration: 8,
      ...config
    };
  }

  // Event Management
  async createEvent(eventData: Event): Promise<EventDetails> {
    const validatedData = EventSchema.parse(eventData);

    // Validate event duration
    const duration = (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / (1000 * 60 * 60);
    if (duration > (this.config.maxEventDuration || 8)) {
      throw new Error(`Event duration cannot exceed ${this.config.maxEventDuration} hours`);
    }

    const event = await prisma.event.create({
      data: {
        ...validatedData,
        id: validatedData.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            registrations: true,
            attendees: { where: { status: 'attended' } },
            waitlist: { where: { status: 'waitlisted' } }
          }
        }
      }
    });

    // Schedule reminder notifications
    if (this.config.enableReminders && validatedData.reminderTimes.length > 0) {
      await this.scheduleEventReminders(event.id, validatedData.startTime, validatedData.reminderTimes);
    }

    return {
      ...event,
      registrationCount: event._count.registrations,
      attendeeCount: event._count.attendees,
      waitlistCount: event._count.waitlist,
    };
  }

  async getEvent(eventId: string, userId?: string): Promise<EventDetails | null> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        coHosts: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            registrations: true,
            attendees: { where: { status: 'attended' } },
            waitlist: { where: { status: 'waitlisted' } }
          }
        }
      }
    });

    if (!event) return null;

    let userRegistration = null;
    if (userId) {
      userRegistration = await prisma.eventRegistration.findFirst({
        where: { eventId, userId }
      });
    }

    return {
      ...event,
      registrationCount: event._count.registrations,
      attendeeCount: event._count.attendees,
      waitlistCount: event._count.waitlist,
      isUserRegistered: !!userRegistration,
      userRegistrationStatus: userRegistration?.status,
    };
  }

  async getEvents(options: {
    siteId: string;
    hostId?: string;
    type?: string[];
    status?: string[];
    startDate?: Date;
    endDate?: Date;
    includePrivate?: boolean;
    sortBy?: 'startTime' | 'title' | 'registrations';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ events: EventDetails[]; total: number }> {
    const {
      siteId,
      hostId,
      type,
      status,
      startDate,
      endDate,
      includePrivate = false,
      sortBy = 'startTime',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = options;

    const whereClause: any = { siteId };

    if (hostId) {
      whereClause.hostId = hostId;
    }

    if (type && type.length > 0) {
      whereClause.type = { in: type };
    }

    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    if (!includePrivate) {
      whereClause.isPrivate = false;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = startDate;
      }
      if (endDate) {
        whereClause.startTime.lte = endDate;
      }
    }

    const orderBy = this.getEventOrderBy(sortBy, sortOrder);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          host: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              registrations: true,
              attendees: { where: { status: 'attended' } },
              waitlist: { where: { status: 'waitlisted' } }
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.event.count({ where: whereClause })
    ]);

    const eventDetails = events.map(event => ({
      ...event,
      registrationCount: event._count.registrations,
      attendeeCount: event._count.attendees,
      waitlistCount: event._count.waitlist,
    }));

    return { events: eventDetails, total };
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<EventDetails> {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            registrations: true,
            attendees: { where: { status: 'attended' } },
            waitlist: { where: { status: 'waitlisted' } }
          }
        }
      }
    });

    // Send update notifications to registered users
    if (updates.startTime || updates.endTime || updates.status === 'cancelled') {
      await this.sendEventUpdateNotifications(eventId, updates);
    }

    return {
      ...event,
      registrationCount: event._count.registrations,
      attendeeCount: event._count.attendees,
      waitlistCount: event._count.waitlist,
    };
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      // Cancel all scheduled notifications
      await prisma.eventNotification.updateMany({
        where: { eventId, status: 'scheduled' },
        data: { status: 'failed' }
      });

      // Delete the event
      await prisma.event.delete({
        where: { id: eventId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  // Registration Management
  async registerForEvent(registrationData: EventRegistration): Promise<EventRegistration> {
    const validatedData = EventRegistrationSchema.parse(registrationData);

    // Check if event exists and is open for registration
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        _count: { select: { registrations: true } }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      throw new Error('Event is not available for registration');
    }

    // Check if user is already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId: validatedData.eventId,
        userId: validatedData.userId
      }
    });

    if (existing) {
      throw new Error('User is already registered for this event');
    }

    // Determine registration status
    let status = 'registered';
    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      status = 'waitlisted';
    }
    if (event.requiresApproval) {
      status = event.maxAttendees && event._count.registrations >= event.maxAttendees ? 'waitlisted' : 'registered';
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        ...validatedData,
        id: validatedData.id || `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status,
      },
      include: {
        event: {
          select: { title: true, startTime: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send confirmation notification
    await this.sendRegistrationConfirmation(registration);

    return registration;
  }

  async getEventRegistrations(eventId: string, options: {
    status?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<{ registrations: EventRegistration[]; total: number }> {
    const { status, limit = 100, offset = 0 } = options;

    const whereClause: any = { eventId };
    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { registeredAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.eventRegistration.count({ where: whereClause })
    ]);

    return { registrations, total };
  }

  async updateRegistration(registrationId: string, updates: Partial<EventRegistration>): Promise<EventRegistration> {
    const registration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: updates,
      include: {
        event: {
          select: { title: true, startTime: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send notification for status changes
    if (updates.status) {
      await this.sendRegistrationStatusNotification(registration);
    }

    return registration;
  }

  async cancelRegistration(eventId: string, userId: string): Promise<boolean> {
    try {
      await prisma.eventRegistration.updateMany({
        where: { eventId, userId },
        data: { status: 'cancelled' }
      });

      // Promote someone from waitlist if there's capacity
      await this.promoteFromWaitlist(eventId);

      return true;
    } catch (error) {
      console.error('Error cancelling registration:', error);
      return false;
    }
  }

  // Calendar and Scheduling
  async getEventCalendar(calendarData: EventCalendar): Promise<CalendarEvent[]> {
    const validatedData = EventCalendarSchema.parse(calendarData);

    const whereClause: any = {
      siteId: validatedData.siteId,
      startTime: {
        gte: new Date(validatedData.startDate),
        lte: new Date(validatedData.endDate),
      }
    };

    if (validatedData.hostId) {
      whereClause.hostId = validatedData.hostId;
    }

    if (validatedData.type && validatedData.type.length > 0) {
      whereClause.type = { in: validatedData.type };
    }

    if (validatedData.status && validatedData.status.length > 0) {
      whereClause.status = { in: validatedData.status };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      type: event.type,
      status: event.status,
      attendeeCount: event._count.registrations,
      maxAttendees: event.maxAttendees,
      color: this.getEventColor(event.type, event.status),
    }));
  }

  // Streaming Integration
  async configureStreaming(eventId: string, streamingConfig: StreamingConfig): Promise<boolean> {
    if (!this.config.enableStreaming) {
      throw new Error('Streaming is not enabled');
    }

    const validatedConfig = StreamingConfigSchema.parse(streamingConfig);

    try {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          streamingUrl: this.generateStreamingUrl(validatedConfig),
          metadata: {
            streaming: validatedConfig
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error configuring streaming:', error);
      return false;
    }
  }

  async startLiveStream(eventId: string): Promise<boolean> {
    try {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          status: 'live',
          metadata: {
            liveStartedAt: new Date().toISOString()
          }
        }
      });

      // Send "event started" notifications
      await this.sendEventStartNotifications(eventId);

      return true;
    } catch (error) {
      console.error('Error starting live stream:', error);
      return false;
    }
  }

  async endLiveStream(eventId: string, recordingUrl?: string): Promise<boolean> {
    try {
      const updateData: any = {
        status: 'completed',
        metadata: {
          liveEndedAt: new Date().toISOString()
        }
      };

      if (recordingUrl && this.config.enableRecording) {
        updateData.recordingUrl = recordingUrl;
      }

      await prisma.event.update({
        where: { id: eventId },
        data: updateData
      });

      // Send recording ready notifications if recording is available
      if (recordingUrl) {
        await this.sendRecordingReadyNotifications(eventId);
      }

      return true;
    } catch (error) {
      console.error('Error ending live stream:', error);
      return false;
    }
  }

  // Analytics
  async getEventAnalytics(siteId: string, timeRange: string = '30d'): Promise<EventAnalytics> {
    const dateFilter = this.getDateFilter(timeRange);

    const [
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalAttendees,
      eventTypes,
      registrationTrends,
      topHosts,
      revenueData
    ] = await Promise.all([
      prisma.event.count({
        where: { siteId, createdAt: dateFilter }
      }),
      prisma.event.count({
        where: { siteId, status: 'published', startTime: { gte: new Date() } }
      }),
      prisma.event.count({
        where: { siteId, status: 'completed', endTime: dateFilter }
      }),
      prisma.eventRegistration.count({
        where: { siteId, registeredAt: dateFilter }
      }),
      prisma.eventRegistration.count({
        where: { siteId, status: 'attended', attendedAt: dateFilter }
      }),
      this.getEventTypeAnalytics(siteId, dateFilter),
      this.getRegistrationTrends(siteId, timeRange),
      this.getTopHosts(siteId, dateFilter),
      this.getRevenueMetrics(siteId, dateFilter)
    ]);

    const averageAttendanceRate = totalRegistrations > 0 ? (totalAttendees / totalRegistrations) * 100 : 0;

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalAttendees,
      averageAttendanceRate,
      popularEventTypes: eventTypes,
      registrationTrends,
      topHosts,
      revenueMetrics: revenueData,
    };
  }

  // Helper methods
  private async scheduleEventReminders(eventId: string, startTime: Date, reminderTimes: number[]): Promise<void> {
    for (const hours of reminderTimes) {
      const scheduledFor = new Date(startTime.getTime() - (hours * 60 * 60 * 1000));
      
      if (scheduledFor > new Date()) {
        await prisma.eventNotification.create({
          data: {
            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId,
            userId: '', // Will be populated when sending
            type: 'reminder',
            scheduledFor,
            content: `Event reminder: Event starts in ${hours} hour(s)`,
            siteId: '', // Will be populated from event
          }
        });
      }
    }
  }

  private async sendEventUpdateNotifications(eventId: string, updates: Partial<Event>): Promise<void> {
    // Implementation for sending update notifications
    console.log('Sending event update notifications for:', eventId, updates);
  }

  private async sendRegistrationConfirmation(registration: any): Promise<void> {
    // Implementation for sending registration confirmation
    console.log('Sending registration confirmation for:', registration.id);
  }

  private async sendRegistrationStatusNotification(registration: any): Promise<void> {
    // Implementation for sending status change notifications
    console.log('Sending registration status notification for:', registration.id);
  }

  private async sendEventStartNotifications(eventId: string): Promise<void> {
    // Implementation for sending event start notifications
    console.log('Sending event start notifications for:', eventId);
  }

  private async sendRecordingReadyNotifications(eventId: string): Promise<void> {
    // Implementation for sending recording ready notifications
    console.log('Sending recording ready notifications for:', eventId);
  }

  private async promoteFromWaitlist(eventId: string): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: { where: { status: 'registered' } } } } }
    });

    if (event && event.maxAttendees && event._count.registrations < event.maxAttendees) {
      const waitlisted = await prisma.eventRegistration.findFirst({
        where: { eventId, status: 'waitlisted' },
        orderBy: { registeredAt: 'asc' }
      });

      if (waitlisted) {
        await this.updateRegistration(waitlisted.id, { status: 'registered' });
      }
    }
  }

  private generateStreamingUrl(config: StreamingConfig): string {
    switch (config.platform) {
      case 'youtube':
        return `https://youtube.com/embed/${config.streamKey}`;
      case 'twitch':
        return `https://player.twitch.tv/?channel=${config.streamKey}`;
      case 'zoom':
        return `https://zoom.us/j/${config.meetingId}`;
      default:
        return config.serverUrl || '';
    }
  }

  private getEventColor(type: string, status: string): string {
    if (status === 'cancelled') return '#dc3545';
    if (status === 'completed') return '#6c757d';
    if (status === 'live') return '#dc3545';

    switch (type) {
      case 'webinar': return '#007bff';
      case 'livestream': return '#e83e8c';
      case 'workshop': return '#28a745';
      case 'conference': return '#fd7e14';
      case 'meetup': return '#20c997';
      default: return '#6f42c1';
    }
  }

  private getEventOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'title':
        return { title: order };
      case 'registrations':
        return { registrations: { _count: order } };
      case 'startTime':
      default:
        return { startTime: order };
    }
  }

  private getDateFilter(timeRange: string) {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return { gte: startDate };
  }

  private async getEventTypeAnalytics(siteId: string, dateFilter: any) {
    // Implementation for event type analytics
    return [];
  }

  private async getRegistrationTrends(siteId: string, timeRange: string) {
    // Implementation for registration trends
    return [];
  }

  private async getTopHosts(siteId: string, dateFilter: any) {
    // Implementation for top hosts analytics
    return [];
  }

  private async getRevenueMetrics(siteId: string, dateFilter: any) {
    // Implementation for revenue metrics
    return {
      totalRevenue: 0,
      averageTicketPrice: 0,
      paidEvents: 0,
    };
  }
}

export const eventsService = new EventsService({
  enableReminders: true,
  enableRecording: true,
  enableStreaming: true,
  maxEventDuration: 8,
}); 