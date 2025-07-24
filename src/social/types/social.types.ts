// ============================================================================
// SOCIAL MEDIA TYPE DEFINITIONS
// ============================================================================

// Core Social Media Types
export type SocialPlatform = 
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'snapchat'
  | 'reddit'
  | 'discord';

export type PostType = 
  | 'text'
  | 'image'
  | 'video'
  | 'carousel'
  | 'story'
  | 'reel'
  | 'live'
  | 'poll'
  | 'event'
  | 'article'
  | 'link';

export type PostStatus = 
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled'
  | 'archived';

export type EngagementType = 
  | 'like'
  | 'love'
  | 'laugh'
  | 'wow'
  | 'sad'
  | 'angry'
  | 'share'
  | 'comment'
  | 'click'
  | 'view'
  | 'save'
  | 'follow'
  | 'unfollow';

export type CampaignType = 
  | 'awareness'
  | 'engagement'
  | 'traffic'
  | 'leads'
  | 'sales'
  | 'app_installs'
  | 'video_views'
  | 'brand_awareness'
  | 'reach'
  | 'impressions';

export type AutomationType = 
  | 'auto_publish'
  | 'auto_respond'
  | 'auto_follow'
  | 'auto_like'
  | 'auto_comment'
  | 'auto_share'
  | 'auto_dm'
  | 'auto_hashtag'
  | 'auto_schedule'
  | 'content_recycling';

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

export type InfluencerTier = 'nano' | 'micro' | 'macro' | 'mega' | 'celebrity';

export type ContentCategory = 
  | 'educational'
  | 'entertainment'
  | 'promotional'
  | 'news'
  | 'behind_scenes'
  | 'user_generated'
  | 'testimonial'
  | 'tutorial'
  | 'announcement'
  | 'seasonal';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  isActive: boolean;
  isConnected: boolean;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  permissions: string[];
  createdAt: Date;
  lastSyncAt: Date;
  metadata: Record<string, any>;
}

export interface SocialPost {
  id: string;
  platformPostId?: string;
  platform: SocialPlatform;
  accountId: string;
  type: PostType;
  status: PostStatus;
  content: PostContent;
  media: MediaAttachment[];
  scheduling: PostScheduling;
  targeting?: PostTargeting;
  analytics?: PostAnalytics;
  campaign?: string;
  tags: string[];
  hashtags: string[];
  mentions: string[];
  location?: LocationData;
  settings: PostSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  error?: string;
}

