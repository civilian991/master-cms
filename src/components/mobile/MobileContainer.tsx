import React from 'react'

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
}

export const MobileContainer = ({ children, className = '' }: MobileContainerProps) => {
  return (
    <div className={`max-w-none md:max-w-2xl lg:max-w-4xl mx-auto px-4 ${className}`}>
      {children}
    </div>
  )
} 