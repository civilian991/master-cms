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
  titleEn: string;
  titleAr?: string;
  contentEn: string;
  contentAr?: string;
  excerptEn?: string;
  excerptAr?: string;
  featuredImage?: string;
  status: ArticleStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  authorId: string;
  author?: User;
  categoryId: string;
  category?: Category;
  tags?: Tag[];
  media?: Media[];
  contentAnalytics?: ContentAnalytics[];
  contentOptimizations?: ContentOptimization[];
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
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altTextEn?: string;
  altTextAr?: string;
  createdAt: Date;
  
  // Relations
  siteId: string;
  site?: Site;
  uploadedById: string;
  uploadedBy?: User;
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
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  createdAt: Date;
  
  // Relations
  userId?: string;
  user?: User;
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