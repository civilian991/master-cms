import { EventsService, Event, EventRegistration, StreamingConfig } from '@/lib/services/events';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    eventRegistration: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    eventNotification: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  event: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  eventRegistration: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  eventNotification: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('EventsService', () => {
  let eventsService: EventsService;

  beforeEach(() => {
    eventsService = new EventsService({
      enableReminders: true,
      enableRecording: true,
      enableStreaming: true,
      maxEventDuration: 8,
    });
    jest.clearAllMocks();
  });

  describe('Event Management', () => {
    const mockEvent: Event = {
      id: 'event_123',
      title: 'Test Webinar',
      description: 'A test webinar event',
      type: 'webinar',
      status: 'draft',
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T12:00:00Z'),
      timezone: 'UTC',
      maxAttendees: 100,
      price: 0,
      currency: 'USD',
      isOnline: true,
      hostId: 'host_123',
      coHosts: [],
      tags: ['tech', 'webinar'],
      isRecorded: true,
      isPrivate: false,
      requiresApproval: false,
      reminderTimes: [24, 1],
      metadata: {},
      siteId: 'site_123',
    };

    it('should create an event', async () => {
      const createdEvent = {
        ...mockEvent,
        host: { id: 'host_123', name: 'Host User', email: 'host@example.com' },
        _count: { registrations: 0, attendees: 0, waitlist: 0 }
      };

      mockPrisma.event.create.mockResolvedValue(createdEvent);

      const result = await eventsService.createEvent(mockEvent);

      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: mockEvent.title,
          type: mockEvent.type,
          startTime: mockEvent.startTime,
          endTime: mockEvent.endTime,
          hostId: mockEvent.hostId,
        }),
        include: expect.any(Object),
      });
      expect(result.registrationCount).toBe(0);
      expect(result.attendeeCount).toBe(0);
    });

    it('should reject events that exceed maximum duration', async () => {
      const longEvent = {
        ...mockEvent,
        endTime: new Date('2024-02-02T10:00:00Z'), // 24 hours duration
      };

      await expect(eventsService.createEvent(longEvent))
        .rejects.toThrow('Event duration cannot exceed 8 hours');
    });

    it('should get an event with user registration status', async () => {
      const eventWithDetails = {
        ...mockEvent,
        host: { id: 'host_123', name: 'Host User', email: 'host@example.com' },
        coHosts: [],
        _count: { registrations: 5, attendees: 3, waitlist: 1 }
      };

      const userRegistration = {
        id: 'reg_123',
        eventId: 'event_123',
        userId: 'user_123',
        status: 'registered'
      };

      mockPrisma.event.findUnique.mockResolvedValue(eventWithDetails);
      mockPrisma.eventRegistration.findFirst.mockResolvedValue(userRegistration);

      const result = await eventsService.getEvent('event_123', 'user_123');

      expect(result?.isUserRegistered).toBe(true);
      expect(result?.userRegistrationStatus).toBe('registered');
      expect(result?.registrationCount).toBe(5);
    });

    it('should get events with filters', async () => {
      const events = [mockEvent];
      mockPrisma.event.findMany.mockResolvedValue(events);
      mockPrisma.event.count.mockResolvedValue(1);

      const options = {
        siteId: 'site_123',
        type: ['webinar'],
        status: ['published'],
        hostId: 'host_123',
        limit: 50,
        offset: 0,
      };

      const result = await eventsService.getEvents(options);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          type: { in: ['webinar'] },
          status: { in: ['published'] },
          hostId: 'host_123',
        }),
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
        take: 50,
        skip: 0,
      });
      expect(result.total).toBe(1);
    });

    it('should update an event', async () => {
      const updates = { title: 'Updated Event Title', status: 'published' as const };
      const updatedEvent = {
        ...mockEvent,
        ...updates,
        host: { id: 'host_123', name: 'Host User', email: 'host@example.com' },
        _count: { registrations: 0, attendees: 0, waitlist: 0 }
      };

      mockPrisma.event.update.mockResolvedValue(updatedEvent);

      const result = await eventsService.updateEvent('event_123', updates);

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event_123' },
        data: expect.objectContaining(updates),
        include: expect.any(Object),
      });
      expect(result.title).toBe('Updated Event Title');
    });

    it('should delete an event', async () => {
      mockPrisma.eventNotification.updateMany.mockResolvedValue({});
      mockPrisma.event.delete.mockResolvedValue(mockEvent);

      const result = await eventsService.deleteEvent('event_123');

      expect(mockPrisma.eventNotification.updateMany).toHaveBeenCalledWith({
        where: { eventId: 'event_123', status: 'scheduled' },
        data: { status: 'failed' }
      });
      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event_123' }
      });
      expect(result).toBe(true);
    });
  });

  describe('Registration Management', () => {
    const mockRegistration: EventRegistration = {
      id: 'reg_123',
      eventId: 'event_123',
      userId: 'user_123',
      status: 'registered',
      registeredAt: new Date(),
      questions: {},
      notes: '',
      siteId: 'site_123',
    };

    it('should register user for event', async () => {
      const event = {
        id: 'event_123',
        status: 'published',
        maxAttendees: 100,
        requiresApproval: false,
        _count: { registrations: 50 }
      };

      const createdRegistration = {
        ...mockRegistration,
        event: { title: 'Test Event', startTime: new Date() },
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com' }
      };

      mockPrisma.event.findUnique.mockResolvedValue(event);
      mockPrisma.eventRegistration.findFirst.mockResolvedValue(null);
      mockPrisma.eventRegistration.create.mockResolvedValue(createdRegistration);

      const result = await eventsService.registerForEvent(mockRegistration);

      expect(mockPrisma.eventRegistration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'event_123',
          userId: 'user_123',
          status: 'registered',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdRegistration);
    });

    it('should put user on waitlist when event is full', async () => {
      const fullEvent = {
        id: 'event_123',
        status: 'published',
        maxAttendees: 100,
        requiresApproval: false,
        _count: { registrations: 100 } // Event is full
      };

      const waitlistedRegistration = {
        ...mockRegistration,
        status: 'waitlisted',
        event: { title: 'Test Event', startTime: new Date() },
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com' }
      };

      mockPrisma.event.findUnique.mockResolvedValue(fullEvent);
      mockPrisma.eventRegistration.findFirst.mockResolvedValue(null);
      mockPrisma.eventRegistration.create.mockResolvedValue(waitlistedRegistration);

      const result = await eventsService.registerForEvent(mockRegistration);

      expect(result.status).toBe('waitlisted');
    });

    it('should prevent duplicate registration', async () => {
      const event = {
        id: 'event_123',
        status: 'published',
        _count: { registrations: 50 }
      };

      const existingRegistration = { ...mockRegistration };

      mockPrisma.event.findUnique.mockResolvedValue(event);
      mockPrisma.eventRegistration.findFirst.mockResolvedValue(existingRegistration);

      await expect(eventsService.registerForEvent(mockRegistration))
        .rejects.toThrow('User is already registered for this event');
    });

    it('should get event registrations', async () => {
      const registrations = [
        {
          ...mockRegistration,
          user: { id: 'user_123', name: 'Test User', email: 'test@example.com' }
        }
      ];

      mockPrisma.eventRegistration.findMany.mockResolvedValue(registrations);
      mockPrisma.eventRegistration.count.mockResolvedValue(1);

      const result = await eventsService.getEventRegistrations('event_123', {
        status: ['registered'],
        limit: 100,
        offset: 0,
      });

      expect(mockPrisma.eventRegistration.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event_123', status: { in: ['registered'] } },
        include: expect.any(Object),
        orderBy: { registeredAt: 'asc' },
        take: 100,
        skip: 0,
      });
      expect(result.registrations).toEqual(registrations);
      expect(result.total).toBe(1);
    });

    it('should update registration status', async () => {
      const updates = { status: 'approved' as const };
      const updatedRegistration = {
        ...mockRegistration,
        ...updates,
        event: { title: 'Test Event', startTime: new Date() },
        user: { id: 'user_123', name: 'Test User', email: 'test@example.com' }
      };

      mockPrisma.eventRegistration.update.mockResolvedValue(updatedRegistration);

      const result = await eventsService.updateRegistration('reg_123', updates);

      expect(mockPrisma.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: 'reg_123' },
        data: updates,
        include: expect.any(Object),
      });
      expect(result.status).toBe('approved');
    });

    it('should cancel registration', async () => {
      mockPrisma.eventRegistration.updateMany.mockResolvedValue({ count: 1 });
      
      // Mock for promoting from waitlist
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event_123',
        maxAttendees: 100,
        _count: { registrations: { where: { status: 'registered' } } }
      });

      const result = await eventsService.cancelRegistration('event_123', 'user_123');

      expect(mockPrisma.eventRegistration.updateMany).toHaveBeenCalledWith({
        where: { eventId: 'event_123', userId: 'user_123' },
        data: { status: 'cancelled' }
      });
      expect(result).toBe(true);
    });
  });

  describe('Calendar and Scheduling', () => {
    it('should get calendar events', async () => {
      const events = [
        {
          id: 'event_1',
          title: 'Event 1',
          startTime: new Date('2024-02-01T10:00:00Z'),
          endTime: new Date('2024-02-01T12:00:00Z'),
          type: 'webinar',
          status: 'published',
          _count: { registrations: 25 },
          maxAttendees: 100
        }
      ];

      mockPrisma.event.findMany.mockResolvedValue(events);

      const calendarData = {
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-02-28T23:59:59Z',
        siteId: 'site_123',
      };

      const result = await eventsService.getEventCalendar(calendarData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'event_1',
        title: 'Event 1',
        start: '2024-02-01T10:00:00.000Z',
        end: '2024-02-01T12:00:00.000Z',
        type: 'webinar',
        status: 'published',
        attendeeCount: 25,
        maxAttendees: 100,
        color: expect.any(String),
      });
    });
  });

  describe('Streaming Integration', () => {
    const streamingConfig: StreamingConfig = {
      platform: 'youtube',
      streamKey: 'test-stream-key',
      settings: { quality: 'HD' },
    };

    it('should configure streaming', async () => {
      mockPrisma.event.update.mockResolvedValue({});

      const result = await eventsService.configureStreaming('event_123', streamingConfig);

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event_123' },
        data: {
          streamingUrl: expect.stringContaining('youtube.com'),
          metadata: { streaming: streamingConfig }
        }
      });
      expect(result).toBe(true);
    });

    it('should start live stream', async () => {
      mockPrisma.event.update.mockResolvedValue({});

      const result = await eventsService.startLiveStream('event_123');

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event_123' },
        data: {
          status: 'live',
          metadata: {
            liveStartedAt: expect.any(String)
          }
        }
      });
      expect(result).toBe(true);
    });

    it('should end live stream with recording', async () => {
      const recordingUrl = 'https://example.com/recording.mp4';
      mockPrisma.event.update.mockResolvedValue({});

      const result = await eventsService.endLiveStream('event_123', recordingUrl);

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event_123' },
        data: {
          status: 'completed',
          recordingUrl,
          metadata: {
            liveEndedAt: expect.any(String)
          }
        }
      });
      expect(result).toBe(true);
    });

    it('should generate correct streaming URLs for different platforms', async () => {
      const configs = [
        { platform: 'youtube' as const, streamKey: 'test123', expected: 'youtube.com/embed/test123' },
        { platform: 'twitch' as const, streamKey: 'channel123', expected: 'player.twitch.tv/?channel=channel123' },
        { platform: 'zoom' as const, meetingId: '123456789', expected: 'zoom.us/j/123456789' },
      ];

      for (const config of configs) {
        mockPrisma.event.update.mockResolvedValue({});
        
        await eventsService.configureStreaming('event_123', config);
        
        expect(mockPrisma.event.update).toHaveBeenCalledWith({
          where: { id: 'event_123' },
          data: {
            streamingUrl: expect.stringContaining(config.expected),
            metadata: { streaming: config }
          }
        });
      }
    });
  });

  describe('Analytics', () => {
    it('should get event analytics', async () => {
      mockPrisma.event.count
        .mockResolvedValueOnce(50)  // total events
        .mockResolvedValueOnce(10)  // upcoming events
        .mockResolvedValueOnce(35); // completed events

      mockPrisma.eventRegistration.count
        .mockResolvedValueOnce(500) // total registrations
        .mockResolvedValueOnce(350); // total attendees

      const result = await eventsService.getEventAnalytics('site_123', '30d');

      expect(result.totalEvents).toBe(50);
      expect(result.upcomingEvents).toBe(10);
      expect(result.completedEvents).toBe(35);
      expect(result.totalRegistrations).toBe(500);
      expect(result.totalAttendees).toBe(350);
      expect(result.averageAttendanceRate).toBe(70);
    });
  });

  describe('Error Handling', () => {
    it('should handle event creation errors', async () => {
      mockPrisma.event.create.mockRejectedValue(new Error('Database error'));

      await expect(eventsService.createEvent({
        title: 'Test Event',
        type: 'webinar',
        startTime: new Date(),
        endTime: new Date(),
        hostId: 'host_123',
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle registration errors gracefully', async () => {
      const event = { id: 'event_123', status: 'cancelled' };
      mockPrisma.event.findUnique.mockResolvedValue(event);

      await expect(eventsService.registerForEvent({
        eventId: 'event_123',
        userId: 'user_123',
        siteId: 'site_123',
      })).rejects.toThrow('Event is not available for registration');
    });

    it('should handle streaming configuration errors', async () => {
      mockPrisma.event.update.mockRejectedValue(new Error('Streaming error'));

      const result = await eventsService.configureStreaming('event_123', {
        platform: 'youtube',
        streamKey: 'test',
      });

      expect(result).toBe(false);
    });

    it('should handle delete errors gracefully', async () => {
      mockPrisma.event.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await eventsService.deleteEvent('event_123');

      expect(result).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate event data', async () => {
      const invalidEvent = {
        title: '', // Invalid: empty title
        type: 'webinar',
        startTime: new Date(),
        endTime: new Date(),
        hostId: 'host_123',
        siteId: 'site_123',
      };

      await expect(eventsService.createEvent(invalidEvent as any))
        .rejects.toThrow();
    });

    it('should validate registration data', async () => {
      const invalidRegistration = {
        eventId: '', // Invalid: empty event ID
        userId: 'user_123',
        siteId: 'site_123',
      };

      await expect(eventsService.registerForEvent(invalidRegistration as any))
        .rejects.toThrow();
    });

    it('should validate calendar data', async () => {
      const invalidCalendar = {
        startDate: 'invalid-date',
        endDate: '2024-02-28T23:59:59Z',
        siteId: 'site_123',
      };

      await expect(eventsService.getEventCalendar(invalidCalendar as any))
        .rejects.toThrow();
    });
  });

  describe('Business Logic', () => {
    it('should promote user from waitlist when registration is cancelled', async () => {
      // Setup: Event with capacity and waitlisted user
      const event = {
        id: 'event_123',
        maxAttendees: 100,
        _count: { registrations: { where: { status: 'registered' } } }
      };

      const waitlistedUser = {
        id: 'reg_waitlist',
        eventId: 'event_123',
        userId: 'waitlisted_user',
        status: 'waitlisted',
        registeredAt: new Date()
      };

      mockPrisma.eventRegistration.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.event.findUnique.mockResolvedValue(event);
      mockPrisma.eventRegistration.findFirst.mockResolvedValue(waitlistedUser);
      mockPrisma.eventRegistration.update.mockResolvedValue({
        ...waitlistedUser,
        status: 'registered'
      });

      const result = await eventsService.cancelRegistration('event_123', 'user_123');

      expect(result).toBe(true);
      // Verify that promotion logic was called
      expect(mockPrisma.event.findUnique).toHaveBeenCalled();
    });

    it('should handle event time conflicts validation', async () => {
      const conflictingEvent = {
        title: 'Conflicting Event',
        type: 'webinar' as const,
        startTime: new Date('2024-02-01T10:00:00Z'),
        endTime: new Date('2024-02-01T09:00:00Z'), // End before start
        hostId: 'host_123',
        siteId: 'site_123',
      };

      // The service should validate that end time is after start time
      await expect(eventsService.createEvent(conflictingEvent))
        .rejects.toThrow();
    });
  });
}); 