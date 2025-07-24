'use client';

import {
  DatabasePerformanceMetrics,
  ConnectionPoolMetrics,
  QueryPerformanceMetrics,
  SlowQueryMetrics,
  QueryExecutionMetrics,
  IndexUsageMetrics,
  IndexRecommendation,
  QueryExplanation,
  TransactionMetrics,
  StorageMetrics,
  SecurityRiskLevel,
} from '../types/performance.types';

class DatabaseOptimizerService {
  private metrics: DatabasePerformanceMetrics | null = null;
  private queryCache: Map<string, QueryExecutionMetrics> = new Map();
  private slowQueries: SlowQueryMetrics[] = [];
  private connectionPool: ConnectionPoolManager;
  private queryAnalyzer: QueryAnalyzer;
  private indexOptimizer: IndexOptimizer;
  private config: DatabaseOptimizerConfig;
  private isMonitoring = false;

  constructor(config?: Partial<DatabaseOptimizerConfig>) {
    this.config = {
      enableMonitoring: true,
      enableOptimization: true,
      slowQueryThreshold: 1000, // 1 second
      connectionPoolSize: 20,
      maxConnections: 100,
      queryTimeout: 30000, // 30 seconds
      indexMaintenanceInterval: 86400000, // 24 hours
      cacheQueryPlans: true,
      autoOptimizeIndexes: true,
      enableQueryAnalysis: true,
      ...config,
    };

    this.connectionPool = new ConnectionPoolManager(this.config);
    this.queryAnalyzer = new QueryAnalyzer(this.config);
    this.indexOptimizer = new IndexOptimizer(this.config);

    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
  }

  // ============================================================================
  // MONITORING LIFECYCLE
  // ============================================================================

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🚀 Database performance monitoring started');

    // Start periodic metrics collection
    this.startMetricsCollection();

    // Start connection pool monitoring
    this.connectionPool.startMonitoring();

    // Start query analysis
    if (this.config.enableQueryAnalysis) {
      this.queryAnalyzer.startAnalysis();
    }

    // Start index maintenance
    if (this.config.autoOptimizeIndexes) {
      this.startIndexMaintenance();
    }
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('⏹️ Database performance monitoring stopped');

    this.connectionPool.stopMonitoring();
    this.queryAnalyzer.stopAnalysis();
    this.stopIndexMaintenance();
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  private startMetricsCollection(): void {
    const collectMetrics = async () => {
      try {
        this.metrics = {
          connections: this.connectionPool.getMetrics(),
          queries: await this.queryAnalyzer.getMetrics(),
          transactions: await this.collectTransactionMetrics(),
          indexing: await this.indexOptimizer.getMetrics(),
          caching: await this.collectCacheMetrics(),
          replication: await this.collectReplicationMetrics(),
          storage: await this.collectStorageMetrics(),
        };

        // Analyze for issues
        await this.analyzePerformanceIssues();

      } catch (error) {
        console.error('Database metrics collection failed:', error);
      }
    };

    // Collect metrics every 30 seconds
    setInterval(collectMetrics, 30000);
    
    // Initial collection
    collectMetrics();
  }

  private async collectTransactionMetrics(): Promise<TransactionMetrics> {
    try {
      // This would typically query the database for transaction stats
      const response = await fetch('/api/database/metrics/transactions');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to collect transaction metrics:', error);
    }

    // Fallback metrics
    return {
      active: 0,
      committed: 0,
      aborted: 0,
      averageDuration: 0,
      deadlocks: 0,
      lockWaits: 0,
      rollbacks: 0,
    };
  }

  private async collectCacheMetrics(): Promise<any> {
    try {
      const response = await fetch('/api/database/metrics/cache');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to collect cache metrics:', error);
    }

    return {
      bufferPool: {
        size: 0,
        used: 0,
        hitRatio: 0,
        readRequests: 0,
        writeRequests: 0,
        flushes: 0,
      },
      queryCache: {
        hits: 0,
        misses: 0,
        evictions: 0,
        memoryUsage: 0,
      },
      resultCache: {
        entries: 0,
        hits: 0,
        misses: 0,
        evictions: 0,
        memoryUsage: 0,
      },
    };
  }

