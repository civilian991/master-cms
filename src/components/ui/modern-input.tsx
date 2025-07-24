"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"

export interface ModernInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  success?: string
  leftIcon?: React.ComponentType<{ className?: string }>
  rightIcon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'floating' | 'minimal'
}

const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({ 
    className, 
    type = "text",
    label, 
    hint, 
    error, 
    success, 
    leftIcon: LeftIcon, 
    rightIcon: RightIcon,
    variant = "default",
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const hasValue = Boolean(props.value || props.defaultValue)
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type

    const baseInputClasses = cn(
      "w-full rounded-lg border-2 bg-white px-4 py-3 text-base transition-all duration-200",
      "placeholder:text-gray-400 focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      LeftIcon && "pl-11",
      (RightIcon || isPassword) && "pr-11",
      error && "border-error-300 focus:border-error-500 focus:ring-error-500/20 bg-error-50/30",
      success && "border-success-300 focus:border-success-500 focus:ring-success-500/20 bg-success-50/30",
      !error && !success && "border-gray-200 focus:border-brand-500 focus:ring-brand-500/20",
      "shadow-soft hover:shadow-medium focus:shadow-medium"
    )

    const floatingInputClasses = cn(
      baseInputClasses,
      "pt-6 pb-2",
      variant === "floating" && label && "placeholder:opacity-0"
    )

    const minimalInputClasses = cn(
      "w-full border-0 border-b-2 bg-transparent px-0 py-3 text-base transition-all duration-200",
      "placeholder:text-gray-400 focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      LeftIcon && "pl-8",
      (RightIcon || isPassword) && "pr-8",
      error && "border-error-500 focus:border-error-600",
      success && "border-success-500 focus:border-success-600",
      !error && !success && "border-gray-300 focus:border-brand-500"
    )

    const getInputClasses = () => {
      switch (variant) {
        case "floating":
          return floatingInputClasses
        case "minimal":
          return minimalInputClasses
        default:
          return baseInputClasses
      }
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          {/* Floating Label */}
          {variant === "floating" && label && (
            <label 
              htmlFor={props.id}
              className={cn(
                "absolute left-4 transition-all duration-200 pointer-events-none",
                "text-gray-500 bg-white px-1 rounded",
                (focused || hasValue) 
                  ? "top-0 text-sm text-brand-600 font-medium transform -translate-y-1/2" 
                  : "top-1/2 text-base transform -translate-y-1/2",
                error && (focused || hasValue) && "text-error-600",
                success && (focused || hasValue) && "text-success-600"
              )}
            >
              {label}
            </label>
          )}

          {/* Regular Label */}
          {variant !== "floating" && label && (
            <label 
              htmlFor={props.id}
              className={cn(
                "block text-caption font-medium mb-2",
                error ? "text-error-700" : success ? "text-success-700" : "text-gray-700"
              )}
            >
              {label}
            </label>
          )}

          {/* Input Container */}
          <div className="relative">
            {/* Left Icon */}
            {LeftIcon && (
              <LeftIcon className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5",
                variant === "minimal" ? "left-0" : "left-3",
                error ? "text-error-400" : success ? "text-success-400" : "text-gray-400"
              )} />
            )}
            
            {/* Input */}
            <input
              type={inputType}
              className={cn(getInputClasses(), className)}
              ref={ref}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              {...props}
            />
            
            {/* Right Icon or Password Toggle */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
              {RightIcon && (
                <RightIcon className={cn(
                  "h-5 w-5",
                  error ? "text-error-400" : success ? "text-success-400" : "text-gray-400"
                )} />
              )}
            </div>
          </div>
          
          {/* Validation States */}
          {error && (
            <div className="flex items-center gap-2 text-error-600 text-caption mt-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 text-success-600 text-caption mt-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}
          
          {hint && !error && !success && (
            <p className="text-gray-500 text-caption mt-2">{hint}</p>
          )}
        </div>
      </div>
    )
  }
)

ModernInput.displayName = "ModernInput"

// Modern Textarea Component
export interface ModernTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  success?: string
  variant?: 'default' | 'floating' | 'minimal'
  resize?: boolean
}

