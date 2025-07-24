import { redirect } from 'next/navigation'
import { siteConfig } from '@/config/site'

export default function RootPage() {
  // Get the default locale from site config
  const config = siteConfig.getConfig()
  const defaultLocale = config.locale || 'en'
  
  // Redirect to the default locale
  redirect(`/${defaultLocale}`)
}
