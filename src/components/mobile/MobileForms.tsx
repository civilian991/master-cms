'use client';

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { EyeIcon, EyeOffIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Mobile input variants with touch-friendly sizing
const mobileInputVariants = cva(
  'w-full border bg-background text-foreground transition-all duration-200 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus:border-primary focus:ring-2 focus:ring-primary/20',
        filled: 'border-0 bg-muted focus:bg-background focus:ring-2 focus:ring-primary/20',
        outlined: 'border-2 border-border focus:border-primary bg-transparent',
        underlined: 'border-0 border-b-2 border-border focus:border-primary bg-transparent rounded-none',
      },
      size: {
        default: 'px-4 py-3 text-base min-h-[48px]', // 48px minimum touch target
        large: 'px-5 py-4 text-lg min-h-[56px]', // 56px large touch target
        comfortable: 'px-6 py-5 text-lg min-h-[64px]', // 64px extra comfortable
      },
      rounded: {
        default: 'rounded-lg',
        large: 'rounded-xl',
        full: 'rounded-full',
        none: 'rounded-none',
      },
      state: {
        default: '',
        error: 'border-destructive focus:border-destructive focus:ring-destructive/20',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
        warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
      state: 'default',
    },
  }
);

export interface MobileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof mobileInputVariants> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({
    className,
    variant,
    size,
    rounded,
    state,
    label,
    hint,
    error,
    success,
    leftIcon,
    rightIcon,
    loading,
    clearable,
    onClear,
    type = 'text',
    value,
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine actual state based on validation
    const actualState = error ? 'error' : success ? 'success' : state;
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Handle clear functionality
    const handleClear = () => {
      if (onClear) {
        onClear();
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Show clear button for clearable inputs with value
    const showClearButton = clearable && value && !disabled;
    
    // Show password toggle for password inputs
    const showPasswordToggle = type === 'password';

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              mobileInputVariants({ variant, size, rounded, state: actualState }),
              leftIcon && 'pl-10',
              (rightIcon || showClearButton || showPasswordToggle || loading) && 'pr-12',
              className
            )}
            ref={ref || inputRef}
            value={value}
            disabled={disabled || loading}
            autoComplete={type === 'password' ? 'current-password' : undefined}
            inputMode={
              type === 'email' ? 'email' :
              type === 'tel' ? 'tel' :
              type === 'number' ? 'numeric' :
              type === 'search' ? 'search' :
              'text'
            }
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
            
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-full min-h-[24px] min-w-[24px] flex items-center justify-center"
                aria-label="Clear input"
              >
                <XMarkIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-muted rounded-full min-h-[24px] min-w-[24px] flex items-center justify-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            
            {rightIcon && !showClearButton && !showPasswordToggle && !loading && (
              <div className="text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        
        {(hint || error || success) && (
          <div className="text-sm">
            {error && (
              <p className="text-destructive flex items-center gap-1">
                <XMarkIcon className="h-4 w-4" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-green-600 flex items-center gap-1">
                <CheckIcon className="h-4 w-4" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-muted-foreground">{hint}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
MobileInput.displayName = 'MobileInput';

// Mobile textarea component
export interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  resize?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({
    className,
    label,
    hint,
    error,
    success,
    resize = true,
    maxLength,
    showCount,
    value,
    disabled,
    ...props
  }, ref) => {
    const actualState = error ? 'error' : success ? 'success' : 'default';
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {props.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {showCount && maxLength && (
              <span className={cn(
                'text-xs',
                currentLength > maxLength * 0.9 ? 'text-warning' : 'text-muted-foreground',
                currentLength >= maxLength ? 'text-destructive' : ''
              )}>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        
        <textarea
          className={cn(
            mobileInputVariants({ 
              variant: 'default', 
              size: 'default', 
              rounded: 'default', 
              state: actualState 
            }),
            'min-h-[96px]', // Minimum 96px height for comfortable mobile use
            !resize && 'resize-none',
            className
          )}
          ref={ref}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          {...props}
        />
        
        {(hint || error || success) && (
          <div className="text-sm">
            {error && (
              <p className="text-destructive flex items-center gap-1">
                <XMarkIcon className="h-4 w-4" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-green-600 flex items-center gap-1">
                <CheckIcon className="h-4 w-4" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-muted-foreground">{hint}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
MobileTextarea.displayName = 'MobileTextarea';

// Mobile select component
export interface MobileSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  size?: 'default' | 'large' | 'comfortable';
}

const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({
    className,
    label,
    hint,
    error,
    success,
    placeholder,
    options,
    size = 'default',
    disabled,
    ...props
  }, ref) => {
    const actualState = error ? 'error' : success ? 'success' : 'default';

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            className={cn(
              mobileInputVariants({ 
                variant: 'default', 
                size, 
                rounded: 'default', 
                state: actualState 
              }),
              'pr-10 appearance-none cursor-pointer',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {(hint || error || success) && (
          <div className="text-sm">
            {error && (
              <p className="text-destructive flex items-center gap-1">
                <XMarkIcon className="h-4 w-4" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-green-600 flex items-center gap-1">
                <CheckIcon className="h-4 w-4" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-muted-foreground">{hint}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
MobileSelect.displayName = 'MobileSelect';

// Mobile checkbox component with large touch targets
export interface MobileCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: 'default' | 'large';
}

const MobileCheckbox = forwardRef<HTMLInputElement, MobileCheckboxProps>(
  ({
    className,
    label,
    description,
    size = 'default',
    disabled,
    ...props
  }, ref) => {
    const checkboxSize = size === 'large' ? 'h-6 w-6' : 'h-5 w-5';
    
    return (
      <div className="flex items-start space-x-3">
        <div className="flex items-center h-6">
          <input
            type="checkbox"
            className={cn(
              checkboxSize,
              'rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'touch-manipulation cursor-pointer',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
        </div>
        
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label className="block text-sm font-medium cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
MobileCheckbox.displayName = 'MobileCheckbox';

// Mobile radio group component
export interface MobileRadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface MobileRadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: MobileRadioOption[];
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: 'default' | 'large';
  className?: string;
}

const MobileRadioGroup = forwardRef<HTMLDivElement, MobileRadioGroupProps>(
  ({
    name,
    value,
    onChange,
    options,
    label,
    error,
    disabled,
    size = 'default',
    className,
  }, ref) => {
    const radioSize = size === 'large' ? 'h-6 w-6' : 'h-5 w-5';

    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        {label && (
          <label className="block text-sm font-medium leading-none">
            {label}
          </label>
        )}
        
        <div className="space-y-3">
          {options.map((option) => (
            <div key={option.value} className="flex items-start space-x-3">
              <div className="flex items-center h-6">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={disabled || option.disabled}
                  className={cn(
                    radioSize,
                    'border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'touch-manipulation cursor-pointer'
                  )}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium cursor-pointer">
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <XMarkIcon className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
MobileRadioGroup.displayName = 'MobileRadioGroup';

// Mobile form container with improved spacing
export interface MobileFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  spacing?: 'tight' | 'default' | 'loose';
}

const MobileForm = forwardRef<HTMLFormElement, MobileFormProps>(
  ({ className, spacing = 'default', children, ...props }, ref) => {
    const spacingClasses = {
      tight: 'space-y-4',
      default: 'space-y-6',
      loose: 'space-y-8',
    };

    return (
      <form
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);
MobileForm.displayName = 'MobileForm';

export {
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobileCheckbox,
  MobileRadioGroup,
  MobileForm,
  mobileInputVariants,
}; 