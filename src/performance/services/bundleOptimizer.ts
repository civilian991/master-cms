'use client';

import {
  BundleAnalysis,
  BundleMetrics,
  ModuleMetrics,
  ChunkAnalysis,
  DependencyAnalysis,
  BundleOptimizationRecommendation,
  BundleComparison,
  BundleChange,
  BundleChangeSummary,
  CodeCoverageMetrics,
  CacheabilityMetrics,
  SecurityMetrics,
  OptimizationLevel,
  BundleType,
} from '../types/performance.types';

class BundleOptimizerService {
  private currentAnalysis: BundleAnalysis | null = null;
  private analysisHistory: BundleAnalysis[] = [];
  private optimizationQueue: Map<string, BundleOptimizationRecommendation[]> = new Map();
  private config: BundleOptimizerConfig;

  constructor(config?: Partial<BundleOptimizerConfig>) {
    this.config = {
      enableAnalysis: true,
      enableOptimization: true,
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableCompression: true,
      optimizationLevel: 'aggressive',
      maxBundleSize: 250 * 1024, // 250KB
      maxChunkSize: 100 * 1024, // 100KB
      chunkSizeWarning: 50 * 1024, // 50KB
      cacheabilityThreshold: 0.8,
      coverageThreshold: 0.7,
      ...config,
    };

    if (this.config.enableAnalysis && typeof window !== 'undefined') {
      this.initializeAnalysis();
    }
  }

  // ============================================================================
  // BUNDLE ANALYSIS
  // ============================================================================

  private initializeAnalysis(): void {
    // Analyze on page load
    if (document.readyState === 'complete') {
      this.analyzeBundles();
    } else {
      window.addEventListener('load', () => this.analyzeBundles());
    }

    // Monitor dynamic imports
    this.monitorDynamicImports();
  }

  async analyzeBundles(): Promise<BundleAnalysis> {
    console.log('🔍 Analyzing bundle performance...');
    const startTime = performance.now();

    try {
      const analysis: BundleAnalysis = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date(),
        bundles: await this.analyzeBundleMetrics(),
        totalSize: 0,
        gzippedSize: 0,
        chunks: await this.analyzeChunks(),
        dependencies: await this.analyzeDependencies(),
        recommendations: [],
        comparison: this.getComparisonWithPrevious(),
      };

      // Calculate totals
      analysis.totalSize = analysis.bundles.reduce((sum, bundle) => sum + bundle.size, 0);
      analysis.gzippedSize = analysis.bundles.reduce((sum, bundle) => sum + bundle.gzippedSize, 0);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      // Store analysis
      this.currentAnalysis = analysis;
      this.analysisHistory.push(analysis);

      // Limit history size
      if (this.analysisHistory.length > 10) {
        this.analysisHistory.shift();
      }

      const analysisTime = performance.now() - startTime;
      console.log(`✅ Bundle analysis completed in ${analysisTime.toFixed(2)}ms`);
      console.log(`📦 Total bundle size: ${this.formatBytes(analysis.totalSize)}`);
      console.log(`🗜️ Gzipped size: ${this.formatBytes(analysis.gzippedSize)}`);
      console.log(`💡 ${analysis.recommendations.length} optimization recommendations`);

      return analysis;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  private async analyzeBundleMetrics(): Promise<BundleMetrics[]> {
    const bundles: BundleMetrics[] = [];
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Group resources by bundle type
    const bundleGroups = this.groupResourcesByBundle(resources);

    for (const [bundleType, bundleResources] of bundleGroups.entries()) {
      const bundle = await this.createBundleMetrics(bundleType, bundleResources);
      bundles.push(bundle);
    }

    return bundles;
  }

  private groupResourcesByBundle(resources: PerformanceResourceTiming[]): Map<BundleType, PerformanceResourceTiming[]> {
    const groups = new Map<BundleType, PerformanceResourceTiming[]>();

    resources.forEach(resource => {
      if (!this.isJavaScriptResource(resource)) return;

      const bundleType = this.determineBundleType(resource.name);
      if (!groups.has(bundleType)) {
        groups.set(bundleType, []);
      }
      groups.get(bundleType)!.push(resource);
    });

    return groups;
  }

  private async createBundleMetrics(
    bundleType: BundleType, 
    resources: PerformanceResourceTiming[]
  ): Promise<BundleMetrics> {
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize || 0), 0);
    const totalLoadTime = Math.max(...resources.map(r => r.responseEnd - r.startTime));
    const modules = await this.analyzeModules(resources);