const ModernTextarea = React.forwardRef<HTMLTextAreaElement, ModernTextareaProps>(
  ({ 
    className, 
    label, 
    hint, 
    error, 
    success, 
    variant = "default",
    resize = true,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const hasValue = Boolean(props.value || props.defaultValue)

    const baseTextareaClasses = cn(
      "w-full rounded-lg border-2 bg-white px-4 py-3 text-base transition-all duration-200",
      "placeholder:text-gray-400 focus:outline-none min-h-[120px]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-error-300 focus:border-error-500 focus:ring-error-500/20 bg-error-50/30",
      success && "border-success-300 focus:border-success-500 focus:ring-success-500/20 bg-success-50/30",
      !error && !success && "border-gray-200 focus:border-brand-500 focus:ring-brand-500/20",
      "shadow-soft hover:shadow-medium focus:shadow-medium",
      !resize && "resize-none"
    )

    const floatingTextareaClasses = cn(
      baseTextareaClasses,
      "pt-6 pb-2",
      variant === "floating" && label && "placeholder:opacity-0"
    )

    const getTextareaClasses = () => {
      switch (variant) {
        case "floating":
          return floatingTextareaClasses
        default:
          return baseTextareaClasses
      }
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          {/* Floating Label */}
          {variant === "floating" && label && (
            <label 
              htmlFor={props.id}
              className={cn(
                "absolute left-4 transition-all duration-200 pointer-events-none",
                "text-gray-500 bg-white px-1 rounded z-10",
                (focused || hasValue) 
                  ? "top-0 text-sm text-brand-600 font-medium transform -translate-y-1/2" 
                  : "top-6 text-base",
                error && (focused || hasValue) && "text-error-600",
                success && (focused || hasValue) && "text-success-600"
              )}
            >
              {label}
            </label>
          )}

          {/* Regular Label */}
          {variant !== "floating" && label && (
            <label 
              htmlFor={props.id}
              className={cn(
                "block text-caption font-medium mb-2",
                error ? "text-error-700" : success ? "text-success-700" : "text-gray-700"
              )}
            >
              {label}
            </label>
          )}

          {/* Textarea */}
          <textarea
            className={cn(getTextareaClasses(), className)}
            ref={ref}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          
          {/* Validation States */}
          {error && (
            <div className="flex items-center gap-2 text-error-600 text-caption mt-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 text-success-600 text-caption mt-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}
          
          {hint && !error && !success && (
            <p className="text-gray-500 text-caption mt-2">{hint}</p>
          )}
        </div>
      </div>
    )
  }
)

ModernTextarea.displayName = "ModernTextarea"

// Modern Select Component
export interface ModernSelectProps {
  label?: string
  hint?: string
  error?: string
  success?: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
  value?: string
  onChange?: (value: string) => void
  variant?: 'default' | 'floating' | 'minimal'
  disabled?: boolean
  className?: string
}

const ModernSelect: React.FC<ModernSelectProps> = ({
  label,
  hint,
  error,
  success,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  variant = "default",
  disabled = false,
  className
}) => {
  const [focused, setFocused] = useState(false)
  const hasValue = Boolean(value)

  const baseSelectClasses = cn(
    "w-full rounded-lg border-2 bg-white px-4 py-3 text-base transition-all duration-200",
    "focus:outline-none cursor-pointer appearance-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
    error && "border-error-300 focus:border-error-500 focus:ring-error-500/20 bg-error-50/30",
    success && "border-success-300 focus:border-success-500 focus:ring-success-500/20 bg-success-50/30",
    !error && !success && "border-gray-200 focus:border-brand-500 focus:ring-brand-500/20",
    "shadow-soft hover:shadow-medium focus:shadow-medium"
  )

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Floating Label */}
        {variant === "floating" && label && (
          <label 
            className={cn(
              "absolute left-4 transition-all duration-200 pointer-events-none",
              "text-gray-500 bg-white px-1 rounded z-10",
              (focused || hasValue) 
                ? "top-0 text-sm text-brand-600 font-medium transform -translate-y-1/2" 
                : "top-1/2 text-base transform -translate-y-1/2",
              error && (focused || hasValue) && "text-error-600",
              success && (focused || hasValue) && "text-success-600"
            )}
          >
            {label}
          </label>
        )}

        {/* Regular Label */}
        {variant !== "floating" && label && (
          <label 
            className={cn(
              "block text-caption font-medium mb-2",
              error ? "text-error-700" : success ? "text-success-700" : "text-gray-700"
            )}
          >
            {label}
          </label>
        )}

        {/* Select */}
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(baseSelectClasses, className)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Validation States */}
        {error && (
          <div className="flex items-center gap-2 text-error-600 text-caption mt-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-success-600 text-caption mt-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}
        
        {hint && !error && !success && (
          <p className="text-gray-500 text-caption mt-2">{hint}</p>
        )}
      </div>
    </div>
  )
}

export { ModernInput, ModernTextarea, ModernSelect } 