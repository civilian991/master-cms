'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Users, Globe } from 'lucide-react';
import { RealTimeVisitorWidgetProps } from '../types/analytics.types';
import { websocketService } from '../services/websocketService';

export const RealTimeVisitorWidget: React.FC<RealTimeVisitorWidgetProps> = ({
  siteId,
  autoRefresh,
  maxEvents = 50,
  onEventClick,
}) => {
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    if (autoRefresh) {
      websocketService.connect(siteId);
      
      const unsubscribeVisitor = websocketService.subscribe('visitor_update', (data) => {
        setActiveVisitors(data.activeVisitors || 0);
      });
      
      const unsubscribeConnection = websocketService.subscribeToConnection((status) => {
        setConnectionStatus(status);
      });

      return () => {
        unsubscribeVisitor();
        unsubscribeConnection();
        websocketService.disconnect();
      };
    }
  }, [siteId, autoRefresh]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Real-time Activity</h3>
        <div className={`flex items-center space-x-2 text-sm ${
          connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span>{connectionStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeVisitors}</div>
          <div className="text-sm text-gray-500">Active Visitors</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{recentEvents.length}</div>
          <div className="text-sm text-gray-500">Recent Events</div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
        {recentEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {autoRefresh ? 'Waiting for activity...' : 'Enable auto-refresh to see real-time activity'}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentEvents.slice(0, maxEvents).map((event, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => onEventClick?.(event)}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="flex-1 text-gray-600">User viewed a page</span>
                <span className="text-gray-400">now</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeVisitorWidget; 