'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';

interface SignInFormProps {
  siteId?: string;
  redirectUrl?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export function SignInForm({ siteId, redirectUrl, onSuccess, onError }: SignInFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaToken: '',
  });
  const [showMFA, setShowMFA] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!showMFA) {
        // Initial sign-in attempt
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          siteId: siteId,
          redirect: false,
        });

        if (result?.error) {
          if (result.error === 'MFA_REQUIRED') {
            setShowMFA(true);
            setSessionId(result.url?.split('session=')[1] || null);
          } else {
            setError(result.error);
          }
        } else if (result?.ok) {
          // Sign-in successful
          const session = await getSession();
          if (session?.user) {
            onSuccess?.(session.user);
            if (redirectUrl) {
              router.push(redirectUrl);
            } else {
              router.push('/dashboard');
            }
          }
        }
      } else {
        // MFA verification
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          mfaToken: formData.mfaToken,
          sessionId: sessionId,
          siteId: siteId,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else if (result?.ok) {
          // MFA verification successful
          const session = await getSession();
          if (session?.user) {
            onSuccess?.(session.user);
            if (redirectUrl) {
              router.push(redirectUrl);
            } else {
              router.push('/dashboard');
            }
          }
        }
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleBackToSignIn = () => {
    setShowMFA(false);
    setFormData(prev => ({ ...prev, mfaToken: '' }));
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {showMFA ? 'Two-Factor Authentication' : 'Sign In'}
        </CardTitle>
        <CardDescription className="text-center">
          {showMFA 
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Enter your credentials to access your account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showMFA ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="mfaToken">Authentication Code</Label>
                <Input
                  id="mfaToken"
                  name="mfaToken"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.mfaToken}
                  onChange={handleInputChange}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  disabled={isLoading}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={handleBackToSignIn}
                  disabled={isLoading}
                >
                  Back to sign in
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => router.push('/auth/mfa-setup')}
                  disabled={isLoading}
                >
                  Need help?
                </Button>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {showMFA ? 'Verifying...' : 'Signing in...'}
              </>
            ) : (
              <>
                {showMFA && <Shield className="mr-2 h-4 w-4" />}
                {showMFA ? 'Verify' : 'Sign In'}
              </>
            )}
          </Button>
        </form>

        {!showMFA && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="px-0 text-sm"
                onClick={() => router.push('/auth/signup')}
              >
                Sign up
              </Button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 