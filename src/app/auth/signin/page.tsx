'use client'

import { SignInForm } from '@/components/auth/SignInForm'

// Default to master site ID - in a multi-tenant setup, this would be dynamic
const MASTER_SITE_ID = 'cmdejqybr0000ydghyucq8rk9'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your personalized dashboard and content
        </p>
      </div>

      <div className="mt-8">
        <SignInForm siteId={MASTER_SITE_ID} />
      </div>
    </div>
  )
}