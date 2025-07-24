import { prisma } from '../prisma';
import { 
  MarketingABTestType,
  MarketingABTestStatus,
  MarketingAnalyticsType
} from '@/generated/prisma';

// A/B Test Variant
interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  content: Record<string, any>;
  trafficAllocation: number; // percentage
  isControl: boolean;
}

// A/B Test Configuration
interface ABTestConfig {
  name: string;
  description?: string;
  type: MarketingABTestType;
  variants: ABTestVariant[];
  trafficAllocation: number; // total percentage of traffic to test
  minimumSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  testDuration: number; // days
  primaryMetric: string;
  secondaryMetrics?: string[];
  targetAudience?: Record<string, any>;
  startDate?: Date;
  endDate?: Date;
}

// A/B Test Results
interface ABTestResults {
  testId: string;
  variantResults: Array<{
    variantId: string;
    variantName: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    averageOrderValue: number;
    statisticalSignificance: number;
    confidence: number;
  }>;
  overallResults: {
    totalImpressions: number;
    totalConversions: number;
    overallConversionRate: number;
    totalRevenue: number;
    testDuration: number;
    isSignificant: boolean;
    winner: string | null;
    confidence: number;
    recommendation: string;
  };
  statisticalAnalysis: {
    pValue: number;
    confidenceInterval: number[];
    effectSize: number;
    power: number;
  };
}

// A/B Test Template
interface ABTestTemplate {
  id: string;
  name: string;
  description: string;
  type: MarketingABTestType;
  defaultConfig: Partial<ABTestConfig>;
  bestPractices: string[];
  commonMetrics: string[];
  estimatedDuration: number;
  successCriteria: string[];
}

// A/B Test Automation Workflow
interface ABTestWorkflow {
  id: string;
  name: string;
  description?: string;
  triggers: string[];
  actions: Array<{
    type: 'test_creation' | 'test_activation' | 'test_monitoring' | 'test_analysis' | 'test_optimization';
    parameters: Record<string, any>;
    conditions?: Record<string, any>;
  }>;
  isActive: boolean;
  siteId: string;
  createdBy: string;
}

