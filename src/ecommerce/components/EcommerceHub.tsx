'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Truck,
  Star,
  AlertTriangle,
  Plus,
  Eye,
  Settings,
  BarChart3,
  CreditCard,
  Gift,
  Tag,
  Globe,
  Zap,
  RefreshCw,
  FileText,
  ShoppingBag,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  EcommerceHubProps,
  Product,
  Order,
  Customer,
  EcommerceAnalytics,
} from '../types/ecommerce.types';
import { useEcommerce } from '../hooks/useEcommerce';
import { useShoppingCart } from '../hooks/useShoppingCart';

export function EcommerceHub({ userId, onNavigate, initialSection = 'overview' }: EcommerceHubProps) {
  const [activeTab, setActiveTab] = useState(initialSection);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });

  // E-commerce hooks
  const {
    products,
    orders,
    customers,
    analytics,
    isLoading,
    error,
    refresh,
  } = useEcommerce({
    autoLoadProducts: true,
    enableRealtime: true,
  });

  const {
    cart,
    itemCount,
    total,
  } = useShoppingCart({
    persistCart: true,
    enableAbandonedCartRecovery: true,
  });

  // Mock data for demonstration
  const mockProducts: Product[] = [
    {
      id: '1',
      sku: 'PROD-001',
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      shortDescription: 'Premium wireless headphones',
      type: 'physical',
      status: 'active',
      brand: 'TechBrand',
      category: {
        id: 'cat-1',
        name: 'Electronics',
        slug: 'electronics',
        level: 1,
        path: ['Electronics'],
        sortOrder: 1,
        isActive: true,
        productCount: 25,
        seo: {
          title: 'Electronics',
          description: 'Electronic products',
          keywords: ['electronics', 'tech'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tags: ['electronics', 'wireless', 'audio'],
      images: [],
      videos: [],
      variants: [],
      pricing: {
        basePrice: 299.99,
        currency: 'USD',
        type: 'fixed',
        tierPricing: [],
        promotions: [],
        taxes: [],
        priceHistory: [],
        competitorPricing: [],
      },
      inventory: {
        tracked: true,
        policy: 'deny',
        quantity: 150,
        reserved: 10,
        available: 140,
        committed: 5,
        incoming: 50,
        locations: [],
        lowStockThreshold: 20,
        outOfStockThreshold: 0,
        allowBackorders: false,
        minOrderQuantity: 1,
        stockAlerts: [],
        movementHistory: [],
        forecasting: {
          demandForecast: [],
          restockDate: new Date(),
          suggestedOrderQuantity: 100,
          leadTime: 14,
          seasonality: 'normal',
          trendDirection: 'stable',
          confidence: 85,
        },
        suppliers: [],
      },
      shipping: {
        weight: 0.5,
        dimensions: { length: 20, width: 15, height: 8, unit: 'cm' },
        requiresShipping: true,
        freeShippingEligible: true,
        shippingMethods: [],
        restrictions: [],
        handlingTime: 1,
        fragile: false,
        hazardous: false,
        customs: {
          hsCode: '8518',
          originCountry: 'US',
          value: 299.99,
          description: 'Wireless headphones',
        },
      },
      seo: {
        title: 'Premium Wireless Headphones | TechBrand',
        description: 'High-quality wireless headphones with noise cancellation',
        keywords: ['wireless', 'headphones', 'audio'],
        slug: 'premium-wireless-headphones',
      },
      specifications: [],
      reviews: [],
      relatedProducts: [],
      bundledProducts: [],
      digitalAssets: [],
      customFields: {},
      metadata: {
        supplier: 'TechSupplier',
        warranty: '2 years',
        certification: 'CE, FCC',
        model: 'TWH-2024',
        launchDate: new Date(),
        discontinueDate: null,
        seasonal: false,
        tags: ['bestseller', 'featured'],
      },
      analytics: {
        views: 1250,
        sales: 45,
        revenue: 13499.55,
        conversionRate: 3.6,
        averageRating: 4.5,
        reviewCount: 18,
        wishlistCount: 230,
        cartAdditions: 125,
        cartAbandonments: 80,
        returnRate: 2.2,
        profitMargin: 35.5,
        competitorComparison: [],
        trends: [],
        lastUpdated: new Date(),
      },
      createdBy: userId,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      publishedAt: new Date('2024-01-16'),
    },
  ];

  const mockOrders: Order[] = [
    {
      id: 'order-1',
      orderNumber: 'ORD-2024-001',
      customerId: 'customer-1',
      customerType: 'registered',
      status: 'processing',
      fulfillmentStatus: 'unfulfilled',
      paymentStatus: 'completed',
      items: [],
      billing: {
        address: {
          firstName: 'John',
          lastName: 'Doe',
          company: '',
          address1: '123 Main St',
          city: 'New York',
          province: 'NY',
          country: 'US',
          postalCode: '10001',
        },
        method: 'credit_card',
        processor: 'stripe',
        currency: 'USD',
        tax: {
          name: 'Sales Tax',
          rate: 8.25,
          amount: 24.74,
          jurisdiction: 'NY',
          type: 'sales',
        },
      },
      shipping: {
        address: {
          firstName: 'John',
          lastName: 'Doe',
          company: '',
          address1: '123 Main St',
          city: 'New York',
          province: 'NY',
          country: 'US',
          postalCode: '10001',
        },
        method: 'standard',
        carrier: 'UPS',
        service: 'Ground',
        cost: 9.99,
        estimatedDays: 3,
        trackingNumber: '1Z999AA1234567890',
        trackingUrl: 'https://www.ups.com/track',
      },
      payments: [],
      refunds: [],
      returns: [],
      subtotal: 299.99,
      taxes: [],
      discounts: [],
      shippingCost: 9.99,
      total: 334.72,
      currency: 'USD',
      notes: [],
      tags: [],
      riskAssessment: {
        score: 25,
        level: 'low',
        factors: [],
        recommendations: [],
        flags: [],
        verified: true,
        lastAssessed: new Date(),
      },
      fulfillments: [],
      timeline: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAnalytics: EcommerceAnalytics = {
    overview: {
      totalRevenue: 125430.50,
      totalOrders: 342,
      totalCustomers: 189,
      totalProducts: 156,
      averageOrderValue: 366.75,
      conversionRate: 3.2,
      returnRate: 2.8,
      customerSatisfaction: 4.3,
      growthMetrics: {
        revenueGrowth: 15.2,
        orderGrowth: 8.7,
        customerGrowth: 12.3,
        productGrowth: 5.1,
      },
      topMetrics: {
        bestseller: 'Premium Wireless Headphones',
        topCustomer: 'John Doe',
        topCategory: 'Electronics',
        topRegion: 'North America',
      },
    },
    sales: {
      revenue: {
        total: 125430.50,
        net: 118908.98,
        gross: 125430.50,
        tax: 10329.50,
        shipping: 3420.00,
        discounts: 6521.52,
        refunds: 2850.00,
        currency: 'USD',
        growth: 15.2,
        forecast: 145000.00,
        breakdown: {
          daily: [],
          weekly: [],
          monthly: [],
          quarterly: [],
        },
      },
      orders: {
        total: 342,
        completed: 318,
        pending: 15,
        cancelled: 9,
        averageValue: 366.75,
        frequency: 2.3,
        growth: 8.7,
        forecast: 395,
        breakdown: {
          hourly: [],
          daily: [],
          weekly: [],
          monthly: [],
        },
        conversionFunnel: {
          visits: 10650,
          productViews: 3220,
          cartAdditions: 890,
          checkoutStarted: 520,
          ordersCompleted: 342,
          conversionRate: 3.2,
        },
      },
      conversion: {
        overall: 3.2,
        mobile: 2.8,
        desktop: 3.6,
        tablet: 2.9,
        bySource: {},
        byCategory: {},
        byPrice: {},
        trends: [],
      },
      averages: {
        orderValue: 366.75,
        itemsPerOrder: 2.3,
        customerLifetimeValue: 1250.00,
        timeToFirstPurchase: 5.2,
        repeatPurchaseRate: 35.8,
        customerAcquisitionCost: 45.30,
      },
      growth: {
        revenue: { current: 15.2, previous: 12.8, trend: 'up' },
        orders: { current: 8.7, previous: 6.1, trend: 'up' },
        customers: { current: 12.3, previous: 9.5, trend: 'up' },
        aov: { current: 5.8, previous: 4.2, trend: 'up' },
      },
      geographic: {
        countries: {},
        regions: {},
        cities: {},
        topMarkets: [],
      },
      seasonal: {
        quarters: [],
        months: [],
        holidays: [],
        trends: [],
      },
      channels: {
        direct: 45.2,
        organic: 28.7,
        paid: 15.3,
        social: 8.9,
        email: 1.9,
      },
      cohorts: {
        retention: [],
        revenue: [],
        frequency: [],
      },
      funnel: {
        awareness: 100,
        interest: 45,
        consideration: 28,
        purchase: 15,
        retention: 35,
        advocacy: 12,
      },
    },
    products: {
      bestsellers: [],
      slowMovers: [],
      trending: [],
      categories: [],
      brands: [],
      variants: [],
      profitability: [],
      lifecycle: [],
      recommendations: {
        crossSell: [],
        upSell: [],
        related: [],
        trending: [],
        personalized: [],
      },
      inventory: {
        totalValue: 456780.50,
        lowStock: 12,
        outOfStock: 3,
        turnoverRate: 4.2,
        daysOnHand: 87,
        deadStock: 8,
        fastMovers: [],
        slowMovers: [],
      },
    },
    customers: {
      acquisition: {
        total: 189,
        new: 45,
        returning: 144,
        sources: {},
        cost: 45.30,
        value: 1250.00,
        paybackPeriod: 2.8,
      },
      retention: {
        rate: 65.8,
        churnRate: 34.2,
        repeatPurchaseRate: 35.8,
        loyaltyRate: 15.2,
        cohorts: [],
      },
      lifetime: {
        value: 1250.00,
        revenue: 1180.50,
        profit: 425.30,
        duration: 18.5,
        frequency: 2.3,
        recency: 45,
      },
      segmentation: {
        byValue: {},
        byFrequency: {},
        byRecency: {},
        rfm: {},
        behavioral: {},
      },
      behavior: {
        averageSessionDuration: 5.2,
        pagesPerSession: 8.7,
        bounceRate: 35.8,
        topPages: [],
        searchTerms: [],
        categories: [],
      },
      satisfaction: {
        nps: 72,
        csat: 4.3,
        ces: 3.8,
        reviews: 4.2,
        complaints: 5,
        compliments: 45,
      },
      loyalty: {
        programMembers: 89,
        pointsIssued: 125000,
        pointsRedeemed: 45000,
        tierDistribution: {},
        engagement: 68.5,
      },
      churn: {
        rate: 34.2,
        predictors: [],
        riskSegments: {},
        preventionCampaigns: [],
      },
      demographics: {
        age: {},
        gender: {},
        location: {},
        income: {},
        interests: {},
      },
      journey: {
        touchpoints: [],
        stages: {},
        dropoffs: [],
        optimizations: [],
      },
    },
    marketing: {
      campaigns: [],
      channels: {},
      attribution: {},
      roi: {},
      spending: {},
      effectiveness: {},
    },
    inventory: {
      overview: {
        totalValue: 456780.50,
        totalUnits: 3450,
        lowStockItems: 12,
        outOfStockItems: 3,
        turnoverRate: 4.2,
      },
      movements: [],
      forecasting: [],
      optimization: [],
    },
    vendors: {
      total: 15,
      active: 12,
      performance: [],
      commissions: 15430.50,
      topVendors: [],
    },
    marketplace: {
      integrations: 5,
      activePlatforms: 3,
      totalListings: 156,
      syncStatus: 'synced',
      performance: [],
    },
    financial: {
      revenue: 125430.50,
      costs: 89201.35,
      profit: 36229.15,
      margin: 28.9,
      cashFlow: 15430.50,
      taxes: 10329.50,
      fees: 2850.00,
    },
    operational: {
      orderProcessingTime: 2.3,
      fulfillmentTime: 1.8,
      shippingTime: 4.2,
      returnProcessingTime: 3.5,
      customerServiceResponse: 0.8,
    },
    forecasting: {
      revenue: [],
      orders: [],
      customers: [],
      inventory: [],
      trends: [],
    },
    trends: {
      seasonal: [],
      category: [],
      geographic: [],
      demographic: [],
    },
    insights: {
      opportunities: [],
      risks: [],
      recommendations: [],
      alerts: [],
    },
    period: {
      start: dateRange.start,
      end: dateRange.end,
      preset: 'last_30_days',
    },
    lastUpdated: new Date(),
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleNavigate = (section: string) => {
    setActiveTab(section);
    onNavigate(section);
  };

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderOverviewStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${mockAnalytics.overview.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +{mockAnalytics.overview.growthMetrics.revenueGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockAnalytics.overview.totalOrders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +{mockAnalytics.overview.growthMetrics.orderGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockAnalytics.overview.totalCustomers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +{mockAnalytics.overview.growthMetrics.customerGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${mockAnalytics.overview.averageOrderValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            +5.8% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuickActions = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleNavigate('products')}
          >
            <Plus className="h-6 w-6" />
            <span>Add Product</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleNavigate('orders')}
          >
            <FileText className="h-6 w-6" />
            <span>View Orders</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleNavigate('customers')}
          >
            <Users className="h-6 w-6" />
            <span>Customers</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleNavigate('analytics')}
          >
            <BarChart3 className="h-6 w-6" />
            <span>Analytics</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentOrders = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleNavigate('orders')}>
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.billing.address.firstName} {order.billing.address.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant={order.status === 'completed' ? "default" : order.status === 'processing' ? "secondary" : "destructive"}>
                  {order.status}
                </Badge>
                <span className="font-medium">${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderTopProducts = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top Products</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleNavigate('products')}>
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockProducts.slice(0, 5).map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">${product.pricing.basePrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{product.inventory.available} in stock</p>
                </div>
                <Badge variant={product.inventory.available > product.inventory.lowStockThreshold ? "default" : "destructive"}>
                  {product.inventory.available > product.inventory.lowStockThreshold ? "In Stock" : "Low Stock"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderInventoryAlerts = () => {
    const lowStockCount = mockAnalytics.inventory.overview.lowStockItems;
    const outOfStockCount = mockAnalytics.inventory.overview.outOfStockItems;

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockCount > 0 && (
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">{lowStockCount} products low in stock</p>
                  <p className="text-sm text-yellow-600">Consider reordering soon</p>
                </div>
              </div>
            )}
            {outOfStockCount > 0 && (
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">{outOfStockCount} products out of stock</p>
                  <p className="text-sm text-red-600">Reorder immediately</p>
                </div>
              </div>
            )}
            {lowStockCount === 0 && outOfStockCount === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSalesChart = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">${mockAnalytics.sales.revenue.total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth</p>
              <p className="text-2xl font-bold text-green-600">+{mockAnalytics.sales.growth.revenue.current}%</p>
            </div>
          </div>
          <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Sales chart would be displayed here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMarketplaceStatus = () => (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Amazon</span>
            <Badge variant="default">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">eBay</span>
            <Badge variant="default">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Etsy</span>
            <Badge variant="secondary">Pending</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Shopify</span>
            <Badge variant="outline">Not Connected</Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => handleNavigate('marketplace')}>
            <Globe className="h-4 w-4 mr-2" />
            Manage Integrations
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-Commerce Hub</h1>
          <p className="text-muted-foreground">
            Complete e-commerce management and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {cart && itemCount > 0 && (
            <Button variant="outline" size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {itemCount} items (${total.toFixed(2)})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {renderOverviewStats()}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {renderQuickActions()}
              {renderRecentOrders()}
              {renderTopProducts()}
            </div>
            <div className="space-y-6">
              {renderInventoryAlerts()}
              {renderSalesChart()}
              {renderMarketplaceStatus()}
            </div>
          </div>
        </TabsContent>

        {/* Other tabs content */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Product catalog and management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Order processing and fulfillment features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Customer relationship management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Inventory tracking and management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Third-party marketplace integrations will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>E-Commerce Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced e-commerce analytics and reporting will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EcommerceHub; 