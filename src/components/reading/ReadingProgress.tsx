'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Eye, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  BookOpen,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadingProgressProps {
  articleId: string
  content: string
  onProgressUpdate?: (data: ReadingProgressData) => void
  className?: string
}

interface ReadingProgressData {
  progress: number
  timeSpent: number
  wordsRead: number
  averageWPM: number
  isCompleted: boolean
}

interface ReadingStats {
  totalReadingTime: number
  articlesCompleted: number
  currentStreak: number
  averageWPM: number
  weeklyGoal: number
  weeklyProgress: number
}

export function ReadingProgress({ 
  articleId, 
  content, 
  onProgressUpdate,
  className 
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime] = useState(Date.now())
  const [isVisible, setIsVisible] = useState(true)
  const [wordsRead, setWordsRead] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0)
  
  // User reading stats (would come from API)
  const [stats] = useState<ReadingStats>({
    totalReadingTime: 1250, // minutes
    articlesCompleted: 47,
    currentStreak: 12,
    averageWPM: 220,
    weeklyGoal: 300, // minutes
    weeklyProgress: 185 // minutes this week
  })

  const totalWords = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const averageWPM = 200

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  useEffect(() => {
    const handleScroll = () => {
      const article = document.getElementById('article-content')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY

      // Calculate reading progress
      const totalHeight = documentHeight - windowHeight
      const currentProgress = Math.min(100, Math.max(0, (scrollTop / totalHeight) * 100))
      
      setProgress(currentProgress)
      
      // Calculate words read based on scroll position
      const readWords = Math.floor((currentProgress / 100) * totalWords)
      setWordsRead(readWords)
      
      // Calculate time remaining
      const remainingWords = totalWords - readWords
      const timeRemaining = remainingWords / averageWPM
      setEstimatedTimeRemaining(timeRemaining)

      // Calculate average WPM for this session
      const sessionWPM = timeSpent > 0 ? (readWords / (timeSpent / 60)) : 0

      const progressData: ReadingProgressData = {
        progress: currentProgress,
        timeSpent,
        wordsRead: readWords,
        averageWPM: sessionWPM,
        isCompleted: currentProgress >= 95
      }

      onProgressUpdate?.(progressData)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [totalWords, timeSpent, onProgressUpdate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (!isVisible) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 left-6 z-40 shadow-lg"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Progress
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed bottom-6 left-6 z-40 w-80 shadow-lg",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Reading Progress
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}% complete</span>
            <span>{estimatedTimeRemaining > 0 ? `${Math.ceil(estimatedTimeRemaining)} min left` : 'Complete!'}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Session Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Time</span>
            </div>
            <div className="font-medium">{formatTime(timeSpent)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>Words Read</span>
            </div>
            <div className="font-medium">{wordsRead.toLocaleString()}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>Speed</span>
            </div>
            <div className="font-medium">
              {timeSpent > 60 ? Math.round((wordsRead / (timeSpent / 60))) : stats.averageWPM} WPM
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span>Remaining</span>
            </div>
            <div className="font-medium">{(totalWords - wordsRead).toLocaleString()}</div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              Weekly Goal
            </span>
            <span className="font-medium">{stats.weeklyProgress}/{stats.weeklyGoal}m</span>
          </div>
          <Progress 
            value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
            className="h-1.5"
          />
        </div>

        {/* Achievement Badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Award className="h-3 w-3" />
            {stats.currentStreak} day streak
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {stats.articlesCompleted} completed
          </Badge>
        </div>

        {/* Completion Animation */}
        {progress >= 95 && (
          <div className="text-center py-2 animate-pulse">
            <Badge className="bg-green-500 text-white">
              <Award className="h-3 w-3 mr-1" />
              Article Completed! 🎉
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}