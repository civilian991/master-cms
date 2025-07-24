'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Globe, 
  Shield, 
  Mail,
  Database,
  Palette,
  Bell,
  Users,
  Code,
  Search,
  BarChart3,
  Lock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download
} from 'lucide-react'

interface SettingsSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    title: 'General Settings',
    description: 'Basic site configuration and information',
    icon: Settings
  },
  {
    id: 'localization',
    title: 'Localization',
    description: 'Language and regional settings',
    icon: Globe
  },
  {
    id: 'branding',
    title: 'Branding & Design',
    description: 'Customize your site appearance',
    icon: Palette
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Authentication and access control',
    icon: Shield
  },
  {
    id: 'email',
    title: 'Email Settings',
    description: 'Configure email delivery and templates',
    icon: Mail
  },
  {
    id: 'database',
    title: 'Database',
    description: 'Database connection and backup settings',
    icon: Database
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'System alerts and user notifications',
    icon: Bell
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Default roles and permissions',
    icon: Users
  },
  {
    id: 'api',
    title: 'API & Integrations',
    description: 'API keys and third-party integrations',
    icon: Code
  },
  {
    id: 'seo',
    title: 'SEO & Analytics',
    description: 'Search engine optimization settings',
    icon: Search
  }
]

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // TODO: Replace with actual API call
      console.log('Saving settings...')
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSaveStatus('success')
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="siteName">Site Name</Label>
          <Input id="siteName" defaultValue="Master CMS Framework" />
        </div>
        <div>
          <Label htmlFor="siteUrl">Site URL</Label>
          <Input id="siteUrl" defaultValue="https://master-cms.com" />
        </div>
      </div>

      <div>
        <Label htmlFor="siteDescription">Site Description</Label>
        <Textarea 
          id="siteDescription" 
          defaultValue="AI-Powered CMS Framework for Media Companies"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="adminEmail">Admin Email</Label>
          <Input id="adminEmail" type="email" defaultValue="admin@master-cms.com" />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="dateFormat">Date Format</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <Label htmlFor="timeFormat">Time Format</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="12">12 Hour</option>
            <option value="24">24 Hour</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderLocalizationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="defaultLanguage">Default Language</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="fallbackLanguage">Fallback Language</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-3 block">Enabled Languages</Label>
        <div className="space-y-2">
          {[
            { code: 'en', name: 'English', enabled: true },
            { code: 'ar', name: 'العربية (Arabic)', enabled: true },
            { code: 'es', name: 'Español (Spanish)', enabled: false },
            { code: 'fr', name: 'Français (French)', enabled: false },
            { code: 'de', name: 'Deutsch (German)', enabled: false }
          ].map(lang => (
            <div key={lang.code} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={lang.code}
                defaultChecked={lang.enabled}
                className="rounded"
              />
              <Label htmlFor={lang.code} className="flex-1">
                {lang.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="rtlSupport">RTL Support</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="auto">Auto-detect</option>
            <option value="enabled">Always Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div>
          <Label htmlFor="dateLocale">Date Locale</Label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="en-US">English (US)</option>
            <option value="ar-SA">Arabic (Saudi Arabia)</option>
            <option value="en-GB">English (UK)</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" placeholder="https://example.com/logo.png" />
          <p className="text-sm text-gray-500 mt-1">Recommended size: 200x60px</p>
        </div>
        <div>
          <Label htmlFor="faviconUrl">Favicon URL</Label>
          <Input id="faviconUrl" placeholder="https://example.com/favicon.ico" />
          <p className="text-sm text-gray-500 mt-1">Recommended size: 32x32px</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex space-x-2">
            <Input id="primaryColor" defaultValue="#3B82F6" />
            <input type="color" defaultValue="#3B82F6" className="w-12 h-10 border rounded" />
          </div>
        </div>
        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex space-x-2">
            <Input id="secondaryColor" defaultValue="#64748B" />
            <input type="color" defaultValue="#64748B" className="w-12 h-10 border rounded" />
          </div>
        </div>
        <div>
          <Label htmlFor="accentColor">Accent Color</Label>
          <div className="flex space-x-2">
            <Input id="accentColor" defaultValue="#EF4444" />
            <input type="color" defaultValue="#EF4444" className="w-12 h-10 border rounded" />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="customCss">Custom CSS</Label>
        <Textarea 
          id="customCss" 
          placeholder="/* Add your custom CSS here */"
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="googleFonts">Google Fonts</Label>
        <Input 
          id="googleFonts" 
          placeholder="Inter:400,500,600,700|Merriweather:400,700"
          defaultValue="Inter:400,500,600,700|Merriweather:400,700"
        />
        <p className="text-sm text-gray-500 mt-1">Separate multiple fonts with |</p>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
          <Input id="sessionTimeout" type="number" defaultValue="24" />
        </div>
        <div>
          <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
          <Input id="maxLoginAttempts" type="number" defaultValue="5" />
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-3 block">Authentication Options</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="twoFactor" defaultChecked className="rounded" />
            <Label htmlFor="twoFactor">Enable Two-Factor Authentication</Label>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="passwordExpiry" className="rounded" />
            <Label htmlFor="passwordExpiry">Password Expiration (90 days)</Label>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="strongPasswords" defaultChecked className="rounded" />
            <Label htmlFor="strongPasswords">Require Strong Passwords</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
        <Textarea 
          id="allowedDomains" 
          placeholder="example.com&#10;company.com&#10;(leave empty to allow all domains)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="corsOrigins">CORS Allowed Origins</Label>
          <Textarea 
            id="corsOrigins" 
            placeholder="https://app.example.com&#10;https://admin.example.com"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="apiRateLimit">API Rate Limit (requests/minute)</Label>
          <Input id="apiRateLimit" type="number" defaultValue="100" />
        </div>
      </div>
    </div>
  )

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings()
      case 'localization':
        return renderLocalizationSettings()
      case 'branding':
        return renderBrandingSettings()
      case 'security':
        return renderSecuritySettings()
      default:
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {settingsSections.find(s => s.id === activeSection)?.title}
            </h3>
            <p className="text-gray-500">
              Settings for this section are coming soon.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure your Master CMS installation</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Settings saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Save failed
            </div>
          )}
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        {!isActive && (
                          <div className="text-xs text-gray-500">{section.description}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache</span>
                <Badge className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email</span>
                <Badge className="bg-green-100 text-green-800">
                  Working
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  75% Full
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {(() => {
                  const section = settingsSections.find(s => s.id === activeSection)
                  const Icon = section?.icon || Settings
                  return (
                    <>
                      <Icon className="h-5 w-5 mr-2" />
                      {section?.title}
                    </>
                  )
                })()}
              </CardTitle>
              <CardDescription>
                {settingsSections.find(s => s.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSectionContent()}
            </CardContent>
          </Card>

          {/* Backup & Export */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Backup & Export</CardTitle>
              <CardDescription>
                Backup your settings and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 