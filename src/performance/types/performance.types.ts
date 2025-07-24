// ============================================================================
// PERFORMANCE MONITORING & OPTIMIZATION TYPE DEFINITIONS
// ============================================================================

// Core Performance Types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary' | 'timer';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical' | 'fatal';
export type CacheStrategy = 'lru' | 'lfu' | 'ttl' | 'fifo' | 'lifo' | 'arc' | 'adaptive';
export type OptimizationLevel = 'none' | 'basic' | 'aggressive' | 'extreme';
export type MonitoringStatus = 'healthy' | 'warning' | 'degraded' | 'unhealthy' | 'critical';
export type ResourceType = 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'cache' | 'cdn';
export type PerformanceCategory = 'core_web_vitals' | 'runtime' | 'network' | 'rendering' | 'interaction' | 'custom';
export type BundleType = 'main' | 'chunk' | 'vendor' | 'runtime' | 'dynamic' | 'css' | 'asset';

// Monitoring & Alerting Types
export type MonitoringProvider = 'prometheus' | 'grafana' | 'datadog' | 'newrelic' | 'sentry' | 'custom';
export type AlertChannel = 'email' | 'slack' | 'webhook' | 'sms' | 'discord' | 'teams' | 'pagerduty';
export type ThresholdOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'regex';
export type AggregationMethod = 'avg' | 'sum' | 'min' | 'max' | 'count' | 'percentile' | 'rate';

// ============================================================================
// CORE PERFORMANCE INTERFACES
// ============================================================================

export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  category: PerformanceCategory;
  value: number;
  unit: string;
  timestamp: Date;
  labels: Record<string, string>;
  threshold?: MetricThreshold;
  metadata?: Record<string, any>;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  operator: ThresholdOperator;
  duration: number; // milliseconds
  description: string;
}

export interface PerformanceSnapshot {
  id: string;
  timestamp: Date;
  metrics: PerformanceMetric[];
  status: MonitoringStatus;
  score: number; // 0-100
  insights: PerformanceInsight[];
  recommendations: OptimizationRecommendation[];
  duration: number;
  environment: string;
}

export interface PerformanceInsight {
  id: string;
  type: 'improvement' | 'regression' | 'anomaly' | 'optimization';
  severity: AlertSeverity;
  title: string;
  description: string;
  impact: number; // 0-100
  category: PerformanceCategory;
  metrics: string[];
  suggestion?: string;
  documentation?: string;
}

export interface OptimizationRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: PerformanceCategory;
  title: string;
  description: string;
  estimatedImpact: number; // percentage improvement
  estimatedEffort: 'low' | 'medium' | 'high';
  implementation: RecommendationImplementation;
  metrics: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

export interface RecommendationImplementation {
  type: 'code' | 'configuration' | 'infrastructure' | 'process';
  steps: string[];
  codeExample?: string;
  configChanges?: Record<string, any>;
  dependencies?: string[];
  risks?: string[];
  rollbackPlan?: string;
}

// ============================================================================
// WEB VITALS & CORE METRICS
// ============================================================================

export interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Other Important Metrics
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  fmp: number; // First Meaningful Paint
  tbt: number; // Total Blocking Time
  si: number; // Speed Index
  
  // Custom Metrics
  hydrationTime: number;
  routeChangeTime: number;
  apiResponseTime: number;
  renderTime: number;
  interactionTime: number;
  
  // Navigation Timing
  navigationTiming: NavigationTimingMetrics;
  resourceTiming: ResourceTimingMetrics[];
  
  // Runtime Performance
  runtime: RuntimePerformanceMetrics;
}

export interface NavigationTimingMetrics {
  redirectTime: number;
  dnsTime: number;
  connectTime: number;
  requestTime: number;
  responseTime: number;
  processingTime: number;
  loadTime: number;
  domContentLoadedTime: number;
  domCompleteTime: number;
}

export interface ResourceTimingMetrics {
  name: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xmlhttprequest' | 'other';
  size: number;
  duration: number;
  startTime: number;
  endTime: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
  blocked: boolean;
  cached: boolean;
}

export interface RuntimePerformanceMetrics {
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  memoryUsage: MemoryUsageMetrics;
  cpuUsage: number;
  frameRate: number;
  taskDuration: number;
  longTasks: LongTaskMetrics[];
}

export interface MemoryUsageMetrics {
  used: number;
  total: number;
  limit: number;
  pressure: number; // 0-1
  gcCount: number;
  gcDuration: number;
}

export interface LongTaskMetrics {
  name: string;
  duration: number;
  startTime: number;
  attribution: TaskAttributionMetrics[];
}

export interface TaskAttributionMetrics {
  name: string;
  containerType: string;
  containerSrc: string;
  containerId: string;
  containerName: string;
}

