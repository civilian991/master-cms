'use client';

import {
  Product,
  ProductCategory,
  Order,
  Customer,
  ShoppingCart,
  CartItem,
  Payment,
  Fulfillment,
  Return,
  Vendor,
  MarketplaceIntegration,
  Promotion,
  Subscription,
  ProductReview,
  EcommerceAnalytics,
  CreateProductRequest,
  UpdateProductRequest,
  CreateOrderRequest,
  ProcessPaymentRequest,
  InventoryUpdateRequest,
  ProductFilter,
  OrderFilter,
  ProductSearch,
} from '../types/ecommerce.types';

class EcommerceApiService {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCacheKey(endpoint: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramStr}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================================================
  // HTTP CLIENT WITH RETRY AND DEDUPLICATION
  // ============================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTTL?: number,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, { ...options, body: options.body });

    // Check cache first for GET requests
    if (options.method === 'GET' || !options.method) {
      if (useCache) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) return cached;
      }
    }

    // Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache successful GET requests
      if ((options.method === 'GET' || !options.method) && useCache && cacheTTL) {
        this.setCache(cacheKey, result, cacheTTL);
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    let lastError: Error;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }

        return await response.text() as any;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Network request failed');

        if (attempt === maxRetries - 1) break;

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // ============================================================================
  // PRODUCT MANAGEMENT APIS
  // ============================================================================

  async getProducts(filters?: ProductFilter[], pagination?: { page: number; limit: number }): Promise<{ products: Product[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }
    
    if (pagination) {
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
    }

    return this.makeRequest<{ products: Product[]; total: number }>(
      `/ecommerce/products?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getProduct(productId: string): Promise<Product> {
    return this.makeRequest<Product>(
      `/ecommerce/products/${productId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    const response = await this.makeRequest<Product>(
      '/ecommerce/products',
      {
        method: 'POST',
        body: JSON.stringify(product),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/products');
    return response;
  }

  async updateProduct(productId: string, updates: UpdateProductRequest): Promise<Product> {
    const response = await this.makeRequest<Product>(
      `/ecommerce/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/products');
    return response;
  }

  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/ecommerce/products/${productId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/products');
    return response;
  }

  async searchProducts(search: ProductSearch): Promise<{ products: Product[]; total: number; facets: any[] }> {
    return this.makeRequest(
      '/ecommerce/products/search',
      {
        method: 'POST',
        body: JSON.stringify(search),
      },
      60000 // 1 minute cache
    );
  }

  async getProductVariants(productId: string): Promise<any[]> {
    return this.makeRequest(
      `/ecommerce/products/${productId}/variants`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getProductAnalytics(productId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.set('start', dateRange.start.toISOString());
      params.set('end', dateRange.end.toISOString());
    }

    return this.makeRequest(
      `/ecommerce/products/${productId}/analytics?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // CATEGORY MANAGEMENT APIS
  // ============================================================================

  async getCategories(): Promise<ProductCategory[]> {
    return this.makeRequest<ProductCategory[]>(
      '/ecommerce/categories',
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async createCategory(category: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await this.makeRequest<ProductCategory>(
      '/ecommerce/categories',
      {
        method: 'POST',
        body: JSON.stringify(category),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/categories');
    return response;
  }

  async updateCategory(categoryId: string, updates: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await this.makeRequest<ProductCategory>(
      `/ecommerce/categories/${categoryId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/categories');
    return response;
  }

  async deleteCategory(categoryId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest<{ success: boolean }>(
      `/ecommerce/categories/${categoryId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/categories');
    return response;
  }

  // ============================================================================
  // SHOPPING CART APIS
  // ============================================================================

  async getCart(cartId?: string): Promise<ShoppingCart> {
    const endpoint = cartId ? `/ecommerce/cart/${cartId}` : '/ecommerce/cart';
    return this.makeRequest<ShoppingCart>(
      endpoint,
      { method: 'GET' },
      60000 // 1 minute cache
    );
  }

  async addToCart(productId: string, variantId?: string, quantity: number = 1, customizations?: any): Promise<ShoppingCart> {
    const response = await this.makeRequest<ShoppingCart>(
      '/ecommerce/cart/items',
      {
        method: 'POST',
        body: JSON.stringify({ productId, variantId, quantity, customizations }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/cart');
    return response;
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ShoppingCart> {
    const response = await this.makeRequest<ShoppingCart>(
      `/ecommerce/cart/items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/cart');
    return response;
  }

  async removeFromCart(itemId: string): Promise<ShoppingCart> {
    const response = await this.makeRequest<ShoppingCart>(
      `/ecommerce/cart/items/${itemId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/cart');
    return response;
  }

  async applyDiscount(code: string, cartId?: string): Promise<ShoppingCart> {
    const response = await this.makeRequest<ShoppingCart>(
      '/ecommerce/cart/discount',
      {
        method: 'POST',
        body: JSON.stringify({ code, cartId }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/cart');
    return response;
  }

  async removeDiscount(discountId: string): Promise<ShoppingCart> {
    const response = await this.makeRequest<ShoppingCart>(
      `/ecommerce/cart/discount/${discountId}`,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/cart');
    return response;
  }

  async clearCart(cartId?: string): Promise<{ success: boolean }> {
    const endpoint = cartId ? `/ecommerce/cart/${cartId}` : '/ecommerce/cart';
    const response = await this.makeRequest<{ success: boolean }>(
      endpoint,
      { method: 'DELETE' },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/cart');
    return response;
  }

  // ============================================================================
  // CHECKOUT APIS
  // ============================================================================

  async createCheckoutSession(cartId: string): Promise<any> {
    return this.makeRequest(
      '/ecommerce/checkout/session',
      {
        method: 'POST',
        body: JSON.stringify({ cartId }),
      },
      0,
      false
    );
  }

  async updateCheckoutStep(sessionId: string, step: string, data: any): Promise<any> {
    return this.makeRequest(
      `/ecommerce/checkout/session/${sessionId}/${step}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      0,
      false
    );
  }

  async getShippingMethods(address: any): Promise<any[]> {
    return this.makeRequest(
      '/ecommerce/shipping/methods',
      {
        method: 'POST',
        body: JSON.stringify({ address }),
      },
      300000 // 5 minutes cache
    );
  }

  async calculateTaxes(cart: ShoppingCart, address: any): Promise<any> {
    return this.makeRequest(
      '/ecommerce/checkout/taxes',
      {
        method: 'POST',
        body: JSON.stringify({ cart, address }),
      },
      60000 // 1 minute cache
    );
  }

  async validateCheckout(sessionId: string): Promise<{ valid: boolean; errors: string[] }> {
    return this.makeRequest(
      `/ecommerce/checkout/session/${sessionId}/validate`,
      { method: 'POST' },
      0,
      false
    );
  }

  // ============================================================================
  // ORDER MANAGEMENT APIS
  // ============================================================================

  async getOrders(filters?: OrderFilter[], pagination?: { page: number; limit: number }): Promise<{ orders: Order[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }
    
    if (pagination) {
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
    }

    return this.makeRequest<{ orders: Order[]; total: number }>(
      `/ecommerce/orders?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.makeRequest<Order>(
      `/ecommerce/orders/${orderId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    const response = await this.makeRequest<Order>(
      '/ecommerce/orders',
      {
        method: 'POST',
        body: JSON.stringify(order),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/orders');
    return response;
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
    const response = await this.makeRequest<Order>(
      `/ecommerce/orders/${orderId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/orders');
    return response;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const response = await this.makeRequest<Order>(
      `/ecommerce/orders/${orderId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/orders');
    return response;
  }

  async fulfillOrder(orderId: string, fulfillment: Partial<Fulfillment>): Promise<Fulfillment> {
    const response = await this.makeRequest<Fulfillment>(
      `/ecommerce/orders/${orderId}/fulfill`,
      {
        method: 'POST',
        body: JSON.stringify(fulfillment),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/orders');
    return response;
  }

  async trackOrder(orderId: string): Promise<any> {
    return this.makeRequest(
      `/ecommerce/orders/${orderId}/tracking`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getOrderTimeline(orderId: string): Promise<any[]> {
    return this.makeRequest(
      `/ecommerce/orders/${orderId}/timeline`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // PAYMENT APIS
  // ============================================================================

  async processPayment(payment: ProcessPaymentRequest): Promise<Payment> {
    return this.makeRequest<Payment>(
      '/ecommerce/payments/process',
      {
        method: 'POST',
        body: JSON.stringify(payment),
      },
      0,
      false
    );
  }

  async getPaymentMethods(): Promise<any[]> {
    return this.makeRequest(
      '/ecommerce/payments/methods',
      { method: 'GET' },
      3600000 // 1 hour cache
    );
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<any> {
    const response = await this.makeRequest(
      `/ecommerce/payments/${paymentId}/refund`,
      {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/orders');
    this.clearCacheByPattern('/ecommerce/payments');
    return response;
  }

  async capturePayment(paymentId: string, amount?: number): Promise<Payment> {
    return this.makeRequest<Payment>(
      `/ecommerce/payments/${paymentId}/capture`,
      {
        method: 'POST',
        body: JSON.stringify({ amount }),
      },
      0,
      false
    );
  }

  async getPaymentHistory(customerId: string): Promise<Payment[]> {
    return this.makeRequest<Payment[]>(
      `/ecommerce/payments/customer/${customerId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT APIS
  // ============================================================================

  async getCustomers(filters?: any, pagination?: { page: number; limit: number }): Promise<{ customers: Customer[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }
    
    if (pagination) {
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
    }

    return this.makeRequest<{ customers: Customer[]; total: number }>(
      `/ecommerce/customers?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getCustomer(customerId: string): Promise<Customer> {
    return this.makeRequest<Customer>(
      `/ecommerce/customers/${customerId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const response = await this.makeRequest<Customer>(
      '/ecommerce/customers',
      {
        method: 'POST',
        body: JSON.stringify(customer),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/customers');
    return response;
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    const response = await this.makeRequest<Customer>(
      `/ecommerce/customers/${customerId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/customers');
    return response;
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    return this.makeRequest<Order[]>(
      `/ecommerce/customers/${customerId}/orders`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getCustomerAnalytics(customerId: string): Promise<any> {
    return this.makeRequest(
      `/ecommerce/customers/${customerId}/analytics`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // INVENTORY MANAGEMENT APIS
  // ============================================================================

  async getInventory(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }

    return this.makeRequest(
      `/ecommerce/inventory?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async updateInventory(update: InventoryUpdateRequest): Promise<any> {
    const response = await this.makeRequest(
      '/ecommerce/inventory/update',
      {
        method: 'POST',
        body: JSON.stringify(update),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/inventory');
    this.clearCacheByPattern('/ecommerce/products');
    return response;
  }

  async getInventoryMovements(productId: string, variantId?: string): Promise<any[]> {
    const params = new URLSearchParams({ productId });
    if (variantId) params.set('variantId', variantId);

    return this.makeRequest(
      `/ecommerce/inventory/movements?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.makeRequest<Product[]>(
      '/ecommerce/inventory/low-stock',
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getInventoryForecast(productId: string, days: number = 30): Promise<any> {
    return this.makeRequest(
      `/ecommerce/inventory/forecast?productId=${productId}&days=${days}`,
      { method: 'GET' },
      3600000 // 1 hour cache
    );
  }

  // ============================================================================
  // VENDOR MANAGEMENT APIS
  // ============================================================================

  async getVendors(filters?: any): Promise<Vendor[]> {
    const params = new URLSearchParams();
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }

    return this.makeRequest<Vendor[]>(
      `/ecommerce/vendors?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getVendor(vendorId: string): Promise<Vendor> {
    return this.makeRequest<Vendor>(
      `/ecommerce/vendors/${vendorId}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
    const response = await this.makeRequest<Vendor>(
      '/ecommerce/vendors',
      {
        method: 'POST',
        body: JSON.stringify(vendor),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/vendors');
    return response;
  }

  async updateVendor(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
    const response = await this.makeRequest<Vendor>(
      `/ecommerce/vendors/${vendorId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/vendors');
    return response;
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    return this.makeRequest<Product[]>(
      `/ecommerce/vendors/${vendorId}/products`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getVendorOrders(vendorId: string): Promise<Order[]> {
    return this.makeRequest<Order[]>(
      `/ecommerce/vendors/${vendorId}/orders`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getVendorAnalytics(vendorId: string): Promise<any> {
    return this.makeRequest(
      `/ecommerce/vendors/${vendorId}/analytics`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // MARKETPLACE INTEGRATION APIS
  // ============================================================================

  async getMarketplaceIntegrations(): Promise<MarketplaceIntegration[]> {
    return this.makeRequest<MarketplaceIntegration[]>(
      '/ecommerce/marketplace/integrations',
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createMarketplaceIntegration(integration: Partial<MarketplaceIntegration>): Promise<MarketplaceIntegration> {
    const response = await this.makeRequest<MarketplaceIntegration>(
      '/ecommerce/marketplace/integrations',
      {
        method: 'POST',
        body: JSON.stringify(integration),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/marketplace');
    return response;
  }

  async syncMarketplace(integrationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/ecommerce/marketplace/integrations/${integrationId}/sync`,
      { method: 'POST' },
      0,
      false
    );
  }

  async getMarketplaceProducts(integrationId: string): Promise<any[]> {
    return this.makeRequest(
      `/ecommerce/marketplace/integrations/${integrationId}/products`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getMarketplaceOrders(integrationId: string): Promise<any[]> {
    return this.makeRequest(
      `/ecommerce/marketplace/integrations/${integrationId}/orders`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // PROMOTIONS & DISCOUNTS APIS
  // ============================================================================

  async getPromotions(filters?: any): Promise<Promotion[]> {
    const params = new URLSearchParams();
    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }

    return this.makeRequest<Promotion[]>(
      `/ecommerce/promotions?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createPromotion(promotion: Partial<Promotion>): Promise<Promotion> {
    const response = await this.makeRequest<Promotion>(
      '/ecommerce/promotions',
      {
        method: 'POST',
        body: JSON.stringify(promotion),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/promotions');
    return response;
  }

  async validatePromotion(code: string, cart?: ShoppingCart): Promise<{ valid: boolean; discount: any; errors: string[] }> {
    return this.makeRequest(
      '/ecommerce/promotions/validate',
      {
        method: 'POST',
        body: JSON.stringify({ code, cart }),
      },
      60000 // 1 minute cache
    );
  }

  async getPromotionAnalytics(promotionId: string): Promise<any> {
    return this.makeRequest(
      `/ecommerce/promotions/${promotionId}/analytics`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // REVIEWS & RATINGS APIS
  // ============================================================================

  async getProductReviews(productId: string, pagination?: { page: number; limit: number }): Promise<{ reviews: ProductReview[]; total: number }> {
    const params = new URLSearchParams();
    if (pagination) {
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
    }

    return this.makeRequest<{ reviews: ProductReview[]; total: number }>(
      `/ecommerce/products/${productId}/reviews?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createReview(review: Partial<ProductReview>): Promise<ProductReview> {
    const response = await this.makeRequest<ProductReview>(
      '/ecommerce/reviews',
      {
        method: 'POST',
        body: JSON.stringify(review),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/products');
    this.clearCacheByPattern('/ecommerce/reviews');
    return response;
  }

  async moderateReview(reviewId: string, action: 'approve' | 'reject', notes?: string): Promise<ProductReview> {
    const response = await this.makeRequest<ProductReview>(
      `/ecommerce/reviews/${reviewId}/moderate`,
      {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/reviews');
    return response;
  }

  async getReviewSummary(productId: string): Promise<any> {
    return this.makeRequest(
      `/ecommerce/products/${productId}/reviews/summary`,
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  // ============================================================================
  // SUBSCRIPTION APIS
  // ============================================================================

  async getSubscriptions(customerId?: string): Promise<Subscription[]> {
    const params = customerId ? `?customerId=${customerId}` : '';
    return this.makeRequest<Subscription[]>(
      `/ecommerce/subscriptions${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async createSubscription(subscription: Partial<Subscription>): Promise<Subscription> {
    return this.makeRequest<Subscription>(
      '/ecommerce/subscriptions',
      {
        method: 'POST',
        body: JSON.stringify(subscription),
      },
      0,
      false
    );
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const response = await this.makeRequest<Subscription>(
      `/ecommerce/subscriptions/${subscriptionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/subscriptions');
    return response;
  }

  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<Subscription> {
    const response = await this.makeRequest<Subscription>(
      `/ecommerce/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ immediate }),
      },
      0,
      false
    );

    this.clearCacheByPattern('/ecommerce/subscriptions');
    return response;
  }

  // ============================================================================
  // ANALYTICS APIS
  // ============================================================================

  async getEcommerceAnalytics(dateRange: { start: Date; end: Date }, filters?: any): Promise<EcommerceAnalytics> {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    });

    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }

    return this.makeRequest<EcommerceAnalytics>(
      `/ecommerce/analytics?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getSalesReport(dateRange: { start: Date; end: Date }, groupBy: string = 'day'): Promise<any> {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      groupBy,
    });

    return this.makeRequest(
      `/ecommerce/analytics/sales?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getTopProducts(limit: number = 10, period: string = '30d'): Promise<any[]> {
    return this.makeRequest(
      `/ecommerce/analytics/top-products?limit=${limit}&period=${period}`,
      { method: 'GET' },
      600000 // 10 minutes cache
    );
  }

  async getCustomerInsights(dateRange: { start: Date; end: Date }): Promise<any> {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    });

    return this.makeRequest(
      `/ecommerce/analytics/customers?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  async getConversionFunnel(dateRange: { start: Date; end: Date }): Promise<any> {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    });

    return this.makeRequest(
      `/ecommerce/analytics/funnel?${params}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async uploadProductImage(productId: string, file: File): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('productId', productId);

    return this.makeRequest<{ url: string; id: string }>(
      '/ecommerce/products/images/upload',
      {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      },
      0,
      false
    );
  }

  async generateSKU(productTitle: string, category?: string): Promise<{ sku: string }> {
    return this.makeRequest<{ sku: string }>(
      '/ecommerce/products/generate-sku',
      {
        method: 'POST',
        body: JSON.stringify({ productTitle, category }),
      },
      60000 // 1 minute cache
    );
  }

  async validateAddress(address: any): Promise<{ valid: boolean; normalized?: any; errors: string[] }> {
    return this.makeRequest(
      '/ecommerce/address/validate',
      {
        method: 'POST',
        body: JSON.stringify({ address }),
      },
      300000 // 5 minutes cache
    );
  }

  async getShippingRates(origin: any, destination: any, packages: any[]): Promise<any[]> {
    return this.makeRequest(
      '/ecommerce/shipping/rates',
      {
        method: 'POST',
        body: JSON.stringify({ origin, destination, packages }),
      },
      300000 // 5 minutes cache
    );
  }

  async trackShipment(trackingNumber: string, carrier: string): Promise<any> {
    return this.makeRequest(
      `/ecommerce/shipping/track?trackingNumber=${trackingNumber}&carrier=${carrier}`,
      { method: 'GET' },
      300000 // 5 minutes cache
    );
  }

  // Clear all caches
  clearAllCaches(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const ecommerceApi = new EcommerceApiService();
export default ecommerceApi; 