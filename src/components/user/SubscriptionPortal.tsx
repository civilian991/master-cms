'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Edit, 
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Settings,
  History,
  FileText,
  Shield,
  Zap
} from 'lucide-react';

interface UserSubscription {
  id: string;
  planType: string;
  status: string;
  currency: string;
  amount: number;
  billingCycle: string;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  site: {
    id: string;
    name: string;
    domain: string;
  };
  payments: UserPayment[];
}

interface UserPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  gateway: string;
  transactionId?: string;
  createdAt: string;
}

interface BillingInfo {
  subscriptionId: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
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

export default function SubscriptionPortal() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [upgradingSubscription, setUpgradingSubscription] = useState<string | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserSubscriptionData();
    }
  }, [session]);

  const fetchUserSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's subscriptions across all sites
      const subscriptionsRes = await fetch('/api/user/subscriptions');
      if (subscriptionsRes.ok) {
        const data = await subscriptionsRes.json();
        setSubscriptions(data.subscriptions || []);
      }

      // Fetch billing info for each subscription
      const billingPromises = subscriptions.map(sub => 
        fetch(`/api/user/subscriptions/${sub.id}/billing`)
      );
      const billingResponses = await Promise.all(billingPromises);
      const billingData = await Promise.all(
        billingResponses.map(res => res.json())
      );
      setBillingInfo(billingData.map(data => data.billingInfo).filter(Boolean));

      // Fetch available plans for the first site (or allow user to select)
      if (subscriptions.length > 0) {
        const plansRes = await fetch(`/api/admin/subscriptions/pricing?siteId=${subscriptions[0].site.id}`);
        if (plansRes.ok) {
          const data = await plansRes.json();
          setAvailablePlans(data.pricing || []);
        }
      }
    } catch (err) {
      setError('Failed to fetch subscription data');
      console.error('Subscription data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSubscription = async (subscriptionId: string, newPlanType: string) => {
    try {
      setUpgradingSubscription(subscriptionId);
      
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}/upgrade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: newPlanType,
        }),
      });

      if (response.ok) {
        await fetchUserSubscriptionData();
      } else {
        throw new Error('Failed to upgrade subscription');
      }
    } catch (err) {
      setError('Failed to upgrade subscription');
      console.error('Upgrade error:', err);
    } finally {
      setUpgradingSubscription(null);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, reason?: string) => {
    try {
      setCancellingSubscription(subscriptionId);
      
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await fetchUserSubscriptionData();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Cancellation error:', err);
    } finally {
      setCancellingSubscription(null);
    }
  };

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/user/payments/${paymentId}/invoice`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to download invoice:', err);
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
        <span className="ml-2">Loading your subscriptions...</span>
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
          <h1 className="text-3xl font-bold">My Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and billing information
          </p>
        </div>
        <Button variant="outline" onClick={fetchUserSubscriptionData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any active subscriptions yet. Browse our plans to get started.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Browse Plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{subscription.site.name}</span>
                        {getPlanBadge(subscription.planType)}
                        {getStatusBadge(subscription.status)}
                      </CardTitle>
                      <CardDescription>
                        {subscription.site.domain}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(subscription.amount, subscription.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per {subscription.billingCycle.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Started</div>
                      <div>{formatDate(subscription.startDate)}</div>
                    </div>
                    {subscription.endDate && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Ends</div>
                        <div>{formatDate(subscription.endDate)}</div>
                      </div>
                    )}
                    {subscription.trialEndDate && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Trial Ends</div>
                        <div>{formatDate(subscription.trialEndDate)}</div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      {subscription.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelSubscription(subscription.id)}
                          disabled={cancellingSubscription === subscription.id}
                        >
                          {cancellingSubscription === subscription.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Your upcoming bills and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingInfo.length > 0 ? (
                  <div className="space-y-4">
                    {billingInfo.map((billing) => (
                      <div key={billing.subscriptionId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            Next Billing: {formatDate(billing.nextBillingDate)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {billing.paymentMethod || 'No payment method saved'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(billing.amount, billing.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {billing.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No upcoming bills</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All your payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.some(sub => sub.payments.length > 0) ? (
                  <div className="space-y-4">
                    {subscriptions.flatMap(subscription =>
                      subscription.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(payment.amount, payment.currency)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {subscription.site.name} - {payment.paymentMethod}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-sm">{formatDate(payment.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">{payment.gateway}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(payment.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payment history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Payment Methods</div>
                        <div className="text-sm text-muted-foreground">
                          Manage your saved payment methods
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Security</div>
                        <div className="text-sm text-muted-foreground">
                          Update your password and security settings
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Notifications</div>
                        <div className="text-sm text-muted-foreground">
                          Manage billing and subscription notifications
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 