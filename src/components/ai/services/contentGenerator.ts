'use client';

import {
  ContentGenerationRequest,
  ContentTemplate,
  ContentType,
  ContentTone,
  ContentLength,
  SEOTargets,
  CONTENT_LENGTHS,
} from '../types/ai.types';

export class ContentGeneratorService {
  // Template processing
  static processTemplate(template: ContentTemplate, variables: Record<string, any>): string {
    let content = template.structure
      .sort((a, b) => a.order - b.order)
      .map(section => section.content || section.placeholder)
      .join('\n\n');

    // Replace template variables
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  // Request validation
  static validateGenerationRequest(request: ContentGenerationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields
    if (!request.topic?.trim()) {
      errors.push('Topic is required');
    }

    if (!request.targetAudience?.trim()) {
      errors.push('Target audience is required');
    }

    // Topic length validation
    if (request.topic && request.topic.length > 200) {
      errors.push('Topic must be 200 characters or less');
    }

    // Keywords validation
    if (request.keywords && request.keywords.length > 10) {
      errors.push('Maximum 10 keywords allowed');
    }

    // SEO targets validation
    if (request.seoTargets) {
      if (request.seoTargets.primaryKeyword && request.seoTargets.primaryKeyword.length > 100) {
        errors.push('Primary keyword must be 100 characters or less');
      }

      if (request.seoTargets.secondaryKeywords && request.seoTargets.secondaryKeywords.length > 20) {
        errors.push('Maximum 20 secondary keywords allowed');
      }

      if (request.seoTargets.targetLength && request.seoTargets.targetLength < 100) {
        errors.push('Target length must be at least 100 words');
      }

      if (request.seoTargets.focusKeywordDensity && 
          (request.seoTargets.focusKeywordDensity < 0.005 || request.seoTargets.focusKeywordDensity > 0.05)) {
        errors.push('Focus keyword density must be between 0.5% and 5%');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Content length estimation
  static estimateWordCount(length: ContentLength, customLength?: number): number {
    if (length === 'custom' && customLength) {
      return customLength;
    }

    const lengthConfig = CONTENT_LENGTHS.find(l => l.value === length);
    return lengthConfig?.wordCount || 900;
  }

  // Content structure generation
  static generateContentStructure(
    contentType: ContentType,
    wordCount: number
  ): { sections: string[]; estimatedTime: number } {
    const structures: Record<ContentType, string[]> = {
      article: [
        'Introduction',
        'Main Content',
        'Supporting Evidence',
        'Analysis/Discussion',
        'Conclusion',
      ],
      blog_post: [
        'Hook/Introduction',
        'Problem Statement',
        'Solution/Main Content',
        'Examples/Case Studies',
        'Call to Action',
      ],
      newsletter: [
        'Header/Greeting',
        'Featured Content',
        'News Updates',
        'Community Highlights',
        'Footer/Unsubscribe',
      ],
      social_post: [
        'Hook',
        'Main Message',
        'Call to Action',
      ],
      product_description: [
        'Product Overview',
        'Key Features',
        'Benefits',
        'Specifications',
        'Purchase Information',
      ],
      press_release: [
        'Headline',
        'Dateline',
        'Lead Paragraph',
        'Supporting Paragraphs',
        'Boilerplate',
        'Contact Information',
      ],
      email: [
        'Subject Line',
        'Greeting',
        'Main Message',
        'Supporting Details',
        'Call to Action',
        'Signature',
      ],
      landing_page: [
        'Hero Section',
        'Value Proposition',
        'Features/Benefits',
        'Social Proof',
        'Call to Action',
      ],
      case_study: [
        'Executive Summary',
        'Challenge/Problem',
        'Solution',
        'Implementation',
        'Results',
        'Conclusion',
      ],
      whitepaper: [
        'Executive Summary',
        'Introduction',
        'Problem Analysis',
        'Methodology',
        'Findings',
        'Recommendations',
        'Conclusion',
      ],
    };

    const sections = structures[contentType] || structures.article;
    const estimatedTime = Math.ceil(wordCount / 200); // 200 words per minute reading speed

    return { sections, estimatedTime };
  }

  // SEO optimization helpers
  static generateSEOTargets(
    topic: string,
    keywords: string[] = [],
    contentType: ContentType
  ): SEOTargets {
    const primaryKeyword = keywords[0] || topic.split(' ').slice(0, 3).join(' ');
    const secondaryKeywords = keywords.slice(1, 6);

    // Content type specific targets
    const lengthTargets: Record<ContentType, number> = {
      article: 1500,
      blog_post: 1000,
      newsletter: 800,
      social_post: 100,
      product_description: 300,
      press_release: 600,
      email: 200,
      landing_page: 800,
      case_study: 2000,
      whitepaper: 3000,
    };

    return {
      primaryKeyword,
      secondaryKeywords,
      targetLength: lengthTargets[contentType],
      focusKeywordDensity: 0.02, // 2%
    };
  }

  // Content tone suggestions
  static suggestToneForContent(
    contentType: ContentType,
    targetAudience: string
  ): ContentTone[] {
    const toneMap: Record<ContentType, ContentTone[]> = {
      article: ['professional', 'authoritative', 'educational'],
      blog_post: ['casual', 'friendly', 'conversational'],
      newsletter: ['friendly', 'conversational', 'entertaining'],
      social_post: ['casual', 'entertaining', 'persuasive'],
      product_description: ['persuasive', 'professional', 'authoritative'],
      press_release: ['professional', 'authoritative'],
      email: ['professional', 'friendly', 'persuasive'],
      landing_page: ['persuasive', 'professional', 'authoritative'],
      case_study: ['professional', 'authoritative', 'educational'],
      whitepaper: ['professional', 'authoritative', 'educational'],
    };

    let suggestions = toneMap[contentType] || ['professional'];

    // Adjust based on audience
    if (targetAudience.toLowerCase().includes('consumer') || 
        targetAudience.toLowerCase().includes('general')) {
      suggestions = suggestions.filter(tone => 
        tone !== 'authoritative' && tone !== 'professional'
      );
      suggestions.unshift('friendly', 'conversational');
    }

    if (targetAudience.toLowerCase().includes('business') || 
        targetAudience.toLowerCase().includes('professional')) {
      suggestions = suggestions.filter(tone => 
        tone !== 'entertaining' && tone !== 'casual'
      );
      suggestions.unshift('professional', 'authoritative');
    }

    // Remove duplicates and limit to 3
    return [...new Set(suggestions)].slice(0, 3);
  }

  // Content quality scoring
  static scoreContentQuality(content: string): {
    overall: number;
    readability: number;
    structure: number;
    engagement: number;
    seo: number;
  } {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const paragraphCount = content.split(/\n\s*\n/).length;

    // Readability score (simplified)
    const avgWordsPerSentence = wordCount / sentenceCount;
    const readability = Math.max(0, Math.min(100, 
      100 - (avgWordsPerSentence - 15) * 2
    ));

    // Structure score
    const hasHeaders = /#{1,6}\s/.test(content) || /<h[1-6]/.test(content);
    const hasBullets = /^\s*[-*+]\s/m.test(content) || /<[uo]l/.test(content);
    const structure = (hasHeaders ? 40 : 0) + (hasBullets ? 30 : 0) + 
                     (paragraphCount > 3 ? 30 : paragraphCount * 10);

    // Engagement score (simplified)
    const hasQuestions = /\?/.test(content);
    const hasCallToAction = /(click|visit|download|subscribe|contact)/i.test(content);
    const engagement = (hasQuestions ? 30 : 0) + (hasCallToAction ? 40 : 0) + 
                      Math.min(30, wordCount / 50);

    // SEO score (simplified)
    const hasKeywords = wordCount > 300;
    const hasMetaElements = /<title>|<meta/.test(content);
    const seo = (hasKeywords ? 50 : 0) + (hasMetaElements ? 30 : 0) + 
               Math.min(20, wordCount / 100);

    const overall = (readability + structure + engagement + seo) / 4;

    return {
      overall: Math.round(overall),
      readability: Math.round(readability),
      structure: Math.round(structure),
      engagement: Math.round(engagement),
      seo: Math.round(seo),
    };
  }

  // Content enhancement suggestions
  static generateEnhancementSuggestions(content: string): {
    type: 'structure' | 'readability' | 'seo' | 'engagement';
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }[] {
    const suggestions: {
      type: 'structure' | 'readability' | 'seo' | 'engagement';
      suggestion: string;
      priority: 'low' | 'medium' | 'high';
    }[] = [];
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    // Structure suggestions
    if (!/#{1,6}\s/.test(content) && !/<h[1-6]/.test(content)) {
      suggestions.push({
        type: 'structure',
        suggestion: 'Add headings to improve content structure and readability',
        priority: 'high',
      });
    }

    if (!/^\s*[-*+]\s/m.test(content) && !/<[uo]l/.test(content)) {
      suggestions.push({
        type: 'structure',
        suggestion: 'Consider adding bullet points or lists to break up dense text',
        priority: 'medium',
      });
    }

    // Readability suggestions
    if (avgWordsPerSentence > 25) {
      suggestions.push({
        type: 'readability',
        suggestion: 'Consider breaking up long sentences for better readability',
        priority: 'high',
      });
    }

    if (wordCount < 300) {
      suggestions.push({
        type: 'seo',
        suggestion: 'Content is quite short. Consider expanding for better SEO performance',
        priority: 'medium',
      });
    }

    // Engagement suggestions
    if (!/\?/.test(content)) {
      suggestions.push({
        type: 'engagement',
        suggestion: 'Add questions to increase reader engagement',
        priority: 'low',
      });
    }

    if (!(/(click|visit|download|subscribe|contact)/i.test(content))) {
      suggestions.push({
        type: 'engagement',
        suggestion: 'Include a clear call-to-action to guide reader behavior',
        priority: 'medium',
      });
    }

    return suggestions;
  }

  // Content formatting utilities
  static formatForContentType(content: string, contentType: ContentType): string {
    switch (contentType) {
      case 'social_post':
        return this.formatSocialPost(content);
      case 'newsletter':
        return this.formatNewsletter(content);
      case 'email':
        return this.formatEmail(content);
      default:
        return content;
    }
  }

  private static formatSocialPost(content: string): string {
    // Add hashtags, emojis, and social formatting
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      // Add emoji to first line if it doesn't have one
      if (!/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(lines[0])) {
        lines[0] = '✨ ' + lines[0];
      }
    }

    return lines.join('\n\n');
  }

  private static formatNewsletter(content: string): string {
    // Add newsletter-specific formatting
    const sections = content.split('\n\n');
    return sections.map((section, index) => {
      if (index === 0) {
        return `📧 **${section}**`; // Header
      }
      return section;
    }).join('\n\n');
  }

  private static formatEmail(content: string): string {
    // Add email-specific formatting
    const lines = content.split('\n');
    
    // Add greeting if not present
    if (!lines[0]?.toLowerCase().includes('hi ') && 
        !lines[0]?.toLowerCase().includes('hello ') &&
        !lines[0]?.toLowerCase().includes('dear ')) {
      lines.unshift('Hi there,\n');
    }

    // Add sign-off if not present
    if (!content.toLowerCase().includes('best regards') &&
        !content.toLowerCase().includes('sincerely') &&
        !content.toLowerCase().includes('thank you')) {
      lines.push('\nBest regards,');
    }

    return lines.join('\n');
  }

  // Performance monitoring
  static trackGenerationMetrics(
    startTime: number,
    endTime: number,
    wordCount: number,
    contentType: ContentType
  ): {
    duration: number;
    wordsPerSecond: number;
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const duration = endTime - startTime;
    const wordsPerSecond = wordCount / (duration / 1000);
    
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (wordsPerSecond > 100) efficiency = 'excellent';
    else if (wordsPerSecond > 50) efficiency = 'good';
    else if (wordsPerSecond > 20) efficiency = 'fair';
    else efficiency = 'poor';

    return {
      duration,
      wordsPerSecond: Math.round(wordsPerSecond * 100) / 100,
      efficiency,
    };
  }
}

export default ContentGeneratorService; 