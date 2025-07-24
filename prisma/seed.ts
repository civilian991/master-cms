import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding master CMS framework with enhanced schema...')

  // Create master site
  const masterSite = await prisma.site.upsert({
    where: { domain: 'http://localhost:3000' },
    update: {},
    create: {
      name: 'Master CMS Framework',
      domain: 'http://localhost:3000',
      description: 'AI-Powered CMS Framework for Media Companies',
      locale: 'en',
      theme: 'default',
      branding: 'default',
      isActive: true,
    },
  })

  console.log('✅ Master site created:', masterSite.name)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@master-cms.com' },
    update: {},
    create: {
      email: 'admin@master-cms.com',
      password: '$2b$10$k6YoIi5XBjehNbjSPDpzeuDAE1hl5weRw4SjG7KEUdkkQm6nqXN.W', // 'password123'
      name: 'Master Admin',
      role: 'ADMIN',
      locale: 'en',
      siteId: masterSite.id,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // Create default category
  const defaultCategory = await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: {
      slug: 'general',
      nameEn: 'General',
      nameAr: 'عام',
      descriptionEn: 'General articles and content',
      descriptionAr: 'مقالات ومحتوى عام',
      siteId: masterSite.id,
    },
  })

  console.log('✅ Default category created:', defaultCategory.nameEn)

  // Create default tag
  const defaultTag = await prisma.tag.upsert({
    where: { slug: 'news' },
    update: {},
    create: {
      slug: 'news',
      nameEn: 'News',
      nameAr: 'أخبار',
      descriptionEn: 'Latest news and updates',
      descriptionAr: 'آخر الأخبار والتحديثات',
      siteId: masterSite.id,
    },
  })

  console.log('✅ Default tag created:', defaultTag.nameEn)

  // Create a sample article
  const sampleArticle = await prisma.article.upsert({
    where: { slug: 'welcome-to-master-cms' },
    update: {},
    create: {
      titleEn: 'Welcome to Master CMS Framework',
      titleAr: 'مرحباً بكم في إطار عمل إدارة المحتوى الرئيسي',
      contentEn: 'This is a sample article demonstrating the Master CMS Framework capabilities. You can now log in as an administrator and start managing your content.',
      contentAr: 'هذا مقال نموذجي يوضح قدرات إطار عمل إدارة المحتوى الرئيسي. يمكنكم الآن تسجيل الدخول كمسؤول والبدء في إدارة المحتوى.',
      slug: 'welcome-to-master-cms',
      excerptEn: 'Welcome to the Master CMS Framework - your foundation for building powerful content management systems.',
      excerptAr: 'مرحباً بكم في إطار عمل إدارة المحتوى الرئيسي - الأساس لبناء أنظمة إدارة محتوى قوية.',
      authorId: adminUser.id,
      categoryId: defaultCategory.id,
      status: 'PUBLISHED',
      workflowState: 'PUBLISHED',
      published: true,
      publishedAt: new Date(),
      siteId: masterSite.id,
    },
  })

  console.log('✅ Sample article created:', sampleArticle.titleEn)

  // Create article-tag relationship
  await prisma.articleTag.create({
    data: {
      articleId: sampleArticle.id,
      tagId: defaultTag.id,
    }
  })

  console.log('✅ Article connected to tag')

  // Create site settings
  const siteSettings = [
    { key: 'site_name', value: 'Master CMS Framework', description: 'Site display name' },
    { key: 'site_description', value: 'AI-Powered CMS Framework for Media Companies', description: 'Site description' },
    { key: 'default_locale', value: 'en', description: 'Default site locale' },
    { key: 'theme', value: 'default', description: 'Default theme' },
    { key: 'branding', value: 'default', description: 'Default branding' },
  ]

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: {
        siteId_key: {
          siteId: masterSite.id,
          key: setting.key
        }
      },
      update: {},
      create: {
        ...setting,
        siteId: masterSite.id,
      },
    })
  }

  console.log('✅ Site settings created')

  // Create enhanced multi-site configuration
  const siteConfiguration = await prisma.siteConfiguration.upsert({
    where: { siteId: masterSite.id },
    update: {},
    create: {
      seoTitleEn: 'Master CMS Framework - AI-Powered Content Management',
      seoTitleAr: 'إطار عمل إدارة المحتوى الرئيسي - إدارة محتوى مدعومة بالذكاء الاصطناعي',
      seoDescriptionEn: 'Advanced content management system with AI capabilities for modern media companies',
      seoDescriptionAr: 'نظام إدارة محتوى متقدم مع قدرات الذكاء الاصطناعي للشركات الإعلامية الحديثة',
      seoKeywordsEn: 'CMS, AI, content management, media, publishing',
      seoKeywordsAr: 'إدارة محتوى، ذكاء اصطناعي، إعلام، نشر',
      navigationStructure: {
        main: ['home', 'articles', 'categories', 'about', 'contact'],
        footer: ['privacy', 'terms', 'sitemap']
      },
      contentTypes: {
        articles: true,
        newsletters: true,
        magazines: true,
        videos: false,
        podcasts: false
      },
      features: {
        ai: true,
        analytics: true,
        monetization: true,
        multilingual: true
      },
      siteId: masterSite.id,
    },
  })

  console.log('✅ Site configuration created')

  // Create site branding
  const siteBranding = await prisma.siteBranding.upsert({
    where: { siteId: masterSite.id },
    update: {},
    create: {
      logoUrl: '/images/logo.png',
      logoAltEn: 'Master CMS Framework Logo',
      logoAltAr: 'شعار إطار عمل إدارة المحتوى الرئيسي',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      fontFamily: 'Inter, system-ui, sans-serif',
      customCss: '',
      faviconUrl: '/favicon.ico',
      siteId: masterSite.id,
    },
  })

  console.log('✅ Site branding created')

  // Create AI configuration
  const aiConfiguration = await prisma.aIConfiguration.upsert({
    where: { siteId: masterSite.id },
    update: {},
    create: {
      personality: 'professional',
      tone: 'neutral',
      languageStyle: 'modern',
      contentLength: 'medium',
      seoOptimization: true,
      autoPublish: false,
      qualityThreshold: 0.8,
      siteId: masterSite.id,
    },
  })

  console.log('✅ AI configuration created')

  // Create sample subscription
  const sampleSubscription = await prisma.subscription.create({
    data: {
      planType: 'PREMIUM',
      status: 'ACTIVE',
      currency: 'USD',
      amount: 29.99,
      billingCycle: 'MONTHLY',
      startDate: new Date(),
      siteId: masterSite.id,
      userId: adminUser.id,
    },
  })

  console.log('✅ Sample subscription created')

  // Create sample payment
  const samplePayment = await prisma.payment.create({
    data: {
      amount: 29.99,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'CREDIT_CARD',
      gateway: 'STRIPE',
      transactionId: 'txn_123456789',
      siteId: masterSite.id,
      userId: adminUser.id,
      subscriptionId: sampleSubscription.id,
    },
  })

  console.log('✅ Sample payment created')

  // Create sample advertisement
  const sampleAdvertisement = await prisma.advertisement.create({
    data: {
      name: 'Sample Display Ad',
      type: 'DISPLAY',
      contentEn: 'Discover the power of AI-driven content management',
      contentAr: 'اكتشف قوة إدارة المحتوى المدعومة بالذكاء الاصطناعي',
      imageUrl: '/images/sample-ad.jpg',
      linkUrl: 'https://example.com',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      impressions: 0,
      clicks: 0,
      ctr: 0,
      revenue: 0,
      siteId: masterSite.id,
    },
  })

  console.log('✅ Sample advertisement created')

  // Create sample analytics
  const sampleAnalytics = await prisma.analytics.create({
    data: {
      pageViews: 1000,
      uniqueVisitors: 500,
      bounceRate: 0.35,
      avgSessionDuration: 180,
      date: new Date(),
      siteId: masterSite.id,
    },
  })

  console.log('✅ Sample analytics created')

  // Create sample revenue analytics
  const sampleRevenueAnalytics = await prisma.revenueAnalytics.create({
    data: {
      revenue: 299.99,
      currency: 'USD',
      subscriptionRevenue: 299.99,
      advertisingRevenue: 0,
      otherRevenue: 0,
      date: new Date(),
      siteId: masterSite.id,
    },
  })

  console.log('✅ Sample revenue analytics created')

  // Create sample content analytics
  const sampleContentAnalytics = await prisma.contentAnalytics.create({
    data: {
      pageViews: 150,
      uniqueViews: 120,
      avgTimeOnPage: 120,
      bounceRate: 0.25,
      shares: 5,
      comments: 3,
      likes: 25,
      date: new Date(),
      siteId: masterSite.id,
      articleId: sampleArticle.id,
    },
  })

  console.log('✅ Sample content analytics created')

  // Create sample content optimization
  const sampleContentOptimization = await prisma.contentOptimization.create({
    data: {
      seoScore: 85,
      readabilityScore: 90,
      performanceScore: 95,
      suggestions: {
        seo: ['Add more keywords', 'Improve meta description'],
        readability: ['Break up long paragraphs', 'Add subheadings'],
        performance: ['Optimize images', 'Minimize CSS']
      },
      siteId: masterSite.id,
      articleId: sampleArticle.id,
    },
  })

  console.log('✅ Sample content optimization created')

  // Create sample automation workflow
  const sampleWorkflow = await prisma.automationWorkflow.create({
    data: {
      name: 'Daily Content Publishing',
      description: 'Automated workflow for daily content publishing',
      workflow: {
        triggers: ['daily_schedule'],
        actions: ['publish_scheduled_content', 'send_newsletter', 'update_analytics'],
        conditions: ['content_ready', 'time_between_9am_5pm']
      },
      status: 'ACTIVE',
      siteId: masterSite.id,
    },
  })

  console.log('✅ Sample automation workflow created')

  console.log('🎉 Master CMS framework enhanced seeding completed!')
  console.log('📊 Enhanced models created:')
  console.log('   - Multi-site configuration and branding')
  console.log('   - Monetization (subscriptions, payments, advertisements)')
  console.log('   - Analytics (traffic, revenue, content, user)')
  console.log('   - AI configuration and automation workflows')
  console.log('   - Content optimization and generation tracking')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 