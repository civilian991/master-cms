'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  Bookmark,
  Clock,
  Filter,
  Trash2,
  ExternalLink,
  CheckCircle,
  Loader2,
  Settings
} from 'lucide-react'

export default function PreferencesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [preferences, setPreferences] = useState({
    emailNewsletter: true,
    weeklyDigest: false,
    categoryUpdates: true,
    savedArticleReminders: true,
    darkMode: false,
    autoBookmark: false,
    readingGoals: true
  })

  const categories = [
    { id: 1, name: 'Technology', subscribed: true, count: 42 },
    { id: 2, name: 'Science', subscribed: false, count: 28 },
    { id: 3, name: 'Business', subscribed: true, count: 35 },
    { id: 4, name: 'Health', subscribed: false, count: 19 },
    { id: 5, name: 'Politics', subscribed: true, count: 31 },
  ]

  const bookmarkedArticles = [
    {
      id: 1,
      title: 'Advanced React Patterns You Should Know',
      category: 'Technology',
      savedAt: '2024-01-15',
      readStatus: 'unread'
    },
    {
      id: 2,
      title: 'The Future of Sustainable Energy',
      category: 'Science', 
      savedAt: '2024-01-14',
      readStatus: 'read'
    },
    {
      id: 3,
      title: 'Building Resilient Teams in Remote Work',
      category: 'Business',
      savedAt: '2024-01-12',
      readStatus: 'reading'
    }
  ]

  const readingHistory = [
    {
      id: 1,
      title: 'Understanding TypeScript Generics',
      category: 'Technology',
      readAt: '2 hours ago',
      readingTime: '8 min'
    },
    {
      id: 2,
      title: 'Climate Change Solutions for 2024',
      category: 'Science',
      readAt: '1 day ago', 
      readingTime: '12 min'
    },
    {
      id: 3,
      title: 'Startup Funding Trends',
      category: 'Business',
      readAt: '2 days ago',
      readingTime: '6 min'
    }
  ]

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSavePreferences = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Preferences saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Save preferences error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getReadStatusColor = (status: string) => {
    switch (status) {
      case 'read': return 'bg-green-50 text-green-700'
      case 'reading': return 'bg-blue-50 text-blue-700' 
      case 'unread': return 'bg-gray-50 text-gray-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Content Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Content Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize your reading experience and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Reading Preferences</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-gray-500">Use dark theme for better reading</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoBookmark">Auto Bookmark</Label>
                  <p className="text-sm text-gray-500">Automatically save articles you spend time reading</p>
                </div>
                <Switch
                  id="autoBookmark"
                  checked={preferences.autoBookmark}
                  onCheckedChange={(checked) => handlePreferenceChange('autoBookmark', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="readingGoals">Reading Goals</Label>
                  <p className="text-sm text-gray-500">Track your reading progress and goals</p>
                </div>
                <Switch
                  id="readingGoals"
                  checked={preferences.readingGoals}
                  onCheckedChange={(checked) => handlePreferenceChange('readingGoals', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNewsletter">Email Newsletter</Label>
                  <p className="text-sm text-gray-500">Receive our weekly newsletter</p>
                </div>
                <Switch
                  id="emailNewsletter"
                  checked={preferences.emailNewsletter}
                  onCheckedChange={(checked) => handlePreferenceChange('emailNewsletter', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="categoryUpdates">Category Updates</Label>
                  <p className="text-sm text-gray-500">Get notified about new articles in your favorite categories</p>
                </div>
                <Switch
                  id="categoryUpdates"
                  checked={preferences.categoryUpdates}
                  onCheckedChange={(checked) => handlePreferenceChange('categoryUpdates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="savedArticleReminders">Bookmark Reminders</Label>
                  <p className="text-sm text-gray-500">Reminders to read your saved articles</p>
                </div>
                <Switch
                  id="savedArticleReminders"
                  checked={preferences.savedArticleReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('savedArticleReminders', checked)}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Button onClick={handleSavePreferences} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookmarked Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bookmark className="h-5 w-5" />
              <span>Bookmarked Articles</span>
            </CardTitle>
            <CardDescription>
              Articles you've saved for later reading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookmarkedArticles.map((article) => (
                <div key={article.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{article.title}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>Saved {article.savedAt}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getReadStatusColor(article.readStatus)}`}
                      >
                        {article.readStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All Bookmarks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Reading History</span>
            </CardTitle>
            <CardDescription>
              Your recent reading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {readingHistory.map((article) => (
                <div key={article.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{article.title}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{article.readAt}</span>
                      <span>•</span>
                      <span>{article.readingTime} read</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View Full History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Category Subscriptions</span>
          </CardTitle>
          <CardDescription>
            Manage which content categories you want to follow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`p-4 border rounded-lg ${
                  category.subscribed ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{category.name}</h4>
                  <Switch
                    checked={category.subscribed}
                    onCheckedChange={() => {
                      // Handle category subscription toggle
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {category.count} articles available
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}