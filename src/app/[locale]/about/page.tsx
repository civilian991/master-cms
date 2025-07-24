import React from 'react';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Users, 
  Award, 
  Target,
  Heart,
  TrendingUp,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface AboutPageProps {
  params: { locale: Locale }
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'About Us',
      subtitle: 'Empowering content creators and publishers with AI-driven insights',
      mission: {
        title: 'Our Mission',
        description: 'To revolutionize content management by providing innovative, AI-powered tools that help publishers create, manage, and optimize their content for maximum impact and engagement.'
      },
      vision: {
        title: 'Our Vision',
        description: 'A world where every content creator has access to powerful, intelligent tools that amplify their voice and connect them with their audience in meaningful ways.'
      },
      values: {
        title: 'Our Values',
        items: [
          {
            title: 'Innovation',
            description: 'We constantly push the boundaries of what\'s possible in content management technology.'
          },
          {
            title: 'Quality',
            description: 'We are committed to delivering the highest quality solutions that exceed expectations.'
          },
          {
            title: 'Accessibility',
            description: 'We believe powerful tools should be accessible to creators of all backgrounds and skill levels.'
          },
          {
            title: 'Community',
            description: 'We foster a supportive community where creators can learn, grow, and succeed together.'
          }
        ]
      },
      stats: {
        title: 'Our Impact',
        items: [
          { number: '10K+', label: 'Content Creators' },
          { number: '500K+', label: 'Articles Published' },
          { number: '50+', label: 'Languages Supported' },
          { number: '99.9%', label: 'Uptime Reliability' }
        ]
      },
      team: {
        title: 'Meet Our Team',
        description: 'Passionate professionals dedicated to empowering content creators worldwide.'
      },
      contact: {
        title: 'Get in Touch',
        description: 'Ready to transform your content management experience? We\'d love to hear from you.',
        email: 'hello@master-cms.com',
        phone: '+1 (555) 123-4567',
        getStarted: 'Get Started Today'
      }
    },
    ar: {
      title: 'من نحن',
      subtitle: 'تمكين منشئي المحتوى والناشرين برؤى مدعومة بالذكاء الاصطناعي',
      mission: {
        title: 'مهمتنا',
        description: 'إحداث ثورة في إدارة المحتوى من خلال توفير أدوات مبتكرة مدعومة بالذكاء الاصطناعي تساعد الناشرين في إنشاء وإدارة وتحسين محتواهم لتحقيق أقصى تأثير ومشاركة.'
      },
      vision: {
        title: 'رؤيتنا',
        description: 'عالم يتمتع فيه كل منشئ محتوى بإمكانية الوصول إلى أدوات قوية وذكية تضخم صوتهم وتربطهم بجمهورهم بطرق مفيدة.'
      },
      values: {
        title: 'قيمنا',
        items: [
          {
            title: 'الابتكار',
            description: 'نحن ندفع حدود ما هو ممكن في تكنولوجيا إدارة المحتوى باستمرار.'
          },
          {
            title: 'الجودة',
            description: 'نحن ملتزمون بتقديم حلول عالية الجودة تتجاوز التوقعات.'
          },
          {
            title: 'إمكانية الوصول',
            description: 'نؤمن أن الأدوات القوية يجب أن تكون متاحة للمبدعين من جميع الخلفيات ومستويات المهارة.'
          },
          {
            title: 'المجتمع',
            description: 'نعزز مجتمعاً داعماً حيث يمكن للمبدعين التعلم والنمو والنجاح معاً.'
          }
        ]
      },
      stats: {
        title: 'تأثيرنا',
        items: [
          { number: '+10 آلاف', label: 'منشئ محتوى' },
          { number: '+500 آلاف', label: 'مقال منشور' },
          { number: '+50', label: 'لغة مدعومة' },
          { number: '%99.9', label: 'موثوقية وقت التشغيل' }
        ]
      },
      team: {
        title: 'تعرف على فريقنا',
        description: 'محترفون شغوفون مكرسون لتمكين منشئي المحتوى في جميع أنحاء العالم.'
      },
      contact: {
        title: 'تواصل معنا',
        description: 'مستعد لتحويل تجربة إدارة المحتوى؟ نحب أن نسمع منك.',
        email: 'hello@master-cms.com',
        phone: '+1 (555) 123-4567',
        getStarted: 'ابدأ اليوم'
      }
    }
  }
  
  return content[locale] || content.en
}

export default function AboutPage({ params: { locale } }: AboutPageProps) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section background="primary" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {content.title}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-4xl mx-auto">
              {content.subtitle}
            </p>
          </div>
        </Container>
      </Section>
      {/* Mission & Vision */}
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Grid cols={1} responsive={{ lg: 2 }} gap="xl">
            <GridItem>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Target className="h-6 w-6 mr-3 text-primary" />
                    {content.mission.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {content.mission.description}
                  </p>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Globe className="h-6 w-6 mr-3 text-primary" />
                    {content.vision.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {content.vision.description}
                  </p>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>
        </Container>
      </Section>
      {/* Values */}
      <Section background="muted" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {content.values.title}
            </h2>
          </div>

          <Grid cols={1} responsive={{ md: 2, lg: 4 }} gap="lg">
            {content.values.items.map((value, index) => {
              const icons = [Award, Heart, Users, TrendingUp]
              const Icon = icons[index]
              
              return (
                <GridItem key={index}>
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </GridItem>
              )
            })}
          </Grid>
        </Container>
      </Section>
      {/* Stats */}
      <Section background="primary" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              {content.stats.title}
            </h2>
          </div>

          <Grid cols={2} responsive={{ md: 4 }} gap="lg">
            {content.stats.items.map((stat, index) => (
              <GridItem key={index}>
                <div className="text-center text-primary-foreground">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stat.number}
                  </div>
                  <div className="text-lg opacity-90">
                    {stat.label}
                  </div>
                </div>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Section>
      {/* Team Section */}
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {content.team.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {content.team.description}
            </p>
          </div>

          <Grid cols={1} responsive={{ md: 3 }} gap="lg">
            {[
              { 
                name: locale === 'en' ? 'Sarah Johnson' : 'سارة جونسون', 
                role: locale === 'en' ? 'CEO & Founder' : 'المدير التنفيذي والمؤسس',
                image: '/images/team/sarah.jpg'
              },
              { 
                name: locale === 'en' ? 'Michael Chen' : 'مايكل تشين', 
                role: locale === 'en' ? 'CTO' : 'المدير التقني',
                image: '/images/team/michael.jpg'
              },
              { 
                name: locale === 'en' ? 'Aisha Ahmed' : 'عائشة أحمد', 
                role: locale === 'en' ? 'Head of Design' : 'رئيس التصميم',
                image: '/images/team/aisha.jpg'
              }
            ].map((member, index) => (
              <GridItem key={index}>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {member.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {member.role}
                    </p>
                  </CardContent>
                </Card>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Section>
      {/* Contact CTA */}
      <Section background="muted" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Card className="max-w-4xl mx-auto">
            <CardContent className="text-center p-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {content.contact.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {content.contact.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center justify-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-foreground">{content.contact.email}</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-foreground">{content.contact.phone}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    {locale === 'en' ? 'Contact Us' : 'اتصل بنا'}
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline">
                    {content.contact.getStarted}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
} 