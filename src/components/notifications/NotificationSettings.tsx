'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Smartphone, 
  Mail, 
  Settings, 
  Shield,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  NotificationPreferences, 
  pushNotificationService 
} from '@/lib/services/push-notifications';

interface NotificationCategorySettings {
  id: keyof NotificationPreferences['categories'];
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

interface FrequencyOption {
  value: string;
  label: string;
  description: string;
}

const notificationCategories: NotificationCategorySettings[] = [
  {
    id: 'articles',
    name: 'New Articles',
    description: 'Get notified when new articles are published',
    icon: <Bell className="h-4 w-4" />,
    defaultEnabled: true,
  },
  {
    id: 'comments',
    name: 'Comments & Replies',
    description: 'Notifications for comments on your posts and replies to your comments',
    icon: <Mail className="h-4 w-4" />,
    defaultEnabled: true,
  },
  {
    id: 'system',
    name: 'System Updates',
    description: 'Important system notifications and maintenance alerts',
    icon: <Settings className="h-4 w-4" />,
    defaultEnabled: true,
  },
  {
    id: 'marketing',
    name: 'Promotions & Offers',
    description: 'Special offers, promotions, and product announcements',
    icon: <Shield className="h-4 w-4" />,
    defaultEnabled: false,
  },
  {
    id: 'engagement',
    name: 'Engagement & Social',
    description: 'Likes, follows, and other social interactions',
    icon: <Smartphone className="h-4 w-4" />,
    defaultEnabled: true,
  },
];

const frequencyOptions: FrequencyOption[] = [
  {
    value: 'immediate',
    label: 'Immediate',
    description: 'Get notifications right away',
  },
  {
    value: 'daily_digest',
    label: 'Daily Digest',
    description: 'Receive a summary once per day',
  },
  {
    value: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'Receive a summary once per week',
  },
];

const timezoneOptions = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPushSupport();
    checkSubscriptionStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushSupport = () => {
    setPushSupported(pushNotificationService.isSupported());
  };

  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      const permission = await pushNotificationService.requestPermission();
      if (permission === 'granted') {
        setIsSubscribed(true);
        if (preferences) {
          await updatePreferences({ ...preferences, enabled: true });
        }
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        if (preferences) {
          await updatePreferences({ ...preferences, enabled: false });
        }
      }
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    setSaving(true);
    try {
      await pushNotificationService.updatePreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = async (categoryId: keyof NotificationPreferences['categories']) => {
    if (!preferences) return;

    const newPreferences = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [categoryId]: !preferences.categories[categoryId],
      },
    };

    await updatePreferences(newPreferences);
  };

  const handleFrequencyChange = async (frequencyType: keyof NotificationPreferences['frequency'], enabled: boolean) => {
    if (!preferences) return;

    const newPreferences = {
      ...preferences,
      frequency: {
        ...preferences.frequency,
        [frequencyType]: enabled,
      },
    };

    await updatePreferences(newPreferences);
  };

  const handleQuietHoursToggle = async () => {
    if (!preferences) return;

    const newPreferences = {
      ...preferences,
      schedule: {
        ...preferences.schedule,
        quiet_hours_enabled: !preferences.schedule.quiet_hours_enabled,
      },
    };

    await updatePreferences(newPreferences);
  };

  const handleQuietHoursChange = async (field: 'quiet_start' | 'quiet_end', value: string) => {
    if (!preferences) return;

    const newPreferences = {
      ...preferences,
      schedule: {
        ...preferences.schedule,
        [field]: value,
      },
    };

    await updatePreferences(newPreferences);
  };

  const handleTimezoneChange = async (timezone: string) => {
    if (!preferences) return;

    const newPreferences = {
      ...preferences,
      schedule: {
        ...preferences.schedule,
        timezone,
      },
    };

    await updatePreferences(newPreferences);
  };

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load notification preferences</p>
        <Button onClick={loadPreferences} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isSubscribed ? (
                  <Bell className="h-5 w-5 text-green-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-gray-400" />
                )}
                Push Notifications
              </CardTitle>
              <CardDescription>
                {isSubscribed 
                  ? 'You are subscribed to push notifications'
                  : 'Enable push notifications to receive alerts'
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSubscribed && (
                <Badge variant="secondary" className="text-green-600">
                  Active
                </Badge>
              )}
              {!pushSupported && (
                <Badge variant="destructive">
                  Not Supported
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-enabled">Enable Push Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive notifications directly to your device
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={isSubscribed}
              onCheckedChange={isSubscribed ? handleDisablePushNotifications : handleEnablePushNotifications}
              disabled={!pushSupported || saving}
            />
          </div>

          {isSubscribed && (
            <div className="pt-4 border-t">
              <Button onClick={sendTestNotification} variant="outline" size="sm">
                Send Test Notification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationCategories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {category.icon}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              <Switch
                id={`category-${category.id}`}
                checked={preferences.categories[category.id]}
                onCheckedChange={() => handleCategoryToggle(category.id)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frequency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Frequency</CardTitle>
          <CardDescription>
            Control how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {frequencyOptions.map((option) => (
            <div key={option.value} className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor={`frequency-${option.value}`}>{option.label}</Label>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
              <Switch
                id={`frequency-${option.value}`}
                checked={preferences.frequency[option.value as keyof NotificationPreferences['frequency']]}
                onCheckedChange={(checked) => 
                  handleFrequencyChange(option.value as keyof NotificationPreferences['frequency'], checked)
                }
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
              <p className="text-sm text-gray-600">
                Pause notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={preferences.schedule.quiet_hours_enabled}
              onCheckedChange={handleQuietHoursToggle}
              disabled={saving}
            />
          </div>

          {preferences.schedule.quiet_hours_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.schedule.quiet_start}
                  onChange={(e) => handleQuietHoursChange('quiet_start', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.schedule.quiet_end}
                  onChange={(e) => handleQuietHoursChange('quiet_end', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.schedule.timezone}
                  onValueChange={handleTimezoneChange}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Additional notification preferences and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="sound">Sound</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Notification Preview</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Control how much information is shown in notifications
                </p>
                <Select defaultValue="full">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Show full content</SelectItem>
                    <SelectItem value="minimal">Show minimal preview</SelectItem>
                    <SelectItem value="none">Hide content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grouping</Label>
                <p className="text-sm text-gray-600 mb-2">
                  How similar notifications should be grouped
                </p>
                <Select defaultValue="category">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Group by category</SelectItem>
                    <SelectItem value="time">Group by time</SelectItem>
                    <SelectItem value="none">Don't group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="sound" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sound Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Play a sound when notifications arrive
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Vibration</Label>
                  <p className="text-sm text-gray-600">
                    Vibrate device for notifications (mobile only)
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Notification Sound</Label>
                <Select defaultValue="default">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="none">Silent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Analytics Tracking</Label>
                  <p className="text-sm text-gray-600">
                    Allow anonymous analytics to improve notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Personalization</Label>
                  <p className="text-sm text-gray-600">
                    Use your activity to personalize notification timing
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  Download My Notification Data
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Export all your notification preferences and history
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Changes */}
      {saving && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Saving preferences...</span>
        </div>
      )}
    </div>
  );
} 