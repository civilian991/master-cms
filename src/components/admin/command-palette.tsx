"use client"

import { useState, useEffect } from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  FileText,
  Globe,
  Users,
  BarChart3,
  Search,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

const commandItems = [
  {
    group: "Suggestions",
    items: [
      {
        title: "Dashboard",
        icon: BarChart3,
        shortcut: "⌘D",
        action: "/admin/dashboard"
      },
      {
        title: "Articles",
        icon: FileText,
        shortcut: "⌘A",
        action: "/admin/articles"
      },
      {
        title: "Users",
        icon: Users,
        shortcut: "⌘U",
        action: "/admin/users"
      },
      {
        title: "Settings",
        icon: Settings,
        shortcut: "⌘S",
        action: "/admin/settings"
      }
    ]
  },
  {
    group: "Content",
    items: [
      {
        title: "New Article",
        icon: FileText,
        action: "/admin/articles/new"
      },
      {
        title: "Categories",
        icon: Calendar,
        action: "/admin/categories"
      },
      {
        title: "Media Library",
        icon: Smile,
        action: "/admin/media"
      }
    ]
  },
  {
    group: "System", 
    items: [
      {
        title: "Site Management",
        icon: Globe,
        action: "/admin/sites"
      },
      {
        title: "Analytics",
        icon: Calculator,
        action: "/admin/analytics"
      },
      {
        title: "User Profile",
        icon: User,
        action: "/admin/profile"
      },
      {
        title: "Billing",
        icon: CreditCard,
        action: "/admin/billing"
      }
    ]
  }
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (action: string) => {
    setOpen(false)
    if (action.startsWith("/")) {
      window.location.href = action
    }
  }

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      title="Command Menu"
      description="Type a command or search..."
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commandItems.map((group) => (
          <div key={group.group}>
            <CommandGroup heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.title}
                  onSelect={() => handleSelect(item.action)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                                     {"shortcut" in item && item.shortcut && (
                     <CommandShortcut>{item.shortcut}</CommandShortcut>
                   )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
} 