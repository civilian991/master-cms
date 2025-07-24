import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding PostgreSQL database with admin user and basic data...')

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

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@master-cms.com' },
    update: {},
    create: {
      email: 'admin@master-cms.com',
      password: hashedPassword,
      name: 'Master Admin',
      role: 'ADMIN',
      locale: 'en',
      siteId: masterSite.id,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)
  console.log('📧 Email: admin@master-cms.com')
  console.log('🔑 Password: admin123')

  // Create default category
  const defaultCategory = await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: {
      nameEn: 'General',
      nameAr: 'عام',
      slug: 'general',
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
      nameEn: 'News',
      nameAr: 'أخبار',
      slug: 'news',
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

  // Create article-tag relationship
  await prisma.articleTag.create({
    data: {
      articleId: sampleArticle.id,
      tagId: defaultTag.id,
    },
  })

  console.log('✅ Sample article created:', sampleArticle.titleEn)
  console.log('🎉 Seeding completed successfully!')
  console.log('')
  console.log('🚀 You can now:')
  console.log('   • Visit http://localhost:3000')
  console.log('   • Login at http://localhost:3000/auth/signin')
  console.log('   • Access admin at http://localhost:3000/admin')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 