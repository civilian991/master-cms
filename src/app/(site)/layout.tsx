import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Search, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = siteConfig.getConfig();

  return (
    <>
      {/* Main Site Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              {siteSettings.branding?.logoUrl ? (
                <img
                  src={siteSettings.branding.logoUrl}
                  alt={siteSettings.branding?.logoAltEn || siteSettings.name}
                  className="h-6 w-auto"
                />
              ) : (
                <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">
                    {siteSettings.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden font-bold sm:inline-block">
                {siteSettings.name}
              </span>
            </Link>
          </div>
          
          {/* Main Navigation */}
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {siteSettings.navigation?.main?.filter(item => item !== 'search').map((item) => (
              <Link
                key={item}
                href={item === 'home' ? '/' : `/${item}`}
                className="transition-colors hover:text-foreground/80 text-foreground/60 capitalize"
               >
                {item}
              </Link>
            ))}
          </nav>
          
          {/* Search and User Menu */}
          <div className="flex flex-1 items-center justify-end space-x-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="pl-8 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <Link href="/search" className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* User Menu - TODO: Add authentication check */}
            <div className="flex items-center space-x-2">
              {/* User Menu Dropdown - when authenticated */}
              <div className="hidden group relative">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-accent">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="block px-4 py-2 text-sm hover:bg-accent">
                      Profile
                    </Link>
                    <Link href="/dashboard/preferences" className="block px-4 py-2 text-sm hover:bg-accent">
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-accent">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign In Link - when not authenticated */}
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
      {/* Site Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Site Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                {siteSettings.branding?.logoUrl ? (
                  <img
                    src={siteSettings.branding.logoUrl}
                    alt={siteSettings.branding?.logoAltEn || siteSettings.name}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">
                      {siteSettings.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{siteSettings.name}</h3>
              </div>
              {siteSettings.description && (
                <p className="text-muted-foreground mb-4 max-w-md">
                  {siteSettings.description}
                </p>
              )}
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Quick Links</h4>
              <nav className="space-y-2">
                {siteSettings.navigation?.main?.map((item) => (
                  <a
                    key={item}
                    href={item === 'home' ? '/' : `/${item}`}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors capitalize"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            
            {/* Footer Links */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Legal & Support</h4>
              <nav className="space-y-2">
                {siteSettings.navigation?.footer?.map((item) => (
                  <a
                    key={item}
                    href={`/${item}`}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors capitalize"
                  >
                    {item}
                  </a>
                ))}
                <a
                  href="/help"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </a>
                <a
                  href="/support"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Support
                </a>
              </nav>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {siteSettings.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
} 