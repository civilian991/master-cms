// ============================================================================
// SCHEDULING TYPE DEFINITIONS
// ============================================================================

// Core Scheduling Types
export type ScheduleStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'pending_approval' 
  | 'approved' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

export type ContentType = 
  | 'article' 
  | 'blog_post' 
  | 'social_post' 
  | 'newsletter' 
  | 'product_launch' 
  | 'announcement' 
  | 'video' 
  | 'podcast';

export type Priority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent' 
  | 'critical';

export type PublishingPlatform = 
  | 'website' 
  | 'facebook' 
  | 'twitter' 
  | 'instagram' 
  | 'linkedin' 
  | 'youtube' 
  | 'tiktok' 
  | 'pinterest';

export type WorkflowStage = 
  | 'creation' 
  | 'review' 
  | 'editing' 
  | 'approval' 
  | 'scheduling' 
  | 'publishing' 
  | 'completed';

export type CalendarView = 
  | 'month' 
  | 'week' 
  | 'day' 
  | 'timeline' 
  | 'kanban' 
  | 'list';

export type RecurrenceType = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly' 
  | 'custom';

export type OptimizationMetric = 
  | 'engagement' 
  | 'reach' 
  | 'clicks' 
  | 'conversions' 
  | 'shares' 
  | 'comments';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface ScheduledContent {
  id: string;
  contentId: string;
  title: string;
  description?: string;
  contentType: ContentType;
  status: ScheduleStatus;
  priority: Priority;
  platforms: PublishingPlatform[];
  scheduledAt: Date;
  publishedAt?: Date;
  createdBy: string;
  assignedTo?: string;
  workflowId?: string;
  currentStage: WorkflowStage;
  tags: string[];
  metadata: Record<string, any>;
  content: ContentData;
  recurrence?: RecurrenceRule;
  parentId?: string; // For recurring content
  estimatedDuration?: number; // Minutes
  actualDuration?: number; // Minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentData {
  title: string;
  body: string;
  excerpt?: string;
  featuredImage?: string;
  images?: string[];
  videoUrl?: string;
  audioUrl?: string;
  attachments?: AttachmentData[];
  seoData?: SEOData;
  socialData?: SocialMediaData;
  customFields?: Record<string, any>;
}

export interface AttachmentData {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  alt?: string;
}

export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface SocialMediaData {
  facebook?: SocialPostData;
  twitter?: SocialPostData;
  instagram?: SocialPostData;
  linkedin?: SocialPostData;
  youtube?: SocialPostData;
  tiktok?: SocialPostData;
  pinterest?: SocialPostData;
}

