"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  Search, 
  Globe, 
  Sun, 
  Moon,
  BookOpen,
  Users,
  Building,
  Newspaper,
  TrendingUp,
  Settings,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  locale: 'en' | 'ar'
  siteConfig: any
  categories?: Array<{
    id: string
    name: string
    slug: string
    description?: string
    articleCount?: number
  }>
  className?: string
}

interface NavigationItem {
  title: string
  href: string
  description?: string
  icon?: any
  badge?: string
}

const getLocalizedContent = (locale: 'en' | 'ar') => {
  return {
    en: {
      home: "Home",
      articles: "Articles",
      categories: "Categories", 
      about: "About",
      contact: "Contact",
      search: "Search...",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      language: "Language",
      menu: "Menu",
      close: "Close",
      signIn: "Sign In",
      exploreCategories: "Explore Categories",
      popularTopics: "Popular Topics",
      company: "Company",
      resources: "Resources",
      allArticles: "All Articles",
      trending: "Trending",
      recent: "Recent",
      searchPlaceholder: "Search articles, categories...",
      noResults: "No results found."
    },
    ar: {
      home: "الرئيسية",
      articles: "المقالات", 
      categories: "الفئات",
      about: "حول",
      contact: "اتصل بنا",
      search: "البحث...",
      darkMode: "الوضع المظلم",
      lightMode: "الوضع الفاتح", 
      language: "اللغة",
      menu: "القائمة",
      close: "إغلاق",
      signIn: "تسجيل الدخول",
      exploreCategories: "استكشف الفئات",
      popularTopics: "المواضيع الشائعة",
      company: "الشركة",
      resources: "الموارد",
      allArticles: "جميع المقالات",
      trending: "المتداول",
      recent: "الحديث",
      searchPlaceholder: "البحث في المقالات والفئات...",
      noResults: "لم يتم العثور على نتائج."
    }
  }[locale]
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string
    description?: string
    icon?: React.ComponentType<{ className?: string }>
    badge?: string
  }
>(({ className, title, description, icon: Icon, badge, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <div className="text-sm font-medium leading-none">{title}</div>
            {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          </div>
          {description && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {description}
            </p>
          )}
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

function SearchDialog({ 
  locale, 
  open, 
  onOpenChange 
}: { 
  locale: 'en' | 'ar'
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const content = getLocalizedContent(locale)
  
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={content.searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{content.noResults}</CommandEmpty>
        <CommandGroup heading={content.articles}>
          <CommandItem>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Getting Started with React</span>
          </CommandItem>
          <CommandItem>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Market Analysis 2024</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading={content.categories}>
          <CommandItem>
            <Building className="mr-2 h-4 w-4" />
            <span>Technology</span>
          </CommandItem>
          <CommandItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Business</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

function MobileMenu({ 
  locale, 
  categories = [], 
  open, 
  onOpenChange 
}: { 
  locale: 'en' | 'ar'
  categories: any[]
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const content = getLocalizedContent(locale)
  const pathname = usePathname()
  
  const mainNavItems: NavigationItem[] = [
    { title: content.home, href: `/${locale}`, icon: BookOpen },
    { title: content.articles, href: `/${locale}/articles`, icon: Newspaper },
    { title: content.categories, href: `/${locale}/categories`, icon: Building },
    { title: content.about, href: `/${locale}/about`, icon: Users },
    { title: content.contact, href: `/${locale}/contact`, icon: Settings },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-80 pr-0">
        <div className="flex flex-col h-full">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">{content.menu}</h2>
          </div>
          
          <div className="flex-1 overflow-auto py-4">
            <nav className="space-y-1 px-6">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                   >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            
            {categories.length > 0 && (
              <div className="mt-6 px-6">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">{content.categories}</h3>
                <div className="space-y-1">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/${locale}/categories/${category.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                     >
                      <span>{category.name}</span>
                      {category.articleCount && (
                        <Badge variant="secondary" className="text-xs">
                          {category.articleCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t px-6 py-4">
            <Link href="/auth/signin" onClick={() => onOpenChange(false)}>
              <Button className="w-full">
                {content.signIn}
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ModernNavigation({ locale, siteConfig, categories = [], className }: NavigationProps) {
  const content = getLocalizedContent(locale)
  const pathname = usePathname()
  const isRTL = locale === 'ar'
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const articlesNavItems: NavigationItem[] = [
    { 
      title: content.allArticles, 
      href: `/${locale}/articles`, 
      description: "Browse all our published content",
      icon: BookOpen 
    },
    { 
      title: content.trending, 
      href: `/${locale}/articles/trending`, 
      description: "Most popular articles this week",
      icon: TrendingUp,
      badge: "Hot"
    },
    { 
      title: content.recent, 
      href: `/${locale}/articles/recent`, 
      description: "Latest published articles",
      icon: Newspaper 
    },
  ]

  const companyNavItems: NavigationItem[] = [
    { 
      title: content.about, 
      href: `/${locale}/about`, 
      description: "Learn about our mission and team",
      icon: Users 
    },
    { 
      title: content.contact, 
      href: `/${locale}/contact`, 
      description: "Get in touch with us",
      icon: Settings 
    },
  ]

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}>
        <div className="container flex h-16 items-center">
          {/* Logo */}
          <div className="mr-6 flex">
            <Link
              href={`/${locale}`}
              className="flex items-center space-x-3"
             >
              {siteConfig.branding?.logoUrl ? (
                <img
                  src={siteConfig.branding.logoUrl}
                  alt={siteConfig.name}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {siteConfig.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden font-bold sm:inline-block">
                {siteConfig.name}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href={`/${locale}`} className={navigationMenuTriggerStyle()}>
                  {content.home}
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>{content.articles}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href={`/${locale}/articles`}
                        >
                          <BookOpen className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            {content.articles}
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Explore our comprehensive collection of articles and insights.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    {articlesNavItems.map((item) => (
                      <ListItem
                        key={item.href}
                        href={item.href}
                        title={item.title}
                        description={item.description}
                        icon={item.icon}
                        badge={item.badge}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>{content.categories}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {categories.slice(0, 6).map((category) => (
                      <ListItem
                        key={category.id}
                        title={category.name}
                        href={`/${locale}/categories/${category.slug}`}
                        description={category.description}
                        badge={category.articleCount?.toString()}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>{content.company}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
                    {companyNavItems.map((item) => (
                      <ListItem
                        key={item.href}
                        href={item.href}
                        title={item.title}
                        description={item.description}
                        icon={item.icon}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions */}
          <div className="flex flex-1 items-center justify-end space-x-4">
            {/* Search */}
            <Button
              variant="outline"
              size="sm"
              className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline-flex">{content.search}</span>
              <span className="sr-only">{content.search}</span>
            </Button>

            {/* Language Toggle */}
            <Button variant="ghost" size="sm" asChild>
              <Link href={locale === 'en' ? '/ar' : '/en'}>
                <Globe className="h-4 w-4 mr-2" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </Link>
            </Button>

            {/* Sign In */}
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/auth/signin">
                {content.signIn}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{content.menu}</span>
            </Button>
          </div>
        </div>
      </header>
      {/* Mobile Menu */}
      <MobileMenu
        locale={locale}
        categories={categories}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
      {/* Search Dialog */}
      <SearchDialog
        locale={locale}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </>
  );
} 