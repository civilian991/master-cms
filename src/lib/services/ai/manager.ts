import { prisma } from '@/lib/prisma';
import { OpenAIService } from './openai';
import { GeminiService } from './gemini';
import { 
  IAIService, 
  ContentGenerationRequest, 
  ContentGenerationResponse, 
  AIServiceConfig,
  AIPersonality,
  CircuitBreakerConfig 
} from './base';

export class AIServiceManager {
  private static instance: AIServiceManager;
  private services: Map<string, IAIService> = new Map();
  private siteConfigs: Map<number, any> = new Map();
  private personalities: Map<string, AIPersonality> = new Map();

  private constructor() {
    this.initializePersonalities();
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  private initializePersonalities(): void {
    // Site-specific AI personalities
    this.personalities.set('himaya.io', {
      name: 'Cybersecurity Expert',
      description: 'A seasoned cybersecurity professional with expertise in threat intelligence, incident response, and security best practices.',
      tone: 'authoritative',
      expertise: ['cybersecurity', 'threat intelligence', 'incident response', 'security architecture', 'compliance'],
      writingStyle: 'Technical yet accessible, focusing on practical security insights and actionable advice.',
      targetAudience: 'Security professionals, IT managers, and business leaders',
      culturalContext: 'Middle Eastern cybersecurity landscape',
      language: 'bilingual',
    });

    this.personalities.set('unlock-bc.com', {
      name: 'Tech Educator',
      description: 'A passionate technology educator who makes complex concepts accessible to everyone.',
      tone: 'conversational',
      expertise: ['blockchain', 'cryptocurrency', 'web3', 'decentralized finance', 'emerging technologies'],
      writingStyle: 'Engaging and educational, breaking down complex topics into digestible pieces.',
      targetAudience: 'Tech enthusiasts, developers, and curious learners',
      culturalContext: 'Global tech community',
      language: 'en',
    });

    this.personalities.set('iktissadonline.com', {
      name: 'Financial Analyst',
      description: 'An experienced financial analyst specializing in Middle Eastern markets and economic trends.',
      tone: 'professional',
      expertise: ['financial markets', 'economic analysis', 'investment strategies', 'market trends', 'policy analysis'],
      writingStyle: 'Data-driven and analytical, providing insights backed by market research.',
      targetAudience: 'Investors, business professionals, and policy makers',
      culturalContext: 'Middle Eastern financial markets',
      language: 'bilingual',
    });

    this.personalities.set('defaiya.com', {
      name: 'Strategic Analyst',
      description: 'A strategic analyst with deep understanding of defense, aerospace, and geopolitical dynamics.',
      tone: 'authoritative',
      expertise: ['defense technology', 'aerospace', 'geopolitics', 'strategic analysis', 'military affairs'],
      writingStyle: 'Comprehensive and strategic, providing in-depth analysis of complex issues.',
      targetAudience: 'Defense professionals, policymakers, and strategic thinkers',
      culturalContext: 'Global defense and aerospace landscape',
      language: 'en',
    });
  }

  async loadSiteConfiguration(siteId: number): Promise<void> {
    try {
      const config = await prisma.siteAiConfig.findUnique({
        where: { siteId },
        include: {
          site: true,
        },
      });

      if (config) {
        this.siteConfigs.set(siteId, config);
      }
    } catch (error) {
      console.error(`Error loading AI configuration for site ${siteId}:`, error);
    }
  }

  async generateContent(
    siteId: number, 
    request: ContentGenerationRequest
  ): Promise<ContentGenerationResponse> {
    // Load site configuration if not cached
    if (!this.siteConfigs.has(siteId)) {
      await this.loadSiteConfiguration(siteId);
    }

    const siteConfig = this.siteConfigs.get(siteId);
    if (!siteConfig) {
      throw new Error(`No AI configuration found for site ${siteId}`);
    }

    // Apply site-specific personality
    const site = siteConfig.site;
    const personality = this.personalities.get(site.domain);
    if (personality) {
      request.personality = personality;
    }

    // Try primary provider first
    try {
      const primaryService = await this.getService(siteConfig.primaryProvider, siteConfig);
      return await primaryService.generateContent(request);
    } catch (error) {
      console.warn(`Primary AI provider failed for site ${siteId}:`, error);

      // Try fallback provider if available
      if (siteConfig.fallbackProvider) {
        try {
          const fallbackService = await this.getService(siteConfig.fallbackProvider, siteConfig);
          return await fallbackService.generateContent(request);
        } catch (fallbackError) {
          console.error(`Fallback AI provider also failed for site ${siteId}:`, fallbackError);
          throw new Error('All AI providers are currently unavailable');
        }
      }

      throw error;
    }
  }

  async generateBatch(
    siteId: number, 
    requests: ContentGenerationRequest[]
  ): Promise<ContentGenerationResponse[]> {
    // Load site configuration if not cached
    if (!this.siteConfigs.has(siteId)) {
      await this.loadSiteConfiguration(siteId);
    }

    const siteConfig = this.siteConfigs.get(siteId);
    if (!siteConfig) {
      throw new Error(`No AI configuration found for site ${siteId}`);
    }

    // Apply site-specific personality to all requests
    const site = siteConfig.site;
    const personality = this.personalities.get(site.domain);
    if (personality) {
      requests = requests.map(request => ({
        ...request,
        personality,
      }));
    }

    // Try primary provider first
    try {
      const primaryService = await this.getService(siteConfig.primaryProvider, siteConfig);
      return await primaryService.generateBatch(requests);
    } catch (error) {
      console.warn(`Primary AI provider failed for batch generation on site ${siteId}:`, error);

      // Try fallback provider if available
      if (siteConfig.fallbackProvider) {
        try {
          const fallbackService = await this.getService(siteConfig.fallbackProvider, siteConfig);
          return await fallbackService.generateBatch(requests);
        } catch (fallbackError) {
          console.error(`Fallback AI provider also failed for batch generation on site ${siteId}:`, fallbackError);
          throw new Error('All AI providers are currently unavailable');
        }
      }

      throw error;
    }
  }

  private async getService(provider: string, siteConfig: any): Promise<IAIService> {
    const serviceKey = `${siteConfig.siteId}_${provider}`;
    
    if (this.services.has(serviceKey)) {
      return this.services.get(serviceKey)!;
    }

    // Create new service instance
    const apiKeys = siteConfig.apiKeys as Record<string, string>;
    const apiKey = apiKeys[provider];
    
    if (!apiKey) {
      throw new Error(`No API key found for provider ${provider}`);
    }

    const config: AIServiceConfig = {
      provider: provider as any,
      model: this.getDefaultModel(provider),
      apiKey,
      timeout: 30000,
      maxRetries: 3,
      temperature: 0.7,
      maxTokens: 2000,
    };

    const circuitBreakerConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      expectedResponseTime: 30000,
      monitoringWindow: 60000,
    };

    let service: IAIService;

    switch (provider) {
      case 'openai':
        service = new OpenAIService(config);
        break;
      case 'gemini':
        service = new GeminiService(config);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    this.services.set(serviceKey, service);
    return service;
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4-turbo';
      case 'gemini':
        return 'gemini-pro';
      default:
        return 'gpt-4-turbo';
    }
  }

