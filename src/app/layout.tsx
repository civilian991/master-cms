import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// Font configurations with proper subsets and display optimization
const inter = Inter({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const merriweather = Merriweather({ 
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-merriweather",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Generate dynamic metadata based on site configuration
export async function generateMetadata(): Promise<Metadata> {
  const config = siteConfig.getConfig();
  
  return {
    title: {
      default: config.name,
      template: `%s | ${config.name}`
    },
    description: config.description,
    keywords: config.seo?.keywordsEn,
    authors: [{ name: config.name }],
    creator: config.name,
    publisher: config.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(config.domain),
    alternates: {
      canonical: config.domain,
    },
    openGraph: {
      type: 'website',
      locale: config.locale === 'ar' ? 'ar_AE' : 'en_US',
      url: config.domain,
      title: config.seo?.titleEn || config.name,
      description: config.seo?.descriptionEn || config.description,
      siteName: config.name,
      images: config.seo?.ogImage ? [
        {
          url: config.seo.ogImage,
          width: 1200,
          height: 630,
          alt: config.name,
        },
      ] : [],
    },
    twitter: {
      card: config.seo?.twitterCard || 'summary_large_image',
      title: config.seo?.titleEn || config.name,
      description: config.seo?.descriptionEn || config.description,
      images: config.seo?.ogImage ? [config.seo.ogImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

// Site-specific theme configuration
function generateThemeVariables(siteSettings: any) {
  const branding = siteSettings.branding || {};
  
  const themeVars: Record<string, string> = {};
  
  if (branding.primaryColor) {
    themeVars['--color-primary'] = branding.primaryColor;
  }
  if (branding.secondaryColor) {
    themeVars['--color-secondary'] = branding.secondaryColor;
  }
  if (branding.accentColor) {
    themeVars['--color-accent'] = branding.accentColor;
  }
  if (branding.fontFamily) {
    themeVars['--font-family'] = branding.fontFamily;
  }
  
  return themeVars;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = siteConfig.getConfig();
  const siteSettings = config;
  const themeVars = generateThemeVariables(siteSettings);

  return (
    <html 
      className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Viewport and mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Theme Variables */}
        {Object.keys(themeVars).length > 0 && (
          <style dangerouslySetInnerHTML={{ 
            __html: `:root { ${Object.entries(themeVars).map(([key, value]) => `${key}: ${value}`).join('; ')} }` 
          }} />
        )}
        
        {/* Custom Branding CSS */}
        {siteSettings.branding?.customCss && (
          <style dangerouslySetInnerHTML={{ __html: siteSettings.branding.customCss }} />
        )}
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
