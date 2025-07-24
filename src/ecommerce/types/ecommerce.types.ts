// ============================================================================
// E-COMMERCE TYPE DEFINITIONS
// ============================================================================

// Core E-Commerce Types
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'out_of_stock';
export type ProductType = 'physical' | 'digital' | 'service' | 'subscription' | 'bundle' | 'gift_card';
export type InventoryPolicy = 'deny' | 'continue' | 'notify';
export type PricingType = 'fixed' | 'dynamic' | 'tiered' | 'subscription' | 'auction';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'CNY';

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'stripe'
  | 'bank_transfer'
  | 'cryptocurrency'
  | 'buy_now_pay_later';

export type ShippingMethod = 
  | 'standard'
  | 'expedited'
  | 'overnight'
  | 'international'
  | 'pickup'
  | 'digital_delivery'
  | 'free_shipping';

export type DiscountType = 
  | 'percentage'
  | 'fixed_amount'
  | 'buy_x_get_y'
  | 'free_shipping'
  | 'tiered'
  | 'bulk';

export type CustomerType = 'guest' | 'registered' | 'vip' | 'wholesale' | 'affiliate';
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'processed' | 'completed';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'trial';
export type MarketplaceType = 'amazon' | 'ebay' | 'etsy' | 'shopify' | 'facebook' | 'google';
export type VendorStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'rejected';

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface CategorySEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface ProductSpecification {
  name: string;
  value: string;
  group?: string;
  unit?: string;
}

export interface BundledProduct {
  productId: string;
  variantId?: string;
  quantity: number;
  discount?: number;
}

export interface ProductMetadata {
  supplier?: string;
  warranty?: string;
  certification?: string;
  model?: string;
  launchDate?: Date;
  discontinueDate?: Date;
  seasonal?: boolean;
  tags?: string[];
}

export interface ProductPromotion {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface TaxConfiguration {
  name: string;
  rate: number;
  jurisdiction: string;
  type: 'sales' | 'vat' | 'gst' | 'pst';
}

export interface PriceHistory {
  price: number;
  date: Date;
  reason?: string;
}

export interface CompetitorPrice {
  competitor: string;
  price: number;
  url?: string;
  date: Date;
}

export interface PricingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  value: number;
  isActive: boolean;
}

export interface PriceAdjustment {
  type: string;
  value: number;
  reason: string;
  date: Date;
}

export interface PricingCondition {
  field: string;
  operator: string;
  value: any;
}

export interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  threshold: number;
  isActive: boolean;
  notificationMethods: string[];
}

export interface InventoryMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string;
  date: Date;
  userId: string;
}

export interface InventoryForecast {
  demandForecast: number[];
  restockDate: Date;
  suggestedOrderQuantity: number;
  leadTime: number;
  seasonality: 'high' | 'normal' | 'low';
  trendDirection: 'up' | 'stable' | 'down';
  confidence: number;
}

export interface ProductSupplier {
  id: string;
  name: string;
  contact: Address;
  leadTime: number;
  minOrderQuantity: number;
  pricePerUnit: number;
  isPreferred: boolean;
}

export interface ShippingRestriction {
  type: 'country' | 'region' | 'product_type';
  values: string[];
  reason: string;
}

export interface CustomsInfo {
  hsCode: string;
  originCountry: string;
  value: number;
  description: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  colorProfile?: string;
}

export interface DigitalLicense {
  type: 'standard' | 'extended' | 'commercial';
  terms: string;
  restrictions: string[];
  transferable: boolean;
}

export interface ItemDiscount {
  id: string;
  name: string;
  type: DiscountType;
  amount: number;
  appliedAt: Date;
}

export interface ProductCustomization {
  field: string;
  value: string;
  cost?: number;
}

export interface DiscountCondition {
  field: string;
  operator: string;
  value: any;
}

export interface ShippingMethodSelection {
  method: ShippingMethod;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
}

export interface PaymentMethodSelection {
  method: PaymentMethod;
  processor: string;
  token?: string;
  metadata?: Record<string, any>;
}

export interface BillingInfo {
  address: Address;
  method: PaymentMethod;
  processor: string;
  currency: CurrencyCode;
  tax: {
    name: string;
    rate: number;
    amount: number;
    jurisdiction: string;
    type: 'sales' | 'vat' | 'gst' | 'pst';
  };
}

