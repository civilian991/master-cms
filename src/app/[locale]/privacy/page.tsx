import React from 'react';
import { Container, Section } from '@/components/ui/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Eye, 
  Database, 
  Cookie,
  Mail,
  Globe,
  Lock,
  UserCheck,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface PrivacyPageProps {
  params: { locale: Locale }
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: January 15, 2024',
      subtitle: 'Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.',
      tableOfContents: 'Table of Contents',
      sections: {
        overview: {
          title: 'Overview',
          icon: Shield,
          content: `Master CMS is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our content management system and related services.

By using our services, you agree to the collection and use of information in accordance with this policy.`
        },
        informationCollection: {
          title: 'Information We Collect',
          icon: Database,
          content: `We collect several types of information from and about users of our services:

**Personal Information:** Name, email address, phone number, and other contact details you provide when creating an account or contacting us.

**Usage Data:** Information about how you use our services, including pages visited, features used, and time spent on our platform.

**Technical Data:** IP address, browser type, device information, operating system, and other technical details automatically collected.

**Content Data:** Articles, media files, and other content you create and store using our platform.

**Communication Data:** Records of your communications with us, including support tickets and feedback.`
        },
        howWeUse: {
          title: 'How We Use Your Information',
          icon: Eye,
          content: `We use the information we collect for various purposes:

**Service Provision:** To provide, maintain, and improve our content management services.

**Account Management:** To create and manage your user account and provide customer support.

**Communication:** To send you important updates, security alerts, and respond to your inquiries.

**Personalization:** To customize your experience and provide relevant content recommendations.

**Analytics:** To understand how our services are used and improve functionality.

**Security:** To monitor for suspicious activity and protect against fraud and abuse.

**Legal Compliance:** To comply with applicable laws and regulations.`
        },
        sharing: {
          title: 'Information Sharing',
          icon: UserCheck,
          content: `We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:

**Service Providers:** We may share information with trusted third-party service providers who assist us in operating our platform, conducting business, or servicing you.

**Legal Requirements:** We may disclose information when required by law, court order, or government request.

**Business Transfers:** In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.

**Consent:** When you explicitly consent to sharing your information for specific purposes.

**Safety:** To protect the rights, property, or safety of Master CMS, our users, or others.`
        },
        cookies: {
          title: 'Cookies and Tracking',
          icon: Cookie,
          content: `We use cookies and similar tracking technologies to enhance your experience:

**Essential Cookies:** Required for basic functionality, such as user authentication and security.

**Analytics Cookies:** Help us understand how our services are used and improve performance.

**Preference Cookies:** Remember your settings and preferences for future visits.

**Marketing Cookies:** Used to deliver relevant advertisements and track campaign effectiveness.

You can control cookie settings through your browser preferences. However, disabling certain cookies may limit functionality.`
        },
        security: {
          title: 'Data Security',
          icon: Lock,
          content: `We implement appropriate technical and organizational measures to protect your personal information:

**Encryption:** Data is encrypted in transit and at rest using industry-standard protocols.

**Access Controls:** Strict access controls ensure only authorized personnel can access your information.

**Regular Audits:** We conduct regular security assessments and vulnerability testing.

**Incident Response:** We have procedures in place to respond quickly to any security incidents.

**Data Minimization:** We collect and retain only the information necessary to provide our services.

While we strive to protect your information, no method of transmission over the internet is 100% secure.`
        },
        retention: {
          title: 'Data Retention',
          icon: Calendar,
          content: `We retain your personal information for as long as necessary to provide our services and fulfill legal obligations:

**Account Data:** Retained while your account is active and for a reasonable period after deletion.

**Content Data:** Retained according to your subscription plan and backup policies.

**Usage Data:** Typically retained for up to 2 years for analytics and improvement purposes.

**Legal Data:** Information required for legal compliance may be retained longer as required by law.

You can request deletion of your personal information at any time, subject to legal and contractual obligations.`
        },
        rights: {
          title: 'Your Privacy Rights',
          icon: Shield,
          content: `Depending on your location, you may have the following rights regarding your personal information:

**Access:** Request a copy of the personal information we hold about you.

**Rectification:** Request correction of inaccurate or incomplete information.

**Erasure:** Request deletion of your personal information in certain circumstances.

**Portability:** Request transfer of your data to another service provider.

**Objection:** Object to certain types of data processing.

**Restriction:** Request limitation of how we process your information.

To exercise these rights, please contact us using the information provided below.`
        },
        international: {
          title: 'International Transfers',
          icon: Globe,
          content: `Master CMS operates globally, and your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

We ensure appropriate safeguards are in place when transferring personal information internationally, including:

**Adequacy Decisions:** Transfers to countries with adequate data protection laws.

**Standard Contractual Clauses:** Legal agreements ensuring protection during transfers.

**Certification Programs:** Participation in recognized data protection frameworks.`
        },
        children: {
          title: 'Children\'s Privacy',
          icon: UserCheck,
          content: `Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

If you are a parent or guardian and believe your child has provided personal information to us, please contact us immediately. We will take steps to remove such information from our systems.`
        },
        changes: {
          title: 'Policy Changes',
          icon: AlertTriangle,
          content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:

**Email Notification:** Sending notice to your registered email address.

**Platform Notice:** Displaying a prominent notice on our platform.

**Updated Date:** Changing the "Last Updated" date at the top of this policy.

Your continued use of our services after any changes indicates acceptance of the updated policy.`
        },
        contact: {
          title: 'Contact Information',
          icon: Mail,
          content: `If you have questions about this Privacy Policy or our data practices, please contact us:

**Email:** privacy@master-cms.com
**Address:** 123 Innovation Drive, San Francisco, CA 94105, United States
**Data Protection Officer:** dpo@master-cms.com

We will respond to your inquiries within 30 days.`
        }
      }
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 15 يناير 2024',
      subtitle: 'خصوصيتك مهمة بالنسبة لنا. تشرح هذه السياسة كيف نجمع معلوماتك الشخصية ونستخدمها ونحميها.',
      tableOfContents: 'جدول المحتويات',
      sections: {
        overview: {
          title: 'نظرة عامة',
          icon: Shield,
          content: `يلتزم Master CMS بحماية خصوصيتك وضمان أمان معلوماتك الشخصية. تشرح سياسة الخصوصية هذه كيف نجمع معلوماتك ونستخدمها ونكشفها ونحميها عند استخدام نظام إدارة المحتوى والخدمات ذات الصلة.

باستخدام خدماتنا، فإنك توافق على جمع واستخدام المعلومات وفقاً لهذه السياسة.`
        },
        informationCollection: {
          title: 'المعلومات التي نجمعها',
          icon: Database,
          content: `نجمع عدة أنواع من المعلومات من مستخدمي خدماتنا وحولهم:

**المعلومات الشخصية:** الاسم وعنوان البريد الإلكتروني ورقم الهاتف وتفاصيل الاتصال الأخرى التي تقدمها عند إنشاء حساب أو الاتصال بنا.

**بيانات الاستخدام:** معلومات حول كيفية استخدامك لخدماتنا، بما في ذلك الصفحات المزارة والميزات المستخدمة والوقت المستغرق على منصتنا.

**البيانات التقنية:** عنوان IP ونوع المتصفح ومعلومات الجهاز ونظام التشغيل والتفاصيل التقنية الأخرى المجمعة تلقائياً.

**بيانات المحتوى:** المقالات وملفات الوسائط والمحتوى الآخر الذي تنشئه وتخزنه باستخدام منصتنا.

**بيانات الاتصال:** سجلات اتصالاتك معنا، بما في ذلك تذاكر الدعم والتعليقات.`
        },
        howWeUse: {
          title: 'كيف نستخدم معلوماتك',
          icon: Eye,
          content: `نستخدم المعلومات التي نجمعها لأغراض مختلفة:

**تقديم الخدمة:** لتقديم خدمات إدارة المحتوى وصيانتها وتحسينها.

**إدارة الحساب:** لإنشاء وإدارة حساب المستخدم وتقديم دعم العملاء.

**التواصل:** لإرسال التحديثات المهمة والتنبيهات الأمنية والرد على استفساراتك.

**التخصيص:** لتخصيص تجربتك وتقديم توصيات المحتوى ذات الصلة.

**التحليلات:** لفهم كيفية استخدام خدماتنا وتحسين الوظائف.

**الأمان:** لمراقبة النشاط المشبوه والحماية من الاحتيال والإساءة.

**الامتثال القانوني:** للامتثال للقوانين واللوائح المعمول بها.`
        },
        sharing: {
          title: 'مشاركة المعلومات',
          icon: UserCheck,
          content: `لا نبيع أو نتاجر أو ننقل معلوماتك الشخصية إلى أطراف ثالثة دون موافقتك، باستثناء الظروف التالية:

**مقدمو الخدمة:** قد نشارك المعلومات مع مقدمي خدمات موثوقين من أطراف ثالثة يساعدوننا في تشغيل منصتنا.

**المتطلبات القانونية:** قد نكشف المعلومات عندما يتطلب القانون أو أمر المحكمة أو طلب الحكومة ذلك.

**عمليات النقل التجارية:** في حالة الاندماج أو الاستحواذ أو بيع الأصول.

**الموافقة:** عندما توافق صراحة على مشاركة معلوماتك لأغراض محددة.

**السلامة:** لحماية حقوق أو ممتلكات أو سلامة Master CMS أو مستخدمينا أو الآخرين.`
        },
        cookies: {
          title: 'ملفات تعريف الارتباط والتتبع',
          icon: Cookie,
          content: `نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتحسين تجربتك:

**ملفات تعريف الارتباط الأساسية:** مطلوبة للوظائف الأساسية مثل مصادقة المستخدم والأمان.

**ملفات تعريف الارتباط التحليلية:** تساعدنا على فهم كيفية استخدام خدماتنا وتحسين الأداء.

**ملفات تعريف ارتباط التفضيلات:** تذكر إعداداتك وتفضيلاتك للزيارات المستقبلية.

**ملفات تعريف الارتباط التسويقية:** تُستخدم لتقديم إعلانات ذات صلة وتتبع فعالية الحملة.

يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال تفضيلات المتصفح.`
        },
        security: {
          title: 'أمان البيانات',
          icon: Lock,
          content: `نطبق تدابير تقنية وتنظيمية مناسبة لحماية معلوماتك الشخصية:

**التشفير:** يتم تشفير البيانات أثناء النقل وفي حالة السكون باستخدام بروتوكولات معيارية في الصناعة.

**ضوابط الوصول:** ضوابط وصول صارمة تضمن أن الموظفين المخولين فقط يمكنهم الوصول إلى معلوماتك.

**عمليات التدقيق المنتظمة:** نجري تقييمات أمنية منتظمة واختبار الثغرات الأمنية.

**الاستجابة للحوادث:** لدينا إجراءات للاستجابة بسرعة لأي حوادث أمنية.

**تقليل البيانات:** نجمع ونحتفظ فقط بالمعلومات اللازمة لتقديم خدماتنا.`
        },
        retention: {
          title: 'الاحتفاظ بالبيانات',
          icon: Calendar,
          content: `نحتفظ بمعلوماتك الشخصية طالما كان ذلك ضرورياً لتقديم خدماتنا والوفاء بالالتزامات القانونية:

**بيانات الحساب:** محتفظ بها أثناء نشاط حسابك ولفترة معقولة بعد الحذف.

**بيانات المحتوى:** محتفظ بها وفقاً لخطة اشتراكك وسياسات النسخ الاحتياطي.

**بيانات الاستخدام:** عادة ما يتم الاحتفاظ بها لمدة تصل إلى عامين للتحليلات وأغراض التحسين.

**البيانات القانونية:** قد يتم الاحتفاظ بالمعلومات المطلوبة للامتثال القانوني لفترة أطول.`
        },
        rights: {
          title: 'حقوق الخصوصية الخاصة بك',
          icon: Shield,
          content: `اعتماداً على موقعك، قد يكون لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية:

**الوصول:** طلب نسخة من المعلومات الشخصية التي نحتفظ بها عنك.

**التصحيح:** طلب تصحيح المعلومات غير الدقيقة أو غير المكتملة.

**المحو:** طلب حذف معلوماتك الشخصية في ظروف معينة.

**قابلية النقل:** طلب نقل بياناتك إلى مقدم خدمة آخر.

**الاعتراض:** الاعتراض على أنواع معينة من معالجة البيانات.

**التقييد:** طلب تقييد كيفية معالجة معلوماتك.`
        },
        international: {
          title: 'النقلات الدولية',
          icon: Globe,
          content: `يعمل Master CMS على نطاق عالمي، وقد يتم نقل معلوماتك ومعالجتها في بلدان أخرى غير بلد إقامتك.

نضمن وجود ضمانات مناسبة عند نقل المعلومات الشخصية دولياً، بما في ذلك:

**قرارات الكفاية:** النقل إلى البلدان التي لديها قوانين حماية بيانات كافية.

**البنود التعاقدية المعيارية:** اتفاقيات قانونية تضمن الحماية أثناء النقل.

**برامج الإصدار:** المشاركة في أطر حماية البيانات المعترف بها.`
        },
        children: {
          title: 'خصوصية الأطفال',
          icon: UserCheck,
          content: `خدماتنا غير مخصصة للأطفال دون سن 13 عاماً. لا نجمع عن قصد معلومات شخصية من الأطفال دون سن 13.

إذا كنت والداً أو وصياً وتعتقد أن طفلك قد قدم معلومات شخصية لنا، يرجى الاتصال بنا فوراً.`
        },
        changes: {
          title: 'تغييرات السياسة',
          icon: AlertTriangle,
          content: `قد نحدث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في ممارساتنا أو المتطلبات القانونية.

سنخطرك بأي تغييرات جوهرية من خلال:

**إشعار البريد الإلكتروني:** إرسال إشعار إلى عنوان بريدك الإلكتروني المسجل.

**إشعار المنصة:** عرض إشعار بارز على منصتنا.

**تاريخ محدث:** تغيير تاريخ "آخر تحديث" في أعلى هذه السياسة.`
        },
        contact: {
          title: 'معلومات الاتصال',
          icon: Mail,
          content: `إذا كان لديك أسئلة حول سياسة الخصوصية هذه أو ممارسات البيانات لدينا، يرجى الاتصال بنا:

**البريد الإلكتروني:** privacy@master-cms.com
**العنوان:** 123 Innovation Drive, San Francisco, CA 94105, United States
**مسؤول حماية البيانات:** dpo@master-cms.com

سنرد على استفساراتك خلال 30 يوماً.`
        }
      }
    }
  }
  
  return content[locale] || content.en
}

export default function PrivacyPage({ params: { locale } }: PrivacyPageProps) {
  const content = getLocalizedContent(locale)
  const isRTL = locale === 'ar'

  const sectionKeys = Object.keys(content.sections) as (keyof typeof content.sections)[]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section background="muted" spacing={{ top: 'lg', bottom: 'lg' }}>
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-6">
              {content.subtitle}
            </p>
            <Badge variant="outline" className="text-sm">
              {content.lastUpdated}
            </Badge>
          </div>
        </Container>
      </Section>
      {/* Table of Contents */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'lg' }}>
        <Container>
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-primary" />
                {content.tableOfContents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectionKeys.map((key, index) => {
                  const section = content.sections[key]
                  const Icon = section.icon
                  
                  return (
                    <a
                      key={key}
                      href={`#${key}`}
                      className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon className="h-4 w-4 mr-3 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {index + 1}. {section.title}
                      </span>
                    </a>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
      {/* Privacy Policy Sections */}
      <Section background="default" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            {sectionKeys.map((key, index) => {
              const section = content.sections[key]
              const Icon = section.icon
              
              return (
                <Card key={key} id={key} className="scroll-mt-24">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <Icon className="h-6 w-6 mr-3 text-primary" />
                      {index + 1}. {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-gray max-w-none text-muted-foreground leading-relaxed whitespace-pre-line"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      {section.content}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Container>
      </Section>
      {/* Contact CTA */}
      <Section background="primary" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Card className="max-w-2xl mx-auto bg-primary-foreground">
            <CardContent className="text-center p-8">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {locale === 'en' ? 'Questions About Privacy?' : 'أسئلة حول الخصوصية؟'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {locale === 'en' 
                  ? 'Our privacy team is here to help. Contact us with any questions or concerns.'
                  : 'فريق الخصوصية لدينا هنا للمساعدة. اتصل بنا بأي أسئلة أو مخاوف.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    {locale === 'en' ? 'Contact Privacy Team' : 'اتصل بفريق الخصوصية'}
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  privacy@master-cms.com
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
} 