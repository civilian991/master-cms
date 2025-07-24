'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';
import { MetricCardProps } from '../types/analytics.types';

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  trend = 'neutral',
  trendValue,
  icon,
  loading = false,
  error,
  onClick,
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val.toString();
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const calculatePercentageChange = (): string => {
    if (trendValue !== undefined) {
      return `${trendValue.toFixed(1)}%`;
    }

    if (previousValue && typeof value === 'number' && typeof previousValue === 'number') {
      const change = ((value - previousValue) / previousValue) * 100;
      return `${Math.abs(change).toFixed(1)}%`;
    }

    return '0%';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </span>
          {unit && (
            <span className="ml-1 text-sm text-gray-500">{unit}</span>
          )}
        </div>
      </div>

      {/* Trend Information */}
      {(previousValue !== undefined || trendValue !== undefined) && (
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {calculatePercentageChange()}
          </span>
          <span className="text-sm text-gray-500">
            {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'no change'}
          </span>
        </div>
      )}

      {/* Previous Period Comparison */}
      {previousValue !== undefined && (
        <div className="mt-2 text-xs text-gray-500">
          Previous: {formatValue(previousValue)}{unit}
        </div>
      )}
    </div>
  );
};

// Preset metric cards for common use cases
export const ActiveUsersCard: React.FC<{
  current: number;
  previous?: number;
  loading?: boolean;
  onClick?: () => void;
}> = ({ current, previous, loading, onClick }) => (
  <MetricCard
    title="Active Users"
    value={current}
    previousValue={previous}
    trend={previous ? (current > previous ? 'up' : current < previous ? 'down' : 'neutral') : 'neutral'}
    icon={<TrendingUp className="h-5 w-5" />}
    loading={loading}
    onClick={onClick}
  />
);

export const PageViewsCard: React.FC<{
  current: number;
  previous?: number;
  loading?: boolean;
  onClick?: () => void;
}> = ({ current, previous, loading, onClick }) => (
  <MetricCard
    title="Page Views"
    value={current}
    previousValue={previous}
    trend={previous ? (current > previous ? 'up' : current < previous ? 'down' : 'neutral') : 'neutral'}
    loading={loading}
    onClick={onClick}
  />
);

export const SessionDurationCard: React.FC<{
  current: number; // in seconds
  previous?: number;
  loading?: boolean;
  onClick?: () => void;
}> = ({ current, previous, loading, onClick }) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <MetricCard
      title="Avg. Session Duration"
      value={formatDuration(current)}
      previousValue={previous ? formatDuration(previous) : undefined}
      trend={previous ? (current > previous ? 'up' : current < previous ? 'down' : 'neutral') : 'neutral'}
      loading={loading}
      onClick={onClick}
    />
  );
};

export const BounceRateCard: React.FC<{
  current: number; // as decimal (0.45 = 45%)
  previous?: number;
  loading?: boolean;
  onClick?: () => void;
}> = ({ current, previous, loading, onClick }) => (
  <MetricCard
    title="Bounce Rate"
    value={`${(current * 100).toFixed(1)}%`}
    previousValue={previous ? `${(previous * 100).toFixed(1)}%` : undefined}
    trend={previous ? (current < previous ? 'up' : current > previous ? 'down' : 'neutral') : 'neutral'} // Lower bounce rate is better
    loading={loading}
    onClick={onClick}
  />
);

export const ConversionRateCard: React.FC<{
  current: number; // as decimal (0.045 = 4.5%)
  previous?: number;
  loading?: boolean;
  onClick?: () => void;
}> = ({ current, previous, loading, onClick }) => (
  <MetricCard
    title="Conversion Rate"
    value={`${(current * 100).toFixed(2)}%`}
    previousValue={previous ? `${(previous * 100).toFixed(2)}%` : undefined}
    trend={previous ? (current > previous ? 'up' : current < previous ? 'down' : 'neutral') : 'neutral'}
    loading={loading}
    onClick={onClick}
  />
);

// Grid layout component for multiple metric cards
export const MetricCardGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {children}
  </div>
);

export default MetricCard; 