export interface ShippingInfo {
  address: Address;
  method: ShippingMethod;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface Refund {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
}

export interface OrderTax {
  name: string;
  rate: number;
  amount: number;
  jurisdiction: string;
  type: 'sales' | 'vat' | 'gst' | 'pst';
}

export interface OrderDiscount {
  id: string;
  code?: string;
  name: string;
  type: DiscountType;
  amount: number;
  appliedTo: 'order' | 'shipping' | 'item';
}

export interface OrderNote {
  id: string;
  message: string;
  isVisible: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
  flags: string[];
  verified: boolean;
  lastAssessed: Date;
}

export interface OrderEvent {
  id: string;
  type: string;
  description: string;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface ItemTax {
  name: string;
  rate: number;
  amount: number;
  jurisdiction: string;
  type: 'sales' | 'vat' | 'gst' | 'pst';
}

export interface DigitalAssetDelivery {
  assetId: string;
  downloadUrl: string;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
}

export interface PaymentFee {
  type: string;
  amount: number;
  description: string;
}

export interface PaymentMetadata {
  gateway: string;
  transactionId: string;
  processingTime: number;
  riskScore?: number;
  metadata?: Record<string, any>;
}

export interface FulfillmentItem {
  orderItemId: string;
  quantity: number;
  trackingNumber?: string;
}

export interface ReturnItem {
  orderItemId: string;
  quantity: number;
  reason: string;
  condition: string;
  refundAmount: number;
}

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethod;
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  customerCount: number;
}

export interface CustomerNote {
  id: string;
  message: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  phone: boolean;
  marketing: boolean;
  transactional: boolean;
}

export interface ShippingPreferences {
  defaultMethod: ShippingMethod;
  instructions?: string;
  signatureRequired: boolean;
  leaveAtDoor: boolean;
}

export interface PaymentPreferences {
  defaultMethod: PaymentMethod;
  autoSave: boolean;
  requireCVV: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

export interface ExpiringPoints {
  points: number;
  expiresAt: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  value: number;
  type: 'discount' | 'product' | 'service';
  isActive: boolean;
}

export interface VendorBusinessInfo {
  legalName: string;
  businessType: string;
  taxId: string;
  registrationNumber: string;
  website?: string;
}

export interface VendorBankingInfo {
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountHolderName: string;
}

export interface VendorTaxInfo {
  taxId: string;
  vatNumber?: string;
  taxExempt: boolean;
  documents: string[];
}

export interface VendorShippingMethod {
  method: ShippingMethod;
  cost: number;
  estimatedDays: number;
  regions: string[];
}

export interface VendorReturnPolicy {
  acceptsReturns: boolean;
  returnWindow: number;
  restockingFee?: number;
  conditions: string[];
}

export interface VendorSettings {
  autoApproveProducts: boolean;
  commissionRate: number;
  paymentSchedule: 'weekly' | 'monthly' | 'quarterly';
  notifications: Record<string, boolean>;
}

export interface VendorAnalytics {
  totalSales: number;
  totalCommission: number;
  productCount: number;
  orderCount: number;
  averageRating: number;
  conversionRate: number;
}

export interface VendorVerification {
  status: 'pending' | 'verified' | 'rejected';
  documents: string[];
  verifiedAt?: Date;
  notes?: string;
}

export interface VendorDocument {
  id: string;
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
}

export interface VendorContact {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface MarketplaceCredentials {
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  sellerId?: string;
}

export interface MarketplaceSettings {
  syncInventory: boolean;
  syncPricing: boolean;
  autoPublish: boolean;
  defaultCategory: string;
  priceAdjustment: number;
}

export interface MarketplaceSyncSettings {
  frequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  lastSync: Date;
  enabled: boolean;
  errors: string[];
}

export interface MarketplaceProduct {
  marketplaceProductId: string;
  title: string;
  status: 'active' | 'inactive' | 'rejected' | 'pending';
  lastSync: Date;
}

export interface MarketplaceOrder {
  marketplaceOrderId: string;
  orderId: string;
  status: string;
  importedAt: Date;
}

export interface MarketplaceFee {
  type: string;
  amount: number;
  percentage?: number;
  description: string;
}

export interface MarketplaceAnalytics {
  totalListings: number;
  activeListings: number;
  totalSales: number;
  fees: number;
  performance: Record<string, number>;
}

export interface MarketplaceError {
  code: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface MarketplaceListing {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  attributes: Record<string, any>;
}

export interface MarketplacePricing {
  listPrice: number;
  salePrice?: number;
  currency: CurrencyCode;
  competitive: boolean;
}

export interface MarketplaceInventory {
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: Date;
}

export interface MarketplaceProductPerformance {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ranking: number;
}

export interface SupplierContact {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface SupplierProduct {
  sku: string;
  name: string;
  cost: number;
  moq: number;
  leadTime: number;
}

export interface SupplierPricing {
  currency: CurrencyCode;
  priceBreaks: { quantity: number; price: number; }[];
  paymentTerms: string;
}

export interface SupplierFulfillment {
  method: 'dropship' | 'warehouse' | 'direct';
  processingTime: number;
  shippingMethods: string[];
}

export interface SupplierIntegration {
  type: 'api' | 'edi' | 'csv' | 'manual';
  endpoint?: string;
  credentials?: Record<string, string>;
  schedule?: string;
}

export interface SupplierPerformance {
  onTimeDelivery: number;
  qualityRating: number;
  responsiveness: number;
  costCompetitiveness: number;
}

export interface SupplierTerms {
  paymentTerms: string;
  shippingTerms: string;
  returnPolicy: string;
  warranty: string;
}

export interface SupplierReview {
  rating: number;
  comment: string;
  reviewedBy: string;
  date: Date;
}

export interface SupplierContract {
  id: string;
  startDate: Date;
  endDate: Date;
  terms: string;
  status: 'active' | 'expired' | 'terminated';
}

export interface SupplierAnalytics {
  totalOrders: number;
  totalValue: number;
  averageLeadTime: number;
  qualityMetrics: Record<string, number>;
}

export interface EcommerceOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  returnRate: number;
  customerSatisfaction: number;
  growthMetrics: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    productGrowth: number;
  };
  topMetrics: {
    bestseller: string;
    topCustomer: string;
    topCategory: string;
    topRegion: string;
  };
}

export interface MarketingAnalytics {
  campaigns: any[];
  channels: Record<string, number>;
  attribution: Record<string, number>;
  roi: Record<string, number>;
  spending: Record<string, number>;
  effectiveness: Record<string, number>;
}

export interface InventoryAnalytics {
  overview: {
    totalValue: number;
    totalUnits: number;
    lowStockItems: number;
    outOfStockItems: number;
    turnoverRate: number;
  };
  movements: any[];
  forecasting: any[];
  optimization: any[];
}

export interface FinancialAnalytics {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  cashFlow: number;
  taxes: number;
  fees: number;
}

export interface OperationalAnalytics {
  orderProcessingTime: number;
  fulfillmentTime: number;
  shippingTime: number;
  returnProcessingTime: number;
  customerServiceResponse: number;
}

export interface EcommerceForecast {
  revenue: any[];
  orders: any[];
  customers: any[];
  inventory: any[];
  trends: any[];
}

export interface EcommerceTrends {
  seasonal: any[];
  category: any[];
  geographic: any[];
  demographic: any[];
}

export interface EcommerceInsights {
  opportunities: any[];
  risks: any[];
  recommendations: any[];
  alerts: any[];
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';
}

export interface RevenueMetrics {
  total: number;
  net: number;
  gross: number;
  tax: number;
  shipping: number;
  discounts: number;
  refunds: number;
  currency: CurrencyCode;
  growth: number;
  forecast: number;
  breakdown: {
    daily: any[];
    weekly: any[];
    monthly: any[];
    quarterly: any[];
  };
}

export interface OrderMetrics {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  averageValue: number;
  frequency: number;
  growth: number;
  forecast: number;
  breakdown: {
    hourly: any[];
    daily: any[];
    weekly: any[];
    monthly: any[];
  };
  conversionFunnel: {
    visits: number;
    productViews: number;
    cartAdditions: number;
    checkoutStarted: number;
    ordersCompleted: number;
    conversionRate: number;
  };
}

export interface ConversionMetrics {
  overall: number;
  mobile: number;
  desktop: number;
  tablet: number;
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
  byPrice: Record<string, number>;
  trends: any[];
}

export interface AverageMetrics {
  orderValue: number;
  itemsPerOrder: number;
  customerLifetimeValue: number;
  timeToFirstPurchase: number;
  repeatPurchaseRate: number;
  customerAcquisitionCost: number;
}

export interface GrowthMetrics {
  revenue: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  orders: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  customers: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  aov: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
}

export interface GeographicMetrics {
  countries: Record<string, number>;
  regions: Record<string, number>;
  cities: Record<string, number>;
  topMarkets: any[];
}

export interface SeasonalMetrics {
  quarters: any[];
  months: any[];
  holidays: any[];
  trends: any[];
}

export interface ChannelMetrics {
  direct: number;
  organic: number;
  paid: number;
  social: number;
  email: number;
}

export interface CohortAnalytics {
  retention: any[];
  revenue: any[];
  frequency: any[];
}

export interface SalesFunnel {
  awareness: number;
  interest: number;
  consideration: number;
  purchase: number;
  retention: number;
  advocacy: number;
}

export interface ProductPerformance {
  productId: string;
  sales: number;
  revenue: number;
  views: number;
  conversionRate: number;
}

export interface CategoryPerformance {
  categoryId: string;
  sales: number;
  revenue: number;
  productCount: number;
  averagePrice: number;
}

export interface BrandPerformance {
  brand: string;
  sales: number;
  revenue: number;
  productCount: number;
  averageRating: number;
}

export interface VariantPerformance {
  variantId: string;
  sales: number;
  revenue: number;
  inventoryTurnover: number;
}

export interface ProductProfitability {
  productId: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface ProductLifecycle {
  productId: string;
  stage: 'introduction' | 'growth' | 'maturity' | 'decline';
  daysInStage: number;
  salesTrend: 'up' | 'down' | 'stable';
}

export interface ProductRecommendations {
  crossSell: any[];
  upSell: any[];
  related: any[];
  trending: any[];
  personalized: any[];
}

export interface ProductInventoryAnalytics {
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  turnoverRate: number;
  daysOnHand: number;
  deadStock: number;
  fastMovers: any[];
  slowMovers: any[];
}

export interface CustomerAcquisition {
  total: number;
  new: number;
  returning: number;
  sources: Record<string, number>;
  cost: number;
  value: number;
  paybackPeriod: number;
}

export interface CustomerRetention {
  rate: number;
  churnRate: number;
  repeatPurchaseRate: number;
  loyaltyRate: number;
  cohorts: any[];
}

export interface CustomerLifetimeValue {
  value: number;
  revenue: number;
  profit: number;
  duration: number;
  frequency: number;
  recency: number;
}

export interface CustomerSegmentation {
  byValue: Record<string, number>;
  byFrequency: Record<string, number>;
  byRecency: Record<string, number>;
  rfm: Record<string, number>;
  behavioral: Record<string, number>;
}

export interface CustomerBehavior {
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  topPages: any[];
  searchTerms: any[];
  categories: any[];
}

export interface CustomerSatisfaction {
  nps: number;
  csat: number;
  ces: number;
  reviews: number;
  complaints: number;
  compliments: number;
}

export interface LoyaltyAnalytics {
  programMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
  tierDistribution: Record<string, number>;
  engagement: number;
}

export interface ChurnAnalytics {
  rate: number;
  predictors: any[];
  riskSegments: Record<string, number>;
  preventionCampaigns: any[];
}

export interface CustomerDemographics {
  age: Record<string, number>;
  gender: Record<string, number>;
  location: Record<string, number>;
  income: Record<string, number>;
  interests: Record<string, number>;
}

export interface CustomerJourney {
  touchpoints: any[];
  stages: Record<string, number>;
  dropoffs: any[];
  optimizations: any[];
}

export interface CustomerUsage {
  customerId: string;
  count: number;
  lastUsed: Date;
}

export interface PromotionExclusion {
  type: string;
  values: string[];
}

export interface PromotionCondition {
  field: string;
  operator: string;
  value: any;
}

export interface PromotionAnalytics {
  totalUsage: number;
  revenue: number;
  discountAmount: number;
  conversionRate: number;
  roi: number;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  threshold: number;
  benefits: string[];
  color: string;
}

export interface PointsEarningRule {
  action: string;
  points: number;
  multiplier?: number;
  conditions?: any[];
}

export interface PointsRedemptionRule {
  item: string;
  points: number;
  value: number;
  available: boolean;
}

export interface PointsExpiration {
  enabled: boolean;
  months: number;
  warningDays: number;
}

export interface ReferralProgram {
  enabled: boolean;
  referrerReward: number;
  refereeReward: number;
  conditions: any[];
}

export interface LoyaltySettings {
  pointsPerDollar: number;
  dollarPerPoint: number;
  minimumRedemption: number;
  autoEnroll: boolean;
}

export interface SubscriptionBilling {
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  amount: number;
  currency: CurrencyCode;
}

export interface SubscriptionItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface SubscriptionAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SubscriptionDiscount {
  id: string;
  type: DiscountType;
  amount: number;
  duration?: number;
}

export interface SubscriptionTax {
  name: string;
  rate: number;
  amount: number;
  jurisdiction: string;
}

export interface BillingHistory {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  paidAt?: Date;
  createdAt: Date;
}

export interface UsageRecord {
  id: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PlanBilling {
  interval: 'monthly' | 'yearly';
  intervalCount: number;
  trialPeriodDays?: number;
}

export interface PlanPricing {
  currency: CurrencyCode;
  amount: number;
  setupFee?: number;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  users?: number;
  storage?: number;
  bandwidth?: number;
  apiCalls?: number;
}

export interface PlanTrial {
  enabled: boolean;
  days: number;
  requiresPaymentMethod: boolean;
}

export interface PlanAddon {
  id: string;
  name: string;
  price: number;
  type: 'fixed' | 'per_unit';
}

export interface ShippingRate {
  type: 'flat' | 'weight' | 'price' | 'item_count';
  minValue?: number;
  maxValue?: number;
  rate: number;
  freeThreshold?: number;
}

export interface ShippingCondition {
  field: string;
  operator: string;
  value: any;
}

export interface WarehouseContact {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface WarehouseCapacity {
  total: number;
  used: number;
  available: number;
  unit: 'sqft' | 'cubic_ft' | 'pallets';
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: 'receiving' | 'storage' | 'picking' | 'shipping';
  capacity: number;
}

export interface WarehouseInventory {
  productId: string;
  quantity: number;
  location: string;
  reserved: number;
}

export interface WarehouseStaff {
  id: string;
  name: string;
  role: string;
  shift: string;
}

export interface WarehouseEquipment {
  id: string;
  type: string;
  status: 'operational' | 'maintenance' | 'offline';
  lastMaintenance: Date;
}

export interface WarehouseOperations {
  ordersPerDay: number;
  pickingAccuracy: number;
  packingTime: number;
  shippingTime: number;
}

export interface WarehousePerformance {
  throughput: number;
  accuracy: number;
  efficiency: number;
  costs: number;
}

export interface WarehouseIntegration {
  type: 'wms' | 'erp' | 'tms';
  name: string;
  connected: boolean;
  lastSync: Date;
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchFacet {
  field: string;
  values: Array<{ value: string; count: number; }>;
}

export interface SearchSuggestion {
  query: string;
  type: 'product' | 'category' | 'brand';
  score: number;
}

export interface ProductSearchResult {
  product: Product;
  score: number;
  highlights: Record<string, string[]>;
}

export interface SearchAggregation {
  field: string;
  buckets: Array<{ key: string; count: number; }>;
}

export interface ReviewImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
}

export interface ReviewVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
}

export interface VendorResponse {
  message: string;
  respondedAt: Date;
  respondedBy: string;
}

export interface ReviewMetadata {
  ipAddress: string;
  userAgent: string;
  verified: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewSentiment {
  positive: number;
  negative: number;
  neutral: number;
}

export interface ReviewKeyword {
  keyword: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ReviewTrend {
  period: string;
  averageRating: number;
  reviewCount: number;
}

export interface OrderItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  customizations?: ProductCustomization[];
}

export interface PaymentDetails {
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  cardholderName?: string;
  billingAddress?: Address;
}

export interface OrderFilter {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  customerId?: string;
  dateRange?: { start: Date; end: Date };
}

// ============================================================================
// PRODUCT MANAGEMENT INTERFACES
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  title: string;
  description: string;
  shortDescription?: string;
  type: ProductType;
  status: ProductStatus;
  vendor?: string;
  brand?: string;
  category: ProductCategory;
  tags: string[];
  images: ProductImage[];
  videos: ProductVideo[];
  variants: ProductVariant[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  shipping: ProductShipping;
  seo: ProductSEO;
  specifications: ProductSpecification[];
  reviews: ProductReview[];
  relatedProducts: string[];
  bundledProducts: BundledProduct[];
  digitalAssets: DigitalAsset[];
  customFields: Record<string, any>;
  metadata: ProductMetadata;
  analytics: ProductAnalytics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string[];
  image?: string;
  seo: CategorySEO;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  options: VariantOption[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  images: ProductImage[];
  weight?: number;
  dimensions?: ProductDimensions;
  barcode?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantOption {
  name: string;
  value: string;
  displayValue?: string;
  colorCode?: string;
  image?: string;
}

export interface ProductPricing {
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  currency: CurrencyCode;
  type: PricingType;
  tierPricing: TierPricing[];
  subscriptionPricing?: SubscriptionPricing;
  dynamicPricing?: DynamicPricing;
  promotions: ProductPromotion[];
  taxes: TaxConfiguration[];
  priceHistory: PriceHistory[];
  competitorPricing: CompetitorPrice[];
}

export interface TierPricing {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discount?: number;
  label: string;
}

export interface SubscriptionPricing {
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  trialPeriodDays?: number;
  setupFee?: number;
  cancellationFee?: number;
}

export interface DynamicPricing {
  rules: PricingRule[];
  adjustments: PriceAdjustment[];
  conditions: PricingCondition[];
  isActive: boolean;
  lastUpdated: Date;
}

export interface ProductInventory {
  tracked: boolean;
  policy: InventoryPolicy;
  quantity: number;
  reserved: number;
  available: number;
  committed: number;
  incoming: number;
  locations: InventoryLocation[];
  lowStockThreshold: number;
  outOfStockThreshold: number;
  allowBackorders: boolean;
  maxOrderQuantity?: number;
  minOrderQuantity: number;
  stockAlerts: StockAlert[];
  movementHistory: InventoryMovement[];
  forecasting: InventoryForecast;
  suppliers: ProductSupplier[];
}

export interface InventoryLocation {
  id: string;
  name: string;
  address: Address;
  quantity: number;
  reserved: number;
  isActive: boolean;
  type: 'warehouse' | 'store' | 'supplier' | 'dropship';
  priority: number;
}

export interface ProductShipping {
  weight: number;
  dimensions: ProductDimensions;
  shippingClass?: string;
  requiresShipping: boolean;
  freeShippingEligible: boolean;
  shippingMethods: ShippingMethodConfig[];
  restrictions: ShippingRestriction[];
  handlingTime: number;
  fragile: boolean;
  hazardous: boolean;
  customs: CustomsInfo;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  title?: string;
  sortOrder: number;
  isMain: boolean;
  tags: string[];
  metadata: ImageMetadata;
  variants: string[];
  createdAt: Date;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  duration: number;
  sortOrder: number;
  provider: 'youtube' | 'vimeo' | 'self_hosted';
  isMain: boolean;
  tags: string[];
  createdAt: Date;
}

export interface DigitalAsset {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadLimit?: number;
  expiryDays?: number;
  license: DigitalLicense;
  encryption: boolean;
  watermark: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SHOPPING CART & CHECKOUT INTERFACES
// ============================================================================

export interface ShoppingCart {
  id: string;
  sessionId?: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  taxes: CartTax[];
  discounts: CartDiscount[];
  shipping: CartShipping;
  total: number;
  currency: CurrencyCode;
  notes: string;
  expires: Date;
  isAbandoned: boolean;
  abandonedAt?: Date;
  recoveryEmailSent: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discounts: ItemDiscount[];
  customizations: ProductCustomization[];
  giftMessage?: string;
  isGift: boolean;
  addedAt: Date;
  updatedAt: Date;
}

export interface CartTax {
  name: string;
  rate: number;
  amount: number;
  jurisdiction: string;
  type: 'sales' | 'vat' | 'gst' | 'pst';
}

export interface CartDiscount {
  id: string;
  code?: string;
  name: string;
  type: DiscountType;
  amount: number;
  appliedTo: 'order' | 'shipping' | 'item';
  conditions: DiscountCondition[];
}

export interface CartShipping {
  method?: ShippingMethod;
  carrier?: string;
  service?: string;
  cost: number;
  estimatedDays: number;
  address?: Address;
  trackingAvailable: boolean;
}

export interface CheckoutSession {
  id: string;
  cartId: string;
  customerId?: string;
  step: CheckoutStep;
  billingAddress?: Address;
  shippingAddress?: Address;
  shippingMethod?: ShippingMethodSelection;
  paymentMethod?: PaymentMethodSelection;
  guestEmail?: string;
  termsAccepted: boolean;
  marketingOptIn: boolean;
  notes: string;
  metadata: Record<string, any>;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CheckoutStep = 
  | 'information'
  | 'shipping'
  | 'payment'
  | 'review'
  | 'processing'
  | 'complete';

// ============================================================================
// ORDER MANAGEMENT INTERFACES
// ============================================================================

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerType: CustomerType;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  billing: BillingInfo;
  shipping: ShippingInfo;
  payments: Payment[];
  refunds: Refund[];
  returns: Return[];
  subtotal: number;
  taxes: OrderTax[];
  discounts: OrderDiscount[];
  shippingCost: number;
  total: number;
  currency: CurrencyCode;
  notes: OrderNote[];
  tags: string[];
  riskAssessment: RiskAssessment;
  fulfillments: Fulfillment[];
  timeline: OrderEvent[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  title: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discounts: ItemDiscount[];
  taxes: ItemTax[];
  customizations: ProductCustomization[];
  fulfillmentService?: string;
  fulfillmentStatus: FulfillmentStatus;
  refundableQuantity: number;
  returnableQuantity: number;
  vendor?: string;
  commissionRate?: number;
  commissionAmount?: number;
  digitalAssets: DigitalAssetDelivery[];
  giftMessage?: string;
  isGift: boolean;
  metadata: Record<string, any>;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  processor: string;
  status: PaymentStatus;
  amount: number;
  currency: CurrencyCode;
  transactionId: string;
  gatewayTransactionId?: string;
  authorizationCode?: string;
  capturedAt?: Date;
  failureReason?: string;
  fees: PaymentFee[];
  metadata: PaymentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fulfillment {
  id: string;
  orderId: string;
  items: FulfillmentItem[];
  status: FulfillmentStatus;
  shippingMethod: ShippingMethod;
  carrier: string;
  service: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  shippingAddress: Address;
  shippingCost: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  items: ReturnItem[];
  reason: string;
  status: ReturnStatus;
  refundAmount: number;
  restockingFee?: number;
  returnShippingCost?: number;
  rmaNumber: string;
  returnAddress: Address;
  returnMethod: ShippingMethod;
  trackingNumber?: string;
  receivedAt?: Date;
  processedAt?: Date;
  approvedBy?: string;
  notes: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CUSTOMER MANAGEMENT INTERFACES
// ============================================================================

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  type: CustomerType;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  addresses: CustomerAddress[];
  defaultBillingAddress?: string;
  defaultShippingAddress?: string;
  paymentMethods: SavedPaymentMethod[];
  preferences: CustomerPreferences;
  loyalty: LoyaltyProgram;
  segments: CustomerSegment[];
  tags: string[];
  notes: CustomerNote[];
  orders: string[];
  totalSpent: number;
  averageOrderValue: number;
  orderCount: number;
  lifetimeValue: number;
  acquisitionSource: string;
  acquisitionDate: Date;
  lastOrderDate?: Date;
  lastLoginDate?: Date;
  marketingOptIn: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping' | 'both';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerPreferences {
  currency: CurrencyCode;
  language: string;
  timezone: string;
  communicationPreferences: CommunicationPreferences;
  shippingPreferences: ShippingPreferences;
  paymentPreferences: PaymentPreferences;
  privacySettings: PrivacySettings;
}

export interface LoyaltyProgram {
  isEnrolled: boolean;
  tier: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  nextTierPoints?: number;
  expiringPoints: ExpiringPoints[];
  rewards: LoyaltyReward[];
  enrolledAt?: Date;
  lastActivity?: Date;
}

// ============================================================================
// MARKETPLACE & VENDOR INTERFACES
// ============================================================================

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  description: string;
  logo?: string;
  banner?: string;
  status: VendorStatus;
  type: 'individual' | 'business';
  businessInfo: VendorBusinessInfo;
  address: Address;
  bankingInfo: VendorBankingInfo;
  taxInfo: VendorTaxInfo;
  commissionRate: number;
  products: string[];
  orders: string[];
  totalSales: number;
  totalCommission: number;
  averageRating: number;
  reviewCount: number;
  fulfillmentMethod: 'self' | 'marketplace' | 'dropship';
  shippingMethods: VendorShippingMethod[];
  returnPolicy: VendorReturnPolicy;
  settings: VendorSettings;
  analytics: VendorAnalytics;
  verificationStatus: VendorVerification;
  documents: VendorDocument[];
  contacts: VendorContact[];
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  suspendedAt?: Date;
}

export interface MarketplaceIntegration {
  id: string;
  type: MarketplaceType;
  name: string;
  isActive: boolean;
  credentials: MarketplaceCredentials;
  settings: MarketplaceSettings;
  syncSettings: MarketplaceSyncSettings;
  products: MarketplaceProduct[];
  orders: MarketplaceOrder[];
  fees: MarketplaceFee[];
  analytics: MarketplaceAnalytics;
  lastSync: Date;
  errors: MarketplaceError[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DropshippingSupplier {
  id: string;
  name: string;
  contact: SupplierContact;
  products: SupplierProduct[];
  pricing: SupplierPricing;
  fulfillment: SupplierFulfillment;
  integration: SupplierIntegration;
  performance: SupplierPerformance;
  terms: SupplierTerms;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  rating: number;
  reviews: SupplierReview[];
  contracts: SupplierContract[];
  analytics: SupplierAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ANALYTICS & REPORTING INTERFACES
// ============================================================================

export interface EcommerceAnalytics {
  overview: EcommerceOverview;
  sales: SalesAnalytics;
  products: ProductAnalytics;
  customers: CustomerAnalytics;
  marketing: MarketingAnalytics;
  inventory: InventoryAnalytics;
  vendors: VendorAnalytics;
  marketplace: MarketplaceAnalytics;
  financial: FinancialAnalytics;
  operational: OperationalAnalytics;
  forecasting: EcommerceForecast;
  trends: EcommerceTrends;
  insights: EcommerceInsights;
  period: AnalyticsPeriod;
  lastUpdated: Date;
}

export interface SalesAnalytics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  conversion: ConversionMetrics;
  averages: AverageMetrics;
  growth: GrowthMetrics;
  geographic: GeographicMetrics;
  seasonal: SeasonalMetrics;
  channels: ChannelMetrics;
  cohorts: CohortAnalytics;
  funnel: SalesFunnel;
}

export interface ProductAnalytics {
  bestsellers: ProductPerformance[];
  slowMovers: ProductPerformance[];
  trending: ProductPerformance[];
  categories: CategoryPerformance[];
  brands: BrandPerformance[];
  variants: VariantPerformance[];
  profitability: ProductProfitability[];
  lifecycle: ProductLifecycle[];
  recommendations: ProductRecommendations;
  inventory: ProductInventoryAnalytics;
}

export interface CustomerAnalytics {
  acquisition: CustomerAcquisition;
  retention: CustomerRetention;
  lifetime: CustomerLifetimeValue;
  segmentation: CustomerSegmentation;
  behavior: CustomerBehavior;
  satisfaction: CustomerSatisfaction;
  loyalty: LoyaltyAnalytics;
  churn: ChurnAnalytics;
  demographics: CustomerDemographics;
  journey: CustomerJourney;
}

// ============================================================================
// PROMOTIONS & DISCOUNTS INTERFACES
// ============================================================================

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: DiscountType;
  code?: string;
  value: number;
  isPercentage: boolean;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  customerUsageLimit?: number;
  customerUsages: CustomerUsage[];
  products: string[];
  categories: string[];
  customers: string[];
  customerSegments: string[];
  exclusions: PromotionExclusion[];
  conditions: PromotionCondition[];
  stackable: boolean;
  priority: number;
  status: 'draft' | 'active' | 'paused' | 'expired' | 'completed';
  startDate: Date;
  endDate?: Date;
  timezone: string;
  analytics: PromotionAnalytics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  tiers: LoyaltyTier[];
  pointsEarning: PointsEarningRule[];
  pointsRedemption: PointsRedemptionRule[];
  rewards: LoyaltyReward[];
  expiration: PointsExpiration;
  referralProgram: ReferralProgram;
  analytics: LoyaltyAnalytics;
  settings: LoyaltySettings;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SUBSCRIPTION & RECURRING BILLING INTERFACES
// ============================================================================

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  variantId?: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  cancelAtPeriodEnd: boolean;
  pausedAt?: Date;
  resumeAt?: Date;
  billing: SubscriptionBilling;
  items: SubscriptionItem[];
  addons: SubscriptionAddon[];
  discounts: SubscriptionDiscount[];
  taxes: SubscriptionTax[];
  total: number;
  currency: CurrencyCode;
  paymentMethod: string;
  nextBillingDate: Date;
  billingHistory: BillingHistory[];
  usage: UsageRecord[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  productId?: string;
  billing: PlanBilling;
  pricing: PlanPricing[];
  features: PlanFeature[];
  limits: PlanLimits;
  trial: PlanTrial;
  addons: PlanAddon[];
  isActive: boolean;
  isPublic: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SHIPPING & FULFILLMENT INTERFACES
// ============================================================================

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions: string[];
  methods: ShippingMethodConfig[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingMethodConfig {
  id: string;
  name: string;
  method: ShippingMethod;
  carrier?: string;
  service?: string;
  description?: string;
  estimatedDays: number;
  rates: ShippingRate[];
  conditions: ShippingCondition[];
  restrictions: ShippingRestriction[];
  tracking: boolean;
  insurance: boolean;
  signature: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Warehouse {
  id: string;
  name: string;
  address: Address;
  contact: WarehouseContact;
  capacity: WarehouseCapacity;
  zones: WarehouseZone[];
  inventory: WarehouseInventory[];
  staff: WarehouseStaff[];
  equipment: WarehouseEquipment[];
  operations: WarehouseOperations;
  performance: WarehousePerformance;
  integrations: WarehouseIntegration[];
  isActive: boolean;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SEARCH & FILTERING INTERFACES
// ============================================================================

export interface ProductSearch {
  query?: string;
  filters: ProductFilter[];
  sort: ProductSort;
  pagination: SearchPagination;
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
  results: ProductSearchResult[];
  total: number;
  took: number;
  aggregations: SearchAggregation[];
}

export interface ProductFilter {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'range' | 'exists';
  value: any;
  values?: any[];
  boost?: number;
}

export interface ProductSort {
  field: string;
  direction: 'asc' | 'desc';
  boost?: number;
}

// ============================================================================
// REVIEWS & RATINGS INTERFACES
// ============================================================================

export interface ProductReview {
  id: string;
  productId: string;
  variantId?: string;
  customerId?: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  images: ReviewImage[];
  videos: ReviewVideo[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  moderationNotes?: string;
  response?: VendorResponse;
  metadata: ReviewMetadata;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
}

export interface ReviewSummary {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
  verifiedPurchases: number;
  recommendationRate: number;
  sentiment: ReviewSentiment;
  keywords: ReviewKeyword[];
  trends: ReviewTrend[];
  lastUpdated: Date;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface CreateProductRequest {
  title: string;
  description: string;
  type: ProductType;
  category: string;
  pricing: Partial<ProductPricing>;
  inventory: Partial<ProductInventory>;
  shipping: Partial<ProductShipping>;
  images?: ProductImage[];
  variants?: Partial<ProductVariant>[];
  seo?: Partial<ProductSEO>;
  metadata?: Record<string, any>;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  status?: ProductStatus;
  pricing?: Partial<ProductPricing>;
  inventory?: Partial<ProductInventory>;
  images?: ProductImage[];
  variants?: Partial<ProductVariant>[];
  metadata?: Record<string, any>;
}

export interface CreateOrderRequest {
  customerId?: string;
  items: OrderItemRequest[];
  billing: BillingInfo;
  shipping: ShippingInfo;
  paymentMethod: PaymentMethodSelection;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  paymentDetails: PaymentDetails;
  metadata?: Record<string, any>;
}

export interface InventoryUpdateRequest {
  productId: string;
  variantId?: string;
  locationId: string;
  adjustment: number;
  reason: string;
  reference?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface EcommerceHubProps {
  userId: string;
  onNavigate: (section: string) => void;
  initialSection?: string;
}

export interface ProductCatalogProps {
  products: Product[];
  categories: ProductCategory[];
  onProductSelect: (product: Product) => void;
  onProductEdit: (productId: string) => void;
  onProductDelete: (productId: string) => void;
  filters: ProductFilter[];
  onFiltersChange: (filters: ProductFilter[]) => void;
  loading?: boolean;
}

export interface ShoppingCartProps {
  cart: ShoppingCart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (code: string) => void;
  onProceedToCheckout: () => void;
  loading?: boolean;
}

export interface CheckoutFlowProps {
  cart: ShoppingCart;
  customer?: Customer;
  onStepComplete: (step: CheckoutStep, data: any) => void;
  onOrderComplete: (order: Order) => void;
  onError: (error: string) => void;
}

export interface OrderManagementProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onOrderUpdate: (orderId: string, updates: Partial<Order>) => void;
  onFulfillOrder: (orderId: string, fulfillment: Partial<Fulfillment>) => void;
  onRefundOrder: (orderId: string, refund: Partial<Refund>) => void;
  filters: OrderFilter[];
  onFiltersChange: (filters: OrderFilter[]) => void;
}

export interface VendorDashboardProps {
  vendor: Vendor;
  products: Product[];
  orders: Order[];
  analytics: VendorAnalytics;
  onProductCreate: (product: Partial<Product>) => void;
  onProductUpdate: (productId: string, updates: Partial<Product>) => void;
  onOrderUpdate: (orderId: string, updates: Partial<Order>) => void;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseEcommerceOptions {
  autoLoadProducts?: boolean;
  enableRealtime?: boolean;
  cacheTimeout?: number;
}

export interface UseShoppingCartOptions {
  persistCart?: boolean;
  autoSaveInterval?: number;
  enableAbandonedCartRecovery?: boolean;
}

export interface UseCheckoutOptions {
  enableGuestCheckout?: boolean;
  saveCustomerInfo?: boolean;
  enableExpressCheckout?: boolean;
}

export interface UseInventoryOptions {
  trackChanges?: boolean;
  enableLowStockAlerts?: boolean;
  autoReorder?: boolean;
}

export interface UsePaymentOptions {
  enableMultiplePayments?: boolean;
  enableSavedPaymentMethods?: boolean;
  enableRecurringPayments?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Money {
  amount: number;
  currency: CurrencyCode;
  formatted: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortInfo {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

export const PRODUCT_TYPES = {
  PHYSICAL: 'physical',
  DIGITAL: 'digital',
  SERVICE: 'service',
  SUBSCRIPTION: 'subscription',
  BUNDLE: 'bundle',
  GIFT_CARD: 'gift_card',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  RETURNED: 'returned',
} as const;

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  STRIPE: 'stripe',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTOCURRENCY: 'cryptocurrency',
  BUY_NOW_PAY_LATER: 'buy_now_pay_later',
} as const;

export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPEDITED: 'expedited',
  OVERNIGHT: 'overnight',
  INTERNATIONAL: 'international',
  PICKUP: 'pickup',
  DIGITAL_DELIVERY: 'digital_delivery',
  FREE_SHIPPING: 'free_shipping',
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  BUY_X_GET_Y: 'buy_x_get_y',
  FREE_SHIPPING: 'free_shipping',
  TIERED: 'tiered',
  BULK: 'bulk',
} as const;

export const MARKETPLACE_TYPES = {
  AMAZON: 'amazon',
  EBAY: 'ebay',
  ETSY: 'etsy',
  SHOPIFY: 'shopify',
  FACEBOOK: 'facebook',
  GOOGLE: 'google',
} as const;

export const CURRENCY_CODES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: 'JPY',
  CHF: 'CHF',
  CNY: 'CNY',
} as const;

export const DEFAULT_LIMITS = {
  PRODUCTS_PER_PAGE: 20,
  ORDERS_PER_PAGE: 25,
  CUSTOMERS_PER_PAGE: 50,
  MAX_CART_ITEMS: 100,
  MAX_PRODUCT_IMAGES: 20,
  MAX_PRODUCT_VARIANTS: 100,
  MAX_ORDER_NOTES: 10,
  MAX_DISCOUNT_CODES: 5,
} as const;

export const VALIDATION_RULES = {
  PRODUCT_TITLE_MIN_LENGTH: 3,
  PRODUCT_TITLE_MAX_LENGTH: 255,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 10000,
  SKU_MAX_LENGTH: 50,
  CUSTOMER_NAME_MAX_LENGTH: 100,
  ADDRESS_LINE_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 20,
  EMAIL_MAX_LENGTH: 255,
  ORDER_NOTES_MAX_LENGTH: 1000,
} as const;

export const ANALYTICS_METRICS = {
  REVENUE: ['total_revenue', 'net_revenue', 'gross_revenue', 'recurring_revenue'],
  ORDERS: ['total_orders', 'new_orders', 'completed_orders', 'cancelled_orders'],
  CUSTOMERS: ['total_customers', 'new_customers', 'returning_customers', 'active_customers'],
  PRODUCTS: ['total_products', 'bestsellers', 'slow_movers', 'out_of_stock'],
  CONVERSION: ['conversion_rate', 'cart_abandonment_rate', 'checkout_completion_rate'],
  AVERAGE: ['aov', 'clv', 'order_frequency', 'customer_acquisition_cost'],
} as const;

export default {}; 