'use client'

import React, { createContext, useContext, useEffect } from 'react'
import Head from 'next/head'
import { useConfiguration } from './ConfigurationProvider'

interface SEOContextType {
  title: string
  description: string
  keywords: string
  ogImage: string | null
  twitterCard: 'summary' | 'summary_large_image'
  updateSEO: (updates: Partial<SEOContextType>) => void
}

const SEOContext = createContext<SEOContextType | undefined>(undefined)

export const useSEO = () => {
  const context = useContext(SEOContext)
  if (!context) {
    throw new Error('useSEO must be used within a SEOProvider')
  }
  return context
}

interface SEOProviderProps {
  children: React.ReactNode
  pageTitle?: string
  pageDescription?: string
  pageKeywords?: string
  pageImage?: string
}

export const SEOProvider: React.FC<SEOProviderProps> = ({
  children,
  pageTitle,
  pageDescription,
  pageKeywords,
  pageImage,
}) => {
  const { config, updateConfig } = useConfiguration()
  const seo = config.seo || {}

  const title = pageTitle || seo.titleEn || config.name || 'Master CMS Framework'
  const description = pageDescription || seo.descriptionEn || config.description || ''
  const keywords = pageKeywords || seo.keywordsEn || ''
  const ogImage = pageImage || seo.ogImage || null
  const twitterCard = seo.twitterCard || 'summary_large_image'

  const updateSEO = (updates: Partial<SEOContextType>) => {
    const seoUpdates: any = {}
    
    if (updates.title !== undefined) seoUpdates.titleEn = updates.title
    if (updates.description !== undefined) seoUpdates.descriptionEn = updates.description
    if (updates.keywords !== undefined) seoUpdates.keywordsEn = updates.keywords
    if (updates.ogImage !== undefined) seoUpdates.ogImage = updates.ogImage
    if (updates.twitterCard !== undefined) seoUpdates.twitterCard = updates.twitterCard

    updateConfig({
      seo: {
        ...config.seo,
        ...seoUpdates,
      },
    })
  }

  const value: SEOContextType = {
    title,
    description,
    keywords,
    ogImage,
    twitterCard,
    updateSEO,
  }

  return (
    <SEOContext.Provider value={value}>
      <Head>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={config.domain} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && <meta property="og:image:width" content="1200" />}
        {ogImage && <meta property="og:image:height" content="630" />}
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content={config.name} />
        <link rel="canonical" href={config.domain} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: config.name,
              description: config.description,
              url: config.domain,
              publisher: {
                '@type': 'Organization',
                name: config.name,
                logo: {
                  '@type': 'ImageObject',
                  url: config.branding?.logoUrl || `${config.domain}/logo.png`,
                },
              },
            }),
          }}
        />
      </Head>
      {children}
    </SEOContext.Provider>
  )
}

// SEO Meta Tags Component
export const SEOMetaTags: React.FC<{
  title?: string
  description?: string
  keywords?: string
  image?: string
  type?: string
  url?: string
}> = ({ title, description, keywords, image, type = 'website', url }) => {
  const { config } = useConfiguration()
  const seo = config.seo || {}

  const metaTitle = title || seo.titleEn || config.name
  const metaDescription = description || seo.descriptionEn || config.description
  const metaKeywords = keywords || seo.keywordsEn
  const metaImage = image || seo.ogImage
  const metaUrl = url || config.domain

  return (
    <>
      {/* Basic Meta Tags */}
      <meta name="title" content={metaTitle} />
      <meta name="description" content={metaDescription} />
      {metaKeywords && <meta name="keywords" content={metaKeywords} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      {metaImage && <meta property="og:image" content={metaImage} />}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={seo.twitterCard || 'summary_large_image'} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {metaImage && <meta name="twitter:image" content={metaImage} />}
    </>
  )
}

// Article Structured Data Component
export const ArticleStructuredData: React.FC<{
  title: string
  description: string
  author: string
  publishedDate: string
  modifiedDate?: string
  image?: string
  url: string
}> = ({ title, description, author, publishedDate, modifiedDate, image, url }) => {
  const { config } = useConfiguration()

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: config.name,
      logo: {
        '@type': 'ImageObject',
        url: config.branding?.logoUrl || `${config.domain}/logo.png`,
      },
    },
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}

// Organization Structured Data Component
export const OrganizationStructuredData: React.FC = () => {
  const { config } = useConfiguration()

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    description: config.description,
    url: config.domain,
    logo: config.branding?.logoUrl || `${config.domain}/logo.png`,
    sameAs: [
      // Add social media URLs here
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
} 