// ============================================================================
// CACHING SYSTEM INTERFACES
// ============================================================================

export interface CacheConfiguration {
  name: string;
  strategy: CacheStrategy;
  maxSize: number;
  ttl: number; // milliseconds
  maxAge?: number;
  staleWhileRevalidate?: number;
  compression: boolean;
  serialization: 'json' | 'msgpack' | 'protobuf' | 'custom';
  keyPrefix?: string;
  tags?: string[];
  invalidationRules?: CacheInvalidationRule[];
}

export interface CacheInvalidationRule {
  trigger: 'time' | 'event' | 'dependency' | 'manual';
  condition: string;
  action: 'evict' | 'refresh' | 'warm' | 'tag_clear';
  priority: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  operations: CacheOperationMetrics;
  performance: CachePerformanceMetrics;
}

export interface CacheOperationMetrics {
  gets: number;
  sets: number;
  deletes: number;
  clears: number;
  errors: number;
  averageGetTime: number;
  averageSetTime: number;
}

export interface CachePerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitLatency: number;
  missLatency: number;
  throughput: number;
  errorRate: number;
}

export interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'cdn' | 'browser' | 'service_worker' | 'database';
  configuration: CacheConfiguration;
  metrics: CacheMetrics;
  status: MonitoringStatus;
  enabled: boolean;
}

export interface CacheSystem {
  layers: CacheLayer[];
  globalMetrics: CacheMetrics;
  warmupStrategies: CacheWarmupStrategy[];
  invalidationStrategies: CacheInvalidationStrategy[];
  monitoring: CacheMonitoringConfig;
}

export interface CacheWarmupStrategy {
  name: string;
  type: 'scheduled' | 'event_driven' | 'predictive' | 'manual';
  schedule?: string; // cron expression
  events?: string[];
  prediction?: PredictiveCachingConfig;
  priority: number;
  enabled: boolean;
}

export interface PredictiveCachingConfig {
  algorithm: 'ml_based' | 'pattern_based' | 'frequency_based' | 'time_based';
  lookahead: number; // minutes
  confidence: number; // 0-1
  factors: string[];
}

export interface CacheInvalidationStrategy {
  name: string;
  type: 'time_based' | 'event_based' | 'dependency_based' | 'manual';
  rules: CacheInvalidationRule[];
  cascading: boolean;
  priority: number;
}

export interface CacheMonitoringConfig {
  metricsCollection: boolean;
  alerting: boolean;
  thresholds: Record<string, MetricThreshold>;
  reporting: CacheReportingConfig;
}

export interface CacheReportingConfig {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  metrics: string[];
  destinations: string[];
}

// ============================================================================
// BUNDLE OPTIMIZATION INTERFACES
// ============================================================================

export interface BundleAnalysis {
  id: string;
  timestamp: Date;
  bundles: BundleMetrics[];
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkAnalysis[];
  dependencies: DependencyAnalysis[];
  recommendations: BundleOptimizationRecommendation[];
  comparison?: BundleComparison;
}

export interface BundleMetrics {
  name: string;
  type: BundleType;
  size: number;
  gzippedSize: number;
  modules: ModuleMetrics[];
  loadTime: number;
  parseTime: number;
  evaluationTime: number;
  cacheability: CacheabilityMetrics;
  coverage: CodeCoverageMetrics;
}

export interface ModuleMetrics {
  name: string;
  size: number;
  gzippedSize: number;
  path: string;
  imported: boolean;
  sideEffects: boolean;
  treeshakeable: boolean;
  dependencies: string[];
  usage: number; // 0-1
}

export interface ChunkAnalysis {
  id: string;
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
  isDynamic: boolean;
  parents: string[];
  children: string[];
  loadPriority: 'high' | 'medium' | 'low';
}

export interface DependencyAnalysis {
  name: string;
  version: string;
  size: number;
  usage: number; // 0-1
  treeshakeable: boolean;
  alternatives: AlternativeDependency[];
  security: SecurityMetrics;
  performance: DependencyPerformanceMetrics;
}

export interface AlternativeDependency {
  name: string;
  version: string;
  size: number;
  performance: number; // relative score
  maintenance: number; // activity score
  compatibility: number; // 0-1
}

export interface SecurityMetrics {
  vulnerabilities: SecurityVulnerability[];
  score: number; // 0-100
  lastAudit: Date;
  license: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  patched: boolean;
  patchVersion?: string;
}

export interface DependencyPerformanceMetrics {
  loadTime: number;
  parseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
}

export interface BundleOptimizationRecommendation {
  type: 'code_splitting' | 'tree_shaking' | 'compression' | 'caching' | 'lazy_loading' | 'dependency_optimization';
  impact: number; // estimated size reduction percentage
  effort: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
  before: number;
  after: number;
  savings: number;
}

