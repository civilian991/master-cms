'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Wand2, 
  FileText, 
  Eye, 
  Save, 
  Download,
  Sparkles,
  Clock,
  Loader2
} from 'lucide-react'

export default function AIContentGenerator() {
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [contentType, setContentType] = useState('article')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')

  const handleGenerate = async () => {
    setGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      const mockContent = `# ${prompt || 'Generated Article Title'}

## Introduction

This is an AI-generated article that demonstrates the capabilities of our content generation system. The content has been tailored to match the ${tone} tone you requested.

## Main Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Key Points

1. **Enhanced Productivity**: AI-powered content generation significantly improves writing efficiency
2. **Consistent Quality**: Maintains consistent tone and style across all content
3. **SEO Optimization**: Automatically optimizes content for search engines

## Conclusion

This AI-generated content provides a solid foundation that can be further refined and customized to meet specific requirements. The system adapts to various content types and maintains high quality standards.

---

*Generated with AI Content Generator*`
      
      setGeneratedContent(mockContent)
      setGenerating(false)
    }, 3000)
  }

  const handleSave = () => {
    // In a real app, this would save to the database
    alert('Content saved as draft!')
  }

  const handlePublish = () => {
    // In a real app, this would publish the content
    alert('Content scheduled for publishing!')
  }

  const recentGenerations = [
    { title: 'AI in Healthcare: Future Trends', type: 'Article', date: '2 hours ago', status: 'Published' },
    { title: 'Sustainable Technology Solutions', type: 'Blog Post', date: '5 hours ago', status: 'Draft' },
    { title: 'Digital Marketing Strategies', type: 'Guide', date: '1 day ago', status: 'Review' },
    { title: 'Web Development Best Practices', type: 'Tutorial', date: '2 days ago', status: 'Published' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="h-8 w-8 mr-3 text-primary" />
            AI Content Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Generate high-quality content using artificial intelligence
          </p>
        </div>
        <Badge variant="outline" className="flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                Content Generator
              </CardTitle>
              <CardDescription>
                Configure your content generation settings and prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select 
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="article">Article</option>
                  <option value="blog">Blog Post</option>
                  <option value="guide">Guide</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="review">Product Review</option>
                  <option value="news">News Article</option>
                </select>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic/Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your content topic or detailed prompt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              {/* Options Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="technical">Technical</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length
                  </label>
                  <select 
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="short">Short (300-500 words)</option>
                    <option value="medium">Medium (500-1000 words)</option>
                    <option value="long">Long (1000-2000 words)</option>
                    <option value="extended">Extended (2000+ words)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate}
                disabled={generating || !prompt}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          {(generatedContent || generating) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Generated Content
                  </div>
                  {generatedContent && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button size="sm" onClick={handlePublish}>
                        <Eye className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generating ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-gray-600">AI is generating your content...</p>
                      <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Usage Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Articles Generated</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Words Generated</span>
                <Badge variant="outline">8,450</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time Saved</span>
                <Badge variant="outline">4.2 hrs</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Generations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Generations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGenerations.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{item.type}</span>
                      <Badge 
                        variant={item.status === 'Published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Pro Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Be specific with your prompts for better results</p>
                <p>• Specify target audience in your prompt</p>
                <p>• Include keywords for SEO optimization</p>
                <p>• Review and edit generated content before publishing</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 