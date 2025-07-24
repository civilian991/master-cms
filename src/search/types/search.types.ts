// ============================================================================
// ADVANCED SEARCH & DISCOVERY TYPE DEFINITIONS
// ============================================================================

// Core Search Types
export type SearchProvider = 'elasticsearch' | 'algolia' | 'typesense' | 'meilisearch' | 'custom';
export type SearchMode = 'instant' | 'standard' | 'advanced' | 'semantic' | 'fuzzy';
export type SearchScope = 'all' | 'articles' | 'pages' | 'media' | 'users' | 'products' | 'categories';
export type SearchResultType = 'exact' | 'partial' | 'semantic' | 'suggested' | 'trending';
export type SortOrder = 'relevance' | 'date' | 'title' | 'popularity' | 'rating' | 'price' | 'custom';
export type FilterType = 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean' | 'checkbox' | 'radio' | 'slider';
export type FacetDisplayType = 'list' | 'tree' | 'cloud' | 'histogram' | 'range' | 'calendar';
export type RecommendationType = 'collaborative' | 'content_based' | 'hybrid' | 'trending' | 'personalized' | 'similar';
export type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial' | 'unknown';
export type VoiceSearchLanguage = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'ja-JP' | 'ko-KR' | 'zh-CN';
export type ImageSearchMode = 'similarity' | 'object_detection' | 'text_recognition' | 'color_analysis' | 'scene_detection';

// Analytics & Insights Types
export type SearchEventType = 'query' | 'result_click' | 'filter_apply' | 'suggestion_click' | 'no_results' | 'exit' | 'conversion';
export type SearchMetricType = 'queries' | 'clicks' | 'conversions' | 'bounce_rate' | 'session_duration' | 'result_relevance';
export type TrendingPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export type UserSegment = 'new' | 'returning' | 'premium' | 'admin' | 'guest' | 'mobile' | 'desktop';

// ============================================================================
// CORE SEARCH INTERFACES
// ============================================================================

export interface SearchQuery {
  query: string;
  scope?: SearchScope[];
  mode?: SearchMode;
  filters?: SearchFilter[];
  facets?: string[];
  sort?: SortCriteria[];
  pagination?: SearchPagination;
  highlight?: SearchHighlight;
  suggestions?: boolean;
  analytics?: boolean;
  personalization?: boolean;
  intent?: SearchIntent;
  context?: SearchContext;
}

export interface SearchFilter {
  field: string;
  type: FilterType;
  value: any;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startswith' | 'endswith' | 'range' | 'exists';
  boost?: number;
  required?: boolean;
  exclude?: boolean;
}

export interface SortCriteria {
  field: string;
  order: 'asc' | 'desc';
  mode?: 'min' | 'max' | 'avg' | 'sum';
  boost?: number;
}

export interface SearchPagination {
  page: number;
  size: number;
  offset?: number;
  total?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface SearchHighlight {
  enabled: boolean;
  fields?: string[];
  preTag?: string;
  postTag?: string;
  fragmentSize?: number;
  maxFragments?: number;
}

export interface SearchContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  location?: GeolocationData;
  referrer?: string;
  device?: DeviceInfo;
  preferences?: UserPreferences;
  history?: SearchHistory[];
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  results: number;
  clicked?: boolean;
  converted?: boolean;
}

export interface UserPreferences {
  language: string;
  region: string;
  categories: string[];
  excludeCategories: string[];
  priceRange?: PriceRange;
  contentTypes: string[];
  sortPreference: SortOrder;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenSize: { width: number; height: number };
  userAgent: string;
}

// ============================================================================
// SEARCH RESPONSE INTERFACES
// ============================================================================

export interface SearchResponse {
  query: SearchQuery;
  results: SearchResult[];
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
  recommendations: SearchRecommendation[];
  metadata: SearchMetadata;
  analytics: SearchAnalytics;
  timing: SearchTiming;
  debug?: SearchDebugInfo;
}

export interface SearchResult {
  id: string;
  type: SearchScope;
  title: string;
  description: string;
  content?: string;
  url: string;
  image?: string;
  author?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  categories?: string[];
  score: number;
  relevance: number;
  highlights?: Record<string, string[]>;
  metadata?: Record<string, any>;
  thumbnail?: string;
  preview?: string;
  actions?: SearchAction[];
}

