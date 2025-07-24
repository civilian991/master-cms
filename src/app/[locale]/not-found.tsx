interface NotFoundProps {
  params: { locale: string }
}

const content = {
  en: {
    title: 'Page Not Found',
    message: "The page you're looking for doesn't exist.",
    home: 'Go back home'
  },
  ar: {
    title: 'الصفحة غير موجودة',
    message: 'الصفحة التي تبحث عنها غير موجودة.',
    home: 'العودة إلى الصفحة الرئيسية'
  }
} as const

export default function LocaleNotFound({ params: { locale } }: NotFoundProps) {
  const t = locale === 'ar' ? content.ar : content.en
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-24 text-center" dir={dir}>
      <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
      <p className="text-lg text-muted-foreground mb-8">{t.message}</p>
      <a href={`/${locale}`} className="underline text-primary">
        {t.home}
      </a>
    </div>
  )
}