export interface BundleComparison {
  previous: BundleAnalysis;
  current: BundleAnalysis;
  changes: BundleChange[];
  summary: BundleChangeSummary;
}

export interface BundleChange {
  type: 'added' | 'removed' | 'modified' | 'renamed';
  bundle: string;
  sizeDelta: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface BundleChangeSummary {
  totalSizeDelta: number;
  bundleCount: number;
  addedBundles: number;
  removedBundles: number;
  modifiedBundles: number;
  performanceImpact: number; // -100 to 100
}

export interface CacheabilityMetrics {
  static: boolean;
  fingerprinted: boolean;
  immutable: boolean;
  maxAge: number;
  etag: boolean;
  lastModified: boolean;
  score: number; // 0-100
}

export interface CodeCoverageMetrics {
  lines: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
  statements: CoverageData;
  overall: number; // 0-100
}

export interface CoverageData {
  total: number;
  covered: number;
  percentage: number;
  uncovered: string[];
}

// ============================================================================
// DATABASE PERFORMANCE INTERFACES
// ============================================================================

export interface DatabasePerformanceMetrics {
  connections: ConnectionPoolMetrics;
  queries: QueryPerformanceMetrics;
  transactions: TransactionMetrics;
  indexing: IndexPerformanceMetrics;
  caching: DatabaseCacheMetrics;
  replication: ReplicationMetrics;
  storage: StorageMetrics;
}

export interface ConnectionPoolMetrics {
  active: number;
  idle: number;
  waiting: number;
  total: number;
  maxConnections: number;
  averageAcquisitionTime: number;
  connectionErrors: number;
  timeouts: number;
  leaks: number;
}

export interface QueryPerformanceMetrics {
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: SlowQueryMetrics[];
  mostExecuted: QueryExecutionMetrics[];
  queryCache: QueryCacheMetrics;
  indexUsage: IndexUsageMetrics;
}

export interface SlowQueryMetrics {
  query: string;
  executionTime: number;
  frequency: number;
  lastExecuted: Date;
  tables: string[];
  indexes: string[];
  explanation: QueryExplanation;
}

export interface QueryExecutionMetrics {
  query: string;
  count: number;
  totalTime: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  errorRate: number;
}

export interface QueryCacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  size: number;
  evictions: number;
  invalidations: number;
}

export interface IndexUsageMetrics {
  used: IndexUsage[];
  unused: string[];
  recommendations: IndexRecommendation[];
  efficiency: number; // 0-100
}

export interface IndexUsage {
  name: string;
  table: string;
  usage: number;
  selectivity: number;
  cardinality: number;
  size: number;
  maintenance: IndexMaintenanceMetrics;
}

export interface IndexMaintenanceMetrics {
  updates: number;
  rebuilds: number;
  fragmentation: number; // 0-100
  lastMaintenance: Date;
}

export interface IndexRecommendation {
  type: 'create' | 'drop' | 'modify' | 'rebuild';
  table: string;
  columns: string[];
  reason: string;
  impact: number; // estimated performance improvement
  cost: number; // maintenance overhead
}

export interface QueryExplanation {
  plan: QueryPlanNode[];
  cost: number;
  rows: number;
  buffers: BufferUsage;
  timing: QueryTiming;
}

export interface QueryPlanNode {
  nodeType: string;
  operation: string;
  cost: number;
  rows: number;
  width: number;
  actualRows?: number;
  actualTime?: number;
  children?: QueryPlanNode[];
}

export interface BufferUsage {
  shared: number;
  hit: number;
  read: number;
  dirtied: number;
  written: number;
}

export interface QueryTiming {
  planning: number;
  execution: number;
  total: number;
}

export interface TransactionMetrics {
  active: number;
  committed: number;
  aborted: number;
  averageDuration: number;
  deadlocks: number;
  lockWaits: number;
  rollbacks: number;
}

export interface IndexPerformanceMetrics {
  totalIndexes: number;
  usedIndexes: number;
  unusedIndexes: number;
  totalSize: number;
  maintenance: number; // overhead percentage
  effectiveness: number; // 0-100
}

export interface DatabaseCacheMetrics {
  bufferPool: BufferPoolMetrics;
  queryCache: QueryCacheMetrics;
  resultCache: ResultCacheMetrics;
}

export interface BufferPoolMetrics {
  size: number;
  used: number;
  hitRatio: number;
  readRequests: number;
  writeRequests: number;
  flushes: number;
}

export interface ResultCacheMetrics {
  entries: number;
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
}

export interface ReplicationMetrics {
  lag: number; // milliseconds
  status: 'healthy' | 'lagging' | 'broken' | 'disconnected';
  lastSync: Date;
  syncErrors: number;
  throughput: number; // operations per second
}

