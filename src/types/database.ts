// Database type definitions for the Master CMS Framework
// Generated from Prisma schema with enhanced multi-site, monetization, analytics, and AI models

export interface Site {
  id: string;
  name: string;
  domain: string;
  description?: string;
  locale: string;
  theme: string;
  branding: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  users?: User[];
  articles?: Article[];
  categories?: Category[];
  tags?: Tag[];
  media?: Media[];
  newsletters?: Newsletter[];
  settings?: SiteSetting[];
  configuration?: SiteConfiguration;
  siteBranding?: SiteBranding;
  permissions?: SitePermission[];
  subscriptions?: Subscription[];
  payments?: Payment[];
  advertisements?: Advertisement[];
  analytics?: Analytics[];
  revenueAnalytics?: RevenueAnalytics[];
  userAnalytics?: UserAnalytics[];
  contentAnalytics?: ContentAnalytics[];
  siteAnalytics?: SiteAnalytics[];
  aiConfiguration?: AIConfiguration;
  contentGenerations?: ContentGeneration[];
  automationWorkflows?: AutomationWorkflow[];
  contentOptimizations?: ContentOptimization[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  locale: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  articles?: Article[];
  media?: Media[];
  events?: SecurityEvent[];
  permissions?: SitePermission[];
  subscriptions?: Subscription[];
  payments?: Payment[];
  analytics?: UserAnalytics[];
}

export interface Article {
  id: string;
  slug: string;
  titleEn?: string;
  titleAr?: string;
  contentEn?: string;
  contentAr?: string;
  excerptEn?: string;
  excerptAr?: string;
  featuredImage?: string;
  status: ArticleStatus;
  workflowState: WorkflowState;
  published: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  version: number;
  parentVersionId?: string;
  templateId?: string;
  viewCount: number;
  engagementScore: number;
  readTime?: number;
  seoTitleEn?: string;
  seoTitleAr?: string;
  seoDescriptionEn?: string;
  seoDescriptionAr?: string;
  seoKeywordsEn?: string;
  seoKeywordsAr?: string;
  canonicalUrl?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  authorId: string;
  author?: User;
  categoryId?: string;
  category?: Category;
  tags?: ArticleTag[];
  media?: Media[];
  comments?: Comment[];
  contentAnalytics?: ContentAnalytics[];
  contentOptimizations?: ContentOptimization[];
  parentVersion?: Article;
  versions?: Article[];
  template?: ContentTemplate;
  reviewer?: User;
  approver?: User;
  contentSearchIndex?: ContentSearchIndex;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  parent?: Category;
  children?: Category[];
  articles?: Article[];
}

export interface Tag {
  id: string;
  slug: string;
  nameEn: string;
  nameAr?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  articles?: Article[];
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnailPath?: string;
  optimizedPath?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altTextEn?: string;
  altTextAr?: string;
  captionEn?: string;
  captionAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  userId?: string;
  user?: User;
  articles?: Article[];
}

export interface Newsletter {
  id: string;
  name: string;
  subjectEn: string;
  subjectAr?: string;
  contentEn: string;
  contentAr?: string;
  status: NewsletterStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  subscribers?: NewsletterSubscriber[];
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  locale: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  newsletters?: Newsletter[];
}

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  title?: string;
  description?: string;
  source?: string;
  metadata: any;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  deviceInfo?: any;
  success: boolean;
  detected: boolean;
  resolved: boolean;
  falsePositive: boolean;
  responseTime?: Date;
  responseUserId?: string;
  responseActions: any[];
  detectedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId?: string;
  site?: Site;
  userId?: string;
  user?: User;
  responseUser?: User;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

// Enhanced Multi-Site Configuration Models

export interface SiteConfiguration {
  id: string;
  seoTitleEn?: string;
  seoTitleAr?: string;
  seoDescriptionEn?: string;
  seoDescriptionAr?: string;
  seoKeywordsEn?: string;
  seoKeywordsAr?: string;
  navigationStructure?: any;
  contentTypes?: any;
  features?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface SiteBranding {
  id: string;
  logoUrl?: string;
  logoAltEn?: string;
  logoAltAr?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
  faviconUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface SitePermission {
  id: string;
  role: UserRole;
  permissions: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  userId: string;
  user?: User;
}

// Monetization Models

export interface Subscription {
  id: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  currency: Currency;
  amount: number;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  userId: string;
  user?: User;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  gateway: PaymentGateway;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  userId: string;
  user?: User;
  subscriptionId?: string;
  subscription?: Subscription;
}

export interface Advertisement {
  id: string;
  name: string;
  type: AdvertisementType;
  contentEn: string;
  contentAr?: string;
  imageUrl?: string;
  linkUrl?: string;
  status: AdvertisementStatus;
  startDate: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

// Analytics and Business Intelligence Models

export interface Analytics {
  id: string;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  date: Date;
  createdAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface RevenueAnalytics {
  id: string;
  revenue: number;
  currency: Currency;
  subscriptionRevenue: number;
  advertisingRevenue: number;
  otherRevenue: number;
  date: Date;
  createdAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface UserAnalytics {
  id: string;
  userId: string;
  pageViews: number;
  timeOnSite: number;
  articlesRead: number;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  user?: User;
}

export interface ContentAnalytics {
  id: string;
  views: number;
  uniqueViews: number;
  timeOnPage: number;
  bounceRate: number;
  socialShares: number;
  date: Date;
  createdAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  articleId: string;
  article?: Article;
}

export interface SiteAnalytics {
  id: string;
  totalRevenue: number;
  totalSubscribers: number;
  totalArticles: number;
  avgEngagement: number;
  conversionRate: number;
  date: Date;
  createdAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

// AI and Automation Models

export interface AIConfiguration {
  id: string;
  personality: string;
  tone: string;
  languageStyle: string;
  contentLength: string;
  seoOptimization: boolean;
  autoPublish: boolean;
  qualityThreshold: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface ContentGeneration {
  id: string;
  prompt: string;
  generatedContent: string;
  contentType: ContentType;
  quality: number;
  status: GenerationStatus;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow: any;
  status: WorkflowStatus;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface ContentOptimization {
  id: string;
  seoScore: number;
  readabilityScore: number;
  performanceScore: number;
  suggestions?: any;
  optimizedContent?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  articleId: string;
  article?: Article;
}

// Missing Core Models from Prisma Schema

export interface ArticleTag {
  id: string;
  articleId: string;
  tagId: string;
  createdAt: Date;
  
  // Relations
  article?: Article;
  tag?: Tag;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  content: any; // JSON template structure
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  articles?: Article[];
  contentGenerationSessions?: ContentGenerationSession[];
  contentSchedules?: ContentSchedule[];
}

export interface ContentWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: any; // JSON workflow configuration
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
}

export interface ContentSearchIndex {
  id: string;
  articleId: string;
  searchTextEn: string;
  searchTextAr: string;
  tags: string[];
  category?: string;
  author?: string;
  searchRank: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  article?: Article;
}

export interface Comment {
  id: string;
  content: string;
  isApproved: boolean;
  authorName?: string;
  authorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  articleId: string;
  article?: Article;
  siteId: string;
  site?: Site;
  userId?: string;
  user?: User;
  parentId?: string;
  parent?: Comment;
  children?: Comment[];
}

export interface ContentGenerationSession {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  parameters: any; // JSON parameters
  status: GenerationStatus;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  templateId?: string;
  template?: ContentTemplate;
}

export interface ContentSchedule {
  id: string;
  name: string;
  description?: string;
  schedule: any; // JSON schedule configuration
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  templateId?: string;
  template?: ContentTemplate;
}

// Enums

export enum UserRole {
  USER = 'USER',
  EDITOR = 'EDITOR',
  PUBLISHER = 'PUBLISHER',
  ADMIN = 'ADMIN'
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum NewsletterStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT'
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE',
  TRIAL = 'TRIAL'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  AED = 'AED',
  GBP = 'GBP',
  CAD = 'CAD'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO'
}

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  SQUARE = 'SQUARE',
  CRYPTO_GATEWAY = 'CRYPTO_GATEWAY'
}

export enum AdvertisementType {
  DISPLAY = 'DISPLAY',
  VIDEO = 'VIDEO',
  NATIVE = 'NATIVE',
  BANNER = 'BANNER',
  POPUP = 'POPUP'
}

export enum AdvertisementStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  DRAFT = 'DRAFT'
}

export enum ContentType {
  ARTICLE = 'ARTICLE',
  NEWSLETTER = 'NEWSLETTER',
  SOCIAL_POST = 'SOCIAL_POST',
  EMAIL = 'EMAIL',
  ADVERTISEMENT = 'ADVERTISEMENT'
}

export enum GenerationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum WorkflowStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Missing Enums from Prisma Schema

export enum WorkflowState {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED'
}

export enum SecuritySeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATION = 'NEGOTIATION',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  DISQUALIFIED = 'DISQUALIFIED'
}

export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROSPECT = 'PROSPECT',
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  VENDOR = 'VENDOR'
}

export enum DealStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST'
}

export enum InteractionType {
  EMAIL = 'EMAIL',
  PHONE_CALL = 'PHONE_CALL',
  MEETING = 'MEETING',
  CHAT = 'CHAT',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WEBSITE_VISIT = 'WEBSITE_VISIT',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
  OTHER = 'OTHER'
}

export enum CampaignType {
  EMAIL = 'EMAIL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  CONTENT_MARKETING = 'CONTENT_MARKETING',
  PAID_ADVERTISING = 'PAID_ADVERTISING',
  EVENT = 'EVENT',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  FOLLOW_UP = 'FOLLOW_UP',
  RESEARCH = 'RESEARCH',
  PROPOSAL = 'PROPOSAL',
  PRESENTATION = 'PRESENTATION',
  OTHER = 'OTHER'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DEFERRED = 'DEFERRED'
}

export enum WorkflowType {
  LEAD_NURTURING = 'LEAD_NURTURING',
  FOLLOW_UP = 'FOLLOW_UP',
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  NOTIFICATION = 'NOTIFICATION',
  DATA_ENRICHMENT = 'DATA_ENRICHMENT',
  CUSTOM = 'CUSTOM'
}

export enum WorkflowExecutionStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING'
}

// CRM Models

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  score: number;
  status: LeadStatus;
  source: string;
  sourceDetails?: any;
  industry?: string;
  companySize?: string;
  budget?: string;
  timeline?: string;
  lastContacted?: Date;
  nextFollowUp?: Date;
  nurtureStage?: string;
  convertedAt?: Date;
  convertedToContactId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  assignedTo?: string;
  assignedUser?: User;
  convertedContact?: Contact;
  interactions?: Interaction[];
  tasks?: Task[];
  campaigns?: CampaignLead[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  company?: string;
  website?: string;
  status: ContactStatus;
  source?: string;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  leadValue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  assignedTo?: string;
  assignedUser?: User;
  convertedFromLead?: Lead;
  interactions?: Interaction[];
  deals?: Deal[];
  tasks?: Task[];
  campaigns?: CampaignContact[];
}

export interface Deal {
  id: string;
  name: string;
  description?: string;
  value: number;
  currency: Currency;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  lostReason?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  contactId: string;
  contact?: Contact;
  assignedTo?: string;
  assignedUser?: User;
  interactions?: Interaction[];
  tasks?: Task[];
}

export interface Interaction {
  id: string;
  type: InteractionType;
  subject?: string;
  content?: string;
  duration?: number; // in minutes
  scheduledAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  leadId?: string;
  lead?: Lead;
  contactId?: string;
  contact?: Contact;
  dealId?: string;
  deal?: Deal;
  initiatedBy: string;
  initiatedByUser?: User;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  currency?: Currency;
  targetAudience?: string;
  goals?: any;
  results?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  createdBy: string;
  createdByUser?: User;
  leads?: CampaignLead[];
  contacts?: CampaignContact[];
  tasks?: Task[];
}

export interface CampaignLead {
  id: string;
  joinedAt: Date;
  status?: string;
  response?: string;
  
  // Relations
  campaignId: string;
  campaign?: Campaign;
  leadId: string;
  lead?: Lead;
}

export interface CampaignContact {
  id: string;
  joinedAt: Date;
  status?: string;
  response?: string;
  
  // Relations
  campaignId: string;
  campaign?: Campaign;
  contactId: string;
  contact?: Contact;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  assignedTo?: string;
  assignedUser?: User;
  leadId?: string;
  lead?: Lead;
  contactId?: string;
  contact?: Contact;
  dealId?: string;
  deal?: Deal;
  campaignId?: string;
  campaign?: Campaign;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: WorkflowType;
  trigger: any; // JSON trigger configuration
  actions: any; // JSON actions configuration
  conditions?: any; // JSON conditions
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  createdBy: string;
  createdByUser?: User;
  executions?: WorkflowExecution[];
}

export interface WorkflowExecution {
  id: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: any; // JSON execution result
  error?: string;
  
  // Relations
  siteId: string;
  site?: Site;
  workflowId: string;
  workflow?: Workflow;
} 