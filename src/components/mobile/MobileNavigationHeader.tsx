import React from 'react'

interface MobileNavigationHeaderProps {
  children?: React.ReactNode
  className?: string
  [key: string]: any
}

export const MobileNavigationHeader = ({ children, className = '', ...props }: MobileNavigationHeaderProps) => {
  return (
    <header 
      className={`sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`} 
      {...props}
    >
      {children}
    </header>
  )
} 