export interface StorageMetrics {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  growth: StorageGrowthMetrics;
  io: StorageIOMetrics;
  fragmentation: number; // 0-100
}

export interface StorageGrowthMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  projected: StorageProjection;
}

export interface StorageProjection {
  nextMonth: number;
  nextQuarter: number;
  nextYear: number;
  confidence: number; // 0-1
}

export interface StorageIOMetrics {
  reads: number;
  writes: number;
  readLatency: number;
  writeLatency: number;
  throughput: number;
  iops: number;
}

// ============================================================================
// CDN & ASSET OPTIMIZATION INTERFACES
// ============================================================================

export interface CDNConfiguration {
  provider: 'cloudflare' | 'aws_cloudfront' | 'google_cloud_cdn' | 'azure_cdn' | 'fastly' | 'custom';
  zones: CDNZone[];
  caching: CDNCachingConfig;
  compression: CompressionConfig;
  security: CDNSecurityConfig;
  analytics: CDNAnalyticsConfig;
}

export interface CDNZone {
  id: string;
  name: string;
  domain: string;
  origin: string;
  status: 'active' | 'paused' | 'error';
  regions: string[];
  plan: string;
  metrics: CDNMetrics;
}

export interface CDNMetrics {
  requests: number;
  bandwidth: number;
  cacheRatio: number;
  responseTime: number;
  errors: number;
  threats: number;
  savings: CDNSavingsMetrics;
}

export interface CDNSavingsMetrics {
  bandwidth: number; // bytes saved
  requests: number; // requests cached
  cost: number; // money saved
  carbonFootprint: number; // CO2 saved
}

export interface CDNCachingConfig {
  rules: CachingRule[];
  ttl: TTLConfiguration;
  bypass: BypassRule[];
  purging: PurgeConfiguration;
}

export interface CachingRule {
  pattern: string;
  ttl: number;
  cacheLevel: 'bypass' | 'basic' | 'simplified' | 'aggressive';
  edgeTTL?: number;
  browserTTL?: number;
  conditions?: CachingCondition[];
}

export interface CachingCondition {
  type: 'header' | 'query' | 'cookie' | 'method' | 'device' | 'country';
  operator: 'equals' | 'contains' | 'matches' | 'not_equals';
  value: string;
}

export interface TTLConfiguration {
  default: number;
  html: number;
  css: number;
  js: number;
  images: number;
  fonts: number;
  api: number;
  static: number;
}

export interface BypassRule {
  pattern: string;
  reason: string;
  conditions?: CachingCondition[];
}

export interface PurgeConfiguration {
  automatic: boolean;
  webhooks: string[];
  tags: string[];
  patterns: string[];
}

export interface CompressionConfig {
  gzip: CompressionSettings;
  brotli: CompressionSettings;
  webp: ImageCompressionSettings;
  avif: ImageCompressionSettings;
}

export interface CompressionSettings {
  enabled: boolean;
  level: number; // 1-9
  minSize: number; // bytes
  types: string[]; // MIME types
  exclusions?: string[];
}

export interface ImageCompressionSettings extends CompressionSettings {
  quality: number; // 0-100
  progressive: boolean;
  autoWebP: boolean;
  responsive: boolean;
  lazy: boolean;
}

export interface CDNSecurityConfig {
  ssl: SSLConfiguration;
  waf: WAFConfiguration;
  ddos: DDoSProtectionConfig;
  hotlinking: HotlinkingProtection;
}

export interface SSLConfiguration {
  mode: 'off' | 'flexible' | 'full' | 'strict';
  certificate: string;
  hsts: HSTSConfiguration;
  redirect: boolean;
}

export interface HSTSConfiguration {
  enabled: boolean;
  maxAge: number;
  includeSubdomains: boolean;
  preload: boolean;
}

export interface WAFConfiguration {
  enabled: boolean;
  rules: WAFRule[];
  sensitivity: 'low' | 'medium' | 'high';
  mode: 'simulate' | 'block';
}

export interface WAFRule {
  id: string;
  description: string;
  enabled: boolean;
  action: 'block' | 'challenge' | 'log' | 'allow';
  conditions: WAFCondition[];
}

export interface WAFCondition {
  field: string;
  operator: string;
  value: string;
  caseSensitive: boolean;
}

export interface DDoSProtectionConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'essentially_off';
  challengePassage: number; // seconds
  unmitigated: boolean;
}

export interface HotlinkingProtection {
  enabled: boolean;
  allowedDomains: string[];
  redirectUrl?: string;
}

export interface CDNAnalyticsConfig {
  enabled: boolean;
  retention: number; // days
  sampling: number; // percentage
  metrics: string[];
  alerts: CDNAlert[];
}

