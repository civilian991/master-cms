import { siteConfig } from '@/config/site';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  featuredImage?: string;
  readingTime: number;
  views: number;
  content?: string;
}

interface Organization {
  name: string;
  domain: string;
  description?: string;
  logo?: string;
  foundingDate?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
  sameAs?: string[];
}

interface StructuredDataProps {
  type: 'article' | 'organization' | 'website' | 'breadcrumb';
  data?: Article | Organization | any;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function StructuredData({ type, data, breadcrumbs }: StructuredDataProps) {
  const config = siteConfig.getConfig();
  
  const generateArticleStructuredData = (article: Article) => {
    const baseUrl = config.domain;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt,
      image: article.featuredImage ? [article.featuredImage] : [],
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: {
        '@type': 'Person',
        name: article.author.name,
        image: article.author.avatar,
        description: article.author.bio,
        url: `${baseUrl}/authors/${article.author.id}`
      },
      publisher: {
        '@type': 'Organization',
        name: config.name,
        logo: {
          '@type': 'ImageObject',
          url: config.branding?.logoUrl || `${baseUrl}/logo.png`,
          width: 200,
          height: 60
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/articles/${article.slug}`
      },
      articleSection: article.category.name,
      keywords: article.tags?.map(tag => tag.name).join(', '),
      wordCount: article.content ? article.content.split(' ').length : undefined,
      timeRequired: `PT${article.readingTime}M`,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: article.views
      },
      url: `${baseUrl}/articles/${article.slug}`,
      isAccessibleForFree: true,
      genre: article.category.name,
      about: {
        '@type': 'Thing',
        name: article.category.name
      }
    };
  };

  const generateOrganizationStructuredData = (org: Organization) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      url: org.domain,
      description: org.description,
      logo: {
        '@type': 'ImageObject',
        url: org.logo || `${org.domain}/logo.png`,
        width: 200,
        height: 60
      },
      foundingDate: org.foundingDate,
      contactPoint: org.contactPoint ? {
        '@type': 'ContactPoint',
        telephone: org.contactPoint.telephone,
        email: org.contactPoint.email,
        contactType: org.contactPoint.contactType || 'customer service'
      } : undefined,
      sameAs: org.sameAs || [],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${org.domain}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  };

  const generateWebsiteStructuredData = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.name,
      description: config.description,
      url: config.domain,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${config.domain}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: config.name,
        logo: {
          '@type': 'ImageObject',
          url: config.branding?.logoUrl || `${config.domain}/logo.png`,
          width: 200,
          height: 60
        }
      },
      inLanguage: config.locale === 'ar' ? 'ar-AE' : 'en-US',
      copyrightYear: new Date().getFullYear(),
      copyrightHolder: {
        '@type': 'Organization',
        name: config.name
      }
    };
  };

  const generateBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  };

  let structuredData;

  switch (type) {
    case 'article':
      if (!data) return null;
      structuredData = generateArticleStructuredData(data as Article);
      break;
    case 'organization':
      if (!data) return null;
      structuredData = generateOrganizationStructuredData(data as Organization);
      break;
    case 'website':
      structuredData = generateWebsiteStructuredData();
      break;
    case 'breadcrumb':
      if (!breadcrumbs) return null;
      structuredData = generateBreadcrumbStructuredData(breadcrumbs);
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 0)
      }}
    />
  );
}

// Convenience components for specific use cases
export function ArticleStructuredData({ article }: { article: Article }) {
  return <StructuredData type="article" data={article} />;
}

export function OrganizationStructuredData({ organization }: { organization: Organization }) {
  return <StructuredData type="organization" data={organization} />;
}

export function WebsiteStructuredData() {
  return <StructuredData type="website" />;
}

export function BreadcrumbStructuredData({ breadcrumbs }: { breadcrumbs: Array<{ name: string; url: string }> }) {
  return <StructuredData type="breadcrumb" breadcrumbs={breadcrumbs} />;
} 