"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ModernThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg border border-gray-200 bg-white shadow-soft"
      >
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-lg border border-gray-200 bg-white shadow-soft transition-all duration-200",
            "hover:bg-gray-50 hover:shadow-medium hover:scale-105",
            "dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-48 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-elevated",
          "dark:bg-gray-900/95 dark:border-gray-700/50"
        )}
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            theme === 'light' && "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="flex-1">Light</span>
          {theme === 'light' && <Check className="h-4 w-4 text-brand-600" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            theme === 'dark' && "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="flex-1">Dark</span>
          {theme === 'dark' && <Check className="h-4 w-4 text-brand-600" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            theme === 'system' && "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
          )}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="flex-1">System</span>
          {theme === 'system' && <Check className="h-4 w-4 text-brand-600" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact theme toggle for mobile
export function CompactThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn(
        "h-8 w-8 rounded-lg border border-gray-200 bg-white shadow-soft transition-all duration-200",
        "hover:bg-gray-50 hover:shadow-medium hover:scale-105",
        "dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      )}
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 