export interface CDNAlert {
  metric: string;
  threshold: number;
  operator: ThresholdOperator;
  duration: number;
  channels: AlertChannel[];
}

// ============================================================================
// ERROR TRACKING & ALERTING INTERFACES
// ============================================================================

export interface ErrorTrackingConfig {
  provider: 'sentry' | 'bugsnag' | 'rollbar' | 'custom';
  dsn: string;
  environment: string;
  release: string;
  sampling: ErrorSamplingConfig;
  filtering: ErrorFilterConfig;
  alerting: ErrorAlertConfig;
  integration: ErrorIntegrationConfig;
}

export interface ErrorSamplingConfig {
  errorSampleRate: number; // 0-1
  transactionSampleRate: number; // 0-1
  profilesSampleRate: number; // 0-1
  sessionReplay: boolean;
  performanceMonitoring: boolean;
}

export interface ErrorFilterConfig {
  ignoreErrors: string[];
  ignoreUrls: string[];
  allowUrls: string[];
  beforeSend?: string; // function code
  beforeBreadcrumb?: string; // function code
}

export interface ErrorAlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: ErrorAlertRule[];
  escalation: AlertEscalation;
  throttling: AlertThrottling;
}

export interface ErrorAlertRule {
  id: string;
  name: string;
  condition: ErrorCondition;
  severity: AlertSeverity;
  channels: AlertChannel[];
  enabled: boolean;
}

export interface ErrorCondition {
  type: 'frequency' | 'new_issue' | 'regression' | 'user_impact' | 'custom';
  threshold: number;
  timeWindow: number; // minutes
  filter?: ErrorFilter;
}

export interface ErrorFilter {
  environment?: string[];
  release?: string[];
  user?: string[];
  tags?: Record<string, string>;
  message?: string;
}

export interface AlertEscalation {
  levels: EscalationLevel[];
  timeout: number; // minutes between escalations
  maxEscalations: number;
}

export interface EscalationLevel {
  level: number;
  channels: AlertChannel[];
  delay: number; // minutes
  condition?: string;
}

export interface AlertThrottling {
  enabled: boolean;
  cooldown: number; // minutes
  maxAlerts: number;
  timeWindow: number; // minutes
}

export interface ErrorIntegrationConfig {
  github: GitHubIntegration;
  jira: JiraIntegration;
  slack: SlackIntegration;
  webhook: WebhookIntegration;
}

export interface GitHubIntegration {
  enabled: boolean;
  repository: string;
  token: string;
  autoCreateIssues: boolean;
  labels: string[];
}

export interface JiraIntegration {
  enabled: boolean;
  server: string;
  project: string;
  credentials: JiraCredentials;
  issueType: string;
}

export interface JiraCredentials {
  type: 'basic' | 'oauth' | 'token';
  username?: string;
  password?: string;
  token?: string;
}

export interface SlackIntegration {
  enabled: boolean;
  webhook: string;
  channel: string;
  username: string;
  icon: string;
}

export interface WebhookIntegration {
  enabled: boolean;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication?: WebhookAuth;
}

export interface WebhookAuth {
  type: 'basic' | 'bearer' | 'api_key' | 'oauth';
  credentials: Record<string, string>;
}

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  level: AlertSeverity;
  message: string;
  exception: ExceptionDetails;
  user: UserContext;
  request: RequestContext;
  breadcrumbs: Breadcrumb[];
  tags: Record<string, string>;
  extra: Record<string, any>;
  fingerprint: string[];
  groupingHash: string;
}

export interface ExceptionDetails {
  type: string;
  value: string;
  stacktrace: StackFrame[];
  mechanism: ExceptionMechanism;
}

export interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno: number;
  absPath: string;
  contextLine: string;
  preContext: string[];
  postContext: string[];
  inApp: boolean;
}

export interface ExceptionMechanism {
  type: string;
  handled: boolean;
  source?: string;
  synthetic?: boolean;
}

export interface UserContext {
  id: string;
  username?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  segment?: string;
}

export interface RequestContext {
  url: string;
  method: string;
  queryString: string;
  data: any;
  headers: Record<string, string>;
  env: Record<string, string>;
}

export interface Breadcrumb {
  timestamp: Date;
  type: string;
  category: string;
  message: string;
  level: AlertSeverity;
  data?: Record<string, any>;
}

// ============================================================================
// MONITORING DASHBOARD INTERFACES
// ============================================================================

export interface DashboardConfiguration {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  timeRange: TimeRange;
  autoRefresh: AutoRefreshConfig;
  sharing: SharingConfig;
  permissions: DashboardPermissions;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  dataSource: DataSourceConfig;
  visualization: VisualizationConfig;
  interactions: WidgetInteraction[];
}

