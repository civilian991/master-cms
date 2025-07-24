'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Sparkles, 
  FileText, 
  Hash, 
  Globe, 
  Target,
  Settings,
  Download,
  Copy
} from 'lucide-react';

interface ContentGenerationFormProps {
  siteId: number;
  onSuccess?: (content: any) => void;
  onError?: (error: string) => void;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  template: string;
}

export function ContentGenerationForm({ siteId, onSuccess, onError }: ContentGenerationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [formData, setFormData] = useState({
    contentType: 'article',
    topic: '',
    keywords: [] as string[],
    targetLength: 800,
    language: 'en',
    template: '',
    context: '',
    requirements: [] as string[],
    categoryId: undefined as number | undefined,
    tags: [] as string[],
    authorId: undefined as number | undefined,
  });
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [usageMetrics, setUsageMetrics] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, [siteId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/ai/templates?siteId=${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    setFormData(prev => ({
      ...prev,
      keywords,
    }));
  };

  const handleRequirementsChange = (value: string) => {
    const requirements = value.split(',').map(r => r.trim()).filter(r => r.length > 0);
    setFormData(prev => ({
      ...prev,
      requirements,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedContent(null);
    setQualityMetrics(null);
    setUsageMetrics(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          siteId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.content);
        setQualityMetrics(data.quality);
        setUsageMetrics(data.usage);
        setSuccess('Content generated successfully!');
        onSuccess?.(data.content);
      } else {
        setError(data.error || 'Failed to generate content');
        onError?.(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Content generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Content copied to clipboard!');
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadContent = () => {
    if (!generatedContent) return;

    const content = `Title: ${generatedContent.title}\n\n${generatedContent.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Content Generation
          </CardTitle>
          <CardDescription>
            Generate high-quality content using AI with site-specific optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select 
                  value={formData.contentType} 
                  onValueChange={(value) => handleInputChange('contentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="video_script">Video Script</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="press_release">Press Release</SelectItem>
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="bilingual">Bilingual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="Enter the main topic for content generation"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={formData.keywords.join(', ')}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="Enter keywords separated by commas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetLength">Target Length (words)</Label>
                <Input
                  id="targetLength"
                  type="number"
                  value={formData.targetLength}
                  onChange={(e) => handleInputChange('targetLength', parseInt(e.target.value))}
                  min="100"
                  max="5000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context</Label>
              <Textarea
                id="context"
                value={formData.context}
                onChange={(e) => handleInputChange('context', e.target.value)}
                placeholder="Provide additional context or background information"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Input
                id="requirements"
                value={formData.requirements.join(', ')}
                onChange={(e) => handleRequirementsChange(e.target.value)}
                placeholder="Enter specific requirements separated by commas"
              />
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select 
                  value={formData.template} 
                  onValueChange={(value) => handleInputChange('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.template}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.topic}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Content</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.content)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadContent}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{generatedContent.title}</h3>
              <div className="prose max-w-none">
                {generatedContent.content.split('\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {qualityMetrics && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Quality Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(qualityMetrics.score)}`}>
                      {qualityMetrics.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(qualityMetrics.readability)}`}>
                      {qualityMetrics.readability.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Readability</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(qualityMetrics.seo)}`}>
                      {qualityMetrics.seo.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">SEO</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getQualityColor(qualityMetrics.accuracy)}`}>
                      {qualityMetrics.accuracy.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </div>
              </div>
            )}

            {usageMetrics && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Usage Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <div className="font-medium">{usageMetrics.model}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tokens:</span>
                    <div className="font-medium">{usageMetrics.tokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <div className="font-medium">${usageMetrics.cost.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 