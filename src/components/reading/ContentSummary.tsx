'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, 
  Brain, 
  Clock, 
  Eye,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentSummaryProps {
  articleId: string
  content: string
  title: string
  category: string
  readingTime: number
  className?: string
}

interface SummaryData {
  keyPoints: string[]
  tldr: string
  readingLevel: 'Beginner' | 'Intermediate' | 'Advanced'
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  complexity: number // 1-10 scale
  topics: string[]
  readingTimeBreakdown: {
    quickScan: number
    focused: number
    detailed: number
  }
}

export function ContentSummary({
  articleId,
  content,
  title,
  category,
  readingTime,
  className
}: ContentSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed'>('brief')

  useEffect(() => {
    generateSummary()
  }, [articleId, summaryType])

  const generateSummary = async () => {
    setIsLoading(true)
    try {
      // Mock AI summary generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockSummary: SummaryData = {
        keyPoints: [
          'AI is revolutionizing media production workflows across the industry',
          'Automated editing tools are becoming more sophisticated and accessible',
          'Human creativity remains essential despite technological advances',
          'Balance between automation and human insight is key to success',
          'Future developments will focus on context-aware AI systems'
        ],
        tldr: 'Artificial intelligence is transforming media production by automating complex tasks while amplifying human creativity, with the most successful approaches combining AI efficiency with human insight and cultural understanding.',
        readingLevel: 'Intermediate',
        sentiment: 'Positive',
        complexity: 6,
        topics: ['Artificial Intelligence', 'Media Production', 'Automation', 'Creative Technology', 'Future Trends'],
        readingTimeBreakdown: {
          quickScan: Math.ceil(readingTime * 0.3),
          focused: readingTime,
          detailed: Math.ceil(readingTime * 1.5)
        }
      }
      
      setSummary(mockSummary)
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600 bg-green-50'
      case 'Negative': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const getComplexityLabel = (complexity: number) => {
    if (complexity <= 3) return 'Simple'
    if (complexity <= 6) return 'Moderate'
    if (complexity <= 8) return 'Complex'
    return 'Advanced'
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Summary
            </CardTitle>
            <Skeleton className="h-8 w-20" />
          </div>
          <CardDescription>
            Generating intelligent content analysis...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-18" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) return null

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Summary
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={summaryType === 'brief' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSummaryType('brief')}
            >
              Brief
            </Button>
            <Button
              variant={summaryType === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSummaryType('detailed')}
            >
              Detailed
            </Button>
          </div>
        </div>
        <CardDescription>
          AI-powered content analysis and insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Reading Level</span>
            </div>
            <Badge variant="outline">{summary.readingLevel}</Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>Complexity</span>
            </div>
            <Badge variant="secondary">
              {getComplexityLabel(summary.complexity)} ({summary.complexity}/10)
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Sentiment</span>
            </div>
            <Badge className={getSentimentColor(summary.sentiment)}>
              {summary.sentiment}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Est. Time</span>
            </div>
            <Badge variant="outline">
              {summary.readingTimeBreakdown.focused}min
            </Badge>
          </div>
        </div>

        {/* TL;DR */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            TL;DR
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
            {summary.tldr}
          </p>
        </div>

        {/* Reading Time Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Reading Time Options
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-medium">{summary.readingTimeBreakdown.quickScan}m</div>
              <div className="text-muted-foreground">Quick Scan</div>
            </div>
            <div className="text-center p-2 bg-primary/10 rounded border">
              <div className="font-medium">{summary.readingTimeBreakdown.focused}m</div>
              <div className="text-muted-foreground">Focused Read</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-medium">{summary.readingTimeBreakdown.detailed}m</div>
              <div className="text-muted-foreground">Deep Dive</div>
            </div>
          </div>
        </div>

        {/* Key Points */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Key Points {summaryType === 'detailed' ? `(${summary.keyPoints.length})` : '(Top 3)'}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <ul className="space-y-2">
            {(isExpanded || summaryType === 'detailed' 
              ? summary.keyPoints 
              : summary.keyPoints.slice(0, 3)
            ).map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Topics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Topics Covered
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Regenerate Button */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSummary}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            Regenerate Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}