export type WidgetType = 
  | 'metric' | 'chart' | 'table' | 'heatmap' | 'gauge' | 'counter' 
  | 'status' | 'alert' | 'log' | 'trace' | 'custom';

export interface WidgetPosition {
  x: number;
  y: number;
  z: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfiguration {
  theme: 'light' | 'dark' | 'auto';
  colors: string[];
  thresholds: VisualizationThreshold[];
  formatting: FormatConfiguration;
  legend: LegendConfiguration;
  axes: AxesConfiguration;
}

export interface VisualizationThreshold {
  value: number;
  color: string;
  label: string;
  operator: ThresholdOperator;
}

export interface FormatConfiguration {
  unit: string;
  decimals: number;
  prefix?: string;
  suffix?: string;
  nullValue?: string;
}

export interface LegendConfiguration {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  alignment: 'left' | 'center' | 'right';
  maxHeight?: number;
}

export interface AxesConfiguration {
  x: AxisConfiguration;
  y: AxisConfiguration;
}

export interface AxisConfiguration {
  label: string;
  min?: number;
  max?: number;
  unit?: string;
  scale: 'linear' | 'logarithmic' | 'time';
  grid: boolean;
}

export interface DataSourceConfig {
  type: 'prometheus' | 'elasticsearch' | 'influxdb' | 'graphite' | 'custom';
  query: string;
  interval: string;
  maxDataPoints: number;
  caching: boolean;
  timeout: number;
}

export interface VisualizationConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge' | 'stat';
  options: VisualizationOptions;
  overrides: FieldOverride[];
}

export interface VisualizationOptions {
  stacking: 'normal' | 'percent' | 'none';
  interpolation: 'linear' | 'smooth' | 'stepBefore' | 'stepAfter';
  nullValue: 'null' | 'zero' | 'connected';
  fillOpacity: number;
  pointSize: number;
  lineWidth: number;
}

export interface FieldOverride {
  matcher: FieldMatcher;
  properties: FieldProperty[];
}

export interface FieldMatcher {
  id: string;
  options: any;
}

export interface FieldProperty {
  id: string;
  value: any;
}

export interface WidgetInteraction {
  type: 'click' | 'hover' | 'select' | 'zoom' | 'drill_down';
  action: InteractionAction;
}

export interface InteractionAction {
  type: 'navigate' | 'filter' | 'variable' | 'custom';
  target?: string;
  params?: Record<string, any>;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'absolute';
  gridSize: number;
  breakpoints: LayoutBreakpoint[];
  responsive: boolean;
}

export interface LayoutBreakpoint {
  name: string;
  width: number;
  cols: number;
  rowHeight: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'range' | 'boolean';
  options?: FilterOption[];
  defaultValue?: any;
  required: boolean;
  variable: string;
}

export interface FilterOption {
  label: string;
  value: any;
  selected: boolean;
}

export interface TimeRange {
  from: Date | string;
  to: Date | string;
  timezone: string;
  fiscalYearStartMonth?: number;
}

export interface AutoRefreshConfig {
  enabled: boolean;
  interval: number; // seconds
  onlyWhenVisible: boolean;
  pause: boolean;
}

