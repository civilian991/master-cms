"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Search,
  Database,
  BarChart3,
  Folder,
  Tag,
  Image,
  Globe,
  Shield,
  Building,
  Mail,
  Palette,
} from "lucide-react"

import { NavMain } from "@/components/admin/nav-main"
import { NavSecondary } from "@/components/admin/nav-secondary"
import { NavUser } from "@/components/admin/nav-user"
import { NavDocs } from "@/components/admin/nav-docs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Content",
      url: "/admin/content",
      icon: FileText,
      items: [
        {
          title: "Articles",
          url: "/admin/articles",
        },
        {
          title: "Categories",
          url: "/admin/categories",
        },
        {
          title: "Tags",
          url: "/admin/tags",
        },
      ],
    },
    {
      title: "Media",
      url: "/admin/media",
      icon: Image,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Sites",
      url: "/admin/sites",
      icon: Globe,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/admin/help",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "/admin/search",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Content Database",
      url: "/admin/database",
      icon: Database,
    },
    {
      name: "Site Templates",
      url: "/admin/templates",
      icon: Folder,
    },
    {
      name: "Security",
      url: "/admin/security",
      icon: Shield,
    },
    {
      name: "Branding",
      url: "/admin/branding",
      icon: Palette,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin/dashboard">
                <Building className="!size-5" />
                <span className="text-base font-semibold">Himaya CMS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocs items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
} 