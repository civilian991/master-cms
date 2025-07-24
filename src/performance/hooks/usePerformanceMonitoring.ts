'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PerformanceSnapshot,
  PerformanceMetric,
  ActiveAlert,
  OptimizationRecommendation,
  TimeRange,
  UsePerformanceMonitoringOptions,
  PerformanceCategory,
  MonitoringStatus,
} from '../types/performance.types';

import { performanceMonitor } from '../services/performanceMonitor';
import { cacheManager } from '../services/cacheManager';
import { bundleOptimizer } from '../services/bundleOptimizer';

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    metrics: requestedMetrics = [],
    thresholds = {},
    alertOnViolation = true,
    timeRange,
  } = options;

  // State
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsSubscriptionRef = useRef<(() => void) | null>(null);

  // Performance data collection
  const collectPerformanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current snapshot
      const currentSnapshot = performanceMonitor.getSnapshot();
      setSnapshot(currentSnapshot);

      // Get metrics
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics);

      // Filter metrics if specific ones are requested
      const filteredMetrics = requestedMetrics.length > 0
        ? currentMetrics.filter(m => requestedMetrics.includes(m.id))
        : currentMetrics;

      setMetrics(filteredMetrics);

      // Get active alerts
      const activeAlerts = await collectActiveAlerts(filteredMetrics);
      setAlerts(activeAlerts);

      // Get recommendations
      const currentRecommendations = currentSnapshot.recommendations || [];
      
      // Add cache recommendations
      const cacheRecommendations = cacheManager.getRecommendations();
      const cacheOptimizationRecommendations: OptimizationRecommendation[] = cacheRecommendations.map(rec => ({
        id: `cache_${Date.now()}_${Math.random()}`,
        priority: rec.priority as any,
        category: 'runtime' as PerformanceCategory,
        title: `Cache: ${rec.type}`,
        description: rec.description,
        estimatedImpact: rec.estimatedImpact,
        estimatedEffort: 'medium' as any,
        implementation: {
          type: 'configuration',
          steps: [rec.implementation],
        },
        metrics: [],
        status: 'pending',
      }));

      // Add bundle recommendations if available
      const bundleAnalysis = bundleOptimizer.getCurrentAnalysis();
      const bundleRecommendations: OptimizationRecommendation[] = bundleAnalysis?.recommendations.map(rec => ({
        id: `bundle_${Date.now()}_${Math.random()}`,
        priority: rec.impact > 30 ? 'high' : rec.impact > 15 ? 'medium' : 'low',
        category: 'rendering' as PerformanceCategory,
        title: `Bundle: ${rec.type}`,
        description: rec.description,
        estimatedImpact: rec.impact,
        estimatedEffort: rec.effort as any,
        implementation: {
          type: 'code',
          steps: [rec.implementation],
        },
        metrics: [],
        status: 'pending',
      })) || [];

      setRecommendations([
        ...currentRecommendations,
        ...cacheOptimizationRecommendations,
        ...bundleRecommendations,
      ]);

      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to collect performance data';
      setError(errorMessage);
      console.error('Performance monitoring error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [requestedMetrics]);

  // Collect active alerts based on metrics and thresholds
  const collectActiveAlerts = useCallback(async (currentMetrics: PerformanceMetric[]): Promise<ActiveAlert[]> => {
    const activeAlerts: ActiveAlert[] = [];

    currentMetrics.forEach(metric => {
      const threshold = thresholds[metric.id] || metric.threshold;
      if (!threshold) return;

      const { warning, critical, operator } = threshold;
      const value = metric.value;
      let severity: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | null = null;

      switch (operator) {
        case 'gt':
          if (value > critical) severity = 'critical';
          else if (value > warning) severity = 'warning';
          break;
        case 'lt':
          if (value < critical) severity = 'critical';
          else if (value < warning) severity = 'warning';
          break;
        case 'gte':
          if (value >= critical) severity = 'critical';
          else if (value >= warning) severity = 'warning';
          break;
        case 'lte':
          if (value <= critical) severity = 'critical';
          else if (value <= warning) severity = 'warning';
          break;
      }

      if (severity && alertOnViolation) {
        activeAlerts.push({
          id: `alert_${metric.id}_${Date.now()}`,
          severity,
          status: 'firing',
          message: `${metric.name} threshold violation`,
          metric: metric.name,
          value: metric.value,
          threshold: severity === 'critical' ? critical : warning,
          startTime: new Date(),
        });
      }
    });

    return activeAlerts;
  }, [thresholds, alertOnViolation]);

  // Subscribe to real-time metric updates
  const subscribeToMetrics = useCallback(() => {
    if (metricsSubscriptionRef.current) {
      metricsSubscriptionRef.current();
    }

    metricsSubscriptionRef.current = performanceMonitor.onMetric((metric: PerformanceMetric) => {
      setMetrics(prev => {
        const filtered = prev.filter(m => m.id !== metric.id);
        return [...filtered, metric];
      });

      // Check for threshold violations
      if (alertOnViolation && metric.threshold) {
        const { warning, critical, operator } = metric.threshold;
        const value = metric.value;
        let violation = false;

        switch (operator) {
          case 'gt':
            violation = value > warning;
            break;
          case 'lt':
            violation = value < warning;
            break;
          case 'gte':
            violation = value >= warning;
            break;
          case 'lte':
            violation = value <= warning;
            break;
        }

        if (violation) {
          const severity = (() => {
            switch (operator) {
              case 'gt':
                return value > critical ? 'critical' : 'warning';
              case 'lt':
                return value < critical ? 'critical' : 'warning';
              case 'gte':
                return value >= critical ? 'critical' : 'warning';
              case 'lte':
                return value <= critical ? 'critical' : 'warning';
              default:
                return 'warning';
            }
          })() as 'warning' | 'critical';

          const alert: ActiveAlert = {
            id: `alert_${metric.id}_${Date.now()}`,
            severity,
            status: 'firing',
            message: `${metric.name} threshold violation`,
            metric: metric.name,
            value: metric.value,
            threshold: severity === 'critical' ? critical : warning,
            startTime: new Date(),
          };

          setAlerts(prev => {
            // Remove existing alert for this metric
            const filtered = prev.filter(a => !a.id.includes(metric.id));
            return [...filtered, alert];
          });
        }
      }
    });
  }, [alertOnViolation]);

  // Start/stop auto-refresh
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(collectPerformanceData, refreshInterval);
    }
  }, [autoRefresh, refreshInterval, collectPerformanceData]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    collectPerformanceData();
  }, [collectPerformanceData]);

  // Get metrics by category
  const getMetricsByCategory = useCallback((category: PerformanceCategory): PerformanceMetric[] => {
    return metrics.filter(metric => metric.category === category);
  }, [metrics]);

  // Get metrics by type
  const getMetricsByType = useCallback((type: string): PerformanceMetric[] => {
    return metrics.filter(metric => metric.type === type);
  }, [metrics]);

  // Get metric by ID
  const getMetric = useCallback((id: string): PerformanceMetric | undefined => {
    return metrics.find(metric => metric.id === id);
  }, [metrics]);

  // Calculate Web Vitals score
  const getWebVitalsScore = useCallback((): number => {
    const webVitalsMetrics = getMetricsByCategory('core_web_vitals');
    if (webVitalsMetrics.length === 0) return 0;

    const lcpMetric = webVitalsMetrics.find(m => m.id === 'web_vitals_lcp');
    const fidMetric = webVitalsMetrics.find(m => m.id === 'web_vitals_fid');
    const clsMetric = webVitalsMetrics.find(m => m.id === 'web_vitals_cls');

    let score = 0;
    let count = 0;

    if (lcpMetric) {
      // LCP: Good < 2.5s, Needs Improvement < 4s
      const lcpScore = lcpMetric.value <= 2500 ? 100 : lcpMetric.value <= 4000 ? 75 : 25;
      score += lcpScore;
      count++;
    }

    if (fidMetric) {
      // FID: Good < 100ms, Needs Improvement < 300ms
      const fidScore = fidMetric.value <= 100 ? 100 : fidMetric.value <= 300 ? 75 : 25;
      score += fidScore;
      count++;
    }

    if (clsMetric) {
      // CLS: Good < 0.1, Needs Improvement < 0.25
      const clsScore = clsMetric.value <= 0.1 ? 100 : clsMetric.value <= 0.25 ? 75 : 25;
      score += clsScore;
      count++;
    }

    return count > 0 ? Math.round(score / count) : 0;
  }, [getMetricsByCategory]);

  // Get overall system status
  const getSystemStatus = useCallback((): MonitoringStatus => {
    if (!snapshot) return 'healthy';
    return snapshot.status;
  }, [snapshot]);

  // Get performance trends
  const getTrends = useCallback((metricId: string, duration: number = 3600000): number[] => {
    // This would typically fetch historical data from a time-series database
    // For now, return mock trend data
    const trends: number[] = [];
    const metric = getMetric(metricId);
    
    if (metric) {
      const baseValue = metric.value;
      for (let i = 0; i < 24; i++) {
        // Generate some variation around the base value
        const variation = (Math.random() - 0.5) * 0.2; // ±10%
        trends.push(baseValue * (1 + variation));
      }
    }

    return trends;
  }, [getMetric]);

  // Clear alerts
  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Apply recommendation
  const applyRecommendation = useCallback(async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    try {
      // Mark as in progress
      setRecommendations(prev => 
        prev.map(r => 
          r.id === recommendationId 
            ? { ...r, status: 'in_progress' }
            : r
        )
      );

      // Apply the recommendation based on its type
      if (recommendation.id.startsWith('cache_')) {
        await cacheManager.optimize();
      } else if (recommendation.id.startsWith('bundle_')) {
        await bundleOptimizer.optimizeAll('basic');
      }

      // Mark as completed
      setRecommendations(prev => 
        prev.map(r => 
          r.id === recommendationId 
            ? { ...r, status: 'completed' }
            : r
        )
      );

      // Refresh data to see improvements
      await collectPerformanceData();
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      // Mark as pending again
      setRecommendations(prev => 
        prev.map(r => 
          r.id === recommendationId 
            ? { ...r, status: 'pending' }
            : r
        )
      );
    }
  }, [recommendations, collectPerformanceData]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback((recommendationId: string) => {
    setRecommendations(prev => 
      prev.map(r => 
        r.id === recommendationId 
          ? { ...r, status: 'dismissed' }
          : r
      )
    );
  }, []);

  // Export data
  const exportData = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      snapshot,
      metrics,
      alerts,
      recommendations,
      timeRange,
      config: options,
    };
  }, [snapshot, metrics, alerts, recommendations, timeRange, options]);

  // Effects
  useEffect(() => {
    // Initial data collection
    collectPerformanceData();

    // Subscribe to real-time updates
    subscribeToMetrics();

    // Start auto-refresh
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
      if (metricsSubscriptionRef.current) {
        metricsSubscriptionRef.current();
      }
    };
  }, [collectPerformanceData, subscribeToMetrics, startAutoRefresh, stopAutoRefresh]);

  // Update auto-refresh when settings change
  useEffect(() => {
    startAutoRefresh();
  }, [autoRefresh, refreshInterval, startAutoRefresh]);

  // Listen for performance events
  useEffect(() => {
    const handlePerformanceAlert = (event: CustomEvent) => {
      const { metric, severity } = event.detail;
      
      const alert: ActiveAlert = {
        id: `perf_alert_${Date.now()}`,
        severity,
        status: 'firing',
        message: `Performance threshold exceeded: ${metric.name}`,
        metric: metric.name,
        value: metric.value,
        threshold: metric.threshold?.critical || metric.threshold?.warning || 0,
        startTime: new Date(),
      };

      setAlerts(prev => [...prev, alert]);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('performance-alert', handlePerformanceAlert as EventListener);

      return () => {
        window.removeEventListener('performance-alert', handlePerformanceAlert as EventListener);
      };
    }
  }, []);

  return {
    // Data
    snapshot,
    metrics,
    alerts,
    recommendations,
    lastUpdated,

    // Status
    isLoading,
    error,

    // Actions
    refresh,
    clearAlert,
    clearAllAlerts,
    applyRecommendation,
    dismissRecommendation,

    // Utilities
    getMetricsByCategory,
    getMetricsByType,
    getMetric,
    getWebVitalsScore,
    getSystemStatus,
    getTrends,
    exportData,

    // Controls
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default usePerformanceMonitoring; 