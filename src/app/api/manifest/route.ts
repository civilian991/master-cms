/**
 * Dynamic PWA Manifest API
 * Generates manifests based on site configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/config/site';

export async function GET(request: NextRequest) {
  try {
    const config = siteConfig.getConfig();
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme') || 'default';

    // Generate theme-specific colors
    const themeColors = {
      'himaya': {
        theme_color: '#2C3E50',
        background_color: '#FFFFFF'
      },
      'unlock-bc': {
        theme_color: '#228B22',
        background_color: '#F8F9FA'
      },
      'iktissad': {
        theme_color: '#007BFF',
        background_color: '#FFFFFF'
      },
      'defaiya': {
        theme_color: '#6F42C1',
        background_color: '#F8F9FA'
      },
      'default': {
        theme_color: config.branding?.primaryColor || '#2563eb',
        background_color: '#FFFFFF'
      }
    };

    const colors = themeColors[theme as keyof typeof themeColors] || themeColors.default;

    // Generate dynamic manifest
    const manifest = {
      name: config.name,
      short_name: config.name.length > 12 ? config.name.substring(0, 12) : config.name,
      description: config.description || `AI-powered content management for ${config.name}`,
      start_url: '/',
      display: 'standalone',
      display_override: ['window-controls-overlay', 'minimal-ui'],
      orientation: 'portrait-primary',
      theme_color: colors.theme_color,
      background_color: colors.background_color,
      scope: '/',
      lang: config.locale || 'en',
      dir: config.locale === 'ar' ? 'rtl' : 'ltr',
      
      // Dynamic icons based on site
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ],

      // Screenshots for app stores
      screenshots: [
        {
          src: '/screenshots/mobile-home.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Homepage on mobile'
        },
        {
          src: '/screenshots/mobile-articles.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Articles view on mobile'
        },
        {
          src: '/screenshots/desktop-dashboard.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Dashboard on desktop'
        }
      ],

      // App categories
      categories: ['news', 'education', 'business', 'productivity'],

      // Dynamic shortcuts based on site features
      shortcuts: generateShortcuts(config),

      // Advanced PWA features
      related_applications: [],
      prefer_related_applications: false,
      
      // Edge features
      edge_side_panel: {
        preferred_width: 400
      },
      
      // Launch behavior
      launch_handler: {
        client_mode: 'focus-existing'
      },
      
      // Link handling
      handle_links: 'preferred',
      
      // Protocol handlers
      protocol_handlers: [
        {
          protocol: 'web+cms',
          url: '/share?url=%s'
        }
      ],
      
      // Share target
      share_target: {
        action: '/share',
        method: 'POST',
        params: {
          title: 'title',
          text: 'text',
          url: 'url'
        }
      },
      
      // File handlers
      file_handlers: [
        {
          action: '/import',
          accept: {
            'text/markdown': ['.md'],
            'text/plain': ['.txt'],
            'application/json': ['.json']
          }
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Manifest generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}

/**
 * Generate dynamic shortcuts based on site configuration
 */
function generateShortcuts(config: any) {
  const shortcuts = [];

  // Always include search
  shortcuts.push({
    name: 'Search',
    short_name: 'Search',
    description: 'Search articles and content',
    url: '/search',
    icons: [
      {
        src: '/icons/shortcut-search.png',
        sizes: '192x192'
      }
    ]
  });

  // Content creation shortcuts (if user has permissions)
  if (config.features?.articles !== false) {
    shortcuts.push({
      name: 'New Article',
      short_name: 'New Article',
      description: 'Create a new article',
      url: '/dashboard/articles/new',
      icons: [
        {
          src: '/icons/shortcut-new-article.png',
          sizes: '192x192'
        }
      ]
    });
  }

  // Dashboard shortcut
  shortcuts.push({
    name: 'Dashboard',
    short_name: 'Dashboard',
    description: 'Access your dashboard',
    url: '/dashboard',
    icons: [
      {
        src: '/icons/shortcut-dashboard.png',
        sizes: '192x192'
      }
    ]
  });

  // Bookmarks if enabled
  shortcuts.push({
    name: 'Bookmarks',
    short_name: 'Bookmarks',
    description: 'View saved articles',
    url: '/dashboard/bookmarks',
    icons: [
      {
        src: '/icons/shortcut-bookmarks.png',
        sizes: '192x192'
      }
    ]
  });

  return shortcuts;
} 