// A/B Testing Service Class
export class ABTestingService {
  /**
   * Create a new A/B test
   */
  async createABTest(siteId: string, config: ABTestConfig, createdBy: string) {
    try {
      // Validate variants
      if (config.variants.length < 2) {
        throw new Error('A/B test must have at least 2 variants');
      }

      const totalAllocation = config.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (totalAllocation !== 100) {
        throw new Error('Variant traffic allocation must sum to 100%');
      }

      const test = await prisma.marketingABTest.create({
        data: {
          name: config.name,
          description: config.description,
          type: config.type,
          status: MarketingABTestStatus.DRAFT,
          startDate: config.startDate,
          endDate: config.endDate,
          variants: config.variants,
          siteId,
          createdBy,
        },
      });

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_created',
          value: 1,
          date: new Date(),
          siteId,
          metadata: { testId: test.id, type: config.type },
        },
      });

      return test;
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      throw error;
    }
  }

  /**
   * Get A/B tests for a site
   */
  async getABTests(siteId: string, status?: MarketingABTestStatus) {
    try {
      const tests = await prisma.marketingABTest.findMany({
        where: {
          siteId,
          ...(status && { status }),
        },
        include: {
          campaign: true,
          createdUser: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return tests;
    } catch (error) {
      console.error('Failed to get A/B tests:', error);
      throw error;
    }
  }

  /**
   * Get A/B test by ID
   */
  async getABTest(testId: string) {
    try {
      const test = await prisma.marketingABTest.findUnique({
        where: { id: testId },
        include: {
          campaign: true,
          createdUser: true,
        },
      });

      if (!test) {
        throw new Error('A/B test not found');
      }

      return test;
    } catch (error) {
      console.error('Failed to get A/B test:', error);
      throw error;
    }
  }

  /**
   * Update A/B test status
   */
  async updateABTestStatus(testId: string, status: MarketingABTestStatus) {
    try {
      const test = await prisma.marketingABTest.update({
        where: { id: testId },
        data: { status },
      });

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_status_updated',
          value: 1,
          date: new Date(),
          siteId: test.siteId,
          metadata: { testId, status },
        },
      });

      return test;
    } catch (error) {
      console.error('Failed to update A/B test status:', error);
      throw error;
    }
  }

  /**
   * Record A/B test impression
   */
  async recordImpression(testId: string, variantId: string, userId?: string) {
    try {
      // In a real implementation, this would store impression data
      // For now, we'll simulate impression recording
      const impression = {
        testId,
        variantId,
        userId: userId || 'anonymous',
        timestamp: new Date(),
      };

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_impression',
          value: 1,
          date: new Date(),
          siteId: 'site-id', // Would be retrieved from test
          metadata: impression,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to record A/B test impression:', error);
      throw error;
    }
  }

  /**
   * Record A/B test conversion
   */
  async recordConversion(testId: string, variantId: string, userId?: string, revenue?: number) {
    try {
      // In a real implementation, this would store conversion data
      // For now, we'll simulate conversion recording
      const conversion = {
        testId,
        variantId,
        userId: userId || 'anonymous',
        revenue: revenue || 0,
        timestamp: new Date(),
      };

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_conversion',
          value: revenue || 1,
          date: new Date(),
          siteId: 'site-id', // Would be retrieved from test
          metadata: conversion,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to record A/B test conversion:', error);
      throw error;
    }
  }

  /**
   * Calculate A/B test results with statistical significance
   */
  async calculateABTestResults(testId: string): Promise<ABTestResults> {
    try {
      const test = await this.getABTest(testId);
      const variants = test.variants as ABTestVariant[];

      // Simulate variant results (in real implementation, this would come from analytics)
      const variantResults = variants.map((variant, index) => {
        const impressions = Math.floor(Math.random() * 1000) + 100;
        const conversions = Math.floor(Math.random() * 50) + 5;
        const conversionRate = (conversions / impressions) * 100;
        const revenue = conversions * (Math.random() * 100 + 50);
        const averageOrderValue = revenue / conversions;

        return {
          variantId: variant.id,
          variantName: variant.name,
          impressions,
          conversions,
          conversionRate,
          revenue,
          averageOrderValue,
          statisticalSignificance: 0, // Will be calculated
          confidence: 0, // Will be calculated
        };
      });

      // Calculate statistical significance
      const controlVariant = variantResults.find(v => 
        variants.find(variant => variant.id === v.variantId)?.isControl
      );
      const testVariants = variantResults.filter(v => 
        !variants.find(variant => variant.id === v.variantId)?.isControl
      );

      const statisticalAnalysis = await this.calculateStatisticalSignificance(
        controlVariant!,
        testVariants[0]
      );

      // Update variant results with statistical data
      variantResults.forEach((variant, index) => {
        if (index === 0) {
          variant.statisticalSignificance = statisticalAnalysis.pValue;
          variant.confidence = statisticalAnalysis.confidence;
        }
      });

      // Determine winner
      const winner = statisticalAnalysis.significant ? 
        (testVariants[0].conversionRate > controlVariant!.conversionRate ? 
          testVariants[0].variantId : controlVariant!.variantId) : null;

      const totalImpressions = variantResults.reduce((sum, v) => sum + v.impressions, 0);
      const totalConversions = variantResults.reduce((sum, v) => sum + v.conversions, 0);
      const totalRevenue = variantResults.reduce((sum, v) => sum + v.revenue, 0);

      const overallResults = {
        totalImpressions,
        totalConversions,
        overallConversionRate: (totalConversions / totalImpressions) * 100,
        totalRevenue,
        testDuration: test.startDate && test.endDate ? 
          (test.endDate.getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24) : 0,
        isSignificant: statisticalAnalysis.significant,
        winner,
        confidence: statisticalAnalysis.confidence,
        recommendation: this.generateRecommendation(statisticalAnalysis, variantResults),
      };

      return {
        testId,
        variantResults,
        overallResults,
        statisticalAnalysis,
      };
    } catch (error) {
      console.error('Failed to calculate A/B test results:', error);
      throw error;
    }
  }

  /**
   * Calculate statistical significance between two variants
   */
  async calculateStatisticalSignificance(
    controlVariant: any,
    testVariant: any
  ): Promise<{
    significant: boolean;
    pValue: number;
    confidence: number;
    confidenceInterval: number[];
    effectSize: number;
    power: number;
  }> {
    try {
      // Calculate conversion rates
      const controlRate = controlVariant.conversionRate / 100;
      const testRate = testVariant.conversionRate / 100;

      // Calculate standard errors
      const controlSE = Math.sqrt((controlRate * (1 - controlRate)) / controlVariant.impressions);
      const testSE = Math.sqrt((testRate * (1 - testRate)) / testVariant.impressions);

      // Calculate pooled standard error
      const pooledSE = Math.sqrt(controlSE * controlSE + testSE * testSE);

      // Calculate z-score
      const zScore = Math.abs(testRate - controlRate) / pooledSE;

      // Calculate p-value (two-tailed test)
      const pValue = 2 * (1 - this.normalCDF(zScore));

      // Calculate confidence level
      const confidence = (1 - pValue) * 100;

      // Determine significance (95% confidence level)
      const significant = pValue < 0.05;

      // Calculate effect size (Cohen's h)
      const effectSize = 2 * Math.asin(Math.sqrt(testRate)) - 2 * Math.asin(Math.sqrt(controlRate));

      // Calculate confidence interval
      const marginOfError = 1.96 * pooledSE;
      const confidenceInterval = [
        (testRate - controlRate) - marginOfError,
        (testRate - controlRate) + marginOfError,
      ];

      // Calculate power (simplified)
      const power = this.calculatePower(controlRate, testRate, controlVariant.impressions, testVariant.impressions);

      return {
        significant,
        pValue,
        confidence,
        confidenceInterval,
        effectSize,
        power,
      };
    } catch (error) {
      console.error('Failed to calculate statistical significance:', error);
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(testId: string): Promise<Array<{
    type: 'test_extension' | 'sample_size_increase' | 'variant_optimization' | 'test_termination';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: number;
    effort: number;
    reasoning: string;
  }>> {
    try {
      const results = await this.calculateABTestResults(testId);
      const recommendations = [];

      // Check if test needs more time
      if (results.overallResults.totalImpressions < 1000) {
        recommendations.push({
          type: 'test_extension',
          priority: 'high',
          title: 'Extend Test Duration',
          description: 'Increase test duration to reach minimum sample size',
          impact: 85,
          effort: 30,
          reasoning: 'Current sample size is too small for reliable results',
        });
      }

      // Check if test is significant
      if (results.overallResults.isSignificant) {
        recommendations.push({
          type: 'test_termination',
          priority: 'high',
          title: 'Declare Winner and End Test',
          description: 'Test has reached statistical significance',
          impact: 90,
          effort: 20,
          reasoning: 'Winner can be declared with confidence',
        });
      } else if (results.statisticalAnalysis.power < 0.8) {
        recommendations.push({
          type: 'sample_size_increase',
          priority: 'medium',
          title: 'Increase Sample Size',
          description: 'Increase traffic allocation to improve statistical power',
          impact: 70,
          effort: 50,
          reasoning: 'Low statistical power indicates insufficient sample size',
        });
      }

      // Check for variant optimization opportunities
      const bestVariant = results.variantResults.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );

      if (bestVariant.conversionRate > 0) {
        recommendations.push({
          type: 'variant_optimization',
          priority: 'medium',
          title: 'Optimize Winning Variant',
          description: 'Further optimize the best-performing variant',
          impact: 60,
          effort: 70,
          reasoning: 'Winning variant shows potential for further improvement',
        });
      }

      return recommendations.sort((a, b) => b.impact - a.impact);
    } catch (error) {
      console.error('Failed to generate optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * Create A/B test template
   */
  async createABTestTemplate(template: Omit<ABTestTemplate, 'id'>): Promise<ABTestTemplate> {
    try {
      // In a real implementation, this would be stored in a database
      // For now, we'll return the template with a generated ID
      return {
        id: `template-${Date.now()}`,
        ...template,
      };
    } catch (error) {
      console.error('Failed to create A/B test template:', error);
      throw error;
    }
  }

  /**
   * Get A/B test templates
   */
  async getABTestTemplates(): Promise<ABTestTemplate[]> {
    try {
      // In a real implementation, this would fetch from database
      // For now, we'll return predefined templates
      return [
        {
          id: 'email-subject-line',
          name: 'Email Subject Line Test',
          description: 'Test different email subject lines for better open rates',
          type: MarketingABTestType.EMAIL,
          defaultConfig: {
            minimumSampleSize: 1000,
            confidenceLevel: 0.95,
            testDuration: 7,
            primaryMetric: 'open_rate',
            secondaryMetrics: ['click_rate', 'conversion_rate'],
          },
          bestPractices: [
            'Keep subject lines under 50 characters',
            'Test one variable at a time',
            'Avoid spam trigger words',
            'Use clear call-to-action',
          ],
          commonMetrics: ['open_rate', 'click_rate', 'conversion_rate', 'revenue'],
          estimatedDuration: 7,
          successCriteria: ['95% confidence level', 'Minimum 1000 recipients per variant'],
        },
        {
          id: 'landing-page-headline',
          name: 'Landing Page Headline Test',
          description: 'Test different headlines for better conversion rates',
          type: MarketingABTestType.CONTENT,
          defaultConfig: {
            minimumSampleSize: 500,
            confidenceLevel: 0.95,
            testDuration: 14,
            primaryMetric: 'conversion_rate',
            secondaryMetrics: ['bounce_rate', 'time_on_page'],
          },
          bestPractices: [
            'Focus on value proposition',
            'Use action-oriented language',
            'Keep headlines clear and concise',
            'Test emotional vs rational appeals',
          ],
          commonMetrics: ['conversion_rate', 'bounce_rate', 'time_on_page', 'revenue'],
          estimatedDuration: 14,
          successCriteria: ['95% confidence level', 'Minimum 500 visitors per variant'],
        },
        {
          id: 'cta-button',
          name: 'Call-to-Action Button Test',
          description: 'Test different CTA button styles and text',
          type: MarketingABTestType.CONTENT,
          defaultConfig: {
            minimumSampleSize: 300,
            confidenceLevel: 0.95,
            testDuration: 10,
            primaryMetric: 'click_rate',
            secondaryMetrics: ['conversion_rate', 'revenue'],
          },
          bestPractices: [
            'Use contrasting colors',
            'Test action-oriented text',
            'Ensure button is prominent',
            'Test different button sizes',
          ],
          commonMetrics: ['click_rate', 'conversion_rate', 'revenue'],
          estimatedDuration: 10,
          successCriteria: ['95% confidence level', 'Minimum 300 visitors per variant'],
        },
      ];
    } catch (error) {
      console.error('Failed to get A/B test templates:', error);
      throw error;
    }
  }

  /**
   * Create A/B test automation workflow
   */
  async createABTestWorkflow(workflow: Omit<ABTestWorkflow, 'id'>): Promise<ABTestWorkflow> {
    try {
      // In a real implementation, this would be stored in a database
      // For now, we'll return the workflow with a generated ID
      const newWorkflow: ABTestWorkflow = {
        id: `workflow-${Date.now()}`,
        ...workflow,
      };

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_workflow_created',
          value: 1,
          date: new Date(),
          siteId: workflow.siteId,
          metadata: { workflowId: newWorkflow.id },
        },
      });

      return newWorkflow;
    } catch (error) {
      console.error('Failed to create A/B test workflow:', error);
      throw error;
    }
  }

  /**
   * Execute A/B test automation workflow
   */
  async executeABTestWorkflow(workflowId: string, siteId: string) {
    try {
      // In a real implementation, this would execute the workflow actions
      // For now, we'll simulate workflow execution
      const result = {
        workflowId,
        siteId,
        status: 'executed',
        actions: [
          { type: 'test_creation', status: 'completed', timestamp: new Date() },
          { type: 'test_activation', status: 'completed', timestamp: new Date() },
          { type: 'test_monitoring', status: 'completed', timestamp: new Date() },
        ],
      };

      // Create analytics record
      await prisma.marketingAnalytics.create({
        data: {
          type: MarketingAnalyticsType.CAMPAIGN,
          metric: 'ab_test_workflow_executed',
          value: 1,
          date: new Date(),
          siteId,
          metadata: { workflowId, result },
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to execute A/B test workflow:', error);
      throw error;
    }
  }

  /**
   * Generate recommendation based on test results
   */
  private generateRecommendation(statisticalAnalysis: any, variantResults: any[]): string {
    if (statisticalAnalysis.significant) {
      const bestVariant = variantResults.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      return `Declare ${bestVariant.variantName} as winner with ${statisticalAnalysis.confidence.toFixed(1)}% confidence`;
    } else if (statisticalAnalysis.power < 0.8) {
      return 'Continue test to increase statistical power and sample size';
    } else {
      return 'No significant difference found. Consider testing different variations';
    }
  }

  /**
   * Calculate statistical power
   */
  private calculatePower(p1: number, p2: number, n1: number, n2: number): number {
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const effectSize = Math.abs(p2 - p1) / pooledSE;
    const alpha = 0.05;
    const zAlpha = 1.96;
    const zBeta = effectSize - zAlpha;
    return this.normalCDF(zBeta);
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService(); 