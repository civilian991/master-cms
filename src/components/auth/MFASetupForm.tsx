'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Smartphone, Copy, Check } from 'lucide-react';

interface MFASetupFormProps {
  userId?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MFASetupForm({ userId, onSuccess, onError }: MFASetupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [mfaData, setMfaData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'setup') {
      initializeMFASetup();
    }
  }, [step]);

  const initializeMFASetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize MFA setup');
      }

      setMfaData({
        secret: data.secret,
        qrCode: data.qrCode,
        backupCodes: data.backupCodes,
      });
    } catch (err) {
      console.error('MFA setup initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize MFA setup';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          token: verificationToken,
          backupCodes: mfaData?.backupCodes || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify MFA token');
      }

      onSuccess?.();
      router.push('/dashboard?message=MFA has been enabled successfully');
    } catch (err) {
      console.error('MFA verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify MFA token';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadBackupCodes = () => {
    if (!mfaData?.backupCodes) return;

    const content = `Backup Codes for MFA Setup\n\n${mfaData.backupCodes.join('\n')}\n\nKeep these codes safe. You can use them to access your account if you lose your authenticator device.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'setup' && !mfaData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Setting up MFA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Initializing two-factor authentication...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
          <Shield className="mr-2 h-6 w-6" />
          {step === 'setup' ? 'Setup Two-Factor Authentication' : 'Verify Setup'}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 'setup' 
            ? 'Scan the QR code with your authenticator app'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'setup' && mfaData && (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="space-y-2">
              <Label>QR Code</Label>
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img 
                    src={mfaData.qrCode} 
                    alt="MFA QR Code" 
                    className="w-48 h-48"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan this QR code with your authenticator app
              </p>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label>Manual Entry Code</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={mfaData.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(mfaData.secret, 'secret')}
                >
                  {copiedCode === 'secret' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this code if you can't scan the QR code
              </p>
            </div>

            {/* Backup Codes */}
            <div className="space-y-2">
              <Label>Backup Codes</Label>
              <div className="grid grid-cols-2 gap-2">
                {mfaData.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-muted rounded text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Save these codes in a secure location
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                >
                  Download
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setStep('verify')}
              className="w-full"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Continue to Verification
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationToken">Authentication Code</Label>
              <Input
                id="verificationToken"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                disabled={isLoading}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || verificationToken.length !== 6}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Enable MFA
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="link"
            className="px-0 text-sm"
            onClick={() => router.push('/dashboard')}
          >
            Cancel Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 