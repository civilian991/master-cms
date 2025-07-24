import React, { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Icon, User, Eye, X, Check, Warning, Spinner, SignIn, SignOut } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Authentication state types
export type AuthState = 'idle' | 'loading' | 'success' | 'error';

// Form validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// Sign-in modal props
export interface SignInModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Close modal handler
   */
  onClose: () => void;
  
  /**
   * Success callback after sign-in
   */
  onSuccess?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Available OAuth providers
   */
  providers?: {
    id: string;
    name: string;
    type: string;
  }[];
}

// Registration form props
export interface RegistrationFormProps {
  /**
   * Form submission handler
   */
  onSubmit: (data: RegistrationData) => Promise<void>;
  
  /**
   * Success callback after registration
   */
  onSuccess?: () => void;
  
  /**
   * Switch to sign-in handler
   */
  onSwitchToSignIn?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Registration data interface
export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

// Password reset props
export interface PasswordResetProps {
  /**
   * Reset request handler
   */
  onResetRequest: (email: string) => Promise<void>;
  
  /**
   * Back to sign-in handler
   */
  onBackToSignIn?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// MFA setup props
export interface MFASetupProps {
  /**
   * MFA setup handler
   */
  onSetup: (secret: string, code: string) => Promise<void>;
  
  /**
   * Skip MFA handler
   */
  onSkip?: () => void;
  
  /**
   * MFA secret (QR code data)
   */
  secret?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Sign-In Modal Component
 * 
 * Modal with social + email authentication options
 */
export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  className,
  providers = [],
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [errors, setErrors] = useState<ValidationError[]>();
  
  const { data: session } = useSession();

