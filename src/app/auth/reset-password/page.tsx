'use client'

import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {token ? 'Set New Password' : 'Reset Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {token 
            ? 'Enter your new password below'
            : 'Enter your email to receive a password reset link'
          }
        </p>
      </div>

      <div className="mt-8">
        <PasswordResetForm token={token || undefined} />
      </div>
    </div>
  )
}