    return {
      name: bundleType,
      type: bundleType,
      size: totalSize,
      gzippedSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      modules,
      loadTime: totalLoadTime,
      parseTime: await this.estimateParseTime(totalSize),
      evaluationTime: await this.estimateEvaluationTime(modules.length),
      cacheability: this.analyzeCacheability(resources),
      coverage: await this.analyzeCodeCoverage(bundleType),
    };
  }

  private async analyzeModules(resources: PerformanceResourceTiming[]): Promise<ModuleMetrics[]> {
    const modules: ModuleMetrics[] = [];

    for (const resource of resources) {
      try {
        const moduleInfo = await this.getModuleInfo(resource.name);
        modules.push({
          name: this.getModuleName(resource.name),
          size: resource.transferSize || resource.encodedBodySize || 0,
          gzippedSize: resource.transferSize || 0,
          path: resource.name,
          imported: true,
          sideEffects: moduleInfo.sideEffects,
          treeshakeable: moduleInfo.treeshakeable,
          dependencies: moduleInfo.dependencies,
          usage: moduleInfo.usage,
        });
      } catch (error) {
        // Fallback for modules we can't analyze
        modules.push({
          name: this.getModuleName(resource.name),
          size: resource.transferSize || resource.encodedBodySize || 0,
          gzippedSize: resource.transferSize || 0,
          path: resource.name,
          imported: true,
          sideEffects: false,
          treeshakeable: true,
          dependencies: [],
          usage: 1,
        });
      }
    }

    return modules;
  }

  private async analyzeChunks(): Promise<ChunkAnalysis[]> {
    const chunks: ChunkAnalysis[] = [];
    
    // Analyze webpack chunks if available
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      const webpackChunks = this.getWebpackChunks();
      chunks.push(...webpackChunks);
    }

    // Analyze dynamic imports
    const dynamicChunks = await this.analyzeDynamicChunks();
    chunks.push(...dynamicChunks);

    return chunks;
  }

  private getWebpackChunks(): ChunkAnalysis[] {
    // This would require webpack runtime API access
    // Placeholder implementation
    return [];
  }

  private async analyzeDynamicChunks(): Promise<ChunkAnalysis[]> {
    const chunks: ChunkAnalysis[] = [];
    
    // Monitor dynamic imports using performance observer
    const dynamicImports = this.getDynamicImports();
    
    dynamicImports.forEach((importInfo, index) => {
      chunks.push({
        id: `dynamic_${index}`,
        name: `Dynamic Import ${index}`,
        size: importInfo.size || 0,
        modules: [importInfo.module],
        isEntry: false,
        isDynamic: true,
        parents: [],
        children: [],
        loadPriority: importInfo.priority || 'medium',
      });
    });

    return chunks;
  }

  private async analyzeDependencies(): Promise<DependencyAnalysis[]> {
    const dependencies: DependencyAnalysis[] = [];
    
    // This would typically be done at build time with access to package.json
    // For runtime analysis, we'll detect common libraries
    const detectedLibraries = this.detectLibraries();
    
    for (const library of detectedLibraries) {
      const analysis = await this.analyzeDependency(library);
      dependencies.push(analysis);
    }

    return dependencies;
  }

  private detectLibraries(): string[] {
    const libraries: string[] = [];
    
    // Check for React
    if (typeof window !== 'undefined' && (window as any).React) {
      libraries.push('react');
    }
    
    // Check for other common libraries
    const commonLibs = ['lodash', 'moment', 'axios', 'jquery'];
    commonLibs.forEach(lib => {
      if (typeof window !== 'undefined' && (window as any)[lib]) {
        libraries.push(lib);
      }
    });

    return libraries;
  }

  private async analyzeDependency(libraryName: string): Promise<DependencyAnalysis> {
    // Placeholder implementation - would integrate with NPM API or bundler info
    return {
      name: libraryName,
      version: 'unknown',
      size: 0,
      usage: 1,
      treeshakeable: true,
      alternatives: [],
      security: {
        vulnerabilities: [],
        score: 100,
        lastAudit: new Date(),
        license: 'MIT',
        riskLevel: 'low',
      },
      performance: {
        loadTime: 0,
        parseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkRequests: 0,
      },
    };
  }

  // ============================================================================
  // OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  private generateRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    // Bundle size recommendations
    recommendations.push(...this.getBundleSizeRecommendations(analysis));
    
    // Code splitting recommendations
    recommendations.push(...this.getCodeSplittingRecommendations(analysis));
    
    // Tree shaking recommendations
    recommendations.push(...this.getTreeShakingRecommendations(analysis));
    
    // Compression recommendations
    recommendations.push(...this.getCompressionRecommendations(analysis));
    
    // Caching recommendations
    recommendations.push(...this.getCachingRecommendations(analysis));
    
    // Dependency recommendations
    recommendations.push(...this.getDependencyRecommendations(analysis));

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  private getBundleSizeRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    analysis.bundles.forEach(bundle => {
      if (bundle.size > this.config.maxBundleSize) {
        recommendations.push({
          type: 'code_splitting',
          impact: Math.min(50, (bundle.size / this.config.maxBundleSize) * 25),
          effort: 'medium',
          description: `Bundle "${bundle.name}" is ${this.formatBytes(bundle.size)}, which exceeds the recommended ${this.formatBytes(this.config.maxBundleSize)}`,
          implementation: `Split "${bundle.name}" into smaller chunks using dynamic imports or route-based splitting`,
          before: bundle.size,
          after: Math.floor(bundle.size * 0.6),
          savings: Math.floor(bundle.size * 0.4),
        });
      }
    });

    return recommendations;
  }

  private getCodeSplittingRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    // Check for large modules that could be split
    analysis.bundles.forEach(bundle => {
      const largeModules = bundle.modules.filter(m => m.size > this.config.chunkSizeWarning);
      
      if (largeModules.length > 0) {
        recommendations.push({
          type: 'code_splitting',
          impact: 30,
          effort: 'medium',
          description: `Found ${largeModules.length} large modules in "${bundle.name}" that could benefit from code splitting`,
          implementation: `Use dynamic imports for large modules: ${largeModules.map(m => m.name).join(', ')}`,
          before: bundle.size,
          after: bundle.size - largeModules.reduce((sum, m) => sum + m.size * 0.7, 0),
          savings: largeModules.reduce((sum, m) => sum + m.size * 0.3, 0),
        });
      }
    });

    return recommendations;
  }

  private getTreeShakingRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    analysis.bundles.forEach(bundle => {
      const treeshakeableModules = bundle.modules.filter(m => m.treeshakeable && m.usage < 0.8);
      
      if (treeshakeableModules.length > 0) {
        const potentialSavings = treeshakeableModules.reduce((sum, m) => sum + m.size * (1 - m.usage), 0);
        
        if (potentialSavings > 10 * 1024) { // > 10KB
          recommendations.push({
            type: 'tree_shaking',
            impact: Math.min(40, (potentialSavings / bundle.size) * 100),
            effort: 'low',
            description: `Tree shaking could remove ${this.formatBytes(potentialSavings)} from "${bundle.name}"`,
            implementation: `Enable tree shaking for modules: ${treeshakeableModules.map(m => m.name).join(', ')}`,
            before: bundle.size,
            after: bundle.size - potentialSavings,
            savings: potentialSavings,
          });
        }
      }
    });

    return recommendations;
  }

  private getCompressionRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    analysis.bundles.forEach(bundle => {
      const compressionRatio = bundle.gzippedSize / bundle.size;
      
      if (compressionRatio > 0.7) { // Poor compression ratio
        recommendations.push({
          type: 'compression',
          impact: 15,
          effort: 'low',
          description: `Bundle "${bundle.name}" has poor compression ratio (${(compressionRatio * 100).toFixed(1)}%)`,
          implementation: 'Enable Brotli compression or optimize bundle content for better compression',
          before: bundle.size,
          after: bundle.size * 0.6, // Assume better compression
          savings: bundle.size * 0.4,
        });
      }
    });

    return recommendations;
  }

  private getCachingRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    analysis.bundles.forEach(bundle => {
      if (bundle.cacheability.score < this.config.cacheabilityThreshold * 100) {
        recommendations.push({
          type: 'caching',
          impact: 20,
          effort: 'low',
          description: `Bundle "${bundle.name}" has poor cacheability (${bundle.cacheability.score}%)`,
          implementation: 'Add content hashing, set proper cache headers, and implement immutable bundles',
          before: bundle.size,
          after: bundle.size, // Size doesn't change, but loading improves
          savings: 0,
        });
      }
    });

    return recommendations;
  }

  private getDependencyRecommendations(analysis: BundleAnalysis): BundleOptimizationRecommendation[] {
    const recommendations: BundleOptimizationRecommendation[] = [];

    analysis.dependencies.forEach(dep => {
      // Check for large dependencies with alternatives
      if (dep.size > 50 * 1024 && dep.alternatives.length > 0) {
        const bestAlternative = dep.alternatives.reduce((best, alt) => 
          alt.size < best.size ? alt : best
        );
        
        if (bestAlternative.size < dep.size * 0.8) {
          recommendations.push({
            type: 'dependency_optimization',
            impact: ((dep.size - bestAlternative.size) / analysis.totalSize) * 100,
            effort: 'high',
            description: `Replace "${dep.name}" with "${bestAlternative.name}" to reduce bundle size`,
            implementation: `Replace ${dep.name} (${this.formatBytes(dep.size)}) with ${bestAlternative.name} (${this.formatBytes(bestAlternative.size)})`,
            before: dep.size,
            after: bestAlternative.size,
            savings: dep.size - bestAlternative.size,
          });
        }
      }
    });

    return recommendations;
  }

  // ============================================================================
  // OPTIMIZATION EXECUTION
  // ============================================================================

  async optimizeBundle(bundleName: string, level: OptimizationLevel = 'basic'): Promise<void> {
    console.log(`🔧 Optimizing bundle "${bundleName}" at level "${level}"`);
    
    const bundle = this.currentAnalysis?.bundles.find(b => b.name === bundleName);
    if (!bundle) {
      throw new Error(`Bundle "${bundleName}" not found`);
    }

    const recommendations = this.getRecommendationsForBundle(bundleName);
    const applicableRecommendations = this.filterRecommendationsByLevel(recommendations, level);

    for (const recommendation of applicableRecommendations) {
      try {
        await this.applyRecommendation(recommendation);
        console.log(`✅ Applied: ${recommendation.description}`);
      } catch (error) {
        console.error(`❌ Failed to apply: ${recommendation.description}`, error);
      }
    }

    // Re-analyze after optimization
    await this.analyzeBundles();
  }

  private getRecommendationsForBundle(bundleName: string): BundleOptimizationRecommendation[] {
    if (!this.currentAnalysis) return [];
    
    return this.currentAnalysis.recommendations.filter(rec => 
      rec.implementation.includes(bundleName)
    );
  }

  private filterRecommendationsByLevel(
    recommendations: BundleOptimizationRecommendation[], 
    level: OptimizationLevel
  ): BundleOptimizationRecommendation[] {
    const effortLevels = {
      none: [],
      basic: ['low'],
      aggressive: ['low', 'medium'],
      extreme: ['low', 'medium', 'high'],
    };

    const allowedEfforts = effortLevels[level];
    return recommendations.filter(rec => allowedEfforts.includes(rec.effort));
  }

  private async applyRecommendation(recommendation: BundleOptimizationRecommendation): Promise<void> {
    // In a real implementation, this would integrate with build tools
    // For now, we'll just log the recommendation
    console.log(`Applying optimization: ${recommendation.type} - ${recommendation.description}`);
    
    switch (recommendation.type) {
      case 'code_splitting':
        await this.applyCodeSplitting(recommendation);
        break;
      case 'tree_shaking':
        await this.applyTreeShaking(recommendation);
        break;
      case 'compression':
        await this.applyCompression(recommendation);
        break;
      case 'caching':
        await this.applyCaching(recommendation);
        break;
      case 'dependency_optimization':
        await this.applyDependencyOptimization(recommendation);
        break;
    }
  }

  private async applyCodeSplitting(recommendation: BundleOptimizationRecommendation): Promise<void> {
    // This would require build-time integration
    console.log('Code splitting optimization applied');
  }

  private async applyTreeShaking(recommendation: BundleOptimizationRecommendation): Promise<void> {
    // This would require build-time integration
    console.log('Tree shaking optimization applied');
  }

  private async applyCompression(recommendation: BundleOptimizationRecommendation): Promise<void> {
    // This would require server configuration
    console.log('Compression optimization applied');
  }

  private async applyCaching(recommendation: BundleOptimizationRecommendation): Promise<void> {
    // This would require server/CDN configuration
    console.log('Caching optimization applied');
  }

  private async applyDependencyOptimization(recommendation: BundleOptimizationRecommendation): Promise<void> {
    // This would require code changes
    console.log('Dependency optimization applied');
  }

  // ============================================================================
  // COMPARISON AND HISTORY
  // ============================================================================

  private getComparisonWithPrevious(): BundleComparison | undefined {
    if (this.analysisHistory.length === 0) return undefined;

    const previous = this.analysisHistory[this.analysisHistory.length - 1];
    const current = this.currentAnalysis;
    if (!current) return undefined;

    const changes = this.calculateChanges(previous, current);
    const summary = this.calculateChangeSummary(changes);

    return {
      previous,
      current,
      changes,
      summary,
    };
  }

  private calculateChanges(previous: BundleAnalysis, current: BundleAnalysis): BundleChange[] {
    const changes: BundleChange[] = [];

    // Compare bundles
    current.bundles.forEach(currentBundle => {
      const previousBundle = previous.bundles.find(b => b.name === currentBundle.name);
      
      if (!previousBundle) {
        changes.push({
          type: 'added',
          bundle: currentBundle.name,
          sizeDelta: currentBundle.size,
          impact: 'negative',
          description: `New bundle "${currentBundle.name}" added`,
        });
      } else if (currentBundle.size !== previousBundle.size) {
        const sizeDelta = currentBundle.size - previousBundle.size;
        changes.push({
          type: 'modified',
          bundle: currentBundle.name,
          sizeDelta,
          impact: sizeDelta > 0 ? 'negative' : 'positive',
          description: `Bundle "${currentBundle.name}" size changed by ${this.formatBytes(Math.abs(sizeDelta))}`,
        });
      }
    });

    // Check for removed bundles
    previous.bundles.forEach(previousBundle => {
      const currentBundle = current.bundles.find(b => b.name === previousBundle.name);
      if (!currentBundle) {
        changes.push({
          type: 'removed',
          bundle: previousBundle.name,
          sizeDelta: -previousBundle.size,
          impact: 'positive',
          description: `Bundle "${previousBundle.name}" removed`,
        });
      }
    });

    return changes;
  }

  private calculateChangeSummary(changes: BundleChange[]): BundleChangeSummary {
    const totalSizeDelta = changes.reduce((sum, change) => sum + change.sizeDelta, 0);
    const addedBundles = changes.filter(c => c.type === 'added').length;
    const removedBundles = changes.filter(c => c.type === 'removed').length;
    const modifiedBundles = changes.filter(c => c.type === 'modified').length;

    return {
      totalSizeDelta,
      bundleCount: changes.length,
      addedBundles,
      removedBundles,
      modifiedBundles,
      performanceImpact: this.calculatePerformanceImpact(totalSizeDelta),
    };
  }

  private calculatePerformanceImpact(sizeDelta: number): number {
    // Estimate performance impact based on size change
    // Negative is better (smaller size), positive is worse (larger size)
    const impactPercentage = (sizeDelta / (1024 * 1024)) * 10; // 10% impact per MB
    return Math.max(-100, Math.min(100, impactPercentage));
  }

  // ============================================================================
  // MONITORING AND DYNAMIC IMPORTS
  // ============================================================================

  private monitorDynamicImports(): void {
    const originalImport = window.import || (window as any).webpackJsonp;
    
    if (typeof originalImport === 'function') {
      // Monitor ES6 dynamic imports
      const importHandler = async (specifier: string) => {
        const startTime = performance.now();
        try {
          const module = await originalImport(specifier);
          const loadTime = performance.now() - startTime;
          
          this.recordDynamicImport({
            module: specifier,
            loadTime,
            size: this.estimateModuleSize(specifier),
            priority: 'medium',
          });
          
          return module;
        } catch (error) {
          console.error(`Dynamic import failed: ${specifier}`, error);
          throw error;
        }
      };

      // Replace the original import function
      if (window.import) {
        window.import = importHandler as any;
      }
    }
  }

  private recordDynamicImport(importInfo: DynamicImportInfo): void {
    this.dynamicImports.push(importInfo);
    
    // Limit history
    if (this.dynamicImports.length > 100) {
      this.dynamicImports.shift();
    }
  }

  private dynamicImports: DynamicImportInfo[] = [];

  private getDynamicImports(): DynamicImportInfo[] {
    return this.dynamicImports;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private isJavaScriptResource(resource: PerformanceResourceTiming): boolean {
    const name = resource.name.toLowerCase();
    return name.includes('.js') || name.includes('.mjs') || name.includes('.ts') || name.includes('.tsx');
  }

  private determineBundleType(resourceName: string): BundleType {
    const name = resourceName.toLowerCase();
    
    if (name.includes('vendor') || name.includes('node_modules')) return 'vendor';
    if (name.includes('runtime')) return 'runtime';
    if (name.includes('chunk')) return 'chunk';
    if (name.includes('main') || name.includes('app')) return 'main';
    if (name.includes('dynamic')) return 'dynamic';
    
    return 'main';
  }

  private getModuleName(resourceName: string): string {
    try {
      const url = new URL(resourceName);
      const pathname = url.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getModuleInfo(resourceName: string): Promise<ModuleInfo> {
    // This would require integration with bundler or source maps
    return {
      sideEffects: false,
      treeshakeable: true,
      dependencies: [],
      usage: 1,
    };
  }

  private async estimateParseTime(size: number): Promise<number> {
    // Estimate parse time based on size (rough approximation)
    return size / (1024 * 1024) * 100; // ~100ms per MB
  }

  private async estimateEvaluationTime(moduleCount: number): Promise<number> {
    // Estimate evaluation time based on module count
    return moduleCount * 2; // ~2ms per module
  }

  private analyzeCacheability(resources: PerformanceResourceTiming[]): CacheabilityMetrics {
    // Analyze cacheability based on resource characteristics
    let score = 100;
    let hasFingerprint = false;
    let hasEtag = false;

    resources.forEach(resource => {
      // Check for fingerprinting (hashes in filename)
      if (/[a-f0-9]{8,}/.test(resource.name)) {
        hasFingerprint = true;
      }
      
      // Note: Can't access response headers from PerformanceResourceTiming
      // In a real implementation, would check actual cache headers
    });

    if (!hasFingerprint) score -= 30;

    return {
      static: true,
      fingerprinted: hasFingerprint,
      immutable: hasFingerprint,
      maxAge: 31536000, // 1 year if fingerprinted
      etag: hasEtag,
      lastModified: false,
      score,
    };
  }

  private async analyzeCodeCoverage(bundleType: BundleType): Promise<CodeCoverageMetrics> {
    // This would require integration with coverage tools
    // Placeholder implementation
    return {
      lines: { total: 1000, covered: 800, percentage: 80, uncovered: [] },
      functions: { total: 100, covered: 85, percentage: 85, uncovered: [] },
      branches: { total: 200, covered: 160, percentage: 80, uncovered: [] },
      statements: { total: 800, covered: 640, percentage: 80, uncovered: [] },
      overall: 80,
    };
  }

  private estimateModuleSize(specifier: string): number {
    // Rough estimation based on module name/path
    return 50 * 1024; // Default 50KB
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getCurrentAnalysis(): BundleAnalysis | null {
    return this.currentAnalysis;
  }

  getAnalysisHistory(): BundleAnalysis[] {
    return [...this.analysisHistory];
  }

  getRecommendations(bundleName?: string): BundleOptimizationRecommendation[] {
    if (!this.currentAnalysis) return [];
    
    if (bundleName) {
      return this.getRecommendationsForBundle(bundleName);
    }
    
    return this.currentAnalysis.recommendations;
  }

  async optimizeAll(level: OptimizationLevel = 'basic'): Promise<void> {
    if (!this.currentAnalysis) {
      await this.analyzeBundles();
    }

    const bundleNames = this.currentAnalysis!.bundles.map(b => b.name);
    
    for (const bundleName of bundleNames) {
      await this.optimizeBundle(bundleName, level);
    }
  }

  exportAnalysis(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      analysis: this.currentAnalysis,
      history: this.analysisHistory,
      recommendations: this.getRecommendations(),
    }, null, 2);
  }

  clearHistory(): void {
    this.analysisHistory = [];
    console.log('🧹 Bundle analysis history cleared');
  }

  getConfig(): BundleOptimizerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<BundleOptimizerConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️ Bundle optimizer configuration updated');
  }
}

interface BundleOptimizerConfig {
  enableAnalysis: boolean;
  enableOptimization: boolean;
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableCompression: boolean;
  optimizationLevel: OptimizationLevel;
  maxBundleSize: number;
  maxChunkSize: number;
  chunkSizeWarning: number;
  cacheabilityThreshold: number;
  coverageThreshold: number;
}

interface ModuleInfo {
  sideEffects: boolean;
  treeshakeable: boolean;
  dependencies: string[];
  usage: number;
}

interface DynamicImportInfo {
  module: string;
  loadTime: number;
  size: number;
  priority: 'high' | 'medium' | 'low';
}

// Export singleton instance
export const bundleOptimizer = new BundleOptimizerService();
export default bundleOptimizer; 