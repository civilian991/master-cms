// Analytics Dashboard Type Definitions
export interface TimeRange {
  value: '1d' | '7d' | '30d' | '90d' | '1y';
  label: string;
  days: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessionDuration: number;
  bounceRate: number;
  engagementRate: number;
  previousPeriod: {
    totalUsers: number;
    activeUsers: number;
    sessionDuration: number;
    bounceRate: number;
  };
  acquisitionChannels: AcquisitionChannel[];
  trends: MetricTrend[];
}

export interface AcquisitionChannel {
  channel: string;
  users: number;
  percentage: number;
  change: number;
}

export interface MetricTrend {
  date: string;
  activeUsers: number;
  sessions: number;
  engagementRate: number;
}

export interface ContentMetrics {
  id: string;
  title: string;
  views: number;
  uniqueViews: number;
  engagementTime: number;
  shares: number;
  comments: number;
  likes: number;
  conversionRate: number;
  publishedAt: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  trends: ContentTrend[];
}

export interface ContentTrend {
  date: string;
  views: number;
  engagementTime: number;
  shares: number;
}

export interface RealTimeData {
  activeVisitors: number;
  currentPageViews: PageView[];
  recentEvents: EngagementEvent[];
  geographicData: GeographicData[];
  topPages: TopPage[];
  timestamp: string;
}

export interface PageView {
  path: string;
  title: string;
  activeUsers: number;
  averageTimeOnPage: number;
}

export interface EngagementEvent {
  id: string;
  type: 'view' | 'click' | 'share' | 'comment' | 'like';
  userId?: string;
  contentId?: string;
  contentTitle?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface GeographicData {
  country: string;
  countryCode: string;
  users: number;
  percentage: number;
}

export interface TopPage {
  path: string;
  title: string;
  views: number;
  uniqueViews: number;
}

export interface ExportParams {
  format: 'csv' | 'pdf' | 'excel';
  metrics: string[];
  dateRange: DateRange;
  siteId: string;
}

export interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

export interface AnalyticsFilters {
  siteId: string;
  timeRange: TimeRange;
  contentType?: 'article' | 'newsletter' | 'all';
  categoryId?: string;
  authorId?: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'realtime';
  size: 'small' | 'medium' | 'large';
  refreshInterval?: number;
  isVisible: boolean;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  defaultTimeRange: TimeRange;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface WebSocketMessage {
  type: 'visitor_update' | 'engagement_update' | 'content_update';
  payload: any;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Component Props Interfaces
export interface AnalyticsDashboardProps {
  siteId: string;
  initialTimeRange?: TimeRange;
  config?: DashboardConfig;
}

export interface UserMetricsWidgetProps {
  siteId: string;
  timeRange: TimeRange;
  refreshInterval?: number;
  onDataUpdate?: (metrics: UserMetrics) => void;
}

export interface ContentPerformanceWidgetProps {
  siteId: string;
  timeRange: TimeRange;
  contentType?: 'article' | 'all';
  limit?: number;
  onContentClick?: (contentId: string) => void;
}

export interface RealTimeVisitorWidgetProps {
  siteId: string;
  autoRefresh: boolean;
  maxEvents?: number;
  onEventClick?: (event: EngagementEvent) => void;
}

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  availableMetrics: MetricOption[];
  dateRange: DateRange;
  onExportSuccess?: (response: ExportResponse) => void;
}

export interface MetricOption {
  id: string;
  label: string;
  description: string;
  category: 'user' | 'content' | 'engagement' | 'technical';
  isDefault: boolean;
}

export interface DateRangePickerProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  disabled?: boolean;
  customRangeEnabled?: boolean;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
}

// Utility Types
export type MetricType = 'users' | 'content' | 'engagement' | 'technical';
export type TrendDirection = 'up' | 'down' | 'neutral';
export type ChartType = 'line' | 'bar' | 'doughnut' | 'area';
export type ExportFormat = 'csv' | 'pdf' | 'excel';
export type RefreshInterval = 0 | 30 | 60 | 300; // 0 = disabled, seconds

// Constants
export const TIME_RANGES: TimeRange[] = [
  { value: '1d', label: 'Last 24 Hours', days: 1 },
  { value: '7d', label: 'Last 7 Days', days: 7 },
  { value: '30d', label: 'Last 30 Days', days: 30 },
  { value: '90d', label: 'Last 90 Days', days: 90 },
  { value: '1y', label: 'Last Year', days: 365 },
];

export const DEFAULT_METRICS: MetricOption[] = [
  { id: 'active_users', label: 'Active Users', description: 'Number of active users', category: 'user', isDefault: true },
  { id: 'page_views', label: 'Page Views', description: 'Total page views', category: 'content', isDefault: true },
  { id: 'session_duration', label: 'Session Duration', description: 'Average session duration', category: 'engagement', isDefault: true },
  { id: 'bounce_rate', label: 'Bounce Rate', description: 'Percentage of single-page sessions', category: 'engagement', isDefault: false },
  { id: 'conversion_rate', label: 'Conversion Rate', description: 'Goal conversion percentage', category: 'engagement', isDefault: false },
];

export const REFRESH_INTERVALS: { value: RefreshInterval; label: string }[] = [
  { value: 0, label: 'Disabled' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
]; 