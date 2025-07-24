'use client'

import React, { useState } from 'react';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageCircle,
  Globe,
  Users,
  HelpCircle,
  CheckCircle
} from 'lucide-react';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface ContactPageProps {
  params: { locale: Locale }
}

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  type: 'general' | 'support' | 'sales' | 'partnership'
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'Contact Us',
      subtitle: 'Get in touch with our team. We\'re here to help you succeed.',
      form: {
        title: 'Send us a Message',
        description: 'Fill out the form below and we\'ll get back to you within 24 hours.',
        name: 'Full Name',
        email: 'Email Address',
        subject: 'Subject',
        message: 'Your Message',
        type: 'Inquiry Type',
        types: {
          general: 'General Inquiry',
          support: 'Technical Support',
          sales: 'Sales & Pricing',
          partnership: 'Partnership'
        },
        send: 'Send Message',
        sending: 'Sending...',
        success: 'Message sent successfully!',
        error: 'Failed to send message. Please try again.'
      },
      contact: {
        title: 'Contact Information',
        email: {
          title: 'Email Us',
          general: 'hello@master-cms.com',
          support: 'support@master-cms.com',
          sales: 'sales@master-cms.com'
        },
        phone: {
          title: 'Call Us',
          main: '+1 (555) 123-4567',
          support: '+1 (555) 123-4568'
        },
        office: {
          title: 'Visit Our Office',
          address: '123 Innovation Drive\nSan Francisco, CA 94105\nUnited States'
        },
        hours: {
          title: 'Business Hours',
          weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM PST',
          weekend: 'Saturday - Sunday: Closed'
        }
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          {
            question: 'How quickly can I get started?',
            answer: 'You can start using Master CMS immediately after signing up. Our onboarding process takes less than 5 minutes.'
          },
          {
            question: 'Do you offer technical support?',
            answer: 'Yes! We provide 24/7 technical support via email, chat, and phone for all our users.'
          },
          {
            question: 'Can I migrate my existing content?',
            answer: 'Absolutely. We offer free content migration services and our team will help you transfer your existing content seamlessly.'
          },
          {
            question: 'What languages do you support?',
            answer: 'Master CMS supports over 50 languages with built-in RTL support for Arabic, Hebrew, and other right-to-left languages.'
          }
        ]
      },
      social: {
        title: 'Follow Us',
        description: 'Stay updated with the latest news and updates from Master CMS.'
      }
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: 'تواصل مع فريقنا. نحن هنا لمساعدتك على النجاح.',
      form: {
        title: 'أرسل لنا رسالة',
        description: 'املأ النموذج أدناه وسنعاود الاتصال بك خلال 24 ساعة.',
        name: 'الاسم الكامل',
        email: 'عنوان البريد الإلكتروني',
        subject: 'الموضوع',
        message: 'رسالتك',
        type: 'نوع الاستفسار',
        types: {
          general: 'استفسار عام',
          support: 'الدعم التقني',
          sales: 'المبيعات والتسعير',
          partnership: 'الشراكة'
        },
        send: 'إرسال الرسالة',
        sending: 'جارٍ الإرسال...',
        success: 'تم إرسال الرسالة بنجاح!',
        error: 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.'
      },
      contact: {
        title: 'معلومات الاتصال',
        email: {
          title: 'راسلنا عبر البريد الإلكتروني',
          general: 'hello@master-cms.com',
          support: 'support@master-cms.com',
          sales: 'sales@master-cms.com'
        },
        phone: {
          title: 'اتصل بنا',
          main: '+1 (555) 123-4567',
          support: '+1 (555) 123-4568'
        },
        office: {
          title: 'زر مكتبنا',
          address: '123 Innovation Drive\nSan Francisco, CA 94105\nUnited States'
        },
        hours: {
          title: 'ساعات العمل',
          weekdays: 'الاثنين - الجمعة: 9:00 صباحاً - 6:00 مساءً PST',
          weekend: 'السبت - الأحد: مغلق'
        }
      },
      faq: {
        title: 'الأسئلة المتكررة',
        items: [
          {
            question: 'كم من الوقت يستغرق البدء؟',
            answer: 'يمكنك البدء في استخدام Master CMS فوراً بعد التسجيل. عملية الإعداد تستغرق أقل من 5 دقائق.'
          },
          {
            question: 'هل تقدمون الدعم التقني؟',
            answer: 'نعم! نقدم دعماً تقنياً على مدار 24/7 عبر البريد الإلكتروني والدردشة والهاتف لجميع مستخدمينا.'
          },
          {
            question: 'هل يمكنني نقل المحتوى الحالي؟',
            answer: 'بالطبع. نقدم خدمات نقل المحتوى مجاناً وسيساعدك فريقنا في نقل المحتوى الحالي بسلاسة.'
          },
          {
            question: 'ما هي اللغات التي تدعمونها؟',
            answer: 'يدعم Master CMS أكثر من 50 لغة مع دعم مدمج للكتابة من اليمين إلى اليسار للعربية والعبرية ولغات أخرى.'
          }
        ]
      },
      social: {
        title: 'تابعنا',
        description: 'ابق محدثاً بآخر الأخبار والتحديثات من Master CMS.'
      }
    }
  }
  
  return content[locale] || content.en
}

