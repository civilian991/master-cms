'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Mail,
  Phone,
  Globe,
  CheckCircle,
  Settings,
  Loader2,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react'

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [emailSettings, setEmailSettings] = useState({
    newsletter: true,
    weeklyDigest: false,
    articleUpdates: true,
    commentReplies: false,
    systemUpdates: true,
    promotionalEmails: false
  })

  const [pushSettings, setPushSettings] = useState({
    enabled: true,
    newArticles: true,
    bookmarkReminders: false,
    followedCategories: true,
    breakingNews: false,
    weeklyGoals: true
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    activityStatus: true,
    readingHistory: false,
    bookmarksPublic: false,
    allowFollowers: true
  })

  const recentNotifications = [
    {
      id: 1,
      title: 'New article in Technology',
      message: 'Advanced React Patterns You Should Know',
      time: '2 hours ago',
      read: false,
      type: 'article'
    },
    {
      id: 2,
      title: 'Weekly reading goal achieved!',
      message: 'Congratulations! You\'ve read 5 articles this week.',
      time: '1 day ago',
      read: true,
      type: 'achievement'
    },
    {
      id: 3,
      title: 'Comment reply',
      message: 'Someone replied to your comment on "Future of AI"',
      time: '2 days ago',
      read: true,
      type: 'social'
    },
    {
      id: 4,
      title: 'System update',
      message: 'New features are now available in your dashboard',
      time: '1 week ago',
      read: false,
      type: 'system'
    }
  ]

  const handleEmailSettingChange = (key: string, value: boolean) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }))
  }

  const handlePushSettingChange = (key: string, value: boolean) => {
    setPushSettings(prev => ({ ...prev, [key]: value }))
  }

  const handlePrivacySettingChange = (key: string, value: boolean | string) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Notification settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Save settings error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄'
      case 'achievement': return '🏆'
      case 'social': return '💬'
      case 'system': return '⚙️'
      default: return '🔔'
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
          <CardDescription>
            Manage how and when you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Email Notifications */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">Email Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletter">Weekly Newsletter</Label>
                    <p className="text-sm text-gray-500">Get our curated weekly content digest</p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={emailSettings.newsletter}
                    onCheckedChange={(checked) => handleEmailSettingChange('newsletter', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="articleUpdates">Article Updates</Label>
                    <p className="text-sm text-gray-500">New articles in your subscribed categories</p>
                  </div>
                  <Switch
                    id="articleUpdates"
                    checked={emailSettings.articleUpdates}
                    onCheckedChange={(checked) => handleEmailSettingChange('articleUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="commentReplies">Comment Replies</Label>
                    <p className="text-sm text-gray-500">When someone replies to your comments</p>
                  </div>
                  <Switch
                    id="commentReplies"
                    checked={emailSettings.commentReplies}
                    onCheckedChange={(checked) => handleEmailSettingChange('commentReplies', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="systemUpdates">System Updates</Label>
                    <p className="text-sm text-gray-500">Important account and system notifications</p>
                  </div>
                  <Switch
                    id="systemUpdates"
                    checked={emailSettings.systemUpdates}
                    onCheckedChange={(checked) => handleEmailSettingChange('systemUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="promotionalEmails">Promotional Emails</Label>
                    <p className="text-sm text-gray-500">Special offers and product updates</p>
                  </div>
                  <Switch
                    id="promotionalEmails"
                    checked={emailSettings.promotionalEmails}
                    onCheckedChange={(checked) => handleEmailSettingChange('promotionalEmails', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                {pushSettings.enabled ? (
                  <Volume2 className="h-5 w-5 text-green-600" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-400" />
                )}
                <h3 className="text-lg font-medium">Push Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushEnabled">Enable Push Notifications</Label>
                    <p className="text-sm text-gray-500">Allow browser notifications from this site</p>
                  </div>
                  <Switch
                    id="pushEnabled"
                    checked={pushSettings.enabled}
                    onCheckedChange={(checked) => handlePushSettingChange('enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newArticles">New Articles</Label>
                    <p className="text-sm text-gray-500">When new articles are published in your interests</p>
                  </div>
                  <Switch
                    id="newArticles"
                    checked={pushSettings.newArticles}
                    onCheckedChange={(checked) => handlePushSettingChange('newArticles', checked)}
                    disabled={!pushSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="bookmarkReminders">Bookmark Reminders</Label>
                    <p className="text-sm text-gray-500">Reminders to read your saved articles</p>
                  </div>
                  <Switch
                    id="bookmarkReminders"
                    checked={pushSettings.bookmarkReminders}
                    onCheckedChange={(checked) => handlePushSettingChange('bookmarkReminders', checked)}
                    disabled={!pushSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="followedCategories">Followed Categories</Label>
                    <p className="text-sm text-gray-500">Updates from your subscribed categories</p>
                  </div>
                  <Switch
                    id="followedCategories"
                    checked={pushSettings.followedCategories}
                    onCheckedChange={(checked) => handlePushSettingChange('followedCategories', checked)}
                    disabled={!pushSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weeklyGoals">Reading Goals</Label>
                    <p className="text-sm text-gray-500">Weekly reading achievement updates</p>
                  </div>
                  <Switch
                    id="weeklyGoals"
                    checked={pushSettings.weeklyGoals}
                    onCheckedChange={(checked) => handlePushSettingChange('weeklyGoals', checked)}
                    disabled={!pushSettings.enabled}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Privacy Settings</span>
            </CardTitle>
            <CardDescription>
              Control how your activity and information is shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activityStatus">Show Activity Status</Label>
                <p className="text-sm text-gray-500">Let others see when you're online</p>
              </div>
              <Switch
                id="activityStatus"
                checked={privacySettings.activityStatus}
                onCheckedChange={(checked) => handlePrivacySettingChange('activityStatus', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="readingHistory">Public Reading History</Label>
                <p className="text-sm text-gray-500">Allow others to see articles you've read</p>
              </div>
              <Switch
                id="readingHistory"
                checked={privacySettings.readingHistory}
                onCheckedChange={(checked) => handlePrivacySettingChange('readingHistory', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bookmarksPublic">Public Bookmarks</Label>
                <p className="text-sm text-gray-500">Make your bookmarked articles visible to others</p>
              </div>
              <Switch
                id="bookmarksPublic"
                checked={privacySettings.bookmarksPublic}
                onCheckedChange={(checked) => handlePrivacySettingChange('bookmarksPublic', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowFollowers">Allow Followers</Label>
                <p className="text-sm text-gray-500">Let other users follow your reading activity</p>
              </div>
              <Switch
                id="allowFollowers"
                checked={privacySettings.allowFollowers}
                onCheckedChange={(checked) => handlePrivacySettingChange('allowFollowers', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Notifications</span>
            </CardTitle>
            <CardDescription>
              Your latest notification activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    !notification.read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg" role="img" aria-label={notification.type}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All Notifications
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}