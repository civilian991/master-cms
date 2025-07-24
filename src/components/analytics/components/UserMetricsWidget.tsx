'use client';

import React from 'react';
import { Users, Activity, Clock, TrendingUp } from 'lucide-react';
import { UserMetricsWidgetProps } from '../types/analytics.types';
import { useUserMetrics } from '../hooks/useAnalyticsData';
import { 
  ActiveUsersCard, 
  SessionDurationCard, 
  BounceRateCard, 
  ConversionRateCard 
} from './MetricCard';

export const UserMetricsWidget: React.FC<UserMetricsWidgetProps> = ({
  siteId,
  timeRange,
  refreshInterval = 0,
  onDataUpdate,
}) => {
  const filters = { siteId, timeRange };
  
  const { data: userMetrics, loading, error } = useUserMetrics(filters, {
    autoRefresh: refreshInterval > 0,
    refreshInterval,
    onDataUpdate,
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">Error Loading User Metrics</div>
          <p className="text-red-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!userMetrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          No user metrics data available
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <ActiveUsersCard
        current={userMetrics.activeUsers}
        previous={userMetrics.previousPeriod.activeUsers}
        loading={loading}
        onClick={() => {
          // Could navigate to detailed user analytics
          console.log('Navigate to detailed user analytics');
        }}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">New Users</h3>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {userMetrics.newUsers.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className={`h-4 w-4 ${
            userMetrics.newUsers > (userMetrics.previousPeriod.totalUsers - userMetrics.previousPeriod.activeUsers)
              ? 'text-green-500' 
              : 'text-red-500'
          }`} />
          <span className={`text-sm font-medium ${
            userMetrics.newUsers > (userMetrics.previousPeriod.totalUsers - userMetrics.previousPeriod.activeUsers)
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {userMetrics.newUsers > (userMetrics.previousPeriod.totalUsers - userMetrics.previousPeriod.activeUsers)
              ? 'increase' 
              : 'decrease'}
          </span>
        </div>
      </div>

      <SessionDurationCard
        current={userMetrics.sessionDuration}
        previous={userMetrics.previousPeriod.sessionDuration}
        loading={loading}
        onClick={() => {
          console.log('Navigate to session analytics');
        }}
      />

      <BounceRateCard
        current={userMetrics.bounceRate}
        previous={userMetrics.previousPeriod.bounceRate}
        loading={loading}
        onClick={() => {
          console.log('Navigate to bounce rate analytics');
        }}
      />

      {/* Additional metrics row */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Returning Users</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {userMetrics.returningUsers.toLocaleString()}
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          {((userMetrics.returningUsers / userMetrics.totalUsers) * 100).toFixed(1)}% of total users
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Engagement Rate</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {(userMetrics.engagementRate * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm text-gray-500">High engagement</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Top Channel</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {userMetrics.acquisitionChannels.length > 0 
              ? userMetrics.acquisitionChannels[0].channel 
              : 'N/A'}
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          {userMetrics.acquisitionChannels.length > 0 
            ? `${userMetrics.acquisitionChannels[0].percentage.toFixed(1)}% of traffic`
            : 'No data available'}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Total Users</h3>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {userMetrics.totalUsers.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className={`h-4 w-4 ${
            userMetrics.totalUsers > userMetrics.previousPeriod.totalUsers
              ? 'text-green-500' 
              : 'text-red-500'
          }`} />
          <span className={`text-sm font-medium ${
            userMetrics.totalUsers > userMetrics.previousPeriod.totalUsers
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {(((userMetrics.totalUsers - userMetrics.previousPeriod.totalUsers) / userMetrics.previousPeriod.totalUsers) * 100).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">vs previous period</span>
        </div>
      </div>
    </div>
  );
};

export default UserMetricsWidget; 