export default function ContactPage({ params: { locale } }: ContactPageProps) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call
      console.log('Submitting contact form:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '', type: 'general' })
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSubmitStatus('idle'), 5000)
    }
  }

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section background="primary" spacing={{ top: 'lg', bottom: 'lg' }}>
        <Container>
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {content.title}
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              {content.subtitle}
            </p>
          </div>
        </Container>
      </Section>

      {/* Contact Form & Info */}
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Grid cols={1} responsive={{ lg: 2 }} gap="xl">
            {/* Contact Form */}
            <GridItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <MessageCircle className="h-6 w-6 mr-3 text-primary" />
                    {content.form.title}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {content.form.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">{content.form.name}</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">{content.form.email}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="type">{content.form.type}</Label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="general">{content.form.types.general}</option>
                        <option value="support">{content.form.types.support}</option>
                        <option value="sales">{content.form.types.sales}</option>
                        <option value="partnership">{content.form.types.partnership}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subject">{content.form.subject}</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                        className={isRTL ? 'text-right' : ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">{content.form.message}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={6}
                        required
                        className={isRTL ? 'text-right' : ''}
                      />
                    </div>

                    {submitStatus === 'success' && (
                      <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800">{content.form.success}</span>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                        <span className="text-red-800">{content.form.error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {content.form.sending}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {content.form.send}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </GridItem>

            {/* Contact Information */}
            <GridItem>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{content.contact.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email */}
                    <div>
                      <h3 className="flex items-center font-semibold text-foreground mb-3">
                        <Mail className="h-5 w-5 mr-2 text-primary" />
                        {content.contact.email.title}
                      </h3>
                      <div className="space-y-2 text-muted-foreground">
                        <p>General: {content.contact.email.general}</p>
                        <p>Support: {content.contact.email.support}</p>
                        <p>Sales: {content.contact.email.sales}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <h3 className="flex items-center font-semibold text-foreground mb-3">
                        <Phone className="h-5 w-5 mr-2 text-primary" />
                        {content.contact.phone.title}
                      </h3>
                      <div className="space-y-2 text-muted-foreground">
                        <p>Main: {content.contact.phone.main}</p>
                        <p>Support: {content.contact.phone.support}</p>
                      </div>
                    </div>

                    {/* Office */}
                    <div>
                      <h3 className="flex items-center font-semibold text-foreground mb-3">
                        <MapPin className="h-5 w-5 mr-2 text-primary" />
                        {content.contact.office.title}
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {content.contact.office.address}
                      </p>
                    </div>

                    {/* Business Hours */}
                    <div>
                      <h3 className="flex items-center font-semibold text-foreground mb-3">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        {content.contact.hours.title}
                      </h3>
                      <div className="space-y-2 text-muted-foreground">
                        <p>{content.contact.hours.weekdays}</p>
                        <p>{content.contact.hours.weekend}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-primary" />
                      {content.social.title}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {content.social.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <Button variant="outline" size="sm">Twitter</Button>
                      <Button variant="outline" size="sm">LinkedIn</Button>
                      <Button variant="outline" size="sm">GitHub</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </GridItem>
          </Grid>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section background="muted" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {content.faq.title}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {content.faq.items.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="flex items-center font-semibold text-foreground mb-3">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
                    {item.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
} 