export interface PostContent {
  text: string;
  title?: string;
  description?: string;
  link?: string;
  linkPreview?: LinkPreview;
  poll?: PollData;
  event?: EventData;
  product?: ProductData;
  platformSpecific: Record<SocialPlatform, any>;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gif' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  altText?: string;
  caption?: string;
  metadata: Record<string, any>;
  platformUrls: Record<SocialPlatform, string>;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface PostScheduling {
  publishAt?: Date;
  timezone: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  optimalTiming: boolean;
  sendNotification: boolean;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
  skipHolidays: boolean;
}

export interface PostTargeting {
  countries?: string[];
  cities?: string[];
  languages?: string[];
  ageMin?: number;
  ageMax?: number;
  genders?: string[];
  interests?: string[];
  behaviors?: string[];
  customAudiences?: string[];
  lookalikes?: string[];
  exclusions?: string[];
}

export interface PostSettings {
  allowComments: boolean;
  allowShares: boolean;
  allowDownloads: boolean;
  isPromoted: boolean;
  isSponsored: boolean;
  brandedContent: boolean;
  partnerTags?: string[];
  crosspostPlatforms: SocialPlatform[];
  trackingPixels?: string[];
  utmParameters?: UTMParameters;
}

export interface UTMParameters {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface PostAnalytics {
  postId: string;
  platform: SocialPlatform;
  metrics: EngagementMetrics;
  demographics: DemographicData;
  reach: ReachData;
  engagement: EngagementData;
  clicks: ClickData;
  conversions: ConversionData;
  sentiment: SentimentData;
  topComments: Comment[];
  shareData: ShareData;
  videoMetrics?: VideoMetrics;
  storyMetrics?: StoryMetrics;
  lastUpdated: Date;
  historical: HistoricalMetrics[];
}

export interface EngagementMetrics {
  likes: number;
  loves: number;
  laughs: number;
  wows: number;
  sads: number;
  angrys: number;
  shares: number;
  comments: number;
  clicks: number;
  views: number;
  saves: number;
  engagementRate: number;
  totalEngagements: number;
}

export interface DemographicData {
  gender: Record<string, number>;
  age: Record<string, number>;
  location: Record<string, number>;
  language: Record<string, number>;
  device: Record<string, number>;
  interests: Record<string, number>;
}

export interface ReachData {
  organic: number;
  paid: number;
  viral: number;
  total: number;
  unique: number;
  frequency: number;
  impressions: number;
}

export interface EngagementData {
  reactions: Record<EngagementType, number>;
  hourlyBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, number>;
  topEngagers: UserProfile[];
  engagementSources: Record<string, number>;
}

export interface ClickData {
  linkClicks: number;
  photoViews: number;
  videoPlays: number;
  profileClicks: number;
  websiteClicks: number;
  callToActionClicks: number;
  clickThroughRate: number;
  costPerClick?: number;
}

export interface ConversionData {
  purchases: number;
  leads: number;
  signups: number;
  downloads: number;
  subscriptions: number;
  revenue: number;
  conversionRate: number;
  costPerConversion?: number;
  attributionWindow: number;
}

export interface SentimentData {
  overall: SentimentType;
  score: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
  topKeywords: KeywordSentiment[];
  trendingMentions: MentionData[];
}

export interface VideoMetrics {
  views: number;
  uniqueViews: number;
  watchTime: number;
  averageWatchTime: number;
  completionRate: number;
  quarterViews: {
    quarter1: number;
    quarter2: number;
    quarter3: number;
    quarter4: number;
  };
  dropOffPoints: number[];
  replays: number;
  fullScreenViews: number;
}

export interface StoryMetrics {
  views: number;
  uniqueViews: number;
  impressions: number;
  reach: number;
  exits: number;
  replies: number;
  tapsForward: number;
  tapsBack: number;
  completionRate: number;
  averageWatchTime: number;
}

// ============================================================================
// SOCIAL LISTENING & MONITORING
// ============================================================================

export interface BrandMention {
  id: string;
  platform: SocialPlatform;
  postId: string;
  author: UserProfile;
  content: string;
  url: string;
  type: 'mention' | 'hashtag' | 'direct' | 'indirect';
  sentiment: SentimentType;
  sentimentScore: number;
  influenceScore: number;
  reach: number;
  engagement: number;
  keywords: string[];
  topics: string[];
  location?: LocationData;
  language: string;
  isVerified: boolean;
  requiresResponse: boolean;
  responseStatus: 'pending' | 'responded' | 'ignored' | 'escalated';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  discoveredAt: Date;
  responseDeadline?: Date;
  tags: string[];
  notes: string[];
}

export interface UserProfile {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isVerified: boolean;
  influencerTier?: InfluencerTier;
  engagementRate: number;
  location?: LocationData;
  website?: string;
  joinDate?: Date;
  lastActive?: Date;
  interests: string[];
  demographics: DemographicData;
  reachEstimate: number;
}

export interface KeywordSentiment {
  keyword: string;
  mentions: number;
  sentiment: SentimentType;
  score: number;
  trend: 'up' | 'down' | 'stable';
  platforms: Record<SocialPlatform, number>;
}

export interface MentionData {
  mention: string;
  count: number;
  sentiment: SentimentType;
  reach: number;
  engagement: number;
  influencers: UserProfile[];
  trendingScore: number;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  hashtag?: string;
  volume: number;
  growth: number;
  sentiment: SentimentType;
  platforms: Record<SocialPlatform, number>;
  demographics: DemographicData;
  relatedTopics: string[];
  influencers: UserProfile[];
  samplePosts: SocialPost[];
  peakTime: Date;
  decayRate: number;
  category: ContentCategory;
  relevanceScore: number;
  opportunityScore: number;
  discoveredAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

export interface SocialCampaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  platforms: SocialPlatform[];
  objective: string;
  budget?: CampaignBudget;
  targeting: CampaignTargeting;
  content: CampaignContent;
  schedule: CampaignSchedule;
  analytics: CampaignAnalytics;
  automation: CampaignAutomation;
  team: CampaignTeam;
  settings: CampaignSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date;
  endDate?: Date;
  tags: string[];
  notes: string[];
}

export interface CampaignBudget {
  total: number;
  spent: number;
  remaining: number;
  currency: string;
  dailyBudget?: number;
  platformAllocation: Record<SocialPlatform, number>;
  bidStrategy: 'lowest_cost' | 'target_cost' | 'highest_value';
  optimizationGoal: string;
}

export interface CampaignTargeting {
  audiences: AudienceSegment[];
  lookalikes: LookalikeAudience[];
  interests: string[];
  behaviors: string[];
  demographics: TargetingDemographics;
  locations: LocationTargeting[];
  devices: string[];
  placements: string[];
  exclusions: AudienceSegment[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  criteria: SegmentCriteria;
  platforms: SocialPlatform[];
  isCustom: boolean;
  lastUpdated: Date;
}

export interface CampaignContent {
  posts: string[];
  templates: ContentTemplate[];
  assets: MediaAsset[];
  variations: ContentVariation[];
  personalization: PersonalizationRule[];
  abTests: ABTest[];
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  flightDates: FlightDate[];
  dayparting: DaypartingRule[];
  frequency: FrequencyRule;
  pacing: 'even' | 'accelerated' | 'custom';
}

export interface CampaignAnalytics {
  performance: CampaignPerformance;
  roi: ROIData;
  attribution: AttributionData;
  funnel: FunnelData;
  cohort: CohortData;
  comparison: ComparisonData;
  predictions: PredictionData;
  alerts: AlertRule[];
}

// ============================================================================
// AUTOMATION & WORKFLOWS
// ============================================================================

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type: AutomationType;
  isActive: boolean;
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  schedule: WorkflowSchedule;
  platforms: SocialPlatform[];
  accounts: string[];
  settings: AutomationSettings;
  analytics: AutomationAnalytics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
  runCount: number;
  successRate: number;
  tags: string[];
}

export interface WorkflowTrigger {
  id: string;
  type: 'time' | 'event' | 'condition' | 'webhook' | 'manual';
  config: TriggerConfig;
  isActive: boolean;
}

export interface WorkflowCondition {
  id: string;
  type: 'and' | 'or' | 'not';
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: any;
  children?: WorkflowCondition[];
}

export interface WorkflowAction {
  id: string;
  type: 'post' | 'respond' | 'follow' | 'like' | 'share' | 'notify' | 'webhook';
  config: ActionConfig;
  delay?: number;
  retries: number;
  fallback?: WorkflowAction;
}

export interface AutomationSettings {
  maxDaily: number;
  maxHourly: number;
  respectQuietHours: boolean;
  quietHours: TimeRange;
  requireApproval: boolean;
  approvers: string[];
  errorHandling: 'stop' | 'continue' | 'retry' | 'fallback';
  notifications: NotificationRule[];
  safeguards: SafeguardRule[];
}

export interface AutomationAnalytics {
  executions: number;
  successes: number;
  failures: number;
  successRate: number;
  averageExecutionTime: number;
  errorTypes: Record<string, number>;
  engagement: EngagementMetrics;
  conversions: ConversionData;
  cost: number;
  roi: number;
  trends: TrendData[];
}

// ============================================================================
// INFLUENCER MANAGEMENT
// ============================================================================

export interface Influencer {
  id: string;
  profile: UserProfile;
  tier: InfluencerTier;
  niche: string[];
  categories: ContentCategory[];
  rates: InfluencerRates;
  contact: ContactInfo;
  performance: InfluencerPerformance;
  collaborations: Collaboration[];
  status: 'prospecting' | 'contacted' | 'negotiating' | 'contracted' | 'active' | 'completed' | 'blacklisted';
  rating: number;
  notes: string[];
  tags: string[];
  assignedTo?: string;
  discoveredAt: Date;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
  updatedAt: Date;
}

export interface InfluencerRates {
  postRate: number;
  storyRate: number;
  videoRate: number;
  liveRate: number;
  packageDeals: PackageDeal[];
  currency: string;
  negotiable: boolean;
  lastUpdated: Date;
}

export interface Collaboration {
  id: string;
  influencerId: string;
  campaignId?: string;
  type: 'sponsored' | 'partnership' | 'ambassador' | 'gifted' | 'event';
  status: 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  deliverables: Deliverable[];
  timeline: CollaborationTimeline;
  budget: number;
  contract: ContractDetails;
  content: CollaborationContent[];
  performance: CollaborationPerformance;
  communication: CommunicationThread;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

export interface ContentLibrary {
  id: string;
  name: string;
  description: string;
  type: 'images' | 'videos' | 'templates' | 'assets' | 'brands';
  items: ContentItem[];
  categories: ContentCategory[];
  tags: string[];
  permissions: LibraryPermissions;
  settings: LibrarySettings;
  usage: UsageStatistics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItem {
  id: string;
  name: string;
  description?: string;
  type: 'image' | 'video' | 'gif' | 'template' | 'preset' | 'font' | 'logo';
  url: string;
  thumbnailUrl?: string;
  metadata: ContentMetadata;
  categories: ContentCategory[];
  tags: string[];
  platforms: SocialPlatform[];
  usage: ContentUsage;
  license: LicenseInfo;
  approval: ApprovalStatus;
  versions: ContentVersion[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: PostType;
  platforms: SocialPlatform[];
  layout: TemplateLayout;
  variables: TemplateVariable[];
  styling: TemplateStyling;
  preview: string;
  category: ContentCategory;
  tags: string[];
  usage: number;
  rating: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HashtagStrategy {
  id: string;
  name: string;
  description: string;
  platform: SocialPlatform;
  hashtags: HashtagSet[];
  rules: HashtagRule[];
  performance: HashtagPerformance;
  trends: HashtagTrend[];
  competitors: CompetitorHashtag[];
  automation: HashtagAutomation;
  schedule: HashtagSchedule;
  analytics: HashtagAnalytics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HashtagSet {
  type: 'primary' | 'secondary' | 'niche' | 'trending' | 'branded';
  hashtags: string[];
  maxCount: number;
  rotationStrategy: 'random' | 'sequential' | 'performance' | 'trending';
  performance: HashtagSetPerformance;
}

// ============================================================================
// COMPETITIVE ANALYSIS
// ============================================================================

export interface Competitor {
  id: string;
  name: string;
  description: string;
  accounts: CompetitorAccount[];
  categories: string[];
  market: string;
  geography: string[];
  analysis: CompetitorAnalysis;
  benchmarks: CompetitorBenchmark[];
  alerts: CompetitorAlert[];
  reports: CompetitorReport[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorAccount {
  platform: SocialPlatform;
  username: string;
  url: string;
  followerCount: number;
  isVerified: boolean;
  lastAnalyzed: Date;
  metrics: CompetitorMetrics;
}

export interface CompetitorAnalysis {
  posting: PostingAnalysis;
  content: ContentAnalysis;
  engagement: EngagementAnalysis;
  audience: AudienceAnalysis;
  growth: GrowthAnalysis;
  campaigns: CampaignAnalysis;
  influencers: InfluencerAnalysis;
  trends: TrendAnalysis;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface SocialApiRequest<T = any> {
  platform: SocialPlatform;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: T;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  accountId?: string;
  accessToken?: string;
  rateLimitRetry?: boolean;
  retries?: number;
}

export interface SocialApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  platform: SocialPlatform;
  rateLimit?: RateLimitInfo;
  pagination?: PaginationInfo;
  metadata?: Record<string, any>;
  timestamp: Date;
  requestId: string;
}

export interface PublishingRequest {
  platforms: SocialPlatform[];
  content: PostContent;
  media: MediaAttachment[];
  scheduling: PostScheduling;
  targeting?: PostTargeting;
  settings: PostSettings;
  campaign?: string;
  preview?: boolean;
}

export interface PublishingResponse {
  success: boolean;
  results: PlatformPublishResult[];
  summary: PublishingSummary;
  errors: PublishingError[];
  timestamp: Date;
}

export interface PlatformPublishResult {
  platform: SocialPlatform;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  scheduledFor?: Date;
  metrics?: PostAnalytics;
}

export interface AnalyticsRequest {
  accounts: string[];
  platforms: SocialPlatform[];
  metrics: string[];
  dateRange: DateRange;
  filters?: AnalyticsFilter[];
  groupBy?: string[];
  breakdown?: string;
  comparison?: ComparisonConfig;
}

export interface AnalyticsResponse {
  data: AnalyticsData[];
  summary: AnalyticsSummary;
  trends: TrendData[];
  insights: AnalyticsInsight[];
  metadata: AnalyticsMetadata;
  lastUpdated: Date;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface SocialHubProps {
  userId: string;
  accounts: SocialAccount[];
  onAccountConnect: (platform: SocialPlatform) => void;
  onAccountDisconnect: (accountId: string) => void;
  onRefresh: () => void;
}

export interface UniversalComposerProps {
  platforms: SocialPlatform[];
  accounts: SocialAccount[];
  onPublish: (request: PublishingRequest) => void;
  onSaveDraft: (post: Partial<SocialPost>) => void;
  onSchedule: (post: SocialPost) => void;
  defaultContent?: Partial<PostContent>;
  campaign?: string;
  templates: ContentTemplate[];
}

export interface SocialAnalyticsProps {
  accounts: SocialAccount[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  campaigns?: SocialCampaign[];
  competitors?: Competitor[];
}

export interface SocialSchedulerProps {
  accounts: SocialAccount[];
  posts: SocialPost[];
  onSchedulePost: (post: SocialPost) => void;
  onEditPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onBulkAction: (action: string, postIds: string[]) => void;
  view: 'calendar' | 'list' | 'grid';
  onViewChange: (view: string) => void;
}

export interface SocialInboxProps {
  accounts: SocialAccount[];
  mentions: BrandMention[];
  onRespond: (mentionId: string, response: string) => void;
  onAssign: (mentionId: string, userId: string) => void;
  onResolve: (mentionId: string) => void;
  onFilter: (filters: InboxFilter[]) => void;
  filters: InboxFilter[];
  autoRefresh?: boolean;
}

export interface CampaignManagerProps {
  campaigns: SocialCampaign[];
  onCreateCampaign: (campaign: Partial<SocialCampaign>) => void;
  onEditCampaign: (campaignId: string, updates: Partial<SocialCampaign>) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onDuplicateCampaign: (campaignId: string) => void;
  accounts: SocialAccount[];
  templates: ContentTemplate[];
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseSocialPlatformsOptions {
  autoConnect?: boolean;
  syncInterval?: number;
  enableWebhooks?: boolean;
}

export interface UseSocialAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeCompetitors?: boolean;
  enableRealtime?: boolean;
}

export interface UseSocialSchedulingOptions {
  optimalTiming?: boolean;
  batchPublishing?: boolean;
  retryFailures?: boolean;
  maxRetries?: number;
}

export interface UseSocialInboxOptions {
  autoAssign?: boolean;
  autoRespond?: boolean;
  realtime?: boolean;
  filters?: InboxFilter[];
}

export interface UseSocialAutomationOptions {
  enableAll?: boolean;
  safeMode?: boolean;
  approvalRequired?: boolean;
  maxDailyActions?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';
}

export interface LocationData {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface Comment {
  id: string;
  author: UserProfile;
  content: string;
  sentiment: SentimentType;
  likes: number;
  replies: Comment[];
  createdAt: Date;
  isHidden: boolean;
  isSpam: boolean;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
  siteName?: string;
}

export interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  duration: number;
  isAnonymous: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface EventData {
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: LocationData;
  ticketUrl?: string;
  category: string;
}

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  brand: string;
  category: string;
}

export interface ShareData {
  totalShares: number;
  platformShares: Record<SocialPlatform, number>;
  viralityScore: number;
  shareVelocity: number;
  topSharers: UserProfile[];
}

export interface HistoricalMetrics {
  date: Date;
  metrics: Record<string, number>;
  engagement: EngagementMetrics;
  reach: ReachData;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  window: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
  PINTEREST: 'pinterest',
  SNAPCHAT: 'snapchat',
  REDDIT: 'reddit',
  DISCORD: 'discord',
} as const;

export const POST_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  CAROUSEL: 'carousel',
  STORY: 'story',
  REEL: 'reel',
  LIVE: 'live',
  POLL: 'poll',
  EVENT: 'event',
  ARTICLE: 'article',
  LINK: 'link',
} as const;

export const ENGAGEMENT_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  LAUGH: 'laugh',
  WOW: 'wow',
  SAD: 'sad',
  ANGRY: 'angry',
  SHARE: 'share',
  COMMENT: 'comment',
  CLICK: 'click',
  VIEW: 'view',
  SAVE: 'save',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
} as const;

export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  MIXED: 'mixed',
} as const;

export const PLATFORM_LIMITS = {
  facebook: {
    textLength: 63206,
    hashtagLimit: 30,
    imageLimit: 10,
    videoSizeLimit: 4000000000, // 4GB
    videoLengthLimit: 240 * 60, // 240 minutes
  },
  twitter: {
    textLength: 280,
    hashtagLimit: 0, // No limit but best practice is 1-2
    imageLimit: 4,
    videoSizeLimit: 512000000, // 512MB
    videoLengthLimit: 140, // 140 seconds
  },
  instagram: {
    textLength: 2200,
    hashtagLimit: 30,
    imageLimit: 10,
    videoSizeLimit: 4000000000, // 4GB
    videoLengthLimit: 60 * 60, // 60 minutes
  },
  linkedin: {
    textLength: 3000,
    hashtagLimit: 0, // No official limit
    imageLimit: 9,
    videoSizeLimit: 5000000000, // 5GB
    videoLengthLimit: 10 * 60, // 10 minutes
  },
  tiktok: {
    textLength: 150,
    hashtagLimit: 100,
    imageLimit: 0, // No image posts
    videoSizeLimit: 287000000, // 287MB
    videoLengthLimit: 10 * 60, // 10 minutes
  },
} as const;

export const DEFAULT_POSTING_TIMES = {
  facebook: [9, 13, 15], // 9 AM, 1 PM, 3 PM
  twitter: [8, 12, 17, 19], // 8 AM, 12 PM, 5 PM, 7 PM
  instagram: [11, 13, 17], // 11 AM, 1 PM, 5 PM
  linkedin: [8, 12, 17], // 8 AM, 12 PM, 5 PM
  tiktok: [6, 10, 19], // 6 AM, 10 AM, 7 PM
} as const;

export const AUTOMATION_LIMITS = {
  maxDailyPosts: 10,
  maxHourlyPosts: 2,
  maxDailyLikes: 200,
  maxDailyFollows: 50,
  maxDailyComments: 30,
  maxDailyDMs: 20,
  cooldownPeriod: 300000, // 5 minutes
} as const;

export const ANALYTICS_METRICS = {
  ENGAGEMENT: ['likes', 'comments', 'shares', 'saves', 'clicks'],
  REACH: ['organic', 'paid', 'viral', 'total', 'unique'],
  PERFORMANCE: ['impressions', 'reach', 'engagement_rate', 'ctr', 'cpm'],
  AUDIENCE: ['followers', 'following', 'demographics', 'interests'],
  CONTENT: ['posts', 'stories', 'videos', 'images', 'links'],
} as const;

export default {}; 