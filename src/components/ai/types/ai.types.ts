// AI Content Generator Type Definitions
export interface ContentGenerationRequest {
  topic: string;
  contentType: ContentType;
  templateId?: string;
  targetAudience: string;
  tone: ContentTone;
  length: ContentLength;
  keywords?: string[];
  seoTargets?: SEOTargets;
  customInstructions?: string;
  language?: string;
}

export interface ContentGenerationResponse {
  id: string;
  content: GeneratedContent;
  metadata: ContentMetadata;
  seoAnalysis: SEOAnalysis;
  suggestions: ContentSuggestion[];
  processingTime: number;
  timestamp: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  categories: string[];
  featuredImage?: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    readabilityScore: number;
    sentimentScore: number;
  };
}

export interface ContentMetadata {
  generatedAt: string;
  model: string;
  version: string;
  confidence: number;
  sources?: string[];
  factChecked: boolean;
}

export interface SEOTargets {
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetLength: number;
  metaDescription?: string;
  focusKeywordDensity: number;
}

export interface SEOAnalysis {
  score: number;
  recommendations: SEORecommendation[];
  keywordDensity: KeywordAnalysis[];
  readability: ReadabilityAnalysis;
  metadata: MetadataAnalysis;
  structure: StructureAnalysis;
}

export interface SEORecommendation {
  type: 'keyword' | 'structure' | 'readability' | 'metadata' | 'content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
  impact: number;
}

export interface KeywordAnalysis {
  keyword: string;
  density: number;
  count: number;
  target: number;
  status: 'under' | 'optimal' | 'over';
}

export interface ReadabilityAnalysis {
  score: number;
  grade: string;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  passiveVoicePercentage: number;
  complexWordsPercentage: number;
}

export interface MetadataAnalysis {
  titleLength: number;
  descriptionLength: number;
  hasTitle: boolean;
  hasDescription: boolean;
  hasKeywords: boolean;
}

export interface StructureAnalysis {
  hasH1: boolean;
  headingStructure: HeadingStructure[];
  paragraphCount: number;
  averageParagraphLength: number;
  hasImages: boolean;
  hasInternalLinks: boolean;
  hasExternalLinks: boolean;
}

export interface HeadingStructure {
  level: number;
  text: string;
  position: number;
}

export interface ContentSuggestion {
  type: 'improvement' | 'addition' | 'removal' | 'restructure';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'seo' | 'readability' | 'engagement' | 'structure';
  action?: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  searchVolume: number;
  trend: number;
  difficulty: number;
  category: string;
  keywords: string[];
  relatedTopics: string[];
  contentGap: boolean;
  opportunityScore: number;
  lastUpdated: string;
}

export interface TrendAnalysis {
  topics: TrendingTopic[];
  categories: CategoryTrend[];
  keywords: KeywordTrend[];
  contentGaps: ContentGap[];
  seasonalTrends: SeasonalTrend[];
  timestamp: string;
}

export interface CategoryTrend {
  category: string;
  growth: number;
  volume: number;
  competition: number;
  topics: string[];
}

export interface KeywordTrend {
  keyword: string;
  volume: number;
  difficulty: number;
  trend: number;
  cpc: number;
  relatedKeywords: string[];
}

export interface ContentGap {
  topic: string;
  searchVolume: number;
  competition: number;
  ourCoverage: number;
  competitorCoverage: number;
  opportunity: number;
  suggestedContentTypes: ContentType[];
}

export interface SeasonalTrend {
  topic: string;
  season: string;
  peakMonths: string[];
  growthRate: number;
  historicalData: HistoricalDataPoint[];
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  contentType: ContentType;
  structure: TemplateSection[];
  variables: TemplateVariable[];
  seoSettings: SEOSettings;
  isDefault: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'text' | 'heading' | 'list' | 'image' | 'custom';
  content: string;
  placeholder: string;
  required: boolean;
  order: number;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  defaultValue?: any;
  required: boolean;
}

export interface SEOSettings {
  titleTemplate: string;
  descriptionTemplate: string;
  keywordDensityTarget: number;
  minWordCount: number;
  maxWordCount: number;
  headingStructure: string[];
}

export interface GenerationHistory {
  id: string;
  request: ContentGenerationRequest;
  response: ContentGenerationResponse;
  status: GenerationStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  contentId?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: ModelCapability[];
  maxTokens: number;
  costPerToken: number;
  responseTime: number;
  accuracy: number;
  isAvailable: boolean;
}

export interface ModelCapability {
  type: 'text_generation' | 'summarization' | 'translation' | 'analysis';
  quality: number;
  speed: number;
}

export interface ContentOptimization {
  original: string;
  optimized: string;
  changes: OptimizationChange[];
  improvements: {
    seoScore: number;
    readabilityScore: number;
    engagementScore: number;
  };
}

export interface OptimizationChange {
  type: 'addition' | 'removal' | 'modification';
  location: number;
  original: string;
  optimized: string;
  reason: string;
}

// Enums and Utility Types
export type ContentType = 
  | 'article' 
  | 'blog_post' 
  | 'newsletter' 
  | 'social_post' 
  | 'product_description' 
  | 'press_release' 
  | 'email' 
  | 'landing_page' 
  | 'case_study' 
  | 'whitepaper';

