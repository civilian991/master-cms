'use client';

import React from 'react';
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Download,
  Copy,
  Fingerprint,
  Camera,
  Mic,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MFASetupWizardProps, AuthenticationMethod, BiometricType } from '../types/security.types';
import { useMFASetup } from '../hooks/useMFASetup';

export function MFASetupWizard({
  userId,
  onComplete,
  onCancel,
  allowedMethods = ['totp', 'biometric_fingerprint', 'sms', 'email'],
  isRequired = false,
}: MFASetupWizardProps) {
  const {
    // State
    isLoading,
    currentStep,
    steps,
    error,
    selectedMethods,
    primaryMethod,
    biometricCapabilities,
    backupCodes,
    qrCode,
    
    // Navigation
    nextStep,
    previousStep,
    
    // Setup functions
    setupTOTP,
    setupBiometric,
    setupSMS,
    setupEmail,
    generateBackupCodes,
    
    // Configuration
    setPrimaryMethod,
    addMethod,
    removeMethod,
    completeMFASetup,
    
    // Validation
    canProceed,
    getProgress,
    getCurrentStepInfo,
  } = useMFASetup(userId);

  const currentStepInfo = getCurrentStepInfo();

  // ============================================================================
  // STEP COMPONENTS
  // ============================================================================

  const WelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <Shield className="h-8 w-8 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Secure Your Account</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Multi-factor authentication adds an extra layer of security to your account by 
          requiring additional verification beyond your password.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
        <Card className="text-center p-4">
          <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <h3 className="font-semibold mb-1">Enhanced Security</h3>
          <p className="text-sm text-muted-foreground">
            Protect against unauthorized access
          </p>
        </Card>
        <Card className="text-center p-4">
          <Smartphone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <h3 className="font-semibold mb-1">Multiple Options</h3>
          <p className="text-sm text-muted-foreground">
            Choose from various authentication methods
          </p>
        </Card>
        <Card className="text-center p-4">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <h3 className="font-semibold mb-1">Easy Setup</h3>
          <p className="text-sm text-muted-foreground">
            Quick and guided configuration process
          </p>
        </Card>
      </div>

      {isRequired && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Required Setup</AlertTitle>
          <AlertDescription>
            Multi-factor authentication is required for your account. Please complete the setup to continue.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const MethodSelectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Authentication Methods</h2>
        <p className="text-muted-foreground">
          Select one or more methods to secure your account. You can always add more later.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* TOTP/Authenticator App */}
        {allowedMethods.includes('totp') && (
          <Card className={`cursor-pointer transition-all ${
            selectedMethods.includes('totp') ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <QrCode className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-base">Authenticator App</CardTitle>
                    <CardDescription>Use apps like Google Authenticator or Authy</CardDescription>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.includes('totp')}
                  onCheckedChange={(checked) => {
                    if (checked) addMethod('totp');
                    else removeMethod('totp');
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Fingerprint */}
        {allowedMethods.includes('biometric_fingerprint') && biometricCapabilities?.fingerprint && (
          <Card className={`cursor-pointer transition-all ${
            selectedMethods.includes('biometric_fingerprint') ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Fingerprint className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle className="text-base">Fingerprint</CardTitle>
                    <CardDescription>Use your fingerprint sensor</CardDescription>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.includes('biometric_fingerprint')}
                  onCheckedChange={(checked) => {
                    if (checked) addMethod('biometric_fingerprint');
                    else removeMethod('biometric_fingerprint');
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Face Recognition */}
        {allowedMethods.includes('biometric_face') && biometricCapabilities?.face && (
          <Card className={`cursor-pointer transition-all ${
            selectedMethods.includes('biometric_face') ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Camera className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle className="text-base">Face Recognition</CardTitle>
                    <CardDescription>Use your device's camera</CardDescription>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.includes('biometric_face')}
                  onCheckedChange={(checked) => {
                    if (checked) addMethod('biometric_face');
                    else removeMethod('biometric_face');
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* SMS */}
        {allowedMethods.includes('sms') && (
          <Card className={`cursor-pointer transition-all ${
            selectedMethods.includes('sms') ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                  <div>
                    <CardTitle className="text-base">SMS Text Message</CardTitle>
                    <CardDescription>Receive codes via text message</CardDescription>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.includes('sms')}
                  onCheckedChange={(checked) => {
                    if (checked) addMethod('sms');
                    else removeMethod('sms');
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Email */}
        {allowedMethods.includes('email') && (
          <Card className={`cursor-pointer transition-all ${
            selectedMethods.includes('email') ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-8 w-8 text-indigo-600" />
                  <div>
                    <CardTitle className="text-base">Email Verification</CardTitle>
                    <CardDescription>Receive codes via email</CardDescription>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.includes('email')}
                  onCheckedChange={(checked) => {
                    if (checked) addMethod('email');
                    else removeMethod('email');
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {selectedMethods.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Primary Method</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose your preferred authentication method
            </p>
            <div className="grid gap-2">
              {selectedMethods.map((method) => (
                <Label key={method} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="primaryMethod"
                    value={method}
                    checked={primaryMethod === method}
                    onChange={() => setPrimaryMethod(method)}
                    className="text-blue-600"
                  />
                  <span className="capitalize">{method.replace('_', ' ').replace('biometric ', '')}</span>
                </Label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const TOTPSetupStep = () => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <QrCode className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold mb-2">Setup Authenticator App</h2>
        <p className="text-muted-foreground">
          Scan the QR code with your authenticator app
        </p>
      </div>

      {!qrCode ? (
        <div className="text-center">
          <Button onClick={setupTOTP} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate QR Code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Can't scan the code? Enter this key manually:
            </p>
            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
              <code className="flex-1 text-sm">{qrCode}</code>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertTitle>Verify Setup</AlertTitle>
            <AlertDescription>
              After scanning, enter the 6-digit code from your authenticator app to verify the setup.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Verification Code</Label>
            <Input 
              placeholder="000000" 
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>
        </div>
      )}
    </div>
  );

  const BackupCodesStep = () => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <Key className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h2 className="text-2xl font-bold mb-2">Backup Recovery Codes</h2>
        <p className="text-muted-foreground">
          Save these codes in a secure place. You can use them to access your account if you lose access to your other authentication methods.
        </p>
      </div>

      {backupCodes.length === 0 ? (
        <div className="text-center">
          <Button onClick={generateBackupCodes} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Backup Codes'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm p-2 bg-white rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy All
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Each backup code can only be used once. Store them securely and don't share them with anyone.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );

  const ConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
        <p className="text-muted-foreground">
          Your account is now secured with multi-factor authentication.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Method:</span>
              <Badge variant="outline">
                {primaryMethod?.replace('_', ' ').replace('biometric ', '').toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Methods:</span>
              <span className="font-semibold">{selectedMethods.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backup Codes:</span>
              <span className="font-semibold">{backupCodes.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          onClick={async () => {
            try {
              const config = await completeMFASetup();
              onComplete(config);
            } catch (error) {
              // Error is handled by the hook
            }
          }}
          disabled={isLoading}
          className="w-full max-w-xs"
        >
          {isLoading ? 'Finalizing...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER STEP CONTENT
  // ============================================================================

  const renderStepContent = () => {
    if (!currentStepInfo) return null;

    switch (currentStepInfo.component) {
      case 'WelcomeStep':
        return <WelcomeStep />;
      case 'MethodSelectionStep':
        return <MethodSelectionStep />;
      case 'TOTPSetupStep':
        return <TOTPSetupStep />;
      case 'BackupCodesStep':
        return <BackupCodesStep />;
      case 'ConfirmationStep':
        return <ConfirmationStep />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Step not implemented: {currentStepInfo.component}</p>
          </div>
        );
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Multi-Factor Authentication Setup</h1>
            <p className="text-muted-foreground">
              Step {currentStep + 1} of {steps.length}: {currentStepInfo?.title}
            </p>
          </div>
          {!isRequired && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(getProgress())}% complete</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={previousStep}
          disabled={currentStep === 0 || isLoading}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default MFASetupWizard; 