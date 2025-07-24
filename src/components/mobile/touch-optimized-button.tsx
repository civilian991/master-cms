"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const touchButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-brand text-white hover:opacity-90 active:scale-95 shadow-soft hover:shadow-medium",
        destructive: "bg-gradient-to-r from-error-500 to-error-600 text-white hover:opacity-90 active:scale-95 shadow-soft",
        outline: "border-2 border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 shadow-soft hover:shadow-medium",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
        ghost: "hover:bg-gray-100 active:bg-gray-200",
        link: "text-brand-600 underline-offset-4 hover:underline active:text-brand-700"
      },
      size: {
        sm: "h-10 px-4 text-sm min-w-[2.5rem]", // 40px min height for touch
        default: "h-11 px-6 text-base min-w-[2.75rem]", // 44px standard touch target
        lg: "h-14 px-8 text-lg min-w-[3.5rem]", // 56px large touch target
        xl: "h-16 px-10 text-xl min-w-[4rem]", // 64px extra large
        icon: "h-11 w-11", // Square touch target
        "icon-sm": "h-10 w-10",
        "icon-lg": "h-14 w-14"
      },
      touchFeedback: {
        scale: "active:scale-95 transition-transform",
        glow: "hover:shadow-lg active:shadow-xl transition-shadow",
        ripple: "relative overflow-hidden",
        bounce: "active:animate-bounce"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      touchFeedback: "scale"
    }
  }
)

export interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  hapticFeedback?: boolean
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchFeedback,
    asChild = false,
    loading = false,
    loadingText,
    hapticFeedback = true,
    children,
    onClick,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback for mobile devices
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10) // Short vibration
      }
      
      // Ripple effect for touch feedback
      if (touchFeedback === 'ripple') {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const ripple = document.createElement('span')
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        
        ripple.style.width = ripple.style.height = size + 'px'
        ripple.style.left = x + 'px'
        ripple.style.top = y + 'px'
        ripple.classList.add('ripple-effect')
        
        button.appendChild(ripple)
        
        setTimeout(() => {
          ripple.remove()
        }, 600)
      }
      
      onClick?.(e)
    }

    return (
      <Comp
        className={cn(touchButtonVariants({ variant, size, touchFeedback, className }))}
        ref={ref}
        onClick={handleClick}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg
            className={cn(
              "animate-spin mr-2",
              size === 'sm' ? "h-3 w-3" : 
              size === 'lg' ? "h-5 w-5" : 
              size === 'xl' ? "h-6 w-6" : "h-4 w-4"
            )}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading && loadingText ? loadingText : children}
      </Comp>
    )
  }
)

TouchButton.displayName = "TouchButton"

export { TouchButton, touchButtonVariants } 