export interface SearchAction {
  type: 'view' | 'edit' | 'delete' | 'share' | 'bookmark' | 'download' | 'purchase';
  label: string;
  url?: string;
  icon?: string;
  primary?: boolean;
}

export interface SearchFacet {
  field: string;
  label: string;
  type: FacetDisplayType;
  values: FacetValue[];
  multiSelect: boolean;
  searchable: boolean;
  collapsed: boolean;
  order: number;
}

export interface FacetValue {
  value: any;
  label: string;
  count: number;
  selected: boolean;
  children?: FacetValue[];
  range?: { min: number; max: number };
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'product' | 'brand' | 'tag';
  score: number;
  highlighted: string;
  metadata?: Record<string, any>;
}

export interface SearchRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  items: SearchResult[];
  algorithm: string;
  confidence: number;
  explanation?: string;
}

export interface SearchMetadata {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  resultsPerPage: number;
  queryTime: number;
  searchTime: number;
  hasResults: boolean;
  isEmpty: boolean;
  isFiltered: boolean;
  appliedFilters: SearchFilter[];
  availableFilters: FilterDefinition[];
}

export interface FilterDefinition {
  field: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  range?: { min: number; max: number };
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
}

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface SearchAnalytics {
  queryId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  query: string;
  resultsCount: number;
  clickedResults: string[];
  filters: SearchFilter[];
  intent: SearchIntent;
  userSegment: UserSegment;
}

export interface SearchTiming {
  query: number;
  processing: number;
  indexing: number;
  filtering: number;
  faceting: number;
  sorting: number;
  highlighting: number;
  total: number;
}

export interface SearchDebugInfo {
  parsedQuery: any;
  executionPlan: any;
  indexStats: any;
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// VOICE & VISUAL SEARCH INTERFACES
// ============================================================================

export interface VoiceSearchConfig {
  enabled: boolean;
  language: VoiceSearchLanguage;
  alternatives: VoiceSearchLanguage[];
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidence: number;
  noiseReduction: boolean;
  voiceCommands: VoiceCommand[];
}

export interface VoiceCommand {
  command: string;
  action: string;
  parameters?: Record<string, any>;
  confirmation?: boolean;
}

export interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  alternatives: VoiceAlternative[];
  finalResult: boolean;
  intent?: SearchIntent;
  commands?: VoiceCommand[];
}

export interface VoiceAlternative {
  transcript: string;
  confidence: number;
}

export interface VisualSearchConfig {
  enabled: boolean;
  modes: ImageSearchMode[];
  maxFileSize: number;
  supportedFormats: string[];
  featureExtraction: FeatureExtractionConfig;
  objectDetection: ObjectDetectionConfig;
  textRecognition: TextRecognitionConfig;
}

export interface FeatureExtractionConfig {
  colorHistogram: boolean;
  textureAnalysis: boolean;
  shapeDetection: boolean;
  sceneClassification: boolean;
  faceDetection: boolean;
}

export interface ObjectDetectionConfig {
  enabled: boolean;
  confidence: number;
  categories: string[];
  boundingBoxes: boolean;
}

export interface TextRecognitionConfig {
  enabled: boolean;
  languages: string[];
  confidence: number;
  regions: boolean;
}

export interface VisualSearchResult {
  features: ExtractedFeatures;
  objects: DetectedObject[];
  text: RecognizedText[];
  similarImages: SimilarImage[];
  suggestions: string[];
  confidence: number;
}

export interface ExtractedFeatures {
  colors: ColorFeature[];
  textures: TextureFeature[];
  shapes: ShapeFeature[];
  scene: SceneClassification;
}

export interface ColorFeature {
  color: string;
  percentage: number;
  dominance: number;
}

export interface TextureFeature {
  type: string;
  intensity: number;
  direction: number;
}