export interface SharingConfig {
  public: boolean;
  organizations: string[];
  users: string[];
  teams: string[];
  expiration?: Date;
  password?: string;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
  share: string[];
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface PerformanceMonitoringRequest {
  metrics: string[];
  timeRange: TimeRange;
  filters?: Record<string, any>;
  aggregation?: AggregationMethod;
  groupBy?: string[];
  interval?: string;
}

export interface PerformanceMonitoringResponse {
  metrics: PerformanceMetric[];
  snapshot: PerformanceSnapshot;
  trends: TrendAnalysis[];
  alerts: ActiveAlert[];
  recommendations: OptimizationRecommendation[];
  metadata: ResponseMetadata;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  significance: number; // 0-1
  period: string;
  forecast: ForecastData;
}

export interface ForecastData {
  predictions: DataPoint[];
  confidence: number; // 0-1
  method: string;
  horizon: string;
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  confidence?: number;
}

export interface ActiveAlert {
  id: string;
  severity: AlertSeverity;
  status: 'firing' | 'pending' | 'resolved';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  startTime: Date;
  endTime?: Date;
  runbook?: string;
  silence?: AlertSilence;
}

export interface AlertSilence {
  id: string;
  reason: string;
  creator: string;
  startTime: Date;
  endTime: Date;
}

export interface ResponseMetadata {
  requestId: string;
  executionTime: number;
  cached: boolean;
  dataFreshness: Date;
  warnings?: string[];
}

export interface CacheOptimizationRequest {
  operation: 'analyze' | 'warm' | 'invalidate' | 'configure';
  layers?: string[];
  keys?: string[];
  patterns?: string[];
  configuration?: CacheConfiguration;
}

export interface CacheOptimizationResponse {
  operation: string;
  success: boolean;
  results: CacheOperationResult[];
  recommendations: CacheRecommendation[];
  metrics: CacheMetrics;
}

export interface CacheOperationResult {
  layer: string;
  operation: string;
  affected: number;
  errors: string[];
  duration: number;
}

export interface CacheRecommendation {
  type: 'configuration' | 'strategy' | 'invalidation' | 'warming';
  priority: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
  estimatedImpact: number;
}

export interface BundleOptimizationRequest {
  action: 'analyze' | 'optimize' | 'compare';
  target?: 'size' | 'performance' | 'loading' | 'all';
  baseline?: string; // commit hash or version
  configuration?: OptimizationConfiguration;
}

export interface OptimizationConfiguration {
  level: OptimizationLevel;
  targets: OptimizationTarget[];
  constraints: OptimizationConstraint[];
  experimental: boolean;
}

export interface OptimizationTarget {
  metric: 'size' | 'parse_time' | 'load_time' | 'coverage';
  target: number;
  priority: number;
}

export interface OptimizationConstraint {
  type: 'compatibility' | 'functionality' | 'performance' | 'security';
  requirement: string;
  strict: boolean;
}

export interface BundleOptimizationResponse {
  analysis: BundleAnalysis;
  optimizations: AppliedOptimization[];
  results: OptimizationResults;
  warnings: string[];
  errors: string[];
}

export interface AppliedOptimization {
  type: string;
  description: string;
  before: number;
  after: number;
  savings: number;
  impact: string;
}

export interface OptimizationResults {
  sizeSavings: number;
  performanceImprovement: number;
  loadTimeReduction: number;
  runtimeImprovement: number;
  cacheEfficiency: number;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface PerformanceDashboardProps {
  initialTimeRange?: TimeRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
  layout?: 'grid' | 'flex';
  theme?: 'light' | 'dark' | 'auto';
  widgets?: string[];
  filters?: DashboardFilter[];
  onMetricClick?: (metric: PerformanceMetric) => void;
  onAlertClick?: (alert: ActiveAlert) => void;
  onRecommendationClick?: (recommendation: OptimizationRecommendation) => void;
  className?: string;
}

export interface MetricVisualizationProps {
  metrics: PerformanceMetric[];
  type: WidgetType;
  configuration: WidgetConfiguration;
  timeRange: TimeRange;
  loading?: boolean;
  error?: string;
  onDataPointClick?: (dataPoint: DataPoint) => void;
  onThresholdViolation?: (metric: PerformanceMetric) => void;
  className?: string;
}

export interface CacheManagerProps {
  layers: CacheLayer[];
  metrics: CacheMetrics;
  onLayerToggle: (layerId: string, enabled: boolean) => void;
  onInvalidate: (layerId: string, patterns?: string[]) => void;
  onWarm: (layerId: string, keys?: string[]) => void;
  onConfigure: (layerId: string, config: CacheConfiguration) => void;
  showRecommendations?: boolean;
  showMetrics?: boolean;
  className?: string;
}

export interface BundleAnalyzerProps {
  analysis: BundleAnalysis;
  comparison?: BundleComparison;
  onBundleSelect: (bundle: BundleMetrics) => void;
  onModuleSelect: (module: ModuleMetrics) => void;
  onOptimize: (recommendations: BundleOptimizationRecommendation[]) => void;
  showRecommendations?: boolean;
  interactive?: boolean;
  className?: string;
}

export interface AlertManagerProps {
  alerts: ActiveAlert[];
  rules: ErrorAlertRule[];
  onAlertAcknowledge: (alertId: string) => void;
  onAlertSilence: (alertId: string, duration: number, reason: string) => void;
  onRuleToggle: (ruleId: string, enabled: boolean) => void;
  onRuleEdit: (rule: ErrorAlertRule) => void;
  showHistory?: boolean;
  groupBy?: string;
  className?: string;
}

export interface ErrorAnalyticsProps {
  events: ErrorEvent[];
  trends: TrendAnalysis[];
  groupBy: 'type' | 'user' | 'release' | 'custom';
  timeRange: TimeRange;
  onEventClick: (event: ErrorEvent) => void;
  onGroupClick: (group: string) => void;
  onFilterChange: (filters: ErrorFilter) => void;
  showDetails?: boolean;
  className?: string;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UsePerformanceMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  metrics?: string[];
  thresholds?: Record<string, MetricThreshold>;
  alertOnViolation?: boolean;
}

export interface UseCacheManagerOptions {
  autoOptimize?: boolean;
  monitoring?: boolean;
  warmingStrategy?: 'predictive' | 'scheduled' | 'manual';
  invalidationStrategy?: 'event_based' | 'time_based' | 'manual';
}

export interface UseBundleAnalyzerOptions {
  autoAnalyze?: boolean;
  trackChanges?: boolean;
  optimizationLevel?: OptimizationLevel;
  experimentalFeatures?: boolean;
}

export interface UseErrorTrackingOptions {
  sampling?: ErrorSamplingConfig;
  filtering?: ErrorFilterConfig;
  autoReporting?: boolean;
  contextEnrichment?: boolean;
}

export interface UseAlertManagerOptions {
  autoAcknowledge?: boolean;
  escalationEnabled?: boolean;
  groupingEnabled?: boolean;
  historicalData?: boolean;
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

export const PERFORMANCE_CATEGORIES = {
  CORE_WEB_VITALS: 'core_web_vitals',
  RUNTIME: 'runtime',
  NETWORK: 'network',
  RENDERING: 'rendering',
  INTERACTION: 'interaction',
  CUSTOM: 'custom',
} as const;

export const METRIC_TYPES = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
  SUMMARY: 'summary',
  TIMER: 'timer',
} as const;

export const CACHE_STRATEGIES = {
  LRU: 'lru',
  LFU: 'lfu',
  TTL: 'ttl',
  FIFO: 'fifo',
  LIFO: 'lifo',
  ARC: 'arc',
  ADAPTIVE: 'adaptive',
} as const;

export const ALERT_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  FATAL: 'fatal',
} as const;

export const OPTIMIZATION_LEVELS = {
  NONE: 'none',
  BASIC: 'basic',
  AGGRESSIVE: 'aggressive',
  EXTREME: 'extreme',
} as const;

export const MONITORING_STATUSES = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  CRITICAL: 'critical',
} as const;

