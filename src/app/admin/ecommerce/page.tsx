'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Package, DollarSign, TrendingUp, Plus } from 'lucide-react'

export default function EcommerceManagement() {
  const ecommerceStats = [
    { title: 'Total Products', value: '247', icon: Package },
    { title: 'Monthly Revenue', value: '$12,450', icon: DollarSign },
    { title: 'Orders Today', value: '18', icon: ShoppingCart },
    { title: 'Conversion Rate', value: '3.2%', icon: TrendingUp }
  ]

  const recentOrders = [
    { id: '#1234', customer: 'John Doe', amount: '$89.99', status: 'completed' },
    { id: '#1235', customer: 'Jane Smith', amount: '$156.50', status: 'processing' },
    { id: '#1236', customer: 'Bob Johnson', amount: '$45.00', status: 'pending' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-8 w-8 mr-3 text-primary" />
            E-commerce Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage products, orders, and online store operations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ecommerceStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>E-commerce Tools</CardTitle>
            <CardDescription>Manage your online store features and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8 text-gray-500">
              E-commerce management interface coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 