export interface ShapeFeature {
  type: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface SceneClassification {
  category: string;
  confidence: number;
  subcategories: string[];
}

export interface DetectedObject {
  category: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes: Record<string, any>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognizedText {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language?: string;
}

export interface SimilarImage {
  id: string;
  url: string;
  similarity: number;
  title?: string;
  source?: string;
}

// ============================================================================
// RECOMMENDATION ENGINE INTERFACES
// ============================================================================

export interface RecommendationEngine {
  algorithms: RecommendationAlgorithm[];
  userProfile: UserProfile;
  itemCatalog: ItemCatalog;
  interactions: UserInteraction[];
  config: RecommendationConfig;
}

export interface RecommendationAlgorithm {
  name: string;
  type: RecommendationType;
  weight: number;
  enabled: boolean;
  config: Record<string, any>;
  performance: AlgorithmPerformance;
}

export interface AlgorithmPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  diversity: number;
  coverage: number;
  novelty: number;
  serendipity: number;
}

export interface UserProfile {
  userId: string;
  demographics: UserDemographics;
  preferences: UserPreferences;
  behavior: BehaviorProfile;
  segments: string[];
  features: UserFeatures;
  lastUpdated: Date;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: GeolocationData;
  language: string;
  timezone: string;
}

export interface BehaviorProfile {
  searchPatterns: SearchPattern[];
  clickBehavior: ClickBehavior;
  sessionData: SessionData;
  engagementMetrics: EngagementMetrics;
  timeSpent: TimeSpentData;
}

export interface SearchPattern {
  query: string;
  frequency: number;
  categories: string[];
  timeOfDay: number[];
  dayOfWeek: number[];
  seasonality: string[];
}

export interface ClickBehavior {
  avgPosition: number;
  clickThroughRate: number;
  bounceRate: number;
  dwellTime: number;
  scrollDepth: number;
}

export interface SessionData {
  avgSessionDuration: number;
  pagesPerSession: number;
  returnVisitor: boolean;
  devicePreference: string;
  entryPoints: string[];
}

export interface EngagementMetrics {
  likesGiven: number;
  sharesGiven: number;
  commentsGiven: number;
  bookmarksCreated: number;
  downloadsInitiated: number;
}

export interface TimeSpentData {
  totalTime: number;
  avgTimePerPage: number;
  peakHours: number[];
  weeklyPattern: number[];
}

export interface UserFeatures {
  topCategories: string[];
  topTags: string[];
  topAuthors: string[];
  contentTypes: string[];
  priceRanges: PriceRange[];
  qualityPreference: number;
  noveltyPreference: number;
}

export interface ItemCatalog {
  items: CatalogItem[];
  categories: CategoryHierarchy;
  tags: TagCloud;
  features: ItemFeatures;
  relationships: ItemRelationship[];
}

export interface CatalogItem {
  id: string;
  type: string;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  features: Record<string, any>;
  popularity: PopularityMetrics;
  quality: QualityMetrics;
  freshness: FreshnessMetrics;
  embedding?: number[];
}

export interface CategoryHierarchy {
  categories: Category[];
  relationships: CategoryRelationship[];
}

export interface Category {
  id: string;
  name: string;
  parent?: string;
  children: string[];
  level: number;
  itemCount: number;
}

export interface CategoryRelationship {
  parent: string;
  child: string;
  strength: number;
}

export interface TagCloud {
  tags: Tag[];
  relationships: TagRelationship[];
}

export interface Tag {
  name: string;
  frequency: number;
  weight: number;
  categories: string[];
  trending: boolean;
}

export interface TagRelationship {
  tag1: string;
  tag2: string;
  cooccurrence: number;
  similarity: number;
}

export interface ItemFeatures {
  textual: TextualFeatures;
  visual: VisualFeatures;
  behavioral: BehavioralFeatures;
  contextual: ContextualFeatures;
}

export interface TextualFeatures {
  keywords: string[];
  topics: string[];
  sentiment: number;
  readability: number;
  language: string;
  wordCount: number;
}

export interface VisualFeatures {
  hasImages: boolean;
  hasVideo: boolean;
  imageCount: number;
  videoCount: number;
  visualQuality: number;
  colorScheme: string[];
}

export interface BehavioralFeatures {
  viewCount: number;
  clickCount: number;
  shareCount: number;
  commentCount: number;
  averageRating: number;
  conversionRate: number;
}

export interface ContextualFeatures {
  seasonality: string[];
  timeRelevance: string[];
  locationRelevance: string[];
  deviceOptimization: string[];
  audienceTargeting: string[];
}

export interface ItemRelationship {
  item1: string;
  item2: string;
  type: 'similar' | 'complementary' | 'alternative' | 'upgraded' | 'bundled';
  strength: number;
  confidence: number;
}

export interface PopularityMetrics {
  viewCount: number;
  uniqueViews: number;
  shareCount: number;
  clickCount: number;
  rank: number;
  trending: boolean;
  viral: boolean;
}

export interface QualityMetrics {
  userRating: number;
  expertRating: number;
  contentQuality: number;
  authorReputation: number;
  factualAccuracy: number;
  completeness: number;
}

export interface FreshnessMetrics {
  publishedAt: Date;
  lastUpdated: Date;
  relevanceDecay: number;
  seasonalRelevance: number;
  trendingScore: number;
}

export interface UserInteraction {
  userId: string;
  itemId: string;
  type: InteractionType;
  value: number;
  context: InteractionContext;
  timestamp: Date;
  implicit: boolean;
}

export type InteractionType = 'view' | 'click' | 'like' | 'share' | 'comment' | 'bookmark' | 'purchase' | 'download' | 'rating' | 'search';

export interface InteractionContext {
  sessionId: string;
  query?: string;
  position?: number;
  device: string;
  location?: GeolocationData;
  referrer?: string;
  duration?: number;
}

export interface RecommendationConfig {
  enableCollaborativeFiltering: boolean;
  enableContentBasedFiltering: boolean;
  enableHybridApproach: boolean;
  enableRealTimeUpdates: boolean;
  minInteractions: number;
  maxRecommendations: number;
  diversityFactor: number;
  noveltyFactor: number;
  popularityBoost: number;
  recencyBoost: number;
  personalizedWeight: number;
  coldStartStrategy: 'popular' | 'random' | 'demographic' | 'onboarding';
}

// ============================================================================
// SEARCH ANALYTICS INTERFACES
// ============================================================================

export interface SearchAnalyticsConfig {
  enableTracking: boolean;
  enableRealTime: boolean;
  samplingRate: number;
  retentionPeriod: number;
  privacyMode: boolean;
  anonymizeData: boolean;
  trackingEvents: SearchEventType[];
  metrics: SearchMetricType[];
  dashboards: AnalyticsDashboard[];
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  widgets: AnalyticsWidget[];
  filters: AnalyticsFilter[];
  timeRange: TimeRange;
  autoRefresh: boolean;
  shared: boolean;
}

export interface AnalyticsWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'heatmap' | 'funnel' | 'cohort';
  title: string;
  metric: SearchMetricType;
  visualization: VisualizationConfig;
  filters: AnalyticsFilter[];
  timeRange?: TimeRange;
}