export type ContentTone = 
  | 'professional' 
  | 'casual' 
  | 'friendly' 
  | 'authoritative' 
  | 'conversational' 
  | 'persuasive' 
  | 'educational' 
  | 'entertaining';

export type ContentLength = 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'custom';

export type GenerationStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type OptimizationType = 
  | 'seo' 
  | 'readability' 
  | 'engagement' 
  | 'conversion' 
  | 'accessibility';

// Component Props Interfaces
export interface AIContentDashboardProps {
  siteId: string;
  initialView?: 'generator' | 'trends' | 'templates' | 'history';
}

export interface TrendingTopicsWidgetProps {
  siteId: string;
  limit?: number;
  categories?: string[];
  onTopicSelect?: (topic: TrendingTopic) => void;
}

export interface ContentGeneratorFormProps {
  onGenerate: (request: ContentGenerationRequest) => Promise<void>;
  isGenerating?: boolean;
  templates: ContentTemplate[];
  selectedTemplate?: ContentTemplate;
  onTemplateSelect?: (template: ContentTemplate) => void;
}

export interface ContentPreviewProps {
  content: GeneratedContent | null;
  seoAnalysis: SEOAnalysis | null;
  isLoading: boolean;
  onOptimize?: (type: OptimizationType) => void;
  onEdit?: (content: string) => void;
}

export interface TemplateLibraryProps {
  templates: ContentTemplate[];
  selectedTemplate?: ContentTemplate;
  onSelect: (template: ContentTemplate) => void;
  onCreateNew?: () => void;
  onEdit?: (template: ContentTemplate) => void;
  onDelete?: (templateId: string) => void;
}

export interface SEOOptimizerProps {
  content: string;
  analysis: SEOAnalysis | null;
  targets: SEOTargets;
  onOptimize: (optimizedContent: string) => void;
  isOptimizing?: boolean;
}

export interface GenerationHistoryProps {
  siteId: string;
  limit?: number;
  onRegenerate?: (request: ContentGenerationRequest) => void;
  onPublish?: (content: GeneratedContent) => void;
}

// API Response Types
export interface APIResponse<T> {
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
  progress?: number;
  stage?: string;
}

// Constants
export const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'article', label: 'Article', description: 'Long-form editorial content' },
  { value: 'blog_post', label: 'Blog Post', description: 'Casual, engaging blog content' },
  { value: 'newsletter', label: 'Newsletter', description: 'Email newsletter content' },
  { value: 'social_post', label: 'Social Media Post', description: 'Short social media content' },
  { value: 'product_description', label: 'Product Description', description: 'E-commerce product copy' },
  { value: 'press_release', label: 'Press Release', description: 'Official press announcement' },
  { value: 'email', label: 'Email', description: 'Marketing email content' },
  { value: 'landing_page', label: 'Landing Page', description: 'Conversion-focused page copy' },
  { value: 'case_study', label: 'Case Study', description: 'Success story documentation' },
  { value: 'whitepaper', label: 'Whitepaper', description: 'Technical research document' },
];

export const CONTENT_TONES: { value: ContentTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal business tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, informal tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and confident' },
  { value: 'conversational', label: 'Conversational', description: 'Like talking to a friend' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling and convincing' },
  { value: 'educational', label: 'Educational', description: 'Informative and teaching' },
  { value: 'entertaining', label: 'Entertaining', description: 'Fun and engaging' },
];

export const CONTENT_LENGTHS: { value: ContentLength; label: string; wordCount: number }[] = [
  { value: 'short', label: 'Short (300-600 words)', wordCount: 450 },
  { value: 'medium', label: 'Medium (600-1200 words)', wordCount: 900 },
  { value: 'long', label: 'Long (1200+ words)', wordCount: 1800 },
  { value: 'custom', label: 'Custom Length', wordCount: 0 },
];

export const DEFAULT_SEO_TARGETS: SEOTargets = {
  primaryKeyword: '',
  secondaryKeywords: [],
  targetLength: 1000,
  focusKeywordDensity: 0.02,
};

export const SEO_SCORE_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 0,
};

export const READABILITY_GRADES = [
  'Elementary School',
  'Middle School', 
  'High School',
  'College Level',
  'Graduate Level',
  'Post-Graduate',
];

// Utility Functions
export const getContentTypeIcon = (type: ContentType): string => {
  const icons: Record<ContentType, string> = {
    article: '📄',
    blog_post: '📝',
    newsletter: '📧',
    social_post: '📱',
    product_description: '🛍️',
    press_release: '📰',
    email: '💌',
    landing_page: '🎯',
    case_study: '📊',
    whitepaper: '📚',
  };
  return icons[type] || '📄';
};

export const getSEOScoreColor = (score: number): string => {
  if (score >= SEO_SCORE_THRESHOLDS.excellent) return 'text-green-600';
  if (score >= SEO_SCORE_THRESHOLDS.good) return 'text-blue-600';
  if (score >= SEO_SCORE_THRESHOLDS.fair) return 'text-yellow-600';
  return 'text-red-600';
};

export const formatReadingTime = (wordCount: number): string => {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}; 