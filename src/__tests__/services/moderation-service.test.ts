import { ModerationService, ModerationRule, UserReport, ModerationAction, SecurityEvent } from '@/lib/services/moderation';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    moderationRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userReport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    moderationAction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    moderationQueue: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    post: {
      update: jest.fn(),
    },
    comment: {
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    blockedIP: {
      create: jest.fn(),
    },
  })),
}));

const mockPrisma = {
  moderationRule: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  userReport: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  moderationAction: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  moderationQueue: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  securityEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  post: {
    update: jest.fn(),
  },
  comment: {
    update: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  blockedIP: {
    create: jest.fn(),
  },
};

describe('ModerationService', () => {
  let moderationService: ModerationService;

  beforeEach(() => {
    moderationService = new ModerationService({
      enableAIModeration: true,
      enableRealTimeScanning: true,
      enableAutoActions: false,
      maxQueueSize: 10000,
      aiConfidenceThreshold: 0.85,
    });
    jest.clearAllMocks();
  });

  describe('Moderation Rules Management', () => {
    const mockRule: ModerationRule = {
      id: 'rule_123',
      name: 'Spam Detection',
      description: 'Detects spam content',
      category: 'spam',
      type: 'automated',
      severity: 'medium',
      action: 'flag',
      conditions: {
        keywords: ['spam', 'click here'],
        patterns: ['(.)\\1{4,}'],
        threshold: 0.8,
        userReports: 3,
        contentType: ['post', 'comment'],
        userRole: [],
        metadata: {},
      },
      isActive: true,
      autoApply: true,
      requiresReview: false,
      escalationLevel: 1,
      siteId: 'site_123',
    };

    it('should create a moderation rule', async () => {
      const createdRule = { ...mockRule, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.moderationRule.create.mockResolvedValue(createdRule);

      const result = await moderationService.createModerationRule(mockRule);

      expect(mockPrisma.moderationRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Spam Detection',
          category: 'spam',
          type: 'automated',
          severity: 'medium',
          action: 'flag',
        }),
      });
      expect(result).toEqual(createdRule);
    });

    it('should get moderation rules with filters', async () => {
      const rules = [mockRule];
      mockPrisma.moderationRule.findMany.mockResolvedValue(rules);
      mockPrisma.moderationRule.count.mockResolvedValue(1);

      const result = await moderationService.getModerationRules('site_123', {
        category: ['spam'],
        type: ['automated'],
        isActive: true,
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.moderationRule.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          category: { in: ['spam'] },
          type: { in: ['automated'] },
          isActive: true,
        }),
        orderBy: expect.any(Array),
        take: 50,
        skip: 0,
      });
      expect(result.rules).toEqual(rules);
      expect(result.total).toBe(1);
    });

    it('should update a moderation rule', async () => {
      const updates = { name: 'Updated Spam Detection', severity: 'high' as const };
      const updatedRule = { ...mockRule, ...updates, updatedAt: new Date() };

      mockPrisma.moderationRule.update.mockResolvedValue(updatedRule);

      const result = await moderationService.updateModerationRule('rule_123', updates);

      expect(mockPrisma.moderationRule.update).toHaveBeenCalledWith({
        where: { id: 'rule_123' },
        data: expect.objectContaining(updates),
      });
      expect(result.name).toBe('Updated Spam Detection');
      expect(result.severity).toBe('high');
    });
  });

  describe('Content Analysis and Filtering', () => {
    it('should analyze content and detect patterns', async () => {
      mockPrisma.moderationRule.findMany.mockResolvedValue([]);

      const result = await moderationService.analyzeContent(
        'CLICK HERE FOR FREE MONEY!!!!!',
        'post',
        {}
      );

      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.categories).toBeInstanceOf(Array);
      expect(result.keywords).toContain('click');
      expect(result.keywords).toContain('free');
      expect(result.keywords).toContain('money');
      expect(result.patterns).toContain('repeated_characters');
      expect(result.patterns).toContain('excessive_caps');
    });

    it('should moderate content and approve clean content', async () => {
      const result = await moderationService.moderateContent(
        'post',
        'post_123',
        'This is a normal, clean post about technology.',
        'user_123',
        'site_123'
      );

      expect(result.action).toBe('approve');
      expect(result.reason).toBe('Content passed all checks');
    });

    it('should flag suspicious content for review', async () => {
      mockPrisma.moderationQueue.findFirst.mockResolvedValue(null);
      mockPrisma.moderationQueue.create.mockResolvedValue({
        id: 'queue_123',
        targetType: 'post',
        targetId: 'post_123',
        siteId: 'site_123',
      });

      const result = await moderationService.moderateContent(
        'post',
        'post_123',
        'This is SPAM content with repeated characters!!!!! Click here for free money.',
        'user_123',
        'site_123'
      );

      expect(result.action).toBe('queue');
      expect(result.reason).toBe('Flagged for manual review');
      expect(result.queueId).toBe('queue_123');
    });

    it('should auto-remove high-confidence violations', async () => {
      const serviceWithAutoActions = new ModerationService({
        enableAutoActions: true,
        aiConfidenceThreshold: 0.5,
      });

      mockPrisma.moderationAction.create.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});

      const result = await serviceWithAutoActions.moderateContent(
        'post',
        'post_123',
        'EXTREME SPAM CONTENT WITH VIOLENCE AND HATE SPEECH!!!!!!',
        'user_123',
        'site_123'
      );

      expect(result.action).toBe('remove');
      expect(result.reason).toBe('Automated removal');
    });
  });

  describe('User Reporting System', () => {
    const mockReport: UserReport = {
      id: 'report_123',
      reporterId: 'user_1',
      targetType: 'post',
      targetId: 'post_123',
      category: 'spam',
      reason: 'This is spam content',
      description: 'The post contains promotional links',
      evidence: [],
      priority: 'medium',
      status: 'pending',
      createdAt: new Date(),
      siteId: 'site_123',
    };

    it('should create a user report', async () => {
      mockPrisma.userReport.findFirst.mockResolvedValue(null); // No duplicate
      mockPrisma.userReport.create.mockResolvedValue(mockReport);
      mockPrisma.userReport.count.mockResolvedValue(1); // First report

      const result = await moderationService.createReport(mockReport);

      expect(mockPrisma.userReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterId: 'user_1',
          targetType: 'post',
          targetId: 'post_123',
          category: 'spam',
          reason: 'This is spam content',
        }),
      });
      expect(result).toEqual(mockReport);
    });

    it('should prevent duplicate reports', async () => {
      const existingReport = { ...mockReport };
      mockPrisma.userReport.findFirst.mockResolvedValue(existingReport);

      await expect(moderationService.createReport(mockReport))
        .rejects.toThrow('You have already reported this content');
    });

    it('should auto-escalate when report threshold reached', async () => {
      mockPrisma.userReport.findFirst.mockResolvedValue(null);
      mockPrisma.userReport.create.mockResolvedValue(mockReport);
      mockPrisma.userReport.count.mockResolvedValue(3); // Threshold reached
      mockPrisma.moderationQueue.findFirst.mockResolvedValue(null);
      mockPrisma.moderationQueue.create.mockResolvedValue({
        id: 'queue_123',
        priority: 'high',
        triggeredBy: 'user_report',
      });

      const result = await moderationService.createReport(mockReport);

      expect(mockPrisma.moderationQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'high',
          triggeredBy: 'user_report',
          reportId: result.id,
        }),
      });
    });

    it('should get reports with filters', async () => {
      const reports = [
        {
          ...mockReport,
          reporter: { id: 'user_1', name: 'Reporter User', email: 'reporter@example.com' }
        }
      ];

      mockPrisma.userReport.findMany.mockResolvedValue(reports);
      mockPrisma.userReport.count.mockResolvedValue(1);

      const result = await moderationService.getReports('site_123', {
        status: ['pending'],
        category: ['spam'],
        priority: ['medium'],
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.userReport.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          status: { in: ['pending'] },
          category: { in: ['spam'] },
          priority: { in: ['medium'] },
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
        take: 50,
        skip: 0,
      });
      expect(result.reports).toEqual(reports);
      expect(result.total).toBe(1);
    });

    it('should update report status', async () => {
      const updates = { status: 'resolved' as const, assignedTo: 'moderator_1' };
      const updatedReport = { ...mockReport, ...updates, updatedAt: new Date() };

      mockPrisma.userReport.update.mockResolvedValue(updatedReport);

      const result = await moderationService.updateReport('report_123', updates);

      expect(mockPrisma.userReport.update).toHaveBeenCalledWith({
        where: { id: 'report_123' },
        data: expect.objectContaining(updates),
      });
      expect(result.status).toBe('resolved');
    });
  });

  describe('Moderation Actions', () => {
    const mockAction: ModerationAction = {
      id: 'action_123',
      targetType: 'post',
      targetId: 'post_123',
      moderatorId: 'mod_123',
      action: 'remove',
      reason: 'Spam content',
      severity: 'medium',
      notes: 'Clear violation of community guidelines',
      isReversible: true,
      notifyUser: true,
      createdAt: new Date(),
      siteId: 'site_123',
    };

    it('should execute moderation action', async () => {
      mockPrisma.moderationAction.create.mockResolvedValue(mockAction);
      mockPrisma.post.update.mockResolvedValue({});

      const result = await moderationService.executeAction(mockAction);

      expect(mockPrisma.moderationAction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'post',
          targetId: 'post_123',
          moderatorId: 'mod_123',
          action: 'remove',
          reason: 'Spam content',
        }),
      });
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post_123' },
        data: { status: 'removed', removedAt: expect.any(Date) }
      });
      expect(result).toEqual(mockAction);
    });

    it('should get moderation actions with filters', async () => {
      const actions = [
        {
          ...mockAction,
          moderator: { id: 'mod_123', name: 'Moderator', email: 'mod@example.com' }
        }
      ];

      mockPrisma.moderationAction.findMany.mockResolvedValue(actions);
      mockPrisma.moderationAction.count.mockResolvedValue(1);

      const result = await moderationService.getModerationActions('site_123', {
        targetType: 'post',
        action: ['remove'],
        severity: ['medium'],
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.moderationAction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          targetType: 'post',
          action: { in: ['remove'] },
          severity: { in: ['medium'] },
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.actions).toEqual(actions);
      expect(result.total).toBe(1);
    });

    it('should suspend user with duration', async () => {
      const suspendAction = {
        ...mockAction,
        targetType: 'user' as const,
        targetId: 'user_123',
        action: 'suspend' as const,
        duration: 24, // 24 hours
      };

      mockPrisma.moderationAction.create.mockResolvedValue(suspendAction);
      mockPrisma.user.update.mockResolvedValue({});

      await moderationService.executeAction(suspendAction);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: {
          status: 'suspended',
          suspendedUntil: expect.any(Date),
          suspendedAt: expect.any(Date),
        }
      });
    });

    it('should ban user permanently', async () => {
      const banAction = {
        ...mockAction,
        targetType: 'user' as const,
        targetId: 'user_123',
        action: 'ban' as const,
      };

      mockPrisma.moderationAction.create.mockResolvedValue(banAction);
      mockPrisma.user.update.mockResolvedValue({});

      await moderationService.executeAction(banAction);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: {
          status: 'banned',
          bannedAt: expect.any(Date),
        }
      });
    });
  });

  describe('Moderation Queue Management', () => {
    const mockQueueItem = {
      id: 'queue_123',
      targetType: 'post' as const,
      targetId: 'post_123',
      priority: 'medium' as const,
      category: 'spam' as const,
      status: 'pending' as const,
      triggeredBy: 'automated' as const,
      confidence: 0.8,
      createdAt: new Date(),
      siteId: 'site_123',
    };

    it('should add item to moderation queue', async () => {
      mockPrisma.moderationQueue.findFirst.mockResolvedValue(null); // No existing item
      mockPrisma.moderationQueue.create.mockResolvedValue(mockQueueItem);

      const result = await moderationService.addToModerationQueue(mockQueueItem);

      expect(mockPrisma.moderationQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'post',
          targetId: 'post_123',
          priority: 'medium',
          category: 'spam',
          triggeredBy: 'automated',
        }),
      });
      expect(result).toEqual(mockQueueItem);
    });

    it('should update priority if higher priority item added', async () => {
      const existingItem = { ...mockQueueItem, priority: 'low' };
      const highPriorityItem = { ...mockQueueItem, priority: 'high' };

      mockPrisma.moderationQueue.findFirst.mockResolvedValue(existingItem);
      mockPrisma.moderationQueue.update.mockResolvedValue(highPriorityItem);

      const result = await moderationService.addToModerationQueue(highPriorityItem);

      expect(mockPrisma.moderationQueue.update).toHaveBeenCalledWith({
        where: { id: existingItem.id },
        data: { priority: 'high' }
      });
      expect(result.priority).toBe('high');
    });

    it('should get moderation queue with filters', async () => {
      const queueItems = [mockQueueItem];

      mockPrisma.moderationQueue.findMany.mockResolvedValue(queueItems);
      mockPrisma.moderationQueue.count.mockResolvedValue(1);

      const result = await moderationService.getModerationQueue('site_123', {
        status: ['pending'],
        priority: ['medium'],
        category: ['spam'],
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.moderationQueue.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          status: { in: ['pending'] },
          priority: { in: ['medium'] },
          category: { in: ['spam'] },
        }),
        orderBy: expect.any(Array),
        take: 50,
        skip: 0,
      });
      expect(result.queue).toEqual(queueItems);
      expect(result.total).toBe(1);
    });

    it('should assign queue item to moderator', async () => {
      const assignedItem = { ...mockQueueItem, assignedTo: 'mod_123', status: 'in_review' };

      mockPrisma.moderationQueue.update.mockResolvedValue(assignedItem);

      const result = await moderationService.assignQueueItem('queue_123', 'mod_123');

      expect(mockPrisma.moderationQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue_123' },
        data: {
          assignedTo: 'mod_123',
          status: 'in_review',
          updatedAt: expect.any(Date),
        }
      });
      expect(result.assignedTo).toBe('mod_123');
    });

    it('should process queue item with decision', async () => {
      mockPrisma.moderationQueue.findUnique.mockResolvedValue(mockQueueItem);
      mockPrisma.moderationAction.create.mockResolvedValue({});
      mockPrisma.moderationQueue.update.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});

      await moderationService.processQueueItem('queue_123', 'approve', 'mod_123', 'Content is acceptable');

      expect(mockPrisma.moderationAction.create).toHaveBeenCalled();
      expect(mockPrisma.moderationQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue_123' },
        data: {
          status: 'approved',
          reviewedBy: 'mod_123',
          updatedAt: expect.any(Date),
        }
      });
    });
  });

  describe('Security Event Management', () => {
    const mockSecurityEvent: SecurityEvent = {
      id: 'security_123',
      type: 'suspicious_activity',
      severity: 'high',
      userId: 'user_123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      location: 'Unknown',
      description: 'Multiple failed login attempts',
      evidence: { attempts: 5, timespan: '5 minutes' },
      status: 'detected',
      action: 'suspend_user',
      createdAt: new Date(),
      siteId: 'site_123',
    };

    it('should record security event', async () => {
      mockPrisma.securityEvent.create.mockResolvedValue(mockSecurityEvent);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await moderationService.recordSecurityEvent(mockSecurityEvent);

      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'suspicious_activity',
          severity: 'high',
          userId: 'user_123',
          description: 'Multiple failed login attempts',
        }),
      });
      expect(result).toEqual(mockSecurityEvent);
    });

    it('should auto-respond to critical security events', async () => {
      const criticalEvent = { ...mockSecurityEvent, severity: 'critical' as const, action: 'block_ip' as const };

      mockPrisma.securityEvent.create.mockResolvedValue(criticalEvent);
      mockPrisma.blockedIP.create.mockResolvedValue({});

      await moderationService.recordSecurityEvent(criticalEvent);

      expect(mockPrisma.blockedIP.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '192.168.1.1',
          reason: 'Security event',
        }),
      });
    });

    it('should get security events with filters', async () => {
      const events = [mockSecurityEvent];

      mockPrisma.securityEvent.findMany.mockResolvedValue(events);
      mockPrisma.securityEvent.count.mockResolvedValue(1);

      const result = await moderationService.getSecurityEvents('site_123', {
        type: ['suspicious_activity'],
        severity: ['high'],
        status: ['detected'],
        userId: 'user_123',
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.securityEvent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          siteId: 'site_123',
          type: { in: ['suspicious_activity'] },
          severity: { in: ['high'] },
          status: { in: ['detected'] },
          userId: 'user_123',
        }),
        orderBy: expect.any(Array),
        take: 50,
        skip: 0,
      });
      expect(result.events).toEqual(events);
      expect(result.total).toBe(1);
    });
  });

  describe('Analytics and Reporting', () => {
    it('should get moderation dashboard', async () => {
      // Mock all the count queries
      mockPrisma.moderationQueue.count
        .mockResolvedValueOnce(25) // pending reviews
        .mockResolvedValueOnce(15) // total queue
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(3)  // in review
        .mockResolvedValueOnce(2); // escalated

      mockPrisma.userReport.count.mockResolvedValue(8); // active reports
      mockPrisma.securityEvent.count.mockResolvedValue(5); // security events
      mockPrisma.moderationAction.count.mockResolvedValue(12); // automated actions

      const result = await moderationService.getModerationDashboard('site_123', '30d');

      expect(result.overview.pendingReviews).toBe(25);
      expect(result.overview.activeReports).toBe(8);
      expect(result.overview.securityEvents).toBe(5);
      expect(result.overview.automatedActions).toBe(12);
      expect(result.queueStats.total).toBe(15);
      expect(result.queueStats.pending).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle rule creation errors', async () => {
      mockPrisma.moderationRule.create.mockRejectedValue(new Error('Database error'));

      await expect(moderationService.createModerationRule({
        name: 'Test Rule',
        description: 'Test description',
        category: 'spam',
        type: 'automated',
        severity: 'medium',
        action: 'flag',
        conditions: {
          keywords: [],
          patterns: [],
          threshold: 0.8,
          userReports: 3,
          contentType: [],
          userRole: [],
          metadata: {},
        },
        siteId: 'site_123',
      })).rejects.toThrow('Database error');
    });

    it('should handle queue processing errors', async () => {
      mockPrisma.moderationQueue.findUnique.mockResolvedValue(null);

      await expect(moderationService.processQueueItem('nonexistent_queue', 'approve', 'mod_123'))
        .rejects.toThrow('Queue item not found');
    });

    it('should handle security event recording errors', async () => {
      mockPrisma.securityEvent.create.mockRejectedValue(new Error('Security error'));

      await expect(moderationService.recordSecurityEvent({
        type: 'login_failed',
        severity: 'low',
        description: 'Failed login',
        siteId: 'site_123',
      })).rejects.toThrow('Security error');
    });
  });

  describe('Validation', () => {
    it('should validate moderation rule data', async () => {
      const invalidRule = {
        name: '', // Invalid: empty name
        description: 'Test description',
        category: 'spam',
        type: 'automated',
        siteId: 'site_123',
      };

      await expect(moderationService.createModerationRule(invalidRule as any))
        .rejects.toThrow();
    });

    it('should validate user report data', async () => {
      const invalidReport = {
        reporterId: '', // Invalid: empty reporter ID
        targetType: 'post',
        targetId: 'post_123',
        category: 'spam',
        reason: 'Test reason',
        siteId: 'site_123',
      };

      mockPrisma.userReport.findFirst.mockResolvedValue(null);

      await expect(moderationService.createReport(invalidReport as any))
        .rejects.toThrow();
    });

    it('should validate security event data', async () => {
      const invalidEvent = {
        type: 'login_failed',
        severity: 'invalid_severity', // Invalid severity
        description: 'Test description',
        siteId: 'site_123',
      };

      await expect(moderationService.recordSecurityEvent(invalidEvent as any))
        .rejects.toThrow();
    });
  });
}); 