export interface VisualizationConfig {
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  dimensions: string[];
  measures: string[];
  colors: string[];
  showLegend: boolean;
  showTooltip: boolean;
}

export interface AnalyticsFilter {
  field: string;
  operator: string;
  value: any;
  label: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  period: TrendingPeriod;
  timezone: string;
}

export interface SearchAnalyticsData {
  overview: SearchOverviewMetrics;
  queries: QueryAnalytics[];
  results: ResultAnalytics[];
  users: UserAnalytics[];
  performance: PerformanceAnalytics;
  trends: TrendAnalytics[];
  funnels: FunnelAnalytics[];
  cohorts: CohortAnalytics[];
}

export interface SearchOverviewMetrics {
  totalQueries: number;
  uniqueQueries: number;
  totalUsers: number;
  uniqueUsers: number;
  avgResultsPerQuery: number;
  noResultsRate: number;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  avgSessionDuration: number;
}

export interface QueryAnalytics {
  query: string;
  count: number;
  uniqueUsers: number;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  avgPosition: number;
  noResults: boolean;
  intent: SearchIntent;
  sentiment: number;
  trending: boolean;
}

export interface ResultAnalytics {
  resultId: string;
  title: string;
  url: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  avgPosition: number;
  conversionRate: number;
  bounceRate: number;
  avgDwellTime: number;
}

export interface UserAnalytics {
  segment: UserSegment;
  count: number;
  avgQueriesPerSession: number;
  avgSessionDuration: number;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  topQueries: string[];
  topCategories: string[];
}

export interface PerformanceAnalytics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  availability: number;
  throughput: number;
  cacheHitRate: number;
  indexSize: number;
  memoryUsage: number;
}

