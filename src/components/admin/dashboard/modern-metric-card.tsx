"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ModernMetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ComponentType<{ className?: string }>
  sparklineData?: number[]
  onClick?: () => void
  className?: string
}

const TrendIndicator: React.FC<{ value: number; trend: 'up' | 'down' | 'stable' }> = ({ 
  value, 
  trend 
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const colorClass = trend === 'up' 
    ? 'text-success-600' 
    : trend === 'down' 
    ? 'text-error-600' 
    : 'text-gray-500'
  
  return (
    <div className={cn("flex items-center gap-1", colorClass)}>
      <TrendIcon className="h-3 w-3" />
      <span className="text-sm font-medium">
        {trend !== 'stable' && (value > 0 ? '+' : '')}{value}%
      </span>
    </div>
  )
}

export const ModernMetricCard: React.FC<ModernMetricCardProps> = ({
  title,
  value,
  change,
  trend = 'stable',
  icon: Icon,
  onClick,
  className
}) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-0 p-6 transition-all duration-300 cursor-pointer",
        "bg-gradient-to-br from-white to-gray-50/50",
        "shadow-soft hover:shadow-medium hover:scale-105",
        "ring-1 ring-gray-200/50 hover:ring-gray-200",
        className
      )}
      onClick={onClick}
    >
      {/* Glassmorphism overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="relative z-10 p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-caption mb-2 truncate">{title}</p>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-display text-gray-900 font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {change !== undefined && (
                <TrendIndicator value={change} trend={trend} />
              )}
            </div>
            <p className="text-caption">vs last month</p>
          </div>
          
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
      
      {/* Subtle bottom accent */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />
    </Card>
  )
}

// Enhanced metric card with additional features
export const EnhancedMetricCard: React.FC<ModernMetricCardProps & {
  subtitle?: string
  badge?: string
  loading?: boolean
}> = ({ subtitle, badge, loading, ...props }) => {
  if (loading) {
    return (
      <Card className="p-6 border-0 shadow-soft">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-0 p-6 transition-all duration-300 cursor-pointer",
        "bg-gradient-to-br from-white via-white to-gray-50/30",
        "shadow-soft hover:shadow-elevated hover:scale-[1.02]",
        "ring-1 ring-gray-200/50 hover:ring-brand-200/50",
        props.className
      )}
      onClick={props.onClick}
    >
      {/* Enhanced glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
      
      <CardContent className="relative z-10 p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-caption truncate">{props.title}</p>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-display text-gray-900 font-bold">
                {typeof props.value === 'number' ? props.value.toLocaleString() : props.value}
              </span>
              {props.change !== undefined && (
                <TrendIndicator value={props.change} trend={props.trend || 'stable'} />
              )}
            </div>
            
            <div className="space-y-1">
              {subtitle && (
                <p className="text-caption text-gray-500">{subtitle}</p>
              )}
              <p className="text-caption">vs last month</p>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
            <props.icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
      
      {/* Enhanced accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-200/40 to-transparent" />
    </Card>
  )
} 