export const PERFORMANCE_THRESHOLDS = {
  WEB_VITALS: {
    LCP: { good: 2500, needs_improvement: 4000 },
    FID: { good: 100, needs_improvement: 300 },
    CLS: { good: 0.1, needs_improvement: 0.25 },
    FCP: { good: 1800, needs_improvement: 3000 },
    TTFB: { good: 800, needs_improvement: 1800 },
  },
  RUNTIME: {
    MEMORY_USAGE: { warning: 50, critical: 80 }, // percentage
    CPU_USAGE: { warning: 70, critical: 90 }, // percentage
    FRAME_RATE: { warning: 45, critical: 30 }, // fps
    TASK_DURATION: { warning: 50, critical: 100 }, // ms
  },
  NETWORK: {
    RESPONSE_TIME: { good: 200, warning: 500, critical: 1000 }, // ms
    THROUGHPUT: { warning: 50, critical: 100 }, // requests/second
    ERROR_RATE: { warning: 1, critical: 5 }, // percentage
  },
  CACHE: {
    HIT_RATIO: { warning: 80, critical: 60 }, // percentage
    EVICTION_RATE: { warning: 10, critical: 20 }, // percentage
    MEMORY_USAGE: { warning: 80, critical: 95 }, // percentage
  },
} as const;

export const DEFAULT_REFRESH_INTERVALS = {
  REAL_TIME: 1000, // 1 second
  FAST: 5000, // 5 seconds
  NORMAL: 30000, // 30 seconds
  SLOW: 300000, // 5 minutes
  BATCH: 3600000, // 1 hour
} as const;

export const WIDGET_TYPES = {
  METRIC: 'metric',
  CHART: 'chart',
  TABLE: 'table',
  HEATMAP: 'heatmap',
  GAUGE: 'gauge',
  COUNTER: 'counter',
  STATUS: 'status',
  ALERT: 'alert',
  LOG: 'log',
  TRACE: 'trace',
  CUSTOM: 'custom',
} as const;

export const BUNDLE_TYPES = {
  MAIN: 'main',
  CHUNK: 'chunk',
  VENDOR: 'vendor',
  RUNTIME: 'runtime',
  DYNAMIC: 'dynamic',
  CSS: 'css',
  ASSET: 'asset',
} as const;

export const CDN_PROVIDERS = {
  CLOUDFLARE: 'cloudflare',
  AWS_CLOUDFRONT: 'aws_cloudfront',
  GOOGLE_CLOUD_CDN: 'google_cloud_cdn',
  AZURE_CDN: 'azure_cdn',
  FASTLY: 'fastly',
  CUSTOM: 'custom',
} as const;

export const ERROR_TRACKING_PROVIDERS = {
  SENTRY: 'sentry',
  BUGSNAG: 'bugsnag',
  ROLLBAR: 'rollbar',
  CUSTOM: 'custom',
} as const;

export default {}; 