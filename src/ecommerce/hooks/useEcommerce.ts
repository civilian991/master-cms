'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ecommerceApi } from '../services/ecommerceApi';
import {
  Product,
  Order,
  Customer,
  EcommerceAnalytics,
  ProductFilter,
  OrderFilter,
  UseEcommerceOptions,
} from '../types/ecommerce.types';

interface EcommerceState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  analytics: EcommerceAnalytics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
}

export function useEcommerce(options: UseEcommerceOptions = {}) {
  const {
    autoLoadProducts = true,
    enableRealtime = false,
    cacheTimeout = 300000, // 5 minutes
  } = options;

  const [state, setState] = useState<EcommerceState>({
    products: [],
    orders: [],
    customers: [],
    analytics: null,
    isLoading: false,
    error: null,
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
  });

  const realtimeIntervalRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isInitialized.current) {
      if (autoLoadProducts) {
        loadInitialData();
      }
      if (enableRealtime) {
        setupRealtimeUpdates();
      }
      isInitialized.current = true;
    }

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
      }
    };
  }, [autoLoadProducts, enableRealtime]);

  const setupRealtimeUpdates = () => {
    realtimeIntervalRef.current = setInterval(async () => {
      try {
        await loadAnalytics();
      } catch (error) {
        console.warn('Realtime update failed:', error);
      }
    }, 60000); // Update every minute
  };

  const loadInitialData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadCustomers(),
        loadAnalytics(),
      ]);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  };

  // ============================================================================
  // PRODUCT MANAGEMENT
  // ============================================================================

  const loadProducts = useCallback(async (filters?: ProductFilter[], pagination?: { page: number; limit: number }) => {
    try {
      const response = await ecommerceApi.getProducts(filters, pagination);
      setState(prev => ({
        ...prev,
        products: response.products,
        totalProducts: response.total,
      }));
      return response;
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }, []);

  const createProduct = useCallback(async (productData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const product = await ecommerceApi.createProduct(productData);
      setState(prev => ({
        ...prev,
        products: [product, ...prev.products],
        totalProducts: prev.totalProducts + 1,
        isLoading: false,
      }));
      return product;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      }));
      throw error;
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, updates: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const product = await ecommerceApi.updateProduct(productId, updates);
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === productId ? product : p),
        isLoading: false,
      }));
      return product;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      }));
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await ecommerceApi.deleteProduct(productId);
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId),
        totalProducts: prev.totalProducts - 1,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      }));
      throw error;
    }
  }, []);

  const searchProducts = useCallback(async (searchQuery: any) => {
    try {
      return await ecommerceApi.searchProducts(searchQuery);
    } catch (error) {
      console.error('Product search failed:', error);
      throw error;
    }
  }, []);

  const getProduct = useCallback(async (productId: string) => {
    try {
      return await ecommerceApi.getProduct(productId);
    } catch (error) {
      console.error('Failed to get product:', error);
      throw error;
    }
  }, []);

  const getProductAnalytics = useCallback(async (productId: string, dateRange?: { start: Date; end: Date }) => {
    try {
      return await ecommerceApi.getProductAnalytics(productId, dateRange);
    } catch (error) {
      console.error('Failed to get product analytics:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // ORDER MANAGEMENT
  // ============================================================================

  const loadOrders = useCallback(async (filters?: OrderFilter[], pagination?: { page: number; limit: number }) => {
    try {
      const response = await ecommerceApi.getOrders(filters, pagination);
      setState(prev => ({
        ...prev,
        orders: response.orders,
        totalOrders: response.total,
      }));
      return response;
    } catch (error) {
      console.error('Failed to load orders:', error);
      throw error;
    }
  }, []);

  const createOrder = useCallback(async (orderData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ecommerceApi.createOrder(orderData);
      setState(prev => ({
        ...prev,
        orders: [order, ...prev.orders],
        totalOrders: prev.totalOrders + 1,
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      }));
      throw error;
    }
  }, []);

  const updateOrder = useCallback(async (orderId: string, updates: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ecommerceApi.updateOrder(orderId, updates);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === orderId ? order : o),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update order',
      }));
      throw error;
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ecommerceApi.cancelOrder(orderId, reason);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === orderId ? order : o),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order',
      }));
      throw error;
    }
  }, []);

  const fulfillOrder = useCallback(async (orderId: string, fulfillmentData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const fulfillment = await ecommerceApi.fulfillOrder(orderId, fulfillmentData);
      // Update order status in state
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => 
          o.id === orderId 
            ? { ...o, fulfillmentStatus: 'fulfilled' as any }
            : o
        ),
        isLoading: false,
      }));
      return fulfillment;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fulfill order',
      }));
      throw error;
    }
  }, []);

  const getOrder = useCallback(async (orderId: string) => {
    try {
      return await ecommerceApi.getOrder(orderId);
    } catch (error) {
      console.error('Failed to get order:', error);
      throw error;
    }
  }, []);

  const trackOrder = useCallback(async (orderId: string) => {
    try {
      return await ecommerceApi.trackOrder(orderId);
    } catch (error) {
      console.error('Failed to track order:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // CUSTOMER MANAGEMENT
  // ============================================================================

  const loadCustomers = useCallback(async (filters?: any, pagination?: { page: number; limit: number }) => {
    try {
      const response = await ecommerceApi.getCustomers(filters, pagination);
      setState(prev => ({
        ...prev,
        customers: response.customers,
        totalCustomers: response.total,
      }));
      return response;
    } catch (error) {
      console.error('Failed to load customers:', error);
      throw error;
    }
  }, []);

  const createCustomer = useCallback(async (customerData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const customer = await ecommerceApi.createCustomer(customerData);
      setState(prev => ({
        ...prev,
        customers: [customer, ...prev.customers],
        totalCustomers: prev.totalCustomers + 1,
        isLoading: false,
      }));
      return customer;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      }));
      throw error;
    }
  }, []);

  const updateCustomer = useCallback(async (customerId: string, updates: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const customer = await ecommerceApi.updateCustomer(customerId, updates);
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? customer : c),
        isLoading: false,
      }));
      return customer;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update customer',
      }));
      throw error;
    }
  }, []);

  const getCustomer = useCallback(async (customerId: string) => {
    try {
      return await ecommerceApi.getCustomer(customerId);
    } catch (error) {
      console.error('Failed to get customer:', error);
      throw error;
    }
  }, []);

  const getCustomerOrders = useCallback(async (customerId: string) => {
    try {
      return await ecommerceApi.getCustomerOrders(customerId);
    } catch (error) {
      console.error('Failed to get customer orders:', error);
      throw error;
    }
  }, []);

  const getCustomerAnalytics = useCallback(async (customerId: string) => {
    try {
      return await ecommerceApi.getCustomerAnalytics(customerId);
    } catch (error) {
      console.error('Failed to get customer analytics:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  const loadAnalytics = useCallback(async (dateRange?: { start: Date; end: Date }) => {
    try {
      const defaultDateRange = dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      };
      
      const analytics = await ecommerceApi.getEcommerceAnalytics(defaultDateRange);
      setState(prev => ({ ...prev, analytics }));
      return analytics;
    } catch (error) {
      console.error('Failed to load analytics:', error);
      throw error;
    }
  }, []);

  const getSalesReport = useCallback(async (dateRange: { start: Date; end: Date }, groupBy: string = 'day') => {
    try {
      return await ecommerceApi.getSalesReport(dateRange, groupBy);
    } catch (error) {
      console.error('Failed to get sales report:', error);
      throw error;
    }
  }, []);

  const getTopProducts = useCallback(async (limit: number = 10, period: string = '30d') => {
    try {
      return await ecommerceApi.getTopProducts(limit, period);
    } catch (error) {
      console.error('Failed to get top products:', error);
      throw error;
    }
  }, []);

  const getCustomerInsights = useCallback(async (dateRange: { start: Date; end: Date }) => {
    try {
      return await ecommerceApi.getCustomerInsights(dateRange);
    } catch (error) {
      console.error('Failed to get customer insights:', error);
      throw error;
    }
  }, []);

  const getConversionFunnel = useCallback(async (dateRange: { start: Date; end: Date }) => {
    try {
      return await ecommerceApi.getConversionFunnel(dateRange);
    } catch (error) {
      console.error('Failed to get conversion funnel:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // INVENTORY MANAGEMENT
  // ============================================================================

  const getInventory = useCallback(async (filters?: any) => {
    try {
      return await ecommerceApi.getInventory(filters);
    } catch (error) {
      console.error('Failed to get inventory:', error);
      throw error;
    }
  }, []);

  const updateInventory = useCallback(async (updateData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await ecommerceApi.updateInventory(updateData);
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Refresh products to get updated inventory
      await loadProducts();
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory',
      }));
      throw error;
    }
  }, [loadProducts]);

  const getLowStockProducts = useCallback(async () => {
    try {
      return await ecommerceApi.getLowStockProducts();
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      throw error;
    }
  }, []);

  const getInventoryForecast = useCallback(async (productId: string, days: number = 30) => {
    try {
      return await ecommerceApi.getInventoryForecast(productId, days);
    } catch (error) {
      console.error('Failed to get inventory forecast:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  const processPayment = useCallback(async (paymentData: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const payment = await ecommerceApi.processPayment(paymentData);
      setState(prev => ({ ...prev, isLoading: false }));
      return payment;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      }));
      throw error;
    }
  }, []);

  const refundPayment = useCallback(async (paymentId: string, amount?: number, reason?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const refund = await ecommerceApi.refundPayment(paymentId, amount, reason);
      setState(prev => ({ ...prev, isLoading: false }));
      return refund;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      }));
      throw error;
    }
  }, []);

  const getPaymentMethods = useCallback(async () => {
    try {
      return await ecommerceApi.getPaymentMethods();
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const refresh = useCallback(async () => {
    await loadInitialData();
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const uploadProductImage = useCallback(async (productId: string, file: File) => {
    try {
      return await ecommerceApi.uploadProductImage(productId, file);
    } catch (error) {
      console.error('Failed to upload product image:', error);
      throw error;
    }
  }, []);

  const validateAddress = useCallback(async (address: any) => {
    try {
      return await ecommerceApi.validateAddress(address);
    } catch (error) {
      console.error('Failed to validate address:', error);
      throw error;
    }
  }, []);

  const getShippingRates = useCallback(async (origin: any, destination: any, packages: any[]) => {
    try {
      return await ecommerceApi.getShippingRates(origin, destination, packages);
    } catch (error) {
      console.error('Failed to get shipping rates:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const getProductById = useCallback((productId: string) => {
    return state.products.find(p => p.id === productId);
  }, [state.products]);

  const getOrderById = useCallback((orderId: string) => {
    return state.orders.find(o => o.id === orderId);
  }, [state.orders]);

  const getCustomerById = useCallback((customerId: string) => {
    return state.customers.find(c => c.id === customerId);
  }, [state.customers]);

  const getProductsByCategory = useCallback((categoryId: string) => {
    return state.products.filter(p => p.category.id === categoryId);
  }, [state.products]);

  const getOrdersByStatus = useCallback((status: string) => {
    return state.orders.filter(o => o.status === status);
  }, [state.orders]);

  const getCustomersByType = useCallback((type: string) => {
    return state.customers.filter(c => c.type === type);
  }, [state.customers]);

  const getLowStockProductsFromState = useCallback(() => {
    return state.products.filter(p => 
      p.inventory.tracked && 
      p.inventory.available <= p.inventory.lowStockThreshold
    );
  }, [state.products]);

  const getOutOfStockProductsFromState = useCallback(() => {
    return state.products.filter(p => 
      p.inventory.tracked && 
      p.inventory.available <= p.inventory.outOfStockThreshold
    );
  }, [state.products]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // State
    products: state.products,
    orders: state.orders,
    customers: state.customers,
    analytics: state.analytics,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    totalProducts: state.totalProducts,
    totalOrders: state.totalOrders,
    totalCustomers: state.totalCustomers,

    // Product Management
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProduct,
    getProductAnalytics,
    uploadProductImage,

    // Order Management
    loadOrders,
    createOrder,
    updateOrder,
    cancelOrder,
    fulfillOrder,
    getOrder,
    trackOrder,

    // Customer Management
    loadCustomers,
    createCustomer,
    updateCustomer,
    getCustomer,
    getCustomerOrders,
    getCustomerAnalytics,

    // Analytics & Reporting
    loadAnalytics,
    getSalesReport,
    getTopProducts,
    getCustomerInsights,
    getConversionFunnel,

    // Inventory Management
    getInventory,
    updateInventory,
    getLowStockProducts,
    getInventoryForecast,

    // Payment Processing
    processPayment,
    refundPayment,
    getPaymentMethods,

    // Utilities
    refresh,
    clearError,
    validateAddress,
    getShippingRates,

    // Computed Values
    getProductById,
    getOrderById,
    getCustomerById,
    getProductsByCategory,
    getOrdersByStatus,
    getCustomersByType,
    getLowStockProductsFromState,
    getOutOfStockProductsFromState,

    // Helpers
    hasProducts: state.products.length > 0,
    hasOrders: state.orders.length > 0,
    hasCustomers: state.customers.length > 0,
    hasAnalytics: state.analytics !== null,
    hasError: state.error !== null,
  };
}

export default useEcommerce; 