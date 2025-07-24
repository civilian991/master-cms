import React from 'react';
import { Container, Section } from '@/components/ui/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  FileText, 
  Shield, 
  CreditCard,
  AlertTriangle,
  Globe,
  Lock,
  UserCheck,
  Gavel,
  Mail
} from 'lucide-react';
import Link from 'next/link';

// Define supported locales
const locales = ['en', 'ar'] as const
type Locale = typeof locales[number]

interface TermsPageProps {
  params: { locale: Locale }
}

// Localized content
const getLocalizedContent = (locale: Locale) => {
  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: January 15, 2024',
      subtitle: 'Please read these terms carefully before using our services. By using Master CMS, you agree to be bound by these terms.',
      tableOfContents: 'Table of Contents',
      sections: {
        acceptance: {
          title: 'Acceptance of Terms',
          icon: Scale,
          content: `By accessing and using Master CMS ("Service", "Platform", "We", "Us", "Our"), you accept and agree to be bound by the terms and provision of this agreement.

These Terms of Service ("Terms") govern your use of our content management system, website, and related services. If you do not agree to abide by the above, please do not use this service.

We reserve the right to change these terms at any time. Your continued use of the platform following any changes indicates acceptance of those changes.`
        },
        description: {
          title: 'Service Description',
          icon: FileText,
          content: `Master CMS is a cloud-based content management system that provides tools for creating, managing, and publishing digital content. Our services include:

**Content Management:** Tools for creating, editing, and organizing articles, media, and other content.

**Publishing Platform:** Capabilities to publish content across multiple channels and formats.

**Analytics:** Insights and reporting on content performance and user engagement.

**Collaboration:** Features enabling team collaboration on content projects.

**Integration:** APIs and tools for integrating with third-party services.

We continuously update and improve our services, and features may change over time.`
        },
        account: {
          title: 'Account Registration',
          icon: UserCheck,
          content: `To use certain features of our service, you must register for an account. When you register, you agree to:

**Accurate Information:** Provide true, accurate, current, and complete information about yourself.

**Account Security:** Maintain the security of your password and identification.

**Authorized Use:** Only use the account for lawful purposes and in accordance with these terms.

**Account Responsibility:** Take responsibility for all activities that occur under your account.

**Notification:** Immediately notify us of any unauthorized use of your account.

You may not create multiple accounts to circumvent restrictions or limitations.`
        },
        usage: {
          title: 'Acceptable Use',
          icon: Shield,
          content: `You agree to use our service only for lawful purposes and in accordance with these Terms. You agree NOT to use the service:

**Illegal Activities:** For any unlawful purpose or to solicit others to perform illegal acts.

**Harassment:** To transmit or procure sending of any advertising or promotional material without consent, including spam.

**Harmful Content:** To transmit any content that is harmful, threatening, abusive, or otherwise objectionable.

**Intellectual Property:** To impersonate or misrepresent your affiliation with any person or entity.

**System Interference:** To interfere with or circumvent the security features of the service.

**Malicious Software:** To introduce viruses, Trojan horses, worms, or other malicious code.

Violation of these terms may result in immediate termination of your account.`
        },
        content: {
          title: 'Content Ownership and Licensing',
          icon: FileText,
          content: `**Your Content:** You retain ownership of all content you create and upload to our platform. By using our service, you grant us:

- A worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute your content.
- The right to use your content for the purpose of providing and improving our services.
- Permission to make your content available to other users as directed by you.

**Our Content:** The Master CMS platform, including its design, features, and functionality, is owned by us and protected by copyright, trademark, and other intellectual property laws.

**Third-Party Content:** You are responsible for ensuring you have the right to use any third-party content uploaded to our platform.

**Content Removal:** We reserve the right to remove content that violates these terms or applicable laws.`
        },
        payment: {
          title: 'Payment Terms',
          icon: CreditCard,
          content: `**Subscription Plans:** Our service is offered through various subscription plans with different features and pricing.

**Payment Processing:** Payments are processed through secure third-party payment processors.

**Billing Cycle:** Subscriptions are billed on a recurring basis (monthly or annually) as selected.

**Price Changes:** We reserve the right to change our pricing with 30 days' notice to existing subscribers.

**Refunds:** Refunds are provided according to our refund policy, available separately.

**Late Payment:** Failure to pay may result in suspension or termination of your account.

**Taxes:** You are responsible for any applicable taxes related to your use of our services.

**Auto-Renewal:** Subscriptions automatically renew unless cancelled before the renewal date.`
        },
        privacy: {
          title: 'Privacy and Data Protection',
          icon: Lock,
          content: `Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference.

**Data Collection:** We collect information you provide and usage data as described in our Privacy Policy.

**Data Security:** We implement appropriate technical and organizational measures to protect your data.

**Data Processing:** We process your data in accordance with applicable privacy laws.

**Third-Party Services:** Some features may integrate with third-party services with their own privacy policies.

**Data Portability:** You can export your data from our platform at any time.

**Data Deletion:** You can request deletion of your account and associated data.

For detailed information about our privacy practices, please review our Privacy Policy.`
        },
        intellectual: {
          title: 'Intellectual Property',
          icon: Gavel,
          content: `**Our Rights:** Master CMS and all related materials are protected by copyright, trademark, and other intellectual property laws.

**Trademarks:** "Master CMS" and related marks are our trademarks. You may not use them without written permission.

**License to Use:** We grant you a limited, non-exclusive, non-transferable license to use our service.

**Restrictions:** You may not:
- Copy, modify, or create derivative works of our platform
- Reverse engineer or attempt to extract source code
- Use our service to compete with us
- Remove or modify any proprietary notices

**DMCA Compliance:** We respond to valid copyright infringement notices under the Digital Millennium Copyright Act.

**Infringement Claims:** If you believe your copyright has been infringed, please contact us with detailed information.`
        },
        termination: {
          title: 'Termination',
          icon: AlertTriangle,
          content: `**By You:** You may terminate your account at any time by following the cancellation process in your account settings.

**By Us:** We may terminate or suspend your account immediately if you:
- Violate these Terms of Service
- Engage in fraudulent or illegal activities
- Fail to pay required fees
- Violate our Acceptable Use Policy

**Effect of Termination:** Upon termination:
- Your right to use the service immediately ceases
- We may delete your account and content after a reasonable notice period
- All provisions that should survive termination will remain in effect

**Data Retention:** We will retain your data for a limited time after termination to allow for account recovery.

**Refunds:** Termination does not entitle you to a refund unless specifically stated in our refund policy.`
        },
        liability: {
          title: 'Limitation of Liability',
          icon: Shield,
          content: `**Service Availability:** We strive to maintain high availability but do not guarantee uninterrupted service.

**Disclaimers:** Our service is provided "as is" without warranties of any kind, either express or implied.

**Limitation:** To the maximum extent permitted by law, we shall not be liable for:
- Indirect, incidental, special, consequential, or punitive damages
- Loss of profits, data, use, goodwill, or other intangible losses
- Damages resulting from unauthorized access to your account

**Maximum Liability:** Our total liability shall not exceed the amount paid by you for the service in the 12 months preceding the claim.

**Indemnification:** You agree to indemnify and hold us harmless from claims arising from your use of the service.

**Force Majeure:** We are not liable for delays or failures due to circumstances beyond our reasonable control.`
        },
        governing: {
          title: 'Governing Law',
          icon: Globe,
          content: `**Jurisdiction:** These Terms shall be governed by and construed in accordance with the laws of the State of California, United States.

**Dispute Resolution:** Any disputes arising from these terms will be resolved through:

1. **Informal Resolution:** First, we encourage you to contact us to try to resolve any disputes informally.

2. **Binding Arbitration:** If informal resolution fails, disputes will be resolved through binding arbitration in accordance with the American Arbitration Association rules.

3. **Class Action Waiver:** You agree to resolve disputes individually and waive the right to participate in class actions.

**Venue:** Any legal proceedings must be brought in the federal or state courts located in San Francisco, California.

**Severability:** If any provision of these terms is found unenforceable, the remaining provisions will remain in effect.`
        },
        changes: {
          title: 'Changes to Terms',
          icon: FileText,
          content: `**Modification Rights:** We reserve the right to modify these Terms of Service at any time.

**Notification:** We will notify you of material changes by:
- Posting a notice on our platform
- Sending an email to your registered address
- Updating the "Last Updated" date at the top of these terms

**Acceptance:** Your continued use of the service after changes take effect constitutes acceptance of the new terms.

**Previous Versions:** Previous versions of these terms are available upon request.

**Effective Date:** Changes become effective 30 days after notification unless otherwise specified.

If you do not agree to the changes, you must stop using the service and may terminate your account.`
        },
        contact: {
          title: 'Contact Information',
          icon: Mail,
          content: `If you have any questions about these Terms of Service, please contact us:

**General Inquiries:**
- Email: legal@master-cms.com
- Address: 123 Innovation Drive, San Francisco, CA 94105, United States

**Legal Department:**
- Email: legal@master-cms.com
- Phone: +1 (555) 123-4567

**Business Hours:** Monday - Friday, 9:00 AM - 6:00 PM PST

**Response Time:** We will respond to your inquiries within 5 business days.

For urgent legal matters, please mark your communication as "URGENT" in the subject line.`
        }
      }
    },
    ar: {
      title: 'شروط الخدمة',
      lastUpdated: 'آخر تحديث: 15 يناير 2024',
      subtitle: 'يرجى قراءة هذه الشروط بعناية قبل استخدام خدماتنا. باستخدام Master CMS، فإنك توافق على الالتزام بهذه الشروط.',
      tableOfContents: 'جدول المحتويات',
      sections: {
        acceptance: {
          title: 'قبول الشروط',
          icon: Scale,
          content: `بوصولك واستخدامك لـ Master CMS ("الخدمة"، "المنصة"، "نحن"، "لنا"، "خاصتنا")، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية.

تحكم شروط الخدمة هذه ("الشروط") استخدامك لنظام إدارة المحتوى والموقع الإلكتروني والخدمات ذات الصلة. إذا كنت لا توافق على الالتزام بما سبق، يرجى عدم استخدام هذه الخدمة.

نحتفظ بالحق في تغيير هذه الشروط في أي وقت. استمرارك في استخدام المنصة بعد أي تغييرات يشير إلى قبولك لتلك التغييرات.`
        },
        description: {
          title: 'وصف الخدمة',
          icon: FileText,
          content: `Master CMS هو نظام إدارة محتوى قائم على السحابة يوفر أدوات لإنشاء وإدارة ونشر المحتوى الرقمي. تشمل خدماتنا:

**إدارة المحتوى:** أدوات لإنشاء وتحرير وتنظيم المقالات والوسائط والمحتوى الآخر.

**منصة النشر:** قدرات لنشر المحتوى عبر قنوات وتنسيقات متعددة.

**التحليلات:** رؤى وتقارير حول أداء المحتوى ومشاركة المستخدمين.

**التعاون:** ميزات تمكن تعاون الفريق في مشاريع المحتوى.

**التكامل:** واجهات برمجة التطبيقات والأدوات للتكامل مع خدمات الطرف الثالث.

نقوم بتحديث وتحسين خدماتنا باستمرار، وقد تتغير الميزات بمرور الوقت.`
        },
        account: {
          title: 'تسجيل الحساب',
          icon: UserCheck,
          content: `لاستخدام ميزات معينة من خدمتنا، يجب عليك التسجيل للحصول على حساب. عند التسجيل، توافق على:

**معلومات دقيقة:** تقديم معلومات صحيحة ودقيقة وحديثة وكاملة عن نفسك.

**أمان الحساب:** الحفاظ على أمان كلمة المرور والهوية الخاصة بك.

**الاستخدام المخول:** استخدام الحساب فقط للأغراض القانونية ووفقاً لهذه الشروط.

**مسؤولية الحساب:** تحمل المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك.

**الإخطار:** إخطارنا فوراً بأي استخدام غير مصرح به لحسابك.

لا يجوز لك إنشاء حسابات متعددة لتجاوز القيود أو التقييدات.`
        },
        usage: {
          title: 'الاستخدام المقبول',
          icon: Shield,
          content: `توافق على استخدام خدمتنا فقط للأغراض القانونية ووفقاً لهذه الشروط. توافق على عدم استخدام الخدمة:

**الأنشطة غير القانونية:** لأي غرض غير قانوني أو لحث الآخرين على أداء أعمال غير قانونية.

**المضايقة:** لإرسال أو الحصول على إرسال أي مواد إعلانية أو ترويجية بدون موافقة.

**المحتوى الضار:** لإرسال أي محتوى ضار أو مهدد أو مسيء أو غير مقبول.

**الملكية الفكرية:** لانتحال شخصية أو تحريف انتمائك لأي شخص أو كيان.

**تدخل النظام:** للتدخل في أو تجاوز ميزات الأمان للخدمة.

**البرامج الضارة:** لإدخال فيروسات أو أحصنة طروادة أو ديدان أو رموز ضارة أخرى.

انتهاك هذه الشروط قد يؤدي إلى إنهاء فوري لحسابك.`
        },
        content: {
          title: 'ملكية المحتوى والترخيص',
          icon: FileText,
          content: `**محتواك:** تحتفظ بملكية جميع المحتوى الذي تنشئه وترفعه إلى منصتنا. باستخدام خدمتنا، تمنحنا:

- ترخيصاً عالمياً وغير حصري وخالٍ من الرسوم لاستخدام ونسخ وإعادة إنتاج ومعالجة وتكييف وتعديل ونشر ونقل وعرض وتوزيع محتواك.
- الحق في استخدام محتواك لغرض تقديم وتحسين خدماتنا.
- الإذن بجعل محتواك متاحاً للمستخدمين الآخرين كما توجهه.

**محتوانا:** منصة Master CMS، بما في ذلك تصميمها وميزاتها ووظائفها، مملوكة لنا ومحمية بحقوق الطبع والنشر والعلامة التجارية وقوانين الملكية الفكرية الأخرى.

**محتوى الطرف الثالث:** أنت مسؤول عن ضمان أن لديك الحق في استخدام أي محتوى طرف ثالث مرفوع إلى منصتنا.

**إزالة المحتوى:** نحتفظ بالحق في إزالة المحتوى الذي ينتهك هذه الشروط أو القوانين المعمول بها.`
        },
        payment: {
          title: 'شروط الدفع',
          icon: CreditCard,
          content: `**خطط الاشتراك:** تُقدم خدمتنا من خلال خطط اشتراك مختلفة بميزات وأسعار مختلفة.

**معالجة الدفع:** تتم معالجة المدفوعات من خلال معالجات دفع آمنة لطرف ثالث.

**دورة الفوترة:** يتم فوترة الاشتراكات على أساس متكرر (شهري أو سنوي) كما هو محدد.

**تغييرات الأسعار:** نحتفظ بالحق في تغيير أسعارنا مع إشعار 30 يوماً للمشتركين الحاليين.

**المبالغ المستردة:** يتم تقديم المبالغ المستردة وفقاً لسياسة الاسترداد الخاصة بنا.

**الدفع المتأخر:** قد يؤدي عدم الدفع إلى تعليق أو إنهاء حسابك.

**الضرائب:** أنت مسؤول عن أي ضرائب معمول بها تتعلق باستخدامك لخدماتنا.

**التجديد التلقائي:** تتجدد الاشتراكات تلقائياً ما لم يتم إلغاؤها قبل تاريخ التجديد.`
        },
        privacy: {
          title: 'الخصوصية وحماية البيانات',
          icon: Lock,
          content: `خصوصيتك مهمة بالنسبة لنا. يحكم جمعنا واستخدامنا للمعلومات الشخصية سياسة الخصوصية الخاصة بنا، والتي يتم دمجها في هذه الشروط بالإشارة.

**جمع البيانات:** نجمع المعلومات التي تقدمها وبيانات الاستخدام كما هو موضح في سياسة الخصوصية الخاصة بنا.

**أمان البيانات:** نطبق تدابير تقنية وتنظيمية مناسبة لحماية بياناتك.

**معالجة البيانات:** نعالج بياناتك وفقاً لقوانين الخصوصية المعمول بها.

**خدمات الطرف الثالث:** قد تتكامل بعض الميزات مع خدمات طرف ثالث لها سياسات خصوصية خاصة بها.

**قابلية نقل البيانات:** يمكنك تصدير بياناتك من منصتنا في أي وقت.

**حذف البيانات:** يمكنك طلب حذف حسابك والبيانات المرتبطة به.

للحصول على معلومات مفصلة حول ممارسات الخصوصية لدينا، يرجى مراجعة سياسة الخصوصية الخاصة بنا.`
        },
        intellectual: {
          title: 'الملكية الفكرية',
          icon: Gavel,
          content: `**حقوقنا:** Master CMS وجميع المواد ذات الصلة محمية بحقوق الطبع والنشر والعلامة التجارية وقوانين الملكية الفكرية الأخرى.

**العلامات التجارية:** "Master CMS" والعلامات ذات الصلة هي علاماتنا التجارية. لا يجوز لك استخدامها بدون إذن كتابي.

**ترخيص الاستخدام:** نمنحك ترخيصاً محدوداً وغير حصري وغير قابل للتحويل لاستخدام خدمتنا.

**القيود:** لا يجوز لك:
- نسخ أو تعديل أو إنشاء أعمال مشتقة من منصتنا
- الهندسة العكسية أو محاولة استخراج الكود المصدري
- استخدام خدمتنا للمنافسة معنا
- إزالة أو تعديل أي إشعارات ملكية

**امتثال DMCA:** نستجيب لإشعارات انتهاك حقوق الطبع والنشر الصحيحة تحت قانون الألفية للحقوق الرقمية.

**مطالبات الانتهاك:** إذا كنت تعتقد أن حقوق الطبع والنشر الخاصة بك قد تم انتهاكها، يرجى الاتصال بنا مع معلومات مفصلة.`
        },
        termination: {
          title: 'الإنهاء',
          icon: AlertTriangle,
          content: `**من قبلك:** يمكنك إنهاء حسابك في أي وقت باتباع عملية الإلغاء في إعدادات حسابك.

**من قبلنا:** قد ننهي أو نعلق حسابك فوراً إذا:
- انتهكت شروط الخدمة هذه
- انخرطت في أنشطة احتيالية أو غير قانونية
- فشلت في دفع الرسوم المطلوبة
- انتهكت سياسة الاستخدام المقبول الخاصة بنا

**أثر الإنهاء:** عند الإنهاء:
- يتوقف حقك في استخدام الخدمة فوراً
- قد نحذف حسابك ومحتواك بعد فترة إشعار معقولة
- تبقى جميع الأحكام التي يجب أن تنجو من الإنهاء سارية

**الاحتفاظ بالبيانات:** سنحتفظ ببياناتك لفترة محدودة بعد الإنهاء للسماح باستعادة الحساب.

**المبالغ المستردة:** الإنهاء لا يخولك لاسترداد ما لم ينص على ذلك تحديداً في سياسة الاسترداد الخاصة بنا.`
        },
        liability: {
          title: 'تحديد المسؤولية',
          icon: Shield,
          content: `**توفر الخدمة:** نسعى للحفاظ على توفر عالي لكننا لا نضمن خدمة بلا انقطاع.

**إخلاء المسؤولية:** يتم تقديم خدمتنا "كما هي" بدون ضمانات من أي نوع، صريحة أو ضمنية.

**التحديد:** إلى أقصى حد يسمح به القانون، لن نكون مسؤولين عن:
- الأضرار غير المباشرة أو العرضية أو الخاصة أو التبعية أو العقابية
- فقدان الأرباح أو البيانات أو الاستخدام أو الشهرة أو الخسائر غير الملموسة الأخرى
- الأضرار الناتجة عن وصول غير مصرح به إلى حسابك

**الحد الأقصى للمسؤولية:** لن تتجاوز مسؤوليتنا الإجمالية المبلغ المدفوع من قبلك للخدمة في الـ12 شهراً التي تسبق المطالبة.

**التعويض:** توافق على تعويضنا وحمايتنا من المطالبات الناشئة عن استخدامك للخدمة.

**القوة القاهرة:** لسنا مسؤولين عن التأخير أو الإخفاقات بسبب ظروف خارجة عن سيطرتنا المعقولة.`
        },
        governing: {
          title: 'القانون الحاكم',
          icon: Globe,
          content: `**الولاية القضائية:** تخضع هذه الشروط لقوانين ولاية كاليفورنيا، الولايات المتحدة، ويتم تفسيرها وفقاً لها.

**حل النزاعات:** ستتم تسوية أي نزاعات ناشئة عن هذه الشروط من خلال:

1. **الحل غير الرسمي:** أولاً، نشجعك على الاتصال بنا لمحاولة حل أي نزاعات بشكل غير رسمي.

2. **التحكيم الملزم:** إذا فشل الحل غير الرسمي، ستتم تسوية النزاعات من خلال التحكيم الملزم وفقاً لقواعد الجمعية الأمريكية للتحكيم.

3. **تنازل عن الدعوى الجماعية:** توافق على حل النزاعات بشكل فردي وتتنازل عن الحق في المشاركة في الدعاوى الجماعية.

**المكان:** يجب رفع أي إجراءات قانونية في المحاكم الفيدرالية أو محاكم الولاية الموجودة في سان فرانسيسكو، كاليفورنيا.

**القابلية للفصل:** إذا وُجد أن أي حكم من هذه الشروط غير قابل للتنفيذ، ستبقى الأحكام المتبقية سارية.`
        },
        changes: {
          title: 'تغييرات الشروط',
          icon: FileText,
          content: `**حقوق التعديل:** نحتفظ بالحق في تعديل شروط الخدمة هذه في أي وقت.

**الإخطار:** سنخطرك بالتغييرات الجوهرية من خلال:
- نشر إشعار على منصتنا
- إرسال بريد إلكتروني إلى عنوانك المسجل
- تحديث تاريخ "آخر تحديث" في أعلى هذه الشروط

**القبول:** استمرارك في استخدام الخدمة بعد دخول التغييرات حيز التنفيذ يشكل قبولاً للشروط الجديدة.

**الإصدارات السابقة:** الإصدارات السابقة من هذه الشروط متاحة عند الطلب.

**تاريخ السريان:** تصبح التغييرات سارية بعد 30 يوماً من الإخطار ما لم يُحدد خلاف ذلك.

إذا كنت لا توافق على التغييرات، يجب عليك التوقف عن استخدام الخدمة وقد تنهي حسابك.`
        },
        contact: {
          title: 'معلومات الاتصال',
          icon: Mail,
          content: `إذا كان لديك أي أسئلة حول شروط الخدمة هذه، يرجى الاتصال بنا:

**الاستفسارات العامة:**
- البريد الإلكتروني: legal@master-cms.com
- العنوان: 123 Innovation Drive, San Francisco, CA 94105, United States

**القسم القانوني:**
- البريد الإلكتروني: legal@master-cms.com
- الهاتف: +1 (555) 123-4567

**ساعات العمل:** الاثنين - الجمعة، 9:00 صباحاً - 6:00 مساءً PST

**وقت الاستجابة:** سنرد على استفساراتك خلال 5 أيام عمل.

للمسائل القانونية العاجلة، يرجى وضع علامة "عاجل" في موضوع رسالتك.`
        }
      }
    }
  }
  
  return content[locale] || content.en
}

export default function TermsPage({ params: { locale } }: TermsPageProps) {
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
                <FileText className="h-5 w-5 mr-2 text-primary" />
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
      {/* Terms Sections */}
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
      {/* Legal Contact CTA */}
      <Section background="primary" spacing={{ top: 'xl', bottom: 'xl' }}>
        <Container>
          <Card className="max-w-2xl mx-auto bg-primary-foreground">
            <CardContent className="text-center p-8">
              <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {locale === 'en' ? 'Legal Questions?' : 'أسئلة قانونية؟'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {locale === 'en' 
                  ? 'Our legal team is available to help clarify any terms or answer your questions.'
                  : 'فريقنا القانوني متاح للمساعدة في توضيح أي شروط أو الإجابة على أسئلتك.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    {locale === 'en' ? 'Contact Legal Team' : 'اتصل بالفريق القانوني'}
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  legal@master-cms.com
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
} 