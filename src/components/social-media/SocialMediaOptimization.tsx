'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Clock, Users, BarChart3 } from 'lucide-react';

interface OptimizationMetrics {
  readability: number;
  engagement: number;
  hashtagScore: number;
  timingScore: number;
  overallScore: number;
}

interface OptimizationSuggestion {
  type: 'hashtag' | 'timing' | 'content' | 'format';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
}

interface PlatformOptimization {
  platform: string;
  characterLimit: number;
  hashtagLimit: number;
  imageCount: number;
  videoLength: number;
  bestTimes: string[];
  hashtagSuggestions: string[];
}

export function SocialMediaOptimization({ siteId }: { siteId: string }) {
  const [content, setContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [loading, setLoading] = useState(false);

  const platformConfigs: PlatformOptimization[] = [
    {
      platform: 'TWITTER',
      characterLimit: 280,
      hashtagLimit: 2,
      imageCount: 4,
      videoLength: 140,
      bestTimes: ['9:00 AM', '12:00 PM', '3:00 PM', '7:00 PM'],
      hashtagSuggestions: ['#tech', '#innovation', '#startup', '#business'],
    },
    {
      platform: 'LINKEDIN',
      characterLimit: 3000,
      hashtagLimit: 5,
      imageCount: 1,
      videoLength: 600,
      bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM'],
      hashtagSuggestions: ['#leadership', '#networking', '#career', '#professional'],
    },
    {
      platform: 'FACEBOOK',
      characterLimit: 63206,
      hashtagLimit: 10,
      imageCount: 10,
      videoLength: 240,
      bestTimes: ['9:00 AM', '1:00 PM', '3:00 PM', '7:00 PM'],
      hashtagSuggestions: ['#social', '#community', '#engagement', '#viral'],
    },
  ];

  const analyzeContent = async () => {
    if (!content || !selectedPlatform) {
      alert('Please enter content and select a platform');
      return;
    }

    setLoading(true);
    try {
      // Simulate content analysis
      await new Promise(resolve => setTimeout(resolve, 1000));

      const config = platformConfigs.find(c => c.platform === selectedPlatform);
      if (!config) return;

      // Calculate metrics
      const readability = calculateReadability(content);
      const engagement = calculateEngagementScore(content, config);
      const hashtagScore = calculateHashtagScore(content, config);
      const timingScore = calculateTimingScore();
      const overallScore = Math.round((readability + engagement + hashtagScore + timingScore) / 4);

      const newMetrics: OptimizationMetrics = {
        readability,
        engagement,
        hashtagScore,
        timingScore,
        overallScore,
      };

      setMetrics(newMetrics);

      // Generate suggestions
      const newSuggestions = generateSuggestions(content, config, newMetrics);
      setSuggestions(newSuggestions);

      // Generate optimized content
      const optimized = generateOptimizedContent(content, config, newSuggestions);
      setOptimizedContent(optimized);

    } catch (error) {
      console.error('Failed to analyze content:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadability = (text: string): number => {
    const words = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = text.toLowerCase().replace(/[^a-z]/g, '').split('').filter(char => 'aeiou'.includes(char)).length;
    
    if (words === 0 || sentences === 0) return 0;
    
    const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, fleschScore));
  };

  const calculateEngagementScore = (text: string, config: PlatformOptimization): number => {
    let score = 50; // Base score

    // Length optimization
    const lengthRatio = text.length / config.characterLimit;
    if (lengthRatio > 0.8 && lengthRatio < 1.0) score += 20;
    else if (lengthRatio > 0.6 && lengthRatio < 0.8) score += 15;
    else if (lengthRatio < 0.3) score -= 10;

    // Question marks
    const questions = (text.match(/\?/g) || []).length;
    score += questions * 5;

    // Exclamation marks
    const exclamations = (text.match(/!/g) || []).length;
    score += exclamations * 3;

    // Mentions
    const mentions = (text.match(/@\w+/g) || []).length;
    score += mentions * 8;

    return Math.max(0, Math.min(100, score));
  };

  const calculateHashtagScore = (text: string, config: PlatformOptimization): number => {
    const hashtags = (text.match(/#\w+/g) || []).length;
    const hashtagRatio = hashtags / config.hashtagLimit;
    
    if (hashtagRatio === 0) return 30; // No hashtags
    if (hashtagRatio <= 0.5) return 80; // Good ratio
    if (hashtagRatio <= 1.0) return 60; // Acceptable
    return 20; // Too many hashtags
  };

  const calculateTimingScore = (): number => {
    const now = new Date();
    const hour = now.getHours();
    
    // Optimal posting times (simplified)
    const optimalHours = [9, 12, 15, 19];
    const timeDiff = Math.min(...optimalHours.map(h => Math.abs(hour - h)));
    
    if (timeDiff === 0) return 100;
    if (timeDiff <= 1) return 80;
    if (timeDiff <= 2) return 60;
    return 40;
  };

  const generateSuggestions = (text: string, config: PlatformOptimization, metrics: OptimizationMetrics): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // Hashtag suggestions
    if (metrics.hashtagScore < 60) {
      suggestions.push({
        type: 'hashtag',
        title: 'Add Relevant Hashtags',
        description: `Consider adding 1-${config.hashtagLimit} relevant hashtags to increase discoverability.`,
        impact: 'high',
        action: `Suggested hashtags: ${config.hashtagSuggestions.slice(0, 3).join(', ')}`,
      });
    }

    // Content length suggestions
    const lengthRatio = text.length / config.characterLimit;
    if (lengthRatio > 1.0) {
      suggestions.push({
        type: 'content',
        title: 'Content Too Long',
        description: `Your content exceeds the ${config.characterLimit} character limit for ${config.platform}.`,
        impact: 'high',
        action: 'Consider shortening your message or splitting into multiple posts.',
      });
    } else if (lengthRatio < 0.3) {
      suggestions.push({
        type: 'content',
        title: 'Content Too Short',
        description: 'Your content might be too brief to drive meaningful engagement.',
        impact: 'medium',
        action: 'Consider adding more context or details to your message.',
      });
    }

    // Engagement suggestions
    if (metrics.engagement < 60) {
      suggestions.push({
        type: 'content',
        title: 'Improve Engagement',
        description: 'Add questions, calls-to-action, or mentions to increase engagement.',
        impact: 'medium',
        action: 'Try ending with a question or including a call-to-action.',
      });
    }

    // Timing suggestions
    if (metrics.timingScore < 60) {
      suggestions.push({
        type: 'timing',
        title: 'Consider Optimal Timing',
        description: `Best posting times for ${config.platform}: ${config.bestTimes.join(', ')}`,
        impact: 'medium',
        action: 'Schedule your post for one of the optimal times.',
      });
    }

    return suggestions;
  };

  const generateOptimizedContent = (text: string, config: PlatformOptimization, suggestions: OptimizationSuggestion[]): string => {
    let optimized = text;

    // Add hashtags if suggested
    const hashtagSuggestion = suggestions.find(s => s.type === 'hashtag');
    if (hashtagSuggestion && !text.includes('#')) {
      optimized += ` ${config.hashtagSuggestions.slice(0, 2).join(' ')}`;
    }

    // Add engagement elements if suggested
    const engagementSuggestion = suggestions.find(s => s.type === 'content' && s.title === 'Improve Engagement');
    if (engagementSuggestion && !text.includes('?')) {
      optimized += ' What do you think?';
    }

    return optimized;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Content Optimization</h2>
        <Button onClick={analyzeContent} disabled={loading || !content || !selectedPlatform}>
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Input */}
        <Card>
          <CardHeader>
            <CardTitle>Content Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platformConfigs.map((config) => (
                    <SelectItem key={config.platform} value={config.platform}>
                      {config.platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your social media content here..."
                rows={6}
              />
              {selectedPlatform && (
                <div className="text-xs text-gray-500 mt-1">
                  {content.length} / {platformConfigs.find(c => c.platform === selectedPlatform)?.characterLimit} characters
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Results */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Optimization Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}/100
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Readability</span>
                    <span className={getScoreColor(metrics.readability)}>{metrics.readability}</span>
                  </div>
                  <Progress value={metrics.readability} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engagement</span>
                    <span className={getScoreColor(metrics.engagement)}>{metrics.engagement}</span>
                  </div>
                  <Progress value={metrics.engagement} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hashtag Usage</span>
                    <span className={getScoreColor(metrics.hashtagScore)}>{metrics.hashtagScore}</span>
                  </div>
                  <Progress value={metrics.hashtagScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Timing</span>
                    <span className={getScoreColor(metrics.timingScore)}>{metrics.timingScore}</span>
                  </div>
                  <Progress value={metrics.timingScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(suggestion.impact)}>
                        {suggestion.impact.toUpperCase()}
                      </Badge>
                      <h4 className="font-medium">{suggestion.title}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <p className="text-sm font-medium text-blue-600">{suggestion.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimized Content */}
      {optimizedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Optimized Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={optimizedContent}
                readOnly
                rows={4}
                className="bg-gray-50"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setContent(optimizedContent)}
                  variant="outline"
                >
                  Use Optimized Content
                </Button>
                <Button
                  onClick={() => navigator.clipboard.writeText(optimizedContent)}
                  variant="outline"
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Guidelines */}
      {selectedPlatform && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const config = platformConfigs.find(c => c.platform === selectedPlatform);
                if (!config) return null;
                
                return (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Limits</h4>
                      <div className="space-y-1 text-sm">
                        <div>Character limit: {config.characterLimit}</div>
                        <div>Hashtag limit: {config.hashtagLimit}</div>
                        <div>Image count: {config.imageCount}</div>
                        <div>Video length: {config.videoLength}s</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Best Posting Times</h4>
                      <div className="space-y-1 text-sm">
                        {config.bestTimes.map((time, index) => (
                          <div key={index}>{time}</div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 