  async getMetrics(siteId: number): Promise<Record<string, any>> {
    const siteConfig = this.siteConfigs.get(siteId);
    if (!siteConfig) {
      throw new Error(`No AI configuration found for site ${siteId}`);
    }

    const metrics: Record<string, any> = {};

    // Get metrics for primary provider
    try {
      const primaryService = await this.getService(siteConfig.primaryProvider, siteConfig);
      metrics.primary = primaryService.getMetrics();
    } catch (error) {
      metrics.primary = { error: 'Service unavailable' };
    }

    // Get metrics for fallback provider if available
    if (siteConfig.fallbackProvider) {
      try {
        const fallbackService = await this.getService(siteConfig.fallbackProvider, siteConfig);
        metrics.fallback = fallbackService.getMetrics();
      } catch (error) {
        metrics.fallback = { error: 'Service unavailable' };
      }
    }

    return metrics;
  }

  async isHealthy(siteId: number): Promise<boolean> {
    const siteConfig = this.siteConfigs.get(siteId);
    if (!siteConfig) {
      return false;
    }

    // Check primary provider health
    try {
      const primaryService = await this.getService(siteConfig.primaryProvider, siteConfig);
      if (primaryService.isHealthy()) {
        return true;
      }
    } catch (error) {
      // Primary provider is not healthy
    }

    // Check fallback provider health if available
    if (siteConfig.fallbackProvider) {
      try {
        const fallbackService = await this.getService(siteConfig.fallbackProvider, siteConfig);
        return fallbackService.isHealthy();
      } catch (error) {
        // Fallback provider is also not healthy
      }
    }

    return false;
  }

  async resetCircuitBreakers(siteId: number): Promise<void> {
    const siteConfig = this.siteConfigs.get(siteId);
    if (!siteConfig) {
      return;
    }

    // Reset primary provider circuit breaker
    try {
      const primaryService = await this.getService(siteConfig.primaryProvider, siteConfig);
      primaryService.resetCircuitBreaker();
    } catch (error) {
      console.warn(`Could not reset primary provider circuit breaker:`, error);
    }

    // Reset fallback provider circuit breaker if available
    if (siteConfig.fallbackProvider) {
      try {
        const fallbackService = await this.getService(siteConfig.fallbackProvider, siteConfig);
        fallbackService.resetCircuitBreaker();
      } catch (error) {
        console.warn(`Could not reset fallback provider circuit breaker:`, error);
      }
    }
  }

  getPersonality(siteDomain: string): AIPersonality | undefined {
    return this.personalities.get(siteDomain);
  }

  async updateSiteConfiguration(siteId: number, config: any): Promise<void> {
    // Update in database
    await prisma.siteAiConfig.upsert({
      where: { siteId },
      update: config,
      create: { ...config, siteId },
    });

    // Update cache
    this.siteConfigs.set(siteId, config);

    // Clear service instances to force recreation with new config
    const serviceKeys = Array.from(this.services.keys()).filter(key => key.startsWith(`${siteId}_`));
    serviceKeys.forEach(key => this.services.delete(key));
  }
} 