export interface TrendAnalytics {
  period: TrendingPeriod;
  metric: SearchMetricType;
  data: TrendDataPoint[];
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  seasonality: SeasonalityData;
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  label: string;
}

export interface SeasonalityData {
  hourly: number[];
  daily: number[];
  weekly: number[];
  monthly: number[];
  yearly: number[];
}

export interface FunnelAnalytics {
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  dropoffPoints: DropoffPoint[];
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  avgTimeToNext: number;
}

export interface DropoffPoint {
  step: string;
  dropoffRate: number;
  reasons: string[];
}

export interface CohortAnalytics {
  cohortType: 'acquisition' | 'behavior' | 'revenue';
  period: TrendingPeriod;
  cohorts: Cohort[];
  retention: RetentionData;
}

export interface Cohort {
  period: string;
  size: number;
  retention: number[];
  value: number[];
}

export interface RetentionData {
  periods: string[];
  rates: number[][];
  avgRetention: number;
  churnRate: number;
}

// ============================================================================
// AUTO-COMPLETE & SUGGESTIONS INTERFACES
// ============================================================================

export interface AutoCompleteConfig {
  enabled: boolean;
  minQueryLength: number;
  maxSuggestions: number;
  debounceTime: number;
  highlightMatch: boolean;
  fuzzyMatching: boolean;
  typoTolerance: number;
  languages: string[];
  sources: SuggestionSource[];
  personalization: boolean;
  trending: boolean;
  caching: CachingConfig;
}

export interface SuggestionSource {
  name: string;
  type: 'query' | 'content' | 'category' | 'tag' | 'user' | 'product';
  weight: number;
  enabled: boolean;
  config: Record<string, any>;
}

export interface CachingConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'ttl';
}

export interface AutoCompleteRequest {
  query: string;
  limit?: number;
  language?: string;
  context?: SearchContext;
  filters?: SearchFilter[];
  includePopular?: boolean;
  includeTrending?: boolean;
  includePersonalized?: boolean;
}

export interface AutoCompleteResponse {
  query: string;
  suggestions: Suggestion[];
  trending: TrendingSuggestion[];
  popular: PopularSuggestion[];
  personalized: PersonalizedSuggestion[];
  metadata: SuggestionMetadata;
}

export interface Suggestion {
  text: string;
  highlighted: string;
  type: string;
  category?: string;
  count?: number;
  score: number;
  metadata?: Record<string, any>;
}

export interface TrendingSuggestion extends Suggestion {
  trend: 'up' | 'down' | 'new';
  trendScore: number;
  period: TrendingPeriod;
}

export interface PopularSuggestion extends Suggestion {
  popularity: number;
  frequency: number;
  globalRank: number;
}

export interface PersonalizedSuggestion extends Suggestion {
  relevance: number;
  userHistory: boolean;
  similarUsers: boolean;
  reason: string;
}

export interface SuggestionMetadata {
  queryTime: number;
  cached: boolean;
  sources: string[];
  totalSuggestions: number;
  personalized: boolean;
}

// ============================================================================
// SEARCH HUB INTERFACES
// ============================================================================

export interface SearchHubConfig {
  layout: 'grid' | 'list' | 'masonry' | 'carousel';
  theme: 'light' | 'dark' | 'auto';
  features: SearchHubFeatures;
  appearance: SearchHubAppearance;
  behavior: SearchHubBehavior;
  integrations: SearchHubIntegrations;
}

export interface SearchHubFeatures {
  instantSearch: boolean;
  voiceSearch: boolean;
  visualSearch: boolean;
  filters: boolean;
  facets: boolean;
  sorting: boolean;
  recommendations: boolean;
  trending: boolean;
  history: boolean;
  bookmarks: boolean;
  sharing: boolean;
  analytics: boolean;
}

export interface SearchHubAppearance {
  colorScheme: Record<string, string>;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  animations: AnimationConfig;
  responsive: ResponsiveConfig;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: Record<string, number>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}

export interface SpacingConfig {
  unit: number;
  padding: Record<string, number>;
  margin: Record<string, number>;
  borderRadius: Record<string, number>;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: Record<string, number>;
  easing: Record<string, string>;
  transitions: string[];
}