  // Clear form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setAuthState('idle');
      setErrors(undefined);
    }
  }, [isOpen]);

  // Handle successful authentication
  useEffect(() => {
    if (session && authState === 'loading') {
      setAuthState('success');
      onSuccess?.();
      onClose();
    }
  }, [session, authState, onSuccess, onClose]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState('loading');
    setErrors(undefined);

    // Basic validation
    const validationErrors: ValidationError[] = [];
    if (!email) validationErrors.push({ field: 'email', message: 'Email is required' });
    if (!password) validationErrors.push({ field: 'password', message: 'Password is required' });
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setAuthState('error');
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrors([{ field: 'general', message: 'Invalid email or password' }]);
        setAuthState('error');
      } else {
        setAuthState('success');
      }
    } catch (error) {
      setErrors([{ field: 'general', message: 'An error occurred during sign-in' }]);
      setAuthState('error');
    }
  };

  const handleProviderSignIn = async (providerId: string) => {
    setAuthState('loading');
    try {
      await signIn(providerId, { callbackUrl: window.location.origin });
    } catch (error) {
      setAuthState('error');
      setErrors([{ field: 'general', message: 'An error occurred during sign-in' }]);
    }
  };

  const getFieldError = (field: string) => {
    return errors?.find(error => error.field === field)?.message;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn(
        "w-full max-w-md bg-background border border-border rounded-lg shadow-lg",
        "max-h-[90vh] overflow-y-auto",
        className
      )}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Sign In</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close sign-in modal"
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* General Error */}
          {getFieldError('general') && (
            <div className="flex items-center space-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <Icon icon={Warning} size="sm" className="text-destructive" />
              <span className="text-sm text-destructive">{getFieldError('general')}</span>
            </div>
          )}

          {/* OAuth Providers */}
          {providers.length > 0 && (
            <div className="space-y-3">
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn(provider.id)}
                  disabled={authState === 'loading'}
                >
                  {authState === 'loading' ? (
                    <Icon icon={Spinner} size="sm" className="animate-spin" />
                  ) : (
                    <Icon icon={SignIn} size="sm" />
                  )}
                  <span className="ml-2">Continue with {provider.name}</span>
                </Button>
              ))}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">or</span>
                </div>
              </div>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={cn(getFieldError('email') && "border-destructive")}
                disabled={authState === 'loading'}
              />
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-destructive">{getFieldError('email')}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(getFieldError('password') && "border-destructive")}
                  disabled={authState === 'loading'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon icon={Eye} size="xs" />
                </Button>
              </div>
              {getFieldError('password') && (
                <p className="mt-1 text-sm text-destructive">{getFieldError('password')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={authState === 'loading'}
            >
              {authState === 'loading' ? (
                <>
                  <Icon icon={Spinner} size="sm" className="animate-spin" />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                <>
                  <Icon icon={SignIn} size="sm" />
                  <span className="ml-2">Sign In</span>
                </>
              )}
            </Button>
          </form>

          {/* Additional Actions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{' '}
              <button className="text-primary hover:underline">
                Sign up
              </button>
            </p>
            <button className="text-primary hover:underline mt-2">
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

SignInModal.displayName = "SignInModal";

/**
 * Registration Form Component
 * 
 * Multi-step registration with progressive disclosure
 */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  onSuccess,
  onSwitchToSignIn,
  className,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  });
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const updateFormData = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const validateStep = (stepNumber: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    switch (stepNumber) {
      case 1:
        if (!formData.firstName) errors.push({ field: 'firstName', message: 'First name is required' });
        if (!formData.lastName) errors.push({ field: 'lastName', message: 'Last name is required' });
        if (!formData.email) errors.push({ field: 'email', message: 'Email is required' });
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          errors.push({ field: 'email', message: 'Please enter a valid email address' });
        }
        break;
      case 2:
        if (!formData.password) errors.push({ field: 'password', message: 'Password is required' });
        if (formData.password && formData.password.length < 8) {
          errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
        }
        if (!formData.confirmPassword) errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
        if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
          errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
        }
        if (!formData.acceptTerms) errors.push({ field: 'acceptTerms', message: 'You must accept the terms and conditions' });
        break;
    }

    return errors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalErrors = validateStep(2);
    
    if (finalErrors.length > 0) {
      setErrors(finalErrors);
      return;
    }

    setAuthState('loading');
    try {
      await onSubmit(formData);
      setAuthState('success');
      onSuccess?.();
    } catch (error) {
      setAuthState('error');
      setErrors([{ field: 'general', message: 'Registration failed. Please try again.' }]);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Step {step} of 2</span>
          <span className="text-sm text-muted-foreground">
            {step === 1 ? 'Personal Information' : 'Security & Terms'}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* General Error */}
      {getFieldError('general') && (
        <div className="flex items-center space-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <Icon icon={Warning} size="sm" className="text-destructive" />
          <span className="text-sm text-destructive">{getFieldError('general')}</span>
        </div>
      )}

      <form onSubmit={step === 2 ? handleSubmit : undefined} className="space-y-4">
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="John"
                  className={cn(getFieldError('firstName') && "border-destructive")}
                />
                {getFieldError('firstName') && (
                  <p className="mt-1 text-sm text-destructive">{getFieldError('firstName')}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Doe"
                  className={cn(getFieldError('lastName') && "border-destructive")}
                />
                {getFieldError('lastName') && (
                  <p className="mt-1 text-sm text-destructive">{getFieldError('lastName')}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="john@example.com"
                className={cn(getFieldError('email') && "border-destructive")}
              />
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-destructive">{getFieldError('email')}</p>
              )}
            </div>

            <Button
              type="button"
              onClick={handleNext}
              className="w-full"
            >
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Enter your password"
                  className={cn(getFieldError('password') && "border-destructive")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon icon={Eye} size="xs" />
                </Button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Must be at least 8 characters long
              </p>
              {getFieldError('password') && (
                <p className="mt-1 text-sm text-destructive">{getFieldError('password')}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className={cn(getFieldError('confirmPassword') && "border-destructive")}
              />
              {getFieldError('confirmPassword') && (
                <p className="mt-1 text-sm text-destructive">{getFieldError('confirmPassword')}</p>
              )}
            </div>

            <div className="flex items-start space-2">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="acceptTerms" className="text-sm text-foreground">
                I accept the{' '}
                <button type="button" className="text-primary hover:underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="text-primary hover:underline">
                  Privacy Policy
                </button>
              </label>
            </div>
            {getFieldError('acceptTerms') && (
              <p className="text-sm text-destructive">{getFieldError('acceptTerms')}</p>
            )}

            <div className="flex space-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={authState === 'loading'}
              >
                {authState === 'loading' ? (
                  <>
                    <Icon icon={Spinner} size="sm" className="animate-spin" />
                    <span className="ml-2">Creating account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </>
        )}
      </form>

      {/* Switch to Sign In */}
      {onSwitchToSignIn && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} className="text-primary hover:underline">
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};

RegistrationForm.displayName = "RegistrationForm";

/**
 * Password Reset Component
 * 
 * Multi-step password reset flow
 */
export const PasswordReset: React.FC<PasswordResetProps> = ({
  onResetRequest,
  onBackToSignIn,
  className,
}) => {
  const [email, setEmail] = useState('');
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!email) {
      setErrors([{ field: 'email', message: 'Email is required' }]);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors([{ field: 'email', message: 'Please enter a valid email address' }]);
      return;
    }

    setAuthState('loading');
    try {
      await onResetRequest(email);
      setAuthState('success');
      setIsEmailSent(true);
    } catch (error) {
      setAuthState('error');
      setErrors([{ field: 'general', message: 'Failed to send reset email. Please try again.' }]);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  if (isEmailSent) {
    return (
      <div className={cn("w-full max-w-md mx-auto text-center", className)}>
        <div className="mb-6">
          <Icon icon={Check} size="xl" className="mx-auto text-success mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent a password reset link to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <Button
            variant="outline"
            onClick={() => {
              setIsEmailSent(false);
              setAuthState('idle');
              setErrors([]);
            }}
            className="w-full"
          >
            Try again
          </Button>

          {onBackToSignIn && (
            <Button
              variant="ghost"
              onClick={onBackToSignIn}
              className="w-full"
            >
              Back to sign in
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Reset your password</h2>
        <p className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* General Error */}
      {getFieldError('general') && (
        <div className="flex items-center space-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <Icon icon={Warning} size="sm" className="text-destructive" />
          <span className="text-sm text-destructive">{getFieldError('general')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={cn(getFieldError('email') && "border-destructive")}
            disabled={authState === 'loading'}
          />
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-destructive">{getFieldError('email')}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={authState === 'loading'}
        >
          {authState === 'loading' ? (
            <>
              <Icon icon={Spinner} size="sm" className="animate-spin" />
              <span className="ml-2">Sending...</span>
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      {onBackToSignIn && (
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={onBackToSignIn}
            className="text-sm"
          >
            Back to sign in
          </Button>
        </div>
      )}
    </div>
  );
};

PasswordReset.displayName = "PasswordReset";

/**
 * MFA Setup Component
 * 
 * Multi-factor authentication setup interface
 */
export const MFASetup: React.FC<MFASetupProps> = ({
  onSetup,
  onSkip,
  secret,
  className,
}) => {
  const [code, setCode] = useState('');
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!code) {
      setErrors([{ field: 'code', message: 'Verification code is required' }]);
      return;
    }

    if (code.length !== 6) {
      setErrors([{ field: 'code', message: 'Code must be 6 digits' }]);
      return;
    }

    setAuthState('loading');
    try {
      await onSetup(secret || '', code);
      setAuthState('success');
    } catch (error) {
      setAuthState('error');
      setErrors([{ field: 'general', message: 'Invalid verification code. Please try again.' }]);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Set up two-factor authentication</h2>
        <p className="text-muted-foreground">
          Scan the QR code with your authenticator app, then enter the verification code.
        </p>
      </div>
      {/* QR Code Placeholder */}
      {secret && (
        <div className="mb-6 p-6 bg-muted rounded-lg text-center">
          <div className="w-32 h-32 mx-auto bg-border rounded-lg flex items-center justify-center mb-4">
            <span className="text-muted-foreground text-sm">QR Code</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Can't scan? Enter this code manually:
          </p>
          <code className="text-xs font-mono bg-background px-2 py-1 rounded">
            {secret}
          </code>
        </div>
      )}
      {/* General Error */}
      {getFieldError('general') && (
        <div className="flex items-center space-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <Icon icon={Warning} size="sm" className="text-destructive" />
          <span className="text-sm text-destructive">{getFieldError('general')}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
            Verification Code
          </label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className={cn(
              "text-center font-mono text-lg tracking-widest",
              getFieldError('code') && "border-destructive"
            )}
            disabled={authState === 'loading'}
            maxLength={6}
          />
          {getFieldError('code') && (
            <p className="mt-1 text-sm text-destructive">{getFieldError('code')}</p>
          )}
        </div>

        <div className="flex space-2">
          {onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1"
              disabled={authState === 'loading'}
            >
              Skip for now
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={authState === 'loading'}
          >
            {authState === 'loading' ? (
              <>
                <Icon icon={Spinner} size="sm" className="animate-spin" />
                <span className="ml-2">Verifying...</span>
              </>
            ) : (
              'Enable MFA'
            )}
          </Button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          We recommend using apps like Google Authenticator or Authy for the best security.
        </p>
      </div>
    </div>
  );
};

MFASetup.displayName = "MFASetup"; 