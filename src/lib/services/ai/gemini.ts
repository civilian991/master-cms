import { BaseAIService, ContentGenerationRequest, ContentGenerationResponse, AIServiceConfig } from './base';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export class GeminiService extends BaseAIService {
  private baseUrl: string;

  constructor(config: AIServiceConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    return this.executeWithCircuitBreaker(async () => {
      const prompt = this.buildPrompt(request);
      const geminiRequest = this.buildGeminiRequest(prompt, request);
      
      const response = await this.makeAPIRequest(geminiRequest);
      const content = this.parseResponse(response);
      
      const tokens = response.usageMetadata?.totalTokenCount || 0;
      const cost = this.calculateCost(tokens, this.config.model);
      
      // Update total cost
      this.metrics.totalCost += cost;
      
      return {
        content,
        usage: {
          tokens,
          cost,
          model: this.config.model,
        },
        quality: await this.assessQuality(content, request),
      };
    }, cacheKey);
  }

  async generateBatch(requests: ContentGenerationRequest[]): Promise<ContentGenerationResponse[]> {
    const results: ContentGenerationResponse[] = [];
    
    // Process requests concurrently with rate limiting
    const batchSize = 10; // Gemini allows higher rate limits
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.generateContent(request));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle failed requests
          results.push({
            content: '',
            usage: {
              tokens: 0,
              cost: 0,
              model: this.config.model,
            },
            quality: {
              score: 0,
              readability: 0,
              seo: 0,
              accuracy: 0,
            },
          });
        }
      }
      
      // Rate limiting delay
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  private buildPrompt(request: ContentGenerationRequest): string {
    const { contentType, topic, personality, template, context, requirements } = request;
    
    let prompt = '';
    
    // System message with personality
    if (personality) {
      prompt += `You are ${personality.name}, ${personality.description}. `;
      prompt += `Your expertise includes: ${personality.expertise.join(', ')}. `;
      prompt += `Write in a ${personality.tone} tone for ${personality.targetAudience}. `;
      prompt += `Writing style: ${personality.writingStyle}. `;
      if (personality.culturalContext) {
        prompt += `Cultural context: ${personality.culturalContext}. `;
      }
    }
    
    // Content type specific instructions
    switch (contentType) {
      case 'article':
        prompt += `Write a comprehensive article about "${topic}". `;
        if (request.targetLength) {
          prompt += `Target length: ${request.targetLength} words. `;
        }
        break;
      case 'summary':
        prompt += `Create a concise summary of "${topic}". `;
        prompt += `Focus on key points and main takeaways. `;
        break;
      case 'social':
        prompt += `Create engaging social media content about "${topic}". `;
        prompt += `Include hashtags and make it shareable. `;
        break;
      case 'video_script':
        prompt += `Write a video script about "${topic}". `;
        prompt += `Include introduction, main points, and conclusion. `;
        break;
      case 'newsletter':
        prompt += `Create a newsletter section about "${topic}". `;
        prompt += `Make it engaging and informative for subscribers. `;
        break;
      case 'press_release':
        prompt += `Write a professional press release about "${topic}". `;
        prompt += `Follow standard press release format. `;
        break;
      case 'blog_post':
        prompt += `Write a blog post about "${topic}". `;
        prompt += `Make it engaging and SEO-friendly. `;
        break;
    }
    
    // Additional context and requirements
    if (context) {
      prompt += `Context: ${context}. `;
    }
    
    if (requirements && requirements.length > 0) {
      prompt += `Requirements: ${requirements.join(', ')}. `;
    }
    
    // Template if provided
    if (template) {
      prompt += `Use this template structure: ${template}. `;
    }
    
    // Language instruction
    if (request.language === 'ar') {
      prompt += `Write in Arabic. `;
    } else if (request.language === 'bilingual') {
      prompt += `Write in both English and Arabic. `;
    }
    
    return prompt;
  }

  private buildGeminiRequest(prompt: string, request: ContentGenerationRequest): GeminiRequest {
    return {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: this.config.temperature || 0.7,
        maxOutputTokens: this.config.maxTokens || 2000,
        topP: 1,
        topK: 40,
      },
    };
  }

  private async makeAPIRequest(request: GeminiRequest): Promise<GeminiResponse> {
    const model = this.config.model === 'gemini-pro-vision' ? 'gemini-pro-vision' : 'gemini-pro';
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private parseResponse(response: GeminiResponse): string {
    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async assessQuality(content: string, request: ContentGenerationRequest): Promise<{
    score: number;
    readability: number;
    seo: number;
    accuracy: number;
  }> {
    // Basic quality assessment
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const paragraphCount = content.split(/\n\s*\n/).length;
    
    // Readability score (Flesch Reading Ease approximation)
    const avgSentenceLength = wordCount / sentenceCount;
    const readability = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 10) * 2));
    
    // SEO score based on content structure
    const hasTitle = content.includes('#') || content.toLowerCase().includes('title');
    const hasKeywords = request.keywords?.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ) || false;
    const seo = (hasTitle ? 30 : 0) + (hasKeywords ? 40 : 0) + (wordCount > 300 ? 30 : wordCount / 10);
    
    // Accuracy score (placeholder - would integrate with fact-checking service)
    const accuracy = 85; // Default high score, would be validated by human review
    
    // Overall quality score
    const score = (readability + seo + accuracy) / 3;
    
    return {
      score: Math.min(100, Math.max(0, score)),
      readability: Math.min(100, Math.max(0, readability)),
      seo: Math.min(100, Math.max(0, seo)),
      accuracy: Math.min(100, Math.max(0, accuracy)),
    };
  }
} 