export interface SocialPostData {
  content: string;
  hashtags?: string[];
  mentions?: string[];
  media?: string[];
  scheduledAt?: Date;
  customization?: Record<string, any>;
}

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  endDate?: Date;
  count?: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  daysOfMonth?: number[]; // 1-31
  monthsOfYear?: number[]; // 1-12
  exceptions?: Date[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  contentTypes: ContentType[];
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  notifications: NotificationRule[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowRule {
  id: string;
  stageFrom: WorkflowStage;
  stageTo: WorkflowStage;
  condition: string;
  action: string;
  requiredRoles?: string[];
  autoTransition?: boolean;
  timeoutHours?: number;
}

export interface NotificationRule {
  id: string;
  event: string;
  recipients: string[];
  channels: ('email' | 'push' | 'sms' | 'slack')[];
  template: string;
  delay?: number; // Minutes
}

export interface CalendarEvent {
  id: string;
  scheduledContentId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  recurrence?: RecurrenceRule;
  color?: string;
  isEditable: boolean;
  conflictsWith?: string[];
  metadata: Record<string, any>;
}

export interface TimingOptimization {
  contentId: string;
  platform: PublishingPlatform;
  suggestedTimes: OptimalTime[];
  audienceAnalysis: AudienceInsights;
  competitorAnalysis?: CompetitorTiming;
  seasonalTrends?: SeasonalData;
  confidence: number;
  reasoning: string[];
  generatedAt: Date;
}

export interface OptimalTime {
  datetime: Date;
  score: number;
  expectedEngagement: number;
  expectedReach: number;
  conflictLevel: 'none' | 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface AudienceInsights {
  activeHours: HourData[];
  activeDays: DayData[];
  timeZoneDistribution: TimeZoneData[];
  deviceUsage: DeviceData[];
  engagementPatterns: EngagementPattern[];
}

export interface HourData {
  hour: number; // 0-23
  engagement: number;
  reach: number;
  activity: number;
}

export interface DayData {
  day: number; // 0-6, Sunday = 0
  engagement: number;
  reach: number;
  activity: number;
}

export interface TimeZoneData {
  timezone: string;
  percentage: number;
  peakHours: number[];
}

export interface DeviceData {
  device: 'mobile' | 'desktop' | 'tablet';
  percentage: number;
  peakHours: number[];
}

export interface EngagementPattern {
  pattern: string;
  description: string;
  impact: number;
  confidence: number;
}

export interface CompetitorTiming {
  competitors: CompetitorData[];
  averagePostTimes: Date[];
  gapOpportunities: Date[];
  oversaturatedTimes: Date[];
}

export interface CompetitorData {
  name: string;
  platform: PublishingPlatform;
  averagePostsPerDay: number;
  peakPostingTimes: Date[];
  engagement: number;
}

export interface SeasonalData {
  season: string;
  trends: TrendData[];
  peakPeriods: DateRange[];
  lowPeriods: DateRange[];
}

export interface TrendData {
  trend: string;
  impact: number;
  startDate: Date;
  endDate: Date;
  confidence: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  description?: string;
}

export interface PublishingQueue {
  id: string;
  items: QueueItem[];
  status: 'active' | 'paused' | 'stopped';
  processedCount: number;
  failedCount: number;
  pendingCount: number;
  lastProcessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueItem {
  id: string;
  scheduledContentId: string;
  platform: PublishingPlatform;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: PublishingResult;
  createdAt: Date;
  processedAt?: Date;
}

export interface PublishingResult {
  success: boolean;
  platformId?: string;
  url?: string;
  metrics?: PublishingMetrics;
  error?: string;
  warnings?: string[];
}

export interface PublishingMetrics {
  reach?: number;
  impressions?: number;
  clicks?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  saves?: number;
}

export interface SchedulingAnalytics {
  dateRange: DateRange;
  totalScheduled: number;
  totalPublished: number;
  successRate: number;
  averageEngagement: number;
  bestPerformingTimes: OptimalTime[];
  worstPerformingTimes: OptimalTime[];
  platformPerformance: PlatformAnalytics[];
  contentTypePerformance: ContentTypeAnalytics[];
  trends: AnalyticsTrend[];
}

export interface PlatformAnalytics {
  platform: PublishingPlatform;
  totalPosts: number;
  averageEngagement: number;
  bestTime: Date;
  worstTime: Date;
  successRate: number;
}

export interface ContentTypeAnalytics {
  contentType: ContentType;
  totalScheduled: number;
  averageEngagement: number;
  bestPerformingPlatforms: PublishingPlatform[];
  optimalTiming: OptimalTime[];
}

export interface AnalyticsTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  period: DateRange;
  significance: 'low' | 'medium' | 'high';
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface CreateScheduleRequest {
  contentId: string;
  scheduledAt: Date;
  platforms: PublishingPlatform[];
  recurrence?: RecurrenceRule;
  workflowId?: string;
  priority?: Priority;
  metadata?: Record<string, any>;
}

export interface CreateScheduleResponse {
  success: boolean;
  scheduleId: string;
  scheduledContent: ScheduledContent;
  conflicts?: ConflictData[];
  warnings?: string[];
}

export interface ConflictData {
  type: 'time' | 'platform' | 'resource';
  description: string;
  conflictingItems: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface UpdateScheduleRequest {
  scheduledAt?: Date;
  platforms?: PublishingPlatform[];
  status?: ScheduleStatus;
  assignedTo?: string;
  priority?: Priority;
  metadata?: Record<string, any>;
}

export interface BulkScheduleRequest {
  operations: BulkOperation[];
  validateOnly?: boolean;
}

export interface BulkOperation {
  action: 'create' | 'update' | 'delete' | 'reschedule';
  scheduleId?: string;
  data: any;
}

export interface BulkScheduleResponse {
  success: boolean;
  results: BulkOperationResult[];
  summary: BulkOperationSummary;
}

export interface BulkOperationResult {
  operation: BulkOperation;
  success: boolean;
  scheduleId?: string;
  error?: string;
}

export interface BulkOperationSummary {
  total: number;
  successful: number;
  failed: number;
  warnings: string[];
}

export interface OptimizationRequest {
  contentId: string;
  platforms: PublishingPlatform[];
  targetMetric: OptimizationMetric;
  timeRange?: DateRange;
  audienceSegment?: string;
}

export interface OptimizationResponse {
  success: boolean;
  optimization: TimingOptimization;
  alternatives: TimingOptimization[];
  recommendations: string[];
}

export interface CalendarRequest {
  view: CalendarView;
  dateRange: DateRange;
  filters?: SchedulingFilters;
}

export interface SchedulingFilters {
  status?: ScheduleStatus[];
  contentType?: ContentType[];
  platform?: PublishingPlatform[];
  priority?: Priority[];
  assignedTo?: string[];
  tags?: string[];
  workflowId?: string;
}

export interface CalendarResponse {
  success: boolean;
  events: CalendarEvent[];
  conflicts: ConflictData[];
  summary: CalendarSummary;
}

export interface CalendarSummary {
  totalEvents: number;
  eventsByStatus: Record<ScheduleStatus, number>;
  eventsByPlatform: Record<PublishingPlatform, number>;
  busyDays: Date[];
  freeDays: Date[];
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface SchedulingDashboardProps {
  userId: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  filters?: SchedulingFilters;
  onFiltersChange?: (filters: SchedulingFilters) => void;
}

export interface CalendarInterfaceProps {
  view: CalendarView;
  dateRange: DateRange;
  events: CalendarEvent[];
  onEventCreate: (event: Partial<CalendarEvent>) => void;
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onEventDelete: (eventId: string) => void;
  onDateRangeChange: (range: DateRange) => void;
  isDragEnabled?: boolean;
  isReadOnly?: boolean;
}

export interface WorkflowManagerProps {
  workflows: Workflow[];
  selectedWorkflow?: Workflow;
  onWorkflowSelect: (workflow: Workflow) => void;
  onWorkflowCreate: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onWorkflowUpdate: (workflowId: string, updates: Partial<Workflow>) => void;
  onWorkflowDelete: (workflowId: string) => void;
}

export interface PublishingQueueProps {
  queue: PublishingQueue;
  onQueueAction: (action: 'start' | 'pause' | 'stop' | 'clear') => void;
  onItemAction: (itemId: string, action: 'retry' | 'cancel' | 'prioritize') => void;
  onItemUpdate: (itemId: string, updates: Partial<QueueItem>) => void;
}

export interface TimingOptimizerProps {
  contentId: string;
  platforms: PublishingPlatform[];
  onOptimizationSelect: (optimization: TimingOptimization) => void;
  onOptimizationRefresh: () => void;
  targetMetric?: OptimizationMetric;
}

export interface SocialMediaSchedulerProps {
  scheduledContent: ScheduledContent;
  onPlatformToggle: (platform: PublishingPlatform, enabled: boolean) => void;
  onCustomization: (platform: PublishingPlatform, data: SocialPostData) => void;
  onBulkAction: (action: string, platforms: PublishingPlatform[]) => void;
}

export interface SchedulingAnalyticsProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  filters?: SchedulingFilters;
  onFiltersChange?: (filters: SchedulingFilters) => void;
}

export interface MobileSchedulerProps {
  scheduledContent: ScheduledContent[];
  onScheduleCreate: (schedule: CreateScheduleRequest) => void;
  onScheduleUpdate: (scheduleId: string, updates: UpdateScheduleRequest) => void;
  view: 'list' | 'calendar' | 'queue';
  onViewChange: (view: 'list' | 'calendar' | 'queue') => void;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseSchedulingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableOptimization?: boolean;
  enableConflictDetection?: boolean;
}

export interface UseWorkflowOptions {
  autoTransition?: boolean;
  enableNotifications?: boolean;
  validateTransitions?: boolean;
}

export interface UseCalendarOptions {
  view: CalendarView;
  enableDragDrop?: boolean;
  enableConflictDetection?: boolean;
  maxEventsPerDay?: number;
}

export interface UsePublishingOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
}

export interface UseTimingOptimizationOptions {
  autoOptimize?: boolean;
  optimizationMetric?: OptimizationMetric;
  includeCompetitors?: boolean;
  includeSeasonalData?: boolean;
}

// ============================================================================
// CONSTANTS AND UTILITIES
// ============================================================================

export const SCHEDULE_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled', 
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  PUBLISHING: 'publishing',
  PUBLISHED: 'published',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const CONTENT_TYPES = {
  ARTICLE: 'article',
  BLOG_POST: 'blog_post',
  SOCIAL_POST: 'social_post',
  NEWSLETTER: 'newsletter',
  PRODUCT_LAUNCH: 'product_launch',
  ANNOUNCEMENT: 'announcement',
  VIDEO: 'video',
  PODCAST: 'podcast',
} as const;

export const PUBLISHING_PLATFORMS = {
  WEBSITE: 'website',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  PINTEREST: 'pinterest',
} as const;

export const WORKFLOW_STAGES = {
  CREATION: 'creation',
  REVIEW: 'review',
  EDITING: 'editing',
  APPROVAL: 'approval',
  SCHEDULING: 'scheduling',
  PUBLISHING: 'publishing',
  COMPLETED: 'completed',
} as const;

export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  TIMELINE: 'timeline',
  KANBAN: 'kanban',
  LIST: 'list',
} as const;

export const DEFAULT_SCHEDULE_SETTINGS = {
  AUTO_PUBLISH: true,
  CONFLICT_DETECTION: true,
  OPTIMIZATION_ENABLED: true,
  NOTIFICATION_ENABLED: true,
  MAX_RETRIES: 3,
  RETRY_DELAY: 300000, // 5 minutes
} as const;

export const PLATFORM_LIMITS = {
  TWITTER: { maxLength: 280, maxImages: 4, maxVideos: 1 },
  FACEBOOK: { maxLength: 63206, maxImages: 10, maxVideos: 1 },
  INSTAGRAM: { maxLength: 2200, maxImages: 10, maxVideos: 1 },
  LINKEDIN: { maxLength: 3000, maxImages: 9, maxVideos: 1 },
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ScheduleFilter = {
  userId?: string;
  status?: ScheduleStatus[];
  contentType?: ContentType[];
  platform?: PublishingPlatform[];
  dateRange?: DateRange;
  assignedTo?: string[];
  workflowId?: string;
  priority?: Priority[];
  tags?: string[];
  limit?: number;
  offset?: number;
};

export type CalendarFilter = {
  view: CalendarView;
  dateRange: DateRange;
  showConflicts?: boolean;
  groupBy?: 'platform' | 'contentType' | 'assignee';
  colorBy?: 'status' | 'priority' | 'contentType';
};

export type OptimizationFilter = {
  platforms: PublishingPlatform[];
  targetMetric: OptimizationMetric;
  timeRange?: DateRange;
  audienceSegment?: string;
  includeCompetitors?: boolean;
  minConfidence?: number;
};

export type WorkflowTransition = {
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  userId: string;
  comment?: string;
  metadata?: Record<string, any>;
};

export type PublishingError = {
  code: string;
  message: string;
  platform: PublishingPlatform;
  retryable: boolean;
  details?: Record<string, any>;
};

export type CalendarConflict = {
  type: 'time' | 'platform' | 'resource' | 'workflow';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: string[];
  resolution?: string;
};

export default {}; 