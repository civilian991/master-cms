'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  Key,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  QrCode,
  Download,
  Activity,
  MapPin,
  Clock
} from 'lucide-react'

export default function SecurityPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showMFASetup, setShowMFASetup] = useState(false)
  const [mfaStep, setMfaStep] = useState<'setup' | 'qr' | 'verify' | 'backup'>('setup')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [mfaData, setMfaData] = useState({
    verificationCode: '',
    backupCodes: [
      '1A2B-3C4D-5E6F',
      '7G8H-9I0J-1K2L',
      '3M4N-5O6P-7Q8R',
      '9S0T-1U2V-3W4X',
      '5Y6Z-7A8B-9C0D'
    ]
  })

  const securityEvents = [
    {
      id: 1,
      type: 'login',
      description: 'Successful login',
      timestamp: '2024-01-15 14:30:25',
      location: 'New York, US',
      device: 'Chrome on MacOS',
      ip: '192.168.1.1'
    },
    {
      id: 2,
      type: 'password_change',
      description: 'Password changed',
      timestamp: '2024-01-10 09:15:10',
      location: 'New York, US',
      device: 'Firefox on Windows',
      ip: '192.168.1.2'
    },
    {
      id: 3,
      type: 'mfa_enabled',
      description: 'Two-factor authentication enabled',
      timestamp: '2024-01-05 16:45:30',
      location: 'New York, US',
      device: 'Chrome on MacOS',
      ip: '192.168.1.1'
    },
    {
      id: 4,
      type: 'login_failed',
      description: 'Failed login attempt',
      timestamp: '2024-01-03 12:20:15',
      location: 'Unknown',
      device: 'Unknown',
      ip: '203.0.113.1'
    }
  ]

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/password/change', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSuccess('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFASetup = async () => {
    setShowMFASetup(true)
    setMfaStep('qr')
  }

  const handleMFAVerify = async () => {
    setIsLoading(true)
    try {
      // Mock MFA verification
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMfaStep('backup')
      setSuccess('Two-factor authentication enabled successfully!')
    } catch (error) {
      setError('Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableMFA = async () => {
    setIsLoading(true)
    try {
      // Mock MFA disable
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Two-factor authentication disabled')
    } catch (error) {
      setError('Failed to disable two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccess('Backup code copied to clipboard!')
    setTimeout(() => setSuccess(null), 2000)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'password_change': return <Key className="h-4 w-4 text-blue-500" />
      case 'mfa_enabled': return <Shield className="h-4 w-4 text-purple-500" />
      case 'login_failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Overview</span>
          </CardTitle>
          <CardDescription>
            Your account security status and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${session?.user?.mfaEnabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Shield className={`h-4 w-4 ${session?.user?.mfaEnabled ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <Badge 
                    variant={session?.user?.mfaEnabled ? 'default' : 'secondary'}
                    className={session?.user?.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {session?.user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Strong Password</p>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Security Score</p>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    {session?.user?.mfaEnabled ? '95/100' : '75/100'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>
              Update your account password regularly for better security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Two-Factor Authentication</span>
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!session?.user?.mfaEnabled ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is not enabled. Enable it now to secure your account.
                  </AlertDescription>
                </Alert>
                
                <div className="text-sm text-gray-600">
                  <p>Benefits of two-factor authentication:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Additional security for your account</li>
                    <li>Protection against unauthorized access</li>
                    <li>Works with popular authenticator apps</li>
                  </ul>
                </div>

                <Button onClick={handleMFASetup} disabled={isLoading}>
                  <Shield className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is enabled and protecting your account.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup Codes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDisableMFA}
                    disabled={isLoading}
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              </div>
            )}

            {/* MFA Setup Modal Content */}
            {showMFASetup && mfaStep === 'qr' && (
              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-100 mx-auto mb-4 flex items-center justify-center rounded-lg">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Enter verification code</Label>
                  <Input
                    id="verificationCode"
                    value={mfaData.verificationCode}
                    onChange={(e) => setMfaData(prev => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                <Button onClick={handleMFAVerify} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Enable'
                  )}
                </Button>
              </div>
            )}

            {showMFASetup && mfaStep === 'backup' && (
              <div className="mt-6 space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is now enabled! Save these backup codes in a safe place.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Backup Codes</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {mfaData.backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded font-mono text-sm">
                        <span>{code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyBackupCode(code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={() => setShowMFASetup(false)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download & Complete Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Security Activity</span>
          </CardTitle>
          <CardDescription>
            Monitor recent security events on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{event.description}</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.timestamp.split(' ')[0]}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.timestamp}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{event.device}</span>
                      <span>IP: {event.ip}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">
              View Full Security Log
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}