  private async collectReplicationMetrics(): Promise<any> {
    try {
      const response = await fetch('/api/database/metrics/replication');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to collect replication metrics:', error);
    }

    return {
      lag: 0,
      status: 'healthy',
      lastSync: new Date(),
      syncErrors: 0,
      throughput: 0,
    };
  }

  private async collectStorageMetrics(): Promise<StorageMetrics> {
    try {
      const response = await fetch('/api/database/metrics/storage');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to collect storage metrics:', error);
    }

    return {
      totalSize: 0,
      usedSize: 0,
      freeSize: 0,
      growth: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        projected: {
          nextMonth: 0,
          nextQuarter: 0,
          nextYear: 0,
          confidence: 0,
        },
      },
      io: {
        reads: 0,
        writes: 0,
        readLatency: 0,
        writeLatency: 0,
        throughput: 0,
        iops: 0,
      },
      fragmentation: 0,
    };
  }

  // ============================================================================
  // PERFORMANCE ANALYSIS
  // ============================================================================

  private async analyzePerformanceIssues(): void {
    if (!this.metrics) return;

    // Analyze connection pool issues
    this.analyzeConnectionIssues();

    // Analyze query performance
    await this.analyzeQueryPerformance();

    // Analyze index usage
    await this.analyzeIndexUsage();

    // Analyze storage issues
    this.analyzeStorageIssues();
  }

  private analyzeConnectionIssues(): void {
    if (!this.metrics) return;

    const { connections } = this.metrics;

    // Check for connection pool exhaustion
    if (connections.active / connections.maxConnections > 0.8) {
      console.warn('🚨 Connection pool is 80% utilized - consider increasing pool size');
    }

    // Check for connection leaks
    if (connections.leaks > 0) {
      console.error('🚨 Connection leaks detected:', connections.leaks);
    }

    // Check for timeouts
    if (connections.timeouts > 0) {
      console.warn('⚠️ Connection timeouts detected:', connections.timeouts);
    }
  }

  private async analyzeQueryPerformance(): Promise<void> {
    if (!this.metrics) return;

    const { queries } = this.metrics;

    // Analyze slow queries
    for (const slowQuery of queries.slowQueries) {
      if (slowQuery.executionTime > this.config.slowQueryThreshold * 2) {
        console.error('🐌 Critical slow query detected:', {
          query: slowQuery.query.substring(0, 100) + '...',
          time: slowQuery.executionTime,
          frequency: slowQuery.frequency,
        });

        // Analyze query and suggest optimizations
        const optimization = await this.queryAnalyzer.analyzeQuery(slowQuery.query);
        if (optimization) {
          console.log('💡 Query optimization suggestion:', optimization);
        }
      }
    }

    // Check query cache performance
    if (queries.queryCache.hitRatio < 0.8) {
      console.warn('⚠️ Low query cache hit ratio:', queries.queryCache.hitRatio);
    }
  }

  private async analyzeIndexUsage(): Promise<void> {
    if (!this.metrics) return;

    const indexMetrics = this.metrics.indexing;

    // Check for unused indexes
    if (indexMetrics.unusedIndexes.length > 0) {
      console.warn('📊 Unused indexes detected:', indexMetrics.unusedIndexes);
    }

    // Check index efficiency
    if (indexMetrics.effectiveness < 70) {
      console.warn('⚠️ Low index effectiveness:', indexMetrics.effectiveness);
      
      const recommendations = await this.indexOptimizer.generateRecommendations();
      if (recommendations.length > 0) {
        console.log('💡 Index recommendations:', recommendations);
      }
    }
  }

  private analyzeStorageIssues(): void {
    if (!this.metrics) return;

    const { storage } = this.metrics;

    // Check disk space
    const usagePercentage = (storage.usedSize / storage.totalSize) * 100;
    if (usagePercentage > 80) {
      console.warn('💾 High disk usage:', usagePercentage.toFixed(1) + '%');
    }

    // Check fragmentation
    if (storage.fragmentation > 30) {
      console.warn('🗂️ High database fragmentation:', storage.fragmentation + '%');
    }

    // Check I/O performance
    if (storage.io.readLatency > 100 || storage.io.writeLatency > 100) {
      console.warn('💽 High I/O latency detected:', {
        read: storage.io.readLatency,
        write: storage.io.writeLatency,
      });
    }
  }

  // ============================================================================
  // OPTIMIZATION OPERATIONS
  // ============================================================================

  async optimizeQueries(): Promise<QueryOptimizationResult[]> {
    console.log('🔧 Starting query optimization...');
    
    if (!this.metrics) {
      throw new Error('No metrics available for optimization');
    }

    const results: QueryOptimizationResult[] = [];
    const slowQueries = this.metrics.queries.slowQueries;

    for (const slowQuery of slowQueries) {
      try {
        const optimization = await this.queryAnalyzer.optimizeQuery(slowQuery);
        results.push(optimization);
        
        console.log(`✅ Optimized query: ${optimization.beforeTime}ms → ${optimization.afterTime}ms`);
      } catch (error) {
        console.error('❌ Query optimization failed:', error);
        results.push({
          query: slowQuery.query,
          beforeTime: slowQuery.executionTime,
          afterTime: slowQuery.executionTime,
          improvement: 0,
          recommendations: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Query optimization completed: ${results.length} queries processed`);
    return results;
  }

  async optimizeIndexes(): Promise<IndexOptimizationResult[]> {
    console.log('📊 Starting index optimization...');
    
    const results = await this.indexOptimizer.optimizeIndexes();
    
    console.log(`✅ Index optimization completed: ${results.length} operations performed`);
    return results;
  }

  async optimizeConnections(): Promise<void> {
    console.log('🔗 Optimizing connection pool...');
    
    await this.connectionPool.optimize();
    
    console.log('✅ Connection pool optimization completed');
  }

  async optimizeStorage(): Promise<StorageOptimizationResult> {
    console.log('💾 Starting storage optimization...');
    
    const result = await this.performStorageOptimization();
    
    console.log('✅ Storage optimization completed');
    return result;
  }

  private async performStorageOptimization(): Promise<StorageOptimizationResult> {
    const operations: string[] = [];
    let spaceReclaimed = 0;

    try {
      // Vacuum and analyze tables
      const response = await fetch('/api/database/optimize/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: ['vacuum', 'analyze', 'reindex'] }),
      });

      if (response.ok) {
        const result = await response.json();
        operations.push(...result.operations);
        spaceReclaimed = result.spaceReclaimed || 0;
      }
    } catch (error) {
      console.error('Storage optimization API call failed:', error);
    }

    return {
      operations,
      spaceReclaimed,
      fragmentationReduced: Math.min(30, spaceReclaimed / (1024 * 1024) * 0.1), // Estimate
      success: operations.length > 0,
    };
  }

  // ============================================================================
  // INDEX MAINTENANCE
  // ============================================================================

  private indexMaintenanceInterval: NodeJS.Timeout | null = null;

  private startIndexMaintenance(): void {
    this.indexMaintenanceInterval = setInterval(() => {
      this.performIndexMaintenance();
    }, this.config.indexMaintenanceInterval);
  }

  private stopIndexMaintenance(): void {
    if (this.indexMaintenanceInterval) {
      clearInterval(this.indexMaintenanceInterval);
      this.indexMaintenanceInterval = null;
    }
  }

  private async performIndexMaintenance(): Promise<void> {
    console.log('🔧 Performing scheduled index maintenance...');
    
    try {
      await this.indexOptimizer.performMaintenance();
      console.log('✅ Index maintenance completed');
    } catch (error) {
      console.error('❌ Index maintenance failed:', error);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getMetrics(): DatabasePerformanceMetrics | null {
    return this.metrics;
  }

  getSlowQueries(): SlowQueryMetrics[] {
    return this.slowQueries;
  }

  async analyzeQuery(query: string): Promise<QueryAnalysisResult> {
    return await this.queryAnalyzer.analyzeQuery(query);
  }

  async explainQuery(query: string): Promise<QueryExplanation> {
    return await this.queryAnalyzer.explainQuery(query);
  }

  getConnectionPoolStatus(): ConnectionPoolMetrics {
    return this.connectionPool.getMetrics();
  }

  getIndexRecommendations(): Promise<IndexRecommendation[]> {
    return this.indexOptimizer.generateRecommendations();
  }

  async optimizeAll(): Promise<OptimizationSummary> {
    console.log('🚀 Starting full database optimization...');
    
    const startTime = Date.now();
    const summary: OptimizationSummary = {
      queries: [],
      indexes: [],
      storage: { operations: [], spaceReclaimed: 0, fragmentationReduced: 0, success: false },
      duration: 0,
      success: false,
    };

    try {
      // Optimize queries
      summary.queries = await this.optimizeQueries();
      
      // Optimize indexes
      summary.indexes = await this.optimizeIndexes();
      
      // Optimize storage
      summary.storage = await this.optimizeStorage();
      
      // Optimize connections
      await this.optimizeConnections();

      summary.duration = Date.now() - startTime;
      summary.success = true;

      console.log(`✅ Full database optimization completed in ${summary.duration}ms`);
      
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      summary.duration = Date.now() - startTime;
      summary.success = false;
    }

    return summary;
  }

  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      slowQueries: this.slowQueries,
      config: this.config,
    }, null, 2);
  }

  updateConfig(updates: Partial<DatabaseOptimizerConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️ Database optimizer configuration updated');
  }
}

// ============================================================================
// CONNECTION POOL MANAGER
// ============================================================================

class ConnectionPoolManager {
  private metrics: ConnectionPoolMetrics;
  private config: DatabaseOptimizerConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: DatabaseOptimizerConfig) {
    this.config = config;
    this.metrics = {
      active: 0,
      idle: 0,
      waiting: 0,
      total: 0,
      maxConnections: config.maxConnections,
      averageAcquisitionTime: 0,
      connectionErrors: 0,
      timeouts: 0,
      leaks: 0,
    };
  }

  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update every 5 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      const response = await fetch('/api/database/pool/metrics');
      if (response.ok) {
        this.metrics = await response.json();
      }
    } catch (error) {
      console.warn('Failed to update connection pool metrics:', error);
    }
  }

  async optimize(): Promise<void> {
    // Analyze current usage patterns
    const utilizationRatio = this.metrics.active / this.metrics.maxConnections;
    
    if (utilizationRatio > 0.8) {
      console.log('📈 High connection utilization - recommending pool size increase');
    } else if (utilizationRatio < 0.3) {
      console.log('📉 Low connection utilization - pool size could be reduced');
    }

    // Clean up leaked connections
    if (this.metrics.leaks > 0) {
      await this.cleanupLeakedConnections();
    }
  }

  private async cleanupLeakedConnections(): Promise<void> {
    try {
      await fetch('/api/database/pool/cleanup', { method: 'POST' });
      console.log('🧹 Cleaned up leaked connections');
    } catch (error) {
      console.error('Failed to cleanup leaked connections:', error);
    }
  }

  getMetrics(): ConnectionPoolMetrics {
    return { ...this.metrics };
  }
}

// ============================================================================
// QUERY ANALYZER
// ============================================================================

class QueryAnalyzer {
  private config: DatabaseOptimizerConfig;
  private queryMetrics: QueryPerformanceMetrics | null = null;

  constructor(config: DatabaseOptimizerConfig) {
    this.config = config;
  }

  startAnalysis(): void {
    console.log('🔍 Query analysis started');
  }

  stopAnalysis(): void {
    console.log('⏹️ Query analysis stopped');
  }

  async getMetrics(): Promise<QueryPerformanceMetrics> {
    try {
      const response = await fetch('/api/database/queries/metrics');
      if (response.ok) {
        this.queryMetrics = await response.json();
        return this.queryMetrics;
      }
    } catch (error) {
      console.warn('Failed to get query metrics:', error);
    }

    // Fallback metrics
    return {
      totalQueries: 0,
      averageExecutionTime: 0,
      slowQueries: [],
      mostExecuted: [],
      queryCache: {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        evictions: 0,
        invalidations: 0,
      },
      indexUsage: {
        used: [],
        unused: [],
        recommendations: [],
        efficiency: 0,
      },
    };
  }

  async analyzeQuery(query: string): Promise<QueryAnalysisResult> {
    try {
      const response = await fetch('/api/database/queries/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Query analysis failed:', error);
    }

    return {
      query,
      recommendations: [],
      estimatedImprovement: 0,
      complexity: 'medium',
      issues: [],
    };
  }

  async explainQuery(query: string): Promise<QueryExplanation> {
    try {
      const response = await fetch('/api/database/queries/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Query explanation failed:', error);
    }

    return {
      plan: [],
      cost: 0,
      rows: 0,
      buffers: {
        shared: 0,
        hit: 0,
        read: 0,
        dirtied: 0,
        written: 0,
      },
      timing: {
        planning: 0,
        execution: 0,
        total: 0,
      },
    };
  }

  async optimizeQuery(slowQuery: SlowQueryMetrics): Promise<QueryOptimizationResult> {
    try {
      const response = await fetch('/api/database/queries/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: slowQuery.query }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Query optimization failed:', error);
    }

    return {
      query: slowQuery.query,
      beforeTime: slowQuery.executionTime,
      afterTime: slowQuery.executionTime,
      improvement: 0,
      recommendations: [],
      success: false,
    };
  }
}

// ============================================================================
// INDEX OPTIMIZER
// ============================================================================

class IndexOptimizer {
  private config: DatabaseOptimizerConfig;

  constructor(config: DatabaseOptimizerConfig) {
    this.config = config;
  }

  async getMetrics(): Promise<IndexUsageMetrics> {
    try {
      const response = await fetch('/api/database/indexes/metrics');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to get index metrics:', error);
    }

    return {
      used: [],
      unused: [],
      recommendations: [],
      efficiency: 0,
    };
  }

  async generateRecommendations(): Promise<IndexRecommendation[]> {
    try {
      const response = await fetch('/api/database/indexes/recommendations');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to get index recommendations:', error);
    }

    return [];
  }

  async optimizeIndexes(): Promise<IndexOptimizationResult[]> {
    try {
      const response = await fetch('/api/database/indexes/optimize', {
        method: 'POST',
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Index optimization failed:', error);
    }

    return [];
  }

  async performMaintenance(): Promise<void> {
    try {
      await fetch('/api/database/indexes/maintenance', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Index maintenance failed:', error);
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface DatabaseOptimizerConfig {
  enableMonitoring: boolean;
  enableOptimization: boolean;
  slowQueryThreshold: number;
  connectionPoolSize: number;
  maxConnections: number;
  queryTimeout: number;
  indexMaintenanceInterval: number;
  cacheQueryPlans: boolean;
  autoOptimizeIndexes: boolean;
  enableQueryAnalysis: boolean;
}

interface QueryAnalysisResult {
  query: string;
  recommendations: string[];
  estimatedImprovement: number;
  complexity: 'low' | 'medium' | 'high';
  issues: string[];
}

interface QueryOptimizationResult {
  query: string;
  beforeTime: number;
  afterTime: number;
  improvement: number;
  recommendations: string[];
  success: boolean;
  error?: string;
}

interface IndexOptimizationResult {
  operation: 'create' | 'drop' | 'rebuild' | 'analyze';
  table: string;
  index: string;
  success: boolean;
  duration: number;
  impact: string;
}

interface StorageOptimizationResult {
  operations: string[];
  spaceReclaimed: number;
  fragmentationReduced: number;
  success: boolean;
}

interface OptimizationSummary {
  queries: QueryOptimizationResult[];
  indexes: IndexOptimizationResult[];
  storage: StorageOptimizationResult;
  duration: number;
  success: boolean;
}

// Export singleton instance
export const databaseOptimizer = new DatabaseOptimizerService();
export default databaseOptimizer; 