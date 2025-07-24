'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  User, 
  Activity, 
  Key,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

export default function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState([
    { id: 1, type: 'Login Success', user: 'admin@example.com', time: '2 minutes ago', ip: '192.168.1.1', status: 'success' },
    { id: 2, type: 'Failed Login', user: 'unknown@domain.com', time: '15 minutes ago', ip: '45.123.45.67', status: 'warning' },
    { id: 3, type: 'Password Change', user: 'editor@example.com', time: '1 hour ago', ip: '192.168.1.5', status: 'success' },
    { id: 4, type: 'Admin Access', user: 'admin@example.com', time: '2 hours ago', ip: '192.168.1.1', status: 'info' },
    { id: 5, type: 'Multiple Login Attempts', user: 'test@hacker.com', time: '3 hours ago', ip: '123.45.67.89', status: 'danger' }
  ])

  const securityStats = [
    { title: 'Active Sessions', value: '24', icon: Activity, status: 'normal' },
    { title: 'Failed Logins (24h)', value: '12', icon: AlertTriangle, status: 'warning' },
    { title: 'Protected Endpoints', value: '156', icon: Lock, status: 'normal' },
    { title: '2FA Enabled Users', value: '89%', icon: Key, status: 'good' }
  ]

  const threats = [
    { type: 'Brute Force Attack', severity: 'High', blocked: true, attempts: 45, source: '123.45.67.89' },
    { type: 'SQL Injection Attempt', severity: 'Critical', blocked: true, attempts: 3, source: '98.76.54.32' },
    { type: 'XSS Attempt', severity: 'Medium', blocked: true, attempts: 8, source: '45.123.45.67' },
    { type: 'Suspicious File Upload', severity: 'High', blocked: true, attempts: 2, source: '192.168.100.50' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor security events, threats, and system protection status
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Logs
          </Button>
          <Button size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Real-time Monitor
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {securityStats.map((stat, index) => {
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
                <Badge 
                  variant={stat.status === 'good' ? 'default' : stat.status === 'warning' ? 'secondary' : 'outline'}
                  className="text-xs mt-2"
                >
                  {stat.status === 'good' ? 'Excellent' : stat.status === 'warning' ? 'Needs Attention' : 'Normal'}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Security Events
            </CardTitle>
            <CardDescription>
              Latest security-related activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {event.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : event.status === 'danger' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : event.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.user} • {event.ip}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Threat Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Threat Detection
            </CardTitle>
            <CardDescription>
              Blocked threats and suspicious activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threats.map((threat, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {threat.type}
                    </span>
                    <Badge 
                      variant={
                        threat.severity === 'Critical' ? 'destructive' :
                        threat.severity === 'High' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {threat.severity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Source: {threat.source}</div>
                    <div>Attempts: {threat.attempts}</div>
                  </div>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Blocked</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Configuration</CardTitle>
          <CardDescription>
            Current security settings and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enabled for Admins</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User Adoption Rate</span>
                <Badge variant="outline">89%</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Access Control</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role-based Access</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">IP Restrictions</span>
                <Badge variant="outline">Configured</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">System Security</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SSL/TLS</span>
                <Badge variant="default">Enforced</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CSRF Protection</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 