'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  BarChart3,
  Settings,
  UserCheck,
  UserX,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Subscription {
  id: string;
  planType: string;
  status: string;
  currency: string;
  amount: number;
  billingCycle: string;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  site: {
    id: string;
    name: string;
  };
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  gateway: string;
  transactionId?: string;
  createdAt: string;
}

interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  subscriptionGrowth: number;
  topPlans: Array<{
    planType: string;
    count: number;
    revenue: number;
  }>;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  planType: string;
  pricing: {
    USD: number;
    EUR: number;
    AED: number;
    GBP: number;
    CAD: number;
  };
  features: string[];
}

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [pricing, setPricing] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('default-site-id');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  useEffect(() => {
    fetchSubscriptionData();
  }, [selectedSiteId]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch all subscription data
      const [subscriptionsRes, paymentsRes, analyticsRes, pricingRes] = await Promise.all([
        fetch(`/api/admin/subscriptions?siteId=${selectedSiteId}`),
        fetch(`/api/admin/payments?siteId=${selectedSiteId}`),
        fetch(`/api/admin/subscriptions/analytics?siteId=${selectedSiteId}`),
        fetch(`/api/admin/subscriptions/pricing?siteId=${selectedSiteId}`),
      ]);

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setSubscriptions(subscriptionsData.subscriptions || []);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricing(pricingData.pricing || []);
      }
    } catch (err) {
      setError('Failed to fetch subscription data');
      console.error('Subscription data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">Expired</Badge>;
      case 'PAST_DUE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case 'TRIAL':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trial</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    const planColors: Record<string, string> = {
      'FREE': 'bg-gray-100 text-gray-800',
      'BASIC': 'bg-blue-100 text-blue-800',
      'PREMIUM': 'bg-purple-100 text-purple-800',
      'ENTERPRISE': 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge variant="secondary" className={planColors[planType] || 'bg-gray-100 text-gray-800'}>
        {planType}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline">Refunded</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage subscriptions, payments, and billing across all sites
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchSubscriptionData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.totalSubscriptions)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeSubscriptions} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.monthlyRevenue, selectedCurrency)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(analytics.averageRevenuePerUser, selectedCurrency)} per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(analytics.churnRate)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.subscriptionGrowth > 0 ? '+' : ''}{formatPercentage(analytics.subscriptionGrowth)} growth
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95.2%</div>
              <p className="text-xs text-muted-foreground">
                Payment success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Manage user subscriptions and billing cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{subscription.user.name}</div>
                        <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPlanBadge(subscription.planType)}
                        {getStatusBadge(subscription.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(subscription.amount, subscription.currency)}</div>
                      <div className="text-sm text-muted-foreground">{subscription.billingCycle}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Track payment transactions and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                        <div className="text-sm text-muted-foreground">{payment.paymentMethod}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPaymentStatusBadge(payment.status)}
                        <Badge variant="outline">{payment.gateway}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{formatDate(payment.createdAt)}</div>
                      {payment.transactionId && (
                        <div className="text-xs text-muted-foreground">{payment.transactionId}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>
                Site-specific subscription plans and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricing.map((plan) => (
                  <Card key={plan.id} className="relative">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        {getPlanBadge(plan.planType)}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-4">
                        {formatCurrency(plan.pricing[selectedCurrency as keyof typeof plan.pricing], selectedCurrency)}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full">Select Plan</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>
                Detailed analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="space-y-6">
                  {/* Top Plans */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top Plans by Revenue</h3>
                    <div className="space-y-2">
                      {analytics.topPlans.map((plan) => (
                        <div key={plan.planType} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getPlanBadge(plan.planType)}
                            <span className="font-medium">{plan.count} subscribers</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(plan.revenue, selectedCurrency)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(plan.revenue / plan.count, selectedCurrency)} avg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growth Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Subscription Growth</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold flex items-center">
                          {analytics.subscriptionGrowth > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          {formatPercentage(Math.abs(analytics.subscriptionGrowth))}
                        </div>
                        <p className="text-xs text-muted-foreground">vs last month</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Churn Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatPercentage(analytics.churnRate)}</div>
                        <p className="text-xs text-muted-foreground">monthly churn</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 