import { notFound } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { ModernNavigation } from '@/components/site/modern-navigation'

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

// Validate locale
function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({ 
  children, 
  params 
}: LocaleLayoutProps) {
  const { locale } = await params;
  // Validate locale parameter
  if (!isValidLocale(locale)) {
    notFound()
  }

  const siteSettings = siteConfig.getConfig()
  const isRTL = locale === 'ar'

  return (
    <div className="min-h-screen flex flex-col" lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Modern Navigation */}
      <ModernNavigation 
        locale={locale}
        siteConfig={siteSettings}
        categories={[]} // This will be populated by fetching categories
      />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Site Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                {siteSettings.branding?.logoUrl ? (
                  <img
                    src={siteSettings.branding.logoUrl}
                    alt={siteSettings.branding?.logoAltEn || siteSettings.name}
                    className="h-10 w-auto"
                  />
                ) : (
                  <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">
                      {siteSettings.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground">{siteSettings.name}</h3>
              </div>
              {siteSettings.description && (
                <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                  {locale === 'en' 
                    ? siteSettings.description 
                    : siteSettings.seo?.descriptionAr || siteSettings.description
                  }
                </p>
              )}
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {/* Add social media icons here */}
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6">
                {locale === 'en' ? 'Quick Links' : 'روابط سريعة'}
              </h4>
              <nav className="space-y-3">
                <a
                  href={`/${locale}`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Home' : 'الرئيسية'}
                </a>
                <a
                  href={`/${locale}/articles`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Articles' : 'المقالات'}
                </a>
                <a
                  href={`/${locale}/categories`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Categories' : 'الفئات'}
                </a>
                <a
                  href={`/${locale}/about`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'About' : 'حول'}
                </a>
              </nav>
            </div>
            
            {/* Footer Links */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6">
                {locale === 'en' ? 'Legal & Support' : 'القانونية والدعم'}
              </h4>
              <nav className="space-y-3">
                <a
                  href={`/${locale}/privacy`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
                </a>
                <a
                  href={`/${locale}/terms`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Terms of Service' : 'شروط الخدمة'}
                </a>
                <a
                  href={`/${locale}/contact`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Contact Us' : 'اتصل بنا'}
                </a>
                <a
                  href={`/${locale}/sitemap`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {locale === 'en' ? 'Sitemap' : 'خريطة الموقع'}
                </a>
              </nav>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-border mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {siteSettings.name}. 
                {locale === 'en' ? ' All rights reserved.' : ' جميع الحقوق محفوظة.'}
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-xs text-muted-foreground">
                  {locale === 'en' ? 'Powered by Master CMS' : 'مدعوم بواسطة Master CMS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Generate static params for supported locales
export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale: locale,
  }))
} 