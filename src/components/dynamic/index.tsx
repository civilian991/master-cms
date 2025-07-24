/**
 * Dynamic imports for code splitting optimization
 * Large components are loaded only when needed
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for better UX
const LoadingDashboard = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">Loading dashboard...</span>
    </div>
  );
};

// Accessibility Settings - 1271 lines
export const AccessibilitySettings = dynamic(
  () => import('../accessibility/AccessibilitySettings'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Client-side only for accessibility features
  }
);

// Advanced Content Generation - 1137 lines
export const AdvancedContentGeneration = dynamic(
  () => import('../ai/AdvancedContentGeneration'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Heavy AI component, load on demand
  }
);

// Content Marketing Dashboard - 1056 lines  
export const ContentMarketingDashboard = dynamic(
  () => import('../content-marketing/ContentMarketingDashboard'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Dashboard component
  }
);

// Influencer Outreach Dashboard - 1044 lines
export const InfluencerOutreachDashboard = dynamic(
  () => import('../influencer-outreach/InfluencerOutreachDashboard'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Dashboard component
  }
);

// Business Intelligence Dashboard - 1020 lines
export const BusinessIntelligenceDashboard = dynamic(
  () => import('../admin/business-intelligence/BusinessIntelligenceDashboard'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Dashboard component
  }
);

// SEO Tools Dashboard - 1016 lines
export const SEOToolsDashboard = dynamic(
  () => import('../seo-tools/SEOToolsDashboard'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Dashboard component
  }
);

// A/B Testing Dashboard - 965 lines
export const ABTestingDashboard = dynamic(
  () => import('../ab-testing/ABTestingDashboard'),
  {
    loading: () => <LoadingDashboard />,
    ssr: false, // Dashboard component
  }
);

// Admin Dashboards (group multiple related ones)
export const AdminDashboards = {
  CRM: dynamic(() => import('../admin/crm/CRMDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  Advertising: dynamic(() => import('../admin/advertising/AdvertisingDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  Analytics: dynamic(() => import('../analytics/AnalyticsDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
};

// Marketing Tools (group related ones)
export const MarketingTools = {
  EmailMarketing: dynamic(() => import('../email-marketing/EmailMarketingDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  LeadGeneration: dynamic(() => import('../lead-generation/LeadGenerationDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  MarketingAutomation: dynamic(() => import('../marketing-automation/MarketingAutomationDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  SocialMedia: dynamic(() => import('../social-media/SocialMediaDashboard'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
};

// AI Components (group AI-related ones)
export const AIComponents = {
  ContentGeneration: AdvancedContentGeneration,
  Analytics: dynamic(() => import('../ai/AnalyticsAI'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  Recommendations: dynamic(() => import('../ai/AIRecommendations'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
};

// Mobile Components (separate bundle for mobile)
export const MobileComponents = {
  Layout: dynamic(() => import('../mobile/MobileLayout'), {
    loading: () => <LoadingDashboard />,
    ssr: true, // Keep SSR for layout
  }),
  Navigation: dynamic(() => import('../mobile/MobileNavigation'), {
    loading: () => <LoadingDashboard />,
    ssr: true,
  }),
  TouchOptimized: dynamic(() => import('../mobile/TouchOptimized'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
};

// Reading Components (for article pages)
export const ReadingComponents = {
  ContentClustering: dynamic(() => import('../reading/ContentClustering'), {
    loading: () => <LoadingDashboard />,
    ssr: false, // Enhanced reading features
  }),
  SmartTagging: dynamic(() => import('../reading/SmartTagging'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
  ReadingAnalytics: dynamic(() => import('../reading/ReadingAnalytics'), {
    loading: () => <LoadingDashboard />,
    ssr: false,
  }),
};

// Performance monitoring
export const trackComponentLoad = (componentName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${componentName}-load-start`);
    
    // Measure load time after a short delay to allow rendering
    setTimeout(() => {
      try {
        performance.mark(`${componentName}-load-end`);
        performance.measure(
          `${componentName}-load-time`,
          `${componentName}-load-start`,
          `${componentName}-load-end`
        );
      } catch (error) {
        console.warn(`Performance measurement failed for ${componentName}:`, error);
      }
    }, 100);
  }
}; 