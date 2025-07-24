'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Calendar,
  DollarSign,
  Check,
  X,
  ArrowRight,
  Download,
  AlertCircle,
  Crown,
  Star,
  Zap
} from 'lucide-react'

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  // Mock subscription data - would come from API
  const subscription = {
    plan: 'Pro',
    status: 'active',
    currentPeriodEnd: '2024-02-15',
    price: '$29',
    interval: 'month'
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      interval: 'month',
      description: 'Perfect for getting started',
      features: [
        '5 articles per month',
        'Basic search',
        'Email support',
        'Mobile app access'
      ],
      limitations: [
        'Limited downloads',
        'No premium content',
        'Ads displayed'
      ],
      icon: Star,
      color: 'text-gray-600',
      current: false
    },
    {
      name: 'Pro',
      price: '$29',
      interval: 'month',
      description: 'Everything you need for productivity',
      features: [
        'Unlimited articles',
        'Advanced search & filters',
        'Priority support',
        'Mobile app access',
        'Bookmark & save articles',
        'Export to PDF',
        'Dark mode'
      ],
      limitations: [],
      icon: Crown,
      color: 'text-blue-600',
      current: true,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      interval: 'month',
      description: 'Advanced features for teams',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated support',
        'SSO integration',
        'Admin dashboard'
      ],
      limitations: [],
      icon: Zap,
      color: 'text-purple-600',
      current: false
    }
  ]

  const invoices = [
    { id: '1', date: '2024-01-15', amount: '$29.00', status: 'paid', plan: 'Pro Monthly' },
    { id: '2', date: '2023-12-15', amount: '$29.00', status: 'paid', plan: 'Pro Monthly' },
    { id: '3', date: '2023-11-15', amount: '$29.00', status: 'paid', plan: 'Pro Monthly' },
  ]

  const handleUpgrade = async (planName: string) => {
    setIsLoading(true)
    try {
      // Mock upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Would redirect to Stripe checkout or similar
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Current Subscription</span>
              </CardTitle>
              <CardDescription>
                Your subscription details and usage
              </CardDescription>
            </div>
            <Badge 
              variant={subscription.status === 'active' ? 'default' : 'destructive'}
              className="capitalize"
            >
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Plan</span>
              </div>
              <p className="text-2xl font-bold">{subscription.plan}</p>
              <p className="text-sm text-gray-500">
                {subscription.price}/{subscription.interval}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Next Billing</span>
              </div>
              <p className="text-lg font-semibold">{subscription.currentPeriodEnd}</p>
              <p className="text-sm text-gray-500">Auto-renewal enabled</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Amount</span>
              </div>
              <p className="text-lg font-semibold">{subscription.price}</p>
              <p className="text-sm text-gray-500">Per {subscription.interval}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Need to make changes?</p>
                <p className="text-sm text-gray-500">Update your plan or payment method</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  Update Payment
                </Button>
                <Button variant="outline" size="sm">
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that works best for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-lg border p-6 ${
                    plan.current 
                      ? 'border-blue-500 bg-blue-50' 
                      : plan.popular 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600">Most Popular</Badge>
                    </div>
                  )}
                  
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600">Current Plan</Badge>
                    </div>
                  )}

                  <div className="text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-3 ${plan.color}`} />
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-500">/{plan.interval}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-center space-x-2">
                        <X className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    {plan.current ? (
                      <Button className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        variant={plan.name === 'Free' ? 'outline' : 'default'}
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={isLoading}
                      >
                        {plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{invoice.plan}</p>
                    <p className="text-sm text-gray-500">{invoice.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{invoice.amount}</p>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-green-50 text-green-700"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline">
              Load More Invoices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your subscription will automatically renew on {subscription.currentPeriodEnd}. 
          You can cancel anytime from your account settings.
        </AlertDescription>
      </Alert>
    </div>
  )
}