export interface ResponsiveConfig {
  breakpoints: Record<string, number>;
  gridColumns: Record<string, number>;
  spacing: Record<string, SpacingConfig>;
}

export interface SearchHubBehavior {
  autoComplete: AutoCompleteConfig;
  searchAsYouType: boolean;
  rememberQueries: boolean;
  persistFilters: boolean;
  infiniteScroll: boolean;
  keyboardNavigation: boolean;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcut {
  key: string;
  action: string;
  description: string;
  enabled: boolean;
}

export interface SearchHubIntegrations {
  analytics: AnalyticsIntegration;
  recommendations: RecommendationIntegration;
  social: SocialIntegration;
  commerce: CommerceIntegration;
}

export interface AnalyticsIntegration {
  provider: string;
  trackingId: string;
  events: string[];
  customDimensions: Record<string, string>;
}

export interface RecommendationIntegration {
  provider: string;
  apiKey: string;
  algorithms: string[];
  realTime: boolean;
}

export interface SocialIntegration {
  platforms: string[];
  sharing: boolean;
  login: boolean;
  comments: boolean;
}

export interface CommerceIntegration {
  provider: string;
  currency: string;
  priceTracking: boolean;
  inventory: boolean;
  cart: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface SearchApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query: SearchQuery;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface SearchApiResponse {
  success: boolean;
  data: SearchResponse;
  error?: ApiError;
  metadata: ApiMetadata;
  cached: boolean;
  timing: ApiTiming;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface ApiMetadata {
  requestId: string;
  version: string;
  endpoint: string;
  rateLimit: RateLimit;
  quota: Quota;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  window: number;
}

export interface Quota {
  used: number;
  limit: number;
  period: string;
  reset: Date;
}

export interface ApiTiming {
  request: number;
  processing: number;
  response: number;
  total: number;
  breakdown: Record<string, number>;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface SearchHubProps {
  config?: Partial<SearchHubConfig>;
  initialQuery?: string;
  initialFilters?: SearchFilter[];
  onSearch?: (query: SearchQuery) => void;
  onResultClick?: (result: SearchResult) => void;
  onFilterChange?: (filters: SearchFilter[]) => void;
  onAnalytics?: (event: SearchAnalytics) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
  autoComplete?: boolean;
  voiceSearch?: boolean;
  visualSearch?: boolean;
  onSearch: (query: string) => void;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  onVoiceResult?: (result: VoiceSearchResult) => void;
  onImageUpload?: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  error?: string;
  layout?: 'grid' | 'list' | 'masonry';
  onResultClick?: (result: SearchResult) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export interface SearchFiltersProps {
  filters: FilterDefinition[];
  activeFilters: SearchFilter[];
  facets: SearchFacet[];
  onFilterChange: (filters: SearchFilter[]) => void;
  onClearFilters: () => void;
  collapsible?: boolean;
  className?: string;
}

export interface SearchRecommendationsProps {
  recommendations: SearchRecommendation[];
  onRecommendationClick?: (recommendation: SearchRecommendation) => void;
  onItemClick?: (item: SearchResult) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  showExplanation?: boolean;
  className?: string;
}

export interface VoiceSearchProps {
  config: VoiceSearchConfig;
  onResult: (result: VoiceSearchResult) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  visualFeedback?: boolean;
  className?: string;
}

export interface VisualSearchProps {
  config: VisualSearchConfig;
  onResult: (result: VisualSearchResult) => void;
  onError: (error: string) => void;
  onUpload?: (file: File) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
  preview?: boolean;
  className?: string;
}

export interface SearchAnalyticsProps {
  data: SearchAnalyticsData;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  dashboards: AnalyticsDashboard[];
  onDashboardChange: (dashboard: AnalyticsDashboard) => void;
  realTime?: boolean;
  className?: string;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseSearchOptions {
  provider?: SearchProvider;
  mode?: SearchMode;
  autoSearch?: boolean;
  debounceTime?: number;
  caching?: boolean;
  analytics?: boolean;
  personalization?: boolean;
}

export interface UseAutoCompleteOptions {
  minLength?: number;
  maxSuggestions?: number;
  debounceTime?: number;
  sources?: string[];
  caching?: boolean;
}

export interface UseVoiceSearchOptions {
  language?: VoiceSearchLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  confidence?: number;
}

export interface UseVisualSearchOptions {
  modes?: ImageSearchMode[];
  maxFileSize?: number;
  featureExtraction?: boolean;
  objectDetection?: boolean;
  textRecognition?: boolean;
}

export interface UseSearchAnalyticsOptions {
  realTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  metrics?: SearchMetricType[];
}

export interface UseRecommendationsOptions {
  algorithms?: RecommendationType[];
  realTime?: boolean;
  personalization?: boolean;
  diversity?: number;
  novelty?: number;
}

// ============================================================================
// CONSTANTS AND UTILITIES
// ============================================================================

export const SEARCH_PROVIDERS = {
  ELASTICSEARCH: 'elasticsearch',
  ALGOLIA: 'algolia',
  TYPESENSE: 'typesense',
  MEILISEARCH: 'meilisearch',
  CUSTOM: 'custom',
} as const;

export const SEARCH_MODES = {
  INSTANT: 'instant',
  STANDARD: 'standard',
  ADVANCED: 'advanced',
  SEMANTIC: 'semantic',
  FUZZY: 'fuzzy',
} as const;

export const SEARCH_SCOPES = {
  ALL: 'all',
  ARTICLES: 'articles',
  PAGES: 'pages',
  MEDIA: 'media',
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
} as const;

export const FILTER_TYPES = {
  TEXT: 'text',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  RANGE: 'range',
  DATE: 'date',
  BOOLEAN: 'boolean',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SLIDER: 'slider',
} as const;

export const RECOMMENDATION_TYPES = {
  COLLABORATIVE: 'collaborative',
  CONTENT_BASED: 'content_based',
  HYBRID: 'hybrid',
  TRENDING: 'trending',
  PERSONALIZED: 'personalized',
  SIMILAR: 'similar',
} as const;

export const VOICE_LANGUAGES = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  ES_ES: 'es-ES',
  FR_FR: 'fr-FR',
  DE_DE: 'de-DE',
  IT_IT: 'it-IT',
  PT_BR: 'pt-BR',
  JA_JP: 'ja-JP',
  KO_KR: 'ko-KR',
  ZH_CN: 'zh-CN',
} as const;

export const IMAGE_SEARCH_MODES = {
  SIMILARITY: 'similarity',
  OBJECT_DETECTION: 'object_detection',
  TEXT_RECOGNITION: 'text_recognition',
  COLOR_ANALYSIS: 'color_analysis',
  SCENE_DETECTION: 'scene_detection',
} as const;

export const SEARCH_INTENTS = {
  INFORMATIONAL: 'informational',
  NAVIGATIONAL: 'navigational',
  TRANSACTIONAL: 'transactional',
  COMMERCIAL: 'commercial',
  UNKNOWN: 'unknown',
} as const;

export const DEFAULT_SEARCH_CONFIG = {
  mode: SEARCH_MODES.INSTANT,
  scope: [SEARCH_SCOPES.ALL],
  pagination: { page: 1, size: 20 },
  highlight: { enabled: true },
  suggestions: true,
  analytics: true,
  personalization: true,
} as const;

export const DEFAULT_AUTOCOMPLETE_CONFIG = {
  enabled: true,
  minQueryLength: 2,
  maxSuggestions: 10,
  debounceTime: 300,
  highlightMatch: true,
  fuzzyMatching: true,
  typoTolerance: 2,
} as const;

export const DEFAULT_VOICE_CONFIG = {
  enabled: true,
  language: VOICE_LANGUAGES.EN_US,
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  confidence: 0.8,
  noiseReduction: true,
} as const;

export const DEFAULT_VISUAL_CONFIG = {
  enabled: true,
  modes: [IMAGE_SEARCH_MODES.SIMILARITY, IMAGE_SEARCH_MODES.OBJECT_DETECTION],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const SEARCH_PERFORMANCE_THRESHOLDS = {
  EXCELLENT: { responseTime: 50, accuracy: 0.95 },
  GOOD: { responseTime: 100, accuracy: 0.85 },
  ACCEPTABLE: { responseTime: 200, accuracy: 0.75 },
  POOR: { responseTime: 500, accuracy: 0.6 },
} as const;

export default {}; 