'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Target, 
  Calendar, 
  Clock,
  BookOpen,
  Zap,
  Trophy,
  TrendingUp,
  Settings,
  Award,
  Flame,
  CheckCircle,
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Goal {
  id: string
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  category: 'time' | 'articles' | 'streak' | 'categories' | 'wpm'
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline?: string
  createdAt: string
  isActive: boolean
  icon: React.ReactNode
  color: string
  reward?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlockedAt?: string
  progress?: number
  maxProgress?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface ReadingGoalsProps {
  userId?: string
  className?: string
}

export function ReadingGoals({
  userId,
  className
}: ReadingGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    type: 'daily' as Goal['type'],
    category: 'time' as Goal['category'],
    target: 30,
    title: '',
    description: ''
  })

  useEffect(() => {
    loadGoalsAndAchievements()
  }, [userId])

  const loadGoalsAndAchievements = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockGoals: Goal[] = [
        {
          id: '1',
          type: 'daily',
          category: 'time',
          title: 'Daily Reading Time',
          description: 'Read for at least 30 minutes every day',
          target: 30,
          current: 23,
          unit: 'minutes',
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-blue-500',
          reward: '10 XP daily'
        },
        {
          id: '2',
          type: 'daily',
          category: 'articles',
          title: 'Daily Articles',
          description: 'Complete 2 articles per day',
          target: 2,
          current: 1,
          unit: 'articles',
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          icon: <BookOpen className="h-4 w-4" />,
          color: 'bg-green-500',
          reward: '15 XP daily'
        },
        {
          id: '3',
          type: 'weekly',
          category: 'categories',
          title: 'Diverse Reading',
          description: 'Read from at least 5 different categories this week',
          target: 5,
          current: 3,
          unit: 'categories',
          deadline: '2024-01-21T23:59:59Z',
          createdAt: '2024-01-15T00:00:00Z',
          isActive: true,
          icon: <Target className="h-4 w-4" />,
          color: 'bg-purple-500',
          reward: '50 XP weekly'
        },
        {
          id: '4',
          type: 'custom',
          category: 'streak',
          title: 'Reading Streak',
          description: 'Maintain a 30-day reading streak',
          target: 30,
          current: 12,
          unit: 'days',
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          icon: <Flame className="h-4 w-4" />,
          color: 'bg-orange-500',
          reward: '200 XP + Badge'
        },
        {
          id: '5',
          type: 'monthly',
          category: 'wpm',
          title: 'Speed Reader',
          description: 'Increase reading speed to 300 WPM',
          target: 300,
          current: 245,
          unit: 'WPM',
          deadline: '2024-01-31T23:59:59Z',
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          icon: <Zap className="h-4 w-4" />,
          color: 'bg-yellow-500',
          reward: '100 XP + Speed Badge'
        }
      ]

      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first article',
          icon: <BookOpen className="h-4 w-4" />,
          unlockedAt: '2024-01-10T14:30:00Z',
          rarity: 'common'
        },
        {
          id: '2',
          title: 'Speed Demon',
          description: 'Read at 250+ WPM',
          icon: <Zap className="h-4 w-4" />,
          unlockedAt: '2024-01-12T16:20:00Z',
          rarity: 'rare'
        },
        {
          id: '3',
          title: 'Streak Master',
          description: 'Achieve a 14-day streak',
          icon: <Flame className="h-4 w-4" />,
          progress: 12,
          maxProgress: 14,
          rarity: 'epic'
        },
        {
          id: '4',
          title: 'Knowledge Seeker',
          description: 'Read 100 articles',
          icon: <Trophy className="h-4 w-4" />,
          progress: 47,
          maxProgress: 100,
          rarity: 'legendary'
        }
      ]
      
      setGoals(mockGoals)
      setAchievements(mockAchievements)
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateGoal = async (goalId: string, newTarget: number) => {
    try {
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, target: newTarget } : goal
      ))
      setEditingGoal(null)
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return
    
    try {
      const goal: Goal = {
        id: Date.now().toString(),
        type: newGoal.type,
        category: newGoal.category,
        title: newGoal.title,
        description: newGoal.description,
        target: newGoal.target,
        current: 0,
        unit: getUnitForCategory(newGoal.category),
        createdAt: new Date().toISOString(),
        isActive: true,
        icon: getIconForCategory(newGoal.category),
        color: getColorForCategory(newGoal.category)
      }
      
      setGoals([...goals, goal])
      setNewGoal({
        type: 'daily',
        category: 'time',
        target: 30,
        title: '',
        description: ''
      })
      setShowNewGoalForm(false)
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const getUnitForCategory = (category: Goal['category']): string => {
    switch (category) {
      case 'time': return 'minutes'
      case 'articles': return 'articles'
      case 'streak': return 'days'
      case 'categories': return 'categories'
      case 'wpm': return 'WPM'
      default: return 'units'
    }
  }

  const getIconForCategory = (category: Goal['category']): React.ReactNode => {
    switch (category) {
      case 'time': return <Clock className="h-4 w-4" />
      case 'articles': return <BookOpen className="h-4 w-4" />
      case 'streak': return <Flame className="h-4 w-4" />
      case 'categories': return <Target className="h-4 w-4" />
      case 'wpm': return <Zap className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getColorForCategory = (category: Goal['category']): string => {
    switch (category) {
      case 'time': return 'bg-blue-500'
      case 'articles': return 'bg-green-500'
      case 'streak': return 'bg-orange-500'
      case 'categories': return 'bg-purple-500'
      case 'wpm': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
    }
  }

  const formatTimeRemaining = (deadline: string): string => {
    const remaining = new Date(deadline).getTime() - new Date().getTime()
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Reading Goals
          </CardTitle>
          <CardDescription>Loading your reading goals...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeGoals = goals.filter(g => g.isActive)
  const completedGoals = goals.filter(g => g.current >= g.target)
  const unlockedAchievements = achievements.filter(a => a.unlockedAt)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Reading Goals
          </CardTitle>
          <Button onClick={() => setShowNewGoalForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>
        <CardDescription>
          Set and track your reading objectives and achievements
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Goals ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="achievements">Achievements ({unlockedAchievements.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-6">
            {/* New Goal Form */}
            {showNewGoalForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create New Goal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <select
                        value={newGoal.type}
                        onChange={(e) => setNewGoal({...newGoal, type: e.target.value as Goal['type']})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({...newGoal, category: e.target.value as Goal['category']})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="time">Reading Time</option>
                        <option value="articles">Articles Read</option>
                        <option value="streak">Reading Streak</option>
                        <option value="categories">Category Diversity</option>
                        <option value="wpm">Reading Speed</option>
                      </select>
                    </div>
                  </div>
                  
                  <Input
                    placeholder="Goal title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  />
                  
                  <Input
                    placeholder="Description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target ({getUnitForCategory(newGoal.category)})</label>
                    <Input
                      type="number"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({...newGoal, target: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateGoal} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Create Goal
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewGoalForm(false)} 
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Goals */}
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full text-white", goal.color)}>
                          {goal.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{goal.title}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {goal.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingGoal(goal.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progress</span>
                        {editingGoal === goal.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              defaultValue={goal.target}
                              className="w-20 h-6 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const target = parseInt((e.target as HTMLInputElement).value)
                                  handleUpdateGoal(goal.id, target)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setEditingGoal(null)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {goal.current}/{goal.target} {goal.unit}
                          </span>
                        )}
                      </div>
                      
                      <Progress 
                        value={(goal.current / goal.target) * 100} 
                        className="h-2"
                      />
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {Math.round((goal.current / goal.target) * 100)}% complete
                        </span>
                        {goal.deadline && (
                          <span>{formatTimeRemaining(goal.deadline)}</span>
                        )}
                      </div>
                      
                      {goal.reward && (
                        <div className="bg-muted/50 rounded p-2 text-xs">
                          <span className="font-medium">Reward: </span>
                          {goal.reward}
                        </div>
                      )}
                      
                      {goal.current >= goal.target && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded p-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Goal Completed!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {activeGoals.length === 0 && (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No active goals</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set your first reading goal to start tracking progress
                  </p>
                  <Button onClick={() => setShowNewGoalForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-4">
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={cn("border-2", getRarityColor(achievement.rarity))}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        achievement.unlockedAt 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {achievement.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {achievement.rarity}
                          </Badge>
                          {achievement.unlockedAt && (
                            <Award className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                        
                        {achievement.progress !== undefined && (
                          <div className="space-y-1">
                            <Progress 
                              value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              {achievement.progress}/{achievement.maxProgress}
                            </div>
                          </div>
                        )}
                        
                        {achievement.unlockedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <div className="space-y-4">
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500 text-white">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800">{goal.title}</h3>
                        <p className="text-sm text-green-600">{goal.description}</p>
                        <div className="text-xs text-green-600 mt-1">
                          Completed: {goal.current}/{goal.target} {goal.unit}
                        </div>
                      </div>
                      <Badge className="bg-green-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {completedGoals.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No completed goals yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your first goal to see it here
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}